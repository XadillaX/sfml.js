'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { SoundBuffer } = require('../..');

async function main() {
  const sb = new SoundBuffer();
  if (!await sb.loadFromMemory(
    fs.readFileSync(path.join(__dirname, 'assets/game.wav')))) {
    throw new Error('Failed to load game.wav');
  }
  console.log('sb', sb);
  sb.saveToFile(path.join(os.tmpdir(), '.game.wav'))
    .then(async ok => {
      if (!ok) throw new Error('Failed to save .game.wav');
      console.log('saved');
      const sb3 = new SoundBuffer();
      if (!await sb3.loadFromMemory(
        fs.readFileSync(path.join(os.tmpdir(), '.game.wav')))) {
        throw new Error('Failed to load .game.wav');
      }
      console.log('sb3', sb3);
    })
    .catch(err => { console.error(err); });

  const sb2 = new SoundBuffer();
  sb2.loadFromSamples(sb.getSamples().slice(), sb.getChannelCount(),
    sb.getSampleRate(), sb.getChannelMap());
  console.log('sb2', sb2);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
