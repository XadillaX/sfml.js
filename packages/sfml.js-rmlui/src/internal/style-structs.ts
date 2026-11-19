import type { VariantColour } from '../values/types';

/** @internal */
export type NativeFieldView =
  Float32Array | Uint16Array | Int16Array | Uint8Array;

/** @internal */
export interface NativeStyleStruct {
  handle: object;
  views: Record<string, NativeFieldView>;
}

/** @internal */
export const styleStructs = new WeakMap<object, NativeStyleStruct>();

/**
 * Resolve independent native storage.
 *
 * @internal
 * @param value - Public wrapper.
 * @returns Native struct mapping.
 */
export function structMapping(value: object): NativeStyleStruct {
  const mapping = styleStructs.get(value);
  if (!mapping) {
    throw new TypeError('Expected an owned style struct');
  }
  return mapping;
}

/**
 * Validate an integer before writing a native typed field.
 *
 * @internal
 * @param value - Requested integer.
 * @param minimum - Inclusive lower bound.
 * @param maximum - Inclusive upper bound.
 * @returns Checked integer.
 */
export function checkedStructInteger(
  value: number, minimum: number, maximum: number,
): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError('Style struct integer is outside its valid range');
  }
  return value;
}

/**
 * Copy native RGBA bytes to a detached colour.
 *
 * @internal
 * @param view - Native colour memory.
 * @returns Colour snapshot.
 */
export function structColour(view: NativeFieldView):
VariantColour & { type: 'colourb' } {
  return {
    type: 'colourb', red: view[0], green: view[1],
    blue: view[2], alpha: view[3],
  };
}

/**
 * Validate every component before changing any native byte.
 *
 * @internal
 * @param value - Byte colour input.
 * @returns Validated RGBA components.
 */
export function checkedStructColour(
  value: VariantColour & { type: 'colourb' },
): number[] {
  if (!value || value.type !== 'colourb') {
    throw new TypeError('Expected a colourb value');
  }
  return [ value.red, value.green, value.blue, value.alpha ]
    .map(component => checkedStructInteger(component, 0, 255));
}
