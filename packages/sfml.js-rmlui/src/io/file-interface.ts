import { resolve } from 'node:path';

import { native } from '../internal/native';
import { SeekOrigin, Stream, streamHandle } from './stream';

const providers = new WeakMap<FileInterface, object>();
const providerWrappers = new WeakMap<object, FileInterface>();
const files = new WeakMap<FileHandle, object>();
const fileWrappers = new WeakMap<object, FileHandle>();
const construction = Symbol('native file handle');

/**
 * Native token for one open file.
 *
 * @zh 单个打开文件的原生 token。
 * @ja 開いているファイルのネイティブトークン。
 * @ko 열린 파일의 네이티브 토큰입니다.
 * @remarks
 * Created by FileInterface.open, with no public constructor or pointer address.
 * Close and shutdown invalidate it. Each token belongs to one provider.
 * @zh 由 FileInterface.open 创建，没有公开构造器或指针地址。
 * close 和 shutdown 使其失效；每个 token 仅属于一个文件接口。
 * @ja FileInterface.open が作成します。公開コンストラクターやアドレスは
 * ありません。close と shutdown で無効化し、一つの API に属します。
 * @ko FileInterface.open이 생성합니다. 공개 생성자나 주소는 없으며
 * close와 shutdown 시 만료됩니다. 하나의 파일 API에 속합니다.
 */
export class FileHandle {
  /** Native token also gives the facade a nominal TypeScript type. @internal */
  private readonly token: object;

  /**
   * Create a checked facade internally.
   *
   * @param key - Private construction key.
   * @param handle - Native file token.
   * @internal
   */
  private constructor(key: symbol, handle: object) {
    if (key !== construction) {
      throw new TypeError('FileHandle must be returned by FileInterface.open');
    }
    this.token = handle;
    files.set(this, this.token);
    fileWrappers.set(handle, this);
  }

  /**
   * Preserve facade identity when a native virtual passes a file token.
   *
   * @param handle - Native token.
   * @returns Checked facade.
   * @internal
   */
  static wrap(handle: object): FileHandle {
    return fileWrappers.get(handle) ?? new FileHandle(construction, handle);
  }
}

/**
 * Synchronous file provider methods; omitted methods use Native byte storage.
 *
 * @zh 同步文件接口方法；省略的方法使用 Native 字节存储。
 * @ja 同期ファイル API。省略したメソッドは Native バイト領域を使います。
 * @ko 동기 파일 API이며 생략한 메서드는 Native 바이트 저장소를 사용합니다.
 * @remarks
 * Methods are captured once and keep their original this. Open may return a
 * byte snapshot or an existing memory/custom stream. File streams cannot be
 * returned because they already use this provider. File byte snapshots use
 * stdio seek semantics; custom streams preserve their own seek semantics.
 * Callbacks cannot reenter Native APIs or return Promises. Resource preload
 * obtains custom bytes on the owning thread and decodes images on workers.
 * @zh 方法捕获一次并保留 this。open 可返回字节快照或已有内存/自定义流；
 * 不能返回使用此文件接口的文件流。字节快照采用 stdio 定位语义，
 * 自定义流保留自身语义。回调不能重入 Native API 或返回 Promise。
 * 预加载在所属线程获取自定义字节，在线程池解码图片。
 * @ja メソッドを一度取得し、this を保持します。open はバイトのコピーか
 * 既存のメモリ/カスタムストリームを返します。ファイルストリームは禁止。
 * バイトは stdio のシーク規則、ストリームは元の規則を使います。
 * Native API の再入や Promise は禁止。所有スレッドでバイトを取得し、
 * ワーカーで画像をデコードします。
 * @ko 메서드를 한 번 캡처하며 this를 유지합니다. open은 바이트 사본이나
 * 기존 메모리/사용자 스트림을 반환하며 파일 스트림은 금지됩니다.
 * 바이트는 stdio 탐색 규칙, 스트림은 자체 규칙을 사용합니다.
 * Native API 재진입과 Promise는 금지되며 소유 스레드에서 바이트를
 * 가져오고 워커에서 이미지를 디코딩합니다.
 */
export interface FileCallbacks {
  /**
   * Open a source, returning null when it does not exist.
   *
   * @zh 打开资源；不存在时返回 null。
   * @ja ソースを開き、存在しない場合は null を返します。
   * @ko 소스를 열며 존재하지 않으면 null을 반환합니다.
   * @param path - Exact Native resource path.
   * @zh path - 原生资源的完整路径。
   * @ja path - ネイティブリソースのパス。
   * @ko path - 네이티브 리소스 경로입니다.
   * @returns Native-owned bytes, an existing stream, or null.
   * @zh 原生持有的字节、已有流或 null。
   * @ja Native 所有のバイト、既存ストリーム、または null。
   * @ko Native 소유 바이트, 기존 스트림 또는 null입니다.
   */
  open(path: string): Uint8Array | Stream | null;

  /**
   * Observe close before the token is invalidated.
   *
   * @zh 在 token 失效前处理关闭。
   * @ja トークンが無効になる前に close を処理します。
   * @ko 토큰이 만료되기 전에 닫기를 처리합니다.
   * @param file - The token returned by open.
   * @zh file - open 返回的 token。
   * @ja file - open が返したトークン。
   * @ko file - open이 반환한 토큰입니다.
   */
  close?(file: FileHandle): void;

  /**
   * Read into independent scratch bytes, returning an integer in [0, size].
   *
   * @zh 读取到独立临时字节，返回 [0, size] 内的整数。
   * @ja 独立した一時バイトへ読み込み、[0, size] の整数を返します。
   * @ko 독립 임시 바이트로 읽고 [0, size] 정수를 반환합니다.
   * @param output - Fixed scratch array; do not detach its buffer.
   * @zh output - 固定临时数组；不得分离缓冲区。
   * @ja output - 固定の一時配列。バッファの切り離しは禁止。
   * @ko output - 고정 임시 배열이며 버퍼 분리는 금지됩니다.
   * @param size - Maximum requested bytes.
   * @zh size - 最多请求字节数。
   * @ja size - 最大要求バイト数。
   * @ko size - 최대 요청 바이트 수입니다.
   * @param file - Open token.
   * @zh file - 打开的 token。
   * @ja file - 開いたトークン。
   * @ko file - 열린 토큰입니다.
   * @returns Exact bytes written.
   * @zh 实际写入字节数。
   * @ja 書き込んだバイト数。
   * @ko 실제 기록한 바이트 수입니다.
   */
  read?(output: Uint8Array, size: number, file: FileHandle): number;

  /**
   * Implement Native positioning.
   *
   * @zh 实现原生定位。
   * @ja ネイティブの位置移動を実装します。
   * @ko 네이티브 위치 이동을 구현합니다.
   * @param file - Open token.
   * @zh file - 打开的 token。
   * @ja file - 開いたトークン。
   * @ko file - 열린 토큰입니다.
   * @param offset - Signed C long byte offset.
   * @zh offset - 有符号 C long 字节偏移。
   * @ja offset - 符号付き C long バイトオフセット。
   * @ko offset - 부호 있는 C long 바이트 오프셋입니다.
   * @param origin - Native seek origin.
   * @zh origin - 原生定位基准。
   * @ja origin - ネイティブのシーク基準。
   * @ko origin - 네이티브 탐색 기준입니다.
   * @returns Whether positioning succeeded.
   * @zh 定位是否成功。
   * @ja 位置移動の成功。
   * @ko 위치 이동 성공 여부입니다.
   */
  seek?(file: FileHandle, offset: number, origin: SeekOrigin): boolean;

  /**
   * Return a nonnegative Native byte position.
   *
   * @zh 返回非负原生字节位置。
   * @ja 非負のネイティブバイト位置を返します。
   * @ko 음수가 아닌 네이티브 바이트 위치를 반환합니다.
   * @param file - Open token.
   * @zh file - 打开的 token。
   * @ja file - 開いたトークン。
   * @ko file - 열린 토큰입니다.
   * @returns Byte position.
   * @zh 字节位置。
   * @ja バイト位置。
   * @ko 바이트 위치입니다.
   */
  tell?(file: FileHandle): number;

  /**
   * Return a nonnegative Native file length.
   *
   * @zh 返回非负原生文件长度。
   * @ja 非負のネイティブファイル長を返します。
   * @ko 음수가 아닌 네이티브 파일 길이를 반환합니다.
   * @param file - Open token.
   * @zh file - 打开的 token。
   * @ja file - 開いたトークン。
   * @ko file - 열린 토큰입니다.
   * @returns Byte length.
   * @zh 字节长度。
   * @ja バイト長。
   * @ko 바이트 길이입니다.
   */
  length?(file: FileHandle): number;

  /**
   * Override whole-file loading; otherwise Native runs open/length/read/close.
   *
   * @zh 覆盖整文件加载；默认由 Native 执行 open/length/read/close。
   * @ja 全ファイル読み込みを上書き。省略時は Native が各操作を実行します。
   * @ko 전체 파일 로딩을 재정의하며 생략 시 Native가 각 작업을 실행합니다.
   * @param path - Resource path.
   * @zh path - 资源路径。
   * @ja path - リソースパス。
   * @ko path - 리소스 경로입니다.
   * @returns Snapshot bytes or null on failure.
   * @zh 字节快照；失败时返回 null。
   * @ja バイトのコピー。失敗時は null。
   * @ko 바이트 사본이며 실패 시 null입니다.
   */
  loadFile?(path: string): Uint8Array | null;
}

/**
 * Resolve an authentic file token.
 *
 * @param file - Registered facade.
 * @returns Native token.
 * @internal
 */
function fileOf(file: FileHandle): object {
  const handle = files.get(file);
  if (!handle) {
    throw new TypeError('Expected a native FileHandle');
  }
  return handle;
}

/**
 * Resolve an authentic provider.
 *
 * @param provider - Registered facade.
 * @returns Native interface.
 * @internal
 */
function providerOf(provider: FileInterface): object {
  const handle = providers.get(provider);
  if (!handle) {
    throw new TypeError('Expected a native FileInterface');
  }
  return handle;
}

/**
 * Native-owned Rml::FileInterface with a filesystem root or custom callbacks.
 *
 * @zh 原生持有的 Rml::FileInterface，支持文件根目录或自定义回调。
 * @ja ファイルルートやカスタムコールバックを使う Native 所有の API。
 * @ko 파일 루트나 사용자 콜백을 사용하는 Native 소유 API입니다.
 * @remarks
 * Select before initialization. Native retains selected callback owners;
 * unselected cycles are collectible. File roots try root + relative path
 * first, then the original path. A selected provider cannot be replaced by
 * an inconsistent initialise fileRoot. Shutdown closes and invalidates files
 * and interfaces, including unused setup objects.
 * @zh 在初始化前选择。Native 保留所选回调所有者，未选择的引用环可回收。
 * 根目录先尝试根目录加相对路径，再尝试原路径。initialise 的 fileRoot
 * 不能与所选接口冲突。shutdown 关闭并使所有文件和接口失效，
 * 包括未使用的配置对象。
 * @ja 初期化前に選択します。選択したコールバックを保持し、未選択の
 * 循環は回収できます。ルート付きパス、元のパスの順に試します。
 * 選択と異なる fileRoot は拒否。shutdown は未使用の設定も無効化します。
 * @ko 초기화 전에 선택합니다. 선택한 콜백을 유지하며 미선택 순환은
 * 회수됩니다. 루트 경로 후 원래 경로를 시도하며 충돌하는 fileRoot는
 * 거부됩니다. shutdown은 사용하지 않은 설정도 만료시킵니다.
 */
export class FileInterface {
  /**
   * Create a filesystem or custom provider.
   *
   * @zh 创建文件系统或自定义接口。
   * @ja ファイルシステムまたはカスタム API を作成。
   * @ko 파일시스템 또는 사용자 API를 생성합니다.
   * @param source - Filesystem root, or synchronous callbacks.
   * @zh source - 文件根目录或同步回调。
   * @ja source - ファイルルートまたは同期コールバック。
   * @ko source - 파일 루트 또는 동기 콜백입니다.
   */
  constructor(source: string | FileCallbacks = '') {
    let functions: unknown[];
    if (typeof source === 'string') {
      functions = new Array(7).fill(undefined);
    } else {
      if (!source || typeof source !== 'object') {
        throw new TypeError('Expected FileCallbacks with open');
      }
      const keys: (keyof FileCallbacks)[] = [
        'open', 'close', 'read', 'seek', 'tell', 'length', 'loadFile',
      ];
      const methods = keys.map(key => {
        const method = source[key];
        if (method !== undefined && typeof method !== 'function') {
          throw new TypeError(`Expected optional file callback: ${key}`);
        }
        return method?.bind(source);
      }) as [
        FileCallbacks['open'], FileCallbacks['close'], FileCallbacks['read'],
        FileCallbacks['seek'], FileCallbacks['tell'], FileCallbacks['length'],
        FileCallbacks['loadFile'],
      ];
      if (typeof methods[0] !== 'function') {
        throw new TypeError('Expected FileCallbacks with open');
      }
      functions = [
        (path: string) => {
          const value = methods[0]!(path);
          return value instanceof Stream ? streamHandle(value) : value;
        },
        methods[1] && ((file: object) => methods[1]!(FileHandle.wrap(file))),
        methods[2] && ((output: Uint8Array, size: number, file: object) =>
          methods[2]!(output, size, FileHandle.wrap(file))),
        methods[3] && ((file: object, offset: number, origin: SeekOrigin) =>
          methods[3]!(FileHandle.wrap(file), offset, origin)),
        methods[4] && ((file: object) => methods[4]!(FileHandle.wrap(file))),
        methods[5] && ((file: object) => methods[5]!(FileHandle.wrap(file))),
        methods[6],
      ];
    }
    const handle = native.createFileInterface(
      typeof source === 'string' ? resolve(source) : '', functions);
    providers.set(this, handle);
    providerWrappers.set(handle, this);
  }

  /**
   * Open a file through Rml::FileInterface::Open.
   *
   * @zh 通过 Rml::FileInterface::Open 打开文件。
   * @ja Rml::FileInterface::Open で開きます。
   * @ko Rml::FileInterface::Open으로 엽니다.
   * @param path - File path.
   * @zh path - 文件路径。
   * @ja path - ファイルパス。
   * @ko path - 파일 경로입니다.
   * @returns Checked file token, or null when unavailable.
   * @zh 校验文件 token；不可用时返回 null。
   * @ja 検査済みトークン。利用不可なら null。
   * @ko 검증한 파일 토큰이며 사용 불가 시 null입니다.
   */
  open(path: string): FileHandle | null {
    const handle = native.fileOpen(providerOf(this), path);
    return handle === null ? null : FileHandle.wrap(handle);
  }

  /**
   * Close and invalidate a token through Native Close.
   *
   * @zh 通过原生 Close 关闭并使 token 失效。
   * @ja Native Close で閉じてトークンを無効化。
   * @ko Native Close로 닫고 토큰을 만료시킵니다.
   * @param file - Open file token.
   * @zh file - 打开的文件 token。
   * @ja file - 開いたファイルトークン。
   * @ko file - 열린 파일 토큰입니다.
   */
  close(file: FileHandle): void {
    native.fileClose(providerOf(this), fileOf(file));
  }

  /**
   * Read at most size bytes into output through Native Read.
   *
   * @zh 通过原生 Read 向 output 最多读取 size 字节。
   * @ja Native Read で最大 size バイトを output に読み込みます。
   * @ko Native Read로 최대 size 바이트를 output에 읽습니다.
   * @param output - Fixed attached byte array.
   * @zh output - 固定且未分离的字节数组。
   * @ja output - 固定で接続済みのバイト配列。
   * @ko output - 고정된 연결 바이트 배열입니다.
   * @param size - Maximum bytes, no larger than output.length.
   * @zh size - 最大字节数，不超过 output.length。
   * @ja size - 最大バイト数。output.length 以下。
   * @ko size - 최대 바이트 수이며 output.length 이하입니다.
   * @param file - Open token.
   * @zh file - 打开的 token。
   * @ja file - 開いたトークン。
   * @ko file - 열린 토큰입니다.
   * @returns Actual bytes read.
   * @zh 实际读取字节数。
   * @ja 実際の読み込みバイト数。
   * @ko 실제 읽은 바이트 수입니다.
   */
  read(output: Uint8Array, size: number, file: FileHandle): number {
    return native.fileRead(providerOf(this), output, size, fileOf(file));
  }

  /**
   * Move the file cursor through Native Seek.
   *
   * @zh 通过原生 Seek 移动文件游标。
   * @ja Native Seek でファイル位置を移動。
   * @ko Native Seek로 파일 위치를 이동합니다.
   * @param file - Open token.
   * @zh file - 打开的 token。
   * @ja file - 開いたトークン。
   * @ko file - 열린 토큰입니다.
   * @param offset - Signed Native byte offset.
   * @zh offset - 原生有符号字节偏移。
   * @ja offset - ネイティブ符号付きバイトオフセット。
   * @ko offset - 네이티브 부호 있는 바이트 오프셋입니다.
   * @param origin - Seek basis.
   * @zh origin - 定位基准。
   * @ja origin - シーク基準。
   * @ko origin - 탐색 기준입니다.
   * @returns Native seek result.
   * @zh 原生定位结果。
   * @ja ネイティブのシーク結果。
   * @ko 네이티브 탐색 결과입니다.
   */
  seek(file: FileHandle, offset: number, origin: SeekOrigin): boolean {
    return native.fileSeek(providerOf(this), fileOf(file), offset, origin);
  }

  /**
   * Read the Native byte position.
   *
   * @zh 读取原生字节位置。
   * @ja ネイティブバイト位置を読み取ります。
   * @ko 네이티브 바이트 위치를 읽습니다.
   * @param file - Open token.
   * @zh file - 打开的 token。
   * @ja file - 開いたトークン。
   * @ko file - 열린 토큰입니다.
   * @returns Current byte position.
   * @zh 当前字节位置。
   * @ja 現在のバイト位置。
   * @ko 현재 바이트 위치입니다.
   */
  tell(file: FileHandle): number {
    return native.fileTell(providerOf(this), fileOf(file));
  }

  /**
   * Read the Native file length.
   *
   * @zh 读取原生文件长度。
   * @ja ネイティブファイル長を読み取ります。
   * @ko 네이티브 파일 길이를 읽습니다.
   * @param file - Open token.
   * @zh file - 打开的 token。
   * @ja file - 開いたトークン。
   * @ko file - 열린 토큰입니다.
   * @returns File byte length.
   * @zh 文件字节长度。
   * @ja ファイルバイト長。
   * @ko 파일 바이트 길이입니다.
   */
  length(file: FileHandle): number {
    return native.fileLength(providerOf(this), fileOf(file));
  }

  /**
   * Load all bytes through Native LoadFile.
   *
   * @zh 通过原生 LoadFile 加载全部字节。
   * @ja Native LoadFile で全バイトを読み込みます。
   * @ko Native LoadFile로 전체 바이트를 로드합니다.
   * @param path - Source file path.
   * @zh path - 来源文件路径。
   * @ja path - ソースファイルパス。
   * @ko path - 소스 파일 경로입니다.
   * @returns Owned byte snapshot, or null when unavailable.
   * @zh 独立字节快照；文件不可用时返回 null。
   * @ja 所有バイトのコピー。利用不可なら null。
   * @ko 소유 바이트 사본이며 사용 불가 시 null입니다.
   * @remarks
   * Matches upstream default LoadFile: a short read logs a warning and keeps
   * unread bytes zero-filled. An empty file still calls Read with size zero.
   * @zh 与上游默认 LoadFile 一致：短读记录警告，未读取字节填零。
   * 空文件仍以零长度调用 Read。
   * @ja 上流の LoadFile と同じく短い読み込みを警告し、未読バイトはゼロです。
   * 空ファイルもサイズゼロで Read を呼びます。
   * @ko 상위 LoadFile과 같이 짧은 읽기는 경고하고 미독 바이트는 0입니다.
   * 빈 파일도 크기 0으로 Read를 호출합니다.
   */
  loadFile(path: string): Uint8Array | null {
    return native.fileLoad(providerOf(this), path);
  }
}

/**
 * Select a Native file provider before RmlUi initialization.
 *
 * @zh 在 RmlUi 初始化前选择原生文件接口。
 * @ja RmlUi 初期化前に Native ファイル API を選択。
 * @ko RmlUi 초기화 전에 Native 파일 API를 선택합니다.
 * @param provider - Checked provider, or null to restore the default.
 * @zh provider - 校验过的接口；null 恢复默认。
 * @ja provider - 検査済み API。null はデフォルトに戻します。
 * @ko provider - 검증한 API이며 null은 기본값을 복원합니다.
 */
export function setFileInterface(provider: FileInterface | null): void {
  native.setFileInterface(provider === null ? null : providerOf(provider));
}

/**
 * Return the selected Native file interface.
 *
 * @zh 返回所选原生文件接口。
 * @ja 選択した Native ファイル API を返します。
 * @ko 선택한 Native 파일 API를 반환합니다.
 * @returns Selected interface or null before selection and after shutdown.
 * @zh 所选接口；选择前和关闭后为 null。
 * @ja 選択した API。選択前と終了後は null。
 * @ko 선택한 API이며 선택 전과 종료 후는 null입니다.
 */
export function getFileInterface(): FileInterface | null {
  const handle = native.getFileInterface();
  if (handle === null) {
    return null;
  }
  let wrapper = providerWrappers.get(handle);
  if (!wrapper) {
    wrapper = Object.create(FileInterface.prototype) as FileInterface;
    providers.set(wrapper, handle);
    providerWrappers.set(handle, wrapper);
  }
  return wrapper;
}
