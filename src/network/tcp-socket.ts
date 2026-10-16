import { Socket as NetSocket } from 'node:net';
import { TLSSocket, connect as tlsConnect, createSecureContext } from 'node:tls';
import { Time } from '../system/time';
import { IpAddress } from './ip-address';
import { Packet, packetReceive, packetSend } from './packet';
import { Socket, SocketStatus as Status,
  socketEvents, SocketType, type SocketHandle } from './socket';
import { SerialQueue, bytes, millisecondsOf, uint, waitFor,
  type NetworkTime } from './common';
import { tlsCertificate, tlsPrivateKey } from './tls-material';

/** TLS 升级的当前状态。 */
export enum TlsStatus {
  /** 未建立 TLS 连接。 */
  NotConnected,
  /** 握手已开始但尚未完成。 */
  HandshakeStarted,
  /** 握手完成，可以传输加密数据。 */
  HandshakeComplete,
  /** 握手失败。 */
  Error,
}
/** 原始 TCP 字节读取结果。 */
export interface SocketTransfer {
  /** 操作结果状态。 */
  status: Status;
  /** 实际写入目标缓冲区的字节数。 */
  received: number;
}
/** 原始 TCP 字节发送结果。 */
export interface SocketSendResult {
  /** 操作结果状态。 */
  status: Status;
  /** 已交给 Node 传输层的字节数，不代表对端已接收。 */
  sent: number;
}
export const adoptTcp: unique symbol = Symbol('TcpSocket.adopt');

/** 支持原始字节、SFML Packet 分帧和 TLS 升级的 TCP 套接字。 */
export class TcpSocket extends Socket {
  /** TLS 握手状态枚举。 */
  static readonly TlsStatus = TlsStatus;
  /** 底层 TCP 或 TLS 套接字。 */
  declare protected transport?: NetSocket;
  /** TCP 连接是否已建立。 */
  private connected = false;
  /** 对端是否已关闭发送。 */
  private ended = true;
  /** TLS 握手当前状态。 */
  private tlsStatus = TlsStatus.NotConnected;
  /** 接收操作串行队列，保证分帧完整性。 */
  private readonly reads = new SerialQueue();
  /** 发送操作串行队列。 */
  private readonly writes = new SerialQueue();
  /** Packet 分帧的 4 字节长度前缀缓冲区。 */
  private prefix = Buffer.alloc(4);
  /** 已累积的前缀字节数。 */
  private prefixSize = 0;
  /** 解析出的包体长度。 */
  private packetSize?: number;
  /** 已累积的包体分片。 */
  private packetChunks: Buffer[] = [];
  /** 已累积的包体字节数。 */
  private packetBytes = 0;
  /** 进行中的 Packet 发送快照及其位置。 */
  private outgoing?: { packet: Packet; data: Buffer; position: number };

  /** 创建未连接的 TCP 套接字，默认使用异步阻塞语义。 */
  constructor() { super(SocketType.Tcp); }
  /** 返回本地端口，尚未分配时为 0。 */
  getLocalPort(): number { return this.transport?.localPort ?? 0; }
  /** 返回对端地址，未连接时为 undefined。 */
  getRemoteAddress(): IpAddress | undefined {
    const address = this.connected ? this.transport?.remoteAddress : undefined;
    return address ? IpAddress.fromString(address) : undefined;
  }
  /** 返回对端端口，未连接时为 0。 */
  getRemotePort(): number {
    return this.connected ? this.transport?.remotePort ?? 0 : 0;
  }
  /** 发起 TCP 连接；默认等待完成，非阻塞模式返回 NotReady，Time.Zero 不设超时。 */
  async connect(address: IpAddress, port: number,
    timeout: NetworkTime = Time.Zero): Promise<Status> {
    if (!(address instanceof IpAddress)) throw new TypeError('Expected IpAddress');
    uint(port, 65535);
    const milliseconds = millisecondsOf(timeout);
    this.create(address.getType());
    const generation = this.epoch;
    const socket = this.transport!;
    let timer: NodeJS.Timeout | undefined;
    const done = waitFor(this[socketEvents], () => this.connected || this.ended ||
      this.epoch !== generation).then(() => {
      if (timer) clearTimeout(timer);
      return this.epoch !== generation ? Status.Disconnected
        : this.connected ? Status.Done : Status.Error;
    });
    if (milliseconds) {
      timer = setTimeout(() => {
        if (this.epoch !== generation) return;
        this.failure = new Error('Connection timed out');
        socket.destroy(this.failure);
      }, milliseconds);
    }
    socket.connect({ host: address.toString(), port,
      family: address.isV4() ? 4 : 6 });
    return this.blocking ? done : Status.NotReady;
  }
  /** 立即关闭连接并清除未完成的收发包状态。 */
  disconnect(): void { this.close(); }
  /** 接管前拒绝 UDP 或监听传输。 */
  protected validateHandle(handle: SocketHandle): void {
    if (!(handle instanceof NetSocket)) throw new TypeError('Expected Node TCP');
  }
  /** 将受保护 create 分配或接管的句柄接入 TCP 收发和就绪状态。 */
  protected onCreate(): void {
    const socket = this.transport!;
    this.connected = !socket.connecting && !!socket.remoteAddress;
    this.attach(socket);
  }
  /** 重建时清理帧解析、TLS 和发送快照，旧等待由基类代际机制取消。 */
  protected onClose(): void {
    this.connected = false;
    this.ended = true;
    this.tlsStatus = TlsStatus.NotConnected;
    this.resetPacket();
    this.outgoing = undefined;
  }
  /** 监听器通过同一生命周期接管已接受的连接。 */
  [adoptTcp](socket: NetSocket): void {
    this.create(socket);
  }
  /** 将空闲连接升级为 TLS 客户端；默认验证，CA 字节支持 PEM 或 DER。 */
  async setupTlsClient(hostname: string,
    verifyOrCa: boolean | string | Uint8Array = true): Promise<TlsStatus> {
    if (typeof hostname !== 'string') throw new TypeError('Expected hostname');
    return this.setupTls(() => tlsConnect({
      socket: this.transport, servername: hostname,
      rejectUnauthorized: verifyOrCa !== false,
      ca: typeof verifyOrCa === 'boolean' ? undefined : tlsCertificate(verifyOrCa),
    }), 'secureConnect');
  }
  /** 使用 PEM/DER 证书与私钥升级 TLS 服务端；口令字节保留原始内容及子视图。 */
  async setupTlsServer(certificate: string | Uint8Array,
    key: string | Uint8Array, password: string | Uint8Array = ''):
    Promise<TlsStatus> {
    return this.setupTls(() => new TLSSocket(this.transport!, {
      isServer: true,
      secureContext: createSecureContext({
        cert: tlsCertificate(certificate),
        key: tlsPrivateKey(key, password),
      }),
    }), 'secure');
  }
  /** 返回握手协商的加密套件名；TLS 未完成时为 undefined。 */
  getCurrentCiphersuiteName(): string | undefined {
    return this.tlsStatus === TlsStatus.HandshakeComplete &&
      this.transport instanceof TLSSocket
      ? this.transport.getCipher()?.standardName ??
        this.transport.getCipher()?.name : undefined;
  }
  /** 发送调用时的包快照，自动加网络序 u32 长度头；Partial 时用同一 Packet 继续。 */
  send(packet: Packet): Promise<Status>;
  /** 发送调用时的字节快照；Partial 时按 sent 偏移重试剩余字节。 */
  send(data: Uint8Array): Promise<SocketSendResult>;
  send(data: Packet | Uint8Array): Promise<Status | SocketSendResult> {
    const generation = this.epoch;
    // Snapshot at call time, including for nonblocking writes accepted by Node.
    const snapshot = data instanceof Packet
      ? this.outgoing?.packet === data ? undefined : Buffer.from(data[packetSend]())
      : Buffer.from(bytes(data));
    return this.writes.run(async () => {
      const packet = data instanceof Packet ? data : undefined;
      const result = (status: Status, sent = 0) =>
        (packet ? status : { status, sent });
      if (generation !== this.epoch || !this.connected) {
        return result(this.failure ? Status.Error : Status.Disconnected);
      }
      if (this.tlsStatus === TlsStatus.HandshakeStarted) {
        return result(Status.NotReady);
      }
      if (this.outgoing && this.outgoing.packet !== packet) {
        return result(Status.NotReady);
      }
      if (packet && !this.outgoing) {
        const body = snapshot!;
        uint(body.length);
        const wire = Buffer.allocUnsafe(body.length + 4);
        wire.writeUInt32BE(body.length);
        body.copy(wire, 4);
        this.outgoing = { packet, data: wire, position: 0 };
      }
      const input = this.outgoing
        ? this.outgoing.data.subarray(this.outgoing.position) : snapshot!;
      const socket = this.transport!;
      if (!input.length) return result(Status.Done);
      const room = this.blocking ? input.length
        : Math.max(0, socket.writableHighWaterMark - socket.writableLength);
      const count = Math.min(input.length, room);
      if (!count) return result(Status.NotReady);
      const completion = new Promise<Status>(resolve => {
        socket.write(input.subarray(0, count), error =>
          resolve(error ? Status.Error : Status.Done));
      });
      if (this.outgoing) {
        this.outgoing.position += count;
        if (this.outgoing.position === this.outgoing.data.length) {
          this.outgoing = undefined;
        }
      }
      const status = this.blocking
        ? await this.awaitWrite(completion, generation) : Status.Done;
      if (generation !== this.epoch) return result(Status.Disconnected, count);
      return result(status === Status.Done && count < input.length
        ? Status.Partial : status, count);
    });
  }
  /** 接收完整长度前缀包后替换 packet；非阻塞模式保留未完整的分帧，最多接收 64 MiB。 */
  receive(packet: Packet): Promise<Status>;
  /** 接收至 data 并返回实际字节数；完成前勿修改目标缓冲区。 */
  receive(data: Uint8Array): Promise<SocketTransfer>;
  receive(destination: Packet | Uint8Array): Promise<Status | SocketTransfer> {
    const output = destination instanceof Packet ? undefined : bytes(destination);
    const generation = this.epoch;
    return this.reads.run(async () => {
      if (destination instanceof Packet) {
        for (;;) {
          const header = this.packetSize === undefined;
          const needed = header ? 4 - this.prefixSize
            : this.packetSize! - this.packetBytes;
          if (!needed && !header) {
            const payload = Buffer.concat(this.packetChunks, this.packetBytes);
            this.resetPacket();
            destination[packetReceive](payload);
            return Status.Done;
          }
          const chunk = await this.readChunk(needed, generation);
          if (typeof chunk === 'number') return chunk;
          if (header) {
            chunk.copy(this.prefix, this.prefixSize);
            this.prefixSize += chunk.length;
            if (this.prefixSize === 4) {
              this.packetSize = this.prefix.readUInt32BE();
              if (this.packetSize > 64 * 1024 * 1024) {
                this.failure = new Error('Packet exceeds 64 MiB receive limit');
                this.disconnect();
                return Status.Error;
              }
            }
          } else {
            this.packetChunks.push(chunk);
            this.packetBytes += chunk.length;
          }
        }
      }
      if (this.prefixSize || this.packetSize !== undefined) {
        throw new Error('Finish receiving the pending Packet first');
      }
      if (!output!.length) return { status: Status.Error, received: 0 };
      const chunk = await this.readChunk(output!.length, generation);
      if (typeof chunk === 'number') return { status: chunk, received: 0 };
      chunk.copy(output!);
      return { status: Status.Done, received: chunk.length };
    });
  }
  /** 返回 TCP 传输存活状态，允许派生类扩展。 */
  protected isAlive(): boolean { return !!this.transport && !this.ended; }
  /** 返回接收、发送及 TLS 握手对应的就绪位。 */
  protected getReadiness(mask: number): number {
    const socket = this.transport;
    const receive = socket && (socket.readableLength > 0 || this.ended) ? 1 : 0;
    const send = this.connected && socket && !socket.destroyed &&
      !socket.writableNeedDrain && this.tlsStatus !== TlsStatus.HandshakeStarted
      ? 2 : 0;
    // eslint-disable-next-line no-bitwise
    return (receive | send) & mask;
  }
  protected getNativeHandle(): NetSocket | undefined { return this.transport; }
  /** 重置 Packet 分帧累积状态。 */
  private resetPacket(): void {
    this.prefixSize = 0;
    this.packetSize = undefined;
    this.packetChunks = [];
    this.packetBytes = 0;
  }
  /** 异步读取最多 max 字节，含代际校验。 */
  private async readChunk(max: number, generation: number):
  Promise<Buffer | Status> {
    const available = () => this.ended ||
      (this.transport?.readableLength ?? 0) > 0;
    await this.awaitReady(available, generation);
    if (generation !== this.epoch) return Status.Disconnected;
    const socket = this.transport;
    const count = Math.min(max, socket?.readableLength ?? 0);
    if (count) return socket!.read(count) as Buffer;
    if (this.ended) return this.failure ? Status.Error : Status.Disconnected;
    return Status.NotReady;
  }
  /** 绑定套接字事件监听并设置 TCP_NODELAY。 */
  private attach(socket: NetSocket): void {
    this.detach?.();
    this.transport = socket;
    this.ended = socket.destroyed || socket.readableEnded;
    socket.setNoDelay(true);
    const generation = this.epoch;
    const current = () => socket === this.transport && generation === this.epoch;
    const readable = () => { if (current()) this.changed(); };
    const connected = () => {
      if (!current()) return;
      this.connected = true; this.changed();
    };
    const ended = () => {
      if (!current()) return;
      this.connected = false; this.ended = true; this.changed();
    };
    const error = (error: Error) => {
      if (!current()) return;
      this.failure = error; ended();
    };
    socket.on('readable', readable)
      .on('drain', readable)
      .on('connect', connected)
      .on('end', ended)
      .on('close', ended)
      .on('error', error);
    this.detach = () => {
      socket.off('readable', readable)
        .off('drain', readable)
        .off('connect', connected)
        .off('end', ended)
        .off('close', ended)
        .off('error', error);
    };
  }
  /** 将空闲连接升级为 TLS 并等待握手完成。 */
  private async setupTls(create: () => TLSSocket, event: string):
  Promise<TlsStatus> {
    if (!this.connected) return TlsStatus.NotConnected;
    const generation = this.epoch;
    if (this.tlsStatus === TlsStatus.NotConnected) {
      if (this.transport!.readableLength || this.transport!.writableLength) {
        throw new Error('TLS upgrade requires an empty plaintext queue');
      }
      try {
        this.detach?.();
        const socket = create();
        this.attach(socket);
        this.tlsStatus = TlsStatus.HandshakeStarted;
        const secure = () => {
          if (socket !== this.transport || generation !== this.epoch) return;
          this.tlsStatus = TlsStatus.HandshakeComplete;
          this.changed();
        };
        socket.once(event, secure);
        const detach = this.detach;
        this.detach = () => { detach?.(); socket.off(event, secure); };
      } catch (error) {
        this.failure = error as Error;
        this.disconnect();
        return TlsStatus.Error;
      }
    }
    if (this.blocking && this.tlsStatus === TlsStatus.HandshakeStarted) {
      await waitFor(this[socketEvents], () => this.ended ||
        this.tlsStatus !== TlsStatus.HandshakeStarted ||
        generation !== this.epoch);
    }
    return this.ended || generation !== this.epoch ? TlsStatus.Error
      : this.tlsStatus;
  }
}
