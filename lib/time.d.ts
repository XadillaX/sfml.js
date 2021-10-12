class Time {
  asSeconds(): number;
  asMilliseconds(): number;
  asMicroseconds(): BigInt;
}

export function seconds(val: number | BigInt): Time;
export function milliseconds(val: number | BigInt): Time;
export function microseconds(val: number | BigInt): Time;

export const zero = new Time();

export { Time as _Time };
