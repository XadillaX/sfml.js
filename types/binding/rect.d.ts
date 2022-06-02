declare module '*/binding.node' {
  class Rect<V extends Vector2<T>, T> {
    set top(value: T);
    get top(): T;
    set left(value: T);
    get left(): T;
    set width(value: T);
    get width(): T;
    set height(value: T);
    get height(): T;

    constructor();
    constructor(pos: V, size: V);
    constructor(left: T, top: T, width: T, height: T);

    contains(vec: V): boolean;
    contains(x: T, y: T): boolean;

    intersects(rect: Rect<V, T>): Rect<V, T> | false;

    static setRealConstructor(cons: Function);
  }

  export class IntRect extends Rect<Vector2I, Int32> {}
  export class FloatRect extends Rect<Vector2F, Float> {}
}
