import { native, type NativeValueHandle } from '../internal/native';
import { LazyValue, nativeValue } from '../internal/lazy-value';
import {
  angleStorage, angleNative, mutableValue, type ReadonlyValue,
} from '../internal/value-storage';

const pi = Math.fround(3.141592654);
const tau = Math.fround(pi * 2);

/** SFML's float32 remainder, whose truncated quotient must fit in int32. */
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

/** sf::Angle's float32 value, with native ownership created on demand. */
export class Angle {
  readonly [mutableValue] = true;
  private readonly state = new LazyValue<'angle', Float32Array>(
    new Float32Array(1), buffer => native.wrapAngle(buffer),
  );

  /** 创建零角度，或复制 source 的角度值。 */
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

  /** 返回角度制数值，一周为 360 度。 */
  asDegrees(): number {
    return Math.fround(this.asRadians() * Math.fround(180 / pi));
  }

  /** 返回弧度制数值，一周为 2π 弧度。 */
  asRadians(): number {
    return this[angleStorage][0];
  }

  /** 返回归一化到 [-180°, 180°) 的新角度。 */
  wrapSigned(): Angle {
    return radians(Math.fround(
      positiveRemainder(Math.fround(this.asRadians() + pi), tau) - pi,
    ));
  }

  /** 返回归一化到 [0°, 360°) 的新角度。 */
  wrapUnsigned(): Angle {
    return radians(positiveRemainder(this.asRadians(), tau));
  }

  /** 只读的零角度。 */
  static readonly Zero: ReadonlyValue<Angle> = Object.freeze(new Angle());
}

/** 从弧度值创建角度，按 float32 精度存储。 */
export function radians(angle: number): Angle {
  const result = new Angle();
  result[angleStorage][0] = angle;
  return result;
}

/** 从度数创建角度，按 float32 精度存储。 */
export function degrees(angle: number): Angle {
  return radians(Math.fround(angle) * Math.fround(pi / 180));
}
