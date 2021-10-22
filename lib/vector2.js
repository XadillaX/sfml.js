'use strict';

const util = require('util');

const {
  Vector2I: _Vector2I,
  Vector2F: _Vector2F,
  Vector2U: _Vector2U,
} = require('../build/Release/binding.node');
const { validateTypeOf } = require('./common');

function createClass(name, BaseClz, checkRange, formatBaseValue = v => v) {
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

        xOrVector = formatBaseValue(xOrVector);
        y = formatBaseValue(y);

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
      super.x = formatBaseValue(val);
    }

    get y() { return super.y; }
    set y(val) {
      validateTypeOf(val, 'y', 'number');
      checkRange(val);
      super.y = formatBaseValue(val);
    }

    static subtract(a, b) {
      if (!(a instanceof Vector2) || !(b instanceof Vector2)) {
        throw new Error('Invalid parameter type.');
      }

      return BaseClz.subtract(a, b);
    }

    static add(a, b) {
      if (!(a instanceof Vector2) || !(b instanceof Vector2)) {
        throw new Error('Invalid parameter type.');
      }

      return BaseClz.add(a, b);
    }

    static multiply(a, b) {
      if (!(a instanceof Vector2)) {
        throw new Error('Invalid left parameter type.');
      }
      validateTypeOf(b, 'b', 'number');
      checkRange(b);

      return BaseClz.multiply(a, formatBaseValue(b));
    }

    static div(a, b) {
      if (!(a instanceof Vector2)) {
        throw new Error('Invalid left parameter type.');
      }
      validateTypeOf(b, 'b', 'number');
      checkRange(b);

      return BaseClz.div(a, formatBaseValue(b));
    }

    static equals(a, b) {
      if (!(a instanceof Vector2) || !(b instanceof Vector2)) {
        throw new Error('Invalid parameter type.');
      }

      return BaseClz.equals(a, b);
    }

    static notEequals(a, b) {
      if (!(a instanceof Vector2) || !(b instanceof Vector2)) {
        throw new Error('Invalid parameter type.');
      }

      return BaseClz.notEequals(a, b);
    }
  };
}

const Vector2I = createClass('Vector2I', _Vector2I, () => true, v => parseInt(v));
_Vector2I.setRealConstructor(Vector2I);

const Vector2U = createClass('Vector2U', _Vector2U, v => {
  if (v < 0) {
    throw new Error('Value should greater than or equal to 0.');
  }
}, v => parseInt(v));
_Vector2U.setRealConstructor(Vector2U);

const Vector2F = createClass('Vector2F', _Vector2F, () => true);
_Vector2F.setRealConstructor(Vector2F);

module.exports = { Vector2I, Vector2U, Vector2F };
