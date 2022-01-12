'use strict';

const { Sensor } = require('../lib/sfml');
console.log(Object.fromEntries(Object.entries(Sensor.Type).map(
  ([ k, v ]) => ([ k, Sensor.isAvailable(v) ]))));

Object.values(Sensor.Type).forEach(type => Sensor.setEnabled(type, true));
console.log(Object.fromEntries(Object.entries(Sensor.Type).map(
  ([ k, v ]) => ([ k, Sensor.getValue(v) ]))));
