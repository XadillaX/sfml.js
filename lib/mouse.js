'use strict';

const {
  getPosition: _getPosition,
  setPosition: _setPosition,
  isButtonPressed: _isButtonPressed,
} = require('../build/Release/binding.node');
const RenderWindow = require('./render_window');
const { Vector2I } = require('./vector2');

exports.isButtonPressed = _isButtonPressed;

exports.getPosition = function getPosition(window) {
  if (!arguments.length) {
    return _getPosition();
  }

  if (!(window instanceof RenderWindow)) {
    throw new TypeError('Parameter is not a RenderWindow instance.');
  }

  return _getPosition(window[RenderWindow.RAW_RENDER_WINDOW]);
};

exports.setPosition = function setPosition(pos, window) {
  if (!(pos instanceof Vector2I)) {
    pos = new Vector2I(pos?.x, pos?.y);
  }

  if (arguments.length <= 1) {
    return _setPosition(pos);
  }

  if (!(window instanceof RenderWindow)) {
    throw new TypeError('`window` is not a RenderWindow instance.');
  }

  _setPosition(pos, window[RenderWindow.RAW_RENDER_WINDOW]);
};
