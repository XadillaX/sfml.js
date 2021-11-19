'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { SoundBuffer } = require('../lib/sound/sound_buffer');

const sb = new SoundBuffer();
sb.loadFromMemory(fs.readFileSync(path.join(__dirname, './game.wav')));
console.log('sb', sb);
sb.saveToFile(path.join(os.tmpdir(), '.game.wav'))
  .then(() => {
    console.log('saved');

    const sb3 = new SoundBuffer(
      fs.readFileSync(path.join(os.tmpdir(), '.game.wav')));
    console.log('sb3', sb3);
  })
  .catch(err => {
    console.error(err);
  });

const sb2 = new SoundBuffer();
sb2.loadFromSamples(
  sb.duplicateSamples(),
  sb.getChannelCount(),
  sb.getSampleRate());
console.log('sb2', sb2);
