'use strict';

const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const sf = require('..');

async function main() {
  const rate = 44100;
  const samples = Int16Array.from({ length: rate * 2 },
    (_, i) => Math.sin(i * 2 * Math.PI * 440 / rate) * 10000);
  const buffer = new sf.SoundBuffer();
  assert.equal(buffer.loadFromSamples(samples, 1, rate,
    [ sf.SoundChannel.Mono ]), true);
  const sound = new sf.Sound(buffer);
  const module = join(__dirname, 'audio-worker.cjs');
  const stream = new sf.SoundStream({ module, exportName: 'tone',
    sampleRate: rate, channelCount: 1, channelMap: [ sf.SoundChannel.Mono ] });
  const effect = new sf.EffectProcessor({ module, exportName: 'filter' });
  const music = new sf.Music();
  const recorder = new sf.SoundBufferRecorder();
  const wav = Buffer.alloc(44 + samples.byteLength);
  wav.write('RIFF');
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(samples.byteLength, 40);
  for (let i = 0; i < samples.length; i++) {
    wav.writeInt16LE(samples[i], 44 + i * 2);
  }
  assert.equal(await music.openFromMemory(wav), true);
  await Promise.all([ stream.ready, effect.ready ]);
  const sources = [ sound, stream, music ];
  for (const source of sources) {
    source.setLooping(true);
    source.setVolume(15);
    source.setSpatializationEnabled(false);
  }
  const font = new sf.Font();
  const systemFont = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf';
  assert.equal(await font.openFromFile(existsSync(systemFont) ? systemFont
    : join(__dirname, '../test/fixtures/fonts/DejaVuSansMono.ttf')), true);
  const window = new sf.RenderWindow(new sf.Vector2u(1040, 730),
    'sfml.js | Audio / native PCM / Worker DSP', {
      style: sf.Style.Titlebar + sf.Style.Close,
    });
  window.setKeyRepeatEnabled(false);
  const background = new sf.Color(13, 18, 27);
  const accent = new sf.Color(72, 222, 174);
  const muted = new sf.Color(155, 176, 196);
  const texts = [];
  const buttons = [];
  const boxes = [];
  let selected = 0;
  let filtered = false;
  let recording = false;
  let captured = 0n;
  let message = 'Ready. Space starts playback.';
  let busy = false;
  const smokeMode = process.argv.includes('--smoke');
  let smokeDone = !smokeMode;
  let smokeError;
  const frameArg = process.argv.find(value => value.startsWith('--frames='));
  const limit = frameArg ? Number(frameArg.slice(9)) : Infinity;
  if (frameArg && (!Number.isSafeInteger(limit) || limit < 1)) {
    throw new RangeError('Expected positive --frames');
  }

  function text(content, x, y, size = 18, color = sf.Color.White) {
    const value = new sf.Text({ font, string: content, characterSize: size });
    value.setPosition(new sf.Vector2f(x, y));
    value.setFillColor(color);
    texts.push(value);
    return value;
  }
  function update(value, content) {
    if (value.getString() !== content) value.setString(content);
  }
  function button(content, x, y, width, action) {
    const box = new sf.RectangleShape(new sf.Vector2f(width, 42));
    box.setPosition(new sf.Vector2f(x, y));
    box.setFillColor(new sf.Color(35, 54, 68));
    boxes.push(box);
    text(content, x + 12, y + 10, 17, accent);
    buttons.push({ x, y, width, action });
  }
  function select(index) {
    if (!sources[index]) {
      message = 'Record with R, then finish with T.';
      return;
    }
    sources[selected].stop();
    sources[selected].setEffectProcessor();
    selected = index;
    if (filtered) sources[selected].setEffectProcessor(effect);
    sources[selected].play();
  }
  function togglePlayback() {
    const source = sources[selected];
    if (source.getStatus() === sf.SoundStatus.Playing) source.pause();
    else source.play();
  }
  function toggleEffect() {
    filtered = !filtered;
    sources[selected].setEffectProcessor(filtered ? effect : undefined);
  }
  async function startRecording() {
    if (recording) return;
    for (const source of sources) source.stop();
    recording = await recorder.start(rate);
    message = recording ? 'Recording to memory. T finishes.'
      : 'Capture device could not start.';
  }
  async function stopRecording() {
    if (!recording) return;
    await recorder.stop();
    recording = false;
    const recordingBuffer = recorder.getBuffer();
    captured = recordingBuffer.getSampleCount();
    if (captured) {
      if (selected === 3) select(0);
      sources[3]?.stop();
      sources[3] = new sf.Sound(recordingBuffer);
      sources[3].setVolume(40);
      sources[3].setSpatializationEnabled(false);
    }
    message = `Captured ${captured} samples. Press 4 to listen.`;
  }
  async function guarded(action) {
    if (busy) return;
    busy = true;
    try { await action(); } catch (error) {
      message = `${error.name}: ${error.message}`;
    } finally { busy = false; }
  }
  text('AUDIO / SFML 3.1', 32, 22, 32);
  text('Sound buffer, streaming, music, Worker effect and microphone',
    34, 68, 18, muted);
  text(`Output: ${sf.PlaybackDevice.getDevice() ?? 'default'}   /   ` +
    `${sf.PlaybackDevice.getDeviceSampleRate()} Hz`, 34, 100, 17, muted);
  button('1  Sound / 440 Hz', 32, 145, 225, () => select(0));
  button('2  Worker / 330 Hz', 277, 145, 225, () => select(1));
  button('3  Music / WAV', 522, 145, 225, () => select(2));
  button('4  Recording', 767, 145, 241, () => select(3));
  const state = text('', 34, 211, 22, accent);
  const waveformLabel = text('', 34, 250, 15, muted);
  const waveform = new sf.VertexArray(sf.PrimitiveType.LineStrip, 900);
  const vertices = Array.from({ length: 900 }, (_, i) => {
    const vertex = waveform.getVertex(i);
    vertex.position.x = 60 + i;
    vertex.color = accent;
    return vertex;
  });
  const values = text('', 34, 412, 18);
  const stats = text('', 34, 449, 16, muted);
  button('Space  Play / pause', 32, 492, 225, togglePlayback);
  button('S  Stop', 277, 492, 225, () => sources[selected].stop());
  button('E  Filter on / off', 522, 492, 225, toggleEffect);
  button('R  Record', 767, 492, 241, startRecording);
  button('T  Finish recording', 32, 550, 225, stopRecording);
  text('Left / right: pan    Up / down: volume', 277, 560, 18, muted);
  const captureState = text('', 34, 610, 17, muted);
  const status = text(message, 34, 649, 17);
  text('Esc closes  /  recordings stay in memory', 34, 692, 15, muted);
  const actions = {
    [sf.Keyboard.Key.Num1]: () => select(0),
    [sf.Keyboard.Key.Num2]: () => select(1),
    [sf.Keyboard.Key.Num3]: () => select(2),
    [sf.Keyboard.Key.Num4]: () => select(3),
    [sf.Keyboard.Key.Space]: togglePlayback,
    [sf.Keyboard.Key.S]: () => sources[selected].stop(),
    [sf.Keyboard.Key.E]: toggleEffect,
    [sf.Keyboard.Key.R]: startRecording,
    [sf.Keyboard.Key.T]: stopRecording,
    [sf.Keyboard.Key.Left]: () => sources[selected].setPan(
      Math.max(-1, sources[selected].getPan() - 0.1)),
    [sf.Keyboard.Key.Right]: () => sources[selected].setPan(
      Math.min(1, sources[selected].getPan() + 0.1)),
    [sf.Keyboard.Key.Up]: () => sources[selected].setVolume(
      Math.min(100, sources[selected].getVolume() + 5)),
    [sf.Keyboard.Key.Down]: () => sources[selected].setVolume(
      Math.max(0, sources[selected].getVolume() - 5)),
  };
  async function smoke() {
    select(0);
    await sf.sleep(sf.milliseconds(100));
    assert.equal(sound.getStatus(), sf.SoundStatus.Playing);
    select(1);
    toggleEffect();
    await sf.sleep(sf.milliseconds(300));
    assert.ok(stream.getWorkerStats().processed > 0n);
    assert.ok(effect.getWorkerStats().processed > 0n);
    assert.equal(stream.getWorkerError(), undefined);
    assert.equal(effect.getWorkerError(), undefined);
    toggleEffect();
    select(2);
    await sf.sleep(sf.milliseconds(100));
    assert.equal(music.getStatus(), sf.SoundStatus.Playing);
    await startRecording();
    assert.equal(recording, true);
    await sf.sleep(sf.milliseconds(200));
    await stopRecording();
    assert.ok(captured > 0n);
    select(3);
    await sf.sleep(sf.milliseconds(100));
    sources[3].stop();
    message = 'PASS: playback, Worker, DSP, music, capture ' +
      `(${captured} samples)`;
    console.log(message);
  }
  window.requestFocus();
  if (smokeMode) {
    void smoke().catch(error => { smokeError = error; }).finally(() => {
      smokeDone = true;
    });
  }
  try {
    for (let frame = 0; window.isOpen() &&
        (frame < limit || !smokeDone); frame++) {
      for (let event; (event = window.pollEvent());) {
        const key = event.getIf('KeyPressed');
        if (event.is('Closed') || key?.code === sf.Keyboard.Key.Escape) {
          window.close();
          break;
        }
        if (smokeMode) continue;
        if (key && actions[key.code]) void guarded(actions[key.code]);
        const click = event.getIf('MouseButtonPressed');
        if (click?.button === sf.Mouse.Button.Left) {
          const { x, y } = click.position;
          for (const button of buttons) {
            if (x >= button.x && x < button.x + button.width &&
                y >= button.y && y < button.y + 42) void guarded(button.action);
          }
        }
      }
      if (!window.isOpen()) break;
      if (smokeError) throw smokeError;
      const source = sources[selected];
      const seconds = source.getPlayingOffset().asSeconds();
      const pcm = selected === 3 ? recorder.getBuffer().getSamples()
        : buffer.getSamples();
      const frequency = selected === 1 ? 330 : 440;
      for (let i = 0; i < vertices.length; i++) {
        const offset = Math.floor(seconds * rate) + i;
        const value = selected === 1
          ? Math.sin(offset * 2 * Math.PI * frequency / rate) * 10000
          : pcm?.[offset % pcm.length] ?? 0;
        vertices[i].position.y = 330 - value / 32768 * 70;
      }
      if (frame % 6 === 0) {
        const names = [ 'SOUND', 'WORKER STREAM', 'MUSIC', 'RECORDING' ];
        const name = names[selected];
        update(state, `${name}   /   ${sf.SoundStatus[source.getStatus()]}` +
          `   /   ${seconds.toFixed(2)} s`);
        update(waveformLabel, selected === 1
          ? '330 Hz generator reference waveform'
          : 'PCM waveform from the native SoundBuffer view');
        update(values, `Volume ${source.getVolume().toFixed(0)}   ` +
          `Pan ${source.getPan().toFixed(1)}   ` +
          `Filter ${filtered ? 'ON' : 'OFF'}`);
        const streamStats = stream.getWorkerStats();
        const effectStats = effect.getWorkerStats();
        update(stats, `Stream samples ${streamStats.processed}   ` +
          `DSP frames ${effectStats.processed}   ` +
          `Stream underruns ${streamStats.underruns}`);
        update(captureState, `Capture: ${recording ? 'RECORDING' : 'stopped'}` +
          `   Samples: ${captured}   ${recorder.getDevice()}`);
        update(status, message);
      }
      window.clear(background);
      for (const box of boxes) window.draw(box);
      window.draw(waveform);
      for (const value of texts) window.draw(value);
      if (frame === 2 && process.env.SFML_DEMO_SNAPSHOT) {
        const texture = new sf.Texture(window.getSize());
        texture.update(window);
        await texture.copyToImage().saveToFile(process.env.SFML_DEMO_SNAPSHOT);
      }
      window.display();
      if (!frame) console.log('Audio window ready. Space plays; Esc closes.');
      await sf.sleep(sf.milliseconds(16));
    }
    if (smokeError) throw smokeError;
  } finally {
    for (const source of sources) source.stop();
    await recorder.stop();
    await Promise.all([ stream.close(), music.close(), effect.close() ]);
    window.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
