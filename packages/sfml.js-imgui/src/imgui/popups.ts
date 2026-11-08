import { native } from '../internal/native';

/**
 * Begin appending to an open popup.
 *
 * @zh 开始向已打开的弹出窗口追加内容。
 * @ja 開いているポップアップへの追加を開始します。
 * @ko 열린 팝업에 내용을 추가하기 시작합니다.
 *
 * @remarks
 * - They block normal mouse hovering detection (and therefore most mouse
 *   interactions) behind them.
 *
 * - If not modal: they can be closed by clicking anywhere outside them, or by
 *   pressing ESCAPE.
 *
 * - Their visibility state (~bool) is held internally instead of being held by
 *   the programmer as we are used to with regular Begin*() calls.
 *
 * - The 3 properties above are related: we need to retain popup visibility
 *   state in the library because popups may be closed as any time.
 *
 * - You can bypass the hovering restriction by using
 *   ImGuiHoveredFlags.AllowWhenBlockedByPopup when calling IsItemHovered() or
 *   IsWindowHovered().
 *
 * - IMPORTANT: Popup identifiers are relative to the current ID stack, so
 *   OpenPopup and BeginPopup generally needs to be at the same level of the
 *   stack. This is sometimes leading to confusing mistakes. May rework this in
 *   the future.
 *
 * - BeginPopup(): query popup state, if open start appending into the window.
 *   Call EndPopup() afterwards if returned true. ImGuiWindowFlags are forwarded
 *   to the window.
 *
 * - BeginPopupModal(): block every interaction behind the window, cannot be
 *   closed by user, add a dimming background, has a title bar.
 *
 * return true if the popup is open, and you can start outputting to it.
 * @zh
 * 弹出窗口与模态窗口：
 *
 * - 会阻止其后方正常的鼠标悬停检测（因而阻止大多数鼠标交互）。
 *
 * - 非模态窗口可通过点击外部任意位置或按 ESCAPE 关闭。
 *
 * - 可见性状态（约等于 bool）保存在内部，而不是像常规 Begin*() 调用那样由程序员保存。
 *
 * - 上述三个特性相关：弹出窗口可能随时关闭，因此库需要保存其可见性状态。
 *
 * - 调用 IsItemHovered() 或 IsWindowHovered() 时使用
 *   ImGuiHoveredFlags.AllowWhenBlockedByPopup 可绕过悬停限制。
 *
 * - 重要：弹出窗口标识符相对于当前 ID 栈，因此 OpenPopup 和 BeginPopup
 *   通常必须位于栈的同一层级。这有时会导致令人困惑的错误，未来可能重新设计。
 *
 * - BeginPopup()：查询弹出窗口状态；若已打开，则开始向窗口追加内容。返回 true 后必须调用
 *   EndPopup()。ImGuiWindowFlags 会传给窗口。
 *
 * - BeginPopupModal()：阻止窗口后方的一切交互，用户不能直接关闭它，添加变暗背景并带有标题栏。弹出窗口打开时返回
 *   true，此时可开始向其输出内容。
 * @ja
 * ポップアップとモーダル：
 *
 * - 背後の通常のマウスホバー検出（したがって大半のマウス操作）を遮断します。
 *
 * - 非モーダルなら外側の任意の場所のクリックや ESCAPE で閉じられます。
 *
 * - 可視状態（ほぼ bool）は通常の Begin*() のようにプログラマーではなく内部が保持します。
 *
 * - 以上の 3 特性は関連しています。ポップアップはいつでも閉じられるため、ライブラリが可視状態を保持する必要があります。
 *
 * - IsItemHovered() や IsWindowHovered() に
 *   ImGuiHoveredFlags.AllowWhenBlockedByPopup を指定するとホバー制限を回避できます。
 *
 * - 重要：ポップアップ識別子は現在の ID スタックに相対的なので、OpenPopup と BeginPopup
 *   は通常スタックの同じ階層に置く必要があります。混乱するミスにつながることがあり、将来見直す可能性があります。
 *
 * - BeginPopup()：状態を照会し、開いていれば内容の追加を開始します。true を返したら後で EndPopup()
 *   を呼びます。ImGuiWindowFlags はウィンドウに転送されます。
 *
 * -
 *   BeginPopupModal()：背後のすべての操作を遮断し、ユーザーが直接閉じることはできず、暗い背景を追加し、タイトルバーを持ちます。
 *   ポップアップが開いていれば true を返し、出力を開始できます。
 * @ko
 * 팝업과 모달:
 *
 * - 뒤쪽의 일반적인 마우스 호버 감지(따라서 대부분의 마우스 상호작용)를 차단합니다.
 *
 * - 모달이 아니면 바깥 아무 곳이나 클릭하거나 ESCAPE를 눌러 닫을 수 있습니다.
 *
 * - 표시 상태(대략 bool)는 일반 Begin*() 호출처럼 프로그래머가 아니라 내부에서 유지합니다.
 *
 * - 위 세 속성은 연관되어 있습니다. 팝업은 언제든 닫힐 수 있으므로 라이브러리가 표시 상태를 유지해야 합니다.
 *
 * - IsItemHovered()나 IsWindowHovered() 호출에
 *   ImGuiHoveredFlags.AllowWhenBlockedByPopup을 사용하면 호버 제한을 우회할 수 있습니다.
 *
 * - 중요: 팝업 식별자는 현재 ID 스택에 상대적이므로 OpenPopup과 BeginPopup은 일반적으로 같은 스택 수준에 있어야
 *   합니다. 이 때문에 혼란스러운 실수가 생기기도 하며 향후 재설계할 수 있습니다.
 *
 * - BeginPopup(): 팝업 상태를 조회하고 열려 있으면 창에 내용 추가를 시작합니다. true를 반환했다면 이후
 *   EndPopup()을 호출하세요. ImGuiWindowFlags는 창에 전달됩니다.
 *
 * - BeginPopupModal(): 창 뒤의 모든 상호작용을 차단하며 사용자가 직접 닫을 수 없고, 어두운 배경을 추가하며 제목 표시줄이
 *   있습니다. 팝업이 열려 있으면 true를 반환하며 출력을 시작할 수 있습니다.
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param flags - ImGuiWindowFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiWindowFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiWindowFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiWindowFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndPopup() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndPopup()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndPopup() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndPopup()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginPopup(
  str_id: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.BeginPopup(str_id, flags);
}

/**
 * Begin appending to an open modal popup.
 *
 * @zh 开始向已打开的模态弹出窗口追加内容。
 * @ja 開いているモーダルポップアップへの追加を開始します。
 * @ko 열린 모달 팝업에 내용을 추가하기 시작합니다.
 *
 * @remarks
 * return true if the modal is open, and you can start outputting to it.
 * @zh
 * 模态窗口打开时返回 true，此时可开始向其输出内容。
 * @ja
 * モーダルが開いていれば true を返し、出力を開始できます。
 * @ko
 * 모달이 열려 있으면 true를 반환하며 출력을 시작할 수 있습니다.
 *
 * @param name - Window name used as its persistent ID and displayed title; ###
 * can separate the title from the ID.
 * @zh name - 窗口名称，用于持久 ID 和标题显示；可用 ### 将标题与 ID 分离。
 * @ja name - 永続 ID と表示タイトルに使うウィンドウ名です。### でタイトルと ID を分離できます。
 * @ko name - 영구 ID와 표시 제목에 사용하는 창 이름입니다. ###으로 제목과 ID를 분리할 수 있습니다.
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
 * @param flags - ImGuiWindowFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiWindowFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiWindowFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiWindowFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndPopup() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndPopup()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndPopup() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndPopup()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginPopupModal(
  name: string | Uint8Array,
  p_open: Uint8Array | null = null,
  flags: number = 0,
): boolean {
  return native.BeginPopupModal(name, p_open, flags);
}

/**
 * End the current popup.
 *
 * @zh 结束当前弹出窗口。
 * @ja 現在のポップアップを終了します。
 * @ko 현재 팝업을 종료합니다.
 *
 * @remarks
 * only call EndPopup() if BeginPopupXXX() returns true!
 * @zh
 * 仅在 BeginPopupXXX() 返回 true 时调用 EndPopup()！
 * @ja
 * BeginPopupXXX() が true を返した場合のみ EndPopup() を呼んでください！
 * @ko
 * BeginPopupXXX()가 true를 반환한 경우에만 EndPopup()을 호출하세요!
 */
export function EndPopup(): void {
  native.EndPopup();
}

/**
 * Mark a popup as open.
 *
 * @zh 将弹出窗口标记为打开。
 * @ja ポップアップを開いた状態にします。
 * @ko 팝업을 열린 상태로 표시합니다.
 *
 * @remarks
 * - OpenPopup(): set popup state to open. ImGuiPopupFlags are available for
 *   opening options.
 *
 * - If not modal: they can be closed by clicking anywhere outside them, or by
 *   pressing ESCAPE.
 *
 * - CloseCurrentPopup(): use inside the BeginPopup()/EndPopup() scope to close
 *   manually.
 *
 * - CloseCurrentPopup() is called by default by Selectable()/MenuItem() when
 *   activated (FIXME: need some options).
 *
 * - Use ImGuiPopupFlags.NoOpenOverExistingPopup to avoid opening a popup if
 *   there's already one at the same level. This is equivalent to e.g. testing
 *   for !IsPopupOpen("", ImGuiPopupFlags.AnyPopupId) prior to OpenPopup().
 *
 * - Use IsWindowAppearing() after BeginPopup() to tell if a window just opened.
 *
 * - IMPORTANT: Notice that for OpenPopupOnItemClick() we exceptionally default
 *   flags to 1 (== ImGuiPopupFlags.MouseButtonRight) for backward compatibility
 *   with older API taking 'int mouse_button = 1' parameter
 *
 * call to mark popup as open (don't call every frame!).
 * @zh
 * 弹出窗口：打开/关闭函数。
 *
 * - OpenPopup() 将状态设为打开；可通过 ImGuiPopupFlags 指定打开选项。
 *
 * - 非模态窗口可通过点击外部任意位置或按 ESCAPE 关闭。
 *
 * - CloseCurrentPopup() 在 BeginPopup()/EndPopup() 作用域内手动关闭窗口。
 *
 * - Selectable()/MenuItem() 激活时默认调用 CloseCurrentPopup()（待修复：需要一些选项）。
 *
 * - 使用 ImGuiPopupFlags.NoOpenOverExistingPopup，可在同层级已有弹出窗口时避免再打开；等同于在
 *   OpenPopup() 之前检查 !IsPopupOpen("", ImGuiPopupFlags.AnyPopupId)。
 *
 * - 在 BeginPopup() 之后使用 IsWindowAppearing()，可判断窗口是否刚打开。
 *
 * - 重要：为兼容接受 'int mouse_button = 1' 的旧 API，OpenPopupOnItemClick() 例外地将 flags
 *   默认为 1（== ImGuiPopupFlags.MouseButtonRight）。调用以将弹出窗口标记为打开（不要每帧调用！）。
 * @ja
 * ポップアップ：開閉関数。
 *
 * - OpenPopup() は状態を開くに設定し、ImGuiPopupFlags で開き方を指定できます。
 *
 * - 非モーダルなら外側のクリックや ESCAPE で閉じられます。
 *
 * - CloseCurrentPopup() は BeginPopup()/EndPopup() 内で手動で閉じるために使います。
 *
 * - Selectable()/MenuItem() はアクティブ化時に既定で CloseCurrentPopup()
 *   を呼びます（要修正：オプションが必要です）。
 *
 * - ImGuiPopupFlags.NoOpenOverExistingPopup
 * で同じ階層に既存のポップアップがあれば開かないようにできます。OpenPopup() 前に !IsPopupOpen("",
 * ImGuiPopupFlags.AnyPopupId)
 *   を確認することなどと同等です。
 *
 * - BeginPopup() 後の IsWindowAppearing() で開いた直後か判断できます。
 *
 * - 重要：'int mouse_button = 1' を受け取る旧 API との互換性のため、OpenPopupOnItemClick() の
 *   flags は例外的に 1（==
 *   ImGuiPopupFlags.MouseButtonRight）が既定です。ポップアップを開いた状態にするために呼びます（毎フレーム呼ばないでくだ
 *   さい！）。
 * @ko
 * 팝업: 열기/닫기 함수.
 *
 * - OpenPopup()은 팝업 상태를 열림으로 설정합니다. ImGuiPopupFlags로 열기 옵션을 지정할 수 있습니다.
 *
 * - 모달이 아니면 바깥 아무 곳이나 클릭하거나 ESCAPE를 눌러 닫을 수 있습니다.
 *
 * - CloseCurrentPopup()은 BeginPopup()/EndPopup() 범위 안에서 수동으로 닫을 때 사용합니다.
 *
 * - Selectable()/MenuItem()은 활성화되면 기본적으로 CloseCurrentPopup()을 호출합니다(수정 필요: 옵션이
 *   필요함).
 *
 * - ImGuiPopupFlags.NoOpenOverExistingPopup을 사용하면 같은 수준에 팝업이 있을 때 추가로 열지 않습니다.
 *   OpenPopup() 전에 !IsPopupOpen("", ImGuiPopupFlags.AnyPopupId)를 검사하는 것과 같습니다.
 *
 * - BeginPopup() 이후 IsWindowAppearing()으로 방금 열린 창인지 알 수 있습니다.
 *
 * - 중요: 'int mouse_button = 1' 인수를 받던 이전 API와의 호환성을 위해 OpenPopupOnItemClick()의
 *   flags 기본값은 예외적으로 1(== ImGuiPopupFlags.MouseButtonRight)입니다. 팝업을 열린 상태로
 *   표시하려면 호출하세요(매 프레임 호출하지 마세요!).
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param popup_flags - ImGuiPopupFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh popup_flags - 控制此操作的 ImGuiPopupFlags 选项；可用 | 组合兼容的标志位。
 * @ja popup_flags - この操作を制御する ImGuiPopupFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko popup_flags - 이 동작을 제어하는 ImGuiPopupFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 */
export function OpenPopup(
  str_id: string | Uint8Array,
  popup_flags: number = 0,
): void {
  native.OpenPopup(str_id, popup_flags);
}

/**
 * Mark a popup identified by a numeric ID as open.
 *
 * @zh 将数值 ID 指定的弹出窗口标记为打开。
 * @ja 数値 ID で指定したポップアップを開いた状態にします。
 * @ko 숫자 ID로 지정한 팝업을 열린 상태로 표시합니다.
 *
 * @remarks
 * id overload to facilitate calling from nested stacks
 * @zh
 * ID 重载，便于从嵌套栈中调用。
 * @ja
 * 入れ子のスタックから呼びやすくする ID オーバーロードです。
 * @ko
 * 중첩된 스택에서 쉽게 호출하기 위한 ID 오버로드입니다.
 *
 * @param id - Numeric ID identifying the child window, popup, or selection
 * entry, passed directly without string hashing.
 * @zh id - 标识子窗口、弹窗或选择条目的数值 ID，直接传入而不做字符串散列。
 * @ja id - 子ウィンドウ、ポップアップ、選択項目の数値 ID です。文字列ハッシュを行わず直接使います。
 * @ko id - 자식 창, 팝업 또는 선택 항목의 숫자 ID입니다. 문자열 해시 없이 직접 전달됩니다.
 *
 * @param popup_flags - ImGuiPopupFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh popup_flags - 控制此操作的 ImGuiPopupFlags 选项；可用 | 组合兼容的标志位。
 * @ja popup_flags - この操作を制御する ImGuiPopupFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko popup_flags - 이 동작을 제어하는 ImGuiPopupFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 */
export function OpenPopupID(id: number, popup_flags: number = 0): void {
  native.OpenPopupID(id, popup_flags);
}

/**
 * Open a popup when the preceding item is clicked.
 *
 * @zh 点击前一个条目时打开弹出窗口。
 * @ja 直前のアイテムがクリックされたときにポップアップを開きます。
 * @ko 이전 항목을 클릭하면 팝업을 엽니다.
 *
 * @remarks
 * helper to open popup when clicked on last item.
 *
 * Default to ImGuiPopupFlags.MouseButtonRight == 1.
 *
 * (note: actually triggers on the mouse _released_ event to be consistent with
 * popup behaviors)
 * @zh
 * 点击最后一个项目时打开弹出窗口的辅助函数。
 *
 * 默认使用 ImGuiPopupFlags.MouseButtonRight == 1。
 *
 * （注意：为与弹出窗口行为一致，实际由鼠标释放事件触发。）
 * @ja
 * 最後の項目のクリックでポップアップを開くヘルパーです。
 *
 * 既定は ImGuiPopupFlags.MouseButtonRight == 1 です。
 *
 * （注：ポップアップの動作と合わせ、実際にはマウスを離したイベントで発火します。）
 * @ko
 * 마지막 항목을 클릭하면 팝업을 여는 헬퍼입니다.
 *
 * 기본값은 ImGuiPopupFlags.MouseButtonRight == 1입니다.(참고: 팝업 동작과 일치하도록 실제로는 마우스를 놓는
 * 이벤트에서 실행됩니다.)
 *
 * @param str_id - Popup ID hashed in the current ID stack; null uses the last
 * item ID for item popups, or the built-in context ID for window/void popups.
 * @zh str_id - 在当前 ID 栈中散列的弹窗 ID；null 对项弹窗使用最后项 ID，对窗口或空白处弹窗使用内置上下文 ID。
 * @ja str_id - 現在の ID スタックでハッシュするポップアップ ID です。null は項目用では直前の ID、ウィンドウ・空白用では既定
 * ID を使います。
 * @ko str_id - 현재 ID 스택에서 해시하는 팝업 ID입니다. null은 항목 팝업에서는 마지막 항목 ID, 창 또는 빈 영역에서는
 * 내장 컨텍스트 ID입니다.
 *
 * @param popup_flags - ImGuiPopupFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh popup_flags - 控制此操作的 ImGuiPopupFlags 选项；可用 | 组合兼容的标志位。
 * @ja popup_flags - この操作を制御する ImGuiPopupFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko popup_flags - 이 동작을 제어하는 ImGuiPopupFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 */
export function OpenPopupOnItemClick(
  str_id: string | Uint8Array | null = null,
  popup_flags: number = 1,
): void {
  native.OpenPopupOnItemClick(str_id, popup_flags);
}

/**
 * Close the current popup.
 *
 * @zh 关闭当前弹出窗口。
 * @ja 現在のポップアップを閉じます。
 * @ko 현재 팝업을 닫습니다.
 *
 * @remarks
 * manually close the popup we have begin-ed into.
 * @zh
 * 手动关闭已通过 Begin 进入的当前弹出窗口。
 * @ja
 * Begin で入った現在のポップアップを手動で閉じます。
 * @ko
 * Begin으로 진입한 현재 팝업을 수동으로 닫습니다.
 */
export function CloseCurrentPopup(): void {
  native.CloseCurrentPopup();
}

/**
 * Open and begin a context popup for the preceding item.
 *
 * @zh 为前一个条目打开并开始上下文弹出窗口。
 * @ja 直前のアイテムのコンテキストポップアップを開いて開始します。
 * @ko 이전 항목의 컨텍스트 팝업을 열고 시작합니다.
 *
 * @remarks
 * This no-argument helper opens a context menu on right-button release over the
 * preceding item. It fixes `str_id = null` and `popup_flags = 1`, so the
 * preceding item must provide an ID.
 *
 * - After an item without an ID, such as `Text()`, call
 *   `BeginPopupContextItemEx(id, flags)` with an explicit ID instead.
 * - Use that `Ex` variant to configure the mouse button or other
 *   `ImGuiPopupFlags`. These are popup flags, unlike the window flags accepted
 *   by `BeginPopup()`; include the right-button flag when combining options for
 *   right-click activation.
 * - Submit popup contents and call `EndPopup()` only when the begin call
 *   returns `true`.
 * @zh
 * 此无参数辅助函数在前一个条目上释放鼠标右键时打开上下文菜单。它固定使用 `str_id = null` 和 `popup_flags =
 * 1`，因此前一个条目必须提供 ID。
 *
 * - 对于 `Text()` 等没有 ID 的条目，请改用 `BeginPopupContextItemEx(id, flags)` 并显式指定 ID。
 * - 要配置鼠标按键或其他 `ImGuiPopupFlags`，也须使用该 `Ex` 版本。这里接受弹窗标志，与 `BeginPopup()`
 *   的窗口标志不同；组合右键触发选项时须包含右键标志。
 * - 仅当开始调用返回 `true` 时提交弹窗内容并调用 `EndPopup()`。
 * @ja
 * この引数なしのヘルパーは、直前の項目上で右ボタンを離したときにコンテキストメニューを開きます。`str_id = null` と `popup_flags
 * = 1` を使うため、直前の項目に ID が必要です。
 *
 * - `Text()` など ID のない項目には、ID を明示して `BeginPopupContextItemEx(id, flags)`
 *   を呼んでください。
 * - マウスボタンや他の `ImGuiPopupFlags` を設定する場合も `Ex` 版を使います。`BeginPopup()`
 *   のウィンドウフラグとは異なるポップアップフラグです。右クリック用の設定を組み合わせる場合は右ボタンのフラグを含めます。
 * - 開始呼び出しが `true` の場合だけ内容を送信し、`EndPopup()` を呼びます。
 * @ko
 * 이 인수 없는 헬퍼는 이전 항목 위에서 오른쪽 마우스 버튼을 놓을 때 컨텍스트 메뉴를 엽니다. `str_id = null`과
 * `popup_flags = 1`을 사용하므로 이전 항목에 ID가 있어야 합니다.
 *
 * - `Text()`처럼 ID가 없는 항목 뒤에서는 명시적 ID로 `BeginPopupContextItemEx(id, flags)`를
 *   호출하세요.
 * - 마우스 버튼이나 다른 `ImGuiPopupFlags`를 설정할 때도 `Ex` 버전을 사용합니다. 이는 `BeginPopup()`의 창
 *   플래그와 다른 팝업 플래그이며, 오른쪽 클릭 옵션을 조합할 때 오른쪽 버튼 플래그를 포함해야 합니다.
 * - 시작 호출이 `true`를 반환할 때만 팝업 내용을 제출하고 `EndPopup()`를 호출하세요.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndPopup() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndPopup()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndPopup() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndPopup()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginPopupContextItem(): boolean {
  return native.BeginPopupContextItem();
}

/**
 * Open and begin a context popup for the preceding item.
 *
 * @zh 为前一个条目打开并开始上下文弹出窗口。
 * @ja 直前のアイテムのコンテキストポップアップを開いて開始します。
 * @ko 이전 항목의 컨텍스트 팝업을 열고 시작합니다.
 *
 * @remarks
 * open+begin popup when clicked on last item.
 *
 * Use str_id==null to associate the popup to previous item.
 *
 * If you want to use that on a non-interactive item such as Text() you need to
 * pass in an explicit ID here.
 *
 * read comments in .cpp!
 * @zh
 * 点击最后一个项目时打开并开始弹出窗口。
 *
 * str_id==null 将弹出窗口关联到前一个项目。
 *
 * 若用于 Text() 等非交互项目，必须显式传入 ID。
 *
 * 请阅读 .cpp 中的注释！
 * @ja
 * 最後の項目をクリックしたときにポップアップを開いて開始します。
 *
 * str_id==null で直前の項目に関連付けます。
 *
 * Text() など非対話的な項目に使う場合は明示的な ID が必要です。
 *
 * .cpp のコメントを読んでください！
 * @ko
 * 마지막 항목을 클릭하면 팝업을 열고 시작합니다.
 *
 * str_id==null이면 이전 항목에 연결합니다.
 *
 * Text() 같은 비대화형 항목에 사용하려면 명시적인 ID를 전달해야 합니다.
 *
 * .cpp의 주석을 읽으세요!
 *
 * @param str_id - Popup ID hashed in the current ID stack; null uses the last
 * item ID for item popups, or the built-in context ID for window/void popups.
 * @zh str_id - 在当前 ID 栈中散列的弹窗 ID；null 对项弹窗使用最后项 ID，对窗口或空白处弹窗使用内置上下文 ID。
 * @ja str_id - 現在の ID スタックでハッシュするポップアップ ID です。null は項目用では直前の ID、ウィンドウ・空白用では既定
 * ID を使います。
 * @ko str_id - 현재 ID 스택에서 해시하는 팝업 ID입니다. null은 항목 팝업에서는 마지막 항목 ID, 창 또는 빈 영역에서는
 * 내장 컨텍스트 ID입니다.
 *
 * @param popup_flags - ImGuiPopupFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh popup_flags - 控制此操作的 ImGuiPopupFlags 选项；可用 | 组合兼容的标志位。
 * @ja popup_flags - この操作を制御する ImGuiPopupFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko popup_flags - 이 동작을 제어하는 ImGuiPopupFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndPopup() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndPopup()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndPopup() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndPopup()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginPopupContextItemEx(
  str_id: string | Uint8Array | null = null,
  popup_flags: number = 1,
): boolean {
  return native.BeginPopupContextItemEx(str_id, popup_flags);
}

/**
 * Open and begin a context popup on right-click release over the current
 * window.
 *
 * @zh 在当前窗口上释放鼠标右键时打开并开始上下文弹出菜单。
 * @ja 現在のウィンドウ上で右ボタンを離すとコンテキストポップアップを開いて開始します。
 * @ko 현재 창 위에서 마우스 오른쪽 버튼을 놓으면 컨텍스트 팝업을 열고 시작합니다.
 *
 * @remarks
 * Implied str_id = null, popup_flags = 1
 * @zh
 * 隐含参数：str_id = null, popup_flags = 1。
 * @ja
 * 暗黙の引数：str_id = null, popup_flags = 1。
 * @ko
 * 암묵적 인수: str_id = null, popup_flags = 1.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndPopup() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndPopup()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndPopup() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndPopup()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginPopupContextWindow(): boolean {
  return native.BeginPopupContextWindow();
}

/**
 * Open and begin a context popup for the current window.
 *
 * @zh 为当前窗口打开并开始上下文弹出窗口。
 * @ja 現在のウィンドウのコンテキストポップアップを開いて開始します。
 * @ko 현재 창의 컨텍스트 팝업을 열고 시작합니다.
 *
 * @remarks
 * open+begin popup when clicked on current window.
 * @zh
 * 点击当前窗口时打开并开始弹出窗口。
 * @ja
 * 現在のウィンドウをクリックしたときにポップアップを開いて開始します。
 * @ko
 * 현재 창을 클릭하면 팝업을 열고 시작합니다.
 *
 * @param str_id - Popup ID hashed in the current ID stack; null uses the last
 * item ID for item popups, or the built-in context ID for window/void popups.
 * @zh str_id - 在当前 ID 栈中散列的弹窗 ID；null 对项弹窗使用最后项 ID，对窗口或空白处弹窗使用内置上下文 ID。
 * @ja str_id - 現在の ID スタックでハッシュするポップアップ ID です。null は項目用では直前の ID、ウィンドウ・空白用では既定
 * ID を使います。
 * @ko str_id - 현재 ID 스택에서 해시하는 팝업 ID입니다. null은 항목 팝업에서는 마지막 항목 ID, 창 또는 빈 영역에서는
 * 내장 컨텍스트 ID입니다.
 *
 * @param popup_flags - ImGuiPopupFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh popup_flags - 控制此操作的 ImGuiPopupFlags 选项；可用 | 组合兼容的标志位。
 * @ja popup_flags - この操作を制御する ImGuiPopupFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko popup_flags - 이 동작을 제어하는 ImGuiPopupFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndPopup() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndPopup()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndPopup() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndPopup()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginPopupContextWindowEx(
  str_id: string | Uint8Array | null = null,
  popup_flags: number = 1,
): boolean {
  return native.BeginPopupContextWindowEx(str_id, popup_flags);
}

/**
 * Open and begin a context popup on right-click release outside all windows.
 *
 * @zh 在所有窗口之外释放鼠标右键时打开并开始上下文弹出菜单。
 * @ja すべてのウィンドウの外で右ボタンを離すとコンテキストポップアップを開いて開始します。
 * @ko 모든 창 밖에서 마우스 오른쪽 버튼을 놓으면 컨텍스트 팝업을 열고 시작합니다.
 *
 * @remarks
 * Implied str_id = null, popup_flags = 1
 * @zh
 * 隐含参数：str_id = null, popup_flags = 1。
 * @ja
 * 暗黙の引数：str_id = null, popup_flags = 1。
 * @ko
 * 암묵적 인수: str_id = null, popup_flags = 1.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndPopup() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndPopup()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndPopup() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndPopup()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginPopupContextVoid(): boolean {
  return native.BeginPopupContextVoid();
}

/**
 * Open and begin a context popup outside all windows.
 *
 * @zh 在所有窗口之外打开并开始上下文弹出窗口。
 * @ja すべてのウィンドウの外側でコンテキストポップアップを開いて開始します。
 * @ko 모든 창 바깥에서 컨텍스트 팝업을 열고 시작합니다.
 *
 * @remarks
 * open+begin popup when clicked in void (where there are no windows).
 * @zh
 * 点击空白区域（没有窗口的地方）时打开并开始弹出窗口。
 * @ja
 * 空白領域（ウィンドウのない場所）をクリックしたときにポップアップを開いて開始します。
 * @ko
 * 빈 영역(창이 없는 곳)을 클릭하면 팝업을 열고 시작합니다.
 *
 * @param str_id - Popup ID hashed in the current ID stack; null uses the last
 * item ID for item popups, or the built-in context ID for window/void popups.
 * @zh str_id - 在当前 ID 栈中散列的弹窗 ID；null 对项弹窗使用最后项 ID，对窗口或空白处弹窗使用内置上下文 ID。
 * @ja str_id - 現在の ID スタックでハッシュするポップアップ ID です。null は項目用では直前の ID、ウィンドウ・空白用では既定
 * ID を使います。
 * @ko str_id - 현재 ID 스택에서 해시하는 팝업 ID입니다. null은 항목 팝업에서는 마지막 항목 ID, 창 또는 빈 영역에서는
 * 내장 컨텍스트 ID입니다.
 *
 * @param popup_flags - ImGuiPopupFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh popup_flags - 控制此操作的 ImGuiPopupFlags 选项；可用 | 组合兼容的标志位。
 * @ja popup_flags - この操作を制御する ImGuiPopupFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko popup_flags - 이 동작을 제어하는 ImGuiPopupFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndPopup() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndPopup()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndPopup() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndPopup()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginPopupContextVoidEx(
  str_id: string | Uint8Array | null = null,
  popup_flags: number = 1,
): boolean {
  return native.BeginPopupContextVoidEx(str_id, popup_flags);
}

/**
 * Test whether a popup is open.
 *
 * @zh 判断弹出窗口是否已打开。
 * @ja ポップアップが開いているかを調べます。
 * @ko 팝업이 열려 있는지 확인합니다.
 *
 * @remarks
 * - IsPopupOpen(): return true if the popup is open at the current BeginPopup()
 *   level of the popup stack.
 *
 * - IsPopupOpen() with ImGuiPopupFlags.AnyPopupId: return true if any popup is
 *   open at the current BeginPopup() level of the popup stack.
 *
 * - IsPopupOpen() with ImGuiPopupFlags.AnyPopupId +
 *   ImGuiPopupFlags.AnyPopupLevel: return true if any popup is open.
 *
 * return true if the popup is open.
 * @zh
 * 弹出窗口：查询函数。
 *
 * - IsPopupOpen()：指定弹出窗口在弹出栈当前 BeginPopup() 层级打开时返回 true。
 *
 * - 带 ImGuiPopupFlags.AnyPopupId：当前 BeginPopup() 层级有任意弹出窗口打开时返回 true。
 *
 * - 带 ImGuiPopupFlags.AnyPopupId + ImGuiPopupFlags.AnyPopupLevel：有任意弹出窗口打开时返回
 *   true。弹出窗口打开时返回 true。
 * @ja
 * ポップアップ：照会関数。
 *
 * - IsPopupOpen() はポップアップスタックの現在の BeginPopup() 階層で対象が開いていれば true を返します。
 *
 * - ImGuiPopupFlags.AnyPopupId を付けると現在の階層に任意のポップアップが開いていれば true。
 *
 * - ImGuiPopupFlags.AnyPopupId + ImGuiPopupFlags.AnyPopupLevel
 *   を付けると、どこかにポップアップが開いていれば true です。ポップアップが開いている場合に true を返します。
 * @ko
 * 팝업: 조회 함수.
 *
 * - IsPopupOpen()은 팝업 스택의 현재 BeginPopup() 수준에서 해당 팝업이 열려 있으면 true를 반환합니다.
 *
 * - ImGuiPopupFlags.AnyPopupId를 지정하면 현재 수준에 아무 팝업이나 열려 있으면 true입니다.
 *
 * - ImGuiPopupFlags.AnyPopupId + ImGuiPopupFlags.AnyPopupLevel을 지정하면 어느 수준에서든
 *   팝업이 열려 있으면 true입니다. 팝업이 열려 있으면 true를 반환합니다.
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param flags - ImGuiPopupFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiPopupFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiPopupFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiPopupFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if a popup matching the ID and query flags is open in the
 * current popup scope; false otherwise.
 * @zh 当前弹窗作用域中存在匹配 ID 和查询标志的已打开弹窗时为 true，否则为 false。
 * @ja 現在のポップアップスコープで ID と検索フラグに一致するものが開いている場合は true、それ以外は false です。
 * @ko 현재 팝업 범위에서 ID와 조회 플래그가 일치하는 팝업이 열려 있으면 true이며 아니면 false입니다.
 */
export function IsPopupOpen(
  str_id: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.IsPopupOpen(str_id, flags);
}
