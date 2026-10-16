'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Vector2, Vector2i, Vector2u, Vector2f } = require('..');
const native = require('../build/Release/sfml.node');
const {
  vector2Storage, vector2Native,
} = require('../dist/internal/value-storage');

const scalarMethods = [ 'lengthSquared', 'dot', 'cross' ];
const vectorMethods = [
  'perpendicular', 'componentWiseMul', 'componentWiseDiv',
];
const binaryMethods = [
  'dot', 'cross', 'componentWiseMul', 'componentWiseDiv',
];
const coordinates = vector => [ vector.x, vector.y ];
const buffer = vector => vector[vector2Storage].buffer;
const handle = vector => vector[vector2Native];

function compareWithSfml(lhs, rhs) {
  const before = [ coordinates(lhs), coordinates(rhs) ];
  const expected = native.evaluateVector2(handle(lhs), handle(rhs));
  for (const method of scalarMethods) {
    assert.equal(lhs[method](rhs), expected[method], method);
  }
  for (const method of vectorMethods) {
    const result = lhs[method](rhs);
    assert.equal(result.constructor, lhs.constructor, method);
    assert.equal(result.scalarType, lhs.scalarType, method);
    assert.notEqual(buffer(result), buffer(lhs), method);
    assert.notEqual(buffer(result), buffer(rhs), method);
    assert.deepEqual(coordinates(result), expected[method], method);
    assert.deepEqual(
      native.readVector2(handle(result)), expected[method], method
    );
    result.x = 123;
    native.swapVector2(handle(result));
    assert.equal(result.y, 123, method);
  }
  assert.deepEqual([ coordinates(lhs), coordinates(rhs) ], before);
}

// Keep signed products, sums and differences strictly within int32 range.
const signedCases = [
  [[ 0, 0 ], [ 1, -1 ]],
  [[ 3, 4 ], [ 2, 3 ]],
  [[ -7, 11 ], [ 3, -4 ]],
  [[ -20000, 20000 ], [ 20000, -20000 ]],
];
const unsignedCases = [
  [[ 0, 0 ], [ 1, 1 ]],
  [[ 3, 4 ], [ 2, 3 ]],
  [[ 0xffffffff, 0xfffffffe ], [ 0xfffffffd, 0xffffffff ]],
  [[ 0x80000001, 0x7fffffff ], [ 0x7fffffff, 0x80000001 ]],
];
const floatCases = [
  [[ 0, -0 ], [ 1, -1 ]],
  [[ 0.1, -0.2 ], [ 0.3, -0.7 ]],
  [[ 4097, -16785408 ], [ 4097, 1 ]],
  [[ 4097, 16785408 ], [ 1, 4097 ]],
  [[ 3e38, -3e38 ], [ 2, -2 ]],
  [[ 1e-40, -1e-38 ], [ 3, -7 ]],
];

for (const [ type, Constructor, cases ] of [
  [ 'i32', Vector2i, signedCases ],
  [ 'u32', Vector2u, unsignedCases ],
  [ 'f32', Vector2f, floatCases ],
]) {
  test(`${type}: six operations match native SFML`, () => {
    for (const [ lhs, rhs ] of cases) {
      compareWithSfml(new Constructor(...lhs), new Constructor(...rhs));
      compareWithSfml(
        new Vector2(type, ...lhs), new Vector2(type, ...rhs)
      );
    }
  });

  test(`${type}: deterministic samples match native SFML`, () => {
    let state = 0x12345678;
    function next() {
      state = (1664525 * state + 1013904223) % 4294967296;
      if (type === 'u32') return state || 1;
      const bounded = state % 40001 - 20000;
      return (type === 'f32' ? bounded / 37 : bounded) || 1;
    }
    for (let index = 0; index < 64; index++) {
      compareWithSfml(
        new Constructor(next(), next()), new Constructor(next(), next())
      );
    }
  });

  test(`${type}: division rejects a zero component`, () => {
    const lhs = new Constructor(3, 4);
    for (const pair of [[ 0, 1 ], [ 1, 0 ], [ -0, 0 ]]) {
      const rhs = new Constructor(...pair);
      assert.throws(() => lhs.componentWiseDiv(rhs), RangeError);
      assert.throws(
        () => native.evaluateVector2(handle(lhs), handle(rhs)),
        RangeError
      );
      assert.deepEqual(coordinates(lhs), [ 3, 4 ]);
    }
  });
}

test('f32 dot and cross round products before addition or subtraction', () => {
  const dotLhs = new Vector2f(4097, -16785408);
  const dotRhs = new Vector2f(4097, 1);
  assert.equal(dotLhs.dot(dotRhs), 0);
  assert.equal(Math.fround(
    dotLhs.x * dotRhs.x + dotLhs.y * dotRhs.y
  ), 1);
  const crossLhs = new Vector2f(4097, 16785408);
  const crossRhs = new Vector2f(1, 4097);
  assert.equal(crossLhs.cross(crossRhs), 0);
  assert.equal(Math.fround(
    crossLhs.x * crossRhs.y - crossLhs.y * crossRhs.x
  ), 1);
});

test('binary operations reject mixed scalar types', () => {
  const vectors = [
    new Vector2i(3, 4), new Vector2u(3, 4), new Vector2f(3, 4),
  ];
  for (const lhs of vectors) {
    for (const rhs of vectors) {
      if (lhs.scalarType === rhs.scalarType) continue;
      for (const method of binaryMethods) {
        assert.throws(() => lhs[method](rhs), TypeError);
      }
      assert.throws(
        () => native.evaluateVector2(handle(lhs), handle(rhs)),
        TypeError
      );
    }
  }
});

test('native arithmetic rejects buffers in place of handles', () => {
  const valid = handle(new Vector2i(3, 4));
  assert.throws(
    () => native.evaluateVector2(new ArrayBuffer(8), valid), TypeError
  );
  assert.throws(
    () => native.evaluateVector2(valid, new ArrayBuffer(8)), TypeError
  );
});
