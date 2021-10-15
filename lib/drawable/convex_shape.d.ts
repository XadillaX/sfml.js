import * as Shape from './shape';
import { Vector2F } from '../vector2';

export = class CircleShape extends Shape {
  constructor(pointCount?: number);
  setPoint(idx: number, point: Vector2F): void;
}
