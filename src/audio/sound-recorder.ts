import {
  audioNative, audioHandle, audioAsync, AudioQueue, type AudioHandle,
} from '../internal/audio-native';
import { AudioWorkerSession } from '../internal/audio-worker-session';
import {
  AudioRecorderSession, currentRecorderSession, type AudioRecorderCallbacks,
} from '../internal/audio-recorder-session';
import { unsigned, type ChannelMap } from './value';
import type { AudioWorkerOptions, AudioWorkerStats } from './worker';

/** 回收包装对象时停止独立会话；会话不得强引用包装对象。 */
const cleanup = new FinalizationRegistry<AudioRecorderSession>(session => {
  void session.stop().catch(() => {});
});

/** 采集设备音频并在 Node Worker 中处理交错 16 位 PCM。 */
export class SoundRecorder {
  readonly [audioHandle]: AudioHandle<'recorder'>;
  protected readonly queue = new AudioQueue();
  private readonly values: Uint32Array;
  private readonly options?: AudioWorkerOptions;
  private session?: AudioWorkerSession;
  /** 按需启用的所属 JS 线程回调会话。 */
  private directSession?: AudioRecorderSession;
  /** 停止请求的代数，用于取消尚未启动的子类会话。 */
  private stopVersion = 0;
  private channelMap: Int32Array;
  private pendingOperations = 0;

  /** 使用 Worker 模块创建录音器；调用 start 后开始采集。 */
  constructor(options: AudioWorkerOptions);
  /** @internal */
  constructor(options: undefined, bufferRecorder: true);
  constructor(options?: AudioWorkerOptions, bufferRecorder = false) {
    if (!bufferRecorder && !options) {
      throw new TypeError('Expected a recorder worker module');
    }
    const mapping = audioNative.createAudioRecorder(bufferRecorder);
    this[audioHandle] = mapping.handle;
    this.values = new Uint32Array(mapping.values);
    this.channelMap = new Int32Array(mapping.channelMap);
    this.options = options;
  }
  /** 返回当前可用录音设备的名称。 */
  static getAvailableDevices(): string[] {
    return audioNative.audioCaptureDevices(0);
  }
  /** 返回默认录音设备名称。 */
  static getDefaultDevice(): string {
    return audioNative.audioCaptureDevices(1);
  }
  /** 返回系统是否支持音频采集。 */
  static isAvailable(): boolean { return audioNative.audioCaptureDevices(2); }
  /** 返回当前采样率，单位为 Hz。 */
  getSampleRate(): number { return this.values[0]; }
  /** 返回采集声道数。 */
  getChannelCount(): number { return this.values[1]; }
  /** 返回采集声道的扬声器位置映射。 */
  getChannelMap(): ChannelMap { return this.channelMap; }
  /** 返回当前录音设备名称。 */
  getDevice(): string {
    return audioNative.audioRecorderDevice(this[audioHandle]);
  }
  /** 异步切换录音设备并返回是否成功；按调用顺序执行，子类回调内不可调用。 */
  setDevice(name: string): Promise<boolean> {
    if (currentRecorderSession(this[audioHandle])) {
      return Promise.reject(new Error('Cannot change device inside a Recorder callback'));
    }
    return this.run(() => {
      const change = () => audioAsync<boolean>(callback =>
        audioNative.audioRecorderDevice(this[audioHandle], name, callback));
      return this.directSession?.runDeviceOperation(change) ?? change();
    });
  }
  /** 设置采集声道数；必须等待当前异步录音操作结束后调用。 */
  setChannelCount(count: number): void {
    if (this.pendingOperations) {
      throw new Error('Wait for the pending recorder operation');
    }
    this.channelMap = new Int32Array(audioNative.audioRecorderChannels(
      this[audioHandle], unsigned(count)));
  }
  /**
   * 异步初始化采集会话，默认 44100 Hz；已采集、拒绝或启动失败返回 false。
   * 不可在子类回调内部重新启动；应在外部等待 stop() 后再开启下一会话。
   */
  start(sampleRate = 44100): Promise<boolean> {
    unsigned(sampleRate);
    if (currentRecorderSession(this[audioHandle])) {
      return Promise.reject(new Error('Cannot start Recorder inside its callback'));
    }
    const version = this.stopVersion;
    return this.run(async () => {
      if (this.values[2]) return false;
      if (this.directSession) {
        await this.directSession.drain().catch(() => {});
        cleanup.unregister(this);
        this.directSession = undefined;
      }
      const callbacks = this.recorderCallbacks();
      const frames = unsigned(this.options?.blockFrames ?? 1024);
      const mapping = await audioAsync<{
        handle?: AudioHandle<'worker'>; token?: bigint;
      }>(callback => audioNative.prepareAudioRecorder(this[audioHandle],
        sampleRate, frames, unsigned(this.options?.queueBlocks ?? 8), callback,
        !!callbacks));
      if (callbacks && mapping.handle) {
        const session = new AudioRecorderSession(this[audioHandle],
          mapping.token!, callbacks, version !== this.stopVersion);
        this.directSession = session;
        cleanup.register(this, session, this);
        try {
          const ok = await session.ready;
          if (!ok) await session.drain();
          return ok;
        } catch (error) {
          await session.drain();
          throw error;
        }
      }
      if (mapping.handle && this.options) {
        const weak = new WeakRef(this);
        this.session = new AudioWorkerSession(mapping.handle, mapping.token!,
          'recorder', this.options, { sampleRate,
            channelCount: this.getChannelCount(), blockFrames: frames }, () => {
            const recorder = weak.deref();
            if (recorder) void recorder.stop().catch(() => {});
          });
        if (!await this.session.ready) {
          await this.session.close();
          return false;
        }
      }
      const ok = await audioAsync<boolean>(callback =>
        audioNative.startAudioRecorder(this[audioHandle], callback));
      if (!ok) await this.session?.close();
      return ok;
    });
  }
  /**
   * 异步停止采集并等待剩余样本及 onStop 完成。
   * 子类回调内 await stop() 只等待设备停止，避免等待自身；
   * 回调退出后继续排空，外部再次 await stop() 可等待完整结束。
   */
  stop(): Promise<void> {
    ++this.stopVersion;
    const current = currentRecorderSession(this[audioHandle]);
    if (current) return current.requestStop();
    // Cancel an onStart callback immediately, even while start owns the queue.
    void this.directSession?.requestStop().catch(() => {});
    return this.run(async () => {
      if (this.directSession) {
        await this.directSession.stop();
        return;
      }
      const buffer = await audioAsync<AudioHandle<'bufferData'> | undefined>(
        callback => audioNative.stopAudioRecorder(this[audioHandle], callback));
      if (buffer) this.onBuffer(buffer);
      await this.session?.drain();
    });
  }
  /** 返回当前 Worker 或子类回调队列统计；Native 快路径为 undefined。 */
  getWorkerStats(): AudioWorkerStats | undefined {
    return this.directSession?.getStats() ?? this.session?.getStats();
  }
  /** 返回 Worker 或子类回调的首次错误；没有错误时为 undefined。 */
  getWorkerError(): Error | undefined {
    return this.directSession?.error ?? this.session?.error;
  }
  /** 按需启用所属 JS 线程的录音回调；普通 Worker 录音器不使用该管线。 */
  protected recorderCallbacks(): AudioRecorderCallbacks | undefined {
    return undefined;
  }
  /** 接收已完成的 Native 录音缓冲区。 */
  protected onBuffer(buffer: AudioHandle<'bufferData'>): void { void buffer; }
  private run<T>(action: () => Promise<T>): Promise<T> {
    ++this.pendingOperations;
    return this.queue.run(action).finally(() => { --this.pendingOperations; });
  }
}
