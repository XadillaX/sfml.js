import { native } from '../internal/native';

/**
 * Configure the legacy column layout.
 *
 * @zh 配置旧式分栏布局。
 * @ja 従来のカラムレイアウトを設定します。
 * @ko 기존 열 레이아웃을 설정합니다.
 *
 * @remarks
 * - You can also use SameLineEx(pos_x) to mimic simplified columns.
 *
 * Implied count = 1, id = null, borders = true
 * @zh
 * 旧版分列 API（推荐使用表格！）。
 *
 * - 也可用 SameLineEx(pos_x) 模拟简化的分列。
 *
 * 隐含参数：count = 1, id = null, borders = true。
 * @ja
 * 旧式の列 API（テーブルを推奨！）。
 *
 * - SameLineEx(pos_x) で簡易的な列を模倣することもできます。
 *
 * 暗黙の引数：count = 1, id = null, borders = true。
 * @ko
 * 레거시 열 API(테이블 사용 권장!).
 *
 * - SameLineEx(pos_x)로 간단한 열을 흉내 낼 수도 있습니다.
 *
 * 암묵적 인수: count = 1, id = null, borders = true.
 */
export function Columns(): void {
  native.Columns();
}

/**
 * Set up a legacy column layout, or end it by switching back to one column.
 *
 * @zh 设置旧式分栏布局，或通过切回单列结束分栏。
 * @ja 従来の段組みレイアウトを設定し、1 列に戻すことで終了します。
 * @ko 기존 열 레이아웃을 설정하거나 한 열로 전환하여 끝냅니다.
 *
 * @param count - Number of columns or drawing channels to split into.
 * @zh count - 要拆分成的列数或绘制通道数。
 * @ja count - 分割先の列数または描画チャンネル数です。
 * @ko count - 나눌 열 또는 그리기 채널 수입니다.
 *
 * @param id - String identifier hashed with the current ID stack to distinguish
 * this item or scope.
 * @zh id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param borders - Whether legacy columns draw vertical separator borders.
 * @zh borders - 旧式分列是否绘制垂直分隔边框。
 * @ja borders - 旧式カラムに縦の区切り線を描くかどうかです。
 * @ko borders - 레거시 열에 세로 구분선을 그릴지 여부입니다.
 */
export function ColumnsEx(
  count: number = 1,
  id: string | Uint8Array | null = null,
  borders: boolean = true,
): void {
  native.ColumnsEx(count, id, borders);
}

/**
 * Next column, defaults to current row or next row if the current row is
 * finished.
 *
 * @zh 移动到下一列，默认仍在当前行；若当前行已结束，则移到下一行。
 * @ja 次の列に移ります。
 * @ko 다음 열로 이동합니다.
 *
 * @remarks
 * next column, defaults to current row or next row if the current row is
 * finished
 * @zh
 * 移动到下一列，默认仍在当前行；若当前行已结束，则移到下一行。
 * @ja
 * 通常は現在の行内ですが、現在の行が終わっていれば次の行に移ります。
 * @ko
 * 기본적으로 현재 행에 머물지만 현재 행이 끝났으면 다음 행으로 이동합니다.
 */
export function NextColumn(): void {
  native.NextColumn();
}

/**
 * Get current column index.
 *
 * @zh 获取当前列索引。
 * @ja 現在の列インデックスを取得します。
 * @ko 현재 열 인덱스를 가져옵니다.
 *
 * @returns Zero-based index of the current column.
 * @zh 当前列从零开始的索引。
 * @ja 現在の列の 0 始まりのインデックスです。
 * @ko 현재 열의 0부터 시작하는 인덱스입니다.
 */
export function GetColumnIndex(): number {
  return native.GetColumnIndex();
}

/**
 * Get column width (in pixels).
 *
 * @zh 获取列宽（像素）。
 * @ja 列幅をピクセル単位で取得します。
 * @ko 열 너비를 픽셀 단위로 가져옵니다.
 *
 * @remarks
 * pass -1 to use current column
 * @zh
 * 传入 -1 使用当前列。
 * @ja
 * -1 を渡すと現在の列を使用します。
 * @ko
 * -1을 전달하면 현재 열을 사용합니다.
 *
 * @param column_index - Zero-based column index; -1 means the current column
 * only in APIs that support that default.
 * @zh column_index - 从零开始的列索引；仅在支持该默认值的 API 中，-1 表示当前列。
 * @ja column_index - 0 始まりの列インデックスです。-1 はその既定値を受け付ける API でのみ現在の列を意味します。
 * @ko column_index - 0부터 시작하는 열 인덱스입니다. -1은 해당 기본값을 지원하는 API에서만 현재 열을 의미합니다.
 *
 * @returns Width of the requested legacy column in pixels.
 * @zh 指定旧式列的像素宽度。
 * @ja 指定した旧式カラムのピクセル幅です。
 * @ko 지정한 레거시 열의 픽셀 너비입니다.
 */
export function GetColumnWidth(column_index: number = -1): number {
  return native.GetColumnWidth(column_index);
}

/**
 * Set column width (in pixels).
 *
 * @zh 设置列宽（像素）。
 * @ja 列幅をピクセル単位で設定します。
 * @ko 열 너비를 픽셀 단위로 설정합니다.
 *
 * @remarks
 * pass -1 to use current column
 * @zh
 * 传入 -1 使用当前列。
 * @ja
 * -1 を渡すと現在の列を使用します。
 * @ko
 * -1을 전달하면 현재 열을 사용합니다.
 *
 * @param column_index - Zero-based column index; -1 means the current column
 * only in APIs that support that default.
 * @zh column_index - 从零开始的列索引；仅在支持该默认值的 API 中，-1 表示当前列。
 * @ja column_index - 0 始まりの列インデックスです。-1 はその既定値を受け付ける API でのみ現在の列を意味します。
 * @ko column_index - 0부터 시작하는 열 인덱스입니다. -1은 해당 기본값을 지원하는 API에서만 현재 열을 의미합니다.
 *
 * @param width - Column or filter input width in pixels; a negative filter
 * width aligns to the available right edge.
 * @zh width - 列或过滤输入框的像素宽度；负的过滤框宽度相对可用右边缘对齐。
 * @ja width - 列またはフィルター入力のピクセル幅です。フィルターの負の幅は利用可能な右端を基準にします。
 * @ko width - 열 또는 필터 입력의 픽셀 너비입니다. 필터의 음수 너비는 가용 오른쪽 끝 기준입니다.
 */
export function SetColumnWidth(column_index: number, width: number): void {
  native.SetColumnWidth(column_index, width);
}

/**
 * Get a legacy column boundary offset.
 *
 * @zh 获取旧式分栏边界偏移量。
 * @ja 従来のカラム境界のオフセットを取得します。
 * @ko 기존 열 경계 오프셋을 가져옵니다.
 *
 * @remarks
 * get position of column line (in pixels, from the left side of the contents
 * region).
 *
 * pass -1 to use current column, otherwise 0..GetColumnsCount() inclusive.
 *
 * column 0 is typically 0.0
 * @zh
 * 获取列分隔线的位置（像素，相对于内容区域左侧）。
 *
 * 传入 -1 使用当前列，否则范围为 0..GetColumnsCount()（含两端）。
 *
 * 第 0 列通常为 0.0。
 * @ja
 * 列の境界線位置を内容領域の左端からのピクセル数で取得します。
 *
 * -1 は現在の列、それ以外は 0..GetColumnsCount()（両端を含む）です。
 *
 * 列 0 は通常 0.0 です。
 * @ko
 * 열 경계선의 위치를 콘텐츠 영역 왼쪽 기준 픽셀 단위로 가져옵니다.
 *
 * -1이면 현재 열을 사용하며 그 외에는 0..GetColumnsCount()(양 끝 포함)입니다.
 *
 * 0번 열은 보통 0.0입니다.
 *
 * @param column_index - Zero-based column index; -1 means the current column
 * only in APIs that support that default.
 * @zh column_index - 从零开始的列索引；仅在支持该默认值的 API 中，-1 表示当前列。
 * @ja column_index - 0 始まりの列インデックスです。-1 はその既定値を受け付ける API でのみ現在の列を意味します。
 * @ko column_index - 0부터 시작하는 열 인덱스입니다. -1은 해당 기본값을 지원하는 API에서만 현재 열을 의미합니다.
 *
 * @returns Requested legacy column boundary offset from the window left edge,
 * in pixels.
 * @zh 指定旧式列边界相对窗口左边缘的像素偏移。
 * @ja ウィンドウ左端から指定した旧式列境界までのピクセル差分です。
 * @ko 창 왼쪽 끝 기준 지정 레거시 열 경계의 픽셀 오프셋입니다.
 */
export function GetColumnOffset(column_index: number = -1): number {
  return native.GetColumnOffset(column_index);
}

/**
 * Set a legacy column boundary offset.
 *
 * @zh 设置旧式分栏边界偏移量。
 * @ja 従来のカラム境界のオフセットを設定します。
 * @ko 기존 열 경계 오프셋을 설정합니다.
 *
 * @remarks
 * set position of column line (in pixels, from the left side of the contents
 * region).
 *
 * pass -1 to use current column
 * @zh
 * 设置列分隔线的位置（像素，相对于内容区域左侧）。
 *
 * 传入 -1 使用当前列。
 * @ja
 * 列の境界線位置を内容領域の左端からのピクセル数で設定します。
 *
 * -1 を渡すと現在の列を使用します。
 * @ko
 * 열 경계선 위치를 콘텐츠 영역 왼쪽 기준 픽셀 단위로 설정합니다.
 *
 * -1을 전달하면 현재 열을 사용합니다.
 *
 * @param column_index - Zero-based column index; -1 means the current column
 * only in APIs that support that default.
 * @zh column_index - 从零开始的列索引；仅在支持该默认值的 API 中，-1 表示当前列。
 * @ja column_index - 0 始まりの列インデックスです。-1 はその既定値を受け付ける API でのみ現在の列を意味します。
 * @ko column_index - 0부터 시작하는 열 인덱스입니다. -1은 해당 기본값을 지원하는 API에서만 현재 열을 의미합니다.
 *
 * @param offset_x - Column boundary offset in pixels from the left edge of the
 * window.
 * @zh offset_x - 列边界相对窗口左边缘的像素偏移。
 * @ja offset_x - ウィンドウ左端からの列境界のピクセル位置です。
 * @ko offset_x - 창 왼쪽 끝 기준 열 경계 픽셀 오프셋입니다.
 */
export function SetColumnOffset(column_index: number, offset_x: number): void {
  native.SetColumnOffset(column_index, offset_x);
}

/**
 * Query the number of columns in the current legacy column layout.
 *
 * @zh 查询当前旧式分栏布局的列数。
 * @ja 現在の従来型段組みレイアウトの列数を取得します。
 * @ko 현재 기존 열 레이아웃의 열 수를 조회합니다.
 *
 * @returns Number of columns in the current legacy column layout, or 1 when
 * no legacy column layout is active.
 * @zh 当前旧式分栏布局的列数；未启用旧式分栏时返回 1。
 * @ja 現在の旧式カラムレイアウトの列数です。旧式カラムが有効でなければ 1 を返します。
 * @ko 현재 레거시 열 레이아웃의 열 수입니다. 레거시 열 레이아웃이 활성화되어 있지 않으면 1을 반환합니다.
 */
export function GetColumnsCount(): number {
  return native.GetColumnsCount();
}
