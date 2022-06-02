'use strict';

const util = require('util');

const { validateTypeOf } = require('./common');
const { VideoMode: _VideoMode } = require('../build/Release/binding.node');

const RAW_VIDEO_MODE = Symbol('VideoMode::rawVideoMode');
const IS_VALID = Symbol('VideoMode::isValid');

class VideoMode {
  static getDesktopMode() {
    return new VideoMode(_VideoMode.getDesktopMode());
  }

  static getFullscreenModes() {
    return _VideoMode.getFullscreenModes().map(mode => new VideoMode(mode));
  }

  [util.inspect.custom](depth, opts) {
    return `VideoMode ${util.inspect({
      [IS_VALID]: this.isValid(),
      ...this.toJSON(),
    }, opts)}`;
  }

  toJSON() {
    return {
      width: this.width,
      height: this.height,
      bitsPerPixel: this.bitsPerPixel,
    };
  }

  constructor(modeWidth, modeHeight, modeBitsPerPixel) {
    if (modeWidth instanceof _VideoMode) {
      this[RAW_VIDEO_MODE] = modeWidth;
      return;
    }

    validateTypeOf(modeWidth, 'modeWidth', 'number', true);
    validateTypeOf(modeHeight, 'modeHeight', 'number', true);
    validateTypeOf(modeBitsPerPixel, 'modeBitsPerPixel', 'number', true);

    if (modeWidth === undefined) {
      this[RAW_VIDEO_MODE] = new _VideoMode();
      return;
    } else if (modeHeight === undefined) {
      throw new Error(
        'modeHeight cannot be undefined while modeWidth is not undefined.');
    }

    if (modeBitsPerPixel === undefined) {
      this[RAW_VIDEO_MODE] = new _VideoMode(
        parseInt(modeWidth),
        parseInt(modeHeight));
    } else {
      this[RAW_VIDEO_MODE] = new _VideoMode(
        parseInt(modeWidth),
        parseInt(modeHeight),
        parseInt(modeBitsPerPixel));
    }
  }

  isValid() {
    return this[RAW_VIDEO_MODE].isValid();
  }

  get width() {
    return this[RAW_VIDEO_MODE].getProperty(_VideoMode.kWidth);
  }

  set width(val) {
    validateTypeOf(val, 'val', 'number');
    this[RAW_VIDEO_MODE].setProperty(_VideoMode.kWidth, parseInt(val));
  }

  get height() {
    return this[RAW_VIDEO_MODE].getProperty(_VideoMode.kHeight);
  }

  set height(val) {
    validateTypeOf(val, 'val', 'number');
    this[RAW_VIDEO_MODE].setProperty(_VideoMode.kHeight, parseInt(val));
  }

  get bitsPerPixel() {
    return this[RAW_VIDEO_MODE].getProperty(_VideoMode.kBitsPerPixel);
  }

  set bitsPerPixel(val) {
    validateTypeOf(val, 'val', 'number');
    this[RAW_VIDEO_MODE].setProperty(_VideoMode.kBitsPerPixel, parseInt(val));
  }
}

VideoMode.RAW_VIDEO_MODE = RAW_VIDEO_MODE;

module.exports = { VideoMode };
