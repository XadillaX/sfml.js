'use strict';

/** Unchanged DOM child-index paths; every input sequence begins at time 1s. */
const sequences = {
  color_interpolation: [
    [ 'hover', '0/0' ], [ 'capture', 'hover-start' ],
    [ 'advance', '1.3' ], [ 'capture', 'half' ],
    [ 'advance', '1.6' ], [ 'capture', 'green' ],
    [ 'mouse', '900', '700' ], [ 'advance', '2.2' ],
    [ 'capture', 'red-again' ],
  ],
  flex_01: [
    [ 'hover', '0/1/0' ], [ 'advance', '1.3' ],
    [ 'capture', 'first-grown' ],
    [ 'mouse', '900', '700' ], [ 'advance', '1.6' ],
    [ 'capture', 'equal-again' ],
  ],
  element_label: [
    [ 'hover', '0/1/1' ], [ 'capture', 'label-hover' ],
    [ 'down' ], [ 'capture', 'label-active' ],
    [ 'up' ], [ 'capture', 'pasta-checked' ],
    [ 'down' ], [ 'up' ], [ 'capture', 'pasta-unchecked' ],
    [ 'hover', '0/5/0' ], [ 'down' ], [ 'up' ],
    [ 'capture', 'name-focused' ],
    [ 'hover', '0/8' ], [ 'down' ], [ 'capture', 'submit-active' ],
    [ 'up' ], [ 'capture', 'submit-focused' ],
  ],
  issue_452_scrollbar_resets: [
    [ 'scroll', '0/0/0/0', '0', '10000' ],
    [ 'scroll', '0/0/1/0', '0', '10000' ], [ 'capture', 'bottom' ],
    [ 'hover', '0/1' ], [ 'capture', 'button-hover' ],
    [ 'mouse', '900', '700' ], [ 'capture', 'button-out' ],
  ],
  position_absolute_static_position: [
    [ 'hover', '0/0/1' ], [ 'wheel', '0', '4' ],
    [ 'advance', '1.5' ], [ 'capture', 'wheel-scrolled' ],
    [ 'scroll', '0/0/1', '0', '10000' ], [ 'capture', 'article-bottom' ],
  ],
  media_query_01: [
    [ 'size', '999', '768' ], [ 'capture', 'collapsed' ],
    [ 'hover', '0/0' ], [ 'down' ], [ 'up' ], [ 'capture', 'menu-open' ],
    [ 'size', '1000', '768' ], [ 'capture', 'expanded' ],
  ],
  media_query_02: [
    [ 'size', '999', '768' ], [ 'capture', 'waves' ],
    [ 'size', '1300', '768' ], [ 'capture', 'game' ],
    [ 'density', '2' ], [ 'capture', 'high-density' ],
  ],
  navigation_02: [
    [ 'focus', '0/2/4' ], [ 'key', '93' ], [ 'capture', 'left-entered' ],
    [ 'key', '91' ], [ 'capture', 'left-exited' ],
    [ 'focus', '0/6/3' ], [ 'key', '91' ], [ 'capture', 'right-skipped' ],
    [ 'focus', '0/6/0' ], [ 'key', '91' ], [ 'capture', 'left-bottom-entered' ],
  ],
  navigation_01: [
    [ 'hover', '0/0' ], [ 'down' ], [ 'up' ], [ 'capture', 'enabled' ],
    [ 'key', '93' ], [ 'capture', 'first' ],
    [ 'key', '92' ], [ 'capture', 'right' ],
    [ 'key', '93' ], [ 'capture', 'below' ],
    [ 'key', '90' ], [ 'capture', 'left' ],
    [ 'key', '91' ], [ 'capture', 'above' ],
    [ 'key', '70' ], [ 'capture', 'tab-next' ],
    [ 'focus', '0/14/0/0' ], [ 'capture', 'offscreen-focused' ],
    [ 'key', '93' ], [ 'capture', 'offscreen-below' ],
  ],
  document_position: [
    [ 'hover', '0/2' ], [ 'down' ], [ 'move-by', '30', '20' ],
    [ 'capture', 'document-moving' ], [ 'up' ],
    [ 'hover', '0/3' ], [ 'down' ], [ 'move-by', '40', '30' ],
    [ 'capture', 'document-resizing' ], [ 'up' ],
    [ 'hover', '0/1/1' ], [ 'down' ], [ 'move-by', '-20', '15' ],
    [ 'capture', 'block-moving' ], [ 'up' ],
    [ 'hover', '0/1/2' ], [ 'down' ], [ 'move-by', '25', '20' ],
    [ 'capture', 'block-resizing' ], [ 'up' ],
  ],
  drag: [
    [ 'hit', '0/0/0' ], [ 'down' ], [ 'move-by', '20', '15' ],
    [ 'capture', 'upper-clone' ], [ 'move-by', '20', '10' ],
    [ 'capture', 'upper-moved' ], [ 'up' ], [ 'capture', 'upper-released' ],
    [ 'hit', '0/1/0' ], [ 'down' ], [ 'move-by', '20', '15' ],
    [ 'capture', 'lower-clone' ], [ 'move-by', '20', '10' ],
    [ 'capture', 'lower-moved' ], [ 'up' ], [ 'capture', 'lower-released' ],
  ],
  text_decorator: [
    [ 'hover', '0/1/0' ], [ 'capture', 'red-heart' ],
    [ 'mouse', '1000', '700' ], [ 'capture', 'earth-again' ],
    ...[ 'color', 'opacity', 'italic', 'bold', 'spacing', 'font', 'size' ]
      .flatMap((name, index) => [
        [ 'hover', `0/9/${index}` ], [ 'capture', name ],
        [ 'mouse', '1000', '700' ], [ 'capture', `${name}-restored` ],
      ]),
  ],
  issue_143_overflow_in_absolutely_positioned_input: [
    [ 'hover', '0/3' ], [ 'capture', 'hover-clipped' ],
    [ 'mouse', '1000', '700' ], [ 'capture', 'restored' ],
  ],
  text_overflow_01: [
    [ 'capture', 'initial-repeat' ],
    ...[ '0/0/1', '0/0/3', '0/0/4' ].flatMap((target, index) => [
      [ 'hover', target ], [ 'capture', `line-${index}` ],
      [ 'mouse', '1000', '700' ], [ 'capture', `line-${index}-restored` ],
    ]),
    ...Array.from({ length: 10 }, (_, index) => [
      [ 'hover', `0/3/${index}` ], [ 'capture', `narrow-${index}` ],
      [ 'mouse', '1000', '700' ],
    ]).flat(),
    [ 'hover', '0/6/0' ], [ 'capture', 'scroller-hover' ],
    [ 'scroll', '0/6/0', '10000', '0' ], [ 'capture', 'scroller-end' ],
    [ 'scroll', '0/6/0', '0', '0' ],
    [ 'scroll', '0', '0', '10000' ], [ 'capture', 'break-base' ],
    [ 'hover', '0/9/3' ], [ 'capture', 'break-hover' ],
  ],
  text_overflow_02: [
    ...Array.from({ length: 8 }, (_, index) => [
      [ 'hover', `0/1/${index + 1}` ], [ 'capture', `custom-${index + 1}` ],
      [ 'mouse', '1000', '700' ],
      [ 'capture', `custom-${index + 1}-restored` ],
    ]).flat(),
  ],
  flex_04: [
    [ 'hover', '0/8' ], [ 'down' ], [ 'move-by', '200', '0' ],
    [ 'up' ], [ 'capture', 'wide' ],
    [ 'hover', '0/8' ], [ 'down' ], [ 'move-by', '-500', '0' ],
    [ 'up' ], [ 'capture', 'narrow' ],
    [ 'hover', '0/8' ], [ 'down' ], [ 'move-by', '300', '0' ],
    [ 'up' ], [ 'capture', 'restored' ],
  ],
  inline_formatting_03: [
    [ 'hover', '0/1' ], [ 'down' ], [ 'move-by', '-140', '0' ],
    [ 'up' ], [ 'capture', 'split' ],
    [ 'hover', '0/1' ], [ 'down' ], [ 'move-by', '200', '0' ],
    [ 'up' ], [ 'capture', 'wide' ],
    [ 'hover', '0/1' ], [ 'down' ], [ 'move-by', '-60', '0' ],
    [ 'up' ], [ 'capture', 'restored' ],
  ],
  position_absolute_transform: [
    [ 'scroll', '0/0', '0', '80' ],
    [ 'scroll', '0/1', '0', '80' ], [ 'capture', 'inside' ],
    [ 'scroll', '0/0', '0', '160' ],
    [ 'scroll', '0/1', '0', '160' ], [ 'capture', 'partial' ],
    [ 'scroll', '0/0', '0', '10000' ],
    [ 'scroll', '0/1', '0', '10000' ], [ 'capture', 'bottom' ],
    [ 'scroll', '0/0', '0', '0' ],
    [ 'scroll', '0/1', '0', '0' ], [ 'capture', 'restored' ],
  ],
  handle_target_anchor: [
    [ 'hover', '0/5' ], [ 'down' ], [ 'move-by', '400', '0' ],
    [ 'up' ], [ 'capture', 'parent-wide' ],
    ...[ 1, 2, 3 ].flatMap(index => [
      [ 'hover', `0/${index}/2` ], [ 'down' ], [ 'move-by', '20', '15' ],
      [ 'up' ], [ 'capture', `target-${index}-moved` ],
      [ 'hover', `0/${index}/3` ], [ 'down' ], [ 'move-by', '25', '20' ],
      [ 'up' ], [ 'capture', `target-${index}-resized` ],
    ]),
    [ 'hover', '0/5' ], [ 'down' ], [ 'move-by', '-50', '-40' ],
    [ 'up' ], [ 'capture', 'parent-smaller' ],
    ...[ 1, 2, 3 ].flatMap(index => [
      [ 'hover', `0/${index}/2` ], [ 'down' ],
      [ 'move-by', '2000', '2000' ],
      [ 'capture', `target-${index}-edge-max` ],
      [ 'move-by', '-4000', '-4000' ],
      [ 'capture', `target-${index}-edge-min` ],
      [ 'up' ],
    ]),
  ],
  table_04: [
    [ 'property', '0', 'height', '300dp' ], [ 'capture', 'small' ],
    [ 'property', '0', 'height', '200dp' ], [ 'capture', 'smaller' ],
    [ 'property', '0', 'height', '1200dp' ], [ 'capture', 'large' ],
    [ 'property', '0', 'height', '1400dp' ], [ 'capture', 'larger' ],
  ],
  scrollable_overflow_values: [
    [ 'capture', 'scrollbar-axes' ],
  ],
  scrollable_overflow: [
    ...[ 0, 1, 2 ].map(index => [
      'scroll', `0/${index}`, '10000', '10000',
    ]),
    [ 'capture', 'end' ],
    ...[ 0, 1, 2 ].map(index => [
      'scroll', `0/${index}`, '-10000', '-10000',
    ]),
    [ 'capture', 'start' ],
  ],
  scrollable_overflow_height: [
    ...[ 1, 3 ].flatMap(group => Array.from({ length: 6 }, (_, index) => [
      'scroll', `0/${group}/${index}/1`, '10000', '10000',
    ])),
    [ 'capture', 'end' ],
    ...[ 1, 3 ].flatMap(group => Array.from({ length: 6 }, (_, index) => [
      'scroll', `0/${group}/${index}/1`, '-10000', '-10000',
    ])),
    [ 'capture', 'start' ],
  ],
  scrollable_overflow_margin_padding: [
    [ 'scroll', '0', '0', '10000' ], [ 'capture', 'base-bottom' ],
    ...[ 1, 3, 5 ].flatMap(group => Array.from({ length: 6 }, (_, index) => [
      'scroll', `0/${group}/${index}/1`, '10000', '10000',
    ])),
    [ 'capture', 'end' ],
    ...[ 1, 3, 5 ].flatMap(group => Array.from({ length: 6 }, (_, index) => [
      'scroll', `0/${group}/${index}/1`, '-10000', '-10000',
    ])),
    [ 'capture', 'start' ],
  ],
  flex_03_scroll: [
    ...[ 1, 3, 5, 7, 9 ].map(index => [
      'scroll', `0/${index}`, '10000', '10000',
    ]),
    [ 'capture', 'end' ],
    ...[ 1, 3, 5, 7, 9 ].map(index => [
      'scroll', `0/${index}`, '-10000', '-10000',
    ]),
    [ 'capture', 'start' ],
  ],
};

const additional = require('./additional-catalog.cjs');
module.exports = { sequences: { ...sequences, ...additional.sequences } };
