import { createServer, Server, type Socket as NetSocket } from 'node:net';
import { Socket, SocketStatus as Status,
  socketEvents, SocketType, type SocketHandle } from './socket';
import { IpAddress } from './ip-address';
import { TcpSocket, adoptTcp } from './tcp-socket';
import { SerialQueue, uint, waitFor } from './common';

/**
 * Listen for TCP connections and hand them to TcpSocket through accept.
 * @zh 监听 TCP 连接并通过 accept 将连接交给 TcpSocket。
 * @ja TCP 接続を待ち受け、accept で TcpSocket に渡します。
 * @ko TCP 연결을 수신 대기하고 accept로 TcpSocket에 전달합니다.
 */
export class TcpListener extends Socket {
  /**
   * Node listener transport sharing the base-class lifecycle.
   * @zh 与基类生命周期共用的 Node 监听传输。
   * @ja 基底クラスのライフサイクルを共有する Node リスナートランスポート。
   * @ko 기본 클래스 수명 주기를 공유하는 Node 리스너 전송 객체.
   */
  declare protected transport?: Server;
  private pending: NetSocket[] = [];
  private listening = false;
  private readonly accepts = new SerialQueue();
  /**
   * Create a TCP listener that is not yet listening.
   * @zh 创建尚未监听的 TCP 监听器。
   * @ja まだ待ち受けていない TCP リスナーを作成します。
   * @ko 아직 수신 대기하지 않는 TCP 리스너를 생성합니다.
   */
  constructor() { super(SocketType.Tcp); }
  /**
   * Return the listening port, or 0 when not listening.
   * @zh 返回监听端口；未监听时为 0。
   * @ja 待ち受けポートを返し、待ち受けていなければ 0 を返します。
   * @ko 수신 대기 포트를 반환하며 수신 대기 중이 아니면 0입니다.
   */
  getLocalPort(): number {
    const address = this.transport?.address();
    return address && typeof address !== 'string' ? address.port : 0;
  }
  /**
   * Bind and listen asynchronously; port 0 requests an automatically assigned
   * port. Bind all IPv4 interfaces by default.
   * @zh 异步绑定并监听，port 为 0 时自动分配端口；默认绑定所有 IPv4 接口。
   * @ja 非同期にバインドして待ち受けます。port が 0 なら自動割り当てされ、
   * 既定ではすべての IPv4 インターフェースにバインドします。
   * @ko 비동기로 바인딩하고 수신 대기합니다. port가 0이면 자동 할당하며,
   * 기본적으로 모든 IPv4 인터페이스에 바인딩합니다.
   */
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
  /**
   * Allocate a Server for the listener without creating a client transport
   * or implicitly listening on a port.
   * @zh 监听器分配 Server，不创建客户端传输或隐式监听端口。
   * @ja リスナー用の Server を割り当てます。クライアントトランスポートの
   * 作成や暗黙のポート待ち受けは行いません。
   * @ko 리스너용 Server를 할당합니다. 클라이언트 전송 객체를 생성하거나
   * 암묵적으로 포트를 수신 대기하지 않습니다.
   */
  protected allocateHandle(): Server {
    return createServer({ pauseOnConnect: true });
  }
  /**
   * Only adopt Node Server instances for this listener.
   * @zh 监听器仅接管 Node Server。
   * @ja このリスナーは Node Server のみを引き継ぎます。
   * @ko 이 리스너는 Node Server만 인수합니다.
   */
  protected validateHandle(handle: SocketHandle): void {
    if (!(handle instanceof Server)) throw new TypeError('Expected Node Server');
  }
  /**
   * Set up the accept queue and listening state, supporting adoption
   * of an already-listening Server.
   * @zh 安装接受队列及监听状态，支持接管已经监听的 Server。
   * @ja 受け入れキューと待ち受け状態を設定します。
   * すでに待ち受け中の Server も引き継げます。
   * @ko 수락 큐와 수신 대기 상태를 설정하며, 이미 수신 대기 중인
   * Server 인수를 지원합니다.
   */
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
  /**
   * Stop listening and close connections not yet handled by accept.
   * @zh 停止监听并关闭尚未 accept 的连接。
   * @ja 待ち受けを停止し、まだ accept されていない接続を閉じます。
   * @ko 수신 대기를 중지하고 아직 accept하지 않은 연결을 닫습니다.
   */
  close(): void { super.close(); }
  /**
   * Clear connections from the previous generation that were not accepted.
   * @zh 清空旧代际中尚未接受的连接。
   * @ja 旧世代のまだ受け入れていない接続を消去します。
   * @ko 이전 세대에서 아직 수락하지 않은 연결을 비웁니다.
   */
  protected onClose(): void {
    this.listening = false;
    for (const socket of this.pending) socket.destroy();
    this.pending = [];
  }
  /**
   * Hand the next connection to socket; blocking mode waits asynchronously,
   * while nonblocking mode returns NotReady when no connection is available.
   * @zh 将下一个连接交给 socket；阻塞模式异步等待，
   * 非阻塞模式无连接时返回 NotReady。
   * @ja 次の接続を socket に渡します。ブロッキングモードは非同期に待機し、
   * 非ブロッキングモードで接続がなければ NotReady を返します。
   * @ko 다음 연결을 socket에 전달합니다. 블로킹 모드는 비동기로 기다리며,
   * 논블로킹 모드에서 연결이 없으면 NotReady를 반환합니다.
   */
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
  /**
   * Return the listening state; derived classes may extend this.
   * @zh 返回监听状态，允许派生类扩展。
   * @ja 待ち受け状態を返します。派生クラスで拡張できます。
   * @ko 수신 대기 상태를 반환하며 파생 클래스에서 확장할 수 있습니다.
   */
  protected isAlive(): boolean { return this.listening; }
  /**
   * Report receive readiness when the accept queue is not empty.
   * @zh 接受队列非空时报告接收就绪。
   * @ja 受け入れキューが空でない場合に受信準備完了を報告します。
   * @ko 수락 큐가 비어 있지 않으면 수신 준비 상태를 알립니다.
   */
  protected getReadiness(mask: number): number {
    // eslint-disable-next-line no-bitwise
    return this.pending.length ? mask & 1 : 0;
  }
  protected getNativeHandle(): Server | undefined { return this.transport; }
}
