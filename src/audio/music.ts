import { AsyncLocalStorage } from 'node:async_hooks';
import {
  audioNative, audioHandle, audioAsync, AudioQueue,
} from '../internal/audio-native';
import { SoundStream } from './sound-stream';
import { Time } from '../system/time';
import { TimeSpan, type TimeSpanInput, duration } from './value';
import { audioReaders } from '../internal/audio-codec-registry';
import {
  AudioMusicPump, type AudioMusicCallbacks,
} from '../internal/audio-music-pump';
import { InputSoundFile } from './input-sound-file';
import type { InputStream } from '../system/input-stream';
import type { AudioWorkerStats, SoundStreamChunk } from './worker';

/**
 * super inside a callback always accesses the session that initiated it.
 * @zh 回调内的 super 始终访问发起该回调的会话。
 * @ja コールバック内の super は常にそのコールバックを開始したセッションにアクセスします。
 * @ko 콜백 내부의 super는 항상 해당 콜백을 시작한 세션에 접근합니다.
 */
const callbackContext = new AsyncLocalStorage<{
  owner: WeakRef<Music>; pump: AudioMusicPump;
}>();
/**
 * Retain only the decoding session for Music finalization; session callbacks
 * must hold only weak references to Music.
 * @zh 回收 Music 时仅持有解码会话；会话回调只能弱引用 Music。
 * @ja Music の回収時はデコードセッションのみを保持します。
 * セッションコールバックは Music への弱参照のみを持つ必要があります。
 * @ko Music 회수 시 디코딩 세션만 보유합니다.
 * 세션 콜백은 Music에 대한 약한 참조만 가져야 합니다.
 */
const pumpCleanup = new FinalizationRegistry<AudioMusicPump>(pump => {
  void pump.close().catch(() => {});
});

/**
 * Decode and play long audio in blocks without loading all samples into memory
 * at once.
 * @zh 按块解码和播放长音频，无需一次将全部样本加载到内存。
 * @ja 全サンプルを一度にメモリへ読み込まず、長い音声をブロック単位でデコード・再生します。
 * @ko 모든 샘플을 한 번에 메모리에 로드하지 않고 긴 오디오를 블록별로 디코딩하고 재생합니다.
 */
export class Music extends SoundStream {
  /**
   * Time span type for the loop region.
   * @zh 循环区间的时间段类型。
   * @ja ループ区間の時間範囲の型。
   * @ko 반복 구간의 시간 범위 타입입니다.
   */
  static readonly TimeSpan = TimeSpan;
  /**
   * Serialize open and close operations.
   * @zh 串行管理打开和关闭操作。
   * @ja 開く操作と閉じる操作を直列に管理します。
   * @ko 열기 및 닫기 작업을 직렬로 관리합니다.
   */
  private readonly queue = new AudioQueue();
  /**
   * Current file decoding session with optional subclass callbacks.
   * @zh 当前文件解码与可选子类回调会话。
   * @ja 現在のファイルのデコードと任意のサブクラスコールバックのセッション。
   * @ko 현재 파일 디코딩 및 선택적 하위 클래스 콜백 세션입니다.
   */
  private pump?: AudioMusicPump;
  /**
   * Increment on close to cancel earlier open requests not yet installed.
   * @zh 关闭时递增，取消此前尚未安装的打开请求。
   * @ja 閉じる際に増加し、まだ適用されていない以前のオープン要求を取り消します。
   * @ko 닫을 때 증가하여 아직 적용되지 않은 이전 열기 요청을 취소합니다.
   */
  private closeGeneration = 0;

  /**
   * Create a music playback source with no open content.
   * @zh 创建未打开内容的音乐播放源。
   * @ja コンテンツを開いていない音楽再生音源を作成します。
   * @ko 콘텐츠가 열리지 않은 음악 재생 음원을 생성합니다.
   */
  constructor() { super(undefined, audioNative.createAudioSource()); }
  /**
   * Asynchronously open an audio file for streaming and return whether it
   * succeeded; does not call play automatically.
   * @zh 异步打开音频文件用于流式播放，返回是否成功；不会自动 play。
   * @ja ストリーミング再生用に音声ファイルを非同期で開き、成功したかどうかを返します。
   * play は自動では呼びません。
   * @ko 스트리밍 재생을 위해 오디오 파일을 비동기로 열고 성공 여부를 반환합니다.
   * play를 자동으로 호출하지 않습니다.
   */
  openFromFile(filename: string): Promise<boolean> { return this.open(filename); }
  /**
   * Asynchronously open encoded audio bytes for streaming, returning whether it
   * succeeded.
   * @zh 异步打开编码音频字节用于流式播放，返回是否成功。
   * @ja ストリーミング用にエンコード済み音声バイトを非同期で開き、
   * 成功したかどうかを返します。
   * @ko 스트리밍 재생을 위해 인코딩된 오디오 바이트를 비동기로 열고 성공 여부를 반환합니다.
   */
  openFromMemory(data: Uint8Array): Promise<boolean> { return this.open(data); }
  /**
   * Asynchronously open a seekable stream, retaining the data source needed for
   * decoding until close.
   * @zh 异步打开可寻址流，保留解码所需的数据源直到 close。
   * @ja シーク可能なストリームを非同期で開き、
   * デコードに必要なデータソースを close まで保持します。
   * @ko 탐색 가능한 스트림을 비동기로 열고,
   * 디코딩에 필요한 데이터 소스를 close까지 유지합니다.
   */
  openFromStream(stream: InputStream): Promise<boolean> {
    return this.open(stream);
  }
  /**
   * Return the latest streaming decoder pump error, or undefined if no pump is
   * used or no error exists.
   * @zh 返回流式解码泵最近的错误；未使用解码泵或无错误时为 undefined。
   * @ja ストリーミングデコードポンプの最新エラーを返します。
   * ポンプを使っていないかエラーがなければ undefined。
   * @ko 스트리밍 디코딩 펌프의 최근 오류를 반환합니다.
   * 펌프를 사용하지 않거나 오류가 없으면 undefined입니다.
   */
  getWorkerError(): Error | undefined { return this.pump?.error; }
  /**
   * Return streaming decoder queue statistics, or undefined if no pump is used.
   * @zh 返回流式解码队列统计；未使用解码泵时为 undefined。
   * @ja ストリーミングデコードキューの統計を返します。ポンプ未使用なら undefined。
   * @ko 스트리밍 디코딩 큐 통계를 반환합니다. 디코딩 펌프를 사용하지 않으면 undefined입니다.
   */
  getWorkerStats(): AudioWorkerStats | undefined {
    return this.pump?.getStats();
  }
  /**
   * Stop playback and asynchronously close the decoding data source.
   * Inside this object's own audio callback, only request closure; actual
   * cleanup completes after that callback ends.
   * @zh 停止播放并异步关闭解码数据源。
   * 在自身音频回调内调用时只请求关闭；实际清理于该回调结束后完成。
   * @ja 再生を停止し、デコード用データソースを非同期で閉じます。
   * 自身の音声コールバック内では終了を要求するだけで、
   * 実際のクリーンアップはそのコールバック終了後に完了します。
   * @ko 재생을 중지하고 디코딩 데이터 소스를 비동기로 닫습니다.
   * 자신의 오디오 콜백 내에서는 닫기만 요청하며,
   * 실제 정리는 해당 콜백이 끝난 후 완료됩니다.
   */
  close(): Promise<void> {
    ++this.closeGeneration;
    const context = callbackContext.getStore();
    const reentrant = context?.owner.deref() === this;
    // Stop feeding before queueing cleanup so open cannot wait for initial data.
    // @zh 先终止供数，再排队等待清理，避免打开过程仍在等待首批数据。
    // @ja 先に供給を停止してから後処理をキューに入れ、初期データ待ちを防ぎます。
    // @ko 열기가 초기 데이터를 기다리지 않도록 공급 중단 후 정리를 큐에 넣습니다.
    this.pump?.requestClose();
    if (reentrant && context.pump !== this.pump) context.pump.requestClose();
    const closed = this.queue.run(async () => {
      this.stop();
      try { await this.closePump(); } finally {
        audioNative.closeAudioMusic(this[audioHandle]);
        this.refreshChannels();
      }
    });
    if (reentrant) {
      void closed.catch(() => {});
      return Promise.resolve();
    }
    return closed;
  }
  /**
   * Return the total music duration.
   * @zh 返回音乐总时长。
   * @ja 音楽全体の長さを返します。
   * @ko 음악의 전체 길이를 반환합니다.
   */
  getDuration(): Time { this.command(7); return new Time(this.times[1]); }
  /**
   * Return a copy of the loop region, including its starting offset and length.
   * @zh 返回循环区间副本，包含起点偏移和长度。
   * @ja 開始オフセットと長さを含むループ区間のコピーを返します。
   * @ko 시작 오프셋과 길이를 포함한 반복 구간 복사본을 반환합니다.
   */
  getLoopPoints(): TimeSpan {
    this.command(6);
    return new TimeSpan({ offset: new Time(this.times[2]),
      length: new Time(this.times[3]) });
  }
  /**
   * Set the loop region; call setLooping(true) separately to enable looping.
   * @zh 设置循环区间；启用循环需另行调用 setLooping(true)。
   * @ja ループ区間を設定します。有効にするには別途 setLooping(true) を呼びます。
   * @ko 반복 구간을 설정합니다. 반복 활성화는 별도로 setLooping(true)를 호출해야 합니다.
   */
  setLoopPoints(value: Readonly<TimeSpanInput>): void {
    const offset = duration(value.offset);
    const length = duration(value.length);
    this.times[2] = offset;
    this.times[3] = length;
    this.command(5);
  }
  /**
   * Fill interleaved 16-bit PCM on the object's owning JS thread; await super
   * to read the current file. samples references a reusable native slot, valid
   * only until the callback ends; false denotes the final block.
   * @zh 在对象所属 JS 线程填充交错 16 位 PCM；await super 可读取当前文件。
   * samples 指向原生可复用槽，仅在回调结束前有效；false 表示末块。
   * @ja オブジェクトの所属 JS スレッドで 16 ビットインターリーブ PCM を埋めます。
   * await super で現在のファイルを読み取れます。samples は再利用可能な
   * ネイティブスロットを参照し、コールバック終了までのみ有効です。
   * false は最終ブロックを示します。
   * @ko 객체가 속한 JS 스레드에서 16비트 인터리브 PCM을 채웁니다.
   * await super로 현재 파일을 읽을 수 있습니다. samples는 재사용 가능한
   * 네이티브 슬롯을 참조하며 콜백 종료 전까지만 유효합니다. false는 마지막 블록입니다.
   */
  protected onGetData(chunk: SoundStreamChunk): boolean | Promise<boolean> {
    return this.callbackPump().onGetData(chunk);
  }
  /**
   * Seek on the object's owning JS thread; await super performs the current
   * file's default seek.
   * @zh 在对象所属 JS 线程定位；await super 执行当前文件的默认定位。
   * @ja オブジェクトの所属 JS スレッドでシークします。
   * await super で現在のファイルの既定のシークを実行します。
   * @ko 객체가 속한 JS 스레드에서 탐색합니다.
   * await super는 현재 파일의 기본 탐색을 수행합니다.
   */
  protected onSeek(offset: Time): void | Promise<void> {
    return this.callbackPump().onSeek(offset);
  }
  /**
   * Called on the object's owning JS thread while preparing the final block;
   * return the next loop's interleaved sample offset. super returns the file's
   * loop region or EOF position; undefined means no loop. The audio consumer
   * thread initiates the actual seek, then asynchronously delegates to onSeek.
   * @zh 在对象所属 JS 线程准备末块时调用，返回下一轮交错样本偏移。
   * super 返回文件循环区间或 EOF 的位置；undefined 表示不循环。
   * 实际定位由音频消费线程发起，再异步交给 onSeek。
   * @ja 最終ブロックの準備中にオブジェクトの所属 JS スレッドで呼ばれ、
   * 次のループのインターリーブサンプルオフセットを返します。super は
   * ファイルのループ区間または EOF の位置を返し、undefined はループなしを表します。
   * 実際のシークは音声消費スレッドが開始し、非同期で onSeek に委譲します。
   * @ko 마지막 블록 준비 중 객체가 속한 JS 스레드에서 호출되며
   * 다음 반복의 인터리브 샘플 오프셋을 반환합니다. super는 파일의 반복 구간
   * 또는 EOF 위치를 반환하며 undefined는 반복하지 않음을 뜻합니다.
   * 실제 탐색은 오디오 소비 스레드가 시작한 후 비동기로 onSeek에 넘깁니다.
   */
  protected onLoop(): bigint | undefined | Promise<bigint | undefined> {
    return this.callbackPump().onLoop();
  }
  /**
   * Get the current callback's session to avoid writing to newly opened music
   * after await.
   * @zh 获取当前回调所属的会话，避免 await 后误写新打开的音乐。
   * @ja 現在のコールバックのセッションを取得し、
   * await 後に新しく開いた音楽へ誤って書き込むのを防ぎます。
   * @ko 현재 콜백이 속한 세션을 가져와 await 후 새로 열린 음악에
   * 잘못 기록하는 것을 방지합니다.
   */
  private callbackPump(): AudioMusicPump {
    const context = callbackContext.getStore();
    if (context?.owner.deref() !== this) {
      throw new Error('Music callbacks are only available during playback');
    }
    return context.pump;
  }
  /**
   * Install weak-reference dispatchers only for subclass callback overrides,
   * preserving the native path for ordinary instances.
   * @zh 仅在子类覆写回调时安装弱引用派发器，保留普通实例 Native 路径。
   * @ja サブクラスがコールバックをオーバーライドした場合のみ弱参照の
   * ディスパッチャーを設定し、通常のインスタンスの Native 経路を維持します。
   * @ko 하위 클래스가 콜백을 재정의할 때만 약한 참조 디스패처를 설치하여
   * 일반 인스턴스의 Native 경로를 유지합니다.
   */
  private createCallbacks(): AudioMusicCallbacks | undefined {
    if (this.onGetData === Music.prototype.onGetData &&
        this.onSeek === Music.prototype.onSeek &&
        this.onLoop === Music.prototype.onLoop) return undefined;
    const owner = new WeakRef(this);
    return {
      onGetData: (chunk, pump) => callbackContext.run({ owner, pump }, () => {
        const target = owner.deref();
        if (target) return target.onGetData(chunk);
        pump.requestClose();
        chunk.sampleCount = 0;
        return false;
      }),
      onSeek: (offset, pump) => callbackContext.run({ owner, pump }, () => {
        const target = owner.deref();
        if (target) return target.onSeek(offset);
        pump.requestClose();
      }),
      onLoop: pump => callbackContext.run({ owner, pump }, () =>
        owner.deref()?.onLoop()),
    };
  }
  /**
   * Detach the current session and await native queue and file cleanup.
   * @zh 脱离当前会话并等待 Native 队列和文件清理。
   * @ja 現在のセッションを切り離し、Native キューとファイルの後処理を待ちます。
   * @ko 현재 세션을 분리하고 Native 큐와 파일 정리를 기다립니다.
   */
  private async closePump(): Promise<void> {
    pumpCleanup.unregister(this);
    const pump = this.pump;
    this.pump = undefined;
    await pump?.close();
  }
  /**
   * Open a new file; reject reopening inside session callbacks to avoid waiting
   * for their own preparation phase.
   * @zh 打开新文件；会话回调中拒绝重开，避免等待其自身的准备阶段。
   * @ja 新しいファイルを開きます。自身の準備段階を待たないよう、
   * セッションコールバック内での再オープンは拒否します。
   * @ko 새 파일을 엽니다. 자신의 준비 단계를 기다리지 않도록
   * 세션 콜백 내에서 다시 여는 요청은 거부합니다.
   */
  private open(input: string | Uint8Array | InputStream): Promise<boolean> {
    if (callbackContext.getStore()?.owner.deref() === this) {
      return Promise.reject(new Error('Cannot reopen Music inside its callback'));
    }
    const generation = this.closeGeneration;
    return this.queue.run(async () => {
      if (generation !== this.closeGeneration) return false;
      const callbacks = this.createCallbacks();
      if (callbacks || audioReaders.size ||
          (typeof input !== 'string' && !(input instanceof Uint8Array))) {
        const file = new InputSoundFile();
        let adopted = false;
        try {
          const ok = typeof input === 'string' ? await file.openFromFile(input)
            : input instanceof Uint8Array ? await file.openFromMemory(input)
              : await file.openFromStream(input);
          if (!ok || generation !== this.closeGeneration) return false;
          this.stop();
          await this.closePump();
          if (generation !== this.closeGeneration) return false;
          const mapping = audioNative.openAudioMusicStream(this[audioHandle],
            1024, file.getChannelCount(), file.getSampleRate(), 8,
            Int32Array.from(file.getChannelMap()), file.getSampleCount());
          this.pump = new AudioMusicPump(mapping.handle, mapping.token, file,
            callbacks);
          adopted = true;
          pumpCleanup.register(this, this.pump, this);
          this.refreshChannels();
          return await this.pump.ready;
        } finally { if (!adopted) await file.close(); }
      }
      const ok = await audioAsync<boolean>(callback =>
        audioNative.openAudioMusic(this[audioHandle],
          input as string | Uint8Array, callback));
      if (ok) {
        await this.closePump();
        this.refreshChannels();
      }
      return ok;
    });
  }
}
