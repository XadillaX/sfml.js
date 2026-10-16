import { native, type NativeValueHandle } from '../internal/native';
import { LazyValue, nativeValue } from '../internal/lazy-value';
import { Angle, radians } from './angle';
import type { Bvec2 } from '../graphics/boolean-vector';
import {
  vector2Storage, vector2Native, type ReadonlyValue, mutableValue,
} from '../internal/value-storage';
import {
  scalarArrays, requireFloat, toScalar, scalarProduct, convertScalar,
  validateScalar, type ScalarType, type Scalar, type ScalarArray,
  type NumberScalar, type FloatScalar,
} from '../internal/scalar';

export type { ScalarType } from '../internal/scalar';

type Vector2Source =
  ReadonlyValue<Vector2<ScalarType>> | ReadonlyValue<Bvec2>;
type Vector2Arguments<T extends ScalarType = NumberScalar> =
  | []
  | [ x: Scalar<T>, y: Scalar<T> ]
  | [ source: Vector2Source ];
type PolarArguments = [ r: number, phi: ReadonlyValue<Angle> ];

type Vector2State =
  LazyValue<'vector2', ScalarArray>;

/** sf::Vector2<T>, with a native handle lazily bound to its existing storage. */
export class Vector2<T extends ScalarType> {
  readonly [mutableValue] = true;
  private readonly type: T;
  // Keep internal storage replaceable even when the public wrapper is frozen.
  private readonly state: Vector2State;

  /**
   * 创建指定标量类型的二维向量；省略分量时为零，也可转换并复制源向量。
   * @param scalarType 分量存储类型；i64/u64 使用 bigint，其余使用 number。
   * @param args x、y 分量或源向量；浮点类型还支持半径与 Angle 极坐标。
   */
  constructor(
    scalarType: T,
    ...args: Vector2Arguments<T> | (T extends FloatScalar ? PolarArguments : never)
  );
  /** 复制向量及其标量类型，副本拥有独立存储。 */
  constructor(source: ReadonlyValue<Vector2<T>>);
  constructor(
    typeOrSource: T | ReadonlyValue<Vector2<T>>,
    ...args: Vector2Arguments<ScalarType> | PolarArguments
  ) {
    this.type = typeof typeOrSource === 'string'
      ? typeOrSource
      : typeOrSource.scalarType as T;
    validateScalar(this.type);
    const type = this.type;
    this.state = new LazyValue(new scalarArrays[type](2),
      buffer => native.wrapVector2(type, buffer));

    const source = typeof typeOrSource === 'string' ? args[0] : typeOrSource;
    if (typeof source === 'number' || typeof source === 'bigint') {
      if (args[1] instanceof Angle) {
        requireFloat(this.type);
        const radius = toScalar(type, source as number);
        const phi = args[1].asRadians();
        // SFML polar construction evaluates sin/cos with the float Angle.
        this.x = (radius * Math.fround(Math.cos(phi))) as Scalar<T>;
        this.y = (radius * Math.fround(Math.sin(phi))) as Scalar<T>;
      } else {
        this.x = source as Scalar<T>;
        this.y = args[1] as Scalar<T>;
      }
    } else if (source !== undefined) {
      if (source instanceof Vector2 && source.scalarType === type) {
        const input = source[vector2Storage];
        new Uint8Array(this.state.values.buffer).set(
          new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
      } else {
        this.x = convertScalar(type, source.x) as Scalar<T>;
        this.y = convertScalar(type, source.y) as Scalar<T>;
      }
    }
  }

  /** 分量使用的标量存储类型。 */
  get scalarType(): T {
    return this.type;
  }

  get [vector2Storage](): ScalarArray<T> {
    return this.state.values as ScalarArray<T>;
  }

  get [vector2Native](): NativeValueHandle<'vector2'> {
    return nativeValue(this, vector2Native, this.state);
  }

  /** X 分量；写入按 scalarType 对应的 TypedArray 规则转换。 */
  get x(): Scalar<T> {
    return this.state.values[0] as Scalar<T>;
  }

  /** 设置 X 分量。 */
  set x(value: Scalar<T>) {
    this.state.values[0] = value;
  }

  /** Y 分量；写入按 scalarType 对应的 TypedArray 规则转换。 */
  get y(): Scalar<T> {
    return this.state.values[1] as Scalar<T>;
  }

  /** 设置 Y 分量。 */
  set y(value: Scalar<T>) {
    this.state.values[1] = value;
  }

  /** 返回 x²+y²，按当前标量类型的精度和范围计算。 */
  lengthSquared(): Scalar<T> {
    return this.dot(this);
  }

  /** 返回欧几里得长度；仅适用于浮点向量。 */
  length(this: ReadonlyValue<Vector2<FloatScalar>>): number;
  length(): number {
    requireFloat(this.type);
    return toScalar(this.type, Math.sqrt(this.lengthSquared() as number));
  }

  /** 返回同方向的单位向量；仅适用于浮点向量，零向量抛出 RangeError。 */
  normalized(this: ReadonlyValue<Vector2<T & FloatScalar>>): Vector2<T>;
  normalized(): Vector2<T> {
    requireFloat(this.type);
    const length = toScalar(this.type, Math.sqrt(this.lengthSquared() as number));
    if (length === 0) {
      throw new RangeError('Cannot normalize a vector with zero length');
    }
    return this.createResult((this.x as number) / length,
      (this.y as number) / length);
  }

  /** 返回相对于正 X 轴的角度；仅适用于非零浮点向量。 */
  angle(this: ReadonlyValue<Vector2<FloatScalar>>): Angle;
  angle(): Angle {
    requireFloat(this.type);
    this.checkNonzero();
    return radians(Math.atan2(this.y as number, this.x as number));
  }

  /** 返回从本向量到 rhs 的有符号夹角；两者必须为同类型的非零浮点向量。 */
  angleTo(
    this: ReadonlyValue<Vector2<T & FloatScalar>>,
    rhs: ReadonlyValue<Vector2<T>>,
  ): Angle;
  angleTo(rhs: ReadonlyValue<Vector2<T>>): Angle {
    requireFloat(this.type);
    this.checkScalarType(rhs);
    this.checkNonzero();
    if (rhs.x === 0 && rhs.y === 0) {
      throw new RangeError('Cannot calculate angle to a zero vector');
    }
    return radians(Math.atan2(this.cross(rhs) as number, this.dot(rhs) as number));
  }

  /** 返回旋转 phi 后的新浮点向量；屏幕坐标中正角度为顺时针。 */
  rotatedBy(
    this: ReadonlyValue<Vector2<T & FloatScalar>>, phi: ReadonlyValue<Angle>,
  ): Vector2<T>;
  rotatedBy(phi: ReadonlyValue<Angle>): Vector2<T> {
    requireFloat(this.type);
    const cos = toScalar(this.type, Math.cos(phi.asRadians()));
    const sin = toScalar(this.type, Math.sin(phi.asRadians()));
    return this.createResult(
      scalarProduct(this.type, cos, this.x as number) -
        scalarProduct(this.type, sin, this.y as number),
      scalarProduct(this.type, sin, this.x as number) +
        scalarProduct(this.type, cos, this.y as number),
    );
  }

  /** 返回在 axis 上的投影；axis 必须为同类型的非零浮点向量。 */
  projectedOnto(
    this: ReadonlyValue<Vector2<T & FloatScalar>>,
    axis: ReadonlyValue<Vector2<T>>,
  ): Vector2<T>;
  projectedOnto(axis: ReadonlyValue<Vector2<T>>): Vector2<T> {
    requireFloat(this.type);
    this.checkScalarType(axis);
    if (axis.x === 0 && axis.y === 0) {
      throw new RangeError('Cannot project onto a zero vector');
    }
    const ratio = toScalar(this.type,
      (this.dot(axis) as number) / (axis.lengthSquared() as number));
    return this.createResult(ratio * (axis.x as number),
      ratio * (axis.y as number));
  }

  /** 返回与同类型向量 rhs 的点积 x·rhs.x+y·rhs.y。 */
  dot(rhs: ReadonlyValue<Vector2<T>>): Scalar<T> {
    this.checkScalarType(rhs);
    if (typeof this.x === 'bigint') {
      return convertScalar(this.type,
        this.x * (rhs.x as bigint) +
        (this.y as bigint) * (rhs.y as bigint)) as Scalar<T>;
    }
    return toScalar(this.type,
      scalarProduct(this.type, this.x as number, rhs.x as number) +
      scalarProduct(this.type, this.y as number, rhs.y as number)) as Scalar<T>;
  }

  /** 返回二维叉积标量 x·rhs.y−y·rhs.x；rhs 必须具有相同标量类型。 */
  cross(rhs: ReadonlyValue<Vector2<T>>): Scalar<T> {
    this.checkScalarType(rhs);
    if (typeof this.x === 'bigint') {
      return convertScalar(this.type,
        this.x * (rhs.y as bigint) -
        (this.y as bigint) * (rhs.x as bigint)) as Scalar<T>;
    }
    return toScalar(this.type,
      scalarProduct(this.type, this.x as number, rhs.y as number) -
      scalarProduct(this.type, this.y as number, rhs.x as number)) as Scalar<T>;
  }

  /** 返回垂直向量 (-y, x)，使用相同标量类型。 */
  perpendicular(): Vector2<T> {
    return this.createResult(-this.y, this.x);
  }

  /** 返回与同类型 rhs 逐分量相乘的新向量。 */
  componentWiseMul(rhs: ReadonlyValue<Vector2<T>>): Vector2<T> {
    this.checkScalarType(rhs);
    if (typeof this.x === 'bigint') {
      return this.createResult(this.x * (rhs.x as bigint),
        (this.y as bigint) * (rhs.y as bigint));
    }
    return this.createResult(
      scalarProduct(this.type, this.x as number, rhs.x as number),
      scalarProduct(this.type, this.y as number, rhs.y as number),
    );
  }

  /** 返回与同类型 rhs 逐分量相除的新向量；任一除数为零时抛出 RangeError。 */
  componentWiseDiv(rhs: ReadonlyValue<Vector2<T>>): Vector2<T> {
    this.checkScalarType(rhs);
    if (rhs.x === 0 || rhs.y === 0 || rhs.x === 0n || rhs.y === 0n) {
      throw new RangeError('Vector2.componentWiseDiv() cannot divide by zero');
    }
    if (typeof this.x === 'bigint') {
      return this.createResult(this.x / (rhs.x as bigint),
        (this.y as bigint) / (rhs.y as bigint));
    }
    return this.createResult((this.x as number) / (rhs.x as number),
      (this.y as number) / (rhs.y as number));
  }

  protected createResult(x: number | bigint, y: number | bigint): Vector2<T> {
    return new Vector2(this.type, x as Scalar<T>, y as Scalar<T>);
  }

  private checkNonzero(): void {
    if (this.x === 0 && this.y === 0) {
      throw new RangeError('Cannot calculate angle from a zero vector');
    }
  }

  private checkScalarType(rhs: ReadonlyValue<Vector2<T>>): void {
    if (!(rhs instanceof Vector2) || rhs.scalarType !== this.type) {
      throw new TypeError('Vector2 operands must have the same scalar type');
    }
  }
}

/** sf::Vector2<int>. */
export class Vector2i extends Vector2<'i32'> {
  /** 创建有符号 32 位整数零向量。 */
  constructor();
  /** 从 x、y 分量创建有符号 32 位整数向量。 */
  constructor(x: number, y: number);
  /** 将 source 转换并复制为有符号 32 位整数向量。 */
  constructor(source: Vector2Source);
  constructor(...args: Vector2Arguments) {
    super('i32', ...args);
    this.createResult = Vector2i.makeResult;
  }

  private static makeResult(x: number, y: number): Vector2i {
    return new Vector2i(x, y);
  }
}

/** sf::Vector2<unsigned int>. */
export class Vector2u extends Vector2<'u32'> {
  /** 创建无符号 32 位整数零向量。 */
  constructor();
  /** 从 x、y 分量创建无符号 32 位整数向量。 */
  constructor(x: number, y: number);
  /** 将 source 转换并复制为无符号 32 位整数向量。 */
  constructor(source: Vector2Source);
  constructor(...args: Vector2Arguments) {
    super('u32', ...args);
    this.createResult = Vector2u.makeResult;
  }

  private static makeResult(x: number, y: number): Vector2u {
    return new Vector2u(x, y);
  }
}

/** sf::Vector2<float>. */
export class Vector2f extends Vector2<'f32'> {
  /** 创建 float32 零向量。 */
  constructor();
  /** 从 x、y 分量创建 float32 向量。 */
  constructor(x: number, y: number);
  /** 从半径 r 和相对于正 X 轴的角度 phi 创建 float32 向量。 */
  constructor(r: number, phi: ReadonlyValue<Angle>);
  /** 将 source 转换并复制为 float32 向量。 */
  constructor(source: Vector2Source);
  constructor(...args: Vector2Arguments | PolarArguments) {
    super('f32', ...args);
    this.createResult = Vector2f.makeResult;
  }

  private static makeResult(x: number, y: number): Vector2f {
    return new Vector2f(x, y);
  }
}

const vector2Classes = { i32: Vector2i, u32: Vector2u, f32: Vector2f };

function createMemberResult(this: Vector2<'i32' | 'u32' | 'f32'>,
  x: number, y: number) {
  const Constructor = vector2Classes[this.scalarType];
  return new Constructor(x, y);
}

/** Internal member view; native ownership can be resolved through its parent. */
export function vector2FromState<T extends 'i32' | 'u32' | 'f32'>(
  type: T, state: Vector2State,
): Vector2<T> {
  // Bypass allocation and initialize the same fields as the value constructor.
  return Object.assign(Object.create(vector2Classes[type].prototype), {
    type,
    [mutableValue]: true,
    state,
    createResult: createMemberResult,
  });
}
