/**
 * Hover-query scope, obstruction exceptions and timing.
 * Use IO capture flags, not hover queries, to route raw mouse input.
 *
 * @zh 悬停查询范围、遮挡例外和时序。原始鼠标输入分发应使用 IO 捕获标志。
 * @ja ホバー照会の範囲、遮蔽の例外、時間設定。生入力の配送には IO 捕捉を使う。
 * @ko 호버 조회 범위, 가림 예외 및 시간 설정. 원시 입력 전달에는 IO 캡처 사용.
 */
export const ImGuiHoveredFlags = Object.freeze({
  /**
   * Require normal, unobstructed hover over the item or window.
   *
   * @zh 要求对控件或窗口的正常、未遮挡悬停。
   * @ja 項目またはウィンドウ上の通常の遮られないホバーを要求。
   * @ko 항목 또는 창 위의 가려지지 않은 일반 호버 요구.
   */
  None: 0,
  /**
   * Window queries: include hovered child windows.
   *
   * @zh 窗口查询：包含被悬停的子窗口。
   * @ja ウィンドウ照会でホバー中の子も含める。
   * @ko 창 조회에서 호버된 자식 창 포함.
   */
  ChildWindows: 1,
  /**
   * Window queries: start from the topmost parent.
   *
   * @zh 窗口查询：从最上层父窗口开始。
   * @ja ウィンドウ照会を最上位の親から行う。
   * @ko 창 조회를 최상위 부모부터 시작.
   */
  RootWindow: 2,
  /**
   * Window queries: test any ImGui window.
   *
   * @zh 窗口查询：检查任意 ImGui 窗口。
   * @ja ウィンドウ照会で全 ImGui ウィンドウを対象にする。
   * @ko 창 조회에서 모든 ImGui 창 검사.
   */
  AnyWindow: 4,
  /**
   * Window queries: do not treat popup emitters as parents.
   *
   * @zh 窗口查询：不将弹窗发起者视为父窗口。
   * @ja ウィンドウ照会でポップアップの呼び出し元を親とみなさない。
   * @ko 창 조회에서 팝업을 연 창을 부모로 취급하지 않음.
   */
  NoPopupHierarchy: 8,
  /**
   * Ignore blocking by a non-modal popup.
   *
   * @zh 忽略非模态弹窗的阻挡。
   * @ja 非モーダルポップアップによる遮断を無視する。
   * @ko 비모달 팝업의 차단 무시.
   */
  AllowWhenBlockedByPopup: 32,
  /**
   * Ignore blocking by another active item.
   *
   * @zh 忽略其他活动控件的阻挡。
   * @ja 別のアクティブ項目による遮断を無視する。
   * @ko 다른 활성 항목의 차단 무시.
   */
  AllowWhenBlockedByActiveItem: 128,
  /**
   * Item queries: accept overlap by another item in AllowOverlap mode.
   *
   * @zh 控件查询：AllowOverlap 模式下被其他控件覆盖仍算悬停。
   * @ja 項目照会で AllowOverlap による他項目の重なりを許容する。
   * @ko 항목 조회에서 AllowOverlap 상태의 다른 항목 겹침 허용.
   */
  AllowWhenOverlappedByItem: 256,
  /**
   * Item queries: accept overlap by another window.
   *
   * @zh 控件查询：被其他窗口覆盖仍算悬停。
   * @ja 項目照会で別ウィンドウの重なりを許容する。
   * @ko 항목 조회에서 다른 창의 겹침 허용.
   */
  AllowWhenOverlappedByWindow: 512,
  /**
   * Item queries: allow disabled items to count as hovered.
   *
   * @zh 控件查询：禁用项也可算作悬停。
   * @ja 項目照会で無効な項目もホバー対象にする。
   * @ko 항목 조회에서 비활성 항목의 호버도 허용.
   */
  AllowWhenDisabled: 1024,
  /**
   * Item queries: use mouse position even during keyboard/gamepad navigation.
   *
   * @zh 控件查询：键盘、手柄导航期间也只检测鼠标位置。
   * @ja 項目照会でキーやパッドの移動中もマウス位置を使う。
   * @ko 항목 조회에서 키보드 및 게임패드 탐색 중에도 마우스 위치 사용.
   */
  NoNavOverride: 2048,
  /**
   * Item queries: accept overlap by either items or windows.
   *
   * @zh 控件查询：允许被控件或窗口覆盖。
   * @ja 項目照会で項目とウィンドウ両方の重なりを許容。
   * @ko 항목 조회에서 항목과 창의 겹침 모두 허용.
   */
  AllowWhenOverlapped: 768,
  /**
   * Ignore popup/active-item blocking and item/window overlap.
   * Does not enable disabled items or bypass modal blocking.
   *
   * @zh 忽略弹窗、活动项阻挡及控件、窗口覆盖；不包含禁用项或模态阻挡。
   * @ja ポップアップ・操作中項目の遮断と重なりを無視。無効項目やモーダルは別。
   * @ko 팝업 및 활성 항목 차단과 겹침 무시. 비활성 항목 및 모달 차단은 제외.
   */
  RectOnly: 928,
  /**
   * Window queries: test the root and all its children.
   *
   * @zh 窗口查询：检查根窗口及全部子窗口。
   * @ja ウィンドウ照会でルートと全ての子を調べる。
   * @ko 창 조회에서 루트와 모든 자식 검사.
   */
  RootAndChildWindows: 3,
  /**
   * Use the style's tooltip hover policy for mouse or navigation.
   *
   * @zh 使用样式中针对鼠标或导航配置的提示悬停策略。
   * @ja マウスかナビゲーション用のスタイルのツールチップ方針を使う。
   * @ko 마우스 또는 탐색용으로 스타일에 지정된 툴팁 호버 정책 사용.
   */
  ForTooltip: 4096,
  /**
   * Require HoverStationaryDelay once; then movement on the same target is OK.
   *
   * @zh 先静止 HoverStationaryDelay，之后可在同一目标内移动。
   * @ja 一度 HoverStationaryDelay の静止を要求し、その後同じ対象内は移動可。
   * @ko 한 번 HoverStationaryDelay만큼 정지한 뒤 같은 대상 안에서는 이동 허용.
   */
  Stationary: 8192,
  /**
   * Item queries: report hover immediately, without a hover delay.
   *
   * @zh 控件查询：立即报告悬停，无需悬停延迟。
   * @ja 項目照会で待ち時間なしにホバーを返す。
   * @ko 항목 조회에서 호버 지연 없이 즉시 보고.
   */
  DelayNone: 16384,
  /**
   * Item queries: wait HoverDelayShort, shared across items.
   * Add Stationary to also require a pause in mouse movement.
   *
   * @zh 控件查询：等待 HoverDelayShort，项间共享计时；加 Stationary 才要求静止。
   * @ja 項目照会で共有の HoverDelayShort を待つ。静止には Stationary も必要。
   * @ko 항목 간 공유 HoverDelayShort 대기. 정지도 요구하려면 Stationary 추가.
   */
  DelayShort: 32768,
  /**
   * Item queries: wait HoverDelayNormal, shared across items.
   * Add Stationary to also require a pause in mouse movement.
   *
   * @zh 控件查询：等待 HoverDelayNormal，项间共享计时；加 Stationary 才要求静止。
   * @ja 項目照会で共有の HoverDelayNormal を待つ。静止には Stationary も必要。
   * @ko 항목 간 공유 HoverDelayNormal 대기. 정지도 요구하려면 Stationary 추가.
   */
  DelayNormal: 65536,
  /**
   * Item queries: restart the delay instead of sharing it between items.
   *
   * @zh 控件查询：不在控件间共享计时，重新等待延迟。
   * @ja 項目照会で待ち時間を他項目から引き継がず、計り直す。
   * @ko 항목 조회에서 지연을 다른 항목과 공유하지 않고 다시 시작.
   */
  NoSharedDelay: 131072,
} as const);

/**
 * Bitwise combination of hover-query options.
 *
 * @zh 悬停查询选项的按位组合。
 * @ja ホバー照会設定のビット組み合わせ。
 * @ko 호버 조회 설정의 비트 조합.
 */
export type ImGuiHoveredFlags = number;

/**
 * Drag source, payload lifetime and target acceptance options.
 *
 * @zh 拖动源、载荷生命周期和目标接收选项。
 * @ja ドラッグ元、ペイロード寿命、ドロップ先の受け入れ設定。
 * @ko 드래그 원본, 페이로드 수명 및 대상 수락 설정.
 */
export const ImGuiDragDropFlags = Object.freeze({
  /**
   * Use default drag-and-drop behavior.
   *
   * @zh 使用默认拖放行为。
   * @ja 標準のドラッグ＆ドロップ動作。
   * @ko 기본 드래그 앤 드롭 동작.
   */
  None: 0,
  /**
   * Do not create the source preview tooltip.
   *
   * @zh 不创建拖动源预览提示。
   * @ja ドラッグ元のプレビューツールチップを作らない。
   * @ko 원본 미리 보기 툴팁을 생성하지 않음.
   */
  SourceNoPreviewTooltip: 1,
  /**
   * Keep IsItemHovered() working on the source while dragging.
   *
   * @zh 拖动期间保留源控件的 IsItemHovered() 检测。
   * @ja ドラッグ中も元項目の IsItemHovered() 判定を維持する。
   * @ko 드래그 중 원본의 IsItemHovered() 판정 유지.
   */
  SourceNoDisableHover: 2,
  /**
   * Do not open tree nodes or headers by holding a drag over them.
   *
   * @zh 拖动悬停时不自动展开树节点或折叠标题。
   * @ja ドラッグを重ね続けてもツリーや見出しを開かない。
   * @ko 드래그를 머물러도 트리 노드나 제목을 펼치지 않음.
   */
  SourceNoHoldToOpenOthers: 4,
  /**
   * Give an ID-less source a temporary ID based on its window-relative
   * position.
   *
   * @zh 为无 ID 的源按窗口相对位置生成临时 ID。
   * @ja ID のない元項目にウィンドウ相対位置から仮 ID を与える。
   * @ko ID 없는 원본에 창 상대 위치 기반 임시 ID 부여.
   */
  SourceAllowNullID: 8,
  /**
   * External source: ignore current item/window; only one can be active.
   *
   * @zh 外部拖动源：忽略当前控件、窗口；同时只能有一个活动源。
   * @ja 外部のドラッグ元。現在の項目や窓を使わず、同時に一つのみ有効。
   * @ko 외부 원본. 현재 항목과 창을 무시하며 동시에 하나만 활성 가능.
   */
  SourceExtern: 16,
  /**
   * Expire the payload when its source stops being submitted.
   *
   * @zh 源停止提交时使载荷过期。
   * @ja 元項目の送信が止まるとペイロードを失効させる。
   * @ko 원본 제출이 중단되면 페이로드 만료.
   */
  PayloadAutoExpire: 32,
  /**
   * Hint that the payload must not be copied outside this ImGui context.
   *
   * @zh 提示载荷不得复制到当前 ImGui 上下文之外。
   * @ja この ImGui コンテキスト外へコピー不可というヒント。
   * @ko 이 ImGui 컨텍스트 밖으로 복사하면 안 된다는 힌트.
   */
  PayloadNoCrossContext: 64,
  /**
   * Hint that the payload must not be copied outside this process.
   *
   * @zh 提示载荷不得复制到当前进程之外。
   * @ja このプロセス外へコピー不可というヒント。
   * @ko 이 프로세스 밖으로 복사하면 안 된다는 힌트.
   */
  PayloadNoCrossProcess: 128,
  /**
   * Accept before mouse release; use Payload_IsDelivery(payload) on a non-null
   * payload to detect actual delivery.
   *
   * @zh 松开鼠标前即可接收；对非 null 的载荷调用 Payload_IsDelivery(payload) 判断实际交付。
   * @ja ボタンを離す前も受け入れます。null でないペイロードを Payload_IsDelivery(payload)
   * で確認し、実際の受け渡しを判定します。
   * @ko 마우스를 놓기 전에도 수락합니다. null이 아닌 페이로드에 Payload_IsDelivery(payload)를 호출해 실제
   * 전달을 확인합니다.
   */
  AcceptBeforeDelivery: 1024,
  /**
   * Do not draw the default target highlight rectangle.
   *
   * @zh 不绘制目标默认高亮矩形。
   * @ja ドロップ先の既定強調矩形を描かない。
   * @ko 대상의 기본 강조 사각형을 그리지 않음.
   */
  AcceptNoDrawDefaultRect: 2048,
  /**
   * Target requests that the source preview tooltip be hidden.
   *
   * @zh 由目标请求隐藏源预览提示。
   * @ja ドロップ先から元のプレビューツールチップを隠すよう要求。
   * @ko 대상에서 원본 미리 보기 툴팁 숨김 요청.
   */
  AcceptNoPreviewTooltip: 4096,
  /**
   * Inspect before delivery without drawing the target highlight rectangle.
   *
   * @zh 交付前检查载荷，且不绘制目标高亮矩形。
   * @ja 受け渡し前に内容を調べ、ドロップ先の強調矩形は描かない。
   * @ko 전달 전에 내용을 검사하고 대상 강조 사각형은 표시하지 않음.
   */
  AcceptPeekOnly: 3072,
  /**
   * Legacy alias of PayloadAutoExpire: expire when source submission stops.
   *
   * @zh PayloadAutoExpire 的旧别名：源停止提交时过期。
   * @ja PayloadAutoExpire の旧名。元の送信停止で失効。
   * @ko PayloadAutoExpire의 구형 별칭. 원본 제출 중단 시 만료.
   */
  SourceAutoExpirePayload: 32,
} as const);

/**
 * Bitwise combination of drag-and-drop options.
 *
 * @zh 拖放选项的按位组合。
 * @ja ドラッグ＆ドロップ設定のビット組み合わせ。
 * @ko 드래그 앤 드롭 설정의 비트 조합.
 */
export type ImGuiDragDropFlags = number;

/**
 * Shortcut repetition and routing; select only one Route policy.
 *
 * @zh 快捷键重复和路由设置；Route 策略只能选一个。
 * @ja ショートカットの反復と配送設定。Route 方針は一つだけ選ぶ。
 * @ko 단축키 반복 및 전달 설정. Route 정책은 하나만 선택.
 */
export const ImGuiInputFlags = Object.freeze({
  /**
   * Use default input behavior; shortcuts use focused routing.
   *
   * @zh 默认输入行为；快捷键使用焦点路由。
   * @ja 標準動作。ショートカットはフォーカス先へ配送する。
   * @ko 기본 입력 동작. 단축키는 포커스 경로로 전달.
   */
  None: 0,
  /**
   * Report repeated presses while a key or button is held.
   *
   * @zh 按住按键或按钮时报告重复按下。
   * @ja キーやボタンを押し続ける間、反復入力を報告する。
   * @ko 키 또는 버튼을 누르는 동안 반복 입력 보고.
   */
  Repeat: 1,
  /**
   * Route only to the active item.
   *
   * @zh 仅路由到活动控件。
   * @ja 操作中の項目だけに配送する。
   * @ko 활성 항목에만 전달.
   */
  RouteActive: 1024,
  /**
   * Prefer the deepest focused window, with active items taking priority.
   *
   * @zh 优先最深层焦点窗口，活动控件的优先级更高。
   * @ja 最深のフォーカス窓を優先し、操作中の項目はさらに優先する。
   * @ko 가장 깊은 포커스 창을 우선하며 활성 항목은 더 높은 우선순위.
   */
  RouteFocused: 2048,
  /**
   * Global route that yields to registered focused or active routes.
   *
   * @zh 全局路由，让位于已注册的焦点或活动项路由。
   * @ja 登録済みのフォーカス先や操作中項目に譲るグローバル配送。
   * @ko 등록된 포커스 또는 활성 경로에 양보하는 전역 전달.
   */
  RouteGlobal: 4096,
  /**
   * Poll keys directly without registering a route.
   *
   * @zh 不注册路由，直接查询按键。
   * @ja 配送先を登録せず、キーを直接調べる。
   * @ko 경로 등록 없이 키를 직접 조회.
   */
  RouteAlways: 8192,
  /**
   * Global route outranks focused windows, but not their active items.
   *
   * @zh 全局路由优先于焦点窗口，但不优先于其中的活动控件。
   * @ja グローバル配送をフォーカス窓より優先。ただし操作中項目は除く。
   * @ko 전역 경로를 포커스 창보다 우선하되 활성 항목은 제외.
   */
  RouteOverFocused: 16384,
  /**
   * Global route requests priority over active items; may disrupt text editing.
   *
   * @zh 全局路由请求高于活动控件的优先级，可能干扰文本编辑。
   * @ja 操作中項目より優先するグローバル配送。文字編集を妨げる場合がある。
   * @ko 활성 항목보다 높은 전역 우선순위 요청. 텍스트 편집을 방해할 수 있음.
   */
  RouteOverActive: 32768,
  /**
   * Suppress a global route when no ImGui window has focus.
   *
   * @zh 没有 ImGui 窗口获得焦点时禁用全局路由。
   * @ja ImGui 窓にフォーカスがない場合はグローバル配送を止める。
   * @ko ImGui 창에 포커스가 없으면 전역 전달 억제.
   */
  RouteUnlessBgFocused: 65536,
  /**
   * Evaluate routing from the root window instead of the current window.
   *
   * @zh 从根窗口而非当前窗口评估路由。
   * @ja 現在の窓ではなくルート窓の立場で配送を評価する。
   * @ko 현재 창 대신 루트 창 기준으로 전달 판단.
   */
  RouteFromRootWindow: 131072,
  /**
   * SetNextItemShortcut(): show the shortcut in a hover tooltip.
   *
   * @zh SetNextItemShortcut()：悬停提示中显示快捷键。
   * @ja SetNextItemShortcut() でホバーツールチップにキーを表示。
   * @ko SetNextItemShortcut()에서 호버 툴팁에 단축키 표시.
   */
  Tooltip: 262144,
} as const);

/**
 * Bitwise combination of shortcut routing and repetition options.
 *
 * @zh 快捷键路由和重复选项的按位组合。
 * @ja ショートカット配送と反復設定のビット組み合わせ。
 * @ko 단축키 전달 및 반복 설정의 비트 조합.
 */
export type ImGuiInputFlags = number;

/**
 * Application-owned IO configuration flags.
 *
 * @zh 由应用设置的 IO 配置标志。
 * @ja アプリケーションが設定する IO 構成フラグ。
 * @ko 애플리케이션이 설정하는 IO 구성 플래그.
 */
export const ImGuiConfigFlags = Object.freeze({
  /**
   * No optional configuration flags.
   *
   * @zh 无可选配置标志。
   * @ja 任意の構成フラグなし。
   * @ko 선택적 구성 플래그 없음.
   */
  None: 0,
  /**
   * Enable keyboard navigation and activation.
   *
   * @zh 启用键盘导航和激活。
   * @ja キーボードによる移動と実行を有効化する。
   * @ko 키보드 탐색 및 활성화 허용.
   */
  NavEnableKeyboard: 1,
  /**
   * Enable gamepad navigation; the backend must also report HasGamepad.
   *
   * @zh 启用手柄导航；后端还需报告 HasGamepad。
   * @ja パッド移動を有効化。バックエンドの HasGamepad も必要。
   * @ko 게임패드 탐색 허용. 백엔드의 HasGamepad 보고도 필요.
   */
  NavEnableGamepad: 2,
  /**
   * Disable mouse input and interactions.
   *
   * @zh 禁用鼠标输入和交互。
   * @ja マウス入力と操作を無効化する。
   * @ko 마우스 입력 및 상호 작용 금지.
   */
  NoMouse: 16,
  /**
   * Ask the backend not to change OS cursor shape or visibility.
   *
   * @zh 要求后端不改变系统光标形状或可见性。
   * @ja OS カーソルの形状と表示を変えないようバックエンドに要求。
   * @ko 백엔드에 OS 커서 모양 및 표시 상태를 바꾸지 않도록 요청.
   */
  NoMouseCursorChange: 32,
  /**
   * Ignore keyboard events and clear existing key states.
   *
   * @zh 忽略键盘事件并清空现有按键状态。
   * @ja キーボードイベントを無視し、既存キー状態を消去する。
   * @ko 키보드 이벤트를 무시하고 기존 키 상태 초기화.
   */
  NoKeyboard: 64,
  /**
   * Application metadata: sRGB-aware; unused by core ImGui.
   *
   * @zh 应用元信息：支持 sRGB；ImGui 核心不使用此位。
   * @ja アプリ情報。sRGB 対応を示すが ImGui 本体は使わない。
   * @ko 앱 메타데이터. sRGB 지원 표시이며 ImGui 코어는 사용하지 않음.
   */
  IsSRGB: 1048576,
  /**
   * Application metadata: touch-screen input; unused by core ImGui.
   *
   * @zh 应用元信息：使用触屏；ImGui 核心不使用此位。
   * @ja アプリ情報。タッチ画面使用を示すが ImGui 本体は使わない。
   * @ko 앱 메타데이터. 터치스크린 사용 표시이며 ImGui 코어는 사용하지 않음.
   */
  IsTouchScreen: 2097152,
  /**
   * Obsolete mouse-warp option; use IO.ConfigNavMoveSetMousePos.
   *
   * @zh 旧鼠标定位选项；改用 IO.ConfigNavMoveSetMousePos。
   * @ja 旧マウス位置変更設定。IO.ConfigNavMoveSetMousePos を使う。
   * @ko 구형 마우스 이동 설정. IO.ConfigNavMoveSetMousePos 사용.
   */
  NavEnableSetMousePos: 4,
  /**
   * Obsolete no-capture option; use IO.ConfigNavCaptureKeyboard = false.
   *
   * @zh 旧禁止捕获选项；改用 IO.ConfigNavCaptureKeyboard = false。
   * @ja 旧捕捉禁止設定。IO.ConfigNavCaptureKeyboard = false を使う。
   * @ko 구형 캡처 금지 설정. IO.ConfigNavCaptureKeyboard = false 사용.
   */
  NavNoCaptureKeyboard: 8,
} as const);

/**
 * Bitwise combination of application IO configuration options.
 *
 * @zh 应用 IO 配置选项的按位组合。
 * @ja アプリ IO 構成のビット組み合わせ。
 * @ko 앱 IO 구성의 비트 조합.
 */
export type ImGuiConfigFlags = number;

/**
 * Capabilities reported by the platform and renderer backends.
 *
 * @zh 平台与渲染后端报告的能力。
 * @ja プラットフォームと描画バックエンドが報告する能力。
 * @ko 플랫폼 및 렌더러 백엔드가 보고하는 기능.
 */
export const ImGuiBackendFlags = Object.freeze({
  /**
   * No optional backend capabilities reported.
   *
   * @zh 未报告可选后端能力。
   * @ja 任意のバックエンド能力の報告なし。
   * @ko 선택적 백엔드 기능 보고 없음.
   */
  None: 0,
  /**
   * Gamepad support is available and a gamepad is connected.
   *
   * @zh 支持手柄且当前已连接手柄。
   * @ja ゲームパッド対応で、現在接続されている。
   * @ko 게임패드를 지원하며 현재 연결되어 있음.
   */
  HasGamepad: 1,
  /**
   * Backend can honor requested OS mouse cursor shapes.
   *
   * @zh 后端能按请求改变系统鼠标光标形状。
   * @ja 要求された OS マウスカーソル形状に対応できる。
   * @ko 요청된 OS 마우스 커서 모양 적용 가능.
   */
  HasMouseCursors: 2,
  /**
   * Backend can honor IO.WantSetMousePos requests.
   *
   * @zh 后端能响应 IO.WantSetMousePos 定位请求。
   * @ja IO.WantSetMousePos の位置変更要求に対応できる。
   * @ko IO.WantSetMousePos 위치 이동 요청 처리 가능.
   */
  HasSetMousePos: 4,
  /**
   * Renderer supports VtxOffset for meshes beyond 64K with 16-bit indices.
   *
   * @zh 渲染器支持 VtxOffset，以 16 位索引绘制超过 64K 顶点的网格。
   * @ja VtxOffset により 16 ビット添字で 64K 超の頂点を描画できる。
   * @ko VtxOffset으로 16비트 인덱스에서 64K 초과 정점 메시 지원.
   */
  RendererHasVtxOffset: 8,
} as const);

/**
 * Bitwise combination of backend capability reports.
 *
 * @zh 后端能力报告的按位组合。
 * @ja バックエンド能力のビット組み合わせ。
 * @ko 백엔드 기능 보고의 비트 조합.
 */
export type ImGuiBackendFlags = number;

/**
 * Mouse button indices, not bit flags.
 *
 * @zh 鼠标按钮索引，不是位标志。
 * @ja マウスボタンの添字。ビットフラグではない。
 * @ko 마우스 버튼 인덱스. 비트 플래그가 아님.
 */
export const ImGuiMouseButton = Object.freeze({
  /**
   * Left mouse button.
   *
   * @zh 鼠标左键。
   * @ja マウス左ボタン。
   * @ko 마우스 왼쪽 버튼.
   */
  Left: 0,
  /**
   * Right mouse button.
   *
   * @zh 鼠标右键。
   * @ja マウス右ボタン。
   * @ko 마우스 오른쪽 버튼.
   */
  Right: 1,
  /**
   * Middle mouse button.
   *
   * @zh 鼠标中键。
   * @ja マウス中ボタン。
   * @ko 마우스 가운데 버튼.
   */
  Middle: 2,
  /**
   * Number of supported button slots, including two extra buttons.
   *
   * @zh 支持的按钮槽位数量，包含两个扩展按钮。
   * @ja 追加二ボタンを含む対応ボタン枠の数。
   * @ko 추가 버튼 두 개를 포함한 지원 버튼 슬롯 수.
   */
  COUNT: 5,
} as const);

/**
 * Index of a mouse button.
 *
 * @zh 鼠标按钮的索引。
 * @ja マウスボタンの添字。
 * @ko 마우스 버튼 인덱스.
 */
export type ImGuiMouseButton = number;

/**
 * Requested mouse cursor shapes.
 *
 * @zh 请求的鼠标光标形状。
 * @ja 要求するマウスカーソル形状。
 * @ko 요청하는 마우스 커서 모양.
 */
export const ImGuiMouseCursor = Object.freeze({
  /**
   * Hide the cursor.
   *
   * @zh 隐藏光标。
   * @ja カーソルを隠す。
   * @ko 커서 숨김.
   */
  None: -1,
  /**
   * Standard arrow pointer.
   *
   * @zh 标准箭头指针。
   * @ja 標準の矢印ポインター。
   * @ko 기본 화살표 포인터.
   */
  Arrow: 0,
  /**
   * Text insertion I-beam.
   *
   * @zh 文本插入 I 形光标。
   * @ja 文字入力用 I 字カーソル。
   * @ko 텍스트 삽입용 I자 커서.
   */
  TextInput: 1,
  /**
   * Four-direction movement cursor.
   *
   * @zh 四向移动光标。
   * @ja 四方向の移動カーソル。
   * @ko 네 방향 이동 커서.
   */
  ResizeAll: 2,
  /**
   * Vertical resize cursor.
   *
   * @zh 垂直调整大小光标。
   * @ja 縦方向のサイズ変更カーソル。
   * @ko 세로 크기 조절 커서.
   */
  ResizeNS: 3,
  /**
   * Horizontal resize cursor.
   *
   * @zh 水平调整大小光标。
   * @ja 横方向のサイズ変更カーソル。
   * @ko 가로 크기 조절 커서.
   */
  ResizeEW: 4,
  /**
   * Northeast/southwest diagonal resize cursor.
   *
   * @zh 东北至西南方向的斜向调整大小光标。
   * @ja 右上・左下方向のサイズ変更カーソル。
   * @ko 오른쪽 위와 왼쪽 아래 대각선 크기 조절 커서.
   */
  ResizeNESW: 5,
  /**
   * Northwest/southeast diagonal resize cursor.
   *
   * @zh 西北至东南方向的斜向调整大小光标。
   * @ja 左上・右下方向のサイズ変更カーソル。
   * @ko 왼쪽 위와 오른쪽 아래 대각선 크기 조절 커서.
   */
  ResizeNWSE: 6,
  /**
   * Pointing hand for links and similar targets.
   *
   * @zh 链接等目标使用的指向手形。
   * @ja リンクなどに使う指差しカーソル。
   * @ko 링크 등에 사용하는 손 모양 포인터.
   */
  Hand: 7,
  /**
   * Busy cursor indicating the application is unavailable.
   *
   * @zh 表示应用暂不可用的等待光标。
   * @ja アプリを操作できない待機カーソル。
   * @ko 앱을 사용할 수 없음을 나타내는 대기 커서.
   */
  Wait: 8,
  /**
   * Busy cursor indicating background work while interaction remains possible.
   *
   * @zh 表示后台忙碌但仍可交互的光标。
   * @ja 操作可能なまま背景処理中であることを示すカーソル。
   * @ko 상호 작용은 가능하지만 백그라운드 작업 중임을 나타내는 커서.
   */
  Progress: 9,
  /**
   * Forbidden-action cursor.
   *
   * @zh 禁止操作光标。
   * @ja 操作禁止カーソル。
   * @ko 작업 금지 커서.
   */
  NotAllowed: 10,
  /**
   * Number of visible cursor shapes; not a cursor.
   *
   * @zh 可见光标形状数量，不是光标。
   * @ja 表示カーソル形状の数。カーソル指定ではない。
   * @ko 표시 가능한 커서 모양 수. 커서가 아님.
   */
  COUNT: 11,
} as const);

/**
 * Numeric cursor-shape identifier.
 *
 * @zh 光标形状的数值标识。
 * @ja カーソル形状の数値識別子。
 * @ko 커서 모양의 숫자 식별자.
 */
export type ImGuiMouseCursor = number;

/**
 * Physical source of a pointer event.
 *
 * @zh 指针事件的物理来源。
 * @ja ポインターイベントの物理的な入力元。
 * @ko 포인터 이벤트의 물리적 입력 장치.
 */
export const ImGuiMouseSource = Object.freeze({
  /**
   * Physical mouse.
   *
   * @zh 物理鼠标。
   * @ja 物理マウス。
   * @ko 물리적 마우스.
   */
  Mouse: 0,
  /**
   * Direct touch-screen contact.
   *
   * @zh 直接触屏接触。
   * @ja タッチ画面への直接接触。
   * @ko 직접 터치스크린 접촉.
   */
  TouchScreen: 1,
  /**
   * Pen or stylus input.
   *
   * @zh 触控笔输入。
   * @ja ペン・スタイラス入力。
   * @ko 펜 또는 스타일러스 입력.
   */
  Pen: 2,
  /**
   * Number of pointer-source kinds; not an input source.
   *
   * @zh 指针来源类型数量，不是输入来源。
   * @ja ポインター入力元の種類数。入力元ではない。
   * @ko 포인터 입력 장치 종류 수. 입력 장치가 아님.
   */
  COUNT: 3,
} as const);

/**
 * Numeric identifier of a pointer input source.
 *
 * @zh 指针输入来源的数值标识。
 * @ja ポインター入力元の数値識別子。
 * @ko 포인터 입력 장치의 숫자 식별자.
 */
export type ImGuiMouseSource = number;
