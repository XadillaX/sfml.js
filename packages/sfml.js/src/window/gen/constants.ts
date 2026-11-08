// Generated from SFML headers; do not edit.
// Regenerate with npm run generate:window.

/**
 * Window style bit flags that can be combined with bitwise OR.
 * @zh 窗口样式位标志，可按位或组合。
 * @ja ビット単位の OR で組み合わせられるウィンドウスタイルのフラグ。
 * @ko 비트 OR 연산으로 조합할 수 있는 창 스타일 플래그.
 */
export enum Style {
  /**
   * No border / title bar (this flag and all others are mutually exclusive)
   * @zh 无边框或标题栏（此标志与其他所有标志互斥）
   * @ja 枠線とタイトルバーなし（このフラグは他のすべてのフラグと併用できません）
   * @ko 테두리와 제목 표시줄 없음(이 플래그는 다른 모든 플래그와 함께 사용할 수 없음)
   */
  None = 0,
  /**
   * Title bar + fixed border
   * @zh 标题栏和固定边框
   * @ja タイトルバーと固定サイズの枠線
   * @ko 제목 표시줄과 크기가 고정된 테두리
   */
  Titlebar = 1,
  /**
   * Title bar + resizable border + maximize button
   * @zh 标题栏、可调整大小的边框和最大化按钮
   * @ja タイトルバー、サイズ変更可能な枠線、最大化ボタン
   * @ko 제목 표시줄, 크기 조절 가능한 테두리 및 최대화 버튼
   */
  Resize = 2,
  /**
   * Title bar + close button (see note)
   * @zh 标题栏和关闭按钮（参见注释）
   * @ja タイトルバーと閉じるボタン（注記を参照）
   * @ko 제목 표시줄과 닫기 버튼(참고 사항 참조)
   */
  Close = 4,
  /**
   * Default window style
   * @zh 默认窗口样式
   * @ja 既定のウィンドウスタイル
   * @ko 기본 창 스타일
   */
  Default = 7,
}

/**
 * Initial window display state.
 * @zh 窗口初始显示状态。
 * @ja ウィンドウの初期表示状態。
 * @ko 창의 초기 표시 상태.
 */
export enum State {
  /**
   * Floating window
   * @zh 浮动窗口
   * @ja フローティングウィンドウ
   * @ko 일반 창
   */
  Windowed = 0,
  /**
   * Fullscreen window
   * @zh 全屏窗口
   * @ja 全画面ウィンドウ
   * @ko 전체 화면 창
   */
  Fullscreen = 1,
}

/**
 * System cursor shapes; availability depends on the platform.
 * @zh 系统光标形状，具体支持情况取决于平台。
 * @ja システムカーソルの形状。利用できる形状はプラットフォームに依存します。
 * @ko 시스템 커서 모양. 지원 여부는 플랫폼에 따라 다릅니다.
 */
export enum CursorType {
  /**
   * Arrow cursor (default)
   * @zh 箭头光标（默认）
   * @ja 矢印カーソル（既定）
   * @ko 화살표 커서(기본값)
   */
  Arrow = 0,
  /**
   * Busy arrow cursor
   * @zh 带忙碌指示的箭头光标
   * @ja 処理中を示す矢印カーソル
   * @ko 사용 중 표시가 있는 화살표 커서
   */
  ArrowWait = 1,
  /**
   * Busy cursor
   * @zh 忙碌光标
   * @ja 処理中カーソル
   * @ko 사용 중 커서
   */
  Wait = 2,
  /**
   * I-beam, cursor when hovering over a field allowing text entry
   * @zh I 形光标，悬停在允许输入文本的区域时显示
   * @ja テキスト入力欄にマウスを重ねたときの I 字カーソル
   * @ko 텍스트 입력 영역 위에 마우스를 올릴 때 표시되는 I자 커서
   */
  Text = 3,
  /**
   * Pointing hand cursor
   * @zh 手指指向光标
   * @ja 指差しハンドカーソル
   * @ko 가리키는 손 모양 커서
   */
  Hand = 4,
  /**
   * Horizontal double arrow cursor
   * @zh 水平双向箭头光标
   * @ja 水平方向の両矢印カーソル
   * @ko 수평 양방향 화살표 커서
   */
  SizeHorizontal = 5,
  /**
   * Vertical double arrow cursor
   * @zh 垂直双向箭头光标
   * @ja 垂直方向の両矢印カーソル
   * @ko 수직 양방향 화살표 커서
   */
  SizeVertical = 6,
  /**
   * Double arrow cursor going from top-left to bottom-right
   * @zh 从左上到右下的双向箭头光标
   * @ja 左上から右下に向かう両矢印カーソル
   * @ko 왼쪽 위에서 오른쪽 아래로 향하는 양방향 화살표 커서
   */
  SizeTopLeftBottomRight = 7,
  /**
   * Double arrow cursor going from bottom-left to top-right
   * @zh 从左下到右上的双向箭头光标
   * @ja 左下から右上に向かう両矢印カーソル
   * @ko 왼쪽 아래에서 오른쪽 위로 향하는 양방향 화살표 커서
   */
  SizeBottomLeftTopRight = 8,
  /**
   * Left arrow cursor on Linux, same as SizeHorizontal on other platforms
   * @zh Linux 上为左箭头光标，其他平台上与 SizeHorizontal 相同
   * @ja Linux では左矢印カーソル、他のプラットフォームでは SizeHorizontal と同じ
   * @ko Linux에서는 왼쪽 화살표 커서이며, 다른 플랫폼에서는 SizeHorizontal과 동일
   */
  SizeLeft = 9,
  /**
   * Right arrow cursor on Linux, same as SizeHorizontal on other platforms
   * @zh Linux 上为右箭头光标，其他平台上与 SizeHorizontal 相同
   * @ja Linux では右矢印カーソル、他のプラットフォームでは SizeHorizontal と同じ
   * @ko Linux에서는 오른쪽 화살표 커서이며, 다른 플랫폼에서는 SizeHorizontal과 동일
   */
  SizeRight = 10,
  /**
   * Up arrow cursor on Linux, same as SizeVertical on other platforms
   * @zh Linux 上为上箭头光标，其他平台上与 SizeVertical 相同
   * @ja Linux では上矢印カーソル、他のプラットフォームでは SizeVertical と同じ
   * @ko Linux에서는 위쪽 화살표 커서이며, 다른 플랫폼에서는 SizeVertical과 동일
   */
  SizeTop = 11,
  /**
   * Down arrow cursor on Linux, same as SizeVertical on other platforms
   * @zh Linux 上为下箭头光标，其他平台上与 SizeVertical 相同
   * @ja Linux では下矢印カーソル、他のプラットフォームでは SizeVertical と同じ
   * @ko Linux에서는 아래쪽 화살표 커서이며, 다른 플랫폼에서는 SizeVertical과 동일
   */
  SizeBottom = 12,
  /**
   * Top-left arrow cursor on Linux, same as SizeTopLeftBottomRight on other
   * platforms
   * @zh Linux 上为左上箭头光标，其他平台上与 SizeTopLeftBottomRight 相同
   * @ja Linux では左上矢印カーソル、他のプラットフォームでは SizeTopLeftBottomRight と同じ
   * @ko Linux에서는 왼쪽 위 화살표 커서이며, 다른 플랫폼에서는 SizeTopLeftBottomRight와 동일
   */
  SizeTopLeft = 13,
  /**
   * Bottom-right arrow cursor on Linux, same as SizeTopLeftBottomRight on other
   * platforms
   * @zh Linux 上为右下箭头光标，其他平台上与 SizeTopLeftBottomRight 相同
   * @ja Linux では右下矢印カーソル、他のプラットフォームでは SizeTopLeftBottomRight と同じ
   * @ko Linux에서는 오른쪽 아래 화살표 커서이며, 다른 플랫폼에서는 SizeTopLeftBottomRight와 동일
   */
  SizeBottomRight = 14,
  /**
   * Bottom-left arrow cursor on Linux, same as SizeBottomLeftTopRight on other
   * platforms
   * @zh Linux 上为左下箭头光标，其他平台上与 SizeBottomLeftTopRight 相同
   * @ja Linux では左下矢印カーソル、他のプラットフォームでは SizeBottomLeftTopRight と同じ
   * @ko Linux에서는 왼쪽 아래 화살표 커서이며, 다른 플랫폼에서는 SizeBottomLeftTopRight와 동일
   */
  SizeBottomLeft = 15,
  /**
   * Top-right arrow cursor on Linux, same as SizeBottomLeftTopRight on other
   * platforms
   * @zh Linux 上为右上箭头光标，其他平台上与 SizeBottomLeftTopRight 相同
   * @ja Linux では右上矢印カーソル、他のプラットフォームでは SizeBottomLeftTopRight と同じ
   * @ko Linux에서는 오른쪽 위 화살표 커서이며, 다른 플랫폼에서는 SizeBottomLeftTopRight와 동일
   */
  SizeTopRight = 16,
  /**
   * Combination of SizeHorizontal and SizeVertical
   * @zh SizeHorizontal 和 SizeVertical 的组合
   * @ja SizeHorizontal と SizeVertical の組み合わせ
   * @ko SizeHorizontal과 SizeVertical의 조합
   */
  SizeAll = 17,
  /**
   * Crosshair cursor
   * @zh 十字准星光标
   * @ja 十字カーソル
   * @ko 십자선 커서
   */
  Cross = 18,
  /**
   * Help cursor
   * @zh 帮助光标
   * @ja ヘルプカーソル
   * @ko 도움말 커서
   */
  Help = 19,
  /**
   * Action not allowed cursor
   * @zh 禁止操作光标
   * @ja 操作禁止カーソル
   * @ko 작업 금지 커서
   */
  NotAllowed = 20,
}

/**
 * Logical keys that depend on the system keyboard layout.
 * @zh 随系统键盘布局变化的逻辑按键。
 * @ja システムのキーボード配列に依存する論理キー。
 * @ko 시스템 키보드 배열에 따라 달라지는 논리 키.
 */
export enum KeyboardKey {
  /**
   * Unhandled key
   * @zh 未处理的按键
   * @ja 未対応のキー
   * @ko 처리되지 않는 키
   */
  Unknown = -1,
  /**
   * The A key
   * @zh A 键
   * @ja A キー
   * @ko A 키
   */
  A = 0,
  /**
   * The B key
   * @zh B 键
   * @ja B キー
   * @ko B 키
   */
  B = 1,
  /**
   * The C key
   * @zh C 键
   * @ja C キー
   * @ko C 키
   */
  C = 2,
  /**
   * The D key
   * @zh D 键
   * @ja D キー
   * @ko D 키
   */
  D = 3,
  /**
   * The E key
   * @zh E 键
   * @ja E キー
   * @ko E 키
   */
  E = 4,
  /**
   * The F key
   * @zh F 键
   * @ja F キー
   * @ko F 키
   */
  F = 5,
  /**
   * The G key
   * @zh G 键
   * @ja G キー
   * @ko G 키
   */
  G = 6,
  /**
   * The H key
   * @zh H 键
   * @ja H キー
   * @ko H 키
   */
  H = 7,
  /**
   * The I key
   * @zh I 键
   * @ja I キー
   * @ko I 키
   */
  I = 8,
  /**
   * The J key
   * @zh J 键
   * @ja J キー
   * @ko J 키
   */
  J = 9,
  /**
   * The K key
   * @zh K 键
   * @ja K キー
   * @ko K 키
   */
  K = 10,
  /**
   * The L key
   * @zh L 键
   * @ja L キー
   * @ko L 키
   */
  L = 11,
  /**
   * The M key
   * @zh M 键
   * @ja M キー
   * @ko M 키
   */
  M = 12,
  /**
   * The N key
   * @zh N 键
   * @ja N キー
   * @ko N 키
   */
  N = 13,
  /**
   * The O key
   * @zh O 键
   * @ja O キー
   * @ko O 키
   */
  O = 14,
  /**
   * The P key
   * @zh P 键
   * @ja P キー
   * @ko P 키
   */
  P = 15,
  /**
   * The Q key
   * @zh Q 键
   * @ja Q キー
   * @ko Q 키
   */
  Q = 16,
  /**
   * The R key
   * @zh R 键
   * @ja R キー
   * @ko R 키
   */
  R = 17,
  /**
   * The S key
   * @zh S 键
   * @ja S キー
   * @ko S 키
   */
  S = 18,
  /**
   * The T key
   * @zh T 键
   * @ja T キー
   * @ko T 키
   */
  T = 19,
  /**
   * The U key
   * @zh U 键
   * @ja U キー
   * @ko U 키
   */
  U = 20,
  /**
   * The V key
   * @zh V 键
   * @ja V キー
   * @ko V 키
   */
  V = 21,
  /**
   * The W key
   * @zh W 键
   * @ja W キー
   * @ko W 키
   */
  W = 22,
  /**
   * The X key
   * @zh X 键
   * @ja X キー
   * @ko X 키
   */
  X = 23,
  /**
   * The Y key
   * @zh Y 键
   * @ja Y キー
   * @ko Y 키
   */
  Y = 24,
  /**
   * The Z key
   * @zh Z 键
   * @ja Z キー
   * @ko Z 키
   */
  Z = 25,
  /**
   * The 0 key
   * @zh 0 键
   * @ja 0 キー
   * @ko 0 키
   */
  Num0 = 26,
  /**
   * The 1 key
   * @zh 1 键
   * @ja 1 キー
   * @ko 1 키
   */
  Num1 = 27,
  /**
   * The 2 key
   * @zh 2 键
   * @ja 2 キー
   * @ko 2 키
   */
  Num2 = 28,
  /**
   * The 3 key
   * @zh 3 键
   * @ja 3 キー
   * @ko 3 키
   */
  Num3 = 29,
  /**
   * The 4 key
   * @zh 4 键
   * @ja 4 キー
   * @ko 4 키
   */
  Num4 = 30,
  /**
   * The 5 key
   * @zh 5 键
   * @ja 5 キー
   * @ko 5 키
   */
  Num5 = 31,
  /**
   * The 6 key
   * @zh 6 键
   * @ja 6 キー
   * @ko 6 키
   */
  Num6 = 32,
  /**
   * The 7 key
   * @zh 7 键
   * @ja 7 キー
   * @ko 7 키
   */
  Num7 = 33,
  /**
   * The 8 key
   * @zh 8 键
   * @ja 8 キー
   * @ko 8 키
   */
  Num8 = 34,
  /**
   * The 9 key
   * @zh 9 键
   * @ja 9 キー
   * @ko 9 키
   */
  Num9 = 35,
  /**
   * The Escape key
   * @zh Escape（退出） 键
   * @ja Escape キー
   * @ko Escape 키
   */
  Escape = 36,
  /**
   * The left Control key
   * @zh 左侧 Control 键
   * @ja 左 Control キー
   * @ko 왼쪽 Control 키
   */
  LControl = 37,
  /**
   * The left Shift key
   * @zh 左侧 Shift 键
   * @ja 左 Shift キー
   * @ko 왼쪽 Shift 키
   */
  LShift = 38,
  /**
   * The left Alt key
   * @zh 左侧 Alt 键
   * @ja 左 Alt キー
   * @ko 왼쪽 Alt 키
   */
  LAlt = 39,
  /**
   * The left OS specific key: window (Windows and Linux), apple (macOS), ...
   * @zh 左侧操作系统专用键：Windows 标志键（Windows 和 Linux）、Apple 键（macOS）等
   * @ja 左側の OS 固有キー：Windows キー（Windows と Linux）、Apple キー（macOS）など
   * @ko 왼쪽 OS 전용 키: Windows 키(Windows 및 Linux), Apple 키(macOS) 등
   */
  LSystem = 40,
  /**
   * The right Control key
   * @zh 右侧 Control 键
   * @ja 右 Control キー
   * @ko 오른쪽 Control 키
   */
  RControl = 41,
  /**
   * The right Shift key
   * @zh 右侧 Shift 键
   * @ja 右 Shift キー
   * @ko 오른쪽 Shift 키
   */
  RShift = 42,
  /**
   * The right Alt key
   * @zh 右侧 Alt 键
   * @ja 右 Alt キー
   * @ko 오른쪽 Alt 키
   */
  RAlt = 43,
  /**
   * The right OS specific key: window (Windows and Linux), apple (macOS), ...
   * @zh 右侧操作系统专用键：Windows 标志键（Windows 和 Linux）、Apple 键（macOS）等
   * @ja 右側の OS 固有キー：Windows キー（Windows と Linux）、Apple キー（macOS）など
   * @ko 오른쪽 OS 전용 키: Windows 키(Windows 및 Linux), Apple 키(macOS) 등
   */
  RSystem = 44,
  /**
   * The Menu key
   * @zh 菜单 键
   * @ja メニュー キー
   * @ko 메뉴 키
   */
  Menu = 45,
  /**
   * The [ key
   * @zh [ 键
   * @ja [ キー
   * @ko [ 키
   */
  LBracket = 46,
  /**
   * The ] key
   * @zh ] 键
   * @ja ] キー
   * @ko ] 키
   */
  RBracket = 47,
  /**
   * The ; key
   * @zh ; 键
   * @ja ; キー
   * @ko ; 키
   */
  Semicolon = 48,
  /**
   * The , key
   * @zh , 键
   * @ja , キー
   * @ko , 키
   */
  Comma = 49,
  /**
   * The . key
   * @zh . 键
   * @ja . キー
   * @ko . 키
   */
  Period = 50,
  /**
   * The ' key
   * @zh ' 键
   * @ja ' キー
   * @ko ' 키
   */
  Apostrophe = 51,
  /**
   * The / key
   * @zh / 键
   * @ja / キー
   * @ko / 키
   */
  Slash = 52,
  /**
   * The \ key
   * @zh \ 键
   * @ja \ キー
   * @ko \ 키
   */
  Backslash = 53,
  /**
   * The \` key
   * @zh \` 键
   * @ja \` キー
   * @ko \` 키
   */
  Grave = 54,
  /**
   * The = key
   * @zh = 键
   * @ja = キー
   * @ko = 키
   */
  Equal = 55,
  /**
   * The - key (hyphen)
   * @zh - 键（连字符）
   * @ja - キー（ハイフン）
   * @ko - 키(하이픈)
   */
  Hyphen = 56,
  /**
   * The Space key
   * @zh 空格 键
   * @ja スペース キー
   * @ko 스페이스 키
   */
  Space = 57,
  /**
   * The Enter/Return keys
   * @zh Enter/Return（回车）键
   * @ja Enter/Return キー
   * @ko Enter/Return 키
   */
  Enter = 58,
  /**
   * The Backspace key
   * @zh Backspace（退格） 键
   * @ja Backspace キー
   * @ko 백스페이스 키
   */
  Backspace = 59,
  /**
   * The Tabulation key
   * @zh Tab（制表） 键
   * @ja Tab キー
   * @ko Tab 키
   */
  Tab = 60,
  /**
   * The Page up key
   * @zh Page Up（向上翻页） 键
   * @ja Page Up（前のページ） キー
   * @ko Page Up(이전 페이지) 키
   */
  PageUp = 61,
  /**
   * The Page down key
   * @zh Page Down（向下翻页） 键
   * @ja Page Down（次のページ） キー
   * @ko Page Down(다음 페이지) 키
   */
  PageDown = 62,
  /**
   * The End key
   * @zh End（末尾） 键
   * @ja End（末尾） キー
   * @ko End(끝) 키
   */
  End = 63,
  /**
   * The Home key
   * @zh Home（开头） 键
   * @ja Home（先頭） キー
   * @ko Home(처음) 키
   */
  Home = 64,
  /**
   * The Insert key
   * @zh Insert（插入） 键
   * @ja Insert（挿入） キー
   * @ko Insert(삽입) 키
   */
  Insert = 65,
  /**
   * The Delete key
   * @zh Delete（删除） 键
   * @ja Delete（削除） キー
   * @ko Delete(삭제) 키
   */
  Delete = 66,
  /**
   * The + key
   * @zh + 键
   * @ja + キー
   * @ko + 키
   */
  Add = 67,
  /**
   * The - key (minus, usually from numpad)
   * @zh - 键（减号，通常位于数字小键盘）
   * @ja - キー（マイナス、通常はテンキー）
   * @ko - 키(빼기, 일반적으로 숫자 키패드에 있음)
   */
  Subtract = 68,
  /**
   * The * key
   * @zh * 键
   * @ja * キー
   * @ko * 키
   */
  Multiply = 69,
  /**
   * The / key
   * @zh / 键
   * @ja / キー
   * @ko / 키
   */
  Divide = 70,
  /**
   * Left arrow
   * @zh 左方向键
   * @ja 左矢印キー
   * @ko 왼쪽 화살표 키
   */
  Left = 71,
  /**
   * Right arrow
   * @zh 右方向键
   * @ja 右矢印キー
   * @ko 오른쪽 화살표 키
   */
  Right = 72,
  /**
   * Up arrow
   * @zh 上方向键
   * @ja 上矢印キー
   * @ko 위쪽 화살표 키
   */
  Up = 73,
  /**
   * Down arrow
   * @zh 下方向键
   * @ja 下矢印キー
   * @ko 아래쪽 화살표 키
   */
  Down = 74,
  /**
   * The numpad 0 key
   * @zh 数字小键盘上的 0 键
   * @ja テンキーの 0 キー
   * @ko 숫자 키패드의 0 키
   */
  Numpad0 = 75,
  /**
   * The numpad 1 key
   * @zh 数字小键盘上的 1 键
   * @ja テンキーの 1 キー
   * @ko 숫자 키패드의 1 키
   */
  Numpad1 = 76,
  /**
   * The numpad 2 key
   * @zh 数字小键盘上的 2 键
   * @ja テンキーの 2 キー
   * @ko 숫자 키패드의 2 키
   */
  Numpad2 = 77,
  /**
   * The numpad 3 key
   * @zh 数字小键盘上的 3 键
   * @ja テンキーの 3 キー
   * @ko 숫자 키패드의 3 키
   */
  Numpad3 = 78,
  /**
   * The numpad 4 key
   * @zh 数字小键盘上的 4 键
   * @ja テンキーの 4 キー
   * @ko 숫자 키패드의 4 키
   */
  Numpad4 = 79,
  /**
   * The numpad 5 key
   * @zh 数字小键盘上的 5 键
   * @ja テンキーの 5 キー
   * @ko 숫자 키패드의 5 키
   */
  Numpad5 = 80,
  /**
   * The numpad 6 key
   * @zh 数字小键盘上的 6 键
   * @ja テンキーの 6 キー
   * @ko 숫자 키패드의 6 키
   */
  Numpad6 = 81,
  /**
   * The numpad 7 key
   * @zh 数字小键盘上的 7 键
   * @ja テンキーの 7 キー
   * @ko 숫자 키패드의 7 키
   */
  Numpad7 = 82,
  /**
   * The numpad 8 key
   * @zh 数字小键盘上的 8 键
   * @ja テンキーの 8 キー
   * @ko 숫자 키패드의 8 키
   */
  Numpad8 = 83,
  /**
   * The numpad 9 key
   * @zh 数字小键盘上的 9 键
   * @ja テンキーの 9 キー
   * @ko 숫자 키패드의 9 키
   */
  Numpad9 = 84,
  /**
   * The F1 key
   * @zh F1 键
   * @ja F1 キー
   * @ko F1 키
   */
  F1 = 85,
  /**
   * The F2 key
   * @zh F2 键
   * @ja F2 キー
   * @ko F2 키
   */
  F2 = 86,
  /**
   * The F3 key
   * @zh F3 键
   * @ja F3 キー
   * @ko F3 키
   */
  F3 = 87,
  /**
   * The F4 key
   * @zh F4 键
   * @ja F4 キー
   * @ko F4 키
   */
  F4 = 88,
  /**
   * The F5 key
   * @zh F5 键
   * @ja F5 キー
   * @ko F5 키
   */
  F5 = 89,
  /**
   * The F6 key
   * @zh F6 键
   * @ja F6 キー
   * @ko F6 키
   */
  F6 = 90,
  /**
   * The F7 key
   * @zh F7 键
   * @ja F7 キー
   * @ko F7 키
   */
  F7 = 91,
  /**
   * The F8 key
   * @zh F8 键
   * @ja F8 キー
   * @ko F8 키
   */
  F8 = 92,
  /**
   * The F9 key
   * @zh F9 键
   * @ja F9 キー
   * @ko F9 키
   */
  F9 = 93,
  /**
   * The F10 key
   * @zh F10 键
   * @ja F10 キー
   * @ko F10 키
   */
  F10 = 94,
  /**
   * The F11 key
   * @zh F11 键
   * @ja F11 キー
   * @ko F11 키
   */
  F11 = 95,
  /**
   * The F12 key
   * @zh F12 键
   * @ja F12 キー
   * @ko F12 키
   */
  F12 = 96,
  /**
   * The F13 key
   * @zh F13 键
   * @ja F13 キー
   * @ko F13 키
   */
  F13 = 97,
  /**
   * The F14 key
   * @zh F14 键
   * @ja F14 キー
   * @ko F14 키
   */
  F14 = 98,
  /**
   * The F15 key
   * @zh F15 键
   * @ja F15 キー
   * @ko F15 키
   */
  F15 = 99,
  /**
   * The Pause key
   * @zh Pause（暂停） 键
   * @ja Pause（一時停止） キー
   * @ko Pause(일시 정지) 키
   */
  Pause = 100,
}

/**
 * Physical keys independent of the keyboard layout.
 * @zh 与键盘布局无关的物理按键。
 * @ja キーボード配列に依存しない物理キー。
 * @ko 키보드 배열과 무관한 물리 키.
 */
export enum KeyboardScancode {
  /**
   * Represents any scancode not present in this enum
   * @zh 表示未包含在此枚举中的任何扫描码
   * @ja この列挙型に含まれないすべてのスキャンコードを表します
   * @ko 이 열거형에 없는 모든 스캔 코드를 나타냄
   */
  Unknown = -1,
  /**
   * Keyboard a and A key
   * @zh 键盘上的 a 和 A 键
   * @ja キーボードの a と A のキー
   * @ko 키보드의 a 및 A 키
   */
  A = 0,
  /**
   * Keyboard b and B key
   * @zh 键盘上的 b 和 B 键
   * @ja キーボードの b と B のキー
   * @ko 키보드의 b 및 B 키
   */
  B = 1,
  /**
   * Keyboard c and C key
   * @zh 键盘上的 c 和 C 键
   * @ja キーボードの c と C のキー
   * @ko 키보드의 c 및 C 키
   */
  C = 2,
  /**
   * Keyboard d and D key
   * @zh 键盘上的 d 和 D 键
   * @ja キーボードの d と D のキー
   * @ko 키보드의 d 및 D 키
   */
  D = 3,
  /**
   * Keyboard e and E key
   * @zh 键盘上的 e 和 E 键
   * @ja キーボードの e と E のキー
   * @ko 키보드의 e 및 E 키
   */
  E = 4,
  /**
   * Keyboard f and F key
   * @zh 键盘上的 f 和 F 键
   * @ja キーボードの f と F のキー
   * @ko 키보드의 f 및 F 키
   */
  F = 5,
  /**
   * Keyboard g and G key
   * @zh 键盘上的 g 和 G 键
   * @ja キーボードの g と G のキー
   * @ko 키보드의 g 및 G 키
   */
  G = 6,
  /**
   * Keyboard h and H key
   * @zh 键盘上的 h 和 H 键
   * @ja キーボードの h と H のキー
   * @ko 키보드의 h 및 H 키
   */
  H = 7,
  /**
   * Keyboard i and I key
   * @zh 键盘上的 i 和 I 键
   * @ja キーボードの i と I のキー
   * @ko 키보드의 i 및 I 키
   */
  I = 8,
  /**
   * Keyboard j and J key
   * @zh 键盘上的 j 和 J 键
   * @ja キーボードの j と J のキー
   * @ko 키보드의 j 및 J 키
   */
  J = 9,
  /**
   * Keyboard k and K key
   * @zh 键盘上的 k 和 K 键
   * @ja キーボードの k と K のキー
   * @ko 키보드의 k 및 K 키
   */
  K = 10,
  /**
   * Keyboard l and L key
   * @zh 键盘上的 l 和 L 键
   * @ja キーボードの l と L のキー
   * @ko 키보드의 l 및 L 키
   */
  L = 11,
  /**
   * Keyboard m and M key
   * @zh 键盘上的 m 和 M 键
   * @ja キーボードの m と M のキー
   * @ko 키보드의 m 및 M 키
   */
  M = 12,
  /**
   * Keyboard n and N key
   * @zh 键盘上的 n 和 N 键
   * @ja キーボードの n と N のキー
   * @ko 키보드의 n 및 N 키
   */
  N = 13,
  /**
   * Keyboard o and O key
   * @zh 键盘上的 o 和 O 键
   * @ja キーボードの o と O のキー
   * @ko 키보드의 o 및 O 키
   */
  O = 14,
  /**
   * Keyboard p and P key
   * @zh 键盘上的 p 和 P 键
   * @ja キーボードの p と P のキー
   * @ko 키보드의 p 및 P 키
   */
  P = 15,
  /**
   * Keyboard q and Q key
   * @zh 键盘上的 q 和 Q 键
   * @ja キーボードの q と Q のキー
   * @ko 키보드의 q 및 Q 키
   */
  Q = 16,
  /**
   * Keyboard r and R key
   * @zh 键盘上的 r 和 R 键
   * @ja キーボードの r と R のキー
   * @ko 키보드의 r 및 R 키
   */
  R = 17,
  /**
   * Keyboard s and S key
   * @zh 键盘上的 s 和 S 键
   * @ja キーボードの s と S のキー
   * @ko 키보드의 s 및 S 키
   */
  S = 18,
  /**
   * Keyboard t and T key
   * @zh 键盘上的 t 和 T 键
   * @ja キーボードの t と T のキー
   * @ko 키보드의 t 및 T 키
   */
  T = 19,
  /**
   * Keyboard u and U key
   * @zh 键盘上的 u 和 U 键
   * @ja キーボードの u と U のキー
   * @ko 키보드의 u 및 U 키
   */
  U = 20,
  /**
   * Keyboard v and V key
   * @zh 键盘上的 v 和 V 键
   * @ja キーボードの v と V のキー
   * @ko 키보드의 v 및 V 키
   */
  V = 21,
  /**
   * Keyboard w and W key
   * @zh 键盘上的 w 和 W 键
   * @ja キーボードの w と W のキー
   * @ko 키보드의 w 및 W 키
   */
  W = 22,
  /**
   * Keyboard x and X key
   * @zh 键盘上的 x 和 X 键
   * @ja キーボードの x と X のキー
   * @ko 키보드의 x 및 X 키
   */
  X = 23,
  /**
   * Keyboard y and Y key
   * @zh 键盘上的 y 和 Y 键
   * @ja キーボードの y と Y のキー
   * @ko 키보드의 y 및 Y 키
   */
  Y = 24,
  /**
   * Keyboard z and Z key
   * @zh 键盘上的 z 和 Z 键
   * @ja キーボードの z と Z のキー
   * @ko 키보드의 z 및 Z 키
   */
  Z = 25,
  /**
   * Keyboard 1 and ! key
   * @zh 键盘上的 1 和 ! 键
   * @ja キーボードの 1 と ! のキー
   * @ko 키보드의 1 및 ! 키
   */
  Num1 = 26,
  /**
   * Keyboard 2 and @ key
   * @zh 键盘上的 2 和 @ 键
   * @ja キーボードの 2 と @ のキー
   * @ko 키보드의 2 및 @ 키
   */
  Num2 = 27,
  /**
   * Keyboard 3 and # key
   * @zh 键盘上的 3 和 # 键
   * @ja キーボードの 3 と # のキー
   * @ko 키보드의 3 및 # 키
   */
  Num3 = 28,
  /**
   * Keyboard 4 and $ key
   * @zh 键盘上的 4 和 $ 键
   * @ja キーボードの 4 と $ のキー
   * @ko 키보드의 4 및 $ 키
   */
  Num4 = 29,
  /**
   * Keyboard 5 and % key
   * @zh 键盘上的 5 和 % 键
   * @ja キーボードの 5 と % のキー
   * @ko 키보드의 5 및 % 키
   */
  Num5 = 30,
  /**
   * Keyboard 6 and ^ key
   * @zh 键盘上的 6 和 ^ 键
   * @ja キーボードの 6 と ^ のキー
   * @ko 키보드의 6 및 ^ 키
   */
  Num6 = 31,
  /**
   * Keyboard 7 and & key
   * @zh 键盘上的 7 和 & 键
   * @ja キーボードの 7 と & のキー
   * @ko 키보드의 7 및 & 키
   */
  Num7 = 32,
  /**
   * Keyboard 8 and * key
   * @zh 键盘上的 8 和 * 键
   * @ja キーボードの 8 と * のキー
   * @ko 키보드의 8 및 * 키
   */
  Num8 = 33,
  /**
   * Keyboard 9 and ) key
   * @zh 键盘上的 9 和 ) 键
   * @ja キーボードの 9 と ) のキー
   * @ko 키보드의 9 및 ) 키
   */
  Num9 = 34,
  /**
   * Keyboard 0 and ) key
   * @zh 键盘上的 0 和 ) 键
   * @ja キーボードの 0 と ) のキー
   * @ko 키보드의 0 및 ) 키
   */
  Num0 = 35,
  /**
   * Keyboard Enter/Return key
   * @zh 键盘上的 Enter/Return（回车） 键
   * @ja キーボードの Enter/Return キー
   * @ko 키보드의 Enter/Return 키
   */
  Enter = 36,
  /**
   * Keyboard Escape key
   * @zh 键盘上的 Escape（退出） 键
   * @ja キーボードの Escape キー
   * @ko 키보드의 Escape 키
   */
  Escape = 37,
  /**
   * Keyboard Backspace key
   * @zh 键盘上的 Backspace（退格） 键
   * @ja キーボードの Backspace キー
   * @ko 키보드의 백스페이스 키
   */
  Backspace = 38,
  /**
   * Keyboard Tab key
   * @zh 键盘上的 Tab（制表） 键
   * @ja キーボードの Tab キー
   * @ko 키보드의 Tab 키
   */
  Tab = 39,
  /**
   * Keyboard Space key
   * @zh 键盘上的 空格 键
   * @ja キーボードの スペース キー
   * @ko 키보드의 스페이스 키
   */
  Space = 40,
  /**
   * Keyboard - and _ key
   * @zh 键盘上的 - 和 _ 键
   * @ja キーボードの - と _ のキー
   * @ko 키보드의 - 및 _ 키
   */
  Hyphen = 41,
  /**
   * Keyboard = and +
   * @zh 键盘上的 = 和 + 键
   * @ja キーボードの = と + のキー
   * @ko 키보드의 = 및 + 키
   */
  Equal = 42,
  /**
   * Keyboard [ and { key
   * @zh 键盘上的 [ 和 { 键
   * @ja キーボードの [ と { のキー
   * @ko 키보드의 [ 및 { 키
   */
  LBracket = 43,
  /**
   * Keyboard ] and } key
   * @zh 键盘上的 ] 和 } 键
   * @ja キーボードの ] と } のキー
   * @ko 키보드의 ] 및 } 키
   */
  RBracket = 44,
  /**
   * Keyboard \ and | key OR various keys for Non-US keyboards
   * @zh 键盘上的 \ 和 | 键，或非美式键盘上的其他对应键
   * @ja キーボードの \ と | のキー、または米国配列以外のキーボードの各種キー
   * @ko 키보드의 \ 및 | 키 또는 미국식이 아닌 키보드의 여러 대응 키
   */
  Backslash = 45,
  /**
   * Keyboard ; and : key
   * @zh 键盘上的 ; 和 : 键
   * @ja キーボードの ; と : のキー
   * @ko 키보드의 ; 및 : 키
   */
  Semicolon = 46,
  /**
   * Keyboard ' and " key
   * @zh 键盘上的 ' 和 " 键
   * @ja キーボードの ' と " のキー
   * @ko 키보드의 ' 및 " 키
   */
  Apostrophe = 47,
  /**
   * Keyboard \` and ~ key
   * @zh 键盘上的 \` 和 ~ 键
   * @ja キーボードの \` と ~ のキー
   * @ko 키보드의 \` 및 ~ 키
   */
  Grave = 48,
  /**
   * Keyboard , and < key
   * @zh 键盘上的 , 和 < 键
   * @ja キーボードの , と < のキー
   * @ko 키보드의 , 및 < 키
   */
  Comma = 49,
  /**
   * Keyboard . and > key
   * @zh 键盘上的 . 和 > 键
   * @ja キーボードの . と > のキー
   * @ko 키보드의 . 및 > 키
   */
  Period = 50,
  /**
   * Keyboard / and ? key
   * @zh 键盘上的 / 和 ? 键
   * @ja キーボードの / と ? のキー
   * @ko 키보드의 / 및 ? 키
   */
  Slash = 51,
  /**
   * Keyboard F1 key
   * @zh 键盘上的 F1 键
   * @ja キーボードの F1 キー
   * @ko 키보드의 F1 키
   */
  F1 = 52,
  /**
   * Keyboard F2 key
   * @zh 键盘上的 F2 键
   * @ja キーボードの F2 キー
   * @ko 키보드의 F2 키
   */
  F2 = 53,
  /**
   * Keyboard F3 key
   * @zh 键盘上的 F3 键
   * @ja キーボードの F3 キー
   * @ko 키보드의 F3 키
   */
  F3 = 54,
  /**
   * Keyboard F4 key
   * @zh 键盘上的 F4 键
   * @ja キーボードの F4 キー
   * @ko 키보드의 F4 키
   */
  F4 = 55,
  /**
   * Keyboard F5 key
   * @zh 键盘上的 F5 键
   * @ja キーボードの F5 キー
   * @ko 키보드의 F5 키
   */
  F5 = 56,
  /**
   * Keyboard F6 key
   * @zh 键盘上的 F6 键
   * @ja キーボードの F6 キー
   * @ko 키보드의 F6 키
   */
  F6 = 57,
  /**
   * Keyboard F7 key
   * @zh 键盘上的 F7 键
   * @ja キーボードの F7 キー
   * @ko 키보드의 F7 키
   */
  F7 = 58,
  /**
   * Keyboard F8 key
   * @zh 键盘上的 F8 键
   * @ja キーボードの F8 キー
   * @ko 키보드의 F8 키
   */
  F8 = 59,
  /**
   * Keyboard F9 key
   * @zh 键盘上的 F9 键
   * @ja キーボードの F9 キー
   * @ko 키보드의 F9 키
   */
  F9 = 60,
  /**
   * Keyboard F10 key
   * @zh 键盘上的 F10 键
   * @ja キーボードの F10 キー
   * @ko 키보드의 F10 키
   */
  F10 = 61,
  /**
   * Keyboard F11 key
   * @zh 键盘上的 F11 键
   * @ja キーボードの F11 キー
   * @ko 키보드의 F11 키
   */
  F11 = 62,
  /**
   * Keyboard F12 key
   * @zh 键盘上的 F12 键
   * @ja キーボードの F12 キー
   * @ko 키보드의 F12 키
   */
  F12 = 63,
  /**
   * Keyboard F13 key
   * @zh 键盘上的 F13 键
   * @ja キーボードの F13 キー
   * @ko 키보드의 F13 키
   */
  F13 = 64,
  /**
   * Keyboard F14 key
   * @zh 键盘上的 F14 键
   * @ja キーボードの F14 キー
   * @ko 키보드의 F14 키
   */
  F14 = 65,
  /**
   * Keyboard F15 key
   * @zh 键盘上的 F15 键
   * @ja キーボードの F15 キー
   * @ko 키보드의 F15 키
   */
  F15 = 66,
  /**
   * Keyboard F16 key
   * @zh 键盘上的 F16 键
   * @ja キーボードの F16 キー
   * @ko 키보드의 F16 키
   */
  F16 = 67,
  /**
   * Keyboard F17 key
   * @zh 键盘上的 F17 键
   * @ja キーボードの F17 キー
   * @ko 키보드의 F17 키
   */
  F17 = 68,
  /**
   * Keyboard F18 key
   * @zh 键盘上的 F18 键
   * @ja キーボードの F18 キー
   * @ko 키보드의 F18 키
   */
  F18 = 69,
  /**
   * Keyboard F19 key
   * @zh 键盘上的 F19 键
   * @ja キーボードの F19 キー
   * @ko 키보드의 F19 키
   */
  F19 = 70,
  /**
   * Keyboard F20 key
   * @zh 键盘上的 F20 键
   * @ja キーボードの F20 キー
   * @ko 키보드의 F20 키
   */
  F20 = 71,
  /**
   * Keyboard F21 key
   * @zh 键盘上的 F21 键
   * @ja キーボードの F21 キー
   * @ko 키보드의 F21 키
   */
  F21 = 72,
  /**
   * Keyboard F22 key
   * @zh 键盘上的 F22 键
   * @ja キーボードの F22 キー
   * @ko 키보드의 F22 키
   */
  F22 = 73,
  /**
   * Keyboard F23 key
   * @zh 键盘上的 F23 键
   * @ja キーボードの F23 キー
   * @ko 키보드의 F23 키
   */
  F23 = 74,
  /**
   * Keyboard F24 key
   * @zh 键盘上的 F24 键
   * @ja キーボードの F24 キー
   * @ko 키보드의 F24 키
   */
  F24 = 75,
  /**
   * Keyboard Caps %Lock key
   * @zh 键盘上的 Caps Lock（大写锁定） 键
   * @ja キーボードの Caps Lock（大文字ロック） キー
   * @ko 키보드의 Caps Lock(대문자 잠금) 키
   */
  CapsLock = 76,
  /**
   * Keyboard Print Screen key
   * @zh 键盘上的 Print Screen（屏幕截图） 键
   * @ja キーボードの Print Screen（画面キャプチャ） キー
   * @ko 키보드의 Print Screen(화면 캡처) 키
   */
  PrintScreen = 77,
  /**
   * Keyboard Scroll %Lock key
   * @zh 键盘上的 Scroll Lock（滚动锁定） 键
   * @ja キーボードの Scroll Lock（スクロールロック） キー
   * @ko 키보드의 Scroll Lock(스크롤 잠금) 키
   */
  ScrollLock = 78,
  /**
   * Keyboard Pause key
   * @zh 键盘上的 Pause（暂停） 键
   * @ja キーボードの Pause（一時停止） キー
   * @ko 키보드의 Pause(일시 정지) 키
   */
  Pause = 79,
  /**
   * Keyboard Insert key
   * @zh 键盘上的 Insert（插入） 键
   * @ja キーボードの Insert（挿入） キー
   * @ko 키보드의 Insert(삽입) 키
   */
  Insert = 80,
  /**
   * Keyboard Home key
   * @zh 键盘上的 Home（开头） 键
   * @ja キーボードの Home（先頭） キー
   * @ko 키보드의 Home(처음) 키
   */
  Home = 81,
  /**
   * Keyboard Page Up key
   * @zh 键盘上的 Page Up（向上翻页） 键
   * @ja キーボードの Page Up（前のページ） キー
   * @ko 키보드의 Page Up(이전 페이지) 키
   */
  PageUp = 82,
  /**
   * Keyboard Delete Forward key
   * @zh 键盘上的 向后删除（Delete） 键
   * @ja キーボードの カーソル後方の削除（Delete） キー
   * @ko 키보드의 커서 뒤 문자 삭제(Delete) 키
   */
  Delete = 83,
  /**
   * Keyboard End key
   * @zh 键盘上的 End（末尾） 键
   * @ja キーボードの End（末尾） キー
   * @ko 키보드의 End(끝) 키
   */
  End = 84,
  /**
   * Keyboard Page Down key
   * @zh 键盘上的 Page Down（向下翻页） 键
   * @ja キーボードの Page Down（次のページ） キー
   * @ko 키보드의 Page Down(다음 페이지) 키
   */
  PageDown = 85,
  /**
   * Keyboard Right Arrow key
   * @zh 键盘上的 右方向 键
   * @ja キーボードの 右矢印 キー
   * @ko 키보드의 오른쪽 화살표 키
   */
  Right = 86,
  /**
   * Keyboard Left Arrow key
   * @zh 键盘上的 左方向 键
   * @ja キーボードの 左矢印 キー
   * @ko 키보드의 왼쪽 화살표 키
   */
  Left = 87,
  /**
   * Keyboard Down Arrow key
   * @zh 键盘上的 下方向 键
   * @ja キーボードの 下矢印 キー
   * @ko 키보드의 아래쪽 화살표 키
   */
  Down = 88,
  /**
   * Keyboard Up Arrow key
   * @zh 键盘上的 上方向 键
   * @ja キーボードの 上矢印 キー
   * @ko 키보드의 위쪽 화살표 키
   */
  Up = 89,
  /**
   * Keypad Num %Lock and Clear key
   * @zh 数字小键盘上的 Num Lock（数字锁定） 和 清除 键
   * @ja テンキーの Num Lock（数字ロック） と クリア のキー
   * @ko 숫자 키패드의 Num Lock(숫자 잠금) 및 지우기 키
   */
  NumLock = 90,
  /**
   * Keypad / key
   * @zh 数字小键盘上的 / 键
   * @ja テンキーの / キー
   * @ko 숫자 키패드의 / 키
   */
  NumpadDivide = 91,
  /**
   * Keypad * key
   * @zh 数字小键盘上的 * 键
   * @ja テンキーの * キー
   * @ko 숫자 키패드의 * 키
   */
  NumpadMultiply = 92,
  /**
   * Keypad - key
   * @zh 数字小键盘上的 - 键
   * @ja テンキーの - キー
   * @ko 숫자 키패드의 - 키
   */
  NumpadMinus = 93,
  /**
   * Keypad + key
   * @zh 数字小键盘上的 + 键
   * @ja テンキーの + キー
   * @ko 숫자 키패드의 + 키
   */
  NumpadPlus = 94,
  /**
   * keypad = key
   * @zh 数字小键盘上的 = 键
   * @ja テンキーの = キー
   * @ko 숫자 키패드의 = 키
   */
  NumpadEqual = 95,
  /**
   * Keypad Enter/Return key
   * @zh 数字小键盘上的 Enter/Return（回车） 键
   * @ja テンキーの Enter/Return キー
   * @ko 숫자 키패드의 Enter/Return 키
   */
  NumpadEnter = 96,
  /**
   * Keypad . and Delete key
   * @zh 数字小键盘上的 . 和 Delete（删除） 键
   * @ja テンキーの . と Delete（削除） のキー
   * @ko 숫자 키패드의 . 및 Delete(삭제) 키
   */
  NumpadDecimal = 97,
  /**
   * Keypad 1 and End key
   * @zh 数字小键盘上的 1 和 End（末尾） 键
   * @ja テンキーの 1 と End（末尾） のキー
   * @ko 숫자 키패드의 1 및 End(끝) 키
   */
  Numpad1 = 98,
  /**
   * Keypad 2 and Down Arrow key
   * @zh 数字小键盘上的 2 和 下方向 键
   * @ja テンキーの 2 と 下矢印 のキー
   * @ko 숫자 키패드의 2 및 아래쪽 화살표 키
   */
  Numpad2 = 99,
  /**
   * Keypad 3 and Page Down key
   * @zh 数字小键盘上的 3 和 Page Down（向下翻页） 键
   * @ja テンキーの 3 と Page Down（次のページ） のキー
   * @ko 숫자 키패드의 3 및 Page Down(다음 페이지) 키
   */
  Numpad3 = 100,
  /**
   * Keypad 4 and Left Arrow key
   * @zh 数字小键盘上的 4 和 左方向 键
   * @ja テンキーの 4 と 左矢印 のキー
   * @ko 숫자 키패드의 4 및 왼쪽 화살표 키
   */
  Numpad4 = 101,
  /**
   * Keypad 5 key
   * @zh 数字小键盘上的 5 键
   * @ja テンキーの 5 キー
   * @ko 숫자 키패드의 5 키
   */
  Numpad5 = 102,
  /**
   * Keypad 6 and Right Arrow key
   * @zh 数字小键盘上的 6 和 右方向 键
   * @ja テンキーの 6 と 右矢印 のキー
   * @ko 숫자 키패드의 6 및 오른쪽 화살표 키
   */
  Numpad6 = 103,
  /**
   * Keypad 7 and Home key
   * @zh 数字小键盘上的 7 和 Home（开头） 键
   * @ja テンキーの 7 と Home（先頭） のキー
   * @ko 숫자 키패드의 7 및 Home(처음) 키
   */
  Numpad7 = 104,
  /**
   * Keypad 8 and Up Arrow key
   * @zh 数字小键盘上的 8 和 上方向 键
   * @ja テンキーの 8 と 上矢印 のキー
   * @ko 숫자 키패드의 8 및 위쪽 화살표 키
   */
  Numpad8 = 105,
  /**
   * Keypad 9 and Page Up key
   * @zh 数字小键盘上的 9 和 Page Up（向上翻页） 键
   * @ja テンキーの 9 と Page Up（前のページ） のキー
   * @ko 숫자 키패드의 9 및 Page Up(이전 페이지) 키
   */
  Numpad9 = 106,
  /**
   * Keypad 0 and Insert key
   * @zh 数字小键盘上的 0 和 Insert（插入） 键
   * @ja テンキーの 0 と Insert（挿入） のキー
   * @ko 숫자 키패드의 0 및 Insert(삽입) 키
   */
  Numpad0 = 107,
  /**
   * Keyboard Non-US \ and | key
   * @zh 非美式键盘上的 \ 和 | 键
   * @ja 米国配列以外のキーボードの \ と | のキー
   * @ko 미국식이 아닌 키보드의 \ 및 | 키
   */
  NonUsBackslash = 108,
  /**
   * Keyboard Application key
   * @zh 键盘上的 应用程序 键
   * @ja キーボードの アプリケーション キー
   * @ko 키보드의 응용 프로그램 키
   */
  Application = 109,
  /**
   * Keyboard Execute key
   * @zh 键盘上的 执行 键
   * @ja キーボードの 実行 キー
   * @ko 키보드의 실행 키
   */
  Execute = 110,
  /**
   * Keyboard Mode Change key
   * @zh 键盘上的 模式切换 键
   * @ja キーボードの モード切り替え キー
   * @ko 키보드의 모드 전환 키
   */
  ModeChange = 111,
  /**
   * Keyboard Help key
   * @zh 键盘上的 帮助 键
   * @ja キーボードの ヘルプ キー
   * @ko 키보드의 도움말 키
   */
  Help = 112,
  /**
   * Keyboard Menu key
   * @zh 键盘上的 菜单 键
   * @ja キーボードの メニュー キー
   * @ko 키보드의 메뉴 키
   */
  Menu = 113,
  /**
   * Keyboard Select key
   * @zh 键盘上的 选择 键
   * @ja キーボードの 選択 キー
   * @ko 키보드의 선택 키
   */
  Select = 114,
  /**
   * Keyboard Redo key
   * @zh 键盘上的 重做 键
   * @ja キーボードの やり直し キー
   * @ko 키보드의 다시 실행 키
   */
  Redo = 115,
  /**
   * Keyboard Undo key
   * @zh 键盘上的 撤销 键
   * @ja キーボードの 元に戻す キー
   * @ko 키보드의 실행 취소 키
   */
  Undo = 116,
  /**
   * Keyboard Cut key
   * @zh 键盘上的 剪切 键
   * @ja キーボードの 切り取り キー
   * @ko 키보드의 잘라내기 키
   */
  Cut = 117,
  /**
   * Keyboard Copy key
   * @zh 键盘上的 复制 键
   * @ja キーボードの コピー キー
   * @ko 키보드의 복사 키
   */
  Copy = 118,
  /**
   * Keyboard Paste key
   * @zh 键盘上的 粘贴 键
   * @ja キーボードの 貼り付け キー
   * @ko 키보드의 붙여넣기 키
   */
  Paste = 119,
  /**
   * Keyboard Volume Mute key
   * @zh 键盘上的 静音 键
   * @ja キーボードの ミュート キー
   * @ko 키보드의 음소거 키
   */
  VolumeMute = 120,
  /**
   * Keyboard Volume Up key
   * @zh 键盘上的 增大音量 键
   * @ja キーボードの 音量を上げる キー
   * @ko 키보드의 볼륨 높이기 키
   */
  VolumeUp = 121,
  /**
   * Keyboard Volume Down key
   * @zh 键盘上的 减小音量 键
   * @ja キーボードの 音量を下げる キー
   * @ko 키보드의 볼륨 낮추기 키
   */
  VolumeDown = 122,
  /**
   * Keyboard Media Play Pause key
   * @zh 键盘上的 媒体播放/暂停 键
   * @ja キーボードの メディア再生/一時停止 キー
   * @ko 키보드의 미디어 재생/일시 정지 키
   */
  MediaPlayPause = 123,
  /**
   * Keyboard Media Stop key
   * @zh 键盘上的 媒体停止 键
   * @ja キーボードの メディア停止 キー
   * @ko 키보드의 미디어 정지 키
   */
  MediaStop = 124,
  /**
   * Keyboard Media Next Track key
   * @zh 键盘上的 媒体下一曲 键
   * @ja キーボードの メディアの次のトラック キー
   * @ko 키보드의 미디어 다음 트랙 키
   */
  MediaNextTrack = 125,
  /**
   * Keyboard Media Previous Track key
   * @zh 键盘上的 媒体上一曲 键
   * @ja キーボードの メディアの前のトラック キー
   * @ko 키보드의 미디어 이전 트랙 키
   */
  MediaPreviousTrack = 126,
  /**
   * Keyboard Left Control key
   * @zh 键盘上的 左侧 Control 键
   * @ja キーボードの 左 Control キー
   * @ko 키보드의 왼쪽 Control 키
   */
  LControl = 127,
  /**
   * Keyboard Left Shift key
   * @zh 键盘上的 左侧 Shift 键
   * @ja キーボードの 左 Shift キー
   * @ko 키보드의 왼쪽 Shift 키
   */
  LShift = 128,
  /**
   * Keyboard Left Alt key
   * @zh 键盘上的 左侧 Alt 键
   * @ja キーボードの 左 Alt キー
   * @ko 키보드의 왼쪽 Alt 키
   */
  LAlt = 129,
  /**
   * Keyboard Left System key
   * @zh 键盘上的 左侧 系统 键
   * @ja キーボードの 左 システム キー
   * @ko 키보드의 왼쪽 시스템 키
   */
  LSystem = 130,
  /**
   * Keyboard Right Control key
   * @zh 键盘上的 右侧 Control 键
   * @ja キーボードの 右 Control キー
   * @ko 키보드의 오른쪽 Control 키
   */
  RControl = 131,
  /**
   * Keyboard Right Shift key
   * @zh 键盘上的 右侧 Shift 键
   * @ja キーボードの 右 Shift キー
   * @ko 키보드의 오른쪽 Shift 키
   */
  RShift = 132,
  /**
   * Keyboard Right Alt key
   * @zh 键盘上的 右侧 Alt 键
   * @ja キーボードの 右 Alt キー
   * @ko 키보드의 오른쪽 Alt 키
   */
  RAlt = 133,
  /**
   * Keyboard Right System key
   * @zh 键盘上的 右侧 系统 键
   * @ja キーボードの 右 システム キー
   * @ko 키보드의 오른쪽 시스템 키
   */
  RSystem = 134,
  /**
   * Keyboard Back key
   * @zh 键盘上的 后退 键
   * @ja キーボードの 戻る キー
   * @ko 키보드의 뒤로 키
   */
  Back = 135,
  /**
   * Keyboard Forward key
   * @zh 键盘上的 前进 键
   * @ja キーボードの 進む キー
   * @ko 키보드의 앞으로 키
   */
  Forward = 136,
  /**
   * Keyboard Refresh key
   * @zh 键盘上的 刷新 键
   * @ja キーボードの 更新 キー
   * @ko 키보드의 새로 고침 키
   */
  Refresh = 137,
  /**
   * Keyboard Stop key
   * @zh 键盘上的 停止 键
   * @ja キーボードの 停止 キー
   * @ko 키보드의 중지 키
   */
  Stop = 138,
  /**
   * Keyboard Search key
   * @zh 键盘上的 搜索 键
   * @ja キーボードの 検索 キー
   * @ko 키보드의 검색 키
   */
  Search = 139,
  /**
   * Keyboard Favorites key
   * @zh 键盘上的 收藏夹 键
   * @ja キーボードの お気に入り キー
   * @ko 키보드의 즐겨찾기 키
   */
  Favorites = 140,
  /**
   * Keyboard Home Page key
   * @zh 键盘上的 主页 键
   * @ja キーボードの ホームページ キー
   * @ko 키보드의 홈 페이지 키
   */
  HomePage = 141,
  /**
   * Keyboard Launch Application 1 key
   * @zh 键盘上的 启动应用程序 1 键
   * @ja キーボードの アプリケーション 1 の起動 キー
   * @ko 키보드의 응용 프로그램 1 실행 키
   */
  LaunchApplication1 = 142,
  /**
   * Keyboard Launch Application 2 key
   * @zh 键盘上的 启动应用程序 2 键
   * @ja キーボードの アプリケーション 2 の起動 キー
   * @ko 키보드의 응용 프로그램 2 실행 키
   */
  LaunchApplication2 = 143,
  /**
   * Keyboard Launch Mail key
   * @zh 键盘上的 启动邮件程序 键
   * @ja キーボードの メールソフトの起動 キー
   * @ko 키보드의 메일 프로그램 실행 키
   */
  LaunchMail = 144,
  /**
   * Keyboard Launch Media Select key
   * @zh 键盘上的 启动媒体选择程序 键
   * @ja キーボードの メディア選択の起動 キー
   * @ko 키보드의 미디어 선택 프로그램 실행 키
   */
  LaunchMediaSelect = 145,
}

/**
 * Mouse buttons.
 * @zh 鼠标按钮。
 * @ja マウスボタン。
 * @ko 마우스 버튼.
 */
export enum MouseButton {
  /**
   * The left mouse button
   * @zh 鼠标左键
   * @ja マウスの左ボタン
   * @ko 마우스 왼쪽 버튼
   */
  Left = 0,
  /**
   * The right mouse button
   * @zh 鼠标右键
   * @ja マウスの右ボタン
   * @ko 마우스 오른쪽 버튼
   */
  Right = 1,
  /**
   * The middle (wheel) mouse button
   * @zh 鼠标中键（滚轮按钮）
   * @ja マウスの中央ボタン（ホイールボタン）
   * @ko 마우스 가운데 버튼(휠 버튼)
   */
  Middle = 2,
  /**
   * The first extra mouse button
   * @zh 第一个鼠标扩展按钮
   * @ja マウスの追加ボタン 1
   * @ko 첫 번째 마우스 추가 버튼
   */
  Extra1 = 3,
  /**
   * The second extra mouse button
   * @zh 第二个鼠标扩展按钮
   * @ja マウスの追加ボタン 2
   * @ko 두 번째 마우스 추가 버튼
   */
  Extra2 = 4,
}

/**
 * Mouse wheel orientations.
 * @zh 鼠标滚轮方向。
 * @ja マウスホイールの方向。
 * @ko 마우스 휠 방향.
 */
export enum MouseWheel {
  /**
   * The vertical mouse wheel
   * @zh 鼠标垂直滚轮
   * @ja マウスの垂直ホイール
   * @ko 마우스 수직 휠
   */
  Vertical = 0,
  /**
   * The horizontal mouse wheel
   * @zh 鼠标水平滚轮
   * @ja マウスの水平ホイール
   * @ko 마우스 수평 휠
   */
  Horizontal = 1,
}

/**
 * Joystick axes.
 * @zh 游戏手柄坐标轴。
 * @ja ジョイスティックの軸。
 * @ko 조이스틱 축.
 */
export enum JoystickAxis {
  /**
   * The X axis
   * @zh X 轴
   * @ja X 軸
   * @ko X 축
   */
  X = 0,
  /**
   * The Y axis
   * @zh Y 轴
   * @ja Y 軸
   * @ko Y 축
   */
  Y = 1,
  /**
   * The Z axis
   * @zh Z 轴
   * @ja Z 軸
   * @ko Z 축
   */
  Z = 2,
  /**
   * The R axis
   * @zh R 轴
   * @ja R 軸
   * @ko R 축
   */
  R = 3,
  /**
   * The U axis
   * @zh U 轴
   * @ja U 軸
   * @ko U 축
   */
  U = 4,
  /**
   * The V axis
   * @zh V 轴
   * @ja V 軸
   * @ko V 축
   */
  V = 5,
  /**
   * The X axis of the point-of-view hat
   * @zh 视角帽开关的 X 轴
   * @ja ハットスイッチの X 軸
   * @ko 시점 조절 햇 스위치의 X 축
   */
  PovX = 6,
  /**
   * The Y axis of the point-of-view hat
   * @zh 视角帽开关的 Y 轴
   * @ja ハットスイッチの Y 軸
   * @ko 시점 조절 햇 스위치의 Y 축
   */
  PovY = 7,
}

/**
 * Sensor types.
 * @zh 传感器类型。
 * @ja センサーの種類。
 * @ko 센서 유형.
 */
export enum SensorType {
  /**
   * Measures the raw acceleration (m/s^2)
   * @zh 测量原始加速度（m/s^2）
   * @ja 未加工の加速度を測定します（m/s^2）
   * @ko 원시 가속도를 측정함(m/s^2)
   */
  Accelerometer = 0,
  /**
   * Measures the raw rotation rates (radians/s)
   * @zh 测量原始角速度（弧度/秒）
   * @ja 未加工の角速度を測定します（ラジアン/秒）
   * @ko 원시 각속도를 측정함(라디안/초)
   */
  Gyroscope = 1,
  /**
   * Measures the ambient magnetic field (micro-teslas)
   * @zh 测量环境磁场（微特斯拉）
   * @ja 周囲の磁場を測定します（マイクロテスラ）
   * @ko 주변 자기장을 측정함(마이크로테슬라)
   */
  Magnetometer = 2,
  /**
   * Measures the direction and intensity of gravity, independent of device
   * acceleration (m/s^2)
   * @zh 测量重力的方向和强度，不受设备加速度影响（m/s^2）
   * @ja デバイスの加速度とは独立して、重力の方向と強さを測定します（m/s^2）
   * @ko 장치 가속도와 무관하게 중력의 방향과 크기를 측정함(m/s^2)
   */
  Gravity = 3,
  /**
   * Measures the direction and intensity of device acceleration, independent of
   * the gravity (m/s^2)
   * @zh 测量设备加速度的方向和强度，不受重力影响（m/s^2）
   * @ja 重力とは独立して、デバイスの加速度の方向と強さを測定します（m/s^2）
   * @ko 중력과 무관하게 장치 가속도의 방향과 크기를 측정함(m/s^2)
   */
  UserAcceleration = 4,
  /**
   * Measures the absolute 3D orientation (radians)
   * @zh 测量绝对三维朝向（弧度）
   * @ja 絶対的な 3 次元の姿勢を測定します（ラジアン）
   * @ko 절대 3차원 자세를 측정함(라디안)
   */
  Orientation = 5,
}

/**
 * The total number of keyboard keys, ignoring `Key::Unknown`
 * @zh 键盘按键总数，不含 `Key::Unknown`
 * @ja `Key::Unknown` を除くキーボードのキーの総数
 * @ko `Key::Unknown`을 제외한 키보드 키의 총수
 */
export const KeyboardKeyCount = 101;

/**
 * The total number of scancodes, ignoring `Scan::Unknown`
 * @zh 扫描码总数，不含 `Scan::Unknown`
 * @ja `Scan::Unknown` を除くスキャンコードの総数
 * @ko `Scan::Unknown`을 제외한 스캔 코드의 총수
 */
export const KeyboardScancodeCount = 146;

/**
 * The total number of mouse buttons
 * @zh 鼠标按钮总数
 * @ja マウスボタンの総数
 * @ko 마우스 버튼의 총수
 */
export const MouseButtonCount = 5;

/**
 * Maximum number of supported joysticks
 * @zh 支持的游戏手柄数量上限
 * @ja 対応するジョイスティックの最大数
 * @ko 지원되는 조이스틱의 최대 수
 */
export const JoystickCount = 8;

/**
 * Maximum number of supported buttons
 * @zh 支持的按钮数量上限
 * @ja 対応するボタンの最大数
 * @ko 지원되는 버튼의 최대 수
 */
export const JoystickButtonCount = 32;

/**
 * Maximum number of supported axes
 * @zh 支持的坐标轴数量上限
 * @ja 対応する軸の最大数
 * @ko 지원되는 축의 최대 수
 */
export const JoystickAxisCount = 8;

/**
 * The total number of sensor types
 * @zh 传感器类型总数
 * @ja センサーの種類の総数
 * @ko 센서 유형의 총수
 */
export const SensorCount = 6;
