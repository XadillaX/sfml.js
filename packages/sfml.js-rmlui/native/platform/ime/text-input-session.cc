// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/platform/ime/text-input-session.h"

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Elements/ElementFormControl.h>
#include <RmlUi/Core/StringUtilities.h>

#include <algorithm>
#include <limits>

namespace sfmlrmlui::ime {

TextInputSession::TextInputSession(Rml::TextInputContext* input,
                                   Rml::Element* element)
    : input_(input), element_(element ? element->GetObserverPtr() : nullptr) {
  Refresh();
}

bool TextInputSession::valid() const {
  return input_ && element_ && element_->GetContext();
}

bool TextInputSession::CanEdit() const {
  if (!valid()) {
    return false;
  }
  const auto* control =
      rmlui_dynamic_cast<Rml::ElementFormControl*>(element_.get());
  return control && !control->IsDisabled();
}

void TextInputSession::ReadSnapshot() {
  if (!valid()) {
    return;
  }
  const auto* control =
      rmlui_dynamic_cast<Rml::ElementFormControl*>(element_.get());
  if (!control) {
    Invalidate();
    return;
  }
  text_ = control->GetValue();
  input_->GetSelectionRange(selection_.start, selection_.end);
  ReadLayout();
}

void TextInputSession::EnableLayoutCapture() {
  capture_layout_ = true;
  Refresh();
}

void TextInputSession::ReadLayout() {
  if (!capture_layout_) {
    return;
  }
  if (!input_->EnsureLayoutForBinding()) {
    layout_.reset();
    layout_revision_ = 0;
    return;
  }
  const uint64_t revision = input_->GetLayoutRevisionForBinding();
  if (layout_ && revision == layout_revision_) {
    return;
  }
  layout_.reset();
  layout_revision_ = 0;
  if (!revision) {
    return;
  }
  TextLayout next;
  const bool captured = input_->GetLayoutForBinding(
      &next, [](void* owner, int line, int position, float horizontal) {
        static_cast<TextLayout*>(owner)->Add(line, position, horizontal);
      });
  if (captured && valid() &&
      revision == input_->GetLayoutRevisionForBinding()) {
    layout_ = std::move(next);
    layout_revision_ = revision;
  }
}

void TextInputSession::Refresh() {
  const auto previous = text_;
  ReadSnapshot();
  if (composition_ && text_ != previous) {
    ClearComposition();
  }
}

CodePointRange TextInputSession::Clamp(CodePointRange range) const {
  const int length =
      static_cast<int>(std::min<size_t>(Rml::StringUtilities::LengthUTF8(text_),
                                        std::numeric_limits<int>::max()));
  range.start = std::clamp(range.start, 0, length);
  range.end = std::clamp(range.end, range.start, length);
  return range;
}

Rml::String TextInputSession::Slice(CodePointRange range) const {
  const int start = Rml::StringUtilities::ConvertCharacterOffsetToByteOffset(
      text_, range.start);
  const int end = Rml::StringUtilities::ConvertCharacterOffsetToByteOffset(
      text_, range.end);
  return text_.substr(start, end - start);
}

void TextInputSession::SetSelection(CodePointRange range) {
  Refresh();
  if (valid()) {
    range = Clamp(range);
    input_->SetSelectionRange(range.start, range.end);
    ReadSnapshot();
  }
}

void TextInputSession::SetCompositionCaret(int position, bool wrap_down) {
  Refresh();
  if (!CanEdit() || !composition_) {
    return;
  }
  position = composition_->start +
             std::clamp(position, 0, composition_->end - composition_->start);
  input_->SetCursorPositionForBinding(position, wrap_down);
  ReadSnapshot();
}

void TextInputSession::Mark(const Rml::String& text,
                            CodePointRange selection,
                            std::optional<CodePointRange> replacement) {
  Refresh();
  if (!CanEdit()) {
    Cancel();
    return;
  }
  if (composition_ && replacement && *replacement != *composition_) {
    Cancel();
  }
  const auto range =
      Clamp(replacement.value_or(composition_.value_or(selection_)));
  if (!composition_) {
    replaced_text_ = Slice(range);
    replaced_selection_ = selection_;
  }
  input_->SetText(text, range.start, range.end);
  if (!valid()) {
    return;
  }
  ReadSnapshot();
  composition_ = Clamp(
      {range.start,
       range.start + static_cast<int>(Rml::StringUtilities::LengthUTF8(text))});
  input_->SetCompositionRange(composition_->start, composition_->end);
  const int length = composition_->end - composition_->start;
  selection.start = std::clamp(selection.start, 0, length);
  selection.end = std::clamp(selection.end, selection.start, length);
  input_->SetSelectionRange(composition_->start + selection.start,
                            composition_->start + selection.end);
  ReadSnapshot();
}

void TextInputSession::Insert(const Rml::String& text,
                              std::optional<CodePointRange> replacement) {
  Refresh();
  if (!CanEdit()) {
    Cancel();
    return;
  }
  auto range = Clamp(replacement.value_or(composition_.value_or(selection_)));
  if (composition_ && range == *composition_) {
    // Restore the committed selection before ordinary insertion. The widget
    // then owns deletion, maxlength, sanitization and change notification,
    // including an empty commit that deletes the original selected text.
    input_->SetText(replaced_text_, range.start, range.end);
    range.end =
        range.start +
        static_cast<int>(Rml::StringUtilities::LengthUTF8(replaced_text_));
    ReadSnapshot();
  } else if (composition_) {
    Cancel();
    range = Clamp(range);
  }
  ClearComposition();
  if (!valid()) {
    return;
  }
  input_->SetSelectionRange(range.start, range.end);
  auto* context = element_->GetContext();
  if (text.empty() && range.end > range.start) {
    context->ProcessKeyDown(Rml::Input::KI_BACK, 0);
  } else {
    context->ProcessTextInput(text);
  }
  ReadSnapshot();
}

void TextInputSession::Unmark() {
  Refresh();
  if (valid() && composition_) {
    Insert(Slice(*composition_));
  }
}

void TextInputSession::Cancel() {
  Refresh();
  if (valid() && composition_) {
    const auto range = *composition_;
    input_->SetText(replaced_text_, range.start, range.end);
    if (valid()) {
      input_->SetSelectionRange(replaced_selection_.start,
                                replaced_selection_.end);
    }
  }
  ClearComposition();
  ReadSnapshot();
}

void TextInputSession::ClearComposition() {
  composition_.reset();
  replaced_text_.clear();
  if (valid()) {
    input_->SetCompositionRange(0, 0);
  }
}

void TextInputSession::Invalidate() {
  input_ = nullptr;
  element_.reset();
  composition_.reset();
  replaced_text_.clear();
  layout_.reset();
}

}  // namespace sfmlrmlui::ime
