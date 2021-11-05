'use strict';

const path = require('path');

require('./vector2');
const { createDeferred, validateTypeOf } = require('./common');
const { IntRect } = require('./rect');
const { Texture: _Texture, Image } = require('../build/Release/binding.node');

class Texture extends _Texture {
  loadFromFileSync(filename, area) {
    validateTypeOf(filename, 'filename', 'string');
    validateTypeOf(area, 'area', IntRect, true);
    filename = path.resolve(process.cwd(), filename);
    return super.loadFromFileSync(filename, area);
  }

  async loadFromFile(filename, area) {
    const { promise, resolve, reject } = createDeferred();
    validateTypeOf(filename, 'filename', 'string');
    validateTypeOf(area, 'area', IntRect, true);
    filename = path.resolve(process.cwd(), filename);
    const err = super.loadFromFile(filename, area, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });

    if (err) {
      process.nextTick(() => { reject(err); });
    }

    return promise;
  }

  loadFromMemory(buff, area) {
    validateTypeOf(buff, 'buff', Buffer);
    validateTypeOf(area, 'area', IntRect, true);
    return super.loadFromMemory(buff, area);
  }

  create(x, y) {
    validateTypeOf(x, 'x', 'number');
    validateTypeOf(y, 'y', 'number');

    if (x < 0 || y < 0) {
      throw new RangeError('`x` and `y` should greater or equal to 0.');
    }

    super.create(x, y);
  }

  update() {
    if (arguments.length >= 1 && (arguments[0] instanceof Texture)) {
      this.updateByTexture(arguments[0], arguments[1], arguments[2]);
      return;
    }

    if (arguments.length >= 1 && (arguments[0] instanceof Image)) {
      this.updateByImage(arguments[0], arguments[1], arguments[2]);
      return;
    }
  }

  updateByImage(image, x, y) {
    validateTypeOf(image, 'image', Image);
    validateTypeOf(x, 'x', 'number', true);
    validateTypeOf(y, 'y', 'number', true);

    if (x === undefined || y === undefined) {
      return super.updateByImage(image);
    }

    if (x < 0 || y < 0) {
      throw new RangeError('`x` and `y` should greater or equal to 0.');
    }

    x = parseInt(x);
    y = parseInt(y);
    super.updateByImage(image, x, y);
  }

  updateByTexture(texture, x, y) {
    validateTypeOf(texture, 'texture', Texture);
    validateTypeOf(x, 'x', 'number', true);
    validateTypeOf(y, 'y', 'number', true);

    if (x === undefined || y === undefined) {
      return super.updateByTexture(texture);
    }

    if (x < 0 || y < 0) {
      throw new RangeError('`x` and `y` should greater or equal to 0.');
    }

    x = parseInt(x);
    y = parseInt(y);
    super.updateByTexture(texture, x, y);
  }

  setSmooth(smooth = true) {
    super.setSmooth(!!smooth);
  }
}

module.exports = { Texture };
