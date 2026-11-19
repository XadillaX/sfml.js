import { native } from '../../internal/native';
import { variantToNative } from '../../internal/animation-values';
import { Element } from '../elements/element';
import { dataViewFromNative, type DataView } from '../../data/data-view';
import {
  dataControllerFromNative, type DataController,
} from '../../data/data-controller';
import {
  dataViewInstancerHandle, dataControllerInstancerHandle,
  type DataViewInstancer, type DataControllerInstancer,
} from '../../data/data-instancers';
import { Context } from '../../runtime/context';
import { Document } from './document';
import { RmlEvent } from '../../events/event';
import {
  EventInstancer, eventInstancerHandle,
} from '../../events/event-instancer';
import {
  eventListenerFromNative, type EventListener,
} from '../../events/event-listener';
import {
  EventListenerInstancer, eventListenerInstancerHandle,
} from '../../events/event-listener-instancer';
import type { VariantValue } from '../../values/types';
import {
  ContextInstancer, contextInstancerHandle,
} from '../../runtime/context-instancer';
import {
  renderManagerHandle, type RenderManager,
} from '../../rendering/render-manager';
import {
  textInputHandlerHandle, type TextInputHandler,
} from '../../platform/text-input-handler';
import type { AttributeValue } from './attributes';
import { Stream, streamHandle } from '../../io/stream';
import {
  containerFromNative, type StyleSheetContainer,
} from '../../style/properties/style-sheet';
import {
  ElementInstancer, elementInstancerFromNative, elementInstancerHandle,
} from '../elements/element-instancer';

/**
 * Checked Rml::Factory instancing, parsing and cache operations.
 *
 * @zh 受检查的 Rml::Factory 实例化、解析和缓存操作。
 * @ja 検証付き Rml::Factory の生成、解析、キャッシュ操作。
 * @ko 검사된 Rml::Factory 생성, 해석 및 캐시 작업입니다.
 * @remarks
 * Parsing is synchronous and consumes the stream at its current position.
 * Native instancers and translators run normally. Parsing and cache mutation
 * reject callback reentry. Shutdown invalidates returned native owners.
 * Stylesheets return null when no rules were parsed, and may return partially
 * parsed rules after native syntax diagnostics.
 * @zh 解析同步执行，并从流当前位置读取。正常调用原生实例器和翻译器。
 * 回调重入时拒绝解析及缓存变更。关闭运行时会使返回的原生持有者失效。
 * 未解析到规则时样式表返回 null；语法诊断后可能返回部分规则。
 * @ja 解析は同期でストリームの現在位置から読みます。通常の生成器と翻訳を使います。
 * コールバックからの再解析とキャッシュ変更は拒否します。終了で所有者は無効です。
 * 解析した規則がない場合は null。構文診断後に部分的な規則を返す場合があります。
 * @ko 해석은 동기식이며 스트림의 현재 위치부터 읽습니다. 일반 생성기와 번역기를
 * 사용합니다. 콜백 재진입에서 해석과 캐시 변경은 거부하며 종료 시 소유자가 무효화됩니다.
 * 해석한 규칙이 없으면 null이며 구문 진단 후 일부 규칙을 반환할 수 있습니다.
 */
export class Factory {
  /** @internal */
  private constructor() {}

  /**
   * Rml::Factory::RegisterDataViewInstancer; first registration wins.
   *
   * @zh 对应 RegisterDataViewInstancer；保留首次注册。
   * @ja RegisterDataViewInstancer。最初の登録を保持します。
   * @ko RegisterDataViewInstancer이며 최초 등록을 유지합니다.
   * @param instancer - Native allocator retained only if registered.
   * @zh instancer - 仅注册被接受时保活的原生分配器。
   * @ja instancer - 登録を受理した場合のみ保持するネイティブ生成器。
   * @ko instancer - 등록을 허용한 경우에만 유지하는 네이티브 생성기입니다.
   * @param name - Exact binding type; existing defaults cannot be replaced.
   * @zh name - 精确绑定类型；无法替换已有默认注册。
   * @ja name - 正確なバインド型。既定登録は置換できません。
   * @ko name - 정확한 바인딩 타입이며 기본 등록을 교체할 수 없습니다.
   * @param structural - Parse as a structural view; defaults to false.
   * @zh structural - 将绑定解析为结构视图。
   * @ja structural - バインドを構造ビューとして解析します。
   * @ko structural - 바인딩을 구조 뷰로 해석합니다.
   */
  static registerDataViewInstancer(
    instancer: DataViewInstancer, name: string, structural = false,
  ): void {
    native.factoryRegisterDataViewInstancer(
      dataViewInstancerHandle(instancer), name, structural);
  }

  /**
   * Invoke InstanceDataView and return an actual owning native view.
   *
   * @zh 调用 InstanceDataView，返回真实自有原生视图。
   * @ja InstanceDataView で実際の所有ネイティブビューを返します。
   * @ko InstanceDataView로 실제 소유 네이티브 뷰를 반환합니다.
   * @param name - Registered native view type.
   * @zh name - 已注册的原生视图类型。
   * @ja name - 登録したネイティブビュー型。
   * @ko name - 등록한 네이티브 뷰 타입입니다.
   * @param element - Live requesting element.
   * @zh element - 活跃请求元素。
   * @ja element - 有効な要求元要素。
   * @ko element - 유효한 요청 요소입니다.
   * @returns Owned view or null; manual use does not register scheduling.
   * @zh 自有视图或 null；手动使用不会注册原生调度。
   * @ja 所有ビューまたは null。手動使用は更新処理に登録しません。
   * @ko 소유 뷰 또는 null이며 수동 사용은 스케줄러에 등록하지 않습니다.
   */
  static instanceDataView(name: string, element: Element): DataView | null {
    return dataViewFromNative(
      native.factoryInstanceDataView(name, element.handle));
  }

  /**
   * Rml::Factory::RegisterDataControllerInstancer; first registration wins.
   *
   * @zh 对应 RegisterDataControllerInstancer；保留首次注册。
   * @ja RegisterDataControllerInstancer。最初の登録を保持します。
   * @ko RegisterDataControllerInstancer이며 최초 등록을 유지합니다.
   * @param instancer - Allocator retained only for accepted registration.
   * @zh instancer - 仅注册被接受时保活的原生分配器。
   * @ja instancer - 登録の受理時のみ保持するネイティブ生成器。
   * @ko instancer - 등록 허용 시에만 유지하는 네이티브 생성기입니다.
   * @param name - Exact native type, including "checked", "event" and "value".
   * @zh name - 精确原生类型，包含 checked、event 及 value。
   * @ja name - checked、event、value を含む正確なネイティブ型。
   * @ko name - checked, event, value를 포함한 정확한 네이티브 타입입니다.
   */
  static registerDataControllerInstancer(
    instancer: DataControllerInstancer, name: string,
  ): void {
    native.factoryRegisterDataControllerInstancer(
      dataControllerInstancerHandle(instancer), name);
  }

  /**
   * Invoke InstanceDataController and return the actual native owner.
   *
   * @zh 调用 InstanceDataController，返回实际原生持有者。
   * @ja InstanceDataController で実際のネイティブ所有者を返します。
   * @ko InstanceDataController로 실제 네이티브 소유자를 반환합니다.
   * @param name - Exact registered controller type.
   * @zh name - 精确已注册控制器类型。
   * @ja name - 正確な登録コントローラー型。
   * @ko name - 정확한 등록 컨트롤러 타입입니다.
   * @param element - Live requesting element.
   * @zh element - 活跃请求元素。
   * @ja element - 有効な要求元要素。
   * @ko element - 유효한 요청 요소입니다.
   * @returns Owned controller or null; Initialize attaches native listeners.
   * @zh 自有控制器或 null；Initialize 会挂载原生监听器。
   * @ja 所有コントローラーまたは null。Initialize はリスナーを登録します。
   * @ko 소유 컨트롤러 또는 null이며 Initialize는 리스너를 등록합니다.
   */
  static instanceDataController(
    name: string, element: Element,
  ): DataController | null {
    return dataControllerFromNative(
      native.factoryInstanceDataController(name, element.handle));
  }

  /**
   * Register the inline listener instancer until replacement or shutdown.
   *
   * @zh 注册原生内联监听器实例器，保活至替换或关闭。
   * @ja インライン生成器を置換または終了まで登録します。
   * @ko 인라인 생성기를 교체 또는 종료까지 등록합니다.
   * @param instancer - Inline attribute allocator, or null to disable.
   * @zh instancer - 内联属性分配器；null 禁用。
   * @ja instancer - インライン生成器。null は無効化します。
   * @ko instancer - 인라인 생성기이며 null은 비활성화합니다.
   */
  static registerEventListenerInstancer(
    instancer: EventListenerInstancer | null,
  ): void {
    native.factoryRegisterEventListenerInstancer(instancer === null
      ? null : eventListenerInstancerHandle(instancer));
  }

  /**
   * Invoke Rml::Factory::InstanceEventListener without attaching the result.
   *
   * @zh 调用 Factory::InstanceEventListener，不挂载返回结果。
   * @ja Factory::InstanceEventListener を呼び、結果を登録しません。
   * @ko Factory::InstanceEventListener를 호출하며 결과를 등록하지 않습니다.
   * @param value - Exact inline attribute value.
   * @zh value - 确切的内联属性值。
   * @ja value - 正確なインライン属性値。
   * @ko value - 정확한 인라인 속성값입니다.
   * @param element - Live requesting element.
   * @zh element - 活跃请求元素。
   * @ja element - 有効な要求元要素。
   * @ko element - 유효한 요청 요소입니다.
   * @returns Unattached listener or null if disabled or declined.
   * @zh 尚未挂载的监听器；禁用或拒绝时为 null。
   * @ja 未登録リスナー。無効または拒否時は null。
   * @ko 미등록 리스너이며 비활성화 또는 거부 시 null입니다.
   */
  static instanceEventListener(
    value: string, element: Element,
  ): EventListener | null {
    return eventListenerFromNative(
      native.factoryInstanceEventListener(value, element.handle));
  }

  /**
   * Register Rml::Factory's native event instancer through shutdown.
   *
   * @zh 注册 Factory 原生事件实例器，保活至关闭。
   * @ja Factory のイベント生成器を終了まで登録します。
   * @ko Factory 이벤트 생성기를 종료까지 등록합니다.
   * @param instancer - Adapter used by real native dispatch.
   * @zh instancer - 真实原生派发使用的适配器。
   * @ja instancer - 実際のネイティブ送信が使う生成器。
   * @ko instancer - 실제 네이티브 발송이 사용할 생성기입니다.
   */
  static registerEventInstancer(instancer: EventInstancer): void {
    native.factoryRegisterEventInstancer(eventInstancerHandle(instancer));
  }

  /**
   * Rml::Factory::InstanceEvent; return an owned, undispatched event.
   *
   * @zh 调用 InstanceEvent，返回尚未派发的自有事件。
   * @ja InstanceEvent で未送信の所有イベントを返します。
   * @ko InstanceEvent로 발송하지 않은 소유 이벤트를 반환합니다.
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
   * @param parameters - Typed parameter dictionary.
   * @zh parameters - 有类型的参数字典。
   * @ja parameters - 型付きパラメーター辞書。
   * @ko parameters - 타입 매개변수 사전입니다.
   * @param interruptible - Whether native propagation may stop.
   * @zh interruptible - 原生传播能否停止。
   * @ja interruptible - ネイティブ伝播を停止できるか。
   * @ko interruptible - 네이티브 전파 중단 가능 여부입니다.
   * @returns Owned event, or null if declined.
   * @zh 自有事件；拒绝时为 null。
   * @ja 所有イベント。拒否時は null。
   * @ko 소유 이벤트이며 거부하면 null입니다.
   */
  static instanceEvent(
    target: Element, id: number, type: string,
    parameters: Readonly<Record<string, VariantValue>>, interruptible: boolean,
  ): RmlEvent | null {
    const data = native.factoryInstanceEvent(target.handle, id, type,
      Object.fromEntries(Object.entries(parameters)
        .map(([ key, value ]) => [
          key, value instanceof Element ? value.handle : variantToNative(value),
        ])),
      interruptible);
    return data === null ? null : new RmlEvent(data);
  }

  /**
   * Register a native context instancer retained through runtime shutdown.
   *
   * @zh 注册原生上下文实例器，保活至运行时关闭。
   * @ja 終了まで保持するネイティブコンテキスト生成器を登録します。
   * @ko 종료까지 유지할 네이티브 컨텍스트 생성기를 등록합니다.
   * @param instancer - Adapter used by subsequent createContext calls.
   * @zh instancer - 后续 createContext 调用使用的适配器。
   * @ja instancer - 以後の createContext が使う生成器。
   * @ko instancer - 이후 createContext가 사용할 생성기입니다.
   */
  static registerContextInstancer(instancer: ContextInstancer): void {
    native.factoryRegisterContextInstancer(contextInstancerHandle(instancer));
  }

  /**
   * Invoke Rml::Factory::InstanceContext without Core registration.
   *
   * @zh 调用 InstanceContext，不进入 Core 注册表。
   * @ja Core 登録なしで InstanceContext を呼びます。
   * @ko Core 등록 없이 InstanceContext를 호출합니다.
   * @param name - Exact name passed to the selected native allocator.
   * @zh name - 传给选定原生分配器的精确名称。
   * @ja name - 選択したネイティブ生成器に渡す正確な名前。
   * @ko name - 선택한 네이티브 생성기에 전달할 정확한 이름입니다.
   * @param manager - Live render manager borrowed by the native context.
   * @zh manager - 原生上下文借用的活跃渲染管理器。
   * @ja manager - ネイティブコンテキストが借用する有効な描画管理オブジェクト。
   * @ko manager - 네이티브 컨텍스트가 빌릴 유효 렌더링 관리자입니다.
   * @param handler - Borrowed native text-input handler, or null.
   * @zh handler - 借用原生文本输入处理器，或 null。
   * @ja handler - 借用ネイティブ文字入力ハンドラー、または null。
   * @ko handler - 빌릴 네이티브 텍스트 입력 처리기 또는 null입니다.
   * @returns Owned context, or null if the allocator declines creation.
   * @zh 自有上下文；分配器拒绝创建时为 null。
   * @ja 所有コンテキスト。生成器が拒否した場合は null。
   * @ko 소유 컨텍스트이며 생성기가 거부하면 null입니다.
   * @remarks
   * Retains native default dimensions and density. Use setDimensions before
   * layout or rendering. Descendants retain the owner; remove releases it
   * without removing a registered context with the same name.
   * @zh 保留原生默认尺寸和密度。布局或渲染前调用 setDimensions。
   * 子节点保活持有者；remove 释放此上下文，不移除同名已注册上下文。
   * @ja 既定の寸法と密度を保持します。描画前に setDimensions を使います。
   * 子は所有者を保持し、remove は同名登録コンテキストを削除しません。
   * @ko 기본 크기와 밀도를 유지합니다. 렌더링 전에 setDimensions를 사용합니다.
   * 자식은 소유자를 유지하며 remove는 같은 이름의 등록 컨텍스트를 제거하지 않습니다.
   */
  static instanceContext(
    name: string, manager: RenderManager, handler: TextInputHandler | null,
  ): Context | null {
    const handle = native.factoryInstanceContext(
      name, renderManagerHandle(manager),
      handler === null ? null : textInputHandlerHandle(handler));
    return handle === null ? null : new Context(handle);
  }

  /**
   * Register a non-owning native element instancer, retained through shutdown.
   *
   * @zh 注册原生非自有元素实例器，保活至运行时关闭。
   * @ja 終了まで保持する非所有のネイティブ要素生成器を登録します。
   * @ko 종료까지 유지하는 비소유 네이티브 요소 생성기를 등록합니다.
   * @param name - Registration name, lowercased by native RmlUi.
   * @zh name - 注册名；原生 RmlUi 转为小写。
   * @ja name - 登録名。ネイティブ RmlUi が小文字に変換します。
   * @ko name - 등록 이름이며 네이티브 RmlUi가 소문자로 변환합니다.
   * @param instancer - Typed native adapter, or null to disable this name.
   * @zh instancer - 有类型的原生适配器；null 禁用此注册名。
   * @ja instancer - 型付きネイティブ生成器。null はこの名前を無効にします。
   * @ko instancer - 타입 네이티브 어댑터이며 null은 이 이름을 비활성화합니다.
   */
  static registerElementInstancer(
    name: string, instancer: ElementInstancer | null,
  ): void {
    native.factoryRegisterElementInstancer(
      name, instancer === null ? null : elementInstancerHandle(instancer));
  }

  /**
   * Read the exact native registration, falling back to "*" for unknown tags.
   *
   * @zh 读取精确原生注册；未知标签回退到 "*"。
   * @ja 正確な登録を取得し、未知のタグは "*" にフォールバックします。
   * @ko 정확한 네이티브 등록을 조회하며 알 수 없는 태그는 "*"로 대체합니다.
   * @param tag - Exact lookup key; unlike registration it is not lowercased.
   * @zh tag - 精确查找键；与注册不同，此处不转为小写。
   * @ja tag - 正確な検索キー。登録と異なり小文字に変換しません。
   * @ko tag - 정확한 검색 키이며 등록과 달리 소문자로 변환하지 않습니다.
   * @returns Canonical instancer or null if the fallback is absent.
   * @zh 唯一实例器包装；回退实例器不存在时为 null。
   * @ja 一意の生成器。フォールバックがない場合は null。
   * @ko 고유 생성기이며 대체 생성기가 없으면 null입니다.
   */
  static getElementInstancer(tag: string): ElementInstancer | null {
    const handle = native.factoryGetElementInstancer(tag);
    return handle === null ? null : elementInstancerFromNative(handle);
  }

  /**
   * Invoke Rml::Factory::InstanceElement without attaching the returned node.
   *
   * @zh 调用 InstanceElement，返回节点不会自动挂到父节点。
   * @ja InstanceElement を呼び、返す要素は親に追加しません。
   * @ko InstanceElement를 호출하며 반환한 노드를 부모에 연결하지 않습니다.
   * @param parent - Parent supplied to the native instancer, or null for roots.
   * @zh parent - 传给原生实例器的父节点；根节点使用 null。
   * @ja parent - 生成器に渡す親。ルートの場合は null。
   * @ko parent - 생성기에 전달할 부모이며 루트에는 null을 사용합니다.
   * @param instancer - Registered instancer name; "*" supplies the fallback.
   * @zh instancer - 已注册实例器名称；"*" 提供回退实例器。
   * @ja instancer - 登録された生成器名。"*" がフォールバックです。
   * @ko instancer - 등록된 생성기 이름이며 "*"가 대체 생성기입니다.
   * @param tag - Actual tag, independent of the instancer name.
   * @zh tag - 实际标签，与实例器名称相互独立。
   * @ja tag - 生成器名とは独立した実際のタグ。
   * @ko tag - 생성기 이름과 독립된 실제 태그입니다.
   * @param attributes - Owned Variant attributes applied by native Factory.
   * @zh attributes - 由原生 Factory 设置的自有 Variant 属性。
   * @ja attributes - ネイティブ Factory が設定する所有 Variant 属性。
   * @ko attributes - 네이티브 Factory가 설정할 소유 Variant 속성입니다.
   * @returns Owned detached element with native subtype, or null on failure.
   * @zh 保留原生子类型的自有游离元素；失败时为 null。
   * @ja ネイティブ派生型を持つ所有の切り離した要素。失敗時は null。
   * @ko 네이티브 하위 타입을 가진 소유 분리 요소이며 실패 시 null입니다.
   */
  static instanceElement(
    parent: Element | null, instancer: string, tag: string,
    attributes: Record<string, AttributeValue> = {},
  ): Element | null {
    const values = Object.fromEntries(Object.entries(attributes)
      .map(([ name, value ]) => [ name,
        value instanceof Element ? value.handle : variantToNative(value) ]));
    const handle = native.factoryInstanceElement(
      parent === null ? null : parent.handle, instancer, tag, values);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Translate, decode and append native text or RML elements to the parent.
   *
   * @zh 翻译、解码文本，并将原生文本或 RML 元素追加到父节点。
   * @ja 翻訳・復号したテキストまたは RML 要素を親に追加します。
   * @ko 번역과 디코딩 후 네이티브 텍스트 또는 RML 요소를 부모에 추가합니다.
   * @param parent - Element receiving parsed children.
   * @zh parent - 接收解析子节点的元素。
   * @ja parent - 解析した子を追加する要素。
   * @ko parent - 해석한 자식을 받을 요소입니다.
   * @param text - UTF-8 text, RML entities or RML markup.
   * @zh text - UTF-8 文本、RML 实体或 RML 标记。
   * @ja text - UTF-8 テキスト、RML エンティティまたはマークアップ。
   * @ko text - UTF-8 텍스트, RML 엔티티 또는 마크업입니다.
   * @returns Native parser result; whitespace adds no child.
   * @zh 原生解析结果；纯空白不会添加子节点。
   * @ja ネイティブ解析結果。空白だけなら子は追加しません。
   * @ko 네이티브 해석 결과이며 공백만 있으면 자식을 추가하지 않습니다.
   */
  static instanceElementText(parent: Element, text: string): boolean {
    return native.factoryInstanceElementText(parent.handle, text);
  }

  /**
   * Invoke Rml::Factory::InstanceElementStream to append parsed children.
   *
   * @zh 调用 InstanceElementStream，追加解析得到的子节点。
   * @ja InstanceElementStream を呼び、解析した子を追加します。
   * @ko InstanceElementStream을 호출하여 해석한 자식을 추가합니다.
   * @param parent - Receiving element; context roots are rejected.
   * @zh parent - 接收元素；拒绝上下文根节点。
   * @ja parent - 追加先の要素。コンテキストのルートは拒否します。
   * @ko parent - 수신 요소이며 컨텍스트 루트는 거부합니다.
   * @param stream - Open native stream with its own source URL.
   * @zh stream - 已打开的原生流，使用自身来源 URL。
   * @ja stream - 自身の参照元 URL を持つ開いたネイティブストリーム。
   * @ko stream - 자체 원본 URL을 가진 열린 네이티브 스트림입니다.
   * @returns Upstream result; host read errors throw. Syntax diagnostics can
   * leave partial children because RmlUi 6.3 returns true after parsing.
   * @zh 上游结果；宿主读取错误会抛出异常。RmlUi 6.3 解析后返回 true，
   * 因此语法诊断可能留下部分子节点。
   * @ja 上流の結果。ホスト読み取りエラーは例外です。6.3 は解析後 true を返すため、
   * 構文診断時に一部の子が残る場合があります。
   * @ko 상위 결과이며 호스트 읽기 오류는 예외입니다. 6.3은 해석 후 true를
   * 반환하므로 구문 진단 시 일부 자식이 남을 수 있습니다.
   */
  static instanceElementStream(parent: Element, stream: Stream): boolean {
    return native.factoryInstanceElementStream(
      parent.handle, streamHandle(stream));
  }

  /**
   * Parse an owned document without inserting it into the context.
   *
   * @zh 解析自有文档，不将其插入上下文。
   * @ja 所有する文書を解析し、コンテキストには追加しません。
   * @ko 소유 문서를 해석하며 컨텍스트에 삽입하지 않습니다.
   * @param context - Native context borrowed by the document.
   * @zh context - 文档借用的原生上下文。
   * @ja context - 文書が借用するネイティブコンテキスト。
   * @ko context - 문서가 빌리는 네이티브 컨텍스트입니다.
   * @param stream - Open stream consumed from its current position.
   * @zh stream - 从当前位置读取的已打开流。
   * @ja stream - 現在位置から読み取る開いたストリーム。
   * @ko stream - 현재 위치부터 읽는 열린 스트림입니다.
   * @param documentBaseTag - Registered native document instancer and tag.
   * @zh documentBaseTag - 已注册的原生文档实例器及标签。
   * @ja documentBaseTag - 登録済み文書生成器とタグ。
   * @ko documentBaseTag - 등록된 네이티브 문서 생성기 및 태그입니다.
   * @returns Detached document, or null when native creation fails.
   * @zh 游离文档；原生创建失败时为 null。
   * @ja 切り離した文書。生成失敗時は null。
   * @ko 분리 문서이며 네이티브 생성 실패 시 null입니다.
   * @remarks
   * Uses Rml::Factory::InstanceDocumentStream, including the stream source URL
   * and native document-header processing. It does not dispatch context load
   * notifications. The document owns its tree; descendants keep it alive.
   * Context removal or shutdown destroys this tree before releasing resources.
   * Host stream exceptions propagate; native syntax diagnostics may leave a
   * partial document, following RmlUi's parser result.
   * @zh 使用 InstanceDocumentStream，包含流来源 URL 及原生文档头处理。
   * 不派发上下文加载通知。文档持有整棵树，子节点使其保活。
   * 移除上下文或关闭时先销毁此树再释放资源。宿主流异常会传播；
   * 原生语法诊断可能按 RmlUi 解析结果返回部分文档。
   * @ja 参照元 URL と文書ヘッダー処理を含む InstanceDocumentStream を使います。
   * コンテキストの読込通知は送信しません。子は所有文書を保持します。
   * 削除と終了時は資源より先に木を破棄します。ストリーム例外は伝播し、
   * 構文診断後に部分的な文書を返す場合があります。
   * @ko 원본 URL과 문서 헤더 처리를 포함한 InstanceDocumentStream을 사용합니다.
   * 컨텍스트 로드 알림은 보내지 않습니다. 자식은 소유 문서를 유지합니다.
   * 제거와 종료 시 자원보다 먼저 트리를 파괴합니다. 스트림 예외는 전파되며
   * 구문 진단 후 일부 문서를 반환할 수 있습니다.
   */
  static instanceDocumentStream(
    context: Context, stream: Stream, documentBaseTag: string,
  ): Document | null {
    const handle = native.factoryInstanceDocumentStream(
      context.handle, streamHandle(stream), documentBaseTag);
    return handle === null ? null : new Document(handle);
  }

  /**
   * Create an uncompiled container with Rml::Factory::InstanceStyleSheetString.
   *
   * @zh 使用 InstanceStyleSheetString 创建未编译样式表容器。
   * @ja InstanceStyleSheetString で未コンパイルのコンテナーを作成します。
   * @ko InstanceStyleSheetString으로 컴파일 전 컨테이너를 생성합니다.
   * @param text - RCSS source text.
   * @zh text - RCSS 源文本。
   * @ja text - RCSS のソース。
   * @ko text - RCSS 원본 텍스트입니다.
   * @returns Owned container, or null on parser failure.
   * @zh 自有容器；解析失败时为 null。
   * @ja 所有コンテナー。解析失敗時は null。
   * @ko 소유 컨테이너이며 해석 실패 시 null입니다.
   */
  static instanceStyleSheetString(text: string): StyleSheetContainer | null {
    const handle = native.factoryInstanceStyleSheetString(text);
    return handle === null ? null : containerFromNative(handle);
  }

  /**
   * Create a container through the native file interface and Factory parser.
   *
   * @zh 通过原生文件接口及 Factory 解析器创建容器。
   * @ja ネイティブファイルインターフェースと Factory で生成します。
   * @ko 네이티브 파일 인터페이스와 Factory 해석기로 생성합니다.
   * @param filename - RCSS filename resolved by the installed file interface.
   * @zh filename - 已安装文件接口解析的 RCSS 文件名。
   * @ja filename - 設定済みファイルインターフェースが解決する RCSS ファイル名。
   * @ko filename - 설정한 파일 인터페이스로 해석할 RCSS 파일 이름입니다.
   * @returns Owned container, or null if open or parsing fails.
   * @zh 自有容器；打开或解析失败时为 null。
   * @ja 所有コンテナー。開く処理または解析失敗時は null。
   * @ko 소유 컨테이너이며 열기 또는 해석 실패 시 null입니다.
   */
  static instanceStyleSheetFile(filename: string): StyleSheetContainer | null {
    const handle = native.factoryInstanceStyleSheetFile(filename);
    return handle === null ? null : containerFromNative(handle);
  }

  /**
   * Create a container with Rml::Factory::InstanceStyleSheetStream.
   *
   * @zh 使用 InstanceStyleSheetStream 创建容器。
   * @ja InstanceStyleSheetStream でコンテナーを作成します。
   * @ko InstanceStyleSheetStream으로 컨테이너를 생성합니다.
   * @param stream - Open native stream consumed from its current position.
   * @zh stream - 从当前位置读取的已打开原生流。
   * @ja stream - 現在位置から読み取る開いたネイティブストリーム。
   * @ko stream - 현재 위치부터 읽을 열린 네이티브 스트림입니다.
   * @returns Owned container or null; host callback errors propagate.
   * @zh 自有容器或 null；宿主回调错误会传播。
   * @ja 所有コンテナーまたは null。ホストの例外は伝播します。
   * @ko 소유 컨테이너 또는 null이며 호스트 콜백 오류는 전파됩니다.
   */
  static instanceStyleSheetStream(stream: Stream): StyleSheetContainer | null {
    const handle = native.factoryInstanceStyleSheetStream(streamHandle(stream));
    return handle === null ? null : containerFromNative(handle);
  }

  /**
   * Invoke Rml::Factory::ClearStyleSheetCache; live containers remain valid.
   *
   * @zh 调用 ClearStyleSheetCache；仍被持有的容器保持有效。
   * @ja ClearStyleSheetCache を呼びます。保持中のコンテナーは有効です。
   * @ko ClearStyleSheetCache를 호출하며 보유한 컨테이너는 유효합니다.
   */
  static clearStyleSheetCache(): void {
    native.factoryClearStyleSheetCache();
  }

  /**
   * Invoke Rml::Factory::ClearTemplateCache for subsequent template loads.
   *
   * @zh 调用 ClearTemplateCache，影响后续模板加载。
   * @ja ClearTemplateCache を呼び、以後のテンプレート読込に適用します。
   * @ko ClearTemplateCache를 호출하여 이후 템플릿 로드에 적용합니다.
   */
  static clearTemplateCache(): void {
    native.factoryClearTemplateCache();
  }

  /**
   * Query Rml::Factory::IsStructuralDataView using the unprefixed type name.
   *
   * @zh 使用无前缀类型名查询 IsStructuralDataView。
   * @ja 接頭辞なしの型名で IsStructuralDataView を取得します。
   * @ko 접두사 없는 타입 이름으로 IsStructuralDataView를 조회합니다.
   * @param name - Exact type name, such as "for".
   * @zh name - 精确类型名，如 "for"。
   * @ja name - "for" などの正確な型名。
   * @ko name - "for"와 같은 정확한 타입 이름입니다.
   * @returns Whether native parsing treats this data view as structural.
   * @zh 原生解析器是否将此数据视图视为结构视图。
   * @ja ネイティブ解析がこのビューを構造的に扱うか。
   * @ko 네이티브 해석이 이 뷰를 구조적으로 처리하는지 여부입니다.
   */
  static isStructuralDataView(name: string): boolean {
    return native.factoryIsStructuralDataView(name);
  }

  /**
   * Copy Rml::Factory::GetStructuralDataViewAttributeNames.
   *
   * @zh 复制 GetStructuralDataViewAttributeNames 的结果。
   * @ja GetStructuralDataViewAttributeNames をコピーします。
   * @ko GetStructuralDataViewAttributeNames를 복사합니다.
   * @returns Independent array of full "data-" names in native set order.
   * @zh 独立数组，按原生集合顺序包含完整 "data-" 名称。
   * @ja ネイティブ集合順の完全な "data-" 名の独立配列。
   * @ko 네이티브 집합 순서의 전체 "data-" 이름을 가진 독립 배열입니다.
   */
  static getStructuralDataViewAttributeNames(): string[] {
    return native.factoryGetStructuralDataViewAttributeNames();
  }
}
