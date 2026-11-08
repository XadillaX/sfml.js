import { native } from '../internal/native';
import type { ImGuiTextBuffer } from '../types';

/**
 * Copy the text buffer to a JS string, excluding the native terminating NUL.
 *
 * @zh 将文本缓冲区复制为 JS 字符串，不含原生末尾的 NUL。
 * @ja テキストバッファを JS 文字列にコピーします。ネイティブの終端 NUL は含みません。
 * @ko 텍스트 버퍼를 JS 문자열로 복사하며 네이티브 끝 NUL은 포함하지 않습니다.
 *
 * @param self - ImGuiTextBuffer handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextBuffer 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextBuffer ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextBuffer 핸들입니다.
 *
 * @returns Buffer contents copied to a JS string, not a pointer or a writable
 * view.
 * @zh 缓冲区内容的 JS 字符串副本，不是指针或可写视图。
 * @ja バッファー内容をコピーした JS 文字列です。ポインターや書き込みビューではありません。
 * @ko 버퍼 내용을 복사한 JS 문자열이며 포인터 또는 쓰기 가능한 뷰가 아닙니다.
 */
export function TextBuffer_begin(self: ImGuiTextBuffer): string | null {
  return native.TextBuffer_begin(self);
}

/**
 * Get the end position of the text buffer.
 *
 * @zh 获取文本缓冲区的结束位置。
 * @ja テキストバッファの終端位置を取得します。
 * @ko 텍스트 버퍼의 끝 위치를 가져옵니다.
 *
 * @remarks
 * The native end pointer addresses the terminating NUL. TextBuffer_end(self)
 * returns a copied empty JS string, not that pointer.
 * @zh
 * 原生结束指针指向末尾的 NUL。TextBuffer_end(self) 返回复制得到的空 JS 字符串，而非该指针。
 * @ja
 * ネイティブの終端ポインターは末尾の NUL を指します。TextBuffer_end(self) はそのポインターではなく空の JS 文字列を返します。
 * @ko
 * 네이티브 끝 포인터는 마지막 NUL을 가리킵니다. TextBuffer_end(self)는 해당 포인터가 아닌 빈 JS 문자열을 복사해
 * 반환합니다.
 *
 * @param self - ImGuiTextBuffer handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextBuffer 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextBuffer ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextBuffer 핸들입니다.
 *
 * @returns An empty JS string copied from the NUL terminator; the C end pointer
 * is not exposed by this binding.
 * @zh 从 NUL 终止符复制得到的空 JS 字符串；此绑定不暴露 C 尾后指针。
 * @ja NUL 終端からコピーする空の JS 文字列です。このバインディングは C の終端ポインターを返しません。
 * @ko NUL 종료에서 복사한 빈 JS 문자열입니다. 이 바인딩은 C 끝 포인터를 노출하지 않습니다.
 */
export function TextBuffer_end(self: ImGuiTextBuffer): string | null {
  return native.TextBuffer_end(self);
}

/**
 * Measure the text buffer length in bytes, excluding the zero terminator.
 *
 * @zh 计算文本缓冲区的字节长度，不含结尾零字符。
 * @ja ヌル終端を除くテキストバッファのバイト長を取得します。
 * @ko 널 종료 문자를 제외한 텍스트 버퍼의 바이트 길이를 구합니다.
 *
 * @param self - ImGuiTextBuffer handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextBuffer 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextBuffer ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextBuffer 핸들입니다.
 *
 * @returns Text length in bytes, excluding the trailing NUL.
 * @zh 不含结尾 NUL 的文本字节长度。
 * @ja 末尾 NUL を除くテキストのバイト長です。
 * @ko 끝 NUL을 제외한 텍스트 바이트 길이입니다.
 */
export function TextBuffer_size(self: ImGuiTextBuffer): number {
  return native.TextBuffer_size(self);
}

/**
 * Test whether the text buffer contains no text.
 *
 * @zh 检查文本缓冲区是否不含文本。
 * @ja テキストバッファにテキストがないかを調べます。
 * @ko 텍스트 버퍼에 텍스트가 없는지 확인합니다.
 *
 * @param self - ImGuiTextBuffer handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextBuffer 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextBuffer ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextBuffer 핸들입니다.
 *
 * @returns True if the buffer or text range contains no text bytes.
 * @zh 缓冲区或文本范围不包含文本字节时为 true。
 * @ja バッファーまたは範囲にテキストのバイトがなければ true です。
 * @ko 버퍼 또는 텍스트 범위에 텍스트 바이트가 없으면 true입니다.
 */
export function TextBuffer_empty(self: ImGuiTextBuffer): boolean {
  return native.TextBuffer_empty(self);
}

/**
 * Erase the text buffer contents and release its allocation.
 *
 * @zh 清空文本缓冲区内容并释放其分配的内存。
 * @ja テキストバッファの内容を消去し、確保したメモリを解放します。
 * @ko 텍스트 버퍼 내용을 지우고 할당된 메모리를 해제합니다.
 *
 * @param self - ImGuiTextBuffer handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextBuffer 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextBuffer ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextBuffer 핸들입니다.
 */
export function TextBuffer_clear(self: ImGuiTextBuffer): void {
  native.TextBuffer_clear(self);
}

/**
 * Resize the text buffer.
 *
 * @zh 调整文本缓冲区的大小。
 * @ja テキストバッファのサイズを変更します。
 * @ko 텍스트 버퍼 크기를 변경합니다.
 *
 * @remarks
 * Calling `resize(0)` empties the string without freeing the buffer, like
 * `ImVector.resize(0)`. A nonzero size changes the text length and preserves
 * its null terminator.
 * @zh
 * 调用 `resize(0)` 会清空字符串但不释放缓冲区，与 `ImVector.resize(0)` 类似。非零尺寸会调整文本长度并保留空字符终止符。
 * @ja
 * `resize(0)` は `ImVector.resize(0)`
 * と同様に、バッファを解放せず文字列を空にします。ゼロ以外のサイズはテキストの長さを変更し、ヌル終端を保持します。
 * @ko
 * `resize(0)`은 `ImVector.resize(0)`처럼 버퍼를 해제하지 않고 문자열을 비웁니다. 0이 아닌 크기는 텍스트 길이를
 * 변경하고 널 종료 문자를 유지합니다.
 *
 * @param self - ImGuiTextBuffer handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextBuffer 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextBuffer ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextBuffer 핸들입니다.
 *
 * @param size - New text length in bytes, excluding the NUL terminator.
 * @zh size - 新的文本字节长度，不含 NUL 终止符。
 * @ja size - NUL 終端を除く新しいテキストのバイト長です。
 * @ko size - NUL 종료를 제외한 새 텍스트 바이트 길이입니다.
 */
export function TextBuffer_resize(self: ImGuiTextBuffer, size: number): void {
  native.TextBuffer_resize(self, size);
}

/**
 * Ensure text buffer capacity without changing its text length.
 *
 * @zh 确保文本缓冲区容量，不改变文本长度。
 * @ja テキスト長を変えずにテキストバッファの容量を確保します。
 * @ko 텍스트 길이를 바꾸지 않고 텍스트 버퍼 용량을 확보합니다.
 *
 * @param self - ImGuiTextBuffer handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextBuffer 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextBuffer ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextBuffer 핸들입니다.
 *
 * @param capacity - Minimum buffer capacity to reserve in bytes.
 * @zh capacity - 要预留的最小缓冲区字节容量。
 * @ja capacity - 確保するバッファーの最小バイト容量です。
 * @ko capacity - 예약할 최소 버퍼 용량(바이트)입니다.
 */
export function TextBuffer_reserve(
  self: ImGuiTextBuffer,
  capacity: number,
): void {
  native.TextBuffer_reserve(self, capacity);
}

/**
 * Copy the text buffer to a JS string, excluding the native terminating NUL.
 *
 * @zh 将文本缓冲区复制为 JS 字符串，不含原生末尾的 NUL。
 * @ja テキストバッファを JS 文字列にコピーします。ネイティブの終端 NUL は含みません。
 * @ko 텍스트 버퍼를 JS 문자열로 복사하며 네이티브 끝 NUL은 포함하지 않습니다.
 *
 * @param self - ImGuiTextBuffer handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextBuffer 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextBuffer ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextBuffer 핸들입니다.
 *
 * @returns Buffer contents copied to a JS string, not a pointer or a writable
 * view.
 * @zh 缓冲区内容的 JS 字符串副本，不是指针或可写视图。
 * @ja バッファー内容をコピーした JS 文字列です。ポインターや書き込みビューではありません。
 * @ko 버퍼 내용을 복사한 JS 문자열이며 포인터 또는 쓰기 가능한 뷰가 아닙니다.
 */
export function TextBuffer_c_str(self: ImGuiTextBuffer): string | null {
  return native.TextBuffer_c_str(self);
}

/**
 * Append unformatted text to the growable text buffer.
 *
 * @zh 向可增长的文本缓冲区追加未经格式化的文本。
 * @ja 拡張可能なテキストバッファに書式処理しないテキストを追加します。
 * @ko 확장 가능한 텍스트 버퍼에 서식 처리하지 않은 텍스트를 덧붙입니다.
 *
 * @param self - ImGuiTextBuffer handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextBuffer 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextBuffer ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextBuffer 핸들입니다.
 *
 * @param str - UTF-8 text. With omitted/null str_end, strings are encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh str - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja str - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko str - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는 직접
 * 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array를 직접 읽으며 NUL 종료는 필요 없습니다.
 *
 * @param str_end - Exclusive endpoint view, not a length or another string.
 * Explicit begin/end must share one backing buffer and satisfy
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength.
 * An empty end view is valid; neither view needs NUL termination.
 * Omitted/null end uses ordinary NUL-terminated UTF-8 conversion.
 * @zh str_end - 尾后位置视图，不是长度或另一字符串。显式起止视图须共享同一底层缓冲区，且满足
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength。
 * 末端可为空视图，两端无须 NUL 终止符。省略或 null 使用普通 NUL 终止 UTF-8 转换。
 * @ja str_end - 終端直後を示すビューです。長さや別の文字列ではありません。両端は同じバッファーを共有し、
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength
 * を満たす必要があります。
 * 空の終端ビューも有効で、NUL は不要です。省略または null では通常の NUL 終端 UTF-8 変換を使います。
 * @ko str_end - 끝 다음 위치의 뷰이며 길이나 다른 문자열이 아닙니다. 양쪽은 같은 버퍼를 공유하며
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength를
 * 만족해야 합니다.
 * 빈 끝 뷰도 허용하며 NUL 종료는 필요 없습니다. 생략하거나 null이면 일반 NUL 종료 UTF-8 변환을 사용합니다.
 */
export function TextBuffer_append(
  self: ImGuiTextBuffer,
  str: string | Uint8Array,
  str_end?: null,
): void;

/**
 * Append unformatted text to the growable text buffer.
 *
 * @zh 向可增长的文本缓冲区追加未经格式化的文本。
 * @ja 拡張可能なテキストバッファに書式処理しないテキストを追加します。
 * @ko 확장 가능한 텍스트 버퍼에 서식 처리하지 않은 텍스트를 덧붙입니다.
 *
 * @param self - ImGuiTextBuffer handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextBuffer 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextBuffer ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextBuffer 핸들입니다.
 *
 * @param str - UTF-8 text. With omitted/null str_end, strings are encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh str - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja str - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko str - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는 직접
 * 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array를 직접 읽으며 NUL 종료는 필요 없습니다.
 *
 * @param str_end - Exclusive endpoint view, not a length or another string.
 * Explicit begin/end must share one backing buffer and satisfy
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength.
 * An empty end view is valid; neither view needs NUL termination.
 * Omitted/null end uses ordinary NUL-terminated UTF-8 conversion.
 * @zh str_end - 尾后位置视图，不是长度或另一字符串。显式起止视图须共享同一底层缓冲区，且满足
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength。
 * 末端可为空视图，两端无须 NUL 终止符。省略或 null 使用普通 NUL 终止 UTF-8 转换。
 * @ja str_end - 終端直後を示すビューです。長さや別の文字列ではありません。両端は同じバッファーを共有し、
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength
 * を満たす必要があります。
 * 空の終端ビューも有効で、NUL は不要です。省略または null では通常の NUL 終端 UTF-8 変換を使います。
 * @ko str_end - 끝 다음 위치의 뷰이며 길이나 다른 문자열이 아닙니다. 양쪽은 같은 버퍼를 공유하며
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength를
 * 만족해야 합니다.
 * 빈 끝 뷰도 허용하며 NUL 종료는 필요 없습니다. 생략하거나 null이면 일반 NUL 종료 UTF-8 변환을 사용합니다.
 */
export function TextBuffer_append(
  self: ImGuiTextBuffer,
  str: Uint8Array,
  str_end: Uint8Array,
): void;
/**
 * Append unformatted text to the growable text buffer.
 *
 * @zh 向可增长的文本缓冲区追加未经格式化的文本。
 * @ja 拡張可能なテキストバッファに書式処理しないテキストを追加します。
 * @ko 확장 가능한 텍스트 버퍼에 서식 처리하지 않은 텍스트를 덧붙입니다.
 *
 * @param self - ImGuiTextBuffer handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiTextBuffer 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiTextBuffer ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiTextBuffer 핸들입니다.
 *
 * @param str - UTF-8 text. With omitted/null str_end, strings are encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh str - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja str - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko str - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는 직접
 * 사용하며,
 * 나머지 뷰는 복사 후 NUL을 붙입니다. 끝을 명시하면 Uint8Array를 직접 읽으며 NUL 종료는 필요 없습니다.
 *
 * @param str_end - Exclusive endpoint view, not a length or another string.
 * Explicit begin/end must share one backing buffer and satisfy
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength.
 * An empty end view is valid; neither view needs NUL termination.
 * Omitted/null end uses ordinary NUL-terminated UTF-8 conversion.
 * @zh str_end - 尾后位置视图，不是长度或另一字符串。显式起止视图须共享同一底层缓冲区，且满足
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength。
 * 末端可为空视图，两端无须 NUL 终止符。省略或 null 使用普通 NUL 终止 UTF-8 转换。
 * @ja str_end - 終端直後を示すビューです。長さや別の文字列ではありません。両端は同じバッファーを共有し、
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength
 * を満たす必要があります。
 * 空の終端ビューも有効で、NUL は不要です。省略または null では通常の NUL 終端 UTF-8 変換を使います。
 * @ko str_end - 끝 다음 위치의 뷰이며 길이나 다른 문자열이 아닙니다. 양쪽은 같은 버퍼를 공유하며
 * begin.byteOffset <= end.byteOffset <= begin.byteOffset + begin.byteLength를
 * 만족해야 합니다.
 * 빈 끝 뷰도 허용하며 NUL 종료는 필요 없습니다. 생략하거나 null이면 일반 NUL 종료 UTF-8 변환을 사용합니다.
 */
export function TextBuffer_append(
  self: ImGuiTextBuffer,
  str: string | Uint8Array,
  str_end: Uint8Array | null = null,
): void {
  native.TextBuffer_append(self, str, str_end);
}
