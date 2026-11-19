import type {
  VariantValue, VariantConversionDefault, VariantResult,
} from '../../values/types';

/**
 * Attribute values, including lifetime-guarded element references.
 *
 * @zh 属性值，包含受生命周期保护的元素引用。
 * @ja ライフタイム保護された要素参照を含む属性値。
 * @ko 수명 보호된 요소 참조를 포함하는 속성 값입니다.
 */
export type AttributeValue = VariantValue;

/**
 * Native template result selected by a non-null default value's type.
 *
 * @zh 由非空默认值的类型选择的原生模板结果。
 * @ja null 以外の既定値の型で選択するネイティブテンプレートの結果。
 * @ko null이 아닌 기본값 유형으로 선택하는 네이티브 템플릿 결과입니다.
 * @template T - Non-null attribute fallback type.
 * @zh T - 非空属性回退值类型。
 * @ja T - 非 null の属性フォールバック型。
 * @ko T - null이 아닌 속성 대체 값 형식입니다.
 */
export type AttributeResult<T extends VariantConversionDefault> =
  VariantResult<T>;
