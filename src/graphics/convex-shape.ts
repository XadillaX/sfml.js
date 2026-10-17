import type { ReadonlyValue as R } from '../internal/value-storage';
import type { Vector2f } from '../system/vector2';
import { Shape, shapeCount, shapeVector } from './shape';

/**
 * sf::ConvexShape; points must describe a convex polygon in winding order.
 * @zh sf::ConvexShape；顶点必须按轮廓绕序组成凸多边形。
 * @ja sf::ConvexShape。頂点は輪郭に沿った順序で凸多角形を構成する必要があります。
 * @ko sf::ConvexShape. 꼭짓점은 윤곽을 도는 순서로 볼록 다각형을 구성해야 합니다.
 */
export class ConvexShape extends Shape {
  /**
   * Creates a convex polygon with the specified point count, defaulting to
   * zero; use setPoint to define the outline.
   * @zh 创建指定顶点数的凸多边形，默认零个顶点；用 setPoint 设置轮廓。
   * @ja 指定頂点数の凸多角形を作成します。既定は 0 頂点です。setPoint で輪郭を設定します。
   * @ko 지정한 꼭짓점 수의 볼록 다각형을 만듭니다. 기본값은 0개이며 setPoint로 윤곽을 설정합니다.
   */
  constructor(pointCount?: number);
  /**
   * Copies convex polygon geometry, appearance and transforms, retaining the
   * texture reference.
   * @zh 复制凸多边形几何、外观和变换，保留纹理引用。
   * @ja 凸多角形のジオメトリ、外観、変換をコピーし、テクスチャ参照を保持します。
   * @ko 볼록 다각형의 기하 구조, 외형 및 변환을 복사하고 텍스처 참조를 유지합니다.
   */
  constructor(source: R<ConvexShape>);
  constructor(source: number | R<ConvexShape> = 0) {
    if (source instanceof ConvexShape) super({ kind: 3, source });
    else super({ kind: 3, x: shapeCount(source as number) });
  }

  /**
   * Sets the outline point count and updates geometry.
   * @zh 设置轮廓顶点数并更新几何。
   * @ja 輪郭の頂点数を設定し、ジオメトリを更新します。
   * @ko 윤곽 꼭짓점 수를 설정하고 기하 구조를 갱신합니다.
   */
  setPointCount(this: ConvexShape, count: number): void {
    this.changeGeometry(4, shapeCount(count));
  }

  /**
   * Returns the outline point count.
   * @zh 返回轮廓顶点数。
   * @ja 輪郭の頂点数を返します。
   * @ko 윤곽 꼭짓점 수를 반환합니다.
   */
  getPointCount(): number {
    return this.shapeInfo.count;
  }

  /**
   * Copies local point coordinates; indices start at zero and points must form
   * a convex polygon in outline order.
   * @zh 复制局部顶点坐标；索引从零开始，顶点必须按轮廓顺序组成凸多边形。
   * @ja ローカル頂点座標をコピーします。インデックスは 0 始まりで、頂点は輪郭順で凸多角形を構成する必要があります。
   * @ko 로컬 꼭짓점 좌표를 복사합니다. 인덱스는 0부터 시작하며 꼭짓점은 윤곽 순서로 볼록 다각형을 구성해야 합니다.
   */
  setPoint(this: ConvexShape, index: number, point: R<Vector2f>): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.getPointCount()) {
      throw new RangeError('Shape point index is out of bounds');
    }
    this.changeGeometry(5, index, ...shapeVector(point));
  }

  /**
   * Returns a copy of the specified point's local coordinates.
   * @zh 返回指定顶点的局部坐标副本。
   * @ja 指定頂点のローカル座標のコピーを返します。
   * @ko 지정한 꼭짓점의 로컬 좌표 복사본을 반환합니다.
   */
  getPoint(index: number): Vector2f {
    return this.readPoint(index);
  }
}
