import type { ReadonlyValue as R } from '../internal/value-storage';
import { Vector2f } from '../system/vector2';
import { Shape, shapeVector } from './shape';

/**
 * sf::RectangleShape geometry with Shape appearance and transformations.
 * @zh 具有 Shape 外观和变换的 sf::RectangleShape 几何。
 * @ja Shape の外観と変換を備えた sf::RectangleShape のジオメトリ。
 * @ko Shape의 외형과 변환을 갖는 sf::RectangleShape 기하 구조입니다.
 */
export class RectangleShape extends Shape {
  /**
   * Creates a rectangle of the specified local size, defaulting to zero size.
   * @zh 创建指定局部尺寸的矩形，默认尺寸为零。
   * @ja 指定ローカルサイズの矩形を作成します。既定サイズはゼロです。
   * @ko 지정한 로컬 크기의 사각형을 만듭니다. 기본 크기는 0입니다.
   */
  constructor(size?: R<Vector2f>);
  /**
   * Copies rectangle geometry, appearance and transforms, retaining the texture
   * reference.
   * @zh 复制矩形几何、外观和变换，保留纹理引用。
   * @ja 矩形のジオメトリ、外観、変換をコピーし、テクスチャ参照を保持します。
   * @ko 사각형의 기하 구조, 외형 및 변환을 복사하고 텍스처 참조를 유지합니다.
   */
  constructor(source: R<RectangleShape>);
  constructor(source: R<Vector2f> | R<RectangleShape> = new Vector2f()) {
    if (source instanceof RectangleShape) {
      super({ kind: 2, source });
    } else {
      const [ x, y ] = shapeVector(source as R<Vector2f>);
      super({ kind: 2, x, y });
    }
  }

  /**
   * Sets the rectangle's local width and height and updates geometry.
   * @zh 设置矩形局部宽度和高度并更新几何。
   * @ja 矩形のローカル幅と高さを設定し、ジオメトリを更新します。
   * @ko 사각형의 로컬 너비와 높이를 설정하고 기하 구조를 갱신합니다.
   */
  setSize(this: RectangleShape, size: R<Vector2f>): void {
    this.changeGeometry(3, ...shapeVector(size));
  }

  /**
   * Returns an independent copy of the local size.
   * @zh 返回局部尺寸的独立副本。
   * @ja ローカルサイズの独立したコピーを返します。
   * @ko 로컬 크기의 독립적인 복사본을 반환합니다.
   */
  getSize(): Vector2f {
    return new Vector2f(this.shapeInfo.width!, this.shapeInfo.height!);
  }

  /**
   * Returns the rectangle point count, always 4.
   * @zh 返回矩形顶点数，恒为 4。
   * @ja 矩形の頂点数を返します。常に 4 です。
   * @ko 사각형 꼭짓점 수를 반환하며 항상 4입니다.
   */
  getPointCount(): number {
    return 4;
  }

  /**
   * Returns a copy of the local coordinates of a rectangle point at index 0 to
   * 3.
   * @zh 返回索引 0～3 的矩形顶点局部坐标副本。
   * @ja インデックス 0～3 の矩形頂点のローカル座標のコピーを返します。
   * @ko 인덱스 0~3인 사각형 꼭짓점의 로컬 좌표 복사본을 반환합니다.
   */
  getPoint(index: number): Vector2f {
    return this.readPoint(index);
  }
}
