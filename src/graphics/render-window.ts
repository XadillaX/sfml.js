import { native, type NativeGraphicsHandle } from '../internal/native';
import { graphicsContext, graphicsNative } from '../internal/graphics-state';
import { Vector2u } from '../system/vector2';
import {
  Window, installWindowMethods, registerMixedWindow, registerWindowHooks,
  type WindowHandle, type WindowOptions,
} from '../window/window';
import type { ContextSettings } from '../window/context-settings';
import { VideoMode, windowSize } from '../window/video-mode';
import { RenderTarget } from './render-target';
import { Image } from './image';

// Window's methods operate on the same native window owned by this target.
// installWindowMethods supplies these methods before any instance is created.
/**
 * Inherits Window operations and protected hooks from the same origin,
 * preserving Window type compatibility.
 * @zh 继承 Window 的窗口操作和同源受保护钩子，保持 Window 类型兼容。
 * @ja Window の操作と同じ宣言元の protected フックを継承し、Window 型との互換性を保ちます。
 * @ko Window의 창 작업과 동일한 선언에서 유래한 protected 훅을 상속하여 Window 형식 호환성을 유지합니다.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface RenderWindow extends Window {}

/**
 * A window supporting both Window operations and RenderTarget 2D drawing.
 * @zh 同时支持 Window 窗口操作和 RenderTarget 二维绘制的窗口。
 * @ja Window のウィンドウ操作と RenderTarget の二次元描画を両方サポートするウィンドウ。
 * @ko Window 창 작업과 RenderTarget 2차원 그리기를 모두 지원하는 창입니다.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class RenderWindow extends RenderTarget {
  readonly [graphicsNative]: NativeGraphicsHandle<'window'>;
  /**
   * Native render window target handle, distinct from the Window handle.
   * @zh 渲染窗口 Native 目标句柄，与 Window 句柄不同。
   * @ja Window ハンドルとは異なる、レンダーウィンドウの Native ターゲットハンドル。
   * @ko Window 핸들과 다른 렌더 창의 Native 대상 핸들입니다.
   */
  private readonly target: NativeGraphicsHandle<'renderWindow'>;

  /**
   * Creates a render window that is not yet open.
   * @zh 创建尚未打开的渲染窗口。
   * @ja まだ開いていないレンダーウィンドウを作成します。
   * @ko 아직 열리지 않은 렌더 창을 만듭니다.
   */
  constructor();
  /**
   * Creates a render window with pixel size, title and optional window
   * parameters.
   * @zh 以像素尺寸、标题和可选窗口参数创建渲染窗口。
   * @ja ピクセルサイズ、タイトル、任意のウィンドウパラメーターでレンダーウィンドウを作成します。
   * @ko 픽셀 크기, 제목 및 선택적 창 매개변수로 렌더 창을 만듭니다.
   */
  constructor(
    mode: Readonly<VideoMode> | Readonly<Vector2u>, title: string,
    options?: Readonly<WindowOptions>,
  );
  /**
   * Creates a rendering context for an existing system window handle.
   * @zh 为现有系统窗口句柄创建渲染上下文。
   * @ja 既存のシステムウィンドウハンドル用に描画コンテキストを作成します。
   * @ko 기존 시스템 창 핸들의 렌더링 컨텍스트를 만듭니다.
   */
  constructor(handle: WindowHandle, settings?: Readonly<ContextSettings>);
  constructor(
    mode?: Readonly<VideoMode> | Readonly<Vector2u> | WindowHandle,
    title?: string | Readonly<ContextSettings>,
    options: Readonly<WindowOptions> = {},
  ) {
    const mapping = native.createRenderWindow(graphicsContext());
    super(mapping.buffer);
    this.target = mapping.handle;
    this[graphicsNative] = mapping.window;
    registerMixedWindow(this);
    if (typeof mode === 'bigint') {
      Window.prototype.create.call(this, mode, title as ContextSettings);
    } else if (mode !== undefined) {
      Window.prototype.create.bind(this)(mode, title as string, options);
    }
    /**
     * Synchronizes default and current views before allowing user hooks to
     * modify the current view.
     * @zh 先同步默认和当前视图，再允许用户钩子修改当前视图。
     * @ja 既定ビューと現在のビューを同期してから、ユーザーフックによる現在のビューの変更を許可します。
     * @ko 기본 뷰와 현재 뷰를 동기화한 후 사용자 훅이 현재 뷰를 수정할 수 있게 합니다.
     */
    const initializeViews = () => {
      super.initializeViews(Window.prototype.getSize.call(this));
    };
    if (native.isWindowOpen(this[graphicsNative])) initializeViews();
    registerWindowHooks(this, () => {
      initializeViews();
      this.onCreate();
    }, () => this.onResize());
  }

  /**
   * Opens or recreates the render window; mode specifies its pixel size.
   * @zh 打开或重建渲染窗口，mode 指定像素尺寸。
   * @ja レンダーウィンドウを開くか再作成します。mode はピクセルサイズを指定します。
   * @ko 렌더 창을 열거나 다시 만듭니다. mode는 픽셀 크기를 지정합니다.
   */
  create(
    mode: Readonly<VideoMode> | Readonly<Vector2u>, title: string,
    options?: Readonly<WindowOptions>,
  ): void;
  /**
   * Recreates a rendering context using an existing system window handle.
   * @zh 用现有系统窗口句柄重建渲染上下文。
   * @ja 既存のシステムウィンドウハンドルで描画コンテキストを再作成します。
   * @ko 기존 시스템 창 핸들로 렌더링 컨텍스트를 다시 만듭니다.
   */
  create(handle: WindowHandle, settings?: Readonly<ContextSettings>): void;
  create(
    mode: Readonly<VideoMode> | Readonly<Vector2u> | WindowHandle,
    title?: string | Readonly<ContextSettings>,
    options: Readonly<WindowOptions> = {},
  ): void {
    this.flush();
    if (typeof mode === 'bigint') {
      Window.prototype.create.call(this, mode, title as ContextSettings);
    } else {
      // Use the complete overload set when forwarding the window arguments.
      const create = Window.prototype.create.bind(this);
      create(mode, title as string, options);
    }
  }

  /**
   * Submits queued draws and closes the window; create can be called again on
   * this object.
   * @zh 提交排队绘制并关闭窗口；对象之后可再次 create。
   * @ja キュー内の描画を送信してウィンドウを閉じます。このオブジェクトで再び create を呼び出せます。
   * @ko 대기 중인 그리기를 제출하고 창을 닫습니다. 이후 이 객체에서 create를 다시 호출할 수 있습니다.
   */
  close(): void {
    this.flush();
    Window.prototype.close.call(this);
  }

  /**
   * Returns the window client area's pixel size.
   * @zh 返回窗口客户区的像素尺寸。
   * @ja ウィンドウのクライアント領域のピクセルサイズを返します。
   * @ko 창 클라이언트 영역의 픽셀 크기를 반환합니다.
   */
  getSize(): Vector2u {
    return Window.prototype.getSize.call(this);
  }

  /**
   * Submits queued draws and sets the client area's pixel size.
   * @zh 提交排队绘制并设置客户区像素尺寸。
   * @ja キュー内の描画を送信し、クライアント領域のピクセルサイズを設定します。
   * @ko 대기 중인 그리기를 제출하고 클라이언트 영역의 픽셀 크기를 설정합니다.
   */
  setSize(size: Readonly<Vector2u>): void {
    windowSize(size);
    this.flush();
    Window.prototype.setSize.call(this, size);
  }

  /**
   * Sets the minimum client area size in pixels; undefined removes the limit.
   * @zh 设置客户区最小像素尺寸；undefined 取消限制。
   * @ja クライアント領域の最小ピクセルサイズを設定します。undefined は制限を解除します。
   * @ko 클라이언트 영역의 최소 픽셀 크기를 설정합니다. undefined는 제한을 해제합니다.
   */
  setMinimumSize(size: Readonly<Vector2u> | undefined): void {
    if (size !== undefined) windowSize(size);
    this.flush();
    Window.prototype.setMinimumSize.call(this, size);
  }

  /**
   * Sets the maximum client area size in pixels; undefined removes the limit.
   * @zh 设置客户区最大像素尺寸；undefined 取消限制。
   * @ja クライアント領域の最大ピクセルサイズを設定します。undefined は制限を解除します。
   * @ko 클라이언트 영역의 최대 픽셀 크기를 설정합니다. undefined는 제한을 해제합니다.
   */
  setMaximumSize(size: Readonly<Vector2u> | undefined): void {
    if (size !== undefined) windowSize(size);
    this.flush();
    Window.prototype.setMaximumSize.call(this, size);
  }

  /**
   * Sets the window icon using an image.
   * @zh 使用图像设置窗口图标。
   * @ja 画像を使ってウィンドウアイコンを設定します。
   * @ko 이미지로 창 아이콘을 설정합니다.
   */
  setIcon(image: Image): void;
  /**
   * Sets the window icon using RGBA8 pixels of the specified size.
   * @zh 使用指定尺寸的 RGBA8 像素设置窗口图标。
   * @ja 指定サイズの RGBA8 ピクセルでウィンドウアイコンを設定します。
   * @ko 지정한 크기의 RGBA8 픽셀로 창 아이콘을 설정합니다.
   */
  setIcon(size: Readonly<Vector2u>, pixels: Uint8Array): void;
  setIcon(imageOrSize: Image | Readonly<Vector2u>, pixels?: Uint8Array): void {
    if (imageOrSize instanceof Image) {
      Window.prototype.setIcon.call(this,
        imageOrSize.getSize(), imageOrSize.pixels);
    } else {
      Window.prototype.setIcon.call(this, imageOrSize, pixels!);
    }
  }

  /**
   * Returns whether the window framebuffer enables sRGB color conversion.
   * @zh 返回窗口帧缓冲是否启用 sRGB 颜色转换。
   * @ja ウィンドウのフレームバッファーで sRGB 色変換が有効かを返します。
   * @ko 창 프레임버퍼의 sRGB 색상 변환 활성화 여부를 반환합니다.
   */
  isSrgb(): boolean {
    return native.isRenderWindowSrgb(this.target);
  }

  /**
   * Synchronously submits draws and swaps window buffers; may wait for vertical
   * sync or the frame rate limit.
   * @zh 同步提交绘制并交换窗口缓冲；可受垂直同步或帧率上限影响而等待。
   * @ja 描画を同期的に送信し、ウィンドウバッファーを交換します。垂直同期やフレームレート上限により待機する場合があります。
   * @ko 그리기를 동기적으로 제출하고 창 버퍼를 교환합니다. 수직 동기화 또는 프레임 속도 제한으로 대기할 수 있습니다.
   */
  display(): void {
    this.submit(true);
  }

  protected submitCommands(count: number, display: boolean): void {
    native.submitRenderWindow(this.target, count, display);
  }

  protected allocateVertexBuffer(capacity: number): ArrayBuffer {
    return native.allocateRenderWindowVertices(this.target, capacity);
  }

  protected activate(active: boolean): boolean {
    return native.setRenderWindowActive(this.target, active);
  }

  protected changeGLStates(operation: 0 | 1 | 2): void {
    native.changeRenderWindowGLStates(this.target, operation);
  }
}

installWindowMethods(RenderWindow.prototype);
