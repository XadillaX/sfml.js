'use strict';

const {
  joystickIsConnected: _isConnected,
  joystickGetButtonCount: _getButtonCount,
  joystickHasAxis: _hasAxis,
  joystickIsJoystickButtonPressed: _isButtonPressed,
  joystickGetAxisPosition: _getAxisPosition,
  joystickGetIdentification: _getIdentification,
  joystickUpdate: update,
  joystickAxis: Axis,
} = require('../build/Release/binding.node');

const AxisValues = Object.values(Axis);

const validateJoystickId = joystickId => {
  if (!Number.isInteger(joystickId) || Math.sign(joystickId) < 0) {
    throw new TypeError(
      `Unexpected value ${joystickId} for joystickId, expected usigned integer.`
    );
  }
};

const validateButton = button => {
  if (!Number.isInteger(button) || Math.sign(button) < 0) {
    throw new TypeError(
      `Unexpected value ${button} for button, expected usigned integer.`
    );
  }
};

const validateAxis = axis => {
  if (!AxisValues.includes(axis)) {
    throw new TypeError('Invalid Axis value.');
  }
};

module.exports.isConnected = joystickId => {
  validateJoystickId(joystickId);
  return _isConnected(joystickId);
};

module.exports.getButtonCount = joystickId => {
  validateJoystickId(joystickId);
  return _getButtonCount(joystickId);
};

module.exports.hasAxis = (joystickId, axis) => {
  validateJoystickId(joystickId);
  validateAxis(axis);
  return _hasAxis(joystickId, axis);
};

module.exports.isButtonPressed = (joystickId, button) => {
  validateJoystickId(joystickId);
  validateButton(button);
  return _isButtonPressed(joystickId, button);
};

module.exports.getAxisPosition = (joystickId, axis) => {
  validateJoystickId(joystickId);
  validateAxis(axis);
  return _getAxisPosition(joystickId, axis);
};

module.exports.getIdentification = joystickId => {
  validateJoystickId(joystickId);
  return _getIdentification(joystickId);
};

module.exports.update = update;
module.exports.Axis = Axis;
