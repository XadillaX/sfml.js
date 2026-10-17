import { isIP } from 'node:net';
import { createSocket } from 'node:dgram';
import * as ipaddr from 'ipaddr.js';
import { Time } from '../system/time';
import { uint, type NetworkTime } from './common';

/**
 * IP address family.
 * @zh IP 地址族。
 * @ja IP アドレスファミリー。
 * @ko IP 주소 계열.
 */
export enum IpAddressType {
  /**
   * 32-bit IPv4 address.
   * @zh 32 位 IPv4 地址。
   * @ja 32 ビットの IPv4 アドレス。
   * @ko 32비트 IPv4 주소.
   */
  IpV4,
  /**
   * 128-bit IPv6 address.
   * @zh 128 位 IPv6 地址。
   * @ja 128 ビットの IPv6 アドレス。
   * @ko 128비트 IPv6 주소.
   */
  IpV6,
}

/**
 * Immutable IP address value supporting IPv4 and IPv6.
 * @zh 不可变 IP 地址值，支持 IPv4 和 IPv6。
 * @ja IPv4 と IPv6 に対応する不変の IP アドレス値。
 * @ko IPv4와 IPv6를 지원하는 불변 IP 주소 값.
 */
export class IpAddress {
  /**
   * Address family enumeration.
   * @zh 地址族枚举。
   * @ja アドレスファミリーの列挙型。
   * @ko 주소 계열 열거형.
   */
  static readonly Type = IpAddressType;
  /** 4 或 16 字节的不可变地址数据。 */
  private readonly data: Buffer;

  /**
   * Create from an IPv4 network-order integer, 16 bytes of IPv6 data,
   * or a copy of an existing address.
   * @zh 从 IPv4 网络序整数、16 字节 IPv6 数据或现有地址副本创建。
   * @ja ネットワーク順の IPv4 整数、16 バイトの IPv6 データ、
   * または既存アドレスのコピーから作成します。
   * @ko 네트워크 바이트 순서의 IPv4 정수, 16바이트 IPv6 데이터,
   * 또는 기존 주소의 복사본으로 생성합니다.
   */
  constructor(address: number | Uint8Array | IpAddress);
  /**
   * Create an IPv4 address from four decimal octets in the range 0-255.
   * @zh 从四个 0～255 的十进制八位组创建 IPv4 地址。
   * @ja 0～255 の 4 つの 10 進オクテットから IPv4 アドレスを作成します。
   * @ko 0~255 범위의 십진수 옥텟 4개로 IPv4 주소를 생성합니다.
   */
  constructor(a: number, b: number, c: number, d: number);
  constructor(address: number | Uint8Array | IpAddress,
    b?: number, c?: number, d?: number) {
    if (address instanceof IpAddress) this.data = Buffer.from(address.data);
    else if (address instanceof Uint8Array) {
      if (address.length !== 16) throw new RangeError('IPv6 needs 16 bytes');
      this.data = Buffer.from(address);
    } else if (b !== undefined) {
      this.data = Buffer.from([ uint(address, 255), uint(b, 255),
        uint(c!, 255), uint(d!, 255) ]);
    } else {
      this.data = Buffer.alloc(4);
      this.data.writeUInt32BE(uint(address));
    }
  }
  /**
   * Parse an IP literal; do not resolve domain names or accept IPv6 zone IDs.
   * Return undefined for invalid formats.
   * @zh 解析 IP 字面量；不解析域名、不接受 IPv6 区域标识，格式错误返回 undefined。
   * @ja IP リテラルを解析します。ドメイン名の解決や IPv6 ゾーン ID の受け入れは
   * 行わず、形式が不正な場合は undefined を返します。
   * @ko IP 리터럴을 파싱합니다. 도메인 이름을 확인하거나 IPv6 영역 ID를
   * 허용하지 않으며, 형식이 잘못되면 undefined를 반환합니다.
   */
  static fromString(address: string): IpAddress | undefined {
    if (typeof address !== 'string') throw new TypeError('Expected an IP string');
    // SFML inet_pton rejects zone identifiers and non-canonical IPv4 forms.
    const family = address.includes('%') ? 0 : isIP(address);
    if (!family) return undefined;
    // ipaddr.js normalizes ::a.b.c.d into ::ffff:a.b.c.d. SFML retains the
    // original 128 bits, so expand the dotted suffix before parsing IPv6.
    const normalized = family === 6
      ? address.replace(/(?:\d+\.){3}\d+$/, suffix => {
        const octets = suffix.split('.').map(Number);
        return (octets[0] * 256 + octets[1]).toString(16) + ':' +
          (octets[2] * 256 + octets[3]).toString(16);
      }) : address;
    const data = Buffer.from(ipaddr.parse(normalized).toByteArray());
    return family === 4 ? new IpAddress(data.readUInt32BE())
      : new IpAddress(data);
  }
  /**
   * Resolve a hostname asynchronously to its first IPv4 address.
   * Return IP literals directly, or undefined on failure.
   * @zh 异步解析主机名为首个 IPv4 地址；IP 字面量直接返回，失败为 undefined。
   * @ja ホスト名を非同期に最初の IPv4 アドレスへ解決します。
   * IP リテラルはそのまま返し、失敗時は undefined を返します。
   * @ko 호스트 이름을 비동기로 첫 번째 IPv4 주소로 확인합니다.
   * IP 리터럴은 바로 반환하며, 실패 시 undefined를 반환합니다.
   */
  static async resolve(hostname: string): Promise<IpAddress | undefined> {
    const literal = this.fromString(hostname);
    if (literal) return literal;
    const { resolve } = await import('./dns');
    return (await resolve(hostname))?.find(address => address.isV4());
  }
  /**
   * Query the local outbound address for the given family using system routing;
   * return undefined on failure.
   * @zh 按系统路由查询指定地址族的本地出口地址，失败返回 undefined。
   * @ja システムの経路に基づき指定ファミリーのローカル送信アドレスを照会し、
   * 失敗時は undefined を返します。
   * @ko 시스템 라우팅으로 지정한 주소 계열의 로컬 송신 주소를 조회하며,
   * 실패 시 undefined를 반환합니다.
   */
  static async getLocalAddress(type = IpAddressType.IpV4):
  Promise<IpAddress | undefined> {
    uint(type, 1);
    return new Promise(resolve => {
      const socket = createSocket(type === IpAddressType.IpV4 ? 'udp4' : 'udp6');
      const finish = (address?: IpAddress) => {
        socket.close();
        resolve(address);
      };
      socket.once('error', () => finish());
      socket.connect(9, type === IpAddressType.IpV4 ? '1.1.1.1' : '2a00::1',
        () => finish(IpAddress.fromString(socket.address().address)));
    });
  }
  /**
   * Query the public address asynchronously via external DNS/HTTP services.
   * secure selects HTTPS; return undefined on failure.
   * @zh 通过外部 DNS/HTTP 服务异步查询公网地址；secure 使用 HTTPS，
   * 失败返回 undefined。
   * @ja 外部 DNS/HTTP サービスで公開アドレスを非同期に照会します。
   * secure は HTTPS を使用し、失敗時は undefined を返します。
   * @ko 외부 DNS/HTTP 서비스로 공인 주소를 비동기로 조회합니다.
   * secure는 HTTPS를 사용하며, 실패 시 undefined를 반환합니다.
   */
  static async getPublicAddress(timeout: NetworkTime = Time.Zero,
    type: IpAddressType | undefined = IpAddressType.IpV4, secure = false):
    Promise<IpAddress | undefined> {
    if (type !== undefined) uint(type, 1);
    if (!secure) {
      const dns = await import('./dns');
      for (const family of type === undefined
        ? [ IpAddressType.IpV6, IpAddressType.IpV4 ] : [ type ]) {
        const address = await dns.getPublicAddress(timeout, family);
        if (address) return address;
      }
    }
    const { Http } = await import('./http');
    for (const host of [ 'ifconfig.co', 'ifconfig.me', 'icanhazip.com' ]) {
      const client = new Http(`${secure ? 'https' : 'http'}://${host}`, 0, type);
      const response = await client.sendRequest(new Http.Request('/ip'),
        timeout, secure);
      if (response.getStatus() !== 200) continue;
      const address = this.fromString(response.getBody().trim());
      if (address && (type === undefined || address.getType() === type)) {
        return address;
      }
    }
    return undefined;
  }
  /**
   * Return dotted-decimal IPv4 or compressed IPv6 text.
   * @zh 返回 IPv4 点分十进制或压缩 IPv6 文本表示。
   * @ja IPv4 のドット区切り 10 進表記または IPv6 の圧縮表記を返します。
   * @ko 점으로 구분한 십진수 IPv4 또는 압축된 IPv6 텍스트를 반환합니다.
   */
  toString(): string {
    if (this.isV4()) return [ ...this.data ].join('.');
    const compatible = this.data.subarray(0, 12).every(byte => byte === 0);
    const mapped = this.data.subarray(0, 10).every(byte => byte === 0) &&
      this.data[10] === 255 && this.data[11] === 255;
    if (mapped || (compatible && (this.data[12] || this.data[13]))) {
      return (mapped ? '::ffff:' : '::') + [ ...this.data.subarray(12) ].join('.');
    }
    return ipaddr.fromByteArray([ ...this.data ]).toString();
  }
  /**
   * Return the IPv4 network-order unsigned 32-bit integer;
   * throw TypeError for IPv6 addresses.
   * @zh 返回 IPv4 网络序无符号 32 位整数；IPv6 地址抛出 TypeError。
   * @ja IPv4 をネットワーク順の符号なし 32 ビット整数で返します。
   * IPv6 アドレスでは TypeError をスローします。
   * @ko IPv4를 네트워크 바이트 순서의 부호 없는 32비트 정수로 반환합니다.
   * IPv6 주소이면 TypeError를 던집니다.
   */
  toInteger(): number {
    if (!this.isV4()) throw new TypeError('Expected an IPv4 address');
    return this.data.readUInt32BE();
  }
  /**
   * Return a 16-byte copy of IPv6 data; throw TypeError for IPv4 addresses.
   * @zh 返回 IPv6 的 16 字节副本；IPv4 地址抛出 TypeError。
   * @ja IPv6 の 16 バイトのコピーを返し、IPv4 アドレスでは TypeError を
   * スローします。
   * @ko IPv6 데이터의 16바이트 복사본을 반환하며,
   * IPv4 주소이면 TypeError를 던집니다.
   */
  toBytes(): Uint8Array {
    if (!this.isV6()) throw new TypeError('Expected an IPv6 address');
    return Uint8Array.from(this.data);
  }
  /**
   * Return the address family.
   * @zh 返回地址族。
   * @ja アドレスファミリーを返します。
   * @ko 주소 계열을 반환합니다.
   */
  getType(): IpAddressType {
    return this.isV4() ? IpAddressType.IpV4 : IpAddressType.IpV6;
  }
  /**
   * Return whether this is an IPv4 address.
   * @zh 返回是否为 IPv4 地址。
   * @ja IPv4 アドレスかどうかを返します。
   * @ko IPv4 주소인지 반환합니다.
   */
  isV4(): boolean { return this.data.length === 4; }
  /**
   * Return whether this is an IPv6 address.
   * @zh 返回是否为 IPv6 地址。
   * @ja IPv6 アドレスかどうかを返します。
   * @ko IPv6 주소인지 반환합니다.
   */
  isV6(): boolean { return this.data.length === 16; }
  /**
   * Compare by address family then address bytes;
   * return a negative number, zero, or a positive number.
   * @zh 按地址族、地址字节排序比较，返回负数、零或正数。
   * @ja アドレスファミリー、アドレスバイトの順に比較し、
   * 負数、ゼロ、正数のいずれかを返します。
   * @ko 주소 계열, 주소 바이트 순서로 비교하며 음수, 0 또는 양수를 반환합니다.
   */
  compare(other: IpAddress): number {
    if (!(other instanceof IpAddress)) throw new TypeError('Expected IpAddress');
    return this.data.length - other.data.length ||
      Buffer.compare(this.data, other.data);
  }
  /**
   * IPv4 wildcard interface address 0.0.0.0.
   * @zh IPv4 任意接口地址 0.0.0.0。
   * @ja IPv4 の任意のインターフェースを表すアドレス 0.0.0.0。
   * @ko IPv4의 모든 인터페이스를 나타내는 주소 0.0.0.0.
   */
  static readonly AnyV4 = Object.freeze(new IpAddress(0)) as IpAddress;
  /**
   * IPv4 loopback address 127.0.0.1.
   * @zh IPv4 回环地址 127.0.0.1。
   * @ja IPv4 のループバックアドレス 127.0.0.1。
   * @ko IPv4 루프백 주소 127.0.0.1.
   */
  static readonly LocalHostV4 = Object.freeze(new IpAddress(127, 0, 0, 1)) as IpAddress;
  /**
   * IPv4 broadcast address 255.255.255.255.
   * @zh IPv4 广播地址 255.255.255.255。
   * @ja IPv4 のブロードキャストアドレス 255.255.255.255。
   * @ko IPv4 브로드캐스트 주소 255.255.255.255.
   */
  static readonly BroadcastV4 = Object.freeze(new IpAddress(0xffffffff)) as IpAddress;
  /**
   * IPv6 wildcard interface address ::.
   * @zh IPv6 任意接口地址 ::。
   * @ja IPv6 の任意のインターフェースを表すアドレス ::。
   * @ko IPv6의 모든 인터페이스를 나타내는 주소 ::.
   */
  static readonly AnyV6 = Object.freeze(new IpAddress(new Uint8Array(16))) as IpAddress;
  /**
   * IPv6 loopback address ::1.
   * @zh IPv6 回环地址 ::1。
   * @ja IPv6 のループバックアドレス ::1。
   * @ko IPv6 루프백 주소 ::1.
   */
  static readonly LocalHostV6 = Object.freeze(new IpAddress(
    Uint8Array.from({ length: 16 }, (_, i) => +(i === 15)))) as IpAddress;
  /**
   * Compatibility alias for AnyV4.
   * @zh AnyV4 的兼容别名。
   * @ja AnyV4 の互換エイリアス。
   * @ko AnyV4의 호환 별칭.
   */
  static readonly Any = IpAddress.AnyV4;
  /**
   * Compatibility alias for LocalHostV4.
   * @zh LocalHostV4 的兼容别名。
   * @ja LocalHostV4 の互換エイリアス。
   * @ko LocalHostV4의 호환 별칭.
   */
  static readonly LocalHost = IpAddress.LocalHostV4;
  /**
   * Compatibility alias for BroadcastV4.
   * @zh BroadcastV4 的兼容别名。
   * @ja BroadcastV4 の互換エイリアス。
   * @ko BroadcastV4의 호환 별칭.
   */
  static readonly Broadcast = IpAddress.BroadcastV4;
}
