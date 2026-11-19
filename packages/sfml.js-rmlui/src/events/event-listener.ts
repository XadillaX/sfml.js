import { native } from '../internal/native';
import { Element } from '../dom/elements/element';
import { RmlEvent, eventHandle } from './event';
import type { RmlEventListener } from '../values/types';

const handles = new WeakMap<EventListener, object>();
const wrappers = new WeakMap<object, WeakRef<EventListener>>();

/**
 * Element identity copied when a native listener attaches.
 *
 * @zh 原生监听器挂载时复制的元素标识。
 * @ja ネイティブリスナー登録時にコピーした要素識別。
 * @ko 네이티브 리스너 등록 시 복사한 요소 식별자입니다.
 */
export interface EventListenerAttachment {
  /**
   * Element id at attachment time.
   *
   * @zh 挂载时的元素编号。
   * @ja 登録時の要素 ID。
   * @ko 등록 시 요소 ID입니다.
   */
  id: string;

  /**
   * Native element tag name.
   *
   * @zh 原生元素标签名。
   * @ja ネイティブ要素のタグ名。
   * @ko 네이티브 요소 태그 이름입니다.
   */
  tagName: string;
}

/**
 * Observe a native attachment or detachment after its active frame returns.
 *
 * @zh 在原生活动调用返回后观察挂载或解绑。
 * @ja ネイティブ処理完了後に登録または解除を受け取ります。
 * @ko 네이티브 처리 완료 후 등록 또는 해제를 관찰합니다.
 */
export interface EventListenerHook {
  /**
   * Receive an independent element identity without a released pointer.
   *
   * @zh 接收独立元素标识，不含已释放的指针。
   * @ja 解放済みポインターを含まない独立した要素識別を受け取ります。
   * @ko 해제한 포인터가 없는 독립 요소 식별자를 받습니다.
   * @param attachment - Copied element identity.
   * @zh attachment - 复制的元素标识。
   * @ja attachment - コピーした要素識別。
   * @ko attachment - 복사한 요소 식별자입니다.
   */
  (attachment: Readonly<EventListenerAttachment>): void;
}

/**
 * Native Rml::EventListener supporting multiple dispatcher attachments.
 *
 * @zh 支持多个派发器挂载的原生 Rml::EventListener。
 * @ja 複数の登録に対応するネイティブ Rml::EventListener。
 * @ko 여러 등록을 지원하는 네이티브 Rml::EventListener입니다.
 * @remarks
 * Pass the same listener to Element.addEventListener/removeEventListener.
 * Attach/detach hooks run once per actual native registration at the outer
 * boundary, using copied identities so destruction never exposes dying
 * elements. Detached element/callback cycles are collectible. Shutdown
 * invalidates every listener. Manual hook methods deliver notifications;
 * actual registration always uses Element's dispatcher operations.
 * @zh 将同一监听器传给 Element 的挂载/解绑方法。每个真实原生注册
 * 在外层调用边界通知一次挂载/解绑；使用标识副本避免暴露销毁中的元素。
 * 脱离元素树的元素/回调循环可回收。关闭运行时使所有监听器失效。
 * 手动钩子方法仅发送通知；真实注册使用 Element 的派发器操作。
 * @ja 同じリスナーを Element の登録・解除に渡します。実際の登録ごとに
 * 外側境界で一度通知し、コピーした識別で破棄中の要素を保護します。
 * 分離した要素と関数の循環は回収可能。終了ですべて無効になります。
 * 手動フックは通知のみ。実際の登録は Element の操作を使います。
 * @ko 같은 리스너를 Element 등록과 해제에 전달합니다. 실제 등록마다
 * 외부 경계에서 한 번 알리며 복사한 식별자로 파괴 중인 요소를 보호합니다.
 * 분리한 요소와 콜백 순환은 회수 가능합니다. 종료 시 모두 무효화됩니다.
 * 수동 훅은 알림만 전달하고 실제 등록은 Element 작업을 사용합니다.
 */
export class EventListener {
  /**
   * Create a listener with native event and optional lifecycle callbacks.
   *
   * @zh 创建包含原生事件及可选生命周期回调的监听器。
   * @ja イベント関数と任意のライフサイクル関数でリスナーを作ります。
   * @ko 이벤트와 선택적 생명주기 콜백으로 리스너를 생성합니다.
   * @param process - Handle a scoped native event.
   * @zh process - 处理具有借用期限的原生事件。
   * @ja process - 有効期限付きのネイティブイベントを処理します。
   * @ko process - 유효 기간이 있는 네이티브 이벤트를 처리합니다.
   * @param attach - Receive native attachment notifications.
   * @zh attach - 接收原生挂载通知。
   * @ja attach - ネイティブ登録の通知を受け取ります。
   * @ko attach - 네이티브 등록 알림을 받습니다.
   * @param detach - Receive native detachment notifications.
   * @zh detach - 接收原生解绑通知。
   * @ja detach - ネイティブ解除の通知を受け取ります。
   * @ko detach - 네이티브 해제 알림을 받습니다.
   */
  constructor(
    process: RmlEventListener, attach?: EventListenerHook,
    detach?: EventListenerHook,
  ) {
    if (typeof process !== 'function' ||
        (attach !== undefined && typeof attach !== 'function') ||
        (detach !== undefined && typeof detach !== 'function')) {
      throw new TypeError('Expected event listener callbacks');
    }
    const handle = native.createEventListener(
      event => process(new RmlEvent(event)), attach, detach);
    handles.set(this, handle);
    wrappers.set(handle, new WeakRef(this));
  }

  /**
   * Invoke native processing on a live event without dispatching it.
   *
   * @zh 对活跃事件调用原生处理，不进行派发。
   * @ja 有効なイベントを送信せずネイティブ処理します。
   * @ko 유효한 이벤트를 발송하지 않고 네이티브 처리합니다.
   * @param event - Live owned event or active dispatch lease.
   * @zh event - 活跃自有事件或派发中的借用事件。
   * @ja event - 所有イベントまたは送信中の借用イベント。
   * @ko event - 소유 이벤트 또는 발송 중 빌린 이벤트입니다.
   * @remarks
   * The callback receives a fresh expiring lease. Releasing or transferring
   * the source event, or recursively processing it, is rejected while active.
   * @zh 回调收到新的限期借用句柄。处理期间禁止释放、转移或递归处理源事件。
   * @ja 関数には新しい期限付き借用を渡し、処理中の解放・移転・再帰を拒否します。
   * @ko 콜백에는 새 임시 핸들을 전달하며 처리 중 해제, 이전, 재귀를 거부합니다.
   */
  processEvent(event: RmlEvent): void {
    native.eventListenerProcessEvent(
      eventListenerHandle(this), eventHandle(event));
  }

  /**
   * Deliver the native OnAttach notification without registering an event.
   *
   * @zh 发送原生 OnAttach 通知，不注册事件。
   * @ja イベント登録なしで OnAttach 通知を届けます。
   * @ko 이벤트 등록 없이 OnAttach 알림을 전달합니다.
   * @param element - Live element whose identity is copied.
   * @zh element - 标识将被复制的活跃元素。
   * @ja element - 識別をコピーする有効な要素。
   * @ko element - 식별자를 복사할 유효 요소입니다.
   */
  onAttach(element: Element): void {
    native.eventListenerNotifyHook(
      eventListenerHandle(this), element.handle, true);
  }

  /**
   * Deliver the native OnDetach notification without unregistering an event.
   *
   * @zh 发送原生 OnDetach 通知，不解绑事件。
   * @ja イベント解除なしで OnDetach 通知を届けます。
   * @ko 이벤트 해제 없이 OnDetach 알림을 전달합니다.
   * @param element - Live element whose identity is copied.
   * @zh element - 标识将被复制的活跃元素。
   * @ja element - 識別をコピーする有効な要素。
   * @ko element - 식별자를 복사할 유효 요소입니다.
   */
  onDetach(element: Element): void {
    native.eventListenerNotifyHook(
      eventListenerHandle(this), element.handle, false);
  }

  /**
   * Destroy a detached, inactive native listener and expire its handle.
   *
   * @zh 销毁已解绑且不活动的原生监听器，使其句柄失效。
   * @ja 解除済みで処理中でないリスナーを破棄し、ハンドルを無効化します。
   * @ko 해제한 비활성 리스너를 파괴하고 핸들을 만료합니다.
   */
  release(): void {
    native.releaseEventListener(eventListenerHandle(this));
  }
}

/**
 * Resolve an authentic public listener.
 *
 * @internal
 * @param value - Public listener.
 * @returns Native handle.
 */
export function eventListenerHandle(value: EventListener): object {
  const handle = handles.get(value);
  if (!handle) {
    throw new TypeError('Expected an EventListener');
  }
  return handle;
}

/**
 * Wrap a native listener returned by its instancer.
 *
 * @internal
 * @param handle - Native listener handle or null.
 * @returns Identity-preserving facade or null.
 */
export function eventListenerFromNative(
  handle: object | null,
): EventListener | null {
  if (handle === null) {
    return null;
  }
  const existing = wrappers.get(handle)?.deref();
  if (existing) {
    return existing;
  }
  const result = Object.create(EventListener.prototype) as EventListener;
  handles.set(result, handle);
  wrappers.set(handle, new WeakRef(result));
  return result;
}
