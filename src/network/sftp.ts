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
/** 无进展超时配置；收到数据或 RPC 完成时重置计时，零时长不设超时。 */
export type SftpTimeout = NetworkTime | TimeoutWithPredicate;
/** SFTP 操作状态和消息。 */
export class SftpResult {
  /** SFTP 结果码枚举。 */
  static readonly Value = Value;
  /** 从结果码及可选说明创建结果。 */
  constructor(private readonly value: Value, private readonly message = '') {}
  /** 返回结果是否为 Success。 */
  isOk(): boolean { return this.value === Value.Success; }
  /** 返回结果码。 */
  getValue(): Value { return this.value; }
  /** 返回错误或状态说明。 */
  getMessage(): string { return this.message; }
}
/** 带远端路径的操作结果。 */
export class SftpPathResult extends SftpResult {
  /** 复制结果状态并附加路径。 */
  constructor(result: SftpResult, private readonly path = '') {
    super(result.getValue(), result.getMessage());
  }
  /** 返回远端路径；失败结果通常为空字符串。 */
  getPath(): string { return this.path; }
}
/** 远端文件系统条目类型。 */
export enum FileType {
  /** 未设置类型。 */
  None,
  /** 条目不存在。 */
  NotFound,
  /** 普通文件。 */
  Regular,
  /** 目录。 */
  Directory,
  /** 符号链接。 */
  Symlink,
  /** 块设备。 */
  Block,
  /** 字符设备。 */
  Character,
  /** 命名管道。 */
  Fifo,
  /** 套接字。 */
  Socket,
  /** 未知类型。 */
  Unknown,
}
/** 远端条目属性；服务端未提供的字段为 undefined。 */
export interface SftpAttributes {
  /** 查询路径；目录列表中为条目名称。 */
  path: string;
  /** 文件系统条目类型。 */
  type?: FileType;
  /** 文件大小，单位为字节。 */
  size?: bigint;
  /** Unix 权限位，范围 0～0o7777。 */
  permissions?: number;
  /** 所有者用户 ID。 */
  userId?: bigint;
  /** 所有者组 ID。 */
  groupId?: bigint;
  /** 最近访问时间。 */
  accessTime?: Date;
  /** 最近修改时间。 */
  modificationTime?: Date;
}
/** 带单个文件系统条目属性的结果。 */
export class SftpAttributesResult extends SftpResult {
  /** 复制结果状态并附加属性对象。 */
  constructor(result: SftpResult,
    private readonly attributes: SftpAttributes = { path: '' }) {
    super(result.getValue(), result.getMessage());
  }
  /** 返回此结果持有的属性对象。 */
  getAttributes(): SftpAttributes { return this.attributes; }
}
/** 带目录条目属性列表的结果。 */
export class SftpListingResult extends SftpResult {
  /** 复制结果状态并附加条目列表。 */
  constructor(result: SftpResult, private readonly listing: SftpAttributes[] = []) {
    super(result.getValue(), result.getMessage());
  }
  /** 返回此结果持有的目录条目列表。 */
  getListing(): readonly SftpAttributes[] { return this.listing; }
}
/** SSH 握手协商结果，供应用核验主机公钥和算法。 */
export interface SftpSessionInfo {
  /** 服务端主机公钥与原始指纹字节。 */
  hostKey: {
    /** 公钥类型。 */
    type: SftpHostKeyType;
    /** SSH 编码的公钥数据副本。 */
    data: Uint8Array;
    /** SHA-1 指纹原始字节。 */
    sha1: Uint8Array;
    /** SHA-256 指纹原始字节。 */
    sha256: Uint8Array;
  };
  /** 密钥交换算法。 */
  keyExchangeAlgorithm: string;
  /** 服务端主机公钥算法。 */
  hostKeyAlgorithm: string;
  /** 客户端到服务端的加密算法。 */
  clientToServerEncryptionAlgorithm: string;
  /** 服务端到客户端的加密算法。 */
  serverToClientEncryptionAlgorithm: string;
  /** 客户端到服务端的消息认证算法。 */
  clientToServerMacAlgorithm: string;
  /** 服务端到客户端的消息认证算法。 */
  serverToClientMacAlgorithm: string;
  /** 客户端到服务端的压缩算法。 */
  clientToServerCompressionAlgorithm: string;
  /** 服务端到客户端的压缩算法。 */
  serverToClientCompressionAlgorithm: string;
}
/** 消费下载块，返回 false 提前结束；空块表示文件末尾。 */
export type SftpDownloadCallback = (data: Uint8Array) => boolean | Promise<boolean>;
/** 上传回调接收的可填充数据块。 */
export interface SftpUploadChunk {
  /** 本次写入区，需填充原缓冲区，不得替换引用。 */
  readonly data: Uint8Array;
  /** 实际写入字节数，不得超过 data.length。 */
  size: number;
}
/** 填充上传块并设置 size；返回 false 时仍发送当前块，然后结束。 */
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

/** 基于 ssh2 的异步 SFTP 客户端，文件操作按调用顺序执行。 */
export class Sftp {
  /** 基本结果类型。 */
  static readonly Result = SftpResult;
  /** 路径结果类型。 */
  static readonly PathResult = SftpPathResult;
  /** 属性结果类型。 */
  static readonly AttributesResult = SftpAttributesResult;
  /** 目录列表结果类型。 */
  static readonly ListingResult = SftpListingResult;
  /** 服务端主机公钥类型。 */
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
   * 建立 SSH 握手，默认端口 22；随后调用 login 完成身份认证。
   * 不自动核验主机可信性，应用可在登录前通过 getSessionInfo 核验主机指纹。
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
  /** 立即关闭会话并返回成功结果；timeout 仅作参数校验。 */
  disconnect(timeout: SftpTimeout = Time.Zero): Promise<SftpResult> {
    millisecondsOf(timeout instanceof TimeoutWithPredicate
      ? timeout.getPeriod() : timeout);
    this.close();
    return Promise.resolve(ok());
  }
  /** 立即销毁 SSH 连接并唤醒待完成操作。 */
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
  /** 以用户名和密码异步认证并打开 SFTP 通道。 */
  login(name: string, password: string, timeout?: SftpTimeout): Promise<SftpResult>;
  /** 以匹配的公私钥及可选私钥密码异步认证，密钥参数为内容而非文件路径。 */
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
  /** 返回主机公钥和协商算法的快照；握手信息未就绪时为 undefined。 */
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
  /** 请求服务器解析规范化绝对路径。 */
  resolvePath(path: string, timeout: SftpTimeout = Time.Zero): Promise<SftpPathResult> {
    return this.queue.run(async () => {
      try {
        const resolved = await this.timed(timeout, () =>
          this.rpc<string>(done => this.channel().realpath(path, done)));
        return new SftpPathResult(ok(), resolved);
      } catch (error) { return new SftpPathResult(result(error)); }
    });
  }
  /** 查询服务器对当前会话的默认工作目录。 */
  getWorkingDirectory(timeout: SftpTimeout = Time.Zero): Promise<SftpPathResult> {
    return this.resolvePath('.', timeout);
  }
  /** 查询远端属性；followLinks 默认跟随符号链接，false 查询链接自身。 */
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
  /** 异步读取目录条目及其属性。 */
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
  /** 创建远端目录，默认 Unix 权限为 0o755。 */
  createDirectory(path: string, permissions = 0o755, timeout: SftpTimeout = Time.Zero):
  Promise<SftpResult> {
    uint(permissions, 0o7777);
    return this.run(timeout, () => this.rpc<void>(done =>
      this.channel().mkdir(path, { mode: permissions }, done)));
  }
  /** 删除远端空目录。 */
  deleteDirectory(path: string, timeout: SftpTimeout = Time.Zero): Promise<SftpResult> {
    return this.run(timeout, () => this.rpc<void>(done => this.channel().rmdir(path, done)));
  }
  /** 重命名远端路径；overwrite 为 true 时要求服务端支持 OpenSSH 覆盖重命名扩展。 */
  rename(oldPath: string, newPath: string, overwrite = false,
    timeout: SftpTimeout = Time.Zero): Promise<SftpResult> {
    return this.run(timeout, () => this.rpc<void>(done => (overwrite
      ? this.channel().ext_openssh_rename(oldPath, newPath, done)
      : this.channel().rename(oldPath, newPath, done))));
  }
  /** 删除远端文件或符号链接。 */
  deleteFile(path: string, timeout: SftpTimeout = Time.Zero): Promise<SftpResult> {
    return this.run(timeout, () => this.rpc<void>(done => this.channel().unlink(path, done)));
  }
  /** 从字节偏移 offset 开始分块下载；依次等待 callback，偏移最大为 2^53−1。 */
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
   * 按回调提供的数据块上传文件，逐块等待写入完成。
   * @param path 远端文件路径。
   * @param callback 填充缓冲区和 size 的回调。
   * @param permissions 新建文件权限，默认 0o644。
   * @param truncate 是否清空现有文件，默认 true。
   * @param append 是否要求追加写入，默认 false。
   * @param offset 起始字节偏移，默认 0n，最大 2^53−1。
   * @param timeout 无进展超时配置，默认不限时。
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
