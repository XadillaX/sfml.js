import { native, type NativeBox } from '../../internal/native';
import { BoxArea } from './layout';
import type { VariantVector2 } from '../../values/types';

/**
 * Rml::BoxEdge, in native edge-array order.
 *
 * @zh Rml::BoxEdge，顺序与原生边数组一致。
 * @ja ネイティブ配列と同じ順序の Rml::BoxEdge。
 * @ko 네이티브 배열 순서의 Rml::BoxEdge입니다.
 */
export enum BoxEdge {
  /**
   * Top edge.
   *
   * @zh 上边缘。
   * @ja 上辺。
   * @ko 위쪽 가장자리입니다.
   */
  Top = 0,
  /**
   * Right edge.
   *
   * @zh 右边缘。
   * @ja 右辺。
   * @ko 오른쪽 가장자리입니다.
   */
  Right = 1,
  /**
   * Bottom edge.
   *
   * @zh 下边缘。
   * @ja 下辺。
   * @ko 아래쪽 가장자리입니다.
   */
  Bottom = 2,
  /**
   * Left edge.
   *
   * @zh 左边缘。
   * @ja 左辺。
   * @ko 왼쪽 가장자리입니다.
   */
  Left = 3,
}

/**
 * Rml::BoxDirection for size-across queries.
 *
 * @zh 用于跨区域尺寸查询的 Rml::BoxDirection。
 * @ja 領域をまたぐサイズ取得の Rml::BoxDirection。
 * @ko 영역 간 크기 조회에 사용하는 Rml::BoxDirection입니다.
 */
export enum BoxDirection {
  /**
   * Vertical axis (top and bottom).
   *
   * @zh 垂直轴（上、下）。
   * @ja 垂直軸（上と下）。
   * @ko 수직축(위와 아래)입니다.
   */
  Vertical = 0,
  /**
   * Horizontal axis (left and right).
   *
   * @zh 水平轴（左、右）。
   * @ja 水平軸（左と右）。
   * @ko 수평축(왼쪽과 오른쪽)입니다.
   */
  Horizontal = 1,
}

const boxes = new WeakMap<Box, NativeBox>();

/**
 * Resolve a checked native value handle.
 *
 * @internal
 * @param box - Owned box wrapper.
 * @returns Native value handle.
 */
export function boxHandle(box: Box): object {
  const value = boxes.get(box);
  if (!value) {
    throw new TypeError('Expected a Box');
  }
  return value.handle;
}

/**
 * Native-owned Rml::Box value with writable shared numerical fields.
 *
 * @zh Native 持有的 Rml::Box 值，数值字段通过可写共享视图访问。
 * @ja 書き込み可能な数値ビューを持つネイティブ所有の Rml::Box 値。
 * @ko 쓰기 가능한 공유 숫자 뷰를 가진 네이티브 소유 Rml::Box 값입니다.
 * @remarks
 * Element queries copy the box. Changes take effect on an element only through
 * setBox or addBox. Views retain this value, never an element or runtime.
 * Use finite values; native queries and element setters reject non-finite
 * shared fields. Negative margins retain their upstream meaning.
 * @zh 元素查询返回盒副本；通过 setBox 或 addBox 才能应用到元素。
 * 视图仅保活数值，不保活元素或运行时。查询和元素写入会拒绝非有限值；
 * 负外边距保留上游语义。
 * @ja 要素からはコピーを取得します。適用には setBox または addBox を使います。
 * ビューは値のみを保持します。非有限値は取得・要素への適用時に拒否されます。
 * 負のマージンはネイティブと同じ意味です。
 * @ko 요소 조회는 복사본을 반환하며 setBox 또는 addBox로 적용합니다.
 * 뷰는 값만 유지합니다. 조회와 요소 적용 시 유한하지 않은 값은 거부합니다.
 * 음수 여백은 네이티브 의미를 유지합니다.
 */
export class Box {
  /**
   * Rml::Box::num_areas: three outer areas, excluding content.
   *
   * @zh Rml::Box::num_areas：3 个外围区域，不包含内容。
   * @ja Rml::Box::num_areas。内容を除く 3 つの外側領域。
   * @ko Rml::Box::num_areas이며 콘텐츠를 제외한 바깥 영역 3개입니다.
   */
  static readonly numAreas: number = native.boxNumAreas;

  /**
   * Rml::Box::num_edges: four edges per area.
   *
   * @zh Rml::Box::num_edges：每个区域有 4 条边。
   * @ja Rml::Box::num_edges。領域ごとに 4 つの辺。
   * @ko Rml::Box::num_edges이며 각 영역의 가장자리는 4개입니다.
   */
  static readonly numEdges: number = native.boxNumEdges;

  /**
   * Construct Rml::Box, optionally setting its content size.
   *
   * @zh 构造 Rml::Box，可指定内容尺寸。
   * @ja 内容サイズを省略可能な Rml::Box を構築します。
   * @ko 콘텐츠 크기를 선택적으로 지정하여 Rml::Box를 생성합니다.
   * @param content - Content size; omitted means zero.
   * @zh content - 内容尺寸；省略时为零。
   * @ja content - 内容サイズ。省略時はゼロ。
   * @ko content - 콘텐츠 크기이며 생략하면 0입니다.
   */
  constructor(content?: VariantVector2) {
    boxes.set(this, native.createBox(content));
  }

  /**
   * Shared content size in x, y order.
   *
   * @zh 按 x、y 排列的共享内容尺寸。
   * @ja x、y 順の共有内容サイズ。
   * @ko x, y 순서의 공유 콘텐츠 크기입니다.
   * @returns Writable native view, retained independently of this wrapper.
   * @zh 可写原生视图，生命周期独立于包装器。
   * @ja ラッパーと独立して保持される書き込み可能なネイティブビュー。
   * @ko 래퍼와 독립적으로 유지되는 쓰기 가능한 네이티브 뷰입니다.
   */
  get content(): Float32Array {
    return boxes.get(this)!.content;
  }

  /**
   * Shared edges: Margin, Border, Padding; each Top, Right, Bottom, Left.
   *
   * @zh 共享边尺寸：Margin、Border、Padding，每组为上、右、下、左。
   * @ja 共有辺サイズ。Margin、Border、Padding の順、各組は上・右・下・左。
   * @ko 공유 가장자리 크기이며 Margin, Border, Padding 순서로 각각 위·오른쪽·아래·왼쪽입니다.
   * @returns Twelve writable floats; index is area * 4 + edge.
   * @zh 12 个可写浮点数；索引为 area * 4 + edge。
   * @ja 12 個の書き込み可能な浮動小数点数。添字は area * 4 + edge。
   * @ko 쓰기 가능한 실수 12개이며 인덱스는 area * 4 + edge입니다.
   */
  get edges(): Float32Array {
    return boxes.get(this)!.edges;
  }

  /**
   * Copy this Rml::Box into independent native storage.
   *
   * @zh 将此 Rml::Box 复制到独立原生存储。
   * @ja Rml::Box を独立したネイティブ領域へコピーします。
   * @ko Rml::Box를 독립적인 네이티브 저장소에 복사합니다.
   * @returns Independent box value.
   * @zh 独立盒值。
   * @ja 独立したボックス値。
   * @ko 독립적인 상자 값입니다.
   */
  clone(): Box {
    return boxFromNative(native.cloneBox(boxHandle(this)));
  }

  /**
   * Rml::Box::GetSize, optionally including surrounding areas.
   *
   * @zh Rml::Box::GetSize，可包含外围区域。
   * @ja 周辺領域を含められる Rml::Box::GetSize。
   * @ko 주변 영역을 포함할 수 있는 Rml::Box::GetSize입니다.
   * @param area - Outermost area; omitted means content. Auto is invalid.
   * @zh area - 最外层区域；默认 Content，不能使用 Auto。
   * @ja area - 最外領域。省略時は Content。Auto は無効。
   * @ko area - 가장 바깥 영역이며 생략하면 Content, Auto는 무효입니다.
   * @returns Owned size snapshot.
   * @zh 独立尺寸快照。
   * @ja サイズのコピー。
   * @ko 독립적인 크기 복사본입니다.
   */
  getSize(area?: BoxArea): VariantVector2 {
    return native.boxGetSize(boxHandle(this), area);
  }

  /**
   * Rml::Box::GetPosition relative to the border area's top-left corner.
   *
   * @zh Rml::Box::GetPosition，相对边框区域左上角。
   * @ja ボーダー領域の左上を基準にした Rml::Box::GetPosition。
   * @ko 테두리 영역 왼쪽 위를 기준으로 하는 Rml::Box::GetPosition입니다.
   * @param area - Requested area; defaults to Content. Auto is invalid.
   * @zh area - 查询区域，默认 Content，不能使用 Auto。
   * @ja area - 取得領域。既定値は Content。Auto は無効。
   * @ko area - 조회 영역이며 기본값은 Content, Auto는 무효입니다.
   * @returns Owned position snapshot.
   * @zh 独立位置快照。
   * @ja 位置のコピー。
   * @ko 독립적인 위치 복사본입니다.
   */
  getPosition(area: BoxArea = BoxArea.Content): VariantVector2 {
    return native.boxGetPosition(boxHandle(this), area);
  }

  /**
   * Rml::Box::SetContent; updates the shared content view.
   *
   * @zh Rml::Box::SetContent，同时更新共享内容视图。
   * @ja 共有内容ビューを更新する Rml::Box::SetContent。
   * @ko 공유 콘텐츠 뷰를 갱신하는 Rml::Box::SetContent입니다.
   * @param content - Finite content size.
   * @zh content - 有限的内容尺寸。
   * @ja content - 有限の内容サイズ。
   * @ko content - 유한한 콘텐츠 크기입니다.
   */
  setContent(content: VariantVector2): void {
    native.boxSetContent(boxHandle(this), content);
  }

  /**
   * Rml::Box::SetEdge; updates one shared edge.
   *
   * @zh Rml::Box::SetEdge，更新一条共享边尺寸。
   * @ja 共有辺サイズを更新する Rml::Box::SetEdge。
   * @ko 공유 가장자리 크기를 갱신하는 Rml::Box::SetEdge입니다.
   * @param area - Margin, Border or Padding.
   * @zh area - Margin、Border 或 Padding。
   * @ja area - Margin、Border、Padding のいずれか。
   * @ko area - Margin, Border 또는 Padding입니다.
   * @param edge - Side to update.
   * @zh edge - 要更新的边。
   * @ja edge - 更新する辺。
   * @ko edge - 갱신할 가장자리입니다.
   * @param size - Finite edge size.
   * @zh size - 有限的边尺寸。
   * @ja size - 有限の辺サイズ。
   * @ko size - 유한한 가장자리 크기입니다.
   */
  setEdge(area: BoxArea, edge: BoxEdge, size: number): void {
    native.boxSetEdge(boxHandle(this), area, edge, size);
  }

  /**
   * Get the pixel thickness of one margin, border or padding edge.
   *
   * @zh 获取一侧外边距、边框或内边距的像素厚度。
   * @ja 余白・境界線・内側余白の一辺の厚さをピクセルで取得します。
   * @ko 바깥 여백·테두리·안쪽 여백 한쪽의 픽셀 두께를 가져옵니다.
   * @param area - Margin, Border or Padding.
   * @zh area - Margin、Border 或 Padding。
   * @ja area - Margin、Border、Padding のいずれか。
   * @ko area - Margin, Border 또는 Padding입니다.
   * @param edge - Side to read.
   * @zh edge - 要读取的边。
   * @ja edge - 取得する辺。
   * @ko edge - 읽을 가장자리입니다.
   * @returns Edge size.
   * @zh 边尺寸。
   * @ja 辺サイズ。
   * @ko 가장자리 크기입니다.
   */
  getEdge(area: BoxArea, edge: BoxEdge): number {
    return native.boxGetEdge(boxHandle(this), area, edge);
  }

  /**
   * Sum edges from Margin inward through area, using GetCumulativeEdge.
   *
   * @zh 使用 GetCumulativeEdge，从 Margin 向内累加到 area。
   * @ja GetCumulativeEdge で Margin から area までの辺を合計します。
   * @ko GetCumulativeEdge로 Margin부터 area까지 가장자리를 합산합니다.
   * @param area - Last included area; Content includes through Padding.
   * @zh area - 最内层区域；Content 累加到 Padding。
   * @ja area - 最後の領域。Content は Padding までを含みます。
   * @ko area - 마지막 영역이며 Content는 Padding까지 포함합니다.
   * @param edge - Side to sum.
   * @zh edge - 累加的边。
   * @ja edge - 合計する辺。
   * @ko edge - 합산할 가장자리입니다.
   * @returns Cumulative edge size.
   * @zh 累计边尺寸。
   * @ja 辺サイズの合計。
   * @ko 가장자리 크기 합계입니다.
   */
  getCumulativeEdge(area: BoxArea, edge: BoxEdge): number {
    return native.boxGetCumulativeEdge(boxHandle(this), area, edge);
  }

  /**
   * Rml::Box::GetSizeAcross over an inclusive range of areas.
   *
   * @zh Rml::Box::GetSizeAcross，包含起止区域。
   * @ja 開始・終了領域を含む Rml::Box::GetSizeAcross。
   * @ko 시작과 끝 영역을 포함하는 Rml::Box::GetSizeAcross입니다.
   * @param direction - Horizontal or vertical axis.
   * @zh direction - 水平或垂直轴。
   * @ja direction - 水平または垂直軸。
   * @ko direction - 수평 또는 수직축입니다.
   * @param area - Outermost included area.
   * @zh area - 最外层区域。
   * @ja area - 最外領域。
   * @ko area - 가장 바깥 영역입니다.
   * @param areaEnd - Innermost included area; defaults to Content.
   * @zh areaEnd - 最内层区域，默认 Content。
   * @ja areaEnd - 最内領域。既定値は Content。
   * @ko areaEnd - 가장 안쪽 영역이며 기본값은 Content입니다.
   * @returns Size along the selected axis.
   * @zh 所选轴上的尺寸。
   * @ja 選択した軸のサイズ。
   * @ko 선택한 축의 크기입니다.
   */
  getSizeAcross(
    direction: BoxDirection, area: BoxArea, areaEnd: BoxArea = BoxArea.Content,
  ): number {
    return native.boxGetSizeAcross(boxHandle(this), direction, area, areaEnd);
  }

  /**
   * Rml::Box::GetFrameSize, excluding inner areas.
   *
   * @zh Rml::Box::GetFrameSize，不包含更内层区域。
   * @ja 内側の領域を除く Rml::Box::GetFrameSize。
   * @ko 안쪽 영역을 제외하는 Rml::Box::GetFrameSize입니다.
   * @param area - Area to measure; Content returns content size.
   * @zh area - 测量区域；Content 返回内容尺寸。
   * @ja area - 測定領域。Content は内容サイズを返します。
   * @ko area - 측정 영역이며 Content는 콘텐츠 크기를 반환합니다.
   * @returns Owned frame-size snapshot.
   * @zh 独立框架尺寸快照。
   * @ja フレームサイズのコピー。
   * @ko 독립적인 프레임 크기 복사본입니다.
   */
  getFrameSize(area: BoxArea): VariantVector2 {
    return native.boxGetFrameSize(boxHandle(this), area);
  }

  /**
   * Native Rml::Box equality, including exact edge bits.
   *
   * @zh 原生 Rml::Box 相等比较，边尺寸按位比较。
   * @ja 辺のビット比較を含むネイティブ Rml::Box 等価比較。
   * @ko 가장자리 비트 비교를 포함하는 네이티브 Rml::Box 동등 비교입니다.
   * @param other - Box to compare.
   * @zh other - 待比较的盒。
   * @ja other - 比較するボックス。
   * @ko other - 비교할 상자입니다.
   * @returns Native operator== result.
   * @zh 原生 operator== 结果。
   * @ja ネイティブ operator== の結果。
   * @ko 네이티브 operator== 결과입니다.
   */
  equals(other: Box): boolean {
    return native.boxEquals(boxHandle(this), boxHandle(other));
  }

  /**
   * Native Rml::Box inequality.
   *
   * @zh 原生 Rml::Box 不等比较。
   * @ja ネイティブ Rml::Box 非等価比較。
   * @ko 네이티브 Rml::Box 비동등 비교입니다.
   * @param other - Box to compare.
   * @zh other - 待比较的盒。
   * @ja other - 比較するボックス。
   * @ko other - 비교할 상자입니다.
   * @returns Native operator!= result.
   * @zh 原生 operator!= 结果。
   * @ja ネイティブ operator!= の結果。
   * @ko 네이티브 operator!= 결과입니다.
   */
  notEquals(other: Box): boolean {
    return native.boxNotEquals(boxHandle(this), boxHandle(other));
  }
}

/**
 * Copied box and output offset from Rml::Element::GetBox(index, offset).
 *
 * @zh Rml::Element::GetBox(index, offset) 的盒副本及输出偏移。
 * @ja Rml::Element::GetBox(index, offset) のボックスコピーと出力オフセット。
 * @ko Rml::Element::GetBox(index, offset)의 상자 복사본과 출력 오프셋입니다.
 */
export interface PositionedBox {
  /**
   * Independently owned box.
   *
   * @zh 独立持有的盒。
   * @ja 独立して所有するボックス。
   * @ko 독립적으로 소유하는 상자입니다.
   */
  box: Box;

  /**
   * Offset from the main box, or zero for the main box.
   *
   * @zh 相对主盒的偏移；主盒为零。
   * @ja メインボックスからのオフセット。メインボックスはゼロ。
   * @ko 기본 상자 기준 오프셋이며 기본 상자는 0입니다.
   */
  offset: VariantVector2;
}

/**
 * Wrap an already allocated native snapshot.
 *
 * @internal
 * @param value - Owned native mapping.
 * @returns Independent box wrapper.
 */
export function boxFromNative(value: NativeBox): Box {
  const box = Object.create(Box.prototype) as Box;
  boxes.set(box, value);
  return box;
}
