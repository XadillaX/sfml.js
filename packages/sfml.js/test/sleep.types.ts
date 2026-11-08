import { sleep, Time, milliseconds } from '..';

const pending: Promise<void> = sleep(milliseconds(16));
const readonlyDuration: Promise<void> = sleep(Time.Zero);

// @ts-expect-error durations use Time, not bare milliseconds
sleep(16);
// @ts-expect-error durations use Time, not bare microseconds
sleep(16000n);
// @ts-expect-error a duration is required
sleep();
// @ts-expect-error sleep is asynchronous
const synchronous: void = sleep(Time.Zero);

void [ pending, readonlyDuration, synchronous ];
