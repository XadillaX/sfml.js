import { audioNative } from '../internal/audio-native';
import { Angle, radians } from '../system/angle';
import { Time } from '../system/time';
import { Vector3 } from '../system/vector3';
import type { ReadonlyValue as R } from '../internal/value-storage';

/** 交错 PCM 声道对应的扬声器位置。 */
export enum SoundChannel {
  /** 未指定位置。 */
  Unspecified,
  /** 单声道。 */
  Mono,
  /** 前左。 */
  FrontLeft,
  /** 前右。 */
  FrontRight,
  /** 前中。 */
  FrontCenter,
  /** 前中偏左。 */
  FrontLeftOfCenter,
  /** 前中偏右。 */
  FrontRightOfCenter,
  /** 低频效果声道。 */
  LowFrequencyEffects,
  /** 后左。 */
  BackLeft,
  /** 后右。 */
  BackRight,
  /** 后中。 */
  BackCenter,
  /** 侧左。 */
  SideLeft,
  /** 侧右。 */
  SideRight,
  /** 顶中。 */
  TopCenter,
  /** 顶前左。 */
  TopFrontLeft,
  /** 顶前右。 */
  TopFrontRight,
  /** 顶前中。 */
  TopFrontCenter,
  /** 顶后左。 */
  TopBackLeft,
  /** 顶后右。 */
  TopBackRight,
  /** 顶后中。 */
  TopBackCenter,
}
/** 声源当前播放状态。 */
export enum SoundStatus {
  /** 已停止。 */
  Stopped,
  /** 已暂停，保留播放位置。 */
  Paused,
  /** 正在播放。 */
  Playing,
}

/** 16 位交错 PCM 的只读类型视图，保留底层原生存储。 */
export type ReadonlySamples = Readonly<Pick<Int16Array,
number | 'length' | 'byteLength' | 'byteOffset' | typeof Symbol.iterator |
'slice' | 'entries' | 'keys' | 'values'>>;
/** 按交错顺序排列的声道位置只读视图。 */
export type ChannelMap = Readonly<Pick<Int32Array,
number | 'length' | typeof Symbol.iterator | 'slice' | 'entries' |
'keys' | 'values'>>;

/** 空间声源或监听者的方向锥参数。 */
export interface ConeInput {
  /** 不发生方向衰减的内锥完整角度。 */
  innerAngle: R<Angle>;
  /** 达到 outerGain 的外锥完整角度。 */
  outerAngle: R<Angle>;
  /** 外锥之外的增益倍率。 */
  outerGain: number;
}

/** One native sf::SoundSource::Cone, exposed through its float fields. */
export class Cone {
  private readonly values = new Float32Array(audioNative.createAudioValue(0));
  /** 创建角度和增益均为零的方向锥，或复制给定参数。 */
  constructor(value?: Readonly<ConeInput>) {
    if (value) {
      this.innerAngle = value.innerAngle;
      this.outerAngle = value.outerAngle;
      this.outerGain = value.outerGain;
    }
  }
  /** 内锥完整角度的副本。 */
  get innerAngle(): Angle { return radians(this.values[0]); }
  /** 复制内锥角度。 */
  set innerAngle(value: R<Angle>) { this.values[0] = angle(value); }
  /** 外锥完整角度的副本。 */
  get outerAngle(): Angle { return radians(this.values[1]); }
  /** 复制外锥角度。 */
  set outerAngle(value: R<Angle>) { this.values[1] = angle(value); }
  /** 外锥之外的增益倍率。 */
  get outerGain(): number { return this.values[2]; }
  /** 设置外锥增益倍率。 */
  set outerGain(value: number) { this.values[2] = float(value); }
}

/** 音频时间段输入。 */
export interface TimeSpanInput {
  /** 相对于音频起点的偏移。 */
  offset: R<Time>;
  /** 时间段长度。 */
  length: R<Time>;
}
/** 可修改的音频时间段，按精确微秒数存储。 */
export class TimeSpan {
  private readonly values = new BigInt64Array(audioNative.createAudioValue(1));
  /** 创建零偏移、零长度的时间段，或复制给定参数。 */
  constructor(value?: Readonly<TimeSpanInput>) {
    if (value) { this.offset = value.offset; this.length = value.length; }
  }
  /** 起点偏移的副本。 */
  get offset(): Time { return new Time(this.values[0]); }
  /** 复制起点偏移。 */
  set offset(value: R<Time>) { this.values[0] = duration(value); }
  /** 时长的副本。 */
  get length(): Time { return new Time(this.values[1]); }
  /** 复制时间段长度。 */
  set length(value: R<Time>) { this.values[1] = duration(value); }
}

export function float(value: number): number {
  if (typeof value !== 'number') throw new TypeError('Expected a number');
  return Math.fround(value);
}
export function flag(value: boolean): number {
  if (typeof value !== 'boolean') throw new TypeError('Expected a boolean');
  return +value;
}
export function unsigned(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new RangeError('Expected an unsigned 32-bit integer');
  }
  return value;
}
export function duration(value: R<Time>): bigint {
  if (!(value instanceof Time)) throw new TypeError('Expected a Time');
  return value.asMicroseconds();
}
export function angle(value: R<Angle>): number {
  if (!(value instanceof Angle)) throw new TypeError('Expected an Angle');
  return value.asRadians();
}
export function vector(value: R<Vector3<'f32'>>): void {
  if (!(value instanceof Vector3) || value.scalarType !== 'f32') {
    throw new TypeError('Expected a Vector3f');
  }
}
export function channels(map: Iterable<SoundChannel>): Int32Array {
  const values = Array.from(map);
  if (values.some(value => !Number.isInteger(value) || value < 0 ||
      value > SoundChannel.TopBackCenter)) {
    throw new RangeError('Unknown sound channel');
  }
  return Int32Array.from(values);
}
export function samples(value: Int16Array): void {
  if (!(value instanceof Int16Array)) throw new TypeError('Expected an Int16Array');
}
