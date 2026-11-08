import { native } from '../internal/native';

/**
 * Begin a combo-box popup for custom items.
 *
 * @zh 开始用于自定义条目的组合框弹出区域。
 * @ja 独自の項目を配置するコンボボックスのポップアップを開始します。
 * @ko 사용자 정의 항목을 위한 콤보 상자 팝업을 시작합니다.
 *
 * @remarks
 * - The BeginCombo()/EndCombo() api allows you to manage your contents and
 *   selection state however you want it, by creating e.g. Selectable() items.
 *
 * - The old Combo() api are helpers over BeginCombo()/EndCombo() which are kept
 *   available for convenience purpose. This is analogous to how ListBox are
 *   created.
 * @zh
 * 控件：组合框（下拉框）。
 *
 * - BeginCombo()/EndCombo() API 允许通过创建 Selectable() 项目等方式，自由管理内容和选择状态。
 *
 * - 旧的 Combo() API 是 BeginCombo()/EndCombo() 的辅助封装，为方便使用而保留。这与创建 ListBox 的方式类似。
 * @ja
 * ウィジェット：コンボボックス（ドロップダウン）。
 *
 * - BeginCombo()/EndCombo() API では Selectable() 項目を作るなどして、内容と選択状態を自由に管理できます。
 *
 * - 旧 Combo() API は BeginCombo()/EndCombo() のヘルパーで、利便性のために残されています。ListBox
 *   の作り方と同様です。
 * @ko
 * 위젯: 콤보 상자(드롭다운).
 *
 * - BeginCombo()/EndCombo() API는 Selectable() 항목 등을 만들어 내용과 선택 상태를 자유롭게 관리할 수
 *   있게 합니다.
 *
 * - 이전 Combo() API는 편의를 위해 유지되는 BeginCombo()/EndCombo()의 헬퍼입니다. ListBox를 만드는
 *   방식과 유사합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param preview_value - Text displayed in the closed combo preview; null
 * leaves the preview empty.
 * @zh preview_value - 组合框关闭时显示的预览文字；null 使预览为空。
 * @ja preview_value - 閉じたコンボのプレビュー文字列です。null では空になります。
 * @ko preview_value - 닫힌 콤보에 표시할 미리보기 텍스트입니다. null이면 비워 둡니다.
 *
 * @param flags - ImGuiComboFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiComboFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiComboFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiComboFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when this scope is open/active and its contents may be
 * submitted. Call EndCombo() only when true; on false, skip both contents and
 * the matching end.
 * @zh 此作用域打开或激活且可提交内容时返回 true。仅为 true 时调用 EndCombo()；为 false 时跳过内容和配对结束调用。
 * @ja スコープが開いて内容を描ける場合は true です。true の場合だけ EndCombo() を呼び、false
 * なら内容と終了呼び出しを省略します。
 * @ko 범위가 열리거나 활성화되어 내용을 제출할 수 있으면 true입니다. true일 때만 EndCombo()를 호출하며 false이면
 * 내용과 종료 호출을 생략합니다.
 */
export function BeginCombo(
  label: string | Uint8Array,
  preview_value: string | Uint8Array | null,
  flags: number = 0,
): boolean {
  return native.BeginCombo(label, preview_value, flags);
}

/**
 * End the current combo-box popup.
 *
 * @zh 结束当前组合框弹出区域。
 * @ja 現在のコンボボックスのポップアップを終了します。
 * @ko 현재 콤보 상자 팝업을 종료합니다.
 *
 * @remarks
 * only call EndCombo() if BeginCombo() returns true!
 * @zh
 * 仅在 BeginCombo() 返回 true 时调用 EndCombo()！
 * @ja
 * BeginCombo() が true を返した場合のみ EndCombo() を呼んでください！
 * @ko
 * BeginCombo()가 true를 반환한 경우에만 EndCombo()를 호출하세요!
 */
export function EndCombo(): void {
  native.EndCombo();
}

/**
 * Display a drop-down selector populated from an array of item labels.
 *
 * @zh 使用标签数组显示下拉选择框。
 * @ja 項目ラベルの配列からドロップダウン選択欄を表示します。
 * @ko 항목 레이블 배열로 드롭다운 선택기를 표시합니다.
 *
 * @remarks
 * Separate items with \0 within a string, end item-list with \0\0.
 *
 * e.g. "One\0Two\0Three\0"
 *
 * Implied popup_max_height_in_items = -1
 * @zh
 * 在字符串内用 \0 分隔项目，用 \0\0 结束项目列表。
 *
 * 例如 "One\0Two\0Three\0"。
 *
 * 隐含参数：popup_max_height_in_items = -1。
 * @ja
 * 文字列内の項目を \0 で区切り、項目リストを \0\0 で終端します。
 *
 * 例："One\0Two\0Three\0"。
 *
 * 暗黙の引数：popup_max_height_in_items = -1。
 * @ko
 * 문자열 안에서 \0으로 항목을 구분하고 \0\0으로 항목 목록을 끝냅니다.
 *
 * 예: "One\0Two\0Three\0".
 *
 * 암묵적 인수: popup_max_height_in_items = -1.
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
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function ComboChar(
  label: string | Uint8Array,
  current_item: Int32Array,
  items: readonly string[],
  items_count: number,
): boolean {
  return native.ComboChar(label, current_item, items, items_count);
}

/**
 * Display a drop-down selector populated from an array of item labels.
 *
 * @zh 使用标签数组显示下拉选择框。
 * @ja 項目ラベルの配列からドロップダウン選択欄を表示します。
 * @ko 항목 레이블 배열로 드롭다운 선택기를 표시합니다.
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
 * @param popup_max_height_in_items - Visible list height measured in items; -1
 * selects the default height.
 * @zh popup_max_height_in_items - 以项数计的可见列表高度；-1 选择默认高度。
 * @ja popup_max_height_in_items - 項目数で指定するリストの表示高さです。-1 は既定の高さを使います。
 * @ko popup_max_height_in_items - 항목 수 단위의 표시 목록 높이입니다. -1은 기본 높이를 선택합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function ComboCharEx(
  label: string | Uint8Array,
  current_item: Int32Array,
  items: readonly string[],
  items_count: number,
  popup_max_height_in_items: number = -1,
): boolean {
  return native.ComboCharEx(
    label,
    current_item,
    items,
    items_count,
    popup_max_height_in_items,
  );
}

/**
 * Display a drop-down selector populated from a zero-separated list of labels.
 *
 * @zh 使用零字符分隔的标签列表显示下拉选择框。
 * @ja ヌル文字で区切られたラベル一覧からドロップダウン選択欄を表示します。
 * @ko 널 문자로 구분된 레이블 목록으로 드롭다운 선택기를 표시합니다.
 *
 * @remarks
 * Separate items with \0 within a string, end item-list with \0\0.
 *
 * e.g. "One\0Two\0Three\0"
 *
 * Implied popup_max_height_in_items = -1
 * @zh
 * 在字符串内用 \0 分隔项目，用 \0\0 结束项目列表。
 *
 * 例如 "One\0Two\0Three\0"。
 *
 * 隐含参数：popup_max_height_in_items = -1。
 * @ja
 * 文字列内の項目を \0 で区切り、項目リストを \0\0 で終端します。
 *
 * 例："One\0Two\0Three\0"。
 *
 * 暗黙の引数：popup_max_height_in_items = -1。
 * @ko
 * 문자열 안에서 \0으로 항목을 구분하고 \0\0으로 항목 목록을 끝냅니다.
 *
 * 예: "One\0Two\0Three\0".
 *
 * 암묵적 인수: popup_max_height_in_items = -1.
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
 * @param items_separated_by_zeros - NUL-separated UTF-8 item labels terminated
 * by an additional NUL (two NUL bytes after the final item).
 * @zh items_separated_by_zeros - 以 NUL 分隔的 UTF-8 项标签，最后再附加一个 NUL，即末项后有两个 NUL
 * 字节。
 * @ja items_separated_by_zeros - NUL 区切りの UTF-8 ラベルです。最後の項目の後には NUL を 2
 * バイト置きます。
 * @ko items_separated_by_zeros - NUL로 구분한 UTF-8 레이블입니다. 마지막 항목 뒤에는 NUL 바이트 두 개가
 * 필요합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function Combo(
  label: string | Uint8Array,
  current_item: Int32Array,
  items_separated_by_zeros: string | Uint8Array,
): boolean {
  return native.Combo(label, current_item, items_separated_by_zeros);
}

/**
 * Display a combo box with null-separated items.
 *
 * @zh 使用空字符分隔的条目显示组合框。
 * @ja ヌル文字で区切った項目からコンボボックスを表示します。
 * @ko 널 문자로 구분한 항목으로 콤보 상자를 표시합니다.
 *
 * @remarks
 * Separate items with \0 within a string, end item-list with \0\0.
 *
 * e.g. "One\0Two\0Three\0"
 * @zh
 * 在字符串内用 \0 分隔项目，用 \0\0 结束项目列表。
 *
 * 例如 "One\0Two\0Three\0"。
 * @ja
 * 文字列内の項目を \0 で区切り、項目リストを \0\0 で終端します。
 *
 * 例："One\0Two\0Three\0"。
 * @ko
 * 문자열 안에서 \0으로 항목을 구분하고 \0\0으로 항목 목록을 끝냅니다.
 *
 * 예: "One\0Two\0Three\0".
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
 * @param items_separated_by_zeros - NUL-separated UTF-8 item labels terminated
 * by an additional NUL (two NUL bytes after the final item).
 * @zh items_separated_by_zeros - 以 NUL 分隔的 UTF-8 项标签，最后再附加一个 NUL，即末项后有两个 NUL
 * 字节。
 * @ja items_separated_by_zeros - NUL 区切りの UTF-8 ラベルです。最後の項目の後には NUL を 2
 * バイト置きます。
 * @ko items_separated_by_zeros - NUL로 구분한 UTF-8 레이블입니다. 마지막 항목 뒤에는 NUL 바이트 두 개가
 * 필요합니다.
 *
 * @param popup_max_height_in_items - Visible list height measured in items; -1
 * selects the default height.
 * @zh popup_max_height_in_items - 以项数计的可见列表高度；-1 选择默认高度。
 * @ja popup_max_height_in_items - 項目数で指定するリストの表示高さです。-1 は既定の高さを使います。
 * @ko popup_max_height_in_items - 항목 수 단위의 표시 목록 높이입니다. -1은 기본 높이를 선택합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function ComboEx(
  label: string | Uint8Array,
  current_item: Int32Array,
  items_separated_by_zeros: string | Uint8Array,
  popup_max_height_in_items: number = -1,
): boolean {
  return native.ComboEx(
    label,
    current_item,
    items_separated_by_zeros,
    popup_max_height_in_items,
  );
}
