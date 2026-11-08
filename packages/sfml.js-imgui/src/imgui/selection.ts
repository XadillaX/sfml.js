import { native } from '../internal/native';
import type {
  ImVec2Like,
  ImGuiMultiSelectIO,
  ImGuiSelectionBasicStorage,
  ImGuiSelectionExternalStorage,
} from '../types';

/**
 * Display a selectable item.
 *
 * @zh 显示可选条目。
 * @ja 選択可能なアイテムを表示します。
 * @ko 선택 가능한 항목을 표시합니다.
 *
 * @remarks
 * "bool selected" carry the selection state (read-only).
 *
 * Selectable() is clicked is returns true so you can modify your selection
 * state.
 *
 * size.x==0.0: use remaining width, size.x>0.0: specify width.
 *
 * size.y==0.0: use label height, size.y>0.0: specify height
 *
 * - A selectable highlights when hovered, and can display another color when
 *   selected.
 *
 * - Neighbors selectable extend their highlight bounds in order to leave no gap
 *   between them. This is so a series of selected Selectable appear contiguous.
 *
 * Implied selected = false, flags = 0, size = { x: 0, y: 0 }
 * @zh
 * "bool selected" 携带选择状态（只读）。
 *
 * Selectable() 被点击时返回 true，供你修改选择状态。
 *
 * size.x==0.0：使用剩余宽度；size.x>0.0：指定宽度。
 *
 * size.y==0.0：使用标签高度；size.y>0.0：指定高度。
 *
 * 控件：可选项。
 *
 * - 可选项在悬停时高亮，选中时可显示另一种颜色。
 *
 * - 相邻可选项会延伸高亮边界，使彼此间没有空隙，让一系列选中的 Selectable 看起来连成一片。
 *
 * 隐含参数：selected = false, flags = 0, size = { x: 0, y: 0 }。
 * @ja
 * "bool selected" は選択状態（読み取り専用）を保持します。
 *
 * Selectable() はクリックされると true を返し、選択状態を変更できます。
 *
 * size.x==0.0：残りの幅、size.x>0.0：指定幅。
 *
 * size.y==0.0：ラベルの高さ、size.y>0.0：指定高さ。
 *
 * ウィジェット：選択可能項目。
 *
 * - ホバー時に強調表示され、選択時には別の色で表示できます。
 *
 * - 隣接する項目は強調領域を広げて隙間をなくし、選択された Selectable の列が連続して見えるようにします。
 *
 * 暗黙の引数：selected = false, flags = 0, size = { x: 0, y: 0 }。
 * @ko
 * "bool selected"는 선택 상태(읽기 전용)를 전달합니다.
 *
 * Selectable()은 클릭되면 true를 반환하므로 선택 상태를 수정할 수 있습니다.
 *
 * size.x==0.0: 남은 너비 사용, size.x>0.0: 너비 지정.
 *
 * size.y==0.0: 레이블 높이 사용, size.y>0.0: 높이 지정.
 *
 * 위젯: 선택 가능 항목.
 *
 * - 마우스를 올리면 강조 표시되고 선택되면 다른 색상을 표시할 수 있습니다.
 *
 * - 이웃한 항목은 강조 범위를 확장하여 틈을 없애므로 연속해서 선택한 Selectable이 이어져 보입니다.
 *
 * 암묵적 인수: selected = false, flags = 0, size = { x: 0, y: 0 }.
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
export function Selectable(label: string | Uint8Array): boolean {
  return native.Selectable(label);
}

/**
 * Display a selectable item with a supplied selection state.
 *
 * @zh 根据传入的选中状态显示可选条目。
 * @ja 指定した選択状態で選択可能なアイテムを表示します。
 * @ko 전달한 선택 상태로 선택 가능한 항목을 표시합니다.
 *
 * @remarks
 * "bool selected" carry the selection state (read-only).
 *
 * Selectable() is clicked is returns true so you can modify your selection
 * state.
 *
 * size.x==0.0: use remaining width, size.x>0.0: specify width.
 *
 * size.y==0.0: use label height, size.y>0.0: specify height
 * @zh
 * "bool selected" 携带选择状态（只读）。
 *
 * Selectable() 被点击时返回 true，供你修改选择状态。
 *
 * size.x==0.0：使用剩余宽度；size.x>0.0：指定宽度。
 *
 * size.y==0.0：使用标签高度；size.y>0.0：指定高度。
 * @ja
 * "bool selected" は選択状態（読み取り専用）を保持します。
 *
 * Selectable() はクリックされると true を返し、選択状態を変更できます。
 *
 * size.x==0.0：残りの幅、size.x>0.0：指定幅。
 *
 * size.y==0.0：ラベルの高さ、size.y>0.0：指定高さ。
 * @ko
 * "bool selected"는 선택 상태(읽기 전용)를 전달합니다.
 *
 * Selectable()은 클릭되면 true를 반환하므로 선택 상태를 수정할 수 있습니다.
 *
 * size.x==0.0: 남은 너비 사용, size.x>0.0: 너비 지정.
 *
 * size.y==0.0: 레이블 높이 사용, size.y>0.0: 높이 지정.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param selected - Whether the item is currently selected; this by-value state
 * is not written back.
 * @zh selected - 此项当前是否选中；按值传入，不会回写。
 * @ja selected - 項目が現在選択されているかです。値渡しなので書き戻されません。
 * @ko selected - 항목의 현재 선택 여부입니다. 값으로 전달되므로 다시 쓰지 않습니다.
 *
 * @param flags - ImGuiSelectableFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSelectableFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSelectableFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSelectableFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param size - Selectable item dimensions in pixels; zero width fills the
 * available width and zero height uses the label height.
 * @zh size - 可选项的像素尺寸；零宽度填满可用宽度，零高度使用标签高度。
 * @ja size - 選択項目のピクセル寸法です。幅 0 は利用可能幅、高さ 0 はラベルの高さです。
 * @ko size - 선택 항목 픽셀 크기입니다. 너비 0은 가용 너비를 채우며 높이 0은 레이블 높이입니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function SelectableEx(
  label: string | Uint8Array,
  selected: boolean = false,
  flags: number = 0,
  size: ImVec2Like = { x: 0, y: 0 },
): boolean {
  return native.SelectableEx(label, selected, flags, size);
}

/**
 * Display a selectable item that updates its Boolean selection state when
 * activated.
 *
 * @zh 显示可选中项，激活时更新其布尔选中状态。
 * @ja 操作時に真偽値の選択状態を更新する選択可能な項目を表示します。
 * @ko 활성화 시 불리언 선택 상태를 갱신하는 선택 가능한 항목을 표시합니다.
 *
 * @remarks
 * Implied size = { x: 0, y: 0 }
 * @zh
 * 隐含参数：size = { x: 0, y: 0 }。
 * @ja
 * 暗黙の引数：size = { x: 0, y: 0 }。
 * @ko
 * 암묵적 인수: size = { x: 0, y: 0 }.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
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
 * @param flags - ImGuiSelectableFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSelectableFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSelectableFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSelectableFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function SelectableBoolPtr(
  label: string | Uint8Array,
  p_selected: Uint8Array,
  flags: number = 0,
): boolean {
  return native.SelectableBoolPtr(label, p_selected, flags);
}

/**
 * Display a selectable item that updates its selection state.
 *
 * @zh 显示可更新自身选中状态的可选条目。
 * @ja 選択状態を更新する選択可能なアイテムを表示します。
 * @ko 선택 상태를 갱신하는 선택 가능한 항목을 표시합니다.
 *
 * @remarks
 * The first element of the mutable `Uint8Array` holds the selection state and
 * is updated by the widget. Returns `true` when activated.
 * @zh
 * 可变 `Uint8Array` 的首个元素保存选中状态，并由控件更新。激活时返回 `true`。
 * @ja
 * 変更可能な `Uint8Array` の先頭要素が選択状態を保持し、ウィジェットが更新します。選ばれると `true` を返します。
 * @ko
 * 변경 가능한 `Uint8Array`의 첫 요소가 선택 상태를 보관하며 위젯이 갱신합니다. 활성화되면 `true`를 반환합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
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
 * @param flags - ImGuiSelectableFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSelectableFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSelectableFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSelectableFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param size - Selectable item dimensions in pixels; zero width fills the
 * available width and zero height uses the label height.
 * @zh size - 可选项的像素尺寸；零宽度填满可用宽度，零高度使用标签高度。
 * @ja size - 選択項目のピクセル寸法です。幅 0 は利用可能幅、高さ 0 はラベルの高さです。
 * @ko size - 선택 항목 픽셀 크기입니다. 너비 0은 가용 너비를 채우며 높이 0은 레이블 높이입니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function SelectableBoolPtrEx(
  label: string | Uint8Array,
  p_selected: Uint8Array,
  flags: number = 0,
  size: ImVec2Like = { x: 0, y: 0 },
): boolean {
  return native.SelectableBoolPtrEx(label, p_selected, flags, size);
}

/**
 * Begin a multi-selection scope.
 *
 * @zh 开始多选作用域。
 * @ja 複数選択のスコープを開始します。
 * @ko 다중 선택 범위를 시작합니다.
 *
 * @remarks
 * - This enables standard multi-selection/range-selection idioms
 *   (CTRL+Mouse/Keyboard, SHIFT+Mouse/Keyboard, etc.) in a way that also allow
 *   a clipper to be used.
 *
 * - ImGuiSelectionUserData is often used to store your item index within the
 *   current view (but may store something else).
 *
 * - Read comments near ImGuiMultiSelectIO for instructions/details and see
 *   'Demo->Widgets->Selection State & Multi-Select' for demo.
 *
 * - TreeNode() is technically supported but... using this correctly is more
 *   complicated. You need some sort of linear/random access to your tree, which
 *   is suited to advanced trees setups already implementing filters and
 *   clipper. We will work simplifying the current demo.
 *
 * - 'selection_size' and 'items_count' parameters are optional and used by a
 *   few features. If they are costly for you to compute, you may avoid them.
 *
 * Implied selection_size = -1, items_count = -1
 * @zh
 * 用于 Selectable()、Checkbox()、TreeNode() 的多选系统 [BETA]。
 *
 * - 支持标准多选/范围选择方式（CTRL+鼠标/键盘、SHIFT+鼠标/键盘等），同时允许使用裁剪器。
 *
 * - ImGuiSelectionUserData 通常保存项目在当前视图中的索引（也可保存其他内容）。
 *
 * - 用法和细节见 ImGuiMultiSelectIO 附近的注释；演示见“演示->控件->选择状态与多选”。
 *
 * - 技术上支持 TreeNode()，但正确使用更复杂：需要以某种线性/随机方式访问树，适合已实现过滤和裁剪器的高级树结构。我们将努力简化当前演示。
 *
 * - 'selection_size' 和 'items_count' 是可选参数，仅少数功能会使用。如果计算成本高，可以省略。
 *
 * 隐含参数：selection_size = -1, items_count = -1。
 * @ja
 * Selectable()、Checkbox()、TreeNode() 向けの複数選択システム [BETA]。
 *
 * - 標準的な複数選択／範囲選択（CTRL＋マウス／キーボード、SHIFT＋マウス／キーボードなど）を、クリッパーと併用可能な形で提供します。
 *
 * - ImGuiSelectionUserData は通常、現在のビュー内の項目インデックスを格納します（別の内容でも構いません）。
 *
 * - 手順と詳細は ImGuiMultiSelectIO 付近のコメント、デモは「デモ->ウィジェット->選択状態と複数選択」を参照してください。
 *
 * - TreeNode()
 *   も技術的には対応しますが、正しく使うにはより複雑な処理が必要です。ツリーへの線形／ランダムアクセスが必要なため、フィルターとクリッパーを実装済みの高度
 *   なツリーに適しています。現在のデモは簡略化を進める予定です。
 *
 * - 'selection_size' と 'items_count' は任意で、一部の機能が使います。計算コストが高ければ省略できます。
 *
 * 暗黙の引数：selection_size = -1, items_count = -1。
 * @ko
 * Selectable(), Checkbox(), TreeNode()용 다중 선택 시스템 [BETA].
 *
 * - 표준 다중 선택/범위 선택(CTRL+마우스/키보드, SHIFT+마우스/키보드 등)을 제공하며 클리퍼도 함께 사용할 수 있습니다.
 *
 * - ImGuiSelectionUserData는 보통 현재 뷰의 항목 인덱스를 저장하지만 다른 내용을 저장해도 됩니다.
 *
 * - 사용법과 세부 사항은 ImGuiMultiSelectIO 주변 주석을, 데모는 '데모->위젯->선택 상태 및 다중 선택'을 참조하세요.
 *
 * - TreeNode()도 기술적으로 지원하지만 올바르게 사용하기는 더 복잡합니다. 트리에 대한 선형/임의 접근이 필요하므로 이미 필터와
 *   클리퍼를 구현한 고급 트리에 적합합니다. 현재 데모를 단순화할 예정입니다.
 *
 * - 'selection_size'와 'items_count'는 선택적이며 일부 기능에서 사용합니다. 계산 비용이 높다면 생략할 수
 *   있습니다.
 *
 * 암묵적 인수: selection_size = -1, items_count = -1.
 *
 * @param flags - ImGuiMultiSelectFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiMultiSelectFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiMultiSelectFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiMultiSelectFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns Borrowed multi-selection IO containing requests to apply before
 * submitting items. Always pair with EndMultiSelect(), and apply its requests
 * too.
 * @zh 包含提交项前应处理请求的借用多选 IO。必须配对 EndMultiSelect()，并处理其返回请求。
 * @ja 項目描画前に適用する要求を含む借用の複数選択 IO です。必ず EndMultiSelect() と対応させ、その要求も適用します。
 * @ko 항목 제출 전에 적용할 요청을 담은 빌린 다중 선택 IO입니다. 반드시 EndMultiSelect()와 짝지으며 반환 요청도
 * 적용합니다.
 */
export function BeginMultiSelect(flags: number): ImGuiMultiSelectIO | null {
  return native.BeginMultiSelect(flags);
}

/**
 * Begin a scope for multi-item and range selection interactions.
 *
 * @zh 开始用于多项选择和范围选择交互的作用域。
 * @ja 複数項目選択と範囲選択の操作スコープを開始します。
 * @ko 여러 항목 선택과 범위 선택을 위한 상호작용 범위를 시작합니다.
 *
 * @param flags - ImGuiMultiSelectFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiMultiSelectFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiMultiSelectFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiMultiSelectFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param selection_size - Current number of selected items, or -1 if unknown.
 * @zh selection_size - 当前选中项数，未知时为 -1。
 * @ja selection_size - 現在の選択項目数です。不明なら -1 を指定します。
 * @ko selection_size - 현재 선택된 항목 수이며 알 수 없으면 -1입니다.
 *
 * @param items_count - Total selectable item count, or -1 if unknown; used by
 * selection request handlers.
 * @zh items_count - 可选项总数，未知时为 -1；供选择请求处理器使用。
 * @ja items_count - 選択可能な項目の総数です。不明なら -1 で、選択要求の処理に使います。
 * @ko items_count - 선택 가능한 총 항목 수입니다. 알 수 없으면 -1이며 선택 요청 처리기에 사용됩니다.
 *
 * @returns Borrowed multi-selection IO containing requests to apply before
 * submitting items. Always pair with EndMultiSelect(), and apply its requests
 * too.
 * @zh 包含提交项前应处理请求的借用多选 IO。必须配对 EndMultiSelect()，并处理其返回请求。
 * @ja 項目描画前に適用する要求を含む借用の複数選択 IO です。必ず EndMultiSelect() と対応させ、その要求も適用します。
 * @ko 항목 제출 전에 적용할 요청을 담은 빌린 다중 선택 IO입니다. 반드시 EndMultiSelect()와 짝지으며 반환 요청도
 * 적용합니다.
 */
export function BeginMultiSelectEx(
  flags: number,
  selection_size: number = -1,
  items_count: number = -1,
): ImGuiMultiSelectIO | null {
  return native.BeginMultiSelectEx(flags, selection_size, items_count);
}

/**
 * End a BeginMultiSelect scope and finalize its selection requests.
 *
 * @zh 结束 BeginMultiSelect 作用域，并完成选择请求的整理。
 * @ja BeginMultiSelect のスコープを終了し、選択リクエストを確定します。
 * @ko BeginMultiSelect 범위를 끝내고 선택 요청을 확정합니다.
 *
 * @returns Borrowed multi-selection IO containing the final selection requests
 * to apply after submitting items.
 * @zh 包含项提交完成后应处理的最终选择请求的借用多选 IO。
 * @ja 項目描画後に適用する最終選択要求を含む借用の複数選択 IO です。
 * @ko 항목 제출 후 적용할 최종 선택 요청을 담은 빌린 다중 선택 IO입니다.
 */
export function EndMultiSelect(): ImGuiMultiSelectIO | null {
  return native.EndMultiSelect();
}

/**
 * Associate application selection data with the next item for multi-selection
 * requests.
 *
 * @zh 为下一个控件关联应用侧选择数据，供多选请求使用。
 * @ja 複数選択リクエストに使うアプリ側の選択データを次の項目に関連付けます。
 * @ko 다중 선택 요청에 사용할 애플리케이션 선택 데이터를 다음 항목에 연결합니다.
 *
 * @param selection_user_data - Application selection identifier attached to the
 * next item, usually its index; returned in multi-selection requests.
 * @zh selection_user_data - 附加到下一项的应用选择标识符，通常为索引；会出现在多选请求中。
 * @ja selection_user_data - 次の項目に付けるアプリ側の選択識別子です。通常はインデックスで、複数選択要求に返されます。
 * @ko selection_user_data - 다음 항목에 연결하는 앱 선택 식별자이며 보통 인덱스입니다. 다중 선택 요청에 반환됩니다.
 */
export function SetNextItemSelectionUserData(
  selection_user_data: bigint,
): void {
  native.SetNextItemSelectionUserData(selection_user_data);
}

/**
 * Was the last item selection state toggled?
 *
 * @zh 最后一个项目的选择状态是否发生切换？
 * @ja 最後の項目の選択状態は切り替わりましたか？
 * @ko 마지막 항목의 선택 상태가 전환되었나요?
 *
 * @remarks
 * Useful if you need the per-item information _before_ reaching
 * EndMultiSelect().
 *
 * We only returns toggle _event_ in order to handle clipping correctly.
 * @zh
 * 需要在 EndMultiSelect() 之前获知每项信息时很有用。
 *
 * 为正确处理裁剪，仅返回切换事件。
 * @ja
 * EndMultiSelect() に達する前に項目ごとの情報が必要な場合に便利です。
 *
 * クリッピングを正しく処理するため、切り替えイベントのみを返します。
 * @ko
 * EndMultiSelect() 전에 항목별 정보가 필요할 때 유용합니다.
 *
 * 클리핑을 올바르게 처리하기 위해 전환 이벤트만 반환합니다.
 *
 * @returns True if the last item changed selection within the multi-selection
 * scope this frame; false otherwise.
 * @zh 最后项在本帧多选作用域中改变选择状态时为 true，否则为 false。
 * @ja 直前の項目が複数選択スコープ内でこのフレームに選択を変更した場合は true、それ以外は false です。
 * @ko 마지막 항목이 다중 선택 범위에서 이번 프레임에 선택을 변경하면 true이며 아니면 false입니다.
 */
export function IsItemToggledSelection(): boolean {
  return native.IsItemToggledSelection();
}

/**
 * Begin a framed, scrollable list-box region.
 *
 * @zh 开始带边框、可滚动的列表框区域。
 * @ja フレーム付きのスクロール可能なリストボックス領域を開始します。
 * @ko 프레임이 있는 스크롤 가능한 목록 상자 영역을 시작합니다.
 *
 * @remarks
 * - This is essentially a thin wrapper to using BeginChild/EndChild with the
 *   ImGuiChildFlags.FrameStyle flag for stylistic changes + displaying a label.
 *
 * - If you don't need a label you can probably simply use BeginChild() with the
 *   ImGuiChildFlags.FrameStyle flag for the same result.
 *
 * - You can submit contents and manage your selection state however you want
 *   it, by creating e.g. Selectable() or any other items.
 *
 * - The simplified/old ListBox() api are helpers over
 *   BeginListBox()/EndListBox() which are kept available for convenience
 *   purpose. This is analoguous to how Combos are created.
 *
 * - Choose frame width:   size.x > 0.0: custom  /  size.x < 0.0 or -FLT_MIN:
 *   right-align   /  size.x = 0.0 (default): use current ItemWidth
 * - Choose frame height:  size.y > 0.0: custom  /  size.y < 0.0 or -FLT_MIN:
 *   bottom-align  /  size.y = 0.0 (default): arbitrary default height which
 *   can fit ~7 items
 *
 * open a framed scrolling region
 * @zh
 * 控件：列表框。
 *
 * - 本质上是 BeginChild/EndChild 的薄封装，使用 ImGuiChildFlags.FrameStyle 改变样式，并显示标签。
 *
 * - 不需要标签时，直接使用带 ImGuiChildFlags.FrameStyle 的 BeginChild() 通常就能得到相同效果。
 *
 * - 可通过创建 Selectable() 或其他任意项目，自由提交内容和管理选择状态。
 *
 * - 简化版/旧 ListBox() API 是 BeginListBox()/EndListBox()
 *   的辅助封装，为方便使用而保留，与创建组合框的方式类似。
 *
 * - 框宽度：size.x > 0.0 为自定义；size.x < 0.0 或 -FLT_MIN 为右对齐；size.x = 0.0（默认）使用当前
 *   ItemWidth。
 *
 * - 框高度：size.y > 0.0 为自定义；size.y < 0.0 或 -FLT_MIN 为底部对齐；size.y =
 *   0.0（默认）使用可容纳约 7 个项目的任意默认高度。打开带框的滚动区域。
 * @ja
 * ウィジェット：リストボックス。
 *
 * - 実体は BeginChild/EndChild の薄いラッパーで、ImGuiChildFlags.FrameStyle
 *   によるスタイル変更とラベル表示を加えます。
 *
 * - ラベルが不要なら ImGuiChildFlags.FrameStyle 付き BeginChild() だけで同じ結果が得られるでしょう。
 *
 * - Selectable() や任意の項目を作り、内容の送信と選択状態を自由に管理できます。
 *
 * - 簡易版／旧 ListBox() API は利便性のために残された BeginListBox()/EndListBox()
 *   のヘルパーで、コンボボックスと同じ作り方です。
 *
 * - 枠幅：size.x > 0.0 は指定値、size.x < 0.0 または -FLT_MIN は右揃え、size.x = 0.0（既定）は現在の
 *   ItemWidth。
 *
 * - 枠高さ：size.y > 0.0 は指定値、size.y < 0.0 または -FLT_MIN は下揃え、size.y = 0.0（既定）は約
 *   7 項目が入る任意の既定高さです。枠付きスクロール領域を開きます。
 * @ko
 * 위젯: 목록 상자.
 *
 * - 본질적으로 BeginChild/EndChild의 얇은 래퍼이며 ImGuiChildFlags.FrameStyle로 스타일을 바꾸고
 *   레이블을 표시합니다.
 *
 * - 레이블이 필요 없다면 ImGuiChildFlags.FrameStyle을 지정한 BeginChild()만으로 같은 결과를 얻을 수
 *   있습니다.
 *
 * - Selectable() 또는 다른 항목을 만들어 콘텐츠를 제출하고 선택 상태를 자유롭게 관리할 수 있습니다.
 *
 * - 단순화된/이전 ListBox() API는 편의를 위해 유지되는 BeginListBox()/EndListBox() 헬퍼로, 콤보 상자를
 *   만드는 방식과 유사합니다.
 *
 * - 프레임 너비: size.x > 0.0는 사용자 지정, size.x < 0.0 또는 -FLT_MIN은 오른쪽 정렬, size.x =
 *   0.0(기본값)는 현재 ItemWidth 사용.
 *
 * - 프레임 높이: size.y > 0.0는 사용자 지정, size.y < 0.0 또는 -FLT_MIN은 아래쪽 정렬, size.y =
 *   0.0(기본값)는 약 7개 항목이 들어가는 임의의 기본 높이입니다. 프레임이 있는 스크롤 영역을 엽니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param size - List-box frame dimensions in pixels; zero width uses the
 * current item width and zero height fits about seven items. Negative axes
 * align to the remaining region.
 * @zh size - 列表框的像素尺寸；零宽度使用当前项宽，零高度约容纳七项，负值相对剩余区域对齐。
 * @ja size - リスト枠のピクセル寸法です。幅 0 は現在の項目幅、高さ 0 は約 7 項目分、負の軸は残り領域基準です。
 * @ko size - 목록 상자 프레임 픽셀 크기입니다. 너비 0은 현재 항목 너비, 높이 0은 약 7개 항목이며 음수 축은 남은 영역
 * 기준입니다.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndListBox() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndListBox()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndListBox() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndListBox()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginListBox(
  label: string | Uint8Array,
  size: ImVec2Like = { x: 0, y: 0 },
): boolean {
  return native.BeginListBox(label, size);
}

/**
 * End the current list-box region.
 *
 * @zh 结束当前列表框区域。
 * @ja 現在のリストボックス領域を終了します。
 * @ko 현재 목록 상자 영역을 종료합니다.
 *
 * @remarks
 * only call EndListBox() if BeginListBox() returned true!
 * @zh
 * 仅在 BeginListBox() 返回 true 时调用 EndListBox()！
 * @ja
 * BeginListBox() が true を返した場合のみ EndListBox() を呼んでください！
 * @ko
 * BeginListBox()가 true를 반환한 경우에만 EndListBox()를 호출하세요!
 */
export function EndListBox(): void {
  native.EndListBox();
}

/**
 * Display a scrolling list of labels for selecting a single item.
 *
 * @zh 显示可滚动的标签列表，用于选择单个项目。
 * @ja 単一項目を選ぶためのスクロール可能なラベル一覧を表示します。
 * @ko 단일 항목을 선택하는 스크롤 가능한 레이블 목록을 표시합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param current_item - Zero-based selected item index in Int32Array[0],
 * updated when the selection changes. Pass Int32Array storage, not a JS scalar;
 * native access uses the supplied backing memory.
 * @zh current_item - Int32Array[0] 中从零开始的选中项索引，选择变化时更新。 请传入 Int32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja current_item - Int32Array[0] に入れる 0 始まりの選択インデックスです。選択変更時に更新します。 JS
 * スカラーではなく Int32Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko current_item - Int32Array[0]의 0부터 시작하는 선택 인덱스이며 선택 변경 시 갱신됩니다. JS 스칼라가 아닌
 * Int32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param items - Item labels in display order; items_count must not exceed the
 * array length.
 * @zh items - 按显示顺序排列的项标签；items_count 不得超过数组长度。
 * @ja items - 表示順の項目ラベルです。items_count は配列長以下にしてください。
 * @ko items - 표시 순서의 항목 레이블입니다. items_count는 배열 길이를 초과하면 안 됩니다.
 *
 * @param items_count - Number of items to process; it must match the available
 * item data.
 * @zh items_count - 要处理的项数，必须与可用项数据相符。
 * @ja items_count - 処理する項目数です。利用可能な項目データと一致させてください。
 * @ko items_count - 처리할 항목 수이며 사용 가능한 항목 데이터와 일치해야 합니다.
 *
 * @param height_in_items - Visible list height measured in items; -1 selects
 * the default height.
 * @zh height_in_items - 以项数计的可见列表高度；-1 选择默认高度。
 * @ja height_in_items - 項目数で指定するリストの表示高さです。-1 は既定の高さを使います。
 * @ko height_in_items - 항목 수 단위의 표시 목록 높이입니다. -1은 기본 높이를 선택합니다.
 *
 * @returns True when a row is activated, including an already-selected row;
 * this does not guarantee that the selection index changed.
 * @zh 激活条目时为 true，包括再次激活已选条目；这不保证选中索引发生变化。
 * @ja 選択済みの行も含め、行が操作されると true です。選択インデックスが変化したとは限りません。
 * @ko 이미 선택된 행을 포함해 행을 활성화하면 true입니다. 선택 인덱스가 변경되었다는 뜻은 아닙니다.
 */
export function ListBox(
  label: string | Uint8Array,
  current_item: Int32Array,
  items: readonly string[],
  items_count: number,
  height_in_items: number = -1,
): boolean {
  return native.ListBox(
    label,
    current_item,
    items,
    items_count,
    height_in_items,
  );
}

/**
 * Apply selection requests coming from BeginMultiSelect() and EndMultiSelect()
 * functions.
 *
 * @zh 应用来自 BeginMultiSelect() 和 EndMultiSelect() 的选择请求。
 * @ja BeginMultiSelect() と EndMultiSelect() からの選択要求を適用します。
 * @ko BeginMultiSelect()와 EndMultiSelect()의 선택 요청을 적용합니다.
 *
 * @remarks
 * It uses 'items_count' passed to BeginMultiSelect()
 * @zh
 * 使用传给 BeginMultiSelect() 的 'items_count'。
 * @ja
 * BeginMultiSelect() に渡した 'items_count' を使用します。
 * @ko
 * BeginMultiSelect()에 전달한 'items_count'를 사용합니다.
 *
 * @param self - ImGuiSelectionBasicStorage handle on which this method
 * operates.
 * @zh self - 此方法操作的 ImGuiSelectionBasicStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiSelectionBasicStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiSelectionBasicStorage 핸들입니다.
 *
 * @param ms_io - Multi-selection requests obtained from BeginMultiSelect() or
 * EndMultiSelect(), applied to this selection storage.
 * @zh ms_io - 从 BeginMultiSelect() 或 EndMultiSelect() 得到并应用到此选择存储的多选请求。
 * @ja ms_io - BeginMultiSelect() または EndMultiSelect() が返す、この選択ストレージに適用する要求です。
 * @ko ms_io - BeginMultiSelect() 또는 EndMultiSelect()에서 얻어 선택 저장소에 적용할 다중 선택
 * 요청입니다.
 */
export function SelectionBasicStorage_ApplyRequests(
  self: ImGuiSelectionBasicStorage,
  ms_io: ImGuiMultiSelectIO,
): void {
  native.SelectionBasicStorage_ApplyRequests(self, ms_io);
}

/**
 * Query if an item id is in selection.
 *
 * @zh 查询某项目 ID 是否在选择集中。
 * @ja 項目 ID が選択に含まれるかを調べます。
 * @ko 항목 ID가 선택 집합에 있는지 조회합니다.
 *
 * @param self - ImGuiSelectionBasicStorage handle on which this method
 * operates.
 * @zh self - 此方法操作的 ImGuiSelectionBasicStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiSelectionBasicStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiSelectionBasicStorage 핸들입니다.
 *
 * @param id - Numeric ID identifying the child window, popup, or selection
 * entry, passed directly without string hashing.
 * @zh id - 标识子窗口、弹窗或选择条目的数值 ID，直接传入而不做字符串散列。
 * @ja id - 子ウィンドウ、ポップアップ、選択項目の数値 ID です。文字列ハッシュを行わず直接使います。
 * @ko id - 자식 창, 팝업 또는 선택 항목의 숫자 ID입니다. 문자열 해시 없이 직접 전달됩니다.
 *
 * @returns True if the storage currently contains the supplied selection ID.
 * @zh 存储当前包含指定选择 ID 时为 true。
 * @ja ストレージに指定した選択 ID が含まれていれば true です。
 * @ko 저장소에 지정한 선택 ID가 포함되어 있으면 true입니다.
 */
export function SelectionBasicStorage_Contains(
  self: ImGuiSelectionBasicStorage,
  id: number,
): boolean {
  return native.SelectionBasicStorage_Contains(self, id);
}

/**
 * Clear selection.
 *
 * @zh 清空选择集。
 * @ja 選択をすべて解除します。
 * @ko 선택 집합을 비웁니다.
 *
 * @param self - ImGuiSelectionBasicStorage handle on which this method
 * operates.
 * @zh self - 此方法操作的 ImGuiSelectionBasicStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiSelectionBasicStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiSelectionBasicStorage 핸들입니다.
 */
export function SelectionBasicStorage_Clear(
  self: ImGuiSelectionBasicStorage,
): void {
  native.SelectionBasicStorage_Clear(self);
}

/**
 * Swap two selections.
 *
 * @zh 交换两个选择集。
 * @ja 2 つの選択を入れ替えます。
 * @ko 두 선택 집합을 교환합니다.
 *
 * @param self - ImGuiSelectionBasicStorage handle on which this method
 * operates.
 * @zh self - 此方法操作的 ImGuiSelectionBasicStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiSelectionBasicStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiSelectionBasicStorage 핸들입니다.
 *
 * @param r - Other selection storage whose state is exchanged with self.
 * @zh r - 与 self 交换状态的另一选择存储。
 * @ja r - self と状態を交換する別の選択ストレージです。
 * @ko r - self와 상태를 교환할 다른 선택 저장소입니다.
 */
export function SelectionBasicStorage_Swap(
  self: ImGuiSelectionBasicStorage,
  r: ImGuiSelectionBasicStorage,
): void {
  native.SelectionBasicStorage_Swap(self, r);
}

/**
 * Add or remove an item from the selection.
 *
 * @zh 在选区中添加或移除条目。
 * @ja 選択範囲にアイテムを追加または削除します。
 * @ko 선택 항목을 추가하거나 제거합니다.
 *
 * @remarks
 * Add or remove an item from the selection; this is usually handled by
 * SelectionBasicStorage_ApplyRequests(self, ms_io).
 * @zh
 * 向选择集添加或移除项目，通常由 SelectionBasicStorage_ApplyRequests(self, ms_io) 完成。
 * @ja
 * 選択に項目を追加または削除します。通常は SelectionBasicStorage_ApplyRequests(self, ms_io) が行います。
 * @ko
 * 선택 집합에 항목을 추가하거나 제거합니다. 보통 SelectionBasicStorage_ApplyRequests(self, ms_io)가
 * 처리합니다.
 *
 * @param self - ImGuiSelectionBasicStorage handle on which this method
 * operates.
 * @zh self - 此方法操作的 ImGuiSelectionBasicStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiSelectionBasicStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiSelectionBasicStorage 핸들입니다.
 *
 * @param id - Numeric ID identifying the child window, popup, or selection
 * entry, passed directly without string hashing.
 * @zh id - 标识子窗口、弹窗或选择条目的数值 ID，直接传入而不做字符串散列。
 * @ja id - 子ウィンドウ、ポップアップ、選択項目の数値 ID です。文字列ハッシュを行わず直接使います。
 * @ko id - 자식 창, 팝업 또는 선택 항목의 숫자 ID입니다. 문자열 해시 없이 직접 전달됩니다.
 *
 * @param selected - True adds id to the selection storage; false removes it.
 * @zh selected - true 将 id 加入选择存储，false 将其移除。
 * @ja selected - true は id を選択ストレージへ追加し、false は削除します。
 * @ko selected - true는 id를 선택 저장소에 추가하며 false는 제거합니다.
 */
export function SelectionBasicStorage_SetItemSelected(
  self: ImGuiSelectionBasicStorage,
  id: number,
  selected: boolean,
): void {
  native.SelectionBasicStorage_SetItemSelected(self, id, selected);
}

/**
 * Convert index to item id based on provided adapter.
 *
 * @zh 根据提供的适配器将索引转换为项目 ID。
 * @ja 指定されたアダプターに基づいてインデックスを項目 ID に変換します。
 * @ko 제공한 어댑터를 기반으로 인덱스를 항목 ID로 변환합니다.
 *
 * @param self - ImGuiSelectionBasicStorage handle on which this method
 * operates.
 * @zh self - 此方法操作的 ImGuiSelectionBasicStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiSelectionBasicStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiSelectionBasicStorage 핸들입니다.
 *
 * @param idx - Zero-based item index passed to this selection storage's
 * adapter to obtain a stable item ID.
 * @zh idx - 传给此选择存储适配器的从零开始的项目索引，用于取得稳定的项目 ID。
 * @ja idx - 安定した項目 ID を得るために、この選択ストレージのアダプターへ渡す 0 始まりの項目番号です。
 * @ko idx - 안정적인 항목 ID를 얻기 위해 이 선택 저장소의 어댑터에 전달하는 0부터 시작하는 항목 인덱스입니다.
 *
 * @returns Stable storage ID obtained by mapping the item index through this
 * storage adapter.
 * @zh 通过此存储适配器映射项索引得到的稳定存储 ID。
 * @ja ストレージの変換処理で項目番号を対応付けた安定した保存 ID です。
 * @ko 이 저장소 어댑터를 통해 항목 인덱스를 매핑한 안정적인 저장 ID입니다.
 */
export function SelectionBasicStorage_GetStorageIdFromIndex(
  self: ImGuiSelectionBasicStorage,
  idx: number,
): number {
  return native.SelectionBasicStorage_GetStorageIdFromIndex(self, idx);
}

/**
 * Apply selection requests through the native item-selection callback, whose
 * configuration is not exposed by this JS binding.
 *
 * @zh 通过原生项目选择回调应用选择请求；此 JS 绑定未暴露该回调的配置接口。
 * @ja ネイティブの項目選択コールバックで選択要求を適用します。この JS バインディングではコールバックの設定は公開されていません。
 * @ko 네이티브 항목 선택 콜백으로 선택 요청을 적용합니다. 이 JS 바인딩은 해당 콜백의 설정 API를 노출하지 않습니다.
 *
 * @param self - ImGuiSelectionExternalStorage handle on which this method
 * operates.
 * @zh self - 此方法操作的 ImGuiSelectionExternalStorage 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiSelectionExternalStorage ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiSelectionExternalStorage 핸들입니다.
 *
 * @param ms_io - Multi-selection requests obtained from BeginMultiSelect() or
 * EndMultiSelect(), applied to this selection storage.
 * @zh ms_io - 从 BeginMultiSelect() 或 EndMultiSelect() 得到并应用到此选择存储的多选请求。
 * @ja ms_io - BeginMultiSelect() または EndMultiSelect() が返す、この選択ストレージに適用する要求です。
 * @ko ms_io - BeginMultiSelect() 또는 EndMultiSelect()에서 얻어 선택 저장소에 적용할 다중 선택
 * 요청입니다.
 */
export function SelectionExternalStorage_ApplyRequests(
  self: ImGuiSelectionExternalStorage,
  ms_io: ImGuiMultiSelectIO,
): void {
  native.SelectionExternalStorage_ApplyRequests(self, ms_io);
}
