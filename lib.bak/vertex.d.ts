import { Vector2F, PointType } from './vector2';
import { Color } from './color';

export class Vertex {
  constructor();
  constructor(position: PointType<Vector2F>);
  constructor(position: PointType<Vector2F>, color: Color | number);
  constructor(position: PointType<Vector2F>, texCoords: PointType<Vector2F>);
  constructor(position: PointType<Vector2F>, color: Color | number, texCoords: PointType<Vector2F>);

  position: Vector2F;
  color: Color;
  texCoords: Vector2F;
}
