'use strict';

const { Time, microseconds, milliseconds, seconds } = require('../..');

console.log(seconds(101213).asSeconds());
console.log(milliseconds(101212241).asMilliseconds());
console.log(microseconds(101212241n).asMicroseconds());
console.log(microseconds(101212241n).asSeconds());
console.log(milliseconds(101212241).asSeconds());
console.log(Time.Zero);
