import {
  mutableValue, timeStorage, type ReadonlyValue,
} from '../internal/value-storage';

const minInt64 = -(2n ** 63n);
const maxInt64 = 2n ** 63n - 1n;

export function checkedMicroseconds(value: bigint): bigint {
  if (typeof value !== 'bigint') throw new TypeError('Expected a bigint');
  if (value < minInt64 || value > maxInt64) {
    throw new RangeError('Time must fit in a signed 64-bit microsecond count');
  }
  return value;
}

// Going through Number can double-round an int64 near a float midpoint.
// Large integers therefore round their significand directly to nearest-even.
/* eslint-disable no-bitwise */
function int64AsFloat(value: bigint): number {
  const magnitude = value < 0n ? -value : value;
  if (magnitude <= 9007199254740991n) return Math.fround(Number(value));
  let exponent = Math.floor(Math.log2(Number(magnitude)));
  if (magnitude < (1n << BigInt(exponent))) exponent--;
  const shift = BigInt(exponent - 23);
  let significand = magnitude >> shift;
  const remainder = magnitude - (significand << shift);
  const half = 1n << (shift - 1n);
  if (remainder > half ||
      (remainder === half && (significand & 1n) !== 0n)) {
    significand++;
  }
  const result = Number(significand) * 2 ** Number(shift);
  return value < 0n ? -result : result;
}
/* eslint-enable no-bitwise */

function floatScalar(value: number): number {
  if (typeof value !== 'number') throw new TypeError('Expected a number');
  const result = Math.fround(value);
  if (!Number.isFinite(result)) {
    throw new RangeError('Time requires a finite float32 value');
  }
  return result;
}

function secondsCount(value: number): bigint {
  const count = Math.fround(floatScalar(value) * 1000000);
  if (!Number.isFinite(count)) {
    throw new RangeError('Time conversion exceeds the int64 range');
  }
  return checkedMicroseconds(BigInt(Math.trunc(count)));
}

/**
 * A signed microsecond duration; native APIs receive its bigint by value.
 * @zh 有符号微秒时长；原生 API 按值接收其 bigint。
 * @ja 符号付きマイクロ秒の時間長。ネイティブ API は bigint を値渡しで受け取る。
 * @ko 부호 있는 마이크로초 시간 길이. 네이티브 API는 bigint를 값으로 전달받는다.
 */
export class Time {
  readonly [mutableValue] = true;
  [timeStorage]: bigint;

  /**
   * Create a zero duration.
   * @zh 创建零时长。
   * @ja ゼロの時間長を作成する。
   * @ko 길이가 0인 시간을 생성한다.
   */
  constructor();
  /**
   * Create a duration from a signed 64-bit microsecond count.
   * @zh 从有符号 64 位微秒数创建时长。
   * @ja 符号付き 64 ビットのマイクロ秒数から時間長を作成する。
   * @ko 부호 있는 64비트 마이크로초 수로 시간 길이를 생성한다.
   */
  constructor(duration: bigint);
  /**
   * Copy a duration independently of the source object.
   * @zh 复制时长，副本与源对象独立。
   * @ja 元のオブジェクトから独立した時間長のコピーを作成する。
   * @ko 원본 객체와 독립적인 시간 길이 복사본을 생성한다.
   */
  constructor(source: ReadonlyValue<Time>);
  constructor(source: bigint | ReadonlyValue<Time> = 0n) {
    if (typeof source !== 'bigint' && !(source instanceof Time)) {
      throw new TypeError('Expected a bigint duration or Time');
    }
    this[timeStorage] = checkedMicroseconds(
      typeof source === 'bigint' ? source : source.asMicroseconds(),
    );
  }

  /**
   * Return the seconds, rounded to float32 precision.
   * @zh 返回秒数，按 float32 精度舍入。
   * @ja float32 精度に丸めた秒数を返す。
   * @ko float32 정밀도로 반올림한 초 수를 반환한다.
   */
  asSeconds(): number {
    return Math.fround(int64AsFloat(this[timeStorage]) / 1000000);
  }

  /**
   * Return whole milliseconds, truncated toward zero and converted to a
   * signed 32-bit integer.
   * @zh 返回整毫秒数，向零截断并按有符号 32 位整数转换。
   * @ja ゼロ方向に切り捨て、符号付き 32 ビット整数に変換した整数ミリ秒数を返す。
   * @ko 0 방향으로 절삭한 뒤 부호 있는 32비트 정수로 변환한 밀리초 수를 반환한다.
   */
  asMilliseconds(): number {
    return Number(BigInt.asIntN(32, this[timeStorage] / 1000n));
  }

  /**
   * Return the exact signed 64-bit microsecond count.
   * @zh 返回精确的有符号 64 位微秒数。
   * @ja 正確な符号付き 64 ビットのマイクロ秒数を返す。
   * @ko 정확한 부호 있는 64비트 마이크로초 수를 반환한다.
   */
  asMicroseconds(): bigint {
    return this[timeStorage];
  }

  /**
   * std::chrono::microseconds is represented by a microsecond bigint.
   * @zh std::chrono::microseconds 用微秒单位的 bigint 表示。
   * @ja std::chrono::microseconds はマイクロ秒単位の bigint で表される。
   * @ko std::chrono::microseconds는 마이크로초 단위 bigint로 표현된다.
   */
  toDuration(): bigint {
    return this[timeStorage];
  }

  /**
   * The read-only zero duration.
   * @zh 只读的零时长。
   * @ja 読み取り専用のゼロの時間長。
   * @ko 읽기 전용인 길이 0의 시간.
   */
  static readonly Zero: ReadonlyValue<Time> = Object.freeze(new Time());
}

/**
 * Create a duration from seconds using float32 arithmetic, truncating to
 * whole microseconds.
 * @zh 从秒数创建时长，使用 float32 运算并截断到整微秒。
 * @ja float32 演算を使い、整数マイクロ秒に切り捨てて秒数から時間長を作成する。
 * @ko float32 연산을 사용하고 정수 마이크로초로 절삭하여 초 수로 시간 길이를
 * 생성한다.
 */
export function seconds(amount: number): Time {
  return new Time(secondsCount(amount));
}

/**
 * Create a duration from milliseconds; the input truncated toward zero must
 * fit in a signed 32-bit integer.
 * @zh 从毫秒数创建时长；向零截断后的输入必须在有符号 32 位整数范围内。
 * @ja ミリ秒数から時間長を作成する。ゼロ方向に切り捨てた入力は符号付き
 * 32 ビット整数の範囲内でなければならない。
 * @ko 밀리초 수로 시간 길이를 생성한다. 0 방향으로 절삭한 입력은 부호 있는
 * 32비트 정수 범위 내여야 한다.
 */
export function milliseconds(amount: number): Time {
  if (typeof amount !== 'number') throw new TypeError('Expected a number');
  const integer = Math.trunc(amount);
  if (!Number.isFinite(integer) ||
      integer < -2147483648 || integer > 2147483647) {
    throw new RangeError('Milliseconds must fit in a signed 32-bit integer');
  }
  return new Time(BigInt(integer) * 1000n);
}

/**
 * Create a duration from an exact signed 64-bit microsecond count, throwing
 * RangeError if out of range.
 * @zh 从精确的有符号 64 位微秒数创建时长，超出范围时抛出 RangeError。
 * @ja 正確な符号付き 64 ビットのマイクロ秒数から時間長を作成する。
 * 範囲外の場合は RangeError をスローする。
 * @ko 정확한 부호 있는 64비트 마이크로초 수로 시간 길이를 생성한다.
 * 범위를 벗어나면 RangeError를 던진다.
 */
export function microseconds(amount: bigint): Time {
  return new Time(checkedMicroseconds(amount));
}

export function scaleTime(
  time: ReadonlyValue<Time>, scalar: number | bigint,
  operation: 'multiply' | 'divide',
): bigint {
  if (typeof scalar === 'bigint') {
    checkedMicroseconds(scalar);
    if (operation === 'divide' && scalar === 0n) {
      throw new RangeError('Cannot divide by zero');
    }
    return checkedMicroseconds(operation === 'multiply'
      ? time.asMicroseconds() * scalar : time.asMicroseconds() / scalar);
  }
  const value = floatScalar(scalar);
  if (operation === 'divide' && value === 0) {
    throw new RangeError('Cannot divide by zero');
  }
  return secondsCount(operation === 'multiply'
    ? time.asSeconds() * value : time.asSeconds() / value);
}

export function remainderTime(
  left: ReadonlyValue<Time>, right: ReadonlyValue<Time>,
): bigint {
  const lhs = left.asMicroseconds();
  const rhs = right.asMicroseconds();
  if (rhs === 0n) throw new RangeError('Cannot divide by zero');
  if (lhs === minInt64 && rhs === -1n) {
    throw new RangeError('Time remainder quotient exceeds the int64 range');
  }
  return lhs % rhs;
}
