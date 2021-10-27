'use strict';

const { Color } = require('../color');
const { Drawable } = require('./drawable');
const { IntRect } = require('../rect');
const { setPluginPackageBound, setPluginPackageTexture } = require('./plugin_package');
const { setTransformable } = require('./transformable');
const { Texture } = require('../texture');
const { validateTypeOf } = require('../common');

class Sprite extends Drawable {
  constructor(texture, rectangle) {
    if (arguments.length === 0) {
      super('Sprite');
      this[setPluginPackageTexture.TEXTURE] = null;
    } else if (arguments.length === 1) {
      validateTypeOf(texture, 'texture', Texture);
      super('Sprite', texture);
      this[setPluginPackageTexture.TEXTURE] = texture;
    } else {
      validateTypeOf(texture, 'texture', Texture);
      validateTypeOf(rectangle, 'rectangle', IntRect);
      super('Sprite', texture, rectangle);
      this[setPluginPackageTexture.TEXTURE] = texture;
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
