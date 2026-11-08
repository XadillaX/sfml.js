// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <nan.h>
#include <sfml-js-interop.h>

#include <cstddef>
#include <cstdint>
#include <cstring>
#include <vector>

#include "native/imgui-args.h"

namespace sfmlimgui {
namespace {

/**
 * Map a storage value as a single-element view of the owning handle.
 * ImGui keeps these pointers stable until the entry is removed, and the
 * mapped buffer keeps the owning ImGuiStorage alive.
 * @param info call site, whose argument 0 is the storage handle.
 * @param storage owning shared storage.
 * @param pointer address of the referenced value.
 * @returns the typed view, or null when the pointer is null.
 */
template <typename T>
v8::Local<v8::ArrayBuffer> MapReference(const CallbackInfo& info,
                                        T pointer,
                                        std::size_t size) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImGuiStorage>::TryFrom(info[0]);
  if (!handle || !pointer) return v8::Local<v8::ArrayBuffer>();
  return sfmljs::MapShared(info.GetIsolate(),
                           handle->owner(),
                           reinterpret_cast<void*>(pointer),
                           size);
}

NAN_METHOD(StorageGetIntRef) {
  auto* storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
  if (!storage) return;
  unsigned key = 0;
  int fallback = 0;
  if (!ReadScalar(info, 1, &key) || !ReadScalar(info, 2, &fallback)) return;
  auto* ref = ::cimgui::ImGuiStorage_GetIntRef(storage, key, fallback);
  auto buffer = MapReference(info, ref, sizeof(int));
  if (buffer.IsEmpty()) return;
  info.GetReturnValue().Set(v8::Int32Array::New(buffer, 0, 1));
}

NAN_METHOD(StorageGetBoolRef) {
  auto* storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
  if (!storage) return;
  unsigned key = 0;
  bool fallback = false;
  if (!ReadScalar(info, 1, &key) || !ReadBool(info, 2, &fallback)) return;
  auto* ref = ::cimgui::ImGuiStorage_GetBoolRef(storage, key, fallback);
  auto buffer = MapReference(info, ref, sizeof(bool));
  if (buffer.IsEmpty()) return;
  info.GetReturnValue().Set(v8::Uint8Array::New(buffer, 0, 1));
}

NAN_METHOD(StorageGetFloatRef) {
  auto* storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
  if (!storage) return;
  unsigned key = 0;
  float fallback = 0;
  if (!ReadScalar(info, 1, &key) || !ReadScalar(info, 2, &fallback)) return;
  auto* ref = ::cimgui::ImGuiStorage_GetFloatRef(storage, key, fallback);
  auto buffer = MapReference(info, ref, sizeof(float));
  if (buffer.IsEmpty()) return;
  info.GetReturnValue().Set(v8::Float32Array::New(buffer, 0, 1));
}

NAN_METHOD(StorageGetVoidPtrRef) {
  auto* storage = ReadStruct<cimgui::ImGuiStorage>(info, 0);
  if (!storage) return;
  unsigned key = 0;
  void* fallback = nullptr;
  if (!ReadScalar(info, 1, &key) || !ReadPointer(info, 2, &fallback)) return;
  auto* ref = ::cimgui::ImGuiStorage_GetVoidPtrRef(storage, key, fallback);
  auto buffer = MapReference(info, ref, sizeof(void*));
  if (buffer.IsEmpty()) return;
  if constexpr (sizeof(void*) == 8) {
    info.GetReturnValue().Set(v8::BigUint64Array::New(buffer, 0, 1));
  } else {
    info.GetReturnValue().Set(v8::Uint32Array::New(buffer, 0, 1));
  }
}

/**
 * Read an atlas texture without copying: the buffer keeps the atlas alive.
 * @param info call site whose argument 0 is the atlas handle.
 * @param pixels texture data owned by the atlas.
 * @param width texture width.
 * @param height texture height.
 * @param bytesPerPixel channel count.
 */
void ReturnTexture(const CallbackInfo& info,
                   unsigned char* pixels,
                   int width,
                   int height,
                   int bytesPerPixel) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImFontAtlas>::TryFrom(info[0]);
  if (!handle || !pixels) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  const std::size_t length = static_cast<std::size_t>(width) *
                             static_cast<std::size_t>(height) *
                             static_cast<std::size_t>(bytesPerPixel);
  auto buffer =
      sfmljs::MapShared(info.GetIsolate(), handle->owner(), pixels, length);
  auto result = Nan::New<v8::Object>();
  Nan::Set(result,
           Nan::New("pixels").ToLocalChecked(),
           v8::Uint8Array::New(buffer, 0, length))
      .FromJust();
  Nan::Set(result, Nan::New("width").ToLocalChecked(), Nan::New(width))
      .FromJust();
  Nan::Set(result, Nan::New("height").ToLocalChecked(), Nan::New(height))
      .FromJust();
  Nan::Set(result,
           Nan::New("bytesPerPixel").ToLocalChecked(),
           Nan::New(bytesPerPixel))
      .FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(FontAtlasGetTexDataAsAlpha8) {
  auto* atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
  if (!atlas) return;
  unsigned char* pixels = nullptr;
  int width = 0;
  int height = 0;
  int bytesPerPixel = 1;
  ::cimgui::ImFontAtlas_GetTexDataAsAlpha8(
      atlas, &pixels, &width, &height, &bytesPerPixel);
  ReturnTexture(info, pixels, width, height, bytesPerPixel);
}

NAN_METHOD(FontAtlasGetTexDataAsRGBA32) {
  auto* atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
  if (!atlas) return;
  unsigned char* pixels = nullptr;
  int width = 0;
  int height = 0;
  int bytesPerPixel = 4;
  ::cimgui::ImFontAtlas_GetTexDataAsRGBA32(
      atlas, &pixels, &width, &height, &bytesPerPixel);
  ReturnTexture(info, pixels, width, height, bytesPerPixel);
}

NAN_METHOD(FontGlyphRangesBuilderBuildRanges) {
  auto* builder = ReadStruct<cimgui::ImFontGlyphRangesBuilder>(info, 0);
  if (!builder) return;
  cimgui::ImVector_ImWchar ranges{};
  ::cimgui::ImVector_Construct(&ranges);
  ::cimgui::ImFontGlyphRangesBuilder_BuildRanges(builder, &ranges);
  const std::size_t count = static_cast<std::size_t>(ranges.Size);
  auto buffer =
      v8::ArrayBuffer::New(info.GetIsolate(), count * sizeof(std::uint16_t));
  if (count) {
    std::memcpy(buffer->GetBackingStore()->Data(),
                ranges.Data,
                count * sizeof(std::uint16_t));
  }
  ::cimgui::ImVector_Destruct(&ranges);
  info.GetReturnValue().Set(v8::Uint16Array::New(buffer, 0, count));
}

NAN_METHOD(SelectionBasicStorageGetNextSelectedItem) {
  auto* storage = ReadStruct<cimgui::ImGuiSelectionBasicStorage>(info, 0);
  if (!storage) return;
  std::uint64_t iterator = 0;
  if (!ReadU64(info, 1, &iterator)) return;
  void* opaque = reinterpret_cast<void*>(static_cast<std::uintptr_t>(iterator));
  unsigned int id = 0;
  const bool found = ::cimgui::ImGuiSelectionBasicStorage_GetNextSelectedItem(
      storage, &opaque, &id);
  if (!found) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("id").ToLocalChecked(), Nan::New(id)).FromJust();
  Nan::Set(result,
           Nan::New("iterator").ToLocalChecked(),
           v8::BigInt::NewFromUnsigned(
               info.GetIsolate(), reinterpret_cast<std::uintptr_t>(opaque)))
      .FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ImColorSetHSV) {
  auto* value = ReadFloat32Array(info, 0, 4);
  if (!value) return;
  float hue = 0;
  float saturation = 0;
  float brightness = 0;
  float alpha = 1;
  if (!ReadScalar(info, 1, &hue) || !ReadScalar(info, 2, &saturation) ||
      !ReadScalar(info, 3, &brightness) || !ReadScalar(info, 4, &alpha)) {
    return;
  }
  cimgui::ImColor color{{value[0], value[1], value[2], value[3]}};
  ::cimgui::ImColor_SetHSV(&color, hue, saturation, brightness, alpha);
  value[0] = color.Value.x;
  value[1] = color.Value.y;
  value[2] = color.Value.z;
  value[3] = color.Value.w;
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiReferences) {
  sfmljs::SetMethod<StorageGetIntRef>(target, "Storage_GetIntRef");
  sfmljs::SetMethod<StorageGetBoolRef>(target, "Storage_GetBoolRef");
  sfmljs::SetMethod<StorageGetFloatRef>(target, "Storage_GetFloatRef");
  sfmljs::SetMethod<StorageGetVoidPtrRef>(target, "Storage_GetVoidPtrRef");
  sfmljs::SetMethod<FontAtlasGetTexDataAsAlpha8>(
      target, "FontAtlas_GetTexDataAsAlpha8");
  sfmljs::SetMethod<FontAtlasGetTexDataAsRGBA32>(
      target, "FontAtlas_GetTexDataAsRGBA32");
  sfmljs::SetMethod<FontGlyphRangesBuilderBuildRanges>(
      target, "FontGlyphRangesBuilder_BuildRanges");
  sfmljs::SetMethod<SelectionBasicStorageGetNextSelectedItem>(
      target, "SelectionBasicStorage_GetNextSelectedItem");
  sfmljs::SetMethod<ImColorSetHSV>(target, "ImColor_SetHSV");
}
}  // namespace sfmlimgui
