import * as util from 'util';

import {
  Float,
  Int32,
  Uint32,

  Vector3F as _Vector3F,
  Vector3I as _Vector3I,
  Vector3U as _Vector3U,
} from './binding';
import {
  formatFloatValue,
  formatInt32Value,
  formatUint32Value,
  FormatValueFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
} from './utils/formatter';

function inspect<V extends(Vector3F | Vector3I | Vector3U)>(
  name: string,
  vec: V,
  opts: util.InspectOptionsStylized,
) {
  return `${name} ${util.inspect({
    ...vec.toJSON(),
  }, opts)}`;
}

function processConstructorArgs<T, V>(
  Vec: any,
  args: any[],
  formatValue: FormatValueFunction,
): [] | [T, T, T] | [V] {
  if (args.length === 0) {
    return [];
  } else if (args.length === 1) {
    if (!(args[0] instanceof Vec)) {
      throw new Error('Invalid constructor arguments');
    }
    return [ args[0] as V ];
  } else if (args.length === 3) {
    args[0] = formatValue(args[0]);
    args[1] = formatValue(args[1]);
    args[2] = formatValue(args[2]);
    return [ args[0] as T, args[1] as T, args[2] as T ];
  }

  throw new Error('Invalid constructor arguments');
}

export interface ThreeDemensionalPoint<T> {
  x: T;
  y: T;
  z: T;
}

function toJSON<T>(
  vec: Vector3F | Vector3I | Vector3U,
): ThreeDemensionalPoint<T> {
  return {
    x: vec.x as unknown as T,
    y: vec.y as unknown as T,
    z: vec.z as unknown as T,
  };
}

export class Vector3F extends _Vector3F {
  static add(lhs: Vector3F, rhs: Vector3F): Vector3F {
    return _Vector3F.add(lhs, rhs);
  }

  static subtract(lhs: Vector3F, rhs: Vector3F): Vector3F {
    return _Vector3F.subtract(lhs, rhs);
  }

  static multiply(lhs: Vector3F, rhs: Float): Vector3F {
    return _Vector3F.multiply(lhs, rhs);
  }

  static div(lhs: Vector3F, rhs: Float): Vector3F {
    return _Vector3F.div(lhs, rhs);
  }

  static equals(lhs: Vector3F, rhs: Vector3F): boolean {
    return _Vector3F.equals(lhs, rhs);
  }

  static notEquals(lhs: Vector3F, rhs: Vector3F): boolean {
    return _Vector3F.notEquals(lhs, rhs);
  }

  constructor();
  constructor(another: Vector3F);
  constructor(x: Float, y: Float);
  constructor(...args: any[]) {
    const newArgs = processConstructorArgs<Float, Vector3F>(
      Vector3F,
      args,
      formatFloatValue,
    ) as [];
    super(...newArgs);
  }

  [util.inspect.custom](_: number, opts: util.InspectOptionsStylized) {
    return inspect('Vector3F', this, opts);
  }

  toJSON(): ThreeDemensionalPoint<Float> {
    return toJSON<Float>(this) as ThreeDemensionalPoint<Float>;
  }

  set x(x: Float) {
    super.x = formatFloatValue(x);
  }

  set y(y: Float) {
    super.y = formatFloatValue(y);
  }

  set z(z: Float) {
    super.z = formatFloatValue(z);
  }

  add(rhs: Vector3F): Vector3F {
    return Vector3F.add(this, rhs);
  }

  subtract(rhs: Vector3F): Vector3F {
    return Vector3F.subtract(this, rhs);
  }

  multiply(rhs: Float): Vector3F {
    return Vector3F.multiply(this, rhs);
  }

  div(rhs: Float): Vector3F {
    return Vector3F.div(this, rhs);
  }

  equals(rhs: Vector3F): boolean {
    return Vector3F.equals(this, rhs);
  }

  notEquals(rhs: Vector3F): boolean {
    return Vector3F.notEquals(this, rhs);
  }
}

export class Vector3I extends _Vector3I {
  static add(lhs: Vector3I, rhs: Vector3I): Vector3I {
    return _Vector3I.add(lhs, rhs);
  }

  static subtract(lhs: Vector3I, rhs: Vector3I): Vector3I {
    return _Vector3I.subtract(lhs, rhs);
  }

  static multiply(lhs: Vector3I, rhs: Int32): Vector3I {
    return _Vector3I.multiply(lhs, rhs);
  }

  static div(lhs: Vector3I, rhs: Int32): Vector3I {
    return _Vector3I.div(lhs, rhs);
  }

  static equals(lhs: Vector3I, rhs: Vector3I): boolean {
    return _Vector3I.equals(lhs, rhs);
  }

  static notEquals(lhs: Vector3I, rhs: Vector3I): boolean {
    return _Vector3I.notEquals(lhs, rhs);
  }

  constructor();
  constructor(another: Vector3F);
  constructor(x: Int32, y: Int32);
  constructor(...args: any[]) {
    const newArgs = processConstructorArgs<Int32, Vector3I>(
      Vector3I,
      args,
      formatInt32Value,
    ) as [];
    super(...newArgs);
  }

  [util.inspect.custom](_: number, opts: util.InspectOptionsStylized) {
    return inspect('Vector3I', this, opts);
  }

  toJSON(): ThreeDemensionalPoint<Int32> {
    return toJSON<Int32>(this) as ThreeDemensionalPoint<Int32>;
  }

  set x(x: Int32) {
    super.x = formatInt32Value(x);
  }

  set y(y: Int32) {
    super.y = formatInt32Value(y);
  }

  set z(z: Int32) {
    super.z = formatInt32Value(z);
  }

  add(rhs: Vector3I): Vector3I {
    return Vector3I.add(this, rhs);
  }

  subtract(rhs: Vector3I): Vector3I {
    return Vector3I.subtract(this, rhs);
  }

  multiply(rhs: Int32): Vector3I {
    return Vector3I.multiply(this, rhs);
  }

  div(rhs: Int32): Vector3I {
    return Vector3I.div(this, rhs);
  }

  equals(rhs: Vector3I): boolean {
    return Vector3I.equals(this, rhs);
  }

  notEquals(rhs: Vector3I): boolean {
    return Vector3I.notEquals(this, rhs);
  }
}

export class Vector3U extends _Vector3U {
  static add(lhs: Vector3U, rhs: Vector3U): Vector3U {
    return _Vector3U.add(lhs, rhs);
  }

  static subtract(lhs: Vector3U, rhs: Vector3U): Vector3U {
    return _Vector3U.subtract(lhs, rhs);
  }

  static multiply(lhs: Vector3U, rhs: Uint32): Vector3U {
    return _Vector3U.multiply(lhs, rhs);
  }

  static div(lhs: Vector3U, rhs: Uint32): Vector3U {
    return _Vector3U.div(lhs, rhs);
  }

  static equals(lhs: Vector3U, rhs: Vector3U): boolean {
    return _Vector3U.equals(lhs, rhs);
  }

  static notEquals(lhs: Vector3U, rhs: Vector3U): boolean {
    return _Vector3U.notEquals(lhs, rhs);
  }

  constructor();
  constructor(another: Vector3F);
  constructor(x: Uint32, y: Uint32);
  constructor(...args: any[]) {
    const newArgs = processConstructorArgs<Uint32, Vector3U>(
      Vector3U,
      args,
      formatUint32Value,
    ) as [];
    super(...newArgs);
  }

  [util.inspect.custom](_: number, opts: util.InspectOptionsStylized) {
    return inspect('Vector3U', this, opts);
  }

  toJSON(): ThreeDemensionalPoint<Uint32> {
    return toJSON<Uint32>(this) as ThreeDemensionalPoint<Uint32>;
  }

  set x(x: Uint32) {
    super.x = formatUint32Value(x);
  }

  set y(y: Uint32) {
    super.y = formatUint32Value(y);
  }

  set z(z: Uint32) {
    super.z = formatUint32Value(z);
  }

  add(rhs: Vector3U): Vector3U {
    return Vector3U.add(this, rhs);
  }

  subtract(rhs: Vector3U): Vector3U {
    return Vector3U.subtract(this, rhs);
  }

  multiply(rhs: Uint32): Vector3U {
    return Vector3U.multiply(this, rhs);
  }

  div(rhs: Uint32): Vector3U {
    return Vector3U.div(this, rhs);
  }

  equals(rhs: Vector3U): boolean {
    return Vector3U.equals(this, rhs);
  }

  notEquals(rhs: Vector3U): boolean {
    return Vector3U.notEquals(this, rhs);
  }
}

_Vector3F.setRealConstructor((...args: any[]) => new Vector3F(...(args as [])));
_Vector3I.setRealConstructor((...args: any[]) => new Vector3I(...(args as [])));
_Vector3U.setRealConstructor((...args: any[]) => new Vector3U(...(args as [])));
