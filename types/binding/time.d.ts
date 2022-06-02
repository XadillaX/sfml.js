declare module '*/binding.node' {
  export type Second = number;
  export type Millisecond = number;
  export type Microsecond = BigInt;

  interface NewTimeTypeInterface {
    kSeconds: 0;
    kMilliseconds: 1;
    kMicroseconds: 2;
  }
  type NewTimeType = _RangeOf<0, 2>;

  export class Time {
    constructor();
    constructor(type: NewTimeType, val: BigInt | number);
    asSeconds(): Second;
    asMilliseconds(): Millisecond;
    asMicroseconds(): Microsecond;
    static NewTimeType: NewTimeTypeInterface;
  }
}
