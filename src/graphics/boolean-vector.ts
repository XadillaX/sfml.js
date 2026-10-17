import { BooleanComponents, glslStorage } from '../internal/glsl-value';
import { native } from '../internal/native';
import type { ReadonlyValue as R } from '../internal/value-storage';
import { Vector2 } from '../system/vector2';
import { Vector3 } from '../system/vector3';
import type { ScalarType } from '../internal/scalar';

/**
 * Boolean vector operation base; numeric results convert nonzero to true.
 * @zh 布尔向量运算基类，数值结果以非零为 true 转换。
 * @ja ブールベクトル演算の基底クラス。数値結果の非ゼロを true に変換します。
 * @ko 불리언 벡터 연산의 기반 클래스입니다. 숫자 결과가 0이 아니면 true로 변환합니다.
 */
export abstract class BooleanVector<K extends 'vector2' | 'vector3'>
  extends BooleanComponents<K> {
  protected checkPair(rhs: R<BooleanVector<K>>): void {
    if (!(rhs instanceof BooleanVector) ||
        this[glslStorage].length !== rhs[glslStorage].length) {
      throw new TypeError('Boolean vector operands must have the same dimension');
    }
  }

  /**
   * Computes the dot product and converts it to boolean; returns true if any
   * corresponding component pair is both true.
   * @zh 计算点积后转换为布尔值；任一对应分量同时为 true 时返回 true。
   * @ja 内積を計算してブール値に変換します。対応する成分の組が一つでも両方 true なら true を返します。
   * @ko 내적을 계산하여 불리언으로 변환합니다. 대응하는 성분 쌍 중 하나라도 둘 다 true이면 true를 반환합니다.
   */
  dot(rhs: R<BooleanVector<K>>): boolean {
    this.checkPair(rhs);
    const a = this[glslStorage];
    const b = rhs[glslStorage];
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
    return sum !== 0;
  }

  /**
   * Returns whether at least one component is true.
   * @zh 返回是否至少有一个分量为 true。
   * @ja 少なくとも一つの成分が true かを返します。
   * @ko 성분 중 하나 이상이 true인지 반환합니다.
   */
  lengthSquared(): boolean {
    return this.dot(this);
  }

  protected checkDivisor(rhs: R<BooleanVector<K>>): void {
    this.checkPair(rhs);
    if (rhs[glslStorage].includes(0)) {
      throw new RangeError('Cannot divide by zero');
    }
  }
}

type Source2 = R<Bvec2> | R<Vector2<ScalarType>>;
type Arguments2 = [] | [ x: boolean, y: boolean ] | [ source: Source2 ];

/**
 * sf::Vector2<bool>; each component occupies one canonical 0/1 byte.
 * @zh sf::Vector2<bool>；每个分量占用一个规范化的 0/1 字节。
 * @ja sf::Vector2<bool>。各成分は正規化された 0/1 の 1 バイトを占めます。
 * @ko sf::Vector2<bool>. 각 성분은 정규화된 0/1 바이트 하나를 차지합니다.
 */
export class Bvec2 extends BooleanVector<'vector2'> {
  /**
   * Creates an all-false vector, specifies x/y, or copies a 2D vector with
   * nonzero converted to true.
   * @zh 创建全 false 向量，指定 x/y，或按非零为 true 转换复制二维向量。
   * @ja 全成分 false のベクトルを作成するか、x/y を指定するか、非ゼロを true に変換して二次元ベクトルをコピーします。
   * @ko 모든 성분이 false인 벡터를 만들거나 x/y를 지정하거나 0이 아닌 값을 true로 변환하여 2차원 벡터를 복사합니다.
   */
  constructor(...args: Arguments2) {
    const source = args[0];
    const components = args.length === 0 || (args.length === 2 &&
      typeof source === 'boolean' && typeof args[1] === 'boolean');
    const copy = args.length === 1 &&
      (source instanceof Bvec2 || source instanceof Vector2);
    if (!components && !copy) {
      throw new TypeError('Expected a boolean pair or a two-dimensional vector');
    }
    super(typeof source === 'object'
      ? [ source.x, source.y ] : [ source ?? false, args[1] ?? false ],
    buffer => native.wrapVector2('bool', buffer));
  }

  /**
   * Returns a new vector from (-y, x) converted to boolean components, namely
   * (y, x).
   * @zh 返回 (-y, x) 转换为布尔分量后的新向量，即 (y, x)。
   * @ja (-y, x) をブール成分に変換した新しいベクトル、つまり (y, x) を返します。
   * @ko (-y, x)를 불리언 성분으로 변환한 새 벡터, 즉 (y, x)를 반환합니다.
   */
  perpendicular(): Bvec2 {
    // Negating a bool promotes to int and converts back to the same bool.
    return new Bvec2(this.y, this.x);
  }

  /**
   * Computes the 2D cross product and converts nonzero to true.
   * @zh 计算二维叉积并按非零为 true 转换。
   * @ja 二次元の外積を計算し、非ゼロを true に変換します。
   * @ko 2차원 외적을 계산하고 0이 아닌 값을 true로 변환합니다.
   */
  cross(rhs: R<Bvec2>): boolean {
    this.checkPair(rhs);
    const a = this[glslStorage];
    const b = rhs[glslStorage];
    return a[0] * b[1] - a[1] * b[0] !== 0;
  }

  /**
   * Returns a new vector with component-wise logical AND.
   * @zh 返回逐分量逻辑与的新向量。
   * @ja 成分ごとの論理積による新しいベクトルを返します。
   * @ko 성분별 논리 AND를 적용한 새 벡터를 반환합니다.
   */
  componentWiseMul(rhs: R<Bvec2>): Bvec2 {
    this.checkPair(rhs);
    return new Bvec2(this.x && rhs.x, this.y && rhs.y);
  }

  /**
   * Returns a copy of this vector; throws RangeError if any rhs component is
   * false.
   * @zh 返回本向量副本；rhs 任一分量为 false 时抛出 RangeError。
   * @ja このベクトルのコピーを返します。rhs の成分が一つでも false なら RangeError を投げます。
   * @ko 이 벡터의 복사본을 반환합니다. rhs 성분 중 하나라도 false이면 RangeError를 던집니다.
   */
  componentWiseDiv(rhs: R<Bvec2>): Bvec2 {
    this.checkDivisor(rhs);
    return new Bvec2(this);
  }
}

type Source3 = R<Bvec3> | R<Vector3<ScalarType>>;
type Arguments3 =
  [] | [ x: boolean, y: boolean, z: boolean ] | [ source: Source3 ];

/**
 * sf::Vector3<bool>, sharing the same native family as numeric Vector3.
 * @zh sf::Vector3<bool>，与数值 Vector3 共用同一个原生类型族。
 * @ja sf::Vector3<bool>。数値型 Vector3 と同じネイティブファミリーを共有します。
 * @ko sf::Vector3<bool>. 숫자형 Vector3와 동일한 네이티브 계열을 공유합니다.
 */
export class Bvec3 extends BooleanVector<'vector3'> {
  /**
   * Creates an all-false vector, specifies x/y/z, or copies a 3D vector with
   * nonzero converted to true.
   * @zh 创建全 false 向量，指定 x/y/z，或按非零为 true 转换复制三维向量。
   * @ja 全成分 false のベクトルを作成するか、x/y/z を指定するか、非ゼロを true に変換して三次元ベクトルをコピーします。
   * @ko 모든 성분이 false인 벡터를 만들거나 x/y/z를 지정하거나 0이 아닌 값을 true로 변환하여 3차원 벡터를 복사합니다.
   */
  constructor(...args: Arguments3) {
    const source = args[0];
    const components = args.length === 0 || (args.length === 3 &&
      typeof source === 'boolean' && typeof args[1] === 'boolean' &&
      typeof args[2] === 'boolean');
    const copy = args.length === 1 &&
      (source instanceof Bvec3 || source instanceof Vector3);
    if (!components && !copy) {
      throw new TypeError('Expected a boolean triple or a three-dimensional vector');
    }
    super(typeof source === 'object'
      ? [ source.x, source.y, source.z ]
      : [ source ?? false, args[1] ?? false, args[2] ?? false ],
    buffer => native.wrapVector3('bool', buffer));
  }

  /**
   * Z boolean component.
   * @zh Z 布尔分量。
   * @ja Z ブール成分。
   * @ko Z 불리언 성분입니다.
   */
  get z(): boolean { return this[glslStorage][2] !== 0; }
  /**
   * Sets the Z component, stored as a 0/1 byte.
   * @zh 设置 Z 分量，按 0/1 字节存储。
   * @ja Z 成分を設定し、0/1 のバイトで格納します。
   * @ko Z 성분을 설정하며 0/1 바이트로 저장합니다.
   */
  set z(value: boolean) { this[glslStorage][2] = value ? 1 : 0; }

  /**
   * Computes the 3D cross product and converts each nonzero component to true.
   * @zh 计算三维叉积后将各分量按非零为 true 转换。
   * @ja 三次元の外積を計算し、各成分の非ゼロを true に変換します。
   * @ko 3차원 외적을 계산하고 각 성분이 0이 아니면 true로 변환합니다.
   */
  cross(rhs: R<Bvec3>): Bvec3 {
    this.checkPair(rhs);
    const a = this[glslStorage];
    const b = rhs[glslStorage];
    return new Bvec3(
      a[1] * b[2] - a[2] * b[1] !== 0,
      a[2] * b[0] - a[0] * b[2] !== 0,
      a[0] * b[1] - a[1] * b[0] !== 0,
    );
  }

  /**
   * Returns a new vector with component-wise logical AND.
   * @zh 返回逐分量逻辑与的新向量。
   * @ja 成分ごとの論理積による新しいベクトルを返します。
   * @ko 성분별 논리 AND를 적용한 새 벡터를 반환합니다.
   */
  componentWiseMul(rhs: R<Bvec3>): Bvec3 {
    this.checkPair(rhs);
    return new Bvec3(this.x && rhs.x, this.y && rhs.y, this.z && rhs.z);
  }

  /**
   * Returns a copy of this vector; throws RangeError if any rhs component is
   * false.
   * @zh 返回本向量副本；rhs 任一分量为 false 时抛出 RangeError。
   * @ja このベクトルのコピーを返します。rhs の成分が一つでも false なら RangeError を投げます。
   * @ko 이 벡터의 복사본을 반환합니다. rhs 성분 중 하나라도 false이면 RangeError를 던집니다.
   */
  componentWiseDiv(rhs: R<Bvec3>): Bvec3 {
    this.checkDivisor(rhs);
    return new Bvec3(this);
  }
}
