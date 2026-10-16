import { read } from 'node:fs';
import { open, type FileHandle } from 'node:fs/promises';
import { resolve } from 'node:path';
import { InputStream } from './input-stream';

/** Seekable asynchronous file input that reads directly into caller buffers. */
export class FileInputStream extends InputStream {
  private file?: FileHandle;
  private position = 0;
  private pending: Promise<void> = Promise.resolve();

  /** Replaces the current file; an I/O failure leaves the stream closed. */
  open(filename: string): Promise<boolean> {
    if (typeof filename !== 'string' || filename.includes('\0')) {
      throw new TypeError('Expected a file path without null bytes');
    }
    const path = resolve(filename);
    return this.enqueue(async () => {
      await this.closeFile();
      try {
        this.file = await open(path, 'r');
        return true;
      } catch {
        return false;
      }
    });
  }

  /** 异步读取到 data 并推进位置；返回字节数，文件末尾为 0n，失败或未打开为 undefined。 */
  read(data: Uint8Array): Promise<bigint | undefined> {
    if (!(data instanceof Uint8Array)) {
      throw new TypeError('Expected a Uint8Array');
    }
    return this.enqueue(() => {
      const file = this.file;
      if (!file) return undefined;
      if (!Number.isSafeInteger(this.position + data.byteLength)) {
        throw new RangeError('Read exceeds Node filesystem offset precision');
      }
      // FileHandle owns the fd; the queue retains it until this read finishes.
      return new Promise<bigint | undefined>(resolve => {
        read(file.fd, data, 0, data.byteLength, this.position,
          (error, bytesRead) => {
            if (error) return resolve(undefined);
            this.position += bytesRead;
            resolve(BigInt(bytesRead));
          });
      });
    });
  }

  /** 按顺序设置绝对字节位置（0～2^53−1），返回新位置；未打开返回 undefined。 */
  seek(position: bigint): Promise<bigint | undefined> {
    if (typeof position !== 'bigint' || position < 0n ||
        position > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new RangeError('Expected an offset from 0 to 2^53 - 1');
    }
    return this.enqueue(() => {
      if (!this.file) return undefined;
      this.position = Number(position);
      return position;
    });
  }

  /** 等待之前的操作完成后返回当前字节位置；未打开返回 undefined。 */
  tell(): Promise<bigint | undefined> {
    return this.enqueue(() =>
      (this.file ? BigInt(this.position) : undefined));
  }

  /** 异步返回文件字节数；失败或未打开返回 undefined。 */
  getSize(): Promise<bigint | undefined> {
    return this.enqueue(async () => {
      if (!this.file) return undefined;
      try {
        return (await this.file.stat({ bigint: true })).size;
      } catch {
        return undefined;
      }
    });
  }

  /** Waits for earlier operations; repeated closes are harmless. */
  close(): Promise<void> {
    return this.enqueue(() => this.closeFile());
  }

  private async closeFile(): Promise<void> {
    const file = this.file;
    this.file = undefined;
    this.position = 0;
    await file?.close();
  }

  private enqueue<T>(operation: () => T | Promise<T>): Promise<T> {
    const result = this.pending.then(operation);
    this.pending = result.then(() => {}, () => {});
    return result;
  }
}
