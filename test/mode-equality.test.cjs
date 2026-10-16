'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const sf = require('..');
const native = require('../build/Release/sfml.node');

const blendFields = [
  'colorSrcFactor', 'colorDstFactor', 'colorEquation',
  'alphaSrcFactor', 'alphaDstFactor', 'alphaEquation',
];
const stencilFields = [
  'stencilComparison', 'stencilUpdateOperation',
  'stencilReference', 'stencilMask', 'stencilOnly',
];
const blendData = mode =>
  new Uint32Array(blendFields.map(field => mode[field]));
const stencilData = mode => new Uint32Array([
  mode.stencilComparison, mode.stencilUpdateOperation,
  mode.stencilReference.value, mode.stencilMask.value, Number(mode.stencilOnly),
]);

function compare(left, right, expected) {
  assert.deepEqual([ sf.equal(left, right), sf.notEqual(left, right) ],
    expected);
  assert.deepEqual([ sf.equal(right, left), sf.notEqual(right, left) ],
    expected);
}

test('BlendMode equality matches SFML for presets and every field', () => {
  const modes = [
    sf.BlendAlpha, sf.BlendAdd, sf.BlendMultiply,
    sf.BlendMin, sf.BlendMax, sf.BlendNone,
  ];
  for (const left of modes) {
    for (const right of [ ...modes, new sf.BlendMode(left) ]) {
      compare(left, right, native.compareBlendModes(
        blendData(left), blendData(right)));
    }
    for (const field of blendFields) {
      const limit = field.endsWith('Equation') ? 5 : 10;
      for (let value = 0; value < limit; value++) {
        const right = new sf.BlendMode(left);
        right[field] = value;
        compare(left, right, native.compareBlendModes(
          blendData(left), blendData(right)));
      }
    }
  }
});

test('StencilMode equality matches SFML by value, including unsigned masks',
  () => {
    const left = new sf.StencilMode();
    const values = [
      Array.from({ length: 8 }, (_, i) => i),
      Array.from({ length: 6 }, (_, i) => i),
      [ 0, 1, 0x7fffffff, 0x80000000, 0xffffffff ],
      [ 0, 1, 0x7fffffff, 0x80000000, 0xffffffff ],
      [ false, true ],
    ];
    compare(left, new sf.StencilMode(left), [ true, false ]);
    for (const [ i, field ] of stencilFields.entries()) {
      for (const value of values[i]) {
        const right = new sf.StencilMode({ ...left, [field]: value });
        compare(left, right, native.compareStencilModes(
          stencilData(left), stencilData(right)));
      }
    }
    const signed = new sf.StencilMode({
      stencilReference: -1, stencilMask: -0x80000000,
    });
    const unsigned = new sf.StencilMode({
      stencilReference: 0xffffffff, stencilMask: 0x80000000,
    });
    assert.notEqual(signed.stencilReference, unsigned.stencilReference);
    compare(signed, unsigned, [ true, false ]);
    unsigned.stencilReference.value = 1;
    compare(signed, unsigned, native.compareStencilModes(
      stencilData(signed), stencilData(unsigned)));
  });

test('Mode equality accepts readonly defaults and rejects mixed types in JS',
  t => {
    const blend = new sf.BlendMode();
    const stencil = new sf.StencilMode();
    const frozenStencil = Object.freeze(new sf.StencilMode({
      stencilReference: Object.freeze(new sf.StencilValue(0)),
    }));
    const calls = [];
    for (const [ name, fn ] of Object.entries(native)) {
      if (typeof fn === 'function') {
        t.mock.method(native, name, (...args) => {
          calls.push(name);
          return fn(...args);
        });
      }
    }
    compare(blend, sf.RenderStates.Default.blendMode, [ true, false ]);
    compare(stencil, sf.RenderStates.Default.stencilMode, [ true, false ]);
    compare(stencil, frozenStencil, [ true, false ]);
    for (const mode of [ blend, stencil ]) {
      for (const other of [
        mode === blend ? stencil : blend,
        sf.Color.White, new sf.Transform(), {}, { ...mode }, null, 0,
      ]) {
        for (const compareMode of [ sf.equal, sf.notEqual ]) {
          assert.throws(() => compareMode(mode, other), TypeError);
          assert.throws(() => compareMode(other, mode), TypeError);
        }
      }
    }
    assert.deepEqual(calls, []);
  });
