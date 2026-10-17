import { connect as connectTcp, isIP, type Socket } from 'node:net';
import { connect as connectTls } from 'node:tls';
import { validateHeaderName, validateHeaderValue } from 'node:http';
import { Time } from '../system/time';
import { IpAddressType } from './ip-address';
import { bytes, uint, millisecondsOf, type NetworkTime } from './common';

/**
 * HTTP request method.
 * @zh HTTP 请求方法。
 * @ja HTTP リクエストメソッド。
 * @ko HTTP 요청 메서드.
 */
export enum HttpMethod {
  /**
   * Read a resource.
   * @zh 读取资源。
   * @ja リソースを読み取ります。
   * @ko 리소스를 읽습니다.
   */
  Get,
  /**
   * Submit content.
   * @zh 提交内容。
   * @ja 内容を送信します。
   * @ko 내용을 제출합니다.
   */
  Post,
  /**
   * Read response headers only.
   * @zh 仅读取响应头。
   * @ja レスポンスヘッダーのみを読み取ります。
   * @ko 응답 헤더만 읽습니다.
   */
  Head,
  /**
   * Write or replace a resource.
   * @zh 写入或替换资源。
   * @ja リソースを書き込むか置換します。
   * @ko 리소스를 쓰거나 교체합니다.
   */
  Put,
  /**
   * Delete a resource.
   * @zh 删除资源。
   * @ja リソースを削除します。
   * @ko 리소스를 삭제합니다.
   */
  Delete,
}
/**
 * HTTP response statuses and client errors; values retain SFML definitions.
 * @zh HTTP 响应状态及客户端错误；数值保持 SFML 定义。
 * @ja HTTP レスポンス状態とクライアントエラー。値は SFML の定義を維持します。
 * @ko HTTP 응답 상태 및 클라이언트 오류. 값은 SFML 정의를 유지합니다.
 */
export enum HttpStatus {
  /**
   * Request succeeded.
   * @zh 请求成功。
   * @ja リクエストが成功しました。
   * @ko 요청이 성공했습니다.
   */
  Ok = 200,
  /**
   * Resource created.
   * @zh 已创建资源。
   * @ja リソースを作成しました。
   * @ko 리소스가 생성되었습니다.
   */
  Created = 201,
  /**
   * Request accepted.
   * @zh 已接受请求。
   * @ja リクエストを受け付けました。
   * @ko 요청이 수락되었습니다.
   */
  Accepted = 202,
  /**
   * Success with no response body.
   * @zh 成功且无响应体。
   * @ja 成功しましたが、レスポンス本文はありません。
   * @ko 성공했으며 응답 본문이 없습니다.
   */
  NoContent = 204,
  /**
   * Ask the client to reset content.
   * @zh 请求客户端重置内容。
   * @ja クライアントに内容のリセットを要求します。
   * @ko 클라이언트에 내용 초기화를 요청합니다.
   */
  ResetContent = 205,
  /**
   * Partial content returned.
   * @zh 返回部分内容。
   * @ja 部分的な内容を返しました。
   * @ko 일부 내용이 반환되었습니다.
   */
  PartialContent = 206,
  /**
   * Multiple resource choices exist.
   * @zh 存在多个资源选择。
   * @ja リソースの選択肢が複数あります。
   * @ko 여러 리소스 선택지가 있습니다.
   */
  MultipleChoices = 300,
  /**
   * Permanent redirect.
   * @zh 永久重定向。
   * @ja 永続的なリダイレクト。
   * @ko 영구 리디렉션.
   */
  MovedPermanently = 301,
  /**
   * Temporary redirect.
   * @zh 临时重定向。
   * @ja 一時的なリダイレクト。
   * @ko 임시 리디렉션.
   */
  MovedTemporarily = 302,
  /**
   * Resource not modified.
   * @zh 资源未修改。
   * @ja リソースは変更されていません。
   * @ko 리소스가 수정되지 않았습니다.
   */
  NotModified = 304,
  /**
   * Malformed request.
   * @zh 请求格式错误。
   * @ja リクエストの形式が不正です。
   * @ko 요청 형식이 잘못되었습니다.
   */
  BadRequest = 400,
  /**
   * Authentication required.
   * @zh 需要身份验证。
   * @ja 認証が必要です。
   * @ko 인증이 필요합니다.
   */
  Unauthorized = 401,
  /**
   * Access forbidden.
   * @zh 无权访问。
   * @ja アクセスが禁止されています。
   * @ko 접근 권한이 없습니다.
   */
  Forbidden = 403,
  /**
   * Resource does not exist.
   * @zh 资源不存在。
   * @ja リソースが存在しません。
   * @ko 리소스가 없습니다.
   */
  NotFound = 404,
  /**
   * SFML's retained range-error constant 407; the standard HTTP range error
   * is 416.
   * @zh SFML 保留的范围错误常量值 407；标准 HTTP 范围错误为 416。
   * @ja SFML が維持する範囲エラー定数値 407。
   * 標準 HTTP の範囲エラーは 416 です。
   * @ko SFML이 유지하는 범위 오류 상수 값 407.
   * 표준 HTTP 범위 오류는 416입니다.
   */
  RangeNotSatisfiable = 407,
  /**
   * Internal server error.
   * @zh 服务端内部错误。
   * @ja サーバー内部エラー。
   * @ko 서버 내부 오류.
   */
  InternalServerError = 500,
  /**
   * The server has not implemented this feature.
   * @zh 服务端未实现该功能。
   * @ja サーバーがこの機能を実装していません。
   * @ko 서버가 해당 기능을 구현하지 않았습니다.
   */
  NotImplemented = 501,
  /**
   * The gateway received an invalid response.
   * @zh 网关收到无效响应。
   * @ja ゲートウェイが無効なレスポンスを受信しました。
   * @ko 게이트웨이가 잘못된 응답을 받았습니다.
   */
  BadGateway = 502,
  /**
   * Service temporarily unavailable.
   * @zh 服务暂不可用。
   * @ja サービスは一時的に利用できません。
   * @ko 서비스를 일시적으로 사용할 수 없습니다.
   */
  ServiceNotAvailable = 503,
  /**
   * Gateway timeout.
   * @zh 网关等待超时。
   * @ja ゲートウェイの待機がタイムアウトしました。
   * @ko 게이트웨이 대기 시간이 초과되었습니다.
   */
  GatewayTimeout = 504,
  /**
   * The requested HTTP version is not supported.
   * @zh 不支持请求的 HTTP 版本。
   * @ja 要求された HTTP バージョンには対応していません。
   * @ko 요청한 HTTP 버전을 지원하지 않습니다.
   */
  VersionNotSupported = 505,
  /**
   * The client cannot parse the response, or it exceeds the size limit.
   * @zh 客户端无法解析响应或响应超过大小限制。
   * @ja クライアントがレスポンスを解析できないか、サイズ上限を超えています。
   * @ko 클라이언트가 응답을 파싱할 수 없거나 응답이 크기 제한을 초과했습니다.
   */
  InvalidResponse = 1000,
  /**
   * Connection or transfer failed, or the request timed out or was cancelled.
   * @zh 建连、传输失败，或请求超时、取消。
   * @ja 接続や転送が失敗したか、リクエストがタイムアウトまたはキャンセルされました。
   * @ko 연결이나 전송이 실패했거나 요청이 시간 초과 또는 취소되었습니다.
   */
  ConnectionFailed = 1001,
}
const methods = [ 'GET', 'POST', 'HEAD', 'PUT', 'DELETE' ];
const prepareRequest: unique symbol = Symbol('Http.prepare');
interface PreparedRequest { bytes: Buffer; head: boolean }

/**
 * Mutable HTTP/1 request, defaulting to GET /, HTTP/1.0, and an empty body.
 * @zh 可修改的 HTTP/1 请求，默认 GET /、HTTP/1.0 和空请求体。
 * @ja 変更可能な HTTP/1 リクエスト。既定は GET /、HTTP/1.0、空の本文です。
 * @ko 변경 가능한 HTTP/1 요청. 기본값은 GET /, HTTP/1.0 및 빈 본문입니다.
 */
export class HttpRequest {
  /**
   * Request method enumeration.
   * @zh 请求方法枚举。
   * @ja リクエストメソッドの列挙型。
   * @ko 요청 메서드 열거형.
   */
  static readonly Method = HttpMethod;
  /** 请求头字段，键为小写。 */
  private fields = new Map<string, string>();
  /** HTTP 请求方法。 */
  private method = HttpMethod.Get;
  /** 已编码的路径和查询串。 */
  private uri = '/';
  /** HTTP 主版本。 */
  private major = 1;
  /** HTTP 次版本。 */
  private minor = 0;
  /** 请求体字节。 */
  private body = Buffer.alloc(0);
  /**
   * Create a request from an encoded path, method, and body;
   * string bodies are encoded as UTF-8.
   * @zh 从已编码的请求路径、方法和请求体创建请求；字符串正文按 UTF-8 编码。
   * @ja 符号化済みのパス、メソッド、本文からリクエストを作成します。
   * 文字列の本文は UTF-8 で符号化します。
   * @ko 인코딩된 경로, 메서드 및 본문으로 요청을 생성합니다.
   * 문자열 본문은 UTF-8로 인코딩합니다.
   */
  constructor(uri = '/', method = HttpMethod.Get, body: string | Uint8Array = '') {
    this.setUri(uri);
    this.setMethod(method);
    this.setBody(body);
  }
  /**
   * Set a request header with a case-insensitive field name;
   * invalid header names or values throw.
   * @zh 设置请求头，字段名不区分大小写；非法头名称或值会抛出异常。
   * @ja 大文字・小文字を区別しないフィールド名でリクエストヘッダーを設定します。
   * ヘッダー名または値が不正な場合は例外をスローします。
   * @ko 대소문자를 구분하지 않는 필드 이름으로 요청 헤더를 설정합니다.
   * 헤더 이름이나 값이 잘못되면 예외를 던집니다.
   */
  setField(field: string, value: string): void {
    validateHeaderName(field);
    validateHeaderValue(field, value);
    this.fields.set(field.toLowerCase(), value);
  }
  /**
   * Set the request method.
   * @zh 设置请求方法。
   * @ja リクエストメソッドを設定します。
   * @ko 요청 메서드를 설정합니다.
   */
  setMethod(method: HttpMethod): void { this.method = uint(method, 4); }
  /**
   * Set the URL-encoded path and query string, adding a leading slash
   * if missing.
   * @zh 设置已进行 URL 编码的路径和查询串，缺少前导斜杠时自动添加。
   * @ja URL 符号化済みのパスとクエリ文字列を設定し、
   * 先頭のスラッシュがなければ自動で追加します。
   * @ko URL 인코딩된 경로와 쿼리 문자열을 설정하며,
   * 앞에 슬래시가 없으면 자동으로 추가합니다.
   */
  setUri(uri: string): void {
    // HTTP request targets cannot contain whitespace or control bytes.
    // eslint-disable-next-line no-control-regex
    if (typeof uri !== 'string' || /[\x00-\x20\x7f]/.test(uri)) {
      throw new TypeError('Expected an encoded HTTP request path');
    }
    this.uri = uri.startsWith('/') ? uri : '/' + uri;
  }
  /**
   * Set the HTTP major and minor versions written to the request line.
   * @zh 设置写入请求行的 HTTP 主次版本。
   * @ja リクエスト行に書き込む HTTP のメジャー・マイナーバージョンを設定します。
   * @ko 요청 행에 쓸 HTTP 주 버전과 부 버전을 설정합니다.
   */
  setHttpVersion(major: number, minor: number): void {
    this.major = uint(major); this.minor = uint(minor);
  }
  /**
   * Copy request body bytes; encode strings as UTF-8.
   * @zh 复制请求体字节；字符串按 UTF-8 编码。
   * @ja リクエスト本文のバイトをコピーし、文字列は UTF-8 で符号化します。
   * @ko 요청 본문 바이트를 복사하며 문자열은 UTF-8로 인코딩합니다.
   */
  setBody(body: string | Uint8Array): void {
    this.body = Buffer.from(typeof body === 'string' ? body : bytes(body));
  }
  [prepareRequest](host: string): PreparedRequest {
    const fields = new Map(this.fields);
    if (!fields.has('host')) fields.set('host', host);
    if (!fields.has('from')) fields.set('from', 'user@sfml-dev.org');
    if (!fields.has('user-agent')) fields.set('user-agent', 'sfml.js');
    if (!fields.has('content-length')) {
      fields.set('content-length', String(this.body.length));
    }
    if (!fields.has('connection')) fields.set('connection', 'close');
    if (fields.has('transfer-encoding')) {
      throw new TypeError('Request bodies use Content-Length framing');
    }
    if (Number(fields.get('content-length')) !== this.body.length) {
      throw new RangeError('Content-Length does not match the request body');
    }
    const header = `${methods[this.method]} ${this.uri} ` +
      `HTTP/${this.major}.${this.minor}\r\n` +
      [ ...fields ].map(([ key, value ]) => `${key}: ${value}\r\n`).join('') +
      '\r\n';
    return { bytes: Buffer.concat([ Buffer.from(header), this.body ]),
      head: this.method === HttpMethod.Head };
  }
}
/**
 * HTTP response status, header fields, and body.
 * @zh HTTP 响应状态、头字段和正文。
 * @ja HTTP レスポンスの状態、ヘッダーフィールド、本文。
 * @ko HTTP 응답 상태, 헤더 필드 및 본문.
 */
export class HttpResponse {
  /**
   * HTTP response status enumeration.
   * @zh HTTP 响应状态枚举。
   * @ja HTTP レスポンス状態の列挙型。
   * @ko HTTP 응답 상태 열거형.
   */
  static readonly Status = HttpStatus;
  /**
   * Construct a response, indicating connection failure by default;
   * fields keys should be lowercase.
   * @zh 构造响应；默认表示连接失败，fields 的键应为小写。
   * @ja レスポンスを構築します。既定では接続失敗を表します。
   * fields のキーは小文字にしてください。
   * @ko 응답을 생성하며 기본적으로 연결 실패를 나타냅니다.
   * fields의 키는 소문자여야 합니다.
   */
  constructor(private readonly status: HttpStatus = HttpStatus.ConnectionFailed,
    private readonly fields: ReadonlyMap<string, string> = new Map(),
    private readonly body = Buffer.alloc(0),
    private readonly major = 0, private readonly minor = 0) {}
  /**
   * Read a response header by case-insensitive name;
   * return an empty string if absent.
   * @zh 按不区分大小写的名称读取响应头；不存在时返回空字符串。
   * @ja 大文字・小文字を区別せずにレスポンスヘッダーを読み取ります。
   * 存在しなければ空文字列を返します。
   * @ko 대소문자를 구분하지 않는 이름으로 응답 헤더를 읽습니다.
   * 없으면 빈 문자열을 반환합니다.
   */
  getField(field: string): string { return this.fields.get(field.toLowerCase()) ?? ''; }
  /**
   * Return the server status code or client error code.
   * @zh 返回服务端状态码或客户端错误码。
   * @ja サーバーの状態コードまたはクライアントのエラーコードを返します。
   * @ko 서버 상태 코드 또는 클라이언트 오류 코드를 반환합니다.
   */
  getStatus(): HttpStatus { return this.status; }
  /**
   * Return the response's HTTP major version.
   * @zh 返回响应的 HTTP 主版本。
   * @ja レスポンスの HTTP メジャーバージョンを返します。
   * @ko 응답의 HTTP 주 버전을 반환합니다.
   */
  getMajorHttpVersion(): number { return this.major; }
  /**
   * Return the response's HTTP minor version.
   * @zh 返回响应的 HTTP 次版本。
   * @ja レスポンスの HTTP マイナーバージョンを返します。
   * @ko 응답의 HTTP 부 버전을 반환합니다.
   */
  getMinorHttpVersion(): number { return this.minor; }
  /**
   * Decode the response body as a UTF-8 string.
   * @zh 将响应体按 UTF-8 解码为字符串。
   * @ja レスポンス本文を UTF-8 文字列として復号します。
   * @ko 응답 본문을 UTF-8 문자열로 디코딩합니다.
   */
  getBody(): string { return this.body.toString('utf8'); }
  /**
   * Return an independent copy of the raw response body bytes.
   * @zh 返回响应体原始字节的独立副本。
   * @ja レスポンス本文の生バイトの独立したコピーを返します。
   * @ko 응답 본문 원시 바이트의 독립적인 복사본을 반환합니다.
   */
  getBodyBytes(): Uint8Array { return Uint8Array.from(this.body); }
}

/** Streaming HTTP/1 response parser for the explicit-version request path. */
class ResponseParser {
  private pending: Buffer = Buffer.alloc(0);
  private fields = new Map<string, string>();
  private status = 0;
  private major = 0;
  private minor = 0;
  private chunks: Buffer[] = [];
  private count = 0;
  private remaining?: number;
  private chunked = false;
  private chunkRemaining?: number;
  private chunkCrlf = false;
  private trailers = false;
  private done = false;
  constructor(private readonly head: boolean) {}
  feed(data: Buffer, ended = false): HttpResponse | undefined {
    if (this.pending.length) this.pending = Buffer.concat([ this.pending, data ]);
    else this.pending = data;
    if (!this.status) {
      const end = this.pending.indexOf('\r\n\r\n');
      if (end < 0) {
        if (this.pending.length > 65536 || ended) throw new Error('Invalid header');
        return undefined;
      }
      const lines = this.pending.toString('latin1', 0, end).split('\r\n');
      const match = /^HTTP\/(\d+)\.(\d+) (\d{3})(?: |$)/.exec(lines.shift()!);
      if (!match) throw new Error('Invalid HTTP status line');
      this.major = Number(match[1]); this.minor = Number(match[2]);
      this.status = Number(match[3]);
      for (const line of lines) this.field(line);
      this.pending = this.pending.subarray(end + 4);
      if (this.status >= 100 && this.status < 200 && this.status !== 101) {
        this.status = 0; this.fields.clear();
        return this.feed(Buffer.alloc(0), ended);
      }
      this.chunked = this.fields.get('transfer-encoding')?.toLowerCase()
        .split(',')
        .map(value => value.trim())
        .includes('chunked') ?? false;
      const length = this.fields.get('content-length');
      if (!this.chunked && length !== undefined) {
        if (!/^\d+$/.test(length)) throw new Error('Invalid Content-Length');
        this.remaining = Number(length);
        if (!Number.isSafeInteger(this.remaining) || this.remaining > 67108864) {
          throw new Error('HTTP body exceeds 64 MiB');
        }
      }
      if (this.head || this.status === 204 || this.status === 304 ||
          this.status === 101) this.done = true;
    }
    while (!this.done && this.pending.length) {
      if (this.chunked) {
        if (this.trailers) {
          const end = this.pending.indexOf('\r\n');
          if (end < 0) break;
          if (end === 0) { this.done = true; break; }
          this.field(this.pending.toString('latin1', 0, end));
          this.pending = this.pending.subarray(end + 2);
          continue;
        }
        if (this.chunkCrlf) {
          if (this.pending.length < 2) break;
          if (this.pending.toString('latin1', 0, 2) !== '\r\n') {
            throw new Error('Invalid chunk terminator');
          }
          this.pending = this.pending.subarray(2);
          this.chunkCrlf = false;
        }
        if (this.chunkRemaining === undefined) {
          const end = this.pending.indexOf('\r\n');
          if (end < 0) break;
          const text = this.pending.toString('latin1', 0, end).split(';')[0];
          if (!/^[0-9a-f]+$/i.test(text)) throw new Error('Invalid chunk length');
          this.chunkRemaining = parseInt(text, 16);
          if (this.chunkRemaining > 67108864 - this.count) {
            throw new Error('HTTP body exceeds 64 MiB');
          }
          this.pending = this.pending.subarray(end + 2);
          if (!this.chunkRemaining) { this.trailers = true; continue; }
        }
        const count = Math.min(this.chunkRemaining, this.pending.length);
        this.consume(count);
        this.chunkRemaining -= count;
        if (!this.chunkRemaining) {
          this.chunkRemaining = undefined;
          this.chunkCrlf = true;
        }
      } else {
        const count = Math.min(this.remaining ?? Infinity, this.pending.length);
        this.consume(count);
        if (this.remaining !== undefined) {
          this.remaining -= count;
          if (!this.remaining) this.done = true;
        }
      }
    }
    if (this.remaining === 0 && !this.chunked) this.done = true;
    if (this.pending.length > 65536) throw new Error('HTTP framing exceeds limit');
    if (ended && !this.done) {
      if (this.chunked || this.remaining !== undefined) {
        throw new Error('Truncated HTTP response');
      }
      this.done = true;
    }
    return this.done ? new HttpResponse(this.status, this.fields,
      Buffer.concat(this.chunks, this.count), this.major, this.minor) : undefined;
  }
  private consume(count: number): void {
    if (this.count + count > 67108864) throw new Error('HTTP body exceeds 64 MiB');
    if (count) this.chunks.push(this.pending.subarray(0, count));
    this.count += count;
    this.pending = this.pending.subarray(count);
  }
  private field(line: string): void {
    const split = line.indexOf(':');
    if (split <= 0) throw new Error('Invalid HTTP header field');
    const name = line.slice(0, split).toLowerCase();
    const value = line.slice(split + 1).trim();
    if (name === 'content-length' && this.fields.has(name) &&
        this.fields.get(name) !== value) throw new Error('Conflicting lengths');
    this.fields.set(name, value);
  }
}

/**
 * HTTP/HTTPS client using one connection per request without automatically
 * following redirects.
 * @zh 一次请求使用一条连接的 HTTP/HTTPS 客户端，不自动跟随重定向。
 * @ja リクエストごとに 1 接続を使う HTTP/HTTPS クライアント。
 * リダイレクトを自動追跡しません。
 * @ko 요청당 하나의 연결을 사용하는 HTTP/HTTPS 클라이언트.
 * 리디렉션을 자동으로 따르지 않습니다.
 */
export class Http {
  /**
   * HTTP request type.
   * @zh HTTP 请求类型。
   * @ja HTTP リクエスト型。
   * @ko HTTP 요청 타입.
   */
  static readonly Request = HttpRequest;
  /**
   * HTTP response type.
   * @zh HTTP 响应类型。
   * @ja HTTP レスポンス型。
   * @ko HTTP 응답 타입.
   */
  static readonly Response = HttpResponse;
  /** 解析后的目标主机 URL。 */
  private host?: URL;
  /** 偏好的 IP 地址族，undefined 由系统选择。 */
  private family?: IpAddressType;
  /**
   * Set the server address; default to HTTP if no scheme is given.
   * port 0 preserves the URL port or the protocol's default port.
   * @zh 设置服务器地址；无协议时使用 HTTP，port 为 0 时保留 URL 或协议默认端口。
   * @ja サーバーアドレスを設定します。スキームがなければ HTTP を使用します。
   * port が 0 なら URL のポートまたはプロトコルの既定ポートを保持します。
   * @ko 서버 주소를 설정합니다. 스킴이 없으면 HTTP를 사용하며,
   * port가 0이면 URL 포트 또는 프로토콜 기본 포트를 유지합니다.
   */
  constructor(host?: string, port = 0, type?: IpAddressType) {
    if (host !== undefined) this.setHost(host, port, type);
  }
  /**
   * Set the server and optional IP address family, returning whether the
   * address is valid; do not open a network connection.
   * @zh 设置服务器和可选 IP 地址族，返回地址是否有效，不执行网络连接。
   * @ja サーバーと任意の IP アドレスファミリーを設定し、アドレスの有効性を
   * 返します。ネットワーク接続は行いません。
   * @ko 서버와 선택적 IP 주소 계열을 설정하고 주소 유효 여부를 반환합니다.
   * 네트워크 연결은 수행하지 않습니다.
   */
  setHost(host: string, port = 0, type?: IpAddressType): boolean {
    uint(port, 65535);
    if (type !== undefined) uint(type, 1);
    if (typeof host !== 'string') throw new TypeError('Expected a hostname');
    try {
      const parsed = new URL(host.includes('://') ? host : `http://${host}`);
      if (![ 'http:', 'https:' ].includes(parsed.protocol)) return false;
      if (port) parsed.port = String(port);
      this.host = parsed; this.family = type;
      return true;
    } catch { return false; }
  }
  /**
   * Send a request snapshot asynchronously and return the complete response,
   * with a body limit of 64 MiB.
   * @zh 异步发送请求快照并返回完整响应，正文上限为 64 MiB。
   * @ja リクエストのスナップショットを非同期に送信し、完全なレスポンスを返します。
   * 本文の上限は 64 MiB です。
   * @ko 요청 스냅샷을 비동기로 보내고 전체 응답을 반환합니다.
   * 본문 제한은 64 MiB입니다.
   * @param request - Request contents.
   * @zh request - 请求内容。
   * @ja request - リクエストの内容。
   * @ko request - 요청 내용.
   * @param timeout - Total timeout; Time.Zero disables the timeout.
   * @zh timeout - 总超时时长，Time.Zero 不设超时。
   * @ja timeout - 全体のタイムアウト。Time.Zero はタイムアウトなしです。
   * @ko timeout - 전체 제한 시간. Time.Zero는 제한 시간이 없습니다.
   * @param verifyServer - Whether HTTPS verifies the server certificate;
   * defaults to true.
   * @zh verifyServer - HTTPS 是否校验服务端证书，默认 true。
   * @ja verifyServer - HTTPS でサーバー証明書を検証するか。既定は true です。
   * @ko verifyServer - HTTPS 서버 인증서 검증 여부. 기본값은 true입니다.
   * @param signal - Optional cancellation signal;
   * cancellation returns ConnectionFailed.
   * @zh signal - 可选取消信号；取消返回 ConnectionFailed。
   * @ja signal - 任意のキャンセルシグナル。
   * キャンセル時は ConnectionFailed を返します。
   * @ko signal - 선택적 취소 신호. 취소 시 ConnectionFailed를 반환합니다.
   */
  async sendRequest(request: HttpRequest, timeout: NetworkTime = Time.Zero,
    verifyServer = true, signal?: AbortSignal): Promise<HttpResponse> {
    if (!(request instanceof HttpRequest)) throw new TypeError('Expected Request');
    const milliseconds = millisecondsOf(timeout);
    const host = this.host;
    if (!host || signal?.aborted) return new HttpResponse();
    const prepared = request[prepareRequest](host.host);
    const options = { host: host.hostname.replace(/^\[|\]$/g, ''),
      port: Number(host.port) || (host.protocol === 'https:' ? 443 : 80),
      family: this.family === undefined ? 0 : this.family === IpAddressType.IpV4 ? 4 : 6 };
    return new Promise(resolve => {
      let finished = false;
      let timer: NodeJS.Timeout | undefined;
      const parser = new ResponseParser(prepared.head);
      let socket: Socket;
      const finish = (response = new HttpResponse()) => {
        if (finished) return;
        finished = true;
        if (timer) clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        socket?.destroy();
        resolve(response);
      };
      function abort() { finish(); }
      const receive = (data: Buffer, ended = false) => {
        try {
          const response = parser.feed(data, ended);
          if (response) finish(response);
        } catch { finish(new HttpResponse(HttpStatus.InvalidResponse)); }
      };
      if (host.protocol === 'https:') {
        const secureOptions = {
          ...options,
          servername: isIP(options.host) ? undefined : options.host,
          rejectUnauthorized: verifyServer,
        };
        socket = connectTls(secureOptions, () => socket.write(prepared.bytes));
      } else socket = connectTcp(options, () => socket.write(prepared.bytes));
      socket.on('data', receive)
        .on('end', () => receive(Buffer.alloc(0), true))
        .on('error', () => finish())
        .on('close', () => finish());
      signal?.addEventListener('abort', abort, { once: true });
      if (milliseconds) timer = setTimeout(abort, milliseconds);
    });
  }
}
