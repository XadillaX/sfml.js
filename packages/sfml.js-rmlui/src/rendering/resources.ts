import { RenderWindow } from 'sfml.js';
import { native } from '../internal/native';
import { windowNativeHandle } from '../internal/sfml-interop';

declare const renderInterfaceBrand: unique symbol;

/**
 * Opaque runtime-owned Rml::RenderInterface reference.
 *
 * @zh 由运行时持有的不透明 Rml::RenderInterface 引用。
 * @ja ランタイムが所有する不透明な Rml::RenderInterface 参照です。
 * @ko 런타임이 소유하는 불투명한 Rml::RenderInterface 참조입니다.
 * @remarks
 * Obtain from getRenderInterface, createRenderInterface or
 * Context.renderInterface. Survives context removal and render-manager
 * cleanup; invalidated by shutdown. Cannot be constructed from a JS object.
 * @zh 通过 getRenderInterface、createRenderInterface 或
 * Context.renderInterface 获取。移除上下文或清理渲染管理器后仍有效，
 * shutdown 后失效。不能用 JS 对象构造。
 * @ja getRenderInterface、createRenderInterface、Context.renderInterface
 * から取得します。コンテキストや管理器の削除後も有効で、shutdown で無効になります。
 * JS オブジェクトからは作成できません。
 * @ko getRenderInterface, createRenderInterface, Context.renderInterface에서
 * 얻습니다. 컨텍스트나 관리자 제거 후에도 유효하며 shutdown 시 무효화됩니다.
 * JS 객체로 생성할 수 없습니다.
 */
export interface RenderInterface {
  /** @internal */
  readonly [renderInterfaceBrand]: true;
}

/**
 * Create an independent SFML renderer before or after initialisation.
 *
 * @zh 在初始化前或初始化后为窗口创建独立的 SFML 渲染接口。
 * @ja 初期化の前後にウィンドウ用の独立した SFML 描画インターフェースを作成します。
 * @ko 초기화 전이나 후에 창을 위한 독립된 SFML 렌더 인터페이스를 생성합니다.
 * @param window - Open render window; keep open until shutdown.
 * @zh window - 已打开的渲染窗口；必须保持打开至 shutdown。
 * @ja window - 開いた描画ウィンドウ。shutdown まで開いたままにします。
 * @ko window - 열린 렌더 창이며 shutdown까지 열어 두어야 합니다.
 * @returns Native interface accepted by createContext and resource release.
 * @zh 可用于 createContext 和资源释放操作的原生接口。
 * @ja createContext とリソース解放で使用できるネイティブ参照。
 * @ko createContext 및 리소스 해제에 사용할 수 있는 네이티브 참조입니다.
 * @remarks
 * Missing SFML shader support or any required program compilation failure
 * throws before the interface is registered or selected.
 * Owns a separate RmlUi resource cache even when windows are identical.
 * The selected renderer and interfaces used by native managers or preloads
 * retain their window until shutdown. Unused interfaces may be collected.
 * Does not change the default system interface or window DPI setting.
 * Calls during event callbacks are rejected.
 * @zh 缺少 SFML 着色器支持或任一必需程序编译失败时，在注册或选择接口前抛出异常。
 * 即使使用同一窗口也拥有独立的 RmlUi 资源缓存。已选定或被原生管理器、预加载
 * 使用的接口持有窗口至 shutdown；未使用接口可回收。不修改默认系统接口或窗口
 * DPI 设置。禁止在事件回调中调用。
 * @ja SFML シェーダーが未対応、または必須プログラムのコンパイルに失敗した場合、
 * インターフェースの登録・選択前に例外を送出します。
 * 同じウィンドウでも独立したキャッシュを使用します。選択済みまたは管理器・
 * 事前読み込みで使われた描画器は shutdown まで保持され、未使用のものは回収できます。
 * 既定のシステムインターフェースや DPI 設定は変更しません。
 * イベントコールバック内の呼び出しは拒否されます。
 * @ko SFML 셰이더 미지원 또는 필수 프로그램 컴파일 실패 시 인터페이스 등록·선택 전에
 * 예외를 발생시킵니다. 같은 창에서도 독립된 캐시를 사용합니다. 선택되거나 네이티브 관리자 및 사전
 * 로드에서 사용하는 렌더러는 shutdown까지 창을 보유하며 미사용 인터페이스는 회수됩니다.
 * 기본 시스템 인터페이스나 DPI 설정을 바꾸지 않습니다.
 * 이벤트 콜백 내 호출은 거부됩니다.
 */
export function createRenderInterface(window: RenderWindow): RenderInterface {
  if (!(window instanceof RenderWindow)) {
    throw new TypeError('Expected an sfml.js RenderWindow');
  }
  return native.createRenderInterface(windowNativeHandle(window));
}

/**
 * Read the actual Rml::GetRenderInterface pointer as a checked reference.
 *
 * @zh 将实际 Rml::GetRenderInterface 指针返回为受检引用。
 * @ja 実際の Rml::GetRenderInterface ポインターを検証済み参照で返します。
 * @ko 실제 Rml::GetRenderInterface 포인터를 검증된 참조로 반환합니다.
 * @returns Canonical selected/default renderer, or null before selection
 * and after shutdown.
 * @zh 唯一的选定或默认接口；未选定或 shutdown 后为 null。
 * @ja 一意の選択済み・既定描画器。未選択または shutdown 後は null。
 * @ko 고유한 선택된 기본 렌더러이며 선택 전이나 shutdown 후에는 null입니다.
 */
export function getRenderInterface(): RenderInterface | null {
  return native.getRenderInterface();
}

/**
 * Select Rml::SetRenderInterface before initialisation.
 *
 * @zh 在初始化前调用 Rml::SetRenderInterface 选定渲染接口。
 * @ja 初期化前に Rml::SetRenderInterface で描画器を選択します。
 * @ko 초기화 전에 Rml::SetRenderInterface로 렌더러를 선택합니다.
 * @param renderer - Genuine interface, or null to restore automatic selection.
 * @zh renderer - 真实接口，或传入 null 恢复自动选择。
 * @ja renderer - 正規の参照。null は自動選択を復元します。
 * @ko renderer - 실제 인터페이스이며 null은 자동 선택을 복원합니다.
 * @remarks
 * Initialisation preserves this selection. The system window passed to
 * initialise still supplies timing/input/DPI; contexts use the selected
 * renderer's window. Runtime and callback mutation is rejected.
 * @zh 初始化保留此选择。initialise 的窗口仍负责计时、输入和 DPI；
 * 上下文使用选定渲染器的窗口。禁止初始化后或在回调中修改。
 * @ja 初期化は選択を保持します。initialise のウィンドウは時刻・入力・DPI を提供し、
 * コンテキストは選択した描画器のウィンドウを使います。初期化後・コールバック内の変更は禁止です。
 * @ko 초기화는 선택을 보존합니다. initialise의 창은 시간, 입력 및 DPI를 제공하고
 * 컨텍스트는 선택한 렌더러의 창을 사용합니다. 초기화 후 및 콜백 내 변경은 거부됩니다.
 */
export function setRenderInterface(renderer: RenderInterface | null): void {
  native.setRenderInterface(renderer);
}

/**
 * Copy Rml::GetTextureSourceList across all render managers.
 *
 * @zh 复制 Rml::GetTextureSourceList 返回的所有渲染管理器纹理源列表。
 * @ja 全管理器の Rml::GetTextureSourceList をコピーします。
 * @ko 모든 렌더 관리자의 Rml::GetTextureSourceList를 복사합니다.
 * @returns Source URL snapshot in native order, retaining duplicates.
 * @zh 按原生顺序排列的源 URL 快照，保留重复项。
 * @ja 重複を保持した、ネイティブ順のソース URL スナップショット。
 * @ko 중복을 유지한 네이티브 순서의 원본 URL 스냅샷입니다.
 * @remarks
 * Includes cached file sources even after releasing their texture handles;
 * generated font/layer textures have no source URL. Requires initialisation.
 * @zh 释放纹理句柄后仍包含缓存的文件源；字体和图层生成的纹理没有源 URL。
 * 需要先初始化。
 * @ja ハンドル解放後もキャッシュのファイル名を含みます。生成されたフォントや
 * レイヤーのテクスチャには URL がありません。初期化が必要です。
 * @ko 핸들 해제 후에도 캐시된 파일 경로를 포함합니다. 생성된 글꼴 및 레이어
 * 텍스처에는 URL이 없습니다. 초기화가 필요합니다.
 */
export function getTextureSourceList(): string[] {
  return native.getTextureSourceList();
}

/**
 * Release loaded/generated texture handles with Rml::ReleaseTextures.
 *
 * @zh 使用 Rml::ReleaseTextures 释放已加载和生成的纹理句柄。
 * @ja Rml::ReleaseTextures で読み込み・生成済みテクスチャを解放します。
 * @ko Rml::ReleaseTextures로 로드되거나 생성된 텍스처 핸들을 해제합니다.
 * @param renderInterface - Matching renderer; omitted/null means all.
 * @zh renderInterface - 匹配的渲染接口；省略或 null 表示全部。
 * @ja renderInterface - 対象の描画器。省略または null はすべて。
 * @ko renderInterface - 대상 렌더러이며 생략하거나 null이면 전체입니다.
 * @remarks
 * Resources reload lazily on subsequent use. Requires initialisation;
 * calls during event callbacks are rejected.
 * @zh 下次使用时按需重新加载。需要先初始化，禁止在事件回调中调用。
 * @ja 次回使用時に再読み込みします。初期化が必要で、イベント内は不可です。
 * @ko 다음 사용 시 다시 로드합니다. 초기화가 필요하며 이벤트 콜백 내 호출은 거부됩니다.
 */
export function releaseTextures(
  renderInterface?: RenderInterface | null,
): void {
  native.releaseTextures(renderInterface);
}

/**
 * Release a named texture with Rml::ReleaseTexture.
 *
 * @zh 使用 Rml::ReleaseTexture 释放指定源的纹理。
 * @ja Rml::ReleaseTexture で指定ソースのテクスチャを解放します。
 * @ko Rml::ReleaseTexture로 지정된 원본의 텍스처를 해제합니다.
 * @param source - Source-list URL or texture source without a document path.
 * @zh source - 源列表中的 URL，或不依赖文档路径的纹理源。
 * @ja source - ソース一覧の URL、または文書パスを必要としないテクスチャソース。
 * @ko source - 소스 목록의 URL 또는 문서 경로가 필요 없는 텍스처 소스입니다.
 * @param renderInterface - Matching renderer; omitted/null means all.
 * @zh renderInterface - 匹配的渲染接口；省略或 null 表示全部。
 * @ja renderInterface - 対象の描画器。省略または null はすべて。
 * @ko renderInterface - 대상 렌더러이며 생략하거나 null이면 전체입니다.
 * @returns True if a loaded handle was released; false if absent/unloaded.
 * @zh 释放了已加载句柄时为 true；不存在或未加载时为 false。
 * @ja 読み込み済みハンドルを解放した場合は true。存在しないか未読込なら false。
 * @ko 로드된 핸들을 해제하면 true이며 없거나 로드되지 않았으면 false입니다.
 * @remarks
 * Existing source-list URLs and special '?' sources are used verbatim.
 * Other sources use the current SystemInterface.JoinPath with an empty
 * document path. Requires initialisation; event callbacks are rejected.
 * @zh 源列表中的 URL 和以 '?' 开头的特殊源保持原样。其他源通过当前
 * SystemInterface.JoinPath 和空文档路径解析。需要先初始化，禁止在事件回调中调用。
 * @ja ソース一覧の URL と '?' で始まる特殊ソースはそのまま使います。その他は現在の
 * SystemInterface.JoinPath に空の文書パスを渡して解決します。初期化が必要で、イベント内は不可です。
 * @ko 소스 목록의 URL과 '?'로 시작하는 특수 소스는 그대로 사용합니다. 나머지는 현재
 * SystemInterface.JoinPath에 빈 문서 경로를 전달해 해석합니다. 초기화가 필요하며 이벤트 내 호출은 거부됩니다.
 */
export function releaseTexture(
  source: string, renderInterface?: RenderInterface | null,
): boolean {
  return native.releaseTexture(source, renderInterface);
}

/**
 * Release handles with Rml::ReleaseCompiledGeometry, retaining the meshes.
 *
 * @zh 使用 Rml::ReleaseCompiledGeometry 释放句柄，保留网格供重新编译。
 * @ja Rml::ReleaseCompiledGeometry でハンドルを解放し、再コンパイル用のメッシュを保持します。
 * @ko Rml::ReleaseCompiledGeometry로 핸들을 해제하고 재컴파일할 메시를 유지합니다.
 * @param renderInterface - Matching renderer; omitted/null means all.
 * @zh renderInterface - 匹配的渲染接口；省略或 null 表示全部。
 * @ja renderInterface - 対象の描画器。省略または null はすべて。
 * @ko renderInterface - 대상 렌더러이며 생략하거나 null이면 전체입니다.
 * @remarks
 * Requires initialisation; calls during event callbacks are rejected.
 * @zh 需要先初始化，禁止在事件回调中调用。
 * @ja 初期化が必要で、イベントコールバック内は不可です。
 * @ko 초기화가 필요하며 이벤트 콜백 내 호출은 거부됩니다.
 */
export function releaseCompiledGeometry(
  renderInterface?: RenderInterface | null,
): void {
  native.releaseCompiledGeometry(renderInterface);
}

/**
 * Release unused managers with Rml::ReleaseRenderManagers.
 *
 * @zh 使用 Rml::ReleaseRenderManagers 释放未使用的渲染管理器。
 * @ja Rml::ReleaseRenderManagers で未使用の描画管理器を解放します。
 * @ko Rml::ReleaseRenderManagers로 사용하지 않는 렌더 관리자를 해제합니다.
 * @remarks
 * Also releases font resources and updates active contexts. Renderer references
 * stay valid. Reattach or collect all detached elements first: they may retain
 * geometry or callback textures. Requires initialisation; event calls reject.
 * Borrowed unused manager wrappers and their compiled resources invalidate.
 * Explicitly constructed RenderManager instances retain independent ownership.
 * @zh 同时释放字体资源并更新活动上下文。渲染接口引用保持有效。
 * 必须先重新挂载或回收所有脱离树的元素，它们可能仍持有几何或回调纹理。
 * 需要先初始化，禁止在事件回调中调用。
 * 闲置的借用管理器包装器及其编译资源会失效；显式构造的 RenderManager 保留独立所有权。
 * @ja フォント資源も解放し、有効なコンテキストを更新します。描画器参照は有効です。
 * 切り離した要素はジオメトリやテクスチャを保持する可能性があるため、先に再接続
 * または回収してください。初期化が必要で、イベント内は不可です。
 * 未使用の借用管理器とコンパイル済みリソースは無効になり、明示構築した管理器は独立して残ります。
 * @ko 글꼴 리소스도 해제하고 활성 컨텍스트를 갱신합니다. 렌더러 참조는 유효합니다.
 * 분리된 요소가 지오메트리나 텍스처를 유지할 수 있으므로 먼저 다시 연결하거나
 * 회수해야 합니다. 초기화가 필요하며 이벤트 콜백 내 호출은 거부됩니다.
 * 미사용 빌린 관리자와 컴파일된 리소스는 무효화되며 명시적으로 생성한 관리자는 유지됩니다.
 */
export function releaseRenderManagers(): void {
  native.releaseRenderManagers();
}
