import type { ReadonlyValue as R } from '../internal/value-storage';
import type { Vector2f } from '../system/vector2';
import { Shape, shapeCount, shapeNumber } from './shape';

/**
 * Initial circle geometry parameters.
 * @zh 圆形的初始几何参数。
 * @ja 円の初期ジオメトリパラメーター。
 * @ko 원의 초기 기하 매개변수입니다.
 */
export interface CircleShapeOptions {
  /**
   * Radius in local coordinates; defaults to 0.
   * @zh 局部坐标中的半径，默认 0。
   * @ja ローカル座標での半径。既定値は 0。
   * @ko 로컬 좌표계의 반지름입니다. 기본값은 0입니다.
   */
  radius?: number;
  /**
   * Number of points approximating the circumference; defaults to 30.
   * @zh 近似圆周的顶点数，默认 30。
   * @ja 円周を近似する頂点数。既定値は 30。
   * @ko 원주를 근사하는 꼭짓점 수입니다. 기본값은 30입니다.
   */
  pointCount?: number;
}

/**
 * sf::CircleShape geometry with Shape appearance and transformations.
 * @zh 具有 Shape 外观和变换的 sf::CircleShape 几何。
 * @ja Shape の外観と変換を備えた sf::CircleShape のジオメトリ。
 * @ko Shape의 외형과 변환을 갖는 sf::CircleShape 기하 구조입니다.
 */
export class CircleShape extends Shape {
  /**
   * Creates a circle from a radius and circumference point count.
   * @zh 按半径和圆周顶点数创建圆形。
   * @ja 半径と円周頂点数から円を作成します。
   * @ko 반지름과 원주 꼭짓점 수로 원을 만듭니다.
   */
  constructor(options?: CircleShapeOptions);
  /**
   * Copies circle geometry, appearance and transforms, retaining the texture
   * reference.
   * @zh 复制圆形几何、外观和变换，保留纹理引用。
   * @ja 円のジオメトリ、外観、変換をコピーし、テクスチャ参照を保持します。
   * @ko 원의 기하 구조, 외형 및 변환을 복사하고 텍스처 참조를 유지합니다.
   */
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

  /**
   * Sets the local radius and updates geometry.
   * @zh 设置局部半径并更新几何。
   * @ja ローカル半径を設定し、ジオメトリを更新します。
   * @ko 로컬 반지름을 설정하고 기하 구조를 갱신합니다.
   */
  setRadius(this: CircleShape, radius: number): void {
    this.changeGeometry(2, shapeNumber(radius));
  }

  /**
   * Returns the local radius.
   * @zh 返回局部半径。
   * @ja ローカル半径を返します。
   * @ko 로컬 반지름을 반환합니다.
   */
  getRadius(): number {
    return this.shapeInfo.radius!;
  }

  /**
   * Sets the point count approximating the circumference and updates geometry.
   * @zh 设置近似圆周的顶点数并更新几何。
   * @ja 円周を近似する頂点数を設定し、ジオメトリを更新します。
   * @ko 원주를 근사하는 꼭짓점 수를 설정하고 기하 구조를 갱신합니다.
   */
  setPointCount(this: CircleShape, count: number): void {
    this.changeGeometry(4, shapeCount(count));
  }

  /**
   * Returns the circumference point count.
   * @zh 返回圆周顶点数。
   * @ja 円周の頂点数を返します。
   * @ko 원주 꼭짓점 수를 반환합니다.
   */
  getPointCount(): number {
    return this.shapeInfo.count;
  }

  /**
   * Returns a copy of the local coordinates of a zero-based circumference
   * point.
   * @zh 返回从零开始的圆周顶点局部坐标副本。
   * @ja 0 始まりの円周頂点のローカル座標のコピーを返します。
   * @ko 0부터 시작하는 원주 꼭짓점의 로컬 좌표 복사본을 반환합니다.
   */
  getPoint(index: number): Vector2f {
    return this.readPoint(index);
  }
}
