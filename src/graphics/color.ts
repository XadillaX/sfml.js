import { native, type NativeValueHandle } from '../internal/native';
import { LazyValue, nativeValue } from '../internal/lazy-value';
import {
  colorStorage, colorNative, mutableValue, type ReadonlyValue,
} from '../internal/value-storage';

/**
 * RGBA color with four one-byte channels in the range 0 to 255. Channel writes
 * convert according to Uint8Array rules; storage is shared with Native as
 * needed.
 * @zh RGBA 颜色，四个通道各占一个字节，取值为 0～255。 写入通道按 Uint8Array 规则转换；按需与 Native 共用同一块存储。
 * @ja 各 1 バイト、範囲 0～255 の四つのチャンネルを持つ RGBA 色。書き込みは Uint8Array の規則で変換し、必要に応じて
 * Native とストレージを共有します。
 * @ko 각각 1바이트이며 범위가 0~255인 네 채널의 RGBA 색상입니다. 채널 쓰기는 Uint8Array 규칙에 따라 변환하며 필요에
 * 따라 Native와 저장 공간을 공유합니다.
 */
export class Color {
  readonly [mutableValue] = true;
  /**
   * Lazy native wrapper for an RGBA color value.
   * @zh RGBA 颜色值的惰性原生包装。
   * @ja RGBA 色値の遅延ネイティブラッパー。
   * @ko RGBA 색상 값의 지연 네이티브 래퍼입니다.
   */
  private readonly state = new LazyValue<'color', Uint8Array>(
    new Uint8Array(4), buffer => native.wrapColor(buffer),
  );

  /**
   * Creates opaque black, RGBA (0, 0, 0, 255).
   * @zh 创建不透明黑色，即 RGBA (0, 0, 0, 255)。
   * @ja 不透明な黒、RGBA (0, 0, 0, 255) を作成します。
   * @ko 불투명한 검정 RGBA (0, 0, 0, 255)를 만듭니다.
   */
  constructor();
  /**
   * Creates a color from four color channels.
   * @zh 从四个颜色通道创建颜色。
   * @ja 四つのカラーチャンネルから色を作成します。
   * @ko 네 색상 채널로 색상을 만듭니다.
   *
   * @param red Red channel.
   * @zh red - 红色通道。
   * @ja red - 赤チャンネル。
   * @ko red - 빨강 채널입니다.
   *
   * @param green Green channel.
   * @zh green - 绿色通道。
   * @ja green - 緑チャンネル。
   * @ko green - 초록 채널입니다.
   *
   * @param blue Blue channel.
   * @zh blue - 蓝色通道。
   * @ja blue - 青チャンネル。
   * @ko blue - 파랑 채널입니다.
   *
   * @param alpha Opacity: 0 is fully transparent and 255 is opaque; defaults to
   * 255.
   * @zh alpha - 透明度，0 为完全透明，255 为不透明；默认 255。
   * @ja alpha - 不透明度。0 は完全に透明、255 は不透明。既定値は 255。
   * @ko alpha - 불투명도입니다. 0은 완전 투명, 255는 불투명이며 기본값은 255입니다.
   */
  constructor(red: number, green: number, blue: number, alpha?: number);
  /**
   * Creates a color from a 0xRRGGBBAA integer, with byte order independent of
   * host endianness.
   * @zh 从 0xRRGGBBAA 整数创建颜色，字节顺序不受主机大小端影响。
   * @ja ホストのエンディアンに依存しないバイト順の 0xRRGGBBAA 整数から色を作成します。
   * @ko 호스트 엔디언과 무관한 바이트 순서의 0xRRGGBBAA 정수로 색상을 만듭니다.
   *
   * @param color RGBA integer, such as 0xff0000ff for opaque red.
   * @zh color - RGBA 整数，例如 0xff0000ff 表示不透明红色。
   * @ja color - RGBA 整数。例えば 0xff0000ff は不透明な赤です。
   * @ko color - RGBA 정수입니다. 예를 들어 0xff0000ff는 불투명한 빨강입니다.
   */
  constructor(color: number);
  /**
   * Creates an independent copy of a color.
   * @zh 创建独立的颜色副本。
   * @ja 独立した色のコピーを作成します。
   * @ko 독립적인 색상 복사본을 만듭니다.
   *
   * @param source Color to copy.
   * @zh source - 要复制的颜色。
   * @ja source - コピーする色。
   * @ko source - 복사할 색상입니다.
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

  /**
   * Red channel in the range 0 to 255. Writes convert according to Uint8Array
   * rules.
   * @zh 红色通道，取值为 0～255。写入时按 Uint8Array 规则转换。
   * @ja 赤チャンネル、範囲は 0～255。書き込みは Uint8Array の規則で変換します。
   * @ko 빨강 채널이며 범위는 0~255입니다. 쓰기는 Uint8Array 규칙에 따라 변환합니다.
   */
  get r(): number {
    return this[colorStorage][0];
  }

  /**
   * Sets the red channel.
   * @zh 设置红色通道。
   * @ja 赤チャンネルを設定します。
   * @ko 빨강 채널을 설정합니다.
   *
   * @param value Red component, converted to an unsigned 8-bit integer for
   * storage.
   * @zh value - 红色分量，转换为无符号 8 位整数后存储。
   * @ja value - 赤成分。符号なし 8 ビット整数に変換して格納します。
   * @ko value - 빨강 성분이며 부호 없는 8비트 정수로 변환하여 저장합니다.
   *
   * @throws {TypeError} When modifying a read-only color constant such as
   * Color.Red.
   * @zh {TypeError} 修改 Color.Red 等只读颜色常量时抛出。
   * @ja {TypeError} Color.Red などの読み取り専用色定数を変更した場合。
   * @ko {TypeError} Color.Red와 같은 읽기 전용 색상 상수를 수정할 때 발생합니다.
   */
  set r(value: number) {
    this.checkMutable();
    this[colorStorage][0] = value;
  }

  /**
   * Green channel in the range 0 to 255. Writes convert according to Uint8Array
   * rules.
   * @zh 绿色通道，取值为 0～255。写入时按 Uint8Array 规则转换。
   * @ja 緑チャンネル、範囲は 0～255。書き込みは Uint8Array の規則で変換します。
   * @ko 초록 채널이며 범위는 0~255입니다. 쓰기는 Uint8Array 규칙에 따라 변환합니다.
   */
  get g(): number {
    return this[colorStorage][1];
  }

  /**
   * Sets the green channel.
   * @zh 设置绿色通道。
   * @ja 緑チャンネルを設定します。
   * @ko 초록 채널을 설정합니다.
   *
   * @param value Green component, converted to an unsigned 8-bit integer for
   * storage.
   * @zh value - 绿色分量，转换为无符号 8 位整数后存储。
   * @ja value - 緑成分。符号なし 8 ビット整数に変換して格納します。
   * @ko value - 초록 성분이며 부호 없는 8비트 정수로 변환하여 저장합니다.
   *
   * @throws {TypeError} When modifying a read-only color constant.
   * @zh {TypeError} 修改只读颜色常量时抛出。
   * @ja {TypeError} 読み取り専用色定数を変更した場合。
   * @ko {TypeError} 읽기 전용 색상 상수를 수정할 때 발생합니다.
   */
  set g(value: number) {
    this.checkMutable();
    this[colorStorage][1] = value;
  }

  /**
   * Blue channel in the range 0 to 255. Writes convert according to Uint8Array
   * rules.
   * @zh 蓝色通道，取值为 0～255。写入时按 Uint8Array 规则转换。
   * @ja 青チャンネル、範囲は 0～255。書き込みは Uint8Array の規則で変換します。
   * @ko 파랑 채널이며 범위는 0~255입니다. 쓰기는 Uint8Array 규칙에 따라 변환합니다.
   */
  get b(): number {
    return this[colorStorage][2];
  }

  /**
   * Sets the blue channel.
   * @zh 设置蓝色通道。
   * @ja 青チャンネルを設定します。
   * @ko 파랑 채널을 설정합니다.
   *
   * @param value Blue component, converted to an unsigned 8-bit integer for
   * storage.
   * @zh value - 蓝色分量，转换为无符号 8 位整数后存储。
   * @ja value - 青成分。符号なし 8 ビット整数に変換して格納します。
   * @ko value - 파랑 성분이며 부호 없는 8비트 정수로 변환하여 저장합니다.
   *
   * @throws {TypeError} When modifying a read-only color constant.
   * @zh {TypeError} 修改只读颜色常量时抛出。
   * @ja {TypeError} 読み取り専用色定数を変更した場合。
   * @ko {TypeError} 읽기 전용 색상 상수를 수정할 때 발생합니다.
   */
  set b(value: number) {
    this.checkMutable();
    this[colorStorage][2] = value;
  }

  /**
   * Alpha channel: 0 is fully transparent and 255 is fully opaque.
   * @zh Alpha 通道，0 为完全透明，255 为完全不透明。
   * @ja Alpha チャンネル。0 は完全に透明、255 は完全に不透明です。
   * @ko Alpha 채널입니다. 0은 완전 투명, 255는 완전 불투명입니다.
   */
  get a(): number {
    return this[colorStorage][3];
  }

  /**
   * Sets the alpha channel.
   * @zh 设置 Alpha 通道。
   * @ja Alpha チャンネルを設定します。
   * @ko Alpha 채널을 설정합니다.
   *
   * @param value Opacity, converted to an unsigned 8-bit integer for storage.
   * @zh value - 透明度，转换为无符号 8 位整数后存储。
   * @ja value - 不透明度。符号なし 8 ビット整数に変換して格納します。
   * @ko value - 불투명도이며 부호 없는 8비트 정수로 변환하여 저장합니다.
   *
   * @throws {TypeError} When modifying a read-only color constant.
   * @zh {TypeError} 修改只读颜色常量时抛出。
   * @ja {TypeError} 読み取り専用色定数を変更した場合。
   * @ko {TypeError} 읽기 전용 색상 상수를 수정할 때 발생합니다.
   */
  set a(value: number) {
    this.checkMutable();
    this[colorStorage][3] = value;
  }

  /**
   * Encodes the color as an unsigned 32-bit integer.
   * @zh 将颜色编码为无符号 32 位整数。
   * @ja 色を符号なし 32 ビット整数にエンコードします。
   * @ko 색상을 부호 없는 32비트 정수로 인코딩합니다.
   *
   * @return {number} RGBA value in 0xRRGGBBAA format, independent of host
   * endianness.
   * @zh {number} 0xRRGGBBAA 格式的 RGBA 值，与主机大小端无关。
   * @ja {number} ホストのエンディアンに依存しない 0xRRGGBBAA 形式の RGBA 値。
   * @ko {number} 호스트 엔디언과 무관한 0xRRGGBBAA 형식의 RGBA 값입니다.
   */
  toInteger(): number {
    // eslint-disable-next-line no-bitwise
    return ((this.r << 24) | (this.g << 16) | (this.b << 8) | this.a) >>> 0;
  }

  /**
   * Throws TypeError if the object is frozen.
   * @zh 当对象被冻结时抛出 TypeError。
   * @ja オブジェクトが凍結されている場合、TypeError を投げます。
   * @ko 객체가 동결되어 있으면 TypeError를 던집니다.
   */
  private checkMutable(): void {
    if (Object.isFrozen(this)) {
      throw new TypeError('Cannot modify a constant Color');
    }
  }

  /**
   * Opaque black, RGBA (0, 0, 0, 255). Read-only.
   * @zh 不透明黑色，RGBA (0, 0, 0, 255)。只读。
   * @ja 不透明な黒、RGBA (0, 0, 0, 255)。読み取り専用。
   * @ko 불투명한 검정 RGBA (0, 0, 0, 255)입니다. 읽기 전용입니다.
   */
  static readonly Black: ReadonlyValue<Color> =
    Object.freeze(new Color(0, 0, 0));
  /**
   * Opaque white, RGBA (255, 255, 255, 255). Read-only.
   * @zh 不透明白色，RGBA (255, 255, 255, 255)。只读。
   * @ja 不透明な白、RGBA (255, 255, 255, 255)。読み取り専用。
   * @ko 불투명한 흰색 RGBA (255, 255, 255, 255)입니다. 읽기 전용입니다.
   */
  static readonly White: ReadonlyValue<Color> =
    Object.freeze(new Color(255, 255, 255));
  /**
   * Opaque red, RGBA (255, 0, 0, 255). Read-only.
   * @zh 不透明红色，RGBA (255, 0, 0, 255)。只读。
   * @ja 不透明な赤、RGBA (255, 0, 0, 255)。読み取り専用。
   * @ko 불투명한 빨강 RGBA (255, 0, 0, 255)입니다. 읽기 전용입니다.
   */
  static readonly Red: ReadonlyValue<Color> =
    Object.freeze(new Color(255, 0, 0));
  /**
   * Opaque green, RGBA (0, 255, 0, 255). Read-only.
   * @zh 不透明绿色，RGBA (0, 255, 0, 255)。只读。
   * @ja 不透明な緑、RGBA (0, 255, 0, 255)。読み取り専用。
   * @ko 불투명한 초록 RGBA (0, 255, 0, 255)입니다. 읽기 전용입니다.
   */
  static readonly Green: ReadonlyValue<Color> =
    Object.freeze(new Color(0, 255, 0));
  /**
   * Opaque blue, RGBA (0, 0, 255, 255). Read-only.
   * @zh 不透明蓝色，RGBA (0, 0, 255, 255)。只读。
   * @ja 不透明な青、RGBA (0, 0, 255, 255)。読み取り専用。
   * @ko 불투명한 파랑 RGBA (0, 0, 255, 255)입니다. 읽기 전용입니다.
   */
  static readonly Blue: ReadonlyValue<Color> =
    Object.freeze(new Color(0, 0, 255));
  /**
   * Opaque yellow, RGBA (255, 255, 0, 255). Read-only.
   * @zh 不透明黄色，RGBA (255, 255, 0, 255)。只读。
   * @ja 不透明な黄、RGBA (255, 255, 0, 255)。読み取り専用。
   * @ko 불투명한 노랑 RGBA (255, 255, 0, 255)입니다. 읽기 전용입니다.
   */
  static readonly Yellow: ReadonlyValue<Color> =
    Object.freeze(new Color(255, 255, 0));
  /**
   * Opaque magenta, RGBA (255, 0, 255, 255). Read-only.
   * @zh 不透明品红色，RGBA (255, 0, 255, 255)。只读。
   * @ja 不透明なマゼンタ、RGBA (255, 0, 255, 255)。読み取り専用。
   * @ko 불투명한 마젠타 RGBA (255, 0, 255, 255)입니다. 읽기 전용입니다.
   */
  static readonly Magenta: ReadonlyValue<Color> =
    Object.freeze(new Color(255, 0, 255));
  /**
   * Opaque cyan, RGBA (0, 255, 255, 255). Read-only.
   * @zh 不透明青色，RGBA (0, 255, 255, 255)。只读。
   * @ja 不透明なシアン、RGBA (0, 255, 255, 255)。読み取り専用。
   * @ko 불투명한 시안 RGBA (0, 255, 255, 255)입니다. 읽기 전용입니다.
   */
  static readonly Cyan: ReadonlyValue<Color> =
    Object.freeze(new Color(0, 255, 255));
  /**
   * Fully transparent black, RGBA (0, 0, 0, 0). Read-only.
   * @zh 完全透明的黑色，RGBA (0, 0, 0, 0)。只读。
   * @ja 完全に透明な黒、RGBA (0, 0, 0, 0)。読み取り専用。
   * @ko 완전 투명한 검정 RGBA (0, 0, 0, 0)입니다. 읽기 전용입니다.
   */
  static readonly Transparent: ReadonlyValue<Color> =
    Object.freeze(new Color(0, 0, 0, 0));
}

/**
 * Internal member view; its resolver retains parent state, not its wrapper.
 * @zh 内部成员视图；解析器保留父级状态，而非父级包装对象。
 * @ja 内部メンバービュー。リゾルバーは親のラッパーではなく状態を保持します。
 * @ko 내부 멤버 뷰입니다. 리졸버는 부모 래퍼가 아닌 부모 상태를 유지합니다.
 */
export function colorFromState(
  state: LazyValue<'color', Uint8Array>,
): Color {
  return Object.assign(Object.create(Color.prototype), {
    [mutableValue]: true,
    state,
  });
}
