import { audioNative, type AudioHandle } from './audio-native';
import { InputSoundFile, cancelAudioInput } from '../audio/input-sound-file';
import type { AudioWorkerStats, SoundStreamChunk } from '../audio/worker';
import { Time } from '../system/time';
import { isAudioInputCancellation } from './audio-input-stream';

/** 对象所属 JS 线程的音乐回调；实现只能弱引用包装对象。 */
export interface AudioMusicCallbacks {
  /** 填充本次原生槽；完成前槽不会复用。 */
  onGetData(chunk: SoundStreamChunk, pump: AudioMusicPump):
  boolean | Promise<boolean>;
  /** 响应本次队列代数的定位请求。 */
  onSeek(offset: Time, pump: AudioMusicPump): void | Promise<void>;
  /** 准备末块时返回下一轮交错样本偏移。 */
  onLoop(pump: AudioMusicPump):
  bigint | undefined | Promise<bigint | undefined>;
}

/** Decode ahead into native slots; SFML's device callback only consumes PCM. */
export class AudioMusicPump {
  /** 首批 PCM 准备完成；关闭先于准备时返回 false。 */
  readonly ready: Promise<boolean>;
  /** 解码循环及底层文件清理的完成信号。 */
  private readonly done: Promise<void>;
  /** 已请求关闭，不再提交任何新数据。 */
  private closed = false;
  /** 保留解码或用户回调的首个错误。 */
  private failure?: Error;
  /** 首批数据已准备，空闲轮询可不再保活进程。 */
  private primed = false;
  /** 当前等待队列空位的定时器。 */
  private timer?: NodeJS.Timeout;
  /** 完成首批数据准备。 */
  private resolveReady!: (ok: boolean) => void;
  /** 报告首批数据准备失败。 */
  private rejectReady!: (error: unknown) => void;
  /** 当前租借槽的容量、循环设置等描述字段。 */
  private fields?: Int32Array;
  /** 当前租借槽的总样本数与循环区间。 */
  private counts?: BigUint64Array;
  /** 默认解码器为当前末块计算的下一轮样本位置。 */
  private loopOffset?: bigint;
  /** 当前定位回调的精确循环样本位置，保留微秒转换舍去的余数。 */
  private seekTarget?: { time: bigint; sample: bigint };

  /** 创建解码会话；下一微任务才开始调用用户代码。 */
  constructor(private readonly handle: AudioHandle<'worker'>, token: bigint,
    private readonly file: InputSoundFile,
    private readonly callbacks?: AudioMusicCallbacks) {
    this.ready = new Promise((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
    void this.ready.catch(() => {});
    this.done = Promise.resolve().then(() => this.run(token))
      .catch((error: unknown) => {
        if (!this.closed || !isAudioInputCancellation(error)) {
          this.failure ??= error instanceof Error ? error : new Error(String(error));
          this.rejectReady(this.failure);
        }
      })
      .finally(() => this.resolveReady(false));
  }

  /** 最近的解码或用户回调错误。 */
  get error(): Error | undefined { return this.failure; }
  /** 读取 Native 队列的累计统计。 */
  getStats(): AudioWorkerStats {
    const fields = new BigUint64Array(audioNative.audioWorkerStats(this.handle));
    return { underruns: fields[0], overruns: fields[1], processed: fields[2] };
  }
  /** 请求关闭但不等待当前用户回调，允许在回调内安全调用。 */
  requestClose(): void {
    this.closed = true;
    this.timer?.ref();
    audioNative.closeAudioWorker(this.handle);
    this.file[cancelAudioInput]();
  }
  /** 关闭并等待当前回调、文件句柄释放；不能在自身回调内等待。 */
  async close(): Promise<void> {
    this.requestClose();
    await this.done;
    if (this.failure) throw this.failure;
  }
  /** 默认解码实现；只能由当前会话的 onGetData 调用。 */
  async onGetData(chunk: SoundStreamChunk): Promise<boolean> {
    if (this.closed) { chunk.sampleCount = 0; return false; }
    const fields = this.fields!;
    const counts = this.counts!;
    const position = this.file.getSampleOffset();
    const end = counts[3] + counts[4];
    let size = chunk.samples.length;
    if (fields[4] && counts[4] && position <= end &&
        position + BigInt(size) > end) size = Number(end - position);
    let count: bigint;
    try {
      count = await this.file.read(chunk.samples.subarray(0, size));
    } catch (error) {
      if (!this.closed || !isAudioInputCancellation(error)) throw error;
      chunk.sampleCount = 0;
      return false;
    }
    const next = position + count;
    const loopEnd = fields[4] !== 0 && counts[4] !== 0n && next === end;
    chunk.sampleCount = Number(count);
    this.loopOffset = loopEnd ? counts[3] : next >= counts[2] ? 0n : undefined;
    return count !== 0n && next < counts[2] && !loopEnd;
  }
  /** 默认定位文件；时间以微秒表示。 */
  async onSeek(offset: Time): Promise<void> {
    if (this.closed) return;
    const target = this.seekTarget?.time === offset.asMicroseconds()
      ? this.seekTarget.sample : offset;
    try { await this.file.seek(target); } catch (error) {
      if (!this.closed || !isAudioInputCancellation(error)) throw error;
    }
  }
  /** 返回默认文件解码的下一轮交错样本位置。 */
  onLoop(): bigint | undefined { return this.loopOffset; }
  /** 用户回调错误独立于取消状态保留，并进入 ready/close 错误通道。 */
  private async dispatch<T>(callback: () => T | Promise<T>): Promise<T> {
    try { return await callback(); } catch (error) {
      this.failure ??= error instanceof Error ? error : new Error(String(error));
      this.rejectReady(this.failure);
      throw error;
    }
  }
  /** 在原生槽中串行解码，实时音频线程只消费已提交的 PCM。 */
  private async run(token: bigint): Promise<void> {
    const mapping = audioNative.attachAudioWorker(token);
    const fields = new Int32Array(mapping.fields);
    const times = new BigInt64Array(mapping.time);
    const counts = new BigUint64Array(mapping.time);
    this.fields = fields;
    this.counts = counts;
    const buffers = mapping.input.map(buffer => new Int16Array(buffer));
    let primed = 0;
    try {
      for (;;) {
        const operation = audioNative.pollAudioWorker(mapping.handle);
        if (operation === -3) break;
        if (operation === -2) {
          const offset = new Time(times[0]);
          this.seekTarget = times[5] >= 0n
            ? { time: times[0], sample: times[5] } : undefined;
          try {
            if (this.callbacks) {
              await this.dispatch(() => this.callbacks!.onSeek(offset, this));
            } else await this.onSeek(offset);
          } finally { this.seekTarget = undefined; }
          continue;
        }
        if (operation === -1) {
          await new Promise<void>(resolve => {
            this.timer = setTimeout(resolve, 2);
            if (this.primed && !this.closed) this.timer.unref();
          });
          this.timer = undefined;
          continue;
        }
        this.loopOffset = undefined;
        const samples = buffers[fields[0]];
        const chunk = { samples, sampleCount: fields[2] };
        const more = await (this.callbacks
          ? this.dispatch(() => this.callbacks!.onGetData(chunk, this))
          : this.onGetData(chunk));
        if (this.closed) break;
        if (typeof more !== 'boolean') {
          throw new TypeError('onGetData must return a boolean');
        }
        if (chunk.samples !== samples) {
          throw new TypeError('Fill the provided native sample buffer');
        }
        if (!Number.isInteger(chunk.sampleCount) || chunk.sampleCount < 0 ||
            chunk.sampleCount > samples.length) {
          throw new RangeError('Invalid stream sample count');
        }
        fields[2] = chunk.sampleCount;
        fields[3] = +more;
        const loop = more ? undefined : await (this.callbacks
          ? this.dispatch(() => this.callbacks!.onLoop(this)) : this.onLoop());
        if (this.closed) break;
        if (loop !== undefined && (typeof loop !== 'bigint' ||
            loop < 0n || loop > 0x7fffffffffffffffn)) {
          throw new RangeError('Invalid loop sample offset');
        }
        times[1] = loop ?? -1n;
        audioNative.commitAudioWorker(mapping.handle);
        if (++primed >= 2 || !more) {
          this.primed = true;
          this.resolveReady(true);
        }
      }
    } finally {
      audioNative.closeAudioWorker(this.handle);
      await this.file.close();
    }
  }
}
