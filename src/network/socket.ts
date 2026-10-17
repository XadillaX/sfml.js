import { EventEmitter } from 'node:events';
import { Socket as TcpHandle, Server } from 'node:net';
import { Socket as UdpHandle, createSocket } from 'node:dgram';
import { IpAddressType } from './ip-address';
import { uint, waitFor } from './common';

/**
 * Socket transport protocol, corresponding to sf::Socket::Type.
 * @zh 套接字使用的传输协议，对应 sf::Socket::Type。
 * @ja sf::Socket::Type に対応するソケットのトランスポートプロトコル。
 * @ko sf::Socket::Type에 해당하는 소켓 전송 프로토콜.
 */
export enum SocketType {
  /**
   * TCP byte-stream protocol.
   * @zh TCP 字节流协议。
   * @ja TCP バイトストリームプロトコル。
   * @ko TCP 바이트 스트림 프로토콜.
   */
  Tcp,
  /**
   * UDP datagram protocol.
   * @zh UDP 数据报协议。
   * @ja UDP データグラムプロトコル。
   * @ko UDP 데이터그램 프로토콜.
   */
  Udp,
}

/**
 * Socket operation result; blocking mode waits via Promise without blocking
 * the Node event loop.
 * @zh 套接字操作结果；阻塞模式通过 Promise 等待，不阻塞 Node 事件循环。
 * @ja ソケット操作の結果。ブロッキングモードは Promise で待機し、
 * Node のイベントループをブロックしません。
 * @ko 소켓 작업 결과. 블로킹 모드는 Promise로 기다리며
 * Node 이벤트 루프를 차단하지 않습니다.
 */
export enum SocketStatus {
  /**
   * Operation complete.
   * @zh 操作完成。
   * @ja 操作が完了しました。
   * @ko 작업이 완료되었습니다.
   */
  Done,
  /**
   * No data or send capacity is available yet; retry later.
   * @zh 暂无数据或发送空间，稍后重试。
   * @ja データまたは送信容量がまだありません。後で再試行してください。
   * @ko 아직 데이터나 송신 여유 공간이 없습니다. 나중에 다시 시도하세요.
   */
  NotReady,
  /**
   * Only part of the data was sent; continue sending the remainder.
   * @zh 仅发送了部分数据，需继续发送剩余部分。
   * @ja データの一部のみを送信しました。残りを続けて送信してください。
   * @ko 데이터 일부만 전송되었습니다. 나머지를 계속 전송해야 합니다.
   */
  Partial,
  /**
   * The connection is closed.
   * @zh 连接已断开。
   * @ja 接続が切断されました。
   * @ko 연결이 끊어졌습니다.
   */
  Disconnected,
  /**
   * Operation failed; getLastError provides the underlying error.
   * @zh 操作出错，可通过 getLastError 获取底层错误。
   * @ja 操作が失敗しました。getLastError で下位層のエラーを取得できます。
   * @ko 작업이 실패했습니다. getLastError로 하위 계층 오류를 확인할 수 있습니다.
   */
  Error,
}
/**
 * Node TCP, UDP, or listener transport object; raw OS file descriptors
 * are not accepted.
 * @zh Node TCP、UDP 或监听传输对象，不接受操作系统裸文件描述符。
 * @ja Node の TCP、UDP、またはリスナートランスポートオブジェクト。
 * OS の生のファイル記述子は受け付けません。
 * @ko Node TCP, UDP 또는 리스너 전송 객체.
 * 운영 체제의 원시 파일 디스크립터는 허용하지 않습니다.
 */
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

/**
 * Common base for Node network transports; defaults to blocking semantics
 * implemented with asynchronous waits.
 * @zh Node 网络传输的公共基类；默认使用异步等待的阻塞语义。
 * @ja Node ネットワークトランスポートの共通基底クラス。
 * 既定では非同期待機によるブロッキング動作を使います。
 * @ko Node 네트워크 전송의 공통 기본 클래스.
 * 기본적으로 비동기 대기로 구현한 블로킹 동작을 사용합니다.
 */
export abstract class Socket {
  /**
   * Socket operation status enumeration.
   * @zh 套接字操作状态枚举。
   * @ja ソケット操作状態の列挙型。
   * @ko 소켓 작업 상태 열거형.
   */
  static readonly Status = SocketStatus;
  /**
   * Socket transport protocol enumeration.
   * @zh 套接字传输协议枚举。
   * @ja ソケットトランスポートプロトコルの列挙型。
   * @ko 소켓 전송 프로토콜 열거형.
   */
  static readonly Type = SocketType;
  /**
   * Let the system assign an available port when binding.
   * @zh 绑定端口时由系统自动分配可用端口。
   * @ja バインド時にシステムが利用可能なポートを自動割り当てします。
   * @ko 바인딩 시 시스템이 사용 가능한 포트를 자동 할당합니다.
   */
  static readonly AnyPort = 0;
  readonly [socketEvents] = new EventEmitter();
  protected blocking = true;
  protected epoch = 0;
  protected failure?: Error;
  /**
   * Currently owned Node transport, released by Node on close or recreation.
   * @zh 当前独占的 Node 传输，关闭或重建时由 Node 释放。
   * @ja 現在排他的に所有する Node トランスポート。
   * 閉じるか再作成すると Node が解放します。
   * @ko 현재 독점 소유한 Node 전송 객체. 닫거나 재생성하면 Node가 해제합니다.
   */
  protected transport?: SocketHandle;
  /**
   * Remove event listeners from the current transport.
   * @zh 移除当前传输的事件监听。
   * @ja 現在のトランスポートのイベントリスナーを削除します。
   * @ko 현재 전송 객체의 이벤트 리스너를 제거합니다.
   */
  protected detach?: () => void;
  /**
   * Initialize common socket state with blocking semantics enabled by default.
   * @zh 初始化套接字公共状态，默认启用阻塞语义。
   * @ja ソケットの共通状態を初期化します。既定でブロッキング動作が有効です。
   * @ko 소켓 공통 상태를 초기화하며 기본적으로 블로킹 동작을 활성화합니다.
   */
  protected constructor(private readonly type = SocketType.Tcp) {
    uint(type, 1);
    this[socketEvents].setMaxListeners(0);
  }
  /**
   * Set whether to wait asynchronously for readability/writability.
   * When false, return NotReady or Partial according to current queue state.
   * @zh 设置是否异步等待可读/可写；false 时按当前队列状态返回 NotReady 或 Partial。
   * @ja 読み書き可能になるまで非同期に待機するか設定します。
   * false なら現在のキュー状態に応じて NotReady または Partial を返します。
   * @ko 읽기/쓰기 가능 상태를 비동기로 기다릴지 설정합니다.
   * false이면 현재 큐 상태에 따라 NotReady 또는 Partial을 반환합니다.
   */
  setBlocking(blocking: boolean): void {
    if (typeof blocking !== 'boolean') throw new TypeError('Expected a boolean');
    this.blocking = blocking;
    this.changed();
  }
  /**
   * Return whether blocking semantics use asynchronous waits.
   * @zh 返回是否使用异步等待的阻塞语义。
   * @ja 非同期待機によるブロッキング動作を使うかどうかを返します。
   * @ko 비동기 대기를 통한 블로킹 동작을 사용하는지 반환합니다.
   */
  isBlocking(): boolean { return this.blocking; }
  /**
   * Return the latest underlying error, or undefined if none is recorded.
   * @zh 返回最近的底层错误；未记录错误时为 undefined。
   * @ja 最新の下位層のエラーを返し、記録がなければ undefined を返します。
   * @ko 최근 하위 계층 오류를 반환하며 기록된 오류가 없으면 undefined입니다.
   */
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
  /**
   * Expose overridable readiness conditions to Selector.
   * @zh 供 Selector 读取子类可覆盖的就绪条件。
   * @ja サブクラスで上書き可能な準備条件を Selector に公開します。
   * @ko 하위 클래스에서 재정의할 수 있는 준비 조건을 Selector에 제공합니다.
   */
  [socketReady](mask: number): number { return this.getReadiness(mask); }
  /**
   * Expose overridable liveness state to Selector.
   * @zh 供 Selector 查询子类可覆盖的存活状态。
   * @ja サブクラスで上書き可能な生存状態を Selector に公開します。
   * @ko 하위 클래스에서 재정의할 수 있는 활성 상태를 Selector에 제공합니다.
   */
  [socketAlive](): boolean { return this.isAlive(); }
  /**
   * Provide subclasses with the underlying Node transport,
   * or undefined if not yet created.
   * @zh 供子类访问底层 Node 传输对象；未创建时为 undefined。
   * @ja サブクラスに下位の Node トランスポートへのアクセスを提供します。
   * 未作成なら undefined です。
   * @ko 하위 클래스에 기반 Node 전송 객체 접근을 제공합니다.
   * 아직 생성되지 않았으면 undefined입니다.
   */
  protected getNativeHandle(): SocketHandle | undefined { return this.transport; }
  /**
   * Allocate a transport for the given address family without implicitly
   * connecting or binding a port.
   * @zh 分配指定地址族的传输，不隐式连接或绑定端口。
   * @ja 指定ファミリーのトランスポートを割り当てます。
   * 暗黙の接続やポートのバインドは行いません。
   * @ko 지정한 주소 계열의 전송 객체를 할당합니다.
   * 암묵적으로 연결하거나 포트를 바인딩하지 않습니다.
   */
  protected create(addressType?: IpAddressType): void;
  /**
   * Adopt a Node transport and close the old one; do not adopt raw
   * file descriptors.
   * @zh 接管 Node 传输并关闭旧传输；不接管裸文件描述符。
   * @ja Node トランスポートを引き継ぎ、古いものを閉じます。
   * 生のファイル記述子は引き継ぎません。
   * @ko Node 전송 객체를 인수하고 기존 객체를 닫습니다.
   * 원시 파일 디스크립터는 인수하지 않습니다.
   */
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
  /**
   * Close the current transport and wake waits from the previous generation.
   * Repeated calls are safe; the blocking flag is unchanged.
   * @zh 关闭当前传输并唤醒旧代际的等待；重复调用安全，阻塞标志不变。
   * @ja 現在のトランスポートを閉じ、旧世代の待機を起こします。
   * 繰り返し呼び出しても安全で、ブロッキングフラグは変わりません。
   * @ko 현재 전송 객체를 닫고 이전 세대의 대기를 깨웁니다.
   * 반복 호출해도 안전하며 블로킹 플래그는 유지됩니다.
   */
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
  /**
   * Allocate an unconnected transport by protocol;
   * listeners may override this to use a Node Server.
   * @zh 按协议分配未连接传输；监听器可覆盖为 Node Server。
   * @ja プロトコルに応じた未接続トランスポートを割り当てます。
   * リスナーは上書きして Node Server を使用できます。
   * @ko 프로토콜에 따라 연결되지 않은 전송 객체를 할당합니다.
   * 리스너는 Node Server를 사용하도록 재정의할 수 있습니다.
   */
  protected allocateHandle(addressType: IpAddressType): SocketHandle {
    return this.type === SocketType.Tcp ? new TcpHandle()
      : createSocket(addressType === IpAddressType.IpV4 ? 'udp4' : 'udp6');
  }
  /**
   * Validate the transport type before adoption to avoid discovering
   * a type error after closing the old connection.
   * @zh 接管前验证传输类型，避免关闭旧连接后才发现类型错误。
   * @ja 引き継ぐ前にトランスポートの型を検証し、古い接続を閉じた後で
   * 型の誤りが判明することを防ぎます。
   * @ko 기존 연결을 닫은 후에 타입 오류를 발견하지 않도록 인수 전에
   * 전송 객체 타입을 검증합니다.
   */
  protected validateHandle(handle: SocketHandle): void {
    if (this.type === SocketType.Udp ? !(handle instanceof UdpHandle)
      : !(handle instanceof TcpHandle || handle instanceof Server)) {
      throw new TypeError('Expected a matching Node socket transport');
    }
  }
  /**
   * Install default TCP/UDP/Server state listeners;
   * subclasses may override this to manage their own send/receive queues.
   * @zh 安装默认 TCP/UDP/Server 状态监听；子类可覆盖以管理自己的收发队列。
   * @ja 既定の TCP/UDP/Server 状態リスナーを設定します。
   * サブクラスは独自の送受信キューを管理するために上書きできます。
   * @ko 기본 TCP/UDP/Server 상태 리스너를 설치합니다.
   * 하위 클래스는 자체 송수신 큐를 관리하도록 재정의할 수 있습니다.
   */
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
  /**
   * Clean up subclass state on close; the old transport is already detached
   * when this is called.
   * @zh 关闭时清理子类状态，调用时旧传输已解除关联。
   * @ja 閉じる際にサブクラスの状態を片付けます。
   * 呼び出し時には古いトランスポートの関連付けは解除済みです。
   * @ko 닫을 때 하위 클래스 상태를 정리합니다.
   * 호출 시 기존 전송 객체의 연결 관계는 이미 해제되어 있습니다.
   */
  protected onClose(): void {}
  /**
   * By default, check whether the Node transport is alive; subclasses may
   * override this without importing internal symbols.
   * @zh 默认查询 Node 传输是否存活；子类可覆盖，不需要导入内部 symbol。
   * @ja 既定では Node トランスポートの生存状態を確認します。
   * サブクラスは内部 symbol をインポートせずに上書きできます。
   * @ko 기본적으로 Node 전송 객체의 활성 여부를 확인합니다.
   * 하위 클래스는 내부 symbol을 가져오지 않고 재정의할 수 있습니다.
   */
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
   * By default, TCP readiness follows readable bytes and write backpressure;
   * bound UDP sockets can send. Subclasses report UDP datagrams and Server
   * connection queues to Selector through this hook and changed().
   * @zh 默认 TCP 按可读字节和写入背压就绪，已绑定 UDP 可发送。
   * UDP 数据报和 Server 连接队列由子类通过此钩子和 changed() 通知 Selector。
   * @ja 既定では TCP の準備状態は読み取り可能バイトと書き込みバックプレッシャーに
   * 従い、バインド済み UDP は送信可能です。サブクラスはこのフックと changed() で
   * UDP データグラムと Server 接続キューを Selector に通知します。
   * @ko 기본적으로 TCP 준비 상태는 읽을 수 있는 바이트와 쓰기 역압에 따르며,
   * 바인딩된 UDP는 송신할 수 있습니다. 하위 클래스는 이 훅과 changed()로
   * UDP 데이터그램 및 Server 연결 큐를 Selector에 알립니다.
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
  /**
   * Wait for a write or generation cancellation; closing does not depend on
   * whether the underlying write callback fires.
   * @zh 等待写操作或代际取消；关闭时不依赖底层写回调是否会触发。
   * @ja 書き込みまたは世代のキャンセルを待ちます。閉じる際は下位層の
   * 書き込みコールバックが発火するかどうかに依存しません。
   * @ko 쓰기 또는 세대 취소를 기다립니다.
   * 닫을 때 하위 쓰기 콜백의 실행 여부에 의존하지 않습니다.
   */
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
