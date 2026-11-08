/**
 * Table layout, decoration and interaction options.
 * Choose one sizing policy; sorting supplies specs, not sorted application
 * data.
 *
 * @zh 表格布局、装饰和交互选项。尺寸策略选一个；排序仅提供规格，不替应用排数据。
 * @ja 表の配置、装飾、操作設定。寸法方式は一つ。ソートは指定の通知のみ。
 * @ko 표 배치, 장식 및 동작 설정. 크기 정책은 하나. 정렬은 사양만 제공함.
 */
export const ImGuiTableFlags = Object.freeze({
  /**
   * Use default table behavior.
   *
   * @zh 使用默认表格行为。
   * @ja 標準の表動作。
   * @ko 기본 표 동작.
   */
  None: 0,
  /**
   * Allow users to resize columns.
   *
   * @zh 允许用户调整列宽。
   * @ja 列幅の変更を許可する。
   * @ko 사용자 열 너비 조절 허용.
   */
  Resizable: 1,
  /**
   * Allow dragging headers to reorder columns.
   *
   * @zh 允许拖动表头重新排列列。
   * @ja 見出しドラッグで列を並べ替える。
   * @ko 머리글 드래그로 열 재정렬 허용.
   */
  Reorderable: 2,
  /**
   * Allow hiding columns through the context menu.
   *
   * @zh 允许通过上下文菜单隐藏列。
   * @ja コンテキストメニューで列を隠せる。
   * @ko 컨텍스트 메뉴로 열 숨기기 허용.
   */
  Hideable: 4,
  /**
   * Enable sort controls; read TableGetSortSpecs() and sort data yourself.
   *
   * @zh 启用排序控件；读取 TableGetSortSpecs() 后自行排序数据。
   * @ja ソート操作を有効化。TableGetSortSpecs() を読みデータは自分で並べ替える。
   * @ko 정렬 조작 허용. TableGetSortSpecs()를 읽어 데이터를 직접 정렬해야 함.
   */
  Sortable: 8,
  /**
   * Do not persist column order, width or sorting in INI settings.
   *
   * @zh 不在 INI 设置中保存列顺序、宽度和排序。
   * @ja 列順、幅、ソートを INI に保存しない。
   * @ko 열 순서, 너비 및 정렬을 INI에 저장하지 않음.
   */
  NoSavedSettings: 16,
  /**
   * Open the table context menu by right-clicking body cells too.
   *
   * @zh 右击表体单元格也能打开表格上下文菜单。
   * @ja 本文セルの右クリックでも表メニューを開く。
   * @ko 본문 셀 오른쪽 클릭으로도 표 메뉴 열기.
   */
  ContextMenuInBody: 32,
  /**
   * Alternate TableRowBg and TableRowBgAlt on row background layer zero.
   *
   * @zh 在行背景第零层交替使用 TableRowBg 和 TableRowBgAlt。
   * @ja 行背景の第ゼロ層で TableRowBg と TableRowBgAlt を交互に使う。
   * @ko 행 배경 0번 층에 TableRowBg와 TableRowBgAlt를 번갈아 적용.
   */
  RowBg: 64,
  /**
   * Draw horizontal borders between rows.
   *
   * @zh 绘制行间水平边框。
   * @ja 行間の横枠を描く。
   * @ko 행 사이 가로 테두리 표시.
   */
  BordersInnerH: 128,
  /**
   * Draw top and bottom outer borders.
   *
   * @zh 绘制顶部和底部外边框。
   * @ja 上下の外枠を描く。
   * @ko 위아래 바깥 테두리 표시.
   */
  BordersOuterH: 256,
  /**
   * Draw vertical borders between columns.
   *
   * @zh 绘制列间垂直边框。
   * @ja 列間の縦枠を描く。
   * @ko 열 사이 세로 테두리 표시.
   */
  BordersInnerV: 512,
  /**
   * Draw left and right outer borders.
   *
   * @zh 绘制左右外边框。
   * @ja 左右の外枠を描く。
   * @ko 좌우 바깥 테두리 표시.
   */
  BordersOuterV: 1024,
  /**
   * Draw all horizontal borders.
   *
   * @zh 绘制全部水平边框。
   * @ja 全ての横枠を描く。
   * @ko 모든 가로 테두리 표시.
   */
  BordersH: 384,
  /**
   * Draw all vertical borders.
   *
   * @zh 绘制全部垂直边框。
   * @ja 全ての縦枠を描く。
   * @ko 모든 세로 테두리 표시.
   */
  BordersV: 1536,
  /**
   * Draw borders between all rows and columns.
   *
   * @zh 绘制全部行间和列间边框。
   * @ja 全ての行間・列間の枠を描く。
   * @ko 모든 행과 열 사이 테두리 표시.
   */
  BordersInner: 640,
  /**
   * Draw the complete outer table border.
   *
   * @zh 绘制完整的表格外边框。
   * @ja 表の外周全体に枠を描く。
   * @ko 표 전체 바깥 테두리 표시.
   */
  BordersOuter: 1280,
  /**
   * Draw all inner and outer borders.
   *
   * @zh 绘制全部内外边框。
   * @ja 全ての内枠と外枠を描く。
   * @ko 모든 안쪽 및 바깥 테두리 표시.
   */
  Borders: 1920,
  /**
   * Hide vertical body borders; keep header borders.
   *
   * @zh 隐藏表体垂直边框，保留表头边框。
   * @ja 本文の縦枠を隠し、見出しの枠は残す。
   * @ko 본문 세로 테두리를 숨기고 머리글 테두리는 유지.
   */
  NoBordersInBody: 2048,
  /**
   * Show vertical body borders only when hovered for resizing.
   *
   * @zh 仅在悬停以调整大小时显示表体垂直边框。
   * @ja サイズ変更のホバー時だけ本文の縦枠を表示。
   * @ko 크기 조절을 위해 호버할 때만 본문 세로 테두리 표시.
   */
  NoBordersInBodyUntilResize: 4096,
  /**
   * Default columns to content-fitting fixed widths.
   *
   * @zh 列默认使用匹配内容的固定宽度。
   * @ja 各列を内容に合う固定幅にする。
   * @ko 각 열의 기본값을 내용에 맞는 고정 너비로 설정.
   */
  SizingFixedFit: 8192,
  /**
   * Use the widest content width for all fixed columns; implies
   * NoKeepColumnsVisible.
   *
   * @zh 固定列统一使用最宽内容宽度，并隐含 NoKeepColumnsVisible。
   * @ja 固定列を最も広い内容幅に統一。NoKeepColumnsVisible を含む。
   * @ko 고정 열을 가장 넓은 내용 너비로 통일. NoKeepColumnsVisible 포함.
   */
  SizingFixedSame: 16384,
  /**
   * Stretch columns with weights proportional to content width.
   *
   * @zh 以内容宽度比例为权重拉伸列。
   * @ja 内容幅に比例した重みで列を伸縮する。
   * @ko 내용 너비에 비례하는 가중치로 열 확장.
   */
  SizingStretchProp: 24576,
  /**
   * Stretch columns with equal default weights.
   *
   * @zh 以默认相等权重拉伸列。
   * @ja 既定で等しい重みで列を伸縮する。
   * @ko 기본적으로 같은 가중치로 열 확장.
   */
  SizingStretchSame: 32768,
  /**
   * Fit outer width to columns; requires no scrolling and no stretch columns.
   *
   * @zh 外宽适应各列；要求无滚动且无拉伸列。
   * @ja 外幅を列に合わせる。スクロールと伸縮列のない場合のみ。
   * @ko 바깥 너비를 열에 맞춤. 스크롤과 확장 열이 없어야 함.
   */
  NoHostExtendX: 65536,
  /**
   * With scrolling disabled, stop at outer_size.y and clip excess rows.
   *
   * @zh 禁用滚动时高度止于 outer_size.y，裁剪超出行。
   * @ja スクロールなしで高さを outer_size.y に制限し、超過行を切り取る。
   * @ko 스크롤이 없을 때 높이를 outer_size.y로 제한하고 초과 행 자르기.
   */
  NoHostExtendY: 131072,
  /**
   * Allow columns to become fully hidden when a non-scrolling table shrinks.
   *
   * @zh 不滚动的表格缩小时，允许列完全不可见。
   * @ja 非スクロール表の縮小時に列が完全に見えなくなることを許可。
   * @ko 스크롤 없는 표가 줄어들 때 열이 완전히 숨겨지는 것을 허용.
   */
  NoKeepColumnsVisible: 262144,
  /**
   * Leave remainder pixels unassigned when dividing stretch widths.
   *
   * @zh 分配拉伸宽度时不分配余下像素。
   * @ja 伸縮幅を分割した余りのピクセルを配らない。
   * @ko 확장 너비 분배 시 남은 픽셀을 할당하지 않음.
   */
  PreciseWidths: 524288,
  /**
   * Disable per-column clipping; content may overlap adjacent columns.
   * Generally incompatible with frozen rows/columns.
   *
   * @zh 禁用逐列裁剪，内容可覆盖相邻列；通常与冻结行列不兼容。
   * @ja 列ごとの切り取りを止め、隣の列へはみ出せる。固定行列とは通常非互換。
   * @ko 열별 자르기 금지로 옆 열에 내용이 넘칠 수 있음. 고정 행과 열과는 보통 비호환.
   */
  NoClip: 1048576,
  /**
   * Add horizontal padding at the table's outer edges.
   *
   * @zh 在表格左右外边缘添加内边距。
   * @ja 表の左右外端に余白を付ける。
   * @ko 표 좌우 바깥 가장자리에 여백 추가.
   */
  PadOuterX: 2097152,
  /**
   * Remove horizontal padding at the table's outer edges.
   *
   * @zh 移除表格左右外边缘内边距。
   * @ja 表の左右外端の余白を除く。
   * @ko 표 좌우 바깥 가장자리 여백 제거.
   */
  NoPadOuterX: 4194304,
  /**
   * Remove horizontal padding between columns.
   *
   * @zh 移除列间水平内边距。
   * @ja 列間の横余白を除く。
   * @ko 열 사이 가로 여백 제거.
   */
  NoPadInnerX: 8388608,
  /**
   * Enable horizontal scrolling; BeginTable() needs an outer container size.
   *
   * @zh 启用水平滚动；BeginTable() 需指定外部容器尺寸。
   * @ja 横スクロールを有効化。BeginTable() に外側の寸法が必要。
   * @ko 가로 스크롤 허용. BeginTable()에 바깥 컨테이너 크기 필요.
   */
  ScrollX: 16777216,
  /**
   * Enable vertical scrolling; BeginTable() needs an outer container size.
   *
   * @zh 启用垂直滚动；BeginTable() 需指定外部容器尺寸。
   * @ja 縦スクロールを有効化。BeginTable() に外側の寸法が必要。
   * @ko 세로 스크롤 허용. BeginTable()에 바깥 컨테이너 크기 필요.
   */
  ScrollY: 33554432,
  /**
   * Allow Shift+header-click to build multi-column sort specifications.
   *
   * @zh 允许 Shift+点击表头创建多列排序规格。
   * @ja Shift+見出しクリックで複数列ソート指定を作れる。
   * @ko Shift+머리글 클릭으로 다중 열 정렬 사양 생성 허용.
   */
  SortMulti: 67108864,
  /**
   * Allow an unsorted state and disable default sorting.
   *
   * @zh 允许无排序状态并禁用默认排序。
   * @ja ソートなしの状態を許可し、既定ソートを無効化する。
   * @ko 정렬 없는 상태를 허용하고 기본 정렬 금지.
   */
  SortTristate: 134217728,
  /**
   * Highlight the header of the hovered column.
   *
   * @zh 高亮鼠标悬停列的表头。
   * @ja ホバー中の列の見出しを強調する。
   * @ko 호버된 열의 머리글 강조.
   */
  HighlightHoveredColumn: 268435456,
  /**
   * Internal mask extracting the encoded sizing policy.
   *
   * @zh 提取编码尺寸策略的内部掩码。
   * @ja 符号化された寸法方式を取り出す内部マスク。
   * @ko 인코딩된 크기 정책을 추출하는 내부 마스크.
   */
  SizingMask_: 57344,
} as const);

/**
 * Table option bits including a single encoded sizing policy.
 *
 * @zh 表格选项位，包含单个编码尺寸策略。
 * @ja 単一の符号化寸法方式を含む表設定ビット。
 * @ko 단일 인코딩 크기 정책을 포함한 표 설정 비트.
 */
export type ImGuiTableFlags = number;

/**
 * Column configuration and read-only status returned by TableGetColumnFlags().
 *
 * @zh 列配置及 TableGetColumnFlags() 返回的只读状态。
 * @ja 列設定と TableGetColumnFlags() が返す読み取り専用状態。
 * @ko 열 구성 및 TableGetColumnFlags()가 반환하는 읽기 전용 상태.
 */
export const ImGuiTableColumnFlags = Object.freeze({
  /**
   * Use the table's default column behavior.
   *
   * @zh 使用表格默认列行为。
   * @ja 表の既定列動作を使う。
   * @ko 표의 기본 열 동작 사용.
   */
  None: 0,
  /**
   * Hide the column completely, including from the context menu.
   *
   * @zh 完全隐藏此列，也不出现在上下文菜单中。
   * @ja コンテキストメニューも含め列を完全に隠す。
   * @ko 컨텍스트 메뉴에서도 제외하여 열을 완전히 숨김.
   */
  Disabled: 1,
  /**
   * Start hidden, but allow the user to show the column.
   *
   * @zh 初始隐藏，但允许用户显示此列。
   * @ja 初期状態では隠し、ユーザーによる表示は許可する。
   * @ko 처음에는 숨기되 사용자가 열을 표시할 수 있음.
   */
  DefaultHide: 2,
  /**
   * Use this column for default sorting.
   *
   * @zh 默认按此列排序。
   * @ja 既定のソート列にする。
   * @ko 이 열을 기본 정렬 기준으로 사용.
   */
  DefaultSort: 4,
  /**
   * Allocate width using a stretch weight.
   *
   * @zh 按拉伸权重分配宽度。
   * @ja 伸縮の重みに応じて幅を割り当てる。
   * @ko 확장 가중치로 너비 할당.
   */
  WidthStretch: 8,
  /**
   * Use a fixed or content-derived width instead of stretching.
   *
   * @zh 使用固定或内容决定的宽度，不拉伸。
   * @ja 伸縮せず固定幅または内容に応じた幅を使う。
   * @ko 확장하지 않고 고정 또는 내용 기반 너비 사용.
   */
  WidthFixed: 16,
  /**
   * Disable manual column resizing.
   *
   * @zh 禁止手动调整列宽。
   * @ja 手動の列幅変更を禁止する。
   * @ko 수동 열 너비 조절 금지.
   */
  NoResize: 32,
  /**
   * Prevent moving this column or moving others across it.
   *
   * @zh 禁止移动此列，也禁止其他列跨越此列。
   * @ja この列の移動と他列がこれを越える移動を禁止する。
   * @ko 이 열 이동과 다른 열이 이 열을 넘는 이동 금지.
   */
  NoReorder: 64,
  /**
   * Prevent users from hiding this column.
   *
   * @zh 禁止用户隐藏此列。
   * @ja ユーザーによる列の非表示を禁止する。
   * @ko 사용자의 열 숨기기 금지.
   */
  NoHide: 128,
  /**
   * Do not clip this column; unclipped columns share a draw command.
   *
   * @zh 不裁剪此列；未裁剪列共享绘制命令。
   * @ja この列を切り取らない。非クリップ列は描画コマンドを共有する。
   * @ko 이 열을 자르지 않음. 잘리지 않는 열끼리 그리기 명령 공유.
   */
  NoClip: 256,
  /**
   * Disallow sorting by this column.
   *
   * @zh 禁止按此列排序。
   * @ja この列でのソートを禁止する。
   * @ko 이 열 기준 정렬 금지.
   */
  NoSort: 512,
  /**
   * Disallow ascending sorting on this column.
   *
   * @zh 禁止此列升序排序。
   * @ja この列の昇順ソートを禁止する。
   * @ko 이 열 오름차순 정렬 금지.
   */
  NoSortAscending: 1024,
  /**
   * Disallow descending sorting on this column.
   *
   * @zh 禁止此列降序排序。
   * @ja この列の降順ソートを禁止する。
   * @ko 이 열 내림차순 정렬 금지.
   */
  NoSortDescending: 2048,
  /**
   * Hide the regular header label; keep its menu and angled-header names.
   *
   * @zh 隐藏普通表头标签，保留菜单和倾斜表头中的名称。
   * @ja 通常の見出し文字を隠し、メニューと斜め見出しでは名前を残す。
   * @ko 일반 머리글 라벨은 숨기고 메뉴와 기울어진 머리글 이름은 유지.
   */
  NoHeaderLabel: 4096,
  /**
   * Exclude header text width from automatic column sizing.
   *
   * @zh 自动计算列宽时不计表头文本宽度。
   * @ja 列の自動幅に見出し文字の幅を含めない。
   * @ko 자동 열 너비 계산에서 머리글 텍스트 너비 제외.
   */
  NoHeaderWidth: 8192,
  /**
   * Prefer ascending order on the first sort.
   *
   * @zh 首次排序优先升序。
   * @ja 初回ソートで昇順を優先する。
   * @ko 첫 정렬에서 오름차순 우선.
   */
  PreferSortAscending: 16384,
  /**
   * Prefer descending order on the first sort.
   *
   * @zh 首次排序优先降序。
   * @ja 初回ソートで降順を優先する。
   * @ko 첫 정렬에서 내림차순 우선.
   */
  PreferSortDescending: 32768,
  /**
   * Inherit current indentation when entering cells; default for column zero.
   *
   * @zh 进入单元格时继承当前缩进，第零列默认启用。
   * @ja セルに入る際に字下げを継承。第ゼロ列では既定。
   * @ko 셀 진입 시 현재 들여쓰기 상속. 0번 열의 기본값.
   */
  IndentEnable: 65536,
  /**
   * Ignore incoming indentation, but honor indentation changes inside the cell.
   *
   * @zh 忽略进入时的缩进，但保留单元格内的缩进变化。
   * @ja 入る際の字下げは無視し、セル内での字下げ変更は反映する。
   * @ko 진입 시 들여쓰기는 무시하되 셀 내부 변경은 반영.
   */
  IndentDisable: 131072,
  /**
   * Add an angled header row for this column.
   *
   * @zh 为此列添加倾斜表头行。
   * @ja この列に斜め見出し行を追加する。
   * @ko 이 열에 기울어진 머리글 행 추가.
   */
  AngledHeader: 262144,
  /**
   * Read-only: column is enabled, not hidden by the user or API.
   *
   * @zh 只读：列已启用，未被用户或 API 隐藏。
   * @ja 読み取り専用。ユーザーや API に隠されていない有効な列。
   * @ko 읽기 전용. 사용자나 API가 숨기지 않은 활성 열.
   */
  IsEnabled: 16777216,
  /**
   * Read-only: column is enabled and not clipped by scrolling.
   *
   * @zh 只读：列已启用且未被滚动裁剪。
   * @ja 読み取り専用。有効でスクロールによる切り取りもない列。
   * @ko 읽기 전용. 활성 상태이고 스크롤로 잘리지 않은 열.
   */
  IsVisible: 33554432,
  /**
   * Read-only: column participates in the current sort specification.
   *
   * @zh 只读：列参与当前排序规格。
   * @ja 読み取り専用。現在のソート指定に含まれる列。
   * @ko 읽기 전용. 현재 정렬 사양에 포함된 열.
   */
  IsSorted: 67108864,
  /**
   * Read-only: mouse is hovering this column.
   *
   * @zh 只读：鼠标正悬停此列。
   * @ja 読み取り専用。マウスがこの列に重なっている。
   * @ko 읽기 전용. 마우스가 이 열 위에 있음.
   */
  IsHovered: 134217728,
  /**
   * Internal mask of fixed/stretch width policies.
   *
   * @zh 固定或拉伸宽度策略的内部掩码。
   * @ja 固定・伸縮幅方式の内部マスク。
   * @ko 고정 및 확장 너비 정책의 내부 마스크.
   */
  WidthMask_: 24,
  /**
   * Internal mask of indentation policies.
   *
   * @zh 缩进策略的内部掩码。
   * @ja 字下げ方式の内部マスク。
   * @ko 들여쓰기 정책의 내부 마스크.
   */
  IndentMask_: 196608,
  /**
   * Internal mask of read-only column status bits.
   *
   * @zh 只读列状态位的内部掩码。
   * @ja 読み取り専用列状態ビットの内部マスク。
   * @ko 읽기 전용 열 상태 비트의 내부 마스크.
   */
  StatusMask_: 251658240,
  /**
   * Internal: forbid direct resizing but permit indirect left-edge resizing.
   *
   * @zh 内部：禁止直接调整大小，但可由左边缘间接调整。
   * @ja 内部用。直接の幅変更を禁止するが左端からの間接変更は可能。
   * @ko 내부용. 직접 크기 조절은 금지하되 왼쪽 가장자리의 간접 조절 허용.
   */
  NoDirectResize_: 1073741824,
} as const);

/**
 * Bitwise combination of column configuration or status bits.
 *
 * @zh 列配置或状态位的按位组合。
 * @ja 列設定または状態ビットの組み合わせ。
 * @ko 열 구성 또는 상태 비트의 조합.
 */
export type ImGuiTableColumnFlags = number;

/**
 * Row role supplied to TableNextRow().
 *
 * @zh 传给 TableNextRow() 的行角色。
 * @ja TableNextRow() に渡す行の役割。
 * @ko TableNextRow()에 전달하는 행 역할.
 */
export const ImGuiTableRowFlags = Object.freeze({
  /**
   * Ordinary body row.
   *
   * @zh 普通表体行。
   * @ja 通常の本文行。
   * @ko 일반 본문 행.
   */
  None: 0,
  /**
   * Header row: use header background and header-specific width accounting.
   *
   * @zh 表头行：使用表头背景和表头专用宽度计算。
   * @ja 見出し行。専用背景と見出し用の幅計算を使う。
   * @ko 머리글 행. 머리글 배경 및 전용 너비 계산 사용.
   */
  Headers: 1,
} as const);

/**
 * Bitwise combination of table-row options.
 *
 * @zh 表格行选项的按位组合。
 * @ja 表の行設定のビット組み合わせ。
 * @ko 표 행 설정의 비트 조합.
 */
export type ImGuiTableRowFlags = number;

/**
 * Background layers for TableSetBgColor(), drawn from RowBg0 to CellBg.
 *
 * @zh TableSetBgColor() 的背景层，按 RowBg0 到 CellBg 顺序绘制。
 * @ja TableSetBgColor() の背景層。RowBg0 から CellBg の順で描画する。
 * @ko TableSetBgColor() 배경 층. RowBg0부터 CellBg 순서로 그림.
 */
export const ImGuiTableBgTarget = Object.freeze({
  /**
   * No background target.
   *
   * @zh 无背景目标。
   * @ja 背景対象なし。
   * @ko 배경 대상 없음.
   */
  None: 0,
  /**
   * Base row layer; replaces the automatic alternating row color.
   *
   * @zh 行底层，替换自动交替行颜色。
   * @ja 行の基底層。自動の交互行色を置き換える。
   * @ko 행 바탕 층. 자동 교대 행 색상을 대체.
   */
  RowBg0: 1,
  /**
   * Row overlay blended above RowBg0, useful for selection.
   *
   * @zh 混合在 RowBg0 上方的行叠加层，适合选择标记。
   * @ja RowBg0 上に合成する行層。選択表示などに使う。
   * @ko RowBg0 위에 혼합하는 행 층. 선택 표시에 유용.
   */
  RowBg1: 2,
  /**
   * Cell background, drawn above both row layers.
   *
   * @zh 单元格背景，绘制在两个行层之上。
   * @ja 二つの行層より上に描画するセル背景。
   * @ko 두 행 층 위에 그리는 셀 배경.
   */
  CellBg: 3,
} as const);

/**
 * Numeric identifier of a table background layer.
 *
 * @zh 表格背景层的数值标识。
 * @ja 表背景層の数値識別子。
 * @ko 표 배경 층의 숫자 식별자.
 */
export type ImGuiTableBgTarget = number;

/**
 * Ordering direction in table sort specifications.
 *
 * @zh 表格排序规格中的排序方向。
 * @ja 表ソート指定の並び方向。
 * @ko 표 정렬 사양의 정렬 방향.
 */
export const ImGuiSortDirection = Object.freeze({
  /**
   * Do not sort this field.
   *
   * @zh 不按此字段排序。
   * @ja この項目でソートしない。
   * @ko 이 필드로 정렬하지 않음.
   */
  None: 0,
  /**
   * Sort from smaller to larger values.
   *
   * @zh 从小到大排序。
   * @ja 小さい値から大きい値へ並べる。
   * @ko 작은 값부터 큰 값으로 정렬.
   */
  Ascending: 1,
  /**
   * Sort from larger to smaller values.
   *
   * @zh 从大到小排序。
   * @ja 大きい値から小さい値へ並べる。
   * @ko 큰 값부터 작은 값으로 정렬.
   */
  Descending: 2,
} as const);

/**
 * Numeric sort-direction identifier.
 *
 * @zh 排序方向的数值标识。
 * @ja ソート方向の数値識別子。
 * @ko 정렬 방향의 숫자 식별자.
 */
export type ImGuiSortDirection = number;
