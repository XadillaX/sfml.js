import { createServer, Server, type Socket as NetSocket } from 'node:net';
import { Socket, SocketStatus as Status,
  socketEvents, SocketType, type SocketHandle } from './socket';
import { IpAddress } from './ip-address';
import { TcpSocket, adoptTcp } from './tcp-socket';
import { SerialQueue, uint, waitFor } from './common';

/** 监听 TCP 连接并通过 accept 将连接交给 TcpSocket。 */
export class TcpListener extends Socket {
  /** 与基类生命周期共用的 Node 监听传输。 */
  declare protected transport?: Server;
  private pending: NetSocket[] = [];
  private listening = false;
  private readonly accepts = new SerialQueue();
  /** 创建尚未监听的 TCP 监听器。 */
  constructor() { super(SocketType.Tcp); }
  /** 返回监听端口；未监听时为 0。 */
  getLocalPort(): number {
    const address = this.transport?.address();
    return address && typeof address !== 'string' ? address.port : 0;
  }
  /** 异步绑定并监听，port 为 0 时自动分配端口；默认绑定所有 IPv4 接口。 */
  async listen(port: number, address: IpAddress = IpAddress.Any):
  Promise<Status> {
    uint(port, 65535);
    if (!(address instanceof IpAddress)) throw new TypeError('Expected IpAddress');
    this.create(address.getType());
    const generation = this.epoch;
    const server = this.transport!;
    const ready = waitFor(this[socketEvents], () => this.listening ||
      !!this.failure || generation !== this.epoch);
    server.listen({ host: address.toString(), port, ipv6Only: address.isV6() });
    await ready;
    return generation !== this.epoch ? Status.Disconnected
      : this.listening ? Status.Done : Status.Error;
  }
  /** 监听器分配 Server，不创建客户端传输或隐式监听端口。 */
  protected allocateHandle(): Server {
    return createServer({ pauseOnConnect: true });
  }
  /** 监听器仅接管 Node Server。 */
  protected validateHandle(handle: SocketHandle): void {
    if (!(handle instanceof Server)) throw new TypeError('Expected Node Server');
  }
  /** 安装接受队列及监听状态，支持接管已经监听的 Server。 */
  protected onCreate(): void {
    const server = this.transport!;
    const generation = this.epoch;
    const current = () => server === this.transport && generation === this.epoch;
    this.listening = server.listening;
    const connection = (socket: NetSocket) => {
      if (!current() || this.pending.length >= 128) {
        socket.destroy();
        return;
      }
      socket.on('error', () => {});
      this.pending.push(socket);
      this.changed();
    };
    const error = (error: Error) => {
      if (!current()) return;
      this.failure = error;
      this.listening = false;
      this.changed();
    };
    const listening = () => {
      if (!current()) return;
      this.listening = true; this.changed();
    };
    const closed = () => {
      if (!current()) return;
      this.listening = false; this.changed();
    };
    server.on('connection', connection)
      .on('error', error)
      .on('listening', listening)
      .on('close', closed);
    this.detach = () => {
      server.off('connection', connection)
        .off('error', error)
        .off('listening', listening)
        .off('close', closed);
    };
  }
  /** 停止监听并关闭尚未 accept 的连接。 */
  close(): void { super.close(); }
  /** 清空旧代际中尚未接受的连接。 */
  protected onClose(): void {
    this.listening = false;
    for (const socket of this.pending) socket.destroy();
    this.pending = [];
  }
  /** 将下一个连接交给 socket；阻塞模式异步等待，非阻塞模式无连接时返回 NotReady。 */
  accept(socket: TcpSocket): Promise<Status> {
    if (!(socket instanceof TcpSocket)) throw new TypeError('Expected TcpSocket');
    const generation = this.epoch;
    return this.accepts.run(async () => {
      await this.awaitReady(() => this.pending.length > 0 || !this.listening,
        generation);
      if (generation !== this.epoch || !this.listening) return Status.Error;
      const accepted = this.pending.shift();
      if (!accepted) return Status.NotReady;
      socket[adoptTcp](accepted);
      return Status.Done;
    });
  }
  /** 返回监听状态，允许派生类扩展。 */
  protected isAlive(): boolean { return this.listening; }
  /** 接受队列非空时报告接收就绪。 */
  protected getReadiness(mask: number): number {
    // eslint-disable-next-line no-bitwise
    return this.pending.length ? mask & 1 : 0;
  }
  protected getNativeHandle(): Server | undefined { return this.transport; }
}
