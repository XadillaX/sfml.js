#include "shape-state.h"
#include "exception-boundary.h"
#include "value-binding.h"
#include "window-event.h"
#include <cmath>
#include <limits>

namespace {
using State = sfmljs::ShapeState;
using Handle = sfmljs::SharedHandle<State>;
constexpr std::uint32_t maxPoints = 0x7fffffff / (6 * sizeof(sf::Vertex)) - 2;

bool Number(v8::Local<v8::Value> input, float& value) {
  if (!input->IsNumber()) {
    Nan::ThrowTypeError("Expected a number");
    return false;
  }
  value = static_cast<float>(Nan::To<double>(input).FromJust());
  if (!std::isfinite(value)) {
    Nan::ThrowRangeError("Expected a finite float32 value");
    return false;
  }
  return true;
}

bool Count(v8::Local<v8::Value> input, std::uint32_t& count) {
  if (!input->IsUint32() ||
      (count = Nan::To<std::uint32_t>(input).FromJust()) > maxPoints) {
    Nan::ThrowRangeError("Shape point count exceeds the buffer limit");
    return false;
  }
  return true;
}

v8::Local<v8::Object> MapShape(const std::shared_ptr<State>& state) {
  using namespace sfmljs;
  auto& shape = *state->shape;
  const auto& bounds = Field<ShapeBounds>(shape);
  NumericFields fields;
  fields.Add("left", bounds.position.x).Add("top", bounds.position.y)
      .Add("boundsWidth", bounds.size.x).Add("boundsHeight", bounds.size.y)
      .Add("thickness", Field<ShapeThickness>(shape))
      .Add("miterLimit", Field<ShapeMiterLimit>(shape));
  if (state->kind == 1) {
    auto& circle = static_cast<sf::CircleShape&>(shape);
    fields.Add("radius", Field<CircleRadius>(circle))
        .Add("count", Field<CircleCount>(circle),
             sizeof(std::size_t) == 8 ? "size64" : "u32");
  } else {
    state->pointCount = static_cast<std::uint32_t>(shape.getPointCount());
    fields.Add("count", state->pointCount);
  }
  if (state->kind == 2) {
    const auto& size = Field<RectangleSize>(static_cast<sf::RectangleShape&>(shape));
    fields.Add("width", size.x).Add("height", size.y);
  }
  return fields.Map(state);
}

NAN_METHOD(CreateShape) {
  auto* context = sfmljs::SharedHandle<sfmljs::GraphicsContext>::From(info[0]);
  if (!context) return;
  if (!info[1]->IsUint32() || Nan::To<unsigned>(info[1]).FromJust() > 3) {
    return Nan::ThrowTypeError("Unknown shape kind");
  }
  const auto kind = Nan::To<unsigned>(info[1]).FromJust();
  Handle* source = nullptr;
  if (!info[4]->IsUndefined()) {
    source = Handle::From(info[4]);
    if (!source) return;
    if (source->owner()->kind != kind) {
      return Nan::ThrowTypeError("Shape copy requires the same kind");
    }
  }
  float x{}, y{};
  std::uint32_t count{};
  if (!source) {
    if ((kind == 1 || kind == 2) && !Number(info[2], x)) return;
    if (kind == 2 && !Number(info[3], y)) return;
    if (kind == 1 && !Count(info[3], count)) return;
    if (kind == 3 && !Count(info[2], count)) return;
  }
  if (context->owner()->nextId == std::numeric_limits<std::uint32_t>::max()) {
    return Nan::ThrowRangeError("Shape ID space exhausted");
  }
  try {
    std::unique_ptr<sf::Shape> shape;
    if (source) {
      const auto& raw = *source->owner()->shape;
      switch (kind) {
        case 0: shape = std::make_unique<sfmljs::PointShape>(
            static_cast<const sfmljs::PointShape&>(raw)); break;
        case 1: shape = std::make_unique<sf::CircleShape>(
            static_cast<const sf::CircleShape&>(raw)); break;
        case 2: shape = std::make_unique<sf::RectangleShape>(
            static_cast<const sf::RectangleShape&>(raw)); break;
        case 3: shape = std::make_unique<sf::ConvexShape>(
            static_cast<const sf::ConvexShape&>(raw)); break;
      }
    } else {
      switch (kind) {
        case 0: shape = std::make_unique<sfmljs::PointShape>(); break;
        case 1: shape = std::make_unique<sf::CircleShape>(x, count); break;
        case 2: shape = std::make_unique<sf::RectangleShape>(
            sf::Vector2f{x, y}); break;
        case 3: shape = std::make_unique<sf::ConvexShape>(count); break;
      }
    }
    auto state = sfmljs::MakeThreadOwned<State>(context->owner(),
        context->owner()->nextId++, kind, std::move(shape));
    if (source) {
      state->values = source->owner()->values;
      state->appearance = source->owner()->appearance;
      state->texture = source->owner()->texture;
      state->SyncShape();
    }
    state->context->shapes.emplace(state->id, state);
    auto result = Nan::New<v8::Object>();
#define MAP(name, value) \
    Nan::Set(result, Nan::New(name).ToLocalChecked(), value).FromJust()
    MAP("handle", Handle::Create(state));
    MAP("id", Nan::New(state->id));
    MAP("info", MapShape(state));
    MAP("transformable", sfmljs::TransformableHandle(state));
    MAP("buffer", sfmljs::MapShared(info.GetIsolate(), state,
        state->values.data(), sizeof(state->values)));
    MAP("appearance", sfmljs::MapShared(info.GetIsolate(), state,
        &state->appearance, sizeof(state->appearance)));
#undef MAP
    info.GetReturnValue().Set(result);
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(ChangeShapeGeometry) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsUint32()) return Nan::ThrowTypeError("Expected an operation");
  const auto operation = Nan::To<unsigned>(info[1]).FromJust();
  auto& state = *handle->owner();
  auto& shape = *state.shape;
  float x{}, y{};
  std::uint32_t count{};
  if (operation == 0 || operation == 1 || operation == 2 || operation == 3) {
    if (!Number(info[2], x)) return;
  }
  if (operation == 1 && x < 1) {
    return Nan::ThrowRangeError("Miter limit must be at least 1");
  }
  if (operation == 2 && state.kind != 1) {
    return Nan::ThrowTypeError("Expected a circle");
  }
  if (operation == 3 && (state.kind != 2 || !Number(info[3], y))) {
    if (state.kind != 2) Nan::ThrowTypeError("Expected a rectangle");
    return;
  }
  if (operation == 4 || operation == 5) {
    if (!Count(info[2], count)) return;
    if (state.kind != 3 && !(operation == 4 && state.kind == 1)) {
      return Nan::ThrowTypeError("Expected a circle or convex shape");
    }
  }
  if (operation == 5) {
    if (count >= shape.getPointCount()) {
      return Nan::ThrowRangeError("Shape point index is out of bounds");
    }
    if (!Number(info[3], x) || !Number(info[4], y)) return;
  }
  try {
    state.SyncShape();
    switch (operation) {
      case 0: shape.setOutlineThickness(x); break;
      case 1: shape.setMiterLimit(x); break;
      case 2: static_cast<sf::CircleShape&>(shape).setRadius(x); break;
      case 3: static_cast<sf::RectangleShape&>(shape).setSize({x, y}); break;
      case 4:
        if (state.kind == 1) {
          static_cast<sf::CircleShape&>(shape).setPointCount(count);
        } else static_cast<sf::ConvexShape&>(shape).setPointCount(count);
        break;
      case 5: static_cast<sf::ConvexShape&>(shape).setPoint(count, {x, y}); break;
      default: return Nan::ThrowRangeError("Unknown shape operation");
    }
    state.pointCount = static_cast<std::uint32_t>(shape.getPointCount());
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(UpdateShapePoints) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  if (handle->owner()->kind != 0 || !info[1]->IsFloat32Array()) {
    return Nan::ThrowTypeError("Expected custom shape points");
  }
  auto view = info[1].As<v8::Float32Array>();
  const auto backing = view->Buffer()->GetBackingStore();
  if (view->Buffer()->WasDetached() || backing->IsShared() ||
      view->Length() % 2 != 0 || view->Length() / 2 > maxPoints) {
    return Nan::ThrowRangeError("Invalid shape points buffer");
  }
#if V8_MAJOR_VERSION >= 11
  if (backing->IsResizableByUserJavaScript()) {
    return Nan::ThrowTypeError("Expected fixed shape points");
  }
#endif
  Nan::TypedArrayContents<float> input(info[1]);
  try {
    std::vector<sf::Vector2f> points(view->Length() / 2);
    for (std::size_t i = 0; i < points.size(); ++i) {
      const auto x = (*input)[i * 2], y = (*input)[i * 2 + 1];
      if (!std::isfinite(x) || !std::isfinite(y)) {
        return Nan::ThrowRangeError("Expected finite shape points");
      }
      points[i] = {x, y};
    }
    auto& state = *handle->owner();
    state.SyncShape();
    static_cast<sfmljs::PointShape&>(*state.shape).Replace(std::move(points));
    state.pointCount = static_cast<std::uint32_t>(state.shape->getPointCount());
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(GetShapePoint) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  std::uint32_t index;
  if (!Count(info[1], index)) return;
  if (index >= handle->owner()->shape->getPointCount()) {
    return Nan::ThrowRangeError("Shape point index is out of bounds");
  }
  info.GetReturnValue().Set(
      sfmljs::EventValue(handle->owner()->shape->getPoint(index)));
}

NAN_METHOD(GetShapeCenter) {
  auto* handle = Handle::From(info[0]);
  if (handle) info.GetReturnValue().Set(
      sfmljs::EventValue(handle->owner()->shape->getGeometricCenter()));
}

NAN_METHOD(SetShapeTexture) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  std::shared_ptr<const sf::Texture> texture;
  if (!info[1]->IsNull()) {
    texture = sfmljs::ReadTexture(info[1]);
    if (!texture) return;
  }
  if (!info[2]->IsUint32()) return Nan::ThrowTypeError("Expected texture ID");
  const auto id = Nan::To<std::uint32_t>(info[2]).FromJust();
  if (texture) {
    const auto found = handle->owner()->context->textures.find(id);
    if (found == handle->owner()->context->textures.end() ||
        found->second.lock() != texture) {
      return Nan::ThrowTypeError("Texture does not belong to this context");
    }
  } else if (id != 0) return Nan::ThrowTypeError("Expected zero texture ID");
  handle->owner()->texture = std::move(texture);
  handle->owner()->appearance.textureId = id;
}

NAN_METHOD(ShapeTextureRect) {
  auto* handle = Handle::From(info[0]);
  if (handle) sfmljs::values::ReturnMapped(info,
      std::shared_ptr<sf::IntRect>(handle->owner(),
                                   &handle->owner()->appearance.rectangle));
}

}  // namespace

NAN_MODULE_INIT(InitializeShape) {
  sfmljs::SetMethod<CreateShape>(target, "createShape");
  sfmljs::SetMethod<ChangeShapeGeometry>(target, "changeShapeGeometry");
  sfmljs::SetMethod<UpdateShapePoints>(target, "updateShapePoints");
  sfmljs::SetMethod<GetShapePoint>(target, "getShapePoint");
  sfmljs::SetMethod<GetShapeCenter>(target, "getShapeCenter");
  sfmljs::SetMethod<SetShapeTexture>(target, "setShapeTexture");
  sfmljs::SetMethod<ShapeTextureRect>(target, "shapeTextureRect");
}
