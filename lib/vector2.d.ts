export type PointType<Vector_T> = { x: number, y: number } | Vector_T;

export class Vector2I {
  constructor(x: number, y: number);
  constructor(vec: Vector2I);

  x: number;
  y: number;

  static add(a: Vector2I, b: Vector2I): Vector2I;
  static subtract(a: Vector2I, b: Vector2I): Vector2I;
  static multiply(a: Vector2I, b: number): Vector2I;
  static div(a: Vector2I, b: number): Vector2I;

  static equals(a: Vector2I, b: Vector2I): boolean;
  static notEequals(a: Vector2I, b: Vector2I): boolean;
}

export class Vector2U {
  constructor(x: number, y: number);
  constructor(vec: Vector2U);

  x: number;
  y: number;

  static add(a: Vector2U, b: Vector2U): Vector2U;
  static subtract(a: Vector2U, b: Vector2U): Vector2U;
  static multiply(a: Vector2U, b: number): Vector2U;
  static div(a: Vector2U, b: number): Vector2U;

  static equals(a: Vector2U, b: Vector2U): boolean;
  static notEequals(a: Vector2U, b: Vector2U): boolean;
}

export class Vector2F {
  constructor(x: number, y: number);
  constructor(vec: Vector2F);

  x: number;
  y: number;

  static add(a: Vector2F, b: Vector2F): Vector2F;
  static subtract(a: Vector2F, b: Vector2F): Vector2F;
  static multiply(a: Vector2F, b: number): Vector2F;
  static div(a: Vector2F, b: number): Vector2F;

  static equals(a: Vector2F, b: Vector2F): boolean;
  static notEequals(a: Vector2F, b: Vector2F): boolean;
}
