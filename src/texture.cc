#include "texture.h"
#include "rect.h"
#include "vector2.h"

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

class LoadFromFileWorker : public Nan::AsyncWorker {
 public:
  LoadFromFileWorker(Local<Object> texture,
                     const string& filename,
                     const sf::IntRect& rect,
                     Nan::Callback* callback)
      : Nan::AsyncWorker(callback),
        _texture(Nan::ObjectWrap::Unwrap<Texture>(texture)),
        _filename(filename),
        _loaded(false),
        _async_resource("texture_load_from_file"),
        _area(rect) {
    _texture_object.Reset(texture);
  }

  ~LoadFromFileWorker() {
    _texture_object.Reset();
    _texture = nullptr;
  }

  virtual void Execute() {
    _loaded = _texture->mutable_texture().loadFromFile(this->_filename);
    if (!_loaded) {
      char error[1024];
      snprintf(
          error, sizeof error, "Failed to load %s.", this->_filename.c_str());
      SetErrorMessage(error);
    }
  }

  virtual void HandleOKCallback() {
    _texture->SetLoading(false);

    Nan::HandleScope scope;
    callback->Call(0, nullptr, &_async_resource);
  }

  virtual void HandleErrorCallback() {
    _texture->SetLoading(false);

    Nan::HandleScope scope;
    Local<Value> argv[1] = {Nan::Error(ErrorMessage())};
    callback->Call(1, argv, &_async_resource);
  }

  inline Nan::AsyncResource* async_resource() { return &_async_resource; }

 private:
  Texture* _texture;
  Nan::Persistent<Object> _texture_object;
  string _filename;
  bool _loaded;
  Nan::AsyncResource _async_resource;
  sf::IntRect _area;
};

Nan::Persistent<Function> constructor;

NAN_MODULE_INIT(Texture::Init) {
  Local<String> name = Nan::New("Texture").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  Nan::SetPrototypeMethod(tpl, "loadFromFile", LoadFromFile);
  Nan::SetPrototypeMethod(tpl, "getSize", GetSize);
  Nan::SetPrototypeMethod(tpl, "updateByTexture", UpdateByTexture);

  Nan::SetPrototypeMethod(tpl, "setSmooth", SetSmooth);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  Nan::Set(target, name, func);
}

NAN_METHOD(Texture::New) {
  Texture* Texture = new class Texture();
  Texture->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
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
  sf::IntRect area;

  if (!info[1]->IsUndefined()) {
    area = Nan::ObjectWrap::Unwrap<rect::IntRect>(info[1].As<Object>())->rect();
  }

  LoadFromFileWorker* worker =
      new LoadFromFileWorker(info.Holder(), *utf8_filename, area, callback);

  Nan::AsyncQueueWorker(worker);
}

NAN_METHOD(Texture::GetSize) {
  Texture* texture = Nan::ObjectWrap::Unwrap<Texture>(info.Holder());
  if (texture->_loading) {
    Nan::ThrowError("Texture is loading.");
    return;
  }

  sf::Vector2u size = texture->_texture.getSize();

  Nan::TryCatch try_catch;
  MaybeLocal<Object> size_obj =
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

Texture::Texture() : _texture(), _loading(false) {}
Texture::Texture(const Texture& texture)
    : _texture(texture._texture), _loading(false) {}
Texture::~Texture() {}

}  // namespace texture
}  // namespace node_sfml
