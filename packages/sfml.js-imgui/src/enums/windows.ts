/**
 * Window appearance, interaction and lifetime options for Begin().
 *
 * @zh Begin() 的窗口外观、交互和生命周期选项。
 * @ja Begin() のウィンドウ外観、操作、寿命の設定。
 * @ko Begin()의 창 모양, 상호 작용 및 수명 설정.
 */
export const ImGuiWindowFlags = Object.freeze({
  /**
   * Use default window behavior.
   *
   * @zh 使用默认窗口行为。
   * @ja 標準のウィンドウ動作を使う。
   * @ko 기본 창 동작 사용.
   */
  None: 0,
  /**
   * Hide the title bar.
   *
   * @zh 隐藏标题栏。
   * @ja タイトルバーを隠す。
   * @ko 제목 표시줄 숨김.
   */
  NoTitleBar: 1,
  /**
   * Prevent resizing with the window grip.
   *
   * @zh 禁止通过窗口拖柄调整大小。
   * @ja グリップによるサイズ変更を禁止する。
   * @ko 창 그립을 통한 크기 조절 금지.
   */
  NoResize: 2,
  /**
   * Prevent the user from moving the window.
   *
   * @zh 禁止用户移动窗口。
   * @ja ユーザーによるウィンドウ移動を禁止する。
   * @ko 사용자의 창 이동 금지.
   */
  NoMove: 4,
  /**
   * Hide scrollbars; wheel and programmatic scrolling remain possible.
   *
   * @zh 隐藏滚动条；仍可用滚轮或程序滚动。
   * @ja スクロールバーを隠す。ホイールやコードでのスクロールは可能。
   * @ko 스크롤바 숨김. 휠 및 코드에 의한 스크롤은 가능.
   */
  NoScrollbar: 8,
  /**
   * Disable vertical wheel scrolling; children forward it to their parent
   * unless NoScrollbar is also set.
   *
   * @zh 禁止滚轮纵向滚动；子窗口会转交父窗口，除非同时设置 NoScrollbar。
   * @ja 縦ホイールを無効化。子では NoScrollbar がなければ親へ転送する。
   * @ko 세로 휠 스크롤 금지. 자식은 NoScrollbar가 없으면 부모로 전달.
   */
  NoScrollWithMouse: 16,
  /**
   * Disable collapsing through the title bar.
   *
   * @zh 禁止通过标题栏折叠窗口。
   * @ja タイトルバーでの折り畳みを禁止する。
   * @ko 제목 표시줄을 통한 창 접기 금지.
   */
  NoCollapse: 32,
  /**
   * Fit the window to its contents every frame.
   *
   * @zh 每帧根据内容调整窗口大小。
   * @ja 毎フレーム内容に合わせてサイズを調整する。
   * @ko 매 프레임 내용에 맞춰 창 크기 조절.
   */
  AlwaysAutoResize: 64,
  /**
   * Draw neither the background nor the outer border.
   *
   * @zh 不绘制背景和外边框。
   * @ja 背景と外枠を描画しない。
   * @ko 배경과 외곽 테두리를 그리지 않음.
   */
  NoBackground: 128,
  /**
   * Do not load or save this window's INI settings.
   *
   * @zh 不加载或保存此窗口的 INI 设置。
   * @ja このウィンドウの INI 設定を読み書きしない。
   * @ko 이 창의 INI 설정을 읽거나 저장하지 않음.
   */
  NoSavedSettings: 256,
  /**
   * Ignore mouse input and let hover tests pass through.
   *
   * @zh 忽略鼠标输入，悬停检测穿透此窗口。
   * @ja マウス入力を無視し、ホバー判定を背後へ通す。
   * @ko 마우스 입력을 무시하고 호버 판정을 뒤로 통과시킴.
   */
  NoMouseInputs: 512,
  /**
   * Reserve space for a menu bar.
   *
   * @zh 为菜单栏预留空间。
   * @ja メニューバーの領域を確保する。
   * @ko 메뉴 바 공간 확보.
   */
  MenuBar: 1024,
  /**
   * Allow a horizontal scrollbar when content is wider than the window.
   *
   * @zh 内容超宽时允许显示水平滚动条。
   * @ja 内容が幅を超えると横スクロールバーを表示できる。
   * @ko 내용이 창보다 넓으면 가로 스크롤바 허용.
   */
  HorizontalScrollbar: 2048,
  /**
   * Do not take focus when becoming visible.
   *
   * @zh 从隐藏变为可见时不获取焦点。
   * @ja 表示されたときにフォーカスを奪わない。
   * @ko 표시될 때 포커스를 가져오지 않음.
   */
  NoFocusOnAppearing: 4096,
  /**
   * Do not raise the window when it receives focus.
   *
   * @zh 获得焦点时不将窗口置于前方。
   * @ja フォーカスを得ても最前面へ移動しない。
   * @ko 포커스를 받아도 창을 앞으로 올리지 않음.
   */
  NoBringToFrontOnFocus: 8192,
  /**
   * Show the vertical scrollbar even when content fits.
   *
   * @zh 即使内容未溢出也显示垂直滚动条。
   * @ja 内容が収まっていても縦スクロールバーを表示する。
   * @ko 내용이 넘치지 않아도 세로 스크롤바 표시.
   */
  AlwaysVerticalScrollbar: 16384,
  /**
   * Show the horizontal scrollbar even when content fits.
   *
   * @zh 即使内容未溢出也显示水平滚动条。
   * @ja 内容が収まっていても横スクロールバーを表示する。
   * @ko 내용이 넘치지 않아도 가로 스크롤바 표시.
   */
  AlwaysHorizontalScrollbar: 32768,
  /**
   * Disable keyboard and gamepad navigation inside the window.
   *
   * @zh 禁用窗口内部的键盘和手柄导航。
   * @ja ウィンドウ内のキーボードとゲームパッドのナビゲーションを無効化。
   * @ko 창 내부 키보드 및 게임패드 탐색 금지.
   */
  NoNavInputs: 65536,
  /**
   * Skip this window when navigating between windows, including Ctrl+Tab.
   *
   * @zh 窗口间导航（包括 Ctrl+Tab）时跳过此窗口。
   * @ja Ctrl+Tab などのウィンドウ切り替えでこのウィンドウを飛ばす。
   * @ko Ctrl+Tab 등 창 간 탐색에서 이 창을 건너뜀.
   */
  NoNavFocus: 131072,
  /**
   * Mark the title as unsaved; in tabs, select on close and wait for the
   * application to stop submitting the tab before removing it.
   *
   * @zh 标题显示未保存标记；标签关闭时先选中，等待应用停止提交后才移除。
   * @ja 未保存マークを表示。タブを閉じる際は選択し、送信停止まで残す。
   * @ko 미저장 표시. 탭을 닫을 때 선택하고 앱의 제출 중단까지 유지.
   */
  UnsavedDocument: 262144,
  /**
   * Disable both navigation within and navigation to this window.
   *
   * @zh 同时禁止窗口内部导航和导航至此窗口。
   * @ja ウィンドウ内とウィンドウへのナビゲーションを両方無効化。
   * @ko 창 내부 탐색과 이 창으로의 탐색을 모두 금지.
   */
  NoNav: 196608,
  /**
   * Hide title bar and scrollbars; disable resizing and collapsing.
   *
   * @zh 隐藏标题栏、滚动条，并禁止调整大小和折叠。
   * @ja タイトルバーとスクロールバーを隠し、サイズ変更と折り畳みを禁止。
   * @ko 제목 표시줄과 스크롤바를 숨기고 크기 조절 및 접기를 금지.
   */
  NoDecoration: 43,
  /**
   * Disable mouse input and all window navigation.
   *
   * @zh 禁用鼠标输入和全部窗口导航。
   * @ja マウス入力と全ウィンドウナビゲーションを無効化。
   * @ko 마우스 입력과 모든 창 탐색 금지.
   */
  NoInputs: 197120,
  /**
   * Internal child-window marker set by BeginChild().
   *
   * @zh BeginChild() 设置的内部子窗口标记。
   * @ja BeginChild() が設定する内部の子ウィンドウ印。
   * @ko BeginChild()가 설정하는 내부 자식 창 표시.
   */
  ChildWindow: 16777216,
  /**
   * Internal tooltip-window marker set by BeginTooltip().
   *
   * @zh BeginTooltip() 设置的内部提示窗口标记。
   * @ja BeginTooltip() が設定する内部のツールチップ印。
   * @ko BeginTooltip()가 설정하는 내부 툴팁 창 표시.
   */
  Tooltip: 33554432,
  /**
   * Internal popup-window marker set by BeginPopup().
   *
   * @zh BeginPopup() 设置的内部弹出窗口标记。
   * @ja BeginPopup() が設定する内部のポップアップ印。
   * @ko BeginPopup()가 설정하는 내부 팝업 창 표시.
   */
  Popup: 67108864,
  /**
   * Internal modal-window marker set by BeginPopupModal().
   *
   * @zh BeginPopupModal() 设置的内部模态窗口标记。
   * @ja BeginPopupModal() が設定する内部のモーダル印。
   * @ko BeginPopupModal()이 설정하는 내부 모달 창 표시.
   */
  Modal: 134217728,
  /**
   * Internal child-menu marker set by BeginMenu().
   *
   * @zh BeginMenu() 设置的内部子菜单标记。
   * @ja BeginMenu() が設定する内部の子メニュー印。
   * @ko BeginMenu()가 설정하는 내부 하위 메뉴 표시.
   */
  ChildMenu: 268435456,
  /**
   * Obsolete navigation-sharing bit; use ImGuiChildFlags.NavFlattened.
   *
   * @zh 旧导航共享位；改用 ImGuiChildFlags.NavFlattened。
   * @ja 旧ナビゲーション共有ビット。ImGuiChildFlags.NavFlattened を使う。
   * @ko 구형 탐색 공유 비트. ImGuiChildFlags.NavFlattened 사용.
   */
  NavFlattened: 536870912,
  /**
   * Obsolete padding bit; use ImGuiChildFlags.AlwaysUseWindowPadding.
   *
   * @zh 旧内边距位；改用 ImGuiChildFlags.AlwaysUseWindowPadding。
   * @ja 旧余白ビット。ImGuiChildFlags.AlwaysUseWindowPadding を使う。
   * @ko 구형 여백 비트. ImGuiChildFlags.AlwaysUseWindowPadding 사용.
   */
  AlwaysUseWindowPadding: 1073741824,
} as const);

/**
 * Bitwise combination of window options.
 *
 * @zh 窗口选项的按位组合。
 * @ja ウィンドウ設定のビット組み合わせ。
 * @ko 창 설정의 비트 조합.
 */
export type ImGuiWindowFlags = number;

/**
 * Child-window sizing, padding and navigation options for BeginChild().
 *
 * @zh BeginChild() 的尺寸、内边距和导航选项。
 * @ja BeginChild() のサイズ、余白、ナビゲーション設定。
 * @ko BeginChild()의 크기, 여백 및 탐색 설정.
 */
export const ImGuiChildFlags = Object.freeze({
  /**
   * Use default child-window behavior.
   *
   * @zh 使用默认子窗口行为。
   * @ja 標準の子ウィンドウ動作を使う。
   * @ko 기본 자식 창 동작 사용.
   */
  None: 0,
  /**
   * Draw an outer border and enable window padding.
   *
   * @zh 绘制外边框并启用窗口内边距。
   * @ja 外枠を描画し、ウィンドウ余白を有効にする。
   * @ko 외곽 테두리와 창 여백 사용.
   */
  Borders: 1,
  /**
   * Apply WindowPadding even without a border.
   *
   * @zh 无边框时也使用 WindowPadding。
   * @ja 枠がなくても WindowPadding を適用する。
   * @ko 테두리가 없어도 WindowPadding 적용.
   */
  AlwaysUseWindowPadding: 2,
  /**
   * Resize from the right edge; save size unless NoSavedSettings is set.
   *
   * @zh 可拖右边调整宽度；未设 NoSavedSettings 时保存尺寸。
   * @ja 右端で幅を変更。NoSavedSettings がなければサイズを保存。
   * @ko 오른쪽 가장자리로 너비 조절. NoSavedSettings가 없으면 크기 저장.
   */
  ResizeX: 4,
  /**
   * Resize from the bottom edge; save size unless NoSavedSettings is set.
   *
   * @zh 可拖下边调整高度；未设 NoSavedSettings 时保存尺寸。
   * @ja 下端で高さを変更。NoSavedSettings がなければサイズを保存。
   * @ko 아래 가장자리로 높이 조절. NoSavedSettings가 없으면 크기 저장.
   */
  ResizeY: 8,
  /**
   * Fit width to content when visible or appearing.
   *
   * @zh 可见或刚出现时按内容调整宽度。
   * @ja 表示中または出現時に幅を内容へ合わせる。
   * @ko 보이거나 나타날 때 내용에 맞춰 너비 조절.
   */
  AutoResizeX: 16,
  /**
   * Fit height to content when visible or appearing.
   *
   * @zh 可见或刚出现时按内容调整高度。
   * @ja 表示中または出現時に高さを内容へ合わせる。
   * @ko 보이거나 나타날 때 내용에 맞춰 높이 조절.
   */
  AutoResizeY: 32,
  /**
   * With AutoResizeX/Y, measure even when hidden. Disables coarse clipping:
   * BeginChild() always returns true.
   *
   * @zh 配合 AutoResizeX/Y，隐藏时仍测量；禁用粗裁剪，BeginChild() 总返回 true。
   * @ja AutoResizeX/Y と併用。非表示でも計測し、BeginChild() は常に true。
   * @ko AutoResizeX/Y와 함께 숨겨져도 측정. BeginChild()가 항상 true를 반환.
   */
  AlwaysAutoResize: 64,
  /**
   * Use framed-widget colors, rounding, border and padding.
   *
   * @zh 使用带框控件的颜色、圆角、边框和内边距。
   * @ja 枠付きウィジェットの色、角丸、枠幅、余白を使う。
   * @ko 프레임 위젯의 색, 둥근 모서리, 테두리 및 여백 사용.
   */
  FrameStyle: 128,
  /**
   * Share navigation focus with the parent and sibling children.
   *
   * @zh 与父窗口和兄弟子窗口共享导航焦点域。
   * @ja 親と兄弟の子ウィンドウとナビゲーション範囲を共有する。
   * @ko 부모 및 형제 자식 창과 탐색 포커스 범위 공유.
   */
  NavFlattened: 256,
  /**
   * Legacy alias of Borders: outer border plus window padding.
   *
   * @zh Borders 的旧别名：外边框和窗口内边距。
   * @ja Borders の旧名。外枠とウィンドウ余白。
   * @ko Borders의 구형 별칭. 외곽 테두리와 창 여백.
   */
  Border: 1,
} as const);

/**
 * Bitwise combination of child-window options.
 *
 * @zh 子窗口选项的按位组合。
 * @ja 子ウィンドウ設定のビット組み合わせ。
 * @ko 자식 창 설정의 비트 조합.
 */
export type ImGuiChildFlags = number;

/**
 * Scope of IsWindowFocused(); use IO capture flags to route raw input.
 *
 * @zh IsWindowFocused() 的检查范围；原始输入分发应使用 IO 捕获标志。
 * @ja IsWindowFocused() の範囲。生入力の振り分けには IO 捕捉フラグを使う。
 * @ko IsWindowFocused()의 범위. 원시 입력 전달에는 IO 캡처 플래그 사용.
 */
export const ImGuiFocusedFlags = Object.freeze({
  /**
   * Test only the current window.
   *
   * @zh 仅检查当前窗口。
   * @ja 現在のウィンドウのみ調べる。
   * @ko 현재 창만 검사.
   */
  None: 0,
  /**
   * Include focused child windows.
   *
   * @zh 包含获得焦点的子窗口。
   * @ja フォーカスを持つ子ウィンドウも含める。
   * @ko 포커스를 가진 자식 창 포함.
   */
  ChildWindows: 1,
  /**
   * Start the test from the topmost parent.
   *
   * @zh 从最上层父窗口开始检查。
   * @ja 最上位の親から調べる。
   * @ko 최상위 부모부터 검사.
   */
  RootWindow: 2,
  /**
   * Test whether any ImGui window is focused.
   *
   * @zh 检查任意 ImGui 窗口是否获得焦点。
   * @ja いずれかの ImGui ウィンドウにフォーカスがあるか調べる。
   * @ko ImGui 창 중 하나라도 포커스를 가졌는지 검사.
   */
  AnyWindow: 4,
  /**
   * Do not treat a popup's emitter as its parent.
   *
   * @zh 不把弹出窗口的发起者视为其父窗口。
   * @ja ポップアップの呼び出し元を親とみなさない。
   * @ko 팝업을 연 창을 부모로 취급하지 않음.
   */
  NoPopupHierarchy: 8,
  /**
   * Test the root window and all its children.
   *
   * @zh 检查根窗口及全部子窗口。
   * @ja ルートとその全子ウィンドウを調べる。
   * @ko 루트 창과 모든 자식 창 검사.
   */
  RootAndChildWindows: 3,
} as const);

/**
 * Bitwise combination of window-focus query options.
 *
 * @zh 窗口焦点查询选项的按位组合。
 * @ja ウィンドウフォーカス照会設定のビット組み合わせ。
 * @ko 창 포커스 조회 설정의 비트 조합.
 */
export type ImGuiFocusedFlags = number;

/**
 * Conditions for applying window settings; choose one, do not combine.
 *
 * @zh 应用窗口设置的条件；只能选择一个，不可组合。
 * @ja ウィンドウ設定を適用する条件。組み合わせず一つ選ぶ。
 * @ko 창 설정 적용 조건. 조합하지 말고 하나만 선택.
 */
export const ImGuiCond = Object.freeze({
  /**
   * Apply unconditionally, equivalent to Always.
   *
   * @zh 无条件应用，等同 Always。
   * @ja 無条件で適用。Always と同じ。
   * @ko 무조건 적용. Always와 동일.
   */
  None: 0,
  /**
   * Apply on every call.
   *
   * @zh 每次调用都应用。
   * @ja 呼び出すたびに適用する。
   * @ko 호출할 때마다 적용.
   */
  Always: 1,
  /**
   * Apply once per runtime session.
   *
   * @zh 每次运行会话仅应用一次。
   * @ja 実行セッションごとに一度だけ適用する。
   * @ko 실행 세션마다 한 번만 적용.
   */
  Once: 2,
  /**
   * Apply only when no saved INI settings exist for the window.
   *
   * @zh 仅在窗口没有已保存的 INI 设置时应用。
   * @ja ウィンドウの INI 設定が未保存の場合だけ適用する。
   * @ko 창의 저장된 INI 설정이 없을 때만 적용.
   */
  FirstUseEver: 4,
  /**
   * Apply on first appearance or when returning after an inactive frame.
   *
   * @zh 首次出现，或至少一帧未激活后重新出现时应用。
   * @ja 初回表示、または非アクティブなフレームの後の再表示で適用する。
   * @ko 처음 나타나거나 비활성 프레임 이후 다시 나타날 때 적용.
   */
  Appearing: 8,
} as const);

/**
 * A single condition for applying a setting.
 *
 * @zh 应用设置的单个条件。
 * @ja 設定適用の単一条件。
 * @ko 설정 적용을 위한 단일 조건.
 */
export type ImGuiCond = number;
