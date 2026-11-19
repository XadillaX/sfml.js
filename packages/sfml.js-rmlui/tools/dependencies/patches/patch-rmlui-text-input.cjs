'use strict';

// A sanitized or length-rejected insertion can still delete the selection.
// Keep that deletion on the widget's ordinary change/layout path.
const textInputEdits = [
  {
    file: 'Include/RmlUi/Core/TextInputContext.h',
    before: '\tvirtual ~TextInputContext() {}',
    after: [
      '\tvirtual ~TextInputContext() {}',
      '',
      '\t// sfml.js: read display-line stops at the owning runtime boundary.',
      '\tusing LayoutCallbackForBinding = void (*)(void*, int, int, float);',
      '\tvirtual bool GetLayoutForBinding(void*, LayoutCallbackForBinding)',
      '\t\tconst { return false; }',
      '\tvirtual void SetCursorPositionForBinding(int position, bool)',
      '\t{ SetCursorPosition(position); }',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.h',
    before: '#include "../../../Include/RmlUi/Core/Vertex.h"',
    after: [
      '#include "../../../Include/RmlUi/Core/Vertex.h"',
      '#include "../../../Include/RmlUi/Core/TextInputContext.h"',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.h',
    before: '\t/// Returns the used line height.',
    after: [
      '\t// sfml.js: copied code-point stops and explicit soft-break affinity.',
      '\tbool GetLayoutForBinding(void* data,',
      '\t\tTextInputContext::LayoutCallbackForBinding callback);',
      '\tvoid SetCursorPositionForBinding(int position, bool wrap_down);',
      '',
      '\t/// Returns the used line height.',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: '\tbool GetBoundingBox(Rectanglef& out_rectangle) const override;',
    after: [
      '\tbool GetBoundingBox(Rectanglef& out_rectangle) const override;',
      '\tbool GetLayoutForBinding(void* data,',
      '\t\tLayoutCallbackForBinding callback) const override;',
      '\tvoid SetCursorPositionForBinding(int position, ' +
        'bool wrap_down) override;',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: 'void WidgetTextInputContext::GetSelectionRange(' +
      'int& start, int& end) const',
    after: [
      'bool WidgetTextInputContext::GetLayoutForBinding(void* data,',
      '\tLayoutCallbackForBinding callback) const',
      '{',
      '\treturn owner->GetLayoutForBinding(data, callback);',
      '}',
      '',
      'void WidgetTextInputContext::SetCursorPositionForBinding(int position,',
      '\tbool wrap_down)',
      '{',
      '\towner->SetCursorPositionForBinding(position, wrap_down);',
      '}',
      '',
      'void WidgetTextInputContext::GetSelectionRange(' +
        'int& start, int& end) const',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: 'void WidgetTextInput::GetSelection(int* selection_start, ' +
      'int* selection_end, String* selected_text) const',
    after: [
      'bool WidgetTextInput::GetLayoutForBinding(void* data,',
      '\tTextInputContext::LayoutCallbackForBinding callback)',
      '{',
      '\tif (!callback || force_formatting_on_next_layout ||',
      '\t\ttext_element->GetFontFaceHandle() == 0 || lines.empty())',
      '\t\treturn false;',
      '\tconst String value = GetValue();',
      '\tconst String attribute = GetAttributeValue();',
      '\tconst bool wrap = parent->GetComputedValues().white_space() ==',
      '\t\tStyle::WhiteSpace::Prewrap;',
      '\tfor (size_t index = 0; index < lines.size(); ++index)',
      '\t{',
      '\t\tconst auto& line = lines[index];',
      '\t\tif (line.value_offset < 0 || line.editable_length < 0 ||',
      '\t\t\tline.value_offset + line.editable_length > (int)value.size())',
      '\t\t\treturn false;',
      '\t\tconst float alignment = GetAlignmentSpecificTextOffset(line);',
      '\t\tconst char* begin = value.data() + line.value_offset;',
      '\t\tconst char* end = begin + line.editable_length;',
      '\t\tfor (auto character = StringIteratorU8(begin, begin, end);;)',
      '\t\t{',
      '\t\t\tconst int offset = (int)character.offset();',
      '\t\t\tconst int attribute_offset = DisplayIndexToAttributeIndex(',
      '\t\t\t\tline.value_offset + offset, attribute);',
      '\t\t\tconst int position = ' +
        'StringUtilities::ConvertByteOffsetToCharacterOffset(',
      '\t\t\t\tattribute, attribute_offset);',
      '\t\t\tfloat horizontal = alignment + ' +
        '(float)ElementUtilities::GetStringWidth(',
      '\t\t\t\ttext_element, StringView(begin, begin + offset));',
      '\t\t\tif (wrap)',
      '\t\t\t\thorizontal = Math::Min(horizontal, ' +
        'GetAvailableWidth() - cursor_size.x);',
      '\t\t\tcallback(data, (int)index, position, horizontal);',
      '\t\t\tif (!character)',
      '\t\t\t\tbreak;',
      '\t\t\t++character;',
      '\t\t}',
      '\t}',
      '\treturn true;',
      '}',
      '',
      'void WidgetTextInput::SetCursorPositionForBinding(' +
        'int position, bool wrap_down)',
      '{',
      '\tSetSelectionRange(position, position);',
      '\tif (!IsFocused())',
      '\t\treturn;',
      '\tcursor_wrap_down = wrap_down;',
      '\tUpdateCursorPosition(true);',
      '\tMoveToCursor();',
      '}',
      '',
      'void WidgetTextInput::GetSelection(int* selection_start, ' +
        'int* selection_end, String* selected_text) const',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/TextInputContext.h',
    before: '\tusing LayoutCallbackForBinding = ' +
      'void (*)(void*, int, int, float);',
    after: [
      '\tusing LayoutCallbackForBinding = void (*)(void*, int, int, float);',
      '\tvirtual uint64_t GetLayoutRevisionForBinding() const { return 0; }',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.h',
    before: '\tLineList lines;',
    after: '\tLineList lines;\n\tuint64_t layout_revision_for_binding = 1;',
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.h',
    before: '\t// sfml.js: copied code-point stops ' +
      'and explicit soft-break affinity.',
    after: [
      '\t// sfml.js: copied code-point stops and explicit soft-break affinity.',
      '\tuint64_t GetLayoutRevisionForBinding() const',
      '\t{ return force_formatting_on_next_layout ? 0 :',
      '\t\tlayout_revision_for_binding; }',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: '\tbool GetBoundingBox(Rectanglef& out_rectangle) const override;',
    after: [
      '\tbool GetBoundingBox(Rectanglef& out_rectangle) const override;',
      '\tuint64_t GetLayoutRevisionForBinding() const override',
      '\t{ return owner->GetLayoutRevisionForBinding(); }',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: [
      'Vector2f WidgetTextInput::FormatText(float height_constraint)',
      '{',
      '\tVector2f content_area(0, 0);',
    ].join('\n'),
    after: [
      'Vector2f WidgetTextInput::FormatText(float height_constraint)',
      '{',
      '\t++layout_revision_for_binding;',
      '\tVector2f content_area(0, 0);',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: '\tselection_composition_geometry.Render(text_translation);',
    after: [
      '\tselection_composition_geometry.Render(text_translation);',
      '',
      '\t// sfml.js: rendering has refreshed the accumulated transforms.',
      '\t// Keep OS candidate bounds current even without a key event.',
      '\tif (keyboard_showed && !parent->IsDisabled())',
      '\t\tTextInputContext::NotifyCaretForBinding(parent,',
      '\t\t\ttext_translation + cursor_position, cursor_size.y);',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: [
      'bool WidgetTextInput::AddCharacters(String string)',
      '{',
      '\tSanitizeValue(string);',
      '',
      '\tif (selection_length > 0)',
      '\t\tDeleteSelection();',
    ].join('\n'),
    after: [
      'bool WidgetTextInput::AddCharacters(String string)',
      '{',
      '\tSanitizeValue(string);',
      '',
      '\tconst bool deleted_selection = selection_length > 0;',
      '\tif (deleted_selection)',
      '\t\tDeleteSelection();',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: [
      '\tif (max_length >= 0)',
      '\t\tClampValue(string, Math::Max(max_length - GetLength(), 0));',
      '',
      '\tif (string.empty())',
      '\t\treturn false;',
    ].join('\n'),
    after: [
      '\tif (max_length >= 0)',
      '\t\tClampValue(string, Math::Max(max_length - GetLength(), 0));',
      '',
      '\tif (string.empty())',
      '\t{',
      '\t\tif (deleted_selection)',
      '\t\t\tDispatchChangeEvent();',
      '\t\treturn deleted_selection;',
      '\t}',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/TextInputContext.h',
    before: '\tvirtual uint64_t GetLayoutRevisionForBinding() const ' +
      '{ return 0; }',
    after: [
      '\t// sfml.js: format dirty text only inside guarded runtime input.',
      '\tvirtual bool EnsureLayoutForBinding() { return false; }',
      '\tvirtual uint64_t GetLayoutRevisionForBinding() const { return 0; }',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.h',
    before: '\tuint64_t GetLayoutRevisionForBinding() const',
    after: [
      '\tbool EnsureLayoutForBinding();',
      '\tuint64_t GetLayoutRevisionForBinding() const',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: '\tuint64_t GetLayoutRevisionForBinding() const override',
    after: [
      '\tbool EnsureLayoutForBinding() override',
      '\t{ return owner->EnsureLayoutForBinding(); }',
      '\tuint64_t GetLayoutRevisionForBinding() const override',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: 'bool WidgetTextInput::GetLayoutForBinding(void* data,',
    after: [
      'bool WidgetTextInput::EnsureLayoutForBinding()',
      '{',
      '\tOnLayout();',
      '\treturn !force_formatting_on_next_layout &&',
      '\t\ttext_element->GetFontFaceHandle() != 0 && !lines.empty();',
      '}',
      '',
      'bool WidgetTextInput::GetLayoutForBinding(void* data,',
    ].join('\n'),
  },
];

module.exports = { textInputEdits };
