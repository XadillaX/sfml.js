import { native, type NativeValueHandle } from '../internal/native';
import { LazyValue, nativeValue, memberValue } from '../internal/lazy-value';
import { scalarArrays, toScalar } from '../internal/scalar';
import {
  rectStorage, rectNative, vector2Storage, mutableValue, type ReadonlyValue as R,
} from '../internal/value-storage';
import {
  Vector2, Vector2i, Vector2f, vector2FromState,
} from '../system/vector2';

type RectScalar = 'i32' | 'f32';
type RectArguments<T extends RectScalar> =
  | []
  | [ source: R<Rect<RectScalar>> ]
  | [ position: R<Vector2<T>>, size: R<Vector2<T>> ];

// Match SFML's comparisons, including unordered floats and signed zero.
const min = (a: number, b: number): number => (a < b ? a : b);
const max = (a: number, b: number): number => (a < b ? b : a);

/** Shared implementation of sf::Rect's two public specializations. */
export class Rect<T extends RectScalar> {
  readonly [mutableValue] = true;
  /** 矩形值的惰性原生包装，4 个分量。 */
  private readonly state: LazyValue<'rect', Int32Array | Float32Array>;
  /** 分量存储类型，i32 或 f32。 */
  private readonly type: T;
  /** position 属性的延迟 Vector2 视图缓存。 */
  private positionView?: Vector2<T>;
  /** size 属性的延迟 Vector2 视图缓存。 */
  private sizeView?: Vector2<T>;

  protected constructor(type: T, ...args: RectArguments<T>) {
    this.type = type;
    this.state = new LazyValue(new scalarArrays[type](4),
      buffer => native.wrapRect(type, buffer));
    if (args.length === 1) {
      const source = args[0];
      if (!(source instanceof Rect)) {
        throw new TypeError('Expected a rectangle to copy');
      }
      this[rectStorage].set(source[rectStorage]);
    } else if (args.length === 2) {
      this.checkVector(args[0]);
      this.checkVector(args[1]);
      this[rectStorage].set(args[0][vector2Storage], 0);
      this[rectStorage].set(args[1][vector2Storage], 2);
    } else if (args.length !== 0) {
      throw new TypeError('Rect requires position and size vectors');
    }
  }

  /** 矩形分量类型：i32 整数或 f32 浮点数。 */
  get scalarType(): T {
    return this.type;
  }

  get [rectStorage](): Int32Array | Float32Array {
    return this.state.values;
  }

  get [rectNative](): NativeValueHandle<'rect'> {
    return nativeValue(this, rectNative, this.state);
  }

  /** 矩形起点的共享视图；修改 x/y 会直接修改矩形。 */
  get position(): Vector2<T> {
    if (!this.positionView) {
      const parent = this.state;
      this.positionView = vector2FromState(this.type, memberValue(
        parent, parent.values.subarray(0, 2),
        handle => native.rectMember(handle, 0),
      ));
    }
    return this.positionView;
  }

  /** 复制同类型向量的值作为矩形起点。 */
  set position(value: R<Vector2<T>>) {
    this.checkVector(value);
    this[rectStorage].set(value[vector2Storage], 0);
  }

  /** 宽度和高度的共享视图；允许负尺寸。 */
  get size(): Vector2<T> {
    if (!this.sizeView) {
      const parent = this.state;
      this.sizeView = vector2FromState(this.type, memberValue(
        parent, parent.values.subarray(2, 4),
        handle => native.rectMember(handle, 1),
      ));
    }
    return this.sizeView;
  }

  /** 复制同类型向量的值作为矩形尺寸。 */
  set size(value: R<Vector2<T>>) {
    this.checkVector(value);
    this[rectStorage].set(value[vector2Storage], 2);
  }

  /** 判断点是否位于矩形内；包括最小边界，不包括最大边界，支持负尺寸。 */
  contains(point: R<Vector2<T>>): boolean {
    this.checkVector(point);
    const data = this[rectStorage];
    const endX = toScalar(this.type, data[0] + data[2]);
    const endY = toScalar(this.type, data[1] + data[3]);
    return point.x >= min(data[0], endX) && point.x < max(data[0], endX) &&
      point.y >= min(data[1], endY) && point.y < max(data[1], endY);
  }

  /** 返回与同类型矩形相交区域的新矩形；无正面积交集时返回 undefined。 */
  findIntersection(rectangle: R<Rect<T>>): Rect<T> | undefined {
    if (!(rectangle instanceof Rect) || rectangle.scalarType !== this.type) {
      throw new TypeError('Rect operands must have the same scalar type');
    }
    const a = this[rectStorage];
    const b = rectangle[rectStorage];
    const ax = toScalar(this.type, a[0] + a[2]);
    const ay = toScalar(this.type, a[1] + a[3]);
    const bx = toScalar(this.type, b[0] + b[2]);
    const by = toScalar(this.type, b[1] + b[3]);
    const left = max(min(a[0], ax), min(b[0], bx));
    const top = max(min(a[1], ay), min(b[1], by));
    const right = min(max(a[0], ax), max(b[0], bx));
    const bottom = min(max(a[1], ay), max(b[1], by));
    if (!(left < right && top < bottom)) return undefined;
    const result = this.createResult();
    const data = result[rectStorage];
    data[0] = left;
    data[1] = top;
    data[2] = right - left;
    data[3] = bottom - top;
    return result;
  }

  /** 返回中心点副本；整数矩形的半尺寸使用向零截断的整数除法。 */
  getCenter(): Vector2<T> {
    const data = this[rectStorage];
    const x = data[0] + toScalar(this.type, data[2] / 2);
    const y = data[1] + toScalar(this.type, data[3] / 2);
    return (this.type === 'f32'
      ? new Vector2f(x, y) : new Vector2i(x, y)) as Vector2<T>;
  }

  protected createResult(): Rect<T> {
    return new Rect(this.type);
  }

  /** 校验向量标量类型与矩形一致。 */
  private checkVector(value: R<Vector2<T>>): void {
    if (!(value instanceof Vector2) || value.scalarType !== this.type) {
      throw new TypeError('Rect requires a Vector2 with the same scalar type');
    }
  }
}

/** sf::Rect<float>, sharing 16 native bytes with its member views. */
export class FloatRect extends Rect<'f32'> {
  /** 创建位于原点、尺寸为零的矩形。 */
  constructor();
  /** 转换并复制矩形，分量按 float32 存储。 */
  constructor(source: R<FloatRect | IntRect>);
  /** 从起点和尺寸创建矩形，复制两个向量的值。 */
  constructor(position: R<Vector2f>, size: R<Vector2f>);
  constructor(...args: RectArguments<'f32'>) {
    super('f32', ...args);
    this.createResult = FloatRect.makeResult;
  }

  /** 为 FloatRect 的受保护 createResult 创建空实例。 */
  private static makeResult(): FloatRect {
    return new FloatRect();
  }
}

/** sf::Rect<int>, with integer division in getCenter(). */
export class IntRect extends Rect<'i32'> {
  /** 创建位于原点、尺寸为零的矩形。 */
  constructor();
  /** 转换并复制矩形，分量按有符号 32 位整数存储。 */
  constructor(source: R<FloatRect | IntRect>);
  /** 从起点和尺寸创建矩形，复制两个向量的值。 */
  constructor(position: R<Vector2i>, size: R<Vector2i>);
  constructor(...args: RectArguments<'i32'>) {
    super('i32', ...args);
    this.createResult = IntRect.makeResult;
  }

  /** 为 IntRect 的受保护 createResult 创建空实例。 */
  private static makeResult(): IntRect {
    return new IntRect();
  }
}

/** Internal alias for a native-owned rectangle member. */
export function intRectFromState(
  state: LazyValue<'rect', Int32Array>,
): IntRect {
  return Object.assign(Object.create(IntRect.prototype), {
    [mutableValue]: true, type: 'i32', state,
    createResult: () => new IntRect(),
  });
}

/** Internal alias for a native-owned floating-point rectangle member. */
export function floatRectFromState(
  state: LazyValue<'rect', Float32Array>,
): FloatRect {
  return Object.assign(Object.create(FloatRect.prototype), {
    [mutableValue]: true, type: 'f32', state,
    createResult: () => new FloatRect(),
  });
}
