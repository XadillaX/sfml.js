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

/** Registrations belong to the current Node environment. */
export class SoundFileFactory {
  /** 在当前 Node 环境注册带有静态 check 方法的自定义解码器类。 */
  static registerReader(reader: SoundFileReaderConstructor): void {
    if (typeof reader !== 'function' ||
        !(reader.prototype instanceof SoundFileReader) ||
        typeof reader.check !== 'function') {
      throw new TypeError('Expected a SoundFileReader class with static check()');
    }
    audioReaders.add(reader);
  }
  /** 取消自定义解码器类的注册。 */
  static unregisterReader(reader: SoundFileReaderConstructor): void {
    audioReaders.delete(reader);
  }
  /** 判断自定义解码器类是否已注册。 */
  static isReaderRegistered(reader: SoundFileReaderConstructor): boolean {
    return audioReaders.has(reader);
  }
  /** 在当前 Node 环境注册带有静态 check 方法的自定义编码器类。 */
  static registerWriter(writer: SoundFileWriterConstructor): void {
    if (typeof writer !== 'function' ||
        !(writer.prototype instanceof SoundFileWriter) ||
        typeof writer.check !== 'function') {
      throw new TypeError('Expected a SoundFileWriter class with static check()');
    }
    audioWriters.add(writer);
  }
  /** 取消自定义编码器类的注册。 */
  static unregisterWriter(writer: SoundFileWriterConstructor): void {
    audioWriters.delete(writer);
  }
  /** 判断自定义编码器类是否已注册。 */
  static isWriterRegistered(writer: SoundFileWriterConstructor): boolean {
    return audioWriters.has(writer);
  }
  /** 探测文件并创建匹配的解码器；未匹配返回 undefined，使用前仍需 open。 */
  static createReaderFromFilename(filename: string):
  Promise<SoundFileReader | undefined> { return this.createReader(filename); }
  /** 探测编码音频字节并创建匹配的解码器，未匹配返回 undefined。 */
  static createReaderFromMemory(data: Uint8Array):
  Promise<SoundFileReader | undefined> { return this.createReader(data); }
  /** 探测流内容并创建匹配的解码器，未匹配返回 undefined。 */
  static createReaderFromStream(stream: InputStream):
  Promise<SoundFileReader | undefined> { return this.createReader(stream); }
  /** 按文件名创建编码器；未匹配返回 undefined，写入前仍需 open。 */
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
