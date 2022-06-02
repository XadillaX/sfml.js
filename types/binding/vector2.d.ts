declare module '*/binding.node' {
  class Vector2<T> {
    get x(): T;
    set x(x: T): void;
    get y(): T;
    set y(y: T): void;

    constructor();
    constructor(vec: Vector2<T>);
    constructor(x: T, y: T);

    static subtract(lhs: any, rhs: any): any;
    static add(lhs: any, rhs: any): any;
    static multiply(lhs: any, rhs: T): any;
    static div(lhs: any, rhs: T): any;

    static equals(lhs: any, rhs: any): boolean;
    static notEquals(lhs: any, rhs: any): boolean;

    static setRealConstructor(cons: Function): void;
  }

  export class Vector2F extends Vector2<Float> {}
  export class Vector2I extends Vector2<Int32> {}
  export class Vector2U extends Vector2<Uint32> {}
}
