// Generated from RmlUi 6.3: generate-computed-values.cjs.

/**
 * The computed layout box generation.
 *
 * @zh 计算后的布局盒生成方式。
 * @ja 計算済みのレイアウトボックスの生成方式。
 * @ko 계산된 레이아웃 상자 생성 방식입니다.
 */
export enum Display {
  /**
   * Do not generate a layout box or render the element.
   *
   * @zh 不生成布局盒，也不绘制元素。
   * @ja レイアウトボックスを生成せず要素も描画しません。
   * @ko 레이아웃 상자를 생성하지 않고 요소를 렌더링하지 않습니다.
   */
  None = 0,
  /**
   * Generate a block-level box.
   *
   * @zh 生成块级盒。
   * @ja ブロックレベルのボックスを生成します。
   * @ko 블록 수준 상자를 생성합니다.
   */
  Block = 1,
  /**
   * Generate an inline box in the current text line.
   *
   * @zh 在当前文本行中生成行内盒。
   * @ja 現在のテキスト行にインラインボックスを生成します。
   * @ko 현재 텍스트 줄에 인라인 상자를 생성합니다.
   */
  Inline = 2,
  /**
   * Place a block container as one inline item.
   *
   * @zh 将块容器作为一个行内项排列。
   * @ja ブロックコンテナーを一つのインライン項目として配置します。
   * @ko 블록 컨테이너를 하나의 인라인 항목으로 배치합니다.
   */
  InlineBlock = 3,
  /**
   * Establish an independent block formatting context.
   *
   * @zh 建立独立的块格式化上下文。
   * @ja 独立したブロック整形コンテキストを作ります。
   * @ko 독립된 블록 서식 컨텍스트를 만듭니다.
   */
  FlowRoot = 4,
  /**
   * Lay out children in a block-level flex container.
   *
   * @zh 在块级弹性容器中布局子项。
   * @ja ブロックレベルのフレックスコンテナーで子を配置します。
   * @ko 블록 수준 플렉스 컨테이너에 자식을 배치합니다.
   */
  Flex = 5,
  /**
   * Lay out children in an inline-level flex container.
   *
   * @zh 在行内弹性容器中布局子项。
   * @ja インラインレベルのフレックスコンテナーで子を配置します。
   * @ko 인라인 수준 플렉스 컨테이너에 자식을 배치합니다.
   */
  InlineFlex = 6,
  /**
   * Generate a table container.
   *
   * @zh 生成表格容器。
   * @ja テーブルコンテナーを生成します。
   * @ko 표 컨테이너를 생성합니다.
   */
  Table = 7,
  /**
   * Place a table as an inline item.
   *
   * @zh 将表格作为行内项排列。
   * @ja テーブルをインライン項目として配置します。
   * @ko 표를 인라인 항목으로 배치합니다.
   */
  InlineTable = 8,
  /**
   * Generate a table row.
   *
   * @zh 生成表格行。
   * @ja テーブルの行を生成します。
   * @ko 표 행을 생성합니다.
   */
  TableRow = 9,
  /**
   * Group table rows.
   *
   * @zh 组合表格行。
   * @ja テーブルの行をまとめます。
   * @ko 표 행을 그룹화합니다.
   */
  TableRowGroup = 10,
  /**
   * Generate a table column.
   *
   * @zh 生成表格列。
   * @ja テーブルの列を生成します。
   * @ko 표 열을 생성합니다.
   */
  TableColumn = 11,
  /**
   * Group table columns.
   *
   * @zh 组合表格列。
   * @ja テーブルの列をまとめます。
   * @ko 표 열을 그룹화합니다.
   */
  TableColumnGroup = 12,
  /**
   * Generate a table cell.
   *
   * @zh 生成表格单元格。
   * @ja テーブルのセルを生成します。
   * @ko 표 셀을 생성합니다.
   */
  TableCell = 13,
}

/**
 * The computed positioning scheme.
 *
 * @zh 计算后的定位方式。
 * @ja 計算済みの配置方式。
 * @ko 계산된 배치 방식입니다.
 */
export enum Position {
  /**
   * Use normal flow without position offsets.
   *
   * @zh 使用正常流，不应用定位偏移。
   * @ja 配置オフセットを使わず通常フローに従います。
   * @ko 배치 오프셋 없이 일반 흐름을 따릅니다.
   */
  Static = 0,
  /**
   * Offset the box while preserving its space in normal flow.
   *
   * @zh 偏移盒并保留其正常流空间。
   * @ja 通常フローの領域を保持してボックスをずらします。
   * @ko 일반 흐름 공간을 유지하면서 상자를 이동합니다.
   */
  Relative = 1,
  /**
   * Remove the box from normal flow and position it in its containing block.
   *
   * @zh 脱离正常流，相对包含块定位。
   * @ja 通常フローから外して包含ブロック内に配置します。
   * @ko 일반 흐름에서 제외하고 포함 블록 안에 배치합니다.
   */
  Absolute = 2,
  /**
   * Position the box relative to the viewport.
   *
   * @zh 相对视口定位。
   * @ja ビューポートを基準に配置します。
   * @ko 뷰포트를 기준으로 배치합니다.
   */
  Fixed = 3,
}

/**
 * The computed float placement.
 *
 * @zh 计算后的浮动方向。
 * @ja 計算済みのフロート配置。
 * @ko 계산된 플로트 배치입니다.
 */
export enum Float {
  /**
   * Disable this behavior.
   *
   * @zh 禁用该行为。
   * @ja この動作を無効にします。
   * @ko 이 동작을 비활성화합니다.
   */
  None = 0,
  /**
   * Use the left side.
   *
   * @zh 使用左侧。
   * @ja 左側を使用します。
   * @ko 왼쪽을 사용합니다.
   */
  Left = 1,
  /**
   * Use the right side.
   *
   * @zh 使用右侧。
   * @ja 右側を使用します。
   * @ko 오른쪽을 사용합니다.
   */
  Right = 2,
}

/**
 * The computed float clearance.
 *
 * @zh 计算后的浮动避让。
 * @ja 計算済みのフロートの回り込み解除。
 * @ko 계산된 플로트 회피입니다.
 */
export enum Clear {
  /**
   * Disable this behavior.
   *
   * @zh 禁用该行为。
   * @ja この動作を無効にします。
   * @ko 이 동작을 비활성화합니다.
   */
  None = 0,
  /**
   * Use the left side.
   *
   * @zh 使用左侧。
   * @ja 左側を使用します。
   * @ko 왼쪽을 사용합니다.
   */
  Left = 1,
  /**
   * Use the right side.
   *
   * @zh 使用右侧。
   * @ja 右側を使用します。
   * @ko 오른쪽을 사용합니다.
   */
  Right = 2,
  /**
   * Clear floats on both sides.
   *
   * @zh 避让两侧浮动。
   * @ja 両側のフロートを解除します。
   * @ko 양쪽 플로트를 피합니다.
   */
  Both = 3,
}

/**
 * The computed size calculation box.
 *
 * @zh 计算后的尺寸计算盒。
 * @ja 計算済みのサイズ計算の基準ボックス。
 * @ko 계산된 크기 계산 기준 상자입니다.
 */
export enum BoxSizing {
  /**
   * Width and height describe the content, excluding padding and borders.
   *
   * @zh 宽高描述内容，不含内边距和边框。
   * @ja 幅と高さは余白と境界線を除く内容を表します。
   * @ko 너비와 높이는 안쪽 여백과 테두리를 제외한 내용 크기입니다.
   */
  ContentBox = 0,
  /**
   * Width and height include padding and borders.
   *
   * @zh 宽高包含内边距和边框。
   * @ja 幅と高さに余白と境界線を含めます。
   * @ko 너비와 높이에 안쪽 여백과 테두리를 포함합니다.
   */
  BorderBox = 1,
}

/**
 * The computed overflow handling.
 *
 * @zh 计算后的溢出处理。
 * @ja 計算済みのはみ出しの処理。
 * @ko 계산된 넘침 처리입니다.
 */
export enum Overflow {
  /**
   * Render overflow outside the box without clipping.
   *
   * @zh 不裁剪盒外溢出内容。
   * @ja ボックス外の内容を切り取らず描画します。
   * @ko 상자 밖 넘침을 자르지 않고 렌더링합니다.
   */
  Visible = 0,
  /**
   * Clip overflow without scrollbars.
   *
   * @zh 裁剪溢出，不显示滚动条。
   * @ja スクロールバーを付けずにはみ出しを切り取ります。
   * @ko 스크롤바 없이 넘침을 자릅니다.
   */
  Hidden = 1,
  /**
   * Clip overflow and show scrollbars only when needed.
   *
   * @zh 裁剪溢出，仅在需要时显示滚动条。
   * @ja はみ出しを切り取り必要な場合だけスクロールバーを表示します。
   * @ko 넘침을 자르고 필요할 때만 스크롤바를 표시합니다.
   */
  Auto = 2,
  /**
   * Clip overflow and always show scrollbars.
   *
   * @zh 裁剪溢出并始终显示滚动条。
   * @ja はみ出しを切り取りスクロールバーを常に表示します。
   * @ko 넘침을 자르고 스크롤바를 항상 표시합니다.
   */
  Scroll = 3,
}

/**
 * The computed visibility.
 *
 * @zh 计算后的可见性。
 * @ja 計算済みの表示状態。
 * @ko 계산된 표시 상태입니다.
 */
export enum Visibility {
  /**
   * Allow rendering to remain visible.
   *
   * @zh 允许内容可见。
   * @ja 内容の表示を許可します。
   * @ko 내용 표시를 허용합니다.
   */
  Visible = 0,
  /**
   * Hide rendering while keeping the layout box.
   *
   * @zh 隐藏绘制并保留布局盒。
   * @ja レイアウトボックスを保持して描画を隠します。
   * @ko 레이아웃 상자를 유지하고 렌더링을 숨깁니다.
   */
  Hidden = 1,
}

/**
 * The computed text overflow marker.
 *
 * @zh 计算后的文本溢出标记。
 * @ja 計算済みのテキストの省略表示。
 * @ko 계산된 텍스트 넘침 표시입니다.
 */
export enum TextOverflow {
  /**
   * Cut off overflowing text without a marker.
   *
   * @zh 截断溢出文本，不添加标记。
   * @ja 省略記号を付けずにはみ出す文字を切り取ります。
   * @ko 표시 없이 넘치는 텍스트를 자릅니다.
   */
  Clip = 0,
  /**
   * Replace overflowing text with an ellipsis.
   *
   * @zh 以省略号替换溢出文本。
   * @ja はみ出す文字を省略記号に置き換えます。
   * @ko 넘치는 텍스트를 줄임표로 바꿉니다.
   */
  Ellipsis = 1,
  /**
   * Use the supplied string as the overflow marker.
   *
   * @zh 使用指定字符串标记文本溢出。
   * @ja 指定の文字列を省略表示に使用します。
   * @ko 지정한 문자열로 텍스트 넘침을 표시합니다.
   */
  String = 2,
}

/**
 * The computed font slant.
 *
 * @zh 计算后的字体倾斜样式。
 * @ja 計算済みのフォントの傾斜。
 * @ko 계산된 글꼴 기울기입니다.
 */
export enum FontStyle {
  /**
   * Select an upright font face.
   *
   * @zh 选择正体字体。
   * @ja 直立体のフォントを選びます。
   * @ko 기울지 않은 글꼴을 선택합니다.
   */
  Normal = 0,
  /**
   * Select an italic font face.
   *
   * @zh 选择斜体字体。
   * @ja イタリック体のフォントを選びます。
   * @ko 기울임 글꼴을 선택합니다.
   */
  Italic = 1,
}

/**
 * The computed font weight.
 *
 * @zh 计算后的字重。
 * @ja 計算済みのフォントの太さ。
 * @ko 계산된 글꼴 굵기입니다.
 */
export enum FontWeight {
  /**
   * Request automatic font weight selection; concrete weights range from 1 to
   * 1000.
   *
   * @zh 请求自动选择字重；具体字重范围为 1 至 1000。
   * @ja 太さの自動選択を要求します。具体的な値は 1〜1000 です。
   * @ko 글꼴 굵기 자동 선택을 요청하며 구체적인 굵기는 1~1000입니다.
   */
  Auto = 0,
  /**
   * Select normal font weight 400.
   *
   * @zh 选择常规字重 400。
   * @ja 標準の太さ 400 を選びます。
   * @ko 일반 글꼴 굵기 400을 선택합니다.
   */
  Normal = 400,
  /**
   * Select bold weight 700.
   *
   * @zh 选择粗体字重 700。
   * @ja 太さ 700 の太字を選びます。
   * @ko 굵기 700인 굵은 글꼴을 선택합니다.
   */
  Bold = 700,
}

/**
 * The computed font kerning.
 *
 * @zh 计算后的字体字偶距。
 * @ja 計算済みのカーニング。
 * @ko 계산된 커닝입니다.
 */
export enum FontKerning {
  /**
   * Let the engine choose the behavior from the element and its context.
   *
   * @zh 由引擎根据元素及上下文决定行为。
   * @ja 要素とコンテキストからエンジンが動作を選びます。
   * @ko 요소와 컨텍스트에 따라 엔진이 동작을 선택합니다.
   */
  Auto = 0,
  /**
   * Apply font kerning.
   *
   * @zh 应用字体字偶距。
   * @ja フォントのカーニングを適用します。
   * @ko 글꼴 커닝을 적용합니다.
   */
  Normal = 1,
  /**
   * Disable this behavior.
   *
   * @zh 禁用该行为。
   * @ja この動作を無効にします。
   * @ko 이 동작을 비활성화합니다.
   */
  None = 2,
}

/**
 * The computed text horizontal alignment.
 *
 * @zh 计算后的文本水平对齐。
 * @ja 計算済みのテキストの水平配置。
 * @ko 계산된 텍스트 수평 정렬입니다.
 */
export enum TextAlign {
  /**
   * Use the left side.
   *
   * @zh 使用左侧。
   * @ja 左側を使用します。
   * @ko 왼쪽을 사용합니다.
   */
  Left = 0,
  /**
   * Use the right side.
   *
   * @zh 使用右侧。
   * @ja 右側を使用します。
   * @ko 오른쪽을 사용합니다.
   */
  Right = 1,
  /**
   * Align at the centre.
   *
   * @zh 居中对齐。
   * @ja 中央に配置します。
   * @ko 중앙에 정렬합니다.
   */
  Center = 2,
  /**
   * Expand spacing to fill the text line.
   *
   * @zh 扩展间距以填满文本行。
   * @ja 間隔を広げてテキスト行を満たします。
   * @ko 간격을 늘려 텍스트 줄을 채웁니다.
   */
  Justify = 3,
}

/**
 * The computed text decoration line.
 *
 * @zh 计算后的文本装饰线。
 * @ja 計算済みのテキストの装飾線。
 * @ko 계산된 텍스트 장식선입니다.
 */
export enum TextDecoration {
  /**
   * Disable this behavior.
   *
   * @zh 禁用该行为。
   * @ja この動作を無効にします。
   * @ko 이 동작을 비활성화합니다.
   */
  None = 0,
  /**
   * Draw a line below the text.
   *
   * @zh 绘制下划线。
   * @ja テキストの下に線を引きます。
   * @ko 텍스트 아래에 선을 그립니다.
   */
  Underline = 1,
  /**
   * Draw a line above the text.
   *
   * @zh 绘制上划线。
   * @ja テキストの上に線を引きます。
   * @ko 텍스트 위에 선을 그립니다.
   */
  Overline = 2,
  /**
   * Draw a line through the text.
   *
   * @zh 绘制删除线。
   * @ja テキストを横切る線を引きます。
   * @ko 텍스트 가운데에 선을 그립니다.
   */
  LineThrough = 3,
}

/**
 * The computed text case conversion.
 *
 * @zh 计算后的文本大小写转换。
 * @ja 計算済みの大文字・小文字の変換。
 * @ko 계산된 텍스트 대소문자 변환입니다.
 */
export enum TextTransform {
  /**
   * Disable this behavior.
   *
   * @zh 禁用该行为。
   * @ja この動作を無効にします。
   * @ko 이 동작을 비활성화합니다.
   */
  None = 0,
  /**
   * Uppercase the first letter of each word.
   *
   * @zh 将各单词首字母转换为大写。
   * @ja 各単語の先頭文字を大文字にします。
   * @ko 각 단어의 첫 글자를 대문자로 바꿉니다.
   */
  Capitalize = 1,
  /**
   * Convert text to uppercase.
   *
   * @zh 将文本转换为大写。
   * @ja テキストを大文字にします。
   * @ko 텍스트를 대문자로 바꿉니다.
   */
  Uppercase = 2,
  /**
   * Convert text to lowercase.
   *
   * @zh 将文本转换为小写。
   * @ja テキストを小文字にします。
   * @ko 텍스트를 소문자로 바꿉니다.
   */
  Lowercase = 3,
}

/**
 * The computed whitespace and wrapping.
 *
 * @zh 计算后的空白与换行处理。
 * @ja 計算済みの空白と折り返しの処理。
 * @ko 계산된 공백 및 줄바꿈 처리입니다.
 */
export enum WhiteSpace {
  /**
   * Collapse whitespace and wrap lines.
   *
   * @zh 折叠空白并自动换行。
   * @ja 空白をまとめ行を折り返します。
   * @ko 공백을 합치고 자동 줄바꿈합니다.
   */
  Normal = 0,
  /**
   * Preserve whitespace and explicit line breaks without wrapping.
   *
   * @zh 保留空白和显式换行，不自动折行。
   * @ja 空白と明示的改行を保持し折り返しません。
   * @ko 공백과 명시적 줄바꿈을 유지하고 자동 줄바꿈하지 않습니다.
   */
  Pre = 1,
  /**
   * Keep content on one line without wrapping.
   *
   * @zh 保持单行，不自动换行。
   * @ja 内容を一行に保ち折り返しません。
   * @ko 내용을 한 줄로 유지하고 줄바꿈하지 않습니다.
   */
  Nowrap = 2,
  /**
   * Preserve whitespace and also wrap long lines.
   *
   * @zh 保留空白并自动折行。
   * @ja 空白を保持し長い行を折り返します。
   * @ko 공백을 유지하고 긴 줄을 줄바꿈합니다.
   */
  Prewrap = 3,
  /**
   * Collapse spaces, preserve line breaks, and wrap.
   *
   * @zh 折叠空格，保留换行并自动折行。
   * @ja 空白をまとめ、改行を保持して折り返します。
   * @ko 공백을 합치고 줄바꿈을 유지하며 자동 줄바꿈합니다.
   */
  Preline = 4,
}

/**
 * The computed word breaking.
 *
 * @zh 计算后的单词断行。
 * @ja 計算済みの単語の改行規則。
 * @ko 계산된 단어 줄바꿈입니다.
 */
export enum WordBreak {
  /**
   * Use normal language-aware line breaks.
   *
   * @zh 按语言规则正常断行。
   * @ja 言語の通常の改行規則を使用します。
   * @ko 언어의 일반 줄바꿈 규칙을 사용합니다.
   */
  Normal = 0,
  /**
   * Allow breaks between any characters.
   *
   * @zh 允许在任意字符之间断行。
   * @ja 任意の文字間で改行できます。
   * @ko 모든 문자 사이에서 줄바꿈을 허용합니다.
   */
  BreakAll = 1,
  /**
   * Break an otherwise unbreakable word when necessary.
   *
   * @zh 必要时拆分无法正常断行的单词。
   * @ja 必要なら通常改行できない単語を分割します。
   * @ko 필요하면 나눌 수 없는 단어를 나눕니다.
   */
  BreakWord = 2,
}

/**
 * The computed drag interaction.
 *
 * @zh 计算后的拖动交互。
 * @ja 計算済みのドラッグ操作。
 * @ko 계산된 드래그 동작입니다.
 */
export enum Drag {
  /**
   * Disable this behavior.
   *
   * @zh 禁用该行为。
   * @ja この動作を無効にします。
   * @ko 이 동작을 비활성화합니다.
   */
  None = 0,
  /**
   * Allow dragging the element.
   *
   * @zh 允许拖动元素。
   * @ja 要素のドラッグを許可します。
   * @ko 요소 드래그를 허용합니다.
   */
  Drag = 1,
  /**
   * Allow dragging with drop target events.
   *
   * @zh 允许拖动并产生放置目标事件。
   * @ja ドロップ対象イベントを伴うドラッグを許可します。
   * @ko 드롭 대상 이벤트를 포함하는 드래그를 허용합니다.
   */
  DragDrop = 2,
  /**
   * Prevent an ancestor from starting a drag through this element.
   *
   * @zh 阻止祖先通过此元素启动拖动。
   * @ja この要素を通じて祖先がドラッグを開始するのを防ぎます。
   * @ko 이 요소를 통해 조상이 드래그를 시작하지 못하게 합니다.
   */
  Block = 3,
  /**
   * Drag a visual clone of the element.
   *
   * @zh 拖动元素的可视副本。
   * @ja 要素の表示用複製をドラッグします。
   * @ko 요소의 시각적 복제본을 드래그합니다.
   */
  Clone = 4,
}

/**
 * The computed sequential keyboard focus.
 *
 * @zh 计算后的键盘顺序焦点。
 * @ja 計算済みのキーボードの順次フォーカス。
 * @ko 계산된 키보드 순차 포커스입니다.
 */
export enum TabIndex {
  /**
   * Disable this behavior.
   *
   * @zh 禁用该行为。
   * @ja この動作を無効にします。
   * @ko 이 동작을 비활성화합니다.
   */
  None = 0,
  /**
   * Include the element in sequential keyboard focus.
   *
   * @zh 将元素纳入键盘顺序焦点。
   * @ja 要素をキーボードの順次フォーカスに含めます。
   * @ko 요소를 키보드 순차 포커스에 포함합니다.
   */
  Auto = 1,
}

/**
 * The computed focus eligibility.
 *
 * @zh 计算后的焦点接收能力。
 * @ja 計算済みのフォーカスの可否。
 * @ko 계산된 포커스 허용 여부입니다.
 */
export enum Focus {
  /**
   * Disable this behavior.
   *
   * @zh 禁用该行为。
   * @ja この動作を無効にします。
   * @ko 이 동작을 비활성화합니다.
   */
  None = 0,
  /**
   * Allow the element to receive focus.
   *
   * @zh 允许元素接收焦点。
   * @ja 要素がフォーカスを受け取れます。
   * @ko 요소가 포커스를 받을 수 있습니다.
   */
  Auto = 1,
}

/**
 * The computed scroll chaining.
 *
 * @zh 计算后的滚动链传递。
 * @ja 計算済みのスクロールの連鎖。
 * @ko 계산된 스크롤 연쇄입니다.
 */
export enum OverscrollBehavior {
  /**
   * Let the engine choose the behavior from the element and its context.
   *
   * @zh 由引擎根据元素及上下文决定行为。
   * @ja 要素とコンテキストからエンジンが動作を選びます。
   * @ko 요소와 컨텍스트에 따라 엔진이 동작을 선택합니다.
   */
  Auto = 0,
  /**
   * Stop scroll propagation at this scroll container.
   *
   * @zh 在此滚动容器阻止滚动传递。
   * @ja このスクロールコンテナーで連鎖を止めます。
   * @ko 이 스크롤 컨테이너에서 스크롤 연쇄를 멈춥니다.
   */
  Contain = 1,
}

/**
 * The computed pointer hit testing.
 *
 * @zh 计算后的指针命中检测。
 * @ja 計算済みのポインターのヒット判定。
 * @ko 계산된 포인터 적중 검사입니다.
 */
export enum PointerEvents {
  /**
   * Disable this behavior.
   *
   * @zh 禁用该行为。
   * @ja この動作を無効にします。
   * @ko 이 동작을 비활성화합니다.
   */
  None = 0,
  /**
   * Allow this element to participate in pointer hit testing.
   *
   * @zh 允许此元素参与指针命中检测。
   * @ja この要素をポインターのヒット判定に含めます。
   * @ko 이 요소를 포인터 적중 검사에 포함합니다.
   */
  Auto = 1,
}

/**
 * The computed horizontal transform origin.
 *
 * @zh 计算后的水平变换原点。
 * @ja 計算済みの水平変換の原点。
 * @ko 계산된 수평 변환 원점입니다.
 */
export enum OriginX {
  /**
   * Use the left side.
   *
   * @zh 使用左侧。
   * @ja 左側を使用します。
   * @ko 왼쪽을 사용합니다.
   */
  Left = 0,
  /**
   * Align at the centre.
   *
   * @zh 居中对齐。
   * @ja 中央に配置します。
   * @ko 중앙에 정렬합니다.
   */
  Center = 1,
  /**
   * Use the right side.
   *
   * @zh 使用右侧。
   * @ja 右側を使用します。
   * @ko 오른쪽을 사용합니다.
   */
  Right = 2,
}

/**
 * The computed vertical transform origin.
 *
 * @zh 计算后的垂直变换原点。
 * @ja 計算済みの垂直変換の原点。
 * @ko 계산된 수직 변환 원점입니다.
 */
export enum OriginY {
  /**
   * Use the top edge.
   *
   * @zh 使用上边缘。
   * @ja 上端を使用します。
   * @ko 위쪽 가장자리를 사용합니다.
   */
  Top = 0,
  /**
   * Align at the centre.
   *
   * @zh 居中对齐。
   * @ja 中央に配置します。
   * @ko 중앙에 정렬합니다.
   */
  Center = 1,
  /**
   * Use the bottom edge.
   *
   * @zh 使用下边缘。
   * @ja 下端を使用します。
   * @ko 아래쪽 가장자리를 사용합니다.
   */
  Bottom = 2,
}

/**
 * The computed flex line alignment.
 *
 * @zh 计算后的弹性行对齐。
 * @ja 計算済みのフレックス行の配置。
 * @ko 계산된 플렉스 줄 정렬입니다.
 */
export enum AlignContent {
  /**
   * Pack items at the start of the alignment axis.
   *
   * @zh 沿对齐轴起点排列。
   * @ja 配置軸の始点にまとめます。
   * @ko 정렬 축 시작에 모읍니다.
   */
  FlexStart = 0,
  /**
   * Pack items at the end of the alignment axis.
   *
   * @zh 沿对齐轴终点排列。
   * @ja 配置軸の終点にまとめます。
   * @ko 정렬 축 끝에 모읍니다.
   */
  FlexEnd = 1,
  /**
   * Align at the centre.
   *
   * @zh 居中对齐。
   * @ja 中央に配置します。
   * @ko 중앙에 정렬합니다.
   */
  Center = 2,
  /**
   * Distribute free space between items, with no space at the outer edges.
   *
   * @zh 将剩余空间分配到项之间，外侧不留空。
   * @ja 外端を空けず項目間に余白を配分します。
   * @ko 바깥 여백 없이 항목 사이에 남은 공간을 분배합니다.
   */
  SpaceBetween = 3,
  /**
   * Distribute space around items, with half-sized outer gaps.
   *
   * @zh 在项周围分配空间，外侧间距减半。
   * @ja 項目の周囲に余白を配分し外端は半分にします。
   * @ko 항목 주위에 공간을 분배하고 바깥 간격은 절반으로 합니다.
   */
  SpaceAround = 4,
  /**
   * Use equal gaps between items and at the outer edges.
   *
   * @zh 项之间及外侧使用等距间隔。
   * @ja 項目間と外端の間隔を均等にします。
   * @ko 항목 사이와 바깥 간격을 같게 합니다.
   */
  SpaceEvenly = 5,
  /**
   * Stretch items or lines to fill available cross-axis space.
   *
   * @zh 拉伸项或行以填满交叉轴空间。
   * @ja 交差軸の空き領域を満たすよう項目または行を伸ばします。
   * @ko 교차 축 공간을 채우도록 항목 또는 줄을 늘립니다.
   */
  Stretch = 6,
}

/**
 * The computed default flex item alignment.
 *
 * @zh 计算后的弹性项默认对齐。
 * @ja 計算済みのフレックス項目の既定配置。
 * @ko 계산된 플렉스 항목 기본 정렬입니다.
 */
export enum AlignItems {
  /**
   * Pack items at the start of the alignment axis.
   *
   * @zh 沿对齐轴起点排列。
   * @ja 配置軸の始点にまとめます。
   * @ko 정렬 축 시작에 모읍니다.
   */
  FlexStart = 0,
  /**
   * Pack items at the end of the alignment axis.
   *
   * @zh 沿对齐轴终点排列。
   * @ja 配置軸の終点にまとめます。
   * @ko 정렬 축 끝에 모읍니다.
   */
  FlexEnd = 1,
  /**
   * Align at the centre.
   *
   * @zh 居中对齐。
   * @ja 中央に配置します。
   * @ko 중앙에 정렬합니다.
   */
  Center = 2,
  /**
   * Align text baselines.
   *
   * @zh 对齐文本基线。
   * @ja テキストのベースラインを揃えます。
   * @ko 텍스트 기준선을 맞춥니다.
   */
  Baseline = 3,
  /**
   * Stretch items or lines to fill available cross-axis space.
   *
   * @zh 拉伸项或行以填满交叉轴空间。
   * @ja 交差軸の空き領域を満たすよう項目または行を伸ばします。
   * @ko 교차 축 공간을 채우도록 항목 또는 줄을 늘립니다.
   */
  Stretch = 4,
}

/**
 * The computed individual flex item alignment.
 *
 * @zh 计算后的单个弹性项对齐。
 * @ja 計算済みの個別フレックス項目の配置。
 * @ko 계산된 개별 플렉스 항목 정렬입니다.
 */
export enum AlignSelf {
  /**
   * Use the parent flex container’s align-items value.
   *
   * @zh 使用父弹性容器的 align-items 值。
   * @ja 親フレックスコンテナーの align-items を使用します。
   * @ko 부모 플렉스 컨테이너의 align-items 값을 사용합니다.
   */
  Auto = 0,
  /**
   * Pack items at the start of the alignment axis.
   *
   * @zh 沿对齐轴起点排列。
   * @ja 配置軸の始点にまとめます。
   * @ko 정렬 축 시작에 모읍니다.
   */
  FlexStart = 1,
  /**
   * Pack items at the end of the alignment axis.
   *
   * @zh 沿对齐轴终点排列。
   * @ja 配置軸の終点にまとめます。
   * @ko 정렬 축 끝에 모읍니다.
   */
  FlexEnd = 2,
  /**
   * Align at the centre.
   *
   * @zh 居中对齐。
   * @ja 中央に配置します。
   * @ko 중앙에 정렬합니다.
   */
  Center = 3,
  /**
   * Align text baselines.
   *
   * @zh 对齐文本基线。
   * @ja テキストのベースラインを揃えます。
   * @ko 텍스트 기준선을 맞춥니다.
   */
  Baseline = 4,
  /**
   * Stretch items or lines to fill available cross-axis space.
   *
   * @zh 拉伸项或行以填满交叉轴空间。
   * @ja 交差軸の空き領域を満たすよう項目または行を伸ばします。
   * @ko 교차 축 공간을 채우도록 항목 또는 줄을 늘립니다.
   */
  Stretch = 5,
}

/**
 * The computed flex main axis direction.
 *
 * @zh 计算后的弹性主轴方向。
 * @ja 計算済みのフレックス主軸の方向。
 * @ko 계산된 플렉스 주축 방향입니다.
 */
export enum FlexDirection {
  /**
   * Use a horizontal main axis.
   *
   * @zh 使用水平主轴。
   * @ja 水平の主軸を使用します。
   * @ko 수평 주축을 사용합니다.
   */
  Row = 0,
  /**
   * Use a reversed horizontal main axis.
   *
   * @zh 使用反向水平主轴。
   * @ja 逆向きの水平主軸を使用します。
   * @ko 역방향 수평 주축을 사용합니다.
   */
  RowReverse = 1,
  /**
   * Use a vertical main axis.
   *
   * @zh 使用垂直主轴。
   * @ja 垂直の主軸を使用します。
   * @ko 수직 주축을 사용합니다.
   */
  Column = 2,
  /**
   * Use a reversed vertical main axis.
   *
   * @zh 使用反向垂直主轴。
   * @ja 逆向きの垂直主軸を使用します。
   * @ko 역방향 수직 주축을 사용합니다.
   */
  ColumnReverse = 3,
}

/**
 * The computed flex line wrapping.
 *
 * @zh 计算后的弹性换行方式。
 * @ja 計算済みのフレックスの折り返し。
 * @ko 계산된 플렉스 줄바꿈입니다.
 */
export enum FlexWrap {
  /**
   * Keep flex items on a single flex line.
   *
   * @zh 将弹性项保持在同一弹性行。
   * @ja フレックス項目を一行に保ちます。
   * @ko 플렉스 항목을 한 플렉스 줄에 유지합니다.
   */
  Nowrap = 0,
  /**
   * Allow multiple flex lines.
   *
   * @zh 允许弹性布局多行排列。
   * @ja フレックスを複数行に折り返します。
   * @ko 플렉스 여러 줄을 허용합니다.
   */
  Wrap = 1,
  /**
   * Wrap flex lines with the cross-axis order reversed.
   *
   * @zh 允许换行并反转交叉轴行序。
   * @ja 交差軸の順序を逆にして折り返します。
   * @ko 교차 축 순서를 반대로 하여 줄바꿈합니다.
   */
  WrapReverse = 2,
}

/**
 * The computed flex main axis alignment.
 *
 * @zh 计算后的弹性主轴对齐。
 * @ja 計算済みのフレックス主軸の配置。
 * @ko 계산된 플렉스 주축 정렬입니다.
 */
export enum JustifyContent {
  /**
   * Pack items at the start of the alignment axis.
   *
   * @zh 沿对齐轴起点排列。
   * @ja 配置軸の始点にまとめます。
   * @ko 정렬 축 시작에 모읍니다.
   */
  FlexStart = 0,
  /**
   * Pack items at the end of the alignment axis.
   *
   * @zh 沿对齐轴终点排列。
   * @ja 配置軸の終点にまとめます。
   * @ko 정렬 축 끝에 모읍니다.
   */
  FlexEnd = 1,
  /**
   * Align at the centre.
   *
   * @zh 居中对齐。
   * @ja 中央に配置します。
   * @ko 중앙에 정렬합니다.
   */
  Center = 2,
  /**
   * Distribute free space between items, with no space at the outer edges.
   *
   * @zh 将剩余空间分配到项之间，外侧不留空。
   * @ja 外端を空けず項目間に余白を配分します。
   * @ko 바깥 여백 없이 항목 사이에 남은 공간을 분배합니다.
   */
  SpaceBetween = 3,
  /**
   * Distribute space around items, with half-sized outer gaps.
   *
   * @zh 在项周围分配空间，外侧间距减半。
   * @ja 項目の周囲に余白を配分し外端は半分にします。
   * @ko 항목 주위에 공간을 분배하고 바깥 간격은 절반으로 합니다.
   */
  SpaceAround = 4,
  /**
   * Use equal gaps between items and at the outer edges.
   *
   * @zh 项之间及外侧使用等距间隔。
   * @ja 項目間と外端の間隔を均等にします。
   * @ko 항목 사이와 바깥 간격을 같게 합니다.
   */
  SpaceEvenly = 5,
}

/**
 * The computed directional keyboard navigation.
 *
 * @zh 计算后的方向键导航。
 * @ja 計算済みの方向キーによる移動。
 * @ko 계산된 방향키 탐색입니다.
 */
export enum Nav {
  /**
   * Disable this behavior.
   *
   * @zh 禁用该行为。
   * @ja この動作を無効にします。
   * @ko 이 동작을 비활성화합니다.
   */
  None = 0,
  /**
   * Let the engine choose the behavior from the element and its context.
   *
   * @zh 由引擎根据元素及上下文决定行为。
   * @ja 要素とコンテキストからエンジンが動作を選びます。
   * @ko 요소와 컨텍스트에 따라 엔진이 동작을 선택합니다.
   */
  Auto = 1,
  /**
   * Search for navigation targets horizontally.
   *
   * @zh 水平查找导航目标。
   * @ja 水平方向に移動先を探します。
   * @ko 수평으로 탐색 대상을 찾습니다.
   */
  Horizontal = 2,
  /**
   * Search for navigation targets vertically.
   *
   * @zh 垂直查找导航目标。
   * @ja 垂直方向に移動先を探します。
   * @ko 수직으로 탐색 대상을 찾습니다.
   */
  Vertical = 3,
  /**
   * Choose navigation targets in element tree order.
   *
   * @zh 按元素树顺序选择导航目标。
   * @ja 要素ツリーの順序で移動先を選びます。
   * @ko 요소 트리 순서로 탐색 대상을 선택합니다.
   */
  TreeOrder = 4,
}

/**
 * The computed text reading direction.
 *
 * @zh 计算后的文本阅读方向。
 * @ja 計算済みのテキストの読み方向。
 * @ko 계산된 텍스트 읽기 방향입니다.
 */
export enum Direction {
  /**
   * Let the engine choose the behavior from the element and its context.
   *
   * @zh 由引擎根据元素及上下文决定行为。
   * @ja 要素とコンテキストからエンジンが動作を選びます。
   * @ko 요소와 컨텍스트에 따라 엔진이 동작을 선택합니다.
   */
  Auto = 0,
  /**
   * Read text from left to right.
   *
   * @zh 从左向右阅读文本。
   * @ja テキストを左から右へ読みます。
   * @ko 텍스트를 왼쪽에서 오른쪽으로 읽습니다.
   */
  Ltr = 1,
  /**
   * Read text from right to left.
   *
   * @zh 从右向左阅读文本。
   * @ja テキストを右から左へ読みます。
   * @ko 텍스트를 오른쪽에서 왼쪽으로 읽습니다.
   */
  Rtl = 2,
}

/**
 * A length in pixels, a percentage, or automatic sizing.
 *
 * @zh 像素长度、百分比或自动尺寸。
 * @ja ピクセル長、百分率、または自動サイズ。
 * @ko 픽셀 길이, 백분율 또는 자동 크기입니다.
 */
export enum LengthPercentageAutoType {
  /**
   * Let the engine choose the behavior from the element and its context.
   *
   * @zh 由引擎根据元素及上下文决定行为。
   * @ja 要素とコンテキストからエンジンが動作を選びます。
   * @ko 요소와 컨텍스트에 따라 엔진이 동작을 선택합니다.
   */
  Auto = 0,
  /**
   * Interpret the numeric component as pixels.
   *
   * @zh 将数值分量解释为像素。
   * @ja 数値成分をピクセルとして解釈します。
   * @ko 수치 성분을 픽셀로 해석합니다.
   */
  Length = 1,
  /**
   * Interpret the numeric component as a percentage, with 100 meaning the full
   * reference size.
   *
   * @zh 将数值解释为百分比，100 表示完整基准尺寸。
   * @ja 数値を百分率として解釈し、100 は基準サイズ全体です。
   * @ko 숫자를 백분율로 해석하며 100은 전체 기준 크기입니다.
   */
  Percentage = 2,
}

/**
 * A length in pixels or a percentage of a reference size.
 *
 * @zh 像素长度或相对基准尺寸的百分比。
 * @ja ピクセル長または基準サイズに対する百分率。
 * @ko 픽셀 길이 또는 기준 크기에 대한 백분율입니다.
 */
export enum LengthPercentageType {
  /**
   * Interpret the numeric component as pixels.
   *
   * @zh 将数值分量解释为像素。
   * @ja 数値成分をピクセルとして解釈します。
   * @ko 수치 성분을 픽셀로 해석합니다.
   */
  Length = 0,
  /**
   * Interpret the numeric component as a percentage, with 100 meaning the full
   * reference size.
   *
   * @zh 将数值解释为百分比，100 表示完整基准尺寸。
   * @ja 数値を百分率として解釈し、100 は基準サイズ全体です。
   * @ko 숫자를 백분율로 해석하며 100은 전체 기준 크기입니다.
   */
  Percentage = 1,
}

/**
 * A numeric value or the automatic keyword, used for stacking order.
 *
 * @zh 数值或自动关键字，用于堆叠顺序。
 * @ja 重なり順に使用する数値または自動キーワード。
 * @ko 쌓임 순서에 사용하는 숫자 또는 자동 키워드입니다.
 */
export enum NumberAutoType {
  /**
   * Let the engine choose the behavior from the element and its context.
   *
   * @zh 由引擎根据元素及上下文决定行为。
   * @ja 要素とコンテキストからエンジンが動作を選びます。
   * @ko 요소와 컨텍스트에 따라 엔진이 동작을 선택합니다.
   */
  Auto = 0,
  /**
   * Interpret the numeric component as a unitless number.
   *
   * @zh 将数值分量解释为无单位数值。
   * @ja 数値成分を単位なしの数として解釈します。
   * @ko 수치 성분을 단위 없는 숫자로 해석합니다.
   */
  Number = 1,
}

/**
 * An inline vertical alignment keyword or pixel offset.
 *
 * @zh 行内垂直对齐关键字或像素偏移。
 * @ja インラインの垂直配置キーワードまたはピクセルオフセット。
 * @ko 인라인 수직 정렬 키워드 또는 픽셀 오프셋입니다.
 */
export enum VerticalAlignType {
  /**
   * Align text baselines.
   *
   * @zh 对齐文本基线。
   * @ja テキストのベースラインを揃えます。
   * @ko 텍스트 기준선을 맞춥니다.
   */
  Baseline = 0,
  /**
   * Align the box middle to the parent baseline plus half its x-height.
   *
   * @zh 将盒中点对齐父基线加半个 x 字高。
   * @ja ボックス中央を親のベースラインと x 高さの半分に合わせます。
   * @ko 상자 중앙을 부모 기준선에 x 높이의 절반을 더한 위치에 맞춥니다.
   */
  Middle = 1,
  /**
   * Lower the baseline for subscript.
   *
   * @zh 降低基线用于下标。
   * @ja 下付き文字用にベースラインを下げます。
   * @ko 아래 첨자를 위해 기준선을 내립니다.
   */
  Sub = 2,
  /**
   * Raise the baseline for superscript.
   *
   * @zh 抬高基线用于上标。
   * @ja 上付き文字用にベースラインを上げます。
   * @ko 위 첨자를 위해 기준선을 올립니다.
   */
  Super = 3,
  /**
   * Align to the top of the parent font.
   *
   * @zh 对齐父字体顶部。
   * @ja 親フォントの上端に合わせます。
   * @ko 부모 글꼴 위쪽에 맞춥니다.
   */
  TextTop = 4,
  /**
   * Align to the bottom of the parent font.
   *
   * @zh 对齐父字体底部。
   * @ja 親フォントの下端に合わせます。
   * @ko 부모 글꼴 아래쪽에 맞춥니다.
   */
  TextBottom = 5,
  /**
   * Use the top edge.
   *
   * @zh 使用上边缘。
   * @ja 上端を使用します。
   * @ko 위쪽 가장자리를 사용합니다.
   */
  Top = 6,
  /**
   * Align at the centre.
   *
   * @zh 居中对齐。
   * @ja 中央に配置します。
   * @ko 중앙에 정렬합니다.
   */
  Center = 7,
  /**
   * Use the bottom edge.
   *
   * @zh 使用下边缘。
   * @ja 下端を使用します。
   * @ko 아래쪽 가장자리를 사용합니다.
   */
  Bottom = 8,
  /**
   * Interpret the numeric component as pixels.
   *
   * @zh 将数值分量解释为像素。
   * @ja 数値成分をピクセルとして解釈します。
   * @ko 수치 성분을 픽셀로 해석합니다.
   */
  Length = 9,
}

/**
 * Computed line height in pixels together with its inherited number or length.
 *
 * @zh 计算后的像素行高及其继承数值或长度。
 * @ja 計算済みの行の高さ（px）と継承する数値または長さ。
 * @ko 계산된 줄 높이（px）와 상속할 숫자 또는 길이입니다.
 */
export enum LineHeightInheritType {
  /**
   * Interpret the numeric component as a unitless number.
   *
   * @zh 将数值分量解释为无单位数值。
   * @ja 数値成分を単位なしの数として解釈します。
   * @ko 수치 성분을 단위 없는 숫자로 해석합니다.
   */
  Number = 0,
  /**
   * Interpret the numeric component as pixels.
   *
   * @zh 将数值分量解释为像素。
   * @ja 数値成分をピクセルとして解釈します。
   * @ko 수치 성분을 픽셀로 해석합니다.
   */
  Length = 1,
}

/**
 * The computed ancestor clipping control.
 *
 * @zh 计算后的祖先裁剪控制。
 * @ja 計算済みの祖先によるクリッピング制御。
 * @ko 계산된 조상 클리핑 제어입니다.
 */
export enum ClipType {
  /**
   * Respect ancestor clipping regions.
   *
   * @zh 遵守祖先裁剪区域。
   * @ja 祖先のクリッピング領域に従います。
   * @ko 조상 클리핑 영역을 따릅니다.
   */
  Auto = 0,
  /**
   * Ignore ancestor clipping regions.
   *
   * @zh 忽略祖先裁剪区域。
   * @ja 祖先のクリッピング領域を無視します。
   * @ko 조상 클리핑 영역을 무시합니다.
   */
  None = 1,
  /**
   * Force clipping even when overflow is visible.
   *
   * @zh 即使溢出可见也强制裁剪。
   * @ja はみ出しが表示される場合もクリッピングを強制します。
   * @ko 넘침이 표시되어도 클리핑을 강제합니다.
   */
  Always = 2,
  /**
   * Ignore the specified number of ancestor clipping regions.
   *
   * @zh 忽略指定数量的祖先裁剪区域。
   * @ja 指定数の祖先クリッピング領域を無視します。
   * @ko 지정한 수의 조상 클리핑 영역을 무시합니다.
   */
  Number = 3,
}
