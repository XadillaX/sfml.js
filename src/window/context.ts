import { native, type NativeContextMapping } from '../internal/native';
import { flushGraphics, graphicsNative } from '../internal/graphics-state';
import {
  contextSettings, settingsFromBuffer, type ContextSettings,
} from './context-settings';
import { windowSize } from './video-mode';
import type { Vector2u } from '../system/vector2';

/** 当前 OpenGL 上下文的只读配置接口。 */
export type ReadonlyContext = Readonly<Pick<Context, 'getSettings'>>;

const contexts = new Map<bigint, WeakRef<Context>>();
const collected = new FinalizationRegistry<bigint>(key => {
  if (!contexts.get(key)?.deref()) contexts.delete(key);
});

function remember(key: bigint, context: Context): void {
  contexts.set(key, new WeakRef(context));
  collected.register(context, key);
}

/** Native-owned OpenGL context; activation remains per native thread. */
export class Context {
  readonly [graphicsNative]: NativeContextMapping['handle'];
  private readonly settings: Readonly<Required<ContextSettings>>;

  /** 创建默认 OpenGL 上下文。 */
  constructor();
  /** 按配置和像素尺寸创建 OpenGL 上下文。 */
  constructor(settings: Readonly<ContextSettings>, size: Readonly<Vector2u>);
  constructor(
    settings?: Readonly<ContextSettings>, size?: Readonly<Vector2u>,
  ) {
    let requested;
    if (settings !== undefined || size !== undefined) {
      if (settings === undefined || size === undefined) {
        throw new TypeError('Expected both context settings and size');
      }
      windowSize(size, false);
      requested = contextSettings(settings);
    }
    flushGraphics();
    const mapping = native.createContext(requested, size?.x, size?.y);
    this[graphicsNative] = mapping.handle;
    this.settings = settingsFromBuffer(mapping.settings);
    remember(mapping.key, this);
  }

  /** 提交排队绘制并在当前原生线程激活或停用上下文，返回是否成功。 */
  setActive(active: boolean): boolean {
    if (typeof active !== 'boolean') throw new TypeError('Expected a boolean');
    flushGraphics();
    return native.setContextActive(this[graphicsNative], active);
  }

  /** 返回实际创建的上下文配置。 */
  getSettings(): Readonly<Required<ContextSettings>> {
    return this.settings;
  }

  /** 返回当前线程的活动上下文只读引用；没有活动上下文时返回 undefined。 */
  static getActiveContext(): ReadonlyContext | undefined {
    const key = native.getActiveContextKey();
    if (key === undefined) return undefined;
    const existing = contexts.get(key)?.deref();
    if (existing) return existing;
    const mapping = native.referenceActiveContext();
    if (!mapping) return undefined;
    const context = Object.create(Context.prototype) as Context;
    Object.defineProperties(context, {
      [graphicsNative]: { value: mapping.handle },
      settings: { value: settingsFromBuffer(mapping.settings) },
    });
    remember(mapping.key, context);
    return context;
  }

  /** 返回当前线程活动上下文的唯一标识，无活动上下文时为 0n。 */
  static getActiveContextId(): bigint {
    return native.getActiveContextId();
  }

  /** 判断当前环境是否支持指定名称的 OpenGL 扩展。 */
  static isExtensionAvailable(name: string): boolean {
    return native.isContextExtensionAvailable(name);
  }

  /** Native function address; calling it requires the matching GL signature. */
  static getFunction(name: string): bigint | undefined {
    return native.getContextFunction(name);
  }
}
