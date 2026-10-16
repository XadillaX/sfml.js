import { audioHandle, type AudioHandle } from '../internal/audio-native';
import {
  recorderCallbackSession, type AudioRecorderCallbacks,
} from '../internal/audio-recorder-session';
import { SoundRecorder } from './sound-recorder';
import {
  SoundBuffer, adoptAudioBuffer, type ReadonlySoundBuffer,
} from './sound-buffer';

/** 将采集的 PCM 保存在 SoundBuffer 中的录音器。 */
export class SoundBufferRecorder extends SoundRecorder {
  private buffer: SoundBuffer = new SoundBuffer();
  /** 创建录音器，调用 start 开始采集。 */
  constructor() { super(undefined, true); }
  /** 返回最近完成的录音缓冲区；应在 await stop() 后取得新结果。 */
  getBuffer(): ReadonlySoundBuffer { return this.buffer; }
  /**
   * 在对象所属 JS 线程开始采集前调用；支持同步或异步返回，false 拒绝采集。
   * 默认清空本次 Native PCM 聚合和录音缓冲区，不访问麦克风。
   */
  protected onStart(): boolean | Promise<boolean> {
    this.onBuffer(recorderCallbackSession(this[audioHandle], 'onStart').reset());
    return true;
  }
  /**
   * 在对象所属 JS 线程串行处理交错的 16 位 PCM，长度单位为样本而非帧。
   * Native 视图仅在本次同步或异步回调结束前有效；false 异步停止采集。
   * 默认将传入样本追加到 Native 聚合器；可修改后调用 super，不调用则不保存。
   */
  protected onProcessSamples(samples: Int16Array): boolean | Promise<boolean> {
    return recorderCallbackSession(this[audioHandle], 'onProcessSamples')
      .append(samples);
  }
  /**
   * 在设备停止且已交付回调结束后，于对象所属 JS 线程调用一次，支持异步完成。
   * 拒绝、取消和异常同样触发；默认将已通过 super 追加的 PCM 完成为 SoundBuffer。
   */
  protected onStop(): void | Promise<void> {
    this.onBuffer(recorderCallbackSession(this[audioHandle], 'onStop').finalize());
  }
  /** 只有覆写回调的子类启用队列，普通实例保持 Native 快路径。 */
  protected recorderCallbacks(): AudioRecorderCallbacks | undefined {
    if (this.onStart === SoundBufferRecorder.prototype.onStart &&
        this.onProcessSamples === SoundBufferRecorder.prototype.onProcessSamples &&
        this.onStop === SoundBufferRecorder.prototype.onStop) return undefined;
    return SoundBufferRecorder.callbacks(new WeakRef(this));
  }
  /** 在实例作用域外创建弱引用派发器，避免空闲会话保活包装对象。 */
  private static callbacks(weak: WeakRef<SoundBufferRecorder>): AudioRecorderCallbacks {
    return {
      onStart: () => weak.deref()?.onStart() ?? false,
      onProcessSamples: samples =>
        weak.deref()?.onProcessSamples(samples) ?? false,
      onStop: () => weak.deref()?.onStop(),
    };
  }
  /** 接收独立 Native 缓冲区；后续录音不会修改已返回的 SoundBuffer。 */
  protected onBuffer(buffer: AudioHandle<'bufferData'>): void {
    this.buffer = SoundBuffer[adoptAudioBuffer](buffer);
  }
}
