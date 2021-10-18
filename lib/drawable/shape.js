'use strict';

const CommonDrawable = require('./common_drawable');

class Shape extends CommonDrawable {
  getPointCount() {
    return this[CommonDrawable.RAW].getPointCount();
  }

  setPointCount() {
    throw new Error('Unimplemented.');
  }

  getPoint(idx) {
    return this[CommonDrawable.RAW].getPoint(idx);
  }
}

module.exports = Shape;
