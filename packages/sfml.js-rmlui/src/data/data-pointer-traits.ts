import { DataSchema } from './data-schema';
import type { DataVariable } from './data-model';

/**
 * Runtime counterpart of Rml::PointerTraits for checked native data leases.
 * Raw, unique and shared C++ pointers use managed nullable references in JS.
 * Native retains storage; dereferencing never exposes an address to JS.
 *
 * @zh Rml::PointerTraits 的受检原生租约对应接口。C++ 原始、独占和共享指针在
 * JS 中使用受管理的可空引用；原生保有存储，解引用不会向 JS 暴露地址。
 * @ja 検証済みネイティブリース用の Rml::PointerTraits 相当のインターフェース。
 * C++ の生・専有・共有ポインターは JS では管理された null 許容参照を使用します。
 * @ko 검증된 네이티브 수명 핸들의 Rml::PointerTraits 대응 인터페이스입니다.
 * C++ 원시, 고유 및 공유 포인터는 JS에서 관리되는 null 허용 참조를 사용합니다.
 */
export class DataPointerTraits {
  /**
   * Registered type whose pointer behavior is inspected.
   *
   * @zh 需要查询指针行为的已注册类型。
   * @ja ポインターの動作を調べる登録済み型。
   * @ko 포인터 동작을 확인할 등록된 유형입니다.
   */
  readonly schema: DataSchema;

  /**
   * Select a registered native definition.
   *
   * @zh 选择已注册原生定义。
   * @ja 登録済みネイティブ定義を選択します。
   * @ko 등록된 네이티브 정의를 선택합니다.
   * @param schema - Checked value or managed reference schema.
   * @zh schema - 受检值或受管理引用的类型。
   * @ja schema - 検証済み値または管理参照のスキーマ。
   * @ko schema - 검증된 값 또는 관리되는 참조의 스키마입니다.
   */
  constructor(schema: DataSchema) {
    if (!(schema instanceof DataSchema)) {
      throw new TypeError('Expected a registered data definition');
    }
    this.schema = schema;
  }

  /**
   * Rml::PointerTraits::is_pointer_v counterpart.
   *
   * @zh Rml::PointerTraits::is_pointer_v 的对应属性。
   * @ja Rml::PointerTraits::is_pointer_v 相当のプロパティ。
   * @ko Rml::PointerTraits::is_pointer_v 대응 속성입니다.
   * @returns Whether this schema is a managed reference.
   * @zh 此类型是否为受管理引用。
   * @ja 管理参照のスキーマか。
   * @ko 이 스키마가 관리되는 참조인지 여부입니다.
   */
  get isPointer(): boolean {
    return this.schema.isReference;
  }

  /**
   * Rml::PointerTraits::element_type counterpart; values keep their own type.
   *
   * @zh Rml::PointerTraits::element_type 的对应属性，值类型保留自身类型。
   * @ja Rml::PointerTraits::element_type 相当。値の場合は自身の型を返します。
   * @ko Rml::PointerTraits::element_type 대응 속성이며 값은 자신의 유형입니다.
   * @returns Target type for references, or the selected value type.
   * @zh 引用的目标类型，或所选的值类型。
   * @ja 参照の対象型、または選択した値の型。
   * @ko 참조의 대상 유형 또는 선택한 값 유형입니다.
   */
  get elementType(): DataSchema {
    return this.isPointer ? this.schema.underlying! : this.schema;
  }

  /**
   * Rml::PointerTraits::Dereference counterpart with native lifetime checks.
   * Values preserve wrapper identity; empty references return null.
   *
   * @zh 对应 Rml::PointerTraits::Dereference 并检查原生生命周期。
   * 值保留包装对象标识，空引用返回 null。
   * @ja ネイティブ寿命を検証する Rml::PointerTraits::Dereference 相当。
   * 値はラッパーの同一性を保持し、空参照は null を返します。
   * @ko 네이티브 수명을 검사하는 Rml::PointerTraits::Dereference 대응 메서드입니다.
   * 값은 래퍼 동일성을 유지하고 빈 참조는 null을 반환합니다.
   * @param variable - Variable of the selected registered definition.
   * @zh variable - 使用所选已注册定义的变量。
   * @ja variable - 選択した登録済み定義の変数。
   * @ko variable - 선택한 등록된 정의를 사용하는 변수입니다.
   * @returns Checked target, unchanged value, or null.
   * @zh 受检目标、原值或 null。
   * @ja 検証済み対象、そのままの値、または null。
   * @ko 검증된 대상, 변경되지 않은 값 또는 null입니다.
   */
  dereference(variable: DataVariable): DataVariable | null {
    const pointer = this.isPointer;
    if (variable.getDefinition() !== this.schema) {
      throw new TypeError('Variable does not match the selected definition');
    }
    return pointer ? variable.getReference() : variable;
  }
}
