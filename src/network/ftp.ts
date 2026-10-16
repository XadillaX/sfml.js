import { Client, FTPError, type FTPResponse } from 'basic-ftp';
import { downloadTo } from 'basic-ftp/dist/transfer';
import { ProgressTracker } from 'basic-ftp/dist/ProgressTracker';
import { Writable } from 'node:stream';
import { basename, join, posix } from 'node:path';
import { IpAddress } from './ip-address';
import { Time } from '../system/time';
import { SerialQueue, uint, millisecondsOf, type NetworkTime } from './common';
import { FtpStatus, TransferMode } from './gen/constants';

export { FtpStatus, TransferMode } from './gen/constants';
/** FTP 状态码和服务端消息。 */
export class FtpResponse {
  /** FTP 状态码枚举。 */
  static readonly Status = FtpStatus;
  /** 创建响应，默认状态为 InvalidResponse。 */
  constructor(private readonly status: FtpStatus = FtpStatus.InvalidResponse,
    private readonly message = '') {}
  /** 返回状态码是否小于 400，包含成功和需后续操作的响应。 */
  isOk(): boolean { return this.status < 400; }
  /** 返回响应状态码。 */
  getStatus(): FtpStatus { return this.status; }
  /** 返回服务端或客户端错误消息。 */
  getMessage(): string { return this.message; }
}
/** 带工作目录路径的 FTP 响应。 */
export class FtpDirectoryResponse extends FtpResponse {
  private readonly directory: string;
  /** 从响应消息中解析双引号包围的目录路径。 */
  constructor(response: FtpResponse) {
    super(response.getStatus(), response.getMessage());
    this.directory = response.getMessage().match(/"((?:[^"]|"")*)"/)?.[1]
      .replace(/""/g, '"') ?? '';
  }
  /** 返回解析到的目录路径，未解析到时为空字符串。 */
  getDirectory(): string { return this.directory; }
}
/** 带目录条目名称的 FTP 响应。 */
export class FtpListingResponse extends FtpResponse {
  private readonly listing: string[];
  /** 从 FTP 响应和换行分隔的 NLST 内容创建列表。 */
  constructor(response: FtpResponse, data = '') {
    super(response.getStatus(), response.getMessage());
    this.listing = data.split(/\r?\n/).filter(Boolean);
  }
  /** 返回目录条目名称的只读类型数组。 */
  getListing(): readonly string[] { return this.listing; }
}
function commandPart(value: string): string {
  if (typeof value !== 'string' || /[\r\n\0]/.test(value)) {
    throw new TypeError('Invalid FTP command argument');
  }
  return value;
}
function response(value: FTPResponse): FtpResponse {
  return new FtpResponse(value.code, value.message);
}
function failure(error: unknown): FtpResponse {
  if (error instanceof FTPError) return new FtpResponse(error.code, error.message);
  const value = error as NodeJS.ErrnoException;
  const localFile = [ 'ENOENT', 'EACCES', 'EISDIR', 'ENOTDIR' ].includes(value.code ?? '');
  return new FtpResponse(localFile ? FtpStatus.InvalidFile
    : FtpStatus.ConnectionClosed, value.message ?? String(error));
}

/** 基于 basic-ftp 的 FTP 客户端，操作通过队列按调用顺序执行。 */
export class Ftp {
  /** 基本 FTP 响应类型。 */
  static readonly Response = FtpResponse;
  /** 工作目录响应类型。 */
  static readonly DirectoryResponse = FtpDirectoryResponse;
  /** 目录列表响应类型。 */
  static readonly ListingResponse = FtpListingResponse;
  /** 文件传输模式枚举。 */
  static readonly TransferMode = TransferMode;
  private client = new Client(0);
  private readonly queue = new SerialQueue();

  /** 异步连接 FTP 服务器，默认端口 21；Time.Zero 不设连接超时，连接后另行 login。 */
  connect(server: IpAddress, port = 21, timeout: NetworkTime = Time.Zero):
  Promise<FtpResponse> {
    if (!(server instanceof IpAddress)) throw new TypeError('Expected IpAddress');
    uint(port, 65535);
    const milliseconds = millisecondsOf(timeout);
    return this.queue.run(async () => {
      this.client.close();
      this.client = new Client(0);
      const client = this.client;
      const timer = milliseconds ? setTimeout(() => client.close(), milliseconds)
        : undefined;
      try {
        return response(await client.connect(server.toString(), port));
      } catch (error) {
        return new FtpResponse(FtpStatus.ConnectionFailed,
          error instanceof Error ? error.message : String(error));
      } finally { if (timer) clearTimeout(timer); }
    });
  }
  /** 按队列顺序发送 QUIT 并关闭连接。 */
  disconnect(): Promise<FtpResponse> {
    return this.queue.run(async () => {
      try { return response(await this.client.send('QUIT')); } catch (error) {
        return failure(error);
      } finally { this.client.close(); }
    });
  }
  /** Abort any outstanding operation and release both connections. */
  close(): void { this.client.close(); }
  /** 异步登录，省略参数时使用匿名账号。 */
  login(name = 'anonymous', password = 'user@sfml-dev.org'): Promise<FtpResponse> {
    commandPart(name); commandPart(password);
    return this.run(() => this.client.login(name, password));
  }
  /** 发送 NOOP 保持连接活跃。 */
  keepAlive(): Promise<FtpResponse> { return this.sendCommand('NOOP'); }
  /** 查询服务器当前工作目录。 */
  async getWorkingDirectory(): Promise<FtpDirectoryResponse> {
    return new FtpDirectoryResponse(await this.sendCommand('PWD'));
  }
  /** 通过 NLST 获取目录名称列表，默认当前目录，列表数据上限为 8 MiB。 */
  getDirectoryListing(directory = ''): Promise<FtpListingResponse> {
    commandPart(directory);
    return this.queue.run(async () => {
      const chunks: Buffer[] = [];
      let count = 0;
      try {
        await this.client.send('TYPE A');
        await this.client.prepareTransfer(this.client.ftp);
        const destination = new Writable({
          write(chunk: Buffer, _encoding, callback) {
            count += chunk.length;
            if (count > 8 * 1024 * 1024) {
              callback(new Error('Directory listing exceeds 8 MiB'));
            } else { chunks.push(chunk); callback(); }
          },
        });
        const result = await downloadTo(destination, {
          command: directory ? `NLST ${directory}` : 'NLST',
          remotePath: directory, type: 'list', ftp: this.client.ftp,
          tracker: new ProgressTracker(),
        });
        return new FtpListingResponse(response(result),
          Buffer.concat(chunks, count).toString('utf8'));
      } catch (error) { return new FtpListingResponse(failure(error)); }
    });
  }
  /** 切换服务器当前工作目录。 */
  changeDirectory(path: string): Promise<FtpResponse> {
    return this.sendCommand('CWD', path);
  }
  /** 切换到服务器当前目录的上一级。 */
  parentDirectory(): Promise<FtpResponse> { return this.sendCommand('CDUP'); }
  /** 创建远端目录。 */
  createDirectory(path: string): Promise<FtpResponse> {
    return this.sendCommand('MKD', path);
  }
  /** 删除远端目录，通常要求目录为空。 */
  deleteDirectory(path: string): Promise<FtpResponse> {
    return this.sendCommand('RMD', path);
  }
  /** 将远端文件或目录从 path 重命名为 newPath。 */
  renameFile(path: string, newPath: string): Promise<FtpResponse> {
    commandPart(path); commandPart(newPath);
    return this.run(() => this.client.rename(path, newPath));
  }
  /** 删除远端文件。 */
  deleteFile(path: string): Promise<FtpResponse> {
    return this.sendCommand('DELE', path);
  }
  /** 下载远端文件到本地目录 localPath，保留源文件名，默认二进制传输。 */
  download(remoteFile: string, localPath: string,
    mode = TransferMode.Binary): Promise<FtpResponse> {
    commandPart(remoteFile); uint(mode, 2);
    return this.run(async () => {
      await this.client.send(`TYPE ${[ 'I', 'A', 'E' ][mode]}`);
      return this.client.downloadTo(join(localPath, posix.basename(remoteFile)),
        remoteFile);
    });
  }
  /** 上传本地文件到远端目录，保留文件名；append 为 true 时追加，默认覆盖。 */
  upload(localFile: string, remotePath: string, mode = TransferMode.Binary,
    append = false): Promise<FtpResponse> {
    commandPart(remotePath); uint(mode, 2);
    return this.run(async () => {
      await this.client.send(`TYPE ${[ 'I', 'A', 'E' ][mode]}`);
      const target = posix.join(remotePath, basename(localFile));
      return append ? this.client.appendFrom(localFile, target)
        : this.client.uploadFrom(localFile, target);
    });
  }
  /** 按队列顺序发送原始 FTP 命令及参数，参数不得含换行或空字节。 */
  sendCommand(command: string, parameter = ''): Promise<FtpResponse> {
    commandPart(command); commandPart(parameter);
    return this.run(() => this.client.sendIgnoringError(
      parameter ? `${command} ${parameter}` : command));
  }
  private run(action: () => Promise<FTPResponse>): Promise<FtpResponse> {
    return this.queue.run(async () => {
      try { return response(await action()); } catch (error) { return failure(error); }
    });
  }
}
