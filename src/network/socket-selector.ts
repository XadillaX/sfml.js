import { EventEmitter } from 'node:events';
import { Socket, socketReady, socketEvents, socketAlive } from './socket';
import { Time } from '../system/time';
import { millisecondsOf, uint, waitFor, type NetworkTime } from './common';

/**
 * Socket readiness conditions, combinable as bit flags.
 * @zh 套接字就绪条件，可按位组合。
 * @ja ビット単位で組み合わせ可能なソケットの準備状態。
 * @ko 비트 플래그로 조합할 수 있는 소켓 준비 조건.
 */
export enum ReadinessType {
  /**
   * Data, a connection, or a disconnection is available for receive handling.
   * @zh 有数据、连接或断开状态可供读取处理。
   * @ja 受信処理用のデータ、接続、または切断状態があります。
   * @ko 수신 처리할 데이터, 연결 또는 연결 해제 상태가 있습니다.
   */
  Receive = 1,
  /**
   * The transport can currently accept writes.
   * @zh 传输层当前可接受写入。
   * @ja トランスポートが現在書き込みを受け付けられます。
   * @ko 전송 계층이 현재 쓰기를 허용할 수 있습니다.
   */
  Send = 2,
}
/**
 * Receive the readiness bit flags obtained by this wait.
 * @zh 接收本次 wait 得到的就绪位标志。
 * @ja 今回の wait で取得した準備状態のビットフラグを受け取ります。
 * @ko 이번 wait에서 얻은 준비 상태 비트 플래그를 받습니다.
 */
export type ReadyCallback = (readiness: number) => void;
interface Entry { mask: number; callback?: ReadyCallback }

/**
 * Wait asynchronously for a set of sockets to become ready,
 * retaining the results of the latest wait.
 * @zh 异步等待一组套接字就绪，并保存最近一次 wait 的结果。
 * @ja ソケット群の準備完了を非同期に待ち、直近の wait の結果を保持します。
 * @ko 소켓 집합이 준비될 때까지 비동기로 기다리고 최근 wait 결과를 보관합니다.
 */
export class SocketSelector {
  /**
   * Receive-ready bit flag.
   * @zh 可接收位标志。
   * @ja 受信準備完了のビットフラグ。
   * @ko 수신 준비 비트 플래그.
   */
  static readonly Receive = ReadinessType.Receive;
  /**
   * Send-ready bit flag.
   * @zh 可发送位标志。
   * @ja 送信準備完了のビットフラグ。
   * @ko 송신 준비 비트 플래그.
   */
  static readonly Send = ReadinessType.Send;
  private entries = new Map<Socket, Entry>();
  private ready = new Map<Socket, number>();
  private waiting = false;
  private cancel?: AbortController;
  /**
   * Create an empty selector or copy registrations, callbacks,
   * and the readiness snapshot.
   * @zh 创建空选择器，或复制注册集合、回调和就绪快照。
   * @ja 空のセレクターを作成するか、登録集合、コールバック、
   * 準備状態のスナップショットをコピーします。
   * @ko 빈 선택기를 생성하거나 등록 집합, 콜백 및 준비 상태 스냅샷을 복사합니다.
   */
  constructor(source?: SocketSelector) {
    if (source !== undefined) this.assign(source);
  }
  /**
   * Copy another selector's registrations and snapshot, returning this.
   * No wait may currently be pending.
   * @zh 复制另一个选择器的集合和快照，返回 this；当前不得有待完成的 wait。
   * @ja 別のセレクターの集合とスナップショットをコピーし、this を返します。
   * 現在処理中の wait があってはなりません。
   * @ko 다른 선택기의 등록 집합과 스냅샷을 복사하고 this를 반환합니다.
   * 현재 대기 중인 wait가 없어야 합니다.
   */
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
  /**
   * Register a live socket and readiness conditions; return false for duplicate
   * or unopened sockets. Callbacks require explicit dispatch.
   * @zh 注册活动套接字及就绪条件；重复或未打开返回 false，回调需显式 dispatch。
   * @ja 有効なソケットと準備条件を登録します。重複または未オープンなら false を
   * 返し、コールバックには明示的な dispatch が必要です。
   * @ko 활성 소켓과 준비 조건을 등록합니다. 중복되거나 열리지 않았으면 false를
   * 반환하며 콜백은 명시적으로 dispatch해야 합니다.
   */
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
  /**
   * Remove a socket and its readiness results, returning whether it was
   * registered; wake any pending wait.
   * @zh 移除套接字及就绪结果，返回此前是否注册；唤醒待完成的 wait。
   * @ja ソケットと準備結果を削除し、登録済みだったかどうかを返します。
   * 処理中の wait を起こします。
   * @ko 소켓과 준비 결과를 제거하고 이전 등록 여부를 반환합니다.
   * 대기 중인 wait를 깨웁니다.
   */
  remove(socket: Socket): boolean {
    this.ready.delete(socket);
    const removed = this.entries.delete(socket);
    this.cancel?.abort();
    return removed;
  }
  /**
   * Clear registrations and readiness results, waking any pending wait.
   * @zh 清空注册及就绪结果，并唤醒待完成的 wait。
   * @ja 登録と準備結果を消去し、処理中の wait を起こします。
   * @ko 등록 및 준비 결과를 비우고 대기 중인 wait를 깨웁니다.
   */
  clear(): void {
    this.entries.clear();
    this.ready.clear();
    this.cancel?.abort();
  }
  /**
   * Wait asynchronously and refresh the readiness snapshot.
   * Time.Zero disables the timeout; return whether any entry is ready.
   * Concurrent wait calls are not allowed.
   * @zh 异步等待并刷新就绪快照；Time.Zero 不设超时，返回是否有就绪项，
   * 不允许并发 wait。
   * @ja 非同期に待機して準備状態のスナップショットを更新します。
   * Time.Zero はタイムアウトなしで、準備済みの項目があるかを返します。
   * wait の同時呼び出しはできません。
   * @ko 비동기로 기다리고 준비 상태 스냅샷을 갱신합니다.
   * Time.Zero는 제한 시간이 없으며 준비된 항목이 있는지 반환합니다.
   * wait 동시 호출은 허용하지 않습니다.
   */
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
  /**
   * Check whether the latest wait snapshot contains the given readiness.
   * @zh 查询最近一次 wait 快照中是否含有指定就绪条件。
   * @ja 直近の wait のスナップショットに指定の準備条件が含まれるか確認します。
   * @ko 최근 wait 스냅샷에 지정한 준비 조건이 있는지 확인합니다.
   */
  isReady(socket: Socket, readiness = ReadinessType.Receive): boolean {
    uint(readiness, 3);
    // eslint-disable-next-line no-bitwise
    return ((this.ready.get(socket) ?? 0) & readiness) !== 0;
  }
  /**
   * Synchronously call registered callbacks for ready entries in the last wait.
   * @zh 同步调用最近一次 wait 中就绪项的已注册回调。
   * @ja 直近の wait で準備済みの項目の登録コールバックを同期的に呼び出します。
   * @ko 최근 wait에서 준비된 항목의 등록된 콜백을 동기적으로 호출합니다.
   */
  dispatchReadyCallbacks(): void {
    const callbacks = [ ...this.ready ].map(([ socket, mask ]) =>
      ({ callback: this.entries.get(socket)?.callback, mask }));
    for (const { callback, mask } of callbacks) callback?.(mask);
  }
}
