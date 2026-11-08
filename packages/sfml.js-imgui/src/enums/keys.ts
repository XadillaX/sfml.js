/**
 * Named keyboard, gamepad and mouse inputs plus modifier bits for key chords.
 * Native/legacy key codes below NamedKey_BEGIN are not named keys.
 *
 * @zh 键盘、手柄、鼠标命名输入及组合键修饰位。
 * NamedKey_BEGIN 以下的原生或旧键码不属于命名键。
 * @ja キー、パッド、マウスの名前付き入力と組み合わせ用修飾ビット。
 * NamedKey_BEGIN 未満のネイティブ・旧キーコードは名前付きキーではない。
 * @ko 키보드, 게임패드, 마우스 명명 입력 및 키 조합용 보조 비트.
 * NamedKey_BEGIN 미만의 네이티브 및 구형 키 코드는 명명 키가 아님.
 */
export const ImGuiKey = Object.freeze({
  /**
   * No key.
   *
   * @zh 无按键。
   * @ja キーなし。
   * @ko 키 없음.
   */
  None: 0,
  /**
   * Internal inclusive start of named keys; shares Tab's value.
   *
   * @zh 命名键的内部起始边界（含），与 Tab 同值。
   * @ja 名前付きキーの内部開始境界（含む）。Tab と同値。
   * @ko 명명 키의 내부 시작 경계(포함). Tab과 같은 값.
   */
  NamedKey_BEGIN: 512,
  /**
   * Tab key.
   *
   * @zh Tab 制表键。
   * @ja Tab キー。
   * @ko Tab 키.
   */
  Tab: 512,
  /**
   * Left arrow.
   *
   * @zh 左方向键。
   * @ja 左矢印キー。
   * @ko 왼쪽 방향키.
   */
  LeftArrow: 513,
  /**
   * Right arrow.
   *
   * @zh 右方向键。
   * @ja 右矢印キー。
   * @ko 오른쪽 방향키.
   */
  RightArrow: 514,
  /**
   * Up arrow.
   *
   * @zh 上方向键。
   * @ja 上矢印キー。
   * @ko 위쪽 방향키.
   */
  UpArrow: 515,
  /**
   * Down arrow.
   *
   * @zh 下方向键。
   * @ja 下矢印キー。
   * @ko 아래쪽 방향키.
   */
  DownArrow: 516,
  /**
   * Page Up key.
   *
   * @zh 向上翻页键。
   * @ja Page Up キー。
   * @ko Page Up 키.
   */
  PageUp: 517,
  /**
   * Page Down key.
   *
   * @zh 向下翻页键。
   * @ja Page Down キー。
   * @ko Page Down 키.
   */
  PageDown: 518,
  /**
   * Home key.
   *
   * @zh Home 起始键。
   * @ja Home キー。
   * @ko Home 키.
   */
  Home: 519,
  /**
   * End key.
   *
   * @zh End 末尾键。
   * @ja End キー。
   * @ko End 키.
   */
  End: 520,
  /**
   * Insert key.
   *
   * @zh Insert 插入键。
   * @ja Insert キー。
   * @ko Insert 키.
   */
  Insert: 521,
  /**
   * Delete key.
   *
   * @zh Delete 删除键。
   * @ja Delete キー。
   * @ko Delete 키.
   */
  Delete: 522,
  /**
   * Backspace key.
   *
   * @zh 退格键。
   * @ja Backspace キー。
   * @ko Backspace 키.
   */
  Backspace: 523,
  /**
   * Space bar.
   *
   * @zh 空格键。
   * @ja スペースキー。
   * @ko 스페이스 키.
   */
  Space: 524,
  /**
   * Enter/Return key.
   *
   * @zh 回车键。
   * @ja Enter/Return キー。
   * @ko Enter/Return 키.
   */
  Enter: 525,
  /**
   * Escape key.
   *
   * @zh Escape 退出键。
   * @ja Escape キー。
   * @ko Escape 키.
   */
  Escape: 526,
  /**
   * Left Control key.
   *
   * @zh 左 Control 键。
   * @ja 左 Control キー。
   * @ko 왼쪽 Control 키.
   */
  LeftCtrl: 527,
  /**
   * Left Shift key.
   *
   * @zh 左 Shift 键。
   * @ja 左 Shift キー。
   * @ko 왼쪽 Shift 키.
   */
  LeftShift: 528,
  /**
   * Left Alt/Option key.
   *
   * @zh 左 Alt/Option 键。
   * @ja 左 Alt/Option キー。
   * @ko 왼쪽 Alt/Option 키.
   */
  LeftAlt: 529,
  /**
   * Left Windows/Command/Super key.
   *
   * @zh 左 Windows/Command/Super 键。
   * @ja 左 Windows/Command/Super キー。
   * @ko 왼쪽 Windows/Command/Super 키.
   */
  LeftSuper: 530,
  /**
   * Right Control key.
   *
   * @zh 右 Control 键。
   * @ja 右 Control キー。
   * @ko 오른쪽 Control 키.
   */
  RightCtrl: 531,
  /**
   * Right Shift key.
   *
   * @zh 右 Shift 键。
   * @ja 右 Shift キー。
   * @ko 오른쪽 Shift 키.
   */
  RightShift: 532,
  /**
   * Right Alt/Option key.
   *
   * @zh 右 Alt/Option 键。
   * @ja 右 Alt/Option キー。
   * @ko 오른쪽 Alt/Option 키.
   */
  RightAlt: 533,
  /**
   * Right Windows/Command/Super key.
   *
   * @zh 右 Windows/Command/Super 键。
   * @ja 右 Windows/Command/Super キー。
   * @ko 오른쪽 Windows/Command/Super 키.
   */
  RightSuper: 534,
  /**
   * Context-menu key.
   *
   * @zh 上下文菜单键。
   * @ja コンテキストメニューキー。
   * @ko 컨텍스트 메뉴 키.
   */
  Menu: 535,
  /**
   * Main keyboard digit 0.
   *
   * @zh 主键盘数字 0。
   * @ja 主キーボードの数字 0。
   * @ko 주 키보드 숫자 0.
   */
  0: 536,
  /**
   * Main keyboard digit 1.
   *
   * @zh 主键盘数字 1。
   * @ja 主キーボードの数字 1。
   * @ko 주 키보드 숫자 1.
   */
  1: 537,
  /**
   * Main keyboard digit 2.
   *
   * @zh 主键盘数字 2。
   * @ja 主キーボードの数字 2。
   * @ko 주 키보드 숫자 2.
   */
  2: 538,
  /**
   * Main keyboard digit 3.
   *
   * @zh 主键盘数字 3。
   * @ja 主キーボードの数字 3。
   * @ko 주 키보드 숫자 3.
   */
  3: 539,
  /**
   * Main keyboard digit 4.
   *
   * @zh 主键盘数字 4。
   * @ja 主キーボードの数字 4。
   * @ko 주 키보드 숫자 4.
   */
  4: 540,
  /**
   * Main keyboard digit 5.
   *
   * @zh 主键盘数字 5。
   * @ja 主キーボードの数字 5。
   * @ko 주 키보드 숫자 5.
   */
  5: 541,
  /**
   * Main keyboard digit 6.
   *
   * @zh 主键盘数字 6。
   * @ja 主キーボードの数字 6。
   * @ko 주 키보드 숫자 6.
   */
  6: 542,
  /**
   * Main keyboard digit 7.
   *
   * @zh 主键盘数字 7。
   * @ja 主キーボードの数字 7。
   * @ko 주 키보드 숫자 7.
   */
  7: 543,
  /**
   * Main keyboard digit 8.
   *
   * @zh 主键盘数字 8。
   * @ja 主キーボードの数字 8。
   * @ko 주 키보드 숫자 8.
   */
  8: 544,
  /**
   * Main keyboard digit 9.
   *
   * @zh 主键盘数字 9。
   * @ja 主キーボードの数字 9。
   * @ko 주 키보드 숫자 9.
   */
  9: 545,
  /**
   * A key.
   *
   * @zh A 键。
   * @ja A キー。
   * @ko A 키.
   */
  A: 546,
  /**
   * B key.
   *
   * @zh B 键。
   * @ja B キー。
   * @ko B 키.
   */
  B: 547,
  /**
   * C key.
   *
   * @zh C 键。
   * @ja C キー。
   * @ko C 키.
   */
  C: 548,
  /**
   * D key.
   *
   * @zh D 键。
   * @ja D キー。
   * @ko D 키.
   */
  D: 549,
  /**
   * E key.
   *
   * @zh E 键。
   * @ja E キー。
   * @ko E 키.
   */
  E: 550,
  /**
   * F key.
   *
   * @zh F 键。
   * @ja F キー。
   * @ko F 키.
   */
  F: 551,
  /**
   * G key.
   *
   * @zh G 键。
   * @ja G キー。
   * @ko G 키.
   */
  G: 552,
  /**
   * H key.
   *
   * @zh H 键。
   * @ja H キー。
   * @ko H 키.
   */
  H: 553,
  /**
   * I key.
   *
   * @zh I 键。
   * @ja I キー。
   * @ko I 키.
   */
  I: 554,
  /**
   * J key.
   *
   * @zh J 键。
   * @ja J キー。
   * @ko J 키.
   */
  J: 555,
  /**
   * K key.
   *
   * @zh K 键。
   * @ja K キー。
   * @ko K 키.
   */
  K: 556,
  /**
   * L key.
   *
   * @zh L 键。
   * @ja L キー。
   * @ko L 키.
   */
  L: 557,
  /**
   * M key.
   *
   * @zh M 键。
   * @ja M キー。
   * @ko M 키.
   */
  M: 558,
  /**
   * N key.
   *
   * @zh N 键。
   * @ja N キー。
   * @ko N 키.
   */
  N: 559,
  /**
   * O key.
   *
   * @zh O 键。
   * @ja O キー。
   * @ko O 키.
   */
  O: 560,
  /**
   * P key.
   *
   * @zh P 键。
   * @ja P キー。
   * @ko P 키.
   */
  P: 561,
  /**
   * Q key.
   *
   * @zh Q 键。
   * @ja Q キー。
   * @ko Q 키.
   */
  Q: 562,
  /**
   * R key.
   *
   * @zh R 键。
   * @ja R キー。
   * @ko R 키.
   */
  R: 563,
  /**
   * S key.
   *
   * @zh S 键。
   * @ja S キー。
   * @ko S 키.
   */
  S: 564,
  /**
   * T key.
   *
   * @zh T 键。
   * @ja T キー。
   * @ko T 키.
   */
  T: 565,
  /**
   * U key.
   *
   * @zh U 键。
   * @ja U キー。
   * @ko U 키.
   */
  U: 566,
  /**
   * V key.
   *
   * @zh V 键。
   * @ja V キー。
   * @ko V 키.
   */
  V: 567,
  /**
   * W key.
   *
   * @zh W 键。
   * @ja W キー。
   * @ko W 키.
   */
  W: 568,
  /**
   * X key.
   *
   * @zh X 键。
   * @ja X キー。
   * @ko X 키.
   */
  X: 569,
  /**
   * Y key.
   *
   * @zh Y 键。
   * @ja Y キー。
   * @ko Y 키.
   */
  Y: 570,
  /**
   * Z key.
   *
   * @zh Z 键。
   * @ja Z キー。
   * @ko Z 키.
   */
  Z: 571,
  /**
   * F1 function key.
   *
   * @zh F1 功能键。
   * @ja F1 ファンクションキー。
   * @ko F1 기능 키.
   */
  F1: 572,
  /**
   * F2 function key.
   *
   * @zh F2 功能键。
   * @ja F2 ファンクションキー。
   * @ko F2 기능 키.
   */
  F2: 573,
  /**
   * F3 function key.
   *
   * @zh F3 功能键。
   * @ja F3 ファンクションキー。
   * @ko F3 기능 키.
   */
  F3: 574,
  /**
   * F4 function key.
   *
   * @zh F4 功能键。
   * @ja F4 ファンクションキー。
   * @ko F4 기능 키.
   */
  F4: 575,
  /**
   * F5 function key.
   *
   * @zh F5 功能键。
   * @ja F5 ファンクションキー。
   * @ko F5 기능 키.
   */
  F5: 576,
  /**
   * F6 function key.
   *
   * @zh F6 功能键。
   * @ja F6 ファンクションキー。
   * @ko F6 기능 키.
   */
  F6: 577,
  /**
   * F7 function key.
   *
   * @zh F7 功能键。
   * @ja F7 ファンクションキー。
   * @ko F7 기능 키.
   */
  F7: 578,
  /**
   * F8 function key.
   *
   * @zh F8 功能键。
   * @ja F8 ファンクションキー。
   * @ko F8 기능 키.
   */
  F8: 579,
  /**
   * F9 function key.
   *
   * @zh F9 功能键。
   * @ja F9 ファンクションキー。
   * @ko F9 기능 키.
   */
  F9: 580,
  /**
   * F10 function key.
   *
   * @zh F10 功能键。
   * @ja F10 ファンクションキー。
   * @ko F10 기능 키.
   */
  F10: 581,
  /**
   * F11 function key.
   *
   * @zh F11 功能键。
   * @ja F11 ファンクションキー。
   * @ko F11 기능 키.
   */
  F11: 582,
  /**
   * F12 function key.
   *
   * @zh F12 功能键。
   * @ja F12 ファンクションキー。
   * @ko F12 기능 키.
   */
  F12: 583,
  /**
   * F13 function key.
   *
   * @zh F13 功能键。
   * @ja F13 ファンクションキー。
   * @ko F13 기능 키.
   */
  F13: 584,
  /**
   * F14 function key.
   *
   * @zh F14 功能键。
   * @ja F14 ファンクションキー。
   * @ko F14 기능 키.
   */
  F14: 585,
  /**
   * F15 function key.
   *
   * @zh F15 功能键。
   * @ja F15 ファンクションキー。
   * @ko F15 기능 키.
   */
  F15: 586,
  /**
   * F16 function key.
   *
   * @zh F16 功能键。
   * @ja F16 ファンクションキー。
   * @ko F16 기능 키.
   */
  F16: 587,
  /**
   * F17 function key.
   *
   * @zh F17 功能键。
   * @ja F17 ファンクションキー。
   * @ko F17 기능 키.
   */
  F17: 588,
  /**
   * F18 function key.
   *
   * @zh F18 功能键。
   * @ja F18 ファンクションキー。
   * @ko F18 기능 키.
   */
  F18: 589,
  /**
   * F19 function key.
   *
   * @zh F19 功能键。
   * @ja F19 ファンクションキー。
   * @ko F19 기능 키.
   */
  F19: 590,
  /**
   * F20 function key.
   *
   * @zh F20 功能键。
   * @ja F20 ファンクションキー。
   * @ko F20 기능 키.
   */
  F20: 591,
  /**
   * F21 function key.
   *
   * @zh F21 功能键。
   * @ja F21 ファンクションキー。
   * @ko F21 기능 키.
   */
  F21: 592,
  /**
   * F22 function key.
   *
   * @zh F22 功能键。
   * @ja F22 ファンクションキー。
   * @ko F22 기능 키.
   */
  F22: 593,
  /**
   * F23 function key.
   *
   * @zh F23 功能键。
   * @ja F23 ファンクションキー。
   * @ko F23 기능 키.
   */
  F23: 594,
  /**
   * F24 function key.
   *
   * @zh F24 功能键。
   * @ja F24 ファンクションキー。
   * @ko F24 기능 키.
   */
  F24: 595,
  /**
   * Apostrophe key.
   *
   * @zh 单引号键。
   * @ja アポストロフィーキー。
   * @ko 작은따옴표 키.
   */
  Apostrophe: 596,
  /**
   * Comma key.
   *
   * @zh 逗号键。
   * @ja コンマキー。
   * @ko 쉼표 키.
   */
  Comma: 597,
  /**
   * Minus key.
   *
   * @zh 减号键。
   * @ja マイナスキー。
   * @ko 빼기 키.
   */
  Minus: 598,
  /**
   * Period key.
   *
   * @zh 句点键。
   * @ja ピリオドキー。
   * @ko 마침표 키.
   */
  Period: 599,
  /**
   * Forward slash key.
   *
   * @zh 正斜杠键。
   * @ja スラッシュキー。
   * @ko 슬래시 키.
   */
  Slash: 600,
  /**
   * Semicolon key.
   *
   * @zh 分号键。
   * @ja セミコロンキー。
   * @ko 세미콜론 키.
   */
  Semicolon: 601,
  /**
   * Equals key.
   *
   * @zh 等号键。
   * @ja 等号キー。
   * @ko 등호 키.
   */
  Equal: 602,
  /**
   * Left square bracket key.
   *
   * @zh 左方括号键。
   * @ja 左角括弧キー。
   * @ko 왼쪽 대괄호 키.
   */
  LeftBracket: 603,
  /**
   * Backslash key.
   *
   * @zh 反斜杠键。
   * @ja バックスラッシュキー。
   * @ko 백슬래시 키.
   */
  Backslash: 604,
  /**
   * Right square bracket key.
   *
   * @zh 右方括号键。
   * @ja 右角括弧キー。
   * @ko 오른쪽 대괄호 키.
   */
  RightBracket: 605,
  /**
   * Grave accent/backtick key.
   *
   * @zh 重音符或反引号键。
   * @ja グレイヴアクセント・バッククォートキー。
   * @ko 억음 부호 또는 백틱 키.
   */
  GraveAccent: 606,
  /**
   * Caps Lock key.
   *
   * @zh 大写锁定键。
   * @ja Caps Lock キー。
   * @ko Caps Lock 키.
   */
  CapsLock: 607,
  /**
   * Scroll Lock key.
   *
   * @zh 滚动锁定键。
   * @ja Scroll Lock キー。
   * @ko Scroll Lock 키.
   */
  ScrollLock: 608,
  /**
   * Num Lock key.
   *
   * @zh 数字锁定键。
   * @ja Num Lock キー。
   * @ko Num Lock 키.
   */
  NumLock: 609,
  /**
   * Print Screen key.
   *
   * @zh 屏幕截图键。
   * @ja Print Screen キー。
   * @ko Print Screen 키.
   */
  PrintScreen: 610,
  /**
   * Pause key.
   *
   * @zh Pause 暂停键。
   * @ja Pause キー。
   * @ko Pause 키.
   */
  Pause: 611,
  /**
   * Numeric keypad 0.
   *
   * @zh 数字小键盘 0。
   * @ja テンキーの 0。
   * @ko 숫자 키패드 0.
   */
  Keypad0: 612,
  /**
   * Numeric keypad 1.
   *
   * @zh 数字小键盘 1。
   * @ja テンキーの 1。
   * @ko 숫자 키패드 1.
   */
  Keypad1: 613,
  /**
   * Numeric keypad 2.
   *
   * @zh 数字小键盘 2。
   * @ja テンキーの 2。
   * @ko 숫자 키패드 2.
   */
  Keypad2: 614,
  /**
   * Numeric keypad 3.
   *
   * @zh 数字小键盘 3。
   * @ja テンキーの 3。
   * @ko 숫자 키패드 3.
   */
  Keypad3: 615,
  /**
   * Numeric keypad 4.
   *
   * @zh 数字小键盘 4。
   * @ja テンキーの 4。
   * @ko 숫자 키패드 4.
   */
  Keypad4: 616,
  /**
   * Numeric keypad 5.
   *
   * @zh 数字小键盘 5。
   * @ja テンキーの 5。
   * @ko 숫자 키패드 5.
   */
  Keypad5: 617,
  /**
   * Numeric keypad 6.
   *
   * @zh 数字小键盘 6。
   * @ja テンキーの 6。
   * @ko 숫자 키패드 6.
   */
  Keypad6: 618,
  /**
   * Numeric keypad 7.
   *
   * @zh 数字小键盘 7。
   * @ja テンキーの 7。
   * @ko 숫자 키패드 7.
   */
  Keypad7: 619,
  /**
   * Numeric keypad 8.
   *
   * @zh 数字小键盘 8。
   * @ja テンキーの 8。
   * @ko 숫자 키패드 8.
   */
  Keypad8: 620,
  /**
   * Numeric keypad 9.
   *
   * @zh 数字小键盘 9。
   * @ja テンキーの 9。
   * @ko 숫자 키패드 9.
   */
  Keypad9: 621,
  /**
   * Keypad decimal separator.
   *
   * @zh 小键盘小数点。
   * @ja テンキーの小数点。
   * @ko 키패드 소수점.
   */
  KeypadDecimal: 622,
  /**
   * Keypad division key.
   *
   * @zh 小键盘除号。
   * @ja テンキーの除算。
   * @ko 키패드 나누기.
   */
  KeypadDivide: 623,
  /**
   * Keypad multiplication key.
   *
   * @zh 小键盘乘号。
   * @ja テンキーの乗算。
   * @ko 키패드 곱하기.
   */
  KeypadMultiply: 624,
  /**
   * Keypad subtraction key.
   *
   * @zh 小键盘减号。
   * @ja テンキーの減算。
   * @ko 키패드 빼기.
   */
  KeypadSubtract: 625,
  /**
   * Keypad addition key.
   *
   * @zh 小键盘加号。
   * @ja テンキーの加算。
   * @ko 키패드 더하기.
   */
  KeypadAdd: 626,
  /**
   * Keypad Enter key.
   *
   * @zh 小键盘回车。
   * @ja テンキーの Enter。
   * @ko 키패드 Enter.
   */
  KeypadEnter: 627,
  /**
   * Keypad equals key.
   *
   * @zh 小键盘等号。
   * @ja テンキーの等号。
   * @ko 키패드 등호.
   */
  KeypadEqual: 628,
  /**
   * Application/browser Back key.
   *
   * @zh 应用或浏览器后退键。
   * @ja アプリ・ブラウザーの戻るキー。
   * @ko 앱 또는 브라우저 뒤로 키.
   */
  AppBack: 629,
  /**
   * Application/browser Forward key.
   *
   * @zh 应用或浏览器前进键。
   * @ja アプリ・ブラウザーの進むキー。
   * @ko 앱 또는 브라우저 앞으로 키.
   */
  AppForward: 630,
  /**
   * Extra ISO keyboard key between left Shift and Z.
   *
   * @zh ISO 键盘左 Shift 与 Z 之间的附加键。
   * @ja ISO 配列で左 Shift と Z の間にある追加キー。
   * @ko ISO 키보드의 왼쪽 Shift와 Z 사이 추가 키.
   */
  Oem102: 631,
  /**
   * Gamepad Start/Menu button.
   *
   * @zh 手柄 Start/Menu 按钮。
   * @ja パッドの Start/Menu ボタン。
   * @ko 게임패드 Start/Menu 버튼.
   */
  GamepadStart: 632,
  /**
   * Gamepad Back/View button.
   *
   * @zh 手柄 Back/View 按钮。
   * @ja パッドの Back/View ボタン。
   * @ko 게임패드 Back/View 버튼.
   */
  GamepadBack: 633,
  /**
   * Left face button (Xbox X, PlayStation Square).
   *
   * @zh 左面板按钮（Xbox X、PlayStation 方块）。
   * @ja 左のフェイスボタン（Xbox X、PlayStation 四角）。
   * @ko 왼쪽 전면 버튼(Xbox X, PlayStation 네모).
   */
  GamepadFaceLeft: 634,
  /**
   * Right face button (Xbox B, PlayStation Circle).
   *
   * @zh 右面板按钮（Xbox B、PlayStation 圆圈）。
   * @ja 右のフェイスボタン（Xbox B、PlayStation 丸）。
   * @ko 오른쪽 전면 버튼(Xbox B, PlayStation 동그라미).
   */
  GamepadFaceRight: 635,
  /**
   * Top face button (Xbox Y, PlayStation Triangle).
   *
   * @zh 上面板按钮（Xbox Y、PlayStation 三角）。
   * @ja 上のフェイスボタン（Xbox Y、PlayStation 三角）。
   * @ko 위쪽 전면 버튼(Xbox Y, PlayStation 세모).
   */
  GamepadFaceUp: 636,
  /**
   * Bottom face button (Xbox A, PlayStation Cross).
   *
   * @zh 下面板按钮（Xbox A、PlayStation 叉号）。
   * @ja 下のフェイスボタン（Xbox A、PlayStation バツ）。
   * @ko 아래쪽 전면 버튼(Xbox A, PlayStation 가위표).
   */
  GamepadFaceDown: 637,
  /**
   * Gamepad D-pad left.
   *
   * @zh 手柄十字键左。
   * @ja パッド十字キーの左。
   * @ko 게임패드 십자키 왼쪽.
   */
  GamepadDpadLeft: 638,
  /**
   * Gamepad D-pad right.
   *
   * @zh 手柄十字键右。
   * @ja パッド十字キーの右。
   * @ko 게임패드 십자키 오른쪽.
   */
  GamepadDpadRight: 639,
  /**
   * Gamepad D-pad up.
   *
   * @zh 手柄十字键上。
   * @ja パッド十字キーの上。
   * @ko 게임패드 십자키 위쪽.
   */
  GamepadDpadUp: 640,
  /**
   * Gamepad D-pad down.
   *
   * @zh 手柄十字键下。
   * @ja パッド十字キーの下。
   * @ko 게임패드 십자키 아래쪽.
   */
  GamepadDpadDown: 641,
  /**
   * Left shoulder button (L1/LB).
   *
   * @zh 左肩键（L1/LB）。
   * @ja 左ショルダーボタン（L1/LB）。
   * @ko 왼쪽 숄더 버튼(L1/LB).
   */
  GamepadL1: 642,
  /**
   * Right shoulder button (R1/RB).
   *
   * @zh 右肩键（R1/RB）。
   * @ja 右ショルダーボタン（R1/RB）。
   * @ko 오른쪽 숄더 버튼(R1/RB).
   */
  GamepadR1: 643,
  /**
   * Left analog trigger (L2/LT).
   *
   * @zh 左模拟扳机（L2/LT）。
   * @ja 左アナログトリガー（L2/LT）。
   * @ko 왼쪽 아날로그 트리거(L2/LT).
   */
  GamepadL2: 644,
  /**
   * Right analog trigger (R2/RT).
   *
   * @zh 右模拟扳机（R2/RT）。
   * @ja 右アナログトリガー（R2/RT）。
   * @ko 오른쪽 아날로그 트리거(R2/RT).
   */
  GamepadR2: 645,
  /**
   * Left stick press (L3).
   *
   * @zh 左摇杆按下（L3）。
   * @ja 左スティック押し込み（L3）。
   * @ko 왼쪽 스틱 누르기(L3).
   */
  GamepadL3: 646,
  /**
   * Right stick press (R3).
   *
   * @zh 右摇杆按下（R3）。
   * @ja 右スティック押し込み（R3）。
   * @ko 오른쪽 스틱 누르기(R3).
   */
  GamepadR3: 647,
  /**
   * Left stick analog motion to the left.
   *
   * @zh 左摇杆向左的模拟输入。
   * @ja 左スティックの左向きアナログ入力。
   * @ko 왼쪽 스틱의 왼쪽 아날로그 입력.
   */
  GamepadLStickLeft: 648,
  /**
   * Left stick analog motion to the right.
   *
   * @zh 左摇杆向右的模拟输入。
   * @ja 左スティックの右向きアナログ入力。
   * @ko 왼쪽 스틱의 오른쪽 아날로그 입력.
   */
  GamepadLStickRight: 649,
  /**
   * Left stick analog motion upward.
   *
   * @zh 左摇杆向上的模拟输入。
   * @ja 左スティックの上向きアナログ入力。
   * @ko 왼쪽 스틱의 위쪽 아날로그 입력.
   */
  GamepadLStickUp: 650,
  /**
   * Left stick analog motion downward.
   *
   * @zh 左摇杆向下的模拟输入。
   * @ja 左スティックの下向きアナログ入力。
   * @ko 왼쪽 스틱의 아래쪽 아날로그 입력.
   */
  GamepadLStickDown: 651,
  /**
   * Right stick analog motion to the left.
   *
   * @zh 右摇杆向左的模拟输入。
   * @ja 右スティックの左向きアナログ入力。
   * @ko 오른쪽 스틱의 왼쪽 아날로그 입력.
   */
  GamepadRStickLeft: 652,
  /**
   * Right stick analog motion to the right.
   *
   * @zh 右摇杆向右的模拟输入。
   * @ja 右スティックの右向きアナログ入力。
   * @ko 오른쪽 스틱의 오른쪽 아날로그 입력.
   */
  GamepadRStickRight: 653,
  /**
   * Right stick analog motion upward.
   *
   * @zh 右摇杆向上的模拟输入。
   * @ja 右スティックの上向きアナログ入力。
   * @ko 오른쪽 스틱의 위쪽 아날로그 입력.
   */
  GamepadRStickUp: 654,
  /**
   * Right stick analog motion downward.
   *
   * @zh 右摇杆向下的模拟输入。
   * @ja 右スティックの下向きアナログ入力。
   * @ko 오른쪽 스틱의 아래쪽 아날로그 입력.
   */
  GamepadRStickDown: 655,
  /**
   * Left mouse button as a named key.
   *
   * @zh 作为命名键的鼠标左键。
   * @ja 名前付きキーとしてのマウス左ボタン。
   * @ko 명명 키로서의 마우스 왼쪽 버튼.
   */
  MouseLeft: 656,
  /**
   * Right mouse button as a named key.
   *
   * @zh 作为命名键的鼠标右键。
   * @ja 名前付きキーとしてのマウス右ボタン。
   * @ko 명명 키로서의 마우스 오른쪽 버튼.
   */
  MouseRight: 657,
  /**
   * Middle mouse button as a named key.
   *
   * @zh 作为命名键的鼠标中键。
   * @ja 名前付きキーとしてのマウス中ボタン。
   * @ko 명명 키로서의 마우스 가운데 버튼.
   */
  MouseMiddle: 658,
  /**
   * First extra mouse button.
   *
   * @zh 第一个鼠标扩展按钮。
   * @ja マウスの第一追加ボタン。
   * @ko 첫 번째 추가 마우스 버튼.
   */
  MouseX1: 659,
  /**
   * Second extra mouse button.
   *
   * @zh 第二个鼠标扩展按钮。
   * @ja マウスの第二追加ボタン。
   * @ko 두 번째 추가 마우스 버튼.
   */
  MouseX2: 660,
  /**
   * Horizontal mouse wheel axis.
   *
   * @zh 鼠标水平滚轮轴。
   * @ja マウスホイールの横軸。
   * @ko 마우스 휠 가로축.
   */
  MouseWheelX: 661,
  /**
   * Vertical mouse wheel axis.
   *
   * @zh 鼠标垂直滚轮轴。
   * @ja マウスホイールの縦軸。
   * @ko 마우스 휠 세로축.
   */
  MouseWheelY: 662,
  /**
   * Internal key-state slot for the Control modifier.
   *
   * @zh Control 修饰键的内部键状态槽位。
   * @ja Control 修飾キー用の内部状態枠。
   * @ko Control 보조 키용 내부 상태 슬롯.
   */
  ReservedForModCtrl: 663,
  /**
   * Internal key-state slot for the Shift modifier.
   *
   * @zh Shift 修饰键的内部键状态槽位。
   * @ja Shift 修飾キー用の内部状態枠。
   * @ko Shift 보조 키용 내부 상태 슬롯.
   */
  ReservedForModShift: 664,
  /**
   * Internal key-state slot for the Alt modifier.
   *
   * @zh Alt 修饰键的内部键状态槽位。
   * @ja Alt 修飾キー用の内部状態枠。
   * @ko Alt 보조 키용 내부 상태 슬롯.
   */
  ReservedForModAlt: 665,
  /**
   * Internal key-state slot for the Super modifier.
   *
   * @zh Super 修饰键的内部键状态槽位。
   * @ja Super 修飾キー用の内部状態枠。
   * @ko Super 보조 키용 내부 상태 슬롯.
   */
  ReservedForModSuper: 666,
  /**
   * Internal exclusive end of named keys; not a key.
   *
   * @zh 命名键的内部结束边界（不含），不是按键。
   * @ja 名前付きキーの内部終了境界（含まない）。キーではない。
   * @ko 명명 키의 내부 끝 경계(제외). 키가 아님.
   */
  NamedKey_END: 667,
  /**
   * No key-chord modifiers.
   *
   * @zh 无组合键修饰键。
   * @ja キーの組み合わせに修飾なし。
   * @ko 키 조합 보조 키 없음.
   */
  ImGuiMod_None: 0,
  /**
   * Control chord modifier; maps to Command with macOS behaviors enabled.
   *
   * @zh Control 组合键修饰位；启用 macOS 行为时映射为 Command。
   * @ja Control 修飾ビット。macOS 動作有効時は Command に対応。
   * @ko Control 조합 보조 비트. macOS 동작 활성화 시 Command에 대응.
   */
  ImGuiMod_Ctrl: 4096,
  /**
   * Shift chord modifier, either side.
   *
   * @zh Shift 组合键修饰位，不区分左右。
   * @ja 左右共通の Shift 修飾ビット。
   * @ko 좌우 공통 Shift 조합 보조 비트.
   */
  ImGuiMod_Shift: 8192,
  /**
   * Alt/Option chord modifier, either side.
   *
   * @zh Alt/Option 组合键修饰位，不区分左右。
   * @ja 左右共通の Alt/Option 修飾ビット。
   * @ko 좌우 공통 Alt/Option 조합 보조 비트.
   */
  ImGuiMod_Alt: 16384,
  /**
   * Super chord modifier; maps to Control with macOS behaviors enabled.
   *
   * @zh Super 组合键修饰位；启用 macOS 行为时映射为 Control。
   * @ja Super 修飾ビット。macOS 動作有効時は Control に対応。
   * @ko Super 조합 보조 비트. macOS 동작 활성화 시 Control에 대응.
   */
  ImGuiMod_Super: 32768,
  /**
   * Internal mask extracting all key-chord modifier bits.
   *
   * @zh 提取全部组合键修饰位的内部掩码。
   * @ja キー組み合わせの全修飾ビットを取り出す内部マスク。
   * @ko 키 조합의 모든 보조 비트를 추출하는 내부 마스크.
   */
  ImGuiMod_Mask_: 61440,
  /**
   * Number of named-key slots, excluding the legacy range.
   *
   * @zh 命名键槽位数量，不包含旧键码范围。
   * @ja 旧コード範囲を除いた名前付きキー枠の数。
   * @ko 구형 코드 범위를 제외한 명명 키 슬롯 수.
   */
  NamedKey_COUNT: 155,
  /**
   * Obsolete exclusive-end sentinel; not the number of named keys.
   *
   * @zh 旧结束哨兵（不含），不是命名键数量。
   * @ja 旧終了番兵（含まない）。名前付きキーの個数ではない。
   * @ko 구형 끝 센티널(제외). 명명 키 개수가 아님.
   */
  COUNT: 667,
  /**
   * Legacy alias of ImGuiKey.ImGuiMod_Ctrl, including macOS Command mapping.
   *
   * @zh ImGuiKey.ImGuiMod_Ctrl 的旧别名，包含 macOS Command 映射。
   * @ja ImGuiKey.ImGuiMod_Ctrl の旧名。macOS の Command 対応も含む。
   * @ko ImGuiKey.ImGuiMod_Ctrl의 구형 별칭. macOS Command 대응 포함.
   */
  ImGuiMod_Shortcut: 4096,
  /**
   * Legacy Control modifier alias; use ImGuiKey.ImGuiMod_Ctrl.
   *
   * @zh 旧 Control 修饰位别名；改用 ImGuiKey.ImGuiMod_Ctrl。
   * @ja 旧 Control 修飾名。ImGuiKey.ImGuiMod_Ctrl を使う。
   * @ko 구형 Control 보조 별칭. ImGuiKey.ImGuiMod_Ctrl 사용.
   */
  ModCtrl: 4096,
  /**
   * Legacy Shift modifier alias; use ImGuiKey.ImGuiMod_Shift.
   *
   * @zh 旧 Shift 修饰位别名；改用 ImGuiKey.ImGuiMod_Shift。
   * @ja 旧 Shift 修飾名。ImGuiKey.ImGuiMod_Shift を使う。
   * @ko 구형 Shift 보조 별칭. ImGuiKey.ImGuiMod_Shift 사용.
   */
  ModShift: 8192,
  /**
   * Legacy Alt modifier alias; use ImGuiKey.ImGuiMod_Alt.
   *
   * @zh 旧 Alt 修饰位别名；改用 ImGuiKey.ImGuiMod_Alt。
   * @ja 旧 Alt 修飾名。ImGuiKey.ImGuiMod_Alt を使う。
   * @ko 구형 Alt 보조 별칭. ImGuiKey.ImGuiMod_Alt 사용.
   */
  ModAlt: 16384,
  /**
   * Legacy Super modifier alias; use ImGuiKey.ImGuiMod_Super.
   *
   * @zh 旧 Super 修饰位别名；改用 ImGuiKey.ImGuiMod_Super。
   * @ja 旧 Super 修飾名。ImGuiKey.ImGuiMod_Super を使う。
   * @ko 구형 Super 보조 별칭. ImGuiKey.ImGuiMod_Super 사용.
   */
  ModSuper: 32768,
} as const);

/**
 * Named input identifier or modifier bit accepted by key APIs.
 *
 * @zh 按键 API 接受的命名输入标识或修饰位。
 * @ja キー API が受け取る名前付き入力識別子または修飾ビット。
 * @ko 키 API에서 받는 명명 입력 식별자 또는 보조 비트.
 */
export type ImGuiKey = number;
