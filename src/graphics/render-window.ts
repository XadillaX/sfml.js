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
/** 继承 Window 的窗口操作和同源受保护钩子，保持 Window 类型兼容。 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface RenderWindow extends Window {}

/** 同时支持 Window 窗口操作和 RenderTarget 二维绘制的窗口。 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class RenderWindow extends RenderTarget {
  readonly [graphicsNative]: NativeGraphicsHandle<'window'>;
  /** 渲染窗口 Native 目标句柄，与 Window 句柄不同。 */
  private readonly target: NativeGraphicsHandle<'renderWindow'>;

  /** 创建尚未打开的渲染窗口。 */
  constructor();
  /** 以像素尺寸、标题和可选窗口参数创建渲染窗口。 */
  constructor(
    mode: Readonly<VideoMode> | Readonly<Vector2u>, title: string,
    options?: Readonly<WindowOptions>,
  );
  /** 为现有系统窗口句柄创建渲染上下文。 */
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
    /** 先同步默认和当前视图，再允许用户钩子修改当前视图。 */
    const initializeViews = () => {
      super.initializeViews(Window.prototype.getSize.call(this));
    };
    if (native.isWindowOpen(this[graphicsNative])) initializeViews();
    registerWindowHooks(this, () => {
      initializeViews();
      this.onCreate();
    }, () => this.onResize());
  }

  /** 打开或重建渲染窗口，mode 指定像素尺寸。 */
  create(
    mode: Readonly<VideoMode> | Readonly<Vector2u>, title: string,
    options?: Readonly<WindowOptions>,
  ): void;
  /** 用现有系统窗口句柄重建渲染上下文。 */
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

  /** 提交排队绘制并关闭窗口；对象之后可再次 create。 */
  close(): void {
    this.flush();
    Window.prototype.close.call(this);
  }

  /** 返回窗口客户区的像素尺寸。 */
  getSize(): Vector2u {
    return Window.prototype.getSize.call(this);
  }

  /** 提交排队绘制并设置客户区像素尺寸。 */
  setSize(size: Readonly<Vector2u>): void {
    windowSize(size);
    this.flush();
    Window.prototype.setSize.call(this, size);
  }

  /** 设置客户区最小像素尺寸；undefined 取消限制。 */
  setMinimumSize(size: Readonly<Vector2u> | undefined): void {
    if (size !== undefined) windowSize(size);
    this.flush();
    Window.prototype.setMinimumSize.call(this, size);
  }

  /** 设置客户区最大像素尺寸；undefined 取消限制。 */
  setMaximumSize(size: Readonly<Vector2u> | undefined): void {
    if (size !== undefined) windowSize(size);
    this.flush();
    Window.prototype.setMaximumSize.call(this, size);
  }

  /** 使用图像设置窗口图标。 */
  setIcon(image: Image): void;
  /** 使用指定尺寸的 RGBA8 像素设置窗口图标。 */
  setIcon(size: Readonly<Vector2u>, pixels: Uint8Array): void;
  setIcon(imageOrSize: Image | Readonly<Vector2u>, pixels?: Uint8Array): void {
    if (imageOrSize instanceof Image) {
      Window.prototype.setIcon.call(this,
        imageOrSize.getSize(), imageOrSize.pixels);
    } else {
      Window.prototype.setIcon.call(this, imageOrSize, pixels!);
    }
  }

  /** 返回窗口帧缓冲是否启用 sRGB 颜色转换。 */
  isSrgb(): boolean {
    return native.isRenderWindowSrgb(this.target);
  }

  /** 同步提交绘制并交换窗口缓冲；可受垂直同步或帧率上限影响而等待。 */
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
