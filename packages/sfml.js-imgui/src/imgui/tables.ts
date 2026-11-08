import { native } from '../internal/native';
import type { ImVec2Like, ImGuiTableSortSpecs } from '../types';

/**
 * Begin a table.
 *
 * @zh 开始表格。
 * @ja テーブルを開始します。
 * @ko 테이블을 시작합니다.
 *
 * @remarks
 * Tables replace the legacy Columns API. See Demo > Tables, `imgui_tables.cpp`,
 * `ImGuiTableFlags`, and `ImGuiTableColumnFlags` for examples and options.
 *
 * 1. Call `BeginTable()` and skip the table if it returns `false`.
 * 2. Optionally declare columns with `TableSetupColumn()` and freeze rows or
 *    columns with `TableSetupScrollFreeze()`.
 * 3. Optionally call `TableHeadersRow()`; it uses the declared column names.
 * 4. Populate cells, then call `EndTable()` only when `BeginTable()` returned
 *    `true`.
 *
 * Select the first cell explicitly, unlike the old Columns API.
 * `TableNextColumn()` automatically wraps to the next row. These sequences are
 * valid:
 *
 * ```text
 * TableNextRow() -> TableSetColumnIndex(0) -> Text("Hello 0") ->
 * TableSetColumnIndex(1) -> Text("Hello 1")
 * TableNextRow() -> TableNextColumn() -> Text("Hello 0") -> TableNextColumn()
 * -> Text("Hello 1")
 * TableNextColumn() -> Text("Hello 0") -> TableNextColumn() -> Text("Hello 1")
 * ```
 *
 * `TableNextRow() -> Text("Hello 0")` is invalid: without selecting a column,
 * the text will not appear.
 *
 * The helper uses `outer_size = (0, 0)` and `inner_width = 0`.
 * @zh
 * 表格替代旧式 Columns API。示例和选项见 Demo > Tables、`imgui_tables.cpp`、`ImGuiTableFlags`
 * 和 `ImGuiTableColumnFlags`。
 *
 * 1. 调用 `BeginTable()`，返回 `false` 时跳过表格。
 * 2. 可通过 `TableSetupColumn()` 声明列，通过 `TableSetupScrollFreeze()` 冻结行或列。
 * 3. 可调用 `TableHeadersRow()`，使用已声明的列名生成表头。
 * 4. 填充单元格后，仅在 `BeginTable()` 返回 `true` 时调用 `EndTable()`。
 *
 * 与旧式 Columns API 不同，必须显式选择首个单元格。`TableNextColumn()` 会自动换到下一行。以下序列均有效：
 *
 * ```text
 * TableNextRow() -> TableSetColumnIndex(0) -> Text("Hello 0") ->
 * TableSetColumnIndex(1) -> Text("Hello 1")
 * TableNextRow() -> TableNextColumn() -> Text("Hello 0") -> TableNextColumn()
 * -> Text("Hello 1")
 * TableNextColumn() -> Text("Hello 0") -> TableNextColumn() -> Text("Hello 1")
 * ```
 *
 * `TableNextRow() -> Text("Hello 0")` 无效：未选择列，文本不会显示。
 *
 * 此辅助函数使用 `outer_size = (0, 0)` 和 `inner_width = 0`。
 * @ja
 * テーブルは従来の Columns API の代替です。例とオプションは Demo >
 * Tables、`imgui_tables.cpp`、`ImGuiTableFlags`、`ImGuiTableColumnFlags`
 * を参照してください。
 *
 * 1. `BeginTable()` を呼び、`false` ならテーブルを省略します。
 * 2. 必要に応じて `TableSetupColumn()` で列を宣言し、`TableSetupScrollFreeze()` で行や列を固定します。
 * 3. 必要に応じて `TableHeadersRow()` を呼び、宣言済みの列名から見出しを表示します。
 * 4. セルを埋め、`BeginTable()` が `true` の場合だけ `EndTable()` を呼びます。
 *
 * 従来の Columns API と異なり、最初のセルを明示的に選択します。`TableNextColumn()`
 * は自動的に次の行へ移動します。次の順序は有効です。
 *
 * ```text
 * TableNextRow() -> TableSetColumnIndex(0) -> Text("Hello 0") ->
 * TableSetColumnIndex(1) -> Text("Hello 1")
 * TableNextRow() -> TableNextColumn() -> Text("Hello 0") -> TableNextColumn()
 * -> Text("Hello 1")
 * TableNextColumn() -> Text("Hello 0") -> TableNextColumn() -> Text("Hello 1")
 * ```
 *
 * `TableNextRow() -> Text("Hello 0")` は無効です。列を選択しないとテキストは表示されません。
 *
 * このヘルパーは `outer_size = (0, 0)` と `inner_width = 0` を使います。
 * @ko
 * 테이블은 기존 Columns API를 대체합니다. 예제와 옵션은 Demo > Tables, `imgui_tables.cpp`,
 * `ImGuiTableFlags`, `ImGuiTableColumnFlags`를 참조하세요.
 *
 * 1. `BeginTable()`을 호출하고 `false`이면 테이블을 건너뜁니다.
 * 2. 필요하면 `TableSetupColumn()`으로 열을 선언하고 `TableSetupScrollFreeze()`로 행이나 열을
 *    고정합니다.
 * 3. 필요하면 `TableHeadersRow()`를 호출하여 선언된 열 이름으로 헤더를 표시합니다.
 * 4. 셀을 채운 뒤 `BeginTable()`이 `true`일 때만 `EndTable()`을 호출합니다.
 *
 * 기존 Columns API와 달리 첫 셀도 명시적으로 선택해야 합니다. `TableNextColumn()`은 자동으로 다음 행으로
 * 이동합니다. 다음 순서는 유효합니다.
 *
 * ```text
 * TableNextRow() -> TableSetColumnIndex(0) -> Text("Hello 0") ->
 * TableSetColumnIndex(1) -> Text("Hello 1")
 * TableNextRow() -> TableNextColumn() -> Text("Hello 0") -> TableNextColumn()
 * -> Text("Hello 1")
 * TableNextColumn() -> Text("Hello 0") -> TableNextColumn() -> Text("Hello 1")
 * ```
 *
 * `TableNextRow() -> Text("Hello 0")`은 유효하지 않습니다. 열을 선택하지 않으면 텍스트가 표시되지 않습니다.
 *
 * 이 헬퍼는 `outer_size = (0, 0)`과 `inner_width = 0`을 사용합니다.
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param columns - Number of columns to create or freeze.
 * @zh columns - 要创建或冻结的列数。
 * @ja columns - 作成または固定する列数です。
 * @ko columns - 만들거나 고정할 열 수입니다.
 *
 * @param flags - ImGuiTableFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiTableFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiTableFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiTableFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when the table is visible and rows may be submitted. Call
 * EndTable() only when true; on false skip all table commands for this scope.
 * @zh 表格可见且可以提交行时为 true。仅为 true 时调用 EndTable()；为 false 时跳过此作用域的所有表格命令。
 * @ja テーブルが可視で行を描ける場合は true です。true の場合だけ EndTable() を呼び、false なら全テーブル操作を省略します。
 * @ko 테이블이 보여 행을 제출할 수 있으면 true입니다. true일 때만 EndTable()을 호출하고 false이면 해당 범위의
 * 테이블 명령을 모두 생략합니다.
 */
export function BeginTable(
  str_id: string | Uint8Array,
  columns: number,
  flags: number = 0,
): boolean {
  return native.BeginTable(str_id, columns, flags);
}

/**
 * Begin a table layout for submitting rows and columns.
 *
 * @zh 开始用于添加行列内容的表格布局。
 * @ja 行と列の内容を追加するためのテーブルレイアウトを開始します。
 * @ko 행과 열의 내용을 추가하기 위한 테이블 레이아웃을 시작합니다.
 *
 * @param str_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh str_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja str_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko str_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param columns - Number of columns to create or freeze.
 * @zh columns - 要创建或冻结的列数。
 * @ja columns - 作成または固定する列数です。
 * @ko columns - 만들거나 고정할 열 수입니다.
 *
 * @param flags - ImGuiTableFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiTableFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiTableFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiTableFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param outer_size - Outer table width and height in pixels; interpretation
 * depends on scrolling flags. A zero axis uses the default available/auto-sized
 * extent.
 * @zh outer_size - 表格外部像素宽高，解释取决于滚动标志；为零的轴使用默认可用或自动尺寸。
 * @ja outer_size - テーブル外枠のピクセル寸法です。スクロール設定で意味が変わり、0 は既定の利用可能幅または自動寸法です。
 * @ko outer_size - 테이블 외곽 픽셀 크기입니다. 스크롤 플래그에 따라 해석되며 0인 축은 기본 가용 크기 또는 자동
 * 크기입니다.
 *
 * @param inner_width - Virtual table width in pixels when horizontal scrolling
 * is enabled; 0 uses the available width.
 * @zh inner_width - 启用水平滚动时的表格虚拟像素宽度；0 使用可用宽度。
 * @ja inner_width - 水平スクロール時の仮想テーブル幅です。0 は利用可能な幅を使います。
 * @ko inner_width - 가로 스크롤 시 가상 테이블 픽셀 너비입니다. 0은 사용 가능한 너비입니다.
 *
 * @returns True when the table is visible and rows may be submitted. Call
 * EndTable() only when true; on false skip all table commands for this scope.
 * @zh 表格可见且可以提交行时为 true。仅为 true 时调用 EndTable()；为 false 时跳过此作用域的所有表格命令。
 * @ja テーブルが可視で行を描ける場合は true です。true の場合だけ EndTable() を呼び、false なら全テーブル操作を省略します。
 * @ko 테이블이 보여 행을 제출할 수 있으면 true입니다. true일 때만 EndTable()을 호출하고 false이면 해당 범위의
 * 테이블 명령을 모두 생략합니다.
 */
export function BeginTableEx(
  str_id: string | Uint8Array,
  columns: number,
  flags: number = 0,
  outer_size: ImVec2Like = { x: 0, y: 0 },
  inner_width: number = 0.0,
): boolean {
  return native.BeginTableEx(str_id, columns, flags, outer_size, inner_width);
}

/**
 * End the current table.
 *
 * @zh 结束当前表格。
 * @ja 現在のテーブルを終了します。
 * @ko 현재 테이블을 종료합니다.
 *
 * @remarks
 * only call EndTable() if BeginTable() returns true!
 * @zh
 * 仅在 BeginTable() 返回 true 时调用 EndTable()！
 * @ja
 * BeginTable() が true を返した場合のみ EndTable() を呼んでください！
 * @ko
 * BeginTable()이 true를 반환한 경우에만 EndTable()을 호출하세요!
 */
export function EndTable(): void {
  native.EndTable();
}

/**
 * Finish the current table row and begin a new row.
 *
 * @zh 结束当前表格行，并开始新的一行。
 * @ja 現在のテーブル行を終了し、新しい行を開始します。
 * @ko 현재 테이블 행을 끝내고 새 행을 시작합니다.
 *
 * @remarks
 * Implied row_flags = 0, min_row_height = 0.0
 * @zh
 * 隐含参数：row_flags = 0, min_row_height = 0.0。
 * @ja
 * 暗黙の引数：row_flags = 0, min_row_height = 0.0。
 * @ko
 * 암묵적 인수: row_flags = 0, min_row_height = 0.0.
 */
export function TableNextRow(): void {
  native.TableNextRow();
}

/**
 * Append into the first cell of a new row.
 *
 * @zh 开始向新行的第一个单元格追加内容。
 * @ja 新しい行の最初のセルへの追加を開始します。
 * @ko 새 행의 첫 셀에 내용 추가를 시작합니다.
 *
 * @param row_flags - ImGuiTableRowFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh row_flags - 控制此操作的 ImGuiTableRowFlags 选项；可用 | 组合兼容的标志位。
 * @ja row_flags - この操作を制御する ImGuiTableRowFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko row_flags - 이 동작을 제어하는 ImGuiTableRowFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param min_row_height - Minimum height of the next table row in pixels.
 * @zh min_row_height - 下一表格行的最小像素高度。
 * @ja min_row_height - 次のテーブル行の最小ピクセル高さです。
 * @ko min_row_height - 다음 테이블 행의 최소 픽셀 높이입니다.
 */
export function TableNextRowEx(
  row_flags: number = 0,
  min_row_height: number = 0.0,
): void {
  native.TableNextRowEx(row_flags, min_row_height);
}

/**
 * Advance to the next table column, wrapping to a new row as needed.
 *
 * @zh 前进到下一表格列，并在需要时换行。
 * @ja 次のテーブル列に進み、必要なら次の行へ移動します。
 * @ko 다음 테이블 열로 이동하며 필요하면 다음 행으로 넘어갑니다.
 *
 * @remarks
 * append into the next column (or first column of next row if currently in last
 * column).
 *
 * Return true when column is visible.
 * @zh
 * 开始向下一列追加内容（若当前为最后一列，则进入下一行第一列）。
 *
 * 列可见时返回 true。
 * @ja
 * 次の列（現在が最終列なら次の行の最初の列）への追加を開始します。
 *
 * 列が表示されている場合に true を返します。
 * @ko
 * 다음 열(현재 마지막 열이면 다음 행의 첫 열)에 내용 추가를 시작합니다.
 *
 * 열이 보이면 true를 반환합니다.
 *
 * @returns True if the selected column is visible or needs output for
 * measurement; false permits skipping its contents.
 * @zh 所选列可见或需要输出以测量时为 true；false 时可跳过其内容。
 * @ja 列が可視または測定用出力を必要とする場合は true です。false なら内容を省略できます。
 * @ko 열이 보이거나 측정을 위한 출력이 필요하면 true입니다. false이면 내용을 생략할 수 있습니다.
 */
export function TableNextColumn(): boolean {
  return native.TableNextColumn();
}

/**
 * Append into the specified column.
 *
 * @zh 开始向指定列追加内容。
 * @ja 指定列への追加を開始します。
 * @ko 지정한 열에 내용 추가를 시작합니다.
 *
 * @remarks
 * Return true when column is visible.
 * @zh
 * 列可见时返回 true。
 * @ja
 * 列が表示されている場合に true を返します。
 * @ko
 * 열이 보이면 true를 반환합니다.
 *
 * @param column_n - Zero-based column index; -1 means the current column only
 * in APIs that support that default.
 * @zh column_n - 从零开始的列索引；仅在支持该默认值的 API 中，-1 表示当前列。
 * @ja column_n - 0 始まりの列インデックスです。-1 はその既定値を受け付ける API でのみ現在の列を意味します。
 * @ko column_n - 0부터 시작하는 열 인덱스입니다. -1은 해당 기본값을 지원하는 API에서만 현재 열을 의미합니다.
 *
 * @returns True if the selected column is visible or needs output for
 * measurement; false permits skipping its contents.
 * @zh 所选列可见或需要输出以测量时为 true；false 时可跳过其内容。
 * @ja 列が可視または測定用出力を必要とする場合は true です。false なら内容を省略できます。
 * @ko 열이 보이거나 측정을 위한 출력이 필요하면 true입니다. false이면 내용을 생략할 수 있습니다.
 */
export function TableSetColumnIndex(column_n: number): boolean {
  return native.TableSetColumnIndex(column_n);
}

/**
 * Declare a table column and configure its layout.
 *
 * @zh 声明表格列并配置其布局。
 * @ja テーブルの列を宣言し、レイアウトを設定します。
 * @ko 테이블 열을 선언하고 레이아웃을 설정합니다.
 *
 * @remarks
 * - Use TableSetupColumn() to specify label, resizing policy, default
 *   width/weight, id, various other flags etc.
 *
 * - Use TableHeadersRow() to create a header row and automatically submit a
 *   TableHeader() for each column. Headers are required to perform: reordering,
 *   sorting, and opening the context menu. The context menu can also be made
 *   available in columns body using ImGuiTableFlags.ContextMenuInBody.
 *
 * - You may manually submit headers using TableNextRow() + TableHeader() calls,
 *   but this is only useful in some advanced use cases (e.g. adding custom
 *   widgets in header row).
 *
 * - Use TableSetupScrollFreeze() to lock columns/rows so they stay visible when
 *   scrolled.
 *
 * Implied init_width_or_weight = 0.0, user_id = 0
 * @zh
 * 表格：标题与列声明。
 *
 * - 用 TableSetupColumn() 指定标签、缩放策略、默认宽度/权重、ID 及其他标志等。
 *
 * - 用 TableHeadersRow() 创建标题行，并为每列自动提交 TableHeader()。重新排序、排序和打开上下文菜单都需要标题；使用
 *   ImGuiTableFlags.ContextMenuInBody 也可在列正文中启用上下文菜单。
 *
 * - 可通过 TableNextRow() + TableHeader() 手动提交标题，但仅在某些高级场景（如在标题行添加自定义控件）中有用。
 *
 * - 用 TableSetupScrollFreeze() 锁定列/行，使其在滚动时保持可见。
 *
 * 隐含参数：init_width_or_weight = 0.0, user_id = 0。
 * @ja
 * テーブル：ヘッダーと列の宣言。
 *
 * - TableSetupColumn() でラベル、サイズ変更方針、既定の幅／重み、ID、各種フラグなどを指定します。
 *
 * - TableHeadersRow() はヘッダー行を作り、各列の TableHeader()
 *   を自動送信します。列の並べ替え、ソート、コンテキストメニューを開くにはヘッダーが必要です。
 *   ImGuiTableFlags.ContextMenuInBody で列の本文にもコンテキストメニューを有効にできます。
 *
 * - TableNextRow() + TableHeader()
 *   で手動送信もできますが、ヘッダー行に独自のウィジェットを入れるなど高度な用途に限って有用です。
 *
 * - TableSetupScrollFreeze() で列／行を固定し、スクロール中も表示させます。
 *
 * 暗黙の引数：init_width_or_weight = 0.0, user_id = 0。
 * @ko
 * 테이블: 헤더와 열 선언.
 *
 * - TableSetupColumn()으로 레이블, 크기 조절 정책, 기본 너비/가중치, ID, 각종 플래그 등을 지정합니다.
 *
 * - TableHeadersRow()는 헤더 행을 만들고 각 열에 TableHeader()를 자동 제출합니다. 열 순서 변경, 정렬,
 *   컨텍스트 메뉴 열기에는 헤더가 필요합니다. ImGuiTableFlags.ContextMenuInBody를 사용하면 열 본문에서도
 *   컨텍스트 메뉴를 사용할 수 있습니다.
 *
 * - TableNextRow() + TableHeader()로 헤더를 직접 제출할 수도 있지만, 헤더 행에 사용자 정의 위젯을 넣는 등의
 *   고급 용도에만 유용합니다.
 *
 * - TableSetupScrollFreeze()로 열/행을 고정하여 스크롤 중에도 보이게 합니다.
 *
 * 암묵적 인수: init_width_or_weight = 0.0, user_id = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param flags - ImGuiTableColumnFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiTableColumnFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiTableColumnFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiTableColumnFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 */
export function TableSetupColumn(
  label: string | Uint8Array,
  flags: number = 0,
): void {
  native.TableSetupColumn(label, flags);
}

/**
 * Declare a table column and configure its label, sizing policy, and behavior.
 *
 * @zh 声明表格列，并配置其标签、尺寸策略和行为。
 * @ja テーブル列を宣言し、ラベル、サイズ調整方針、動作を設定します。
 * @ko 테이블 열을 선언하고 레이블, 크기 조정 정책 및 동작을 설정합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param flags - ImGuiTableColumnFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiTableColumnFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiTableColumnFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiTableColumnFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param init_width_or_weight - Initial pixel width for fixed columns or
 * relative weight for stretch columns; 0 uses automatic sizing.
 * @zh init_width_or_weight - 固定列的初始像素宽度或拉伸列的相对权重；0 使用自动尺寸。
 * @ja init_width_or_weight - 固定列の初期ピクセル幅または伸縮列の相対重みです。0 は自動設定です。
 * @ko init_width_or_weight - 고정 열의 초기 픽셀 너비 또는 확장 열의 상대 가중치입니다. 0은 자동 크기입니다.
 *
 * @param user_id - Integer identifier for the item, storage entry, or column,
 * rather than a display index.
 * @zh user_id - 用于项、存储条目或列的整数标识符，不是显示索引。
 * @ja user_id - 項目、保存エントリー、列を識別する整数です。表示インデックスではありません。
 * @ko user_id - 항목, 저장 항목 또는 열의 정수 식별자이며 표시 인덱스가 아닙니다.
 */
export function TableSetupColumnEx(
  label: string | Uint8Array,
  flags: number = 0,
  init_width_or_weight: number = 0.0,
  user_id: number = 0,
): void {
  native.TableSetupColumnEx(label, flags, init_width_or_weight, user_id);
}

/**
 * Lock columns/rows so they stay visible when scrolled.
 *
 * @zh 锁定列/行，使其在滚动时保持可见。
 * @ja 列／行を固定し、スクロール中も表示されるようにします。
 * @ko 열/행을 고정하여 스크롤 중에도 보이게 합니다.
 *
 * @param cols - Number of columns to create or freeze.
 * @zh cols - 要创建或冻结的列数。
 * @ja cols - 作成または固定する列数です。
 * @ko cols - 만들거나 고정할 열 수입니다.
 *
 * @param rows - Number of leading table rows to keep frozen while scrolling.
 * @zh rows - 滚动时保持冻结的表格起始行数。
 * @ja rows - スクロール中も固定する先頭行数です。
 * @ko rows - 스크롤 중 고정할 앞쪽 테이블 행 수입니다.
 */
export function TableSetupScrollFreeze(cols: number, rows: number): void {
  native.TableSetupScrollFreeze(cols, rows);
}

/**
 * Submit one header cell manually (rarely used).
 *
 * @zh 手动提交一个标题单元格（很少使用）。
 * @ja ヘッダーセルを 1 つ手動で送信します（使用頻度は低いです）。
 * @ko 헤더 셀 하나를 직접 제출합니다(드물게 사용).
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 */
export function TableHeader(label: string | Uint8Array): void {
  native.TableHeader(label);
}

/**
 * Submit table column headers and their context menu.
 *
 * @zh 提交表格列标题及其上下文菜单。
 * @ja テーブルの列見出しとコンテキストメニューを追加します。
 * @ko 테이블 열 헤더와 컨텍스트 메뉴를 제출합니다.
 *
 * @remarks
 * submit a row with headers cells based on data provided to TableSetupColumn()
 * + submit context menu
 * @zh
 * 根据 TableSetupColumn() 提供的数据提交包含表头单元格的一行，并提交上下文菜单。
 * @ja
 * TableSetupColumn() に渡したデータに基づくヘッダーセルの行とコンテキストメニューを送信します。
 * @ko
 * TableSetupColumn()에 제공한 데이터에 따라 헤더 셀로 구성된 행과 컨텍스트 메뉴를 제출합니다.
 */
export function TableHeadersRow(): void {
  native.TableHeadersRow();
}

/**
 * Submit angled headers for columns that request them.
 *
 * @zh 为启用倾斜标题的列提交倾斜表头。
 * @ja 斜めの見出しを指定した列に対応する見出しを追加します。
 * @ko 기울어진 헤더를 지정한 열에 해당 헤더를 제출합니다.
 *
 * @remarks
 * submit a row with angled headers for every column with the
 * ImGuiTableColumnFlags.AngledHeader flag.
 *
 * MUST BE FIRST ROW.
 * @zh
 * 为每个带 ImGuiTableColumnFlags.AngledHeader 标志的列提交斜向表头行。
 *
 * 必须是第一行。
 * @ja
 * ImGuiTableColumnFlags.AngledHeader フラグを持つ各列の斜めヘッダーを含む行を送信します。
 *
 * 必ず最初の行でなければなりません。
 * @ko
 * ImGuiTableColumnFlags.AngledHeader 플래그가 있는 각 열의 기울어진 헤더 행을 제출합니다.
 *
 * 반드시 첫 번째 행이어야 합니다.
 */
export function TableAngledHeadersRow(): void {
  native.TableAngledHeadersRow();
}

/**
 * Get the current table sorting specifications.
 *
 * @zh 获取当前表格的排序规则。
 * @ja 現在のテーブルの並べ替え条件を取得します。
 * @ko 현재 테이블의 정렬 조건을 가져옵니다.
 *
 * @remarks
 * - Sorting: call TableGetSortSpecs() to retrieve latest sort specs for the
 *   table. null when not sorting. When 'sort_specs->SpecsDirty == true' you
 *   should sort your data. It will be true when sorting specs have changed
 *   since last call, or the first time. Make sure to set 'SpecsDirty = false'
 *   after sorting, else you may wastefully sort your data every frame!
 *
 * - Functions args 'int column_n' treat the default value of -1 as the same as
 *   passing the current column index.
 *
 * get latest sort specs for the table (null if not sorting).  Lifetime: don't
 * hold on this pointer over multiple frames or past any subsequent call to
 * BeginTable().
 * @zh
 * 表格：排序与其他函数。
 *
 * - 排序：调用 TableGetSortSpecs() 获取表格最新的排序规格；未排序时为 null。当 'sort_specs->SpecsDirty
 *   == true' 时应对数据排序。排序规格自上次调用后发生改变或首次调用时，该值为 true。排序后务必设置 'SpecsDirty =
 *   false'，否则可能每帧都无谓地排序！
 *
 * - 函数参数 'int column_n' 的默认值 -1 等同于传入当前列索引。获取表格最新的排序规格（未排序时为
 *   null）。生命周期：不要跨多帧或跨后续任何 BeginTable() 调用保留此指针。
 * @ja
 * テーブル：ソートとその他の関数。
 *
 * - ソート：TableGetSortSpecs() で最新のソート指定を取得します。ソートしない場合は null
 *   です。'sort_specs->SpecsDirty == true'
 *   のときデータをソートしてください。前回の呼び出し以降にソート指定が変わった場合や初回は true になります。ソート後は必ず 'SpecsDirty
 *   = false' にしてください。そうしないと毎フレーム無駄なソートを行う可能性があります！
 *
 * - 関数引数 'int column_n' の既定値 -1
 *   は現在の列インデックスを渡すのと同じです。テーブルの最新のソート指定を取得します（ソートしない場合は
 *   null）。寿命：このポインターを複数フレームにわたって、または以後の BeginTable() 呼び出しを越えて保持しないでください。
 * @ko
 * 테이블: 정렬 및 기타 함수.
 *
 * - 정렬: TableGetSortSpecs()로 테이블의 최신 정렬 사양을 가져옵니다. 정렬하지 않으면 null입니다.
 *   'sort_specs->SpecsDirty == true'이면 데이터를 정렬해야 합니다. 마지막 호출 이후 정렬 사양이 변경되었거나 첫
 *   호출일 때 true입니다. 정렬 후 반드시 'SpecsDirty = false'로 설정하세요. 그렇지 않으면 매 프레임 불필요하게
 *   정렬할 수 있습니다!
 *
 * - 함수 인수 'int column_n'의 기본값 -1은 현재 열 인덱스를 전달하는 것과 같습니다. 테이블의 최신 정렬 사양을
 *   가져옵니다(정렬하지 않으면 null). 수명: 이 포인터를 여러 프레임에 걸쳐 또는 이후의 BeginTable() 호출을 넘어서
 *   보관하지 마세요.
 *
 * @returns Borrowed table sort specifications, or null when sorting is
 * disabled/unavailable. Apply changed specs to your data and clear SpecsDirty.
 * @zh 借用的表格排序规则；排序禁用或不可用时为 null。应对数据应用变化的规则并清除 SpecsDirty。
 * @ja 借用のテーブルソート指定です。無効・利用不可なら null です。変更をデータに適用し SpecsDirty を解除します。
 * @ko 빌린 테이블 정렬 명세입니다. 정렬이 비활성화되거나 없으면 null입니다. 변경을 데이터에 적용하고 SpecsDirty를 지웁니다.
 */
export function TableGetSortSpecs(): ImGuiTableSortSpecs | null {
  return native.TableGetSortSpecs();
}

/**
 * Return number of columns (value passed to BeginTable).
 *
 * @zh 返回列数（传给 BeginTable 的值）。
 * @ja 列数（BeginTable に渡した値）を返します。
 * @ko 열 수(BeginTable에 전달한 값)를 반환합니다.
 *
 * @returns Number of columns in the current table, or 0 when no table is
 * active.
 * @zh 当前表格的列数；没有活动表格时返回 0。
 * @ja 現在のテーブルの列数です。有効なテーブルがなければ 0 を返します。
 * @ko 현재 테이블의 열 수입니다. 활성 테이블이 없으면 0을 반환합니다.
 */
export function TableGetColumnCount(): number {
  return native.TableGetColumnCount();
}

/**
 * Return current column index.
 *
 * @zh 返回当前列索引。
 * @ja 現在の列インデックスを返します。
 * @ko 현재 열 인덱스를 반환합니다.
 *
 * @returns Zero-based index of the current column.
 * @zh 当前列从零开始的索引。
 * @ja 現在の列の 0 始まりのインデックスです。
 * @ko 현재 열의 0부터 시작하는 인덱스입니다.
 */
export function TableGetColumnIndex(): number {
  return native.TableGetColumnIndex();
}

/**
 * Return current row index.
 *
 * @zh 返回当前行索引。
 * @ja 現在の行インデックスを返します。
 * @ko 현재 행 인덱스를 반환합니다.
 *
 * @returns Zero-based current table row index; -1 before the first row starts.
 * @zh 当前表格行的零基索引；首行开始前为 -1。
 * @ja 現在の行の 0 始まりの番号です。最初の行の開始前は -1 です。
 * @ko 현재 테이블 행의 0 기반 인덱스입니다. 첫 행 시작 전에는 -1입니다.
 */
export function TableGetRowIndex(): number {
  return native.TableGetRowIndex();
}

/**
 * Get a table column name.
 *
 * @zh 获取表格列名。
 * @ja テーブルの列名を取得します。
 * @ko 테이블 열 이름을 가져옵니다.
 *
 * @remarks
 * return "" if column didn't have a name declared by TableSetupColumn().
 *
 * Pass -1 to use current column.
 * @zh
 * 如果未通过 TableSetupColumn() 为列声明名称，则返回 ""。
 *
 * 传入 -1 使用当前列。
 * @ja
 * TableSetupColumn() で列名を宣言していない場合は "" を返します。
 *
 * -1 を渡すと現在の列を使用します。
 * @ko
 * TableSetupColumn()으로 열 이름을 선언하지 않았다면 ""를 반환합니다.
 *
 * -1을 전달하면 현재 열을 사용합니다.
 *
 * @param column_n - Zero-based column index; -1 means the current column only
 * in APIs that support that default.
 * @zh column_n - 从零开始的列索引；仅在支持该默认值的 API 中，-1 表示当前列。
 * @ja column_n - 0 始まりの列インデックスです。-1 はその既定値を受け付ける API でのみ現在の列を意味します。
 * @ko column_n - 0부터 시작하는 열 인덱스입니다. -1은 해당 기본값을 지원하는 API에서만 현재 열을 의미합니다.
 *
 * @returns Configured column label as a JS string, or an empty string when no
 * label was assigned.
 * @zh 已配置列标签的 JS 字符串；未指定标签时为空字符串。
 * @ja 設定した列ラベルの JS 文字列です。未設定なら空文字列です。
 * @ko 설정된 열 레이블의 JS 문자열입니다. 미지정 시 빈 문자열입니다.
 */
export function TableGetColumnName(column_n: number = -1): string | null {
  return native.TableGetColumnName(column_n);
}

/**
 * Return column flags so you can query their Enabled/Visible/Sorted/Hovered
 * status flags.
 *
 * @zh 返回列标志，以便查询其 Enabled/Visible/Sorted/Hovered 状态标志。
 * @ja 列のフラグを返し、Enabled/Visible/Sorted/Hovered 状態フラグを調べられるようにします。
 * @ko 열 플래그를 반환하여 Enabled/Visible/Sorted/Hovered 상태 플래그를 조회할 수 있게 합니다.
 *
 * @remarks
 * Pass -1 to use current column.
 * @zh
 * 传入 -1 使用当前列。
 * @ja
 * -1 を渡すと現在の列を使用します。
 * @ko
 * -1을 전달하면 현재 열을 사용합니다.
 *
 * @param column_n - Zero-based column index; -1 means the current column only
 * in APIs that support that default.
 * @zh column_n - 从零开始的列索引；仅在支持该默认值的 API 中，-1 表示当前列。
 * @ja column_n - 0 始まりの列インデックスです。-1 はその既定値を受け付ける API でのみ現在の列を意味します。
 * @ko column_n - 0부터 시작하는 열 인덱스입니다. -1은 해당 기본값을 지원하는 API에서만 현재 열을 의미합니다.
 *
 * @returns ImGuiTableColumnFlags including configured options and current
 * enabled/visible/sorted/hovered status bits.
 * @zh ImGuiTableColumnFlags，包含配置选项和当前启用、可见、排序、悬停状态位。
 * @ja 設定と現在の有効・可視・ソート・ホバー状態を含む ImGuiTableColumnFlags です。
 * @ko 설정 옵션과 현재 활성, 표시, 정렬 및 호버 상태를 포함한 ImGuiTableColumnFlags입니다.
 */
export function TableGetColumnFlags(column_n: number = -1): number {
  return native.TableGetColumnFlags(column_n);
}

/**
 * Change user accessible enabled/disabled state of a column.
 *
 * @zh 修改用户可控制的列启用/禁用状态。
 * @ja ユーザーが操作できる列の有効/無効状態を変更します。
 * @ko 사용자가 제어할 수 있는 열의 활성/비활성 상태를 변경합니다.
 *
 * @remarks
 * Set to false to hide the column.
 *
 * User can use the context menu to change this themselves (right-click in
 * headers, or right-click in columns body with
 * ImGuiTableFlags.ContextMenuInBody)
 * @zh
 * 设为 false 隐藏该列。
 *
 * 用户也可通过上下文菜单自行修改（右键单击表头；或启用 ImGuiTableFlags.ContextMenuInBody 后右键单击列内容区域）。
 * @ja
 * false にすると列を非表示にします。
 *
 * ユーザーもコンテキストメニューから変更できます（ヘッダーを右クリック、または ImGuiTableFlags.ContextMenuInBody
 * を指定して列の本文を右クリック）。
 * @ko
 * false로 설정하면 열을 숨깁니다.
 *
 * 사용자도 컨텍스트 메뉴로 변경할 수 있습니다(헤더를 우클릭하거나 ImGuiTableFlags.ContextMenuInBody 설정 시 열
 * 본문을 우클릭).
 *
 * @param column_n - Zero-based column index; -1 means the current column only
 * in APIs that support that default.
 * @zh column_n - 从零开始的列索引；仅在支持该默认值的 API 中，-1 表示当前列。
 * @ja column_n - 0 始まりの列インデックスです。-1 はその既定値を受け付ける API でのみ現在の列を意味します。
 * @ko column_n - 0부터 시작하는 열 인덱스입니다. -1은 해당 기본값을 지원하는 API에서만 현재 열을 의미합니다.
 *
 * @param v - Whether the specified column should be enabled for display.
 * @zh v - 是否启用指定列的显示。
 * @ja v - 指定列を表示対象にするかどうかです。
 * @ko v - 지정한 열을 표시할지 여부입니다.
 */
export function TableSetColumnEnabled(column_n: number, v: boolean): void {
  native.TableSetColumnEnabled(column_n, v);
}

/**
 * Get the index of the hovered table column.
 *
 * @zh 获取鼠标悬停的表格列索引。
 * @ja マウスがあるテーブル列のインデックスを取得します。
 * @ko 마우스가 있는 테이블 열의 인덱스를 가져옵니다.
 *
 * @remarks
 * return hovered column.
 *
 * return -1 when table is not hovered.
 *
 * return columns_count if the unused space at the right of visible columns is
 * hovered.
 *
 * Can also use (TableGetColumnFlags() & ImGuiTableColumnFlags.IsHovered)
 * instead.
 * @zh
 * 返回悬停的列。
 *
 * 未悬停于表格时返回 -1；悬停于可见列右侧的未使用空间时返回 columns_count。
 *
 * 也可使用 (TableGetColumnFlags() & ImGuiTableColumnFlags.IsHovered)。
 * @ja
 * ホバー中の列を返します。
 *
 * テーブル上にない場合は -1、表示列の右側の未使用領域にある場合は columns_count を返します。
 *
 * 代わりに (TableGetColumnFlags() & ImGuiTableColumnFlags.IsHovered) も使用できます。
 * @ko
 * 마우스가 올라가 있는 열을 반환합니다.
 *
 * 테이블 위가 아니면 -1, 보이는 열 오른쪽의 미사용 공간 위라면 columns_count를 반환합니다.
 *
 * 대신 (TableGetColumnFlags() & ImGuiTableColumnFlags.IsHovered)를 사용할 수도 있습니다.
 *
 * @returns Hovered column index; columns_count denotes unused space to the
 * right, and -1 means the table is not hovered.
 * @zh 悬停列索引；columns_count 表示右侧未使用空间，-1 表示未悬停表格。
 * @ja ホバー中の列番号です。columns_count は右の空白、-1 はテーブル外を示します。
 * @ko 호버된 열 인덱스입니다. columns_count는 오른쪽 빈 공간, -1은 테이블 밖을 뜻합니다.
 */
export function TableGetHoveredColumn(): number {
  return native.TableGetHoveredColumn();
}

/**
 * Change the color of a cell, row, or column.
 *
 * @zh 修改单元格、行或列的颜色。
 * @ja セル、行、列の色を変更します。
 * @ko 셀, 행 또는 열의 색상을 변경합니다.
 *
 * @remarks
 * See `ImGuiTableBgTarget` for available background layers.
 * @zh
 * 可用背景层见 `ImGuiTableBgTarget`。
 * @ja
 * 使用可能な背景レイヤーは `ImGuiTableBgTarget` を参照してください。
 * @ko
 * 사용 가능한 배경 레이어는 `ImGuiTableBgTarget`을 참조하세요.
 *
 * @param target - ImGuiTableBgTarget selecting a row or cell background layer.
 * @zh target - 选择行或单元格背景层的 ImGuiTableBgTarget。
 * @ja target - 行またはセルの背景レイヤーを選ぶ ImGuiTableBgTarget です。
 * @ko target - 행 또는 셀 배경 레이어를 고르는 ImGuiTableBgTarget입니다.
 *
 * @param color - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh color - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja color - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko color - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param column_n - Zero-based column index; -1 means the current column only
 * in APIs that support that default.
 * @zh column_n - 从零开始的列索引；仅在支持该默认值的 API 中，-1 表示当前列。
 * @ja column_n - 0 始まりの列インデックスです。-1 はその既定値を受け付ける API でのみ現在の列を意味します。
 * @ko column_n - 0부터 시작하는 열 인덱스입니다. -1은 해당 기본값을 지원하는 API에서만 현재 열을 의미합니다.
 */
export function TableSetBgColor(
  target: number,
  color: number,
  column_n: number = -1,
): void {
  native.TableSetBgColor(target, color, column_n);
}
