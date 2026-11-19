// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_TEXT_INPUT_SESSION_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_TEXT_INPUT_SESSION_H_

#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/ObserverPtr.h>
#include <RmlUi/Core/TextInputContext.h>

#include <optional>

#include "native/platform/ime/layout/text-layout.h"
#include "native/platform/ime/unicode-ranges.h"

namespace sfmlrmlui::ime {

// Edits run only at the owning runtime boundary. OS queries use the copied
// snapshot; they never dereference a widget while the SFML event pump runs.
class TextInputSession final {
 public:
  TextInputSession(Rml::TextInputContext* input, Rml::Element* element);

  bool valid() const;
  Rml::Element* element() const { return element_.get(); }
  const Rml::String& text() const { return text_; }
  CodePointRange selection() const { return selection_; }
  std::optional<CodePointRange> composition() const { return composition_; }
  const std::optional<TextLayout>& layout() const { return layout_; }

  void EnableLayoutCapture();
  void Refresh();
  void SetCompositionCaret(int position, bool wrap_down);
  void SetSelection(CodePointRange range);
  void Mark(const Rml::String& text,
            CodePointRange selection,
            std::optional<CodePointRange> replacement = std::nullopt);
  void Insert(const Rml::String& text,
              std::optional<CodePointRange> replacement = std::nullopt);
  void Unmark();
  void Cancel();
  void Invalidate();

 private:
  bool CanEdit() const;
  CodePointRange Clamp(CodePointRange range) const;
  Rml::String Slice(CodePointRange range) const;
  void ReadSnapshot();
  void ClearComposition();
  void ReadLayout();

  Rml::TextInputContext* input_{nullptr};
  Rml::ObserverPtr<Rml::Element> element_;
  Rml::String text_;
  CodePointRange selection_;
  std::optional<CodePointRange> composition_;
  Rml::String replaced_text_;
  CodePointRange replaced_selection_;
  std::optional<TextLayout> layout_;
  uint64_t layout_revision_{0};
  bool capture_layout_{false};
};

}  // namespace sfmlrmlui::ime

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_TEXT_INPUT_SESSION_H_
