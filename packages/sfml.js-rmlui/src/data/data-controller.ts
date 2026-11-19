import { native } from '../internal/native';
import { Element } from '../dom/elements/element';
import { dataModelFromNative, type DataModelConstructor } from './data-model';
import type { DataBindingInitialize, DataBindingRelease } from './data-view';

const handles = new WeakMap<DataController, object>();
const wrappers = new WeakMap<object, WeakRef<DataController>>();

/**
 * Virtual operations of an actual Rml::DataController.
 *
 * @zh 实际 Rml::DataController 的虚方法。
 * @ja 実際の Rml::DataController の仮想操作。
 * @ko 실제 Rml::DataController의 가상 작업입니다.
 */
export interface DataControllerCallbacks {
  /**
   * Initialize the native controller, including event registration.
   *
   * @zh 初始化原生控制器，包含事件注册。
   * @ja イベント登録を含むネイティブコントローラーの初期化。
   * @ko 이벤트 등록을 포함한 네이티브 컨트롤러 초기화입니다.
   */
  initialize: DataBindingInitialize;

  /**
   * Safe notification after native Release for event cleanup.
   *
   * @zh 原生 Release 后用于事件清理的安全通知。
   * @ja イベント解除用のネイティブ Release 後の安全な通知。
   * @ko 이벤트 정리를 위한 네이티브 Release 후 안전한 알림입니다.
   */
  release?: DataBindingRelease;
}

/**
 * Checked owning or Core-borrowed Rml::DataController.
 *
 * @zh 受检查的自有或 Core 借用 Rml::DataController。
 * @ja 所有または Core から借用する検証済み Rml::DataController。
 * @ko 소유하거나 Core에서 빌리는 검증된 Rml::DataController입니다.
 * @remarks
 * RML transfers unique ownership to Core. Factory's default controllers
 * retain real native event behavior; manual initialization registers their
 * native listeners, and release detaches them. Custom initialization may
 * register host listeners; its release hook should remove those listeners.
 * Model removal, element destruction and shutdown invalidate borrowed owners.
 * @zh RML 将唯一所有权转交 Core。Factory 默认控制器保留真实原生事件行为，
 * 手动初始化会注册原生监听器，释放会解绑。自定义初始化可注册宿主监听器，
 * 应在释放钩子中移除。模型移除、元素销毁及关闭使借用持有者失效。
 * @ja RML は唯一の所有権を Core に移します。既定コントローラーは実際の
 * イベント処理を保持し、手動初期化で登録、解放で解除します。自作の関数で
 * 登録したホストリスナーは解放通知で解除します。削除と終了で借用は無効です。
 * @ko RML은 유일한 소유권을 Core에 이전합니다. 기본 컨트롤러는 실제 이벤트
 * 동작을 유지하며 수동 초기화에서 등록하고 해제 시 제거합니다. 사용자 정의
 * 호스트 리스너는 해제 훅에서 제거해야 합니다. 삭제와 종료 시 빌린 소유자가 무효화됩니다.
 */
export class DataController {
  /**
   * Create an owned native controller for a live element.
   *
   * @zh 为活跃元素创建自有原生控制器。
   * @ja 有効な要素に所有するネイティブコントローラーを作ります。
   * @ko 유효 요소의 소유 네이티브 컨트롤러를 생성합니다.
   * @param element - Attached native element.
   * @zh element - 关联的原生元素。
   * @ja element - 関連するネイティブ要素。
   * @ko element - 연결한 네이티브 요소입니다.
   * @param callbacks - Initialization and optional release notification.
   * @zh callbacks - 初始化及可选释放通知。
   * @ja callbacks - 初期化と任意の解放通知。
   * @ko callbacks - 초기화 및 선택적 해제 알림입니다.
   */
  constructor(element: Element, callbacks: DataControllerCallbacks) {
    const { initialize, release } = callbacks;
    if (typeof initialize !== 'function' ||
        (release !== undefined && typeof release !== 'function')) {
      throw new TypeError('Expected data controller callbacks');
    }
    const handle = native.createDataController(element.handle,
      (model, attached, expression, modifier) => initialize(
        dataModelFromNative(model), Element.wrap(attached),
        expression, modifier),
      undefined, undefined, release);
    handles.set(this, handle);
    wrappers.set(handle, new WeakRef(this));
  }

  /**
   * Rml::DataController::IsValid plus release and generation checks.
   *
   * @zh 对应 IsValid，并检查释放及运行时代际。
   * @ja IsValid に解放と世代の検証を加えます。
   * @ko IsValid와 해제 및 세대를 검사합니다.
   * @returns Whether the controller and attached element are alive.
   * @zh 控制器及关联元素是否仍存活。
   * @ja コントローラーと関連要素が有効か。
   * @ko 컨트롤러와 연결 요소의 유효 여부입니다.
   */
  get isValid(): boolean {
    return native.dataControllerIsValid(dataControllerHandle(this));
  }

  /**
   * Get the element associated with this data controller.
   *
   * @zh 获取与此数据控制器关联的元素。
   * @ja このデータコントローラーに関連する要素を取得します。
   * @ko 이 데이터 컨트롤러에 연결된 요소를 가져옵니다.
   * @returns Canonical element or null after element destruction.
   * @zh 唯一元素包装；元素销毁后为 null。
   * @ja 一意の要素。要素の破棄後は null。
   * @ko 고유 요소이며 요소 파괴 후 null입니다.
   */
  getElement(): Element | null {
    const handle = native.dataControllerGetElement(dataControllerHandle(this));
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Invoke Initialize once; manual default initialization attaches listeners.
   *
   * @zh 调用 Initialize 一次；默认实例手动初始化会挂载监听器。
   * @ja Initialize を一度呼び、手動の既定初期化はリスナーを登録します。
   * @ko Initialize를 한 번 호출하며 기본 수동 초기화는 리스너를 등록합니다.
   * @param model - Live native model.
   * @zh model - 活跃原生模型。
   * @ja model - 有効なネイティブモデル。
   * @ko model - 유효한 네이티브 모델입니다.
   * @param element - Same element supplied when instanced.
   * @zh element - 实例化时提供的相同元素。
   * @ja element - 生成時と同じ要素。
   * @ko element - 생성 시와 동일한 요소입니다.
   * @param expression - Native assignment expression.
   * @zh expression - 原生赋值表达式。
   * @ja expression - ネイティブ代入式。
   * @ko expression - 네이티브 대입 표현식입니다.
   * @param modifier - Native event or binding modifier.
   * @zh modifier - 原生事件或绑定修饰符。
   * @ja modifier - ネイティブイベントまたはバインド修飾子。
   * @ko modifier - 네이티브 이벤트 또는 바인딩 수정자입니다.
   * @returns Native initialization success.
   * @zh 原生初始化成功结果。
   * @ja ネイティブ初期化の成功。
   * @ko 네이티브 초기화 성공 여부입니다.
   */
  initialize(
    model: DataModelConstructor, element: Element,
    expression: string, modifier: string,
  ): boolean {
    return native.dataControllerInitialize(
      dataControllerHandle(this), model.handle,
      element.handle, expression, modifier);
  }

  /**
   * Release an owned inactive controller; rejects Core-owned controllers.
   *
   * @zh 释放自有非活动控制器；拒绝 Core 持有的控制器。
   * @ja 非処理中の所有コントローラーを解放し、Core 所有中は拒否します。
   * @ko 비활성 소유 컨트롤러를 해제하며 Core 소유 중에는 거부합니다.
   */
  release(): void {
    native.releaseDataController(dataControllerHandle(this));
  }
}

/**
 * Resolve an authentic controller.
 *
 * @internal
 * @param value - Public controller.
 * @returns Checked native handle.
 */
export function dataControllerHandle(value: DataController): object {
  const handle = handles.get(value);
  if (!handle) {
    throw new TypeError('Expected a DataController');
  }
  return handle;
}

/**
 * Preserve facade identity for a real Factory result.
 *
 * @internal
 * @param handle - Native owner or null.
 * @returns Controller facade or null.
 */
export function dataControllerFromNative(
  handle: object | null,
): DataController | null {
  if (handle === null) {
    return null;
  }
  const existing = wrappers.get(handle)?.deref();
  if (existing) {
    return existing;
  }
  const result = Object.create(DataController.prototype) as DataController;
  handles.set(result, handle);
  wrappers.set(handle, new WeakRef(result));
  return result;
}
