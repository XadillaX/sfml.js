import { native, type NativeValueHandle } from '../internal/native';
import { LazyValue, nativeValue } from '../internal/lazy-value';
import {
  angleStorage, angleNative, mutableValue, type ReadonlyValue,
} from '../internal/value-storage';

const pi = Math.fround(3.141592654);
const tau = Math.fround(pi * 2);

/**
 * SFML's float32 remainder, whose truncated quotient must fit in int32.
 * @zh SFML 的 float32 余数，截断后的商必须在 int32 范围内。
 * @ja SFML の float32 剰余。切り捨てた商は int32 の範囲内でなければならない。
 * @ko SFML의 float32 나머지. 소수부를 버린 몫은 int32 범위 내여야 한다.
 */
export function positiveRemainder(a: number, b: number): number {
  if (!(b > 0)) throw new RangeError('Angle modulus must be positive');
  // C++ int has no negative zero, unlike Math.trunc().
  const truncated = Math.trunc(Math.fround(a / b));
  const quotient = truncated === 0 ? 0 : truncated;
  if (!Number.isFinite(quotient) ||
      quotient < -2147483648 || quotient > 2147483647) {
    throw new RangeError('Angle remainder quotient is outside int32 range');
  }
  const result = Math.fround(a - Math.fround(Math.fround(quotient) * b));
  return result >= 0 ? result : Math.fround(result + b);
}

/**
 * sf::Angle's float32 value, with native ownership created on demand.
 * @zh sf::Angle 的 float32 值，按需创建原生所有权。
 * @ja sf::Angle の float32 値。ネイティブ所有権は必要に応じて作成される。
 * @ko sf::Angle의 float32 값. 네이티브 소유권은 필요할 때 생성된다.
 */
export class Angle {
  readonly [mutableValue] = true;
  private readonly state = new LazyValue<'angle', Float32Array>(
    new Float32Array(1), buffer => native.wrapAngle(buffer),
  );

  /**
   * Create a zero angle, or copy the angle value of source.
   * @zh 创建零角度，或复制 source 的角度值。
   * @ja ゼロ角度を作成するか、source の角度値をコピーする。
   * @ko 영각을 생성하거나 source의 각도 값을 복사한다.
   */
  constructor(source?: ReadonlyValue<Angle>) {
    if (source !== undefined) {
      this[angleStorage][0] = source.asRadians();
    }
  }

  get [angleStorage](): Float32Array {
    return this.state.values;
  }

  get [angleNative](): NativeValueHandle<'angle'> {
    return nativeValue(this, angleNative, this.state);
  }

  /**
   * Return the value in degrees, with 360 degrees per revolution.
   * @zh 返回角度制数值，一周为 360 度。
   * @ja 度数法の値を返す。1 回転は 360 度。
   * @ko 도 단위 값을 반환한다. 한 바퀴는 360도이다.
   */
  asDegrees(): number {
    return Math.fround(this.asRadians() * Math.fround(180 / pi));
  }

  /**
   * Return the value in radians, with 2π radians per revolution.
   * @zh 返回弧度制数值，一周为 2π 弧度。
   * @ja ラジアン値を返す。1 回転は 2π ラジアン。
   * @ko 라디안 단위 값을 반환한다. 한 바퀴는 2π 라디안이다.
   */
  asRadians(): number {
    return this[angleStorage][0];
  }

  /**
   * Return a new angle normalized to [-180°, 180°).
   * @zh 返回归一化到 [-180°, 180°) 的新角度。
   * @ja [-180°, 180°) に正規化した新しい角度を返す。
   * @ko [-180°, 180°)로 정규화한 새 각도를 반환한다.
   */
  wrapSigned(): Angle {
    return radians(Math.fround(
      positiveRemainder(Math.fround(this.asRadians() + pi), tau) - pi,
    ));
  }

  /**
   * Return a new angle normalized to [0°, 360°).
   * @zh 返回归一化到 [0°, 360°) 的新角度。
   * @ja [0°, 360°) に正規化した新しい角度を返す。
   * @ko [0°, 360°)로 정규화한 새 각도를 반환한다.
   */
  wrapUnsigned(): Angle {
    return radians(positiveRemainder(this.asRadians(), tau));
  }

  /**
   * The read-only zero angle.
   * @zh 只读的零角度。
   * @ja 読み取り専用のゼロ角度。
   * @ko 읽기 전용 영각.
   */
  static readonly Zero: ReadonlyValue<Angle> = Object.freeze(new Angle());
}

/**
 * Create an angle from radians, stored with float32 precision.
 * @zh 从弧度值创建角度，按 float32 精度存储。
 * @ja ラジアン値から角度を作成し、float32 精度で格納する。
 * @ko 라디안 값으로 각도를 생성하고 float32 정밀도로 저장한다.
 */
export function radians(angle: number): Angle {
  const result = new Angle();
  result[angleStorage][0] = angle;
  return result;
}

/**
 * Create an angle from degrees, stored with float32 precision.
 * @zh 从度数创建角度，按 float32 精度存储。
 * @ja 度数から角度を作成し、float32 精度で格納する。
 * @ko 도 단위 값으로 각도를 생성하고 float32 정밀도로 저장한다.
 */
export function degrees(angle: number): Angle {
  return radians(Math.fround(angle) * Math.fround(pi / 180));
}
