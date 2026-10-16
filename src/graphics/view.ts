import {
  mutableValue, rectStorage, transformStorage, type ReadonlyValue as R,
} from '../internal/value-storage';
import { Angle, radians } from '../system/angle';
import { Vector2, Vector2f } from '../system/vector2';
import { FloatRect } from './rect';
import { Transform } from './transform';

const f = Math.fround;

function vector(value: R<Vector2f>): void {
  if (!(value instanceof Vector2) || value.scalarType !== 'f32') {
    throw new TypeError('Expected a Vector2f');
  }
}

function rectangle(value: R<FloatRect>): void {
  if (!(value instanceof FloatRect)) throw new TypeError('Expected a FloatRect');
}

function constantRectangle(): R<FloatRect> {
  const result = new FloatRect(new Vector2f(), new Vector2f(1, 1));
  const data = result[rectStorage];
  const position = result.position;
  const size = result.size;
  Object.defineProperties(position, {
    x: { get: () => data[0] }, y: { get: () => data[1] },
  });
  Object.defineProperties(size, {
    x: { get: () => data[2] }, y: { get: () => data[3] },
  });
  Object.freeze(position);
  Object.freeze(size);
  Object.defineProperties(result, {
    position: { value: position }, size: { value: size },
  });
  return Object.freeze(result);
}

/** Internal value assignment keeps const references and cached members alive. */
export let copyView: (destination: R<View>, source: R<View>) => void;
/** Internal command encoding: center, size, radians, viewport, scissor. */
export let writeView: (
  source: R<View>, destination: Float32Array, offset: number,
) => void;

/** A value camera; mutation and projection math stay on the JS side. */
export class View {
  readonly [mutableValue] = true;
  private readonly state = {
    data: new Float32Array([ 500, 500, 1000, 1000, 0 ]),
    viewport: constantRectangle(),
    scissor: constantRectangle(),
    transform: Object.freeze(new Transform()) as R<Transform>,
    inverse: Object.freeze(new Transform()) as R<Transform>,
    transformDirty: true,
    inverseDirty: true,
  };

  static {
    copyView = (destination, source) => {
      if (!(source instanceof View) || !(destination instanceof View)) {
        throw new TypeError('Expected a View');
      }
      destination.state.data.set(source.state.data);
      destination.state.viewport[rectStorage].set(
        source.state.viewport[rectStorage]);
      destination.state.scissor[rectStorage].set(source.state.scissor[rectStorage]);
      destination.state.transformDirty = destination.state.inverseDirty = true;
    };
    writeView = (source, destination, offset) => {
      if (!(source instanceof View)) throw new TypeError('Expected a View');
      destination.set(source.state.data, offset);
      destination.set(source.state.viewport[rectStorage], offset + 5);
      destination.set(source.state.scissor[rectStorage], offset + 9);
    };
  }

  /** 创建中心为 (500, 500)、尺寸为 (1000, 1000)、覆盖整个目标的视图。 */
  constructor();
  /** 深复制视图参数。 */
  constructor(source: R<View>);
  /** 创建覆盖指定世界坐标矩形的视图。 */
  constructor(rectangle: R<FloatRect>);
  /** 从世界坐标中的中心和尺寸创建视图。 */
  constructor(center: R<Vector2f>, size: R<Vector2f>);
  constructor(source?: R<View> | R<FloatRect> | R<Vector2f>, size?: R<Vector2f>) {
    if (source instanceof View && size === undefined) copyView(this, source);
    else if (source instanceof FloatRect && size === undefined) {
      this.setCenter(source.getCenter());
      this.setSize(source.size);
    } else if (source !== undefined && size !== undefined) {
      this.setCenter(source as R<Vector2f>);
      this.setSize(size);
    } else if (source !== undefined || size !== undefined) {
      throw new TypeError('Expected a View, FloatRect, or center and size');
    }
  }

  /** 设置视图中心的世界坐标，复制 center 的值。 */
  setCenter(this: View, center: R<Vector2f>): void {
    this.checkWritable();
    vector(center);
    this.state.data[0] = center.x;
    this.state.data[1] = center.y;
    this.invalidate();
  }

  /** 返回视图中心的独立副本。 */
  getCenter(): Vector2f {
    return new Vector2f(this.state.data[0], this.state.data[1]);
  }

  /** 设置视图覆盖的世界坐标宽度和高度。 */
  setSize(this: View, size: R<Vector2f>): void {
    this.checkWritable();
    vector(size);
    this.state.data[2] = size.x;
    this.state.data[3] = size.y;
    this.invalidate();
  }

  /** 返回视图覆盖尺寸的独立副本。 */
  getSize(): Vector2f {
    return new Vector2f(this.state.data[2], this.state.data[3]);
  }

  /** 设置视图旋转角度，归一化到 [0°, 360°)。 */
  setRotation(this: View, angle: R<Angle>): void {
    this.checkWritable();
    if (!(angle instanceof Angle)) throw new TypeError('Expected an Angle');
    this.state.data[4] = angle.wrapUnsigned().asRadians();
    this.invalidate();
  }

  /** 返回旋转角度副本。 */
  getRotation(): Angle {
    return radians(this.state.data[4]);
  }

  /** 设置视口矩形，坐标和尺寸以渲染目标宽高的比例表示。 */
  setViewport(this: View, viewport: R<FloatRect>): void {
    this.checkWritable();
    rectangle(viewport);
    this.state.viewport[rectStorage].set(viewport[rectStorage]);
  }

  /** 返回归一化视口矩形的只读引用，随 setViewport 更新。 */
  getViewport(): R<FloatRect> {
    return this.state.viewport;
  }

  /** 设置归一化裁剪矩形；整个矩形必须位于 [0, 1] 范围。 */
  setScissor(this: View, scissor: R<FloatRect>): void {
    this.checkWritable();
    rectangle(scissor);
    const [ x, y, width, height ] = scissor[rectStorage];
    if (!(x >= 0 && y >= 0 && x <= 1 && y <= 1 &&
        width >= 0 && height >= 0 &&
        f(x + width) <= 1 && f(y + height) <= 1)) {
      throw new RangeError('Scissor rectangle must lie within [0, 1]');
    }
    this.state.scissor[rectStorage].set(scissor[rectStorage]);
  }

  /** 返回归一化裁剪矩形的只读引用，随 setScissor 更新。 */
  getScissor(): R<FloatRect> {
    return this.state.scissor;
  }

  /** 将世界坐标偏移量累加到视图中心。 */
  move(this: View, offset: R<Vector2f>): void {
    this.checkWritable();
    vector(offset);
    this.state.data[0] += offset.x;
    this.state.data[1] += offset.y;
    this.invalidate();
  }

  /** 在当前视图角度上累加 angle。 */
  rotate(this: View, angle: R<Angle>): void {
    if (!(angle instanceof Angle)) throw new TypeError('Expected an Angle');
    this.setRotation(radians(f(this.state.data[4] + angle.asRadians())));
  }

  /** 将视图覆盖尺寸乘以 factor；小于 1 时放大画面，大于 1 时缩小。 */
  zoom(this: View, factor: number): void {
    this.checkWritable();
    if (typeof factor !== 'number') throw new TypeError('Expected a number');
    const value = f(factor);
    this.state.data[2] *= value;
    this.state.data[3] *= value;
    this.invalidate();
  }

  /** 返回世界坐标到标准化设备坐标的只读变换缓存。 */
  getTransform(): R<Transform> {
    const state = this.state;
    if (state.transformDirty) {
      const [ x, y, width, height, angle ] = state.data;
      const cosine = f(Math.cos(angle));
      const sine = f(Math.sin(angle));
      const tx = f(f(f(-x * cosine) - f(y * sine)) + x);
      const ty = f(f(f(x * sine) - f(y * cosine)) + y);
      const a = f(2 / width);
      const b = f(-2 / height);
      const matrix = state.transform[transformStorage];
      matrix[0] = f(a * cosine);
      matrix[4] = f(a * sine);
      matrix[12] = f(f(a * tx) + f(-a * x));
      matrix[1] = f(-b * sine);
      matrix[5] = f(b * cosine);
      matrix[13] = f(f(b * ty) + f(-b * y));
      state.transformDirty = false;
    }
    return state.transform;
  }

  /** 返回标准化设备坐标到世界坐标的只读逆变换缓存。 */
  getInverseTransform(): R<Transform> {
    const state = this.state;
    if (state.inverseDirty) {
      state.inverse[transformStorage].set(
        this.getTransform().getInverse()[transformStorage]);
      state.inverseDirty = false;
    }
    return state.inverse;
  }

  private invalidate(): void {
    this.state.transformDirty = this.state.inverseDirty = true;
  }

  private checkWritable(): void {
    if (Object.isFrozen(this)) throw new TypeError('Cannot modify a const View');
  }
}
