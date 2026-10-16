import type { Time } from '../system/time';
import type { SoundChannel } from './value';

/** A module export is a factory receiving context and structured-clone data. */
export interface AudioWorkerModule {
  /** Worker 加载的模块路径或 URL，导出音频回调工厂函数。 */
  module: string | URL;
  /** 工厂函数导出名，省略时使用默认导出。 */
  exportName?: string;
  /** 通过结构化克隆传给工厂函数的初始数据。 */
  data?: unknown;
}
/** 音频 Worker 模块和分块队列配置。 */
export interface AudioWorkerOptions extends AudioWorkerModule {
  /** 每个块的帧数，默认 1024；一帧包含所有声道的样本。 */
  blockFrames?: number;
  /** 原生队列中的块数，默认 8。 */
  queueBlocks?: number;
}
/** 传给音频回调工厂的实际处理参数。 */
export interface AudioWorkerContext {
  /** 每个声道每秒的采样数，单位为 Hz。 */
  sampleRate: number;
  /** 每帧的声道数。 */
  channelCount: number;
  /** 每个处理块的帧数。 */
  blockFrames: number;
}
/** 自定义 PCM 播放流的格式和 Worker 配置。 */
export interface SoundStreamOptions extends AudioWorkerOptions {
  /** 采样率，单位为 Hz。 */
  sampleRate: number;
  /** 交错 PCM 的声道数。 */
  channelCount: number;
  /** 每个交错声道对应的扬声器位置。 */
  channelMap: Iterable<SoundChannel>;
}
/** samples aliases a reusable native slot, valid until the callback settles. */
export interface SoundStreamChunk {
  /** 原生可复用的交错 16 位 PCM 写入区，仅在本次回调完成前有效。 */
  readonly samples: Int16Array;
  /** 本次填入的交错样本总数，须为声道数的倍数且不超过 samples.length。 */
  sampleCount: number;
}
/** 在 Node Worker 中执行的播放流回调。 */
export interface SoundStreamCallbacks {
  /** 填充 chunk；返回 true 继续读取，false 表示当前块是最后一块。 */
  onGetData(chunk: SoundStreamChunk): boolean | Promise<boolean>;
  /** 将数据源移动到指定播放时刻。 */
  onSeek(offset: Time): void | Promise<void>;
  /** Called while preparing the final block; returns an interleaved sample
   * offset. undefined disables this loop, 0n restarts from the beginning. */
  onLoop?(): bigint | undefined | Promise<bigint | undefined>;
  /** Worker 会话关闭时释放数据源资源。 */
  onClose?(): void | Promise<void>;
}
/** 在 Node Worker 中执行的录音回调。 */
export interface SoundRecorderCallbacks {
  /** 开始采集前初始化；返回 false 拒绝启动。 */
  onStart?(): boolean | Promise<boolean>;
  /** 消费交错 16 位 PCM，视图仅在回调完成前有效；返回 false 停止录音。 */
  onProcessSamples(samples: Int16Array): boolean | Promise<boolean>;
  /** 停止采集并排空队列后执行收尾。 */
  onStop?(): void | Promise<void>;
}
/** 效果处理器实际消费和生成的帧数。 */
export interface EffectFrames {
  /** 已消费的输入帧数。 */
  inputFrameCount: number;
  /** 已写入的输出帧数。 */
  outputFrameCount: number;
}
/** 在 Node Worker 中执行的浮点 PCM 效果回调。 */
export interface EffectProcessorCallbacks {
  /** 处理交错浮点 PCM；input 为 null 时可继续生成尾音，视图仅在回调完成前有效。 */
  process(input: Float32Array | null, inputFrameCount: number,
    output: Float32Array, outputFrameCount: number,
    channelCount: number): EffectFrames | void | Promise<EffectFrames | void>;
  /** 效果会话关闭时执行清理。 */
  onClose?(): void | Promise<void>;
}
/** 原生音频分块队列的累计统计。 */
export interface AudioWorkerStats {
  /** 播放流为数据欠载次数；效果处理器为缺少的输出帧数。 */
  underruns: bigint;
  /** 队列满时丢弃的数量：录音器以交错样本计，效果处理器以帧计。 */
  overruns: bigint;
  /** 已处理数量：播放流和录音器以交错样本计，效果处理器以输入帧计。 */
  processed: bigint;
}
