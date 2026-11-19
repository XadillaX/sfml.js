import { native, type NativeRmlEvent } from '../internal/native';
import {
  variantToNative, variantFromNative,
} from '../internal/animation-values';
import { Element } from '../dom/elements/element';
import { ScriptInterface } from '../scripting/script-interface';
import {
  classIdentifier, classIndex, type ClassIdentifier,
} from '../runtime/rtti';
import type {
  RmlEventListener, VariantReadValue, VariantVector2,
  VariantConversionDefault, VariantResult,
} from '../values/types';

export { EventId } from '../generated/events';

const eventHandles = new WeakMap<object, object>();
const eventWrappers = new WeakMap<object, RmlEvent>();

/**
 * Phases that run Rml::Element::ProcessDefaultAction after listeners finish.
 *
 * @zh 监听器完成后执行 Rml::Element::ProcessDefaultAction 的阶段。
 * @ja リスナー終了後に Rml::Element::ProcessDefaultAction を実行する段階。
 * @ko 리스너 종료 후 Rml::Element::ProcessDefaultAction을 실행할 단계입니다.
 */
export enum DefaultActionPhase {
  /**
   * No native default action.
   *
   * @zh 不执行原生默认动作。
   * @ja ネイティブ既定動作を実行しません。
   * @ko 네이티브 기본 동작을 실행하지 않습니다.
   */
  None = 0,
  /**
   * Run only on the target.
   *
   * @zh 仅在目标元素上执行。
   * @ja 対象要素でのみ実行します。
   * @ko 대상 요소에서만 실행합니다.
   */
  Target = 2,
  /**
   * Run on the target and its ancestors.
   *
   * @zh 在目标元素及其祖先上执行。
   * @ja 対象要素と祖先で実行します。
   * @ko 대상 요소와 조상에서 실행합니다.
   */
  TargetAndBubble = 6,
}

/**
 * Register a native event specification with Rml::RegisterEventType.
 *
 * @zh 使用 Rml::RegisterEventType 注册原生事件定义。
 * @ja Rml::RegisterEventType でネイティブイベント仕様を登録します。
 * @ko Rml::RegisterEventType으로 네이티브 이벤트 정의를 등록합니다.
 * @param type - Event name.
 * @zh type - 事件名称。
 * @ja type - イベント名。
 * @ko type - 이벤트 이름입니다.
 * @param interruptible - Whether listeners may stop propagation.
 * @zh interruptible - 监听器能否停止传播。
 * @ja interruptible - リスナーが伝播を停止できるか。
 * @ko interruptible - 리스너가 전파를 중단할 수 있는지 여부입니다.
 * @param bubbles - Whether ancestor bubble listeners execute.
 * @zh bubbles - 是否执行祖先冒泡监听器。
 * @ja bubbles - 祖先のバブルリスナーを実行するか。
 * @ko bubbles - 조상 버블 리스너를 실행할지 여부입니다.
 * @param defaultActionPhase - Native default action phases; defaults to None.
 * @zh defaultActionPhase - 原生默认动作阶段，默认为 None。
 * @ja defaultActionPhase - ネイティブ既定動作の段階。既定値は None。
 * @ko defaultActionPhase - 네이티브 기본 동작 단계이며 기본값은 None입니다.
 * @returns Native id; Invalid if the native registry has no remaining ids.
 * @zh 原生编号；原生注册表编号耗尽时为 Invalid。
 * @ja ネイティブ ID。レジストリーが上限に達した場合は Invalid。
 * @ko 네이티브 ID이며 레지스트리 ID가 소진되면 Invalid입니다.
 * @remarks
 * Existing custom types retain their id and replace their flags. Built-in
 * types retain their id and flags. Custom ids belong to this runtime lifetime.
 * Dispatch options override only interruptible/bubbles, retaining these phases.
 * @zh 同名自定义类型保留编号并替换标志；内置类型保留编号和标志。
 * 自定义编号仅在本次运行时有效。派发选项仅覆盖中断和冒泡标志，保留默认动作阶段。
 * @ja 既存カスタム型は ID を維持してフラグを置換します。組み込み型は変更しません。
 * カスタム ID は今回のランタイム中のみ有効です。送信オプションは既定動作の段階を維持します。
 * @ko 기존 사용자 정의 유형은 ID를 유지하고 플래그를 교체합니다. 내장 유형은 변경하지 않습니다.
 * 사용자 정의 ID는 현재 런타임에서만 유효하며 발송 옵션은 기본 동작 단계를 유지합니다.
 */
export function registerEventType(
  type: string,
  interruptible: boolean,
  bubbles: boolean,
  defaultActionPhase: DefaultActionPhase = DefaultActionPhase.None,
): number {
  return native.registerEventType(
    type, interruptible, bubbles, defaultActionPhase,
  );
}

/**
 * Rml::EventPhase values.
 *
 * @zh Rml::EventPhase 的阶段值。
 * @ja Rml::EventPhase の段階値。
 * @ko Rml::EventPhase 단계 값입니다.
 */
export enum EventPhase {
  /**
   * No phase.
   *
   * @zh 无阶段。
   * @ja 段階なし。
   * @ko 단계 없음.
   */
  None = 0,
  /**
   * Capture.
   *
   * @zh 捕获。
   * @ja キャプチャ。
   * @ko 캡처.
   */
  Capture = 1,
  /**
   * Target.
   *
   * @zh 目标。
   * @ja ターゲット。
   * @ko 대상.
   */
  Target = 2,
  /**
   * Bubble.
   *
   * @zh 冒泡。
   * @ja バブリング。
   * @ko 버블링.
   */
  Bubble = 4,
}

/**
 * Explicit Rml::Element::DispatchEvent propagation options.
 *
 * @zh Rml::Element::DispatchEvent 的显式传播选项。
 * @ja Rml::Element::DispatchEvent の明示的な伝播オプション。
 * @ko Rml::Element::DispatchEvent의 명시적 전파 옵션입니다.
 */
export interface DispatchEventOptions {
  /**
   * Whether stop methods take effect; defaults to true when options are given.
   *
   * @zh 停止传播方法是否生效；提供选项时默认为 true。
   * @ja 停止操作が有効かどうか。オプション指定時の既定値は true。
   * @ko 중단 메서드의 적용 여부이며 옵션 지정 시 기본값은 true입니다.
   */
  interruptible?: boolean;

  /**
   * Execute ancestor bubble listeners; defaults to true when options are given.
   *
   * @zh 是否执行祖先的冒泡监听器；提供选项时默认为 true。
   * @ja 祖先のバブルリスナーを実行するか。オプション指定時の既定値は true。
   * @ko 조상의 버블 리스너 실행 여부이며 옵션 지정 시 기본값은 true입니다.
   */
  bubbles?: boolean;
}

/**
 * RmlUi event snapshot with callback-scoped native propagation controls.
 *
 * @zh RmlUi 事件快照，原生传播控制仅在当前回调期间有效。
 * @ja RmlUi イベントのコピー。ネイティブ伝播制御は現在のコールバック中のみ有効。
 * @ko RmlUi 이벤트 스냅샷이며 네이티브 전파 제어는 현재 콜백 동안만 유효합니다.
 * @remarks
 * Each listener receives its own snapshot, including projected coordinates.
 * Saved fields remain readable. Propagation getters and stop methods throw
 * after that callback returns, even while other listeners are still running.
 * The id identifies the event type, not a unique dispatch.
 * @zh 每个监听器收到独立快照，包含投影后的坐标。保存的字段可继续读取。
 * 回调返回后，即使其他监听器仍在执行，传播状态和停止方法也会抛出异常。
 * id 标识事件类型，并非某次派发的唯一编号。
 * @ja 各リスナーは投影座標を含む独自のコピーを受け取ります。保存した項目は読めますが、
 * コールバック終了後の伝播状態取得と停止操作は例外になります。id はイベントの種類です。
 * @ko 각 리스너는 투영 좌표를 포함한 별도 스냅샷을 받습니다. 저장된 필드는 읽을 수 있지만
 * 콜백 종료 후 전파 상태와 중단 메서드는 예외를 던집니다. id는 이벤트 종류를 식별합니다.
 */
export class RmlEvent extends ScriptInterface {
  /** Last captured or explicitly set native phase. */
  private eventPhase: EventPhase;

  /** Last captured or explicitly set current element. */
  private eventCurrentTarget: Element | null;

  /**
   * Event type.
   *
   * @zh 事件类型。
   * @ja イベント型。
   * @ko 이벤트 유형입니다.
   */
  readonly type: string;

  /**
   * Native EventId.
   *
   * @zh 原生 EventId。
   * @ja ネイティブ EventId。
   * @ko 네이티브 EventId입니다.
   */
  readonly id: number;

  /**
   * Captured phase.
   *
   * @zh 回调时的阶段。
   * @ja 受信時の段階。
   * @ko 수신 시 단계입니다.
   * @returns Retained native phase.
   * @zh 保留的原生阶段。
   * @ja 保持したネイティブ段階。
   * @ko 보관한 네이티브 단계입니다.
   */
  get phase(): EventPhase {
    return this.eventPhase;
  }

  /**
   * Target element, or null for a default-constructed event.
   *
   * @zh 目标元素；默认构造的事件为 null。
   * @ja 対象要素。既定構築のイベントでは null。
   * @ko 대상 요소이며 기본 생성한 이벤트에서는 null입니다.
   */
  readonly target: Element | null;

  /**
   * Listener element.
   *
   * @zh 监听器所在元素。
   * @ja リスナー要素。
   * @ko 리스너 요소입니다.
   * @returns Retained current element, or null.
   * @zh 保留的当前元素，或 null。
   * @ja 保持した現在要素、または null。
   * @ko 보관한 현재 요소 또는 null입니다.
   */
  get currentTarget(): Element | null {
    return this.eventCurrentTarget;
  }

  /**
   * Target id snapshot.
   *
   * @zh 目标 id 快照。
   * @ja 対象 id のコピー。
   * @ko 대상 id 스냅샷입니다.
   */
  readonly targetId: string;

  /**
   * Interruptible flag.
   *
   * @zh 是否可中断。
   * @ja 中断可能か。
   * @ko 중단 가능 여부입니다.
   */
  readonly isInterruptible: boolean;

  /**
   * Typed parameters copied from Rml::Event::GetParameters.
   *
   * @zh 从 Rml::Event::GetParameters 复制的带类型参数。
   * @ja Rml::Event::GetParameters からコピーした型付きパラメーター。
   * @ko Rml::Event::GetParameters에서 복사한 타입 매개변수입니다.
   */
  readonly parameters: Readonly<Record<string, VariantReadValue>>;

  /**
   * Rml::Event::GetUnprojectedMouseScreenPos snapshot in physical pixels.
   *
   * @zh Rml::Event::GetUnprojectedMouseScreenPos 快照，单位为物理像素。
   * @ja Rml::Event::GetUnprojectedMouseScreenPos の物理ピクセル座標コピー。
   * @ko Rml::Event::GetUnprojectedMouseScreenPos의 물리 픽셀 좌표 스냅샷입니다.
   */
  readonly unprojectedMouseScreenPosition: VariantVector2;

  /**
   * Construct an owned Rml::Event with the upstream default state.
   *
   * @zh 构造具有上游默认状态的自有 Rml::Event。
   * @ja 上流の既定状態で所有 Rml::Event を構築します。
   * @ko 상위 기본 상태를 갖는 소유 Rml::Event를 생성합니다.
   * @remarks
   * Requires an initialized runtime. Target and current element are null,
   * type and parameters are empty, id is Invalid and phase is None.
   * The event is noninterruptible. Native ownership ends on release, GC or
   * shutdown, while saved fields remain readable.
   * @zh 需要已初始化的运行时。目标与当前元素为 null，类型和参数为空，
   * 编号为 Invalid，阶段为 None。事件不可中断；release、GC 或关闭释放原生
   * 所有权，保存的字段仍可读取。
   * @ja 初期化済みランタイムが必要です。対象と現在要素は null、型とパラメーターは
   * 空、ID は Invalid、段階は None。中断不可。解放・GC・終了で所有権を終了します。
   * @ko 초기화한 런타임이 필요합니다. 대상과 현재 요소는 null이고 유형과 매개변수는
   * 비어 있으며 ID는 Invalid, 단계는 None입니다. 중단할 수 없고 해제, GC 또는
   * 종료 시 네이티브 소유권을 종료하며 저장한 필드는 계속 읽을 수 있습니다.
   */
  constructor();

  /**
   * Wrap a synchronous native callback.
   *
   * @zh 包装同步原生回调。
   * @ja 同期ネイティブコールバックをラップします。
   * @ko 동기 네이티브 콜백을 감쌉니다.
   * @param data - Native callback payload.
   * @zh data - 原生回调数据。
   * @ja data - ネイティブコールバックデータ。
   * @ko data - 네이티브 콜백 데이터입니다.
   * @internal
   */
  constructor(data: NativeRmlEvent);
  constructor(data: NativeRmlEvent = native.createDefaultEvent()) {
    super();
    eventHandles.set(this, data.handle);
    eventWrappers.set(data.handle, this);
    this.type = data.type;
    this.id = data.id;
    this.eventPhase = data.phase;
    this.target = data.target === null ? null : Element.wrap(data.target);
    this.eventCurrentTarget = data.currentTarget === null
      ? null : Element.wrap(data.currentTarget);
    this.targetId = data.targetId;
    this.isInterruptible = data.isInterruptible;
    this.parameters = eventParametersFromNative(data.parameters);
    this.unprojectedMouseScreenPosition = data.unprojectedMouseScreenPosition;
  }

  /**
   * Read native GetScriptObject; unregistered events return null.
   *
   * @zh 读取原生 GetScriptObject；未注册事件返回 null。
   * @ja ネイティブ GetScriptObject を読み、未登録イベントなら null。
   * @ko 네이티브 GetScriptObject를 읽으며 미등록 이벤트는 null입니다.
   * @returns Registered host object or null; expired callback leases throw.
   * @zh 已注册的宿主对象或 null；回调借用过期时抛出异常。
   * @ja 登録ホストまたは null。期限切れの借用コールバックは例外。
   * @ko 등록된 호스트 또는 null이며 만료한 콜백은 예외를 던집니다.
   */
  getScriptObject(): object | null {
    return native.getEventScriptObject(eventHandle(this));
  }

  /**
   * Register a managed script object on this live native event.
   *
   * @zh 在此有效原生事件上注册托管脚本对象。
   * @ja 有効なネイティブイベントに管理スクリプトを登録します。
   * @ko 유효한 네이티브 이벤트에 관리 스크립트를 등록합니다.
   * @param object - Host object, or null to clear the association.
   * @zh object - 宿主对象，或传 null 清除关联。
   * @ja object - ホストオブジェクト。null は関連付けを解除します。
   * @ko object - 호스트 객체이며 null은 연결을 해제합니다.
   * @remarks
   * Listener leases share the actual native event association. Each borrowed
   * facade still expires after its callback. Owned event cycles can collect.
   * @zh 监听器借用共享实际原生事件的关联；每个借用包装仍在回调后过期。
   * 自有事件形成的环可回收。
   * @ja リスナー間で関連付けを共有します。借用は各コールバック後に失効し、
   * 所有イベントの循環は回収できます。
   * @ko 리스너가 연결을 공유합니다. 빌린 래퍼는 콜백 후 만료하며
   * 소유 이벤트의 순환은 수집할 수 있습니다.
   */
  setScriptObject(object: object | null): void {
    native.setEventScriptObject(eventHandle(this), object);
  }

  /**
   * Read native RTTI; Event inherits ScriptInterface's class identifier.
   *
   * @zh 读取原生 RTTI；Event 继承 ScriptInterface 的类型标识。
   * @ja ネイティブ RTTI を読みます。Event は ScriptInterface の識別子を継承します。
   * @ko 네이티브 RTTI를 읽으며 Event는 ScriptInterface의 식별자를 상속합니다.
   * @returns Opaque class token while the event is live.
   * @zh 事件有效期间的不透明类型令牌。
   * @ja イベントが有効な間の不透明な型トークン。
   * @ko 이벤트가 유효한 동안 불투명한 유형 토큰입니다.
   */
  getClassIdentifier(): ClassIdentifier {
    return classIdentifier(native.getClassIdentifier(eventHandle(this)));
  }

  /**
   * Test native Event inheritance through ScriptInterface::IsClass.
   *
   * @zh 通过 ScriptInterface::IsClass 检查原生 Event 继承关系。
   * @ja ScriptInterface::IsClass でネイティブ Event の継承を調べます。
   * @ko ScriptInterface::IsClass로 네이티브 Event 상속을 검사합니다.
   * @param identifier - Opaque class token from this module.
   * @zh identifier - 本模块的不透明类型令牌。
   * @ja identifier - このモジュールの不透明型トークン。
   * @ko identifier - 이 모듈의 불투명 유형 토큰입니다.
   * @returns Whether the live event implements that native class.
   * @zh 有效事件是否实现指定原生类。
   * @ja 有効なイベントが指定のネイティブ型を実装するかどうか。
   * @ko 유효한 이벤트가 지정한 네이티브 클래스를 구현하는지 여부입니다.
   */
  isClass(identifier: ClassIdentifier): boolean {
    return native.isClass(eventHandle(this), classIndex(identifier));
  }

  /**
   * Read an element-valued parameter through a checked pointer adapter.
   *
   * @zh 通过受检指针适配器读取元素参数。
   * @ja 検証付きポインターアダプターで要素パラメーターを読みます。
   * @ko 검증된 포인터 어댑터로 요소 매개변수를 읽습니다.
   * @param name - Native parameter name.
   * @zh name - 原生参数名。
   * @ja name - ネイティブパラメーター名。
   * @ko name - 네이티브 매개변수 이름입니다.
   * @param defaultValue - Live fallback element or null; defaults to null.
   * @zh defaultValue - 有效备用元素或 null，默认为 null。
   * @ja defaultValue - 有効な既定要素または null。既定値は null。
   * @ko defaultValue - 유효한 기본 요소 또는 null이며 기본값은 null입니다.
   * @returns Canonical element or fallback when native conversion fails.
   * @zh 身份唯一的元素；原生转换失败时返回备用值。
   * @ja 一意の要素。ネイティブ変換に失敗した場合は既定値。
   * @ko 고유 요소이며 네이티브 변환 실패 시 기본값을 반환합니다.
   * @remarks
   * Supports native ScriptInterface element values and the exact upstream
   * drag_element pointer contract. Arbitrary pointers are rejected. Native
   * event/reference validity is checked on every call; no pointer is stored
   * in a persistent attribute. Snapshots do not alter live parameters.
   * @zh 支持原生 ScriptInterface 元素值及上游 drag_element 指针契约，
   * 拒绝任意指针。每次检查事件及引用的有效性，不向持久属性保存指针。
   * 快照修改不会改变实时参数。
   * @ja ScriptInterface 要素値と上流の drag_element 契約に対応し、
   * 任意ポインターは拒否します。毎回有効性を検証し、永続属性へ保存しません。
   * コピーの変更は有効なパラメーターを変えません。
   * @ko ScriptInterface 요소와 상위 drag_element 계약에 대응하고 임의 포인터는
   * 거부합니다. 매번 이벤트와 참조를 검증하고 영구 속성에 저장하지 않습니다.
   * 스냅샷 변경은 실제 매개변수를 바꾸지 않습니다.
   */
  getElementParameter(name: string, defaultValue: Element | null = null):
  Element | null {
    const handle = native.getEventElementParameter(
      eventHandle(this), name,
      defaultValue === null ? null : defaultValue.handle);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Rml::Event::GetParameter<T> conversion while the native event is live.
   *
   * @zh Rml::Event::GetParameter<T> 类型转换，原生事件有效期间可用。
   * @ja Rml::Event::GetParameter<T> の型変換。ネイティブイベントが有効な間使えます。
   * @ko Rml::Event::GetParameter<T> 변환이며 네이티브 이벤트가 유효할 때 사용합니다.
   * @param name - Native parameter name.
   * @zh name - 原生参数名。
   * @ja name - ネイティブパラメーター名。
   * @ko name - 네이티브 매개변수 이름입니다.
   * @param defaultValue - Non-null owned Variant selecting T.
   * @zh defaultValue - 选择 T 的非空自有 Variant。
   * @ja defaultValue - T を選ぶ非 null の所有 Variant。
   * @ko defaultValue - T를 선택하는 null이 아닌 소유 Variant입니다.
   * @returns Native conversion result, or the default for missing parameters.
   * @zh 原生转换结果；参数缺失时返回默认值。
   * @ja ネイティブ変換結果。パラメーターがなければ既定値。
   * @ko 네이티브 변환 결과이며 매개변수가 없으면 기본값입니다.
   * @remarks
   * Reads live projected parameters, independent of the JS snapshot. Numbers
   * select double; BigInt selects int64, or uint64 above INT64_MAX.
   * RmlUi conversion rules apply: nonnumeric strings convert to number 0.
   * Unsafe integer overflow throws. A scriptinterface selector reads guarded
   * Element, Context or Event pointers; native expiry returns null.
   * Vectors and colours are copied. Use parameters for retained raw values.
   * @zh 读取实时投影参数，不受 JS 快照修改影响。number 选择 double；
   * BigInt 选择 int64，超过 INT64_MAX 时选择 uint64。遵循 RmlUi 规则，
   * 非数字字符串转换为 number 时得到 0。整数溢出抛出异常；
   * scriptinterface 样本读取受保护的 Element、Context 或 Event 指针；
   * 原生目标失效时返回 null。
   * 向量和颜色返回副本；需要保留原始值时使用 parameters。
   * @ja JS コピーと独立した投影済みパラメーターを読みます。number は double、
   * BigInt は int64、INT64_MAX を超える場合は uint64 を選択します。
   * 非数値文字列の数値変換は 0。整数範囲外は例外です。
   * scriptinterface は保護された Element、Context、Event 参照を読み、
   * ネイティブ参照の期限が切れると null になります。
   * ベクトルと色はコピーです。値の保持には parameters を使います。
   * @ko JS 스냅샷과 독립된 투영 매개변수를 읽습니다. number는 double,
   * BigInt는 int64이며 INT64_MAX 초과 시 uint64를 선택합니다.
   * 비숫자 문자열의 숫자 변환 결과는 0입니다. 정수 범위 초과는 예외이며
   * scriptinterface 예제는 보호된 Element, Context, Event 포인터를 읽고
   * 만료하면 null을 반환합니다. 벡터와 색상은 복사하며 보관에는 parameters를 씁니다.
   * @template T - Native conversion type selected by the default value.
   * @zh T - 由默认值选择的原生转换类型。
   * @ja T - 既定値で選択するネイティブ変換型。
   * @ko T - 기본값으로 선택하는 네이티브 변환 형식입니다.
   */
  getParameter<const T extends VariantConversionDefault>(
    name: string, defaultValue: T,
  ): VariantResult<T> {
    return variantFromNative(native.getEventParameter(
      eventHandle(this), name, variantToNative(defaultValue, true),
    )) as VariantResult<T>;
  }

  /**
   * Rml::Event equality operators, using the retained type/id snapshot.
   *
   * @zh 使用保留的类型或编号快照实现 Rml::Event 相等运算。
   * @ja 保持された型名または ID で Rml::Event の等価演算を行います。
   * @ko 보관된 유형 또는 ID로 Rml::Event 동등 연산을 수행합니다.
   * @param type - Event name or native id.
   * @zh type - 事件名或原生编号。
   * @ja type - イベント名またはネイティブ ID。
   * @ko type - 이벤트 이름 또는 네이티브 ID입니다.
   * @returns Whether this event has the given type.
   * @zh 事件是否具有指定类型。
   * @ja 指定された型のイベントかどうか。
   * @ko 지정한 유형의 이벤트인지 여부입니다.
   */
  isType(type: string | number): boolean {
    return typeof type === 'string' ? this.type === type : this.id === type;
  }

  /**
   * Rml::Event::IsPropagating while the native event is live.
   *
   * @zh Rml::Event::IsPropagating，原生事件有效期间可用。
   * @ja Rml::Event::IsPropagating。ネイティブイベントが有効な間使えます。
   * @ko Rml::Event::IsPropagating이며 네이티브 이벤트가 유효할 때 사용합니다.
   * @returns Whether propagation may continue.
   * @zh 是否可以继续传播。
   * @ja 伝播を継続できるかどうか。
   * @ko 전파를 계속할 수 있는지 여부입니다.
   */
  get isPropagating(): boolean {
    return native.getEventPropagation(eventHandle(this), false);
  }

  /**
   * Rml::Event::IsImmediatePropagating while the native event is live.
   *
   * @zh Rml::Event::IsImmediatePropagating，原生事件有效期间可用。
   * @ja Rml::Event::IsImmediatePropagating。ネイティブイベントが有効な間使えます。
   * @ko Rml::Event::IsImmediatePropagating이며 네이티브 이벤트가 유효할 때 사용합니다.
   * @returns Whether remaining listeners on this element may run.
   * @zh 当前元素的后续监听器是否可以继续执行。
   * @ja この要素の残りのリスナーを実行できるかどうか。
   * @ko 이 요소의 나머지 리스너 실행 가능 여부입니다.
   */
  get isImmediatePropagating(): boolean {
    return native.getEventPropagation(eventHandle(this), true);
  }

  /**
   * Rml::Event::StopPropagation; finish listeners at the current DOM level.
   *
   * @zh Rml::Event::StopPropagation；当前 DOM 层级的监听器仍会执行完毕。
   * @ja Rml::Event::StopPropagation。現在の DOM 階層のリスナーは完了します。
   * @ko Rml::Event::StopPropagation이며 현재 DOM 단계의 리스너는 완료됩니다.
   */
  stopPropagation(): void {
    native.stopEventPropagation(eventHandle(this), false);
  }

  /**
   * Rml::Event::StopImmediatePropagation; also stop remaining local listeners.
   *
   * @zh Rml::Event::StopImmediatePropagation；同时停止当前元素的后续监听器。
   * @ja Rml::Event::StopImmediatePropagation。同じ要素の残りのリスナーも停止。
   * @ko Rml::Event::StopImmediatePropagation이며 같은 요소의 나머지 리스너도 중단합니다.
   */
  stopImmediatePropagation(): void {
    native.stopEventPropagation(eventHandle(this), true);
  }

  /**
   * Rml::Event::SetPhase; update the retained phase after native validation.
   *
   * @zh 调用 SetPhase，原生校验后更新保留阶段。
   * @ja SetPhase を呼び、検証後に保持した段階を更新します。
   * @ko SetPhase를 호출하고 검증 후 보관한 단계를 갱신합니다.
   * @param phase - Native None, Capture, Target or Bubble phase.
   * @zh phase - 原生 None、Capture、Target 或 Bubble 阶段。
   * @ja phase - None、Capture、Target、Bubble の段階。
   * @ko phase - None, Capture, Target 또는 Bubble 단계입니다.
   */
  setPhase(phase: EventPhase): void {
    native.setEventPhase(eventHandle(this), phase);
    this.eventPhase = phase;
  }

  /**
   * Rml::Event::SetCurrentElement, including native mouse projection.
   *
   * @zh 调用 SetCurrentElement，包含原生鼠标坐标投影。
   * @ja マウス座標投影を含む SetCurrentElement を呼びます。
   * @ko 마우스 좌표 투영을 포함하는 SetCurrentElement를 호출합니다.
   * @param element - Live current element, or null.
   * @zh element - 活跃当前元素，或 null。
   * @ja element - 有効な現在要素、または null。
   * @ko element - 유효한 현재 요소 또는 null입니다.
   */
  setCurrentElement(element: Element | null): void {
    const result = native.setEventCurrentElement(
      eventHandle(this), element === null ? null : element.handle);
    this.eventCurrentTarget = result === null ? null : Element.wrap(result);
  }

  /**
   * Release a live owned event through its native deleter.
   *
   * @zh 通过原生删除器释放活跃自有事件。
   * @ja ネイティブ削除関数で有効な所有イベントを解放します。
   * @ko 네이티브 삭제기로 유효한 소유 이벤트를 해제합니다.
   * @remarks
   * Factory and direct allocations support release; callback leases reject.
   * Snapshot fields remain readable. Native deletion also runs on GC and
   * shutdown. Release callbacks run only at a subsequent safe boundary.
   * @zh 支持 Factory 及直接分配；拒绝回调借用事件。快照仍可读取。
   * GC 和关闭也会原生删除；释放回调只在之后的安全边界执行。
   * @ja Factory と直接生成に対応し、借用コールバックは拒否します。
   * コピーは読めます。GC と終了でも削除し、安全な境界で解放を通知します。
   * @ko Factory와 직접 생성에 대응하며 빌린 콜백 이벤트는 거부합니다.
   * 복사한 필드는 읽을 수 있습니다. GC와 종료에서도 삭제하고 안전 경계에서 알립니다.
   */
  release(): void {
    native.releaseOwnedEvent(eventHandle(this));
  }
}

/**
 * Convert copied native parameters without retaining raw pointers.
 *
 * @internal
 * @param parameters - Native parameter copy.
 * @returns Public typed values.
 */
export function eventParametersFromNative(
  parameters: Record<string, unknown>,
): Record<string, VariantReadValue> {
  return Object.fromEntries(
    Object.entries(parameters).map(([ key, value ]) => {
      if (typeof value === 'object' && value !== null &&
          'elementHandle' in value) {
        return [ key, Element.wrap(value.elementHandle as object) ];
      }
      return [ key, variantFromNative(value) ];
    }),
  );
}

/**
 * Resolve an authentic callback payload without reading user properties.
 *
 * @param event - Public callback event.
 * @returns Native dispatch lease.
 * @internal
 */
export function eventHandle(event: RmlEvent): object {
  const handle = eventHandles.get(event);
  if (handle === undefined) {
    throw new TypeError('Expected an RmlEvent from a native callback');
  }

  return handle;
}

/**
 * Resolve the facade for a live typed native Variant pointer.
 *
 * @internal
 * @param handle - Native event lease.
 * @returns Original snapshot, or the first snapshot of a native Lua event.
 */
export function eventFromHandle(handle: object): RmlEvent {
  const event = eventWrappers.get(handle);
  return event ?? new RmlEvent(native.snapshotEvent(handle));
}

type NativeEventCallback = (data: NativeRmlEvent) => void;
const callbacks = new WeakMap<RmlEventListener, NativeEventCallback>();

/**
 * Reuse the same native callback for every registration of one listener.
 *
 * @param listener - Public listener.
 * @returns Stable adapter retaining only that listener.
 * @internal
 */
export function eventCallback(
  listener: RmlEventListener,
): (data: NativeRmlEvent) => void {
  if (typeof listener !== 'function') {
    throw new TypeError('Expected an event listener function');
  }
  let callback = callbacks.get(listener);
  if (!callback) {
    callback = data => listener(new RmlEvent(data));
    callbacks.set(listener, callback);
  }
  return callback;
}
