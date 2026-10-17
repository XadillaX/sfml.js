import { Client, utils, type SFTPWrapper, type NextAuthHandler,
  type AnyAuthMethod, type NegotiatedAlgorithms,
  type Attributes as SshAttributes } from 'ssh2';
import { Socket as NetSocket } from 'node:net';
import { EventEmitter } from 'node:events';
import { createHash } from 'node:crypto';
import { IpAddress } from './ip-address';
import { Time } from '../system/time';
import { TimeoutWithPredicate } from '../system/timeout-with-predicate';
import { SerialQueue, millisecondsOf, bytes, uint, waitFor,
  type NetworkTime } from './common';
import { SftpResultValue as Value, SftpHostKeyType } from './gen/constants';

export { SftpResultValue, SftpHostKeyType } from './gen/constants';
/**
 * No-progress timeout configuration; reset the timer when data arrives or
 * an RPC completes. A zero duration disables the timeout.
 * @zh 无进展超时配置；收到数据或 RPC 完成时重置计时，零时长不设超时。
 * @ja 進捗がない場合のタイムアウト設定。データ受信または RPC 完了で
 * タイマーをリセットします。期間がゼロならタイムアウトなしです。
 * @ko 진행이 없을 때의 제한 시간 설정. 데이터 수신 또는 RPC 완료 시 타이머를
 * 재설정하며 기간이 0이면 제한 시간이 없습니다.
 */
export type SftpTimeout = NetworkTime | TimeoutWithPredicate;
/**
 * SFTP operation status and message.
 * @zh SFTP 操作状态和消息。
 * @ja SFTP 操作の状態とメッセージ。
 * @ko SFTP 작업 상태와 메시지.
 */
export class SftpResult {
  /**
   * SFTP result code enumeration.
   * @zh SFTP 结果码枚举。
   * @ja SFTP 結果コードの列挙型。
   * @ko SFTP 결과 코드 열거형.
   */
  static readonly Value = Value;
  /**
   * Create a result from a result code and optional description.
   * @zh 从结果码及可选说明创建结果。
   * @ja 結果コードと任意の説明から結果を作成します。
   * @ko 결과 코드와 선택적 설명으로 결과를 생성합니다.
   */
  constructor(private readonly value: Value, private readonly message = '') {}
  /**
   * Return whether the result is Success.
   * @zh 返回结果是否为 Success。
   * @ja 結果が Success かどうかを返します。
   * @ko 결과가 Success인지 반환합니다.
   */
  isOk(): boolean { return this.value === Value.Success; }
  /**
   * Return the result code.
   * @zh 返回结果码。
   * @ja 結果コードを返します。
   * @ko 결과 코드를 반환합니다.
   */
  getValue(): Value { return this.value; }
  /**
   * Return the error or status description.
   * @zh 返回错误或状态说明。
   * @ja エラーまたは状態の説明を返します。
   * @ko 오류 또는 상태 설명을 반환합니다.
   */
  getMessage(): string { return this.message; }
}
/**
 * Operation result containing a remote path.
 * @zh 带远端路径的操作结果。
 * @ja リモートパスを含む操作結果。
 * @ko 원격 경로를 포함하는 작업 결과.
 */
export class SftpPathResult extends SftpResult {
  /**
   * Copy the result status and attach a path.
   * @zh 复制结果状态并附加路径。
   * @ja 結果の状態をコピーし、パスを付加します。
   * @ko 결과 상태를 복사하고 경로를 첨부합니다.
   */
  constructor(result: SftpResult, private readonly path = '') {
    super(result.getValue(), result.getMessage());
  }
  /**
   * Return the remote path; failed results usually contain an empty string.
   * @zh 返回远端路径；失败结果通常为空字符串。
   * @ja リモートパスを返します。失敗結果では通常、空文字列です。
   * @ko 원격 경로를 반환하며 실패한 결과에서는 보통 빈 문자열입니다.
   */
  getPath(): string { return this.path; }
}
/**
 * Remote filesystem entry type.
 * @zh 远端文件系统条目类型。
 * @ja リモートファイルシステムのエントリー型。
 * @ko 원격 파일 시스템 항목 타입.
 */
export enum FileType {
  /**
   * No type set.
   * @zh 未设置类型。
   * @ja 型が未設定です。
   * @ko 타입이 설정되지 않았습니다.
   */
  None,
  /**
   * Entry does not exist.
   * @zh 条目不存在。
   * @ja エントリーが存在しません。
   * @ko 항목이 없습니다.
   */
  NotFound,
  /**
   * Regular file.
   * @zh 普通文件。
   * @ja 通常ファイル。
   * @ko 일반 파일.
   */
  Regular,
  /**
   * Directory.
   * @zh 目录。
   * @ja ディレクトリ。
   * @ko 디렉터리.
   */
  Directory,
  /**
   * Symbolic link.
   * @zh 符号链接。
   * @ja シンボリックリンク。
   * @ko 심볼릭 링크.
   */
  Symlink,
  /**
   * Block device.
   * @zh 块设备。
   * @ja ブロックデバイス。
   * @ko 블록 장치.
   */
  Block,
  /**
   * Character device.
   * @zh 字符设备。
   * @ja キャラクターデバイス。
   * @ko 문자 장치.
   */
  Character,
  /**
   * Named pipe.
   * @zh 命名管道。
   * @ja 名前付きパイプ。
   * @ko 이름 있는 파이프.
   */
  Fifo,
  /**
   * Socket.
   * @zh 套接字。
   * @ja ソケット。
   * @ko 소켓.
   */
  Socket,
  /**
   * Unknown type.
   * @zh 未知类型。
   * @ja 不明な型。
   * @ko 알 수 없는 타입.
   */
  Unknown,
}
/**
 * Remote entry attributes; fields omitted by the server are undefined.
 * @zh 远端条目属性；服务端未提供的字段为 undefined。
 * @ja リモートエントリーの属性。サーバーが提供しないフィールドは undefined です。
 * @ko 원격 항목 속성. 서버가 제공하지 않은 필드는 undefined입니다.
 */
export interface SftpAttributes {
  /**
   * Queried path, or entry name in directory listings.
   * @zh 查询路径；目录列表中为条目名称。
   * @ja 照会したパス。ディレクトリ一覧ではエントリー名です。
   * @ko 조회 경로. 디렉터리 목록에서는 항목 이름입니다.
   */
  path: string;
  /**
   * Filesystem entry type.
   * @zh 文件系统条目类型。
   * @ja ファイルシステムのエントリー型。
   * @ko 파일 시스템 항목 타입.
   */
  type?: FileType;
  /**
   * File size in bytes.
   * @zh 文件大小，单位为字节。
   * @ja バイト単位のファイルサイズ。
   * @ko 바이트 단위의 파일 크기.
   */
  size?: bigint;
  /**
   * Unix permission bits, ranging from 0 to 0o7777.
   * @zh Unix 权限位，范围 0～0o7777。
   * @ja Unix 権限ビット。範囲は 0～0o7777 です。
   * @ko Unix 권한 비트. 범위는 0~0o7777입니다.
   */
  permissions?: number;
  /**
   * Owner user ID.
   * @zh 所有者用户 ID。
   * @ja 所有者のユーザー ID。
   * @ko 소유자 사용자 ID.
   */
  userId?: bigint;
  /**
   * Owner group ID.
   * @zh 所有者组 ID。
   * @ja 所有者のグループ ID。
   * @ko 소유자 그룹 ID.
   */
  groupId?: bigint;
  /**
   * Last access time.
   * @zh 最近访问时间。
   * @ja 最終アクセス時刻。
   * @ko 마지막 접근 시간.
   */
  accessTime?: Date;
  /**
   * Last modification time.
   * @zh 最近修改时间。
   * @ja 最終更新時刻。
   * @ko 마지막 수정 시간.
   */
  modificationTime?: Date;
}
/**
 * Result containing attributes of one filesystem entry.
 * @zh 带单个文件系统条目属性的结果。
 * @ja 単一ファイルシステムエントリーの属性を含む結果。
 * @ko 파일 시스템 항목 하나의 속성을 포함하는 결과.
 */
export class SftpAttributesResult extends SftpResult {
  /**
   * Copy the result status and attach an attributes object.
   * @zh 复制结果状态并附加属性对象。
   * @ja 結果の状態をコピーし、属性オブジェクトを付加します。
   * @ko 결과 상태를 복사하고 속성 객체를 첨부합니다.
   */
  constructor(result: SftpResult,
    private readonly attributes: SftpAttributes = { path: '' }) {
    super(result.getValue(), result.getMessage());
  }
  /**
   * Return the attributes object held by this result.
   * @zh 返回此结果持有的属性对象。
   * @ja この結果が保持する属性オブジェクトを返します。
   * @ko 이 결과가 보유한 속성 객체를 반환합니다.
   */
  getAttributes(): SftpAttributes { return this.attributes; }
}
/**
 * Result containing a list of directory entry attributes.
 * @zh 带目录条目属性列表的结果。
 * @ja ディレクトリエントリーの属性一覧を含む結果。
 * @ko 디렉터리 항목 속성 목록을 포함하는 결과.
 */
export class SftpListingResult extends SftpResult {
  /**
   * Copy the result status and attach an entry list.
   * @zh 复制结果状态并附加条目列表。
   * @ja 結果の状態をコピーし、エントリー一覧を付加します。
   * @ko 결과 상태를 복사하고 항목 목록을 첨부합니다.
   */
  constructor(result: SftpResult, private readonly listing: SftpAttributes[] = []) {
    super(result.getValue(), result.getMessage());
  }
  /**
   * Return the directory entry list held by this result.
   * @zh 返回此结果持有的目录条目列表。
   * @ja この結果が保持するディレクトリエントリー一覧を返します。
   * @ko 이 결과가 보유한 디렉터리 항목 목록을 반환합니다.
   */
  getListing(): readonly SftpAttributes[] { return this.listing; }
}
/**
 * SSH handshake negotiation results for application verification
 * of the host public key and algorithms.
 * @zh SSH 握手协商结果，供应用核验主机公钥和算法。
 * @ja アプリケーションによるホスト公開鍵とアルゴリズムの検証に使う
 * SSH ハンドシェイクの交渉結果。
 * @ko 애플리케이션이 호스트 공개 키와 알고리즘을 검증하는 데 사용하는
 * SSH 핸드셰이크 협상 결과.
 */
export interface SftpSessionInfo {
  /**
   * Server host public key and raw fingerprint bytes.
   * @zh 服务端主机公钥与原始指纹字节。
   * @ja サーバーホストの公開鍵とフィンガープリントの生バイト。
   * @ko 서버 호스트 공개 키와 원시 지문 바이트.
   */
  hostKey: {
    /**
     * Public key type.
     * @zh 公钥类型。
     * @ja 公開鍵の型。
     * @ko 공개 키 타입.
     */
    type: SftpHostKeyType;
    /**
     * Copy of SSH-encoded public key data.
     * @zh SSH 编码的公钥数据副本。
     * @ja SSH 符号化された公開鍵データのコピー。
     * @ko SSH로 인코딩된 공개 키 데이터 복사본.
     */
    data: Uint8Array;
    /**
     * Raw SHA-1 fingerprint bytes.
     * @zh SHA-1 指纹原始字节。
     * @ja SHA-1 フィンガープリントの生バイト。
     * @ko SHA-1 지문 원시 바이트.
     */
    sha1: Uint8Array;
    /**
     * Raw SHA-256 fingerprint bytes.
     * @zh SHA-256 指纹原始字节。
     * @ja SHA-256 フィンガープリントの生バイト。
     * @ko SHA-256 지문 원시 바이트.
     */
    sha256: Uint8Array;
  };
  /**
   * Key exchange algorithm.
   * @zh 密钥交换算法。
   * @ja 鍵交換アルゴリズム。
   * @ko 키 교환 알고리즘.
   */
  keyExchangeAlgorithm: string;
  /**
   * Server host public key algorithm.
   * @zh 服务端主机公钥算法。
   * @ja サーバーホストの公開鍵アルゴリズム。
   * @ko 서버 호스트 공개 키 알고리즘.
   */
  hostKeyAlgorithm: string;
  /**
   * Client-to-server encryption algorithm.
   * @zh 客户端到服务端的加密算法。
   * @ja クライアントからサーバーへの暗号化アルゴリズム。
   * @ko 클라이언트에서 서버로의 암호화 알고리즘.
   */
  clientToServerEncryptionAlgorithm: string;
  /**
   * Server-to-client encryption algorithm.
   * @zh 服务端到客户端的加密算法。
   * @ja サーバーからクライアントへの暗号化アルゴリズム。
   * @ko 서버에서 클라이언트로의 암호화 알고리즘.
   */
  serverToClientEncryptionAlgorithm: string;
  /**
   * Client-to-server message authentication algorithm.
   * @zh 客户端到服务端的消息认证算法。
   * @ja クライアントからサーバーへのメッセージ認証アルゴリズム。
   * @ko 클라이언트에서 서버로의 메시지 인증 알고리즘.
   */
  clientToServerMacAlgorithm: string;
  /**
   * Server-to-client message authentication algorithm.
   * @zh 服务端到客户端的消息认证算法。
   * @ja サーバーからクライアントへのメッセージ認証アルゴリズム。
   * @ko 서버에서 클라이언트로의 메시지 인증 알고리즘.
   */
  serverToClientMacAlgorithm: string;
  /**
   * Client-to-server compression algorithm.
   * @zh 客户端到服务端的压缩算法。
   * @ja クライアントからサーバーへの圧縮アルゴリズム。
   * @ko 클라이언트에서 서버로의 압축 알고리즘.
   */
  clientToServerCompressionAlgorithm: string;
  /**
   * Server-to-client compression algorithm.
   * @zh 服务端到客户端的压缩算法。
   * @ja サーバーからクライアントへの圧縮アルゴリズム。
   * @ko 서버에서 클라이언트로의 압축 알고리즘.
   */
  serverToClientCompressionAlgorithm: string;
}
/**
 * Consume a download chunk; return false to stop early.
 * An empty chunk indicates end of file.
 * @zh 消费下载块，返回 false 提前结束；空块表示文件末尾。
 * @ja ダウンロードチャンクを処理し、false を返すと早期終了します。
 * 空チャンクはファイル終端を示します。
 * @ko 다운로드 청크를 처리하며 false를 반환하면 조기 종료합니다.
 * 빈 청크는 파일 끝을 나타냅니다.
 */
export type SftpDownloadCallback = (data: Uint8Array) => boolean | Promise<boolean>;
/**
 * Writable data chunk received by an upload callback.
 * @zh 上传回调接收的可填充数据块。
 * @ja アップロードコールバックが受け取る書き込み可能なデータチャンク。
 * @ko 업로드 콜백이 받는 채울 수 있는 데이터 청크.
 */
export interface SftpUploadChunk {
  /**
   * Current write area; fill the original buffer without replacing
   * its reference.
   * @zh 本次写入区，需填充原缓冲区，不得替换引用。
   * @ja 今回の書き込み領域。参照を置換せず、元のバッファを埋めてください。
   * @ko 이번 쓰기 영역. 참조를 교체하지 말고 원래 버퍼를 채워야 합니다.
   */
  readonly data: Uint8Array;
  /**
   * Actual byte count written; must not exceed data.length.
   * @zh 实际写入字节数，不得超过 data.length。
   * @ja 実際に書き込んだバイト数。data.length を超えてはなりません。
   * @ko 실제로 쓴 바이트 수. data.length를 초과하면 안 됩니다.
   */
  size: number;
}
/**
 * Fill an upload chunk and set size; returning false still sends
 * the current chunk before stopping.
 * @zh 填充上传块并设置 size；返回 false 时仍发送当前块，然后结束。
 * @ja アップロードチャンクを埋めて size を設定します。
 * false を返しても現在のチャンクを送信してから終了します。
 * @ko 업로드 청크를 채우고 size를 설정합니다.
 * false를 반환해도 현재 청크를 보낸 후 종료합니다.
 */
export type SftpUploadCallback = (chunk: SftpUploadChunk) => boolean | Promise<boolean>;
class OperationError extends Error {
  constructor(readonly value: Value, message: string) { super(message); }
}
const ok = () => new SftpResult(Value.Success);
function position(value: bigint): number {
  if (typeof value !== 'bigint' || value < 0n ||
      value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError('ssh2 file offsets must be exact integers up to 2^53 - 1');
  }
  return Number(value);
}
function result(error: unknown): SftpResult {
  if (error instanceof OperationError) return new SftpResult(error.value, error.message);
  const err = error as Error & { code?: number | string; level?: string };
  const statuses = [ Value.Success, Value.EndOfFile, Value.NoSuchFile,
    Value.PermissionDenied, Value.Failure, Value.BadMessage, Value.NoConnection,
    Value.ConnectionLost, Value.OperationUnsupported, Value.InvalidHandle,
    Value.NoSuchPath, Value.FileAlreadyExists, Value.WriteProtect, Value.NoMedia,
    Value.NoSpaceOnFileSystem, Value.QuotaExceeded, Value.UnknownPrincipal,
    Value.LockConflict, Value.DirectoryNotEmpty, Value.NotADirectory,
    Value.InvalidFilename, Value.LinkLoop ];
  const code = typeof err.code === 'number' ? statuses[err.code]
    : err.code === 'ECONNREFUSED' ? Value.Refused
      : err.level === 'client-authentication' ? Value.AuthenticationFailed
        : undefined;
  return new SftpResult(code ?? Value.Error, err.message ?? String(error));
}
function attributes(path: string, input: Partial<SshAttributes>): SftpAttributes {
  const integer = (value?: number) => {
    if (value === undefined) return undefined;
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError('SFTP attribute exceeds exact integer range');
    }
    return BigInt(value);
  };
  const types: Record<number, FileType> = {
    8: FileType.Regular, 4: FileType.Directory, 10: FileType.Symlink,
    6: FileType.Block, 2: FileType.Character, 1: FileType.Fifo, 12: FileType.Socket,
  };
  return { path,
    type: input.mode === undefined ? undefined
      : types[Math.floor(input.mode / 4096) % 16] ?? FileType.Unknown,
    size: integer(input.size), permissions: input.mode === undefined
      ? undefined : input.mode % 4096,
    userId: integer(input.uid), groupId: integer(input.gid),
    accessTime: input.atime === undefined ? undefined : new Date(input.atime * 1000),
    modificationTime: input.mtime === undefined ? undefined : new Date(input.mtime * 1000) };
}

/**
 * Asynchronous SFTP client based on ssh2; file operations run in call order.
 * @zh 基于 ssh2 的异步 SFTP 客户端，文件操作按调用顺序执行。
 * @ja ssh2 ベースの非同期 SFTP クライアント。ファイル操作は呼び出し順に実行します。
 * @ko ssh2 기반 비동기 SFTP 클라이언트. 파일 작업은 호출 순서대로 실행됩니다.
 */
export class Sftp {
  /**
   * Basic result type.
   * @zh 基本结果类型。
   * @ja 基本結果型。
   * @ko 기본 결과 타입.
   */
  static readonly Result = SftpResult;
  /**
   * Path result type.
   * @zh 路径结果类型。
   * @ja パス結果型。
   * @ko 경로 결과 타입.
   */
  static readonly PathResult = SftpPathResult;
  /**
   * Attributes result type.
   * @zh 属性结果类型。
   * @ja 属性結果型。
   * @ko 속성 결과 타입.
   */
  static readonly AttributesResult = SftpAttributesResult;
  /**
   * Directory listing result type.
   * @zh 目录列表结果类型。
   * @ja ディレクトリ一覧結果型。
   * @ko 디렉터리 목록 결과 타입.
   */
  static readonly ListingResult = SftpListingResult;
  /**
   * Server host public key type.
   * @zh 服务端主机公钥类型。
   * @ja サーバーホストの公開鍵型。
   * @ko 서버 호스트 공개 키 타입.
   */
  static readonly HostKeyType = SftpHostKeyType;
  /** SSH 连接客户端实例。 */
  private client?: Client;
  /** 底层 TCP 传输。 */
  private transport?: NetSocket;
  /** 协商后的 SFTP 通道。 */
  private sftp?: SFTPWrapper;
  /** 等待中的认证处理器。 */
  private nextAuth?: NextAuthHandler;
  /** 认证尝试轮次。 */
  private authRound = 0;
  /** 是否已完成认证。 */
  private authenticated = false;
  /** 底层错误，唤醒等待操作后清除。 */
  private failure?: Error;
  /** 握手协商算法信息。 */
  private algorithms?: NegotiatedAlgorithms;
  /** 服务端原始主机公钥字节。 */
  private key?: Buffer;
  /** 用于唤醒等待器的事件总线。 */
  private readonly events = new EventEmitter();
  /** 确保文件操作按调用顺序执行的队列。 */
  private readonly queue = new SerialQueue();
  /** 接收数据或完成 RPC 时的进度回调，用于超时重置。 */
  private progress = () => {};

  /**
   * Establish an SSH handshake on port 22 by default; then call login
   * to authenticate. Host trust is not verified automatically; applications
   * can verify the host fingerprint via getSessionInfo before logging in.
   * @zh 建立 SSH 握手，默认端口 22；随后调用 login 完成身份认证。
   * 不自动核验主机可信性，应用可在登录前通过 getSessionInfo 核验主机指纹。
   * @ja SSH ハンドシェイクを確立します。既定のポートは 22 で、
   * その後 login で認証します。ホストの信頼性は自動検証しません。
   * アプリケーションはログイン前に getSessionInfo で指紋を検証できます。
   * @ko SSH 핸드셰이크를 수행하며 기본 포트는 22입니다. 이후 login으로 인증합니다.
   * 호스트 신뢰성은 자동으로 검증하지 않습니다. 애플리케이션은 로그인 전에
   * getSessionInfo로 호스트 지문을 검증할 수 있습니다.
   */
  connect(server: IpAddress, port = 22, timeout: SftpTimeout = Time.Zero):
  Promise<SftpResult> {
    if (!(server instanceof IpAddress)) throw new TypeError('Expected IpAddress');
    uint(port, 65535);
    return this.queue.run(async () => {
      this.close();
      this.failure = undefined;
      const client = new Client();
      const transport = new NetSocket();
      this.client = client;
      this.transport = transport;
      transport.on('data', () => this.progress());
      transport.on('error', error => {
        if (this.transport !== transport) return;
        this.failure = error; this.events.emit('change');
      });
      client.on('error', error => {
        if (this.client !== client) return;
        this.failure = error; this.events.emit('change');
      });
      client.on('close', () => {
        if (this.client !== client) return;
        this.client = undefined;
        this.sftp = undefined;
        this.nextAuth = undefined;
        this.events.emit('change');
      });
      client.on('handshake', algorithms => {
        this.algorithms = algorithms; this.progress();
      });
      client.on('ready', () => {
        this.authenticated = true; this.events.emit('change');
      });
      try {
        await this.timed(timeout, async () => {
          transport.connect(port, server.toString());
          client.connect({ sock: transport, username: '', readyTimeout: 0,
            hostVerifier: (key: Buffer) => { this.key = Buffer.from(key); return true; },
            authHandler: (_methods, _partial, next) => {
              this.nextAuth = next; this.authRound++; this.events.emit('change');
            },
          });
          await this.state(() => !!this.nextAuth);
        });
        return ok();
      } catch (error) { this.close(); return result(error); }
    });
  }
  /**
   * Close the session immediately and return success;
   * timeout is used only for argument validation.
   * @zh 立即关闭会话并返回成功结果；timeout 仅作参数校验。
   * @ja セッションを即座に閉じて成功結果を返します。
   * timeout は引数の検証にのみ使用します。
   * @ko 즉시 세션을 닫고 성공 결과를 반환합니다.
   * timeout은 인수 검증에만 사용합니다.
   */
  disconnect(timeout: SftpTimeout = Time.Zero): Promise<SftpResult> {
    millisecondsOf(timeout instanceof TimeoutWithPredicate
      ? timeout.getPeriod() : timeout);
    this.close();
    return Promise.resolve(ok());
  }
  /**
   * Destroy the SSH connection immediately and wake pending operations.
   * @zh 立即销毁 SSH 连接并唤醒待完成操作。
   * @ja SSH 接続を即座に破棄し、未完了の操作を起こします。
   * @ko 즉시 SSH 연결을 해제하고 대기 중인 작업을 깨웁니다.
   */
  close(): void {
    const client = this.client;
    this.client = undefined;
    this.sftp = undefined;
    this.nextAuth = undefined;
    this.authenticated = false;
    this.key = undefined;
    this.algorithms = undefined;
    client?.destroy();
    this.transport?.destroy();
    this.transport = undefined;
    this.events.emit('change');
  }
  /**
   * Authenticate asynchronously with a username and password,
   * then open an SFTP channel.
   * @zh 以用户名和密码异步认证并打开 SFTP 通道。
   * @ja ユーザー名とパスワードで非同期に認証し、SFTP チャネルを開きます。
   * @ko 사용자 이름과 암호로 비동기 인증하고 SFTP 채널을 엽니다.
   */
  login(name: string, password: string, timeout?: SftpTimeout): Promise<SftpResult>;
  /**
   * Authenticate asynchronously with matching public/private keys and an
   * optional private-key passphrase; key arguments are contents, not paths.
   * @zh 以匹配的公私钥及可选私钥密码异步认证，密钥参数为内容而非文件路径。
   * @ja 対応する公開鍵・秘密鍵と任意の秘密鍵パスフレーズで非同期に認証します。
   * 鍵の引数はファイルパスではなく内容です。
   * @ko 일치하는 공개 키와 개인 키 및 선택적 개인 키 암호로 비동기 인증합니다.
   * 키 인수는 파일 경로가 아닌 내용입니다.
   */
  login(name: string, publicKey: string | Uint8Array, privateKey: string | Uint8Array,
    passphrase?: string, timeout?: SftpTimeout): Promise<SftpResult>;
  login(name: string, passwordOrPublic: string | Uint8Array,
    keyOrTimeout?: string | Uint8Array | SftpTimeout, passphrase = '',
    timeout: SftpTimeout = Time.Zero): Promise<SftpResult> {
    const publicKey = typeof keyOrTimeout === 'string' || keyOrTimeout instanceof Uint8Array;
    const duration = publicKey ? timeout : keyOrTimeout as SftpTimeout | undefined ?? Time.Zero;
    let method: AnyAuthMethod;
    if (publicKey) {
      const key = utils.parseKey(typeof keyOrTimeout === 'string'
        ? keyOrTimeout : bytes(keyOrTimeout as Uint8Array), passphrase);
      if (key instanceof Error) return Promise.resolve(result(key));
      const advertised = utils.parseKey(typeof passwordOrPublic === 'string'
        ? passwordOrPublic : bytes(passwordOrPublic));
      if (advertised instanceof Error || !key.getPublicSSH().equals(advertised.getPublicSSH())) {
        return Promise.resolve(new SftpResult(Value.PublicKeyUnverified,
          'Public and private keys do not match'));
      }
      method = { type: 'publickey', username: name, key };
    } else {
      if (typeof passwordOrPublic !== 'string') throw new TypeError('Expected password');
      method = { type: 'password', username: name, password: passwordOrPublic };
    }
    return this.queue.run(async () => {
      try {
        await this.timed(duration, async () => {
          if (!this.nextAuth) throw new OperationError(Value.Disconnected, 'Connect before login');
          const next = this.nextAuth;
          this.nextAuth = undefined;
          const round = this.authRound;
          next(method);
          await this.state(() => this.authenticated || this.authRound !== round);
          if (!this.authenticated) {
            throw new OperationError(Value.AuthenticationFailed, 'Authentication rejected');
          }
          this.sftp = await this.rpc<SFTPWrapper>(done => this.client!.sftp(done));
        });
        return ok();
      } catch (error) { return result(error); }
    });
  }
  /**
   * Return a snapshot of the host public key and negotiated algorithms,
   * or undefined if handshake information is not ready.
   * @zh 返回主机公钥和协商算法的快照；握手信息未就绪时为 undefined。
   * @ja ホスト公開鍵と合意したアルゴリズムのスナップショットを返します。
   * ハンドシェイク情報が未準備なら undefined です。
   * @ko 호스트 공개 키와 협상한 알고리즘의 스냅샷을 반환하며,
   * 핸드셰이크 정보가 준비되지 않았으면 undefined입니다.
   */
  getSessionInfo(): SftpSessionInfo | undefined {
    if (!this.key || !this.algorithms) return undefined;
    const { key, algorithms: a } = this;
    const keyName = key.length >= 4
      ? key.toString('ascii', 4, 4 + key.readUInt32BE()) : '';
    const names: Record<string, SftpHostKeyType> = {
      'ssh-rsa': SftpHostKeyType.Rsa, 'ssh-dss': SftpHostKeyType.Dsa,
      'ecdsa-sha2-nistp256': SftpHostKeyType.Ecdsa256,
      'ecdsa-sha2-nistp384': SftpHostKeyType.Ecdsa384,
      'ecdsa-sha2-nistp521': SftpHostKeyType.Ecdsa521,
      'ssh-ed25519': SftpHostKeyType.Ed25519,
    };
    return { hostKey: { type: names[keyName] ?? SftpHostKeyType.Unknown,
      data: Uint8Array.from(key), sha1: createHash('sha1').update(key).digest(),
      sha256: createHash('sha256').update(key).digest() },
    keyExchangeAlgorithm: a.kex, hostKeyAlgorithm: a.serverHostKey,
    clientToServerEncryptionAlgorithm: a.cs.cipher,
    serverToClientEncryptionAlgorithm: a.sc.cipher,
    clientToServerMacAlgorithm: a.cs.mac, serverToClientMacAlgorithm: a.sc.mac,
    clientToServerCompressionAlgorithm: a.cs.compress,
    serverToClientCompressionAlgorithm: a.sc.compress };
  }
  /**
   * Ask the server to resolve a canonical absolute path.
   * @zh 请求服务器解析规范化绝对路径。
   * @ja 正規化された絶対パスの解決をサーバーに要求します。
   * @ko 서버에 정규화된 절대 경로 확인을 요청합니다.
   */
  resolvePath(path: string, timeout: SftpTimeout = Time.Zero): Promise<SftpPathResult> {
    return this.queue.run(async () => {
      try {
        const resolved = await this.timed(timeout, () =>
          this.rpc<string>(done => this.channel().realpath(path, done)));
        return new SftpPathResult(ok(), resolved);
      } catch (error) { return new SftpPathResult(result(error)); }
    });
  }
  /**
   * Query the server's default working directory for the current session.
   * @zh 查询服务器对当前会话的默认工作目录。
   * @ja 現在のセッションに対するサーバーの既定作業ディレクトリを照会します。
   * @ko 현재 세션에 대한 서버의 기본 작업 디렉터리를 조회합니다.
   */
  getWorkingDirectory(timeout: SftpTimeout = Time.Zero): Promise<SftpPathResult> {
    return this.resolvePath('.', timeout);
  }
  /**
   * Query remote attributes; followLinks follows symbolic links by default,
   * while false queries the link itself.
   * @zh 查询远端属性；followLinks 默认跟随符号链接，false 查询链接自身。
   * @ja リモート属性を照会します。followLinks は既定でシンボリックリンクを
   * たどり、false ならリンク自体を照会します。
   * @ko 원격 속성을 조회합니다. followLinks는 기본적으로 심볼릭 링크를 따르며,
   * false이면 링크 자체를 조회합니다.
   */
  getAttributes(path: string, followLinks = true, timeout: SftpTimeout = Time.Zero):
  Promise<SftpAttributesResult> {
    return this.queue.run(async () => {
      try {
        const data = await this.timed(timeout, () => this.rpc<SshAttributes>(done =>
          (followLinks ? this.channel().stat(path, done) : this.channel().lstat(path, done))));
        return new SftpAttributesResult(ok(), attributes(path, data));
      } catch (error) { return new SftpAttributesResult(result(error)); }
    });
  }
  /**
   * Read directory entries and their attributes asynchronously.
   * @zh 异步读取目录条目及其属性。
   * @ja ディレクトリエントリーとその属性を非同期に読み取ります。
   * @ko 디렉터리 항목과 속성을 비동기로 읽습니다.
   */
  getDirectoryListing(path: string, timeout: SftpTimeout = Time.Zero):
  Promise<SftpListingResult> {
    return this.queue.run(async () => {
      try {
        const listing = await this.timed(timeout, () =>
          this.rpc<{ filename: string; attrs: SshAttributes }[]>(done =>
            this.channel().readdir(path, done)));
        return new SftpListingResult(ok(),
          listing.map(entry => attributes(entry.filename, entry.attrs)));
      } catch (error) { return new SftpListingResult(result(error)); }
    });
  }
  /**
   * Create a remote directory with default Unix permissions of 0o755.
   * @zh 创建远端目录，默认 Unix 权限为 0o755。
   * @ja リモートディレクトリを作成します。既定の Unix 権限は 0o755 です。
   * @ko 원격 디렉터리를 생성하며 기본 Unix 권한은 0o755입니다.
   */
  createDirectory(path: string, permissions = 0o755, timeout: SftpTimeout = Time.Zero):
  Promise<SftpResult> {
    uint(permissions, 0o7777);
    return this.run(timeout, () => this.rpc<void>(done =>
      this.channel().mkdir(path, { mode: permissions }, done)));
  }
  /**
   * Delete an empty remote directory.
   * @zh 删除远端空目录。
   * @ja 空のリモートディレクトリを削除します。
   * @ko 비어 있는 원격 디렉터리를 삭제합니다.
   */
  deleteDirectory(path: string, timeout: SftpTimeout = Time.Zero): Promise<SftpResult> {
    return this.run(timeout, () => this.rpc<void>(done => this.channel().rmdir(path, done)));
  }
  /**
   * Rename a remote path; overwrite true requires server support for
   * the OpenSSH overwrite-rename extension.
   * @zh 重命名远端路径；overwrite 为 true 时要求服务端支持 OpenSSH 覆盖重命名扩展。
   * @ja リモートパスを改名します。overwrite が true の場合は
   * OpenSSH の上書き改名拡張へのサーバー対応が必要です。
   * @ko 원격 경로 이름을 변경합니다. overwrite가 true이면 서버가
   * OpenSSH 덮어쓰기 이름 변경 확장을 지원해야 합니다.
   */
  rename(oldPath: string, newPath: string, overwrite = false,
    timeout: SftpTimeout = Time.Zero): Promise<SftpResult> {
    return this.run(timeout, () => this.rpc<void>(done => (overwrite
      ? this.channel().ext_openssh_rename(oldPath, newPath, done)
      : this.channel().rename(oldPath, newPath, done))));
  }
  /**
   * Delete a remote file or symbolic link.
   * @zh 删除远端文件或符号链接。
   * @ja リモートファイルまたはシンボリックリンクを削除します。
   * @ko 원격 파일 또는 심볼릭 링크를 삭제합니다.
   */
  deleteFile(path: string, timeout: SftpTimeout = Time.Zero): Promise<SftpResult> {
    return this.run(timeout, () => this.rpc<void>(done => this.channel().unlink(path, done)));
  }
  /**
   * Download chunks from byte offset offset, awaiting callback sequentially;
   * the maximum offset is 2^53-1.
   * @zh 从字节偏移 offset 开始分块下载；依次等待 callback，偏移最大为 2^53−1。
   * @ja バイト位置 offset からチャンク単位でダウンロードし、callback を順に
   * 待機します。オフセットの最大値は 2^53-1 です。
   * @ko 바이트 오프셋 offset부터 청크 단위로 다운로드하며 callback을
   * 순서대로 기다립니다. 최대 오프셋은 2^53-1입니다.
   */
  download(path: string, callback: SftpDownloadCallback, offset = 0n,
    timeout: SftpTimeout = Time.Zero): Promise<SftpResult> {
    let at = position(offset);
    return this.run(timeout, async () => {
      const channel = this.channel();
      const handle = await this.rpc<Buffer>(done => channel.open(path, 'r', done));
      try {
        for (;;) {
          if (this.sftp !== channel) throw new OperationError(Value.Disconnected, 'Transfer ended');
          const data = Buffer.allocUnsafe(65536);
          const start = at;
          const count = await this.rpc<number>(done =>
            channel.read(handle, data, 0, data.length, start,
              (error, count) => done(error, count)));
          at = position(BigInt(at) + BigInt(count));
          const more = await callback(data.subarray(0, count));
          if (typeof more !== 'boolean') throw new TypeError('Expected callback boolean');
          if (!more || !count) break;
        }
      } finally {
        if (this.sftp === channel) await this.rpc<void>(done => channel.close(handle, done));
      }
    });
  }
  /**
   * Upload a file using callback-provided chunks, awaiting each chunk's write.
   * @zh 按回调提供的数据块上传文件，逐块等待写入完成。
   * @ja コールバックが提供するチャンクでファイルをアップロードし、
   * 各チャンクの書き込み完了を待ちます。
   * @ko 콜백이 제공하는 청크로 파일을 업로드하며 각 청크의 쓰기 완료를 기다립니다.
   * @param path - Remote file path.
   * @zh path - 远端文件路径。
   * @ja path - リモートファイルのパス。
   * @ko path - 원격 파일 경로.
   * @param callback - Callback that fills the buffer and sets size.
   * @zh callback - 填充缓冲区和 size 的回调。
   * @ja callback - バッファを埋めて size を設定するコールバック。
   * @ko callback - 버퍼를 채우고 size를 설정하는 콜백.
   * @param permissions - Permissions for new files; defaults to 0o644.
   * @zh permissions - 新建文件权限，默认 0o644。
   * @ja permissions - 新規ファイルの権限。既定は 0o644 です。
   * @ko permissions - 새 파일 권한. 기본값은 0o644입니다.
   * @param truncate - Whether to clear an existing file; defaults to true.
   * @zh truncate - 是否清空现有文件，默认 true。
   * @ja truncate - 既存ファイルを空にするか。既定は true です。
   * @ko truncate - 기존 파일을 비울지 여부. 기본값은 true입니다.
   * @param append - Whether to request append writes; defaults to false.
   * @zh append - 是否要求追加写入，默认 false。
   * @ja append - 追記書き込みを要求するか。既定は false です。
   * @ko append - 추가 쓰기를 요청할지 여부. 기본값은 false입니다.
   * @param offset - Starting byte offset; defaults to 0n, maximum 2^53-1.
   * @zh offset - 起始字节偏移，默认 0n，最大 2^53−1。
   * @ja offset - 開始バイトオフセット。既定は 0n、最大値は 2^53-1 です。
   * @ko offset - 시작 바이트 오프셋. 기본값은 0n, 최대값은 2^53-1입니다.
   * @param timeout - No-progress timeout configuration; no timeout by default.
   * @zh timeout - 无进展超时配置，默认不限时。
   * @ja timeout - 進捗がない場合のタイムアウト設定。既定では制限なしです。
   * @ko timeout - 진행이 없을 때의 제한 시간 설정. 기본적으로 제한이 없습니다.
   */
  upload(path: string, callback: SftpUploadCallback, permissions = 0o644,
    truncate = true, append = false, offset = 0n, timeout: SftpTimeout = Time.Zero):
    Promise<SftpResult> {
    let at = position(offset);
    uint(permissions, 0o7777);
    return this.run(timeout, async () => {
      const channel = this.channel();
      // SSH_FXF_WRITE | CREAT, with TRUNC and APPEND as independent flags.
      const flags = 2 + 8 + (truncate ? 16 : 0) + (append ? 4 : 0);
      const handle = await this.rpc<Buffer>(done =>
        channel.open(path, flags, { mode: permissions }, done));
      try {
        for (;;) {
          const data = Buffer.allocUnsafe(65536);
          const chunk = { data, size: data.length };
          const more = await callback(chunk);
          if (this.sftp !== channel) throw new OperationError(Value.Disconnected, 'Transfer ended');
          if (typeof more !== 'boolean' || chunk.data !== data) {
            throw new TypeError('Fill the provided upload buffer and return boolean');
          }
          uint(chunk.size, data.length);
          if (chunk.size) {
            const start = at;
            await this.rpc<void>(done =>
              channel.write(handle, data, 0, chunk.size, start, done));
            at = position(BigInt(at) + BigInt(chunk.size));
          }
          if (!more || !chunk.size) break;
        }
      } finally {
        if (this.sftp === channel) await this.rpc<void>(done => channel.close(handle, done));
      }
    });
  }
  /** 将队列操作包装为标准 SftpResult 结果。 */
  private run(timeout: SftpTimeout, action: () => Promise<void>): Promise<SftpResult> {
    return this.queue.run(async () => {
      try { await this.timed(timeout, action); return ok(); } catch (error) { return result(error); }
    });
  }
  /** 返回当前 SFTP 通道，未认证时抛出错误。 */
  private channel(): SFTPWrapper {
    if (!this.sftp) throw new OperationError(Value.Disconnected, 'SFTP is not authenticated');
    return this.sftp;
  }
  /** 等待 check 为 true、故障出现或连接关闭。 */
  private async state(check: () => boolean): Promise<void> {
    await waitFor(this.events, () => check() || !!this.failure || !this.client);
    if (this.failure) throw this.failure;
    if (!this.client) throw new OperationError(Value.Disconnected, 'SSH connection closed');
  }
  /** 包装 ssh2 回调为 Promise，连接关闭时自动拒绝。 */
  private rpc<T>(call: (done: (error?: Error | null, value?: T) => void) => void):
  Promise<T> {
    const client = this.client;
    if (!client) return Promise.reject(new OperationError(Value.Disconnected, 'SSH connection closed'));
    return new Promise((resolve, reject) => {
      const done = (error?: Error | null, value?: T) => {
        client.off('close', closed);
        this.progress();
        if (error) reject(error); else resolve(value as T);
      };
      function closed() {
        done(new OperationError(Value.Disconnected, 'SSH connection closed'));
      }
      client.once('close', closed);
      try { call(done); } catch (error) { done(error as Error); }
    });
  }
  /** 运行操作并应用超时；每次收到数据或 RPC 完成时重置计时。 */
  private async timed<T>(timeout: SftpTimeout, action: () => Promise<T>): Promise<T> {
    const config = timeout instanceof TimeoutWithPredicate ? timeout
      : new TimeoutWithPredicate(timeout);
    const period = millisecondsOf(config.getPeriod());
    let timer: NodeJS.Timeout | undefined;
    let stopped = false;
    let timedOut = false;
    let rejectTimeout!: (error: unknown) => void;
    const deadline = new Promise<never>((_resolve, reject) => { rejectTimeout = reject; });
    const client = this.client;
    const closed = () => {
      if (client !== this.client && !timedOut) {
        rejectTimeout(new OperationError(Value.Disconnected, 'SSH connection closed'));
      }
    };
    this.events.on('change', closed);
    const touch = () => {
      if (stopped || !period) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          if (config.getPredicate()()) { touch(); return; }
          timedOut = true;
          rejectTimeout(new OperationError(Value.Timeout, 'SFTP operation timed out'));
        } catch (error) { timedOut = true; rejectTimeout(error); }
        this.close();
      }, period);
    };
    this.progress = touch;
    touch();
    try {
      const operation = action();
      const value = await Promise.race([ operation, deadline ]);
      if (timedOut) throw new OperationError(Value.Timeout, 'SFTP operation timed out');
      return value;
    } finally {
      stopped = true;
      if (timer) clearTimeout(timer);
      this.events.off('change', closed);
      this.progress = () => {};
    }
  }
}
