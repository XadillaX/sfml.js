import { audioHandle, audioNative } from '../internal/audio-native';
import { SoundSource } from './sound-source';
import { SoundBuffer, type ReadonlySoundBuffer } from './sound-buffer';

/** 播放内存中的短音效，持有 SoundBuffer 以保留样本存储。 */
export class Sound extends SoundSource {
  private buffer: ReadonlySoundBuffer;

  /** 绑定音频缓冲区，或复制 Sound 的属性和缓冲区引用。 */
  constructor(bufferOrSource: ReadonlySoundBuffer | Sound) {
    const source = bufferOrSource instanceof Sound ? bufferOrSource : undefined;
    const buffer = source ? source.getBuffer() : bufferOrSource;
    if (!(buffer instanceof SoundBuffer)) {
      throw new TypeError('Expected a SoundBuffer or a Sound');
    }
    super(audioNative.createAudioSource(buffer[audioHandle],
      source?.[audioHandle]));
    this.buffer = buffer;
  }
  /** Copy attributes and buffer binding; stop and rewind this Sound. */
  override assign(source: Sound): this {
    if (!(source instanceof Sound)) throw new TypeError('Expected a Sound');
    if (source === this) return this;
    audioNative.assignAudioSource(this[audioHandle], source[audioHandle], true);
    this.buffer = source.buffer;
    return this;
  }
  /** 替换并保留音频缓冲区引用，同时更新原生播放源。 */
  setBuffer(buffer: ReadonlySoundBuffer): void {
    if (!(buffer instanceof SoundBuffer)) throw new TypeError('Expected a SoundBuffer');
    audioNative.setAudioBuffer(this[audioHandle], buffer[audioHandle]);
    this.buffer = buffer;
  }
  /** 返回当前绑定缓冲区的只读引用。 */
  getBuffer(): ReadonlySoundBuffer { return this.buffer; }
}
