import { native, type NativeGraphicsHandle } from '../internal/native';
import { graphicsNative } from '../internal/graphics-state';
import { Vector2, Vector2i, Vector2u } from '../system/vector2';
import { Time } from '../system/time';
import type { ReadonlyValue } from '../internal/value-storage';
import {
  contextSettings, settingsFromBuffer, type ContextSettings,
} from './context-settings';
import { Style, State } from './gen/constants';
import { VideoMode, windowSize, unsigned } from './video-mode';
import { Cursor, rgbaPixels } from './cursor';
import {
  Event, windowEvent, type EventHandlers, type EventVisitor,
} from './event';

/**
 * Platform window handles and Vulkan pointers are represented losslessly.
 * @zh 无损表示平台窗口句柄和 Vulkan 指针。
 * @ja プラットフォームのウィンドウハンドルと Vulkan ポインターを損失なく表す。
 * @ko 플랫폼 윈도우 핸들과 Vulkan 포인터를 손실 없이 표현한다.
 */
export type WindowHandle = bigint;

/**
 * Window creation options.
 * @zh 窗口创建参数。
 * @ja ウィンドウ作成オプション。
 * @ko 윈도우 생성 옵션.
 */
export interface WindowOptions {
  /**
   * Style bit flags, defaulting to Style.Default.
   * @zh 样式位标志，默认 Style.Default。
   * @ja スタイルのビットフラグ。既定値は Style.Default。
   * @ko 스타일 비트 플래그. 기본값은 Style.Default.
   */
  style?: Style;
  /**
   * Windowed or fullscreen mode, defaulting to Windowed.
   * @zh 窗口化或全屏，默认 Windowed。
   * @ja ウィンドウ表示または全画面表示。既定値は Windowed。
   * @ko 창 모드 또는 전체 화면 모드. 기본값은 Windowed.
   */
  state?: State;
  /**
   * Requested OpenGL context settings; query actual settings with getSettings.
   * @zh 请求的 OpenGL 上下文配置，实际配置通过 getSettings 查询。
   * @ja 要求する OpenGL コンテキスト設定。実際の設定は getSettings で取得する。
   * @ko 요청한 OpenGL 컨텍스트 설정. 실제 설정은 getSettings로 조회한다.
   */
  settings?: Readonly<ContextSettings>;
}

const mixedWindows = new WeakSet<object>();

/**
 * Window hooks are held only by weak keys, preventing Native from retaining
 * JS objects through back references.
 * @zh 窗口钩子仅由弱键持有，不让 Native 反向保留 JS 对象。
 * @ja ウィンドウフックは弱いキーのみで保持し、Native が逆参照によって
 * JS オブジェクトを保持しないようにする。
 * @ko 윈도우 훅은 약한 키로만 유지하여 Native가 역참조로 JS 객체를 유지하지
 * 않도록 한다.
 */
const windowHooks = new WeakMap<Window, readonly [() => void, () => void]>();

/**
 * Register dynamic hooks after construction, allowing render windows to
 * initialize views before the creation hook.
 * @zh 注册构造完成后的动态钩子，渲染窗口可在创建钩子前初始化视图。
 * @ja 構築後に動的フックを登録し、描画ウィンドウが作成フックより前に
 * ビューを初期化できるようにする。
 * @ko 생성 완료 후 동적 훅을 등록하여 렌더 윈도우가 생성 훅 전에 뷰를
 * 초기화할 수 있게 한다.
 */
export function registerWindowHooks(
  window: Window, onCreate: () => void, onResize: () => void,
): void {
  windowHooks.set(window, [ onCreate, onResize ]);
}

/**
 * Consume notifications one by one after native operations return; closing
 * or recreating clears the old window's remaining notifications.
 * @zh 原生操作返回后逐条消费通知；关闭或重建会清除旧窗口的剩余通知。
 * @ja ネイティブ操作が戻った後に通知を 1 件ずつ消費する。閉じる操作や再作成は
 * 古いウィンドウの残りの通知を消去する。
 * @ko 네이티브 작업이 반환된 후 알림을 하나씩 소비한다. 닫거나 다시 생성하면
 * 이전 윈도우의 남은 알림을 지운다.
 */
function dispatchWindowHooks(window: Window): void {
  let notification: 'create' | 'resize' | undefined;
  while ((notification =
    native.takeWindowNotification(window[graphicsNative])) !== undefined) {
    windowHooks.get(window)?.[notification === 'create' ? 0 : 1]();
  }
}

export function registerMixedWindow(window: Window): void {
  mixedWindows.add(window);
}

/**
 * An OS window with an OpenGL context, usable by Texture.update().
 * @zh 带 OpenGL 上下文的操作系统窗口，可用于 Texture.update()。
 * @ja OpenGL コンテキストを持つ OS ウィンドウ。Texture.update() で利用できる。
 * @ko OpenGL 컨텍스트가 있는 OS 윈도우. Texture.update()에서 사용할 수 있다.
 */
export class Window {
  readonly [graphicsNative]: NativeGraphicsHandle<'window'>;

  static [Symbol.hasInstance](value: unknown): boolean {
    return Function.prototype[Symbol.hasInstance].call(this, value) ||
      (this === Window && typeof value === 'object' && value !== null &&
        mixedWindows.has(value));
  }

  /**
   * Create a window object that is not yet open.
   * @zh 创建尚未打开的窗口对象。
   * @ja まだ開かれていないウィンドウオブジェクトを作成する。
   * @ko 아직 열리지 않은 윈도우 객체를 생성한다.
   */
  constructor();
  /**
   * Open a window with pixel dimensions, a title, and options.
   * @zh 使用像素尺寸、标题和配置打开窗口。
   * @ja ピクセル寸法、タイトル、設定を指定してウィンドウを開く。
   * @ko 픽셀 크기, 제목, 설정을 지정하여 윈도우를 연다.
   */
  constructor(
    mode: Readonly<VideoMode> | Readonly<Vector2u>, title: string,
    options?: Readonly<WindowOptions>,
  );
  /**
   * Create an OpenGL context for an existing system window handle.
   * @zh 为已有系统窗口句柄创建 OpenGL 上下文。
   * @ja 既存のシステムウィンドウハンドルに OpenGL コンテキストを作成する。
   * @ko 기존 시스템 윈도우 핸들에 OpenGL 컨텍스트를 생성한다.
   */
  constructor(handle: WindowHandle, settings?: Readonly<ContextSettings>);
  constructor(
    mode?: Readonly<VideoMode> | Readonly<Vector2u> | WindowHandle,
    title?: string | Readonly<ContextSettings>,
    options: Readonly<WindowOptions> = {},
  ) {
    this[graphicsNative] = native.createWindow();
    if (typeof mode === 'bigint') {
      Window.prototype.create.call(this, mode, title as ContextSettings);
    } else if (mode !== undefined) {
      Window.prototype.create.bind(this)(mode, title as string, options);
    }
    registerWindowHooks(this, () => this.onCreate(), () => this.onResize());
  }

  /**
   * Called synchronously after an explicit create succeeds; derived hooks
   * are not called during base construction with arguments.
   * @zh 显式 create 成功后同步调用；有参基类构造期间不调用派生钩子。
   * @ja 明示的な create の成功後に同期的に呼ばれる。引数付きの基底クラス構築中は
   * 派生クラスのフックを呼ばない。
   * @ko 명시적 create 성공 후 동기적으로 호출된다. 인수가 있는 기본 클래스 생성 중에는
   * 파생 훅을 호출하지 않는다.
   */
  protected onCreate(): void {}

  /**
   * Called synchronously after SFML actually reports a size change, without
   * consuming the corresponding Resized event.
   * @zh SFML 实际通知尺寸变化后同步调用，不消费对应的 Resized 事件。
   * @ja SFML が実際にサイズ変更を通知した後で同期的に呼ばれる。
   * 対応する Resized イベントは消費しない。
   * @ko SFML이 실제 크기 변경을 알린 후 동기적으로 호출된다.
   * 해당 Resized 이벤트는 소비하지 않는다.
   */
  protected onResize(): void {}

  /**
   * Open or recreate the window; mode is pixel dimensions or a full video mode.
   * @zh 打开或重建窗口；mode 为像素尺寸或完整视频模式。
   * @ja ウィンドウを開くか再作成する。mode はピクセル寸法または完全なビデオモード。
   * @ko 윈도우를 열거나 다시 생성한다. mode는 픽셀 크기 또는 전체 비디오 모드이다.
   */
  create(
    mode: Readonly<VideoMode> | Readonly<Vector2u>, title: string,
    options?: Readonly<WindowOptions>,
  ): void;
  /**
   * Recreate the OpenGL context using an existing system window handle.
   * @zh 使用已有系统窗口句柄重建 OpenGL 上下文。
   * @ja 既存のシステムウィンドウハンドルを使って OpenGL コンテキストを再作成する。
   * @ko 기존 시스템 윈도우 핸들로 OpenGL 컨텍스트를 다시 생성한다.
   */
  create(handle: WindowHandle, settings?: Readonly<ContextSettings>): void;
  create(
    mode: Readonly<VideoMode> | Readonly<Vector2u> | WindowHandle,
    title?: string | Readonly<ContextSettings>,
    options: Readonly<WindowOptions> = {},
  ): void {
    if (typeof mode === 'bigint') {
      native.openWindowHandle(this[graphicsNative], mode,
        contextSettings(title as ContextSettings ?? {}));
      dispatchWindowHooks(this);
      return;
    }
    const size = mode instanceof VideoMode ? mode.size : mode as Vector2u;
    const bits = mode instanceof VideoMode ? mode.bitsPerPixel : 32;
    windowSize(size);
    unsigned(bits);
    const { style = Style.Default, state = State.Windowed, settings = {} } =
      options;
    unsigned(style);
    // eslint-disable-next-line no-bitwise
    if ((style & ~Style.Default) !== 0) {
      throw new RangeError('Unknown window style');
    }
    if (state !== State.Windowed && state !== State.Fullscreen) {
      throw new RangeError('Unknown window state');
    }
    native.openWindow(this[graphicsNative], size.x, size.y, title as string,
      bits, style, state, contextSettings(settings));
    dispatchWindowHooks(this);
  }

  /**
   * Close the window; the object remains and create can be called again.
   * @zh 关闭窗口；对象保留，可再次调用 create。
   * @ja ウィンドウを閉じる。オブジェクトは残り、create を再度呼び出せる。
   * @ko 윈도우를 닫는다. 객체는 유지되며 create를 다시 호출할 수 있다.
   */
  close(): void {
    native.closeWindow(this[graphicsNative]);
  }

  /**
   * Return whether the system window is still open.
   * @zh 返回系统窗口是否仍然打开。
   * @ja システムウィンドウがまだ開いているかどうかを返す。
   * @ko 시스템 윈도우가 아직 열려 있는지 반환한다.
   */
  isOpen(): boolean {
    return native.isWindowOpen(this[graphicsNative]);
  }

  /**
   * Return a copy of the client area's pixel dimensions.
   * @zh 返回客户区像素尺寸的副本。
   * @ja クライアント領域のピクセル寸法のコピーを返す。
   * @ko 클라이언트 영역 픽셀 크기의 복사본을 반환한다.
   */
  getSize(): Vector2u {
    const [ width, height ] = native.getWindowSize(this[graphicsNative]);
    return new Vector2u(width, height);
  }

  /**
   * Return the window's pixel position on the desktop.
   * @zh 返回窗口在桌面中的像素位置。
   * @ja デスクトップ上のウィンドウのピクセル位置を返す。
   * @ko 데스크톱에서 윈도우의 픽셀 위치를 반환한다.
   */
  getPosition(): Vector2i {
    return new Vector2i(...native.getWindowPosition(this[graphicsNative]));
  }

  /**
   * Set the window's pixel position on the desktop.
   * @zh 设置窗口在桌面中的像素位置。
   * @ja デスクトップ上のウィンドウのピクセル位置を設定する。
   * @ko 데스크톱에서 윈도우의 픽셀 위치를 설정한다.
   */
  setPosition(position: Readonly<Vector2i>): void {
    if (!(position instanceof Vector2) || position.scalarType !== 'i32') {
      throw new TypeError('Expected a Vector2i');
    }
    native.windowCommand(this[graphicsNative], 'position', position.x, position.y);
  }

  /**
   * Set the client area's pixel dimensions; width and height must be positive.
   * @zh 设置客户区像素尺寸，宽高必须为正。
   * @ja クライアント領域のピクセル寸法を設定する。幅と高さは正でなければならない。
   * @ko 클라이언트 영역의 픽셀 크기를 설정한다. 너비와 높이는 양수여야 한다.
   */
  setSize(size: Readonly<Vector2u>): void {
    windowSize(size);
    native.windowCommand(this[graphicsNative], 'size', size.x, size.y);
    dispatchWindowHooks(this);
  }

  /**
   * Set the client area's minimum pixel dimensions; undefined removes the
   * limit.
   * @zh 设置客户区最小像素尺寸；undefined 取消限制。
   * @ja クライアント領域の最小ピクセル寸法を設定する。undefined は制限を解除する。
   * @ko 클라이언트 영역의 최소 픽셀 크기를 설정한다. undefined는 제한을 해제한다.
   */
  setMinimumSize(size: Readonly<Vector2u> | undefined): void {
    if (size !== undefined) windowSize(size);
    native.windowCommand(this[graphicsNative], 'minimumSize', size?.x, size?.y);
    dispatchWindowHooks(this);
  }

  /**
   * Set the client area's maximum pixel dimensions; undefined removes the
   * limit.
   * @zh 设置客户区最大像素尺寸；undefined 取消限制。
   * @ja クライアント領域の最大ピクセル寸法を設定する。undefined は制限を解除する。
   * @ko 클라이언트 영역의 최대 픽셀 크기를 설정한다. undefined는 제한을 해제한다.
   */
  setMaximumSize(size: Readonly<Vector2u> | undefined): void {
    if (size !== undefined) windowSize(size);
    native.windowCommand(this[graphicsNative], 'maximumSize', size?.x, size?.y);
    dispatchWindowHooks(this);
  }

  /**
   * Set the window title.
   * @zh 设置窗口标题。
   * @ja ウィンドウのタイトルを設定する。
   * @ko 윈도우 제목을 설정한다.
   */
  setTitle(title: string): void {
    native.windowCommand(this[graphicsNative], 'title', title);
  }

  /**
   * Set the RGBA8 window icon; pixel data must contain at least
   * size.x×size.y×4 bytes.
   * @zh 设置 RGBA8 窗口图标；像素数据至少包含 size.x×size.y×4 字节。
   * @ja RGBA8 ウィンドウアイコンを設定する。ピクセルデータは最低
   * size.x×size.y×4 バイト必要。
   * @ko RGBA8 윈도우 아이콘을 설정한다. 픽셀 데이터는 최소 size.x×size.y×4 바이트가
   * 필요하다.
   */
  setIcon(size: Readonly<Vector2u>, pixels: Uint8Array): void {
    rgbaPixels(size, pixels);
    native.setWindowIcon(this[graphicsNative], size.x, size.y, pixels);
  }

  /**
   * Show or hide the window.
   * @zh 显示或隐藏窗口。
   * @ja ウィンドウを表示または非表示にする。
   * @ko 윈도우를 표시하거나 숨긴다.
   */
  setVisible(visible: boolean): void {
    native.windowCommand(this[graphicsNative], 'visible', visible);
  }

  /**
   * Set whether the mouse cursor is visible in the client area.
   * @zh 设置鼠标在客户区中是否显示光标。
   * @ja クライアント領域内でマウスカーソルを表示するか設定する。
   * @ko 클라이언트 영역에서 마우스 커서를 표시할지 설정한다.
   */
  setMouseCursorVisible(visible: boolean): void {
    native.windowCommand(this[graphicsNative], 'cursorVisible', visible);
  }

  /**
   * Set whether to confine the mouse to the window, usually only effective
   * while the window has focus.
   * @zh 设置是否将鼠标限制在窗口内，通常仅在窗口获得焦点时生效。
   * @ja マウスをウィンドウ内に制限するか設定する。
   * 通常はウィンドウにフォーカスがある間のみ有効。
   * @ko 마우스를 윈도우 안에 제한할지 설정한다.
   * 일반적으로 윈도우가 포커스를 가진 동안에만 적용된다.
   */
  setMouseCursorGrabbed(grabbed: boolean): void {
    native.windowCommand(this[graphicsNative], 'cursorGrabbed', grabbed);
  }

  /**
   * Set the cursor used within the window.
   * @zh 设置窗口内使用的光标。
   * @ja ウィンドウ内で使用するカーソルを設定する。
   * @ko 윈도우 안에서 사용할 커서를 설정한다.
   */
  setMouseCursor(cursor: Cursor): void {
    if (!(cursor instanceof Cursor)) throw new TypeError('Expected a Cursor');
    native.setWindowCursor(this[graphicsNative], cursor[graphicsNative]);
  }

  /**
   * Set whether holding a key repeatedly generates KeyPressed events.
   * @zh 设置长按键盘时是否重复产生 KeyPressed 事件。
   * @ja キーを押し続けたときに KeyPressed イベントを繰り返し発生させるか設定する。
   * @ko 키를 계속 누를 때 KeyPressed 이벤트를 반복 생성할지 설정한다.
   */
  setKeyRepeatEnabled(enabled: boolean): void {
    native.windowCommand(this[graphicsNative], 'keyRepeat', enabled);
  }

  /**
   * Set the axis-change threshold for joystick movement events, from 0 to 100.
   * @zh 设置触发手柄移动事件的轴变化阈值，范围 0～100。
   * @ja ジョイスティック移動イベントを発生させる軸変化のしきい値を 0～100 で設定する。
   * @ko 조이스틱 이동 이벤트를 발생시키는 축 변화 임계값을 0～100 범위로 설정한다.
   */
  setJoystickThreshold(threshold: number): void {
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      throw new RangeError('Joystick threshold must be from 0 to 100');
    }
    native.windowCommand(this[graphicsNative], 'joystickThreshold', threshold);
  }

  /**
   * Request window focus from the system; the window manager decides whether
   * to grant it.
   * @zh 向系统请求窗口焦点，是否获准由窗口管理器决定。
   * @ja システムにウィンドウのフォーカスを要求する。許可はウィンドウマネージャーが
   * 決定する。
   * @ko 시스템에 윈도우 포커스를 요청한다. 허용 여부는 윈도우 관리자가 결정한다.
   */
  requestFocus(): void {
    native.windowCommand(this[graphicsNative], 'focus');
  }

  /**
   * Return whether the window currently has input focus.
   * @zh 返回窗口当前是否拥有输入焦点。
   * @ja ウィンドウが現在入力フォーカスを持つかどうかを返す。
   * @ko 윈도우가 현재 입력 포커스를 갖고 있는지 반환한다.
   */
  hasFocus(): boolean {
    return native.hasWindowFocus(this[graphicsNative]);
  }

  /**
   * Return the platform-native window handle as bigint to preserve pointer
   * precision.
   * @zh 返回平台原生窗口句柄，以 bigint 保留指针精度。
   * @ja ポインター精度を保つ bigint でプラットフォーム固有のウィンドウハンドルを返す。
   * @ko 포인터 정밀도를 유지하도록 플랫폼 네이티브 윈도우 핸들을 bigint로 반환한다.
   */
  getNativeHandle(): WindowHandle {
    return native.getWindowNativeHandle(this[graphicsNative]);
  }

  /**
   * Returns the created VkSurfaceKHR, or undefined when creation fails.
   * @zh 返回创建的 VkSurfaceKHR，创建失败时返回 undefined。
   * @ja 作成した VkSurfaceKHR を返す。作成に失敗した場合は undefined。
   * @ko 생성한 VkSurfaceKHR를 반환한다. 생성 실패 시 undefined를 반환한다.
   */
  createVulkanSurface(instance: bigint, allocator = 0n): bigint | undefined {
    return native.createWindowVulkanSurface(
      this[graphicsNative], instance, allocator);
  }

  /**
   * Return the actual OpenGL context settings, which may differ from those
   * requested.
   * @zh 返回实际创建的 OpenGL 上下文配置，可能与请求值不同。
   * @ja 実際に作成された OpenGL コンテキスト設定を返す。要求値と異なる場合がある。
   * @ko 실제 생성된 OpenGL 컨텍스트 설정을 반환한다. 요청한 값과 다를 수 있다.
   */
  getSettings(): Readonly<Required<ContextSettings>> {
    return settingsFromBuffer(native.getWindowSettings(this[graphicsNative]));
  }

  /**
   * Set whether buffer swaps synchronize with the display refresh.
   * @zh 设置缓冲交换是否与显示器刷新同步。
   * @ja バッファ交換をディスプレイのリフレッシュに同期させるか設定する。
   * @ko 버퍼 교환을 디스플레이 새로 고침과 동기화할지 설정한다.
   */
  setVerticalSyncEnabled(enabled: boolean): void {
    native.windowCommand(this[graphicsNative], 'verticalSync', enabled);
  }

  /**
   * Set the maximum display calls per second; 0 removes the frame-rate
   * limit, and waiting occurs inside display.
   * @zh 设置每秒最大 display 次数；0 取消帧率限制，等待发生在 display 中。
   * @ja 1 秒あたりの display の最大回数を設定する。0 はフレームレート制限を解除し、
   * 待機は display 内で行われる。
   * @ko 초당 최대 display 호출 수를 설정한다. 0은 프레임 속도 제한을 해제하며
   * 대기는 display 안에서 이루어진다.
   */
  setFramerateLimit(limit: number): void {
    unsigned(limit);
    native.windowCommand(this[graphicsNative], 'framerateLimit', limit);
  }

  /**
   * Retrieve one window event without blocking; return undefined if the
   * queue is empty.
   * @zh 非阻塞取出一个窗口事件；队列为空时返回 undefined。
   * @ja ブロックせずにウィンドウイベントを 1 件取り出す。キューが空なら undefined。
   * @ko 블로킹 없이 윈도우 이벤트 하나를 꺼낸다. 큐가 비어 있으면 undefined를 반환한다.
   */
  pollEvent(): Event | undefined {
    const raw = native.pollWindowEvent(this[graphicsNative]);
    dispatchWindowHooks(this);
    return raw === undefined ? undefined : windowEvent(raw);
  }

  /**
   * Blocks the calling thread like SFML; Time.Zero waits indefinitely.
   * @zh 与 SFML 一样阻塞调用线程；Time.Zero 表示无限等待。
   * @ja SFML と同様に呼び出しスレッドをブロックする。Time.Zero は無期限に待機する。
   * @ko SFML처럼 호출 스레드를 블로킹한다. Time.Zero는 무기한 대기한다.
   */
  waitEvent(timeout: ReadonlyValue<Time> = Time.Zero): Event | undefined {
    if (!(timeout instanceof Time)) throw new TypeError('Expected a Time');
    const raw = native.waitWindowEvent(
      this[graphicsNative], timeout.asMicroseconds());
    dispatchWindowHooks(this);
    return raw === undefined ? undefined : windowEvent(raw);
  }

  /**
   * Specific handlers take precedence over the optional fallback.
   * @zh 专用处理函数优先于可选的后备处理函数。
   * @ja 個別のハンドラーは任意指定のフォールバックより優先される。
   * @ko 개별 핸들러가 선택적 폴백보다 우선한다.
   */
  handleEvents(handlers: EventHandlers, fallback?: EventVisitor): void;
  /**
   * Drain the current event queue, passing event data synchronously to visitor
   * in order.
   * @zh 排空当前事件队列，按顺序同步将事件数据交给 visitor。
   * @ja 現在のイベントキューを空にし、イベントデータを順番に同期的に visitor へ渡す。
   * @ko 현재 이벤트 큐를 비우고 이벤트 데이터를 순서대로 동기적으로 visitor에 전달한다.
   */
  handleEvents(visitor: EventVisitor): void;
  handleEvents(
    handlers: EventHandlers | EventVisitor, fallback?: EventVisitor,
  ): void {
    let event: Event | undefined;
    while ((event = this.pollEvent()) !== undefined) {
      const handler = typeof handlers === 'function' ? handlers
        : handlers[event.kind] as EventVisitor | undefined;
      (handler ?? fallback)?.(event.data);
    }
  }

  /**
   * Activate or deactivate the window's OpenGL context on the current thread,
   * returning whether it succeeded.
   * @zh 激活或停用当前线程的窗口 OpenGL 上下文，返回是否成功。
   * @ja 現在のスレッドでウィンドウの OpenGL コンテキストを有効化または無効化し、
   * 成功したかどうかを返す。
   * @ko 현재 스레드에서 윈도우의 OpenGL 컨텍스트를 활성화 또는 비활성화하고
   * 성공 여부를 반환한다.
   */
  setActive(active = true): boolean {
    return native.setWindowActive(this[graphicsNative], active);
  }

  /**
   * Swap the OpenGL front and back buffers; vertical sync and frame-rate
   * limits may block the current thread.
   * @zh 交换 OpenGL 前后缓冲；垂直同步和帧率限制可能阻塞当前线程。
   * @ja OpenGL のフロントバッファとバックバッファを交換する。垂直同期と
   * フレームレート制限により現在のスレッドがブロックされる場合がある。
   * @ko OpenGL 전면 및 후면 버퍼를 교환한다. 수직 동기화와 프레임 속도 제한이
   * 현재 스레드를 블로킹할 수 있다.
   */
  display(): void {
    native.displayWindow(this[graphicsNative]);
  }
}

/**
 * Share Window methods with a RenderTarget subclass without another window.
 * @zh 不创建另一个窗口，与 RenderTarget 子类共享 Window 方法。
 * @ja 別のウィンドウを作らずに RenderTarget サブクラスと Window メソッドを共有する。
 * @ko 다른 윈도우를 만들지 않고 RenderTarget 하위 클래스와 Window 메서드를 공유한다.
 */
export function installWindowMethods(prototype: object): void {
  for (const key of Reflect.ownKeys(Window.prototype)) {
    if (key === 'constructor' || key in prototype) continue;
    Object.defineProperty(prototype, key,
      Object.getOwnPropertyDescriptor(Window.prototype, key)!);
  }
}
