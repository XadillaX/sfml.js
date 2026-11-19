import { createRequire } from 'node:module';
import type { Window } from 'sfml.js';
import type { NativeStructMapping } from '../values/types';

/**
 * sfml.js native handle object; the concrete type is sfml.js's SharedHandle.
 *
 * @zh sfml.js 原生句柄对象，具体类型为 sfml.js 的 SharedHandle。
 */
export type SfmlNativeHandle = object;

type FieldType =
  | 'i8' | 'u8' | 'i16' | 'u16' | 'bool'
  | 'i32' | 'u32' | 'f32' | 'f64'
  | 'i64' | 'u64' | 'size64';

const littleEndian = new Uint8Array(new Uint32Array([ 1 ]).buffer)[0] === 1;

type Reader = (view: DataView, offset: number) => unknown;
const readers: Record<FieldType, Reader> = {
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
  size64: (view, offset) =>
    Number(view.getBigUint64(offset, littleEndian)),
};

const writers: Record<FieldType, (
  view: DataView, offset: number, value: unknown,
) => void> = {
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
    view.setBigInt64(offset, BigInt(value as bigint | number), littleEndian),
  u64: (view, offset, value) =>
    view.setBigUint64(
      offset, BigInt(value as bigint | number), littleEndian,
    ),
  size64: (view, offset, value) =>
    view.setBigUint64(
      offset, BigInt(value as bigint | number), littleEndian,
    ),
};

const requireHere = createRequire(__filename);

// Resolve sfml.js through normal module resolution so both packages share
// the same Symbol instances and helpers.
const entry = requireHere.resolve('sfml.js');
const packageRoot = requireHere('node:path').dirname(
  requireHere('node:path').dirname(entry),
);

const graphics = requireHere(
  requireHere('node:path').join(
    packageRoot, 'dist/internal/graphics-state.js',
  ),
) as { graphicsNative: symbol };

/**
 * Map native field descriptions to shared-memory accessors.
 *
 * @zh 将原生字段描述映射为共享内存访问器。
 * @param mapping - Native-owned buffers and field offsets.
 * @zh mapping - 原生持有的缓冲区及字段偏移。
 * @param writable - Whether the accessors expose setters; defaults to true.
 * @zh writable - 是否提供设置器，默认为 true。
 * @returns Accessors backed by the supplied native buffers.
 * @zh 由所提供原生缓冲区支撑的访问器对象。
 */
export function mapStruct<T extends object>(
  mapping: NativeStructMapping,
  writable = true,
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
      set: writable
        ? (value: unknown) => write(view, offset, value) : undefined,
    });
  }
  return result;
}

/**
 * Retrieve the sfml.js window handle consumed by the native addon.
 *
 * @zh 获取原生扩展使用的 sfml.js 窗口句柄。
 * @param window - sfml.js window with its native graphics-state handle.
 * @zh window - 持有原生图形状态句柄的 sfml.js 窗口。
 * @returns Shared native handle whose internal field identifies the window.
 * @zh 内部字段标识该窗口的共享原生句柄。
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
