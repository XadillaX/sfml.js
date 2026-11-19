import { native } from '../../internal/native';
import { Property, propertyFromNative, propertyHandle } from './property';
import { PropertyId } from '../../generated/property-ids';

const definitions = new WeakMap<PropertyDefinition, object>();

/**
 * Rml::RelativeTarget used when resolving relative property units.
 *
 * @zh 解析属性相对单位时使用的 Rml::RelativeTarget。
 * @ja 属性の相対単位を解決する Rml::RelativeTarget。
 * @ko 속성 상대 단위를 해석하는 Rml::RelativeTarget입니다.
 */
export enum RelativeTarget {
  /**
   * No relative target.
   *
   * @zh 无相对目标。
   * @ja 相対対象なし。
   * @ko 상대 대상이 없습니다.
   */
  None = 0,
  /**
   * Containing block width.
   *
   * @zh 包含块宽度。
   * @ja 包含ブロックの幅。
   * @ko 포함 블록 너비입니다.
   */
  ContainingBlockWidth = 1,
  /**
   * Containing block height.
   *
   * @zh 包含块高度。
   * @ja 包含ブロックの高さ。
   * @ko 포함 블록 높이입니다.
   */
  ContainingBlockHeight = 2,
  /**
   * Current font size.
   *
   * @zh 当前字号。
   * @ja 現在のフォントサイズ。
   * @ko 현재 글꼴 크기입니다.
   */
  FontSize = 3,
  /**
   * Parent font size.
   *
   * @zh 父元素字号。
   * @ja 親要素のフォントサイズ。
   * @ko 부모 글꼴 크기입니다.
   */
  ParentFontSize = 4,
  /**
   * Current line height.
   *
   * @zh 当前行高。
   * @ja 現在の行の高さ。
   * @ko 현재 줄 높이입니다.
   */
  LineHeight = 5,
}

/**
 * Both outputs from Rml::PropertyDefinition::GetValue.
 *
 * @zh Rml::PropertyDefinition::GetValue 的两个输出。
 * @ja Rml::PropertyDefinition::GetValue の両出力。
 * @ko Rml::PropertyDefinition::GetValue의 두 출력입니다.
 */
export interface PropertyValueResult {
  /**
   * Native boolean; keyword conversion returns false even with valid text.
   *
   * @zh 原生布尔值；关键词转换即使有有效文本也返回 false。
   * @ja ネイティブ結果。キーワードは有効な文字列でも false を返します。
   * @ko 네이티브 결과이며 키워드는 유효한 문자열에도 false를 반환합니다.
   */
  success: boolean;

  /**
   * Native output string.
   *
   * @zh 原生输出字符串。
   * @ja ネイティブ出力文字列。
   * @ko 네이티브 출력 문자열입니다.
   */
  value: string;
}

/**
 * Generation-checked Rml::PropertyDefinition.
 *
 * @zh 检查运行代的 Rml::PropertyDefinition。
 * @ja 世代を検証する Rml::PropertyDefinition。
 * @ko 실행 세대를 검사하는 Rml::PropertyDefinition입니다.
 * @remarks
 * Constructed and explicitly registered definitions are mutable and retained
 * until shutdown to preserve native borrowed references. Built-in definitions
 * are read-only. All become invalid
 * on shutdown; no native parser pointer survives into a new generation.
 * @zh 构造或显式注册的定义可修改，并保留至关闭以保护原生借用引用。内置定义只读。
 * 关闭时全部失效，原生解析器指针不跨运行代保留。
 * @ja 構築または明示登録した定義は変更可能で、借用参照のため終了まで保持します。
 * 組み込み定義は読み取り専用です。
 * 終了時に無効化し、パーサーを次の世代に持ち越しません。
 * @ko 생성 또는 명시 등록한 정의는 수정 가능하며 참조 보호를 위해 종료까지 유지합니다.
 * 기본 제공 정의는 읽기 전용입니다.
 * 종료 시 무효화하며 파서 포인터를 다음 세대에 유지하지 않습니다.
 */
export class PropertyDefinition {
  /**
   * Construct Rml::PropertyDefinition without registering a global property.
   *
   * @zh 构造 Rml::PropertyDefinition，不注册全局属性。
   * @ja グローバル属性を登録せず Rml::PropertyDefinition を構築します。
   * @ko 전역 속성을 등록하지 않고 Rml::PropertyDefinition을 생성합니다.
   * @param id - Property identifier.
   * @zh id - 属性编号。
   * @ja id - 属性 ID。
   * @ko id - 속성 식별자입니다.
   * @param defaultValue - Unparsed default string.
   * @zh defaultValue - 未解析的默认字符串。
   * @ja defaultValue - 未解析の既定文字列。
   * @ko defaultValue - 해석 전 기본 문자열입니다.
   * @param inherited - Whether the property inherits.
   * @zh inherited - 是否继承。
   * @ja inherited - 継承するかどうか。
   * @ko inherited - 상속 여부입니다.
   * @param forcesLayout - Whether changes force layout.
   * @zh forcesLayout - 变更是否强制布局。
   * @ja forcesLayout - 変更がレイアウトを強制するか。
   * @ko forcesLayout - 변경 시 레이아웃 강제 여부입니다.
   */
  constructor(
    id: PropertyId, defaultValue: string, inherited: boolean,
    forcesLayout: boolean,
  ) {
    definitions.set(this, native.createPropertyDefinition(
      id, defaultValue, inherited, forcesLayout));
  }

  /**
   * Rml::PropertyDefinition::AddParser on an owned definition.
   *
   * @zh 对自有定义调用 Rml::PropertyDefinition::AddParser。
   * @ja 所有する定義で Rml::PropertyDefinition::AddParser を呼びます。
   * @ko 소유 정의에서 Rml::PropertyDefinition::AddParser를 호출합니다.
   * @param name - Registered parser name.
   * @zh name - 已注册解析器名称。
   * @ja name - 登録済みパーサー名。
   * @ko name - 등록된 파서 이름입니다.
   * @param parameters - Native comma-separated parameters, default empty.
   * @zh parameters - 原生逗号分隔参数，默认空。
   * @ja parameters - カンマ区切りの引数。既定値は空。
   * @ko parameters - 쉼표 구분 매개변수이며 기본값은 빈 문자열입니다.
   * @returns This definition.
   * @zh 当前定义。
   * @ja この定義。
   * @ko 현재 정의입니다.
   */
  addParser(name: string, parameters = ''): this {
    native.definitionAddParser(definitionHandle(this), name, parameters);
    return this;
  }

  /**
   * Rml::PropertyDefinition::SetRelativeTarget on an owned definition.
   *
   * @zh 对自有定义调用 Rml::PropertyDefinition::SetRelativeTarget。
   * @ja 所有する定義で Rml::PropertyDefinition::SetRelativeTarget を呼びます。
   * @ko 소유 정의에서 Rml::PropertyDefinition::SetRelativeTarget을 호출합니다.
   * @param target - Relative unit target.
   * @zh target - 相对单位目标。
   * @ja target - 相対単位の対象。
   * @ko target - 상대 단위 대상입니다.
   * @returns This definition.
   * @zh 当前定义。
   * @ja この定義。
   * @ko 현재 정의입니다.
   */
  setRelativeTarget(target: RelativeTarget): this {
    native.definitionSetRelativeTarget(definitionHandle(this), target);
    return this;
  }

  /**
   * Parse into the supplied property, preserving native mutation on failure.
   *
   * @zh 解析到给定属性，保留失败时的原生修改行为。
   * @ja 指定属性に解析し、失敗時のネイティブ変更も保持します。
   * @ko 지정 속성으로 해석하며 실패 시 네이티브 변경도 보존합니다.
   * @param property - Output property.
   * @zh property - 输出属性。
   * @ja property - 出力属性。
   * @ko property - 출력 속성입니다.
   * @param value - Raw RCSS text.
   * @zh value - 原始 RCSS 文本。
   * @ja value - 生の RCSS 文字列。
   * @ko value - 원시 RCSS 문자열입니다.
   * @returns Native parse success.
   * @zh 原生解析是否成功。
   * @ja ネイティブ解析の成功結果。
   * @ko 네이티브 해석 성공 여부입니다.
   */
  parseValue(property: Property, value: string): boolean {
    return native.definitionParseValue(
      definitionHandle(this), propertyHandle(property), value);
  }

  /**
   * Return the exact native GetValue boolean and output text.
   *
   * @zh 返回原生 GetValue 的准确布尔值和输出文本。
   * @ja ネイティブ GetValue の真偽値と文字列をそのまま返します。
   * @ko 네이티브 GetValue의 정확한 불리언과 문자열을 반환합니다.
   * @param property - Input property.
   * @zh property - 输入属性。
   * @ja property - 入力属性。
   * @ko property - 입력 속성입니다.
   * @throws TypeError if output text would serialize a native pointer.
   * @zh 输出文本需要序列化原生指针时抛出 TypeError。
   * @ja 出力文字列がネイティブポインターを直列化する場合は TypeError。
   * @ko 출력 문자열이 네이티브 포인터를 직렬화하면 TypeError가 발생합니다.
   * @returns Both native outputs.
   * @zh 两个原生输出。
   * @ja 両方のネイティブ出力。
   * @ko 두 네이티브 출력입니다.
   */
  getValue(property: Property): PropertyValueResult {
    return native.definitionGetValue(
      definitionHandle(this), propertyHandle(property));
  }

  /**
   * Get this property’s identifier within its specification.
   *
   * @zh 获取此属性在所属规范中的标识。
   * @ja 所属仕様内でのプロパティ識別子を取得します。
   * @ko 소속 명세 안에서 이 속성의 식별자를 가져옵니다.
   * @returns Native property id.
   * @zh 原生属性编号。
   * @ja ネイティブ属性 ID。
   * @ko 네이티브 속성 식별자입니다.
   */
  get id(): PropertyId {
    return native.definitionGetId(definitionHandle(this));
  }

  /**
   * Check whether the property inherits from the parent element.
   *
   * @zh 查询属性是否从父元素继承。
   * @ja プロパティが親要素から継承されるかを調べます。
   * @ko 속성이 부모 요소에서 상속되는지 확인합니다.
   * @returns Native inheritance flag.
   * @zh 原生继承标志。
   * @ja ネイティブ継承フラグ。
   * @ko 네이티브 상속 플래그입니다.
   */
  get isInherited(): boolean {
    return native.definitionIsInherited(definitionHandle(this));
  }

  /**
   * Check whether changes to this property require layout recalculation.
   *
   * @zh 查询此属性变更是否需要重新计算布局。
   * @ja このプロパティの変更でレイアウトの再計算が必要かを調べます。
   * @ko 이 속성 변경에 레이아웃 재계산이 필요한지 확인합니다.
   * @returns Native layout flag.
   * @zh 原生布局标志。
   * @ja ネイティブレイアウトフラグ。
   * @ko 네이티브 레이아웃 플래그입니다.
   */
  get isLayoutForced(): boolean {
    return native.definitionIsLayoutForced(definitionHandle(this));
  }

  /**
   * Owned copy of Rml::PropertyDefinition::GetDefaultValue.
   *
   * @zh Rml::PropertyDefinition::GetDefaultValue 的自有副本。
   * @ja Rml::PropertyDefinition::GetDefaultValue の所有コピー。
   * @ko Rml::PropertyDefinition::GetDefaultValue의 소유 복사본입니다.
   * @returns Native default property copy.
   * @zh 原生默认属性副本。
   * @ja ネイティブ既定属性のコピー。
   * @ko 네이티브 기본 속성 복사본입니다.
   */
  get defaultValue(): Property {
    return propertyFromNative(
      native.definitionDefaultValue(definitionHandle(this)));
  }

  /**
   * Get the reference dimension used to resolve relative property values.
   *
   * @zh 获取解析相对属性值所用的基准尺寸。
   * @ja 相対プロパティ値の解決に使う基準寸法を取得します。
   * @ko 상대 속성 값을 해석하는 기준 크기를 가져옵니다.
   * @returns Native relative target.
   * @zh 原生相对目标。
   * @ja ネイティブ相対対象。
   * @ko 네이티브 상대 대상입니다.
   */
  get relativeTarget(): RelativeTarget {
    return native.definitionGetRelativeTarget(definitionHandle(this));
  }
}

/**
 * Resolve a checked definition handle.
 *
 * @internal
 * @param definition - Definition wrapper.
 * @returns Native handle.
 */
export function definitionHandle(definition: PropertyDefinition): object {
  const result = definitions.get(definition);
  if (!result) {
    throw new TypeError('Expected a PropertyDefinition');
  }
  return result;
}

/**
 * Wrap a generation-checked definition.
 *
 * @internal
 * @param handle - Native definition handle.
 * @returns Definition wrapper.
 */
export function definitionFromNative(handle: object): PropertyDefinition {
  const result = Object.create(
    PropertyDefinition.prototype) as PropertyDefinition;
  definitions.set(result, handle);
  return result;
}
