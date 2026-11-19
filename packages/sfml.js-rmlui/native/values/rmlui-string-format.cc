// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <cmath>
#include <limits>
#include <utility>
#include <vector>

#include "native/values/rmlui-string.h"

namespace sfmlrmlui {
namespace {

constexpr size_t kFormatLimit = 1000000;
constexpr size_t kNativeInternalBufferSize = 256;

struct FormatArguments {
  std::vector<v8::Local<v8::Value>> values;
  size_t next{0};

  bool Take(v8::Local<v8::Value>* result) {
    if (next == values.size()) {
      Nan::ThrowTypeError("Missing a typed formatting argument");
      return false;
    }

    *result = values[next++];
    return true;
  }
};

struct FormatSpecifier {
  Rml::String text;
  char conversion{0};
  bool dynamic_width{false};
  bool dynamic_precision{false};
  int width{0};
  int precision{0};
};

bool ReadDimension(const Rml::String& format,
                   size_t* position,
                   bool* dynamic,
                   int* result,
                   FormatArguments* arguments) {
  if (*position < format.size() && format[*position] == '*') {
    ++*position;
    *dynamic = true;

    v8::Local<v8::Value> value;
    int64_t dimension = 0;
    if (!arguments->Take(&value) ||
        !ReadStringInteger(value,
                           -static_cast<double>(kFormatLimit),
                           kFormatLimit,
                           &dimension)) {
      return false;
    }
    *result = static_cast<int>(dimension);
    return true;
  }

  size_t dimension = 0;
  while (*position < format.size() && format[*position] >= '0' &&
         format[*position] <= '9') {
    dimension = dimension * 10 + (format[*position] - '0');
    if (dimension > kFormatLimit) {
      Nan::ThrowRangeError("Formatting width or precision exceeds the limit");
      return false;
    }
    ++*position;
  }

  *result = static_cast<int>(dimension);
  return true;
}

bool ReadSpecifier(const Rml::String& format,
                   size_t* position,
                   FormatArguments* arguments,
                   FormatSpecifier* result) {
  const size_t begin = (*position)++;
  while (*position < format.size() &&
         Rml::String("-+ #0").find(format[*position]) != Rml::String::npos) {
    ++*position;
  }
  if (!ReadDimension(format,
                     position,
                     &result->dynamic_width,
                     &result->width,
                     arguments)) {
    return false;
  }
  if (*position < format.size() && format[*position] == '.') {
    ++*position;
    if (!ReadDimension(format,
                       position,
                       &result->dynamic_precision,
                       &result->precision,
                       arguments)) {
      return false;
    }
  }
  if (*position == format.size() ||
      Rml::String("diuoxXfFeEgGaAcs").find(format[*position]) ==
          Rml::String::npos) {
    Nan::ThrowTypeError("Unsupported or incomplete typed format specifier");
    return false;
  }

  result->conversion = format[(*position)++];
  result->text = format.substr(begin, *position - begin);
  return true;
}

template <typename T>
Rml::String FormatValue(const FormatSpecifier& specifier, T value) {
  // Force the real RmlUi formatter's large-buffer branch for each fragment.
  // That branch preserves embedded NUL; the complete output selects the
  // native small/large result contract only after all fragments are joined.
  const Rml::String format =
      Rml::String(kNativeInternalBufferSize, ' ') + specifier.text;
  Rml::String result;
  if (specifier.dynamic_width && specifier.dynamic_precision) {
    Rml::FormatString(
        result, format.c_str(), specifier.width, specifier.precision, value);
  } else if (specifier.dynamic_width) {
    Rml::FormatString(result, format.c_str(), specifier.width, value);
  } else if (specifier.dynamic_precision) {
    Rml::FormatString(result, format.c_str(), specifier.precision, value);
  } else {
    Rml::FormatString(result, format.c_str(), value);
  }

  return result.substr(kNativeInternalBufferSize);
}

bool AppendValue(const FormatSpecifier& specifier,
                 v8::Local<v8::Value> input,
                 Rml::String* output) {
  const char conversion = specifier.conversion;
  if (conversion == 's') {
    Rml::String text;
    if (!ReadString(input, &text)) {
      return false;
    }
    *output += FormatValue(specifier, text.c_str());
  } else if (conversion == 'd' || conversion == 'i' || conversion == 'c') {
    int64_t number = 0;
    const bool character = conversion == 'c';
    if (!ReadStringInteger(
            input,
            character ? 0 : std::numeric_limits<int32_t>::min(),
            character ? 255 : std::numeric_limits<int32_t>::max(),
            &number)) {
      return false;
    }
    *output += FormatValue(specifier, static_cast<int>(number));
  } else if (conversion == 'u' || conversion == 'o' || conversion == 'x' ||
             conversion == 'X') {
    int64_t number = 0;
    if (!ReadStringInteger(
            input, 0, std::numeric_limits<uint32_t>::max(), &number)) {
      return false;
    }
    *output += FormatValue(specifier, static_cast<unsigned int>(number));
  } else {
    if (!input->IsNumber()) {
      Nan::ThrowTypeError("Expected a numeric formatting argument");
      return false;
    }
    const double number = Nan::To<double>(input).FromJust();
    if (!std::isfinite(number)) {
      Nan::ThrowRangeError("Expected a finite formatting argument");
      return false;
    }
    *output += FormatValue(specifier, number);
  }

  if (output->size() > kFormatLimit) {
    Nan::ThrowRangeError("Formatted output exceeds the limit");
    return false;
  }
  return true;
}

}  // namespace

bool FormatStringScalars(v8::Local<v8::Value> input_format,
                         v8::Local<v8::Value> input_values,
                         Rml::String* result,
                         uint32_t* length) {
  Rml::String format;
  if (!ReadString(input_format, &format)) {
    return false;
  }
  if (format.find('\0') != Rml::String::npos) {
    Nan::ThrowTypeError("A format string cannot contain NUL");
    return false;
  }
  if (format.size() > kFormatLimit) {
    Nan::ThrowRangeError("Format string exceeds the limit");
    return false;
  }
  if (!input_values->IsArray()) {
    Nan::ThrowTypeError("Expected a typed formatting argument array");
    return false;
  }

  auto array = input_values.As<v8::Array>();
  FormatArguments arguments;
  arguments.values.reserve(array->Length());
  for (uint32_t i = 0; i < array->Length(); ++i) {
    v8::Local<v8::Value> value;
    if (!Nan::Get(array, i).ToLocal(&value)) {
      return false;
    }
    arguments.values.push_back(value);
  }

  Rml::String output;
  for (size_t position = 0; position < format.size();) {
    if (format[position] != '%') {
      output += format[position++];
    } else if (position + 1 < format.size() && format[position + 1] == '%') {
      output += '%';
      position += 2;
    } else {
      FormatSpecifier specifier;
      v8::Local<v8::Value> value;
      if (!ReadSpecifier(format, &position, &arguments, &specifier) ||
          !arguments.Take(&value) || !AppendValue(specifier, value, &output)) {
        return false;
      }
    }
    if (output.size() > kFormatLimit) {
      Nan::ThrowRangeError("Formatted output exceeds the limit");
      return false;
    }
  }
  if (arguments.next != arguments.values.size()) {
    Nan::ThrowTypeError("Unused typed formatting arguments");
    return false;
  }

  *length = static_cast<uint32_t>(output.size());
  if (output.size() < kNativeInternalBufferSize) {
    const auto zero = output.find('\0');
    if (zero != Rml::String::npos) {
      output.resize(zero);
    }
  }
  *result = std::move(output);
  return true;
}

namespace {

NAN_METHOD(FormatTypedString) {
  Rml::String output;
  uint32_t length = 0;
  if (!FormatStringScalars(info[0], info[1], &output, &length)) {
    return;
  }

  auto result = Nan::New<v8::Object>();
  result
      ->CreateDataProperty(Nan::GetCurrentContext(),
                           Nan::New("value").ToLocalChecked(),
                           WriteString(output))
      .FromJust();
  result
      ->CreateDataProperty(Nan::GetCurrentContext(),
                           Nan::New("length").ToLocalChecked(),
                           Nan::New(length))
      .FromJust();
  info.GetReturnValue().Set(result);
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlStringFormatting) {
  SetStringMethod<FormatTypedString>(target, "formatTypedString");
}

}  // namespace sfmlrmlui
