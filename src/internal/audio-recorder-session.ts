import { AsyncLocalStorage } from 'node:async_hooks';
import {
  AudioQueue, audioAsync, audioNative, type AudioHandle,
} from './audio-native';
import type { AudioWorkerStats } from '../audio/worker';

/** 在录音器所属 JS 线程执行的串行回调；不得强引用录音器 wrapper。 */
export interface AudioRecorderCallbacks {
  /** 开始采集前调用；false 拒绝本次采集。 */
  onStart(): boolean | Promise<boolean>;
  /** 消费 Native 交错 PCM 视图；视图仅在本次回调完成前有效。 */
  onProcessSamples(samples: Int16Array): boolean | Promise<boolean>;
  /** 设备停止且已交付回调结束后调用一次。 */
  onStop(): void | Promise<void>;
}

/** super 调用必须匹配的录音回调阶段。 */
type Phase = 'onStart' | 'onProcessSamples' | 'onStop';
/** 异步回调上下文，结束后禁止继续使用该会话的 super 方法。 */
interface Invocation {
  /** 发起本次回调的会话。 */
  session: AudioRecorderSession;
  /** 当前正在执行的回调阶段。 */
  phase: Phase;
  /** 回调返回或拒绝之前保持有效。 */
  active: boolean;
}
/** 随 await 传递本次回调上下文，不将旧回调绑定到新会话。 */
const invocation = new AsyncLocalStorage<Invocation>();

/** 返回当前仍在执行的录音回调会话，用于识别 stop 的自等待。 */
export function currentRecorderSession(
  recorder: AudioHandle<'recorder'>,
): AudioRecorderSession | undefined {
  const context = invocation.getStore();
  return context?.active && context.session.recorder === recorder
    ? context.session : undefined;
}

/** 取得 super 默认实现对应的会话；拒绝过期或阶段不匹配的异步调用。 */
export function recorderCallbackSession(
  recorder: AudioHandle<'recorder'>, phase: Phase,
): AudioRecorderSession {
  const context = invocation.getStore();
  if (!context?.active || context.phase !== phase ||
      context.session.recorder !== recorder) {
    throw new Error(`${phase} must run inside its active Recorder callback`);
  }
  return context.session;
}

/** Native 队列的同线程消费者；只持有固定数量的 PCM 视图。 */
export class AudioRecorderSession {
  /** onStart 和设备启动结果；拒绝和取消均返回 false。 */
  readonly ready: Promise<boolean>;
  /** 包括设备停止、队列消费和 onStop 的整个会话生命周期。 */
  readonly done: Promise<void>;
  /** 本会话首次错误；通过 start/stop 和 getWorkerError 传播。 */
  error?: Error;
  /** 本会话独占的原生采集队列。 */
  private readonly handle: AudioHandle<'worker'>;
  /** 仅由 super 追加样本的原生聚合器。 */
  private readonly buffer: AudioHandle<'recorderBuffer'>;
  /** 当前租借队列槽的样本数量等描述字段。 */
  private readonly fields: Int32Array;
  /** 固定数量的原生 PCM 槽视图，回调完成后可复用。 */
  private readonly input: Int16Array[];
  /** 串行化设备操作，不等待用户回调。 */
  private readonly devices = new AudioQueue();
  /** 已请求停止，不再启动新的采集设备。 */
  private stopping = false;
  /** 正在等待会话结束，轮询定时器需保活进程。 */
  private draining = false;
  /** 等待新样本或设备停止的轮询定时器。 */
  private timer?: NodeJS.Timeout;
  /** 本会话唯一的设备停止操作。 */
  private captureStop?: Promise<void>;

  /** 绑定独立 Native 队列和聚合器，回调延迟到构造完成后执行。 */
  constructor(
    /** 本会话操作的 Native 录音器句柄。 */
    readonly recorder: AudioHandle<'recorder'>,
    token: bigint,
    /** 只弱引用包装对象的回调派发器。 */
    private readonly callbacks: AudioRecorderCallbacks,
    cancelled = false,
  ) {
    const mapping = audioNative.attachAudioWorker(token);
    this.handle = mapping.handle;
    this.fields = new Int32Array(mapping.fields);
    this.input = mapping.input.map(buffer => new Int16Array(buffer));
    this.buffer = audioNative.createAudioRecorderBuffer(recorder);
    this.stopping = cancelled;
    let resolveReady!: (value: boolean) => void;
    let rejectReady!: (error: Error) => void;
    this.ready = new Promise((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    this.done = Promise.resolve().then(() =>
      this.run(resolveReady, rejectReady));
  }

  /** 重置 Native 聚合和空 SoundBuffer，仅供 super.onStart 使用。 */
  reset(): AudioHandle<'bufferData'> {
    return audioNative.audioRecorderBuffer(this.buffer, 0);
  }

  /** 将当前回调提供的交错样本追加到 Native 聚合器。 */
  append(samples: Int16Array): boolean {
    audioNative.audioRecorderBuffer(this.buffer, 1, samples);
    return true;
  }

  /** 完成 Native 聚合；返回不受后续录音影响的缓冲区。 */
  finalize(): AudioHandle<'bufferData'> {
    return audioNative.audioRecorderBuffer(this.buffer, 2);
  }

  /** 将设备切换与启动、停止串行化；不包含等待 JS 回调的操作。 */
  runDeviceOperation<T>(action: () => Promise<T>): Promise<T> {
    return this.devices.run(action);
  }

  /** 仅等待设备停止，不等待当前 JS 回调；可在回调内部 await。 */
  requestStop(): Promise<void> {
    this.stopping = true;
    this.draining = true;
    this.timer?.ref();
    if (!this.captureStop) {
      this.captureStop = this.devices.run(async () => {
        await audioAsync(callback =>
          audioNative.stopAudioRecorder(this.recorder, callback));
      });
      void this.captureStop.catch(error => this.fail(error));
    }
    return this.captureStop;
  }

  /** 等待所有已交付数据和 onStop；调用方必须不在本会话回调中。 */
  async drain(): Promise<void> {
    this.draining = true;
    this.timer?.ref();
    await this.done;
    if (this.error) throw this.error;
  }

  /** 停止设备并等待本会话完整结束。 */
  async stop(): Promise<void> {
    await this.requestStop().catch(error => this.fail(error));
    await this.drain();
  }

  /** 返回 Native 队列统计，processed 的单位为交错样本。 */
  getStats(): AudioWorkerStats {
    const fields = new BigUint64Array(audioNative.audioWorkerStats(this.handle));
    return { underruns: fields[0], overruns: fields[1], processed: fields[2] };
  }

  /** 保留首个错误，避免清理异常覆盖原始回调错误。 */
  private fail(error: unknown): void {
    this.error ??= error instanceof Error ? error : new Error(String(error));
  }

  /** 串行派发一个回调，并在异步完成后使其上下文失效。 */
  private async invoke<T>(phase: Phase, callback: () => T): Promise<Awaited<T>> {
    const context: Invocation = { session: this, phase, active: true };
    try {
      return await invocation.run(context, callback);
    } finally {
      context.active = false;
    }
  }

  /** 驱动启动、PCM 消费和唯一的停止回调，所有样本仍由 Native 持有。 */
  private async run(resolveReady: (value: boolean) => void,
    rejectReady: (error: Error) => void): Promise<void> {
    try {
      // 已取消的启动仍经 finally 派发 onStop，但不启动设备或派发 onStart。
      if (this.stopping) { resolveReady(false); return; }
      const accepted = await this.invoke('onStart', () =>
        this.callbacks.onStart());
      if (typeof accepted !== 'boolean') {
        throw new TypeError('Recorder onStart must return a boolean');
      }
      let started = false;
      if (accepted && !this.stopping) {
        started = await this.devices.run(() =>
          audioAsync<boolean>(callback =>
            audioNative.startAudioRecorder(this.recorder, callback)));
      }
      resolveReady(started && !this.stopping);
      if (!started) return;
      for (;;) {
        const status = audioNative.pollAudioWorker(this.handle);
        if (status === -3) break;
        if (status === -1) {
          await new Promise<void>(resolve => {
            this.timer = setTimeout(resolve, 1);
            if (!this.draining) this.timer.unref();
          });
          this.timer = undefined;
          continue;
        }
        let more = false;
        try {
          const samples = this.input[this.fields[0]].subarray(0, this.fields[2]);
          more = await this.invoke('onProcessSamples', () =>
            this.callbacks.onProcessSamples(samples));
          if (typeof more !== 'boolean') {
            throw new TypeError('Recorder onProcessSamples must return a boolean');
          }
        } finally {
          audioNative.commitAudioWorker(this.handle, more === true);
        }
        if (!more) {
          await this.requestStop();
          break;
        }
      }
    } catch (error) {
      this.fail(error);
      rejectReady(this.error!);
    } finally {
      await this.requestStop().catch(error => this.fail(error));
      try {
        await this.invoke('onStop', () => this.callbacks.onStop());
      } catch (error) {
        this.fail(error);
      }
      audioNative.closeAudioWorker(this.handle);
    }
  }
}
