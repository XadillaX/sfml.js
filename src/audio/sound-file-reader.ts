import {
  audioNative, audioHandle, type AudioHandle, type AudioReaderInfoMapping,
} from '../internal/audio-native';
import type { InputStream } from '../system/input-stream';
import { channels, unsigned, type SoundChannel, type ChannelMap } from './value';

/** 自定义音频解码器返回的格式信息。 */
export interface SoundFileReaderInfoInput {
  /** 所有交错声道合计的样本总数。 */
  sampleCount: bigint;
  /** 声道数量。 */
  channelCount: number;
  /** 每声道采样率，单位为 Hz。 */
  sampleRate: number;
  /** 按交错顺序排列的声道位置。 */
  channelMap: Iterable<SoundChannel>;
}
/** sf::SoundFileReader::Info with directly mapped scalar fields. */
export class SoundFileReaderInfo {
  readonly [audioHandle]: AudioHandle<'readerInfo'>;
  private readonly count: BigUint64Array;
  private readonly channels: Uint32Array;
  private readonly rate: Uint32Array;
  private map: Int32Array;
  /** 创建空格式信息或复制 value；mapping 供原生解码器内部映射使用。 */
  constructor(value?: SoundFileReaderInfoInput,
    mapping: AudioReaderInfoMapping = audioNative.createAudioReaderInfo()) {
    this[audioHandle] = mapping.handle;
    const region = (name: string) => {
      const [ , index, offset ] = mapping.info.fields[name];
      return { buffer: mapping.info.buffers[index], offset };
    };
    const count = region('sampleCount');
    const channels = region('channelCount');
    const rate = region('sampleRate');
    this.count = new BigUint64Array(count.buffer, count.offset, 1);
    this.channels = new Uint32Array(channels.buffer, channels.offset, 1);
    this.rate = new Uint32Array(rate.buffer, rate.offset, 1);
    this.map = new Int32Array(mapping.channelMap);
    if (value) {
      this.sampleCount = value.sampleCount;
      this.channelCount = value.channelCount;
      this.sampleRate = value.sampleRate;
      this.channelMap = value.channelMap;
    }
  }
  /** 所有声道合计的样本总数。 */
  get sampleCount(): bigint { return this.count[0]; }
  /** 设置无符号 64 位样本总数。 */
  set sampleCount(value: bigint) {
    if (typeof value !== 'bigint' || value < 0n || value > 0xffffffffffffffffn) {
      throw new RangeError('Expected uint64 sample count');
    }
    this.count[0] = value;
  }
  /** 声道数量。 */
  get channelCount(): number { return this.channels[0]; }
  /** 设置声道数量。 */
  set channelCount(value: number) { this.channels[0] = unsigned(value); }
  /** 每声道采样率，单位为 Hz。 */
  get sampleRate(): number { return this.rate[0]; }
  /** 设置采样率，单位为 Hz。 */
  set sampleRate(value: number) { this.rate[0] = unsigned(value); }
  /** 交错声道位置的只读视图。 */
  get channelMap(): ChannelMap { return this.map; }
  /** 复制声道位置映射。 */
  set channelMap(value: Iterable<SoundChannel>) {
    this.map = new Int32Array(audioNative.setAudioReaderChannels(
      this[audioHandle], channels(value)));
  }
}

/** 自定义音频解码器接口，读写位置以所有声道合计的样本数计。 */
export abstract class SoundFileReader {
  /** 解码器格式信息类型。 */
  static readonly Info = SoundFileReaderInfo;
  /** 打开输入流并返回格式信息；无法打开时返回 undefined。 */
  abstract open(stream: InputStream): SoundFileReaderInfo | undefined |
  Promise<SoundFileReaderInfo | undefined>;
  /** 移动到指定交错样本偏移，偏移从零开始。 */
  abstract seek(sampleOffset: bigint): void | Promise<void>;
  /** 解码到提供的缓冲区，返回实际样本数；末尾返回 0n。 */
  abstract read(samples: Int16Array): bigint | Promise<bigint>;
  /** 释放解码器持有的资源；默认无操作。 */
  close(): void | Promise<void> {}
}
/** 可注册的解码器类，需提供无参数构造函数及格式探测方法。 */
export interface SoundFileReaderConstructor {
  /** 创建尚未打开的解码器实例。 */
  new (): SoundFileReader;
  /** 探测输入流是否属于本解码器支持的格式。 */
  check(stream: InputStream): boolean | Promise<boolean>;
}
