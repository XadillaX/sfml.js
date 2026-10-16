#include "vertex-storage.h"
#include "exception-boundary.h"
#include "value-binding.h"

#include <exception>

namespace {

using Storage = sfmljs::VertexStorage;
using Handle = sfmljs::SharedHandle<Storage>;

NAN_METHOD(CreateVertexStorage) {
  if (!info[0]->IsUint32() ||
      Nan::To<std::uint32_t>(info[0]).FromJust() > sfmljs::kMaxVertices) {
    return Nan::ThrowRangeError("Vertex capacity exceeds the buffer limit");
  }
  try {
    auto storage = std::make_shared<Storage>(
        Nan::To<std::uint32_t>(info[0]).FromJust());
    auto result = Nan::New<v8::Object>();
    auto buffer = storage->empty() ? v8::ArrayBuffer::New(info.GetIsolate(), 0)
        : sfmljs::MapShared(info.GetIsolate(), storage, storage->data(),
                            storage->size() * sizeof(sf::Vertex));
    Nan::Set(result, Nan::New("handle").ToLocalChecked(),
             Handle::Create(storage)).FromJust();
    Nan::Set(result, Nan::New("buffer").ToLocalChecked(), buffer).FromJust();
    info.GetReturnValue().Set(result);
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(VertexStorageMember) {
  auto* storage = Handle::From(info[0]);
  if (!storage) return;
  if (!info[1]->IsUint32() ||
      Nan::To<std::uint32_t>(info[1]).FromJust() >= storage->owner()->size()) {
    return Nan::ThrowRangeError("Vertex index is out of range");
  }
  const auto index = Nan::To<std::uint32_t>(info[1]).FromJust();
  sfmljs::values::ReturnMapped(info, std::shared_ptr<sf::Vertex>(
      storage->owner(), &(*storage->owner())[index]));
}

}  // namespace

NAN_MODULE_INIT(InitializeVertexStorage) {
  sfmljs::SetMethod<CreateVertexStorage>(target, "createVertexStorage");
  sfmljs::SetMethod<VertexStorageMember>(target, "vertexStorageMember");
}
