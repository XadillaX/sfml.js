// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/animation/rmlui-animation-values.h"

#include <utility>

#include "native/animation/rmlui-tween.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/properties/rmlui-property.h"
#include "native/values/rmlui-numeric-value.h"

namespace sfmlrmlui {
namespace {

void Set(v8::Local<v8::Object> object,
         const char* key,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

bool Read(v8::Local<v8::Value> input,
          const char* name,
          v8::Local<v8::Value>* value) {
  if (!input->IsObject() || input->IsArray()) {
    Nan::ThrowTypeError("Expected an animation or transition record");
    return false;
  }
  return Nan::Get(input.As<v8::Object>(), Nan::New(name).ToLocalChecked())
      .ToLocal(value);
}

template <typename T, typename Reader>
bool Field(v8::Local<v8::Value> input,
           const char* name,
           T* value,
           Reader reader) {
  v8::Local<v8::Value> field;
  return Read(input, name, &field) &&
         (field->IsUndefined() || reader(field, value));
}

bool Boolean(v8::Local<v8::Value> input, bool* value) {
  if (!input->IsBoolean()) {
    Nan::ThrowTypeError("Expected a boolean");
    return false;
  }
  *value = input->IsTrue();
  return true;
}

bool String(v8::Local<v8::Value> input, Rml::String* value) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected an animation name string");
    return false;
  }
  Nan::Utf8String text(input);
  value->assign(*text, text.length());
  return true;
}

bool AnimationFromJs(v8::Local<v8::Value> input, Rml::Animation* value) {
  return Field(input, "duration", &value->duration, ReadFiniteNumericFloat) &&
         Field(input, "tween", &value->tween, CopyTween) &&
         Field(input, "delay", &value->delay, ReadFiniteNumericFloat) &&
         Field(input, "alternate", &value->alternate, Boolean) &&
         Field(input, "paused", &value->paused, Boolean) &&
         Field(input,
               "numIterations",
               &value->num_iterations,
               ReadPropertyInteger) &&
         Field(input, "name", &value->name, String) && CheckTween(value->tween);
}

bool TransitionFromJs(v8::Local<v8::Value> input, Rml::Transition* value) {
  return Field(input, "id", &value->id, ReadPropertyId) &&
         Field(input, "tween", &value->tween, CopyTween) &&
         Field(input, "duration", &value->duration, ReadFiniteNumericFloat) &&
         Field(input, "delay", &value->delay, ReadFiniteNumericFloat) &&
         Field(input,
               "reverseAdjustmentFactor",
               &value->reverse_adjustment_factor,
               ReadFiniteNumericFloat) &&
         CheckTween(value->tween);
}

template <typename T, typename Reader>
bool ListFromJs(v8::Local<v8::Object> input,
                const char* name,
                Rml::Vector<T>* values,
                Reader reader) {
  v8::Local<v8::Value> field;
  if (!Read(input, name, &field)) {
    return false;
  }
  if (field->IsUndefined()) {
    return true;
  }
  if (!field->IsArray()) {
    Nan::ThrowTypeError("Expected an animation or transition array");
    return false;
  }
  auto array = field.As<v8::Array>();
  const auto count = array->Length();
  values->reserve(count);
  for (uint32_t index = 0; index < count; ++index) {
    v8::Local<v8::Value> entry;
    T value;
    if (!Nan::Get(array, index).ToLocal(&entry) || !reader(entry, &value)) {
      return false;
    }
    values->push_back(std::move(value));
  }
  // Later getters can shut down the runtime after earlier callback reads.
  for (const auto& value : *values) {
    if (!CheckTween(value.tween)) {
      return false;
    }
  }
  return true;
}

v8::Local<v8::Object> AnimationToJs(const Rml::Animation& value) {
  auto result = Nan::New<v8::Object>();
  Set(result, "duration", Nan::New(value.duration));
  Set(result, "tween", WrapTween(value.tween));
  Set(result, "delay", Nan::New(value.delay));
  Set(result, "alternate", Nan::New(value.alternate));
  Set(result, "paused", Nan::New(value.paused));
  Set(result, "numIterations", Nan::New(value.num_iterations));
  Set(result, "name", Nan::New(value.name).ToLocalChecked());
  return result;
}

v8::Local<v8::Object> TransitionToJs(const Rml::Transition& value) {
  auto result = Nan::New<v8::Object>();
  Set(result, "id", Nan::New(static_cast<int>(value.id)));
  Set(result, "tween", WrapTween(value.tween));
  Set(result, "duration", Nan::New(value.duration));
  Set(result, "delay", Nan::New(value.delay));
  Set(result,
      "reverseAdjustmentFactor",
      Nan::New(value.reverse_adjustment_factor));
  return result;
}

template <typename T, typename Writer>
v8::Local<v8::Array> ListToJs(const Rml::Vector<T>& values, Writer writer) {
  auto result = Nan::New<v8::Array>(values.size());
  for (size_t index = 0; index < values.size(); ++index) {
    result
        ->CreateDataProperty(
            Nan::GetCurrentContext(), index, writer(values[index]))
        .FromJust();
  }
  return result;
}

template <typename T, auto reader, auto writer>
NAN_METHOD(MakeValue) {
  T value;
  if (reader(info[0], &value)) {
    info.GetReturnValue().Set(writer(value));
  }
}

template <typename T, auto reader>
NAN_METHOD(Equals) {
  T a;
  T b;
  if (reader(info[0], &a) && reader(info[1], &b)) {
    info.GetReturnValue().Set(a == b);
  }
}

bool ReadTransitions(v8::Local<v8::Value> input, Rml::TransitionList* value) {
  if (!input->IsObject() || input->IsArray()) {
    Nan::ThrowTypeError("Expected a transition list record");
    return false;
  }
  return TransitionsFromJs(input.As<v8::Object>(), value);
}

template <typename Visitor>
void VisitTweens(Rml::Variant* value, Visitor visitor) {
  if (value->GetType() == Rml::Variant::TRANSITIONLIST) {
    auto list = value->Get<Rml::TransitionList>();
    for (auto& entry : list.transitions) {
      visitor(&entry.tween);
    }
    *value = std::move(list);
  } else if (value->GetType() == Rml::Variant::ANIMATIONLIST) {
    auto list = value->Get<Rml::AnimationList>();
    for (auto& entry : list) {
      visitor(&entry.tween);
    }
    *value = std::move(list);
  }
}

}  // namespace

bool TransitionsFromJs(v8::Local<v8::Object> input,
                       Rml::TransitionList* value) {
  return Field(input, "none", &value->none, Boolean) &&
         Field(input, "all", &value->all, Boolean) &&
         ListFromJs(
             input, "transitions", &value->transitions, TransitionFromJs);
}

bool AnimationsFromJs(v8::Local<v8::Object> input, Rml::AnimationList* value) {
  return ListFromJs(input, "animations", value, AnimationFromJs);
}

v8::Local<v8::Object> TransitionsToJs(const Rml::TransitionList& value) {
  auto result = Nan::New<v8::Object>();
  Set(result, "type", Nan::New("transitionlist").ToLocalChecked());
  Set(result, "none", Nan::New(value.none));
  Set(result, "all", Nan::New(value.all));
  Set(result, "transitions", ListToJs(value.transitions, TransitionToJs));
  return result;
}

v8::Local<v8::Object> AnimationsToJs(const Rml::AnimationList& value) {
  auto result = Nan::New<v8::Object>();
  Set(result, "type", Nan::New("animationlist").ToLocalChecked());
  Set(result, "animations", ListToJs(value, AnimationToJs));
  return result;
}

void RebindVariantTweens(Rml::Variant* value, Rml::Element* element) {
  VisitTweens(value, [element](Rml::Tween* tween) {
    if (element) {
      AttachTween(tween, element);
    } else {
      DetachTween(tween);
    }
  });
}

void RetainNativeVariantTweens(Rml::Variant* value) {
  VisitTweens(value, RetainNativeTween);
}

void RetainVariantTweens(v8::Local<v8::Object> owner,
                         const Rml::Variant& value) {
  auto handles = Nan::New<v8::Array>();
  Rml::Variant copy = value;
  VisitTweens(&copy, [&](Rml::Tween* tween) {
    if (tween->GetCallbackOwner()) {
      handles
          ->CreateDataProperty(
              Nan::GetCurrentContext(), handles->Length(), WrapTween(*tween))
          .FromJust();
    }
  });
  Nan::SetPrivate(owner, Nan::New("rml.value.tweens").ToLocalChecked(), handles)
      .FromJust();
}

void RebindClonedElementTweens(Rml::Element* element) {
  // Native Clone copies attributes and local properties by value, including
  // callback leases. The clone must retain callbacks under its own DOM owner.
  const auto attributes = element->GetAttributes();
  const auto properties = element->GetLocalStyleProperties();
  const auto rebind = [element](Rml::Variant* value) {
    bool found = false;
    VisitTweens(value, [&](Rml::Tween* tween) {
      if (tween->GetCallbackOwner()) {
        AttachTween(tween, element);
        found = true;
      }
    });
    return found;
  };
  for (auto [name, value] : attributes) {
    if (rebind(&value)) {
      element->SetAttribute(name, value);
    }
  }
  for (auto [id, property] : properties) {
    if (rebind(&property.value)) {
      element->SetProperty(id, property);
    }
  }
}

NAN_MODULE_INIT(InitializeRmlAnimationValues) {
  SetRuntimeMethod<MakeValue<Rml::Animation, AnimationFromJs, AnimationToJs>,
                   true,
                   false>(target, "makeAnimation");
  SetRuntimeMethod<MakeValue<Rml::Transition, TransitionFromJs, TransitionToJs>,
                   true,
                   false>(target, "makeTransition");
  SetRuntimeMethod<
      MakeValue<Rml::TransitionList, ReadTransitions, TransitionsToJs>,
      true,
      false>(target, "makeTransitionList");
  SetRuntimeMethod<Equals<Rml::Animation, AnimationFromJs>, true, false>(
      target, "animationEquals");
  SetRuntimeMethod<Equals<Rml::Transition, TransitionFromJs>, true, false>(
      target, "transitionEquals");
  SetRuntimeMethod<Equals<Rml::TransitionList, ReadTransitions>, true, false>(
      target, "transitionListEquals");
}

}  // namespace sfmlrmlui
