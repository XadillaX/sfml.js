'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const sf = require('../dist');
const native = require('../build/Release/sfml.node');
const {
  Time, seconds, milliseconds, microseconds,
  add, subtract, negate, multiply, divide, modulo,
  addAssign, subtractAssign, multiplyAssign, divideAssign, moduloAssign,
} = sf;
const min = -(2n ** 63n);
const max = 2n ** 63n - 1n;

test('Time constructs signed microseconds and independent copies', () => {
  assert.equal(new Time().asMicroseconds(), 0n);
  assert.equal(Time.Zero.asMicroseconds(), 0n);
  for (const value of [ min, max, -9007199254740993n, 9007199254740993n ]) {
    const original = new Time(value);
    const copy = new Time(original);
    assert.notEqual(original, copy);
    assert.equal(copy.toDuration(), value);
    assert.equal(microseconds(value).asMicroseconds(), value);
  }
  const source = microseconds(123n);
  const copy = new Time(source);
  addAssign(source, microseconds(1n));
  assert.equal(copy.asMicroseconds(), 123n);
});

test('Time factories match SFML float32 and signed int32 conversions', () => {
  const amounts = [
    0, -0, 0.1, -0.1, 1 / 3, 1.000001, 0.0000019, -0.0000019,
    1e-50, -1e-50, 123456.789, -123456.789, 1e12, -1e12,
  ];
  for (let i = -100; i <= 100; i++) amounts.push(i / 17);
  for (const amount of amounts) {
    assert.equal(seconds(amount).asMicroseconds(),
      native.timeFromSeconds(amount), `seconds(${amount})`);
  }
  for (const amount of [ 0, -0, 1, -1, 1.9, -1.9, -2147483648, 2147483647 ]) {
    assert.equal(milliseconds(amount).asMicroseconds(),
      native.timeFromMilliseconds(amount), `milliseconds(${amount})`);
  }
});

test('Time conversions and native roundtrips preserve all int64 bits', () => {
  const values = [ 0n, -1n, 1n, -1999n, 1999n, min, max ];
  let state = 123456789n;
  for (let i = 0; i < 300; i++) {
    state = BigInt.asIntN(64, state * 6364136223846793005n + 1n);
    values.push(state);
  }
  // Midpoints expose BigInt -> double -> float double-rounding errors.
  for (let exponent = 24n; exponent <= 62n; exponent++) {
    const midpoint = 2n ** exponent + 2n ** (exponent - 24n);
    for (const offset of [ -1n, 0n, 1n ]) {
      values.push(midpoint + offset, -(midpoint + offset));
    }
  }
  for (const value of values) {
    const time = new Time(value);
    const expected = native.inspectTime(value);
    assert.equal(time.asSeconds(), expected.seconds, `${value} seconds`);
    assert.equal(time.asMilliseconds(), expected.milliseconds);
    assert.equal(time.asMicroseconds(), expected.microseconds);
    assert.equal(time.toDuration(), expected.duration);
    assert.equal(expected.zero, 0n);
  }
  assert.equal(microseconds(2147483648000n).asMilliseconds(), -2147483648);
  assert.equal(microseconds(-1999n).asMilliseconds(), -1);
});

for (const scalar of [ 3n, -3n, 100000n, 3, -3, 0.1, -0.1, 0.0001, 10000 ]) {
  test(`Time arithmetic matches C++ for ${String(scalar)} (${typeof scalar})`,
    () => {
      for (const [ a, b ] of [
        [ 0n, 3n ], [ 1000001n, 3n ], [ -1000001n, 3n ],
        [ 1000001n, -3n ], [ -999999999999n, -123456789n ], [ 7n, 7n ],
      ]) {
        const lhs = microseconds(a);
        const rhs = microseconds(b);
        const expected = native.evaluateTime(a, b, scalar);
        const actual = {
          add: add(lhs, rhs),
          subtract: subtract(lhs, rhs),
          negate: negate(lhs),
          multiply: multiply(lhs, scalar),
          leftMultiply: multiply(scalar, lhs),
          divide: divide(lhs, scalar),
          modulo: modulo(lhs, rhs),
        };
        for (const [ name, result ] of Object.entries(actual)) {
          assert.ok(result instanceof Time);
          assert.notEqual(result, lhs);
          assert.equal(result.asMicroseconds(), expected[name], name);
        }
        assert.equal(divide(lhs, rhs), expected.ratio);
        for (const name of [
          'equal', 'notEqual', 'less', 'lessEqual', 'greater', 'greaterEqual',
        ]) {
          assert.equal(sf[name](lhs, rhs), Boolean(expected[name]), name);
        }
        for (const [ name, operand ] of [
          [ 'addAssign', rhs ], [ 'subtractAssign', rhs ],
          [ 'multiplyAssign', scalar ], [ 'divideAssign', scalar ],
          [ 'moduloAssign', rhs ],
        ]) {
          const copy = new Time(lhs);
          assert.equal(sf[name](copy, operand), copy, name);
          assert.equal(copy.asMicroseconds(), expected[name], name);
        }
        assert.equal(lhs.asMicroseconds(), a);
        assert.equal(rhs.asMicroseconds(), b);
      }
    });
}

test('Time integer overloads preserve precision beyond Number safe integers',
  () => {
    const value = microseconds(9007199254740993n);
    assert.equal(multiply(value, 1n).asMicroseconds(), 9007199254740993n);
    assert.equal(divide(value, 3n).asMicroseconds(), 3002399751580331n);
    assert.equal(modulo(value, microseconds(2n)).asMicroseconds(), 1n);
    assert.equal(subtract(value, microseconds(1n)).asMicroseconds(),
      9007199254740992n);
    assert.ok(sf.greater(value, microseconds(9007199254740992n)));
    assert.equal(modulo(microseconds(-7n), microseconds(3n)).asMicroseconds(),
      -1n);
  });

test('Time rejects overflow, non-finite values and invalid arguments', () => {
  for (const value of [ min - 1n, max + 1n, 2n ** 100n ]) {
    assert.throws(() => new Time(value), RangeError);
    assert.throws(() => microseconds(value), RangeError);
    assert.throws(() => native.inspectTime(value), RangeError);
    assert.throws(() => multiply(Time.Zero, value), RangeError);
  }
  for (const value of [ NaN, Infinity, -Infinity, 1e30, -1e30 ]) {
    assert.throws(() => seconds(value), RangeError);
    assert.throws(() => native.timeFromSeconds(value), RangeError);
    assert.throws(() => milliseconds(value), RangeError);
  }
  for (const value of [ 2147483648, -2147483649 ]) {
    assert.throws(() => milliseconds(value), RangeError);
  }
  for (const value of [ 1, '1', null, {}, []]) {
    assert.throws(() => new Time(value), TypeError);
    assert.throws(() => microseconds(value), TypeError);
    assert.throws(() => native.inspectTime(value), TypeError);
  }
  assert.throws(() => microseconds(undefined), TypeError);
  assert.throws(() => seconds(1n), TypeError);
  assert.throws(() => milliseconds('1'), TypeError);
  assert.throws(() => negate(microseconds(min)), RangeError);
  assert.throws(() => add(microseconds(max), microseconds(1n)), RangeError);
  assert.throws(() => subtract(microseconds(min), microseconds(1n)),
    RangeError);
  assert.throws(() => multiply(microseconds(max), 2n), RangeError);
  assert.throws(() => divide(microseconds(min), -1n), RangeError);
  assert.throws(() => modulo(microseconds(min), microseconds(-1n)), RangeError);
  assert.throws(() => multiply(microseconds(max), 1), RangeError);
});

test('Time rejects zero divisors and failed assignments leave values intact',
  () => {
    for (const divisor of [ 0, -0, 1e-50, 0n, Time.Zero ]) {
      assert.throws(() => divide(microseconds(1n), divisor), RangeError);
    }
    assert.throws(() => modulo(microseconds(1n), Time.Zero), RangeError);
    for (const [ operation, operand ] of [
      [ addAssign, microseconds(1n) ],
      [ multiplyAssign, 2n ],
      [ multiplyAssign, Infinity ],
      [ divideAssign, 0n ],
      [ moduloAssign, Time.Zero ],
    ]) {
      const value = microseconds(max);
      assert.throws(() => operation(value, operand), RangeError);
      assert.equal(value.asMicroseconds(), max);
    }
    const value = microseconds(min);
    assert.throws(() => subtractAssign(value, microseconds(1n)), RangeError);
    assert.equal(value.asMicroseconds(), min);
  });

test('Time.Zero is immutable while copies and arithmetic results are mutable',
  () => {
    assert.ok(Object.isFrozen(Time.Zero));
    for (const [ operation, operand ] of [
      [ addAssign, microseconds(1n) ], [ subtractAssign, microseconds(1n) ],
      [ multiplyAssign, 2n ], [ divideAssign, 2n ],
      [ moduloAssign, microseconds(1n) ],
    ]) {
      assert.throws(() => operation(Time.Zero, operand), TypeError);
    }
    const copy = new Time(Time.Zero);
    addAssign(copy, microseconds(1n));
    assert.equal(copy.asMicroseconds(), 1n);
    assert.equal(Time.Zero.asMicroseconds(), 0n);
  });

test('Time rejects mismatched value and scalar types', () => {
  const time = microseconds(1n);
  const angle = sf.radians(1);
  for (const operation of [
    add, subtract, modulo, sf.equal, sf.notEqual,
    sf.less, sf.lessEqual, sf.greater, sf.greaterEqual, divide,
  ]) {
    assert.throws(() => operation(time, angle), TypeError);
    assert.throws(() => operation(angle, time), TypeError);
  }
  assert.throws(() => multiply(time, time), TypeError);
  assert.throws(() => multiply(angle, 2n), TypeError);
  assert.throws(() => multiply(time, '2'), TypeError);
});
