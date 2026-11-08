import { native } from '../internal/native';
import type { ImVec2Like, ImVec2Value, ImDrawList } from '../types';

/**
 * Begin or append to a window.
 *
 * @zh 开始窗口或向窗口追加内容。
 * @ja ウィンドウを開始するか、内容を追加します。
 * @ko 창을 시작하거나 창에 내용을 추가합니다.
 *
 * @remarks
 * - `Begin()` pushes the window onto the stack and starts appending content.
 *   Call `End()` for every `Begin()`, even when it returns `false`.
 *
 * - A `false` return means the window is collapsed or fully clipped; skip its
 *   contents, but still call `End()`. Unlike most `BeginXXX()`/`EndXXX()`
 *   pairs, both `Begin()` and `BeginChild()` always require their matching end
 *   call.
 *
 * - Pass a `Uint8Array` as `p_open` to show a close button. Its first element
 *   holds the open state; clicking the close button writes `0` to `p_open[0]`.
 *   Pass `null` to omit the close button. The application decides whether to
 *   call `Begin()` again based on that state.
 *
 * - Multiple `Begin()`/`End()` pairs may append to the same window in one
 *   frame. Only the first `Begin()` considers `flags` and `p_open`.
 *
 * - The bottom of the window stack always contains the window named "Debug".
 * @zh
 * - `Begin()` 将窗口压入栈并开始追加内容。每次 `Begin()` 后都必须调用 `End()`，即使返回 `false` 也不例外。
 *
 * - 返回 `false` 表示窗口已折叠或完全被裁剪，可跳过窗口内容，但仍须调用 `End()`。与大多数 `BeginXXX()`/`EndXXX()`
 *   对不同，`Begin()` 和 `BeginChild()` 始终要求匹配的结束调用。
 *
 * - 将 `Uint8Array` 作为 `p_open` 传入可显示关闭按钮。首个元素保存打开状态；点击关闭按钮会将 `p_open[0]` 写为
 *   `0`。传入 `null` 则不显示关闭按钮。应用根据该状态决定是否再次调用 `Begin()`。
 *
 * - 同一帧内可通过多组 `Begin()`/`End()` 向同一窗口追加内容。只有首次 `Begin()` 会采用 `flags` 和
 *   `p_open`。
 *
 * - 窗口栈底始终包含名为 "Debug" 的窗口。
 * @ja
 * - `Begin()` はウィンドウをスタックに積み、内容の追加を開始します。戻り値が `false` でも、すべての `Begin()` に対して
 *   `End()` を呼んでください。
 *
 * - `false` は折りたたみ状態または完全なクリッピングを示します。内容の送信は省略できますが、`End()` は必要です。一般的な
 *   `BeginXXX()`/`EndXXX()` の組と異なり、`Begin()` と `BeginChild()`
 *   は常に対応する終了呼び出しが必要です。
 *
 * - `p_open` に `Uint8Array` を渡すと閉じるボタンを表示します。先頭要素が開閉状態を保持し、閉じるボタンを押すと
 *   `p_open[0]` に `0` が書き込まれます。`null` を渡すと閉じるボタンを省略します。アプリケーションはこの状態から次回の
 *   `Begin()` を呼ぶか判断します。
 *
 * - 同じフレーム内で複数の `Begin()`/`End()` を使い、同じウィンドウに追加できます。`flags` と `p_open` は最初の
 *   `Begin()` だけが参照します。
 *
 * - ウィンドウスタックの底には常に "Debug" というウィンドウがあります。
 * @ko
 * - `Begin()`은 창을 스택에 넣고 내용 추가를 시작합니다. `false`를 반환해도 모든 `Begin()`에 대응하는
 *   `End()`를 호출해야 합니다.
 *
 * - `false`는 창이 접혔거나 완전히 잘렸음을 뜻합니다. 내용 제출은 생략할 수 있지만 `End()`는 호출해야 합니다. 대부분의
 *   `BeginXXX()`/`EndXXX()` 쌍과 달리 `Begin()`과 `BeginChild()`는 항상 대응하는 종료 호출이
 *   필요합니다.
 *
 * - `p_open`에 `Uint8Array`를 전달하면 닫기 버튼이 표시됩니다. 첫 번째 요소가 열림 상태를 보관하며, 닫기 버튼을 누르면
 *   `p_open[0]`에 `0`을 기록합니다. `null`을 전달하면 닫기 버튼을 생략합니다. 애플리케이션은 이 상태로 다음
 *   `Begin()` 호출 여부를 결정합니다.
 *
 * - 한 프레임에서 여러 `Begin()`/`End()` 쌍으로 같은 창에 내용을 추가할 수 있습니다. `flags`와 `p_open`은 첫
 *   번째 `Begin()`에서만 사용됩니다.
 *
 * - 창 스택의 맨 아래에는 항상 "Debug"라는 창이 있습니다.
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
 * @returns True when window contents should be submitted; false when collapsed
 * or fully clipped. Call End() even when false.
 * @zh 应提交窗口内容时返回 true；折叠或完全裁剪时为 false。即使为 false 也必须调用 End()。
 * @ja 内容を描く場合は true、折りたたみや完全クリップ時は false です。false でも End() を呼びます。
 * @ko 창 내용을 제출해야 하면 true, 접히거나 완전히 잘리면 false입니다. false여도 End()를 호출해야 합니다.
 */
export function Begin(
  name: string | Uint8Array,
  p_open: Uint8Array | null = null,
  flags: number = 0,
): boolean {
  return native.Begin(name, p_open, flags);
}

/**
 * End the window scope opened by Begin and restore the previous current window.
 *
 * @zh 结束 Begin 打开的窗口作用域，并恢复先前的当前窗口。
 * @ja Begin で開始したウィンドウスコープを終了し、以前のカレントウィンドウに戻します。
 * @ko Begin으로 시작한 창 범위를 끝내고 이전 현재 창으로 복원합니다.
 */
export function End(): void {
  native.End();
}

/**
 * Begin a child window with independent scrolling and clipping.
 *
 * @zh 开始具有独立滚动和裁剪区域的子窗口。
 * @ja 独立したスクロールとクリッピング領域を持つ子ウィンドウを開始します。
 * @ko 독립적인 스크롤 및 클리핑 영역을 가진 자식 창을 시작합니다.
 *
 * @remarks
 * Child windows provide independent scrolling and clipping inside a parent
 * window and may contain nested child windows.
 *
 * - Each size axis is independent: `0` uses the remaining parent space, a
 *   positive value specifies a size, and a negative value leaves that distance
 *   from the available right or bottom boundary.
 *
 * - `ImGuiChildFlags.AutoResizeX` and `ImGuiChildFlags.AutoResizeY` size an
 *   axis from its contents. Enabling both is not recommended for a scrolling
 *   region.
 *
 * - Always call `EndChild()` after `BeginChild()`, even if it returns `false`.
 *   A `false` return means the child is collapsed or fully clipped and its
 *   contents may be skipped. This matches `Begin()`/`End()` but differs from
 *   most other begin/end pairs, whose end call is conditional on a `true`
 *   return.
 *
 * - Since 1.90 (November 2023), child flags replace the old boolean border
 *   argument. Use `0` or `ImGuiChildFlags.None` for no border, or
 *   `ImGuiChildFlags.Borders` for a border. The border flag retains the numeric
 *   value `1` for compatibility.
 * @zh
 * 子窗口在父窗口内提供独立的滚动和裁剪区域，也可嵌套其他子窗口。
 *
 * - 每个尺寸轴可独立设置：`0` 使用父窗口剩余空间；正值指定尺寸；负值表示距离可用内容区域右边界或下边界的间距。
 *
 * - `ImGuiChildFlags.AutoResizeX` 和 `ImGuiChildFlags.AutoResizeY`
 *   根据内容自动调整对应轴。对于滚动区域，不建议同时启用两者。
 *
 * - 每次 `BeginChild()` 后都必须调用 `EndChild()`，即使返回 `false` 也不例外。`false`
 *   表示子窗口已折叠或完全被裁剪，可跳过其内容。这与 `Begin()`/`End()` 相同，但不同于大多数仅在开始调用返回 `true`
 *   时才结束的配对函数。
 *
 * - 从 1.90（2023 年 11 月）起，子窗口标志替代旧的布尔边框参数。无边框使用 `0` 或
 *   `ImGuiChildFlags.None`，有边框使用 `ImGuiChildFlags.Borders`。边框标志保留数值 `1` 以兼容旧接口。
 * @ja
 * 子ウィンドウは親ウィンドウ内に独立したスクロールとクリッピング領域を設け、さらに子ウィンドウを入れ子にできます。
 *
 * - サイズは軸ごとに指定できます。`0` は親の残り領域、正の値は指定サイズ、負の値は利用可能領域の右端または下端からの余白を表します。
 *
 * - `ImGuiChildFlags.AutoResizeX` と `ImGuiChildFlags.AutoResizeY`
 *   は内容から対応する軸のサイズを決めます。スクロール領域では両方の同時使用は推奨されません。
 *
 * - `BeginChild()` が `false` を返しても、必ず `EndChild()` を呼んでください。`false`
 *   は折りたたみ状態または完全なクリッピングを示し、内容を省略できます。これは `Begin()`/`End()` と同じですが、開始時に `true`
 *   が返った場合だけ終了する一般的な組とは異なります。
 *
 * - 1.90（2023 年 11 月）以降、従来のブール型の枠線引数は子ウィンドウフラグになりました。枠線なしは `0` または
 *   `ImGuiChildFlags.None`、枠線ありは `ImGuiChildFlags.Borders`
 *   を使います。互換性のため枠線フラグの数値は `1` のままです。
 * @ko
 * 자식 창은 부모 창 안에서 독립적인 스크롤 및 클리핑 영역을 제공하며 다른 자식 창을 포함할 수 있습니다.
 *
 * - 크기의 각 축은 독립적입니다. `0`은 부모의 남은 공간을 사용하고, 양수는 크기를 지정하며, 음수는 사용 가능한 오른쪽 또는 아래쪽
 *   경계에서의 여백을 지정합니다.
 *
 * - `ImGuiChildFlags.AutoResizeX`와 `ImGuiChildFlags.AutoResizeY`는 콘텐츠에 맞춰 해당 축
 *   크기를 정합니다. 스크롤 영역에서 둘을 동시에 사용하는 것은 권장하지 않습니다.
 *
 * - `BeginChild()`가 `false`를 반환해도 항상 `EndChild()`를 호출해야 합니다. `false`는 자식 창이
 *   접혔거나 완전히 잘렸다는 뜻이며 콘텐츠 제출을 생략할 수 있습니다. 이는 `Begin()`/`End()`와 같지만 시작 호출이
 *   `true`일 때만 종료하는 대부분의 함수 쌍과는 다릅니다.
 *
 * - 1.90(2023년 11월)부터 기존의 불리언 테두리 인수는 자식 창 플래그로 대체되었습니다. 테두리가 없으면 `0` 또는
 *   `ImGuiChildFlags.None`, 있으면 `ImGuiChildFlags.Borders`를 사용합니다. 호환성을 위해 테두리
 *   플래그 값은 `1`을 유지합니다.
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param size - Child-window width and height in pixels: 0 uses the remaining
 * region, positive fixes an axis, negative uses remaining space minus that
 * amount.
 * @zh size - 子窗口像素宽高：0 使用剩余区域，正值固定尺寸，负值从剩余空间中减去其绝对值。
 * @ja size - 子ウィンドウのピクセル幅・高さです。0 は残り全体、正は固定、負は残りから絶対値分を引きます。
 * @ko size - 자식 창의 픽셀 너비와 높이입니다. 0은 남은 영역, 양수는 고정값, 음수는 남은 공간에서 절댓값을 뺍니다.
 *
 * @param child_flags - ImGuiChildFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh child_flags - 控制此操作的 ImGuiChildFlags 选项；可用 | 组合兼容的标志位。
 * @ja child_flags - この操作を制御する ImGuiChildFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko child_flags - 이 동작을 제어하는 ImGuiChildFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param window_flags - ImGuiWindowFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh window_flags - 控制此操作的 ImGuiWindowFlags 选项；可用 | 组合兼容的标志位。
 * @ja window_flags - この操作を制御する ImGuiWindowFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko window_flags - 이 동작을 제어하는 ImGuiWindowFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when child contents should be submitted; false when fully
 * clipped or collapsed. Call EndChild() even when false (EndChildFrame() for
 * the legacy frame helper).
 * @zh 应提交子窗口内容时返回 true，完全裁剪或折叠时为 false。即使为 false 也须调用 EndChild()，旧式 frame 辅助函数用
 * EndChildFrame()。
 * @ja 子の内容を描く場合は true、完全クリップや折りたたみ時は false です。false でも EndChild()、旧 frame 版なら
 * EndChildFrame() を呼びます。
 * @ko 자식 내용을 제출해야 하면 true, 완전히 잘리거나 접히면 false입니다. false여도 EndChild()를 호출하며 레거시
 * frame은 EndChildFrame()을 사용합니다.
 */
export function BeginChild(
  str_id: string | Uint8Array,
  size: ImVec2Like = { x: 0, y: 0 },
  child_flags: number = 0,
  window_flags: number = 0,
): boolean {
  return native.BeginChild(str_id, size, child_flags, window_flags);
}

/**
 * Begin a child window identified by a numeric ID within the current window.
 *
 * @zh 在当前窗口内开始一个由数值 ID 标识的子窗口。
 * @ja 現在のウィンドウ内で、数値 ID で識別される子ウィンドウを開始します。
 * @ko 현재 창 안에서 숫자 ID로 식별되는 자식 창을 시작합니다.
 *
 * @param id - Numeric ID identifying the child window, popup, or selection
 * entry, passed directly without string hashing.
 * @zh id - 标识子窗口、弹窗或选择条目的数值 ID，直接传入而不做字符串散列。
 * @ja id - 子ウィンドウ、ポップアップ、選択項目の数値 ID です。文字列ハッシュを行わず直接使います。
 * @ko id - 자식 창, 팝업 또는 선택 항목의 숫자 ID입니다. 문자열 해시 없이 직접 전달됩니다.
 *
 * @param size - Child-window width and height in pixels: 0 uses the remaining
 * region, positive fixes an axis, negative uses remaining space minus that
 * amount.
 * @zh size - 子窗口像素宽高：0 使用剩余区域，正值固定尺寸，负值从剩余空间中减去其绝对值。
 * @ja size - 子ウィンドウのピクセル幅・高さです。0 は残り全体、正は固定、負は残りから絶対値分を引きます。
 * @ko size - 자식 창의 픽셀 너비와 높이입니다. 0은 남은 영역, 양수는 고정값, 음수는 남은 공간에서 절댓값을 뺍니다.
 *
 * @param child_flags - ImGuiChildFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh child_flags - 控制此操作的 ImGuiChildFlags 选项；可用 | 组合兼容的标志位。
 * @ja child_flags - この操作を制御する ImGuiChildFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko child_flags - 이 동작을 제어하는 ImGuiChildFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param window_flags - ImGuiWindowFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh window_flags - 控制此操作的 ImGuiWindowFlags 选项；可用 | 组合兼容的标志位。
 * @ja window_flags - この操作を制御する ImGuiWindowFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko window_flags - 이 동작을 제어하는 ImGuiWindowFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when child contents should be submitted; false when fully
 * clipped or collapsed. Call EndChild() even when false (EndChildFrame() for
 * the legacy frame helper).
 * @zh 应提交子窗口内容时返回 true，完全裁剪或折叠时为 false。即使为 false 也须调用 EndChild()，旧式 frame 辅助函数用
 * EndChildFrame()。
 * @ja 子の内容を描く場合は true、完全クリップや折りたたみ時は false です。false でも EndChild()、旧 frame 版なら
 * EndChildFrame() を呼びます。
 * @ko 자식 내용을 제출해야 하면 true, 완전히 잘리거나 접히면 false입니다. false여도 EndChild()를 호출하며 레거시
 * frame은 EndChildFrame()을 사용합니다.
 */
export function BeginChildID(
  id: number,
  size: ImVec2Like = { x: 0, y: 0 },
  child_flags: number = 0,
  window_flags: number = 0,
): boolean {
  return native.BeginChildID(id, size, child_flags, window_flags);
}

/**
 * End the child window scope opened by BeginChild and resume its parent window.
 *
 * @zh 结束 BeginChild 打开的子窗口作用域，继续向父窗口添加内容。
 * @ja BeginChild で開始した子ウィンドウスコープを終了し、親ウィンドウに戻ります。
 * @ko BeginChild로 시작한 자식 창 범위를 끝내고 부모 창으로 돌아갑니다.
 */
export function EndChild(): void {
  native.EndChild();
}

/**
 * Test whether the current window is appearing.
 *
 * @zh 判断当前窗口是否正在首次显示或重新出现。
 * @ja 現在のウィンドウが初めて表示されるか、再表示されるかを調べます。
 * @ko 현재 창이 처음 표시되거나 다시 나타나는지 확인합니다.
 *
 * @remarks
 * - 'current window' = the window we are appending into while inside a
 *   Begin()/End() block. 'next window' = next window we will Begin() into.
 * @zh
 * 窗口工具：'current window' 指 Begin()/End() 块内正在追加内容的窗口；'next window' 指下一次 Begin()
 * 将进入的窗口。
 * @ja
 * ウィンドウユーティリティ：'current window' は Begin()/End() ブロック内で内容を追加しているウィンドウ、'next
 * window' は次の Begin() で入るウィンドウを指します。
 * @ko
 * 창 유틸리티: 'current window'는 Begin()/End() 블록 안에서 내용을 추가 중인 창이며, 'next window'는
 * 다음 Begin()으로 진입할 창입니다.
 *
 * @returns True if the current window is appearing after being inactive; false
 * otherwise.
 * @zh 当前窗口在不活动后重新出现时为 true，否则为 false。
 * @ja 現在のウィンドウが非表示状態から現れた場合は true、それ以外は false です。
 * @ko 현재 창이 비활성 상태 후 나타나면 true이며 아니면 false입니다.
 */
export function IsWindowAppearing(): boolean {
  return native.IsWindowAppearing();
}

/**
 * Test whether the current window is collapsed.
 *
 * @zh 检查当前窗口是否已折叠。
 * @ja 現在のウィンドウが折りたたまれているかを調べます。
 * @ko 현재 창이 접혀 있는지 확인합니다.
 *
 * @returns True if the current window is collapsed; false otherwise.
 * @zh 当前窗口已折叠时为 true，否则为 false。
 * @ja 現在のウィンドウが折りたたまれている場合は true、それ以外は false です。
 * @ko 현재 창이 접혀 있으면 true이며 아니면 false입니다.
 */
export function IsWindowCollapsed(): boolean {
  return native.IsWindowCollapsed();
}

/**
 * Test whether the current window is focused.
 *
 * @zh 判断当前窗口是否获得焦点。
 * @ja 現在のウィンドウにフォーカスがあるかを調べます。
 * @ko 현재 창에 포커스가 있는지 확인합니다.
 *
 * @remarks
 * is current window focused?
 *
 * or its root/child, depending on flags.
 *
 * see flags for options.
 * @zh
 * 当前窗口是否获得焦点？
 *
 * 根据 flags，也可检查其根窗口或子窗口；选项见标志说明。
 * @ja
 * 現在のウィンドウにフォーカスがありますか？
 *
 * flags に応じてルート／子ウィンドウも対象になります。
 *
 * 選択肢はフラグを参照してください。
 * @ko
 * 현재 창에 포커스가 있나요?
 *
 * flags에 따라 루트/자식 창도 검사합니다.
 *
 * 옵션은 플래그를 참조하세요.
 *
 * @param flags - ImGuiFocusedFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiFocusedFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiFocusedFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiFocusedFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the current window satisfies the requested focus flags;
 * false otherwise.
 * @zh 当前窗口满足所请求的焦点标志条件时为 true，否则为 false。
 * @ja 現在のウィンドウが指定フォーカス条件を満たす場合は true、それ以外は false です。
 * @ko 현재 창이 지정한 포커스 조건을 만족하면 true이며 아니면 false입니다.
 */
export function IsWindowFocused(flags: number = 0): boolean {
  return native.IsWindowFocused(flags);
}

/**
 * Test whether the current window is hovered.
 *
 * @zh 判断鼠标是否悬停在当前窗口上。
 * @ja 現在のウィンドウ上にマウスがあるかを調べます。
 * @ko 현재 창 위에 마우스가 있는지 확인합니다.
 *
 * @remarks
 * is current window hovered and hoverable (e.g. not blocked by a popup/modal)?
 *
 * See `ImGuiHoveredFlags` for options.
 *
 * IMPORTANT: If you are trying to check whether your mouse should be dispatched
 * to Dear ImGui or to your underlying app, you should not use this function!
 *
 * Use the 'io.WantCaptureMouse' boolean for that!
 *
 * Refer to FAQ entry "How can I tell whether to dispatch mouse/keyboard to Dear
 * ImGui or my application?" for details.
 * @zh
 * 当前窗口是否被悬停且允许悬停（例如未被弹出窗口或模态窗口阻挡）？
 *
 * 选项见 `ImGuiHoveredFlags`。
 *
 * 重要：如果要判断鼠标输入应交给 Dear ImGui 还是底层应用，请勿使用此函数！
 *
 * 应使用 'io.WantCaptureMouse' 布尔值！
 *
 * 详情参见 FAQ 中“如何判断鼠标/键盘输入应交给 Dear ImGui 还是我的应用程序？
 *
 * ”一节。
 * @ja
 * 現在のウィンドウがホバーされ、かつホバー可能（ポップアップやモーダルに遮られていないなど）ですか？
 *
 * 選択肢は `ImGuiHoveredFlags` を参照してください。
 *
 * 重要：マウス入力を Dear ImGui と背後のアプリのどちらに渡すかの判定には、この関数を使わないでください！
 *
 * 代わりに 'io.WantCaptureMouse' ブール値を使ってください！
 *
 * 詳細は FAQ の「マウス／キーボードを Dear ImGui とアプリケーションのどちらに渡すべきかを判断するには？
 *
 * 」を参照してください。
 * @ko
 * 현재 창 위에 마우스가 있으며 호버 가능한 상태(예: 팝업/모달에 가로막히지 않음)인가요?
 *
 * 옵션은 `ImGuiHoveredFlags`를 참조하세요.
 *
 * 중요: 마우스 입력을 Dear ImGui와 기본 애플리케이션 중 어디로 보낼지 판단하려는 경우 이 함수를 사용하지 마세요!
 *
 * 'io.WantCaptureMouse' 불리언 값을 사용하세요!
 *
 * 자세한 내용은 FAQ의 '마우스/키보드 입력을 Dear ImGui와 애플리케이션 중 어디로 보낼지 어떻게 알 수 있나요?' 항목을
 * 참조하세요.
 *
 * @param flags - ImGuiHoveredFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiHoveredFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiHoveredFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiHoveredFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the mouse is over the window under the requested hover
 * policy; false otherwise.
 * @zh 鼠标按指定悬停策略位于窗口上时为 true，否则为 false。
 * @ja 指定ホバー条件でマウスがウィンドウ上にある場合は true、それ以外は false です。
 * @ko 지정한 호버 정책에서 마우스가 창 위에 있으면 true이며 아니면 false입니다.
 */
export function IsWindowHovered(flags: number = 0): boolean {
  return native.IsWindowHovered(flags);
}

/**
 * Get draw list associated to the current window, to append your own drawing
 * primitives.
 *
 * @zh 获取当前窗口关联的绘制列表，以追加自定义绘制图元。
 * @ja 現在のウィンドウに関連付けられた描画リストを取得し、独自の描画プリミティブを追加します。
 * @ko 현재 창에 연결된 그리기 목록을 가져와 사용자 정의 그리기 프리미티브를 추가합니다.
 *
 * @returns Borrowed draw-list handle for the current window; draw positions use
 * screen coordinates.
 * @zh 当前窗口的借用绘制列表句柄，绘制位置使用屏幕坐标。
 * @ja 現在のウィンドウの借用描画リストです。描画位置はスクリーン座標です。
 * @ko 현재 창의 빌린 그리기 목록 핸들입니다. 그리기 위치는 화면 좌표입니다.
 */
export function GetWindowDrawList(): ImDrawList | null {
  return native.GetWindowDrawList();
}

/**
 * Get the current window position in screen coordinates.
 *
 * @zh 获取当前窗口的屏幕坐标。
 * @ja 現在のウィンドウの画面座標を取得します。
 * @ko 현재 창의 화면 좌표를 가져옵니다.
 *
 * @remarks
 * get current window position in screen space (IT IS UNLIKELY YOU EVER NEED TO
 * USE THIS. Consider always using GetCursorScreenPos() and
 * GetContentRegionAvail() instead)
 * @zh
 * 获取当前窗口的屏幕坐标位置（几乎不需要使用此函数。建议始终改用 GetCursorScreenPos() 和
 * GetContentRegionAvail()）。
 * @ja
 * 現在のウィンドウのスクリーン座標位置を取得します（これを使う必要はほぼありません。常に GetCursorScreenPos() と
 * GetContentRegionAvail() を使うことを検討してください）。
 * @ko
 * 현재 창의 화면 좌표 위치를 가져옵니다(이 함수가 필요한 경우는 거의 없습니다. 항상 GetCursorScreenPos()와
 * GetContentRegionAvail()을 사용하는 것을 고려하세요).
 *
 * @returns Current window top-left, copied as {x,y} in absolute screen
 * coordinates; not a writable native view.
 * @zh 当前窗口左上角的绝对屏幕坐标副本 {x,y}，不是原生可写视图。
 * @ja 現在のウィンドウの左上を絶対スクリーン座標の {x,y} としてコピーします。書き込みビューではありません。
 * @ko 현재 창의 왼쪽 위의 절대 화면 좌표 복사본 {x,y}입니다. 네이티브 쓰기 뷰가 아닙니다.
 */
export function GetWindowPos(): ImVec2Value {
  return native.GetWindowPos();
}

/**
 * Get the current window size.
 *
 * @zh 获取当前窗口的尺寸。
 * @ja 現在のウィンドウのサイズを取得します。
 * @ko 현재 창 크기를 가져옵니다.
 *
 * @remarks
 * get current window size (IT IS UNLIKELY YOU EVER NEED TO USE THIS. Consider
 * always using GetCursorScreenPos() and GetContentRegionAvail() instead)
 * @zh
 * 获取当前窗口尺寸（几乎不需要使用此函数。建议始终改用 GetCursorScreenPos() 和 GetContentRegionAvail()）。
 * @ja
 * 現在のウィンドウのサイズを取得します（これを使う必要はほぼありません。常に GetCursorScreenPos() と
 * GetContentRegionAvail() を使うことを検討してください）。
 * @ko
 * 현재 창 크기를 가져옵니다(이 함수가 필요한 경우는 거의 없습니다. 항상 GetCursorScreenPos()와
 * GetContentRegionAvail()을 사용하는 것을 고려하세요).
 *
 * @returns Current window including decorations: copied pixel dimensions {x:
 * width, y: height}.
 * @zh 包含装饰的当前窗口的像素尺寸副本 {x: width, y: height}。
 * @ja 装飾を含む現在のウィンドウのピクセル寸法を {x: width, y: height} としてコピーします。
 * @ko 장식을 포함한 현재 창의 픽셀 크기 복사본 {x: width, y: height}입니다.
 */
export function GetWindowSize(): ImVec2Value {
  return native.GetWindowSize();
}

/**
 * Get the current window width.
 *
 * @zh 获取当前窗口的宽度。
 * @ja 現在のウィンドウの幅を取得します。
 * @ko 현재 창 너비를 가져옵니다.
 *
 * @remarks
 * get current window width (IT IS UNLIKELY YOU EVER NEED TO USE THIS).
 *
 * Shortcut for GetWindowSize().x.
 * @zh
 * 获取当前窗口宽度（几乎不需要使用此函数）。
 *
 * 是 GetWindowSize().x 的快捷方式。
 * @ja
 * 現在のウィンドウの幅を取得します（これを使う必要はほぼありません）。
 *
 * GetWindowSize().x のショートカットです。
 * @ko
 * 현재 창 너비를 가져옵니다(이 함수가 필요한 경우는 거의 없습니다).
 *
 * GetWindowSize().x의 단축 함수입니다.
 *
 * @returns Current window width/height in pixels, including its decorations.
 * @zh 当前窗口包含装饰的像素宽度或高度。
 * @ja 装飾を含む現在のウィンドウのピクセル幅または高さです。
 * @ko 장식을 포함한 현재 창의 픽셀 너비 또는 높이입니다.
 */
export function GetWindowWidth(): number {
  return native.GetWindowWidth();
}

/**
 * Get the current window height.
 *
 * @zh 获取当前窗口的高度。
 * @ja 現在のウィンドウの高さを取得します。
 * @ko 현재 창 높이를 가져옵니다.
 *
 * @remarks
 * get current window height (IT IS UNLIKELY YOU EVER NEED TO USE THIS).
 *
 * Shortcut for GetWindowSize().y.
 * @zh
 * 获取当前窗口高度（几乎不需要使用此函数）。
 *
 * 是 GetWindowSize().y 的快捷方式。
 * @ja
 * 現在のウィンドウの高さを取得します（これを使う必要はほぼありません）。
 *
 * GetWindowSize().y のショートカットです。
 * @ko
 * 현재 창 높이를 가져옵니다(이 함수가 필요한 경우는 거의 없습니다).
 *
 * GetWindowSize().y의 단축 함수입니다.
 *
 * @returns Current window width/height in pixels, including its decorations.
 * @zh 当前窗口包含装饰的像素宽度或高度。
 * @ja 装飾を含む現在のウィンドウのピクセル幅または高さです。
 * @ko 장식을 포함한 현재 창의 픽셀 너비 또는 높이입니다.
 */
export function GetWindowHeight(): number {
  return native.GetWindowHeight();
}

/**
 * Set the position of the next window.
 *
 * @zh 设置下一个窗口的位置。
 * @ja 次のウィンドウの位置を設定します。
 * @ko 다음 창 위치를 설정합니다.
 *
 * @remarks
 * call before Begin().
 *
 * use pivot=(0.5,0.5) to center on given point, etc.
 *
 * - Prefer using SetNextXXX functions (before Begin) rather that SetXXX
 *   functions (after Begin).
 *
 * Implied pivot = { x: 0, y: 0 }
 * @zh
 * 在 Begin() 之前调用。
 *
 * 可使用 pivot=(0.5,0.5) 使窗口以给定点为中心等。
 *
 * 窗口操作：优先使用 Begin 之前的 SetNextXXX 函数，而不是 Begin 之后的 SetXXX 函数。
 *
 * 隐含参数：pivot = { x: 0, y: 0 }。
 * @ja
 * Begin() の前に呼び出してください。
 *
 * pivot=(0.5,0.5) で指定点を中心に配置するなどの使い方ができます。
 *
 * ウィンドウ操作：Begin 後の SetXXX 関数より、Begin 前の SetNextXXX 関数を優先してください。
 *
 * 暗黙の引数：pivot = { x: 0, y: 0 }。
 * @ko
 * Begin() 전에 호출하세요.
 *
 * pivot=(0.5,0.5)를 사용하면 주어진 점을 중심으로 배치할 수 있습니다.
 *
 * 창 조작: Begin 이후의 SetXXX보다 Begin 이전의 SetNextXXX 함수를 우선 사용하세요.
 *
 * 암묵적 인수: pivot = { x: 0, y: 0 }.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 *
 * @param cond - ImGuiCond controlling when the state is applied; 0 means
 * always.
 * @zh cond - 控制状态应用时机的 ImGuiCond；0 表示始终应用。
 * @ja cond - 状態を適用する条件の ImGuiCond です。0 は常に適用します。
 * @ko cond - 상태 적용 시점을 정하는 ImGuiCond입니다. 0은 항상 적용합니다.
 */
export function SetNextWindowPos(pos: ImVec2Like, cond: number = 0): void {
  native.SetNextWindowPos(pos, cond);
}

/**
 * Set next window position.
 *
 * @zh 设置下一个窗口的位置。
 * @ja 次のウィンドウの位置を設定します。
 * @ko 다음 창의 위치를 설정합니다.
 *
 * @remarks
 * call before Begin().
 *
 * use pivot=(0.5,0.5) to center on given point, etc.
 * @zh
 * 在 Begin() 之前调用。
 *
 * 可使用 pivot=(0.5,0.5) 使窗口以给定点为中心等。
 * @ja
 * Begin() の前に呼び出してください。
 *
 * pivot=(0.5,0.5) で指定点を中心に配置するなどの使い方ができます。
 * @ko
 * Begin() 전에 호출하세요.
 *
 * pivot=(0.5,0.5)를 사용하면 주어진 점을 중심으로 배치할 수 있습니다.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 *
 * @param cond - ImGuiCond controlling when the state is applied; 0 means
 * always.
 * @zh cond - 控制状态应用时机的 ImGuiCond；0 表示始终应用。
 * @ja cond - 状態を適用する条件の ImGuiCond です。0 は常に適用します。
 * @ko cond - 상태 적용 시점을 정하는 ImGuiCond입니다. 0은 항상 적용합니다.
 *
 * @param pivot - Normalized anchor within the window: (0,0) is top-left and
 * (0.5,0.5) centers it on pos.
 * @zh pivot - 窗口内的归一化锚点：(0,0) 为左上角，(0.5,0.5) 将窗口中心放在 pos。
 * @ja pivot - ウィンドウ内の正規化アンカーです。(0,0) は左上、(0.5,0.5) は中心を pos に置きます。
 * @ko pivot - 창 내부의 정규화 기준점입니다. (0,0)은 왼쪽 위이며 (0.5,0.5)는 중심을 pos에 놓습니다.
 */
export function SetNextWindowPosEx(
  pos: ImVec2Like,
  cond: number = 0,
  pivot: ImVec2Like = { x: 0, y: 0 },
): void {
  native.SetNextWindowPosEx(pos, cond, pivot);
}

/**
 * Set next window size.
 *
 * @zh 设置下一个窗口的尺寸。
 * @ja 次のウィンドウのサイズを設定します。
 * @ko 다음 창의 크기를 설정합니다.
 *
 * @remarks
 * set axis to 0.0 to force an auto-fit on this axis.
 *
 * call before Begin()
 * @zh
 * 将某轴设为 0.0 可强制该轴自动适应内容。
 *
 * 在 Begin() 之前调用。
 * @ja
 * 軸を 0.0 にするとその軸を強制的に自動調整します。
 *
 * Begin() の前に呼び出してください。
 * @ko
 * 축을 0.0로 지정하면 해당 축의 크기를 자동 맞춤으로 강제합니다.
 *
 * Begin() 전에 호출하세요.
 *
 * @param size - Window width and height in pixels; 0 on an axis requests
 * automatic fitting.
 * @zh size - 窗口像素宽高；某轴为 0 时自动适配该轴。
 * @ja size - ウィンドウのピクセル幅・高さです。0 の軸は内容に自動適合します。
 * @ko size - 창의 픽셀 너비와 높이입니다. 0인 축은 자동 맞춤입니다.
 *
 * @param cond - ImGuiCond controlling when the state is applied; 0 means
 * always.
 * @zh cond - 控制状态应用时机的 ImGuiCond；0 表示始终应用。
 * @ja cond - 状態を適用する条件の ImGuiCond です。0 は常に適用します。
 * @ko cond - 상태 적용 시점을 정하는 ImGuiCond입니다. 0은 항상 적용합니다.
 */
export function SetNextWindowSize(size: ImVec2Like, cond: number = 0): void {
  native.SetNextWindowSize(size, cond);
}

/**
 * Set next window size limits.
 *
 * @zh 设置下一个窗口的尺寸限制。
 * @ja 次のウィンドウのサイズ制限を設定します。
 * @ko 다음 창의 크기 제한을 설정합니다.
 *
 * @remarks
 * use 0.0 or 3.4028234663852886e+38 if you don't want limits.
 *
 * Use -1 for both min and max of same axis to preserve current size (which
 * itself is a constraint).
 *
 * The binding supports these numeric limits only. Upstream Dear ImGui also
 * supports size-constraint callbacks, but this API has no JavaScript callback
 * adapter.
 * @zh
 * 不需要限制时使用 0.0 或 3.4028234663852886e+38。
 *
 * 将同一轴的最小值和最大值都设为 -1，可保留当前尺寸（本身也是一种约束）。
 *
 * 此绑定仅支持上述数值限制。上游 Dear ImGui 还支持尺寸约束回调，但此 API 没有 JavaScript 回调适配器。
 * @ja
 * 制限しない場合は 0.0 または 3.4028234663852886e+38 を使ってください。
 *
 * 同じ軸の最小値と最大値を両方 -1 にすると現在のサイズを維持します（これ自体も制約です）。
 *
 * このバインディングでは上記の数値制限のみ対応します。上流の Dear ImGui にあるサイズ制約コールバック用の
 * JavaScript アダプターはありません。
 * @ko
 * 제한이 필요 없으면 0.0 또는 3.4028234663852886e+38를 사용하세요.
 *
 * 같은 축의 최솟값과 최댓값을 모두 -1로 설정하면 현재 크기를 유지합니다(이 자체도 제약입니다).
 *
 * 이 바인딩은 위 숫자 제한만 지원합니다. 상위 Dear ImGui의 크기 제한 콜백을 위한 JavaScript 어댑터는 없습니다.
 *
 * @param size_min - Minimum window dimensions in pixels. Use -1 for both limits
 * on an axis to preserve that dimension.
 * @zh size_min - 窗口的最小像素尺寸；同一轴的上下限都为 -1 时保持该轴尺寸。
 * @ja size_min - ウィンドウの最小ピクセル寸法です。同じ軸の上下限を -1 にするとその寸法を維持します。
 * @ko size_min - 창의 최소 픽셀 크기입니다. 한 축의 양쪽 제한을 -1로 설정하면 해당 크기를 유지합니다.
 *
 * @param size_max - Maximum window dimensions in pixels; 3.4028234663852886e+38
 * removes the
 * upper limit. Paired -1 limits preserve an axis.
 * @zh size_max - 窗口的最大像素尺寸；3.4028234663852886e+38 不限制上限，同一轴上下限都为 -1 时保持尺寸。
 * @ja size_max - 最大ピクセル寸法です。3.4028234663852886e+38 は上限なし、同じ軸の上下限が -1
 * なら寸法を維持します。
 * @ko size_max - 창의 최대 픽셀 크기입니다. 3.4028234663852886e+38는 상한을 없애며 한 축의 양쪽 -1은
 * 크기를 유지합니다.
 *
 * @param custom_callback - Leave null; window size-constraint callbacks are not
 * exposed to JavaScript. Passing a function throws a TypeError.
 * @zh custom_callback - 保持为 null；未向 JavaScript 开放窗口尺寸约束回调，传入函数会抛出 TypeError。
 * @ja custom_callback - null のままにします。サイズ制約コールバックは JavaScript に公開していません。
 * 関数を渡すと TypeError になります。
 * @ko custom_callback - null로 둡니다. 창 크기 제한 콜백은 JavaScript에 노출되지 않습니다.
 * 함수를 전달하면 TypeError가 발생합니다.
 *
 * @param custom_callback_data - Opaque callback user-data address; unused when
 * the callback is null.
 * @zh custom_callback_data - 不透明的回调用户数据地址；回调为 null 时不使用。
 * @ja custom_callback_data - コールバック用の不透明なユーザーデータアドレスです。コールバックが null なら使いません。
 * @ko custom_callback_data - 콜백 사용자 데이터 주소입니다. 콜백이 null이면 사용하지 않습니다.
 */
export function SetNextWindowSizeConstraints(
  size_min: ImVec2Like,
  size_max: ImVec2Like,
  custom_callback: null = null,
  custom_callback_data: bigint | null = null,
): void {
  native.SetNextWindowSizeConstraints(
    size_min,
    size_max,
    custom_callback,
    custom_callback_data,
  );
}

/**
 * Set the content size of the next window.
 *
 * @zh 设置下一个窗口的内容尺寸。
 * @ja 次のウィンドウのコンテンツサイズを設定します。
 * @ko 다음 창의 콘텐츠 크기를 설정합니다.
 *
 * @remarks
 * set next window content size (~ scrollable client area, which enforce the
 * range of scrollbars).
 *
 * Not including window decorations (title bar, menu bar, etc.) nor
 * WindowPadding.
 *
 * set an axis to 0.0 to leave it automatic.
 *
 * call before Begin()
 * @zh
 * 设置下一个窗口的内容尺寸（约等于可滚动客户区，决定滚动条范围）。
 *
 * 不包括窗口装饰（标题栏、菜单栏等）和 WindowPadding。
 *
 * 将某轴设为 0.0 可保持自动计算。
 *
 * 在 Begin() 之前调用。
 * @ja
 * 次のウィンドウの内容サイズ（ほぼスクロール可能なクライアント領域で、スクロールバーの範囲を決定）を設定します。
 *
 * ウィンドウ装飾（タイトルバー、メニューバーなど）や WindowPadding は含みません。
 *
 * 軸を 0.0 にすると自動のままにします。
 *
 * Begin() の前に呼び出してください。
 * @ko
 * 다음 창의 콘텐츠 크기(대략 스크롤 가능한 클라이언트 영역이며 스크롤바 범위를 결정)를 설정합니다.
 *
 * 창 장식(제목 표시줄, 메뉴 표시줄 등)과 WindowPadding은 포함하지 않습니다.
 *
 * 축을 0.0로 지정하면 자동 계산을 유지합니다.
 *
 * Begin() 전에 호출하세요.
 *
 * @param size - Scrollable content dimensions in pixels, excluding window
 * decorations and padding; 0 lets an axis be calculated automatically.
 * @zh size - 可滚动内容的像素尺寸，不含窗口装饰及内边距；0 自动计算对应轴。
 * @ja size - 装飾と余白を除くスクロール内容のピクセル寸法です。0 の軸は自動計算します。
 * @ko size - 창 장식과 패딩을 제외한 스크롤 콘텐츠 픽셀 크기입니다. 0인 축은 자동 계산합니다.
 */
export function SetNextWindowContentSize(size: ImVec2Like): void {
  native.SetNextWindowContentSize(size);
}

/**
 * Set next window collapsed state.
 *
 * @zh 设置下一个窗口的折叠状态。
 * @ja 次のウィンドウの折りたたみ状態を設定します。
 * @ko 다음 창의 접힘 상태를 설정합니다.
 *
 * @remarks
 * call before Begin()
 * @zh
 * 在 Begin() 之前调用。
 * @ja
 * Begin() の前に呼び出してください。
 * @ko
 * Begin() 전에 호출하세요.
 *
 * @param collapsed - Whether the window should be collapsed to its title bar.
 * @zh collapsed - 是否将窗口折叠到仅显示标题栏。
 * @ja collapsed - ウィンドウをタイトルバーだけに折りたたむかどうかです。
 * @ko collapsed - 창을 제목 표시줄만 보이도록 접을지 여부입니다.
 *
 * @param cond - ImGuiCond controlling when the state is applied; 0 means
 * always.
 * @zh cond - 控制状态应用时机的 ImGuiCond；0 表示始终应用。
 * @ja cond - 状態を適用する条件の ImGuiCond です。0 は常に適用します。
 * @ko cond - 상태 적용 시점을 정하는 ImGuiCond입니다. 0은 항상 적용합니다.
 */
export function SetNextWindowCollapsed(
  collapsed: boolean,
  cond: number = 0,
): void {
  native.SetNextWindowCollapsed(collapsed, cond);
}

/**
 * Set next window to be focused / top-most.
 *
 * @zh 使下一个窗口获得焦点并置于最上层。
 * @ja 次のウィンドウにフォーカスを与え、最前面にします。
 * @ko 다음 창에 포커스를 주고 맨 앞으로 가져옵니다.
 *
 * @remarks
 * call before Begin()
 * @zh
 * 在 Begin() 之前调用。
 * @ja
 * Begin() の前に呼び出してください。
 * @ko
 * Begin() 전에 호출하세요.
 */
export function SetNextWindowFocus(): void {
  native.SetNextWindowFocus();
}

/**
 * Set the scroll offsets of the next window.
 *
 * @zh 设置下一个窗口的滚动偏移量。
 * @ja 次のウィンドウのスクロール位置を設定します。
 * @ko 다음 창의 스크롤 오프셋을 설정합니다.
 *
 * @remarks
 * set next window scrolling value (use < 0.0 to not affect a given axis).
 * @zh
 * 设置下一个窗口的滚动值（使用 < 0.0 可不影响对应轴）。
 * @ja
 * 次のウィンドウのスクロール値を設定します（< 0.0 を使うとその軸には影響しません）。
 * @ko
 * 다음 창의 스크롤 값을 설정합니다(< 0.0를 사용하면 해당 축에 영향을 주지 않습니다).
 *
 * @param scroll - Target horizontal and vertical scroll offsets in pixels; -1
 * on an axis leaves that axis unchanged.
 * @zh scroll - 目标水平、垂直滚动像素偏移；某轴为 -1 时不更改该轴。
 * @ja scroll - 水平・垂直スクロール先のピクセル値です。軸を -1 にすると変更しません。
 * @ko scroll - 목표 가로 및 세로 스크롤 오프셋(픽셀)입니다. -1인 축은 변경하지 않습니다.
 */
export function SetNextWindowScroll(scroll: ImVec2Like): void {
  native.SetNextWindowScroll(scroll);
}

/**
 * Set next window background color alpha.
 *
 * @zh 设置下一个窗口背景色的 alpha。
 * @ja 次のウィンドウの背景色の alpha を設定します。
 * @ko 다음 창 배경색의 alpha를 설정합니다.
 *
 * @remarks
 * helper to easily override the Alpha component of
 * ImGuiCol.WindowBg/ChildBg/PopupBg.
 *
 * you may also use ImGuiWindowFlags.NoBackground.
 * @zh
 * 此辅助函数便于覆盖 ImGuiCol.WindowBg/ChildBg/PopupBg 的 Alpha 分量。
 *
 * 也可使用 ImGuiWindowFlags.NoBackground。
 * @ja
 * ImGuiCol.WindowBg/ChildBg/PopupBg の Alpha 成分を簡単に上書きするヘルパーです。
 *
 * ImGuiWindowFlags.NoBackground も使えます。
 * @ko
 * ImGuiCol.WindowBg/ChildBg/PopupBg의 Alpha 성분을 쉽게 덮어쓰는 헬퍼입니다.
 *
 * ImGuiWindowFlags.NoBackground를 사용할 수도 있습니다.
 *
 * @param alpha - Window background opacity, from 0 (transparent) to 1 (opaque).
 * @zh alpha - 窗口背景不透明度，0 为透明，1 为不透明。
 * @ja alpha - ウィンドウ背景の不透明度です。0 は透明、1 は不透明です。
 * @ko alpha - 창 배경 불투명도입니다. 0은 투명, 1은 불투명입니다.
 */
export function SetNextWindowBgAlpha(alpha: number): void {
  native.SetNextWindowBgAlpha(alpha);
}

/**
 * Set the current window position.
 *
 * @zh 设置当前窗口的位置。
 * @ja 現在のウィンドウの位置を設定します。
 * @ko 현재 창 위치를 설정합니다.
 *
 * @remarks
 * (not recommended) set current window position - call within Begin()/End().
 *
 * prefer using SetNextWindowPos(), as this may incur tearing and side-effects.
 * @zh
 * （不推荐）设置当前窗口位置；在 Begin()/End() 内调用。
 *
 * 优先使用 SetNextWindowPos()，因为此函数可能造成画面撕裂和副作用。
 * @ja
 * （非推奨）現在のウィンドウの位置を設定します。
 *
 * Begin()/End() 内で呼び出してください。
 *
 * ティアリングや副作用を起こす可能性があるため、SetNextWindowPos() を優先してください。
 * @ko
 * (권장하지 않음) 현재 창 위치를 설정합니다.
 *
 * Begin()/End() 안에서 호출하세요.
 *
 * 화면 찢어짐과 부작용이 생길 수 있으므로 SetNextWindowPos()를 우선 사용하세요.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 *
 * @param cond - ImGuiCond controlling when the state is applied; 0 means
 * always.
 * @zh cond - 控制状态应用时机的 ImGuiCond；0 表示始终应用。
 * @ja cond - 状態を適用する条件の ImGuiCond です。0 は常に適用します。
 * @ko cond - 상태 적용 시점을 정하는 ImGuiCond입니다. 0은 항상 적용합니다.
 */
export function SetWindowPos(pos: ImVec2Like, cond: number = 0): void {
  native.SetWindowPos(pos, cond);
}

/**
 * Set the current window size.
 *
 * @zh 设置当前窗口的尺寸。
 * @ja 現在のウィンドウのサイズを設定します。
 * @ko 현재 창 크기를 설정합니다.
 *
 * @remarks
 * (not recommended) set current window size - call within Begin()/End().
 *
 * set to { x: 0, y: 0 } to force an auto-fit.
 *
 * prefer using SetNextWindowSize(), as this may incur tearing and minor
 * side-effects.
 * @zh
 * （不推荐）设置当前窗口尺寸；在 Begin()/End() 内调用。
 *
 * 设为 { x: 0, y: 0 } 可强制自动适应内容。
 *
 * 优先使用 SetNextWindowSize()，因为此函数可能造成画面撕裂和轻微副作用。
 * @ja
 * （非推奨）現在のウィンドウのサイズを設定します。
 *
 * Begin()/End() 内で呼び出してください。
 *
 * { x: 0, y: 0 } にすると強制的に自動調整します。
 *
 * ティアリングや軽微な副作用を起こす可能性があるため、SetNextWindowSize() を優先してください。
 * @ko
 * (권장하지 않음) 현재 창 크기를 설정합니다.
 *
 * Begin()/End() 안에서 호출하세요.
 *
 * { x: 0, y: 0 }으로 설정하면 자동 맞춤을 강제합니다.
 *
 * 화면 찢어짐과 경미한 부작용이 생길 수 있으므로 SetNextWindowSize()를 우선 사용하세요.
 *
 * @param size - Window width and height in pixels; 0 on an axis requests
 * automatic fitting.
 * @zh size - 窗口像素宽高；某轴为 0 时自动适配该轴。
 * @ja size - ウィンドウのピクセル幅・高さです。0 の軸は内容に自動適合します。
 * @ko size - 창의 픽셀 너비와 높이입니다. 0인 축은 자동 맞춤입니다.
 *
 * @param cond - ImGuiCond controlling when the state is applied; 0 means
 * always.
 * @zh cond - 控制状态应用时机的 ImGuiCond；0 表示始终应用。
 * @ja cond - 状態を適用する条件の ImGuiCond です。0 は常に適用します。
 * @ko cond - 상태 적용 시점을 정하는 ImGuiCond입니다. 0은 항상 적용합니다.
 */
export function SetWindowSize(size: ImVec2Like, cond: number = 0): void {
  native.SetWindowSize(size, cond);
}

/**
 * Set the current window collapsed state.
 *
 * @zh 设置当前窗口的折叠状态。
 * @ja 現在のウィンドウの折りたたみ状態を設定します。
 * @ko 현재 창의 접힘 상태를 설정합니다.
 *
 * @remarks
 * (not recommended) set current window collapsed state.
 *
 * prefer using SetNextWindowCollapsed().
 * @zh
 * （不推荐）设置当前窗口的折叠状态。
 *
 * 优先使用 SetNextWindowCollapsed()。
 * @ja
 * （非推奨）現在のウィンドウの折りたたみ状態を設定します。
 *
 * SetNextWindowCollapsed() を優先してください。
 * @ko
 * (권장하지 않음) 현재 창의 접힘 상태를 설정합니다.
 *
 * SetNextWindowCollapsed()를 우선 사용하세요.
 *
 * @param collapsed - Whether the window should be collapsed to its title bar.
 * @zh collapsed - 是否将窗口折叠到仅显示标题栏。
 * @ja collapsed - ウィンドウをタイトルバーだけに折りたたむかどうかです。
 * @ko collapsed - 창을 제목 표시줄만 보이도록 접을지 여부입니다.
 *
 * @param cond - ImGuiCond controlling when the state is applied; 0 means
 * always.
 * @zh cond - 控制状态应用时机的 ImGuiCond；0 表示始终应用。
 * @ja cond - 状態を適用する条件の ImGuiCond です。0 は常に適用します。
 * @ko cond - 상태 적용 시점을 정하는 ImGuiCond입니다. 0은 항상 적용합니다.
 */
export function SetWindowCollapsed(collapsed: boolean, cond: number = 0): void {
  native.SetWindowCollapsed(collapsed, cond);
}

/**
 * Focus the current window and bring it to the front.
 *
 * @zh 聚焦当前窗口并将其置于最前方。
 * @ja 現在のウィンドウにフォーカスし、最前面へ移動します。
 * @ko 현재 창에 포커스를 주고 맨 앞으로 가져옵니다.
 *
 * @remarks
 * (not recommended) set current window to be focused / top-most.
 *
 * prefer using SetNextWindowFocus().
 * @zh
 * （不推荐）使当前窗口获得焦点并置于最上层。
 *
 * 优先使用 SetNextWindowFocus()。
 * @ja
 * （非推奨）現在のウィンドウにフォーカスを与え、最前面にします。
 *
 * SetNextWindowFocus() を優先してください。
 * @ko
 * (권장하지 않음) 현재 창에 포커스를 주고 맨 앞으로 가져옵니다.
 *
 * SetNextWindowFocus()를 우선 사용하세요.
 */
export function SetWindowFocus(): void {
  native.SetWindowFocus();
}

/**
 * Set the font scale for the current window.
 *
 * @zh 设置当前窗口的字体缩放比例。
 * @ja 現在のウィンドウのフォント倍率を設定します。
 * @ko 현재 창의 글꼴 배율을 설정합니다.
 *
 * @remarks
 * [OBSOLETE] set font scale.
 *
 * To scale fonts in all windows, adjust FontGlobalScale on the IO field view
 * returned by ImGui.viewImGuiIO(ioHandle).
 *
 * This is an old API!
 *
 * For correct scaling, prefer to reload font + rebuild ImFontAtlas + call
 * ImGui.Style_ScaleAllSizes(styleHandle, scaleFactor).
 * @zh
 * [已废弃] 设置字体缩放。
 *
 * 若要缩放所有窗口的字体，请调整 ImGui.viewImGuiIO(ioHandle) 返回的 IO 字段视图中的 FontGlobalScale。
 *
 * 这是旧 API！
 *
 * 要正确缩放，优先重新加载字体、重新构建 ImFontAtlas 并调用 ImGui.Style_ScaleAllSizes(styleHandle,
 * scaleFactor)。
 * @ja
 * [廃止] フォントの倍率を設定します。
 *
 * 全ウィンドウのフォント倍率は、ImGui.viewImGuiIO(ioHandle) が返す IO フィールドビューの FontGlobalScale
 * で調整します。
 *
 * これは古い API です！
 *
 * 正しく拡大縮小するには、フォントを再読み込みして ImFontAtlas を再構築し、
 * ImGui.Style_ScaleAllSizes(styleHandle, scaleFactor) を呼ぶことを推奨します。
 * @ko
 * [폐기됨] 글꼴 배율을 설정합니다.
 *
 * 모든 창의 글꼴 배율을 조절하려면 ImGui.viewImGuiIO(ioHandle)이 반환하는 IO 필드 뷰의
 * FontGlobalScale을 조정하세요.
 *
 * 오래된 API입니다!
 *
 * 올바르게 크기를 조절하려면 글꼴을 다시 로드하고 ImFontAtlas를 재구축한 뒤
 * ImGui.Style_ScaleAllSizes(styleHandle, scaleFactor)를 호출하는 방식을 권장합니다.
 *
 * @param scale - Scale multiplier applied to the existing font size or style
 * dimensions.
 * @zh scale - 应用于现有字体大小或样式尺寸的缩放倍数。
 * @ja scale - 既存のフォントサイズやスタイル寸法に適用する倍率です。
 * @ko scale - 기존 글꼴 크기 또는 스타일 치수에 적용하는 배율입니다.
 */
export function SetWindowFontScale(scale: number): void {
  native.SetWindowFontScale(scale);
}

/**
 * Set named window position.
 *
 * @zh 设置指定名称窗口的位置。
 * @ja 指定した名前のウィンドウの位置を設定します。
 * @ko 지정한 이름의 창 위치를 설정합니다.
 *
 * @param name - Window name used as its persistent ID and displayed title; ###
 * can separate the title from the ID.
 * @zh name - 窗口名称，用于持久 ID 和标题显示；可用 ### 将标题与 ID 分离。
 * @ja name - 永続 ID と表示タイトルに使うウィンドウ名です。### でタイトルと ID を分離できます。
 * @ko name - 영구 ID와 표시 제목에 사용하는 창 이름입니다. ###으로 제목과 ID를 분리할 수 있습니다.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 *
 * @param cond - ImGuiCond controlling when the state is applied; 0 means
 * always.
 * @zh cond - 控制状态应用时机的 ImGuiCond；0 表示始终应用。
 * @ja cond - 状態を適用する条件の ImGuiCond です。0 は常に適用します。
 * @ko cond - 상태 적용 시점을 정하는 ImGuiCond입니다. 0은 항상 적용합니다.
 */
export function SetWindowPosStr(
  name: string | Uint8Array,
  pos: ImVec2Like,
  cond: number = 0,
): void {
  native.SetWindowPosStr(name, pos, cond);
}

/**
 * Set named window size.
 *
 * @zh 设置指定名称窗口的尺寸。
 * @ja 指定した名前のウィンドウのサイズを設定します。
 * @ko 지정한 이름의 창 크기를 설정합니다.
 *
 * @remarks
 * set axis to 0.0 to force an auto-fit on this axis.
 * @zh
 * 将某轴设为 0.0 可强制该轴自动适应内容。
 * @ja
 * 軸を 0.0 にするとその軸を強制的に自動調整します。
 * @ko
 * 축을 0.0로 지정하면 해당 축의 자동 맞춤을 강제합니다.
 *
 * @param name - Window name used as its persistent ID and displayed title; ###
 * can separate the title from the ID.
 * @zh name - 窗口名称，用于持久 ID 和标题显示；可用 ### 将标题与 ID 分离。
 * @ja name - 永続 ID と表示タイトルに使うウィンドウ名です。### でタイトルと ID を分離できます。
 * @ko name - 영구 ID와 표시 제목에 사용하는 창 이름입니다. ###으로 제목과 ID를 분리할 수 있습니다.
 *
 * @param size - Window width and height in pixels; 0 on an axis requests
 * automatic fitting.
 * @zh size - 窗口像素宽高；某轴为 0 时自动适配该轴。
 * @ja size - ウィンドウのピクセル幅・高さです。0 の軸は内容に自動適合します。
 * @ko size - 창의 픽셀 너비와 높이입니다. 0인 축은 자동 맞춤입니다.
 *
 * @param cond - ImGuiCond controlling when the state is applied; 0 means
 * always.
 * @zh cond - 控制状态应用时机的 ImGuiCond；0 表示始终应用。
 * @ja cond - 状態を適用する条件の ImGuiCond です。0 は常に適用します。
 * @ko cond - 상태 적용 시점을 정하는 ImGuiCond입니다. 0은 항상 적용합니다.
 */
export function SetWindowSizeStr(
  name: string | Uint8Array,
  size: ImVec2Like,
  cond: number = 0,
): void {
  native.SetWindowSizeStr(name, size, cond);
}

/**
 * Set named window collapsed state.
 *
 * @zh 设置指定名称窗口的折叠状态。
 * @ja 指定した名前のウィンドウの折りたたみ状態を設定します。
 * @ko 지정한 이름의 창 접힘 상태를 설정합니다.
 *
 * @param name - Window name used as its persistent ID and displayed title; ###
 * can separate the title from the ID.
 * @zh name - 窗口名称，用于持久 ID 和标题显示；可用 ### 将标题与 ID 分离。
 * @ja name - 永続 ID と表示タイトルに使うウィンドウ名です。### でタイトルと ID を分離できます。
 * @ko name - 영구 ID와 표시 제목에 사용하는 창 이름입니다. ###으로 제목과 ID를 분리할 수 있습니다.
 *
 * @param collapsed - Whether the window should be collapsed to its title bar.
 * @zh collapsed - 是否将窗口折叠到仅显示标题栏。
 * @ja collapsed - ウィンドウをタイトルバーだけに折りたたむかどうかです。
 * @ko collapsed - 창을 제목 표시줄만 보이도록 접을지 여부입니다.
 *
 * @param cond - ImGuiCond controlling when the state is applied; 0 means
 * always.
 * @zh cond - 控制状态应用时机的 ImGuiCond；0 表示始终应用。
 * @ja cond - 状態を適用する条件の ImGuiCond です。0 は常に適用します。
 * @ko cond - 상태 적용 시점을 정하는 ImGuiCond입니다. 0은 항상 적용합니다.
 */
export function SetWindowCollapsedStr(
  name: string | Uint8Array,
  collapsed: boolean,
  cond: number = 0,
): void {
  native.SetWindowCollapsedStr(name, collapsed, cond);
}

/**
 * Set named window to be focused / top-most.
 *
 * @zh 使指定名称的窗口获得焦点并置于最上层。
 * @ja 指定した名前のウィンドウにフォーカスを与え、最前面にします。
 * @ko 지정한 이름의 창에 포커스를 주고 맨 앞으로 가져옵니다.
 *
 * @remarks
 * use null to remove focus.
 * @zh
 * 使用 null 可移除焦点。
 * @ja
 * null でフォーカスを解除します。
 * @ko
 * null을 사용하면 포커스를 제거합니다.
 *
 * @param name - Window name used as its persistent ID and displayed title; ###
 * can separate the title from the ID.
 * @zh name - 窗口名称，用于持久 ID 和标题显示；可用 ### 将标题与 ID 分离。
 * @ja name - 永続 ID と表示タイトルに使うウィンドウ名です。### でタイトルと ID を分離できます。
 * @ko name - 영구 ID와 표시 제목에 사용하는 창 이름입니다. ###으로 제목과 ID를 분리할 수 있습니다.
 */
export function SetWindowFocusStr(name: string | Uint8Array | null): void {
  native.SetWindowFocusStr(name);
}
