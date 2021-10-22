'use strict';

const Shape = require('./shape');
const { Vector2F } = require('../vector2');

class RectangleShape extends Shape {
  constructor(size) {
    if (!(size instanceof Vector2F)) {
      size = new Vector2F(size?.x, size?.y);
    }

    super('RectangleShape', size);
  }

  setSize(size) {
    if (!(size instanceof Vector2F)) {
      size = new Vector2F(size?.x, size?.y);
    }

    this._raw().setSize(size);
  }

  getSize() {
    return this._raw().getSize();
  }
}

module.exports = RectangleShape;
