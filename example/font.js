'use strict';

const path = require('path');

const { Font } = require('../lib/sfml');

const font = new Font();
console.log(font.loadFromFile('abcdefg'));
console.log(font);

console.log(font.loadFromFile(path.join(__dirname, 'font.ttf')));
console.log(font);

console.log(font.getGlyph(1, 10, false, 0));
console.log(font.getLineSpacing(10));
