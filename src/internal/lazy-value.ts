import type { NativeValueHandle, NativeValueMapping } from './native';
import type { ScalarArray } from './scalar';

export type ValueArray = ScalarArray;
type Resolve<K extends string> =
  (buffer: ArrayBuffer) => NativeValueMapping<K>;

let resolveNative: <K extends string, A extends ValueArray>(
  state: LazyValue<K, A>,
) => NativeValueHandle<K>;

/** Always has storage; native ownership is initialized only when requested. */
export class LazyValue<K extends string, A extends ValueArray> {
  private handle: NativeValueHandle<K> | undefined;

  static {
    // Module-private access to initialization, without a public instance API.
    resolveNative = state => state.native();
  }

  constructor(
    public values: A,
    private resolve: Resolve<K> | undefined,
  ) {}

  private native(): NativeValueHandle<K> {
    if (!this.handle) {
      // All local arrays and native mappings use ordinary ArrayBuffers.
      const mapping = this.resolve!(this.values.buffer as ArrayBuffer);
      const ArrayType = this.values.constructor as {
        new(buffer: ArrayBuffer): A;
      };
      this.values = new ArrayType(mapping.buffer);
      this.handle = mapping.handle;
      // A member resolver retains parent state, never its JS wrapper.
      // Once resolved, native ownership alone keeps the parent storage alive.
      this.resolve = undefined;
    }
    return this.handle;
  }
}

/** A child resolves native ownership through parent state, not its wrapper. */
export function memberValue<
  P extends string, K extends string, A extends ValueArray,
>(
  parent: LazyValue<P, ValueArray>, values: A,
  resolve: (handle: NativeValueHandle<P>) => NativeValueMapping<K>,
): LazyValue<K, A> {
  return new LazyValue(values, () => resolve(resolveNative(parent)));
}

/** Replace a lazy handle getter with a data property after initialization. */
export function nativeValue<K extends string, A extends ValueArray>(
  wrapper: object, key: symbol, state: LazyValue<K, A>,
): NativeValueHandle<K> {
  const handle = resolveNative(state);
  if (Object.isExtensible(wrapper)) {
    Object.defineProperty(wrapper, key, { value: handle });
  }
  return handle;
}
