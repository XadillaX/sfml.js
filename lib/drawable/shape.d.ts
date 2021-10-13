import * as BaseDrawable from './base';
import * as Color from '../color';
import { FloatRect } from '../rect';
import { PointType, Vector2F } from '../vector2';

export = class Shape extends BaseDrawable {
  setFillColor(color: number | Color): void;
  getFillColor(): Color;

  setOutlineColor(color: number | Color): void;
  getOutlineColor(): Color;

  setOutlineThickness(thickness: number): void;
  getOutlineThickness(): number;

  setPointCount(count: number): void;
  getPointCount(): number;

  getLocalBounds(): FloatRect;
  getGlobalBounds(): FloatRect;

  getPoint(idx: number): Vector2F;

  setPosition(x: number, y: number): void;
  setPosition(pos: PointType<Vector2F>): void;
  getPosition(): Vector2F;
}
