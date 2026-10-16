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

/** A signed microsecond duration; native APIs receive its bigint by value. */
export class Time {
  readonly [mutableValue] = true;
  [timeStorage]: bigint;

  /** 创建零时长。 */
  constructor();
  /** 从有符号 64 位微秒数创建时长。 */
  constructor(duration: bigint);
  /** 复制时长，副本与源对象独立。 */
  constructor(source: ReadonlyValue<Time>);
  constructor(source: bigint | ReadonlyValue<Time> = 0n) {
    if (typeof source !== 'bigint' && !(source instanceof Time)) {
      throw new TypeError('Expected a bigint duration or Time');
    }
    this[timeStorage] = checkedMicroseconds(
      typeof source === 'bigint' ? source : source.asMicroseconds(),
    );
  }

  /** 返回秒数，按 float32 精度舍入。 */
  asSeconds(): number {
    return Math.fround(int64AsFloat(this[timeStorage]) / 1000000);
  }

  /** 返回整毫秒数，向零截断并按有符号 32 位整数转换。 */
  asMilliseconds(): number {
    return Number(BigInt.asIntN(32, this[timeStorage] / 1000n));
  }

  /** 返回精确的有符号 64 位微秒数。 */
  asMicroseconds(): bigint {
    return this[timeStorage];
  }

  /** std::chrono::microseconds is represented by a microsecond bigint. */
  toDuration(): bigint {
    return this[timeStorage];
  }

  /** 只读的零时长。 */
  static readonly Zero: ReadonlyValue<Time> = Object.freeze(new Time());
}

/** 从秒数创建时长，使用 float32 运算并截断到整微秒。 */
export function seconds(amount: number): Time {
  return new Time(secondsCount(amount));
}

/** 从毫秒数创建时长；向零截断后的输入必须在有符号 32 位整数范围内。 */
export function milliseconds(amount: number): Time {
  if (typeof amount !== 'number') throw new TypeError('Expected a number');
  const integer = Math.trunc(amount);
  if (!Number.isFinite(integer) ||
      integer < -2147483648 || integer > 2147483647) {
    throw new RangeError('Milliseconds must fit in a signed 32-bit integer');
  }
  return new Time(BigInt(integer) * 1000n);
}

/** 从精确的有符号 64 位微秒数创建时长，超出范围时抛出 RangeError。 */
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
