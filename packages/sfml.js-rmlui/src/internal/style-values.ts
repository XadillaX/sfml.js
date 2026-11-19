/** @internal */
export interface NativeStyleScalar {
  handle: object;
  kind: 'LengthPercentageAuto' | 'LengthPercentage' | 'NumberAuto' |
  'VerticalAlign';
  valueView: Float32Array;
  typeView: Uint8Array;
}

/** @internal */
export interface NativeLineHeight {
  handle: object;
  kind: 'LineHeight';
  valueView: Float32Array;
  typeView: Uint8Array;
  inheritValueView: Float32Array;
}

/** @internal */
export interface NativeClip {
  handle: object;
  kind: 'Clip';
  type: number;
  number: number;
}

/** @internal */
export type NativeStyleValue =
  NativeStyleScalar | NativeLineHeight | NativeClip;

/** @internal */
export const styleValues = new WeakMap<object, NativeStyleValue>();

/** @internal */
export const stylePrototypes = new Map<string, object>();

/**
 * Look up an owned native style mapping.
 *
 * @internal
 * @param value - Public style wrapper.
 * @returns Shared native value.
 */
export function styleMapping(value: object): NativeStyleValue {
  const result = styleValues.get(value);
  if (!result) {
    throw new TypeError('Expected an owned style value');
  }
  return result;
}

/**
 * Resolve shared scalar storage.
 *
 * @internal
 * @param value - Scalar wrapper.
 * @returns Scalar mapping.
 */
export function scalarMapping(
  value: object,
): NativeStyleScalar | NativeLineHeight {
  const mapping = styleMapping(value);
  if (mapping.kind === 'Clip') {
    throw new TypeError('Expected a style scalar');
  }
  return mapping;
}

/**
 * Resolve inheritance storage.
 *
 * @internal
 * @param value - LineHeight wrapper.
 * @returns LineHeight mapping.
 */
export function lineHeightMapping(value: object): NativeLineHeight {
  const mapping = styleMapping(value);
  if (mapping.kind !== 'LineHeight') {
    throw new TypeError('Expected a LineHeight');
  }
  return mapping;
}

/**
 * Resolve an encoded clip value.
 *
 * @internal
 * @param value - Clip wrapper.
 * @returns Clip mapping.
 */
export function clipMapping(value: object): NativeClip {
  const mapping = styleMapping(value);
  if (mapping.kind !== 'Clip') {
    throw new TypeError('Expected a Clip');
  }
  return mapping;
}

/**
 * Resolve a native style handle without invoking user accessors.
 *
 * @internal
 * @param value - Public wrapper.
 * @returns Native scalar handle.
 */
export function styleValueHandle(value: object): object {
  return styleMapping(value).handle;
}

/**
 * Wrap a new native scalar copy.
 *
 * @internal
 * @param value - Native mapping.
 * @returns Owned public style value.
 */
export function styleValueFromNative(value: NativeStyleValue): object {
  const prototype = stylePrototypes.get(value.kind);
  if (!prototype) {
    throw new TypeError('Unknown native style value');
  }
  const result = Object.create(prototype) as object;
  styleValues.set(result, value);
  return result;
}

/**
 * Check a writable enum before its byte-sized assignment.
 *
 * @internal
 * @param value - Enum integer.
 * @param maximum - Last permitted member.
 * @returns Checked integer.
 */
export function checkedStyleEnum(value: number, maximum: number): number {
  if (!Number.isInteger(value) || value < 0 || value > maximum) {
    throw new RangeError('Style enum is outside its valid range');
  }
  return value;
}

/**
 * Check an assignment before converting to native float storage.
 *
 * @internal
 * @param value - Float input.
 * @returns Checked float.
 */
export function checkedStyleFloat(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(Math.fround(value))) {
    throw new TypeError('Style value must be a finite float');
  }
  return value;
}
