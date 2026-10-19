'use strict';

const { setTimeout: delay } = require('node:timers/promises');
const sf = require('../../..');
const serverAudioData = 1;
const serverEndOfStream = 2;

/**
 * Receive and retain PCM in the playback Worker, including replay data.
 * @param {object} context - Stream sample rate and channel count.
 * @param {object} options - Listening port and shared lifecycle flags.
 * @param {number} options.port - Listening TCP port.
 * @param {SharedArrayBuffer} options.state - Shutdown and completion flags.
 * @return {Promise<object>} Stream callbacks.
 */
async function createStream(context, { port, state: shared }) {
  // Main sets flag 0 before closing; Worker sets flag 1 on receive completion.
  const state = new Int32Array(shared);
  const listener = new sf.TcpListener();
  const client = new sf.TcpSocket();
  const samples = [];
  let block = 0;
  let offset = 0;
  let finished = false;
  let failure;

  if (await listener.listen(port) !== sf.Socket.Status.Done) {
    listener.close();
    throw new Error(`Failed to listen on port ${port}`);
  }
  console.log(
    `Server is listening to port ${port}, waiting for connections... `
  );

  /** Receive framed audio packets independently of playback requests. */
  async function receiveLoop() {
    try {
      if (await listener.accept(client) !== sf.Socket.Status.Done) return;
      console.log(`Client connected: ${client.getRemoteAddress().toString()}`);

      while (!Atomics.load(state, 0)) {
        const packet = new sf.Packet();
        if (await client.receive(packet) !== sf.Socket.Status.Done) break;
        const id = packet.read('u8');

        if (id === serverAudioData && (packet.getDataSize() - 1) % 2 === 0) {
          // Packet views may be pooled Buffers with unaligned byte offsets.
          const bytes = Uint8Array.from(packet.getData().subarray(1));
          if (bytes.length) samples.push(new Int16Array(bytes.buffer));
        } else if (id === serverEndOfStream) {
          console.log('Audio data has been 100% received!');
          break;
        } else {
          console.log('Invalid packet received...');
          break;
        }
      }
    } catch (error) {
      failure = error;
    } finally {
      finished = true;
      Atomics.store(state, 1, 1);
      client.disconnect();
      listener.close();
    }
  }

  const receiving = receiveLoop();
  return {
    /**
     * Fill the native PCM slot, waiting asynchronously for new samples.
     * @param {object} chunk - Reusable native output slot.
     * @return {Promise<boolean>} Whether more samples may follow.
     */
    async onGetData(chunk) {
      while (block >= samples.length && !finished && !Atomics.load(state, 0)) {
        await delay(10);
      }

      if (failure) throw failure;
      chunk.sampleCount = 0;
      if (Atomics.load(state, 0)) return false;

      while (block < samples.length &&
        chunk.sampleCount < chunk.samples.length) {
        const current = samples[block];
        const count = Math.min(current.length - offset,
          chunk.samples.length - chunk.sampleCount);
        chunk.samples.set(
          current.subarray(offset, offset + count), chunk.sampleCount
        );
        chunk.sampleCount += count;
        offset += count;
        if (offset === current.length) {
          block++;
          offset = 0;
        }
      }
      return !finished || block < samples.length;
    },

    /**
     * Seek within retained PCM, including the rewind used for replay.
     * @param {object} time - Requested SFML time offset.
     */
    onSeek(time) {
      offset = Math.floor(time.asMilliseconds() *
        context.sampleRate * context.channelCount / 1000);
      block = 0;
      while (block < samples.length && offset >= samples[block].length) {
        offset -= samples[block++].length;
      }

      if (block === samples.length) offset = 0;
    },

    /** Unblock pending accept/receive operations and release the sockets. */
    async onClose() {
      Atomics.store(state, 0, 1);
      listener.close();
      client.disconnect();
      await receiving;
    },
  };
}

/**
 * Play the incoming mono stream and replay it after the user presses Enter.
 * @param {number} port - Listening port.
 * @param {Function} read - Asynchronous console input.
 */
async function doServer(port, read) {
  const state = new Int32Array(new SharedArrayBuffer(8));
  const stream = new sf.SoundStream({
    module: __filename,
    exportName: 'createStream',
    data: {
      port,
      state: state.buffer,
    },
    channelCount: 1,
    sampleRate: 44100,
    channelMap: [ sf.SoundChannel.Mono ],
  });

  /** Yield to the event loop until reception and playback have finished. */
  async function waitForPlayback() {
    while (!Atomics.load(state, 1) ||
      stream.getStatus() !== sf.SoundSource.Status.Stopped) {
      const error = stream.getWorkerError();
      if (error) throw error;
      await delay(100);
    }

    const error = stream.getWorkerError();
    if (error) throw error;
  }

  try {
    if (!await stream.ready) return;
    stream.play();
    await waitForPlayback();

    await read('Press enter to replay the sound...\n');
    stream.play();
    await waitForPlayback();
  } finally {
    Atomics.store(state, 0, 1);
    await stream.close();
  }
}

module.exports = { createStream, doServer };
