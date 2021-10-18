import * as CommonDrawable from './common_drawable';
import { Vector2F } from '../vector2';

export = class Shape extends CommonDrawable {
  setPointCount(count: number): void;
  getPointCount(): number;
  getPoint(idx: number): Vector2F;
}
