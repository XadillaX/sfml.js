// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Animation.h>
#include <RmlUi/Core/DecorationTypes.h>
#include <RmlUi/Core/StyleSheetSpecification.h>
#include <RmlUi/Core/StyleSheetTypes.h>
#include <RmlUi/Core/Transform.h>
#include <RmlUi/Core/TypeConverter.h>

#include <cassert>
#include <iostream>
#include <utility>

namespace {

template <typename Value>
Value CheckCopy(const Value& source) {
  Value destination{};
  assert((Rml::TypeConverter<Value, Value>::Convert(source, destination)));
  assert(destination == source);
  return destination;
}

template <typename Value>
void CheckText(const Value& source, const Rml::String& expected) {
  Rml::String destination = "prefix:";
  assert(
      (Rml::TypeConverter<Value, Rml::String>::Convert(source, destination)));
  assert(destination == expected);
  assert(Rml::ToString(source, "prefix:") == expected);
}

void CheckUnits() {
  using Rml::Unit;
  const std::pair<Unit, const char*> suffixes[] = {
      {Unit::NUMBER, ""},
      {Unit::PERCENT, "%"},
      {Unit::PX, "px"},
      {Unit::DP, "dp"},
      {Unit::VW, "vw"},
      {Unit::VH, "vh"},
      {Unit::X, "x"},
      {Unit::EM, "em"},
      {Unit::REM, "rem"},
      {Unit::INCH, "in"},
      {Unit::CM, "cm"},
      {Unit::MM, "mm"},
      {Unit::PT, "pt"},
      {Unit::PC, "pc"},
      {Unit::DEG, "deg"},
      {Unit::RAD, "rad"},
  };
  for (const auto& [unit, suffix] : suffixes) {
    CheckText(unit, suffix);
  }

  for (Unit unit : {Unit::UNKNOWN,
                    Unit::KEYWORD,
                    Unit::STRING,
                    Unit::COLOUR,
                    Unit::RATIO,
                    Unit::TRANSFORM,
                    Unit::TRANSITION,
                    Unit::ANIMATION,
                    Unit::DECORATOR,
                    Unit::FILTER,
                    Unit::FONTEFFECT,
                    Unit::COLORSTOPLIST,
                    Unit::BOXSHADOWLIST,
                    Unit::VAR_EXPRESSION,
                    Unit::SHORTHAND_PLACEHOLDER,
                    Unit::LENGTH,
                    Unit::ANGLE,
                    Unit::NUMERIC}) {
    Rml::String text = "fallback";
    assert((!Rml::TypeConverter<Unit, Rml::String>::Convert(unit, text)));
    assert(text == "fallback");
    assert(Rml::ToString(unit, "fallback") == "fallback");
  }
  std::cout << "PASS individual-unit-suffixes-and-unsupported-defaults\n";
}

void CheckTransforms() {
  Rml::TransformPtr transform;
  assert(!CheckCopy(transform));
  CheckText(transform, "none");

  transform = Rml::MakeShared<Rml::Transform>();
  CheckText(transform, "");
  transform->AddPrimitive(Rml::Transforms::TranslateX(7, Rml::Unit::PX));
  transform->AddPrimitive(Rml::Transforms::Scale2D(2));
  auto copy = CheckCopy(transform);
  assert(copy.get() == transform.get());
  CheckText(transform, "translateX(7px) scale(2, 2)");
  transform.reset();
  assert(copy->GetNumPrimitives() == 2);
  std::cout << "PASS shared-transform-identity-and-string-replacement\n";
}

void CheckTransitionsAndAnimations() {
  Rml::TransitionList transitions;
  CheckCopy(transitions);
  CheckText(transitions, "none");
  transitions.none = false;
  CheckText(transitions, "prefix:");

  Rml::Transition transition;
  transition.id = Rml::PropertyId::Width;
  transition.duration = 2;
  transition.delay = 0.5f;
  transition.reverse_adjustment_factor = 0.25f;
  transitions.transitions.push_back(transition);
  auto copied_transitions = CheckCopy(transitions);
  copied_transitions.transitions[0].duration = 9;
  assert(transitions.transitions[0].duration == 2);
  CheckText(transitions, "prefix:width linear-out 2s 0.5s 0.25");
  transitions.transitions.push_back(transition);
  CheckText(transitions,
            "prefix:width linear-out 2s 0.5s 0.25, "
            "width linear-out 2s 0.5s 0.25");

  Rml::AnimationList animations;
  CheckCopy(animations);
  CheckText(animations, "prefix:");
  Rml::Animation animation;
  animation.duration = 2;
  animation.delay = 0.5f;
  animation.alternate = true;
  animation.paused = true;
  animation.num_iterations = -1;
  animation.name = "pulse";
  animations.push_back(animation);
  auto copied_animations = CheckCopy(animations);
  copied_animations[0].name = "changed";
  assert(animations[0].name == "pulse");
  CheckText(animations,
            "prefix:2s linear-out 0.5s alternate paused infinite pulse");

  animation.delay = 0;
  animation.alternate = false;
  animation.paused = false;
  animation.num_iterations = 3;
  animations.push_back(animation);
  CheckText(animations,
            "prefix:2s linear-out 0.5s alternate paused "
            "infinite pulse, 2s linear-out 3 pulse");
  std::cout << "PASS transition-animation-copy-and-string-append-contracts\n";
}

void CheckDeclarationEffects() {
  Rml::DecoratorsPtr decorators;
  assert(!CheckCopy(decorators));
  CheckText(decorators, "none");
  auto decorator_list = Rml::MakeShared<Rml::DecoratorDeclarationList>();
  decorators = decorator_list;
  CheckText(decorators, "none");

  decorator_list->list.push_back({"named", nullptr, {}, Rml::BoxArea::Border});
  decorator_list->list.push_back({"other", nullptr, {}, Rml::BoxArea::Content});
  assert(CheckCopy(decorators).get() == decorators.get());
  CheckText(decorators, "named border-box, other");
  decorator_list->value = "cached decorators";
  CheckText(decorators, "prefix:cached decorators");
  decorator_list.reset();
  assert(decorators->list.size() == 2);

  Rml::FiltersPtr filters;
  assert(!CheckCopy(filters));
  CheckText(filters, "none");
  auto filter_list = Rml::MakeShared<Rml::FilterDeclarationList>();
  filters = filter_list;
  CheckText(filters, "none");
  filter_list->list.push_back({"first", nullptr, {}});
  filter_list->list.push_back({"second", nullptr, {}});
  assert(CheckCopy(filters).get() == filters.get());
  CheckText(filters, "first second");
  filter_list->value = "cached filters";
  CheckText(filters, "prefix:cached filters");
  filter_list.reset();
  assert(filters->list.size() == 2);

  Rml::FontEffectsPtr font_effects;
  assert(!CheckCopy(font_effects));
  CheckText(font_effects, "none");
  auto font_list = Rml::MakeShared<Rml::FontEffects>();
  font_effects = font_list;
  CheckText(font_effects, "none");
  // Null is an actual allowed list entry; serialization reads cached text only.
  font_list->list.emplace_back();
  font_list->value = "cached font effects";
  assert(CheckCopy(font_effects).get() == font_effects.get());
  CheckText(font_effects, "prefix:cached font effects");
  font_list->value.clear();
  CheckText(font_effects, "prefix:");
  font_list.reset();
  assert(font_effects->list.size() == 1);
  std::cout << "PASS effect-shared-copies-caches-separators-and-empty-values\n";
}

void CheckStopsAndShadows() {
  using Rml::Unit;
  Rml::ColorStopList stops;
  CheckCopy(stops);
  CheckText(stops, "");
  stops.push_back({Rml::Colourb(255, 0, 0).ToPremultiplied(),
                   Rml::NumericValue(25, Unit::PERCENT)});
  stops.push_back({Rml::Colourb(0, 0, 255).ToPremultiplied(),
                   Rml::NumericValue(2, Unit::UNKNOWN)});
  auto copied_stops = CheckCopy(stops);
  copied_stops[0].position.number = 91;
  assert(stops[0].position.number == 25);
  CheckText(stops, "#ff0000 25%, #0000ff");

  Rml::BoxShadowList shadows;
  CheckCopy(shadows);
  CheckText(shadows, "");
  Rml::BoxShadow shadow;
  shadow.color = Rml::Colourb(255, 0, 0).ToPremultiplied();
  shadow.offset_x = {1, Unit::PX};
  shadow.offset_y = {2, Unit::EM};
  shadow.blur_radius = {3, Unit::UNKNOWN};
  shadow.spread_distance = {4, Unit::PX};
  shadow.inset = true;
  shadows.push_back(shadow);
  auto copied_shadows = CheckCopy(shadows);
  copied_shadows[0].offset_x.number = 91;
  assert(shadows[0].offset_x.number == 1);
  CheckText(shadows, "#ff0000 1px 2em 4px inset");
  shadow.color = Rml::Colourb(0, 0, 255).ToPremultiplied();
  shadow.inset = false;
  shadows.push_back(shadow);
  CheckText(shadows, "#ff0000 1px 2em 4px inset, #0000ff 1px 2em 4px");
  std::cout
      << "PASS stop-shadow-copy-suffix-filtering-and-string-replacement\n";
}

}  // namespace

int main() {
  Rml::StyleSheetSpecification::Initialise();
  CheckUnits();
  CheckTransforms();
  CheckTransitionsAndAnimations();
  CheckDeclarationEffects();
  CheckStopsAndShadows();
  Rml::StyleSheetSpecification::Shutdown();
}
