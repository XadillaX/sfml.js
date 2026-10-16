#include "font-state.h"
#include "exception-boundary.h"
#include "image-state.h"
#include "value-binding.h"

#include <filesystem>

namespace sfmljs {
SFMLJS_MEMBER(FontSmooth, sf::Font, bool, m_isSmooth);
}  // namespace sfmljs

namespace {

using sfmljs::FontData;
using sfmljs::FontHandle;
using DataHandle = sfmljs::SharedHandle<FontData>;

v8::Local<v8::Object> MapFont(const std::shared_ptr<FontData>& owner) {
  const auto& data = owner->font.getInfo();
  auto result = sfmljs::NumericFields()
      .Add("id", data.id).Add("hasKerning", data.hasKerning)
      .Add("hasVerticalMetrics", data.hasVerticalMetrics)
      .Add("smooth", sfmljs::Field<sfmljs::FontSmooth>(owner->font)).Map(owner);
  Nan::Set(result, Nan::New("family").ToLocalChecked(),
      Nan::New(data.family).ToLocalChecked()).FromJust();
  return result;
}

NAN_METHOD(CreateSfmlFont) {
  auto* context = sfmljs::SharedHandle<sfmljs::GraphicsContext>::From(info[0]);
  if (!context) return;
  try {
    auto data = sfmljs::MakeThreadOwned<FontData>();
    if (!info[1]->IsUndefined()) {
      auto* source = FontHandle::From(info[1]);
      if (!source) return;
      data->bytes = source->owner()->current->bytes;
      data->font = source->owner()->current->font;
    }
    auto state = std::make_shared<sfmljs::FontState>(
        sfmljs::FontState{context->owner(), std::move(data)});
    auto result = MapFont(state->current);
    Nan::Set(result, Nan::New("handle").ToLocalChecked(),
        FontHandle::Create(state)).FromJust();
    info.GetReturnValue().Set(result);
  } catch (const std::exception& error) { sfmljs::ThrowError(error.what()); }
}

class OpenWorker final : public sfmljs::AsyncWorker {
 public:
  OpenWorker(Nan::Callback* callback, std::shared_ptr<FontData> data,
             std::string path)
      : sfmljs::AsyncWorker(callback, "sfml:Font"),
        data_(std::move(data)), path_(std::move(path)) {}
  void ExecuteWork() override {
    try {
      ok_ = data_->bytes
          ? data_->font.openFromMemory(data_->bytes->data(), data_->bytes->size())
          : data_->font.openFromFile(std::filesystem::path(
              std::u8string(path_.begin(), path_.end())));
    } catch (const std::exception& error) { SetErrorMessage(error.what()); }
  }
  void CompleteWork() override {
    Nan::HandleScope scope;
    v8::Local<v8::Value> result = Nan::Undefined();
    if (ok_) result = DataHandle::Create(data_);
    v8::Local<v8::Value> args[] = {Nan::Null(), result};
    callback->Call(2, args, async_resource);
  }
 private:
  std::shared_ptr<FontData> data_;
  std::string path_;
  bool ok_{};
};

NAN_METHOD(OpenFont) {
  if (!info[1]->IsFunction()) return Nan::ThrowTypeError("Expected a callback");
  try {
    auto data = sfmljs::MakeThreadOwned<FontData>();
    std::string path;
    if (info[0]->IsString()) {
      Nan::Utf8String input(info[0]);
      path.assign(*input, input.length());
      if (path.find('\0') != std::string::npos) {
        return Nan::ThrowTypeError("Invalid font path");
      }
    } else {
      std::span<const std::uint8_t> bytes;
      if (!sfmljs::ReadImageBytes(info[0], bytes)) return;
      data->bytes = std::make_shared<std::vector<std::uint8_t>>(
          bytes.begin(), bytes.end());
    }
    auto callback = std::make_unique<Nan::Callback>(info[1].As<v8::Function>());
    auto worker = std::make_unique<OpenWorker>(callback.get(), data, path);
    callback.release();
    Nan::AsyncQueueWorker(worker.release());
  } catch (const std::exception& error) { sfmljs::ThrowError(error.what()); }
}

NAN_METHOD(CommitFont) {
  auto* state = FontHandle::From(info[0]);
  if (!state) return;
  auto* data = DataHandle::From(info[1]);
  if (!data) return;
  data->owner()->font.setSmooth(state->owner()->current->font.isSmooth());
  state->owner()->current = data->owner();
  info.GetReturnValue().Set(MapFont(data->owner()));
}

NAN_METHOD(GetFontGlyph) {
  auto* state = FontHandle::From(info[0]);
  if (!state) return;
  if (!info[1]->IsUint32() || !info[2]->IsUint32() ||
      !info[3]->IsBoolean() || !info[4]->IsNumber() || !info[5]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected glyph, size, bold, outline and ID flag");
  }
  try {
    const auto& font = state->owner()->current->font;
    const auto id = Nan::To<std::uint32_t>(info[1]).FromJust();
    const auto size = Nan::To<unsigned>(info[2]).FromJust();
    const auto outline = static_cast<float>(Nan::To<double>(info[4]).FromJust());
    const auto& glyph = info[5]->IsTrue()
        ? font.getGlyphById(id, size, info[3]->IsTrue(), outline)
        : font.getGlyph(static_cast<char32_t>(id), size, info[3]->IsTrue(), outline);
    // Independent value: JS cannot corrupt the font's glyph cache.
    sfmljs::values::ReturnMapped(info, std::make_shared<sf::Glyph>(glyph));
  } catch (const std::exception& error) { sfmljs::ThrowError(error.what()); }
}

NAN_METHOD(FontMetric) {
  auto* state = FontHandle::From(info[0]);
  if (!state) return;
  if (!info[1]->IsUint32() || !info[2]->IsUint32()) {
    return Nan::ThrowTypeError("Expected a font metric and size/code point");
  }
  const auto& font = state->owner()->current->font;
  const auto value = Nan::To<unsigned>(info[2]).FromJust();
  float result{};
  switch (Nan::To<unsigned>(info[1]).FromJust()) {
    case 0: result = font.getAscent(value); break;
    case 1: result = font.getDescent(value); break;
    case 2: result = font.getLineSpacing(value); break;
    case 3: result = font.getUnderlinePosition(value); break;
    case 4: result = font.getUnderlineThickness(value); break;
    case 5:
      info.GetReturnValue().Set(font.hasGlyph(static_cast<char32_t>(value)));
      return;
    case 6:
      if (!info[3]->IsUint32() || !info[4]->IsUint32() || !info[5]->IsBoolean()) {
        return Nan::ThrowTypeError("Expected kerning arguments");
      }
      result = font.getKerning(static_cast<char32_t>(value),
          static_cast<char32_t>(Nan::To<unsigned>(info[3]).FromJust()),
          Nan::To<unsigned>(info[4]).FromJust(), info[5]->IsTrue());
      break;
    default: return Nan::ThrowRangeError("Invalid font metric");
  }
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SetFontSmooth) {
  auto* state = FontHandle::From(info[0]);
  if (!state) return;
  if (!info[1]->IsBoolean()) return Nan::ThrowTypeError("Expected a boolean");
  state->owner()->current->font.setSmooth(info[1]->IsTrue());
}

NAN_METHOD(GetFontTexture) {
  auto* state = FontHandle::From(info[0]);
  if (!state) return;
  if (!info[1]->IsUint32()) return Nan::ThrowTypeError("Expected character size");
  try {
    auto context = state->owner()->context;
    auto font = state->owner()->current;
    const auto& texture = font->font.getTexture(Nan::To<unsigned>(info[1]).FromJust());
    const auto id = context->nextId++;
    auto atlas = sfmljs::MakeThreadOwned<sfmljs::FontAtlas>(
        context, font, id);
    auto alias = std::shared_ptr<const sf::Texture>(atlas, &texture);
    context->textures.emplace(id, alias);
    auto result = Nan::New<v8::Object>();
    Nan::Set(result, Nan::New("info").ToLocalChecked(),
        sfmljs::MapTexture(alias)).FromJust();
    Nan::Set(result, Nan::New("handle").ToLocalChecked(),
        sfmljs::SharedHandle<const sf::Texture>::Create(alias)).FromJust();
    Nan::Set(result, Nan::New("id").ToLocalChecked(), Nan::New(id)).FromJust();
    info.GetReturnValue().Set(result);
  } catch (const std::exception& error) { sfmljs::ThrowError(error.what()); }
}

NAN_METHOD(GetTextureInfo) {
  const auto texture = sfmljs::ReadTexture(info[0]);
  if (texture) info.GetReturnValue().Set(sfmljs::DescribeTexture(*texture));
}

}  // namespace

NAN_MODULE_INIT(InitializeFont) {
  sfmljs::SetMethod<CreateSfmlFont>(target, "createFont");
  sfmljs::SetMethod<OpenFont>(target, "openFont");
  sfmljs::SetMethod<CommitFont>(target, "commitFont");
  sfmljs::SetMethod<GetFontGlyph>(target, "getFontGlyph");
  sfmljs::SetMethod<FontMetric>(target, "fontMetric");
  sfmljs::SetMethod<SetFontSmooth>(target, "setFontSmooth");
  sfmljs::SetMethod<GetFontTexture>(target, "getFontTexture");
  sfmljs::SetMethod<GetTextureInfo>(target, "getTextureInfo");
  using GlyphValues = sfmljs::values::Family<sf::Glyph>;
  sfmljs::SetMethod<GlyphValues::Wrap>(target, "wrapGlyph");
  sfmljs::SetMethod<sfmljs::values::Member<GlyphValues>>(target, "glyphMember");
}
