import * as assert from 'assert';
import * as util from 'util';

import { Vertex as _Vertex, VertexSyncType } from './binding';
import { Color, ColorType } from './color';
import { Vector2F, Vector2FType } from './vector2';

const POSITION = Symbol('Vertex::position');
const COLOR = Symbol('Vertex::color');
const TEX_COORDS = Symbol('Vertex::texCoords');
const INJECT = Symbol('Vertex#inject');
const UNINJECT = Symbol('Vertex#uninject');

function getPropertyDescriptor(obj: object, key: string) {
  if (obj === undefined || obj === null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  if (key in obj) {
    return getRecursivePropertyDescriptor(obj) || {};
  }

  function getRecursivePropertyDescriptor(
    obj: object,
  ): PropertyDescriptor | undefined {
    return Object.prototype.hasOwnProperty.call(obj, key) ?
      Object.getOwnPropertyDescriptor(obj, key) :
      getRecursivePropertyDescriptor(Object.getPrototypeOf(obj));
  }

  return {};
}

export interface IVertex {
  position: Vector2F;
  color: Color;
  texCoords: Vector2F;
}

export class Vertex extends _Vertex {
  [POSITION]: Vector2F;
  [COLOR]: Color;
  [TEX_COORDS]: Vector2F;

  [util.inspect.custom](_: number, opts: util.InspectOptions) {
    return `Vertex ${util.inspect({
      position: this[POSITION],
      color: this[COLOR],
      texCoords: this[TEX_COORDS],
    }, opts)}`;
  }

  toJSON(): IVertex {
    return {
      position: this[POSITION],
      color: this[COLOR],
      texCoords: this[TEX_COORDS],
    };
  }

  constructor();
  constructor(position: Vector2FType);
  constructor(position: Vector2FType, color: ColorType);
  constructor(position: Vector2FType, texCoords: Vector2FType);
  constructor(
    position: Vector2FType,
    color: ColorType,
    texCoords: Vector2FType,
  );
  constructor(...args: any[]) {
    if (args.length === 2 && args[0] === -99999) {
      assert.strictEqual(args[1] instanceof BigInt, true);
      super(args[0], args[1]);
    } else if (!args.length) {
      super();
    } else {
      const position = args[0] instanceof Vector2F ?
        args[0] :
        new Vector2F(args[0]?.x, args[0]?.y);
      let color: Color | undefined;
      let texCoords: Vector2F | undefined;
      switch (args.length) {
        case 1:
          break;

        case 2:
          if (args[1] instanceof Color) {
            color = args[1];
          } else if (typeof args[1] === 'number') {
            color = new Color(args[1]);
          } else if (args[1] instanceof Vector2F) {
            texCoords = args[1];
          } else {
            texCoords = new Vector2F(args[1]?.x, args[1]?.y);
          }
          break;

        case 3:
          if (args[1] instanceof Color) {
            color = args[1];
          } else if (typeof args[1] === 'number') {
            color = new Color(args[1]);
          } else {
            throw new Error('Invalid color type');
          }

          if (args[2] instanceof Vector2F) {
            texCoords = args[2];
          } else {
            texCoords = new Vector2F(args[2]?.x, args[2]?.y);
          }
          break;

        default:
          throw new Error('Invalid arguments');
      }

      super(position, color, texCoords);
    }

    this[POSITION] = super.position as Vector2F;
    this[COLOR] = super.color as Color;
    this[TEX_COORDS] = super.texCoords as Vector2F;

    this[INJECT](this, [ 'x', 'y' ], VertexSyncType.kPosition);
    this[INJECT](this, [ 'r', 'g', 'b', 'a' ], VertexSyncType.kColor);
    this[INJECT](this, [ 'x', 'y' ], VertexSyncType.kTexCoords);
  }

  [INJECT](
    obj: object,
    properties: string[],
    type: VertexSyncType,
  ) {
    for (const property of properties) {
      const origDesc = getPropertyDescriptor(obj, property);
      origDesc.enumerable = false;
      Object.defineProperty(obj, `orig$$${property}`, origDesc);
      Object.defineProperty(obj, property, {
        get: () => {
          return obj[`orig$$${property}`];
        },
        set: value => {
          obj[`orig$$${property}`] = value;
          super.syncFromJS(type);
        },
        enumerable: true,
        configurable: true,
      });
    }
  }

  [UNINJECT](obj: object, properties: string[]) {
    for (const property of properties) {
      const origDesc = getPropertyDescriptor(obj, `orig$$${property}`);
      origDesc.enumerable = true;
      Object.defineProperty(obj, property, origDesc);
      delete obj[`orig$$${property}`];
    }
  }

  get position() {
    return this[POSITION];
  }

  set position(pos: Vector2FType) {
    const position = new Vector2F(pos?.x || 0, pos?.y || 0);
    this[INJECT](position, [ 'x', 'y' ], VertexSyncType.kPosition);
    this[UNINJECT](this[POSITION], [ 'x', 'y' ]);
    this[POSITION] = position;
    super.syncFromJS(VertexSyncType.kPosition);
  }

  get color(): Color {
    return this[COLOR];
  }

  set color(col: ColorType) {
    let color: Color;
    if (typeof col === 'number') {
      color = new Color(col);
    } else if (col instanceof Color) {
      color = new Color(col.toInteger());
    } else {
      throw new Error('Invalid color type');
    }

    this[INJECT](color, [ 'r', 'g', 'b', 'a' ], VertexSyncType.kColor);
    this[UNINJECT](this[COLOR], [ 'r', 'g', 'b', 'a' ]);
    this[COLOR] = color;
    super.syncFromJS(VertexSyncType.kColor);
  }

  get texCoords(): Vector2F {
    return this[TEX_COORDS];
  }

  set texCoords(texCoords: Vector2FType) {
    const texCoords_ = new Vector2F(texCoords?.x || 0, texCoords?.y || 0);
    this[INJECT](texCoords_, [ 'x', 'y' ], VertexSyncType.kTexCoords);
    this[UNINJECT](this[TEX_COORDS], [ 'x', 'y' ]);
    this[TEX_COORDS] = texCoords_;
    super.syncFromJS(VertexSyncType.kTexCoords);
  }

  syncFromJS() {
    throw new Error('Do not call syncFromJS on Vertex');
  }
}

_Vertex.setRealConstructor((...args: any[]) => new Vertex(...(args as [])));
