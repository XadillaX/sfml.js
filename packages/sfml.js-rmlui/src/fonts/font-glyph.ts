import { native, type NativeFontGlyph } from '../internal/native';
import type { VariantVector2 } from '../values/types';

const glyphs = new WeakMap<FontGlyph, NativeFontGlyph>();

/**
 * Rml::FontGlyphMap represented by Unicode code point keys and owned glyphs.
 *
 * @zh Rml::FontGlyphMap，以 Unicode 码点为键、自有字形为值。
 * @ja Unicode コードポイントと所有するグリフで表す Rml::FontGlyphMap。
 * @ko 유니코드 코드 포인트 키와 소유 글리프로 표현하는 Rml::FontGlyphMap입니다.
 */
export type FontGlyphMap = Map<number, FontGlyph>;

/**
 * The channel format of a glyph bitmap: alpha coverage or RGBA colour.
 *
 * @zh 字形位图的原生颜色格式。
 * @ja グリフビットマップのネイティブ色形式。
 * @ko 글리프 비트맵 채널 형식: 알파 커버리지 또는 RGBA 색상입니다.
 */
export enum ColorFormat {
  /**
   * Four RGBA bytes per pixel.
   *
   * @zh 每像素四个 RGBA 字节。
   * @ja 1 ピクセルに RGBA の 4 バイト。
   * @ko 픽셀당 RGBA 4바이트입니다.
   */
  RGBA8 = 0,
  /**
   * One alpha byte per pixel.
   *
   * @zh 每像素一个 alpha 字节。
   * @ja 1 ピクセルにアルファの 1 バイト。
   * @ko 픽셀당 알파 1바이트입니다.
   */
  A8 = 1,
}

/**
 * Resolve native glyph storage.
 *
 * @internal
 * @param glyph - Public glyph.
 * @returns Native mapping.
 */
function mapping(glyph: FontGlyph): NativeFontGlyph {
  const result = glyphs.get(glyph);
  if (!result) {
    throw new TypeError('Expected an owned FontGlyph');
  }
  return result;
}

/**
 * Resolve a checked glyph handle.
 *
 * @internal
 * @param glyph - Public glyph.
 * @returns Native handle.
 */
export function fontGlyphHandle(glyph: FontGlyph): object {
  return mapping(glyph).handle;
}

/**
 * Validate an integer before writing mapped metadata.
 *
 * @internal
 * @param value - Integer.
 * @returns Validated integer.
 */
function int32(value: number): number {
  if (!Number.isInteger(value) || value < -2147483648 || value > 2147483647) {
    throw new RangeError('Expected an int32 glyph field');
  }
  return value;
}

/**
 * Write both vector components atomically.
 *
 * @internal
 * @param view - Native mapping.
 * @param value - Vector.
 */
function writeVector(view: Int32Array, value: VariantVector2): void {
  const x = int32(value.x);
  const y = int32(value.y);
  view[0] = x;
  view[1] = y;
}

/**
 * Native-owned Rml::FontGlyph with mapped metrics and retained bitmap storage.
 *
 * @zh 原生持有的 Rml::FontGlyph，提供指标映射和保活位图存储。
 * @ja メトリクスをマップしビットマップを保持するネイティブ所有の Rml::FontGlyph。
 * @ko 메트릭 매핑과 비트맵 저장소를 보유하는 네이티브 소유 Rml::FontGlyph입니다.
 * @remarks
 * Bitmap assignment copies the given view into a native unique allocation.
 * Weak copies and exported views retain that allocation after replacement or
 * collection of the source glyph. Numeric fields and bytes outlive shutdown.
 * @zh 位图赋值将输入视图复制到原生独占分配。弱副本和导出视图在源字形替换位图或回收后
 * 仍保活该分配。数值字段和字节在运行时关闭后仍有效。
 * @ja 代入時に入力ビューをネイティブ領域へコピーします。弱コピーとビューは、
 * 元の置換・回収後も領域を保持します。数値とバイトは終了後も有効です。
 * @ko 대입 시 입력 뷰를 네이티브 전용 영역으로 복사합니다. 약한 복사와 뷰는
 * 원본 교체·수집 후에도 영역을 유지합니다. 수치와 바이트는 종료 후에도 유효합니다.
 */
export class FontGlyph {
  /**
   * Create an empty A8 glyph with zero metrics.
   *
   * @zh 创建指标为零的空 A8 字形。
   * @ja メトリクスがゼロの空の A8 グリフを作成します。
   * @ko 메트릭이 0인 빈 A8 글리프를 만듭니다.
   */
  constructor() {
    glyphs.set(this, native.createFontGlyph());
  }

  /**
   * Baseline-to-bitmap offset, Rml::FontGlyph::bearing.
   *
   * @zh 基线到位图的偏移，对应 Rml::FontGlyph::bearing。
   * @ja ベースラインからのオフセット、Rml::FontGlyph::bearing。
   * @ko 기준선에서 비트맵까지의 오프셋인 Rml::FontGlyph::bearing입니다.
   * @returns Copied integer vector.
   * @zh 整数向量副本。
   * @ja 整数ベクトルのコピー。
   * @ko 정수 벡터 복사본입니다.
   */
  get bearing(): VariantVector2 {
    const view = mapping(this).bearingView;
    return { x: view[0], y: view[1] };
  }

  /**
   * Set the native glyph bearing.
   *
   * @zh 设置原生字形方位。
   * @ja ネイティブグリフのベアリングを設定します。
   * @ko 네이티브 글리프 베어링을 설정합니다.
   * @param value - Signed integer pixel offsets.
   * @zh value - 有符号整数像素偏移。
   * @ja value - 符号付き整数のピクセルオフセット。
   * @ko value - 부호 있는 정수 픽셀 오프셋입니다.
   */
  set bearing(value: VariantVector2) {
    writeVector(mapping(this).bearingView, value);
  }

  /**
   * Cursor advance in pixels, Rml::FontGlyph::advance.
   *
   * @zh 光标前进像素数，对应 Rml::FontGlyph::advance。
   * @ja カーソルの送り量、Rml::FontGlyph::advance。
   * @ko 커서 전진 픽셀 수인 Rml::FontGlyph::advance입니다.
   * @returns Integer advance.
   * @zh 整数前进量。
   * @ja 整数の送り量。
   * @ko 정수 전진량입니다.
   */
  get advance(): number {
    return mapping(this).advanceView[0];
  }

  /**
   * Set the native cursor advance.
   *
   * @zh 设置原生光标前进量。
   * @ja ネイティブのカーソル送り量を設定します。
   * @ko 네이티브 커서 전진량을 설정합니다.
   * @param value - Signed integer pixel advance.
   * @zh value - 有符号整数像素前进量。
   * @ja value - 符号付き整数のピクセル送り量。
   * @ko value - 부호 있는 정수 픽셀 전진량입니다.
   */
  set advance(value: number) {
    mapping(this).advanceView[0] = int32(value);
  }

  /**
   * The width and height of the glyph bitmap in pixels.
   *
   * @zh 字形位图的像素尺寸。
   * @ja グリフビットマップのピクセル寸法。
   * @ko 글리프 비트맵의 픽셀 너비와 높이입니다.
   * @returns Bitmap dimensions in pixels.
   * @zh 位图像素尺寸。
   * @ja ビットマップのピクセル寸法。
   * @ko 비트맵 픽셀 크기입니다.
   */
  get bitmapDimensions(): VariantVector2 {
    const view = mapping(this).bitmapDimensionsView;
    return { x: view[0], y: view[1] };
  }

  /**
   * Set the native bitmap dimensions without reallocating its bytes.
   *
   * @zh 设置原生位图尺寸，不重新分配字节。
   * @ja バイト領域を再確保せずビットマップ寸法を設定します。
   * @ko 바이트를 재할당하지 않고 네이티브 비트맵 크기를 설정합니다.
   * @param value - Integer width and height in pixels.
   * @zh value - 整数像素宽高。
   * @ja value - 整数のピクセル幅と高さ。
   * @ko value - 정수 픽셀 너비와 높이입니다.
   */
  set bitmapDimensions(value: VariantVector2) {
    writeVector(mapping(this).bitmapDimensionsView, value);
  }

  /**
   * The channel format used to interpret the glyph bitmap bytes.
   *
   * @zh 字形位图的颜色格式。
   * @ja グリフビットマップの色形式。
   * @ko 글리프 비트맵 바이트 해석에 사용하는 채널 형식입니다.
   * @returns A8 or RGBA8.
   * @zh A8 或 RGBA8。
   * @ja A8 または RGBA8。
   * @ko A8 또는 RGBA8입니다.
   */
  get colorFormat(): ColorFormat {
    return mapping(this).colorFormatView[0];
  }

  /**
   * Set the bitmap format without converting its bytes.
   *
   * @zh 设置位图格式，不转换字节。
   * @ja バイトを変換せずビットマップ形式を設定します。
   * @ko 바이트 변환 없이 비트맵 형식을 설정합니다.
   * @param value - A8 or RGBA8.
   * @zh value - A8 或 RGBA8。
   * @ja value - A8 または RGBA8。
   * @ko value - A8 또는 RGBA8입니다.
   */
  set colorFormat(value: ColorFormat) {
    if (value !== ColorFormat.A8 && value !== ColorFormat.RGBA8) {
      throw new RangeError('Expected glyph color format A8 or RGBA8');
    }
    mapping(this).colorFormatView[0] = value;
  }

  /**
   * Retained view of bitmap_data; assignment copies bytes or clears with null.
   *
   * @zh bitmap_data 的保活视图；赋值复制字节，null 清空位图。
   * @ja bitmap_data を保持するビュー。代入でコピーし、null で消去します。
   * @ko bitmap_data를 유지하는 뷰이며 대입 시 복사하고 null로 지웁니다.
   * @returns Native bytes, or null.
   * @zh 原生字节或 null。
   * @ja ネイティブバイトまたは null。
   * @ko 네이티브 바이트 또는 null입니다.
   */
  get bitmapData(): Uint8Array | null {
    return native.getGlyphBitmap(fontGlyphHandle(this), false);
  }

  /**
   * Replace bitmap data with an owned copy.
   *
   * @zh 用自有副本替换位图数据。
   * @ja 所有コピーでビットマップデータを置換します。
   * @ko 소유 복사본으로 비트맵 데이터를 교체합니다.
   * @param value - Bytes to copy, or null to clear.
   * @zh value - 待复制字节，null 表示清空。
   * @ja value - コピーするバイト。null で消去。
   * @ko value - 복사할 바이트이며 null이면 지웁니다.
   */
  set bitmapData(value: Uint8Array | null) {
    native.setGlyphBitmap(fontGlyphHandle(this), value);
  }

  /**
   * Owned allocation view; null on weak copies. Writes also set bitmapData.
   *
   * @zh 自有分配视图；弱副本返回 null。赋值同时设置 bitmapData。
   * @ja 所有する領域のビュー。弱コピーでは null。代入は bitmapData も設定します。
   * @ko 소유 영역 뷰이며 약한 복사는 null입니다. 대입은 bitmapData도 설정합니다.
   * @returns Owned native bytes, or null.
   * @zh 自有原生字节或 null。
   * @ja 所有するバイトまたは null。
   * @ko 소유하는 네이티브 바이트 또는 null입니다.
   */
  get bitmapOwnedData(): Uint8Array | null {
    return native.getGlyphBitmap(fontGlyphHandle(this), true);
  }

  /**
   * Replace owned bitmap storage and select it as bitmapData.
   *
   * @zh 替换自有位图存储，并将其设为 bitmapData。
   * @ja 所有領域を置換し bitmapData に選択します。
   * @ko 소유 비트맵 저장소를 교체하고 bitmapData로 선택합니다.
   * @param value - Bytes to copy, or null to clear both pointers.
   * @zh value - 待复制字节，null 清空两个指针。
   * @ja value - コピーするバイト。null で両ポインターを消去。
   * @ko value - 복사할 바이트이며 null이면 두 포인터를 지웁니다.
   */
  set bitmapOwnedData(value: Uint8Array | null) {
    native.setGlyphBitmap(fontGlyphHandle(this), value);
  }

  /**
   * Writable native bearing mapping.
   *
   * @zh 可写的原生 bearing 映射。
   * @ja 書き込み可能な bearing マッピング。
   * @ko 쓰기 가능한 네이티브 bearing 매핑입니다.
   * @returns Two signed integers.
   * @zh 两个有符号整数。
   * @ja 2 個の符号付き整数。
   * @ko 부호 있는 정수 2개입니다.
   */
  get bearingView(): Int32Array {
    return mapping(this).bearingView;
  }

  /**
   * Writable native advance mapping.
   *
   * @zh 可写的原生 advance 映射。
   * @ja 書き込み可能な advance マッピング。
   * @ko 쓰기 가능한 네이티브 advance 매핑입니다.
   * @returns One signed integer.
   * @zh 一个有符号整数。
   * @ja 1 個の符号付き整数。
   * @ko 부호 있는 정수 1개입니다.
   */
  get advanceView(): Int32Array {
    return mapping(this).advanceView;
  }

  /**
   * Writable native bitmap dimension mapping; checked by effect operations.
   *
   * @zh 可写的原生位图尺寸映射；效果操作时校验。
   * @ja 書き込み可能な寸法。効果処理時に検証します。
   * @ko 쓰기 가능한 크기 매핑이며 효과 작업에서 검증합니다.
   * @returns Two signed integers.
   * @zh 两个有符号整数。
   * @ja 2 個の符号付き整数。
   * @ko 부호 있는 정수 2개입니다.
   */
  get bitmapDimensionsView(): Int32Array {
    return mapping(this).bitmapDimensionsView;
  }

  /**
   * Writable native format mapping; checked by effect operations.
   *
   * @zh 可写的原生格式映射；效果操作时校验。
   * @ja 書き込み可能な形式。効果処理時に検証します。
   * @ko 쓰기 가능한 형식 매핑이며 효과 작업에서 검증합니다.
   * @returns One ColorFormat integer.
   * @zh 一个 ColorFormat 整数。
   * @ja 1 個の ColorFormat 整数。
   * @ko ColorFormat 정수 1개입니다.
   */
  get colorFormatView(): Int32Array {
    return mapping(this).colorFormatView;
  }

  /**
   * Rml::FontGlyph::WeakCopy with native bitmap retention.
   *
   * @zh Rml::FontGlyph::WeakCopy，保活原生位图。
   * @ja ビットマップを保持する Rml::FontGlyph::WeakCopy。
   * @ko 네이티브 비트맵을 유지하는 Rml::FontGlyph::WeakCopy입니다.
   * @returns Independent metrics sharing the current bitmap allocation.
   * @zh 指标独立、共享当前位图分配的字形。
   * @ja 現在のビットマップを共有する独立したメトリクス。
   * @ko 현재 비트맵 영역을 공유하는 독립 메트릭입니다.
   */
  weakCopy(): FontGlyph {
    return fontGlyphFromNative(native.weakCopyFontGlyph(fontGlyphHandle(this)));
  }
}

/**
 * Wrap native-owned glyph snapshot storage.
 *
 * @internal
 * @param value - Native metric mappings and bitmap owner.
 * @returns Public glyph.
 */
export function fontGlyphFromNative(value: NativeFontGlyph): FontGlyph {
  const result = Object.create(FontGlyph.prototype) as FontGlyph;
  glyphs.set(result, value);
  return result;
}
