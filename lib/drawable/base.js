'use strict';

const binding = require('../../build/Release/binding.node');

const RAW = Symbol('BaseDrawable#raw');

class BaseDrawable {
  constructor(clzNameInBinding, ...args) {
    this[RAW] = new (binding[clzNameInBinding])(...args);
  }
}

BaseDrawable.RAW = RAW;

module.exports = BaseDrawable;
