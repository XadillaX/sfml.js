/** undefined reports an I/O failure; throws and rejected promises reject loading. */
export type StreamResult = bigint | undefined | Promise<bigint | undefined>;

/** Seekable input. Each operation may complete synchronously or asynchronously. */
export abstract class InputStream {
  /** Fill data and advance the cursor; return the count, or 0n at EOF. */
  abstract read(data: Uint8Array): StreamResult;
  /** 移动到从流起点计算的字节位置，返回实际位置；失败返回 undefined。 */
  abstract seek(position: bigint): StreamResult;
  /** 返回当前字节位置；失败返回 undefined。 */
  abstract tell(): StreamResult;
  /** 返回流的总字节数；失败返回 undefined。 */
  abstract getSize(): StreamResult;
}

/** Retains the supplied bytes without copying them. */
export class MemoryInputStream extends InputStream {
  private data?: Uint8Array;
  private position = 0;

  /** 创建内存流；提供 data 时保留其引用，读取可见后续字节修改。 */
  constructor(data?: Uint8Array) {
    super();
    if (data !== undefined) this.open(data);
  }

  /** 保留 data 的引用并将读取位置重置为零，不复制字节。 */
  open(data: Uint8Array): void {
    if (!(data instanceof Uint8Array)) {
      throw new TypeError('Expected a Uint8Array');
    }
    this.data = data;
    this.position = 0;
  }

  /** 读取到 destination 并推进位置，返回字节数；流末尾返回 0n，未打开返回 undefined。 */
  read(destination: Uint8Array): bigint | undefined {
    if (!this.data) return undefined;
    const count = Math.min(destination.length,
      this.data.length - this.position);
    destination.set(this.data.subarray(this.position, this.position + count));
    this.position += count;
    return BigInt(count);
  }

  /** 设置非负字节位置，超出长度时停在流末尾；返回实际位置，未打开返回 undefined。 */
  seek(position: bigint): bigint | undefined {
    if (typeof position !== 'bigint' || position < 0n) {
      throw new RangeError('Expected a non-negative bigint position');
    }
    if (!this.data) return undefined;
    this.position = Number(position > BigInt(this.data.length)
      ? BigInt(this.data.length) : position);
    return BigInt(this.position);
  }

  /** 返回当前字节位置；未打开返回 undefined。 */
  tell(): bigint | undefined {
    return this.data ? BigInt(this.position) : undefined;
  }

  /** 返回内存数据的字节长度；未打开返回 undefined。 */
  getSize(): bigint | undefined {
    return this.data ? BigInt(this.data.length) : undefined;
  }
}
