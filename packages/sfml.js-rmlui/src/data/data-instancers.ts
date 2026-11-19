import { native } from '../internal/native';
import { Element } from '../dom/elements/element';
import { DataView, dataViewHandle, dataViewFromNative } from './data-view';
import {
  DataController, dataControllerHandle, dataControllerFromNative,
} from './data-controller';

const viewHandles = new WeakMap<DataViewInstancer, object>();
const controllerHandles = new WeakMap<DataControllerInstancer, object>();

/**
 * Allocate a view for the requesting element or decline with null.
 *
 * @zh 为请求元素分配视图；拒绝时返回 null。
 * @ja 要求元要素のビューを生成し、拒否は null。
 * @ko 요청 요소의 뷰를 생성하며 거부하면 null입니다.
 */
export interface DataViewInstanceCallback {
  /**
   * Return an owned view for the native requesting element.
   *
   * @zh 为原生请求元素返回自有视图。
   * @ja ネイティブ要求元要素の所有ビューを返します。
   * @ko 네이티브 요청 요소의 소유 뷰를 반환합니다.
   * @param element - Actual live requesting element.
   * @zh element - 实际活跃请求元素。
   * @ja element - 実際の有効な要求元要素。
   * @ko element - 실제 유효 요청 요소입니다.
   * @returns Owned view for this element, or null.
   * @zh 此元素的自有视图，或 null。
   * @ja この要素の所有ビュー、または null。
   * @ko 이 요소의 소유 뷰 또는 null입니다.
   */
  (element: Element): DataView | null;
}

/**
 * Allocate a controller for the requesting element or decline with null.
 *
 * @zh 为请求元素分配控制器；拒绝时返回 null。
 * @ja 要求元要素のコントローラーを生成し、拒否は null。
 * @ko 요청 요소의 컨트롤러를 생성하며 거부하면 null입니다.
 */
export interface DataControllerInstanceCallback {
  /**
   * Return an owned controller for the native requesting element.
   *
   * @zh 为原生请求元素返回自有控制器。
   * @ja ネイティブ要求元要素の所有コントローラーを返します。
   * @ko 네이티브 요청 요소의 소유 컨트롤러를 반환합니다.
   * @param element - Actual live requesting element.
   * @zh element - 实际活跃请求元素。
   * @ja element - 実際の有効な要求元要素。
   * @ko element - 실제 유효 요청 요소입니다.
   * @returns Owned controller for this element, or null.
   * @zh 此元素的自有控制器，或 null。
   * @ja この要素の所有コントローラー、または null。
   * @ko 이 요소의 소유 컨트롤러 또는 null입니다.
   */
  (element: Element): DataController | null;
}

/**
 * Real Rml::DataViewInstancer used by the RML parser and Factory.
 *
 * @zh RML 解析器及 Factory 使用的真实 Rml::DataViewInstancer。
 * @ja RML パーサーと Factory が使う実際の Rml::DataViewInstancer。
 * @ko RML 해석기와 Factory가 사용하는 실제 Rml::DataViewInstancer입니다.
 * @remarks
 * Accepted registrations retain callbacks through shutdown. Native instancing
 * transfers a unique owner once; expired, already transferred or wrong-element
 * results throw. Delegation to Factory's defaults preserves native behavior.
 * @zh 被接受的注册将回调保活至关闭。原生实例化转交唯一持有者；
 * 过期、已转交或元素不匹配的结果会抛出异常。默认 Factory 委派保留原生行为。
 * @ja 受理した登録は終了まで関数を保持します。生成は唯一の所有者を移し、
 * 無効・移転済み・別要素の結果は例外です。既定 Factory への委譲は動作を保持します。
 * @ko 허용한 등록은 종료까지 콜백을 유지합니다. 생성은 유일한 소유자를 이전하며
 * 만료, 이전 완료, 다른 요소의 결과는 예외입니다. 기본 Factory 위임은 동작을 유지합니다.
 */
export class DataViewInstancer {
  /**
   * Create a native view allocator.
   *
   * @zh 创建原生视图分配器。
   * @ja ネイティブビュー生成器を作ります。
   * @ko 네이티브 뷰 생성기를 생성합니다.
   * @param create - Return an owned native view or null.
   * @zh create - 返回自有原生视图或 null。
   * @ja create - 所有するネイティブビューまたは null を返します。
   * @ko create - 소유 네이티브 뷰 또는 null을 반환합니다.
   */
  constructor(create: DataViewInstanceCallback) {
    if (typeof create !== 'function') {
      throw new TypeError('Expected a data view instancer callback');
    }
    viewHandles.set(this, native.createDataViewInstancer(element => {
      const result = create(Element.wrap(element));
      return result === null ? null : dataViewHandle(result);
    }));
  }

  /**
   * Invoke InstanceView directly, returning ownership to the caller.
   *
   * @zh 直接调用 InstanceView，将所有权返回调用方。
   * @ja InstanceView を直接呼び、所有権を呼び出し側に返します。
   * @ko InstanceView를 직접 호출하여 소유권을 호출자에게 반환합니다.
   * @param element - Actual requesting element.
   * @zh element - 实际请求元素。
   * @ja element - 実際の要求元要素。
   * @ko element - 실제 요청 요소입니다.
   * @returns Owned view or null; not registered with the model scheduler.
   * @zh 自有视图或 null；不注册到模型调度器。
   * @ja 所有ビューまたは null。モデル更新処理には登録しません。
   * @ko 소유 뷰 또는 null이며 모델 스케줄러에 등록하지 않습니다.
   */
  instanceView(element: Element): DataView | null {
    return dataViewFromNative(native.dataViewInstancerInstance(
      dataViewInstancerHandle(this), element.handle));
  }
}

/**
 * Real Rml::DataControllerInstancer for native RML controllers.
 *
 * @zh 原生 RML 控制器的真实 Rml::DataControllerInstancer。
 * @ja ネイティブ RML コントローラーの実際の生成器。
 * @ko 네이티브 RML 컨트롤러의 실제 생성기입니다.
 * @remarks
 * First accepted registration retains its callback until shutdown. Returned
 * instances transfer unique native ownership to Core during RML parsing.
 * @zh 首次被接受的注册保活回调至关闭。RML 解析将返回实例的原生唯一所有权交给 Core。
 * @ja 最初に受理した登録は終了まで関数を保持し、RML 解析は所有権を Core に移します。
 * @ko 처음 허용한 등록은 종료까지 콜백을 유지하며 RML 해석은 소유권을 Core에 이전합니다.
 */
export class DataControllerInstancer {
  /**
   * Create a native controller allocator.
   *
   * @zh 创建原生控制器分配器。
   * @ja ネイティブコントローラー生成器を作ります。
   * @ko 네이티브 컨트롤러 생성기를 생성합니다.
   * @param create - Return an owned native controller or null.
   * @zh create - 返回自有原生控制器或 null。
   * @ja create - 所有するネイティブコントローラーまたは null を返します。
   * @ko create - 소유 네이티브 컨트롤러 또는 null을 반환합니다.
   */
  constructor(create: DataControllerInstanceCallback) {
    if (typeof create !== 'function') {
      throw new TypeError('Expected a data controller instancer callback');
    }
    controllerHandles.set(this,
      native.createDataControllerInstancer(element => {
        const result = create(Element.wrap(element));
        return result === null ? null : dataControllerHandle(result);
      }));
  }

  /**
   * Invoke InstanceController, returning unique ownership to the caller.
   *
   * @zh 调用 InstanceController，将唯一所有权返回调用方。
   * @ja InstanceController を呼び、唯一の所有権を返します。
   * @ko InstanceController를 호출하여 유일한 소유권을 반환합니다.
   * @param element - Actual requesting element.
   * @zh element - 实际请求元素。
   * @ja element - 実際の要求元要素。
   * @ko element - 실제 요청 요소입니다.
   * @returns Owned controller or null, without automatic initialization.
   * @zh 自有控制器或 null，不自动初始化。
   * @ja 自動初期化しない所有コントローラー、または null。
   * @ko 자동 초기화하지 않은 소유 컨트롤러 또는 null입니다.
   */
  instanceController(element: Element): DataController | null {
    return dataControllerFromNative(native.dataControllerInstancerInstance(
      dataControllerInstancerHandle(this), element.handle));
  }
}

/**
 * Resolve an authentic view instancer.
 *
 * @internal
 * @param value - Public instancer.
 * @returns Checked native handle.
 */
export function dataViewInstancerHandle(value: DataViewInstancer): object {
  const handle = viewHandles.get(value);
  if (!handle) {
    throw new TypeError('Expected a DataViewInstancer');
  }
  return handle;
}

/**
 * Resolve an authentic controller instancer.
 *
 * @internal
 * @param value - Public instancer.
 * @returns Checked native handle.
 */
export function dataControllerInstancerHandle(
  value: DataControllerInstancer,
): object {
  const handle = controllerHandles.get(value);
  if (!handle) {
    throw new TypeError('Expected a DataControllerInstancer');
  }
  return handle;
}
