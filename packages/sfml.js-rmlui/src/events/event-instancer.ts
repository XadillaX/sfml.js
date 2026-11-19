import { native } from '../internal/native';
import { variantToNative } from '../internal/animation-values';
import { Element } from '../dom/elements/element';
import {
  RmlEvent, eventHandle, eventParametersFromNative,
} from './event';
import type { VariantValue } from '../values/types';

const handles = new WeakMap<EventInstancer, object>();

/**
 * Event identity copied before native release.
 *
 * @zh 原生释放前复制的事件标识。
 * @ja ネイティブ解放前にコピーしたイベント識別。
 * @ko 네이티브 해제 전에 복사한 이벤트 식별자입니다.
 */
export interface EventReleaseSnapshot {
  /**
   * Native event type.
   *
   * @zh 原生事件类型。
   * @ja ネイティブイベント型。
   * @ko 네이티브 이벤트 유형입니다.
   */
  type: string;

  /**
   * Native event id.
   *
   * @zh 原生事件编号。
   * @ja ネイティブイベント ID。
   * @ko 네이티브 이벤트 ID입니다.
   */
  id: number;
}

/**
 * Delegate event allocation to another EventInstancer.
 *
 * @zh 将事件分配委派给另一 EventInstancer。
 * @ja 別の EventInstancer にイベント生成を委譲します。
 * @ko 다른 EventInstancer에 이벤트 생성을 위임합니다.
 */
export interface EventInstanceCallback {
  /**
   * Allocate with the requested target, id, type and interruptible flag.
   *
   * @zh 按请求的目标、编号、类型和中断标志分配。
   * @ja 要求された対象、ID、型、中断フラグで生成します。
   * @ko 요청한 대상, ID, 유형과 중단 플래그로 생성합니다.
   * @param target - Live target element.
   * @zh target - 活跃目标元素。
   * @ja target - 有効な対象要素。
   * @ko target - 유효한 대상 요소입니다.
   * @param id - Registered native event id.
   * @zh id - 已注册的原生事件编号。
   * @ja id - 登録されたネイティブイベント ID。
   * @ko id - 등록한 네이티브 이벤트 ID입니다.
   * @param type - Native event type.
   * @zh type - 原生事件类型。
   * @ja type - ネイティブイベント型。
   * @ko type - 네이티브 이벤트 유형입니다.
   * @param parameters - Typed native parameter copy.
   * @zh parameters - 有类型的原生参数副本。
   * @ja parameters - 型付きネイティブパラメーターのコピー。
   * @ko parameters - 타입 네이티브 매개변수 복사본입니다.
   * @param interruptible - Native propagation interruption flag.
   * @zh interruptible - 原生传播中断标志。
   * @ja interruptible - ネイティブ伝播中断フラグ。
   * @ko interruptible - 네이티브 전파 중단 플래그입니다.
   * @returns Owned allocation, or null to decline dispatch.
   * @zh 自有分配；null 拒绝派发。
   * @ja 所有割当。null は送信を拒否します。
   * @ko 소유 할당이며 null은 발송을 거부합니다.
   */
  (
    target: Element, id: number, type: string,
    parameters: Readonly<Record<string, VariantValue>>, interruptible: boolean,
  ): RmlEvent | null;
}

/**
 * Observe native event destruction after its active stack returns.
 *
 * @zh 原生事件的活动调用栈返回后观察其销毁。
 * @ja ネイティブイベントの処理完了後に破棄を受け取ります。
 * @ko 네이티브 이벤트 처리 완료 후 파괴를 관찰합니다.
 */
export interface EventReleaseCallback {
  /**
   * Receive copied type and id without a released native pointer.
   *
   * @zh 接收类型及编号副本，不包含已释放的原生指针。
   * @ja 解放済みポインターを含まない型と ID のコピーを受け取ります。
   * @ko 해제한 포인터가 없는 유형과 ID 복사본을 받습니다.
   * @param snapshot - Independent event identity.
   * @zh snapshot - 独立事件标识。
   * @ja snapshot - 独立したイベント識別。
   * @ko snapshot - 독립 이벤트 식별자입니다.
   */
  (snapshot: EventReleaseSnapshot): void;
}

/**
 * Native Rml::EventInstancer with checked allocation and release.
 *
 * @zh 具有受检查分配及释放的原生 Rml::EventInstancer。
 * @ja 検証付き生成と解放を持つネイティブ Rml::EventInstancer。
 * @ko 검사된 생성과 해제를 가진 네이티브 Rml::EventInstancer입니다.
 * @remarks
 * Omit create for native construction. Custom callbacks return another
 * instancer's owned event; ownership transfers and the returned source handle
 * expires. Factory registration intercepts real native dispatch. Registered
 * adapters survive replacement until shutdown. Release notifications execute
 * after native deletion at a safe boundary; environment cleanup invokes no JS.
 * Owned events reject operations if target, current or parameter elements die.
 * Snapshot fields remain readable after release, as with callback events.
 * @zh 省略 create 时使用原生构造。自定义回调返回另一实例器的自有事件，
 * 转移所有权后源句柄失效。Factory 注册会拦截真实原生派发。
 * 已注册适配器（包括被替换者）保活至关闭。在原生删除后的安全边界通知释放；
 * 环境清理不调用 JS。目标、当前元素或参数元素销毁后，自有事件拒绝操作。
 * 与回调事件相同，释放后快照字段仍可读取。
 * @ja create 省略時はネイティブ生成。カスタム関数は別生成器の所有イベントを
 * 返し、所有権移転で元のハンドルは無効になります。Factory 登録は実際の
 * ネイティブ送信を扱います。置換済みの登録生成器も終了まで保持します。
 * 削除後の安全境界で解放を通知し、環境終了時は JS を呼びません。
 * 参照要素の破棄後は操作を拒否し、解放後もコピーしたフィールドは読めます。
 * @ko create를 생략하면 네이티브 생성입니다. 사용자 콜백은 다른 생성기의
 * 소유 이벤트를 반환하며 소유권 이전 후 원본 핸들은 만료됩니다. Factory 등록은
 * 실제 네이티브 발송을 처리합니다. 교체한 등록 생성기도 종료까지 유지합니다.
 * 삭제 후 안전한 경계에서 해제를 알리며 환경 정리에서는 JS를 호출하지 않습니다.
 * 참조 요소가 파괴되면 작업을 거부하고 해제 후에도 복사한 필드는 읽을 수 있습니다.
 */
export class EventInstancer {
  /**
   * Create a native allocator or callback adapter.
   *
   * @zh 创建原生分配器或回调适配器。
   * @ja ネイティブ生成器またはコールバックを作ります。
   * @ko 네이티브 생성기 또는 콜백을 생성합니다.
   * @param create - Delegate native allocation, or omit.
   * @zh create - 委派原生分配；可省略。
   * @ja create - ネイティブ生成の委譲。省略可能。
   * @ko create - 네이티브 생성 위임이며 생략할 수 있습니다.
   * @param release - Observe completed native release.
   * @zh release - 观察已完成的原生释放。
   * @ja release - 完了したネイティブ解放の通知。
   * @ko release - 완료한 네이티브 해제 관찰자입니다.
   */
  constructor(
    create?: EventInstanceCallback,
    release?: EventReleaseCallback,
  ) {
    if ((create !== undefined && typeof create !== 'function') ||
        (release !== undefined && typeof release !== 'function') ||
        (create === undefined && release !== undefined)) {
      throw new TypeError('Expected event instancer callbacks');
    }
    const handle = native.createEventInstancer(create === undefined
      ? undefined : (target, id, type, parameters, interruptible) => {
        const result = create(Element.wrap(target), id, type,
          eventParametersFromNative(parameters), interruptible);
        return result === null ? null : eventHandle(result as RmlEvent);
      }, release);
    handles.set(this, handle);
  }

  /**
   * Invoke Rml::EventInstancer::InstanceEvent with native ownership.
   *
   * @zh 调用 InstanceEvent，保留原生所有权。
   * @ja ネイティブ所有権付きで InstanceEvent を呼びます。
   * @ko 네이티브 소유권으로 InstanceEvent를 호출합니다.
   * @param target - Live target element.
   * @zh target - 活跃目标元素。
   * @ja target - 有効な対象要素。
   * @ko target - 유효한 대상 요소입니다.
   * @param id - Registered native event id.
   * @zh id - 已注册的原生事件编号。
   * @ja id - 登録したネイティブイベント ID。
   * @ko id - 등록한 네이티브 이벤트 ID입니다.
   * @param type - Native event type.
   * @zh type - 原生事件类型。
   * @ja type - ネイティブイベント型。
   * @ko type - 네이티브 이벤트 유형입니다.
   * @param parameters - Typed native parameters.
   * @zh parameters - 有类型的原生参数。
   * @ja parameters - 型付きネイティブパラメーター。
   * @ko parameters - 타입 네이티브 매개변수입니다.
   * @param interruptible - Whether propagation can stop.
   * @zh interruptible - 传播能否停止。
   * @ja interruptible - 伝播を停止できるか。
   * @ko interruptible - 전파를 중단할 수 있는지 여부입니다.
   * @returns Owned event, or null if declined.
   * @zh 自有事件；拒绝时为 null。
   * @ja 所有イベント。拒否時は null。
   * @ko 소유 이벤트이며 거부하면 null입니다.
   */
  instanceEvent(
    target: Element, id: number, type: string,
    parameters: Readonly<Record<string, VariantValue>>, interruptible: boolean,
  ): RmlEvent | null {
    const result = native.eventInstancerInstanceEvent(
      eventInstancerHandle(this), target.handle, id, type,
      Object.fromEntries(Object.entries(parameters)
        .map(([ key, value ]) => [
          key, value instanceof Element ? value.handle : variantToNative(value),
        ])),
      interruptible);
    return result === null ? null : new RmlEvent(result);
  }

  /**
   * Release this exact instancer's live owned allocation.
   *
   * @zh 释放此确切实例器的活跃自有分配。
   * @ja この生成器の有効な所有割当を解放します。
   * @ko 이 생성기의 유효 소유 할당을 해제합니다.
   * @param event - Owned event; dispatch leases reject.
   * @zh event - 自有事件；拒绝派发借用事件。
   * @ja event - 所有イベント。送信中の借用は拒否します。
   * @ko event - 소유 이벤트이며 발송 중 빌린 이벤트는 거부합니다.
   */
  releaseEvent(event: RmlEvent): void {
    native.eventInstancerReleaseEvent(
      eventInstancerHandle(this), eventHandle(event));
  }
}

/**
 * Resolve an authentic instancer.
 *
 * @internal
 * @param value - Public instancer.
 * @returns Native handle.
 */
export function eventInstancerHandle(value: EventInstancer): object {
  const handle = handles.get(value);
  if (!handle) {
    throw new TypeError('Expected an EventInstancer');
  }
  return handle;
}
