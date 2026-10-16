'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate: nextTurn } = require('node:timers/promises');
const { Worker } = require('node:worker_threads');
const { once } = require('node:events');
const { spawnSync } = require('node:child_process');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative, graphicsContext, textureId } =
  require('../dist/internal/graphics-state');
const { spriteState } = require('../dist/internal/graphics-state');
const { transformableState } = require('../dist/internal/transformable');

test('background BackingStore release destroys on the environment thread',
  async () => {
    const probe = native.createDeletionProbe();
    assert.equal(new Uint32Array(probe.buffer)[0], 42);
    native.releaseBackingOffThread(probe.buffer);
    assert.equal(probe.buffer.byteLength, 0);
    assert.deepEqual(native.readDeletionProbe(probe.observation), [ 0, 0 ]);
    for (let i = 0; i < 20; i++) {
      await nextTurn();
      if (native.readDeletionProbe(probe.observation)[0]) break;
    }
    assert.deepEqual(native.readDeletionProbe(probe.observation), [ 1, 0 ]);
  });

test('a sprite last owned by shared memory releases its texture after dispatch',
  async () => {
    let texture = new sf.Texture(new sf.Vector2u(2, 2));
    let sprite = new sf.Sprite(texture);
    const id = texture[textureId];
    const transform = sprite[transformableState].values.buffer;
    const appearance = sprite[spriteState].words.buffer;
    const weak = new WeakRef(sprite);
    sprite = null;
    texture = null;
    for (let i = 0; i < 20; i++) {
      await nextTurn();
      global.gc();
      if (!weak.deref()) break;
    }
    assert.equal(weak.deref(), undefined);
    assert.equal(native.textureRegistered(graphicsContext(), id), true);
    native.releaseBackingOffThread(transform);
    native.releaseBackingOffThread(appearance);
    // No event-loop turn yet: the resource table has not been mutated.
    assert.equal(native.textureRegistered(graphicsContext(), id), true);
    for (let i = 0; i < 20; i++) {
      await nextTurn();
      if (!native.textureRegistered(graphicsContext(), id)) break;
    }
    assert.equal(native.textureRegistered(graphicsContext(), id), false);
  });

test('background collection interleaves with registry writes and draws',
  async () => {
    const target = new sf.RenderTexture(new sf.Vector2u(8, 8));
    for (let frame = 0; frame < 150; frame++) {
      target.clear();
      for (let i = 0; i < 24; i++) {
        const texture = new sf.Texture(
          new sf.Image(new sf.Vector2u(8, 8), sf.Color.Green));
        target.draw(new sf.Sprite(texture));
      }
      target.display();
      if (frame % 5 === 0) {
        await global.gc({ execution: 'async' });
        await nextTurn();
      }
    }
    const pixel = target.getTexture().copyToImage().getPixel(new sf.Vector2u());
    assert.equal(pixel.toInteger(), sf.Color.Green.toInteger());
    assert.ok(target[graphicsNative]);
  });

test('Worker deletion queues support normal exit and termination', async () => {
  const addon = require.resolve('../build/Release/sfml.node');
  const source = `
    const { parentPort, workerData } = require('node:worker_threads');
    const native = require(workerData);
    const probe = native.createDeletionProbe();
    native.releaseBackingOffThread(probe.buffer);
    setImmediate(() => setImmediate(() => {
      parentPort.postMessage(native.readDeletionProbe(probe.observation));
    }));
  `;
  for (let i = 0; i < 3; i++) {
    const worker = new Worker(source, { eval: true, workerData: addon });
    const exit = once(worker, 'exit');
    assert.deepEqual((await once(worker, 'message'))[0], [ 1, 0 ]);
    assert.equal((await exit)[0], 0);
  }
  const worker = new Worker(`
    const { parentPort, workerData } = require('node:worker_threads');
    const native = require(workerData);
    global.probe = native.createDeletionProbe();
    parentPort.postMessage('ready');
    setInterval(() => {}, 1000);
  `, { eval: true, workerData: addon });
  await once(worker, 'message');
  await worker.terminate();
});

test('pending cleanup does not keep Node alive at process exit', () => {
  const result = spawnSync(process.execPath, [ '-e', `
    const native = require(${JSON.stringify(
    require.resolve('../build/Release/sfml.node'))});
    const probe = native.createDeletionProbe();
    native.releaseBackingOffThread(probe.buffer);
  ` ], { encoding: 'utf8', timeout: 5000 });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
});
