'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { test } = require('node:test');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const {
  createScene, comparePanels, paneSize,
} = require('../examples/all-types-scene.cjs');
const {
  vector3Native, transformNative, transformStorage,
} = require('../dist/internal/value-storage');
const { glslNative } = require('../dist/internal/glsl-value');

async function setup() {
  const left = [ 0, 0 ];
  const right = [ paneSize[0], 0 ];
  const cold = createScene(left);
  const warm = createScene(right, true);
  await Promise.all([ cold.ready, warm.ready ]);
  const target = new sf.RenderTexture(
    new sf.Vector2u(paneSize[0] * 2, paneSize[1]));
  function frame(time, beforeDraw = () => {}) {
    cold.prepare(time);
    warm.prepare(time);
    beforeDraw();
    target.clear(new sf.Color(13, 18, 27));
    cold.draw(target);
    warm.draw(target);
    global.gc();
    target.display();
  }
  return { left, right, cold, warm, target, frame };
}

// Audio and Network constructors have separate runtime and protocol tests.
const nonSceneTypes = new Set([
  'SoundBuffer', 'SoundSource', 'SoundStream', 'SoundRecorder',
  'SoundBufferRecorder', 'EffectProcessor', 'Sound', 'Music',
  'InputSoundFile', 'OutputSoundFile', 'SoundFileReader', 'SoundFileReaderInfo',
  'SoundFileWriter', 'SoundFileFactory', 'Cone', 'TimeSpan',
  'IpAddress', 'Packet', 'Socket', 'TcpSocket', 'TcpListener', 'UdpSocket',
  'SocketSelector', 'Http', 'HttpRequest', 'HttpResponse',
  'Ftp', 'FtpResponse', 'FtpDirectoryResponse', 'FtpListingResponse',
  'Sftp', 'SftpResult', 'SftpPathResult',
  'SftpAttributesResult', 'SftpListingResult',
]);

test('all scene types render identically before/after native wrapping',
  async t => {
    const { left, right, cold, warm, target, frame } = await setup();
    const expected = Object.keys(sf)
      .filter(name => /^[A-Z]/.test(name) && typeof sf[name] === 'function' &&
        !nonSceneTypes.has(name))
      .concat(Object.keys(sf.Glsl).map(name => `Glsl.${name}`));
    assert.deepEqual([ ...cold.names ].sort(), expected.sort());
    assert.equal(cold.names.length, 61);
    const valueEntry =
      /^(wrap|create)(Angle|Vector|Color|Rect|Vertex|Transform|Mat|Glyph)/;
    for (const name of Object.keys(native)) {
      if (valueEntry.test(name)) {
        t.mock.method(native, name,
          () => assert.fail(`Unexpected value allocation/wrap: ${name}`));
      }
    }
    let previous;
    const width = target.getSize().x;
    for (const ms of [ 0, 250, 2250 ]) {
      frame(sf.milliseconds(ms));
      cold.verify();
      warm.verify();
      const pixels = comparePanels(target, left, right);
      const hash = createHash('sha256').update(pixels).digest('hex');
      assert.notEqual(hash, previous, 'Animation must actually change pixels');
      previous = hash;
      // A full-opacity endpoint independently verifies the actual color upload.
      const index = (448 * width + paneSize[0] - 9) * 4;
      const { r, g, b, a } = cold.values.Color;
      assert.deepEqual([ ...pixels.subarray(index, index + 4) ],
        [ r, g, b, a ]);
      let cloud = 0;
      for (let y = 32; y < 400; y++) {
        for (let x = 32; x < 448; x++) {
          const offset = (y * width + x) * 4;
          if (Math.max(pixels[offset], pixels[offset + 1],
            pixels[offset + 2]) > 145) cloud++;
        }
      }
      assert.ok(cloud > 100, 'Projected particles must be visible');
    }
    assert.equal(warm.values.Vertex.position, warm.members[4].value);
    assert.equal(warm.values.Vertex.color, warm.members[5].value);
  });

test('C++ mutation affects rendered geometry and the pixel check detects it',
  async () => {
    const { left, right, cold, warm, target, frame } = await setup();
    const axis = warm.values.Vector3f;
    const time = sf.seconds(1);
    frame(time, () => native.swapVector3(axis[vector3Native]));
    cold.verify();
    warm.verify();
    assert.throws(() => comparePanels(target, left, right), /pixels differ/);
    native.swapVector3(axis[vector3Native]);
    frame(time);
    comparePanels(target, left, right);
    const transform = warm.values.Transform;
    const original = transform[transformStorage].slice();
    frame(time, () => native.translateTransform(
      transform[transformNative], 13, 5));
    warm.verify();
    assert.throws(() => comparePanels(target, left, right), /pixels differ/);
    transform[transformStorage].set(original);
    frame(time);
    comparePanels(target, left, right);
  });

test('paused Clock/Time renders the same frame across GC', async () => {
  const { left, right, cold, warm, target, frame } = await setup();
  cold.clock.stop();
  const elapsed = cold.clock.getElapsedTime().asMicroseconds();
  const hashes = [];
  for (let i = 0; i < 2; i++) {
    frame(cold.clock.getElapsedTime());
    assert.equal(cold.clock.getElapsedTime().asMicroseconds(), elapsed);
    cold.verify();
    warm.verify();
    hashes.push(createHash('sha256')
      .update(comparePanels(target, left, right)).digest('hex'));
  }
  assert.equal(hashes[0], hashes[1]);
  cold.clock.start();
  assert.equal(cold.clock.isRunning(), true);
});

test('native GLSL matrix changes affect real geometry and uploaded color',
  async () => {
    const { left, right, cold, warm, target, frame } = await setup();
    const time = sf.seconds(1);
    for (const [ name, index, value ] of [
      [ 'Mat3', 6, 30 ], [ 'Mat4', 0, 0.25 ],
    ]) {
      const matrix = warm.values[`Glsl.${name}`];
      const original = matrix.array.slice();
      native[`set${name}Element`](matrix[glslNative], index, value);
      frame(time);
      cold.verify();
      warm.verify();
      assert.throws(() => comparePanels(target, left, right), /pixels differ/);
      matrix.array = original;
      frame(time);
      comparePanels(target, left, right);
    }
  });
