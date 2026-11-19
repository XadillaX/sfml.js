import { native } from '../../internal/native';
import {
  Property, propertyFromNative, propertyHandle, type PropertySource,
} from './property';
import type { PropertyId } from '../../generated/property-ids';
import type { ShorthandId } from '../../generated/shorthand-ids';

const dictionaries = new WeakMap<PropertyDictionary, object>();

/**
 * Resolve a checked native dictionary.
 *
 * @internal
 * @param value - Public wrapper.
 * @returns Native handle.
 */
export function propertyDictionaryHandle(value: PropertyDictionary): object {
  const handle = dictionaries.get(value);
  if (!handle) {
    throw new TypeError('Expected a PropertyDictionary');
  }
  return handle;
}

/**
 * Native-owned Rml::PropertyDictionary with independent property snapshots.
 *
 * @zh 原生持有的 Rml::PropertyDictionary，返回独立属性快照。
 * @ja 独立した属性コピーを返すネイティブ所有の Rml::PropertyDictionary。
 * @ko 독립 속성 스냅샷을 반환하는 네이티브 소유 Rml::PropertyDictionary입니다.
 * @remarks
 * Plain properties, custom properties and variable shorthands have separate
 * maps. Setters copy values; getters return owned copies. Callback resources
 * remain alive while stored. Shutdown releases resources and invalidates the
 * dictionary. Use IDs from the specification that owns these properties.
 * @zh 普通属性、自定义属性、变量简写分别存储。写入复制值，读取返回自有副本。
 * 存储期间回调资源保持存活。关闭时释放资源并使字典失效。
 * 编号须来自这些属性所属的规范。
 * @ja 通常属性・カスタム属性・変数短縮形は別のマップです。書き込みと読み取りは
 * コピーし、保存中のコールバックを保持します。終了時に資源を解放し無効化します。
 * 属性が属する仕様の ID を使用してください。
 * @ko 일반 속성, 사용자 속성, 변수 약식은 별도 맵입니다. 쓰기와 읽기는 복사하며
 * 저장된 콜백을 유지합니다. 종료 시 리소스를 해제하고 무효화합니다.
 * 해당 속성이 속한 명세의 식별자를 사용하세요.
 */
export class PropertyDictionary {
  /**
   * Construct an empty native dictionary in the active runtime.
   *
   * @zh 在当前运行时构造空的原生字典。
   * @ja 現在のランタイムで空のネイティブ辞書を構築します。
   * @ko 현재 런타임에서 빈 네이티브 사전을 생성합니다.
   */
  constructor() {
    dictionaries.set(this, native.createPropertyDictionary());
  }

  /**
   * Rml::PropertyDictionary::SetProperty, overwriting any existing value.
   *
   * @zh 设置普通属性，覆盖已有值。
   * @ja 通常属性を設定し、既存値を上書きします。
   * @ko 일반 속성을 설정하고 기존 값을 덮어씁니다.
   * @param id - Nonzero property ID below MaxNumIds.
   * @zh id - 非零属性编号，小于 MaxNumIds。
   * @ja id - MaxNumIds 未満の非ゼロ属性 ID。
   * @ko id - MaxNumIds 미만의 0이 아닌 속성 식별자입니다.
   * @param property - Property to copy.
   * @zh property - 待复制属性。
   * @ja property - コピーする属性。
   * @ko property - 복사할 속성입니다.
   */
  setProperty(id: PropertyId, property: Property): void {
    native.dictionarySetProperty(
      propertyDictionaryHandle(this), id, propertyHandle(property));
  }

  /**
   * Remove an ordinary property by its identifier.
   *
   * @zh 移除普通属性。
   * @ja 通常属性を削除します。
   * @ko 일반 속성을 제거합니다.
   * @param id - Nonzero property ID.
   * @zh id - 非零属性编号。
   * @ja id - 非ゼロ属性 ID。
   * @ko id - 0이 아닌 속성 식별자입니다.
   */
  removeProperty(id: PropertyId): void {
    native.dictionaryRemoveProperty(propertyDictionaryHandle(this), id);
  }

  /**
   * Copy Rml::PropertyDictionary::GetProperty.
   *
   * @zh 复制普通属性查询结果。
   * @ja 通常属性の検索結果をコピーします。
   * @ko 일반 속성 조회 결과를 복사합니다.
   * @param id - Nonzero property ID.
   * @zh id - 非零属性编号。
   * @ja id - 非ゼロ属性 ID。
   * @ko id - 0이 아닌 속성 식별자입니다.
   * @returns Owned property or null when absent.
   * @zh 自有属性，不存在时为 null。
   * @ja 所有属性。存在しない場合は null。
   * @ko 소유 속성이며 없으면 null입니다.
   */
  getProperty(id: PropertyId): Property | null {
    const value = native.dictionaryGetProperty(propertyDictionaryHandle(this),
      id);
    return value ? propertyFromNative(value) : null;
  }

  /**
   * Store a copy of a custom property under its exact name.
   *
   * @zh 设置自定义属性。
   * @ja カスタム属性を設定します。
   * @ko 사용자 속성을 설정합니다.
   * @param name - Exact custom property name.
   * @zh name - 精确的自定义属性名。
   * @ja name - 正確なカスタム属性名。
   * @ko name - 정확한 사용자 속성 이름입니다.
   * @param property - Property to copy.
   * @zh property - 待复制属性。
   * @ja property - コピーする属性。
   * @ko property - 복사할 속성입니다.
   */
  setCustomProperty(name: string, property: Property): void {
    native.dictionarySetCustomProperty(
      propertyDictionaryHandle(this), name, propertyHandle(property));
  }

  /**
   * Remove a custom property by its exact name.
   *
   * @zh 移除自定义属性。
   * @ja カスタム属性を削除します。
   * @ko 사용자 속성을 제거합니다.
   * @param name - Exact custom property name.
   * @zh name - 精确的自定义属性名。
   * @ja name - 正確なカスタム属性名。
   * @ko name - 정확한 사용자 속성 이름입니다.
   * @returns Whether the entry existed.
   * @zh 条目是否曾存在。
   * @ja 項目が存在していたか。
   * @ko 항목이 존재했는지 여부입니다.
   */
  removeCustomProperty(name: string): boolean {
    return native.dictionaryRemoveCustomProperty(
      propertyDictionaryHandle(this), name);
  }

  /**
   * Copy Rml::PropertyDictionary::GetCustomProperty.
   *
   * @zh 复制自定义属性查询结果。
   * @ja カスタム属性の検索結果をコピーします。
   * @ko 사용자 속성 조회 결과를 복사합니다.
   * @param name - Exact custom property name.
   * @zh name - 精确的自定义属性名。
   * @ja name - 正確なカスタム属性名。
   * @ko name - 정확한 사용자 속성 이름입니다.
   * @returns Owned property or null when absent.
   * @zh 自有属性，不存在时为 null。
   * @ja 所有属性。存在しない場合は null。
   * @ko 소유 속성이며 없으면 null입니다.
   */
  getCustomProperty(name: string): Property | null {
    const value = native.dictionaryGetCustomProperty(
      propertyDictionaryHandle(this), name);
    return value ? propertyFromNative(value) : null;
  }

  /**
   * Store an unresolved shorthand containing a variable expression.
   *
   * @zh 设置变量简写。
   * @ja 変数を含む短縮形を設定します。
   * @ko 변수를 포함한 약식을 설정합니다.
   * @param id - Nonzero shorthand ID below MaxNumIds.
   * @zh id - 非零简写编号，小于 MaxNumIds。
   * @ja id - MaxNumIds 未満の非ゼロ短縮形 ID。
   * @ko id - MaxNumIds 미만의 0이 아닌 약식 식별자입니다.
   * @param property - String property with Unit.VAR_EXPRESSION.
   * @zh property - 单位为 Unit.VAR_EXPRESSION 的字符串属性。
   * @ja property - Unit.VAR_EXPRESSION の文字列属性。
   * @ko property - Unit.VAR_EXPRESSION 단위의 문자열 속성입니다.
   */
  setVarShorthand(id: ShorthandId, property: Property): void {
    native.dictionarySetVarShorthand(
      propertyDictionaryHandle(this), id, propertyHandle(property));
  }

  /**
   * Remove a shorthand containing a variable expression.
   *
   * @zh 移除变量简写。
   * @ja 変数短縮形を削除します。
   * @ko 변수 약식을 제거합니다.
   * @param id - Nonzero shorthand ID.
   * @zh id - 非零简写编号。
   * @ja id - 非ゼロ短縮形 ID。
   * @ko id - 0이 아닌 약식 식별자입니다.
   * @returns Whether the entry existed.
   * @zh 条目是否曾存在。
   * @ja 項目が存在していたか。
   * @ko 항목이 존재했는지 여부입니다.
   */
  removeVarShorthand(id: ShorthandId): boolean {
    return native.dictionaryRemoveVarShorthand(
      propertyDictionaryHandle(this), id);
  }

  /**
   * Copy Rml::PropertyDictionary::GetVarShorthand.
   *
   * @zh 复制变量简写查询结果。
   * @ja 変数短縮形の検索結果をコピーします。
   * @ko 변수 약식 조회 결과를 복사합니다.
   * @param id - Nonzero shorthand ID.
   * @zh id - 非零简写编号。
   * @ja id - 非ゼロ短縮形 ID。
   * @ko id - 0이 아닌 약식 식별자입니다.
   * @returns Owned property or null when absent.
   * @zh 自有属性，不存在时为 null。
   * @ja 所有属性。存在しない場合は null。
   * @ko 소유 속성이며 없으면 null입니다.
   */
  getVarShorthand(id: ShorthandId): Property | null {
    const value = native.dictionaryGetVarShorthand(
      propertyDictionaryHandle(this), id);
    return value ? propertyFromNative(value) : null;
  }

  /**
   * Rml::PropertyDictionary::Empty across all three maps.
   *
   * @zh 检查三个映射是否都为空。
   * @ja 3 つのマップがすべて空か調べます。
   * @ko 세 맵이 모두 비어 있는지 확인합니다.
   * @returns Whether all maps are empty.
   * @zh 所有映射是否为空。
   * @ja すべてのマップが空か。
   * @ko 모든 맵이 비어 있는지 여부입니다.
   */
  empty(): boolean {
    return native.dictionaryEmpty(propertyDictionaryHandle(this));
  }

  /**
   * Rml::PropertyDictionary::GetNumProperties, counting plain properties only.
   *
   * @zh 只统计普通属性的数量。
   * @ja 通常属性のみを数えます。
   * @ko 일반 속성만 계산합니다.
   * @returns Number of plain properties.
   * @zh 普通属性数量。
   * @ja 通常属性の数。
   * @ko 일반 속성 수입니다.
   */
  getNumProperties(): number {
    return native.dictionaryGetNumProperties(propertyDictionaryHandle(this));
  }

  /**
   * Copy Rml::PropertyDictionary::GetProperties.
   *
   * @zh 复制普通属性映射。
   * @ja 通常属性マップをコピーします。
   * @ko 일반 속성 맵을 복사합니다.
   * @returns New map of independently owned properties.
   * @zh 包含独立自有属性的新 Map。
   * @ja 独立所有の属性を含む新しい Map。
   * @ko 독립 소유 속성을 포함한 새 Map입니다.
   */
  getProperties(): Map<PropertyId, Property> {
    return new Map(native.dictionaryGetProperties(
      propertyDictionaryHandle(this))
      .map(([ id, value ]) => [ id, propertyFromNative(value) ]));
  }

  /**
   * Copy Rml::PropertyDictionary::GetCustomProperties.
   *
   * @zh 复制自定义属性映射。
   * @ja カスタム属性マップをコピーします。
   * @ko 사용자 속성 맵을 복사합니다.
   * @returns New map of independently owned properties.
   * @zh 包含独立自有属性的新 Map。
   * @ja 独立所有の属性を含む新しい Map。
   * @ko 독립 소유 속성을 포함한 새 Map입니다.
   */
  getCustomProperties(): Map<string, Property> {
    return new Map(native.dictionaryGetCustomProperties(
      propertyDictionaryHandle(this))
      .map(([ name, value ]) => [ name, propertyFromNative(value) ]));
  }

  /**
   * Copy Rml::PropertyDictionary::GetVarShorthands.
   *
   * @zh 复制变量简写映射。
   * @ja 変数短縮形マップをコピーします。
   * @ko 변수 약식 맵을 복사합니다.
   * @returns New map of independently owned properties.
   * @zh 包含独立自有属性的新 Map。
   * @ja 独立所有の属性を含む新しい Map。
   * @ko 독립 소유 속성을 포함한 새 Map입니다.
   */
  getVarShorthands(): Map<ShorthandId, Property> {
    return new Map(native.dictionaryGetVarShorthands(
      propertyDictionaryHandle(this))
      .map(([ id, value ]) => [ id, propertyFromNative(value) ]));
  }

  /**
   * Rml::PropertyDictionary::Import using native specificity precedence.
   *
   * @zh 按原生优先级规则导入字典。
   * @ja ネイティブの詳細度規則で辞書をインポートします。
   * @ko 네이티브 우선순위 규칙으로 사전을 가져옵니다.
   * @param source - Dictionary to copy from.
   * @zh source - 复制来源字典。
   * @ja source - コピー元の辞書。
   * @ko source - 복사할 원본 사전입니다.
   * @param specificity - Forced specificity when positive; defaults to -1.
   * Zero and negative values preserve incoming specificity, as in RmlUi 6.3.
   * @zh specificity - 正数时强制指定优先级，默认 -1。按 RmlUi 6.3 规则，
   * 零和负数保留传入优先级。
   * @ja specificity - 正なら詳細度を強制。既定は -1。RmlUi 6.3 と同じく、
   * ゼロと負数は入力の詳細度を保持します。
   * @ko specificity - 양수이면 우선순위를 강제하며 기본값은 -1입니다.
   * RmlUi 6.3과 같이 0과 음수는 입력 우선순위를 유지합니다.
   */
  import(source: PropertyDictionary, specificity = -1): void {
    native.dictionaryImport(propertyDictionaryHandle(this),
      propertyDictionaryHandle(source), specificity);
  }

  /**
   * Rml::PropertyDictionary::Merge with a checked specificity offset.
   *
   * @zh 合并字典，并检查优先级偏移。
   * @ja 詳細度の加算を検証して辞書をマージします。
   * @ko 우선순위 오프셋을 검증하여 사전을 병합합니다.
   * @param source - Dictionary to copy from.
   * @zh source - 复制来源字典。
   * @ja source - コピー元の辞書。
   * @ko source - 복사할 원본 사전입니다.
   * @param specificityOffset - Signed offset, default zero; overflow throws
   * before modifying any entry.
   * @zh specificityOffset - 有符号偏移，默认零；溢出在修改条目前抛出。
   * @ja specificityOffset - 符号付き加算値。既定はゼロ。範囲外なら変更前に例外。
   * @ko specificityOffset - 부호 있는 오프셋이며 기본값은 0입니다.
   * 오버플로 시 항목을 변경하기 전에 예외를 발생시킵니다.
   */
  merge(source: PropertyDictionary, specificityOffset = 0): void {
    native.dictionaryMerge(propertyDictionaryHandle(this),
      propertyDictionaryHandle(source), specificityOffset);
  }

  /**
   * Rml::PropertyDictionary::Clear, releasing all stored properties.
   *
   * @zh 清空字典并释放全部存储的属性。
   * @ja 辞書を消去し、保存した全属性を解放します。
   * @ko 사전을 지우고 저장된 모든 속성을 해제합니다.
   */
  clear(): void {
    native.dictionaryClear(propertyDictionaryHandle(this));
  }

  /**
   * Rml::PropertyDictionary::SetSourceOfAllProperties across all maps.
   *
   * @zh 为所有映射中的属性设置来源。
   * @ja 全マップの属性に出典を設定します。
   * @ko 모든 맵의 속성에 출처를 설정합니다.
   * @param source - Metadata copied once, or null to clear every source.
   * @zh source - 复制一次的元数据，null 清空全部来源。
   * @ja source - 一度コピーするメタデータ。null で全出典を消去。
   * @ko source - 한 번 복사할 메타데이터이며 null이면 모든 출처를 지웁니다.
   */
  setSourceOfAllProperties(source: PropertySource | null): void {
    native.dictionarySetSource(propertyDictionaryHandle(this), source);
  }
}

/**
 * Wrap an owned native dictionary snapshot.
 *
 * @internal
 * @param handle - Checked native dictionary.
 * @returns Public dictionary.
 */
export function propertyDictionaryFromNative(handle: object):
PropertyDictionary {
  const result = Object.create(PropertyDictionary.prototype) as
    PropertyDictionary;
  dictionaries.set(result, handle);
  return result;
}
