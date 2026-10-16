import {
  SoundBuffer, SoundSource, Sound, SoundStream, Music, SoundRecorder,
  SoundBufferRecorder, EffectProcessor, InputSoundFile, OutputSoundFile,
  Cone, TimeSpan, SoundStatus, SoundChannel, Listener, PlaybackDevice,
  seconds, Vector3f, type ReadonlySoundBuffer, type SoundStreamCallbacks,
  type SoundRecorderCallbacks, type EffectProcessorCallbacks,
  type AudioWorkerOptions, type AudioWorkerStats,
  SoundFileReader, SoundFileWriter, SoundFileFactory, SoundFileReaderInfo,
  MemoryInputStream, type InputStream, type SoundFileReaderInfoInput,
} from '..';

const worker: AudioWorkerOptions = { module: '/audio.cjs', data: { seed: 2 } };
const mono = [ SoundChannel.Mono ];
const buffer = new SoundBuffer();
const samples = new Int16Array(100);
const loaded: boolean = buffer.loadFromSamples(samples, 1, 44100, mono);
const count: bigint = buffer.getSampleCount();
const readOnly: ReadonlySoundBuffer = buffer;
const fromSamples = new SoundBuffer(samples, 1, 44100, mono);
const assigned: SoundBuffer = fromSamples.assign(readOnly);
class DerivedBuffer extends SoundBuffer {
  marker = true;
}
const assignedDerived: DerivedBuffer = new DerivedBuffer().assign(readOnly);
const sound = new Sound(readOnly);
const source: SoundSource = sound;
source.setPosition(new Vector3f(1, 2, 3));
source.setCone(new Cone());
source.setPlayingOffset(seconds(1));
const status: SoundStatus = source.getStatus();
const effect = new EffectProcessor(worker);
source.setEffectProcessor(effect);
source.setEffectProcessor();
const stream = new SoundStream({ ...worker,
  sampleRate: 44100, channelCount: 1, channelMap: mono });
const music: SoundStream = new Music();
const song = new Music();
song.setLoopPoints(new TimeSpan({ offset: seconds(0), length: seconds(2) }));
const file = new InputSoundFile();
const read: Promise<bigint> = file.read(samples);
const output = new OutputSoundFile();
const opened: Promise<boolean> = output.openFromFile('a.wav', 44100, 1, mono);
const recorder = new SoundRecorder(worker);
const started: Promise<boolean> = recorder.start();
const changed: Promise<boolean> = recorder.setDevice('device');
const recording = new SoundBufferRecorder();
const capture: ReadonlySoundBuffer = recording.getBuffer();
const stats: AudioWorkerStats | undefined = stream.getWorkerStats();
const infoInput: SoundFileReaderInfoInput = {
  sampleCount: 100n, channelCount: 1, sampleRate: 44100, channelMap: mono,
};
const readerInfo: SoundFileReaderInfo = new SoundFileReader.Info(infoInput);
readerInfo.sampleCount = 200n;
readerInfo.channelCount = 2;
readerInfo.channelMap = [ SoundChannel.FrontLeft, SoundChannel.FrontRight ];
class CustomReader extends SoundFileReader {
  static check(stream: InputStream): boolean { void stream; return true; }
  open(stream: InputStream): SoundFileReaderInfo {
    void stream;
    return new SoundFileReader.Info(infoInput);
  }
  seek(offset: bigint): void { void offset; }
  read(samples: Int16Array): bigint { samples.fill(0); return 0n; }
}
class CustomWriter extends SoundFileWriter {
  static check(filename: string): boolean { return filename.endsWith('.raw'); }
  open(): boolean { return true; }
  write(samples: Int16Array): void { void samples; }
}
SoundFileFactory.registerReader(CustomReader);
SoundFileFactory.registerWriter(CustomWriter);
const registered: boolean = SoundFileFactory.isReaderRegistered(CustomReader);
SoundFileFactory.unregisterReader(CustomReader);
SoundFileFactory.unregisterWriter(CustomWriter);
const nativeReader: Promise<SoundFileReader | undefined> =
  SoundFileFactory.createReaderFromMemory(new Uint8Array(0));
const nativeWriter: Promise<SoundFileWriter | undefined> =
  SoundFileFactory.createWriterFromFilename('audio.wav');
const sourceStream = new MemoryInputStream(new Uint8Array());
const streamed: Promise<boolean>[] = [
  buffer.loadFromStream(sourceStream), song.openFromStream(sourceStream),
  file.openFromStream(sourceStream),
];
Listener.setPosition(source.getPosition());
PlaybackDevice.setNotificationCallback(event => { void event; });

const streamCallbacks: SoundStreamCallbacks = {
  onGetData(chunk) {
    chunk.samples.fill(0);
    chunk.sampleCount = chunk.samples.length;
    // @ts-expect-error Native sample storage must not be replaced.
    chunk.samples = new Int16Array(0);
    return false;
  },
  onSeek(time) { void time.asMicroseconds(); },
  onLoop() { return 0n; },
};
const recorderCallbacks: SoundRecorderCallbacks = {
  onStart() { return true; },
  onProcessSamples(data) { return data.length > 0; },
  onStop() {},
};
const effectCallbacks: EffectProcessorCallbacks = {
  process(input, inputCount, destination, outputCount, channels) {
    if (input) destination.set(input);
    void channels;
    return { inputFrameCount: inputCount,
      outputFrameCount: Math.min(inputCount, outputCount) };
  },
};

// @ts-expect-error Recorded buffers expose no reload operations.
capture.loadFromFile('a.wav');
// @ts-expect-error Recorded buffers expose no assignment operation.
capture.assign(buffer);
// @ts-expect-error PCM construction requires all stream metadata.
new SoundBuffer(samples);
// @ts-expect-error PCM construction only accepts signed 16-bit samples.
new SoundBuffer(new Float32Array(100), 1, 44100, mono);
// @ts-expect-error Assignment requires a SoundBuffer.
buffer.assign(samples);
// @ts-expect-error Sample counts preserve 64-bit precision.
const badCount: number = buffer.getSampleCount();
// @ts-expect-error Sound buffer samples are read-only.
buffer.getSamples()![0] = 2;
// @ts-expect-error Audio callbacks run in module-based Workers.
new EffectProcessor(() => {});
// @ts-expect-error Stream metadata is mandatory.
new SoundStream(worker);
// @ts-expect-error Base source cannot be instantiated.
new SoundSource();

export {
  loaded, count, readOnly, status, effect, stream, music, read, opened,
  started, changed, capture, stats, streamCallbacks, recorderCallbacks,
  effectCallbacks, badCount,
  readerInfo, registered, nativeReader, nativeWriter, streamed,
  fromSamples, assigned, assignedDerived,
};
