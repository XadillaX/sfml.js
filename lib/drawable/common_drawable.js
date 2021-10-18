'use strict';

const Base = require('./base');
const Color = require('../color');
const { validateTypeOf } = require('../common');
const { Vector2F } = require('../vector2');

class CommonDrawable extends Base {
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

  getLocalBounds() {
    return this[Base.RAW].getLocalBounds();
  }

  getGlobalBounds() {
    return this[Base.RAW].getGlobalBounds();
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

  setRotation(rotation) {
    validateTypeOf(rotation, 'rotation', 'number');
    this[Base.RAW].setRotation(rotation);
  }

  getRotation() {
    return this[Base.RAW].getRotation();
  }

  getScale() {
    return this[Base.RAW].getScale();
  }

  setScale(xOrFactor, y) {
    if (arguments.length === 1) {
      if (!(xOrFactor instanceof Vector2F)) {
        xOrFactor = new Vector2F(xOrFactor?.x, xOrFactor?.y);
      }

      return this[Base.RAW].setScale(xOrFactor);
    }

    validateTypeOf(xOrFactor, 'x', 'number');
    validateTypeOf(y, 'y', 'number');
    return this[Base.RAW].setScale(xOrFactor, y);
  }

  getOrigin() {
    return this[Base.RAW].getOrigin();
  }

  setOrigin(xOrOrigin, y) {
    if (arguments.length === 1) {
      if (!(xOrOrigin instanceof Vector2F)) {
        xOrOrigin = new Vector2F(xOrOrigin?.x, xOrOrigin?.y);
      }

      return this[Base.RAW].setScale(xOrOrigin);
    }

    validateTypeOf(xOrOrigin, 'x', 'number');
    validateTypeOf(y, 'y', 'number');
    return this[Base.RAW].setScale(xOrOrigin, y);
  }
}

CommonDrawable.RAW = Base.RAW;

module.exports = CommonDrawable;
