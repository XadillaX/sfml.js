'use strict';

const assert = require('node:assert/strict');
const { Worker } = require('node:worker_threads');
const { FontEffect } = require('../../dist');

function verifyAlphaFill() {
  const allocation = new Uint8Array(40).fill(91);
  const view = allocation.subarray(4, 28);
  view.set([ 1, 2, 3, 0, 4, 5, 6, 128 ]);
  view.set([ 7, 8, 9, 255, 10, 11, 12, 32 ], 16);
  FontEffect.fillColorValuesFromAlpha(view, { x: 2, y: 2 }, 16);
  assert.deepEqual(Array.from(view), [
    0, 0, 0, 0, 128, 128, 128, 128,
    91, 91, 91, 91, 91, 91, 91, 91,
    255, 255, 255, 255, 32, 32, 32, 32,
  ]);
  assert.ok(allocation.subarray(0, 4).every(value => value === 91));
  assert.ok(allocation.subarray(28).every(value => value === 91));

  const bytes = new Uint8Array(16);
  for (const [ dimensions, stride ] of [
    [{ x: 2, y: 2 }, 7 ],
    [{ x: 2, y: 2 }, 12 ],
    [{ x: -1, y: 1 }, 4 ],
    [{ x: 1.5, y: 1 }, 8 ],
    [{ x: 2 ** 29, y: 1 }, 2 ** 31 - 1 ],
    [{ x: 1, y: 2 }, 2 ** 31 - 1 ],
    [{ x: 1, y: 1 }, -4 ],
    [{ x: 1, y: 1 }, NaN ],
    [{ x: 1, y: 1 }, 4.5 ],
  ]) {
    assert.throws(() => FontEffect.fillColorValuesFromAlpha(
      bytes, dimensions, stride), /dimensions|stride|buffer|int32/i);
  }
  assert.throws(() => FontEffect.fillColorValuesFromAlpha(
    new Uint16Array(8), { x: 1, y: 1 }, 4), /Uint8Array/i);
  assert.throws(() => FontEffect.fillColorValuesFromAlpha(
    new Uint8Array(new SharedArrayBuffer(4)), { x: 1, y: 1 }, 4), /shared/i);

  const detached = new Uint8Array(4);
  assert.throws(() => FontEffect.fillColorValuesFromAlpha(detached, {
    get x() {
      structuredClone(detached.buffer, { transfer: [ detached.buffer ] });
      return 1;
    },
    y: 1,
  }, 4), /detached/i);
  const sentinel = new Error('dimension getter');
  assert.throws(() => FontEffect.fillColorValuesFromAlpha(bytes, {
    get x() {
      throw sentinel;
    },
    y: 1,
  }, 4), error => error === sentinel);

  for (const dimensions of [{ x: 0, y: 4 }, { x: 4, y: 0 }]) {
    FontEffect.fillColorValuesFromAlpha(new Uint8Array(), dimensions, 16);
  }
}

async function run() {
  // Pure pixel work must not need an initialized graphics runtime.
  verifyAlphaFill();
  const modulePath = JSON.stringify(require.resolve('../../dist'));
  const worker = new Worker(`
    const { parentPort } = require('node:worker_threads');
    const { FontEffect } = require(${modulePath});
    const bytes = Uint8Array.of(1, 2, 3, 123);
    FontEffect.fillColorValuesFromAlpha(bytes, { x: 1, y: 1 }, 4);
    parentPort.postMessage(Array.from(bytes));
  `, { eval: true });
  const output = await new Promise((resolve, reject) => {
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', code => {
      if (code !== 0) {
        reject(new Error(`Worker exited with ${code}`));
      }
    });
  });
  assert.deepEqual(output, [ 123, 123, 123, 123 ]);
  console.log('PASS font-effect-alpha-stride-bounds-worker');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
