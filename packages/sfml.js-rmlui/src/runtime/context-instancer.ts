import { native } from '../internal/native';
import { Context } from './context';
import {
  renderManagerFromNative, renderManagerHandle,
  type RenderManager,
} from '../rendering/render-manager';
import {
  textInputHandlerFromNative, textInputHandlerHandle,
  type TextInputHandler,
} from '../platform/text-input-handler';

const handles = new WeakMap<ContextInstancer, object>();

/**
 * Copied name captured before native context destruction.
 *
 * @zh 原生上下文销毁前捕获的名称副本。
 * @ja ネイティブコンテキストの破棄前に記録する名前のコピー。
 * @ko 네이티브 컨텍스트 파괴 전에 기록한 이름 복사본입니다.
 */
export interface ContextReleaseSnapshot {
  /**
   * Released native context name.
   *
   * @zh 已释放的原生上下文名称。
   * @ja 解放されたネイティブコンテキスト名。
   * @ko 해제한 네이티브 컨텍스트 이름입니다.
   */
  name: string;
}

/**
 * Allocate an owned context through another native instancer.
 *
 * @zh 通过另一原生实例器分配自有上下文。
 * @ja 別のネイティブ生成器で所有コンテキストを作ります。
 * @ko 다른 네이티브 생성기로 소유 컨텍스트를 생성합니다.
 */
export interface ContextInstanceCallback {
  /**
   * Return a context allocated with the same native constructor arguments.
   *
   * @zh 返回使用相同原生构造参数分配的上下文。
   * @ja 同じネイティブ引数で生成したコンテキストを返します。
   * @ko 동일한 네이티브 인수로 생성한 컨텍스트를 반환합니다.
   * @param name - Exact native context name.
   * @zh name - 精确原生上下文名称。
   * @ja name - 正確なネイティブコンテキスト名。
   * @ko name - 정확한 네이티브 컨텍스트 이름입니다.
   * @param manager - Native render manager borrowed by the context.
   * @zh manager - 上下文借用的原生渲染管理器。
   * @ja manager - コンテキストが借用する描画管理オブジェクト。
   * @ko manager - 컨텍스트가 빌리는 네이티브 렌더링 관리자입니다.
   * @param handler - Native text-input handler, or null.
   * @zh handler - 原生文本输入处理器，或 null。
   * @ja handler - ネイティブ文字入力ハンドラー、または null。
   * @ko handler - 네이티브 텍스트 입력 처리기 또는 null입니다.
   * @returns Detached owned context, or null to decline creation.
   * @zh 独立自有上下文；null 拒绝创建。
   * @ja 独立した所有コンテキスト。null は生成を拒否します。
   * @ko 독립 소유 컨텍스트이며 null은 생성을 거부합니다.
   */
  (
    name: string, manager: RenderManager, handler: TextInputHandler | null,
  ): Context | null;
}

/**
 * Observe completed native destruction at a safe runtime boundary.
 *
 * @zh 在运行时安全边界观察已完成的原生销毁。
 * @ja 安全なランタイム境界で完了したネイティブ破棄を受け取ります。
 * @ko 안전한 런타임 경계에서 완료한 네이티브 파괴를 관찰합니다.
 */
export interface ContextReleaseCallback {
  /**
   * Receive the independent pre-destruction name snapshot.
   *
   * @zh 接收销毁前的独立名称快照。
   * @ja 破棄前の独立した名前コピーを受け取ります。
   * @ko 파괴 전 독립 이름 스냅샷을 받습니다.
   * @param snapshot - Copied native context name.
   * @zh snapshot - 原生上下文名称副本。
   * @ja snapshot - ネイティブコンテキスト名のコピー。
   * @ko snapshot - 네이티브 컨텍스트 이름 복사본입니다.
   */
  (snapshot: ContextReleaseSnapshot): void;
}

/**
 * Checked Rml::ContextInstancer with native allocation and release ownership.
 *
 * @zh 受检查的 Rml::ContextInstancer，保留原生分配及释放所有权。
 * @ja ネイティブ生成と解放所有権を持つ検証付き Rml::ContextInstancer。
 * @ko 네이티브 생성 및 해제 소유권을 가진 검사된 Rml::ContextInstancer입니다.
 * @remarks
 * An omitted callback selects the native Rml::Context constructor. A callback
 * delegates to another ContextInstancer and returns its owned allocation.
 * The name, manager and input handler must match the requested arguments.
 * Direct creation does not register with Rml::GetContext. Factory registration
 * makes createContext use this adapter and transfers native ownership to Core.
 * Registered adapters remain alive through shutdown, including replacement.
 * Owned context descendants retain a visible V8 owner edge; closure cycles
 * can collect. Native destruction is synchronous, with release snapshots
 * delivered afterwards at a safe boundary. Environment cleanup invokes no JS.
 * @zh 省略回调时使用原生 Rml::Context 构造函数。回调通过另一 ContextInstancer
 * 分配并返回其自有上下文，名称、管理器和输入处理器必须符合请求参数。
 * 直接创建不进入 GetContext 注册表；Factory 注册后 createContext 使用此适配器，
 * 并将原生所有权移交 Core。已注册适配器（包含被替换者）保活至关闭。
 * 自有上下文的子节点使用 V8 可见引用保活，闭包循环可回收。
 * 原生同步销毁后在安全边界通知名称快照；环境清理不调用 JS。
 * @ja コールバック省略時は Rml::Context のコンストラクターを使います。
 * コールバックは別の生成器の所有割当を返し、名前・管理・入力引数を一致させます。
 * 直接生成は GetContext に登録しません。Factory 登録後の createContext は
 * Core に所有権を渡します。置換済みを含む登録生成器は終了まで保持します。
 * 所有コンテキストの子は V8 の可視参照で保持し、循環は回収できます。
 * 同期破棄後に安全な境界で名前を通知し、環境終了時は JS を呼びません。
 * @ko 콜백을 생략하면 Rml::Context 생성자를 사용합니다. 콜백은 다른 생성기의
 * 소유 할당을 반환하며 이름, 관리자, 입력 처리기는 요청 인수와 일치해야 합니다.
 * 직접 생성은 GetContext에 등록하지 않습니다. Factory 등록 후 createContext는
 * Core에 소유권을 전달합니다. 교체한 등록 생성기도 종료까지 유지합니다.
 * 소유 컨텍스트의 자식은 V8의 가시 참조로 유지하며 순환은 회수할 수 있습니다.
 * 동기 파괴 후 안전한 경계에서 이름을 알리며 환경 정리에서는 JS를 호출하지 않습니다.
 */
export class ContextInstancer {
  /**
   * Create a native allocator or a typed callback adapter.
   *
   * @zh 创建原生分配器或有类型的回调适配器。
   * @ja ネイティブ生成器または型付きコールバックを作ります。
   * @ko 네이티브 생성기 또는 타입 콜백 어댑터를 생성합니다.
   * @param create - Delegate allocation, or omit for native construction.
   * @zh create - 委派分配；省略时使用原生构造。
   * @ja create - 生成委譲。省略時はネイティブ生成。
   * @ko create - 생성 위임이며 생략하면 네이티브 생성입니다.
   * @param release - Observe release when using a creation callback.
   * @zh release - 使用创建回调时的释放观察器。
   * @ja release - 生成コールバック使用時の解放通知。
   * @ko release - 생성 콜백 사용 시 해제 관찰자입니다.
   */
  constructor(
    create?: ContextInstanceCallback, release?: ContextReleaseCallback,
  ) {
    if ((create !== undefined && typeof create !== 'function') ||
        (release !== undefined && typeof release !== 'function') ||
        (create === undefined && release !== undefined)) {
      throw new TypeError('Expected context instancer callbacks');
    }
    const handle = native.createContextInstancer(
      create === undefined ? undefined : (name, manager, handler) => {
        const result = create(name, renderManagerFromNative(manager),
          handler === null ? null : textInputHandlerFromNative(handler));
        return result === null ? null
          : result instanceof Context ? result.handle : result;
      }, release);
    handles.set(this, handle);
  }

  /**
   * Instance an owned context without registration or plugin creation notices.
   *
   * @zh 创建自有上下文，不注册，也不发送插件创建通知。
   * @ja 登録とプラグイン生成通知なしで所有コンテキストを作ります。
   * @ko 등록과 플러그인 생성 알림 없이 소유 컨텍스트를 생성합니다.
   * @param name - Native context name; need not be unique in Core.
   * @zh name - 原生名称，无需在 Core 中唯一。
   * @ja name - ネイティブ名。Core 内の一意性は不要。
   * @ko name - 네이티브 이름이며 Core에서 고유할 필요가 없습니다.
   * @param manager - Live native manager retained until context release.
   * @zh manager - 活跃原生管理器，保活至上下文释放。
   * @ja manager - 解放まで保持する有効なネイティブ管理オブジェクト。
   * @ko manager - 컨텍스트 해제까지 유지할 유효 네이티브 관리자입니다.
   * @param handler - Borrowed native input handler, or null.
   * @zh handler - 借用原生输入处理器，或 null。
   * @ja handler - 借用するネイティブ入力ハンドラー、または null。
   * @ko handler - 빌릴 네이티브 입력 처리기 또는 null입니다.
   * @returns Owned context with native default dimensions and density.
   * @zh 使用原生默认尺寸及密度的自有上下文。
   * @ja ネイティブ既定寸法と密度の所有コンテキスト。
   * @ko 네이티브 기본 크기와 밀도를 가진 소유 컨텍스트입니다.
   */
  instanceContext(
    name: string, manager: RenderManager, handler: TextInputHandler | null,
  ): Context | null {
    const handle = native.contextInstancerInstanceContext(
      contextInstancerHandle(this), name, renderManagerHandle(manager),
      handler === null ? null : textInputHandlerHandle(handler));
    return handle === null ? null : new Context(handle);
  }

  /**
   * Release an owned context allocated by this exact outer instancer.
   *
   * @zh 释放由此确切外层实例器分配的自有上下文。
   * @ja この最外生成器で割り当てた所有コンテキストを解放します。
   * @ko 이 최외곽 생성기로 할당한 소유 컨텍스트를 해제합니다.
   * @param context - Owned allocation; registered contexts reject.
   * @zh context - 自有分配；拒绝已注册上下文。
   * @ja context - 所有割当。登録済みコンテキストは拒否します。
   * @ko context - 소유 할당이며 등록한 컨텍스트는 거부합니다.
   */
  releaseContext(context: Context): void {
    native.contextInstancerReleaseContext(
      contextInstancerHandle(this), context.handle);
  }
}

/**
 * Resolve a checked instancer facade.
 *
 * @internal
 * @param value - Public native instancer.
 * @returns Native handle.
 */
export function contextInstancerHandle(value: ContextInstancer): object {
  const handle = handles.get(value);
  if (!handle) {
    throw new TypeError('Expected a ContextInstancer');
  }
  return handle;
}
