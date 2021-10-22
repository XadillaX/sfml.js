import * as Shape from './shape';
import { PointType, Vector2F } from '../vector2';

declare class RectangleShape extends Shape {
  constructor(size: PointType<Vector2F>);
}

export = RectangleShape;
