import { LazyValue, nativeValue, type ValueArray } from './lazy-value';
import type { NativeValueHandle, NativeValueMapping } from './native';
import { mutableValue } from './value-storage';

export const glslStorage: unique symbol = Symbol('Glsl.storage');
export const glslNative: unique symbol = Symbol('Glsl.native');

/** Internal storage only; concrete GLSL types define their own component API. */
export abstract class GlslValue<K extends string, A extends ValueArray> {
  readonly [mutableValue] = true;
  private readonly state: LazyValue<K, A>;

  protected constructor(
    values: A, wrap: (buffer: ArrayBuffer) => NativeValueMapping<K>,
  ) {
    this.state = new LazyValue(values, wrap);
  }

  get [glslStorage](): A {
    return this.state.values;
  }

  get [glslNative](): NativeValueHandle<K> {
    return nativeValue(this, glslNative, this.state);
  }
}

export abstract class BooleanComponents<K extends string>
  extends GlslValue<K, Uint8Array> {
  /** 布尔标量类型，底层分量使用 0/1 字节。 */
  readonly scalarType = 'bool';

  protected constructor(
    components: readonly (number | bigint | boolean)[],
    wrap: (buffer: ArrayBuffer) => NativeValueMapping<K>,
  ) {
    super(new Uint8Array(components.length), wrap);
    for (let i = 0; i < components.length; i++) {
      // C++ conversion treats NaN as nonzero, unlike JavaScript Boolean(NaN).
      this[glslStorage][i] =
        Number(components[i] !== 0 && components[i] !== 0n &&
          components[i] !== false);
    }
  }

  /** X 布尔分量。 */
  get x(): boolean { return this[glslStorage][0] !== 0; }
  /** 设置 X 布尔分量。 */
  set x(value: boolean) { this[glslStorage][0] = value ? 1 : 0; }
  /** Y 布尔分量。 */
  get y(): boolean { return this[glslStorage][1] !== 0; }
  /** 设置 Y 布尔分量。 */
  set y(value: boolean) { this[glslStorage][1] = value ? 1 : 0; }
}
