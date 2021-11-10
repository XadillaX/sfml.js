'use strict';

const util = require('util');

const { Color: _Color, setRealColorConstructor } = require('../build/Release/binding.node');
const { validateTypeOf } = require('./common');

const TO_INTEGER = Symbol('Color::toInteger');

class Color extends _Color {
  [util.inspect.custom](depth, opts) {
    return `Color ${util.inspect({
      ...this.toJSON(),
      [TO_INTEGER]: this.toInteger(),
    }, opts)}`;
  }

  toJSON() {
    return { r: this.r, g: this.g, b: this.b, a: this.a };
  }

  constructor(red, green, blue, alpha) {
    if (red === undefined) {
      super();
    } else if (green === undefined) {
      const color = red;
      validateTypeOf(color, 'color', 'number');
      super(color);
    } else {
      validateTypeOf(red, 'red', 'number');
      validateTypeOf(green, 'green', 'number');
      validateTypeOf(blue, 'blue', 'number');
      validateTypeOf(alpha, 'alpha', 'number', true);
      if (alpha === undefined) alpha = 0xff;

      super(red, green, blue, alpha);
    }
  }

  get r() {
    return super.r;
  }

  set r(val) {
    val = parseInt(val);
    if (val < 0 || val > 255) {
      throw new Error('`val` should between 0 and 255.');
    }

    super.r = val;
  }

  get g() {
    return super.g;
  }

  set g(val) {
    val = parseInt(val);
    if (val < 0 || val > 255) {
      throw new Error('`val` should between 0 and 255.');
    }

    super.g = val;
  }

  get b() {
    return super.b;
  }

  set b(val) {
    val = parseInt(val);
    if (val < 0 || val > 255) {
      throw new Error('`val` should between 0 and 255.');
    }

    super.b = val;
  }

  get a() {
    return super.a;
  }

  set a(val) {
    val = parseInt(val);
    if (val < 0 || val > 255) {
      throw new Error('`val` should between 0 and 255.');
    }

    super.a = val;
  }
}

setRealColorConstructor(Color);

module.exports = { Color };
