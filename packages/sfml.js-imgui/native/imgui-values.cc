// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <nan.h>
#include <sfml-js-interop.h>

#include <memory>

#include "native/imgui-args.h"

namespace sfmlimgui {
namespace {

/**
 * Allocate the real C++ object and expose it through dcimgui's layout-identical
 * mirror. The deleter casts back so the C++ destructor runs.
 * @param info call site.
 * @param value freshly allocated object.
 * @returns nothing; the handle is set as the return value.
 */
template <typename Mirror, typename Value>
void ReturnOwned(const CallbackInfo& info, Value* value) {
  if (!value) {
    Nan::ThrowError("Allocation failed");
    return;
  }
  std::shared_ptr<Mirror> owner(
      reinterpret_cast<Mirror*>(value),
      [](Mirror* raw) { delete reinterpret_cast<Value*>(raw); });
  info.GetReturnValue().Set(sfmljs::SharedHandle<Mirror>::Create(owner));
}

NAN_METHOD(CreateFontGlyphRangesBuilder) {
  ReturnOwned<cimgui::ImFontGlyphRangesBuilder>(info,
                                                new ImFontGlyphRangesBuilder());
}

NAN_METHOD(CreateTextBuffer) {
  ReturnOwned<cimgui::ImGuiTextBuffer>(info, new ImGuiTextBuffer());
}

NAN_METHOD(CreateSelectionBasicStorage) {
  ReturnOwned<cimgui::ImGuiSelectionBasicStorage>(
      info, new ImGuiSelectionBasicStorage());
}

NAN_METHOD(CreateListClipper) {
  ReturnOwned<cimgui::ImGuiListClipper>(info, new ImGuiListClipper());
}

NAN_METHOD(CreateTextFilter) {
  ReturnOwned<cimgui::ImGuiTextFilter>(info, new ImGuiTextFilter());
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiValues) {
  sfmljs::SetMethod<CreateFontGlyphRangesBuilder>(
      target, "createFontGlyphRangesBuilder");
  sfmljs::SetMethod<CreateTextBuffer>(target, "createTextBuffer");
  sfmljs::SetMethod<CreateSelectionBasicStorage>(target,
                                                 "createSelectionBasicStorage");
  sfmljs::SetMethod<CreateListClipper>(target, "createListClipper");
  sfmljs::SetMethod<CreateTextFilter>(target, "createTextFilter");
}
}  // namespace sfmlimgui
