import { native } from '../internal/native';
import { classIdentifier, type ClassIdentifier } from '../runtime/rtti';

/**
 * Typed base for checked Rml::ScriptInterface objects.
 *
 * @zh 带检查的 Rml::ScriptInterface 对象的类型基类。
 * @ja 検証付き Rml::ScriptInterface オブジェクトの型付き基底です。
 * @ko 검증된 Rml::ScriptInterface 객체의 형식화된 기본 클래스입니다.
 * @remarks
 * Context, Element and RmlEvent retain their ownership and release rules.
 * Unregistered objects return null from GetScriptObject. setScriptObject
 * installs a managed native owner; JS subclassing does not change native RTTI.
 * @zh Context、Element 与 RmlEvent 保留原有所有权及释放规则。未注册时
 * GetScriptObject 返回 null，setScriptObject 安装托管原生关联。
 * 仅定义 JS 子类不会改变原生 RTTI。
 * @ja Context、Element、RmlEvent の所有権と解放規則を維持します。
 * 未登録の GetScriptObject は null。setScriptObject で管理関連付けを登録し、
 * JS の派生だけではネイティブ RTTI は変わりません。
 * @ko Context, Element, RmlEvent의 소유권 및 해제 규칙을 유지합니다.
 * 미등록 GetScriptObject는 null입니다. setScriptObject로 관리 연결을 등록하며
 * JS 상속만으로 네이티브 RTTI를 바꾸지 않습니다.
 */
export abstract class ScriptInterface {
  /**
   * Require a concrete facade with its own native ownership rules.
   *
   * @zh 要求使用具有自身原生所有权规则的具体包装类。
   * @ja 独自のネイティブ所有権規則を持つ具象ラッパーを必要とします。
   * @ko 자체 네이티브 소유권 규칙을 갖는 구체 래퍼가 필요합니다.
   */
  protected constructor() {
    if (new.target === ScriptInterface) {
      throw new TypeError('ScriptInterface requires a concrete native facade');
    }
  }

  /**
   * Read the actual native ScriptInterface class token before or after setup.
   *
   * @zh 在初始化前后读取真实的原生 ScriptInterface 类型令牌。
   * @ja 初期化前後に実際のネイティブ ScriptInterface 型トークンを読みます。
   * @ko 초기화 전후 실제 네이티브 ScriptInterface 유형 토큰을 읽습니다.
   * @returns Opaque token; Event inherits this native identity.
   * @zh 不透明令牌；Event 继承此原生标识。
   * @ja 不透明トークン。Event はこのネイティブ識別子を継承します。
   * @ko 불투명 토큰이며 Event가 이 네이티브 식별자를 상속합니다.
   */
  static getStaticClassIdentifier(): ClassIdentifier {
    return classIdentifier(native.getStaticClassIdentifier('ScriptInterface'));
  }

  /**
   * Read the live native script object through its typed adapter.
   *
   * @zh 通过类型适配器读取有效原生脚本对象。
   * @ja 型付きアダプターで有効なネイティブスクリプトを読みます。
   * @ko 형식화된 어댑터로 유효한 네이티브 스크립트를 읽습니다.
   * @returns Registered host object, or the upstream default null.
   * @zh 已注册的宿主对象，或上游默认 null。
   * @ja 登録されたホストオブジェクト、または上流の既定値 null。
   * @ko 등록된 호스트 객체 또는 상위 기본값 null입니다.
   */
  abstract getScriptObject(): object | null;

  /**
   * Register a host object on the actual native ScriptInterface.
   *
   * @zh 在实际原生 ScriptInterface 上注册宿主对象。
   * @ja 実際のネイティブ ScriptInterface にホストオブジェクトを登録します。
   * @ko 실제 네이티브 ScriptInterface에 호스트 객체를 등록합니다.
   * @param object - Managed object, or null to remove its native association.
   * @zh object - 托管对象，或传 null 移除原生关联。
   * @ja object - 管理対象。null はネイティブ関連付けを解除します。
   * @ko object - 관리 객체이며 null은 네이티브 연결을 제거합니다.
   * @remarks
   * Native ownership retains the object; detached JS ownership allows cycles
   * to collect. Foreign native script overrides require their own adapter.
   * @zh 原生所有权保留对象；脱离后的 JS 所有权允许环被回收。
   * 外部原生脚本覆盖实现需要自己的适配器。
   * @ja ネイティブ所有時は保持し、分離後の JS 循環は回収できます。
   * 外部ネイティブのスクリプト実装には専用アダプターが必要です。
   * @ko 네이티브 소유 시 유지하고 분리된 JS 순환은 수집할 수 있습니다.
   * 외부 네이티브 스크립트 구현에는 자체 어댑터가 필요합니다.
   */
  abstract setScriptObject(object: object | null): void;

  /**
   * Read the live object's actual native class identifier.
   *
   * @zh 读取有效对象的真实原生类型标识。
   * @ja 有効なオブジェクトの実際のネイティブ型識別子を読みます。
   * @ko 유효한 객체의 실제 네이티브 유형 식별자를 읽습니다.
   * @returns Opaque native class token.
   * @zh 不透明原生类型令牌。
   * @ja 不透明なネイティブ型トークン。
   * @ko 불투명한 네이티브 유형 토큰입니다.
   */
  abstract getClassIdentifier(): ClassIdentifier;

  /**
   * Test actual native inheritance, independent of JS subclassing.
   *
   * @zh 检查真实原生继承关系，与 JS 子类无关。
   * @ja JS の派生に依存せず実際のネイティブ継承を調べます。
   * @ko JS 상속과 무관하게 실제 네이티브 상속을 검사합니다.
   * @param identifier - Class token from this module.
   * @zh identifier - 本模块的类型令牌。
   * @ja identifier - このモジュールの型トークン。
   * @ko identifier - 이 모듈의 유형 토큰입니다.
   * @returns Whether the object implements that native class.
   * @zh 对象是否实现指定原生类。
   * @ja 指定のネイティブ型を実装するかどうか。
   * @ko 지정한 네이티브 클래스를 구현하는지 여부입니다.
   */
  abstract isClass(identifier: ClassIdentifier): boolean;

  /**
   * Release an owned object through its original native allocation chain.
   *
   * @zh 通过原始原生分配链释放自有对象。
   * @ja 元のネイティブ生成経路で所有オブジェクトを解放します。
   * @ko 원래 네이티브 생성 경로를 통해 소유 객체를 해제합니다.
   * @remarks
   * Attached elements and borrowed events reject release. Concrete facades
   * define their exact rules; GC and shutdown also end native ownership.
   * @zh 已挂接元素及借用事件拒绝释放。具体类定义精确规则，
   * GC 和关闭也会结束原生所有权。
   * @ja 接続要素と借用イベントは解放を拒否します。具象型の規則に従い、
   * GC と終了でもネイティブ所有権を終了します。
   * @ko 연결된 요소와 빌린 이벤트의 해제는 거부합니다. 구체 타입의 규칙을
   * 따르며 GC와 종료 시에도 네이티브 소유권을 종료합니다.
   */
  abstract release(): void;
}
