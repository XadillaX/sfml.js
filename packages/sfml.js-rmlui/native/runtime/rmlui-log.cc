// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Log.h>

#include <limits>

#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-string.h"

namespace sfmlrmlui {
namespace {

NAN_METHOD(LogMessage) {
  int64_t type = 0;
  if (!ReadStringInteger(
          info[0], Rml::Log::LT_ALWAYS, Rml::Log::LT_MAX - 1, &type)) {
    return;
  }

  Rml::String message;
  uint32_t length = 0;
  if (!FormatStringScalars(info[1], info[2], &message, &length)) {
    return;
  }

  // Keep native routing, the fixed log buffer and C-string truncation.
  // A user-supplied percent sign must never become a second format string.
  Rml::Log::Message(static_cast<Rml::Log::Type>(type), "%s", message.c_str());
}

NAN_METHOD(LogParseError) {
  Rml::String filename;
  int64_t line = 0;
  if (!ReadString(info[0], &filename) ||
      !ReadStringInteger(info[1],
                         std::numeric_limits<int32_t>::min(),
                         std::numeric_limits<int32_t>::max(),
                         &line)) {
    return;
  }

  Rml::String message;
  uint32_t length = 0;
  if (!FormatStringScalars(info[2], info[3], &message, &length)) {
    return;
  }

  Rml::Log::ParseError(filename, static_cast<int>(line), "%s", message.c_str());
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlLog) {
  SetRuntimeMethod<LogMessage, false, false>(target, "logMessage");
  SetRuntimeMethod<LogParseError, false, false>(target, "logParseError");
}

}  // namespace sfmlrmlui
