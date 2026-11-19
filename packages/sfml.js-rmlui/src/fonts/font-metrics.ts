import type { NativeFontMetrics } from '../internal/native';

const metrics = new WeakMap<FontMetrics, NativeFontMetrics>();

/**
 * Resolve the native metrics snapshot.
 *
 * @internal
 * @param value - Public metrics.
 * @returns Native field mapping.
 */
function mapping(value: FontMetrics): NativeFontMetrics {
  const result = metrics.get(value);
  if (!result) {
    throw new TypeError('Expected FontMetrics');
  }
  return result;
}

/**
 * Native-owned Rml::FontMetrics snapshot with shared field access.
 *
 * @zh 原生持有的 Rml::FontMetrics 快照，提供共享字段访问。
 * @ja フィールドを共有するネイティブ所有の Rml::FontMetrics スナップショット。
 * @ko 공유 필드 접근을 제공하는 네이티브 소유 Rml::FontMetrics 스냅샷입니다.
 * @remarks Editing a snapshot does not change the active engine's metrics.
 * @zh 编辑快照不会改变活动引擎的字体度量。
 * @ja 編集しても使用中のエンジンのメトリクスは変更されません。
 * @ko 스냅샷 편집은 활성 엔진의 메트릭을 변경하지 않습니다.
 */
export class FontMetrics {
  private constructor() {}

  /**
   * Font size in pixels.
   *
   * @zh 字体像素大小。
   * @ja ピクセル単位のフォントサイズ。
   * @ko 픽셀 단위의 글꼴 크기입니다.
   * @returns Rml::FontMetrics::size.
   * @zh 原生 size。
   * @ja ネイティブ size。
   * @ko 네이티브 size입니다.
   */
  get size(): number {
    return mapping(this).sizeView[0];
  }

  /**
   * Shared ascent, descent, line spacing, x-height, underline position and
   * underline thickness float32 fields, in that order.
   *
   * @zh 依次共享上升、下降、行距、x 高度、下划线位置和厚度六个 float32 字段。
   * @ja アセント、ディセント、行間、x-height、下線位置、下線幅の共有 float32。
   * @ko 어센트, 디센트, 줄 간격, x 높이, 밑줄 위치, 두께 순서의 공유 float32입니다.
   * @returns Writable snapshot storage retained after shutdown.
   * @zh 关闭后仍保活的可写快照存储。
   * @ja 終了後も保持される書き込み可能なスナップショット。
   * @ko 종료 후에도 유지되는 쓰기 가능한 스냅샷 저장소입니다.
   */
  get values(): Float32Array {
    return mapping(this).values;
  }

  /**
   * Rml::FontMetrics::ascent, positive above the baseline.
   *
   * @zh 上升距离，基线上方为正。
   * @ja ベースラインより上を正とするアセント。
   * @ko 기준선 위를 양수로 하는 어센트입니다.
   * @returns Distance in pixels.
   * @zh 像素距离。
   * @ja ピクセル単位の距離。
   * @ko 픽셀 단위의 거리입니다.
   */
  get ascent(): number {
    return this.values[0];
  }

  /**
   * Rml::FontMetrics::descent, positive below the baseline.
   *
   * @zh 下降距离，基线下方为正。
   * @ja ベースラインより下を正とするディセント。
   * @ko 기준선 아래를 양수로 하는 디센트입니다.
   * @returns Distance in pixels.
   * @zh 像素距离。
   * @ja ピクセル単位の距離。
   * @ko 픽셀 단위의 거리입니다.
   */
  get descent(): number {
    return this.values[1];
  }

  /**
   * The distance between consecutive text baselines in pixels.
   *
   * @zh 连续基线之间的距离。
   * @ja 連続するベースライン間の距離。
   * @ko 연속 기준선 사이의 거리입니다.
   * @returns Font line spacing in pixels.
   * @zh 字体行距，单位为像素。
   * @ja ピクセル単位のフォント行間。
   * @ko 픽셀 단위의 글꼴 줄 간격입니다.
   */
  get lineSpacing(): number {
    return this.values[2];
  }

  /**
   * The height of the lowercase x glyph in pixels.
   *
   * @zh 小写 x 的高度。
   * @ja 小文字 x の高さ。
   * @ko 소문자 x의 높이입니다.
   * @returns Height in pixels.
   * @zh 像素高度。
   * @ja ピクセル単位の高さ。
   * @ko 픽셀 단위의 높이입니다.
   */
  get xHeight(): number {
    return this.values[3];
  }

  /**
   * Rml::FontMetrics::underline_position, positive below the baseline.
   *
   * @zh 下划线位置，基线下方为正。
   * @ja ベースラインより下を正とする下線位置。
   * @ko 기준선 아래를 양수로 하는 밑줄 위치입니다.
   * @returns Position in pixels.
   * @zh 像素位置。
   * @ja ピクセル単位の位置。
   * @ko 픽셀 단위의 위치입니다.
   */
  get underlinePosition(): number {
    return this.values[4];
  }

  /**
   * The underline thickness in pixels.
   *
   * @zh 下划线厚度。
   * @ja 下線の幅。
   * @ko 밑줄 두께입니다.
   * @returns Thickness in pixels.
   * @zh 像素厚度。
   * @ja ピクセル単位の幅。
   * @ko 픽셀 단위의 두께입니다.
   */
  get underlineThickness(): number {
    return this.values[5];
  }

  /**
   * Whether the font face supplies the U+2026 ellipsis glyph.
   *
   * @zh 是否提供省略号 U+2026。
   * @ja 省略記号 U+2026 があるか。
   * @ko 줄임표 U+2026 제공 여부입니다.
   * @returns Whether the face contains an ellipsis glyph.
   * @zh 字体是否包含省略号字形。
   * @ja 省略記号のグリフがあるか。
   * @ko 서체에 줄임표 글리프가 있는지 여부입니다.
   */
  get hasEllipsis(): boolean {
    return mapping(this).flags[0] !== 0;
  }
}

/**
 * Wrap a native-owned font metrics snapshot.
 *
 * @internal
 * @param value - Native mapping.
 * @returns Public snapshot.
 */
export function fontMetricsFromNative(value: NativeFontMetrics): FontMetrics {
  const result = Object.create(FontMetrics.prototype) as FontMetrics;
  metrics.set(result, value);
  return result;
}
