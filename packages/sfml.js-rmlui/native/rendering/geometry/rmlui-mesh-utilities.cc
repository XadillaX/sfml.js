// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/MeshUtilities.h>
#include <sfml-js-interop.h>

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <limits>
#include <memory>
#include <vector>

#include "native/data/rmlui-data-diagnostics.h"
#include "native/rendering/geometry/rmlui-mesh.h"

namespace sfmlrmlui {
namespace {

constexpr size_t kCommandStride = 40;

struct CommandBuffer {
  std::shared_ptr<v8::BackingStore> backing;
  const float* data = nullptr;
  size_t count = 0;
};

bool ReadCommands(v8::Local<v8::Value> input,
                  v8::Local<v8::Value> count,
                  CommandBuffer* result) {
  if (!input->IsFloat32Array()) {
    Nan::ThrowTypeError("Expected a mesh command Float32Array");
    return false;
  }
  const auto view = input.As<v8::Float32Array>();
  const auto buffer = view->Buffer();
  if (buffer->WasDetached()) {
    Nan::ThrowTypeError("Cannot use detached mesh commands");
    return false;
  }

  result->backing = buffer->GetBackingStore();
  if (result->backing->IsShared()) {
    Nan::ThrowTypeError("Cannot use concurrently shared mesh commands");
    return false;
  }
  if (view->Length() % kCommandStride) {
    Nan::ThrowRangeError("Mesh commands require complete records");
    return false;
  }
  result->count = view->Length() / kCommandStride;
  if (!count->IsUndefined()) {
    if (!count->IsUint32() ||
        Nan::To<uint32_t>(count).FromJust() > result->count) {
      Nan::ThrowRangeError("Mesh command count exceeds its allocation");
      return false;
    }
    result->count = Nan::To<uint32_t>(count).FromJust();
  }

  result->data =
      result->count ? reinterpret_cast<const float*>(
                          static_cast<const uint8_t*>(result->backing->Data()) +
                          view->ByteOffset())
                    : nullptr;
  return true;
}

Rml::ColourbPremultiplied Colour(const float* record) {
  return Rml::ColourbPremultiplied(static_cast<Rml::byte>(record[0]),
                                   static_cast<Rml::byte>(record[1]),
                                   static_cast<Rml::byte>(record[2]),
                                   static_cast<Rml::byte>(record[3]));
}

bool ValidateColour(const float* record) {
  for (int i = 0; i < 4; ++i) {
    if (!std::isfinite(record[i]) || record[i] < 0 || record[i] > 255 ||
        std::trunc(record[i]) != record[i]) {
      Nan::ThrowRangeError("Mesh colours require integer RGBA bytes");
      return false;
    }
  }
  return true;
}

bool ValidateNumbers(const float* record, size_t count) {
  for (size_t i = 0; i < count; ++i) {
    // Derived box sums and quad endpoints must stay within float32 range.
    if (!std::isfinite(record[i]) ||
        std::abs(record[i]) > std::numeric_limits<float>::max() / 16) {
      Nan::ThrowRangeError("Mesh coordinates exceed finite native bounds");
      return false;
    }
  }
  return true;
}

bool ValidateCommand(const float* command, size_t* vertices, size_t* indices) {
  const float operation = command[0];
  if (!std::isfinite(operation) || operation < 0 || operation > 3 ||
      std::trunc(operation) != operation) {
    Nan::ThrowRangeError("Invalid mesh command operation");
    return false;
  }

  if (operation <= 1) {
    if (!ValidateNumbers(command + 1, 4) || !ValidateColour(command + 5) ||
        (operation == 0 && !ValidateNumbers(command + 9, 4))) {
      return false;
    }
    *vertices += 4;
    *indices += 6;
    return true;
  }

  if (!ValidateNumbers(command + 1, 12) || !ValidateColour(command + 13)) {
    return false;
  }
  if (command[1] < 0 || command[2] < 0) {
    Nan::ThrowRangeError("Mesh fill dimensions must be nonnegative");
    return false;
  }

  size_t points = 0;
  for (int i = 0; i < 4; ++i) {
    const float width = command[5 + i];
    const float radius = command[9 + i];
    if (width < 0 || radius < 0 ||
        radius > static_cast<float>(std::numeric_limits<int>::max())) {
      Nan::ThrowRangeError("Mesh border widths or radii exceed native bounds");
      return false;
    }
    // Upstream scales radii down and emits at most 100 points per corner.
    points += radius > 0 ? std::clamp<size_t>(
                               4 + static_cast<size_t>(radius / 6), 2, 100)
                         : 1;
  }
  const bool background = command[16] > 0 && command[1] > 0 && command[2] > 0;
  bool border = false;
  if (operation == 3) {
    for (int i = 0; i < 4; ++i) {
      if (!ValidateColour(command + 17 + i * 4)) {
        return false;
      }
      border |= command[5 + i] > 0 && command[20 + i * 4] > 0;
    }
  }

  const size_t maximum_vertices =
      (background ? points : 0) + (border ? 2 * points + 16 : 0);
  *vertices += maximum_vertices;
  *indices += maximum_vertices * 6;
  return true;
}

Rml::RenderBox Box(const float* command) {
  return Rml::RenderBox(Rml::Vector2f(command[1], command[2]),
                        Rml::Vector2f(command[3], command[4]),
                        {command[5], command[6], command[7], command[8]},
                        {command[9], command[10], command[11], command[12]});
}

void ExecuteCommand(Rml::Mesh* mesh, const float* command) {
  switch (static_cast<int>(command[0])) {
    case 0:
      Rml::MeshUtilities::GenerateQuad(*mesh,
                                       Rml::Vector2f(command[1], command[2]),
                                       Rml::Vector2f(command[3], command[4]),
                                       Colour(command + 5),
                                       Rml::Vector2f(command[9], command[10]),
                                       Rml::Vector2f(command[11], command[12]));
      break;
    case 1:
      Rml::MeshUtilities::GenerateLine(*mesh,
                                       Rml::Vector2f(command[1], command[2]),
                                       Rml::Vector2f(command[3], command[4]),
                                       Colour(command + 5));
      break;
    case 2:
      Rml::MeshUtilities::GenerateBackground(
          *mesh, Box(command), Colour(command + 13));
      break;
    case 3: {
      Rml::ColourbPremultiplied borders[4];
      for (int i = 0; i < 4; ++i) {
        borders[i] = Colour(command + 17 + i * 4);
      }
      Rml::MeshUtilities::GenerateBackgroundBorder(
          *mesh, Box(command), Colour(command + 13), borders);
      break;
    }
  }
}

NAN_METHOD(AllocateCommands) {
  RecordDiagnosticUtility(&DataDiagnostics::utility_entries);
  if (!info[0]->IsUint32() ||
      Nan::To<uint32_t>(info[0]).FromJust() >
          std::numeric_limits<int>::max() / (kCommandStride * sizeof(float))) {
    return Nan::ThrowRangeError(
        "Mesh command allocation exceeds native bounds");
  }

  auto owner = std::make_shared<std::vector<float>>(
      Nan::To<uint32_t>(info[0]).FromJust() * kCommandStride);
  RecordDiagnosticUtility(&DataDiagnostics::utility_allocations);
  RecordDiagnosticUtility(&DataDiagnostics::utility_allocated_bytes,
                          owner->size() * sizeof(float));
  auto buffer = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                  owner,
                                  owner->data(),
                                  owner->size() * sizeof(float));
  info.GetReturnValue().Set(v8::Float32Array::New(buffer, 0, owner->size()));
}

NAN_METHOD(AppendCommands) {
  RecordDiagnosticUtility(&DataDiagnostics::utility_entries);
  CommandBuffer commands;
  if (!ReadCommands(info[1], info[2], &commands)) {
    return;
  }

  size_t vertices = 0;
  size_t indices = 0;
  for (size_t i = 0; i < commands.count; ++i) {
    if (!ValidateCommand(
            commands.data + i * kCommandStride, &vertices, &indices)) {
      return;
    }
    if (vertices > std::numeric_limits<int>::max() / sizeof(Rml::Vertex) ||
        indices > std::numeric_limits<int>::max() / sizeof(int)) {
      return Nan::ThrowRangeError(
          "Generated mesh exceeds native buffer bounds");
    }
  }

  if (auto* mesh = PrepareMeshAppend(info[0], vertices, indices)) {
    RecordDiagnosticUtility(&DataDiagnostics::utility_commands, commands.count);
    for (size_t i = 0; i < commands.count; ++i) {
      ExecuteCommand(mesh, commands.data + i * kCommandStride);
    }
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlMeshUtilities) {
  sfmljs::SetMethod<AllocateCommands>(target, "meshAllocateCommands");
  sfmljs::SetMethod<AppendCommands>(target, "meshAppendCommands");
}

}  // namespace sfmlrmlui
