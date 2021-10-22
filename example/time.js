'use strict';

const { Time: { microseconds, milliseconds, seconds } } = require('../lib/sfml');
const { Time } = require('../lib/sfml');

console.log(seconds(101213).asSeconds());
console.log(milliseconds(101212241).asMilliseconds());
console.log(microseconds(101212241).asMicroseconds());
console.log(microseconds(101212241).asSeconds());
console.log(milliseconds(101212241).asSeconds());
console.log(Time.zero);
