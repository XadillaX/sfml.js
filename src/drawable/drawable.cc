#include "drawable.h"
#include "../texture.h"

namespace node_sfml {
namespace drawable {

using v8::Isolate;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;

Drawable::Drawable() : _raw(nullptr) {}
Drawable::Drawable(sf::Drawable* raw) : _raw(raw) {}
Drawable::~Drawable() {
  if (_raw != nullptr) {
    delete _raw;
    _raw = nullptr;
  }
}

DrawableWithTexture::DrawableWithTexture() : Drawable(nullptr) {}
DrawableWithTexture::DrawableWithTexture(sf::Drawable* raw) : Drawable(raw) {}
DrawableWithTexture::~DrawableWithTexture() {
  _texture.Reset();
}

void DrawableWithTexture::SetTexture(Local<Object> texture_object,
                                     bool reset_rect) {
  _texture.Reset(texture_object);
}

MaybeLocal<Object> DrawableWithTexture::GetTexture() {
  if (_texture.IsEmpty()) {
    return MaybeLocal<Object>();
  }

  return _texture.Get(Isolate::GetCurrent());
}

}  // namespace drawable
}  // namespace node_sfml
