type FieldType = 'i8' | 'u8' | 'bool' | 'u32' | 'f32' | 'f64' | 'i64' | 'u64' | 'size64';
export type StructFields<T> = Partial<Record<keyof T, readonly [FieldType, number]>>;

export interface NativeStruct {
  buffers: ArrayBuffer[];
  fields: Record<string, readonly [FieldType, number, number]>;
}

const littleEndian = new Uint8Array(new Uint32Array([ 1 ]).buffer)[0] === 1;
const readers = {
  i8: (data: DataView, offset: number) => data.getInt8(offset),
  u8: (data: DataView, offset: number) => data.getUint8(offset),
  bool: (data: DataView, offset: number) => data.getUint8(offset) !== 0,
  u32: (data: DataView, offset: number) => data.getUint32(offset, littleEndian),
  f32: (data: DataView, offset: number) => data.getFloat32(offset, littleEndian),
  f64: (data: DataView, offset: number) => data.getFloat64(offset, littleEndian),
  u64: (data: DataView, offset: number) => data.getBigUint64(offset, littleEndian),
  i64: (data: DataView, offset: number) => data.getBigInt64(offset, littleEndian),
  size64: (data: DataView, offset: number) =>
    Number(data.getBigUint64(offset, littleEndian)),
};

/** Read-only resource metadata, with offsets supplied by native member pointers. */
export function nativeStruct<T extends object>(
  mapping: NativeStruct, extra: Partial<T> = {},
): Readonly<T> {
  const data = mapping.buffers.map(buffer => new DataView(buffer));
  const descriptors: PropertyDescriptorMap = {};
  for (const [ key, [ type, region, offset ]] of Object.entries(mapping.fields)) {
    const view = data[region];
    const read = readers[type];
    descriptors[key] = { enumerable: true, get: () => read(view, offset) };
  }
  return Object.freeze(Object.defineProperties({ ...extra }, descriptors)) as T;
}

/** Frozen named getters over native-owned bytes; no mirrored scalar fields. */
export function readonlyStruct<T extends object>(
  buffer: ArrayBuffer, fields: StructFields<T>, extra: Partial<T> = {},
): Readonly<T> {
  const data = new DataView(buffer);
  const descriptors: PropertyDescriptorMap = {};
  for (const [ key, field ] of Object.entries(fields)) {
    const [ type, offset ] = field as readonly [FieldType, number];
    const read = readers[type];
    descriptors[key] = { enumerable: true, get: () => read(data, offset) };
  }
  return Object.freeze(Object.defineProperties({ ...extra }, descriptors)) as T;
}
