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

/**
 * Current TLS upgrade state.
 * @zh TLS 升级的当前状态。
 * @ja TLS アップグレードの現在の状態。
 * @ko TLS 업그레이드의 현재 상태.
 */
export enum TlsStatus {
  /**
   * No TLS connection is established.
   * @zh 未建立 TLS 连接。
   * @ja TLS 接続は確立されていません。
   * @ko TLS 연결이 설정되지 않았습니다.
   */
  NotConnected,
  /**
   * The handshake has started but is not complete.
   * @zh 握手已开始但尚未完成。
   * @ja ハンドシェイクは開始済みですが、未完了です。
   * @ko 핸드셰이크가 시작되었지만 완료되지 않았습니다.
   */
  HandshakeStarted,
  /**
   * The handshake is complete; encrypted data can be transferred.
   * @zh 握手完成，可以传输加密数据。
   * @ja ハンドシェイクが完了し、暗号化データを転送できます。
   * @ko 핸드셰이크가 완료되어 암호화된 데이터를 전송할 수 있습니다.
   */
  HandshakeComplete,
  /**
   * The handshake failed.
   * @zh 握手失败。
   * @ja ハンドシェイクが失敗しました。
   * @ko 핸드셰이크가 실패했습니다.
   */
  Error,
}
/**
 * Result of reading raw TCP bytes.
 * @zh 原始 TCP 字节读取结果。
 * @ja 生の TCP バイトの読み取り結果。
 * @ko 원시 TCP 바이트 읽기 결과.
 */
export interface SocketTransfer {
  /**
   * Operation result status.
   * @zh 操作结果状态。
   * @ja 操作結果の状態。
   * @ko 작업 결과 상태.
   */
  status: Status;
  /**
   * Number of bytes actually written to the destination buffer.
   * @zh 实际写入目标缓冲区的字节数。
   * @ja 出力先バッファに実際に書き込んだバイト数。
   * @ko 대상 버퍼에 실제로 쓴 바이트 수.
   */
  received: number;
}
/**
 * Result of sending raw TCP bytes.
 * @zh 原始 TCP 字节发送结果。
 * @ja 生の TCP バイトの送信結果。
 * @ko 원시 TCP 바이트 송신 결과.
 */
export interface SocketSendResult {
  /**
   * Operation result status.
   * @zh 操作结果状态。
   * @ja 操作結果の状態。
   * @ko 작업 결과 상태.
   */
  status: Status;
  /**
   * Bytes handed to the Node transport; this does not imply peer receipt.
   * @zh 已交给 Node 传输层的字节数，不代表对端已接收。
   * @ja Node トランスポートに渡したバイト数。相手の受信を意味しません。
   * @ko Node 전송 계층에 전달한 바이트 수이며 상대방의 수신을 의미하지 않습니다.
   */
  sent: number;
}
export const adoptTcp: unique symbol = Symbol('TcpSocket.adopt');

/**
 * TCP socket supporting raw bytes, SFML Packet framing, and TLS upgrades.
 * @zh 支持原始字节、SFML Packet 分帧和 TLS 升级的 TCP 套接字。
 * @ja 生バイト、SFML Packet のフレーミング、TLS アップグレード対応の TCP ソケット。
 * @ko 원시 바이트, SFML Packet 프레이밍 및 TLS 업그레이드를 지원하는 TCP 소켓.
 */
export class TcpSocket extends Socket {
  /**
   * TLS handshake status enumeration.
   * @zh TLS 握手状态枚举。
   * @ja TLS ハンドシェイク状態の列挙型。
   * @ko TLS 핸드셰이크 상태 열거형.
   */
  static readonly TlsStatus = TlsStatus;
  /**
   * Underlying TCP or TLS socket.
   * @zh 底层 TCP 或 TLS 套接字。
   * @ja 下位の TCP または TLS ソケット。
   * @ko 기반 TCP 또는 TLS 소켓.
   */
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

  /**
   * Create an unconnected TCP socket, using asynchronous blocking semantics
   * by default.
   * @zh 创建未连接的 TCP 套接字，默认使用异步阻塞语义。
   * @ja 未接続の TCP ソケットを作成します。既定では非同期ブロッキング動作です。
   * @ko 연결되지 않은 TCP 소켓을 생성하며 기본적으로 비동기 블로킹 동작을
   * 사용합니다.
   */
  constructor() { super(SocketType.Tcp); }
  /**
   * Return the local port, or 0 if not yet assigned.
   * @zh 返回本地端口，尚未分配时为 0。
   * @ja ローカルポートを返し、未割り当てなら 0 を返します。
   * @ko 로컬 포트를 반환하며 아직 할당되지 않았으면 0입니다.
   */
  getLocalPort(): number { return this.transport?.localPort ?? 0; }
  /**
   * Return the peer address, or undefined when not connected.
   * @zh 返回对端地址，未连接时为 undefined。
   * @ja 相手のアドレスを返し、未接続なら undefined を返します。
   * @ko 상대 주소를 반환하며 연결되지 않았으면 undefined입니다.
   */
  getRemoteAddress(): IpAddress | undefined {
    const address = this.connected ? this.transport?.remoteAddress : undefined;
    return address ? IpAddress.fromString(address) : undefined;
  }
  /**
   * Return the peer port, or 0 when not connected.
   * @zh 返回对端端口，未连接时为 0。
   * @ja 相手のポートを返し、未接続なら 0 を返します。
   * @ko 상대 포트를 반환하며 연결되지 않았으면 0입니다.
   */
  getRemotePort(): number {
    return this.connected ? this.transport?.remotePort ?? 0 : 0;
  }
  /**
   * Start a TCP connection; wait for completion by default, or return NotReady
   * in nonblocking mode. Time.Zero disables the timeout.
   * @zh 发起 TCP 连接；默认等待完成，非阻塞模式返回 NotReady，
   * Time.Zero 不设超时。
   * @ja TCP 接続を開始します。既定では完了を待ち、非ブロッキングモードでは
   * NotReady を返します。Time.Zero はタイムアウトなしです。
   * @ko TCP 연결을 시작합니다. 기본적으로 완료를 기다리며 논블로킹 모드에서는
   * NotReady를 반환합니다. Time.Zero는 제한 시간이 없습니다.
   */
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
  /**
   * Close the connection immediately and clear pending packet transfer state.
   * @zh 立即关闭连接并清除未完成的收发包状态。
   * @ja 接続を即座に閉じ、未完了のパケット送受信状態を消去します。
   * @ko 즉시 연결을 닫고 미완료 패킷 송수신 상태를 지웁니다.
   */
  disconnect(): void { this.close(); }
  /**
   * Reject UDP or listener transports before adoption.
   * @zh 接管前拒绝 UDP 或监听传输。
   * @ja 引き継ぐ前に UDP またはリスナートランスポートを拒否します。
   * @ko 인수 전에 UDP 또는 리스너 전송 객체를 거부합니다.
   */
  protected validateHandle(handle: SocketHandle): void {
    if (!(handle instanceof NetSocket)) throw new TypeError('Expected Node TCP');
  }
  /**
   * Integrate the handle allocated or adopted by protected create into
   * TCP send/receive and readiness state.
   * @zh 将受保护 create 分配或接管的句柄接入 TCP 收发和就绪状态。
   * @ja protected の create が割り当てまたは引き継いだハンドルを
   * TCP 送受信と準備状態に組み込みます。
   * @ko protected create가 할당하거나 인수한 핸들을 TCP 송수신 및
   * 준비 상태에 연결합니다.
   */
  protected onCreate(): void {
    const socket = this.transport!;
    this.connected = !socket.connecting && !!socket.remoteAddress;
    this.attach(socket);
  }
  /**
   * Clear frame parsing, TLS, and send snapshots on recreation;
   * the base-class generation mechanism cancels old waits.
   * @zh 重建时清理帧解析、TLS 和发送快照，旧等待由基类代际机制取消。
   * @ja 再作成時にフレーム解析、TLS、送信スナップショットを消去します。
   * 古い待機は基底クラスの世代機構がキャンセルします。
   * @ko 재생성 시 프레임 파싱, TLS 및 송신 스냅샷을 정리하며,
   * 기본 클래스의 세대 메커니즘이 이전 대기를 취소합니다.
   */
  protected onClose(): void {
    this.connected = false;
    this.ended = true;
    this.tlsStatus = TlsStatus.NotConnected;
    this.resetPacket();
    this.outgoing = undefined;
  }
  /**
   * Let listeners adopt accepted connections through the same lifecycle.
   * @zh 监听器通过同一生命周期接管已接受的连接。
   * @ja リスナーが同じライフサイクルで受け入れ済み接続を引き継ぎます。
   * @ko 리스너가 같은 수명 주기를 통해 수락한 연결을 인수합니다.
   */
  [adoptTcp](socket: NetSocket): void {
    this.create(socket);
  }
  /**
   * Upgrade an idle connection to a TLS client with verification enabled
   * by default; CA bytes may use PEM or DER.
   * @zh 将空闲连接升级为 TLS 客户端；默认验证，CA 字节支持 PEM 或 DER。
   * @ja アイドル接続を TLS クライアントにアップグレードします。
   * 既定で検証が有効で、CA バイトは PEM または DER に対応します。
   * @ko 유휴 연결을 TLS 클라이언트로 업그레이드합니다.
   * 기본적으로 검증하며 CA 바이트는 PEM 또는 DER를 지원합니다.
   */
  async setupTlsClient(hostname: string,
    verifyOrCa: boolean | string | Uint8Array = true): Promise<TlsStatus> {
    if (typeof hostname !== 'string') throw new TypeError('Expected hostname');
    return this.setupTls(() => tlsConnect({
      socket: this.transport, servername: hostname,
      rejectUnauthorized: verifyOrCa !== false,
      ca: typeof verifyOrCa === 'boolean' ? undefined : tlsCertificate(verifyOrCa),
    }), 'secureConnect');
  }
  /**
   * Upgrade to a TLS server using a PEM/DER certificate and private key;
   * password bytes retain their raw contents and subview bounds.
   * @zh 使用 PEM/DER 证书与私钥升级 TLS 服务端；口令字节保留原始内容及子视图。
   * @ja PEM/DER の証明書と秘密鍵で TLS サーバーにアップグレードします。
   * パスワードのバイトは元の内容とサブビューの範囲を保持します。
   * @ko PEM/DER 인증서와 개인 키로 TLS 서버로 업그레이드합니다.
   * 암호 바이트는 원시 내용과 하위 뷰 범위를 유지합니다.
   */
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
  /**
   * Return the cipher suite name negotiated during the handshake,
   * or undefined before TLS completes.
   * @zh 返回握手协商的加密套件名；TLS 未完成时为 undefined。
   * @ja ハンドシェイクで合意した暗号スイート名を返します。
   * TLS が完了していなければ undefined です。
   * @ko 핸드셰이크에서 협상한 암호 스위트 이름을 반환하며,
   * TLS가 완료되지 않았으면 undefined입니다.
   */
  getCurrentCiphersuiteName(): string | undefined {
    return this.tlsStatus === TlsStatus.HandshakeComplete &&
      this.transport instanceof TLSSocket
      ? this.transport.getCipher()?.standardName ??
        this.transport.getCipher()?.name : undefined;
  }
  /**
   * Send a call-time packet snapshot with an automatic network-order u32 length
   * header; continue with the same Packet after Partial.
   * @zh 发送调用时的包快照，自动加网络序 u32 长度头；Partial 时用同一 Packet 继续。
   * @ja 呼び出し時のパケットのスナップショットにネットワーク順の u32 長さヘッダーを
   * 自動付加して送信します。Partial の場合は同じ Packet で続行してください。
   * @ko 호출 시점의 패킷 스냅샷에 네트워크 바이트 순서의 u32 길이 헤더를 자동으로
   * 붙여 송신합니다. Partial이면 같은 Packet으로 계속 진행하세요.
   */
  send(packet: Packet): Promise<Status>;
  /**
   * Send a call-time byte snapshot; after Partial, retry the remaining bytes
   * starting at the sent offset.
   * @zh 发送调用时的字节快照；Partial 时按 sent 偏移重试剩余字节。
   * @ja 呼び出し時のバイトスナップショットを送信します。
   * Partial の場合は sent の位置から残りのバイトを再試行してください。
   * @ko 호출 시점의 바이트 스냅샷을 송신합니다.
   * Partial이면 sent 오프셋부터 남은 바이트를 다시 시도하세요.
   */
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
  /**
   * Replace packet after receiving a complete length-prefixed packet.
   * Nonblocking mode retains incomplete frames; receive at most 64 MiB.
   * @zh 接收完整长度前缀包后替换 packet；非阻塞模式保留未完整的分帧，
   * 最多接收 64 MiB。
   * @ja 長さプレフィックス付きパケットを完全に受信した後で packet を置換します。
   * 非ブロッキングモードは未完のフレームを保持し、受信上限は 64 MiB です。
   * @ko 길이 접두사가 있는 패킷을 완전히 수신한 후 packet을 교체합니다.
   * 논블로킹 모드는 미완성 프레임을 보관하며 최대 64 MiB를 수신합니다.
   */
  receive(packet: Packet): Promise<Status>;
  /**
   * Receive into data and return the actual byte count;
   * do not modify the destination buffer before completion.
   * @zh 接收至 data 并返回实际字节数；完成前勿修改目标缓冲区。
   * @ja data に受信して実際のバイト数を返します。
   * 完了前に出力先バッファを変更しないでください。
   * @ko data로 수신하고 실제 바이트 수를 반환합니다.
   * 완료 전에 대상 버퍼를 수정하지 마세요.
   */
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
  /**
   * Return TCP transport liveness; derived classes may extend this.
   * @zh 返回 TCP 传输存活状态，允许派生类扩展。
   * @ja TCP トランスポートの生存状態を返します。派生クラスで拡張できます。
   * @ko TCP 전송 객체의 활성 상태를 반환하며 파생 클래스에서 확장할 수 있습니다.
   */
  protected isAlive(): boolean { return !!this.transport && !this.ended; }
  /**
   * Return readiness bits for receiving, sending, and the TLS handshake.
   * @zh 返回接收、发送及 TLS 握手对应的就绪位。
   * @ja 受信、送信、TLS ハンドシェイクに対応する準備状態ビットを返します。
   * @ko 수신, 송신 및 TLS 핸드셰이크에 해당하는 준비 상태 비트를 반환합니다.
   */
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
