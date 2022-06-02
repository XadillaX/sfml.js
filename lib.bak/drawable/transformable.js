'use strict';

const { validateTypeOf } = require('../common');
const { Vector2F } = require('../vector2');

function setTransformable(proto) {
  const ret = {
    getPosition() {
      return this._raw().getPosition();
    },

    setPosition(xOrPosition, y) {
      if (arguments.length === 1) {
        if (!(xOrPosition instanceof Vector2F)) {
          xOrPosition = new Vector2F(xOrPosition?.x, xOrPosition?.y);
        }

        return this._raw().setPosition(xOrPosition);
      }

      validateTypeOf(xOrPosition, 'x', 'number');
      validateTypeOf(y, 'y', 'number');
      return this._raw().setPosition(xOrPosition, y);
    },

    setRotation(rotation) {
      validateTypeOf(rotation, 'rotation', 'number');
      this._raw().setRotation(rotation);
    },

    getRotation() {
      return this._raw().getRotation();
    },

    getScale() {
      return this._raw().getScale();
    },

    setScale(xOrFactor, y) {
      if (arguments.length === 1) {
        if (!(xOrFactor instanceof Vector2F)) {
          xOrFactor = new Vector2F(xOrFactor?.x, xOrFactor?.y);
        }

        return this._raw().setScale(xOrFactor);
      }

      validateTypeOf(xOrFactor, 'x', 'number');
      validateTypeOf(y, 'y', 'number');
      return this._raw().setScale(xOrFactor, y);
    },

    getOrigin() {
      return this._raw().getOrigin();
    },

    setOrigin(xOrOrigin, y) {
      if (arguments.length === 1) {
        if (!(xOrOrigin instanceof Vector2F)) {
          xOrOrigin = new Vector2F(xOrOrigin?.x, xOrOrigin?.y);
        }

        return this._raw().setScale(xOrOrigin);
      }

      validateTypeOf(xOrOrigin, 'x', 'number');
      validateTypeOf(y, 'y', 'number');
      return this._raw().setOrigin(xOrOrigin, y);
    },

    move(xOrOffset, y) {
      if (arguments.length === 1) {
        if (!(xOrOffset instanceof Vector2F)) {
          xOrOffset = new Vector2F(xOrOffset?.x, xOrOffset?.y);
        }

        return this._raw().move(xOrOffset);
      }

      validateTypeOf(xOrOffset, 'x', 'number');
      validateTypeOf(y, 'y', 'number');
      return this._raw().move(xOrOffset, y);
    },

    scale(xOrFactor, y) {
      if (arguments.length === 1) {
        if (!(xOrFactor instanceof Vector2F)) {
          xOrFactor = new Vector2F(xOrFactor?.x, xOrFactor?.y);
        }

        return this._raw().scale(xOrFactor);
      }

      validateTypeOf(xOrFactor, 'x', 'number');
      validateTypeOf(y, 'y', 'number');
      return this._raw().scale(xOrFactor, y);
    },

    rotate(rotation) {
      validateTypeOf(rotation, 'rotation', 'number');
      this._raw().rotate(rotation);
    },
  };

  for (const key in ret) {
    if (!ret.hasOwnProperty(key)) continue;
    proto[key] = ret[key];
  }
}

module.exports = {
  setTransformable,
};
