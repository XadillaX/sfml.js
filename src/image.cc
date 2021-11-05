#include "image.h"
#include "resizable_buffer.h"
#include "vector2-inl.h"
#include "workers/save_to_file_worker.h"

namespace node_sfml {
namespace image {

using std::string;
using v8::Array;
using v8::ArrayBuffer;
using v8::Function;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::String;
using v8::Uint8Array;
using v8::Value;

Nan::Persistent<Function> constructor;
Nan::Persistent<Function> real_constructor;

NAN_METHOD(SetRealConstructor) {
  real_constructor.Reset(info[0].As<v8::Function>());
}

MaybeLocal<Object> Image::NewRealInstance(Isolate* isolate) {
  v8::Local<v8::Function> cons = real_constructor.Get(isolate);
  v8::MaybeLocal<v8::Object> maybe_ret =
      cons->NewInstance(isolate->GetCurrentContext());
  return maybe_ret;
}

NAN_MODULE_INIT(Image::Init) {
  Local<String> name = Nan::New("Image").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  Nan::SetPrototypeMethod(tpl, "copy", Copy);
  Nan::SetPrototypeMethod(tpl, "create", Create);
  Nan::SetPrototypeMethod(tpl, "loadFromMemory", LoadFromMemory);
  Nan::SetPrototypeMethod(tpl, "saveToFile", SaveToFile);
  Nan::SetPrototypeMethod(tpl, "getSize", GetSize);
  Nan::SetPrototypeMethod(tpl, "createMaskFromColor", CreateMaskFromColor);
  Nan::SetPrototypeMethod(tpl, "setPixel", SetPixel);
  Nan::SetPrototypeMethod(tpl, "getPixel", GetPixel);
  Nan::SetPrototypeMethod(tpl, "duplicatePixels", DuplicatePixels);
  Nan::SetPrototypeMethod(tpl, "flipHorizontally", FlipHorizontally);
  Nan::SetPrototypeMethod(tpl, "flipVertically", FlipVertically);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  Nan::Set(target, name, func);
  Nan::SetMethod(func, "setRealConstructor", SetRealConstructor);
}

NAN_METHOD(Image::New) {
  Image* Texture = new Image();
  Texture->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(Image::Create) {
  Image* img = Nan::ObjectWrap::Unwrap<Image>(info.Holder());

  sf::Uint32 width = Nan::To<sf::Uint32>(info[0]).FromJust();
  sf::Uint32 height = Nan::To<sf::Uint32>(info[1]).FromJust();

  if (info.Length() == 2) {
    return img->CreateFromColor(width, height);
  }

  if (info[2]->IsUint8Array() || info[2]->IsArray() ||
      info[2]->IsArrayBuffer()) {
    return img->CreateFromPixels(width, height, info[2].As<Object>());
  }

  img->CreateFromColor(
      width,
      height,
      Nan::ObjectWrap::Unwrap<color::Color>(info[2].As<Object>()));
}

NAN_METHOD(Image::Copy) {
  Image* img = Nan::ObjectWrap::Unwrap<Image>(info.Holder());

  Image* another = Nan::ObjectWrap::Unwrap<Image>(info[0].As<Object>());
  sf::Uint32 destX = Nan::To<sf::Uint32>(info[1]).FromJust();
  sf::Uint32 destY = Nan::To<sf::Uint32>(info[2]).FromJust();
  rect::IntRect* rect = nullptr;
  bool apply_alpha = false;

  switch (info.Length()) {
    case 3: {
      return img->Copy(*another, destX, destY);
    }

    case 4: {
      if (info[3]->IsBoolean()) {
        apply_alpha = Nan::To<bool>(info[3]).FromJust();
        return img->Copy(*another, destX, destY, rect, apply_alpha);
      }

      rect = Nan::ObjectWrap::Unwrap<rect::IntRect>(info[3].As<Object>());
      return img->Copy(*another, destX, destY, rect);
    }

    case 5:
    default: {
      if (!info[3]->IsNullOrUndefined()) {
        rect = Nan::ObjectWrap::Unwrap<rect::IntRect>(info[3].As<Object>());
      }

      if (!info[4]->IsNullOrUndefined()) {
        apply_alpha = Nan::To<bool>(info[4]).FromJust();
      }
      return img->Copy(*another, destX, destY, rect, apply_alpha);
    }
  }
}

NAN_METHOD(Image::LoadFromMemory) {
  Image* img = Nan::ObjectWrap::Unwrap<Image>(info.Holder());
  if (img->_saving) {
    Nan::ThrowError("Image is saving to file.");
    return;
  }

  const char* buff = node::Buffer::Data(info[0]);
  size_t length = node::Buffer::Length(info[0]);
  info.GetReturnValue().Set(img->_image.loadFromMemory(buff, length));
}

NAN_METHOD(Image::SaveToFile) {
  Local<String> v8_filename = info[0].As<String>();
  Nan::Utf8String utf8_filename(v8_filename);
  Nan::Callback* callback = new Nan::Callback(info[1].As<Function>());

  save_to_file_worker::SaveToFileWorker<Image, void>* worker =
      new save_to_file_worker::SaveToFileWorker<Image, void>(
          info.Holder(),
          *utf8_filename,
          [](void* target, const string& filename, void*) {
            Image* img = reinterpret_cast<Image*>(target);
            return img->_image.saveToFile(filename);
          },
          nullptr,
          callback);
  Nan::AsyncQueueWorker(worker);
}

NAN_METHOD(Image::GetSize) {
  Image* image = Nan::ObjectWrap::Unwrap<Image>(info.Holder());
  sf::Vector2u size = image->_image.getSize();

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

NAN_METHOD(Image::CreateMaskFromColor) {
  Image* image = Nan::ObjectWrap::Unwrap<Image>(info.Holder());
  color::Color* color =
      Nan::ObjectWrap::Unwrap<color::Color>(info[0].As<Object>());
  sf::Uint8 alpha = 0U;
  if (info.Length() > 1) {
    alpha = Nan::To<sf::Uint32>(info[1]).FromJust();
  }

  image->_image.createMaskFromColor(color->color(), alpha);
}

NAN_METHOD(Image::SetPixel) {
  Image* image = Nan::ObjectWrap::Unwrap<Image>(info.Holder());
  sf::Uint32 x = Nan::To<sf::Uint32>(info[0]).FromJust();
  sf::Uint32 y = Nan::To<sf::Uint32>(info[1]).FromJust();

  sf::Vector2u size = image->_image.getSize();
  if (x >= size.x || y >= size.y) {
    Nan::ThrowRangeError("`x` or `y` is / are out of range.");
    return;
  }

  color::Color* color =
      Nan::ObjectWrap::Unwrap<color::Color>(info[2].As<Object>());
  image->_image.setPixel(x, y, color->color());
}

NAN_METHOD(Image::GetPixel) {
  Image* image = Nan::ObjectWrap::Unwrap<Image>(info.Holder());
  sf::Uint32 x = Nan::To<sf::Uint32>(info[0]).FromJust();
  sf::Uint32 y = Nan::To<sf::Uint32>(info[1]).FromJust();

  sf::Vector2u size = image->_image.getSize();
  if (x >= size.x || y >= size.y) {
    Nan::ThrowRangeError("`x` or `y` is / are out of range.");
    return;
  }

  info.GetReturnValue().Set(image->_image.getPixel(x, y).toInteger());
}

NAN_METHOD(Image::DuplicatePixels) {
  Image* image = Nan::ObjectWrap::Unwrap<Image>(info.Holder());
  const sf::Uint8* pixels = image->_image.getPixelsPtr();

  sf::Vector2u size = image->_image.getSize();
  ReleasedResizableBuffer<sf::Uint8> released =
      ResizableBuffer<sf::Uint8>((size.x * size.y) << 2).Release();
  memcpy(released.buffer, pixels, released.byte_length);

  Nan::TryCatch try_catch;
  MaybeLocal<Object> maybe_buffer = Nan::NewBuffer(
      reinterpret_cast<char*>(released.buffer),
      released.byte_length,
      [](char* data, void* hint) { free(data); },
      nullptr);
  if (maybe_buffer.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }

  info.GetReturnValue().Set(maybe_buffer.ToLocalChecked());
}

NAN_METHOD(Image::FlipHorizontally) {
  Nan::ObjectWrap::Unwrap<Image>(info.Holder())->_image.flipHorizontally();
}

NAN_METHOD(Image::FlipVertically) {
  Nan::ObjectWrap::Unwrap<Image>(info.Holder())->_image.flipVertically();
}

inline void Image::CreateFromColor(sf::Uint32 width,
                                   sf::Uint32 height,
                                   color::Color* color) {
  _image.create(
      width, height, color == nullptr ? sf::Color(0, 0, 0) : color->color());
}

inline void Image::CreateFromPixels(sf::Uint32 width,
                                    sf::Uint32 height,
                                    v8::Local<v8::Object> pixels) {
  // Buffer type
  if (node::Buffer::HasInstance(pixels)) {
    const sf::Uint8* buf =
        reinterpret_cast<sf::Uint8*>(node::Buffer::Data(pixels));
    size_t length = node::Buffer::Length(pixels);
    return CreateFromPixels(width, height, buf, length);
  }

  // ArrayBuffer / Uint8Array type
  Local<ArrayBuffer> array_buffer;
  size_t offset;
  size_t length;
  if (pixels->IsUint8Array()) {
    Local<Uint8Array> pixels_array = pixels.As<Uint8Array>();
    array_buffer = pixels_array->Buffer();
    offset = pixels_array->ByteOffset();
    length = pixels_array->ByteLength();
  } else if (pixels->IsArrayBuffer()) {
    array_buffer = pixels.As<ArrayBuffer>();
    offset = 0;
    length = array_buffer->ByteLength();
  }

  if (!array_buffer.IsEmpty()) {
    return CreateFromPixels(width, height, array_buffer, offset, length);
  }

  // Array type
  CreateFromPixels(width, height, pixels.As<Array>());
}

inline void Image::CreateFromPixels(sf::Uint32 width,
                                    sf::Uint32 height,
                                    v8::Local<v8::ArrayBuffer> pixels,
                                    size_t offset,
                                    size_t length) {
  if (((width * height) << 2) > length) {
    Nan::ThrowError("`pixels` has no enough length.");
    return;
  }

  sf::Uint8* data =
      reinterpret_cast<sf::Uint8*>(pixels->GetBackingStore()->Data());
  _image.create(width, height, data + offset);
}

inline void Image::CreateFromPixels(sf::Uint32 width,
                                    sf::Uint32 height,
                                    v8::Local<v8::Array> pixels) {
  Nan::HandleScope scope;

  size_t length = pixels->Length();
  if (((width * height) << 2) > length) {
    Nan::ThrowError("`pixels` has no enough length.");
    return;
  }

  ResizableBuffer<sf::Uint8> resizable(pixels->Length());
  sf::Uint8* data = resizable.unsigned_byte_buffer();

  MaybeLocal<Value> maybe_val;
  Local<Value> val;
  sf::Uint32 temp;
  Nan::TryCatch try_catch;
  for (size_t i = 0; i < length; i++) {
    maybe_val = Nan::Get(pixels, i);
    if (maybe_val.IsEmpty()) {
      try_catch.ReThrow();
      return;
    }

    val = maybe_val.ToLocalChecked();
    if (!val->IsUint32()) {
      Nan::ThrowTypeError("Each element in `pixels` should be Uint8.");
      try_catch.ReThrow();
      return;
    }

    temp = Nan::To<sf::Uint32>(val).FromJust();
    if (temp > 0xff) {
      Nan::ThrowRangeError(
          "Each element in `pixels` should between 0 and 255.");
      try_catch.ReThrow();
      return;
    }

    data[i] = temp;
  }

  _image.create(width, height, data);
}

inline void Image::CreateFromPixels(sf::Uint32 width,
                                    sf::Uint32 height,
                                    const sf::Uint8* pixels,
                                    size_t length) {
  if (((width * height) << 2) > length) {
    Nan::ThrowError("`pixels` has no enough length.");
    return;
  }

  _image.create(width, height, pixels);
}

inline void Image::Copy(const Image& src,
                        sf::Uint32 destX,
                        sf::Uint32 destY,
                        rect::IntRect* rect,
                        bool apply_alpha) {
  _image.copy(src._image,
              destX,
              destY,
              rect == nullptr ? sf::IntRect(0, 0, 0, 0) : rect->rect(),
              apply_alpha);
}

void Image::SetInnerImage(const sf::Image& image) {
  _image = image;
}

Image::Image() {}

}  // namespace image
}  // namespace node_sfml
