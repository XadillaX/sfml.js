import { native } from '../../internal/native';
import { LuaFunction, wrapLuaFunction } from './lua-function';

/**
 * Values copied between Node and Lua; Lua integers return as bigint.
 *
 * @zh Node 与 Lua 之间复制的值，Lua 整数返回 bigint。
 * @ja Node と Lua の間でコピーする値。Lua 整数は bigint で返します。
 * @ko Node와 Lua 사이에 복사하는 값이며 Lua 정수는 bigint로 반환됩니다.
 */
export type LuaScalar = null | boolean | number | bigint | string;

/**
 * Explicit trusted-source policy for one native Lua state.
 *
 * @zh 单个原生 Lua 状态的受信任来源策略。
 * @ja 一つのネイティブ Lua 状態の信頼済みソースポリシー。
 * @ko 하나의 네이티브 Lua 상태를 위한 신뢰 소스 정책입니다.
 */
export interface LuaScriptHostOptions {
  /**
   * Enable inline scripts and on* expressions; defaults to false.
   *
   * @zh 启用内联脚本和 on* 表达式，默认 false。
   * @ja インラインスクリプトと on* 式を有効にします。既定は false。
   * @ko 인라인 스크립트와 on* 식을 활성화하며 기본값은 false입니다.
   */
  allowInline?: boolean;

  /**
   * Enable external scripts through RmlUi FileInterface; defaults to false.
   *
   * @zh 通过 RmlUi FileInterface 启用外部脚本，默认 false。
   * @ja FileInterface による外部スクリプトを有効にします。既定は false。
   * @ko FileInterface로 외부 스크립트를 활성화하며 기본값은 false입니다.
   */
  allowExternal?: boolean;
}

const handles = new WeakMap<object, object>();

/**
 * Native-owned Lua 5.4 host; its documents intentionally share Lua globals.
 *
 * @zh 原生持有的 Lua 5.4 宿主，各文档共享 Lua 全局值。
 * @ja ネイティブ所有の Lua 5.4 ホスト。文書は Lua グローバルを共有します。
 * @ko 네이티브 소유 Lua 5.4 호스트이며 문서는 Lua 전역 값을 공유합니다.
 * @remarks
 * Create after initialise. Context selection affects subsequent loads only.
 * Event handlers run directly in Native/Lua. document/context/event/element
 * are scoped globals restored after nested calls. Standard Lua libraries are
 * available; execute only trusted code. Shutdown closes the native VM.
 * Within document Lua, native Variant copies retain guarded pointers and
 * aggregate storage. Node scalar methods accept only LuaScalar values.
 * Native documents, listeners, models, instancers and captured functions
 * retain their VM's pointer values after host facade GC.
 * Host/object cycles stay collectible.
 * @zh 在 initialise 后创建，Context 选择仅影响后续加载。事件处理直接在
 * Native/Lua 执行。document/context/event/element 在嵌套调用后恢复。
 * 提供 Lua 标准库，只执行受信任代码；shutdown 关闭原生 VM。
 * 文档 Lua 内的原生 Variant 副本保留受保护指针和聚合存储。
 * Node 标量方法只接收 LuaScalar。文档、监听器、模型、实例器和捕获函数
 * 在宿主外观被 GC 后通过实际所有者保活 VM 的指针值，循环引用仍可回收。
 * @ja initialise 後に作成し、選択は以降の読み込みだけに適用します。
 * イベントは Native/Lua で実行し、入れ子の後にスコープのグローバルを復元します。
 * 標準 Lua ライブラリを提供します。信頼するコードだけを実行し、shutdown で VM を閉じます。
 * 文書 Lua の Variant コピーは保護されたポインターと集約値を保持します。
 * Node のスカラーメソッドは LuaScalar だけを受け取ります。文書、リスナー、
 * モデル、インスタンサー、取得した関数がホストの GC 後も VM のポインター値を
 * 実際の所有者として保持し、循環参照は回収できます。
 * @ko initialise 후 생성하며 선택은 이후 로드에만 적용됩니다. 이벤트는
 * Native/Lua에서 실행하고 중첩 호출 후 스코프 전역 값을 복원합니다.
 * Lua 표준 라이브러리를 제공하며 신뢰하는 코드만 실행합니다. shutdown은 VM을 닫습니다.
 * 문서 Lua의 Variant 복사본은 보호된 포인터와 집계 저장 값을 유지합니다.
 * Node 스칼라 메서드는 LuaScalar만 받습니다. 문서, 리스너, 모델, 할당기 및
 * 캡처한 함수는 호스트 파사드 GC 후에도 실제 소유자로 VM의 포인터 값을 유지하며
 * 순환 참조는 회수할 수 있습니다.
 */
export class LuaScriptHost {
  /**
   * Allocate one managed native Lua VM.
   *
   * @zh 分配一个托管原生 Lua VM。
   * @ja 管理するネイティブ Lua VM を一つ割り当てます。
   * @ko 관리되는 네이티브 Lua VM 하나를 할당합니다.
   * @param options - Trusted document source policy.
   * @zh options - 受信任文档来源策略。
   * @ja options - 信頼済み文書ソースのポリシー。
   * @ko options - 신뢰 문서 소스 정책입니다.
   */
  constructor(options: LuaScriptHostOptions = {}) {
    handles.set(this, native.createLuaScriptHost(
      options.allowInline ?? false, options.allowExternal ?? false,
    ));
  }

  /**
   * Execute trusted Lua source in this host's shared state.
   *
   * @zh 在宿主的共享状态中执行受信任 Lua 源码。
   * @ja ホストの共有状態で信頼済み Lua ソースを実行します。
   * @ko 호스트의 공유 상태에서 신뢰 Lua 소스를 실행합니다.
   * @param source - Lua source text.
   * @zh source - Lua 源码文本。
   * @ja source - Lua ソーステキスト。
   * @ko source - Lua 소스 텍스트입니다.
   * @param path - Original source path for errors; defaults to empty.
   * @zh path - 错误定位用原始路径，默认空字符串。
   * @ja path - エラーの元ソースパス。既定は空文字列。
   * @ko path - 오류 원본 경로이며 기본값은 빈 문자열입니다.
   * @param line - Original first line, one-based; defaults to 1.
   * @zh line - 原始首行，从 1 开始，默认 1。
   * @ja line - 元の開始行。一始まりで既定は 1。
   * @ko line - 원본 시작 행이며 1부터 시작하고 기본값은 1입니다.
   */
  execute(source: string, path = '', line = 1): void {
    native.executeLuaScript(handleOf(this), source, path, line);
  }

  /**
   * Compile trusted source without executing it, matching LoadString.
   *
   * @zh 编译受信任源码而不执行，对应 LoadString。
   * @ja LoadString と同じく、信頼済みソースを実行せずにコンパイルします。
   * @ko LoadString과 같이 신뢰 소스를 실행하지 않고 컴파일합니다.
   * @param source - Lua source text.
   * @zh source - Lua 源码文本。
   * @ja source - Lua ソーステキスト。
   * @ko source - Lua 소스 텍스트입니다.
   * @param path - Source path for diagnostics; defaults to empty.
   * @zh path - 错误定位用源码路径，默认空字符串。
   * @ja path - エラーのソースパス。既定は空文字列。
   * @ko path - 오류 소스 경로이며 기본값은 빈 문자열입니다.
   * @param line - One-based first source line; defaults to 1.
   * @zh line - 源码首行，从 1 开始，默认 1。
   * @ja line - ソースの開始行。一始まりで既定は 1。
   * @ko line - 소스 시작 행이며 1부터 시작하고 기본값은 1입니다.
   * @returns Native-owned compiled chunk retaining this VM.
   * @zh 原生持有的编译块，保活当前 VM。
   * @ja この VM を保持するネイティブ所有のコンパイル済みチャンク。
   * @ko 이 VM을 유지하는 네이티브 소유 컴파일 청크입니다.
   */
  compile(source: string, path = '', line = 1): LuaFunction {
    return wrapLuaFunction(
      native.compileLuaFunction(handleOf(this), source, path, line),
    );
  }

  /**
   * Capture the current global function as a native registry reference.
   *
   * @zh 将当前全局函数捕获为原生 registry 引用。
   * @ja 現在のグローバル関数をネイティブのレジストリ参照として取得します。
   * @ko 현재 전역 함수를 네이티브 레지스트리 참조로 캡처합니다.
   * @param name - Global function identifier.
   * @zh name - 全局函数标识符。
   * @ja name - グローバル関数識別子。
   * @ko name - 전역 함수 식별자입니다.
   * @returns Stable reference unaffected by global replacement.
   * @zh 稳定引用，不受全局函数替换影响。
   * @ja グローバル関数を置換しても変わらない参照。
   * @ko 전역 함수 교체의 영향을 받지 않는 안정된 참조입니다.
   */
  getFunction(name: string): LuaFunction {
    return wrapLuaFunction(native.captureLuaFunction(handleOf(this), name));
  }

  /**
   * Read and execute a trusted file through RmlUi FileInterface.
   *
   * @zh 通过 RmlUi FileInterface 读取并执行受信任文件。
   * @ja RmlUi FileInterface で信頼済みファイルを読み込み、実行します。
   * @ko RmlUi FileInterface로 신뢰 파일을 읽고 실행합니다.
   * @param path - File source path, matching Interpreter.LoadFile.
   * @zh path - 文件源码路径，对应 Interpreter.LoadFile。
   * @ja path - Interpreter.LoadFile と同じファイルソースパス。
   * @ko path - Interpreter.LoadFile에 대응하는 파일 소스 경로입니다.
   * @remarks
   * Explicit execution does not require the document allowExternal policy.
   * @zh 显式执行不受文档 allowExternal 策略限制。
   * @ja 明示的な実行には文書の allowExternal ポリシーを適用しません。
   * @ko 명시적 실행에는 문서의 allowExternal 정책을 적용하지 않습니다.
   */
  executeFile(path: string): void {
    native.executeLuaFile(handleOf(this), path);
  }

  /**
   * Call one Lua function by its global identifier.
   *
   * @zh 按全局标识符调用一个 Lua 函数。
   * @ja グローバル識別子で Lua 関数を一つ呼びます。
   * @ko 전역 식별자로 Lua 함수 하나를 호출합니다.
   * @param name - Global function identifier.
   * @zh name - 全局函数标识符。
   * @ja name - グローバル関数識別子。
   * @ko name - 전역 함수 식별자입니다.
   * @param args - Scalar arguments; signed 64-bit integers use bigint.
   * @zh args - 标量参数，有符号 64 位整数用 bigint。
   * @ja args - スカラー引数。符号付き 64 ビット整数は bigint。
   * @ko args - 스칼라 인수이며 부호 있는 64비트 정수는 bigint입니다.
   * @returns First scalar result; Lua integer results are bigint.
   * @zh 第一个标量结果，Lua 整数结果为 bigint。
   * @ja 最初のスカラー結果。Lua 整数は bigint。
   * @ko 첫 스칼라 결과이며 Lua 정수는 bigint입니다.
   */
  call(name: string, ...args: LuaScalar[]): LuaScalar {
    return native.callLuaFunction(handleOf(this), name, args);
  }

  /**
   * Copy one scalar global from the native VM.
   *
   * @zh 从原生 VM 复制一个标量全局值。
   * @ja ネイティブ VM からスカラーのグローバルを一つコピーします。
   * @ko 네이티브 VM에서 스칼라 전역 값 하나를 복사합니다.
   * @param name - Global identifier.
   * @zh name - 全局标识符。
   * @ja name - グローバル識別子。
   * @ko name - 전역 식별자입니다.
   * @returns Copied scalar; missing values return null.
   * @zh 复制的标量，缺失值返回 null。
   * @ja コピーしたスカラー。ない値は null。
   * @ko 복사한 스칼라이며 없는 값은 null입니다.
   */
  getGlobal(name: string): LuaScalar {
    return native.getLuaGlobal(handleOf(this), name);
  }

  /**
   * Copy a scalar global into the native VM.
   *
   * @zh 将标量全局值复制到原生 VM。
   * @ja スカラーのグローバルをネイティブ VM にコピーします。
   * @ko 스칼라 전역 값을 네이티브 VM에 복사합니다.
   * @param name - Global identifier; scoped RmlUi globals are reserved.
   * @zh name - 全局标识符，RmlUi 作用域全局值为保留名称。
   * @ja name - グローバル識別子。RmlUi のスコープ名は予約済み。
   * @ko name - 전역 식별자이며 RmlUi 스코프 이름은 예약됩니다.
   * @param value - Copied scalar value.
   * @zh value - 复制的标量值。
   * @ja value - コピーするスカラー値。
   * @ko value - 복사할 스칼라 값입니다.
   */
  setGlobal(name: string, value: LuaScalar): void {
    native.setLuaGlobal(handleOf(this), name, value);
  }
}

/**
 * Check the nominal Lua receiver.
 *
 * @param host - Receiver.
 * @returns Native host handle.
 */
function handleOf(host: object): object {
  const handle = handles.get(host);
  if (!handle) {
    throw new TypeError('Expected a Lua script host');
  }
  return handle;
}

/**
 * Resolve a nominal Lua host without accepting forged structural objects.
 *
 * @param host - Candidate host.
 * @returns Native handle when present.
 * @internal
 */
export function luaScriptHostHandle(host: object): object | undefined {
  return handles.get(host);
}
