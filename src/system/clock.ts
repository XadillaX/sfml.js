import { hrtime } from 'node:process';
import { Time } from './time';
import { type ReadonlyValue } from '../internal/value-storage';

/**
 * A pausable monotonic stopwatch, with no native SFML handle.
 * @zh 可暂停的单调秒表，不持有原生 SFML 句柄。
 * @ja 一時停止可能な単調ストップウォッチ。ネイティブ SFML ハンドルは持たない。
 * @ko 일시 정지 가능한 단조 스톱워치. 네이티브 SFML 핸들을 갖지 않는다.
 */
export class Clock {
  private reference: bigint;
  private stopped: bigint | undefined;

  /**
   * Create a clock that starts immediately, or copy source's current
   * starting point and paused state.
   * @zh 创建立即开始计时的时钟，或复制 source 当前的计时起点和暂停状态。
   * @ja 直ちに計測を開始する時計を作成するか、source の現在の計測開始点と
   * 一時停止状態をコピーする。
   * @ko 즉시 측정을 시작하는 시계를 생성하거나 source의 현재 측정 시작점과
   * 일시 정지 상태를 복사한다.
   */
  constructor(source?: ReadonlyValue<Clock>) {
    if (source !== undefined) {
      if (!(source instanceof Clock)) throw new TypeError('Expected a Clock');
      this.reference = source.reference;
      this.stopped = source.stopped;
    } else {
      this.reference = hrtime.bigint();
    }
  }

  /**
   * Return accumulated running time, excluding time paused with stop().
   * @zh 返回累计运行时长，不计入通过 stop() 暂停的时间。
   * @ja stop() による一時停止時間を除いた累積稼働時間を返す。
   * @ko stop()으로 일시 정지한 시간을 제외한 누적 실행 시간을 반환한다.
   */
  getElapsedTime(): Time {
    return new Time(((this.stopped ?? hrtime.bigint()) - this.reference) / 1000n);
  }

  /**
   * Return whether the clock is running.
   * @zh 返回时钟是否正在计时。
   * @ja 時計が計測中かどうかを返す。
   * @ko 시계가 측정 중인지 반환한다.
   */
  isRunning(): boolean {
    return this.stopped === undefined;
  }

  /**
   * Resume timing, preserving accumulated time; do nothing if already running.
   * @zh 恢复计时，保留累计时长；已运行时无操作。
   * @ja 累積時間を保持して計測を再開する。すでに計測中なら何もしない。
   * @ko 누적 시간을 유지하며 측정을 재개한다. 이미 실행 중이면 아무 작업도 안 한다.
   */
  start(this: Clock): void {
    if (this.stopped !== undefined) {
      this.reference += hrtime.bigint() - this.stopped;
      this.stopped = undefined;
    }
  }

  /**
   * Pause timing, preserving accumulated time.
   * @zh 暂停计时，保留累计时长。
   * @ja 累積時間を保持して計測を一時停止する。
   * @ko 누적 시간을 유지하며 측정을 일시 정지한다.
   */
  stop(this: Clock): void {
    if (this.stopped === undefined) this.stopped = hrtime.bigint();
  }

  /**
   * Clear and start timing, returning the previous accumulated running time.
   * @zh 清零并开始计时，返回清零前的累计运行时长。
   * @ja ゼロにして計測を開始し、リセット前の累積稼働時間を返す。
   * @ko 초기화 후 측정을 시작하고 초기화 전 누적 실행 시간을 반환한다.
   */
  restart(this: Clock): Time {
    return this.resetAt(true);
  }

  /**
   * Clear and pause timing, returning the previous accumulated running time.
   * @zh 清零并暂停计时，返回清零前的累计运行时长。
   * @ja ゼロにして計測を一時停止し、リセット前の累積稼働時間を返す。
   * @ko 초기화 후 측정을 일시 정지하고 초기화 전 누적 실행 시간을 반환한다.
   */
  reset(this: Clock): Time {
    return this.resetAt(false);
  }

  private resetAt(running: boolean): Time {
    const now = hrtime.bigint();
    const elapsed = new Time(((this.stopped ?? now) - this.reference) / 1000n);
    this.reference = now;
    this.stopped = running ? undefined : now;
    return elapsed;
  }
}
