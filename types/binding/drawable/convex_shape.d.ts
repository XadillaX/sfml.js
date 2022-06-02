declare module '*/binding.node' {
  export class ConvexShape extends Shape {
    constructor(pointCount: Uint32);

    setPointCount(count: Uint32): void;
    setPoint(index: Uint32, point: Vector2F): void;
  }
}
