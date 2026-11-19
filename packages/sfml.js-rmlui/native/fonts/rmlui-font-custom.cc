// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/fonts/rmlui-font-custom.h"

#include <sfml-js-interop.h>

#include <algorithm>
#include <array>
#include <cmath>
#include <limits>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/fonts/rmlui-font-effect.h"
#include "native/fonts/rmlui-font-measure.h"
#include "native/rendering/geometry/rmlui-geometry.h"
#include "native/rendering/geometry/rmlui-mesh.h"
#include "native/rendering/manager/rmlui-render-manager.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-buffer.h"

namespace sfmlrmlui {
namespace {

enum Method {
  kInitialize,
  kShutdown,
  kLoadFile,
  kLoadNamedFile,
  kLoadMemory,
  kFace,
  kEffects,
  kMetrics,
  kWidth,
  kGenerate,
  kVersion,
  kRelease,
  kWidths,
  kMeasure,
  kCount,
};

struct ProviderLife {
  bool alive{true};
};
// Mapped views retain only this pure native allocation.
struct FaceStorage {
  Rml::FontMetrics metrics{};
  std::vector<int32_t> advances;
  uint32_t first{0};
  uint32_t advance_count{0};
  int32_t fallback{0};
  int32_t version{0};
  bool native_widths{false};
};
struct FaceBinding {
  std::shared_ptr<FaceStorage> storage;
  std::weak_ptr<ProviderLife> provider;
  Rml::FontFaceHandle identity{0};
  uint64_t generation{0};
  bool valid{true};
  v8::Global<v8::Object> handle;
};
using FaceHandle = sfmljs::SharedHandle<FaceBinding>;

auto& Faces() {
  static std::unordered_map<Rml::FontFaceHandle, std::weak_ptr<FaceBinding>>
      faces;
  return faces;
}
uint64_t FontGeneration() {
  return State().font_generation + (State().initialized ? 0 : 1);
}
void Own(v8::Local<v8::Object> target,
         const char* name,
         v8::Local<v8::Value> value) {
  target
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(name).ToLocalChecked(), value)
      .FromJust();
}
bool ReadInt(v8::Local<v8::Value> value, int32_t* output) {
  if (!value->IsInt32()) {
    Nan::ThrowTypeError("Font callback must return an int32");
    return false;
  }
  *output = Nan::To<int32_t>(value).FromJust();
  return true;
}
bool ReadMetrics(v8::Local<v8::Value> input, Rml::FontMetrics* output) {
  if (!input->IsObject()) {
    Nan::ThrowTypeError("Expected custom font metrics");
    return false;
  }
  const auto object = input.As<v8::Object>();
  v8::Local<v8::Value> size;
  if (!Nan::Get(object, Nan::New("size").ToLocalChecked()).ToLocal(&size) ||
      !ReadInt(size, &output->size)) {
    return false;
  }
  if (output->size <= 0) {
    Nan::ThrowRangeError("Font metrics size must be positive");
    return false;
  }
  const char* names[] = {"ascent",
                         "descent",
                         "lineSpacing",
                         "xHeight",
                         "underlinePosition",
                         "underlineThickness"};
  float* fields[] = {&output->ascent,
                     &output->descent,
                     &output->line_spacing,
                     &output->x_height,
                     &output->underline_position,
                     &output->underline_thickness};
  for (size_t i = 0; i < std::size(names); ++i) {
    v8::Local<v8::Value> value;
    if (!Nan::Get(object, Nan::New(names[i]).ToLocalChecked())
             .ToLocal(&value)) {
      return false;
    }
    if (!value->IsNumber()) {
      Nan::ThrowTypeError("Font metrics fields must be numbers");
      return false;
    }
    *fields[i] = static_cast<float>(Nan::To<double>(value).FromJust());
    if (!std::isfinite(*fields[i])) {
      Nan::ThrowRangeError("Font metrics fields must be finite");
      return false;
    }
  }
  v8::Local<v8::Value> ellipsis;
  if (!Nan::Get(object, Nan::New("hasEllipsis").ToLocalChecked())
           .ToLocal(&ellipsis)) {
    return false;
  }
  if (!ellipsis->IsBoolean()) {
    Nan::ThrowTypeError("Font ellipsis flag must be boolean");
    return false;
  }
  output->has_ellipsis = ellipsis->IsTrue();
  return true;
}
v8::Local<v8::Object> Shape(const Rml::TextShapingContext& shaping) {
  auto result = Nan::New<v8::Object>();
  Own(result, "language", Nan::New(shaping.language).ToLocalChecked());
  Own(result, "direction", Nan::New(static_cast<int>(shaping.text_direction)));
  Own(result, "fontKerning", Nan::New(static_cast<int>(shaping.font_kerning)));
  Own(result, "letterSpacing", Nan::New(shaping.letter_spacing));
  result
      ->SetIntegrityLevel(Nan::GetCurrentContext(), v8::IntegrityLevel::kFrozen)
      .FromJust();
  return result;
}
NAN_METHOD(IgnoreAsyncResult) {}

class HostFonts final : public CustomFontEngine {
 public:
  explicit HostFonts(v8::Local<v8::Array> functions) {
    functions_.Reset(v8::Isolate::GetCurrent(), functions);
    functions_.SetWeak();
    for (uint32_t i = 0; i < kCount; ++i) {
      if (Nan::Get(functions, i).ToLocalChecked()->IsFunction()) {
        methods_ |= 1u << i;
      }
    }
  }
  ~HostFonts() override {
    life_->alive = false;
    ClearFaces(false);
  }
  void Bind(v8::Local<v8::Object> handle) override {
    handle_.Reset(v8::Isolate::GetCurrent(), handle);
    handle_.SetWeak();
    OwnPrivate(handle,
               "rml.font.functions",
               functions_.Get(v8::Isolate::GetCurrent()));
    OwnPrivate(
        handle, "rml.font.faces", v8::Map::New(v8::Isolate::GetCurrent()));
    OwnPrivate(
        handle, "rml.font.effects", v8::Map::New(v8::Isolate::GetCurrent()));
  }

  void Initialize() override {
    initialized_ = true;
    Invoke(kInitialize, 0, nullptr, [](v8::Local<v8::Value>) {});
  }
  void Shutdown() override {
    accepting_faces_ = false;
    Invoke(kShutdown, 0, nullptr, [](v8::Local<v8::Value>) {});
    ClearFaces(true);
    ClearWorkspace();
    initialized_ = false;
  }

  bool LoadFontFace(const Rml::String& path,
                    int index,
                    bool fallback,
                    Rml::Style::FontWeight weight) override {
    Nan::HandleScope handles;
    v8::Local<v8::Value> args[] = {Nan::New(path).ToLocalChecked(),
                                   Nan::New(index),
                                   Nan::New(fallback),
                                   Nan::New(static_cast<int>(weight))};
    return Load(kLoadFile, args, std::size(args));
  }
  bool LoadFontFace(const Rml::String& path,
                    int index,
                    const Rml::String& family,
                    Rml::Style::FontStyle style,
                    Rml::Style::FontWeight weight,
                    bool fallback) override {
    Nan::HandleScope handles;
    v8::Local<v8::Value> args[] = {Nan::New(path).ToLocalChecked(),
                                   Nan::New(index),
                                   Nan::New(family).ToLocalChecked(),
                                   Nan::New(static_cast<int>(style)),
                                   Nan::New(static_cast<int>(weight)),
                                   Nan::New(fallback)};
    return Load(kLoadNamedFile, args, std::size(args));
  }
  bool LoadFontFace(Rml::Span<const Rml::byte> bytes,
                    int index,
                    const Rml::String& family,
                    Rml::Style::FontStyle style,
                    Rml::Style::FontWeight weight,
                    bool fallback) override {
    Nan::HandleScope handles;
    // Callback data is an independent snapshot; upstream may retain its input.
    auto buffer = v8::ArrayBuffer::New(v8::Isolate::GetCurrent(), bytes.size());
    auto view = v8::Uint8Array::New(buffer, 0, bytes.size());
    std::copy(bytes.begin(),
              bytes.end(),
              static_cast<Rml::byte*>(buffer->GetBackingStore()->Data()));
    v8::Local<v8::Value> args[] = {view,
                                   Nan::New(index),
                                   Nan::New(family).ToLocalChecked(),
                                   Nan::New(static_cast<int>(style)),
                                   Nan::New(static_cast<int>(weight)),
                                   Nan::New(fallback)};
    return Load(kLoadMemory, args, std::size(args));
  }

  Rml::FontFaceHandle GetFontFaceHandle(const Rml::String& family,
                                        Rml::Style::FontStyle style,
                                        Rml::Style::FontWeight weight,
                                        int size) override {
    Nan::HandleScope handles;
    v8::Local<v8::Value> args[] = {Nan::New(family).ToLocalChecked(),
                                   Nan::New(static_cast<int>(style)),
                                   Nan::New(static_cast<int>(weight)),
                                   Nan::New(size)};
    Rml::FontFaceHandle result = 0;
    Invoke(kFace, std::size(args), args, [&](v8::Local<v8::Value> value) {
      if (!value->IsNull() && ReadCustomFontFace(value, &result)) {
        if (!Find(result)) {
          Nan::ThrowTypeError("Font face belongs to another engine");
          result = 0;
        }
      }
    });
    return result;
  }
  Rml::FontEffectsHandle PrepareFontEffects(
      Rml::FontFaceHandle face, const Rml::FontEffectList& effects) override {
    Nan::HandleScope handles;
    const auto binding = Find(face);
    if (!binding || !Has(kEffects)) {
      return 0;
    }
    auto list = Nan::New<v8::Array>(effects.size());
    for (uint32_t i = 0; i < effects.size(); ++i) {
      list->CreateDataProperty(
              Nan::GetCurrentContext(), i, WrapFontEffect(effects[i]))
          .FromJust();
    }
    v8::Local<v8::Value> args[] = {Token(binding), list};
    Rml::FontEffectsHandle result = 0;
    Invoke(kEffects, 2, args, [&](v8::Local<v8::Value> value) {
      if (value->IsNull()) {
        return;
      }
      if (!value->IsObject()) {
        Nan::ThrowTypeError(
            "Font effects callback must return an object or null");
        return;
      }
      if (next_effect_ == std::numeric_limits<Rml::FontEffectsHandle>::max()) {
        Nan::ThrowRangeError("Font effect identity exhausted");
        return;
      }
      result = ++next_effect_;
      v8::Local<v8::Map> updated;
      if (!Roots("rml.font.effects")
               ->Set(Nan::GetCurrentContext(), Key(result), value)
               .ToLocal(&updated)) {
        result = 0;
        return;
      }
      effects_.emplace(result, face);
    });
    return result;
  }
  const Rml::FontMetrics& GetFontMetrics(Rml::FontFaceHandle face) override {
    const auto binding = Find(face);
    if (!binding) {
      return empty_metrics_;
    }
    if (Has(kMetrics)) {
      Nan::HandleScope handles;
      v8::Local<v8::Value> arg = Token(binding);
      Invoke(kMetrics, 1, &arg, [&](v8::Local<v8::Value> value) {
        Rml::FontMetrics metrics{};
        if (ReadMetrics(value, &metrics)) {
          binding->storage->metrics = metrics;
        }
      });
    }
    return binding->storage->metrics;
  }
  int GetStringWidth(Rml::FontFaceHandle face,
                     Rml::StringView string,
                     const Rml::TextShapingContext& shaping,
                     Rml::Character prior) override {
    const auto binding = Find(face);
    if (!binding) {
      return 0;
    }
    if (binding->storage->native_widths) {
      return NativeWidth(*binding->storage, string, shaping);
    }
    if (Has(kMeasure)) {
      Nan::HandleScope handles;
      const std::array<uint32_t, 2> offsets{
          0, static_cast<uint32_t>(string.size())};
      int32_t result = 0;
      MeasurePacked(binding,
                    reinterpret_cast<const uint8_t*>(string.begin()),
                    offsets.data(),
                    1,
                    shaping,
                    prior,
                    Nan::Null(),
                    &result);
      return result;
    }
    Nan::HandleScope handles;
    v8::Local<v8::Value> args[] = {Token(binding),
                                   Text(string),
                                   Shape(shaping),
                                   Nan::New(static_cast<uint32_t>(prior))};
    int32_t result = 0;
    Invoke(kWidth, std::size(args), args, [&](v8::Local<v8::Value> value) {
      ReadInt(value, &result);
    });
    return result;
  }
  int GetVersion(Rml::FontFaceHandle face) override {
    const auto binding = Find(face);
    if (!binding) {
      return 0;
    }
    int32_t result = binding->storage->version;
    if (Has(kVersion)) {
      Nan::HandleScope handles;
      v8::Local<v8::Value> arg = Token(binding);
      Invoke(kVersion, 1, &arg, [&](v8::Local<v8::Value> value) {
        ReadInt(value, &result);
      });
    }
    return result;
  }
  void ReleaseFontResources() override {
    accepting_faces_ = false;
    ClearFaces(true);
    ClearWorkspace();
    Invoke(kRelease, 0, nullptr, [](v8::Local<v8::Value>) {});
    accepting_faces_ = initialized_;
  }

  int GenerateString(Rml::RenderManager& manager,
                     Rml::FontFaceHandle face,
                     Rml::FontEffectsHandle effects,
                     Rml::StringView string,
                     Rml::Vector2f position,
                     Rml::ColourbPremultiplied colour,
                     float opacity,
                     const Rml::TextShapingContext& shaping,
                     Rml::TexturedMeshList& meshes) override {
    Nan::HandleScope handles;
    const auto binding = Find(face);
    if (!binding) {
      return 0;
    }
    v8::Local<v8::Value> effect = Nan::Null();
    if (effects) {
      const auto found = effects_.find(effects);
      if (found == effects_.end() || found->second != face ||
          !Roots("rml.font.effects")
               ->Get(Nan::GetCurrentContext(), Key(effects))
               .ToLocal(&effect)) {
        CaptureCallbackException(Nan::Error("Font effects handle is invalid"));
        return 0;
      }
    }
    auto origin = Nan::New<v8::Object>();
    Own(origin, "x", Nan::New(position.x));
    Own(origin, "y", Nan::New(position.y));
    auto rgba = Nan::New<v8::Object>();
    Own(rgba, "red", Nan::New(colour.red));
    Own(rgba, "green", Nan::New(colour.green));
    Own(rgba, "blue", Nan::New(colour.blue));
    Own(rgba, "alpha", Nan::New(colour.alpha));
    v8::Local<v8::Value> args[] = {WrapRenderManager(&manager),
                                   Token(binding),
                                   effect,
                                   Text(string),
                                   origin,
                                   rgba,
                                   Nan::New(opacity),
                                   Shape(shaping)};
    int32_t width = 0;
    Invoke(kGenerate, std::size(args), args, [&](v8::Local<v8::Value> value) {
      if (!value->IsObject()) {
        Nan::ThrowTypeError(
            "Font geometry callback must return GeneratedString");
        return;
      }
      v8::Local<v8::Value> advance, list;
      auto object = value.As<v8::Object>();
      if (!Nan::Get(object, Nan::New("width").ToLocalChecked())
               .ToLocal(&advance) ||
          !Nan::Get(object, Nan::New("meshes").ToLocalChecked())
               .ToLocal(&list) ||
          !ReadInt(advance, &width)) {
        return;
      }
      if (!list->IsArray()) {
        Nan::ThrowTypeError("Expected generated font meshes");
        return;
      }
      const auto array = list.As<v8::Array>();
      std::vector<v8::Local<v8::Value>> mesh_tokens(array->Length());
      std::vector<v8::Local<v8::Value>> texture_tokens(array->Length());
      for (uint32_t i = 0; i < array->Length(); ++i) {
        v8::Local<v8::Value> entry;
        if (!Nan::Get(array, i).ToLocal(&entry)) {
          return;
        }
        if (!entry->IsObject()) {
          Nan::ThrowTypeError("Expected textured font mesh");
          return;
        }
        if (!Nan::Get(entry.As<v8::Object>(), Nan::New("mesh").ToLocalChecked())
                 .ToLocal(&mesh_tokens[i]) ||
            !Nan::Get(entry.As<v8::Object>(),
                      Nan::New("texture").ToLocalChecked())
                 .ToLocal(&texture_tokens[i])) {
          return;
        }
      }
      Rml::TexturedMeshList output(array->Length());
      // Resolve all textures after getters, before consuming any mesh.
      for (uint32_t i = 0; i < array->Length(); ++i) {
        if (!ReadTexture(texture_tokens[i], &manager, &output[i].texture)) {
          return;
        }
      }
      for (uint32_t i = 0; i < array->Length(); ++i) {
        if (!TakeMesh(mesh_tokens[i], &output[i].mesh)) {
          return;
        }
      }
      meshes = std::move(output);
    });
    return State().callback_exception.IsEmpty() ? width : 0;
  }

  bool Measure(Rml::FontFaceHandle face,
               const std::shared_ptr<FontMeasureState>& buffer,
               uint32_t count,
               const Rml::TextShapingContext& shaping,
               Rml::Character prior,
               v8::Local<v8::Value> source) override {
    const auto binding = Find(face);
    if (!binding) {
      return false;
    }
    const auto* bytes = reinterpret_cast<const char*>(buffer->bytes.data());
    if (binding->storage->native_widths) {
      // Validate the whole batch before touching output, with no scratch
      // allocation or copy on this entirely Native path.
      for (uint32_t i = 0; i < count; ++i) {
        NativeWidth(
            *binding->storage,
            {bytes + buffer->offsets[i], bytes + buffer->offsets[i + 1]},
            shaping);
        if (!State().callback_exception.IsEmpty()) {
          return false;
        }
      }
      for (uint32_t i = 0; i < count; ++i) {
        buffer->widths[i] = NativeWidth(
            *binding->storage,
            {bytes + buffer->offsets[i], bytes + buffer->offsets[i + 1]},
            shaping);
      }
      return State().callback_exception.IsEmpty();
    }
    Nan::HandleScope handles;
    if (!count) {
      return true;
    }
    if (Has(kMeasure)) {
      return MeasurePacked(binding,
                           buffer->bytes.data(),
                           buffer->offsets.data(),
                           count,
                           shaping,
                           prior,
                           source,
                           buffer->widths.data());
    }
    // Snapshot the entire input before any JS runs. Never re-read caller
    // offsets/bytes after a callback, including the compatibility loop.
    auto strings = Nan::New<v8::Array>(count);
    for (uint32_t i = 0; i < count; ++i) {
      strings
          ->CreateDataProperty(Nan::GetCurrentContext(),
                               i,
                               Text({bytes + buffer->offsets[i],
                                     bytes + buffer->offsets[i + 1]}))
          .FromJust();
    }
    std::vector<int32_t> widths(count);
    const auto context = Shape(shaping);
    if (count && Has(kWidths)) {
      v8::Local<v8::Value> args[] = {Token(binding),
                                     strings,
                                     context,
                                     Nan::New(static_cast<uint32_t>(prior))};
      Invoke(kWidths, std::size(args), args, [&](v8::Local<v8::Value> value) {
        if (!value->IsInt32Array()) {
          Nan::ThrowTypeError("Bulk font callback must return Int32Array");
          return;
        }
        auto output = value.As<v8::Int32Array>();
        auto storage = output->Buffer();
        if (storage->WasDetached() ||
            !IsFixedUnsharedBuffer(storage->GetBackingStore()) ||
            output->Length() != count) {
          Nan::ThrowTypeError("Bulk font widths require attached fixed storage "
                              "of exact length");
          return;
        }
        output->CopyContents(widths.data(), widths.size() * sizeof(int32_t));
      });
    } else {
      for (uint32_t i = 0; i < count; ++i) {
        v8::Local<v8::Value> args[] = {Token(binding),
                                       Nan::Get(strings, i).ToLocalChecked(),
                                       context,
                                       Nan::New(static_cast<uint32_t>(prior))};
        Invoke(kWidth, std::size(args), args, [&](v8::Local<v8::Value> value) {
          ReadInt(value, &widths[i]);
        });
        if (!State().callback_exception.IsEmpty()) {
          return false;
        }
      }
    }
    if (!State().callback_exception.IsEmpty()) {
      return false;
    }
    if (!source->IsNull() && !FontMeasureAttached(source)) {
      return false;
    }
    std::copy(widths.begin(), widths.end(), buffer->widths.begin());
    State().data_diagnostics.Record(&DataDiagnostics::font_measure_copied_bytes,
                                    widths.size() * sizeof(int32_t));
    return true;
  }

  void CreateFace(const Nan::FunctionCallbackInfo<v8::Value>& info) override {
    // A descriptor getter must not destroy this provider during registration.
    struct RegistrationGuard {
      RegistrationGuard() { ++State().callback_depth; }
      ~RegistrationGuard() { --State().callback_depth; }
    } guard;
    if (!accepting_faces_) {
      return Nan::ThrowError("Font engine is releasing resources");
    }
    auto storage = std::make_shared<FaceStorage>();
    if (!ReadMetrics(info[1], &storage->metrics)) {
      return;
    }
    if (!info[2]->IsNull()) {
      if (!info[2]->IsInt32Array() || !info[3]->IsUint32() ||
          Nan::To<uint32_t>(info[3]).FromJust() > 0x10ffff ||
          !ReadInt(info[4], &storage->fallback)) {
        return Nan::ThrowTypeError(
            "Expected font advances, first codepoint and fallback");
      }
      const auto advances = info[2].As<v8::Int32Array>();
      const auto buffer = advances->Buffer();
      if (buffer->WasDetached() ||
          !IsFixedUnsharedBuffer(buffer->GetBackingStore()) ||
          advances->Length() >
              0x110000 - Nan::To<uint32_t>(info[3]).FromJust()) {
        return Nan::ThrowTypeError(
            "Font advances must be fixed Unicode-range storage");
      }
      storage->native_widths = true;
      storage->advance_count = advances->Length();
      storage->first = Nan::To<uint32_t>(info[3]).FromJust();
      storage->advances.resize(std::max<size_t>(1, advances->Length()));
      advances->CopyContents(storage->advances.data(), advances->ByteLength());
    }
    static Rml::FontFaceHandle next_identity = 0;
    if (next_identity == std::numeric_limits<Rml::FontFaceHandle>::max()) {
      return Nan::ThrowRangeError("Font identity exhausted");
    }
    auto binding = std::make_shared<FaceBinding>();
    binding->storage = storage;
    binding->provider = life_;
    binding->identity = ++next_identity;
    binding->generation = FontGeneration();
    const auto token = FaceHandle::Create(binding);
    binding->handle.Reset(v8::Isolate::GetCurrent(), token);
    binding->handle.SetWeak();
    OwnPrivate(
        token, "rml.font.provider", handle_.Get(v8::Isolate::GetCurrent()));
    v8::Local<v8::Map> updated;
    if (!Roots("rml.font.faces")
             ->Set(Nan::GetCurrentContext(), Key(binding->identity), token)
             .ToLocal(&updated)) {
      return;
    }
    faces_.emplace(binding->identity, binding);
    Faces().emplace(binding->identity, binding);
    auto result = Nan::New<v8::Object>();
    Own(result, "handle", token);
    const size_t count =
        storage->native_widths ? info[2].As<v8::Int32Array>()->Length() : 0;
    auto advances = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                      storage,
                                      storage->advances.data(),
                                      count * sizeof(int32_t));
    auto version = sfmljs::MapShared(
        v8::Isolate::GetCurrent(), storage, &storage->version, sizeof(int32_t));
    Own(result, "advances", v8::Int32Array::New(advances, 0, count));
    Own(result, "version", v8::Int32Array::New(version, 0, 1));
    info.GetReturnValue().Set(result);
  }

 private:
  bool MeasurePacked(const std::shared_ptr<FaceBinding>& face,
                     const uint8_t* bytes,
                     const uint32_t* offsets,
                     uint32_t count,
                     const Rml::TextShapingContext& shaping,
                     Rml::Character prior,
                     v8::Local<v8::Value> source,
                     int32_t* output) {
    const auto object = workspace_.Prepare(bytes, offsets, count);
    if (object.IsEmpty()) {
      return false;
    }
    // The only strong V8 ownership edge is on the provider wrapper. Native
    // storage contains no V8 handles, and survives growth, detachment, and GC.
    OwnPrivate(
        handle_.Get(v8::Isolate::GetCurrent()), "rml.font.measure", object);
    v8::Local<v8::Value> args[] = {Token(face),
                                   object,
                                   Nan::New(count),
                                   Shape(shaping),
                                   Nan::New(static_cast<uint32_t>(prior))};
    Invoke(kMeasure, std::size(args), args, [&](v8::Local<v8::Value> value) {
      if (!value->IsUndefined()) {
        Nan::ThrowTypeError("Packed font callback must return undefined");
      }
    });
    if (!State().callback_exception.IsEmpty()) {
      return false;
    }
    if (!workspace_.Attached()) {
      Nan::ThrowTypeError("Packed font measurement workspace is detached");
      return false;
    }
    if (!source->IsNull() && !FontMeasureAttached(source)) {
      return false;
    }
    std::copy_n(workspace_.storage()->widths.begin(), count, output);
    State().data_diagnostics.Record(
        &DataDiagnostics::font_measure_copied_bytes,
        static_cast<uint64_t>(count) * sizeof(int32_t));
    return true;
  }
  void ClearWorkspace() {
    workspace_.Reset();
    if (!handle_.IsEmpty()) {
      Nan::DeletePrivate(handle_.Get(v8::Isolate::GetCurrent()),
                         Nan::New("rml.font.measure").ToLocalChecked())
          .FromJust();
    }
  }
  bool Has(Method method) const { return (methods_ & (1u << method)) != 0; }
  static void OwnPrivate(v8::Local<v8::Object> handle,
                         const char* name,
                         v8::Local<v8::Value> value) {
    Nan::SetPrivate(handle, Nan::New(name).ToLocalChecked(), value).FromJust();
  }
  static v8::Local<v8::BigInt> Key(uintptr_t identity) {
    return v8::BigInt::NewFromUnsigned(v8::Isolate::GetCurrent(), identity);
  }
  static v8::Local<v8::String> Text(Rml::StringView string) {
    return Nan::New(string.begin(), static_cast<int>(string.size()))
        .ToLocalChecked();
  }
  static v8::Local<v8::Object> Token(const std::shared_ptr<FaceBinding>& face) {
    return face->handle.Get(v8::Isolate::GetCurrent());
  }
  v8::Local<v8::Map> Roots(const char* name) const {
    return Nan::GetPrivate(handle_.Get(v8::Isolate::GetCurrent()),
                           Nan::New(name).ToLocalChecked())
        .ToLocalChecked()
        .As<v8::Map>();
  }
  std::shared_ptr<FaceBinding> Find(Rml::FontFaceHandle face) const {
    const auto found = faces_.find(face);
    if (found == faces_.end() || !found->second->valid ||
        found->second->generation != FontGeneration()) {
      CaptureCallbackException(
          Nan::Error("Custom font face handle is invalid"));
      return {};
    }
    return found->second;
  }
  void ClearFaces(bool clear_roots) {
    for (const auto& [identity, face] : faces_) {
      face->valid = false;
      Faces().erase(identity);
    }
    faces_.clear();
    effects_.clear();
    if (clear_roots && !handle_.IsEmpty()) {
      Roots("rml.font.faces")->Clear();
      Roots("rml.font.effects")->Clear();
    }
  }
  bool Load(Method method, v8::Local<v8::Value>* args, int count) {
    bool result = false;
    Invoke(method, count, args, [&](v8::Local<v8::Value> value) {
      if (!value->IsBoolean()) {
        Nan::ThrowTypeError("Font load callback must return boolean");
      } else {
        result = value->IsTrue();
      }
    });
    return result;
  }
  static int NativeWidth(const FaceStorage& face,
                         Rml::StringView string,
                         const Rml::TextShapingContext& shaping) {
    int64_t width = 0;
    size_t count = 0;
    auto* current = reinterpret_cast<const unsigned char*>(string.begin());
    const auto* end = current + string.size();
    while (current < end) {
      const unsigned char lead = *current++;
      uint32_t character = lead;
      unsigned remaining = 0;
      if (lead >= 0xf0) {
        character = lead & 7;
        remaining = 3;
      } else if (lead >= 0xe0) {
        character = lead & 15;
        remaining = 2;
      } else if (lead >= 0xc0) {
        character = lead & 31;
        remaining = 1;
      }
      if (static_cast<size_t>(end - current) < remaining) {
        CaptureCallbackException(Nan::TypeError("Invalid font UTF-8"));
        return 0;
      }
      while (remaining--) {
        character = (character << 6) | (*current++ & 63);
      }
      const uint32_t index = character - face.first;
      width +=
          index < face.advance_count ? face.advances[index] : face.fallback;
      ++count;
    }
    if (count > 1) {
      width += static_cast<int64_t>(count - 1) *
               static_cast<int>(shaping.letter_spacing);
    }
    if (width < std::numeric_limits<int32_t>::min() ||
        width > std::numeric_limits<int32_t>::max()) {
      CaptureCallbackException(Nan::RangeError("Font width exceeds int32"));
      return 0;
    }
    return static_cast<int>(width);
  }
  template <typename Visitor>
  void Invoke(Method method,
              int count,
              v8::Local<v8::Value>* args,
              const Visitor& visitor) {
    auto& state = State();
    if (!Has(method) || functions_.IsEmpty() || state.cleaning_up ||
        !state.boundary_depth || !state.callback_exception.IsEmpty() ||
        (state.initialized && !CanInvokeCallback())) {
      return;
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    struct CallbackGuard {
      CallbackGuard() { ++State().callback_depth; }
      ~CallbackGuard() { --State().callback_depth; }
    } guard;
    const auto function =
        Nan::Get(functions_.Get(v8::Isolate::GetCurrent()), method)
            .ToLocalChecked()
            .As<v8::Function>();
    v8::Local<v8::Value> result;
    RecordDiagnosticCallback(DiagnosticCallback::kFontEngine);
    if (function->Call(Nan::GetCurrentContext(), Nan::Undefined(), count, args)
            .ToLocal(&result)) {
      if (result->IsPromise()) {
        const auto ignore =
            Nan::GetFunction(Nan::New<v8::FunctionTemplate>(IgnoreAsyncResult))
                .ToLocalChecked();
        v8::Local<v8::Promise> ignored;
        if (result.As<v8::Promise>()
                ->Catch(Nan::GetCurrentContext(), ignore)
                .ToLocal(&ignored)) {
          Nan::ThrowTypeError("Font callbacks must be synchronous");
        }
      } else {
        visitor(result);
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
  }

  std::shared_ptr<ProviderLife> life_{std::make_shared<ProviderLife>()};
  std::unordered_map<Rml::FontFaceHandle, std::shared_ptr<FaceBinding>> faces_;
  std::unordered_map<Rml::FontEffectsHandle, Rml::FontFaceHandle> effects_;
  v8::Global<v8::Object> handle_;
  v8::Global<v8::Array> functions_;
  Rml::FontMetrics empty_metrics_{};
  FontMeasureWorkspace workspace_;
  Rml::FontEffectsHandle next_effect_{0};
  uint32_t methods_{0};
  bool initialized_{false};
  bool accepting_faces_{true};
};

}  // namespace

std::unique_ptr<CustomFontEngine> CreateCustomFontEngine(
    v8::Local<v8::Array> functions) {
  return std::make_unique<HostFonts>(functions);
}
v8::MaybeLocal<v8::Value> CustomFontFaceToJs(Rml::FontFaceHandle face) {
  const auto found = Faces().find(face);
  if (found == Faces().end()) {
    return {};
  }
  const auto binding = found->second.lock();
  if (!binding || !binding->valid || binding->handle.IsEmpty()) {
    return {};
  }
  return binding->handle.Get(v8::Isolate::GetCurrent());
}
bool IsCustomFontFace(v8::Local<v8::Value> input) {
  return FaceHandle::TryFrom(input) != nullptr;
}
bool ReadCustomFontFace(v8::Local<v8::Value> input,
                        Rml::FontFaceHandle* face,
                        uint64_t* generation) {
  auto* handle = FaceHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a custom font face handle");
    return false;
  }
  const auto binding = handle->owner();
  const auto life = binding->provider.lock();
  if (!life || !life->alive || !binding->valid ||
      binding->generation != FontGeneration()) {
    Nan::ThrowError("Custom font face handle is no longer valid");
    return false;
  }
  *face = binding->identity;
  if (generation) {
    *generation = binding->generation;
  }
  return true;
}

}  // namespace sfmlrmlui
