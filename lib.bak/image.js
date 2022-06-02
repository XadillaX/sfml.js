'use strict';

const fs = require('fs');
const path = require('path');

const { Color } = require('./color');
const { IntRect } = require('./rect');
const { Image: _Image } = require('../build/Release/binding.node');
const { createDeferred, validateTypeOf } = require('./common');

class Image extends _Image {
  copy(src, destX, destY, sourceRect, applyAlpha) {
    validateTypeOf(src, 'src', _Image);
    validateTypeOf(destX, 'destX', 'number');
    validateTypeOf(destY, 'destY', 'number');
    validateTypeOf(
      sourceRect,
      'sourceRectOrApplyAlpha',
      [ 'boolean', IntRect ],
      true);
    validateTypeOf(applyAlpha, 'applyAlpha', 'boolean', true);

    if (sourceRect === undefined && applyAlpha === undefined) {
      return super.copy(src, destX, destY);
    }

    if (applyAlpha === undefined) {
      return super.copy(src, destX, destY, sourceRect);
    }

    super.copy(src, destX, destY, sourceRect, applyAlpha);
  }

  create(width, height, colorOrPixels) {
    validateTypeOf(width, 'width', 'number');
    validateTypeOf(height, 'height', 'number');
    validateTypeOf(colorOrPixels, 'colorOrPixels', [
      Color,
      Buffer,
      Array,
      ArrayBuffer,
      Uint8Array,
      'number',
    ]);

    if (typeof colorOrPixels === 'number') {
      colorOrPixels = new Color(colorOrPixels);
    }

    if (width < 0 || height < 0) {
      throw new RangeError('`width` and `height` should >= 0.');
    }

    width = parseInt(width);
    height = parseInt(height);

    super.create(width, height, colorOrPixels);
  }

  createMaskFromColor(color, alpha) {
    if (typeof color === 'number') {
      color = new Color(color);
    }

    validateTypeOf(color, 'color', Color);
    validateTypeOf(alpha, 'alpha', 'number', true);
    if (alpha < 0 || alpha > 255) {
      throw new RangeError('`alpha` should between 0 and 255.');
    }
    alpha = parseInt(alpha);
    super.createMaskFromColor(color, alpha);
  }

  setPixel(x, y, color) {
    if (typeof color === 'number') {
      color = new Color(color);
    }

    validateTypeOf(x, 'x', 'number');
    validateTypeOf(y, 'y', 'number');

    if (x < 0 || y < 0) {
      throw new RangeError('`x` and `y` should >= 0.');
    }

    x = parseInt(x);
    y = parseInt(y);
    super.setPixel(x, y, color);
  }

  getPixel(x, y) {
    validateTypeOf(x, 'x', 'number');
    validateTypeOf(y, 'y', 'number');

    if (x < 0 || y < 0) {
      throw new RangeError('`x` and `y` should >= 0.');
    }

    x = parseInt(x);
    y = parseInt(y);

    return new Color(super.getPixel(x, y));
  }

  loadFromMemory(buff) {
    validateTypeOf(buff, 'buff', Buffer);
    return super.loadFromMemory(buff);
  }

  // TODO(XadillaX): streamify
  async loadFromFile(filename) {
    filename = path.resolve(process.cwd(), filename);
    const buff = await fs.promises.readFile(filename);
    return super.loadFromMemory(buff);
  }

  loadFromFileSync(filename) {
    filename = path.resolve(process.cwd(), filename);
    const buff = fs.readFileSync(filename);
    return super.loadFromMemory(buff);
  }

  async saveToFile(filename) {
    const { promise, resolve, reject } = createDeferred();
    validateTypeOf(filename, 'filename', 'string');
    filename = path.resolve(process.cwd(), filename);
    const err = super.saveToFile(filename, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });

    if (err) {
      process.nextTick(() => {
        reject(err);
      });
    }

    return promise;
  }
}

Image.setRealConstructor((...args) => new Image(...args));

module.exports = { Image };
