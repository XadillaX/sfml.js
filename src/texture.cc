#include "texture.h"
#include "image.h"
#include "rect.h"
#include "vector2.h"
#include "workers/load_from_file_worker.h"

namespace node_sfml {
namespace texture {

using std::string;
using v8::Function;
using v8::FunctionTemplate;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::String;
using v8::Value;

Nan::Persistent<Function> constructor;

NAN_MODULE_INIT(Texture::Init) {
  Local<String> name = Nan::New("Texture").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  Nan::SetPrototypeMethod(tpl, "create", Create);
  Nan::SetPrototypeMethod(tpl, "loadFromFile", LoadFromFile);
  Nan::SetPrototypeMethod(tpl, "loadFromMemory", LoadFromMemory);
  Nan::SetPrototypeMethod(tpl, "loadFromFileSync", LoadFromFileSync);
  Nan::SetPrototypeMethod(tpl, "getSize", GetSize);

  Nan::SetPrototypeMethod(tpl, "updateByImage", UpdateByImage);
  Nan::SetPrototypeMethod(tpl, "updateByPixels", UpdateByPixels);
  Nan::SetPrototypeMethod(tpl, "updateByTexture", UpdateByTexture);

  Nan::SetPrototypeMethod(tpl, "setSmooth", SetSmooth);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  Nan::Set(target, name, func);
}

NAN_METHOD(Texture::New) {
  Texture* texture = new Texture();
  texture->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(Texture::Create) {
  Texture* texture = Nan::ObjectWrap::Unwrap<Texture>(info.Holder());
  sf::Uint32 w = Nan::To<sf::Uint32>(info[0]).FromJust();
  sf::Uint32 h = Nan::To<sf::Uint32>(info[1]).FromJust();
  texture->_texture.create(w, h);
}

inline bool LoadFromFileFunction(void* target,
                                 const std::string& filename,
                                 void* context) {
  sf::IntRect* rect = static_cast<sf::IntRect*>(context);
  Texture* texture = static_cast<Texture*>(target);
  return texture->mutable_texture().loadFromFile(filename, *rect);
}

// TODO(XadillaX): more Node.js-styled `LoadFromFile`
NAN_METHOD(Texture::LoadFromFile) {
  Texture* texture = Nan::ObjectWrap::Unwrap<Texture>(info.Holder());
  if (texture->_loading) {
    Local<Value> err = Nan::Error("Texture is loading.");
    info.GetReturnValue().Set(err);

    return;
  }

  texture->_loading = true;
  Local<String> v8_filename = info[0].As<String>();
  Nan::Utf8String utf8_filename(v8_filename);
  Nan::Callback* callback = new Nan::Callback(info[2].As<Function>());
  std::shared_ptr<sf::IntRect> area = std::make_shared<sf::IntRect>();

  if (!info[1]->IsUndefined()) {
    *area.get() =
        Nan::ObjectWrap::Unwrap<rect::IntRect>(info[1].As<Object>())->rect();
  }

  load_from_file_worker::LoadFromFileWorker<Texture, sf::IntRect>* worker =
      new load_from_file_worker::LoadFromFileWorker<Texture, sf::IntRect>(
          info.Holder(), *utf8_filename, LoadFromFileFunction, area, callback);
  Nan::AsyncQueueWorker(worker);
}

NAN_METHOD(Texture::LoadFromMemory) {
  Texture* txt = Nan::ObjectWrap::Unwrap<Texture>(info.Holder());
  if (txt->_loading) {
    Nan::ThrowError("Texture is loading.");
    return;
  }

  const char* buff = node::Buffer::Data(info[0]);
  size_t length = node::Buffer::Length(info[0]);

  sf::IntRect area;
  if (!info[1]->IsUndefined()) {
    area = Nan::ObjectWrap::Unwrap<rect::IntRect>(info[1].As<Object>())->rect();
  }

  info.GetReturnValue().Set(txt->_texture.loadFromMemory(buff, length, area));
}

NAN_METHOD(Texture::LoadFromFileSync) {
  Texture* texture = Nan::ObjectWrap::Unwrap<Texture>(info.Holder());
  if (texture->_loading) {
    Local<Value> err = Nan::Error("Texture is loading.");
    info.GetReturnValue().Set(err);

    return;
  }

  Local<String> v8_filename = info[0].As<String>();
  Nan::Utf8String utf8_filename(v8_filename);

  sf::IntRect area;
  if (!info[1]->IsUndefined()) {
    area = Nan::ObjectWrap::Unwrap<rect::IntRect>(info[1].As<Object>())->rect();
  }

  info.GetReturnValue().Set(
      texture->_texture.loadFromFile(*utf8_filename, area));
}

NAN_METHOD(Texture::GetSize) {
  Texture* texture = Nan::ObjectWrap::Unwrap<Texture>(info.Holder());
  if (texture->_loading) {
    Nan::ThrowError("Texture is loading.");
    return;
  }

  sf::Vector2u size = texture->_texture.getSize();

  Nan::TryCatch try_catch;
  MaybeLocal<Value> size_obj =
      vector2::Vector2<sf::Uint32, sf::Uint32, v8::Uint32>::NewRealInstance(
          info.GetIsolate(), size);
  if (size_obj.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }

  info.GetReturnValue().Set(size_obj.ToLocalChecked());
}

NAN_METHOD(Texture::SetSmooth) {
  Texture* texture = Nan::ObjectWrap::Unwrap<Texture>(info.Holder());
  bool smooth = Nan::To<bool>(info[0]).FromJust();
  texture->_texture.setSmooth(smooth);
}

NAN_METHOD(Texture::UpdateByTexture) {
  Texture* texture = Nan::ObjectWrap::Unwrap<Texture>(info.Holder());
  if (texture->_loading) {
    Nan::ThrowError("Texture is loading.");
    return;
  }

  Texture* another = Nan::ObjectWrap::Unwrap<Texture>(info[0].As<Object>());
  if (info.Length() <= 1) {
    texture->_texture.update(another->_texture);
    return;
  }

  sf::Uint32 x = Nan::To<sf::Uint32>(info[1]).FromJust();
  sf::Uint32 y = Nan::To<sf::Uint32>(info[2]).FromJust();
  texture->_texture.update(another->_texture, x, y);
}

NAN_METHOD(Texture::UpdateByPixels) {
  Texture* texture = Nan::ObjectWrap::Unwrap<Texture>(info.Holder());
  if (texture->_loading) {
    Nan::ThrowError("Texture is loading.");
    return;
  }

  sf::Vector2u texture_size = texture->_texture.getSize();
  size_t width = texture_size.x;
  size_t height = texture_size.y;
  size_t x = 0;
  size_t y = 0;
  if (!info[1]->IsUndefined()) {
    width = Nan::To<sf::Uint32>(info[0]).FromJust();
  }
  if (!info[2]->IsUndefined()) {
    height = Nan::To<sf::Uint32>(info[1]).FromJust();
  }
  if (!info[3]->IsUndefined()) {
    x = Nan::To<sf::Uint32>(info[2]).FromJust();
  }
  if (!info[4]->IsUndefined()) {
    y = Nan::To<sf::Uint32>(info[3]).FromJust();
  }

  Local<Object> buffer_object = info[0].As<Object>();
  size_t len = node::Buffer::Length(buffer_object);

  if (len < ((width * height) << 2)) {
    Nan::ThrowError("Buffer's length is too short.");
    return;
  }

  if (width + x > texture_size.x || height + y > texture_size.y) {
    Nan::ThrowError("width / height / x / y out of range.");
    return;
  }

  sf::Uint8* buff =
      reinterpret_cast<sf::Uint8*>(node::Buffer::Data(buffer_object));
  texture->_texture.update(buff, width, height, x, y);
}

NAN_METHOD(Texture::UpdateByImage) {
  Texture* texture = Nan::ObjectWrap::Unwrap<Texture>(info.Holder());
  if (texture->_loading) {
    Nan::ThrowError("Texture is loading.");
    return;
  }

  image::Image* img =
      Nan::ObjectWrap::Unwrap<image::Image>(info[0].As<Object>());
  if (info.Length() <= 1) {
    texture->_texture.update(img->image());
    return;
  }

  sf::Uint32 x = Nan::To<sf::Uint32>(info[1]).FromJust();
  sf::Uint32 y = Nan::To<sf::Uint32>(info[2]).FromJust();
  texture->_texture.update(img->image(), x, y);
}

Texture::Texture() : _texture() {}
Texture::Texture(const Texture& texture) : _texture(texture._texture) {}
Texture::~Texture() {}

}  // namespace texture
}  // namespace node_sfml
