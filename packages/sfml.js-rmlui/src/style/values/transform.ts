import { native } from '../../internal/native';
import { propertyFromNative, type Property } from '../properties/property';
import type { NumericValueSnapshot } from '../effects/decoration-values';
import type { VariantVector3, VariantVector4 } from '../../values/types';

/**
 * Exact Rml::TransformPrimitive::Type discriminators.
 *
 * @zh 与 Rml::TransformPrimitive::Type 一致的类型标识。
 * @ja Rml::TransformPrimitive::Type と一致する型識別子。
 * @ko Rml::TransformPrimitive::Type과 동일한 형식 식별자입니다.
 */
export enum TransformPrimitiveType {
  /**
   * Matrix2D, six coefficients in native order.
   *
   * @zh 二维矩阵，六个系数使用原生顺序。
   * @ja ネイティブ順の 6 係数を持つ二次元行列。
   * @ko 네이티브 순서의 계수 6개를 가진 2차원 행렬입니다.
   */
  MATRIX2D = 0,
  /**
   * Matrix3D, sixteen column-major coefficients.
   *
   * @zh 三维矩阵，十六个系数使用列主序。
   * @ja 列優先の 16 係数を持つ三次元行列。
   * @ko 열 우선 계수 16개를 가진 3차원 행렬입니다.
   */
  MATRIX3D,
  /**
   * TranslateX.
   *
   * @zh X 轴平移。
   * @ja X 軸の平行移動。
   * @ko X축 이동입니다.
   */
  TRANSLATEX,
  /**
   * TranslateY.
   *
   * @zh Y 轴平移。
   * @ja Y 軸の平行移動。
   * @ko Y축 이동입니다.
   */
  TRANSLATEY,
  /**
   * TranslateZ.
   *
   * @zh Z 轴平移。
   * @ja Z 軸の平行移動。
   * @ko Z축 이동입니다.
   */
  TRANSLATEZ,
  /**
   * Translate2D, x/y.
   *
   * @zh 二维平移，依次为 x/y。
   * @ja 二次元の平行移動。x/y 順。
   * @ko 2차원 이동이며 x/y 순서입니다.
   */
  TRANSLATE2D,
  /**
   * Translate3D, x/y/z.
   *
   * @zh 三维平移，依次为 x/y/z。
   * @ja 三次元の平行移動。x/y/z 順。
   * @ko 3차원 이동이며 x/y/z 순서입니다.
   */
  TRANSLATE3D,
  /**
   * ScaleX.
   *
   * @zh X 轴缩放。
   * @ja X 軸の拡大縮小。
   * @ko X축 배율입니다.
   */
  SCALEX,
  /**
   * ScaleY.
   *
   * @zh Y 轴缩放。
   * @ja Y 軸の拡大縮小。
   * @ko Y축 배율입니다.
   */
  SCALEY,
  /**
   * ScaleZ.
   *
   * @zh Z 轴缩放。
   * @ja Z 軸の拡大縮小。
   * @ko Z축 배율입니다.
   */
  SCALEZ,
  /**
   * Scale2D, x/y.
   *
   * @zh 二维缩放，依次为 x/y。
   * @ja 二次元の拡大縮小。x/y 順。
   * @ko 2차원 배율이며 x/y 순서입니다.
   */
  SCALE2D,
  /**
   * Scale3D, x/y/z.
   *
   * @zh 三维缩放，依次为 x/y/z。
   * @ja 三次元の拡大縮小。x/y/z 順。
   * @ko 3차원 배율이며 x/y/z 순서입니다.
   */
  SCALE3D,
  /**
   * RotateX, radians.
   *
   * @zh X 轴旋转，弧度。
   * @ja X 軸の回転。ラジアン。
   * @ko X축 회전이며 라디안입니다.
   */
  ROTATEX,
  /**
   * RotateY, radians.
   *
   * @zh Y 轴旋转，弧度。
   * @ja Y 軸の回転。ラジアン。
   * @ko Y축 회전이며 라디안입니다.
   */
  ROTATEY,
  /**
   * RotateZ, radians.
   *
   * @zh Z 轴旋转，弧度。
   * @ja Z 軸の回転。ラジアン。
   * @ko Z축 회전이며 라디안입니다.
   */
  ROTATEZ,
  /**
   * Rotate2D, radians.
   *
   * @zh 二维旋转，弧度。
   * @ja 二次元の回転。ラジアン。
   * @ko 2차원 회전이며 라디안입니다.
   */
  ROTATE2D,
  /**
   * Rotate3D, axis x/y/z then angle in radians.
   *
   * @zh 三维旋转，依次为轴 x/y/z 和弧度角。
   * @ja 三次元の回転。軸 x/y/z とラジアン角。
   * @ko 3차원 회전이며 축 x/y/z와 라디안 각도입니다.
   */
  ROTATE3D,
  /**
   * SkewX, radians.
   *
   * @zh X 轴倾斜，弧度。
   * @ja X 軸のスキュー。ラジアン。
   * @ko X축 기울기이며 라디안입니다.
   */
  SKEWX,
  /**
   * SkewY, radians.
   *
   * @zh Y 轴倾斜，弧度。
   * @ja Y 軸のスキュー。ラジアン。
   * @ko Y축 기울기이며 라디안입니다.
   */
  SKEWY,
  /**
   * Skew2D, x/y angles in radians.
   *
   * @zh 二维倾斜，x/y 角度使用弧度。
   * @ja 二次元のスキュー。x/y 角はラジアン。
   * @ko 2차원 기울기이며 x/y 각도는 라디안입니다.
   */
  SKEW2D,
  /**
   * Perspective, unresolved distance.
   *
   * @zh 透视，保留未解析的距离。
   * @ja 未解決の距離を持つ透視変換。
   * @ko 해석되지 않은 거리의 원근 변환입니다.
   */
  PERSPECTIVE,
  /**
   * DecomposedMatrix4, five named vector fields.
   *
   * @zh 分解的四维矩阵，包含五个具名向量字段。
   * @ja 5 個の名前付きベクトルを持つ分解行列。
   * @ko 이름 있는 벡터 필드 5개를 가진 분해 행렬입니다.
   */
  DECOMPOSEDMATRIX4,
}

/**
 * Primitive types with ordered component arrays.
 *
 * @zh 使用有序分量数组的原语类型。
 * @ja 順序付き成分配列を持つプリミティブの型。
 * @ko 순서 있는 성분 배열을 사용하는 기본 변환 형식입니다.
 */
export type TransformArrayPrimitiveType = Exclude<
TransformPrimitiveType, TransformPrimitiveType.DECOMPOSEDMATRIX4
>;

/**
 * Exact native component tuple selected by the primitive type.
 *
 * @zh 根据原语类型选择与原生数量一致的分量元组。
 * @ja プリミティブ型で選択するネイティブと同じ要素数のタプル。
 * @ko 기본 변환 형식으로 선택하는 네이티브와 동일한 개수의 성분 튜플입니다.
 * @template K - Primitive type selecting lengths, angles or matrix entries.
 * @zh K - 选择长度、角度或矩阵分量的原语类型。
 * @ja K - 長さ、角度、行列成分を選択するプリミティブ型。
 * @ko K - 길이, 각도 또는 행렬 성분을 선택하는 기본 변환 형식입니다.
 */
export type TransformPrimitiveValues<K extends TransformArrayPrimitiveType> =
  K extends TransformPrimitiveType.MATRIX2D ?
    [number, number, number, number, number, number] :
    K extends TransformPrimitiveType.MATRIX3D ? [
      number, number, number, number,
      number, number, number, number,
      number, number, number, number,
      number, number, number, number,
    ] :
      K extends TransformPrimitiveType.TRANSLATE2D ?
        [NumericValueSnapshot, NumericValueSnapshot] :
        K extends TransformPrimitiveType.TRANSLATE3D ?
          [NumericValueSnapshot, NumericValueSnapshot, NumericValueSnapshot] :
          K extends TransformPrimitiveType.TRANSLATEX |
          TransformPrimitiveType.TRANSLATEY |
          TransformPrimitiveType.TRANSLATEZ |
          TransformPrimitiveType.PERSPECTIVE ? [NumericValueSnapshot] :
            K extends TransformPrimitiveType.SCALE2D |
            TransformPrimitiveType.SKEW2D ? [number, number] :
              K extends TransformPrimitiveType.SCALE3D ?
                [number, number, number] :
                K extends TransformPrimitiveType.ROTATE3D ?
                  [number, number, number, number] :
                  [number];

/**
 * Array primitive snapshot preserving its native discriminator and arity.
 *
 * @zh 数组原语快照，保留原生类型标识和分量数量。
 * @ja ネイティブの型識別子と要素数を保持する配列プリミティブのコピー。
 * @ko 네이티브 형식 식별자와 성분 개수를 유지하는 배열 기본 변환 스냅샷입니다.
 * @template K - Native primitive type determining the component tuple.
 * @zh K - 决定分量元组的原生原语类型。
 * @ja K - 成分タプルを決定するネイティブプリミティブ型。
 * @ko K - 성분 튜플을 결정하는 네이티브 기본 변환 형식입니다.
 */
export interface TransformPrimitiveRecord<
  K extends TransformArrayPrimitiveType
> {
  /**
   * Active native union member.
   *
   * @zh 原生联合体当前成员。
   * @ja ネイティブ共用体の有効なメンバー。
   * @ko 네이티브 공용체의 활성 멤버입니다.
   */
  type: K;

  /**
   * Copied native components; resolved angles are radians.
   *
   * @zh 原生分量副本；已解析角度使用弧度。
   * @ja ネイティブ成分のコピー。解決済みの角はラジアン。
   * @ko 네이티브 성분 복사본이며 해석된 각도는 라디안입니다.
   */
  values: TransformPrimitiveValues<K>;
}

/**
 * Copied Rml::Transforms::DecomposedMatrix4.
 *
 * @zh Rml::Transforms::DecomposedMatrix4 的副本。
 * @ja Rml::Transforms::DecomposedMatrix4 のコピー。
 * @ko Rml::Transforms::DecomposedMatrix4의 복사본입니다.
 */
export interface DecomposedMatrix4 {
  /**
   * Decomposed matrix discriminator.
   *
   * @zh 分解矩阵的类型标识。
   * @ja 分解行列の型識別子。
   * @ko 분해 행렬의 형식 식별자입니다.
   */
  type: TransformPrimitiveType.DECOMPOSEDMATRIX4;

  /**
   * Perspective vector.
   *
   * @zh 透视向量。
   * @ja 透視ベクトル。
   * @ko 원근 벡터입니다.
   */
  perspective: VariantVector4;

  /**
   * Rotation quaternion in x/y/z/w order.
   *
   * @zh 旋转四元数，顺序为 x/y/z/w。
   * @ja x/y/z/w 順の回転クォータニオン。
   * @ko x/y/z/w 순서의 회전 쿼터니언입니다.
   */
  quaternion: VariantVector4;

  /**
   * Translation vector.
   *
   * @zh 平移向量。
   * @ja 平行移動ベクトル。
   * @ko 이동 벡터입니다.
   */
  translation: VariantVector3;

  /**
   * Scale vector.
   *
   * @zh 缩放向量。
   * @ja 拡大縮小ベクトル。
   * @ko 배율 벡터입니다.
   */
  scale: VariantVector3;

  /**
   * Skew vector.
   *
   * @zh 倾斜向量。
   * @ja スキューベクトル。
   * @ko 기울기 벡터입니다.
   */
  skew: VariantVector3;
}

/**
 * All 22 native primitives as a discriminated union of copied fields.
 *
 * @zh 全部 22 种原语的字段副本，使用可区分联合类型。
 * @ja 全 22 種のネイティブプリミティブのフィールドを持つ判別可能な共用体。
 * @ko 22개 네이티브 기본 변환의 필드 복사본을 가진 판별 가능한 공용체입니다.
 */
export type TransformPrimitive = {
  [K in TransformArrayPrimitiveType]: TransformPrimitiveRecord<K>;
}[TransformArrayPrimitiveType] | DecomposedMatrix4;

/**
 * Owned TransformPtr snapshot; null primitives preserve a null native pointer.
 *
 * @zh 自有 TransformPtr 快照；primitives 为 null 时保留原生空指针。
 * @ja 所有する TransformPtr のコピー。primitives の null は空ポインター。
 * @ko 소유 TransformPtr 스냅샷이며 null primitives는 네이티브 널 포인터입니다.
 */
export interface TransformSnapshot {
  /**
   * Native Variant type discriminator.
   *
   * @zh 原生 Variant 类型标识。
   * @ja ネイティブ Variant の型識別子。
   * @ko 네이티브 Variant 형식 식별자입니다.
   */
  readonly type: 'transform';

  /**
   * Independent primitive copies; an empty array is an identity transform.
   *
   * @zh 独立原语副本；空数组表示恒等变换。
   * @ja 独立したコピー。空配列は恒等変換。
   * @ko 독립 기본 변환 복사본이며 빈 배열은 항등 변환입니다.
   */
  primitives: TransformPrimitive[] | null;
}

/**
 * Invoke an upstream NumericValue-array primitive constructor.
 *
 * @zh 调用上游接受 NumericValue 数组的原语构造函数。
 * @ja NumericValue 配列を受け取る上流のコンストラクターを呼び出します。
 * @ko NumericValue 배열을 받는 원본 생성자를 호출합니다.
 * @template K - Primitive type selecting the returned snapshot shape.
 * @zh K - 决定返回快照结构的原语类型。
 * @ja K - 戻り値の構造を選択するプリミティブ型。
 * @ko K - 반환 스냅샷 구조를 선택하는 기본 변환 형식입니다.
 * @param type - Primitive type, excluding the named-field decomposed matrix.
 * @zh type - 原语类型，不含使用具名字段的分解矩阵。
 * @ja type - プリミティブ型。名前付きフィールドの分解行列を除きます。
 * @ko type - 기본 변환 형식이며 이름 있는 필드의 분해 행렬은 제외합니다.
 * @param values - Exact native arity, accepting NumericValue instances.
 * @zh values - 数量须与原生定义一致，可传入 NumericValue 实例。
 * @ja values - ネイティブと同じ要素数。NumericValue インスタンスも使用可能。
 * @ko values - 네이티브와 동일한 개수이며 NumericValue 인스턴스도 허용합니다.
 * @returns Canonical snapshot: resolved angles in radians, lengths unresolved.
 * @zh 标准快照：已解析角度使用弧度，长度保留单位。
 * @ja 正規化したコピー。角はラジアン、長さは単位を保持します。
 * @ko 정규 스냅샷이며 각도는 라디안, 길이는 단위를 유지합니다.
 * @remarks
 * Angles accept RAD/DEG/PERCENT; Rotate3D axes require NUMBER. Scale/Matrix
 * constructors copy the number component, as upstream. For scalar overloads,
 * supply the same components explicitly: translations default to PX, angles to
 * DEG, and uniform scales repeat the scalar for each axis.
 * @zh 角度接受 RAD/DEG/PERCENT，Rotate3D 轴要求 NUMBER。缩放和矩阵按上游规则复制数值。
 * 标量重载以显式分量表达：平移默认 PX、角度默认 DEG，等比缩放为各轴重复同一数值。
 * @ja 角は RAD/DEG/PERCENT、Rotate3D の軸は NUMBER。拡大縮小と行列は数値をコピーします。
 * スカラー形式は成分を明示し、移動は PX、角は DEG、等倍拡縮は各軸に同じ値を指定します。
 * @ko 각도는 RAD/DEG/PERCENT, Rotate3D 축은 NUMBER입니다. 배율과 행렬은 숫자를 복사합니다.
 * 스칼라 형식은 성분을 명시하며 이동은 PX, 각도는 DEG, 균일 배율은 각 축에 같은 값을 씁니다.
 */
export function makeTransformPrimitive<K extends TransformArrayPrimitiveType>(
  type: K, values: readonly NumericValueSnapshot[],
): Extract<TransformPrimitive, {
  /**
   * Primitive discriminator matching the requested transform type.
   *
   * @zh 与请求的变换类型匹配的原语类型标记。
   * @ja 要求した変換型に一致するプリミティブの型タグ。
   * @ko 요청한 변환 형식과 일치하는 기본 변환 형식 태그입니다.
   */
    type: K;
  }> {
  return native.makeTransformPrimitive(type, values) as
    Extract<TransformPrimitive, { type: K }>;
}

const handles = new WeakMap<Transform, object>();

/**
 * Resolve an authentic Transform handle.
 *
 * @internal
 * @param value - Wrapper.
 * @returns Native value handle.
 */
function handle(value: Transform): object {
  const result = handles.get(value);
  if (!result) {
    throw new TypeError('Expected a Transform');
  }
  return result;
}

/**
 * Native-owned Rml::Transform with copied primitive access.
 *
 * @zh Native 持有的 Rml::Transform，原语访问使用副本。
 * @ja プリミティブをコピーしてアクセスするネイティブ所有の Rml::Transform。
 * @ko 기본 변환에 복사본으로 접근하는 네이티브 소유 Rml::Transform입니다.
 * @remarks
 * Pure values remain usable after shutdown. Attribute/Property/event assignment
 * copies primitives into a distinct native TransformPtr. Reading values returns
 * TransformSnapshot records. Property equality compares native pointers;
 * property.clone() retains it, reconstructing from a snapshot does not.
 * @zh 纯数值在关闭后仍可用。属性或事件赋值将原语复制到独立 TransformPtr；
 * 读取值返回 TransformSnapshot。Property 原生相等比较使用指针身份，
 * property.clone() 保留身份，从快照重建则不保留。
 * @ja 終了後も使用可能。属性やイベントへの代入は独立した TransformPtr にコピーし、
 * 読み取りは TransformSnapshot を返します。Property の比較はポインター同一性で、
 * property.clone() は維持しますが、コピーからの再構築は維持しません。
 * @ko 종료 후에도 사용 가능합니다. 속성이나 이벤트 대입은 별도 TransformPtr로 복사하고
 * 읽기는 TransformSnapshot을 반환합니다. Property 비교는 포인터 동일성이며
 * property.clone()은 유지하지만 스냅샷 재구성은 유지하지 않습니다.
 */
export class Transform implements TransformSnapshot {
  /**
   * Native Variant discriminator.
   *
   * @zh 原生 Variant 类型标识。
   * @ja ネイティブ Variant の型識別子。
   * @ko 네이티브 Variant 형식 식별자입니다.
   */
  readonly type = 'transform' as const;

  /**
   * Construct a native transform from copied canonical primitives.
   *
   * @zh 使用标准原语副本构造原生变换。
   * @ja 正規化したプリミティブのコピーで構築します。
   * @ko 정규 기본 변환 복사본으로 생성합니다.
   * @param primitives - Defaults to an empty identity transform.
   * @zh primitives - 默认为空的恒等变换。
   * @ja primitives - 既定値は空の恒等変換。
   * @ko primitives - 기본값은 빈 항등 변환입니다.
   */
  constructor(primitives: readonly TransformPrimitive[] = []) {
    handles.set(this, native.createTransform(primitives));
  }

  /**
   * Rml::Transform::MakeProperty, including the native transform definition.
   *
   * @zh Rml::Transform::MakeProperty，包含原生变换属性定义。
   * @ja ネイティブ定義を含む Rml::Transform::MakeProperty。
   * @ko 네이티브 정의를 포함하는 Rml::Transform::MakeProperty입니다.
   * @param primitives - Canonical primitives to copy.
   * @zh primitives - 待复制的标准原语。
   * @ja primitives - コピーする正規プリミティブ。
   * @ko primitives - 복사할 정규 기본 변환입니다.
   * @returns Property in the active runtime generation.
   * @zh 当前运行代内的属性。
   * @ja 現在の実行世代のプロパティ。
   * @ko 현재 실행 세대의 속성입니다.
   */
  static makeProperty(primitives: readonly TransformPrimitive[]): Property {
    return propertyFromNative(native.transformMakeProperty(primitives));
  }

  /**
   * GetPrimitives copy; assignment atomically replaces the native list.
   *
   * @zh GetPrimitives 副本；赋值时原子替换原生列表。
   * @ja GetPrimitives のコピー。代入はリスト全体を一括置換します。
   * @ko GetPrimitives 복사본이며 대입 시 네이티브 목록 전체를 교체합니다.
   * @returns Independent canonical primitives.
   * @zh 独立的标准原语。
   * @ja 独立した正規プリミティブ。
   * @ko 독립 정규 기본 변환입니다.
   */
  get primitives(): TransformPrimitive[] {
    return native.transformGetPrimitives(handle(this));
  }

  /**
   * Atomically replace the native primitive list with copied values.
   *
   * @zh 用复制的值原子替换原生原语列表。
   * @ja コピーした値でネイティブリスト全体を一括置換します。
   * @ko 복사한 값으로 네이티브 기본 변환 목록을 원자적으로 교체합니다.
   * @param value - Complete canonical primitive list.
   * @zh value - 完整的标准原语列表。
   * @ja value - 完全な正規プリミティブリスト。
   * @ko value - 전체 정규 기본 변환 목록입니다.
   */
  set primitives(value: TransformPrimitive[]) {
    native.transformSetPrimitives(handle(this), value);
  }

  /**
   * Remove every primitive from the transform sequence.
   *
   * @zh 清除全部原语。
   * @ja 全プリミティブを削除します。
   * @ko 모든 기본 변환을 지웁니다.
   */
  clearPrimitives(): void {
    native.transformClearPrimitives(handle(this));
  }

  /**
   * Rml::Transform::AddPrimitive, copying all components.
   *
   * @zh 复制全部分量后添加原语。
   * @ja 全成分をコピーしてプリミティブを追加します。
   * @ko 모든 성분을 복사하여 기본 변환을 추가합니다.
   * @param primitive - Canonical primitive.
   * @zh primitive - 标准原语。
   * @ja primitive - 正規プリミティブ。
   * @ko primitive - 정규 기본 변환입니다.
   */
  addPrimitive(primitive: TransformPrimitive): void {
    native.transformAddPrimitive(handle(this), primitive);
  }

  /**
   * Get the number of primitives in the transform sequence.
   *
   * @zh 获取原语数量。
   * @ja プリミティブ数を取得します。
   * @ko 기본 변환 수를 가져옵니다.
   * @returns Native list length.
   * @zh 原生列表长度。
   * @ja ネイティブリストの長さ。
   * @ko 네이티브 목록 길이입니다.
   */
  getNumPrimitives(): number {
    return native.transformGetNumPrimitives(handle(this));
  }

  /**
   * Checked Rml::Transform::GetPrimitive, returning an independent copy.
   *
   * @zh 检查索引后调用 GetPrimitive，返回独立副本。
   * @ja インデックス検証付き GetPrimitive。独立したコピーを返します。
   * @ko 인덱스를 검사하는 GetPrimitive이며 독립 복사본을 반환합니다.
   * @param index - Zero-based index; out of range throws.
   * @zh index - 从零开始的索引，越界时抛出异常。
   * @ja index - ゼロ始まり。範囲外は例外。
   * @ko index - 0부터 시작하며 범위를 벗어나면 예외입니다.
   * @returns Canonical primitive.
   * @zh 标准原语。
   * @ja 正規プリミティブ。
   * @ko 정규 기본 변환입니다.
   */
  getPrimitive(index: number): TransformPrimitive {
    return native.transformGetPrimitive(handle(this), index);
  }
}
