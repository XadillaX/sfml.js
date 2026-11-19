import { native } from '../../internal/native';
import { PropertyId } from '../../generated/property-ids';
import { ShorthandId } from '../../generated/shorthand-ids';
import {
  PropertyDefinition, definitionFromNative,
} from './property-definition';
import {
  PropertyDictionary, propertyDictionaryHandle,
} from './property-dictionary';

const specifications = new WeakMap<PropertySpecification, object>();

/**
 * Rml::ShorthandType controls how a declaration fills its component properties.
 *
 * @zh Rml::ShorthandType 控制声明如何填充各组成属性。
 * @ja Rml::ShorthandType は宣言から構成属性への割り当てを制御します。
 * @ko Rml::ShorthandType은 선언을 구성 속성에 할당하는 방법입니다.
 */
export enum ShorthandType {
  /**
   * Try subsequent properties after a failed parse.
   *
   * @zh 解析失败时尝试后续属性。
   * @ja 解析失敗時は後続の属性を試します。
   * @ko 해석 실패 시 다음 속성을 시도합니다.
   */
  FallThrough = 0,
  /**
   * Replicate the final value to fill undeclared properties.
   *
   * @zh 使用最后一个值填充未声明的属性。
   * @ja 最後の値で未指定の属性を埋めます。
   * @ko 마지막 값으로 미지정 속성을 채웁니다.
   */
  Replicate = 1,
  /**
   * Expand one to four values into top, right, bottom and left.
   *
   * @zh 将一至四个值扩展为上、右、下、左四项。
   * @ja 一〜四個の値を上・右・下・左に展開します。
   * @ko 하나에서 네 개의 값을 위, 오른쪽, 아래, 왼쪽으로 확장합니다.
   */
  Box = 2,
  /**
   * Parse the complete value into each property or nested shorthand.
   *
   * @zh 将完整值解析到每个属性或嵌套简写。
   * @ja 完全な値を各属性または入れ子の短縮形で解析します。
   * @ko 전체 값을 각 속성 또는 중첩 단축 속성으로 해석합니다.
   */
  RecursiveRepeat = 3,
  /**
   * Parse comma-separated property or shorthand values.
   *
   * @zh 解析逗号分隔的属性或简写值。
   * @ja カンマ区切りの属性または短縮形の値を解析します。
   * @ko 쉼표로 구분된 속성 또는 단축 속성 값을 해석합니다.
   */
  RecursiveCommaSeparated = 4,
  /**
   * Apply native flex defaults to three component properties.
   *
   * @zh 对三个组成属性应用原生 flex 默认规则。
   * @ja 三つの構成属性にネイティブ flex の既定規則を適用します。
   * @ko 세 구성 속성에 네이티브 flex 기본 규칙을 적용합니다.
   */
  Flex = 5,
}

/**
 * Flags copied from an Rml::ShorthandItem.
 *
 * @zh 从 Rml::ShorthandItem 复制的标志。
 * @ja Rml::ShorthandItem からコピーしたフラグ。
 * @ko Rml::ShorthandItem에서 복사한 플래그입니다.
 */
export interface ShorthandItemOptions {
  /**
   * The component has the native question-mark suffix.
   *
   * @zh 组成项带有原生问号后缀。
   * @ja 構成項目にネイティブの疑問符接尾辞があります。
   * @ko 구성 항목에 네이티브 물음표 접미사가 있습니다.
   */
  optional: boolean;

  /**
   * The component has the native hash suffix.
   *
   * @zh 组成项带有原生井号后缀。
   * @ja 構成項目にネイティブのハッシュ接尾辞があります。
   * @ko 구성 항목에 네이티브 해시 접미사가 있습니다.
   */
  repeats: boolean;
}

/**
 * A shorthand component referencing a property definition.
 *
 * @zh 引用属性定义的简写组成项。
 * @ja 属性定義を参照する短縮形の構成項目。
 * @ko 속성 정의를 참조하는 단축 속성 구성 항목입니다.
 */
export interface PropertyShorthandItem extends ShorthandItemOptions {
  /**
   * Identifies Rml::ShorthandItemType::Property.
   *
   * @zh 表示 Rml::ShorthandItemType::Property。
   * @ja Rml::ShorthandItemType::Property を表します。
   * @ko Rml::ShorthandItemType::Property를 나타냅니다.
   */
  type: 'property';

  /**
   * Native property identifier within this specification.
   *
   * @zh 此规格中的原生属性编号。
   * @ja この仕様内のネイティブ属性 ID。
   * @ko 이 명세 내의 네이티브 속성 식별자입니다.
   */
  propertyId: PropertyId;

  /**
   * Generation-checked property definition.
   *
   * @zh 检查运行代的属性定义。
   * @ja 世代を検証する属性定義。
   * @ko 실행 세대를 검사하는 속성 정의입니다.
   */
  definition: PropertyDefinition;
}

/**
 * A shorthand component referencing another shorthand.
 *
 * @zh 引用另一简写的组成项。
 * @ja 別の短縮形を参照する構成項目。
 * @ko 다른 단축 속성을 참조하는 구성 항목입니다.
 */
export interface RecursiveShorthandItem extends ShorthandItemOptions {
  /**
   * Identifies Rml::ShorthandItemType::Shorthand.
   *
   * @zh 表示 Rml::ShorthandItemType::Shorthand。
   * @ja Rml::ShorthandItemType::Shorthand を表します。
   * @ko Rml::ShorthandItemType::Shorthand를 나타냅니다.
   */
  type: 'shorthand';

  /**
   * Native identifier of the nested shorthand.
   *
   * @zh 嵌套简写的原生编号。
   * @ja 入れ子の短縮形のネイティブ ID。
   * @ko 중첩 단축 속성의 네이티브 식별자입니다.
   */
  shorthandId: ShorthandId;

  /**
   * Snapshot of the nested shorthand.
   *
   * @zh 嵌套简写的快照。
   * @ja 入れ子の短縮形のスナップショット。
   * @ko 중첩 단축 속성의 스냅샷입니다.
   */
  definition: ShorthandDefinition;
}

/**
 * Snapshot of Rml::ShorthandDefinition with checked property references.
 *
 * @zh Rml::ShorthandDefinition 的快照，包含受检查的属性引用。
 * @ja 検証付き属性参照を持つ Rml::ShorthandDefinition のスナップショット。
 * @ko 검사된 속성 참조를 포함한 Rml::ShorthandDefinition 스냅샷입니다.
 */
export interface ShorthandDefinition {
  /**
   * Native shorthand identifier.
   *
   * @zh 原生简写编号。
   * @ja ネイティブ短縮形 ID。
   * @ko 네이티브 단축 속성 식별자입니다.
   */
  id: ShorthandId;

  /**
   * Native parsing strategy.
   *
   * @zh 原生解析策略。
   * @ja ネイティブ解析方式。
   * @ko 네이티브 해석 방식입니다.
   */
  type: ShorthandType;

  /**
   * Whether any underlying property inherits.
   *
   * @zh 是否存在可继承的底层属性。
   * @ja 継承する構成属性があるかどうか。
   * @ko 상속되는 하위 속성이 있는지 여부입니다.
   */
  inherited: boolean;

  /**
   * Ordered component snapshots; editing the array does not change RmlUi.
   *
   * @zh 有序组成项快照；编辑数组不会改变 RmlUi。
   * @ja 順序付き構成項目のコピー。配列の編集は RmlUi を変更しません。
   * @ko 순서가 있는 구성 항목 스냅샷이며 배열 수정은 RmlUi를 변경하지 않습니다.
   */
  items: Array<PropertyShorthandItem | RecursiveShorthandItem>;
}

/** @internal */
export interface NativeShorthandDefinition {
  id: ShorthandId;
  type: ShorthandType;
  inherited: boolean;
  items: Array<ShorthandItemOptions & (
    { type: 'property'; propertyId: PropertyId; definition: object } |
    {
      type: 'shorthand';
      shorthandId: ShorthandId;
      definition: NativeShorthandDefinition;
    }
  )>;
}

/**
 * Own an Rml::PropertySpecification with local property and shorthand ids.
 *
 * @zh 持有 Rml::PropertySpecification，使用局部属性和简写编号。
 * @ja ローカル属性・短縮形 ID を持つ Rml::PropertySpecification を所有します。
 * @ko 로컬 속성 및 단축 속성 ID를 갖는 Rml::PropertySpecification을 소유합니다.
 * @remarks
 * Registered definitions retain native storage until shutdown, including when
 * this JS wrapper is collected. Shutdown invalidates specifications and their
 * definitions. Returned id arrays and shorthand structures are snapshots.
 * @zh 注册的定义保留原生存储至关闭，即使当前 JS 包装器已被回收。
 * 关闭使规格和定义失效。返回的编号数组和简写结构均为快照。
 * @ja JS ラッパーの回収後も登録済み定義は終了まで保持されます。
 * 終了すると仕様と定義は無効になります。ID 配列と短縮形構造はコピーです。
 * @ko JS 래퍼가 회수되어도 등록된 정의는 종료까지 네이티브 저장소를 유지합니다.
 * 종료 시 명세와 정의가 무효화됩니다. 반환된 ID 배열과 단축 구조는 스냅샷입니다.
 */
export class PropertySpecification {
  /**
   * Construct a native specification with bounded initial reservations.
   *
   * @zh 使用有界初始预留容量构造原生规格。
   * @ja 上限内の初期予約容量でネイティブ仕様を構築します。
   * @ko 제한된 초기 예약 용량으로 네이티브 명세를 생성합니다.
   * @param reserveProperties - Initial property capacity, from 0 to 127.
   * @zh reserveProperties - 属性初始容量，范围 0 至 127。
   * @ja reserveProperties - 属性の初期容量。0〜127。
   * @ko reserveProperties - 초기 속성 용량이며 0부터 127까지입니다.
   * @param reserveShorthands - Initial shorthand capacity, from 0 to 254.
   * @zh reserveShorthands - 简写初始容量，范围 0 至 254。
   * @ja reserveShorthands - 短縮形の初期容量。0〜254。
   * @ko reserveShorthands - 초기 단축 속성 용량이며 0부터 254까지입니다.
   */
  constructor(reserveProperties: number, reserveShorthands: number) {
    specifications.set(this, native.createPropertySpecification(
      reserveProperties, reserveShorthands));
  }

  /**
   * Register a property and its default, inheritance and layout behavior
   * in this specification.
   *
   * @zh 在此规范中注册属性及其默认值、继承和布局行为。
   * @ja この仕様にプロパティと既定値・継承・レイアウト動作を登録します。
   * @ko 이 명세에 속성과 기본값·상속·레이아웃 동작을 등록합니다.
   * @param name - Property name; empty and "invalid" are reserved.
   * @zh name - 属性名；空字符串和 "invalid" 为保留值。
   * @ja name - 属性名。空文字列と "invalid" は予約済みです。
   * @ko name - 속성 이름이며 빈 문자열과 "invalid"는 예약 값입니다.
   * @param defaultValue - Unparsed default value.
   * @zh defaultValue - 未解析的默认值。
   * @ja defaultValue - 未解析の既定値。
   * @ko defaultValue - 해석 전 기본값입니다.
   * @param inherited - Whether the property inherits.
   * @zh inherited - 是否继承。
   * @ja inherited - 継承の有無。
   * @ko inherited - 상속 여부입니다.
   * @param forcesLayout - Whether changes dirty layout.
   * @zh forcesLayout - 变更是否使布局失效。
   * @ja forcesLayout - 変更でレイアウト更新が必要になるか。
   * @ko forcesLayout - 변경 시 레이아웃 갱신이 필요한지 여부입니다.
   * @param id - Explicit local id, or Invalid for the next id; default Invalid.
   * @zh id - 显式局部编号；Invalid 自动分配下个编号，默认 Invalid。
   * @ja id - ローカル ID。Invalid なら次を割り当てます。既定は Invalid。
   * @ko id - 명시적 로컬 ID이며 Invalid이면 다음 ID를 할당합니다. 기본값은 Invalid입니다.
   * @returns Mutable definition, preserving an existing same-name definition.
   * @zh 可修改的定义；同名定义已存在时保留原定义。
   * @ja 変更可能な定義。同名の既存定義は保持します。
   * @ko 수정 가능한 정의이며 같은 이름의 기존 정의는 유지합니다.
   * @throws RangeError for id collisions or capacity exhaustion.
   * @zh 编号冲突或容量耗尽时抛出 RangeError。
   * @ja ID の競合または容量超過で RangeError。
   * @ko ID 충돌 또는 용량 소진 시 RangeError가 발생합니다.
   */
  registerProperty(
    name: string, defaultValue: string, inherited: boolean,
    forcesLayout: boolean, id: PropertyId = PropertyId.Invalid,
  ): PropertyDefinition {
    return definitionFromNative(native.specificationRegisterProperty(
      specificationHandle(this), name, defaultValue, inherited, forcesLayout,
      id));
  }

  /**
   * Look up either Rml::PropertySpecification::GetProperty overload.
   *
   * @zh 查询 Rml::PropertySpecification::GetProperty 的名称或编号重载。
   * @ja 名前または ID による Rml::PropertySpecification::GetProperty。
   * @ko 이름 또는 ID로 Rml::PropertySpecification::GetProperty를 조회합니다.
   * @param nameOrId - Local property name or id.
   * @zh nameOrId - 局部属性名称或编号。
   * @ja nameOrId - ローカル属性名または ID。
   * @ko nameOrId - 로컬 속성 이름 또는 ID입니다.
   * @returns Checked definition, or null when absent.
   * @zh 受检查的定义；不存在时为 null。
   * @ja 検証付き定義。存在しなければ null。
   * @ko 검사된 정의이며 없으면 null입니다.
   */
  getProperty(nameOrId: string | PropertyId): PropertyDefinition | null {
    const handle = native.specificationGetProperty(
      specificationHandle(this), nameOrId);
    return handle === null ? null : definitionFromNative(handle);
  }

  /**
   * Copy Rml::PropertySpecification::GetRegisteredProperties.
   *
   * @zh 复制 Rml::PropertySpecification::GetRegisteredProperties。
   * @ja Rml::PropertySpecification::GetRegisteredProperties をコピーします。
   * @ko Rml::PropertySpecification::GetRegisteredProperties를 복사합니다.
   * @returns Registered ids in ascending order.
   * @zh 按升序排列的注册编号。
   * @ja 昇順の登録済み ID。
   * @ko 오름차순으로 정렬된 등록 ID입니다.
   */
  getRegisteredProperties(): PropertyId[] {
    return native.specificationGetRegisteredProperties(
      specificationHandle(this));
  }

  /**
   * Copy Rml::PropertySpecification::GetRegisteredInheritedProperties.
   *
   * @zh 复制 Rml::PropertySpecification::GetRegisteredInheritedProperties。
   * @ja Rml::PropertySpecification::GetRegisteredInheritedProperties をコピーします。
   * @ko Rml::PropertySpecification::GetRegisteredInheritedProperties를 복사합니다.
   * @returns Inherited ids in ascending order.
   * @zh 按升序排列的可继承编号。
   * @ja 昇順の継承属性 ID。
   * @ko 오름차순으로 정렬된 상속 속성 ID입니다.
   */
  getRegisteredInheritedProperties(): PropertyId[] {
    return native.specificationGetRegisteredInheritedProperties(
      specificationHandle(this));
  }

  /**
   * Copy Rml::PropertySpecification::GetRegisteredPropertiesForcingLayout.
   *
   * @zh 复制 Rml::PropertySpecification::GetRegisteredPropertiesForcingLayout。
   * @ja レイアウトを更新する登録済み属性をコピーします。
   * @ko 레이아웃을 갱신하는 등록 속성을 복사합니다.
   * @returns Layout-forcing ids in ascending order.
   * @zh 按升序排列的强制布局编号。
   * @ja 昇順のレイアウト更新属性 ID。
   * @ko 오름차순으로 정렬된 레이아웃 갱신 속성 ID입니다.
   */
  getRegisteredPropertiesForcingLayout(): PropertyId[] {
    return native.specificationGetRegisteredPropertiesForcingLayout(
      specificationHandle(this));
  }

  /**
   * Register a shorthand and its component properties
   * in this local specification.
   *
   * @zh 在此局部规范中注册简写及其组成属性。
   * @ja このローカル仕様に短縮形と構成プロパティを登録します。
   * @ko 이 로컬 명세에 단축 속성과 구성 속성을 등록합니다.
   * @param name - Shorthand name.
   * @zh name - 简写名称。
   * @ja name - 短縮形の名前。
   * @ko name - 단축 속성 이름입니다.
   * @param properties - Comma-separated component names, with native ?/# flags.
   * @zh properties - 逗号分隔的组成项名称，可带原生 ?/# 标志。
   * @ja properties - カンマ区切りの構成名。ネイティブ ?/# フラグに対応。
   * @ko properties - 쉼표로 구분된 구성 이름이며 네이티브 ?/# 플래그를 지원합니다.
   * @param type - Native shorthand parsing strategy.
   * @zh type - 原生简写解析策略。
   * @ja type - ネイティブ短縮形解析方式。
   * @ko type - 네이티브 단축 속성 해석 방식입니다.
   * @param id - Explicit local id, or Invalid to allocate; default Invalid.
   * @zh id - 显式局部编号；Invalid 自动分配，默认 Invalid。
   * @ja id - ローカル ID。Invalid なら割り当てます。既定は Invalid。
   * @ko id - 명시적 로컬 ID이며 Invalid이면 할당합니다. 기본값은 Invalid입니다.
   * @returns Registered id, or Invalid for missing components or duplicates.
   * @zh 注册编号；组成项缺失或重复注册时为 Invalid。
   * @ja 登録 ID。構成項目の欠落や重複時は Invalid。
   * @ko 등록 ID이며 구성 항목 누락 또는 중복 시 Invalid입니다.
   * @remarks
   * Invalid declarations do not reserve names or ids. Box requires four
   * properties and Flex three; malformed counts, id collisions and exhausted
   * capacity throw RangeError before native registration.
   * @zh 无效声明不占用名称或编号。Box 需要四个属性，Flex 需要三个；
   * 项数错误、编号冲突或容量耗尽时在原生注册前抛出 RangeError。
   * @ja 無効な宣言は名前や ID を予約しません。Box は四属性、Flex は三属性です。
   * 項目数不正、ID 競合、容量超過は登録前に RangeError を返します。
   * @ko 잘못된 선언은 이름이나 ID를 예약하지 않습니다. Box는 네 속성, Flex는 세 속성이 필요합니다.
   * 항목 수 오류, ID 충돌, 용량 소진은 등록 전에 RangeError를 발생시킵니다.
   */
  registerShorthand(
    name: string, properties: string, type: ShorthandType,
    id: ShorthandId = ShorthandId.Invalid,
  ): ShorthandId {
    return native.specificationRegisterShorthand(
      specificationHandle(this), name, properties, type, id);
  }

  /**
   * Copy either Rml::PropertySpecification::GetShorthand overload.
   *
   * @zh 复制 Rml::PropertySpecification::GetShorthand 的名称或编号重载结果。
   * @ja 名前または ID による Rml::PropertySpecification::GetShorthand のコピー。
   * @ko 이름 또는 ID로 Rml::PropertySpecification::GetShorthand 결과를 복사합니다.
   * @param nameOrId - Local shorthand name or id.
   * @zh nameOrId - 局部简写名称或编号。
   * @ja nameOrId - ローカル短縮形名または ID。
   * @ko nameOrId - 로컬 단축 속성 이름 또는 ID입니다.
   * @returns Structural snapshot with live definitions, or null when absent.
   * @zh 包含活动定义的结构快照；不存在时为 null。
   * @ja 有効な定義を含む構造コピー。存在しなければ null。
   * @ko 유효한 정의가 포함된 구조 스냅샷이며 없으면 null입니다.
   */
  getShorthand(nameOrId: string | ShorthandId): ShorthandDefinition | null {
    return shorthandFromNative(native.specificationGetShorthand(
      specificationHandle(this), nameOrId));
  }

  /**
   * Parse either Rml::PropertySpecification::ParsePropertyDeclaration overload.
   *
   * @zh 解析 Rml::PropertySpecification::ParsePropertyDeclaration 的名称或编号重载。
   * @ja 名前または ID による Rml::PropertySpecification::ParsePropertyDeclaration。
   * @ko 이름 또는 ID로 네이티브 속성 선언을 해석합니다.
   * @param dictionary - Native output dictionary.
   * @zh dictionary - 原生输出字典。
   * @ja dictionary - ネイティブ出力辞書。
   * @ko dictionary - 네이티브 출력 사전입니다.
   * @param nameOrId - Property/shorthand/custom variable name, or property id.
   * @zh nameOrId - 属性、简写、自定义变量名称，或属性编号。
   * @ja nameOrId - 属性・短縮形・カスタム変数の名前、または属性 ID。
   * @ko nameOrId - 속성, 단축 속성, 사용자 변수 이름 또는 속성 ID입니다.
   * @param value - Raw declaration value.
   * @zh value - 原始声明值。
   * @ja value - 宣言の生の値。
   * @ko value - 원시 선언 값입니다.
   * @returns Native success; partial native writes remain on failure.
   * @zh 原生成功结果；失败时保留原生部分写入。
   * @ja ネイティブ成功結果。失敗時の部分的な書き込みは保持します。
   * @ko 네이티브 성공 결과이며 실패 시 일부 기록은 유지됩니다.
   */
  parsePropertyDeclaration(
    dictionary: PropertyDictionary, nameOrId: string | PropertyId,
    value: string,
  ): boolean {
    return native.specificationParsePropertyDeclaration(
      specificationHandle(this), propertyDictionaryHandle(dictionary),
      nameOrId, value);
  }

  /**
   * Parse a shorthand declaration into its component properties
   * in the output dictionary.
   *
   * @zh 将简写声明解析为组成属性，写入输出字典。
   * @ja 短縮形の宣言を構成プロパティに解析し出力辞書に書き込みます。
   * @ko 단축 선언을 구성 속성으로 해석하여 출력 사전에 기록합니다.
   * @param dictionary - Native output dictionary.
   * @zh dictionary - 原生输出字典。
   * @ja dictionary - ネイティブ出力辞書。
   * @ko dictionary - 네이티브 출력 사전입니다.
   * @param id - Registered local shorthand id.
   * @zh id - 已注册的局部简写编号。
   * @ja id - 登録済みローカル短縮形 ID。
   * @ko id - 등록된 로컬 단축 속성 ID입니다.
   * @param value - Raw declaration value.
   * @zh value - 原始声明值。
   * @ja value - 宣言の生の値。
   * @ko value - 원시 선언 값입니다.
   * @returns Native success; partial native writes remain on failure.
   * @zh 原生成功结果；失败时保留原生部分写入。
   * @ja ネイティブ成功結果。失敗時の部分的な書き込みは保持します。
   * @ko 네이티브 성공 결과이며 실패 시 일부 기록은 유지됩니다.
   */
  parseShorthandDeclaration(
    dictionary: PropertyDictionary, id: ShorthandId, value: string,
  ): boolean {
    return native.specificationParseShorthandDeclaration(
      specificationHandle(this), propertyDictionaryHandle(dictionary), id,
      value);
  }

  /**
   * Fill missing values with Rml::PropertySpecification::SetPropertyDefaults.
   *
   * @zh 使用 Rml::PropertySpecification::SetPropertyDefaults 填充未定义属性。
   * @ja Rml::PropertySpecification::SetPropertyDefaults で未定義属性を埋めます。
   * @ko 네이티브 기본값으로 미정의 속성을 채웁니다.
   * @param dictionary - Dictionary updated without overwriting existing values.
   * @zh dictionary - 待更新的字典，不覆盖现有值。
   * @ja dictionary - 更新する辞書。既存の値は上書きしません。
   * @ko dictionary - 갱신할 사전이며 기존 값은 덮어쓰지 않습니다.
   */
  setPropertyDefaults(dictionary: PropertyDictionary): void {
    native.specificationSetDefaults(specificationHandle(this),
      propertyDictionaryHandle(dictionary));
  }

  /**
   * Rml::PropertySpecification::PropertiesToString in ascending property order.
   *
   * @zh 按属性编号升序执行 Rml::PropertySpecification::PropertiesToString。
   * @ja 属性 ID 昇順の Rml::PropertySpecification::PropertiesToString。
   * @ko 속성 ID 오름차순으로 Rml::PropertySpecification::PropertiesToString을 호출합니다.
   * @param dictionary - Dictionary whose plain properties are serialized.
   * @zh dictionary - 序列化其普通属性的字典。
   * @ja dictionary - 通常の属性を直列化する辞書。
   * @ko dictionary - 일반 속성을 직렬화할 사전입니다.
   * @param includeName - Include property names before values.
   * @zh includeName - 在值前包含属性名称。
   * @ja includeName - 値の前に属性名を含めます。
   * @ko includeName - 값 앞에 속성 이름을 포함합니다.
   * @param delimiter - One UTF-8 byte, matching the native char parameter.
   * @zh delimiter - 一个 UTF-8 字节，与原生 char 参数一致。
   * @ja delimiter - ネイティブ char 引数に対応する一 UTF-8 バイト。
   * @ko delimiter - 네이티브 char 인수에 해당하는 UTF-8 한 바이트입니다.
   * @throws TypeError if a serialized property contains a native pointer.
   * @zh 参与序列化的属性包含原生指针时抛出 TypeError。
   * @ja 直列化する属性にネイティブポインターが含まれる場合は TypeError。
   * @ko 직렬화되는 속성에 네이티브 포인터가 있으면 TypeError가 발생합니다.
   * @returns Native text without a trailing delimiter.
   * @zh 不含末尾分隔符的原生文本。
   * @ja 末尾に区切りを含まないネイティブ文字列。
   * @ko 끝 구분자가 없는 네이티브 문자열입니다.
   */
  propertiesToString(
    dictionary: PropertyDictionary, includeName: boolean, delimiter: string,
  ): string {
    return native.specificationPropertiesToString(specificationHandle(this),
      propertyDictionaryHandle(dictionary), includeName, delimiter);
  }
}

/**
 * Resolve a specification without accepting structural imitations.
 *
 * @internal
 * @param value - Public specification.
 * @returns Checked native token.
 */
export function specificationHandle(value: PropertySpecification): object {
  const handle = specifications.get(value);
  if (!handle) {
    throw new TypeError('Expected a PropertySpecification');
  }
  return handle;
}

/**
 * Wrap a borrowed native specification.
 *
 * @internal
 * @param handle - Checked native token.
 * @returns Public specification wrapper.
 */
export function specificationFromNative(handle: object): PropertySpecification {
  const result = Object.create(PropertySpecification.prototype) as
    PropertySpecification;
  specifications.set(result, handle);
  return result;
}

/**
 * Convert the native snapshot graph in linear space.
 *
 * @internal
 * @param value - Snapshot containing native definition handles.
 * @returns Snapshot with public definition wrappers.
 */
export function shorthandFromNative(value: NativeShorthandDefinition | null):
ShorthandDefinition | null {
  const snapshots = new Map<NativeShorthandDefinition, ShorthandDefinition>();
  const wrap = (source: NativeShorthandDefinition): ShorthandDefinition => {
    const previous = snapshots.get(source);
    if (previous) {
      return previous;
    }
    const result: ShorthandDefinition = {
      id: source.id, type: source.type, inherited: source.inherited, items: [],
    };
    snapshots.set(source, result);
    result.items = source.items.map(item => (item.type === 'property' ? {
      ...item, definition: definitionFromNative(item.definition),
    } : {
      ...item, definition: wrap(item.definition),
    }));
    return result;
  };
  return value === null ? null : wrap(value);
}
