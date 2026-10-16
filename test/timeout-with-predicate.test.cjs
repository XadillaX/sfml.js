'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');
const { test } = require('node:test');
const {
  TimeoutWithPredicate, Time, milliseconds, microseconds, addAssign,
} = require('..');
const native = require('../build/Release/sfml.node');

const durations = [
  -(2n ** 63n), -1001n, 0n, 1n, 1000n, 9007199254740993n, 2n ** 63n - 1n,
];

test('Time timeout constructors match SFML across the signed int64 range',
  () => {
    for (const count of durations) {
      const input = microseconds(count);
      const timeout = new TimeoutWithPredicate(input);
      const expected = native.inspectTimeoutWithPredicate(count);
      assert.equal(expected.period, count);
      assert.equal(timeout.getPeriod().asMicroseconds(), expected.period);
      assert.equal(expected.hasPredicate, true);
      assert.equal(expected.stableGetters, true);
      assert.equal(expected.callsBefore, 0);
      assert.equal(expected.callsAfter, 0);
      assert.deepEqual([ 0, 1, 2 ].map(() => timeout.getPredicate()()),
        expected.results);
      assert.deepEqual(expected.results, [ false, false, false ]);
      addAssign(input, microseconds(count > 0n ? -1n : 1n));
      assert.equal(timeout.getPeriod().asMicroseconds(), count);
    }
  });

test('null predicates match an empty std::function with the 1 ms default',
  () => {
    for (const count of [ undefined, ...durations ]) {
      const timeout = count === undefined ? new TimeoutWithPredicate(null)
        : new TimeoutWithPredicate(null, microseconds(count));
      const expected = native.inspectTimeoutWithPredicate(null, count);
      assert.equal(expected.period, count ?? 1000n);
      assert.equal(timeout.getPeriod().asMicroseconds(), expected.period);
      assert.equal(expected.hasPredicate, true);
      assert.deepEqual([ 0, 1, 2 ].map(() => timeout.getPredicate()()),
        expected.results);
      assert.deepEqual(expected.results, [ false, false, false ]);
    }
  });

test('predicate construction, copying and getters never invoke the callback',
  () => {
    for (const count of [ undefined, ...durations ]) {
      let calls = 0;
      const predicate = function() {
        assert.equal(this, undefined);
        assert.equal(arguments.length, 0);
        return ++calls !== 2;
      };
      const input = count === undefined ? undefined : microseconds(count);
      const timeout = new TimeoutWithPredicate(predicate, input);
      const copy = new TimeoutWithPredicate(timeout);
      assert.equal(copy.getPredicate(), predicate);
      assert.equal(timeout.getPredicate(), predicate);
      assert.equal(calls, 0);
      const results = [ timeout, copy, timeout ]
        .map(value => value.getPredicate()());
      assert.deepEqual(results, [ true, false, true ]);
      assert.equal(calls, 3);
      calls = 0;
      const expected = native.inspectTimeoutWithPredicate(
        predicate, count, true);
      assert.equal(expected.callsBefore, 0);
      assert.equal(expected.callsAfter, 3);
      assert.equal(expected.stableGetters, true);
      assert.equal(expected.hasPredicate, true);
      assert.equal(expected.period, count ?? 1000n);
      assert.equal(copy.getPeriod().asMicroseconds(), expected.period);
      assert.deepEqual(results, expected.results);
      if (input) {
        addAssign(input, microseconds(count > 0n ? -1n : 1n));
        assert.equal(timeout.getPeriod().asMicroseconds(), count);
        assert.equal(copy.getPeriod().asMicroseconds(), count);
      }
    }
  });

test('period getters return stable readonly Time snapshots', () => {
  const timeout = new TimeoutWithPredicate(() => true, Time.Zero);
  const copy = new TimeoutWithPredicate(timeout);
  const period = timeout.getPeriod();
  assert.ok(period instanceof Time);
  assert.ok(Object.isFrozen(period));
  assert.equal(timeout.getPeriod(), period);
  assert.notEqual(period, Time.Zero);
  assert.notEqual(copy.getPeriod(), period);
  assert.throws(() => addAssign(period, microseconds(1n)), TypeError);
  const mutable = new Time(period);
  addAssign(mutable, microseconds(1n));
  assert.equal(period.asMicroseconds(), 0n);
  assert.equal(copy.getPeriod().asMicroseconds(), 0n);
});

test('copies of duration and null configurations match SFML', () => {
  for (const source of [ -500n, null ]) {
    const timeout = new TimeoutWithPredicate(
      source === null ? null : microseconds(source));
    const copy = new TimeoutWithPredicate(timeout);
    const expected = native.inspectTimeoutWithPredicate(
      source, undefined, true);
    assert.equal(copy.getPredicate(), timeout.getPredicate());
    assert.notEqual(copy.getPeriod(), timeout.getPeriod());
    assert.equal(copy.getPeriod().asMicroseconds(), expected.period);
    assert.deepEqual([ 0, 1, 2 ].map(() => copy.getPredicate()()),
      expected.results);
  }
});

test('predicate exceptions propagate unchanged in JS and the native oracle',
  () => {
    const error = new Error('predicate failure');
    for (const invoke of [
      predicate => new TimeoutWithPredicate(predicate).getPredicate()(),
      predicate => native.inspectTimeoutWithPredicate(predicate),
    ]) {
      let calls = 0;
      assert.throws(() => invoke(() => { calls++; throw error; }),
        value => value === error);
      assert.equal(calls, 1);
    }
  });

test('getPredicate returns the original callable without coercion', () => {
  const result = {};
  const predicate = () => result;
  const timeout = new TimeoutWithPredicate(predicate);
  assert.equal(timeout.getPredicate(), predicate);
  assert.equal(timeout.getPredicate()(), result);
});

test('invalid timeout and period arguments fail immediately', () => {
  for (const value of [ undefined, 1, 1n, true, '1', {},
    { asMicroseconds: () => 1n }]) {
    assert.throws(() => new TimeoutWithPredicate(value), TypeError);
  }
  for (const value of [ null, 1, 1n, {}, () => true ]) {
    assert.throws(() => new TimeoutWithPredicate(() => true, value), TypeError);
    assert.throws(() => new TimeoutWithPredicate(null, value), TypeError);
  }
  for (const source of [ Time.Zero, new TimeoutWithPredicate(null) ]) {
    assert.throws(() => new TimeoutWithPredicate(source, milliseconds(1)),
      TypeError);
  }
});

test('timeout values work without native loading, clocks or timers', () => {
  const output = execFileSync(process.execPath, [ '-e', `
    const fail = () => { throw new Error('Unexpected native/clock/timer'); };
    require('node:module')._extensions['.node'] = fail;
    global.setTimeout = global.setInterval = global.setImmediate = fail;
    const { TimeoutWithPredicate } =
      require('./dist/system/timeout-with-predicate');
    const { milliseconds } = require('./dist/system/time');
    require('node:process').hrtime.bigint = Date.now = fail;
    const timeout = new TimeoutWithPredicate(() => true, milliseconds(5));
    const copy = new TimeoutWithPredicate(timeout);
    if (!copy.getPredicate()() ||
        copy.getPeriod().asMicroseconds() !== 5000n) process.exit(1);
    if (new TimeoutWithPredicate(milliseconds(1)).getPredicate()() ||
        new TimeoutWithPredicate(null).getPredicate()()) process.exit(1);
  ` ], { cwd: resolve(__dirname, '..') });
  assert.equal(output.length, 0);
});
