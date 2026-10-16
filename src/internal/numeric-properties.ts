const storage = Symbol('NumericProperties.storage');

/** Numeric JS value fields share one allocation until copied into a draw. */
export function numericProperties(
  target: object, defaults: Record<string, number | boolean>,
): void {
  // Float64 preserves invalid numbers until the existing API validation point.
  // In particular, Uint32 coercion must not turn NaN/fractions into valid enums.
  const entries = Object.entries(defaults);
  const data = new Float64Array(entries.length);
  // A writable data property keeps seal() distinct from freeze().
  Object.defineProperty(target, storage, { value: data, writable: true });
  let invalid: Map<number, unknown> | undefined;
  const descriptors: PropertyDescriptorMap = {};
  entries.forEach(([ key, initial ], index) => {
    const boolean = typeof initial === 'boolean';
    data[index] = Number(initial);
    descriptors[key] = {
      enumerable: true,
      configurable: true,
      get: () => (invalid?.has(index) ? invalid.get(index)
        : boolean ? data[index] !== 0 : data[index]),
      set(value: unknown) {
        if (Object.isFrozen(target)) {
          throw new TypeError('Cannot modify a frozen value');
        }
        if (typeof value !== (boolean ? 'boolean' : 'number')) {
          (invalid ??= new Map()).set(index, value);
        } else {
          invalid?.delete(index);
          data[index] = Number(value);
        }
      },
    };
  });
  Object.defineProperties(target, descriptors);
}
