import { native } from '../internal/native';
import type { ImVec2Like, ImVec2Value } from '../types';

/**
 * Begin a scope that can disable user interaction.
 *
 * @zh 开始可禁用用户交互的作用域。
 * @ja ユーザー操作を無効にできるスコープを開始します。
 * @ko 사용자 상호작용을 비활성화할 수 있는 범위를 시작합니다.
 *
 * @remarks
 * - Disable all user interactions and dim items visuals (applying
 *   style.DisabledAlpha over current colors)
 * - Those can be nested but it cannot be used to enable an already disabled
 *   section (a single BeginDisabled(true) in the stack is enough to keep
 *   everything disabled)
 * - Tooltips windows by exception are opted out of disabling.
 *
 * - BeginDisabled(false)/EndDisabled() essentially does nothing but is provided
 *   to facilitate use of boolean expressions (as a micro-optimization: if you
 *   have tens of thousands of BeginDisabled(false)/EndDisabled() pairs, you
 *   might want to reformulate your code to avoid making those calls)
 * @zh
 * 禁用 [BETA API]。
 *
 * - 禁用所有用户交互，并使项目外观变暗（将 style.DisabledAlpha 应用于当前颜色）。
 *
 * - 可以嵌套，但不能用来启用已禁用的区域（栈中只需一个 BeginDisabled(true) 即可保持全部禁用）。
 *
 * - 提示框窗口例外，不受禁用影响。
 *
 * - BeginDisabled(false)/EndDisabled() 实际上不做任何操作，提供它是为了方便使用布尔表达式（微优化提示：如果有数万对
 *   BeginDisabled(false)/EndDisabled()，可考虑调整代码以避免这些调用）。
 * @ja
 * 無効化 [BETA API]。
 *
 * - すべてのユーザー操作を無効にし、項目を薄く表示します（現在の色に style.DisabledAlpha を適用）。
 *
 * - 入れ子にできますが、すでに無効な領域を有効化することはできません（スタック内に BeginDisabled(true) が 1
 *   つあれば全体が無効のままです）。
 *
 * - ツールチップウィンドウは例外で、無効化の対象外です。
 *
 * - BeginDisabled(false)/EndDisabled()
 *   は実質的に何もしませんが、ブール式を使いやすくするために用意されています（微小な最適化：これらの組が数万個ある場合は、呼び出しを避けるようコードを
 *   組み直すことを検討してください）。
 * @ko
 * 비활성화 [BETA API].
 *
 * - 모든 사용자 상호작용을 비활성화하고 항목을 흐리게 표시합니다(현재 색상에 style.DisabledAlpha 적용).
 *
 * - 중첩할 수 있지만 이미 비활성화된 영역을 활성화할 수는 없습니다(스택에 BeginDisabled(true)가 하나만 있어도 전체가
 *   비활성 상태로 유지됨).
 *
 * - 툴팁 창은 예외적으로 비활성화 대상에서 제외됩니다.
 *
 * - BeginDisabled(false)/EndDisabled()는 사실상 아무것도 하지 않지만 불리언 표현식을 편리하게 사용하도록
 *   제공됩니다(미세 최적화: 이 호출 쌍이 수만 개라면 호출을 피하도록 코드를 재구성하는 것을 고려하세요).
 *
 * @param disabled - True disables interaction and dims following items until
 * EndDisabled(); nested disabled scopes remain disabled.
 * @zh disabled - true 会禁用交互并淡化后续项，直至 EndDisabled()；嵌套禁用作用域仍保持禁用。
 * @ja disabled - true なら EndDisabled() まで操作を無効化し薄く表示します。入れ子の無効状態は維持されます。
 * @ko disabled - true이면 EndDisabled()까지 상호작용을 막고 흐리게 표시합니다. 중첩된 비활성 상태는 유지됩니다.
 */
export function BeginDisabled(disabled: boolean = true): void {
  native.BeginDisabled(disabled);
}

/**
 * End a BeginDisabled scope and restore the previous interaction and alpha
 * state.
 *
 * @zh 结束 BeginDisabled 作用域，恢复先前的交互和透明度状态。
 * @ja BeginDisabled のスコープを終了し、以前の操作可否とアルファ状態を復元します。
 * @ko BeginDisabled 범위를 끝내고 이전 상호작용 및 알파 상태를 복원합니다.
 */
export function EndDisabled(): void {
  native.EndDisabled();
}

/**
 * Push a clipping rectangle for rendering and interaction.
 *
 * @zh 压入用于绘制和交互的裁剪矩形。
 * @ja 描画と操作に適用するクリッピング矩形を積みます。
 * @ko 렌더링과 상호작용에 적용할 클리핑 사각형을 스택에 넣습니다.
 *
 * @remarks
 * - Mouse hovering is affected by `ImGui.PushClipRect()` calls, unlike direct
 *   calls to `ImGui.ImDrawList_PushClipRect()` which only affect rendering.
 * @zh
 * 裁剪。
 *
 * - `ImGui.PushClipRect()` 会影响鼠标悬停判定；`ImGui.ImDrawList_PushClipRect()` 只影响渲染。
 * @ja
 * クリッピング。
 *
 * - `ImGui.PushClipRect()` はマウスのホバー判定にも影響しますが、`ImGui.ImDrawList_PushClipRect()`
 *   の直接呼び出しは描画のみに影響します。
 * @ko
 * 클리핑.
 *
 * - `ImGui.PushClipRect()` 호출은 마우스 호버 판정에 영향을 주지만
 *   `ImGui.ImDrawList_PushClipRect()` 직접
 *   호출은 렌더링에만 영향을 줍니다.
 *
 * @param clip_rect_min - Top-left corner of the rectangle in absolute screen
 * coordinates.
 * @zh clip_rect_min - 矩形左上角，使用绝对屏幕坐标。
 * @ja clip_rect_min - 矩形の左上を絶対スクリーン座標で指定します。
 * @ko clip_rect_min - 사각형 왼쪽 위의 절대 화면 좌표입니다.
 *
 * @param clip_rect_max - Bottom-right corner of the rectangle in absolute
 * screen coordinates.
 * @zh clip_rect_max - 矩形右下角，使用绝对屏幕坐标。
 * @ja clip_rect_max - 矩形の右下を絶対スクリーン座標で指定します。
 * @ko clip_rect_max - 사각형 오른쪽 아래의 절대 화면 좌표입니다.
 *
 * @param intersect_with_current_clip_rect - Whether to intersect the rectangle
 * with the current clipping rectangle.
 * @zh intersect_with_current_clip_rect - 是否将矩形与当前裁剪矩形求交。
 * @ja intersect_with_current_clip_rect - 現在のクリップ矩形との共通領域を使うかどうかです。
 * @ko intersect_with_current_clip_rect - 현재 클리핑 사각형과의 교집합을 사용할지 여부입니다.
 */
export function PushClipRect(
  clip_rect_min: ImVec2Like,
  clip_rect_max: ImVec2Like,
  intersect_with_current_clip_rect: boolean,
): void {
  native.PushClipRect(
    clip_rect_min,
    clip_rect_max,
    intersect_with_current_clip_rect,
  );
}

/**
 * Restore the window clipping rectangle saved by PushClipRect for drawing and
 * hit testing.
 *
 * @zh 恢复 PushClipRect 保存的窗口裁剪矩形，用于绘制和命中测试。
 * @ja PushClipRect が保存した、描画とヒットテスト用のウィンドウのクリップ矩形を復元します。
 * @ko PushClipRect가 저장한 그리기 및 적중 검사용 창 클리핑 사각형을 복원합니다.
 */
export function PopClipRect(): void {
  native.PopClipRect();
}

/**
 * Give the last item default focus in a newly appearing window.
 *
 * @zh 将最后一个条目设为新出现窗口的默认焦点。
 * @ja 新しく表示されるウィンドウで最後のアイテムを既定のフォーカス先にします。
 * @ko 새로 나타나는 창에서 마지막 항목을 기본 포커스로 설정합니다.
 *
 * @remarks
 * make last item the default focused item of a newly appearing window.
 * @zh
 * 焦点、激活。
 *
 * 将最后一个项目设为新出现窗口的默认聚焦项目。
 * @ja
 * フォーカスとアクティブ化。
 *
 * 最後の項目を、新しく現れたウィンドウの既定のフォーカス項目にします。
 * @ko
 * 포커스와 활성화.
 *
 * 마지막 항목을 새로 나타난 창의 기본 포커스 항목으로 설정합니다.
 */
export function SetItemDefaultFocus(): void {
  native.SetItemDefaultFocus();
}

/**
 * Request keyboard focus for the next widget.
 *
 * @zh 请求将键盘焦点移至下一个控件。
 * @ja 次のウィジェットへのキーボードフォーカスを要求します。
 * @ko 다음 위젯에 키보드 포커스를 요청합니다.
 *
 * @remarks
 * This no-argument helper uses `offset = 0` and focuses the next widget.
 *
 * Use `SetKeyboardFocusHereEx(offset)` to select another target: positive
 * offsets address subcomponents of a multi-component widget, and `-1` selects
 * the previous widget.
 * @zh
 * 此无参数辅助函数固定使用 `offset = 0`，将焦点设到下一个控件。
 *
 * 要选择其他目标，请调用 `SetKeyboardFocusHereEx(offset)`：正偏移用于多组件控件的子组件，`-1` 选择上一个控件。
 * @ja
 * この引数なしのヘルパーは `offset = 0` を使い、次のウィジェットにフォーカスします。
 *
 * 別の対象には `SetKeyboardFocusHereEx(offset)` を使います。正の値は複数コンポーネントの子要素、`-1`
 * は前のウィジェットを指定します。
 * @ko
 * 이 인수 없는 헬퍼는 `offset = 0`으로 다음 위젯에 포커스를 둡니다.
 *
 * 다른 대상을 선택하려면 `SetKeyboardFocusHereEx(offset)`를 사용하세요. 양수 오프셋은 다중 컴포넌트의 하위
 * 요소를, `-1`은 이전 위젯을 지정합니다.
 */
export function SetKeyboardFocusHere(): void {
  native.SetKeyboardFocusHere();
}

/**
 * Focus keyboard on the next widget.
 *
 * @zh 将键盘焦点设到下一个控件。
 * @ja 次のウィジェットにキーボードフォーカスを設定します。
 * @ko 다음 위젯에 키보드 포커스를 설정합니다.
 *
 * @remarks
 * Use positive 'offset' to access sub components of a multiple component
 * widget.
 *
 * Use -1 to access previous widget.
 * @zh
 * 使用正数 'offset' 访问多组件控件的子组件。
 *
 * 使用 -1 访问上一个控件。
 * @ja
 * 正の 'offset' で複数コンポーネントを持つウィジェットのサブコンポーネントに、-1 で前のウィジェットにアクセスします。
 * @ko
 * 양수 'offset'으로 다중 컴포넌트 위젯의 하위 컴포넌트에 접근합니다.
 *
 * -1은 이전 위젯에 접근합니다.
 *
 * @param offset - Item offset for keyboard focus: 0 targets the next item, -1
 * the previous item; positive values skip components.
 * @zh offset - 键盘焦点的项偏移：0 为下一项，-1 为前一项，正值跳过相应分量。
 * @ja offset - フォーカス対象の項目差分です。0 は次、-1 は直前、正の値は成分を飛ばします。
 * @ko offset - 키보드 포커스 항목 오프셋입니다. 0은 다음 항목, -1은 이전 항목이며 양수는 성분을 건너뜁니다.
 */
export function SetKeyboardFocusHereEx(offset: number = 0): void {
  native.SetKeyboardFocusHereEx(offset);
}

/**
 * Set keyboard and gamepad navigation cursor visibility.
 *
 * @zh 设置键盘和游戏手柄导航光标的可见性。
 * @ja キーボードとゲームパッドのナビゲーションカーソルの表示を設定します。
 * @ko 키보드 및 게임패드 탐색 커서의 표시 여부를 설정합니다.
 *
 * @remarks
 * alter visibility of keyboard/gamepad cursor.
 *
 * by default: show when using an arrow key, hide when clicking with mouse.
 * @zh
 * 键盘/手柄导航。
 *
 * 修改键盘/手柄光标的可见性。
 *
 * 默认：使用方向键时显示，鼠标点击时隐藏。
 * @ja
 * キーボード/ゲームパッドのナビゲーション。
 *
 * キーボード/ゲームパッド用カーソルの表示を変更します。
 *
 * 既定では矢印キーを使うと表示し、マウスでクリックすると非表示にします。
 * @ko
 * 키보드/게임패드 탐색.
 *
 * 키보드/게임패드 커서의 표시 여부를 변경합니다.
 *
 * 기본적으로 방향 키 사용 시 표시하고 마우스 클릭 시 숨깁니다.
 *
 * @param visible - Whether the keyboard/gamepad navigation cursor is visible.
 * @zh visible - 是否显示键盘或手柄导航光标。
 * @ja visible - キーボード・ゲームパッドのナビゲーションカーソルを表示するかどうかです。
 * @ko visible - 키보드 또는 게임패드 탐색 커서 표시 여부입니다.
 */
export function SetNavCursorVisible(visible: boolean): void {
  native.SetNavCursorVisible(visible);
}

/**
 * Allow a later item to overlap the next item.
 *
 * @zh 允许后续条目覆盖下一个条目。
 * @ja 次のアイテムに後続のアイテムが重なることを許可します。
 * @ko 이후 항목이 다음 항목과 겹치도록 허용합니다.
 *
 * @remarks
 * allow next item to be overlapped by a subsequent item.
 *
 * Useful with invisible buttons, selectable, treenode covering an area where
 * subsequent items may need to be added.
 *
 * Note that both Selectable() and TreeNode() have dedicated flags doing this.
 * @zh
 * 重叠模式。
 *
 * 允许下一个项目被后续项目覆盖。
 *
 * 适用于覆盖某一区域的不可见按钮、可选项、树节点，而后续还需在该区域添加项目的情况。
 *
 * 注意 Selectable() 和 TreeNode() 均有专用标志实现此行为。
 * @ja
 * 重なりモード。
 *
 * 次の項目に後続の項目が重なることを許可します。
 *
 * 不可視ボタン、選択可能項目、ツリーノードが覆う領域に後から項目を追加したい場合に有用です。
 *
 * Selectable() と TreeNode() にはそれぞれ専用フラグもあります。
 * @ko
 * 겹침 모드.
 *
 * 다음 항목 위에 후속 항목이 겹칠 수 있게 합니다.
 *
 * 보이지 않는 버튼, 선택 가능 항목, 트리 노드가 차지하는 영역에 후속 항목을 추가해야 할 때 유용합니다.
 *
 * Selectable()과 TreeNode()에는 이를 위한 전용 플래그도 있습니다.
 */
export function SetNextItemAllowOverlap(): void {
  native.SetNextItemAllowOverlap();
}

/**
 * Test whether the last item is hovered.
 *
 * @zh 判断鼠标是否悬停于最后一个条目。
 * @ja 最後のアイテム上にマウスがあるかを調べます。
 * @ko 마지막 항목 위에 마우스가 있는지 확인합니다.
 *
 * @remarks
 * - Most of the functions are referring to the previous Item that has been
 *   submitted.
 *
 * - See Demo Window under "Widgets->Querying Status" for an interactive
 *   visualization of most of those functions.
 *
 * is the last item hovered? (and usable, aka not blocked by a popup, etc.). See
 * ImGuiHoveredFlags for more options.
 * @zh
 * 项目/控件工具与查询函数。
 *
 * - 大多数函数针对上一个已提交的项目。
 *
 * - 可在演示窗口“Widgets->Querying
 *   Status”中交互式查看大多数函数的效果。最后一个项目是否处于悬停状态（且可用，即未被弹出窗口等阻挡）？更多选项见
 *   ImGuiHoveredFlags。
 * @ja
 * 項目/ウィジェットのユーティリティと照会関数。
 *
 * - ほとんどの関数は直前に送信した項目を対象にします。
 *
 * - 多くの関数の動作をデモウィンドウの「Widgets->Querying
 *   Status」で対話的に確認できます。最後の項目にホバーしていますか（かつ使用可能、つまりポップアップなどに遮られていない状態）？追加のオプションは
 *   ImGuiHoveredFlags を参照してください。
 * @ko
 * 항목/위젯 유틸리티 및 조회 함수.
 *
 * - 대부분의 함수는 직전에 제출한 항목을 대상으로 합니다.
 *
 * - 데모 창의 "Widgets->Querying Status"에서 대부분 함수의 동작을 대화형으로 확인할 수 있습니다. 마지막 항목에
 *   마우스가 올라가 있습니까(또한 사용 가능, 즉 팝업 등에 의해 가려지지 않은 상태)? 추가 옵션은 ImGuiHoveredFlags를
 *   참조하세요.
 *
 * @param flags - ImGuiHoveredFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiHoveredFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiHoveredFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiHoveredFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the last submitted item is hovered under the requested hover
 * policy; false otherwise.
 * @zh 最后提交项按指定悬停策略处于悬停状态时为 true，否则为 false。
 * @ja 直前の項目が指定条件でホバーされている場合は true、それ以外は false です。
 * @ko 마지막 제출 항목이 지정 조건에 따라 호버되면 true이며 아니면 false입니다.
 */
export function IsItemHovered(flags: number = 0): boolean {
  return native.IsItemHovered(flags);
}

/**
 * Test whether the last item is active.
 *
 * @zh 判断最后一个条目是否处于活动状态。
 * @ja 最後のアイテムがアクティブかを調べます。
 * @ko 마지막 항목이 활성 상태인지 확인합니다.
 *
 * @remarks
 * is the last item active?
 *
 * (e.g. button being held, text field being edited. This will continuously
 * return true while holding mouse button on an item. Items that don't interact
 * will always return false)
 * @zh
 * 最后一个项目是否处于激活状态（例如按钮正被按住、文本框正在编辑）？
 *
 * 在项目上按住鼠标按钮期间持续返回 true。
 *
 * 没有交互的项目始终返回 false。
 * @ja
 * 最後の項目はアクティブですか（ボタンを押し続けている、テキスト欄を編集中など）？
 *
 * 項目上でマウスボタンを押している間は true を返し続けます。
 *
 * 操作できない項目は常に false を返します。
 * @ko
 * 마지막 항목이 활성 상태입니까(예: 버튼을 누르고 있거나 텍스트 필드를 편집 중)?
 *
 * 항목 위에서 마우스 버튼을 누르고 있는 동안 계속 true를 반환합니다.
 *
 * 상호작용이 없는 항목은 항상 false를 반환합니다.
 *
 * @returns True if the last submitted item is currently active (being
 * interacted with); false otherwise.
 * @zh 最后提交项当前活动，即正在被操作时为 true，否则为 false。
 * @ja 直前の項目を現在操作している場合は true、それ以外は false です。
 * @ko 마지막 제출 항목이 현재 조작 중이면 true이며 아니면 false입니다.
 */
export function IsItemActive(): boolean {
  return native.IsItemActive();
}

/**
 * Is the last item focused for keyboard/gamepad navigation?
 *
 * @zh 最后一个项目是否获得键盘/手柄导航焦点？
 * @ja 最後の項目にキーボード/ゲームパッドのナビゲーションフォーカスがありますか？
 * @ko 마지막 항목에 키보드/게임패드 탐색 포커스가 있습니까?
 *
 * @returns True if the last submitted item has keyboard/gamepad navigation
 * focus; false otherwise.
 * @zh 最后提交项具有键盘或手柄导航焦点时为 true，否则为 false。
 * @ja 直前の項目にキーボード・ゲームパッドのフォーカスがある場合は true、それ以外は false です。
 * @ko 마지막 제출 항목에 키보드 또는 게임패드 탐색 포커스가 있으면 true이며 아니면 false입니다.
 */
export function IsItemFocused(): boolean {
  return native.IsItemFocused();
}

/**
 * Test whether the left mouse button was pressed while hovering the last item.
 *
 * @zh 检查悬停在上一个控件时是否按下了鼠标左键。
 * @ja 直前の項目にホバーした状態でマウスの左ボタンが押されたかを調べます。
 * @ko 마지막 항목 위에 마우스가 있을 때 왼쪽 버튼이 눌렸는지 확인합니다.
 *
 * @remarks
 * is the last item hovered and mouse clicked on?
 *
 * (**)  == IsMouseClicked(mouse_button) && IsItemHovered()Important.
 *
 * (**) this is NOT equivalent to the behavior of e.g. Button().
 *
 * Read comments in function definition.
 *
 * Implied mouse_button = 0
 * @zh
 * 最后一个项目是否处于悬停状态并被鼠标点击？
 *
 * (**) == IsMouseClicked(mouse_button) && IsItemHovered()。
 *
 * 重要：(**) 这不等同于 Button() 等控件的行为。
 *
 * 请阅读函数定义中的注释。
 *
 * 隐含参数：mouse_button = 0。
 * @ja
 * 最後の項目にホバーし、マウスでクリックしましたか？
 *
 * (**) == IsMouseClicked(mouse_button) && IsItemHovered()。
 *
 * 重要：(**) これは Button() などの動作と同等ではありません。
 *
 * 関数定義のコメントを読んでください。
 *
 * 暗黙の引数：mouse_button = 0。
 * @ko
 * 마지막 항목에 마우스가 올라가 있고 클릭되었습니까?
 *
 * (**) == IsMouseClicked(mouse_button) && IsItemHovered().
 *
 * 중요: (**) 이는 Button() 등의 동작과 같지 않습니다.
 *
 * 함수 정의의 주석을 읽으세요.
 *
 * 암묵적 인수: mouse_button = 0.
 *
 * @returns True if the mouse button was clicked while the last item was hovered
 * this frame (not equivalent to Button activation); false otherwise.
 * @zh 本帧鼠标在最后项上悬停并点击按键（不等同于 Button 激活）时为 true，否则为 false。
 * @ja このフレームで直前の項目をホバー中にマウスを押した（Button の操作判定とは異なる）場合は true、それ以外は false です。
 * @ko 이번 프레임에 마지막 항목 위에서 마우스를 눌렀으면(Button 활성화와는 다름) true이며 아니면 false입니다.
 */
export function IsItemClicked(): boolean {
  return native.IsItemClicked();
}

/**
 * Test whether the last item was clicked while hovered.
 *
 * @zh 判断最后一个条目是否在悬停时被点击。
 * @ja 最後のアイテム上でマウスがクリックされたかを調べます。
 * @ko 마지막 항목 위에서 마우스를 클릭했는지 확인합니다.
 *
 * @remarks
 * is the last item hovered and mouse clicked on?
 *
 * (**)  == IsMouseClicked(mouse_button) && IsItemHovered()Important.
 *
 * (**) this is NOT equivalent to the behavior of e.g. Button().
 *
 * Read comments in function definition.
 * @zh
 * 最后一个项目是否处于悬停状态并被鼠标点击？
 *
 * (**) == IsMouseClicked(mouse_button) && IsItemHovered()。
 *
 * 重要：(**) 这不等同于 Button() 等控件的行为。
 *
 * 请阅读函数定义中的注释。
 * @ja
 * 最後の項目にホバーし、マウスでクリックしましたか？
 *
 * (**) == IsMouseClicked(mouse_button) && IsItemHovered()。
 *
 * 重要：(**) これは Button() などの動作と同等ではありません。
 *
 * 関数定義のコメントを読んでください。
 * @ko
 * 마지막 항목에 마우스가 올라가 있고 클릭되었습니까?
 *
 * (**) == IsMouseClicked(mouse_button) && IsItemHovered().
 *
 * 중요: (**) 이는 Button() 등의 동작과 같지 않습니다.
 *
 * 함수 정의의 주석을 읽으세요.
 *
 * @param mouse_button - ImGuiMouseButton index: 0 left, 1 right, 2 middle.
 * @zh mouse_button - ImGuiMouseButton 索引：0 左键、1 右键、2 中键。
 * @ja mouse_button - ImGuiMouseButton の番号です。0 は左、1 は右、2 は中央です。
 * @ko mouse_button - ImGuiMouseButton 인덱스입니다. 0은 왼쪽, 1은 오른쪽, 2는 가운데입니다.
 *
 * @returns True if the mouse button was clicked while the last item was hovered
 * this frame (not equivalent to Button activation); false otherwise.
 * @zh 本帧鼠标在最后项上悬停并点击按键（不等同于 Button 激活）时为 true，否则为 false。
 * @ja このフレームで直前の項目をホバー中にマウスを押した（Button の操作判定とは異なる）場合は true、それ以外は false です。
 * @ko 이번 프레임에 마지막 항목 위에서 마우스를 눌렀으면(Button 활성화와는 다름) true이며 아니면 false입니다.
 */
export function IsItemClickedEx(mouse_button: number = 0): boolean {
  return native.IsItemClickedEx(mouse_button);
}

/**
 * Is the last item visible?
 *
 * @zh 最后一个项目是否可见（项目可能因裁剪/滚动而不可见）？
 * @ja 最後の項目は表示されていますか（クリッピング/スクロールで見えない場合があります）？
 * @ko 마지막 항목이 보입니까(클리핑/스크롤로 보이지 않을 수 있음)?
 *
 * @remarks
 * (items may be out of sight because of clipping/scrolling)
 * @zh
 * 最后一个项目是否可见（项目可能因裁剪/滚动而不可见）？
 * @ja
 * 最後の項目は表示されていますか（クリッピング/スクロールで見えない場合があります）？
 * @ko
 * 마지막 항목이 보입니까(클리핑/스크롤로 보이지 않을 수 있음)?
 *
 * @returns True if the last submitted item overlaps the visible clipping
 * region; false otherwise.
 * @zh 最后提交项与可见裁剪区域相交时为 true，否则为 false。
 * @ja 直前の項目が可視クリップ領域と重なる場合は true、それ以外は false です。
 * @ko 마지막 제출 항목이 표시 클립 영역과 겹치면 true이며 아니면 false입니다.
 */
export function IsItemVisible(): boolean {
  return native.IsItemVisible();
}

/**
 * Did the last item modify its underlying value this frame?
 *
 * @zh 最后一个项目是否在本帧修改了其底层值，或被按下？
 * @ja 最後の項目はこのフレームで保持する値を変更した、または押されましたか？
 * @ko 마지막 항목이 이번 프레임에 내부 값을 변경했거나 눌렸습니까?
 *
 * @remarks
 * or was pressed?
 *
 * This is generally the same as the "bool" return value of many widgets.
 * @zh
 * 这通常与许多控件的 "bool" 返回值相同。
 * @ja
 * 通常、多くのウィジェットの "bool" 戻り値と同じです。
 * @ko
 * 보통 여러 위젯의 "bool" 반환값과 같습니다.
 *
 * @returns True if the last item reported a value edit this frame; false
 * otherwise.
 * @zh 最后项在本帧报告值编辑时为 true，否则为 false。
 * @ja 直前の項目がこのフレームで編集を報告した場合は true、それ以外は false です。
 * @ko 마지막 항목이 이번 프레임에 값 편집을 보고하면 true이며 아니면 false입니다.
 */
export function IsItemEdited(): boolean {
  return native.IsItemEdited();
}

/**
 * Was the last item just made active (item was previously inactive).
 *
 * @zh 最后一个项目是否刚被激活（此前处于非激活状态）？
 * @ja 最後の項目が今アクティブになりましたか（それまでは非アクティブ）？
 * @ko 마지막 항목이 방금 활성화되었습니까(이전에는 비활성 상태)?
 *
 * @returns True if the last item became active this frame; false otherwise.
 * @zh 最后项在本帧变为活动状态时为 true，否则为 false。
 * @ja 直前の項目がこのフレームで操作開始になった場合は true、それ以外は false です。
 * @ko 마지막 항목이 이번 프레임에 활성 상태가 되면 true이며 아니면 false입니다.
 */
export function IsItemActivated(): boolean {
  return native.IsItemActivated();
}

/**
 * Was the last item just made inactive (item was previously active).
 *
 * @zh 最后一个项目是否刚退出激活状态（此前处于激活状态）？
 * @ja 最後の項目が今非アクティブになりましたか（それまではアクティブ）？
 * @ko 마지막 항목이 방금 비활성화되었습니까(이전에는 활성 상태)?
 *
 * @remarks
 * Useful for Undo/Redo patterns with widgets that require continuous editing.
 * @zh
 * 适用于需要连续编辑的控件的撤销/重做模式。
 * @ja
 * 連続編集するウィジェットの元に戻す/やり直す処理に有用です。
 * @ko
 * 연속 편집이 필요한 위젯의 실행 취소/다시 실행 패턴에 유용합니다.
 *
 * @returns True if the last item stopped being active this frame; false
 * otherwise.
 * @zh 最后项在本帧结束活动状态时为 true，否则为 false。
 * @ja 直前の項目がこのフレームで操作終了になった場合は true、それ以外は false です。
 * @ko 마지막 항목이 이번 프레임에 비활성 상태가 되면 true이며 아니면 false입니다.
 */
export function IsItemDeactivated(): boolean {
  return native.IsItemDeactivated();
}

/**
 * Was the last item just made inactive and made a value change when it was
 * active?
 *
 * @zh 最后一个项目是否刚退出激活状态，且在激活期间修改过值（例如滑块/拖动控件被移动）？
 * @ja 最後の項目が今非アクティブになり、アクティブ中に値を変更しましたか（Slider/Drag を動かした場合など）？
 * @ko 마지막 항목이 방금 비활성화되었고 활성 상태에서 값을 변경했습니까(예: Slider/Drag 이동)?
 *
 * @remarks
 * (e.g. Slider/Drag moved).
 *
 * Useful for Undo/Redo patterns with widgets that require continuous editing.
 *
 * Note that you may get false positives (some widgets such as
 * Combo()/ListBox()/Selectable() will return true even when clicking an already
 * selected item).
 * @zh
 * 适用于需要连续编辑的控件的撤销/重做模式。
 *
 * 注意可能出现假阳性（Combo()/ListBox()/Selectable() 等控件即使点击已选中的项目也会返回 true）。
 * @ja
 * 連続編集するウィジェットの元に戻す/やり直す処理に有用です。
 *
 * 誤検出もあります（Combo()/ListBox()/Selectable() などは選択済み項目のクリックでも true を返します）。
 * @ko
 * 연속 편집이 필요한 위젯의 실행 취소/다시 실행 패턴에 유용합니다.
 *
 * 오탐이 있을 수 있습니다(Combo()/ListBox()/Selectable() 등은 이미 선택된 항목을 클릭해도 true 반환).
 *
 * @returns True if the last item became inactive after editing its value; some
 * selection widgets may report this without a net value change; false
 * otherwise.
 * @zh 最后项编辑后变为非活动状态，某些选择控件即使最终值未变也可能报告时为 true，否则为 false。
 * @ja 直前の項目が編集後に操作終了した（一部の選択項目では最終値が同じでも報告する）場合は true、それ以外は false です。
 * @ko 마지막 항목이 편집 후 비활성화되면(일부 선택 위젯은 최종 값이 같아도 보고할 수 있음) true이며 아니면 false입니다.
 */
export function IsItemDeactivatedAfterEdit(): boolean {
  return native.IsItemDeactivatedAfterEdit();
}

/**
 * Was the last item open state toggled?
 *
 * @zh 最后一个项目的展开状态是否被切换？
 * @ja 最後の項目の開閉状態が切り替わりましたか？
 * @ko 마지막 항목의 열림 상태가 전환되었습니까?
 *
 * @remarks
 * set by TreeNode().
 * @zh
 * 由 TreeNode() 设置。
 * @ja
 * TreeNode() によって設定されます。
 * @ko
 * TreeNode()이 설정합니다.
 *
 * @returns True if the last tree node changed its open state this frame; false
 * otherwise.
 * @zh 最后树节点在本帧改变展开状态时为 true，否则为 false。
 * @ja 直前のツリーノードの開閉状態がこのフレームで変わった場合は true、それ以外は false です。
 * @ko 마지막 트리 노드가 이번 프레임에 열림 상태를 변경하면 true이며 아니면 false입니다.
 */
export function IsItemToggledOpen(): boolean {
  return native.IsItemToggledOpen();
}

/**
 * Is any item hovered?
 *
 * @zh 是否有任意项目处于悬停状态？
 * @ja ホバー中の項目がありますか？
 * @ko 마우스가 올라가 있는 항목이 있습니까?
 *
 * @returns True if any submitted item is currently hovered; false otherwise.
 * @zh 任一已提交项当前被悬停时为 true，否则为 false。
 * @ja いずれかの項目が現在ホバーされている場合は true、それ以外は false です。
 * @ko 제출된 항목 중 하나가 현재 호버되면 true이며 아니면 false입니다.
 */
export function IsAnyItemHovered(): boolean {
  return native.IsAnyItemHovered();
}

/**
 * Is any item active?
 *
 * @zh 是否有任意项目处于激活状态？
 * @ja アクティブな項目がありますか？
 * @ko 활성 상태인 항목이 있습니까?
 *
 * @returns True if any item is currently active; false otherwise.
 * @zh 任一项当前活动时为 true，否则为 false。
 * @ja いずれかの項目を現在操作している場合は true、それ以外は false です。
 * @ko 현재 활성 항목이 있으면 true이며 아니면 false입니다.
 */
export function IsAnyItemActive(): boolean {
  return native.IsAnyItemActive();
}

/**
 * Is any item focused?
 *
 * @zh 是否有任意项目获得焦点？
 * @ja フォーカスを持つ項目がありますか？
 * @ko 포커스가 있는 항목이 있습니까?
 *
 * @returns True if any item has keyboard/gamepad focus; false otherwise.
 * @zh 任一项具有键盘或手柄焦点时为 true，否则为 false。
 * @ja いずれかの項目にキーボード・ゲームパッドのフォーカスがある場合は true、それ以外は false です。
 * @ko 키보드 또는 게임패드 포커스를 가진 항목이 있으면 true이며 아니면 false입니다.
 */
export function IsAnyItemFocused(): boolean {
  return native.IsAnyItemFocused();
}

/**
 * Get the identifier of the last item.
 *
 * @zh 获取最后一个条目的标识符。
 * @ja 最後のアイテムの識別子を取得します。
 * @ko 마지막 항목의 식별자를 가져옵니다.
 *
 * @remarks
 * Get the last item's ID, often the same value as `ImGui.GetID(label)`
 * called before submitting that item.
 * @zh
 * 获取最后一个项目的 ID（通常与提交前调用 `ImGui.GetID(label)` 得到的值相同）。
 * @ja
 * 最後の項目の ID を取得します（多くの場合、送信前に `ImGui.GetID(label)` で得られる値と同じです）。
 * @ko
 * 마지막 항목의 ID를 가져옵니다(대개 제출 전에 `ImGui.GetID(label)`로 얻는 값과 같습니다).
 *
 * @returns ImGuiID of the last submitted item; non-interactive items can have
 * ID 0.
 * @zh 最后提交项的 ImGuiID；非交互项可以为 0。
 * @ja 直前に描画した項目の ImGuiID です。非対話項目では 0 の場合があります。
 * @ko 마지막 제출 항목의 ImGuiID입니다. 비대화형 항목은 0일 수 있습니다.
 */
export function GetItemID(): number {
  return native.GetItemID();
}

/**
 * Get the upper-left corner of the last item in screen coordinates.
 *
 * @zh 获取最后一个条目左上角的屏幕坐标。
 * @ja 最後のアイテムの左上隅を画面座標で取得します。
 * @ko 마지막 항목 왼쪽 위 모서리의 화면 좌표를 가져옵니다.
 *
 * @remarks
 * get upper-left bounding rectangle of the last item (screen space)
 * @zh
 * 获取最后一个项目包围矩形的左上角（屏幕坐标）。
 * @ja
 * 最後の項目の境界矩形の左上隅を取得します（スクリーン座標）。
 * @ko
 * 마지막 항목 경계 사각형의 왼쪽 위 모서리를 가져옵니다(화면 좌표).
 *
 * @returns Last item top-left, copied as {x,y} in absolute screen coordinates;
 * not a writable native view.
 * @zh 最后项左上角的绝对屏幕坐标副本 {x,y}，不是原生可写视图。
 * @ja 直前の項目の左上を絶対スクリーン座標の {x,y} としてコピーします。書き込みビューではありません。
 * @ko 마지막 항목의 왼쪽 위의 절대 화면 좌표 복사본 {x,y}입니다. 네이티브 쓰기 뷰가 아닙니다.
 */
export function GetItemRectMin(): ImVec2Value {
  return native.GetItemRectMin();
}

/**
 * Get the lower-right corner of the last item in screen coordinates.
 *
 * @zh 获取最后一个条目右下角的屏幕坐标。
 * @ja 最後のアイテムの右下隅を画面座標で取得します。
 * @ko 마지막 항목 오른쪽 아래 모서리의 화면 좌표를 가져옵니다.
 *
 * @remarks
 * get lower-right bounding rectangle of the last item (screen space)
 * @zh
 * 获取最后一个项目包围矩形的右下角（屏幕坐标）。
 * @ja
 * 最後の項目の境界矩形の右下隅を取得します（スクリーン座標）。
 * @ko
 * 마지막 항목 경계 사각형의 오른쪽 아래 모서리를 가져옵니다(화면 좌표).
 *
 * @returns Last item bottom-right, copied as {x,y} in absolute screen
 * coordinates; not a writable native view.
 * @zh 最后项右下角的绝对屏幕坐标副本 {x,y}，不是原生可写视图。
 * @ja 直前の項目の右下を絶対スクリーン座標の {x,y} としてコピーします。書き込みビューではありません。
 * @ko 마지막 항목의 오른쪽 아래의 절대 화면 좌표 복사본 {x,y}입니다. 네이티브 쓰기 뷰가 아닙니다.
 */
export function GetItemRectMax(): ImVec2Value {
  return native.GetItemRectMax();
}

/**
 * Get size of last item.
 *
 * @zh 获取最后一个项目的尺寸。
 * @ja 最後の項目のサイズを取得します。
 * @ko 마지막 항목의 크기를 가져옵니다.
 *
 * @returns Last submitted item bounding rectangle: copied pixel dimensions {x:
 * width, y: height}.
 * @zh 最后提交项的边界矩形的像素尺寸副本 {x: width, y: height}。
 * @ja 直前の項目の境界矩形のピクセル寸法を {x: width, y: height} としてコピーします。
 * @ko 마지막 제출 항목의 경계 사각형의 픽셀 크기 복사본 {x: width, y: height}입니다.
 */
export function GetItemRectSize(): ImVec2Value {
  return native.GetItemRectSize();
}
