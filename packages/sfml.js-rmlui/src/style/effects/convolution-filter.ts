import { native } from '../../internal/native';
import type { ColorFormat } from '../../fonts/font-glyph';
import type { VariantVector2 } from '../../values/types';

const filters = new WeakMap<ConvolutionFilter, object>();

/**
 * Rml::FilterOperation for native alpha convolution.
 *
 * @zh 原生 alpha 卷积的 Rml::FilterOperation。
 * @ja ネイティブアルファ畳み込みの Rml::FilterOperation。
 * @ko 네이티브 알파 합성곱의 Rml::FilterOperation입니다.
 */
export enum FilterOperation {
  /**
   * Sum the weighted source alpha values.
   *
   * @zh 累加加权源 alpha。
   * @ja 重み付きソースアルファを合計します。
   * @ko 가중 소스 알파를 합산합니다.
   */
  Sum = 0,

  /**
   * Select the largest weighted alpha, with a minimum of zero.
   *
   * @zh 选择最大的加权 alpha，最小值为零。
   * @ja 重み付きアルファの最大値を選び、最小値はゼロです。
   * @ko 가중 알파의 최댓값을 선택하며 최솟값은 0입니다.
   */
  Dilation = 1,
}

/**
 * Resolve an owned filter without exposing its native token.
 *
 * @internal
 * @param value - Public filter.
 * @returns Native token.
 */
function handle(value: ConvolutionFilter): object {
  const result = filters.get(value);
  if (!result) {
    throw new TypeError('Expected an owned ConvolutionFilter');
  }
  return result;
}

/**
 * Native Rml::ConvolutionFilter with a writable shared float32 kernel.
 *
 * @zh 原生 Rml::ConvolutionFilter，提供可写共享 float32 核。
 * @ja 書き込み可能な共有 float32 カーネルを持つ Rml::ConvolutionFilter。
 * @ko 쓰기 가능한 공유 float32 커널을 가진 네이티브 Rml::ConvolutionFilter입니다.
 * @remarks
 * Each run crosses into Native once. Native owns the kernel; exported views
 * retain their allocation after reinitialisation, collection and shutdown.
 * @zh 每次运行只进入 Native 一次。核由 Native 持有；重新初始化、回收或关闭后，
 * 已导出视图仍保活原分配。
 * @ja 実行は Native を一度だけ呼び出します。既存ビューは再初期化・回収・終了後も
 * 元のネイティブ領域を保持します。
 * @ko 실행마다 Native를 한 번 호출합니다. 내보낸 뷰는 재초기화, 수거 및 종료 후에도
 * 이전 네이티브 할당을 유지합니다.
 */
export class ConvolutionFilter {
  /**
   * Construct an uninitialised native filter.
   *
   * @zh 构造尚未初始化的原生滤镜。
   * @ja 未初期化のネイティブフィルターを構築します。
   * @ko 초기화되지 않은 네이티브 필터를 생성합니다.
   */
  constructor() {
    filters.set(this, native.createConvolutionFilter());
  }

  /**
   * Rml::ConvolutionFilter::Initialise with square or rectangular radii.
   *
   * @zh 使用方形或矩形半径调用 Rml::ConvolutionFilter::Initialise。
   * @ja 正方形または長方形半径で Rml::ConvolutionFilter::Initialise を呼びます。
   * @ko 정사각형 또는 직사각형 반경으로 Rml::ConvolutionFilter::Initialise를 호출합니다.
   * @param radii - Integer radius, or integer x/y radii.
   * @zh radii - 整数半径或整数 x/y 半径。
   * @ja radii - 整数半径または整数 x/y 半径。
   * @ko radii - 정수 반경 또는 정수 x/y 반경입니다.
   * @param operation - Sum or Dilation.
   * @zh operation - Sum 或 Dilation。
   * @ja operation - Sum または Dilation。
   * @ko operation - Sum 또는 Dilation입니다.
   * @returns False for negative radii, preserving the previous kernel.
   * @zh 半径为负时返回 false，保留先前的核。
   * @ja 負の半径では false を返し、以前のカーネルを保持します。
   * @ko 음수 반경이면 false를 반환하며 이전 커널을 유지합니다.
   */
  initialise(
    radii: number | VariantVector2, operation: FilterOperation,
  ): boolean {
    return native.convolutionInitialise(handle(this), radii, operation);
  }

  /**
   * Contiguous row-major native kernel; initialise before accessing.
   *
   * @zh 连续、按行排列的原生核；访问前需初始化。
   * @ja 連続した行優先のネイティブカーネル。アクセス前に初期化します。
   * @ko 연속된 행 우선 네이티브 커널이며 접근 전에 초기화해야 합니다.
   * @returns Writable view of (2*x+1)*(2*y+1) floats.
   * @zh 包含 (2*x+1)*(2*y+1) 个浮点数的可写视图。
   * @ja (2*x+1)*(2*y+1) 個の浮動小数点数の書き込み可能なビュー。
   * @ko (2*x+1)*(2*y+1)개 실수의 쓰기 가능한 뷰입니다.
   */
  get kernel(): Float32Array {
    return native.convolutionKernel(handle(this));
  }

  /**
   * Rml::ConvolutionFilter::operator[] as a checked shared row.
   *
   * @zh 将 Rml::ConvolutionFilter::operator[] 表示为经过校验的共享行。
   * @ja Rml::ConvolutionFilter::operator[] を検証済み共有行として取得します。
   * @ko Rml::ConvolutionFilter::operator[]를 검증된 공유 행으로 반환합니다.
   * @param index - Zero-based row index.
   * @zh index - 从零开始的行索引。
   * @ja index - ゼロ始まりの行番号。
   * @ko index - 0부터 시작하는 행 인덱스입니다.
   * @returns Row retaining its native allocation.
   * @zh 保活原生分配的行。
   * @ja ネイティブ領域を保持する行。
   * @ko 네이티브 할당을 유지하는 행입니다.
   */
  getRow(index: number): Float32Array {
    if (!Number.isInteger(index)) {
      throw new RangeError('Convolution row requires an integer index');
    }

    return native.convolutionKernel(handle(this), index);
  }

  /**
   * Allocate zeroed Native-owned bytes for filter sources or destinations.
   *
   * @zh 为滤镜源或目标分配清零的 Native 持有字节。
   * @ja フィルターの入出力用にゼロ初期化の Native 所有バイトを割り当てます。
   * @ko 필터 입출력용으로 0으로 초기화된 Native 소유 바이트를 할당합니다.
   * @param byteLength - Nonnegative byte count within native int bounds.
   * @zh byteLength - 原生 int 范围内的非负整数字节数。
   * @ja byteLength - ネイティブ int 範囲内の非負整数バイト数。
   * @ko byteLength - 네이티브 int 범위의 음이 아닌 바이트 수입니다.
   * @returns Writable view retaining only the native allocation.
   * @zh 仅保活原生分配的可写视图。
   * @ja ネイティブ領域のみを保持する書き込み可能なビュー。
   * @ko 네이티브 할당만 유지하는 쓰기 가능한 뷰입니다.
   */
  static allocateBytes(byteLength: number): Uint8Array {
    return native.convolutionAllocateBytes(byteLength);
  }

  /**
   * Rml::ConvolutionFilter::Run; only destination alpha is changed.
   *
   * @zh Rml::ConvolutionFilter::Run；仅修改目标 alpha。
   * @ja Rml::ConvolutionFilter::Run。出力のアルファのみを変更します。
   * @ko Rml::ConvolutionFilter::Run이며 대상 알파만 변경합니다.
   * @remarks
   * Buffers must be live, nonoverlapping Uint8Array views without concurrent
   * shared backing. Source rows are tightly packed. Finite kernel weights are
   * checked before writes. Negative Sum weights require nonnegative output and
   * incur a native preflight; values above 255 saturate as upstream specifies.
   * @zh 缓冲区必须是有效、不重叠且无并发共享后备的 Uint8Array。源行紧密排列。
   * 写入前校验有限权重。负 Sum 权重要求输出非负，需额外原生预检；大于 255 时饱和。
   * @ja バッファーは有効で重ならず、並行共有領域を持たない Uint8Array です。
   * 負の Sum 重みは非負出力の事前検証を要し、255 を超える値は飽和します。
   * @ko 버퍼는 유효하고 겹치지 않으며 동시 공유 저장소가 없어야 합니다.
   * 음수 Sum 가중치는 음이 아닌 출력 사전 검사를 수행하며 255 초과 값은 포화됩니다.
   * @param destination - Writable A8 or RGBA8 bytes.
   * @zh destination - 可写 A8 或 RGBA8 字节。
   * @ja destination - 書き込み可能な A8 または RGBA8 バイト。
   * @ko destination - 쓰기 가능한 A8 또는 RGBA8 바이트입니다.
   * @param dimensions - Destination region size.
   * @zh dimensions - 目标区域尺寸。
   * @ja dimensions - 出力領域サイズ。
   * @ko dimensions - 대상 영역 크기입니다.
   * @param stride - Destination bytes per row.
   * @zh stride - 目标每行字节数。
   * @ja stride - 出力の行当たりバイト数。
   * @ko stride - 대상의 행당 바이트 수입니다.
   * @param format - Destination color format.
   * @zh format - 目标颜色格式。
   * @ja format - 出力色形式。
   * @ko format - 대상 색상 형식입니다.
   * @param source - Source alpha or RGBA bytes.
   * @zh source - 源 alpha 或 RGBA 字节。
   * @ja source - ソースアルファまたは RGBA バイト。
   * @ko source - 소스 알파 또는 RGBA 바이트입니다.
   * @param sourceDimensions - Tightly packed source size.
   * @zh sourceDimensions - 紧密排列的源尺寸。
   * @ja sourceDimensions - 密に配置したソースサイズ。
   * @ko sourceDimensions - 밀집된 소스 크기입니다.
   * @param sourceOffset - Source origin relative to destination.
   * @zh sourceOffset - 源原点相对目标的偏移。
   * @ja sourceOffset - 出力に対するソース原点のオフセット。
   * @ko sourceOffset - 대상 기준 소스 원점 오프셋입니다.
   * @param sourceFormat - Source color format.
   * @zh sourceFormat - 源颜色格式。
   * @ja sourceFormat - ソース色形式。
   * @ko sourceFormat - 소스 색상 형식입니다.
   */
  run(
    destination: Uint8Array, dimensions: VariantVector2, stride: number,
    format: ColorFormat, source: Uint8Array, sourceDimensions: VariantVector2,
    sourceOffset: VariantVector2, sourceFormat: ColorFormat,
  ): void {
    native.convolutionRun(handle(this), destination, dimensions, stride, format,
      source, sourceDimensions, sourceOffset, sourceFormat);
  }
}
