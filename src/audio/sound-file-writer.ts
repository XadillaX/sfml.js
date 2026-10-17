import type { SoundChannel } from './value';

/**
 * Custom audio encoder interface accepting interleaved 16-bit PCM.
 * @zh 自定义音频编码器接口，接受交错 16 位 PCM。
 * @ja 16 ビットのインターリーブ PCM を受け取るカスタム音声エンコーダー。
 * @ko 16비트 인터리브 PCM을 받는 사용자 정의 오디오 인코더 인터페이스입니다.
 */
export abstract class SoundFileWriter {
  /**
   * Create an output file; sampleRate is in Hz and channelMap contains
   * interleaved channel positions. Return whether it succeeded.
   * @zh 创建输出文件；sampleRate 为 Hz，channelMap 为交错声道位置，返回是否成功。
   * @ja 出力ファイルを作成します。sampleRate は Hz、
   * channelMap はインターリーブチャンネル位置です。成功したかどうかを返します。
   * @ko 출력 파일을 생성합니다. sampleRate는 Hz 단위이며
   * channelMap은 인터리브 채널 위치입니다. 성공 여부를 반환합니다.
   */
  abstract open(filename: string, sampleRate: number, channelCount: number,
    channelMap: Iterable<SoundChannel>): boolean | Promise<boolean>;
  /**
   * Encode and write samples; preserve the input until asynchronous completion.
   * @zh 编码并写入样本，异步完成前应保留输入内容。
   * @ja サンプルをエンコードして書き込みます。非同期処理の完了まで入力を保持します。
   * @ko 샘플을 인코딩하여 기록합니다. 비동기 작업이 완료될 때까지 입력을 유지해야 합니다.
   */
  abstract write(samples: Int16Array): void | Promise<void>;
  /**
   * Flush and release output resources. Called by OutputSoundFile.close().
   * @zh 刷新并释放输出资源，由 OutputSoundFile.close() 调用。
   * @ja 出力をフラッシュしてリソースを解放します。
   * OutputSoundFile.close() から呼ばれます。
   * @ko 출력을 플러시하고 리소스를 해제합니다. OutputSoundFile.close()가 호출합니다.
   */
  close(): void | Promise<void> {}
}
/**
 * Registrable encoder class requiring a no-argument constructor and a
 * filename-based format probe.
 * @zh 可注册的编码器类，需提供无参数构造和文件名格式探测方法。
 * @ja 登録可能なエンコーダークラス。引数なしのコンストラクターと
 * ファイル名による形式判定メソッドが必要です。
 * @ko 등록 가능한 인코더 클래스로, 인수 없는 생성자와
 * 파일명 기반 형식 탐지 메서드를 제공해야 합니다.
 */
export interface SoundFileWriterConstructor {
  /**
   * Create an unopened encoder instance.
   * @zh 创建尚未打开的编码器实例。
   * @ja 未オープンのエンコーダーインスタンスを作成します。
   * @ko 아직 열리지 않은 인코더 인스턴스를 생성합니다.
   */
  new (): SoundFileWriter;
  /**
   * Determine from the filename whether the output format is supported.
   * @zh 按文件名判断是否支持该输出格式。
   * @ja ファイル名から出力形式に対応しているか判定します。
   * @ko 파일명을 기준으로 해당 출력 형식의 지원 여부를 판단합니다.
   */
  check(filename: string): boolean | Promise<boolean>;
}
