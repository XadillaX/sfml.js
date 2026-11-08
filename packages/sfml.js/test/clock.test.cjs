'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { hrtime } = require('node:process');
const { execFileSync } = require('node:child_process');
const { setImmediate } = require('node:timers/promises');
const { Clock, Time, addAssign, microseconds } = require('../dist');
const native = require('../build/Release/sfml.node');

test('Clock measures microseconds while retaining sub-microsecond precision',
  t => {
    let now = 0n;
    t.mock.method(hrtime, 'bigint', () => now);
    const clock = new Clock();
    assert.equal(clock.isRunning(), true);
    now = 999n;
    assert.equal(clock.getElapsedTime().asMicroseconds(), 0n);
    clock.stop();
    now = 10000n;
    clock.start();
    now += 1n;
    assert.equal(clock.getElapsedTime().asMicroseconds(), 1n);
  });

test('Clock start and stop are idempotent and exclude paused intervals', t => {
  let now = 1000000000000000000n;
  const timer = t.mock.method(hrtime, 'bigint', () => now);
  const clock = new Clock();
  clock.start();
  assert.equal(timer.mock.callCount(), 1);
  now += 1234567n;
  clock.stop();
  const calls = timer.mock.callCount();
  now += 9999999999n;
  clock.stop();
  assert.equal(clock.getElapsedTime().asMicroseconds(), 1234n);
  assert.equal(timer.mock.callCount(), calls);
  clock.start();
  now += 2000433n;
  assert.equal(clock.getElapsedTime().asMicroseconds(), 3235n);
});

for (const initiallyStopped of [ false, true ]) {
  for (const method of [ 'restart', 'reset' ]) {
    test(`Clock ${method} elapsed time with stopped=${initiallyStopped}`,
      t => {
        let now = 0n;
        t.mock.method(hrtime, 'bigint', () => now);
        const clock = new Clock();
        now = 1234567n;
        if (initiallyStopped) {
          clock.stop();
          now += 999999999n;
        }
        const elapsed = clock[method]();
        assert.ok(elapsed instanceof Time);
        assert.equal(elapsed.asMicroseconds(), 1234n);
        assert.equal(clock.isRunning(), method === 'restart');
        assert.equal(clock.getElapsedTime().asMicroseconds(), 0n);
        now += 1000000n;
        assert.equal(clock.getElapsedTime().asMicroseconds(),
          method === 'restart' ? 1000n : 0n);
        addAssign(elapsed, microseconds(1n));
        assert.equal(clock.getElapsedTime().asMicroseconds(),
          method === 'restart' ? 1000n : 0n);
      });
  }
}

test('Clock copies preserve reference and pause state independently', t => {
  let now = 0n;
  t.mock.method(hrtime, 'bigint', () => now);
  const source = new Clock();
  now = 1500n;
  const running = new Clock(source);
  source.stop();
  const stopped = new Clock(source);
  now = 9500n;
  assert.equal(running.getElapsedTime().asMicroseconds(), 9n);
  assert.equal(stopped.getElapsedTime().asMicroseconds(), 1n);
  source.restart();
  assert.equal(stopped.isRunning(), false);
  stopped.start();
  now += 500n;
  assert.equal(stopped.getElapsedTime().asMicroseconds(), 2n);
  assert.equal(source.getElapsedTime().asMicroseconds(), 0n);
  assert.throws(() => new Clock({}), TypeError);
});

test('Clock transition states match native sf::Clock', () => {
  const clock = new Clock();
  const states = [ clock.isRunning() ];
  const methods = [ 'stop', 'stop', 'start', 'start', 'reset', 'restart' ];
  for (const method of methods) {
    clock[method]();
    states.push(clock.isRunning());
  }
  assert.deepEqual(states, native.clockStates());
});

test('Clock integrates with the real monotonic clock and returns snapshots',
  async () => {
    const clock = new Clock();
    const first = clock.getElapsedTime();
    await setImmediate();
    const second = clock.getElapsedTime();
    assert.ok(second.asMicroseconds() >= first.asMicroseconds());
    clock.stop();
    const frozen = clock.getElapsedTime().asMicroseconds();
    await setImmediate();
    assert.equal(clock.getElapsedTime().asMicroseconds(), frozen);
    const copy = clock.getElapsedTime();
    addAssign(copy, microseconds(100n));
    assert.equal(clock.getElapsedTime().asMicroseconds(), frozen);
  });

test('Time and Clock modules operate without loading any native addon', () => {
  const output = execFileSync(process.execPath, [ '-e', `
    const Module = require('node:module');
    const original = Module._extensions['.node'];
    Module._extensions['.node'] = () => { throw new Error('Native load'); };
    const { Clock } = require('./dist/system/clock');
    const { Time } = require('./dist/system/time');
    const clock = new Clock();
    clock.stop();
    const result = new Time(clock.getElapsedTime());
    if (typeof result.asMicroseconds() !== 'bigint') process.exit(1);
    Module._extensions['.node'] = original;
  ` ], { cwd: require('node:path').resolve(__dirname, '..') });
  assert.equal(output.length, 0);
});
