'use strict';

const path = require('path');
const util = require('util');

const { Font: _Font } = require('../build/Release/binding.node');
const { validateTypeOf } = require('./common');

const GET_INFO = Symbol('Font::getInfo');

class Font extends _Font {
  [util.inspect.custom](depth, opts) {
    return `Font ${util.inspect({
      [GET_INFO]: this.getInfo(),
      ...this.toJSON(),
    }, opts)}`;
  }

  toJSON() {
    return {};
  }

  // TODO(XadillaX): asyncify
  loadFromFile(filename) {
    validateTypeOf(filename, 'filename', 'string');
    filename = path.resolve(process.cwd(), filename);
    return super.loadFromFile(filename);
  }

  getGlyph(codePoint, characterSize, bold, outlineThickness = 0) {
    validateTypeOf(codePoint, 'codePoint', 'number');
    validateTypeOf(characterSize, 'characterSize', 'number');
    validateTypeOf(bold, 'bold', 'boolean');
    validateTypeOf(outlineThickness, 'outlineThickness', 'number');

    if (codePoint < 0) {
      throw new RangeError('codePoint should not smaller than 0.');
    } else {
      codePoint = parseInt(codePoint);
    }

    if (characterSize < 0) {
      throw new RangeError('characterSize should not smaller than 0.');
    } else {
      characterSize = parseInt(characterSize);
    }

    return super.getGlyph(codePoint, characterSize, bold, outlineThickness);
  }

  getKerning(first, second, characterSize) {
    validateTypeOf(first, 'first', 'number');
    validateTypeOf(second, 'second', 'number');
    validateTypeOf(characterSize, 'characterSize', 'boolean');

    if (first < 0) {
      throw new RangeError('first should not smaller than 0.');
    } else {
      first = parseInt(first);
    }

    if (second < 0) {
      throw new RangeError('second should not smaller than 0.');
    } else {
      second = parseInt(second);
    }

    if (characterSize < 0) {
      throw new RangeError('characterSize should not smaller than 0.');
    } else {
      characterSize = parseInt(characterSize);
    }

    return super.getKerning(first, second, characterSize);
  }

  getLineSpacing(characterSize) {
    validateTypeOf(characterSize, 'characterSize', 'number');

    if (characterSize < 0) {
      throw new RangeError('characterSize should not smaller than 0.');
    } else {
      characterSize = parseInt(characterSize);
    }

    return super.getLineSpacing(characterSize);
  }

  getUnderlinePosition(characterSize) {
    validateTypeOf(characterSize, 'characterSize', 'number');

    if (characterSize < 0) {
      throw new RangeError('characterSize should not smaller than 0.');
    } else {
      characterSize = parseInt(characterSize);
    }

    return super.getUnderlinePosition(characterSize);
  }

  getUnderlineThickness(characterSize) {
    validateTypeOf(characterSize, 'characterSize', 'number');

    if (characterSize < 0) {
      throw new RangeError('characterSize should not smaller than 0.');
    } else {
      characterSize = parseInt(characterSize);
    }

    return super.getUnderlineThickness(characterSize);
  }
}

module.exports = Font;
