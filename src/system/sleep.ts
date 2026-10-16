import { setTimeout as delay } from 'node:timers/promises';
import type { ReadonlyValue } from '../internal/value-storage';
import { Time } from './time';

const maximumDelay = 2147483647n;

/** Asynchronous wait; the calling thread remains available to the event loop. */
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
