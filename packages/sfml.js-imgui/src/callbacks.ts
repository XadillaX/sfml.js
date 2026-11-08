import { native } from './internal/native';
import type {
  ImDrawCmd, ImDrawList, ImGuiInputTextCallbackData, ImVec2Like,
} from './types';

/**
 * Custom InputText callback.
 *
 * @zh InputText 的自定义回调。
 * @ja InputText のカスタムコールバック。
 * @ko InputText 사용자 정의 콜백입니다.
 * @param data - Current edit state, valid only for the duration of the
 * callback.
 * @zh data - 当前编辑状态，仅在回调期间有效。
 * @ja data - 現在の編集状態。コールバック中のみ有効。
 * @ko data - 현재 편집 상태이며 콜백 중에만 유효합니다.
 * @param userData - Pointer supplied by the caller.
 * @zh userData - 调用方传入的指针。
 * @ja userData - 呼び出し側が渡すポインタ。
 * @ko userData - 호출자가 전달한 포인터입니다.
 * @returns Return 0 to keep the default handling.
 * @zh 返回 0 表示继续默认处理。
 * @ja 0 を返すと既定の処理を続ける。
 * @ko 0을 반환하면 기본 처리를 계속합니다.
 */
export type InputTextCallback = (
  data: ImGuiInputTextCallbackData, userData: bigint | null,
) => number;

/**
 * Item getter for Combo and ListBox.
 *
 * @zh Combo 与 ListBox 的条目取值回调。
 * @ja Combo と ListBox の項目取得コールバック。
 * @ko Combo와 ListBox의 항목 getter 콜백입니다.
 * @param index - Item index.
 * @zh index - 条目下标。
 * @ja index - 項目のインデックス。
 * @ko index - 항목 인덱스입니다.
 * @param userData - Pointer supplied by the caller.
 * @zh userData - 调用方传入的指针。
 * @ja userData - 呼び出し側が渡すポインタ。
 * @ko userData - 호출자가 전달한 포인터입니다.
 * @returns Item text; null is treated as empty text and does not stop
 * iteration.
 * @zh 返回条目文本；null 会被视为空文本，不会终止遍历。
 * @ja 項目のテキスト。null は空のテキストとして扱われ、反復は終了しない。
 * @ko 항목 텍스트입니다. null은 빈 텍스트로 처리되며 반복을 종료하지 않습니다.
 */
export type ItemGetter = (
  index: number, userData: bigint | null,
) => string | null;

/**
 * Value getter for plots.
 *
 * @zh 图表的数值取值回调。
 * @ja プロットの値取得コールバック。
 * @ko 플롯의 값 getter 콜백입니다.
 * @param index - Data point index.
 * @zh index - 数据点下标。
 * @ja index - データ点のインデックス。
 * @ko index - 데이터 포인트 인덱스입니다.
 * @param userData - Pointer supplied by the caller.
 * @zh userData - 调用方传入的指针。
 * @ja userData - 呼び出し側が渡すポインタ。
 * @ko userData - 호출자가 전달한 포인터입니다.
 * @returns Data value.
 * @zh 返回数据值。
 * @ja データの値を返す。
 * @ko 데이터 값을 반환합니다.
 */
export type PlotGetter = (
  index: number, userData: bigint | null,
) => number;

/**
 * Input field with a JavaScript callback.
 *
 * @zh 带 JavaScript 回调的输入框。
 * @ja JavaScript コールバック付きの入力フィールド。
 * @ko JavaScript 콜백이 있는 입력 필드입니다.
 * @param label - Label.
 * @zh label - 标签。
 * @ja label - ラベル。
 * @ko label - 레이블입니다.
 * @param buffer - Editable UTF-8 buffer.
 * @zh buffer - 可编辑的 UTF-8 缓冲区。
 * @ja buffer - 編集可能な UTF-8 バッファ。
 * @ko buffer - 편집 가능한 UTF-8 버퍼입니다.
 * @param bufferSize - Buffer size.
 * @zh bufferSize - 缓冲区大小。
 * @ja bufferSize - バッファサイズ。
 * @ko bufferSize - 버퍼 크기입니다.
 * @param flags - Input flags.
 * @zh flags - 输入标志。
 * @ja flags - 入力フラグ。
 * @ko flags - 입력 플래그입니다.
 * @param callback - Custom callback.
 * @zh callback - 自定义回调。
 * @ja callback - カスタムコールバック。
 * @ko callback - 사용자 정의 콜백입니다.
 * @param userData - Opaque pointer passed through to the callback.
 * @zh userData - 透传给回调的指针。
 * @ja userData - コールバックにそのまま渡すポインタ。
 * @ko userData - 콜백에 그대로 전달되는 포인터입니다.
 * @returns Whether the content changed, or Enter was pressed when
 * `ImGuiInputTextFlags.EnterReturnsTrue` is set.
 * @zh 内容是否变化；设置 `ImGuiInputTextFlags.EnterReturnsTrue` 时，
 * 则表示是否按下了 Enter。
 * @ja 内容が変化したかどうか。`ImGuiInputTextFlags.EnterReturnsTrue` が
 * 設定されている場合は、Enter が押されたかどうか。
 * @ko 내용 변경 여부입니다. `ImGuiInputTextFlags.EnterReturnsTrue`가
 * 설정되어 있으면 Enter를 눌렀는지 여부입니다.
 */
export function InputTextEx(
  label: string | Uint8Array, buffer: Uint8Array, bufferSize: number,
  flags = 0, callback: InputTextCallback | null = null,
  userData: bigint | null = null,
): boolean {
  return native.InputTextEx(
    label, buffer, bufferSize, flags, callback, userData);
}

/**
 * Multiline input field with a JavaScript callback.
 *
 * @zh 带 JavaScript 回调的多行输入框。
 * @ja JavaScript コールバック付きの複数行入力フィールド。
 * @ko JavaScript 콜백이 있는 여러 줄 입력 필드입니다.
 * @param label - Label.
 * @zh label - 标签。
 * @ja label - ラベル。
 * @ko label - 레이블입니다.
 * @param buffer - Editable UTF-8 buffer.
 * @zh buffer - 可编辑的 UTF-8 缓冲区。
 * @ja buffer - 編集可能な UTF-8 バッファ。
 * @ko buffer - 편집 가능한 UTF-8 버퍼입니다.
 * @param bufferSize - Buffer size.
 * @zh bufferSize - 缓冲区大小。
 * @ja bufferSize - バッファサイズ。
 * @ko bufferSize - 버퍼 크기입니다.
 * @param size - Widget size.
 * @zh size - 控件尺寸。
 * @ja size - ウィジェットのサイズ。
 * @ko size - 위젯 크기입니다.
 * @param flags - Input flags.
 * @zh flags - 输入标志。
 * @ja flags - 入力フラグ。
 * @ko flags - 입력 플래그입니다.
 * @param callback - Custom callback.
 * @zh callback - 自定义回调。
 * @ja callback - カスタムコールバック。
 * @ko callback - 사용자 정의 콜백입니다.
 * @param userData - Opaque pointer passed through to the callback.
 * @zh userData - 透传给回调的指针。
 * @ja userData - コールバックにそのまま渡すポインタ。
 * @ko userData - 콜백에 그대로 전달되는 포인터입니다.
 * @returns Whether the content changed, or Enter was pressed when
 * `ImGuiInputTextFlags.EnterReturnsTrue` is set.
 * @zh 内容是否变化；设置 `ImGuiInputTextFlags.EnterReturnsTrue` 时，
 * 则表示是否按下了 Enter。
 * @ja 内容が変化したかどうか。`ImGuiInputTextFlags.EnterReturnsTrue` が
 * 設定されている場合は、Enter が押されたかどうか。
 * @ko 내용 변경 여부입니다. `ImGuiInputTextFlags.EnterReturnsTrue`가
 * 설정되어 있으면 Enter를 눌렀는지 여부입니다.
 */
export function InputTextMultilineEx(
  label: string | Uint8Array, buffer: Uint8Array, bufferSize: number,
  size: ImVec2Like = { x: 0, y: 0 }, flags = 0,
  callback: InputTextCallback | null = null,
  userData: bigint | null = null,
): boolean {
  return native.InputTextMultilineEx(
    label, buffer, bufferSize, size, flags, callback, userData);
}

/**
 * Combo with a JavaScript item getter.
 *
 * @zh 带 JavaScript 取值回调的 Combo。
 * @ja JavaScript の項目取得コールバック付き Combo。
 * @ko JavaScript 항목 getter가 있는 Combo입니다.
 * @param label - Label.
 * @zh label - 标签。
 * @ja label - ラベル。
 * @ko label - 레이블입니다.
 * @param currentItem - Current selection (length 1, writable).
 * @zh currentItem - 当前选中项，长度为 1，可写回。
 * @ja currentItem - 現在の選択項目。長さ 1 で書き戻せる。
 * @ko currentItem - 현재 선택 항목이며 길이가 1이고 다시 쓸 수 있습니다.
 * @param itemsCount - Number of items.
 * @zh itemsCount - 条目数量。
 * @ja itemsCount - 項目数。
 * @ko itemsCount - 항목 수입니다.
 * @param getter - Item text callback.
 * @zh getter - 条目文本回调。
 * @ja getter - 項目テキストのコールバック。
 * @ko getter - 항목 텍스트 콜백입니다.
 * @param userData - Opaque pointer passed through to the callback.
 * @zh userData - 透传给回调的指针。
 * @ja userData - コールバックにそのまま渡すポインタ。
 * @ko userData - 콜백에 그대로 전달되는 포인터입니다.
 * @param popupMaxHeightInItems - Maximum popup height in items.
 * @zh popupMaxHeightInItems - 弹出层最大高度，单位为条目数。
 * @ja popupMaxHeightInItems - ポップアップの最大高さ（項目数）。
 * @ko popupMaxHeightInItems - 팝업 최대 높이(항목 수)입니다.
 * @returns Whether the selected item index changed.
 * @zh 选中条目的索引是否发生变化。
 * @ja 選択項目のインデックスが変化したかどうか。
 * @ko 선택된 항목의 인덱스가 변경되었는지 여부입니다.
 */
export function ComboCallbackEx(
  label: string | Uint8Array, currentItem: Int32Array, itemsCount: number,
  getter: ItemGetter, userData: bigint | null = null,
  popupMaxHeightInItems = -1,
): boolean {
  return native.ComboCallbackEx(
    label, currentItem, getter, userData, itemsCount,
    popupMaxHeightInItems);
}

/**
 * List box with a JavaScript item getter.
 *
 * @zh 带 JavaScript 取值回调的 ListBox。
 * @ja JavaScript の項目取得コールバック付き ListBox。
 * @ko JavaScript 항목 getter가 있는 ListBox입니다.
 * @param label - Label.
 * @zh label - 标签。
 * @ja label - ラベル。
 * @ko label - 레이블입니다.
 * @param currentItem - Current selection (length 1, writable).
 * @zh currentItem - 当前选中项，长度为 1，可写回。
 * @ja currentItem - 現在の選択項目。長さ 1 で書き戻せる。
 * @ko currentItem - 현재 선택 항목이며 길이가 1이고 다시 쓸 수 있습니다.
 * @param itemsCount - Number of items.
 * @zh itemsCount - 条目数量。
 * @ja itemsCount - 項目数。
 * @ko itemsCount - 항목 수입니다.
 * @param getter - Item text callback.
 * @zh getter - 条目文本回调。
 * @ja getter - 項目テキストのコールバック。
 * @ko getter - 항목 텍스트 콜백입니다.
 * @param userData - Opaque pointer passed through to the callback.
 * @zh userData - 透传给回调的指针。
 * @ja userData - コールバックにそのまま渡すポインタ。
 * @ko userData - 콜백에 그대로 전달되는 포인터입니다.
 * @param heightInItems - Visible height in items.
 * @zh heightInItems - 显示高度，单位为条目数。
 * @ja heightInItems - 表示する高さ（項目数）。
 * @ko heightInItems - 표시 높이(항목 수)입니다.
 * @returns Whether an item was selected.
 * @zh 是否选中了条目。
 * @ja 項目が選択されたかどうか。
 * @ko 항목 선택 여부입니다.
 */
export function ListBoxCallbackEx(
  label: string | Uint8Array, currentItem: Int32Array, itemsCount: number,
  getter: ItemGetter, userData: bigint | null = null,
  heightInItems = -1,
): boolean {
  return native.ListBoxCallbackEx(
    label, currentItem, getter, userData, itemsCount, heightInItems);
}

/**
 * Line plot with a JavaScript value getter.
 *
 * @zh 带 JavaScript 取值回调的折线图。
 * @ja JavaScript の値取得コールバック付き折れ線グラフ。
 * @ko JavaScript 값 getter가 있는 꺾은선 그래프입니다.
 * @param label - Label.
 * @zh label - 标签。
 * @ja label - ラベル。
 * @ko label - 레이블입니다.
 * @param valuesCount - Number of data points.
 * @zh valuesCount - 数据点数量。
 * @ja valuesCount - データ点の数。
 * @ko valuesCount - 데이터 포인트 수입니다.
 * @param getter - Value callback.
 * @zh getter - 数值回调。
 * @ja getter - 値のコールバック。
 * @ko getter - 값 콜백입니다.
 * @param userData - Opaque pointer passed through to the callback.
 * @zh userData - 透传给回调的指针。
 * @ja userData - コールバックにそのまま渡すポインタ。
 * @ko userData - 콜백에 그대로 전달되는 포인터입니다.
 * @param valuesOffset - Offset of the first value.
 * @zh valuesOffset - 起始偏移。
 * @ja valuesOffset - 先頭値のオフセット。
 * @ko valuesOffset - 첫 값의 오프셋입니다.
 * @param overlayText - Overlay text.
 * @zh overlayText - 覆盖文本。
 * @ja overlayText - オーバーレイテキスト。
 * @ko overlayText - 오버레이 텍스트입니다.
 * @param scaleMin - Minimum value.
 * @zh scaleMin - 最小值。
 * @ja scaleMin - 最小値。
 * @ko scaleMin - 최솟값입니다.
 * @param scaleMax - Maximum value.
 * @zh scaleMax - 最大值。
 * @ja scaleMax - 最大値。
 * @ko scaleMax - 최댓값입니다.
 * @param graphSize - Graph size.
 * @zh graphSize - 图形尺寸。
 * @ja graphSize - グラフのサイズ。
 * @ko graphSize - 그래프 크기입니다.
 */
export function PlotLinesCallbackEx(
  label: string | Uint8Array, valuesCount: number, getter: PlotGetter,
  userData: bigint | null = null, valuesOffset = 0,
  overlayText: string | Uint8Array | null = null,
  scaleMin = 3.4028234663852886e38,
  scaleMax = 3.4028234663852886e38,
  graphSize: ImVec2Like = { x: 0, y: 0 },
): void {
  native.PlotLinesCallbackEx(
    label, getter, userData, valuesCount, valuesOffset, overlayText,
    scaleMin, scaleMax, graphSize);
}

/**
 * Histogram with a JavaScript value getter.
 *
 * @zh 带 JavaScript 取值回调的直方图。
 * @ja JavaScript の値取得コールバック付きヒストグラム。
 * @ko JavaScript 값 getter가 있는 히스토그램입니다.
 * @param label - Label.
 * @zh label - 标签。
 * @ja label - ラベル。
 * @ko label - 레이블입니다.
 * @param valuesCount - Number of data points.
 * @zh valuesCount - 数据点数量。
 * @ja valuesCount - データ点の数。
 * @ko valuesCount - 데이터 포인트 수입니다.
 * @param getter - Value callback.
 * @zh getter - 数值回调。
 * @ja getter - 値のコールバック。
 * @ko getter - 값 콜백입니다.
 * @param userData - Opaque pointer passed through to the callback.
 * @zh userData - 透传给回调的指针。
 * @ja userData - コールバックにそのまま渡すポインタ。
 * @ko userData - 콜백에 그대로 전달되는 포인터입니다.
 * @param valuesOffset - Offset of the first value.
 * @zh valuesOffset - 起始偏移。
 * @ja valuesOffset - 先頭値のオフセット。
 * @ko valuesOffset - 첫 값의 오프셋입니다.
 * @param overlayText - Overlay text.
 * @zh overlayText - 覆盖文本。
 * @ja overlayText - オーバーレイテキスト。
 * @ko overlayText - 오버레이 텍스트입니다.
 * @param scaleMin - Minimum value.
 * @zh scaleMin - 最小值。
 * @ja scaleMin - 最小値。
 * @ko scaleMin - 최솟값입니다.
 * @param scaleMax - Maximum value.
 * @zh scaleMax - 最大值。
 * @ja scaleMax - 最大値。
 * @ko scaleMax - 최댓값입니다.
 * @param graphSize - Graph size.
 * @zh graphSize - 图形尺寸。
 * @ja graphSize - グラフのサイズ。
 * @ko graphSize - 그래프 크기입니다.
 */
export function PlotHistogramCallbackEx(
  label: string | Uint8Array, valuesCount: number, getter: PlotGetter,
  userData: bigint | null = null, valuesOffset = 0,
  overlayText: string | Uint8Array | null = null,
  scaleMin = 3.4028234663852886e38,
  scaleMax = 3.4028234663852886e38,
  graphSize: ImVec2Like = { x: 0, y: 0 },
): void {
  native.PlotHistogramCallbackEx(
    label, getter, userData, valuesCount, valuesOffset, overlayText,
    scaleMin, scaleMax, graphSize);
}

/**
 * Custom DrawList callback.
 *
 * @zh DrawList 的自定义绘制回调。
 * @ja DrawList のカスタム描画コールバック。
 * @ko DrawList 사용자 정의 그리기 콜백입니다.
 * @param list - Parent DrawList handle.
 * @zh list - 父级 DrawList 句柄。
 * @ja list - 親 DrawList のハンドル。
 * @ko list - 상위 DrawList 핸들입니다.
 * @param cmd - Current DrawCmd handle.
 * @zh cmd - 当前 DrawCmd 句柄。
 * @ja cmd - 現在の DrawCmd のハンドル。
 * @ko cmd - 현재 DrawCmd 핸들입니다.
 * @param userData - Pointer supplied by the caller.
 * @zh userData - 调用方传入的指针。
 * @ja userData - 呼び出し側が渡すポインタ。
 * @ko userData - 호출자가 전달한 포인터입니다.
 */
export type DrawCallback = (
  list: ImDrawList, cmd: ImDrawCmd, userData: bigint | null,
) => void;

/**
 * Append a JavaScript draw callback to a DrawList.
 *
 * @zh 向 DrawList 追加一个 JavaScript 绘制回调。
 * @ja DrawList に JavaScript 描画コールバックを追加する。
 * @ko DrawList에 JavaScript 그리기 콜백을 추가합니다.
 *
 * @remarks
 * The callback runs when the renderer processes the draw list, such as during
 * `SFML.Render`; do not call ImGui widgets from it. Frame callbacks remain
 * alive until the owning context's next frame or shutdown. Clones retain
 * copied callbacks independently, including callbacks appended to the clone.
 * @zh 回调在渲染器处理绘制列表时执行，例如在 `SFML.Render` 期间；
 * 不要在其中调用 ImGui 控件。帧回调保留至所属上下文的下一帧或关闭。
 * 副本独立保留复制的回调，也保留直接追加到副本的回调。
 * @ja コールバックは `SFML.Render` などでレンダラーが描画リストを処理する際に
 * 実行されます。その中で ImGui ウィジェットを呼ばないでください。フレームのコールバックは
 * 所有コンテキストの次のフレームまたは終了まで保持されます。
 * 複製はコピー済み・直接追加のコールバックを独立に保持します。
 * @ko 콜백은 `SFML.Render` 등에서 렌더러가 그리기 목록을 처리할 때 실행됩니다.
 * 그 안에서 ImGui 위젯을 호출하지 마세요. 소유 컨텍스트의 다음 프레임이나 종료까지
 * 보유합니다. 복사본은 복사하거나 직접 추가한 콜백을 독립적으로 보유합니다.
 *
 * @param drawList - Target DrawList.
 * @zh drawList - 目标 DrawList。
 * @ja drawList - 対象の DrawList。
 * @ko drawList - 대상 DrawList입니다.
 * @param callback - Draw callback.
 * @zh callback - 绘制回调。
 * @ja callback - 描画コールバック。
 * @ko callback - 그리기 콜백입니다.
 * @param userData - Opaque pointer passed through unchanged, not owned or
 * copied. Keep its target alive for every invocation, including clone replay.
 * @zh userData - 原样透传的指针；不拥有或复制其指向的数据。
 * 须在每次调用时保持目标存活，包括副本重放。
 * @ja userData - そのまま渡すポインタです。参照先を所有・コピーしません。
 * 複製の再生を含むすべての呼び出しで参照先を有効に保ってください。
 * @ko userData - 그대로 전달되며 대상을 소유하거나 복사하지 않는 포인터입니다.
 * 복사본 재생을 포함한 모든 호출에서 대상을 유지하세요.
 */
export function AddCallbackEx(
  drawList: ImDrawList, callback: DrawCallback,
  userData: bigint | null = null,
): void {
  native.AddCallbackEx(drawList, callback, userData);
}
