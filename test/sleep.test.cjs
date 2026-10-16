'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const timers = require('node:timers/promises');
const {
  sleep, Time, milliseconds, microseconds, subtractAssign,
} = require('..');

test('sleep returns a Promise and lets other timers run while waiting',
  async () => {
    const events = [];
    setTimeout(() => events.push('other timer'), 0);
    const waiting = sleep(milliseconds(20));
    assert.ok(waiting instanceof Promise);
    assert.equal(await waiting, undefined);
    events.push('sleep finished');
    assert.deepEqual(events, [ 'other timer', 'sleep finished' ]);
  });

test('sleep handles nonpositive and fractional durations and rejects non-Time',
  async t => {
    const timer = t.mock.method(timers, 'setTimeout', async () => {});
    await sleep(Time.Zero);
    await sleep(microseconds(-1n));
    assert.equal(timer.mock.callCount(), 0);
    await sleep(microseconds(1n));
    await sleep(microseconds(1500n));
    assert.deepEqual(timer.mock.calls.map(call => call.arguments),
      [[ 1 ], [ 2 ]]);
    for (const invalid of [ undefined, null, 1, 1000n, {}]) {
      await assert.rejects(sleep(invalid), TypeError);
    }
    assert.equal(timer.mock.callCount(), 2);
  });

test('sleep preserves long durations and snapshots Time before waiting',
  async t => {
    let finish;
    const timer = t.mock.method(timers, 'setTimeout', () =>
      new Promise(resolve => { finish = resolve; }));
    const duration = microseconds((2147483647n + 10n) * 1000n);
    const waiting = sleep(duration);
    assert.deepEqual(timer.mock.calls[0].arguments, [ 2147483647 ]);
    subtractAssign(duration, duration);
    finish();
    await Promise.resolve();
    assert.deepEqual(timer.mock.calls[1].arguments, [ 10 ]);
    finish();
    await waiting;
    assert.equal(timer.mock.callCount(), 2);
  });
