import { audioHandle, type AudioHandle } from '../internal/audio-native';
import {
  recorderCallbackSession, type AudioRecorderCallbacks,
} from '../internal/audio-recorder-session';
import { SoundRecorder } from './sound-recorder';
import {
  SoundBuffer, adoptAudioBuffer, type ReadonlySoundBuffer,
} from './sound-buffer';

/**
 * Recorder that saves captured PCM in a SoundBuffer.
 * @zh 将采集的 PCM 保存在 SoundBuffer 中的录音器。
 * @ja キャプチャした PCM を SoundBuffer に保存する録音器。
 * @ko 캡처한 PCM을 SoundBuffer에 저장하는 녹음기입니다.
 */
export class SoundBufferRecorder extends SoundRecorder {
  private buffer: SoundBuffer = new SoundBuffer();
  /**
   * Create a recorder; call start to begin capture.
   * @zh 创建录音器，调用 start 开始采集。
   * @ja 録音器を作成します。start を呼ぶとキャプチャを開始します。
   * @ko 녹음기를 생성합니다. start를 호출하면 캡처를 시작합니다.
   */
  constructor() { super(undefined, true); }
  /**
   * Return the most recently completed recording buffer;
   * retrieve new results after await stop().
   * @zh 返回最近完成的录音缓冲区；应在 await stop() 后取得新结果。
   * @ja 最後に完成した録音バッファーを返します。
   * 新しい結果は await stop() の後で取得してください。
   * @ko 가장 최근 완성된 녹음 버퍼를 반환합니다.
   * 새 결과는 await stop() 후에 가져와야 합니다.
   */
  getBuffer(): ReadonlySoundBuffer { return this.buffer; }
  /**
   * Called on the object's owning JS thread before capture begins; supports
   * synchronous or asynchronous returns, with false rejecting capture.
   * By default, clears this session's native PCM accumulator and recording
   * buffer without accessing the microphone.
   * @zh 在对象所属 JS 线程开始采集前调用；支持同步或异步返回，false 拒绝采集。
   * 默认清空本次 Native PCM 聚合和录音缓冲区，不访问麦克风。
   * @ja キャプチャ開始前にオブジェクトの所属 JS スレッドで呼ばれます。
   * 同期・非同期の戻り値に対応し、false はキャプチャを拒否します。
   * 既定では今回の Native PCM 蓄積領域と録音バッファーをクリアし、
   * マイクにはアクセスしません。
   * @ko 캡처 시작 전 객체가 속한 JS 스레드에서 호출됩니다.
   * 동기 또는 비동기 반환을 지원하며 false는 캡처를 거부합니다.
   * 기본적으로 이번 세션의 Native PCM 누적 영역과 녹음 버퍼를 비우며
   * 마이크에 접근하지 않습니다.
   */
  protected onStart(): boolean | Promise<boolean> {
    this.onBuffer(recorderCallbackSession(this[audioHandle], 'onStart').reset());
    return true;
  }
  /**
   * Serially process interleaved 16-bit PCM on the object's owning JS thread;
   * lengths count samples, not frames. Native views are valid only until this
   * synchronous or asynchronous callback ends; false stops capture
   * asynchronously. By default, appends incoming samples to the native
   * accumulator. You may modify samples before calling super; without super,
   * samples are not saved.
   * @zh 在对象所属 JS 线程串行处理交错的 16 位 PCM，长度单位为样本而非帧。
   * Native 视图仅在本次同步或异步回调结束前有效；false 异步停止采集。
   * 默认将传入样本追加到 Native 聚合器；可修改后调用 super，不调用则不保存。
   * @ja オブジェクトの所属 JS スレッドで 16 ビットインターリーブ PCM を直列処理します。
   * 長さはフレームではなくサンプル数です。Native ビューは今回の同期・非同期
   * コールバック終了までのみ有効で、false はキャプチャを非同期で停止します。
   * 既定では受け取ったサンプルを Native 蓄積領域に追加します。
   * 変更後に super を呼ぶこともでき、呼ばない場合は保存しません。
   * @ko 객체가 속한 JS 스레드에서 16비트 인터리브 PCM을 직렬로 처리합니다.
   * 길이 단위는 프레임이 아닌 샘플입니다. Native 뷰는 이번 동기 또는 비동기
   * 콜백이 끝날 때까지만 유효하며 false는 캡처를 비동기로 중지합니다.
   * 기본적으로 입력 샘플을 Native 누적기에 추가합니다.
   * 수정 후 super를 호출할 수 있으며, 호출하지 않으면 저장되지 않습니다.
   */
  protected onProcessSamples(samples: Int16Array): boolean | Promise<boolean> {
    return recorderCallbackSession(this[audioHandle], 'onProcessSamples')
      .append(samples);
  }
  /**
   * Called once on the object's owning JS thread after the device stops and
   * delivered callbacks finish; supports asynchronous completion.
   * Rejection, cancellation, and errors also trigger it. By default, finalizes
   * PCM appended through super into a SoundBuffer.
   * @zh 在设备停止且已交付回调结束后，于对象所属 JS 线程调用一次，支持异步完成。
   * 拒绝、取消和异常同样触发；默认将已通过 super 追加的 PCM 完成为 SoundBuffer。
   * @ja デバイス停止と配信済みコールバックの完了後、オブジェクトの所属 JS スレッドで
   * 一度呼ばれます。非同期完了に対応します。拒否・キャンセル・例外時も呼ばれます。
   * 既定では super で追加された PCM を SoundBuffer として完成させます。
   * @ko 장치가 중지되고 전달된 콜백이 끝난 후 객체가 속한 JS 스레드에서
   * 한 번 호출되며 비동기 완료를 지원합니다. 거부, 취소, 오류 시에도 호출됩니다.
   * 기본적으로 super를 통해 추가한 PCM을 SoundBuffer로 완성합니다.
   */
  protected onStop(): void | Promise<void> {
    this.onBuffer(recorderCallbackSession(this[audioHandle], 'onStop').finalize());
  }
  /**
   * Enable the queue only for subclasses overriding callbacks;
   * ordinary instances retain the native fast path.
   * @zh 只有覆写回调的子类启用队列，普通实例保持 Native 快路径。
   * @ja コールバックをオーバーライドするサブクラスのみキューを有効にし、
   * 通常のインスタンスでは Native 高速経路を維持します。
   * @ko 콜백을 재정의한 하위 클래스만 큐를 활성화하며,
   * 일반 인스턴스는 Native 고속 경로를 유지합니다.
   */
  protected recorderCallbacks(): AudioRecorderCallbacks | undefined {
    if (this.onStart === SoundBufferRecorder.prototype.onStart &&
        this.onProcessSamples === SoundBufferRecorder.prototype.onProcessSamples &&
        this.onStop === SoundBufferRecorder.prototype.onStop) return undefined;
    return SoundBufferRecorder.callbacks(new WeakRef(this));
  }
  /**
   * Create weak-reference dispatchers outside instance scope so idle sessions
   * do not keep wrappers alive.
   * @zh 在实例作用域外创建弱引用派发器，避免空闲会话保活包装对象。
   * @ja インスタンスのスコープ外で弱参照ディスパッチャーを作成し、
   * アイドル中のセッションがラッパーの生存を維持しないようにします。
   * @ko 인스턴스 범위 밖에서 약한 참조 디스패처를 생성하여
   * 유휴 세션이 래퍼 객체를 계속 유지하지 않도록 합니다.
   */
  private static callbacks(weak: WeakRef<SoundBufferRecorder>): AudioRecorderCallbacks {
    return {
      onStart: () => weak.deref()?.onStart() ?? false,
      onProcessSamples: samples =>
        weak.deref()?.onProcessSamples(samples) ?? false,
      onStop: () => weak.deref()?.onStop(),
    };
  }
  /**
   * Receive an independent native buffer; later recordings do not modify a
   * previously returned SoundBuffer.
   * @zh 接收独立 Native 缓冲区；后续录音不会修改已返回的 SoundBuffer。
   * @ja 独立した Native バッファーを受け取ります。
   * 後の録音で返却済みの SoundBuffer が変更されることはありません。
   * @ko 독립적인 Native 버퍼를 받습니다.
   * 이후 녹음은 이미 반환한 SoundBuffer를 수정하지 않습니다.
   */
  protected onBuffer(buffer: AudioHandle<'bufferData'>): void {
    this.buffer = SoundBuffer[adoptAudioBuffer](buffer);
  }
}
