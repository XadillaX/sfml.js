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

InputTextContext* current_input_text = nullptr;

int InputTextCallback(cimgui::ImGuiInputTextCallbackData* data) {
  auto* context = current_input_text;
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
  Nan::TryCatch try_catch;
  auto result =
      Nan::Call(callback, Nan::GetCurrentContext()->Global(), 2, argv);
  if (try_catch.HasCaught()) {
    context->failed = true;
    context->exception.Reset(try_catch.Exception());
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
  void* user_data = nullptr;
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
      UserDataValue(context->user_data),
  };
  Nan::TryCatch try_catch;
  auto result =
      Nan::Call(callback, Nan::GetCurrentContext()->Global(), 2, argv);
  if (try_catch.HasCaught()) {
    context->failed = true;
    context->exception.Reset(try_catch.Exception());
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
  void* user_data = nullptr;
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
      UserDataValue(context->user_data),
  };
  Nan::TryCatch try_catch;
  auto result =
      Nan::Call(callback, Nan::GetCurrentContext()->Global(), 2, argv);
  if (try_catch.HasCaught()) {
    context->failed = true;
    context->exception.Reset(try_catch.Exception());
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
  std::string label_storage;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_storage, &label, false)) return;

  if (!info[1]->IsUint8Array()) {
    Nan::ThrowTypeError("Expected a Uint8Array buffer");
    return;
  }
  auto bytes = info[1].As<v8::Uint8Array>();
  std::size_t buffer_size = 0;
  if (!ReadSize(info, 2, &buffer_size)) return;
  if (bytes->Length() < buffer_size) {
    Nan::ThrowRangeError("InputText buffer is smaller than buf_size");
    return;
  }
  auto* buffer =
      reinterpret_cast<char*>(bytes->Buffer()->GetBackingStore()->Data()) +
      bytes->ByteOffset();

  int flags = 0;
  if (!ReadScalar(info, 3, &flags)) return;

  void* user_data = nullptr;
  if (!ReadPointer(info, 5, &user_data)) return;

  InputTextContext context;
  InputTextContext* previous = current_input_text;
  bool has_callback = info[4]->IsFunction();
  if (has_callback) {
    context.callback.Reset(info[4].As<v8::Function>());
    current_input_text = &context;
  }

  const bool result =
      ::cimgui::ImGui_InputTextEx(label,
                                  buffer,
                                  buffer_size,
                                  flags,
                                  has_callback ? InputTextCallback : nullptr,
                                  user_data);

  current_input_text = previous;
  if (ThrowIfFailed(info, context.failed, &context.exception)) return;
  info.GetReturnValue().Set(result);
}

NAN_METHOD(InputTextMultilineEx) {
  std::string label_storage;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_storage, &label, false)) return;

  if (!info[1]->IsUint8Array()) {
    Nan::ThrowTypeError("Expected a Uint8Array buffer");
    return;
  }
  auto bytes = info[1].As<v8::Uint8Array>();
  std::size_t buffer_size = 0;
  if (!ReadSize(info, 2, &buffer_size)) return;
  if (bytes->Length() < buffer_size) {
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
  void* user_data = nullptr;
  if (!ReadPointer(info, 6, &user_data)) return;

  InputTextContext context;
  InputTextContext* previous = current_input_text;
  bool has_callback = info[5]->IsFunction();
  if (has_callback) {
    context.callback.Reset(info[5].As<v8::Function>());
    current_input_text = &context;
  }

  const bool result = ::cimgui::ImGui_InputTextMultilineEx(
      label,
      buffer,
      buffer_size,
      size,
      flags,
      has_callback ? InputTextCallback : nullptr,
      user_data);

  current_input_text = previous;
  if (ThrowIfFailed(info, context.failed, &context.exception)) return;
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ComboCallbackEx) {
  std::string label_storage;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_storage, &label, false)) return;
  int* current_item = ReadInt32Array(info, 1, 1);
  if (!current_item) return;
  if (!info[2]->IsFunction()) {
    Nan::ThrowTypeError("Expected a getter function");
    return;
  }
  void* user_data = nullptr;
  if (!ReadPointer(info, 3, &user_data)) return;
  int items_count = 0;
  if (!ReadScalar(info, 4, &items_count)) return;
  int popup_height = -1;
  if (!ReadScalar(info, 5, &popup_height)) return;

  ItemsContext context;
  context.callback.Reset(info[2].As<v8::Function>());
  context.user_data = user_data;
  const bool result = ::cimgui::ImGui_ComboCallbackEx(
      label, current_item, ItemsGetter, &context, items_count, popup_height);
  if (ThrowIfFailed(info, context.failed, &context.exception)) return;
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ListBoxCallbackEx) {
  std::string label_storage;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_storage, &label, false)) return;
  int* current_item = ReadInt32Array(info, 1, 1);
  if (!current_item) return;
  if (!info[2]->IsFunction()) {
    Nan::ThrowTypeError("Expected a getter function");
    return;
  }
  void* user_data = nullptr;
  if (!ReadPointer(info, 3, &user_data)) return;
  int items_count = 0;
  if (!ReadScalar(info, 4, &items_count)) return;
  int height = -1;
  if (!ReadScalar(info, 5, &height)) return;

  ItemsContext context;
  context.callback.Reset(info[2].As<v8::Function>());
  context.user_data = user_data;
  const bool result = ::cimgui::ImGui_ListBoxCallbackEx(
      label, current_item, ItemsGetter, &context, items_count, height);
  if (ThrowIfFailed(info, context.failed, &context.exception)) return;
  info.GetReturnValue().Set(result);
}

NAN_METHOD(PlotLinesCallbackEx) {
  std::string label_storage;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_storage, &label, false)) return;
  if (!info[1]->IsFunction()) {
    Nan::ThrowTypeError("Expected a value getter");
    return;
  }
  void* user_data = nullptr;
  if (!ReadPointer(info, 2, &user_data)) return;
  int values_count = 0;
  if (!ReadScalar(info, 3, &values_count)) return;
  int values_offset = 0;
  if (!ReadScalar(info, 4, &values_offset)) return;
  std::string overlay_storage;
  const char* overlay = nullptr;
  if (!ReadUtf8(info, 5, &overlay_storage, &overlay, true)) return;
  float scale_min = 0;
  float scale_max = 0;
  if (!ReadScalar(info, 6, &scale_min) || !ReadScalar(info, 7, &scale_max)) {
    return;
  }
  cimgui::ImVec2 graph_size;
  if (!ReadImVec2(info, 8, &graph_size)) return;

  PlotContext context;
  context.callback.Reset(info[1].As<v8::Function>());
  context.user_data = user_data;
  ::cimgui::ImGui_PlotLinesCallbackEx(label,
                                      PlotGetter,
                                      &context,
                                      values_count,
                                      values_offset,
                                      overlay,
                                      scale_min,
                                      scale_max,
                                      graph_size);
  if (ThrowIfFailed(info, context.failed, &context.exception)) return;
}

NAN_METHOD(PlotHistogramCallbackEx) {
  std::string label_storage;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_storage, &label, false)) return;
  if (!info[1]->IsFunction()) {
    Nan::ThrowTypeError("Expected a value getter");
    return;
  }
  void* user_data = nullptr;
  if (!ReadPointer(info, 2, &user_data)) return;
  int values_count = 0;
  if (!ReadScalar(info, 3, &values_count)) return;
  int values_offset = 0;
  if (!ReadScalar(info, 4, &values_offset)) return;
  std::string overlay_storage;
  const char* overlay = nullptr;
  if (!ReadUtf8(info, 5, &overlay_storage, &overlay, true)) return;
  float scale_min = 0;
  float scale_max = 0;
  if (!ReadScalar(info, 6, &scale_min) || !ReadScalar(info, 7, &scale_max)) {
    return;
  }
  cimgui::ImVec2 graph_size;
  if (!ReadImVec2(info, 8, &graph_size)) return;

  PlotContext context;
  context.callback.Reset(info[1].As<v8::Function>());
  context.user_data = user_data;
  ::cimgui::ImGui_PlotHistogramCallbackEx(label,
                                          PlotGetter,
                                          &context,
                                          values_count,
                                          values_offset,
                                          overlay,
                                          scale_min,
                                          scale_max,
                                          graph_size);
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
