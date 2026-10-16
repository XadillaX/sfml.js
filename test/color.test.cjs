'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const sf = require('..');
const { Color } = sf;
const native = require('../build/Release/sfml.node');
const {
  colorStorage, colorNative,
} = require('../dist/internal/value-storage');

const channels = color => [ color.r, color.g, color.b, color.a ];
const operations = [ 'add', 'subtract', 'multiply' ];

test('Color constructors preserve SFML defaults, channels and RGBA order',
  () => {
    assert.deepEqual(channels(new Color()), [ 0, 0, 0, 255 ]);
    assert.deepEqual(channels(new Color(18, 52, 86)), [ 18, 52, 86, 255 ]);
    assert.deepEqual(channels(new Color(18, 52, 86, 120)), [ 18, 52, 86, 120 ]);
    const color = new Color(0x12345678);
    assert.deepEqual(channels(color), [ 18, 52, 86, 120 ]);
    assert.equal(color.toInteger(), 0x12345678);
    assert.ok(color[colorStorage] instanceof Uint8Array);
    assert.equal(color[colorStorage].length, 4);
    assert.equal(color[colorStorage].buffer.byteLength, 4);
    const reference = new Color();
    for (const packed of [
      0, 255, 0xffffffff, 0x80000000, 0xabcdef01, -1, 4294967296,
    ]) {
      const value = new Color(packed);
      native.setColor(reference[colorNative], packed);
      assert.deepEqual(channels(value), channels(reference));
      assert.equal(value.toInteger(), native.readColor(reference[colorNative]));
    }
  });

test('Color channel writes use uint8 conversion, not clamped storage', () => {
  const color = new Color(-1, 256, 1.9, -2.9);
  assert.deepEqual(channels(color), [ 255, 0, 1, 254 ]);
  for (const field of [ 'r', 'g', 'b', 'a' ]) color[field] = 300;
  assert.deepEqual(channels(color), [ 44, 44, 44, 44 ]);
  assert.equal(color.toInteger(), 0x2c2c2c2c);
});

test('Color copies own four independent bytes; variables can alias', () => {
  const source = new Color(0x12345678);
  const copy = new Color(source);
  assert.notEqual(copy[colorStorage].buffer, source[colorStorage].buffer);
  assert.notEqual(copy[colorNative], source[colorNative]);
  assert.deepEqual(channels(copy), channels(source));
  source.r = 255;
  copy.a = 255;
  assert.equal(source.toInteger(), 0xff345678);
  assert.equal(copy.toInteger(), 0x123456ff);
  const alias = source;
  alias.g = 0;
  assert.equal(source.g, 0);
});

test('Color constants match SFML and resist setter and Assign writes', () => {
  const constants = native.colorConstants();
  assert.equal(Object.keys(constants).length, 9);
  for (const [ name, expected ] of Object.entries(constants)) {
    const color = Color[name];
    assert.equal(color.toInteger(), expected, name);
    assert.ok(Object.isFrozen(color), name);
    for (const field of [ 'r', 'g', 'b', 'a' ]) {
      assert.throws(() => { color[field] = 42; }, TypeError);
    }
    for (const operation of operations) {
      assert.throws(
        () => sf[`${operation}Assign`](color, Color.White), TypeError
      );
      const result = sf[operation](color, Color.Black);
      assert.ok(result instanceof Color);
      assert.equal(Object.isFrozen(result), false);
    }
    assert.equal(color.toInteger(), expected);
    const copy = new Color(color);
    copy.a = 42;
    assert.equal(color.toInteger(), expected);
  }
  const frozen = Object.freeze(new Color(1, 2, 3));
  assert.throws(() => { frozen.r = 0; }, TypeError);
  assert.throws(() => sf.addAssign(frozen, Color.Red), TypeError);
});

function compareWithSfml(left, right) {
  const before = [ left.toInteger(), right.toInteger() ];
  const expected = native.evaluateColor(left[colorNative], right[colorNative]);
  assert.equal(left.toInteger(), expected.toInteger);
  for (const operation of operations) {
    const result = sf[operation](left, right);
    assert.ok(result instanceof Color);
    assert.equal(result.toInteger(), expected[operation], operation);
    assert.equal(native.readColor(result[colorNative]), expected[operation]);
    assert.notEqual(result[colorStorage].buffer, left[colorStorage].buffer);
    assert.notEqual(result[colorStorage].buffer, right[colorStorage].buffer);
    const copy = new Color(left);
    const handle = copy[colorNative];
    const view = copy[colorStorage];
    const method = `${operation}Assign`;
    assert.equal(sf[method](copy, right), copy);
    assert.equal(copy[colorStorage], view);
    assert.equal(copy[colorNative], handle);
    assert.equal(copy.toInteger(), expected[method], method);
  }
  assert.equal(sf.equal(left, right), Boolean(expected.equal));
  assert.equal(sf.notEqual(left, right), Boolean(expected.notEqual));
  assert.deepEqual([ left.toInteger(), right.toInteger() ], before);
}

test('all Color operators match native SFML for boundaries and random values',
  () => {
    for (const [ left, right ] of [
      [ 0, 0 ], [ 0xffffffff, 0xffffffff ], [ 0x00010203, 0xfffefdfc ],
      [ 0x80808080, 0x80808080 ], [ 0x12345678, 0x12345678 ],
      [ 0x12345600, 0x123456ff ], [ 0xf0e0d0c0, 0x20304050 ],
    ]) {
      compareWithSfml(new Color(left), new Color(right));
    }
    let state = 0x12345678;
    const next = () => {
      state = (1664525 * state + 1013904223) % 4294967296;
      return state;
    };
    for (let index = 0; index < 128; index++) {
      compareWithSfml(new Color(next()), new Color(next()));
    }
    assert.deepEqual(channels(sf.multiply(
      new Color(128, 128, 128, 128), new Color(128, 128, 128, 128)
    )), [ 64, 64, 64, 64 ]);
  });

test('Color Assign matches C++ for all 65536 possible channel pairs', () => {
  const left = new Color();
  const right = new Color();
  const result = new Color();
  for (let a = 0; a < 256; a++) {
    left[colorStorage].set([ a, 255 - a, a, 255 - a ]);
    for (let b = 0; b < 256; b++) {
      right[colorStorage].set([ b, b, 255 - b, 255 - b ]);
      const expected = native.evaluateColor(
        left[colorNative], right[colorNative]
      );
      for (const operation of operations) {
        result[colorStorage].set(left[colorStorage]);
        sf[`${operation}Assign`](result, right);
        assert.equal(result.toInteger(), expected[operation],
          `${operation}(${a}, ${b})`);
      }
    }
  }
});

test('Color Assign supports identical left and right operands', () => {
  for (const operation of operations) {
    const value = new Color(10, 128, 200, 255);
    const expected = sf[operation](value, value).toInteger();
    assert.equal(sf[`${operation}Assign`](value, value), value);
    assert.equal(value.toInteger(), expected);
  }
});

test('Color property access, comparisons and Assign never call native', () => {
  const left = new Color(1, 2, 3, 4);
  const right = new Color(5, 6, 7, 8);
  const originals = Object.entries(native).filter(
    ([ , value ]) => typeof value === 'function'
  );
  for (const [ name ] of originals) {
    native[name] = () => assert.fail(`unexpected native call: ${name}`);
  }
  try {
    left.r = 200;
    left.g = 100;
    left.b = 50;
    left.a = 255;
    assert.equal(left.toInteger(), 0xc86432ff);
    assert.equal(sf.equal(left, right), false);
    assert.equal(sf.notEqual(left, right), true);
    for (const operation of operations) {
      assert.equal(sf[`${operation}Assign`](left, right), left);
    }
  } finally {
    for (const [ name, fn ] of originals) native[name] = fn;
  }
});

test('Color construction and ordinary operators need no native owner',
  () => {
    const source = new Color(1, 2, 3);
    const original = native.createColor;
    let calls = 0;
    native.createColor = () => {
      calls++;
      return original();
    };
    try {
      for (const create of [
        () => new Color(), () => new Color(0xff0000ff),
        () => new Color(1, 2, 3), () => new Color(source),
        ...operations.map(name => () => sf[name](source, Color.White)),
      ]) {
        calls = 0;
        create();
        assert.equal(calls, 0);
      }
    } finally {
      native.createColor = original;
    }
  });

test('Color rejects unsupported operations and mixed value kinds', () => {
  const color = new Color(1, 2, 3, 4);
  const before = color.toInteger();
  for (const other of [
    new sf.Angle(), new sf.Vector2i(), new sf.Vector3f(),
    {}, null, new Uint8Array(4),
  ]) {
    for (const method of [
      ...operations, 'addAssign', 'subtractAssign', 'multiplyAssign',
      'equal', 'notEqual',
    ]) {
      assert.throws(() => sf[method](color, other), TypeError);
      assert.throws(() => sf[method](other, color), TypeError);
    }
  }
  for (const method of [
    'multiply', 'multiplyAssign', 'divide', 'divideAssign',
  ]) {
    assert.throws(() => sf[method](color, 2), TypeError);
  }
  assert.throws(() => sf.multiply(2, color), TypeError);
  assert.throws(() => sf.negate(color), TypeError);
  for (const method of [
    'divide', 'modulo', 'moduloAssign', 'less', 'lessEqual',
    'greater', 'greaterEqual',
  ]) {
    assert.throws(() => sf[method](color, color), TypeError);
  }
  assert.equal(color.toInteger(), before);
  assert.throws(() => new Color(1, 2), TypeError);
  assert.throws(() => new Color({ r: 1, g: 2, b: 3, a: 4 }), TypeError);
});
