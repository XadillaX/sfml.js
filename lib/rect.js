'use strict';

const util = require('util');

const { FloatRect: _FloatRect, IntRect: _IntRect } = require('../build/Release/binding.node');
const { validateTypeOf } = require('./common');
const { Vector2F, Vector2I } = require('./vector2');

function createClass(name, BaseClz, Vector) {
  return class Rect extends BaseClz {
    [util.inspect.custom](depth, opts) {
      return `${name} ${util.inspect({
        ...this.toJSON(),
      }, opts)}`;
    }

    toJSON() {
      return { left: this.left, top: this.top, width: this.width, height: this.height };
    }

    constructor(leftOrPosition, topOrSize, width, height) {
      if (arguments.length === 4) {
        validateTypeOf(leftOrPosition, 'left', 'number');
        validateTypeOf(topOrSize, 'top', 'number');
        validateTypeOf(width, 'width', 'number');
        validateTypeOf(height, 'height', 'number');
        super(leftOrPosition, topOrSize, width, height);
      } else if (arguments.length === 2) {
        if (!(leftOrPosition instanceof Vector)) {
          leftOrPosition = new Vector(leftOrPosition?.x, leftOrPosition?.y);
        }

        if (!(topOrSize instanceof Vector)) {
          topOrSize = new Vector(topOrSize?.x, topOrSize?.y);
        }

        super(leftOrPosition, topOrSize);
      } else if (arguments.length === 0) {
        super();
      } else {
        throw new Error(`Invalid parameter count ${arguments.length}.`);
      }
    }

    get top() { return super.top; }
    set top(val) {
      validateTypeOf(val, 'top', 'number');
      super.top = val;
    }

    get left() { return super.left; }
    set left(val) {
      validateTypeOf(val, 'left', 'number');
      super.left = val;
    }

    get width() { return super.width; }
    set width(val) {
      validateTypeOf(val, 'width', 'number');
      super.width = val;
    }

    get height() { return super.height; }
    set height(val) {
      validateTypeOf(val, 'height', 'number');
      super.height = val;
    }

    contains(xOrPoint, y) {
      if (arguments.length === 1) {
        if (!(xOrPoint instanceof Vector)) {
          y = xOrPoint?.y;
          xOrPoint = xOrPoint?.x;
        } else {
          validateTypeOf(xOrPoint, 'point', Vector);
          return super.contains(xOrPoint);
        }
      }

      validateTypeOf(xOrPoint, 'x', 'number');
      validateTypeOf(y, 'y', 'number');

      return super.contains(xOrPoint, y);
    }

    intersects(rect) {
      validateTypeOf(rect, 'rect', BaseClz);
      return super.intersects(rect);
    }
  };
}

const IntRect = createClass('IntRect', _IntRect, Vector2I);
_IntRect.setRealConstructor(IntRect);

const FloatRect = createClass('FloatRect', _FloatRect, Vector2F);
_FloatRect.setRealConstructor(FloatRect);

module.exports = { FloatRect, IntRect };
