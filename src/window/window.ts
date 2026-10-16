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

/** Platform window handles and Vulkan pointers are represented losslessly. */
export type WindowHandle = bigint;

/** 窗口创建参数。 */
export interface WindowOptions {
  /** 样式位标志，默认 Style.Default。 */
  style?: Style;
  /** 窗口化或全屏，默认 Windowed。 */
  state?: State;
  /** 请求的 OpenGL 上下文配置，实际配置通过 getSettings 查询。 */
  settings?: Readonly<ContextSettings>;
}

const mixedWindows = new WeakSet<object>();

/** 窗口钩子仅由弱键持有，不让 Native 反向保留 JS 对象。 */
const windowHooks = new WeakMap<Window, readonly [() => void, () => void]>();

/** 注册构造完成后的动态钩子，渲染窗口可在创建钩子前初始化视图。 */
export function registerWindowHooks(
  window: Window, onCreate: () => void, onResize: () => void,
): void {
  windowHooks.set(window, [ onCreate, onResize ]);
}

/** 原生操作返回后逐条消费通知；关闭或重建会清除旧窗口的剩余通知。 */
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

/** An OS window with an OpenGL context, usable by Texture.update(). */
export class Window {
  readonly [graphicsNative]: NativeGraphicsHandle<'window'>;

  static [Symbol.hasInstance](value: unknown): boolean {
    return Function.prototype[Symbol.hasInstance].call(this, value) ||
      (this === Window && typeof value === 'object' && value !== null &&
        mixedWindows.has(value));
  }

  /** 创建尚未打开的窗口对象。 */
  constructor();
  /** 使用像素尺寸、标题和配置打开窗口。 */
  constructor(
    mode: Readonly<VideoMode> | Readonly<Vector2u>, title: string,
    options?: Readonly<WindowOptions>,
  );
  /** 为已有系统窗口句柄创建 OpenGL 上下文。 */
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

  /** 显式 create 成功后同步调用；有参基类构造期间不调用派生钩子。 */
  protected onCreate(): void {}

  /** SFML 实际通知尺寸变化后同步调用，不消费对应的 Resized 事件。 */
  protected onResize(): void {}

  /** 打开或重建窗口；mode 为像素尺寸或完整视频模式。 */
  create(
    mode: Readonly<VideoMode> | Readonly<Vector2u>, title: string,
    options?: Readonly<WindowOptions>,
  ): void;
  /** 使用已有系统窗口句柄重建 OpenGL 上下文。 */
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

  /** 关闭窗口；对象保留，可再次调用 create。 */
  close(): void {
    native.closeWindow(this[graphicsNative]);
  }

  /** 返回系统窗口是否仍然打开。 */
  isOpen(): boolean {
    return native.isWindowOpen(this[graphicsNative]);
  }

  /** 返回客户区像素尺寸的副本。 */
  getSize(): Vector2u {
    const [ width, height ] = native.getWindowSize(this[graphicsNative]);
    return new Vector2u(width, height);
  }

  /** 返回窗口在桌面中的像素位置。 */
  getPosition(): Vector2i {
    return new Vector2i(...native.getWindowPosition(this[graphicsNative]));
  }

  /** 设置窗口在桌面中的像素位置。 */
  setPosition(position: Readonly<Vector2i>): void {
    if (!(position instanceof Vector2) || position.scalarType !== 'i32') {
      throw new TypeError('Expected a Vector2i');
    }
    native.windowCommand(this[graphicsNative], 'position', position.x, position.y);
  }

  /** 设置客户区像素尺寸，宽高必须为正。 */
  setSize(size: Readonly<Vector2u>): void {
    windowSize(size);
    native.windowCommand(this[graphicsNative], 'size', size.x, size.y);
    dispatchWindowHooks(this);
  }

  /** 设置客户区最小像素尺寸；undefined 取消限制。 */
  setMinimumSize(size: Readonly<Vector2u> | undefined): void {
    if (size !== undefined) windowSize(size);
    native.windowCommand(this[graphicsNative], 'minimumSize', size?.x, size?.y);
    dispatchWindowHooks(this);
  }

  /** 设置客户区最大像素尺寸；undefined 取消限制。 */
  setMaximumSize(size: Readonly<Vector2u> | undefined): void {
    if (size !== undefined) windowSize(size);
    native.windowCommand(this[graphicsNative], 'maximumSize', size?.x, size?.y);
    dispatchWindowHooks(this);
  }

  /** 设置窗口标题。 */
  setTitle(title: string): void {
    native.windowCommand(this[graphicsNative], 'title', title);
  }

  /** 设置 RGBA8 窗口图标；像素数据至少包含 size.x×size.y×4 字节。 */
  setIcon(size: Readonly<Vector2u>, pixels: Uint8Array): void {
    rgbaPixels(size, pixels);
    native.setWindowIcon(this[graphicsNative], size.x, size.y, pixels);
  }

  /** 显示或隐藏窗口。 */
  setVisible(visible: boolean): void {
    native.windowCommand(this[graphicsNative], 'visible', visible);
  }

  /** 设置鼠标在客户区中是否显示光标。 */
  setMouseCursorVisible(visible: boolean): void {
    native.windowCommand(this[graphicsNative], 'cursorVisible', visible);
  }

  /** 设置是否将鼠标限制在窗口内，通常仅在窗口获得焦点时生效。 */
  setMouseCursorGrabbed(grabbed: boolean): void {
    native.windowCommand(this[graphicsNative], 'cursorGrabbed', grabbed);
  }

  /** 设置窗口内使用的光标。 */
  setMouseCursor(cursor: Cursor): void {
    if (!(cursor instanceof Cursor)) throw new TypeError('Expected a Cursor');
    native.setWindowCursor(this[graphicsNative], cursor[graphicsNative]);
  }

  /** 设置长按键盘时是否重复产生 KeyPressed 事件。 */
  setKeyRepeatEnabled(enabled: boolean): void {
    native.windowCommand(this[graphicsNative], 'keyRepeat', enabled);
  }

  /** 设置触发手柄移动事件的轴变化阈值，范围 0～100。 */
  setJoystickThreshold(threshold: number): void {
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      throw new RangeError('Joystick threshold must be from 0 to 100');
    }
    native.windowCommand(this[graphicsNative], 'joystickThreshold', threshold);
  }

  /** 向系统请求窗口焦点，是否获准由窗口管理器决定。 */
  requestFocus(): void {
    native.windowCommand(this[graphicsNative], 'focus');
  }

  /** 返回窗口当前是否拥有输入焦点。 */
  hasFocus(): boolean {
    return native.hasWindowFocus(this[graphicsNative]);
  }

  /** 返回平台原生窗口句柄，以 bigint 保留指针精度。 */
  getNativeHandle(): WindowHandle {
    return native.getWindowNativeHandle(this[graphicsNative]);
  }

  /** Returns the created VkSurfaceKHR, or undefined when creation fails. */
  createVulkanSurface(instance: bigint, allocator = 0n): bigint | undefined {
    return native.createWindowVulkanSurface(
      this[graphicsNative], instance, allocator);
  }

  /** 返回实际创建的 OpenGL 上下文配置，可能与请求值不同。 */
  getSettings(): Readonly<Required<ContextSettings>> {
    return settingsFromBuffer(native.getWindowSettings(this[graphicsNative]));
  }

  /** 设置缓冲交换是否与显示器刷新同步。 */
  setVerticalSyncEnabled(enabled: boolean): void {
    native.windowCommand(this[graphicsNative], 'verticalSync', enabled);
  }

  /** 设置每秒最大 display 次数；0 取消帧率限制，等待发生在 display 中。 */
  setFramerateLimit(limit: number): void {
    unsigned(limit);
    native.windowCommand(this[graphicsNative], 'framerateLimit', limit);
  }

  /** 非阻塞取出一个窗口事件；队列为空时返回 undefined。 */
  pollEvent(): Event | undefined {
    const raw = native.pollWindowEvent(this[graphicsNative]);
    dispatchWindowHooks(this);
    return raw === undefined ? undefined : windowEvent(raw);
  }

  /** Blocks the calling thread like SFML; Time.Zero waits indefinitely. */
  waitEvent(timeout: ReadonlyValue<Time> = Time.Zero): Event | undefined {
    if (!(timeout instanceof Time)) throw new TypeError('Expected a Time');
    const raw = native.waitWindowEvent(
      this[graphicsNative], timeout.asMicroseconds());
    dispatchWindowHooks(this);
    return raw === undefined ? undefined : windowEvent(raw);
  }

  /** Specific handlers take precedence over the optional fallback. */
  handleEvents(handlers: EventHandlers, fallback?: EventVisitor): void;
  /** 排空当前事件队列，按顺序同步将事件数据交给 visitor。 */
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

  /** 激活或停用当前线程的窗口 OpenGL 上下文，返回是否成功。 */
  setActive(active = true): boolean {
    return native.setWindowActive(this[graphicsNative], active);
  }

  /** 交换 OpenGL 前后缓冲；垂直同步和帧率限制可能阻塞当前线程。 */
  display(): void {
    native.displayWindow(this[graphicsNative]);
  }
}

/** Share Window methods with a RenderTarget subclass without another window. */
export function installWindowMethods(prototype: object): void {
  for (const key of Reflect.ownKeys(Window.prototype)) {
    if (key === 'constructor' || key in prototype) continue;
    Object.defineProperty(prototype, key,
      Object.getOwnPropertyDescriptor(Window.prototype, key)!);
  }
}
