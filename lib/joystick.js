'use strict';

const {
  isConnected,
  getButtonCount,
  hasAxis,
  isButtonPressed,
  getAxisPosition,
  getIdentification,
  Axis,
} = require('../build/Release/binding.node');

module.exports.isConnected = isConnected;
module.exports.getButtonCount = getButtonCount;
module.exports.hasAxis = hasAxis;
module.exports.isButtonPressed = isButtonPressed;
module.exports.getAxisPosition = getAxisPosition;
module.exports.getIdentificatio = getIdentification;
module.exports.Axis = Axis;
