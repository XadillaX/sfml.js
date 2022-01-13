'use strict';

const {
  joystickIsConnected: isConnected,
  joystickGetButtonCount: getButtonCount,
  joystickHasAxis: hasAxis,
  joystickIsJoystickButtonPressed: isButtonPressed,
  joystickGetAxisPosition: getAxisPosition,
  joystickGetIdentification: getIdentification,
  joystickUpdate: update,
  joystickAxis: Axis,
} = require('../build/Release/binding.node');

module.exports.isConnected = isConnected;
module.exports.getButtonCount = getButtonCount;
module.exports.hasAxis = hasAxis;
module.exports.isButtonPressed = isButtonPressed;
module.exports.getAxisPosition = getAxisPosition;
module.exports.getIdentification = getIdentification;
module.exports.update = update;
module.exports.Axis = Axis;
