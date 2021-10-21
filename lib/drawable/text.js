'use strict';

const Font = require('../font');
const CommonDrawable = require('./common_drawable');
const { RAW } = require('./common_drawable');
const { validateTypeOf } = require('../common');

const FONT = Symbol('Text::font');

class Text extends CommonDrawable {
  constructor(string, font, characterSize = 30) {
    if (string === undefined) {
      super();

      this[FONT] = null;
    } else {
      validateTypeOf(string, 'string', 'string');
      validateTypeOf(font, 'font', Font);
      validateTypeOf(characterSize, 'characterSize', 'number');

      if (characterSize < 0) {
        throw new RangeError('`characterSize` should greater than 0.');
      }

      characterSize = parseInt(characterSize);

      super('Text', string, font, characterSize);
      this[FONT] = font;
    }

    delete this.setPointCount;
    delete this.setPoint;
  }

  setString(str) {
    this[RAW].setString(`${str}`);
  }

  setFont(font) {
    validateTypeOf(font, 'font', Font);
    this[RAW].setFont(font);
    this[FONT] = font;
  }

  setCharacterSize(size) {
    validateTypeOf(size, 'size', 'number');

    if (size < 0) {
      throw new RangeError('`size` should greater than 0.');
    }

    size = parseInt(size);
    this[RAW].setCharacterSize(size);
  }

  setLineSpacing(spacing) {
    validateTypeOf(spacing, 'spacing', 'number');
    this[RAW].setLineSpacing(spacing);
  }

  setLetterSpacing(spacing) {
    validateTypeOf(spacing, 'spacing', 'number');
    this[RAW].setLetterSpacing(spacing);
  }

  setStyle(style) {
    validateTypeOf(style, 'style', 'number');

    if (style < 0) {
      throw new RangeError('`style` should greater than 0.');
    }

    style = parseInt(style);
    this[RAW].setStyle(style);
  }
}

Text.Style = require('../../build/Release/binding.node').Text.Style;

module.exports = Text;
