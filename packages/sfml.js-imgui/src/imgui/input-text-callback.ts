import { native } from '../internal/native';
import type { ImGuiInputTextCallbackData } from '../types';

/**
 * Delete bytes from the callback text buffer and update its editing state.
 *
 * @zh 从回调文本缓冲区删除字节，并更新其编辑状态。
 * @ja コールバックのテキストバッファからバイトを削除し、編集状態を更新します。
 * @ko 콜백 텍스트 버퍼에서 바이트를 삭제하고 편집 상태를 갱신합니다.
 *
 * @param self - ImGuiInputTextCallbackData handle on which this method
 * operates.
 * @zh self - 此方法操作的 ImGuiInputTextCallbackData 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiInputTextCallbackData ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiInputTextCallbackData 핸들입니다.
 *
 * @param pos - Zero-based byte offset in the UTF-8 edit buffer, not a character
 * index.
 * @zh pos - UTF-8 编辑缓冲区内从零开始的字节偏移，不是字符索引。
 * @ja pos - UTF-8 編集バッファーの 0 始まりのバイト位置です。文字番号ではありません。
 * @ko pos - UTF-8 편집 버퍼의 0 기반 바이트 오프셋이며 문자 인덱스가 아닙니다.
 *
 * @param bytes_count - Number of UTF-8 bytes to delete, not a count of Unicode
 * characters.
 * @zh bytes_count - 要删除的 UTF-8 字节数，不是 Unicode 字符数。
 * @ja bytes_count - 削除する UTF-8 のバイト数です。Unicode 文字数ではありません。
 * @ko bytes_count - 삭제할 UTF-8 바이트 수이며 유니코드 문자 수가 아닙니다.
 */
export function InputTextCallbackData_DeleteChars(
  self: ImGuiInputTextCallbackData,
  pos: number,
  bytes_count: number,
): void {
  native.InputTextCallbackData_DeleteChars(self, pos, bytes_count);
}

/**
 * Insert text into the callback buffer, updating editing state and requesting
 * growth if needed.
 *
 * @zh 向回调缓冲区插入文本，更新编辑状态，并在需要时请求扩容。
 * @ja コールバックのバッファにテキストを挿入し、編集状態を更新して必要なら拡張を要求します。
 * @ko 콜백 버퍼에 텍스트를 삽입하고 편집 상태를 갱신하며 필요하면 확장을 요청합니다.
 *
 * @param self - ImGuiInputTextCallbackData handle on which this method
 * operates.
 * @zh self - 此方法操作的 ImGuiInputTextCallbackData 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiInputTextCallbackData ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiInputTextCallbackData 핸들입니다.
 *
 * @param pos - Zero-based byte offset in the UTF-8 edit buffer, not a character
 * index.
 * @zh pos - UTF-8 编辑缓冲区内从零开始的字节偏移，不是字符索引。
 * @ja pos - UTF-8 編集バッファーの 0 始まりのバイト位置です。文字番号ではありません。
 * @ko pos - UTF-8 편집 버퍼의 0 기반 바이트 오프셋이며 문자 인덱스가 아닙니다.
 *
 * @param text - UTF-8 text. With omitted/null text_end, strings are encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh text - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja text - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko text - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는 직접
 * 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array를 직접 읽으며 NUL 종료는 필요 없습니다.
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
 */
export function InputTextCallbackData_InsertChars(
  self: ImGuiInputTextCallbackData,
  pos: number,
  text: string | Uint8Array,
  text_end?: null,
): void;

/**
 * Insert text into the callback buffer, updating editing state and requesting
 * growth if needed.
 *
 * @zh 向回调缓冲区插入文本，更新编辑状态，并在需要时请求扩容。
 * @ja コールバックのバッファにテキストを挿入し、編集状態を更新して必要なら拡張を要求します。
 * @ko 콜백 버퍼에 텍스트를 삽입하고 편집 상태를 갱신하며 필요하면 확장을 요청합니다.
 *
 * @param self - ImGuiInputTextCallbackData handle on which this method
 * operates.
 * @zh self - 此方法操作的 ImGuiInputTextCallbackData 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiInputTextCallbackData ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiInputTextCallbackData 핸들입니다.
 *
 * @param pos - Zero-based byte offset in the UTF-8 edit buffer, not a character
 * index.
 * @zh pos - UTF-8 编辑缓冲区内从零开始的字节偏移，不是字符索引。
 * @ja pos - UTF-8 編集バッファーの 0 始まりのバイト位置です。文字番号ではありません。
 * @ko pos - UTF-8 편집 버퍼의 0 기반 바이트 오프셋이며 문자 인덱스가 아닙니다.
 *
 * @param text - UTF-8 text. With omitted/null text_end, strings are encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh text - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja text - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko text - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는 직접
 * 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array를 직접 읽으며 NUL 종료는 필요 없습니다.
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
 */
export function InputTextCallbackData_InsertChars(
  self: ImGuiInputTextCallbackData,
  pos: number,
  text: Uint8Array,
  text_end: Uint8Array,
): void;
/**
 * Insert text into the callback buffer, updating editing state and requesting
 * growth if needed.
 *
 * @zh 向回调缓冲区插入文本，更新编辑状态，并在需要时请求扩容。
 * @ja コールバックのバッファにテキストを挿入し、編集状態を更新して必要なら拡張を要求します。
 * @ko 콜백 버퍼에 텍스트를 삽입하고 편집 상태를 갱신하며 필요하면 확장을 요청합니다.
 *
 * @param self - ImGuiInputTextCallbackData handle on which this method
 * operates.
 * @zh self - 此方法操作的 ImGuiInputTextCallbackData 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiInputTextCallbackData ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiInputTextCallbackData 핸들입니다.
 *
 * @param pos - Zero-based byte offset in the UTF-8 edit buffer, not a character
 * index.
 * @zh pos - UTF-8 编辑缓冲区内从零开始的字节偏移，不是字符索引。
 * @ja pos - UTF-8 編集バッファーの 0 始まりのバイト位置です。文字番号ではありません。
 * @ko pos - UTF-8 편집 버퍼의 0 기반 바이트 오프셋이며 문자 인덱스가 아닙니다.
 *
 * @param text - UTF-8 text. With omitted/null text_end, strings are encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh text - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja text - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko text - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는 직접
 * 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array를 직접 읽으며 NUL 종료는 필요 없습니다.
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
 */
export function InputTextCallbackData_InsertChars(
  self: ImGuiInputTextCallbackData,
  pos: number,
  text: string | Uint8Array,
  text_end: Uint8Array | null = null,
): void {
  native.InputTextCallbackData_InsertChars(self, pos, text, text_end);
}

/**
 * Select all text in the input callback buffer.
 *
 * @zh 选中输入回调缓冲区中的全部文本。
 * @ja 入力コールバックのバッファ内のテキストをすべて選択します。
 * @ko 입력 콜백 버퍼의 모든 텍스트를 선택합니다.
 *
 * @param self - ImGuiInputTextCallbackData handle on which this method
 * operates.
 * @zh self - 此方法操作的 ImGuiInputTextCallbackData 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiInputTextCallbackData ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiInputTextCallbackData 핸들입니다.
 */
export function InputTextCallbackData_SelectAll(
  self: ImGuiInputTextCallbackData,
): void {
  native.InputTextCallbackData_SelectAll(self);
}

/**
 * Collapse the callback text selection to an empty range at the end of the
 * buffer.
 *
 * @zh 将回调文本选区收缩为缓冲区末尾的空区间。
 * @ja コールバックのテキスト選択をバッファ末尾の空の範囲に縮めます。
 * @ko 콜백 텍스트 선택 영역을 버퍼 끝의 빈 범위로 축소합니다.
 *
 * @param self - ImGuiInputTextCallbackData handle on which this method
 * operates.
 * @zh self - 此方法操作的 ImGuiInputTextCallbackData 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiInputTextCallbackData ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiInputTextCallbackData 핸들입니다.
 */
export function InputTextCallbackData_ClearSelection(
  self: ImGuiInputTextCallbackData,
): void {
  native.InputTextCallbackData_ClearSelection(self);
}

/**
 * Test whether the input callback buffer has a nonempty text selection.
 *
 * @zh 检查输入回调缓冲区是否存在非空文本选区。
 * @ja 入力コールバックのバッファに空でないテキスト選択があるかを調べます。
 * @ko 입력 콜백 버퍼에 비어 있지 않은 텍스트 선택 영역이 있는지 확인합니다.
 *
 * @param self - ImGuiInputTextCallbackData handle on which this method
 * operates.
 * @zh self - 此方法操作的 ImGuiInputTextCallbackData 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiInputTextCallbackData ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiInputTextCallbackData 핸들입니다.
 *
 * @returns True if SelectionStart and SelectionEnd differ, indicating a
 * nonempty text selection.
 * @zh SelectionStart 与 SelectionEnd 不同，即存在非空文本选择时为 true。
 * @ja SelectionStart と SelectionEnd が異なり選択範囲があれば true です。
 * @ko SelectionStart와 SelectionEnd가 달라 비어 있지 않은 선택 영역이 있으면 true입니다.
 */
export function InputTextCallbackData_HasSelection(
  self: ImGuiInputTextCallbackData,
): boolean {
  return native.InputTextCallbackData_HasSelection(self);
}
