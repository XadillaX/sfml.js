'use strict';

// Port of SFML/examples/sound_device/SoundDevice.cpp; see ../README.md.
const path = require('node:path');
const { createInterface } = require('node:readline');
const { setTimeout: delay } = require('node:timers/promises');
const sf = require('../../..');

/** Print the current playback route and whether it follows the default. */
function outputDeviceInfo() {
  const device = sf.PlaybackDevice.getDevice();
  if (device !== undefined) {
    console.log('Playback device set to: ' + device);
  }
  if (sf.PlaybackDevice.isDefaultDevice()) {
    console.log('Playback device is default device');
  }
}

/** Demonstrate automatic routing and manual recovery after device loss. */
async function main() {
  const devices = sf.PlaybackDevice.getAvailableDevices();
  if (devices.length === 0) {
    throw new Error('No playback devices available');
  }

  console.log('Available playback devices:\n');
  devices.forEach((device, index) => console.log(`${index}: ${device}`));
  const defaultDevice = sf.PlaybackDevice.getDefaultDevice();
  if (defaultDevice !== undefined) {
    console.log('\nDefault device: ' + defaultDevice);
  }
  console.log();

  const input = createInterface({ input: process.stdin });
  const lines = input[Symbol.asyncIterator]();

  /**
   * Consume buffered console answers and report EOF during configuration.
   * @param {string} prompt - Console prompt.
   * @return {Promise<string>} Input line.
   */
  async function read(prompt) {
    process.stdout.write(prompt);
    const line = await lines.next();
    if (line.done) throw new Error('Input closed');
    return line.value;
  }

  let deviceIndex = 0;
  let automaticStreamRouting = false;
  let rerouteToNull = false;
  try {
    if (devices.length > 1) {
      do {
        deviceIndex = Number(await read(
          `Please choose the playback device to use [0-${devices.length - 1}]: `
        ));
      } while (!Number.isInteger(deviceIndex) ||
        deviceIndex < 0 || deviceIndex >= devices.length);
    }

    if (devices[deviceIndex] === defaultDevice) {
      let answer;
      do {
        answer = (await read(
          'Activate automatic stream routing? (Y/N): '
        )).toUpperCase();
      } while (answer !== 'Y' && answer !== 'N');
      automaticStreamRouting = answer === 'Y';
    }

    if (!automaticStreamRouting) {
      let answer;
      do {
        answer = (await read(
          'On device loss, reroute to default or null device? (D/N): '
        )).toUpperCase();
      } while (answer !== 'D' && answer !== 'N');
      rerouteToNull = answer === 'N';
    }
  } finally {
    input.close();
  }

  const selectedDevice = devices[deviceIndex];
  const selected = automaticStreamRouting
    ? sf.PlaybackDevice.setDeviceToDefault()
    : sf.PlaybackDevice.setDevice(selectedDevice);
  if (!selected) {
    throw new Error('Failed to set the playback device');
  }

  let rerouteRequired = false;
  let wake;

  /** Wake the main loop when the notification callback requests rerouting. */
  function waitForReroute() {
    return new Promise(resolve => {
      const timer = setTimeout(resolve, 60 * 60 * 1000);
      wake = () => {
        clearTimeout(timer);
        resolve();
      };
    });
  }

  sf.PlaybackDevice.setNotificationCallback(notification => {
    const notices = sf.PlaybackDevice.Notification;
    switch (notification) {
      case notices.DeviceStarted:
        console.log('Device started');
        break;
      case notices.DeviceStopped:
        console.log('Device stopped');
        if (!automaticStreamRouting) {
          rerouteRequired = true;
          if (wake) {
            wake();
          }
        }
        break;
      case notices.DeviceRerouted:
        console.log('Device rerouted');
        break;
      case notices.DeviceInterruptionBegan:
        console.log('Device interruption began');
        break;
      case notices.DeviceInterruptionEnded:
        console.log('Device interruption ended');
        break;
      case notices.DeviceUnlocked:
        console.log('Device unlocked');
        break;
      default:
        break;
    }
  });

  const music = new sf.Music();
  try {
    if (!await music.openFromFile(
      path.join(__dirname, 'resources/doodle_pop.ogg')
    )) {
      throw new Error('Failed to open doodle_pop.ogg');
    }
    music.setLooping(true);
    music.play();
    outputDeviceInfo();

    const selectedDeviceAvailable = () =>
      sf.PlaybackDevice.getAvailableDevices().includes(selectedDevice);

    for (;;) {
      if (!rerouteRequired) {
        // Keep the application alive without blocking the Node event loop.
        await waitForReroute();
        wake = undefined;
      }
      if (!rerouteRequired) {
        continue;
      }

      if (selectedDeviceAvailable()) {
        if (!sf.PlaybackDevice.setDevice(selectedDevice)) {
          throw new Error('Failed to set the playback device');
        }
        rerouteRequired = false;
        continue;
      }

      console.log('Temporarily rerouting to ' +
        (rerouteToNull ? 'null device' : 'default device'));
      const rerouted = rerouteToNull
        ? sf.PlaybackDevice.setDeviceToNull()
        : sf.PlaybackDevice.setDeviceToDefault();
      if (!rerouted) {
        throw new Error('Failed to set the playback device');
      }
      outputDeviceInfo();

      while (!selectedDeviceAvailable()) {
        await delay(100);
      }
      console.log(`Device ${selectedDevice} available again`);
      console.log('Rerouting to ' + selectedDevice);
      if (!sf.PlaybackDevice.setDevice(selectedDevice)) {
        throw new Error('Failed to set the playback device');
      }
      outputDeviceInfo();
      rerouteRequired = false;
    }
  } finally {
    sf.PlaybackDevice.setNotificationCallback(null);
    await music.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
