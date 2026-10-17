import { audioNative } from '../internal/audio-native';
import { Angle, radians } from '../system/angle';
import { Time } from '../system/time';
import { Vector3 } from '../system/vector3';
import type { ReadonlyValue as R } from '../internal/value-storage';

/**
 * Speaker positions for interleaved PCM channels.
 * @zh 交错 PCM 声道对应的扬声器位置。
 * @ja インターリーブ PCM チャンネルに対応するスピーカー位置。
 * @ko 인터리브 PCM 채널에 대응하는 스피커 위치입니다.
 */
export enum SoundChannel {
  /**
   * Unspecified position.
   * @zh 未指定位置。
   * @ja 位置未指定。
   * @ko 지정되지 않은 위치입니다.
   */
  Unspecified,
  /**
   * Mono.
   * @zh 单声道。
   * @ja モノラル。
   * @ko 모노입니다.
   */
  Mono,
  /**
   * Front left.
   * @zh 前左。
   * @ja 前方左。
   * @ko 전방 왼쪽입니다.
   */
  FrontLeft,
  /**
   * Front right.
   * @zh 前右。
   * @ja 前方右。
   * @ko 전방 오른쪽입니다.
   */
  FrontRight,
  /**
   * Front center.
   * @zh 前中。
   * @ja 前方中央。
   * @ko 전방 중앙입니다.
   */
  FrontCenter,
  /**
   * Front left of center.
   * @zh 前中偏左。
   * @ja 前方中央の左側。
   * @ko 전방 중앙의 왼쪽입니다.
   */
  FrontLeftOfCenter,
  /**
   * Front right of center.
   * @zh 前中偏右。
   * @ja 前方中央の右側。
   * @ko 전방 중앙의 오른쪽입니다.
   */
  FrontRightOfCenter,
  /**
   * Low-frequency effects channel.
   * @zh 低频效果声道。
   * @ja 低周波効果チャンネル。
   * @ko 저주파 효과 채널입니다.
   */
  LowFrequencyEffects,
  /**
   * Back left.
   * @zh 后左。
   * @ja 後方左。
   * @ko 후방 왼쪽입니다.
   */
  BackLeft,
  /**
   * Back right.
   * @zh 后右。
   * @ja 後方右。
   * @ko 후방 오른쪽입니다.
   */
  BackRight,
  /**
   * Back center.
   * @zh 后中。
   * @ja 後方中央。
   * @ko 후방 중앙입니다.
   */
  BackCenter,
  /**
   * Side left.
   * @zh 侧左。
   * @ja 左側面。
   * @ko 왼쪽 측면입니다.
   */
  SideLeft,
  /**
   * Side right.
   * @zh 侧右。
   * @ja 右側面。
   * @ko 오른쪽 측면입니다.
   */
  SideRight,
  /**
   * Top center.
   * @zh 顶中。
   * @ja 上方中央。
   * @ko 상단 중앙입니다.
   */
  TopCenter,
  /**
   * Top front left.
   * @zh 顶前左。
   * @ja 上方前方左。
   * @ko 상단 전방 왼쪽입니다.
   */
  TopFrontLeft,
  /**
   * Top front right.
   * @zh 顶前右。
   * @ja 上方前方右。
   * @ko 상단 전방 오른쪽입니다.
   */
  TopFrontRight,
  /**
   * Top front center.
   * @zh 顶前中。
   * @ja 上方前方中央。
   * @ko 상단 전방 중앙입니다.
   */
  TopFrontCenter,
  /**
   * Top back left.
   * @zh 顶后左。
   * @ja 上方後方左。
   * @ko 상단 후방 왼쪽입니다.
   */
  TopBackLeft,
  /**
   * Top back right.
   * @zh 顶后右。
   * @ja 上方後方右。
   * @ko 상단 후방 오른쪽입니다.
   */
  TopBackRight,
  /**
   * Top back center.
   * @zh 顶后中。
   * @ja 上方後方中央。
   * @ko 상단 후방 중앙입니다.
   */
  TopBackCenter,
}
/**
 * Current playback status of a sound source.
 * @zh 声源当前播放状态。
 * @ja 音源の現在の再生状態。
 * @ko 음원의 현재 재생 상태입니다.
 */
export enum SoundStatus {
  /**
   * Stopped.
   * @zh 已停止。
   * @ja 停止中。
   * @ko 정지 상태입니다.
   */
  Stopped,
  /**
   * Paused, retaining the playback position.
   * @zh 已暂停，保留播放位置。
   * @ja 再生位置を保持して一時停止中。
   * @ko 재생 위치를 유지한 일시 정지 상태입니다.
   */
  Paused,
  /**
   * Playing.
   * @zh 正在播放。
   * @ja 再生中。
   * @ko 재생 중입니다.
   */
  Playing,
}

/**
 * Read-only typed view of 16-bit interleaved PCM, retaining native storage.
 * @zh 16 位交错 PCM 的只读类型视图，保留底层原生存储。
 * @ja 16 ビットのインターリーブ PCM の読み取り専用型ビュー。
 * 基になるネイティブストレージを保持します。
 * @ko 16비트 인터리브 PCM의 읽기 전용 타입 뷰로,
 * 기반 네이티브 저장소를 유지합니다.
 */
export type ReadonlySamples = Readonly<Pick<Int16Array,
number | 'length' | 'byteLength' | 'byteOffset' | typeof Symbol.iterator |
'slice' | 'entries' | 'keys' | 'values'>>;
/**
 * Read-only view of channel positions in interleaved order.
 * @zh 按交错顺序排列的声道位置只读视图。
 * @ja インターリーブ順に並ぶチャンネル位置の読み取り専用ビュー。
 * @ko 인터리브 순서로 나열된 채널 위치의 읽기 전용 뷰입니다.
 */
export type ChannelMap = Readonly<Pick<Int32Array,
number | 'length' | typeof Symbol.iterator | 'slice' | 'entries' |
'keys' | 'values'>>;

/**
 * Directional cone parameters for a spatial sound source or listener.
 * @zh 空间声源或监听者的方向锥参数。
 * @ja 空間音源またはリスナーの指向性コーンのパラメーター。
 * @ko 공간 음원 또는 리스너의 지향성 원뿔 매개변수입니다.
 */
export interface ConeInput {
  /**
   * Full inner cone angle within which no directional attenuation occurs.
   * @zh 不发生方向衰减的内锥完整角度。
   * @ja 指向性減衰が発生しない内側コーンの全角。
   * @ko 지향성 감쇠가 발생하지 않는 내부 원뿔의 전체 각도입니다.
   */
  innerAngle: R<Angle>;
  /**
   * Full outer cone angle at which outerGain is reached.
   * @zh 达到 outerGain 的外锥完整角度。
   * @ja outerGain に達する外側コーンの全角。
   * @ko outerGain에 도달하는 외부 원뿔의 전체 각도입니다.
   */
  outerAngle: R<Angle>;
  /**
   * Gain multiplier outside the outer cone.
   * @zh 外锥之外的增益倍率。
   * @ja 外側コーンの外でのゲイン倍率。
   * @ko 외부 원뿔 바깥의 게인 배율입니다.
   */
  outerGain: number;
}

/**
 * One native sf::SoundSource::Cone, exposed through its float fields.
 * @zh 一个原生 sf::SoundSource::Cone，通过其浮点字段暴露。
 * @ja 浮動小数点フィールドを通じて公開される
 * ネイティブの sf::SoundSource::Cone。
 * @ko 부동 소수점 필드로 노출되는 네이티브 sf::SoundSource::Cone입니다.
 */
export class Cone {
  private readonly values = new Float32Array(audioNative.createAudioValue(0));
  /**
   * Create a cone with zero angles and gain, or copy the given parameters.
   * @zh 创建角度和增益均为零的方向锥，或复制给定参数。
   * @ja 角度とゲインがゼロのコーンを作成するか、指定パラメーターをコピーします。
   * @ko 각도와 게인이 0인 원뿔을 생성하거나 지정한 매개변수를 복사합니다.
   */
  constructor(value?: Readonly<ConeInput>) {
    if (value) {
      this.innerAngle = value.innerAngle;
      this.outerAngle = value.outerAngle;
      this.outerGain = value.outerGain;
    }
  }
  /**
   * Copy of the full inner cone angle.
   * @zh 内锥完整角度的副本。
   * @ja 内側コーンの全角のコピー。
   * @ko 내부 원뿔 전체 각도의 복사본입니다.
   */
  get innerAngle(): Angle { return radians(this.values[0]); }
  /**
   * Copy the inner cone angle.
   * @zh 复制内锥角度。
   * @ja 内側コーンの角度をコピーします。
   * @ko 내부 원뿔 각도를 복사합니다.
   */
  set innerAngle(value: R<Angle>) { this.values[0] = angle(value); }
  /**
   * Copy of the full outer cone angle.
   * @zh 外锥完整角度的副本。
   * @ja 外側コーンの全角のコピー。
   * @ko 외부 원뿔 전체 각도의 복사본입니다.
   */
  get outerAngle(): Angle { return radians(this.values[1]); }
  /**
   * Copy the outer cone angle.
   * @zh 复制外锥角度。
   * @ja 外側コーンの角度をコピーします。
   * @ko 외부 원뿔 각도를 복사합니다.
   */
  set outerAngle(value: R<Angle>) { this.values[1] = angle(value); }
  /**
   * Gain multiplier outside the outer cone.
   * @zh 外锥之外的增益倍率。
   * @ja 外側コーンの外でのゲイン倍率。
   * @ko 외부 원뿔 바깥의 게인 배율입니다.
   */
  get outerGain(): number { return this.values[2]; }
  /**
   * Set the outer cone gain multiplier.
   * @zh 设置外锥增益倍率。
   * @ja 外側コーンのゲイン倍率を設定します。
   * @ko 외부 원뿔의 게인 배율을 설정합니다.
   */
  set outerGain(value: number) { this.values[2] = float(value); }
}

/**
 * Audio time span input.
 * @zh 音频时间段输入。
 * @ja 音声の時間範囲の入力。
 * @ko 오디오 시간 구간 입력입니다.
 */
export interface TimeSpanInput {
  /**
   * Offset relative to the beginning of the audio.
   * @zh 相对于音频起点的偏移。
   * @ja 音声の先頭からのオフセット。
   * @ko 오디오 시작점 기준 오프셋입니다.
   */
  offset: R<Time>;
  /**
   * Length of the time span.
   * @zh 时间段长度。
   * @ja 時間範囲の長さ。
   * @ko 시간 구간의 길이입니다.
   */
  length: R<Time>;
}
/**
 * Mutable audio time span stored as exact microsecond counts.
 * @zh 可修改的音频时间段，按精确微秒数存储。
 * @ja 正確なマイクロ秒数で保存される変更可能な音声の時間範囲。
 * @ko 정확한 마이크로초 단위로 저장되는 변경 가능한 오디오 시간 구간입니다.
 */
export class TimeSpan {
  private readonly values = new BigInt64Array(audioNative.createAudioValue(1));
  /**
   * Create a span with zero offset and length, or copy the given parameters.
   * @zh 创建零偏移、零长度的时间段，或复制给定参数。
   * @ja オフセットと長さがゼロの時間範囲を作成するか、指定値をコピーします。
   * @ko 오프셋과 길이가 0인 구간을 생성하거나 지정한 매개변수를 복사합니다.
   */
  constructor(value?: Readonly<TimeSpanInput>) {
    if (value) { this.offset = value.offset; this.length = value.length; }
  }
  /**
   * Copy of the starting offset.
   * @zh 起点偏移的副本。
   * @ja 開始オフセットのコピー。
   * @ko 시작 오프셋의 복사본입니다.
   */
  get offset(): Time { return new Time(this.values[0]); }
  /**
   * Copy the starting offset.
   * @zh 复制起点偏移。
   * @ja 開始オフセットをコピーします。
   * @ko 시작 오프셋을 복사합니다.
   */
  set offset(value: R<Time>) { this.values[0] = duration(value); }
  /**
   * Copy of the duration.
   * @zh 时长的副本。
   * @ja 長さのコピー。
   * @ko 길이의 복사본입니다.
   */
  get length(): Time { return new Time(this.values[1]); }
  /**
   * Copy the time span length.
   * @zh 复制时间段长度。
   * @ja 時間範囲の長さをコピーします。
   * @ko 시간 구간의 길이를 복사합니다.
   */
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
