import { native } from '../internal/native';
import type { ImVec2Like } from '../types';

/**
 * Display a button and report whether it was pressed.
 *
 * @zh 显示按钮并报告是否被按下。
 * @ja ボタンを表示し、押されたかどうかを返します。
 * @ko 버튼을 표시하고 눌렸는지 반환합니다.
 *
 * @remarks
 * Returns `true` when pressed.
 *
 * - Uses an automatic size equivalent to `size = (0, 0)`.
 * - Query additional state with `IsItemActive()`, `IsItemHovered()`, and other
 *   item-query functions.
 * @zh
 * 按下时返回 `true`。
 *
 * - 自动确定尺寸，等同于 `size = (0, 0)`。
 * - 可使用 `IsItemActive()`、`IsItemHovered()` 等条目查询函数获取其他状态。
 * @ja
 * 押されたときに `true` を返します。
 *
 * - `size = (0, 0)` に相当する自動サイズを使います。
 * - `IsItemActive()`、`IsItemHovered()` などのアイテム照会関数で追加の状態を確認できます。
 * @ko
 * 눌리면 `true`를 반환합니다.
 *
 * - `size = (0, 0)`에 해당하는 자동 크기를 사용합니다.
 * - `IsItemActive()`, `IsItemHovered()` 등의 항목 조회 함수로 추가 상태를 확인할 수 있습니다.
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
export function Button(label: string | Uint8Array): boolean {
  return native.Button(label);
}

/**
 * Display a button and report whether it was pressed.
 *
 * @zh 显示按钮并报告是否被按下。
 * @ja ボタンを表示し、押されたかどうかを返します。
 * @ko 버튼을 표시하고 눌렸는지 반환합니다.
 *
 * @remarks
 * Returns `true` when pressed.
 *
 * Use `size` to set the button dimensions. Query additional state with
 * `IsItemActive()`, `IsItemHovered()`, and other item-query functions.
 * @zh
 * 按下时返回 `true`。
 *
 * 使用 `size` 设置按钮尺寸。可使用 `IsItemActive()`、`IsItemHovered()` 等条目查询函数获取其他状态。
 * @ja
 * 押されたときに `true` を返します。
 *
 * `size` でボタンのサイズを指定します。`IsItemActive()`、`IsItemHovered()`
 * などのアイテム照会関数で追加の状態を確認できます。
 * @ko
 * 눌리면 `true`를 반환합니다.
 *
 * `size`로 버튼 크기를 지정합니다. `IsItemActive()`, `IsItemHovered()` 등의 항목 조회 함수로 추가 상태를
 * 확인할 수 있습니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param size - Button width and height in pixels; 0 uses the label size plus
 * frame padding, and negative values align to the remaining region.
 * @zh size - 按钮像素宽高；0 使用标签尺寸加框内边距，负值相对剩余区域对齐。
 * @ja size - ボタンのピクセル幅・高さです。0 はラベルと枠余白の寸法、負の値は残り領域基準です。
 * @ko size - 버튼 픽셀 너비와 높이입니다. 0은 레이블 크기와 프레임 패딩, 음수는 남은 영역 기준입니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function ButtonEx(
  label: string | Uint8Array,
  size: ImVec2Like = { x: 0, y: 0 },
): boolean {
  return native.ButtonEx(label, size);
}

/**
 * Display a compact button that fits within text.
 *
 * @zh 显示可嵌入文本的紧凑按钮。
 * @ja テキスト内に配置できる小さなボタンを表示します。
 * @ko 텍스트 안에 배치할 수 있는 작은 버튼을 표시합니다.
 *
 * @remarks
 * button with (FramePadding.y == 0) to easily embed within text
 * @zh
 * 满足 FramePadding.y == 0 的按钮，便于嵌入文本。
 * @ja
 * FramePadding.y == 0 のボタンで、テキスト内に埋め込みやすくなっています。
 * @ko
 * FramePadding.y == 0인 버튼으로, 텍스트 안에 쉽게 넣을 수 있습니다.
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
export function SmallButton(label: string | Uint8Array): boolean {
  return native.SmallButton(label);
}

/**
 * Create an invisible interactive button region.
 *
 * @zh 创建不可见的可交互按钮区域。
 * @ja 見えないボタンの操作領域を作成します。
 * @ko 보이지 않는 대화형 버튼 영역을 만듭니다.
 *
 * @remarks
 * flexible button behavior without the visuals, frequently useful to build
 * custom behaviors using the public api (along with IsItemActive,
 * IsItemHovered, etc.)
 * @zh
 * 不绘制外观的灵活按钮行为，常用于通过公共 API（配合 IsItemActive、IsItemHovered 等）构建自定义行为。
 * @ja
 * 外観を描画しない柔軟なボタン動作です。
 *
 * IsItemActive、IsItemHovered などと合わせ、公開 API で独自の動作を作る際によく役立ちます。
 * @ko
 * 시각 요소 없이 유연한 버튼 동작을 제공합니다.
 *
 * IsItemActive, IsItemHovered 등과 함께 공개 API로 사용자 정의 동작을 만들 때 유용합니다.
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param size - Invisible button hit-area dimensions in pixels; both axes must
 * be nonzero.
 * @zh size - 不可见按钮命中区域的像素尺寸，两轴均须非零。
 * @ja size - 不可視ボタンのピクセル判定領域です。両軸をゼロ以外にしてください。
 * @ko size - 보이지 않는 버튼의 픽셀 판정 영역입니다. 양쪽 축은 0이 아니어야 합니다.
 *
 * @param flags - ImGuiButtonFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiButtonFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiButtonFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiButtonFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function InvisibleButton(
  str_id: string | Uint8Array,
  size: ImVec2Like,
  flags: number = 0,
): boolean {
  return native.InvisibleButton(str_id, size, flags);
}

/**
 * Display a square button with an arrow.
 *
 * @zh 显示带箭头的方形按钮。
 * @ja 矢印付きの四角いボタンを表示します。
 * @ko 화살표가 있는 사각형 버튼을 표시합니다.
 *
 * @remarks
 * square button with an arrow shape
 * @zh
 * 带箭头形状的方形按钮。
 * @ja
 * 矢印形状の付いた正方形のボタン。
 * @ko
 * 화살표 모양이 있는 정사각형 버튼입니다.
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param dir - ImGuiDir specifying the arrow direction.
 * @zh dir - 指定箭头方向的 ImGuiDir。
 * @ja dir - 矢印の方向を指定する ImGuiDir です。
 * @ko dir - 화살표 방향을 지정하는 ImGuiDir입니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function ArrowButton(str_id: string | Uint8Array, dir: number): boolean {
  return native.ArrowButton(str_id, dir);
}

/**
 * Display a checkbox that edits a Boolean value.
 *
 * @zh 显示用于编辑布尔值的复选框。
 * @ja 真偽値を編集するチェックボックスを表示します。
 * @ko 불리언 값을 편집하는 체크박스를 표시합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable checked state in Uint8Array[0]: 0 is unchecked, 1 is
 * checked; activation toggles it in place. Pass Uint8Array storage, not a JS
 * scalar; native access uses the supplied backing memory.
 * @zh v - Uint8Array[0] 中的可变勾选状态：0 未勾选，1 已勾选；激活会原地切换。 请传入 Uint8Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - Uint8Array[0] のチェック状態です。0 は解除、1 は選択で、操作するとその場で切り替わります。 JS スカラーではなく
 * Uint8Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - Uint8Array[0]의 체크 상태입니다. 0은 해제, 1은 체크이며 활성화 시 직접 전환합니다. JS 스칼라가 아닌
 * Uint8Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function Checkbox(label: string | Uint8Array, v: Uint8Array): boolean {
  return native.Checkbox(label, v);
}

/**
 * Display a checkbox that sets or clears a group of bits in an integer flag
 * value.
 *
 * @zh 显示复选框，设置或清除整数标志值中的一组位。
 * @ja 整数フラグ値のビット群を設定または解除するチェックボックスを表示します。
 * @ko 정수 플래그 값의 비트 그룹을 설정하거나 해제하는 체크박스를 표시합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param flags - Mutable bit field in flags[0]; the checkbox sets or clears
 * flags_value bits. Pass Int32Array storage, not a JS scalar; native access
 * uses the supplied backing memory.
 * @zh flags - flags[0] 中的可变位字段；复选框设置或清除 flags_value 指定的位。 请传入 Int32Array 存储而非
 * JS 标量；原生代码直接访问所提供的底层内存。
 * @ja flags - flags[0] の変更可能なビット列です。flags_value のビットを設定・解除します。 JS スカラーではなく
 * Int32Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko flags - flags[0]의 변경 가능한 비트 필드입니다. 체크박스가 flags_value 비트를 설정하거나 지웁니다. JS
 * 스칼라가 아닌 Int32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param flags_value - Bit mask tested and toggled in flags[0] by the checkbox.
 * @zh flags_value - 复选框在 flags[0] 中检测和切换的位掩码。
 * @ja flags_value - チェックボックスが flags[0] で検査し切り替えるビットマスクです。
 * @ko flags_value - 체크박스가 flags[0]에서 검사하고 전환하는 비트 마스크입니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function CheckboxFlagsIntPtr(
  label: string | Uint8Array,
  flags: Int32Array,
  flags_value: number,
): boolean {
  return native.CheckboxFlagsIntPtr(label, flags, flags_value);
}

/**
 * Display a checkbox that sets or clears a group of bits in an integer flag
 * value.
 *
 * @zh 显示复选框，设置或清除整数标志值中的一组位。
 * @ja 整数フラグ値のビット群を設定または解除するチェックボックスを表示します。
 * @ko 정수 플래그 값의 비트 그룹을 설정하거나 해제하는 체크박스를 표시합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param flags - Mutable bit field in flags[0]; the checkbox sets or clears
 * flags_value bits. Pass Uint32Array storage, not a JS scalar; native access
 * uses the supplied backing memory.
 * @zh flags - flags[0] 中的可变位字段；复选框设置或清除 flags_value 指定的位。 请传入 Uint32Array 存储而非
 * JS 标量；原生代码直接访问所提供的底层内存。
 * @ja flags - flags[0] の変更可能なビット列です。flags_value のビットを設定・解除します。 JS スカラーではなく
 * Uint32Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko flags - flags[0]의 변경 가능한 비트 필드입니다. 체크박스가 flags_value 비트를 설정하거나 지웁니다. JS
 * 스칼라가 아닌 Uint32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param flags_value - Bit mask tested and toggled in flags[0] by the checkbox.
 * @zh flags_value - 复选框在 flags[0] 中检测和切换的位掩码。
 * @ja flags_value - チェックボックスが flags[0] で検査し切り替えるビットマスクです。
 * @ko flags_value - 체크박스가 flags[0]에서 검사하고 전환하는 비트 마스크입니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function CheckboxFlagsUintPtr(
  label: string | Uint8Array,
  flags: Uint32Array,
  flags_value: number,
): boolean {
  return native.CheckboxFlagsUintPtr(label, flags, flags_value);
}

/**
 * Display a radio button with the supplied selection state.
 *
 * @zh 根据传入的选中状态显示单选按钮。
 * @ja 指定した選択状態でラジオボタンを表示します。
 * @ko 전달한 선택 상태로 라디오 버튼을 표시합니다.
 *
 * @remarks
 * use with e.g. if (RadioButton("one", my_value==1)) { my_value = 1; }
 * @zh
 * 用法示例：if (RadioButton("one", my_value==1)) { my_value = 1; }。
 * @ja
 * 使用例：if (RadioButton("one", my_value==1)) { my_value = 1; }。
 * @ko
 * 사용 예: if (RadioButton("one", my_value==1)) { my_value = 1; }.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param active - Whether the item is currently selected; this by-value state
 * is not written back.
 * @zh active - 此项当前是否选中；按值传入，不会回写。
 * @ja active - 項目が現在選択されているかです。値渡しなので書き戻されません。
 * @ko active - 항목의 현재 선택 여부입니다. 값으로 전달되므로 다시 쓰지 않습니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function RadioButton(
  label: string | Uint8Array,
  active: boolean,
): boolean {
  return native.RadioButton(label, active);
}

/**
 * Display a radio button that updates an integer selection.
 *
 * @zh 显示可更新整数选中值的单选按钮。
 * @ja 整数の選択値を更新するラジオボタンを表示します。
 * @ko 정수 선택 값을 갱신하는 라디오 버튼을 표시합니다.
 *
 * @remarks
 * shortcut to handle the above pattern when value is an integer
 * @zh
 * 当值为整数时，用于处理上述模式的快捷操作。
 * @ja
 * 値が整数の場合に上記のパターンを処理するショートカットです。
 * @ko
 * 값이 정수일 때 위 패턴을 처리하는 단축 함수입니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget value in element [0]; edits are written back into
 * the supplied array. Pass Int32Array storage, not a JS scalar; native access
 * uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0]；编辑会回写所提供的数组。 请传入 Int32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Int32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_button - Value written to v[0] when this radio button is activated.
 * @zh v_button - 此单选按钮激活时写入 v[0] 的值。
 * @ja v_button - このラジオボタンを選択したときに v[0] に書く値です。
 * @ko v_button - 이 라디오 버튼 활성화 시 v[0]에 쓰는 값입니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function RadioButtonIntPtr(
  label: string | Uint8Array,
  v: Int32Array,
  v_button: number,
): boolean {
  return native.RadioButtonIntPtr(label, v, v_button);
}

/**
 * Display a progress bar for a completion fraction, with an optional text
 * overlay.
 *
 * @zh 按完成比例显示进度条，并可叠加文本。
 * @ja 完了割合をプログレスバーで表示し、任意のテキストを重ねます。
 * @ko 완료 비율을 진행 막대로 표시하고 선택적으로 텍스트를 겹쳐 표시합니다.
 *
 * @param fraction - Progress fraction, normally 0 to 1; a negative value
 * requests an indeterminate animation.
 * @zh fraction - 进度比例，通常为 0 到 1；负值表示不确定进度动画。
 * @ja fraction - 通常 0～1 の進捗率です。負の値は不定進捗アニメーションを要求します。
 * @ko fraction - 일반적으로 0~1인 진행 비율입니다. 음수는 불확정 진행 애니메이션을 요청합니다.
 *
 * @param size_arg - Widget width and height in pixels; zero uses native
 * automatic sizing and negative width reserves space from the available right
 * edge.
 * @zh size_arg - 控件像素宽高；零使用原生自动尺寸，负宽度从可用右边缘预留空间。
 * @ja size_arg - ウィジェットのピクセル寸法です。0 は自動設定、負の幅は利用可能な右端から余白を取ります。
 * @ko size_arg - 위젯 픽셀 크기입니다. 0은 자동 크기이며 음수 너비는 가용 오른쪽 끝에서 공간을 남깁니다.
 *
 * @param overlay - Optional text drawn over the progress bar or plot; null uses
 * the widget default.
 * @zh overlay - 绘制于进度条或图表上的可选文字；null 使用控件默认行为。
 * @ja overlay - 進捗バーやプロット上の任意のテキストです。null はウィジェットの既定動作を使います。
 * @ko overlay - 진행 표시줄 또는 그래프 위의 선택적 텍스트입니다. null은 위젯 기본 동작을 사용합니다.
 */
export function ProgressBar(
  fraction: number,
  size_arg: ImVec2Like = { x: 0, y: 0 },
  overlay: string | Uint8Array | null = null,
): void {
  native.ProgressBar(fraction, size_arg, overlay);
}

/**
 * Draw a bullet and keep subsequent content on the same line.
 *
 * @zh 绘制项目符号，并让后续内容保持在同一行。
 * @ja 箇条書き記号を描画し、後続の内容を同じ行に配置します。
 * @ko 글머리 기호를 그리고 이후 내용을 같은 줄에 배치합니다.
 *
 * @remarks
 * draw a small circle + keep the cursor on the same line.
 *
 * advance cursor x position by GetTreeNodeToLabelSpacing(), same distance that
 * TreeNode() uses
 * @zh
 * 绘制小圆点并将光标保持在同一行。
 *
 * 将光标 x 位置推进 GetTreeNodeToLabelSpacing()，与 TreeNode() 使用的距离相同。
 * @ja
 * 小さな円を描き、カーソルを同じ行に保ちます。
 *
 * カーソルの x 位置を GetTreeNodeToLabelSpacing() だけ進めます。
 *
 * TreeNode() と同じ距離です。
 * @ko
 * 작은 원을 그리고 커서를 같은 줄에 유지합니다.
 *
 * 커서 x 위치를 GetTreeNodeToLabelSpacing()만큼 이동하며, 이는 TreeNode()가 사용하는 거리와 같습니다.
 */
export function Bullet(): void {
  native.Bullet();
}

/**
 * Display a clickable text hyperlink.
 *
 * @zh 显示可点击的文本超链接。
 * @ja クリック可能なテキストリンクを表示します。
 * @ko 클릭 가능한 텍스트 하이퍼링크를 표시합니다.
 *
 * @remarks
 * hyperlink text button, return true when clicked
 * @zh
 * 超链接文本按钮，点击时返回 true。
 * @ja
 * ハイパーリンクのテキストボタンで、クリック時に true を返します。
 * @ko
 * 하이퍼링크 텍스트 버튼으로, 클릭하면 true를 반환합니다.
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
export function TextLink(label: string | Uint8Array): boolean {
  return native.TextLink(label);
}

/**
 * Display a text link that opens its label as a URL or file when clicked.
 *
 * @zh 显示文本链接，点击时将标签内容作为 URL 或文件打开。
 * @ja クリックするとラベルを URL またはファイルとして開くテキストリンクを表示します。
 * @ko 클릭하면 레이블을 URL 또는 파일로 여는 텍스트 링크를 표시합니다.
 *
 * @remarks
 * hyperlink text button, automatically open file/url when clicked
 *
 * Implied url = null
 * @zh
 * 超链接文本按钮，点击时自动打开文件/URL。
 *
 * 隐含参数：url = null。
 * @ja
 * クリック時にファイル／URL を自動的に開くハイパーリンクのテキストボタンです。
 *
 * 暗黙の引数：url = null。
 * @ko
 * 클릭하면 파일/URL을 자동으로 여는 하이퍼링크 텍스트 버튼입니다.
 *
 * 암묵적 인수: url = null.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 */
export function TextLinkOpenURL(label: string | Uint8Array): void {
  native.TextLinkOpenURL(label);
}

/**
 * Display a text link that opens a file or URL when clicked.
 *
 * @zh 显示点击后打开文件或 URL 的文本链接。
 * @ja クリックするとファイルまたは URL を開くテキストリンクを表示します。
 * @ko 클릭하면 파일이나 URL을 여는 텍스트 링크를 표시합니다.
 *
 * @remarks
 * hyperlink text button, automatically open file/url when clicked
 * @zh
 * 超链接文本按钮，点击时自动打开文件/URL。
 * @ja
 * クリック時にファイル／URL を自動的に開くハイパーリンクのテキストボタンです。
 * @ko
 * 클릭하면 파일/URL을 자동으로 여는 하이퍼링크 텍스트 버튼입니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param url - URL opened when the text link is activated; null uses the label
 * as the URL.
 * @zh url - 激活文本链接时打开的 URL；null 使用标签作为 URL。
 * @ja url - リンク操作で開く URL です。null ならラベルを URL として使います。
 * @ko url - 텍스트 링크 활성화 시 여는 URL입니다. null이면 레이블을 URL로 사용합니다.
 */
export function TextLinkOpenURLEx(
  label: string | Uint8Array,
  url: string | Uint8Array | null = null,
): void {
  native.TextLinkOpenURLEx(label, url);
}
