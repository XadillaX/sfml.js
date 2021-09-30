'use strict';

const Shape = require('./shape');
const { validateTypeOf } = require('../common');

class CircleShape extends Shape {
  constructor(radius = 0, pointCount = 30) {
    validateTypeOf(radius, 'radius', 'number');
    validateTypeOf(pointCount, 'pointCount', 'number');

    if (radius < 0 || pointCount < 0) {
      throw new RangeError('`radius` and `pointCount` should greater than 0.');
    }

    pointCount = parseInt(pointCount);

    super('CircleShape', radius, pointCount);
  }
}

module.exports = CircleShape;
