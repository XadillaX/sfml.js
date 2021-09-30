import * as BaseDrawable from './base';
import * as Color from '../color';

export = class Shape extends BaseDrawable {
  setFillColor(color: number | Color): void;
  getFillColor(): Color;
}
