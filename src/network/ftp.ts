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
/**
 * FTP status code and server message.
 * @zh FTP 状态码和服务端消息。
 * @ja FTP 状態コードとサーバーメッセージ。
 * @ko FTP 상태 코드와 서버 메시지.
 */
export class FtpResponse {
  /**
   * FTP status code enumeration.
   * @zh FTP 状态码枚举。
   * @ja FTP 状態コードの列挙型。
   * @ko FTP 상태 코드 열거형.
   */
  static readonly Status = FtpStatus;
  /**
   * Create a response with InvalidResponse as the default status.
   * @zh 创建响应，默认状态为 InvalidResponse。
   * @ja レスポンスを作成します。既定の状態は InvalidResponse です。
   * @ko 응답을 생성하며 기본 상태는 InvalidResponse입니다.
   */
  constructor(private readonly status: FtpStatus = FtpStatus.InvalidResponse,
    private readonly message = '') {}
  /**
   * Return whether the status code is below 400, including success
   * and responses requiring further action.
   * @zh 返回状态码是否小于 400，包含成功和需后续操作的响应。
   * @ja 状態コードが 400 未満かどうかを返します。
   * 成功と追加操作が必要なレスポンスを含みます。
   * @ko 상태 코드가 400 미만인지 반환하며,
   * 성공 및 추가 작업이 필요한 응답을 포함합니다.
   */
  isOk(): boolean { return this.status < 400; }
  /**
   * Return the response status code.
   * @zh 返回响应状态码。
   * @ja レスポンスの状態コードを返します。
   * @ko 응답 상태 코드를 반환합니다.
   */
  getStatus(): FtpStatus { return this.status; }
  /**
   * Return the server or client error message.
   * @zh 返回服务端或客户端错误消息。
   * @ja サーバーまたはクライアントのエラーメッセージを返します。
   * @ko 서버 또는 클라이언트 오류 메시지를 반환합니다.
   */
  getMessage(): string { return this.message; }
}
/**
 * FTP response containing a working directory path.
 * @zh 带工作目录路径的 FTP 响应。
 * @ja 作業ディレクトリのパスを含む FTP レスポンス。
 * @ko 작업 디렉터리 경로를 포함하는 FTP 응답.
 */
export class FtpDirectoryResponse extends FtpResponse {
  private readonly directory: string;
  /**
   * Parse a double-quoted directory path from the response message.
   * @zh 从响应消息中解析双引号包围的目录路径。
   * @ja レスポンスメッセージから二重引用符で囲まれたディレクトリパスを解析します。
   * @ko 응답 메시지에서 큰따옴표로 둘러싸인 디렉터리 경로를 파싱합니다.
   */
  constructor(response: FtpResponse) {
    super(response.getStatus(), response.getMessage());
    this.directory = response.getMessage().match(/"((?:[^"]|"")*)"/)?.[1]
      .replace(/""/g, '"') ?? '';
  }
  /**
   * Return the parsed directory path, or an empty string if none was parsed.
   * @zh 返回解析到的目录路径，未解析到时为空字符串。
   * @ja 解析したディレクトリパスを返します。解析できなければ空文字列です。
   * @ko 파싱한 디렉터리 경로를 반환하며 파싱하지 못했으면 빈 문자열입니다.
   */
  getDirectory(): string { return this.directory; }
}
/**
 * FTP response containing directory entry names.
 * @zh 带目录条目名称的 FTP 响应。
 * @ja ディレクトリエントリー名を含む FTP レスポンス。
 * @ko 디렉터리 항목 이름을 포함하는 FTP 응답.
 */
export class FtpListingResponse extends FtpResponse {
  private readonly listing: string[];
  /**
   * Create a listing from an FTP response and newline-separated NLST contents.
   * @zh 从 FTP 响应和换行分隔的 NLST 内容创建列表。
   * @ja FTP レスポンスと改行区切りの NLST 内容から一覧を作成します。
   * @ko FTP 응답과 줄바꿈으로 구분된 NLST 내용으로 목록을 생성합니다.
   */
  constructor(response: FtpResponse, data = '') {
    super(response.getStatus(), response.getMessage());
    this.listing = data.split(/\r?\n/).filter(Boolean);
  }
  /**
   * Return an array of directory entry names with a readonly type.
   * @zh 返回目录条目名称的只读类型数组。
   * @ja ディレクトリエントリー名の読み取り専用型の配列を返します。
   * @ko 디렉터리 항목 이름을 읽기 전용 타입의 배열로 반환합니다.
   */
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

/**
 * FTP client based on basic-ftp; queued operations run in call order.
 * @zh 基于 basic-ftp 的 FTP 客户端，操作通过队列按调用顺序执行。
 * @ja basic-ftp ベースの FTP クライアント。キューで操作を呼び出し順に実行します。
 * @ko basic-ftp 기반 FTP 클라이언트. 작업은 큐를 통해 호출 순서대로 실행됩니다.
 */
export class Ftp {
  /**
   * Basic FTP response type.
   * @zh 基本 FTP 响应类型。
   * @ja 基本 FTP レスポンス型。
   * @ko 기본 FTP 응답 타입.
   */
  static readonly Response = FtpResponse;
  /**
   * Working directory response type.
   * @zh 工作目录响应类型。
   * @ja 作業ディレクトリレスポンス型。
   * @ko 작업 디렉터리 응답 타입.
   */
  static readonly DirectoryResponse = FtpDirectoryResponse;
  /**
   * Directory listing response type.
   * @zh 目录列表响应类型。
   * @ja ディレクトリ一覧レスポンス型。
   * @ko 디렉터리 목록 응답 타입.
   */
  static readonly ListingResponse = FtpListingResponse;
  /**
   * File transfer mode enumeration.
   * @zh 文件传输模式枚举。
   * @ja ファイル転送モードの列挙型。
   * @ko 파일 전송 모드 열거형.
   */
  static readonly TransferMode = TransferMode;
  private client = new Client(0);
  private readonly queue = new SerialQueue();

  /**
   * Connect to an FTP server asynchronously on port 21 by default.
   * Time.Zero disables the connection timeout; call login separately afterward.
   * @zh 异步连接 FTP 服务器，默认端口 21；Time.Zero 不设连接超时，
   * 连接后另行 login。
   * @ja FTP サーバーに非同期に接続します。既定のポートは 21 です。
   * Time.Zero は接続タイムアウトなしで、接続後に別途 login が必要です。
   * @ko FTP 서버에 비동기로 연결하며 기본 포트는 21입니다.
   * Time.Zero는 연결 제한 시간이 없으며 연결 후 별도로 login해야 합니다.
   */
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
  /**
   * Send QUIT in queue order and close the connection.
   * @zh 按队列顺序发送 QUIT 并关闭连接。
   * @ja キューの順序で QUIT を送信し、接続を閉じます。
   * @ko 큐 순서대로 QUIT를 보내고 연결을 닫습니다.
   */
  disconnect(): Promise<FtpResponse> {
    return this.queue.run(async () => {
      try { return response(await this.client.send('QUIT')); } catch (error) {
        return failure(error);
      } finally { this.client.close(); }
    });
  }
  /**
   * Abort any outstanding operation and release both connections.
   * @zh 中止所有未完成操作并释放两条连接。
   * @ja 未完了の操作を中止し、両方の接続を解放します。
   * @ko 미완료 작업을 중단하고 두 연결을 모두 해제합니다.
   */
  close(): void { this.client.close(); }
  /**
   * Log in asynchronously; omitted arguments use an anonymous account.
   * @zh 异步登录，省略参数时使用匿名账号。
   * @ja 非同期にログインします。引数を省略すると匿名アカウントを使います。
   * @ko 비동기로 로그인하며 인수를 생략하면 익명 계정을 사용합니다.
   */
  login(name = 'anonymous', password = 'user@sfml-dev.org'): Promise<FtpResponse> {
    commandPart(name); commandPart(password);
    return this.run(() => this.client.login(name, password));
  }
  /**
   * Send NOOP to keep the connection alive.
   * @zh 发送 NOOP 保持连接活跃。
   * @ja NOOP を送信して接続を維持します。
   * @ko NOOP를 보내 연결을 유지합니다.
   */
  keepAlive(): Promise<FtpResponse> { return this.sendCommand('NOOP'); }
  /**
   * Query the server's current working directory.
   * @zh 查询服务器当前工作目录。
   * @ja サーバーの現在の作業ディレクトリを照会します。
   * @ko 서버의 현재 작업 디렉터리를 조회합니다.
   */
  async getWorkingDirectory(): Promise<FtpDirectoryResponse> {
    return new FtpDirectoryResponse(await this.sendCommand('PWD'));
  }
  /**
   * Retrieve directory entry names using NLST, defaulting to the current
   * directory; listing data is limited to 8 MiB.
   * @zh 通过 NLST 获取目录名称列表，默认当前目录，列表数据上限为 8 MiB。
   * @ja NLST で名前の一覧を取得します。既定は現在のディレクトリで、
   * 一覧データの上限は 8 MiB です。
   * @ko NLST로 디렉터리 항목 이름 목록을 가져옵니다. 기본값은 현재 디렉터리이며,
   * 목록 데이터 제한은 8 MiB입니다.
   */
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
  /**
   * Change the server's current working directory.
   * @zh 切换服务器当前工作目录。
   * @ja サーバーの現在の作業ディレクトリを変更します。
   * @ko 서버의 현재 작업 디렉터리를 변경합니다.
   */
  changeDirectory(path: string): Promise<FtpResponse> {
    return this.sendCommand('CWD', path);
  }
  /**
   * Change to the parent of the server's current directory.
   * @zh 切换到服务器当前目录的上一级。
   * @ja サーバーの現在のディレクトリの親に移動します。
   * @ko 서버의 현재 디렉터리에서 상위 디렉터리로 이동합니다.
   */
  parentDirectory(): Promise<FtpResponse> { return this.sendCommand('CDUP'); }
  /**
   * Create a remote directory.
   * @zh 创建远端目录。
   * @ja リモートディレクトリを作成します。
   * @ko 원격 디렉터리를 생성합니다.
   */
  createDirectory(path: string): Promise<FtpResponse> {
    return this.sendCommand('MKD', path);
  }
  /**
   * Delete a remote directory, which usually must be empty.
   * @zh 删除远端目录，通常要求目录为空。
   * @ja リモートディレクトリを削除します。通常は空である必要があります。
   * @ko 원격 디렉터리를 삭제하며 일반적으로 비어 있어야 합니다.
   */
  deleteDirectory(path: string): Promise<FtpResponse> {
    return this.sendCommand('RMD', path);
  }
  /**
   * Rename a remote file or directory from path to newPath.
   * @zh 将远端文件或目录从 path 重命名为 newPath。
   * @ja リモートファイルまたはディレクトリを path から newPath に改名します。
   * @ko 원격 파일 또는 디렉터리 이름을 path에서 newPath로 변경합니다.
   */
  renameFile(path: string, newPath: string): Promise<FtpResponse> {
    commandPart(path); commandPart(newPath);
    return this.run(() => this.client.rename(path, newPath));
  }
  /**
   * Delete a remote file.
   * @zh 删除远端文件。
   * @ja リモートファイルを削除します。
   * @ko 원격 파일을 삭제합니다.
   */
  deleteFile(path: string): Promise<FtpResponse> {
    return this.sendCommand('DELE', path);
  }
  /**
   * Download a remote file to local directory localPath, retaining the source
   * filename; use binary transfer by default.
   * @zh 下载远端文件到本地目录 localPath，保留源文件名，默认二进制传输。
   * @ja 元のファイル名を保ち、リモートファイルをローカルディレクトリ localPath に
   * ダウンロードします。既定ではバイナリ転送です。
   * @ko 원본 파일 이름을 유지하여 원격 파일을 로컬 디렉터리 localPath에
   * 다운로드합니다. 기본적으로 바이너리 전송을 사용합니다.
   */
  download(remoteFile: string, localPath: string,
    mode = TransferMode.Binary): Promise<FtpResponse> {
    commandPart(remoteFile); uint(mode, 2);
    return this.run(async () => {
      await this.client.send(`TYPE ${[ 'I', 'A', 'E' ][mode]}`);
      return this.client.downloadTo(join(localPath, posix.basename(remoteFile)),
        remoteFile);
    });
  }
  /**
   * Upload a local file to a remote directory, retaining its filename;
   * append when append is true, otherwise overwrite by default.
   * @zh 上传本地文件到远端目录，保留文件名；append 为 true 时追加，默认覆盖。
   * @ja ファイル名を保ち、ローカルファイルをリモートディレクトリにアップロードします。
   * append が true なら追記し、既定では上書きします。
   * @ko 파일 이름을 유지하여 로컬 파일을 원격 디렉터리에 업로드합니다.
   * append가 true이면 추가하며 기본적으로 덮어씁니다.
   */
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
  /**
   * Send raw FTP commands and arguments in queue order;
   * arguments must not contain newlines or null bytes.
   * @zh 按队列顺序发送原始 FTP 命令及参数，参数不得含换行或空字节。
   * @ja 生の FTP コマンドと引数をキュー順に送信します。
   * 引数に改行やヌルバイトを含めてはなりません。
   * @ko 원시 FTP 명령과 인수를 큐 순서대로 보냅니다.
   * 인수에 줄바꿈이나 널 바이트가 포함되면 안 됩니다.
   */
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
