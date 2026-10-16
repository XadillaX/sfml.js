import { EventEmitter } from 'node:events';
import { Time } from '../system/time';
import type { ReadonlyValue } from '../internal/value-storage';

export type NetworkTime = ReadonlyValue<Time>;
export function millisecondsOf(time: NetworkTime): number {
  if (!(time instanceof Time)) throw new TypeError('Expected a Time');
  const value = time.asMicroseconds();
  if (value < 0n) throw new RangeError('Timeout must be non-negative');
  return value === 0n ? 0 : Math.max(1, Number(value / 1000n));
}
export function uint(value: number, max = 0xffffffff): number {
  if (!Number.isInteger(value) || value < 0 || value > max) {
    throw new RangeError(`Expected an integer from 0 to ${max}`);
  }
  return value;
}
export function bytes(value: Uint8Array): Buffer {
  if (!(value instanceof Uint8Array)) throw new TypeError('Expected bytes');
  return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
}
export class SerialQueue {
  /** 当前队列末尾的 Promise，用于链式排期。 */
  private tail = Promise.resolve();
  run<T>(action: () => Promise<T>): Promise<T> {
    const next = this.tail.then(action);
    this.tail = next.then(() => {}, () => {});
    return next;
  }
}
/** Register before checking state so no event can be lost between both steps. */
export function waitFor(events: EventEmitter, check: () => boolean,
  timeout = 0, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | undefined;
    function finish(value: boolean, error?: unknown) {
      events.off('change', inspect);
      signal?.removeEventListener('abort', abort);
      if (timer) clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    }
    function inspect() {
      try { if (check()) finish(true); } catch (error) { finish(false, error); }
    }
    function abort() { finish(false); }
    events.on('change', inspect);
    signal?.addEventListener('abort', abort, { once: true });
    if (timeout) timer = setTimeout(() => finish(false), timeout);
    if (signal?.aborted) abort();
    else inspect();
  });
}
