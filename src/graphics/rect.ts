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

/**
 * Shared implementation of sf::Rect's two public specializations.
 * @zh sf::Rect 两个公开特化的共享实现。
 * @ja sf::Rect の二つの公開特殊化に共通の実装。
 * @ko sf::Rect의 두 공개 특수화가 공유하는 구현입니다.
 */
export class Rect<T extends RectScalar> {
  readonly [mutableValue] = true;
  /**
   * Lazy native wrapper for a rectangle value with four components.
   * @zh 矩形值的惰性原生包装，4 个分量。
   * @ja 四成分を持つ矩形値の遅延ネイティブラッパー。
   * @ko 성분 4개의 사각형 값에 대한 지연 네이티브 래퍼입니다.
   */
  private readonly state: LazyValue<'rect', Int32Array | Float32Array>;
  /**
   * Component storage type, i32 or f32.
   * @zh 分量存储类型，i32 或 f32。
   * @ja 成分の格納型。i32 または f32。
   * @ko 성분 저장 형식으로 i32 또는 f32입니다.
   */
  private readonly type: T;
  /**
   * Lazy Vector2 view cache for the position property.
   * @zh position 属性的延迟 Vector2 视图缓存。
   * @ja position プロパティの遅延 Vector2 ビューキャッシュ。
   * @ko position 속성의 지연 Vector2 뷰 캐시입니다.
   */
  private positionView?: Vector2<T>;
  /**
   * Lazy Vector2 view cache for the size property.
   * @zh size 属性的延迟 Vector2 视图缓存。
   * @ja size プロパティの遅延 Vector2 ビューキャッシュ。
   * @ko size 속성의 지연 Vector2 뷰 캐시입니다.
   */
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

  /**
   * Rectangle component type: i32 integers or f32 floating-point values.
   * @zh 矩形分量类型：i32 整数或 f32 浮点数。
   * @ja 矩形成分の型。i32 整数または f32 浮動小数点数。
   * @ko 사각형 성분 형식으로 i32 정수 또는 f32 부동소수점입니다.
   */
  get scalarType(): T {
    return this.type;
  }

  get [rectStorage](): Int32Array | Float32Array {
    return this.state.values;
  }

  get [rectNative](): NativeValueHandle<'rect'> {
    return nativeValue(this, rectNative, this.state);
  }

  /**
   * Shared view of the rectangle origin; changing x/y directly changes the
   * rectangle.
   * @zh 矩形起点的共享视图；修改 x/y 会直接修改矩形。
   * @ja 矩形の起点の共有ビュー。x/y の変更は矩形を直接変更します。
   * @ko 사각형 원점의 공유 뷰입니다. x/y를 수정하면 사각형이 직접 변경됩니다.
   */
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

  /**
   * Copies values from a vector of the same type as the rectangle origin.
   * @zh 复制同类型向量的值作为矩形起点。
   * @ja 同じ型のベクトルの値を矩形の起点としてコピーします。
   * @ko 동일한 형식의 벡터 값을 사각형 원점으로 복사합니다.
   */
  set position(value: R<Vector2<T>>) {
    this.checkVector(value);
    this[rectStorage].set(value[vector2Storage], 0);
  }

  /**
   * Shared view of width and height; negative sizes are allowed.
   * @zh 宽度和高度的共享视图；允许负尺寸。
   * @ja 幅と高さの共有ビュー。負のサイズも指定できます。
   * @ko 너비와 높이의 공유 뷰입니다. 음수 크기도 허용됩니다.
   */
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

  /**
   * Copies values from a vector of the same type as the rectangle size.
   * @zh 复制同类型向量的值作为矩形尺寸。
   * @ja 同じ型のベクトルの値を矩形のサイズとしてコピーします。
   * @ko 동일한 형식의 벡터 값을 사각형 크기로 복사합니다.
   */
  set size(value: R<Vector2<T>>) {
    this.checkVector(value);
    this[rectStorage].set(value[vector2Storage], 2);
  }

  /**
   * Tests whether a point is inside the rectangle; includes minimum edges,
   * excludes maximum edges, and supports negative sizes.
   * @zh 判断点是否位于矩形内；包括最小边界，不包括最大边界，支持负尺寸。
   * @ja 点が矩形内にあるかを判定します。最小境界を含み、最大境界を含まず、負のサイズにも対応します。
   * @ko 점이 사각형 안에 있는지 검사합니다. 최소 경계는 포함하고 최대 경계는 제외하며 음수 크기를 지원합니다.
   */
  contains(point: R<Vector2<T>>): boolean {
    this.checkVector(point);
    const data = this[rectStorage];
    const endX = toScalar(this.type, data[0] + data[2]);
    const endY = toScalar(this.type, data[1] + data[3]);
    return point.x >= min(data[0], endX) && point.x < max(data[0], endX) &&
      point.y >= min(data[1], endY) && point.y < max(data[1], endY);
  }

  /**
   * Returns a new rectangle intersecting this and a same-type rectangle;
   * returns undefined if there is no positive-area intersection.
   * @zh 返回与同类型矩形相交区域的新矩形；无正面积交集时返回 undefined。
   * @ja 同じ型の矩形との交差領域を新しい矩形で返します。正の面積の交差がなければ undefined を返します。
   * @ko 동일한 형식의 사각형과 겹치는 영역을 새 사각형으로 반환합니다. 양의 면적을 갖는 교집합이 없으면 undefined를
   * 반환합니다.
   */
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

  /**
   * Returns a copy of the center; integer rectangles halve their size using
   * integer division truncated toward zero.
   * @zh 返回中心点副本；整数矩形的半尺寸使用向零截断的整数除法。
   * @ja 中心点のコピーを返します。整数矩形では半分のサイズをゼロ方向に切り捨てる整数除算で求めます。
   * @ko 중심점 복사본을 반환합니다. 정수 사각형은 크기를 반으로 나눌 때 0 방향으로 버리는 정수 나눗셈을 사용합니다.
   */
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

  /**
   * Validates that the vector scalar type matches the rectangle.
   * @zh 校验向量标量类型与矩形一致。
   * @ja ベクトルのスカラー型が矩形と一致するかを検証します。
   * @ko 벡터 스칼라 형식이 사각형과 일치하는지 검증합니다.
   */
  private checkVector(value: R<Vector2<T>>): void {
    if (!(value instanceof Vector2) || value.scalarType !== this.type) {
      throw new TypeError('Rect requires a Vector2 with the same scalar type');
    }
  }
}

/**
 * sf::Rect<float>, sharing 16 native bytes with its member views.
 * @zh sf::Rect<float>，与成员视图共享 16 字节原生存储。
 * @ja sf::Rect<float>。メンバービューとネイティブの 16 バイトを共有します。
 * @ko sf::Rect<float>. 멤버 뷰와 네이티브 16바이트를 공유합니다.
 */
export class FloatRect extends Rect<'f32'> {
  /**
   * Creates a zero-size rectangle at the origin.
   * @zh 创建位于原点、尺寸为零的矩形。
   * @ja 原点にサイズゼロの矩形を作成します。
   * @ko 원점에 크기가 0인 사각형을 만듭니다.
   */
  constructor();
  /**
   * Converts and copies a rectangle, storing components as float32.
   * @zh 转换并复制矩形，分量按 float32 存储。
   * @ja 矩形を変換してコピーし、成分を float32 で格納します。
   * @ko 사각형을 변환하고 복사하며 성분을 float32로 저장합니다.
   */
  constructor(source: R<FloatRect | IntRect>);
  /**
   * Creates a rectangle from an origin and size, copying both vectors' values.
   * @zh 从起点和尺寸创建矩形，复制两个向量的值。
   * @ja 起点とサイズから矩形を作成し、両ベクトルの値をコピーします。
   * @ko 원점과 크기로 사각형을 만들고 두 벡터의 값을 복사합니다.
   */
  constructor(position: R<Vector2f>, size: R<Vector2f>);
  constructor(...args: RectArguments<'f32'>) {
    super('f32', ...args);
    this.createResult = FloatRect.makeResult;
  }

  /**
   * Creates an empty instance for FloatRect's protected createResult.
   * @zh 为 FloatRect 的受保护 createResult 创建空实例。
   * @ja FloatRect の protected な createResult 用に空のインスタンスを作成します。
   * @ko FloatRect의 protected createResult용 빈 인스턴스를 만듭니다.
   */
  private static makeResult(): FloatRect {
    return new FloatRect();
  }
}

/**
 * sf::Rect<int>, with integer division in getCenter().
 * @zh sf::Rect<int>，getCenter() 使用整数除法。
 * @ja sf::Rect<int>。getCenter() では整数除算を使用します。
 * @ko sf::Rect<int>. getCenter()에서 정수 나눗셈을 사용합니다.
 */
export class IntRect extends Rect<'i32'> {
  /**
   * Creates a zero-size rectangle at the origin.
   * @zh 创建位于原点、尺寸为零的矩形。
   * @ja 原点にサイズゼロの矩形を作成します。
   * @ko 원점에 크기가 0인 사각형을 만듭니다.
   */
  constructor();
  /**
   * Converts and copies a rectangle, storing components as signed 32-bit
   * integers.
   * @zh 转换并复制矩形，分量按有符号 32 位整数存储。
   * @ja 矩形を変換してコピーし、成分を符号付き 32 ビット整数で格納します。
   * @ko 사각형을 변환하고 복사하며 성분을 부호 있는 32비트 정수로 저장합니다.
   */
  constructor(source: R<FloatRect | IntRect>);
  /**
   * Creates a rectangle from an origin and size, copying both vectors' values.
   * @zh 从起点和尺寸创建矩形，复制两个向量的值。
   * @ja 起点とサイズから矩形を作成し、両ベクトルの値をコピーします。
   * @ko 원점과 크기로 사각형을 만들고 두 벡터의 값을 복사합니다.
   */
  constructor(position: R<Vector2i>, size: R<Vector2i>);
  constructor(...args: RectArguments<'i32'>) {
    super('i32', ...args);
    this.createResult = IntRect.makeResult;
  }

  /**
   * Creates an empty instance for IntRect's protected createResult.
   * @zh 为 IntRect 的受保护 createResult 创建空实例。
   * @ja IntRect の protected な createResult 用に空のインスタンスを作成します。
   * @ko IntRect의 protected createResult용 빈 인스턴스를 만듭니다.
   */
  private static makeResult(): IntRect {
    return new IntRect();
  }
}

/**
 * Internal alias for a native-owned rectangle member.
 * @zh 原生层拥有的矩形成员的内部别名。
 * @ja ネイティブ所有の矩形メンバーへの内部エイリアス。
 * @ko 네이티브 소유 사각형 멤버의 내부 별칭입니다.
 */
export function intRectFromState(
  state: LazyValue<'rect', Int32Array>,
): IntRect {
  return Object.assign(Object.create(IntRect.prototype), {
    [mutableValue]: true, type: 'i32', state,
    createResult: () => new IntRect(),
  });
}

/**
 * Internal alias for a native-owned floating-point rectangle member.
 * @zh 原生层拥有的浮点矩形成员的内部别名。
 * @ja ネイティブ所有の浮動小数点矩形メンバーへの内部エイリアス。
 * @ko 네이티브 소유 부동소수점 사각형 멤버의 내부 별칭입니다.
 */
export function floatRectFromState(
  state: LazyValue<'rect', Float32Array>,
): FloatRect {
  return Object.assign(Object.create(FloatRect.prototype), {
    [mutableValue]: true, type: 'f32', state,
    createResult: () => new FloatRect(),
  });
}
