'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, rm, readFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const sf = require('..');
const { audioHandle } = require('../dist/internal/audio-native');
const native = require('../build/Release/sfml.node');
const mono = [ sf.SoundChannel.Mono ];

function makeBuffer(count = 4410) {
  const buffer = new sf.SoundBuffer();
  const samples = Int16Array.from({ length: count },
    (_, i) => Math.sin(i * Math.PI / 50) * 4000);
  assert.equal(buffer.loadFromSamples(samples, 1, 44100, mono), true);
  return { buffer, samples };
}

test('Audio buffer samples alias native storage and old views survive reload',
  () => {
    const { buffer, samples } = makeBuffer();
    assert.deepEqual(buffer.getSamples(), samples);
    assert.equal(native.audioBufferAliases(buffer[audioHandle],
      buffer.getSamples()), true);
    assert.equal(buffer.getSampleCount(), 4410n);
    assert.equal(buffer.getSampleRate(), 44100);
    assert.equal(buffer.getChannelCount(), 1);
    assert.deepEqual([ ...buffer.getChannelMap() ], mono);
    const old = buffer.getSamples();
    const copy = new sf.SoundBuffer(buffer);
    assert.notEqual(copy.getSamples().buffer, old.buffer);
    assert.equal(buffer.loadFromSamples(new Int16Array([ 1, 2 ]),
      1, 22050, mono), true);
    assert.deepEqual(old, samples);
    assert.deepEqual(copy.getSamples(), samples);
    assert.equal(buffer.getSampleCount(), 2n);
  });

test('Every source field agrees with independent SFML getters and C++ writes',
  () => {
    sf.PlaybackDevice.setDeviceToNull();
    const { buffer } = makeBuffer();
    const source = new sf.Sound(buffer);
    const scalars = [
      [ 'Pitch', 0, 1.25 ], [ 'Pan', 1, -0.25 ], [ 'Volume', 2, 37 ],
      [ 'DopplerFactor', 16, 0.5 ],
      [ 'DirectionalAttenuationFactor', 17, 0.75 ],
      [ 'MinDistance', 19, 2 ], [ 'MaxDistance', 20, 40 ],
      [ 'MinGain', 21, 0.25 ], [ 'MaxGain', 22, 0.75 ],
      [ 'Attenuation', 23, 0.5 ],
    ];
    for (const [ name, , value ] of scalars) {
      source[`set${name}`](value);
    }
    source.setSpatializationEnabled(false);
    source.setRelativeToListener(true);
    source.setPosition(new sf.Vector3f(2, 3, 4));
    source.setDirection(new sf.Vector3f(0, 0, -1));
    source.setVelocity(new sf.Vector3f(-2, 1, 3));
    source.setCone({ innerAngle: sf.radians(1), outerAngle: sf.radians(2),
      outerGain: 0.25 });
    const oracle = native.audioSourceOracle(source[audioHandle]);
    for (const [ name, index, value ] of scalars) {
      assert.ok(Math.abs(oracle[index] - value) < 1e-5, name);
      assert.equal(source[`get${name}`](), oracle[index], name);
    }
    assert.equal(oracle[3], 0);
    assert.equal(oracle[18], 1);
    assert.deepEqual(oracle.slice(4, 16),
      [ 2, 3, 4, 0, 0, -1, 1, 2, 0.25, -2, 1, 3 ]);
    native.audioSourceOracle(source[audioHandle], true);
    assert.ok(Math.abs(source.getVolume() - 41) < 1e-5);
    assert.equal(source.getPosition().z, 9);
    assert.equal(source.isSpatializationEnabled(), false);
    assert.equal(source.isRelativeToListener(), true);
  });

test('Sound control fields execute SFML and result vectors are independent',
  async () => {
    assert.equal(sf.PlaybackDevice.setDeviceToNull(), true);
    const { buffer } = makeBuffer();
    const sound = new sf.Sound(buffer);
    sound.setVolume(27);
    assert.ok(Math.abs(sound.getVolume() - 27) < 1e-5);
    sound.setPitch(1.5);
    assert.equal(sound.getPitch(), 1.5);
    sound.setPosition(new sf.Vector3f(1, 2, 3));
    const point = sound.getPosition();
    point.x = 90;
    assert.equal(sound.getPosition().x, 1);
    sound.setCone(new sf.Cone({
      innerAngle: sf.degrees(30), outerAngle: sf.degrees(60), outerGain: 0.5,
    }));
    assert.equal(sound.getCone().outerGain, 0.5);
    sound.setLooping(true);
    sound.play();
    await sf.sleep(sf.milliseconds(30));
    assert.equal(sound.getStatus(), sf.SoundStatus.Playing);
    sound.pause();
    assert.equal(sound.getStatus(), sf.SoundStatus.Paused);
    sound.stop();
    assert.equal(sound.getStatus(), sf.SoundStatus.Stopped);
    const copy = new sf.Sound(sound);
    assert.equal(copy.getBuffer(), buffer);
    assert.equal(copy.getPitch(), 1.5);
    buffer.loadFromSamples(new Int16Array([ 3, 4, 5 ]), 1, 44100, mono);
    assert.equal(sound.getBuffer().getSampleCount(), 3n);
    assert.equal(native.audioSourceCommand(sound[audioHandle], 4), undefined);
  });

test('Audio WAV read/write, seek, memory loading and Music share SFML codecs',
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'sfml-audio-'));
    try {
      const path = join(directory, 'samples.wav');
      const { buffer, samples } = makeBuffer();
      assert.equal(await buffer.saveToFile(path), true);
      const file = new sf.InputSoundFile();
      assert.equal(await file.openFromFile(path), true);
      assert.equal(file.getSampleCount(), BigInt(samples.length));
      const actual = new Int16Array(samples.length + 20);
      assert.equal(await file.read(actual), BigInt(samples.length));
      assert.deepEqual(actual.subarray(0, samples.length), samples);
      assert.equal(file.getSampleOffset(), BigInt(samples.length));
      await file.seek(5n);
      const tail = new Int16Array(2);
      assert.equal(await file.read(tail), 2n);
      assert.deepEqual(tail, samples.subarray(5, 7));
      await file.close();
      assert.equal(file.getSampleCount(), 0n);
      const memory = new sf.SoundBuffer();
      assert.equal(await memory.loadFromMemory(await readFile(path)), true);
      assert.deepEqual(memory.getSamples(), samples);
      const output = new sf.OutputSoundFile();
      const written = join(directory, 'written.wav');
      assert.equal(await output.openFromFile(written, 44100, 1, mono), true);
      const first = output.write(samples.subarray(0, 100));
      const second = output.write(samples.subarray(100));
      await Promise.all([ first, second, output.close() ]);
      assert.equal(await memory.loadFromFile(written), true);
      assert.deepEqual(memory.getSamples(), samples);
      const music = new sf.Music();
      assert.equal(await music.openFromFile(path), true);
      assert.equal(music.getSampleRate(), 44100);
      assert.equal(music.getChannelCount(), 1);
      assert.equal(music.getDuration().asMicroseconds(),
        buffer.getDuration().asMicroseconds());
      music.setLoopPoints(new sf.TimeSpan({
        offset: sf.milliseconds(10), length: sf.milliseconds(50),
      }));
      assert.ok(music.getLoopPoints().length.asMicroseconds() > 0n);
      music.play();
      await sf.sleep(sf.milliseconds(20));
      music.stop();
    } finally { await rm(directory, { recursive: true, force: true }); }
  });

test('Listener fields and playback device queries use native state', () => {
  sf.Listener.setGlobalVolume(63);
  assert.equal(sf.Listener.getGlobalVolume(), 63);
  sf.Listener.setPosition(new sf.Vector3f(2, 4, 6));
  assert.equal(sf.Listener.getPosition().z, 6);
  sf.Listener.setDirection(new sf.Vector3f(1, 0, -1));
  assert.equal(sf.Listener.getDirection().x, 1);
  sf.Listener.setVelocity(new sf.Vector3f(0, 0, 2));
  assert.equal(sf.Listener.getVelocity().z, 2);
  sf.Listener.setUpVector(new sf.Vector3f(0, 1, 0));
  assert.equal(sf.Listener.getUpVector().y, 1);
  assert.equal(Array.isArray(sf.PlaybackDevice.getAvailableDevices()), true);
  assert.equal(typeof sf.PlaybackDevice.isDefaultDevice(), 'boolean');
  assert.ok(sf.PlaybackDevice.getDeviceSampleRate() > 0);
  sf.PlaybackDevice.setNotificationCallback(() => {});
  sf.PlaybackDevice.setNotificationCallback();
  sf.Listener.setGlobalVolume(100);
});
