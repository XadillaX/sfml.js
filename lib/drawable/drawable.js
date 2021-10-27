'use strict';

const binding = require('../../build/Release/binding.node');

const RAW = Symbol('BaseDrawable#raw');

class Drawable {
  constructor(clzNameInBinding, ...args) {
    this[RAW] = new (binding[clzNameInBinding])(...args);
  }

  // DO NOT USE THIS FUNCTION UNLESS YOU KNOW WHAT YOU ARE DOING!
  _raw() {
    return this[RAW];
  }
}

module.exports = { Drawable };
