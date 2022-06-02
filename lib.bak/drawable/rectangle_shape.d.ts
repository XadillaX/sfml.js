import { Shape } from './shape';
import { PointType, Vector2F } from '../vector2';

export class RectangleShape extends Shape {
  constructor(size: PointType<Vector2F>);

  setSize(size: PointType<Vector2F>): void;
  getSize(): Vector2F;
}
