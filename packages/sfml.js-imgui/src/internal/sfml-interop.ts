import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { Window } from 'sfml.js';

// sfml.js native handle object; the concrete type is sfml.js's SharedHandle.
export type SfmlNativeHandle = object;

interface NativeStructMapping {
  readonly buffers: ArrayBuffer[];
  readonly fields: Record<string, readonly [string, number, number]>;
}

type NativeStructFactory = <T extends object>(
  mapping: NativeStructMapping,
  extra?: Partial<T>,
) => Readonly<T>;

type FieldType =
  | 'i8'
  | 'u8'
  | 'i16'
  | 'u16'
  | 'bool'
  | 'i32'
  | 'u32'
  | 'f32'
  | 'f64'
  | 'i64'
  | 'u64'
  | 'size64';

const littleEndian = new Uint8Array(new Uint32Array([ 1 ]).buffer)[0] === 1;

const readers: Record<
FieldType,
(view: DataView, offset: number) => unknown
> = {
  i8: (view, offset) => view.getInt8(offset),
  u8: (view, offset) => view.getUint8(offset),
  i16: (view, offset) => view.getInt16(offset, littleEndian),
  u16: (view, offset) => view.getUint16(offset, littleEndian),
  i32: (view, offset) => view.getInt32(offset, littleEndian),
  bool: (view, offset) => view.getUint8(offset) !== 0,
  u32: (view, offset) => view.getUint32(offset, littleEndian),
  f32: (view, offset) => view.getFloat32(offset, littleEndian),
  f64: (view, offset) => view.getFloat64(offset, littleEndian),
  i64: (view, offset) => view.getBigInt64(offset, littleEndian),
  u64: (view, offset) => view.getBigUint64(offset, littleEndian),
  size64: (view, offset) => Number(view.getBigUint64(offset, littleEndian)),
};

const writers: Record<
FieldType,
(view: DataView, offset: number, value: unknown) => void
> = {
  i8: (view, offset, value) => view.setInt8(offset, Number(value)),
  u8: (view, offset, value) => view.setUint8(offset, Number(value)),
  i16: (view, offset, value) =>
    view.setInt16(offset, Number(value), littleEndian),
  u16: (view, offset, value) =>
    view.setUint16(offset, Number(value), littleEndian),
  i32: (view, offset, value) =>
    view.setInt32(offset, Number(value), littleEndian),
  bool: (view, offset, value) => view.setUint8(offset, value ? 1 : 0),
  u32: (view, offset, value) =>
    view.setUint32(offset, Number(value), littleEndian),
  f32: (view, offset, value) =>
    view.setFloat32(offset, Number(value), littleEndian),
  f64: (view, offset, value) =>
    view.setFloat64(offset, Number(value), littleEndian),
  i64: (view, offset, value) =>
    view.setBigInt64(
      offset,
      BigInt(value as bigint | number),
      littleEndian,
    ),
  u64: (view, offset, value) =>
    view.setBigUint64(
      offset,
      BigInt(value as bigint | number),
      littleEndian,
    ),
  size64: (view, offset, value) =>
    view.setBigUint64(
      offset,
      BigInt(value as bigint | number),
      littleEndian,
    ),
};

const requireHere = createRequire(__filename);

// Resolve sfml.js through normal module resolution so both packages share the
// same Symbol instances and helpers.
const entry = requireHere.resolve('sfml.js');
const packageRoot = dirname(dirname(entry));

const graphics = requireHere(
  join(packageRoot, 'dist/internal/graphics-state.js'),
) as { graphicsNative: symbol };
const structure = requireHere(
  join(packageRoot, 'dist/internal/struct-view.js'),
) as { nativeStruct: NativeStructFactory };

// Read a native-owned readonly struct view; field offsets come from native.
export const nativeStruct = structure.nativeStruct;

/**
 * Map native field descriptions to writable shared-memory accessors.
 *
 * @zh 将原生字段描述映射为可写的共享内存访问器。
 * @ja ネイティブのフィールド記述を共有メモリの読み書きアクセサーに変換します。
 * @ko 네이티브 필드 설명을 쓰기 가능한 공유 메모리 접근자로 매핑합니다.
 *
 * @param mapping - Native-owned buffers and field offsets for this view.
 * @zh mapping - 此视图使用的原生持有缓冲区及字段偏移。
 * @ja mapping - ビューが使うネイティブ所有バッファーとフィールドのオフセットです。
 * @ko mapping - 이 뷰에 사용할 네이티브 소유 버퍼와 필드 오프셋입니다.
 *
 * @returns Accessors that read and write the supplied buffers directly.
 * @zh 直接读写所提供缓冲区的访问器对象。
 * @ja 指定されたバッファーを直接読み書きするアクセサーオブジェクトです。
 * @ko 제공된 버퍼를 직접 읽고 쓰는 접근자 객체입니다.
 */
export function writableStruct<T extends object>(
  mapping: NativeStructMapping,
): T {
  const views = mapping.buffers.map(buffer => new DataView(buffer));
  const result = {} as T;
  for (const [ key, [ type, region, offset ]] of Object.entries(
    mapping.fields,
  )) {
    const view = views[region];
    const read = readers[type as FieldType];
    const write = writers[type as FieldType];
    Object.defineProperty(result, key, {
      enumerable: true,
      configurable: false,
      get: () => read(view, offset),
      set: (value: unknown) => write(view, offset, value),
    });
  }
  return result;
}

/**
 * Retrieve the sfml.js window handle consumed by the native addon.
 *
 * @zh 获取原生扩展使用的 sfml.js 窗口句柄。
 * @ja ネイティブアドオンが使用する sfml.js ウィンドウハンドルを取得します。
 * @ko 네이티브 애드온이 사용하는 sfml.js 창 핸들을 가져옵니다.
 *
 * @param window - sfml.js window with its native graphics-state handle.
 * @zh window - 持有原生图形状态句柄的 sfml.js 窗口。
 * @ja window - ネイティブの描画状態ハンドルを持つ sfml.js ウィンドウです。
 * @ko window - 네이티브 그래픽 상태 핸들을 가진 sfml.js 창입니다.
 *
 * @returns Shared native handle whose internal field 0 identifies the window.
 * @zh 内部字段 0 标识该窗口的共享原生句柄。
 * @ja 内部フィールド 0 でウィンドウを識別する共有ネイティブハンドルです。
 * @ko 내부 필드 0으로 창을 식별하는 공유 네이티브 핸들입니다.
 */
export function windowNativeHandle(window: Window): SfmlNativeHandle {
  const handle = (window as unknown as Record<symbol, unknown>)[
    graphics.graphicsNative
  ];
  if (typeof handle !== 'object' || handle === null) {
    throw new TypeError('Expected an sfml.js Window');
  }
  return handle;
}
