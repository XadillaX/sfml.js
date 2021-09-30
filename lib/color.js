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
}

setRealColorConstructor(Color);

module.exports = Color;
