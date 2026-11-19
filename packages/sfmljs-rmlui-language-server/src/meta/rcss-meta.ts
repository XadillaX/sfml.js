'use strict';

/**
 * RCSS knowledge base for RmlUi 6.3.
 *
 * The property set, keywords, pseudo-classes, units and built-in
 * decorator/filter/font-effect names mirror the upstream RmlUi source
 * (StyleSheetSpecification, Factory, StyleSheetFactory, Unit.h) and the
 * official RCSS manual. Entries are consumed by completion, hover and
 * diagnostics providers.
 */

/** Base URL of the official RmlUi RCSS manual. */
export const RCSS_DOC_BASE =
  'https://mikke89.github.io/RmlUiDoc/pages/rcss/';

/** Metadata describing one RCSS property or shorthand. */
export interface RcssPropertyMeta {
  /** Canonical kebab-case property name. */
  readonly name: string;
  /** Human-readable value syntax. */
  readonly values: string;
  /** Initial (default) value. */
  readonly initial: string;
  /** Whether the property is inherited by child elements. */
  readonly inherited: boolean;
  /** Short explanation shown in completion and hover. */
  readonly description: string;
  /** Keyword suggestions offered for the property value, if any. */
  readonly keywords?: readonly string[];
  /** True for shorthand properties that expand into longhands. */
  readonly shorthand?: boolean;
  /** Manual page filename under RCSS_DOC_BASE. */
  readonly page: string;
  /** Optional anchor on the manual page. */
  readonly anchor?: string;
}

const BOX = 'box_model.html';
const COLOR = 'colours_backgrounds.html';
const UI = 'user_interface.html';
const FLEX = 'flexboxes.html';
const FONT = 'fonts.html';
const TEXT = 'text.html';
const FMT = 'visual_formatting_model.html';
const FMT_DETAIL = 'visual_formatting_model_details.html';
const EFFECTS = 'visual_effects.html';
const ANIM = 'animations_transitions_transforms.html';
const DECORATOR = 'decorators.html';
const FILTER = 'filters.html';
const FONT_EFFECT = 'font_effects.html';
const MASK = 'masking.html';
const STYLE_GUIDE = '../style_guide.html';
const PROGRESS = '../cpp_manual/element_packages/progress_bar.html';

/**
 * Built-in RCSS properties and shorthands registered by RmlUi 6.3.
 */
export const RCSS_PROPERTIES: readonly RcssPropertyMeta[] = [
  {
    name: 'margin-top',
    values: '<length> | <percentage> | auto',
    initial: '0px',
    inherited: false,
    description: 'Space above the element border box.',
    keywords: [ 'auto' ],
    page: BOX,
    anchor: 'margin',
  },
  {
    name: 'margin-right',
    values: '<length> | <percentage> | auto',
    initial: '0px',
    inherited: false,
    description: 'Space to the right of the element border box.',
    keywords: [ 'auto' ],
    page: BOX,
    anchor: 'margin',
  },
  {
    name: 'margin-bottom',
    values: '<length> | <percentage> | auto',
    initial: '0px',
    inherited: false,
    description: 'Space below the element border box.',
    keywords: [ 'auto' ],
    page: BOX,
    anchor: 'margin',
  },
  {
    name: 'margin-left',
    values: '<length> | <percentage> | auto',
    initial: '0px',
    inherited: false,
    description: 'Space to the left of the element border box.',
    keywords: [ 'auto' ],
    page: BOX,
    anchor: 'margin',
  },
  {
    name: 'margin',
    values: '<margin-width>{1,4}',
    initial: '0px',
    inherited: false,
    description: 'Shorthand for the four margin widths.',
    keywords: [ 'auto' ],
    shorthand: true,
    page: BOX,
    anchor: 'margin',
  },
  {
    name: 'padding-top',
    values: '<length> | <percentage>',
    initial: '0px',
    inherited: false,
    description: 'Padding between the top border and content.',
    page: BOX,
    anchor: 'padding',
  },
  {
    name: 'padding-right',
    values: '<length> | <percentage>',
    initial: '0px',
    inherited: false,
    description: 'Padding between the right border and content.',
    page: BOX,
    anchor: 'padding',
  },
  {
    name: 'padding-bottom',
    values: '<length> | <percentage>',
    initial: '0px',
    inherited: false,
    description: 'Padding between the bottom border and content.',
    page: BOX,
    anchor: 'padding',
  },
  {
    name: 'padding-left',
    values: '<length> | <percentage>',
    initial: '0px',
    inherited: false,
    description: 'Padding between the left border and content.',
    page: BOX,
    anchor: 'padding',
  },
  {
    name: 'padding',
    values: '<padding-width>{1,4}',
    initial: '0px',
    inherited: false,
    description: 'Shorthand for the four padding widths.',
    shorthand: true,
    page: BOX,
    anchor: 'padding',
  },
  {
    name: 'border-top-width',
    values: '<length>',
    initial: '0px',
    inherited: false,
    description: 'Width of the top border.',
    page: BOX,
    anchor: 'border-width',
  },
  {
    name: 'border-right-width',
    values: '<length>',
    initial: '0px',
    inherited: false,
    description: 'Width of the right border.',
    page: BOX,
    anchor: 'border-width',
  },
  {
    name: 'border-bottom-width',
    values: '<length>',
    initial: '0px',
    inherited: false,
    description: 'Width of the bottom border.',
    page: BOX,
    anchor: 'border-width',
  },
  {
    name: 'border-left-width',
    values: '<length>',
    initial: '0px',
    inherited: false,
    description: 'Width of the left border.',
    page: BOX,
    anchor: 'border-width',
  },
  {
    name: 'border-width',
    values: '<border-width>{1,4}',
    initial: '0px',
    inherited: false,
    description: 'Shorthand for the four border widths.',
    shorthand: true,
    page: BOX,
    anchor: 'border-width',
  },
  {
    name: 'border-top-color',
    values: '<colour>',
    initial: 'black',
    inherited: false,
    description: 'Color of the top border.',
    page: BOX,
    anchor: 'border-color',
  },
  {
    name: 'border-right-color',
    values: '<colour>',
    initial: 'black',
    inherited: false,
    description: 'Color of the right border.',
    page: BOX,
    anchor: 'border-color',
  },
  {
    name: 'border-bottom-color',
    values: '<colour>',
    initial: 'black',
    inherited: false,
    description: 'Color of the bottom border.',
    page: BOX,
    anchor: 'border-color',
  },
  {
    name: 'border-left-color',
    values: '<colour>',
    initial: 'black',
    inherited: false,
    description: 'Color of the left border.',
    page: BOX,
    anchor: 'border-color',
  },
  {
    name: 'border-color',
    values: '<border-color>{1,4}',
    initial: 'black',
    inherited: false,
    description: 'Shorthand for the four border colors.',
    shorthand: true,
    page: BOX,
    anchor: 'border-color',
  },
  {
    name: 'border-top',
    values: '<border-top-width> <border-top-color>',
    initial: '',
    inherited: false,
    description: 'Width and color of the top border; no border style.',
    shorthand: true,
    page: BOX,
    anchor: 'border',
  },
  {
    name: 'border-right',
    values: '<border-right-width> <border-right-color>',
    initial: '',
    inherited: false,
    description: 'Width and color of the right border; no border style.',
    shorthand: true,
    page: BOX,
    anchor: 'border',
  },
  {
    name: 'border-bottom',
    values: '<border-bottom-width> <border-bottom-color>',
    initial: '',
    inherited: false,
    description: 'Width and color of the bottom border; no border style.',
    shorthand: true,
    page: BOX,
    anchor: 'border',
  },
  {
    name: 'border-left',
    values: '<border-left-width> <border-left-color>',
    initial: '',
    inherited: false,
    description: 'Width and color of the left border; no border style.',
    shorthand: true,
    page: BOX,
    anchor: 'border',
  },
  {
    name: 'border',
    values: '<border-width> <border-color>',
    initial: '',
    inherited: false,
    description: 'Shorthand for all border widths and colors.',
    shorthand: true,
    page: BOX,
    anchor: 'border',
  },
  {
    name: 'border-top-left-radius',
    values: '<length>',
    initial: '0px',
    inherited: false,
    description: 'Rounding radius of the top-left corner.',
    page: COLOR,
    anchor: 'border-radius',
  },
  {
    name: 'border-top-right-radius',
    values: '<length>',
    initial: '0px',
    inherited: false,
    description: 'Rounding radius of the top-right corner.',
    page: COLOR,
    anchor: 'border-radius',
  },
  {
    name: 'border-bottom-right-radius',
    values: '<length>',
    initial: '0px',
    inherited: false,
    description: 'Rounding radius of the bottom-right corner.',
    page: COLOR,
    anchor: 'border-radius',
  },
  {
    name: 'border-bottom-left-radius',
    values: '<length>',
    initial: '0px',
    inherited: false,
    description: 'Rounding radius of the bottom-left corner.',
    page: COLOR,
    anchor: 'border-radius',
  },
  {
    name: 'border-radius',
    values: '<border-radius>{1,4}',
    initial: '0px',
    inherited: false,
    description: 'Shorthand for the four corner radii.',
    shorthand: true,
    page: COLOR,
    anchor: 'border-radius',
  },
  {
    name: 'display',
    values: 'inline | block | inline-block | flow-root | flex | ' +
      'inline-flex | table-* | none',
    initial: 'inline',
    inherited: false,
    description: 'Outer and inner display role of the element.',
    keywords: [
      'inline', 'block', 'inline-block', 'flow-root', 'flex', 'inline-flex',
      'table', 'inline-table', 'table-row-group', 'table-row',
      'table-column-group', 'table-column', 'table-cell', 'none',
    ],
    page: FMT,
    anchor: 'display',
  },
  {
    name: 'position',
    values: 'static | relative | absolute | fixed',
    initial: 'static',
    inherited: false,
    description: 'Positioning scheme of the element.',
    keywords: [ 'static', 'relative', 'absolute', 'fixed' ],
    page: FMT,
    anchor: 'position',
  },
  {
    name: 'top',
    values: 'auto | <length> | <percentage>',
    initial: 'auto',
    inherited: false,
    description: 'Offset from the top edge of the containing block.',
    keywords: [ 'auto' ],
    page: FMT,
    anchor: 'top_right_bottom_left',
  },
  {
    name: 'right',
    values: 'auto | <length> | <percentage>',
    initial: 'auto',
    inherited: false,
    description: 'Offset from the right edge of the containing block.',
    keywords: [ 'auto' ],
    page: FMT,
    anchor: 'top_right_bottom_left',
  },
  {
    name: 'bottom',
    values: 'auto | <length> | <percentage>',
    initial: 'auto',
    inherited: false,
    description: 'Offset from the bottom edge of the containing block.',
    keywords: [ 'auto' ],
    page: FMT,
    anchor: 'top_right_bottom_left',
  },
  {
    name: 'left',
    values: 'auto | <length> | <percentage>',
    initial: 'auto',
    inherited: false,
    description: 'Offset from the left edge of the containing block.',
    keywords: [ 'auto' ],
    page: FMT,
    anchor: 'top_right_bottom_left',
  },
  {
    name: 'inset',
    values: '<top> <right> <bottom> <left>',
    initial: '',
    inherited: false,
    description: 'Shorthand for the four box offsets.',
    keywords: [ 'auto' ],
    shorthand: true,
    page: FMT,
    anchor: 'top_right_bottom_left',
  },
  {
    name: 'float',
    values: 'none | left | right',
    initial: 'none',
    inherited: false,
    description: 'Floats the element to one side of its block.',
    keywords: [ 'none', 'left', 'right' ],
    page: FMT,
    anchor: 'float',
  },
  {
    name: 'clear',
    values: 'none | left | right | both',
    initial: 'none',
    inherited: false,
    description: 'Clears floated elements on the selected sides.',
    keywords: [ 'none', 'left', 'right', 'both' ],
    page: FMT,
    anchor: 'clear',
  },
  {
    name: 'box-sizing',
    values: 'content-box | border-box',
    initial: 'content-box',
    inherited: false,
    description: 'Controls whether width/height include padding and border.',
    keywords: [ 'content-box', 'border-box' ],
    page: UI,
    anchor: 'box-sizing',
  },
  {
    name: 'z-index',
    values: 'auto | <number>',
    initial: 'auto',
    inherited: false,
    description: 'Stacking order within the same stacking context.',
    keywords: [ 'auto' ],
    page: FMT,
    anchor: 'z-index',
  },
  {
    name: 'width',
    values: 'auto | <length> | <percentage>',
    initial: 'auto',
    inherited: false,
    description: 'Content width of the element.',
    keywords: [ 'auto' ],
    page: FMT_DETAIL,
    anchor: 'height',
  },
  {
    name: 'min-width',
    values: '<length> | <percentage>',
    initial: '0px',
    inherited: false,
    description: 'Lower bound for the element width.',
    page: FMT_DETAIL,
    anchor: 'max-height',
  },
  {
    name: 'max-width',
    values: 'none | <length> | <percentage>',
    initial: 'none',
    inherited: false,
    description: 'Upper bound for the element width.',
    keywords: [ 'none' ],
    page: FMT_DETAIL,
    anchor: 'max-width',
  },
  {
    name: 'height',
    values: 'auto | <length> | <percentage>',
    initial: 'auto',
    inherited: false,
    description: 'Content height of the element.',
    keywords: [ 'auto' ],
    page: FMT_DETAIL,
    anchor: 'height',
  },
  {
    name: 'min-height',
    values: '<length> | <percentage>',
    initial: '0px',
    inherited: false,
    description: 'Lower bound for the element height.',
    page: FMT_DETAIL,
    anchor: 'max-height',
  },
  {
    name: 'max-height',
    values: 'none | <length> | <percentage>',
    initial: 'none',
    inherited: false,
    description: 'Upper bound for the element height.',
    keywords: [ 'none' ],
    page: FMT_DETAIL,
    anchor: 'max-height',
  },
  {
    name: 'line-height',
    values: '<number> | <length> | <percentage>',
    initial: '1.2',
    inherited: true,
    description: 'Height of each line box; "normal" is not supported.',
    page: FMT_DETAIL,
    anchor: 'line-height',
  },
  {
    name: 'vertical-align',
    values: 'baseline | sub | super | text-top | text-bottom | ' +
      'middle | top | center | bottom | <percentage> | <length>',
    initial: 'baseline',
    inherited: false,
    description: 'Vertical alignment of inline-level boxes.',
    keywords: [
      'baseline', 'sub', 'super', 'text-top', 'text-bottom',
      'middle', 'top', 'center', 'bottom',
    ],
    page: FMT_DETAIL,
    anchor: 'vertical-align',
  },
  {
    name: 'overflow-x',
    values: 'visible | hidden | auto | scroll',
    initial: 'visible',
    inherited: false,
    description: 'Horizontal overflow behavior.',
    keywords: [ 'visible', 'hidden', 'auto', 'scroll' ],
    page: EFFECTS,
    anchor: 'overflow',
  },
  {
    name: 'overflow-y',
    values: 'visible | hidden | auto | scroll',
    initial: 'visible',
    inherited: false,
    description: 'Vertical overflow behavior.',
    keywords: [ 'visible', 'hidden', 'auto', 'scroll' ],
    page: EFFECTS,
    anchor: 'overflow',
  },
  {
    name: 'overflow',
    values: '<overflow-x> <overflow-y>?',
    initial: 'visible',
    inherited: false,
    description: 'Shorthand for overflow-x and overflow-y.',
    keywords: [ 'visible', 'hidden', 'auto', 'scroll' ],
    shorthand: true,
    page: EFFECTS,
    anchor: 'overflow',
  },
  {
    name: 'clip',
    values: 'auto | none | always | <number>',
    initial: 'auto',
    inherited: false,
    description: 'Interaction with ancestor clipping regions.',
    keywords: [ 'auto', 'none', 'always' ],
    page: EFFECTS,
    anchor: 'clip',
  },
  {
    name: 'visibility',
    values: 'visible | hidden',
    initial: 'visible',
    inherited: false,
    description: 'Toggles element visibility without removing it from layout.',
    keywords: [ 'visible', 'hidden' ],
    page: EFFECTS,
    anchor: 'visibility',
  },
  {
    name: 'text-overflow',
    values: 'clip | ellipsis | <string>',
    initial: 'clip',
    inherited: false,
    description: 'Overflow marker for clipped inline content.',
    keywords: [ 'clip', 'ellipsis' ],
    page: TEXT,
    anchor: 'text-overflow',
  },
  {
    name: 'background-color',
    values: '<colour>',
    initial: 'transparent',
    inherited: false,
    description: 'Solid background color; images use decorators.',
    page: COLOR,
    anchor: 'background-color',
  },
  {
    name: 'background',
    values: '<background-color>',
    initial: '',
    inherited: false,
    description: 'Shorthand for background-color only.',
    shorthand: true,
    page: COLOR,
    anchor: 'background-color',
  },
  {
    name: 'color',
    values: '<colour>',
    initial: 'white',
    inherited: true,
    description: 'Text color of the element.',
    page: COLOR,
    anchor: 'color',
  },
  {
    name: 'caret-color',
    values: 'auto | <colour>',
    initial: 'auto',
    inherited: true,
    description: 'Color of the text input caret.',
    keywords: [ 'auto' ],
    page: UI,
    anchor: 'caret-color',
  },
  {
    name: 'image-color',
    values: '<colour>',
    initial: 'white',
    inherited: false,
    description: 'Multiplier color applied to images and decorators.',
    page: COLOR,
    anchor: 'image-color',
  },
  {
    name: 'opacity',
    values: '<number>',
    initial: '1',
    inherited: true,
    description: 'Opacity multiplier between 0 and 1.',
    page: COLOR,
    anchor: 'opacity',
  },
  {
    name: 'font-family',
    values: '<string>',
    initial: '',
    inherited: true,
    description: 'Internal family name of a loaded font face.',
    page: FONT,
    anchor: 'font-family',
  },
  {
    name: 'font-style',
    values: 'normal | italic',
    initial: 'normal',
    inherited: true,
    description: 'Selects a normal or italic font face.',
    keywords: [ 'normal', 'italic' ],
    page: FONT,
    anchor: 'font-style',
  },
  {
    name: 'font-weight',
    values: 'normal | bold | <number 1-1000>',
    initial: 'normal',
    inherited: true,
    description: 'Selects the font weight; relative weights are unsupported.',
    keywords: [ 'normal', 'bold' ],
    page: FONT,
    anchor: 'font-weight',
  },
  {
    name: 'font-size',
    values: '<length> | <percentage>',
    initial: '12px',
    inherited: true,
    description: 'Font size; percentages resolve against the parent size.',
    page: FONT,
    anchor: 'font-size',
  },
  {
    name: 'font-kerning',
    values: 'auto | normal | none',
    initial: 'auto',
    inherited: true,
    description: 'Controls font kerning.',
    keywords: [ 'auto', 'normal', 'none' ],
    page: FONT,
    anchor: 'font-kerning',
  },
  {
    name: 'letter-spacing',
    values: 'normal | <length>',
    initial: 'normal',
    inherited: true,
    description: 'Additional spacing between characters.',
    keywords: [ 'normal' ],
    page: TEXT,
    anchor: 'letter-spacing',
  },
  {
    name: 'font',
    values: '<font-style> <font-weight> <font-size> <font-family>',
    initial: '',
    inherited: true,
    description: 'Shorthand for font style, weight, size and family.',
    keywords: [ 'normal', 'italic', 'bold' ],
    shorthand: true,
    page: FONT,
    anchor: 'font',
  },
  {
    name: 'text-align',
    values: 'left | right | center',
    initial: 'left',
    inherited: true,
    description: 'Horizontal text alignment; justify is unsupported.',
    keywords: [ 'left', 'right', 'center' ],
    page: TEXT,
    anchor: 'text-align',
  },
  {
    name: 'text-decoration',
    values: 'none | underline | overline | line-through',
    initial: 'none',
    inherited: true,
    description: 'Decorations applied to the element text.',
    keywords: [ 'none', 'underline', 'overline', 'line-through' ],
    page: TEXT,
    anchor: 'text-decoration',
  },
  {
    name: 'text-transform',
    values: 'none | capitalize | uppercase | lowercase',
    initial: 'none',
    inherited: true,
    description: 'Case transformation applied to text.',
    keywords: [ 'none', 'capitalize', 'uppercase', 'lowercase' ],
    page: TEXT,
    anchor: 'text-transform',
  },
  {
    name: 'white-space',
    values: 'normal | pre | nowrap | pre-wrap | pre-line',
    initial: 'normal',
    inherited: true,
    description: 'Handling of whitespace and line breaks.',
    keywords: [ 'normal', 'pre', 'nowrap', 'pre-wrap', 'pre-line' ],
    page: TEXT,
    anchor: 'white-space',
  },
  {
    name: 'word-break',
    values: 'normal | break-all | break-word',
    initial: 'normal',
    inherited: true,
    description: 'Line breaking behavior inside words.',
    keywords: [ 'normal', 'break-all', 'break-word' ],
    page: TEXT,
    anchor: 'word-break',
  },
  {
    name: 'row-gap',
    values: '<length> | <percentage>',
    initial: '0px',
    inherited: false,
    description: 'Gap between flex rows or table rows.',
    page: FLEX,
    anchor: 'gap',
  },
  {
    name: 'column-gap',
    values: '<length> | <percentage>',
    initial: '0px',
    inherited: false,
    description: 'Gap between flex columns or table columns.',
    page: FLEX,
    anchor: 'gap',
  },
  {
    name: 'gap',
    values: '<row-gap> <column-gap>?',
    initial: '0px',
    inherited: false,
    description: 'Shorthand for row-gap and column-gap.',
    shorthand: true,
    page: FLEX,
    anchor: 'gap',
  },
  {
    name: 'cursor',
    values: '<string>',
    initial: '',
    inherited: true,
    description: 'Application-specific cursor name.',
    page: UI,
    anchor: 'cursor',
  },
  {
    name: 'drag',
    values: 'none | drag | drag-drop | block | clone',
    initial: 'none',
    inherited: false,
    description: 'Controls drag message generation for the element.',
    keywords: [ 'none', 'drag', 'drag-drop', 'block', 'clone' ],
    page: UI,
    anchor: 'drag',
  },
  {
    name: 'tab-index',
    values: 'none | auto',
    initial: 'none',
    inherited: false,
    description: 'Includes the element in tab focus ordering.',
    keywords: [ 'none', 'auto' ],
    page: UI,
    anchor: 'tab-index',
  },
  {
    name: 'scrollbar-margin',
    values: '<length>',
    initial: '0',
    inherited: false,
    description: 'Margin that collapses with the complementary scrollbar.',
    page: STYLE_GUIDE,
    anchor: 'scrollbar-margin',
  },
  {
    name: 'overscroll-behavior',
    values: 'auto | contain',
    initial: 'auto',
    inherited: false,
    description: 'Controls scroll chaining at the boundary.',
    keywords: [ 'auto', 'contain' ],
    page: UI,
    anchor: 'overscroll-behavior',
  },
  {
    name: 'pointer-events',
    values: 'auto | none',
    initial: 'auto',
    inherited: true,
    description: 'Disables pointer hit testing when set to none.',
    keywords: [ 'auto', 'none' ],
    page: UI,
    anchor: 'pointer-events',
  },
  {
    name: 'perspective',
    values: 'none | <length>',
    initial: 'none',
    inherited: false,
    description: 'Distance of the perspective origin from the viewer.',
    keywords: [ 'none' ],
    page: ANIM,
    anchor: 'perspective',
  },
  {
    name: 'perspective-origin-x',
    values: 'left | center | right | <length> | <percentage>',
    initial: '50%',
    inherited: false,
    description: 'Horizontal perspective origin.',
    keywords: [ 'left', 'center', 'right' ],
    page: ANIM,
    anchor: 'perspective-origin',
  },
  {
    name: 'perspective-origin-y',
    values: 'top | center | bottom | <length> | <percentage>',
    initial: '50%',
    inherited: false,
    description: 'Vertical perspective origin.',
    keywords: [ 'top', 'center', 'bottom' ],
    page: ANIM,
    anchor: 'perspective-origin',
  },
  {
    name: 'perspective-origin',
    values: '<perspective-origin-x> <perspective-origin-y>',
    initial: '50% 50%',
    inherited: false,
    description: 'Shorthand for the perspective origin axes.',
    keywords: [ 'left', 'center', 'right', 'top', 'bottom' ],
    shorthand: true,
    page: ANIM,
    anchor: 'perspective-origin',
  },
  {
    name: 'transform',
    values: 'none | <transform-function>+',
    initial: 'none',
    inherited: false,
    description: '2D/3D transform function list.',
    keywords: [ 'none' ],
    page: ANIM,
    anchor: 'transform',
  },
  {
    name: 'transform-origin-x',
    values: 'left | center | right | <length> | <percentage>',
    initial: '50%',
    inherited: false,
    description: 'Horizontal transform origin.',
    keywords: [ 'left', 'center', 'right' ],
    page: ANIM,
    anchor: 'transform-origin',
  },
  {
    name: 'transform-origin-y',
    values: 'top | center | bottom | <length> | <percentage>',
    initial: '50%',
    inherited: false,
    description: 'Vertical transform origin.',
    keywords: [ 'top', 'center', 'bottom' ],
    page: ANIM,
    anchor: 'transform-origin',
  },
  {
    name: 'transform-origin-z',
    values: '<length>',
    initial: '0',
    inherited: false,
    description: 'Depth transform origin.',
    page: ANIM,
    anchor: 'transform-origin',
  },
  {
    name: 'transform-origin',
    values: '<origin-x> <origin-y> <origin-z>?',
    initial: '50% 50% 0px',
    inherited: false,
    description: 'Shorthand for the transform origin axes.',
    keywords: [ 'left', 'center', 'right', 'top', 'bottom' ],
    shorthand: true,
    page: ANIM,
    anchor: 'transform-origin',
  },
  {
    name: 'transition',
    values: 'none | <transition-list>',
    initial: 'none',
    inherited: false,
    description: 'Animated transitions between property values.',
    keywords: [ 'none' ],
    page: ANIM,
    anchor: 'transition',
  },
  {
    name: 'animation',
    values: 'none | <animation-list>',
    initial: 'none',
    inherited: false,
    description: 'Keyframe animations applied to the element.',
    keywords: [ 'none' ],
    page: ANIM,
    anchor: 'animation',
  },
  {
    name: 'decorator',
    values: 'none | <name> | <type>(<properties>)',
    initial: 'none',
    inherited: false,
    description: 'Built-in or custom decorators such as images and gradients.',
    keywords: [ 'none' ],
    page: DECORATOR,
    anchor: 'decorator',
  },
  {
    name: 'mask-image',
    values: 'none | <name> | <type>(<properties>)',
    initial: 'none',
    inherited: false,
    description: 'Mask rendered through the decorator system.',
    keywords: [ 'none' ],
    page: MASK,
    anchor: 'mask-image',
  },
  {
    name: 'font-effect',
    values: 'none | <type>(<properties>)',
    initial: 'none',
    inherited: true,
    description: 'Text effects such as shadow, outline, glow and blur.',
    keywords: [ 'none' ],
    page: FONT_EFFECT,
    anchor: 'font-effect',
  },
  {
    name: 'filter',
    values: 'none | <filter-function>(<properties>)',
    initial: 'none',
    inherited: false,
    description: 'Graphics filters including blur and drop-shadow.',
    keywords: [ 'none' ],
    page: FILTER,
    anchor: 'filter',
  },
  {
    name: 'backdrop-filter',
    values: 'none | <filter-function>(<properties>)',
    initial: 'none',
    inherited: false,
    description: 'Filter applied to the content behind the element.',
    keywords: [ 'none' ],
    page: FILTER,
    anchor: 'backdrop-filter',
  },
  {
    name: 'box-shadow',
    values: 'none | <color>? <offset-x> <offset-y> ' +
      '<blur>? <spread>? inset?',
    initial: 'none',
    inherited: false,
    description: 'Shadow rendered behind the element border box.',
    keywords: [ 'none', 'inset' ],
    page: COLOR,
    anchor: 'box-shadow',
  },
  {
    name: 'fill-image',
    values: '<string>',
    initial: '',
    inherited: false,
    description: 'Sprite name or image url filling a progress element.',
    page: PROGRESS,
  },
  {
    name: 'align-content',
    values: 'flex-start | flex-end | center | space-between | ' +
      'space-around | space-evenly | stretch',
    initial: 'stretch',
    inherited: false,
    description: 'Alignment of wrapped flex lines.',
    keywords: [
      'flex-start', 'flex-end', 'center', 'space-between',
      'space-around', 'space-evenly', 'stretch',
    ],
    page: FLEX,
    anchor: 'align-content',
  },
  {
    name: 'align-items',
    values: 'flex-start | flex-end | center | baseline | stretch',
    initial: 'stretch',
    inherited: false,
    description: 'Cross-axis alignment of flex items.',
    keywords: [ 'flex-start', 'flex-end', 'center', 'baseline', 'stretch' ],
    page: FLEX,
    anchor: 'align-items',
  },
  {
    name: 'align-self',
    values: 'auto | flex-start | flex-end | center | baseline | stretch',
    initial: 'auto',
    inherited: false,
    description: 'Per-item override of align-items.',
    keywords: [
      'auto', 'flex-start', 'flex-end', 'center', 'baseline', 'stretch',
    ],
    page: FLEX,
    anchor: 'align-self',
  },
  {
    name: 'flex-basis',
    values: 'auto | <length> | <percentage>',
    initial: 'auto',
    inherited: false,
    description: 'Initial main size of a flex item.',
    keywords: [ 'auto' ],
    page: FLEX,
    anchor: 'flex-basis',
  },
  {
    name: 'flex-direction',
    values: 'row | row-reverse | column | column-reverse',
    initial: 'row',
    inherited: false,
    description: 'Main axis direction of the flex container.',
    keywords: [ 'row', 'row-reverse', 'column', 'column-reverse' ],
    page: FLEX,
    anchor: 'flex-direction',
  },
  {
    name: 'flex-grow',
    values: '<number>',
    initial: '0',
    inherited: false,
    description: 'Main-axis grow factor.',
    page: FLEX,
    anchor: 'flex-grow',
  },
  {
    name: 'flex-shrink',
    values: '<number>',
    initial: '1',
    inherited: false,
    description: 'Main-axis shrink factor.',
    page: FLEX,
    anchor: 'flex-shrink',
  },
  {
    name: 'flex-wrap',
    values: 'nowrap | wrap | wrap-reverse',
    initial: 'nowrap',
    inherited: false,
    description: 'Controls wrapping of flex items.',
    keywords: [ 'nowrap', 'wrap', 'wrap-reverse' ],
    page: FLEX,
    anchor: 'flex-wrap',
  },
  {
    name: 'justify-content',
    values: 'flex-start | flex-end | center | space-between | ' +
      'space-around | space-evenly',
    initial: 'flex-start',
    inherited: false,
    description: 'Main-axis distribution of flex items.',
    keywords: [
      'flex-start', 'flex-end', 'center', 'space-between',
      'space-around', 'space-evenly',
    ],
    page: FLEX,
    anchor: 'justify-content',
  },
  {
    name: 'flex',
    values: 'auto | none | <flex-grow> <flex-shrink>? <flex-basis>?',
    initial: '0 1 auto',
    inherited: false,
    description: 'Shorthand for flex-grow, flex-shrink and flex-basis.',
    keywords: [ 'auto', 'none' ],
    shorthand: true,
    page: FLEX,
    anchor: 'flex',
  },
  {
    name: 'flex-flow',
    values: '<flex-direction> <flex-wrap>',
    initial: 'row nowrap',
    inherited: false,
    description: 'Shorthand for flex-direction and flex-wrap.',
    keywords: [ 'row', 'row-reverse', 'column', 'column-reverse',
      'nowrap', 'wrap', 'wrap-reverse' ],
    shorthand: true,
    page: FLEX,
    anchor: 'flex-flow',
  },
  {
    name: 'nav-up',
    values: 'none | auto | tree-order | <id>',
    initial: 'none',
    inherited: false,
    description: 'Spatial navigation target above the element.',
    keywords: [ 'none', 'auto', 'tree-order' ],
    page: UI,
    anchor: 'nav',
  },
  {
    name: 'nav-right',
    values: 'none | auto | tree-order | <id>',
    initial: 'none',
    inherited: false,
    description: 'Spatial navigation target right of the element.',
    keywords: [ 'none', 'auto', 'tree-order' ],
    page: UI,
    anchor: 'nav',
  },
  {
    name: 'nav-down',
    values: 'none | auto | tree-order | <id>',
    initial: 'none',
    inherited: false,
    description: 'Spatial navigation target below the element.',
    keywords: [ 'none', 'auto', 'tree-order' ],
    page: UI,
    anchor: 'nav',
  },
  {
    name: 'nav-left',
    values: 'none | auto | tree-order | <id>',
    initial: 'none',
    inherited: false,
    description: 'Spatial navigation target left of the element.',
    keywords: [ 'none', 'auto', 'tree-order' ],
    page: UI,
    anchor: 'nav',
  },
  {
    name: 'nav',
    values: '<nav-up> <nav-right> <nav-down> <nav-left>',
    initial: 'none',
    inherited: false,
    description: 'Shorthand for the four spatial navigation properties.',
    keywords: [ 'none', 'auto', 'tree-order' ],
    shorthand: true,
    page: UI,
    anchor: 'nav',
  },
  {
    name: 'focus',
    values: 'none | auto',
    initial: 'auto',
    inherited: true,
    description: 'Controls whether the element can receive focus.',
    keywords: [ 'none', 'auto' ],
    page: UI,
    anchor: 'focus',
  },
  {
    name: '-rmlui-language',
    values: '<string>',
    initial: '',
    inherited: true,
    description: 'Language hint used for text shaping and localization.',
    page: 'localization.html',
  },
  {
    name: '-rmlui-direction',
    values: 'auto | ltr | rtl',
    initial: 'auto',
    inherited: true,
    description: 'Text direction override.',
    keywords: [ 'auto', 'ltr', 'rtl' ],
    page: 'localization.html',
  },
];

/** Pseudo-class metadata keyed by selector name without the colon. */
export interface PseudoClassMeta {
  /** Selector name without the leading colon. */
  readonly name: string;
  /** True when the pseudo-class takes an argument, e.g. nth-child(2n+1). */
  readonly functional: boolean;
  /** Manual description. */
  readonly description: string;
}

const PSEUDO_PAGE =
  'https://mikke89.github.io/RmlUiDoc/pages/rcss/selectors.html';

/** Built-in and structural pseudo-classes supported by RCSS. */
export const PSEUDO_CLASSES: readonly PseudoClassMeta[] = [
  {
    name: 'hover',
    functional: false,
    description: 'Matches the element under the mouse cursor; ' +
      'propagates through parents unlike CSS.',
  },
  {
    name: 'active',
    functional: false,
    description: 'Matches while the element is being pressed.',
  },
  {
    name: 'focus',
    functional: false,
    description: 'Matches the element holding input focus.',
  },
  {
    name: 'focus-visible',
    functional: false,
    description: 'Matches when focus should be visibly indicated.',
  },
  {
    name: 'checked',
    functional: false,
    description: 'Matches checked checkboxes, radios and open selects.',
  },
  {
    name: 'disabled',
    functional: false,
    description: 'Matches disabled form controls.',
  },
  {
    name: 'selected',
    functional: false,
    description: 'Matches the selected tab and panel of a tabset.',
  },
  {
    name: 'drag',
    functional: false,
    description: 'Matches an element while it is being dragged.',
  },
  {
    name: 'placeholder-shown',
    functional: false,
    description: 'Matches inputs currently showing placeholder text.',
  },
  {
    name: 'not',
    functional: true,
    description: 'Negation selector; :not(s1, s2, ...).',
  },
  {
    name: 'scope',
    functional: false,
    description: 'Matches the scope element of a DOM query.',
  },
  {
    name: 'nth-child',
    functional: true,
    description: 'Matches elements by an+b position among siblings.',
  },
  {
    name: 'nth-last-child',
    functional: true,
    description: 'Like nth-child but counted from the end.',
  },
  {
    name: 'nth-of-type',
    functional: true,
    description: 'Like nth-child but only counts same-type siblings.',
  },
  {
    name: 'nth-last-of-type',
    functional: true,
    description: 'Like nth-of-type but counted from the end.',
  },
  {
    name: 'first-child',
    functional: false,
    description: 'Matches the first sibling child.',
  },
  {
    name: 'last-child',
    functional: false,
    description: 'Matches the last sibling child.',
  },
  {
    name: 'first-of-type',
    functional: false,
    description: 'Matches the first sibling of its type.',
  },
  {
    name: 'last-of-type',
    functional: false,
    description: 'Matches the last sibling of its type.',
  },
  {
    name: 'only-child',
    functional: false,
    description: 'Matches elements without siblings.',
  },
  {
    name: 'only-of-type',
    functional: false,
    description: 'Matches elements without same-type siblings.',
  },
  {
    name: 'empty',
    functional: false,
    description: 'Matches elements without child nodes.',
  },
];

/** At-rule metadata. */
export interface AtRuleMeta {
  /** Rule name without the at sign. */
  readonly name: string;
  /** Snippet body inserted after the rule name. */
  readonly snippet: string;
  /** Manual description. */
  readonly description: string;
}

/** At-rules recognized by the RCSS parser. */
export const AT_RULES: readonly AtRuleMeta[] = [
  {
    name: 'media',
    snippet: ' (${1:condition}) {\n\t$0\n}',
    description: 'Conditionally applies rules to a context.',
  },
  {
    name: 'keyframes',
    snippet: ' ${1:name} {\n\tfrom { $2 }\n\tto { $3 }\n}',
    description: 'Declares animation keyframes.',
  },
  {
    name: 'font-face',
    snippet: ' {\n\tfont-family: ${1:family};\n\tsrc: ${2:font.ttf};\n}',
    description: 'Declares a loadable font face.',
  },
  {
    name: 'spritesheet',
    snippet: ' ${1:name} {\n\timage: ${2:image.png};\n\t$0\n}',
    description: 'Declares a sprite sheet with named rectangles.',
  },
  {
    name: 'decorator',
    snippet: ' ${1:name} : ${2:type} {\n\t$0\n}',
    description: 'Declares a reusable custom decorator.',
  },
];

/** Length and typographic units accepted by RCSS. */
export const LENGTH_UNITS: readonly string[] = [
  'px', 'dp', 'em', 'rem', 'ex', 'vw', 'vh', 'in', 'cm', 'mm', 'pt', 'pc',
];

/** Angle units accepted by transform functions. */
export const ANGLE_UNITS: readonly string[] = [ 'deg', 'rad' ];

/** Built-in decorator types registered by RmlUi. */
export const DECORATOR_TYPES: readonly string[] = [
  'image', 'ninepatch', 'tiled-box', 'tiled-horizontal', 'tiled-vertical',
  'text', 'shader', 'gradient', 'horizontal-gradient', 'vertical-gradient',
  'linear-gradient', 'repeating-linear-gradient', 'radial-gradient',
  'repeating-radial-gradient', 'conic-gradient',
  'repeating-conic-gradient',
];

/** Built-in filter functions registered by RmlUi. */
export const FILTER_FUNCTIONS: readonly string[] = [
  'blur', 'brightness', 'contrast', 'drop-shadow', 'grayscale',
  'hue-rotate', 'invert', 'opacity', 'saturate', 'sepia',
];

/** Built-in font-effect types registered by RmlUi. */
export const FONT_EFFECT_TYPES: readonly string[] = [
  'blur', 'glow', 'outline', 'shadow',
];

/** Transform function names accepted by the transform property. */
export const TRANSFORM_FUNCTIONS: readonly string[] = [
  'matrix', 'matrix3d', 'translate', 'translatex', 'translatey',
  'translatez', 'translate3d', 'scale', 'scalex', 'scaley', 'scalez',
  'scale3d', 'rotate', 'rotatex', 'rotatey', 'rotatez', 'rotate3d',
  'skew', 'skewx', 'skewy', 'perspective',
];

/** Named colors from the HTML 4.0 set plus RmlUi extensions. */
export const NAMED_COLORS: Readonly<Record<string, string>> = {
  aqua: '#00ffff',
  black: '#000000',
  blue: '#0000ff',
  fuchsia: '#ff00ff',
  gray: '#808080',
  grey: '#808080',
  green: '#008000',
  lime: '#00ff00',
  maroon: '#800000',
  navy: '#000080',
  olive: '#808000',
  orange: '#ffa500',
  purple: '#800080',
  red: '#ff0000',
  silver: '#c0c0c0',
  teal: '#008080',
  transparent: '#00000000',
  white: '#ffffff',
  yellow: '#ffff00',
};

/** Manual page describing the supported selector syntax. */
export const SELECTORS_DOC_URL = PSEUDO_PAGE;

const propertyIndex = new Map<string, RcssPropertyMeta>();
for (const property of RCSS_PROPERTIES) {
  propertyIndex.set(property.name, property);
}

/**
 * Returns metadata for a property name.
 *
 * @param name Kebeb-case property name.
 * @returns Property metadata or undefined when unknown.
 */
export function getPropertyMeta(name: string): RcssPropertyMeta | undefined {
  return propertyIndex.get(name.toLowerCase());
}

/**
 * Checks whether a name is a registered RCSS property or shorthand.
 *
 * @param name Property name.
 * @returns True for registered names and custom properties.
 */
export function isKnownProperty(name: string): boolean {
  if (name.startsWith('--')) {
    return true;
  }
  return propertyIndex.has(name.toLowerCase());
}

const pseudoIndex = new Map<string, PseudoClassMeta>();
for (const pseudo of PSEUDO_CLASSES) {
  pseudoIndex.set(pseudo.name, pseudo);
}

/**
 * Returns metadata for a pseudo-class.
 *
 * @param name Pseudo-class name without the leading colon.
 * @returns Pseudo-class metadata or undefined when unknown.
 */
export function getPseudoMeta(name: string): PseudoClassMeta | undefined {
  return pseudoIndex.get(name.toLowerCase());
}

/**
 * Builds the official manual URL for a property.
 *
 * @param property Property metadata.
 * @returns Absolute manual URL.
 */
export function getPropertyDocUrl(property: RcssPropertyMeta): string {
  const anchor = property.anchor ? `#${property.anchor}` : '';
  return `${RCSS_DOC_BASE}${property.page}${anchor}`;
}
