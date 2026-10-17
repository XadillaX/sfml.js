import {
  native, type NativeGraphicsHandle, type NativeShapeInfo,
} from '../internal/native';
import {
  dispatchDrawable, flushShapeReaders, graphicsContext, graphicsNative,
  recordShape, shapeState, textureId, type ShapeData,
} from '../internal/graphics-state';
import {
  withTransformable, transformableState, type TransformableState,
} from '../internal/transformable';
import {
  mutableValue, rectStorage, type ReadonlyValue as R,
} from '../internal/value-storage';
import { LazyValue } from '../internal/lazy-value';
import { nativeStruct } from '../internal/struct-view';
import { Vector2, Vector2f } from '../system/vector2';
import { Color } from './color';
import { Drawable } from './drawable';
import { FloatRect, IntRect, intRectFromState } from './rect';
import type { RenderStates } from './render-states';
import type { RenderTarget } from './render-target';
import { Texture, type ReadonlyTexture } from './texture';

interface ShapeInit {
  kind: 0 | 1 | 2 | 3;
  x?: number;
  y?: number;
  source?: R<Shape>;
}

export function shapeNumber(value: number): number {
  if (typeof value !== 'number') throw new TypeError('Expected a number');
  const result = Math.fround(value);
  if (!Number.isFinite(result)) {
    throw new RangeError('Expected a finite float32 value');
  }
  return result;
}

export function shapeCount(value: number): number {
  if (!Number.isInteger(value) || value < 0 ||
      value > Math.floor(0x7fffffff / (6 * 20)) - 2) {
    throw new RangeError('Shape point count exceeds the buffer limit');
  }
  return value;
}

export function shapeVector(value: R<Vector2f>): [number, number] {
  if (!(value instanceof Vector2) || value.scalarType !== 'f32') {
    throw new TypeError('Expected a Vector2f');
  }
  return [ shapeNumber(value.x), shapeNumber(value.y) ];
}

class ShapeResource extends Drawable {
  readonly [mutableValue] = true;
  readonly [graphicsNative]: NativeGraphicsHandle<'shape'>;
  readonly [shapeState]: ShapeData;
  readonly [transformableState]: TransformableState;
  protected readonly shapeInfo: Readonly<NativeShapeInfo>;
  /**
   * Lazy IntRect view cache for textureRect.
   * @zh textureRect 的延迟 IntRect 视图缓存。
   * @ja textureRect の遅延 IntRect ビューキャッシュ。
   * @ko textureRect의 지연 IntRect 뷰 캐시입니다.
   */
  private rectangleView?: R<IntRect>;

  constructor(init: ShapeInit) {
    super();
    const mapping = native.createShape(graphicsContext(), init.kind,
      init.x ?? 0, init.y ?? 0, init.source?.[graphicsNative]);
    this[graphicsNative] = mapping.handle;
    this[shapeState] = {
      id: mapping.id, words: new Uint32Array(mapping.appearance),
      rectangle: new Int32Array(mapping.appearance, 12, 4),
      texture: init.source?.[shapeState].texture ?? null,
    };
    this[transformableState] = {
      handle: mapping.transformable, values: new Float32Array(mapping.buffer),
    };
    this.shapeInfo = nativeStruct<NativeShapeInfo>(mapping.info);
  }

  /**
   * Sets and retains a texture reference; null disables texturing, and
   * resetRect true covers the entire texture.
   * @zh 设置并保留纹理引用；null 禁用纹理，resetRect 为 true 时覆盖整个纹理。
   * @ja テクスチャ参照を設定して保持します。null はテクスチャを無効にし、resetRect が true ならテクスチャ全体を使用します。
   * @ko 텍스처 참조를 설정하고 유지합니다. null은 텍스처를 비활성화하며 resetRect가 true이면 전체 텍스처를 사용합니다.
   */
  setTexture(
    this: ShapeResource, texture: ReadonlyTexture | null, resetRect = false,
  ): void {
    if (texture !== null && !(texture instanceof Texture)) {
      throw new TypeError('Expected a Texture or null');
    }
    if (typeof resetRect !== 'boolean') throw new TypeError('Expected a boolean');
    const state = this[shapeState];
    const reset = texture && (resetRect ||
      (!state.texture && state.rectangle.every(value => value === 0)));
    if (texture !== state.texture) {
      native.setShapeTexture(this[graphicsNative],
        texture?.[graphicsNative] ?? null, texture?.[textureId] ?? 0);
      state.texture = texture;
    }
    if (reset) {
      const size = texture.getSize();
      state.rectangle.set([ 0, 0, size.x, size.y ]);
    }
  }

  /**
   * Returns the current texture reference, or null if none is set.
   * @zh 返回当前纹理引用；未设置时为 null。
   * @ja 現在のテクスチャ参照を返します。未設定なら null です。
   * @ko 현재 텍스처 참조를 반환합니다. 설정되지 않았으면 null입니다.
   */
  getTexture(): ReadonlyTexture | null {
    return this[shapeState].texture;
  }

  /**
   * Copies the texture pixel region to use; negative sizes can flip the
   * texture.
   * @zh 复制要使用的纹理像素区域，负尺寸可翻转纹理。
   * @ja 使用するテクスチャのピクセル領域をコピーします。負のサイズでテクスチャを反転できます。
   * @ko 사용할 텍스처 픽셀 영역을 복사합니다. 음수 크기로 텍스처를 반전할 수 있습니다.
   */
  setTextureRect(this: ShapeResource, rectangle: R<IntRect>): void {
    if (!(rectangle instanceof IntRect)) throw new TypeError('Expected an IntRect');
    this[shapeState].rectangle.set(rectangle[rectStorage]);
  }

  /**
   * Returns a view typed as read-only of the current texture pixel region.
   * @zh 返回当前纹理像素区域的只读类型视图。
   * @ja 現在のテクスチャピクセル領域の、型上読み取り専用のビューを返します。
   * @ko 현재 텍스처 픽셀 영역의 형식상 읽기 전용 뷰를 반환합니다.
   */
  getTextureRect(): R<IntRect> {
    if (!this.rectangleView) {
      const handle = this[graphicsNative];
      this.rectangleView = intRectFromState(new LazyValue(
        this[shapeState].rectangle, () => native.shapeTextureRect(handle),
      ));
    }
    return this.rectangleView;
  }

  /**
   * Sets the fill color, multiplied by the texture color when drawing.
   * @zh 设置填充颜色，绘制时与纹理颜色相乘。
   * @ja 塗りつぶし色を設定します。描画時にテクスチャ色と乗算されます。
   * @ko 채우기 색상을 설정합니다. 그릴 때 텍스처 색상과 곱해집니다.
   */
  setFillColor(this: ShapeResource, color: R<Color>): void {
    if (!(color instanceof Color)) throw new TypeError('Expected a Color');
    this[shapeState].words[1] = color.toInteger();
  }

  /**
   * Returns an independent copy of the fill color.
   * @zh 返回填充颜色的独立副本。
   * @ja 塗りつぶし色の独立したコピーを返します。
   * @ko 채우기 색상의 독립적인 복사본을 반환합니다.
   */
  getFillColor(): Color {
    return new Color(this[shapeState].words[1]);
  }

  /**
   * Copies the outline color.
   * @zh 复制轮廓颜色。
   * @ja 輪郭色をコピーします。
   * @ko 윤곽선 색상을 복사합니다.
   */
  setOutlineColor(this: ShapeResource, color: R<Color>): void {
    if (!(color instanceof Color)) throw new TypeError('Expected a Color');
    this[shapeState].words[2] = color.toInteger();
  }

  /**
   * Returns an independent copy of the outline color.
   * @zh 返回轮廓颜色的独立副本。
   * @ja 輪郭色の独立したコピーを返します。
   * @ko 윤곽선 색상의 독립적인 복사본을 반환합니다.
   */
  getOutlineColor(): Color {
    return new Color(this[shapeState].words[2]);
  }

  /**
   * Sets outline thickness in local coordinates; positive values extend outward
   * and negative values inward.
   * @zh 设置局部坐标中的轮廓厚度；正值向外扩展，负值向内扩展。
   * @ja ローカル座標で輪郭の太さを設定します。正の値は外側へ、負の値は内側へ広がります。
   * @ko 로컬 좌표계의 윤곽선 두께를 설정합니다. 양수는 바깥쪽으로, 음수는 안쪽으로 확장합니다.
   */
  setOutlineThickness(this: ShapeResource, thickness: number): void {
    this.changeGeometry(0, shapeNumber(thickness));
  }

  /**
   * Returns the outline thickness.
   * @zh 返回轮廓厚度。
   * @ja 輪郭の太さを返します。
   * @ko 윤곽선 두께를 반환합니다.
   */
  getOutlineThickness(): number {
    return this.shapeInfo.thickness;
  }

  /**
   * Sets the maximum ratio of outline miter extension to thickness; must be at
   * least 1.
   * @zh 设置轮廓尖角延伸与厚度的最大比例，必须至少为 1。
   * @ja 輪郭のマイター延伸と太さの最大比率を設定します。1 以上である必要があります。
   * @ko 윤곽선 마이터 연장 길이와 두께의 최대 비율을 설정합니다. 1 이상이어야 합니다.
   */
  setMiterLimit(this: ShapeResource, limit: number): void {
    limit = shapeNumber(limit);
    if (limit < 1) throw new RangeError('Miter limit must be at least 1');
    this.changeGeometry(1, limit);
  }

  /**
   * Returns the outline miter limit.
   * @zh 返回轮廓尖角延伸限制。
   * @ja 輪郭のマイター制限を返します。
   * @ko 윤곽선 마이터 제한을 반환합니다.
   */
  getMiterLimit(): number {
    return this.shapeInfo.miterLimit;
  }

  /**
   * Returns the shape's geometric center in local coordinates.
   * @zh 返回形状在局部坐标中的几何中心。
   * @ja 形状の幾何学的中心をローカル座標で返します。
   * @ko 도형의 기하학적 중심을 로컬 좌표로 반환합니다.
   */
  getGeometricCenter(): Vector2f {
    return new Vector2f(...native.getShapeCenter(this[graphicsNative]));
  }

  /**
   * Returns local axis-aligned bounds including the outline.
   * @zh 返回包含轮廓的局部轴对齐包围框。
   * @ja 輪郭を含むローカル座標の軸平行境界矩形を返します。
   * @ko 윤곽선을 포함하는 로컬 축 정렬 경계 상자를 반환합니다.
   */
  getLocalBounds(): FloatRect {
    const { left, top, boundsWidth, boundsHeight } = this.shapeInfo;
    return new FloatRect(new Vector2f(left, top),
      new Vector2f(boundsWidth, boundsHeight));
  }

  protected changeGeometry(
    operation: number, x: number, y?: number, z?: number,
  ): void {
    flushShapeReaders(this);
    native.changeShapeGeometry(
      this[graphicsNative], operation, x, y, z);
  }

  protected readPoint(index: number): Vector2f {
    return new Vector2f(...native.getShapePoint(this[graphicsNative], index));
  }

  protected draw(this: Shape, target: RenderTarget, states: RenderStates): void {
    target[recordShape](this, states);
  }

  [dispatchDrawable](
    this: Shape, target: RenderTarget, states: RenderStates,
  ): void {
    if (this.draw === ShapeResource.prototype.draw) this.draw(target, states);
    else super[dispatchDrawable](target, states);
  }
}

/**
 * Custom shapes publish a convex point outline by calling update().
 * @zh 自定义形状通过调用 update() 发布凸顶点轮廓。
 * @ja カスタム形状は update() を呼び出して凸な頂点輪郭を公開します。
 * @ko 사용자 정의 도형은 update()를 호출하여 볼록한 꼭짓점 윤곽을 반영합니다.
 */
export abstract class Shape extends withTransformable(ShapeResource) {
  /**
   * Creates a custom convex shape; subclasses provide points and call update().
   * @zh 创建自定义凸形状；子类提供顶点并调用 update()。
   * @ja カスタム凸形状を作成します。サブクラスが頂点を提供し、update() を呼び出します。
   * @ko 사용자 정의 볼록 도형을 만듭니다. 하위 클래스가 꼭짓점을 제공하고 update()를 호출합니다.
   */
  protected constructor(init: ShapeInit = { kind: 0 }) {
    super(init);
  }

  /**
   * Returns the outline point count.
   * @zh 返回轮廓顶点数。
   * @ja 輪郭の頂点数を返します。
   * @ko 윤곽 꼭짓점 수를 반환합니다.
   */
  abstract getPointCount(): number;
  /**
   * Returns local coordinates of a zero-based outline point.
   * @zh 返回从零开始的轮廓顶点的局部坐标。
   * @ja 0 始まりの輪郭頂点のローカル座標を返します。
   * @ko 0부터 시작하는 윤곽 꼭짓점의 로컬 좌표를 반환합니다.
   */
  abstract getPoint(index: number): Vector2f;

  /**
   * Returns axis-aligned bounds after applying position, rotation and scale.
   * @zh 返回应用位置、旋转和缩放后的轴对齐包围框。
   * @ja 位置、回転、拡大縮小を適用した軸平行境界矩形を返します。
   * @ko 위치, 회전 및 배율을 적용한 축 정렬 경계 상자를 반환합니다.
   */
  getGlobalBounds(): FloatRect {
    return this.getTransform().transformRect(this.getLocalBounds());
  }

  /**
   * Rebuilds native geometry from the subclass's getPointCount/getPoint; call
   * after changing custom points.
   * @zh 从子类的 getPointCount/getPoint 重建原生几何；修改自定义顶点后调用。
   * @ja サブクラスの getPointCount/getPoint からネイティブジオメトリを再構築します。カスタム頂点を変更した後に呼び出してくださ
   * い。
   * @ko 하위 클래스의 getPointCount/getPoint로 네이티브 기하 구조를 다시 만듭니다. 사용자 정의 꼭짓점을 변경한 후
   * 호출해야 합니다.
   */
  protected update(this: Shape): void {
    const count = shapeCount(this.getPointCount());
    const points = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      points.set(shapeVector(this.getPoint(i)), i * 2);
    }
    flushShapeReaders(this);
    native.updateShapePoints(this[graphicsNative], points);
  }
}
