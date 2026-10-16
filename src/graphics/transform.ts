import { native, type NativeValueHandle } from '../internal/native';
import { LazyValue, nativeValue } from '../internal/lazy-value';
import {
  transformStorage, transformNative, rectStorage, mutableValue,
  type ReadonlyValue as R,
} from '../internal/value-storage';
import { Vector2, Vector2f } from '../system/vector2';
import { Angle } from '../system/angle';
import { Rect, FloatRect } from './rect';

type Components = [
  a00: number, a01: number, a02: number,
  a10: number, a11: number, a12: number,
  a20: number, a21: number, a22: number,
];
type Arguments = [] | [ source: R<Transform> ] | Components;
type State = LazyValue<'transform', Float32Array> & {
  matrix?: readonly number[];
};
const f = Math.fround;

function dot3(
  a: number, b: number, c: number, d: number, e: number, g: number,
): number {
  return f(f(f(a * b) + f(c * d)) + f(e * g));
}

function minor(a: number, b: number, c: number, d: number): number {
  return f(f(a * b) - f(c * d));
}

function pointCoordinate(
  a: number, x: number, b: number, y: number, offset: number,
): number {
  return f(f(f(a * x) + f(b * y)) + offset);
}

function requireVector(value: R<Vector2f>): void {
  if (!(value instanceof Vector2) || value.scalarType !== 'f32') {
    throw new TypeError('Transform requires a Vector2f');
  }
}

// Capture only the backing array so a matrix view can outlive its wrapper.
function matrixView(values: Float32Array): readonly number[] {
  const view = new Array<number>(16);
  for (let i = 0; i < 16; i++) {
    Object.defineProperty(view, i, {
      enumerable: true, get: () => values[i],
    });
  }
  return Object.freeze(view);
}

/** sf::Transform, using its 64-byte column-major storage from construction. */
export class Transform {
  readonly [mutableValue] = true;
  /** 变换矩阵的惰性原生包装及可选矩阵视图缓存。 */
  private readonly state: State = new LazyValue(
    new Float32Array(16), buffer => native.wrapTransform(buffer),
  );

  /** 创建单位矩阵、复制现有变换，或按行序提供 3×3 矩阵的九个分量。 */
  constructor(...args: Arguments) {
    const values = this.state.values;
    if (args.length === 0) {
      values[0] = values[5] = values[10] = values[15] = 1;
    } else if (args.length === 1 && args[0] instanceof Transform) {
      values.set(args[0][transformStorage]);
    } else if (args.length === 9 &&
        args.every(value => typeof value === 'number')) {
      this.assign(...args);
    } else {
      throw new TypeError('Transform requires zero, one Transform or 9 numbers');
    }
  }

  get [transformStorage](): Float32Array {
    return this.state.values;
  }

  get [transformNative](): NativeValueHandle<'transform'> {
    return nativeValue(this, transformNative, this.state);
  }

  /** 返回供 OpenGL 使用的 4×4 列主序只读视图；内容随本变换更新。 */
  getMatrix(): readonly number[] {
    this.state.matrix ??= matrixView(this.state.values);
    return this.state.matrix;
  }

  /** 返回逆变换的新对象；矩阵不可逆时返回单位矩阵。 */
  getInverse(): Transform {
    const a = this.state.values;
    const p = minor(a[15], a[5], a[7], a[13]);
    const q = minor(a[15], a[4], a[7], a[12]);
    const r = minor(a[13], a[4], a[5], a[12]);
    const determinant = f(f(f(a[0] * p) - f(a[1] * q)) + f(a[3] * r));
    if (determinant === 0) return new Transform();
    return new Transform(
      p / determinant, -q / determinant, r / determinant,
      -minor(a[15], a[1], a[3], a[13]) / determinant,
      minor(a[15], a[0], a[3], a[12]) / determinant,
      -minor(a[13], a[0], a[1], a[12]) / determinant,
      minor(a[7], a[1], a[3], a[5]) / determinant,
      -minor(a[7], a[0], a[3], a[4]) / determinant,
      minor(a[5], a[0], a[1], a[4]) / determinant,
    );
  }

  /** 变换二维点并返回新向量。 */
  transformPoint(point: R<Vector2f>): Vector2f {
    requireVector(point);
    const a = this.state.values;
    return new Vector2f(
      pointCoordinate(a[0], point.x, a[4], point.y, a[12]),
      pointCoordinate(a[1], point.x, a[5], point.y, a[13]),
    );
  }

  /** 变换矩形四个角，返回其轴对齐包围框。 */
  transformRect(rectangle: R<FloatRect>): FloatRect {
    if (!(rectangle instanceof Rect) || rectangle.scalarType !== 'f32') {
      throw new TypeError('Transform requires a FloatRect');
    }
    const a = this.state.values;
    const r = rectangle[rectStorage];
    const endX = f(r[0] + r[2]);
    const endY = f(r[1] + r[3]);
    let minX = pointCoordinate(a[0], r[0], a[4], r[1], a[12]);
    let minY = pointCoordinate(a[1], r[0], a[5], r[1], a[13]);
    let maxX = minX;
    let maxY = minY;
    for (let i = 1; i < 4; i++) {
      const px = i === 1 ? f(r[0] + 0) : endX;
      const py = i === 2 ? f(r[1] + 0) : endY;
      const x = pointCoordinate(a[0], px, a[4], py, a[12]);
      const y = pointCoordinate(a[1], px, a[5], py, a[13]);
      // Ordered comparisons preserve SFML's NaN and signed-zero behavior.
      if (x < minX) minX = x;
      else if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      else if (y > maxY) maxY = y;
    }
    const result = new FloatRect();
    const values = result[rectStorage];
    values[0] = minX;
    values[1] = minY;
    values[2] = maxX - minX;
    values[3] = maxY - minY;
    return result;
  }

  /** 原地右乘 transform，返回 this；点先应用 transform，再应用原变换。 */
  combine(this: Transform, transform: R<Transform>): this {
    if (!(transform instanceof Transform)) {
      throw new TypeError('Expected a Transform');
    }
    const b = transform[transformStorage];
    return this.combineMatrix(
      b[0], b[4], b[12], b[1], b[5], b[13], b[3], b[7], b[15],
    ) as this;
  }

  /** 原地右乘平移矩阵，返回 this。 */
  translate(this: Transform, offset: R<Vector2f>): this {
    requireVector(offset);
    return this.combineMatrix(
      1, 0, offset.x, 0, 1, offset.y, 0, 0, 1,
    ) as this;
  }

  /** 原地右乘缩放矩阵，围绕 center（默认原点）缩放，返回 this。 */
  scale(
    this: Transform, factors: R<Vector2f>, center?: R<Vector2f>,
  ): this {
    requireVector(factors);
    if (center !== undefined) requireVector(center);
    return this.combineMatrix(
      factors.x, 0, center === undefined ? 0 : f(center.x * f(1 - factors.x)),
      0, factors.y, center === undefined ? 0 : f(center.y * f(1 - factors.y)),
      0, 0, 1,
    ) as this;
  }

  /** 原地右乘旋转矩阵，围绕 center（默认原点）旋转，返回 this。 */
  rotate(
    this: Transform, angle: R<Angle>, center?: R<Vector2f>,
  ): this {
    if (!(angle instanceof Angle)) throw new TypeError('Expected an Angle');
    if (center !== undefined) requireVector(center);
    const cos = f(Math.cos(angle.asRadians()));
    const sin = f(Math.sin(angle.asRadians()));
    const tx = center === undefined ? 0
      : f(f(center.x * f(1 - cos)) + f(center.y * sin));
    const ty = center === undefined ? 0
      : f(f(center.y * f(1 - cos)) - f(center.x * sin));
    return this.combineMatrix(cos, -sin, tx, sin, cos, ty, 0, 0, 1) as this;
  }

  /** 原地右乘 3×3 矩阵到列主序存储。 */
  private combineMatrix(
    b00: number, b01: number, b02: number,
    b10: number, b11: number, b12: number,
    b20: number, b21: number, b22: number,
  ): this {
    if (Object.isFrozen(this)) {
      throw new TypeError('Cannot modify a constant Transform');
    }
    const a = this.state.values;
    // Compute every entry before writing, including for combine(this).
    const a00 = dot3(a[0], b00, a[4], b10, a[12], b20);
    const a01 = dot3(a[0], b01, a[4], b11, a[12], b21);
    const a02 = dot3(a[0], b02, a[4], b12, a[12], b22);
    const a10 = dot3(a[1], b00, a[5], b10, a[13], b20);
    const a11 = dot3(a[1], b01, a[5], b11, a[13], b21);
    const a12 = dot3(a[1], b02, a[5], b12, a[13], b22);
    const a20 = dot3(a[3], b00, a[7], b10, a[15], b20);
    const a21 = dot3(a[3], b01, a[7], b11, a[15], b21);
    const a22 = dot3(a[3], b02, a[7], b12, a[15], b22);
    this.assign(a00, a01, a02, a10, a11, a12, a20, a21, a22);
    return this;
  }

  /** 将九个行序分量写入列主序存储。 */
  private assign(
    a00: number, a01: number, a02: number,
    a10: number, a11: number, a12: number,
    a20: number, a21: number, a22: number,
  ): void {
    const values = this.state.values;
    values[0] = a00; values[4] = a01; values[12] = a02;
    values[1] = a10; values[5] = a11; values[13] = a12;
    values[3] = a20; values[7] = a21; values[15] = a22;
    values[2] = values[6] = values[8] = values[9] =
      values[11] = values[14] = 0;
    values[10] = 1;
  }

  /** 只读单位变换，保持点的位置不变。 */
  static readonly Identity: R<Transform> = Object.freeze(new Transform());
}
