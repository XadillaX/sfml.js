import { RenderWindow } from 'sfml.js';
import { native } from '../internal/native';
import { windowNativeHandle } from '../internal/sfml-interop';
import type { VariantVector2 } from '../values/types';

const handles = new WeakMap<SystemInterface, object>();
const wrappers = new WeakMap<object, SystemInterface>();
const clocks = new WeakMap<SystemInterface, Float64Array>();

/**
 * Native Rml::Log::Type values.
 *
 * @zh 原生 Rml::Log::Type 值。
 * @ja ネイティブ Rml::Log::Type の値。
 * @ko 네이티브 Rml::Log::Type 값입니다.
 */
export enum LogType {
  /**
   * Unconditional message.
   *
   * @zh 无条件消息。
   * @ja 無条件のメッセージ。
   * @ko 무조건 출력하는 메시지입니다.
   */
  Always = 0,
  /**
   * Error message.
   *
   * @zh 错误消息。
   * @ja エラーメッセージ。
   * @ko 오류 메시지입니다.
   */
  Error = 1,
  /**
   * Assertion message.
   *
   * @zh 断言消息。
   * @ja アサーションメッセージ。
   * @ko 단언 메시지입니다.
   */
  Assert = 2,
  /**
   * Warning message.
   *
   * @zh 警告消息。
   * @ja 警告メッセージ。
   * @ko 경고 메시지입니다.
   */
  Warning = 3,
  /**
   * Informational message.
   *
   * @zh 信息消息。
   * @ja 情報メッセージ。
   * @ko 정보 메시지입니다.
   */
  Info = 4,
  /**
   * Debug message.
   *
   * @zh 调试消息。
   * @ja デバッグメッセージ。
   * @ko 디버그 메시지입니다.
   */
  Debug = 5,
}

/**
 * Native TranslateString output and number of substitutions.
 *
 * @zh 原生 TranslateString 输出及替换次数。
 * @ja ネイティブ TranslateString の出力と置換回数。
 * @ko 네이티브 TranslateString 출력과 치환 횟수입니다.
 */
export interface TranslationResult {
  /**
   * Translated UTF-8 text.
   *
   * @zh 翻译后的 UTF-8 文本。
   * @ja 翻訳後の UTF-8 テキスト。
   * @ko 번역한 UTF-8 텍스트입니다.
   */
  value: string;

  /**
   * Nonnegative native int substitution count.
   *
   * @zh 非负原生 int 替换次数。
   * @ja 非負のネイティブ int 置換回数。
   * @ko 음수가 아닌 네이티브 int 치환 횟수입니다.
   */
  translations: number;
}

/**
 * Native translation callback.
 *
 * @zh 原生翻译回调。
 * @ja ネイティブの翻訳コールバック。
 * @ko 네이티브 번역 콜백입니다.
 */
export interface SystemTranslateCallback {
  /**
   * Translate text synchronously.
   *
   * @zh 同步翻译文本。
   * @ja テキストを同期で翻訳。
   * @ko 텍스트를 동기로 번역합니다.
   * @param input - Source text.
   * @zh input - 源文本。
   * @ja input - 原文。
   * @ko input - 원문입니다.
   * @returns Translated text and substitution count.
   * @zh 翻译文本及替换次数。
   * @ja 翻訳文と置換回数。
   * @ko 번역문과 치환 횟수입니다.
   */
  (input: string): TranslationResult;
}

/**
 * Native resource path callback.
 *
 * @zh 原生资源路径回调。
 * @ja ネイティブのリソースパスコールバック。
 * @ko 네이티브 리소스 경로 콜백입니다.
 */
export interface SystemJoinPathCallback {
  /**
   * Resolve a referenced resource path.
   *
   * @zh 解析引用资源路径。
   * @ja 参照するリソースのパスを解決。
   * @ko 참조한 리소스 경로를 해석합니다.
   * @param documentPath - Source filename.
   * @zh documentPath - 源文件名。
   * @ja documentPath - 原文のファイル名。
   * @ko documentPath - 원본 파일명입니다.
   * @param resourcePath - Referenced resource.
   * @zh resourcePath - 引用的资源。
   * @ja resourcePath - 参照するリソース。
   * @ko resourcePath - 참조한 리소스입니다.
   * @returns Joined path.
   * @zh 连接后的路径。
   * @ja 結合したパス。
   * @ko 결합한 경로입니다.
   */
  (documentPath: string, resourcePath: string): string;
}

/**
 * Native log decision callback.
 *
 * @zh 原生日志决策回调。
 * @ja ネイティブログの判断コールバック。
 * @ko 네이티브 로그 판단 콜백입니다.
 */
export interface SystemLogCallback {
  /**
   * Process a native message and choose whether to continue.
   *
   * @zh 处理原生消息并选择是否继续。
   * @ja ネイティブのメッセージを処理して続行を判断。
   * @ko 네이티브 메시지를 처리하고 계속 실행할지 판단합니다.
   * @param type - Native severity.
   * @zh type - 原生级别。
   * @ja type - ネイティブの重要度。
   * @ko type - 네이티브 심각도입니다.
   * @param message - Native log text.
   * @zh message - 原生日志文本。
   * @ja message - ネイティブログの文字列。
   * @ko message - 네이티브 로그 텍스트입니다.
   * @returns True to continue, false to request a native debugger break.
   * @zh true 继续，false 请求原生调试器中断。
   * @ja true は続行、false はネイティブデバッガーの中断要求。
   * @ko true는 계속 실행하며 false는 네이티브 디버거 중단 요청입니다.
   */
  (type: LogType, message: string): boolean;
}

/**
 * Native clipboard read callback.
 *
 * @zh 原生剪贴板读取回调。
 * @ja ネイティブのクリップボード取得コールバック。
 * @ko 네이티브 클립보드 읽기 콜백입니다.
 */
export interface SystemClipboardCallback {
  /**
   * Read clipboard text synchronously.
   *
   * @zh 同步读取剪贴板文本。
   * @ja 同期でクリップボードを読みます。
   * @ko 클립보드 텍스트를 동기로 읽습니다.
   * @returns Clipboard text.
   * @zh 剪贴板文本。
   * @ja クリップボードの文字列。
   * @ko 클립보드 텍스트입니다.
   */
  (): string;
}

/**
 * Optional synchronous system virtual implementations.
 *
 * @zh 可选的同步系统虚方法实现。
 * @ja 任意の同期システム仮想メソッド。
 * @ko 선택적인 동기 시스템 가상 메서드 구현입니다.
 * @remarks
 * Missing methods use SFML/upstream behavior. Methods run with this set to
 * this callback object and cannot enter other RmlUi bindings. Time is supplied
 * through SystemInterface.clock without host callbacks.
 * @zh 缺失方法使用 SFML/上游行为。this 为本回调对象，
 * 回调不能进入其他 RmlUi 接口；时间通过共享 clock 输入，不产生宿主回调。
 * @ja 省略したメソッドは既定動作を使います。this はこのオブジェクト。
 * 他の RmlUi API には再入できません。時間は共有 clock で入力します。
 * @ko 생략한 메서드는 기본 동작을 사용합니다. this는 이 콜백 객체이며
 * 다른 RmlUi API에 재진입할 수 없습니다. 시간은 공유 clock으로 전달합니다.
 */
export interface SystemCallbacks {
  /**
   * Translate source text and return its substitution count.
   *
   * @zh 翻译源文本并返回替换次数。
   * @ja 原文を翻訳して置換回数を返します。
   * @ko 원문을 번역하고 치환 횟수를 반환합니다.
   * @param input - Source text.
   * @zh input - 源文本。
   * @ja input - 原文。
   * @ko input - 원문입니다.
   * @returns Translated text and substitution count.
   * @zh 翻译文本及替换次数。
   * @ja 翻訳文と置換回数。
   * @ko 번역문과 치환 횟수입니다.
   */
  translateString?: SystemTranslateCallback;

  /**
   * Join a document filename and a resource path.
   *
   * @zh 连接文档文件名与资源路径。
   * @ja 文書ファイル名とリソースパスを結合。
   * @ko 문서 파일명과 리소스 경로를 결합합니다.
   * @param documentPath - Source filename.
   * @zh documentPath - 源文件名。
   * @ja documentPath - 原文のファイル名。
   * @ko documentPath - 원본 파일명입니다.
   * @param resourcePath - Referenced resource.
   * @zh resourcePath - 引用的资源。
   * @ja resourcePath - 参照するリソース。
   * @ko resourcePath - 참조한 리소스입니다.
   * @returns Joined path.
   * @zh 连接后的路径。
   * @ja 結合したパス。
   * @ko 결합한 경로입니다.
   */
  joinPath?: SystemJoinPathCallback;

  /**
   * Return true to continue, false to request a native debugger break.
   *
   * @zh true 继续执行，false 请求原生调试器中断。
   * @ja true は続行、false はネイティブデバッガーの中断要求。
   * @ko true는 계속 실행하며 false는 네이티브 디버거 중단 요청입니다.
   * @param type - Native severity.
   * @zh type - 原生级别。
   * @ja type - ネイティブの重要度。
   * @ko type - 네이티브 심각도입니다.
   * @param message - Native log text.
   * @zh message - 原生日志文本。
   * @ja message - ネイティブログの文字列。
   * @ko message - 네이티브 로그 텍스트입니다.
   * @returns Whether to continue native execution.
   * @zh 是否继续原生执行。
   * @ja ネイティブ実行を続行するか。
   * @ko 네이티브 실행을 계속할지 여부입니다.
   */
  logMessage?: SystemLogCallback;

  /**
   * Activate a named mouse cursor.
   *
   * @zh 激活指定名称的鼠标光标。
   * @ja 指定のマウスカーソルを有効化。
   * @ko 지정한 마우스 커서를 활성화합니다.
   * @param name - Native cursor name.
   * @zh name - 原生光标名称。
   * @ja name - ネイティブカーソル名。
   * @ko name - 네이티브 커서 이름입니다.
   */
  setMouseCursor?: (name: string) => void;

  /**
   * Replace clipboard text.
   *
   * @zh 替换剪贴板文本。
   * @ja クリップボード文字列を設定。
   * @ko 클립보드 텍스트를 설정합니다.
   * @param text - Clipboard text.
   * @zh text - 剪贴板文本。
   * @ja text - クリップボードの文字列。
   * @ko text - 클립보드 텍스트입니다.
   */
  setClipboardText?: (text: string) => void;

  /**
   * Read clipboard text synchronously.
   *
   * @zh 同步读取剪贴板文本。
   * @ja 同期でクリップボードを読みます。
   * @ko 클립보드 텍스트를 동기로 읽습니다.
   * @returns Clipboard text.
   * @zh 剪贴板文本。
   * @ja クリップボードの文字列。
   * @ko 클립보드 텍스트입니다.
   */
  getClipboardText?: SystemClipboardCallback;

  /**
   * Activate a keyboard at absolute caret coordinates and line height.
   *
   * @zh 在绝对光标坐标和行高处激活键盘。
   * @ja 絶対カーソル座標と行高でキーボードを有効化。
   * @ko 절대 캐럿 좌표와 행 높이로 키보드를 활성화합니다.
   * @param caret - Absolute caret coordinates.
   * @zh caret - 绝对光标坐标。
   * @ja caret - 絶対カーソル座標。
   * @ko caret - 절대 캐럿 좌표입니다.
   * @param lineHeight - Native line height.
   * @zh lineHeight - 原生行高。
   * @ja lineHeight - ネイティブの行高。
   * @ko lineHeight - 네이티브 행 높이입니다.
   */
  activateKeyboard?: (caret: VariantVector2, lineHeight: number) => void;

  /**
   * Deactivate the keyboard.
   *
   * @zh 关闭键盘。
   * @ja キーボードを無効化。
   * @ko 키보드를 비활성화합니다.
   */
  deactivateKeyboard?: () => void;
}

/**
 * Resolve an authentic facade.
 *
 * @internal
 * @param system - Registered wrapper.
 * @returns Native handle.
 */
function handleOf(system: SystemInterface): object {
  const handle = handles.get(system);
  if (!handle) {
    throw new TypeError('Expected a native SystemInterface');
  }
  return handle;
}

/**
 * Associate a facade with its native clock.
 *
 * @internal
 * @param system - Wrapper.
 * @param handle - Native interface.
 */
function bind(system: SystemInterface, handle: object): void {
  handles.set(system, handle);
  wrappers.set(handle, system);
  clocks.set(system, native.getSystemClock(handle));
}

/**
 * Native-owned SFML system interface with optional host virtuals.
 *
 * @zh 原生持有的 SFML 系统接口，支持可选宿主虚方法。
 * @ja ネイティブ所有の SFML システムと任意のホスト仮想メソッド。
 * @ko 네이티브 소유 SFML 시스템과 선택적인 호스트 가상 메서드입니다.
 * @remarks
 * Construction claims the setup environment. Selection must occur before
 * initialization; the selected interface and window remain alive until
 * shutdown. Unselected objects and callback cycles can be collected.
 * Shutdown invalidates every interface, including unused setup objects.
 * @zh 构造时确定配置所属环境。须在初始化前选择接口；
 * 所选接口和窗口保留至 shutdown。未选择对象及其回调循环可回收。
 * shutdown 使所有接口失效，包括未使用的初始化前对象。
 * @ja 作成元の環境が設定を所有します。初期化前に選択し、終了まで
 * インターフェースとウィンドウを保持します。未選択の循環は回収可能。
 * 未使用の設定も shutdown で無効になります。
 * @ko 생성 환경이 설정을 소유합니다. 초기화 전에 선택하며 종료까지
 * 인터페이스와 창을 보유합니다. 미선택 객체의 순환은 회수 가능하며
 * 사용하지 않은 설정도 shutdown 시 만료됩니다.
 */
export class SystemInterface {
  /**
   * Create a native SFML interface.
   *
   * @zh 创建原生 SFML 接口。
   * @ja ネイティブ SFML インターフェースを作成。
   * @ko 네이티브 SFML 인터페이스를 생성합니다.
   * @param window - Window for cursor operations; retained by this interface.
   * @zh window - 光标操作窗口，由此接口保留。
   * @ja window - カーソル操作のウィンドウ。参照を保持します。
   * @ko window - 커서 작업을 위한 창이며 참조를 유지합니다.
   * @param callbacks - Optional synchronous virtual implementations.
   * @zh callbacks - 可选同步虚方法实现。
   * @ja callbacks - 任意の同期仮想メソッド。
   * @ko callbacks - 선택적인 동기 가상 메서드입니다.
   */
  constructor(window: RenderWindow, callbacks: SystemCallbacks = {}) {
    if (!(window instanceof RenderWindow)) {
      throw new TypeError('Expected an sfml.js RenderWindow');
    }
    const keys: (keyof SystemCallbacks)[] = [
      'translateString', 'joinPath', 'logMessage', 'setMouseCursor',
      'setClipboardText', 'getClipboardText', 'activateKeyboard',
      'deactivateKeyboard',
    ];
    const functions = keys.map(key => {
      const callback = callbacks[key];
      if (callback === undefined) {
        return undefined;
      }
      if (typeof callback !== 'function') {
        throw new TypeError('Expected optional system callback functions');
      }
      return callback.bind(callbacks);
    });
    bind(this, native.createSystemInterface(
      windowNativeHandle(window), functions));
  }

  /**
   * Shared seconds input, with NaN selecting the native SFML clock.
   *
   * @zh 共享秒数输入；NaN 选择原生 SFML 时钟。
   * @ja 共有の秒入力。NaN はネイティブ SFML 時計を選択。
   * @ko 공유 초 입력이며 NaN은 네이티브 SFML 시계를 선택합니다.
   * @returns One-element native time view.
   * @zh 单元素原生时间视图。
   * @ja 1 要素のネイティブ時刻ビュー。
   * @ko 단일 요소 네이티브 시간 뷰입니다.
   * @remarks
   * Write clock[0] once before update. No JS callback or Addon call is needed
   * for native time reads. Finite input must be nonnegative. The backing stores
   * only this double, retains no window/callback, and survives shutdown.
   * @zh update 前写入 clock[0]。原生读取时间无需 JS 回调或 Addon 调用。
   * 有限输入须非负。缓冲仅存此 double，不保留窗口或回调，shutdown 后仍可读取。
   * @ja update 前に clock[0] を書きます。時間の取得にホスト呼び出しは不要。
   * 有限値は非負。バッファは double のみを保持し、終了後も読めます。
   * @ko update 전에 clock[0]을 씁니다. 시간 조회에는 호스트 호출이 없습니다.
   * 유한 값은 음수가 아니어야 합니다. 버퍼는 double만 보유하며 종료 후에도 유지됩니다.
   */
  get clock(): Float64Array {
    handleOf(this);
    return clocks.get(this)!;
  }

  /**
   * Invoke native GetElapsedTime using shared input or the SFML clock.
   *
   * @zh 调用原生 GetElapsedTime，使用共享输入或 SFML 时钟。
   * @ja 共有入力または SFML 時計で GetElapsedTime を呼びます。
   * @ko 공유 입력 또는 SFML 시계로 GetElapsedTime을 호출합니다.
   * @returns Elapsed nonnegative seconds.
   * @zh 非负已用秒数。
   * @ja 非負の経過秒数。
   * @ko 음수가 아닌 경과 초입니다.
   * @remarks
   * Normal event listeners may read time. System callbacks cannot reenter.
   * @zh 普通事件监听器可读取时间；系统回调不能重入。
   * @ja 通常のイベントリスナーで時刻を読めます。システムの再入は不可です。
   * @ko 일반 이벤트 리스너에서 시간을 읽을 수 있으며 시스템 재진입은 금지됩니다.
   */
  getElapsedTime(): number {
    return native.systemGetElapsedTime(handleOf(this));
  }

  /**
   * Invoke native TranslateString.
   *
   * @zh 调用原生 TranslateString。
   * @ja ネイティブ TranslateString を呼びます。
   * @ko 네이티브 TranslateString을 호출합니다.
   * @param input - Source string.
   * @zh input - 源文本。
   * @ja input - 原文。
   * @ko input - 원문입니다.
   * @returns Translated value and native substitution count.
   * @zh 翻译结果及原生替换次数。
   * @ja 翻訳結果とネイティブの置換回数。
   * @ko 번역 결과와 네이티브 치환 횟수입니다.
   */
  translateString(input: string): TranslationResult {
    return native.systemTranslateString(handleOf(this), input);
  }

  /**
   * Invoke native JoinPath.
   *
   * @zh 调用原生 JoinPath。
   * @ja ネイティブ JoinPath を呼びます。
   * @ko 네이티브 JoinPath를 호출합니다.
   * @param documentPath - Source filename, including its directory.
   * @zh documentPath - 包含目录的源文件名。
   * @ja documentPath - ディレクトリを含む原文ファイル名。
   * @ko documentPath - 디렉터리를 포함한 원본 파일명입니다.
   * @param resourcePath - Referenced resource path.
   * @zh resourcePath - 引用资源路径。
   * @ja resourcePath - 参照するリソースのパス。
   * @ko resourcePath - 참조한 리소스 경로입니다.
   * @returns Joined resource path.
   * @zh 连接后的资源路径。
   * @ja 結合されたリソースのパス。
   * @ko 결합한 리소스 경로입니다.
   */
  joinPath(documentPath: string, resourcePath: string): string {
    return native.systemJoinPath(handleOf(this), documentPath, resourcePath);
  }

  /**
   * Invoke native LogMessage.
   *
   * @zh 调用原生 LogMessage。
   * @ja ネイティブ LogMessage を呼びます。
   * @ko 네이티브 LogMessage를 호출합니다.
   * @param type - Native severity.
   * @zh type - 原生级别。
   * @ja type - ネイティブの重要度。
   * @ko type - 네이티브 심각도입니다.
   * @param message - Message text.
   * @zh message - 消息文本。
   * @ja message - メッセージの文字列。
   * @ko message - 메시지 텍스트입니다.
   * @returns Whether native execution should continue.
   * @zh 原生执行是否继续。
   * @ja ネイティブ実行を続行するか。
   * @ko 네이티브 실행을 계속할지 여부입니다.
   */
  logMessage(type: LogType, message: string): boolean {
    return native.systemLogMessage(handleOf(this), type, message);
  }

  /**
   * Invoke native SetMouseCursor.
   *
   * @zh 调用原生 SetMouseCursor。
   * @ja ネイティブ SetMouseCursor を呼びます。
   * @ko 네이티브 SetMouseCursor를 호출합니다.
   * @param name - Native cursor name.
   * @zh name - 原生光标名称。
   * @ja name - ネイティブカーソル名。
   * @ko name - 네이티브 커서 이름입니다.
   */
  setMouseCursor(name: string): void {
    native.systemSetMouseCursor(handleOf(this), name);
  }

  /**
   * Set clipboard text; the default SFML backend preserves Unicode via UTF-8.
   *
   * @zh 设置剪贴板文本；默认 SFML 后端通过 UTF-8 保留 Unicode。
   * @ja 文字列を設定します。既定の SFML は UTF-8 で Unicode を保持します。
   * @ko 텍스트를 설정합니다. 기본 SFML은 UTF-8로 Unicode를 보존합니다.
   * @param text - Clipboard UTF-8 text.
   * @zh text - 剪贴板 UTF-8 文本。
   * @ja text - クリップボードの UTF-8 文字列。
   * @ko text - 클립보드 UTF-8 텍스트입니다.
   */
  setClipboardText(text: string): void {
    native.systemSetClipboardText(handleOf(this), text);
  }

  /**
   * Read clipboard text; the default SFML backend converts Unicode to UTF-8.
   *
   * @zh 读取剪贴板文本；默认 SFML 后端将 Unicode 转换为 UTF-8。
   * @ja 文字列を読みます。既定の SFML は Unicode を UTF-8 に変換します。
   * @ko 텍스트를 읽습니다. 기본 SFML은 Unicode를 UTF-8로 변환합니다.
   * @returns Clipboard text.
   * @zh 剪贴板文本。
   * @ja クリップボードの文字列。
   * @ko 클립보드 텍스트입니다.
   */
  getClipboardText(): string {
    return native.systemGetClipboardText(handleOf(this));
  }

  /**
   * Invoke native ActivateKeyboard.
   *
   * @zh 调用原生 ActivateKeyboard。
   * @ja ネイティブ ActivateKeyboard を呼びます。
   * @ko 네이티브 ActivateKeyboard를 호출합니다.
   * @param caret - Absolute window coordinates.
   * @zh caret - 窗口绝对坐标。
   * @ja caret - ウィンドウの絶対座標。
   * @ko caret - 창의 절대 좌표입니다.
   * @param lineHeight - Native line height.
   * @zh lineHeight - 原生行高。
   * @ja lineHeight - ネイティブ行高。
   * @ko lineHeight - 네이티브 행 높이입니다.
   */
  activateKeyboard(caret: VariantVector2, lineHeight: number): void {
    native.systemActivateKeyboard(handleOf(this), caret.x, caret.y, lineHeight);
  }

  /**
   * Invoke native DeactivateKeyboard.
   *
   * @zh 调用原生 DeactivateKeyboard。
   * @ja ネイティブ DeactivateKeyboard を呼びます。
   * @ko 네이티브 DeactivateKeyboard를 호출합니다.
   */
  deactivateKeyboard(): void {
    native.systemDeactivateKeyboard(handleOf(this));
  }
}

/**
 * Read Rml::GetSystemInterface before or after initialization.
 *
 * @zh 在初始化前后读取 Rml::GetSystemInterface。
 * @ja 初期化前後に Rml::GetSystemInterface を読みます。
 * @ko 초기화 전후 Rml::GetSystemInterface를 읽습니다.
 * @returns Canonical interface, or null before selection/after shutdown.
 * @zh 唯一所选接口；未选择或 shutdown 后为 null。
 * @ja 一意の選択済みインターフェース。未選択または終了後は null。
 * @ko 선택한 고유 인터페이스이며 선택 전 또는 종료 후에는 null입니다.
 * @remarks
 * Normal event listeners may read the interface. System callbacks cannot.
 * @zh 普通事件监听器可读取接口；系统回调不能重入。
 * @ja 通常のイベントリスナーで取得できます。システムの再入は不可です。
 * @ko 일반 이벤트 리스너에서 읽을 수 있으며 시스템 재진입은 금지됩니다.
 */
export function getSystemInterface(): SystemInterface | null {
  const handle = native.getSystemInterface();
  if (handle === null) {
    return null;
  }
  let system = wrappers.get(handle);
  if (!system) {
    system = Object.create(SystemInterface.prototype) as SystemInterface;
    bind(system, handle);
  }
  return system;
}

/**
 * Install Rml::SetSystemInterface before initialization.
 *
 * @zh 初始化前安装 Rml::SetSystemInterface。
 * @ja 初期化前に Rml::SetSystemInterface を設定。
 * @ko 초기화 전에 Rml::SetSystemInterface를 설정합니다.
 * @param system - Checked interface, or null for the SFML default at setup.
 * @zh system - 受检查接口，或 null，在初始化时选择 SFML 默认接口。
 * @ja system - 検証済みインターフェース。null は初期化時に SFML 既定を選択。
 * @ko system - 검증한 인터페이스이며 null은 초기화 시 SFML 기본값을 선택합니다.
 */
export function setSystemInterface(system: SystemInterface | null): void {
  native.setSystemInterface(system === null ? null : handleOf(system));
}
