/**
 * Tree-node appearance, hit area and expansion behavior.
 *
 * @zh 树节点外观、命中区域和展开行为。
 * @ja ツリーノードの外観、判定領域、展開動作。
 * @ko 트리 노드 모양, 판정 영역 및 펼침 동작.
 */
export const ImGuiTreeNodeFlags = Object.freeze({
  /**
   * Use the default tree-node behavior.
   *
   * @zh 使用默认树节点行为。
   * @ja 標準のツリーノード動作。
   * @ko 기본 트리 노드 동작.
   */
  None: 0,
  /**
   * Draw the node as selected.
   *
   * @zh 将节点绘制为选中状态。
   * @ja ノードを選択状態で描画する。
   * @ko 노드를 선택 상태로 표시.
   */
  Selected: 1,
  /**
   * Draw a frame with a background.
   *
   * @zh 绘制带背景的框。
   * @ja 背景付きの枠を描画する。
   * @ko 배경이 있는 프레임 표시.
   */
  Framed: 2,
  /**
   * Allow later widgets to overlap this node during hit testing.
   *
   * @zh 命中检测允许后续控件覆盖此节点。
   * @ja ヒット判定で後続ウィジェットの重なりを許可する。
   * @ko 판정 시 이후 위젯이 이 노드와 겹치도록 허용.
   */
  AllowOverlap: 4,
  /**
   * Do not push indentation or an ID when open; do not call TreePop().
   *
   * @zh 展开时不压入缩进或 ID；不要调用 TreePop()。
   * @ja 開いても字下げや ID を積まない。TreePop() は呼ばない。
   * @ko 펼칠 때 들여쓰기나 ID를 쌓지 않음. TreePop() 호출 금지.
   */
  NoTreePushOnOpen: 8,
  /**
   * Do not automatically expand the node while logging.
   *
   * @zh 日志记录期间不自动展开节点。
   * @ja ログ記録中に自動展開しない。
   * @ko 로그 기록 중 노드를 자동으로 펼치지 않음.
   */
  NoAutoOpenOnLog: 16,
  /**
   * Start with the node expanded.
   *
   * @zh 节点初始为展开状态。
   * @ja 初期状態を展開済みにする。
   * @ko 처음에 펼쳐진 상태로 시작.
   */
  DefaultOpen: 32,
  /**
   * Toggle on double-click; may be combined with OpenOnArrow.
   *
   * @zh 双击切换展开状态；可与 OpenOnArrow 组合。
   * @ja ダブルクリックで開閉。OpenOnArrow と併用可能。
   * @ko 두 번 클릭으로 펼침 전환. OpenOnArrow와 조합 가능.
   */
  OpenOnDoubleClick: 64,
  /**
   * Toggle on an arrow click rather than any label click.
   *
   * @zh 点击箭头切换展开状态，而非点击标签任意位置。
   * @ja ラベル全体ではなく矢印のクリックで開閉する。
   * @ko 라벨 전체가 아닌 화살표 클릭으로 펼침 전환.
   */
  OpenOnArrow: 128,
  /**
   * Hide the arrow and prevent collapsing a leaf node.
   *
   * @zh 隐藏箭头并禁止折叠叶节点。
   * @ja 葉ノードの矢印を隠し、折り畳みを禁止する。
   * @ko 말단 노드의 화살표를 숨기고 접기 금지.
   */
  Leaf: 256,
  /**
   * Draw a bullet instead of an arrow; does not imply Leaf.
   *
   * @zh 用圆点替代箭头；不隐含 Leaf。
   * @ja 矢印を丸印にする。Leaf の指定とは異なる。
   * @ko 화살표 대신 점 표시. Leaf를 의미하지는 않음.
   */
  Bullet: 512,
  /**
   * Apply frame padding to align text with regular widget baselines.
   *
   * @zh 应用框内边距，使文本与普通控件基线对齐。
   * @ja フレーム余白で通常ウィジェットの文字基線に揃える。
   * @ko 프레임 여백으로 일반 위젯의 텍스트 기준선에 맞춤.
   */
  FramePadding: 1024,
  /**
   * Extend the hit area to the available right edge.
   *
   * @zh 命中区域延伸至可用区域右边缘。
   * @ja 判定領域を利用可能な右端まで広げる。
   * @ko 판정 영역을 사용 가능한 오른쪽 끝까지 확장.
   */
  SpanAvailWidth: 2048,
  /**
   * Extend the hit area to both edges, including indentation.
   *
   * @zh 命中区域延伸至左右边缘，包含缩进区域。
   * @ja 字下げ領域を含め、判定領域を左右端まで広げる。
   * @ko 들여쓰기를 포함해 판정 영역을 양 끝까지 확장.
   */
  SpanFullWidth: 4096,
  /**
   * Restrict the hit area and hover highlight to the label width.
   *
   * @zh 命中区域和悬停高亮仅覆盖标签宽度。
   * @ja 判定とホバー強調をラベル幅に限定する。
   * @ko 판정 영역과 호버 강조를 라벨 너비로 제한.
   */
  SpanLabelWidth: 8192,
  /**
   * Span the frame across table columns; keep the label in its column.
   *
   * @zh 框跨越表格全部列；标签仍限于当前列。
   * @ja 枠を表の全列に広げ、ラベルは現在の列に収める。
   * @ko 프레임은 모든 표 열에 걸치고 라벨은 현재 열에 유지.
   */
  SpanAllColumns: 16384,
  /**
   * Allow the label to span all table columns.
   *
   * @zh 允许标签跨越表格全部列。
   * @ja ラベルを表の全列に広げる。
   * @ko 라벨이 표의 모든 열에 걸치도록 허용.
   */
  LabelSpanAllColumns: 32768,
  /**
   * Experimental: left navigation may return here from descendants.
   *
   * @zh 实验性：左向导航可从后代项返回此节点。
   * @ja 実験的。子孫から左方向の移動でこのノードに戻れる。
   * @ko 실험적 기능. 하위 항목에서 왼쪽 탐색으로 이 노드에 복귀 가능.
   */
  NavLeftJumpsBackHere: 131072,
  /**
   * Framed header without tree push or automatic expansion for logging.
   *
   * @zh 带框折叠标题，不压入树栈，也不因日志记录自动展开。
   * @ja 枠付き見出し。ツリースタックを積まず、ログで自動展開しない。
   * @ko 프레임 제목. 트리 스택을 쌓지 않고 로그 시 자동 펼침 없음.
   */
  CollapsingHeader: 26,
  /**
   * Legacy alias of AllowOverlap: allow later widgets to overlap.
   *
   * @zh AllowOverlap 的旧别名：允许后续控件重叠。
   * @ja AllowOverlap の旧名。後続ウィジェットの重なりを許可。
   * @ko AllowOverlap의 구형 별칭. 이후 위젯의 겹침 허용.
   */
  AllowItemOverlap: 4,
  /**
   * Legacy alias of SpanLabelWidth: limit the hit area to the label.
   *
   * @zh SpanLabelWidth 的旧别名：命中区域限于标签。
   * @ja SpanLabelWidth の旧名。判定領域をラベルに限定。
   * @ko SpanLabelWidth의 구형 별칭. 판정 영역을 라벨로 제한.
   */
  SpanTextWidth: 8192,
} as const);

/**
 * Bitwise combination of tree-node options.
 *
 * @zh 树节点选项的按位组合。
 * @ja ツリーノード設定のビット組み合わせ。
 * @ko 트리 노드 설정의 비트 조합.
 */
export type ImGuiTreeNodeFlags = number;

/**
 * Popup opening and query options. Mouse buttons are indices, not bits:
 * choose one. Context helpers default to Right; include it explicitly when
 * adding other flags if right-click behavior is desired.
 *
 * @zh 弹窗开启与查询选项。鼠标按钮是索引，不可按位组合。
 * 上下文函数默认右键；添加其他标志时，若仍需右键必须显式包含它。
 * @ja ポップアップの表示と照会設定。マウスボタンは添字で、一つ選ぶ。
 * 既定は右ボタン。他のフラグを渡す際も右クリックなら明示する。
 * @ko 팝업 열기 및 조회 설정. 마우스 버튼은 비트가 아닌 인덱스이며 하나만 선택.
 * 기본값은 오른쪽 버튼. 다른 플래그 추가 시 오른쪽 버튼도 명시해야 유지됨.
 */
export const ImGuiPopupFlags = Object.freeze({
  /**
   * No options; in context helpers, zero also means the left button.
   *
   * @zh 无额外选项；上下文函数中零也表示左键。
   * @ja 追加設定なし。コンテキスト関数ではゼロは左ボタンでもある。
   * @ko 추가 설정 없음. 컨텍스트 함수에서 0은 왼쪽 버튼도 의미.
   */
  None: 0,
  /**
   * Open the context popup on left-button release.
   *
   * @zh 松开左键时打开上下文弹窗。
   * @ja 左ボタンを離すとコンテキストポップアップを開く。
   * @ko 왼쪽 버튼을 놓으면 컨텍스트 팝업 열기.
   */
  MouseButtonLeft: 0,
  /**
   * Open the context popup on right-button release.
   *
   * @zh 松开右键时打开上下文弹窗。
   * @ja 右ボタンを離すとコンテキストポップアップを開く。
   * @ko 오른쪽 버튼을 놓으면 컨텍스트 팝업 열기.
   */
  MouseButtonRight: 1,
  /**
   * Open the context popup on middle-button release.
   *
   * @zh 松开中键时打开上下文弹窗。
   * @ja 中ボタンを離すとコンテキストポップアップを開く。
   * @ko 가운데 버튼을 놓으면 컨텍스트 팝업 열기.
   */
  MouseButtonMiddle: 2,
  /**
   * Internal mask extracting the encoded mouse-button index.
   *
   * @zh 提取编码鼠标按钮索引的内部掩码。
   * @ja 符号化されたマウスボタン添字を取り出す内部マスク。
   * @ko 인코딩된 마우스 버튼 인덱스를 추출하는 내부 마스크.
   */
  MouseButtonMask_: 31,
  /**
   * Internal default button index: right button.
   *
   * @zh 内部默认按钮索引：右键。
   * @ja 内部の既定ボタン添字。右ボタン。
   * @ko 내부 기본 버튼 인덱스. 오른쪽 버튼.
   */
  MouseButtonDefault_: 1,
  /**
   * Do not reopen, reposition or reset navigation of an already-open popup.
   *
   * @zh 弹窗已打开时不重开、不重定位，也不重置导航。
   * @ja 表示済みポップアップを再表示・再配置せず、ナビゲーションも保つ。
   * @ko 열린 팝업을 다시 열거나 이동하지 않고 탐색 상태도 유지.
   */
  NoReopen: 32,
  /**
   * Do not open if another popup occupies the same popup-stack level.
   *
   * @zh 同一弹窗栈层级已有弹窗时不打开。
   * @ja 同じポップアップ階層に別のものがあれば開かない。
   * @ko 같은 팝업 스택 단계에 다른 팝업이 있으면 열지 않음.
   */
  NoOpenOverExistingPopup: 128,
  /**
   * Window context popup: open only over empty space, not items.
   *
   * @zh 窗口上下文弹窗：仅在空白处打开，控件上不打开。
   * @ja ウィンドウのコンテキスト表示を項目上ではなく空白部分に限定。
   * @ko 창 컨텍스트 팝업은 항목 위가 아닌 빈 공간에서만 열기.
   */
  NoOpenOverItems: 256,
  /**
   * IsPopupOpen(): ignore the supplied popup ID.
   *
   * @zh IsPopupOpen()：忽略指定弹窗 ID。
   * @ja IsPopupOpen() で指定された ID を無視する。
   * @ko IsPopupOpen()에서 지정한 팝업 ID 무시.
   */
  AnyPopupId: 1024,
  /**
   * IsPopupOpen(): search all popup-stack levels.
   *
   * @zh IsPopupOpen()：检查弹窗栈全部层级。
   * @ja IsPopupOpen() でポップアップの全階層を調べる。
   * @ko IsPopupOpen()에서 팝업 스택의 모든 단계 검색.
   */
  AnyPopupLevel: 2048,
  /**
   * IsPopupOpen(): test any ID at any level.
   *
   * @zh IsPopupOpen()：检查任意层级、任意 ID 的弹窗。
   * @ja IsPopupOpen() で全階層の全 ID を調べる。
   * @ko IsPopupOpen()에서 모든 단계의 모든 ID 검사.
   */
  AnyPopup: 3072,
} as const);

/**
 * Popup option bits plus one encoded mouse-button index.
 *
 * @zh 弹窗选项位与一个编码的鼠标按钮索引。
 * @ja ポップアップ設定ビットと一つのマウスボタン添字。
 * @ko 팝업 설정 비트와 하나의 마우스 버튼 인덱스.
 */
export type ImGuiPopupFlags = number;

/**
 * Selection, highlighting and hit-testing options for Selectable().
 *
 * @zh Selectable() 的选择、高亮和命中检测选项。
 * @ja Selectable() の選択、強調表示、ヒット判定設定。
 * @ko Selectable()의 선택, 강조 및 판정 설정.
 */
export const ImGuiSelectableFlags = Object.freeze({
  /**
   * Use normal selectable behavior.
   *
   * @zh 使用默认可选项行为。
   * @ja 通常の選択項目の動作。
   * @ko 기본 선택 항목 동작.
   */
  None: 0,
  /**
   * Keep the parent popup open, overriding AutoClosePopups.
   *
   * @zh 保持父弹窗打开，覆盖 AutoClosePopups。
   * @ja AutoClosePopups に関係なく親ポップアップを開いたままにする。
   * @ko AutoClosePopups를 무시하고 부모 팝업을 열린 상태로 유지.
   */
  NoAutoClosePopups: 1,
  /**
   * Span the frame across table columns; text stays in the current column.
   *
   * @zh 框跨越表格全部列，文本仍位于当前列。
   * @ja 枠を表の全列に広げ、文字は現在の列に収める。
   * @ko 프레임은 모든 표 열에 걸치고 텍스트는 현재 열에 유지.
   */
  SpanAllColumns: 2,
  /**
   * Generate activation events for double-clicks too.
   *
   * @zh 双击也产生激活事件。
   * @ja ダブルクリックでも実行イベントを発生させる。
   * @ko 두 번 클릭에도 활성화 이벤트 발생.
   */
  AllowDoubleClick: 4,
  /**
   * Prevent selection and draw the text disabled.
   *
   * @zh 禁止选择，并以禁用样式显示文本。
   * @ja 選択を禁止し、無効状態の文字で表示する。
   * @ko 선택을 금지하고 비활성 텍스트로 표시.
   */
  Disabled: 8,
  /**
   * Allow later widgets to overlap during hit testing.
   *
   * @zh 命中检测允许后续控件重叠。
   * @ja 判定で後続ウィジェットの重なりを許可する。
   * @ko 판정 시 이후 위젯의 겹침 허용.
   */
  AllowOverlap: 16,
  /**
   * Draw as hovered even when the mouse is elsewhere.
   *
   * @zh 即使鼠标不在此处也显示悬停高亮。
   * @ja マウス位置に関係なくホバー状態で描画する。
   * @ko 마우스 위치와 관계없이 호버 상태로 표시.
   */
  Highlight: 32,
  /**
   * Legacy alias of NoAutoClosePopups: keep the parent popup open.
   *
   * @zh NoAutoClosePopups 的旧别名：保持父弹窗打开。
   * @ja NoAutoClosePopups の旧名。親ポップアップを閉じない。
   * @ko NoAutoClosePopups의 구형 별칭. 부모 팝업 유지.
   */
  DontClosePopups: 1,
  /**
   * Legacy alias of AllowOverlap: permit later overlapping widgets.
   *
   * @zh AllowOverlap 的旧别名：允许后续控件重叠。
   * @ja AllowOverlap の旧名。後続の重なりを許可。
   * @ko AllowOverlap의 구형 별칭. 이후 위젯 겹침 허용.
   */
  AllowItemOverlap: 16,
} as const);

/**
 * Bitwise combination of selectable-item options.
 *
 * @zh 可选项选项的按位组合。
 * @ja 選択項目設定のビット組み合わせ。
 * @ko 선택 항목 설정의 비트 조합.
 */
export type ImGuiSelectableFlags = number;

/**
 * Combo-box preview and popup sizing options; choose one height policy.
 *
 * @zh 组合框预览与弹窗尺寸选项；高度策略只能选一个。
 * @ja コンボのプレビューとポップアップ寸法。高さ方式は一つ選ぶ。
 * @ko 콤보 미리 보기 및 팝업 크기 설정. 높이 정책은 하나만 선택.
 */
export const ImGuiComboFlags = Object.freeze({
  /**
   * Use default combo appearance and popup height.
   *
   * @zh 使用默认组合框外观和弹窗高度。
   * @ja 標準のコンボ外観とポップアップ高さ。
   * @ko 기본 콤보 모양과 팝업 높이 사용.
   */
  None: 0,
  /**
   * Prefer left alignment for the popup.
   *
   * @zh 弹窗优先左对齐。
   * @ja ポップアップを左揃えにする。
   * @ko 팝업 왼쪽 정렬 우선.
   */
  PopupAlignLeft: 1,
  /**
   * Limit the popup to about four visible items.
   *
   * @zh 弹窗最多显示约四项。
   * @ja ポップアップ表示を約四項目に制限する。
   * @ko 팝업에 약 네 항목까지 표시.
   */
  HeightSmall: 2,
  /**
   * Limit the popup to about eight visible items (default).
   *
   * @zh 弹窗最多显示约八项，默认策略。
   * @ja 約八項目を表示する既定の高さ。
   * @ko 약 여덟 항목까지 표시하는 기본 높이.
   */
  HeightRegular: 4,
  /**
   * Limit the popup to about twenty visible items.
   *
   * @zh 弹窗最多显示约二十项。
   * @ja ポップアップ表示を約二十項目に制限する。
   * @ko 팝업에 약 스무 항목까지 표시.
   */
  HeightLarge: 8,
  /**
   * Show as many popup items as available space allows.
   *
   * @zh 按可用空间尽量多显示弹窗项。
   * @ja 空間に収まる限り多くの項目を表示する。
   * @ko 공간에 맞는 만큼 최대한 많은 항목 표시.
   */
  HeightLargest: 16,
  /**
   * Show the preview without the square arrow button.
   *
   * @zh 显示预览，不显示方形箭头按钮。
   * @ja 四角い矢印ボタンを省きプレビューだけ表示する。
   * @ko 사각 화살표 버튼 없이 미리 보기 표시.
   */
  NoArrowButton: 32,
  /**
   * Show only the square arrow button, without a preview.
   *
   * @zh 仅显示方形箭头按钮，不显示预览。
   * @ja プレビューを省き四角い矢印ボタンだけ表示する。
   * @ko 미리 보기 없이 사각 화살표 버튼만 표시.
   */
  NoPreview: 64,
  /**
   * Calculate the combo width from its preview content.
   *
   * @zh 根据预览内容计算组合框宽度。
   * @ja プレビュー内容からコンボ幅を求める。
   * @ko 미리 보기 내용으로 콤보 너비 계산.
   */
  WidthFitPreview: 128,
  /**
   * Internal mask of the mutually exclusive height policies.
   *
   * @zh 互斥高度策略的内部掩码。
   * @ja 排他的な高さ方式の内部マスク。
   * @ko 상호 배타적인 높이 정책의 내부 마스크.
   */
  HeightMask_: 30,
} as const);

/**
 * Bitwise combination of combo-box options.
 *
 * @zh 组合框选项的按位组合。
 * @ja コンボ設定のビット組み合わせ。
 * @ko 콤보 설정의 비트 조합.
 */
export type ImGuiComboFlags = number;

/**
 * Tab-bar ordering, controls and overflow policy.
 *
 * @zh 标签栏排序、控件和溢出策略。
 * @ja タブバーの並び順、操作部品、幅不足時の方針。
 * @ko 탭 표시줄 순서, 조작 버튼 및 너비 초과 정책.
 */
export const ImGuiTabBarFlags = Object.freeze({
  /**
   * Use default tab-bar behavior.
   *
   * @zh 使用默认标签栏行为。
   * @ja 標準のタブバー動作。
   * @ko 기본 탭 표시줄 동작.
   */
  None: 0,
  /**
   * Allow drag reordering and append new tabs to the end.
   *
   * @zh 允许拖动排序，新标签追加到末尾。
   * @ja ドラッグで並べ替え、新規タブは末尾に追加する。
   * @ko 드래그 재정렬을 허용하고 새 탭은 끝에 추가.
   */
  Reorderable: 1,
  /**
   * Select new tabs when they appear.
   *
   * @zh 新标签出现时自动选中。
   * @ja 新しいタブの出現時に選択する。
   * @ko 새 탭이 나타나면 선택.
   */
  AutoSelectNewTabs: 2,
  /**
   * Show the button opening the tab-list popup.
   *
   * @zh 显示打开标签列表弹窗的按钮。
   * @ja タブ一覧ポップアップを開くボタンを表示する。
   * @ko 탭 목록 팝업을 여는 버튼 표시.
   */
  TabListPopupButton: 4,
  /**
   * Disable middle-click closing for closable tabs.
   *
   * @zh 禁止用中键关闭可关闭标签。
   * @ja 閉じられるタブの中クリック終了を禁止する。
   * @ko 닫을 수 있는 탭의 가운데 클릭 닫기 금지.
   */
  NoCloseWithMiddleMouseButton: 8,
  /**
   * Hide tab scrolling buttons under the scroll fitting policy.
   *
   * @zh 使用滚动适配策略时隐藏标签滚动按钮。
   * @ja スクロール方式でのタブスクロールボタンを隠す。
   * @ko 스크롤 맞춤 정책에서 탭 스크롤 버튼 숨김.
   */
  NoTabListScrollingButtons: 16,
  /**
   * Suppress tooltips when hovering tabs.
   *
   * @zh 悬停标签时不显示提示。
   * @ja タブのホバーツールチップを表示しない。
   * @ko 탭 호버 툴팁 숨김.
   */
  NoTooltip: 32,
  /**
   * Draw a line above the selected tab.
   *
   * @zh 在选中标签上方绘制标记线。
   * @ja 選択タブの上に線を描く。
   * @ko 선택된 탭 위에 선 표시.
   */
  DrawSelectedOverline: 64,
  /**
   * Shrink tabs when their combined width does not fit.
   *
   * @zh 标签总宽度不足以容纳时缩小标签。
   * @ja タブが収まらない場合は幅を縮める。
   * @ko 전체 탭이 맞지 않으면 탭 너비 축소.
   */
  FittingPolicyResizeDown: 128,
  /**
   * Scroll tabs when their combined width does not fit.
   *
   * @zh 标签总宽度不足以容纳时滚动标签。
   * @ja タブが収まらない場合はスクロールする。
   * @ko 전체 탭이 맞지 않으면 스크롤 사용.
   */
  FittingPolicyScroll: 256,
  /**
   * Internal mask of mutually exclusive fitting policies.
   *
   * @zh 互斥适配策略的内部掩码。
   * @ja 排他的な幅調整方式の内部マスク。
   * @ko 상호 배타적인 맞춤 정책의 내부 마스크.
   */
  FittingPolicyMask_: 384,
  /**
   * Internal default fitting policy: shrink tab widths.
   *
   * @zh 内部默认适配策略：缩小标签宽度。
   * @ja 内部の既定方式。タブ幅を縮める。
   * @ko 내부 기본 맞춤 정책. 탭 너비 축소.
   */
  FittingPolicyDefault_: 128,
} as const);

/**
 * Bitwise combination of tab-bar options.
 *
 * @zh 标签栏选项的按位组合。
 * @ja タブバー設定のビット組み合わせ。
 * @ko 탭 표시줄 설정의 비트 조합.
 */
export type ImGuiTabBarFlags = number;

/**
 * Individual tab selection, placement and closing behavior.
 *
 * @zh 单个标签的选择、位置和关闭行为。
 * @ja 個別タブの選択、配置、終了動作。
 * @ko 개별 탭 선택, 위치 및 닫기 동작.
 */
export const ImGuiTabItemFlags = Object.freeze({
  /**
   * Use default tab behavior.
   *
   * @zh 使用默认标签行为。
   * @ja 標準のタブ動作。
   * @ko 기본 탭 동작.
   */
  None: 0,
  /**
   * Add an unsaved dot and enable NoAssumedClosure.
   *
   * @zh 添加未保存圆点并启用 NoAssumedClosure。
   * @ja 未保存の丸印を付け NoAssumedClosure を有効化する。
   * @ko 미저장 점을 표시하고 NoAssumedClosure 활성화.
   */
  UnsavedDocument: 1,
  /**
   * Select this tab when BeginTabItem() is called.
   *
   * @zh 调用 BeginTabItem() 时选中此标签。
   * @ja BeginTabItem() 呼び出し時にこのタブを選択する。
   * @ko BeginTabItem() 호출 시 이 탭 선택.
   */
  SetSelected: 2,
  /**
   * Do not close this tab on middle-click.
   *
   * @zh 不用中键关闭此标签。
   * @ja このタブを中クリックで閉じない。
   * @ko 가운데 클릭으로 이 탭을 닫지 않음.
   */
  NoCloseWithMiddleMouseButton: 4,
  /**
   * Skip automatic PushID/PopID around the tab's contents.
   *
   * @zh 不自动在标签内容前后调用 PushID/PopID。
   * @ja タブ内容を囲む自動 PushID/PopID を省く。
   * @ko 탭 내용 전후의 자동 PushID/PopID 생략.
   */
  NoPushId: 8,
  /**
   * Suppress this tab's hover tooltip.
   *
   * @zh 禁止此标签的悬停提示。
   * @ja このタブのホバーツールチップを隠す。
   * @ko 이 탭의 호버 툴팁 숨김.
   */
  NoTooltip: 16,
  /**
   * Prevent moving this tab or reordering other tabs across it.
   *
   * @zh 禁止移动此标签，也禁止其他标签跨越它排序。
   * @ja このタブの移動と、他のタブがこれを越える並べ替えを禁止する。
   * @ko 이 탭 이동과 다른 탭이 이 탭을 넘는 재정렬 금지.
   */
  NoReorder: 32,
  /**
   * Place the tab at the left, after the tab-list button.
   *
   * @zh 将标签放在左侧、标签列表按钮之后。
   * @ja 一覧ボタンの後、左側にタブを配置する。
   * @ko 탭 목록 버튼 다음인 왼쪽에 배치.
   */
  Leading: 64,
  /**
   * Place the tab at the right, before the scrolling buttons.
   *
   * @zh 将标签放在右侧、滚动按钮之前。
   * @ja スクロールボタンの前、右側にタブを配置する。
   * @ko 스크롤 버튼 앞인 오른쪽에 배치.
   */
  Trailing: 128,
  /**
   * On a close request, select the tab and keep it until submission stops.
   *
   * @zh 收到关闭请求时先选中标签，直到停止提交才移除。
   * @ja 閉じる要求でタブを選択し、送信が止まるまで残す。
   * @ko 닫기 요청 시 탭을 선택하고 제출이 중단될 때까지 유지.
   */
  NoAssumedClosure: 256,
} as const);

/**
 * Bitwise combination of individual-tab options.
 *
 * @zh 单个标签选项的按位组合。
 * @ja 個別タブ設定のビット組み合わせ。
 * @ko 개별 탭 설정의 비트 조합.
 */
export type ImGuiTabItemFlags = number;

/**
 * Mouse-button activation and navigation options for InvisibleButton().
 *
 * @zh InvisibleButton() 的鼠标按钮激活与导航选项。
 * @ja InvisibleButton() のマウスボタンとナビゲーション設定。
 * @ko InvisibleButton()의 마우스 버튼 활성화 및 탐색 설정.
 */
export const ImGuiButtonFlags = Object.freeze({
  /**
   * Use the default left-button activation.
   *
   * @zh 使用默认左键激活。
   * @ja 既定の左ボタンで実行する。
   * @ko 기본 왼쪽 버튼 활성화 사용.
   */
  None: 0,
  /**
   * Accept the left mouse button.
   *
   * @zh 接受鼠标左键。
   * @ja マウスの左ボタンを受け付ける。
   * @ko 마우스 왼쪽 버튼 허용.
   */
  MouseButtonLeft: 1,
  /**
   * Accept the right mouse button.
   *
   * @zh 接受鼠标右键。
   * @ja マウスの右ボタンを受け付ける。
   * @ko 마우스 오른쪽 버튼 허용.
   */
  MouseButtonRight: 2,
  /**
   * Accept the middle mouse button.
   *
   * @zh 接受鼠标中键。
   * @ja マウスの中ボタンを受け付ける。
   * @ko 마우스 가운데 버튼 허용.
   */
  MouseButtonMiddle: 4,
  /**
   * Internal mask of accepted mouse-button bits.
   *
   * @zh 可接受鼠标按钮位的内部掩码。
   * @ja 受け付けるマウスボタンビットの内部マスク。
   * @ko 허용 마우스 버튼 비트의 내부 마스크.
   */
  MouseButtonMask_: 7,
  /**
   * Enable keyboard/gamepad navigation and draw its cursor.
   *
   * @zh 启用键盘、手柄导航并绘制导航光标。
   * @ja キーボードとゲームパッドの移動を有効化し、カーソルを描画する。
   * @ko 키보드 및 게임패드 탐색을 활성화하고 탐색 커서 표시.
   */
  EnableNav: 8,
} as const);

/**
 * Bitwise combination of button options; button bits may be combined.
 *
 * @zh 按钮选项的按位组合；鼠标按钮位可以组合。
 * @ja ボタン設定のビット組み合わせ。マウスボタンは複数指定可能。
 * @ko 버튼 설정의 비트 조합. 마우스 버튼 비트 조합 가능.
 */
export type ImGuiButtonFlags = number;

/**
 * Value scaling, direct entry and bounds for sliders and drag widgets.
 *
 * @zh 滑块和拖动控件的数值映射、直接输入与边界选项。
 * @ja スライダーとドラッグの値変換、直接入力、範囲設定。
 * @ko 슬라이더 및 드래그 위젯의 값 변환, 직접 입력 및 범위 설정.
 */
export const ImGuiSliderFlags = Object.freeze({
  /**
   * Use linear scaling and default input behavior.
   *
   * @zh 使用线性映射和默认输入行为。
   * @ja 線形変換と標準の入力動作を使う。
   * @ko 선형 변환과 기본 입력 동작 사용.
   */
  None: 0,
  /**
   * Use a logarithmic rather than linear scale.
   *
   * @zh 使用对数映射而非线性映射。
   * @ja 線形ではなく対数スケールを使う。
   * @ko 선형 대신 로그 스케일 사용.
   */
  Logarithmic: 32,
  /**
   * Preserve value precision rather than rounding to the display format.
   *
   * @zh 保留数值精度，不按显示格式舍入。
   * @ja 表示書式の桁数で丸めず値の精度を保つ。
   * @ko 표시 형식으로 반올림하지 않고 값 정밀도 유지.
   */
  NoRoundToFormat: 64,
  /**
   * Disable direct text entry through Ctrl+click or Enter.
   *
   * @zh 禁止通过 Ctrl+单击或 Enter 直接输入文本。
   * @ja Ctrl+クリックや Enter による直接入力を禁止する。
   * @ko Ctrl+클릭 또는 Enter를 통한 직접 텍스트 입력 금지.
   */
  NoInput: 128,
  /**
   * Drag widgets only: wrap past either bound to the opposite bound.
   *
   * @zh 仅拖动控件：越过边界时循环到另一端。
   * @ja ドラッグ専用。範囲を越えたら反対側へ循環する。
   * @ko 드래그 전용. 경계를 넘으면 반대 경계로 순환.
   */
  WrapAround: 256,
  /**
   * Clamp manually typed values to the minimum and maximum.
   *
   * @zh 将手动输入值限制在最小值和最大值之间。
   * @ja 手入力の値も最小値と最大値の範囲に制限する。
   * @ko 직접 입력한 값도 최솟값과 최댓값 사이로 제한.
   */
  ClampOnInput: 512,
  /**
   * Clamp even when both bounds are zero, normally unbounded for drags.
   *
   * @zh 上下界都为零时仍限幅；拖动控件通常将其视为无限制。
   * @ja 上下限が共にゼロでも制限する。ドラッグでは通常これを無制限扱い。
   * @ko 양 경계가 0이어도 제한. 드래그는 보통 이를 무제한으로 취급.
   */
  ClampZeroRange: 1024,
  /**
   * Do not let modifier keys change the adjustment speed.
   *
   * @zh 不让修饰键改变调节速度。
   * @ja 修飾キーで調整速度を変えない。
   * @ko 보조 키로 조절 속도를 변경하지 않음.
   */
  NoSpeedTweaks: 2048,
  /**
   * Combine manual-input clamping with zero-range clamping.
   *
   * @zh 同时启用手动输入限幅与零范围限幅。
   * @ja 手入力の範囲制限とゼロ範囲の制限を両方有効化する。
   * @ko 직접 입력 제한과 0 범위 제한을 모두 활성화.
   */
  AlwaysClamp: 1536,
  /**
   * Internal invalid-bit mask detecting old float-power API misuse.
   *
   * @zh 内部非法位掩码，用于检测旧浮点 power 参数的误传。
   * @ja 旧 float power 引数の誤用を検出する内部の無効ビットマスク。
   * @ko 구형 float power 인수 오용을 감지하는 내부 잘못된 비트 마스크.
   */
  InvalidMask_: 1879048207,
} as const);

/**
 * Bitwise combination of slider and drag options.
 *
 * @zh 滑块和拖动选项的按位组合。
 * @ja スライダーとドラッグ設定のビット組み合わせ。
 * @ko 슬라이더 및 드래그 설정의 비트 조합.
 */
export type ImGuiSliderFlags = number;
