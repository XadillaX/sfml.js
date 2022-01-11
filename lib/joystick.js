'use strict';

const {
  isConnected,
  getButtonCount,
  hasAxis,
  isJoystickButtonPressed,
  getAxisPosition,
  getIdentification,
  update,
  Axis,
} = require('../build/Release/binding.node');

module.exports.isConnected = isConnected;
module.exports.getButtonCount = getButtonCount;
module.exports.hasAxis = hasAxis;
module.exports.isButtonPressed = isJoystickButtonPressed;
module.exports.getAxisPosition = getAxisPosition;
module.exports.getIdentification = getIdentification;
module.exports.update = update;
module.exports.Axis = Axis;
