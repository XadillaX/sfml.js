import { native } from '../internal/native';
import { Element } from '../dom/elements/element';
import {
  EventListener, eventListenerFromNative, eventListenerHandle,
} from './event-listener';

const handles = new WeakMap<EventListenerInstancer, object>();

/**
 * Allocate a listener for an exact native inline attribute value.
 *
 * @zh 按确切的原生内联属性值分配监听器。
 * @ja 正確なネイティブ属性値に対してリスナーを生成します。
 * @ko 정확한 네이티브 속성값에 대해 리스너를 생성합니다.
 */
export interface EventListenerInstanceCallback {
  /**
   * Return a live listener or decline the inline binding.
   *
   * @zh 返回活跃监听器，或拒绝内联绑定。
   * @ja 有効なリスナーを返すか、インライン登録を拒否します。
   * @ko 유효한 리스너를 반환하거나 인라인 등록을 거부합니다.
   * @param value - Exact RML attribute string.
   * @zh value - 确切的 RML 属性字符串。
   * @ja value - 正確な RML 属性文字列。
   * @ko value - 정확한 RML 속성 문자열입니다.
   * @param element - Live element requesting the listener.
   * @zh element - 请求监听器的活跃元素。
   * @ja element - リスナーを要求する有効な要素。
   * @ko element - 리스너를 요청하는 유효한 요소입니다.
   * @returns Listener retained through all its attachments, or null.
   * @zh 保活至全部解绑的监听器；也可为 null。
   * @ja 全登録の解除まで保持するリスナー。または null。
   * @ko 모든 등록 해제까지 유지할 리스너 또는 null입니다.
   */
  (value: string, element: Element): EventListener | null;
}

/**
 * Rml::EventListenerInstancer adapter for real RML on* attributes.
 *
 * @zh 真实 RML on* 属性的 Rml::EventListenerInstancer 适配器。
 * @ja 実際の RML on* 属性に対応する生成器。
 * @ko 실제 RML on* 속성에 대응하는 생성기입니다.
 * @remarks
 * Values are passed unchanged and never evaluated as JavaScript. Registered
 * instancers survive until replacement or shutdown. Returned listeners remain
 * alive through their native attachments; shutdown invalidates both types.
 * @zh 属性值原样传递，不作为 JavaScript 执行。已注册实例器保活至替换或关闭。
 * 返回的监听器在原生挂载期间保活；关闭使两种对象均失效。
 * @ja 属性値をそのまま渡し JavaScript として評価しません。登録生成器は
 * 置換または終了まで保持します。リスナーは登録中保持し、終了で両方無効化します。
 * @ko 속성값을 그대로 전달하며 JavaScript로 평가하지 않습니다. 등록 생성기는
 * 교체나 종료까지 유지합니다. 리스너는 등록 중 유지하고 종료 시 모두 무효화합니다.
 */
export class EventListenerInstancer {
  /**
   * Create a checked native listener allocator.
   *
   * @zh 创建受检查的原生监听器分配器。
   * @ja 検証付きネイティブリスナー生成器を作ります。
   * @ko 검사된 네이티브 리스너 생성기를 생성합니다.
   * @param create - Native inline listener allocation callback.
   * @zh create - 原生内联监听器分配回调。
   * @ja create - インラインリスナーの生成関数。
   * @ko create - 인라인 리스너 생성 콜백입니다.
   */
  constructor(create: EventListenerInstanceCallback) {
    if (typeof create !== 'function') {
      throw new TypeError('Expected an event listener instancer callback');
    }
    handles.set(this, native.createEventListenerInstancer((value, element) => {
      const result = create(value, Element.wrap(element));
      return result === null ? null : eventListenerHandle(result);
    }));
  }

  /**
   * Invoke Rml::EventListenerInstancer::InstanceEventListener directly.
   *
   * @zh 直接调用原生 InstanceEventListener。
   * @ja ネイティブ InstanceEventListener を直接呼びます。
   * @ko 네이티브 InstanceEventListener를 직접 호출합니다.
   * @param value - Exact inline attribute string.
   * @zh value - 确切的内联属性字符串。
   * @ja value - 正確なインライン属性文字列。
   * @ko value - 정확한 인라인 속성 문자열입니다.
   * @param element - Live requesting element.
   * @zh element - 活跃请求元素。
   * @ja element - 有効な要求元要素。
   * @ko element - 유효한 요청 요소입니다.
   * @returns Unattached listener or null; retain it until attachment.
   * @zh 尚未挂载的监听器或 null；挂载前须保留它。
   * @ja 未登録リスナーまたは null。登録まで保持してください。
   * @ko 미등록 리스너 또는 null이며 등록까지 유지해야 합니다.
   */
  instanceEventListener(value: string, element: Element): EventListener | null {
    return eventListenerFromNative(native.eventListenerInstancerInstance(
      eventListenerInstancerHandle(this), value, element.handle));
  }
}

/**
 * Resolve an authentic listener instancer.
 *
 * @internal
 * @param value - Public instancer.
 * @returns Native handle.
 */
export function eventListenerInstancerHandle(
  value: EventListenerInstancer,
): object {
  const handle = handles.get(value);
  if (!handle) {
    throw new TypeError('Expected an EventListenerInstancer');
  }
  return handle;
}
