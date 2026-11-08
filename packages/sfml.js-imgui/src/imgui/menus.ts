import { native } from '../internal/native';

/**
 * Begin appending to the current window menu bar.
 *
 * @zh 开始向当前窗口菜单栏追加内容。
 * @ja 現在のウィンドウのメニューバーへの追加を開始します。
 * @ko 현재 창 메뉴 모음에 내용을 추가하기 시작합니다.
 *
 * @remarks
 * - Use BeginMenuBar() on a window ImGuiWindowFlags.MenuBar to append to its
 *   menu bar.
 *
 * - Use BeginMainMenuBar() to create a menu bar at the top of the screen and
 *   append to it.
 *
 * - Use BeginMenu() to create a menu. You can call BeginMenu() multiple time
 *   with the same identifier to append more items to it.
 *
 * - Not that MenuItem() keyboardshortcuts are displayed as a convenience but
 *   _not processed_ by Dear ImGui at the moment.
 *
 * append to menu-bar of current window (requires ImGuiWindowFlags.MenuBar flag
 * set on parent window).
 * @zh
 * 控件：菜单。
 *
 * - 在带 ImGuiWindowFlags.MenuBar 的窗口上使用 BeginMenuBar()，向其菜单栏追加内容。
 *
 * - 使用 BeginMainMenuBar() 在屏幕顶部创建菜单栏并追加内容。
 *
 * - 使用 BeginMenu() 创建菜单；可使用相同标识符多次调用 BeginMenu()，向其追加更多项目。
 *
 * - 注意：MenuItem() 的键盘快捷键仅为方便而显示，Dear ImGui 目前不会处理它们。向当前窗口的菜单栏追加内容（要求父窗口设置
 *   ImGuiWindowFlags.MenuBar 标志）。
 * @ja
 * ウィジェット：メニュー。
 *
 * - ImGuiWindowFlags.MenuBar 付きのウィンドウで BeginMenuBar() を使い、そのメニューバーに追加します。
 *
 * - BeginMainMenuBar() で画面上部にメニューバーを作成して追加します。
 *
 * - BeginMenu() でメニューを作ります。同じ識別子で複数回呼ぶと項目を追加できます。
 *
 * - MenuItem() のキーボードショートカットは便宜上表示されるだけで、現時点では Dear ImGui
 *   は処理しません。現在のウィンドウのメニューバーに追加します（親ウィンドウに ImGuiWindowFlags.MenuBar が必要です）。
 * @ko
 * 위젯: 메뉴.
 *
 * - ImGuiWindowFlags.MenuBar가 지정된 창에서 BeginMenuBar()를 사용하여 메뉴 표시줄에 추가합니다.
 *
 * - BeginMainMenuBar()로 화면 상단에 메뉴 표시줄을 만들고 내용을 추가합니다.
 *
 * - BeginMenu()로 메뉴를 만듭니다. 같은 식별자로 여러 번 호출하여 항목을 더 추가할 수 있습니다.
 *
 * - MenuItem()의 키보드 단축키는 편의를 위해 표시될 뿐 현재 Dear ImGui가 처리하지 않습니다. 현재 창의 메뉴 표시줄에
 *   추가합니다(부모 창에 ImGuiWindowFlags.MenuBar 플래그가 필요합니다).
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndMenuBar() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndMenuBar()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndMenuBar() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndMenuBar()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginMenuBar(): boolean {
  return native.BeginMenuBar();
}

/**
 * End the current window menu bar.
 *
 * @zh 结束当前窗口菜单栏。
 * @ja 現在のウィンドウのメニューバーを終了します。
 * @ko 현재 창 메뉴 모음을 종료합니다.
 *
 * @remarks
 * only call EndMenuBar() if BeginMenuBar() returns true!
 * @zh
 * 仅在 BeginMenuBar() 返回 true 时调用 EndMenuBar()！
 * @ja
 * BeginMenuBar() が true を返した場合のみ EndMenuBar() を呼んでください！
 * @ko
 * BeginMenuBar()가 true를 반환한 경우에만 EndMenuBar()를 호출하세요!
 */
export function EndMenuBar(): void {
  native.EndMenuBar();
}

/**
 * Begin the menu bar at the top of the screen.
 *
 * @zh 开始屏幕顶部的菜单栏。
 * @ja 画面上部のメニューバーを開始します。
 * @ko 화면 위쪽 메뉴 모음을 시작합니다.
 *
 * @remarks
 * create and append to a full screen menu-bar.
 * @zh
 * 创建全屏宽度的菜单栏并向其追加内容。
 * @ja
 * 画面全幅のメニューバーを作成し、内容を追加します。
 * @ko
 * 화면 전체 너비의 메뉴 표시줄을 만들고 내용을 추가합니다.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndMainMenuBar() only when true; on false, skip both contents
 * and the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndMainMenuBar()；为 false
 * 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndMainMenuBar() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndMainMenuBar()를 호출하며
 * false이면 내용과 종료 호출을 생략합니다.
 */
export function BeginMainMenuBar(): boolean {
  return native.BeginMainMenuBar();
}

/**
 * End the main menu bar.
 *
 * @zh 结束主菜单栏。
 * @ja メインメニューバーを終了します。
 * @ko 주 메뉴 모음을 종료합니다.
 *
 * @remarks
 * only call EndMainMenuBar() if BeginMainMenuBar() returns true!
 * @zh
 * 仅在 BeginMainMenuBar() 返回 true 时调用 EndMainMenuBar()！
 * @ja
 * BeginMainMenuBar() が true を返した場合のみ EndMainMenuBar() を呼んでください！
 * @ko
 * BeginMainMenuBar()가 true를 반환한 경우에만 EndMainMenuBar()를 호출하세요!
 */
export function EndMainMenuBar(): void {
  native.EndMainMenuBar();
}

/**
 * Display an enabled submenu entry and begin its contents when open.
 *
 * @zh 显示启用的子菜单入口，并在展开时开始添加其内容。
 * @ja 有効なサブメニュー項目を表示し、開いていれば内容の追加を開始します。
 * @ko 활성화된 하위 메뉴 항목을 표시하고 열려 있으면 내용 추가를 시작합니다.
 *
 * @remarks
 * create a sub-menu entry.
 *
 * only call EndMenu() if this returns true!
 *
 * Implied enabled = true
 * @zh
 * 创建子菜单入口。
 *
 * 仅在此函数返回 true 时调用 EndMenu()！
 *
 * 隐含参数：enabled = true。
 * @ja
 * サブメニュー項目を作成します。
 *
 * これが true を返した場合のみ EndMenu() を呼んでください！
 *
 * 暗黙の引数：enabled = true。
 * @ko
 * 하위 메뉴 항목을 만듭니다.
 *
 * 이 함수가 true를 반환한 경우에만 EndMenu()를 호출하세요!
 *
 * 암묵적 인수: enabled = true.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndMenu() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndMenu()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndMenu() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndMenu()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginMenu(label: string | Uint8Array): boolean {
  return native.BeginMenu(label);
}

/**
 * Display a submenu entry and begin its contents when open.
 *
 * @zh 显示子菜单项，并在打开时开始其内容区域。
 * @ja サブメニュー項目を表示し、開いていれば内容を開始します。
 * @ko 하위 메뉴 항목을 표시하고 열려 있으면 콘텐츠를 시작합니다.
 *
 * @remarks
 * create a sub-menu entry.
 *
 * only call EndMenu() if this returns true!
 * @zh
 * 创建子菜单入口。
 *
 * 仅在此函数返回 true 时调用 EndMenu()！
 * @ja
 * サブメニュー項目を作成します。
 *
 * これが true を返した場合のみ EndMenu() を呼んでください！
 * @ko
 * 하위 메뉴 항목을 만듭니다.
 *
 * 이 함수가 true를 반환한 경우에만 EndMenu()를 호출하세요!
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param enabled - Whether the item or pushed option is enabled.
 * @zh enabled - 是否启用此项或压栈选项。
 * @ja enabled - 項目またはプッシュするオプションを有効にするかどうかです。
 * @ko enabled - 항목 또는 푸시하는 옵션의 활성화 여부입니다.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndMenu() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndMenu()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndMenu() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndMenu()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginMenuEx(
  label: string | Uint8Array,
  enabled: boolean = true,
): boolean {
  return native.BeginMenuEx(label, enabled);
}

/**
 * End the current menu.
 *
 * @zh 结束当前菜单。
 * @ja 現在のメニューを終了します。
 * @ko 현재 메뉴를 종료합니다.
 *
 * @remarks
 * only call EndMenu() if BeginMenu() returns true!
 * @zh
 * 仅在 BeginMenu() 返回 true 时调用 EndMenu()！
 * @ja
 * BeginMenu() が true を返した場合のみ EndMenu() を呼んでください！
 * @ko
 * BeginMenu()가 true를 반환한 경우에만 EndMenu()를 호출하세요!
 */
export function EndMenu(): void {
  native.EndMenu();
}

/**
 * Display an enabled, unchecked menu action.
 *
 * @zh 显示启用且未勾选的菜单操作项。
 * @ja 有効でチェックの付いていないメニュー操作項目を表示します。
 * @ko 활성화되어 있고 체크되지 않은 메뉴 작업 항목을 표시합니다.
 *
 * @remarks
 * return true when activated.
 *
 * Implied shortcut = null, selected = false, enabled = true
 * @zh
 * 激活时返回 true。
 *
 * 隐含参数：shortcut = null, selected = false, enabled = true。
 * @ja
 * アクティブ化されると true を返します。
 *
 * 暗黙の引数：shortcut = null, selected = false, enabled = true。
 * @ko
 * 활성화하면 true를 반환합니다.
 *
 * 암묵적 인수: shortcut = null, selected = false, enabled = true.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function MenuItem(label: string | Uint8Array): boolean {
  return native.MenuItem(label);
}

/**
 * Display a menu item and report whether it was activated.
 *
 * @zh 显示菜单项并报告是否被激活。
 * @ja メニュー項目を表示し、選ばれたかを返します。
 * @ko 메뉴 항목을 표시하고 활성화되었는지 반환합니다.
 *
 * @remarks
 * return true when activated.
 * @zh
 * 激活时返回 true。
 * @ja
 * アクティブ化されると true を返します。
 * @ko
 * 활성화하면 true를 반환합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param shortcut - Shortcut label displayed in the menu; this text does not
 * register a key binding.
 * @zh shortcut - 菜单中显示的快捷键标签；此文字不会注册按键绑定。
 * @ja shortcut - メニューに表示するショートカット名です。この文字列だけではキーを登録しません。
 * @ko shortcut - 메뉴에 표시하는 단축키 레이블입니다. 이 텍스트는 키 바인딩을 등록하지 않습니다.
 *
 * @param selected - Whether the item is currently selected; this by-value state
 * is not written back.
 * @zh selected - 此项当前是否选中；按值传入，不会回写。
 * @ja selected - 項目が現在選択されているかです。値渡しなので書き戻されません。
 * @ko selected - 항목의 현재 선택 여부입니다. 값으로 전달되므로 다시 쓰지 않습니다.
 *
 * @param enabled - Whether the item or pushed option is enabled.
 * @zh enabled - 是否启用此项或压栈选项。
 * @ja enabled - 項目またはプッシュするオプションを有効にするかどうかです。
 * @ko enabled - 항목 또는 푸시하는 옵션의 활성화 여부입니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function MenuItemEx(
  label: string | Uint8Array,
  shortcut: string | Uint8Array | null = null,
  selected: boolean = false,
  enabled: boolean = true,
): boolean {
  return native.MenuItemEx(label, shortcut, selected, enabled);
}

/**
 * Display a menu item that toggles its checked state.
 *
 * @zh 显示可切换勾选状态的菜单项。
 * @ja チェック状態を切り替えるメニュー項目を表示します。
 * @ko 체크 상태를 전환하는 메뉴 항목을 표시합니다.
 *
 * @remarks
 * Returns `true` when activated. If `p_selected` is supplied as a `Uint8Array`,
 * activation toggles its first element between `0` and `1`.
 * @zh
 * 激活时返回 `true`。若以 `Uint8Array` 传入 `p_selected`，激活时会在 `0` 和 `1` 之间切换首个元素。
 * @ja
 * 選ばれると `true` を返します。`p_selected` に `Uint8Array` を渡した場合、先頭要素を `0` と `1`
 * の間で切り替えます。
 * @ko
 * 활성화되면 `true`를 반환합니다. `p_selected`를 `Uint8Array`로 전달하면 활성화 시 첫 요소를 `0`과 `1`
 * 사이에서 전환합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param shortcut - Shortcut label displayed in the menu; this text does not
 * register a key binding.
 * @zh shortcut - 菜单中显示的快捷键标签；此文字不会注册按键绑定。
 * @ja shortcut - メニューに表示するショートカット名です。この文字列だけではキーを登録しません。
 * @ko shortcut - 메뉴에 표시하는 단축키 레이블입니다. 이 텍스트는 키 바인딩을 등록하지 않습니다.
 *
 * @param p_selected - Selection state in Uint8Array[0]. Write only 0 (false)
 * or 1 (true); activation can toggle it in place. Native code accesses the
 * supplied writable backing memory directly, not a JS scalar.
 * @zh p_selected - Uint8Array[0] 中的选中状态，只能写入 0（false）或 1（true）。
 * 激活可原地切换；原生代码直接访问此可写内存，不接受 JS 标量。
 * @ja p_selected - Uint8Array[0] の選択状態です。0（false）か 1（true）のみを書き込みます。
 * 操作でその場で切り替わります。JS スカラーではなく、渡されたメモリを直接使います。
 * @ko p_selected - Uint8Array[0]의 선택 상태이며 0(false) 또는 1(true)만 쓰세요.
 * 활성화 시 직접 전환될 수 있습니다. JS 스칼라 대신 제공된 쓰기 가능한 메모리를 직접 사용합니다.
 *
 * @param enabled - Whether the item or pushed option is enabled.
 * @zh enabled - 是否启用此项或压栈选项。
 * @ja enabled - 項目またはプッシュするオプションを有効にするかどうかです。
 * @ko enabled - 항목 또는 푸시하는 옵션의 활성화 여부입니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function MenuItemBoolPtr(
  label: string | Uint8Array,
  shortcut: string | Uint8Array,
  p_selected: Uint8Array,
  enabled: boolean = true,
): boolean {
  return native.MenuItemBoolPtr(label, shortcut, p_selected, enabled);
}
