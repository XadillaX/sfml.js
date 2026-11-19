import type { VariantVector2 } from '../../values/types';
import type { ScrollBehavior } from '../documents/document-flags';

/**
 * Rml::BoxArea, ordered from the outside towards the content.
 *
 * @zh Rml::BoxArea，按从外侧到内容区域排序。
 * @ja 外側からコンテンツへ並べた Rml::BoxArea。
 * @ko 바깥에서 콘텐츠 방향으로 정렬된 Rml::BoxArea입니다.
 */
export enum BoxArea {
  /**
   * Margin area.
   *
   * @zh 外边距区域。
   * @ja マージン領域。
   * @ko 바깥 여백 영역입니다.
   */
  Margin = 0,
  /**
   * Border area.
   *
   * @zh 边框区域。
   * @ja ボーダー領域。
   * @ko 테두리 영역입니다.
   */
  Border = 1,
  /**
   * Padding area.
   *
   * @zh 内边距区域。
   * @ja パディング領域。
   * @ko 안쪽 여백 영역입니다.
   */
  Padding = 2,
  /**
   * Content area.
   *
   * @zh 内容区域。
   * @ja コンテンツ領域。
   * @ko 콘텐츠 영역입니다.
   */
  Content = 3,
  /**
   * Automatic clipping; not a concrete area for offset queries.
   *
   * @zh 自动裁剪；不能用于偏移查询。
   * @ja 自動クリップ。オフセットの取得には使えません。
   * @ko 자동 클리핑이며 오프셋 조회에는 사용할 수 없습니다.
   */
  Auto = 4,
}

/**
 * Native Rml::ScrollAlignment.
 *
 * @zh 原生 Rml::ScrollAlignment。
 * @ja ネイティブの Rml::ScrollAlignment。
 * @ko 네이티브 Rml::ScrollAlignment입니다.
 */
export enum ScrollAlignment {
  /**
   * Align the leading edge.
   *
   * @zh 对齐起始边缘。
   * @ja 開始端を揃えます。
   * @ko 시작 가장자리에 맞춥니다.
   */
  Start = 0,
  /**
   * Align the center.
   *
   * @zh 居中对齐。
   * @ja 中央に揃えます。
   * @ko 가운데에 맞춥니다.
   */
  Center = 1,
  /**
   * Align the trailing edge.
   *
   * @zh 对齐末尾边缘。
   * @ja 終了端を揃えます。
   * @ko 끝 가장자리에 맞춥니다.
   */
  End = 2,
  /**
   * Use the smallest scroll change.
   *
   * @zh 使用最小滚动距离。
   * @ja 最小の距離でスクロールします。
   * @ko 최소 거리만 스크롤합니다.
   */
  Nearest = 3,
  /**
   * Keep visible content in place; otherwise center it.
   *
   * @zh 已可见时不移动，否则居中。
   * @ja 表示中なら維持し、それ以外は中央へ移動します。
   * @ko 이미 보이면 유지하고 아니면 가운데로 이동합니다.
   */
  Adaptive = 4,
}

/**
 * Native Rml::ScrollParentage.
 *
 * @zh 原生 Rml::ScrollParentage。
 * @ja ネイティブの Rml::ScrollParentage。
 * @ko 네이티브 Rml::ScrollParentage입니다.
 */
export enum ScrollParentage {
  /**
   * Scroll all ancestor containers as needed.
   *
   * @zh 按需滚动所有祖先容器。
   * @ja 必要に応じてすべての祖先をスクロールします。
   * @ko 필요에 따라 모든 상위 컨테이너를 스크롤합니다.
   */
  All = 0,
  /**
   * Consider only the nearest scroll container.
   *
   * @zh 仅考虑最近的滚动容器。
   * @ja 最も近いスクロールコンテナのみを対象とします。
   * @ko 가장 가까운 스크롤 컨테이너만 고려합니다.
   */
  Closest = 1,
}

/**
 * Options for native Rml::Element::ScrollIntoView.
 *
 * @zh 原生 Rml::Element::ScrollIntoView 的选项。
 * @ja Rml::Element::ScrollIntoView の設定。
 * @ko 네이티브 Rml::Element::ScrollIntoView 옵션입니다.
 */
export interface ScrollIntoViewOptions {
  /**
   * Vertical alignment; defaults to Start.
   *
   * @zh 垂直对齐方式，默认为 Start。
   * @ja 垂直方向の配置。既定値は Start。
   * @ko 수직 정렬이며 기본값은 Start입니다.
   * @default ScrollAlignment.Start
   */
  vertical?: ScrollAlignment;

  /**
   * Horizontal alignment; defaults to Nearest.
   *
   * @zh 水平对齐方式，默认为 Nearest。
   * @ja 水平方向の配置。既定値は Nearest。
   * @ko 수평 정렬이며 기본값은 Nearest입니다.
   * @default ScrollAlignment.Nearest
   */
  horizontal?: ScrollAlignment;

  /**
   * Scroll behavior; defaults to Instant.
   *
   * @zh 滚动行为，默认为 Instant。
   * @ja スクロール動作。既定値は Instant。
   * @ko 스크롤 동작이며 기본값은 Instant입니다.
   * @default ScrollBehavior.Instant
   */
  behavior?: ScrollBehavior;

  /**
   * Ancestor selection; defaults to All.
   *
   * @zh 祖先选择方式，默认为 All。
   * @ja 祖先の選択。既定値は All。
   * @ko 상위 컨테이너 선택이며 기본값은 All입니다.
   * @default ScrollParentage.All
   */
  parentage?: ScrollParentage;
}

/**
 * Copied return value and in/out point from Rml::Element::Project.
 *
 * @zh Rml::Element::Project 的返回值与输入输出坐标快照。
 * @ja Rml::Element::Project の戻り値と入出力座標のコピー。
 * @ko Rml::Element::Project 반환값과 입출력 좌표 복사본입니다.
 */
export interface ProjectedPoint {
  /**
   * False if the transform cannot be inverted or the projection fails.
   *
   * @zh 变换不可逆或投影失败时为 false。
   * @ja 変換が逆変換できない、または投影が失敗すると false。
   * @ko 역변환이 불가능하거나 투영이 실패하면 false입니다.
   */
  success: boolean;

  /**
   * Point on the element plane, still measured in context pixels.
   *
   * @zh 元素平面上的坐标，仍以上下文像素为单位。
   * @ja 要素平面上の座標。単位はコンテキストのピクセルです。
   * @ko 요소 평면의 좌표이며 단위는 컨텍스트 픽셀입니다.
   */
  point: VariantVector2;
}

/**
 * Native Rml::Style::Position.
 *
 * @zh 原生 Rml::Style::Position。
 * @ja ネイティブの Rml::Style::Position。
 * @ko 네이티브 Rml::Style::Position입니다.
 */
export enum StylePosition {
  /**
   * Static positioning.
   *
   * @zh 静态定位。
   * @ja 通常配置。
   * @ko 정적 배치입니다.
   */
  Static = 0,
  /**
   * Relative positioning.
   *
   * @zh 相对定位。
   * @ja 相対配置。
   * @ko 상대 배치입니다.
   */
  Relative = 1,
  /**
   * Absolute positioning.
   *
   * @zh 绝对定位。
   * @ja 絶対配置。
   * @ko 절대 배치입니다.
   */
  Absolute = 2,
  /**
   * Fixed positioning.
   *
   * @zh 固定定位。
   * @ja 固定配置。
   * @ko 고정 배치입니다.
   */
  Fixed = 3,
}

/**
 * Native Rml::Style::Float.
 *
 * @zh 原生 Rml::Style::Float。
 * @ja ネイティブの Rml::Style::Float。
 * @ko 네이티브 Rml::Style::Float입니다.
 */
export enum StyleFloat {
  /**
   * No float.
   *
   * @zh 不浮动。
   * @ja フロートなし。
   * @ko 플로트 없음입니다.
   */
  None = 0,
  /**
   * Float left.
   *
   * @zh 左浮动。
   * @ja 左フロート。
   * @ko 왼쪽 플로트입니다.
   */
  Left = 1,
  /**
   * Float right.
   *
   * @zh 右浮动。
   * @ja 右フロート。
   * @ko 오른쪽 플로트입니다.
   */
  Right = 2,
}

/**
 * Native Rml::Style::Display.
 *
 * @zh 原生 Rml::Style::Display。
 * @ja ネイティブの Rml::Style::Display。
 * @ko 네이티브 Rml::Style::Display입니다.
 */
export enum StyleDisplay {
  /**
   * No display box.
   *
   * @zh 无显示盒。
   * @ja 表示ボックスなし。
   * @ko 표시 상자 없음입니다.
   */
  None = 0,
  /**
   * Block box.
   *
   * @zh 块盒。
   * @ja ブロックボックス。
   * @ko 블록 상자입니다.
   */
  Block = 1,
  /**
   * Inline box.
   *
   * @zh 行内盒。
   * @ja インラインボックス。
   * @ko 인라인 상자입니다.
   */
  Inline = 2,
  /**
   * Inline block.
   *
   * @zh 行内块盒。
   * @ja インラインブロック。
   * @ko 인라인 블록입니다.
   */
  InlineBlock = 3,
  /**
   * Flow root.
   *
   * @zh 流布局根。
   * @ja フロールート。
   * @ko 흐름 루트입니다.
   */
  FlowRoot = 4,
  /**
   * Flex container.
   *
   * @zh 弹性容器。
   * @ja フレックスコンテナ。
   * @ko 플렉스 컨테이너입니다.
   */
  Flex = 5,
  /**
   * Inline flex container.
   *
   * @zh 行内弹性容器。
   * @ja インラインフレックスコンテナ。
   * @ko 인라인 플렉스 컨테이너입니다.
   */
  InlineFlex = 6,
  /**
   * Table.
   *
   * @zh 表格。
   * @ja テーブル。
   * @ko 표입니다.
   */
  Table = 7,
  /**
   * Inline table.
   *
   * @zh 行内表格。
   * @ja インラインテーブル。
   * @ko 인라인 표입니다.
   */
  InlineTable = 8,
  /**
   * Table row.
   *
   * @zh 表格行。
   * @ja テーブル行。
   * @ko 표 행입니다.
   */
  TableRow = 9,
  /**
   * Table row group.
   *
   * @zh 表格行组。
   * @ja テーブル行グループ。
   * @ko 표 행 그룹입니다.
   */
  TableRowGroup = 10,
  /**
   * Table column.
   *
   * @zh 表格列。
   * @ja テーブル列。
   * @ko 표 열입니다.
   */
  TableColumn = 11,
  /**
   * Table column group.
   *
   * @zh 表格列组。
   * @ja テーブル列グループ。
   * @ko 표 열 그룹입니다.
   */
  TableColumnGroup = 12,
  /**
   * Table cell.
   *
   * @zh 表格单元格。
   * @ja テーブルセル。
   * @ko 표 셀입니다.
   */
  TableCell = 13,
}
