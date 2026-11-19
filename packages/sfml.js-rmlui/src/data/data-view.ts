import { native } from '../internal/native';
import { Element } from '../dom/elements/element';
import { dataModelFromNative, type DataModelConstructor } from './data-model';

const handles = new WeakMap<DataView, object>();
const wrappers = new WeakMap<object, WeakRef<DataView>>();

/**
 * Initialization of a real Rml::DataView or Rml::DataController.
 *
 * @zh 真实 Rml::DataView 或 Rml::DataController 的初始化回调。
 * @ja 実際の Rml::DataView または Rml::DataController の初期化関数。
 * @ko 실제 Rml::DataView 또는 Rml::DataController의 초기화 콜백입니다.
 */
export interface DataBindingInitialize {
  /**
   * Initialize the native binding, returning its success result.
   *
   * @zh 初始化原生绑定，返回成功结果。
   * @ja ネイティブバインドを初期化し、成功を返します。
   * @ko 네이티브 바인딩을 초기화하고 성공 여부를 반환합니다.
   * @param model - Checked facade of the actual native callback model.
   * @zh model - 实际原生回调模型的受检接口。
   * @ja model - 実際のコールバックモデルの検証済みインターフェース。
   * @ko model - 실제 콜백 모델의 검증된 인터페이스입니다.
   * @param element - Element declaring the data attribute.
   * @zh element - 声明 data 属性的元素。
   * @ja element - data 属性を宣言する要素。
   * @ko element - data 속성을 선언하는 요소입니다.
   * @param expression - Exact data attribute value.
   * @zh expression - 确切的 data 属性值。
   * @ja expression - 正確な data 属性値。
   * @ko expression - 정확한 data 속성값입니다.
   * @param modifier - Suffix of the attribute after its binding type.
   * @zh modifier - 属性绑定类型之后的后缀。
   * @ja modifier - 属性のバインド型に続く接尾辞。
   * @ko modifier - 속성 바인딩 타입 뒤의 접미사입니다.
   * @returns True to accept the binding, false to reject it.
   * @zh 接受绑定返回 true，拒绝返回 false。
   * @ja 受け入れは true、拒否は false。
   * @ko 허용하면 true이며 거부하면 false입니다.
   */
  (
    model: DataModelConstructor, element: Element,
    expression: string, modifier: string,
  ): boolean;
}

/**
 * Native data-binding release notification at a safe outer call boundary.
 *
 * @zh 原生数据绑定在安全外层调用边界发送的释放通知。
 * @ja 安全な外側呼び出し境界で受け取るバインドの解放通知。
 * @ko 안전한 외부 호출 경계에서 받는 바인딩 해제 알림입니다.
 * @remarks
 * No dying native pointer is passed. Captured elements may already be invalid.
 * Notifications are skipped after an earlier exception or environment cleanup.
 * GC does not guarantee delivery for an unreferenced owned instance.
 * @zh 不传递销毁中的原生指针；捕获的元素可能已经失效。
 * 已有异常或环境清理时跳过通知。无引用自有实例的 GC 不保证发送通知。
 * @ja 破棄中のポインターは渡しません。保持した要素は無効な場合があります。
 * 先行例外や環境終了時は通知せず、未参照の所有インスタンスの GC では保証しません。
 * @ko 파괴 중인 포인터를 전달하지 않으며 캡처한 요소는 무효할 수 있습니다.
 * 이전 예외나 환경 정리 시 알리지 않으며 미참조 소유 인스턴스의 GC는 보장하지 않습니다.
 */
export type DataBindingRelease = () => void;

/**
 * Virtual operations of a native Rml::DataView.
 *
 * @zh 原生 Rml::DataView 的虚方法。
 * @ja ネイティブ Rml::DataView の仮想操作。
 * @ko 네이티브 Rml::DataView의 가상 작업입니다.
 */
export interface DataViewCallbacks {
  /**
   * Initialize a view binding from its model, element and expression;
   * return whether to accept it.
   *
   * @zh 从模型、元素和表达式初始化视图绑定，返回是否接受绑定。
   * @ja モデル・要素・式からビューバインドを初期化し、受け入れるかを返します。
   * @ko 모델·요소·표현식으로 뷰 바인딩을 초기화하고 허용 여부를 반환합니다.
   */
  initialize: DataBindingInitialize;

  /**
   * Native Update; return whether this call changed the document.
   *
   * @zh 原生 Update；返回此次调用是否改变文档。
   * @ja ネイティブ Update。この呼び出しで文書が変化したかを返します。
   * @ko 네이티브 Update이며 이 호출이 문서를 변경했는지 반환합니다.
   * @param model - Actual native model being updated.
   * @zh model - 正在更新的实际原生模型。
   * @ja model - 更新対象の実際のネイティブモデル。
   * @ko model - 업데이트하는 실제 네이티브 모델입니다.
   * @returns Whether the document changed.
   * @zh 文档是否改变。
   * @ja 文書が変化したか。
   * @ko 문서 변경 여부입니다.
   */
  update(model: DataModelConstructor): boolean;

  /**
   * Root variable dependencies read by Core's native dirty-view scheduler.
   *
   * @zh Core 原生脏视图调度器读取的根变量依赖。
   * @ja Core の変更ビュー更新処理が読むルート変数の依存関係。
   * @ko Core의 변경 뷰 스케줄러가 읽는 루트 변수 의존성입니다.
   * @returns Independent string list of root variable names.
   * @zh 独立的根变量名称字符串列表。
   * @ja ルート変数名の独立した文字列一覧。
   * @ko 독립된 루트 변수 이름 문자열 목록입니다.
   */
  getVariableNameList(): string[];

  /**
   * Notification after native Release, including rejected initialization.
   *
   * @zh 原生 Release 后的通知，包含初始化被拒绝的情况。
   * @ja 初期化の拒否を含むネイティブ Release 後の通知。
   * @ko 초기화 거부를 포함한 네이티브 Release 후 알림입니다.
   */
  release?: DataBindingRelease;
}

/**
 * Owning or Core-borrowed handle to a real native Rml::DataView.
 *
 * @zh 真实原生 Rml::DataView 的自有或 Core 借用句柄。
 * @ja 実際の Rml::DataView を所有するか Core から借用するハンドル。
 * @ko 실제 Rml::DataView를 소유하거나 Core에서 빌리는 핸들입니다.
 * @remarks
 * RML instancing transfers unique native ownership to Core. Core schedules
 * dependencies, depth and sort order; JS supplies only the virtual operations.
 * Manual initialize/update does not add a view to the model scheduler.
 * Destruction, recursive callbacks and active release are checked.
 * @zh RML 实例化将原生唯一所有权转交 Core。依赖、深度和顺序由 Core 调度，
 * JS 只提供虚方法。手动初始化或更新不会加入模型调度器。
 * 销毁、回调递归和活动期间释放均受检查。
 * @ja RML の生成は唯一の所有権を Core に移します。依存・深さ・順序は Core が
 * 管理し、JS は仮想操作のみを提供します。手動操作は更新処理に登録しません。
 * 破棄、再帰、処理中の解放を検証します。
 * @ko RML 생성은 유일한 소유권을 Core에 이전합니다. 의존성, 깊이, 순서는 Core가
 * 관리하고 JS는 가상 작업만 제공합니다. 수동 작업은 스케줄러에 등록하지 않습니다.
 * 파괴, 재귀, 처리 중 해제를 검사합니다.
 */
export class DataView {
  /**
   * Create an owned native view with a depth-relative sorting offset.
   *
   * @zh 创建自有原生视图，并指定相对元素深度的排序偏移。
   * @ja 所有するビューを要素深度に対する順序のオフセットで作ります。
   * @ko 요소 깊이에 대한 정렬 오프셋으로 소유 뷰를 생성합니다.
   * @param element - Live attached element.
   * @zh element - 活跃的关联元素。
   * @ja element - 有効な関連要素。
   * @ko element - 유효한 연결 요소입니다.
   * @param callbacks - Actual native virtual operations.
   * @zh callbacks - 实际原生虚方法。
   * @ja callbacks - 実際のネイティブ仮想操作。
   * @ko callbacks - 실제 네이티브 가상 작업입니다.
   * @param sortOffset - Integer in [-1000, 999], default 0; lower runs first.
   * @zh sortOffset - [-1000, 999] 范围内整数；较小值先更新。
   * @ja sortOffset - [-1000, 999] の整数。小さい値から更新します。
   * @ko sortOffset - [-1000, 999] 정수이며 작은 값부터 업데이트합니다.
   */
  constructor(element: Element, callbacks: DataViewCallbacks, sortOffset = 0) {
    const { initialize, update, getVariableNameList, release } = callbacks;
    if (typeof initialize !== 'function' || typeof update !== 'function' ||
        typeof getVariableNameList !== 'function' ||
        (release !== undefined && typeof release !== 'function')) {
      throw new TypeError('Expected data view callbacks');
    }
    const handle = native.createDataView(element.handle,
      (model, attached, expression, modifier) => initialize(
        dataModelFromNative(model), Element.wrap(attached),
        expression, modifier),
      model => update(dataModelFromNative(model)),
      getVariableNameList, release, sortOffset);
    handles.set(this, handle);
    wrappers.set(handle, new WeakRef(this));
  }

  /**
   * Rml::DataView::IsValid, including native release and generation checks.
   *
   * @zh 对应 IsValid，同时检查原生释放及运行时代际。
   * @ja IsValid に加えネイティブ解放と世代を検証します。
   * @ko IsValid와 네이티브 해제 및 세대를 검사합니다.
   * @returns Whether the native instance and attached element are alive.
   * @zh 原生实例及关联元素是否仍然存活。
   * @ja ネイティブインスタンスと要素が有効か。
   * @ko 네이티브 인스턴스와 연결 요소의 유효 여부입니다.
   */
  get isValid(): boolean {
    return native.dataViewIsValid(dataViewHandle(this));
  }

  /**
   * Read the real native depth and sort offset with GetSortOrder.
   *
   * @zh 使用 GetSortOrder 读取真实原生深度及排序偏移。
   * @ja GetSortOrder で実際の深度と順序のオフセットを読みます。
   * @ko GetSortOrder로 실제 깊이 및 정렬 오프셋을 읽습니다.
   * @returns Native combined sort order.
   * @zh 原生合成排序值。
   * @ja ネイティブの合成された順序。
   * @ko 네이티브 합성 정렬값입니다.
   */
  get sortOrder(): number {
    return native.dataViewSortOrder(dataViewHandle(this));
  }

  /**
   * Rml::DataView::GetElement; null when the observed element was destroyed.
   *
   * @zh 对应 GetElement；观察的元素销毁后返回 null。
   * @ja GetElement。関連要素の破棄後は null。
   * @ko GetElement이며 관찰 요소 파괴 후 null입니다.
   * @returns Canonical attached element, or null.
   * @zh 关联元素的唯一包装或 null。
   * @ja 一意の関連要素または null。
   * @ko 고유 연결 요소 또는 null입니다.
   */
  getElement(): Element | null {
    const handle = native.dataViewGetElement(dataViewHandle(this));
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Initialize once with the attached element and a live native model.
   *
   * @zh 使用关联元素及活跃原生模型初始化一次。
   * @ja 関連要素と有効なモデルで一度初期化します。
   * @ko 연결 요소와 유효한 모델로 한 번 초기화합니다.
   * @param model - Native model whose expressions are used.
   * @zh model - 表达式使用的原生模型。
   * @ja model - 式が使用するネイティブモデル。
   * @ko model - 표현식이 사용할 네이티브 모델입니다.
   * @param element - Same element passed to the constructor.
   * @zh element - 与构造函数相同的元素。
   * @ja element - 生成時と同じ要素。
   * @ko element - 생성 시와 동일한 요소입니다.
   * @param expression - Native attribute expression.
   * @zh expression - 原生属性表达式。
   * @ja expression - ネイティブ属性式。
   * @ko expression - 네이티브 속성 표현식입니다.
   * @param modifier - Binding attribute suffix.
   * @zh modifier - 绑定属性后缀。
   * @ja modifier - バインド属性の接尾辞。
   * @ko modifier - 바인딩 속성 접미사입니다.
   * @returns Native initialization result.
   * @zh 原生初始化结果。
   * @ja ネイティブ初期化の結果。
   * @ko 네이티브 초기화 결과입니다.
   */
  initialize(
    model: DataModelConstructor, element: Element,
    expression: string, modifier: string,
  ): boolean {
    return native.dataViewInitialize(
      dataViewHandle(this), model.handle, element.handle, expression, modifier);
  }

  /**
   * Invoke actual Rml::DataView::Update without scheduler registration.
   *
   * @zh 调用实际 Update，不注册到调度器。
   * @ja 実際の Update を呼び、更新処理には登録しません。
   * @ko 실제 Update를 호출하며 스케줄러에 등록하지 않습니다.
   * @param model - Live native model.
   * @zh model - 活跃原生模型。
   * @ja model - 有効なネイティブモデル。
   * @ko model - 유효한 네이티브 모델입니다.
   * @returns Whether native Update changed the document.
   * @zh 原生 Update 是否改变文档。
   * @ja ネイティブ Update が文書を変更したか。
   * @ko 네이티브 Update의 문서 변경 여부입니다.
   */
  update(model: DataModelConstructor): boolean {
    return native.dataViewUpdate(dataViewHandle(this), model.handle);
  }

  /**
   * Copy native GetVariableNameList dependencies.
   *
   * @zh 复制原生 GetVariableNameList 依赖列表。
   * @ja ネイティブ GetVariableNameList の依存一覧をコピーします。
   * @ko 네이티브 GetVariableNameList 의존성 목록을 복사합니다.
   * @returns Native root variable names.
   * @zh 原生根变量名。
   * @ja ネイティブルート変数名。
   * @ko 네이티브 루트 변수 이름입니다.
   */
  getVariableNameList(): string[] {
    return native.dataViewVariableNames(dataViewHandle(this));
  }

  /**
   * Invoke native Release on an owned inactive view; Core ownership rejects it.
   *
   * @zh 对自有非活动视图调用原生 Release；Core 持有时拒绝。
   * @ja 非処理中の所有ビューを Release し、Core の所有中は拒否します。
   * @ko 비활성 소유 뷰를 Release하며 Core 소유 중에는 거부합니다.
   */
  release(): void {
    native.releaseDataView(dataViewHandle(this));
  }
}

/**
 * Resolve an authentic data view.
 *
 * @internal
 * @param value - Public view.
 * @returns Checked native handle.
 */
export function dataViewHandle(value: DataView): object {
  const handle = handles.get(value);
  if (!handle) {
    throw new TypeError('Expected a DataView');
  }
  return handle;
}

/**
 * Wrap the actual Factory-owned result, preserving facade identity.
 *
 * @internal
 * @param handle - Native owner or null.
 * @returns View facade or null.
 */
export function dataViewFromNative(handle: object | null): DataView | null {
  if (handle === null) {
    return null;
  }
  const existing = wrappers.get(handle)?.deref();
  if (existing) {
    return existing;
  }
  const result = Object.create(DataView.prototype) as DataView;
  handles.set(result, handle);
  wrappers.set(handle, new WeakRef(result));
  return result;
}
