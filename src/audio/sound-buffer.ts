import {
  audioNative, audioHandle, audioAsync, AudioQueue, type AudioHandle,
  type AudioBufferMapping,
} from '../internal/audio-native';
import { nativeStruct } from '../internal/struct-view';
import { Time } from '../system/time';
import type { InputStream } from '../system/input-stream';
import { AudioInputStream } from '../internal/audio-input-stream';
import { audioReaders, audioWriters } from '../internal/audio-codec-registry';
import { InputSoundFile } from './input-sound-file';
import { OutputSoundFile } from './output-sound-file';
import {
  channels, unsigned, samples, type SoundChannel, type ReadonlySamples,
  type ChannelMap,
} from './value';

function view(mapping: AudioBufferMapping) {
  return nativeStruct<{
    sampleCount: bigint; sampleRate: number; channelCount: number;
    duration: bigint; samples: Int16Array; channelMap: Int32Array;
  }>(mapping.info, {
    samples: new Int16Array(mapping.samples),
    channelMap: new Int32Array(mapping.channelMap),
  });
}

/** 音频缓冲区的只读接口，样本视图保留其对应的原生存储。 */
export type ReadonlySoundBuffer = Readonly<Pick<SoundBuffer,
typeof audioHandle | 'getSamples' | 'getSampleCount' | 'getSampleRate' |
'getChannelCount' | 'getChannelMap' | 'getDuration' | 'saveToFile'>>;

export const adoptAudioBuffer: unique symbol = Symbol('Audio.adoptBuffer');

/** Views retain the exact native allocation from which they were obtained. */
export class SoundBuffer {
  readonly [audioHandle]: AudioHandle<'buffer'>;
  private state: ReturnType<typeof view>;
  private readonly queue = new AudioQueue();

  /** 创建空音频缓冲区，或深复制现有缓冲区。 */
  constructor(source?: ReadonlySoundBuffer);
  /** 复制交错 16 位 PCM；采样率以 Hz 计，channelMap 指定各声道位置。 */
  constructor(samples: Int16Array, channelCount: number, sampleRate: number,
    channelMap: Iterable<SoundChannel>);
  constructor(source?: ReadonlySoundBuffer | Int16Array,
    channelCount?: number, sampleRate?: number,
    channelMap?: Iterable<SoundChannel>) {
    let mapping: AudioBufferMapping & { handle: AudioHandle<'buffer'> };
    if (source instanceof Int16Array) {
      mapping = audioNative.createAudioBuffer(source, unsigned(sampleRate!),
        unsigned(channelCount!), channels(channelMap!));
    } else {
      if (source !== undefined && !(source instanceof SoundBuffer)) {
        throw new TypeError('Expected a SoundBuffer or Int16Array');
      }
      mapping = audioNative.createAudioBuffer(source?.[audioHandle]);
    }
    this[audioHandle] = mapping.handle;
    this.state = view(mapping);
  }
  /** Copy the current source data synchronously, retaining this buffer's identity. */
  assign(source: ReadonlySoundBuffer): this {
    if (!(source instanceof SoundBuffer)) {
      throw new TypeError('Expected a SoundBuffer');
    }
    if (source === this) return this;
    this.state = view(audioNative.assignAudioBuffer(
      this[audioHandle], source[audioHandle]));
    return this;
  }
  /** @internal */
  static [adoptAudioBuffer](data: AudioHandle<'bufferData'>): SoundBuffer {
    const result = new SoundBuffer();
    result.state = view(audioNative.commitAudioBuffer(result[audioHandle], data));
    return result;
  }
  /** 异步解码整个音频文件到原生 PCM 存储，返回是否成功。 */
  loadFromFile(filename: string): Promise<boolean> {
    return audioReaders.size ? this.loadDecoded(filename) : this.load(filename);
  }
  /** 异步解码编码音频字节并替换 PCM，返回是否成功。 */
  loadFromMemory(data: Uint8Array): Promise<boolean> {
    return audioReaders.size ? this.loadDecoded(data) : this.load(data);
  }
  /** 从输入流异步解码全部样本，返回是否成功；流异常会拒绝 Promise。 */
  loadFromStream(stream: InputStream): Promise<boolean> {
    return audioReaders.size ? this.loadDecoded(stream)
      : this.load(new AudioInputStream(stream));
  }

  /** 同步复制交错 16 位 PCM 并替换内容；sampleRate 为 Hz，返回是否成功。 */
  loadFromSamples(data: Int16Array, channelCount: number, sampleRate: number,
    channelMap: Iterable<SoundChannel>): boolean {
    samples(data);
    const result = audioNative.audioBufferSamples(data, unsigned(sampleRate),
      unsigned(channelCount), channels(channelMap));
    if (!result) return false;
    this.state = view(audioNative.commitAudioBuffer(this[audioHandle], result));
    return true;
  }
  /** 返回 PCM 只读类型视图；空缓冲区为 undefined，重新加载后旧视图仍指向旧存储。 */
  getSamples(): ReadonlySamples | undefined {
    return this.state.samples.length ? this.state.samples : undefined;
  }
  /** 返回所有声道合计的样本数量。 */
  getSampleCount(): bigint { return this.state.sampleCount; }
  /** 返回每声道采样率，单位为 Hz。 */
  getSampleRate(): number { return this.state.sampleRate; }
  /** 返回声道数量。 */
  getChannelCount(): number { return this.state.channelCount; }
  /** 返回交错声道位置顺序的只读视图。 */
  getChannelMap(): ChannelMap { return this.state.channelMap; }
  /** 返回音频总时长副本。 */
  getDuration(): Time { return new Time(this.state.duration); }
  /** 按文件扩展名异步编码保存，返回是否成功。 */
  saveToFile(filename: string): Promise<boolean> {
    if (audioWriters.size) {
      return this.queue.run(async () => {
        const output = new OutputSoundFile();
        try {
          const ok = await output.openFromFile(filename, this.getSampleRate(),
            this.getChannelCount(), this.getChannelMap());
          if (!ok) return false;
          if (this.state.samples.length) await output.write(this.state.samples);
          return true;
        } finally { await output.close(); }
      });
    }
    return this.queue.run(() => audioAsync(callback =>
      audioNative.saveAudioBuffer(this[audioHandle], filename, callback)));
  }
  private loadDecoded(input: string | Uint8Array | InputStream):
  Promise<boolean> {
    return this.queue.run(async () => {
      const file = new InputSoundFile();
      try {
        const ok = typeof input === 'string' ? await file.openFromFile(input)
          : input instanceof Uint8Array ? await file.openFromMemory(input)
            : await file.openFromStream(input);
        if (!ok) return false;
        const count = file.getSampleCount();
        if (count > 0xffffffffn) throw new RangeError('Sample buffer is too large');
        const data = new Int16Array(
          audioNative.allocateAudioSamples(Number(count)));
        let position = 0;
        while (position < data.length) {
          const read = Number(await file.read(data.subarray(position)));
          if (!read) return false;
          position += read;
        }
        return this.loadFromSamples(data, file.getChannelCount(),
          file.getSampleRate(), file.getChannelMap());
      } finally { await file.close(); }
    });
  }
  private load(input: string | Uint8Array | AudioInputStream): Promise<boolean> {
    return this.queue.run(async () => {
      const stream = input instanceof AudioInputStream ? input : undefined;
      try {
        const load = () => audioAsync<AudioHandle<'bufferData'> | undefined>(
          callback => audioNative.loadAudioBuffer(
            stream ? stream.handle : input as string | Uint8Array, callback));
        const data = await (stream ? stream.run(load) : load());
        if (!data) return false;
        this.state = view(audioNative.commitAudioBuffer(this[audioHandle], data));
        return true;
      } finally { stream?.close(); }
    });
  }
}
