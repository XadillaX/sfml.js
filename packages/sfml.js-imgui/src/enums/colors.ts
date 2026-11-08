/**
 * Color slots in ImGuiStyle, also accepted by PushStyleColor().
 *
 * @zh ImGuiStyle 中的颜色槽位，也用于 PushStyleColor()。
 * @ja ImGuiStyle の色枠。PushStyleColor() にも指定できる。
 * @ko ImGuiStyle의 색상 슬롯. PushStyleColor()에도 사용.
 */
export const ImGuiCol = Object.freeze({
  /**
   * Normal text color.
   *
   * @zh 普通文本颜色。
   * @ja 通常の文字色。
   * @ko 일반 텍스트 색.
   */
  Text: 0,
  /**
   * Disabled text color.
   *
   * @zh 禁用文本颜色。
   * @ja 無効状態の文字色。
   * @ko 비활성 텍스트 색.
   */
  TextDisabled: 1,
  /**
   * Regular window background.
   *
   * @zh 普通窗口背景。
   * @ja 通常のウィンドウ背景。
   * @ko 일반 창 배경.
   */
  WindowBg: 2,
  /**
   * Child-window background.
   *
   * @zh 子窗口背景。
   * @ja 子ウィンドウ背景。
   * @ko 자식 창 배경.
   */
  ChildBg: 3,
  /**
   * Popup, menu and tooltip window background.
   *
   * @zh 弹窗、菜单和提示窗口背景。
   * @ja ポップアップ、メニュー、ツールチップの背景。
   * @ko 팝업, 메뉴 및 툴팁 창 배경.
   */
  PopupBg: 4,
  /**
   * Standard border color.
   *
   * @zh 标准边框颜色。
   * @ja 標準の枠色。
   * @ko 기본 테두리 색.
   */
  Border: 5,
  /**
   * Border shadow color.
   *
   * @zh 边框阴影颜色。
   * @ja 枠の影の色。
   * @ko 테두리 그림자 색.
   */
  BorderShadow: 6,
  /**
   * Background of framed inputs, sliders, checkboxes and plots.
   *
   * @zh 带框输入、滑块、复选框和图表的背景。
   * @ja 枠付き入力、スライダー、チェックボックス、プロットの背景。
   * @ko 프레임 입력, 슬라이더, 체크박스 및 그래프 배경.
   */
  FrameBg: 7,
  /**
   * Framed-widget background while hovered.
   *
   * @zh 带框控件悬停时的背景。
   * @ja 枠付きウィジェットのホバー中の背景。
   * @ko 프레임 위젯 호버 배경.
   */
  FrameBgHovered: 8,
  /**
   * Framed-widget background while active.
   *
   * @zh 带框控件激活时的背景。
   * @ja 枠付きウィジェットの操作中の背景。
   * @ko 프레임 위젯 활성 상태 배경.
   */
  FrameBgActive: 9,
  /**
   * Unfocused window title-bar background.
   *
   * @zh 未聚焦窗口的标题栏背景。
   * @ja フォーカスのないウィンドウのタイトル背景。
   * @ko 포커스 없는 창의 제목 표시줄 배경.
   */
  TitleBg: 10,
  /**
   * Focused window title-bar background.
   *
   * @zh 聚焦窗口的标题栏背景。
   * @ja フォーカス中のウィンドウのタイトル背景。
   * @ko 포커스된 창의 제목 표시줄 배경.
   */
  TitleBgActive: 11,
  /**
   * Collapsed window title-bar background.
   *
   * @zh 折叠窗口的标题栏背景。
   * @ja 折り畳まれたウィンドウのタイトル背景。
   * @ko 접힌 창의 제목 표시줄 배경.
   */
  TitleBgCollapsed: 12,
  /**
   * Menu-bar background.
   *
   * @zh 菜单栏背景。
   * @ja メニューバー背景。
   * @ko 메뉴 바 배경.
   */
  MenuBarBg: 13,
  /**
   * Scrollbar track background.
   *
   * @zh 滚动条轨道背景。
   * @ja スクロールバーの軌道背景。
   * @ko 스크롤바 트랙 배경.
   */
  ScrollbarBg: 14,
  /**
   * Scrollbar grab color at rest.
   *
   * @zh 滚动条拖柄静止颜色。
   * @ja 通常のスクロールつまみの色。
   * @ko 기본 스크롤바 손잡이 색.
   */
  ScrollbarGrab: 15,
  /**
   * Scrollbar grab color while hovered.
   *
   * @zh 滚动条拖柄悬停颜色。
   * @ja ホバー中のスクロールつまみの色。
   * @ko 호버된 스크롤바 손잡이 색.
   */
  ScrollbarGrabHovered: 16,
  /**
   * Scrollbar grab color while dragged.
   *
   * @zh 滚动条拖柄拖动颜色。
   * @ja ドラッグ中のスクロールつまみの色。
   * @ko 드래그 중인 스크롤바 손잡이 색.
   */
  ScrollbarGrabActive: 17,
  /**
   * Checkbox tick and selected radio-button circle.
   *
   * @zh 复选框勾号和选中单选按钮圆点。
   * @ja チェック印と選択ラジオボタンの丸。
   * @ko 체크 표시 및 선택된 라디오 버튼 원.
   */
  CheckMark: 18,
  /**
   * Slider grab color at rest.
   *
   * @zh 滑块拖柄静止颜色。
   * @ja 通常のスライダーつまみの色。
   * @ko 기본 슬라이더 손잡이 색.
   */
  SliderGrab: 19,
  /**
   * Slider grab color while active.
   *
   * @zh 滑块拖柄激活颜色。
   * @ja 操作中のスライダーつまみの色。
   * @ko 활성 슬라이더 손잡이 색.
   */
  SliderGrabActive: 20,
  /**
   * Button background at rest.
   *
   * @zh 按钮静止背景。
   * @ja 通常のボタン背景。
   * @ko 기본 버튼 배경.
   */
  Button: 21,
  /**
   * Button background while hovered.
   *
   * @zh 按钮悬停背景。
   * @ja ホバー中のボタン背景。
   * @ko 호버된 버튼 배경.
   */
  ButtonHovered: 22,
  /**
   * Button background while held active.
   *
   * @zh 按钮按住激活时的背景。
   * @ja 押されているボタンの背景。
   * @ko 누르고 있는 버튼 배경.
   */
  ButtonActive: 23,
  /**
   * Background for collapsing headers, tree nodes, selectables and menu items.
   *
   * @zh 折叠标题、树节点、可选项和菜单项背景。
   * @ja 折り畳み見出し、ツリーノード、選択項目、メニュー項目の背景。
   * @ko 접이식 제목, 트리 노드, 선택 항목 및 메뉴 항목 배경.
   */
  Header: 24,
  /**
   * Hovered background for headers, tree nodes, selectables and menu items.
   *
   * @zh 标题、树节点、可选项和菜单项的悬停背景。
   * @ja 見出し、ツリー、選択項目、メニュー項目のホバー背景。
   * @ko 제목, 트리, 선택 항목 및 메뉴 항목의 호버 배경.
   */
  HeaderHovered: 25,
  /**
   * Active background for headers, tree nodes, selectables and menu items.
   *
   * @zh 标题、树节点、可选项和菜单项的激活背景。
   * @ja 見出し、ツリー、選択項目、メニュー項目の操作中背景。
   * @ko 제목, 트리, 선택 항목 및 메뉴 항목의 활성 배경.
   */
  HeaderActive: 26,
  /**
   * Separator line color at rest.
   *
   * @zh 分隔线静止颜色。
   * @ja 通常の区切り線の色。
   * @ko 기본 구분선 색.
   */
  Separator: 27,
  /**
   * Interactive separator color while hovered.
   *
   * @zh 交互式分隔线悬停颜色。
   * @ja 操作可能な区切り線のホバー色。
   * @ko 조작 가능한 구분선 호버 색.
   */
  SeparatorHovered: 28,
  /**
   * Interactive separator color while dragged.
   *
   * @zh 交互式分隔线拖动颜色。
   * @ja 操作可能な区切り線のドラッグ色。
   * @ko 조작 가능한 구분선 드래그 색.
   */
  SeparatorActive: 29,
  /**
   * Window corner resize-grip color at rest.
   *
   * @zh 窗口角部缩放拖柄的静止颜色。
   * @ja ウィンドウ隅のサイズ変更グリップの通常色。
   * @ko 창 모서리 크기 조절 그립 기본 색.
   */
  ResizeGrip: 30,
  /**
   * Window resize-grip color while hovered.
   *
   * @zh 窗口缩放拖柄悬停颜色。
   * @ja サイズ変更グリップのホバー色。
   * @ko 창 크기 조절 그립 호버 색.
   */
  ResizeGripHovered: 31,
  /**
   * Window resize-grip color while dragged.
   *
   * @zh 窗口缩放拖柄拖动颜色。
   * @ja サイズ変更グリップのドラッグ色。
   * @ko 창 크기 조절 그립 드래그 색.
   */
  ResizeGripActive: 32,
  /**
   * Tab background while hovered.
   *
   * @zh 标签悬停背景。
   * @ja タブのホバー背景。
   * @ko 탭 호버 배경.
   */
  TabHovered: 33,
  /**
   * Unselected tab background in a focused tab bar.
   *
   * @zh 已聚焦标签栏中未选中标签的背景。
   * @ja フォーカス中タブバーの未選択タブ背景。
   * @ko 포커스된 탭 표시줄의 미선택 탭 배경.
   */
  Tab: 34,
  /**
   * Selected tab background in a focused tab bar.
   *
   * @zh 已聚焦标签栏中选中标签的背景。
   * @ja フォーカス中タブバーの選択タブ背景。
   * @ko 포커스된 탭 표시줄의 선택 탭 배경.
   */
  TabSelected: 35,
  /**
   * Selected tab's top line in a focused tab bar.
   *
   * @zh 已聚焦标签栏中选中标签的顶部线条。
   * @ja フォーカス中タブバーの選択タブ上線。
   * @ko 포커스된 탭 표시줄의 선택 탭 위쪽 선.
   */
  TabSelectedOverline: 36,
  /**
   * Unselected tab background in an unfocused tab bar.
   *
   * @zh 未聚焦标签栏中未选中标签的背景。
   * @ja 非フォーカスのタブバーの未選択タブ背景。
   * @ko 포커스 없는 탭 표시줄의 미선택 탭 배경.
   */
  TabDimmed: 37,
  /**
   * Selected tab background in an unfocused tab bar.
   *
   * @zh 未聚焦标签栏中选中标签的背景。
   * @ja 非フォーカスのタブバーの選択タブ背景。
   * @ko 포커스 없는 탭 표시줄의 선택 탭 배경.
   */
  TabDimmedSelected: 38,
  /**
   * Selected tab's top line in an unfocused tab bar.
   *
   * @zh 未聚焦标签栏中选中标签的顶部线条。
   * @ja 非フォーカスのタブバーの選択タブ上線。
   * @ko 포커스 없는 탭 표시줄의 선택 탭 위쪽 선.
   */
  TabDimmedSelectedOverline: 39,
  /**
   * Line-plot stroke color.
   *
   * @zh 折线图线条颜色。
   * @ja 折れ線プロットの線色。
   * @ko 선 그래프 선 색.
   */
  PlotLines: 40,
  /**
   * Hovered segment color in a line plot.
   *
   * @zh 折线图悬停线段颜色。
   * @ja 折れ線プロットのホバー区間色。
   * @ko 선 그래프의 호버된 구간 색.
   */
  PlotLinesHovered: 41,
  /**
   * Histogram bar fill color.
   *
   * @zh 直方图柱体填充颜色。
   * @ja ヒストグラム棒の塗り色。
   * @ko 히스토그램 막대 채움 색.
   */
  PlotHistogram: 42,
  /**
   * Hovered histogram bar fill color.
   *
   * @zh 直方图悬停柱体填充颜色。
   * @ja ホバー中ヒストグラム棒の塗り色。
   * @ko 호버된 히스토그램 막대 채움 색.
   */
  PlotHistogramHovered: 43,
  /**
   * Table header-row background.
   *
   * @zh 表格表头行背景。
   * @ja 表の見出し行背景。
   * @ko 표 머리글 행 배경.
   */
  TableHeaderBg: 44,
  /**
   * Table outer and header border color.
   *
   * @zh 表格外边框及表头边框颜色。
   * @ja 表の外枠と見出し枠の色。
   * @ko 표 바깥 및 머리글 테두리 색.
   */
  TableBorderStrong: 45,
  /**
   * Table inner border color.
   *
   * @zh 表格内部边框颜色。
   * @ja 表の内枠の色。
   * @ko 표 안쪽 테두리 색.
   */
  TableBorderLight: 46,
  /**
   * Background for even-indexed table rows with RowBg enabled.
   *
   * @zh 启用 RowBg 时，偶数索引表格行背景。
   * @ja RowBg 有効時の偶数添字の表行背景。
   * @ko RowBg 활성화 시 짝수 인덱스 표 행 배경.
   */
  TableRowBg: 47,
  /**
   * Background for odd-indexed table rows with RowBg enabled.
   *
   * @zh 启用 RowBg 时，奇数索引表格行背景。
   * @ja RowBg 有効時の奇数添字の表行背景。
   * @ko RowBg 활성화 시 홀수 인덱스 표 행 배경.
   */
  TableRowBgAlt: 48,
  /**
   * Hyperlink text color.
   *
   * @zh 超链接文本颜色。
   * @ja ハイパーリンクの文字色。
   * @ko 하이퍼링크 텍스트 색.
   */
  TextLink: 49,
  /**
   * Background behind selected text.
   *
   * @zh 选中文本后方的背景。
   * @ja 選択文字の背後の背景。
   * @ko 선택된 텍스트 뒤 배경.
   */
  TextSelectedBg: 50,
  /**
   * Rectangle highlighting a drag-and-drop target.
   *
   * @zh 拖放目标高亮矩形颜色。
   * @ja ドロップ先を強調する矩形の色。
   * @ko 드롭 대상을 강조하는 사각형 색.
   */
  DragDropTarget: 51,
  /**
   * Visible keyboard/gamepad navigation cursor outline.
   *
   * @zh 可见的键盘或手柄导航光标轮廓。
   * @ja 表示中のキー・パッドナビゲーションカーソルの枠色。
   * @ko 표시되는 키보드 및 게임패드 탐색 커서 윤곽선.
   */
  NavCursor: 52,
  /**
   * Window highlight during Ctrl+Tab window switching.
   *
   * @zh Ctrl+Tab 切换窗口时的窗口高亮。
   * @ja Ctrl+Tab 切り替え中のウィンドウ強調色。
   * @ko Ctrl+Tab 창 전환 중 창 강조 색.
   */
  NavWindowingHighlight: 53,
  /**
   * Screen-dimming overlay behind the Ctrl+Tab window list.
   *
   * @zh Ctrl+Tab 窗口列表后方的屏幕变暗覆盖层。
   * @ja Ctrl+Tab ウィンドウ一覧の背後を暗くする色。
   * @ko Ctrl+Tab 창 목록 뒤 화면을 어둡게 하는 덮개 색.
   */
  NavWindowingDimBg: 54,
  /**
   * Screen-dimming overlay behind an active modal window.
   *
   * @zh 活动模态窗口后方的屏幕变暗覆盖层。
   * @ja 有効なモーダルウィンドウの背後を暗くする色。
   * @ko 활성 모달 창 뒤 화면을 어둡게 하는 덮개 색.
   */
  ModalWindowDimBg: 55,
  /**
   * Number of color slots; not a color slot.
   *
   * @zh 颜色槽位数量，不是颜色槽位。
   * @ja 色枠の個数。色枠ではない。
   * @ko 색상 슬롯 수. 색상 슬롯이 아님.
   */
  COUNT: 56,
  /**
   * Legacy TabSelected alias: selected tab in a focused bar.
   *
   * @zh TabSelected 旧别名：聚焦栏中的选中标签。
   * @ja TabSelected の旧名。フォーカス中バーの選択タブ。
   * @ko TabSelected의 구형 별칭. 포커스된 표시줄의 선택 탭.
   */
  TabActive: 35,
  /**
   * Legacy TabDimmed alias: unselected tab in an unfocused bar.
   *
   * @zh TabDimmed 旧别名：未聚焦栏中的未选标签。
   * @ja TabDimmed の旧名。非フォーカスバーの未選択タブ。
   * @ko TabDimmed의 구형 별칭. 포커스 없는 표시줄의 미선택 탭.
   */
  TabUnfocused: 37,
  /**
   * Legacy TabDimmedSelected alias: selected tab in an unfocused bar.
   *
   * @zh TabDimmedSelected 旧别名：未聚焦栏中的选中标签。
   * @ja TabDimmedSelected の旧名。非フォーカスバーの選択タブ。
   * @ko TabDimmedSelected의 구형 별칭. 포커스 없는 표시줄의 선택 탭.
   */
  TabUnfocusedActive: 38,
  /**
   * Legacy NavCursor alias: keyboard/gamepad navigation outline.
   *
   * @zh NavCursor 旧别名：键盘或手柄导航轮廓。
   * @ja NavCursor の旧名。キー・パッド移動の輪郭。
   * @ko NavCursor의 구형 별칭. 키보드 및 게임패드 탐색 윤곽선.
   */
  NavHighlight: 52,
} as const);

/**
 * Numeric index of a style color slot.
 *
 * @zh 样式颜色槽位的数值索引。
 * @ja スタイル色枠の数値添字。
 * @ko 스타일 색상 슬롯의 숫자 인덱스.
 */
export type ImGuiCol = number;

/**
 * Color editor, picker and preview options. Display format is independent
 * of the RGB/HSV format stored in the supplied color data.
 *
 * @zh 颜色编辑器、拾色器和预览选项。显示格式与颜色数据的 RGB/HSV 存储格式独立。
 * @ja 色編集、選択、プレビューの設定。表示方式とデータの RGB/HSV 形式は別。
 * @ko 색 편집, 선택 및 미리 보기 설정. 표시 형식과 데이터 RGB/HSV 형식은 별개.
 */
export const ImGuiColorEditFlags = Object.freeze({
  /**
   * Use application defaults and the user's selected color-edit options.
   *
   * @zh 使用应用默认值和用户选择的颜色编辑选项。
   * @ja アプリの既定値とユーザーの色編集設定を使う。
   * @ko 앱 기본값과 사용자가 선택한 색 편집 설정 사용.
   */
  None: 0,
  /**
   * Ignore alpha entirely; read only three color components.
   *
   * @zh 完全忽略透明度，仅读取三个颜色分量。
   * @ja アルファを無視し、色の三成分のみ読み取る。
   * @ko 알파를 완전히 무시하고 색 성분 세 개만 읽음.
   */
  NoAlpha: 2,
  /**
   * ColorEdit: do not open a picker when the color square is clicked.
   *
   * @zh ColorEdit：点击色块时不打开拾色器。
   * @ja ColorEdit の色見本クリックで選択画面を開かない。
   * @ko ColorEdit 색상 사각형 클릭 시 선택기 열기 금지.
   */
  NoPicker: 4,
  /**
   * ColorEdit: disable the right-click options menu.
   *
   * @zh ColorEdit：禁用右键选项菜单。
   * @ja ColorEdit の右クリック設定メニューを無効化。
   * @ko ColorEdit 오른쪽 클릭 설정 메뉴 금지.
   */
  NoOptions: 8,
  /**
   * Hide the small preview square beside color inputs.
   *
   * @zh 隐藏颜色输入旁的小预览色块。
   * @ja 色入力の横の小さな色見本を隠す。
   * @ko 색 입력 옆 작은 미리 보기 사각형 숨김.
   */
  NoSmallPreview: 16,
  /**
   * Hide numeric sliders and text inputs in color editors/pickers.
   *
   * @zh 隐藏颜色编辑器或拾色器中的数值滑块和文本输入。
   * @ja 色編集・選択の数値スライダーと文字入力を隠す。
   * @ko 색 편집기 및 선택기의 숫자 슬라이더와 텍스트 입력 숨김.
   */
  NoInputs: 32,
  /**
   * Suppress tooltips when hovering a color preview.
   *
   * @zh 悬停颜色预览时不显示提示。
   * @ja 色見本のホバーツールチップを隠す。
   * @ko 색 미리 보기 호버 툴팁 숨김.
   */
  NoTooltip: 64,
  /**
   * Hide the inline label, retaining it in tooltips and the picker.
   *
   * @zh 隐藏行内标签，但在提示和拾色器中保留。
   * @ja 行内ラベルを隠すが、ツールチップと選択画面には残す。
   * @ko 인라인 라벨은 숨기고 툴팁과 선택기에는 유지.
   */
  NoLabel: 128,
  /**
   * ColorPicker: replace the large side preview with a small preview.
   *
   * @zh ColorPicker：将侧边大预览替换为小预览。
   * @ja ColorPicker の大きな側面見本を小さな見本にする。
   * @ko ColorPicker의 큰 측면 미리 보기를 작은 미리 보기로 대체.
   */
  NoSidePreview: 256,
  /**
   * Disable ColorEdit drop targets and ColorButton drag sources.
   *
   * @zh 禁用 ColorEdit 拖放目标和 ColorButton 拖动源。
   * @ja ColorEdit のドロップ先と ColorButton のドラッグ元を無効化。
   * @ko ColorEdit 드롭 대상과 ColorButton 드래그 원본 비활성화.
   */
  NoDragDrop: 512,
  /**
   * ColorButton: do not draw the normally enforced border.
   *
   * @zh ColorButton：不绘制默认强制显示的边框。
   * @ja ColorButton の通常強制される枠を描かない。
   * @ko ColorButton의 기본 강제 테두리 표시 금지.
   */
  NoBorder: 1024,
  /**
   * Make the preview opaque without disabling alpha editing.
   *
   * @zh 预览不透明，但不禁用透明度编辑。
   * @ja プレビューを不透明にするがアルファ編集は無効化しない。
   * @ko 알파 편집은 유지하면서 미리 보기만 불투명하게 표시.
   */
  AlphaOpaque: 2048,
  /**
   * Do not draw the checkerboard behind transparent previews.
   *
   * @zh 不在透明预览后方绘制棋盘格。
   * @ja 透明プレビュー背後の市松模様を描かない。
   * @ko 투명 미리 보기 뒤 체크무늬 표시 금지.
   */
  AlphaNoBg: 4096,
  /**
   * Split the preview into opaque and transparent halves.
   *
   * @zh 预览一半不透明、一半透明。
   * @ja プレビューを不透明と透明の半分ずつに分ける。
   * @ko 미리 보기를 불투명 및 투명한 절반으로 나눔.
   */
  AlphaPreviewHalf: 8192,
  /**
   * Show a vertical alpha gradient bar in the picker.
   *
   * @zh 在拾色器中显示垂直透明度渐变条。
   * @ja 色選択画面に縦アルファグラデーションバーを表示。
   * @ko 선택기에 세로 알파 그라데이션 막대 표시.
   */
  AlphaBar: 65536,
  /**
   * Remove 0..1 limits in RGBA editing; usually pair with Float.
   *
   * @zh 取消 RGBA 编辑的 0..1 限制；通常与 Float 配合。
   * @ja RGBA 編集の 0..1 制限を解除。通常 Float と併用。
   * @ko RGBA 편집의 0..1 제한 제거. 보통 Float와 함께 사용.
   */
  HDR: 524288,
  /**
   * Show RGB inputs; ColorPicker may combine multiple display modes.
   *
   * @zh 显示 RGB 输入；ColorPicker 可组合多种显示模式。
   * @ja RGB 入力を表示。ColorPicker は複数の表示方式を併用可能。
   * @ko RGB 입력 표시. ColorPicker는 여러 표시 모드 조합 가능.
   */
  DisplayRGB: 1048576,
  /**
   * Show HSV inputs; does not change the stored color format.
   *
   * @zh 显示 HSV 输入，不改变颜色存储格式。
   * @ja HSV 入力を表示。格納される色形式は変えない。
   * @ko HSV 입력 표시. 저장된 색 형식은 변경하지 않음.
   */
  DisplayHSV: 2097152,
  /**
   * Show hexadecimal color input.
   *
   * @zh 显示十六进制颜色输入。
   * @ja 十六進数の色入力を表示。
   * @ko 16진수 색 입력 표시.
   */
  DisplayHex: 4194304,
  /**
   * Display components as integers from 0 to 255; storage stays unchanged.
   *
   * @zh 分量显示为 0 到 255 的整数，存储格式不变。
   * @ja 成分を 0 から 255 の整数で表示。格納形式は変えない。
   * @ko 성분을 0부터 255 정수로 표시. 저장 형식은 유지.
   */
  Uint8: 8388608,
  /**
   * Display floating-point components without integer round-tripping.
   *
   * @zh 显示浮点分量，不经整数往返转换。
   * @ja 整数への往復変換なしで浮動小数点成分を表示する。
   * @ko 정수 왕복 변환 없이 부동 소수점 성분 표시.
   */
  Float: 16777216,
  /**
   * Picker with a hue bar and saturation/value rectangle.
   *
   * @zh 使用色相条及饱和度、明度矩形的拾色器。
   * @ja 色相バーと彩度・明度の矩形を使う色選択。
   * @ko 색상 막대와 채도 및 명도 사각형을 사용하는 선택기.
   */
  PickerHueBar: 33554432,
  /**
   * Picker with a hue wheel and saturation/value triangle.
   *
   * @zh 使用色相环及饱和度、明度三角形的拾色器。
   * @ja 色相環と彩度・明度の三角形を使う色選択。
   * @ko 색상환과 채도 및 명도 삼각형을 사용하는 선택기.
   */
  PickerHueWheel: 67108864,
  /**
   * Read and write color data as RGB, independently of display format.
   *
   * @zh 按 RGB 读写颜色数据，与显示格式无关。
   * @ja 表示方式に関係なく色データを RGB で読み書きする。
   * @ko 표시 형식과 무관하게 색 데이터를 RGB로 읽고 씀.
   */
  InputRGB: 134217728,
  /**
   * Read and write color data as HSV, independently of display format.
   *
   * @zh 按 HSV 读写颜色数据，与显示格式无关。
   * @ja 表示方式に関係なく色データを HSV で読み書きする。
   * @ko 표시 형식과 무관하게 색 데이터를 HSV로 읽고 씀.
   */
  InputHSV: 268435456,
  /**
   * Default combination: Uint8 display, RGB display/data and hue-bar picker.
   *
   * @zh 默认组合：Uint8 显示、RGB 显示及数据、色相条拾色器。
   * @ja 既定の組み合わせ。Uint8 表示、RGB 表示・データ、色相バー。
   * @ko 기본 조합. Uint8 표시, RGB 표시 및 데이터, 색상 막대 선택기.
   */
  DefaultOptions_: 177209344,
  /**
   * Internal mask of alpha editing and preview options.
   *
   * @zh 透明度编辑与预览选项的内部掩码。
   * @ja アルファ編集とプレビュー設定の内部マスク。
   * @ko 알파 편집 및 미리 보기 설정의 내부 마스크.
   */
  AlphaMask_: 14338,
  /**
   * Internal mask of RGB/HSV/hex display choices.
   *
   * @zh RGB/HSV/十六进制显示选择的内部掩码。
   * @ja RGB/HSV/十六進表示選択の内部マスク。
   * @ko RGB/HSV/16진수 표시 선택의 내부 마스크.
   */
  DisplayMask_: 7340032,
  /**
   * Internal mask of integer versus float display formatting.
   *
   * @zh 整数或浮点显示格式的内部掩码。
   * @ja 整数・浮動小数点表示形式の内部マスク。
   * @ko 정수 및 부동 소수점 표시 형식의 내부 마스크.
   */
  DataTypeMask_: 25165824,
  /**
   * Internal mask of hue-bar versus hue-wheel picker choices.
   *
   * @zh 色相条或色相环拾色器选择的内部掩码。
   * @ja 色相バー・色相環の選択方式の内部マスク。
   * @ko 색상 막대 및 색상환 선택기의 내부 마스크.
   */
  PickerMask_: 100663296,
  /**
   * Internal mask of RGB versus HSV storage formats.
   *
   * @zh RGB 或 HSV 存储格式的内部掩码。
   * @ja RGB・HSV 格納形式の内部マスク。
   * @ko RGB 및 HSV 저장 형식의 내부 마스크.
   */
  InputMask_: 402653184,
  /**
   * Obsolete zero-valued option: transparent preview is now the default.
   *
   * @zh 已废弃的零值选项：透明预览现为默认行为。
   * @ja 廃止済みのゼロ値設定。透明プレビューは現在の既定動作。
   * @ko 폐기된 0값 설정. 투명 미리 보기가 현재 기본 동작.
   */
  AlphaPreview: 0,
} as const);

/**
 * Bitwise combination of color editing and preview options.
 *
 * @zh 颜色编辑与预览选项的按位组合。
 * @ja 色編集とプレビュー設定のビット組み合わせ。
 * @ko 색 편집 및 미리 보기 설정의 비트 조합.
 */
export type ImGuiColorEditFlags = number;
