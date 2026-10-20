'use strict';

const assert = require('node:assert/strict');
const { once } = require('node:events');
const { test } = require('node:test');
const { setImmediate: nextTurn } = require('node:timers/promises');
const { Worker } = require('node:worker_threads');
const native = require('../build/Release/sfml.node');

/** Flush weak handles, backing stores and the native deletion queue. */
async function retainedHeap() {
  for (let i = 0; i < 4; i++) {
    global.gc();
    await nextTurn();
  }
  return process.memoryUsage().heapUsed;
}

test('discarded shared handles do not accumulate retained heap', async () => {
  // Warm up binding calls before measuring. Each probe owns one shared handle.
  for (let i = 0; i < 2000; i++) native.createDeletionProbe();
  const before = await retainedHeap();
  for (let batch = 0; batch < 10; batch++) {
    for (let i = 0; i < 2000; i++) native.createDeletionProbe();
    await retainedHeap();
  }
  const growth = await retainedHeap() - before;
  // Allow GC/JIT noise; the per-object template leak retains over 15 MiB.
  assert.ok(growth < 4 * 1024 * 1024,
    `20,000 discarded handles retained ${growth} bytes`);
});

test('shared handles reject other native types and forged objects', () => {
  const probe = native.createDeletionProbe();
  const angle = native.createAngle();
  assert.deepEqual(native.readDeletionProbe(probe.observation), [ 0, 0 ]);
  for (const value of [
    angle.handle,
    {},
    { 'sfml.shared.owner': probe.observation },
    Object.create(probe.observation),
    null,
  ]) {
    assert.throws(() => native.readDeletionProbe(value), TypeError);
  }
  assert.deepEqual(native.readDeletionProbe(probe.observation), [ 0, 0 ]);
});

test('shared handles survive concurrent Worker teardown', async t => {
  const source = `
    const { parentPort, workerData } = require('node:worker_threads');
    const native = require(workerData);
    const probe = native.createDeletionProbe();
    for (let i = 0; i < 2000; i++) native.createDeletionProbe();
    parentPort.postMessage(native.readDeletionProbe(probe.observation));
    parentPort.once('message', () => {
      const next = native.createDeletionProbe();
      parentPort.postMessage(native.readDeletionProbe(next.observation));
      parentPort.close();
    });
  `;
  const workers = [];
  t.after(async () => {
    await Promise.all(workers.map(worker => worker.terminate()));
  });
  const ready = [];
  const exits = [];
  for (let i = 0; i < 3; i++) {
    const worker = new Worker(source, {
      eval: true,
      workerData: require.resolve('../build/Release/sfml.node'),
    });
    workers.push(worker);
    ready.push(once(worker, 'message'));
    exits.push(once(worker, 'exit'));
  }
  assert.deepEqual(await Promise.all(ready), [
    [[ 0, 0 ]], [[ 0, 0 ]], [[ 0, 0 ]],
  ]);
  await workers[0].terminate();
  const probe = native.createDeletionProbe();
  assert.deepEqual(native.readDeletionProbe(probe.observation), [ 0, 0 ]);
  for (let i = 1; i < workers.length; i++) {
    const message = once(workers[i], 'message');
    workers[i].postMessage('continue');
    assert.deepEqual(await message, [[ 0, 0 ]]);
    assert.deepEqual(await exits[i], [ 0 ]);
  }
  assert.deepEqual(native.readDeletionProbe(
    native.createDeletionProbe().observation), [ 0, 0 ]);
});
