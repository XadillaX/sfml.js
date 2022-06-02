declare module '*/binding.node' {
  interface TransformablePlugin {
    setPosition(vec: Vector2F): void;
    setPosition(x: Float, y: Float): void;
    getPosition(): Vector2F;

    setScale(vec: Vector2F): void;
    setScale(x: Float, y: Float): void;
    getScale(): Vector2F;

    setOrigin(vec: Vector2F): void;
    setOrigin(x: Float, y: Float): void;
    getOrigin(): Vector2F;

    setRotation(rotation: number): void;
    getRotation(): number;

    move(vec: Vector2F): void;
    move(x: Float, y: Float): void;

    scale(vec: Vector2F): void;
    scale(x: Float, y: Float): void;

    rotate(angle: Float): void;
  }
}
