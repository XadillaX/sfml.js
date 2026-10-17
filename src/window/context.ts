import { native, type NativeContextMapping } from '../internal/native';
import { flushGraphics, graphicsNative } from '../internal/graphics-state';
import {
  contextSettings, settingsFromBuffer, type ContextSettings,
} from './context-settings';
import { windowSize } from './video-mode';
import type { Vector2u } from '../system/vector2';

/**
 * A read-only settings interface for the current OpenGL context.
 * @zh 当前 OpenGL 上下文的只读配置接口。
 * @ja 現在の OpenGL コンテキストの読み取り専用設定インターフェース。
 * @ko 현재 OpenGL 컨텍스트의 읽기 전용 설정 인터페이스.
 */
export type ReadonlyContext = Readonly<Pick<Context, 'getSettings'>>;

const contexts = new Map<bigint, WeakRef<Context>>();
const collected = new FinalizationRegistry<bigint>(key => {
  if (!contexts.get(key)?.deref()) contexts.delete(key);
});

function remember(key: bigint, context: Context): void {
  contexts.set(key, new WeakRef(context));
  collected.register(context, key);
}

/**
 * Native-owned OpenGL context; activation remains per native thread.
 * @zh 由原生端拥有的 OpenGL 上下文；激活状态仍按原生线程区分。
 * @ja ネイティブ側が所有する OpenGL コンテキスト。
 * 有効化は引き続きネイティブスレッド単位で行う。
 * @ko 네이티브 측이 소유한 OpenGL 컨텍스트. 활성화는 네이티브 스레드별로 유지된다.
 */
export class Context {
  readonly [graphicsNative]: NativeContextMapping['handle'];
  private readonly settings: Readonly<Required<ContextSettings>>;

  /**
   * Create a default OpenGL context.
   * @zh 创建默认 OpenGL 上下文。
   * @ja 既定の OpenGL コンテキストを作成する。
   * @ko 기본 OpenGL 컨텍스트를 생성한다.
   */
  constructor();
  /**
   * Create an OpenGL context with the settings and pixel dimensions.
   * @zh 按配置和像素尺寸创建 OpenGL 上下文。
   * @ja 設定とピクセル寸法を指定して OpenGL コンテキストを作成する。
   * @ko 설정과 픽셀 크기로 OpenGL 컨텍스트를 생성한다.
   */
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

  /**
   * Submit queued draws and activate or deactivate the context on the current
   * native thread, returning whether it succeeded.
   * @zh 提交排队绘制并在当前原生线程激活或停用上下文，返回是否成功。
   * @ja キュー内の描画を送信し、現在のネイティブスレッドでコンテキストを
   * 有効化または無効化して、成功したかどうかを返す。
   * @ko 대기 중인 그리기를 제출하고 현재 네이티브 스레드에서 컨텍스트를
   * 활성화 또는 비활성화한 뒤 성공 여부를 반환한다.
   */
  setActive(active: boolean): boolean {
    if (typeof active !== 'boolean') throw new TypeError('Expected a boolean');
    flushGraphics();
    return native.setContextActive(this[graphicsNative], active);
  }

  /**
   * Return the settings of the context actually created.
   * @zh 返回实际创建的上下文配置。
   * @ja 実際に作成されたコンテキストの設定を返す。
   * @ko 실제 생성된 컨텍스트의 설정을 반환한다.
   */
  getSettings(): Readonly<Required<ContextSettings>> {
    return this.settings;
  }

  /**
   * Return a read-only reference to the current thread's active context,
   * or undefined if there is no active context.
   * @zh 返回当前线程的活动上下文只读引用；没有活动上下文时返回 undefined。
   * @ja 現在のスレッドのアクティブコンテキストへの読み取り専用参照を返す。
   * アクティブコンテキストがなければ undefined を返す。
   * @ko 현재 스레드의 활성 컨텍스트에 대한 읽기 전용 참조를 반환한다.
   * 활성 컨텍스트가 없으면 undefined를 반환한다.
   */
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

  /**
   * Return the unique ID of the current thread's active context, or 0n if
   * there is no active context.
   * @zh 返回当前线程活动上下文的唯一标识，无活动上下文时为 0n。
   * @ja 現在のスレッドのアクティブコンテキストの一意な識別子を返す。
   * アクティブコンテキストがなければ 0n。
   * @ko 현재 스레드의 활성 컨텍스트 고유 식별자를 반환한다.
   * 활성 컨텍스트가 없으면 0n을 반환한다.
   */
  static getActiveContextId(): bigint {
    return native.getActiveContextId();
  }

  /**
   * Test whether the current environment supports the named OpenGL extension.
   * @zh 判断当前环境是否支持指定名称的 OpenGL 扩展。
   * @ja 指定名の OpenGL 拡張を現在の環境がサポートするか判定する。
   * @ko 현재 환경이 지정한 이름의 OpenGL 확장을 지원하는지 판별한다.
   */
  static isExtensionAvailable(name: string): boolean {
    return native.isContextExtensionAvailable(name);
  }

  /**
   * Native function address; calling it requires the matching GL signature.
   * @zh 原生函数地址；调用时需要匹配的 GL 函数签名。
   * @ja ネイティブ関数のアドレス。呼び出しには一致する GL シグネチャが必要。
   * @ko 네이티브 함수 주소. 호출하려면 일치하는 GL 시그니처가 필요하다.
   */
  static getFunction(name: string): bigint | undefined {
    return native.getContextFunction(name);
  }
}
