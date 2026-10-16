import { isIP } from 'node:net';
import { createSocket } from 'node:dgram';
import * as ipaddr from 'ipaddr.js';
import { Time } from '../system/time';
import { uint, type NetworkTime } from './common';

/** IP 地址族。 */
export enum IpAddressType {
  /** 32 位 IPv4 地址。 */
  IpV4,
  /** 128 位 IPv6 地址。 */
  IpV6,
}

/** 不可变 IP 地址值，支持 IPv4 和 IPv6。 */
export class IpAddress {
  /** 地址族枚举。 */
  static readonly Type = IpAddressType;
  /** 4 或 16 字节的不可变地址数据。 */
  private readonly data: Buffer;

  /** 从 IPv4 网络序整数、16 字节 IPv6 数据或现有地址副本创建。 */
  constructor(address: number | Uint8Array | IpAddress);
  /** 从四个 0～255 的十进制八位组创建 IPv4 地址。 */
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
  /** 解析 IP 字面量；不解析域名、不接受 IPv6 区域标识，格式错误返回 undefined。 */
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
  /** 异步解析主机名为首个 IPv4 地址；IP 字面量直接返回，失败为 undefined。 */
  static async resolve(hostname: string): Promise<IpAddress | undefined> {
    const literal = this.fromString(hostname);
    if (literal) return literal;
    const { resolve } = await import('./dns');
    return (await resolve(hostname))?.find(address => address.isV4());
  }
  /** 按系统路由查询指定地址族的本地出口地址，失败返回 undefined。 */
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
  /** 通过外部 DNS/HTTP 服务异步查询公网地址；secure 使用 HTTPS，失败返回 undefined。 */
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
  /** 返回 IPv4 点分十进制或压缩 IPv6 文本表示。 */
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
  /** 返回 IPv4 网络序无符号 32 位整数；IPv6 地址抛出 TypeError。 */
  toInteger(): number {
    if (!this.isV4()) throw new TypeError('Expected an IPv4 address');
    return this.data.readUInt32BE();
  }
  /** 返回 IPv6 的 16 字节副本；IPv4 地址抛出 TypeError。 */
  toBytes(): Uint8Array {
    if (!this.isV6()) throw new TypeError('Expected an IPv6 address');
    return Uint8Array.from(this.data);
  }
  /** 返回地址族。 */
  getType(): IpAddressType {
    return this.isV4() ? IpAddressType.IpV4 : IpAddressType.IpV6;
  }
  /** 返回是否为 IPv4 地址。 */
  isV4(): boolean { return this.data.length === 4; }
  /** 返回是否为 IPv6 地址。 */
  isV6(): boolean { return this.data.length === 16; }
  /** 按地址族、地址字节排序比较，返回负数、零或正数。 */
  compare(other: IpAddress): number {
    if (!(other instanceof IpAddress)) throw new TypeError('Expected IpAddress');
    return this.data.length - other.data.length ||
      Buffer.compare(this.data, other.data);
  }
  /** IPv4 任意接口地址 0.0.0.0。 */
  static readonly AnyV4 = Object.freeze(new IpAddress(0)) as IpAddress;
  /** IPv4 回环地址 127.0.0.1。 */
  static readonly LocalHostV4 = Object.freeze(new IpAddress(127, 0, 0, 1)) as IpAddress;
  /** IPv4 广播地址 255.255.255.255。 */
  static readonly BroadcastV4 = Object.freeze(new IpAddress(0xffffffff)) as IpAddress;
  /** IPv6 任意接口地址 ::。 */
  static readonly AnyV6 = Object.freeze(new IpAddress(new Uint8Array(16))) as IpAddress;
  /** IPv6 回环地址 ::1。 */
  static readonly LocalHostV6 = Object.freeze(new IpAddress(
    Uint8Array.from({ length: 16 }, (_, i) => +(i === 15)))) as IpAddress;
  /** AnyV4 的兼容别名。 */
  static readonly Any = IpAddress.AnyV4;
  /** LocalHostV4 的兼容别名。 */
  static readonly LocalHost = IpAddress.LocalHostV4;
  /** BroadcastV4 的兼容别名。 */
  static readonly Broadcast = IpAddress.BroadcastV4;
}
