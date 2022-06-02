'use strict';

const { Drawable } = require('./drawable');
const {
  setPluginPackageBound,
  setPluginPackageColorAndThickness,
  setPluginPackageTexture,
} = require('./plugin_package');
const { setTransformable } = require('./transformable');

class Shape extends Drawable {
  getPointCount() {
    return this._raw().getPointCount();
  }

  setPointCount() {
    throw new Error('Unimplemented.');
  }

  getPoint(idx) {
    return this._raw().getPoint(idx);
  }
}

setPluginPackageBound(Shape.prototype);
setPluginPackageColorAndThickness(Shape.prototype);
setPluginPackageTexture(Shape.prototype);
setTransformable(Shape.prototype);

module.exports = { Shape };
