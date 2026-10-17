export const scalarArrays = {
  i32: Int32Array,
  u32: Uint32Array,
  f32: Float32Array,
  f64: Float64Array,
  i8: Int8Array,
  u8: Uint8Array,
  i16: Int16Array,
  u16: Uint16Array,
  i64: BigInt64Array,
  u64: BigUint64Array,
};

/**
 * Vector scalar type: i/u denotes signed/unsigned integers, f denotes
 * floating point, and the suffix is the bit width.
 * @zh 向量标量类型：i/u 表示有符号/无符号整数，f 表示浮点，后缀为位数。
 * @ja ベクトルのスカラー型。i/u は符号付き/符号なし整数、
 * f は浮動小数点数、末尾の数字はビット幅を表します。
 * @ko 벡터 스칼라 유형입니다. i/u는 부호 있는/없는 정수,
 * f는 부동 소수점을 나타내며 접미사는 비트 수입니다.
 */
export type ScalarType = keyof typeof scalarArrays;
export type BigIntScalar = 'i64' | 'u64';
export type NumberScalar = Exclude<ScalarType, BigIntScalar>;
export type FloatScalar = 'f32' | 'f64';
type ScalarValues = { [T in NumberScalar]: number } &
{ [T in BigIntScalar]: bigint };
export type Scalar<T extends ScalarType> = ScalarValues[T];
// Explicit view types remain compatible with TS 5.0 and TS 5.9's generic buffers.
interface ScalarViews {
  i8: Int8Array;
  u8: Uint8Array;
  i16: Int16Array;
  u16: Uint16Array;
  i32: Int32Array;
  u32: Uint32Array;
  i64: BigInt64Array;
  u64: BigUint64Array;
  f32: Float32Array;
  f64: Float64Array;
}
export type ScalarArray<T extends ScalarType = ScalarType> = ScalarViews[T];

export function isBigIntScalar(type: ScalarType): type is BigIntScalar {
  return type === 'i64' || type === 'u64';
}

export function validateScalar(type: string): asserts type is ScalarType {
  if (!Object.prototype.hasOwnProperty.call(scalarArrays, type)) {
    throw new TypeError('Unsupported vector scalar type');
  }
}

export function toScalar(type: ScalarType, value: number): number {
  if (type === 'f32') return Math.fround(value);
  if (type === 'f64') return value;
  // eslint-disable-next-line no-bitwise
  if (type === 'i8') return (value << 24) >> 24;
  // eslint-disable-next-line no-bitwise
  if (type === 'u8') return value & 255;
  // eslint-disable-next-line no-bitwise
  if (type === 'i16') return (value << 16) >> 16;
  // eslint-disable-next-line no-bitwise
  if (type === 'u16') return value & 65535;
  // eslint-disable-next-line no-bitwise
  return type === 'i32' ? value | 0 : value >>> 0;
}

export function scalarProduct(
  type: ScalarType, lhs: number, rhs: number,
): number {
  if (type === 'f32') return Math.fround(lhs * rhs);
  if (type === 'f64') return lhs * rhs;
  return Math.imul(lhs, rhs);
}

export function requireFloat(type: ScalarType): void {
  if (type !== 'f32' && type !== 'f64') {
    throw new TypeError('This operation requires a floating-point vector');
  }
}

/** Explicit vector conversion, preserving integer low bits before Number(). */
export function convertScalar(
  type: ScalarType, value: number | bigint | boolean,
): number | bigint {
  if (isBigIntScalar(type)) {
    const integer = typeof value === 'number' ? BigInt(Math.trunc(value))
      : BigInt(value);
    return type === 'i64' ? BigInt.asIntN(64, integer)
      : BigInt.asUintN(64, integer);
  }
  if (typeof value === 'bigint') {
    if (type === 'f32') {
      // Avoid double rounding when int64/uint64 lies near a float32 midpoint.
      const negative = value < 0n;
      const magnitude = negative ? -value : value;
      const shift = magnitude.toString(2).length - 24;
      if (shift > 0) {
        /* eslint-disable no-bitwise */
        const bits = BigInt(shift);
        let rounded = magnitude >> bits;
        const rest = magnitude - (rounded << bits);
        const half = 1n << (bits - 1n);
        /* eslint-enable no-bitwise */
        if (rest > half || (rest === half && rounded % 2n !== 0n)) rounded++;
        return (negative ? -1 : 1) * Number(rounded) * 2 ** shift;
      }
    } else if (type !== 'f64') {
      const bits = type.endsWith('8') ? 8 : type.endsWith('16') ? 16 : 32;
      return Number(type.startsWith('i')
        ? BigInt.asIntN(bits, value) : BigInt.asUintN(bits, value));
    }
  }
  return toScalar(type, Number(value));
}
