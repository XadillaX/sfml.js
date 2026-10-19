'use strict';

const sf = require('../../..');
const clientAudioData = 1;
const clientEndOfStream = 2;

/**
 * Build recorder callbacks inside the audio Worker.
 * @param {object} context - Audio format supplied by the Worker.
 * @param {object} destination - Remote address and port.
 * @param {string} destination.host - Remote IP address text.
 * @param {number} destination.port - Remote TCP port.
 * @return {object} Asynchronous recorder callbacks.
 */
function createRecorder(context, { host, port }) {
  const socket = new sf.TcpSocket();
  const address = sf.IpAddress.fromString(host);
  let connected = false;

  return {
    /** Connect before capture starts. */
    async onStart() {
      connected = await socket.connect(address, port) === sf.Socket.Status.Done;
      if (connected) console.log(`Connected to server ${host}`);
      return connected;
    },

    /**
     * Send signed 16-bit native-endian PCM using the upstream packet ID.
     * @param {Int16Array} samples - Captured samples valid until completion.
     * @return {Promise<boolean>} Whether recording should continue.
     */
    async onProcessSamples(samples) {
      const packet = new sf.Packet().write('u8', clientAudioData);
      packet.append(new Uint8Array(
        samples.buffer, samples.byteOffset, samples.byteLength
      ));
      return await socket.send(packet) === sf.Socket.Status.Done;
    },

    /** Send EOF after the recording queue drains, then close the socket. */
    async onStop() {
      try {
        if (connected) {
          const packet = new sf.Packet().write('u8', clientEndOfStream);
          if (await socket.send(packet) !== sf.Socket.Status.Done) {
            console.error('Failed to send end-of-stream packet');
          }
        }
      } finally {
        connected = false;
        socket.disconnect();
      }
    },
  };
}

/** A recorder whose networking and native callbacks run in a Worker. */
class NetworkRecorder extends sf.SoundRecorder {
  /**
   * Configure the remote destination without opening the microphone yet.
   * @param {object} host - Remote IP address.
   * @param {number} port - Remote TCP port.
   */
  constructor(host, port) {
    super({
      module: __filename,
      exportName: 'createRecorder',
      data: {
        host: host.toString(),
        port,
      },
    });
  }
}

/**
 * Capture mono 44100 Hz audio until the user presses Enter.
 * @param {number} port - Remote port.
 * @param {Function} read - Asynchronous console input.
 * @param {Function} readAddress - Asynchronous server address prompt.
 */
async function doClient(port, read, readAddress) {
  if (!sf.SoundRecorder.isAvailable()) {
    console.log('Sorry, audio capture is not supported by your system');
    return;
  }

  const recorder = new NetworkRecorder(await readAddress(), port);
  try {
    await read('Press enter to start recording audio');
    if (!await recorder.start(44100)) {
      console.error('Failed to start recorder');
      return;
    }

    await read('Recording... press enter to stop');
  } finally {
    await recorder.stop();
  }
}

module.exports = { createRecorder, NetworkRecorder, doClient };
