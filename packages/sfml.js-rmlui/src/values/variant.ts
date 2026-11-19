import { markAsUntransferable } from 'node:worker_threads';
import { native, type NativeVariant } from '../internal/native';
import {
  variantFromNative, variantToNative,
} from '../internal/animation-values';
import { Element } from '../dom/elements/element';
import type {
  VariantConversionDefault, VariantResult, VariantValue, VariantReadValue,
} from './types';

/**
 * Exact Rml::Variant::Type values, matching the upstream character codes.
 *
 * @zh 精确对应上游字符编码的 Rml::Variant::Type。
 * @ja 上流の文字コードに一致する Rml::Variant::Type。
 * @ko 업스트림 문자 코드와 일치하는 Rml::Variant::Type입니다.
 */
export enum VariantType {
  /**
   * Empty.
   *
   * @zh 空值。
   * @ja 空。
   * @ko 빈 값입니다.
   */
  NONE = 45,
  /**
   * Boolean.
   *
   * @zh 布尔值。
   * @ja 真偽値。
   * @ko 불리언입니다.
   */
  BOOL = 66,
  /**
   * Byte.
   *
   * @zh 字节。
   * @ja バイト。
   * @ko 바이트입니다.
   */
  BYTE = 98,
  /**
   * Native char.
   *
   * @zh 原生 char。
   * @ja ネイティブ char。
   * @ko 네이티브 char입니다.
   */
  CHAR = 99,
  /**
   * Float.
   *
   * @zh 单精度浮点。
   * @ja 単精度。
   * @ko 단정밀도입니다.
   */
  FLOAT = 102,
  /**
   * Double.
   *
   * @zh 双精度浮点。
   * @ja 倍精度。
   * @ko 배정밀도입니다.
   */
  DOUBLE = 100,
  /**
   * Signed int.
   *
   * @zh 有符号 int。
   * @ja 符号付き int。
   * @ko 부호 있는 int입니다.
   */
  INT = 105,
  /**
   * Signed 64-bit.
   *
   * @zh 有符号 64 位。
   * @ja 符号付き 64 ビット。
   * @ko 부호 있는 64비트입니다.
   */
  INT64 = 73,
  /**
   * Unsigned int.
   *
   * @zh 无符号 int。
   * @ja 符号なし int。
   * @ko 부호 없는 int입니다.
   */
  UINT = 117,
  /**
   * Unsigned 64-bit.
   *
   * @zh 无符号 64 位。
   * @ja 符号なし 64 ビット。
   * @ko 부호 없는 64비트입니다.
   */
  UINT64 = 85,
  /**
   * String.
   *
   * @zh 字符串。
   * @ja 文字列。
   * @ko 문자열입니다.
   */
  STRING = 115,
  /**
   * Vector2f.
   *
   * @zh 二维浮点向量。
   * @ja 2 次元実数ベクトル。
   * @ko 2차원 실수 벡터입니다.
   */
  VECTOR2 = 50,
  /**
   * Vector3f.
   *
   * @zh 三维浮点向量。
   * @ja 3 次元実数ベクトル。
   * @ko 3차원 실수 벡터입니다.
   */
  VECTOR3 = 51,
  /**
   * Vector4f.
   *
   * @zh 四维浮点向量。
   * @ja 4 次元実数ベクトル。
   * @ko 4차원 실수 벡터입니다.
   */
  VECTOR4 = 52,
  /**
   * Float colour.
   *
   * @zh 浮点颜色。
   * @ja 実数色。
   * @ko 실수 색상입니다.
   */
  COLOURF = 103,
  /**
   * Byte colour.
   *
   * @zh 字节颜色。
   * @ja バイト色。
   * @ko 바이트 색상입니다.
   */
  COLOURB = 104,
  /**
   * ScriptInterface pointer.
   *
   * @zh 脚本接口指针。
   * @ja スクリプト参照。
   * @ko 스크립트 참조입니다.
   */
  SCRIPTINTERFACE = 112,
  /**
   * Transform pointer.
   *
   * @zh 变换指针。
   * @ja 変換参照。
   * @ko 변환 참조입니다.
   */
  TRANSFORMPTR = 116,
  /**
   * Transitions.
   *
   * @zh 过渡列表。
   * @ja 遷移一覧。
   * @ko 전환 목록입니다.
   */
  TRANSITIONLIST = 84,
  /**
   * Animations.
   *
   * @zh 动画列表。
   * @ja アニメーション一覧。
   * @ko 애니메이션 목록입니다.
   */
  ANIMATIONLIST = 65,
  /**
   * Decorators.
   *
   * @zh 装饰器列表。
   * @ja 装飾一覧。
   * @ko 장식 목록입니다.
   */
  DECORATORSPTR = 68,
  /**
   * Filters.
   *
   * @zh 滤镜列表。
   * @ja フィルター一覧。
   * @ko 필터 목록입니다.
   */
  FILTERSPTR = 70,
  /**
   * Font effects.
   *
   * @zh 字体效果列表。
   * @ja 文字効果一覧。
   * @ko 글꼴 효과 목록입니다.
   */
  FONTEFFECTSPTR = 69,
  /**
   * Colour stops.
   *
   * @zh 渐变色标列表。
   * @ja 色停止点一覧。
   * @ko 그라데이션 색상점 목록입니다.
   */
  COLORSTOPLIST = 67,
  /**
   * Box shadows.
   *
   * @zh 阴影列表。
   * @ja 影一覧。
   * @ko 그림자 목록입니다.
   */
  BOXSHADOWLIST = 83,
  /**
   * Opaque native pointer.
   *
   * @zh 不透明原生指针。
   * @ja 不透明参照。
   * @ko 불투명 참조입니다.
   */
  VOIDPTR = 42,
}

/**
 * Native GetInto result, including destination changes on conversion failure.
 *
 * @zh 原生 GetInto 结果，转换失败后也保留目标值的原生修改。
 * @ja GetInto の結果。失敗時も変換先へのネイティブ変更を保持します。
 * @ko GetInto 결과이며 실패 시에도 변환 대상의 네이티브 변경을 보존합니다.
 * @template T - JavaScript destination type.
 * @zh T - JavaScript 目标类型。
 * @ja T - JavaScript の変換先型。
 * @ko T - JavaScript 대상 형식입니다.
 */
export interface VariantConversion<T> {
  /**
   * Native conversion success.
   *
   * @zh 原生转换是否成功。
   * @ja ネイティブ変換の成否。
   * @ko 네이티브 변환 성공 여부입니다.
   */
  readonly success: boolean;

  /**
   * Output value, including the original default on failed scalar conversion.
   *
   * @zh 输出值，标量转换失败时保留原默认值。
   * @ja 出力値。スカラー変換失敗時は元の既定値です。
   * @ko 출력 값이며 스칼라 변환 실패 시 원래 기본값을 유지합니다.
   */
  readonly value: T;
}

const variants = new WeakMap<Variant, NativeVariant>();

/**
 * Resolve an owned mapping without exposing its shared metadata.
 *
 * @internal
 * @param value - Owned Variant.
 * @returns Native mapping.
 */
function mapping(value: Variant): NativeVariant {
  const result = variants.get(value);
  if (!result) {
    throw new TypeError('Expected a Variant');
  }
  return result;
}

/**
 * Resolve a checked owned Variant input.
 *
 * @internal
 * @param value - Owned facade.
 * @returns Native handle.
 */
export function variantHandle(value: Variant): object {
  return mapping(value).handle;
}

/**
 * Native-owned Rml::Variant with shared type metadata.
 *
 * @zh Native 持有的 Rml::Variant，类型元数据通过共享内存读取。
 * @ja ネイティブ所有の Rml::Variant。型情報は共有メモリーで読み取ります。
 * @ko 네이티브 소유 Rml::Variant이며 형식 메타데이터는 공유 메모리로 읽습니다.
 * @remarks
 * Shutdown clears storage before releasing runtime resources. Copied pointer
 * values share guarded lifetime slots. Aggregate outputs are independent
 * snapshots; GetReference checks storage before reading its native reference.
 * @zh 关闭时先清空存储再释放运行资源。指针副本共享受保护的生命周期槽。
 * 聚合输出是独立快照；GetReference 先检查存储类型再读取原生引用。
 * @ja 終了時は資源解放前に格納値を消去します。参照のコピーは寿命スロットを共有します。
 * 複合出力は独立したコピーです。GetReference は格納型を確認して参照を読みます。
 * @ko 종료 시 리소스 해제 전에 저장 값을 비웁니다. 포인터 복사본은 수명 슬롯을 공유합니다.
 * 복합 출력은 독립 스냅샷이며 GetReference는 형식 확인 후 참조를 읽습니다.
 */
export class Variant {
  /**
   * Construct an empty value, native value, or native copy.
   *
   * @zh 构造空值、原生值或原生副本。
   * @ja 空値、ネイティブ値、またはネイティブコピーを構築します。
   * @ko 빈 값, 네이티브 값 또는 네이티브 복사본을 생성합니다.
   * @param value - Value; omitted means NONE.
   * @zh value - 值；省略时为 NONE。
   * @ja value - 値。省略時は NONE。
   * @ko value - 값이며 생략하면 NONE입니다.
   */
  constructor(value?: VariantValue) {
    const owned = native.createVariant(variantToNative(value));
    markAsUntransferable(owned.typeView.buffer);
    variants.set(this, owned);
  }

  /**
   * Copy the stored value into JavaScript.
   *
   * @zh 将存储值复制到 JavaScript。
   * @ja 格納値を JavaScript にコピーします。
   * @ko 저장 값을 JavaScript로 복사합니다.
   * @returns Independent value or original native script facade.
   * @zh 独立值或原生脚本对象的原包装器。
   * @ja 独立した値、またはネイティブスクリプトの元のラッパー。
   * @ko 독립 값 또는 네이티브 스크립트 객체의 원래 래퍼입니다.
   */
  get value(): VariantReadValue {
    return variantFromNative(native.variantValue(variantHandle(this)));
  }

  /**
   * Read GetType using shared metadata without entering Native.
   *
   * @zh 通过共享元数据读取 GetType，无需进入 Native。
   * @ja Native 呼び出しなしで共有情報から GetType を読みます。
   * @ko Native 호출 없이 공유 메타데이터로 GetType을 읽습니다.
   * @returns Current storage type; NONE after shutdown.
   * @zh 当前存储类型；关闭后为 NONE。
   * @ja 現在の格納型。終了後は NONE。
   * @ko 현재 저장 형식이며 종료 후 NONE입니다.
   */
  getType(): VariantType {
    return mapping(this).typeView[0];
  }

  /**
   * Copy-assign a native value.
   *
   * @zh 复制赋值原生值。
   * @ja ネイティブ値をコピー代入します。
   * @ko 네이티브 값을 복사 대입합니다.
   * @param value - Value or owned Variant.
   * @zh value - 值或自有 Variant。
   * @ja value - 値または所有 Variant。
   * @ko value - 값 또는 소유 Variant입니다.
   * @returns This owner.
   * @zh 当前对象。
   * @ja この所有オブジェクト。
   * @ko 현재 소유 객체입니다.
   */
  assign(value: VariantValue): this {
    native.assignVariant(variantHandle(this), variantToNative(value));
    return this;
  }

  /**
   * Copy-construct another native owner.
   *
   * @zh 复制构造另一个原生对象。
   * @ja 別のネイティブ所有オブジェクトをコピー構築します。
   * @ko 다른 네이티브 소유 객체를 복사 생성합니다.
   * @returns Independent Variant.
   * @zh 独立 Variant。
   * @ja 独立した Variant。
   * @ko 독립 Variant입니다.
   */
  clone(): Variant {
    return wrap(native.cloneVariant(variantHandle(this)));
  }

  /**
   * Move-construct another owner; upstream preserves the source storage type.
   *
   * @zh 移动构造另一个对象；上游保留源对象的存储类型。
   * @ja 移動構築します。上流は移動元の格納型を保持します。
   * @ko 이동 생성하며 업스트림은 원본의 저장 형식을 유지합니다.
   * @returns Moved native value.
   * @zh 移动后的原生值。
   * @ja 移動したネイティブ値。
   * @ko 이동한 네이티브 값입니다.
   */
  move(): Variant {
    return wrap(native.moveVariant(variantHandle(this)));
  }

  /**
   * Move-assign another native owner.
   *
   * @zh 移动赋值另一个原生对象。
   * @ja 別の所有オブジェクトを移動代入します。
   * @ko 다른 네이티브 소유 객체를 이동 대입합니다.
   * @param source - Source owner.
   * @zh source - 源对象。
   * @ja source - 移動元。
   * @ko source - 원본 소유 객체입니다.
   * @returns This owner.
   * @zh 当前对象。
   * @ja この所有オブジェクト。
   * @ko 현재 소유 객체입니다.
   */
  moveAssign(source: Variant): this {
    native.moveAssignVariant(variantHandle(this), variantHandle(source));
    return this;
  }

  /**
   * Clear native storage and release its resource edges.
   *
   * @zh 清空原生存储并释放资源引用。
   * @ja 格納値を消去して資源参照を解放します。
   * @ko 네이티브 저장 값을 비우고 리소스 참조를 해제합니다.
   */
  clear(): void {
    native.clearVariant(variantHandle(this));
  }

  /**
   * Read Get<T> with the supplied native default.
   *
   * @zh 使用给定的原生默认值读取 Get<T>。
   * @ja 指定した既定値で Get<T> を読み取ります。
   * @ko 지정한 네이티브 기본값으로 Get<T>를 읽습니다.
   * @template T - Native conversion exemplar.
   * @zh T - 原生转换样本。
   * @ja T - ネイティブ変換の見本。
   * @ko T - 네이티브 변환 예제입니다.
   * @param defaultValue - Native conversion destination and fallback.
   * @zh defaultValue - 原生转换目标与回退值。
   * @ja defaultValue - 変換先と既定値。
   * @ko defaultValue - 네이티브 변환 대상 및 대체 값입니다.
   * @throws TypeError if string conversion would serialize a native pointer.
   * @zh 字符串转换需要序列化原生指针时抛出 TypeError。
   * @ja 文字列変換がネイティブポインターを直列化する場合は TypeError。
   * @ko 문자열 변환이 네이티브 포인터를 직렬화하면 TypeError가 발생합니다.
   * @returns Native output, including partial vector or colour changes.
   * @zh 原生输出，包括向量或颜色的部分修改。
   * @ja ネイティブ出力。ベクトルや色への部分的な変更も含みます。
   * @ko 네이티브 출력이며 벡터나 색상의 부분적인 변경도 포함합니다.
   */
  get<const T extends VariantConversionDefault>(
    defaultValue: T,
  ): VariantResult<T> {
    return variantFromNative(native.variantGet(
      variantHandle(this), variantToNative(defaultValue, true),
    )) as VariantResult<T>;
  }

  /**
   * Read GetInto<T>, returning native success and the resulting destination.
   *
   * @zh 读取 GetInto<T>，返回原生成功标志和目标结果。
   * @ja GetInto<T> の成否と変換先の値を返します。
   * @ko GetInto<T>의 성공 여부와 변환 대상 결과를 반환합니다.
   * @template T - Native conversion exemplar.
   * @zh T - 原生转换样本。
   * @ja T - ネイティブ変換の見本。
   * @ko T - 네이티브 변환 예제입니다.
   * @param defaultValue - Initial native destination value.
   * @zh defaultValue - 初始原生目标值。
   * @ja defaultValue - 変換先の初期値。
   * @ko defaultValue - 초기 네이티브 대상 값입니다.
   * @throws TypeError if string conversion would serialize a native pointer.
   * @zh 字符串转换需要序列化原生指针时抛出 TypeError。
   * @ja 文字列変換がネイティブポインターを直列化する場合は TypeError。
   * @ko 문자열 변환이 네이티브 포인터를 직렬화하면 TypeError가 발생합니다.
   * @returns Success and output value.
   * @zh 成功标志与输出值。
   * @ja 成否と出力値。
   * @ko 성공 여부 및 출력 값입니다.
   */
  getInto<const T extends VariantConversionDefault>(
    defaultValue: T,
  ): VariantConversion<VariantResult<T>> {
    const result = native.variantGetInto(
      variantHandle(this), variantToNative(defaultValue, true));
    return {
      success: result.success,
      value: variantFromNative(result.value) as VariantResult<T>,
    };
  }

  /**
   * Read the exact GetReference<T> into an independent output snapshot.
   *
   * @zh 将精确类型的 GetReference<T> 读取为独立输出快照。
   * @ja 正確な型の GetReference<T> を独立したコピーとして読みます。
   * @ko 정확한 형식의 GetReference<T>를 독립 출력 스냅샷으로 읽습니다.
   * @param type - Exact native storage type; mismatch throws.
   * @zh type - 精确的原生存储类型；不匹配时抛出异常。
   * @ja type - 正確な格納型。不一致は例外です。
   * @ko type - 정확한 네이티브 저장 형식이며 불일치 시 예외입니다.
   * @returns Stored value snapshot.
   * @zh 存储值快照。
   * @ja 格納値のコピー。
   * @ko 저장 값 스냅샷입니다.
   */
  getReference(type: VariantType): VariantReadValue {
    return variantFromNative(native.variantReference(
      variantHandle(this), type));
  }

  /**
   * Read a guarded Element from the native ScriptInterface pointer.
   *
   * @zh 从原生 ScriptInterface 指针读取受保护的 Element。
   * @ja 保護された ScriptInterface 参照から Element を読みます。
   * @ko 보호된 ScriptInterface 포인터에서 Element를 읽습니다.
   * @returns Canonical element or null.
   * @zh 唯一元素对象或 null。
   * @ja 同一性を持つ要素または null。
   * @ko 동일성을 유지하는 요소 또는 null입니다.
   */
  getElementValue(): Element | null {
    const result = native.variantElement(variantHandle(this));
    return result === null ? null : Element.wrap(result);
  }

  /**
   * Compare exact native type and value with operator==.
   *
   * @zh 使用 operator== 比较精确原生类型和值。
   * @ja operator== で正確な型と値を比較します。
   * @ko operator==로 정확한 네이티브 형식과 값을 비교합니다.
   * @param other - Owned Variant.
   * @zh other - 自有 Variant。
   * @ja other - 所有 Variant。
   * @ko other - 소유 Variant입니다.
   * @returns Native equality.
   * @zh 原生相等判断。
   * @ja ネイティブの等価判定。
   * @ko 네이티브 동등 여부입니다.
   */
  equals(other: Variant): boolean {
    return native.variantEquals(variantHandle(this), variantHandle(other));
  }

  /**
   * Compare with native operator!=.
   *
   * @zh 使用原生 operator!= 比较。
   * @ja ネイティブ operator!= で比較します。
   * @ko 네이티브 operator!=로 비교합니다.
   * @param other - Owned Variant.
   * @zh other - 自有 Variant。
   * @ja other - 所有 Variant。
   * @ko other - 소유 Variant입니다.
   * @returns Native inequality.
   * @zh 原生不等判断。
   * @ja ネイティブの不等価判定。
   * @ko 네이티브 비동등 여부입니다.
   */
  notEquals(other: Variant): boolean {
    return native.variantNotEquals(variantHandle(this), variantHandle(other));
  }
}

/**
 * Create a facade for a new native owner.
 *
 * @internal
 * @param value - Native mapping.
 * @returns Owned facade.
 */
function wrap(value: NativeVariant): Variant {
  markAsUntransferable(value.typeView.buffer);
  const result = Object.create(Variant.prototype) as Variant;
  variants.set(result, value);
  return result;
}
