import {
  audioNative, audioHandle, audioAsync, AudioQueue, type AudioHandle,
} from '../internal/audio-native';
import { AudioWorkerSession } from '../internal/audio-worker-session';
import {
  AudioRecorderSession, currentRecorderSession, type AudioRecorderCallbacks,
} from '../internal/audio-recorder-session';
import { unsigned, type ChannelMap } from './value';
import type { AudioWorkerOptions, AudioWorkerStats } from './worker';

/**
 * Stop the independent session when the wrapper is finalized; the session must
 * not strongly reference the wrapper.
 * @zh 回收包装对象时停止独立会话；会话不得强引用包装对象。
 * @ja ラッパーの回収時に独立したセッションを停止します。
 * セッションはラッパーへの強参照を持ってはいけません。
 * @ko 래퍼 객체가 회수될 때 독립 세션을 중지합니다.
 * 세션은 래퍼 객체를 강하게 참조하면 안 됩니다.
 */
const cleanup = new FinalizationRegistry<AudioRecorderSession>(session => {
  void session.stop().catch(() => {});
});

/**
 * Capture device audio and process interleaved 16-bit PCM in a Node Worker.
 * @zh 采集设备音频并在 Node Worker 中处理交错 16 位 PCM。
 * @ja デバイスの音声をキャプチャし、Node Worker で
 * 16 ビットインターリーブ PCM を処理します。
 * @ko 장치 오디오를 캡처하고 Node Worker에서 16비트 인터리브 PCM을 처리합니다.
 */
export class SoundRecorder {
  readonly [audioHandle]: AudioHandle<'recorder'>;
  protected readonly queue = new AudioQueue();
  private readonly values: Uint32Array;
  private readonly options?: AudioWorkerOptions;
  private session?: AudioWorkerSession;
  /**
   * On-demand callback session on the owning JS thread.
   * @zh 按需启用的所属 JS 线程回调会话。
   * @ja 必要に応じて有効にする、所属 JS スレッド上のコールバックセッション。
   * @ko 필요에 따라 활성화되는 소속 JS 스레드의 콜백 세션입니다.
   */
  private directSession?: AudioRecorderSession;
  /**
   * Stop request generation, used to cancel subclass sessions not yet started.
   * @zh 停止请求的代数，用于取消尚未启动的子类会话。
   * @ja 停止要求の世代番号。未開始のサブクラスセッションを取り消すために使います。
   * @ko 중지 요청 세대 번호로, 아직 시작하지 않은 하위 클래스 세션을 취소하는 데 사용합니다.
   */
  private stopVersion = 0;
  private channelMap: Int32Array;
  private pendingOperations = 0;

  /**
   * Create a recorder using a Worker module;
   * capture begins after calling start.
   * @zh 使用 Worker 模块创建录音器；调用 start 后开始采集。
   * @ja Worker モジュールで録音器を作成します。start の呼び出し後にキャプチャを開始します。
   * @ko Worker 모듈로 녹음기를 생성합니다. start 호출 후 캡처를 시작합니다.
   */
  constructor(options: AudioWorkerOptions);
  /** @internal */
  constructor(options: undefined, bufferRecorder: true);
  constructor(options?: AudioWorkerOptions, bufferRecorder = false) {
    if (!bufferRecorder && !options) {
      throw new TypeError('Expected a recorder worker module');
    }
    const mapping = audioNative.createAudioRecorder(bufferRecorder);
    this[audioHandle] = mapping.handle;
    this.values = new Uint32Array(mapping.values);
    this.channelMap = new Int32Array(mapping.channelMap);
    this.options = options;
  }
  /**
   * Return the names of currently available recording devices.
   * @zh 返回当前可用录音设备的名称。
   * @ja 現在利用できる録音デバイスの名前を返します。
   * @ko 현재 사용 가능한 녹음 장치 이름을 반환합니다.
   */
  static getAvailableDevices(): string[] {
    return audioNative.audioCaptureDevices(0);
  }
  /**
   * Return the default recording device name.
   * @zh 返回默认录音设备名称。
   * @ja 既定の録音デバイス名を返します。
   * @ko 기본 녹음 장치 이름을 반환합니다.
   */
  static getDefaultDevice(): string {
    return audioNative.audioCaptureDevices(1);
  }
  /**
   * Return whether the system supports audio capture.
   * @zh 返回系统是否支持音频采集。
   * @ja システムが音声キャプチャに対応しているかどうかを返します。
   * @ko 시스템의 오디오 캡처 지원 여부를 반환합니다.
   */
  static isAvailable(): boolean { return audioNative.audioCaptureDevices(2); }
  /**
   * Return the current sample rate in Hz.
   * @zh 返回当前采样率，单位为 Hz。
   * @ja 現在のサンプルレートを Hz で返します。
   * @ko 현재 샘플 레이트를 Hz 단위로 반환합니다.
   */
  getSampleRate(): number { return this.values[0]; }
  /**
   * Return the number of capture channels.
   * @zh 返回采集声道数。
   * @ja キャプチャのチャンネル数を返します。
   * @ko 캡처 채널 수를 반환합니다.
   */
  getChannelCount(): number { return this.values[1]; }
  /**
   * Return the speaker position mapping of the capture channels.
   * @zh 返回采集声道的扬声器位置映射。
   * @ja キャプチャチャンネルのスピーカー位置マッピングを返します。
   * @ko 캡처 채널의 스피커 위치 매핑을 반환합니다.
   */
  getChannelMap(): ChannelMap { return this.channelMap; }
  /**
   * Return the current recording device name.
   * @zh 返回当前录音设备名称。
   * @ja 現在の録音デバイス名を返します。
   * @ko 현재 녹음 장치 이름을 반환합니다.
   */
  getDevice(): string {
    return audioNative.audioRecorderDevice(this[audioHandle]);
  }
  /**
   * Asynchronously switch recording devices and return whether it succeeded.
   * Runs in invocation order; must not be called from subclass callbacks.
   * @zh 异步切换录音设备并返回是否成功；按调用顺序执行，子类回调内不可调用。
   * @ja 録音デバイスを非同期で切り替え、成功したかどうかを返します。
   * 呼び出し順に実行し、サブクラスのコールバック内からは呼べません。
   * @ko 녹음 장치를 비동기로 전환하고 성공 여부를 반환합니다.
   * 호출 순서대로 실행하며 하위 클래스 콜백 내부에서 호출할 수 없습니다.
   */
  setDevice(name: string): Promise<boolean> {
    if (currentRecorderSession(this[audioHandle])) {
      return Promise.reject(new Error('Cannot change device inside a Recorder callback'));
    }
    return this.run(() => {
      const change = () => audioAsync<boolean>(callback =>
        audioNative.audioRecorderDevice(this[audioHandle], name, callback));
      return this.directSession?.runDeviceOperation(change) ?? change();
    });
  }
  /**
   * Set the capture channel count; wait for the current asynchronous recording
   * operation to finish before calling.
   * @zh 设置采集声道数；必须等待当前异步录音操作结束后调用。
   * @ja キャプチャのチャンネル数を設定します。
   * 現在の非同期録音操作の完了を待ってから呼んでください。
   * @ko 캡처 채널 수를 설정합니다.
   * 현재 비동기 녹음 작업이 끝날 때까지 기다린 후 호출해야 합니다.
   */
  setChannelCount(count: number): void {
    if (this.pendingOperations) {
      throw new Error('Wait for the pending recorder operation');
    }
    this.channelMap = new Int32Array(audioNative.audioRecorderChannels(
      this[audioHandle], unsigned(count)));
  }
  /**
   * Asynchronously initialize capture, defaulting to 44100 Hz; return false if
   * already capturing, rejected, or startup fails. Do not restart from subclass
   * callbacks; await stop() externally before starting the next session.
   * @zh 异步初始化采集会话，默认 44100 Hz；已采集、拒绝或启动失败返回 false。
   * 不可在子类回调内部重新启动；应在外部等待 stop() 后再开启下一会话。
   * @ja キャプチャセッションを非同期で初期化します。既定値は 44100 Hz。
   * キャプチャ中、拒否、開始失敗の場合は false を返します。
   * サブクラスのコールバック内で再開せず、外部で stop() を待ってから
   * 次のセッションを開始してください。
   * @ko 캡처 세션을 비동기로 초기화하며 기본값은 44100 Hz입니다.
   * 이미 캡처 중이거나 거부 또는 시작 실패 시 false를 반환합니다.
   * 하위 클래스 콜백 내부에서 재시작할 수 없습니다.
   * 외부에서 stop()을 기다린 후 다음 세션을 시작해야 합니다.
   */
  start(sampleRate = 44100): Promise<boolean> {
    unsigned(sampleRate);
    if (currentRecorderSession(this[audioHandle])) {
      return Promise.reject(new Error('Cannot start Recorder inside its callback'));
    }
    const version = this.stopVersion;
    return this.run(async () => {
      if (this.values[2]) return false;
      if (this.directSession) {
        await this.directSession.drain().catch(() => {});
        cleanup.unregister(this);
        this.directSession = undefined;
      }
      const callbacks = this.recorderCallbacks();
      const frames = unsigned(this.options?.blockFrames ?? 1024);
      const mapping = await audioAsync<{
        handle?: AudioHandle<'worker'>; token?: bigint;
      }>(callback => audioNative.prepareAudioRecorder(this[audioHandle],
        sampleRate, frames, unsigned(this.options?.queueBlocks ?? 8), callback,
        !!callbacks));
      if (callbacks && mapping.handle) {
        const session = new AudioRecorderSession(this[audioHandle],
          mapping.token!, callbacks, version !== this.stopVersion);
        this.directSession = session;
        cleanup.register(this, session, this);
        try {
          const ok = await session.ready;
          if (!ok) await session.drain();
          return ok;
        } catch (error) {
          await session.drain();
          throw error;
        }
      }
      if (mapping.handle && this.options) {
        const weak = new WeakRef(this);
        this.session = new AudioWorkerSession(mapping.handle, mapping.token!,
          'recorder', this.options, { sampleRate,
            channelCount: this.getChannelCount(), blockFrames: frames }, () => {
            const recorder = weak.deref();
            if (recorder) void recorder.stop().catch(() => {});
          });
        if (!await this.session.ready) {
          await this.session.close();
          return false;
        }
      }
      const ok = await audioAsync<boolean>(callback =>
        audioNative.startAudioRecorder(this[audioHandle], callback));
      if (!ok) await this.session?.close();
      return ok;
    });
  }
  /**
   * Asynchronously stop capture and await remaining samples and onStop.
   * Inside subclass callbacks, await stop() only waits for the device to stop,
   * avoiding a self-wait. Draining continues after the callback exits;
   * await stop() again externally to wait for full completion.
   * @zh 异步停止采集并等待剩余样本及 onStop 完成。
   * 子类回调内 await stop() 只等待设备停止，避免等待自身；
   * 回调退出后继续排空，外部再次 await stop() 可等待完整结束。
   * @ja キャプチャを非同期で停止し、残りのサンプルと onStop の完了を待ちます。
   * サブクラスのコールバック内の await stop() は自己待機を避け、
   * デバイス停止のみを待ちます。コールバック終了後もキューの処理を続け、
   * 外部で再度 await stop() すると完全な終了を待てます。
   * @ko 캡처를 비동기로 중지하고 남은 샘플 및 onStop 완료를 기다립니다.
   * 하위 클래스 콜백 안의 await stop()은 자신을 기다리지 않도록
   * 장치 중지만 기다립니다. 콜백 종료 후에도 큐 처리를 계속하며,
   * 외부에서 다시 await stop()하면 전체 완료를 기다릴 수 있습니다.
   */
  stop(): Promise<void> {
    ++this.stopVersion;
    const current = currentRecorderSession(this[audioHandle]);
    if (current) return current.requestStop();
    // Cancel an onStart callback immediately, even while start owns the queue.
    // @zh 即使 start 占用队列，也立即取消 onStart 回调。
    // @ja start がキューを占有中でも、onStart コールバックを即座に取り消します。
    // @ko start가 큐를 점유하는 동안에도 onStart 콜백을 즉시 취소합니다.
    void this.directSession?.requestStop().catch(() => {});
    return this.run(async () => {
      if (this.directSession) {
        await this.directSession.stop();
        return;
      }
      const buffer = await audioAsync<AudioHandle<'bufferData'> | undefined>(
        callback => audioNative.stopAudioRecorder(this[audioHandle], callback));
      if (buffer) this.onBuffer(buffer);
      await this.session?.drain();
    });
  }
  /**
   * Return current Worker or subclass callback queue statistics;
   * the native fast path returns undefined.
   * @zh 返回当前 Worker 或子类回调队列统计；Native 快路径为 undefined。
   * @ja 現在の Worker またはサブクラスコールバックのキュー統計を返します。
   * Native 高速経路では undefined です。
   * @ko 현재 Worker 또는 하위 클래스 콜백 큐 통계를 반환합니다.
   * Native 고속 경로에서는 undefined입니다.
   */
  getWorkerStats(): AudioWorkerStats | undefined {
    return this.directSession?.getStats() ?? this.session?.getStats();
  }
  /**
   * Return the first Worker or subclass callback error, or undefined if none.
   * @zh 返回 Worker 或子类回调的首次错误；没有错误时为 undefined。
   * @ja Worker またはサブクラスコールバックの最初のエラーを返します。
   * エラーがなければ undefined。
   * @ko Worker 또는 하위 클래스 콜백의 첫 오류를 반환합니다.
   * 오류가 없으면 undefined입니다.
   */
  getWorkerError(): Error | undefined {
    return this.directSession?.error ?? this.session?.error;
  }
  /**
   * Enable recording callbacks on the owning JS thread as needed;
   * ordinary Worker recorders do not use this pipeline.
   * @zh 按需启用所属 JS 线程的录音回调；普通 Worker 录音器不使用该管线。
   * @ja 必要に応じて所属 JS スレッドの録音コールバックを有効にします。
   * 通常の Worker 録音器はこのパイプラインを使いません。
   * @ko 필요에 따라 소속 JS 스레드의 녹음 콜백을 활성화합니다.
   * 일반 Worker 녹음기는 이 파이프라인을 사용하지 않습니다.
   */
  protected recorderCallbacks(): AudioRecorderCallbacks | undefined {
    return undefined;
  }
  /**
   * Receive a completed native recording buffer.
   * @zh 接收已完成的 Native 录音缓冲区。
   * @ja 完成した Native 録音バッファーを受け取ります。
   * @ko 완성된 Native 녹음 버퍼를 받습니다.
   */
  protected onBuffer(buffer: AudioHandle<'bufferData'>): void { void buffer; }
  private run<T>(action: () => Promise<T>): Promise<T> {
    ++this.pendingOperations;
    return this.queue.run(action).finally(() => { --this.pendingOperations; });
  }
}
