// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_VISUAL_REFERENCE_METADATA_H_
#define PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_VISUAL_REFERENCE_METADATA_H_

#include <RmlUi/Core.h>
#include <RmlUi/Core/ElementScroll.h>
#include <RmlUi/Core/Elements/ElementFormControl.h>

#include <iomanip>
#include <ostream>
#include <vector>

namespace visual_reference {

inline void String(std::ostream& out, const Rml::String& value) {
  out << '"';
  for (unsigned char character : value) {
    switch (character) {
      case '"':
        out << "\\\"";
        break;
      case '\\':
        out << "\\\\";
        break;
      case '\n':
        out << "\\n";
        break;
      case '\r':
        out << "\\r";
        break;
      case '\t':
        out << "\\t";
        break;
      default:
        if (character < 32) {
          out << "\\u00" << std::hex << std::setw(2) << std::setfill('0')
              << static_cast<unsigned>(character) << std::dec;
        } else {
          out << character;
        }
    }
  }
  out << '"';
}

inline void Strings(std::ostream& out, const std::vector<Rml::String>& values) {
  out << '[';
  bool first = true;
  for (const auto& value : values) {
    if (!first) out << ',';
    String(out, value);
    first = false;
  }
  out << ']';
}

inline void Elements(std::ostream& out,
                     Rml::Element* element,
                     const Rml::String& path,
                     bool* first,
                     bool detailed = false) {
  if (!*first) out << ',';
  *first = false;
  const auto offset = element->GetAbsoluteOffset(Rml::BoxArea::Border);
  const auto size = element->GetBox().GetSize(Rml::BoxArea::Border);
  const auto content = element->GetBox().GetSize(Rml::BoxArea::Content);
  out << "{\"path\":";
  String(out, path);
  out << ",\"tag\":";
  String(out, element->GetTagName());
  out << ",\"id\":";
  String(out, element->GetId());
  out << ",\"classes\":";
  String(out, element->GetClassNames());
  out << ",\"rect\":[" << offset.x << ',' << offset.y << ',' << size.x << ','
      << size.y << "],\"content\":[" << content.x << ',' << content.y
      << "],\"scroll\":[" << element->GetScrollWidth() << ','
      << element->GetScrollHeight() << ']';
  out << ",\"boxes\":[";
  for (int index = 0; index < element->GetNumBoxes(); ++index) {
    if (index != 0) out << ',';
    Rml::Vector2f box_offset;
    const auto& box = element->GetBox(index, box_offset);
    const auto border = box.GetSize(Rml::BoxArea::Border);
    const auto inner = box.GetSize(Rml::BoxArea::Content);
    out << '[' << box_offset.x << ',' << box_offset.y << ',' << border.x << ','
        << border.y << ',' << inner.x << ',' << inner.y << ']';
  }
  auto* scroll = element->GetElementScroll();
  out << "],\"baseline\":" << element->GetBaseline()
      << ",\"visible\":" << (element->IsVisible() ? "true" : "false")
      << ",\"scrollbars\":["
      << scroll->GetScrollbarSize(Rml::ElementScroll::HORIZONTAL) << ','
      << scroll->GetScrollbarSize(Rml::ElementScroll::VERTICAL) << ']';
  Rml::Rectanglef bounds;
  out << ",\"inkBounds\":";
  if (Rml::ElementUtilities::GetBoundingBox(
          bounds, element, Rml::BoxArea::Auto)) {
    out << '[' << bounds.p0.x << ',' << bounds.p0.y << ',' << bounds.p1.x << ','
        << bounds.p1.y << ']';
  } else {
    out << "null";
  }
  if (detailed) {
    const auto* control = rmlui_dynamic_cast<Rml::ElementFormControl*>(element);
    out << ",\"value\":";
    if (control) {
      String(out, control->GetValue());
    } else {
      out << "null";
    }
    out << ",\"scrollOffset\":[" << element->GetScrollLeft() << ','
        << element->GetScrollTop() << "],\"pseudo\":{";
    bool first_pseudo = true;
    for (const char* name :
         {"hover", "active", "checked", "drag", "focus", "focus-visible"}) {
      if (!first_pseudo) out << ',';
      String(out, name);
      out << ':' << (element->IsPseudoClassSet(name) ? "true" : "false");
      first_pseudo = false;
    }
    out << '}';
  }
  out << '}';
  for (int index = 0; index < element->GetNumChildren(); ++index) {
    Elements(out,
             element->GetChild(index),
             path + "/" + std::to_string(index),
             first,
             detailed);
  }
}

}  // namespace visual_reference

#endif  // PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_VISUAL_REFERENCE_METADATA_H_
