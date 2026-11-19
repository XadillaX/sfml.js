// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/effects/rmlui-decorator-callbacks.h"

#include <RmlUi/Core/StyleSheetContainer.h>

#include <memory>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

#include "native/rendering/manager/rmlui-render-layers.h"
#include "native/runtime/rmlui-callback-leases.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/properties/rmlui-style-sheet.h"

namespace sfmlrmlui {
namespace {

struct DecoratorCallbacks {
  v8::Global<v8::Array> functions;
  bool active{false};
};

struct DecoratorValue {
  v8::Global<v8::Object> value;
  v8::Global<v8::Array> roots;
  size_t native_roots{0};
};

using DataOwners =
    CallbackLeaseOwners<DecoratorValue, v8::Array, &DecoratorValue::roots>;

auto& Owners() {
  static DataOwners owners("rml.detached.decorators");
  return owners;
}

auto& OwnershipGate() {
  static CallbackResourceGate gate;
  return gate;
}

struct ElementData {
  std::shared_ptr<DecoratorCallbacks> callbacks;
  std::shared_ptr<DecoratorValue> record;
  std::shared_ptr<DataOwners::Lease> lease;
  v8::Global<v8::Object> handle;
  Rml::ObserverPtr<Rml::Element> element;
  bool manual{false};
};

class JavaScriptDecorator;

auto& Decorators() {
  static std::unordered_map<const Rml::Decorator*,
                            std::weak_ptr<JavaScriptDecorator>>
      values;
  return values;
}

auto& Data() {
  static std::unordered_map<Rml::DecoratorDataHandle,
                            std::unique_ptr<ElementData>>
      values;
  return values;
}

auto& PendingReleases() {
  static std::vector<std::unique_ptr<ElementData>> values;
  return values;
}

class DecoratorCallbackScope final {
 public:
  explicit DecoratorCallbackScope(DecoratorCallbacks* callbacks,
                                  Nan::TryCatch* caught)
      : callbacks_(callbacks), caught_(caught) {
    callbacks_->active = true;
    ++State().callback_depth;
    ++State().effect_callback_depth;
  }

  ~DecoratorCallbackScope() {
    RestoreRenderCallbackLayers(caught_->HasCaught());
    --State().effect_callback_depth;
    --State().callback_depth;
    callbacks_->active = false;
  }

 private:
  DecoratorCallbacks* callbacks_;
  Nan::TryCatch* caught_;
};

NAN_METHOD(IgnoreAsyncResult) {}

v8::MaybeLocal<v8::Value> Invoke(
    const std::shared_ptr<DecoratorCallbacks>& callbacks,
    uint32_t index,
    int count,
    v8::Local<v8::Value>* arguments,
    Nan::TryCatch* caught) {
  if (!CanInvokeCallback() || callbacks->functions.IsEmpty()) {
    return {};
  }
  if (callbacks->active) {
    Nan::ThrowError("Recursive decorator callback");
    return {};
  }
  DecoratorCallbackScope scope(callbacks.get(), caught);
  auto functions = callbacks->functions.Get(v8::Isolate::GetCurrent());
  RecordDiagnosticCallback(DiagnosticCallback::kDecorator);
  auto result =
      Nan::Get(functions, index)
          .ToLocalChecked()
          .As<v8::Function>()
          ->Call(Nan::GetCurrentContext(), Nan::Undefined(), count, arguments);
  v8::Local<v8::Value> returned;
  if (result.ToLocal(&returned) && returned->IsPromise()) {
    // Node tracks rejections separately from V8's handled flag. Attach an
    // actual rejection reaction so an invalid async override cannot later
    // terminate the process after we report the synchronous contract error.
    auto ignore =
        Nan::GetFunction(Nan::New<v8::FunctionTemplate>(IgnoreAsyncResult))
            .ToLocalChecked();
    v8::Local<v8::Promise> ignored;
    if (!returned.As<v8::Promise>()
             ->Catch(Nan::GetCurrentContext(), ignore)
             .ToLocal(&ignored)) {
      return {};
    }
    Nan::ThrowTypeError("Decorator callbacks must be synchronous");
    return {};
  }
  return result;
}

class JavaScriptDecorator final : public Rml::Decorator {
 public:
  explicit JavaScriptDecorator(std::shared_ptr<DecoratorCallbacks> callbacks)
      : callbacks(std::move(callbacks)) {}

  ~JavaScriptDecorator() override { Decorators().erase(this); }

  using Rml::Decorator::AddTexture;
  using Rml::Decorator::GetNumTextures;
  using Rml::Decorator::GetTexture;

  Rml::DecoratorDataHandle GenerateElementData(
      Rml::Element* element, Rml::BoxArea area) const override {
    if (!CanInvokeCallback() || callbacks->functions.IsEmpty()) {
      return 0;
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    v8::Local<v8::Value> arguments[] = {WrapElement(element),
                                        Nan::New(static_cast<int>(area))};
    v8::Local<v8::Value> returned;
    Rml::DecoratorDataHandle result = 0;
    if (Invoke(callbacks, 0, 2, arguments, &caught).ToLocal(&returned) &&
        !returned->IsNull()) {
      if (!returned->IsObject() || returned->IsPromise()) {
        Nan::ThrowTypeError("Expected decorator data object or null");
      } else {
        auto data = std::make_unique<ElementData>();
        data->callbacks = callbacks;
        data->element = element->GetObserverPtr();
        data->record = std::make_shared<DecoratorValue>();
        auto object = returned.As<v8::Object>();
        // Each native lease owns its own array even when callbacks return
        // the same JS data object. Never overwrite another lease's edge.
        auto roots = Nan::New<v8::Array>(2);
        Nan::Set(roots, 0, object).FromJust();
        Nan::Set(roots, 1, callbacks->functions.Get(v8::Isolate::GetCurrent()))
            .FromJust();
        data->record->roots.Reset(v8::Isolate::GetCurrent(), roots);
        data->record->value.Reset(v8::Isolate::GetCurrent(), object);
        data->record->value.SetWeak();
        data->lease = Owners().Add(data->record, element);
        // Keep the result alive until the boundary installs its owner edges.
        result = reinterpret_cast<Rml::DecoratorDataHandle>(data.get());
        Data().emplace(result, std::move(data));
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
    return result;
  }

  void RenderElement(Rml::Element* element,
                     Rml::DecoratorDataHandle handle) const override {
    const auto found = Data().find(handle);
    if (!CanInvokeCallback() || found == Data().end() ||
        found->second->record->value.IsEmpty()) {
      return;
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    v8::Local<v8::Value> arguments[] = {
        WrapElement(element),
        found->second->record->value.Get(v8::Isolate::GetCurrent())};
    v8::Local<v8::Value> ignored;
    (void)Invoke(callbacks, 1, 2, arguments, &caught).ToLocal(&ignored);
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
  }

  void ReleaseElementData(Rml::DecoratorDataHandle handle) const override {
    const auto found = Data().find(handle);
    if (found == Data().end()) {
      return;
    }
    // This path also runs inside weak finalizers. Never allocate in V8 or
    // execute JS here; the next safe runtime boundary drains this queue.
    PendingReleases().push_back(std::move(found->second));
    Data().erase(found);
  }

  std::shared_ptr<DecoratorCallbacks> callbacks;
};

std::shared_ptr<JavaScriptDecorator> Custom(const Rml::Decorator* value) {
  const auto found = Decorators().find(value);
  return found == Decorators().end() ? nullptr : found->second.lock();
}

void Append(v8::Local<v8::Array> array, v8::Local<v8::Value> value) {
  array->CreateDataProperty(Nan::GetCurrentContext(), array->Length(), value)
      .FromJust();
}

void SetEdge(v8::Local<v8::Object> handle,
             const char* key,
             v8::Local<v8::Value> value) {
  Nan::SetPrivate(handle, Nan::New(key).ToLocalChecked(), value).FromJust();
}

}  // namespace

Rml::SharedPtr<Rml::Decorator> CreateDecoratorCallbacks(
    v8::Local<v8::Array> functions) {
  auto callbacks = std::make_shared<DecoratorCallbacks>();
  callbacks->functions.Reset(v8::Isolate::GetCurrent(), functions);
  callbacks->functions.SetWeak();
  auto result = std::make_shared<JavaScriptDecorator>(std::move(callbacks));
  Decorators()[result.get()] = result;
  return result;
}

void BindDecoratorCallbacks(v8::Local<v8::Object> handle,
                            const Rml::Decorator* value) {
  if (const auto custom = Custom(value)) {
    SetEdge(handle,
            "rml.decorator.callbacks",
            custom->callbacks->functions.Get(v8::Isolate::GetCurrent()));
  }
}

void RetainDecoratorCallbacks(const Rml::Decorator* value) {
  if (const auto custom = Custom(value);
      custom && custom->callbacks->functions.IsWeak()) {
    custom->callbacks->functions.ClearWeak();
    Rml::InvalidateCallbackResourcesForBinding();
  }
}

void BindDecoratorData(v8::Local<v8::Object> handle,
                       const Rml::Decorator* owner,
                       Rml::DecoratorDataHandle data) {
  if (!Custom(owner)) {
    return;
  }
  const auto found = Data().find(data);
  if (found == Data().end()) {
    return;
  }
  auto& record = *found->second;
  record.manual = true;
  Owners().Detach(record.lease);
  record.handle.Reset(v8::Isolate::GetCurrent(), handle);
  record.handle.SetWeak();
  SetEdge(handle,
          "rml.decorator.data",
          record.record->roots.Get(v8::Isolate::GetCurrent()));
  BindDecoratorCallbacks(handle, owner);
}

bool DecoratorTextureOperation(const Rml::Decorator* value,
                               int operation,
                               int index,
                               Rml::Texture* texture,
                               int* result,
                               v8::Local<v8::Value>* texture_handle) {
  const auto custom = Custom(value);
  if (!custom) {
    Nan::ThrowTypeError("Protected textures require a custom decorator");
    return false;
  }
  if (custom->callbacks->functions.IsEmpty()) {
    Nan::ThrowError("Decorator texture owner is no longer valid");
    return false;
  }
  auto functions = custom->callbacks->functions.Get(v8::Isolate::GetCurrent());
  const auto key = Nan::New("rml.decorator.textures").ToLocalChecked();
  auto stored = Nan::GetPrivate(functions, key).ToLocalChecked();
  if (operation == 0) {
    *result = custom->AddTexture(*texture);
    if (*result >= 0) {
      // Existing callback owner roots also cover native stylesheet/DOM leases.
      // The edge remains visible to GC when a texture callback captures this
      // decorator; native shared_ptr roots would strand that ownership cycle.
      auto handles =
          stored->IsArray() ? stored.As<v8::Array>() : Nan::New<v8::Array>();
      handles
          ->CreateDataProperty(Nan::GetCurrentContext(),
                               static_cast<uint32_t>(*result),
                               *texture_handle)
          .FromJust();
      Nan::SetPrivate(functions, key, handles).FromJust();
    }
  } else if (operation == 1) {
    *result = custom->GetNumTextures();
  } else {
    *texture = index < 0 ? Rml::Texture{} : custom->GetTexture(index);
    *texture_handle = Nan::Undefined();
    if (index >= 0 && stored->IsArray() &&
        static_cast<uint32_t>(index) < stored.As<v8::Array>()->Length()) {
      *texture_handle =
          Nan::Get(stored.As<v8::Array>(), static_cast<uint32_t>(index))
              .ToLocalChecked();
    }
  }
  return true;
}

void DrainDecoratorReleases() {
  // A release callback can cause nested resource destruction. Process a
  // snapshot; nested work is handled by the next boundary, never recursively.
  auto pending = std::move(PendingReleases());
  PendingReleases().clear();
  for (auto& data : pending) {
    if (!CanInvokeCallback() && State().initialized && !State().cleaning_up) {
      PendingReleases().push_back(std::move(data));
      continue;
    }
    Nan::HandleScope handles;
    // Local roots must precede deleting the token's last visible edges.
    v8::Local<v8::Array> roots;
    if (!data->record->roots.IsEmpty()) {
      roots = data->record->roots.Get(v8::Isolate::GetCurrent());
    }
    v8::Local<v8::Object> value;
    if (!data->record->value.IsEmpty()) {
      value = data->record->value.Get(v8::Isolate::GetCurrent());
    }
    v8::Local<v8::Array> functions;
    if (!data->callbacks->functions.IsEmpty()) {
      functions = data->callbacks->functions.Get(v8::Isolate::GetCurrent());
    }
    if (!data->handle.IsEmpty()) {
      auto handle = data->handle.Get(v8::Isolate::GetCurrent());
      SetEdge(handle, "rml.decorator.data", Nan::Undefined());
      SetEdge(handle, "rml.decorator.callbacks", Nan::Undefined());
    }
    if (!CanInvokeCallback() || value.IsEmpty() || functions.IsEmpty()) {
      continue;
    }
    Nan::TryCatch caught;
    v8::Local<v8::Value> argument = value;
    v8::Local<v8::Value> ignored;
    (void)Invoke(data->callbacks, 2, 1, &argument, &caught).ToLocal(&ignored);
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
  }
}

void RefreshDecoratorOwnership() {
  Owners().Refresh(DiagnosticOwnership::kDecorator);
  if (State().cleaning_up || !State().initialized || Decorators().empty() ||
      !OwnershipGate().Changed()) {
    return;
  }
  RecordDiagnosticOwnership(DiagnosticOwnership::kDecorator);
  std::vector<std::shared_ptr<JavaScriptDecorator>> decorators;
  std::unordered_set<DecoratorCallbacks*> rooted;
  // Protect all candidates during V8 allocations. Only native roots stay
  // strong after the owner edges are installed.
  for (const auto& [pointer, weak] : Decorators()) {
    if (auto custom = weak.lock()) {
      if (custom->callbacks->functions.IsWeak()) {
        custom->callbacks->functions.ClearWeak();
      }
      decorators.push_back(std::move(custom));
    }
  }
  VisitStyleSheetDecoratorOwners([&](v8::Local<v8::Object> owner,
                                     const Rml::DecoratorPtrList& instances) {
    auto array = Nan::New<v8::Array>();
    for (const auto& instance : instances) {
      if (auto custom = Custom(instance.get());
          custom && !custom->callbacks->functions.IsEmpty()) {
        if (owner.IsEmpty()) {
          rooted.insert(custom->callbacks.get());
        } else {
          Append(array,
                 custom->callbacks->functions.Get(v8::Isolate::GetCurrent()));
        }
      }
    }
    if (!owner.IsEmpty()) {
      SetEdge(owner, "rml.sheet.decorators", array);
    }
  });
  for (const auto& custom : decorators) {
    auto& functions = custom->callbacks->functions;
    if (!functions.IsEmpty() && !rooted.contains(custom->callbacks.get()) &&
        !functions.IsWeak()) {
      functions.SetWeak();
    }
  }
}

void ReleaseDecoratorCallbacks() {
  DrainDecoratorReleases();
  Owners().Clear();
  OwnershipGate().Reset();
  for (const auto& [pointer, weak] : Decorators()) {
    if (auto custom = weak.lock()) {
      auto& functions = custom->callbacks->functions;
      if (!functions.IsEmpty()) {
        auto array = functions.Get(v8::Isolate::GetCurrent());
        Nan::SetPrivate(array,
                        Nan::New("rml.decorator.textures").ToLocalChecked(),
                        Nan::Undefined())
            .FromJust();
        for (uint32_t i = 0; i < 3; ++i) {
          array
              ->CreateDataProperty(
                  Nan::GetCurrentContext(), i, Nan::Undefined())
              .FromJust();
        }
      }
      functions.Reset();
    }
  }
  Data().clear();
  PendingReleases().clear();
  Decorators().clear();
}

void ReleaseDecoratorElementEdges() {
  for (const auto& [pointer, weak] : State().elements) {
    if (auto token = weak.lock(); token && !token->handle.IsEmpty()) {
      auto handle = token->handle.Get(v8::Isolate::GetCurrent());
      SetEdge(handle, "rml.detached.decorators", Nan::Undefined());
      SetEdge(handle, "rml.sheet.decorators", Nan::Undefined());
    }
  }
}

}  // namespace sfmlrmlui
