import * as BaseDrawable from './base';
import * as Color from '../color';
import { FloatRect } from '../rect';

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
}
