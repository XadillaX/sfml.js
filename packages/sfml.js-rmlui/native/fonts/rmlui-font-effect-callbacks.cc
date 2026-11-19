// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/fonts/rmlui-font-effect-callbacks.h"

#include <sfml-js-interop.h>

#include <cstring>
#include <limits>
#include <memory>
#include <unordered_map>
#include <unordered_set>
#include <vector>

#include "native/animation/rmlui-value-callbacks.h"
#include "native/fonts/rmlui-font-effect.h"
#include "native/fonts/rmlui-font-glyph.h"
#include "native/rendering/manager/rmlui-render-layers.h"
#include "native/runtime/rmlui-callback-owners.h"
#include "native/runtime/rmlui-state.h"
#include "third_party/rmlui/Source/Core/FontEngineDefault/FontFaceLayer.h"

namespace sfmlrmlui {
namespace {

class JavaScriptFontEffect;

auto& Effects() {
  static std::unordered_map<const Rml::FontEffect*,
                            std::weak_ptr<JavaScriptFontEffect>>
      values;
  return values;
}

struct FontEffectOwnership {
  CallbackResourceGate gate;
  bool active{false};
};

auto& Ownership() {
  static FontEffectOwnership ownership;
  return ownership;
}

class EffectCallbackScope final {
 public:
  explicit EffectCallbackScope(bool* active, Nan::TryCatch* caught)
      : active_(active), caught_(caught) {
    *active_ = true;
    ++State().callback_depth;
    ++State().effect_callback_depth;
  }
  ~EffectCallbackScope() {
    RestoreRenderCallbackLayers(caught_->HasCaught());
    --State().effect_callback_depth;
    --State().callback_depth;
    *active_ = false;
  }

 private:
  bool* active_;
  Nan::TryCatch* caught_;
};

NAN_METHOD(IgnoreAsyncResult) {}

v8::MaybeLocal<v8::Value> Invoke(v8::Local<v8::Function> function,
                                 int count,
                                 v8::Local<v8::Value>* arguments) {
  RecordDiagnosticCallback(DiagnosticCallback::kFontEffect);
  auto result = function->Call(
      Nan::GetCurrentContext(), Nan::Undefined(), count, arguments);
  v8::Local<v8::Value> returned;
  if (result.ToLocal(&returned) && returned->IsPromise()) {
    auto ignore =
        Nan::GetFunction(Nan::New<v8::FunctionTemplate>(IgnoreAsyncResult))
            .ToLocalChecked();
    v8::Local<v8::Promise> ignored;
    if (!returned.As<v8::Promise>()
             ->Catch(Nan::GetCurrentContext(), ignore)
             .ToLocal(&ignored)) {
      return {};
    }
    Nan::ThrowTypeError("Font effect callbacks must be synchronous");
    return {};
  }
  return result;
}

bool ReadMetrics(v8::Local<v8::Value> value,
                 const Rml::FontGlyph& glyph,
                 Rml::Vector2i* origin,
                 Rml::Vector2i* dimensions,
                 bool* supported) {
  if (!value->IsObject()) {
    Nan::ThrowTypeError("Expected font glyph metrics");
    return false;
  }
  auto object = value.As<v8::Object>();
  v8::Local<v8::Value> flag;
  v8::Local<v8::Value> offset;
  v8::Local<v8::Value> size;
  if (!Nan::Get(object, Nan::New("supported").ToLocalChecked())
           .ToLocal(&flag) ||
      !Nan::Get(object, Nan::New("origin").ToLocalChecked()).ToLocal(&offset) ||
      !Nan::Get(object, Nan::New("dimensions").ToLocalChecked())
           .ToLocal(&size)) {
    return false;
  }
  if (!flag->IsBoolean()) {
    Nan::ThrowTypeError("Expected a boolean glyph support flag");
    return false;
  }
  if (!ReadGlyphVector(offset, origin) || !ReadGlyphVector(size, dimensions) ||
      !ValidateGlyphDimensions(*dimensions)) {
    return false;
  }
  // FontFaceLayer adds bearings with signed int before converting to float.
  const int64_t x = int64_t{origin->x} + glyph.bearing.x;
  const int64_t y = int64_t{origin->y} - glyph.bearing.y;
  if (x < std::numeric_limits<int>::min() ||
      x > std::numeric_limits<int>::max() ||
      y < std::numeric_limits<int>::min() ||
      y > std::numeric_limits<int>::max()) {
    Nan::ThrowRangeError("Glyph origin and bearing exceed native int32 bounds");
    return false;
  }
  *supported = flag->IsTrue();
  return true;
}

class JavaScriptFontEffect final : public Rml::FontEffect {
 public:
  ~JavaScriptFontEffect() override {
    Effects().erase(this);
    Rml::InvalidateCallbackResourcesForBinding();
  }

  bool HasUniqueTexture() const override {
    bool result = false;
    const bool success = Run(0, [&](v8::Local<v8::Function> function) {
      v8::Local<v8::Value> returned;
      if (Invoke(function, 0, nullptr).ToLocal(&returned)) {
        if (!returned->IsBoolean()) {
          Nan::ThrowTypeError("Expected a boolean unique texture result");
        } else {
          result = returned->IsTrue();
        }
      }
    });
    return success && result;
  }

  bool GetGlyphMetrics(Rml::Vector2i& origin,
                       Rml::Vector2i& dimensions,
                       const Rml::FontGlyph& glyph) const override {
    auto next_origin = origin;
    auto next_dimensions = dimensions;
    bool supported = false;
    const bool success = Run(1, [&](v8::Local<v8::Function> function) {
      v8::Local<v8::Value> arguments[] = {WrapFontGlyphSnapshot(glyph),
                                          GlyphVectorToJs(origin),
                                          GlyphVectorToJs(dimensions)};
      v8::Local<v8::Value> returned;
      if (Invoke(function, 3, arguments).ToLocal(&returned)) {
        ReadMetrics(
            returned, glyph, &next_origin, &next_dimensions, &supported);
      }
    });
    if (success) {
      origin = next_origin;
      dimensions = next_dimensions;
    }
    return success && supported;
  }

  void GenerateGlyphTexture(Rml::byte* destination,
                            Rml::Vector2i dimensions,
                            int stride,
                            const Rml::FontGlyph& glyph) const override {
    GenerateChecked(destination, dimensions, stride, glyph, {});
  }

  void GenerateChecked(Rml::byte* destination,
                       Rml::Vector2i dimensions,
                       int stride,
                       const Rml::FontGlyph& glyph,
                       v8::Local<v8::Uint8Array> view) const {
    // The JS view owns only a single glyph's scratch bytes. Atlas padding
    // starts at zero; commit only row pixels after successful synchronous JS.
    std::shared_ptr<std::vector<Rml::byte>> storage;
    const bool success = Run(2, [&](v8::Local<v8::Function> function) {
      if (!ValidateGlyphDimensions(dimensions)) {
        return;
      }
      const int64_t bytes =
          dimensions.x && dimensions.y
              ? int64_t{dimensions.y - 1} * stride + dimensions.x * 4
              : 0;
      if (stride < dimensions.x * 4 || bytes < 0 ||
          bytes > std::numeric_limits<int>::max()) {
        Nan::ThrowRangeError("Glyph destination exceeds native bitmap bounds");
        return;
      }
      storage = std::make_shared<std::vector<Rml::byte>>(bytes);
      if (bytes) {
        for (int y = 0; y < dimensions.y; ++y) {
          RecordDiagnosticGlyphCopy(size_t(dimensions.x) * 4);
          std::memcpy(storage->data() + size_t(y) * stride,
                      destination + size_t(y) * stride,
                      size_t(dimensions.x) * 4);
        }
      }
      auto buffer = sfmljs::MapShared(
          v8::Isolate::GetCurrent(), storage, storage->data(), storage->size());
      v8::Local<v8::Value> arguments[] = {
          v8::Uint8Array::New(buffer, 0, storage->size()),
          GlyphVectorToJs(dimensions),
          Nan::New(stride),
          WrapFontGlyphSnapshot(glyph)};
      v8::Local<v8::Value> ignored;
      if (Invoke(function, 4, arguments).ToLocal(&ignored)) {
        if (buffer->WasDetached()) {
          Nan::ThrowTypeError("Font effect scratch buffer was detached");
        } else if (!view.IsEmpty()) {
          if (view->Buffer()->WasDetached()) {
            Nan::ThrowTypeError("Glyph destination buffer was detached");
          } else if (view->ByteLength() < static_cast<size_t>(bytes)) {
            Nan::ThrowRangeError("Glyph destination buffer was resized");
          }
        }
      }
    });
    if (success && storage && !storage->empty()) {
      for (int y = 0; y < dimensions.y; ++y) {
        RecordDiagnosticGlyphCopy(size_t(dimensions.x) * 4);
        std::memcpy(destination + size_t(y) * stride,
                    storage->data() + size_t(y) * stride,
                    size_t(dimensions.x) * 4);
      }
    }
  }

  v8::Global<v8::Array> functions;

 private:
  template <typename Callback>
  bool Run(uint32_t index, Callback callback) const {
    if (!CanInvokeCallback() || functions.IsEmpty()) {
      return false;
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    if (active_) {
      Nan::ThrowError("Recursive font effect callback");
    } else {
      EffectCallbackScope scope(&active_, &caught);
      auto array = functions.Get(v8::Isolate::GetCurrent());
      auto function = Nan::Get(array, index).ToLocalChecked();
      if (function->IsFunction()) {
        callback(function.As<v8::Function>());
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
      return false;
    }
    return State().callback_exception.IsEmpty();
  }

  mutable bool active_{false};
};

std::shared_ptr<JavaScriptFontEffect> Custom(const Rml::FontEffect* value) {
  const auto found = Effects().find(FontEffectImplementation(value));
  return found == Effects().end() ? nullptr : found->second.lock();
}

}  // namespace

Rml::SharedPtr<Rml::FontEffect> CreateFontEffectCallbacks(
    v8::Local<v8::Array> functions) {
  auto result = std::make_shared<JavaScriptFontEffect>();
  result->functions.Reset(v8::Isolate::GetCurrent(), functions);
  result->functions.SetWeak();
  Effects()[result.get()] = result;
  Rml::InvalidateCallbackResourcesForBinding();
  return result;
}

bool IsCustomFontEffect(const Rml::FontEffect* value) {
  return Custom(value) != nullptr;
}

void GenerateCustomFontGlyphTexture(const Rml::FontEffect* effect,
                                    const GlyphDestination& destination,
                                    const Rml::FontGlyph& glyph,
                                    v8::Local<v8::Uint8Array> view) {
  if (const auto custom = Custom(effect)) {
    custom->GenerateChecked(destination.data,
                            destination.dimensions,
                            destination.stride,
                            glyph,
                            view);
  }
}

void BindFontEffectCallbacks(v8::Local<v8::Object> handle,
                             const Rml::FontEffect* value) {
  if (const auto custom = Custom(value);
      custom && !custom->functions.IsEmpty()) {
    Nan::SetPrivate(handle,
                    Nan::New("rml.font.effect.callbacks").ToLocalChecked(),
                    custom->functions.Get(v8::Isolate::GetCurrent()))
        .FromJust();
  }
}

void RetainFontEffectCallbacks(const Rml::FontEffect* value) {
  if (const auto custom = Custom(value);
      custom && !custom->functions.IsEmpty() && custom->functions.IsWeak()) {
    custom->functions.ClearWeak();
    Rml::InvalidateCallbackResourcesForBinding();
  }
}

void RetainFontEffectValueCallbacks(const Rml::Variant& value) {
  VisitCallbackValues(value, [](const Rml::Variant& current) {
    if (current.GetType() == Rml::Variant::FONTEFFECTSPTR) {
      if (const auto list = current.Get<Rml::FontEffectsPtr>()) {
        for (const auto& effect : list->list) {
          RetainFontEffectCallbacks(effect.get());
        }
      }
    }
  });
}

void RefreshFontEffectOwnership() {
  auto& ownership = Ownership();
  if (State().cleaning_up || !State().initialized ||
      (Effects().empty() && !ownership.active) || !ownership.gate.Changed()) {
    return;
  }

  // The last native effect still leaves private owner arrays to clear.
  ownership.active = !Effects().empty();
  RecordDiagnosticOwnership(DiagnosticOwnership::kFontEffect);
  std::vector<std::shared_ptr<JavaScriptFontEffect>> effects;
  for (const auto& [pointer, weak] : Effects()) {
    if (auto effect = weak.lock()) {
      if (!effect->functions.IsEmpty() && effect->functions.IsWeak()) {
        effect->functions.ClearWeak();
      }
      effects.push_back(std::move(effect));
    }
  }
  // All native sources and local JS owners are captured before V8 can GC.
  auto snapshots = SnapshotCallbackOwners();
  Rml::Vector<Rml::SharedPtr<const Rml::FontEffect>> layers;
  Rml::FontFaceLayer::AppendFontEffects(layers);
  std::unordered_set<const JavaScriptFontEffect*> rooted;
  for (const auto& effect : layers) {
    if (const auto custom = Custom(effect.get())) {
      rooted.insert(custom.get());
    }
  }
  auto key = Nan::New("rml.owner.font.effects").ToLocalChecked();
  for (const auto& snapshot : snapshots) {
    v8::Local<v8::Array> handles;
    std::unordered_set<const JavaScriptFontEffect*> visited;
    for (const auto& value : snapshot.values) {
      VisitCallbackValues(value, [&](const Rml::Variant& current) {
        if (current.GetType() != Rml::Variant::FONTEFFECTSPTR) {
          return;
        }
        const auto list = current.Get<Rml::FontEffectsPtr>();
        if (!list) {
          return;
        }
        for (const auto& effect : list->list) {
          const auto custom = Custom(effect.get());
          if (!custom || custom->functions.IsEmpty() ||
              !visited.insert(custom.get()).second) {
            continue;
          }
          if (snapshot.handle.IsEmpty()) {
            rooted.insert(custom.get());
          } else {
            if (handles.IsEmpty()) {
              handles = Nan::New<v8::Array>();
            }
            handles
                ->CreateDataProperty(
                    Nan::GetCurrentContext(),
                    handles->Length(),
                    custom->functions.Get(v8::Isolate::GetCurrent()))
                .FromJust();
          }
        }
      });
    }
    if (!snapshot.handle.IsEmpty()) {
      if (handles.IsEmpty()) {
        Nan::DeletePrivate(snapshot.handle, key).FromJust();
      } else {
        Nan::SetPrivate(snapshot.handle, key, handles).FromJust();
      }
    }
  }
  for (const auto& effect : effects) {
    if (!effect->functions.IsEmpty() && !effect->functions.IsWeak() &&
        !rooted.contains(effect.get())) {
      effect->functions.SetWeak();
    }
  }
}

void ReleaseFontEffectCallbacks() {
  Ownership().gate.Reset();
  Ownership().active = false;
  for (const auto& [pointer, weak] : Effects()) {
    if (auto custom = weak.lock(); custom && !custom->functions.IsEmpty()) {
      auto array = custom->functions.Get(v8::Isolate::GetCurrent());
      for (uint32_t i = 0; i < 3; ++i) {
        array->CreateDataProperty(Nan::GetCurrentContext(), i, Nan::Undefined())
            .FromJust();
      }
      custom->functions.Reset();
    }
  }
  Effects().clear();
}

}  // namespace sfmlrmlui
