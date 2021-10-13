'use strict';

const Base = require('./base');
const Color = require('../color');
const { validateTypeOf } = require('../common');

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

  setOutlineColor(color) {
    if (!(color instanceof Color)) {
      color = new Color(color);
    }

    this[Base.RAW].setOutlineColor(color);
  }

  getOutlineColor() {
    return this[Base.RAW].getOutlineColor();
  }

  setOutlineThickness(thickness) {
    validateTypeOf(thickness, 'thickness', 'number');
    this[Base.RAW].setOutlineThickness(thickness);
  }

  getOutlineThickness() {
    return this[Base.RAW].getOutlineThickness();
  }

  getPointCount() {
    return this[Base.RAW].getPointCount();
  }

  setPointCount() {
    throw new Error('Unimplemented.');
  }

  getLocalBounds() {
    return this[Base.RAW].getLocalBounds();
  }

  getGlobalBounds() {
    return this[Base.RAW].getGlobalBounds();
  }
}

Shape.RAW = Base.RAW;

module.exports = Shape;
