/**
 * Shared widget behavior controlled by PushItemFlag().
 *
 * @zh PushItemFlag() 控制的通用控件行为。
 * @ja PushItemFlag() で制御する共通ウィジェット動作。
 * @ko PushItemFlag()로 제어하는 공통 위젯 동작.
 */
export const ImGuiItemFlags = Object.freeze({
  /**
   * No additional item options.
   *
   * @zh 不添加控件选项。
   * @ja 追加の項目設定なし。
   * @ko 추가 항목 설정 없음.
   */
  None: 0,
  /**
   * Skip the item when navigating with Tab.
   *
   * @zh Tab 导航时跳过此控件。
   * @ja Tab 移動でこの項目を飛ばす。
   * @ko Tab 탐색 시 이 항목을 건너뜀.
   */
  NoTabStop: 1,
  /**
   * Reject keyboard/gamepad focus and SetKeyboardFocusHere().
   *
   * @zh 禁止键盘、手柄聚焦及 SetKeyboardFocusHere() 聚焦。
   * @ja キーボード、ゲームパッド、SetKeyboardFocusHere() のフォーカスを拒否。
   * @ko 키보드, 게임패드 및 SetKeyboardFocusHere()의 포커스 금지.
   */
  NoNav: 2,
  /**
   * Exclude the item from default-focus candidates.
   *
   * @zh 不将此控件作为默认焦点候选。
   * @ja 初期フォーカスの候補から除外する。
   * @ko 기본 포커스 후보에서 제외.
   */
  NoNavDefaultFocus: 4,
  /**
   * Repeat button-like activation using IO key-repeat delay and rate.
   *
   * @zh 按 IO 的按键重复延迟和速率重复触发按钮类行为。
   * @ja IO のキーリピート間隔と遅延でボタン動作を繰り返す。
   * @ko IO 키 반복 지연과 속도로 버튼 동작 반복.
   */
  ButtonRepeat: 8,
  /**
   * MenuItem/Selectable close their parent popup on activation (default).
   *
   * @zh MenuItem/Selectable 激活后关闭父弹窗，默认启用。
   * @ja MenuItem/Selectable の実行時に親ポップアップを閉じる。既定で有効。
   * @ko MenuItem/Selectable 활성화 시 부모 팝업 닫기. 기본 활성화.
   */
  AutoClosePopups: 16,
  /**
   * Allow duplicate IDs this frame without the debug conflict tooltip.
   *
   * @zh 允许本帧重复 ID，不显示调试冲突提示。
   * @ja 同一フレームの ID 重複を許可し、競合デバッグ表示を抑える。
   * @ko 현재 프레임의 ID 중복을 허용하고 충돌 디버그 툴팁을 숨김.
   */
  AllowDuplicateId: 32,
} as const);

/**
 * Bitwise combination of shared widget options.
 *
 * @zh 通用控件选项的按位组合。
 * @ja 共通ウィジェット設定のビット組み合わせ。
 * @ko 공통 위젯 설정의 비트 조합.
 */
export type ImGuiItemFlags = number;

/**
 * Text input filtering, editing and callback options.
 *
 * @zh 文本输入的过滤、编辑和回调选项。
 * @ja テキスト入力のフィルター、編集、コールバック設定。
 * @ko 텍스트 입력 필터, 편집 및 콜백 설정.
 */
export const ImGuiInputTextFlags = Object.freeze({
  /**
   * Use normal editable text input.
   *
   * @zh 使用普通可编辑文本输入。
   * @ja 通常の編集可能なテキスト入力。
   * @ko 일반 편집 가능한 텍스트 입력.
   */
  None: 0,
  /**
   * Accept decimal digits, decimal point and arithmetic operators.
   *
   * @zh 允许十进制数字、小数点和加减乘除符号。
   * @ja 十進数字、小数点、四則演算記号を許可する。
   * @ko 십진 숫자, 소수점 및 사칙 연산 기호 허용.
   */
  CharsDecimal: 1,
  /**
   * Accept only 0-9, A-F and a-f.
   *
   * @zh 仅允许 0-9、A-F 和 a-f。
   * @ja 0-9、A-F、a-f のみ許可する。
   * @ko 0-9, A-F 및 a-f만 허용.
   */
  CharsHexadecimal: 2,
  /**
   * Accept decimal arithmetic characters plus e/E for exponents.
   *
   * @zh 允许十进制运算字符及指数符号 e/E。
   * @ja 十進演算用の文字に加え指数用の e/E を許可する。
   * @ko 십진 연산 문자와 지수 표기용 e/E 허용.
   */
  CharsScientific: 4,
  /**
   * Convert ASCII a-z input to A-Z.
   *
   * @zh 将输入的 ASCII a-z 转为 A-Z。
   * @ja 入力された ASCII a-z を A-Z に変換する。
   * @ko 입력된 ASCII a-z를 A-Z로 변환.
   */
  CharsUppercase: 8,
  /**
   * Reject spaces and tabs.
   *
   * @zh 拒绝空格和制表符。
   * @ja 空白とタブを拒否する。
   * @ko 공백 및 탭 거부.
   */
  CharsNoBlank: 16,
  /**
   * Insert a tab character when Tab is pressed.
   *
   * @zh 按 Tab 时插入制表符。
   * @ja Tab キーでタブ文字を挿入する。
   * @ko Tab 키를 누르면 탭 문자 삽입.
   */
  AllowTabInput: 32,
  /**
   * Return true on Enter instead of on every edit.
   *
   * @zh 按 Enter 时返回 true，而非每次编辑时返回。
   * @ja 編集のたびではなく Enter 押下時に true を返す。
   * @ko 매 편집 대신 Enter 입력 시 true 반환.
   */
  EnterReturnsTrue: 64,
  /**
   * Escape clears nonempty text; if already empty, it deactivates input.
   *
   * @zh Escape 清空非空文本；文本已空时退出编辑。
   * @ja Escape で内容を消去し、空なら入力を終了する。
   * @ko Escape로 내용을 지우고 이미 비어 있으면 입력 비활성화.
   */
  EscapeClearsAll: 128,
  /**
   * Multiline: Enter commits, Ctrl+Enter inserts a newline.
   *
   * @zh 多行输入：Enter 确认，Ctrl+Enter 换行。
   * @ja 複数行入力では Enter で確定、Ctrl+Enter で改行する。
   * @ko 여러 줄 입력에서 Enter는 확정, Ctrl+Enter는 줄바꿈.
   */
  CtrlEnterForNewLine: 256,
  /**
   * Allow reading and selection, but no edits.
   *
   * @zh 允许阅读和选择，但不可编辑。
   * @ja 読み取りと選択のみで、編集は禁止する。
   * @ko 읽기와 선택만 허용하고 편집 금지.
   */
  ReadOnly: 512,
  /**
   * Display characters as asterisks and disable copying.
   *
   * @zh 字符显示为星号，并禁用复制。
   * @ja 文字をアスタリスクで表示し、コピーを禁止する。
   * @ko 문자를 별표로 표시하고 복사 금지.
   */
  Password: 1024,
  /**
   * Replace existing characters instead of inserting.
   *
   * @zh 覆盖已有字符，而不是插入。
   * @ja 挿入せず既存の文字を上書きする。
   * @ko 삽입 대신 기존 문자를 덮어씀.
   */
  AlwaysOverwrite: 2048,
  /**
   * Select all text when first receiving mouse focus.
   *
   * @zh 首次由鼠标获取焦点时全选文本。
   * @ja マウスで最初にフォーカスしたとき全文を選択する。
   * @ko 마우스로 처음 포커스를 받을 때 전체 텍스트 선택.
   */
  AutoSelectAll: 4096,
  /**
   * Numeric inputs only: interpret an empty string as zero.
   *
   * @zh 仅数值输入：将空字符串解析为零。
   * @ja 数値入力専用。空文字列をゼロとして解釈する。
   * @ko 숫자 입력 전용. 빈 문자열을 0으로 해석.
   */
  ParseEmptyRefVal: 8192,
  /**
   * Numeric inputs only: display zero as an empty string.
   *
   * @zh 仅数值输入：零值显示为空字符串。
   * @ja 数値入力専用。ゼロを空文字列として表示する。
   * @ko 숫자 입력 전용. 0을 빈 문자열로 표시.
   */
  DisplayEmptyRefVal: 16384,
  /**
   * Do not scroll horizontally to follow the text cursor.
   *
   * @zh 不随文本光标水平滚动。
   * @ja テキストカーソルを追う横スクロールをしない。
   * @ko 텍스트 커서를 따라 가로로 스크롤하지 않음.
   */
  NoHorizontalScroll: 32768,
  /**
   * Disable the built-in undo and redo history.
   *
   * @zh 禁用内置撤销和重做历史。
   * @ja 内蔵の取り消しとやり直しを無効化する。
   * @ko 내장 실행 취소 및 다시 실행 기록 비활성화.
   */
  NoUndoRedo: 65536,
  /**
   * Single-line only: elide the left side to keep the end visible.
   *
   * @zh 仅单行输入：省略左侧以保留末尾可见。
   * @ja 単一行専用。左側を省略して末尾を見せる。
   * @ko 한 줄 입력 전용. 왼쪽을 생략해 끝부분을 표시.
   */
  ElideLeft: 131072,
  /**
   * Invoke the completion callback on Tab.
   *
   * @zh 按 Tab 时调用补全回调。
   * @ja Tab で補完コールバックを呼ぶ。
   * @ko Tab 입력 시 자동 완성 콜백 호출.
   */
  CallbackCompletion: 262144,
  /**
   * Invoke the history callback on Up/Down.
   *
   * @zh 按上、下方向键时调用历史回调。
   * @ja 上下キーで履歴コールバックを呼ぶ。
   * @ko 위아래 방향키 입력 시 기록 콜백 호출.
   */
  CallbackHistory: 524288,
  /**
   * Invoke a callback each active update to inspect or edit the buffer.
   *
   * @zh 激活期间每次更新均调用回调，可检查或编辑缓冲区。
   * @ja 編集中の毎更新でコールバックを呼び、バッファを参照・変更できる。
   * @ko 활성 상태의 매 갱신마다 콜백으로 버퍼 조회 또는 편집.
   */
  CallbackAlways: 1048576,
  /**
   * Invoke a callback to replace or reject each input character.
   *
   * @zh 调用回调以替换或拒绝各输入字符。
   * @ja 各入力文字を置換・拒否するコールバックを呼ぶ。
   * @ko 각 입력 문자를 바꾸거나 거부하는 콜백 호출.
   */
  CallbackCharFilter: 2097152,
  /**
   * Request buffer growth through a callback; honor the supplied BufSize.
   *
   * @zh 通过回调请求扩容；必须满足回调提供的 BufSize。
   * @ja コールバックでバッファ拡張を要求。指定された BufSize を満たすこと。
   * @ko 콜백으로 버퍼 확장 요청. 전달된 BufSize를 반드시 충족해야 함.
   */
  CallbackResize: 4194304,
  /**
   * Invoke the callback whenever text is edited.
   *
   * @zh 每次文本被编辑时调用回调。
   * @ja テキスト編集のたびにコールバックを呼ぶ。
   * @ko 텍스트가 편집될 때마다 콜백 호출.
   */
  CallbackEdit: 8388608,
} as const);

/**
 * Bitwise combination of text-input options.
 *
 * @zh 文本输入选项的按位组合。
 * @ja テキスト入力設定のビット組み合わせ。
 * @ko 텍스트 입력 설정의 비트 조합.
 */
export type ImGuiInputTextFlags = number;

/**
 * Native scalar storage kinds; Bool and String are not scalar-widget types.
 *
 * @zh 原生标量存储类型；Bool、String 不受标量控件支持。
 * @ja ネイティブの格納型。Bool と String はスカラーウィジェット非対応。
 * @ko 네이티브 저장 형식. Bool과 String은 스칼라 위젯에서 지원하지 않음.
 */
export const ImGuiDataType = Object.freeze({
  /**
   * Signed 8-bit integer.
   *
   * @zh 8 位有符号整数。
   * @ja 符号付き 8 ビット整数。
   * @ko 부호 있는 8비트 정수.
   */
  S8: 0,
  /**
   * Unsigned 8-bit integer.
   *
   * @zh 8 位无符号整数。
   * @ja 符号なし 8 ビット整数。
   * @ko 부호 없는 8비트 정수.
   */
  U8: 1,
  /**
   * Signed 16-bit integer.
   *
   * @zh 16 位有符号整数。
   * @ja 符号付き 16 ビット整数。
   * @ko 부호 있는 16비트 정수.
   */
  S16: 2,
  /**
   * Unsigned 16-bit integer.
   *
   * @zh 16 位无符号整数。
   * @ja 符号なし 16 ビット整数。
   * @ko 부호 없는 16비트 정수.
   */
  U16: 3,
  /**
   * Signed 32-bit integer.
   *
   * @zh 32 位有符号整数。
   * @ja 符号付き 32 ビット整数。
   * @ko 부호 있는 32비트 정수.
   */
  S32: 4,
  /**
   * Unsigned 32-bit integer.
   *
   * @zh 32 位无符号整数。
   * @ja 符号なし 32 ビット整数。
   * @ko 부호 없는 32비트 정수.
   */
  U32: 5,
  /**
   * Signed 64-bit integer.
   *
   * @zh 64 位有符号整数。
   * @ja 符号付き 64 ビット整数。
   * @ko 부호 있는 64비트 정수.
   */
  S64: 6,
  /**
   * Unsigned 64-bit integer.
   *
   * @zh 64 位无符号整数。
   * @ja 符号なし 64 ビット整数。
   * @ko 부호 없는 64비트 정수.
   */
  U64: 7,
  /**
   * 32-bit floating-point number.
   *
   * @zh 32 位浮点数。
   * @ja 32 ビット浮動小数点数。
   * @ko 32비트 부동 소수점 수.
   */
  Float: 8,
  /**
   * 64-bit floating-point number.
   *
   * @zh 64 位浮点数。
   * @ja 64 ビット浮動小数点数。
   * @ko 64비트 부동 소수점 수.
   */
  Double: 9,
  /**
   * Boolean; provided for user code, not scalar widgets.
   *
   * @zh 布尔值；供用户代码使用，不用于标量控件。
   * @ja 真偽値。ユーザーコード用でスカラーウィジェット非対応。
   * @ko 불리언. 사용자 코드용이며 스칼라 위젯 미지원.
   */
  Bool: 10,
  /**
   * String; provided for user code, not scalar widgets.
   *
   * @zh 字符串；供用户代码使用，不用于标量控件。
   * @ja 文字列。ユーザーコード用でスカラーウィジェット非対応。
   * @ko 문자열. 사용자 코드용이며 스칼라 위젯 미지원.
   */
  String: 11,
  /**
   * Number of storage kinds; not a data type.
   *
   * @zh 存储类型数量，不是数据类型。
   * @ja 格納型の個数。データ型ではない。
   * @ko 저장 형식 개수. 데이터 형식이 아님.
   */
  COUNT: 12,
} as const);

/**
 * Numeric identifier of a native storage kind.
 *
 * @zh 原生存储类型的数值标识。
 * @ja ネイティブ格納型の数値識別子。
 * @ko 네이티브 저장 형식의 숫자 식별자.
 */
export type ImGuiDataType = number;
