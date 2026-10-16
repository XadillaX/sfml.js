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
  /** textureRect 的延迟 IntRect 视图缓存。 */
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

  /** 设置并保留纹理引用；null 禁用纹理，resetRect 为 true 时覆盖整个纹理。 */
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

  /** 返回当前纹理引用；未设置时为 null。 */
  getTexture(): ReadonlyTexture | null {
    return this[shapeState].texture;
  }

  /** 复制要使用的纹理像素区域，负尺寸可翻转纹理。 */
  setTextureRect(this: ShapeResource, rectangle: R<IntRect>): void {
    if (!(rectangle instanceof IntRect)) throw new TypeError('Expected an IntRect');
    this[shapeState].rectangle.set(rectangle[rectStorage]);
  }

  /** 返回当前纹理像素区域的只读类型视图。 */
  getTextureRect(): R<IntRect> {
    if (!this.rectangleView) {
      const handle = this[graphicsNative];
      this.rectangleView = intRectFromState(new LazyValue(
        this[shapeState].rectangle, () => native.shapeTextureRect(handle),
      ));
    }
    return this.rectangleView;
  }

  /** 设置填充颜色，绘制时与纹理颜色相乘。 */
  setFillColor(this: ShapeResource, color: R<Color>): void {
    if (!(color instanceof Color)) throw new TypeError('Expected a Color');
    this[shapeState].words[1] = color.toInteger();
  }

  /** 返回填充颜色的独立副本。 */
  getFillColor(): Color {
    return new Color(this[shapeState].words[1]);
  }

  /** 复制轮廓颜色。 */
  setOutlineColor(this: ShapeResource, color: R<Color>): void {
    if (!(color instanceof Color)) throw new TypeError('Expected a Color');
    this[shapeState].words[2] = color.toInteger();
  }

  /** 返回轮廓颜色的独立副本。 */
  getOutlineColor(): Color {
    return new Color(this[shapeState].words[2]);
  }

  /** 设置局部坐标中的轮廓厚度；正值向外扩展，负值向内扩展。 */
  setOutlineThickness(this: ShapeResource, thickness: number): void {
    this.changeGeometry(0, shapeNumber(thickness));
  }

  /** 返回轮廓厚度。 */
  getOutlineThickness(): number {
    return this.shapeInfo.thickness;
  }

  /** 设置轮廓尖角延伸与厚度的最大比例，必须至少为 1。 */
  setMiterLimit(this: ShapeResource, limit: number): void {
    limit = shapeNumber(limit);
    if (limit < 1) throw new RangeError('Miter limit must be at least 1');
    this.changeGeometry(1, limit);
  }

  /** 返回轮廓尖角延伸限制。 */
  getMiterLimit(): number {
    return this.shapeInfo.miterLimit;
  }

  /** 返回形状在局部坐标中的几何中心。 */
  getGeometricCenter(): Vector2f {
    return new Vector2f(...native.getShapeCenter(this[graphicsNative]));
  }

  /** 返回包含轮廓的局部轴对齐包围框。 */
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

/** Custom shapes publish a convex point outline by calling update(). */
export abstract class Shape extends withTransformable(ShapeResource) {
  /** 创建自定义凸形状；子类提供顶点并调用 update()。 */
  protected constructor(init: ShapeInit = { kind: 0 }) {
    super(init);
  }

  /** 返回轮廓顶点数。 */
  abstract getPointCount(): number;
  /** 返回从零开始的轮廓顶点的局部坐标。 */
  abstract getPoint(index: number): Vector2f;

  /** 返回应用位置、旋转和缩放后的轴对齐包围框。 */
  getGlobalBounds(): FloatRect {
    return this.getTransform().transformRect(this.getLocalBounds());
  }

  /** 从子类的 getPointCount/getPoint 重建原生几何；修改自定义顶点后调用。 */
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
