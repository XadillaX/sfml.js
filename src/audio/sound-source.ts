import {
  audioNative, audioHandle, type AudioHandle, type AudioSourceMapping,
} from '../internal/audio-native';
import { Vector3f } from '../system/vector3';
import { radians } from '../system/angle';
import { Time } from '../system/time';
import { EffectProcessor } from './effect-processor';
import type { ReadonlyValue as R } from '../internal/value-storage';
import {
  Cone, type ConeInput, SoundStatus, float, flag, vector, angle, duration,
} from './value';

/** Shared control/result fields; every engine operation still executes in SFML. */
export abstract class SoundSource {
  /** 播放状态枚举。 */
  static readonly Status = SoundStatus;
  /** 方向锥配置类型。 */
  static readonly Cone = Cone;
  readonly [audioHandle]: AudioHandle<'source'>;
  protected readonly values: Float32Array;
  protected readonly times: BigInt64Array;
  private effect?: EffectProcessor;

  protected constructor(mapping: AudioSourceMapping) {
    this[audioHandle] = mapping.handle;
    this.values = new Float32Array(mapping.values);
    this.times = new BigInt64Array(mapping.times);
  }
  /** Copy source attributes, retaining this source's content and playback. */
  assign(source: SoundSource): this {
    if (!(source instanceof SoundSource)) {
      throw new TypeError('Expected a SoundSource');
    }
    if (source === this) return this;
    audioNative.assignAudioSource(this[audioHandle], source[audioHandle], false);
    return this;
  }
  /** 设置音高及播放速率倍率，1 为原速。 */
  setPitch(value: number): void { this.set(0, value); }
  /** 返回音高倍率。 */
  getPitch(): number { return this.get(0); }
  /** 设置立体声声像，-1 为左、0 为中、1 为右。 */
  setPan(value: number): void { this.set(1, value); }
  /** 返回立体声声像。 */
  getPan(): number { return this.get(1); }
  /** 设置音量百分比，0 为静音，100 为原始音量。 */
  setVolume(value: number): void { this.set(2, value); }
  /** 返回音量百分比。 */
  getVolume(): number { return this.get(2); }
  /** 设置是否启用位置、距离和方向引起的空间音效。 */
  setSpatializationEnabled(value: boolean): void { this.set(3, flag(value)); }
  /** 返回是否启用空间音效。 */
  isSpatializationEnabled(): boolean { return this.get(3) !== 0; }
  /** 设置三维位置，单位须与监听者位置及距离参数一致。 */
  setPosition(value: R<Vector3f>): void { this.setVector(4, value); }
  /** 返回三维位置副本。 */
  getPosition(): Vector3f { return this.getVector(4); }
  /** 设置声源发声方向。 */
  setDirection(value: R<Vector3f>): void { this.setVector(7, value); }
  /** 返回发声方向副本。 */
  getDirection(): Vector3f { return this.getVector(7); }
  /** 设置内外方向锥角度及外部增益，并更新原生音频引擎。 */
  setCone(value: Readonly<ConeInput>): void {
    const inner = angle(value.innerAngle);
    const outer = angle(value.outerAngle);
    const gain = float(value.outerGain);
    this.values.set([ inner, outer, gain ], 10);
    this.field(10, true);
  }
  /** 返回方向锥参数副本。 */
  getCone(): Cone {
    this.field(10, false);
    return new Cone({ innerAngle: radians(this.values[10]),
      outerAngle: radians(this.values[11]), outerGain: this.values[12] });
  }
  /** 设置三维速度，用于多普勒效应，单位为位置单位/秒。 */
  setVelocity(value: R<Vector3f>): void { this.setVector(13, value); }
  /** 返回速度副本。 */
  getVelocity(): Vector3f { return this.getVector(13); }
  /** 设置多普勒效应倍率，0 禁用。 */
  setDopplerFactor(value: number): void { this.set(16, value); }
  /** 返回多普勒效应倍率。 */
  getDopplerFactor(): number { return this.get(16); }
  /** 设置声源方向对衰减的影响因子。 */
  setDirectionalAttenuationFactor(value: number): void { this.set(17, value); }
  /** 返回方向衰减因子。 */
  getDirectionalAttenuationFactor(): number { return this.get(17); }
  /** 设置位置是否相对于监听者；false 使用世界坐标。 */
  setRelativeToListener(value: boolean): void { this.set(18, flag(value)); }
  /** 返回是否使用监听者相对坐标。 */
  isRelativeToListener(): boolean { return this.get(18) !== 0; }
  /** 设置保持最大音量的最小参考距离。 */
  setMinDistance(value: number): void { this.set(19, value); }
  /** 返回最小参考距离。 */
  getMinDistance(): number { return this.get(19); }
  /** 设置距离衰减使用的最大距离。 */
  setMaxDistance(value: number): void { this.set(20, value); }
  /** 返回最大距离。 */
  getMaxDistance(): number { return this.get(20); }
  /** 设置距离衰减后的最小增益。 */
  setMinGain(value: number): void { this.set(21, value); }
  /** 返回最小增益。 */
  getMinGain(): number { return this.get(21); }
  /** 设置距离衰减后的最大增益。 */
  setMaxGain(value: number): void { this.set(22, value); }
  /** 返回最大增益。 */
  getMaxGain(): number { return this.get(22); }
  /** 设置距离衰减因子，0 禁用距离衰减。 */
  setAttenuation(value: number): void { this.set(23, value); }
  /** 返回距离衰减因子。 */
  getAttenuation(): number { return this.get(23); }
  /** 设置到达末尾后是否循环播放。 */
  setLooping(value: boolean): void { this.set(24, flag(value)); }
  /** 返回是否循环播放。 */
  isLooping(): boolean { return this.get(24) !== 0; }
  /** 查询原生引擎的当前播放状态。 */
  getStatus(): SoundStatus { return this.get(25); }
  /** 绑定并保留效果处理器引用；undefined 移除处理器。 */
  setEffectProcessor(processor?: EffectProcessor): void {
    if (processor !== undefined && !(processor instanceof EffectProcessor)) {
      throw new TypeError('Expected an EffectProcessor');
    }
    audioNative.setAudioEffect(this[audioHandle], processor?.[audioHandle]);
    this.effect = processor;
  }
  /** 开始播放或恢复暂停；已播放时按 SFML 语义重新开始。 */
  play(): void { this.command(0); }
  /** 暂停并保留播放位置。 */
  pause(): void { this.command(1); }
  /** 停止并将播放位置归零。 */
  stop(): void { this.command(2); }
  /** 设置相对于声音起点的播放时间。 */
  setPlayingOffset(value: R<Time>): void {
    this.times[0] = duration(value);
    this.command(3);
  }
  /** 返回当前播放位置的时间副本。 */
  getPlayingOffset(): Time {
    this.command(4);
    return new Time(this.times[0]);
  }
  protected command(command: number): void {
    audioNative.audioSourceCommand(this[audioHandle], command);
  }
  protected field(field: number, write: boolean): void {
    audioNative.audioSourceField(this[audioHandle], field, write);
  }
  protected get(field: number): number {
    this.field(field, false);
    return this.values[field];
  }
  private set(field: number, value: number): void {
    this.values[field] = float(value);
    this.field(field, true);
  }
  private setVector(field: number, value: R<Vector3f>): void {
    vector(value);
    this.values[field] = value.x;
    this.values[field + 1] = value.y;
    this.values[field + 2] = value.z;
    this.field(field, true);
  }
  private getVector(field: number): Vector3f {
    this.field(field, false);
    return new Vector3f(this.values[field], this.values[field + 1],
      this.values[field + 2]);
  }
}
