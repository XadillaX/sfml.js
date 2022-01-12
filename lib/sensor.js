'use strict';

const {
  sensorIsAvailable: isAvailable,
  sensorSetEnabled: setEnabled,
  sensorGetValue: getValue,
  SensorType: Type,
} = require('../build/Release/binding.node');

module.exports.isAvailable = isAvailable;
module.exports.setEnabled = setEnabled;
module.exports.getValue = getValue;
module.exports.Type = Type;
