'use strict';

const util = require('util');

const {
  Vector3I: _Vector3I,
  Vector3F: _Vector3F,
  Vector3U: _Vector3U,
} = require('../build/Release/binding.node');
const { validateTypeOf } = require('./common');

function createClass(name, BaseClz, checkRange, formatBaseValue = v => v) {
  return class Vector3 extends BaseClz {
    [util.inspect.custom](depth, opts) {
      return `${name} ${util.inspect({
        ...this.toJSON(),
      }, opts)}`;
    }

    toJSON() {
      return { x: this.x, y: this.y, z: this.z };
    }

    constructor(xOrVector, y, z) {
      if (arguments.length === 3) {
        validateTypeOf(xOrVector, 'x', 'number');
        validateTypeOf(y, 'y', 'number');
        validateTypeOf(z, 'z', 'number');

        checkRange(xOrVector);
        checkRange(y);
        checkRange(z);

        xOrVector = formatBaseValue(xOrVector);
        y = formatBaseValue(y);
        z = formatBaseValue(z);

        super(xOrVector, y, z);
      } else if (arguments.length === 1) {
        validateTypeOf(xOrVector, 'vector', BaseClz);
        super(xOrVector);
      } else if (arguments.length === 0) {
        super();
      } else {
        throw new Error(`Invalid parameter count ${arguments.length}.`);
      }
    }

    get x() {
      return super.x;
    }

    set x(val) {
      validateTypeOf(val, 'x', 'number');
      checkRange(val);
      super.x = formatBaseValue(val);
    }

    get y() {
      return super.y;
    }

    set y(val) {
      validateTypeOf(val, 'y', 'number');
      checkRange(val);
      super.y = formatBaseValue(val);
    }

    get z() {
      return super.z;
    }

    set z(val) {
      validateTypeOf(val, 'z', 'number');
      checkRange(val);
      super.z = formatBaseValue(val);
    }

    static subtract(a, b) {
      if (!(a instanceof Vector3) || !(b instanceof Vector3)) {
        throw new Error('Invalid parameter type.');
      }

      return BaseClz.subtract(a, b);
    }

    static add(a, b) {
      if (!(a instanceof Vector3) || !(b instanceof Vector3)) {
        throw new Error('Invalid parameter type.');
      }

      return BaseClz.add(a, b);
    }

    static multiply(a, b) {
      if (!(a instanceof Vector3)) {
        throw new Error('Invalid left parameter type.');
      }
      validateTypeOf(b, 'b', 'number');
      checkRange(b);

      return BaseClz.multiply(a, formatBaseValue(b));
    }

    static div(a, b) {
      if (!(a instanceof Vector3)) {
        throw new Error('Invalid left parameter type.');
      }
      validateTypeOf(b, 'b', 'number');
      checkRange(b);

      return BaseClz.div(a, formatBaseValue(b));
    }

    static equals(a, b) {
      if (!(a instanceof Vector3) || !(b instanceof Vector3)) {
        throw new Error('Invalid parameter type.');
      }

      return BaseClz.equals(a, b);
    }

    static notEequals(a, b) {
      if (!(a instanceof Vector3) || !(b instanceof Vector3)) {
        throw new Error('Invalid parameter type.');
      }

      return BaseClz.notEequals(a, b);
    }
  };
}

const Vector3I = createClass(
  'Vector3I',
  _Vector3I,
  () => true,
  v => parseInt(v));
_Vector3I.setRealConstructor((...args) => new Vector3I(...args));

const Vector3U = createClass(
  'Vector3U',
  _Vector3U,
  v => {
    if (v < 0) {
      throw new Error('Value should greater than or equal to 0.');
    }
  },
  v => parseInt(v));
_Vector3U.setRealConstructor((...args) => new Vector3U(...args));

const Vector3F = createClass('Vector3F', _Vector3F, () => true);
_Vector3F.setRealConstructor((...args) => new Vector3F(...args));

module.exports = { Vector3I, Vector3U, Vector3F };
