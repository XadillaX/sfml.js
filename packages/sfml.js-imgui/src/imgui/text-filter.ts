import { native } from '../internal/native';
import type { ImGuiTextFilter } from '../types';

/**
 * Display a text-filter editor and rebuild its filter.
 *
 * @zh 显示文本过滤器编辑框并重建过滤条件。
 * @ja テキストフィルターの入力欄を表示し、フィルターを再構築します。
 * @ko 텍스트 필터 편집기를 표시하고 필터를 다시 구성합니다.
 *
 * @remarks
 * Helper calling InputText+Build
 * @zh
 * 调用 InputText+Build 的辅助函数。
 * @ja
 * InputText+Build を呼ぶヘルパーです。
 * @ko
 * InputText+Build를 호출하는 헬퍼입니다.
 *
 * @param self - ImGuiTextFilter handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextFilter 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextFilter ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextFilter 핸들입니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param width - Column or filter input width in pixels; a negative filter
 * width aligns to the available right edge.
 * @zh width - 列或过滤输入框的像素宽度；负的过滤框宽度相对可用右边缘对齐。
 * @ja width - 列またはフィルター入力のピクセル幅です。フィルターの負の幅は利用可能な右端を基準にします。
 * @ko width - 열 또는 필터 입력의 픽셀 너비입니다. 필터의 음수 너비는 가용 오른쪽 끝 기준입니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function TextFilter_Draw(
  self: ImGuiTextFilter,
  label: string | Uint8Array,
  width: number = 0.0,
): boolean {
  return native.TextFilter_Draw(self, label, width);
}

/**
 * Test text against the parsed inclusion and exclusion filters.
 *
 * @zh 按已解析的包含和排除筛选条件检查文本。
 * @ja 解析済みの包含・除外フィルターに照らしてテキストを判定します。
 * @ko 분석된 포함 및 제외 필터로 텍스트를 검사합니다.
 *
 * @param self - ImGuiTextFilter handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextFilter 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextFilter ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextFilter 핸들입니다.
 *
 * @param text - UTF-8 text. With omitted/null text_end, strings are encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * the selected bytes are copied and NUL-terminated for bounded filtering.
 * @zh text - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，选定字节会复制并补 NUL，防止过滤越过末端。
 * @ja text - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定すると Uint8Array の指定範囲をコピーし、NUL で検索範囲を制限します。
 * @ko text - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는 직접
 * 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array의 선택 범위를 복사하고 NUL로 검색 범위를 제한합니다.
 *
 * @param text_end - Exclusive endpoint view, not a length or another string.
 * Explicit begin/end must share one backing buffer and satisfy
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength.
 * An empty end view is valid; neither view needs NUL termination.
 * Omitted/null end uses ordinary NUL-terminated UTF-8 conversion.
 * @zh text_end - 尾后位置视图，不是长度或另一字符串。显式起止视图须共享同一底层缓冲区，且满足
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength。
 * 末端可为空视图，两端无须 NUL 终止符。省略或 null 使用普通 NUL 终止 UTF-8 转换。
 * @ja text_end - 終端直後を示すビューです。長さや別の文字列ではありません。両端は同じバッファーを共有し、
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength
 * を満たす必要があります。
 * 空の終端ビューも有効で、NUL は不要です。省略または null では通常の NUL 終端 UTF-8 変換を使います。
 * @ko text_end - 끝 다음 위치의 뷰이며 길이나 다른 문자열이 아닙니다. 양쪽은 같은 버퍼를 공유하며
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength를
 * 만족해야 합니다.
 * 빈 끝 뷰도 허용하며 NUL 종료는 필요 없습니다. 생략하거나 null이면 일반 NUL 종료 UTF-8 변환을 사용합니다.
 *
 * @returns True if the text passes the built include/exclude filters, or if no
 * filter is active.
 * @zh 文字通过已构建的包含及排除过滤器，或无活动过滤器时为 true。
 * @ja 構築済みの包含・除外フィルターを通るか、フィルターなしなら true です。
 * @ko 텍스트가 구성된 포함 및 제외 필터를 통과하거나 활성 필터가 없으면 true입니다.
 */
export function TextFilter_PassFilter(
  self: ImGuiTextFilter,
  text: string | Uint8Array,
  text_end?: null,
): boolean;

/**
 * Test text against the parsed inclusion and exclusion filters.
 *
 * @zh 按已解析的包含和排除筛选条件检查文本。
 * @ja 解析済みの包含・除外フィルターに照らしてテキストを判定します。
 * @ko 분석된 포함 및 제외 필터로 텍스트를 검사합니다.
 *
 * @param self - ImGuiTextFilter handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextFilter 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextFilter ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextFilter 핸들입니다.
 *
 * @param text - UTF-8 text. With omitted/null text_end, strings are encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * the selected bytes are copied and NUL-terminated for bounded filtering.
 * @zh text - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，选定字节会复制并补 NUL，防止过滤越过末端。
 * @ja text - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定すると Uint8Array の指定範囲をコピーし、NUL で検索範囲を制限します。
 * @ko text - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는 직접
 * 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array의 선택 범위를 복사하고 NUL로 검색 범위를 제한합니다.
 *
 * @param text_end - Exclusive endpoint view, not a length or another string.
 * Explicit begin/end must share one backing buffer and satisfy
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength.
 * An empty end view is valid; neither view needs NUL termination.
 * Omitted/null end uses ordinary NUL-terminated UTF-8 conversion.
 * @zh text_end - 尾后位置视图，不是长度或另一字符串。显式起止视图须共享同一底层缓冲区，且满足
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength。
 * 末端可为空视图，两端无须 NUL 终止符。省略或 null 使用普通 NUL 终止 UTF-8 转换。
 * @ja text_end - 終端直後を示すビューです。長さや別の文字列ではありません。両端は同じバッファーを共有し、
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength
 * を満たす必要があります。
 * 空の終端ビューも有効で、NUL は不要です。省略または null では通常の NUL 終端 UTF-8 変換を使います。
 * @ko text_end - 끝 다음 위치의 뷰이며 길이나 다른 문자열이 아닙니다. 양쪽은 같은 버퍼를 공유하며
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength를
 * 만족해야 합니다.
 * 빈 끝 뷰도 허용하며 NUL 종료는 필요 없습니다. 생략하거나 null이면 일반 NUL 종료 UTF-8 변환을 사용합니다.
 *
 * @returns True if the text passes the built include/exclude filters, or if no
 * filter is active.
 * @zh 文字通过已构建的包含及排除过滤器，或无活动过滤器时为 true。
 * @ja 構築済みの包含・除外フィルターを通るか、フィルターなしなら true です。
 * @ko 텍스트가 구성된 포함 및 제외 필터를 통과하거나 활성 필터가 없으면 true입니다.
 */
export function TextFilter_PassFilter(
  self: ImGuiTextFilter,
  text: Uint8Array,
  text_end: Uint8Array,
): boolean;
/**
 * Test text against the parsed inclusion and exclusion filters.
 *
 * @zh 按已解析的包含和排除筛选条件检查文本。
 * @ja 解析済みの包含・除外フィルターに照らしてテキストを判定します。
 * @ko 분석된 포함 및 제외 필터로 텍스트를 검사합니다.
 *
 * @param self - ImGuiTextFilter handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextFilter 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextFilter ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextFilter 핸들입니다.
 *
 * @param text - UTF-8 text. With omitted/null text_end, strings are encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * the selected bytes are copied and NUL-terminated for bounded filtering.
 * @zh text - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，选定字节会复制并补 NUL，防止过滤越过末端。
 * @ja text - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定すると Uint8Array の指定範囲をコピーし、NUL で検索範囲を制限します。
 * @ko text - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는 직접
 * 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array의 선택 범위를 복사하고 NUL로 검색 범위를 제한합니다.
 *
 * @param text_end - Exclusive endpoint view, not a length or another string.
 * Explicit begin/end must share one backing buffer and satisfy
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength.
 * An empty end view is valid; neither view needs NUL termination.
 * Omitted/null end uses ordinary NUL-terminated UTF-8 conversion.
 * @zh text_end - 尾后位置视图，不是长度或另一字符串。显式起止视图须共享同一底层缓冲区，且满足
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength。
 * 末端可为空视图，两端无须 NUL 终止符。省略或 null 使用普通 NUL 终止 UTF-8 转换。
 * @ja text_end - 終端直後を示すビューです。長さや別の文字列ではありません。両端は同じバッファーを共有し、
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength
 * を満たす必要があります。
 * 空の終端ビューも有効で、NUL は不要です。省略または null では通常の NUL 終端 UTF-8 変換を使います。
 * @ko text_end - 끝 다음 위치의 뷰이며 길이나 다른 문자열이 아닙니다. 양쪽은 같은 버퍼를 공유하며
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength를
 * 만족해야 합니다.
 * 빈 끝 뷰도 허용하며 NUL 종료는 필요 없습니다. 생략하거나 null이면 일반 NUL 종료 UTF-8 변환을 사용합니다.
 *
 * @returns True if the text passes the built include/exclude filters, or if no
 * filter is active.
 * @zh 文字通过已构建的包含及排除过滤器，或无活动过滤器时为 true。
 * @ja 構築済みの包含・除外フィルターを通るか、フィルターなしなら true です。
 * @ko 텍스트가 구성된 포함 및 제외 필터를 통과하거나 활성 필터가 없으면 true입니다.
 */
export function TextFilter_PassFilter(
  self: ImGuiTextFilter,
  text: string | Uint8Array,
  text_end: Uint8Array | null = null,
): boolean {
  return native.TextFilter_PassFilter(self, text, text_end);
}

/**
 * Parse the filter input into comma-separated inclusion and exclusion terms.
 *
 * @zh 将筛选输入解析为逗号分隔的包含和排除条件。
 * @ja フィルター入力を、コンマで区切られた包含・除外の条件に解析します。
 * @ko 필터 입력을 쉼표로 구분된 포함 및 제외 조건으로 분석합니다.
 *
 * @param self - ImGuiTextFilter handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextFilter 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextFilter ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextFilter 핸들입니다.
 */
export function TextFilter_Build(self: ImGuiTextFilter): void {
  native.TextFilter_Build(self);
}

/**
 * Clear the filter input and rebuild an empty filter.
 *
 * @zh 清空筛选输入，并重新构建空筛选器。
 * @ja フィルター入力を消去し、空のフィルターを再構築します。
 * @ko 필터 입력을 지우고 빈 필터를 다시 구성합니다.
 *
 * @param self - ImGuiTextFilter handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextFilter 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextFilter ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextFilter 핸들입니다.
 */
export function TextFilter_Clear(self: ImGuiTextFilter): void {
  native.TextFilter_Clear(self);
}

/**
 * Test whether the text filter contains any parsed filter terms.
 *
 * @zh 检查文本筛选器是否包含已解析的筛选条件。
 * @ja テキストフィルターに解析済みの条件があるかを調べます。
 * @ko 텍스트 필터에 분석된 필터 조건이 있는지 확인합니다.
 *
 * @param self - ImGuiTextFilter handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextFilter 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextFilter ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextFilter 핸들입니다.
 *
 * @returns True if at least one parsed filter term is active.
 * @zh 至少一个已解析过滤词生效时为 true。
 * @ja 解析済みフィルター項目が 1 つ以上有効なら true です。
 * @ko 해석된 필터 항목이 하나 이상 활성화되어 있으면 true입니다.
 */
export function TextFilter_IsActive(self: ImGuiTextFilter): boolean {
  return native.TextFilter_IsActive(self);
}
