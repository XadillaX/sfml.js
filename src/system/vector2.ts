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

/**
 * sf::Vector2<T>, with a native handle lazily bound to its existing storage.
 * @zh sf::Vector2<T>，原生句柄惰性绑定到其现有存储。
 * @ja sf::Vector2<T>。ネイティブハンドルは既存の格納領域へ遅延バインドされる。
 * @ko sf::Vector2<T>. 네이티브 핸들은 기존 저장소에 지연 바인딩된다.
 */
export class Vector2<T extends ScalarType> {
  readonly [mutableValue] = true;
  private readonly type: T;
  // Keep internal storage replaceable even when the public wrapper is frozen.
  private readonly state: Vector2State;

  /**
   * Create a 2D vector of the specified scalar type; omitted components are
   * zero. A source vector can also be converted and copied.
   * @zh 创建指定标量类型的二维向量；省略分量时为零，也可转换并复制源向量。
   * @ja 指定したスカラー型の 2 次元ベクトルを作成する。省略した成分はゼロ。
   * 元のベクトルを変換してコピーすることもできる。
   * @ko 지정한 스칼라 타입의 2차원 벡터를 생성한다. 생략된 성분은 0이며
   * 원본 벡터를 변환하여 복사할 수도 있다.
   * @param scalarType Component storage type; i64/u64 use bigint, others
   * use number.
   * @zh scalarType - 分量存储类型；i64/u64 使用 bigint，其余使用 number。
   * @ja scalarType - 成分の格納型。i64/u64 は bigint、それ以外は number。
   * @ko scalarType - 성분 저장 타입. i64/u64는 bigint, 나머지는 number를 사용한다.
   * @param args x and y components or a source vector; floating-point types
   * also support polar coordinates with a radius and an Angle.
   * @zh args - x、y 分量或源向量；浮点类型还支持半径与 Angle 极坐标。
   * @ja args - x、y 成分または元のベクトル。浮動小数点型は半径と Angle による
   * 極座標にも対応する。
   * @ko args - x, y 성분 또는 원본 벡터. 부동소수점 타입은 반지름과 Angle로
   * 표현한 극좌표도 지원한다.
   */
  constructor(
    scalarType: T,
    ...args: Vector2Arguments<T> | (T extends FloatScalar ? PolarArguments : never)
  );
  /**
   * Copy the vector and its scalar type with independent storage.
   * @zh 复制向量及其标量类型，副本拥有独立存储。
   * @ja ベクトルとそのスカラー型をコピーする。コピーは独立した格納領域を持つ。
   * @ko 벡터와 스칼라 타입을 복사한다. 복사본은 독립된 저장소를 갖는다.
   */
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

  /**
   * The scalar storage type used by the components.
   * @zh 分量使用的标量存储类型。
   * @ja 成分に使われるスカラー格納型。
   * @ko 성분에 사용되는 스칼라 저장 타입.
   */
  get scalarType(): T {
    return this.type;
  }

  get [vector2Storage](): ScalarArray<T> {
    return this.state.values as ScalarArray<T>;
  }

  get [vector2Native](): NativeValueHandle<'vector2'> {
    return nativeValue(this, vector2Native, this.state);
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
   * Return x²+y², calculated with the current scalar type's precision and
   * range.
   * @zh 返回 x²+y²，按当前标量类型的精度和范围计算。
   * @ja 現在のスカラー型の精度と範囲で計算した x²+y² を返す。
   * @ko 현재 스칼라 타입의 정밀도와 범위로 계산한 x²+y²를 반환한다.
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
  length(this: ReadonlyValue<Vector2<FloatScalar>>): number;
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

  /**
   * Return the angle relative to the positive X axis; only for nonzero
   * floating-point vectors.
   * @zh 返回相对于正 X 轴的角度；仅适用于非零浮点向量。
   * @ja 正の X 軸に対する角度を返す。非ゼロの浮動小数点ベクトルのみ対応する。
   * @ko 양의 X축에 대한 각도를 반환한다. 0이 아닌 부동소수점 벡터만 지원한다.
   */
  angle(this: ReadonlyValue<Vector2<FloatScalar>>): Angle;
  angle(): Angle {
    requireFloat(this.type);
    this.checkNonzero();
    return radians(Math.atan2(this.y as number, this.x as number));
  }

  /**
   * Return the signed angle from this vector to rhs; both must be nonzero
   * floating-point vectors of the same type.
   * @zh 返回从本向量到 rhs 的有符号夹角；两者必须为同类型的非零浮点向量。
   * @ja このベクトルから rhs への符号付き角度を返す。両者とも同じ型の
   * 非ゼロの浮動小数点ベクトルでなければならない。
   * @ko 이 벡터에서 rhs로 향하는 부호 있는 각도를 반환한다. 둘 다 같은 타입의
   * 0이 아닌 부동소수점 벡터여야 한다.
   */
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

  /**
   * Return a new floating-point vector rotated by phi; positive angles are
   * clockwise in screen coordinates.
   * @zh 返回旋转 phi 后的新浮点向量；屏幕坐标中正角度为顺时针。
   * @ja phi だけ回転した新しい浮動小数点ベクトルを返す。
   * 画面座標では正の角度は時計回り。
   * @ko phi만큼 회전한 새 부동소수점 벡터를 반환한다.
   * 화면 좌표에서 양의 각도는 시계 방향이다.
   */
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

  /**
   * Return the projection onto axis; axis must be a nonzero floating-point
   * vector of the same type.
   * @zh 返回在 axis 上的投影；axis 必须为同类型的非零浮点向量。
   * @ja axis への射影を返す。axis は同じ型の非ゼロの浮動小数点ベクトルで
   * なければならない。
   * @ko axis에 대한 정사영을 반환한다. axis는 같은 타입의 0이 아닌
   * 부동소수점 벡터여야 한다.
   */
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

  /**
   * Return the dot product x·rhs.x+y·rhs.y with rhs of the same type.
   * @zh 返回与同类型向量 rhs 的点积 x·rhs.x+y·rhs.y。
   * @ja 同じ型のベクトル rhs との内積 x·rhs.x+y·rhs.y を返す。
   * @ko 같은 타입의 벡터 rhs와의 내적 x·rhs.x+y·rhs.y를 반환한다.
   */
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

  /**
   * Return the 2D cross-product scalar x·rhs.y−y·rhs.x; rhs must have the
   * same scalar type.
   * @zh 返回二维叉积标量 x·rhs.y−y·rhs.x；rhs 必须具有相同标量类型。
   * @ja 2 次元外積のスカラー値 x·rhs.y−y·rhs.x を返す。
   * rhs は同じスカラー型でなければならない。
   * @ko 2차원 외적 스칼라 x·rhs.y−y·rhs.x를 반환한다.
   * rhs는 같은 스칼라 타입이어야 한다.
   */
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

  /**
   * Return the perpendicular vector (-y, x) with the same scalar type.
   * @zh 返回垂直向量 (-y, x)，使用相同标量类型。
   * @ja 同じスカラー型の垂直ベクトル (-y, x) を返す。
   * @ko 같은 스칼라 타입의 수직 벡터 (-y, x)를 반환한다.
   */
  perpendicular(): Vector2<T> {
    return this.createResult(-this.y, this.x);
  }

  /**
   * Return a new vector multiplied component-wise by rhs of the same type.
   * @zh 返回与同类型 rhs 逐分量相乘的新向量。
   * @ja 同じ型の rhs と成分ごとに乗算した新しいベクトルを返す。
   * @ko 같은 타입의 rhs와 성분별로 곱한 새 벡터를 반환한다.
   */
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

  /**
   * Return a new vector divided component-wise by rhs of the same type;
   * throw RangeError if any divisor is zero.
   * @zh 返回与同类型 rhs 逐分量相除的新向量；任一除数为零时抛出 RangeError。
   * @ja 同じ型の rhs で成分ごとに除算した新しいベクトルを返す。
   * 除数が 1 つでもゼロなら RangeError をスローする。
   * @ko 같은 타입의 rhs로 성분별로 나눈 새 벡터를 반환한다.
   * 제수 중 하나라도 0이면 RangeError를 던진다.
   */
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

/**
 * sf::Vector2<int>.
 * @zh sf::Vector2<int>，整型二维向量。
 * @ja sf::Vector2<int>。整数型の 2 次元ベクトル。
 * @ko sf::Vector2<int>. 정수형 2차원 벡터.
 */
export class Vector2i extends Vector2<'i32'> {
  /**
   * Create a signed 32-bit integer zero vector.
   * @zh 创建有符号 32 位整数零向量。
   * @ja 符号付き 32 ビット整数のゼロベクトルを作成する。
   * @ko 부호 있는 32비트 정수 영벡터를 생성한다.
   */
  constructor();
  /**
   * Create a signed 32-bit integer vector from x and y components.
   * @zh 从 x、y 分量创建有符号 32 位整数向量。
   * @ja x、y 成分から符号付き 32 ビット整数ベクトルを作成する。
   * @ko x, y 성분으로 부호 있는 32비트 정수 벡터를 생성한다.
   */
  constructor(x: number, y: number);
  /**
   * Convert and copy source into a signed 32-bit integer vector.
   * @zh 将 source 转换并复制为有符号 32 位整数向量。
   * @ja source を符号付き 32 ビット整数ベクトルに変換してコピーする。
   * @ko source를 부호 있는 32비트 정수 벡터로 변환하여 복사한다.
   */
  constructor(source: Vector2Source);
  constructor(...args: Vector2Arguments) {
    super('i32', ...args);
    this.createResult = Vector2i.makeResult;
  }

  private static makeResult(x: number, y: number): Vector2i {
    return new Vector2i(x, y);
  }
}

/**
 * sf::Vector2<unsigned int>.
 * @zh sf::Vector2<unsigned int>，无符号整型二维向量。
 * @ja sf::Vector2<unsigned int>。符号なし整数型の 2 次元ベクトル。
 * @ko sf::Vector2<unsigned int>. 부호 없는 정수형 2차원 벡터.
 */
export class Vector2u extends Vector2<'u32'> {
  /**
   * Create an unsigned 32-bit integer zero vector.
   * @zh 创建无符号 32 位整数零向量。
   * @ja 符号なし 32 ビット整数のゼロベクトルを作成する。
   * @ko 부호 없는 32비트 정수 영벡터를 생성한다.
   */
  constructor();
  /**
   * Create an unsigned 32-bit integer vector from x and y components.
   * @zh 从 x、y 分量创建无符号 32 位整数向量。
   * @ja x、y 成分から符号なし 32 ビット整数ベクトルを作成する。
   * @ko x, y 성분으로 부호 없는 32비트 정수 벡터를 생성한다.
   */
  constructor(x: number, y: number);
  /**
   * Convert and copy source into an unsigned 32-bit integer vector.
   * @zh 将 source 转换并复制为无符号 32 位整数向量。
   * @ja source を符号なし 32 ビット整数ベクトルに変換してコピーする。
   * @ko source를 부호 없는 32비트 정수 벡터로 변환하여 복사한다.
   */
  constructor(source: Vector2Source);
  constructor(...args: Vector2Arguments) {
    super('u32', ...args);
    this.createResult = Vector2u.makeResult;
  }

  private static makeResult(x: number, y: number): Vector2u {
    return new Vector2u(x, y);
  }
}

/**
 * sf::Vector2<float>.
 * @zh sf::Vector2<float>，浮点型二维向量。
 * @ja sf::Vector2<float>。浮動小数点型の 2 次元ベクトル。
 * @ko sf::Vector2<float>. 부동소수점형 2차원 벡터.
 */
export class Vector2f extends Vector2<'f32'> {
  /**
   * Create a float32 zero vector.
   * @zh 创建 float32 零向量。
   * @ja float32 のゼロベクトルを作成する。
   * @ko float32 영벡터를 생성한다.
   */
  constructor();
  /**
   * Create a float32 vector from x and y components.
   * @zh 从 x、y 分量创建 float32 向量。
   * @ja x、y 成分から float32 ベクトルを作成する。
   * @ko x, y 성분으로 float32 벡터를 생성한다.
   */
  constructor(x: number, y: number);
  /**
   * Create a float32 vector from radius r and angle phi relative to the
   * positive X axis.
   * @zh 从半径 r 和相对于正 X 轴的角度 phi 创建 float32 向量。
   * @ja 半径 r と正の X 軸に対する角度 phi から float32 ベクトルを作成する。
   * @ko 반지름 r과 양의 X축에 대한 각도 phi로 float32 벡터를 생성한다.
   */
  constructor(r: number, phi: ReadonlyValue<Angle>);
  /**
   * Convert and copy source into a float32 vector.
   * @zh 将 source 转换并复制为 float32 向量。
   * @ja source を float32 ベクトルに変換してコピーする。
   * @ko source를 float32 벡터로 변환하여 복사한다.
   */
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

/**
 * Internal member view; native ownership can be resolved through its parent.
 * @zh 内部成员视图；可通过其父对象解析原生所有权。
 * @ja 内部メンバービュー。親を通じてネイティブ所有権を解決できる。
 * @ko 내부 멤버 뷰. 부모를 통해 네이티브 소유권을 확인할 수 있다.
 */
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
