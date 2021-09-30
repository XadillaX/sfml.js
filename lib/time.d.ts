class Time {
  asSeconds(): number;
  asMilliseconds(): number;
  asMicroseconds(): BigInt;
}

function seconds(val: number | BigInt): Time;
function milliseconds(val: number | BigInt): Time;
function microseconds(val: number | BigInt): Time;

export = {
  seconds,
  milliseconds,
  microseconds,
};
