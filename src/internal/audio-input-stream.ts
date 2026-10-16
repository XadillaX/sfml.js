import { audioNative, type AudioHandle } from './audio-native';
import { streamDispatch } from './input-stream';
import type { InputStream } from '../system/input-stream';

/** 仅标记原生桥在明确关闭后返回的取消错误，不保留其生命周期。 */
const cancellations = new WeakSet<Error>();

/** 判断错误是否来自原生 InputStream 关闭；用户回调错误不会被标记。 */
export function isAudioInputCancellation(error: unknown): boolean {
  return error instanceof Error && cancellations.has(error);
}

export class AudioInputStream {
  readonly handle: AudioHandle<'stream'>;
  private readonly failure: { failed: boolean; error?: unknown };
  /** 当前原生桥是否已经收到显式取消请求。 */
  private closed = false;
  constructor(stream: InputStream) {
    const failure = { failed: false, error: undefined as unknown };
    this.failure = failure;
    this.handle = audioNative.createAudioInputStream(
      streamDispatch(stream, error => {
        failure.failed = true;
        failure.error = error;
      }));
  }
  async run<T>(action: () => Promise<T>): Promise<T> {
    this.failure.failed = false;
    try { return await action(); } catch (error) {
      if (this.failure.failed) throw this.failure.error;
      if (this.closed && error instanceof Error &&
          error.message === 'Audio InputStream closed') {
        cancellations.add(error);
      }
      throw error;
    }
  }
  close(): void {
    this.closed = true;
    audioNative.closeAudioInputStream(this.handle);
  }
}
