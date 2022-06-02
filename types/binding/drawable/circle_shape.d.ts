declare module '*/binding.node' {
  export class CircleShape extends Shape {
    constructor(radius?: number, pointCount?: Uint32);
    setPointCount(count: Uint32): void;
  }
}
