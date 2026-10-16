#include "graphics-state.h"
#include "exception-boundary.h"
#include "shared-handle.h"

#include <cstring>
#include <exception>
#include <vector>
#include <SFML/Window/Context.hpp>
#define GL_SILENCE_DEPRECATION
#include <SFML/OpenGL.hpp>

namespace sfmljs {
SFMLJS_MEMBER(BufferCount, sf::VertexBuffer, std::size_t, m_size);
SFMLJS_MEMBER(BufferType, sf::VertexBuffer, sf::PrimitiveType, m_primitiveType);
SFMLJS_MEMBER(BufferUsage, sf::VertexBuffer, sf::VertexBuffer::Usage, m_usage);
SFMLJS_MEMBER(BufferId, sf::VertexBuffer, unsigned int, m_buffer);
}  // namespace sfmljs

namespace {

using State = sfmljs::VertexBufferState;
using Handle = sfmljs::SharedHandle<State>;
using ContextHandle = sfmljs::SharedHandle<sfmljs::GraphicsContext>;

// Work performed in SFML's transient context must be submitted before that
// context is released, so a subsequently activated render target sees uploads.
struct GlAccess : sf::GlResource {
  using Lock = TransientContextLock;
};

struct UploadContext {
  const bool transient = sf::Context::getActiveContextId() == 0;
  const GlAccess::Lock lock;
  ~UploadContext() { if (transient) glFlush(); }
};

bool ValidCount(v8::Local<v8::Value> value) {
  return value->IsUint32() &&
      Nan::To<std::uint32_t>(value).FromJust() <= sfmljs::kMaxVertices;
}

NAN_METHOD(CreateVertexBuffer) {
  auto* context = ContextHandle::From(info[0]);
  if (!context) return;
  if (!info[1]->IsUint32() || Nan::To<unsigned>(info[1]).FromJust() > 5 ||
      !info[2]->IsUint32() || Nan::To<unsigned>(info[2]).FromJust() > 2) {
    return Nan::ThrowRangeError("Invalid vertex buffer type or usage");
  }
  Handle* source{};
  if (!info[3]->IsUndefined()) {
    source = Handle::From(info[3]);
    if (!source) return;
  }
  try {
    auto owner = context->owner();
    const auto id = owner->nextId++;
    auto buffer = sfmljs::MakeThreadOwned<State>(owner, id,
        static_cast<sf::PrimitiveType>(Nan::To<unsigned>(info[1]).FromJust()),
        static_cast<sf::VertexBuffer::Usage>(Nan::To<unsigned>(info[2]).FromJust()));
    const UploadContext upload;
    if (source && source->owner()->getVertexCount() != 0 &&
        (!buffer->create(source->owner()->getVertexCount()) ||
         !buffer->update(*source->owner()))) {
      return sfmljs::ThrowError("Could not copy vertex buffer");
    }
    owner->vertexBuffers.emplace(id, buffer);
    auto result = Nan::New<v8::Object>();
    using namespace sfmljs;
    Nan::Set(result, Nan::New("info").ToLocalChecked(), NumericFields()
        .Add("count", Field<BufferCount>(*buffer),
             sizeof(std::size_t) == 8 ? "size64" : "u32")
        .Add("primitiveType", Field<BufferType>(*buffer))
        .Add("usage", Field<BufferUsage>(*buffer))
        .Add("nativeHandle", Field<BufferId>(*buffer)).Map(buffer)).FromJust();
    Nan::Set(result, Nan::New("handle").ToLocalChecked(),
             Handle::Create(buffer)).FromJust();
    Nan::Set(result, Nan::New("id").ToLocalChecked(), Nan::New(id)).FromJust();
    info.GetReturnValue().Set(result);
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(AllocateVertexBuffer) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  if (!ValidCount(info[1])) return Nan::ThrowRangeError("Invalid vertex count");
  try {
    const UploadContext upload;
    auto& buffer = *handle->owner();
    if (buffer.create(Nan::To<unsigned>(info[1]).FromJust())) {
      info.GetReturnValue().Set(true);
    }
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(UpdateVertexBuffer) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsUint8Array() || !ValidCount(info[2]) ||
      !info[3]->IsUint32()) {
    return Nan::ThrowTypeError("Expected vertex bytes, count and offset");
  }
  const auto count = Nan::To<unsigned>(info[2]).FromJust();
  const auto offset = Nan::To<unsigned>(info[3]).FromJust();
  Nan::TypedArrayContents<std::uint8_t> bytes(info[1]);
  if (count > bytes.length() / sizeof(sf::Vertex)) {
    return Nan::ThrowRangeError("Not enough source vertices");
  }
  try {
    const UploadContext upload;
    // Public VertexArray storage is already aligned; raw internal callers may
    // provide an unaligned subarray. Only that path needs an extra copy.
    std::vector<sf::Vertex> aligned;
    sf::Vertex empty;
    const sf::Vertex* vertices = &empty;
    if (count != 0) {
      if (reinterpret_cast<std::uintptr_t>(*bytes) % alignof(sf::Vertex)) {
        aligned.resize(count);
        std::memcpy(aligned.data(), *bytes, count * sizeof(sf::Vertex));
        vertices = aligned.data();
      } else {
        vertices = reinterpret_cast<const sf::Vertex*>(*bytes);
      }
    }
    auto& buffer = *handle->owner();
    if (buffer.update(vertices, count, offset)) {
      info.GetReturnValue().Set(true);
    }
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(CopyVertexBuffer) {
  auto* destination = Handle::From(info[0]);
  if (!destination) return;
  auto* source = Handle::From(info[1]);
  if (!source) return;
  auto& buffer = *destination->owner();
  const auto& input = *source->owner();
  if (!buffer.getNativeHandle() || !input.getNativeHandle()) return;
  try {
    const UploadContext upload;
    if (&buffer != &input) {
      if (buffer.getVertexCount() != input.getVertexCount()) {
        // SFML 3.1.0's GPU-copy path assumes equal allocation sizes and does
        // not update its count. Allocate first, preserving destination modes.
        sf::VertexBuffer replacement(buffer.getPrimitiveType(), buffer.getUsage());
        if (!replacement.create(input.getVertexCount()) ||
            !replacement.update(input)) return;
        buffer.swap(replacement);
      } else if (!buffer.update(input)) {
        return;
      }
    }
    info.GetReturnValue().Set(true);
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(SwapVertexBuffers) {
  auto* left = Handle::From(info[0]);
  if (!left) return;
  auto* right = Handle::From(info[1]);
  if (!right) return;
  left->owner()->swap(*right->owner());
}

NAN_METHOD(AssignVertexBuffer) {
  auto* target = Handle::From(info[0]);
  auto* source = Handle::From(info[1]);
  if (!target || !source || target->owner() == source->owner()) return;
  const UploadContext upload;
  const auto& input = *source->owner();
  sf::VertexBuffer replacement(input.getPrimitiveType(), input.getUsage());
  // Allocate the exact size before copying; SFML's update(buffer) assumes
  // matching allocations. An empty source also replaces the target's modes.
  if (input.getVertexCount() &&
      (!replacement.create(input.getVertexCount()) || !replacement.update(input))) {
    return sfmljs::ThrowError("Could not copy vertex buffer");
  }
  target->owner()->swap(replacement);
}

NAN_METHOD(SetVertexBufferPrimitiveType) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsUint32() || Nan::To<unsigned>(info[1]).FromJust() > 5) {
    return Nan::ThrowRangeError("Invalid primitive type");
  }
  handle->owner()->setPrimitiveType(
      static_cast<sf::PrimitiveType>(Nan::To<unsigned>(info[1]).FromJust()));
}

NAN_METHOD(SetVertexBufferUsage) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsUint32() || Nan::To<unsigned>(info[1]).FromJust() > 2) {
    return Nan::ThrowRangeError("Invalid vertex buffer usage");
  }
  handle->owner()->setUsage(
      static_cast<sf::VertexBuffer::Usage>(Nan::To<unsigned>(info[1]).FromJust()));
}

NAN_METHOD(BindVertexBuffer) {
  if (info[0]->IsNull()) return sf::VertexBuffer::bind(nullptr);
  auto* handle = Handle::From(info[0]);
  if (handle) sf::VertexBuffer::bind(handle->owner().get());
}

NAN_METHOD(IsVertexBufferAvailable) {
  info.GetReturnValue().Set(sf::VertexBuffer::isAvailable());
}

}  // namespace

NAN_MODULE_INIT(InitializeVertexBuffer) {
  sfmljs::SetMethod<CreateVertexBuffer>(target, "createVertexBuffer");
  sfmljs::SetMethod<AllocateVertexBuffer>(target, "allocateVertexBuffer");
  sfmljs::SetMethod<UpdateVertexBuffer>(target, "updateVertexBuffer");
  sfmljs::SetMethod<CopyVertexBuffer>(target, "copyVertexBuffer");
  sfmljs::SetMethod<SwapVertexBuffers>(target, "swapVertexBuffers");
  sfmljs::SetMethod<AssignVertexBuffer>(target, "assignVertexBuffer");
  sfmljs::SetMethod<SetVertexBufferPrimitiveType>(target, "setVertexBufferPrimitiveType");
  sfmljs::SetMethod<SetVertexBufferUsage>(target, "setVertexBufferUsage");
  sfmljs::SetMethod<BindVertexBuffer>(target, "bindVertexBuffer");
  sfmljs::SetMethod<IsVertexBufferAvailable>(target, "isVertexBufferAvailable");
}
