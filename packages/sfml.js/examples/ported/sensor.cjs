'use strict';

const { Sensor } = require('../..');
const types = Object.entries(Sensor.Type)
  .filter(([ , type ]) => typeof type === 'number');
console.log(Object.fromEntries(types.map(
  ([ k, v ]) => [ k, Sensor.isAvailable(v) ])));

types.forEach(([ , type ]) => Sensor.setEnabled(type, true));
console.log(Object.fromEntries(types.map(
  ([ k, v ]) => [ k, Sensor.getValue(v) ])));
