'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const {
  angleStorage, angleNative, vector3Storage, vector3Native,
  vector2Storage, vector2Native,
} = require('../dist/internal/value-storage');

const binary = [ 'add', 'subtract' ];
const assign = [ 'addAssign', 'subtractAssign' ];
const comparisons = [
  'equal', 'notEqual', 'less', 'lessEqual', 'greater', 'greaterEqual',
];
const storage = value => value[angleStorage] ??
  value[vector2Storage] ?? value[vector3Storage];
const coordinates = value => [ ...storage(value) ];
const handle = value => value[angleNative] ??
  value[vector2Native] ?? value[vector3Native];

// JS transcendental functions use double precision; SFML calls the system's
// float libm. Allow a small relative/absolute error for trig, not arithmetic.
function near(actual, expected, label) {
  if (Array.isArray(expected)) {
    expected.forEach((value, index) => near(actual[index], value, label));
  } else if (Number.isNaN(expected)) {
    assert.ok(Number.isNaN(actual), label);
  } else if (!Number.isFinite(expected)) {
    assert.equal(actual, expected, label);
  } else {
    const tolerance = 4e-6 * Math.max(1, Math.abs(expected));
    assert.ok(Math.abs(actual - expected) <= tolerance,
      `${label}: ${actual} != ${expected}`);
  }
}

function checkOperators(lhs, rhs, expected) {
  const original = coordinates(lhs);
  for (const method of [ ...binary, 'negate', 'multiply', 'divide' ]) {
    const operand = method === 'multiply' || method === 'divide' ? 3 : rhs;
    const result = sf[method](lhs, operand);
    assert.equal(result.constructor, lhs.constructor, method);
    assert.notEqual(storage(result).buffer, storage(lhs).buffer, method);
    const actual = lhs instanceof sf.Angle
      ? result.asRadians() : coordinates(result);
    assert.deepEqual(actual, expected[method], method);
  }
  const leftScaled = sf.multiply(3, lhs);
  assert.deepEqual(lhs instanceof sf.Angle
    ? leftScaled.asRadians() : coordinates(leftScaled),
  expected.leftMultiply);
  for (const method of [ ...assign, 'multiplyAssign', 'divideAssign' ]) {
    const value = lhs instanceof sf.Angle ? new sf.Angle(lhs)
      : new lhs.constructor(lhs);
    const originalHandle = handle(value);
    const originalStorage = storage(value);
    const operand = method === 'multiplyAssign' ||
      method === 'divideAssign' ? 3 : rhs;
    assert.equal(sf[method](value, operand), value);
    assert.equal(handle(value), originalHandle);
    assert.equal(storage(value), originalStorage);
    assert.deepEqual(lhs instanceof sf.Angle
      ? value.asRadians() : coordinates(value), expected[method], method);
  }
  assert.deepEqual(coordinates(lhs), original);
  assert.equal(sf.equal(lhs, rhs), Boolean(expected.equal));
  assert.equal(sf.notEqual(lhs, rhs), Boolean(expected.notEqual));
}

test('Angle factories, wrapping and every operator match native SFML', () => {
  const pi = Math.fround(Math.PI);
  const inputs = [
    0, -0, pi, -pi, 2 * pi, -2 * pi, 0.1, -0.1, 720, -720,
    12345.678, -9876.54,
  ];
  for (let index = 0; index < 80; index++) {
    inputs.push(Math.fround((index - 40) * 918.271));
  }
  for (const input of inputs) {
    const lhs = sf.radians(input);
    const rhs = sf.degrees(90);
    const expected = native.evaluateAngle(
      lhs.asRadians(), rhs.asRadians(), 3
    );
    assert.equal(lhs.asDegrees(), expected.asDegrees);
    assert.equal(sf.degrees(input).asRadians(), expected.degrees);
    assert.equal(lhs.wrapSigned().asRadians(), expected.wrapSigned);
    assert.equal(lhs.wrapUnsigned().asRadians(), expected.wrapUnsigned);
    checkOperators(lhs, rhs, expected);
    assert.equal(sf.divide(lhs, rhs), expected.ratio);
    assert.equal(sf.modulo(lhs, rhs).asRadians(), expected.modulo);
    const copy = new sf.Angle(lhs);
    assert.equal(sf.moduloAssign(copy, rhs), copy);
    assert.equal(copy.asRadians(), expected.moduloAssign);
    for (const comparison of comparisons) {
      assert.equal(sf[comparison](lhs, rhs), Boolean(expected[comparison]));
    }
  }
});

test('Angle is a float32 value, comparisons do not implicitly wrap', () => {
  assert.equal(new sf.Angle().asRadians(), 0);
  assert.equal(sf.radians(0.1).asRadians(), Math.fround(0.1));
  assert.ok(Object.is(sf.radians(-0).asRadians(), -0));
  assert.equal(sf.equal(sf.degrees(0), sf.degrees(360)), false);
  assert.equal(sf.equal(sf.radians(-0), sf.Angle.Zero), true);
  for (const comparison of comparisons) {
    assert.equal(sf[comparison](sf.radians(NaN), sf.Angle.Zero),
      comparison === 'notEqual');
  }
});

test('Angle rejects invalid divisors and protects Zero from assignment', () => {
  for (const method of [
    ...assign, 'multiplyAssign', 'divideAssign', 'moduloAssign',
  ]) {
    const operand = method === 'multiplyAssign' ||
      method === 'divideAssign' ? 3 : sf.degrees(90);
    assert.throws(() => sf[method](sf.Angle.Zero, operand), TypeError);
  }
  const value = sf.degrees(45);
  for (const divisor of [ 0, -0, 1e-50 ]) {
    assert.throws(() => sf.divide(value, divisor), RangeError);
    assert.throws(() => sf.divideAssign(value, divisor), RangeError);
    assert.throws(() => sf.divide(value, sf.radians(divisor)), RangeError);
  }
  for (const divisor of [ 0, -1, NaN ]) {
    assert.throws(() => sf.modulo(value, sf.radians(divisor)), RangeError);
    assert.throws(
      () => sf.moduloAssign(value, sf.radians(divisor)), RangeError
    );
  }
  assert.equal(value.asRadians(), sf.degrees(45).asRadians());
  for (const input of [ Infinity, -Infinity, NaN, 1e30 ]) {
    assert.throws(() => sf.radians(input).wrapUnsigned(), RangeError);
    assert.throws(() => sf.radians(input).wrapSigned(), RangeError);
  }
  const mutableZero = new sf.Angle(sf.Angle.Zero);
  sf.addAssign(mutableZero, sf.degrees(90));
  assert.equal(sf.Angle.Zero.asRadians(), 0);
});

for (const [ dimension, Constructors ] of [
  [ 2, [ sf.Vector2i, sf.Vector2u, sf.Vector2f ]],
  [ 3, [ sf.Vector3i, sf.Vector3u, sf.Vector3f ]],
]) {
  for (const Constructor of Constructors) {
    test(`${Constructor.name}: methods and operators match C++ samples`, () => {
      let state = 0x12345678;
      const type = new Constructor().scalarType;
      function next() {
        state = (1664525 * state + 1013904223) % 4294967296;
        if (type === 'u32') return state || 1;
        const integer = state % 40001 - 20000;
        return (type === 'f32' ? integer / 37 : integer) || 1;
      }
      for (let index = 0; index < 64; index++) {
        const lhs = new Constructor(
          ...Array.from({ length: dimension }, next)
        );
        const rhs = new Constructor(
          ...Array.from({ length: dimension }, next)
        );
        const expected = native[`evaluateVector${dimension}`](
          handle(lhs), handle(rhs)
        );
        checkOperators(lhs, rhs, expected);
        for (const method of [ 'lengthSquared', 'dot' ]) {
          assert.equal(lhs[method](rhs), expected[method], method);
        }
        for (const method of [
          'cross', 'componentWiseMul', 'componentWiseDiv',
        ]) {
          const result = lhs[method](rhs);
          assert.deepEqual(typeof result === 'number'
            ? result : coordinates(result), expected[method], method);
        }
        if (type === 'f32') {
          assert.equal(lhs.length(), expected.length);
          assert.deepEqual(coordinates(lhs.normalized()), expected.normalized);
          if (dimension === 2) {
            near(lhs.angle().asRadians(), expected.angle, 'angle');
            near(lhs.angleTo(rhs).asRadians(), expected.angleTo, 'angleTo');
            near(coordinates(lhs.rotatedBy(sf.degrees(37))),
              expected.rotatedBy, 'rotatedBy');
            near(coordinates(new sf.Vector2f(lhs.x, sf.degrees(37))),
              expected.polar, 'polar');
            assert.deepEqual(coordinates(lhs.projectedOnto(rhs)),
              expected.projectedOnto);
          }
        }
      }
    });

    test(`${Constructor.name}: zero divisors and alias assignment`, () => {
      const value = new Constructor(...Array(dimension).fill(3));
      for (const divisor of [ 0, -0 ]) {
        assert.throws(() => sf.divide(value, divisor), RangeError);
        assert.throws(() => sf.divideAssign(value, divisor), RangeError);
      }
      for (let index = 0; index < dimension; index++) {
        const axis = new Constructor(...Array(dimension).fill(1));
        storage(axis)[index] = 0;
        assert.throws(() => value.componentWiseDiv(axis), RangeError);
      }
      assert.equal(sf.addAssign(value, value), value);
      assert.deepEqual(coordinates(value), Array(dimension).fill(6));
      assert.equal(sf.subtractAssign(value, value), value);
      assert.deepEqual(coordinates(value), Array(dimension).fill(0));
    });
  }
}

test('Vector2 float operations cover quadrants, zero and underflow', () => {
  for (const pair of [[ 1, 0 ], [ 0, 1 ], [ -1, 0 ], [ 0, -1 ]]) {
    const value = new sf.Vector2f(...pair);
    assert.equal(value.angle().asRadians(),
      Math.fround(Math.atan2(pair[1], pair[0])));
    const polar = new sf.Vector2('f32', 2, value.angle());
    near(coordinates(polar), pair.map(x => x * 2), 'polar quadrants');
  }
  const zero = new sf.Vector2f();
  assert.throws(() => zero.angle(), RangeError);
  assert.throws(() => zero.angleTo(new sf.Vector2f(1, 1)), RangeError);
  assert.throws(() => new sf.Vector2f(1, 1).angleTo(zero), RangeError);
  assert.throws(() => zero.projectedOnto(zero), RangeError);
  assert.ok(sf.equal(zero.rotatedBy(sf.degrees(90)), zero));
  for (const Constructor of [ sf.Vector2f, sf.Vector3f ]) {
    assert.throws(() => new Constructor().normalized(), RangeError);
    const tiny = new Constructor();
    tiny.x = 1e-30;
    assert.throws(() => tiny.normalized(), RangeError);
  }
});

test('Vector3 dot rounds its first sum before adding the third product', () => {
  const lhs = new sf.Vector3f(16777216, 1, -16777216);
  const rhs = new sf.Vector3f(1, 1, 1);
  assert.equal(lhs.dot(rhs), 0);
  assert.equal(native.evaluateVector3(handle(lhs), handle(rhs)).dot, 0);
  assert.equal(Math.fround(lhs.x + lhs.y + lhs.z), 1);
});

test('float vector arithmetic matches C++ at signed-zero and range edges',
  () => {
    const inputs = [
      [ 0, -0, 0 ], [ 0.1, -0.2, 0.3 ], [ 3e38, -3e38, 3e38 ],
      [ 1e-40, -1e-38, 1e-39 ], [ Infinity, 1, -Infinity ], [ NaN, 1, 2 ],
    ];
    for (const [ dimension, Constructor ] of [
      [ 2, sf.Vector2f ], [ 3, sf.Vector3f ],
    ]) {
      for (const input of inputs) {
        const lhs = new Constructor(...input.slice(0, dimension));
        const rhs = new Constructor(...[ 2, -3, 4 ].slice(0, dimension));
        const expected = native[`evaluateVector${dimension}`](
          handle(lhs), handle(rhs)
        );
        checkOperators(lhs, rhs, expected);
        assert.equal(lhs.length(), expected.length);
        if (expected.normalized) {
          assert.deepEqual(coordinates(lhs.normalized()), expected.normalized);
        }
      }
    }
  });

test('scalar operands convert to the vector scalar type before arithmetic',
  () => {
    const integer = new sf.Vector3i(9, 12, 15);
    assert.deepEqual(coordinates(sf.multiply(integer, 2.9)), [ 18, 24, 30 ]);
    assert.deepEqual(coordinates(sf.divide(integer, 2.9)), [ 4, 6, 7 ]);
    assert.throws(() => sf.divideAssign(integer, 0.9), RangeError);
    assert.deepEqual(coordinates(integer), [ 9, 12, 15 ]);
    assert.throws(() => sf.divide(new sf.Vector2u(1, 2), 4294967296),
      RangeError);
    const float = new sf.Vector3f(3, 6, 9);
    assert.deepEqual(coordinates(sf.multiply(float, 1 + 1e-9)), [ 3, 6, 9 ]);
    assert.throws(() => sf.divide(float, 1e-50), RangeError);
  });

test('runtime rejects scalar/dimension mixing and integer float-only APIs',
  () => {
    const values = [
      new sf.Vector2i(1, 2), new sf.Vector2u(1, 2),
      new sf.Vector2f(1, 2), new sf.Vector3i(1, 2, 3),
      new sf.Vector3u(1, 2, 3), new sf.Vector3f(1, 2, 3), sf.degrees(1),
    ];
    for (const lhs of values) {
      for (const rhs of values) {
        if (lhs.constructor === rhs.constructor) continue;
        for (const method of [
          ...binary, ...assign, 'equal', 'notEqual', 'multiply', 'divide',
        ]) {
          assert.throws(() => sf[method](lhs, rhs), TypeError);
        }
        if (!(lhs instanceof sf.Angle)) {
          for (const method of [
            'dot', 'cross', 'componentWiseMul', 'componentWiseDiv',
          ]) {
            assert.throws(() => lhs[method](rhs), TypeError);
          }
        }
      }
      if (lhs.scalarType && lhs.scalarType !== 'f32') {
        assert.throws(() => lhs.length(), TypeError);
        assert.throws(() => lhs.normalized(), TypeError);
        if (lhs instanceof sf.Vector2) {
          assert.throws(() => lhs.angle(), TypeError);
          assert.throws(() => lhs.angleTo(lhs), TypeError);
          assert.throws(() => lhs.rotatedBy(sf.Angle.Zero), TypeError);
          assert.throws(() => lhs.projectedOnto(lhs), TypeError);
        }
      }
    }
    assert.throws(() => new sf.Vector2i(2, sf.degrees(30)), TypeError);
    assert.throws(() => new sf.Vector2('u32', 2, sf.degrees(30)), TypeError);
  });

test('Assign operators neither allocate a native value nor enter NAN', () => {
  const values = [
    sf.degrees(10), new sf.Vector2f(2, 3), new sf.Vector3u(2, 3, 4),
  ];
  const modulus = sf.degrees(90);
  const originals = Object.entries(native).filter(
    ([ , value ]) => typeof value === 'function'
  );
  const fail = () => assert.fail('Assign must reuse existing native storage');
  for (const [ key ] of originals) native[key] = fail;
  try {
    for (const value of values) {
      sf.addAssign(value, value);
      sf.subtractAssign(value, value);
      sf.multiplyAssign(value, 3);
      sf.divideAssign(value, 3);
    }
    sf.moduloAssign(values[0], modulus);
  } finally {
    for (const [ key, value ] of originals) native[key] = value;
  }
});
