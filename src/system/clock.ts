import { hrtime } from 'node:process';
import { Time } from './time';
import { type ReadonlyValue } from '../internal/value-storage';

/** A pausable monotonic stopwatch, with no native SFML handle. */
export class Clock {
  private reference: bigint;
  private stopped: bigint | undefined;

  /** 创建立即开始计时的时钟，或复制 source 当前的计时起点和暂停状态。 */
  constructor(source?: ReadonlyValue<Clock>) {
    if (source !== undefined) {
      if (!(source instanceof Clock)) throw new TypeError('Expected a Clock');
      this.reference = source.reference;
      this.stopped = source.stopped;
    } else {
      this.reference = hrtime.bigint();
    }
  }

  /** 返回累计运行时长，不计入通过 stop() 暂停的时间。 */
  getElapsedTime(): Time {
    return new Time(((this.stopped ?? hrtime.bigint()) - this.reference) / 1000n);
  }

  /** 返回时钟是否正在计时。 */
  isRunning(): boolean {
    return this.stopped === undefined;
  }

  /** 恢复计时，保留累计时长；已运行时无操作。 */
  start(this: Clock): void {
    if (this.stopped !== undefined) {
      this.reference += hrtime.bigint() - this.stopped;
      this.stopped = undefined;
    }
  }

  /** 暂停计时，保留累计时长。 */
  stop(this: Clock): void {
    if (this.stopped === undefined) this.stopped = hrtime.bigint();
  }

  /** 清零并开始计时，返回清零前的累计运行时长。 */
  restart(this: Clock): Time {
    return this.resetAt(true);
  }

  /** 清零并暂停计时，返回清零前的累计运行时长。 */
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
