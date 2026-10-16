import {
  native, type NativeValueHandle, type NativeValueMapping,
} from '../internal/native';
import { LazyValue, memberValue, nativeValue } from '../internal/lazy-value';
import {
  glyphStorage, glyphNative, mutableValue, rectStorage, type ReadonlyValue as R,
} from '../internal/value-storage';
import {
  FloatRect, IntRect, floatRectFromState, intRectFromState,
} from './rect';

export let glyphFromMapping: (mapping: NativeValueMapping<'glyph'>) => Glyph;
export let glyphFromState: (state: LazyValue<'glyph', Uint8Array>) => Glyph;

/** sf::Glyph and its rectangle members share a 44-byte allocation. */
export class Glyph {
  readonly [mutableValue] = true;
  /** 原生字形分配的惰性值，共享 44 字节。 */
  private readonly state: LazyValue<'glyph', Uint8Array>;
  /** state 缓冲区的 Float32 视图。 */
  private readonly floats: Float32Array;
  /** state 缓冲区的 Int32 视图。 */
  private readonly integers: Int32Array;
  /** bounds 属性的延迟 FloatRect 视图缓存。 */
  private boundsView?: FloatRect;
  /** textureRect 属性的延迟 IntRect 视图缓存。 */
  private textureView?: IntRect;

  /** 创建数值全为零的字形，或复制 source 的所有字形度量。 */
  constructor(source?: R<Glyph>) {
    this.state = new LazyValue(new Uint8Array(44), buffer => native.wrapGlyph(buffer));
    this.floats = new Float32Array(this.state.values.buffer);
    this.integers = new Int32Array(this.state.values.buffer);
    if (source !== undefined) {
      if (!(source instanceof Glyph)) throw new TypeError('Expected a Glyph');
      this.state.values.set(source[glyphStorage]);
    }
  }

  get [glyphStorage](): Uint8Array { return this.state.values; }
  get [glyphNative](): NativeValueHandle<'glyph'> {
    return nativeValue(this, glyphNative, this.state);
  }
  /** 绘制后笔位置的水平前进量，单位为像素。 */
  get advance(): number { return this.floats[0]; }
  /** 设置水平前进量，单位为像素。 */
  set advance(value: number) { this.floats[0] = value; }
  /** 自动微调前后左侧边距的差，单位为 1/64 像素。 */
  get lsbDelta(): number { return this.integers[1]; }
  /** 设置左侧边距微调差。 */
  set lsbDelta(value: number) { this.integers[1] = value; }
  /** 自动微调前后右侧边距的差，单位为 1/64 像素。 */
  get rsbDelta(): number { return this.integers[2]; }
  /** 设置右侧边距微调差。 */
  set rsbDelta(value: number) { this.integers[2] = value; }

  /** 相对于基线和笔位置的像素包围框，共享可修改视图。 */
  get bounds(): FloatRect {
    this.boundsView ??= floatRectFromState(memberValue(
      this.state, this.floats.subarray(3, 7),
      handle => native.glyphMember(handle, 0),
    ));
    return this.boundsView;
  }
  /** 复制字形包围框。 */
  set bounds(value: R<FloatRect>) {
    if (!(value instanceof FloatRect)) throw new TypeError('Expected a FloatRect');
    this.floats.set(value[rectStorage], 3);
  }
  /** 字形在字体纹理中的像素矩形，共享可修改视图。 */
  get textureRect(): IntRect {
    this.textureView ??= intRectFromState(memberValue(
      this.state, this.integers.subarray(7, 11),
      handle => native.glyphMember(handle, 1),
    ));
    return this.textureView;
  }
  /** 复制字体纹理中的字形矩形。 */
  set textureRect(value: R<IntRect>) {
    if (!(value instanceof IntRect)) throw new TypeError('Expected an IntRect');
    this.integers.set(value[rectStorage], 7);
  }

  static {
    glyphFromState = state => {
      const { buffer, byteOffset } = state.values;
      return Object.assign(Object.create(Glyph.prototype), {
        [mutableValue]: true,
        state,
        floats: new Float32Array(buffer, byteOffset, 11),
        integers: new Int32Array(buffer, byteOffset, 11),
      });
    };
    glyphFromMapping = mapping => glyphFromState(
      new LazyValue(new Uint8Array(mapping.buffer), () => mapping));
  }
}
