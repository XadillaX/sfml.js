/**
 * Style fields temporarily overridden by PushStyleVar()/PopStyleVar().
 *
 * @zh 由 PushStyleVar()/PopStyleVar() 临时覆盖的样式字段。
 * @ja PushStyleVar()/PopStyleVar() で一時変更するスタイル項目。
 * @ko PushStyleVar()/PopStyleVar()로 임시 변경하는 스타일 항목.
 */
export const ImGuiStyleVar = Object.freeze({
  /**
   * Global opacity multiplier, from zero to one.
   *
   * @zh 全局不透明度乘数，范围零到一。
   * @ja 全体の不透明度倍率。ゼロから一。
   * @ko 전체 불투명도 배율. 0부터 1.
   */
  Alpha: 0,
  /**
   * Additional opacity multiplier inside disabled sections.
   *
   * @zh 禁用区域内额外的不透明度乘数。
   * @ja 無効セクション内で追加適用する不透明度倍率。
   * @ko 비활성 구역 안의 추가 불투명도 배율.
   */
  DisabledAlpha: 1,
  /**
   * Horizontal and vertical inner window padding.
   *
   * @zh 窗口水平和垂直内边距。
   * @ja ウィンドウ内の横・縦余白。
   * @ko 창 안쪽 가로 및 세로 여백.
   */
  WindowPadding: 2,
  /**
   * Window corner radius in pixels.
   *
   * @zh 窗口圆角半径，单位像素。
   * @ja ウィンドウ角丸のピクセル半径。
   * @ko 창 모서리 반지름. 픽셀 단위.
   */
  WindowRounding: 3,
  /**
   * Window border thickness in pixels.
   *
   * @zh 窗口边框厚度，单位像素。
   * @ja ウィンドウ枠のピクセル幅。
   * @ko 창 테두리 두께. 픽셀 단위.
   */
  WindowBorderSize: 4,
  /**
   * Minimum window width and height.
   *
   * @zh 窗口最小宽度和高度。
   * @ja ウィンドウの最小幅と高さ。
   * @ko 창 최소 너비 및 높이.
   */
  WindowMinSize: 5,
  /**
   * Title alignment: zero is left/top, one is right/bottom.
   *
   * @zh 标题对齐：零为左上，一为右下。
   * @ja タイトル位置。ゼロは左上、一は右下。
   * @ko 제목 정렬. 0은 왼쪽 위, 1은 오른쪽 아래.
   */
  WindowTitleAlign: 6,
  /**
   * Child-window corner radius in pixels.
   *
   * @zh 子窗口圆角半径，单位像素。
   * @ja 子ウィンドウ角丸のピクセル半径。
   * @ko 자식 창 모서리 반지름. 픽셀 단위.
   */
  ChildRounding: 7,
  /**
   * Child-window border thickness in pixels.
   *
   * @zh 子窗口边框厚度，单位像素。
   * @ja 子ウィンドウ枠のピクセル幅。
   * @ko 자식 창 테두리 두께. 픽셀 단위.
   */
  ChildBorderSize: 8,
  /**
   * Popup and tooltip corner radius in pixels.
   *
   * @zh 弹窗和提示窗口圆角半径，单位像素。
   * @ja ポップアップとツールチップの角丸半径（ピクセル）。
   * @ko 팝업 및 툴팁 모서리 반지름. 픽셀 단위.
   */
  PopupRounding: 9,
  /**
   * Popup and tooltip border thickness in pixels.
   *
   * @zh 弹窗和提示窗口边框厚度，单位像素。
   * @ja ポップアップとツールチップの枠幅（ピクセル）。
   * @ko 팝업 및 툴팁 테두리 두께. 픽셀 단위.
   */
  PopupBorderSize: 10,
  /**
   * Horizontal and vertical padding inside framed widgets.
   *
   * @zh 带框控件的水平和垂直内边距。
   * @ja 枠付きウィジェット内の横・縦余白。
   * @ko 프레임 위젯 안쪽 가로 및 세로 여백.
   */
  FramePadding: 11,
  /**
   * Framed-widget corner radius in pixels.
   *
   * @zh 带框控件圆角半径，单位像素。
   * @ja 枠付きウィジェットの角丸半径（ピクセル）。
   * @ko 프레임 위젯 모서리 반지름. 픽셀 단위.
   */
  FrameRounding: 12,
  /**
   * Framed-widget border thickness in pixels.
   *
   * @zh 带框控件边框厚度，单位像素。
   * @ja 枠付きウィジェットの枠幅（ピクセル）。
   * @ko 프레임 위젯 테두리 두께. 픽셀 단위.
   */
  FrameBorderSize: 13,
  /**
   * Horizontal and vertical spacing between widgets.
   *
   * @zh 控件之间的水平和垂直间距。
   * @ja ウィジェット間の横・縦間隔。
   * @ko 위젯 사이 가로 및 세로 간격.
   */
  ItemSpacing: 14,
  /**
   * Spacing between parts of a widget, such as a slider and its label.
   *
   * @zh 控件各部分之间的间距，例如滑块与标签之间。
   * @ja スライダーとラベルなど、ウィジェット内部の部品間隔。
   * @ko 슬라이더와 라벨 등 위젯 내부 요소 간격.
   */
  ItemInnerSpacing: 15,
  /**
   * Horizontal indentation step for tree levels.
   *
   * @zh 树层级的水平缩进步长。
   * @ja ツリー階層ごとの横字下げ幅。
   * @ko 트리 단계별 가로 들여쓰기 폭.
   */
  IndentSpacing: 16,
  /**
   * Horizontal and vertical table-cell padding.
   *
   * @zh 表格单元格的水平和垂直内边距。
   * @ja 表セル内の横・縦余白。
   * @ko 표 셀 안쪽 가로 및 세로 여백.
   */
  CellPadding: 17,
  /**
   * Vertical scrollbar width and horizontal scrollbar height.
   *
   * @zh 垂直滚动条宽度及水平滚动条高度。
   * @ja 縦スクロールバーの幅と横スクロールバーの高さ。
   * @ko 세로 스크롤바 너비 및 가로 스크롤바 높이.
   */
  ScrollbarSize: 18,
  /**
   * Scrollbar grab corner radius.
   *
   * @zh 滚动条拖柄圆角半径。
   * @ja スクロールつまみの角丸半径。
   * @ko 스크롤바 손잡이 모서리 반지름.
   */
  ScrollbarRounding: 19,
  /**
   * Minimum width/height of slider and scrollbar grabs.
   *
   * @zh 滑块和滚动条拖柄的最小宽度或高度。
   * @ja スライダーやスクロールつまみの最小幅・高さ。
   * @ko 슬라이더 및 스크롤바 손잡이 최소 너비와 높이.
   */
  GrabMinSize: 20,
  /**
   * Slider grab corner radius.
   *
   * @zh 滑块拖柄圆角半径。
   * @ja スライダーつまみの角丸半径。
   * @ko 슬라이더 손잡이 모서리 반지름.
   */
  GrabRounding: 21,
  /**
   * Border thickness around Image() widgets.
   *
   * @zh Image() 控件周围的边框厚度。
   * @ja Image() ウィジェット周囲の枠幅。
   * @ko Image() 위젯 주위 테두리 두께.
   */
  ImageBorderSize: 22,
  /**
   * Tab upper-corner radius.
   *
   * @zh 标签上方圆角半径。
   * @ja タブ上部の角丸半径。
   * @ko 탭 위쪽 모서리 반지름.
   */
  TabRounding: 23,
  /**
   * Tab border thickness.
   *
   * @zh 标签边框厚度。
   * @ja タブ枠の幅。
   * @ko 탭 테두리 두께.
   */
  TabBorderSize: 24,
  /**
   * Thickness of the separator below the tab bar.
   *
   * @zh 标签栏下方分隔线厚度。
   * @ja タブバー下の区切り線の太さ。
   * @ko 탭 표시줄 아래 구분선 두께.
   */
  TabBarBorderSize: 25,
  /**
   * Thickness of the line above selected tabs.
   *
   * @zh 选中标签上方标记线的厚度。
   * @ja 選択タブの上線の太さ。
   * @ko 선택된 탭 위쪽 선 두께.
   */
  TabBarOverlineSize: 26,
  /**
   * Angled table-header tilt in radians, from -50 to +50 degrees.
   *
   * @zh 倾斜表头角度，以弧度表示，范围 -50 至 +50 度。
   * @ja 斜め表見出しの角度（ラジアン）。範囲は -50 から +50 度。
   * @ko 기울어진 표 머리글 각도(라디안). 범위는 -50도부터 +50도.
   */
  TableAngledHeadersAngle: 27,
  /**
   * Text alignment within angled table headers.
   *
   * @zh 倾斜表头内的文本对齐。
   * @ja 斜め表見出し内の文字位置。
   * @ko 기울어진 표 머리글 안의 텍스트 정렬.
   */
  TableAngledHeadersTextAlign: 28,
  /**
   * Button text alignment; (0.5, 0.5) centers it.
   *
   * @zh 按钮文本对齐；(0.5, 0.5) 为居中。
   * @ja ボタン文字の配置。(0.5, 0.5) で中央。
   * @ko 버튼 텍스트 정렬. (0.5, 0.5)는 가운데.
   */
  ButtonTextAlign: 29,
  /**
   * Selectable text alignment; (0, 0) aligns to the top left.
   *
   * @zh 可选项文本对齐；(0, 0) 为左上对齐。
   * @ja 選択項目の文字位置。(0, 0) は左上。
   * @ko 선택 항목 텍스트 정렬. (0, 0)은 왼쪽 위.
   */
  SelectableTextAlign: 30,
  /**
   * Line thickness for SeparatorText().
   *
   * @zh SeparatorText() 的线条厚度。
   * @ja SeparatorText() の線の太さ。
   * @ko SeparatorText()의 선 두께.
   */
  SeparatorTextBorderSize: 31,
  /**
   * Text alignment within SeparatorText().
   *
   * @zh SeparatorText() 内的文本对齐。
   * @ja SeparatorText() 内の文字位置。
   * @ko SeparatorText() 안의 텍스트 정렬.
   */
  SeparatorTextAlign: 32,
  /**
   * Padding around SeparatorText() labels.
   *
   * @zh SeparatorText() 标签周围的内边距。
   * @ja SeparatorText() ラベル周囲の余白。
   * @ko SeparatorText() 라벨 주위 여백.
   */
  SeparatorTextPadding: 33,
  /**
   * Number of pushable style fields; not a field.
   *
   * @zh 可压栈样式字段数量，不是字段。
   * @ja スタックに積めるスタイル項目数。項目ではない。
   * @ko 스택에 넣을 수 있는 스타일 항목 수. 항목이 아님.
   */
  COUNT: 34,
} as const);

/**
 * Numeric identifier of a pushable style field.
 *
 * @zh 可压栈样式字段的数值标识。
 * @ja スタックで変更するスタイル項目の数値識別子。
 * @ko 스택으로 변경하는 스타일 항목의 숫자 식별자.
 */
export type ImGuiStyleVar = number;

/**
 * Cardinal directions used for navigation and arrow rendering.
 *
 * @zh 用于导航和箭头绘制的四个方向。
 * @ja ナビゲーションと矢印描画に使う四方向。
 * @ko 탐색 및 화살표 표시에 사용하는 네 방향.
 */
export const ImGuiDir = Object.freeze({
  /**
   * No direction.
   *
   * @zh 无方向。
   * @ja 方向なし。
   * @ko 방향 없음.
   */
  None: -1,
  /**
   * Leftward.
   *
   * @zh 向左。
   * @ja 左方向。
   * @ko 왼쪽 방향.
   */
  Left: 0,
  /**
   * Rightward.
   *
   * @zh 向右。
   * @ja 右方向。
   * @ko 오른쪽 방향.
   */
  Right: 1,
  /**
   * Upward.
   *
   * @zh 向上。
   * @ja 上方向。
   * @ko 위쪽 방향.
   */
  Up: 2,
  /**
   * Downward.
   *
   * @zh 向下。
   * @ja 下方向。
   * @ko 아래쪽 방향.
   */
  Down: 3,
  /**
   * Number of cardinal directions; not a direction.
   *
   * @zh 方向数量，不是方向。
   * @ja 四方向の個数。方向指定ではない。
   * @ko 방향 개수. 방향이 아님.
   */
  COUNT: 4,
} as const);

/**
 * Numeric direction identifier.
 *
 * @zh 方向的数值标识。
 * @ja 方向の数値識別子。
 * @ko 방향의 숫자 식별자.
 */
export type ImGuiDir = number;
