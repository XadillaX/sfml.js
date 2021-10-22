'use strict';

const Shape = require('./shape');
const { validateTypeOf } = require('../common');
const { Vector2F } = require('../vector2');

class ConvexShape extends Shape {
  constructor(pointCount = 0) {
    validateTypeOf(pointCount, 'pointCount', 'number');

    if (pointCount < 0) {
      throw new RangeError('`radius` and `pointCount` should greater than 0.');
    }

    pointCount = parseInt(pointCount);

    super('ConvexShape', pointCount);
  }

  setPointCount(count) {
    validateTypeOf(count, 'count', 'number');
    this._raw().setPointCount(count);
  }

  setPoint(idx, point) {
    validateTypeOf(idx, 'count', 'number');
    if (!(point instanceof Vector2F)) {
      point = new Vector2F(point?.x, point?.y);
    }

    this._raw().setPoint(idx, point);
  }
}

module.exports = ConvexShape;
