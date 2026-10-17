import {
  audioNative, audioHandle, audioAsync, AudioQueue, type AudioHandle,
  type AudioFileMapping,
} from '../internal/audio-native';
import { Time } from '../system/time';
import type { InputStream } from '../system/input-stream';
import { AudioInputStream } from '../internal/audio-input-stream';
import { findAudioReaderInput } from '../internal/audio-codec-registry';
import { SoundFileReaderInfo } from './sound-file-reader';
import type { ReadonlyValue as R } from '../internal/value-storage';
import { duration, samples, type ChannelMap } from './value';

export const cancelAudioInput: unique symbol = Symbol('Audio.cancelInput');

/**
 * Seekable audio decoder reading interleaved 16-bit PCM asynchronously in
 * invocation order.
 * @zh 可寻址音频解码器，按调用顺序异步读取交错 16 位 PCM。
 * @ja 呼び出し順に非同期で 16 ビットインターリーブ PCM を読み取る、
 * シーク可能な音声デコーダー。
 * @ko 호출 순서대로 16비트 인터리브 PCM을 비동기로 읽는 탐색 가능한 오디오 디코더입니다.
 */
export class InputSoundFile {
  readonly [audioHandle]: AudioHandle<'input'>;
  private readonly queue = new AudioQueue();
  private u64: BigUint64Array;
  private i64: BigInt64Array;
  private u32: Uint32Array;
  private channelMap: Int32Array;
  private stream?: AudioInputStream;
  private custom?: NonNullable<Awaited<ReturnType<typeof findAudioReaderInput>>>;
  private customMetadata?: AudioHandle<'fileMetadata'>;

  /**
   * Create a decoder with no open data source.
   * @zh 创建未打开数据源的解码器。
   * @ja データソースを開いていないデコーダーを作成します。
   * @ko 데이터 소스가 열리지 않은 디코더를 생성합니다.
   */
  constructor() {
    const mapping = audioNative.createAudioInput();
    this[audioHandle] = mapping.handle;
    this.u64 = new BigUint64Array(mapping.buffer);
    this.i64 = new BigInt64Array(mapping.buffer);
    this.u32 = new Uint32Array(mapping.buffer);
    this.channelMap = new Int32Array(mapping.channelMap);
  }
  /**
   * Asynchronously open an audio file and read its format information,
   * returning whether it succeeded.
   * @zh 异步打开音频文件并读取格式信息，返回是否成功。
   * @ja 音声ファイルを非同期で開いて形式情報を読み取り、成功したかどうかを返します。
   * @ko 오디오 파일을 비동기로 열고 형식 정보를 읽어 성공 여부를 반환합니다.
   */
  openFromFile(filename: string): Promise<boolean> { return this.open(filename); }
  /**
   * Asynchronously open encoded audio bytes, returning whether it succeeded.
   * @zh 异步打开编码音频字节，返回是否成功。
   * @ja エンコード済み音声バイトを非同期で開き、成功したかどうかを返します。
   * @ko 인코딩된 오디오 바이트를 비동기로 열고 성공 여부를 반환합니다.
   */
  openFromMemory(data: Uint8Array): Promise<boolean> { return this.open(data); }
  /**
   * Asynchronously open a seekable stream, retaining the data source reference
   * during reading.
   * @zh 异步打开可寻址流，读取期间保留数据源引用。
   * @ja シーク可能なストリームを非同期で開き、読み取り中はデータソース参照を保持します。
   * @ko 탐색 가능한 스트림을 비동기로 열고 읽는 동안 데이터 소스 참조를 유지합니다.
   */
  openFromStream(stream: InputStream): Promise<boolean> {
    return this.open(stream);
  }
  /**
   * Return the total sample count across all channels.
   * @zh 返回所有声道合计的样本总数。
   * @ja 全チャンネルのサンプル総数を返します。
   * @ko 모든 채널의 샘플 총수를 반환합니다.
   */
  getSampleCount(): bigint { return this.u64[0]; }
  /**
   * Return the current sample offset, including all interleaved channels.
   * @zh 返回当前样本偏移，包含所有交错声道。
   * @ja 全インターリーブチャンネルを含む現在のサンプルオフセットを返します。
   * @ko 모든 인터리브 채널을 포함하는 현재 샘플 오프셋을 반환합니다.
   */
  getSampleOffset(): bigint { return this.u64[1]; }
  /**
   * Return the total audio duration.
   * @zh 返回音频总时长。
   * @ja 音声全体の長さを返します。
   * @ko 오디오의 전체 길이를 반환합니다.
   */
  getDuration(): Time { return new Time(this.i64[2]); }
  /**
   * Return the time corresponding to the current decoding position.
   * @zh 返回当前解码位置对应的时间。
   * @ja 現在のデコード位置に対応する時刻を返します。
   * @ko 현재 디코딩 위치에 해당하는 시간을 반환합니다.
   */
  getTimeOffset(): Time { return new Time(this.i64[3]); }
  /**
   * Return the sample rate per channel, in Hz.
   * @zh 返回每声道采样率，单位为 Hz。
   * @ja チャンネルごとのサンプルレートを Hz で返します。
   * @ko 채널별 샘플 레이트를 Hz 단위로 반환합니다.
   */
  getSampleRate(): number { return this.u32[10]; }
  /**
   * Return the number of channels.
   * @zh 返回声道数。
   * @ja チャンネル数を返します。
   * @ko 채널 수를 반환합니다.
   */
  getChannelCount(): number { return this.u32[11]; }
  /**
   * Return the position mapping of interleaved channels.
   * @zh 返回交错声道的位置映射。
   * @ja インターリーブチャンネルの位置マッピングを返します。
   * @ko 인터리브 채널의 위치 매핑을 반환합니다.
   */
  getChannelMap(): ChannelMap { return this.channelMap; }
  /** @internal */
  [cancelAudioInput](): void { this.stream?.close(); }
  /**
   * Asynchronously decode into data, returning the actual number of samples
   * written; return 0n at the end. Do not modify the buffer before completion.
   * @zh 异步解码到 data，返回实际写入的样本数；末尾返回 0n，完成前勿修改缓冲区。
   * @ja data に非同期でデコードし、実際に書き込んだサンプル数を返します。
   * 末尾では 0n を返します。完了前にバッファーを変更しないでください。
   * @ko data에 비동기로 디코딩하여 실제 기록한 샘플 수를 반환합니다.
   * 끝에서는 0n을 반환하며, 완료 전에 버퍼를 수정하면 안 됩니다.
   */
  read(data: Int16Array): Promise<bigint> {
    samples(data);
    return this.queue.run(async () => {
      if (this.custom) {
        const count = data.length ? await this.custom.reader.read(data) : 0n;
        if (typeof count !== 'bigint' || count < 0n ||
            count > BigInt(data.length)) {
          throw new RangeError('Reader returned an invalid sample count');
        }
        audioNative.updateAudioFileMetadata(this.customMetadata!, 0, count);
        return count;
      }
      await this.runStream(() => audioAsync<void>(callback =>
        audioNative.readAudioInput(this[audioHandle], data, callback)));
      return this.u64[4];
    });
  }
  /**
   * Asynchronously seek to a sample offset (bigint, including all channels)
   * or a time offset (Time).
   * @zh 异步跳转到样本偏移（bigint，包含所有声道）或时间偏移（Time）。
   * @ja サンプルオフセット（bigint、全チャンネルを含む）または
   * 時間オフセット（Time）に非同期でシークします。
   * @ko 샘플 오프셋(bigint, 모든 채널 포함) 또는 시간 오프셋(Time)으로
   * 비동기 이동합니다.
   */
  seek(offset: bigint | R<Time>): Promise<void> {
    const time = offset instanceof Time;
    const value = time ? duration(offset) : offset;
    if (typeof value !== 'bigint' || (!time && value < 0n)) {
      throw new RangeError('Expected a non-negative sample offset or a Time');
    }
    return this.queue.run(async () => {
      if (this.custom) {
        audioNative.updateAudioFileMetadata(this.customMetadata!,
          time ? 2 : 1, value);
        await this.custom.reader.seek(this.u64[4]);
        audioNative.updateAudioFileMetadata(this.customMetadata!, 3);
      } else {
        await this.runStream(() => audioAsync<void>(callback =>
          audioNative.seekAudioInput(this[audioHandle], value, time, callback)));
      }
    });
  }
  /**
   * Wait for prior operations, then asynchronously close the decoder and
   * release its retained data source.
   * @zh 等待此前操作并异步关闭解码器、释放其持有的数据源。
   * @ja 先行する操作を待ち、非同期でデコーダーを閉じて保持するデータソースを解放します。
   * @ko 이전 작업을 기다린 뒤 디코더를 비동기로 닫고 보유한 데이터 소스를 해제합니다.
   */
  close(): Promise<void> {
    return this.queue.run(async () => {
      this.map(await audioAsync<AudioFileMapping>(callback =>
        audioNative.closeAudioInput(this[audioHandle], callback)));
      this.stream?.close();
      this.stream = undefined;
      await this.releaseCustom();
    });
  }
  private map(mapping: AudioFileMapping): void {
    this.u64 = new BigUint64Array(mapping.buffer);
    this.i64 = new BigInt64Array(mapping.buffer);
    this.u32 = new Uint32Array(mapping.buffer);
    this.channelMap = new Int32Array(mapping.channelMap);
  }
  private runStream<T>(action: () => Promise<T>): Promise<T> {
    return this.stream ? this.stream.run(action) : action();
  }
  private async releaseCustom(): Promise<void> {
    const custom = this.custom;
    this.custom = undefined;
    this.customMetadata = undefined;
    try { await custom?.reader.close(); } finally { await custom?.owned?.close(); }
  }
  private open(input: string | Uint8Array | InputStream): Promise<boolean> {
    return this.queue.run(async () => {
      const custom = await findAudioReaderInput(input);
      if (custom) {
        let opened = false;
        try {
          const info = await custom.reader.open(custom.stream);
          if (info === undefined) return false;
          if (!(info instanceof SoundFileReaderInfo)) {
            throw new TypeError('Reader.open must return SoundFileReader.Info');
          }
          const mapping = audioNative.createAudioFileMetadata(info[audioHandle]);
          await audioAsync<AudioFileMapping>(callback =>
            audioNative.closeAudioInput(this[audioHandle], callback));
          await this.releaseCustom();
          this.stream?.close();
          this.stream = undefined;
          this.map(mapping);
          this.custom = custom;
          this.customMetadata = mapping.handle;
          opened = true;
          return true;
        } finally {
          if (!opened) {
            try { await custom.reader.close(); } finally {
              await custom.owned?.close();
            }
          }
        }
      }
      const stream = typeof input === 'string' || input instanceof Uint8Array
        ? undefined : new AudioInputStream(input);
      let opened = false;
      try {
        const load = () => audioAsync<AudioFileMapping | undefined>(callback =>
          audioNative.openAudioInput(this[audioHandle],
            stream ? stream.handle : input as string | Uint8Array, callback));
        const mapping = await (stream ? stream.run(load) : load());
        if (mapping) {
          await this.releaseCustom();
          this.map(mapping);
          this.stream?.close();
          this.stream = stream;
          opened = true;
        }
        return opened;
      } finally {
        if (!opened) stream?.close();
      }
    });
  }
}
