import { native, type NativeProperty } from '../../internal/native';
import type { Element } from './element';
import type { ElementNativeHandle, VariantVector2 } from '../../values/types';
import {
  Property, propertyHandle, propertyFromNative,
} from '../../style/properties/property';
import {
  PropertyDictionary, propertyDictionaryHandle, propertyDictionaryFromNative,
} from '../../style/properties/property-dictionary';
import { NumericValue, numericValueHandle } from '../../values/numeric-value';
import type {
  RelativeTarget,
} from '../../style/properties/property-definition';
import type { PropertyId } from '../../generated/property-ids';
import type { ShorthandId } from '../../generated/shorthand-ids';
import type { Unit } from '../../values/unit';
import type {
  ComputedValues, ComputedValuesView,
} from '../../style/values/computed-values';
import { computedHandle } from '../../internal/computed';

const handles = new WeakMap<ElementStyle, ElementNativeHandle>();
const wrappers = new WeakMap<ElementNativeHandle, ElementStyle>();
const resolvers = new WeakMap<KeyFramePropertyResolver, object>();

/**
 * Resolve the authentic component token.
 *
 * @internal
 * @param value - Style receiver.
 * @returns Checked element token.
 */
function handle(value: ElementStyle): ElementNativeHandle {
  const result = handles.get(value);
  if (!result) {
    throw new TypeError('Expected an ElementStyle');
  }
  return result;
}

/**
 * Resolve reusable native keyframe storage.
 *
 * @internal
 * @param value - Resolver receiver.
 * @returns Native resolver handle.
 */
function resolverHandle(value: KeyFramePropertyResolver): object {
  const result = resolvers.get(value);
  if (!result) {
    throw new TypeError('Expected a KeyFramePropertyResolver');
  }
  return result;
}

/**
 * Convert a nullable owned property snapshot.
 *
 * @internal
 * @param token - Native snapshot.
 * @returns Owned property or null.
 */
function property(token: NativeProperty | null): Property | null {
  return token === null ? null : propertyFromNative(token);
}

/**
 * Native reusable optional shorthand cache, dependencies and output storage.
 *
 * @zh 原生可复用的可选简写缓存、变量依赖和输出存储。
 * @ja 再利用可能なネイティブ短縮形キャッシュ・変数依存・出力保存領域。
 * @ko 재사용 가능한 네이티브 약식 캐시, 변수 의존성 및 출력 저장소입니다.
 * @remarks
 * Reuse for one keyframe block. reset before changing its properties or the
 * variable environment. Results are independent property snapshots. Runtime
 * shutdown releases native resources and invalidates this resolver.
 * @zh 在同一关键帧块中复用；块属性或变量环境变化前调用 reset。结果为独立
 * 属性快照。关闭运行时会释放原生资源并使解析器失效。
 * @ja 同じキーフレームブロックで再利用します。属性や変数環境を変える前に reset
 * します。結果は独立したコピーです。終了時に資源を解放し無効になります。
 * @ko 같은 키프레임 블록에서 재사용하며 속성이나 변수 환경 변경 전에 reset하세요.
 * 결과는 독립 사본이며 런타임 종료 시 자원을 해제하고 무효화합니다.
 */
export class KeyFramePropertyResolver {
  /**
   * Allocate empty native resolver storage.
   *
   * @zh 分配空原生解析存储。
   * @ja 空のネイティブ解析領域を確保します。
   * @ko 빈 네이티브 해석 저장소를 할당합니다.
   */
  constructor() {
    resolvers.set(this, native.createKeyFrameResolver());
  }

  /**
   * Clear optional cache, dependencies and output property.
   *
   * @zh 清空可选缓存、依赖和输出属性。
   * @ja キャッシュ・依存・出力属性を消去します。
   * @ko 선택 캐시, 의존성 및 출력 속성을 비웁니다.
   */
  reset(): void {
    native.resetKeyFrameResolver(resolverHandle(this));
  }

  /**
   * Whether shorthand expansion has lazily populated the native cache.
   *
   * @zh 简写展开是否已惰性填充原生缓存。
   * @ja 短縮形展開でネイティブキャッシュが生成済みか。
   * @ko 약식 확장으로 네이티브 캐시가 생성되었는지 여부입니다.
   * @returns Native optional cache state.
   * @zh 返回原生可选缓存状态。
   * @ja ネイティブ任意キャッシュの状態を返します。
   * @ko 네이티브 선택 캐시 상태를 반환합니다.
   */
  get hasSubstitutedShorthands(): boolean {
    return native.keyFrameResolverHasCache(resolverHandle(this));
  }

  /**
   * Copy dependencies from the last resolution; native clears them each call.
   *
   * @zh 复制最近一次解析的依赖；原生每次调用都会清空依赖集。
   * @ja 最後の解析の依存をコピーします。呼び出しごとに消去されます。
   * @ko 마지막 해석의 의존성을 복사하며 호출마다 초기화됩니다.
   * @returns Independent variable name list.
   * @zh 返回独立变量名列表。
   * @ja 独立した変数名一覧を返します。
   * @ko 독립 변수 이름 목록을 반환합니다.
   */
  get variableDependencies(): string[] {
    return native.keyFrameResolverDependencies(resolverHandle(this));
  }
}

/**
 * Checked element-owned Rml::ElementStyle with native cascade and dirty state.
 *
 * @zh 带检查的元素自有 Rml::ElementStyle，保留原生层叠与脏状态。
 * @ja ネイティブカスケードと変更状態を保持する要素所有の Rml::ElementStyle。
 * @ko 네이티브 캐스케이드와 변경 상태를 유지하는 요소 소유 Rml::ElementStyle입니다.
 * @remarks
 * Class and pseudo-class setters follow ElementStyle directly. Call
 * updateDefinition explicitly after changing them. Queries return owned
 * snapshots. High-frequency numeric operations use ElementCommandBuffer's
 * style opcodes and shared planes; normal layout computation stays native.
 * Element destruction and runtime shutdown invalidate every style operation.
 * @zh 类与伪类 setter 直接遵循 ElementStyle，变化后显式调用 updateDefinition。
 * 查询返回自有快照。高频数值操作使用 ElementCommandBuffer 的样式操作码和
 * 共享数据平面；常规布局计算留在原生。销毁元素或关闭运行时后全部操作失效。
 * @ja クラス・擬似クラスの変更後は updateDefinition を明示的に呼びます。
 * 取得値は所有コピーです。高頻度数値処理は共有コマンドを使い、配置計算は
 * ネイティブで実行します。要素破棄・ランタイム終了後は無効です。
 * @ko 클래스와 의사 클래스 변경 후 updateDefinition을 명시적으로 호출합니다.
 * 조회는 소유 사본이며 고빈도 수치는 공유 명령을 사용하고 배치 계산은 네이티브에서
 * 실행합니다. 요소 파괴나 런타임 종료 후에는 무효입니다.
 */
export class ElementStyle {
  private constructor() {}

  /**
   * Update the native stylesheet definition for current classes and state.
   *
   * @zh 更新当前类与状态对应的原生样式表定义。
   * @ja 現在のクラスと状態のネイティブスタイル定義を更新します。
   * @ko 현재 클래스와 상태의 네이티브 스타일 정의를 갱신합니다.
   */
  updateDefinition(): void {
    native.styleUpdateDefinition(handle(this));
  }

  /**
   * Set the native normal or override pseudo-class bit.
   *
   * @zh 设置原生普通或覆盖伪类位。
   * @ja 通常または上書きの擬似クラスビットを設定します。
   * @ko 일반 또는 재정의 의사 클래스 비트를 설정합니다.
   * @param name - Pseudo-class name.
   * @zh name - 伪类名称。
   * @ja name - 擬似クラス名。
   * @ko name - 의사 클래스 이름입니다.
   * @param activate - Add or remove the selected bit.
   * @zh activate - 添加或移除选中的位。
   * @ja activate - 選択ビットを追加または削除します。
   * @ko activate - 선택 비트를 추가하거나 제거합니다.
   * @param overrideClass - Select the override bit, retained on normal clear.
   * @zh overrideClass - 选择覆盖位，普通清除时保留。
   * @ja overrideClass - 通常解除でも残る上書きビットを選択します。
   * @ko overrideClass - 일반 해제 시 유지되는 재정의 비트를 선택합니다.
   * @returns Whether active membership changed, not just its bit state.
   * @zh 返回激活成员是否变化，而非仅位状态变化。
   * @ja ビット変更ではなく有効な所属の変更を返します。
   * @ko 비트 상태가 아닌 활성 포함 여부의 변경을 반환합니다.
   */
  setPseudoClass(name: string, activate: boolean,
    overrideClass = false): boolean {
    return native.styleSetPseudoClass(
      handle(this), name, activate, overrideClass);
  }

  /**
   * Test active pseudo-class membership.
   *
   * @zh 查询伪类是否激活。
   * @ja 擬似クラスが有効か調べます。
   * @ko 의사 클래스 활성 여부를 확인합니다.
   * @param name - Pseudo-class name.
   * @zh name - 伪类名称。
   * @ja name - 擬似クラス名。
   * @ko name - 의사 클래스 이름입니다.
   * @returns Whether either state bit is set.
   * @zh 返回是否设置任意状态位。
   * @ja いずれかの状態ビットが設定済みか返します。
   * @ko 상태 비트 중 하나가 설정되었는지 반환합니다.
   */
  isPseudoClassSet(name: string): boolean {
    return native.styleIsPseudoClassSet(handle(this), name);
  }

  /**
   * Snapshot pseudo-class bits: normal 1, override 2, combined 3.
   *
   * @zh 复制伪类位：普通 1、覆盖 2、组合 3。
   * @ja 擬似クラスのビットをコピーします。通常 1・上書き 2・両方 3。
   * @ko 의사 클래스 비트를 복사하며 일반 1, 재정의 2, 결합 3입니다.
   * @returns Independent name-to-state map.
   * @zh 返回独立的名称到状态映射。
   * @ja 独立した名前と状態のマップを返します。
   * @ko 독립 이름과 상태 맵을 반환합니다.
   */
  getActivePseudoClasses(): Map<string, number> {
    return new Map(native.styleGetActivePseudoClasses(handle(this)));
  }

  /**
   * Add or remove a native class without updating the definition.
   *
   * @zh 添加或移除原生类，不更新定义。
   * @ja 定義を更新せずネイティブクラスを追加・削除します。
   * @ko 정의 갱신 없이 네이티브 클래스를 추가하거나 제거합니다.
   * @param name - Class name.
   * @zh name - 类名。
   * @ja name - クラス名。
   * @ko name - 클래스 이름입니다.
   * @param activate - Add or remove.
   * @zh activate - 添加或移除。
   * @ja activate - 追加または削除します。
   * @ko activate - 추가하거나 제거합니다.
   * @returns Whether class membership changed.
   * @zh 返回类成员是否变化。
   * @ja クラス所属が変わったか返します。
   * @ko 클래스 포함 여부가 변경되었는지 반환합니다.
   */
  setClass(name: string, activate: boolean): boolean {
    return native.styleSetClass(handle(this), name, activate);
  }

  /**
   * Query native class membership.
   *
   * @zh 查询原生类成员。
   * @ja ネイティブクラスの所属を調べます。
   * @ko 네이티브 클래스 포함 여부를 확인합니다.
   * @param name - Class name.
   * @zh name - 类名。
   * @ja name - クラス名。
   * @ko name - 클래스 이름입니다.
   * @returns Whether present.
   * @zh 返回是否存在。
   * @ja 存在するか返します。
   * @ko 존재 여부를 반환합니다.
   */
  isClassSet(name: string): boolean {
    return native.styleIsClassSet(handle(this), name);
  }

  /**
   * Replace native classes using space-separated names.
   *
   * @zh 以空格分隔名称替换原生类。
   * @ja 空白区切りの名前でクラスを置換します。
   * @ko 공백으로 구분된 이름으로 클래스를 교체합니다.
   * @param names - Complete native class list.
   * @zh names - 完整原生类名列表。
   * @ja names - ネイティブクラス名の全一覧。
   * @ko names - 전체 네이티브 클래스 목록입니다.
   */
  setClassNames(names: string): void {
    native.styleSetClassNames(handle(this), names);
  }

  /**
   * Copy native space-separated class names.
   *
   * @zh 复制空格分隔的原生类名。
   * @ja 空白区切りのクラス名をコピーします。
   * @ko 공백으로 구분된 클래스 이름을 복사합니다.
   * @returns Current names.
   * @zh 返回当前类名。
   * @ja 現在のクラス名を返します。
   * @ko 현재 클래스 이름을 반환합니다.
   */
  getClassNames(): string {
    return native.styleGetClassNames(handle(this));
  }

  /**
   * Copy the native ordered class list.
   *
   * @zh 复制原生有序类列表。
   * @ja ネイティブクラス一覧を順序付きでコピーします。
   * @ko 네이티브 클래스 목록을 순서대로 복사합니다.
   * @returns Independent names.
   * @zh 返回独立类名列表。
   * @ja 独立したクラス名一覧を返します。
   * @ko 독립 클래스 이름 목록을 반환합니다.
   */
  getClassNameList(): string[] {
    return native.styleGetClassNameList(handle(this));
  }

  /**
   * Copy a typed inline property and dirty its native ID.
   *
   * @zh 复制类型化内联属性并标记其原生编号为脏。
   * @ja 型付きインライン属性をコピーし ID を変更済みにします。
   * @ko 형식화된 인라인 속성을 복사하고 ID를 변경 상태로 표시합니다.
   * @param id - Property ID from the global specification.
   * @zh id - 全局规范的属性编号。
   * @ja id - グローバル仕様の属性 ID。
   * @ko id - 전역 명세의 속성 ID입니다.
   * @param value - Parsed value with matching unit and storage.
   * @zh value - 单位与存储匹配的已解析值。
   * @ja value - 単位と保存型が一致する解析済み値。
   * @ko value - 단위와 저장 형식이 일치하는 해석된 값입니다.
   * @returns Whether the global property is registered.
   * @zh 返回全局属性是否已注册。
   * @ja グローバル属性が登録済みか返します。
   * @ko 전역 속성의 등록 여부를 반환합니다.
   */
  setProperty(id: PropertyId, value: Property): boolean {
    return native.styleSetProperty(handle(this), id, propertyHandle(value));
  }

  /**
   * Copy an inline custom property and dirty its variable name.
   *
   * @zh 复制内联自定义属性并标记变量名为脏。
   * @ja カスタム属性をコピーし変数名を変更済みにします。
   * @ko 사용자 속성을 복사하고 변수 이름을 변경 상태로 표시합니다.
   * @param name - Custom name beginning with --.
   * @zh name - 以 -- 开头的自定义名称。
   * @ja name - -- で始まるカスタム名。
   * @ko name - --로 시작하는 사용자 이름입니다.
   * @param value - Parsed property.
   * @zh value - 已解析属性。
   * @ja value - 解析済み属性。
   * @ko value - 해석된 속성입니다.
   */
  setCustomProperty(name: string, value: Property): void {
    native.styleSetCustomProperty(handle(this), name, propertyHandle(value));
  }

  /**
   * Copy a VAR_EXPRESSION shorthand and dirty its native ID.
   *
   * @zh 复制 VAR_EXPRESSION 简写并标记编号为脏。
   * @ja VAR_EXPRESSION 短縮形をコピーし ID を変更済みにします。
   * @ko VAR_EXPRESSION 약식을 복사하고 ID를 변경 상태로 표시합니다.
   * @param id - Registered global shorthand.
   * @zh id - 已注册全局简写。
   * @ja id - 登録済みグローバル短縮形。
   * @ko id - 등록된 전역 약식입니다.
   * @param value - VAR_EXPRESSION string property.
   * @zh value - VAR_EXPRESSION 字符串属性。
   * @ja value - VAR_EXPRESSION 文字列属性。
   * @ko value - VAR_EXPRESSION 문자열 속성입니다.
   */
  setVarShorthand(id: ShorthandId, value: Property): void {
    native.styleSetVarShorthand(handle(this), id, propertyHandle(value));
  }

  /**
   * Remove an inline property and retain stylesheet fallback.
   *
   * @zh 移除内联属性并保留样式表回退。
   * @ja インライン属性を削除しスタイルシートへの復帰を保持します。
   * @ko 인라인 속성을 제거하며 스타일시트 대체 값을 유지합니다.
   * @param id - Global property ID.
   * @zh id - 全局属性编号。
   * @ja id - グローバル属性 ID。
   * @ko id - 전역 속성 ID입니다.
   */
  removeProperty(id: PropertyId): void {
    native.styleRemoveProperty(handle(this), id);
  }

  /**
   * Remove a local custom property.
   *
   * @zh 移除局部自定义属性。
   * @ja ローカルカスタム属性を削除します。
   * @ko 로컬 사용자 속성을 제거합니다.
   * @param name - Custom name beginning with --.
   * @zh name - 以 -- 开头的自定义名称。
   * @ja name - -- で始まるカスタム名。
   * @ko name - --로 시작하는 사용자 이름입니다.
   */
  removeCustomProperty(name: string): void {
    native.styleRemoveCustomProperty(handle(this), name);
  }

  /**
   * Remove a local variable shorthand.
   *
   * @zh 移除局部变量简写。
   * @ja ローカル変数短縮形を削除します。
   * @ko 로컬 변수 약식을 제거합니다.
   * @param id - Registered global shorthand.
   * @zh id - 已注册全局简写。
   * @ja id - 登録済みグローバル短縮形。
   * @ko id - 등록된 전역 약식입니다.
   */
  removeVarShorthand(id: ShorthandId): void {
    native.styleRemoveVarShorthand(handle(this), id);
  }

  /**
   * Resolve native cascade, inheritance, variables and default property.
   *
   * @zh 解析原生层叠、继承、变量和默认属性。
   * @ja カスケード・継承・変数・既定属性を解決します。
   * @ko 캐스케이드, 상속, 변수 및 기본 속성을 해석합니다.
   * @param id - Global property ID.
   * @zh id - 全局属性编号。
   * @ja id - グローバル属性 ID。
   * @ko id - 전역 속성 ID입니다.
   * @returns Owned resolved property or null.
   * @zh 返回自有已解析属性或 null。
   * @ja 所有する解決済み属性または null を返します。
   * @ko 소유 해석 속성 또는 null을 반환합니다.
   */
  getProperty(id: PropertyId): Property | null {
    return property(native.styleGetProperty(handle(this), id));
  }

  /**
   * Resolve a native custom property through ancestors and variables.
   *
   * @zh 通过祖先与变量解析原生自定义属性。
   * @ja 祖先と変数を使いカスタム属性を解決します。
   * @ko 상위 요소와 변수를 통해 사용자 속성을 해석합니다.
   * @param name - Custom name beginning with --.
   * @zh name - 以 -- 开头的自定义名称。
   * @ja name - -- で始まるカスタム名。
   * @ko name - --로 시작하는 사용자 이름입니다.
   * @returns Owned resolved property or null.
   * @zh 返回自有已解析属性或 null。
   * @ja 所有する解決済み属性または null を返します。
   * @ko 소유 해석 속성 또는 null을 반환합니다.
   */
  getCustomProperty(name: string): Property | null {
    return property(native.styleGetCustomProperty(handle(this), name));
  }

  /**
   * Copy local inline or stylesheet property, without inherited defaults.
   *
   * @zh 复制局部内联或样式表属性，不包含继承默认值。
   * @ja 継承や既定値を除きローカル属性をコピーします。
   * @ko 상속과 기본 값 없이 로컬 속성을 복사합니다.
   * @param id - Global property ID.
   * @zh id - 全局属性编号。
   * @ja id - グローバル属性 ID。
   * @ko id - 전역 속성 ID입니다.
   * @returns Owned unresolved property or null.
   * @zh 返回自有未解析属性或 null。
   * @ja 所有する未解決属性または null を返します。
   * @ko 소유 미해석 속성 또는 null을 반환합니다.
   */
  getLocalProperty(id: PropertyId): Property | null {
    return property(native.styleGetLocalProperty(handle(this), id));
  }

  /**
   * Resolve variables only in a locally specified native property.
   *
   * @zh 仅解析局部指定原生属性中的变量。
   * @ja ローカル指定属性の変数のみを解決します。
   * @ko 로컬 지정 속성의 변수만 해석합니다.
   * @param id - Global property ID.
   * @zh id - 全局属性编号。
   * @ja id - グローバル属性 ID。
   * @ko id - 전역 속성 ID입니다.
   * @returns Owned resolved local property or null.
   * @zh 返回自有已解析局部属性或 null。
   * @ja 所有する解決済みローカル属性または null を返します。
   * @ko 소유 해석 로컬 속성 또는 null을 반환합니다.
   */
  getLocalPropertyWithResolvedVariables(id: PropertyId): Property | null {
    return property(native.styleGetLocalPropertyWithResolvedVariables(
      handle(this), id));
  }

  /**
   * Copy a local custom property without variable substitution.
   *
   * @zh 复制局部自定义属性，不替换变量。
   * @ja 変数置換なしでローカルカスタム属性をコピーします。
   * @ko 변수 대체 없이 로컬 사용자 속성을 복사합니다.
   * @param name - Custom name beginning with --.
   * @zh name - 以 -- 开头的自定义名称。
   * @ja name - -- で始まるカスタム名。
   * @ko name - --로 시작하는 사용자 이름입니다.
   * @returns Owned property or null.
   * @zh 返回自有属性或 null。
   * @ja 所有する属性または null を返します。
   * @ko 소유 속성 또는 null을 반환합니다.
   */
  getLocalCustomProperty(name: string): Property | null {
    return property(native.styleGetLocalCustomProperty(handle(this), name));
  }

  /**
   * Copy a local shorthand without variable substitution.
   *
   * @zh 复制局部简写，不替换变量。
   * @ja 変数置換なしでローカル短縮形をコピーします。
   * @ko 변수 대체 없이 로컬 약식을 복사합니다.
   * @param id - Global shorthand ID.
   * @zh id - 全局简写编号。
   * @ja id - グローバル短縮形 ID。
   * @ko id - 전역 약식 ID입니다.
   * @returns Owned property or null.
   * @zh 返回自有属性或 null。
   * @ja 所有する属性または null を返します。
   * @ko 소유 속성 또는 null을 반환합니다.
   */
  getLocalShorthand(id: ShorthandId): Property | null {
    return property(native.styleGetLocalShorthand(handle(this), id));
  }

  /**
   * Copy cascade and inheritance before variable substitution.
   *
   * @zh 复制变量替换前的层叠与继承结果。
   * @ja 変数置換前のカスケードと継承結果をコピーします。
   * @ko 변수 대체 전 캐스케이드와 상속 결과를 복사합니다.
   * @param id - Global property ID.
   * @zh id - 全局属性编号。
   * @ja id - グローバル属性 ID。
   * @ko id - 전역 속성 ID입니다.
   * @returns Owned specified property or null.
   * @zh 返回自有指定属性或 null。
   * @ja 所有する指定属性または null を返します。
   * @ko 소유 지정 속성 또는 null을 반환합니다.
   */
  getSpecifiedProperty(id: PropertyId): Property | null {
    return property(native.styleGetSpecifiedProperty(handle(this), id));
  }

  /**
   * Copy the specified custom property through native ancestors.
   *
   * @zh 通过原生祖先复制指定自定义属性。
   * @ja 祖先経由で指定カスタム属性をコピーします。
   * @ko 상위 요소를 통해 지정 사용자 속성을 복사합니다.
   * @param name - Custom name beginning with --.
   * @zh name - 以 -- 开头的自定义名称。
   * @ja name - -- で始まるカスタム名。
   * @ko name - --로 시작하는 사용자 이름입니다.
   * @returns Owned unresolved property or null.
   * @zh 返回自有未解析属性或 null。
   * @ja 所有する未解決属性または null を返します。
   * @ko 소유 미해석 속성 또는 null을 반환합니다.
   */
  getSpecifiedCustomProperty(name: string): Property | null {
    return property(native.styleGetSpecifiedCustomProperty(handle(this), name));
  }

  /**
   * Copy the specified shorthand with its native inheritance policy.
   *
   * @zh 按原生继承策略复制指定简写。
   * @ja ネイティブ継承方針で指定短縮形をコピーします。
   * @ko 네이티브 상속 정책으로 지정 약식을 복사합니다.
   * @param id - Global shorthand ID.
   * @zh id - 全局简写编号。
   * @ja id - グローバル短縮形 ID。
   * @ko id - 전역 약식 ID입니다.
   * @returns Owned unresolved property or null.
   * @zh 返回自有未解析属性或 null。
   * @ja 所有する未解決属性または null を返します。
   * @ko 소유 미해석 속성 또는 null을 반환합니다.
   */
  getSpecifiedShorthand(id: ShorthandId): Property | null {
    return property(native.styleGetSpecifiedShorthand(handle(this), id));
  }

  /**
   * Copy the full inline dictionary, including custom and shorthand maps.
   *
   * @zh 复制完整内联字典，包含自定义与简写映射。
   * @ja カスタムと短縮形を含むインライン辞書全体をコピーします。
   * @ko 사용자 및 약식 맵을 포함한 전체 인라인 사전을 복사합니다.
   * @returns Independent native dictionary excluding stylesheet classes.
   * @zh 返回不含样式表类属性的独立原生字典。
   * @ja スタイルシートのクラス属性を除く独立辞書を返します。
   * @ko 스타일시트 클래스 속성을 제외한 독립 사전을 반환합니다.
   */
  getLocalStyleProperties(): PropertyDictionary {
    return propertyDictionaryFromNative(
      native.styleGetLocalStyleProperties(handle(this)));
  }

  /**
   * Resolve a numeric value to its native canonical unit.
   *
   * @zh 将数值解析为原生标准单位。
   * @ja 数値をネイティブ標準単位に解決します。
   * @ko 수치를 네이티브 표준 단위로 해석합니다.
   * @param value - Single-unit native numeric value.
   * @zh value - 单一单位的原生数值。
   * @ja value - 単一単位のネイティブ数値。
   * @ko value - 단일 단위의 네이티브 수치입니다.
   * @param baseValue - Number and percentage scaling base.
   * @zh baseValue - 数字与百分比的缩放基准。
   * @ja baseValue - 数値と割合の倍率基準。
   * @ko baseValue - 수치와 백분율의 배율 기준입니다.
   * @returns Finite resolved value; zero for unsupported units.
   * @zh 返回有限解析值；不支持的单位返回零。
   * @ja 有限の解決値を返し、未対応単位ではゼロです。
   * @ko 유한한 해석 값을 반환하며 지원하지 않는 단위는 0입니다.
   */
  resolveNumericValue(value: NumericValue, baseValue: number): number {
    return native.styleResolveNumericValue(
      handle(this), numericValueHandle(value), baseValue);
  }

  /**
   * Resolve relative length using the actual native target dimensions.
   *
   * @zh 使用真实原生目标尺寸解析相对长度。
   * @ja ネイティブ対象の実際の寸法で相対長を解決します。
   * @ko 실제 네이티브 대상 크기로 상대 길이를 해석합니다.
   * @param value - Single-unit native numeric value.
   * @zh value - 单一单位的原生数值。
   * @ja value - 単一単位のネイティブ数値。
   * @ko value - 단일 단위의 네이티브 수치입니다.
   * @param target - Native RelativeTarget.
   * @zh target - 原生 RelativeTarget。
   * @ja target - ネイティブ RelativeTarget。
   * @ko target - 네이티브 RelativeTarget입니다.
   * @returns Finite pixel length.
   * @zh 返回有限像素长度。
   * @ja 有限のピクセル長を返します。
   * @ko 유한한 픽셀 길이를 반환합니다.
   */
  resolveRelativeLength(value: NumericValue, target: RelativeTarget): number {
    return native.styleResolveRelativeLength(
      handle(this), numericValueHandle(value), target);
  }

  /**
   * Dirty every registered inherited property on this native style.
   *
   * @zh 标记本原生样式的全部已注册继承属性为脏。
   * @ja 登録済み継承属性を変更済みにします。
   * @ko 등록된 모든 상속 속성을 변경 상태로 표시합니다.
   */
  dirtyInheritedProperties(): void {
    native.styleDirtyInheritedProperties(handle(this));
  }

  /**
   * Dirty one native property.
   *
   * @zh 标记单个原生属性为脏。
   * @ja 一つのネイティブ属性を変更済みにします。
   * @ko 하나의 네이티브 속성을 변경 상태로 표시합니다.
   * @param id - Global property ID.
   * @zh id - 全局属性编号。
   * @ja id - グローバル属性 ID。
   * @ko id - 전역 속성 ID입니다.
   */
  dirtyProperty(id: PropertyId): void {
    native.styleDirtyProperty(handle(this), id);
  }

  /**
   * Dirty local plain properties matching any unit bit.
   *
   * @zh 标记匹配任意单位位的局部普通属性为脏。
   * @ja 単位ビットに一致するローカル属性を変更済みにします。
   * @ko 단위 비트와 일치하는 로컬 속성을 변경 상태로 표시합니다.
   * @param units - Native unit bit mask.
   * @zh units - 原生单位位掩码。
   * @ja units - ネイティブ単位ビットマスク。
   * @ko units - 네이티브 단위 비트 마스크입니다.
   */
  dirtyPropertiesWithUnits(units: Unit): void {
    native.styleDirtyPropertiesWithUnits(handle(this), units);
  }

  /**
   * Dirty matching properties recursively, including non-DOM children.
   *
   * @zh 递归标记匹配属性为脏，包含非 DOM 子元素。
   * @ja 非 DOM 子も含め一致属性を再帰的に変更済みにします。
   * @ko 비 DOM 자식을 포함해 일치 속성을 재귀적으로 변경 상태로 표시합니다.
   * @param units - Native unit bit mask.
   * @zh units - 原生单位位掩码。
   * @ja units - ネイティブ単位ビットマスク。
   * @ko units - 네이티브 단위 비트 마스크입니다.
   */
  dirtyPropertiesWithUnitsRecursive(units: Unit): void {
    native.styleDirtyPropertiesWithUnitsRecursive(handle(this), units);
  }

  /**
   * Query native dirty property, variable and shorthand sets.
   *
   * @zh 查询原生属性、变量与简写脏集合。
   * @ja ネイティブ属性・変数・短縮形の変更集合を調べます。
   * @ko 네이티브 속성, 변수 및 약식 변경 집합을 조회합니다.
   * @returns Whether recomputation is required.
   * @zh 返回是否需要重新计算。
   * @ja 再計算が必要か返します。
   * @ko 재계산 필요 여부를 반환합니다.
   */
  anyPropertiesDirty(): boolean {
    return native.styleAnyPropertiesDirty(handle(this));
  }

  /**
   * Snapshot unique plain local properties from inline style and definition.
   *
   * @zh 从内联样式与定义复制去重的局部普通属性。
   * @ja インラインと定義の重複しないローカル属性をコピーします。
   * @ko 인라인과 정의에서 중복 없는 로컬 속성을 복사합니다.
   * @returns Independent ID/property pairs in native iteration order.
   * @zh 按原生迭代顺序返回独立编号与属性对。
   * @ja ネイティブ反復順の独立 ID と属性ペアを返します。
   * @ko 네이티브 반복 순서의 독립 ID와 속성 쌍을 반환합니다.
   */
  iterate(): Array<[PropertyId, Property]> {
    return native.styleIterate(handle(this))
      .map(([ id, token ]) => [ id, propertyFromNative(token) ]);
  }

  /**
   * Snapshot all native local maps, skipping shorthand placeholders.
   *
   * @zh 复制所有原生局部映射，跳过简写占位符。
   * @ja 短縮形プレースホルダーを除き全ローカルマップをコピーします。
   * @ko 약식 자리 표시자를 제외한 모든 로컬 맵을 복사합니다.
   * @param filterInheritedBy - Optional native cascade filter element.
   * @zh filterInheritedBy - 可选原生层叠过滤元素。
   * @ja filterInheritedBy - 任意のカスケードフィルター要素。
   * @ko filterInheritedBy - 선택 네이티브 캐스케이드 필터 요소입니다.
   * @returns Independent name/property pairs in native iteration order.
   * @zh 按原生迭代顺序返回独立名称与属性对。
   * @ja ネイティブ反復順の独立名と属性ペアを返します。
   * @ko 네이티브 반복 순서의 독립 이름과 속성 쌍을 반환합니다.
   */
  iterateAll(filterInheritedBy: Element | null = null):
  Array<[string, Property]> {
    return native.styleIterateAll(
      handle(this), filterInheritedBy?.handle ?? null)
      .map(([ name, token ]) => [ name, propertyFromNative(token) ]);
  }

  /**
   * Compute into owned native values and consume the element's real dirty sets.
   *
   * @zh 计算到独立原生值并消费元素真实脏集合。
   * @ja 所有値へ計算し要素の実際の変更集合を消費します。
   * @ko 소유 값으로 계산하며 요소의 실제 변경 집합을 소비합니다.
   * @param values - Writable values associated with this element.
   * @zh values - 关联本元素的可写值。
   * @ja values - この要素に関連する書き込み可能な値。
   * @ko values - 이 요소에 연결된 쓰기 가능한 값입니다.
   * @param parentValues - Already computed parent values, or null.
   * @zh parentValues - 已计算的父元素值或 null。
   * @ja parentValues - 計算済み親要素の値または null。
   * @ko parentValues - 계산된 부모 요소 값 또는 null입니다.
   * @param documentValues - Already computed document values, or null.
   * @zh documentValues - 已计算的文档值或 null。
   * @ja documentValues - 計算済み文書の値または null。
   * @ko documentValues - 계산된 문서 값 또는 null입니다.
   * @param valuesAreDefaultInitialized - Output still has native defaults.
   * @zh valuesAreDefaultInitialized - 输出仍使用原生默认值。
   * @ja valuesAreDefaultInitialized - 出力がネイティブ既定値のままか。
   * @ko valuesAreDefaultInitialized - 출력이 네이티브 기본 값인지 여부입니다.
   * @param dpRatio - Positive finite density ratio.
   * @zh dpRatio - 有限正数密度比率。
   * @ja dpRatio - 有限の正の密度比率。
   * @ko dpRatio - 유한한 양수 밀도 비율입니다.
   * @param viewportDimensions - Finite native viewport dimensions.
   * @zh viewportDimensions - 有限原生视口尺寸。
   * @ja viewportDimensions - 有限のネイティブ視口寸法。
   * @ko viewportDimensions - 유한한 네이티브 뷰포트 크기입니다.
   * @returns Consumed dirty IDs; inherited dependencies propagate to children.
   * @zh 返回已消费的脏编号，继承依赖传播到子元素。
   * @ja 消費した変更 ID を返し、継承依存を子へ伝えます。
   * @ko 소비된 변경 ID를 반환하고 상속 의존성을 자식에게 전달합니다.
   * @remarks
   * Execute parents before children. This operation writes owned output only;
   * it does not invoke Element::OnPropertyChange or update its layout. Before
   * subsequent Context.update, redirty every returned ID on this style so
   * Element::UpdateProperties can apply the pending values to live layout.
   * @zh 按父先子后执行。只写独立输出，不调用 OnPropertyChange 或更新布局。
   * 后续 Context.update 前用 dirtyProperty 重新标记返回的全部编号，使原生
   * UpdateProperties 将待更新值应用到实时布局。
   * @ja 親から子の順で実行します。配置は更新しません。次の Context.update 前に
   * 返された全 ID を dirtyProperty で変更済みにしてライブ配置へ適用します。
   * @ko 부모부터 자식 순서로 실행하며 배치를 갱신하지 않습니다. 다음 Context.update
   * 전에 반환된 모든 ID를 dirtyProperty로 표시하여 실제 배치에 적용하세요.
   */
  computeValues(values: ComputedValues, parentValues: ComputedValuesView | null,
    documentValues: ComputedValuesView | null,
    valuesAreDefaultInitialized: boolean,
    dpRatio: number, viewportDimensions: VariantVector2): Set<PropertyId> {
    return new Set(native.styleComputeValues(
      handle(this), computedHandle(values),
      parentValues === null ? null : computedHandle(parentValues),
      documentValues === null ? null : computedHandle(documentValues),
      valuesAreDefaultInitialized, dpRatio, viewportDimensions));
  }

  /**
   * Resolve a keyframe property using native variable and shorthand expansion.
   *
   * @zh 使用原生变量与简写展开解析关键帧属性。
   * @ja ネイティブ変数と短縮形展開でキーフレーム属性を解決します。
   * @ko 네이티브 변수와 약식 확장으로 키프레임 속성을 해석합니다.
   * @param id - Global property ID.
   * @zh id - 全局属性编号。
   * @ja id - グローバル属性 ID。
   * @ko id - 전역 속성 ID입니다.
   * @param value - Nullable source property from the block.
   * @zh value - 块中的源属性，可为 null。
   * @ja value - ブロックの元属性。null も可能です。
   * @ko value - 블록의 원본 속성이며 null일 수 있습니다.
   * @param block - Complete keyframe block dictionary.
   * @zh block - 完整关键帧块字典。
   * @ja block - キーフレームブロックの全辞書。
   * @ko block - 전체 키프레임 블록 사전입니다.
   * @param resolver - Reusable native cache, dependencies and output storage.
   * @zh resolver - 可复用原生缓存、依赖和输出存储。
   * @ja resolver - 再利用するネイティブキャッシュ・依存・出力領域。
   * @ko resolver - 재사용 네이티브 캐시, 의존성 및 출력 저장소입니다.
   * @returns Owned resolved snapshot or null on native resolution failure.
   * @zh 返回自有已解析快照；原生解析失败返回 null。
   * @ja 所有する解決済みコピーを返し、解析失敗では null です。
   * @ko 소유 해석 사본을 반환하며 네이티브 해석 실패 시 null입니다.
   */
  resolveKeyFrameProperty(id: PropertyId, value: Property | null,
    block: PropertyDictionary, resolver: KeyFramePropertyResolver):
    Property | null {
    return property(native.styleResolveKeyFrameProperty(
      handle(this), id, value === null ? null : propertyHandle(value),
      propertyDictionaryHandle(block), resolverHandle(resolver)));
  }
}

/**
 * Canonicalize an element-owned native style component.
 *
 * @internal
 * @param token - Checked element token.
 * @returns Canonical component view.
 */
export function elementStyleFromNative(
  token: ElementNativeHandle): ElementStyle {
  let result = wrappers.get(token);
  if (!result) {
    result = Object.create(ElementStyle.prototype) as ElementStyle;
    handles.set(result, token);
    wrappers.set(token, result);
  }
  return result;
}
