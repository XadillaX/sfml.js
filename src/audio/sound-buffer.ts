import {
  audioNative, audioHandle, audioAsync, AudioQueue, type AudioHandle,
  type AudioBufferMapping,
} from '../internal/audio-native';
import { nativeStruct } from '../internal/struct-view';
import { Time } from '../system/time';
import type { InputStream } from '../system/input-stream';
import { AudioInputStream } from '../internal/audio-input-stream';
import { audioReaders, audioWriters } from '../internal/audio-codec-registry';
import { InputSoundFile } from './input-sound-file';
import { OutputSoundFile } from './output-sound-file';
import {
  channels, unsigned, samples, type SoundChannel, type ReadonlySamples,
  type ChannelMap,
} from './value';

function view(mapping: AudioBufferMapping) {
  return nativeStruct<{
    sampleCount: bigint; sampleRate: number; channelCount: number;
    duration: bigint; samples: Int16Array; channelMap: Int32Array;
  }>(mapping.info, {
    samples: new Int16Array(mapping.samples),
    channelMap: new Int32Array(mapping.channelMap),
  });
}

/**
 * Read-only audio buffer interface; sample views retain their native storage.
 * @zh 音频缓冲区的只读接口，样本视图保留其对应的原生存储。
 * @ja 音声バッファーの読み取り専用インターフェース。
 * サンプルビューは対応するネイティブストレージを保持します。
 * @ko 오디오 버퍼의 읽기 전용 인터페이스입니다.
 * 샘플 뷰는 해당 네이티브 저장소를 유지합니다.
 */
export type ReadonlySoundBuffer = Readonly<Pick<SoundBuffer,
typeof audioHandle | 'getSamples' | 'getSampleCount' | 'getSampleRate' |
'getChannelCount' | 'getChannelMap' | 'getDuration' | 'saveToFile'>>;

export const adoptAudioBuffer: unique symbol = Symbol('Audio.adoptBuffer');

/**
 * Views retain the exact native allocation from which they were obtained.
 * @zh 视图保留获取时对应的原生内存分配。
 * @ja ビューは取得元となったネイティブメモリ割り当てをそのまま保持します。
 * @ko 뷰는 자신을 얻은 원래 네이티브 메모리 할당을 그대로 유지합니다.
 */
export class SoundBuffer {
  readonly [audioHandle]: AudioHandle<'buffer'>;
  private state: ReturnType<typeof view>;
  private readonly queue = new AudioQueue();

  /**
   * Create an empty audio buffer or deep-copy an existing buffer.
   * @zh 创建空音频缓冲区，或深复制现有缓冲区。
   * @ja 空の音声バッファーを作成するか、既存のバッファーをディープコピーします。
   * @ko 빈 오디오 버퍼를 생성하거나 기존 버퍼를 깊은 복사합니다.
   */
  constructor(source?: ReadonlySoundBuffer);
  /**
   * Copy interleaved 16-bit PCM; sample rate is in Hz and channelMap specifies
   * each channel's position.
   * @zh 复制交错 16 位 PCM；采样率以 Hz 计，channelMap 指定各声道位置。
   * @ja 16 ビットインターリーブ PCM をコピーします。サンプルレートは Hz、
   * channelMap は各チャンネルの位置を指定します。
   * @ko 16비트 인터리브 PCM을 복사합니다. 샘플 레이트는 Hz 단위이며
   * channelMap은 각 채널 위치를 지정합니다.
   */
  constructor(samples: Int16Array, channelCount: number, sampleRate: number,
    channelMap: Iterable<SoundChannel>);
  constructor(source?: ReadonlySoundBuffer | Int16Array,
    channelCount?: number, sampleRate?: number,
    channelMap?: Iterable<SoundChannel>) {
    let mapping: AudioBufferMapping & { handle: AudioHandle<'buffer'> };
    if (source instanceof Int16Array) {
      mapping = audioNative.createAudioBuffer(source, unsigned(sampleRate!),
        unsigned(channelCount!), channels(channelMap!));
    } else {
      if (source !== undefined && !(source instanceof SoundBuffer)) {
        throw new TypeError('Expected a SoundBuffer or Int16Array');
      }
      mapping = audioNative.createAudioBuffer(source?.[audioHandle]);
    }
    this[audioHandle] = mapping.handle;
    this.state = view(mapping);
  }
  /**
   * Copy the current source data synchronously, retaining this buffer's
   * identity.
   * @zh 同步复制源缓冲区的当前数据，保留当前缓冲区的身份。
   * @ja 元バッファーの現在のデータを同期的にコピーし、
   * このバッファーの同一性を保持します。
   * @ko 원본 버퍼의 현재 데이터를 동기적으로 복사하며 이 버퍼의 정체성을 유지합니다.
   */
  assign(source: ReadonlySoundBuffer): this {
    if (!(source instanceof SoundBuffer)) {
      throw new TypeError('Expected a SoundBuffer');
    }
    if (source === this) return this;
    this.state = view(audioNative.assignAudioBuffer(
      this[audioHandle], source[audioHandle]));
    return this;
  }
  /** @internal */
  static [adoptAudioBuffer](data: AudioHandle<'bufferData'>): SoundBuffer {
    const result = new SoundBuffer();
    result.state = view(audioNative.commitAudioBuffer(result[audioHandle], data));
    return result;
  }
  /**
   * Asynchronously decode an entire audio file into native PCM storage,
   * returning whether it succeeded.
   * @zh 异步解码整个音频文件到原生 PCM 存储，返回是否成功。
   * @ja 音声ファイル全体をネイティブ PCM ストレージに非同期でデコードし、
   * 成功したかどうかを返します。
   * @ko 전체 오디오 파일을 네이티브 PCM 저장소에 비동기로 디코딩하고
   * 성공 여부를 반환합니다.
   */
  loadFromFile(filename: string): Promise<boolean> {
    return audioReaders.size ? this.loadDecoded(filename) : this.load(filename);
  }
  /**
   * Asynchronously decode encoded audio bytes and replace the PCM,
   * returning whether it succeeded.
   * @zh 异步解码编码音频字节并替换 PCM，返回是否成功。
   * @ja エンコード済み音声バイトを非同期でデコードして PCM を置き換え、
   * 成功したかどうかを返します。
   * @ko 인코딩된 오디오 바이트를 비동기로 디코딩하여 PCM을 교체하고
   * 성공 여부를 반환합니다.
   */
  loadFromMemory(data: Uint8Array): Promise<boolean> {
    return audioReaders.size ? this.loadDecoded(data) : this.load(data);
  }
  /**
   * Asynchronously decode all samples from an input stream, returning whether
   * it succeeded; stream errors reject the Promise.
   * @zh 从输入流异步解码全部样本，返回是否成功；流异常会拒绝 Promise。
   * @ja 入力ストリームの全サンプルを非同期でデコードし、成功したかどうかを返します。
   * ストリームの例外は Promise を拒否します。
   * @ko 입력 스트림의 모든 샘플을 비동기로 디코딩하고 성공 여부를 반환합니다.
   * 스트림 오류는 Promise를 거부합니다.
   */
  loadFromStream(stream: InputStream): Promise<boolean> {
    return audioReaders.size ? this.loadDecoded(stream)
      : this.load(new AudioInputStream(stream));
  }

  /**
   * Synchronously copy interleaved 16-bit PCM and replace the contents;
   * sampleRate is in Hz. Return whether it succeeded.
   * @zh 同步复制交错 16 位 PCM 并替换内容；sampleRate 为 Hz，返回是否成功。
   * @ja 16 ビットインターリーブ PCM を同期的にコピーして内容を置き換えます。
   * sampleRate は Hz で、成功したかどうかを返します。
   * @ko 16비트 인터리브 PCM을 동기적으로 복사하여 내용을 교체합니다.
   * sampleRate는 Hz 단위이며 성공 여부를 반환합니다.
   */
  loadFromSamples(data: Int16Array, channelCount: number, sampleRate: number,
    channelMap: Iterable<SoundChannel>): boolean {
    samples(data);
    const result = audioNative.audioBufferSamples(data, unsigned(sampleRate),
      unsigned(channelCount), channels(channelMap));
    if (!result) return false;
    this.state = view(audioNative.commitAudioBuffer(this[audioHandle], result));
    return true;
  }
  /**
   * Return a read-only typed PCM view, or undefined for an empty buffer.
   * After reloading, existing views still reference the old storage.
   * @zh 返回 PCM 只读类型视图；空缓冲区为 undefined，
   * 重新加载后旧视图仍指向旧存储。
   * @ja PCM の読み取り専用型ビューを返します。空のバッファーでは undefined。
   * 再読み込み後も既存のビューは以前のストレージを参照します。
   * @ko PCM의 읽기 전용 타입 뷰를 반환하며, 빈 버퍼이면 undefined입니다.
   * 다시 로드한 후에도 기존 뷰는 이전 저장소를 참조합니다.
   */
  getSamples(): ReadonlySamples | undefined {
    return this.state.samples.length ? this.state.samples : undefined;
  }
  /**
   * Return the total sample count across all channels.
   * @zh 返回所有声道合计的样本数量。
   * @ja 全チャンネルのサンプル総数を返します。
   * @ko 모든 채널의 샘플 총수를 반환합니다.
   */
  getSampleCount(): bigint { return this.state.sampleCount; }
  /**
   * Return the sample rate per channel, in Hz.
   * @zh 返回每声道采样率，单位为 Hz。
   * @ja チャンネルごとのサンプルレートを Hz で返します。
   * @ko 채널별 샘플 레이트를 Hz 단위로 반환합니다.
   */
  getSampleRate(): number { return this.state.sampleRate; }
  /**
   * Return the number of channels.
   * @zh 返回声道数量。
   * @ja チャンネル数を返します。
   * @ko 채널 수를 반환합니다.
   */
  getChannelCount(): number { return this.state.channelCount; }
  /**
   * Return a read-only view of channel positions in interleaved order.
   * @zh 返回交错声道位置顺序的只读视图。
   * @ja インターリーブ順のチャンネル位置の読み取り専用ビューを返します。
   * @ko 인터리브 순서의 채널 위치를 나타내는 읽기 전용 뷰를 반환합니다.
   */
  getChannelMap(): ChannelMap { return this.state.channelMap; }
  /**
   * Return a copy of the total audio duration.
   * @zh 返回音频总时长副本。
   * @ja 音声全体の長さのコピーを返します。
   * @ko 오디오 전체 길이의 복사본을 반환합니다.
   */
  getDuration(): Time { return new Time(this.state.duration); }
  /**
   * Asynchronously encode and save using the file extension to select the
   * format, returning whether it succeeded.
   * @zh 按文件扩展名异步编码保存，返回是否成功。
   * @ja ファイルの拡張子に基づいて非同期でエンコード・保存し、
   * 成功したかどうかを返します。
   * @ko 파일 확장자에 따라 비동기로 인코딩하여 저장하고 성공 여부를 반환합니다.
   */
  saveToFile(filename: string): Promise<boolean> {
    if (audioWriters.size) {
      return this.queue.run(async () => {
        const output = new OutputSoundFile();
        try {
          const ok = await output.openFromFile(filename, this.getSampleRate(),
            this.getChannelCount(), this.getChannelMap());
          if (!ok) return false;
          if (this.state.samples.length) await output.write(this.state.samples);
          return true;
        } finally { await output.close(); }
      });
    }
    return this.queue.run(() => audioAsync(callback =>
      audioNative.saveAudioBuffer(this[audioHandle], filename, callback)));
  }
  private loadDecoded(input: string | Uint8Array | InputStream):
  Promise<boolean> {
    return this.queue.run(async () => {
      const file = new InputSoundFile();
      try {
        const ok = typeof input === 'string' ? await file.openFromFile(input)
          : input instanceof Uint8Array ? await file.openFromMemory(input)
            : await file.openFromStream(input);
        if (!ok) return false;
        const count = file.getSampleCount();
        if (count > 0xffffffffn) throw new RangeError('Sample buffer is too large');
        const data = new Int16Array(
          audioNative.allocateAudioSamples(Number(count)));
        let position = 0;
        while (position < data.length) {
          const read = Number(await file.read(data.subarray(position)));
          if (!read) return false;
          position += read;
        }
        return this.loadFromSamples(data, file.getChannelCount(),
          file.getSampleRate(), file.getChannelMap());
      } finally { await file.close(); }
    });
  }
  private load(input: string | Uint8Array | AudioInputStream): Promise<boolean> {
    return this.queue.run(async () => {
      const stream = input instanceof AudioInputStream ? input : undefined;
      try {
        const load = () => audioAsync<AudioHandle<'bufferData'> | undefined>(
          callback => audioNative.loadAudioBuffer(
            stream ? stream.handle : input as string | Uint8Array, callback));
        const data = await (stream ? stream.run(load) : load());
        if (!data) return false;
        this.state = view(audioNative.commitAudioBuffer(this[audioHandle], data));
        return true;
      } finally { stream?.close(); }
    });
  }
}
