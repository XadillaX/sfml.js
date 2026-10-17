import type { Time } from '../system/time';
import type { SoundChannel } from './value';

/**
 * A module export is a factory receiving context and structured-clone data.
 * @zh 模块导出是接收上下文和结构化克隆数据的工厂函数。
 * @ja モジュールのエクスポートはコンテキストと構造化クローンデータを
 * 受け取るファクトリーです。
 * @ko 모듈 내보내기는 컨텍스트와 구조화 복제 데이터를 받는 팩토리입니다.
 */
export interface AudioWorkerModule {
  /**
   * Module path or URL loaded by the Worker, exporting an audio callback
   * factory.
   * @zh Worker 加载的模块路径或 URL，导出音频回调工厂函数。
   * @ja Worker が読み込むモジュールのパスまたは URL。
   * 音声コールバックのファクトリー関数をエクスポートします。
   * @ko Worker가 로드하는 모듈 경로 또는 URL로,
   * 오디오 콜백 팩토리 함수를 내보냅니다.
   */
  module: string | URL;
  /**
   * Factory export name; uses the default export when omitted.
   * @zh 工厂函数导出名，省略时使用默认导出。
   * @ja ファクトリーのエクスポート名。省略時はデフォルトエクスポートを使います。
   * @ko 팩토리 함수의 내보내기 이름으로, 생략하면 기본 내보내기를 사용합니다.
   */
  exportName?: string;
  /**
   * Initial data passed to the factory through structured cloning.
   * @zh 通过结构化克隆传给工厂函数的初始数据。
   * @ja 構造化クローンでファクトリー関数に渡す初期データ。
   * @ko 구조화 복제를 통해 팩토리 함수에 전달하는 초기 데이터입니다.
   */
  data?: unknown;
}
/**
 * Audio Worker module and block queue configuration.
 * @zh 音频 Worker 模块和分块队列配置。
 * @ja 音声 Worker モジュールとブロックキューの設定。
 * @ko 오디오 Worker 모듈 및 블록 큐 설정입니다.
 */
export interface AudioWorkerOptions extends AudioWorkerModule {
  /**
   * Frames per block, defaulting to 1024; a frame contains samples for all
   * channels.
   * @zh 每个块的帧数，默认 1024；一帧包含所有声道的样本。
   * @ja ブロックあたりのフレーム数。既定値は 1024。
   * 1 フレームは全チャンネルのサンプルを含みます。
   * @ko 블록당 프레임 수이며 기본값은 1024입니다.
   * 한 프레임은 모든 채널의 샘플을 포함합니다.
   */
  blockFrames?: number;
  /**
   * Number of blocks in the native queue, defaulting to 8.
   * @zh 原生队列中的块数，默认 8。
   * @ja ネイティブキューのブロック数。既定値は 8。
   * @ko 네이티브 큐의 블록 수이며 기본값은 8입니다.
   */
  queueBlocks?: number;
}
/**
 * Actual processing parameters passed to the audio callback factory.
 * @zh 传给音频回调工厂的实际处理参数。
 * @ja 音声コールバックファクトリーに渡す実際の処理パラメーター。
 * @ko 오디오 콜백 팩토리에 전달하는 실제 처리 매개변수입니다.
 */
export interface AudioWorkerContext {
  /**
   * Samples per second per channel, in Hz.
   * @zh 每个声道每秒的采样数，单位为 Hz。
   * @ja チャンネルごとの毎秒のサンプル数。単位は Hz。
   * @ko 채널별 초당 샘플 수이며 단위는 Hz입니다.
   */
  sampleRate: number;
  /**
   * Number of channels per frame.
   * @zh 每帧的声道数。
   * @ja フレームあたりのチャンネル数。
   * @ko 프레임당 채널 수입니다.
   */
  channelCount: number;
  /**
   * Number of frames per processing block.
   * @zh 每个处理块的帧数。
   * @ja 処理ブロックあたりのフレーム数。
   * @ko 처리 블록당 프레임 수입니다.
   */
  blockFrames: number;
}
/**
 * Format and Worker configuration for a custom PCM playback stream.
 * @zh 自定义 PCM 播放流的格式和 Worker 配置。
 * @ja カスタム PCM 再生ストリームの形式と Worker 設定。
 * @ko 사용자 정의 PCM 재생 스트림의 형식 및 Worker 설정입니다.
 */
export interface SoundStreamOptions extends AudioWorkerOptions {
  /**
   * Sample rate in Hz.
   * @zh 采样率，单位为 Hz。
   * @ja サンプルレート。単位は Hz。
   * @ko 샘플 레이트이며 단위는 Hz입니다.
   */
  sampleRate: number;
  /**
   * Number of channels in the interleaved PCM.
   * @zh 交错 PCM 的声道数。
   * @ja インターリーブ PCM のチャンネル数。
   * @ko 인터리브 PCM의 채널 수입니다.
   */
  channelCount: number;
  /**
   * Speaker position corresponding to each interleaved channel.
   * @zh 每个交错声道对应的扬声器位置。
   * @ja 各インターリーブチャンネルに対応するスピーカー位置。
   * @ko 각 인터리브 채널에 대응하는 스피커 위치입니다.
   */
  channelMap: Iterable<SoundChannel>;
}
/**
 * samples aliases a reusable native slot, valid until the callback settles.
 * @zh samples 指向可复用的原生槽，仅在回调完成前有效。
 * @ja samples は再利用可能なネイティブスロットを参照し、
 * コールバックの完了まで有効です。
 * @ko samples는 재사용 가능한 네이티브 슬롯을 참조하며,
 * 콜백이 완료될 때까지만 유효합니다.
 */
export interface SoundStreamChunk {
  /**
   * Reusable native interleaved 16-bit PCM write area, valid until this
   * callback settles.
   * @zh 原生可复用的交错 16 位 PCM 写入区，仅在本次回调完成前有效。
   * @ja 再利用可能なネイティブの 16 ビットインターリーブ PCM 書き込み領域。
   * このコールバックの完了まで有効です。
   * @ko 재사용 가능한 네이티브 16비트 인터리브 PCM 쓰기 영역으로,
   * 이번 콜백이 완료될 때까지만 유효합니다.
   */
  readonly samples: Int16Array;
  /**
   * Total interleaved samples filled this time; must be a multiple of the
   * channel count and no greater than samples.length.
   * @zh 本次填入的交错样本总数，须为声道数的倍数且不超过 samples.length。
   * @ja 今回書き込んだインターリーブサンプルの総数。
   * チャンネル数の倍数かつ samples.length 以下である必要があります。
   * @ko 이번에 채운 인터리브 샘플 총수로, 채널 수의 배수여야 하며
   * samples.length를 초과할 수 없습니다.
   */
  sampleCount: number;
}
/**
 * Playback stream callbacks executed in a Node Worker.
 * @zh 在 Node Worker 中执行的播放流回调。
 * @ja Node Worker で実行する再生ストリームのコールバック。
 * @ko Node Worker에서 실행하는 재생 스트림 콜백입니다.
 */
export interface SoundStreamCallbacks {
  /**
   * Fill chunk; return true to continue reading, or false for the final block.
   * @zh 填充 chunk；返回 true 继续读取，false 表示当前块是最后一块。
   * @ja chunk を埋めます。true で読み取りを継続し、false は最終ブロックを示します。
   * @ko chunk를 채웁니다. true는 읽기 계속, false는 현재 블록이 마지막임을 뜻합니다.
   */
  onGetData(chunk: SoundStreamChunk): boolean | Promise<boolean>;
  /**
   * Seek the data source to the specified playback time.
   * @zh 将数据源移动到指定播放时刻。
   * @ja データソースを指定の再生時刻にシークします。
   * @ko 데이터 소스를 지정한 재생 시점으로 이동합니다.
   */
  onSeek(offset: Time): void | Promise<void>;
  /**
   * Called while preparing the final block; returns an interleaved sample
   * offset. undefined disables this loop, 0n restarts from the beginning.
   * @zh 准备最后一块时调用，返回交错样本偏移。
   * undefined 禁用本次循环，0n 从头开始。
   * @ja 最終ブロックの準備中に呼ばれ、インターリーブサンプルのオフセットを返します。
   * undefined は今回のループを無効にし、0n は先頭から再開します。
   * @ko 마지막 블록을 준비할 때 호출되며 인터리브 샘플 오프셋을 반환합니다.
   * undefined는 이번 반복을 비활성화하고 0n은 처음부터 다시 시작합니다.
   */
  onLoop?(): bigint | undefined | Promise<bigint | undefined>;
  /**
   * Release data source resources when the Worker session closes.
   * @zh Worker 会话关闭时释放数据源资源。
   * @ja Worker セッションの終了時にデータソースのリソースを解放します。
   * @ko Worker 세션이 닫힐 때 데이터 소스 리소스를 해제합니다.
   */
  onClose?(): void | Promise<void>;
}
/**
 * Recording callbacks executed in a Node Worker.
 * @zh 在 Node Worker 中执行的录音回调。
 * @ja Node Worker で実行する録音コールバック。
 * @ko Node Worker에서 실행하는 녹음 콜백입니다.
 */
export interface SoundRecorderCallbacks {
  /**
   * Initialize before capture starts; return false to reject startup.
   * @zh 开始采集前初始化；返回 false 拒绝启动。
   * @ja キャプチャ開始前に初期化します。false を返すと開始を拒否します。
   * @ko 캡처 시작 전에 초기화하며, false를 반환하면 시작을 거부합니다.
   */
  onStart?(): boolean | Promise<boolean>;
  /**
   * Consume interleaved 16-bit PCM; the view is valid until the callback
   * settles. Return false to stop recording.
   * @zh 消费交错 16 位 PCM，视图仅在回调完成前有效；返回 false 停止录音。
   * @ja 16 ビットのインターリーブ PCM を消費します。
   * ビューはコールバックの完了まで有効で、false を返すと録音を停止します。
   * @ko 16비트 인터리브 PCM을 소비하며, 뷰는 콜백 완료 전까지만 유효합니다.
   * false를 반환하면 녹음을 중지합니다.
   */
  onProcessSamples(samples: Int16Array): boolean | Promise<boolean>;
  /**
   * Perform cleanup after capture stops and the queue drains.
   * @zh 停止采集并排空队列后执行收尾。
   * @ja キャプチャが停止し、キューの処理が完了した後に後処理を行います。
   * @ko 캡처가 중지되고 큐의 처리가 끝난 후 마무리 작업을 수행합니다.
   */
  onStop?(): void | Promise<void>;
}
/**
 * Frame counts actually consumed and produced by the effect processor.
 * @zh 效果处理器实际消费和生成的帧数。
 * @ja エフェクトプロセッサーが実際に消費・生成したフレーム数。
 * @ko 효과 처리기가 실제로 소비하고 생성한 프레임 수입니다.
 */
export interface EffectFrames {
  /**
   * Number of input frames consumed.
   * @zh 已消费的输入帧数。
   * @ja 消費した入力フレーム数。
   * @ko 소비한 입력 프레임 수입니다.
   */
  inputFrameCount: number;
  /**
   * Number of output frames written.
   * @zh 已写入的输出帧数。
   * @ja 書き込んだ出力フレーム数。
   * @ko 기록한 출력 프레임 수입니다.
   */
  outputFrameCount: number;
}
/**
 * Floating-point PCM effect callbacks executed in a Node Worker.
 * @zh 在 Node Worker 中执行的浮点 PCM 效果回调。
 * @ja Node Worker で実行する浮動小数点 PCM のエフェクトコールバック。
 * @ko Node Worker에서 실행하는 부동 소수점 PCM 효과 콜백입니다.
 */
export interface EffectProcessorCallbacks {
  /**
   * Process interleaved floating-point PCM; when input is null, tail audio may
   * still be generated. Views remain valid only until the callback settles.
   * @zh 处理交错浮点 PCM；input 为 null 时可继续生成尾音，
   * 视图仅在回调完成前有效。
   * @ja インターリーブ浮動小数点 PCM を処理します。input が null の場合も
   * 残響を生成できます。ビューはコールバックの完了までのみ有効です。
   * @ko 인터리브 부동 소수점 PCM을 처리합니다. input이 null일 때도 잔향을
   * 생성할 수 있으며, 뷰는 콜백 완료 전까지만 유효합니다.
   */
  process(input: Float32Array | null, inputFrameCount: number,
    output: Float32Array, outputFrameCount: number,
    channelCount: number): EffectFrames | void | Promise<EffectFrames | void>;
  /**
   * Clean up when the effect session closes.
   * @zh 效果会话关闭时执行清理。
   * @ja エフェクトセッションの終了時にクリーンアップします。
   * @ko 효과 세션이 닫힐 때 정리 작업을 수행합니다.
   */
  onClose?(): void | Promise<void>;
}
/**
 * Cumulative statistics for the native audio block queue.
 * @zh 原生音频分块队列的累计统计。
 * @ja ネイティブ音声ブロックキューの累積統計。
 * @ko 네이티브 오디오 블록 큐의 누적 통계입니다.
 */
export interface AudioWorkerStats {
  /**
   * Data underrun count for playback streams; missing output frames for
   * effects.
   * @zh 播放流为数据欠载次数；效果处理器为缺少的输出帧数。
   * @ja 再生ストリームではアンダーラン回数、
   * エフェクトプロセッサーでは不足した出力フレーム数。
   * @ko 재생 스트림에서는 언더런 횟수이며, 효과 처리기에서는 부족한 출력 프레임 수입니다.
   */
  underruns: bigint;
  /**
   * Amount dropped when the queue is full: interleaved samples for recorders,
   * frames for effect processors.
   * @zh 队列满时丢弃的数量：录音器以交错样本计，效果处理器以帧计。
   * @ja キューが満杯のときに破棄した量。
   * 録音ではインターリーブサンプル数、エフェクトではフレーム数。
   * @ko 큐가 가득 찼을 때 버린 양으로, 녹음기는 인터리브 샘플 단위,
   * 효과 처리기는 프레임 단위입니다.
   */
  overruns: bigint;
  /**
   * Amount processed: interleaved samples for playback streams and recorders,
   * input frames for effect processors.
   * @zh 已处理数量：播放流和录音器以交错样本计，效果处理器以输入帧计。
   * @ja 処理済みの量。再生ストリームと録音ではインターリーブサンプル数、
   * エフェクトでは入力フレーム数。
   * @ko 처리한 양으로, 재생 스트림과 녹음기는 인터리브 샘플 단위,
   * 효과 처리기는 입력 프레임 단위입니다.
   */
  processed: bigint;
}
