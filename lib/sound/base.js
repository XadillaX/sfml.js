'use strict';

const binding = require('../../build/Release/binding.node');
const { validateTypeOf } = require('../common');

const RAW = Symbol('SoundSource#raw');

const GET_VOLUME = Symbol('SoundSource::getVolume');
const GET_PITCH = Symbol('SoundSource::getPitch');
const GET_MIN_DISTANCE = Symbol('SoundSource::getMinDistance');
const GET_ATTENUATION = Symbol('SoundSource::getAttenuation');
const IS_RELATIVE_TO_LISTENER = Symbol('SoundSource::isRelativeToListener');
const GET_STATUS = Symbol('SoundSource::getStatus');

class SoundSource {
  toJSON() {
    return {
      [GET_VOLUME]: this.getVolume(),
      [GET_PITCH]: this.getPitch(),
      [GET_MIN_DISTANCE]: this.getMinDistance(),
      [GET_ATTENUATION]: this.getAttenuation(),
      [IS_RELATIVE_TO_LISTENER]: this.isRelativeToListener(),
      [GET_STATUS]: this.getStatus(),
    };
  }

  constructor(innerName, ...args) {
    this[RAW] = new binding[innerName](...args);
  }

  getStatus() {
    return this[RAW].getStatus();
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
SoundSource.Status = {
  Stopped: 0,
  Paused: 1,
  Playing: 2,
};

module.exports = SoundSource;
