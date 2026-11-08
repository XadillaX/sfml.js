// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <nan.h>
#include <sfml-js-interop.h>

#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <string>
#include <vector>

#include "native/imgui-args.h"

namespace sfmlimgui {
namespace {

using CallbackInfo = Nan::FunctionCallbackInfo<v8::Value>;

bool ReadSigned(v8::Local<v8::Value> value, std::int64_t* output) {
  if (value->IsBigInt()) {
    bool lossless = false;
    *output = value.As<v8::BigInt>()->Int64Value(&lossless);
    if (!lossless) {
      Nan::ThrowRangeError("Expected a lossless integer");
      return false;
    }
    return true;
  }
  if (!value->IsNumber()) {
    Nan::ThrowTypeError("Expected a number or bigint");
    return false;
  }
  *output = static_cast<std::int64_t>(Nan::To<double>(value).FromJust());
  return true;
}

bool ReadUnsigned(v8::Local<v8::Value> value, std::uint64_t* output) {
  if (value->IsBigInt()) {
    bool lossless = false;
    *output = value.As<v8::BigInt>()->Uint64Value(&lossless);
    if (!lossless) {
      Nan::ThrowRangeError("Expected a lossless integer");
      return false;
    }
    return true;
  }
  if (!value->IsNumber()) {
    Nan::ThrowTypeError("Expected a number or bigint");
    return false;
  }
  const double number = Nan::To<double>(value).FromJust();
  if (number < 0) {
    Nan::ThrowRangeError("Expected a non-negative number");
    return false;
  }
  *output = static_cast<std::uint64_t>(number);
  return true;
}

bool ReadDouble(v8::Local<v8::Value> value, double* output) {
  if (!value->IsNumber()) {
    Nan::ThrowTypeError("Expected a number");
    return false;
  }
  *output = Nan::To<double>(value).FromJust();
  return true;
}

// JS has no va_list, so each conversion is expanded one argument at a time.
// Returns the written length, or -1 after throwing.

int FormatSingle(char* buffer,
                 std::size_t size,
                 const std::string& format,
                 char specifier,
                 v8::Local<v8::Value> value) {
  switch (specifier) {
    case 's': {
      if (value->IsUint8Array()) {
        auto bytes = value.As<v8::Uint8Array>();
        std::string text(reinterpret_cast<const char*>(
                             bytes->Buffer()->GetBackingStore()->Data()) +
                             bytes->ByteOffset(),
                         bytes->Length());
        return std::snprintf(buffer, size, format.c_str(), text.c_str());
      }
      if (!value->IsString()) {
        Nan::ThrowTypeError("Expected a string for %s");
        return -1;
      }
      Nan::Utf8String text(value);
      return std::snprintf(buffer, size, format.c_str(), *text);
    }
    case 'c': {
      std::int64_t number = 0;
      if (!ReadSigned(value, &number)) return -1;
      return std::snprintf(
          buffer, size, format.c_str(), static_cast<int>(number));
    }
    case 'd':
    case 'i': {
      std::int64_t number = 0;
      if (!ReadSigned(value, &number)) return -1;
      return std::snprintf(
          buffer, size, format.c_str(), static_cast<std::intmax_t>(number));
    }
    case 'u':
    case 'o':
    case 'x':
    case 'X': {
      std::uint64_t number = 0;
      if (!ReadUnsigned(value, &number)) return -1;
      return std::snprintf(
          buffer, size, format.c_str(), static_cast<std::uintmax_t>(number));
    }
    case 'f':
    case 'F':
    case 'e':
    case 'E':
    case 'g':
    case 'G':
    case 'a':
    case 'A': {
      double number = 0;
      if (!ReadDouble(value, &number)) return -1;
      return std::snprintf(buffer, size, format.c_str(), number);
    }
    case 'p': {
      std::uint64_t number = 0;
      if (!ReadUnsigned(value, &number)) return -1;
      return std::snprintf(
          buffer,
          size,
          format.c_str(),
          reinterpret_cast<void*>(static_cast<std::uintptr_t>(number)));
    }
    default:
      return std::snprintf(buffer, size, "%s", format.c_str());
  }
}

// Retries with a larger buffer when the first pass exceeds the stack buffer.

bool AppendValue(std::string* out,
                 const std::string& prefix,
                 char specifier,
                 v8::Local<v8::Value> value) {
  std::string format = prefix;
  switch (specifier) {
    case 'd':
    case 'i':
    case 'u':
    case 'o':
    case 'x':
    case 'X':
      format += 'j';
      break;
    default:
      break;
  }
  format += specifier;

  char buffer[512];
  int length = FormatSingle(buffer, sizeof(buffer), format, specifier, value);
  if (length < 0) return false;
  if (static_cast<std::size_t>(length) < sizeof(buffer)) {
    out->append(buffer, static_cast<std::size_t>(length));
    return true;
  }
  std::vector<char> large(static_cast<std::size_t>(length) + 1);
  length = FormatSingle(large.data(), large.size(), format, specifier, value);
  if (length < 0) return false;
  out->append(large.data(), static_cast<std::size_t>(length));
  return true;
}

// Positional and dynamic-width conversions are rejected; they cannot be
// resolved without consuming arguments out of order.

bool FormatArguments(const CallbackInfo& info,
                     unsigned formatIndex,
                     unsigned argsIndex,
                     std::string* out) {
  std::string formatStorage;
  const char* format = nullptr;
  if (!ReadUtf8(info, formatIndex, &formatStorage, &format, false)) {
    return false;
  }
  if (!info[argsIndex]->IsArray()) {
    Nan::ThrowTypeError("Expected an argument array");
    return false;
  }
  auto args = info[argsIndex].As<v8::Array>();
  std::uint32_t argument = 0;
  const char* cursor = format;

  while (*cursor) {
    if (*cursor != '%') {
      out->push_back(*cursor++);
      continue;
    }
    const char* start = cursor++;
    if (*cursor == '%') {
      out->push_back('%');
      ++cursor;
      continue;
    }
    while (*cursor && std::strchr("-+ #0", *cursor)) ++cursor;
    if (*cursor == '*') {
      Nan::ThrowError("Dynamic width is not supported");
      return false;
    }
    while (*cursor >= '0' && *cursor <= '9') ++cursor;
    if (*cursor == '*') {
      Nan::ThrowError("Dynamic precision is not supported");
      return false;
    }
    if (*cursor == '.') {
      ++cursor;
      while (*cursor >= '0' && *cursor <= '9') ++cursor;
    }
    const char* prefixEnd = cursor;
    while (*cursor == 'h' || *cursor == 'l' || *cursor == 'j' ||
           *cursor == 'z' || *cursor == 't' || *cursor == 'L') {
      ++cursor;
    }
    const char specifier = *cursor;
    if (!specifier) {
      out->append(start, cursor);
      break;
    }
    ++cursor;
    if (argument >= args->Length()) {
      Nan::ThrowRangeError("Not enough format arguments");
      return false;
    }
    auto value = Nan::Get(args, argument++).ToLocalChecked();
    if (!AppendValue(out, std::string(start, prefixEnd), specifier, value)) {
      return false;
    }
  }
  return true;
}

bool Format(const CallbackInfo& info,
            unsigned formatIndex,
            unsigned argsIndex,
            std::string* out) {
  return FormatArguments(info, formatIndex, argsIndex, out);
}

NAN_METHOD(Text) {
  std::string message;
  if (!Format(info, 0, 1, &message)) return;
  ::cimgui::ImGui_Text("%s", message.c_str());
}

NAN_METHOD(TextColored) {
  cimgui::ImVec4 color;
  if (!ReadImVec4(info, 0, &color)) return;
  std::string message;
  if (!Format(info, 1, 2, &message)) return;
  ::cimgui::ImGui_TextColored(color, "%s", message.c_str());
}

NAN_METHOD(TextDisabled) {
  std::string message;
  if (!Format(info, 0, 1, &message)) return;
  ::cimgui::ImGui_TextDisabled("%s", message.c_str());
}

NAN_METHOD(TextWrapped) {
  std::string message;
  if (!Format(info, 0, 1, &message)) return;
  ::cimgui::ImGui_TextWrapped("%s", message.c_str());
}

NAN_METHOD(LabelText) {
  std::string labelStorage;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &labelStorage, &label, false)) return;
  std::string message;
  if (!Format(info, 1, 2, &message)) return;
  ::cimgui::ImGui_LabelText(label, "%s", message.c_str());
}

NAN_METHOD(BulletText) {
  std::string message;
  if (!Format(info, 0, 1, &message)) return;
  ::cimgui::ImGui_BulletText("%s", message.c_str());
}

NAN_METHOD(TreeNodeStr) {
  std::string idStorage;
  const char* id = nullptr;
  if (!ReadUtf8(info, 0, &idStorage, &id, false)) return;
  std::string message;
  if (!Format(info, 1, 2, &message)) return;
  info.GetReturnValue().Set(
      ::cimgui::ImGui_TreeNodeStr(id, "%s", message.c_str()));
}

NAN_METHOD(TreeNodePtr) {
  void* id = nullptr;
  if (!ReadPointer(info, 0, &id)) return;
  std::string message;
  if (!Format(info, 1, 2, &message)) return;
  info.GetReturnValue().Set(
      ::cimgui::ImGui_TreeNodePtr(id, "%s", message.c_str()));
}

NAN_METHOD(TreeNodeExStr) {
  std::string idStorage;
  const char* id = nullptr;
  if (!ReadUtf8(info, 0, &idStorage, &id, false)) return;
  int flags = 0;
  if (!ReadScalar(info, 1, &flags)) return;
  std::string message;
  if (!Format(info, 2, 3, &message)) return;
  info.GetReturnValue().Set(
      ::cimgui::ImGui_TreeNodeExStr(id, flags, "%s", message.c_str()));
}

NAN_METHOD(TreeNodeExPtr) {
  void* id = nullptr;
  if (!ReadPointer(info, 0, &id)) return;
  int flags = 0;
  if (!ReadScalar(info, 1, &flags)) return;
  std::string message;
  if (!Format(info, 2, 3, &message)) return;
  info.GetReturnValue().Set(
      ::cimgui::ImGui_TreeNodeExPtr(id, flags, "%s", message.c_str()));
}

NAN_METHOD(SetTooltip) {
  std::string message;
  if (!Format(info, 0, 1, &message)) return;
  ::cimgui::ImGui_SetTooltip("%s", message.c_str());
}

NAN_METHOD(SetItemTooltip) {
  std::string message;
  if (!Format(info, 0, 1, &message)) return;
  ::cimgui::ImGui_SetItemTooltip("%s", message.c_str());
}

NAN_METHOD(LogText) {
  std::string message;
  if (!Format(info, 0, 1, &message)) return;
  ::cimgui::ImGui_LogText("%s", message.c_str());
}

NAN_METHOD(DebugLog) {
  std::string message;
  if (!Format(info, 0, 1, &message)) return;
  ::cimgui::ImGui_DebugLog("%s", message.c_str());
}

NAN_METHOD(TextBufferAppendf) {
  auto* buffer = ReadStruct<cimgui::ImGuiTextBuffer>(info, 0);
  if (!buffer) return;
  std::string message;
  if (!Format(info, 1, 2, &message)) return;
  ::cimgui::ImGuiTextBuffer_appendf(buffer, "%s", message.c_str());
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiFormatted) {
  sfmljs::SetMethod<Text>(target, "Text");
  sfmljs::SetMethod<TextColored>(target, "TextColored");
  sfmljs::SetMethod<TextDisabled>(target, "TextDisabled");
  sfmljs::SetMethod<TextWrapped>(target, "TextWrapped");
  sfmljs::SetMethod<LabelText>(target, "LabelText");
  sfmljs::SetMethod<BulletText>(target, "BulletText");
  sfmljs::SetMethod<TreeNodeStr>(target, "TreeNodeStr");
  sfmljs::SetMethod<TreeNodePtr>(target, "TreeNodePtr");
  sfmljs::SetMethod<TreeNodeExStr>(target, "TreeNodeExStr");
  sfmljs::SetMethod<TreeNodeExPtr>(target, "TreeNodeExPtr");
  sfmljs::SetMethod<SetTooltip>(target, "SetTooltip");
  sfmljs::SetMethod<SetItemTooltip>(target, "SetItemTooltip");
  sfmljs::SetMethod<LogText>(target, "LogText");
  sfmljs::SetMethod<DebugLog>(target, "DebugLog");
  sfmljs::SetMethod<TextBufferAppendf>(target, "TextBuffer_appendf");
}
}  // namespace sfmlimgui
