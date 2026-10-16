import {
  audioNative, audioHandle, type AudioSourceMapping,
} from '../internal/audio-native';
import { AudioWorkerSession } from '../internal/audio-worker-session';
import { SoundSource } from './sound-source';
import { channels, unsigned, type ChannelMap } from './value';
import type { SoundStreamOptions, AudioWorkerStats } from './worker';

/** Buffered SFML stream. The supplied module produces PCM in a Node Worker. */
export class SoundStream extends SoundSource {
  /** Worker 初始化和首批数据准备的结果；播放前应等待。 */
  readonly ready: Promise<boolean>;
  private readonly session?: AudioWorkerSession;
  private streamChannels: Int32Array;

  /** 创建由指定 Worker 模块生成交错 PCM 的音频流。 */
  constructor(options: SoundStreamOptions);
  /** @internal */
  constructor(options: undefined, mapping: AudioSourceMapping);
  constructor(options?: SoundStreamOptions, mapping?: AudioSourceMapping) {
    const frames = unsigned(options?.blockFrames ?? 1024);
    const slots = unsigned(options?.queueBlocks ?? 8);
    const map = options ? channels(options.channelMap) : new Int32Array(0);
    const created = options ? audioNative.createAudioStream(frames,
      unsigned(options.channelCount), unsigned(options.sampleRate), slots, map)
      : undefined;
    if (!created && !mapping) throw new TypeError('Expected stream options');
    super(created ?? mapping!);
    this.streamChannels = new Int32Array(
      audioNative.audioSourceChannels(this[audioHandle]));
    if (created && options) {
      this.session = new AudioWorkerSession(created.worker, created.token,
        'stream', options, { sampleRate: options.sampleRate,
          channelCount: options.channelCount, blockFrames: frames });
    }
    this.ready = this.session?.ready ?? Promise.resolve(true);
  }

  /** 返回每声道采样率，单位为 Hz。 */
  getSampleRate(): number { return this.get(26); }
  /** 返回声道数量。 */
  getChannelCount(): number { return this.get(27); }
  /** 返回各交错声道的扬声器位置。 */
  getChannelMap(): ChannelMap { return this.streamChannels; }
  /** 返回 Worker 错误；尚无错误时为 undefined。 */
  getWorkerError(): Error | undefined { return this.session?.error; }
  /** 返回音频队列统计；没有 Worker 会话时为 undefined。 */
  getWorkerStats(): AudioWorkerStats | undefined {
    return this.session?.getStats();
  }
  /** 停止播放并异步关闭 Worker 会话。 */
  async close(): Promise<void> {
    this.stop();
    await this.session?.close();
  }
  protected refreshChannels(): void {
    this.streamChannels = new Int32Array(
      audioNative.audioSourceChannels(this[audioHandle]));
  }
}
