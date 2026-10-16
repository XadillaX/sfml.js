import { Socket as UdpHandle, type RemoteInfo } from 'node:dgram';
import { Socket, SocketStatus as Status,
  socketEvents, SocketType, type SocketHandle } from './socket';
import { IpAddress } from './ip-address';
import { Packet, packetReceive, packetSend } from './packet';
import { SerialQueue, bytes, uint, waitFor } from './common';

/** 单个 UDP 数据报的接收结果。 */
export interface DatagramResult {
  /** 操作结果状态。 */
  status: Status;
  /** 写入目标的字节数，失败时为 0。 */
  received: number;
  /** 成功接收时的发送方地址。 */
  remoteAddress?: IpAddress;
  /** 发送方端口，失败时为 0。 */
  remotePort: number;
}
/** 保留数据报边界的 UDP 套接字，Packet 不附加 TCP 长度头。 */
export class UdpSocket extends Socket {
  /** 本实现允许的最大 UDP 数据报载荷字节数。 */
  static readonly MaxDatagramSize = 65507;
  /** 底层 UDP 套接字句柄。 */
  declare protected transport?: UdpHandle;
  /** 是否已绑定端口。 */
  private bound = false;
  /** 绑定地址族，4 或 6。 */
  private family = 4;
  /** 待交付的缓冲数据报队列。 */
  private pending: { data: Buffer; peer: RemoteInfo }[] = [];
  /** 待交付缓冲区的总字节数，上限 8 MiB。 */
  private pendingBytes = 0;
  /** 接收操作串行队列。 */
  private readonly reads = new SerialQueue();
  /** 发送操作串行队列。 */
  private readonly writes = new SerialQueue();
  /** 创建尚未绑定的 UDP 套接字，默认使用异步阻塞语义。 */
  constructor() { super(SocketType.Udp); }
  /** 返回已绑定的本地端口，未绑定时为 0。 */
  getLocalPort(): number {
    return this.bound ? this.transport!.address().port : 0;
  }
  /** 异步绑定本地端口和地址；port 为 0 时由系统分配，默认使用 IPv4。 */
  async bind(port: number, address: IpAddress = IpAddress.Any): Promise<Status> {
    uint(port, 65535);
    if (!(address instanceof IpAddress)) throw new TypeError('Expected IpAddress');
    this.create(address.getType());
    const socket = this.transport!;
    const generation = this.epoch;
    const ready = waitFor(this[socketEvents], () => this.bound ||
      !!this.failure || this.epoch !== generation);
    socket.bind(port, address.toString());
    await ready;
    return this.epoch !== generation ? Status.Disconnected
      : this.bound ? Status.Done : Status.Error;
  }
  /** 接管前拒绝非 UDP 的 Node 传输。 */
  protected validateHandle(handle: SocketHandle): void {
    if (!(handle instanceof UdpHandle)) throw new TypeError('Expected Node UDP');
  }
  /** 将分配或接管的 UDP 句柄接入同一数据报队列及绑定状态。 */
  protected onCreate(): void {
    const socket = this.transport!;
    const generation = this.epoch;
    // Node 运行时保存创建地址族，但当前 @types/node 未声明此字段。
    const { type } = socket as UdpHandle & { type: 'udp4' | 'udp6' };
    this.family = type === 'udp4' ? 4 : 6;
    const current = () => this.transport === socket && this.epoch === generation;
    const error = (error: Error) => {
      if (!current()) return;
      this.failure = error; this.changed();
    };
    const message = (data: Buffer, peer: RemoteInfo) => {
      if (!current()) return;
      if (this.pendingBytes + data.length <= 8 * 1024 * 1024 &&
          this.pending.length < 4096) {
        this.pending.push({ data, peer });
        this.pendingBytes += data.length;
        this.changed();
      }
    };
    const listening = () => {
      if (!current()) return;
      this.bound = true;
      if (this.family === 4) socket.setBroadcast(true);
      this.changed();
    };
    const closed = () => {
      if (!current()) return;
      this.bound = false; this.changed();
    };
    socket.on('error', error)
      .on('message', message)
      .on('listening', listening)
      .on('close', closed);
    this.detach = () => {
      socket.off('error', error)
        .off('message', message)
        .off('listening', listening)
        .off('close', closed);
    };
    try { socket.address(); listening(); } catch { this.bound = false; }
  }
  /** 关闭 UDP 传输并清空待接收的数据报。 */
  unbind(): void { this.close(); }
  /** 清空旧传输的绑定状态和数据报，旧读取通过代际变化取消。 */
  protected onClose(): void {
    this.bound = false;
    this.pending = [];
    this.pendingBytes = 0;
  }
  /** 发送调用时的数据快照为一个数据报；未绑定时按目标地址族自动绑定临时端口。 */
  send(data: Uint8Array | Packet, address: IpAddress, port: number):
  Promise<Status> {
    uint(port, 65535);
    if (!(address instanceof IpAddress)) throw new TypeError('Expected IpAddress');
    const input = Buffer.from(data instanceof Packet ? data[packetSend]() : bytes(data));
    if (input.length > UdpSocket.MaxDatagramSize) return Promise.resolve(Status.Error);
    if (!this.transport) this.create(address.getType());
    const generation = this.epoch;
    return this.writes.run(() => this.sendBytes(input, address, port, generation));
  }
  /** 发送字节数据报，未绑定时自动绑定。 */
  private async sendBytes(input: Buffer, address: IpAddress, port: number,
    generation: number): Promise<Status> {
    if (generation !== this.epoch) return Status.Disconnected;
    if (this.family !== (address.isV4() ? 4 : 6)) return Status.Error;
    const socket = this.transport!;
    let onError!: (error: Error) => void;
    const completion = new Promise<Status>(resolve => {
      const done = (error?: Error | null) => {
        if (generation !== this.epoch) return resolve(Status.Disconnected);
        if (error) this.failure = error;
        resolve(error ? Status.Error : Status.Done);
      };
      // Node 在 bind 失败时丢弃排队的 send 回调，必须监听 error 完成它。
      onError = done;
      socket.once('error', onError);
      try { socket.send(input, port, address.toString(), done); } catch (error) {
        done(error instanceof Error ? error : new Error(String(error)));
      }
    });
    try { return await this.awaitWrite(completion, generation); } finally {
      socket.off('error', onError);
    }
  }
  /** 接收一个完整数据报；目标字节区过小时丢弃并返回 Error，非阻塞无数据为 NotReady。 */
  receive(destination: Uint8Array | Packet): Promise<DatagramResult> {
    const output = destination instanceof Packet ? undefined : bytes(destination);
    const generation = this.epoch;
    return this.reads.run(async () => {
      const result = (status: Status): DatagramResult =>
        ({ status, received: 0, remotePort: 0 });
      await this.awaitReady(() => this.pending.length > 0 || !this.bound ||
        !!this.failure, generation);
      if (generation !== this.epoch || !this.bound) return result(Status.Error);
      const item = this.pending.shift();
      if (!item) return result(this.failure ? Status.Error : Status.NotReady);
      this.pendingBytes -= item.data.length;
      if (output && output.length < item.data.length) return result(Status.Error);
      if (destination instanceof Packet) destination[packetReceive](item.data);
      else item.data.copy(output!);
      return { status: Status.Done, received: item.data.length,
        remoteAddress: IpAddress.fromString(item.peer.address),
        remotePort: item.peer.port };
    });
  }
  /** 返回绑定状态，允许派生类扩展。 */
  protected isAlive(): boolean { return this.bound; }
  /** 返回待接收数据报和当前绑定对应的就绪位。 */
  protected getReadiness(mask: number): number {
    // eslint-disable-next-line no-bitwise
    return ((this.pending.length ? 1 : 0) | (this.bound ? 2 : 0)) & mask;
  }
  protected getNativeHandle(): UdpHandle | undefined { return this.transport; }
}
