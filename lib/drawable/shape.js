'use strict';

const Base = require('./base');
const Color = require('../color');

class Shape extends Base {
  setFillColor(color) {
    if (!(color instanceof Color)) {
      color = new Color(color);
    }

    this[Base.RAW].setFillColor(color);
  }

  getFillColor() {
    return this[Base.RAW].getFillColor();
  }
}

module.exports = Shape;
