import {
  TimeoutWithPredicate, type TimeoutPredicate, SuspendAwareClock,
  Time, milliseconds, type ReadonlyValue, addAssign,
} from '..';

const predicate: TimeoutPredicate = () => true;
const duration = new TimeoutWithPredicate(Time.Zero);
const defaults = new TimeoutWithPredicate(predicate);
const timed = new TimeoutWithPredicate(predicate, milliseconds(5));
const empty = new TimeoutWithPredicate(null);
const emptyTimed = new TimeoutWithPredicate(null, Time.Zero);
const readonly: Readonly<TimeoutWithPredicate> = timed;
const copy = new TimeoutWithPredicate(readonly);
const callback: TimeoutPredicate = readonly.getPredicate();
const period: ReadonlyValue<Time> = readonly.getPeriod();
const result: boolean = callback();
const mutable = new Time(period);
addAssign(mutable, milliseconds(1));
const now: bigint = SuspendAwareClock.now();
const steady: true = SuspendAwareClock.is_steady;

// @ts-expect-error A duration or predicate is required.
new TimeoutWithPredicate();
// @ts-expect-error A timeout duration must be a Time.
new TimeoutWithPredicate(1n);
// @ts-expect-error A duration constructor does not accept a period.
new TimeoutWithPredicate(Time.Zero, Time.Zero);
// @ts-expect-error A copy constructor does not accept a period.
new TimeoutWithPredicate(copy, Time.Zero);
// @ts-expect-error The predicate returns boolean.
new TimeoutWithPredicate(() => 1);
// @ts-expect-error A predicate is synchronous.
new TimeoutWithPredicate(async () => true);
// @ts-expect-error The period must be a Time.
new TimeoutWithPredicate(predicate, 1);
// @ts-expect-error A const period cannot be mutated.
addAssign(period, milliseconds(1));
// @ts-expect-error Clock timestamps are nanosecond bigints.
const badTime: Time = SuspendAwareClock.now();
// @ts-expect-error The steady clock trait is readonly.
SuspendAwareClock.is_steady = true;

export {
  duration, defaults, timed, empty, emptyTimed, copy, callback, period,
  result, mutable, now, steady, badTime,
};
