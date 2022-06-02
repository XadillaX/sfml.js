declare module '*/binding.node' {
  export class Clock {
    constructor();
    getElapsedTime(): Time;
    restart(): Time;
  }
}
