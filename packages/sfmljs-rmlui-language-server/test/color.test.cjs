'use strict';

const assert = require('node:assert');
const {
  findColors,
  formatHex,
  formatRgba,
} = require('../dist/util/color');

const text = [
  'color: #f00;',
  'background: #ff000080;',
  'border-color: rgb(10, 20, 30);',
  'caret-color: hsl(120, 100%, 50%);',
  'image-color: red;',
].join('\n');

const colors = findColors(text);
assert.strictEqual(colors.length, 5);

const hex3 = colors[0];
assert.strictEqual(hex3.color.r, 255);
assert.strictEqual(hex3.color.a, 1);

const hex8 = colors[1];
assert.strictEqual(hex8.color.r, 255);
assert.ok(Math.abs(hex8.color.a - 0.502) < 0.01);

const rgb = colors[2];
assert.strictEqual(rgb.color.g, 20);

const hsl = colors[3];
assert.strictEqual(hsl.color.g, 255);
assert.strictEqual(hsl.color.r, 0);

const named = colors[4];
assert.strictEqual(named.color.r, 255);

assert.strictEqual(
  formatHex({ r: 255, g: 0, b: 0, a: 1 }),
  '#ff0000ff'
);
assert.match(
  formatRgba({ r: 255, g: 0, b: 0, a: 0.5 }),
  /^rgba\(255, 0, 0, 0\.50\)$/
);

console.log('color tests passed');
