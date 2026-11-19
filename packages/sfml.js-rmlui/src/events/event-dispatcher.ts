import { native } from '../internal/native';
import { Element } from '../dom/elements/element';
import { EventListener, eventListenerHandle } from './event-listener';
import { DefaultActionPhase, eventCallback } from './event';
import { variantToNative } from '../internal/animation-values';
import type {
  ElementNativeHandle, RmlEventListener, VariantValue,
} from '../values/types';

const handles = new WeakMap<EventDispatcher, ElementNativeHandle>();
const wrappers = new WeakMap<ElementNativeHandle, EventDispatcher>();

/**
 * Resolve the component's authentic element token.
 *
 * @internal
 * @param value - Component receiver.
 * @returns Checked element token.
 */
function handle(value: EventDispatcher): ElementNativeHandle {
  const token = handles.get(value);
  if (!token) {
    throw new TypeError('Expected an EventDispatcher');
  }
  return token;
}

/**
 * Checked Rml::EventDispatcher owned by its native element.
 *
 * @zh 元素持有的带检查 Rml::EventDispatcher。
 * @ja 要素所有の検証付き Rml::EventDispatcher。
 * @ko 요소가 소유하는 검증된 Rml::EventDispatcher입니다.
 * @remarks
 * Registrations share Element's listener identity and ownership index.
 * Destruction or shutdown invalidates this view. Its token retains detached
 * elements. Notifications run after native unwinding at the outer boundary.
 * @zh 注册项复用 Element 的监听器身份和所有权索引。销毁或关闭使视图失效；
 * 令牌保活分离元素。通知在原生栈退出后的外层边界执行。
 * @ja Element と登録の同一性・所有権索引を共有します。破棄・終了で無効になり、
 * トークンは分離要素を保持します。通知はネイティブ処理完了後の外側境界で実行します。
 * @ko Element와 등록 동일성 및 소유권 색인을 공유합니다. 파괴나 종료 시 무효화하고
 * 토큰은 분리 요소를 유지합니다. 알림은 네이티브 처리 후 외부 경계에서 실행합니다.
 */
export class EventDispatcher {
  private constructor() {}

  /**
   * Rml::EventDispatcher::AttachEvent using the existing listener registry.
   *
   * @zh 使用现有监听器注册表调用 Rml::EventDispatcher::AttachEvent。
   * @ja 既存リスナー登録で Rml::EventDispatcher::AttachEvent を呼びます。
   * @ko 기존 리스너 등록으로 Rml::EventDispatcher::AttachEvent를 호출합니다.
   * @param id - Registered id or event name.
   * @zh id - 已注册编号或事件名。
   * @ja id - 登録済み ID またはイベント名。
   * @ko id - 등록한 ID 또는 이벤트 이름입니다.
   * @param listener - Function or typed native listener.
   * @zh listener - 函数或带类型原生监听器。
   * @ja listener - 関数または型付きネイティブリスナー。
   * @ko listener - 함수 또는 타입 네이티브 리스너입니다.
   * @param capture - Capture registration; defaults to false.
   * @zh capture - 捕获注册，默认 false。
   * @ja capture - キャプチャ登録。既定値 false。
   * @ko capture - 캡처 등록이며 기본값은 false입니다.
   * @remarks
   * Duplicate element/id/listener/capture registrations are idempotent.
   * @zh 相同元素、编号、监听器和捕获标志的重复注册幂等。
   * @ja 要素・ID・リスナー・キャプチャが同じ登録は重複しません。
   * @ko 요소, ID, 리스너, 캡처가 같은 등록은 중복하지 않습니다.
   */
  attachEvent(
    id: string | number, listener: RmlEventListener | EventListener,
    capture = false,
  ): void {
    native.addEventListener(handle(this), id,
      listener instanceof EventListener
        ? eventListenerHandle(listener) : eventCallback(listener), capture);
  }

  /**
   * Rml::EventDispatcher::DetachEvent; unmatched registrations do nothing.
   *
   * @zh 调用 DetachEvent；不匹配的注册不执行操作。
   * @ja DetachEvent を呼びます。不一致の登録には何もしません。
   * @ko DetachEvent를 호출하며 일치하지 않는 등록은 그대로 둡니다.
   * @param id - Same event id or name used when attaching.
   * @zh id - 挂载时使用的编号或名称。
   * @ja id - 登録時と同じ ID または名前。
   * @ko id - 등록 시 사용한 ID 또는 이름입니다.
   * @param listener - Same listener reference.
   * @zh listener - 同一监听器引用。
   * @ja listener - 同じリスナー参照。
   * @ko listener - 같은 리스너 참조입니다.
   * @param capture - Same capture flag; defaults to false.
   * @zh capture - 同一捕获标志，默认 false。
   * @ja capture - 同じキャプチャフラグ。既定値 false。
   * @ko capture - 같은 캡처 플래그이며 기본값은 false입니다.
   */
  detachEvent(
    id: string | number, listener: RmlEventListener | EventListener,
    capture = false,
  ): void {
    native.removeEventListener(handle(this), id,
      listener instanceof EventListener
        ? eventListenerHandle(listener) : eventCallback(listener), capture);
  }

  /**
   * Recursively detach every listener, including non-DOM child dispatchers.
   *
   * @zh 递归解绑所有监听器，包含非 DOM 子元素派发器。
   * @ja 非 DOM 子要素の送信器を含めすべてのリスナーを再帰解除します。
   * @ko 비 DOM 자식 발송기를 포함해 모든 리스너를 재귀 해제합니다.
   * @remarks
   * Also removes upstream widget listeners. Active callbacks finish safely;
   * later detached listeners are skipped. Typed detach hooks use copied
   * identities and execute after the outer native call returns.
   * @zh 同时移除上游控件监听器。活动回调安全结束，后续已解绑监听器跳过。
   * 带类型解绑钩子使用标识副本，在外层原生调用退出后执行。
   * @ja 上流ウィジェットのリスナーも解除します。実行中の関数は安全に完了し、
   * 後続の解除済みリスナーを省略します。解除通知は外側処理完了後にコピーで届けます。
   * @ko 상위 위젯 리스너도 제거합니다. 실행 중 콜백은 안전하게 끝내고 후속 해제
   * 리스너는 건너뜁니다. 해제 훅은 외부 호출이 끝난 후 복사한 식별자로 실행합니다.
   */
  detachAllEvents(): void {
    native.dispatcherDetachAllEvents(handle(this));
  }

  /**
   * Copy Rml::EventDispatcher::ToString with native event names and counts.
   *
   * @zh 复制 ToString 的原生事件名与数量。
   * @ja ToString のネイティブイベント名と件数をコピーします。
   * @ko ToString의 네이티브 이벤트 이름과 수를 복사합니다.
   * @returns Empty string when no listeners are registered.
   * @zh 无注册监听器时为空字符串。
   * @ja 登録がなければ空文字列。
   * @ko 등록한 리스너가 없으면 빈 문자열입니다.
   */
  toString(): string {
    return native.getEventDispatcherSummary(handle(this));
  }

  /**
   * Rml::EventDispatcher::DispatchEvent with every upstream flag explicit.
   *
   * @zh 显式指定所有上游标志调用 Rml::EventDispatcher::DispatchEvent。
   * @ja 上流フラグを明示して Rml::EventDispatcher::DispatchEvent を呼びます。
   * @ko 모든 상위 플래그를 명시해 Rml::EventDispatcher::DispatchEvent를 호출합니다.
   * @param target - Live target element.
   * @zh target - 活跃目标元素。
   * @ja target - 有効な対象要素。
   * @ko target - 유효한 대상 요소입니다.
   * @param id - Native EventId used to select listeners.
   * @zh id - 选择监听器的原生 EventId。
   * @ja id - リスナー選択用のネイティブ EventId。
   * @ko id - 리스너 선택용 네이티브 EventId입니다.
   * @param type - Explicit event name, independent of the registry name.
   * @zh type - 独立于注册表名称的显式事件名。
   * @ja type - 登録名と独立した明示イベント名。
   * @ko type - 등록 이름과 독립된 명시 이벤트 이름입니다.
   * @param parameters - Typed native Variant parameters.
   * @zh parameters - 带类型原生 Variant 参数。
   * @ja parameters - 型付きネイティブ Variant パラメーター。
   * @ko parameters - 타입 네이티브 Variant 매개변수입니다.
   * @param interruptible - Whether listeners may stop propagation.
   * @zh interruptible - 监听器能否停止传播。
   * @ja interruptible - リスナーが伝播を停止できるか。
   * @ko interruptible - 리스너의 전파 중단 가능 여부입니다.
   * @param bubbles - Whether ancestor bubble listeners execute.
   * @zh bubbles - 是否执行祖先冒泡监听器。
   * @ja bubbles - 祖先のバブルリスナーを実行するか。
   * @ko bubbles - 조상 버블 리스너 실행 여부입니다.
   * @param defaultActionPhase - None, Target or TargetAndBubble.
   * @zh defaultActionPhase - None、Target 或 TargetAndBubble。
   * @ja defaultActionPhase - None、Target、TargetAndBubble の既定動作段階。
   * @ko defaultActionPhase - None, Target 또는 TargetAndBubble입니다.
   * @returns Whether propagation remains enabled.
   * @zh 是否仍可传播。
   * @ja 伝播を継続できるか。
   * @ko 전파를 계속할 수 있는지 여부입니다.
   * @remarks
   * Uses these flags without consulting registered defaults. Upstream runs
   * TargetAndBubble default actions on ancestors even when bubbles is false.
   * Parameter accessors run before native target validation.
   * @zh 使用显式标志，不读取注册默认值。上游即使 bubbles 为 false，
   * 也在祖先执行 TargetAndBubble 默认动作。参数访问器先于原生目标校验执行。
   * @ja 登録済みの既定値は読みません。bubbles が false でも祖先の
   * TargetAndBubble 既定動作を実行します。パラメーターの取得は対象検証前です。
   * @ko 등록 기본값을 읽지 않습니다. bubbles가 false여도 조상의
   * TargetAndBubble 기본 동작을 실행합니다. 매개변수 접근은 대상 검사 전에 합니다.
   */
  static dispatchEvent(
    target: Element, id: number, type: string,
    parameters: Readonly<Record<string, VariantValue>>,
    interruptible: boolean, bubbles: boolean,
    defaultActionPhase: DefaultActionPhase,
  ): boolean {
    const values = Object.fromEntries(
      Object.entries(parameters).map(([ name, value ]) => [
        name, value instanceof Element ? value.handle : variantToNative(value),
      ]),
    );
    return native.dispatcherDispatchEvent(
      target.handle, id, type, values, interruptible, bubbles,
      defaultActionPhase,
    );
  }
}

/**
 * Reuse the wrapper for an element-owned dispatcher.
 *
 * @internal
 * @param token - Checked element token.
 * @returns Canonical component view.
 */
export function eventDispatcherFromNative(
  token: ElementNativeHandle,
): EventDispatcher {
  let result = wrappers.get(token);
  if (!result) {
    result = Object.create(EventDispatcher.prototype) as EventDispatcher;
    handles.set(result, token);
    wrappers.set(token, result);
  }
  return result;
}
