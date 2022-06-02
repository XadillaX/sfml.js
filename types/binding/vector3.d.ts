declare module '*/binding.node' {
  class Vector3<T> {
    get x(): T;
    set x(x: T): void;
    get y(): T;
    set y(y: T): void;
    get z(): T;
    set z(z: T): void;

    constructor();
    constructor(vec: Vector3<T>);
    constructor(x: T, y: T, z: T);

    static subtract(lhs: any, rhs: any): any;
    static add(lhs: any, rhs: any): any;
    static multiply(lhs: any, rhs: T): any;
    static div(lhs: any, rhs: T): any;

    static equals(lhs: any, rhs: any): boolean;
    static notEquals(lhs: any, rhs: any): boolean;

    static setRealConstructor(cons: Function): void;
  }

  export class Vector3F extends Vector3<Float> {}
  export class Vector3I extends Vector3<Int32> {}
  export class Vector3U extends Vector3<Uint32> {}
}
