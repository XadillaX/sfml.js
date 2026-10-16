import { EventEmitter } from 'node:events';
import { Socket, socketReady, socketEvents, socketAlive } from './socket';
import { Time } from '../system/time';
import { millisecondsOf, uint, waitFor, type NetworkTime } from './common';

/** 套接字就绪条件，可按位组合。 */
export enum ReadinessType {
  /** 有数据、连接或断开状态可供读取处理。 */
  Receive = 1,
  /** 传输层当前可接受写入。 */
  Send = 2,
}
/** 接收本次 wait 得到的就绪位标志。 */
export type ReadyCallback = (readiness: number) => void;
interface Entry { mask: number; callback?: ReadyCallback }

/** 异步等待一组套接字就绪，并保存最近一次 wait 的结果。 */
export class SocketSelector {
  /** 可接收位标志。 */
  static readonly Receive = ReadinessType.Receive;
  /** 可发送位标志。 */
  static readonly Send = ReadinessType.Send;
  private entries = new Map<Socket, Entry>();
  private ready = new Map<Socket, number>();
  private waiting = false;
  private cancel?: AbortController;
  /** 创建空选择器，或复制注册集合、回调和就绪快照。 */
  constructor(source?: SocketSelector) {
    if (source !== undefined) this.assign(source);
  }
  /** 复制另一个选择器的集合和快照，返回 this；当前不得有待完成的 wait。 */
  assign(source: SocketSelector): this {
    if (!(source instanceof SocketSelector)) {
      throw new TypeError('Expected a SocketSelector');
    }
    if (source === this) return this;
    if (this.waiting) throw new Error('Finish the pending wait before assigning');
    this.entries = new Map(source.entries);
    this.ready = new Map(source.ready);
    return this;
  }
  /** 注册活动套接字及就绪条件；重复或未打开返回 false，回调需显式 dispatch。 */
  add(socket: Socket, readiness = ReadinessType.Receive,
    callback?: ReadyCallback): boolean {
    if (!(socket instanceof Socket)) throw new TypeError('Expected a Socket');
    uint(readiness, 3);
    if (!readiness) throw new RangeError('Expected Receive and/or Send');
    if (callback !== undefined && typeof callback !== 'function') {
      throw new TypeError('Expected a callback');
    }
    if (!socket[socketAlive]() || this.entries.has(socket)) return false;
    this.entries.set(socket, { mask: readiness, callback });
    this.cancel?.abort();
    return true;
  }
  /** 移除套接字及就绪结果，返回此前是否注册；唤醒待完成的 wait。 */
  remove(socket: Socket): boolean {
    this.ready.delete(socket);
    const removed = this.entries.delete(socket);
    this.cancel?.abort();
    return removed;
  }
  /** 清空注册及就绪结果，并唤醒待完成的 wait。 */
  clear(): void {
    this.entries.clear();
    this.ready.clear();
    this.cancel?.abort();
  }
  /** 异步等待并刷新就绪快照；Time.Zero 不设超时，返回是否有就绪项，不允许并发 wait。 */
  async wait(timeout: NetworkTime = Time.Zero): Promise<boolean> {
    const milliseconds = millisecondsOf(timeout);
    if (this.waiting) throw new Error('A selector wait is already pending');
    this.ready.clear();
    if (!this.entries.size) return false;
    this.waiting = true;
    this.cancel = new AbortController();
    const events = new EventEmitter();
    const notify = () => events.emit('change');
    const sockets = [ ...this.entries.keys() ];
    for (const socket of sockets) socket[socketEvents].on('change', notify);
    try {
      await waitFor(events, () => {
        let count = 0;
        for (const [ socket, entry ] of this.entries) {
          const mask = socket[socketReady](entry.mask);
          if (mask) { this.ready.set(socket, mask); count++; } else {
            this.ready.delete(socket);
          }
        }
        return count !== 0 || [ ...this.entries.keys() ]
          .every(socket => !socket[socketAlive]());
      }, milliseconds, this.cancel.signal);
      return this.ready.size > 0;
    } finally {
      for (const socket of sockets) socket[socketEvents].off('change', notify);
      this.waiting = false;
      this.cancel = undefined;
    }
  }
  /** 查询最近一次 wait 快照中是否含有指定就绪条件。 */
  isReady(socket: Socket, readiness = ReadinessType.Receive): boolean {
    uint(readiness, 3);
    // eslint-disable-next-line no-bitwise
    return ((this.ready.get(socket) ?? 0) & readiness) !== 0;
  }
  /** 同步调用最近一次 wait 中就绪项的已注册回调。 */
  dispatchReadyCallbacks(): void {
    const callbacks = [ ...this.ready ].map(([ socket, mask ]) =>
      ({ callback: this.entries.get(socket)?.callback, mask }));
    for (const { callback, mask } of callbacks) callback?.(mask);
  }
}
