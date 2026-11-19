// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/textures/rmlui-callback-texture.h"

#include <RmlUi/Core/CallbackTexture.h>
#include <nan.h>

#include <algorithm>
#include <memory>
#include <type_traits>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/fonts/rmlui-font-glyph.h"
#include "native/rendering/geometry/rmlui-geometry.h"
#include "native/rendering/manager/rmlui-render-manager.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

struct CallbackRecord {
  // JS-visible owner edges retain this array; native closures do not root it.
  v8::Global<v8::Array> functions;
};

struct TextureState {
  std::shared_ptr<RenderManagerState> manager;
  std::shared_ptr<CallbackRecord> callback;
  Rml::CallbackTexture value;
  uint64_t generation{0};
  // Source caches share one JS-visible callback array across managers.
  bool owns_callback{true};
};

struct SourceState {
  std::shared_ptr<CallbackRecord> callback;
  std::unordered_map<Rml::RenderManager*, std::shared_ptr<TextureState>>
      textures;
  uint64_t generation{0};
};

struct SubmissionState {
  std::shared_ptr<RenderManagerState> manager;
  Rml::TextureHandle handle{};
  Rml::Vector2i dimensions;
  bool active{false};
  ~SubmissionState() {
    if (handle) {
      manager->render_interface->ReleaseTexture(handle);
    }
  }
};

struct HandleState {
  std::shared_ptr<RenderManagerState> manager;
  Rml::TextureHandle value{};
  Rml::Vector2i dimensions;
  uint64_t generation{0};
  ~HandleState() {
    if (value) {
      manager->render_interface->ReleaseTexture(value);
    }
  }
};

using TextureHandle = sfmljs::SharedHandle<TextureState>;
using SourceHandle = sfmljs::SharedHandle<SourceState>;
using SubmissionHandle = sfmljs::SharedHandle<SubmissionState>;
using OwnedHandle = sfmljs::SharedHandle<HandleState>;

static_assert(static_cast<uint32_t>(Rml::CallbackTexture::InvalidHandle()) ==
              4294967295u);

template <typename T>
auto& Registry() {
  static std::vector<std::weak_ptr<T>> values;
  return values;
}

template <typename T>
void Register(const std::shared_ptr<T>& state) {
  auto& values = Registry<T>();
  std::erase_if(values, [](const auto& entry) { return entry.expired(); });
  values.push_back(state);
}

std::shared_ptr<CallbackRecord> CreateRecord(v8::Local<v8::Value> function) {
  auto record = std::make_shared<CallbackRecord>();
  auto functions = Nan::New<v8::Array>(1);
  functions->CreateDataProperty(Nan::GetCurrentContext(), 0, function)
      .FromJust();
  record->functions.Reset(v8::Isolate::GetCurrent(), functions);
  record->functions.SetWeak();
  Register(record);
  return record;
}

void BindRecord(v8::Local<v8::Object> owner,
                const std::shared_ptr<CallbackRecord>& record) {
  Nan::SetPrivate(owner,
                  Nan::New("rml.texture.callbacks").ToLocalChecked(),
                  record->functions.Get(v8::Isolate::GetCurrent()))
      .FromJust();
}

void ClearRecord(const std::shared_ptr<CallbackRecord>& record) {
  if (record && !record->functions.IsEmpty()) {
    record->functions.Get(v8::Isolate::GetCurrent())
        ->CreateDataProperty(Nan::GetCurrentContext(), 0, Nan::Undefined())
        .FromJust();
    record->functions.Reset();
  }
}

template <typename T, typename Handle>
std::shared_ptr<T> Checked(v8::Local<v8::Value> input) {
  auto* handle = Handle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a callback texture resource");
    return {};
  }
  auto state = handle->owner();
  if (state->generation != State().generation) {
    Nan::ThrowError("Callback texture resource is no longer valid");
    return {};
  }
  if constexpr (!std::is_same_v<T, SourceState>) {
    if (state->manager && !state->manager->value) {
      Nan::ThrowError("Callback texture manager is no longer valid");
      return {};
    }
  }
  return state;
}

std::shared_ptr<SubmissionState> SubmissionOf(v8::Local<v8::Value> input) {
  auto* handle = SubmissionHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a scoped callback texture interface");
    return {};
  }
  auto state = handle->owner();
  if (!state->active || !State().texture_callback_depth) {
    Nan::ThrowError("Callback texture interface scope has expired");
    return {};
  }
  return state;
}

bool ReadDimensions(v8::Local<v8::Value> input, Rml::Vector2i* result) {
  if (!ReadGlyphVector(input, result) || !ValidateGlyphDimensions(*result)) {
    return false;
  }
  if (result->x <= 0 || result->y <= 0) {
    Nan::ThrowRangeError("Texture dimensions must be positive integers");
    return false;
  }
  return true;
}

bool ReadPixels(v8::Local<v8::Value> input,
                Rml::Vector2i dimensions,
                std::vector<Rml::byte>* result) {
  if (!input->IsUint8Array()) {
    Nan::ThrowTypeError("Expected premultiplied RGBA Uint8Array");
    return false;
  }
  auto view = input.As<v8::Uint8Array>();
  const size_t bytes =
      size_t{static_cast<unsigned>(dimensions.x)} * dimensions.y * 4;
  if (view->Buffer()->WasDetached() || view->ByteLength() != bytes) {
    Nan::ThrowRangeError("Texture byte length must match its dimensions");
    return false;
  }
  auto backing = view->Buffer()->GetBackingStore();
  if (backing->IsShared()) {
    Nan::ThrowTypeError("Texture source must use an unshared buffer");
    return false;
  }
  const auto* data =
      static_cast<Rml::byte*>(backing->Data()) + view->ByteOffset();
  result->assign(data, data + bytes);
  return true;
}

bool CanSubmit(const std::shared_ptr<SubmissionState>& state) {
  if (state->handle) {
    Nan::ThrowError("Callback texture has already been submitted");
    return false;
  }
  return true;
}

NAN_METHOD(IgnorePromiseRejection) {}

bool Invoke(const std::shared_ptr<CallbackRecord>& record,
            const std::shared_ptr<RenderManagerState>& manager,
            const Rml::CallbackTextureInterface& destination) {
  if (!CanInvokeCallback() || record->functions.IsEmpty()) {
    return false;
  }
  Nan::HandleScope handles;
  Nan::TryCatch caught;
  auto functions = record->functions.Get(v8::Isolate::GetCurrent());
  auto function = Nan::Get(functions, 0).ToLocalChecked();
  if (!function->IsFunction()) {
    return false;
  }
  auto state = std::make_shared<SubmissionState>();
  state->manager = manager;
  state->active = true;
  ++State().callback_depth;
  ++State().texture_callback_depth;
  v8::Local<v8::Value> argument = SubmissionHandle::Create(state);
  v8::Local<v8::Value> returned;
  bool success = false;
  RecordDiagnosticCallback(DiagnosticCallback::kTexture);
  if (function.As<v8::Function>()
          ->Call(Nan::GetCurrentContext(), Nan::Undefined(), 1, &argument)
          .ToLocal(&returned)) {
    if (returned->IsPromise()) {
      auto handler = Nan::GetFunction(
                         Nan::New<v8::FunctionTemplate>(IgnorePromiseRejection))
                         .ToLocalChecked();
      v8::Local<v8::Promise> ignored;
      (void)returned.As<v8::Promise>()
          ->Catch(Nan::GetCurrentContext(), handler)
          .ToLocal(&ignored);
      Nan::ThrowTypeError("Texture callbacks must be synchronous");
    } else if (!returned->IsBoolean()) {
      Nan::ThrowTypeError("Texture callbacks must return a boolean");
    } else if (Nan::To<bool>(returned).FromJust()) {
      if (!state->handle) {
        Nan::ThrowError("Successful texture callbacks must submit a texture");
      } else {
        destination.SetTextureHandle(state->handle, state->dimensions);
        state->handle = {};
        success = true;
      }
    }
  }
  state->active = false;
  --State().texture_callback_depth;
  --State().callback_depth;
  // Roll back before returning to EnsureLoaded; failure is cached upstream.
  if (state->handle) {
    manager->render_interface->ReleaseTexture(state->handle);
    state->handle = {};
  }
  if (caught.HasCaught()) {
    CaptureCallbackException(caught.Exception());
  }
  return success;
}

std::shared_ptr<TextureState> MakeTexture(
    const std::shared_ptr<RenderManagerState>& manager,
    const std::shared_ptr<CallbackRecord>& callback,
    bool owns_callback = true) {
  auto state = std::make_shared<TextureState>();
  state->manager = manager;
  state->callback = callback;
  state->generation = State().generation;
  state->owns_callback = owns_callback;
  state->value = manager->value->MakeCallbackTexture(
      [callback, manager](const Rml::CallbackTextureInterface& interface) {
        return Invoke(callback, manager, interface);
      });
  Register(state);
  return state;
}

v8::Local<v8::Object> TextureView(const std::shared_ptr<TextureState>& state) {
  auto edge = state->callback->functions.Get(v8::Isolate::GetCurrent());
  return WrapTexture(
      Rml::Texture(state->value),
      state->manager->value,
      state,
      [pointer = state.get()] { return static_cast<bool>(pointer->value); },
      edge);
}

NAN_METHOD(CreateTexture) {
  auto state = std::make_shared<TextureState>();
  state->generation = State().generation;
  Register(state);
  info.GetReturnValue().Set(TextureHandle::Create(state));
}

NAN_METHOD(MakeCallbackTexture) {
  if (!info[1]->IsFunction()) {
    return Nan::ThrowTypeError("Expected a texture callback function");
  }
  auto manager = RenderManagerOf(info[0]);
  if (!manager) {
    return;
  }
  auto state = MakeTexture(manager, CreateRecord(info[1]));
  auto handle = TextureHandle::Create(state);
  BindRecord(handle, state->callback);
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(TextureIsValid) {
  if (auto state = Checked<TextureState, TextureHandle>(info[0])) {
    info.GetReturnValue().Set(static_cast<bool>(state->value));
  }
}

NAN_METHOD(ToTexture) {
  if (auto state = Checked<TextureState, TextureHandle>(info[0])) {
    info.GetReturnValue().Set(state->value ? TextureView(state)
                                           : WrapTexture({}, nullptr));
  }
}

NAN_METHOD(ReleaseTexture) {
  if (auto state = Checked<TextureState, TextureHandle>(info[0])) {
    state->value.Release();
    ClearRecord(state->callback);
  }
}

NAN_METHOD(CreateSource) {
  if (!info[0]->IsUndefined() && !info[0]->IsFunction()) {
    return Nan::ThrowTypeError("Expected a texture callback function");
  }
  auto state = std::make_shared<SourceState>();
  state->callback = CreateRecord(info[0]);
  state->generation = State().generation;
  Register(state);
  auto handle = SourceHandle::Create(state);
  BindRecord(handle, state->callback);
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(SourceGetTexture) {
  auto source = Checked<SourceState, SourceHandle>(info[0]);
  if (!source) {
    return;
  }
  auto manager = RenderManagerOf(info[1]);
  if (!source || !manager) {
    return;
  }
  auto functions = source->callback->functions.Get(v8::Isolate::GetCurrent());
  auto function = Nan::Get(functions, 0).ToLocalChecked();
  if (!function->IsFunction()) {
    info.GetReturnValue().Set(WrapTexture({}, nullptr));
    return;
  }
  auto& state = source->textures[manager->value];
  if (!state) {
    state = MakeTexture(manager, source->callback, false);
  }
  info.GetReturnValue().Set(TextureView(state));
}

NAN_METHOD(GenerateTexture) {
  Rml::Vector2i dimensions;
  std::vector<Rml::byte> pixels;
  if (!ReadDimensions(info[2], &dimensions) ||
      !ReadPixels(info[1], dimensions, &pixels)) {
    return;
  }
  auto state = SubmissionOf(info[0]);
  if (!state || !CanSubmit(state)) {
    return;
  }
  Rml::CallbackTextureInterface interface(*state->manager->value,
                                          *state->manager->render_interface,
                                          state->handle,
                                          state->dimensions);
  info.GetReturnValue().Set(interface.GenerateTexture(pixels, dimensions));
}

NAN_METHOD(SaveLayerAsTexture) {
  auto state = SubmissionOf(info[0]);
  if (!state || !CanSubmit(state)) {
    return;
  }
  const auto region = state->manager->value->GetScissorRegion();
  if (!region.Valid() || region.Size().x <= 0 || region.Size().y <= 0) {
    return Nan::ThrowError("Save layer as texture requires a scissor region");
  }
  Rml::CallbackTextureInterface interface(*state->manager->value,
                                          *state->manager->render_interface,
                                          state->handle,
                                          state->dimensions);
  interface.SaveLayerAsTexture();
}

NAN_METHOD(GetRenderManager) {
  if (auto state = SubmissionOf(info[0])) {
    info.GetReturnValue().Set(WrapRenderManager(state->manager->value));
  }
}

NAN_METHOD(GenerateHandle) {
  Rml::Vector2i dimensions;
  std::vector<Rml::byte> pixels;
  if (!ReadDimensions(info[2], &dimensions) ||
      !ReadPixels(info[1], dimensions, &pixels)) {
    return;
  }
  auto manager = RenderManagerOf(info[0]);
  if (!manager) {
    return;
  }
  auto state = std::make_shared<HandleState>();
  state->manager = manager;
  state->generation = State().generation;
  state->dimensions = dimensions;
  state->value = manager->render_interface->GenerateTexture(pixels, dimensions);
  Register(state);
  info.GetReturnValue().Set(OwnedHandle::Create(state));
}

NAN_METHOD(HandleIsValid) {
  if (auto state = Checked<HandleState, OwnedHandle>(info[0])) {
    info.GetReturnValue().Set(state->value != Rml::TextureHandle{});
  }
}

NAN_METHOD(ReleaseHandle) {
  if (auto state = Checked<HandleState, OwnedHandle>(info[0]);
      state && state->value) {
    state->manager->render_interface->ReleaseTexture(state->value);
    state->value = {};
  }
}

NAN_METHOD(SetTextureHandle) {
  Rml::Vector2i dimensions;
  if (!ReadDimensions(info[2], &dimensions)) {
    return;
  }
  auto state = SubmissionOf(info[0]);
  if (!state) {
    return;
  }
  auto handle = Checked<HandleState, OwnedHandle>(info[1]);
  if (!state || !handle || !CanSubmit(state)) {
    return;
  }
  if (!handle->value) {
    return Nan::ThrowError("Texture handle is empty or already transferred");
  }
  if (handle->manager != state->manager) {
    return Nan::ThrowError("Texture handle belongs to a different manager");
  }
  if (handle->dimensions != dimensions) {
    return Nan::ThrowRangeError("Texture handle dimensions do not match");
  }
  Rml::CallbackTextureInterface interface(*state->manager->value,
                                          *state->manager->render_interface,
                                          state->handle,
                                          state->dimensions);
  interface.SetTextureHandle(handle->value, dimensions);
  handle->value = {};
}

template <Nan::FunctionCallback callback>
void SetSubmissionMethod(v8::Local<v8::Object> target, const char* name) {
  SetRuntimeMethod<callback, true, true, true, true, true, true>(target, name);
}

}  // namespace

void ReleaseCallbackTextureBindings(bool unused_only) {
  // Clear per-manager caches before a released manager address can be reused.
  for (const auto& weak : Registry<SourceState>()) {
    if (auto source = weak.lock()) {
      std::erase_if(source->textures, [unused_only](const auto& entry) {
        return !unused_only || !entry.second->manager->value;
      });
      if (!unused_only) {
        source->generation = 0;
      }
    }
  }
  for (const auto& weak : Registry<TextureState>()) {
    if (auto state = weak.lock();
        state && (!unused_only || (state->manager && !state->manager->value))) {
      state->value.Release();
      if (state->owns_callback) {
        ClearRecord(state->callback);
      }
      state->generation = 0;
    }
  }
  for (const auto& weak : Registry<HandleState>()) {
    if (auto state = weak.lock();
        state && (!unused_only || !state->manager->value)) {
      if (state->value) {
        state->manager->render_interface->ReleaseTexture(state->value);
        state->value = {};
      }
      state->generation = 0;
    }
  }
  if (!unused_only) {
    for (const auto& weak : Registry<CallbackRecord>()) {
      if (auto record = weak.lock()) {
        ClearRecord(record);
      }
    }
    Registry<SourceState>().clear();
    Registry<TextureState>().clear();
    Registry<HandleState>().clear();
    Registry<CallbackRecord>().clear();
  }
}

NAN_MODULE_INIT(InitializeRmlCallbackTexture) {
  SetInstancerValueMethod<CreateTexture>(target, "createCallbackTexture");
  SetInstancerValueMethod<MakeCallbackTexture>(target, "makeCallbackTexture");
  SetInstancerValueMethod<TextureIsValid>(target, "callbackTextureIsValid");
  SetInstancerValueMethod<ToTexture>(target, "callbackTextureToTexture");
  SetInstancerValueMethod<ReleaseTexture>(target, "releaseCallbackTexture");
  SetInstancerValueMethod<CreateSource>(target, "createCallbackTextureSource");
  SetInstancerValueMethod<SourceGetTexture>(target,
                                            "callbackTextureSourceGetTexture");
  SetSubmissionMethod<GenerateTexture>(target, "callbackGenerateTexture");
  SetSubmissionMethod<SaveLayerAsTexture>(target, "callbackSaveLayerAsTexture");
  SetSubmissionMethod<GetRenderManager>(target, "callbackGetRenderManager");
  SetSubmissionMethod<SetTextureHandle>(target, "callbackSetTextureHandle");
  SetInstancerValueMethod<GenerateHandle>(target, "generateTextureHandle");
  SetInstancerValueMethod<HandleIsValid>(target, "textureHandleIsValid");
  SetInstancerValueMethod<ReleaseHandle>(target, "releaseTextureHandle");
}

}  // namespace sfmlrmlui
