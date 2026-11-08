// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <nan.h>
#include <sfml-js-interop.h>

#include <cstddef>
#include <cstdint>
#include <deque>
#include <memory>
#include <string>

#include "native/imgui-args.h"

namespace sfmlimgui {
namespace {

v8::Local<v8::Value> UserDataValue(void* data) {
  if (!data) return Nan::Null();
  return v8::BigInt::NewFromUnsigned(v8::Isolate::GetCurrent(),
                                     reinterpret_cast<std::uintptr_t>(data));
}

// Reentrant JS dispatch is rejected: ImGui may invoke the callback several
// times per widget and a nested call would clobber the active context.
struct InputTextContext {
  Nan::Persistent<v8::Function> callback;
  bool failed = false;
  Nan::Persistent<v8::Value> exception;
};

InputTextContext* currentInputText = nullptr;

int InputTextCallback(cimgui::ImGuiInputTextCallbackData* data) {
  auto* context = currentInputText;
  if (!context || context->failed) return 0;

  Nan::HandleScope scope;
  auto callback = Nan::New(context->callback);
  auto handle =
      sfmljs::SharedHandle<cimgui::ImGuiInputTextCallbackData>::Create(
          std::shared_ptr<cimgui::ImGuiInputTextCallbackData>(
              data, [](cimgui::ImGuiInputTextCallbackData*) {}));
  v8::Local<v8::Value> argv[] = {
      handle,
      UserDataValue(data->UserData),
  };
  Nan::TryCatch tryCatch;
  auto result =
      Nan::Call(callback, Nan::GetCurrentContext()->Global(), 2, argv);
  if (tryCatch.HasCaught()) {
    context->failed = true;
    context->exception.Reset(tryCatch.Exception());
    return 0;
  }
  if (result.IsEmpty()) return 0;
  return Nan::To<std::int32_t>(result.ToLocalChecked()).FromJust();
}

// ImGui keeps only the returned char* until the widget returns, so strings are
// owned by the deque and must outlive the call.
struct ItemsContext {
  Nan::Persistent<v8::Function> callback;
  std::deque<std::string> strings;
  void* userData = nullptr;
  bool failed = false;
  Nan::Persistent<v8::Value> exception;
};

const char* ItemsGetter(void* data, int index) {
  auto* context = static_cast<ItemsContext*>(data);
  if (!context || context->failed) return "";

  Nan::HandleScope scope;
  auto callback = Nan::New(context->callback);
  v8::Local<v8::Value> argv[] = {
      Nan::New(index),
      UserDataValue(context->userData),
  };
  Nan::TryCatch tryCatch;
  auto result =
      Nan::Call(callback, Nan::GetCurrentContext()->Global(), 2, argv);
  if (tryCatch.HasCaught()) {
    context->failed = true;
    context->exception.Reset(tryCatch.Exception());
    return "";
  }
  if (result.IsEmpty() || !result.ToLocalChecked()->IsString()) return "";
  Nan::Utf8String text(result.ToLocalChecked());
  context->strings.emplace_back(*text, text.length());
  return context->strings.back().c_str();
}

// Sample count is fixed by the caller, so a single JS value per index is
// fetched on demand instead of precomputing an array.
struct PlotContext {
  Nan::Persistent<v8::Function> callback;
  void* userData = nullptr;
  bool failed = false;
  Nan::Persistent<v8::Value> exception;
};

float PlotGetter(void* data, int index) {
  auto* context = static_cast<PlotContext*>(data);
  if (!context || context->failed) return 0.0f;

  Nan::HandleScope scope;
  auto callback = Nan::New(context->callback);
  v8::Local<v8::Value> argv[] = {
      Nan::New(index),
      UserDataValue(context->userData),
  };
  Nan::TryCatch tryCatch;
  auto result =
      Nan::Call(callback, Nan::GetCurrentContext()->Global(), 2, argv);
  if (tryCatch.HasCaught()) {
    context->failed = true;
    context->exception.Reset(tryCatch.Exception());
    return 0.0f;
  }
  if (result.IsEmpty() || !result.ToLocalChecked()->IsNumber()) return 0.0f;
  return static_cast<float>(
      Nan::To<double>(result.ToLocalChecked()).FromJust());
}

bool ThrowIfFailed(const CallbackInfo& info,
                   bool failed,
                   Nan::Persistent<v8::Value>* exception) {
  if (!failed) return false;
  if (!exception->IsEmpty()) {
    info.GetIsolate()->ThrowException(Nan::New(*exception));
  } else {
    Nan::ThrowError("JavaScript callback failed");
  }
  return true;
}

NAN_METHOD(InputTextEx) {
  std::string labelStorage;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &labelStorage, &label, false)) return;

  if (!info[1]->IsUint8Array()) {
    Nan::ThrowTypeError("Expected a Uint8Array buffer");
    return;
  }
  auto bytes = info[1].As<v8::Uint8Array>();
  std::size_t bufferSize = 0;
  if (!ReadSize(info, 2, &bufferSize)) return;
  if (bytes->Length() < bufferSize) {
    Nan::ThrowRangeError("InputText buffer is smaller than buf_size");
    return;
  }
  auto* buffer =
      reinterpret_cast<char*>(bytes->Buffer()->GetBackingStore()->Data()) +
      bytes->ByteOffset();

  int flags = 0;
  if (!ReadScalar(info, 3, &flags)) return;

  void* userData = nullptr;
  if (!ReadPointer(info, 5, &userData)) return;

  InputTextContext context;
  InputTextContext* previous = currentInputText;
  bool hasCallback = info[4]->IsFunction();
  if (hasCallback) {
    context.callback.Reset(info[4].As<v8::Function>());
    currentInputText = &context;
  }

  const bool result =
      ::cimgui::ImGui_InputTextEx(label,
                                  buffer,
                                  bufferSize,
                                  flags,
                                  hasCallback ? InputTextCallback : nullptr,
                                  userData);

  currentInputText = previous;
  if (ThrowIfFailed(info, context.failed, &context.exception)) return;
  info.GetReturnValue().Set(result);
}

NAN_METHOD(InputTextMultilineEx) {
  std::string labelStorage;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &labelStorage, &label, false)) return;

  if (!info[1]->IsUint8Array()) {
    Nan::ThrowTypeError("Expected a Uint8Array buffer");
    return;
  }
  auto bytes = info[1].As<v8::Uint8Array>();
  std::size_t bufferSize = 0;
  if (!ReadSize(info, 2, &bufferSize)) return;
  if (bytes->Length() < bufferSize) {
    Nan::ThrowRangeError("InputText buffer is smaller than buf_size");
    return;
  }
  auto* buffer =
      reinterpret_cast<char*>(bytes->Buffer()->GetBackingStore()->Data()) +
      bytes->ByteOffset();

  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 3, &size)) return;
  int flags = 0;
  if (!ReadScalar(info, 4, &flags)) return;
  void* userData = nullptr;
  if (!ReadPointer(info, 6, &userData)) return;

  InputTextContext context;
  InputTextContext* previous = currentInputText;
  bool hasCallback = info[5]->IsFunction();
  if (hasCallback) {
    context.callback.Reset(info[5].As<v8::Function>());
    currentInputText = &context;
  }

  const bool result = ::cimgui::ImGui_InputTextMultilineEx(
      label,
      buffer,
      bufferSize,
      size,
      flags,
      hasCallback ? InputTextCallback : nullptr,
      userData);

  currentInputText = previous;
  if (ThrowIfFailed(info, context.failed, &context.exception)) return;
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ComboCallbackEx) {
  std::string labelStorage;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &labelStorage, &label, false)) return;
  int* currentItem = ReadInt32Array(info, 1, 1);
  if (!currentItem) return;
  if (!info[2]->IsFunction()) {
    Nan::ThrowTypeError("Expected a getter function");
    return;
  }
  void* userData = nullptr;
  if (!ReadPointer(info, 3, &userData)) return;
  int itemsCount = 0;
  if (!ReadScalar(info, 4, &itemsCount)) return;
  int popupHeight = -1;
  if (!ReadScalar(info, 5, &popupHeight)) return;

  ItemsContext context;
  context.callback.Reset(info[2].As<v8::Function>());
  context.userData = userData;
  const bool result = ::cimgui::ImGui_ComboCallbackEx(
      label, currentItem, ItemsGetter, &context, itemsCount, popupHeight);
  if (ThrowIfFailed(info, context.failed, &context.exception)) return;
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ListBoxCallbackEx) {
  std::string labelStorage;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &labelStorage, &label, false)) return;
  int* currentItem = ReadInt32Array(info, 1, 1);
  if (!currentItem) return;
  if (!info[2]->IsFunction()) {
    Nan::ThrowTypeError("Expected a getter function");
    return;
  }
  void* userData = nullptr;
  if (!ReadPointer(info, 3, &userData)) return;
  int itemsCount = 0;
  if (!ReadScalar(info, 4, &itemsCount)) return;
  int height = -1;
  if (!ReadScalar(info, 5, &height)) return;

  ItemsContext context;
  context.callback.Reset(info[2].As<v8::Function>());
  context.userData = userData;
  const bool result = ::cimgui::ImGui_ListBoxCallbackEx(
      label, currentItem, ItemsGetter, &context, itemsCount, height);
  if (ThrowIfFailed(info, context.failed, &context.exception)) return;
  info.GetReturnValue().Set(result);
}

NAN_METHOD(PlotLinesCallbackEx) {
  std::string labelStorage;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &labelStorage, &label, false)) return;
  if (!info[1]->IsFunction()) {
    Nan::ThrowTypeError("Expected a value getter");
    return;
  }
  void* userData = nullptr;
  if (!ReadPointer(info, 2, &userData)) return;
  int valuesCount = 0;
  if (!ReadScalar(info, 3, &valuesCount)) return;
  int valuesOffset = 0;
  if (!ReadScalar(info, 4, &valuesOffset)) return;
  std::string overlayStorage;
  const char* overlay = nullptr;
  if (!ReadUtf8(info, 5, &overlayStorage, &overlay, true)) return;
  float scaleMin = 0;
  float scaleMax = 0;
  if (!ReadScalar(info, 6, &scaleMin) || !ReadScalar(info, 7, &scaleMax)) {
    return;
  }
  cimgui::ImVec2 graphSize;
  if (!ReadImVec2(info, 8, &graphSize)) return;

  PlotContext context;
  context.callback.Reset(info[1].As<v8::Function>());
  context.userData = userData;
  ::cimgui::ImGui_PlotLinesCallbackEx(label,
                                      PlotGetter,
                                      &context,
                                      valuesCount,
                                      valuesOffset,
                                      overlay,
                                      scaleMin,
                                      scaleMax,
                                      graphSize);
  if (ThrowIfFailed(info, context.failed, &context.exception)) return;
}

NAN_METHOD(PlotHistogramCallbackEx) {
  std::string labelStorage;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &labelStorage, &label, false)) return;
  if (!info[1]->IsFunction()) {
    Nan::ThrowTypeError("Expected a value getter");
    return;
  }
  void* userData = nullptr;
  if (!ReadPointer(info, 2, &userData)) return;
  int valuesCount = 0;
  if (!ReadScalar(info, 3, &valuesCount)) return;
  int valuesOffset = 0;
  if (!ReadScalar(info, 4, &valuesOffset)) return;
  std::string overlayStorage;
  const char* overlay = nullptr;
  if (!ReadUtf8(info, 5, &overlayStorage, &overlay, true)) return;
  float scaleMin = 0;
  float scaleMax = 0;
  if (!ReadScalar(info, 6, &scaleMin) || !ReadScalar(info, 7, &scaleMax)) {
    return;
  }
  cimgui::ImVec2 graphSize;
  if (!ReadImVec2(info, 8, &graphSize)) return;

  PlotContext context;
  context.callback.Reset(info[1].As<v8::Function>());
  context.userData = userData;
  ::cimgui::ImGui_PlotHistogramCallbackEx(label,
                                          PlotGetter,
                                          &context,
                                          valuesCount,
                                          valuesOffset,
                                          overlay,
                                          scaleMin,
                                          scaleMax,
                                          graphSize);
  if (ThrowIfFailed(info, context.failed, &context.exception)) return;
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiCallbacks) {
  sfmljs::SetMethod<InputTextEx>(target, "InputTextEx");
  sfmljs::SetMethod<InputTextMultilineEx>(target, "InputTextMultilineEx");
  sfmljs::SetMethod<ComboCallbackEx>(target, "ComboCallbackEx");
  sfmljs::SetMethod<ListBoxCallbackEx>(target, "ListBoxCallbackEx");
  sfmljs::SetMethod<PlotLinesCallbackEx>(target, "PlotLinesCallbackEx");
  sfmljs::SetMethod<PlotHistogramCallbackEx>(target, "PlotHistogramCallbackEx");
}
}  // namespace sfmlimgui
