'use strict';

// Port of SFML/examples/sound/Sound.cpp; see ../README.md.
const path = require('node:path');
const readline = require('node:readline/promises');
const { setTimeout: delay } = require('node:timers/promises');
const sf = require('../../..');

/** Load and play the original bird sound from a WAV buffer. */
async function playSound() {
  const buffer = new sf.SoundBuffer();
  if (!await buffer.loadFromFile(
    path.join(__dirname, 'resources/killdeer.wav')
  )) {
    throw new Error('Failed to load killdeer.wav');
  }

  console.log('killdeer.wav:\n' +
    ` ${buffer.getDuration().asSeconds()} seconds\n` +
    ` ${buffer.getSampleRate()} samples / sec\n` +
    ` ${buffer.getChannelCount()} channels`);

  const sound = new sf.Sound(buffer);
  sound.play();
  while (sound.getStatus() === sf.Sound.Status.Playing) {
    await delay(100);
    process.stdout.write(
      `\rPlaying... ${sound.getPlayingOffset().asSeconds()} sec        `
    );
  }

  console.log('\n');
}

/**
 * Stream one of the original OGG, FLAC or MP3 tracks.
 * @param {string} filename - Resource filename.
 */
async function playMusic(filename) {
  const music = new sf.Music();
  try {
    const resource = path.join(__dirname, 'resources', filename);
    if (!await music.openFromFile(resource)) {
      throw new Error(`Failed to open ${filename}`);
    }

    console.log(`${filename}:\n` +
      ` ${music.getDuration().asSeconds()} seconds\n` +
      ` ${music.getSampleRate()} samples / sec\n` +
      ` ${music.getChannelCount()} channels`);

    music.play();
    while (music.getStatus() === sf.Music.Status.Playing) {
      await delay(100);
      process.stdout.write(
        `\rPlaying... ${music.getPlayingOffset().asSeconds()} sec        `
      );
    }

    console.log('\n');
  } finally {
    await music.close();
  }
}

/** Play the four original files in sequence and wait for Enter. */
async function main() {
  await playSound();
  await playMusic('doodle_pop.ogg');
  await playMusic('ding.flac');
  await playMusic('ding.mp3');

  const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    await input.question('Press enter to exit...\n');
  } finally {
    input.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
