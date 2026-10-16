#include <nan.h>
#include <SFML/Graphics/Image.hpp>

#include "graphics-state.h"
#include "exception-boundary.h"
#include "context-settings.h"
#include "shared-handle.h"

#include <exception>
#include <limits>

namespace {

using Context = sfmljs::GraphicsContext;
using Sprite = sfmljs::SpriteState;
using Target = sfmljs::RenderTextureState;
using sfmljs::SharedHandle;

bool ReadSize(v8::Local<v8::Value> x, v8::Local<v8::Value> y,
              sf::Vector2u& size) {
  if (!x->IsUint32() || !y->IsUint32()) {
    Nan::ThrowRangeError("Expected positive integer dimensions");
    return false;
  }
  size = {Nan::To<std::uint32_t>(x).FromJust(),
          Nan::To<std::uint32_t>(y).FromJust()};
  if (size.x == 0 || size.y == 0) {
    Nan::ThrowRangeError("Expected positive integer dimensions");
    return false;
  }
  return true;
}

NAN_METHOD(CreateGraphicsContext) {
  info.GetReturnValue().Set(
      SharedHandle<Context>::Create(sfmljs::MakeThreadOwned<Context>()));
}

bool ReadTextureId(const Context& context, const std::shared_ptr<const sf::Texture>& texture,
                   v8::Local<v8::Value> input, std::uint32_t& id) {
  if (!input->IsUint32()) {
    Nan::ThrowTypeError("Expected a texture ID");
    return false;
  }
  id = Nan::To<std::uint32_t>(input).FromJust();
  const auto found = context.textures.find(id);
  if (found == context.textures.end() || found->second.lock() != texture) {
    Nan::ThrowTypeError("Texture ID does not match its context and handle");
    return false;
  }
  return true;
}

NAN_METHOD(CreateSprite) {
  auto* context = SharedHandle<Context>::From(info[0]);
  if (!context) return;
  const auto texture = sfmljs::ReadTexture(info[1]);
  if (!texture) return;
  std::uint32_t textureId;
  if (!ReadTextureId(*context->owner(), texture, info[2], textureId)) return;
  if (context->owner()->nextId == std::numeric_limits<std::uint32_t>::max()) {
    return Nan::ThrowRangeError("Sprite ID space exhausted");
  }
  auto object = sfmljs::MakeThreadOwned<Sprite>(
      context->owner(), texture, context->owner()->nextId++, textureId);
  context->owner()->sprites.emplace(object->id, object);
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("handle").ToLocalChecked(),
           SharedHandle<Sprite>::Create(object)).FromJust();
  Nan::Set(result, Nan::New("id").ToLocalChecked(),
           Nan::New(object->id)).FromJust();
  // The adjusted base pointer and sprite handle share one control block.
  const auto transformable = std::shared_ptr<sfmljs::TransformableState>(
      object, static_cast<sfmljs::TransformableState*>(object.get()));
  Nan::Set(result, Nan::New("transformable").ToLocalChecked(),
           sfmljs::TransformableHandle(transformable)).FromJust();
  Nan::Set(result, Nan::New("buffer").ToLocalChecked(),
           sfmljs::MapShared(info.GetIsolate(), object, object->values.data(),
                            sizeof(object->values))).FromJust();
  Nan::Set(result, Nan::New("appearance").ToLocalChecked(),
           sfmljs::MapShared(info.GetIsolate(), object, &object->appearance,
                            sizeof(object->appearance))).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(SetSpriteTexture) {
  auto* sprite = SharedHandle<Sprite>::From(info[0]);
  if (!sprite) return;
  const auto texture = sfmljs::ReadTexture(info[1]);
  if (!texture) return;
  std::uint32_t id;
  auto& object = *sprite->owner();
  if (!ReadTextureId(*object.context, texture, info[2], id)) return;
  object.texture = texture;
  object.appearance.textureId = id;
  object.setTexture(*object.texture);
}

NAN_METHOD(SpriteTextureRect) {
  auto* sprite = SharedHandle<Sprite>::From(info[0]);
  if (!sprite) return;
  auto rectangle = std::shared_ptr<sf::IntRect>(
      sprite->owner(), &sprite->owner()->appearance.rectangle);
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("handle").ToLocalChecked(),
           SharedHandle<sf::IntRect>::Create(rectangle)).FromJust();
  Nan::Set(result, Nan::New("buffer").ToLocalChecked(),
           sfmljs::MapShared(info.GetIsolate(), rectangle, rectangle.get(),
                            sizeof(sf::IntRect))).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(CreateRenderTexture) {
  auto* context = SharedHandle<Context>::From(info[0]);
  if (!context) return;
  sf::Vector2u size;
  const bool sized = !info[1]->IsUndefined() || !info[2]->IsUndefined();
  if (sized && !ReadSize(info[1], info[2], size)) return;
  sf::ContextSettings settings;
  if (!sfmljs::ReadContextSettings(info[3], settings)) return;
  try {
    constexpr std::size_t capacity = 4096;
    auto target = sfmljs::MakeThreadOwned<Target>(context->owner(), capacity);
    if (sized && !target->Resize(size, settings)) {
      return sfmljs::ThrowError("SFML could not create the render texture");
    }
    auto result = Nan::New<v8::Object>();
    Nan::Set(result, Nan::New("handle").ToLocalChecked(),
             SharedHandle<Target>::Create(target)).FromJust();
    const auto commands = target->batch.Commands();
    Nan::Set(result, Nan::New("buffer").ToLocalChecked(),
             sfmljs::MapShared(info.GetIsolate(), target, commands.data(),
                              commands.size_bytes())).FromJust();
    Nan::Set(result, Nan::New("info").ToLocalChecked(),
             sfmljs::MapTexture(std::shared_ptr<const sf::Texture>(
                 target, &target->target.getTexture()))).FromJust();
    Nan::Set(result, Nan::New("targetInfo").ToLocalChecked(),
             sfmljs::NumericFields().Add("sRgb", target->targetSrgb).Map(target))
        .FromJust();
    info.GetReturnValue().Set(result);
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(ResizeRenderTexture) {
  auto* handle = SharedHandle<Target>::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsUint32() || !info[2]->IsUint32()) {
    return Nan::ThrowRangeError("Expected unsigned integer dimensions");
  }
  const sf::Vector2u size{Nan::To<std::uint32_t>(info[1]).FromJust(),
                          Nan::To<std::uint32_t>(info[2]).FromJust()};
  sf::ContextSettings settings;
  if (!sfmljs::ReadContextSettings(info[3], settings)) return;
  try {
    if (handle->owner()->Resize(size, settings)) {
      info.GetReturnValue().Set(true);
    }
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(GetMaximumRenderTextureAntiAliasingLevel) {
  info.GetReturnValue().Set(Nan::New(
      sf::RenderTexture::getMaximumAntiAliasingLevel()));
}

template <bool Smooth>
NAN_METHOD(SetRenderTextureSampling) {
  auto* handle = SharedHandle<Target>::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsBoolean()) return Nan::ThrowTypeError("Expected a boolean");
  if constexpr (Smooth) handle->owner()->target.setSmooth(info[1]->IsTrue());
  else handle->owner()->target.setRepeated(info[1]->IsTrue());
}

NAN_METHOD(GenerateRenderTextureMipmap) {
  auto* handle = SharedHandle<Target>::From(info[0]);
  if (handle) info.GetReturnValue().Set(
      handle->owner()->target.generateMipmap());
}

NAN_METHOD(SetRenderTextureActive) {
  auto* handle = SharedHandle<Target>::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsBoolean()) return Nan::ThrowTypeError("Expected a boolean");
  info.GetReturnValue().Set(handle->owner()->target.setActive(info[1]->IsTrue()));
}

NAN_METHOD(ChangeRenderTextureGLStates) {
  auto* handle = SharedHandle<Target>::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsUint32() || Nan::To<std::uint32_t>(info[1]).FromJust() > 2) {
    return Nan::ThrowRangeError("Invalid OpenGL state operation");
  }
  auto& state = *handle->owner();
  if (!state.initialized) return;
  switch (Nan::To<std::uint32_t>(info[1]).FromJust()) {
    case 0: state.target.pushGLStates(); break;
    case 1: state.target.popGLStates(); break;
    case 2: state.target.resetGLStates(); break;
  }
}

NAN_METHOD(SubmitRenderTexture) {
  auto* target = SharedHandle<Target>::From(info[0]);
  if (!target) return;
  if (!info[1]->IsUint32() ||
      Nan::To<std::uint32_t>(info[1]).FromJust() >
          target->owner()->batch.Commands().size()) {
    return Nan::ThrowRangeError("Invalid draw command count");
  }
  if (!info[2]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected a display flag");
  }
  try {
    if (!target->owner()->Submit(Nan::To<std::uint32_t>(info[1]).FromJust(),
                                 Nan::To<bool>(info[2]).FromJust())) {
      return Nan::ThrowTypeError("Invalid draw command or expired resource");
    }
  } catch (const std::exception& error) {
    return sfmljs::ThrowError(error.what());
  } catch (...) {
    return sfmljs::ThrowError("Native batch submission failed");
  }
}

NAN_METHOD(GetRenderTextureTexture) {
  auto* handle = SharedHandle<Target>::From(info[0]);
  if (!handle) return;
  const auto& owner = handle->owner();
  if (!owner->textureId) {
    if (owner->context->nextId == std::numeric_limits<std::uint32_t>::max()) {
      return Nan::ThrowRangeError("Graphics ID space exhausted");
    }
    owner->textureId = owner->context->nextId++;
  }
  const auto texture = std::shared_ptr<const sf::Texture>(
      owner, &owner->target.getTexture());
  owner->context->textures.insert_or_assign(owner->textureId, texture);
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("info").ToLocalChecked(),
           sfmljs::MapTexture(texture)).FromJust();
  Nan::Set(result, Nan::New("id").ToLocalChecked(),
           Nan::New(owner->textureId)).FromJust();
  Nan::Set(result, Nan::New("handle").ToLocalChecked(),
           SharedHandle<const sf::Texture>::Create(texture)).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(AllocateRenderTextureVertices) {
  auto* target = SharedHandle<Target>::From(info[0]);
  if (!target) return;
  if (!info[1]->IsUint32() ||
      Nan::To<std::uint32_t>(info[1]).FromJust() > sfmljs::kMaxVertices) {
    return Nan::ThrowRangeError("Vertex capacity exceeds the buffer limit");
  }
  try {
    const auto storage = target->owner()->batch.AllocateVertices(
        Nan::To<std::uint32_t>(info[1]).FromJust());
    info.GetReturnValue().Set(storage->empty()
        ? v8::ArrayBuffer::New(info.GetIsolate(), 0)
        : sfmljs::MapShared(info.GetIsolate(), storage, storage->data(),
                            storage->size() * sizeof(sf::Vertex)));
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(OpenRenderTexturePreview) {
  auto* target = SharedHandle<Target>::From(info[0]);
  if (!target) return;
  auto preview = sfmljs::MakeThreadOwned<sfmljs::PreviewWindow>();
  preview->window.create(sf::VideoMode(target->owner()->target.getSize()),
      "sfml.js | Shared-memory sprite demo | Esc closes",
      sf::Style::Titlebar | sf::Style::Close);
  if (!preview->window.isOpen()) {
    return sfmljs::ThrowError("SFML could not open the preview window");
  }
  preview->window.setVerticalSyncEnabled(false);
  preview->window.requestFocus();
  preview->open = 1;
  target->owner()->preview = preview;
  // Reading window status in JS does not require a second native call.
  info.GetReturnValue().Set(sfmljs::MapShared(
      info.GetIsolate(), preview, &preview->open, sizeof(preview->open)));
}

// Pixel readback is an internal integration-test probe.
NAN_METHOD(ReadRenderTexturePixels) {
  auto* target = SharedHandle<Target>::From(info[0]);
  if (!target) return;
  const auto image = target->owner()->target.getTexture().copyToImage();
  const auto size = image.getSize();
  const auto bytes = static_cast<std::size_t>(size.x) * size.y * 4;
  if (bytes > std::numeric_limits<std::uint32_t>::max()) {
    return Nan::ThrowRangeError("Image too large for the readback probe");
  }
  info.GetReturnValue().Set(Nan::CopyBuffer(
      reinterpret_cast<const char*>(image.getPixelsPtr()),
      static_cast<std::uint32_t>(bytes)).ToLocalChecked());
}

NAN_METHOD(ReadSpritePosition) {
  auto* object = SharedHandle<Sprite>::From(info[0]);
  if (!object) return;
  const auto position = object->owner()->getPosition();
  auto result = Nan::New<v8::Array>(2);
  Nan::Set(result, 0, Nan::New(position.x)).FromJust();
  Nan::Set(result, 1, Nan::New(position.y)).FromJust();
  info.GetReturnValue().Set(result);
}

}  // namespace

NAN_MODULE_INIT(InitializeGraphics) {
  sfmljs::SetMethod<CreateGraphicsContext>(target, "createGraphicsContext");
  sfmljs::SetMethod<CreateSprite>(target, "createSprite");
  sfmljs::SetMethod<SetSpriteTexture>(target, "setSpriteTexture");
  sfmljs::SetMethod<SpriteTextureRect>(target, "spriteTextureRect");
  sfmljs::SetMethod<CreateRenderTexture>(target, "createRenderTexture");
  sfmljs::SetMethod<ResizeRenderTexture>(target, "resizeRenderTexture");
  sfmljs::SetMethod<GetMaximumRenderTextureAntiAliasingLevel>(
      target, "getMaximumRenderTextureAntiAliasingLevel");
  sfmljs::SetMethod<SetRenderTextureSampling<true>>(target, "setRenderTextureSmooth");
  sfmljs::SetMethod<SetRenderTextureSampling<false>>(target, "setRenderTextureRepeated");
  sfmljs::SetMethod<GenerateRenderTextureMipmap>(target, "generateRenderTextureMipmap");
  sfmljs::SetMethod<SetRenderTextureActive>(target, "setRenderTextureActive");
  sfmljs::SetMethod<ChangeRenderTextureGLStates>(target, "changeRenderTextureGLStates");
  sfmljs::SetMethod<SubmitRenderTexture>(target, "submitRenderTexture");
  sfmljs::SetMethod<GetRenderTextureTexture>(target, "getRenderTextureTexture");
  sfmljs::SetMethod<AllocateRenderTextureVertices>(target, "allocateRenderTextureVertices");
  sfmljs::SetMethod<OpenRenderTexturePreview>(target, "openRenderTexturePreview");
  sfmljs::SetMethod<ReadRenderTexturePixels>(target, "readRenderTexturePixels");
  sfmljs::SetMethod<ReadSpritePosition>(target, "readSpritePosition");
}
