import {
  Event, RenderWindow, SFMLError, type EventData,
} from 'sfml.js';
import { native } from './internal/native';
import {
  writableStruct, windowNativeHandle, type SfmlNativeHandle,
} from './internal/sfml-interop';

// Reuse sfml.js error prototypes so native exceptions keep the same type.
native.errorState.prototype = SFMLError.prototype;

// Windows that currently have an ImGui context.
const initialized = new WeakSet<RenderWindow>();

interface CachedViews {
  io?: ImGuiIOView;
  style?: ImGuiStyleView;
}

// Cache IO/style views per window so descriptors are not rebuilt every frame.
const cachedViews = new WeakMap<RenderWindow, CachedViews>();
let currentWindow: RenderWindow | undefined;

/**
 * Track the window selected by the native backend.
 *
 * @zh 记录原生后端选中的窗口。
 * @ja ネイティブバックエンドが選択したウィンドウを記録します。
 * @ko 네이티브 백엔드가 선택한 창을 기록합니다.
 *
 * @param window - Window whose ImGui context is current.
 * @zh window - ImGui 上下文当前处于活动状态的窗口。
 * @ja window - ImGui コンテキストが現在有効なウィンドウです。
 * @ko window - ImGui 컨텍스트가 현재 활성화된 창입니다.
 */
function activate(window: RenderWindow): void {
  currentWindow = window;
}

/**
 * Reuse a window's shared-memory view cache across frames.
 *
 * @zh 跨帧复用窗口的共享内存视图缓存。
 * @ja ウィンドウの共有メモリビューのキャッシュをフレーム間で再利用します。
 * @ko 창의 공유 메모리 뷰 캐시를 프레임 간에 재사용합니다.
 *
 * @param window - Window owning the views.
 * @zh window - 视图所属的窗口。
 * @ja window - ビューを所有するウィンドウです。
 * @ko window - 뷰를 소유한 창입니다.
 *
 * @returns Existing cache, or an empty cache for its first access.
 * @zh 已有缓存；首次访问时创建空缓存。
 * @ja 既存のキャッシュです。初回アクセス時は空のキャッシュを作成します。
 * @ko 기존 캐시입니다. 처음 접근할 때는 빈 캐시를 만듭니다.
 */
function viewsFor(window: RenderWindow): CachedViews {
  let views = cachedViews.get(window);
  if (!views) {
    views = {};
    cachedViews.set(window, views);
  }
  return views;
}

/**
 * Live writable view of ImGuiIO backed by native memory.
 *
 * @zh 直接映射原生内存的 ImGuiIO 实时可写视图。
 * @ja ネイティブメモリに直接マップされた ImGuiIO の書き込み可能ビュー。
 * @ko 네이티브 메모리에 직접 매핑된 ImGuiIO 쓰기 가능 뷰입니다.
 */
export interface ImGuiIOView {
  configFlags: number;
  backendFlags: number;
  displayWidth: number;
  displayHeight: number;
  deltaTime: number;
  iniSavingRate: number;
  fontGlobalScale: number;
  wantCaptureMouse: boolean;
  wantCaptureKeyboard: boolean;
  wantTextInput: boolean;
  wantSetMousePos: boolean;
  mouseDrawCursor: boolean;
  keyCtrl: boolean;
  keyShift: boolean;
  keyAlt: boolean;
  keySuper: boolean;
  mousePosX: number;
  mousePosY: number;
  mouseDeltaX: number;
  mouseDeltaY: number;
  framerate: number;
  metricsRenderVertices: number;
  metricsRenderIndices: number;
  metricsRenderWindows: number;
  metricsActiveWindows: number;
}

/**
 * Live writable view of ImGuiStyle backed by native memory.
 *
 * @zh 直接映射原生内存的 ImGuiStyle 实时可写视图。
 * @ja ネイティブメモリに直接マップされた ImGuiStyle の書き込み可能ビュー。
 * @ko 네이티브 메모리에 직접 매핑된 ImGuiStyle 쓰기 가능 뷰입니다.
 */
export interface ImGuiStyleView {
  alpha: number;
  disabledAlpha: number;
  windowPaddingX: number;
  windowPaddingY: number;
  windowRounding: number;
  windowBorderSize: number;
  childRounding: number;
  childBorderSize: number;
  popupRounding: number;
  popupBorderSize: number;
  framePaddingX: number;
  framePaddingY: number;
  frameRounding: number;
  frameBorderSize: number;
  itemSpacingX: number;
  itemSpacingY: number;
  itemInnerSpacingX: number;
  itemInnerSpacingY: number;
  cellPaddingX: number;
  cellPaddingY: number;
  scrollbarSize: number;
  scrollbarRounding: number;
  grabMinSize: number;
  grabRounding: number;
  tabRounding: number;
  buttonTextAlignX: number;
  buttonTextAlignY: number;
  selectableTextAlignX: number;
  selectableTextAlignY: number;
  antiAliasedLines: boolean;
  antiAliasedFill: boolean;
}

/**
 * Dear ImGui version string.
 *
 * @zh Dear ImGui 版本号。
 * @ja Dear ImGui のバージョン文字列。
 * @ko Dear ImGui 버전 문자열입니다.
 */
export const Version = native.GetVersion();

/**
 * Validate a window before passing its handle to the native backend.
 *
 * @zh 向原生后端传递句柄前校验窗口。
 * @ja ネイティブバックエンドへハンドルを渡す前にウィンドウを検証します。
 * @ko 네이티브 백엔드에 핸들을 전달하기 전에 창을 검증합니다.
 *
 * @param window - Window supplied by the caller.
 * @zh window - 调用方传入的窗口。
 * @ja window - 呼び出し元が渡したウィンドウです。
 * @ko window - 호출자가 전달한 창입니다.
 *
 * @returns Validated native window handle.
 * @zh 已校验的原生窗口句柄。
 * @ja 検証済みのネイティブウィンドウハンドルです。
 * @ko 검증된 네이티브 창 핸들입니다.
 */
function handleOf(window: RenderWindow): SfmlNativeHandle {
  if (!(window instanceof RenderWindow)) {
    throw new TypeError('Expected an sfml.js RenderWindow');
  }
  return windowNativeHandle(window);
}

/**
 * Require an existing ImGui context before accessing window state.
 *
 * @zh 访问窗口状态前要求 ImGui 上下文已初始化。
 * @ja ウィンドウの状態へアクセスする前に ImGui コンテキストの初期化を確認します。
 * @ko 창 상태에 접근하기 전에 ImGui 컨텍스트의 초기화를 확인합니다.
 *
 * @param window - Window supplied by the caller.
 * @zh window - 调用方传入的窗口。
 * @ja window - 呼び出し元が渡したウィンドウです。
 * @ko window - 호출자가 전달한 창입니다.
 *
 * @returns Native handle of an initialized window.
 * @zh 已初始化窗口的原生句柄。
 * @ja 初期化済みウィンドウのネイティブハンドルです。
 * @ko 초기화된 창의 네이티브 핸들입니다.
 */
function requireInitialized(window: RenderWindow): SfmlNativeHandle {
  const handle = handleOf(window);
  if (!initialized.has(window)) {
    throw new Error('ImGui is not initialized for this window');
  }
  return handle;
}

/**
 * Initialize ImGui and the imgui-sfml backend for a window.
 *
 * @zh 为窗口初始化 ImGui 与 imgui-sfml 后端。
 * @ja ウィンドウ用に ImGui と imgui-sfml バックエンドを初期化する。
 * @ko 창에 대해 ImGui와 imgui-sfml 백엔드를 초기화합니다.
 * @param window - Open sfml.js RenderWindow.
 * @zh window - 已打开的 sfml.js RenderWindow。
 * @ja window - 開いている sfml.js RenderWindow。
 * @ko window - 열린 sfml.js RenderWindow입니다.
 * @param loadDefaultFont - Load the default font when true.
 * @zh loadDefaultFont - 为 true 时加载默认字体。
 * @ja loadDefaultFont - true の場合は既定のフォントを読み込む。
 * @ko loadDefaultFont - true이면 기본 글꼴을 로드합니다.
 * @returns Whether initialization succeeded.
 * @zh 初始化是否成功。
 * @ja 初期化に成功したかどうか。
 * @ko 초기화 성공 여부입니다.
 */
export function Init(window: RenderWindow, loadDefaultFont = true): boolean {
  if (typeof loadDefaultFont !== 'boolean') {
    throw new TypeError('Expected a boolean');
  }
  const handle = handleOf(window);
  if (initialized.has(window)) {
    return true;
  }
  const result = native.init(handle, loadDefaultFont);
  if (result) {
    initialized.add(window);
    cachedViews.delete(window);
    activate(window);
  }
  return result;
}

/**
 * Shut down the ImGui context of a window; does nothing when not initialized.
 *
 * @zh 关闭窗口的 ImGui 上下文；未初始化时为空操作。
 * @ja ウィンドウの ImGui コンテキストを破棄する。未初期化なら何もしない。
 * @ko 창의 ImGui 컨텍스트를 종료합니다. 초기화되지 않았다면 아무 작업도 하지 않습니다.
 * @param window - sfml.js render window whose ImGui resources will be released.
 * @zh window - 要释放 ImGui 集成资源的 sfml.js 渲染窗口。
 * @ja window - ImGui の連携リソースを解放する sfml.js の描画ウィンドウ。
 * @ko window - ImGui 연동 리소스를 해제할 sfml.js 렌더링 창입니다.
 */
export function Shutdown(window: RenderWindow): void {
  const handle = handleOf(window);
  if (!initialized.has(window)) {
    return;
  }
  initialized.delete(window);
  cachedViews.delete(window);
  if (currentWindow === window) {
    currentWindow = undefined;
  }
  native.shutdown(handle);
}

/**
 * Return whether a window has an ImGui context.
 *
 * @zh 返回窗口是否已初始化 ImGui。
 * @ja ウィンドウが ImGui コンテキストを持つかどうかを返す。
 * @ko 창에 ImGui 컨텍스트가 있는지 반환합니다.
 * @param window - sfml.js render window whose initialization state is queried.
 * @zh window - 要检查初始化状态的 sfml.js 渲染窗口。
 * @ja window - 初期化状態を確認する sfml.js の描画ウィンドウ。
 * @ko window - 초기화 상태를 확인할 sfml.js 렌더링 창입니다.
 * @returns Whether the window is initialized.
 * @zh 窗口是否已初始化。
 * @ja ウィンドウが初期化済みかどうか。
 * @ko 창의 초기화 여부입니다.
 */
export function IsInitialized(window: RenderWindow): boolean {
  return initialized.has(window);
}

/**
 * Forward an sfml.js window event to ImGui.
 *
 * @zh 把 sfml.js 窗口事件转交给 ImGui。
 * @ja sfml.js のウィンドウイベントを ImGui に渡す。
 * @ko sfml.js 창 이벤트를 ImGui로 전달합니다.
 * @param window - sfml.js render window receiving this event.
 * @zh window - 接收此事件的 sfml.js 渲染窗口。
 * @ja window - このイベントを受け取る sfml.js の描画ウィンドウ。
 * @ko window - 이 이벤트를 받는 sfml.js 렌더링 창입니다.
 * @param event - sfml.js event object or event data.
 * @zh event - sfml.js 事件对象或事件数据。
 * @ja event - sfml.js のイベントオブジェクトまたはイベントデータ。
 * @ko event - sfml.js 이벤트 객체 또는 이벤트 데이터입니다.
 */
export function ProcessEvent(
  window: RenderWindow, event: Event | EventData,
): void {
  const handle = requireInitialized(window);
  activate(window);
  const data = event instanceof Event ? event.data : event;
  native.processEvent(handle, data as unknown as object);
}

/**
 * Update ImGui frame state and start a new frame.
 *
 * @zh 更新 ImGui 帧状态并开始新帧。
 * @ja ImGui のフレーム状態を更新し、新しいフレームを開始する。
 * @ko ImGui 프레임 상태를 갱신하고 새 프레임을 시작합니다.
 * @param window - sfml.js render window starting a new ImGui frame.
 * @zh window - 要开始新一帧的 sfml.js 渲染窗口。
 * @ja window - 新しいフレームを開始する sfml.js の描画ウィンドウ。
 * @ko window - 새 ImGui 프레임을 시작할 sfml.js 렌더링 창입니다.
 * @param seconds - Seconds since the previous frame.
 * @zh seconds - 距上一帧的秒数。
 * @ja seconds - 前のフレームからの経過秒数。
 * @ko seconds - 이전 프레임으로부터의 경과 초입니다.
 */
export function Update(window: RenderWindow, seconds: number): void {
  const handle = requireInitialized(window);
  activate(window);
  native.update(handle, seconds);
}

/**
 * Flush recorded sfml.js draw calls and render ImGui on the window.
 *
 * @zh 提交 sfml.js 已录制的绘制，并在窗口上绘制 ImGui。
 * @ja sfml.js の記録済み描画を反映し、ウィンドウ上に ImGui を描画する。
 * @ko sfml.js에 기록된 그리기를 반영하고 창에 ImGui를 그립니다.
 * @param window - sfml.js render window receiving the ImGui draw commands.
 * @zh window - 接收 ImGui 绘制内容的 sfml.js 渲染窗口。
 * @ja window - ImGui の描画先となる sfml.js の描画ウィンドウ。
 * @ko window - ImGui 그리기 명령을 받을 sfml.js 렌더링 창입니다.
 */
export function Render(window: RenderWindow): void {
  const handle = requireInitialized(window);
  activate(window);
  window.flush();
  native.render(handle);
}

/**
 * Rebuild the ImGui font texture; call after changing fonts.
 *
 * @zh 重新构建 ImGui 字体纹理；修改字体后调用。
 * @ja ImGui のフォントテクスチャを再構築する。フォント変更後に呼ぶ。
 * @ko ImGui 글꼴 텍스처를 재구성합니다. 글꼴을 변경한 뒤 호출하세요.
 * @returns Whether the rebuild succeeded.
 * @zh 是否重建成功。
 * @ja 再構築に成功したかどうか。
 * @ko 재구성 성공 여부입니다.
 */
export function UpdateFontTexture(): boolean {
  return native.updateFontTexture();
}

/**
 * Return the live writable ImGuiIO view.
 *
 * @zh 返回 ImGuiIO 的实时可写视图。
 * @ja ImGuiIO の書き込み可能なリアルタイムビューを返す。
 * @ko ImGuiIO의 실시간 쓰기 가능 뷰를 반환합니다.
 * @returns Field view; writes take effect immediately.
 * @zh 字段视图；写入立即生效。
 * @ja フィールドビュー。書き込みは即座に反映される。
 * @ko 필드 뷰입니다. 쓰기는 즉시 반영됩니다.
 */
export function GetIO(): ImGuiIOView {
  if (!currentWindow) {
    return writableStruct<ImGuiIOView>(native.getIO());
  }
  const views = viewsFor(currentWindow);
  views.io ??= writableStruct<ImGuiIOView>(native.getIO());
  return views.io;
}

/**
 * Return the live writable ImGuiStyle view.
 *
 * @zh 返回 ImGuiStyle 的实时可写视图。
 * @ja ImGuiStyle の書き込み可能なリアルタイムビューを返す。
 * @ko ImGuiStyle의 실시간 쓰기 가능 뷰를 반환합니다.
 * @returns Field view; writes take effect immediately.
 * @zh 字段视图；写入立即生效。
 * @ja フィールドビュー。書き込みは即座に反映される。
 * @ko 필드 뷰입니다. 쓰기는 즉시 반영됩니다.
 */
export function GetStyle(): ImGuiStyleView {
  if (!currentWindow) {
    return writableStruct<ImGuiStyleView>(native.getStyle());
  }
  const views = viewsFor(currentWindow);
  views.style ??= writableStruct<ImGuiStyleView>(native.getStyle());
  return views.style;
}

/**
 * Make a window the current ImGui context.
 *
 * @zh 把窗口切换为当前 ImGui 上下文。
 * @ja ウィンドウを現在の ImGui コンテキストにする。
 * @ko 창을 현재 ImGui 컨텍스트로 만듭니다.
 * @param window - Initialized sfml.js RenderWindow.
 * @zh window - 已初始化的 sfml.js RenderWindow。
 * @ja window - 初期化済みの sfml.js RenderWindow。
 * @ko window - 초기화된 sfml.js RenderWindow입니다.
 */
export function SetCurrentWindow(window: RenderWindow): void {
  const handle = requireInitialized(window);
  native.setCurrentWindow(handle);
  activate(window);
}
