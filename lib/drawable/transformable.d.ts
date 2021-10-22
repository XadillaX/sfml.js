import { PointType, Vector2F } from '../vector2';

export interface Transformable {
  setPosition(x: number, y: number): void;
  setPosition(pos: PointType<Vector2F>): void;
  getPosition(): Vector2F;

  setRotation(rotation: number): void;
  getRotation(): number;

  setScale(x: number, y: number): void;
  setScale(factor: PointType<Vector2F>): void;
  getScale(): Vector2F;

  setOrigin(x: number, y: number): void;
  setOrigin(origin: PointType<Vector2F>): void;
  getOrigin(): Vector2F;

  move(x: number, y: number): void;
  move(offset: PointType<Vector2F>): void;

  scale(x: number, y: number): void;
  scale(offset: PointType<Vector2F>): void;

  rotate(angle: number): void;
}

export function setTransformable(proto: any): void;
