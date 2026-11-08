import { native } from '../internal/native';

/**
 * Begin a tooltip window.
 *
 * @zh 开始工具提示窗口。
 * @ja ツールチップウィンドウを開始します。
 * @ko 도구 설명 창을 시작합니다.
 *
 * @remarks
 * - Tooltips are windows following the mouse. They do not take focus away.
 *
 * - A tooltip window can contain items of any types.
 *
 * - SetTooltip() is more or less a shortcut for the 'if (BeginTooltip()) {
 *   Text(...); EndTooltip(); }' idiom (with a subtlety that it discard any
 *   previously submitted tooltip)
 *
 * begin/append a tooltip window.
 * @zh
 * 工具提示：
 *
 * - 工具提示是跟随鼠标的窗口，不会夺取焦点。
 *
 * - 工具提示窗口可包含任意类型的项目。
 *
 * - SetTooltip() 大致等同于 'if (BeginTooltip()) { Text(...); EndTooltip();
 *   }'（细微差别是它会丢弃此前提交的工具提示）。开始/追加工具提示窗口。
 * @ja
 * ツールチップ：
 *
 * - マウスに追従するウィンドウで、フォーカスを奪いません。
 *
 * - 任意の種類の項目を含められます。
 *
 * - SetTooltip() はほぼ 'if (BeginTooltip()) { Text(...); EndTooltip(); }'
 *   のショートカットです（以前に送信したツールチップを破棄するという微妙な違いがあります）。ツールチップウィンドウを開始／追加します。
 * @ko
 * 툴팁:
 *
 * - 마우스를 따라다니는 창이며 포커스를 빼앗지 않습니다.
 *
 * - 모든 종류의 항목을 포함할 수 있습니다.
 *
 * - SetTooltip()은 대략 'if (BeginTooltip()) { Text(...); EndTooltip(); }'의 단축
 *   함수입니다(이전에 제출한 툴팁을 버린다는 미묘한 차이가 있습니다). 툴팁 창을 시작하거나 내용을 추가합니다.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndTooltip() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndTooltip()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndTooltip() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndTooltip()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginTooltip(): boolean {
  return native.BeginTooltip();
}

/**
 * End the current tooltip window.
 *
 * @zh 结束当前工具提示窗口。
 * @ja 現在のツールチップウィンドウを終了します。
 * @ko 현재 도구 설명 창을 종료합니다.
 *
 * @remarks
 * only call EndTooltip() if BeginTooltip()/BeginItemTooltip() returns true!
 * @zh
 * 仅在 BeginTooltip()/BeginItemTooltip() 返回 true 时调用 EndTooltip()！
 * @ja
 * BeginTooltip()/BeginItemTooltip() が true を返した場合のみ EndTooltip() を呼んでください！
 * @ko
 * BeginTooltip()/BeginItemTooltip()이 true를 반환한 경우에만 EndTooltip()을 호출하세요!
 */
export function EndTooltip(): void {
  native.EndTooltip();
}

/**
 * Set a text-only tooltip.
 *
 * @zh 设置纯文本工具提示。
 * @ja テキストのみのツールチップを設定します。
 * @ko 텍스트 전용 툴팁을 설정합니다.
 *
 * @remarks
 * Often used after an `ImGui.IsItemHovered()` check.
 *
 * Override any previous call to SetTooltip().
 * @zh
 * 常用于 `ImGui.IsItemHovered()` 检查之后。
 *
 * 覆盖此前的 SetTooltip() 调用。
 * @ja
 * 通常は `ImGui.IsItemHovered()` の確認後に使います。
 *
 * 以前の SetTooltip() 呼び出しを上書きします。
 * @ko
 * 보통 `ImGui.IsItemHovered()` 검사 후 사용합니다.
 *
 * 이전 SetTooltip() 호출을 덮어씁니다.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 */
export function SetTooltipUnformatted(text: string | Uint8Array): void {
  native.SetTooltipUnformatted(text);
}

/**
 * Begin a tooltip when the preceding item is hovered.
 *
 * @zh 鼠标悬停于前一个条目时开始工具提示。
 * @ja 直前のアイテムにマウスがある場合にツールチップを開始します。
 * @ko 이전 항목 위에 마우스가 있으면 도구 설명을 시작합니다.
 *
 * @remarks
 * - BeginItemTooltip() is a shortcut for the 'if
 *   (IsItemHovered(ImGuiHoveredFlags.ForTooltip) && BeginTooltip())' idiom.
 *
 * - SetItemTooltip() is a shortcut for the 'if
 *   (IsItemHovered(ImGuiHoveredFlags.ForTooltip)) { SetTooltip(...); }' idiom.
 *
 * - Where 'ImGuiHoveredFlags.ForTooltip' itself is a shortcut to use
 *   'style.HoverFlagsForTooltipMouse' or 'style.HoverFlagsForTooltipNav'
 *   depending on active input type. For mouse it defaults to
 *   'ImGuiHoveredFlags.Stationary | ImGuiHoveredFlags.DelayShort'.
 *
 * begin/append a tooltip window if preceding item was hovered.
 * @zh
 * 工具提示：项目悬停时显示提示的辅助函数。
 *
 * - BeginItemTooltip() 等同于 'if (IsItemHovered(ImGuiHoveredFlags.ForTooltip) &&
 *   BeginTooltip())' 的快捷操作。
 *
 * - SetItemTooltip() 等同于 'if (IsItemHovered(ImGuiHoveredFlags.ForTooltip)) {
 *   SetTooltip(...); }' 的快捷操作。
 *
 * - 'ImGuiHoveredFlags.ForTooltip' 本身根据当前输入类型，快捷地使用
 *   'style.HoverFlagsForTooltipMouse' 或 'style.HoverFlagsForTooltipNav'；鼠标默认使用
 *   'ImGuiHoveredFlags.Stationary |
 *   ImGuiHoveredFlags.DelayShort'。当前一个项目被悬停时，开始/追加工具提示窗口。
 * @ja
 * ツールチップ：項目のホバー時に表示するヘルパー。
 *
 * - BeginItemTooltip() は 'if (IsItemHovered(ImGuiHoveredFlags.ForTooltip) &&
 *   BeginTooltip())' のショートカットです。
 *
 * - SetItemTooltip() は 'if (IsItemHovered(ImGuiHoveredFlags.ForTooltip)) {
 *   SetTooltip(...); }' のショートカットです。
 *
 * - 'ImGuiHoveredFlags.ForTooltip' 自体は現在の入力種別に応じて
 *   'style.HoverFlagsForTooltipMouse' または 'style.HoverFlagsForTooltipNav'
 *   を使うショートカットです。マウスでは既定で 'ImGuiHoveredFlags.Stationary |
 *   ImGuiHoveredFlags.DelayShort' を使います。直前の項目がホバーされていればツールチップウィンドウを開始／追加します。
 * @ko
 * 툴팁: 항목 위에 마우스를 올리면 툴팁을 표시하는 헬퍼.
 *
 * - BeginItemTooltip()은 'if (IsItemHovered(ImGuiHoveredFlags.ForTooltip) &&
 *   BeginTooltip())'의 단축 함수입니다.
 *
 * - SetItemTooltip()은 'if (IsItemHovered(ImGuiHoveredFlags.ForTooltip)) {
 *   SetTooltip(...); }'의 단축 함수입니다.
 *
 * - 'ImGuiHoveredFlags.ForTooltip' 자체는 현재 입력 유형에 따라
 *   'style.HoverFlagsForTooltipMouse' 또는 'style.HoverFlagsForTooltipNav'를 사용하는
 *   단축 플래그입니다. 마우스의 기본값은 'ImGuiHoveredFlags.Stationary |
 *   ImGuiHoveredFlags.DelayShort'입니다. 이전 항목이 호버 상태이면 툴팁 창을 시작하거나 내용을 추가합니다.
 *
 * @returns True when the last item meets the tooltip hover policy and tooltip
 * contents may be submitted. Call EndTooltip() only when true.
 * @zh 最后项满足提示悬停策略且可以提交提示内容时为 true。仅为 true 时调用 EndTooltip()。
 * @ja 直前の項目がツールチップのホバー条件を満たす場合は true です。true の場合だけ内容を描き EndTooltip() を呼びます。
 * @ko 마지막 항목이 툴팁 호버 정책을 만족하여 내용을 제출할 수 있으면 true입니다. true일 때만 EndTooltip()을
 * 호출합니다.
 */
export function BeginItemTooltip(): boolean {
  return native.BeginItemTooltip();
}

/**
 * Set a text-only tooltip if preceding item was hovered.
 *
 * @zh 当前一个项目被悬停时，设置纯文本工具提示。
 * @ja 直前の項目がホバーされていればテキストのみのツールチップを設定します。
 * @ko 이전 항목이 호버 상태이면 텍스트 전용 툴팁을 설정합니다.
 *
 * @remarks
 * override any previous call to SetTooltip().
 * @zh
 * 覆盖此前的 SetTooltip() 调用。
 * @ja
 * 以前の SetTooltip() 呼び出しを上書きします。
 * @ko
 * 이전 SetTooltip() 호출을 덮어씁니다.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 */
export function SetItemTooltipUnformatted(text: string | Uint8Array): void {
  native.SetItemTooltipUnformatted(text);
}
