'use strict';

const Drawable = require('./drawable');
const Font = require('../font');
const {
  setPluginPackageBound,
  setPluginPackageColorAndThickness,
} = require('./plugin_package');
const { setTransformable } = require('./transformable');
const { validateTypeOf } = require('../common');

const FONT = Symbol('Text::font');

class Text extends Drawable {
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
    this._raw().setString(`${str}`);
  }

  setFont(font) {
    validateTypeOf(font, 'font', Font);
    this._raw().setFont(font);
    this[FONT] = font;
  }

  setCharacterSize(size) {
    validateTypeOf(size, 'size', 'number');

    if (size < 0) {
      throw new RangeError('`size` should greater than 0.');
    }

    size = parseInt(size);
    this._raw().setCharacterSize(size);
  }

  setLineSpacing(spacing) {
    validateTypeOf(spacing, 'spacing', 'number');
    this._raw().setLineSpacing(spacing);
  }

  setLetterSpacing(spacing) {
    validateTypeOf(spacing, 'spacing', 'number');
    this._raw().setLetterSpacing(spacing);
  }

  setStyle(style) {
    validateTypeOf(style, 'style', 'number');

    if (style < 0) {
      throw new RangeError('`style` should greater than 0.');
    }

    style = parseInt(style);
    this._raw().setStyle(style);
  }
}

setPluginPackageBound(Text.prototype);
setPluginPackageColorAndThickness(Text.prototype);
setTransformable(Text.prototype);

Text.Style = require('../../build/Release/binding.node').Text.Style;

module.exports = Text;
