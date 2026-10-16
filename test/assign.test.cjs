'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { join } = require('node:path');
const { setImmediate: nextTurn } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative, textureId, vertexBufferId } =
  require('../dist/internal/graphics-state');
const { audioHandle } = require('../dist/internal/audio-native');
const size = (x, y = 1) => new sf.Vector2u(x, y);
const point = (x, y = 0) => new sf.Vector2f(x, y);
const mono = [ sf.SoundChannel.Mono ];
const worker = join(__dirname, 'fixtures/audio-worker.cjs');
const texture = (width, color) =>
  new sf.Texture(new sf.Image(size(width), color));
const pixels = value => [ ...value.copyToImage().pixels ];
const colors = output => {
  const data = native.readRenderTexturePixels(output[graphicsNative]);
  return Array.from({ length: data.length / 4 },
    (_, i) => data.readUInt32BE(i * 4));
};
function gpu(vertices, type = sf.PrimitiveType.Points,
  usage = sf.VertexBufferUsage.Stream) {
  const buffer = new sf.VertexBuffer(type, usage);
  assert.equal(buffer.create(vertices.length), true);
  assert.equal(buffer.update(vertices), true);
  return buffer;
}
const vertex = (x, color) => new sf.Vertex(point(x + 0.5, 0.5), color);
const pcm = value => new sf.SoundBuffer(
  new Int16Array(8000).fill(value), 1, 8000, mono);

test('Texture assign preserves mapped fields, identity and cross-target draws',
  () => {
    const destination = texture(1, sf.Color.Red);
    const source = texture(2, sf.Color.Blue);
    source.setSmooth(true);
    source.setRepeated(true);
    const mapping = destination.state;
    const handle = destination[graphicsNative];
    const id = destination[textureId];
    const sprite = new sf.Sprite(destination);
    const outputs = [ 0, 1 ].map(() => new sf.RenderTexture(size(3)));
    for (const output of outputs) {
      output.clear();
      output.draw(sprite);
    }
    assert.equal(destination.assign(source), destination);
    assert.equal(destination.state, mapping);
    assert.equal(destination[graphicsNative], handle);
    assert.equal(destination[textureId], id);
    assert.equal(destination.getSize().x, 2);
    assert.equal(destination.isSmooth(), true);
    assert.equal(destination.isRepeated(), true);
    assert.notEqual(destination.getNativeHandle(), source.getNativeHandle());
    assert.deepEqual(pixels(destination), pixels(source));
    assert.equal(sprite.getTexture(), destination);
    sprite.setPosition(point(1));
    for (const output of outputs) output.draw(sprite);
    source.update(new sf.Image(size(2), sf.Color.Green));
    assert.deepEqual(pixels(destination),
      [ 0, 0, 255, 255, 0, 0, 255, 255 ]);
    const nativeId = destination.getNativeHandle();
    assert.equal(destination.assign(destination), destination);
    assert.equal(destination.getNativeHandle(), nativeId);
    destination.assign(source);
    sprite.setPosition(point(2));
    for (const output of outputs) {
      output.draw(sprite);
      output.display();
      assert.deepEqual(colors(output), [ 0xff0000ff, 0x0000ffff, 0x00ff00ff ]);
    }
    const empty = new sf.Texture();
    empty.setRepeated(true);
    destination.assign(empty);
    assert.equal(destination.getNativeHandle(), 0);
    assert.equal(destination.getSize().x, 0);
    assert.equal(mapping.width, 0);
    assert.equal(mapping.repeated, true);
    assert.equal(destination.isSmooth(), false);
    assert.throws(() => destination.assign({}), TypeError);
  });

test('Texture assign accepts borrowed sources and rejects borrowed targets',
  async () => {
    const output = new sf.RenderTexture(size(2));
    output.clear(sf.Color.Green);
    output.display();
    const borrowed = output.getTexture();
    const destination = new sf.Texture();
    destination.assign(borrowed);
    output.clear(sf.Color.Blue);
    output.display();
    assert.deepEqual(pixels(destination),
      [ 0, 255, 0, 255, 0, 255, 0, 255 ]);
    assert.throws(() => borrowed.assign(destination), TypeError);
    assert.throws(() => native.assignTexture(borrowed[graphicsNative],
      destination[graphicsNative]), TypeError);
    const font = new sf.Font();
    assert.equal(await font.openFromFile(join(__dirname,
      'fixtures/fonts/DejaVuSansMono.ttf')), true);
    font.getGlyph(65, 16, false);
    const atlas = font.getTexture(16);
    destination.assign(atlas);
    assert.deepEqual(pixels(destination), pixels(atlas));
    assert.throws(() => atlas.assign(destination), TypeError);
    const srgb = new sf.Texture(new sf.Image(size(1), sf.Color.Red), true);
    destination.assign(srgb);
    assert.equal(destination.isSrgb(), srgb.isSrgb());
    const encoded = await new sf.Image(size(1), sf.Color.Green)
      .saveToMemory('png');
    const loading = destination.loadFromMemory(encoded);
    destination.assign(srgb);
    assert.deepEqual(pixels(destination), [ 255, 0, 0, 255 ]);
    assert.equal(await loading, true);
    assert.deepEqual(pixels(destination), [ 0, 255, 0, 255 ]);
  });

test('VertexBuffer assign copies modes, resizes and preserves queued draws',
  () => {
    const destination = gpu([ vertex(0, sf.Color.Red) ]);
    const source = gpu([ vertex(1, sf.Color.Green), vertex(2, sf.Color.Blue) ],
      sf.PrimitiveType.Points, sf.VertexBufferUsage.Static);
    const mapping = destination.info;
    const handle = destination[graphicsNative];
    const id = destination[vertexBufferId];
    const outputs = [ 0, 1 ].map(() => new sf.RenderTexture(size(4)));
    for (const output of outputs) {
      output.clear();
      output.draw(destination);
    }
    assert.equal(destination.assign(source), destination);
    assert.equal(destination.info, mapping);
    assert.equal(destination[graphicsNative], handle);
    assert.equal(destination[vertexBufferId], id);
    assert.equal(destination.getVertexCount(), 2);
    assert.equal(destination.getUsage(), sf.VertexBufferUsage.Static);
    assert.notEqual(destination.getNativeHandle(), source.getNativeHandle());
    source.update([ vertex(0, sf.Color.White), vertex(3, sf.Color.White) ]);
    for (const output of outputs) output.draw(destination);
    const next = gpu([ vertex(3, sf.Color.White) ]);
    destination.assign(next);
    for (const output of outputs) {
      output.draw(destination);
      output.display();
      assert.deepEqual(colors(output),
        [ 0xff0000ff, 0x00ff00ff, 0x0000ffff, 0xffffffff ]);
    }
    const nativeId = destination.getNativeHandle();
    assert.equal(destination.assign(destination), destination);
    assert.equal(destination.getNativeHandle(), nativeId);
    const empty = new sf.VertexBuffer(sf.PrimitiveType.Lines,
      sf.VertexBufferUsage.Dynamic);
    destination.assign(empty);
    assert.equal(destination.getVertexCount(), 0);
    assert.equal(destination.getNativeHandle(), 0);
    assert.equal(destination.getPrimitiveType(), sf.PrimitiveType.Lines);
    assert.equal(destination.getUsage(), sf.VertexBufferUsage.Dynamic);
    assert.equal(mapping.count, 0);
    destination.assign(source);
    assert.equal(destination.getVertexCount(), 2);
    assert.equal(destination.getPrimitiveType(), sf.PrimitiveType.Points);
    assert.throws(() => destination.assign(new sf.Texture()), TypeError);
  });

test('GPU assignment releases source wrappers and preserves copied storage',
  async () => {
    let sourceTexture = texture(1, sf.Color.Blue);
    let sourceBuffer = gpu([ vertex(0, sf.Color.Green) ]);
    const refs = [ new WeakRef(sourceTexture), new WeakRef(sourceBuffer) ];
    const destinationTexture = new sf.Texture().assign(sourceTexture);
    const destinationBuffer = new sf.VertexBuffer().assign(sourceBuffer);
    sourceTexture = null;
    sourceBuffer = null;
    await nextTurn();
    global.gc();
    for (const ref of refs) assert.equal(ref.deref(), undefined);
    assert.deepEqual(pixels(destinationTexture), [ 0, 0, 255, 255 ]);
    const output = new sf.RenderTexture(size(1));
    output.clear();
    output.draw(destinationBuffer);
    output.display();
    assert.deepEqual(colors(output), [ 0x00ff00ff ]);
  });

function settings(source) {
  source.setPitch(1.25);
  source.setPan(-0.25);
  source.setVolume(37);
  source.setSpatializationEnabled(false);
  source.setPosition(new sf.Vector3f(2, 3, 4));
  source.setDirection(new sf.Vector3f(0, 0, -1));
  source.setCone({ innerAngle: sf.radians(1), outerAngle: sf.radians(2),
    outerGain: 0.25 });
  source.setVelocity(new sf.Vector3f(-2, 1, 3));
  source.setDopplerFactor(0.5);
  source.setDirectionalAttenuationFactor(0.75);
  source.setRelativeToListener(true);
  source.setMinDistance(2);
  source.setMaxDistance(40);
  source.setMinGain(0.25);
  source.setMaxGain(0.75);
  source.setAttenuation(0.5);
}

test('SoundSource assign copies all attributes and retains stream playback',
  async () => {
    sf.PlaybackDevice.setDeviceToNull();
    const source = new sf.Sound(pcm(5));
    settings(source);
    const destination = new sf.SoundStream({ module: worker,
      sampleRate: 8000, channelCount: 1, channelMap: mono });
    const effect = new sf.EffectProcessor({ module: worker });
    await Promise.all([ destination.ready, effect.ready ]);
    destination.setEffectProcessor(effect);
    destination.setLooping(true);
    destination.play();
    destination.pause();
    destination.setPlayingOffset(sf.milliseconds(250));
    const fields = destination.values;
    const times = destination.times;
    const before = native.audioAssignmentState(destination[audioHandle]);
    try {
      assert.equal(destination.assign(source), destination);
      assert.deepEqual(native.audioSourceOracle(destination[audioHandle]),
        native.audioSourceOracle(source[audioHandle]));
      assert.equal(destination.getDirectionalAttenuationFactor(), 0.75);
      assert.equal(destination.values, fields);
      assert.equal(destination.times, times);
      assert.equal(destination.isLooping(), true);
      assert.equal(destination.getStatus(), sf.SoundStatus.Paused);
      assert.equal(destination.getPlayingOffset().asMicroseconds(), 250000n);
      assert.deepEqual(native.audioAssignmentState(destination[audioHandle]),
        before);
      assert.equal(destination.assign(destination), destination);
      assert.throws(() => destination.assign({}), TypeError);
      const other = new sf.Sound(pcm(6));
      assert.throws(() => other.setEffectProcessor(effect), /one source/);
      destination.play();
      assert.equal(destination.getStatus(), sf.SoundStatus.Playing);
      destination.assign(source);
      assert.equal(destination.getStatus(), sf.SoundStatus.Playing);
    } finally {
      destination.setEffectProcessor();
      await Promise.all([ destination.close(), effect.close() ]);
    }
  });

test('Sound assign rebinds PCM, stops, rewinds and retains its own effect',
  async () => {
    sf.PlaybackDevice.setDeviceToNull();
    const oldBuffer = pcm(1);
    const newBuffer = pcm(2);
    const source = new sf.Sound(newBuffer);
    settings(source);
    source.setLooping(true);
    source.setPlayingOffset(sf.milliseconds(500));
    const destination = new sf.Sound(oldBuffer);
    const effects = [ new sf.EffectProcessor({ module: worker }),
      new sf.EffectProcessor({ module: worker }) ];
    await Promise.all(effects.map(effect => effect.ready));
    source.setEffectProcessor(effects[0]);
    destination.setEffectProcessor(effects[1]);
    destination.play();
    destination.pause();
    destination.setPlayingOffset(sf.milliseconds(250));
    const before = native.audioAssignmentState(destination[audioHandle]);
    const sourceBefore = native.audioAssignmentState(source[audioHandle]);
    const handle = destination[audioHandle];
    const fields = destination.values;
    try {
      assert.equal(destination.assign(destination), destination);
      assert.deepEqual(native.audioAssignmentState(handle), before);
      assert.equal(destination.getStatus(), sf.SoundStatus.Paused);
      assert.equal(destination.assign(source), destination);
      const after = native.audioAssignmentState(handle);
      assert.equal(after.sound, before.sound);
      assert.equal(after.effect, before.effect);
      assert.equal(after.generation, before.generation + 1n);
      assert.deepEqual(native.audioAssignmentState(source[audioHandle]),
        sourceBefore);
      assert.equal(destination[audioHandle], handle);
      assert.equal(destination.values, fields);
      assert.equal(destination.getBuffer(), newBuffer);
      assert.equal(native.audioSoundBufferMatches(handle,
        newBuffer[audioHandle]), true);
      assert.equal(destination.getStatus(), sf.SoundStatus.Stopped);
      assert.equal(destination.getPlayingOffset().asMicroseconds(), 0n);
      assert.equal(destination.isLooping(), true);
      assert.deepEqual(native.audioSourceOracle(handle),
        native.audioSourceOracle(source[audioHandle]));
      oldBuffer.assign(pcm(3));
      assert.equal(native.audioSoundBufferMatches(handle,
        newBuffer[audioHandle]), true);
      newBuffer.assign(pcm(4));
      for (const sound of [ source, destination ]) {
        assert.equal(native.audioSoundBufferMatches(sound[audioHandle],
          newBuffer[audioHandle]), true);
      }
      assert.equal(newBuffer.getSamples()[0], 4);
      assert.throws(() => destination.assign(new sf.Music()), TypeError);
      assert.throws(() => destination.assign({}), TypeError);
      const processed = effects[1].getWorkerStats().processed;
      destination.play();
      const deadline = Date.now() + 3000;
      while (effects[1].getWorkerStats().processed <= processed) {
        assert.ok(Date.now() < deadline, 'Assigned Sound effect did not run');
        await sf.sleep(sf.milliseconds(5));
      }
      assert.equal(effects[1].getWorkerError(), undefined);
      destination.assign(source);
      assert.equal(destination.getStatus(), sf.SoundStatus.Stopped);
      assert.equal(destination.getPlayingOffset().asMicroseconds(), 0n);
      destination.setLooping(false);
      destination.setPlayingOffset(sf.milliseconds(100));
      const baseBefore = native.audioAssignmentState(handle);
      sf.SoundSource.prototype.assign.call(destination, source);
      assert.equal(destination.isLooping(), false);
      assert.equal(destination.getPlayingOffset().asMicroseconds(), 100000n);
      assert.deepEqual(native.audioAssignmentState(handle), baseBefore);
    } finally {
      source.stop();
      destination.stop();
      source.setEffectProcessor();
      destination.setEffectProcessor();
      await Promise.all(effects.map(effect => effect.close()));
    }
  });
