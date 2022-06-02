export class Vector3I {
  constructor(x: number, y: number, z: number);
  constructor(vec: Vector3I);

  x: number;
  y: number;

  static add(a: Vector3I, b: Vector3I): Vector3I;
  static subtract(a: Vector3I, b: Vector3I): Vector3I;
  static multiply(a: Vector3I, b: number): Vector3I;
  static div(a: Vector3I, b: number): Vector3I;

  static equals(a: Vector3I, b: Vector3I): boolean;
  static notEequals(a: Vector3I, b: Vector3I): boolean;
}

export class Vector3U {
  constructor(x: number, y: number, z: number);
  constructor(vec: Vector3U);

  x: number;
  y: number;

  static add(a: Vector3U, b: Vector3U): Vector3U;
  static subtract(a: Vector3U, b: Vector3U): Vector3U;
  static multiply(a: Vector3U, b: number): Vector3U;
  static div(a: Vector3U, b: number): Vector3U;

  static equals(a: Vector3U, b: Vector3U): boolean;
  static notEequals(a: Vector3U, b: Vector3U): boolean;
}

export class Vector3F {
  constructor(x: number, y: number, z: number);
  constructor(vec: Vector3F);

  x: number;
  y: number;

  static add(a: Vector3F, b: Vector3F): Vector3F;
  static subtract(a: Vector3F, b: Vector3F): Vector3F;
  static multiply(a: Vector3F, b: number): Vector3F;
  static div(a: Vector3F, b: number): Vector3F;

  static equals(a: Vector3F, b: Vector3F): boolean;
  static notEequals(a: Vector3F, b: Vector3F): boolean;
}
