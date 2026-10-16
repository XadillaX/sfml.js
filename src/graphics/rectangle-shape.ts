import type { ReadonlyValue as R } from '../internal/value-storage';
import { Vector2f } from '../system/vector2';
import { Shape, shapeVector } from './shape';

/** sf::RectangleShape geometry with Shape appearance and transformations. */
export class RectangleShape extends Shape {
  /** 创建指定局部尺寸的矩形，默认尺寸为零。 */
  constructor(size?: R<Vector2f>);
  /** 复制矩形几何、外观和变换，保留纹理引用。 */
  constructor(source: R<RectangleShape>);
  constructor(source: R<Vector2f> | R<RectangleShape> = new Vector2f()) {
    if (source instanceof RectangleShape) {
      super({ kind: 2, source });
    } else {
      const [ x, y ] = shapeVector(source as R<Vector2f>);
      super({ kind: 2, x, y });
    }
  }

  /** 设置矩形局部宽度和高度并更新几何。 */
  setSize(this: RectangleShape, size: R<Vector2f>): void {
    this.changeGeometry(3, ...shapeVector(size));
  }

  /** 返回局部尺寸的独立副本。 */
  getSize(): Vector2f {
    return new Vector2f(this.shapeInfo.width!, this.shapeInfo.height!);
  }

  /** 返回矩形顶点数，恒为 4。 */
  getPointCount(): number {
    return 4;
  }

  /** 返回索引 0～3 的矩形顶点局部坐标副本。 */
  getPoint(index: number): Vector2f {
    return this.readPoint(index);
  }
}
