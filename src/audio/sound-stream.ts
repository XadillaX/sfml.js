import {
  audioNative, audioHandle, type AudioSourceMapping,
} from '../internal/audio-native';
import { AudioWorkerSession } from '../internal/audio-worker-session';
import { SoundSource } from './sound-source';
import { channels, unsigned, type ChannelMap } from './value';
import type { SoundStreamOptions, AudioWorkerStats } from './worker';

/**
 * Buffered SFML stream. The supplied module produces PCM in a Node Worker.
 * @zh 带缓冲的 SFML 流，由提供的模块在 Node Worker 中生成 PCM。
 * @ja バッファー付き SFML ストリーム。
 * 指定モジュールが Node Worker 内で PCM を生成します。
 * @ko 버퍼링된 SFML 스트림입니다. 제공된 모듈이 Node Worker에서 PCM을 생성합니다.
 */
export class SoundStream extends SoundSource {
  /**
   * Result of Worker initialization and initial data preparation; await before
   * playback.
   * @zh Worker 初始化和首批数据准备的结果；播放前应等待。
   * @ja Worker の初期化と最初のデータ準備の結果。再生前に完了を待ってください。
   * @ko Worker 초기화 및 첫 데이터 준비 결과입니다. 재생 전에 기다려야 합니다.
   */
  readonly ready: Promise<boolean>;
  private readonly session?: AudioWorkerSession;
  private streamChannels: Int32Array;

  /**
   * Create an audio stream whose interleaved PCM is produced by the given
   * Worker module.
   * @zh 创建由指定 Worker 模块生成交错 PCM 的音频流。
   * @ja 指定 Worker モジュールがインターリーブ PCM を生成する音声ストリームを作成します。
   * @ko 지정한 Worker 모듈이 인터리브 PCM을 생성하는 오디오 스트림을 만듭니다.
   */
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

  /**
   * Return the sample rate per channel, in Hz.
   * @zh 返回每声道采样率，单位为 Hz。
   * @ja チャンネルごとのサンプルレートを Hz で返します。
   * @ko 채널별 샘플 레이트를 Hz 단위로 반환합니다.
   */
  getSampleRate(): number { return this.get(26); }
  /**
   * Return the number of channels.
   * @zh 返回声道数量。
   * @ja チャンネル数を返します。
   * @ko 채널 수를 반환합니다.
   */
  getChannelCount(): number { return this.get(27); }
  /**
   * Return the speaker positions of the interleaved channels.
   * @zh 返回各交错声道的扬声器位置。
   * @ja 各インターリーブチャンネルのスピーカー位置を返します。
   * @ko 각 인터리브 채널의 스피커 위치를 반환합니다.
   */
  getChannelMap(): ChannelMap { return this.streamChannels; }
  /**
   * Return the Worker error, or undefined if no error has occurred.
   * @zh 返回 Worker 错误；尚无错误时为 undefined。
   * @ja Worker のエラーを返します。まだエラーがなければ undefined。
   * @ko Worker 오류를 반환합니다. 아직 오류가 없으면 undefined입니다.
   */
  getWorkerError(): Error | undefined { return this.session?.error; }
  /**
   * Return audio queue statistics, or undefined if there is no Worker session.
   * @zh 返回音频队列统计；没有 Worker 会话时为 undefined。
   * @ja 音声キューの統計を返します。Worker セッションがなければ undefined。
   * @ko 오디오 큐 통계를 반환합니다. Worker 세션이 없으면 undefined입니다.
   */
  getWorkerStats(): AudioWorkerStats | undefined {
    return this.session?.getStats();
  }
  /**
   * Stop playback and asynchronously close the Worker session.
   * @zh 停止播放并异步关闭 Worker 会话。
   * @ja 再生を停止し、Worker セッションを非同期で閉じます。
   * @ko 재생을 중지하고 Worker 세션을 비동기로 닫습니다.
   */
  async close(): Promise<void> {
    this.stop();
    await this.session?.close();
  }
  protected refreshChannels(): void {
    this.streamChannels = new Int32Array(
      audioNative.audioSourceChannels(this[audioHandle]));
  }
}
