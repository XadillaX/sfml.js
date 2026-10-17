import { endianness } from 'node:os';
import { bytes, uint } from './common';

/**
 * Packet encodings and their JS values; multibyte integers use network order.
 * @zh Packet 编码类型及对应 JS 值；多字节整数采用网络字节序。
 * @ja Packet の符号化型と対応する JS 値。複数バイト整数はネットワーク順です。
 * @ko Packet 인코딩 타입과 해당 JS 값. 멀티바이트 정수는 네트워크 순서입니다.
 */
export interface PacketValues {
  /**
   * Single-byte boolean.
   * @zh 单字节布尔值。
   * @ja 1 バイトの真偽値。
   * @ko 단일 바이트 불리언.
   */
  bool: boolean;
  /**
   * Signed 8-bit integer.
   * @zh 有符号 8 位整数。
   * @ja 符号付き 8 ビット整数。
   * @ko 부호 있는 8비트 정수.
   */
  i8: number;
  /**
   * Unsigned 8-bit integer.
   * @zh 无符号 8 位整数。
   * @ja 符号なし 8 ビット整数。
   * @ko 부호 없는 8비트 정수.
   */
  u8: number;
  /**
   * Signed 16-bit integer.
   * @zh 有符号 16 位整数。
   * @ja 符号付き 16 ビット整数。
   * @ko 부호 있는 16비트 정수.
   */
  i16: number;
  /**
   * Unsigned 16-bit integer.
   * @zh 无符号 16 位整数。
   * @ja 符号なし 16 ビット整数。
   * @ko 부호 없는 16비트 정수.
   */
  u16: number;
  /**
   * Signed 32-bit integer.
   * @zh 有符号 32 位整数。
   * @ja 符号付き 32 ビット整数。
   * @ko 부호 있는 32비트 정수.
   */
  i32: number;
  /**
   * Unsigned 32-bit integer.
   * @zh 无符号 32 位整数。
   * @ja 符号なし 32 ビット整数。
   * @ko 부호 없는 32비트 정수.
   */
  u32: number;
  /**
   * Signed 64-bit integer.
   * @zh 有符号 64 位整数。
   * @ja 符号付き 64 ビット整数。
   * @ko 부호 있는 64비트 정수.
   */
  i64: bigint;
  /**
   * Unsigned 64-bit integer.
   * @zh 无符号 64 位整数。
   * @ja 符号なし 64 ビット整数。
   * @ko 부호 없는 64비트 정수.
   */
  u64: bigint;
  /**
   * IEEE 754 single-precision float in host byte order.
   * @zh 主机字节序的 IEEE 754 单精度浮点数。
   * @ja ホストバイト順の IEEE 754 単精度浮動小数点数。
   * @ko 호스트 바이트 순서의 IEEE 754 단정밀도 부동소수점 수.
   */
  f32: number;
  /**
   * IEEE 754 double-precision float in host byte order.
   * @zh 主机字节序的 IEEE 754 双精度浮点数。
   * @ja ホストバイト順の IEEE 754 倍精度浮動小数点数。
   * @ko 호스트 바이트 순서의 IEEE 754 배정밀도 부동소수점 수.
   */
  f64: number;
  /**
   * SFML String: a u32 code point count followed by network-order UTF-32
   * code points.
   * @zh SFML String：u32 码点数后跟网络序 UTF-32 码点。
   * @ja SFML String: u32 のコードポイント数に続くネットワーク順の
   * UTF-32 コードポイント。
   * @ko SFML String: u32 코드 포인트 수 뒤에 네트워크 순서의 UTF-32
   * 코드 포인트가 이어집니다.
   */
  string: string;
  /**
   * std::string-compatible format: a u32 byte length followed by UTF-8 bytes.
   * @zh std::string 对齐格式：u32 字节长度后跟 UTF-8 字节。
   * @ja std::string 互換形式: u32 のバイト長に続く UTF-8 バイト列。
   * @ko std::string 호환 형식: u32 바이트 길이 뒤에 UTF-8 바이트가 이어집니다.
   */
  utf8: string;
  /**
   * A u32 byte length followed by raw bytes.
   * @zh u32 字节长度后跟原始字节。
   * @ja u32 のバイト長に続く生バイト列。
   * @ko u32 바이트 길이 뒤에 원시 바이트가 이어집니다.
   */
  bytes: Uint8Array;
}
/**
 * Encoding type names accepted by Packet.write/read.
 * @zh Packet.write/read 接受的编码类型名称。
 * @ja Packet.write/read が受け付ける符号化型名。
 * @ko Packet.write/read가 허용하는 인코딩 타입 이름.
 */
export type PacketType = keyof PacketValues;
export const packetSend: unique symbol = Symbol('Packet.send');
export const packetReceive: unique symbol = Symbol('Packet.receive');
const littleEndian = endianness() === 'LE';
const sizes = {
  bool: 1, i8: 1, u8: 1, i16: 2, u16: 2, i32: 4, u32: 4,
  i64: 8, u64: 8, f32: 4, f64: 8,
} as const;

/**
 * Integers use network order; SFML floats use host order.
 * @zh 整数使用网络字节序；SFML 浮点数使用主机字节序。
 * @ja 整数はネットワーク順、SFML の浮動小数点数はホスト順を使用します。
 * @ko 정수는 네트워크 순서를, SFML 부동소수점 수는 호스트 순서를 사용합니다.
 */
export class Packet {
  /** 包内容字节存储。 */
  private data = Buffer.alloc(0);
  /** 有效内容长度。 */
  private length = 0;
  /** 当前读取位置。 */
  private position = 0;
  /** 读取是否尚未越界。 */
  private valid = true;

  /**
   * Create an empty packet or copy packet contents, read position,
   * and validity state.
   * @zh 创建空包，或复制包内容、读取位置及有效状态。
   * @ja 空のパケットを作成するか、内容、読み取り位置、有効状態をコピーします。
   * @ko 빈 패킷을 생성하거나 패킷 내용, 읽기 위치 및 유효 상태를 복사합니다.
   */
  constructor(source?: Packet) {
    if (source !== undefined) {
      if (!(source instanceof Packet)) throw new TypeError('Expected a Packet');
      this.append(source.data.subarray(0, source.length));
      this.position = source.position;
      this.valid = source.valid;
    }
  }
  /**
   * Append a copy of the bytes directly, without a length prefix.
   * @zh 直接追加字节副本，不添加长度前缀。
   * @ja 長さプレフィックスを付けずにバイトのコピーを直接追加します。
   * @ko 길이 접두사 없이 바이트 복사본을 바로 추가합니다.
   */
  append(data: Uint8Array): void {
    const input = bytes(data);
    this.reserve(input.length);
    input.copy(this.data, this.length);
    this.length += input.length;
  }
  /**
   * Clear contents, read position, and error state;
   * old getData views retain the old storage.
   * @zh 清空内容、读取位置和错误状态；旧 getData 视图保留旧存储。
   * @ja 内容、読み取り位置、エラー状態を消去します。
   * 古い getData ビューは古いストレージを保持します。
   * @ko 내용, 읽기 위치 및 오류 상태를 초기화합니다.
   * 이전 getData 뷰는 이전 저장소를 유지합니다.
   */
  clear(): void {
    // Old public views keep their allocation and cannot observe later writes.
    this.data = Buffer.alloc(0);
    this.length = 0;
    this.position = 0;
    this.valid = true;
  }
  /**
   * Return a shared byte view of current contents, or undefined for an empty
   * packet; obtain a new view after capacity grows.
   * @zh 返回当前内容的共享字节视图；空包返回 undefined，扩容后需重新获取。
   * @ja 現在の内容の共有バイトビューを返します。空のパケットなら undefined です。
   * 容量の拡張後は再取得が必要です。
   * @ko 현재 내용의 공유 바이트 뷰를 반환하며 빈 패킷이면 undefined입니다.
   * 용량 확장 후에는 다시 가져와야 합니다.
   */
  getData(): Uint8Array | undefined {
    return this.length ? this.data.subarray(0, this.length) : undefined;
  }
  /**
   * Return the current read position in bytes.
   * @zh 返回当前读取位置，单位为字节。
   * @ja 現在の読み取り位置をバイト単位で返します。
   * @ko 현재 읽기 위치를 바이트 단위로 반환합니다.
   */
  getReadPosition(): number { return this.position; }
  /**
   * Return the number of content bytes.
   * @zh 返回有效内容的字节数。
   * @ja 有効な内容のバイト数を返します。
   * @ko 유효한 내용의 바이트 수를 반환합니다.
   */
  getDataSize(): number { return this.length; }
  /**
   * Return whether the read position has reached the end.
   * @zh 返回读取位置是否已到末尾。
   * @ja 読み取り位置が末尾に到達したかどうかを返します。
   * @ko 읽기 위치가 끝에 도달했는지 반환합니다.
   */
  endOfPacket(): boolean { return this.position >= this.length; }
  /**
   * Return whether no out-of-bounds read has occurred; after one occurs,
   * use clear or receive a new packet to recover.
   * @zh 返回是否尚未发生读取越界；越界后需 clear 或接收新包恢复。
   * @ja 範囲外の読み取りがまだ発生していないかどうかを返します。
   * 発生後は clear または新しいパケットの受信で復旧してください。
   * @ko 범위를 벗어난 읽기가 아직 발생하지 않았는지 반환합니다.
   * 발생 후에는 clear 또는 새 패킷 수신으로 복구해야 합니다.
   */
  isValid(): boolean { return this.valid; }
  /**
   * Encode and append a value according to type, returning this;
   * string uses SFML UTF-32, while utf8 uses a byte string.
   * @zh 按 type 编码并追加值，返回 this；string 使用 SFML UTF-32，
   * utf8 使用字节字符串。
   * @ja type に従って値を符号化して追加し、this を返します。
   * string は SFML UTF-32、utf8 はバイト文字列を使用します。
   * @ko type에 따라 값을 인코딩하여 추가하고 this를 반환합니다.
   * string은 SFML UTF-32를, utf8은 바이트 문자열을 사용합니다.
   */
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
  /**
   * Decode according to type and advance the position; if data is insufficient,
   * return undefined and mark the packet invalid.
   * @zh 按 type 解码并推进位置；数据不足返回 undefined 并将包标记为无效。
   * @ja type に従って復号し、位置を進めます。データが不足している場合は
   * undefined を返し、パケットを無効にします。
   * @ko type에 따라 디코딩하고 위치를 이동합니다. 데이터가 부족하면
   * undefined를 반환하고 패킷을 무효로 표시합니다.
   */
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
  /**
   * Subclasses may override the pre-send data transformation;
   * the socket copies the returned bytes when send is called.
   * @zh 子类可重写发送前的数据转换；返回的字节由套接字在 send 调用时复制。
   * @ja サブクラスは送信前のデータ変換を上書きできます。
   * 返されたバイトは send 呼び出し時にソケットがコピーします。
   * @ko 하위 클래스는 송신 전 데이터 변환을 재정의할 수 있습니다.
   * 반환된 바이트는 send 호출 시 소켓이 복사합니다.
   */
  protected onSend(): Uint8Array {
    return this.data.subarray(0, this.length);
  }
  /**
   * Subclasses may override the post-receive data transformation; the packet is
   * cleared before the call, and the default appends the original contents.
   * @zh 子类可重写接收后的数据转换；调用前包已清空，默认追加原始内容。
   * @ja サブクラスは受信後のデータ変換を上書きできます。
   * 呼び出し前にパケットを消去し、既定では元の内容を追加します。
   * @ko 하위 클래스는 수신 후 데이터 변환을 재정의할 수 있습니다.
   * 호출 전에 패킷을 비우며 기본적으로 원래 내용을 추가합니다.
   */
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
