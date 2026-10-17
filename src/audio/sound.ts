import { audioHandle, audioNative } from '../internal/audio-native';
import { SoundSource } from './sound-source';
import { SoundBuffer, type ReadonlySoundBuffer } from './sound-buffer';

/**
 * Play short sound effects from memory, holding a SoundBuffer to retain sample
 * storage.
 * @zh 播放内存中的短音效，持有 SoundBuffer 以保留样本存储。
 * @ja メモリ内の短い効果音を再生します。
 * SoundBuffer を保持してサンプルストレージを維持します。
 * @ko 메모리의 짧은 효과음을 재생하며, SoundBuffer를 보유하여 샘플 저장소를 유지합니다.
 */
export class Sound extends SoundSource {
  private buffer: ReadonlySoundBuffer;

  /**
   * Bind an audio buffer, or copy a Sound's attributes and buffer reference.
   * @zh 绑定音频缓冲区，或复制 Sound 的属性和缓冲区引用。
   * @ja 音声バッファーを関連付けるか、Sound の属性とバッファー参照をコピーします。
   * @ko 오디오 버퍼를 연결하거나 Sound의 속성과 버퍼 참조를 복사합니다.
   */
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
  /**
   * Copy attributes and buffer binding; stop and rewind this Sound.
   * @zh 复制属性和缓冲区绑定；停止当前 Sound 并将播放位置归零。
   * @ja 属性とバッファーの関連付けをコピーし、この Sound を停止して先頭に戻します。
   * @ko 속성과 버퍼 연결을 복사하고 현재 Sound를 정지하여 재생 위치를 처음으로 되돌립니다.
   */
  override assign(source: Sound): this {
    if (!(source instanceof Sound)) throw new TypeError('Expected a Sound');
    if (source === this) return this;
    audioNative.assignAudioSource(this[audioHandle], source[audioHandle], true);
    this.buffer = source.buffer;
    return this;
  }
  /**
   * Replace and retain the audio buffer reference, updating the native source.
   * @zh 替换并保留音频缓冲区引用，同时更新原生播放源。
   * @ja 音声バッファー参照を置き換えて保持し、ネイティブ再生音源を更新します。
   * @ko 오디오 버퍼 참조를 교체하여 유지하고 네이티브 재생 음원을 갱신합니다.
   */
  setBuffer(buffer: ReadonlySoundBuffer): void {
    if (!(buffer instanceof SoundBuffer)) throw new TypeError('Expected a SoundBuffer');
    audioNative.setAudioBuffer(this[audioHandle], buffer[audioHandle]);
    this.buffer = buffer;
  }
  /**
   * Return a read-only reference to the currently bound buffer.
   * @zh 返回当前绑定缓冲区的只读引用。
   * @ja 現在関連付けられているバッファーの読み取り専用参照を返します。
   * @ko 현재 연결된 버퍼의 읽기 전용 참조를 반환합니다.
   */
  getBuffer(): ReadonlySoundBuffer { return this.buffer; }
}
