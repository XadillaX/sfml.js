'use strict';

// Port of SFML/examples/sound_capture/SoundCapture.cpp; see ../README.md.
const { createInterface } = require('node:readline');
const { setTimeout: delay } = require('node:timers/promises');
const sf = require('../../..');

/** Select a capture device, record audio, then play it or save it. */
async function main() {
  if (!sf.SoundRecorder.isAvailable()) {
    console.log('Sorry, audio capture is not supported by your system');
    return;
  }

  const devices = sf.SoundRecorder.getAvailableDevices();
  console.log('Available capture devices:\n');
  devices.forEach((device, index) => console.log(`${index}: ${device}`));
  console.log();

  const input = createInterface({ input: process.stdin });
  const lines = input[Symbol.asyncIterator]();

  /**
   * Consume buffered lines and unwind recording when input ends.
   * @param {string} prompt - Console prompt.
   * @return {Promise<string>} Input line.
   */
  async function read(prompt) {
    process.stdout.write(prompt);
    const line = await lines.next();
    if (line.done) throw new Error('Input closed');
    return line.value;
  }

  const recorder = new sf.SoundBufferRecorder();
  try {
    let deviceIndex = 0;
    if (devices.length > 1) {
      do {
        deviceIndex = Number(await read(
          `Please choose the capture device to use [0-${devices.length - 1}]: `
        ));
      } while (!Number.isInteger(deviceIndex) ||
        deviceIndex < 0 || deviceIndex >= devices.length);
    }

    const sampleRate = Number(await read(
      'Please choose the sample rate for sound capture ' +
      '(44100 is CD quality): '
    ));
    await read('Press enter to start recording audio');

    if (!await recorder.setDevice(devices[deviceIndex])) {
      throw new Error('Failed to set the capture device');
    }
    if (!await recorder.start(sampleRate)) {
      throw new Error('Failed to start recorder');
    }

    await read('Recording... press enter to stop');
    await recorder.stop();

    const buffer = recorder.getBuffer();
    console.log('Sound information:\n' +
      ` ${buffer.getDuration().asSeconds()} seconds\n` +
      ` ${buffer.getSampleRate()} samples / seconds\n` +
      ` ${buffer.getChannelCount()} channels`);

    const choice = await read(
      'What do you want to do with captured sound (p = play, s = save) ? '
    );
    if (choice === 's') {
      const filename = await read('Choose the file to create: ');
      if (!await buffer.saveToFile(filename)) {
        console.error('Could not save sound buffer to file');
      }
    } else {
      const sound = new sf.Sound(buffer);
      sound.play();
      while (sound.getStatus() === sf.Sound.Status.Playing) {
        process.stdout.write(
          `\rPlaying... ${sound.getPlayingOffset().asSeconds()} sec        `
        );
        await delay(100);
      }
    }

    console.log('\nDone!');
    process.stdout.write('Press enter to exit...\n');
    await lines.next();
  } finally {
    try {
      await recorder.stop();
    } finally {
      input.close();
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
