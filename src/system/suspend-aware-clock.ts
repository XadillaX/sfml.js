import { native } from '../internal/native';

/** SFML's Android clock, including time spent in system suspend. */
export class SuspendAwareClock {
  /** 时钟单调递增，不受系统墙上时间调整影响。 */
  static readonly is_steady = true;

  /** Nanoseconds since the native clock's epoch; unsupported elsewhere. */
  static now(): bigint {
    return native.suspendAwareClockNow();
  }
}
