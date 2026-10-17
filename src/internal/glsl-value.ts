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
  /**
   * Boolean scalar type with components stored as 0/1 bytes.
   * @zh 布尔标量类型，底层分量使用 0/1 字节。
   * @ja 真偽値のスカラー型。各成分は 0/1 のバイトで格納します。
   * @ko 불리언 스칼라 유형이며 성분을 0/1 바이트로 저장합니다.
   */
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

  /**
   * X boolean component.
   * @zh X 布尔分量。
   * @ja X の真偽値成分。
   * @ko X 불리언 성분.
   */
  get x(): boolean { return this[glslStorage][0] !== 0; }
  /**
   * Set the X boolean component.
   * @zh 设置 X 布尔分量。
   * @ja X の真偽値成分を設定します。
   * @ko X 불리언 성분을 설정합니다.
   */
  set x(value: boolean) { this[glslStorage][0] = value ? 1 : 0; }
  /**
   * Y boolean component.
   * @zh Y 布尔分量。
   * @ja Y の真偽値成分。
   * @ko Y 불리언 성분.
   */
  get y(): boolean { return this[glslStorage][1] !== 0; }
  /**
   * Set the Y boolean component.
   * @zh 设置 Y 布尔分量。
   * @ja Y の真偽値成分を設定します。
   * @ko Y 불리언 성분을 설정합니다.
   */
  set y(value: boolean) { this[glslStorage][1] = value ? 1 : 0; }
}
