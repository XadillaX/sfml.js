import { parentPort, workerData } from 'node:worker_threads';
import { setTimeout as delay } from 'node:timers/promises';
import { audioNative } from './audio-native';
import { Time } from '../system/time';
import type {
  AudioWorkerContext, SoundStreamCallbacks, SoundRecorderCallbacks,
  EffectProcessorCallbacks,
} from '../audio/worker';

type Callbacks = SoundStreamCallbacks & SoundRecorderCallbacks &
EffectProcessorCallbacks;
interface Setup {
  token: bigint;
  kind: 'stream' | 'effect' | 'recorder';
  module: string;
  exportName?: string;
  data?: unknown;
  context: AudioWorkerContext;
}
// Preserve native ESM import when this package is compiled to CommonJS.
// eslint-disable-next-line no-new-func
const importModule = new Function('url', 'return import(url)') as
(url: string) => Promise<Record<string, unknown>>;

async function run(): Promise<void> {
  const setup = workerData as Setup;
  const mapping = audioNative.attachAudioWorker(setup.token);
  const handle = mapping.handle;
  const fields = new Int32Array(mapping.fields);
  const time = new BigInt64Array(mapping.time);
  const pcm = setup.kind === 'effect' ? []
    : mapping.input.map(buffer => new Int16Array(buffer));
  const input = setup.kind === 'effect'
    ? mapping.input.map(buffer => new Float32Array(buffer)) : [];
  const output = setup.kind === 'effect'
    ? mapping.output.map(buffer => new Float32Array(buffer)) : [];
  let callbacks: Partial<Callbacks> = {};
  try {
    const module = await importModule(setup.module);
    const factory = module[setup.exportName ?? 'default'];
    if (typeof factory !== 'function') {
      throw new TypeError('Audio worker export must be a factory');
    }
    callbacks = await factory(setup.context, setup.data) as Callbacks;
    const required = setup.kind === 'stream'
      ? [ 'onGetData', 'onSeek' ] : setup.kind === 'recorder'
        ? [ 'onProcessSamples' ] : [ 'process' ];
    for (const name of required) {
      if (typeof callbacks[name as keyof Callbacks] !== 'function') {
        throw new TypeError(`Audio worker requires ${name}()`);
      }
    }
    if (setup.kind === 'recorder' && callbacks.onStart &&
        !await callbacks.onStart()) {
      parentPort!.postMessage({ type: 'aborted' });
      return;
    }
    let ready = setup.kind !== 'stream';
    if (ready) parentPort!.postMessage({ type: 'ready' });
    let primed = 0;
    for (;;) {
      const operation = audioNative.pollAudioWorker(handle);
      if (operation === -3) break;
      if (operation === -2) {
        await callbacks.onSeek!(new Time(time[0]));
        continue;
      }
      if (operation === -1) {
        await delay(2);
        continue;
      }
      if (setup.kind === 'stream') {
        const chunk = { samples: pcm[fields[0]], sampleCount: fields[2] };
        const more = await callbacks.onGetData!(chunk);
        if (typeof more !== 'boolean') {
          throw new TypeError('onGetData must return a boolean');
        }
        if (chunk.samples !== pcm[fields[0]]) {
          throw new TypeError('Fill the provided native sample buffer');
        }
        if (!Number.isInteger(chunk.sampleCount) || chunk.sampleCount < 0 ||
            chunk.sampleCount > chunk.samples.length) {
          throw new RangeError('Invalid stream sample count');
        }
        fields[2] = chunk.sampleCount;
        fields[3] = +more;
        if (!more) {
          const loop = callbacks.onLoop ? await callbacks.onLoop() : 0n;
          if (loop !== undefined && (typeof loop !== 'bigint' || loop < 0n ||
              loop > 0x7fffffffffffffffn)) {
            throw new RangeError('Invalid loop sample offset');
          }
          time[1] = loop ?? -1n;
        }
        audioNative.commitAudioWorker(handle);
        if (!ready && (++primed >= 2 || !more)) {
          ready = true;
          parentPort!.postMessage({ type: 'ready' });
        }
      } else if (setup.kind === 'recorder') {
        const more = await callbacks.onProcessSamples!(
          pcm[fields[0]].subarray(0, fields[2]));
        if (typeof more !== 'boolean') {
          throw new TypeError('onProcessSamples must return a boolean');
        }
        audioNative.commitAudioWorker(handle, more);
        if (!more) {
          parentPort!.postMessage({ type: 'stop' });
        }
      } else {
        const channels = fields[3];
        const result = await callbacks.process!(
          fields[5] ? null
            : input[fields[0]].subarray(fields[4], fields[4] + fields[2]),
          fields[7], output[fields[1]].subarray(0, fields[6] * channels),
          fields[6], channels);
        if (result) {
          if (!Number.isInteger(result.inputFrameCount) ||
              !Number.isInteger(result.outputFrameCount) ||
              result.inputFrameCount < 0 || result.inputFrameCount > fields[7] ||
              result.outputFrameCount < 0 ||
              result.outputFrameCount > fields[6]) {
            throw new RangeError('Effect frame counts exceed the leased block');
          }
          fields[6] = result.outputFrameCount;
          fields[7] = result.inputFrameCount;
        } else {
          fields[6] = fields[7];
        }
        audioNative.commitAudioWorker(handle);
      }
    }
  } finally {
    audioNative.closeAudioWorker(handle);
    if (setup.kind === 'recorder') await callbacks.onStop?.();
    else await callbacks.onClose?.();
  }
}

void run().catch((error: unknown) => {
  parentPort!.postMessage({ type: 'error',
    error: error instanceof Error ? error.stack : String(error) });
}).finally(() => {
  parentPort!.postMessage({ type: 'closed' });
  parentPort!.close();
});
