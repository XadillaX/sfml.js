import { Time, milliseconds } from './time';
import type { ReadonlyValue } from '../internal/value-storage';

/** 每个检查周期调用一次；返回 true 继续等待，false 结束等待。 */
export type TimeoutPredicate = () => boolean;

const stop: TimeoutPredicate = () => false;

/** Timeout configuration; the consuming operation performs waits and checks. */
export class TimeoutWithPredicate {
  private readonly predicate: TimeoutPredicate;
  private readonly period: ReadonlyValue<Time>;

  /** 创建固定超时配置，复制 timeout 的时长。 */
  constructor(timeout: ReadonlyValue<Time>);
  /** 创建周期检查配置；period 默认 1 毫秒，null 表示首次检查即结束等待。 */
  constructor(predicate: TimeoutPredicate | null, period?: ReadonlyValue<Time>);
  /** 复制配置，保留同一个谓词函数并复制检查周期。 */
  constructor(source: Readonly<TimeoutWithPredicate>);
  constructor(
    source: ReadonlyValue<Time> | TimeoutPredicate | null |
    Readonly<TimeoutWithPredicate>, period?: ReadonlyValue<Time>,
  ) {
    if (source instanceof Time || source instanceof TimeoutWithPredicate) {
      if (period !== undefined) {
        throw new TypeError('A timeout or copy accepts only one argument');
      }
      this.predicate = source instanceof Time ? stop : source.predicate;
      this.period = Object.freeze(new Time(
        source instanceof Time ? source : source.period));
      return;
    }
    if (source !== null && typeof source !== 'function') {
      throw new TypeError('Expected a Time, predicate, null or TimeoutWithPredicate');
    }
    if (period !== undefined && !(period instanceof Time)) {
      throw new TypeError('Expected a Time period');
    }
    this.predicate = source ?? stop;
    this.period = Object.freeze(new Time(
      period === undefined ? milliseconds(1) : period));
  }

  /** 返回决定是否继续等待的谓词函数。 */
  getPredicate(): TimeoutPredicate {
    return this.predicate;
  }

  /** 返回只读的检查周期；固定超时配置返回其超时时长。 */
  getPeriod(): ReadonlyValue<Time> {
    return this.period;
  }
}
