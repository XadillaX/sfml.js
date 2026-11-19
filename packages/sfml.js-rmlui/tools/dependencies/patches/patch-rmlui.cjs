'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { numericEdits } = require('./patch-rmlui-numeric.cjs');
const { stringEdits } = require('./patch-rmlui-strings.cjs');
const { textInputEdits } = require('./patch-rmlui-text-input.cjs');

// Keep the original function-pointer overload intact. The additional callback
// owner lets copied animation keys retain host closures without global slots.
const scriptEdits = [
  {
    file: 'Include/RmlUi/Core/ScriptInterface.h',
    before: '#include "Types.h"',
    after: '#include "Types.h"\n\n#include <memory>\n#include <utility>',
  },
  {
    file: 'Include/RmlUi/Core/ScriptInterface.h',
    before: '\tvirtual ScriptObject GetScriptObject() const ' +
      '{ return nullptr; }',
    after: [
      '\tvirtual ScriptObject GetScriptObject() const',
      '\t{ return script_object_for_binding; }',
      '',
      '\t// The managed host owns the opaque value; native overrides remain',
      '\t// authoritative and must use their own registered adapter.',
      '\tScriptObject GetScriptObjectForBinding() const',
      '\t{ return script_object_for_binding; }',
      '\tvoid SetScriptObjectForBinding(ScriptObject object,',
      '\t\tstd::shared_ptr<void> lifetime)',
      '\t{',
      '\t\tscript_object_for_binding = object;',
      '\t\tscript_object_lifetime_for_binding = std::move(lifetime);',
      '\t}',
      '',
      'private:',
      '\tScriptObject script_object_for_binding = nullptr;',
      '\tstd::shared_ptr<void> script_object_lifetime_for_binding;',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/Factory.h',
    before: 'class RMLUICORE_API Factory {\npublic:',
    after: [
      'class RMLUICORE_API Factory {\npublic:',
      '\t// Optional document hosts leave the normal instancer ' +
        'registries intact.',
      '\tusing DocumentRouterForBinding = bool (*)(Context*, ' +
        'const String&, ElementPtr&);',
      '\tusing ListenerRouterForBinding = bool (*)(const String&, ' +
        'Element*, EventListener*&);',
      '\tstatic DocumentRouterForBinding& DocumentRouterSlotForBinding()',
      '\t{ static DocumentRouterForBinding router = nullptr; return router; }',
      '\tstatic ListenerRouterForBinding& ListenerRouterSlotForBinding()',
      '\t{ static ListenerRouterForBinding router = nullptr; return router; }',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/Factory.h',
    before: '\tstatic ListenerRouterForBinding& ' +
      'ListenerRouterSlotForBinding()\n\t{ static ListenerRouterForBinding ' +
      'router = nullptr; return router; }',
    after: [
      '\tstatic ListenerRouterForBinding& ListenerRouterSlotForBinding()',
      '\t{ static ListenerRouterForBinding router = nullptr; return router; }',
      '\tstruct AttributeScopeForBinding {',
      '\t\tElement* element;',
      '\t\tElement* parent;',
      '\t\tAttributeScopeForBinding* previous;',
      '\t\tstatic AttributeScopeForBinding*& Slot()',
      '\t\t{ static AttributeScopeForBinding* scope = nullptr; return scope; }',
      '\t\tAttributeScopeForBinding(Element* element, Element* parent) :',
      '\t\t\telement(element), parent(parent), previous(Slot())',
      '\t\t{ Slot() = this; }',
      '\t\t~AttributeScopeForBinding() { Slot() = previous; }',
      '\t};',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Factory.cpp',
    before: '\t\t\telement->SetAttributes(attributes);',
    after: [
      '\t\t\t{',
      '\t\t\t\tAttributeScopeForBinding scope(element.get(), parent);',
      '\t\t\t\telement->SetAttributes(attributes);',
      '\t\t\t}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Factory.cpp',
    before: '\tElementPtr element = Factory::InstanceElement(nullptr, ' +
      'document_base_tag, document_base_tag, XMLAttributes());',
    after: [
      '\tElementPtr element;',
      '\tauto router = DocumentRouterSlotForBinding();',
      '\tif (!router || !router(context, document_base_tag, element))',
      '\t\telement = Factory::InstanceElement(nullptr, document_base_tag, ' +
        'document_base_tag, XMLAttributes());',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/ElementDocument.h',
    before: '\tvirtual void LoadExternalScript(const String& source_path);',
    after: [
      '\tvirtual void LoadExternalScript(const String& source_path);',
      '\t// A failed host script must not attach a partially loaded document.',
      '\tvirtual bool HasScriptErrorForBinding() const { return false; }',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Factory.cpp',
    before: '\tif (stream->HasReadError())\n\t\treturn nullptr;',
    after: '\tif (stream->HasReadError() || ' +
      'document->HasScriptErrorForBinding())\n\t\treturn nullptr;',
  },
  {
    file: 'Source/Core/Factory.cpp',
    before: 'EventListener* Factory::InstanceEventListener' +
      '(const String& value, Element* element)\n{',
    after: [
      'EventListener* Factory::InstanceEventListener(const String& value, ' +
        'Element* element)\n{',
      '\tEventListener* listener = nullptr;',
      '\tif (auto router = ListenerRouterSlotForBinding();',
      '\t\trouter && router(value, element, listener))',
      '\t\treturn listener;',
    ].join('\n'),
  },
];

const edits = [
  {
    file: 'Include/RmlUi/Core/TextInputContext.h',
    before: '\tvirtual ~TextInputContext() {}',
    after: [
      '\tvirtual ~TextInputContext() {}',
      '',
      '\tusing CaretCallbackForBinding = void (*)(Element*, Vector2f, float);',
      '\tstatic CaretCallbackForBinding& CaretCallbackSlotForBinding()',
      '\t{',
      '\t\tstatic CaretCallbackForBinding callback = nullptr;',
      '\t\treturn callback;',
      '\t}',
      '\tstatic void SetCaretCallbackForBinding(' +
        'CaretCallbackForBinding callback)',
      '\t{ CaretCallbackSlotForBinding() = callback; }',
      '\tstatic void NotifyCaretForBinding(Element* element, ' +
        'Vector2f caret, float height)',
      '\t{',
      '\t\tif (auto callback = CaretCallbackSlotForBinding())',
      '\t\t\tcallback(element, caret, height);',
      '\t}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: '\t\tsystem->ActivateKeyboard(' +
      'absolute_cursor_position, cursor_size.y);',
    after: '\t\tsystem->ActivateKeyboard(' +
      'absolute_cursor_position, cursor_size.y);\n' +
      '\t\tTextInputContext::NotifyCaretForBinding(' +
      'parent, absolute_cursor_position, cursor_size.y);',
  },
  {
    file: 'Include/RmlUi/Core/TextInputContext.h',
    before: '\tvirtual ~TextInputContext() {}',
    after: [
      '\tusing FocusCallbackForBinding = void (*)(' +
        'TextInputContext*, Element*, bool);',
      '\tstatic FocusCallbackForBinding& FocusCallbackSlotForBinding()',
      '\t{',
      '\t\tstatic FocusCallbackForBinding callback = nullptr;',
      '\t\treturn callback;',
      '\t}',
      '\tstatic void SetFocusCallbackForBinding(' +
        'FocusCallbackForBinding callback)',
      '\t{ FocusCallbackSlotForBinding() = callback; }',
      '\tvoid NotifyFocusForBinding(Element* element, bool active)',
      '\t{',
      '\t\tif (auto callback = FocusCallbackSlotForBinding())',
      '\t\t\tcallback(this, element, active);',
      '\t}',
      '',
      '\tvirtual ~TextInputContext() {}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: '\t\t\t\thandler->OnActivate(text_input_context.get());',
    after: '\t\t\t\thandler->OnActivate(text_input_context.get());\n' +
      '\t\t\t\ttext_input_context->NotifyFocusForBinding(parent, true);',
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: '\t\t\tif (TextInputHandler* handler = GetTextInputHandler())\n' +
      '\t\t\t\thandler->OnDeactivate(text_input_context.get());',
    after: '\t\t\tif (text_input_context)\n' +
      '\t\t\t\ttext_input_context->NotifyFocusForBinding(parent, false);\n' +
      '\t\t\tif (TextInputHandler* handler = GetTextInputHandler())\n' +
      '\t\t\t\thandler->OnDeactivate(text_input_context.get());',
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: 'value_length + composition_length - (start - end)',
    after: 'value_length + composition_length - (end - start)',
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: 'int new_length = owner->GetMaxLength() - ' +
      '(value_length - composition_length);',
    after: 'int new_length = Math::Max(0, owner->GetMaxLength() - ' +
      '(value_length - (end - start)));',
  },
  {
    file: 'Include/RmlUi/Core/TextInputContext.h',
    before: 'class RMLUICORE_API TextInputContext {\npublic:',
    after: [
      'class RMLUICORE_API TextInputContext {\npublic:',
      '\tusing LifetimeCallbackForBinding = void (*)(TextInputContext*,',
      '\t\tTextInputHandler*, Element*, bool);',
      '\tstatic LifetimeCallbackForBinding& LifetimeCallbackSlotForBinding()',
      '\t{',
      '\t\tstatic LifetimeCallbackForBinding callback = nullptr;',
      '\t\treturn callback;',
      '\t}',
      '\tstatic void SetLifetimeCallbackForBinding(' +
        'LifetimeCallbackForBinding callback)',
      '\t{ LifetimeCallbackSlotForBinding() = callback; }',
      '\tvoid NotifyLifetimeForBinding(TextInputHandler* handler,',
      '\t\tElement* element, bool destroyed)',
      '\t{',
      '\t\tif (auto callback = LifetimeCallbackSlotForBinding())',
      '\t\t\tcallback(this, handler, element, destroyed);',
      '\t}',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/TextInputContext.h',
    before: 'namespace Rml {\n',
    after: 'namespace Rml {\n\nclass TextInputHandler;\nclass Element;\n',
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: '\thandler(handler), owner(owner), element(element)\n{}',
    after: [
      '\thandler(handler), owner(owner), element(element)',
      '{ NotifyLifetimeForBinding(handler, element, false); }',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: '\thandler->OnDestroy(this);\n}',
    after: [
      '\thandler->OnDestroy(this);',
      '\tNotifyLifetimeForBinding(handler, element, true);',
      '}',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/Context.h',
    before: '\tvoid SetInstancer(ContextInstancer* instancer);',
    after: [
      '\tvoid SetInstancer(ContextInstancer* instancer);',
      '\t// Native delegates may already install their release allocator.',
      '\tbool HasInstancerForBinding() const { return instancer != nullptr; }',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Factory.cpp',
    before: '\t\tnew_context->SetInstancer(context_instancer);',
    after: [
      '\t\tif (!new_context->HasInstancerForBinding())',
      '\t\t\tnew_context->SetInstancer(context_instancer);',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/InputTypeRange.cpp',
    before: '#include "WidgetSlider.h"',
    after: '#include "WidgetSlider.h"\n#include <stdexcept>',
  },
  {
    file: 'Source/Core/Elements/InputTypeRange.cpp',
    before: '\twidget = new WidgetSlider(element);\n\twidget->Initialise();',
    after: [
      '\tauto created = MakeUnique<WidgetSlider>(element);',
      '\tif (!created->Initialise())',
      '\t\tthrow std::runtime_error("Failed to instance range slider");',
      '\twidget = created.release();',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/ElementFormControlInput.cpp',
    before: '#include "InputTypeText.h"',
    after: '#include "InputTypeText.h"\n#include <stdexcept>',
  },
  ...[
    'return type->GetValue();', 'return type->IsSubmitted();',
    'type->Select();',
    'type->SetSelectionRange(selection_start, selection_end);',
    'type->GetSelection(selection_start, selection_end, selected_text);',
    'type->SetCompositionRange(range_start, range_end);',
    'type->OnUpdate();', 'type->OnRender();', 'type->OnResize();',
    'type->OnLayout();',
  ].map(statement => ({
    file: 'Source/Core/Elements/ElementFormControlInput.cpp',
    before: `\tRMLUI_ASSERT(type);\n\t${statement}`,
    after: '\tif (!type)\n' +
      '\t\tthrow std::runtime_error("Input type is not initialised");\n' +
      `\t${statement}`,
  })),
  {
    file: 'Source/Core/Elements/WidgetDropDown.cpp',
    before: '#include "../DataModel.h"',
    after: '#include "../DataModel.h"\n#include <stdexcept>',
  },
  {
    file: 'Source/Core/Elements/WidgetDropDown.cpp',
    before: [
      '\tbutton_element = parent_element->AppendChild(' +
        'Factory::InstanceElement(parent_element, "*", "selectarrow", ' +
        'XMLAttributes()), false);',
      '\tvalue_element = parent_element->AppendChild(' +
        'Factory::InstanceElement(parent_element, "*", "selectvalue", ' +
        'XMLAttributes()), false);',
      '\tselection_element = parent_element->AppendChild(' +
        'Factory::InstanceElement(parent_element, "*", "selectbox", ' +
        'XMLAttributes()), false);',
      '',
      '\tvalue_element->SetProperty',
    ].join('\n'),
    after: [
      '\tauto instance_child = [this](const String& tag) {',
      '\t\tElementPtr child = Factory::InstanceElement(parent_element, ' +
        '"*", tag, XMLAttributes());',
      '\t\tif (!child)',
      '\t\t\tthrow std::runtime_error("Failed to instance select children");',
      '\t\treturn parent_element->AppendChild(std::move(child), false);',
      '\t};',
      '\tbutton_element = instance_child("selectarrow");',
      '\tvalue_element = instance_child("selectvalue");',
      '\tselection_element = instance_child("selectbox");',
      '',
      '\tvalue_element->SetProperty',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: '#include <limits.h>',
    after: '#include <limits.h>\n#include <stdexcept>',
  },
  {
    file: 'Source/Core/Elements/WidgetTextInput.cpp',
    before: [
      '\tparent->AddEventListener(EventId::Keydown, this, true);',
      '\tparent->AddEventListener(EventId::Textinput, this, true);',
      '\tparent->AddEventListener(EventId::Focus, this, true);',
      '\tparent->AddEventListener(EventId::Blur, this, true);',
      '\tparent->AddEventListener(EventId::Mousedown, this, true);',
      '\tparent->AddEventListener(EventId::Dblclick, this, true);',
      '\tparent->AddEventListener(EventId::Drag, this, true);',
      '',
      '\tElementPtr unique_text = Factory::InstanceElement(parent, ' +
        '"#text", "#text", XMLAttributes());',
      '\ttext_element = rmlui_dynamic_cast<ElementText*>(unique_text.get());',
      '\tElementPtr unique_selected_text = Factory::InstanceElement(parent, ' +
        '"#text", "#text", XMLAttributes());',
      '\tselected_text_element = rmlui_dynamic_cast<ElementText*>(' +
        'unique_selected_text.get());',
      '\tif (text_element)',
      '\t{',
      '\t\ttext_element->SuppressAutoLayout();',
      '\t\tparent->AppendChild(std::move(unique_text), false);',
      '',
      '\t\tselected_text_element->SuppressAutoLayout();',
      '\t\tparent->AppendChild(std::move(unique_selected_text), false);',
      '\t}',
      '',
      '\t// Create the dummy selection element.',
      '\tElementPtr unique_selection = Factory::InstanceElement(parent, ' +
        '"#selection", "selection", XMLAttributes());',
      '\tif (ElementTextSelection* text_selection_element = ' +
        'rmlui_dynamic_cast<ElementTextSelection*>(unique_selection.get()))',
      '\t{',
      '\t\tselection_element = text_selection_element;',
      '\t\ttext_selection_element->SetWidget(this);',
      '\t\tparent->AppendChild(std::move(unique_selection), false);',
      '\t}',
    ].join('\n'),
    after: [
      '\tbool text_attached = false;',
      '\tbool selected_text_attached = false;',
      '\tbool selection_attached = false;',
      '\ttry',
      '\t{',
      '\t\tparent->AddEventListener(EventId::Keydown, this, true);',
      '\t\tparent->AddEventListener(EventId::Textinput, this, true);',
      '\t\tparent->AddEventListener(EventId::Focus, this, true);',
      '\t\tparent->AddEventListener(EventId::Blur, this, true);',
      '\t\tparent->AddEventListener(EventId::Mousedown, this, true);',
      '\t\tparent->AddEventListener(EventId::Dblclick, this, true);',
      '\t\tparent->AddEventListener(EventId::Drag, this, true);',
      '',
      '\t\tElementPtr unique_text = Factory::InstanceElement(parent, ' +
        '"#text", "#text", XMLAttributes());',
      '\t\ttext_element = rmlui_dynamic_cast<ElementText*>(unique_text.get());',
      '\t\tElementPtr unique_selected_text = ' +
        'Factory::InstanceElement(parent, ' +
        '"#text", "#text", XMLAttributes());',
      '\t\tselected_text_element = rmlui_dynamic_cast<ElementText*>(' +
        'unique_selected_text.get());',
      '\t\tif (!text_element || !selected_text_element)',
      '\t\t\tthrow std::runtime_error(' +
        '"Failed to instance text input children");',
      '',
      '\t\ttext_element->SuppressAutoLayout();',
      '\t\tparent->AppendChild(std::move(unique_text), false);',
      '\t\ttext_attached = true;',
      '\t\tselected_text_element->SuppressAutoLayout();',
      '\t\tparent->AppendChild(std::move(unique_selected_text), false);',
      '\t\tselected_text_attached = true;',
      '',
      '\t\tElementPtr unique_selection = Factory::InstanceElement(parent, ' +
        '"#selection", "selection", XMLAttributes());',
      '\t\tauto* text_selection_element = ' +
        'rmlui_dynamic_cast<ElementTextSelection*>(unique_selection.get());',
      '\t\tif (!text_selection_element)',
      '\t\t\tthrow std::runtime_error("Failed to instance text selection");',
      '\t\tselection_element = text_selection_element;',
      '\t\ttext_selection_element->SetWidget(this);',
      '\t\tparent->AppendChild(std::move(unique_selection), false);',
      '\t\tselection_attached = true;',
      '\t}',
      '\tcatch (...)',
      '\t{',
      '\t\t// sfml.js: throwing constructors do not run their destructor.',
      '\t\tparent->RemoveEventListener(EventId::Keydown, this, true);',
      '\t\tparent->RemoveEventListener(EventId::Textinput, this, true);',
      '\t\tparent->RemoveEventListener(EventId::Focus, this, true);',
      '\t\tparent->RemoveEventListener(EventId::Blur, this, true);',
      '\t\tparent->RemoveEventListener(EventId::Mousedown, this, true);',
      '\t\tparent->RemoveEventListener(EventId::Dblclick, this, true);',
      '\t\tparent->RemoveEventListener(EventId::Drag, this, true);',
      '\t\tparent->RemoveProperty(PropertyId::WhiteSpace);',
      '\t\tparent->RemoveProperty(PropertyId::OverflowX);',
      '\t\tparent->RemoveProperty(PropertyId::OverflowY);',
      '\t\tparent->RemoveProperty(PropertyId::Drag);',
      '\t\tparent->RemoveProperty(PropertyId::WordBreak);',
      '\t\tparent->RemoveProperty(PropertyId::TextTransform);',
      '\t\tif (text_attached)',
      '\t\t\tparent->RemoveChild(text_element);',
      '\t\tif (selected_text_attached)',
      '\t\t\tparent->RemoveChild(selected_text_element);',
      '\t\tif (selection_attached)',
      '\t\t\tparent->RemoveChild(selection_element);',
      '\t\tthrow;',
      '\t}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Elements/ElementProgress.cpp',
    before: '#include <algorithm>',
    after: '#include <algorithm>\n#include <stdexcept>',
  },
  {
    file: 'Source/Core/Elements/ElementProgress.cpp',
    before: '\tRMLUI_ASSERT(fill_element);',
    after: '\tif (!fill_element)\n' +
      '\t\tthrow std::runtime_error("Failed to instance progress fill");',
  },
  {
    file: 'Source/Core/ElementScroll.cpp',
    before: '#include "WidgetScroll.h"',
    after: '#include "WidgetScroll.h"\n' +
      '#include <stdexcept>\n#include <utility>',
  },
  {
    file: 'Source/Core/ElementScroll.cpp',
    before: [
      '\tscrollbars[orientation].element = scrollbar_element.get();',
      '\tscrollbars[orientation].element->SetProperty(PropertyId::Clip, ' +
        'Property(1, Unit::NUMBER));',
      '\tscrollbars[orientation].element->SetProperty(PropertyId::Drag, ' +
        'Property(Style::Drag::Block));',
      '',
      '\tscrollbars[orientation].widget = ' +
        'MakeUnique<WidgetScroll>(scrollbars[orientation].element);',
      '\tscrollbars[orientation].widget->Initialise(orientation == VERTICAL ' +
        '? WidgetScroll::VERTICAL : WidgetScroll::HORIZONTAL);',
    ].join('\n'),
    after: [
      '\tif (!scrollbar_element)',
      '\t\tthrow std::runtime_error("Failed to instance scrollbar element");',
      '\tscrollbar_element->SetProperty(PropertyId::Clip, ' +
        'Property(1, Unit::NUMBER));',
      '\tscrollbar_element->SetProperty(PropertyId::Drag, ' +
        'Property(Style::Drag::Block));',
      '',
      '\tauto widget = MakeUnique<WidgetScroll>(scrollbar_element.get());',
      '\tif (!widget->Initialise(orientation == VERTICAL ' +
        '? WidgetScroll::VERTICAL : WidgetScroll::HORIZONTAL))',
      '\t\tthrow std::runtime_error("Failed to instance scrollbar children");',
      '',
      '\t// sfml.js: publish component pointers only after full construction.',
      '\tscrollbars[orientation].element = scrollbar_element.get();',
      '\tscrollbars[orientation].widget = std::move(widget);',
    ].join('\n'),
  },
  {
    file: 'Source/Core/ElementScroll.cpp',
    before: '\tcorner = corner_element.get();',
    after: '\tif (!corner_element)\n' +
      '\t\tthrow std::runtime_error("Failed to instance scrollbar corner");\n' +
      '\tcorner = corner_element.get();',
  },
  {
    file: 'Include/RmlUi/Core/PropertyDictionary.h',
    before: '#include "Property.h"',
    after: '#include "Property.h"\n#include <cstdint>',
  },
  {
    file: 'Include/RmlUi/Core/PropertyDictionary.h',
    before: 'class RMLUICORE_API PropertyDictionary {',
    after: [
      '// sfml.js: resource mutations invalidate host callback owner edges.',
      'RMLUICORE_API std::uint64_t GetCallbackResourceVersionForBinding();',
      'RMLUICORE_API void InvalidateCallbackResourcesForBinding();',
      'RMLUICORE_API bool HasCallbackResourcesForBinding(' +
        'const Variant& value);',
      '',
      'class RMLUICORE_API PropertyDictionary {',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/PropertyDictionary.h',
    before: '\tPropertyDictionary();',
    after: '\tPropertyDictionary();\n' +
      '\tbool HasCallbackResourcesForBinding() const;',
  },
  {
    file: 'Source/Core/PropertyDictionary.cpp',
    before: '#include "../../Include/RmlUi/Core/ID.h"',
    after: '#include "../../Include/RmlUi/Core/ID.h"\n' +
      '#include "../../Include/RmlUi/Core/PropertyDefinition.h"',
  },
  {
    file: 'Source/Core/PropertyDictionary.cpp',
    before: 'PropertyDictionary::PropertyDictionary() {}',
    after: [
      'namespace {',
      'std::uint64_t callback_resource_version = 0;',
      '',
      'bool PropertyHasCallbackResources(const Property* property)',
      '{',
      '\treturn property && (HasCallbackResourcesForBinding(property->value)',
      '\t\t|| (property->definition && HasCallbackResourcesForBinding(',
      '\t\t\tproperty->definition->GetDefaultValue()->value)));',
      '}',
      '',
      'void InvalidatePropertyCallbacks(const Property* previous,',
      '\tconst Property& next)',
      '{',
      '\tif (PropertyHasCallbackResources(previous) ||',
      '\t\tPropertyHasCallbackResources(&next))',
      '\t\tInvalidateCallbackResourcesForBinding();',
      '}',
      '}',
      '',
      'std::uint64_t GetCallbackResourceVersionForBinding()',
      '{',
      '\treturn callback_resource_version;',
      '}',
      '',
      'void InvalidateCallbackResourcesForBinding()',
      '{',
      '\t++callback_resource_version;',
      '}',
      '',
      'bool HasCallbackResourcesForBinding(const Variant& value)',
      '{',
      '\treturn value.GetType() == Variant::FONTEFFECTSPTR ||',
      '\t\tvalue.GetType() == Variant::DECORATORSPTR ||',
      '\t\tvalue.GetType() == Variant::FILTERSPTR;',
      '}',
      '',
      'bool PropertyDictionary::HasCallbackResourcesForBinding() const',
      '{',
      '\tfor (const auto& entry : properties)',
      '\t\tif (PropertyHasCallbackResources(&entry.second)) return true;',
      '\tfor (const auto& entry : custom_properties)',
      '\t\tif (PropertyHasCallbackResources(&entry.second)) return true;',
      '\tfor (const auto& entry : var_shorthands)',
      '\t\tif (PropertyHasCallbackResources(&entry.second)) return true;',
      '\treturn false;',
      '}',
      '',
      'PropertyDictionary::PropertyDictionary() {}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/PropertyDictionary.cpp',
    before: '\tproperties[id] = property;',
    after: '\tInvalidatePropertyCallbacks(GetProperty(id), property);\n' +
      '\tproperties[id] = property;',
  },
  {
    file: 'Source/Core/PropertyDictionary.cpp',
    before: '\tproperties.erase(id);',
    after: '\tif (PropertyHasCallbackResources(GetProperty(id)))\n' +
      '\t\tInvalidateCallbackResourcesForBinding();\n\tproperties.erase(id);',
  },
  {
    file: 'Source/Core/PropertyDictionary.cpp',
    before: '\tcustom_properties.insert_or_assign(std::move(name), ' +
      'std::move(property));',
    after: '\tInvalidatePropertyCallbacks(' +
      'GetCustomProperty(name), property);\n' +
      '\tcustom_properties.insert_or_assign(std::move(name), ' +
      'std::move(property));',
  },
  {
    file: 'Source/Core/PropertyDictionary.cpp',
    before: '\treturn custom_properties.erase(name) > 0;',
    after: '\tif (PropertyHasCallbackResources(GetCustomProperty(name)))\n' +
      '\t\tInvalidateCallbackResourcesForBinding();\n' +
      '\treturn custom_properties.erase(name) > 0;',
  },
  {
    file: 'Source/Core/PropertyDictionary.cpp',
    before: '\tvar_shorthands.insert_or_assign(id, std::move(property));',
    after: '\tInvalidatePropertyCallbacks(GetVarShorthand(id), property);\n' +
      '\tvar_shorthands.insert_or_assign(id, std::move(property));',
  },
  {
    file: 'Source/Core/PropertyDictionary.cpp',
    before: '\treturn var_shorthands.erase(id) > 0;',
    after: '\tif (PropertyHasCallbackResources(GetVarShorthand(id)))\n' +
      '\t\tInvalidateCallbackResourcesForBinding();\n' +
      '\treturn var_shorthands.erase(id) > 0;',
  },
  {
    file: 'Source/Core/PropertyDictionary.cpp',
    before: '\tproperties.clear();',
    after: '\tif (HasCallbackResourcesForBinding())\n' +
      '\t\tInvalidateCallbackResourcesForBinding();\n\tproperties.clear();',
  },
  {
    file: 'Source/Core/PropertyDictionary.cpp',
    before: '\tProperty& new_property = (properties[id] = property);',
    after: '\tInvalidatePropertyCallbacks(GetProperty(id), property);\n' +
      '\tProperty& new_property = (properties[id] = property);',
  },
  ...[
    [ 'GetCustomProperty(name)', 'custom_properties', 'name' ],
    [ 'GetVarShorthand(id)', 'var_shorthands', 'id' ],
  ].map(([ getter, map, key ]) => ({
    file: 'Source/Core/PropertyDictionary.cpp',
    before: `\tProperty& new_property = ${map}` +
      `.insert_or_assign(${key}, property).first->second;`,
    after: `\tInvalidatePropertyCallbacks(${getter}, property);\n` +
      `\tProperty& new_property = ${map}` +
      `.insert_or_assign(${key}, property).first->second;`,
  })),
  {
    file: 'Source/Core/ElementStyle.cpp',
    before: '\tif (new_definition != definition)\n\t{',
    after: '\tif (new_definition != definition)\n\t{\n' +
      '\t\tif ((definition && definition->GetProperties().' +
      'HasCallbackResourcesForBinding()) ||\n' +
      '\t\t\t(new_definition && new_definition->GetProperties().' +
      'HasCallbackResourcesForBinding()))\n' +
      '\t\t\tInvalidateCallbackResourcesForBinding();',
  },
  {
    file: 'Include/RmlUi/Core/Element.inl',
    before: '\tattributes[name] = variant;',
    after: '\tif (HasCallbackResourcesForBinding(variant) ||\n' +
      '\t\tHasCallbackResourcesForBinding(GetAttribute(name, Variant{})))\n' +
      '\t\tInvalidateCallbackResourcesForBinding();\n' +
      '\tattributes[name] = variant;',
  },
  {
    file: 'Source/Core/Element.cpp',
    before: '\t\tattributes.erase(it);',
    after: '\t\tif (HasCallbackResourcesForBinding(it->second))\n' +
      '\t\t\tInvalidateCallbackResourcesForBinding();\n' +
      '\t\tattributes.erase(it);',
  },
  {
    file: 'Source/Core/Element.cpp',
    before: '\tfor (auto& pair : _attributes)\n' +
      '\t\tattributes[pair.first] = pair.second;',
    after: '\tfor (auto& pair : _attributes)\n\t{\n' +
      '\t\tif (HasCallbackResourcesForBinding(pair.second) ||\n' +
      '\t\t\tHasCallbackResourcesForBinding(' +
      'GetAttribute(pair.first, Variant{})))\n' +
      '\t\t\tInvalidateCallbackResourcesForBinding();\n' +
      '\t\tattributes[pair.first] = pair.second;\n\t}',
  },
  {
    file: 'Source/Core/PropertyDefinition.cpp',
    before: '#include "../../Include/RmlUi/Core/PropertyDefinition.h"',
    after: '#include "../../Include/RmlUi/Core/PropertyDefinition.h"\n' +
      '#include "../../Include/RmlUi/Core/PropertyDictionary.h"',
  },
  {
    file: 'Source/Core/PropertyDefinition.cpp',
    before: '\t\t\tdefault_value.parser_index = parser_index;',
    after: '\t\t\tif (HasCallbackResourcesForBinding(default_value.value))\n' +
      '\t\t\t\tInvalidateCallbackResourcesForBinding();\n' +
      '\t\t\tdefault_value.parser_index = parser_index;',
  },
  {
    file: 'Include/RmlUi/Core/Element.h',
    before: '#include "Types.h"',
    after: '#include "Types.h"\n#include <cstdint>',
  },
  {
    file: 'Include/RmlUi/Core/Element.h',
    before: '#include <cstdint>',
    after: '#include <cstdint>\n#include "PropertyDictionary.h"',
  },
  {
    file: 'Include/RmlUi/Core/Element.h',
    before: '\tvirtual ~Element();',
    after: [
      '\tvirtual ~Element();',
      '',
      '\t// sfml.js: observe actual DOM and internal-widget topology changes.',
      '\tstatic std::uint64_t GetTopologyVersionForBinding();',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Element.cpp',
    before: 'RMLUI_RTTI_Define(Element)',
    after: [
      'namespace {',
      '// Accessed only by the owning RmlUi thread.',
      'std::uint64_t element_topology_version = 0;',
      '}',
      '',
      'std::uint64_t Element::GetTopologyVersionForBinding()',
      '{',
      '\treturn element_topology_version;',
      '}',
      '',
      'RMLUI_RTTI_Define(Element)',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Element.cpp',
    before: '\tRMLUI_ASSERT(tag == StringUtilities::ToLower(tag));',
    after: '\t++element_topology_version;\n' +
      '\tRMLUI_ASSERT(tag == StringUtilities::ToLower(tag));',
  },
  {
    file: 'Source/Core/Element.cpp',
    before: 'Element::~Element()\n{',
    after: 'Element::~Element()\n{\n\t++element_topology_version;',
  },
  {
    file: 'Source/Core/Element.cpp',
    before: '\tparent = _parent;',
    after: '\tif (parent != _parent)\n\t\t++element_topology_version;\n' +
      '\tparent = _parent;',
  },
  {
    file: 'Include/RmlUi/Core/Element.h',
    before: '\tstatic std::uint64_t GetTopologyVersionForBinding();',
    after: '\tstatic std::uint64_t GetTopologyVersionForBinding();\n' +
      '\tstatic std::uint64_t GetParentVersionForBinding();',
  },
  {
    file: 'Source/Core/Element.cpp',
    before: 'RMLUI_RTTI_Define(Element)',
    after: [
      'RMLUI_RTTI_Define(Element)',
      '',
      'namespace {',
      'std::uint64_t element_parent_version = 0;',
      '}',
      '',
      'std::uint64_t Element::GetParentVersionForBinding()',
      '{',
      '\treturn element_parent_version;',
      '}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Element.cpp',
    before: '\tif (parent != _parent)\n\t\t++element_topology_version;',
    after: '\tif (parent != _parent)\n\t\t++element_parent_version;\n' +
      '\tif (parent != _parent)\n\t\t++element_topology_version;',
  },
  {
    file: 'Include/RmlUi/Core/Element.h',
    before: '\tstatic std::uint64_t GetParentVersionForBinding();',
    after: [
      '\tstatic std::uint64_t GetParentVersionForBinding();',
      '\t// sfml.js: native-only notices, never a host callback.',
      '\tstatic void SetOwnershipCallbackForBinding(',
      '\t\tvoid (*callback)(Element*, bool destroyed));',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Element.cpp',
    before: 'std::uint64_t element_parent_version = 0;',
    after: [
      'std::uint64_t element_parent_version = 0;',
      'void (*element_ownership_callback)(Element*, bool) = nullptr;',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Element.cpp',
    before: 'std::uint64_t Element::GetParentVersionForBinding()',
    after: [
      'void Element::SetOwnershipCallbackForBinding(',
      '\tvoid (*callback)(Element*, bool))',
      '{',
      '\telement_ownership_callback = callback;',
      '}',
      '',
      'std::uint64_t Element::GetParentVersionForBinding()',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Element.cpp',
    before: 'Element::~Element()\n{\n\t++element_topology_version;',
    after: [
      'Element::~Element()',
      '{',
      '\t++element_topology_version;',
      '\tif (element_ownership_callback)',
      '\t\telement_ownership_callback(this, true);',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Element.cpp',
    before: 'void Element::SetParent(Element* _parent)\n{',
    after: [
      'void Element::SetParent(Element* _parent)',
      '{',
      '\tconst bool ownership_changed = parent != _parent;',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Element.cpp',
    before: '\n}\n\nvoid Element::DirtyAbsoluteOffset()',
    after: [
      '\n\tif (ownership_changed && element_ownership_callback)',
      '\t\telement_ownership_callback(this, false);',
      '}',
      '',
      'void Element::DirtyAbsoluteOffset()',
    ].join('\n'),
  },
  {
    file: 'Source/Core/DataView.h',
    before: '\tDataView(Element* element, int sort_offset);',
    after: [
      '\tDataView(Element* element, int sort_offset);',
      '\t// sfml.js: an observing relay preserves the delegated cached order.',
      '\tvoid SetSortOrderForBinding(int order) { sort_order = order; }',
    ].join('\n'),
  },
  {
    file: 'Source/Core/DataView.h',
    before: '\tvirtual bool Update(DataModel& model) = 0;',
    after: [
      '\tvirtual bool Update(DataModel& model) = 0;',
      '',
      '\t// sfml.js: explicit groups only; legacy views remain per-instance.',
      '\tvirtual const void* GetBatchKeyForBinding() const { return nullptr; }',
      '\tvirtual bool UpdateBatchForBinding(DataModel& model, ' +
        'DataView* const* batch, size_t count)',
      '\t{',
      '\t\tbool result = false;',
      '\t\tfor (size_t i = 0; i < count; ++i)',
      '\t\t\tif (batch[i]->IsValid())',
      '\t\t\t\tresult |= batch[i]->Update(model);',
      '\t\treturn result;',
      '\t}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/DataView.h',
    before: '\tvoid OnElementRemove(Element* element);',
    after: '\tvoid OnElementRemove(Element* element);\n' +
      '\tvoid RemoveForBinding(const Vector<DataView*>& removed);',
  },
  {
    file: 'Source/Core/DataView.cpp',
    before: 'bool DataViews::Update(DataModel& model, ' +
      'const DirtyVariables& dirty_variables)',
    after: [
      'void DataViews::RemoveForBinding(const Vector<DataView*>& removed)',
      '{',
      '\tconst UnorderedSet<DataView*> targets' +
        '(removed.begin(), removed.end());',
      '\tfor (auto* list : {&views, &views_to_add})',
      '\t{',
      '\t\tauto end = std::remove_if(list->begin(), list->end(), ' +
        '[&](DataViewPtr& view) {',
      '\t\t\tif (targets.count(view.get()))',
      '\t\t\t{',
      '\t\t\t\tviews_to_remove.push_back(std::move(view));',
      '\t\t\t\treturn true;',
      '\t\t\t}',
      '\t\t\treturn false;',
      '\t\t});',
      '\t\tlist->erase(end, list->end());',
      '\t}',
      '}',
      '',
      'bool DataViews::Update(DataModel& model, ' +
        'const DirtyVariables& dirty_variables)',
    ].join('\n'),
  },
  {
    file: 'Source/Core/DataView.cpp',
    before: [
      '\t\t\tfor (const auto& view : views_to_remove)',
      '\t\t\t{',
      '\t\t\t\tfor (auto it = name_view_map.begin(); ' +
        'it != name_view_map.end();)',
      '\t\t\t\t{',
      '\t\t\t\t\tif (it->second == view.get())',
      '\t\t\t\t\t\tit = name_view_map.erase(it);',
      '\t\t\t\t\telse',
      '\t\t\t\t\t\t++it;',
      '\t\t\t\t}',
      '\t\t\t}',
    ].join('\n'),
    after: [
      '\t\t\tUnorderedSet<DataView*> removed;',
      '\t\t\tfor (const auto& view : views_to_remove)',
      '\t\t\t\tremoved.insert(view.get());',
      '\t\t\tfor (auto it = name_view_map.begin(); ' +
        'it != name_view_map.end();)',
      '\t\t\t{',
      '\t\t\t\tif (removed.count(it->second))',
      '\t\t\t\t\tit = name_view_map.erase(it);',
      '\t\t\t\telse',
      '\t\t\t\t\t++it;',
      '\t\t\t}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/DataModel.h',
    before: '\tvoid AddView(DataViewPtr view);',
    after: '\tvoid AddView(DataViewPtr view);\n' +
      '\tvoid RemoveViewsForBinding(const Vector<DataView*>& removed);',
  },
  {
    file: 'Source/Core/DataView.h',
    before: '\tusing NameViewMap = UnorderedMultimap<String, DataView*>;',
    after: [
      '\t// sfml.js: avoid duplicate-key insertion scans.',
      '\tusing NameViewMap = UnorderedMap<String, Vector<DataView*>>;',
    ].join('\n'),
  },
  {
    file: 'Source/Core/DataView.cpp',
    before: '\t\t\t\t\tname_view_map.emplace(variable_name, view.get());',
    after: '\t\t\t\t\tname_view_map[variable_name].push_back(view.get());',
  },
  {
    file: 'Source/Core/DataView.cpp',
    before: [
      '\t\t\tauto pair = name_view_map.equal_range(variable_name);',
      '\t\t\tfor (auto it = pair.first; it != pair.second; ++it)',
      '\t\t\t\tdirty_views.push_back(it->second);',
    ].join('\n'),
    after: [
      '\t\t\tauto found = name_view_map.find(variable_name);',
      '\t\t\tif (found != name_view_map.end())',
      '\t\t\t\tdirty_views.insert(dirty_views.end(),',
      '\t\t\t\t\tfound->second.begin(), found->second.end());',
    ].join('\n'),
  },
  {
    file: 'Source/Core/DataView.cpp',
    before: [
      '\t\t\tfor (auto it = name_view_map.begin(); ' +
        'it != name_view_map.end();)',
      '\t\t\t{',
      '\t\t\t\tif (removed.count(it->second))',
      '\t\t\t\t\tit = name_view_map.erase(it);',
      '\t\t\t\telse',
      '\t\t\t\t\t++it;',
      '\t\t\t}',
    ].join('\n'),
    after: [
      '\t\t\tfor (auto it = name_view_map.begin(); ' +
        'it != name_view_map.end();)',
      '\t\t\t{',
      '\t\t\t\tauto& dependents = it->second;',
      '\t\t\t\tdependents.erase(std::remove_if(dependents.begin(),',
      '\t\t\t\t\tdependents.end(), [&](DataView* view) {',
      '\t\t\t\t\t\treturn removed.count(view) != 0;',
      '\t\t\t\t\t}), dependents.end());',
      '\t\t\t\tif (dependents.empty())',
      '\t\t\t\t\tit = name_view_map.erase(it);',
      '\t\t\t\telse',
      '\t\t\t\t\t++it;',
      '\t\t\t}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/DataModel.cpp',
    before: 'void DataModel::AddView(DataViewPtr view)',
    after: [
      'void DataModel::RemoveViewsForBinding(const Vector<DataView*>& removed)',
      '{',
      '\tviews->RemoveForBinding(removed);',
      '}',
      '',
      'void DataModel::AddView(DataViewPtr view)',
    ].join('\n'),
  },
  {
    file: 'Source/Core/DataView.cpp',
    before: [
      '\t\tfor (DataView* view : dirty_views)',
      '\t\t{',
      '\t\t\tRMLUI_ASSERT(view);',
      '\t\t\tif (!view)',
      '\t\t\t\tcontinue;',
      '',
      '\t\t\tif (view->IsValid())',
      '\t\t\t\tresult |= view->Update(model);',
      '\t\t}',
    ].join('\n'),
    after: [
      '\t\tfor (size_t index = 0; index < dirty_views.size();)',
      '\t\t{',
      '\t\t\tDataView* view = dirty_views[index];',
      '\t\t\tRMLUI_ASSERT(view);',
      '\t\t\tif (!view || !view->IsValid())',
      '\t\t\t{',
      '\t\t\t\t++index;',
      '\t\t\t\tcontinue;',
      '\t\t\t}',
      '\t\t\tconst void* key = view->GetBatchKeyForBinding();',
      '\t\t\tsize_t end = index + 1;',
      '\t\t\tif (key)',
      '\t\t\t{',
      '\t\t\t\twhile (end < dirty_views.size() && dirty_views[end] &&',
      '\t\t\t\t\tdirty_views[end]->GetBatchKeyForBinding() == key &&',
      '\t\t\t\t\tdirty_views[end]->GetSortOrder() == view->GetSortOrder())',
      '\t\t\t\t\t++end;',
      '\t\t\t\tresult |= view->UpdateBatchForBinding(model, ' +
        'dirty_views.data() + index, end - index);',
      '\t\t\t}',
      '\t\t\telse',
      '\t\t\t\tresult |= view->Update(model);',
      '\t\t\tindex = end;',
      '\t\t}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Factory.cpp',
    before: 'void Factory::RegisterDataViewInstancer(',
    after: [
      '// sfml.js: inspect the actual registry before retaining host closures.',
      'bool SfmlJsHasDataViewInstancer(const String& name)',
      '{',
      '\treturn factory_data->data_view_instancers.count(name) != 0;',
      '}',
      'bool SfmlJsHasDataControllerInstancer(const String& name)',
      '{',
      '\treturn factory_data->data_controller_instancers.count(name) != 0;',
      '}',
      '',
      'void Factory::RegisterDataViewInstancer(',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/DataTypeRegister.h',
    before: '\tbool Call(const String& name, const VariantList& arguments, ' +
      'Variant& out_result) const;',
    after: [
      '\tbool Call(const String& name, const VariantList& arguments, ' +
        'Variant& out_result) const;',
      '\t// sfml.js: rejected registrations must not retain host callbacks.',
      '\tbool Contains(const String& name) const',
      '\t{',
      '\t\treturn transform_functions.count(name) != 0;',
      '\t}',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/DataModelHandle.h',
    before: '\t\tRMLUICORE_API static const ' +
      'UnorderedMap<String, DataVariable>& ' +
      'GetAllVariables(const DataModelConstructor& data_model_constructor);',
    after: [
      '\t\tRMLUICORE_API static const UnorderedMap<String, DataVariable>& ' +
        'GetAllVariables(const DataModelConstructor& data_model_constructor);',
      '\t\t// sfml.js: package-internal access for checked model leases.',
      '\t\tstatic DataModel* GetModel(const DataModelConstructor& constructor)',
      '\t\t{',
      '\t\t\treturn constructor.model;',
      '\t\t}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Context.cpp',
    before: '#include <limits>',
    after: '#include <limits>\n#include <stdexcept>',
  },
  {
    file: 'Source/Core/Context.cpp',
    before: '\troot = Factory::InstanceElement(nullptr, "*", "#root", ' +
      'XMLAttributes());\n\troot->SetId(name);',
    after: [
      '\troot = Factory::InstanceElement(nullptr, "*", "#root", ' +
        'XMLAttributes());',
      '\t// sfml.js: failed instancing must unwind the partial constructor.',
      '\tif (!root)',
      '\t\tthrow std::runtime_error(' +
        '"Cannot construct RmlUi context: root element instancer failed");',
      '\troot->SetId(name);',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Context.cpp',
    before: '\tRMLUI_ASSERT(cursor_proxy_document);\n' +
      '\tcursor_proxy_document->context = this;',
    after: [
      '\t// sfml.js: a disabled or custom body instancer may not be ' +
        'a document.',
      '\tif (!cursor_proxy_document)',
      '\t\tthrow std::runtime_error(' +
        '"Cannot construct RmlUi context: body instancer must return ' +
        'an ElementDocument");',
      '\tcursor_proxy_document->context = this;',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/Stream.h',
    before: '\tvirtual size_t Read(void* buffer, size_t bytes) const = 0;',
    after: [
      '\tvirtual size_t Read(void* buffer, size_t bytes) const = 0;',
      '\t// sfml.js: distinguish callback failure from ordinary EOF.',
      '\tvirtual bool HasReadError() const { return false; }',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Factory.cpp',
    before: '\tXMLParser parser(element.get());\n\tparser.Parse(stream);\n' +
      '\n\treturn element;',
    after: [
      '\tXMLParser parser(element.get());',
      '\tparser.Parse(stream);',
      '\t// sfml.js: failed host streams must not dispatch document load.',
      '\tif (stream->HasReadError())',
      '\t\treturn nullptr;',
      '',
      '\treturn element;',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/Tween.h',
    before: '\tTween(CallbackFnc callback, Direction direction = In);',
    after: [
      '\tTween(CallbackFnc callback, Direction direction = In);',
      '',
      '\t// sfml.js: owned callback extension for managed host languages.',
      '\tstruct OwnedCallback {',
      '\t\tvirtual ~OwnedCallback() = default;',
      '\t\tvirtual float Evaluate(float t) const = 0;',
      '\t\tvirtual const void* Identity() const = 0;',
      '\t};',
      '\tTween(SharedPtr<OwnedCallback> owner, Direction direction = In);',
      '\tSharedPtr<OwnedCallback> GetCallbackOwner() const;',
      '\tvoid SetCallbackOwner(SharedPtr<OwnedCallback> owner);',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/Tween.h',
    before: '\tCallbackFnc callback = nullptr;',
    after: '\tCallbackFnc callback = nullptr;\n' +
      '\tSharedPtr<OwnedCallback> callback_owner;',
  },
  {
    file: 'Source/Core/Tween.cpp',
    before: 'float Tween::operator()(float t) const\n',
    after: [
      'Tween::Tween(SharedPtr<OwnedCallback> owner, Direction direction) :',
      '\tTween(CallbackFnc(nullptr), direction)',
      '{',
      '\tcallback_owner = std::move(owner);',
      '}',
      'SharedPtr<Tween::OwnedCallback> Tween::GetCallbackOwner() const',
      '{',
      '\treturn callback_owner;',
      '}',
      'void Tween::SetCallbackOwner(SharedPtr<OwnedCallback> owner)',
      '{',
      '\tcallback_owner = std::move(owner);',
      '}',
      'float Tween::operator()(float t) const',
      '',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Tween.cpp',
    before: '\treturn type_in == other.type_in && type_out == ' +
      'other.type_out && callback == other.callback;',
    after: [
      '\tconst void* identity = callback_owner ? ' +
        'callback_owner->Identity() : nullptr;',
      '\tconst void* other_identity = other.callback_owner ? ' +
        'other.callback_owner->Identity() : nullptr;',
      '\treturn type_in == other.type_in && type_out == other.type_out &&',
      '\t\tcallback == other.callback && identity == other_identity;',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Tween.cpp',
    before: '\tcase Callback:\n\t\tif (callback)',
    after: '\tcase Callback:\n\t\tif (callback_owner)\n' +
      '\t\t\treturn callback_owner->Evaluate(t);\n\t\tif (callback)',
  },
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: '\troot->MergeHierarchy(' +
      'other_sheet.root.get(), specificity_offset);',
    after: [
      '\t// sfml.js: previously matched nodes and named decorators may change.',
      '\tnode_cache.clear();',
      '\tdecorator_cache.clear();',
      '\troot->MergeHierarchy(other_sheet.root.get(), specificity_offset);',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/StyleSheetContainer.h',
    before: '\tStyleSheet* GetCompiledStyleSheet();',
    after: [
      '\tStyleSheet* GetCompiledStyleSheet();',
      '',
      '\t// sfml.js: detect every rebuild, including shared media-block reuse.',
      '\tuint64_t GetCompiledStyleSheetRevision() const { ' +
        'return compiled_style_sheet_revision; }',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/StyleSheet.h',
    before: '\t~StyleSheet();',
    after: [
      '\t~StyleSheet();',
      '',
      '\t// sfml.js: release cached resources before their manager dies.',
      '\tstatic void ReleaseDecorators(RenderManager& render_manager);',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/StyleSheet.h',
    before: '\tmutable DecoratorCache decorator_cache;',
    after: '\tmutable UnorderedMap<RenderManager*, DecoratorCache> ' +
      'decorator_cache;',
  },
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: '#include <algorithm>',
    after: '#include <algorithm>\n#include <unordered_set>',
  },
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: 'StyleSheet::StyleSheet()\n{\n' +
      '\troot = MakeUnique<StyleSheetNode>();\n\tspecificity_offset = 0;\n}',
    after: [
      '// sfml.js: non-owning registry for manager-affine cache cleanup.',
      'static std::unordered_set<StyleSheet*> live_style_sheets;',
      '',
      'StyleSheet::StyleSheet()',
      '{',
      '\troot = MakeUnique<StyleSheetNode>();',
      '\tspecificity_offset = 0;',
      '\tlive_style_sheets.insert(this);',
      '}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: 'StyleSheet::~StyleSheet() {}',
    after: [
      'StyleSheet::~StyleSheet() { live_style_sheets.erase(this); }',
      '',
      'void StyleSheet::ReleaseDecorators(RenderManager& render_manager)',
      '{',
      '\tfor (StyleSheet* sheet : live_style_sheets)',
      '\t\tsheet->decorator_cache.erase(&render_manager);',
      '}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: '\tRMLUI_ASSERT_NONRECURSIVE; // Since we may return a ' +
      'reference to the below static variable.\n' +
      '\tstatic DecoratorPtrList non_cached_decorator_list;',
    after: [
      '\tRMLUI_ASSERT_NONRECURSIVE;',
      '\t// sfml.js: all instances, including scratch results, have affinity.',
      '\tauto& manager_cache = decorator_cache[&render_manager];',
      '\tauto& non_cached_decorator_list = manager_cache[String()];',
    ].join('\n'),
  },
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: '\t\tauto it_cache = decorator_cache.find(key);\n' +
      '\t\tif (it_cache != decorator_cache.end())',
    after: '\t\tauto it_cache = manager_cache.find(key);\n' +
      '\t\tif (it_cache != manager_cache.end())',
  },
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: '\tDecoratorPtrList& decorators = enable_cache ? ' +
      'decorator_cache[key] : non_cached_decorator_list;',
    after: '\tDecoratorPtrList& decorators = enable_cache ? ' +
      'manager_cache[key] : non_cached_decorator_list;',
  },
  {
    file: 'Source/Core/RenderManager.cpp',
    before: '#include "../../Include/RmlUi/Core/RenderInterface.h"',
    after: '#include "../../Include/RmlUi/Core/RenderInterface.h"\n' +
      '#include "../../Include/RmlUi/Core/StyleSheet.h"',
  },
  {
    file: 'Source/Core/RenderManager.cpp',
    before: 'RenderManager::~RenderManager()\n{',
    after: 'RenderManager::~RenderManager()\n{\n' +
      '\tStyleSheet::ReleaseDecorators(*this);',
  },
  {
    file: 'Include/RmlUi/Core/StyleSheetContainer.h',
    before: '\tStyleSheet* compiled_style_sheet = nullptr;',
    after: '\tuint64_t compiled_style_sheet_revision = 0;\n' +
      '\tStyleSheet* compiled_style_sheet = nullptr;',
  },
  {
    file: 'Source/Core/StyleSheetContainer.cpp',
    before: '\tif (style_sheet_changed)\n\t{\n',
    after: '\tif (style_sheet_changed)\n\t{\n' +
      '\t\t++compiled_style_sheet_revision;\n',
  },
  {
    file: 'Include/RmlUi/Core/StyleSheet.h',
    before: '\tstatic void ReleaseDecorators(RenderManager& render_manager);',
    after: '\tstatic void ReleaseDecorators(RenderManager& render_manager);\n' +
      '\t// sfml.js: snapshot native cache ownership for managed callbacks.\n' +
      '\tvoid AppendCachedDecorators(DecoratorPtrList& result) const;',
  },
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: 'UniquePtr<StyleSheet> StyleSheet::CombineStyleSheet(',
    after: [
      'void StyleSheet::AppendCachedDecorators(DecoratorPtrList& result) const',
      '{',
      '\tfor (const auto& manager_entry : decorator_cache)',
      '\t\tfor (const auto& entry : manager_entry.second)',
      '\t\t\tresult.insert(result.end(), entry.second.begin(), ' +
        'entry.second.end());',
      '}',
      '',
      'UniquePtr<StyleSheet> StyleSheet::CombineStyleSheet(',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/StyleSheetContainer.h',
    before: '\tvirtual ~StyleSheetContainer();',
    after: '\tvirtual ~StyleSheetContainer();\n' +
      '\t// sfml.js: include inactive media blocks and combined caches.\n' +
      '\tvoid AppendCachedDecorators(' +
        'Vector<SharedPtr<const Decorator>>& result) const;',
  },
  {
    file: 'Source/Core/StyleSheetContainer.cpp',
    before: 'StyleSheet* StyleSheetContainer::GetCompiledStyleSheet()',
    after: [
      'void StyleSheetContainer::AppendCachedDecorators(' +
        'Vector<SharedPtr<const Decorator>>& result) const',
      '{',
      '\tfor (const auto& block : media_blocks)',
      '\t\tblock.stylesheet->AppendCachedDecorators(result);',
      '\tif (combined_compiled_style_sheet)',
      '\t\tcombined_compiled_style_sheet->AppendCachedDecorators(result);',
      '}',
      '',
      'StyleSheet* StyleSheetContainer::GetCompiledStyleSheet()',
    ].join('\n'),
  },
  {
    file: 'Source/Core/StyleSheetFactory.h',
    before: '\tstatic void ClearStyleSheetCache();',
    after: '\tstatic void ClearStyleSheetCache();\n' +
      '\t// sfml.js: factory caches are native roots for managed callbacks.\n' +
      '\tstatic void AppendCachedDecorators(' +
        'Vector<SharedPtr<const Decorator>>& result);',
  },
  {
    file: 'Source/Core/StyleSheetFactory.cpp',
    before: 'void StyleSheetFactory::ClearStyleSheetCache()',
    after: [
      'void StyleSheetFactory::AppendCachedDecorators(' +
        'Vector<SharedPtr<const Decorator>>& result)',
      '{',
      '\tif (instance)',
      '\t\tfor (const auto& entry : instance->stylesheets)',
      '\t\t\tentry.second->AppendCachedDecorators(result);',
      '}',
      '',
      'void StyleSheetFactory::ClearStyleSheetCache()',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/ElementDocument.h',
    before: '\tconst StyleSheetContainer* GetStyleSheetContainer() const;',
    after: [
      '\tconst StyleSheetContainer* GetStyleSheetContainer() const;',
      '',
      '\t// sfml.js: retain the same native owner for checked host views.',
      '\tSharedPtr<StyleSheetContainer> GetStyleSheetContainerShared() const ' +
        '{ return style_sheet_container; }',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/ElementDocument.h',
    before: '\tSharedPtr<StyleSheetContainer> style_sheet_container;',
    after: '\tSharedPtr<StyleSheetContainer> style_sheet_container;\n' +
      '\tuint64_t style_sheet_revision = 0;',
  },
  {
    file: 'Source/Core/ElementDocument.cpp',
    before: '\tstyle_sheet_container = std::move(_style_sheet_container);\n\n' +
      '\tDirtyMediaQueries();',
    after: [
      '\tstyle_sheet_container = std::move(_style_sheet_container);',
      '\tstyle_sheet_revision = 0;',
      '\tDirtyMediaQueries();',
      '\t// sfml.js: clearing a sheet also clears descendants\' definitions.',
      '\tif (!style_sheet_container)',
      '\t{',
      '\t\tDirtyDefinition(Element::DirtyNodes::Self);',
      '\t\tOnStyleSheetChangeRecursive();',
      '\t}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/ElementDocument.cpp',
    before: '\t\tconst bool changed_style_sheet = ' +
      'style_sheet_container->UpdateCompiledStyleSheet(context);',
    after: [
      '\t\tstyle_sheet_container->UpdateCompiledStyleSheet(context);',
      '\t\t// sfml.js: another document may have compiled the shared sheet.',
      '\t\tconst auto revision = ' +
        'style_sheet_container->GetCompiledStyleSheetRevision();',
      '\t\tconst bool changed_style_sheet = style_sheet_revision != revision;',
      '\t\tstyle_sheet_revision = revision;',
    ].join('\n'),
  },
];

// Snapshot native property owners without recomputing styles or calling JS.
// The binding installs GC-visible edges only after every snapshot is complete.
edits.push(
  {
    file: 'Source/Core/StyleSheetFactory.h',
    before: 'namespace Rml {\n',
    after: 'namespace Rml {\n\nclass PropertyDictionary;\n',
  },
  {
    file: 'Source/Core/StyleSheetNode.h',
    before: '\tconst PropertyDictionary& GetProperties() const;',
    after: '\tconst PropertyDictionary& GetProperties() const;\n' +
      '\tconst StyleSheetNodeList& GetChildren() const { return children; }',
  },
  ...[
    [ 'Include/RmlUi/Core/StyleSheet.h', 'StyleSheet',
      '\tvoid BuildNodeIndex();' ],
    [ 'Include/RmlUi/Core/StyleSheetContainer.h', 'StyleSheetContainer',
      '\tStyleSheetContainer();' ],
    [ 'Source/Core/StyleSheetFactory.h', 'StyleSheetFactory',
      '\tstatic StructuralSelector GetSelector(const String& name);' ],
    [ 'Source/Core/ElementStyle.h', 'ElementStyle',
      '\tvoid UpdateDefinition();' ],
  ].map(([ file, type, before ]) => ({
    file,
    before,
    after: before +
      '\n\t// sfml.js: immutable managed-callback snapshots.\n\t' +
      (type === 'StyleSheetFactory' ? 'static ' : '') +
      'void AppendCallbackProperties(Vector<PropertyDictionary>& result)' +
      (type === 'StyleSheetFactory' ? ';' : ' const;'),
  })),
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: 'void StyleSheet::BuildNodeIndex()\n',
    after: [
      'void StyleSheet::AppendCallbackProperties(' +
        'Vector<PropertyDictionary>& result) const',
      '{',
      '\tVector<const StyleSheetNode*> nodes{root.get()};',
      '\twhile (!nodes.empty())',
      '\t{',
      '\t\tconst auto* node = nodes.back();',
      '\t\tnodes.pop_back();',
      '\t\tresult.push_back(node->GetProperties());',
      '\t\tfor (const auto& child : node->GetChildren())',
      '\t\t\tnodes.push_back(child.get());',
      '\t}',
      '\tfor (const auto& entry : node_cache)',
      '\t\tif (entry.second)',
      '\t\t\tresult.push_back(entry.second->GetProperties());',
      '\tfor (const auto& entry : named_decorator_map)',
      '\t\tresult.push_back(entry.second.properties);',
      '\tfor (const auto& entry : keyframes)',
      '\t\tfor (const auto& block : entry.second.blocks)',
      '\t\t\tresult.push_back(block.properties);',
      '}',
      '',
      'void StyleSheet::BuildNodeIndex()',
      '',
    ].join('\n'),
  },
  {
    file: 'Source/Core/StyleSheetContainer.cpp',
    before: '} // namespace Rml',
    after: [
      'void StyleSheetContainer::AppendCallbackProperties(' +
        'Vector<PropertyDictionary>& result) const',
      '{',
      '\tfor (const auto& block : media_blocks)',
      '\t{',
      '\t\tresult.push_back(block.properties);',
      '\t\tblock.stylesheet->AppendCallbackProperties(result);',
      '\t}',
      '\tif (combined_compiled_style_sheet)',
      '\t\tcombined_compiled_style_sheet->AppendCallbackProperties(result);',
      '}',
      '',
      '} // namespace Rml',
    ].join('\n'),
  },
  {
    file: 'Source/Core/StyleSheetFactory.cpp',
    before: '} // namespace Rml',
    after: [
      'void StyleSheetFactory::AppendCallbackProperties(' +
        'Vector<PropertyDictionary>& result)',
      '{',
      '\tif (instance)',
      '\t\tfor (const auto& entry : instance->stylesheets)',
      '\t\t\tentry.second->AppendCallbackProperties(result);',
      '}',
      '',
      '} // namespace Rml',
    ].join('\n'),
  },
  {
    file: 'Source/Core/ElementStyle.cpp',
    before: 'void ElementStyle::UpdateDefinition()',
    after: [
      'void ElementStyle::AppendCallbackProperties(' +
        'Vector<PropertyDictionary>& result) const',
      '{',
      '\tresult.push_back(inline_properties);',
      '\tresult.push_back(expanded_shorthands);',
      '\tif (definition)',
      '\t\tresult.push_back(definition->GetProperties());',
      '}',
      '',
      'void ElementStyle::UpdateDefinition()',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/Context.h',
    before: '\tElement* GetRootElement();',
    after: '\tElement* GetRootElement();\n' +
      '\t// sfml.js: includes cursor and pending document destruction.\n' +
      '\tvoid AppendOwnedElementRoots(Vector<Element*>& result) const;',
  },
  {
    file: 'Source/Core/Context.cpp',
    before: 'Element* Context::GetRootElement()\n',
    after: [
      'void Context::AppendOwnedElementRoots(Vector<Element*>& result) const',
      '{',
      '\tif (root)',
      '\t\tresult.push_back(root.get());',
      '\tif (cursor_proxy)',
      '\t\tresult.push_back(cursor_proxy.get());',
      '\tfor (const auto& document : unloaded_documents)',
      '\t\tresult.push_back(document.get());',
      '}',
      '',
      'Element* Context::GetRootElement()',
      '',
    ].join('\n'),
  },
  {
    file: 'Source/Core/FontEngineDefault/FontFaceLayer.h',
    before: '\t~FontFaceLayer();',
    after: '\t~FontFaceLayer();\n' +
      '\t// sfml.js: snapshot effects retained by live native font layers.\n' +
      '\tstatic void AppendFontEffects(' +
      'Vector<SharedPtr<const FontEffect>>& result);',
  },
  {
    file: 'Source/Core/FontEngineDefault/FontFaceLayer.cpp',
    before: 'namespace Rml {\n',
    after: [
      '#include <unordered_set>',
      '',
      'namespace Rml {',
      'namespace {',
      'std::unordered_set<const FontFaceLayer*>& LiveFontLayers()',
      '{',
      '\tstatic std::unordered_set<const FontFaceLayer*> layers;',
      '\treturn layers;',
      '}',
      '}',
      '',
      'void FontFaceLayer::AppendFontEffects(' +
        'Vector<SharedPtr<const FontEffect>>& result)',
      '{',
      '\tfor (const auto* layer : LiveFontLayers())',
      '\t\tif (layer->effect)',
      '\t\t\tresult.push_back(layer->effect);',
      '}',
      '',
    ].join('\n'),
  },
  {
    file: 'Source/Core/FontEngineDefault/FontFaceLayer.cpp',
    before: '\teffect = _effect;',
    after: '\tLiveFontLayers().insert(this);\n\teffect = _effect;',
  },
  {
    file: 'Source/Core/FontEngineDefault/FontFaceLayer.cpp',
    before: 'FontFaceLayer::~FontFaceLayer() {}',
    after: 'FontFaceLayer::~FontFaceLayer() { LiveFontLayers().erase(this); }',
  },
  {
    file: 'Source/Core/FontEngineDefault/FontFaceLayer.cpp',
    before: '#include "FontFaceLayer.h"',
    after: '#include "FontFaceLayer.h"\n' +
      '#include "../../../Include/RmlUi/Core/PropertyDictionary.h"',
  },
  {
    file: 'Source/Core/FontEngineDefault/FontFaceLayer.cpp',
    before: '\teffect = _effect;',
    after: '\teffect = _effect;\n\tif (effect)\n' +
      '\t\tInvalidateCallbackResourcesForBinding();',
  },
  {
    file: 'Source/Core/FontEngineDefault/FontFaceLayer.cpp',
    before: 'FontFaceLayer::~FontFaceLayer() { LiveFontLayers().erase(this); }',
    after: [
      'FontFaceLayer::~FontFaceLayer()',
      '{',
      '\tif (effect) InvalidateCallbackResourcesForBinding();',
      '\tLiveFontLayers().erase(this);',
      '}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: 'StyleSheet::~StyleSheet() { live_style_sheets.erase(this); }',
    after: [
      'StyleSheet::~StyleSheet()',
      '{',
      '\tInvalidateCallbackResourcesForBinding();',
      '\tlive_style_sheets.erase(this);',
      '}',
    ].join('\n'),
  },
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: 'void StyleSheet::ReleaseDecorators(' +
      'RenderManager& render_manager)\n{',
    after: 'void StyleSheet::ReleaseDecorators(' +
      'RenderManager& render_manager)\n' +
      '{\n\tInvalidateCallbackResourcesForBinding();',
  },
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: '\t// sfml.js: previously matched nodes and ' +
      'named decorators may change.',
    after: '\tInvalidateCallbackResourcesForBinding();\n' +
      '\t// sfml.js: previously matched nodes and named decorators may change.',
  },
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: '\t\tnon_cached_decorator_list.clear();',
    after: '\t\tif (!non_cached_decorator_list.empty())\n' +
      '\t\t\tInvalidateCallbackResourcesForBinding();\n' +
      '\t\tnon_cached_decorator_list.clear();',
  },
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: '\t\t\tdecorators.clear();',
    after: '\t\t\tInvalidateCallbackResourcesForBinding();\n' +
      '\t\t\tdecorators.clear();',
  },
  {
    file: 'Source/Core/StyleSheet.cpp',
    before: '\t\tdecorators.push_back(std::move(decorator));',
    after: '\t\tInvalidateCallbackResourcesForBinding();\n' +
      '\t\tdecorators.push_back(std::move(decorator));',
  },
  {
    file: 'Source/Core/StyleSheetContainer.cpp',
    before: '\t\t++compiled_style_sheet_revision;',
    after: '\t\t++compiled_style_sheet_revision;\n' +
      '\t\tInvalidateCallbackResourcesForBinding();',
  },
  {
    file: 'Source/Core/ElementDocument.cpp',
    before: '\tstyle_sheet_container = std::move(_style_sheet_container);',
    after: '\tInvalidateCallbackResourcesForBinding();\n' +
      '\tstyle_sheet_container = std::move(_style_sheet_container);',
  },
  ...[
    [
      'Source/Core/ElementStyle.cpp',
      '\tresult.push_back(inline_properties);',
      '\tif (inline_properties.HasCallbackResourcesForBinding())\n' +
      '\t\tresult.push_back(inline_properties);',
    ],
    [
      'Source/Core/ElementStyle.cpp',
      '\tresult.push_back(expanded_shorthands);',
      '\tif (expanded_shorthands.HasCallbackResourcesForBinding())\n' +
      '\t\tresult.push_back(expanded_shorthands);',
    ],
    [
      'Source/Core/ElementStyle.cpp',
      '\tif (definition)\n' +
      '\t\tresult.push_back(definition->GetProperties());',
      '\tif (definition && definition->GetProperties().' +
      'HasCallbackResourcesForBinding())\n' +
      '\t\tresult.push_back(definition->GetProperties());',
    ],
    [
      'Source/Core/StyleSheet.cpp',
      '\t\tresult.push_back(node->GetProperties());',
      '\t\tif (node->GetProperties().HasCallbackResourcesForBinding())\n' +
      '\t\t\tresult.push_back(node->GetProperties());',
    ],
    [
      'Source/Core/StyleSheet.cpp',
      '\t\tif (entry.second)\n' +
      '\t\t\tresult.push_back(entry.second->GetProperties());',
      '\t\tif (entry.second && entry.second->GetProperties().' +
      'HasCallbackResourcesForBinding())\n' +
      '\t\t\tresult.push_back(entry.second->GetProperties());',
    ],
    [
      'Source/Core/StyleSheet.cpp',
      '\t\tresult.push_back(entry.second.properties);',
      '\t\tif (entry.second.properties.HasCallbackResourcesForBinding())\n' +
      '\t\t\tresult.push_back(entry.second.properties);',
    ],
    [
      'Source/Core/StyleSheet.cpp',
      '\t\t\tresult.push_back(block.properties);',
      '\t\t\tif (block.properties.HasCallbackResourcesForBinding())\n' +
      '\t\t\t\tresult.push_back(block.properties);',
    ],
    [
      'Source/Core/StyleSheetContainer.cpp',
      '\t\tresult.push_back(block.properties);',
      '\t\tif (block.properties.HasCallbackResourcesForBinding())\n' +
      '\t\t\tresult.push_back(block.properties);',
    ],
  ].map(([ file, before, after ]) => ({ file, before, after }))
);

// Keep numeric Variants at their existing size. Pointer types use inline
// shared lifetime slots; unguarded upstream pointers allocate nothing.
edits.push(
  {
    file: 'Include/RmlUi/Core/Variant.h',
    before: '\tvoid Clear();',
    after: [
      '\tvoid Clear();',
      '\t// Guarded pointers share a target lifetime slot, ' +
        'never its ownership.',
      '\tvoid SetScriptInterfaceForBinding(SharedPtr<ScriptInterface*> guard);',
      '\tbool HasGuardedScriptInterfaceForBinding() const;',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/Variant.h',
    before: '\tType type = NONE;',
    after: [
      '\tstruct ScriptValueForBinding {',
      '\t\tScriptInterface* pointer = nullptr;',
      '\t\tSharedPtr<ScriptInterface*> guard;',
      '\t};',
      '\tType type = NONE;',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Variant.cpp',
    before: '\t// Make sure our object size assumptions fit inside ' +
      'the static buffer',
    after: [
      '\tstatic_assert(sizeof(ScriptValueForBinding) <= LOCAL_DATA_SIZE,',
      '\t\t"Guarded script pointer must preserve Variant inline storage");',
      '\tstatic_assert(alignof(ScriptValueForBinding) <= ' +
        'alignof(TransitionList),',
      '\t\t"Guarded script pointer must preserve Variant alignment");',
      '\t// Make sure our object size assumptions fit inside the static buffer',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Variant.cpp',
    before: '\tcase STRING:\n\t{\n\t\t// Clean up the string.',
    after: [
      '\tcase SCRIPTINTERFACE:',
      '\t\treinterpret_cast<ScriptValueForBinding*>(data)' +
        '->~ScriptValueForBinding();',
      '\t\tbreak;',
      '\tcase STRING:\n\t{\n\t\t// Clean up the string.',
    ].join('\n'),
  },
  ...[ 'copy', 'other' ].map(name => ({
    file: 'Source/Core/Variant.cpp',
    before: `\tswitch (${name}.type)\n\t{`,
    after: [
      `\tswitch (${name}.type)\n\t{`,
      '\tcase SCRIPTINTERFACE:',
      '\t{',
      '\t\tconst auto& source = ' +
        '*reinterpret_cast<const ScriptValueForBinding*>(' +
        `${name}.data);`,
      '\t\tif (source.guard) SetScriptInterfaceForBinding(source.guard);',
      '\t\telse Set(source.pointer);',
      '\t\tbreak;',
      '\t}',
    ].join('\n'),
  })),
  {
    file: 'Source/Core/Variant.cpp',
    before: [
      'void Variant::Set(ScriptInterface* value)',
      '{',
      '\ttype = SCRIPTINTERFACE;',
      '\tmemcpy(data, &value, sizeof(ScriptInterface*));',
      '}',
    ].join('\n'),
    after: [
      'void Variant::Set(ScriptInterface* value)',
      '{',
      '\tif (type != SCRIPTINTERFACE)',
      '\t\tnew (data) ScriptValueForBinding{};',
      '\ttype = SCRIPTINTERFACE;',
      '\tauto& storage = *reinterpret_cast<ScriptValueForBinding*>(data);',
      '\tstorage.pointer = value;',
      '\tstorage.guard.reset();',
      '}',
      '',
      'void Variant::SetScriptInterfaceForBinding(' +
        'SharedPtr<ScriptInterface*> guard)',
      '{',
      '\tif (type != SCRIPTINTERFACE)',
      '\t{',
      '\t\tClear();',
      '\t\tnew (data) ScriptValueForBinding{};',
      '\t}',
      '\ttype = SCRIPTINTERFACE;',
      '\tauto& storage = *reinterpret_cast<ScriptValueForBinding*>(data);',
      '\tstorage.pointer = nullptr;',
      '\tstorage.guard = std::move(guard);',
      '}',
      '',
      'bool Variant::HasGuardedScriptInterfaceForBinding() const',
      '{',
      '\treturn type == SCRIPTINTERFACE &&',
      '\t\tbool(reinterpret_cast<const ScriptValueForBinding*>(data)->guard);',
      '}',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/Variant.inl',
    before: '\t\tcase SCRIPTINTERFACE: return ' +
      'TypeConverter<ScriptInterface*, T>::Convert(' +
      '*reinterpret_cast<ScriptInterface* const*>(data), value);',
    after: [
      '\t\tcase SCRIPTINTERFACE:',
      '\t\t{',
      '\t\t\t// Native pointer formatting must never expose a guarded address.',
      '\t\t\tif constexpr (std::is_same_v<T, String>)',
      '\t\t\t\tif (HasGuardedScriptInterfaceForBinding()) return false;',
      '\t\t\treturn TypeConverter<ScriptInterface*, T>::Convert(',
      '\t\t\t\tGetReference<ScriptInterface*>(), value);',
      '\t\t}',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/Variant.inl',
    before: '\treturn *reinterpret_cast<const T*>(&data);',
    after: [
      '\tif constexpr (std::is_same_v<T, ScriptInterface*>)',
      '\t{',
      '\t\tconst auto& storage = ' +
        '*reinterpret_cast<const ScriptValueForBinding*>(data);',
      '\t\treturn storage.guard ? *storage.guard : storage.pointer;',
      '\t}',
      '\treturn *reinterpret_cast<const T*>(&data);',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Variant.cpp',
    before: '\tcase SCRIPTINTERFACE: return ' +
      'DEFAULT_VARIANT_COMPARE(ScriptInterface*);',
    after: '\tcase SCRIPTINTERFACE: return GetReference<ScriptInterface*>() ' +
      '== other.GetReference<ScriptInterface*>();',
  },
  {
    file: 'Source/Core/PropertyDictionary.cpp',
    before: '\t\tvalue.GetType() == Variant::FILTERSPTR;',
    after: '\t\tvalue.GetType() == Variant::FILTERSPTR ||\n' +
      '\t\tvalue.HasGuardedScriptInterfaceForBinding();',
  }
);

edits.push(
  {
    file: 'Include/RmlUi/Core/Variant.h',
    before: '\tbool HasGuardedScriptInterfaceForBinding() const;',
    after: [
      '\tbool HasGuardedScriptInterfaceForBinding() const;',
      '\t// Opaque host tokens retain a collectible managed object record.',
      '\tvoid SetOpaquePointerForBinding(SharedPtr<void*> guard);',
      '\tbool HasGuardedOpaquePointerForBinding() const;',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/Variant.h',
    before: '\tType type = NONE;',
    after: [
      '\tstruct OpaqueValueForBinding {',
      '\t\tvoid* pointer = nullptr;',
      '\t\tSharedPtr<void*> guard;',
      '\t};',
      '\tType type = NONE;',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Variant.cpp',
    before: '\tstatic_assert(sizeof(ScriptValueForBinding) <= LOCAL_DATA_SIZE,',
    after: [
      '\tstatic_assert(sizeof(OpaqueValueForBinding) <= LOCAL_DATA_SIZE,',
      '\t\t"Guarded opaque pointer must preserve Variant inline storage");',
      '\tstatic_assert(alignof(OpaqueValueForBinding) <= ' +
        'alignof(TransitionList),',
      '\t\t"Guarded opaque pointer must preserve Variant alignment");',
      '\tstatic_assert(sizeof(ScriptValueForBinding) <= LOCAL_DATA_SIZE,',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Variant.cpp',
    before: [
      '\tcase SCRIPTINTERFACE:',
      '\t\treinterpret_cast<ScriptValueForBinding*>(data)' +
        '->~ScriptValueForBinding();',
    ].join('\n'),
    after: [
      '\tcase VOIDPTR:',
      '\t\treinterpret_cast<OpaqueValueForBinding*>(data)' +
        '->~OpaqueValueForBinding();',
      '\t\tbreak;',
      '\tcase SCRIPTINTERFACE:',
      '\t\treinterpret_cast<ScriptValueForBinding*>(data)' +
        '->~ScriptValueForBinding();',
    ].join('\n'),
  },
  ...[ 'copy', 'other' ].map(name => ({
    file: 'Source/Core/Variant.cpp',
    before: `\tswitch (${name}.type)\n\t{`,
    after: [
      `\tswitch (${name}.type)\n\t{`,
      '\tcase VOIDPTR:',
      '\t{',
      '\t\tconst auto& source = ' +
        '*reinterpret_cast<const OpaqueValueForBinding*>(' +
        `${name}.data);`,
      '\t\tif (source.guard)',
      '\t\t\tSetOpaquePointerForBinding(source.guard);',
      '\t\telse',
      '\t\t\tSet(source.pointer);',
      '\t\tbreak;',
      '\t}',
    ].join('\n'),
  })),
  {
    file: 'Source/Core/Variant.cpp',
    before: [
      'void Variant::Set(void* voidptr)',
      '{',
      '\ttype = VOIDPTR;',
      '\tmemcpy(data, &voidptr, sizeof(void*));',
      '}',
    ].join('\n'),
    after: [
      'void Variant::Set(void* voidptr)',
      '{',
      '\tif (type != VOIDPTR)',
      '\t\tnew (data) OpaqueValueForBinding{};',
      '\ttype = VOIDPTR;',
      '',
      '\tauto& storage = *reinterpret_cast<OpaqueValueForBinding*>(data);',
      '\tstorage.pointer = voidptr;',
      '\tstorage.guard.reset();',
      '}',
      '',
      'void Variant::SetOpaquePointerForBinding(SharedPtr<void*> guard)',
      '{',
      '\tif (type != VOIDPTR)',
      '\t{',
      '\t\tClear();',
      '\t\tnew (data) OpaqueValueForBinding{};',
      '\t}',
      '\ttype = VOIDPTR;',
      '',
      '\tauto& storage = *reinterpret_cast<OpaqueValueForBinding*>(data);',
      '\tstorage.pointer = nullptr;',
      '\tstorage.guard = std::move(guard);',
      '}',
      '',
      'bool Variant::HasGuardedOpaquePointerForBinding() const',
      '{',
      '\treturn type == VOIDPTR &&',
      '\t\tbool(reinterpret_cast<const OpaqueValueForBinding*>(data)->guard);',
      '}',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/Variant.inl',
    before: '\t\tcase VOIDPTR: return TypeConverter<void*, T>::Convert(' +
      '*reinterpret_cast<void* const*>(data), value);',
    after: [
      '\t\tcase VOIDPTR:',
      '\t\t{',
      '\t\t\tif constexpr (std::is_same_v<T, String>)',
      '\t\t\t\tif (HasGuardedOpaquePointerForBinding()) return false;',
      '\t\t\treturn TypeConverter<void*, T>::Convert(',
      '\t\t\t\tGetReference<void*>(), value);',
      '\t\t}',
    ].join('\n'),
  },
  {
    file: 'Include/RmlUi/Core/Variant.inl',
    before: '\treturn *reinterpret_cast<const T*>(&data);',
    after: [
      '\tif constexpr (std::is_same_v<T, void*>)',
      '\t{',
      '\t\tconst auto& storage = ' +
        '*reinterpret_cast<const OpaqueValueForBinding*>(data);',
      '\t\treturn storage.guard ? *storage.guard : storage.pointer;',
      '\t}',
      '\treturn *reinterpret_cast<const T*>(&data);',
    ].join('\n'),
  },
  {
    file: 'Source/Core/Variant.cpp',
    before: '\tcase VOIDPTR: return DEFAULT_VARIANT_COMPARE(void*);',
    after: '\tcase VOIDPTR: return GetReference<void*>() ' +
      '== other.GetReference<void*>();',
  },
  {
    file: 'Source/Core/PropertyDictionary.cpp',
    before: '\t\tvalue.HasGuardedScriptInterfaceForBinding();',
    after: '\t\tvalue.HasGuardedScriptInterfaceForBinding() ||\n' +
      '\t\tvalue.HasGuardedOpaquePointerForBinding();',
  }
);

// Preserve upstream notification order while allowing plugin callbacks to
// remove entries or append registrations without invalidating iterators.
edits.push(
  {
    file: 'Source/Core/PluginRegistry.cpp',
    before: '\tVector<Plugin*> data_model;',
    after: [
      '\tVector<Plugin*> data_model;',
      '\tunsigned notification_depth = 0;',
      '\tbool removed = false;',
    ].join('\n'),
  },
  {
    file: 'Source/Core/PluginRegistry.cpp',
    before: 'void PluginRegistry::RegisterPlugin(Plugin* plugin)',
    after: [
      '// Callback edits must not invalidate the active traversal. ' +
        'Removed entries are',
      '// tombstoned until its outermost return; additions start ' +
        'at the next notice.',
      'class PluginNotificationScope {',
      'public:',
      '\tPluginNotificationScope() ' +
        '{ ++plugin_vectors->notification_depth; }',
      '\t~PluginNotificationScope()',
      '\t{',
      '\t\tif (--plugin_vectors->notification_depth == 0 && ' +
        'plugin_vectors->removed)',
      '\t\t{',
      '\t\t\tauto compact = [](Vector<Plugin*>& values) {',
      '\t\t\t\tvalues.erase(std::remove(values.begin(), values.end(), ' +
        'nullptr), values.end());',
      '\t\t\t};',
      '\t\t\tcompact(plugin_vectors->basic);',
      '\t\t\tcompact(plugin_vectors->document);',
      '\t\t\tcompact(plugin_vectors->element);',
      '\t\t\tcompact(plugin_vectors->data_model);',
      '\t\t\tplugin_vectors->removed = false;',
      '\t\t}',
      '\t}',
      '};',
      '',
      'template <typename Callback>',
      'static void NotifyPlugins(Vector<Plugin*>& plugins, Callback callback)',
      '{',
      '\tPluginNotificationScope scope;',
      '\tconst size_t count = plugins.size();',
      '\tfor (size_t i = 0; i < count; ++i)',
      '\t\tif (Plugin* plugin = plugins[i])',
      '\t\t\tcallback(plugin);',
      '}',
      '',
      'void PluginRegistry::RegisterPlugin(Plugin* plugin)',
    ].join('\n'),
  },
  {
    file: 'Source/Core/PluginRegistry.cpp',
    before: [
      '\tauto erase_value = [](Vector<Plugin*>& container, Plugin* value) {',
      '\t\tcontainer.erase(std::remove(container.begin(), container.end(), ' +
        'value), container.end());',
      '\t};',
    ].join('\n'),
    after: [
      '\tauto erase_value = [](Vector<Plugin*>& container, Plugin* value) {',
      '\t\tif (plugin_vectors->notification_depth)',
      '\t\t{',
      '\t\t\tstd::replace(container.begin(), container.end(), value, ' +
        'static_cast<Plugin*>(nullptr));',
      '\t\t\tplugin_vectors->removed = true;',
      '\t\t}',
      '\t\telse',
      '\t\t\tcontainer.erase(std::remove(container.begin(), container.end(), ' +
        'value), container.end());',
      '\t};',
    ].join('\n'),
  },
  ...[
    [ 'basic', 'OnInitialise()', '[]' ],
    [ 'basic', 'OnContextCreate(context)', '[context]' ],
    [ 'basic', 'OnContextDestroy(context)', '[context]' ],
    [ 'document', 'OnDocumentOpen(context, document_path)', '[&]' ],
    [ 'document', 'OnDocumentLoad(document)', '[document]' ],
    [ 'document', 'OnDocumentUnload(document)', '[document]' ],
    [ 'element', 'OnElementCreate(element)', '[element]' ],
    [ 'element', 'OnElementDestroy(element)', '[element]' ],
    [ 'data_model', 'OnDataModelCreate(context, name)', '[&]' ],
    [ 'data_model', 'OnDataModelDestroy(context, name)', '[&]' ],
  ].map(([ category, method, capture ]) => ({
    file: 'Source/Core/PluginRegistry.cpp',
    before: `\tfor (Plugin* plugin : plugin_vectors->${category})\n` +
      `\t\tplugin->${method};`,
    after: `\tNotifyPlugins(plugin_vectors->${category}, ` +
      `${capture}(Plugin* plugin) { plugin->${method}; });`,
  }))
);

// Negation applies to the complete conjunction, independent of property order.
edits.push({
  file: 'Source/Core/StyleSheetContainer.cpp',
  before: '\t\t\tif (all_match != expected_match_value)\n\t\t\t\tbreak;',
  after: '\t\t\t// Negate only after evaluating the full conjunction.\n' +
    '\t\t\tif (!all_match)\n\t\t\t\tbreak;',
});

edits.push(...scriptEdits);
edits.push(...numericEdits);
edits.push(...stringEdits);
edits.push(...textInputEdits);

/**
 * Apply exact, idempotent edits to the pinned RmlUi version.
 * @param {string} root Extracted RmlUi root.
 */
async function patchRmlUi(root) {
  const sources = new Map();
  for (const [ index, edit ] of edits.entries()) {
    const file = path.join(root, edit.file);
    let source = sources.get(file) ?? await fs.readFile(file, 'utf8');
    // Later refinements may change text introduced by an earlier exact edit.
    // Each complete refinement stage is a valid installed version. Accept
    // its exact source, rather than treating a later upgrade as a fresh base.
    let composed = edit.after;
    const installedVersions = [ composed ];
    for (const refinement of edits.slice(index + 1)) {
      if (refinement.file === edit.file &&
          composed.includes(refinement.before)) {
        composed = composed.replace(refinement.before, refinement.after);
        installedVersions.push(composed);
      }
    }

    if (!installedVersions.some(version => source.includes(version))) {
      if (source.split(edit.before).length !== 2) {
        throw new Error(`RmlUi binding patch mismatch: ${edit.file}`);
      }
      source = source.replace(edit.before, edit.after);
    }

    sources.set(file, source);
  }
  // Validate all anchors before writing, and preserve timestamps on no-op runs.
  for (const [ file, source ] of sources) {
    if (await fs.readFile(file, 'utf8') !== source) {
      await fs.writeFile(file, source);
    }
  }
}

module.exports = { patchRmlUi };
