'use strict';

const { Joystick } = require('../..');

Joystick.update();
console.log(Joystick.isConnected(0));
console.log(Joystick.getIdentification(0));
console.log(Joystick.getButtonCount(0));
Joystick.update();
const axes = Object.entries(Joystick.Axis)
  .filter(([ , axis ]) => typeof axis === 'number');
console.log(Object.fromEntries(axes.map(
  ([ key, axis ]) => [ key, Joystick.hasAxis(0, axis) ])));
console.log(Object.fromEntries(axes.map(
  ([ key, axis ]) => [ key, Joystick.getAxisPosition(0, axis) ])));
