import { Time, milliseconds } from './time';
import type { ReadonlyValue } from '../internal/value-storage';

/**
 * Called once per check period; return true to keep waiting or false to stop.
 * @zh 每个检查周期调用一次；返回 true 继续等待，false 结束等待。
 * @ja チェック周期ごとに 1 回呼ばれる。true で待機を続け、false で終了する。
 * @ko 확인 주기마다 한 번 호출된다. true를 반환하면 대기 지속, false면 종료한다.
 */
export type TimeoutPredicate = () => boolean;

const stop: TimeoutPredicate = () => false;

/**
 * Timeout configuration; the consuming operation performs waits and checks.
 * @zh 超时配置；使用此配置的操作负责等待和检查。
 * @ja タイムアウト設定。これを使う操作が待機とチェックを行う。
 * @ko 시간 제한 설정. 이 설정을 사용하는 작업이 대기와 확인을 수행한다.
 */
export class TimeoutWithPredicate {
  private readonly predicate: TimeoutPredicate;
  private readonly period: ReadonlyValue<Time>;

  /**
   * Create a fixed timeout configuration, copying the duration of timeout.
   * @zh 创建固定超时配置，复制 timeout 的时长。
   * @ja timeout の時間長をコピーし、固定タイムアウト設定を作成する。
   * @ko timeout의 시간 길이를 복사하여 고정 시간 제한 설정을 생성한다.
   */
  constructor(timeout: ReadonlyValue<Time>);
  /**
   * Create a periodic check configuration; period defaults to 1 millisecond,
   * and null ends the wait on the first check.
   * @zh 创建周期检查配置；period 默认 1 毫秒，null 表示首次检查即结束等待。
   * @ja 定期チェック設定を作成する。period の既定値は 1 ミリ秒。
   * null は最初のチェックで待機を終了する。
   * @ko 주기적 확인 설정을 생성한다. period 기본값은 1밀리초이며
   * null이면 첫 확인에서 대기를 종료한다.
   */
  constructor(predicate: TimeoutPredicate | null, period?: ReadonlyValue<Time>);
  /**
   * Copy the configuration, retaining the same predicate and copying the
   * check period.
   * @zh 复制配置，保留同一个谓词函数并复制检查周期。
   * @ja 同じ述語関数を保持し、チェック周期をコピーして設定を複製する。
   * @ko 동일한 술어 함수를 유지하고 확인 주기를 복사하여 설정을 복제한다.
   */
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

  /**
   * Return the predicate that decides whether to keep waiting.
   * @zh 返回决定是否继续等待的谓词函数。
   * @ja 待機を続けるかどうかを決める述語関数を返す。
   * @ko 대기 지속 여부를 결정하는 술어 함수를 반환한다.
   */
  getPredicate(): TimeoutPredicate {
    return this.predicate;
  }

  /**
   * Return the read-only check period, or the timeout duration for a fixed
   * timeout configuration.
   * @zh 返回只读的检查周期；固定超时配置返回其超时时长。
   * @ja 読み取り専用のチェック周期を返す。固定タイムアウト設定では
   * タイムアウトの時間長を返す。
   * @ko 읽기 전용 확인 주기를 반환한다. 고정 시간 제한 설정은 제한 시간을 반환한다.
   */
  getPeriod(): ReadonlyValue<Time> {
    return this.period;
  }
}
