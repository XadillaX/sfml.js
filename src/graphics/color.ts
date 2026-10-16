import { native, type NativeValueHandle } from '../internal/native';
import { LazyValue, nativeValue } from '../internal/lazy-value';
import {
  colorStorage, colorNative, mutableValue, type ReadonlyValue,
} from '../internal/value-storage';

/**
 * RGBA 颜色，四个通道各占一个字节，取值为 0～255。
 * 写入通道按 Uint8Array 规则转换；按需与 Native 共用同一块存储。
 */
export class Color {
  readonly [mutableValue] = true;
  /** RGBA 颜色值的惰性原生包装。 */
  private readonly state = new LazyValue<'color', Uint8Array>(
    new Uint8Array(4), buffer => native.wrapColor(buffer),
  );

  /** 创建不透明黑色，即 RGBA (0, 0, 0, 255)。 */
  constructor();
  /**
   * 从四个颜色通道创建颜色。
   * @param red 红色通道。
   * @param green 绿色通道。
   * @param blue 蓝色通道。
   * @param alpha 透明度，0 为完全透明，255 为不透明；默认 255。
   */
  constructor(red: number, green: number, blue: number, alpha?: number);
  /**
   * 从 0xRRGGBBAA 整数创建颜色，字节顺序不受主机大小端影响。
   * @param color RGBA 整数，例如 0xff0000ff 表示不透明红色。
   */
  constructor(color: number);
  /**
   * 创建独立的颜色副本。
   * @param source 要复制的颜色。
   */
  constructor(source: ReadonlyValue<Color>);
  constructor(
    redOrSource?: number | ReadonlyValue<Color>,
    green?: number, blue?: number, alpha = 255,
  ) {
    this.state.values[3] = 255;
    if (redOrSource === undefined) return;
    if (redOrSource instanceof Color) {
      this[colorStorage].set(redOrSource[colorStorage]);
    } else if (typeof redOrSource === 'number') {
      if (green === undefined && blue === undefined) {
        // SFML integers are 0xRRGGBBAA, independent of host byte order.
        /* eslint-disable no-bitwise */
        this[colorStorage][0] = redOrSource >>> 24;
        this[colorStorage][1] = redOrSource >>> 16;
        this[colorStorage][2] = redOrSource >>> 8;
        this[colorStorage][3] = redOrSource;
        /* eslint-enable no-bitwise */
      } else if (typeof green === 'number' && typeof blue === 'number') {
        this[colorStorage][0] = redOrSource;
        this[colorStorage][1] = green;
        this[colorStorage][2] = blue;
        this[colorStorage][3] = alpha;
      } else {
        throw new TypeError('Color requires red, green and blue components');
      }
    } else {
      throw new TypeError('Expected a Color or an RGBA integer');
    }
  }

  get [colorStorage](): Uint8Array {
    return this.state.values;
  }

  get [colorNative](): NativeValueHandle<'color'> {
    return nativeValue(this, colorNative, this.state);
  }

  /** 红色通道，取值为 0～255。写入时按 Uint8Array 规则转换。 */
  get r(): number {
    return this[colorStorage][0];
  }

  /**
   * 设置红色通道。
   * @param value 红色分量，转换为无符号 8 位整数后存储。
   * @throws {TypeError} 修改 Color.Red 等只读颜色常量时抛出。
   */
  set r(value: number) {
    this.checkMutable();
    this[colorStorage][0] = value;
  }

  /** 绿色通道，取值为 0～255。写入时按 Uint8Array 规则转换。 */
  get g(): number {
    return this[colorStorage][1];
  }

  /**
   * 设置绿色通道。
   * @param value 绿色分量，转换为无符号 8 位整数后存储。
   * @throws {TypeError} 修改只读颜色常量时抛出。
   */
  set g(value: number) {
    this.checkMutable();
    this[colorStorage][1] = value;
  }

  /** 蓝色通道，取值为 0～255。写入时按 Uint8Array 规则转换。 */
  get b(): number {
    return this[colorStorage][2];
  }

  /**
   * 设置蓝色通道。
   * @param value 蓝色分量，转换为无符号 8 位整数后存储。
   * @throws {TypeError} 修改只读颜色常量时抛出。
   */
  set b(value: number) {
    this.checkMutable();
    this[colorStorage][2] = value;
  }

  /** Alpha 通道，0 为完全透明，255 为完全不透明。 */
  get a(): number {
    return this[colorStorage][3];
  }

  /**
   * 设置 Alpha 通道。
   * @param value 透明度，转换为无符号 8 位整数后存储。
   * @throws {TypeError} 修改只读颜色常量时抛出。
   */
  set a(value: number) {
    this.checkMutable();
    this[colorStorage][3] = value;
  }

  /**
   * 将颜色编码为无符号 32 位整数。
   * @return {number} 0xRRGGBBAA 格式的 RGBA 值，与主机大小端无关。
   */
  toInteger(): number {
    // eslint-disable-next-line no-bitwise
    return ((this.r << 24) | (this.g << 16) | (this.b << 8) | this.a) >>> 0;
  }

  /** 当对象被冻结时抛出 TypeError。 */
  private checkMutable(): void {
    if (Object.isFrozen(this)) {
      throw new TypeError('Cannot modify a constant Color');
    }
  }

  /** 不透明黑色，RGBA (0, 0, 0, 255)。只读。 */
  static readonly Black: ReadonlyValue<Color> =
    Object.freeze(new Color(0, 0, 0));
  /** 不透明白色，RGBA (255, 255, 255, 255)。只读。 */
  static readonly White: ReadonlyValue<Color> =
    Object.freeze(new Color(255, 255, 255));
  /** 不透明红色，RGBA (255, 0, 0, 255)。只读。 */
  static readonly Red: ReadonlyValue<Color> =
    Object.freeze(new Color(255, 0, 0));
  /** 不透明绿色，RGBA (0, 255, 0, 255)。只读。 */
  static readonly Green: ReadonlyValue<Color> =
    Object.freeze(new Color(0, 255, 0));
  /** 不透明蓝色，RGBA (0, 0, 255, 255)。只读。 */
  static readonly Blue: ReadonlyValue<Color> =
    Object.freeze(new Color(0, 0, 255));
  /** 不透明黄色，RGBA (255, 255, 0, 255)。只读。 */
  static readonly Yellow: ReadonlyValue<Color> =
    Object.freeze(new Color(255, 255, 0));
  /** 不透明品红色，RGBA (255, 0, 255, 255)。只读。 */
  static readonly Magenta: ReadonlyValue<Color> =
    Object.freeze(new Color(255, 0, 255));
  /** 不透明青色，RGBA (0, 255, 255, 255)。只读。 */
  static readonly Cyan: ReadonlyValue<Color> =
    Object.freeze(new Color(0, 255, 255));
  /** 完全透明的黑色，RGBA (0, 0, 0, 0)。只读。 */
  static readonly Transparent: ReadonlyValue<Color> =
    Object.freeze(new Color(0, 0, 0, 0));
}

/** Internal member view; its resolver retains parent state, not its wrapper. */
export function colorFromState(
  state: LazyValue<'color', Uint8Array>,
): Color {
  return Object.assign(Object.create(Color.prototype), {
    [mutableValue]: true,
    state,
  });
}
