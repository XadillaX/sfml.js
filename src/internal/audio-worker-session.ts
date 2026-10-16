import { Worker } from 'node:worker_threads';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { audioNative, type AudioHandle } from './audio-native';
import type {
  AudioWorkerOptions, AudioWorkerContext, AudioWorkerStats,
} from '../audio/worker';
import { SFMLError } from '../system/error';

const cleanup = new FinalizationRegistry<AudioHandle<'worker'>>(handle =>
  audioNative.closeAudioWorker(handle));

export interface WorkerMessage { type: string; error?: string }

export class AudioWorkerSession {
  readonly ready: Promise<boolean>;
  readonly done: Promise<void>;
  private readonly worker: Worker;
  private readonly failure: { error?: Error } = {};

  constructor(readonly handle: AudioHandle<'worker'>, token: bigint,
    kind: 'stream' | 'effect' | 'recorder', options: AudioWorkerOptions,
    context: AudioWorkerContext, onStop?: () => void) {
    const module = options.module instanceof URL ? options.module.href
      : pathToFileURL(resolve(options.module)).href;
    const worker = new Worker(join(__dirname, 'audio-worker.js'), {
      workerData: { token, kind, module, exportName: options.exportName,
        data: options.data, context },
    });
    this.worker = worker;
    const failure = this.failure;
    let completed = false;
    this.ready = new Promise<boolean>((resolveReady, reject) => {
      worker.on('message', (message: WorkerMessage) => {
        if (message.type === 'closed') completed = true;
        if (message.type === 'ready') resolveReady(true);
        if (message.type === 'aborted') resolveReady(false);
        if (message.type === 'stop') onStop?.();
        if (message.type === 'error') {
          failure.error = new SFMLError(message.error ?? 'Audio worker failed');
          audioNative.closeAudioWorker(handle);
          reject(failure.error);
          onStop?.();
        }
      });
      worker.on('error', (error: Error) => {
        failure.error = error;
        audioNative.closeAudioWorker(handle);
        reject(error);
        onStop?.();
      });
      worker.once('exit', code => {
        audioNative.closeAudioWorker(handle);
        if (!completed && !failure.error) {
          failure.error = new SFMLError(`Audio worker exited early (${code})`);
          reject(failure.error);
          onStop?.();
        } else {
          resolveReady(false);
        }
      });
    });
    // Keep initialization alive even if ready has not yet been awaited.
    void this.ready.then(() => worker.unref(), () => worker.unref());
    this.done = new Promise(resolveDone => {
      worker.once('exit', () => resolveDone());
    });
    cleanup.register(this, handle, this);
  }

  get error(): Error | undefined { return this.failure.error; }

  getStats(): AudioWorkerStats {
    const fields = new BigUint64Array(audioNative.audioWorkerStats(this.handle));
    return { underruns: fields[0], overruns: fields[1], processed: fields[2] };
  }

  async close(): Promise<void> {
    cleanup.unregister(this);
    audioNative.closeAudioWorker(this.handle);
    await this.drain();
  }

  async drain(): Promise<void> {
    this.worker.ref();
    await this.done;
    if (this.error) throw this.error;
  }
}
