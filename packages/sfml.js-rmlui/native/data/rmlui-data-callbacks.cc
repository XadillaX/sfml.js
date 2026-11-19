// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/DataModelHandle.h>
#include <RmlUi/Core/Event.h>
#include <nan.h>

#include <algorithm>
#include <memory>
#include <utility>

#include "native/data/rmlui-data.h"
#include "native/events/rmlui-events.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

class DataCallbackScope final {
 public:
  DataCallbackScope(DataCallbacks* owner,
                    uint32_t index,
                    bool data_event = false)
      : owner_(owner),
        data_event_(data_event),
        previous_event_depth_(State().data_event_callback_depth) {
    ++owner_->active;
    owner_->active_functions.push_back(index);
    ++State().callback_depth;
    if (data_event_) {
      State().data_event_callback_depth = State().callback_depth;
    } else {
      ++State().data_value_callback_depth;
    }
  }
  ~DataCallbackScope() {
    if (data_event_) {
      State().data_event_callback_depth = previous_event_depth_;
    } else {
      --State().data_value_callback_depth;
    }
    --State().callback_depth;
    owner_->active_functions.pop_back();
    --owner_->active;
  }

 private:
  DataCallbacks* owner_;
  bool data_event_;
  unsigned previous_event_depth_;
};

bool Invoke(const std::shared_ptr<DataCallbacks>& owner,
            uint32_t index,
            int argc,
            v8::Local<v8::Value>* argv,
            v8::Local<v8::Value>* result,
            bool data_event = false,
            DiagnosticCallback category = DiagnosticCallback::kDataDefinition) {
  if (!CanInvokeCallback() || owner->functions.IsEmpty()) {
    return false;
  }
  if (std::find(owner->active_functions.begin(),
                owner->active_functions.end(),
                index) != owner->active_functions.end()) {
    Nan::ThrowError("Cannot recursively invoke the same data callback");
    return false;
  }
  const auto callback =
      Nan::Get(DataCallbackArray(owner), index).ToLocalChecked();
  if (!callback->IsFunction()) {
    return false;
  }
  DataCallbackScope scope(owner.get(), index, data_event);
  RecordDiagnosticCallback(category);
  return callback.As<v8::Function>()
      ->Call(Nan::GetCurrentContext(), Nan::Undefined(), argc, argv)
      .ToLocal(result);
}

bool ReadName(v8::Local<v8::Value> input, Rml::String* name) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a data callback name");
    return false;
  }
  Nan::Utf8String text(input);
  name->assign(*text, text.length());
  return true;
}

v8::MaybeLocal<v8::Array> ArgumentsToJs(const Rml::VariantList& arguments) {
  auto values = Nan::New<v8::Array>(static_cast<int>(arguments.size()));
  for (uint32_t i = 0; i < arguments.size(); ++i) {
    v8::Local<v8::Value> value;
    if (!VariantToJs(arguments[i]).ToLocal(&value)) {
      return {};
    }
    Nan::Set(values, i, value).FromJust();
  }
  return values;
}

NAN_METHOD(BindFunc) {
  Rml::String name;
  if (!ReadName(info[1], &name)) {
    return;
  }
  if (!info[2]->IsFunction() ||
      !(info[3]->IsUndefined() || info[3]->IsFunction())) {
    return Nan::ThrowTypeError("Expected getter and optional setter functions");
  }
  auto model = DataModelOf(info[0]);
  if (!model) {
    return;
  }
  const auto callbacks = model->callbacks;
  const auto get_index = AddDataCallback(callbacks, info[2]);
  const auto set_index = AddDataCallback(callbacks, info[3]);
  const std::weak_ptr<DataCallbacks> weak = callbacks;
  Rml::DataGetFunc get = [weak, get_index](Rml::Variant& value) {
    auto owner = weak.lock();
    if (!owner || !CanInvokeCallback()) {
      return;
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    {
      // Test recursion before marking this entry active.
      if (std::find(owner->active_functions.begin(),
                    owner->active_functions.end(),
                    get_index) != owner->active_functions.end()) {
        Nan::ThrowError("Cannot recursively invoke the same data callback");
      } else {
        v8::Local<v8::Value> result;
        if (Invoke(owner,
                   get_index,
                   0,
                   nullptr,
                   &result,
                   false,
                   DiagnosticCallback::kDataGetter)) {
          DataCallbackScope scope(owner.get(), get_index);
          ReadOwnedDataVariant(result, &value);
        }
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
  };
  Rml::DataSetFunc set;
  if (info[3]->IsFunction()) {
    set = [weak, set_index](const Rml::Variant& value) {
      auto owner = weak.lock();
      if (!owner || !CanInvokeCallback()) {
        return;
      }
      Nan::HandleScope handles;
      Nan::TryCatch caught;
      v8::Local<v8::Value> argument;
      if (VariantToJs(value).ToLocal(&argument)) {
        v8::Local<v8::Value> ignored;
        Invoke(owner,
               set_index,
               1,
               &argument,
               &ignored,
               false,
               DiagnosticCallback::kDataSetter);
      }
      if (caught.HasCaught()) {
        CaptureCallbackException(caught.Exception());
      }
    };
  }
  const bool bound =
      model->constructor.BindFunc(name, std::move(get), std::move(set));
  if (!bound) {
    auto functions = DataCallbackArray(callbacks);
    Nan::Set(functions, get_index, Nan::Undefined()).FromJust();
    Nan::Set(functions, set_index, Nan::Undefined()).FromJust();
  }
  info.GetReturnValue().Set(bound);
}

void RegisterTransformFor(const std::shared_ptr<DataRegisterState>& owner,
                          const Rml::String& name,
                          v8::Local<v8::Value> callback) {
  auto* native = owner->value->GetTransformFuncRegister();
  if (native->Contains(name)) {
    // Preserve upstream's first registration and diagnostic. No host owner
    // is needed for a function the native register will immediately reject.
    native->Register(name,
                     [](const Rml::VariantList&) { return Rml::Variant{}; });
    return;
  }
  const auto callbacks = owner->callbacks;
  const auto index = AddDataCallback(callbacks, callback);
  owner->transforms[name] = index;
  const std::weak_ptr<DataCallbacks> weak = callbacks;
  native->Register(name, [weak, index](const Rml::VariantList& arguments) {
    Rml::Variant value;
    auto owner = weak.lock();
    if (!owner || !CanInvokeCallback()) {
      return value;
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    v8::Local<v8::Array> values;
    if (ArgumentsToJs(arguments).ToLocal(&values)) {
      v8::Local<v8::Value> argument = values;
      v8::Local<v8::Value> result;
      if (Invoke(owner,
                 index,
                 1,
                 &argument,
                 &result,
                 false,
                 DiagnosticCallback::kDataTransform)) {
        DataCallbackScope scope(owner.get(), index);
        ReadOwnedDataVariant(result, &value);
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
    return value;
  });
}

NAN_METHOD(RegisterTransform) {
  Rml::String name;
  if (!ReadName(info[1], &name)) {
    return;
  }
  if (!info[2]->IsFunction()) {
    return Nan::ThrowTypeError("Expected a transform function");
  }
  if (auto model = DataModelOf(info[0])) {
    RegisterTransformFor(model->type_register, name, info[2]);
  }
}

NAN_METHOD(RegisterDirectTransform) {
  Rml::String name;
  if (!ReadName(info[1], &name)) {
    return;
  }
  if (!info[2]->IsFunction()) {
    return Nan::ThrowTypeError("Expected a transform function");
  }
  if (auto owner = DataRegisterOf(info[0])) {
    RegisterTransformFor(owner, name, info[2]);
  }
}

NAN_METHOD(CallTransform) {
  Rml::String name;
  if (!ReadName(info[1], &name)) {
    return;
  }
  if (!info[2]->IsArray()) {
    return Nan::ThrowTypeError("Expected a transform argument array");
  }
  const auto input = info[2].As<v8::Array>();
  Rml::VariantList arguments;
  arguments.reserve(input->Length());
  for (uint32_t i = 0; i < input->Length(); ++i) {
    v8::Local<v8::Value> value;
    Rml::Variant converted;
    if (!Nan::Get(input, i).ToLocal(&value) ||
        !ReadOwnedDataVariant(value, &converted)) {
      return;
    }
    arguments.push_back(std::move(converted));
  }
  // Accessors in the argument array may invalidate a borrowed register.
  auto owner = DataRegisterOf(info[0]);
  if (!owner) {
    return;
  }
  Rml::Variant output;
  const bool success =
      owner->value->GetTransformFuncRegister()->Call(name, arguments, output);
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  v8::Local<v8::Value> value;
  if (!VariantToJs(output).ToLocal(&value)) {
    return;
  }
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("success").ToLocalChecked(), Nan::New(success))
      .FromJust();
  Nan::Set(result, Nan::New("value").ToLocalChecked(), value).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(BindEvent) {
  Rml::String name;
  if (!ReadName(info[1], &name)) {
    return;
  }
  if (!info[2]->IsFunction()) {
    return Nan::ThrowTypeError("Expected a data event callback");
  }
  auto model = DataModelOf(info[0]);
  if (!model) {
    return;
  }
  const auto callbacks = model->callbacks;
  const auto index = AddDataCallback(callbacks, info[2]);
  const std::weak_ptr<DataCallbacks> weak = callbacks;
  const std::weak_ptr<DataModelState> weak_model = model;
  const bool bound = model->constructor.BindEventCallback(
      name,
      [weak, weak_model, index](Rml::DataModelHandle,
                                Rml::Event& event,
                                const Rml::VariantList& arguments) {
        auto owner = weak.lock();
        auto model = weak_model.lock();
        if (!owner || !model || !CanInvokeCallback()) {
          return;
        }
        Nan::HandleScope handles;
        Nan::TryCatch caught;
        CallbackScope event_scope(event);
        auto lease = std::make_shared<EventState>();
        lease->event = &event;
        lease->generation = State().generation;
        v8::Local<v8::Object> snapshot;
        v8::Local<v8::Array> values;
        if (WrapEventData(event, EventHandle::Create(lease))
                .ToLocal(&snapshot) &&
            ArgumentsToJs(arguments).ToLocal(&values)) {
          v8::Local<v8::Value> argv[] = {
              WrapDataModel(model), snapshot, values};
          v8::Local<v8::Value> ignored;
          Invoke(owner,
                 index,
                 3,
                 argv,
                 &ignored,
                 true,
                 DiagnosticCallback::kDataEvent);
        }
        lease->event = nullptr;
        if (caught.HasCaught()) {
          CaptureCallbackException(caught.Exception());
        }
      });
  if (!bound) {
    Nan::Set(DataCallbackArray(callbacks), index, Nan::Undefined()).FromJust();
  }
  info.GetReturnValue().Set(bound);
}

}  // namespace

bool InvokeDataCallback(
    const std::shared_ptr<DataCallbacks>& owner,
    uint32_t index,
    int argc,
    v8::Local<v8::Value>* argv,
    const std::function<bool(v8::Local<v8::Value>)>& consume) {
  Nan::HandleScope handles;
  Nan::TryCatch caught;
  bool success = false;
  v8::Local<v8::Value> result;
  if (Invoke(owner,
             index,
             argc,
             argv,
             &result,
             false,
             owner->diagnostic_category)) {
    DataCallbackScope scope(owner.get(), index);
    success = consume(result);
  }
  if (caught.HasCaught()) {
    CaptureCallbackException(caught.Exception());
    return false;
  }
  return success && State().callback_exception.IsEmpty();
}

bool ReadOwnedDataVariant(v8::Local<v8::Value> input, Rml::Variant* value) {
  State().data_diagnostics.Record(&DataDiagnostics::data_variant_from_js);
  if (ElementHandle::TryFrom(input)) {
    Nan::ThrowTypeError(
        "Data Variant must own its value, not borrow a pointer");
    return false;
  }
  Rml::Variant converted;
  if (!VariantFromJs(input, &converted)) {
    return false;
  }
  if (converted.GetType() == Rml::Variant::SCRIPTINTERFACE ||
      converted.GetType() == Rml::Variant::VOIDPTR) {
    Nan::ThrowTypeError(
        "Data Variant must own its value, not borrow a pointer");
    return false;
  }
  *value = std::move(converted);
  return true;
}

NAN_MODULE_INIT(InitializeRmlDataCallbacks) {
  SetRuntimeMethod<BindFunc>(target, "dataModelBindFunc");
  SetRuntimeMethod<RegisterTransform>(target, "dataModelRegisterTransformFunc");
  SetRuntimeMethod<RegisterDirectTransform>(target, "dataTransformRegister");
  SetRuntimeMethod<CallTransform, true>(target, "dataTransformCall");
  SetRuntimeMethod<BindEvent>(target, "dataModelBindEventCallback");
}

}  // namespace sfmlrmlui
