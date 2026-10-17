import {
  audioNative, audioHandle, audioAsync, AudioQueue,
} from '../internal/audio-native';
import { unsigned, channels, samples, type SoundChannel } from './value';
import { findAudioWriter } from '../internal/audio-codec-registry';
import type { SoundFileWriter } from './sound-file-writer';

/**
 * Asynchronously encode interleaved 16-bit PCM into an audio file whose format
 * is determined by the file extension.
 * @zh 将交错 16 位 PCM 异步编码到音频文件，格式由文件扩展名决定。
 * @ja 16 ビットインターリーブ PCM を音声ファイルに非同期でエンコードします。
 * 形式はファイルの拡張子で決まります。
 * @ko 16비트 인터리브 PCM을 오디오 파일로 비동기 인코딩합니다.
 * 형식은 파일 확장자로 결정됩니다.
 */
export class OutputSoundFile {
  readonly [audioHandle] = audioNative.createAudioOutput();
  private readonly queue = new AudioQueue();
  private writer?: SoundFileWriter;

  /**
   * Close the previous output and asynchronously create a file, with sample
   * rate in Hz; return whether it succeeded.
   * @zh 关闭旧输出并异步创建文件，采样率以 Hz 计，返回是否成功。
   * @ja 以前の出力を閉じて非同期でファイルを作成します。
   * サンプルレートの単位は Hz で、成功したかどうかを返します。
   * @ko 이전 출력을 닫고 파일을 비동기로 생성합니다.
   * 샘플 레이트는 Hz 단위이며 성공 여부를 반환합니다.
   */
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
  /**
   * Asynchronously encode samples in order; do not modify data until the
   * Promise settles.
   * @zh 按顺序异步编码样本；Promise 完成前不得修改 data。
   * @ja サンプルを順に非同期でエンコードします。
   * Promise の完了前に data を変更しないでください。
   * @ko 샘플을 순서대로 비동기 인코딩합니다.
   * Promise가 완료되기 전에 data를 수정하면 안 됩니다.
   */
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
  /**
   * Wait for all writes, flush the encoder, and close the file to ensure
   * complete file contents.
   * @zh 等待所有写入、刷新编码器并关闭文件，确保文件内容完整。
   * @ja すべての書き込みを待ち、エンコーダーをフラッシュしてファイルを閉じ、
   * ファイル内容の完全性を確保します。
   * @ko 모든 쓰기를 기다리고 인코더를 플러시한 뒤 파일을 닫아
   * 파일 내용이 완전히 기록되도록 합니다.
   */
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
