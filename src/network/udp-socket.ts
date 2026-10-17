import { Socket as UdpHandle, type RemoteInfo } from 'node:dgram';
import { Socket, SocketStatus as Status,
  socketEvents, SocketType, type SocketHandle } from './socket';
import { IpAddress } from './ip-address';
import { Packet, packetReceive, packetSend } from './packet';
import { SerialQueue, bytes, uint, waitFor } from './common';

/**
 * Result of receiving a single UDP datagram.
 * @zh 单个 UDP 数据报的接收结果。
 * @ja 単一の UDP データグラムの受信結果。
 * @ko 단일 UDP 데이터그램 수신 결과.
 */
export interface DatagramResult {
  /**
   * Operation result status.
   * @zh 操作结果状态。
   * @ja 操作結果の状態。
   * @ko 작업 결과 상태.
   */
  status: Status;
  /**
   * Bytes written to the destination, or 0 on failure.
   * @zh 写入目标的字节数，失败时为 0。
   * @ja 出力先に書き込んだバイト数。失敗時は 0 です。
   * @ko 대상에 쓴 바이트 수이며 실패 시 0입니다.
   */
  received: number;
  /**
   * Sender address on successful receipt.
   * @zh 成功接收时的发送方地址。
   * @ja 受信成功時の送信元アドレス。
   * @ko 수신 성공 시 송신자 주소.
   */
  remoteAddress?: IpAddress;
  /**
   * Sender port, or 0 on failure.
   * @zh 发送方端口，失败时为 0。
   * @ja 送信元ポート。失敗時は 0 です。
   * @ko 송신자 포트이며 실패 시 0입니다.
   */
  remotePort: number;
}
/**
 * UDP socket preserving datagram boundaries; Packet data has no TCP
 * length header.
 * @zh 保留数据报边界的 UDP 套接字，Packet 不附加 TCP 长度头。
 * @ja データグラム境界を保持する UDP ソケット。
 * Packet に TCP の長さヘッダーは付加しません。
 * @ko 데이터그램 경계를 유지하는 UDP 소켓.
 * Packet에 TCP 길이 헤더를 붙이지 않습니다.
 */
export class UdpSocket extends Socket {
  /**
   * Maximum UDP datagram payload size in bytes allowed by this implementation.
   * @zh 本实现允许的最大 UDP 数据报载荷字节数。
   * @ja この実装で許容する UDP データグラムの最大ペイロードバイト数。
   * @ko 이 구현에서 허용하는 최대 UDP 데이터그램 페이로드 바이트 수.
   */
  static readonly MaxDatagramSize = 65507;
  /**
   * Underlying UDP socket handle.
   * @zh 底层 UDP 套接字句柄。
   * @ja 下位の UDP ソケットハンドル。
   * @ko 기반 UDP 소켓 핸들.
   */
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
  /**
   * Create an unbound UDP socket with asynchronous blocking semantics
   * by default.
   * @zh 创建尚未绑定的 UDP 套接字，默认使用异步阻塞语义。
   * @ja 未バインドの UDP ソケットを作成します。
   * 既定では非同期ブロッキング動作を使います。
   * @ko 바인딩되지 않은 UDP 소켓을 생성하며 기본적으로 비동기 블로킹 동작을
   * 사용합니다.
   */
  constructor() { super(SocketType.Udp); }
  /**
   * Return the bound local port, or 0 when unbound.
   * @zh 返回已绑定的本地端口，未绑定时为 0。
   * @ja バインド済みのローカルポートを返し、未バインドなら 0 を返します。
   * @ko 바인딩된 로컬 포트를 반환하며 바인딩되지 않았으면 0입니다.
   */
  getLocalPort(): number {
    return this.bound ? this.transport!.address().port : 0;
  }
  /**
   * Bind a local port and address asynchronously; port 0 lets the system assign
   * a port. Use IPv4 by default.
   * @zh 异步绑定本地端口和地址；port 为 0 时由系统分配，默认使用 IPv4。
   * @ja ローカルポートとアドレスを非同期にバインドします。
   * port が 0 ならシステムが割り当てます。既定では IPv4 を使用します。
   * @ko 로컬 포트와 주소를 비동기로 바인딩합니다. port가 0이면 시스템이
   * 할당하며 기본적으로 IPv4를 사용합니다.
   */
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
  /**
   * Reject non-UDP Node transports before adoption.
   * @zh 接管前拒绝非 UDP 的 Node 传输。
   * @ja 引き継ぐ前に UDP 以外の Node トランスポートを拒否します。
   * @ko 인수 전에 UDP가 아닌 Node 전송 객체를 거부합니다.
   */
  protected validateHandle(handle: SocketHandle): void {
    if (!(handle instanceof UdpHandle)) throw new TypeError('Expected Node UDP');
  }
  /**
   * Integrate an allocated or adopted UDP handle into the same datagram queue
   * and binding state.
   * @zh 将分配或接管的 UDP 句柄接入同一数据报队列及绑定状态。
   * @ja 割り当てまたは引き継いだ UDP ハンドルを同じデータグラムキューと
   * バインド状態に組み込みます。
   * @ko 할당하거나 인수한 UDP 핸들을 같은 데이터그램 큐와 바인딩 상태에
   * 연결합니다.
   */
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
  /**
   * Close the UDP transport and clear datagrams pending receipt.
   * @zh 关闭 UDP 传输并清空待接收的数据报。
   * @ja UDP トランスポートを閉じ、受信待ちのデータグラムを消去します。
   * @ko UDP 전송 객체를 닫고 수신 대기 중인 데이터그램을 비웁니다.
   */
  unbind(): void { this.close(); }
  /**
   * Clear the old transport's binding state and datagrams;
   * the generation change cancels old reads.
   * @zh 清空旧传输的绑定状态和数据报，旧读取通过代际变化取消。
   * @ja 古いトランスポートのバインド状態とデータグラムを消去します。
   * 世代の変更により古い読み取りをキャンセルします。
   * @ko 기존 전송 객체의 바인딩 상태와 데이터그램을 비우며,
   * 세대 변경으로 이전 읽기를 취소합니다.
   */
  protected onClose(): void {
    this.bound = false;
    this.pending = [];
    this.pendingBytes = 0;
  }
  /**
   * Send a call-time data snapshot as one datagram; if unbound, automatically
   * bind an ephemeral port for the destination address family.
   * @zh 发送调用时的数据快照为一个数据报；未绑定时按目标地址族自动绑定临时端口。
   * @ja 呼び出し時のデータスナップショットを 1 つのデータグラムとして送信します。
   * 未バインドなら宛先アドレスファミリーに応じて一時ポートに自動バインドします。
   * @ko 호출 시점의 데이터 스냅샷을 하나의 데이터그램으로 송신합니다.
   * 바인딩되지 않았으면 대상 주소 계열에 맞는 임시 포트에 자동 바인딩합니다.
   */
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
  /**
   * Receive one complete datagram; discard it and return Error if the
   * destination byte buffer is too small. With no data, nonblocking mode
   * returns NotReady.
   * @zh 接收一个完整数据报；目标字节区过小时丢弃并返回 Error，
   * 非阻塞无数据为 NotReady。
   * @ja 完全なデータグラムを 1 つ受信します。出力先バイト領域が小さすぎる場合は
   * 破棄して Error を返し、非ブロッキングでデータがなければ NotReady を返します。
   * @ko 완전한 데이터그램 하나를 수신합니다. 대상 바이트 버퍼가 너무 작으면
   * 폐기하고 Error를 반환합니다. 논블로킹 모드에서 데이터가 없으면 NotReady입니다.
   */
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
  /**
   * Return the binding state; derived classes may extend this.
   * @zh 返回绑定状态，允许派生类扩展。
   * @ja バインド状態を返します。派生クラスで拡張できます。
   * @ko 바인딩 상태를 반환하며 파생 클래스에서 확장할 수 있습니다.
   */
  protected isAlive(): boolean { return this.bound; }
  /**
   * Return readiness bits for pending datagrams and the current binding.
   * @zh 返回待接收数据报和当前绑定对应的就绪位。
   * @ja 受信待ちデータグラムと現在のバインドに対応する準備状態ビットを返します。
   * @ko 수신 대기 데이터그램과 현재 바인딩에 해당하는 준비 상태 비트를 반환합니다.
   */
  protected getReadiness(mask: number): number {
    // eslint-disable-next-line no-bitwise
    return ((this.pending.length ? 1 : 0) | (this.bound ? 2 : 0)) & mask;
  }
  protected getNativeHandle(): UdpHandle | undefined { return this.transport; }
}
