import * as util from 'util';

import { Time } from './binding';

const VAL = Symbol('Time#val');

Time.prototype[util.inspect.custom] = function inspect(
  _: number,
  opts: any,
) {
  return `Time ${util.inspect({
    [VAL]: this.asMicroseconds(),
  }, opts)}`;
};

type SetTimeValType = BigInt | number;

function seconds(s: SetTimeValType): Time {
  return new Time(Time.NewTimeType.kSeconds, s);
}

function milliseconds(ms: SetTimeValType): Time {
  return new Time(Time.NewTimeType.kMilliseconds, ms);
}

function microseconds(us: SetTimeValType): Time {
  return new Time(Time.NewTimeType.kMicroseconds, us);
}

const zero = seconds(0);

export {
  SetTimeValType,

  // DO NOT USE DIRECTLY
  Time as _Time,

  seconds,
  milliseconds,
  microseconds,

  zero,
};
