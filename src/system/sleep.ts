import { setTimeout as delay } from 'node:timers/promises';
import type { ReadonlyValue } from '../internal/value-storage';
import { Time } from './time';

const maximumDelay = 2147483647n;

/**
 * Asynchronous wait; the calling thread remains available to the event loop.
 * @zh 异步等待；调用线程仍可用于事件循环。
 * @ja 非同期待機。呼び出しスレッドは引き続きイベントループで利用できる。
 * @ko 비동기 대기. 호출 스레드는 계속 이벤트 루프에서 사용할 수 있다.
 */
export async function sleep(duration: ReadonlyValue<Time>): Promise<void> {
  if (!(duration instanceof Time)) throw new TypeError('Expected a Time');
  const microseconds = duration.asMicroseconds();
  if (microseconds <= 0n) return;
  // Round positive fractions up to a millisecond. Snapshot before the await.
  let remaining = (microseconds + 999n) / 1000n;
  while (remaining > 0n) {
    // Node clamps an oversized timer to 1 ms; split long waits instead.
    const interval = remaining > maximumDelay ? maximumDelay : remaining;
    await delay(Number(interval));
    remaining -= interval;
  }
}
