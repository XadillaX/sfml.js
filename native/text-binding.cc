#include "text-state.h"
#include "exception-boundary.h"
#include "value-binding.h"

#include <SFML/Graphics/Text.hpp>

namespace {

using GlyphStorage = sfmljs::ShapedGlyphStorage;
using GlyphStorageHandle = sfmljs::SharedHandle<GlyphStorage>;
using Handle = sfmljs::TextHandle;
namespace members = sfmljs::text_members;

template <typename T>
void Set(v8::Local<v8::Object> object, const char* name, T value) {
  Nan::Set(object, Nan::New(name).ToLocalChecked(), value).FromJust();
}

v8::Local<v8::Object> MapGlyphs(const std::shared_ptr<GlyphStorage>& storage) {
  auto result = Nan::New<v8::Object>();
  Set(result, "handle", GlyphStorageHandle::Create(storage));
  Set(result, "buffer", storage->empty()
      ? v8::ArrayBuffer::New(v8::Isolate::GetCurrent(), 0)
      : sfmljs::MapShared(v8::Isolate::GetCurrent(), storage, storage->data(),
                         storage->size() * sizeof(sfmljs::ShapedGlyphData)));
  return result;
}

v8::Local<v8::Object> Vertices(const sf::VertexArray& input) {
  auto storage = std::make_shared<sfmljs::VertexStorage>(input.getVertexCount());
  for (std::size_t i = 0; i < storage->size(); ++i) (*storage)[i] = input[i];
  auto result = Nan::New<v8::Object>();
  Set(result, "handle", sfmljs::SharedHandle<sfmljs::VertexStorage>::Create(storage));
  Set(result, "buffer", storage->empty()
      ? v8::ArrayBuffer::New(v8::Isolate::GetCurrent(), 0)
      : sfmljs::MapShared(v8::Isolate::GetCurrent(), storage, storage->data(),
                         storage->size() * sizeof(sf::Vertex)));
  return result;
}

NAN_METHOD(CreateText) {
  auto* font = sfmljs::FontHandle::From(info[0]);
  if (!font) return;
  std::shared_ptr<sfmljs::TextState> state;
  if (info[1]->IsUndefined()) {
    state = sfmljs::MakeThreadOwned<sfmljs::TextState>(font->owner()->current);
  } else {
    auto* source = Handle::From(info[1]);
    if (!source) return;
    state = sfmljs::MakeThreadOwned<sfmljs::TextState>(*source->owner());
  }
  auto result = Nan::New<v8::Object>();
  Set(result, "handle", Handle::Create(state));
  const auto transformable =
      std::shared_ptr<sfmljs::TransformableState>(state, state.get());
  Set(result, "transformable", sfmljs::TransformableHandle(transformable));
  Set(result, "transform", sfmljs::MapShared(info.GetIsolate(), state,
      state->values.data(), sizeof(state->values)));
  Set(result, "buffer", sfmljs::MapShared(info.GetIsolate(), state,
      members::Properties(state->text), 40));
  Set(result, "geometry", sfmljs::MapShared(info.GetIsolate(), state,
      &members::Get<members::GeometryNeedUpdate>(state->text), sizeof(bool)));
  Set(result, "bounds", sfmljs::MapShared(info.GetIsolate(), state,
      &members::Get<members::Bounds>(state->text), sizeof(sf::FloatRect)));
  info.GetReturnValue().Set(result);
}

// The callback is local to this call. Native never persistently owns a JS
// closure, including closures that capture this Text or its Font.
struct CallbackFailed {};

struct LayoutScope {
  sf::Text& text;
  bool complete{};

  ~LayoutScope() {
    // Remove the call-local JS closure without invalidating completed geometry.
    members::Get<members::PreProcessor>(text) = {};
    if (!complete) members::Get<members::GeometryNeedUpdate>(text) = true;
  }
};

NAN_METHOD(PrepareText) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  auto* font = sfmljs::FontHandle::From(info[1]);
  if (!font) return;
  if (!info[2]->IsString() ||
      (!info[3]->IsNull() && !info[3]->IsFunction())) {
    return Nan::ThrowTypeError("Expected text and pre-processor");
  }
  auto state = handle->owner();
  auto source = font->owner()->current;
  if (source->font.getInfo().id == 0) {
    return sfmljs::ThrowError("Text requires a loaded Font");
  }
  // Retain the previous face until its shaper has been replaced.
  const auto previousFont = state->font;
  auto& text = state->text;
  text.setFont(source->font);
  state->font = std::move(source);
  Nan::Utf8String string(info[2]);
  text.setString(sf::String::fromUtf8(*string, *string + string.length()));
  Nan::TryCatch caught;
  LayoutScope scope{text};
  try {
    if (info[3]->IsFunction()) {
      auto callback = info[3].As<v8::Function>();
      members::Get<members::PreProcessor>(text) = [callback](
          const sf::Text::ShapedGlyph& glyph, std::uint32_t& style,
          sf::Color& fill, sf::Color& outline, float& thickness) {
        Nan::HandleScope scope;
        // Each callback gets a stable snapshot, even if JS retains it.
        auto snapshot = std::make_shared<GlyphStorage>();
        snapshot->emplace_back(glyph);
        v8::Local<v8::Value> args[] = {MapGlyphs(snapshot), Nan::New(style),
            Nan::New(fill.toInteger()), Nan::New(outline.toInteger()),
            Nan::New(thickness)};
        v8::Local<v8::Value> result;
        if (!Nan::Call(callback, Nan::GetCurrentContext()->Global(), 5, args)
                 .ToLocal(&result)) throw CallbackFailed{};
        if (!result->IsFloat64Array() ||
            result.As<v8::Float64Array>()->Length() != 4) {
          Nan::ThrowTypeError("Invalid glyph pre-processor result");
          throw CallbackFailed{};
        }
        Nan::TypedArrayContents<double> output(result);
        style = static_cast<std::uint32_t>((*output)[0]);
        fill = sf::Color(static_cast<std::uint32_t>((*output)[1]));
        outline = sf::Color(static_cast<std::uint32_t>((*output)[2]));
        thickness = static_cast<float>((*output)[3]);
      };
    }
    // The second geometry query also accounts for atlas growth during shaping.
    static_cast<void>(text.getLocalBounds());
    const auto& shaped = text.getShapedGlyphs();
    auto glyphs = std::make_shared<GlyphStorage>(shaped.begin(), shaped.end());
    auto result = Nan::New<v8::Object>();
    Set(result, "vertices", Vertices(text.getVertexData()));
    Set(result, "outline", Vertices(text.getOutlineVertexData()));
    state->glyphs = std::move(glyphs);
    scope.complete = true;
    info.GetReturnValue().Set(result);
  } catch (const CallbackFailed&) {
    if (caught.HasCaught()) caught.ReThrow();
  }
}

NAN_METHOD(GetTextGlyphs) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  if (!handle->owner()->glyphs) return sfmljs::ThrowError("Text is not prepared");
  try {
    info.GetReturnValue().Set(MapGlyphs(handle->owner()->glyphs));
  } catch (const std::exception& error) { sfmljs::ThrowError(error.what()); }
}

NAN_METHOD(ShapedGlyphMember) {
  auto* handle = GlyphStorageHandle::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsUint32() || !info[2]->IsUint32()) {
    return Nan::ThrowTypeError("Expected a glyph index and member index");
  }
  const auto index = Nan::To<std::uint32_t>(info[1]).FromJust();
  const auto member = Nan::To<std::uint32_t>(info[2]).FromJust();
  const auto& storage = handle->owner();
  if (index >= storage->size() || member > 1) {
    return Nan::ThrowRangeError("Shaped glyph member is out of range");
  }
  auto& glyph = (*storage)[index];
  if (member == 0) {
    sfmljs::values::ReturnMapped(info,
        std::shared_ptr<sf::Glyph>(storage, &glyph.glyph));
  } else {
    sfmljs::values::ReturnMapped(info,
        std::shared_ptr<sf::Vector2f>(storage, &glyph.position));
  }
}

NAN_METHOD(FindTextCharacter) {
  auto* handle = Handle::From(info[0]);
  if (!handle) return;
  if (!handle->owner()->glyphs || !info[1]->IsNumber()) {
    return Nan::ThrowTypeError("Expected prepared text and character index");
  }
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
  const auto point = handle->owner()->text.findCharacterPos(
      static_cast<std::size_t>(Nan::To<double>(info[1]).FromJust()));
#pragma GCC diagnostic pop
  auto result = Nan::New<v8::Array>(2);
  Nan::Set(result, 0, Nan::New(point.x)).FromJust();
  Nan::Set(result, 1, Nan::New(point.y)).FromJust();
  info.GetReturnValue().Set(result);
}

}  // namespace

NAN_MODULE_INIT(InitializeText) {
  sfmljs::SetMethod<CreateText>(target, "createText");
  sfmljs::SetMethod<PrepareText>(target, "prepareText");
  sfmljs::SetMethod<GetTextGlyphs>(target, "getTextGlyphs");
  sfmljs::SetMethod<ShapedGlyphMember>(target, "shapedGlyphMember");
  sfmljs::SetMethod<FindTextCharacter>(target, "findTextCharacter");
}
