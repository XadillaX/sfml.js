#include "../../native/font-state.h"
#include "../../native/text-state.h"
#include "../../native/exception-boundary.h"
#include "../../native/shaped-glyph-storage.h"
#include "../../native/value-binding.h"
#include <SFML/Graphics/Text.hpp>
#include <SFML/Graphics/Image.hpp>

namespace {
v8::Local<v8::Value> Get(v8::Local<v8::Object> object, const char* name) {
  return Nan::Get(object, Nan::New(name).ToLocalChecked()).ToLocalChecked();
}
void Set(v8::Local<v8::Object> object, const char* name, v8::Local<v8::Value> value) {
  Nan::Set(object, Nan::New(name).ToLocalChecked(), value).FromJust();
}
v8::Local<v8::Array> Box(sf::FloatRect box) {
  auto result = Nan::New<v8::Array>(4);
  const float values[] = {box.position.x, box.position.y, box.size.x, box.size.y};
  for (unsigned i = 0; i < 4; ++i) Nan::Set(result, i, Nan::New(values[i])).FromJust();
  return result;
}

NAN_METHOD(TextOracle) {
  const auto inputs = info[0].As<v8::Array>();
  sf::RenderTexture target({320, 200});
  target.clear(sf::Color::Transparent);
  auto descriptions = Nan::New<v8::Array>(inputs->Length());
  for (unsigned i = 0; i < inputs->Length(); ++i) {
    auto input = Nan::Get(inputs, i).ToLocalChecked().As<v8::Object>();
    auto* font = sfmljs::FontHandle::From(Get(input, "font"));
    if (!font) return;
    Nan::Utf8String string(Get(input, "string"));
    Nan::TypedArrayContents<double> props(Get(input, "properties"));
    const auto* p = *props;
    sf::Text text(font->owner()->current->font,
        sf::String::fromUtf8(*string, *string + string.length()), p[0]);
    text.setLetterSpacing(p[1]);
    text.setLineSpacing(p[2]);
    text.setStyle(p[3]);
    text.setFillColor(sf::Color(static_cast<std::uint32_t>(p[4])));
    text.setOutlineColor(sf::Color(static_cast<std::uint32_t>(p[5])));
    text.setOutlineThickness(p[6]);
    text.setLineAlignment(static_cast<sf::Text::LineAlignment>(p[7]));
    text.setTextOrientation(static_cast<sf::Text::TextOrientation>(p[8]));
    text.setClusterGrouping(static_cast<sf::Text::ClusterGrouping>(p[9]));
    if (Nan::To<bool>(Get(input, "processor")).FromJust()) {
      text.setGlyphPreProcessor([](const sf::Text::ShapedGlyph& glyph,
          std::uint32_t& style, sf::Color& fill, sf::Color& outline, float& thickness) {
        if (glyph.cluster % 2 == 0) {
          style |= sf::Text::Bold;
          fill = sf::Color::Red;
          outline = sf::Color::Blue;
          thickness = 1.5f;
        }
      });
    }
    Nan::TypedArrayContents<float> pose(Get(input, "pose"));
    text.setPosition({(*pose)[0], (*pose)[1]});
    text.setRotation(sf::radians((*pose)[2]));
    text.setScale({(*pose)[3], (*pose)[4]});
    text.setOrigin({(*pose)[5], (*pose)[6]});
    Nan::TypedArrayContents<float> matrix(Get(input, "parent"));
    sf::RenderStates states;
    states.transform = sf::Transform(
        (*matrix)[0], (*matrix)[4], (*matrix)[12],
        (*matrix)[1], (*matrix)[5], (*matrix)[13],
        (*matrix)[3], (*matrix)[7], (*matrix)[15]);
    auto description = Nan::New<v8::Object>();
    Set(description, "local", Box(text.getLocalBounds()));
    Set(description, "global", Box(text.getGlobalBounds()));
    auto glyphs = Nan::New<v8::Array>(text.getShapedGlyphs().size());
    unsigned j = 0;
    for (const auto& glyph : text.getShapedGlyphs()) {
      const double data[] = {glyph.position.x, glyph.position.y,
          double(glyph.cluster), double(glyph.textDirection), glyph.baseline,
          double(glyph.vertexOffset), double(glyph.vertexCount), glyph.glyph.advance};
      auto value = Nan::New<v8::Array>(8);
      for (unsigned k = 0; k < 8; ++k) Nan::Set(value, k, Nan::New(data[k])).FromJust();
      Nan::Set(glyphs, j++, value).FromJust();
    }
    Set(description, "glyphs", glyphs);
    auto characters = Nan::New<v8::Array>();
    for (unsigned k = 0; k <= text.getString().getSize() + 1; ++k) {
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
      const auto position = text.findCharacterPos(k);
#pragma GCC diagnostic pop
      Nan::Set(characters, k * 2, Nan::New(position.x)).FromJust();
      Nan::Set(characters, k * 2 + 1, Nan::New(position.y)).FromJust();
    }
    Set(description, "characters", characters);
    Nan::Set(descriptions, i, description).FromJust();
    target.draw(text, states);
  }
  target.display();
  const auto image = target.getTexture().copyToImage();
  auto result = Nan::New<v8::Object>();
  Set(result, "descriptions", descriptions);
  Set(result, "pixels", Nan::CopyBuffer(
      reinterpret_cast<const char*>(image.getPixelsPtr()), 320 * 200 * 4).ToLocalChecked());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(GlyphAliases) {
  auto* glyph = sfmljs::SharedHandle<sf::Glyph>::From(info[0]);
  auto* bounds = sfmljs::SharedHandle<sf::FloatRect>::From(info[1]);
  auto* texture = sfmljs::SharedHandle<sf::IntRect>::From(info[2]);
  if (!glyph || !bounds || !texture) return;
  info.GetReturnValue().Set(
      &glyph->owner()->bounds == bounds->owner().get() &&
      &glyph->owner()->textureRect == texture->owner().get());
}

NAN_METHOD(ReadGlyph) {
  auto* glyph = sfmljs::SharedHandle<sf::Glyph>::From(info[0]);
  if (!glyph) return;
  const auto* bytes = reinterpret_cast<const unsigned char*>(glyph->owner().get());
  auto result = Nan::New<v8::Array>(sizeof(sf::Glyph));
  for (unsigned i = 0; i < sizeof(sf::Glyph); ++i) {
    Nan::Set(result, i, Nan::New(bytes[i])).FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ShapedGlyphAliases) {
  auto* storage = sfmljs::SharedHandle<sfmljs::ShapedGlyphStorage>::From(info[0]);
  if (!storage || !info[1]->IsUint32()) return;
  const auto index = Nan::To<std::uint32_t>(info[1]).FromJust();
  if (index >= storage->owner()->size()) return Nan::ThrowRangeError("Invalid index");
  auto* glyph = sfmljs::SharedHandle<sf::Glyph>::From(info[2]);
  auto* position = sfmljs::SharedHandle<sf::Vector2f>::From(info[3]);
  if (!glyph || !position) return;
  const auto& entry = (*storage->owner())[index];
  info.GetReturnValue().Set(
      &entry.glyph == glyph->owner().get() &&
      &entry.position == position->owner().get());
}

NAN_METHOD(InspectTextState) {
  auto* handle = sfmljs::TextHandle::From(info[0]);
  if (!handle) return;
  auto& state = *handle->owner();
  auto& text = state.text;
  const double values[] = {
      double(text.getCharacterSize()), text.getLetterSpacing(),
      text.getLineSpacing(), double(text.getStyle()),
      double(text.getFillColor().toInteger()),
      double(text.getOutlineColor().toInteger()), text.getOutlineThickness(),
      double(text.getLineAlignment()), double(text.getTextOrientation()),
      double(text.getClusterGrouping())};
  auto result = Nan::New<v8::Object>();
  auto properties = Nan::New<v8::Array>(10);
  for (unsigned i = 0; i < 10; ++i) {
    Nan::Set(properties, i, Nan::New(values[i])).FromJust();
  }
  Set(result, "properties", properties);
  Set(result, "address", v8::BigInt::NewFromUnsigned(info.GetIsolate(),
      reinterpret_cast<std::uintptr_t>(&text)));
  namespace members = sfmljs::text_members;
  Set(result, "needsUpdate", Nan::New(
      members::Get<members::GeometryNeedUpdate>(text)));
  Set(result, "hasProcessor", Nan::New(
      static_cast<bool>(members::Get<members::PreProcessor>(text))));
  Set(result, "bounds", Box(members::Get<members::Bounds>(text)));
  if (!info[1]->IsUndefined()) {
    auto* transform =
        sfmljs::SharedHandle<sfmljs::TransformableState>::From(info[1]);
    if (!transform) return;
    const auto& a = handle->owner();
    const auto& b = transform->owner();
    Set(result, "sharesTransform", Nan::New(
        !a.owner_before(b) && !b.owner_before(a) &&
        b->object == &text && b.get() == &state));
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(SetTextCharacterSize) {
  auto* handle = sfmljs::TextHandle::From(info[0]);
  if (!handle || !info[1]->IsUint32()) return;
  handle->owner()->text.setCharacterSize(Nan::To<std::uint32_t>(info[1]).FromJust());
}

struct TextLifetime {
  std::weak_ptr<sfmljs::TextState> value;
};

NAN_METHOD(WatchTextLifetime) {
  auto* handle = sfmljs::TextHandle::From(info[0]);
  if (!handle) return;
  auto watch = std::make_shared<TextLifetime>();
  watch->value = handle->owner();
  info.GetReturnValue().Set(sfmljs::SharedHandle<TextLifetime>::Create(watch));
}

NAN_METHOD(IsTextAlive) {
  auto* watch = sfmljs::SharedHandle<TextLifetime>::From(info[0]);
  if (watch) info.GetReturnValue().Set(!watch->owner()->value.expired());
}
}  // namespace

NAN_MODULE_INIT(InitializeTextProbes) {
  Nan::SetMethod(target, "textOracle", TextOracle);
  Nan::SetMethod(target, "glyphAliases", GlyphAliases);
  Nan::SetMethod(target, "readGlyph", ReadGlyph);
  Nan::SetMethod(target, "shapedGlyphAliases", ShapedGlyphAliases);
  sfmljs::SetMethod<InspectTextState>(target, "inspectTextState");
  sfmljs::SetMethod<SetTextCharacterSize>(target, "setTextCharacterSize");
  sfmljs::SetMethod<WatchTextLifetime>(target, "watchTextLifetime");
  sfmljs::SetMethod<IsTextAlive>(target, "isTextAlive");
}
