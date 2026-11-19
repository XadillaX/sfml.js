// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/textures/rmlui-spritesheet.h"

#include <cmath>
#include <limits>
#include <memory>
#include <utility>

#include "native/rendering/textures/rmlui-texture-source.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/effects/rmlui-filter.h"

namespace sfmlrmlui {
namespace {

struct ListState {
  Rml::SpritesheetList value;
  uint64_t generation{0};
};

using ListHandle = sfmljs::SharedHandle<ListState>;

ListState* ListOf(v8::Local<v8::Value> input) {
  if (!RuntimeReady()) {
    return nullptr;
  }
  auto* handle = ListHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a spritesheet list");
    return nullptr;
  }
  auto* state = handle->owner().get();
  if (state->generation != State().generation) {
    Nan::ThrowError("Spritesheet list is no longer valid");
    return nullptr;
  }
  return state;
}

bool ReadString(v8::Local<v8::Value> input, Rml::String* result) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a spritesheet string");
    return false;
  }
  Nan::Utf8String text(input);
  result->assign(*text, text.length());
  return true;
}

bool ReadDefinitions(v8::Local<v8::Value> input,
                     Rml::SpriteDefinitionList* result) {
  if (!input->IsArray()) {
    Nan::ThrowTypeError("Expected sprite name and rectangle pairs");
    return false;
  }
  const auto definitions = input.As<v8::Array>();
  for (uint32_t i = 0, count = definitions->Length(); i < count; ++i) {
    v8::Local<v8::Value> entry;
    if (!Nan::Get(definitions, i).ToLocal(&entry)) {
      return false;
    }
    if (!entry->IsArray() || entry.As<v8::Array>()->Length() != 2) {
      Nan::ThrowTypeError("Expected a sprite name and rectangle pair");
      return false;
    }
    v8::Local<v8::Value> name;
    v8::Local<v8::Value> rectangle;
    Rml::String text;
    Rml::Rectanglef bounds;
    const auto pair = entry.As<v8::Array>();
    if (!Nan::Get(pair, 0).ToLocal(&name) ||
        !Nan::Get(pair, 1).ToLocal(&rectangle) || !ReadString(name, &text) ||
        !ReadFilterRectangle(rectangle, &bounds)) {
      return false;
    }
    result->emplace_back(std::move(text), bounds);
  }
  return true;
}

NAN_METHOD(CreateList) {
  auto state = std::make_shared<ListState>();
  state->generation = State().generation;
  info.GetReturnValue().Set(ListHandle::Create(std::move(state)));
}

NAN_METHOD(AddSpriteSheet) {
  Rml::String name;
  Rml::String image_source;
  Rml::String definition_source;
  if (!ReadString(info[1], &name) || !ReadString(info[2], &image_source) ||
      !ReadString(info[3], &definition_source)) {
    return;
  }
  if (!info[4]->IsInt32()) {
    return Nan::ThrowRangeError("Expected an int32 definition line number");
  }
  if (!info[5]->IsNumber()) {
    return Nan::ThrowTypeError("Expected a finite display scale");
  }
  const int line = Nan::To<int32_t>(info[4]).FromJust();
  const float scale = static_cast<float>(Nan::To<double>(info[5]).FromJust());
  if (!std::isfinite(scale)) {
    return Nan::ThrowRangeError("Expected a finite display scale");
  }
  Rml::SpriteDefinitionList definitions;
  if (!ReadDefinitions(info[6], &definitions)) {
    return;
  }
  // Rectangles may have accessors that remove contexts or restart the runtime.
  if (auto* state = ListOf(info[0])) {
    info.GetReturnValue().Set(state->value.AddSpriteSheet(
        name, image_source, definition_source, line, scale, definitions));
  }
}

NAN_METHOD(GetSprite) {
  Rml::String name;
  if (!ReadString(info[1], &name)) {
    return;
  }
  if (auto* state = ListOf(info[0])) {
    info.GetReturnValue().Set(WrapSprite(state->value.GetSprite(name)));
  }
}

NAN_METHOD(Merge) {
  auto* left = ListOf(info[0]);
  auto* right = ListOf(info[1]);
  if (left && right) {
    // Vector insertion from the same vector is undefined upstream. Preserve
    // the intended append/overwrite semantics for self-merge with a snapshot.
    if (left == right) {
      const auto copy = right->value;
      left->value.Merge(copy);
    } else {
      left->value.Merge(right->value);
    }
  }
}

NAN_METHOD(Reserve) {
  for (int i : {1, 2}) {
    if (!info[i]->IsUint32() || Nan::To<uint32_t>(info[i]).FromJust() >
                                    std::numeric_limits<int>::max()) {
      return Nan::ThrowRangeError("Expected a bounded spritesheet count");
    }
  }
  if (auto* state = ListOf(info[0])) {
    state->value.Reserve(Nan::To<uint32_t>(info[1]).FromJust(),
                         Nan::To<uint32_t>(info[2]).FromJust());
  }
}

template <bool sheets>
NAN_METHOD(Count) {
  if (auto* state = ListOf(info[0])) {
    const size_t count =
        sheets ? state->value.NumSpriteSheets() : state->value.NumSprites();
    info.GetReturnValue().Set(static_cast<double>(count));
  }
}

}  // namespace

v8::Local<v8::Value> WrapSprite(const Rml::Sprite* sprite) {
  if (!sprite) {
    return Nan::Null();
  }
  const auto* sheet = sprite->sprite_sheet;
  auto metadata = Nan::New<v8::Object>();
  const auto context = Nan::GetCurrentContext();
  metadata
      ->CreateDataProperty(context,
                           Nan::New("name").ToLocalChecked(),
                           Nan::New(sheet->name).ToLocalChecked())
      .FromJust();
  metadata
      ->CreateDataProperty(context,
                           Nan::New("definitionLineNumber").ToLocalChecked(),
                           Nan::New(sheet->definition_line_number))
      .FromJust();
  metadata
      ->CreateDataProperty(context,
                           Nan::New("displayScale").ToLocalChecked(),
                           Nan::New(sheet->display_scale))
      .FromJust();
  metadata
      ->CreateDataProperty(context,
                           Nan::New("textureSource").ToLocalChecked(),
                           WrapTextureSource(sheet->texture_source))
      .FromJust();
  auto result = Nan::New<v8::Object>();
  result
      ->CreateDataProperty(context,
                           Nan::New("rectangle").ToLocalChecked(),
                           WrapFilterRectangle(sprite->rectangle))
      .FromJust();
  result
      ->CreateDataProperty(
          context, Nan::New("spriteSheet").ToLocalChecked(), metadata)
      .FromJust();
  return result;
}

NAN_MODULE_INIT(InitializeRmlSpritesheet) {
  SetInstancerValueMethod<CreateList>(target, "createSpritesheetList");
  SetInstancerValueMethod<AddSpriteSheet>(target, "spritesheetListAdd");
  SetInstancerValueMethod<GetSprite>(target, "spritesheetListGetSprite");
  SetInstancerValueMethod<Merge>(target, "spritesheetListMerge");
  SetInstancerValueMethod<Reserve>(target, "spritesheetListReserve");
  SetInstancerValueMethod<Count<true>>(target, "spritesheetListNumSheets");
  SetInstancerValueMethod<Count<false>>(target, "spritesheetListNumSprites");
}

}  // namespace sfmlrmlui
