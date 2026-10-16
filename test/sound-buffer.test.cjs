'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, readFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { audioHandle } = require('../dist/internal/audio-native');
const mono = [ sf.SoundChannel.Mono ];
const stereo = [ sf.SoundChannel.FrontLeft, sf.SoundChannel.FrontRight ];

test('SoundBuffer PCM constructor copies a subarray into mapped SFML storage',
  () => {
    const input = new Int16Array([ 99, 1, -2, 3, -4, 99 ]);
    const buffer = new sf.SoundBuffer(input.subarray(1, 5), 2, 8000, stereo);
    const samples = buffer.getSamples();
    input.fill(0);
    assert.deepEqual(samples, new Int16Array([ 1, -2, 3, -4 ]));
    assert.equal(buffer.getSampleCount(), 4n);
    assert.equal(buffer.getSampleRate(), 8000);
    assert.equal(buffer.getChannelCount(), 2);
    assert.deepEqual([ ...buffer.getChannelMap() ], stereo);
    assert.equal(buffer.getDuration().asMicroseconds(), 250n);
    assert.equal(native.audioBufferAliases(buffer[audioHandle], samples), true);
    assert.throws(() => new sf.SoundBuffer(new Int16Array(0), 1, 8000, mono),
      sf.SFMLError);
    assert.throws(() => new sf.SoundBuffer(new Int16Array(2), 1, 0, mono),
      sf.SFMLError);
    assert.throws(() => new sf.SoundBuffer(new Float32Array(2), 1, 8000, mono),
      TypeError);
    assert.throws(() => new sf.SoundBuffer(new Int16Array(2)), RangeError);
  });

test('SoundBuffer assign preserves identity, Sound bindings and old views',
  () => {
    sf.PlaybackDevice.setDeviceToNull();
    let source = new sf.SoundBuffer(new Int16Array([ 10, -20, 30, -40 ]),
      2, 8000, stereo);
    const target = new sf.SoundBuffer(new Int16Array([ 1, 2 ]), 1, 44100, mono);
    const handle = target[audioHandle];
    const oldSamples = target.getSamples();
    const oldChannels = target.getChannelMap();
    const sourceSamples = source.getSamples();
    const sounds = [ new sf.Sound(target), new sf.Sound(target) ];
    const detached = new sf.Sound(target);
    detached.setBuffer(source);
    assert.equal(target.assign(source), target);
    assert.equal(target[audioHandle], handle);
    assert.equal(target.getSampleRate(), 8000);
    assert.equal(target.getChannelCount(), 2);
    assert.equal(target.getSampleCount(), 4n);
    assert.equal(target.getDuration().asMicroseconds(), 250n);
    assert.deepEqual([ ...target.getChannelMap() ], stereo);
    const assigned = target.getSamples();
    assert.deepEqual(assigned, sourceSamples);
    assert.notEqual(assigned.buffer, sourceSamples.buffer);
    assert.equal(native.audioBufferAliases(handle, assigned), true);
    for (const sound of sounds) {
      assert.equal(sound.getBuffer(), target);
      assert.equal(native.audioSoundBufferMatches(sound[audioHandle], handle),
        true);
    }
    assert.equal(native.audioSoundBufferMatches(detached[audioHandle],
      source[audioHandle]), true);
    source.loadFromSamples(new Int16Array([ 50, 60 ]), 1, 22050, mono);
    source = undefined;
    global.gc();
    assert.deepEqual(assigned, new Int16Array([ 10, -20, 30, -40 ]));
    assert.deepEqual(oldSamples, new Int16Array([ 1, 2 ]));
    assert.deepEqual([ ...oldChannels ], mono);
    assert.throws(() => target.assign({}), TypeError);
    assert.equal(target.getSamples(), assigned);
    target.assign(new sf.SoundBuffer());
    assert.equal(target.getSamples(), undefined);
    assert.equal(target.getSampleCount(), 0n);
    assert.equal(target.getSampleRate(), 44100);
    assert.equal(target.getDuration().asMicroseconds(), 0n);
    global.gc();
    assert.deepEqual(assigned, new Int16Array([ 10, -20, 30, -40 ]));
    for (const sound of sounds) {
      assert.equal(native.audioSoundBufferMatches(sound[audioHandle], handle),
        true);
    }
  });

test('SoundBuffer self-assignment leaves views and playback untouched', () => {
  sf.PlaybackDevice.setDeviceToNull();
  const buffer = new sf.SoundBuffer(new Int16Array(8000), 1, 8000, mono);
  const samples = buffer.getSamples();
  const channels = buffer.getChannelMap();
  const sound = new sf.Sound(buffer);
  sound.setLooping(true);
  sound.play();
  try {
    assert.equal(buffer.assign(buffer), buffer);
    assert.equal(buffer.getSamples(), samples);
    assert.equal(buffer.getChannelMap(), channels);
    assert.equal(sound.getStatus(), sf.SoundStatus.Playing);
  } finally { sound.stop(); }
});

test('SoundBuffer assignment during async loading retains each published view',
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'sfml-buffer-assign-'));
    try {
      const path = join(directory, 'buffer.wav');
      const fromFile = new sf.SoundBuffer(new Int16Array([ 11, 22 ]),
        1, 8000, mono);
      assert.equal(await fromFile.saveToFile(path), true);
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      let entered;
      const reading = new Promise(resolve => { entered = resolve; });
      class DelayedStream extends sf.MemoryInputStream {
        async read(bytes) {
          entered();
          await gate;
          return super.read(bytes);
        }
      }
      const target = new sf.SoundBuffer();
      const source = new sf.SoundBuffer(new Int16Array([ 33, 44 ]),
        1, 22050, mono);
      const loading = target.loadFromStream(
        new DelayedStream(await readFile(path)));
      let assigned;
      try {
        await reading;
        target.assign(source);
        assigned = target.getSamples();
        assert.deepEqual(assigned, new Int16Array([ 33, 44 ]));
        assert.equal(target.getSampleRate(), 22050);
      } finally {
        release();
        assert.equal(await loading, true);
      }
      assert.deepEqual(target.getSamples(), new Int16Array([ 11, 22 ]));
      assert.equal(target.getSampleRate(), 8000);
      assert.deepEqual(assigned, new Int16Array([ 33, 44 ]));
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
