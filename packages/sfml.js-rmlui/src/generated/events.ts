// Generated from RmlUi 6.3 Core/ID.h by tools/codegen/generate-events.cjs.

/**
 * Rml::EventId constants. Custom ids are returned by registerEventType.
 *
 * @zh Rml::EventId 常量；自定义编号由 registerEventType 返回。
 * @ja Rml::EventId 定数。カスタム ID は registerEventType が返します。
 * @ko Rml::EventId 상수입니다. 사용자 정의 ID는 registerEventType이 반환합니다.
 */
export enum EventId {
  /**
   * Invalid identifier; does not name a registered entry.
   *
   * @zh 无效标识，不表示已注册条目。
   * @ja 無効な識別子。登録済み項目を表しません。
   * @ko 유효하지 않은 식별자이며 등록된 항목이 아닙니다.
   */
  Invalid = 0,
  /**
   * A pointer button is pressed.
   *
   * @zh 指针按键按下。
   * @ja ポインターボタンが押されました。
   * @ko 포인터 버튼을 누릅니다.
   */
  Mousedown = 1,
  /**
   * The pointer wheel scrolls.
   *
   * @zh 指针滚轮滚动。
   * @ja ポインターのホイールが回転しました。
   * @ko 포인터 휠을 스크롤합니다.
   */
  Mousescroll = 2,
  /**
   * The pointer enters the element.
   *
   * @zh 指针进入元素。
   * @ja ポインターが要素に入りました。
   * @ko 포인터가 요소에 들어옵니다.
   */
  Mouseover = 3,
  /**
   * The pointer leaves the element.
   *
   * @zh 指针离开元素。
   * @ja ポインターが要素から出ました。
   * @ko 포인터가 요소를 벗어납니다.
   */
  Mouseout = 4,
  /**
   * The element receives input focus.
   *
   * @zh 元素获得输入焦点。
   * @ja 要素が入力フォーカスを受け取りました。
   * @ko 요소가 입력 포커스를 받습니다.
   */
  Focus = 5,
  /**
   * The element loses input focus.
   *
   * @zh 元素失去输入焦点。
   * @ja 要素が入力フォーカスを失いました。
   * @ko 요소가 입력 포커스를 잃습니다.
   */
  Blur = 6,
  /**
   * A keyboard key is pressed.
   *
   * @zh 键盘按键按下。
   * @ja キーボードのキーが押されました。
   * @ko 키보드 키를 누릅니다.
   */
  Keydown = 7,
  /**
   * A keyboard key is released.
   *
   * @zh 键盘按键释放。
   * @ja キーボードのキーが離されました。
   * @ko 키보드 키를 놓습니다.
   */
  Keyup = 8,
  /**
   * Text is committed to the focused element.
   *
   * @zh 文本提交到焦点元素。
   * @ja フォーカス要素にテキストが入力されました。
   * @ko 포커스된 요소에 텍스트를 입력합니다.
   */
  Textinput = 9,
  /**
   * A pointer button is released.
   *
   * @zh 指针按键释放。
   * @ja ポインターボタンが離されました。
   * @ko 포인터 버튼을 놓습니다.
   */
  Mouseup = 10,
  /**
   * The element is activated by a click.
   *
   * @zh 元素被单击激活。
   * @ja クリックで要素が操作されました。
   * @ko 클릭으로 요소를 활성화합니다.
   */
  Click = 11,
  /**
   * The element receives a double click.
   *
   * @zh 元素收到双击。
   * @ja 要素がダブルクリックされました。
   * @ko 요소를 두 번 클릭합니다.
   */
  Dblclick = 12,
  /**
   * A document finishes loading.
   *
   * @zh 文档完成加载。
   * @ja 文書の読み込みが完了しました。
   * @ko 문서 로딩을 완료합니다.
   */
  Load = 13,
  /**
   * A document is unloaded.
   *
   * @zh 文档被卸载。
   * @ja 文書がアンロードされました。
   * @ko 문서를 언로드합니다.
   */
  Unload = 14,
  /**
   * A document becomes visible.
   *
   * @zh 文档变为可见。
   * @ja 文書が表示されました。
   * @ko 문서가 표시됩니다.
   */
  Show = 15,
  /**
   * A document becomes hidden.
   *
   * @zh 文档变为隐藏。
   * @ja 文書が非表示になりました。
   * @ko 문서가 숨겨집니다.
   */
  Hide = 16,
  /**
   * The pointer moves over the element.
   *
   * @zh 指针在元素上移动。
   * @ja ポインターが要素上を移動しました。
   * @ko 포인터가 요소 위에서 이동합니다.
   */
  Mousemove = 17,
  /**
   * The dragged element moves.
   *
   * @zh 拖动中的元素移动。
   * @ja ドラッグ中の要素が移動しました。
   * @ko 드래그 중인 요소가 이동합니다.
   */
  Dragmove = 18,
  /**
   * The element is being dragged.
   *
   * @zh 元素正在被拖动。
   * @ja 要素がドラッグされています。
   * @ko 요소를 드래그 중입니다.
   */
  Drag = 19,
  /**
   * An element drag begins.
   *
   * @zh 元素拖动开始。
   * @ja 要素のドラッグが開始しました。
   * @ko 요소 드래그를 시작합니다.
   */
  Dragstart = 20,
  /**
   * A dragged element enters a drop target.
   *
   * @zh 拖动元素进入放置目标。
   * @ja ドラッグ要素がドロップ対象に入りました。
   * @ko 드래그 요소가 드롭 대상에 들어옵니다.
   */
  Dragover = 21,
  /**
   * A dragged element is dropped on a target.
   *
   * @zh 拖动元素被放到目标上。
   * @ja ドラッグ要素が対象にドロップされました。
   * @ko 드래그 요소를 대상에 놓습니다.
   */
  Dragdrop = 22,
  /**
   * A dragged element leaves a drop target.
   *
   * @zh 拖动元素离开放置目标。
   * @ja ドラッグ要素がドロップ対象から出ました。
   * @ko 드래그 요소가 드롭 대상을 벗어납니다.
   */
  Dragout = 23,
  /**
   * An element drag ends.
   *
   * @zh 元素拖动结束。
   * @ja 要素のドラッグが終了しました。
   * @ko 요소 드래그를 끝냅니다.
   */
  Dragend = 24,
  /**
   * A handle control reports a drag.
   *
   * @zh 拖动手柄控件报告拖动。
   * @ja ハンドルコントロールがドラッグを通知します。
   * @ko 핸들 컨트롤이 드래그를 알립니다.
   */
  Handledrag = 25,
  /**
   * The document dimensions change.
   *
   * @zh 文档尺寸改变。
   * @ja 文書のサイズが変わりました。
   * @ko 문서 크기가 변경됩니다.
   */
  Resize = 26,
  /**
   * An element scroll offset changes.
   *
   * @zh 元素滚动偏移改变。
   * @ja 要素のスクロール位置が変わりました。
   * @ko 요소 스크롤 위치가 변경됩니다.
   */
  Scroll = 27,
  /**
   * A keyframe animation finishes.
   *
   * @zh 关键帧动画结束。
   * @ja キーフレームアニメーションが終了しました。
   * @ko 키프레임 애니메이션을 완료합니다.
   */
  Animationend = 28,
  /**
   * A property transition finishes.
   *
   * @zh 属性过渡结束。
   * @ja プロパティ遷移が終了しました。
   * @ko 속성 전환을 완료합니다.
   */
  Transitionend = 29,
  /**
   * A form control value changes.
   *
   * @zh 表单控件值改变。
   * @ja フォームコントロールの値が変わりました。
   * @ko 폼 컨트롤 값이 변경됩니다.
   */
  Change = 30,
  /**
   * A form is submitted.
   *
   * @zh 表单被提交。
   * @ja フォームが送信されました。
   * @ko 폼을 제출합니다.
   */
  Submit = 31,
  /**
   * The selected tab changes.
   *
   * @zh 选中的标签页改变。
   * @ja 選択タブが変わりました。
   * @ko 선택한 탭이 변경됩니다.
   */
  Tabchange = 32,
  /**
   * Boundary after the built-in identifiers; not an actual entry.
   *
   * @zh 内置标识之后的边界，不是实际条目。
   * @ja 組み込み識別子の末尾の境界。実際の項目ではありません。
   * @ko 내장 식별자 뒤 경계이며 실제 항목이 아닙니다.
   */
  NumDefinedIds = 33,
  /**
   * First identifier available for custom registration.
   *
   * @zh 可用于自定义注册的首个标识。
   * @ja 独自登録に使用できる最初の識別子。
   * @ko 사용자 정의 등록에 사용할 첫 식별자입니다.
   */
  FirstCustomId = NumDefinedIds,
  /**
   * Exclusive identifier limit (65535); not a registered entry.
   *
   * @zh 标识上限（65535，不含），不是已注册条目。
   * @ja 識別子の上限（65535、含まない）。登録済み項目ではありません。
   * @ko 식별자 상한（65535, 미포함）이며 등록된 항목이 아닙니다.
   */
  MaxNumIds = 65535,
}
