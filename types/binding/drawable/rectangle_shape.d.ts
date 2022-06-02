declare module '*/binding.node' {
  export class RectangleShape extends Shape {
    constructor(size: Vector2F);
    setSize(size: Vector2F): void;
    getSize(): Vector2F;
  }
}
