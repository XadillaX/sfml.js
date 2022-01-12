'use strict';

const {
  touchGetPosition: _getPosition,
  touchIsDown: isDown,
} = require('../build/Release/binding.node');
const { RenderWindow } = require('./render_window');

exports.isDown = isDown;

exports.getPosition = function getPosition(finger, window) {
  if (arguments.length === 1) {
    return _getPosition(finger);
  }

  if (!(window instanceof RenderWindow)) {
    throw new TypeError('Parameter is not a RenderWindow instance.');
  }

  return _getPosition(finger, window[RenderWindow.RAW_RENDER_WINDOW]);
};
