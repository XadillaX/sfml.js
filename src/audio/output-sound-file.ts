import {
  audioNative, audioHandle, audioAsync, AudioQueue,
} from '../internal/audio-native';
import { unsigned, channels, samples, type SoundChannel } from './value';
import { findAudioWriter } from '../internal/audio-codec-registry';
import type { SoundFileWriter } from './sound-file-writer';

/** 将交错 16 位 PCM 异步编码到音频文件，格式由文件扩展名决定。 */
export class OutputSoundFile {
  readonly [audioHandle] = audioNative.createAudioOutput();
  private readonly queue = new AudioQueue();
  private writer?: SoundFileWriter;

  /** 关闭旧输出并异步创建文件，采样率以 Hz 计，返回是否成功。 */
  openFromFile(filename: string, sampleRate: number, channelCount: number,
    channelMap: Iterable<SoundChannel>): Promise<boolean> {
    unsigned(sampleRate);
    unsigned(channelCount);
    const map = channels(channelMap);
    return this.queue.run(async () => {
      await this.closeCurrent();
      const writer = await findAudioWriter(filename);
      if (!writer) {
        return audioAsync<boolean>(callback =>
          audioNative.openAudioOutput(this[audioHandle], filename, sampleRate,
            channelCount, map, callback));
      }
      let opened = false;
      try {
        const result = await writer.open(filename, sampleRate, channelCount, map);
        if (typeof result !== 'boolean') {
          throw new TypeError('Writer.open must return a boolean');
        }
        opened = result;
        if (opened) this.writer = writer;
        return opened;
      } finally { if (!opened) await writer.close(); }
    });
  }
  /** 按顺序异步编码样本；Promise 完成前不得修改 data。 */
  write(data: Int16Array): Promise<void> {
    samples(data);
    return this.queue.run(async () => {
      if (this.writer) {
        await this.writer.write(data);
      } else {
        await audioAsync<void>(callback =>
          audioNative.writeAudioOutput(this[audioHandle], data, callback));
      }
    });
  }
  /** 等待所有写入、刷新编码器并关闭文件，确保文件内容完整。 */
  close(): Promise<void> {
    return this.queue.run(() => this.closeCurrent());
  }
  private async closeCurrent(): Promise<void> {
    const writer = this.writer;
    this.writer = undefined;
    try { await writer?.close(); } finally {
      await audioAsync<void>(callback =>
        audioNative.closeAudioOutput(this[audioHandle], callback));
    }
  }
}
