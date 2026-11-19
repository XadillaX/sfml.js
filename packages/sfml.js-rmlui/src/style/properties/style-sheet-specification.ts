import { native } from '../../internal/native';
import { PropertyId } from '../../generated/property-ids';
import { ShorthandId } from '../../generated/shorthand-ids';
import {
  PropertyDefinition, definitionFromNative,
} from './property-definition';
import { PropertyDictionary } from './property-dictionary';
import {
  PropertyParser, parserFromNative, parserHandle,
} from './property-parser';
import {
  PropertySpecification, ShorthandDefinition, ShorthandType,
  specificationFromNative,
} from './property-specification';

/**
 * Rml::StyleSheetSpecification, the runtime's global RCSS registry.
 *
 * @zh Rml::StyleSheetSpecification，即运行时的全局 RCSS 注册表。
 * @ja ランタイムのグローバル RCSS レジストリ Rml::StyleSheetSpecification。
 * @ko 런타임의 전역 RCSS 레지스트리인 Rml::StyleSheetSpecification입니다.
 * @remarks
 * Initialise and Shutdown follow the owning RmlUi runtime automatically.
 * Register custom properties before loading documents. Built-in definitions
 * are read-only; custom definitions remain mutable until shutdown.
 * @zh Initialise 和 Shutdown 自动跟随所属 RmlUi 运行时。
 * 自定义属性应在加载文档前注册。内置定义只读，自定义定义在关闭前可修改。
 * @ja 初期化と終了は RmlUi ランタイムに従います。文書を読む前にカスタム属性を登録します。
 * 組み込み定義は読み取り専用で、カスタム定義は終了まで変更可能です。
 * @ko 초기화와 종료는 RmlUi 런타임을 따릅니다. 문서를 로드하기 전에 사용자 속성을 등록하세요.
 * 내장 정의는 읽기 전용이며 사용자 정의는 종료까지 수정할 수 있습니다.
 */
export class StyleSheetSpecification {
  private constructor() {}

  /**
   * Register a named property parser in the global stylesheet specification.
   *
   * @zh 在全局样式表规范中注册具名属性解析器。
   * @ja グローバルスタイルシート仕様に名前付きプロパティ解析器を登録します。
   * @ko 전역 스타일시트 명세에 이름 지정 속성 해석기를 등록합니다.
   * @param name - Non-empty parser name.
   * @zh name - 非空解析器名称。
   * @ja name - 空でない解析器名。
   * @ko name - 비어 있지 않은 해석기 이름입니다.
   * @param parser - Parser retained until runtime shutdown.
   * @zh parser - 保留到运行时关闭的解析器。
   * @ja parser - ランタイム終了まで保持する解析器。
   * @ko parser - 런타임 종료까지 유지되는 해석기입니다.
   * @returns False for duplicate names without replacing the existing parser.
   * @zh 名称重复时返回 false，不替换原解析器。
   * @ja 名前が重複すると false。既存の解析器は置換しません。
   * @ko 이름이 중복되면 기존 해석기를 교체하지 않고 false를 반환합니다.
   */
  static registerParser(name: string, parser: PropertyParser): boolean {
    return native.styleRegisterParser(name, parserHandle(parser));
  }

  /**
   * Look up Rml::StyleSheetSpecification::GetParser.
   *
   * @zh 查询 Rml::StyleSheetSpecification::GetParser。
   * @ja Rml::StyleSheetSpecification::GetParser で検索します。
   * @ko Rml::StyleSheetSpecification::GetParser로 조회합니다.
   * @param name - Registered parser name.
   * @zh name - 已注册的解析器名称。
   * @ja name - 登録済み解析器名。
   * @ko name - 등록된 해석기 이름입니다.
   * @returns Checked parser or null.
   * @zh 受检查的解析器或 null。
   * @ja 検証付き解析器または null。
   * @ko 검사된 해석기 또는 null입니다.
   */
  static getParser(name: string): PropertyParser | null {
    const handle = native.styleGetParser(name);
    return handle === null ? null : parserFromNative(handle);
  }

  /**
   * Register a custom Rml::StyleSheetSpecification property.
   *
   * @zh 注册自定义 Rml::StyleSheetSpecification 属性。
   * @ja カスタム Rml::StyleSheetSpecification 属性を登録します。
   * @ko 사용자 Rml::StyleSheetSpecification 속성을 등록합니다.
   * @param name - Unique name, excluding built-in properties and shorthands.
   * @zh name - 唯一名称，不得与内置属性或简写重名。
   * @ja name - 組み込み属性や短縮形と重複しない一意な名前。
   * @ko name - 내장 속성이나 단축 속성과 중복되지 않는 고유 이름입니다.
   * @param defaultValue - Raw default value, parsed after attaching a parser.
   * @zh defaultValue - 原始默认值，添加解析器后解析。
   * @ja defaultValue - 解析器を追加してから解析する既定値。
   * @ko defaultValue - 해석기를 추가한 후 해석할 기본값입니다.
   * @param inherited - Whether descendants inherit the property.
   * @zh inherited - 后代是否继承该属性。
   * @ja inherited - 子孫が属性を継承するか。
   * @ko inherited - 하위 요소가 속성을 상속하는지 여부입니다.
   * @param forcesLayout - Whether changes dirty layout; default false.
   * @zh forcesLayout - 变更是否使布局失效，默认 false。
   * @ja forcesLayout - 変更でレイアウトを更新するか。既定は false。
   * @ko forcesLayout - 변경 시 레이아웃 갱신 여부이며 기본값은 false입니다.
   * @returns Mutable definition; repeated custom names preserve the original.
   * @zh 可修改的定义；重复的自定义名称保留原定义。
   * @ja 変更可能な定義。重複するカスタム名は元の定義を保持します。
   * @ko 수정 가능한 정의이며 중복된 사용자 이름은 기존 정의를 유지합니다.
   */
  static registerProperty(
    name: string, defaultValue: string, inherited: boolean,
    forcesLayout = false,
  ): PropertyDefinition {
    return definitionFromNative(native.styleRegisterProperty(
      name, defaultValue, inherited, forcesLayout));
  }

  /**
   * Resolve either Rml::StyleSheetSpecification::GetProperty overload.
   *
   * @zh 查询 Rml::StyleSheetSpecification::GetProperty 的两个重载。
   * @ja Rml::StyleSheetSpecification::GetProperty の両オーバーロード。
   * @ko Rml::StyleSheetSpecification::GetProperty의 두 오버로드입니다.
   * @param nameOrId - Global property name or id.
   * @zh nameOrId - 全局属性名称或编号。
   * @ja nameOrId - グローバル属性名または ID。
   * @ko nameOrId - 전역 속성 이름 또는 ID입니다.
   * @returns Checked definition or null.
   * @zh 受检查的定义或 null。
   * @ja 検証付き定義または null。
   * @ko 검사된 정의 또는 null입니다.
   */
  static getProperty(nameOrId: string | PropertyId): PropertyDefinition | null {
    return this.getPropertySpecification().getProperty(nameOrId);
  }

  /**
   * Copy Rml::StyleSheetSpecification::GetRegisteredProperties.
   *
   * @zh 复制 Rml::StyleSheetSpecification::GetRegisteredProperties。
   * @ja Rml::StyleSheetSpecification::GetRegisteredProperties のコピー。
   * @ko Rml::StyleSheetSpecification::GetRegisteredProperties를 복사합니다.
   * @returns Registered ids in ascending order.
   * @zh 按升序排列的已注册编号。
   * @ja 昇順の登録済み ID。
   * @ko 오름차순의 등록 ID입니다.
   */
  static getRegisteredProperties(): PropertyId[] {
    return this.getPropertySpecification().getRegisteredProperties();
  }

  /**
   * Copy Rml::StyleSheetSpecification::GetRegisteredInheritedProperties.
   *
   * @zh 复制 Rml::StyleSheetSpecification::GetRegisteredInheritedProperties。
   * @ja 継承する登録済み属性 ID をコピーします。
   * @ko 상속하는 등록 속성 ID를 복사합니다.
   * @returns Inherited ids in ascending order.
   * @zh 按升序排列的可继承编号。
   * @ja 昇順の継承属性 ID。
   * @ko 오름차순의 상속 속성 ID입니다.
   */
  static getRegisteredInheritedProperties(): PropertyId[] {
    return this.getPropertySpecification().getRegisteredInheritedProperties();
  }

  /**
   * Copy Rml::StyleSheetSpecification::GetRegisteredPropertiesForcingLayout.
   *
   * @zh 复制 Rml::StyleSheetSpecification::GetRegisteredPropertiesForcingLayout。
   * @ja レイアウトを更新する登録済み属性 ID をコピーします。
   * @ko 레이아웃을 갱신하는 등록 속성 ID를 복사합니다.
   * @returns Layout-forcing ids in ascending order.
   * @zh 按升序排列的强制布局编号。
   * @ja 昇順のレイアウト更新属性 ID。
   * @ko 오름차순의 레이아웃 갱신 속성 ID입니다.
   */
  static getRegisteredPropertiesForcingLayout(): PropertyId[] {
    return this.getPropertySpecification()
      .getRegisteredPropertiesForcingLayout();
  }

  /**
   * Register a shorthand that expands to named component properties.
   *
   * @zh 注册展开为具名组成属性的简写。
   * @ja 名前付き構成プロパティに展開する短縮形を登録します。
   * @ko 이름 지정 구성 속성으로 확장되는 단축 속성을 등록합니다.
   * @param name - Shorthand name, distinct from property names.
   * @zh name - 简写名称，不得与属性重名。
   * @ja name - 属性名と重複しない短縮形の名前。
   * @ko name - 속성 이름과 중복되지 않는 단축 속성 이름입니다.
   * @param properties - Comma-separated component names.
   * @zh properties - 逗号分隔的组成项名称。
   * @ja properties - カンマ区切りの構成項目名。
   * @ko properties - 쉼표로 구분된 구성 항목 이름입니다.
   * @param type - Native parsing strategy.
   * @zh type - 原生解析策略。
   * @ja type - ネイティブ解析方式。
   * @ko type - 네이티브 해석 방식입니다.
   * @returns Id, or Invalid for duplicates or missing components.
   * @zh 编号；名称重复或组成项缺失时返回 Invalid。
   * @ja ID。重複または構成項目欠落時は Invalid。
   * @ko ID이며 중복이나 구성 항목 누락 시 Invalid입니다.
   */
  static registerShorthand(
    name: string, properties: string, type: ShorthandType,
  ): ShorthandId {
    return native.styleRegisterShorthand(name, properties, type);
  }

  /**
   * Resolve either Rml::StyleSheetSpecification::GetShorthand overload.
   *
   * @zh 查询 Rml::StyleSheetSpecification::GetShorthand 的两个重载。
   * @ja Rml::StyleSheetSpecification::GetShorthand の両オーバーロード。
   * @ko Rml::StyleSheetSpecification::GetShorthand의 두 오버로드입니다.
   * @param nameOrId - Global shorthand name or id.
   * @zh nameOrId - 全局简写名称或编号。
   * @ja nameOrId - グローバル短縮形名または ID。
   * @ko nameOrId - 전역 단축 속성 이름 또는 ID입니다.
   * @returns Structural snapshot or null.
   * @zh 结构快照或 null。
   * @ja 構造スナップショットまたは null。
   * @ko 구조 스냅샷 또는 null입니다.
   */
  static getShorthand(
    nameOrId: string | ShorthandId,
  ): ShorthandDefinition | null {
    return this.getPropertySpecification().getShorthand(nameOrId);
  }

  /**
   * Apply Rml::StyleSheetSpecification::ParsePropertyDeclaration.
   *
   * @zh 执行 Rml::StyleSheetSpecification::ParsePropertyDeclaration。
   * @ja Rml::StyleSheetSpecification::ParsePropertyDeclaration を実行します。
   * @ko Rml::StyleSheetSpecification::ParsePropertyDeclaration을 실행합니다.
   * @param dictionary - Native output dictionary.
   * @zh dictionary - 原生输出字典。
   * @ja dictionary - ネイティブ出力辞書。
   * @ko dictionary - 네이티브 출력 사전입니다.
   * @param name - Property, shorthand, or custom variable name.
   * @zh name - 属性、简写或自定义变量名称。
   * @ja name - 属性、短縮形、またはカスタム変数の名前。
   * @ko name - 속성, 단축 속성 또는 사용자 변수 이름입니다.
   * @param value - Raw declaration text.
   * @zh value - 原始声明文本。
   * @ja value - 宣言の生のテキスト。
   * @ko value - 원시 선언 문자열입니다.
   * @returns Native success, preserving partial writes on failure.
   * @zh 原生成功结果；失败时保留部分写入。
   * @ja ネイティブ成功結果。失敗時の部分的な書き込みを保持します。
   * @ko 네이티브 성공 결과이며 실패 시 일부 기록은 유지됩니다.
   */
  static parsePropertyDeclaration(
    dictionary: PropertyDictionary, name: string, value: string,
  ): boolean {
    return this.getPropertySpecification().parsePropertyDeclaration(
      dictionary, name, value);
  }

  /**
   * Look up a global property identifier by its registered name.
   *
   * @zh 按注册名称查询全局属性标识。
   * @ja 登録名からグローバルプロパティ識別子を検索します。
   * @ko 등록 이름으로 전역 속성 식별자를 조회합니다.
   * @param name - Global property name.
   * @zh name - 全局属性名称。
   * @ja name - グローバル属性名。
   * @ko name - 전역 속성 이름입니다.
   * @returns Id, or Invalid if missing.
   * @zh 编号；不存在时为 Invalid。
   * @ja ID。存在しなければ Invalid。
   * @ko ID이며 없으면 Invalid입니다.
   */
  static getPropertyId(name: string): PropertyId {
    return native.styleGetPropertyId(name);
  }

  /**
   * Look up a global shorthand identifier by its registered name.
   *
   * @zh 按注册名称查询全局简写标识。
   * @ja 登録名からグローバル短縮形識別子を検索します。
   * @ko 등록 이름으로 전역 단축 속성 식별자를 조회합니다.
   * @param name - Global shorthand name.
   * @zh name - 全局简写名称。
   * @ja name - グローバル短縮形名。
   * @ko name - 전역 단축 속성 이름입니다.
   * @returns Id, or Invalid if missing.
   * @zh 编号；不存在时为 Invalid。
   * @ja ID。存在しなければ Invalid。
   * @ko ID이며 없으면 Invalid입니다.
   */
  static getShorthandId(name: string): ShorthandId {
    return native.styleGetShorthandId(name);
  }

  /**
   * Get the registered name of a global property identifier.
   *
   * @zh 获取全局属性标识的注册名称。
   * @ja グローバルプロパティ識別子の登録名を取得します。
   * @ko 전역 속성 식별자의 등록 이름을 가져옵니다.
   * @param id - Global property id.
   * @zh id - 全局属性编号。
   * @ja id - グローバル属性 ID。
   * @ko id - 전역 속성 ID입니다.
   * @returns Registered name or "invalid".
   * @zh 已注册的名称或 "invalid"。
   * @ja 登録済みの名前または "invalid"。
   * @ko 등록된 이름 또는 "invalid"입니다.
   */
  static getPropertyName(id: PropertyId): string {
    return native.styleGetPropertyName(id);
  }

  /**
   * Get the registered name of a global shorthand identifier.
   *
   * @zh 获取全局简写标识的注册名称。
   * @ja グローバル短縮形識別子の登録名を取得します。
   * @ko 전역 단축 속성 식별자의 등록 이름을 가져옵니다.
   * @param id - Global shorthand id.
   * @zh id - 全局简写编号。
   * @ja id - グローバル短縮形 ID。
   * @ko id - 전역 단축 속성 ID입니다.
   * @returns Registered name or "invalid".
   * @zh 已注册的名称或 "invalid"。
   * @ja 登録済みの名前または "invalid"。
   * @ko 등록된 이름 또는 "invalid"입니다.
   */
  static getShorthandName(id: ShorthandId): string {
    return native.styleGetShorthandName(id);
  }

  /**
   * Recursively collect all unique property identifiers
   * referenced by a shorthand.
   *
   * @zh 递归收集简写引用的所有不重复属性标识。
   * @ja 短縮形が参照する全属性 ID を再帰的に取得します。
   * @ko 단축 속성이 참조하는 모든 속성 ID를 재귀적으로 가져옵니다.
   * @param id - Global shorthand id.
   * @zh id - 全局简写编号。
   * @ja id - グローバル短縮形 ID。
   * @ko id - 전역 단축 속성 ID입니다.
   * @returns Unique property ids in ascending order.
   * @zh 按升序排列的不重复属性编号。
   * @ja 昇順の重複しない属性 ID。
   * @ko 오름차순의 중복 없는 속성 ID입니다.
   */
  static getShorthandUnderlyingProperties(id: ShorthandId): PropertyId[] {
    return native.styleGetShorthandUnderlyingProperties(id);
  }

  /**
   * Get a read-only view of the global stylesheet property registry.
   *
   * @zh 获取全局样式表属性注册表的只读视图。
   * @ja グローバルスタイルシートのプロパティレジストリを読み取り専用で取得します。
   * @ko 전역 스타일시트 속성 레지스트리의 읽기 전용 뷰를 가져옵니다.
   * @returns Borrowed read-only registry, invalidated at runtime shutdown.
   * @zh 借用的只读注册表，在运行时关闭后失效。
   * @ja ランタイム終了時に無効になる、借用した読み取り専用レジストリ。
   * @ko 런타임 종료 시 무효화되는 대여된 읽기 전용 레지스트리입니다.
   */
  static getPropertySpecification(): PropertySpecification {
    return specificationFromNative(native.styleGetPropertySpecification());
  }
}
