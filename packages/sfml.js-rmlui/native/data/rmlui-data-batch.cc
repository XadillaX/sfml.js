// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/data/rmlui-data-batch.h"

#include <sfml-js-interop.h>

#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <memory>
#include <utility>
#include <vector>

#include "native/data/rmlui-data.h"
#include "native/dom/elements/rmlui-element-commands.h"
#include "native/runtime/rmlui-state.h"
#include "vendor/rmlui/Source/Core/DataExpression.h"
#include "vendor/rmlui/Source/Core/DataModel.h"
#include "vendor/rmlui/Source/Core/DataView.h"

namespace sfmlrmlui {
namespace {

struct BatchStorage {
  explicit BatchStorage(uint32_t capacity) : slots(capacity), inputs(capacity) {
    auto& counts = State().data_diagnostics;
    counts.Record(&DataDiagnostics::data_batch_storage_allocations);
    counts.Record(&DataDiagnostics::data_batch_storage_bytes,
                  capacity * (sizeof(uint32_t) + sizeof(double)));
  }
  std::vector<uint32_t> slots;
  std::vector<double> inputs;
};

}  // namespace

struct DataBatchState {
  std::weak_ptr<DataModelState> model;
  std::shared_ptr<DataCallbacks> callbacks;
  std::shared_ptr<BatchStorage> storage;
  Rml::Vector<Rml::DataView*> views;
  std::array<v8::Global<v8::ArrayBuffer>, 2> buffers;
  v8::Global<v8::Object> commands;
  v8::Global<v8::Object> handle;
  v8::Global<v8::Object> mapping;
  uint32_t root_index{0};
  uint64_t generation{0};
  bool enabled{true};
  bool busy{false};
};

namespace {

using BatchHandle = sfmljs::SharedHandle<DataBatchState>;

void Own(v8::Local<v8::Object> object,
         const char* name,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(name).ToLocalChecked(), value)
      .FromJust();
}

class BatchScope final {
 public:
  explicit BatchScope(DataBatchState* state)
      : state_(state),
        events_(State().event_elements.size()),
        elements_(State().active_elements.size()) {
    state_->busy = true;
  }
  ~BatchScope() {
    State().active_elements.resize(elements_);
    State().event_elements.resize(events_);
    state_->busy = false;
  }

 private:
  DataBatchState* state_;
  size_t events_;
  size_t elements_;
};

class BatchView final : public Rml::DataView {
 public:
  BatchView(Rml::Element* element,
            int offset,
            uint32_t slot,
            const Rml::String& expression,
            const std::shared_ptr<DataBatchState>& owner)
      : Rml::DataView(element, offset),
        owner_(owner),
        slot_(slot),
        expression_(expression) {}

  ~BatchView() override {
    if (const auto owner = owner_.lock()) {
      owner->views[slot_] = nullptr;
    }
  }

  void Release() override { delete this; }

  bool Initialize(Rml::DataModel& model,
                  Rml::Element* element,
                  const Rml::String& expression,
                  const Rml::String& modifier) override {
    return expression_.Parse({&model, element}, false);
  }

  Rml::StringList GetVariableNameList() const override {
    return expression_.GetVariableNameList();
  }

  const void* GetBatchKeyForBinding() const override {
    const auto owner = owner_.lock();
    return owner && owner->enabled ? owner.get() : nullptr;
  }

  bool Update(Rml::DataModel& model) override {
    Rml::DataView* view = this;
    return UpdateBatchForBinding(model, &view, 1);
  }

  bool UpdateBatchForBinding(Rml::DataModel& model,
                             Rml::DataView* const* views,
                             size_t count) override {
    const auto owner = owner_.lock();
    if (!owner || !owner->enabled || !CanInvokeCallback()) {
      return false;
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    const bool changed = UpdateGroup(owner, &model, views, count);
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
      return false;
    }
    return changed;
  }

 private:
  bool Read(Rml::DataModel* model, double* output) {
    Rml::Variant value;
    if (!expression_.Run({model, GetElement()}, value)) {
      Nan::ThrowRangeError("Batch expression must produce a finite number");
      return false;
    }
    // Core's string converter can silently turn malformed text into zero.
    // This protocol accepts numeric expression results, never textual values.
    switch (value.GetType()) {
      case Rml::Variant::BOOL:
      case Rml::Variant::BYTE:
      case Rml::Variant::CHAR:
      case Rml::Variant::FLOAT:
      case Rml::Variant::DOUBLE:
      case Rml::Variant::INT:
      case Rml::Variant::INT64:
      case Rml::Variant::UINT:
      case Rml::Variant::UINT64:
        break;
      default:
        Nan::ThrowRangeError("Batch expression must produce a finite number");
        return false;
    }
    if (!value.GetInto(*output) || !std::isfinite(*output)) {
      Nan::ThrowRangeError("Batch expression must produce a finite number");
      return false;
    }
    return State().callback_exception.IsEmpty();
  }

  static bool UpdateGroup(const std::shared_ptr<DataBatchState>& owner,
                          Rml::DataModel* model,
                          Rml::DataView* const* views,
                          size_t count) {
    if (owner->busy) {
      Nan::ThrowError("Cannot recursively update an active data batch");
      return false;
    }
    const auto model_owner = owner->model.lock();
    if (!DataModelIsValid(model_owner) || model_owner->value != model ||
        owner->commands.IsEmpty()) {
      Nan::ThrowError("Data batch model is no longer valid");
      return false;
    }
    for (const auto& buffer : owner->buffers) {
      if (buffer.IsEmpty() ||
          buffer.Get(v8::Isolate::GetCurrent())->WasDetached()) {
        Nan::ThrowTypeError("Data batch mapped buffer was detached");
        return false;
      }
    }
    auto commands = owner->commands.Get(v8::Isolate::GetCurrent());
    if (!PrepareElementCommands(commands)) {
      return false;
    }
    BatchScope active(owner.get());
    // Protect every target before expression evaluation can invoke getters.
    for (size_t i = 0; i < count; ++i) {
      if (views[i]->IsValid()) {
        State().event_elements.push_back(views[i]->GetElement());
      }
    }
    uint32_t rows = 0;
    for (size_t i = 0; i < count; ++i) {
      if (!views[i]->IsValid()) {
        continue;
      }
      auto* view = static_cast<BatchView*>(views[i]);
      auto* element = view->GetElement();
      if (element->GetDataModel() != model) {
        Nan::ThrowError("Data batch element changed model");
        return false;
      }
      double value = 0;
      if (!view->Read(model, &value)) {
        return false;
      }
      owner->storage->slots[rows] = view->slot_;
      owner->storage->inputs[rows++] = value;
      State().data_diagnostics.Record(&DataDiagnostics::data_batch_input_rows);
    }
    if (!rows) {
      return false;
    }
    uint32_t commands_count = 0;
    State().data_diagnostics.Record(&DataDiagnostics::data_batch_intervals);
    v8::Local<v8::Value> argument = Nan::New(rows);
    const bool success =
        InvokeDataCallback(owner->callbacks, 0, 1, &argument, [&](auto result) {
          if (!result->IsUint32()) {
            Nan::ThrowRangeError("Data batch must return a command count");
            return false;
          }
          commands_count = Nan::To<uint32_t>(result).FromJust();
          for (const auto& buffer : owner->buffers) {
            if (buffer.IsEmpty() ||
                buffer.Get(v8::Isolate::GetCurrent())->WasDetached()) {
              Nan::ThrowTypeError("Data batch mapped buffer was detached");
              return false;
            }
          }
          return ConsumeElementCommands(commands, commands_count);
        });
    return success && commands_count != 0;
  }

  std::weak_ptr<DataBatchState> owner_;
  uint32_t slot_;
  Rml::DataExpression expression_;
};

bool ReadConfiguration(const Nan::FunctionCallbackInfo<v8::Value>& info,
                       uint32_t* size,
                       int* offset,
                       uint32_t* capacity) {
  if (!info[1]->IsArray() || !info[2]->IsArray() || !info[3]->IsFunction()) {
    Nan::ThrowTypeError("Expected batch elements, expressions and callback");
    return false;
  }
  *size = info[1].As<v8::Array>()->Length();
  if (*size != info[2].As<v8::Array>()->Length()) {
    Nan::ThrowRangeError("Batch elements and expressions need matching length");
    return false;
  }
  if (!info[4]->IsInt32() || !info[5]->IsUint32()) {
    Nan::ThrowRangeError("Expected a batch sort offset and command capacity");
    return false;
  }
  *offset = Nan::To<int32_t>(info[4]).FromJust();
  *capacity = Nan::To<uint32_t>(info[5]).FromJust();
  if (*offset < -1000 || *offset > 999 || *capacity > (1u << 26) ||
      *size > (1u << 26)) {
    Nan::ThrowRangeError("Batch sort offset or capacity exceeds its limit");
    return false;
  }
  return true;
}

NAN_METHOD(CreateDataBatch) {
  uint32_t size = 0;
  uint32_t capacity = 0;
  int offset = 0;
  if (!ReadConfiguration(info, &size, &offset, &capacity)) {
    return;
  }
  const auto model = DataModelOf(info[0]);
  if (!model) {
    return;
  }
  auto owner = std::make_shared<DataBatchState>();
  owner->model = model;
  owner->storage = std::make_shared<BatchStorage>(size);
  owner->generation = State().generation;
  owner->views.resize(size);
  Rml::Vector<Rml::DataViewPtr> views;
  views.reserve(size);
  auto elements = info[1].As<v8::Array>();
  auto expressions = info[2].As<v8::Array>();
  auto snapshot = Nan::New<v8::Array>(size);
  for (uint32_t i = 0; i < size; ++i) {
    v8::Local<v8::Value> element_input;
    v8::Local<v8::Value> expression;
    if (!Nan::Get(elements, i).ToLocal(&element_input) ||
        !Nan::Get(expressions, i).ToLocal(&expression)) {
      return;
    }
    auto* element = ElementOf(element_input);
    if (!element) {
      return;
    }
    if (!DataModelIsValid(model)) {
      return Nan::ThrowError("Data batch model is no longer valid");
    }
    if (element->GetDataModel() != model->value) {
      return Nan::ThrowError("Data batch element belongs to another model");
    }
    if (!expression->IsString()) {
      return Nan::ThrowTypeError("Expected a batch expression string");
    }
    Nan::Set(snapshot, i, element_input).FromJust();
    Nan::Utf8String text(expression);
    auto view = Rml::DataViewPtr(new BatchView(
        element, offset, i, Rml::String(*text, text.length()), owner));
    if (!view->Initialize(*model->value, element, {}, {})) {
      return Nan::ThrowTypeError("Invalid data batch expression");
    }
    owner->views[i] = view.get();
    views.push_back(std::move(view));
  }
  const auto context = model->context.lock();
  v8::Local<v8::Object> commands;
  if (!CreateElementCommandMapping(
           WrapContext(context->context), snapshot, capacity)
           .ToLocal(&commands)) {
    return;
  }
  // Array accessors can mutate previously checked slots or remove the model.
  if (!DataModelIsValid(model)) {
    return Nan::ThrowError("Data batch model is no longer valid");
  }
  for (const auto& view : views) {
    if (!view->IsValid() ||
        view->GetElement()->GetDataModel() != model->value) {
      return Nan::ThrowError("Data batch element changed model");
    }
  }
  auto result = Nan::New<v8::Object>();
  owner->mapping.Reset(v8::Isolate::GetCurrent(), result);
  owner->mapping.SetWeak();
  auto handle = BatchHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  v8::Local<v8::Value> command_handle;
  if (!Nan::Get(commands, Nan::New("handle").ToLocalChecked())
           .ToLocal(&command_handle)) {
    return;
  }
  owner->commands.Reset(v8::Isolate::GetCurrent(),
                        command_handle.As<v8::Object>());
  owner->commands.SetWeak();
  Own(result, "handle", handle);
  Own(result, "commands", commands);
  auto slots = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                 owner->storage,
                                 owner->storage->slots.data(),
                                 size * sizeof(uint32_t));
  auto inputs = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                  owner->storage,
                                  owner->storage->inputs.data(),
                                  size * sizeof(double));
  Own(result, "slots", v8::Uint32Array::New(slots, 0, size));
  Own(result, "inputs", v8::Float64Array::New(inputs, 0, size));
  owner->buffers[0].Reset(v8::Isolate::GetCurrent(), slots);
  owner->buffers[1].Reset(v8::Isolate::GetCurrent(), inputs);
  for (auto& buffer : owner->buffers) {
    buffer.SetWeak();
  }
  // Original identities survive Native-bypass transfers and subsequent GC.
  auto roots = Nan::New<v8::Array>(3);
  Nan::Set(roots, 0, slots).FromJust();
  Nan::Set(roots, 1, inputs).FromJust();
  Nan::Set(roots, 2, commands).FromJust();
  Nan::SetPrivate(handle, Nan::New("rml.batch.roots").ToLocalChecked(), roots)
      .FromJust();
  Nan::SetPrivate(handle, Nan::New("rml.batch.model").ToLocalChecked(), info[0])
      .FromJust();
  owner->callbacks = std::make_shared<DataCallbacks>();
  owner->callbacks->diagnostic_category = DiagnosticCallback::kDataFactory;
  AddDataCallback(owner->callbacks, info[3]);
  Nan::SetPrivate(result,
                  Nan::New("rml.batch.functions").ToLocalChecked(),
                  DataCallbackArray(owner->callbacks))
      .FromJust();
  owner->callbacks->functions.SetWeak();
  owner->root_index = AddDataCallback(model->callbacks, result);
  model->batches.push_back(owner);
  for (auto& view : views) {
    model->value->AddView(std::move(view));
  }
  info.GetReturnValue().Set(result);
}

void Invalidate(const std::shared_ptr<DataBatchState>& owner) {
  owner->enabled = false;
  owner->commands.Reset();
  owner->callbacks->functions.Reset();
  if (!owner->mapping.IsEmpty()) {
    Nan::SetPrivate(owner->mapping.Get(v8::Isolate::GetCurrent()),
                    Nan::New("rml.batch.functions").ToLocalChecked(),
                    Nan::Undefined())
        .FromJust();
  }
  if (!owner->handle.IsEmpty()) {
    auto handle = owner->handle.Get(v8::Isolate::GetCurrent());
    for (const auto* key : {"rml.batch.roots", "rml.batch.model"}) {
      Nan::SetPrivate(handle, Nan::New(key).ToLocalChecked(), Nan::Undefined())
          .FromJust();
    }
  }
}

NAN_METHOD(ReleaseDataBatch) {
  auto* handle = BatchHandle::From(info[0]);
  if (!handle) {
    return;
  }
  const auto owner = handle->owner();
  const auto model = owner->model.lock();
  if (!owner->enabled || owner->generation != State().generation ||
      !DataModelIsValid(model)) {
    return Nan::ThrowError("Data batch is released or no longer valid");
  }
  if (owner->busy) {
    return Nan::ThrowError("Cannot release an active data batch");
  }
  Rml::Vector<Rml::DataView*> views;
  for (auto* view : owner->views) {
    if (view) {
      views.push_back(view);
    }
  }
  model->value->RemoveViewsForBinding(views);
  Nan::Set(
      DataCallbackArray(model->callbacks), owner->root_index, Nan::Undefined())
      .FromJust();
  Invalidate(owner);
  std::erase(model->batches, owner);
  State().data_ownership_dirty = true;
}

}  // namespace

void InvalidateDataBatches(const std::shared_ptr<DataModelState>& model) {
  for (const auto& owner : model->batches) {
    Invalidate(owner);
  }
  model->batches.clear();
}

NAN_MODULE_INIT(InitializeRmlDataBatch) {
  SetRuntimeMethod<CreateDataBatch, true>(target, "createDataBatch");
  SetRuntimeMethod<ReleaseDataBatch, true>(target, "releaseDataBatch");
}

}  // namespace sfmlrmlui
