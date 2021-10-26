'use strict';

const binding = require('../../build/Release/binding.node');
const { validateTypeOf } = require('../common');

const RAW = Symbol('SoundSource#raw');

class SoundSource {
  constructor(innerName) {
    this[RAW] = new binding[innerName]();
  }

  play() {
    this[RAW].play();
  }

  pause() {
    this[RAW].pause();
  }

  stop() {
    this[RAW].stop();
  }

  setPitch(pitch) {
    validateTypeOf(pitch, 'pitch', 'number');
    this[RAW].setPitch(pitch);
  }

  getPitch() {
    return this[RAW].getPitch();
  }

  setVolume(volume) {
    validateTypeOf(volume, 'pitch', 'number');
    this[RAW].setVolume(volume);
  }

  getVolume() {
    return this[RAW].getVolume();
  }

  setMinDistance(distance) {
    validateTypeOf(distance, 'distance', 'number');
    this[RAW].setMinDistance(distance);
  }

  getMinDistance() {
    return this[RAW].getMinDistance();
  }

  setAttenuation(attenuation) {
    validateTypeOf(attenuation, 'attenuation', 'number');
    this[RAW].setAttenuation(attenuation);
  }

  getAttenuation() {
    return this[RAW].getAttenuation();
  }

  setRelativeToListener(relative) {
    validateTypeOf(relative, 'relative', 'boolean');
    this[RAW].setRelativeToListener(relative);
  }

  getRelativeToListener() {
    return this[RAW].getRelativeToListener();
  }

  isRelativeToListener() {
    return this[RAW].getRelativeToListener();
  }

  // DO NOT CALL THIS METHOD UNLESS YOU KNOW WHAT YOU ARE DOING!
  _raw() {
    return this[RAW];
  }
}

SoundSource.RAW = RAW;

module.exports = SoundSource;
