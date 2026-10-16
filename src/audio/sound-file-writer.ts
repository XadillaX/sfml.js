import type { SoundChannel } from './value';

/** 自定义音频编码器接口，接受交错 16 位 PCM。 */
export abstract class SoundFileWriter {
  /** 创建输出文件；sampleRate 为 Hz，channelMap 为交错声道位置，返回是否成功。 */
  abstract open(filename: string, sampleRate: number, channelCount: number,
    channelMap: Iterable<SoundChannel>): boolean | Promise<boolean>;
  /** 编码并写入样本，异步完成前应保留输入内容。 */
  abstract write(samples: Int16Array): void | Promise<void>;
  /** Flush and release output resources. Called by OutputSoundFile.close(). */
  close(): void | Promise<void> {}
}
/** 可注册的编码器类，需提供无参数构造和文件名格式探测方法。 */
export interface SoundFileWriterConstructor {
  /** 创建尚未打开的编码器实例。 */
  new (): SoundFileWriter;
  /** 按文件名判断是否支持该输出格式。 */
  check(filename: string): boolean | Promise<boolean>;
}
