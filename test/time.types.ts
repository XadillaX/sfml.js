import {
  Time, Clock, seconds, milliseconds, microseconds, type ReadonlyValue,
  Angle, Vector2i, add, subtract, negate, multiply, divide, modulo,
  addAssign, subtractAssign, multiplyAssign, divideAssign, moduloAssign,
  equal, notEqual, less, lessEqual, greater, greaterEqual,
} from '..';

const time = new Time(123n);
const constant: ReadonlyValue<Time> = Time.Zero;
const copy: Time = new Time(constant);
const second: Time = seconds(1);
const milli: Time = milliseconds(2);
const micro: Time = microseconds(3n);
const count: bigint = time.asMicroseconds();
const duration: bigint = constant.toDuration();
const secondsCount: number = constant.asSeconds();
const millisCount: number = constant.asMilliseconds();
const sum: Time = add(constant, time);
const difference: Time = subtract(time, constant);
const negative: Time = negate(constant);
const product: Time = multiply(constant, 3n);
const floatProduct: Time = multiply(0.1, constant);
const leftProduct: Time = multiply(3n, constant);
const quotient: Time = divide(constant, 3n);
const floatQuotient: Time = divide(constant, 0.1);
const ratio: number = divide(constant, time);
const remainder: Time = modulo(constant, time);
addAssign(time, constant);
subtractAssign(time, constant);
multiplyAssign(time, 2n);
multiplyAssign(time, 2);
divideAssign(time, 2n);
divideAssign(time, 2);
moduloAssign(time, constant);
equal(constant, time);
notEqual(time, constant);
less(constant, time);
lessEqual(constant, time);
greater(constant, time);
greaterEqual(constant, time);

const clock = new Clock();
const clockCopy = new Clock(clock);
const readonlyClock: ReadonlyValue<Clock> = clock;
const readonlyCopy = new Clock(readonlyClock);
const elapsed: Time = readonlyClock.getElapsedTime();
const running: boolean = readonlyClock.isRunning();
clock.start();
clock.stop();
const restarted: Time = clock.restart();
const reset: Time = clock.reset();

// @ts-expect-error Bare durations are bigint microseconds.
new Time(1);
// @ts-expect-error Microseconds must preserve int64 precision.
microseconds(1);
// @ts-expect-error Seconds use the float overload.
seconds(1n);
// @ts-expect-error Milliseconds use the int32 overload.
milliseconds(1n);
// @ts-expect-error A readonly duration is not an assignment target.
addAssign(constant, time);
// @ts-expect-error A readonly duration is not an assignment target.
subtractAssign(constant, time);
// @ts-expect-error A readonly duration is not an assignment target.
multiplyAssign(constant, 2n);
// @ts-expect-error A readonly duration is not an assignment target.
divideAssign(constant, 2);
// @ts-expect-error A readonly duration is not an assignment target.
moduloAssign(constant, time);
// @ts-expect-error The Zero constant cannot be replaced.
Time.Zero = time;
// @ts-expect-error Time and Angle arithmetic cannot mix.
add(time, Angle.Zero);
// @ts-expect-error Time and Angle equality cannot mix.
equal(time, Angle.Zero);
// @ts-expect-error Time and Angle ordering cannot mix.
less(time, Angle.Zero);
// @ts-expect-error Time/Time is a ratio, not a duration.
const badRatio: Time = divide(time, time);
// @ts-expect-error Time multiplication requires a scalar.
multiply(time, time);
// @ts-expect-error Modulo requires another duration.
modulo(time, 2n);
// @ts-expect-error Bigint scalar overloads are specific to Time.
multiply(new Vector2i(), 2n);
// @ts-expect-error There is no scalar/Time overload.
divide(2n, time);
// @ts-expect-error A const Clock cannot be started.
readonlyClock.start();
// @ts-expect-error A const Clock cannot be stopped.
readonlyClock.stop();
// @ts-expect-error A const Clock cannot be restarted.
readonlyClock.restart();
// @ts-expect-error A const Clock cannot be reset.
readonlyClock.reset();

export {
  copy, second, milli, micro, count, duration, secondsCount, millisCount,
  sum, difference, negative, product, floatProduct, leftProduct,
  quotient, floatQuotient, ratio, remainder, clockCopy, readonlyCopy,
  elapsed, running, restarted, reset, badRatio,
};
