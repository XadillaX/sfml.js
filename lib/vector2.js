'use strict';

const util = require('util');

const {
  Vector2I: _Vector2I,
  Vector2U: _Vector2U,
  Vector2F: _Vector2F,
} = require('../build/Release/binding.node');
const { validateTypeOf } = require('./common');

function createClass(name, BaseClz, checkRange = () => true) {
  return class Vector2 extends BaseClz {
    [util.inspect.custom](depth, opts) {
      return `${name} ${util.inspect({
        ...this.toJSON(),
      }, opts)}`;
    }

    toJSON() {
      return { x: this.x, y: this.y };
    }

    constructor(xOrVector, y) {
      if (arguments.length === 2) {
        validateTypeOf(xOrVector, 'x', 'number');
        validateTypeOf(y, 'y', 'number');

        checkRange(xOrVector);
        checkRange(y);

        super(xOrVector, y);
      } else if (arguments.length === 1) {
        validateTypeOf(xOrVector, 'vector', BaseClz);
        super(xOrVector);
      } else if (arguments.length === 0) {
        super();
      } else {
        throw new Error(`Invalid parameter count ${arguments.length}.`);
      }
    }

    get x() { return super.x; }
    set x(val) {
      validateTypeOf(val, 'x', 'number');
      checkRange(val);
      super.x = val;
    }

    get y() { return super.y; }
    set y(val) {
      validateTypeOf(val, 'y', 'number');
      checkRange(val);
      super.y = val;
    }
  };
}

const Vector2I = createClass('Vector2I', _Vector2I);
_Vector2I.setRealConstructor(Vector2I);

const Vector2U = createClass('Vector2U', _Vector2U, v => {
  if (v < 0) {
    throw new Error('Value should greater than or equal to 0.');
  }
});
_Vector2U.setRealConstructor(Vector2U);

const Vector2F = createClass('Vector2F', _Vector2F);
_Vector2F.setRealConstructor(Vector2F);

module.exports = { Vector2I, Vector2U, Vector2F };
