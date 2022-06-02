'use strict';

const { Color } = require('../color');
const { Drawable } = require('./drawable');
const { IntRect } = require('../rect');
const { setPluginPackageBound, setPluginPackageTexture } = require('./plugin_package');
const { setTransformable } = require('./transformable');
const { Texture } = require('../texture');
const { validateTypeOf } = require('../common');

class Sprite extends Drawable {
  constructor(textureOrSprite, rectangle) {
    if (arguments.length === 0) {
      super('Sprite');
      this[setPluginPackageTexture.TEXTURE] = null;
    } else if (arguments.length === 1) {
      validateTypeOf(textureOrSprite, 'textureOrSprite', [ Texture, Sprite ]);
      if (textureOrSprite instanceof Texture) {
        super('Sprite', textureOrSprite);
        this[setPluginPackageTexture.TEXTURE] = textureOrSprite;
      } else {
        super('Sprite', 'Sprite', textureOrSprite._raw());
        this[setPluginPackageTexture.TEXTURE] = this._raw().getTexture();
      }
    } else {
      validateTypeOf(textureOrSprite, 'texture', Texture);
      validateTypeOf(rectangle, 'rectangle', IntRect);
      super('Sprite', textureOrSprite, rectangle);
      this[setPluginPackageTexture.TEXTURE] = textureOrSprite;
    }

    delete this.setPointCount;
    delete this.setPoint;
  }

  setColor(color) {
    if (!(color instanceof Color)) {
      color = new Color(color);
    }

    this._raw().setColor(color);
  }

  getColor() {
    return this._raw().getColor();
  }
}

setPluginPackageBound(Sprite.prototype);
setPluginPackageTexture(Sprite.prototype);
setTransformable(Sprite.prototype);

module.exports = { Sprite };
