import { Writable } from 'node:stream';
import { native } from '../internal/native';

let stream: Writable | undefined;
let listening = false;

function drainBeforeExit(): void {
  native.flushErrorOutput();
}

/** A singleton Writable whose bytes are written to the actual SFML stream. */
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

/** Process-wide SFML output: Writable redirects, null mutes, undefined resets. */
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
