import { native } from './native';
import type { NativeStruct } from './struct-view';
import type { NativeStreamDispatch } from './native';

declare const audioBrand: unique symbol;
export interface AudioHandle<T extends string> { readonly [audioBrand]: T }
type Callback<T> = (error: Error | null, result: T) => void;
export interface AudioBufferMapping {
  info: NativeStruct;
  samples: ArrayBuffer;
  channelMap: ArrayBuffer;
}
export interface AudioSourceMapping {
  handle: AudioHandle<'source'>;
  values: ArrayBuffer;
  times: ArrayBuffer;
}
export interface AudioFileMapping {
  buffer: ArrayBuffer;
  channelMap: ArrayBuffer;
}
export interface AudioWorkerMapping {
  handle: AudioHandle<'worker'>;
  fields: ArrayBuffer;
  time: ArrayBuffer;
  input: ArrayBuffer[];
  output: ArrayBuffer[];
}
export interface AudioReaderInfoMapping {
  handle: AudioHandle<'readerInfo'>;
  info: NativeStruct;
  channelMap: ArrayBuffer;
}
export interface AudioBinding {
  createAudioReaderInfo(): AudioReaderInfoMapping;
  setAudioReaderChannels(handle: AudioHandle<'readerInfo'>,
    map: Int32Array): ArrayBuffer;
  createAudioReader(input: string | Uint8Array | AudioHandle<'stream'>,
    callback: Callback<AudioHandle<'reader'> | undefined>): void;
  openAudioReader(handle: AudioHandle<'reader'>, stream: AudioHandle<'stream'>,
    callback: Callback<AudioReaderInfoMapping | undefined>): void;
  readAudioReader(handle: AudioHandle<'reader'>, samples: Int16Array,
    callback: Callback<bigint>): void;
  seekAudioReader(handle: AudioHandle<'reader'>, offset: bigint,
    callback: Callback<void>): void;
  closeAudioReader(handle: AudioHandle<'reader'>, callback: Callback<void>): void;
  createAudioWriter(filename: string): AudioHandle<'writer'> | undefined;
  openAudioWriter(handle: AudioHandle<'writer'>, filename: string,
    rate: number, count: number, map: Int32Array,
    callback: Callback<boolean>): void;
  writeAudioWriter(handle: AudioHandle<'writer'>, samples: Int16Array,
    callback: Callback<void>): void;
  closeAudioWriter(handle: AudioHandle<'writer'>, callback: Callback<void>): void;
  createAudioFileMetadata(info: AudioHandle<'readerInfo'>): AudioFileMapping & {
    handle: AudioHandle<'fileMetadata'>;
  };
  updateAudioFileMetadata(handle: AudioHandle<'fileMetadata'>,
    operation: number, count?: bigint): void;
  allocateAudioSamples(count: number): ArrayBuffer;
  createAudioInputStream(dispatch: NativeStreamDispatch): AudioHandle<'stream'>;
  closeAudioInputStream(handle: AudioHandle<'stream'>): void;
  createAudioRecorder(buffer: boolean): {
    handle: AudioHandle<'recorder'>; values: ArrayBuffer; channelMap: ArrayBuffer;
  };
  prepareAudioRecorder(handle: AudioHandle<'recorder'>, rate: number,
    frames: number, slots: number, callback: Callback<{
      handle?: AudioHandle<'worker'>; token?: bigint;
    }>, callbacks?: boolean): void;
  startAudioRecorder(handle: AudioHandle<'recorder'>,
    callback: Callback<boolean>): void;
  stopAudioRecorder(handle: AudioHandle<'recorder'>,
    callback: Callback<AudioHandle<'bufferData'> | undefined>): void;
  /** 创建独立录音会话的 Native PCM 聚合器，快照当前采样率和声道映射。 */
  createAudioRecorderBuffer(handle: AudioHandle<'recorder'>):
  AudioHandle<'recorderBuffer'>;
  /** 重置或完成 Native PCM 聚合，返回独立的 SoundBuffer 数据句柄。 */
  audioRecorderBuffer(handle: AudioHandle<'recorderBuffer'>,
    command: 0 | 2): AudioHandle<'bufferData'>;
  /** 追加交错 16 位 PCM 样本；只接受完整声道帧，数据由 Native 持有。 */
  audioRecorderBuffer(handle: AudioHandle<'recorderBuffer'>,
    command: 1, samples: Int16Array): void;
  audioRecorderDevice(handle: AudioHandle<'recorder'>): string;
  audioRecorderDevice(handle: AudioHandle<'recorder'>, name: string,
    callback: Callback<boolean>): void;
  audioRecorderChannels(handle: AudioHandle<'recorder'>,
    count: number): ArrayBuffer;
  audioCaptureDevices(command: 0): string[];
  audioCaptureDevices(command: 1): string;
  audioCaptureDevices(command: 2): boolean;
  createAudioStream(frames: number, channels: number, rate: number, slots: number,
    map: Int32Array): AudioSourceMapping & {
    token: bigint; worker: AudioHandle<'worker'>;
  };
  openAudioMusicStream(source: AudioHandle<'source'>, frames: number,
    channels: number, rate: number, slots: number, map: Int32Array,
    sampleCount: bigint): { handle: AudioHandle<'worker'>; token: bigint };
  attachAudioWorker(token: bigint): AudioWorkerMapping;
  pollAudioWorker(handle: AudioHandle<'worker'>): number;
  commitAudioWorker(handle: AudioHandle<'worker'>, more?: boolean): void;
  closeAudioWorker(handle: AudioHandle<'worker'>): void;
  audioWorkerStats(handle: AudioHandle<'worker'>): ArrayBuffer;
  createAudioEffect(frames: number, channels: number, slots: number): {
    handle: AudioHandle<'worker'>; token: bigint;
  };
  setAudioEffect(source: AudioHandle<'source'>,
    effect?: AudioHandle<'worker'>): void;
  createAudioDeviceState(): { handle: AudioHandle<'device'>; buffer: ArrayBuffer };
  audioDevice(handle: AudioHandle<'device'>, command: number,
    name?: string): string | string[] | undefined;
  audioDeviceNotifications(callback?: ((event: number) => void) | null): void;
  createAudioBuffer(source?: AudioHandle<'buffer'>):
  AudioBufferMapping & { handle: AudioHandle<'buffer'> };
  createAudioBuffer(samples: Int16Array, rate: number, channels: number,
    map: Int32Array): AudioBufferMapping & { handle: AudioHandle<'buffer'> };
  assignAudioBuffer(target: AudioHandle<'buffer'>,
    source: AudioHandle<'buffer'>): AudioBufferMapping;
  loadAudioBuffer(input: string | Uint8Array | AudioHandle<'stream'>,
    callback: Callback<AudioHandle<'bufferData'> | undefined>): void;
  audioBufferSamples(samples: Int16Array, rate: number, channels: number,
    map: Int32Array): AudioHandle<'bufferData'> | undefined;
  commitAudioBuffer(handle: AudioHandle<'buffer'>,
    data: AudioHandle<'bufferData'>): AudioBufferMapping;
  saveAudioBuffer(handle: AudioHandle<'buffer'>, path: string,
    callback: Callback<boolean>): void;
  createAudioSource(buffer?: AudioHandle<'buffer'>,
    source?: AudioHandle<'source'>): AudioSourceMapping;
  setAudioBuffer(source: AudioHandle<'source'>, buffer: AudioHandle<'buffer'>): void;
  assignAudioSource(target: AudioHandle<'source'>, source: AudioHandle<'source'>,
    fullSound: boolean): void;
  audioSourceField(source: AudioHandle<'source'>, field: number,
    write: boolean): void;
  audioSourceCommand(source: AudioHandle<'source'>, command: number): void;
  openAudioMusic(source: AudioHandle<'source'>, input: string | Uint8Array,
    callback: Callback<boolean>): void;
  closeAudioMusic(source: AudioHandle<'source'>): void;
  audioSourceChannels(source: AudioHandle<'source'>): ArrayBuffer;
  createAudioListener(): { handle: AudioHandle<'listener'>; buffer: ArrayBuffer };
  audioListenerField(handle: AudioHandle<'listener'>, field: number,
    write: boolean): void;
  createAudioValue(kind: number): ArrayBuffer;
  createAudioInput(): AudioFileMapping & { handle: AudioHandle<'input'> };
  openAudioInput(handle: AudioHandle<'input'>,
    input: string | Uint8Array | AudioHandle<'stream'>,
    callback: Callback<AudioFileMapping | undefined>): void;
  readAudioInput(handle: AudioHandle<'input'>, samples: Int16Array,
    callback: Callback<void>): void;
  seekAudioInput(handle: AudioHandle<'input'>, offset: bigint, time: boolean,
    callback: Callback<void>): void;
  closeAudioInput(handle: AudioHandle<'input'>,
    callback: Callback<AudioFileMapping>): void;
  createAudioOutput(): AudioHandle<'output'>;
  openAudioOutput(handle: AudioHandle<'output'>, path: string, rate: number,
    channels: number, map: Int32Array, callback: Callback<boolean>): void;
  writeAudioOutput(handle: AudioHandle<'output'>, samples: Int16Array,
    callback: Callback<void>): void;
  closeAudioOutput(handle: AudioHandle<'output'>, callback: Callback<void>): void;
}

export const audioNative: AudioBinding = native as unknown as AudioBinding;
export const audioHandle: unique symbol = Symbol('Audio.native');

export function audioAsync<T>(start: (callback: Callback<T>) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    start((error, result) => (error ? reject(error) : resolve(result)));
  });
}

/** Operations sharing a file cursor execute in invocation order. */
export class AudioQueue {
  private pending = Promise.resolve();
  run<T>(action: () => Promise<T>): Promise<T> {
    const next = this.pending.then(action);
    this.pending = next.then(() => undefined, () => undefined);
    return next;
  }
}
