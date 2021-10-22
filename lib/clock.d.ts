import { _Time } from './time';

declare class Clock {
  constructor();

  getElapsedTime(): _Time;
  restart(): void;
}

export = Clock;
