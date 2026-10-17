import { Writable } from 'node:stream';
import { native } from '../internal/native';

let stream: Writable | undefined;
let listening = false;

function drainBeforeExit(): void {
  native.flushErrorOutput();
}

/**
 * A singleton Writable whose bytes are written to the actual SFML stream.
 * @zh 单例 Writable，其字节写入实际的 SFML 流。
 * @ja 書き込んだバイトが実際の SFML ストリームに渡されるシングルトン Writable。
 * @ko 바이트가 실제 SFML 스트림에 기록되는 싱글턴 Writable.
 */
export function err(): Writable {
  stream ??= new Writable({
    write(chunk: Buffer, _encoding, complete) {
      try {
        native.writeError(chunk);
      } catch (error) {
        complete(error as Error);
        return;
      }
      complete();
    },
  });
  return stream;
}

/**
 * Process-wide SFML output: Writable redirects, null mutes, undefined resets.
 * @zh 进程级 SFML 输出：Writable 重定向，null 静默，undefined 重置。
 * @ja プロセス全体の SFML 出力。Writable で転送、null で抑止、
 * undefined でリセットする。
 * @ko 프로세스 전체 SFML 출력. Writable은 리디렉션, null은 출력 차단,
 * undefined는 초기화한다.
 */
export function setErrorOutput(target?: Writable | null): void {
  if (target !== undefined && target !== null) {
    if (!(target instanceof Writable) || target === stream) {
      throw new TypeError('Expected a Writable other than err()');
    }
    if (target.destroyed || target.writableEnded) {
      throw new TypeError('Expected an open Writable');
    }
    // Native retains this destination until all bytes captured for it drain.
    // Buffers can split UTF-8 sequences; consumers decode them as a byte stream.
    native.setErrorOutput((bytes: Buffer) => { target.write(bytes); });
    if (!listening) {
      process.on('beforeExit', drainBeforeExit);
      listening = true;
    }
  } else {
    native.setErrorOutput(target);
  }
}
