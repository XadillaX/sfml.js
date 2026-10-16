import { connect as connectTcp, isIP, type Socket } from 'node:net';
import { connect as connectTls } from 'node:tls';
import { validateHeaderName, validateHeaderValue } from 'node:http';
import { Time } from '../system/time';
import { IpAddressType } from './ip-address';
import { bytes, uint, millisecondsOf, type NetworkTime } from './common';

/** HTTP 请求方法。 */
export enum HttpMethod {
  /** 读取资源。 */
  Get,
  /** 提交内容。 */
  Post,
  /** 仅读取响应头。 */
  Head,
  /** 写入或替换资源。 */
  Put,
  /** 删除资源。 */
  Delete,
}
/** HTTP 响应状态及客户端错误；数值保持 SFML 定义。 */
export enum HttpStatus {
  /** 请求成功。 */
  Ok = 200,
  /** 已创建资源。 */
  Created = 201,
  /** 已接受请求。 */
  Accepted = 202,
  /** 成功且无响应体。 */
  NoContent = 204,
  /** 请求客户端重置内容。 */
  ResetContent = 205,
  /** 返回部分内容。 */
  PartialContent = 206,
  /** 存在多个资源选择。 */
  MultipleChoices = 300,
  /** 永久重定向。 */
  MovedPermanently = 301,
  /** 临时重定向。 */
  MovedTemporarily = 302,
  /** 资源未修改。 */
  NotModified = 304,
  /** 请求格式错误。 */
  BadRequest = 400,
  /** 需要身份验证。 */
  Unauthorized = 401,
  /** 无权访问。 */
  Forbidden = 403,
  /** 资源不存在。 */
  NotFound = 404,
  /** SFML 保留的范围错误常量值 407；标准 HTTP 范围错误为 416。 */
  RangeNotSatisfiable = 407,
  /** 服务端内部错误。 */
  InternalServerError = 500,
  /** 服务端未实现该功能。 */
  NotImplemented = 501,
  /** 网关收到无效响应。 */
  BadGateway = 502,
  /** 服务暂不可用。 */
  ServiceNotAvailable = 503,
  /** 网关等待超时。 */
  GatewayTimeout = 504,
  /** 不支持请求的 HTTP 版本。 */
  VersionNotSupported = 505,
  /** 客户端无法解析响应或响应超过大小限制。 */
  InvalidResponse = 1000,
  /** 建连、传输失败，或请求超时、取消。 */
  ConnectionFailed = 1001,
}
const methods = [ 'GET', 'POST', 'HEAD', 'PUT', 'DELETE' ];
const prepareRequest: unique symbol = Symbol('Http.prepare');
interface PreparedRequest { bytes: Buffer; head: boolean }

/** 可修改的 HTTP/1 请求，默认 GET /、HTTP/1.0 和空请求体。 */
export class HttpRequest {
  /** 请求方法枚举。 */
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
  /** 从已编码的请求路径、方法和请求体创建请求；字符串正文按 UTF-8 编码。 */
  constructor(uri = '/', method = HttpMethod.Get, body: string | Uint8Array = '') {
    this.setUri(uri);
    this.setMethod(method);
    this.setBody(body);
  }
  /** 设置请求头，字段名不区分大小写；非法头名称或值会抛出异常。 */
  setField(field: string, value: string): void {
    validateHeaderName(field);
    validateHeaderValue(field, value);
    this.fields.set(field.toLowerCase(), value);
  }
  /** 设置请求方法。 */
  setMethod(method: HttpMethod): void { this.method = uint(method, 4); }
  /** 设置已进行 URL 编码的路径和查询串，缺少前导斜杠时自动添加。 */
  setUri(uri: string): void {
    // HTTP request targets cannot contain whitespace or control bytes.
    // eslint-disable-next-line no-control-regex
    if (typeof uri !== 'string' || /[\x00-\x20\x7f]/.test(uri)) {
      throw new TypeError('Expected an encoded HTTP request path');
    }
    this.uri = uri.startsWith('/') ? uri : '/' + uri;
  }
  /** 设置写入请求行的 HTTP 主次版本。 */
  setHttpVersion(major: number, minor: number): void {
    this.major = uint(major); this.minor = uint(minor);
  }
  /** 复制请求体字节；字符串按 UTF-8 编码。 */
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
/** HTTP 响应状态、头字段和正文。 */
export class HttpResponse {
  /** HTTP 响应状态枚举。 */
  static readonly Status = HttpStatus;
  /** 构造响应；默认表示连接失败，fields 的键应为小写。 */
  constructor(private readonly status: HttpStatus = HttpStatus.ConnectionFailed,
    private readonly fields: ReadonlyMap<string, string> = new Map(),
    private readonly body = Buffer.alloc(0),
    private readonly major = 0, private readonly minor = 0) {}
  /** 按不区分大小写的名称读取响应头；不存在时返回空字符串。 */
  getField(field: string): string { return this.fields.get(field.toLowerCase()) ?? ''; }
  /** 返回服务端状态码或客户端错误码。 */
  getStatus(): HttpStatus { return this.status; }
  /** 返回响应的 HTTP 主版本。 */
  getMajorHttpVersion(): number { return this.major; }
  /** 返回响应的 HTTP 次版本。 */
  getMinorHttpVersion(): number { return this.minor; }
  /** 将响应体按 UTF-8 解码为字符串。 */
  getBody(): string { return this.body.toString('utf8'); }
  /** 返回响应体原始字节的独立副本。 */
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

/** 一次请求使用一条连接的 HTTP/HTTPS 客户端，不自动跟随重定向。 */
export class Http {
  /** HTTP 请求类型。 */
  static readonly Request = HttpRequest;
  /** HTTP 响应类型。 */
  static readonly Response = HttpResponse;
  /** 解析后的目标主机 URL。 */
  private host?: URL;
  /** 偏好的 IP 地址族，undefined 由系统选择。 */
  private family?: IpAddressType;
  /** 设置服务器地址；无协议时使用 HTTP，port 为 0 时保留 URL 或协议默认端口。 */
  constructor(host?: string, port = 0, type?: IpAddressType) {
    if (host !== undefined) this.setHost(host, port, type);
  }
  /** 设置服务器和可选 IP 地址族，返回地址是否有效，不执行网络连接。 */
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
   * 异步发送请求快照并返回完整响应，正文上限为 64 MiB。
   * @param request 请求内容。
   * @param timeout 总超时时长，Time.Zero 不设超时。
   * @param verifyServer HTTPS 是否校验服务端证书，默认 true。
   * @param signal 可选取消信号；取消返回 ConnectionFailed。
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
