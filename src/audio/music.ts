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

/** 回调内的 super 始终访问发起该回调的会话。 */
const callbackContext = new AsyncLocalStorage<{
  owner: WeakRef<Music>; pump: AudioMusicPump;
}>();
/** 回收 Music 时仅持有解码会话；会话回调只能弱引用 Music。 */
const pumpCleanup = new FinalizationRegistry<AudioMusicPump>(pump => {
  void pump.close().catch(() => {});
});

/** 按块解码和播放长音频，无需一次将全部样本加载到内存。 */
export class Music extends SoundStream {
  /** 循环区间的时间段类型。 */
  static readonly TimeSpan = TimeSpan;
  /** 串行管理打开和关闭操作。 */
  private readonly queue = new AudioQueue();
  /** 当前文件解码与可选子类回调会话。 */
  private pump?: AudioMusicPump;
  /** 关闭时递增，取消此前尚未安装的打开请求。 */
  private closeGeneration = 0;

  /** 创建未打开内容的音乐播放源。 */
  constructor() { super(undefined, audioNative.createAudioSource()); }
  /** 异步打开音频文件用于流式播放，返回是否成功；不会自动 play。 */
  openFromFile(filename: string): Promise<boolean> { return this.open(filename); }
  /** 异步打开编码音频字节用于流式播放，返回是否成功。 */
  openFromMemory(data: Uint8Array): Promise<boolean> { return this.open(data); }
  /** 异步打开可寻址流，保留解码所需的数据源直到 close。 */
  openFromStream(stream: InputStream): Promise<boolean> {
    return this.open(stream);
  }
  /** 返回流式解码泵最近的错误；未使用解码泵或无错误时为 undefined。 */
  getWorkerError(): Error | undefined { return this.pump?.error; }
  /** 返回流式解码队列统计；未使用解码泵时为 undefined。 */
  getWorkerStats(): AudioWorkerStats | undefined {
    return this.pump?.getStats();
  }
  /**
   * 停止播放并异步关闭解码数据源。
   * 在自身音频回调内调用时只请求关闭；实际清理于该回调结束后完成。
   */
  close(): Promise<void> {
    ++this.closeGeneration;
    const context = callbackContext.getStore();
    const reentrant = context?.owner.deref() === this;
    // 先终止供数，再排队等待清理，避免打开过程仍在等待首批数据。
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
  /** 返回音乐总时长。 */
  getDuration(): Time { this.command(7); return new Time(this.times[1]); }
  /** 返回循环区间副本，包含起点偏移和长度。 */
  getLoopPoints(): TimeSpan {
    this.command(6);
    return new TimeSpan({ offset: new Time(this.times[2]),
      length: new Time(this.times[3]) });
  }
  /** 设置循环区间；启用循环需另行调用 setLooping(true)。 */
  setLoopPoints(value: Readonly<TimeSpanInput>): void {
    const offset = duration(value.offset);
    const length = duration(value.length);
    this.times[2] = offset;
    this.times[3] = length;
    this.command(5);
  }
  /**
   * 在对象所属 JS 线程填充交错 16 位 PCM；await super 可读取当前文件。
   * samples 指向原生可复用槽，仅在回调结束前有效；false 表示末块。
   */
  protected onGetData(chunk: SoundStreamChunk): boolean | Promise<boolean> {
    return this.callbackPump().onGetData(chunk);
  }
  /** 在对象所属 JS 线程定位；await super 执行当前文件的默认定位。 */
  protected onSeek(offset: Time): void | Promise<void> {
    return this.callbackPump().onSeek(offset);
  }
  /**
   * 在对象所属 JS 线程准备末块时调用，返回下一轮交错样本偏移。
   * super 返回文件循环区间或 EOF 的位置；undefined 表示不循环。
   * 实际定位由音频消费线程发起，再异步交给 onSeek。
   */
  protected onLoop(): bigint | undefined | Promise<bigint | undefined> {
    return this.callbackPump().onLoop();
  }
  /** 获取当前回调所属的会话，避免 await 后误写新打开的音乐。 */
  private callbackPump(): AudioMusicPump {
    const context = callbackContext.getStore();
    if (context?.owner.deref() !== this) {
      throw new Error('Music callbacks are only available during playback');
    }
    return context.pump;
  }
  /** 仅在子类覆写回调时安装弱引用派发器，保留普通实例 Native 路径。 */
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
  /** 脱离当前会话并等待 Native 队列和文件清理。 */
  private async closePump(): Promise<void> {
    pumpCleanup.unregister(this);
    const pump = this.pump;
    this.pump = undefined;
    await pump?.close();
  }
  /** 打开新文件；会话回调中拒绝重开，避免等待其自身的准备阶段。 */
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
