import type { ReadonlyValue as R } from '../internal/value-storage';
import type { Vector2f } from '../system/vector2';
import { Shape, shapeCount, shapeNumber } from './shape';

/** 圆形的初始几何参数。 */
export interface CircleShapeOptions {
  /** 局部坐标中的半径，默认 0。 */
  radius?: number;
  /** 近似圆周的顶点数，默认 30。 */
  pointCount?: number;
}

/** sf::CircleShape geometry with Shape appearance and transformations. */
export class CircleShape extends Shape {
  /** 按半径和圆周顶点数创建圆形。 */
  constructor(options?: CircleShapeOptions);
  /** 复制圆形几何、外观和变换，保留纹理引用。 */
  constructor(source: R<CircleShape>);
  constructor(source: CircleShapeOptions | R<CircleShape> = {}) {
    if (source instanceof CircleShape) {
      super({ kind: 1, source });
    } else {
      if (!source || typeof source !== 'object' || source instanceof Shape) {
        throw new TypeError('Expected CircleShape options or a CircleShape');
      }
      const options = source as CircleShapeOptions;
      super({ kind: 1, x: shapeNumber(options.radius ?? 0),
        y: shapeCount(options.pointCount ?? 30) });
    }
  }

  /** 设置局部半径并更新几何。 */
  setRadius(this: CircleShape, radius: number): void {
    this.changeGeometry(2, shapeNumber(radius));
  }

  /** 返回局部半径。 */
  getRadius(): number {
    return this.shapeInfo.radius!;
  }

  /** 设置近似圆周的顶点数并更新几何。 */
  setPointCount(this: CircleShape, count: number): void {
    this.changeGeometry(4, shapeCount(count));
  }

  /** 返回圆周顶点数。 */
  getPointCount(): number {
    return this.shapeInfo.count;
  }

  /** 返回从零开始的圆周顶点局部坐标副本。 */
  getPoint(index: number): Vector2f {
    return this.readPoint(index);
  }
}
