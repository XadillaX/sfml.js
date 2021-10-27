'use strict';

const { Color } = require('../color');
const { IntRect } = require('../rect');
const { Texture } = require('../texture');
const { validateTypeOf } = require('../common');

const TEXTURE = Symbol('PluginPackageTexture::texture');

function setPluginPackageTexture(proto) {
  const ret = {
    setTexture(texture) {
      validateTypeOf(texture, 'texture', Texture);
      this._raw().setTexture(texture);
      this[TEXTURE] = texture;
    },

    getTexture() {
      return this[TEXTURE] || null;
    },

    setTextureRect(rect) {
      validateTypeOf(rect, 'rect', IntRect);
      this._raw().setTextureRect(rect);
    },

    getTextureRect() {
      return this._raw().getTextureRect();
    },
  };

  for (const key in ret) {
    if (!ret.hasOwnProperty(key)) continue;
    proto[key] = ret[key];
  }
}
setPluginPackageTexture.TEXTURE = TEXTURE;

function setPluginPackageBound(proto) {
  const ret = {
    getLocalBounds() {
      return this._raw().getLocalBounds();
    },

    getGlobalBounds() {
      return this._raw().getGlobalBounds();
    },
  };

  for (const key in ret) {
    if (!ret.hasOwnProperty(key)) continue;
    proto[key] = ret[key];
  }
}

function setPluginPackageColorAndThickness(proto) {
  const ret = {
    setFillColor(color) {
      if (!(color instanceof Color)) {
        color = new Color(color);
      }

      this._raw().setFillColor(color);
    },

    getFillColor() {
      return this._raw().getFillColor();
    },

    setOutlineColor(color) {
      if (!(color instanceof Color)) {
        color = new Color(color);
      }

      this._raw().setOutlineColor(color);
    },

    getOutlineColor() {
      return this._raw().getOutlineColor();
    },

    setOutlineThickness(thickness) {
      validateTypeOf(thickness, 'thickness', 'number');
      this._raw().setOutlineThickness(thickness);
    },

    getOutlineThickness() {
      return this._raw().getOutlineThickness();
    },
  };

  for (const key in ret) {
    if (!ret.hasOwnProperty(key)) continue;
    proto[key] = ret[key];
  }
}

module.exports = {
  setPluginPackageTexture,
  setPluginPackageBound,
  setPluginPackageColorAndThickness,
};
