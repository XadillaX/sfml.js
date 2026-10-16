import {
  audioNative, audioHandle, type AudioHandle,
} from '../internal/audio-native';
import { AudioWorkerSession } from '../internal/audio-worker-session';
import type { AudioWorkerOptions, AudioWorkerStats } from './worker';
import { unsigned } from './value';
import { getDeviceSampleRate } from './playback-device';

/** 浮点 PCM 效果处理器的 Worker 和容量配置。 */
export interface EffectProcessorOptions extends AudioWorkerOptions {
  /** Maximum engine output channels; input is already spatialized. */
  maxChannelCount?: number;
}

/** Buffered DSP on native float blocks. Underflow produces silence. */
export class EffectProcessor {
  readonly [audioHandle]: AudioHandle<'worker'>;
  /** Worker 效果工厂初始化结果。 */
  readonly ready: Promise<boolean>;
  private readonly session: AudioWorkerSession;

  /** 创建 Worker 效果处理器，默认每块 1024 帧、8 块队列和最多 8 个声道。 */
  constructor(options: EffectProcessorOptions) {
    const frames = unsigned(options.blockFrames ?? 1024);
    const channels = unsigned(options.maxChannelCount ?? 8);
    const mapping = audioNative.createAudioEffect(frames, channels,
      unsigned(options.queueBlocks ?? 8));
    this[audioHandle] = mapping.handle;
    this.session = new AudioWorkerSession(mapping.handle, mapping.token,
      'effect', options, { sampleRate: getDeviceSampleRate() ?? 0,
        channelCount: channels,
        blockFrames: frames });
    this.ready = this.session.ready;
  }
  /** 返回分块处理和队列欠载、溢出统计。 */
  getWorkerStats(): AudioWorkerStats { return this.session.getStats(); }
  /** 返回 Worker 错误；没有错误时为 undefined。 */
  getWorkerError(): Error | undefined { return this.session.error; }
  /** 异步关闭效果 Worker 会话。 */
  close(): Promise<void> { return this.session.close(); }
}
