'use strict';

const util = require('util');

const { Color } = require('./color');
const { validateTypeOf } = require('./common');
const { Vertex: _Vertex } = require('../build/Release/binding.node');
const { Vector2F } = require('./vector2');

const POSITION = Symbol('Vertex::position');
const COLOR = Symbol('Vertex::color');
const TEX_COORDS = Symbol('Vertex::texCoords');
const INJECT = Symbol('Vertex#inject');
const UNINJECT = Symbol('Vertex#uninject');

function getPropertyDescriptor(obj, key) {
  if (obj === undefined || obj === null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  if (key in obj) {
    return getRecursivePropertyDescriptor(obj);
  }

  function getRecursivePropertyDescriptor(obj) {
    return Object.prototype.hasOwnProperty.call(obj, key) ?
      Object.getOwnPropertyDescriptor(obj, key) :
      getRecursivePropertyDescriptor(Object.getPrototypeOf(obj));
  }
}

class Vertex extends _Vertex {
  [util.inspect.custom](depth, opts) {
    return `Vertex ${util.inspect({
      position: this[POSITION],
      color: this[COLOR],
      texCoords: this[TEX_COORDS],
    }, opts)}`;
  }

  toJSON() {
    return {
      position: this[POSITION],
      color: this[COLOR],
      texCoords: this[TEX_COORDS],
    };
  }

  [INJECT](object, name, properties, type) {
    for (const property of properties) {
      const origDesc = getPropertyDescriptor(object, property);
      origDesc.enumerable = false;
      Object.defineProperty(object, `orig$$${property}`, origDesc);
      Object.defineProperty(object, property, {
        get: () => {
          return object[`orig$$${property}`];
        },
        set: value => {
          object[`orig$$${property}`] = value;
          this.syncFromJS(type);
        },
        enumerable: true,
        configurable: true,
      });
    }
  }

  [UNINJECT](object, properties) {
    for (const property of properties) {
      const origDesc = Object.getOwnPropertyDescriptor(object, `orig$$${property}`);
      origDesc.enumerable = true;
      Object.defineProperty(object, property, origDesc);
      delete object[`orig$$${property}`];
    }
  }

  constructor(position, color, texCoords) {
    if (arguments.length === 2 && position === -99999) {
      super(position, color);
    } else if (!arguments.length) {
      super();
    } else {
      if (!(position instanceof Vector2F)) {
        position = new Vector2F(position?.x, position?.y);
      }

      if (arguments.length === 1) {
        super(position, undefined, undefined);
      } else if (arguments.length === 2) {
        if (typeof color === 'number') {
          color = new Color(color);
        }

        if (!(color instanceof Color) && !(color instanceof Vector2F)) {
          texCoords = new Vector2F(color?.x, color?.y);
          color = undefined;
        } else if (color instanceof Vector2F) {
          texCoords = color;
          color = undefined;
        } else {
          texCoords = undefined;
        }

        super(position, color, texCoords);
      } else {
        if (typeof color === 'number') {
          color = new Color(color);
        }
        validateTypeOf(color, 'color', Color);

        if (!(texCoords instanceof Vector2F)) {
          texCoords = new Vector2F(texCoords?.x, texCoords?.y);
        }

        super(position, color, texCoords);
      }
    }

    this[POSITION] = super.position;
    this[COLOR] = super.color;
    this[TEX_COORDS] = super.texCoords;

    this[INJECT](this[POSITION], 'position', [ 'x', 'y' ], 0);
    this[INJECT](this[COLOR], 'color', [ 'r', 'g', 'b', 'a' ], 1);
    this[INJECT](this[TEX_COORDS], 'texCoords', [ 'x', 'y' ], 2);
  }

  get position() {
    return this[POSITION];
  }

  set position(val) {
    const position = new Vector2F(val?.x || 0, val?.y || 0);
    this[UNINJECT](this[POSITION], [ 'x', 'y' ]);
    this[POSITION] = position;
    this[INJECT](position, 'position', [ 'x', 'y' ], 0);
    this.syncFromJS(0);
  }

  get color() {
    return this[COLOR];
  }

  set color(val) {
    let color;
    if (typeof val === 'number') {
      color = new Color(val);
    } else if (!(val instanceof Color)) {
      throw new Error('`val` should be an instance of Color.');
    } else {
      color = new Color(val.toInteger());
    }

    this[UNINJECT](this[COLOR], [ 'r', 'g', 'b', 'a' ]);
    this[COLOR] = color;
    this[INJECT](color, 'color', [ 'r', 'g', 'b', 'a' ], 1);
    this.syncFromJS(1);
  }

  get texCoords() {
    return this[TEX_COORDS];
  }

  set texCoords(val) {
    const texCoords = new Vector2F(val?.x, val?.y);
    this[UNINJECT](this[TEX_COORDS], [ 'x', 'y' ]);
    this[TEX_COORDS] = texCoords;
    this[INJECT](texCoords, 'texCoords', [ 'x', 'y' ], 2);
    this.syncFromJS(2);
  }
}

_Vertex.setRealConstructor(Vertex);

module.exports = { Vertex };
