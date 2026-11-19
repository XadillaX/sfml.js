import { native } from '../../internal/native';
import {
  propertyFromNative, type Property,
} from '../../style/properties/property';
import {
  propertyDictionaryFromNative, type PropertyDictionary,
} from '../../style/properties/property-dictionary';
import type { PropertyId } from '../../generated/property-ids';

const handles = new WeakMap<ElementDefinition, object>();

/**
 * Immutable Rml::ElementDefinition from stylesheet selector matching.
 *
 * @zh 样式表选择器匹配产生的不可变 Rml::ElementDefinition。
 * @ja セレクター照合で得た不変の Rml::ElementDefinition。
 * @ko 스타일시트 선택자 매칭으로 얻은 불변 Rml::ElementDefinition입니다.
 * @remarks
 * Retains the native definition independently of the element and stylesheet.
 * Reads return copies. Runtime shutdown invalidates this definition.
 * @zh 独立于元素和样式表保留原生定义。读取返回副本，运行时关闭后失效。
 * @ja 要素やシートと独立して定義を保持します。読取結果はコピーで、終了時に無効化します。
 * @ko 요소 및 시트와 독립적으로 정의를 유지합니다. 읽기는 사본을 반환하며 종료 시 무효화됩니다.
 */
export class ElementDefinition {
  /** @internal */
  private constructor() {}

  /**
   * Copy Rml::ElementDefinition::GetProperty.
   *
   * @zh 复制 Rml::ElementDefinition::GetProperty 的结果。
   * @ja Rml::ElementDefinition::GetProperty の結果をコピーします。
   * @ko Rml::ElementDefinition::GetProperty 결과를 복사합니다.
   * @param id - Property ID to look up.
   * @zh id - 要查找的属性 ID。
   * @ja id - 検索するプロパティ ID。
   * @ko id - 조회할 속성 ID입니다.
   * @returns Independent property, or null when absent.
   * @zh 独立属性副本；不存在时为 null。
   * @ja 独立したプロパティ。存在しない場合は null。
   * @ko 독립된 속성 사본이며 없으면 null입니다.
   */
  getProperty(id: PropertyId): Property | null {
    const value = native.elementDefinitionGetProperty(handleOf(this), id);
    return value === null ? null : propertyFromNative(value);
  }

  /**
   * Copy Rml::ElementDefinition::GetCustomProperty.
   *
   * @zh 复制 Rml::ElementDefinition::GetCustomProperty 的结果。
   * @ja Rml::ElementDefinition::GetCustomProperty の結果をコピーします。
   * @ko Rml::ElementDefinition::GetCustomProperty 결과를 복사합니다.
   * @param name - Custom property name, including the -- prefix.
   * @zh name - 自定义属性名，包含 -- 前缀。
   * @ja name - -- 接頭辞を含むカスタムプロパティ名。
   * @ko name - -- 접두사를 포함하는 사용자 정의 속성 이름입니다.
   * @returns Independent property, or null when absent.
   * @zh 独立属性副本；不存在时为 null。
   * @ja 独立したプロパティ。存在しない場合は null。
   * @ko 독립된 속성 사본이며 없으면 null입니다.
   */
  getCustomProperty(name: string): Property | null {
    const value = native.elementDefinitionGetCustomProperty(
      handleOf(this), name);
    return value === null ? null : propertyFromNative(value);
  }

  /**
   * Copy the IDs from Rml::ElementDefinition::GetPropertyIds.
   *
   * @zh 复制 Rml::ElementDefinition::GetPropertyIds 返回的 ID。
   * @ja Rml::ElementDefinition::GetPropertyIds の ID をコピーします。
   * @ko Rml::ElementDefinition::GetPropertyIds의 ID를 복사합니다.
   * @returns Independent ID array; custom property names are not included.
   * @zh 独立 ID 数组，不包含自定义属性名称。
   * @ja 独立した ID 配列。カスタムプロパティ名は含みません。
   * @ko 독립된 ID 배열이며 사용자 정의 속성 이름은 포함하지 않습니다.
   */
  getPropertyIds(): PropertyId[] {
    return native.elementDefinitionGetPropertyIds(handleOf(this));
  }

  /**
   * Copy Rml::ElementDefinition::GetProperties.
   *
   * @zh 复制 Rml::ElementDefinition::GetProperties 的结果。
   * @ja Rml::ElementDefinition::GetProperties の結果をコピーします。
   * @ko Rml::ElementDefinition::GetProperties 결과를 복사합니다.
   * @returns Independent dictionary including custom properties.
   * @zh 包含自定义属性的独立字典。
   * @ja カスタムプロパティを含む独立した辞書。
   * @ko 사용자 정의 속성을 포함하는 독립된 사전입니다.
   */
  getProperties(): PropertyDictionary {
    return propertyDictionaryFromNative(
      native.elementDefinitionGetProperties(handleOf(this)));
  }
}

/**
 * Resolve a checked native definition handle.
 *
 * @param value - Public definition.
 * @returns Native definition handle.
 */
function handleOf(value: ElementDefinition): object {
  const handle = handles.get(value);
  if (!handle) {
    throw new TypeError('Expected an element definition');
  }
  return handle;
}

/**
 * Wrap a retained native element definition.
 *
 * @internal
 * @param handle - Native definition.
 * @returns Immutable public facade.
 */
export function elementDefinitionFromNative(handle: object): ElementDefinition {
  const value = Object.create(ElementDefinition.prototype) as ElementDefinition;
  handles.set(value, handle);
  return value;
}
