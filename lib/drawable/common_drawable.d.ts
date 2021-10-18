import * as BaseDrawable from './base';
import * as Color from '../color';
import { FloatRect } from '../rect';
import { PointType, Vector2F } from '../vector2';

export = class CommonDrawable extends BaseDrawable {
  setFillColor(color: number | Color): void;
  getFillColor(): Color;

  setOutlineColor(color: number | Color): void;
  getOutlineColor(): Color;

  setOutlineThickness(thickness: number): void;
  getOutlineThickness(): number;

  getLocalBounds(): FloatRect;
  getGlobalBounds(): FloatRect;

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
}
