import { native, type NativeValueHandle } from '../internal/native';
import { LazyValue, nativeValue } from '../internal/lazy-value';
import type { Bvec3 } from '../graphics/boolean-vector';
import {
  vector3Storage, vector3Native, mutableValue, type ReadonlyValue,
} from '../internal/value-storage';
import {
  scalarArrays, toScalar, scalarProduct, requireFloat, type ScalarType,
  convertScalar, validateScalar, type Scalar, type ScalarArray,
  type NumberScalar, type FloatScalar,
} from '../internal/scalar';

type Vector3Source =
  ReadonlyValue<Vector3<ScalarType>> | ReadonlyValue<Bvec3>;
type Vector3Arguments<T extends ScalarType = NumberScalar> =
  | []
  | [ x: Scalar<T>, y: Scalar<T>, z: Scalar<T> ]
  | [ source: Vector3Source ];

/** sf::Vector3<T>, stored as three consecutive values of its scalar type. */
export class Vector3<T extends ScalarType> {
  readonly [mutableValue] = true;
  private readonly type: T;
  private readonly state:
  LazyValue<'vector3', ScalarArray>;

  /**
   * 创建指定标量类型的三维向量。
   * @param scalarType 存储类型；i64/u64 的分量为 bigint，其余为 number。
   * @param args x、y、z 分量或待转换复制的源向量；省略时创建零向量。
   */
  constructor(scalarType: T, ...args: Vector3Arguments<T>);
  /** 复制向量及其标量类型，副本拥有独立存储。 */
  constructor(source: ReadonlyValue<Vector3<T>>);
  constructor(
    typeOrSource: T | ReadonlyValue<Vector3<T>>,
    ...args: Vector3Arguments<ScalarType>
  ) {
    this.type = typeof typeOrSource === 'string'
      ? typeOrSource : typeOrSource.scalarType as T;
    const type = this.type;
    validateScalar(type);
    this.state = new LazyValue(new scalarArrays[type](3),
      buffer => native.wrapVector3(type, buffer));
    const source = typeof typeOrSource === 'string' ? args[0] : typeOrSource;
    if (typeof source === 'number' || typeof source === 'bigint') {
      this.x = source as Scalar<T>;
      this.y = (args[1] ?? 0) as Scalar<T>;
      this.z = (args[2] ?? 0) as Scalar<T>;
    } else if (source !== undefined) {
      if (source instanceof Vector3 && source.scalarType === type) {
        const input = source[vector3Storage];
        new Uint8Array(this.state.values.buffer).set(
          new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
      } else {
        this.x = convertScalar(type, source.x) as Scalar<T>;
        this.y = convertScalar(type, source.y) as Scalar<T>;
        this.z = convertScalar(type, source.z) as Scalar<T>;
      }
    }
  }

  /** 分量使用的标量存储类型。 */
  get scalarType(): T {
    return this.type;
  }

  get [vector3Storage](): ScalarArray<T> {
    return this.state.values as ScalarArray<T>;
  }

  get [vector3Native](): NativeValueHandle<'vector3'> {
    return nativeValue(this, vector3Native, this.state);
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

  /** Z 分量；写入按 scalarType 对应的 TypedArray 规则转换。 */
  get z(): Scalar<T> {
    return this.state.values[2] as Scalar<T>;
  }

  /** 设置 Z 分量。 */
  set z(value: Scalar<T>) {
    this.state.values[2] = value;
  }

  /** 返回 x²+y²+z²，按当前标量类型的精度和范围计算。 */
  lengthSquared(): Scalar<T> {
    return this.dot(this);
  }

  /** 返回欧几里得长度；仅适用于浮点向量。 */
  length(this: ReadonlyValue<Vector3<FloatScalar>>): number;
  length(): number {
    requireFloat(this.type);
    return toScalar(this.type, Math.sqrt(this.lengthSquared() as number));
  }

  /** 返回同方向的单位向量；仅适用于浮点向量，零向量抛出 RangeError。 */
  normalized(this: ReadonlyValue<Vector3<T & FloatScalar>>): Vector3<T>;
  normalized(): Vector3<T> {
    requireFloat(this.type);
    const length = toScalar(this.type, Math.sqrt(this.lengthSquared() as number));
    if (length === 0) {
      throw new RangeError('Cannot normalize a vector with zero length');
    }
    return this.createResult(
      (this.x as number) / length, (this.y as number) / length,
      (this.z as number) / length,
    );
  }

  /** 返回与同类型向量 rhs 的点积。 */
  dot(rhs: ReadonlyValue<Vector3<T>>): Scalar<T> {
    this.checkScalarType(rhs);
    if (typeof this.x === 'bigint') {
      return convertScalar(this.type,
        this.x * (rhs.x as bigint) +
        (this.y as bigint) * (rhs.y as bigint) +
        (this.z as bigint) * (rhs.z as bigint)) as Scalar<T>;
    }
    const xy = toScalar(this.type,
      scalarProduct(this.type, this.x as number, rhs.x as number) +
      scalarProduct(this.type, this.y as number, rhs.y as number));
    return toScalar(this.type, xy +
      scalarProduct(this.type, this.z as number, rhs.z as number)) as Scalar<T>;
  }

  /** 按右手定则返回与同类型向量 rhs 的叉积，结果为新向量。 */
  cross(rhs: ReadonlyValue<Vector3<T>>): Vector3<T> {
    this.checkScalarType(rhs);
    if (typeof this.x === 'bigint') {
      const x = this.x;
      const y = this.y as bigint;
      const z = this.z as bigint;
      const a = rhs.x as bigint;
      const b = rhs.y as bigint;
      const c = rhs.z as bigint;
      return this.createResult(y * c - z * b, z * a - x * c, x * b - y * a);
    }
    return this.createResult(
      scalarProduct(this.type, this.y as number, rhs.z as number) -
        scalarProduct(this.type, this.z as number, rhs.y as number),
      scalarProduct(this.type, this.z as number, rhs.x as number) -
        scalarProduct(this.type, this.x as number, rhs.z as number),
      scalarProduct(this.type, this.x as number, rhs.y as number) -
        scalarProduct(this.type, this.y as number, rhs.x as number),
    );
  }

  /** 返回与同类型 rhs 逐分量相乘的新向量。 */
  componentWiseMul(rhs: ReadonlyValue<Vector3<T>>): Vector3<T> {
    this.checkScalarType(rhs);
    if (typeof this.x === 'bigint') {
      return this.createResult(this.x * (rhs.x as bigint),
        (this.y as bigint) * (rhs.y as bigint),
        (this.z as bigint) * (rhs.z as bigint));
    }
    return this.createResult(
      scalarProduct(this.type, this.x as number, rhs.x as number),
      scalarProduct(this.type, this.y as number, rhs.y as number),
      scalarProduct(this.type, this.z as number, rhs.z as number),
    );
  }

  /** 返回与同类型 rhs 逐分量相除的新向量；任一除数为零时抛出 RangeError。 */
  componentWiseDiv(rhs: ReadonlyValue<Vector3<T>>): Vector3<T> {
    this.checkScalarType(rhs);
    if (rhs.x === 0 || rhs.y === 0 || rhs.z === 0 ||
        rhs.x === 0n || rhs.y === 0n || rhs.z === 0n) {
      throw new RangeError('Vector3.componentWiseDiv() cannot divide by zero');
    }
    if (typeof this.x === 'bigint') {
      return this.createResult(this.x / (rhs.x as bigint),
        (this.y as bigint) / (rhs.y as bigint),
        (this.z as bigint) / (rhs.z as bigint));
    }
    return this.createResult((this.x as number) / (rhs.x as number),
      (this.y as number) / (rhs.y as number),
      (this.z as number) / (rhs.z as number));
  }

  protected createResult(
    x: number | bigint, y: number | bigint, z: number | bigint,
  ): Vector3<T> {
    return new Vector3(this.type, x as Scalar<T>, y as Scalar<T>, z as Scalar<T>);
  }

  private checkScalarType(rhs: ReadonlyValue<Vector3<T>>): void {
    if (!(rhs instanceof Vector3) || rhs.scalarType !== this.type) {
      throw new TypeError('Vector3 operands must have the same scalar type');
    }
  }
}

/** 三个有符号 32 位整数分量组成的向量。 */
export class Vector3i extends Vector3<'i32'> {
  /** 创建零向量。 */
  constructor();
  /** 从 x、y、z 分量创建向量，按有符号 32 位整数转换。 */
  constructor(x: number, y: number, z: number);
  /** 将 source 转换并复制为有符号 32 位整数向量。 */
  constructor(source: Vector3Source);
  constructor(...args: Vector3Arguments) {
    super('i32', ...args);
    this.createResult = Vector3i.makeResult;
  }

  private static makeResult(x: number, y: number, z: number): Vector3i {
    return new Vector3i(x, y, z);
  }
}

/** 三个无符号 32 位整数分量组成的向量。 */
export class Vector3u extends Vector3<'u32'> {
  /** 创建零向量。 */
  constructor();
  /** 从 x、y、z 分量创建向量，按无符号 32 位整数转换。 */
  constructor(x: number, y: number, z: number);
  /** 将 source 转换并复制为无符号 32 位整数向量。 */
  constructor(source: Vector3Source);
  constructor(...args: Vector3Arguments) {
    super('u32', ...args);
    this.createResult = Vector3u.makeResult;
  }

  private static makeResult(x: number, y: number, z: number): Vector3u {
    return new Vector3u(x, y, z);
  }
}

/** 三个 float32 分量组成的向量。 */
export class Vector3f extends Vector3<'f32'> {
  /** 创建零向量。 */
  constructor();
  /** 从 x、y、z 分量创建 float32 向量。 */
  constructor(x: number, y: number, z: number);
  /** 将 source 转换并复制为 float32 向量。 */
  constructor(source: Vector3Source);
  constructor(...args: Vector3Arguments) {
    super('f32', ...args);
    this.createResult = Vector3f.makeResult;
  }

  private static makeResult(x: number, y: number, z: number): Vector3f {
    return new Vector3f(x, y, z);
  }
}
