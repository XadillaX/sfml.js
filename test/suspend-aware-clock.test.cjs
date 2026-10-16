'use strict';

const assert = require('node:assert/strict');
const { hrtime } = require('node:process');
const { test } = require('node:test');
const { SuspendAwareClock, SFMLError } = require('..');
const native = require('../build/Release/sfml.node');

test('SuspendAwareClock exposes the SFML steady clock trait', () => {
  assert.equal(SuspendAwareClock.is_steady, true);
  assert.equal(SuspendAwareClock.is_steady, native.suspendAwareClockSteady);
});

test('SuspendAwareClock forwards native nanoseconds without precision loss',
  t => {
    const count = 9007199254740993123n;
    const now = t.mock.method(native, 'suspendAwareClockNow', () => count);
    t.mock.method(hrtime, 'bigint', () => assert.fail('Unexpected JS clock'));
    t.mock.method(Date, 'now', () => assert.fail('Unexpected wall clock'));
    assert.equal(SuspendAwareClock.now(), count);
    assert.equal(now.mock.callCount(), 1);
  });

test('SuspendAwareClock rejects unsupported platforms with SFMLError',
  { skip: native.suspendAwareClockSupported }, t => {
    t.mock.method(hrtime, 'bigint', () => assert.fail('Unexpected JS clock'));
    for (const now of [
      () => SuspendAwareClock.now(), () => native.suspendAwareClockNow(),
    ]) {
      assert.throws(now, error => {
        assert.ok(error instanceof SFMLError);
        assert.ok(error instanceof Error);
        assert.match(error.message, /only supported by SFML on Android/);
        return true;
      });
    }
  });

test('Android SuspendAwareClock timestamps match native SFML clock bounds',
  { skip: !native.suspendAwareClockSupported }, () => {
    const before = native.suspendAwareClockOracle();
    const now = SuspendAwareClock.now();
    const after = native.suspendAwareClockOracle();
    assert.equal(typeof now, 'bigint');
    assert.ok(now >= before && now <= after);
  });
