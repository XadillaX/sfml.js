import { native } from '../internal/native';

/**
 * Begin a tab bar.
 *
 * @zh 开始标签栏。
 * @ja タブバーを開始します。
 * @ko 탭 모음을 시작합니다.
 *
 * @remarks
 * - Note: Tabs are automatically created by the docking system (when in
 *   'docking' branch). Use this to create tab bars/tabs yourself.
 *
 * create and append into a TabBar
 * @zh
 * 标签栏、标签页。
 *
 * - 注意：停靠系统会自动创建标签页（在 'docking' 分支中）。此 API 用于自行创建标签栏/标签页。创建 TabBar 并向其中追加内容。
 * @ja
 * タブバーとタブ。
 *
 * - 注意：'docking' ブランチではドッキングシステムがタブを自動生成します。これはタブバー/タブを自分で作るために使用します。TabBar
 *   を作成し、その中に内容を追加します。
 * @ko
 * 탭 바와 탭.
 *
 * - 참고: 'docking' 브랜치에서는 도킹 시스템이 자동으로 탭을 만듭니다. 이 API로 탭 바/탭을 직접 만들 수 있습니다.
 *   TabBar를 생성하고 그 안에 내용을 추가합니다.
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param flags - ImGuiTabBarFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiTabBarFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiTabBarFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiTabBarFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndTabBar() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndTabBar()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndTabBar() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndTabBar()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginTabBar(
  str_id: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.BeginTabBar(str_id, flags);
}

/**
 * End the current tab bar.
 *
 * @zh 结束当前标签栏。
 * @ja 現在のタブバーを終了します。
 * @ko 현재 탭 모음을 종료합니다.
 *
 * @remarks
 * only call EndTabBar() if BeginTabBar() returns true!
 * @zh
 * 仅在 BeginTabBar() 返回 true 时调用 EndTabBar()！
 * @ja
 * BeginTabBar() が true を返した場合にのみ EndTabBar() を呼んでください！
 * @ko
 * BeginTabBar()가 true를 반환했을 때만 EndTabBar()를 호출하세요!
 */
export function EndTabBar(): void {
  native.EndTabBar();
}

/**
 * Begin a tab item and report whether it is selected.
 *
 * @zh 开始标签项并报告是否被选中。
 * @ja タブ項目を開始し、選択されているかを返します。
 * @ko 탭 항목을 시작하고 선택되어 있는지 반환합니다.
 *
 * @remarks
 * create a Tab.
 *
 * Returns true if the Tab is selected.
 * @zh
 * 创建标签页。
 *
 * 标签页被选中时返回 true。
 * @ja
 * タブを作成します。
 *
 * タブが選択されている場合は true を返します。
 * @ko
 * 탭을 만듭니다.
 *
 * 탭이 선택되어 있으면 true를 반환합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param p_open - Optional open state in Uint8Array[0]. Write only 0 (closed)
 * or 1 (open); the close button writes 0. Null omits the close button.
 * The native call accesses this writable backing memory directly.
 * @zh p_open - Uint8Array[0] 中的可选打开状态，只能写入 0（关闭）或 1（打开）。
 * 关闭按钮写入 0；null 不显示关闭按钮。原生调用直接访问此可写内存。
 * @ja p_open - Uint8Array[0] の開閉状態です。0（閉）か 1（開）のみを書き込みます。
 * 閉じるボタンは 0 を書き込み、null ではボタンを省略します。ネイティブ処理はこのメモリを直接使います。
 * @ko p_open - Uint8Array[0]의 선택적 열림 상태입니다. 0(닫힘) 또는 1(열림)만 쓰세요.
 * 닫기 버튼은 0을 쓰며 null이면 버튼을 생략합니다. 네이티브 호출은 이 쓰기 가능한 메모리에 직접 접근합니다.
 *
 * @param flags - ImGuiTabItemFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiTabItemFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiTabItemFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiTabItemFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when the tab is selected and its contents should be submitted,
 * not merely when the tab exists. Call EndTabItem() only when true.
 * @zh 标签页被选中且应提交内容时为 true，不只是表示标签存在。仅为 true 时调用 EndTabItem()。
 * @ja タブが存在するだけでなく選択され、内容を描く場合は true です。true の場合だけ EndTabItem() を呼びます。
 * @ko 단순히 탭이 존재하는 것이 아니라 선택되어 내용을 제출해야 하면 true입니다. true일 때만 EndTabItem()을
 * 호출합니다.
 */
export function BeginTabItem(
  label: string | Uint8Array,
  p_open: Uint8Array | null = null,
  flags: number = 0,
): boolean {
  return native.BeginTabItem(label, p_open, flags);
}

/**
 * End the current tab item.
 *
 * @zh 结束当前标签项。
 * @ja 現在のタブ項目を終了します。
 * @ko 현재 탭 항목을 종료합니다.
 *
 * @remarks
 * only call EndTabItem() if BeginTabItem() returns true!
 * @zh
 * 仅在 BeginTabItem() 返回 true 时调用 EndTabItem()！
 * @ja
 * BeginTabItem() が true を返した場合にのみ EndTabItem() を呼んでください！
 * @ko
 * BeginTabItem()이 true를 반환했을 때만 EndTabItem()을 호출하세요!
 */
export function EndTabItem(): void {
  native.EndTabItem();
}

/**
 * Display a tab-shaped button.
 *
 * @zh 显示标签形状的按钮。
 * @ja タブ形状のボタンを表示します。
 * @ko 탭 모양 버튼을 표시합니다.
 *
 * @remarks
 * create a Tab behaving like a button.
 *
 * return true when clicked.
 *
 * cannot be selected in the tab bar.
 * @zh
 * 创建行为类似按钮的标签页。
 *
 * 点击时返回 true。
 *
 * 无法在标签栏中被选中。
 * @ja
 * ボタンとして動作するタブを作成します。
 *
 * クリック時に true を返します。
 *
 * タブバー内で選択することはできません。
 * @ko
 * 버튼처럼 동작하는 탭을 만듭니다.
 *
 * 클릭하면 true를 반환합니다.
 *
 * 탭 바에서 선택할 수는 없습니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param flags - ImGuiTabItemFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiTabItemFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiTabItemFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiTabItemFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function TabItemButton(
  label: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.TabItemButton(label, flags);
}

/**
 * Notify the tab bar or docking system that a tab was closed.
 *
 * @zh 通知标签栏或停靠系统某个标签已关闭。
 * @ja タブが閉じたことをタブバーまたはドッキングシステムに通知します。
 * @ko 탭이 닫혔음을 탭 모음이나 도킹 시스템에 알립니다.
 *
 * @remarks
 * notify TabBar or Docking system of a closed tab/window ahead (useful to
 * reduce visual flicker on reorderable tab bars).
 *
 * For tab-bar: call after BeginTabBar() and before Tab submissions.
 *
 * Otherwise call with a window name.
 * @zh
 * 提前通知 TabBar 或停靠系统某个标签页/窗口已关闭（有助于减少可重排标签栏的视觉闪烁）。
 *
 * 对于标签栏：在 BeginTabBar() 之后、提交标签页之前调用。
 *
 * 其他情况则传入窗口名称调用。
 * @ja
 * 閉じたタブ/ウィンドウを TabBar またはドッキングシステムに事前通知します（並べ替え可能なタブバーのちらつき軽減に有用）。
 *
 * タブバーの場合は BeginTabBar() の後、タブを送信する前に呼びます。
 *
 * それ以外はウィンドウ名を指定して呼びます。
 * @ko
 * 닫힌 탭/창을 TabBar 또는 도킹 시스템에 미리 알립니다(순서 변경 가능한 탭 바의 시각적 깜박임을 줄이는 데 유용).
 *
 * 탭 바에서는 BeginTabBar() 이후 탭 제출 전에 호출합니다.
 *
 * 그 외에는 창 이름을 전달하여 호출합니다.
 *
 * @param tab_or_docked_window_label - Label identifying the tab being closed,
 * submitted before the tab bar or its remaining tabs.
 * @zh tab_or_docked_window_label - 标识被关闭标签页的标签，在标签栏或剩余标签提交之前传入。
 * @ja tab_or_docked_window_label - 閉じるタブのラベルです。タブバーまたは残るタブの前に通知します。
 * @ko tab_or_docked_window_label - 닫을 탭을 식별하는 레이블이며 탭 표시줄 또는 나머지 탭보다 먼저 전달합니다.
 */
export function SetTabItemClosed(
  tab_or_docked_window_label: string | Uint8Array,
): void {
  native.SetTabItemClosed(tab_or_docked_window_label);
}
