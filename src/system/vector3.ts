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

/**
 * sf::Vector3<T>, stored as three consecutive values of its scalar type.
 * @zh sf::Vector3<T>，以其标量类型的三个连续值存储。
 * @ja sf::Vector3<T>。そのスカラー型の 3 つの連続した値として格納される。
 * @ko sf::Vector3<T>. 해당 스칼라 타입의 연속된 세 값으로 저장된다.
 */
export class Vector3<T extends ScalarType> {
  readonly [mutableValue] = true;
  private readonly type: T;
  private readonly state:
  LazyValue<'vector3', ScalarArray>;

  /**
   * Create a 3D vector of the specified scalar type.
   * @zh 创建指定标量类型的三维向量。
   * @ja 指定したスカラー型の 3 次元ベクトルを作成する。
   * @ko 지정한 스칼라 타입의 3차원 벡터를 생성한다.
   * @param scalarType Storage type; i64/u64 components are bigint, others
   * are number.
   * @zh scalarType - 存储类型；i64/u64 的分量为 bigint，其余为 number。
   * @ja scalarType - 格納型。i64/u64 の成分は bigint、それ以外は number。
   * @ko scalarType - 저장 타입. i64/u64 성분은 bigint, 나머지는 number이다.
   * @param args x, y, z components or a source vector to convert and copy;
   * create a zero vector if omitted.
   * @zh args - x、y、z 分量或待转换复制的源向量；省略时创建零向量。
   * @ja args - x、y、z 成分または変換してコピーする元のベクトル。
   * 省略時はゼロベクトルを作成する。
   * @ko args - x, y, z 성분 또는 변환하여 복사할 원본 벡터.
   * 생략하면 영벡터를 생성한다.
   */
  constructor(scalarType: T, ...args: Vector3Arguments<T>);
  /**
   * Copy the vector and its scalar type with independent storage.
   * @zh 复制向量及其标量类型，副本拥有独立存储。
   * @ja ベクトルとそのスカラー型をコピーする。コピーは独立した格納領域を持つ。
   * @ko 벡터와 스칼라 타입을 복사한다. 복사본은 독립된 저장소를 갖는다.
   */
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

  /**
   * The scalar storage type used by the components.
   * @zh 分量使用的标量存储类型。
   * @ja 成分に使われるスカラー格納型。
   * @ko 성분에 사용되는 스칼라 저장 타입.
   */
  get scalarType(): T {
    return this.type;
  }

  get [vector3Storage](): ScalarArray<T> {
    return this.state.values as ScalarArray<T>;
  }

  get [vector3Native](): NativeValueHandle<'vector3'> {
    return nativeValue(this, vector3Native, this.state);
  }

  /**
   * The X component; writes follow the TypedArray conversion rules for
   * scalarType.
   * @zh X 分量；写入按 scalarType 对应的 TypedArray 规则转换。
   * @ja X 成分。書き込み時は scalarType に対応する TypedArray の規則で変換する。
   * @ko X 성분. 쓰기 시 scalarType에 해당하는 TypedArray 규칙에 따라 변환한다.
   */
  get x(): Scalar<T> {
    return this.state.values[0] as Scalar<T>;
  }

  /**
   * Set the X component.
   * @zh 设置 X 分量。
   * @ja X 成分を設定する。
   * @ko X 성분을 설정한다.
   */
  set x(value: Scalar<T>) {
    this.state.values[0] = value;
  }

  /**
   * The Y component; writes follow the TypedArray conversion rules for
   * scalarType.
   * @zh Y 分量；写入按 scalarType 对应的 TypedArray 规则转换。
   * @ja Y 成分。書き込み時は scalarType に対応する TypedArray の規則で変換する。
   * @ko Y 성분. 쓰기 시 scalarType에 해당하는 TypedArray 규칙에 따라 변환한다.
   */
  get y(): Scalar<T> {
    return this.state.values[1] as Scalar<T>;
  }

  /**
   * Set the Y component.
   * @zh 设置 Y 分量。
   * @ja Y 成分を設定する。
   * @ko Y 성분을 설정한다.
   */
  set y(value: Scalar<T>) {
    this.state.values[1] = value;
  }

  /**
   * The Z component; writes follow the TypedArray conversion rules for
   * scalarType.
   * @zh Z 分量；写入按 scalarType 对应的 TypedArray 规则转换。
   * @ja Z 成分。書き込み時は scalarType に対応する TypedArray の規則で変換する。
   * @ko Z 성분. 쓰기 시 scalarType에 해당하는 TypedArray 규칙에 따라 변환한다.
   */
  get z(): Scalar<T> {
    return this.state.values[2] as Scalar<T>;
  }

  /**
   * Set the Z component.
   * @zh 设置 Z 分量。
   * @ja Z 成分を設定する。
   * @ko Z 성분을 설정한다.
   */
  set z(value: Scalar<T>) {
    this.state.values[2] = value;
  }

  /**
   * Return x²+y²+z², calculated with the current scalar type's precision
   * and range.
   * @zh 返回 x²+y²+z²，按当前标量类型的精度和范围计算。
   * @ja 現在のスカラー型の精度と範囲で計算した x²+y²+z² を返す。
   * @ko 현재 스칼라 타입의 정밀도와 범위로 계산한 x²+y²+z²를 반환한다.
   */
  lengthSquared(): Scalar<T> {
    return this.dot(this);
  }

  /**
   * Return the Euclidean length; only available for floating-point vectors.
   * @zh 返回欧几里得长度；仅适用于浮点向量。
   * @ja ユークリッド長を返す。浮動小数点ベクトルのみ対応する。
   * @ko 유클리드 길이를 반환한다. 부동소수점 벡터에만 사용할 수 있다.
   */
  length(this: ReadonlyValue<Vector3<FloatScalar>>): number;
  length(): number {
    requireFloat(this.type);
    return toScalar(this.type, Math.sqrt(this.lengthSquared() as number));
  }

  /**
   * Return a unit vector in the same direction; only for floating-point
   * vectors. A zero vector throws RangeError.
   * @zh 返回同方向的单位向量；仅适用于浮点向量，零向量抛出 RangeError。
   * @ja 同じ方向の単位ベクトルを返す。浮動小数点ベクトルのみ対応し、
   * ゼロベクトルでは RangeError をスローする。
   * @ko 같은 방향의 단위 벡터를 반환한다. 부동소수점 벡터만 지원하며
   * 영벡터는 RangeError를 던진다.
   */
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

  /**
   * Return the dot product with vector rhs of the same type.
   * @zh 返回与同类型向量 rhs 的点积。
   * @ja 同じ型のベクトル rhs との内積を返す。
   * @ko 같은 타입의 벡터 rhs와의 내적을 반환한다.
   */
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

  /**
   * Return the cross product with vector rhs of the same type, following
   * the right-hand rule, as a new vector.
   * @zh 按右手定则返回与同类型向量 rhs 的叉积，结果为新向量。
   * @ja 同じ型のベクトル rhs との外積を、右手の法則に従う新しいベクトルで返す。
   * @ko 같은 타입의 벡터 rhs와의 외적을 오른손 법칙에 따라 새 벡터로 반환한다.
   */
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

  /**
   * Return a new vector multiplied component-wise by rhs of the same type.
   * @zh 返回与同类型 rhs 逐分量相乘的新向量。
   * @ja 同じ型の rhs と成分ごとに乗算した新しいベクトルを返す。
   * @ko 같은 타입의 rhs와 성분별로 곱한 새 벡터를 반환한다.
   */
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

  /**
   * Return a new vector divided component-wise by rhs of the same type;
   * throw RangeError if any divisor is zero.
   * @zh 返回与同类型 rhs 逐分量相除的新向量；任一除数为零时抛出 RangeError。
   * @ja 同じ型の rhs で成分ごとに除算した新しいベクトルを返す。
   * 除数が 1 つでもゼロなら RangeError をスローする。
   * @ko 같은 타입의 rhs로 성분별로 나눈 새 벡터를 반환한다.
   * 제수 중 하나라도 0이면 RangeError를 던진다.
   */
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

/**
 * A vector of three signed 32-bit integer components.
 * @zh 三个有符号 32 位整数分量组成的向量。
 * @ja 3 つの符号付き 32 ビット整数成分からなるベクトル。
 * @ko 세 개의 부호 있는 32비트 정수 성분으로 구성된 벡터.
 */
export class Vector3i extends Vector3<'i32'> {
  /**
   * Create a zero vector.
   * @zh 创建零向量。
   * @ja ゼロベクトルを作成する。
   * @ko 영벡터를 생성한다.
   */
  constructor();
  /**
   * Create a vector from x, y, z components, converted to signed 32-bit
   * integers.
   * @zh 从 x、y、z 分量创建向量，按有符号 32 位整数转换。
   * @ja x、y、z 成分を符号付き 32 ビット整数に変換してベクトルを作成する。
   * @ko x, y, z 성분을 부호 있는 32비트 정수로 변환하여 벡터를 생성한다.
   */
  constructor(x: number, y: number, z: number);
  /**
   * Convert and copy source into a signed 32-bit integer vector.
   * @zh 将 source 转换并复制为有符号 32 位整数向量。
   * @ja source を符号付き 32 ビット整数ベクトルに変換してコピーする。
   * @ko source를 부호 있는 32비트 정수 벡터로 변환하여 복사한다.
   */
  constructor(source: Vector3Source);
  constructor(...args: Vector3Arguments) {
    super('i32', ...args);
    this.createResult = Vector3i.makeResult;
  }

  private static makeResult(x: number, y: number, z: number): Vector3i {
    return new Vector3i(x, y, z);
  }
}

/**
 * A vector of three unsigned 32-bit integer components.
 * @zh 三个无符号 32 位整数分量组成的向量。
 * @ja 3 つの符号なし 32 ビット整数成分からなるベクトル。
 * @ko 세 개의 부호 없는 32비트 정수 성분으로 구성된 벡터.
 */
export class Vector3u extends Vector3<'u32'> {
  /**
   * Create a zero vector.
   * @zh 创建零向量。
   * @ja ゼロベクトルを作成する。
   * @ko 영벡터를 생성한다.
   */
  constructor();
  /**
   * Create a vector from x, y, z components, converted to unsigned 32-bit
   * integers.
   * @zh 从 x、y、z 分量创建向量，按无符号 32 位整数转换。
   * @ja x、y、z 成分を符号なし 32 ビット整数に変換してベクトルを作成する。
   * @ko x, y, z 성분을 부호 없는 32비트 정수로 변환하여 벡터를 생성한다.
   */
  constructor(x: number, y: number, z: number);
  /**
   * Convert and copy source into an unsigned 32-bit integer vector.
   * @zh 将 source 转换并复制为无符号 32 位整数向量。
   * @ja source を符号なし 32 ビット整数ベクトルに変換してコピーする。
   * @ko source를 부호 없는 32비트 정수 벡터로 변환하여 복사한다.
   */
  constructor(source: Vector3Source);
  constructor(...args: Vector3Arguments) {
    super('u32', ...args);
    this.createResult = Vector3u.makeResult;
  }

  private static makeResult(x: number, y: number, z: number): Vector3u {
    return new Vector3u(x, y, z);
  }
}

/**
 * A vector of three float32 components.
 * @zh 三个 float32 分量组成的向量。
 * @ja 3 つの float32 成分からなるベクトル。
 * @ko 세 개의 float32 성분으로 구성된 벡터.
 */
export class Vector3f extends Vector3<'f32'> {
  /**
   * Create a zero vector.
   * @zh 创建零向量。
   * @ja ゼロベクトルを作成する。
   * @ko 영벡터를 생성한다.
   */
  constructor();
  /**
   * Create a float32 vector from x, y, z components.
   * @zh 从 x、y、z 分量创建 float32 向量。
   * @ja x、y、z 成分から float32 ベクトルを作成する。
   * @ko x, y, z 성분으로 float32 벡터를 생성한다.
   */
  constructor(x: number, y: number, z: number);
  /**
   * Convert and copy source into a float32 vector.
   * @zh 将 source 转换并复制为 float32 向量。
   * @ja source を float32 ベクトルに変換してコピーする。
   * @ko source를 float32 벡터로 변환하여 복사한다.
   */
  constructor(source: Vector3Source);
  constructor(...args: Vector3Arguments) {
    super('f32', ...args);
    this.createResult = Vector3f.makeResult;
  }

  private static makeResult(x: number, y: number, z: number): Vector3f {
    return new Vector3f(x, y, z);
  }
}
