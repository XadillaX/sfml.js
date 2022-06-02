'use strict';

const {
  sensorIsAvailable: _isAvailable,
  sensorSetEnabled: _setEnabled,
  sensorGetValue: _getValue,
  sensorType: Type,
} = require('../build/Release/binding.node');

const SensorTypeValues = Object.values(Type);

const validateSensorType = sensor => {
  if (!SensorTypeValues.includes(sensor)) {
    throw new TypeError('Invalid Sensor::Type value.');
  }
};

module.exports.isAvailable = sensor => {
  validateSensorType(sensor);
  return _isAvailable(sensor);
};

module.exports.setEnabled = (sensor, enabled) => {
  validateSensorType(sensor);
  _setEnabled(sensor, !!enabled);

};

module.exports.getValue = sensor => {
  validateSensorType(sensor);
  return _getValue(sensor);
};

module.exports.Type = Type;
