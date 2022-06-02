'use strict';

const util = require('util');

const { Color } = require('../color');
const { Drawable } = require('./drawable');
const { Vector2F } = require('../vector2');
const { validateTypeOf } = require('../common');
const { Vertex } = require('../vertex');

const GET_VERTEX_COUNT = Symbol('VertexArray::getVertexCount');
const GET_PRIMITIVE_TYPE = Symbol('VertexArray::getPrimitiveType');
const DUMP_ARRAY = Symbol('VertexArray::dumpArray');

class VertexArray extends Drawable {
  [util.inspect.custom](depth, opts) {
    const arr = [];
    for (let i = 0; i < this.getVertexCount(); i++) {
      arr.push(this.duplicateVertex(i));
    }

    return `VertexArray ${util.inspect({
      [GET_VERTEX_COUNT]: this.getVertexCount(),
      [GET_PRIMITIVE_TYPE]: this.getPrimitiveType(),
      [DUMP_ARRAY]: arr,
    }, opts)}`;
  }

  constructor(type, vertexCount) {
    if (arguments.length === 0) {
      super('VertexArray');
    } else if (arguments.length === 1) {
      validateTypeOf(type, 'type', 'number');
      if (type < 0 || type > VertexArray.PrimitiveType.TrianglesFan) {
        throw new RangeError(`Invalid PrimitiveType ${type}.`);
      }
      super('VertexArray', type, 0);
    } else {
      validateTypeOf(type, 'type', 'number');
      validateTypeOf(vertexCount, 'vertexCount', 'number');
      if (type < 0 || type > VertexArray.PrimitiveType.TrianglesFan) {
        throw new RangeError(`Invalid PrimitiveType ${type}.`);
      }
      if (vertexCount < 0) {
        throw new RangeError('vertexCount should >= 0.');
      }
      super('VertexArray', type, vertexCount);
    }
  }

  getVertexCount() {
    return this._raw().getVertexCount();
  }

  duplicateVertex(idx) {
    validateTypeOf(idx, 'idx', 'number');
    return this._raw().duplicateVertex(idx);
  }

  setVertex(idx, vertex) {
    validateTypeOf(idx, 'idx', 'number');
    validateTypeOf(vertex, 'vertex', Vertex);
    return this._raw().setVertex(idx, vertex);
  }

  setPosition(idx, position) {
    validateTypeOf(idx, 'idx', 'number');
    if (!(position instanceof Vector2F)) {
      position = new Vector2F(position?.x, position?.y);
    }
    return this._raw().setPosition(idx, position);
  }

  setColor(idx, color) {
    validateTypeOf(idx, 'idx', 'number');
    if (typeof color === 'number') {
      color = new Color(color);
    }
    validateTypeOf(color, 'color', Color);

    return this._raw().setColor(idx, color);
  }

  setTexCoords(idx, texCoords) {
    validateTypeOf(idx, 'idx', 'number');
    if (!(texCoords instanceof Vector2F)) {
      texCoords = new Vector2F(texCoords?.x, texCoords?.y);
    }
    return this._raw().setTexCoords(idx, texCoords);
  }

  clear() {
    this._raw().clear();
  }

  resize(size) {
    validateTypeOf(size, 'size', 'number');
    if (size < 0) {
      throw new RangeError('size should >= 0.');
    }
    this._raw().resize(size);
  }

  append(vertex) {
    validateTypeOf(vertex, 'vertex', Vertex);
    return this._raw().append(vertex);
  }

  setPrimitiveType(type) {
    validateTypeOf(type, 'type', 'number');
    if (type < 0 || type > VertexArray.PrimitiveType.TrianglesFan) {
      throw new RangeError(`Invalid PrimitiveType ${type}.`);
    }
    return this._raw().setPrimitiveType(type);
  }

  getPrimitiveType() {
    return this._raw().getPrimitiveType();
  }

  getBounds() {
    return this._raw().getBounds();
  }
}

VertexArray.PrimitiveType = require('../../build/Release/binding.node').PrimitiveType;

module.exports = { VertexArray };
