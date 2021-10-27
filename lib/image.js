'use strict';

const { Image: _Image } = require('../build/Release/binding.node');

class Image extends _Image {
}

Image.setRealConstructor(Image);

module.exports = { Image };
