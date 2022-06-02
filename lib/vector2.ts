import * as util from 'util';

import {
  Float,
  Int32,
  Uint32,

  Vector2F as _Vector2F,
  Vector2I as _Vector2I,
  Vector2U as _Vector2U,
} from './binding';
import {
  formatFloatValue,
  formatInt32Value,
  formatUint32Value,
  FormatValueFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
} from './utils/formatter';

function inspect<V extends(Vector2F | Vector2I | Vector2U)>(
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
): [] | [T, T] | [V] {
  if (args.length === 0) {
    return [];
  } else if (args.length === 1) {
    if (!(args[0] instanceof Vec)) {
      throw new Error('Invalid constructor arguments');
    }
    return [ args[0] as V ];
  } else if (args.length === 2) {
    args[0] = formatValue(args[0]);
    args[1] = formatValue(args[1]);
    return [ args[0] as T, args[1] as T ];
  }

  throw new Error('Invalid constructor arguments');
}

export interface TwoDemensionalPoint<T> {
  x: T;
  y: T;
}

function toJSON<T>(
  vec: Vector2F | Vector2I | Vector2U,
): TwoDemensionalPoint<T> {
  return { x: vec.x as unknown as T, y: vec.y as unknown as T };
}

export class Vector2F extends _Vector2F {
  static add(lhs: Vector2F, rhs: Vector2F): Vector2F {
    return _Vector2F.add(lhs, rhs);
  }

  static subtract(lhs: Vector2F, rhs: Vector2F): Vector2F {
    return _Vector2F.subtract(lhs, rhs);
  }

  static multiply(lhs: Vector2F, rhs: Float): Vector2F {
    return _Vector2F.multiply(lhs, rhs);
  }

  static div(lhs: Vector2F, rhs: Float): Vector2F {
    return _Vector2F.div(lhs, rhs);
  }

  static equals(lhs: Vector2F, rhs: Vector2F): boolean {
    return _Vector2F.equals(lhs, rhs);
  }

  static notEquals(lhs: Vector2F, rhs: Vector2F): boolean {
    return _Vector2F.notEquals(lhs, rhs);
  }

  constructor();
  constructor(another: Vector2F);
  constructor(x: Float, y: Float);
  constructor(...args: any[]) {
    const newArgs = processConstructorArgs<Float, Vector2F>(
      Vector2F,
      args,
      formatFloatValue,
    ) as [];
    super(...newArgs);
  }

  [util.inspect.custom](_: number, opts: util.InspectOptionsStylized) {
    return inspect('Vector2F', this, opts);
  }

  toJSON(): TwoDemensionalPoint<Float> {
    return toJSON<Float>(this) as TwoDemensionalPoint<Float>;
  }

  set x(x: Float) {
    super.x = formatFloatValue(x);
  }

  set y(y: Float) {
    super.y = formatFloatValue(y);
  }

  add(rhs: Vector2F): Vector2F {
    return Vector2F.add(this, rhs);
  }

  subtract(rhs: Vector2F): Vector2F {
    return Vector2F.subtract(this, rhs);
  }

  multiply(rhs: Float): Vector2F {
    return Vector2F.multiply(this, rhs);
  }

  div(rhs: Float): Vector2F {
    return Vector2F.div(this, rhs);
  }

  equals(rhs: Vector2F): boolean {
    return Vector2F.equals(this, rhs);
  }

  notEquals(rhs: Vector2F): boolean {
    return Vector2F.notEquals(this, rhs);
  }
}

export class Vector2I extends _Vector2I {
  static add(lhs: Vector2I, rhs: Vector2I): Vector2I {
    return _Vector2I.add(lhs, rhs);
  }

  static subtract(lhs: Vector2I, rhs: Vector2I): Vector2I {
    return _Vector2I.subtract(lhs, rhs);
  }

  static multiply(lhs: Vector2I, rhs: Int32): Vector2I {
    return _Vector2I.multiply(lhs, rhs);
  }

  static div(lhs: Vector2I, rhs: Int32): Vector2I {
    return _Vector2I.div(lhs, rhs);
  }

  static equals(lhs: Vector2I, rhs: Vector2I): boolean {
    return _Vector2I.equals(lhs, rhs);
  }

  static notEquals(lhs: Vector2I, rhs: Vector2I): boolean {
    return _Vector2I.notEquals(lhs, rhs);
  }

  constructor();
  constructor(another: Vector2F);
  constructor(x: Int32, y: Int32);
  constructor(...args: any[]) {
    const newArgs = processConstructorArgs<Int32, Vector2I>(
      Vector2I,
      args,
      formatInt32Value,
    ) as [];
    super(...newArgs);
  }

  [util.inspect.custom](_: number, opts: util.InspectOptionsStylized) {
    return inspect('Vector2I', this, opts);
  }

  toJSON(): TwoDemensionalPoint<Int32> {
    return toJSON<Int32>(this) as TwoDemensionalPoint<Int32>;
  }

  set x(x: Int32) {
    super.x = formatInt32Value(x);
  }

  set y(y: Int32) {
    super.y = formatInt32Value(y);
  }

  add(rhs: Vector2I): Vector2I {
    return Vector2I.add(this, rhs);
  }

  subtract(rhs: Vector2I): Vector2I {
    return Vector2I.subtract(this, rhs);
  }

  multiply(rhs: Int32): Vector2I {
    return Vector2I.multiply(this, rhs);
  }

  div(rhs: Int32): Vector2I {
    return Vector2I.div(this, rhs);
  }

  equals(rhs: Vector2I): boolean {
    return Vector2I.equals(this, rhs);
  }

  notEquals(rhs: Vector2I): boolean {
    return Vector2I.notEquals(this, rhs);
  }
}

export class Vector2U extends _Vector2U {
  static add(lhs: Vector2U, rhs: Vector2U): Vector2U {
    return _Vector2U.add(lhs, rhs);
  }

  static subtract(lhs: Vector2U, rhs: Vector2U): Vector2U {
    return _Vector2U.subtract(lhs, rhs);
  }

  static multiply(lhs: Vector2U, rhs: Uint32): Vector2U {
    return _Vector2U.multiply(lhs, rhs);
  }

  static div(lhs: Vector2U, rhs: Uint32): Vector2U {
    return _Vector2U.div(lhs, rhs);
  }

  static equals(lhs: Vector2U, rhs: Vector2U): boolean {
    return _Vector2U.equals(lhs, rhs);
  }

  static notEquals(lhs: Vector2U, rhs: Vector2U): boolean {
    return _Vector2U.notEquals(lhs, rhs);
  }

  constructor();
  constructor(another: Vector2F);
  constructor(x: Uint32, y: Uint32);
  constructor(...args: any[]) {
    const newArgs = processConstructorArgs<Uint32, Vector2U>(
      Vector2U,
      args,
      formatUint32Value,
    ) as [];
    super(...newArgs);
  }

  [util.inspect.custom](_: number, opts: util.InspectOptionsStylized) {
    return inspect('Vector2U', this, opts);
  }

  toJSON(): TwoDemensionalPoint<Uint32> {
    return toJSON<Uint32>(this) as TwoDemensionalPoint<Uint32>;
  }

  set x(x: Uint32) {
    super.x = formatUint32Value(x);
  }

  set y(y: Uint32) {
    super.y = formatUint32Value(y);
  }

  add(rhs: Vector2U): Vector2U {
    return Vector2U.add(this, rhs);
  }

  subtract(rhs: Vector2U): Vector2U {
    return Vector2U.subtract(this, rhs);
  }

  multiply(rhs: Uint32): Vector2U {
    return Vector2U.multiply(this, rhs);
  }

  div(rhs: Uint32): Vector2U {
    return Vector2U.div(this, rhs);
  }

  equals(rhs: Vector2U): boolean {
    return Vector2U.equals(this, rhs);
  }

  notEquals(rhs: Vector2U): boolean {
    return Vector2U.notEquals(this, rhs);
  }
}

_Vector2F.setRealConstructor((...args: any[]) => new Vector2F(...(args as [])));
_Vector2I.setRealConstructor((...args: any[]) => new Vector2I(...(args as [])));
_Vector2U.setRealConstructor((...args: any[]) => new Vector2U(...(args as [])));

export type Vector2FType = Vector2F | TwoDemensionalPoint<Float>;
export type Vector2IType = Vector2I | TwoDemensionalPoint<Int32>;
export type Vector2UType = Vector2U | TwoDemensionalPoint<Uint32>;
