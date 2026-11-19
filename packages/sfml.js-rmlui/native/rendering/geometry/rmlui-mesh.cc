// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/geometry/rmlui-mesh.h"

#include <sfml-js-interop.h>

#include <algorithm>
#include <cmath>
#include <cstddef>
#include <limits>
#include <memory>
#include <utility>

#include "native/data/rmlui-data-diagnostics.h"

namespace sfmlrmlui {
namespace {

struct MeshState {
  std::shared_ptr<Rml::Mesh> value = std::make_shared<Rml::Mesh>();
};

using MeshHandle = sfmljs::SharedHandle<MeshState>;

MeshState* MeshOf(v8::Local<v8::Value> input) {
  auto* handle = MeshHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected an owned mesh");
    return nullptr;
  }
  return handle->owner().get();
}

bool ReadCount(v8::Local<v8::Value> input, size_t stride, size_t* result) {
  if (!input->IsUint32() || Nan::To<uint32_t>(input).FromJust() >
                                std::numeric_limits<int>::max() / stride) {
    Nan::ThrowRangeError("Mesh count exceeds native buffer bounds");
    return false;
  }
  *result = Nan::To<uint32_t>(input).FromJust();
  return true;
}

NAN_METHOD(CreateMesh) {
  size_t vertices;
  size_t indices;
  if (!ReadCount(info[0], sizeof(Rml::Vertex), &vertices) ||
      !ReadCount(info[1], sizeof(int), &indices)) {
    return;
  }
  Rml::Mesh mesh;
  mesh.vertices.resize(vertices);
  mesh.indices.resize(indices);
  info.GetReturnValue().Set(WrapMesh(std::move(mesh)));
}

NAN_METHOD(GetVertices) {
  if (auto* state = MeshOf(info[0])) {
    auto& mesh = state->value;
    static_assert(sizeof(Rml::Vertex) == 20);
    static_assert(offsetof(Rml::Vertex, position) == 0);
    static_assert(offsetof(Rml::Vertex, colour) == 8);
    static_assert(offsetof(Rml::Vertex, tex_coord) == 12);
    const size_t bytes = mesh->vertices.size() * sizeof(Rml::Vertex);
    auto buffer = sfmljs::MapShared(
        v8::Isolate::GetCurrent(), mesh, mesh->vertices.data(), bytes);
    info.GetReturnValue().Set(v8::Uint8Array::New(buffer, 0, bytes));
  }
}

NAN_METHOD(GetIndices) {
  if (auto* state = MeshOf(info[0])) {
    auto& mesh = state->value;
    static_assert(sizeof(int) == sizeof(int32_t));
    const size_t count = mesh->indices.size();
    auto buffer = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                    mesh,
                                    mesh->indices.data(),
                                    count * sizeof(int));
    info.GetReturnValue().Set(v8::Int32Array::New(buffer, 0, count));
  }
}

NAN_METHOD(IsValid) {
  if (auto* state = MeshOf(info[0])) {
    info.GetReturnValue().Set(static_cast<bool>(*state->value));
  }
}

NAN_METHOD(VertexCount) {
  if (auto* state = MeshOf(info[0])) {
    info.GetReturnValue().Set(
        static_cast<double>(state->value->vertices.size()));
  }
}

NAN_METHOD(Resize) {
  size_t vertices;
  size_t indices;
  if (!ReadCount(info[1], sizeof(Rml::Vertex), &vertices) ||
      !ReadCount(info[2], sizeof(int), &indices)) {
    return;
  }

  if (auto* state = MeshOf(info[0])) {
    const auto& previous = *state->value;
    auto next = std::make_shared<Rml::Mesh>();
    next->vertices.resize(vertices);
    next->indices.resize(indices);

    const size_t copied_vertices = std::min(vertices, previous.vertices.size());
    const size_t copied_indices = std::min(indices, previous.indices.size());
    std::copy_n(
        previous.vertices.begin(), copied_vertices, next->vertices.begin());
    std::copy_n(
        previous.indices.begin(), copied_indices, next->indices.begin());

    const size_t copied_bytes =
        copied_vertices * sizeof(Rml::Vertex) + copied_indices * sizeof(int);
    if (copied_bytes) {
      RecordDiagnosticUtility(&DataDiagnostics::utility_mesh_prefix_copies);
      RecordDiagnosticUtility(
          &DataDiagnostics::utility_mesh_prefix_copied_bytes, copied_bytes);
    }
    RecordDiagnosticUtility(&DataDiagnostics::utility_mesh_reallocations,
                            (vertices != 0) + (indices != 0));
    RecordDiagnosticUtility(&DataDiagnostics::utility_mesh_reserved_bytes,
                            next->vertices.capacity() * sizeof(Rml::Vertex) +
                                next->indices.capacity() * sizeof(int));

    state->value = std::move(next);
  }
}

NAN_METHOD(Equals) {
  auto* left = MeshOf(info[0]);
  auto* right = MeshOf(info[1]);
  if (left && right) {
    info.GetReturnValue().Set(*left->value == *right->value);
  }
}

}  // namespace

v8::Local<v8::Object> WrapMesh(Rml::Mesh value) {
  auto state = std::make_shared<MeshState>();
  *state->value = std::move(value);
  return MeshHandle::Create(std::move(state));
}

Rml::Mesh* PrepareMeshAppend(v8::Local<v8::Value> input,
                             size_t vertices,
                             size_t indices) {
  auto* state = MeshOf(input);
  if (!state) {
    return nullptr;
  }

  constexpr size_t vertex_limit =
      std::numeric_limits<int>::max() / sizeof(Rml::Vertex);
  constexpr size_t index_limit = std::numeric_limits<int>::max() / sizeof(int);
  if (vertices > vertex_limit - state->value->vertices.size() ||
      indices > index_limit - state->value->indices.size()) {
    Nan::ThrowRangeError("Generated mesh exceeds native buffer bounds");
    return nullptr;
  }
  if (!vertices && !indices) {
    return state->value.get();
  }

  auto next = state->value.use_count() == 1
                  ? state->value
                  : std::make_shared<Rml::Mesh>(*state->value);
  if (next != state->value) {
    RecordDiagnosticUtility(&DataDiagnostics::utility_mesh_prefix_copies);
    RecordDiagnosticUtility(
        &DataDiagnostics::utility_mesh_prefix_copied_bytes,
        state->value->vertices.size() * sizeof(Rml::Vertex) +
            state->value->indices.size() * sizeof(int));
  }

  auto reserve = [](auto& storage, size_t additional, size_t limit) {
    const size_t required = storage.size() + additional;
    if (required > storage.capacity()) {
      storage.reserve(
          std::max(required, std::min(limit, storage.capacity() * 2)));
      RecordDiagnosticUtility(&DataDiagnostics::utility_mesh_reallocations);
      RecordDiagnosticUtility(&DataDiagnostics::utility_mesh_reserved_bytes,
                              storage.capacity() * sizeof(storage[0]));
    }
  };
  reserve(next->vertices, vertices, vertex_limit);
  reserve(next->indices, indices, index_limit);
  state->value = std::move(next);
  return state->value.get();
}

bool TakeMesh(v8::Local<v8::Value> input, Rml::Mesh* result) {
  auto* state = MeshOf(input);
  if (!state) {
    return false;
  }
  const auto& mesh = *state->value;
  if (mesh.indices.size() % 3) {
    Nan::ThrowRangeError("Mesh indices must contain complete triangles");
    return false;
  }
  for (int index : mesh.indices) {
    if (index < 0 || static_cast<size_t>(index) >= mesh.vertices.size()) {
      Nan::ThrowRangeError("Mesh index is outside the vertex allocation");
      return false;
    }
  }
  for (const auto& vertex : mesh.vertices) {
    if (!std::isfinite(vertex.position.x) ||
        !std::isfinite(vertex.position.y) ||
        !std::isfinite(vertex.tex_coord.x) ||
        !std::isfinite(vertex.tex_coord.y)) {
      Nan::ThrowRangeError("Mesh coordinates must be finite");
      return false;
    }
  }
  // Empty meshes are not moved by upstream MakeGeometry.
  if (mesh) {
    auto empty = std::make_shared<Rml::Mesh>();
    *result = mesh;
    state->value = std::move(empty);
  }
  return true;
}

NAN_MODULE_INIT(InitializeRmlMesh) {
  sfmljs::SetMethod<CreateMesh>(target, "createMesh");
  sfmljs::SetMethod<GetVertices>(target, "meshVertices");
  sfmljs::SetMethod<GetIndices>(target, "meshIndices");
  sfmljs::SetMethod<IsValid>(target, "meshIsValid");
  sfmljs::SetMethod<VertexCount>(target, "meshVertexCount");
  sfmljs::SetMethod<Resize>(target, "meshResize");
  sfmljs::SetMethod<Equals>(target, "meshEquals");
}

}  // namespace sfmlrmlui
