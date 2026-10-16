import {
  audioNative, audioHandle, audioAsync, AudioQueue, type AudioHandle,
  type AudioFileMapping,
} from '../internal/audio-native';
import { Time } from '../system/time';
import type { InputStream } from '../system/input-stream';
import { AudioInputStream } from '../internal/audio-input-stream';
import { findAudioReaderInput } from '../internal/audio-codec-registry';
import { SoundFileReaderInfo } from './sound-file-reader';
import type { ReadonlyValue as R } from '../internal/value-storage';
import { duration, samples, type ChannelMap } from './value';

export const cancelAudioInput: unique symbol = Symbol('Audio.cancelInput');

/** 可寻址音频解码器，按调用顺序异步读取交错 16 位 PCM。 */
export class InputSoundFile {
  readonly [audioHandle]: AudioHandle<'input'>;
  private readonly queue = new AudioQueue();
  private u64: BigUint64Array;
  private i64: BigInt64Array;
  private u32: Uint32Array;
  private channelMap: Int32Array;
  private stream?: AudioInputStream;
  private custom?: NonNullable<Awaited<ReturnType<typeof findAudioReaderInput>>>;
  private customMetadata?: AudioHandle<'fileMetadata'>;

  /** 创建未打开数据源的解码器。 */
  constructor() {
    const mapping = audioNative.createAudioInput();
    this[audioHandle] = mapping.handle;
    this.u64 = new BigUint64Array(mapping.buffer);
    this.i64 = new BigInt64Array(mapping.buffer);
    this.u32 = new Uint32Array(mapping.buffer);
    this.channelMap = new Int32Array(mapping.channelMap);
  }
  /** 异步打开音频文件并读取格式信息，返回是否成功。 */
  openFromFile(filename: string): Promise<boolean> { return this.open(filename); }
  /** 异步打开编码音频字节，返回是否成功。 */
  openFromMemory(data: Uint8Array): Promise<boolean> { return this.open(data); }
  /** 异步打开可寻址流，读取期间保留数据源引用。 */
  openFromStream(stream: InputStream): Promise<boolean> {
    return this.open(stream);
  }
  /** 返回所有声道合计的样本总数。 */
  getSampleCount(): bigint { return this.u64[0]; }
  /** 返回当前样本偏移，包含所有交错声道。 */
  getSampleOffset(): bigint { return this.u64[1]; }
  /** 返回音频总时长。 */
  getDuration(): Time { return new Time(this.i64[2]); }
  /** 返回当前解码位置对应的时间。 */
  getTimeOffset(): Time { return new Time(this.i64[3]); }
  /** 返回每声道采样率，单位为 Hz。 */
  getSampleRate(): number { return this.u32[10]; }
  /** 返回声道数。 */
  getChannelCount(): number { return this.u32[11]; }
  /** 返回交错声道的位置映射。 */
  getChannelMap(): ChannelMap { return this.channelMap; }
  /** @internal */
  [cancelAudioInput](): void { this.stream?.close(); }
  /** 异步解码到 data，返回实际写入的样本数；末尾返回 0n，完成前勿修改缓冲区。 */
  read(data: Int16Array): Promise<bigint> {
    samples(data);
    return this.queue.run(async () => {
      if (this.custom) {
        const count = data.length ? await this.custom.reader.read(data) : 0n;
        if (typeof count !== 'bigint' || count < 0n ||
            count > BigInt(data.length)) {
          throw new RangeError('Reader returned an invalid sample count');
        }
        audioNative.updateAudioFileMetadata(this.customMetadata!, 0, count);
        return count;
      }
      await this.runStream(() => audioAsync<void>(callback =>
        audioNative.readAudioInput(this[audioHandle], data, callback)));
      return this.u64[4];
    });
  }
  /** 异步跳转到样本偏移（bigint，包含所有声道）或时间偏移（Time）。 */
  seek(offset: bigint | R<Time>): Promise<void> {
    const time = offset instanceof Time;
    const value = time ? duration(offset) : offset;
    if (typeof value !== 'bigint' || (!time && value < 0n)) {
      throw new RangeError('Expected a non-negative sample offset or a Time');
    }
    return this.queue.run(async () => {
      if (this.custom) {
        audioNative.updateAudioFileMetadata(this.customMetadata!,
          time ? 2 : 1, value);
        await this.custom.reader.seek(this.u64[4]);
        audioNative.updateAudioFileMetadata(this.customMetadata!, 3);
      } else {
        await this.runStream(() => audioAsync<void>(callback =>
          audioNative.seekAudioInput(this[audioHandle], value, time, callback)));
      }
    });
  }
  /** 等待此前操作并异步关闭解码器、释放其持有的数据源。 */
  close(): Promise<void> {
    return this.queue.run(async () => {
      this.map(await audioAsync<AudioFileMapping>(callback =>
        audioNative.closeAudioInput(this[audioHandle], callback)));
      this.stream?.close();
      this.stream = undefined;
      await this.releaseCustom();
    });
  }
  private map(mapping: AudioFileMapping): void {
    this.u64 = new BigUint64Array(mapping.buffer);
    this.i64 = new BigInt64Array(mapping.buffer);
    this.u32 = new Uint32Array(mapping.buffer);
    this.channelMap = new Int32Array(mapping.channelMap);
  }
  private runStream<T>(action: () => Promise<T>): Promise<T> {
    return this.stream ? this.stream.run(action) : action();
  }
  private async releaseCustom(): Promise<void> {
    const custom = this.custom;
    this.custom = undefined;
    this.customMetadata = undefined;
    try { await custom?.reader.close(); } finally { await custom?.owned?.close(); }
  }
  private open(input: string | Uint8Array | InputStream): Promise<boolean> {
    return this.queue.run(async () => {
      const custom = await findAudioReaderInput(input);
      if (custom) {
        let opened = false;
        try {
          const info = await custom.reader.open(custom.stream);
          if (info === undefined) return false;
          if (!(info instanceof SoundFileReaderInfo)) {
            throw new TypeError('Reader.open must return SoundFileReader.Info');
          }
          const mapping = audioNative.createAudioFileMetadata(info[audioHandle]);
          await audioAsync<AudioFileMapping>(callback =>
            audioNative.closeAudioInput(this[audioHandle], callback));
          await this.releaseCustom();
          this.stream?.close();
          this.stream = undefined;
          this.map(mapping);
          this.custom = custom;
          this.customMetadata = mapping.handle;
          opened = true;
          return true;
        } finally {
          if (!opened) {
            try { await custom.reader.close(); } finally {
              await custom.owned?.close();
            }
          }
        }
      }
      const stream = typeof input === 'string' || input instanceof Uint8Array
        ? undefined : new AudioInputStream(input);
      let opened = false;
      try {
        const load = () => audioAsync<AudioFileMapping | undefined>(callback =>
          audioNative.openAudioInput(this[audioHandle],
            stream ? stream.handle : input as string | Uint8Array, callback));
        const mapping = await (stream ? stream.run(load) : load());
        if (mapping) {
          await this.releaseCustom();
          this.map(mapping);
          this.stream?.close();
          this.stream = stream;
          opened = true;
        }
        return opened;
      } finally {
        if (!opened) stream?.close();
      }
    });
  }
}
