'use strict';

const {
  setVirtualKeyboardVisible: _setVirtualKeyboardVisible,
  isKeyPressed: _isKeyPressed,
} = require('../build/Release/binding.node');

exports.setVirtualKeyboardVisible = function setVirtualKeyboardVisible(visible) {
  _setVirtualKeyboardVisible(!!visible);
};

exports.isKeyPressed = _isKeyPressed;
