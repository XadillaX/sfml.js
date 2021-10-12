'use strict';

const util = require('util');

const { Time } = require('../build/Release/binding.node');

const VAL = Symbol('Time#val');

Time.prototype[util.inspect.custom] = function inspect(depth, opts) {
  return `Time ${util.inspect({
    [VAL]: this.asMicroseconds(),
  }, opts)}`;
};

// Caution: if `val` is a float number, it may occur some loss because V8 uses
// `double` while SFML uses `float`.
function seconds(val) {
  return new Time(Time.NewTimeType.kSeconds, val);
}

// Caution: if `val` is a float number, it may occur some loss because V8 uses
// `double` while SFML uses `float`.
function milliseconds(val) {
  return new Time(Time.NewTimeType.kMilliseconds, val);
}

// Caution: if `val` is a float number, it may occur some loss because V8 uses
// `double` while SFML uses `float`.
function microseconds(val) {
  return new Time(Time.NewTimeType.kMicroseconds, val);
}

module.exports = {
  seconds,
  milliseconds,
  microseconds,
  zero: seconds(0),

  // Do NOT use directly
  _Time: Time,
};
