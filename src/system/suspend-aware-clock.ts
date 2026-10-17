import { native } from '../internal/native';

/**
 * SFML's Android clock, including time spent in system suspend.
 * @zh SFML 的 Android 时钟，包含系统挂起期间的时间。
 * @ja システムのサスペンド時間も含める SFML の Android 時計。
 * @ko 시스템 일시 중단 시간도 포함하는 SFML의 Android 시계.
 */
export class SuspendAwareClock {
  /**
   * The clock is monotonic and unaffected by system wall-clock adjustments.
   * @zh 时钟单调递增，不受系统墙上时间调整影响。
   * @ja 時計は単調増加し、システムの実時刻の調整に影響されない。
   * @ko 시계는 단조 증가하며 시스템 실제 시각 조정의 영향을 받지 않는다.
   */
  static readonly is_steady = true;

  /**
   * Nanoseconds since the native clock's epoch; unsupported elsewhere.
   * @zh 自原生时钟纪元起的纳秒数；Android 以外的平台不支持。
   * @ja ネイティブ時計のエポックからのナノ秒数。Android 以外では非対応。
   * @ko 네이티브 시계의 기준 시점부터의 나노초 수. Android 외에서는 지원하지 않는다.
   */
  static now(): bigint {
    return native.suspendAwareClockNow();
  }
}
