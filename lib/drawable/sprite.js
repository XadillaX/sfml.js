'use strict';

const Color = require('../color');
const CommonDrawable = require('./common_drawable');
const { IntRect } = require('../rect');
const { RAW } = require('./common_drawable');
const Texture = require('../texture');
const { validateTypeOf } = require('../common');

const TEXTURE = Symbol('Sprite::texture');

class Sprite extends CommonDrawable {
  constructor(texture, rectangle) {
    if (arguments.length === 0) {
      super('Sprite');
      this[TEXTURE] = null;
    } else if (arguments.length === 1) {
      validateTypeOf(texture, 'texture', Texture);
      super('Sprite', texture);
      this[TEXTURE] = texture;
    } else {
      validateTypeOf(texture, 'texture', Texture);
      validateTypeOf(rectangle, 'rectangle', IntRect);
      super('Sprite', texture, rectangle);
      this[TEXTURE] = texture;
    }

    delete this.setPointCount;
    delete this.setPoint;
  }

  setTexture(texture) {
    validateTypeOf(texture, 'texture', Texture);
    this[RAW].setTexture(texture);
    this[TEXTURE] = texture;
  }

  getTexture() {
    return this[RAW].getTexture();
  }

  setTextureRect(rect) {
    validateTypeOf(rect, 'rect', IntRect);
    this[RAW].setTextureRect(rect);
  }

  getTextureRect() {
    return this[RAW].getTextureRect();
  }

  setColor(color) {
    if (!(color instanceof Color)) {
      color = new Color(color);
    }

    this[RAW].setColor(color);
  }

  getColor() {
    return this[RAW].getColor();
  }
}

module.exports = Sprite;
