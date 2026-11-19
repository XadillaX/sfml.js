import { native } from '../internal/native';

const handles = new WeakMap<Stream, object>();
const nativeConstruction = Symbol('native stream construction');

/**
 * Rml::Stream mode bits.
 *
 * @zh Rml::Stream 模式位。
 * @ja Rml::Stream のモードビット。
 * @ko Rml::Stream 모드 비트입니다.
 */
export enum StreamMode {
  /**
   * Writable stream.
   *
   * @zh 可写流。
   * @ja 書き込み可能なストリーム。
   * @ko 쓰기 가능한 스트림입니다.
   */
  Write = 1,
  /**
   * Append mode.
   *
   * @zh 追加模式。
   * @ja 追記モード。
   * @ko 추가 모드입니다.
   */
  Append = 2,
  /**
   * Readable stream.
   *
   * @zh 可读流。
   * @ja 読み取り可能なストリーム。
   * @ko 읽기 가능한 스트림입니다.
   */
  Read = 4,
  /**
   * Native mask of Write, Append and Read, excluding Async.
   *
   * @zh 原生 Write、Append 和 Read 掩码，不含 Async。
   * @ja Async を除いた Write、Append、Read のネイティブマスク。
   * @ko Async를 제외한 Write, Append, Read의 네이티브 마스크입니다.
   */
  Mask = 7,
  /**
   * Native asynchronous readiness mode; JS callbacks stay synchronous.
   *
   * @zh 原生异步就绪模式；JS 回调仍须同步返回。
   * @ja ネイティブの非同期準備モード。JS コールバックは同期です。
   * @ko 네이티브 비동기 준비 모드이며 JS 콜백은 동기식입니다.
   */
  Async = 8,
}

/**
 * Native seek origins.
 *
 * @zh 原生定位基准。
 * @ja ネイティブのシーク基準。
 * @ko 네이티브 탐색 기준입니다.
 */
export enum SeekOrigin {
  /**
   * Start of the stream.
   *
   * @zh 流起点。
   * @ja ストリームの先頭。
   * @ko 스트림 시작입니다.
   */
  Set = 0,
  /**
   * Current position.
   *
   * @zh 当前位置。
   * @ja 現在の位置。
   * @ko 현재 위치입니다.
   */
  Current = 1,
  /**
   * End; StreamMemory subtracts the offset, StreamFile adds it.
   *
   * @zh 末尾；StreamMemory 减去偏移，StreamFile 加上偏移。
   * @ja 末尾。StreamMemory はオフセットを減算し、StreamFile は加算します。
   * @ko 끝 위치이며 StreamMemory는 오프셋을 빼고 StreamFile은 더합니다.
   */
  End = 2,
}

/**
 * Synchronous implementations of Rml::Stream virtual methods.
 *
 * @zh Rml::Stream 虚方法的同步实现。
 * @ja Rml::Stream 仮想メソッドの同期実装。
 * @ko Rml::Stream 가상 메서드의 동기 구현입니다.
 * @remarks
 * Methods are captured once. Read and peek receive owned scratch arrays;
 * writes receive snapshots. Return exact counts or booleans, never Promises.
 * Native API reentry is rejected. Callback cycles remain visible to the GC.
 * @zh 方法仅捕获一次。read 和 peek 接收独立临时数组，写入接收快照。
 * 必须返回准确计数或布尔值，不能返回 Promise。禁止重入原生 API。
 * 回调引用环对 GC 可见。
 * @ja メソッドは一度取得します。read と peek は独立配列、write は
 * コピーを受け取ります。正確な数値か真偽値を同期で返してください。
 * ネイティブ API の再入は禁止です。循環参照も GC が回収できます。
 * @ko 메서드는 한 번 캡처됩니다. read와 peek는 독립 배열을, write는
 * 사본을 받습니다. 정확한 수나 불리언을 동기적으로 반환해야 합니다.
 * 네이티브 API 재진입은 거부되며 순환 참조도 GC에서 회수됩니다.
 */
export interface StreamCallbacks {
  /**
   * Return the total byte length as a nonnegative safe integer.
   *
   * @zh 返回非负安全整数表示的总字节长度。
   * @ja 総バイト長を非負の安全な整数で返します。
   * @ko 전체 바이트 길이를 음수가 아닌 안전한 정수로 반환합니다.
   * @returns Total byte length.
   * @zh 总字节长度。
   * @ja 総バイト長。
   * @ko 전체 바이트 길이입니다.
   */
  length(): number;

  /**
   * Return the current byte position as a nonnegative safe integer.
   *
   * @zh 返回非负安全整数表示的当前字节位置。
   * @ja 現在のバイト位置を非負の安全な整数で返します。
   * @ko 현재 바이트 위치를 음수가 아닌 안전한 정수로 반환합니다.
   * @returns Current byte position.
   * @zh 当前字节位置。
   * @ja 現在のバイト位置。
   * @ko 현재 바이트 위치입니다.
   */
  tell(): number;

  /**
   * Implement native seek; choose the callback's end-offset convention.
   *
   * @zh 实现原生定位；末尾偏移语义由回调决定。
   * @ja ネイティブのシーク。末尾オフセットの規則は実装が決めます。
   * @ko 네이티브 탐색을 구현하며 끝 오프셋 규칙은 콜백에서 결정합니다.
   * @param offset - Signed byte offset.
   * @zh offset - 有符号字节偏移。
   * @ja offset - 符号付きバイトオフセット。
   * @ko offset - 부호 있는 바이트 오프셋입니다.
   * @param origin - Native seek origin.
   * @zh origin - 原生定位基准。
   * @ja origin - ネイティブのシーク基準。
   * @ko origin - 네이티브 탐색 기준입니다.
   * @returns Whether the cursor moved successfully.
   * @zh 是否成功移动游标。
   * @ja カーソルの移動に成功したか。
   * @ko 커서 이동 성공 여부입니다.
   */
  seek(offset: number, origin: SeekOrigin): boolean;

  /**
   * Read into owned scratch storage and advance the cursor.
   *
   * @zh 向独立临时存储读取，并推进游标。
   * @ja 独立した一時領域に読み込み、カーソルを進めます。
   * @ko 독립 임시 저장소로 읽고 커서를 이동합니다.
   * @param output - Scratch bytes; never detach or resize its buffer.
   * @zh output - 临时字节；不得分离或调整其缓冲区大小。
   * @ja output - 一時バイト列。バッファの切り離しやサイズ変更は禁止です。
   * @ko output - 임시 바이트이며 버퍼 분리나 크기 변경은 금지됩니다.
   * @param count - Maximum number of bytes to read.
   * @zh count - 最大读取字节数。
   * @ja count - 最大読み取りバイト数。
   * @ko count - 최대 읽기 바이트 수입니다.
   * @returns Integer in [0, count].
   * @zh [0, count] 范围内的整数。
   * @ja [0, count] の整数。
   * @ko [0, count] 범위의 정수입니다.
   */
  read(output: Uint8Array, count: number): number;

  /**
   * Write the supplied independent byte snapshot.
   *
   * @zh 写入提供的独立字节快照。
   * @ja 渡された独立バイトコピーを書き込みます。
   * @ko 전달된 독립 바이트 사본을 씁니다.
   * @param input - Owned snapshot; changes cannot affect the caller.
   * @zh input - 独立快照；修改不会影响调用者。
   * @ja input - 独立したコピー。変更は呼び出し元に影響しません。
   * @ko input - 독립 사본이며 수정해도 호출자에 영향을 주지 않습니다.
   * @param count - Maximum number of bytes to write.
   * @zh count - 最大写入字节数。
   * @ja count - 最大書き込みバイト数。
   * @ko count - 최대 쓰기 바이트 수입니다.
   * @returns Integer in [0, count].
   * @zh [0, count] 范围内的整数。
   * @ja [0, count] の整数。
   * @ko [0, count] 범위의 정수입니다.
   */
  write(input: Uint8Array, count: number): number;

  /**
   * Reduce the length and return the number of removed bytes.
   *
   * @zh 缩短长度并返回删除的字节数。
   * @ja 長さを縮小し、削除したバイト数を返します。
   * @ko 길이를 줄이고 제거한 바이트 수를 반환합니다.
   * @param length - Requested byte length.
   * @zh length - 请求的字节长度。
   * @ja length - 要求するバイト長。
   * @ko length - 요청한 바이트 길이입니다.
   * @returns Nonnegative safe integer count of removed bytes.
   * @zh 删除字节数，须为非负安全整数。
   * @ja 削除したバイト数を非負の安全な整数で返します。
   * @ko 제거한 바이트 수를 음수가 아닌 안전한 정수로 반환합니다.
   */
  truncate(length: number): number;

  /**
   * Return whether bytes are ready for reading.
   *
   * @zh 返回是否可读取字节。
   * @ja 読み取りの準備ができているかを返します。
   * @ko 바이트를 읽을 준비가 되었는지 반환합니다.
   * @returns Reading readiness.
   * @zh 读取就绪状态。
   * @ja 読み取りの準備状態。
   * @ko 읽기 준비 상태입니다.
   */
  isReadReady(): boolean;

  /**
   * Return whether bytes can be written now.
   *
   * @zh 返回当前是否可写入字节。
   * @ja 現在書き込みが可能かを返します。
   * @ko 현재 바이트를 쓸 수 있는지 반환합니다.
   * @returns Writing readiness.
   * @zh 写入就绪状态。
   * @ja 書き込みの準備状態。
   * @ko 쓰기 준비 상태입니다.
   */
  isWriteReady(): boolean;

  /**
   * Optional explicit close callback; never invoked by GC or shutdown.
   *
   * @zh 可选显式关闭回调；GC 和 shutdown 不调用它。
   * @ja 明示的 close の任意コールバック。GC や shutdown は呼びません。
   * @ko 명시적 close의 선택 콜백이며 GC와 shutdown에서는 호출하지 않습니다.
   */
  close?(): void;

  /**
   * Optional EOF test; defaults to tell() greater than or equal to length().
   *
   * @zh 可选 EOF 检查；默认检查 tell() 是否大于等于 length()。
   * @ja 任意の EOF 判定。既定は tell() が length() 以上かどうかです。
   * @ko 선택적 EOF 검사이며 기본값은 tell()이 length() 이상인지 검사합니다.
   * @returns End-of-stream state.
   * @zh 流结束状态。
   * @ja ストリーム終了状態。
   * @ko 스트림 종료 상태입니다.
   */
  isEOS?(): boolean;

  /**
   * Optional read without advancing; defaults to read followed by seek.
   *
   * @zh 可选不推进游标的读取；默认读取后通过 seek 恢复。
   * @ja 位置を進めない任意の読み取り。既定は read 後に seek で戻します。
   * @ko 커서를 이동하지 않는 선택 읽기이며 기본은 read 후 seek로 복원합니다.
   */
  peek?: StreamCallbacks['read'];

  /**
   * Optional prepend operation; absence throws.
   *
   * @zh 可选前插操作；未实现时抛出异常。
   * @ja 任意の先頭挿入。未実装の場合は例外です。
   * @ko 선택적 앞쪽 삽입이며 미구현 시 예외를 던집니다.
   */
  pushFront?: StreamCallbacks['write'];

  /**
   * Optional append; defaults to seek, write and cursor restoration.
   *
   * @zh 可选尾部追加；默认定位、写入并恢复游标。
   * @ja 任意の追記。既定はシーク、書き込み、位置の復元です。
   * @ko 선택적 뒤쪽 추가이며 기본은 탐색, 쓰기, 커서 복원입니다.
   */
  pushBack?: StreamCallbacks['write'];

  /**
   * Optional front removal; absence throws.
   *
   * @zh 可选头部删除；未实现时抛出异常。
   * @ja 任意の先頭削除。未実装の場合は例外です。
   * @ko 선택적 앞쪽 제거이며 미구현 시 예외를 던집니다.
   */
  popFront?: StreamCallbacks['truncate'];

  /**
   * Optional tail removal; defaults to truncate().
   *
   * @zh 可选尾部删除；默认调用 truncate()。
   * @ja 任意の末尾削除。既定は truncate() です。
   * @ko 선택적 뒤쪽 제거이며 기본은 truncate()입니다.
   */
  popBack?: StreamCallbacks['truncate'];
}

/**
 * Checked Rml::Stream with native memory, file or synchronous JS storage.
 *
 * @zh 使用原生内存、文件或同步 JS 存储的受检查 Rml::Stream。
 * @ja ネイティブメモリ、ファイル、同期 JS 保存領域の検証付き Rml::Stream。
 * @ko 네이티브 메모리, 파일 또는 동기 JS 저장소를 쓰는 검증된 Rml::Stream입니다.
 * @remarks
 * Every wrapper expires at shutdown. Returned byte arrays are independent.
 * Byte batches and memory sizes are integers in [0, 2147483647].
 * @zh shutdown 使所有包装对象失效。返回的字节数组均为独立副本。
 * 字节批次和内存大小须为 [0, 2147483647] 范围内的整数。
 * @ja shutdown ですべてのラッパーが無効になります。返却配列は独立です。
 * バイトバッチとメモリサイズは [0, 2147483647] の整数です。
 * @ko shutdown 시 모든 래퍼가 무효화됩니다. 반환 배열은 독립 사본입니다.
 * 바이트 배치와 메모리 크기는 [0, 2147483647] 범위의 정수입니다.
 */
export class Stream {
  /**
   * Implement the abstract native stream using synchronous callbacks.
   *
   * @zh 使用同步回调实现抽象原生流。
   * @ja 同期コールバックで抽象ネイティブストリームを実装します。
   * @ko 동기 콜백으로 추상 네이티브 스트림을 구현합니다.
   * @param callbacks - Required virtual methods and optional overrides.
   * @zh callbacks - 必需虚方法和可选覆写方法。
   * @ja callbacks - 必須の仮想メソッドと任意のオーバーライド。
   * @ko callbacks - 필수 가상 메서드와 선택적 재정의입니다.
   * @param sourceUrl - Resource origin; defaults to empty.
   * @zh sourceUrl - 资源来源，默认为空。
   * @ja sourceUrl - リソースの参照元。既定は空です。
   * @ko sourceUrl - 리소스 원본이며 기본값은 빈 문자열입니다.
   * @param mode - Native mode bits; defaults to Read | Write.
   * @zh mode - 原生模式位，默认为 Read | Write。
   * @ja mode - ネイティブのモードビット。既定は Read | Write です。
   * @ko mode - 네이티브 모드 비트이며 기본값은 Read | Write입니다.
   */
  constructor(callbacks: StreamCallbacks, sourceUrl?: string, mode?: number);

  /** @internal */
  constructor(initial: typeof nativeConstruction);
  constructor(
    callbacks: StreamCallbacks | typeof nativeConstruction,
    sourceUrl = '', mode = StreamMode.Read + StreamMode.Write,
  ) {
    if (callbacks !== nativeConstruction) {
      handles.set(this, native.createStream(callbacks, sourceUrl, mode));
    }
  }

  /**
   * Invoke Rml::Stream::Close; memory bytes remain available until shutdown.
   *
   * @zh 调用 Rml::Stream::Close；内存字节保留至 shutdown。
   * @ja Rml::Stream::Close を呼びます。メモリは shutdown まで保持します。
   * @ko Rml::Stream::Close를 호출하며 메모리 바이트는 shutdown까지 유지됩니다.
   */
  close(): void {
    native.streamClose(streamHandle(this));
  }

  /**
   * Return Rml::Stream::Length in bytes.
   *
   * @zh 返回 Rml::Stream::Length 字节数。
   * @ja Rml::Stream::Length のバイト数を返します。
   * @ko Rml::Stream::Length의 바이트 수를 반환합니다.
   * @returns Total byte length.
   * @zh 总字节长度。
   * @ja 総バイト長。
   * @ko 전체 바이트 길이입니다.
   */
  length(): number {
    return native.streamLength(streamHandle(this));
  }

  /**
   * Return Rml::Stream::Tell in bytes.
   *
   * @zh 返回 Rml::Stream::Tell 字节位置。
   * @ja Rml::Stream::Tell のバイト位置を返します。
   * @ko Rml::Stream::Tell의 바이트 위치를 반환합니다.
   * @returns Current byte position.
   * @zh 当前字节位置。
   * @ja 現在のバイト位置。
   * @ko 현재 바이트 위치입니다.
   */
  tell(): number {
    return native.streamTell(streamHandle(this));
  }

  /**
   * Invoke Rml::Stream::Seek with a checked signed integer offset.
   *
   * @zh 使用受检查的有符号整数偏移调用 Rml::Stream::Seek。
   * @ja 検証した符号付き整数で Rml::Stream::Seek を呼びます。
   * @ko 검증된 부호 있는 정수로 Rml::Stream::Seek를 호출합니다.
   * @param offset - Byte offset; StreamMemory End subtracts this value.
   * @zh offset - 字节偏移；StreamMemory 的 End 减去此值。
   * @ja offset - バイトオフセット。StreamMemory の End は減算します。
   * @ko offset - 바이트 오프셋이며 StreamMemory의 End는 이 값을 뺍니다.
   * @param origin - Seek base; defaults to Set.
   * @zh origin - 定位基准，默认为 Set。
   * @ja origin - シーク基準。既定は Set です。
   * @ko origin - 탐색 기준이며 기본값은 Set입니다.
   * @returns Native success flag; invalid memory targets leave the cursor.
   * @zh 原生成功标记；无效内存目标保留原游标。
   * @ja 成功の真偽値。無効なメモリ位置では現在位置を保持します。
   * @ko 네이티브 성공 여부이며 잘못된 메모리 위치는 커서를 유지합니다.
   */
  seek(offset: number, origin = SeekOrigin.Set): boolean {
    return native.streamSeek(streamHandle(this), offset, origin);
  }

  /**
   * Invoke Rml::Stream::IsEOS.
   *
   * @zh 调用 Rml::Stream::IsEOS。
   * @ja Rml::Stream::IsEOS を呼びます。
   * @ko Rml::Stream::IsEOS를 호출합니다.
   * @returns Whether the cursor is at the end.
   * @zh 游标是否位于末尾。
   * @ja カーソルが末尾にあるか。
   * @ko 커서가 끝에 있는지 여부입니다.
   */
  isEOS(): boolean {
    return native.streamIsEOS(streamHandle(this));
  }

  /**
   * Invoke Rml::Stream::IsReadReady.
   *
   * @zh 调用 Rml::Stream::IsReadReady。
   * @ja Rml::Stream::IsReadReady を呼びます。
   * @ko Rml::Stream::IsReadReady를 호출합니다.
   * @returns Whether bytes are ready to read.
   * @zh 是否可读取字节。
   * @ja バイトを読み取れるか。
   * @ko 바이트를 읽을 준비가 되었는지 여부입니다.
   */
  isReadReady(): boolean {
    return native.streamIsReadReady(streamHandle(this));
  }

  /**
   * Check readiness; immutable memory snapshots and files always return false.
   *
   * @zh 检查就绪状态；不可变内存快照和文件始终返回 false。
   * @ja 準備状態を確認します。不変のメモリとファイルは常に false です。
   * @ko 준비 상태를 검사하며 불변 메모리와 파일은 항상 false를 반환합니다.
   * @returns Whether bytes can be written now.
   * @zh 当前是否可写入字节。
   * @ja 現在書き込みが可能か。
   * @ko 현재 바이트를 쓸 수 있는지 여부입니다.
   */
  isWriteReady(): boolean {
    return native.streamIsWriteReady(streamHandle(this));
  }

  /**
   * Return Rml::Stream::GetStreamMode; new memory streams start at zero.
   *
   * @zh 返回 Rml::Stream::GetStreamMode；新内存流初始为零。
   * @ja Rml::Stream::GetStreamMode。新しいメモリストリームは 0 です。
   * @ko Rml::Stream::GetStreamMode이며 새 메모리 스트림은 0으로 시작합니다.
   * @returns Native mode bit mask.
   * @zh 原生模式位掩码。
   * @ja ネイティブのモードビットマスク。
   * @ko 네이티브 모드 비트 마스크입니다.
   */
  getStreamMode(): number {
    return native.streamGetMode(streamHandle(this));
  }

  /**
   * Return Rml::Stream::GetSourceURL as text.
   *
   * @zh 将 Rml::Stream::GetSourceURL 作为文本返回。
   * @ja Rml::Stream::GetSourceURL を文字列で返します。
   * @ko Rml::Stream::GetSourceURL을 문자열로 반환합니다.
   * @returns Source URL used for relative resources.
   * @zh 相对资源使用的来源 URL。
   * @ja 相対リソースの参照元 URL。
   * @ko 상대 리소스에 사용할 원본 URL입니다.
   */
  getSourceURL(): string {
    return native.streamGetSourceURL(streamHandle(this));
  }

  /**
   * Read bytes through Rml::Stream::Read.
   *
   * @zh 通过 Rml::Stream::Read 读取字节。
   * @ja Rml::Stream::Read でバイトを読み取ります。
   * @ko Rml::Stream::Read로 바이트를 읽습니다.
   * @param target - Maximum byte count.
   * @zh target - 最大字节数。
   * @ja target - 最大バイト数。
   * @ko target - 최대 바이트 수입니다.
   * @returns Independent bytes consumed from the current cursor.
   * @zh 从当前游标读取的独立字节。
   * @ja 現在位置から読み取った独立バイト配列。
   * @ko 현재 커서에서 읽은 독립 바이트입니다.
   * @remarks
   * Stream copying preserves native counts even if the destination writes
   * fewer bytes. Copying a stream to itself is rejected.
   * @zh 流复制保留原生计数，即使目标写入较少字节。禁止复制到自身。
   * @ja 出力が短い書き込みでも元の読み取り数を返します。自己コピーは禁止です。
   * @ko 대상이 적게 쓰더라도 원본 읽기 수를 유지하며 자기 복사는 금지됩니다.
   */
  read(target: number): Uint8Array;

  /**
   * Read into a view or stream through Rml::Stream::Read.
   *
   * @zh 通过 Rml::Stream::Read 读取到视图或流。
   * @ja Rml::Stream::Read でビューかストリームに読み込みます。
   * @ko Rml::Stream::Read로 뷰 또는 스트림에 읽습니다.
   * @param target - Destination view or stream.
   * @zh target - 目标视图或流。
   * @ja target - 出力ビューかストリーム。
   * @ko target - 대상 뷰 또는 스트림입니다.
   * @param count - Byte limit; defaults to view size or remaining length.
   * @zh count - 字节上限，默认为视图大小或剩余长度。
   * @ja count - バイト上限。既定はビューサイズか残り長です。
   * @ko count - 바이트 상한이며 기본값은 뷰 크기 또는 남은 길이입니다.
   * @returns Source bytes consumed, even on short destination writes.
   * @zh 消耗的来源字节数，即使目标写入较少字节。
   * @ja 出力の書き込みが短くても、元から消費したバイト数。
   * @ko 대상이 적게 쓰더라도 소비한 원본 바이트 수입니다.
   */
  read(target: Uint8Array | Stream, count?: number): number;
  read(
    target: number | Uint8Array | Stream, count?: number,
  ): Uint8Array | number {
    return native.streamRead(
      streamHandle(this), target instanceof Stream ? streamHandle(target) :
        target, count, false);
  }

  /**
   * Read through Rml::Stream::Peek without advancing the cursor.
   *
   * @zh 通过 Rml::Stream::Peek 读取，不推进游标。
   * @ja Rml::Stream::Peek で位置を進めずに読み取ります。
   * @ko Rml::Stream::Peek로 커서를 이동하지 않고 읽습니다.
   * @param target - Maximum byte count.
   * @zh target - 最大字节数。
   * @ja target - 最大バイト数。
   * @ko target - 최대 바이트 수입니다.
   * @returns Independent bytes without consuming the source.
   * @zh 不消耗来源的独立字节。
   * @ja 元を消費しない独立バイト配列。
   * @ko 원본을 소비하지 않는 독립 바이트입니다.
   */
  peek(target: number): Uint8Array;

  /**
   * Peek into a view without advancing the cursor.
   *
   * @zh 读取到视图，不推进游标。
   * @ja 位置を進めずにビューに読み込みます。
   * @ko 커서를 이동하지 않고 뷰에 읽습니다.
   * @param target - Destination byte view.
   * @zh target - 目标字节视图。
   * @ja target - 出力バイトビュー。
   * @ko target - 대상 바이트 뷰입니다.
   * @param count - Byte limit; defaults to view size.
   * @zh count - 字节上限，默认为视图大小。
   * @ja count - バイト上限。既定はビューサイズです。
   * @ko count - 바이트 상한이며 기본값은 뷰 크기입니다.
   * @returns Bytes copied without consuming the source.
   * @zh 复制且不消耗来源的字节数。
   * @ja 元を消費せずにコピーしたバイト数。
   * @ko 원본을 소비하지 않고 복사한 바이트 수입니다.
   */
  peek(target: Uint8Array, count?: number): number;
  peek(target: number | Uint8Array, count?: number): Uint8Array | number {
    return native.streamRead(streamHandle(this), target, count, true);
  }

  /**
   * Decode consumed UTF-8 bytes and append them to an initial string.
   *
   * @zh 解码读取的 UTF-8 字节并追加至初始字符串。
   * @ja 消費した UTF-8 バイトを復号し、初期文字列に追加します。
   * @ko 읽은 UTF-8 바이트를 디코딩해 초기 문자열에 추가합니다.
   * @param count - Maximum byte count.
   * @zh count - 最大字节数。
   * @ja count - 最大バイト数。
   * @ko count - 최대 바이트 수입니다.
   * @param initial - Initial string; defaults to empty.
   * @zh initial - 初始字符串，默认为空。
   * @ja initial - 初期文字列。既定は空です。
   * @ko initial - 초기 문자열이며 기본값은 빈 문자열입니다.
   * @returns Appended string, preserving embedded null characters.
   * @zh 追加后的字符串，保留内嵌空字符。
   * @ja 埋め込みヌル文字を保持した追加後の文字列。
   * @ko 내장 널 문자를 유지하는 추가된 문자열입니다.
   */
  readString(count: number, initial = ''): string {
    if (typeof initial !== 'string') {
      throw new TypeError('Expected an initial stream string');
    }
    return initial + Buffer.from(this.read(count)).toString('utf8');
  }

  /**
   * Invoke Rml::Stream::Write using UTF-8, bytes or another stream.
   *
   * @zh 使用 UTF-8、字节或另一流调用 Rml::Stream::Write。
   * @ja UTF-8、バイト列、別のストリームで Rml::Stream::Write を呼びます。
   * @ko UTF-8, 바이트 또는 다른 스트림으로 Rml::Stream::Write를 호출합니다.
   * @param input - Source; strings preserve embedded null characters.
   * @zh input - 来源；字符串保留内嵌空字符。
   * @ja input - 入力。文字列は埋め込みヌル文字を保持します。
   * @ko input - 원본이며 문자열은 내장 널 문자를 유지합니다.
   * @param count - Optional byte limit; defaults to input or remaining size.
   * @zh count - 可选字节上限，默认为输入大小或剩余大小。
   * @ja count - 任意のバイト上限。既定は入力サイズまたは残りサイズです。
   * @ko count - 선택 바이트 상한이며 기본값은 입력 크기 또는 남은 크기입니다.
   * @returns Bytes written, or source bytes consumed when copying a stream.
   * @zh 写入字节数；复制流时为消耗的来源字节数。
   * @ja 書き込みバイト数。ストリームコピーでは元から消費したバイト数。
   * @ko 쓴 바이트 수이며 스트림 복사에서는 소비한 원본 바이트 수입니다.
   */
  write(input: string | Uint8Array | Stream, count?: number): number {
    return native.streamWrite(
      streamHandle(this), input instanceof Stream ? streamHandle(input) :
        input, count, 0);
  }

  /**
   * Invoke the native C-string write semantics, stopping at the first null.
   *
   * @zh 使用原生 C 字符串写入语义，在首个空字符处停止。
   * @ja 最初のヌルで停止するネイティブ C 文字列の書き込みです。
   * @ko 첫 널에서 멈추는 네이티브 C 문자열 쓰기입니다.
   * @param input - UTF-8 text.
   * @zh input - UTF-8 文本。
   * @ja input - UTF-8 テキスト。
   * @ko input - UTF-8 텍스트입니다.
   * @returns Bytes written before the first null.
   * @zh 首个空字符前写入的字节数。
   * @ja 最初のヌルまでに書き込んだバイト数。
   * @ko 첫 널 앞에 쓴 바이트 수입니다.
   */
  writeCString(input: string): number {
    if (typeof input !== 'string') {
      throw new TypeError('Expected C-string text');
    }
    return native.streamWrite(streamHandle(this), input, undefined, 3);
  }

  /**
   * Invoke Rml::Stream::Truncate; memory cursors move to the new end.
   *
   * @zh 调用 Rml::Stream::Truncate；内存游标移动到新末尾。
   * @ja Rml::Stream::Truncate。メモリの位置は新しい末尾になります。
   * @ko Rml::Stream::Truncate이며 메모리 커서는 새 끝으로 이동합니다.
   * @param length - Requested byte length; larger memory lengths do nothing.
   * @zh length - 请求字节长度；大于现有内存长度时不作修改。
   * @ja length - 要求バイト長。現在のメモリ長より大きい場合は変更しません。
   * @ko length - 요청 바이트 길이이며 메모리 길이보다 크면 수정하지 않습니다.
   * @returns Number of bytes removed.
   * @zh 删除字节数。
   * @ja 削除したバイト数。
   * @ko 제거한 바이트 수입니다.
   */
  truncate(length: number): number {
    return native.streamResize(streamHandle(this), length, 0, undefined);
  }

  /**
   * Invoke Rml::Stream::PushFront; memory cursors advance with the insertion.
   *
   * @zh 调用 Rml::Stream::PushFront；内存游标随插入推进。
   * @ja Rml::Stream::PushFront。メモリ位置も挿入量だけ進みます。
   * @ko Rml::Stream::PushFront이며 메모리 커서도 삽입량만큼 이동합니다.
   * @param input - UTF-8 text or bytes to prepend.
   * @zh input - 待前插的 UTF-8 文本或字节。
   * @ja input - 先頭に挿入する UTF-8 テキストまたはバイト列。
   * @ko input - 앞에 삽입할 UTF-8 텍스트 또는 바이트입니다.
   * @returns Number of bytes prepended.
   * @zh 前插字节数。
   * @ja 先頭に挿入したバイト数。
   * @ko 앞에 삽입한 바이트 수입니다.
   */
  pushFront(input: string | Uint8Array): number {
    return native.streamWrite(streamHandle(this), input, undefined, 1);
  }

  /**
   * Invoke Rml::Stream::PushBack and restore the previous cursor.
   *
   * @zh 调用 Rml::Stream::PushBack 并恢复先前游标。
   * @ja Rml::Stream::PushBack を呼び、元の位置を復元します。
   * @ko Rml::Stream::PushBack을 호출하고 이전 커서를 복원합니다.
   * @param input - UTF-8 text or bytes to append.
   * @zh input - 待追加的 UTF-8 文本或字节。
   * @ja input - 追記する UTF-8 テキストまたはバイト列。
   * @ko input - 추가할 UTF-8 텍스트 또는 바이트입니다.
   * @returns Number of bytes appended.
   * @zh 追加字节数。
   * @ja 追記したバイト数。
   * @ko 추가한 바이트 수입니다.
   */
  pushBack(input: string | Uint8Array): number {
    return native.streamWrite(streamHandle(this), input, undefined, 2);
  }

  /**
   * Remove front bytes; oversized counts clamp to the stream length.
   *
   * @zh 删除头部字节；过大计数限制为流长度。
   * @ja 先頭バイトを削除。大きすぎる数はストリーム長に制限します。
   * @ko 앞쪽 바이트를 제거하며 과도한 수는 스트림 길이로 제한합니다.
   * @param count - Maximum bytes to remove.
   * @zh count - 最大删除字节数。
   * @ja count - 最大削除バイト数。
   * @ko count - 최대 제거 바이트 수입니다.
   * @returns Actual bytes removed; memory cursors move back and clamp at zero.
   * @zh 实际删除数；内存游标回退并限制在零及以上。
   * @ja 実際の削除数。メモリ位置は戻り、0 未満にはなりません。
   * @ko 실제 제거 수이며 메모리 커서는 뒤로 이동하고 0 이상으로 제한됩니다.
   */
  popFront(count: number): number {
    return native.streamResize(streamHandle(this), count, 1, undefined);
  }

  /**
   * Invoke safe Rml::Stream::PopBack with a length-clamped count.
   *
   * @zh 使用长度限制的计数安全调用 Rml::Stream::PopBack。
   * @ja 数を長さに制限して安全に Rml::Stream::PopBack を呼びます。
   * @ko 수를 길이로 제한해 안전하게 Rml::Stream::PopBack을 호출합니다.
   * @param count - Maximum bytes to remove.
   * @zh count - 最大删除字节数。
   * @ja count - 最大削除バイト数。
   * @ko count - 최대 제거 바이트 수입니다.
   * @returns Actual bytes removed.
   * @zh 实际删除字节数。
   * @ja 実際に削除したバイト数。
   * @ko 실제 제거한 바이트 수입니다.
   */
  popBack(count: number): number {
    return native.streamResize(streamHandle(this), count, 2, undefined);
  }
}

/**
 * Rml::StreamMemory backed by native-owned bytes.
 *
 * @zh 由原生持有字节的 Rml::StreamMemory。
 * @ja ネイティブ所有のバイト領域を持つ Rml::StreamMemory。
 * @ko 네이티브 소유 바이트를 사용하는 Rml::StreamMemory입니다.
 */
export class StreamMemory extends Stream {
  /**
   * Construct a writable empty stream or an immutable snapshot of a view.
   *
   * @zh 构造可写空流或视图的不可变快照。
   * @ja 書き込み可能な空ストリームか、不変のビューコピーを構築します。
   * @ko 쓰기 가능한 빈 스트림 또는 뷰의 불변 사본을 생성합니다.
   * @param initial - Initial capacity or read-only bytes; defaults to 256.
   * @zh initial - 初始容量或只读字节，默认容量为 256。
   * @ja initial - 初期容量または読み取り専用バイト。既定容量は 256 です。
   * @ko initial - 초기 용량 또는 읽기 전용 바이트이며 기본 용량은 256입니다.
   */
  constructor(initial?: number | Uint8Array) {
    super(nativeConstruction);
    handles.set(this, native.createStreamMemory(initial));
  }

  /**
   * Copy Rml::StreamMemory::RawStream into independent storage.
   *
   * @zh 将 Rml::StreamMemory::RawStream 复制到独立存储。
   * @ja Rml::StreamMemory::RawStream を独立領域にコピーします。
   * @ko Rml::StreamMemory::RawStream을 독립 저장소로 복사합니다.
   * @returns All used bytes; unaffected by reallocations or shutdown.
   * @zh 全部已用字节；不受重新分配或 shutdown 影响。
   * @ja 使用中の全バイト。再割り当てや shutdown の影響を受けません。
   * @ko 모든 사용 바이트이며 재할당이나 shutdown에 영향을 받지 않습니다.
   */
  rawStream(): Uint8Array {
    return native.streamRaw(streamHandle(this));
  }

  /**
   * Erase bytes and clamp the existing cursor to the new length.
   *
   * @zh 删除字节并将现有游标限制到新长度。
   * @ja バイトを削除し、現在位置を新しい長さ以内に制限します。
   * @ko 바이트를 제거하고 기존 커서를 새 길이 안으로 제한합니다.
   * @param offset - Start in [0, length].
   * @zh offset - [0, length] 范围内的起点。
   * @ja offset - [0, length] 内の開始位置。
   * @ko offset - [0, length] 범위의 시작 위치입니다.
   * @param count - Maximum bytes to remove.
   * @zh count - 最大删除字节数。
   * @ja count - 最大削除バイト数。
   * @ko count - 최대 제거 바이트 수입니다.
   */
  erase(offset: number, count: number): void {
    native.streamResize(streamHandle(this), count, 3, offset);
  }

  /**
   * Set Rml::StreamMemory::SetSourceURL and its native Read/Write mode.
   *
   * @zh 调用 Rml::StreamMemory::SetSourceURL 并设置原生 Read/Write 模式。
   * @ja Rml::StreamMemory::SetSourceURL と Read/Write モードを設定します。
   * @ko Rml::StreamMemory::SetSourceURL과 Read/Write 모드를 설정합니다.
   * @param sourceUrl - Relative resource origin; embedded nulls are rejected.
   * @zh sourceUrl - 相对资源来源；拒绝内嵌空字符。
   * @ja sourceUrl - 相対リソースの参照元。埋め込みヌルは禁止です。
   * @ko sourceUrl - 상대 리소스 원본이며 내장 널은 거부됩니다.
   */
  setSourceURL(sourceUrl: string): void {
    native.streamSetSourceURL(streamHandle(this), sourceUrl);
  }
}

/**
 * Read-only Rml::StreamFile using the installed RmlUi file interface.
 *
 * @zh 使用已安装 RmlUi 文件接口的只读 Rml::StreamFile。
 * @ja インストールした RmlUi ファイル API を使う読み取り専用 StreamFile。
 * @ko 설치된 RmlUi 파일 인터페이스를 쓰는 읽기 전용 Rml::StreamFile입니다.
 * @remarks
 * Close before shutdown is automatic. After close, read/seek/tell require
 * reopening. Memory modification operations always throw.
 * @zh shutdown 前自动关闭。close 后须重新打开才能 read、seek 和 tell。
 * 内存修改操作始终抛出异常。
 * @ja shutdown 前に自動で閉じます。close 後の read、seek、tell には
 * 再度 open が必要です。メモリ変更操作は常に例外です。
 * @ko shutdown 전에 자동으로 닫힙니다. close 후 read, seek, tell을
 * 사용하려면 다시 열어야 합니다. 메모리 수정 작업은 항상 예외입니다.
 */
export class StreamFile extends Stream {
  /**
   * Construct an unopened Rml::StreamFile.
   *
   * @zh 构造尚未打开的 Rml::StreamFile。
   * @ja 未オープンの Rml::StreamFile を構築します。
   * @ko 아직 열지 않은 Rml::StreamFile을 생성합니다.
   */
  constructor() {
    super(nativeConstruction);
    handles.set(this, native.createStreamFile());
  }

  /**
   * Open a file, first releasing any previous native file handle.
   *
   * @zh 打开文件，先释放之前的原生文件句柄。
   * @ja 以前のネイティブハンドルを閉じてからファイルを開きます。
   * @ko 이전 네이티브 파일 핸들을 해제한 후 파일을 엽니다.
   * @param path - File-interface path; embedded nulls are rejected.
   * @zh path - 文件接口路径；拒绝内嵌空字符。
   * @ja path - ファイル API のパス。埋め込みヌルは禁止です。
   * @ko path - 파일 인터페이스 경로이며 내장 널은 거부됩니다.
   * @returns Native open result.
   * @zh 原生打开结果。
   * @ja ネイティブのオープン結果。
   * @ko 네이티브 열기 결과입니다.
   */
  open(path: string): boolean {
    return native.streamOpen(streamHandle(this), path);
  }
}

/**
 * Resolve a checked stream wrapper.
 *
 * @internal
 * @param stream - Public stream.
 * @returns Native stream owner.
 */
export function streamHandle(stream: Stream): object {
  const handle = handles.get(stream);
  if (!handle) {
    throw new TypeError('Expected a RmlUi stream');
  }
  return handle;
}
