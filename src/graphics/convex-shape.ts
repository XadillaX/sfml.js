import type { ReadonlyValue as R } from '../internal/value-storage';
import type { Vector2f } from '../system/vector2';
import { Shape, shapeCount, shapeVector } from './shape';

/** sf::ConvexShape; points must describe a convex polygon in winding order. */
export class ConvexShape extends Shape {
  /** 创建指定顶点数的凸多边形，默认零个顶点；用 setPoint 设置轮廓。 */
  constructor(pointCount?: number);
  /** 复制凸多边形几何、外观和变换，保留纹理引用。 */
  constructor(source: R<ConvexShape>);
  constructor(source: number | R<ConvexShape> = 0) {
    if (source instanceof ConvexShape) super({ kind: 3, source });
    else super({ kind: 3, x: shapeCount(source as number) });
  }

  /** 设置轮廓顶点数并更新几何。 */
  setPointCount(this: ConvexShape, count: number): void {
    this.changeGeometry(4, shapeCount(count));
  }

  /** 返回轮廓顶点数。 */
  getPointCount(): number {
    return this.shapeInfo.count;
  }

  /** 复制局部顶点坐标；索引从零开始，顶点必须按轮廓顺序组成凸多边形。 */
  setPoint(this: ConvexShape, index: number, point: R<Vector2f>): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.getPointCount()) {
      throw new RangeError('Shape point index is out of bounds');
    }
    this.changeGeometry(5, index, ...shapeVector(point));
  }

  /** 返回指定顶点的局部坐标副本。 */
  getPoint(index: number): Vector2f {
    return this.readPoint(index);
  }
}
