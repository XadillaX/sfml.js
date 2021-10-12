'use strict';

const util = require('util');

const { FloatRect: _FloatRect, IntRect: _IntRect } = require('../build/Release/binding.node');
const { validateTypeOf } = require('./common');

function createClass(name, BaseClz) {
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
        const left = leftOrPosition?.x;
        const top = leftOrPosition?.y;
        width = topOrSize?.x;
        height = topOrSize?.y;

        validateTypeOf(left, 'left', 'number');
        validateTypeOf(top, 'top', 'number');
        validateTypeOf(width, 'width', 'number');
        validateTypeOf(height, 'height', 'number');
        super(left, top, width, height);
      } else if (arguments.length === 0) {
        super();
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

    contains(x, y) {
      validateTypeOf(x, 'x', 'number');
      validateTypeOf(y, 'y', 'number');
      return super.contains(x, y);
    }

    intersects(rect) {
      validateTypeOf(rect, 'rect', BaseClz);
      return super.intersects(rect);
    }
  };
}

const IntRect = createClass('IntRect', _IntRect);
IntRect.setRealConstructor(IntRect);

const FloatRect = createClass('FloatRect', _FloatRect);
FloatRect.setRealConstructor(FloatRect);

module.exports = { FloatRect, IntRect };
