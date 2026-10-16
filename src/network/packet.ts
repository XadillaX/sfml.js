import { endianness } from 'node:os';
import { bytes, uint } from './common';

/** Packet 编码类型及对应 JS 值；多字节整数采用网络字节序。 */
export interface PacketValues {
  /** 单字节布尔值。 */
  bool: boolean;
  /** 有符号 8 位整数。 */
  i8: number;
  /** 无符号 8 位整数。 */
  u8: number;
  /** 有符号 16 位整数。 */
  i16: number;
  /** 无符号 16 位整数。 */
  u16: number;
  /** 有符号 32 位整数。 */
  i32: number;
  /** 无符号 32 位整数。 */
  u32: number;
  /** 有符号 64 位整数。 */
  i64: bigint;
  /** 无符号 64 位整数。 */
  u64: bigint;
  /** 主机字节序的 IEEE 754 单精度浮点数。 */
  f32: number;
  /** 主机字节序的 IEEE 754 双精度浮点数。 */
  f64: number;
  /** SFML String：u32 码点数后跟网络序 UTF-32 码点。 */
  string: string;
  /** std::string 对齐格式：u32 字节长度后跟 UTF-8 字节。 */
  utf8: string;
  /** u32 字节长度后跟原始字节。 */
  bytes: Uint8Array;
}
/** Packet.write/read 接受的编码类型名称。 */
export type PacketType = keyof PacketValues;
export const packetSend: unique symbol = Symbol('Packet.send');
export const packetReceive: unique symbol = Symbol('Packet.receive');
const littleEndian = endianness() === 'LE';
const sizes = {
  bool: 1, i8: 1, u8: 1, i16: 2, u16: 2, i32: 4, u32: 4,
  i64: 8, u64: 8, f32: 4, f64: 8,
} as const;

/** Integers use network order; SFML floats use host order. */
export class Packet {
  /** 包内容字节存储。 */
  private data = Buffer.alloc(0);
  /** 有效内容长度。 */
  private length = 0;
  /** 当前读取位置。 */
  private position = 0;
  /** 读取是否尚未越界。 */
  private valid = true;

  /** 创建空包，或复制包内容、读取位置及有效状态。 */
  constructor(source?: Packet) {
    if (source !== undefined) {
      if (!(source instanceof Packet)) throw new TypeError('Expected a Packet');
      this.append(source.data.subarray(0, source.length));
      this.position = source.position;
      this.valid = source.valid;
    }
  }
  /** 直接追加字节副本，不添加长度前缀。 */
  append(data: Uint8Array): void {
    const input = bytes(data);
    this.reserve(input.length);
    input.copy(this.data, this.length);
    this.length += input.length;
  }
  /** 清空内容、读取位置和错误状态；旧 getData 视图保留旧存储。 */
  clear(): void {
    // Old public views keep their allocation and cannot observe later writes.
    this.data = Buffer.alloc(0);
    this.length = 0;
    this.position = 0;
    this.valid = true;
  }
  /** 返回当前内容的共享字节视图；空包返回 undefined，扩容后需重新获取。 */
  getData(): Uint8Array | undefined {
    return this.length ? this.data.subarray(0, this.length) : undefined;
  }
  /** 返回当前读取位置，单位为字节。 */
  getReadPosition(): number { return this.position; }
  /** 返回有效内容的字节数。 */
  getDataSize(): number { return this.length; }
  /** 返回读取位置是否已到末尾。 */
  endOfPacket(): boolean { return this.position >= this.length; }
  /** 返回是否尚未发生读取越界；越界后需 clear 或接收新包恢复。 */
  isValid(): boolean { return this.valid; }
  /** 按 type 编码并追加值，返回 this；string 使用 SFML UTF-32，utf8 使用字节字符串。 */
  write<T extends PacketType>(type: T, value: PacketValues[T]): this {
    if (type === 'bytes') {
      const input = bytes(value as Uint8Array);
      this.write('u32', input.length);
      this.append(input);
      return this;
    }
    if (type === 'string' || type === 'utf8') {
      if (typeof value !== 'string') throw new TypeError('Expected a string');
      if (type === 'utf8') {
        const encoded = Buffer.from(value, 'utf8');
        this.write('u32', encoded.length);
        this.append(encoded);
      } else {
        const points = Array.from(value, c => c.codePointAt(0)!);
        this.write('u32', points.length);
        for (const point of points) this.write('u32', point);
      }
      return this;
    }
    const count = sizes[type as keyof typeof sizes];
    if (!count) throw new TypeError('Unknown packet scalar type');
    this.reserve(count);
    const view = new DataView(this.data.buffer,
      this.data.byteOffset + this.length, count);
    if (type === 'bool') {
      if (typeof value !== 'boolean') throw new TypeError('Expected a boolean');
      view.setUint8(0, +value);
    } else if (type === 'i64' || type === 'u64') {
      if (typeof value !== 'bigint') throw new TypeError('Expected a bigint');
      if (type === 'i64') view.setBigInt64(0, value);
      else view.setBigUint64(0, value);
    } else {
      if (typeof value !== 'number') throw new TypeError('Expected a number');
      switch (type) {
        case 'i8': view.setInt8(0, value); break;
        case 'u8': view.setUint8(0, value); break;
        case 'i16': view.setInt16(0, value); break;
        case 'u16': view.setUint16(0, value); break;
        case 'i32': view.setInt32(0, value); break;
        case 'u32': view.setUint32(0, value); break;
        case 'f32': view.setFloat32(0, value, littleEndian); break;
        case 'f64': view.setFloat64(0, value, littleEndian); break;
        default: throw new TypeError('Unknown packet scalar type');
      }
    }
    this.length += count;
    return this;
  }
  /** 按 type 解码并推进位置；数据不足返回 undefined 并将包标记为无效。 */
  read<T extends PacketType>(type: T): PacketValues[T] | undefined {
    if (type === 'bytes') {
      const length = this.read('u32');
      if (length === undefined || !this.check(length)) return undefined;
      const output = Uint8Array.from(this.data.subarray(this.position,
        this.position + length));
      this.position += length;
      return output as PacketValues[T];
    }
    if (type === 'string' || type === 'utf8') {
      const length = this.read('u32');
      if (length === undefined) return undefined;
      const count = length * (type === 'string' ? 4 : 1);
      if (!this.check(count)) return undefined;
      let result = '';
      if (type === 'utf8') {
        result = this.data.toString('utf8', this.position, this.position + count);
      } else {
        for (let i = 0; i < count; i += 4) {
          const point = this.data.readUInt32BE(this.position + i);
          result += String.fromCodePoint(point <= 0x10ffff ? point : 0xfffd);
        }
      }
      this.position += count;
      return result as PacketValues[T];
    }
    const count = sizes[type as keyof typeof sizes];
    if (!count) throw new TypeError('Unknown packet scalar type');
    if (!this.check(count)) return undefined;
    const view = new DataView(this.data.buffer,
      this.data.byteOffset + this.position, count);
    let value: number | bigint | boolean;
    switch (type) {
      case 'bool': value = view.getUint8(0) !== 0; break;
      case 'i8': value = view.getInt8(0); break;
      case 'u8': value = view.getUint8(0); break;
      case 'i16': value = view.getInt16(0); break;
      case 'u16': value = view.getUint16(0); break;
      case 'i32': value = view.getInt32(0); break;
      case 'u32': value = view.getUint32(0); break;
      case 'i64': value = view.getBigInt64(0); break;
      case 'u64': value = view.getBigUint64(0); break;
      case 'f32': value = view.getFloat32(0, littleEndian); break;
      case 'f64': value = view.getFloat64(0, littleEndian); break;
      default: throw new TypeError('Unknown packet scalar type');
    }
    this.position += count;
    return value as PacketValues[T];
  }
  /** 子类可重写发送前的数据转换；返回的字节由套接字在 send 调用时复制。 */
  protected onSend(): Uint8Array {
    return this.data.subarray(0, this.length);
  }
  /** 子类可重写接收后的数据转换；调用前包已清空，默认追加原始内容。 */
  protected onReceive(data: Uint8Array): void { this.append(data); }
  [packetSend](): Buffer { return bytes(this.onSend()); }
  [packetReceive](data: Uint8Array): void {
    this.clear();
    this.onReceive(data);
  }
  /** 校验 count 字节是否可读，不可读时标记无效。 */
  private check(count: number): boolean {
    this.valid = this.valid && count <= this.length - this.position;
    return this.valid;
  }
  /** 确保存储至少容纳当前长度加 count 字节。 */
  private reserve(count: number): void {
    const required = uint(this.length + count, 0x7fffffff);
    if (required <= this.data.length) return;
    const next = Buffer.allocUnsafe(Math.max(required,
      Math.min(0x7fffffff, Math.max(64, this.data.length * 2))));
    this.data.copy(next, 0, 0, this.length);
    this.data = next;
  }
}
