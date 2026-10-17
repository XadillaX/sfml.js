import { read } from 'node:fs';
import { open, type FileHandle } from 'node:fs/promises';
import { resolve } from 'node:path';
import { InputStream } from './input-stream';

/**
 * Seekable asynchronous file input that reads directly into caller buffers.
 * @zh 可寻址的异步文件输入，直接读取到调用者的缓冲区。
 * @ja 呼び出し元のバッファへ直接読み込む、シーク可能な非同期ファイル入力。
 * @ko 호출자의 버퍼로 직접 읽는 탐색 가능한 비동기 파일 입력.
 */
export class FileInputStream extends InputStream {
  private file?: FileHandle;
  private position = 0;
  private pending: Promise<void> = Promise.resolve();

  /**
   * Replaces the current file; an I/O failure leaves the stream closed.
   * @zh 替换当前文件；I/O 失败时流保持关闭状态。
   * @ja 現在のファイルを置き換える。I/O 失敗時はストリームが閉じた状態になる。
   * @ko 현재 파일을 교체한다. I/O 실패 시 스트림은 닫힌 상태가 된다.
   */
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

  /**
   * Read asynchronously into data and advance the position; return the byte
   * count, 0n at EOF, or undefined on failure or if not open.
   * @zh 异步读取到 data 并推进位置；返回字节数，文件末尾为 0n，
   * 失败或未打开为 undefined。
   * @ja data へ非同期で読み込み、位置を進める。バイト数を返し、ファイル末尾では
   * 0n、失敗時または未オープン時は undefined を返す。
   * @ko data로 비동기 읽기 후 위치를 이동한다. 바이트 수를 반환하며 파일 끝에서는
   * 0n, 실패하거나 열리지 않은 경우 undefined를 반환한다.
   */
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

  /**
   * Set the absolute byte position (0 to 2^53−1) in operation order and
   * return the new position; return undefined if not open.
   * @zh 按顺序设置绝对字节位置（0～2^53−1），返回新位置；
   * 未打开返回 undefined。
   * @ja 操作順に絶対バイト位置（0～2^53−1）を設定して新しい位置を返す。
   * 未オープン時は undefined を返す。
   * @ko 작업 순서에 따라 절대 바이트 위치(0～2^53−1)를 설정하고 새 위치를 반환한다.
   * 열리지 않은 경우 undefined를 반환한다.
   */
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

  /**
   * Wait for earlier operations, then return the current byte position;
   * return undefined if not open.
   * @zh 等待之前的操作完成后返回当前字节位置；未打开返回 undefined。
   * @ja 先行する操作の完了を待ち、現在のバイト位置を返す。
   * 未オープン時は undefined を返す。
   * @ko 이전 작업이 완료되면 현재 바이트 위치를 반환한다.
   * 열리지 않은 경우 undefined를 반환한다.
   */
  tell(): Promise<bigint | undefined> {
    return this.enqueue(() =>
      (this.file ? BigInt(this.position) : undefined));
  }

  /**
   * Return the file's byte count asynchronously; return undefined on failure
   * or if not open.
   * @zh 异步返回文件字节数；失败或未打开返回 undefined。
   * @ja ファイルのバイト数を非同期で返す。失敗時や未オープン時は undefined。
   * @ko 파일의 바이트 수를 비동기로 반환한다. 실패하거나 열리지 않으면 undefined.
   */
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

  /**
   * Waits for earlier operations; repeated closes are harmless.
   * @zh 等待之前的操作完成；重复关闭无害。
   * @ja 先行する操作の完了を待つ。繰り返し閉じても問題ない。
   * @ko 이전 작업의 완료를 기다린다. 반복해서 닫아도 문제없다.
   */
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
