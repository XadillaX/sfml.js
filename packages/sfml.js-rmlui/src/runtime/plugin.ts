import { native } from '../internal/native';
import { Context } from './context';
import { Element } from '../dom/elements/element';
import type { Document } from '../dom/documents/document';
import type { ContextNativeHandle, ElementNativeHandle } from '../values/types';
import type {
  PluginEventClassesCallback, PluginLifecycleCallback, PluginContextCallback,
  PluginDocumentOpenCallback, PluginDocumentCallback, PluginElementCallback,
  PluginDataModelCallback,
} from './plugin-callbacks';

/**
 * Rml::Plugin::EventClasses subscription bits, captured on each registration.
 *
 * @zh Rml::Plugin::EventClasses 订阅位，每次注册时固定。
 * @ja 登録ごとに固定する Rml::Plugin::EventClasses の購読ビット。
 * @ko 등록마다 고정하는 Rml::Plugin::EventClasses 구독 비트입니다.
 */
export enum PluginEventClasses {
  /**
   * Runtime and context lifecycle.
   *
   * @zh 运行时与上下文生命周期。
   * @ja ランタイムとコンテキスト。
   * @ko 런타임과 컨텍스트 생명 주기입니다.
   */
  Basic = 1,
  /**
   * Document open, load and unload.
   *
   * @zh 文档打开、加载与卸载。
   * @ja 文書の開始・読み込み・解放。
   * @ko 문서 열기, 로드 및 해제입니다.
   */
  Document = 2,
  /**
   * Element creation and destruction.
   *
   * @zh 元素创建与销毁。
   * @ja 要素の生成と破棄。
   * @ko 요소 생성 및 파괴입니다.
   */
  Element = 4,
  /**
   * Data model creation and destruction.
   *
   * @zh 数据模型创建与销毁。
   * @ja データモデルの生成と破棄。
   * @ko 데이터 모델 생성 및 파괴입니다.
   */
  DataModel = 8,
  /**
   * All four classes.
   *
   * @zh 全部四类。
   * @ja すべての分類。
   * @ko 네 가지 분류 모두입니다.
   */
  All = 15,
}

/**
 * Synchronous Rml::Plugin notifications.
 *
 * @zh 同步 Rml::Plugin 通知。
 * @ja 同期 Rml::Plugin 通知。
 * @ko 동기 Rml::Plugin 알림입니다.
 * @remarks
 * Arguments are live borrowed facades and expire on callback return. Approved
 * reads are context name/dimensions/getDataModel/getDataModels, element
 * id/tagName/attribute reads, and document title/sourceURL. Other Native calls
 * are rejected; registerPlugin and unregisterPlugin are allowed. Copy required
 * values inside the callback. A data model is still discoverable during its
 * destroy notification and becomes invalid immediately after Native removal.
 * All notification callbacks must return undefined synchronously.
 * @zh 参数为实时借用包装器，回调返回后失效。允许读取上下文名称、尺寸和模型，
 * 元素 id、标签和属性，以及文档标题、来源 URL。其他原生操作被拒绝；
 * 允许注册或注销插件。需要保留的值在回调内复制。模型销毁通知期间仍可查询，
 * 原生移除后立即失效。通知必须同步返回 undefined。
 * @ja 引数は実体を借用するラッパーで、戻ると無効になります。名前・寸法・
 * モデル、要素の id・タグ・属性、文書のタイトル・URL の読み取りとプラグイン
 * 登録解除を許可します。値はコールバック内でコピーしてください。モデルは
 * 破棄通知中に検索でき、ネイティブ削除直後に無効化されます。
 * 通知は同期的に undefined を返す必要があります。
 * @ko 인수는 실제 객체를 빌린 래퍼이며 반환 후 무효화됩니다. 컨텍스트 이름,
 * 크기와 모델, 요소 id와 태그 및 속성, 문서 제목과 URL 읽기 및 플러그인
 * 등록과 해제를 허용합니다. 필요한 값은 콜백 안에서 복사하세요. 모델은 파괴
 * 알림 중 조회할 수 있고 네이티브 삭제 직후 무효화됩니다.
 * 알림은 동기적으로 undefined를 반환해야 합니다.
 */
export interface PluginCallbacks {
  /**
   * Return an integer mask 0..15; default All.
   *
   * @zh 返回 0..15 整数掩码；默认 All。
   * @ja 0..15 のマスク。既定は All。
   * @ko 0..15 정수 마스크이며 기본값은 All입니다.
   */
  getEventClasses?: PluginEventClassesCallback;

  /**
   * Notify the plugin that the RmlUi runtime has initialized.
   *
   * @zh 初始化通知。
   * @ja 初期化通知。
   * @ko 초기화 알림입니다.
   */
  onInitialise?: PluginLifecycleCallback;

  /**
   * Notify the plugin that the RmlUi runtime is shutting down.
   *
   * @zh 关闭通知。
   * @ja 終了通知。
   * @ko 종료 알림입니다.
   */
  onShutdown?: PluginLifecycleCallback;

  /**
   * Rml::Plugin::OnContextCreate; live context.
   *
   * @zh 上下文创建，参数为实时上下文。
   * @ja 生成された実体コンテキスト。
   * @ko 생성된 실제 컨텍스트입니다.
   */
  onContextCreate?: PluginContextCallback;

  /**
   * Rml::Plugin::OnContextDestroy; before documents/models.
   *
   * @zh 在文档和模型之前通知上下文销毁。
   * @ja 文書・モデルより先の破棄通知。
   * @ko 문서와 모델보다 먼저 컨텍스트 파괴를 알립니다.
   */
  onContextDestroy?: PluginContextCallback;

  /**
   * Rml::Plugin::OnDocumentOpen; at the stream load entry.
   *
   * @zh 进入流加载时传入上下文与路径。
   * @ja ストリーム読み込み開始時のコンテキストとパス。
   * @ko 스트림 로드 시작 시 컨텍스트와 경로입니다.
   */
  onDocumentOpen?: PluginDocumentOpenCallback;

  /**
   * Rml::Plugin::OnDocumentLoad; before load event.
   *
   * @zh 文档 load 事件之前。
   * @ja load イベントの前。
   * @ko 문서 load 이벤트 전입니다.
   */
  onDocumentLoad?: PluginDocumentCallback;

  /**
   * Rml::Plugin::OnDocumentUnload; after unload event.
   *
   * @zh 文档 unload 事件之后。
   * @ja unload イベントの後。
   * @ko 문서 unload 이벤트 후입니다.
   */
  onDocumentUnload?: PluginDocumentCallback;

  /**
   * Rml::Plugin::OnElementCreate; initialized factory element.
   *
   * @zh Factory 初始化后的元素。
   * @ja Factory が初期化した要素。
   * @ko Factory에서 초기화한 요소입니다.
   */
  onElementCreate?: PluginElementCallback;

  /**
   * Rml::Plugin::OnElementDestroy; live base Element destructor.
   *
   * @zh 基类 Element 析构中的实时元素。
   * @ja 基底 Element の破棄中の実体。
   * @ko 기본 Element 소멸 중 실제 요소입니다.
   */
  onElementDestroy?: PluginElementCallback;

  /**
   * Rml::Plugin::OnDataModelCreate; context and model name.
   *
   * @zh 上下文与已创建模型名。
   * @ja コンテキストと生成したモデル名。
   * @ko 컨텍스트와 생성된 모델 이름입니다.
   */
  onDataModelCreate?: PluginDataModelCallback;

  /**
   * Rml::Plugin::OnDataModelDestroy; model remains discoverable.
   *
   * @zh 模型销毁前仍可查询。
   * @ja 破棄前のモデルは検索可能。
   * @ko 파괴 전 모델을 조회할 수 있습니다.
   */
  onDataModelDestroy?: PluginDataModelCallback;
}

const handles = new WeakMap<Plugin, object>();

/**
 * Native-owned adapter for Rml::Plugin.
 *
 * @zh Native 持有的 Rml::Plugin 适配器。
 * @ja ネイティブが所有する Rml::Plugin アダプター。
 * @ko 네이티브가 소유하는 Rml::Plugin 어댑터입니다.
 * @remarks
 * Construction captures optional callbacks once. Registration retains the
 * adapter and callbacks; unregistration releases the Native root. Shutdown
 * invalidates the adapter, including plugins created before initialisation.
 * No per-frame host callbacks are added when no subscribed event occurs.
 * @zh 构造时捕获可选回调；注册保活适配器与回调，注销释放 Native 根引用。
 * 关闭运行时后失效，包括初始化前创建的插件。没有订阅事件时不增加逐帧回调。
 * @ja 作成時に任意のコールバックを固定します。登録中は保持し、解除で
 * ネイティブの参照を解放します。初期化前のプラグインも終了時に無効化します。
 * 購読した通知がなければフレームごとのコールバックはありません。
 * @ko 생성 시 선택 콜백을 캡처합니다. 등록 중 유지하고 해제 시 네이티브
 * 루트 참조를 해제합니다. 초기화 전에 생성한 플러그인도 종료 시 무효화됩니다.
 * 구독 이벤트가 없으면 프레임별 호스트 콜백을 추가하지 않습니다.
 */
export class Plugin {
  private readonly nativeHandle: object;

  /**
   * Capture the twelve upstream callback slots.
   *
   * @zh 捕获上游十二个回调槽。
   * @ja 上流の 12 個のコールバックを固定します。
   * @ko 업스트림 콜백 슬롯 열두 개를 캡처합니다.
   * @param callbacks - Optional synchronous methods.
   * @zh callbacks - 可选同步方法。
   * @ja callbacks - 任意の同期メソッド。
   * @ko callbacks - 선택 동기 메서드입니다.
   */
  constructor(callbacks: PluginCallbacks = {}) {
    if (!callbacks || typeof callbacks !== 'object' ||
        Array.isArray(callbacks)) {
      throw new TypeError('Expected Plugin callbacks');
    }
    const {
      getEventClasses, onInitialise, onShutdown, onContextCreate,
      onContextDestroy, onDocumentOpen, onDocumentLoad, onDocumentUnload,
      onElementCreate, onElementDestroy, onDataModelCreate, onDataModelDestroy,
    } = callbacks;
    const table = [
      getEventClasses, onInitialise, onShutdown,
      onContextCreate && ((handle: ContextNativeHandle) =>
        onContextCreate(new Context(handle))),
      onContextDestroy && ((handle: ContextNativeHandle) =>
        onContextDestroy(new Context(handle))),
      onDocumentOpen && ((handle: ContextNativeHandle, documentPath: string) =>
        onDocumentOpen(new Context(handle), documentPath)),
      onDocumentLoad && ((handle: ElementNativeHandle) =>
        onDocumentLoad(Element.wrap(handle) as Document)),
      onDocumentUnload && ((handle: ElementNativeHandle) =>
        onDocumentUnload(Element.wrap(handle) as Document)),
      onElementCreate && ((handle: ElementNativeHandle) =>
        onElementCreate(Element.wrap(handle))),
      onElementDestroy && ((handle: ElementNativeHandle) =>
        onElementDestroy(Element.wrap(handle))),
      onDataModelCreate && ((handle: ContextNativeHandle, name: string) =>
        onDataModelCreate(new Context(handle), name)),
      onDataModelDestroy && ((handle: ContextNativeHandle, name: string) =>
        onDataModelDestroy(new Context(handle), name)),
    ];
    // Validate source methods too: an adapter closure must not hide an invalid
    // callback until a later Native notification.
    for (const callback of Object.values({
      getEventClasses, onInitialise, onShutdown, onContextCreate,
      onContextDestroy, onDocumentOpen, onDocumentLoad, onDocumentUnload,
      onElementCreate, onElementDestroy, onDataModelCreate, onDataModelDestroy,
    })) {
      if (callback !== undefined && typeof callback !== 'function') {
        throw new TypeError('Plugin callbacks must be functions');
      }
    }
    this.nativeHandle = native.createPlugin(Object.freeze(table));
    handles.set(this, this.nativeHandle);
  }
}

/**
 * Register Rml::Plugin and retain its Native adapter.
 *
 * @zh 注册 Rml::Plugin 并保活其 Native 适配器。
 * @ja Rml::Plugin を登録してネイティブアダプターを保持します。
 * @ko Rml::Plugin을 등록하고 네이티브 어댑터를 유지합니다.
 * @param plugin - Adapter from the current runtime generation.
 * @zh plugin - 当前运行时代次的适配器。
 * @ja plugin - 現在のランタイム世代のアダプター。
 * @ko plugin - 현재 런타임 세대의 어댑터입니다.
 * @remarks
 * Late registration calls onInitialise before insertion, for every mask.
 * Duplicate registration throws. Changes made inside a notification take
 * effect for following notifications; self-removal is safe.
 * @zh 晚注册在插入前调用 onInitialise，与掩码无关。重复注册抛错。
 * 通知内修改对后续通知生效；可安全自注销。
 * @ja 初期化後の登録はマスクに関係なく挿入前に onInitialise を呼びます。
 * 重複はエラーです。通知中の変更は以後の通知に適用し、自己解除は安全です。
 * @ko 늦은 등록은 마스크와 관계없이 삽입 전에 onInitialise를 호출합니다.
 * 중복 등록은 오류입니다. 알림 중 변경은 다음 알림에 적용되며 자체 해제는 안전합니다.
 */
export function registerPlugin(plugin: Plugin): void {
  native.registerPlugin(pluginHandle(plugin));
}

/**
 * Unregister Rml::Plugin, returning whether a registration was removed.
 *
 * @zh 注销 Rml::Plugin，返回是否移除了注册。
 * @ja Rml::Plugin を解除し、登録を削除したか返します。
 * @ko Rml::Plugin을 해제하고 등록 제거 여부를 반환합니다.
 * @param plugin - Current adapter.
 * @zh plugin - 当前适配器。
 * @ja plugin - 現在のアダプター。
 * @ko plugin - 현재 어댑터입니다.
 * @returns True for removal; false if already absent.
 * @zh 移除返回 true，已不存在返回 false。
 * @ja 削除は true、未登録は false。
 * @ko 제거하면 true, 이미 없으면 false입니다.
 * @remarks
 * Explicit unregistration calls onShutdown when the runtime is initialized,
 * regardless of mask. Global shutdown calls it only for Basic subscribers in
 * reverse registration order. Self-removal during late onInitialise cancels
 * insertion and delivers onShutdown after onInitialise returns.
 * @zh 显式注销在运行时已初始化时调用 onShutdown，与掩码无关。
 * 全局关闭仅按注册逆序通知 Basic 订阅者。晚初始化中自注销会取消插入，
 * onInitialise 返回后调用 onShutdown。
 * @ja 初期化済みでの明示的解除はマスクに関係なく onShutdown を呼びます。
 * 全体終了では Basic のみ登録の逆順で通知します。初期化中の自己解除は
 * 挿入を取り消し、onInitialise の戻り後に onShutdown を呼びます。
 * @ko 초기화 후 명시적 해제는 마스크와 관계없이 onShutdown을 호출합니다.
 * 전체 종료는 Basic 구독자만 등록 역순으로 알립니다. 늦은 초기화 중 자체 해제는
 * 삽입을 취소하고 onInitialise 반환 후 onShutdown을 호출합니다.
 */
export function unregisterPlugin(plugin: Plugin): boolean {
  return native.unregisterPlugin(pluginHandle(plugin));
}

/**
 * Resolve a checked Plugin adapter handle.
 *
 * @param plugin - Adapter facade.
 * @returns Opaque Native handle.
 * @internal
 */
function pluginHandle(plugin: Plugin): object {
  const handle = handles.get(plugin);
  if (!handle) {
    throw new TypeError('Expected a Plugin');
  }
  return handle;
}
