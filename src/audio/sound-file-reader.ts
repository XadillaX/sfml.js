import {
  audioNative, audioHandle, type AudioHandle, type AudioReaderInfoMapping,
} from '../internal/audio-native';
import type { InputStream } from '../system/input-stream';
import { channels, unsigned, type SoundChannel, type ChannelMap } from './value';

/**
 * Format information returned by a custom audio decoder.
 * @zh 自定义音频解码器返回的格式信息。
 * @ja カスタム音声デコーダーが返す形式情報。
 * @ko 사용자 정의 오디오 디코더가 반환하는 형식 정보입니다.
 */
export interface SoundFileReaderInfoInput {
  /**
   * Total sample count across all interleaved channels.
   * @zh 所有交错声道合计的样本总数。
   * @ja 全インターリーブチャンネルのサンプル総数。
   * @ko 모든 인터리브 채널의 샘플 총수입니다.
   */
  sampleCount: bigint;
  /**
   * Number of channels.
   * @zh 声道数量。
   * @ja チャンネル数。
   * @ko 채널 수입니다.
   */
  channelCount: number;
  /**
   * Sample rate per channel, in Hz.
   * @zh 每声道采样率，单位为 Hz。
   * @ja チャンネルごとのサンプルレート。単位は Hz。
   * @ko 채널별 샘플 레이트이며 단위는 Hz입니다.
   */
  sampleRate: number;
  /**
   * Channel positions in interleaved order.
   * @zh 按交错顺序排列的声道位置。
   * @ja インターリーブ順に並ぶチャンネル位置。
   * @ko 인터리브 순서로 나열된 채널 위치입니다.
   */
  channelMap: Iterable<SoundChannel>;
}
/**
 * sf::SoundFileReader::Info with directly mapped scalar fields.
 * @zh 标量字段直接映射的 sf::SoundFileReader::Info。
 * @ja スカラーフィールドが直接マッピングされた sf::SoundFileReader::Info。
 * @ko 스칼라 필드가 직접 매핑된 sf::SoundFileReader::Info입니다.
 */
export class SoundFileReaderInfo {
  readonly [audioHandle]: AudioHandle<'readerInfo'>;
  private readonly count: BigUint64Array;
  private readonly channels: Uint32Array;
  private readonly rate: Uint32Array;
  private map: Int32Array;
  /**
   * Create empty format information or copy value; mapping is for internal
   * native decoder mapping.
   * @zh 创建空格式信息或复制 value；mapping 供原生解码器内部映射使用。
   * @ja 空の形式情報を作成するか value をコピーします。
   * mapping はネイティブデコーダー内部のマッピング用です。
   * @ko 빈 형식 정보를 생성하거나 value를 복사합니다.
   * mapping은 네이티브 디코더의 내부 매핑용입니다.
   */
  constructor(value?: SoundFileReaderInfoInput,
    mapping: AudioReaderInfoMapping = audioNative.createAudioReaderInfo()) {
    this[audioHandle] = mapping.handle;
    const region = (name: string) => {
      const [ , index, offset ] = mapping.info.fields[name];
      return { buffer: mapping.info.buffers[index], offset };
    };
    const count = region('sampleCount');
    const channels = region('channelCount');
    const rate = region('sampleRate');
    this.count = new BigUint64Array(count.buffer, count.offset, 1);
    this.channels = new Uint32Array(channels.buffer, channels.offset, 1);
    this.rate = new Uint32Array(rate.buffer, rate.offset, 1);
    this.map = new Int32Array(mapping.channelMap);
    if (value) {
      this.sampleCount = value.sampleCount;
      this.channelCount = value.channelCount;
      this.sampleRate = value.sampleRate;
      this.channelMap = value.channelMap;
    }
  }
  /**
   * Total sample count across all channels.
   * @zh 所有声道合计的样本总数。
   * @ja 全チャンネルのサンプル総数。
   * @ko 모든 채널의 샘플 총수입니다.
   */
  get sampleCount(): bigint { return this.count[0]; }
  /**
   * Set the total sample count as an unsigned 64-bit integer.
   * @zh 设置无符号 64 位样本总数。
   * @ja サンプル総数を符号なし 64 ビット整数で設定します。
   * @ko 샘플 총수를 부호 없는 64비트 정수로 설정합니다.
   */
  set sampleCount(value: bigint) {
    if (typeof value !== 'bigint' || value < 0n || value > 0xffffffffffffffffn) {
      throw new RangeError('Expected uint64 sample count');
    }
    this.count[0] = value;
  }
  /**
   * Number of channels.
   * @zh 声道数量。
   * @ja チャンネル数。
   * @ko 채널 수입니다.
   */
  get channelCount(): number { return this.channels[0]; }
  /**
   * Set the number of channels.
   * @zh 设置声道数量。
   * @ja チャンネル数を設定します。
   * @ko 채널 수를 설정합니다.
   */
  set channelCount(value: number) { this.channels[0] = unsigned(value); }
  /**
   * Sample rate per channel, in Hz.
   * @zh 每声道采样率，单位为 Hz。
   * @ja チャンネルごとのサンプルレート。単位は Hz。
   * @ko 채널별 샘플 레이트이며 단위는 Hz입니다.
   */
  get sampleRate(): number { return this.rate[0]; }
  /**
   * Set the sample rate in Hz.
   * @zh 设置采样率，单位为 Hz。
   * @ja サンプルレートを Hz で設定します。
   * @ko 샘플 레이트를 Hz 단위로 설정합니다.
   */
  set sampleRate(value: number) { this.rate[0] = unsigned(value); }
  /**
   * Read-only view of interleaved channel positions.
   * @zh 交错声道位置的只读视图。
   * @ja インターリーブチャンネル位置の読み取り専用ビュー。
   * @ko 인터리브 채널 위치의 읽기 전용 뷰입니다.
   */
  get channelMap(): ChannelMap { return this.map; }
  /**
   * Copy the channel position mapping.
   * @zh 复制声道位置映射。
   * @ja チャンネル位置のマッピングをコピーします。
   * @ko 채널 위치 매핑을 복사합니다.
   */
  set channelMap(value: Iterable<SoundChannel>) {
    this.map = new Int32Array(audioNative.setAudioReaderChannels(
      this[audioHandle], channels(value)));
  }
}

/**
 * Custom audio decoder interface; I/O positions count samples across all
 * channels.
 * @zh 自定义音频解码器接口，读写位置以所有声道合计的样本数计。
 * @ja カスタム音声デコーダーのインターフェース。
 * 読み書き位置は全チャンネルの合計サンプル数で表します。
 * @ko 사용자 정의 오디오 디코더 인터페이스입니다.
 * 읽기 및 쓰기 위치는 모든 채널의 합계 샘플 수로 나타냅니다.
 */
export abstract class SoundFileReader {
  /**
   * Decoder format information type.
   * @zh 解码器格式信息类型。
   * @ja デコーダーの形式情報の型。
   * @ko 디코더 형식 정보 타입입니다.
   */
  static readonly Info = SoundFileReaderInfo;
  /**
   * Open an input stream and return format information,
   * or undefined on failure.
   * @zh 打开输入流并返回格式信息；无法打开时返回 undefined。
   * @ja 入力ストリームを開いて形式情報を返します。開けない場合は undefined。
   * @ko 입력 스트림을 열고 형식 정보를 반환합니다. 열 수 없으면 undefined입니다.
   */
  abstract open(stream: InputStream): SoundFileReaderInfo | undefined |
  Promise<SoundFileReaderInfo | undefined>;
  /**
   * Seek to the specified zero-based interleaved sample offset.
   * @zh 移动到指定交错样本偏移，偏移从零开始。
   * @ja ゼロ始まりの指定インターリーブサンプルオフセットにシークします。
   * @ko 0부터 시작하는 지정 인터리브 샘플 오프셋으로 이동합니다.
   */
  abstract seek(sampleOffset: bigint): void | Promise<void>;
  /**
   * Decode into the supplied buffer and return the actual sample count;
   * return 0n at the end.
   * @zh 解码到提供的缓冲区，返回实际样本数；末尾返回 0n。
   * @ja 指定バッファーにデコードし、実際のサンプル数を返します。末尾では 0n。
   * @ko 제공된 버퍼에 디코딩하고 실제 샘플 수를 반환합니다. 끝에서는 0n을 반환합니다.
   */
  abstract read(samples: Int16Array): bigint | Promise<bigint>;
  /**
   * Release resources held by the decoder; does nothing by default.
   * @zh 释放解码器持有的资源；默认无操作。
   * @ja デコーダーが保持するリソースを解放します。既定では何もしません。
   * @ko 디코더가 보유한 리소스를 해제합니다. 기본 동작은 아무 작업도 하지 않습니다.
   */
  close(): void | Promise<void> {}
}
/**
 * Registrable decoder class requiring a no-argument constructor and format
 * probe.
 * @zh 可注册的解码器类，需提供无参数构造函数及格式探测方法。
 * @ja 登録可能なデコーダークラス。
 * 引数なしのコンストラクターと形式判定メソッドが必要です。
 * @ko 등록 가능한 디코더 클래스로,
 * 인수 없는 생성자와 형식 탐지 메서드를 제공해야 합니다.
 */
export interface SoundFileReaderConstructor {
  /**
   * Create an unopened decoder instance.
   * @zh 创建尚未打开的解码器实例。
   * @ja 未オープンのデコーダーインスタンスを作成します。
   * @ko 아직 열리지 않은 디코더 인스턴스를 생성합니다.
   */
  new (): SoundFileReader;
  /**
   * Probe whether the input stream uses a format supported by this decoder.
   * @zh 探测输入流是否属于本解码器支持的格式。
   * @ja 入力ストリームがこのデコーダーで対応する形式か判定します。
   * @ko 입력 스트림이 이 디코더에서 지원하는 형식인지 탐지합니다.
   */
  check(stream: InputStream): boolean | Promise<boolean>;
}
