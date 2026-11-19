// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/ConvolutionFilter.h>
#include <sfml-js-interop.h>

#include <cmath>
#include <cstdint>
#include <limits>
#include <memory>
#include <vector>

#include "native/data/rmlui-data-diagnostics.h"
#include "native/fonts/rmlui-font-glyph.h"

namespace sfmlrmlui {
namespace {

struct KernelStorage {
  Rml::ConvolutionFilter filter;
  Rml::Vector2i size;
  Rml::FilterOperation operation;
};

struct FilterState {
  std::shared_ptr<KernelStorage> kernel;
};

struct ByteRegion {
  std::shared_ptr<v8::BackingStore> backing;
  Rml::byte* data = nullptr;
  size_t size = 0;
};

using FilterHandle = sfmljs::SharedHandle<FilterState>;

bool Format(v8::Local<v8::Value> input, Rml::ColorFormat* result) {
  if (input->IsInt32()) {
    const int value = Nan::To<int>(input).FromJust();
    if (value == static_cast<int>(Rml::ColorFormat::A8) ||
        value == static_cast<int>(Rml::ColorFormat::RGBA8)) {
      *result = static_cast<Rml::ColorFormat>(value);
      return true;
    }
  }

  Nan::ThrowRangeError("Expected color format A8 or RGBA8");
  return false;
}

bool Region(v8::Local<v8::Value> input, int64_t bytes, ByteRegion* result) {
  if (!input->IsUint8Array()) {
    Nan::ThrowTypeError("Expected a convolution Uint8Array");
    return false;
  }

  const auto view = input.As<v8::Uint8Array>();
  const auto buffer = view->Buffer();
  if (buffer->WasDetached()) {
    Nan::ThrowTypeError("Cannot use a detached convolution buffer");
    return false;
  }

  result->backing = buffer->GetBackingStore();
  if (result->backing->IsShared()) {
    Nan::ThrowTypeError("Cannot use a concurrently shared convolution buffer");
    return false;
  }
  if (bytes < 0 || bytes > std::numeric_limits<int>::max() ||
      static_cast<uint64_t>(bytes) > view->ByteLength()) {
    Nan::ThrowRangeError("Convolution buffer is smaller than its region");
    return false;
  }

  result->size = static_cast<size_t>(bytes);
  result->data = bytes ? static_cast<Rml::byte*>(result->backing->Data()) +
                             view->ByteOffset()
                       : nullptr;
  return true;
}

std::shared_ptr<KernelStorage> KernelOf(v8::Local<v8::Value> input) {
  auto* handle = FilterHandle::From(input);
  if (!handle) {
    return nullptr;
  }
  if (!handle->owner()->kernel) {
    Nan::ThrowError("Convolution filter is not initialised");
    return nullptr;
  }
  return handle->owner()->kernel;
}

bool SafeCoordinates(int destination, int offset, int radius) {
  const int64_t first = -int64_t{offset} - radius;
  const int64_t last = int64_t{destination} - 1 - offset + radius;
  if (first < std::numeric_limits<int>::min() ||
      last > std::numeric_limits<int>::max()) {
    Nan::ThrowRangeError("Convolution coordinates exceed native int bounds");
    return false;
  }
  return true;
}

bool SafeKernel(KernelStorage* kernel, bool* negative) {
  const size_t count =
      size_t{static_cast<unsigned>(kernel->size.x)} * kernel->size.y;
  const float* weights = kernel->filter[0];
  RecordDiagnosticUtility(&DataDiagnostics::utility_kernel_weights, count);
  double magnitude = 0;
  *negative = false;
  for (size_t i = 0; i < count; ++i) {
    if (!std::isfinite(weights[i])) {
      Nan::ThrowRangeError("Convolution kernel weights must be finite");
      return false;
    }
    magnitude += std::abs(static_cast<double>(weights[i]));
    *negative |= weights[i] < 0;
  }

  // Leave ample rounding headroom in upstream's float accumulation.
  if (magnitude > std::numeric_limits<float>::max() / 512.0) {
    Nan::ThrowRangeError("Convolution kernel can overflow native opacity");
    return false;
  }
  return true;
}

bool NonnegativeOutput(KernelStorage* kernel,
                       Rml::Vector2i dimensions,
                       const ByteRegion& source,
                       Rml::Vector2i source_dimensions,
                       Rml::Vector2i offset,
                       Rml::ColorFormat format) {
  const auto radius = (kernel->size - Rml::Vector2i(1)) / 2;
  const int stride = format == Rml::ColorFormat::RGBA8 ? 4 : 1;
  const int alpha = stride - 1;
  const float* weights = kernel->filter[0];
  RecordDiagnosticUtility(
      &DataDiagnostics::utility_negative_preflight_pixels,
      size_t{static_cast<unsigned>(dimensions.x)} * dimensions.y);

  // Negative Sum weights are legal when every output remains representable.
  // Check before any destination write; ordinary nonnegative kernels skip this.
  for (int y = 0; y < dimensions.y; ++y) {
    for (int x = 0; x < dimensions.x; ++x) {
      float opacity = 0;
      for (int ky = 0; ky < kernel->size.y; ++ky) {
        const int sy = y - offset.y - radius.y + ky;
        for (int kx = 0; kx < kernel->size.x; ++kx) {
          const int sx = x - offset.x - radius.x + kx;
          if (sx >= 0 && sx < source_dimensions.x && sy >= 0 &&
              sy < source_dimensions.y) {
            opacity +=
                source.data[(sy * source_dimensions.x + sx) * stride + alpha] *
                weights[ky * kernel->size.x + kx];
          }
        }
      }
      if (opacity < 0 || !std::isfinite(opacity)) {
        Nan::ThrowRangeError("Convolution Sum produces an invalid alpha");
        return false;
      }
    }
  }
  return true;
}

NAN_METHOD(CreateFilter) {
  RecordDiagnosticUtility(&DataDiagnostics::utility_entries);
  info.GetReturnValue().Set(
      FilterHandle::Create(std::make_shared<FilterState>()));
}

NAN_METHOD(InitialiseFilter) {
  RecordDiagnosticUtility(&DataDiagnostics::utility_entries);
  Rml::Vector2i radii;
  if (info[1]->IsInt32()) {
    radii = Rml::Vector2i(Nan::To<int>(info[1]).FromJust());
  } else if (!ReadGlyphVector(info[1], &radii)) {
    return;
  }
  if (!info[2]->IsInt32() || Nan::To<int>(info[2]).FromJust() < 0 ||
      Nan::To<int>(info[2]).FromJust() > 1) {
    return Nan::ThrowRangeError(
        "Expected convolution operation Sum or Dilation");
  }

  auto* handle = FilterHandle::From(info[0]);
  if (!handle) {
    return;
  }
  if (radii.x < 0 || radii.y < 0) {
    return info.GetReturnValue().Set(false);
  }

  const int64_t width = int64_t{radii.x} * 2 + 1;
  const int64_t height = int64_t{radii.y} * 2 + 1;
  if (width > std::numeric_limits<int>::max() ||
      height > std::numeric_limits<int>::max() ||
      width * height >
          std::numeric_limits<int>::max() / static_cast<int>(sizeof(float))) {
    return Nan::ThrowRangeError("Convolution kernel exceeds native bounds");
  }

  auto next = std::make_shared<KernelStorage>();
  next->size = Rml::Vector2i(static_cast<int>(width), static_cast<int>(height));
  next->operation =
      static_cast<Rml::FilterOperation>(Nan::To<int>(info[2]).FromJust());
  const bool success = next->filter.Initialise(radii, next->operation);
  if (success) {
    RecordDiagnosticUtility(&DataDiagnostics::utility_allocations);
    RecordDiagnosticUtility(
        &DataDiagnostics::utility_allocated_bytes,
        static_cast<size_t>(width * height) * sizeof(float));
    handle->owner()->kernel = std::move(next);
  }
  info.GetReturnValue().Set(success);
}

NAN_METHOD(GetKernel) {
  RecordDiagnosticUtility(&DataDiagnostics::utility_entries);
  auto kernel = KernelOf(info[0]);
  if (!kernel) {
    return;
  }

  int row = 0;
  size_t count = size_t{static_cast<unsigned>(kernel->size.x)} * kernel->size.y;
  if (!info[1]->IsUndefined()) {
    if (!info[1]->IsInt32() || Nan::To<int>(info[1]).FromJust() < 0 ||
        Nan::To<int>(info[1]).FromJust() >= kernel->size.y) {
      return Nan::ThrowRangeError("Convolution row is outside the kernel");
    }
    row = Nan::To<int>(info[1]).FromJust();
    count = kernel->size.x;
  }

  auto buffer = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                  kernel,
                                  kernel->filter[row],
                                  count * sizeof(float));
  info.GetReturnValue().Set(v8::Float32Array::New(buffer, 0, count));
}

NAN_METHOD(AllocateBytes) {
  RecordDiagnosticUtility(&DataDiagnostics::utility_entries);
  if (!info[0]->IsUint32() ||
      Nan::To<uint32_t>(info[0]).FromJust() > std::numeric_limits<int>::max()) {
    return Nan::ThrowRangeError("Byte allocation exceeds native bounds");
  }

  auto owner = std::make_shared<std::vector<Rml::byte>>(
      Nan::To<uint32_t>(info[0]).FromJust());
  RecordDiagnosticUtility(&DataDiagnostics::utility_allocations);
  RecordDiagnosticUtility(&DataDiagnostics::utility_allocated_bytes,
                          owner->size());
  auto buffer = sfmljs::MapShared(
      v8::Isolate::GetCurrent(), owner, owner->data(), owner->size());
  info.GetReturnValue().Set(v8::Uint8Array::New(buffer, 0, owner->size()));
}

NAN_METHOD(RunFilter) {
  RecordDiagnosticUtility(&DataDiagnostics::utility_entries);
  Rml::Vector2i dimensions;
  Rml::Vector2i source_dimensions;
  Rml::Vector2i offset;
  Rml::ColorFormat destination_format;
  Rml::ColorFormat source_format;
  if (!ReadGlyphVector(info[2], &dimensions) ||
      !ReadGlyphVector(info[6], &source_dimensions) ||
      !ReadGlyphVector(info[7], &offset) ||
      !ValidateGlyphDimensions(dimensions) ||
      !ValidateGlyphDimensions(source_dimensions) ||
      !Format(info[4], &destination_format) ||
      !Format(info[8], &source_format)) {
    return;
  }
  const int destination_bpp =
      destination_format == Rml::ColorFormat::RGBA8 ? 4 : 1;
  const int source_bpp = source_format == Rml::ColorFormat::RGBA8 ? 4 : 1;
  if (!info[3]->IsInt32() ||
      Nan::To<int>(info[3]).FromJust() < dimensions.x * destination_bpp) {
    return Nan::ThrowRangeError("Convolution destination stride is too small");
  }

  const int stride = Nan::To<int>(info[3]).FromJust();
  const int64_t bytes =
      dimensions.x && dimensions.y
          ? int64_t{dimensions.y - 1} * stride + dimensions.x * destination_bpp
          : 0;
  ByteRegion destination;
  ByteRegion source;
  if (!Region(info[1], bytes, &destination) ||
      !Region(info[5],
              int64_t{source_dimensions.x} * source_dimensions.y * source_bpp,
              &source)) {
    return;
  }

  auto kernel = KernelOf(info[0]);
  bool negative;
  if (!kernel ||
      !SafeCoordinates(dimensions.x, offset.x, (kernel->size.x - 1) / 2) ||
      !SafeCoordinates(dimensions.y, offset.y, (kernel->size.y - 1) / 2) ||
      !SafeKernel(kernel.get(), &negative)) {
    return;
  }

  const auto destination_start = reinterpret_cast<uintptr_t>(destination.data);
  const auto source_start = reinterpret_cast<uintptr_t>(source.data);
  if (destination.size && source.size &&
      destination_start < source_start + source.size &&
      source_start < destination_start + destination.size) {
    return Nan::ThrowRangeError("Convolution source and destination overlap");
  }
  if (!dimensions.x || !dimensions.y) {
    return;
  }
  if (negative && kernel->operation == Rml::FilterOperation::Sum &&
      !NonnegativeOutput(kernel.get(),
                         dimensions,
                         source,
                         source_dimensions,
                         offset,
                         source_format)) {
    return;
  }

  kernel->filter.Run(destination.data,
                     dimensions,
                     stride,
                     destination_format,
                     source.data,
                     source_dimensions,
                     offset,
                     source_format);
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlConvolution) {
  sfmljs::SetMethod<CreateFilter>(target, "createConvolutionFilter");
  sfmljs::SetMethod<InitialiseFilter>(target, "convolutionInitialise");
  sfmljs::SetMethod<GetKernel>(target, "convolutionKernel");
  sfmljs::SetMethod<RunFilter>(target, "convolutionRun");
  sfmljs::SetMethod<AllocateBytes>(target, "convolutionAllocateBytes");
}

}  // namespace sfmlrmlui
