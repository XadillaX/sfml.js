import { markAsUntransferable } from 'node:worker_threads';
import { native, type NativeProperty } from '../../internal/native';
import {
  variantToNative, variantFromNative,
} from '../../internal/animation-values';
import type { AttributeValue } from '../../dom/documents/attributes';
import { Element } from '../../dom/elements/element';
import type {
  VariantConversionDefault, VariantResult, VariantReadValue,
} from '../../values/types';
import { Unit, checkedUnit } from '../../values/unit';
import {
  numericValueFromNative, type NumericValue,
} from '../../values/numeric-value';
import {
  PropertyDefinition, definitionFromNative, definitionHandle,
} from './property-definition';

const properties = new WeakMap<Property, NativeProperty>();

/**
 * Keep mapped native metadata on its owning thread; cloning still copies.
 *
 * @internal
 * @param value - Native property mapping.
 * @returns Protected mapping.
 */
function protectMapping(value: NativeProperty): NativeProperty {
  markAsUntransferable(value.unitView.buffer);
  markAsUntransferable(value.specificityView.buffer);
  markAsUntransferable(value.parserIndexView.buffer);
  return value;
}

/**
 * Copied Rml::PropertySource.
 *
 * @zh Rml::PropertySource 的副本。
 * @ja Rml::PropertySource のコピー。
 * @ko Rml::PropertySource의 복사본입니다.
 */
export interface PropertySource {
  /**
   * Source file path.
   *
   * @zh 源文件路径。
   * @ja ソースファイルのパス。
   * @ko 소스 파일 경로입니다.
   */
  path: string;

  /**
   * Native source line number.
   *
   * @zh 原生源代码行号。
   * @ja ネイティブのソース行番号。
   * @ko 네이티브 소스 줄 번호입니다.
   */
  lineNumber: number;

  /**
   * Source rule name.
   *
   * @zh 来源规则名。
   * @ja 元のルール名。
   * @ko 원본 규칙 이름입니다.
   */
  ruleName: string;
}

/**
 * Resolve an owned property mapping.
 *
 * @internal
 * @param property - Property wrapper.
 * @returns Checked native mapping.
 */
function mapping(property: Property): NativeProperty {
  const result = properties.get(property);
  if (!result) {
    throw new TypeError('Expected a Property');
  }
  return result;
}

/**
 * Check a mapped signed integer.
 *
 * @internal
 * @param value - Input number.
 * @returns Validated integer.
 */
function integer(value: number): number {
  if (!Number.isInteger(value) || value < -2147483648 || value > 2147483647) {
    throw new RangeError('Expected a native 32-bit integer');
  }
  return value;
}

/**
 * Native-owned Rml::Property copy, valid for its RmlUi runtime generation.
 *
 * @zh Native 持有的 Rml::Property 副本，仅在创建时的 RmlUi 运行代内有效。
 * @ja 作成時の RmlUi 世代で有効なネイティブ所有の Rml::Property コピー。
 * @ko 생성된 RmlUi 실행 세대에서 유효한 네이티브 소유 Rml::Property 복사본입니다.
 * @remarks
 * DOM updates cannot change this copy. Shutdown clears resource references and
 * invalidates native operations; mapped metadata remains independent storage.
 * Raw conversion supports scalars, vectors, colours, live elements,
 * decoration lists, transforms and transition/animation lists.
 * Decorator, filter and font-effect
 * values retain generation-owned shared native resources.
 * @zh DOM 更新不会修改副本。关闭时释放资源引用并使原生操作失效，共享元数据存储仍有效。
 * 原始值转换支持标量、向量、颜色、存活元素、装饰列表、变换和过渡／动画列表。
 * 装饰器、滤镜及字体效果值持有当前运行代的共享原生资源。
 * @ja DOM 更新はコピーを変更しません。終了時に参照を解放し操作を無効化します。
 * 値変換はスカラー・ベクトル・色・有効要素・装飾・変換・遷移／アニメーション一覧に対応します。
 * 装飾・フィルター・フォント効果は実行世代の共有ネイティブ資源を保持します。
 * @ko DOM 갱신은 복사본을 변경하지 않습니다. 종료 시 참조를 해제하고 작업을 무효화합니다.
 * 값 변환은 스칼라·벡터·색상·유효 요소·장식·변환·전환/애니메이션 목록을 지원합니다.
 * 장식·필터·글꼴 효과 값은 실행 세대의 공유 네이티브 리소스를 보유합니다.
 */
export class Property {
  /**
   * Construct a property; one numeric argument selects the enum overload.
   *
   * @zh 构造原生属性；单个数值参数选择枚举重载。
   * @ja ネイティブ属性を構築します。数値 1 個は列挙型オーバーロードです。
   * @ko 네이티브 속성을 생성하며 숫자 인수 하나는 열거형 오버로드입니다.
   * @param value - Owned Variant; omitted means NONE.
   * @zh value - 自有 Variant；省略时为 NONE。
   * @ja value - 所有する Variant。省略時は NONE。
   * @ko value - 소유 Variant이며 생략하면 NONE입니다.
   * @param unit - Unit; omitted numeric values use KEYWORD, others UNKNOWN.
   * @zh unit - 单位；省略时数值使用 KEYWORD，其他值使用 UNKNOWN。
   * @ja unit - 単位。省略時は数値が KEYWORD、その他は UNKNOWN。
   * @ko unit - 생략 시 숫자는 KEYWORD, 나머지는 UNKNOWN입니다.
   * @param specificity - Cascade specificity, default -1.
   * @zh specificity - 层叠优先级，默认 -1。
   * @ja specificity - 詳細度。既定値は -1。
   * @ko specificity - 명시도이며 기본값은 -1입니다.
   */
  constructor(value?: AttributeValue, unit?: Unit, specificity = -1) {
    properties.set(this, protectMapping(
      native.createProperty(variantToNative(value), unit, specificity)));
  }

  /**
   * Copied native Variant, including decoration, transform and motion values.
   *
   * @zh 原生 Variant 副本，包含装饰、变换和过渡／动画值。
   * @ja 装飾・変換・遷移／アニメーションを含む Variant コピー。
   * @ko 장식·변환·전환/애니메이션을 포함한 Variant 복사본입니다.
   * @returns Owned value or null.
   * @zh 自有值或 null。
   * @ja 所有する値または null。
   * @ko 소유 값 또는 null입니다.
   */
  get value(): VariantReadValue {
    return variantFromNative(native.propertyGetValue(propertyHandle(this)));
  }

  /**
   * Replace the native property value.
   *
   * @zh 替换原生属性值。
   * @ja ネイティブ属性値を置換します。
   * @ko 네이티브 속성 값을 교체합니다.
   * @param value - Owned value or a lifetime-guarded element reference.
   * @zh value - 自有值或受生命周期保护的元素引用。
   * @ja value - 所有値、またはライフタイム保護された要素参照。
   * @ko value - 소유 값 또는 수명 보호된 요소 참조입니다.
   */
  set value(value: AttributeValue) {
    native.propertySetValue(propertyHandle(this), variantToNative(value));
  }

  /**
   * Mapped Rml::Property::unit.
   *
   * @zh 映射的 Rml::Property::unit。
   * @ja マップされた Rml::Property::unit。
   * @ko 매핑된 Rml::Property::unit입니다.
   * @returns Native unit.
   * @zh 原生单位。
   * @ja ネイティブ単位。
   * @ko 네이티브 단위입니다.
   */
  get unit(): Unit {
    return this.unitView[0];
  }

  /**
   * Write the property's native unit.
   *
   * @zh 写入属性的原生单位。
   * @ja 属性のネイティブ単位を書き込みます。
   * @ko 속성의 네이티브 단위를 씁니다.
   * @param value - Known unit flags.
   * @zh value - 已知单位标志。
   * @ja value - 既知の単位フラグ。
   * @ko value - 알려진 단위 플래그입니다.
   */
  set unit(value: Unit) {
    this.unitView[0] = checkedUnit(value);
  }

  /**
   * Mapped cascade specificity, excluded from native equality.
   *
   * @zh 映射的层叠优先级，原生相等比较不包含此字段。
   * @ja 詳細度。ネイティブ等価比較の対象外です。
   * @ko 매핑된 명시도이며 네이티브 동등 비교에서 제외됩니다.
   * @returns Signed native integer.
   * @zh 原生有符号整数。
   * @ja ネイティブ符号付き整数。
   * @ko 네이티브 부호 있는 정수입니다.
   */
  get specificity(): number {
    return this.specificityView[0];
  }

  /**
   * Set native cascade specificity.
   *
   * @zh 设置原生层叠优先级。
   * @ja ネイティブの詳細度を設定します。
   * @ko 네이티브 우선순위를 설정합니다.
   * @param value - Signed 32-bit specificity.
   * @zh value - 32 位有符号优先级。
   * @ja value - 32 ビット符号付き詳細度。
   * @ko value - 부호 있는 32비트 우선순위입니다.
   */
  set specificity(value: number) {
    this.specificityView[0] = integer(value);
  }

  /**
   * Mapped parser_index used by PropertyDefinition::GetValue.
   *
   * @zh 映射的 parser_index，供 PropertyDefinition::GetValue 使用。
   * @ja PropertyDefinition::GetValue が使う parser_index。
   * @ko PropertyDefinition::GetValue에서 사용하는 parser_index입니다.
   * @returns Native parser index, initially -1.
   * @zh 原生解析器索引，初始为 -1。
   * @ja ネイティブパーサー番号。初期値は -1。
   * @ko 네이티브 파서 인덱스이며 초기값은 -1입니다.
   */
  get parserIndex(): number {
    return this.parserIndexView[0];
  }

  /**
   * Set the native parser index.
   *
   * @zh 设置原生解析器索引。
   * @ja ネイティブパーサーの添字を設定します。
   * @ko 네이티브 파서 인덱스를 설정합니다.
   * @param value - Signed 32-bit index.
   * @zh value - 32 位有符号索引。
   * @ja value - 32 ビット符号付き添字。
   * @ko value - 부호 있는 32비트 인덱스입니다.
   */
  set parserIndex(value: number) {
    this.parserIndexView[0] = integer(value);
  }

  /**
   * Generation-checked native definition reference.
   *
   * @zh 检查运行代的原生定义引用。
   * @ja 世代を検証するネイティブ定義の参照。
   * @ko 실행 세대를 검사하는 네이티브 정의 참조입니다.
   * @returns Definition or null.
   * @zh 定义或 null。
   * @ja 定義または null。
   * @ko 정의 또는 null입니다.
   */
  get definition(): PropertyDefinition | null {
    const handle = native.propertyGetDefinition(propertyHandle(this));
    return handle ? definitionFromNative(handle) : null;
  }

  /**
   * Set the property's checked definition reference.
   *
   * @zh 设置属性的受检查定义引用。
   * @ja 検証付きの属性定義参照を設定します。
   * @ko 속성의 검증된 정의 참조를 설정합니다.
   * @param value - Definition from this runtime, or null.
   * @zh value - 当前运行时的定义或 null。
   * @ja value - 現在のランタイムの定義、または null。
   * @ko value - 현재 런타임의 정의 또는 null입니다.
   */
  set definition(value: PropertyDefinition | null) {
    native.propertySetDefinition(
      propertyHandle(this), value === null ? null : definitionHandle(value));
  }

  /**
   * Copied source metadata; assigning copies all fields.
   *
   * @zh 来源元数据副本；赋值时复制全部字段。
   * @ja ソース情報のコピー。代入時に全フィールドをコピーします。
   * @ko 원본 메타데이터 복사본이며 대입 시 모든 필드를 복사합니다.
   * @returns Source or null.
   * @zh 来源或 null。
   * @ja ソースまたは null。
   * @ko 원본 또는 null입니다.
   */
  get source(): PropertySource | null {
    return native.propertyGetSource(propertyHandle(this));
  }

  /**
   * Copy source metadata into the property.
   *
   * @zh 将来源元数据复制到属性。
   * @ja 出典メタデータを属性へコピーします。
   * @ko 출처 메타데이터를 속성으로 복사합니다.
   * @param value - Source record, or null to clear it.
   * @zh value - 来源记录，null 表示清空。
   * @ja value - 出典レコード。null で消去。
   * @ko value - 출처 레코드이며 null이면 지웁니다.
   */
  set source(value: PropertySource | null) {
    native.propertySetSource(propertyHandle(this), value);
  }

  /**
   * Writable native unit storage, synchronized at each native operation.
   *
   * @zh 原生单位的单整数可写存储，每次原生操作时同步到属性。
   * @ja 各ネイティブ操作に同期する単位の書き込み可能な 1 要素領域。
   * @ko 각 네이티브 작업에 동기화하는 단위의 쓰기 가능한 단일 정수 저장소입니다.
   * @returns Shared unit storage, reset to UNKNOWN on shutdown.
   * @zh 共享单位存储，关闭时重置为 UNKNOWN。
   * @ja 共有単位領域。終了時に UNKNOWN にリセットします。
   * @ko 공유 단위 저장소이며 종료 시 UNKNOWN으로 초기화됩니다.
   */
  get unitView(): Int32Array {
    return mapping(this).unitView;
  }

  /**
   * Writable one-integer view of native specificity.
   *
   * @zh 原生层叠优先级的单整数可写视图。
   * @ja ネイティブ詳細度の書き込み可能な 1 要素ビュー。
   * @ko 네이티브 명시도의 쓰기 가능한 단일 정수 뷰입니다.
   * @returns Shared specificity storage, reset to -1 on shutdown.
   * @zh 共享优先级存储，关闭时重置为 -1。
   * @ja 共有詳細度領域。終了時に -1 にリセットします。
   * @ko 공유 명시도 저장소이며 종료 시 -1로 초기화됩니다.
   */
  get specificityView(): Int32Array {
    return mapping(this).specificityView;
  }

  /**
   * Writable one-integer view of native parser_index.
   *
   * @zh 原生 parser_index 的单整数可写视图。
   * @ja ネイティブ parser_index の書き込み可能な 1 要素ビュー。
   * @ko 네이티브 parser_index의 쓰기 가능한 단일 정수 뷰입니다.
   * @returns Shared parser index storage, reset to -1 on shutdown.
   * @zh 共享解析器索引存储，关闭时重置为 -1。
   * @ja 共有パーサー番号領域。終了時に -1 にリセットします。
   * @ko 공유 파서 인덱스 저장소이며 종료 시 -1로 초기화됩니다.
   */
  get parserIndexView(): Int32Array {
    return mapping(this).parserIndexView;
  }

  /**
   * Rml::Property::Get with a type exemplar; failed conversion returns T{}.
   *
   * @zh 以类型样本选择 Rml::Property::Get；转换失败返回 T{}。
   * @ja 型の見本で Rml::Property::Get を選び、変換失敗時は T{} を返します。
   * @ko 형식 예제로 Rml::Property::Get을 선택하며 변환 실패 시 T{}를 반환합니다.
   * @template T - Native conversion type selected by the exemplar.
   * @zh T - 由样本选择的原生转换类型。
   * @ja T - 見本で選択するネイティブ変換型。
   * @ko T - 예제로 선택하는 네이티브 변환 형식입니다.
   * @param type - Selects the native conversion type, not a fallback value.
   * @zh type - 选择原生转换类型，不是回退值。
   * @ja type - 変換型を選択します。フォールバック値ではありません。
   * @ko type - 변환 형식을 선택하며 대체 값이 아닙니다.
   * @throws TypeError if string conversion would serialize a native pointer.
   * @zh 字符串转换需要序列化原生指针时抛出 TypeError。
   * @ja 文字列変換がネイティブポインターを直列化する場合は TypeError。
   * @ko 문자열 변환이 네이티브 포인터를 직렬화하면 TypeError가 발생합니다.
   * @returns Converted native value.
   * @zh 转换后的原生值。
   * @ja 変換したネイティブ値。
   * @ko 변환된 네이티브 값입니다.
   */
  get<const T extends VariantConversionDefault>(type: T): VariantResult<T> {
    return variantFromNative(native.propertyGet(
      propertyHandle(this), variantToNative(type, true),
    )) as VariantResult<T>;
  }

  /**
   * Convert through Rml::Property::Get<ScriptInterface*> and narrow to Element.
   *
   * @zh 通过 Get<ScriptInterface*> 转换并收窄为 Element。
   * @ja Get<ScriptInterface*> で変換し、Element に絞り込みます。
   * @ko Get<ScriptInterface*>로 변환한 뒤 Element로 좁힙니다.
   * @returns Live element, or null for failed conversion or destruction.
   * @zh 存活元素；转换失败或销毁时为 null。
   * @ja 存在する要素。変換失敗または破棄後は null。
   * @ko 유효한 요소이며 변환 실패 또는 파괴 후에는 null입니다.
   */
  getElementValue(): Element | null {
    const handle = native.propertyGetElementValue(propertyHandle(this));
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Rml::Property::GetNumericValue as independent native storage.
   *
   * @zh Rml::Property::GetNumericValue，结果使用独立原生存储。
   * @ja 独立領域を持つ Rml::Property::GetNumericValue の結果。
   * @ko 독립 저장소의 Rml::Property::GetNumericValue 결과입니다.
   * @returns Numeric value; nonnumeric input gives zero/UNKNOWN.
   * @zh 数值；非数值输入返回零/UNKNOWN。
   * @ja 数値。非数値の場合はゼロ/UNKNOWN。
   * @ko 수치이며 비수치 입력은 0/UNKNOWN을 반환합니다.
   */
  getNumericValue(): NumericValue {
    return numericValueFromNative(
      native.propertyGetNumericValue(propertyHandle(this)));
  }

  /**
   * Rml::Property::ToString with its native definition and unit.
   *
   * @zh 使用原生定义及单位调用 Rml::Property::ToString。
   * @ja 定義と単位を使う Rml::Property::ToString。
   * @ko 정의와 단위를 사용하는 Rml::Property::ToString입니다.
   * @throws TypeError for pointer values or serialized effect properties
   * containing pointers.
   * @zh 指针值及参与序列化的效果属性中的指针会抛出 TypeError。
   * @ja 値や直列化するエフェクト属性にポインターがある場合は TypeError。
   * @ko 값이나 직렬화되는 효과 속성에 포인터가 있으면 TypeError가 발생합니다.
   * @returns Native property text.
   * @zh 原生属性文本。
   * @ja ネイティブ属性の文字列。
   * @ko 네이티브 속성 문자열입니다.
   */
  toString(): string {
    return native.propertyToString(propertyHandle(this));
  }

  /**
   * Copy the native property and its shared resource references.
   *
   * @zh 复制原生属性及其共享资源引用。
   * @ja ネイティブ属性と共有リソース参照をコピーします。
   * @ko 네이티브 속성과 공유 리소스 참조를 복사합니다.
   * @returns Independent property copy.
   * @zh 独立属性副本。
   * @ja 独立した属性コピー。
   * @ko 독립 속성 복사본입니다.
   */
  clone(): Property {
    return propertyFromNative(native.cloneProperty(propertyHandle(this)));
  }

  /**
   * Native equality compares unit and Variant value.
   *
   * @zh 原生相等比较仅比较单位和 Variant 值。
   * @ja 単位と Variant 値をネイティブで比較します。
   * @ko 단위와 Variant 값을 네이티브로 비교합니다.
   * @param other - Property to compare.
   * @zh other - 待比较属性。
   * @ja other - 比較する属性。
   * @ko other - 비교할 속성입니다.
   * @returns Native equality result.
   * @zh 原生相等比较结果。
   * @ja ネイティブ等価比較の結果。
   * @ko 네이티브 동등 비교 결과입니다.
   */
  equals(other: Property): boolean {
    return native.propertyEquals(
      propertyHandle(this), propertyHandle(other));
  }

  /**
   * Native operator!= for properties.
   *
   * @zh 属性的原生 operator!=。
   * @ja 属性のネイティブ operator!=。
   * @ko 속성의 네이티브 operator!=입니다.
   * @param other - Property to compare.
   * @zh other - 待比较属性。
   * @ja other - 比較する属性。
   * @ko other - 비교할 속성입니다.
   * @returns Native inequality result.
   * @zh 原生不等比较结果。
   * @ja ネイティブ非等価比較の結果。
   * @ko 네이티브 비동등 비교 결과입니다.
   */
  notEquals(other: Property): boolean {
    return native.propertyNotEquals(
      propertyHandle(this), propertyHandle(other));
  }
}

/**
 * Resolve a checked property handle.
 *
 * @internal
 * @param property - Wrapper.
 * @returns Native handle.
 */
export function propertyHandle(property: Property): object {
  return mapping(property).handle;
}

/**
 * Wrap native storage without allocating another native copy.
 *
 * @internal
 * @param value - Native mapping.
 * @returns Property wrapper.
 */
export function propertyFromNative(value: NativeProperty): Property {
  const result = Object.create(Property.prototype) as Property;
  properties.set(result, protectMapping(value));
  return result;
}
