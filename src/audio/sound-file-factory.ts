import {
  audioNative, audioAsync, AudioQueue, type AudioHandle,
  type AudioReaderInfoMapping,
} from '../internal/audio-native';
import { AudioInputStream } from '../internal/audio-input-stream';
import {
  audioReaders, audioWriters, findAudioReaderInput, findAudioWriter,
} from '../internal/audio-codec-registry';
import { SoundFileReader, SoundFileReaderInfo,
  type SoundFileReaderConstructor } from './sound-file-reader';
import { SoundFileWriter,
  type SoundFileWriterConstructor } from './sound-file-writer';
import { channels, unsigned, samples, type SoundChannel } from './value';
import type { InputStream } from '../system/input-stream';

class NativeReader extends SoundFileReader {
  private readonly queue = new AudioQueue();
  private stream?: AudioInputStream;
  constructor(private readonly handle: AudioHandle<'reader'>) { super(); }
  open(stream: InputStream): Promise<SoundFileReaderInfo | undefined> {
    return this.queue.run(async () => {
      const next = new AudioInputStream(stream);
      try {
        if (await stream.seek(0n) !== 0n) return undefined;
        const mapping = await next.run(() =>
          audioAsync<AudioReaderInfoMapping | undefined>(callback =>
            audioNative.openAudioReader(this.handle, next.handle, callback)));
        if (!mapping) return undefined;
        this.stream?.close();
        this.stream = next;
        return new SoundFileReaderInfo(undefined, mapping);
      } finally {
        if (this.stream !== next) next.close();
      }
    });
  }
  read(data: Int16Array): Promise<bigint> {
    samples(data);
    return this.queue.run(() => this.run(() => audioAsync(callback =>
      audioNative.readAudioReader(this.handle, data, callback))));
  }
  seek(offset: bigint): Promise<void> {
    return this.queue.run(() => this.run(() => audioAsync(callback =>
      audioNative.seekAudioReader(this.handle, offset, callback))));
  }
  close(): Promise<void> {
    return this.queue.run(async () => {
      await audioAsync<void>(callback =>
        audioNative.closeAudioReader(this.handle, callback));
      this.stream?.close();
      this.stream = undefined;
    });
  }
  private run<T>(action: () => Promise<T>): Promise<T> {
    return this.stream ? this.stream.run(action) : action();
  }
}

class NativeWriter extends SoundFileWriter {
  private readonly queue = new AudioQueue();
  private opened = false;
  constructor(private readonly handle: AudioHandle<'writer'>) { super(); }
  open(filename: string, rate: number, count: number,
    map: Iterable<SoundChannel>): Promise<boolean> {
    const channelMap = channels(map);
    unsigned(rate);
    unsigned(count);
    return this.queue.run(async () => {
      this.opened = await audioAsync<boolean>(callback =>
        audioNative.openAudioWriter(this.handle, filename, rate, count,
          channelMap, callback));
      return this.opened;
    });
  }
  write(data: Int16Array): Promise<void> {
    samples(data);
    return this.queue.run(async () => {
      if (!this.opened) throw new Error('Writer is not open');
      await audioAsync<void>(callback =>
        audioNative.writeAudioWriter(this.handle, data, callback));
    });
  }
  close(): Promise<void> {
    return this.queue.run(async () => {
      await audioAsync<void>(callback =>
        audioNative.closeAudioWriter(this.handle, callback));
      this.opened = false;
    });
  }
}

/**
 * Registrations belong to the current Node environment.
 * @zh 注册项属于当前 Node 环境。
 * @ja 登録は現在の Node 環境に属します。
 * @ko 등록 항목은 현재 Node 환경에 속합니다.
 */
export class SoundFileFactory {
  /**
   * Register a custom decoder class with a static check method in the current
   * Node environment.
   * @zh 在当前 Node 环境注册带有静态 check 方法的自定义解码器类。
   * @ja 静的 check メソッドを持つカスタムデコーダークラスを
   * 現在の Node 環境に登録します。
   * @ko 정적 check 메서드가 있는 사용자 정의 디코더 클래스를
   * 현재 Node 환경에 등록합니다.
   */
  static registerReader(reader: SoundFileReaderConstructor): void {
    if (typeof reader !== 'function' ||
        !(reader.prototype instanceof SoundFileReader) ||
        typeof reader.check !== 'function') {
      throw new TypeError('Expected a SoundFileReader class with static check()');
    }
    audioReaders.add(reader);
  }
  /**
   * Unregister a custom decoder class.
   * @zh 取消自定义解码器类的注册。
   * @ja カスタムデコーダークラスの登録を解除します。
   * @ko 사용자 정의 디코더 클래스의 등록을 해제합니다.
   */
  static unregisterReader(reader: SoundFileReaderConstructor): void {
    audioReaders.delete(reader);
  }
  /**
   * Check whether a custom decoder class is registered.
   * @zh 判断自定义解码器类是否已注册。
   * @ja カスタムデコーダークラスが登録済みか判定します。
   * @ko 사용자 정의 디코더 클래스의 등록 여부를 확인합니다.
   */
  static isReaderRegistered(reader: SoundFileReaderConstructor): boolean {
    return audioReaders.has(reader);
  }
  /**
   * Register a custom encoder class with a static check method in the current
   * Node environment.
   * @zh 在当前 Node 环境注册带有静态 check 方法的自定义编码器类。
   * @ja 静的 check メソッドを持つカスタムエンコーダークラスを
   * 現在の Node 環境に登録します。
   * @ko 정적 check 메서드가 있는 사용자 정의 인코더 클래스를
   * 현재 Node 환경에 등록합니다.
   */
  static registerWriter(writer: SoundFileWriterConstructor): void {
    if (typeof writer !== 'function' ||
        !(writer.prototype instanceof SoundFileWriter) ||
        typeof writer.check !== 'function') {
      throw new TypeError('Expected a SoundFileWriter class with static check()');
    }
    audioWriters.add(writer);
  }
  /**
   * Unregister a custom encoder class.
   * @zh 取消自定义编码器类的注册。
   * @ja カスタムエンコーダークラスの登録を解除します。
   * @ko 사용자 정의 인코더 클래스의 등록을 해제합니다.
   */
  static unregisterWriter(writer: SoundFileWriterConstructor): void {
    audioWriters.delete(writer);
  }
  /**
   * Check whether a custom encoder class is registered.
   * @zh 判断自定义编码器类是否已注册。
   * @ja カスタムエンコーダークラスが登録済みか判定します。
   * @ko 사용자 정의 인코더 클래스의 등록 여부를 확인합니다.
   */
  static isWriterRegistered(writer: SoundFileWriterConstructor): boolean {
    return audioWriters.has(writer);
  }
  /**
   * Probe a file and create a matching decoder; return undefined if none
   * matches. Calling open is still required before use.
   * @zh 探测文件并创建匹配的解码器；未匹配返回 undefined，使用前仍需 open。
   * @ja ファイルを判定して対応するデコーダーを作成します。
   * 対応しない場合は undefined。使用前には別途 open が必要です。
   * @ko 파일을 탐지하여 일치하는 디코더를 생성합니다.
   * 일치 항목이 없으면 undefined이며, 사용 전 open을 호출해야 합니다.
   */
  static createReaderFromFilename(filename: string):
  Promise<SoundFileReader | undefined> { return this.createReader(filename); }
  /**
   * Probe encoded audio bytes and create a matching decoder, or return
   * undefined if none matches.
   * @zh 探测编码音频字节并创建匹配的解码器，未匹配返回 undefined。
   * @ja エンコード済み音声バイトを判定し、対応するデコーダーを作成します。
   * 対応しない場合は undefined を返します。
   * @ko 인코딩된 오디오 바이트를 탐지하여 일치하는 디코더를 생성합니다.
   * 일치 항목이 없으면 undefined를 반환합니다.
   */
  static createReaderFromMemory(data: Uint8Array):
  Promise<SoundFileReader | undefined> { return this.createReader(data); }
  /**
   * Probe stream contents and create a matching decoder, or return undefined
   * if none matches.
   * @zh 探测流内容并创建匹配的解码器，未匹配返回 undefined。
   * @ja ストリームの内容を判定して対応するデコーダーを作成します。
   * 対応しない場合は undefined を返します。
   * @ko 스트림 내용을 탐지하여 일치하는 디코더를 생성합니다.
   * 일치 항목이 없으면 undefined를 반환합니다.
   */
  static createReaderFromStream(stream: InputStream):
  Promise<SoundFileReader | undefined> { return this.createReader(stream); }
  /**
   * Create an encoder by filename; return undefined if none matches.
   * Calling open is still required before writing.
   * @zh 按文件名创建编码器；未匹配返回 undefined，写入前仍需 open。
   * @ja ファイル名からエンコーダーを作成します。対応しない場合は undefined。
   * 書き込み前には別途 open が必要です。
   * @ko 파일명을 기준으로 인코더를 생성합니다. 일치 항목이 없으면 undefined이며,
   * 쓰기 전에 open을 호출해야 합니다.
   */
  static async createWriterFromFilename(filename: string):
  Promise<SoundFileWriter | undefined> {
    const custom = await findAudioWriter(filename);
    if (custom) return custom;
    const handle = audioNative.createAudioWriter(filename);
    return handle ? new NativeWriter(handle) : undefined;
  }
  private static async createReader(input: string | Uint8Array | InputStream):
  Promise<SoundFileReader | undefined> {
    const custom = await findAudioReaderInput(input);
    if (custom) {
      await custom.owned?.close();
      return custom.reader;
    }
    const bridge = typeof input === 'string' || input instanceof Uint8Array
      ? undefined : new AudioInputStream(input);
    try {
      const create = () => audioAsync<AudioHandle<'reader'> | undefined>(
        callback => audioNative.createAudioReader(
          bridge ? bridge.handle : input as string | Uint8Array, callback));
      const handle = await (bridge ? bridge.run(create) : create());
      return handle ? new NativeReader(handle) : undefined;
    } finally { bridge?.close(); }
  }
}
