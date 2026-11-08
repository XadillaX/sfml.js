import { native } from '../internal/native';
import type { ImGuiListClipper } from '../types';

/**
 * Initialize a clipping pass over an evenly spaced list to skip off-screen
 * items.
 *
 * @zh 初始化等间距列表的裁剪过程，以跳过屏幕外的项目。
 * @ja 等間隔のリストで画面外の項目を省くためのクリッピング処理を初期化します。
 * @ko 일정 간격의 목록에서 화면 밖 항목을 건너뛰기 위한 클리핑 처리를 초기화합니다.
 *
 * @param self - ImGuiListClipper handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiListClipper 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiListClipper ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiListClipper 핸들입니다.
 *
 * @param items_count - Number of items to process; it must match the available
 * item data.
 * @zh items_count - 要处理的项数，必须与可用项数据相符。
 * @ja items_count - 処理する項目数です。利用可能な項目データと一致させてください。
 * @ko items_count - 처리할 항목 수이며 사용 가능한 항목 데이터와 일치해야 합니다.
 *
 * @param items_height - Uniform item height in pixels including spacing; -1
 * measures the first item automatically.
 * @zh items_height - 包含间距的统一项像素高度；-1 自动测量第一项。
 * @ja items_height - 間隔を含む項目の一定ピクセル高さです。-1 は最初の項目を測定します。
 * @ko items_height - 간격을 포함한 균일한 항목 픽셀 높이입니다. -1은 첫 항목을 자동 측정합니다.
 */
export function ListClipper_Begin(
  self: ImGuiListClipper,
  items_count: number,
  items_height: number = -1.0,
): void {
  native.ListClipper_Begin(self, items_count, items_height);
}

/**
 * End list clipping and advance past the remaining items.
 *
 * @zh 结束列表裁剪并前进到剩余条目之后。
 * @ja リストのクリッピングを終了し、残りの項目の後へ進めます。
 * @ko 목록 클리핑을 종료하고 나머지 항목 뒤로 이동합니다.
 *
 * @remarks
 * Automatically called when ListClipper_Step(self) returns false.
 * @zh
 * ListClipper_Step(self) 返回 false 时自动调用。
 * @ja
 * ListClipper_Step(self) が false を返すときに自動的に呼ばれます。
 * @ko
 * ListClipper_Step(self)가 false를 반환할 때 자동 호출됩니다.
 *
 * @param self - ImGuiListClipper handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiListClipper 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiListClipper ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiListClipper 핸들입니다.
 */
export function ListClipper_End(self: ImGuiListClipper): void {
  native.ListClipper_End(self);
}

/**
 * Advance to the next visible range of list items.
 *
 * @zh 前进到下一个可见列表条目范围。
 * @ja 次に表示するリスト項目の範囲へ進めます。
 * @ko 다음에 표시할 목록 항목 범위로 이동합니다.
 *
 * @remarks
 * Call until it returns false.
 *
 * The DisplayStart/DisplayEnd fields will be set and you can process/draw those
 * items.
 * @zh
 * 持续调用直至返回 false。
 *
 * DisplayStart/DisplayEnd 字段会被设置，可处理/绘制这些项目。
 * @ja
 * false を返すまで呼び続けます。
 *
 * DisplayStart/DisplayEnd フィールドが設定され、その範囲の項目を処理/描画できます。
 * @ko
 * false를 반환할 때까지 호출합니다.
 *
 * DisplayStart/DisplayEnd 필드가 설정되며 해당 항목을 처리/그릴 수 있습니다.
 *
 * @param self - ImGuiListClipper handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiListClipper 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiListClipper ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiListClipper 핸들입니다.
 *
 * @returns True when another visible range is ready in DisplayStart/DisplayEnd;
 * submit that half-open range and call Step again. False ends clipping.
 * @zh DisplayStart/DisplayEnd 中有下一可见范围时为 true；提交该左闭右开范围后继续 Step，false 表示裁剪结束。
 * @ja DisplayStart/DisplayEnd に次の範囲があれば true です。半開区間を描画して再度 Step を呼び、false
 * なら終了です。
 * @ko DisplayStart/DisplayEnd에 다음 표시 범위가 있으면 true입니다. 반열린 범위를 제출하고 Step을 다시
 * 호출합니다. false이면 종료입니다.
 */
export function ListClipper_Step(self: ImGuiListClipper): boolean {
  return native.ListClipper_Step(self);
}

/**
 * Include an item in the list clipper output regardless of visibility.
 *
 * @zh 让列表裁剪器包含指定条目，不受可见性限制。
 * @ja 表示状態にかかわらず、指定項目をリストクリッパーの対象に含めます。
 * @ko 표시 여부와 관계없이 목록 클리퍼 출력에 항목을 포함합니다.
 *
 * @remarks
 * Call ListClipper_IncludeItemByIndex(self, item_index) or
 * ListClipper_IncludeItemsByIndex(self, item_begin, item_end) before the first
 * ListClipper_Step(self) to include items regardless of visibility.
 *
 * (Due to alignment / padding of certain items it is possible that an extra
 * item may be included on either end of the display range).
 * @zh
 * 如需让项目不受可见性限制而始终包含在裁剪结果中，请在首次 ListClipper_Step(self) 之前调用
 * ListClipper_IncludeItemByIndex(self, item_index) 或
 * ListClipper_IncludeItemsByIndex(self, item_begin, item_end)。
 *
 * （由于某些项目的对齐/内边距，显示范围的任一端可能额外包含一个项目。）
 * @ja
 * 可視性にかかわらず項目を含めるには、最初の ListClipper_Step(self) より前に
 * ListClipper_IncludeItemByIndex(self, item_index) または
 * ListClipper_IncludeItemsByIndex(self, item_begin, item_end)
 * を呼びます。項目の配置や余白によっては、表示範囲の両端に 1 項目ずつ余分に含まれる場合があります。
 * @ko
 * 표시 여부와 관계없이 항목을 포함하려면 첫 ListClipper_Step(self) 전에
 * ListClipper_IncludeItemByIndex(self, item_index) 또는
 * ListClipper_IncludeItemsByIndex(self, item_begin, item_end)를
 * 호출합니다. 항목의 정렬이나 여백 때문에 표시 범위 양 끝에 항목이 하나씩 더 포함될 수 있습니다.
 *
 * @param self - ImGuiListClipper handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiListClipper 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiListClipper ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiListClipper 핸들입니다.
 *
 * @param item_index - Zero-based item index to include or seek to, within the
 * clipper item count.
 * @zh item_index - 要包含或定位到的从零开始的项索引，须在裁剪器项数范围内。
 * @ja item_index - 表示に含めるか移動する 0 始まりの項目番号です。クリッパーの項目数内で指定します。
 * @ko item_index - 포함하거나 이동할 0부터 시작하는 항목 인덱스이며 클리퍼 항목 수 범위 안이어야 합니다.
 */
export function ListClipper_IncludeItemByIndex(
  self: ImGuiListClipper,
  item_index: number,
): void {
  native.ListClipper_IncludeItemByIndex(self, item_index);
}

/**
 * Include a range of items in the list clipper output.
 *
 * @zh 让列表裁剪器包含指定范围的条目。
 * @ja 指定範囲の項目をリストクリッパーの対象に含めます。
 * @ko 목록 클리퍼 출력에 지정한 항목 범위를 포함합니다.
 *
 * @remarks
 * item_end is exclusive e.g. use (42, 42+1) to make item 42 never clipped.
 * @zh
 * item_end 不包含在范围内，例如使用 (42, 42+1) 确保项目 42 永不被裁剪。
 * @ja
 * item_end は範囲に含みません。
 *
 * 例えば (42, 42+1) で項目 42 を常にクリップ対象外にできます。
 * @ko
 * item_end는 범위에 포함되지 않습니다.
 *
 * 예를 들어 (42, 42+1)을 사용하면 항목 42가 절대 클리핑되지 않습니다.
 *
 * @param self - ImGuiListClipper handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiListClipper 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiListClipper ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiListClipper 핸들입니다.
 *
 * @param item_begin - First item index of the range to force into the visible
 * clipper output, inclusive.
 * @zh item_begin - 强制纳入裁剪器可见输出的范围起始索引，包含此项。
 * @ja item_begin - クリッパー表示に強制的に含める範囲の先頭インデックスです。この項目を含みます。
 * @ko item_begin - 클리퍼 표시 출력에 강제로 포함할 범위의 첫 인덱스이며 이 항목을 포함합니다.
 *
 * @param item_end - Exclusive end item index of the range to include.
 * @zh item_end - 要包含范围的尾后项索引，不包含此项。
 * @ja item_end - 含める範囲の終端インデックスです。この項目は含みません。
 * @ko item_end - 포함할 범위의 끝 인덱스이며 이 항목은 제외합니다.
 */
export function ListClipper_IncludeItemsByIndex(
  self: ImGuiListClipper,
  item_begin: number,
  item_end: number,
): void {
  native.ListClipper_IncludeItemsByIndex(self, item_begin, item_end);
}

/**
 * Seek cursor toward given item.
 *
 * @zh 将光标移向指定项目。
 * @ja 指定項目に向けてカーソルを移動します。
 * @ko 지정한 항목으로 커서를 이동합니다.
 *
 * @remarks
 * This is automatically called while stepping.
 *
 * - If the item count is initially unknown, use
 *   `ImGui.ListClipper_Begin(self, 2147483647)`.
 *
 * - In this case, after all steps are done, you'll want to call
 *   `ImGui.ListClipper_SeekCursorForItem(self, item_count)`.
 * @zh
 * 在步进过程中自动调用。
 *
 * - 事先不知道项目总数时，可使用 `ImGui.ListClipper_Begin(self, 2147483647)`。
 *
 * - 此时所有步进完成后，应调用 `ImGui.ListClipper_SeekCursorForItem(self, item_count)`。
 * @ja
 * ステップ処理中は自動的に呼ばれます。
 *
 * - 項目数が事前に分からない場合は `ImGui.ListClipper_Begin(self, 2147483647)` を使います。
 *
 * - この場合、全ステップ完了後に `ImGui.ListClipper_SeekCursorForItem(self, item_count)`
 *   を呼んでください。
 * @ko
 * 단계 진행 중에는 자동 호출됩니다.
 *
 * - 항목 수를 미리 모르면 `ImGui.ListClipper_Begin(self, 2147483647)`을 사용합니다.
 *
 * - 이 경우 모든 단계가 끝나면 `ImGui.ListClipper_SeekCursorForItem(self, item_count)`를
 *   호출해야 합니다.
 *
 * @param self - ImGuiListClipper handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiListClipper 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiListClipper ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiListClipper 핸들입니다.
 *
 * @param item_index - Zero-based item index to include or seek to, within the
 * clipper item count.
 * @zh item_index - 要包含或定位到的从零开始的项索引，须在裁剪器项数范围内。
 * @ja item_index - 表示に含めるか移動する 0 始まりの項目番号です。クリッパーの項目数内で指定します。
 * @ko item_index - 포함하거나 이동할 0부터 시작하는 항목 인덱스이며 클리퍼 항목 수 범위 안이어야 합니다.
 */
export function ListClipper_SeekCursorForItem(
  self: ImGuiListClipper,
  item_index: number,
): void {
  native.ListClipper_SeekCursorForItem(self, item_index);
}

/**
 * Include an indexed range in the list clipper output.
 *
 * @zh 让列表裁剪器包含指定索引范围。
 * @ja 指定したインデックス範囲をリストクリッパーの対象に含めます。
 * @ko 목록 클리퍼 출력에 지정한 인덱스 범위를 포함합니다.
 *
 * @remarks
 * [renamed in 1.89.9]
 * @zh
 * [于 1.89.9 更名]
 * @ja
 * [1.89.9 で改名]
 * @ko
 * [1.89.9에서 이름 변경]
 *
 * @param self - ImGuiListClipper handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiListClipper 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiListClipper ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiListClipper 핸들입니다.
 *
 * @param item_begin - First item index of the range to force into the visible
 * clipper output, inclusive.
 * @zh item_begin - 强制纳入裁剪器可见输出的范围起始索引，包含此项。
 * @ja item_begin - クリッパー表示に強制的に含める範囲の先頭インデックスです。この項目を含みます。
 * @ko item_begin - 클리퍼 표시 출력에 강제로 포함할 범위의 첫 인덱스이며 이 항목을 포함합니다.
 *
 * @param item_end - Exclusive end item index of the range to include.
 * @zh item_end - 要包含范围的尾后项索引，不包含此项。
 * @ja item_end - 含める範囲の終端インデックスです。この項目は含みません。
 * @ko item_end - 포함할 범위의 끝 인덱스이며 이 항목은 제외합니다.
 */
export function ListClipper_IncludeRangeByIndices(
  self: ImGuiListClipper,
  item_begin: number,
  item_end: number,
): void {
  native.ListClipper_IncludeRangeByIndices(self, item_begin, item_end);
}

/**
 * Include an indexed range in the list clipper output.
 *
 * @zh 让列表裁剪器包含指定索引范围。
 * @ja 指定したインデックス範囲をリストクリッパーの対象に含めます。
 * @ko 목록 클리퍼 출력에 지정한 인덱스 범위를 포함합니다.
 *
 * @remarks
 * [renamed in 1.89.6]
 * @zh
 * [于 1.89.6 更名]
 * @ja
 * [1.89.6 で改名]
 * @ko
 * [1.89.6에서 이름 변경]
 *
 * @param self - ImGuiListClipper handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiListClipper 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiListClipper ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiListClipper 핸들입니다.
 *
 * @param item_begin - First item index of the range to force into the visible
 * clipper output, inclusive.
 * @zh item_begin - 强制纳入裁剪器可见输出的范围起始索引，包含此项。
 * @ja item_begin - クリッパー表示に強制的に含める範囲の先頭インデックスです。この項目を含みます。
 * @ko item_begin - 클리퍼 표시 출력에 강제로 포함할 범위의 첫 인덱스이며 이 항목을 포함합니다.
 *
 * @param item_end - Exclusive end item index of the range to include.
 * @zh item_end - 要包含范围的尾后项索引，不包含此项。
 * @ja item_end - 含める範囲の終端インデックスです。この項目は含みません。
 * @ko item_end - 포함할 범위의 끝 인덱스이며 이 항목은 제외합니다.
 */
export function ListClipper_ForceDisplayRangeByIndices(
  self: ImGuiListClipper,
  item_begin: number,
  item_end: number,
): void {
  native.ListClipper_ForceDisplayRangeByIndices(self, item_begin, item_end);
}
