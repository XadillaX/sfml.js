'use strict';

const {
  touchGetPosition: _getPosition,
  touchIsDown: _isDown,
} = require('../build/Release/binding.node');
const { RenderWindow } = require('./render_window');

const validateFinger = finger => {
  if (!Number.isInteger(finger) || Math.sign(finger) < 0) {
    throw new TypeError(
      `Unexpected value ${finger} for finger, expected usigned integer.`
    );
  }
};

exports.isDown = finger => {
  validateFinger(finger);
  return _isDown(finger);
};

exports.getPosition = function getPosition(finger, window) {
  validateFinger(finger);

  if (arguments.length === 1) {
    return _getPosition(finger);
  }

  if (!(window instanceof RenderWindow)) {
    throw new TypeError('Parameter is not a RenderWindow instance.');
  }

  return _getPosition(finger, window[RenderWindow.RAW_RENDER_WINDOW]);
};
