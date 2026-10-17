/**
 * undefined reports an I/O failure; throws and rejected promises reject
 * loading.
 * @zh undefined 表示 I/O 失败；抛出异常或返回被拒绝的 Promise
 * 会使加载操作的 Promise 被拒绝。
 * @ja undefined は I/O 失敗を示す。例外のスローや拒否された Promise の返却により、
 * 読み込み操作の Promise も拒否される。
 * @ko undefined는 I/O 실패를 나타낸다. 예외를 던지거나 거부된 Promise를 반환하면
 * 로드 작업의 Promise도 거부된다.
 */
export type StreamResult = bigint | undefined | Promise<bigint | undefined>;

/**
 * Seekable input. Each operation may complete synchronously or asynchronously.
 * @zh 可寻址的输入。每项操作均可同步或异步完成。
 * @ja シーク可能な入力。各操作は同期または非同期で完了できる。
 * @ko 탐색 가능한 입력. 각 작업은 동기 또는 비동기로 완료될 수 있다.
 */
export abstract class InputStream {
  /**
   * Fill data and advance the cursor; return the count, or 0n at EOF.
   * @zh 填充 data 并推进游标；返回读取数量，流末尾返回 0n。
   * @ja data に読み込んでカーソルを進める。読み込み数を返し、EOF では 0n を返す。
   * @ko data를 채우고 커서를 이동한다. 읽은 수를 반환하며 EOF에서는 0n을 반환한다.
   */
  abstract read(data: Uint8Array): StreamResult;
  /**
   * Seek to a byte position from the stream's start and return the actual
   * position; return undefined on failure.
   * @zh 移动到从流起点计算的字节位置，返回实际位置；失败返回 undefined。
   * @ja ストリーム先頭からのバイト位置へ移動し、実際の位置を返す。
   * 失敗時は undefined を返す。
   * @ko 스트림 시작점 기준 바이트 위치로 이동하고 실제 위치를 반환한다.
   * 실패 시 undefined를 반환한다.
   */
  abstract seek(position: bigint): StreamResult;
  /**
   * Return the current byte position, or undefined on failure.
   * @zh 返回当前字节位置；失败返回 undefined。
   * @ja 現在のバイト位置を返す。失敗時は undefined を返す。
   * @ko 현재 바이트 위치를 반환한다. 실패 시 undefined를 반환한다.
   */
  abstract tell(): StreamResult;
  /**
   * Return the stream's total byte count, or undefined on failure.
   * @zh 返回流的总字节数；失败返回 undefined。
   * @ja ストリームの総バイト数を返す。失敗時は undefined を返す。
   * @ko 스트림의 총 바이트 수를 반환한다. 실패 시 undefined를 반환한다.
   */
  abstract getSize(): StreamResult;
}

/**
 * Retains the supplied bytes without copying them.
 * @zh 保留所提供的字节，不进行复制。
 * @ja 渡されたバイト列をコピーせずに保持する。
 * @ko 제공된 바이트를 복사하지 않고 유지한다.
 */
export class MemoryInputStream extends InputStream {
  private data?: Uint8Array;
  private position = 0;

  /**
   * Create a memory stream; retain data by reference if supplied, so reads
   * observe subsequent byte modifications.
   * @zh 创建内存流；提供 data 时保留其引用，读取可见后续字节修改。
   * @ja メモリストリームを作成する。data があれば参照を保持し、
   * 以降のバイト変更は読み取りに反映される。
   * @ko 메모리 스트림을 생성한다. data가 주어지면 참조를 유지하므로
   * 이후의 바이트 변경이 읽기에 반영된다.
   */
  constructor(data?: Uint8Array) {
    super();
    if (data !== undefined) this.open(data);
  }

  /**
   * Retain data by reference and reset the read position to zero without
   * copying bytes.
   * @zh 保留 data 的引用并将读取位置重置为零，不复制字节。
   * @ja バイト列をコピーせずに data の参照を保持し、読み取り位置をゼロに戻す。
   * @ko 바이트를 복사하지 않고 data의 참조를 유지하며 읽기 위치를 0으로 초기화한다.
   */
  open(data: Uint8Array): void {
    if (!(data instanceof Uint8Array)) {
      throw new TypeError('Expected a Uint8Array');
    }
    this.data = data;
    this.position = 0;
  }

  /**
   * Read into destination and advance the position; return the byte count,
   * 0n at the end of the stream, or undefined if not open.
   * @zh 读取到 destination 并推进位置，返回字节数；流末尾返回 0n，
   * 未打开返回 undefined。
   * @ja destination に読み込んで位置を進め、バイト数を返す。
   * ストリーム末尾では 0n、未オープン時は undefined を返す。
   * @ko destination으로 읽고 위치를 이동한 뒤 바이트 수를 반환한다.
   * 스트림 끝에서는 0n, 열리지 않은 경우 undefined를 반환한다.
   */
  read(destination: Uint8Array): bigint | undefined {
    if (!this.data) return undefined;
    const count = Math.min(destination.length,
      this.data.length - this.position);
    destination.set(this.data.subarray(this.position, this.position + count));
    this.position += count;
    return BigInt(count);
  }

  /**
   * Set a non-negative byte position, clamped to the end of the stream;
   * return the actual position, or undefined if not open.
   * @zh 设置非负字节位置，超出长度时停在流末尾；返回实际位置，
   * 未打开返回 undefined。
   * @ja 非負のバイト位置を設定し、長さを超えた場合はストリーム末尾に留める。
   * 実際の位置を返す。未オープン時は undefined を返す。
   * @ko 음이 아닌 바이트 위치를 설정하며 길이를 초과하면 스트림 끝에 멈춘다.
   * 실제 위치를 반환하고 열리지 않은 경우 undefined를 반환한다.
   */
  seek(position: bigint): bigint | undefined {
    if (typeof position !== 'bigint' || position < 0n) {
      throw new RangeError('Expected a non-negative bigint position');
    }
    if (!this.data) return undefined;
    this.position = Number(position > BigInt(this.data.length)
      ? BigInt(this.data.length) : position);
    return BigInt(this.position);
  }

  /**
   * Return the current byte position, or undefined if not open.
   * @zh 返回当前字节位置；未打开返回 undefined。
   * @ja 現在のバイト位置を返す。未オープン時は undefined を返す。
   * @ko 현재 바이트 위치를 반환한다. 열리지 않은 경우 undefined를 반환한다.
   */
  tell(): bigint | undefined {
    return this.data ? BigInt(this.position) : undefined;
  }

  /**
   * Return the byte length of the memory data, or undefined if not open.
   * @zh 返回内存数据的字节长度；未打开返回 undefined。
   * @ja メモリデータのバイト長を返す。未オープン時は undefined を返す。
   * @ko 메모리 데이터의 바이트 길이를 반환한다. 열리지 않으면 undefined를 반환한다.
   */
  getSize(): bigint | undefined {
    return this.data ? BigInt(this.data.length) : undefined;
  }
}
