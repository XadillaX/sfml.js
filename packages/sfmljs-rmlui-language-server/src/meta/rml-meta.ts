'use strict';

/**
 * RML knowledge base for RmlUi 6.3.
 *
 * Tag and attribute sets follow the official element index, the form
 * controls chapter and the data binding views/controllers manual.
 */

/** Base URL of the official RML manual. */
export const RML_DOC_BASE = 'https://mikke89.github.io/RmlUiDoc/pages/rml/';

/** Metadata describing one RML element. */
export interface RmlTagMeta {
  /** Tag name without angle brackets. */
  readonly name: string;
  /** Manual description. */
  readonly description: string;
  /** Attributes suggested for the tag, excluding global attributes. */
  readonly attributes: readonly string[];
  /** True for elements without child content that self-close. */
  readonly void?: boolean;
  /** True when the element is provided by an optional plugin. */
  readonly plugin?: boolean;
  /** Manual page filename under RML_DOC_BASE. */
  readonly page: string;
}

/** Metadata describing one attribute name. */
export interface RmlAttributeMeta {
  /** Attribute name. */
  readonly name: string;
  /** Manual description. */
  readonly description: string;
  /** Suggested values when the attribute is enumerated. */
  readonly values?: readonly string[];
}

/** Attributes shared by every RML element. */
export const GLOBAL_ATTRIBUTES: readonly RmlAttributeMeta[] = [
  {
    name: 'id',
    description: 'Unique identifier used for queries and RCSS id selectors.',
  },
  {
    name: 'class',
    description: 'Space-separated class names matched by RCSS class selectors.',
  },
  {
    name: 'style',
    description: 'Semicolon-separated inline RCSS declarations.',
  },
  {
    name: 'title',
    description: 'Tooltip text shown while hovering the element.',
  },
  {
    name: 'data-model',
    description: 'Attaches a registered data model to the element subtree.',
  },
  {
    name: 'data-if',
    description: 'Creates the element when the data expression is true.',
  },
  {
    name: 'data-visible',
    description: 'Toggles visibility from a data expression.',
  },
  {
    name: 'data-for',
    description: 'Repeats the subtree: [it], [it_index] : [address].',
  },
  {
    name: 'data-rml',
    description: 'Replaces inner RML with the evaluated expression.',
  },
  {
    name: 'data-value',
    description: 'Two-way binds a form control value to a data address.',
  },
  {
    name: 'data-checked',
    description: 'Two-way binds a checkbox or radio state.',
  },
  {
    name: 'data-attr-*',
    description: 'Sets the suffixed attribute from a data expression.',
  },
  {
    name: 'data-attrif-*',
    description: 'Sets or removes the suffixed attribute conditionally.',
  },
  {
    name: 'data-class-*',
    description: 'Toggles the suffixed class from a data expression.',
  },
  {
    name: 'data-style-*',
    description: 'Sets the suffixed RCSS property from an expression.',
  },
  {
    name: 'data-alias-*',
    description: 'Declares a named alias for a data address.',
  },
  {
    name: 'data-event-*',
    description: 'Invokes a model function on the suffixed event type.',
  },
];

/** Built-in RML elements registered by RmlUi 6.3. */
export const RML_TAGS: readonly RmlTagMeta[] = [
  {
    name: 'rml',
    description: 'Root element of every RML document.',
    attributes: [],
    page: 'documents.html',
  },
  {
    name: 'head',
    description: 'Document metadata, titles and resource links.',
    attributes: [],
    page: 'documents.html',
  },
  {
    name: 'title',
    description: 'Document title displayed in the window title bar.',
    attributes: [],
    page: 'documents.html',
  },
  {
    name: 'link',
    description: 'Links an external RCSS stylesheet or RML template.',
    void: true,
    attributes: [ 'type', 'href' ],
    page: 'documents.html',
  },
  {
    name: 'style',
    description: 'Inline RCSS stylesheet block.',
    attributes: [],
    page: 'style_sheets.html',
  },
  {
    name: 'body',
    description: 'Visible document content; may declare a template.',
    attributes: [ 'template' ],
    page: 'documents.html',
  },
  {
    name: 'div',
    description: 'Generic block container; display defaults to inline.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'span',
    description: 'Generic inline container.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'p',
    description: 'Paragraph element.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'h1',
    description: 'Top-level section heading.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'h2',
    description: 'Second-level section heading.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'h3',
    description: 'Third-level section heading.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'h4',
    description: 'Fourth-level section heading.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'h5',
    description: 'Fifth-level section heading.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'h6',
    description: 'Sixth-level section heading.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'em',
    description: 'Emphasis text, typically rendered italic.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'strong',
    description: 'Strong importance text, typically rendered bold.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'img',
    description: 'Image sourced from a file url or named sprite.',
    void: true,
    attributes: [ 'src', 'sprite', 'alt' ],
    page: 'images.html',
  },
  {
    name: 'handle',
    description: 'Drag handle used to move the window.',
    attributes: [],
    page: 'controls.html',
  },
  {
    name: 'form',
    description: 'Groups form controls and submits their values.',
    attributes: [ 'name' ],
    page: 'forms.html',
  },
  {
    name: 'input',
    description: 'Form control for text, checks, ranges and buttons.',
    void: true,
    attributes: [
      'type', 'name', 'value', 'checked', 'disabled', 'placeholder',
      'maxlength', 'size', 'min', 'max', 'step',
    ],
    page: 'forms.html',
  },
  {
    name: 'textarea',
    description: 'Multi-line text input control.',
    attributes: [
      'name', 'rows', 'cols', 'maxlength', 'disabled', 'placeholder', 'value',
    ],
    page: 'forms.html',
  },
  {
    name: 'select',
    description: 'Drop-down selection control.',
    attributes: [ 'name', 'value', 'disabled' ],
    page: 'forms.html',
  },
  {
    name: 'option',
    description: 'One selectable option inside a select element.',
    attributes: [ 'value', 'selected' ],
    page: 'forms.html',
  },
  {
    name: 'label',
    description: 'Caption associated with a form control.',
    attributes: [],
    page: 'forms.html',
  },
  {
    name: 'tabset',
    description: 'Container of tab and panel elements.',
    attributes: [],
    page: 'controls.html',
  },
  {
    name: 'tab',
    description: 'Tab header declaring a titled panel.',
    attributes: [ 'title' ],
    page: 'controls.html',
  },
  {
    name: 'panel',
    description: 'Content panel shown by its sibling tab.',
    attributes: [],
    page: 'controls.html',
  },
  {
    name: 'progress',
    description: 'Progress bar driven by value and max attributes.',
    void: true,
    attributes: [ 'value', 'max' ],
    page: 'data_display.html',
  },
  {
    name: 'progressbar',
    description: 'Alias of the progress element.',
    void: true,
    attributes: [ 'value', 'max' ],
    page: 'data_display.html',
  },
  {
    name: 'table',
    description: 'Tabular layout container.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'tr',
    description: 'Table row.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'td',
    description: 'Table cell.',
    attributes: [ 'colspan', 'rowspan' ],
    page: 'element_index.html',
  },
  {
    name: 'th',
    description: 'Table header cell.',
    attributes: [ 'colspan', 'rowspan' ],
    page: 'element_index.html',
  },
  {
    name: 'col',
    description: 'Table column.',
    void: true,
    attributes: [ 'span' ],
    page: 'element_index.html',
  },
  {
    name: 'colgroup',
    description: 'Group of table columns.',
    attributes: [ 'span' ],
    page: 'element_index.html',
  },
  {
    name: 'thead',
    description: 'Table header row group.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'tbody',
    description: 'Table body row group.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'tfoot',
    description: 'Table footer row group.',
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'br',
    description: 'Line break element.',
    void: true,
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'hr',
    description: 'Horizontal rule element.',
    void: true,
    attributes: [],
    page: 'element_index.html',
  },
  {
    name: 'script',
    description: 'Script block; only available with the Lua plugin.',
    plugin: true,
    attributes: [ 'src' ],
    page: 'documents.html',
  },
  {
    name: 'lottie',
    description: 'Lottie animation element; requires the Lottie plugin.',
    void: true,
    plugin: true,
    attributes: [ 'src' ],
    page: '../cpp_manual/lottie.html',
  },
  {
    name: 'svg',
    description: 'SVG image element; requires the SVG plugin.',
    plugin: true,
    attributes: [ 'src' ],
    page: '../cpp_manual/svg.html',
  },
];

/** Enumerated attribute values keyed by attribute name. */
export const ATTRIBUTE_VALUES: Readonly<Record<string, readonly string[]>> = {
  type: [
    'text', 'password', 'checkbox', 'radio', 'range', 'submit', 'button',
    'number', 'email',
  ],
  template: [],
};

/** Link element type values. */
export const LINK_TYPE_VALUES: readonly string[] = [
  'text/rcss', 'text/css', 'text/template',
];

/** RmlUi events usable with data-event-* controllers. */
export const RML_EVENTS: readonly string[] = [
  'mousedown', 'mouseup', 'click', 'dblclick', 'mousemove', 'mouseover',
  'mouseout', 'mousescroll', 'focus', 'blur', 'keydown', 'keyup',
  'textinput', 'load', 'unload', 'show', 'hide', 'drag', 'dragstart',
  'dragover', 'dragdrop', 'dragout', 'dragend', 'dragmove', 'handledrag',
  'resize', 'scroll', 'animationend', 'transitionend', 'change', 'submit',
  'tabchange',
];

const tagIndex = new Map<string, RmlTagMeta>();
for (const tag of RML_TAGS) {
  tagIndex.set(tag.name, tag);
}

const globalAttributeIndex = new Map<string, RmlAttributeMeta>();
for (const attribute of GLOBAL_ATTRIBUTES) {
  globalAttributeIndex.set(attribute.name, attribute);
}

/**
 * Returns metadata for a tag name.
 *
 * @param name Tag name without angle brackets.
 * @returns Tag metadata or undefined for unknown tags.
 */
export function getTagMeta(name: string): RmlTagMeta | undefined {
  return tagIndex.get(name.toLowerCase());
}

/**
 * Returns metadata for a global attribute.
 *
 * @param name Attribute name.
 * @returns Attribute metadata or undefined.
 */
export function getGlobalAttributeMeta(
  name: string,
): RmlAttributeMeta | undefined {
  return globalAttributeIndex.get(name.toLowerCase());
}

/**
 * Builds the official manual URL for a tag.
 *
 * @param tag Tag metadata.
 * @returns Absolute manual URL.
 */
export function getTagDocUrl(tag: RmlTagMeta): string {
  return `${RML_DOC_BASE}${tag.page}`;
}
