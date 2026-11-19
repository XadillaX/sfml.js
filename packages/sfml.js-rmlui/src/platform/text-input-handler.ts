import { native } from '../internal/native';
import {
  TextInputContext, textInputContextFromNative,
} from './text-input-context';

const handles = new WeakMap<TextInputHandler, object>();
const wrappers = new WeakMap<object, TextInputHandler>();

/**
 * Optional explicit host callbacks for native text-input lifecycle events.
 *
 * @zh 原生文本输入生命周期的可选显式宿主回调。
 * @ja ネイティブ入力ライフサイクルの明示的なホストコールバック。
 * @ko 네이티브 입력 수명 주기의 명시적인 선택적 호스트 콜백입니다.
 */
export interface TextInputCallbacks {
  /**
   * Synchronous OnActivate.
   *
   * @zh 同步 OnActivate。
   * @ja 同期 OnActivate。
   * @ko 동기 OnActivate입니다.
   * @param input - Activated native input, or null.
   * @zh input - 激活的原生输入，或 null。
   * @ja input - 有効化した入力、または null。
   * @ko input - 활성화한 입력 또는 null입니다.
   */
  onActivate?: (input: TextInputContext | null) => void;

  /**
   * Synchronous OnDeactivate.
   *
   * @zh 同步 OnDeactivate。
   * @ja 同期 OnDeactivate。
   * @ko 동기 OnDeactivate입니다.
   * @param input - Deactivated native input, or null.
   * @zh input - 失活的原生输入，或 null。
   * @ja input - 無効化した入力、または null。
   * @ko input - 비활성화한 입력 또는 null입니다.
   */
  onDeactivate?: (input: TextInputContext | null) => void;

  /**
   * After native destruction.
   *
   * @zh 原生销毁后调用。
   * @ja 破棄後の通知。
   * @ko 네이티브 파괴 후 호출합니다.
   * @param input - Already invalidated input identity.
   * @zh input - 已失效的输入标识。
   * @ja input - 無効化済み入力の識別子。
   * @ko input - 이미 만료된 입력 식별자입니다.
   */
  onDestroy?: (input: TextInputContext) => void;
}

/**
 * Native lifecycle batch. Kinds are 0 activate, 1 deactivate, 2 destroy.
 *
 * @zh 原生生命周期批次。类型为 0 激活、1 失活、2 销毁。
 * @ja 入力通知バッチ。0 有効化、1 無効化、2 破棄。
 * @ko 입력 알림 배치이며 0 활성화, 1 비활성화, 2 파괴입니다.
 */
export interface TextInputEvents {
  /**
   * Native-owned numeric snapshot.
   *
   * @zh 原生持有的数值快照。
   * @ja ネイティブ数値スナップショット。
   * @ko 네이티브 숫자 스냅샷입니다.
   */
  kinds: Uint32Array;

  /**
   * Matching canonical contexts.
   *
   * @zh 对应的唯一输入句柄。
   * @ja 対応する入力参照。
   * @ko 대응하는 입력 참조입니다.
   */
  contexts: (TextInputContext | null)[];
}

/**
 * Native Rml::TextInputHandler with batched lifecycle notifications.
 *
 * @zh 支持批量生命周期通知的原生 Rml::TextInputHandler。
 * @ja ライフサイクル通知をまとめて取得できる Rml::TextInputHandler。
 * @ko 수명 주기 알림을 일괄 제공하는 네이티브 Rml::TextInputHandler입니다.
 * @remarks
 * With no callbacks, lifecycle events remain in Native until drainEvents:
 * no per-widget JS callback occurs. Explicit activate/deactivate callbacks run
 * synchronously and may use only TextInputContext editing/read operations.
 * Destroy callbacks run at the next safe native boundary after invalidation,
 * never from native destructors or V8 finalizers. Global handlers are retained
 * until shutdown; context/widget owners retain their selected handlers.
 * Construction and global selection also work before initialization. Pending
 * handlers belong to the next successful initialization; shutdown invalidates
 * them even if initialization never ran. A rejected initialization preserves
 * the pending selection. Creating a handler claims this Node environment as
 * the setup owner until shutdown or its environment cleanup.
 * Drain queued events regularly to release historical notification storage.
 * @zh 不传回调时，通知留在 Native，直到 drainEvents；没有逐控件 JS 回调。
 * 显式激活/失活回调同步执行，仅可调用 TextInputContext 读取与编辑操作。
 * 销毁回调在失效后的安全原生边界执行，不从原生析构或 V8 finalizer 调用。
 * 全局处理器保留至 shutdown；上下文与控件保留各自选中的处理器。
 * 可在初始化前创建并设置全局处理器；待初始化处理器属于下一次成功初始化。
 * 即使未初始化，shutdown 仍使其失效；初始化被拒绝时保留待初始化选择。
 * 创建处理器将当前 Node 环境设为配置所有者，直到 shutdown 或环境清理。
 * 请定期排空通知，释放历史记录占用的存储。
 * @ja コールバックを省略すると通知は drainEvents まで Native に保持されます。
 * 有効化・無効化は同期で、TextInputContext の取得・編集のみ可能です。
 * 破棄通知は無効化後の安全な境界で実行し、デストラクターでは実行しません。
 * 全体の設定は終了まで、個別の設定は各所有者が保持します。
 * 初期化前にも作成・設定できます。次の成功した初期化に採用されます。
 * 初期化前の shutdown でも無効になります。初期化の拒否時は設定を保持します。
 * 作成した Node 環境が shutdown または環境終了まで設定を所有します。
 * 保存した通知は定期的に取得してください。
 * @ko 콜백을 생략하면 알림은 drainEvents까지 Native에 보관됩니다.
 * 활성화·비활성화는 동기이며 TextInputContext 조회·편집만 허용합니다.
 * 파괴 알림은 만료 후 안전한 경계에서 실행하며 소멸자에서는 실행하지 않습니다.
 * 전역 설정은 종료까지, 개별 설정은 해당 소유자가 유지합니다.
 * 초기화 전에도 생성·설정할 수 있으며 다음 성공한 초기화에 채택됩니다.
 * 초기화 전 shutdown도 만료시키며 초기화 거부 시 설정을 유지합니다.
 * 생성한 Node 환경이 shutdown 또는 환경 정리까지 설정을 소유합니다.
 * 기록 저장 공간을 해제하도록 알림을 정기적으로 가져오세요.
 */
export class TextInputHandler {
  /**
   * Create a native handler and optional explicit lifecycle callbacks.
   *
   * @zh 创建原生处理器及可选显式生命周期回调。
   * @ja ネイティブハンドラーと任意のライフサイクルコールバックを作成。
   * @ko 네이티브 처리기와 선택적인 수명 주기 콜백을 생성합니다.
   * @param callbacks - Activate/deactivate and deferred destroy hooks.
   * @zh callbacks - 即时激活/失活及延迟销毁回调。
   * @ja callbacks - 有効化・無効化と遅延破棄のコールバック。
   * @ko callbacks - 활성화·비활성화와 지연 파괴 콜백입니다.
   */
  constructor(callbacks: TextInputCallbacks = {}) {
    const wrap = (callback: unknown, destroy = false) => {
      if (callback === undefined) {
        return undefined;
      }
      if (typeof callback !== 'function') {
        throw new TypeError('Expected text input handler callbacks');
      }
      return (handle: object | null): void => {
        const input = handle === null
          ? null : textInputContextFromNative(handle);
        if (destroy && input === null) {
          throw new Error('Native destroy notification requires an input');
        }
        callback(input);
      };
    };
    const handle = native.createTextInputHandler(
      wrap(callbacks.onActivate), wrap(callbacks.onDeactivate),
      wrap(callbacks.onDestroy, true),
    );
    handles.set(this, handle);
    wrappers.set(handle, this);
  }

  /**
   * Drain the native journal with one addon call and no numeric-plane copy.
   *
   * @zh 一次 Addon 调用排空原生日志，不拷贝数值平面。
   * @ja 1 回の Addon 呼び出しで通知を取得し、数値面はコピーしません。
   * @ko 한 번의 Addon 호출로 알림을 가져오며 숫자 평면을 복사하지 않습니다.
   * @returns Ordered lifecycle snapshot; destroyed inputs already reject edits.
   * @zh 有序生命周期快照；已销毁输入拒绝编辑。
   * @ja 順序付き通知。破棄済みの入力は編集できません。
   * @ko 순서 있는 알림이며 파괴된 입력은 편집을 거부합니다.
   */
  drainEvents(): TextInputEvents {
    const batch = native.drainTextInputEvents(textInputHandlerHandle(this));
    return {
      kinds: batch.kinds,
      contexts: batch.contexts.map(handle => (handle === null
        ? null : textInputContextFromNative(handle))),
    };
  }

  /**
   * Validate the borrowed native handler; expired runtime handles throw.
   *
   * @zh 验证借用原生处理器；过期运行时句柄抛出异常。
   * @ja 借用ハンドラーを検証し、期限切れランタイム参照は例外になります。
   * @ko 빌린 처리기를 검사하며 만료된 런타임 참조는 예외를 던집니다.
   * @returns True while the native handler belongs to this runtime.
   * @zh 原生处理器属于当前运行时时为 true。
   * @ja 現在のランタイムのハンドラーなら true。
   * @ko 현재 런타임의 처리기이면 true입니다.
   */
  get isValid(): boolean {
    return native.isTextInputHandlerValid(textInputHandlerHandle(this));
  }
}

/**
 * Return the selected native global input handler.
 *
 * @zh 返回当前原生全局输入处理器。
 * @ja 選択中のネイティブ全体入力ハンドラーを取得。
 * @ko 선택된 네이티브 전역 입력 처리기를 반환합니다.
 * @returns Canonical handler, or null before setup or after null selection.
 * @zh 唯一处理器；配置前或显式选择 null 后为 null。
 * @ja 一意のハンドラー。設定前または null 選択後は null。
 * @ko 고유 처리기이며 설정 전 또는 null 선택 후에는 null입니다.
 */
export function getTextInputHandler(): TextInputHandler | null {
  const handle = native.getTextInputHandler();
  return handle === null ? null : textInputHandlerFromNative(handle);
}

/**
 * Call Rml::SetTextInputHandler; existing contexts keep their selected handler.
 *
 * @zh 调用 Rml::SetTextInputHandler；已有上下文保留原处理器。
 * @ja Rml::SetTextInputHandler を呼びます。既存の設定は保持されます。
 * @ko Rml::SetTextInputHandler를 호출하며 기존 컨텍스트의 설정은 유지합니다.
 * @param handler - Native handler or null. Before initialization null selects
 * the upstream default at initialization; afterward it disables selection.
 * @zh handler - 原生处理器或 null。初始化前 null 在初始化时选择原生默认值；
 * 初始化后 null 禁用全局选择。
 * @ja handler - ハンドラーまたは null。初期化前の null は既定値を選び、
 * 初期化後の null は全体の選択を無効化します。
 * @ko handler - 처리기 또는 null입니다. 초기화 전 null은 초기화 시 기본값을
 * 선택하며 초기화 후 null은 전역 선택을 비활성화합니다.
 */
export function setTextInputHandler(handler: TextInputHandler | null): void {
  native.setTextInputHandler(
    handler === null ? null : textInputHandlerHandle(handler));
}

/**
 * Resolve a checked borrowed native handler.
 *
 * @internal
 * @param value - Native handler facade.
 * @returns Native handle.
 */
export function textInputHandlerHandle(value: TextInputHandler): object {
  const handle = handles.get(value);
  if (!handle) {
    throw new TypeError('Expected a TextInputHandler');
  }
  return handle;
}

/**
 * Restore a typed borrowed handler.
 *
 * @internal
 * @param handle - Checked native capability.
 * @returns Handler facade.
 */
export function textInputHandlerFromNative(handle: object): TextInputHandler {
  const existing = wrappers.get(handle);
  if (existing) {
    return existing;
  }
  const result = Object.create(TextInputHandler.prototype) as TextInputHandler;
  handles.set(result, handle);
  wrappers.set(handle, result);
  return result;
}
