import { EventEmitter } from 'node:events';
import { Socket as TcpHandle, Server } from 'node:net';
import { Socket as UdpHandle, createSocket } from 'node:dgram';
import { IpAddressType } from './ip-address';
import { uint, waitFor } from './common';

/** 套接字使用的传输协议，对应 sf::Socket::Type。 */
export enum SocketType {
  /** TCP 字节流协议。 */
  Tcp,
  /** UDP 数据报协议。 */
  Udp,
}

/** 套接字操作结果；阻塞模式通过 Promise 等待，不阻塞 Node 事件循环。 */
export enum SocketStatus {
  /** 操作完成。 */
  Done,
  /** 暂无数据或发送空间，稍后重试。 */
  NotReady,
  /** 仅发送了部分数据，需继续发送剩余部分。 */
  Partial,
  /** 连接已断开。 */
  Disconnected,
  /** 操作出错，可通过 getLastError 获取底层错误。 */
  Error,
}
/** Node TCP、UDP 或监听传输对象，不接受操作系统裸文件描述符。 */
export type SocketHandle = TcpHandle | Server | UdpHandle;
export const socketEvents: unique symbol = Symbol('Socket.events');
export const socketReady: unique symbol = Symbol('Socket.ready');
export const socketAlive: unique symbol = Symbol('Socket.alive');

/** 绑定失败可能清空 Node 的延迟关闭队列，错误派发结束后再释放旧句柄。 */
function closeDatagram(handle: UdpHandle): void {
  let retry: () => void;
  const cleanup = () => {
    handle.off('error', retry);
    handle.off('close', cleanup);
  };
  const close = () => {
    try { handle.close(); } catch { cleanup(); }
  };
  retry = () => { queueMicrotask(close); };
  handle.on('error', retry);
  handle.once('close', cleanup);
  close();
}

/** Node 网络传输的公共基类；默认使用异步等待的阻塞语义。 */
export abstract class Socket {
  /** 套接字操作状态枚举。 */
  static readonly Status = SocketStatus;
  /** 套接字传输协议枚举。 */
  static readonly Type = SocketType;
  /** 绑定端口时由系统自动分配可用端口。 */
  static readonly AnyPort = 0;
  readonly [socketEvents] = new EventEmitter();
  protected blocking = true;
  protected epoch = 0;
  protected failure?: Error;
  /** 当前独占的 Node 传输，关闭或重建时由 Node 释放。 */
  protected transport?: SocketHandle;
  /** 移除当前传输的事件监听。 */
  protected detach?: () => void;
  /** 初始化套接字公共状态，默认启用阻塞语义。 */
  protected constructor(private readonly type = SocketType.Tcp) {
    uint(type, 1);
    this[socketEvents].setMaxListeners(0);
  }
  /** 设置是否异步等待可读/可写；false 时按当前队列状态返回 NotReady 或 Partial。 */
  setBlocking(blocking: boolean): void {
    if (typeof blocking !== 'boolean') throw new TypeError('Expected a boolean');
    this.blocking = blocking;
    this.changed();
  }
  /** 返回是否使用异步等待的阻塞语义。 */
  isBlocking(): boolean { return this.blocking; }
  /** 返回最近的底层错误；未记录错误时为 undefined。 */
  getLastError(): Error | undefined { return this.failure; }
  protected changed(): void { this[socketEvents].emit('change'); }
  protected async awaitReady(check: () => boolean, generation: number):
  Promise<boolean> {
    if (!check() && this.blocking && this.epoch === generation) {
      await waitFor(this[socketEvents], () => check() || !this.blocking ||
        this.epoch !== generation);
    }
    return this.epoch === generation && check();
  }
  /** 供 Selector 读取子类可覆盖的就绪条件。 */
  [socketReady](mask: number): number { return this.getReadiness(mask); }
  /** 供 Selector 查询子类可覆盖的存活状态。 */
  [socketAlive](): boolean { return this.isAlive(); }
  /** 供子类访问底层 Node 传输对象；未创建时为 undefined。 */
  protected getNativeHandle(): SocketHandle | undefined { return this.transport; }
  /** 分配指定地址族的传输，不隐式连接或绑定端口。 */
  protected create(addressType?: IpAddressType): void;
  /** 接管 Node 传输并关闭旧传输；不接管裸文件描述符。 */
  protected create(handle: SocketHandle): void;
  protected create(value: IpAddressType | SocketHandle = IpAddressType.IpV4):
  void {
    const handle = typeof value === 'number'
      ? this.allocateHandle(uint(value, 1)) : value;
    this.validateHandle(handle);
    if (handle === this.transport) return;
    this.close();
    this.failure = undefined;
    this.transport = handle;
    this.onCreate();
    this.changed();
  }
  /** 关闭当前传输并唤醒旧代际的等待；重复调用安全，阻塞标志不变。 */
  protected close(): void {
    const handle = this.transport;
    this.epoch++;
    this.detach?.();
    this.detach = undefined;
    this.transport = undefined;
    this.onClose();
    if (handle instanceof UdpHandle) closeDatagram(handle);
    else if (handle) {
      // 销毁期间可能产生迟到的错误；不再保留捕获当前实例的监听闭包。
      const ignore = () => {};
      handle.on('error', ignore);
      handle.once('close', () => handle.off('error', ignore));
      if (handle instanceof TcpHandle) handle.destroy();
      else {
        try { handle.close(); } catch { handle.off('error', ignore); }
      }
    }
    this.changed();
  }
  /** 按协议分配未连接传输；监听器可覆盖为 Node Server。 */
  protected allocateHandle(addressType: IpAddressType): SocketHandle {
    return this.type === SocketType.Tcp ? new TcpHandle()
      : createSocket(addressType === IpAddressType.IpV4 ? 'udp4' : 'udp6');
  }
  /** 接管前验证传输类型，避免关闭旧连接后才发现类型错误。 */
  protected validateHandle(handle: SocketHandle): void {
    if (this.type === SocketType.Udp ? !(handle instanceof UdpHandle)
      : !(handle instanceof TcpHandle || handle instanceof Server)) {
      throw new TypeError('Expected a matching Node socket transport');
    }
  }
  /** 安装默认 TCP/UDP/Server 状态监听；子类可覆盖以管理自己的收发队列。 */
  protected onCreate(): void {
    const handle = this.transport!;
    const generation = this.epoch;
    const current = () => this.epoch === generation && this.transport === handle;
    const notify = () => { if (current()) this.changed(); };
    const error = (error: Error) => {
      if (!current()) return;
      this.failure = error; this.changed();
    };
    const events = [ 'readable', 'drain', 'connect', 'end', 'close', 'listening' ];
    for (const event of events) handle.on(event, notify);
    handle.on('error', error);
    this.detach = () => {
      for (const event of events) handle.off(event, notify);
      handle.off('error', error);
    };
  }
  /** 关闭时清理子类状态，调用时旧传输已解除关联。 */
  protected onClose(): void {}
  /** 默认查询 Node 传输是否存活；子类可覆盖，不需要导入内部 symbol。 */
  protected isAlive(): boolean {
    const handle = this.transport;
    if (handle instanceof TcpHandle) return !handle.destroyed;
    if (handle instanceof Server) return handle.listening;
    if (handle instanceof UdpHandle) {
      try { handle.address(); return true; } catch { return false; }
    }
    return false;
  }
  /**
   * 默认 TCP 按可读字节和写入背压就绪，已绑定 UDP 可发送。
   * UDP 数据报和 Server 连接队列由子类通过此钩子和 changed() 通知 Selector。
   */
  protected getReadiness(mask: number): number {
    const handle = this.transport;
    let ready = 0;
    if (handle instanceof TcpHandle) {
      if (handle.readableLength || handle.readableEnded || handle.destroyed) {
        ready += 1;
      }
      if (handle.remoteAddress && !handle.connecting && !handle.destroyed &&
        handle.writable && !handle.writableNeedDrain) ready += 2;
    } else if (handle instanceof UdpHandle && this.isAlive()) ready = 2;
    // eslint-disable-next-line no-bitwise
    return ready & mask;
  }
  /** 等待写操作或代际取消；关闭时不依赖底层写回调是否会触发。 */
  protected async awaitWrite(completion: Promise<SocketStatus>,
    generation: number): Promise<SocketStatus> {
    const cancel = new AbortController();
    const closed = waitFor(this[socketEvents],
      () => this.epoch !== generation, 0, cancel.signal)
      .then(() => SocketStatus.Disconnected);
    try { return await Promise.race([ completion, closed ]); } finally {
      cancel.abort();
    }
  }
}
