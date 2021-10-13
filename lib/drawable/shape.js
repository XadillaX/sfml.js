'use strict';

const Base = require('./base');
const Color = require('../color');
const { validateTypeOf } = require('../common');
const { Vector2F } = require('../vector2');

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

  getPoint(idx) {
    return this[Base.RAW].getPoint(idx);
  }

  getPosition() {
    return this[Base.RAW].getPosition();
  }

  setPosition(xOrPosition, y) {
    if (arguments.length === 1) {
      if (!(xOrPosition instanceof Vector2F)) {
        xOrPosition = new Vector2F(xOrPosition?.x, xOrPosition?.y);
      }

      return this[Base.RAW].setPosition(xOrPosition);
    }

    validateTypeOf(xOrPosition, 'x', 'number');
    validateTypeOf(y, 'y', 'number');
    return this[Base.RAW].setPosition(xOrPosition, y);
  }
}

Shape.RAW = Base.RAW;

module.exports = Shape;
