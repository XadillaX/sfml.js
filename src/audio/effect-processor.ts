import {
  audioNative, audioHandle, type AudioHandle,
} from '../internal/audio-native';
import { AudioWorkerSession } from '../internal/audio-worker-session';
import type { AudioWorkerOptions, AudioWorkerStats } from './worker';
import { unsigned } from './value';
import { getDeviceSampleRate } from './playback-device';

/**
 * Worker and capacity configuration for a floating-point PCM effect processor.
 * @zh 浮点 PCM 效果处理器的 Worker 和容量配置。
 * @ja 浮動小数点 PCM エフェクトプロセッサーの Worker と容量の設定。
 * @ko 부동 소수점 PCM 효과 처리기의 Worker 및 용량 설정입니다.
 */
export interface EffectProcessorOptions extends AudioWorkerOptions {
  /**
   * Maximum engine output channels; input is already spatialized.
   * @zh 引擎输出声道数上限；输入已完成空间音效处理。
   * @ja エンジンの最大出力チャンネル数。入力は空間音響処理済みです。
   * @ko 엔진의 최대 출력 채널 수이며, 입력은 이미 공간 음향 처리가 되어 있습니다.
   */
  maxChannelCount?: number;
}

/**
 * Buffered DSP on native float blocks. Underflow produces silence.
 * @zh 对原生浮点块进行缓冲式 DSP 处理，欠载时输出静音。
 * @ja ネイティブ浮動小数点ブロックに対するバッファー付き DSP。
 * アンダーフロー時は無音を出力します。
 * @ko 네이티브 부동 소수점 블록을 버퍼링하여 DSP 처리합니다.
 * 언더플로 시 무음을 출력합니다.
 */
export class EffectProcessor {
  readonly [audioHandle]: AudioHandle<'worker'>;
  /**
   * Initialization result of the Worker effect factory.
   * @zh Worker 效果工厂初始化结果。
   * @ja Worker エフェクトファクトリーの初期化結果。
   * @ko Worker 효과 팩토리의 초기화 결과입니다.
   */
  readonly ready: Promise<boolean>;
  private readonly session: AudioWorkerSession;

  /**
   * Create a Worker effect processor, defaulting to 1024 frames per block,
   * an 8-block queue, and at most 8 channels.
   * @zh 创建 Worker 效果处理器，默认每块 1024 帧、8 块队列和最多 8 个声道。
   * @ja Worker エフェクトプロセッサーを作成します。既定値はブロックあたり
   * 1024 フレーム、8 ブロックのキュー、最大 8 チャンネルです。
   * @ko Worker 효과 처리기를 생성합니다. 기본값은 블록당 1024프레임,
   * 8블록 큐, 최대 8채널입니다.
   */
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
  /**
   * Return block processing and queue underrun/overrun statistics.
   * @zh 返回分块处理和队列欠载、溢出统计。
   * @ja ブロック処理とキューのアンダーラン・オーバーランの統計を返します。
   * @ko 블록 처리 및 큐 언더런과 오버런 통계를 반환합니다.
   */
  getWorkerStats(): AudioWorkerStats { return this.session.getStats(); }
  /**
   * Return the Worker error, or undefined if there is none.
   * @zh 返回 Worker 错误；没有错误时为 undefined。
   * @ja Worker のエラーを返します。エラーがなければ undefined。
   * @ko Worker 오류를 반환합니다. 오류가 없으면 undefined입니다.
   */
  getWorkerError(): Error | undefined { return this.session.error; }
  /**
   * Asynchronously close the effect Worker session.
   * @zh 异步关闭效果 Worker 会话。
   * @ja エフェクト Worker セッションを非同期で閉じます。
   * @ko 효과 Worker 세션을 비동기로 닫습니다.
   */
  close(): Promise<void> { return this.session.close(); }
}
