'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, rm, open, readFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const sf = require('..');
const mono = [ sf.SoundChannel.Mono ];

// Header: "PCM!" + sample count u32 + sample rate u32 + channels u32.
class PCMReader extends sf.SoundFileReader {
  static async check(stream) {
    const bytes = new Uint8Array(4);
    return await stream.read(bytes) === 4n &&
      Buffer.from(bytes).toString() === 'PCM!';
  }
  async open(stream) {
    const bytes = new Uint8Array(16);
    if (await stream.read(bytes) !== 16n) return undefined;
    const view = new DataView(bytes.buffer);
    this.stream = stream;
    this.count = BigInt(view.getUint32(4, true));
    this.offset = 0n;
    return new sf.SoundFileReader.Info({
      sampleCount: this.count, sampleRate: view.getUint32(8, true),
      channelCount: view.getUint32(12, true), channelMap: mono,
    });
  }
  async read(samples) {
    const count = Number(this.count - this.offset < BigInt(samples.length)
      ? this.count - this.offset : BigInt(samples.length));
    const bytes = new Uint8Array(samples.buffer, samples.byteOffset, count * 2);
    const actual = await this.stream.read(bytes);
    if (actual === undefined) throw new Error('codec stream failed');
    this.offset += actual / 2n;
    return actual / 2n;
  }
  async seek(offset) {
    this.offset = offset < this.count ? offset : this.count;
    await this.stream.seek(16n + this.offset * 2n);
  }
}
class PCMWriter extends sf.SoundFileWriter {
  static check(filename) { return filename.endsWith('.pcm-test'); }
  async open(filename, rate, channels) {
    this.file = await open(filename, 'w');
    this.count = 0;
    const header = Buffer.alloc(16);
    header.write('PCM!');
    header.writeUInt32LE(rate, 8);
    header.writeUInt32LE(channels, 12);
    await this.file.write(header);
    return true;
  }
  async write(samples) {
    const bytes = Buffer.from(samples.buffer, samples.byteOffset,
      samples.byteLength);
    await this.file.write(bytes);
    this.count += samples.length;
  }
  async close() {
    if (!this.file) return;
    const bytes = Buffer.alloc(4);
    bytes.writeUInt32LE(this.count);
    await this.file.write(bytes, 0, 4, 4);
    await this.file.close();
    this.file = undefined;
  }
}

async function fixture(run) {
  const directory = await mkdtemp(join(tmpdir(), 'sfml-codec-'));
  try { await run(directory); } finally {
    sf.SoundFileFactory.unregisterReader(PCMReader);
    sf.SoundFileFactory.unregisterWriter(PCMWriter);
    await rm(directory, { recursive: true, force: true });
  }
}

test('Custom codecs register and cover Output/InputSoundFile and SoundBuffer',
  async () => fixture(async directory => {
    sf.SoundFileFactory.registerReader(PCMReader);
    sf.SoundFileFactory.registerWriter(PCMWriter);
    assert.equal(sf.SoundFileFactory.isReaderRegistered(PCMReader), true);
    assert.equal(sf.SoundFileFactory.isWriterRegistered(PCMWriter), true);
    const path = join(directory, 'audio.pcm-test');
    const data = Int16Array.from({ length: 4000 }, (_, i) => i - 2000);
    const output = new sf.OutputSoundFile();
    assert.equal(await output.openFromFile(path, 8000, 1, mono), true);
    await output.write(data.subarray(0, 100));
    await output.write(data.subarray(100));
    await output.close();
    const input = new sf.InputSoundFile();
    assert.equal(await input.openFromFile(path), true);
    assert.equal(input.getSampleCount(), 4000n);
    assert.equal(input.getDuration().asMicroseconds(), 500000n);
    const samples = new Int16Array(100);
    assert.equal(await input.read(samples), 100n);
    assert.deepEqual(samples, data.subarray(0, 100));
    await input.seek(sf.milliseconds(100));
    assert.equal(input.getSampleOffset(), 800n);
    await input.read(samples);
    assert.deepEqual(samples, data.subarray(800, 900));
    await input.seek(999999n);
    assert.equal(input.getSampleOffset(), 4000n);
    assert.equal(await input.read(samples), 0n);
    await input.close();
    const bytes = await readFile(path);
    for (const load of [
      buffer => buffer.loadFromFile(path),
      buffer => buffer.loadFromMemory(bytes),
      buffer => buffer.loadFromStream(new sf.MemoryInputStream(bytes)),
    ]) {
      const buffer = new sf.SoundBuffer();
      assert.equal(await load(buffer), true);
      assert.deepEqual(buffer.getSamples(), data);
      const saved = join(directory, 'saved.pcm-test');
      assert.equal(await buffer.saveToFile(saved), true);
      assert.deepEqual(await readFile(saved), bytes);
    }
    assert.ok(await sf.SoundFileFactory.createReaderFromMemory(bytes)
      instanceof PCMReader);
    assert.ok(await sf.SoundFileFactory.createWriterFromFilename(path)
      instanceof PCMWriter);
    sf.SoundFileFactory.unregisterReader(PCMReader);
    assert.equal(sf.SoundFileFactory.isReaderRegistered(PCMReader), false);
  }));

test('Native factory readers and writers expose actual SFML codec instances',
  async () => fixture(async directory => {
    const path = join(directory, 'native.wav');
    const samples = Int16Array.from({ length: 300 }, (_, i) => i);
    const writer = await sf.SoundFileFactory.createWriterFromFilename(path);
    assert.ok(writer instanceof sf.SoundFileWriter);
    assert.equal(await writer.open(path, 8000, 1, mono), true);
    await writer.write(samples);
    await writer.close();
    const bytes = await readFile(path);
    for (const create of [
      () => sf.SoundFileFactory.createReaderFromFilename(path),
      () => sf.SoundFileFactory.createReaderFromMemory(bytes),
      () => sf.SoundFileFactory.createReaderFromStream(
        new sf.MemoryInputStream(bytes)),
    ]) {
      const reader = await create();
      assert.ok(reader instanceof sf.SoundFileReader);
      try {
        const info = await reader.open(new sf.MemoryInputStream(bytes));
        assert.ok(info instanceof sf.SoundFileReader.Info);
        assert.equal(info.sampleCount, 300n);
        assert.equal(info.sampleRate, 8000);
        const actual = new Int16Array(300);
        assert.equal(await reader.read(actual), 300n);
        assert.deepEqual(actual, samples);
        await reader.seek(200n);
        assert.equal(await reader.read(actual), 100n);
        assert.deepEqual(actual.subarray(0, 100), samples.subarray(200));
      } finally { await reader.close(); }
    }
  }));

test('SFML FLAC and Ogg codecs preserve rate, channels and decoded duration',
  async () => fixture(async directory => {
    const samples = Int16Array.from({ length: 22050 },
      (_, i) => Math.round(Math.sin(i * 2 * Math.PI * 440 / 44100) * 8000));
    const source = new sf.SoundBuffer();
    assert.equal(source.loadFromSamples(samples, 1, 44100, mono), true);
    for (const extension of [ 'flac', 'ogg' ]) {
      const path = join(directory, `encoded.${extension}`);
      assert.equal(await source.saveToFile(path), true);
      const decoded = new sf.SoundBuffer();
      assert.equal(await decoded.loadFromFile(path), true);
      assert.equal(decoded.getSampleRate(), 44100);
      assert.equal(decoded.getChannelCount(), 1);
      assert.equal(decoded.getSampleCount(), BigInt(samples.length));
      const actual = decoded.getSamples();
      if (extension === 'flac') assert.deepEqual(actual, samples);
      else {
        let error = 0;
        for (let i = 0; i < samples.length; i++) {
          error += (actual[i] - samples[i]) ** 2;
        }
        assert.ok(Math.sqrt(error / samples.length) < 500);
      }
    }
  }));

test('Music streams custom codecs and InputStream with bounded decode ahead',
  async () => fixture(async directory => {
    assert.equal(sf.PlaybackDevice.setDeviceToNull(), true);
    sf.SoundFileFactory.registerReader(PCMReader);
    sf.SoundFileFactory.registerWriter(PCMWriter);
    const path = join(directory, 'music.pcm-test');
    const output = new sf.OutputSoundFile();
    await output.openFromFile(path, 8000, 1, mono);
    await output.write(new Int16Array(80000));
    await output.close();
    const bytes = await readFile(path);
    class CountedStream extends sf.MemoryInputStream {
      bytesRead = 0;
      read(data) {
        const count = super.read(data);
        this.bytesRead += Number(count);
        return count;
      }
    }
    const stream = new CountedStream(bytes);
    const music = new sf.Music();
    try {
      assert.equal(await music.openFromStream(stream), true);
      assert.ok(stream.bytesRead < bytes.length / 2);
      assert.equal(music.getDuration().asMicroseconds(), 10000000n);
      music.setLoopPoints({ offset: sf.milliseconds(100),
        length: sf.milliseconds(200) });
      assert.equal(music.getLoopPoints().offset.asMicroseconds(), 100000n);
      assert.equal(music.getLoopPoints().length.asMicroseconds(), 200000n);
      music.setLooping(true);
      music.play();
      const deadline = Date.now() + 3000;
      while (music.getWorkerStats().processed < 4000n) {
        assert.ok(Date.now() < deadline,
          `Music stalled: ${String(music.getWorkerError())}`);
        await sf.sleep(sf.milliseconds(20));
      }
      assert.equal(music.getStatus(), sf.SoundStatus.Playing);
      assert.ok(music.getWorkerStats().processed >= 2400n);
      music.setPlayingOffset(sf.seconds(2));
      await sf.sleep(sf.milliseconds(150));
      assert.ok(music.getPlayingOffset().asMicroseconds() >= 2000000n);
      assert.ok(music.getWorkerStats().processed > 0n);
      music.stop();
      music.setLooping(false);
      music.setLoopPoints({ offset: sf.milliseconds(128),
        length: sf.milliseconds(128) });
      music.play();
      await sf.sleep(sf.milliseconds(400));
      assert.equal(music.getStatus(), sf.SoundStatus.Playing,
        'Disabled loop points must not truncate Music at a block boundary');
      music.stop();
      music.setLooping(true);
      music.play();
      await sf.sleep(sf.milliseconds(100));
      music.setLooping(false);
      await sf.sleep(sf.milliseconds(400));
      assert.equal(music.getStatus(), sf.SoundStatus.Playing,
        'Disabling looping must invalidate a prefetched loop boundary');
      music.stop();
    } finally { await music.close(); }
    sf.SoundFileFactory.unregisterReader(PCMReader);
    const wav = new sf.SoundBuffer();
    wav.loadFromSamples(new Int16Array(80000), 1, 8000, mono);
    const wavPath = join(directory, 'builtin.wav');
    await wav.saveToFile(wavPath);
    const fileStream = new sf.FileInputStream();
    await fileStream.open(wavPath);
    try {
      assert.equal(await music.openFromStream(fileStream), true);
      music.play();
      await sf.sleep(sf.milliseconds(30));
      music.stop();
      assert.equal(await music.openFromFile(wavPath), true);
      music.play();
      await sf.sleep(sf.milliseconds(30));
      music.stop();
    } finally {
      await music.close();
      await fileStream.close();
    }
  }));
