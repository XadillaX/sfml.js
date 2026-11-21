// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Animation.h>
#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/DecorationTypes.h>
#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/RenderInterface.h>
#include <RmlUi/Core/StreamMemory.h>
#include <RmlUi/Core/StyleSheet.h>
#include <RmlUi/Core/StyleSheetContainer.h>
#include <RmlUi/Core/SystemInterface.h>

#include <cassert>
#include <cstdint>
#include <functional>
#include <iostream>
#include <limits>
#include <type_traits>
#include <utility>

#include "vendor/rmlui/Source/Core/ElementAnimation.h"
#include "vendor/rmlui/Source/Core/ElementDefinition.h"
#include "vendor/rmlui/Source/Core/StyleSheetNode.h"
#include "vendor/rmlui/Source/Core/StyleSheetParser.h"

namespace sfmlrmlui {

// This Core probe creates no JS runtime, Lua state or registered data models.
void InvalidateLuaModel(Rml::Context*, Rml::DataModel*) {
  assert(false && "Stylesheet contracts must not create data models");
}

void ReleaseLuaContextModels(Rml::Context*) {}

}  // namespace sfmlrmlui

namespace {

class BasicRenderer : public Rml::RenderInterface {
 public:
  Rml::CompiledGeometryHandle CompileGeometry(Rml::Span<const Rml::Vertex>,
                                              Rml::Span<const int>) override {
    assert(false && "Stylesheet contracts must not draw");
    return 0;
  }

  void RenderGeometry(Rml::CompiledGeometryHandle,
                      Rml::Vector2f,
                      Rml::TextureHandle) override {
    assert(false && "Stylesheet contracts must not draw");
  }

  void ReleaseGeometry(Rml::CompiledGeometryHandle) override {}

  Rml::TextureHandle LoadTexture(Rml::Vector2i&, const Rml::String&) override {
    assert(false && "Stylesheet contracts must not load textures");
    return 0;
  }

  Rml::TextureHandle GenerateTexture(Rml::Span<const Rml::byte>,
                                     Rml::Vector2i) override {
    assert(false && "Stylesheet contracts must not generate textures");
    return 0;
  }

  void ReleaseTexture(Rml::TextureHandle) override {}

  void EnableScissorRegion(bool) override {}

  void SetScissorRegion(Rml::Rectanglei) override {}
};

void CheckScalarAndHandleTypes() {
  static_assert(std::is_same_v<Rml::byte, unsigned char>);
  static_assert(std::is_same_v<Rml::ScriptObject, void*>);
  static_assert(std::is_same_v<Rml::TouchId, uintptr_t>);
  static_assert(std::is_same_v<Rml::FileHandle, uintptr_t>);
  static_assert(std::is_same_v<Rml::TextureHandle, uintptr_t>);
  static_assert(std::is_same_v<Rml::CompiledGeometryHandle, uintptr_t>);
  static_assert(std::is_same_v<Rml::CompiledFilterHandle, uintptr_t>);
  static_assert(std::is_same_v<Rml::CompiledShaderHandle, uintptr_t>);
  static_assert(std::is_same_v<Rml::DecoratorDataHandle, uintptr_t>);
  static_assert(std::is_same_v<Rml::FontFaceHandle, uintptr_t>);
  static_assert(std::is_same_v<Rml::FontEffectsHandle, uintptr_t>);
  static_assert(std::is_same_v<Rml::LayerHandle, uintptr_t>);

  static_assert(
      std::is_same_v<std::underlying_type_t<Rml::Character>, char32_t>);
  static_assert(std::is_same_v<std::underlying_type_t<Rml::EventId>, uint16_t>);
  static_assert(
      std::is_same_v<std::underlying_type_t<Rml::PropertyId>, uint8_t>);
  static_assert(
      std::is_same_v<std::underlying_type_t<Rml::MediaQueryId>, uint8_t>);
  static_assert(std::is_same_v<std::underlying_type_t<Rml::FamilyId>, int>);
  assert(static_cast<char32_t>(Rml::Character::Null) == 0);
  assert(static_cast<char32_t>(Rml::Character::Replacement) == 0xfffd);

  const Rml::BoxArea areas[]{Rml::BoxArea::Margin,
                             Rml::BoxArea::Border,
                             Rml::BoxArea::Padding,
                             Rml::BoxArea::Content,
                             Rml::BoxArea::Auto};
  for (int i = 0; i < 5; ++i) {
    assert(static_cast<int>(areas[i]) == i);
  }

  static_assert(
      std::is_same_v<std::underlying_type_t<Rml::StableVectorIndex>, uint32_t>);
  static_assert(
      std::is_same_v<std::underlying_type_t<Rml::TextureFileIndex>, uint32_t>);
  assert(static_cast<uint32_t>(Rml::StableVectorIndex::Invalid) ==
         std::numeric_limits<uint32_t>::max());
  assert(static_cast<uint32_t>(Rml::TextureFileIndex::Invalid) ==
         std::numeric_limits<uint32_t>::max());
  std::cout << "PASS native-types-scalar-handle-and-index-abi\n";
}

void CheckConfiguredAliases() {
  static_assert(std::is_same_v<Rml::Colourf, Rml::Colour<float, 1, false>>);
  static_assert(
      std::is_same_v<Rml::Colourb, Rml::Colour<Rml::byte, 255, false>>);
  static_assert(std::is_same_v<Rml::ColourbPremultiplied,
                               Rml::Colour<Rml::byte, 255, true>>);
  static_assert(std::is_same_v<Rml::Vector2i, Rml::Vector2<int>>);
  static_assert(std::is_same_v<Rml::Vector2f, Rml::Vector2<float>>);
  static_assert(std::is_same_v<Rml::Vector3i, Rml::Vector3<int>>);
  static_assert(std::is_same_v<Rml::Vector3f, Rml::Vector3<float>>);
  static_assert(std::is_same_v<Rml::Vector4i, Rml::Vector4<int>>);
  static_assert(std::is_same_v<Rml::Vector4f, Rml::Vector4<float>>);
  static_assert(std::is_same_v<Rml::Rectanglei, Rml::Rectangle<int>>);
  static_assert(std::is_same_v<Rml::Rectanglef, Rml::Rectangle<float>>);
  static_assert(
      std::is_same_v<Rml::ColumnMajorMatrix4f,
                     Rml::Matrix4<float, Rml::ColumnMajorStorage<float>>>);
  static_assert(
      std::is_same_v<Rml::RowMajorMatrix4f,
                     Rml::Matrix4<float, Rml::RowMajorStorage<float>>>);
  static_assert(std::is_same_v<Rml::Matrix4f, Rml::ColumnMajorMatrix4f>);

  static_assert(
      std::is_same_v<Rml::ElementPtr, Rml::UniqueReleaserPtr<Rml::Element>>);
  static_assert(
      std::is_same_v<Rml::ContextPtr, Rml::UniqueReleaserPtr<Rml::Context>>);
  static_assert(
      std::is_same_v<Rml::EventPtr, Rml::UniqueReleaserPtr<Rml::Event>>);
  static_assert(
      std::is_same_v<Rml::DataViewPtr, Rml::UniqueReleaserPtr<Rml::DataView>>);
  static_assert(std::is_same_v<Rml::DataControllerPtr,
                               Rml::UniqueReleaserPtr<Rml::DataController>>);
  static_assert(std::is_same_v<Rml::ElementList, Rml::Vector<Rml::Element*>>);
  static_assert(
      std::is_same_v<Rml::OwnedElementList, Rml::Vector<Rml::ElementPtr>>);
  static_assert(std::is_same_v<Rml::VariantList, Rml::Vector<Rml::Variant>>);
  static_assert(std::is_same_v<Rml::ElementAnimationList,
                               Rml::Vector<Rml::ElementAnimation>>);
  static_assert(std::is_same_v<Rml::AttributeNameList,
                               Rml::SmallUnorderedSet<Rml::String>>);
  static_assert(
      std::is_same_v<Rml::PropertyMap,
                     Rml::UnorderedMap<Rml::PropertyId, Rml::Property>>);
  static_assert(
      std::is_same_v<Rml::Dictionary,
                     Rml::SmallUnorderedMap<Rml::String, Rml::Variant>>);
  static_assert(std::is_same_v<Rml::ElementAttributes, Rml::Dictionary>);
  static_assert(std::is_same_v<Rml::XMLAttributes, Rml::Dictionary>);
  static_assert(
      std::is_same_v<Rml::AnimationList, Rml::Vector<Rml::Animation>>);
  static_assert(
      std::is_same_v<Rml::ColorStopList, Rml::Vector<Rml::ColorStop>>);
  static_assert(
      std::is_same_v<Rml::BoxShadowList, Rml::Vector<Rml::BoxShadow>>);
  static_assert(std::is_same_v<Rml::FilterHandleList,
                               Rml::Vector<Rml::CompiledFilterHandle>>);
  static_assert(
      std::is_same_v<Rml::TransformPtr, Rml::SharedPtr<Rml::Transform>>);

  const Rml::TouchList touches{{17, {2, 3}}, {23, {5, 7}}};
  assert(touches.size() == 2 && touches[1].identifier == 23);
  assert(touches[1].position == Rml::Vector2f(5, 7));
  Rml::VariantList values{Rml::Variant(17), Rml::Variant(Rml::String("text"))};
  assert(values[0].Get<int>() == 17);
  assert(values[1].Get<Rml::String>() == "text");
  std::cout << "PASS native-types-configured-aliases-and-touch-storage\n";
}

template <typename Enum>
void CheckEnumHash(Enum value) {
  using Underlying = std::underlying_type_t<Enum>;
  static_assert(std::is_same_v<typename std::hash<Enum>::utype, Underlying>);
  static_assert(noexcept(std::hash<Enum>{}(value)));
  assert(std::hash<Enum>{}(value) ==
         std::hash<Underlying>{}(static_cast<Underlying>(value)));

  Rml::UnorderedMap<Enum, int> values;
  values[value] = 17;
  assert(values.at(value) == 17);
}

void CheckHashes() {
  CheckEnumHash(Rml::PropertyId::Width);
  CheckEnumHash(Rml::Character::Replacement);
  CheckEnumHash(static_cast<Rml::Character>(0x1f600));
  CheckEnumHash(static_cast<Rml::FamilyId>(17));

  size_t seed = 31;
  const size_t expected = seed ^ (Rml::Hash<Rml::String>{}("value") +
                                  0x9e3779b9 + (seed << 6) + (seed >> 2));
  Rml::Utilities::HashCombine(seed, Rml::String("value"));
  assert(seed == expected);
  std::cout << "PASS native-types-enum-hash-and-hash-combine\n";
}

Rml::MediaBlockList Parse(const Rml::String& source) {
  Rml::StreamMemory stream(reinterpret_cast<const Rml::byte*>(source.data()),
                           source.size());
  Rml::StyleSheetParser parser;
  Rml::MediaBlockList blocks;
  assert(parser.Parse(blocks, &stream, 1));
  return blocks;
}

void CheckParsedKeyframesAndDecorators() {
  auto blocks = Parse(
      "@keyframes pulse {"
      "to{opacity:1;}50%{width:12px;}from{opacity:0;}50%{height:20px;}}"
      "@decorator tint:horizontal-gradient{start-color:red;stop-color:blue;}");
  assert(blocks.size() == 1);
  const auto* frames = blocks[0].stylesheet->GetKeyframes("pulse");
  assert(frames && frames->blocks.size() == 3);
  assert(frames->blocks[0].normalized_time == 0);
  assert(frames->blocks[1].normalized_time == 0.5f);
  assert(frames->blocks[2].normalized_time == 1);
  // Upstream replaces the complete property block at duplicate times.
  assert(!frames->blocks[1].properties.GetProperty(Rml::PropertyId::Width));
  const auto* height =
      frames->blocks[1].properties.GetProperty(Rml::PropertyId::Height);
  assert(height && height->Get<float>() == 20);
  assert((frames->property_ids ==
          Rml::Vector<Rml::PropertyId>{Rml::PropertyId::Height,
                                       Rml::PropertyId::Opacity}));

  Rml::KeyframeBlock explicit_block(0.25f);
  assert(explicit_block.normalized_time == 0.25f);
  assert(explicit_block.properties.Empty());
  Rml::KeyframesMap copied{{"pulse", *frames}};
  copied["pulse"].blocks[1].properties.Clear();
  assert(!frames->blocks[1].properties.Empty());

  const auto* decorator = blocks[0].stylesheet->GetNamedDecorator("tint");
  assert(decorator && decorator->type == "horizontal-gradient");
  assert(decorator->instancer ==
         Rml::Factory::GetDecoratorInstancer("horizontal-gradient"));
  assert(!decorator->properties.Empty());
  Rml::NamedDecoratorMap named{{"tint", *decorator}};
  named["tint"].properties.Clear();
  assert(!decorator->properties.Empty());
  assert(!blocks[0].stylesheet->GetKeyframes("missing"));
  assert(!blocks[0].stylesheet->GetNamedDecorator("missing"));
  std::cout << "PASS native-stylesheet-keyframes-and-named-decorator-copies\n";
}

void CheckMediaBlocks(Rml::Context* context) {
  Rml::MediaBlock empty;
  assert(empty.properties.Empty() && !empty.stylesheet);
  assert(empty.modifier == Rml::MediaQueryModifier::None);
  assert(static_cast<int>(Rml::MediaQueryModifier::None) == 0);
  assert(static_cast<int>(Rml::MediaQueryModifier::Not) == 1);

  const Rml::String source =
      "div{width:1px;}"
      "@media not (min-width:100px) and (min-height:200px){div{width:9px;}}";
  auto blocks = Parse(source);
  assert(blocks.size() == 2);
  assert(blocks[1].modifier == Rml::MediaQueryModifier::Not);
  assert(blocks[1].properties.GetNumProperties() == 2);
  Rml::MediaBlock moved(
      blocks[1].properties, blocks[1].stylesheet, Rml::MediaQueryModifier::Not);
  assert(moved.stylesheet == blocks[1].stylesheet);
  assert(moved.modifier == Rml::MediaQueryModifier::Not);
  moved.properties.Clear();
  assert(blocks[1].properties.GetNumProperties() == 2);

  Rml::StreamMemory stream(reinterpret_cast<const Rml::byte*>(source.data()),
                           source.size());
  Rml::StyleSheetContainer container;
  assert(container.LoadStyleSheetContainer(&stream));
  auto* document = context->LoadDocumentFromMemory(
      "<rml><body><div id='target'/></body></rml>");
  assert(document);
  const auto* target = document->GetElementById("target");
  assert(target);

  const Rml::Vector2i dimensions[]{
      {160, 120}, {160, 240}, {80, 240}, {80, 120}};
  const float widths[]{9, 1, 9, 9};
  const bool changed[]{true, true, true, false};
  for (size_t i = 0; i < 4; ++i) {
    context->SetDimensions(dimensions[i]);
    assert(container.UpdateCompiledStyleSheet(context) == changed[i]);
    auto definition =
        container.GetCompiledStyleSheet()->GetElementDefinition(target);
    assert(definition->GetProperty(Rml::PropertyId::Width)->Get<float>() ==
           widths[i]);
    assert(!container.UpdateCompiledStyleSheet(context));
  }

  document->Close();
  context->Update();
  std::cout << "PASS native-stylesheet-media-blocks-and-negated-conjunction\n";
}

void CheckNodeIndex() {
  Rml::StyleSheetNode root;
  Rml::CompoundSelector selectors[4];
  selectors[0].tag = "div";
  selectors[0].id = "target";
  selectors[0].class_names = {"item"};
  selectors[1].tag = "div";
  selectors[1].class_names = {"item", "item"};
  selectors[2].tag = "span";
  Rml::StyleSheetNode* nodes[4]{};

  Rml::PropertyDictionary properties;
  properties.SetProperty(Rml::PropertyId::Width,
                         Rml::Property(17.f, Rml::Unit::PX));
  for (size_t i = 0; i < 4; ++i) {
    nodes[i] = root.GetOrCreateChildNode(selectors[i]);
    nodes[i]->ImportProperties(properties, 0);
  }

  Rml::StyleSheetIndex index;
  root.BuildIndex(index);
  assert(index.ids.size() == 1 && index.classes.size() == 1);
  assert(index.tags.size() == 1 && index.other.size() == 1);
  assert(index.ids.at(Rml::Hash<Rml::String>{}("target")) ==
         Rml::StyleSheetIndex::NodeList{nodes[0]});
  assert(index.classes.at(Rml::Hash<Rml::String>{}("item")) ==
         Rml::StyleSheetIndex::NodeList{nodes[1]});
  assert(index.tags.at(Rml::Hash<Rml::String>{}("span")) ==
         Rml::StyleSheetIndex::NodeList{nodes[2]});
  assert(index.other.front() == nodes[3]);

  const Rml::StyleSheetIndex::NodeList key{nodes[0], nodes[1]};
  size_t expected = 0;
  for (const auto* node : key) {
    Rml::Utilities::HashCombine(expected, node);
  }
  assert(std::hash<Rml::StyleSheetIndex::NodeList>{}(key) == expected);
  assert(std::hash<Rml::StyleSheetIndex::NodeList>{}({}) == 0);
  Rml::UnorderedMap<Rml::StyleSheetIndex::NodeList, int> cache;
  cache[key] = 17;
  assert(cache.at(Rml::StyleSheetIndex::NodeList(key)) == 17);
  cache[Rml::StyleSheetIndex::NodeList{nodes[1], nodes[0]}] = 23;
  assert(cache.size() == 2 && cache.at(key) == 17);
  std::cout << "PASS native-stylesheet-prioritized-node-index-and-cache-key\n";
}

}  // namespace

int main() {
  CheckScalarAndHandleTypes();
  CheckConfiguredAliases();
  CheckHashes();

  BasicRenderer renderer;
  Rml::SystemInterface system;
  Rml::SetRenderInterface(&renderer);
  Rml::SetSystemInterface(&system);
  assert(Rml::Initialise());
  auto* context = Rml::CreateContext("stylesheet-contracts", {160, 120});
  assert(context);

  CheckParsedKeyframesAndDecorators();
  CheckMediaBlocks(context);
  CheckNodeIndex();

  assert(Rml::RemoveContext("stylesheet-contracts"));
  Rml::Shutdown();
  Rml::SetRenderInterface(nullptr);
  Rml::SetSystemInterface(nullptr);
}
