import { Event, type EventData } from 'sfml.js';
import { native } from '../internal/native';
import { ScriptInterface } from '../scripting/script-interface';
import { classIdentifier, classIndex, type ClassIdentifier } from './rtti';
import { Stream, streamHandle } from '../io/stream';
import { mapStruct } from '../internal/sfml-interop';
import type {
  ContextNativeHandle, RmlEventListener, VariantVector2,
} from '../values/types';
import type { Touch } from '../platform/input';
import type { RenderInterface } from '../rendering/resources';
import {
  RenderManager, renderManagerFromNative, renderManagerHandle,
} from '../rendering/render-manager';
import {
  textInputHandlerFromNative, textInputHandlerHandle,
  type TextInputHandler,
} from '../platform/text-input-handler';
import { Document } from '../dom/documents/document';
import { scriptHostHandle, type NodeScriptHost } from '../scripting/scripts';
import type { LuaScriptHost } from '../scripting/lua/lua-scripts';
import { Element } from '../dom/elements/element';
import { ScrollBehavior } from '../dom/documents/document-flags';
import {
  dataModelFromNative, type DataModelConstructor, type DataModelOptions,
} from '../data/data-model';

const wrappers = new WeakMap<ContextNativeHandle, Context>();

/**
 * Read-only view of the context's cached physical dimensions.
 *
 * @zh 上下文缓存物理尺寸的只读视图。
 * @ja キャッシュされたコンテキストの物理サイズの読み取り専用ビュー。
 * @ko 캐시된 컨텍스트 물리 크기의 읽기 전용 뷰입니다.
 */
export interface ContextDimensions {
  /**
   * Width in physical pixels.
   *
   * @zh 宽度，单位为物理像素。
   * @ja 物理ピクセル単位の幅。
   * @ko 물리 픽셀 단위의 너비입니다.
   */
  readonly width: number;

  /**
   * Height in physical pixels.
   *
   * @zh 高度，单位为物理像素。
   * @ja 物理ピクセル単位の高さ。
   * @ko 물리 픽셀 단위의 높이입니다.
   */
  readonly height: number;
}

/**
 * RmlUi context bound to one sfml.js render window.
 *
 * @zh 绑定到单个 sfml.js 渲染窗口的 RmlUi 上下文。
 * @ja 1 つの sfml.js 描画ウィンドウに紐付く RmlUi コンテキスト。
 * @ko 하나의 sfml.js 렌더 창에 바인딩된 RmlUi 컨텍스트입니다.
 * @remarks
 * Obtain registered instances through {@link createContext}, or independently
 * owned instances through {@link Factory.instanceContext}. The native context
 * owns attached documents. Stop using wrappers after remove or shutdown.
 * @zh 通过 {@link createContext} 获取已注册实例，或通过
 * {@link Factory.instanceContext} 获取独立自有实例。原生上下文持有已挂接文档；
 * {@link Context.remove} 或 shutdown 后不可继续使用相关包装器。
 * @ja 登録済みは {@link createContext}、独立した所有インスタンスは
 * {@link Factory.instanceContext} で取得します。追加した文書をコンテキストが所有し、
 * {@link Context.remove} または shutdown 後は関連ラッパーを使用できません。
 * @ko 등록 인스턴스는 {@link createContext}, 독립 소유 인스턴스는
 * {@link Factory.instanceContext}로 얻습니다. 컨텍스트는 연결한 문서를 소유하며,
 * {@link Context.remove} 또는 shutdown 후에는 관련 래퍼를 사용할 수 없습니다.
 */
export class Context extends ScriptInterface {
  /**
   * Borrowed native context handle.
   *
   * @zh 借用的原生上下文句柄。
   * @ja 借用したネイティブコンテキストハンドル。
   * @ko 빌린 네이티브 컨텍스트 핸들입니다.
   * @internal
   */
  readonly handle: ContextNativeHandle;

  private dimensionsView?: ContextDimensions;

  /**
   * Create a native Rml::Context::CreateDataModel.
   *
   * @zh 创建原生 Rml::Context::CreateDataModel。
   * @ja ネイティブ Rml::Context::CreateDataModel を作成します。
   * @ko 네이티브 Rml::Context::CreateDataModel을 생성합니다.
   * @param name - Model name used by RML data-model attributes.
   * @zh name - RML data-model 属性使用的模型名称。
   * @ja name - RML data-model 属性で使うモデル名。
   * @ko name - RML data-model 속성에서 사용할 모델 이름입니다.
   * @param options - Native creation options.
   * @zh options - 原生创建选项。
   * @ja options - ネイティブ作成オプション。
   * @ko options - 네이티브 생성 옵션입니다.
   * @returns Constructor, or null for duplicate names.
   * @zh 构造器；名称重复时返回 null。
   * @ja コンストラクター。重複名では null。
   * @ko 생성자이며 이름이 중복되면 null입니다.
   */
  createDataModel(
    name: string, options: DataModelOptions = {},
  ): DataModelConstructor | null {
    const model = native.contextCreateDataModel(
      this.handle, name, options.allowMissingVariables ?? false,
      options.typeRegister?.handle,
    );
    return model ? dataModelFromNative(model) : null;
  }

  /**
   * Find Rml::Context::GetDataModel.
   *
   * @zh 查询 Rml::Context::GetDataModel。
   * @ja Rml::Context::GetDataModel を検索します。
   * @ko Rml::Context::GetDataModel을 조회합니다.
   * @param name - Model name.
   * @zh name - 模型名称。
   * @ja name - モデル名。
   * @ko name - 모델 이름입니다.
   * @returns Canonical constructor, or null when absent.
   * @zh 唯一构造器；不存在时为 null。
   * @ja 正規のコンストラクター。存在しなければ null。
   * @ko 동일성을 유지하는 생성자이며 없으면 null입니다.
   */
  getDataModel(name: string): DataModelConstructor | null {
    const model = native.contextGetDataModel(this.handle, name);
    return model ? dataModelFromNative(model) : null;
  }

  /**
   * Snapshot Rml::Context::GetDataModels.
   *
   * @zh 获取 Rml::Context::GetDataModels 快照。
   * @ja Rml::Context::GetDataModels のスナップショットを取得します。
   * @ko Rml::Context::GetDataModels 스냅샷을 얻습니다.
   * @returns Name-to-constructor snapshot.
   * @zh 名称到构造器的快照。
   * @ja 名前からコンストラクターへのスナップショット。
   * @ko 이름과 생성자를 연결하는 스냅샷입니다.
   */
  getDataModels(): Record<string, DataModelConstructor> {
    return Object.fromEntries(
      Object.entries(native.contextGetDataModels(this.handle))
        .map(([ name, model ]) => [ name, dataModelFromNative(model) ]),
    );
  }

  /**
   * Remove Rml::Context::RemoveDataModel and invalidate all its leases.
   *
   * @zh 执行 Rml::Context::RemoveDataModel 并失效该模型的全部租约。
   * @ja Rml::Context::RemoveDataModel を実行し、すべてのリースを無効にします。
   * @ko Rml::Context::RemoveDataModel을 실행하고 모든 수명 핸들을 무효화합니다.
   * @param name - Model name.
   * @zh name - 模型名称。
   * @ja name - モデル名。
   * @ko name - 모델 이름입니다.
   * @returns Native removal result.
   * @zh 原生移除结果。
   * @ja ネイティブ削除の結果。
   * @ko 네이티브 삭제 결과입니다.
   */
  removeDataModel(name: string): boolean {
    return native.contextRemoveDataModel(this.handle, name);
  }

  /**
   * Wrap a native context created by RmlUi.
   *
   * @zh 包装 RmlUi 创建的原生上下文。
   * @ja RmlUi が作成したネイティブコンテキストをラップします。
   * @ko RmlUi가 생성한 네이티브 컨텍스트를 감쌉니다.
   * @param handle - Native context handle returned by createContext.
   * @zh handle - createContext 返回的原生上下文句柄。
   * @ja handle - createContext が返すネイティブコンテキストハンドル。
   * @ko handle - createContext가 반환한 네이티브 컨텍스트 핸들입니다.
   * @internal
   */
  constructor(handle: ContextNativeHandle);

  /**
   * Construct an independently owned native Rml::Context.
   *
   * @zh 构造独立自有的原生 Rml::Context。
   * @ja 独立して所有するネイティブ Rml::Context を構築します。
   * @ko 독립 소유 네이티브 Rml::Context를 생성합니다.
   * @remarks
   * Preserves native zero dimensions and density 1 without Core registration
   * or plugin creation notices. Retains the manager until remove or collection.
   * The explicit null handler remains null; it does not select the global one.
   * This constructor can be used inside ContextInstancer callbacks.
   * @zh 保留原生零尺寸及密度 1，不进入 Core 注册表或触发插件创建通知。
   * 管理器保活至 remove 或回收。显式 null 处理器保持 null，不选择全局处理器。
   * 可在 ContextInstancer 回调内使用。
   * @ja 寸法ゼロと密度 1 を保持し、Core 登録やプラグイン通知を行いません。
   * remove または回収まで管理器を保持します。明示的な null は全体設定を選びません。
   * ContextInstancer コールバック内でも使用できます。
   * @ko 크기 0과 밀도 1을 유지하며 Core 등록 및 플러그인 알림을 수행하지 않습니다.
   * remove 또는 수거까지 관리자를 유지합니다. 명시적 null은 전역 처리기를 선택하지
   * 않습니다. ContextInstancer 콜백에서도 사용할 수 있습니다.
   * @param name - Native name, independent of the Core registry.
   * @zh name - 原生名称，与 Core 注册表独立。
   * @ja name - Core 登録と独立したネイティブ名。
   * @ko name - Core 등록과 독립적인 네이티브 이름입니다.
   * @param manager - Live native render manager retained by the context.
   * @zh manager - 上下文保活的活跃原生渲染管理器。
   * @ja manager - コンテキストが保持する有効なネイティブ描画管理器。
   * @ko manager - 컨텍스트가 유지하는 유효 네이티브 렌더 관리자입니다.
   * @param handler - Explicit borrowed text-input handler, or null.
   * @zh handler - 显式借用文本输入处理器，或 null。
   * @ja handler - 明示的に借用する文字入力ハンドラー、または null。
   * @ko handler - 명시적 대여 텍스트 입력 처리기 또는 null입니다.
   */
  constructor(
    name: string, manager: RenderManager, handler: TextInputHandler | null,
  );
  constructor(
    handleOrName: ContextNativeHandle | string,
    manager?: RenderManager, handler?: TextInputHandler | null,
  ) {
    super();
    const handle = typeof handleOrName === 'string'
      ? native.constructContext(handleOrName, renderManagerHandle(manager!),
        handler === null ? null : textInputHandlerHandle(handler!))
      : handleOrName;
    this.handle = handle;
    const existing = wrappers.get(handle);
    if (existing) {
      return existing;
    }
    wrappers.set(handle, this);
  }

  /**
   * Read Context's inherited native ScriptInterface class identifier.
   *
   * @zh 读取 Context 继承的原生 ScriptInterface 类型标识。
   * @ja Context が継承するネイティブ ScriptInterface 識別子を読みます。
   * @ko Context가 상속한 네이티브 ScriptInterface 식별자를 읽습니다.
   * @returns Opaque token available before initialisation.
   * @zh 初始化前即可读取的不透明令牌。
   * @ja 初期化前にも取得できる不透明トークン。
   * @ko 초기화 전에도 사용할 수 있는 불투명 토큰입니다.
   */
  static getStaticClassIdentifier(): ClassIdentifier {
    return classIdentifier(native.getStaticClassIdentifier('Context'));
  }

  /**
   * Read the actual native Context class identifier.
   *
   * @zh 读取实际原生 Context 类型标识。
   * @ja 実際のネイティブ Context 型識別子を読みます。
   * @ko 실제 네이티브 Context 타입 식별자를 읽습니다.
   * @returns Native token; Context inherits ScriptInterface's identity.
   * @zh 原生令牌，Context 继承 ScriptInterface 的标识。
   * @ja ネイティブトークン。Context は ScriptInterface の識別子を継承します。
   * @ko 네이티브 토큰이며 Context는 ScriptInterface 식별자를 상속합니다.
   */
  getClassIdentifier(): ClassIdentifier {
    return classIdentifier(native.getClassIdentifier(this.handle));
  }

  /**
   * Check actual native ScriptInterface inheritance.
   *
   * @zh 检查实际原生 ScriptInterface 继承关系。
   * @ja 実際のネイティブ ScriptInterface 継承を検証します。
   * @ko 실제 네이티브 ScriptInterface 상속을 검사합니다.
   * @param identifier - Module-owned class token.
   * @zh identifier - 本模块的类型令牌。
   * @ja identifier - このモジュールの型トークン。
   * @ko identifier - 이 모듈의 타입 토큰입니다.
   * @returns Whether the native Context implements that class.
   * @zh 原生 Context 是否实现指定类。
   * @ja ネイティブ Context がその型を実装するかどうか。
   * @ko 네이티브 Context가 해당 클래스를 구현하는지 여부입니다.
   */
  isClass(identifier: ClassIdentifier): boolean {
    return native.isClass(this.handle, classIndex(identifier));
  }

  /**
   * Read the registered native Context script object.
   *
   * @zh 读取已注册的原生 Context 脚本对象。
   * @ja 登録されたネイティブ Context スクリプトを読みます。
   * @ko 등록된 네이티브 Context 스크립트를 읽습니다.
   * @returns Same registered host object, or null when unregistered.
   * @zh 同一已注册宿主对象，未注册时为 null。
   * @ja 同一の登録ホスト。未登録なら null。
   * @ko 같은 등록 호스트이며 미등록 시 null입니다.
   */
  getScriptObject(): object | null {
    return native.getContextScriptObject(this.handle);
  }

  /**
   * Register a script object with the Context's existing ownership.
   *
   * @zh 按 Context 原有所有权注册脚本对象。
   * @ja Context の既存の所有権でスクリプトを登録します。
   * @ko Context의 기존 소유권으로 스크립트를 등록합니다.
   * @param object - Host object, or null to clear its association.
   * @zh object - 宿主对象，或传 null 清除关联。
   * @ja object - ホストオブジェクト。null は関連付けを解除します。
   * @ko object - 호스트 객체이며 null은 연결을 해제합니다.
   * @remarks
   * Registered contexts retain the object natively. Independently owned
   * contexts use their JS owner edge so context/object cycles can collect.
   * @zh 已注册上下文由原生保活对象，独立自有上下文使用 JS 所有者边，
   * 上下文与对象形成的环可回收。
   * @ja 登録済みはネイティブが保持します。独立所有は JS 所有者経由で
   * 保持するため、Context とオブジェクトの循環は回収できます。
   * @ko 등록 컨텍스트는 네이티브가 유지합니다. 독립 소유는 JS 소유자
   * 연결을 사용하여 컨텍스트와 객체의 순환을 수집할 수 있습니다.
   */
  setScriptObject(object: object | null): void {
    native.setContextScriptObject(this.handle, object);
  }

  /**
   * Release an independently owned Context through its original instancer.
   *
   * @zh 通过原始实例器释放独立自有 Context。
   * @ja 元のインスタンサー経由で独立所有 Context を解放します。
   * @ko 원래 생성기를 통해 독립 소유 Context를 해제합니다.
   * @remarks
   * Registered contexts reject release; use remove() to remove registration.
   * @zh 已注册上下文拒绝 release，应通过 remove() 移除注册。
   * @ja 登録済みは release を拒否します。remove() で登録を削除してください。
   * @ko 등록 컨텍스트는 release를 거부합니다. remove()로 등록을 제거하세요.
   */
  release(): void {
    native.releaseScriptContext(this.handle);
  }

  /**
   * Rml::Context::GetName, validated against this runtime generation.
   *
   * @zh Rml::Context::GetName，校验当前运行时代次。
   * @ja ランタイム世代を検証して Rml::Context::GetName を取得します。
   * @ko 런타임 세대를 검증한 Rml::Context::GetName입니다.
   * @returns Context name.
   * @zh 上下文名称。
   * @ja コンテキスト名。
   * @ko 컨텍스트 이름입니다.
   */
  get name(): string {
    return native.getContextName(this.handle);
  }

  /**
   * Get the render manager shared by contexts using this render interface.
   *
   * @zh 获取使用此渲染接口的上下文共享的渲染管理器。
   * @ja この描画インターフェースを使うコンテキスト共通の描画管理器を取得します。
   * @ko 이 렌더 인터페이스를 사용하는 컨텍스트의 공유 렌더 관리자를 가져옵니다.
   * @returns Manager shared by contexts using the same render interface.
   * @zh 使用同一渲染接口的上下文共享的管理器。
   * @ja 同じ描画インターフェースのコンテキストで共有する管理器。
   * @ko 같은 렌더 인터페이스의 컨텍스트가 공유하는 관리자입니다.
   */
  getRenderManager(): RenderManager {
    return renderManagerFromNative(native.getContextRenderManager(this.handle));
  }

  /**
   * Read the exact borrowed Rml::Context::GetTextInputHandler.
   *
   * @zh 读取确切的借用 Rml::Context::GetTextInputHandler。
   * @ja 借用した Rml::Context::GetTextInputHandler をそのまま取得します。
   * @ko 대여한 Rml::Context::GetTextInputHandler를 그대로 읽습니다.
   * @returns Canonical checked handler, or null when absent.
   * @zh 身份固定的受检处理器；未设置时为 null。
   * @ja 同一性を保持する検証付きハンドラー。未設定は null。
   * @ko 동일성을 유지하는 검증된 처리기이며 미설정 시 null입니다.
   */
  getTextInputHandler(): TextInputHandler | null {
    const handle = native.getContextTextInputHandler(this.handle);
    return handle === null ? null : textInputHandlerFromNative(handle);
  }

  /**
   * Renderer used by this context's native render manager.
   *
   * @zh 此上下文的原生渲染管理器所使用的渲染接口。
   * @ja このコンテキストのネイティブ描画管理器が使用する描画インターフェース。
   * @ko 이 컨텍스트의 네이티브 렌더 관리자가 사용하는 렌더 인터페이스입니다.
   * @returns Canonical renderer reference for scoped resource operations.
   * @zh 用于限定资源操作范围的唯一渲染接口引用。
   * @ja リソース操作の対象を指定する一意の描画インターフェース参照。
   * @ko 리소스 작업 범위를 지정하는 고유 렌더 인터페이스 참조입니다.
   */
  get renderInterface(): RenderInterface {
    return native.getContextRenderInterface(this.handle);
  }

  /**
   * Remove the context from RmlUi.
   *
   * @zh 从 RmlUi 移除该上下文。
   * @ja RmlUi からこのコンテキストを削除します。
   * @ko RmlUi에서 이 컨텍스트를 제거합니다.
   * @returns Whether the native context was removed.
   * @zh 是否移除了原生上下文。
   * @ja ネイティブコンテキストを削除したかどうか。
   * @ko 네이티브 컨텍스트를 제거했는지 여부입니다.
   * @remarks
   * Calls Rml::RemoveContext for registered contexts, or releases independent
   * native ownership. Owned removal never removes a same-name registration.
   * Listeners release automatically.
   * Later operations throw, including repeated remove().
   * Dimensions become zero; a same-name context never revives old wrappers.
   * @zh 已注册上下文调用 Rml::RemoveContext，自有上下文释放独立原生所有权，
   * 不移除同名注册。自动释放监听器。后续包装器操作（含重复 remove）
   * 会抛出异常。保留的尺寸视图归零，同名新上下文不会恢复旧包装器。
   * @ja 登録済みは Rml::RemoveContext、独立所有はネイティブ所有権を解放します。
   * 同名登録は削除せず、リスナーを自動解放します。remove の再呼び出しを
   * 含む以後の操作は例外を投げます。寸法は 0 になり、同名の再作成でも復活しません。
   * @ko 등록 컨텍스트는 Rml::RemoveContext, 독립 소유는 네이티브 소유권을 해제합니다.
   * 같은 이름의 등록은 제거하지 않고 리스너를 자동 해제합니다. remove 재호출을
   * 포함한 이후 작업은 예외를 던집니다. 크기는 0이 되며 같은 이름으로 다시 생성해도 복구되지 않습니다.
   */
  remove(): boolean {
    return native.removeContext(this.handle);
  }

  /**
   * Return Rml::Context::GetRootElement with canonical element identity.
   *
   * @zh 返回 Rml::Context::GetRootElement，并保留唯一元素身份。
   * @ja Rml::Context::GetRootElement を一意の要素ラッパーで返します。
   * @ko Rml::Context::GetRootElement를 고유 요소 래퍼로 반환합니다.
   * @returns Context root, valid until context destruction.
   * @zh 上下文根元素，在上下文销毁前有效。
   * @ja コンテキスト破棄まで有効なルート要素。
   * @ko 컨텍스트 파괴 전까지 유효한 루트 요소입니다.
   */
  getRootElement(): Element {
    return Element.wrap(native.getRootElement(this.handle));
  }

  /**
   * Attach to the context root, as Rml::Context::AddEventListener does.
   *
   * @zh 与 Rml::Context::AddEventListener 一样，在上下文根元素上注册。
   * @ja Rml::Context::AddEventListener と同様、ルートに登録します。
   * @ko Rml::Context::AddEventListener처럼 루트에 등록합니다.
   * @param type - Event name or registered native EventId.
   * @zh type - 事件名称或已注册的原生 EventId。
   * @ja type - イベント名または登録済み EventId。
   * @ko type - 이벤트 이름 또는 등록된 EventId입니다.
   * @param listener - Synchronous callback.
   * @zh listener - 同步回调。
   * @ja listener - 同期コールバック。
   * @ko listener - 동기 콜백입니다.
   * @param capture - Capture phase; defaults to false.
   * @zh capture - 捕获阶段标志，默认为 false。
   * @ja capture - キャプチャフラグ。既定値は false。
   * @ko capture - 캡처 플래그이며 기본값은 false입니다.
   */
  addEventListener(
    type: string | number, listener: RmlEventListener, capture = false,
  ): void {
    this.getRootElement().addEventListener(type, listener, capture);
  }

  /**
   * Remove the matching context-root registration.
   *
   * @zh 移除匹配的上下文根元素监听器。
   * @ja 一致するコンテキストルートの登録を解除します。
   * @ko 일치하는 컨텍스트 루트 등록을 제거합니다.
   * @param type - Event name or registered native EventId.
   * @zh type - 事件名称或已注册的原生 EventId。
   * @ja type - イベント名または登録済み EventId。
   * @ko type - 이벤트 이름 또는 등록된 EventId입니다.
   * @param listener - Previously registered callback.
   * @zh listener - 已注册的回调。
   * @ja listener - 登録済みコールバック。
   * @ko listener - 등록된 콜백입니다.
   * @param capture - Original capture flag; defaults to false.
   * @zh capture - 原捕获阶段标志，默认为 false。
   * @ja capture - 登録時のキャプチャフラグ。既定値は false。
   * @ko capture - 등록 시 캡처 플래그이며 기본값은 false입니다.
   */
  removeEventListener(
    type: string | number, listener: RmlEventListener, capture = false,
  ): void {
    this.getRootElement().removeEventListener(type, listener, capture);
  }

  /**
   * Update the context dimensions, usually on window resize.
   *
   * @zh 更新上下文尺寸，通常在窗口缩放时调用。
   * @ja 通常はリサイズ時にコンテキストの寸法を更新します。
   * @ko 일반적으로 창 크기 변경 시 컨텍스트 크기를 갱신합니다.
   * @param width - Physical pixel width for Rml::Context::SetDimensions.
   * @zh width - 传给 Rml::Context::SetDimensions 的物理像素宽度。
   * @ja width - Rml::Context::SetDimensions に渡す物理ピクセル単位の幅。
   * @ko width - Rml::Context::SetDimensions에 전달할 물리 픽셀 너비입니다.
   * @param height - Height in physical pixels.
   * @zh height - 物理像素高度。
   * @ja height - 物理ピクセル単位の高さ。
   * @ko height - 물리 픽셀 높이입니다.
   */
  setDimensions(width: number, height: number): void {
    native.setDimensions(this.handle, width, height);
  }

  /**
   * Read the context's cached dimensions through shared native memory.
   *
   * @zh 通过原生共享内存读取上下文缓存尺寸。
   * @ja 共有ネイティブメモリからキャッシュされた寸法を読み取ります。
   * @ko 네이티브 공유 메모리에서 캐시된 크기를 읽습니다.
   * @returns Cached width and height view in physical pixels.
   * @zh 缓存宽高视图，单位为物理像素。
   * @ja 物理ピクセル単位の幅と高さのキャッシュビュー。
   * @ko 물리 픽셀 단위의 캐시된 너비와 높이 뷰입니다.
   * @remarks
   * The same view reflects setDimensions() and forwarded resize events.
   * Accessors have no setters. Use {@link Context.setDimensions} to change
   * layout. A retained view becomes zero when its context is destroyed.
   * @zh 同一视图会反映 setDimensions() 和已转发的尺寸变化事件。
   * 访问器没有设置器，必须通过 {@link Context.setDimensions} 修改布局。
   * 上下文销毁后，保留视图归零。
   * @ja 同じビューに setDimensions() と転送されたリサイズイベントが反映されます。
   * レイアウトの変更には {@link Context.setDimensions} を使ってください。
   * セッターはありません。コンテキスト破棄後に保持したビューは 0 になります。
   * @ko 같은 뷰에 setDimensions()와 전달된 크기 변경 이벤트가 반영됩니다.
   * 레이아웃 변경에는 {@link Context.setDimensions}를 사용하세요.
   * 설정자는 없으며 컨텍스트 파괴 후 유지된 뷰는 0이 됩니다.
   */
  get dimensions(): ContextDimensions {
    this.dimensionsView ??= mapStruct<ContextDimensions>(
      native.viewDimensions(this.handle), false,
    );
    return this.dimensionsView;
  }

  /**
   * Physical pixels per RCSS dp.
   *
   * @zh 每个 RCSS dp 对应的物理像素数。
   * @ja RCSS の 1 dp に対応する物理ピクセル数。
   * @ko RCSS dp당 물리 픽셀 수입니다.
   * @returns Current display density.
   * @zh 当前屏幕密度。
   * @ja 現在の表示密度。
   * @ko 현재 표시 밀도입니다.
   * @remarks
   * Corresponds to Rml::Context::GetDensityIndependentPixelRatio().
   * Auto mode refreshes from the window on creation, update and resize.
   * A manual ratio persists until setDensityIndependentPixelRatio(null).
   * @zh 对应 Rml::Context::GetDensityIndependentPixelRatio()。
   * 自动模式在创建、更新和缩放时从窗口刷新。手动值持续到传入 null 恢复自动模式。
   * @ja Rml::Context::GetDensityIndependentPixelRatio() に対応します。
   * 自動モードでは作成・更新・リサイズ時に同期します。手動値は null で解除します。
   * @ko Rml::Context::GetDensityIndependentPixelRatio()에 해당합니다.
   * 자동 모드에서는 생성, 갱신, 크기 변경 시 동기화하며 수동 값은 null로 해제합니다.
   */
  get densityIndependentPixelRatio(): number {
    return native.getDensityIndependentPixelRatio(this.handle);
  }

  /**
   * Set Rml::Context::SetDensityIndependentPixelRatio or restore auto mode.
   *
   * @zh 设置 Rml::Context::SetDensityIndependentPixelRatio，或恢复自动模式。
   * @ja Rml::Context::SetDensityIndependentPixelRatio を設定、または自動に戻します。
   * @ko Rml::Context::SetDensityIndependentPixelRatio를 설정하거나 자동으로 복원합니다.
   * @param ratio - Positive finite ratio; null resumes window synchronization.
   * @zh ratio - 正有限比率；null 恢复窗口同步。
   * @ja ratio - 正の有限比率。null でウィンドウ同期に戻します。
   * @ko ratio - 양의 유한 비율이며 null은 창 동기화를 복원합니다.
   */
  setDensityIndependentPixelRatio(ratio: number | null): void {
    native.setDensityIndependentPixelRatio(this.handle, ratio);
  }

  /**
   * Request RmlUi's next update after a nonnegative delay in seconds.
   *
   * @zh 请求 RmlUi 在非负秒数后更新。
   * @ja 非負の秒数後に RmlUi の更新を要求します。
   * @ko 음이 아닌 초 단위 지연 후 RmlUi 갱신을 요청합니다.
   * @param delay - Seconds, including zero and Infinity.
   * @zh delay - 秒数，允许零和 Infinity。
   * @ja delay - 秒数。0 と Infinity を許可します。
   * @ko delay - 초 단위이며 0과 Infinity를 허용합니다.
   * @remarks
   * Corresponds to Rml::Context::RequestNextUpdate. Only reduces the delay.
   * update() resets it before native elements request their next deadlines.
   * @zh 对应 Rml::Context::RequestNextUpdate，只缩短延迟。
   * update() 先重置延迟，再由原生元素请求后续更新时间。
   * @ja Rml::Context::RequestNextUpdate に対応し、遅延を短縮します。
   * update() がリセットしてからネイティブ要素が次の更新を要求します。
   * @ko Rml::Context::RequestNextUpdate에 해당하며 지연만 줄입니다.
   * update()가 재설정한 후 네이티브 요소가 다음 갱신을 요청합니다.
   */
  requestNextUpdate(delay: number): void {
    native.requestNextUpdate(this.handle, delay);
  }

  /**
   * Get the number of seconds until the next scheduled context update.
   *
   * @zh 获取距下次计划上下文更新的秒数。
   * @ja 次のコンテキスト更新予定までの秒数を取得します。
   * @ko 다음 예정 컨텍스트 갱신까지의 초를 가져옵니다.
   * @returns Seconds until update; Infinity means no pending native deadline.
   * @zh 距下次更新的秒数；Infinity 表示无原生更新期限。
   * @ja 更新までの秒数。Infinity はネイティブ更新要求がないことを示します。
   * @ko 갱신까지 남은 초이며 Infinity는 네이티브 갱신 기한이 없음을 뜻합니다.
   */
  getNextUpdateDelay(): number {
    return native.getNextUpdateDelay(this.handle);
  }

  /**
   * Control system cursor updates through Rml::Context::EnableMouseCursor.
   *
   * @zh 开关 RmlUi 鼠标光标。
   * @ja RmlUi によるマウスカーソルの制御を切り替えます。
   * @ko RmlUi의 마우스 커서 제어를 전환합니다.
   * @param enable - True lets RmlUi drive the system cursor.
   * @zh enable - 为 true 时由 RmlUi 控制系统光标。
   * @ja enable - true の場合、RmlUi がシステムカーソルを制御します。
   * @ko enable - true이면 RmlUi가 시스템 커서를 제어합니다.
   * @remarks
   * The next mouse update refreshes the enabled cursor. Disabling stops cursor
   * changes; it does not hide the system cursor.
   * @zh 启用后在下一次鼠标更新时刷新光标。禁用后停止修改光标，不会隐藏系统光标。
   * @ja 有効にすると次のマウス更新で同期します。無効にしてもカーソルは非表示になりません。
   * @ko 활성화하면 다음 마우스 갱신에서 동기화합니다. 비활성화해도 커서를 숨기지 않습니다.
   */
  enableMouseCursor(enable: boolean): void {
    native.enableMouseCursor(this.handle, enable);
  }

  /**
   * Enable or disable a named RCSS media theme (Rml::Context::ActivateTheme).
   *
   * @zh 启用或禁用命名 RCSS 媒体主题，对应 Rml::Context::ActivateTheme。
   * @ja Rml::Context::ActivateTheme で名前付き RCSS メディアテーマを切り替えます。
   * @ko Rml::Context::ActivateTheme으로 이름 있는 RCSS 미디어 테마를 전환합니다.
   * @param name - Theme name used in `@media (theme: name)`.
   * @zh name - `@media (theme: name)` 中使用的主题名称。
   * @ja name - `@media (theme: name)` に使うテーマ名。
   * @ko name - `@media (theme: name)`에 사용할 테마 이름입니다.
   * @param activate - True enables the theme; false disables it.
   * @zh activate - 为 true 时启用，为 false 时禁用。
   * @ja activate - true で有効、false で無効にします。
   * @ko activate - true이면 활성화하고 false이면 비활성화합니다.
   */
  activateTheme(name: string, activate: boolean): void {
    native.activateTheme(this.handle, name, activate);
  }

  /**
   * Query a named theme (Rml::Context::IsThemeActive).
   *
   * @zh 查询命名主题状态，对应 Rml::Context::IsThemeActive。
   * @ja Rml::Context::IsThemeActive でテーマの状態を取得します。
   * @ko Rml::Context::IsThemeActive로 테마 상태를 조회합니다.
   * @param name - Theme name.
   * @zh name - 主题名称。
   * @ja name - テーマ名。
   * @ko name - 테마 이름입니다.
   * @returns Whether the theme is active.
   * @zh 主题是否已启用。
   * @ja テーマが有効かどうか。
   * @ko 테마의 활성화 여부입니다.
   */
  isThemeActive(name: string): boolean {
    return native.isThemeActive(this.handle, name);
  }

  /**
   * Run layout and event dispatch for this frame.
   *
   * @zh 执行本帧的布局与事件分发。
   * @ja このフレームのレイアウトとイベント処理を実行します。
   * @ko 이번 프레임의 레이아웃과 이벤트 처리를 실행합니다.
   * @returns The native update result, currently always true.
   * @zh 原生更新结果，当前始终为 true。
   * @ja ネイティブの更新結果。現在は常に true。
   * @ko 네이티브 갱신 결과이며 현재는 항상 true입니다.
   * @remarks
   * RmlUi 6.3's Rml::Context::Update always returns true.
   * This is not an activity flag. Call once per frame before render(),
   * even when no input arrived.
   * @zh RmlUi 6.3 的 Rml::Context::Update 始终返回 true，不表示活动状态。
   * 每帧在 render() 前调用，即使没有输入。
   * @ja RmlUi 6.3 の Rml::Context::Update は常に true を返し、活動状態を示しません。
   * 入力がなくても毎フレーム render() 前に呼び出してください。
   * @ko RmlUi 6.3의 Rml::Context::Update는 항상 true를 반환하며 활성 상태가 아닙니다.
   * 입력이 없어도 매 프레임 render() 전에 호출하세요.
   */
  update(): boolean {
    return native.update(this.handle);
  }

  /**
   * Compile and submit geometry for this frame.
   *
   * @zh 编译并提交本帧几何。
   * @ja このフレームのジオメトリをコンパイルして描画します。
   * @ko 이번 프레임의 지오메트리를 컴파일하고 제출합니다.
   * @returns The native render result, currently always true.
   * @zh 原生渲染结果，当前始终为 true。
   * @ja ネイティブの描画結果。現在は常に true。
   * @ko 네이티브 렌더링 결과이며 현재는 항상 true입니다.
   * @remarks
   * RmlUi 6.3's Rml::Context::Render returns true even with no geometry.
   * Flush queued sfml.js drawing before calling, then present with display().
   * The renderer changes the window view and scissor. Reapply the scene view
   * with window.setView(sceneView) before recording scene draws each frame.
   * @zh RmlUi 6.3 的 Rml::Context::Render 即使没有几何也返回 true。
   * 调用前先 flush 已录制的 sfml.js 绘制，随后通过 display() 显示。
   * 渲染器会修改窗口视图及裁剪区域。每帧录制场景绘制前，
   * 用 window.setView(sceneView) 重新设置场景视图。
   * @ja RmlUi 6.3 の Rml::Context::Render はジオメトリがなくても true を返します。
   * 呼び出し前に sfml.js の描画キューを flush し、後で display() してください。
   * ウィンドウのビューとクリップ領域が変更されます。毎フレーム、シーン描画の
   * 記録前に window.setView(sceneView) でビューを再設定してください。
   * @ko RmlUi 6.3의 Rml::Context::Render는 지오메트리가 없어도 true를 반환합니다.
   * 호출 전에 sfml.js 그리기 큐를 flush하고 이후 display()로 표시하세요.
   * 창 뷰와 클립 영역이 변경됩니다. 매 프레임 장면 그리기를 기록하기 전에
   * window.setView(sceneView)로 장면 뷰를 다시 설정하세요.
   */
  render(): boolean {
    return native.render(this.handle);
  }

  /**
   * Forward an sfml.js window event to the RmlUi context.
   *
   * @zh 将 sfml.js 窗口事件转交给 RmlUi 上下文。
   * @ja sfml.js のウィンドウイベントを RmlUi に転送します。
   * @ko sfml.js 창 이벤트를 RmlUi에 전달합니다.
   * @param event - sfml.js event object or event data.
   * @zh event - sfml.js 事件对象或事件数据。
   * @ja event - sfml.js のイベントオブジェクトまたはイベントデータ。
   * @ko event - sfml.js 이벤트 객체 또는 이벤트 데이터입니다.
   * @returns Propagation or interaction result; true for ignored events.
   * @zh 上游传播或交互结果；忽略的事件返回 true。
   * @ja 上流の伝播または操作の結果。無視するイベントでは true。
   * @ko 상위 라이브러리의 전파 또는 상호작용 결과입니다. 무시한 이벤트는 true입니다.
   * @remarks
   * Key, text and wheel events return propagation; mouse/touch input returns
   * whether no element is interacting. Coordinates use physical pixels.
   * Key modifiers come from the event snapshot; pointer modifiers use live
   * keyboard state. Touch events forward a one-entry TouchList.
   * SFML system keys map to LMETA/RMETA on macOS and LWIN/RWIN elsewhere.
   * TextEntered normalizes CR to LF and skips other control characters.
   * Resize events update dimensions and density automatically.
   * @zh 键盘、文本和滚轮返回传播状态；鼠标、触摸返回是否未与元素交互。
   * 坐标使用物理像素。键盘修饰键来自事件快照，指针修饰键来自实时键盘状态。
   * 触摸事件转为单条 TouchList。系统键在 macOS 映射为 LMETA/RMETA，
   * 其他平台为 LWIN/RWIN。TextEntered 将 CR 转为 LF 并跳过其他控制字符。
   * 尺寸变化事件自动更新尺寸与密度。
   * @ja キー・テキスト・ホイールは伝播状態、マウス・タッチは要素と操作していないかを返します。
   * 座標は物理ピクセルです。キー修飾はイベントのスナップショット、ポインター修飾は現在の状態です。
   * タッチは 1 要素の TouchList に変換します。システムキーは macOS で LMETA/RMETA、
   * 他で LWIN/RWIN です。TextEntered は CR を LF に変換し、他の制御文字を除外します。
   * リサイズで寸法と密度も更新します。
   * @ko 키·텍스트·휠은 전파 상태, 마우스·터치는 요소와 상호작용하지 않는지 반환합니다.
   * 좌표는 물리 픽셀입니다. 키 보조 키는 이벤트 스냅샷, 포인터 보조 키는 현재 상태입니다.
   * 터치는 항목 하나의 TouchList로 전달합니다. 시스템 키는 macOS에서 LMETA/RMETA,
   * 다른 플랫폼에서 LWIN/RWIN입니다. TextEntered는 CR을 LF로 바꾸고 다른 제어 문자를 건너뜁니다.
   * 크기 변경 시 크기와 밀도를 갱신합니다.
   */
  processEvent(event: Event | EventData): boolean {
    const data = event instanceof Event ? event.data : event;
    return native.processEvent(this.handle, data as unknown as object);
  }

  /**
   * Send Rml::Context::ProcessKeyDown, including custom keys (177–250).
   *
   * @zh 调用 Rml::Context::ProcessKeyDown，传入 KeyIdentifier 或自定义键（177–250）。
   * @ja KeyIdentifier またはカスタムキー（177–250）で Rml::Context::ProcessKeyDown を呼びます。
   * @ko KeyIdentifier 또는 사용자 키(177–250)로 Rml::Context::ProcessKeyDown을 호출합니다.
   * @param key - RmlUi key identifier, not an SFML key code.
   * @zh key - RmlUi 按键标识，与 SFML 键码不同。
   * @ja key - SFML キーコードとは異なる RmlUi キー識別子。
   * @ko key - SFML 키 코드와 다른 RmlUi 키 식별자입니다.
   * @param modifiers - Bitwise OR of KeyModifier flags; defaults to 0.
   * @zh modifiers - KeyModifier 标志按位或，默认 0。
   * @ja modifiers - KeyModifier フラグのビット OR。既定値は 0。
   * @ko modifiers - KeyModifier 플래그의 비트 OR이며 기본값은 0입니다.
   * @returns Whether the event remains propagating.
   * @zh 事件是否仍在传播。
   * @ja イベントが引き続き伝播するかどうか。
   * @ko 이벤트 전파가 계속되는지 여부입니다.
   */
  processKeyDown(key: number, modifiers = 0): boolean {
    return native.processKeyDown(this.handle, key, modifiers);
  }

  /**
   * Send Rml::Context::ProcessKeyUp.
   *
   * @zh 调用 Rml::Context::ProcessKeyUp。
   * @ja Rml::Context::ProcessKeyUp を呼びます。
   * @ko Rml::Context::ProcessKeyUp을 호출합니다.
   * @param key - RmlUi KeyIdentifier or custom key (177–250).
   * @zh key - RmlUi KeyIdentifier 或自定义键（177–250）。
   * @ja key - RmlUi KeyIdentifier またはカスタムキー（177–250）。
   * @ko key - RmlUi KeyIdentifier 또는 사용자 키(177–250)입니다.
   * @param modifiers - KeyModifier flags; defaults to 0.
   * @zh modifiers - KeyModifier 标志，默认 0。
   * @ja modifiers - KeyModifier フラグ。既定値は 0。
   * @ko modifiers - KeyModifier 플래그이며 기본값은 0입니다.
   * @returns Whether the event remains propagating.
   * @zh 事件是否仍在传播。
   * @ja イベントが引き続き伝播するかどうか。
   * @ko 이벤트 전파가 계속되는지 여부입니다.
   */
  processKeyUp(key: number, modifiers = 0): boolean {
    return native.processKeyUp(this.handle, key, modifiers);
  }

  /**
   * Send Unicode text through Rml::Context::ProcessTextInput.
   *
   * @zh 通过 Rml::Context::ProcessTextInput 输入 Unicode 文本。
   * @ja Rml::Context::ProcessTextInput で Unicode テキストを入力します。
   * @ko Rml::Context::ProcessTextInput으로 Unicode 텍스트를 입력합니다.
   * @param text - String or Unicode scalar; isolated surrogates are rejected.
   * @zh text - 字符串或 Unicode 标量数值；拒绝孤立代理项。
   * @ja text - 文字列または Unicode スカラー値。単独サロゲートは拒否します。
   * @ko text - 문자열 또는 Unicode 스칼라 값입니다. 단독 서로게이트는 거부합니다.
   * @returns Whether the event remains propagating.
   * @zh 事件是否仍在传播。
   * @ja イベントが引き続き伝播するかどうか。
   * @ko 이벤트 전파가 계속되는지 여부입니다.
   * @remarks
   * A string produces one textinput event. Numeric ASCII and Unicode inputs use
   * the character overload. Direct input preserves control characters.
   * @zh 字符串产生一个 textinput 事件；ASCII 和 Unicode 数值使用字符重载。
   * 直接输入保留控制字符。
   * @ja 文字列は 1 回の textinput イベントになり、数値は文字のオーバーロードを使います。
   * 直接入力では制御文字を保持します。
   * @ko 문자열은 textinput 이벤트 하나를 생성하며 숫자는 문자 오버로드를 사용합니다.
   * 직접 입력은 제어 문자를 유지합니다.
   */
  processTextInput(text: string | number): boolean {
    return native.processTextInput(this.handle, text);
  }

  /**
   * Call Rml::Context::ProcessTextInput(char) with one byte.
   *
   * @zh 用单个字节调用 Rml::Context::ProcessTextInput(char)。
   * @ja 1 バイトで Rml::Context::ProcessTextInput(char) を呼びます。
   * @ko 한 바이트로 Rml::Context::ProcessTextInput(char)를 호출합니다.
   * @param byte - Integer from 0 to 255.
   * @zh byte - 0 到 255 的整数。
   * @ja byte - 0 から 255 の整数。
   * @ko byte - 0부터 255까지의 정수입니다.
   * @returns Whether the event remains propagating; high bytes return false.
   * @zh 事件是否仍在传播；高位字节返回 false。
   * @ja イベントが引き続き伝播するか。上位バイトは false を返します。
   * @ko 이벤트 전파가 계속되는지 여부이며 상위 바이트는 false를 반환합니다.
   * @remarks
   * ASCII bytes 0–127 preserve control characters. Bytes 128–255 produce no
   * event, matching the native char overload. Use {@link processTextInput}
   * for Unicode scalars or strings.
   * @zh ASCII 字节 0–127 保留控制字符；128–255 不产生事件，与原生 char
   * 重载一致。Unicode 标量或字符串使用 {@link processTextInput}。
   * @ja ASCII バイト 0–127 は制御文字を保持し、128–255 はネイティブ char
   * と同じくイベントを発生させません。Unicode は {@link processTextInput} を使います。
   * @ko ASCII 바이트 0–127은 제어 문자를 유지하며 128–255는 네이티브 char와
   * 동일하게 이벤트를 생성하지 않습니다. Unicode는 {@link processTextInput}을 사용합니다.
   */
  processTextInputChar(byte: number): boolean {
    return native.processTextInputChar(this.handle, byte);
  }

  /**
   * Send Rml::Context::ProcessMouseMove in physical window pixels.
   *
   * @zh 按窗口物理像素调用 Rml::Context::ProcessMouseMove。
   * @ja ウィンドウの物理ピクセルで Rml::Context::ProcessMouseMove を呼びます。
   * @ko 창의 물리 픽셀로 Rml::Context::ProcessMouseMove를 호출합니다.
   * @param x - Signed 32-bit horizontal coordinate.
   * @zh x - 32 位有符号横坐标。
   * @ja x - 符号付き 32 ビットの水平座標。
   * @ko x - 부호 있는 32비트 가로 좌표입니다.
   * @param y - Signed 32-bit vertical coordinate.
   * @zh y - 32 位有符号纵坐标。
   * @ja y - 符号付き 32 ビットの垂直座標。
   * @ko y - 부호 있는 32비트 세로 좌표입니다.
   * @param modifiers - KeyModifier flags; defaults to 0.
   * @zh modifiers - KeyModifier 标志，默认 0。
   * @ja modifiers - KeyModifier フラグ。既定値は 0。
   * @ko modifiers - KeyModifier 플래그이며 기본값은 0입니다.
   * @returns True when the mouse is not interacting with an element.
   * @zh 鼠标未与元素交互时返回 true。
   * @ja マウスが要素と操作中でなければ true。
   * @ko 마우스가 요소와 상호작용하지 않으면 true입니다.
   */
  processMouseMove(x: number, y: number, modifiers = 0): boolean {
    return native.processMouseMove(this.handle, x, y, modifiers);
  }

  /**
   * Send Rml::Context::ProcessMouseButtonDown at the last mouse position.
   *
   * @zh 在上次鼠标位置调用 Rml::Context::ProcessMouseButtonDown。
   * @ja 最後のマウス位置で Rml::Context::ProcessMouseButtonDown を呼びます。
   * @ko 마지막 마우스 위치에서 Rml::Context::ProcessMouseButtonDown을 호출합니다.
   * @param button - Nonnegative button index: left 0, right 1, middle 2.
   * @zh button - 非负按键索引：左键 0、右键 1、中键 2。
   * @ja button - 非負のボタン番号。左 0、右 1、中央 2。
   * @ko button - 음수가 아닌 버튼 번호입니다. 왼쪽 0, 오른쪽 1, 가운데 2입니다.
   * @param modifiers - KeyModifier flags; defaults to 0.
   * @zh modifiers - KeyModifier 标志，默认 0。
   * @ja modifiers - KeyModifier フラグ。既定値は 0。
   * @ko modifiers - KeyModifier 플래그이며 기본값은 0입니다.
   * @returns True when the mouse is not interacting with an element.
   * @zh 鼠标未与元素交互时返回 true。
   * @ja マウスが要素と操作中でなければ true。
   * @ko 마우스가 요소와 상호작용하지 않으면 true입니다.
   */
  processMouseButtonDown(button: number, modifiers = 0): boolean {
    return native.processMouseButtonDown(this.handle, button, modifiers);
  }

  /**
   * Send Rml::Context::ProcessMouseButtonUp at the last mouse position.
   *
   * @zh 在上次鼠标位置调用 Rml::Context::ProcessMouseButtonUp。
   * @ja 最後のマウス位置で Rml::Context::ProcessMouseButtonUp を呼びます。
   * @ko 마지막 마우스 위치에서 Rml::Context::ProcessMouseButtonUp을 호출합니다.
   * @param button - Nonnegative button index: left 0, right 1, middle 2.
   * @zh button - 非负按键索引：左键 0、右键 1、中键 2。
   * @ja button - 非負のボタン番号。左 0、右 1、中央 2。
   * @ko button - 음수가 아닌 버튼 번호입니다. 왼쪽 0, 오른쪽 1, 가운데 2입니다.
   * @param modifiers - KeyModifier flags; defaults to 0.
   * @zh modifiers - KeyModifier 标志，默认 0。
   * @ja modifiers - KeyModifier フラグ。既定値は 0。
   * @ko modifiers - KeyModifier 플래그이며 기본값은 0입니다.
   * @returns True when the mouse is not interacting with an element.
   * @zh 鼠标未与元素交互时返回 true。
   * @ja マウスが要素と操作中でなければ true。
   * @ko 마우스가 요소와 상호작용하지 않으면 true입니다.
   */
  processMouseButtonUp(button: number, modifiers = 0): boolean {
    return native.processMouseButtonUp(this.handle, button, modifiers);
  }

  /**
   * Send Rml::Context::ProcessMouseWheel.
   *
   * @zh 调用 Rml::Context::ProcessMouseWheel。
   * @ja Rml::Context::ProcessMouseWheel を呼びます。
   * @ko Rml::Context::ProcessMouseWheel을 호출합니다.
   * @param delta - Wheel vector, positive right/down.
   * A number uses the deprecated vertical overload.
   * @zh delta - 滚轮向量：正值向右、向下。数值对应已弃用的垂直滚轮重载。
   * @ja delta - 正値が右・下のホイールベクトル。数値は非推奨の垂直オーバーロードに対応します。
   * @ko delta - 양수가 오른쪽과 아래인 휠 벡터입니다. 숫자는 사용 중단된 수직 오버로드입니다.
   * @param modifiers - KeyModifier flags; defaults to 0.
   * @zh modifiers - KeyModifier 标志，默认 0。
   * @ja modifiers - KeyModifier フラグ。既定値は 0。
   * @ko modifiers - KeyModifier 플래그이며 기본값은 0입니다.
   * @returns Whether the event remains propagating.
   * @zh 事件是否仍在传播。
   * @ja イベントが引き続き伝播するかどうか。
   * @ko 이벤트 전파가 계속되는지 여부입니다.
   */
  processMouseWheel(delta: VariantVector2 | number, modifiers = 0): boolean {
    return native.processMouseWheel(this.handle, delta, modifiers);
  }

  /**
   * Clear hover with Rml::Context::ProcessMouseLeave until the next mouse move.
   *
   * @zh 调用 Rml::Context::ProcessMouseLeave 清除悬停，直至下次鼠标移动。
   * @ja Rml::Context::ProcessMouseLeave で、次の移動までホバーを解除します。
   * @ko Rml::Context::ProcessMouseLeave로 다음 이동까지 호버를 해제합니다.
   * @returns True when the mouse is not interacting with an element.
   * @zh 鼠标未与元素交互时返回 true。
   * @ja マウスが要素と操作中でなければ true。
   * @ko 마우스가 요소와 상호작용하지 않으면 true입니다.
   */
  processMouseLeave(): boolean {
    return native.processMouseLeave(this.handle);
  }

  /**
   * Current Rml::Context::IsMouseInteracting hint, independent of opacity.
   *
   * @zh Rml::Context::IsMouseInteracting 的当前交互提示，与不透明度无关。
   * @ja 不透明度に依存しない Rml::Context::IsMouseInteracting の現在のヒント。
   * @ko 불투명도와 무관한 현재 Rml::Context::IsMouseInteracting 힌트입니다.
   * @returns Whether an element is hovered, active, or autoscrolling.
   * @zh 是否存在悬停、激活元素或自动滚动。
   * @ja 要素がホバー、アクティブ、または自動スクロール状態かどうか。
   * @ko 요소가 호버, 활성 또는 자동 스크롤 상태인지 여부입니다.
   */
  get isMouseInteracting(): boolean {
    return native.isMouseInteracting(this.handle);
  }

  /**
   * Start every touch with Rml::Context::ProcessTouchStart.
   *
   * @zh 通过 Rml::Context::ProcessTouchStart 开始列表中的所有触点。
   * @ja Rml::Context::ProcessTouchStart ですべてのタッチを開始します。
   * @ko Rml::Context::ProcessTouchStart로 모든 터치를 시작합니다.
   * @param touches - Touch list, processed in order after full validation.
   * @zh touches - 完整校验后按顺序处理的触点列表。
   * @ja touches - 全体を検証してから順番に処理するタッチ一覧。
   * @ko touches - 전체 검증 후 순서대로 처리하는 터치 목록입니다.
   * @param modifiers - KeyModifier flags; defaults to 0.
   * @zh modifiers - KeyModifier 标志，默认 0。
   * @ja modifiers - KeyModifier フラグ。既定値は 0。
   * @ko modifiers - KeyModifier 플래그이며 기본값은 0입니다.
   * @returns AND of upstream interaction results; true for an empty list.
   * @zh 上游交互结果的逻辑与；空列表返回 true。
   * @ja 上流の操作結果の論理 AND。空一覧では true。
   * @ko 상위 라이브러리 상호작용 결과의 논리 AND입니다. 빈 목록은 true입니다.
   */
  processTouchStart(touches: readonly Touch[], modifiers = 0): boolean {
    return native.processTouchStart(this.handle, touches, modifiers);
  }

  /**
   * Move every touch with Rml::Context::ProcessTouchMove.
   *
   * @zh 通过 Rml::Context::ProcessTouchMove 移动所有触点。
   * @ja Rml::Context::ProcessTouchMove ですべてのタッチを移動します。
   * @ko Rml::Context::ProcessTouchMove로 모든 터치를 이동합니다.
   * @param touches - Ordered touch list.
   * @zh touches - 有序触点列表。
   * @ja touches - 順序付きタッチ一覧。
   * @ko touches - 순서가 있는 터치 목록입니다.
   * @param modifiers - KeyModifier flags; defaults to 0.
   * @zh modifiers - KeyModifier 标志，默认 0。
   * @ja modifiers - KeyModifier フラグ。既定値は 0。
   * @ko modifiers - KeyModifier 플래그이며 기본값은 0입니다.
   * @returns AND of results; unknown touches and empty lists return true.
   * @zh 各结果的逻辑与；未知触点和空列表返回 true。
   * @ja 結果の論理 AND。不明なタッチと空一覧は true。
   * @ko 결과의 논리 AND입니다. 알 수 없는 터치와 빈 목록은 true입니다.
   */
  processTouchMove(touches: readonly Touch[], modifiers = 0): boolean {
    return native.processTouchMove(this.handle, touches, modifiers);
  }

  /**
   * Release every touch with Rml::Context::ProcessTouchEnd.
   *
   * @zh 通过 Rml::Context::ProcessTouchEnd 释放所有触点。
   * @ja Rml::Context::ProcessTouchEnd ですべてのタッチを解放します。
   * @ko Rml::Context::ProcessTouchEnd로 모든 터치를 해제합니다.
   * @param touches - Ordered touch list.
   * @zh touches - 有序触点列表。
   * @ja touches - 順序付きタッチ一覧。
   * @ko touches - 순서가 있는 터치 목록입니다.
   * @param modifiers - KeyModifier flags; defaults to 0.
   * @zh modifiers - KeyModifier 标志，默认 0。
   * @ja modifiers - KeyModifier フラグ。既定値は 0。
   * @ko modifiers - KeyModifier 플래그이며 기본값은 0입니다.
   * @returns AND of results; unknown touches and empty lists return true.
   * @zh 各结果的逻辑与；未知触点和空列表返回 true。
   * @ja 結果の論理 AND。不明なタッチと空一覧は true。
   * @ko 결과의 논리 AND입니다. 알 수 없는 터치와 빈 목록은 true입니다.
   */
  processTouchEnd(touches: readonly Touch[], modifiers = 0): boolean {
    return native.processTouchEnd(this.handle, touches, modifiers);
  }

  /**
   * Cancel touches with Rml::Context::ProcessTouchCancel.
   *
   * @zh 通过 Rml::Context::ProcessTouchCancel 取消触点。
   * @ja Rml::Context::ProcessTouchCancel でタッチを取り消します。
   * @ko Rml::Context::ProcessTouchCancel로 터치를 취소합니다.
   * @param touches - Ordered touch list.
   * @zh touches - 有序触点列表。
   * @ja touches - 順序付きタッチ一覧。
   * @ko touches - 순서가 있는 터치 목록입니다.
   * @returns AND of results; unknown touches return false, empty lists true.
   * @zh 各结果的逻辑与；未知触点返回 false，空列表返回 true。
   * @ja 結果の論理 AND。不明なタッチは false、空一覧は true。
   * @ko 결과의 논리 AND입니다. 알 수 없는 터치는 false, 빈 목록은 true입니다.
   * @remarks
   * RmlUi 6.3 simulates left-button release with no modifiers. This may click.
   * @zh RmlUi 6.3 模拟不带修饰键的左键释放，可能触发点击。
   * @ja RmlUi 6.3 は修飾キーなしの左ボタン解放を模擬し、クリックが発生する場合があります。
   * @ko RmlUi 6.3은 보조 키 없는 왼쪽 버튼 해제를 모방하며 클릭이 발생할 수 있습니다.
   */
  processTouchCancel(touches: readonly Touch[]): boolean {
    return native.processTouchCancel(this.handle, touches);
  }

  /**
   * Create an empty document through Rml::Context::CreateDocument.
   *
   * @zh 通过 Rml::Context::CreateDocument 创建空文档。
   * @ja Rml::Context::CreateDocument で空の文書を作成します。
   * @ko Rml::Context::CreateDocument로 빈 문서를 만듭니다.
   * @param instancerName - Registered document instancer; defaults to "body".
   * @zh instancerName - 注册的文档实例工厂名称，默认 "body"。
   * @ja instancerName - 登録済み文書インスタンサー名。既定値は "body"。
   * @ko instancerName - 등록된 문서 인스턴서 이름이며 기본값은 "body"입니다.
   * @returns Context-owned document, or null if the factory fails.
   * @zh 由上下文持有的文档，工厂失败时返回 null。
   * @ja コンテキストが所有する文書。ファクトリー失敗時は null。
   * @ko 컨텍스트가 소유하는 문서이며 팩토리 실패 시 null입니다.
   */
  createDocument(instancerName = 'body'): Document | null {
    const handle = native.createDocument(this.handle, instancerName);
    return handle === null ? null : new Document(handle);
  }

  /**
   * Find a document through either Rml::Context::GetDocument overload.
   *
   * @zh 通过 Rml::Context::GetDocument 的两个重载查找文档。
   * @ja Rml::Context::GetDocument の両オーバーロードで文書を探します。
   * @ko Rml::Context::GetDocument의 두 오버로드로 문서를 찾습니다.
   * @param idOrIndex - Document id or zero-based int32 index in stack order.
   * @zh idOrIndex - 文档 id 或按栈顺序从零开始的 int32 索引。
   * @ja idOrIndex - 文書 id、またはスタック順の 0 始まりの int32 添字。
   * @ko idOrIndex - 문서 id 또는 스택 순서의 0부터 시작하는 int32 인덱스입니다.
   * @returns First match, or null for missing ids and out-of-range indices.
   * @zh 首个匹配文档；id 不存在或索引越界时返回 null。
   * @ja 最初の一致文書。id がない場合や範囲外は null。
   * @ko 첫 번째 일치 문서이며 id가 없거나 범위 밖이면 null입니다.
   */
  getDocument(idOrIndex: string | number): Document | null {
    const handle = native.getDocument(this.handle, idOrIndex);
    return handle === null ? null : new Document(handle);
  }

  /**
   * Count loaded documents through Rml::Context::GetNumDocuments.
   *
   * @zh 通过 Rml::Context::GetNumDocuments 统计已加载文档。
   * @ja Rml::Context::GetNumDocuments で読み込み済み文書を数えます。
   * @ko Rml::Context::GetNumDocuments로 로드된 문서 수를 셉니다.
   * @returns Count excluding documents queued for destruction.
   * @zh 文档数量，不包含待销毁文档。
   * @ja 破棄待ちの文書を除いた数。
   * @ko 파괴 대기 문서를 제외한 수입니다.
   */
  getNumDocuments(): number {
    return native.getNumDocuments(this.handle);
  }

  /**
   * Queue destruction through Rml::Context::UnloadDocument.
   *
   * @zh 通过 Rml::Context::UnloadDocument 排队销毁文档。
   * @ja Rml::Context::UnloadDocument で文書の破棄を予約します。
   * @ko Rml::Context::UnloadDocument로 문서 파괴를 예약합니다.
   * @param document - Document belonging to this context.
   * @zh document - 属于本上下文的文档。
   * @ja document - このコンテキストに属する文書。
   * @ko document - 이 컨텍스트에 속한 문서입니다.
   * @remarks
   * Dispatches unload synchronously, then removes the document from lookup.
   * Destruction occurs on update; already queued documents are ignored.
   * @zh 同步派发 unload 后从查询列表移除，在 update 时销毁。重复卸载待销毁文档无操作。
   * @ja unload を同期送信後に検索から除き、update で破棄します。予約済みなら何もしません。
   * @ko unload를 동기 전달한 뒤 조회에서 제외하고 update에서 파괴합니다. 예약된 문서는 무시합니다.
   */
  unloadDocument(document: Document): void {
    native.unloadDocument(this.handle, document.handle);
  }

  /**
   * Queue all documents through Rml::Context::UnloadAllDocuments.
   *
   * @zh 通过 Rml::Context::UnloadAllDocuments 将所有文档加入销毁队列。
   * @ja Rml::Context::UnloadAllDocuments で全ての文書の破棄を予約します。
   * @ko Rml::Context::UnloadAllDocuments로 모든 문서의 파괴를 예약합니다.
   */
  unloadAllDocuments(): void {
    native.unloadAllDocuments(this.handle);
  }

  /**
   * Move a document to the front through Rml::Context::PullDocumentToFront.
   *
   * @zh 通过 Rml::Context::PullDocumentToFront 将文档移至栈顶。
   * @ja Rml::Context::PullDocumentToFront で文書を最前面に移動します。
   * @ko Rml::Context::PullDocumentToFront로 문서를 맨 앞으로 이동합니다.
   * @param document - Document belonging to this context.
   * @zh document - 属于本上下文的文档。
   * @ja document - このコンテキストに属する文書。
   * @ko document - 이 컨텍스트에 속한 문서입니다.
   */
  pullDocumentToFront(document: Document): void {
    native.pullDocumentToFront(this.handle, document.handle);
  }

  /**
   * Move a document to the back through Rml::Context::PushDocumentToBack.
   *
   * @zh 通过 Rml::Context::PushDocumentToBack 将文档移至栈底。
   * @ja Rml::Context::PushDocumentToBack で文書を最背面に移動します。
   * @ko Rml::Context::PushDocumentToBack으로 문서를 맨 뒤로 이동합니다.
   * @param document - Document belonging to this context.
   * @zh document - 属于本上下文的文档。
   * @ja document - このコンテキストに属する文書。
   * @ko document - 이 컨텍스트에 속한 문서입니다.
   */
  pushDocumentToBack(document: Document): void {
    native.pushDocumentToBack(this.handle, document.handle);
  }

  /**
   * Restore previous document focus through Rml::Context::UnfocusDocument.
   *
   * @zh 通过 Rml::Context::UnfocusDocument 恢复前一个文档的焦点。
   * @ja Rml::Context::UnfocusDocument で以前の文書にフォーカスを戻します。
   * @ko Rml::Context::UnfocusDocument로 이전 문서의 포커스를 복원합니다.
   * @param document - Document to remove from this context's focus history.
   * @zh document - 从本上下文焦点历史移除的文档。
   * @ja document - このコンテキストのフォーカス履歴から除く文書。
   * @ko document - 이 컨텍스트의 포커스 기록에서 제거할 문서입니다.
   */
  unfocusDocument(document: Document): void {
    native.unfocusDocument(this.handle, document.handle);
  }

  /**
   * Get the element under the pointer after the latest input or update.
   *
   * @zh 获取最近输入或更新后指针下的元素。
   * @ja 直近の入力または更新後にポインター下にある要素を取得します。
   * @ko 최근 입력 또는 갱신 후 포인터 아래 요소를 가져옵니다.
   * @returns Hovered element from the latest input/update, or null.
   * @zh 最近输入或更新得到的悬停元素，不存在时返回 null。
   * @ja 最後の入力・更新によるホバー要素。なければ null。
   * @ko 최근 입력 또는 갱신에 따른 호버 요소이며 없으면 null입니다.
   */
  getHoverElement(): Element | null {
    const handle = native.getHoverElement(this.handle);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Get the element that currently holds input focus.
   *
   * @zh 获取当前拥有输入焦点的元素。
   * @ja 現在入力フォーカスを持つ要素を取得します。
   * @ko 현재 입력 포커스를 가진 요소를 가져옵니다.
   * @returns Focused element, which may be the context root, or null.
   * @zh 焦点元素，可能是上下文根元素；无焦点时返回 null。
   * @ja フォーカス要素。ルートの場合もあります。なければ null。
   * @ko 포커스 요소로 루트일 수도 있으며 없으면 null입니다.
   */
  getFocusElement(): Element | null {
    const handle = native.getFocusElement(this.handle);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Hit-test current layout through Rml::Context::GetElementAtPoint.
   *
   * @zh 通过 Rml::Context::GetElementAtPoint 对当前布局执行命中测试。
   * @ja Rml::Context::GetElementAtPoint で現在のレイアウトをヒットテストします。
   * @ko Rml::Context::GetElementAtPoint로 현재 레이아웃을 히트 테스트합니다.
   * @param point - Physical pixels; float-rounded coordinates must fit int32.
   * @zh point - 物理像素坐标，转为 float 后必须在 int32 范围内。
   * @ja point - 物理ピクセル座標。float 丸め後に int32 範囲内である必要があります。
   * @ko point - 물리 픽셀 좌표로 float 반올림 후 int32 범위 안이어야 합니다.
   * @param ignoreElement - Ignore this subtree; default null.
   * @zh ignoreElement - 忽略此子树，默认 null。
   * @ja ignoreElement - 無視するサブツリー。既定値は null。
   * @ko ignoreElement - 무시할 하위 트리이며 기본값은 null입니다.
   * @param element - Native search root, or null for the context root.
   * @zh element - 原生搜索根节点，null 表示上下文根节点。
   * @ja element - ネイティブ検索ルート。null はコンテキストルートです。
   * @ko element - 네이티브 검색 루트이며 null은 컨텍스트 루트입니다.
   * @returns Deepest hit, or null. Arguments must belong to this context.
   * @zh 最深命中元素或 null；元素参数必须属于本上下文。
   * @ja 最深のヒット要素、または null。
   * 要素引数はこのコンテキストに属する必要があります。
   * @ko 가장 깊은 히트 요소 또는 null이며 요소 인수는 이 컨텍스트에 속해야 합니다.
   * @remarks
   * RmlUi refreshes transform matrices during render(). Transformed hit tests
   * use the last rendered matrices, and upstream clipping compares the
   * inverse-projected point with the ancestor clip rectangle.
   * @zh RmlUi 在 render() 时刷新变换矩阵。变换命中测试使用最近渲染的矩阵，
   * 原生裁剪使用逆变换后的坐标与祖先裁剪矩形比较。
   * @ja 変換行列は render() で更新されます。最後に描画した行列を使い、
   * クリッピングでは逆投影した座標を祖先のクリップ矩形と比較します。
   * @ko 변환 행렬은 render()에서 갱신됩니다. 마지막 렌더링 행렬을 사용하며,
   * 클리핑은 역투영 좌표와 조상의 클립 사각형을 비교합니다.
   */
  getElementAtPoint(
    point: VariantVector2, ignoreElement: Element | null = null,
    element: Element | null = null,
  ): Element | null {
    const handle = native.getElementAtPoint(
      this.handle, point, ignoreElement === null ? null : ignoreElement.handle,
      element === null ? null : element.handle,
    );
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Set Rml::Context::SetDocumentsBaseTag for subsequent documents.
   *
   * @zh 通过 Rml::Context::SetDocumentsBaseTag 设置后续文档的根标签。
   * @ja Rml::Context::SetDocumentsBaseTag で以後の文書のルートタグを設定します。
   * @ko Rml::Context::SetDocumentsBaseTag로 이후 문서의 루트 태그를 설정합니다.
   * @param tag - Base tag; initially "body".
   * @zh tag - 根标签，初始值为 "body"。
   * @ja tag - ルートタグ。初期値は "body"。
   * @ko tag - 루트 태그이며 초기값은 "body"입니다.
   */
  setDocumentsBaseTag(tag: string): void {
    native.setDocumentsBaseTag(this.handle, tag);
  }

  /**
   * Get the root tag used to create subsequent documents.
   *
   * @zh 获取创建后续文档所用的根标签。
   * @ja 以後の文書作成に使うルートタグを取得します。
   * @ko 이후 문서 생성에 사용하는 루트 태그를 가져옵니다.
   * @returns Base tag for subsequent documents.
   * @zh 后续文档使用的根标签。
   * @ja 以後の文書に使うルートタグ。
   * @ko 이후 문서에 사용할 루트 태그입니다.
   */
  getDocumentsBaseTag(): string {
    return native.getDocumentsBaseTag(this.handle);
  }

  /**
   * Set the default scroll behavior and speed for this context.
   *
   * @zh 设置此上下文的默认滚动行为和速度。
   * @ja このコンテキストの既定スクロール動作と速度を設定します。
   * @ko 이 컨텍스트의 기본 스크롤 동작과 속도를 설정합니다.
   * @param behavior - Default behavior; Auto selects Smooth.
   * @zh behavior - 默认滚动行为，Auto 采用 Smooth。
   * @ja behavior - 既定のスクロール動作。Auto は Smooth になります。
   * @ko behavior - 기본 스크롤 동작이며 Auto는 Smooth를 사용합니다.
   * @param speedFactor - Positive finite float; defaults to 1.
   * @zh speedFactor - 正有限 float，默认为 1。
   * @ja speedFactor - 正の有限 float。既定値は 1。
   * @ko speedFactor - 양의 유한 float이며 기본값은 1입니다.
   */
  setDefaultScrollBehavior(behavior: ScrollBehavior, speedFactor = 1): void {
    native.setDefaultScrollBehavior(this.handle, behavior, speedFactor);
  }

  /**
   * Load an external .rml document or parse a native stream at its cursor.
   *
   * @zh 加载外部 .rml 文档，或从原生流的当前游标解析。
   * @ja 外部の .rml 文書か、ネイティブストリームの現在位置から読み込みます。
   * @ko 외부 .rml 문서 또는 네이티브 스트림의 현재 커서에서 로드합니다.
   * @param documentPath - File-interface path or stream with a source URL.
   * @zh documentPath - 文件接口路径或带来源 URL 的流。
   * @ja documentPath - ファイル API のパスか、参照元 URL を持つストリーム。
   * @ko documentPath - 파일 인터페이스 경로 또는 원본 URL이 있는 스트림입니다.
   * @returns Loaded, initially hidden document; call show() to display it.
   * @zh 已加载但尚未显示的文档，调用 show() 显示。
   * @ja 読み込み済みの非表示文書。show() で表示します。
   * @ko 로드된 숨김 상태 문서이며 show()로 표시합니다.
   * @throws Error if loading fails.
   * @zh 加载失败时抛出 Error。
   * @ja 読み込み失敗時は Error。
   * @ko 로드 실패 시 Error입니다.
   */
  loadDocument(documentPath: string | Stream): Document {
    const handle = native.loadDocument(
      this.handle, documentPath instanceof Stream ? streamHandle(documentPath) :
        documentPath);
    return new Document(handle);
  }

  /**
   * Select a document script host for subsequent loads, or disable scripting.
   *
   * @zh 为后续加载选择文档脚本宿主，或禁用脚本。
   * @ja 以降の読み込みの文書スクリプトホストを選択、または無効にします。
   * @ko 이후 로드의 문서 스크립트 호스트를 선택하거나 비활성화합니다.
   * @param host - Captured host, or null to use normal RmlUi documents.
   * @zh host - 捕获的宿主，null 使用常规 RmlUi 文档。
   * @ja host - 取得済みホスト。null は通常の RmlUi 文書。
   * @ko host - 캡처된 호스트이며 null은 일반 RmlUi 문서를 사용합니다.
   * @remarks
   * Existing documents retain their own host. Global body/listener registries
   * remain intact. Host selection is forbidden from active native callbacks.
   * @zh 已有文档保留自己的宿主，全局 body/监听器注册保持完整。
   * 禁止在活跃原生回调内切换宿主。
   * @ja 既存文書はホストを保持し、全体の body/リスナー登録を維持します。
   * 有効なネイティブコールバック中は変更できません。
   * @ko 기존 문서는 호스트를 유지하며 전역 body/리스너 등록을 보존합니다.
   * 활성 네이티브 콜백에서는 변경할 수 없습니다.
   */
  setScriptHost(host: NodeScriptHost | LuaScriptHost | null): void {
    native.setDocumentScriptHost(
      this.handle, host === null ? null : scriptHostHandle(host),
    );
  }

  /**
   * Parse an RML string into a document.
   *
   * @zh 将 RML 字符串解析为文档。
   * @ja RML 文字列を文書として解析します。
   * @ko RML 문자열을 문서로 파싱합니다.
   * @param rml - RML markup.
   * @zh rml - RML 标记。
   * @ja rml - RML マークアップ。
   * @ko rml - RML 마크업입니다.
   * @param sourceUrl - Optional source URL for relative resource resolution.
   * @zh sourceUrl - 可选来源 URL，用于解析相对资源。
   * @ja sourceUrl - 相対リソースの解決に使う任意のソース URL。
   * @ko sourceUrl - 상대 리소스 해석에 사용할 선택적 소스 URL입니다.
   * @remarks
   * Omission uses "[document from memory]"; an empty string stays empty.
   * RmlUi records sourceURL when parsing a head element. Relative resource
   * paths resolve from this URL. Invalid types and embedded nulls are rejected.
   * @zh 省略时使用 "[document from memory]"，空字符串保持为空。
   * RmlUi 在解析 head 元素时记录 sourceURL，相对资源基于此 URL 解析。
   * 非字符串参数和内嵌空字节被拒绝。
   * @ja 省略時は "[document from memory]"、空文字列は空のままです。
   * RmlUi は head の解析時に sourceURL を記録し、相対リソースを解決します。
   * 文字列以外の値とヌル文字は拒否します。
   * @ko 생략하면 "[document from memory]"를 쓰고 빈 문자열은 유지합니다.
   * RmlUi는 head 해석 시 sourceURL을 기록하여 상대 리소스 경로를 해석합니다.
   * 문자열이 아닌 값과 널 문자는 거부됩니다.
   * @returns Parsed, initially hidden document; call show() to display it.
   * @zh 解析后尚未显示的文档，调用 show() 显示。
   * @ja 解析済みの非表示文書。show() で表示します。
   * @ko 파싱된 숨김 상태 문서이며 show()로 표시합니다.
   * @throws Error if parsing fails.
   * @zh 解析失败时抛出 Error。
   * @ja 解析失敗時は Error。
   * @ko 파싱 실패 시 Error입니다.
   */
  loadDocumentFromMemory(rml: string, sourceUrl?: string): Document {
    const handle = native.loadDocumentFromMemory(
      this.handle, rml, sourceUrl,
    );
    return new Document(handle);
  }
}
