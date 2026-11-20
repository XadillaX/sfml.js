'use strict';

/** Original document resizers, addressed by unchanged DOM child indices. */
const resizers = {
  filter_backdrop_filter_box_shadow: '0/8',
  filter_drop_shadow: '0/1',
  filter_overflow: '0/1',
  filter_with_backdrop: '0/6',
  flex_02: '0/4',
  flex_05: '0/18',
  flex_06: '0/2',
  flex_absolutely_positioned: '0/5',
  flex_direction: '0/8',
  flex_inline: '0/1',
  flex_nested: '0/1',
  flex_shrink_to_fit_01: '0/5',
  flex_shrink_to_fit_02: '0/3',
  float_excluded_by_flow_root: '0/2',
  float_overflow: '0/5',
  float_placement: '0/12',
  float_text_wrap: '0/1',
  ink_overflow_bounding_box: '0/3',
  inline_formatting_01: '0/7',
  inline_formatting_02: '0/1',
  inline_formatting_04: '0/8',
  inline_formatting_05: '0/6',
  inline_formatting_06: '0/8',
  inline_formatting_07: '0/8',
  inline_formatting_aligned_subtree: '0/5',
  letter_spacing: '0/26',
  position_01_normal_flow: '0/1',
  position_02_relative_positioning: '0/1',
  position_03_floating_a_box: '0/1',
  position_04_floating_a_box_sibling: '0/1',
  position_05_floating_a_box_clear: '0/1',
  position_06_absolute_positioning: '0/1',
  position_07_absolute_positioning_relative: '0/1',
  position_08_absolute_positioning_no_relative: '0/1',
  position_09_absolute_positioning_change_bars: '0/1',
  position_relative: '0/1',
  replaced_display: '0/22',
  shrink_to_fit_03: '0/16',
  stacking_context_01: '0/9',
  stacking_context_02: '0/4',
  table_01: '0/1',
  table_02: '0/9',
  table_03: '0/3',
  table_05: '0/1',
  table_inline: '0/1',
};

/**
 * Reach the real handle even when the original page extends below the viewport.
 * @param {string} handle Unchanged handle path.
 * @param {string} checkpoint Capture name.
 * @param {number} amount Horizontal pointer movement.
 */
function resize(handle, checkpoint, amount) {
  return [
    [ 'scroll', '0', '10000', '10000' ],
    [ 'hover', handle ], [ 'down' ], [ 'move-by', String(amount), '0' ],
    [ 'up' ], [ 'mouse', '-1', '-1' ], [ 'scroll', '0', '0', '0' ],
    [ 'capture', checkpoint ],
  ];
}

/**
 * Move a live upstream handle and capture after releasing the pointer.
 * @param {string} handle Unchanged handle path.
 * @param {string} checkpoint Capture name.
 * @param {number} x Horizontal pointer movement.
 * @param {number} y Vertical pointer movement.
 * @param {string} verb Pointer targeting operation.
 */
function move(handle, checkpoint, x, y, verb = 'hover') {
  return [
    [ verb, handle ], [ 'down' ], [ 'move-by', String(x), String(y) ],
    [ 'up' ], [ 'mouse', '-1', '-1' ], [ 'capture', checkpoint ],
  ];
}

const sequences = Object.fromEntries(Object.entries(resizers).map(
  ([ name, handle ]) => [ name, [
    ...resize(handle, 'resize-wide', 40),
    ...resize(handle, 'resize-narrow', -80),
    ...resize(handle, 'resize-restored', 40),
  ]]
));
sequences.inline_formatting_01.unshift([ 'size', '1280', '768' ]);
sequences.inline_formatting_01.push(
  [ 'size', '1024', '768' ], [ 'capture', 'viewport-restored' ]
);

for (const name of [ 'filter_blur_area', 'filter_blur_orb' ]) {
  sequences[name] = [
    ...move('0/1', 'effect-moved', 30, 20, 'hit'),
    ...move('0/1', 'effect-restored', -30, -20, 'hit'),
    ...move('0/0', 'background-moved', 20, 15, 'hit'),
    ...move('0/0', 'background-restored', -20, -15, 'hit'),
    [ 'property', '0/1', 'backdrop-filter', 'blur(8dp)' ],
    [ 'capture', 'blur-small' ],
    [ 'property', '0/1', 'backdrop-filter', 'blur(25dp)' ],
    [ 'capture', 'blur-restored' ],
  ];
}

sequences.clip_mask = [
  ...move('0/0/1', 'outer-moved', 30, 15, 'hit'),
  ...move('0/0/1', 'outer-restored', -30, -15, 'hit'),
  ...move('0/1/1', 'inner-moved', -100, -20, 'hit'),
  ...move('0/1/1/1', 'nested-moved', -20, -15, 'hit'),
  ...move('0/1/1/1', 'nested-restored', 20, 15, 'hit'),
  ...move('0/1/1', 'inner-restored', 100, 20, 'hit'),
];

for (const name of [
  'fractional-dimensions-01', 'fractional-dimensions-02',
  'fractional-dimensions-03',
]) {
  sequences[name] = [
    ...move('0/1', 'moved', 20, 15),
    ...move('0/1', 'restored', -20, -15),
    [ 'density', '1.25' ], [ 'capture', 'zoom-in' ],
    [ 'density', '0.75' ], [ 'capture', 'zoom-out' ],
    [ 'density', '1' ], [ 'capture', 'zoom-restored' ],
  ];
}

sequences.overflow_clip_transform = [
  ...Array.from({ length: 4 }, (_, index) => [
    ...move(`0/${index}/0`, `window-${index}-moved`, -20, -15, 'hit'),
    ...move(`0/${index}/0`, `window-${index}-restored`, 20, 15, 'hit'),
    ...move(`0/${index}/3`, `window-${index}-resized`, 30, 20, 'hit'),
    ...move(`0/${index}/3`, `window-${index}-size-restored`, -30, -20, 'hit'),
    [ 'scroll', `0/${index}/1`, '0', '10000' ],
    [ 'capture', `window-${index}-scrolled` ],
    [ 'scroll', `0/${index}/1`, '0', '0' ],
    [ 'capture', `window-${index}-scroll-restored` ],
  ]).flat(),
];

/**
 * Verify native keyboard editing, caret travel and unchanged control values.
 * @param {string[]} paths Original form control paths.
 */
function edit(paths) {
  return paths.flatMap((target, index) => [
    [ 'focus', target ], [ 'key', '89' ],
    [ 'capture', `input-${index}-home` ],
    [ 'text', ' xyz' ], [ 'capture', `input-${index}-typed` ],
    ...Array.from({ length: 4 }, () => [ 'key', '69' ]),
    [ 'key', '89' ], [ 'capture', `input-${index}-restored` ],
  ]);
}

sequences.text_alignment = edit(Array.from({ length: 12 },
  (_, index) => `0/${index}`));
sequences.text_input_overflow = edit(Array.from({ length: 11 },
  (_, index) => `0/${index}`));
sequences.replaced_elements = [
  [ 'scroll', '0', '0', '10000' ],
  ...edit([ '0/13', '0/14' ]),
];
sequences.flex_06 = [
  ...resize(resizers.flex_06, 'resize-wide', 40),
  ...resize(resizers.flex_06, 'resize-narrow', -70),
  ...resize(resizers.flex_06, 'resize-restored', 30),
  ...edit([ '0/1/2/0' ]),
];
sequences.replaced_display.push(...edit([
  '0/12', '0/14', '0/15', '0/16', '0/17/0/0', '0/18',
]));

for (const name of [ 'shader_conic_gradient', 'shader_radial_gradient' ]) {
  sequences[name] = [
    [ 'hover', '0/1/0' ], [ 'capture', 'button-hover' ],
    [ 'down' ], [ 'capture', 'button-active' ],
    [ 'up' ], [ 'capture', 'button-released' ],
    [ 'mouse', '-1', '-1' ], [ 'capture', 'button-out' ],
  ];
}
sequences.shader_conic_gradient.push(
  [ 'scroll', '0', '0', '10000' ], [ 'capture', 'spinner-base' ],
  [ 'advance', '1.07' ], [ 'capture', 'spinner-advanced' ],
  [ 'advance', '1.14' ], [ 'capture', 'spinner-next' ]
);
sequences.table_01.push(
  [ 'hover', '0/0/4/0' ], [ 'capture', 'row-hover' ],
  [ 'mouse', '-1', '-1' ], [ 'capture', 'row-out' ]
);
sequences.acid1 = [
  [ 'hover', '0/0/1/0/1/1/0/1' ], [ 'down' ], [ 'up' ],
  [ 'capture', 'radio-first' ],
  [ 'hover', '0/0/1/0/1/1/1/1' ], [ 'down' ], [ 'up' ],
  [ 'capture', 'radio-second' ],
];

module.exports = { sequences, resizers };
