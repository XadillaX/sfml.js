'use strict';

const {
  isKeyPressed: _isKeyPressed,
  setVirtualKeyboardVisible: _setVirtualKeyboardVisible,
  Keys,
} = require('../build/Release/binding.node');

exports.setVirtualKeyboardVisible = function setVirtualKeyboardVisible(visible) {
  _setVirtualKeyboardVisible(!!visible);
};

exports.isKeyPressed = _isKeyPressed;

exports.Keys = Keys;
