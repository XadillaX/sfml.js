'use strict';

const { Joystick } = require('../lib/sfml');

Joystick.update();
console.log(Joystick.isConnected(0));
console.log(Joystick.getIdentification(0));
console.log(Joystick.getButtonCount(0));
console.log(Object.fromEntries(Object.entries(Joystick.Axis).map(
  ([ key, axis ]) => ([ key, Joystick.hasAxis(0, axis) ]))));
console.log(Object.fromEntries(Object.entries(Joystick.Axis).map(
  ([ key, axis ]) => ([ key, Joystick.getAxisPosition(0, axis) ]))));
