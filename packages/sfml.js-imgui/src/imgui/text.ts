import { native } from '../internal/native';
import type { ImVec2Value, ImVec4Like } from '../types';

/**
 * Display text without format-string processing.
 *
 * @zh 显示文本，不进行格式字符串处理。
 * @ja 書式文字列の処理をせずにテキストを表示します。
 * @ko 서식 문자열 처리 없이 텍스트를 표시합니다.
 *
 * @remarks
 * raw text without formatting.
 *
 * Roughly equivalent to Text("%s", text) but: A) doesn't require null
 * terminated string if 'text_end' is specified, B) it's faster, no memory copy
 * is done, no buffer size limits, recommended for long chunks of text.
 *
 * Implied text_end = null
 * @zh
 * 不带格式化的原始文本。
 *
 * 大致等同于 Text("%s", text)，但：A) 指定 'text_end' 时不要求字符串以空字符结尾；B)
 * 更快，不进行内存复制，没有缓冲区大小限制，推荐用于长段文本。
 *
 * 隐含参数：text_end = null。
 * @ja
 * 書式設定なしの生テキストです。
 *
 * ほぼ Text("%s", text) と同等ですが、A) 'text_end' を指定すれば文字列のヌル終端が不要、B)
 * 高速でメモリコピーを行わずバッファーサイズ制限もないため、長いテキストに推奨します。
 *
 * 暗黙の引数：text_end = null。
 * @ko
 * 서식 없는 원시 텍스트입니다.
 *
 * 대략 Text("%s", text)와 같지만 A) 'text_end'를 지정하면 널 종료 문자열이 필요 없고, B) 더 빠르며 메모리
 * 복사가 없고 버퍼 크기 제한도 없어 긴 텍스트에 권장됩니다.
 *
 * 암묵적 인수: text_end = null.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 */
export function TextUnformatted(text: string | Uint8Array): void {
  native.TextUnformatted(text);
}

/**
 * Display text without format-string processing.
 *
 * @zh 显示文本，不进行格式字符串处理。
 * @ja 書式文字列の処理をせずにテキストを表示します。
 * @ko 서식 문자열 처리 없이 텍스트를 표시합니다.
 *
 * @remarks
 * raw text without formatting.
 *
 * Roughly equivalent to Text("%s", text) but: A) doesn't require null
 * terminated string if 'text_end' is specified, B) it's faster, no memory copy
 * is done, no buffer size limits, recommended for long chunks of text.
 * @zh
 * 不带格式化的原始文本。
 *
 * 大致等同于 Text("%s", text)，但：A) 指定 'text_end' 时不要求字符串以空字符结尾；B)
 * 更快，不进行内存复制，没有缓冲区大小限制，推荐用于长段文本。
 * @ja
 * 書式設定なしの生テキストです。
 *
 * ほぼ Text("%s", text) と同等ですが、A) 'text_end' を指定すれば文字列のヌル終端が不要、B)
 * 高速でメモリコピーを行わずバッファーサイズ制限もないため、長いテキストに推奨します。
 * @ko
 * 서식 없는 원시 텍스트입니다.
 *
 * 대략 Text("%s", text)와 같지만 A) 'text_end'를 지정하면 널 종료 문자열이 필요 없고, B) 더 빠르며 메모리
 * 복사가 없고 버퍼 크기 제한도 없어 긴 텍스트에 권장됩니다.
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
export function TextUnformattedEx(
  text: string | Uint8Array,
  text_end?: null,
): void;

/**
 * Display text without format-string processing.
 *
 * @zh 显示文本，不进行格式字符串处理。
 * @ja 書式文字列の処理をせずにテキストを表示します。
 * @ko 서식 문자열 처리 없이 텍스트를 표시합니다.
 *
 * @remarks
 * raw text without formatting.
 *
 * Roughly equivalent to Text("%s", text) but: A) doesn't require null
 * terminated string if 'text_end' is specified, B) it's faster, no memory copy
 * is done, no buffer size limits, recommended for long chunks of text.
 * @zh
 * 不带格式化的原始文本。
 *
 * 大致等同于 Text("%s", text)，但：A) 指定 'text_end' 时不要求字符串以空字符结尾；B)
 * 更快，不进行内存复制，没有缓冲区大小限制，推荐用于长段文本。
 * @ja
 * 書式設定なしの生テキストです。
 *
 * ほぼ Text("%s", text) と同等ですが、A) 'text_end' を指定すれば文字列のヌル終端が不要、B)
 * 高速でメモリコピーを行わずバッファーサイズ制限もないため、長いテキストに推奨します。
 * @ko
 * 서식 없는 원시 텍스트입니다.
 *
 * 대략 Text("%s", text)와 같지만 A) 'text_end'를 지정하면 널 종료 문자열이 필요 없고, B) 더 빠르며 메모리
 * 복사가 없고 버퍼 크기 제한도 없어 긴 텍스트에 권장됩니다.
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
export function TextUnformattedEx(
  text: Uint8Array,
  text_end: Uint8Array,
): void;
/**
 * Display text without format-string processing.
 *
 * @zh 显示文本，不进行格式字符串处理。
 * @ja 書式文字列の処理をせずにテキストを表示します。
 * @ko 서식 문자열 처리 없이 텍스트를 표시합니다.
 *
 * @remarks
 * raw text without formatting.
 *
 * Roughly equivalent to Text("%s", text) but: A) doesn't require null
 * terminated string if 'text_end' is specified, B) it's faster, no memory copy
 * is done, no buffer size limits, recommended for long chunks of text.
 * @zh
 * 不带格式化的原始文本。
 *
 * 大致等同于 Text("%s", text)，但：A) 指定 'text_end' 时不要求字符串以空字符结尾；B)
 * 更快，不进行内存复制，没有缓冲区大小限制，推荐用于长段文本。
 * @ja
 * 書式設定なしの生テキストです。
 *
 * ほぼ Text("%s", text) と同等ですが、A) 'text_end' を指定すれば文字列のヌル終端が不要、B)
 * 高速でメモリコピーを行わずバッファーサイズ制限もないため、長いテキストに推奨します。
 * @ko
 * 서식 없는 원시 텍스트입니다.
 *
 * 대략 Text("%s", text)와 같지만 A) 'text_end'를 지정하면 널 종료 문자열이 필요 없고, B) 더 빠르며 메모리
 * 복사가 없고 버퍼 크기 제한도 없어 긴 텍스트에 권장됩니다.
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
export function TextUnformattedEx(
  text: string | Uint8Array,
  text_end: Uint8Array | null = null,
): void {
  native.TextUnformattedEx(text, text_end);
}

/**
 * Display text in the specified color.
 *
 * @zh 以指定颜色显示文本。
 * @ja 指定した色でテキストを表示します。
 * @ko 지정한 색상으로 텍스트를 표시합니다.
 *
 * @remarks
 * Equivalent to PushStyleColorImVec4(ImGuiCol.Text, col);
 * TextUnformatted(text); PopStyleColor().
 * @zh
 * 等同于依次调用 PushStyleColorImVec4(ImGuiCol.Text, col)、
 * TextUnformatted(text) 和 PopStyleColor()。
 * @ja
 * PushStyleColorImVec4(ImGuiCol.Text, col)、TextUnformatted(text)、
 * PopStyleColor() を順に呼ぶのと同等です。
 * @ko
 * PushStyleColorImVec4(ImGuiCol.Text, col), TextUnformatted(text),
 * PopStyleColor()를 순서대로 호출하는 것과 같습니다.
 *
 * @param col - Floating-point RGBA color; alpha controls opacity.
 * @zh col - 浮点 RGBA 颜色；alpha 控制不透明度。
 * @ja col - 浮動小数点 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 부동소수점 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 */
export function TextColoredUnformatted(
  col: ImVec4Like,
  text: string | Uint8Array,
): void {
  native.TextColoredUnformatted(col, text);
}

/**
 * Display text using the disabled-text color.
 *
 * @zh 使用禁用文本颜色显示文本。
 * @ja 無効状態の文字色でテキストを表示します。
 * @ko 비활성 텍스트 색상으로 텍스트를 표시합니다.
 *
 * @remarks
 * Equivalent to PushStyleColorImVec4(ImGuiCol.Text,
 * GetStyleColorVec4(ImGuiCol.TextDisabled)); TextUnformatted(text);
 * PopStyleColor().
 * @zh
 * 等同于依次调用 PushStyleColorImVec4(ImGuiCol.Text,
 * GetStyleColorVec4(ImGuiCol.TextDisabled))、TextUnformatted(text) 和
 * PopStyleColor()。
 * @ja
 * PushStyleColorImVec4(ImGuiCol.Text,
 * GetStyleColorVec4(ImGuiCol.TextDisabled))、
 * TextUnformatted(text)、PopStyleColor() を順に呼ぶのと同等です。
 * @ko
 * PushStyleColorImVec4(ImGuiCol.Text,
 * GetStyleColorVec4(ImGuiCol.TextDisabled)),
 * TextUnformatted(text), PopStyleColor()를 순서대로 호출하는 것과 같습니다.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 */
export function TextDisabledUnformatted(text: string | Uint8Array): void {
  native.TextDisabledUnformatted(text);
}

/**
 * Display text with word wrapping.
 *
 * @zh 显示自动换行的文本。
 * @ja 折り返し付きでテキストを表示します。
 * @ko 자동 줄바꿈으로 텍스트를 표시합니다.
 *
 * @remarks
 * Equivalent to PushTextWrapPos(0.0); TextUnformatted(text); PopTextWrapPos().
 *
 * Note that this won't work on an auto-resizing window if there's no other
 * widgets to extend the window width; you may need to set a size using
 * SetNextWindowSize().
 * @zh
 * 等同于依次调用 PushTextWrapPos(0.0)、TextUnformatted(text) 和 PopTextWrapPos()。
 *
 * 注意：在自动调整尺寸的窗口中，如果没有其他控件撑开窗口宽度，此函数无法正常工作，可能需要用 SetNextWindowSize() 设置尺寸。
 * @ja
 * PushTextWrapPos(0.0)、TextUnformatted(text)、PopTextWrapPos() を順に呼ぶのと同等です。
 *
 * 自動サイズ調整のウィンドウで、幅を広げる他のウィジェットがない場合は機能しません。
 *
 * SetNextWindowSize() でサイズを設定する必要があるかもしれません。
 * @ko
 * PushTextWrapPos(0.0), TextUnformatted(text), PopTextWrapPos()를 순서대로 호출하는 것과
 * 같습니다.
 *
 * 자동 크기 조절 창에서 너비를 늘려 주는 다른 위젯이 없다면 작동하지 않습니다.
 *
 * SetNextWindowSize()로 크기를 설정해야 할 수 있습니다.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 */
export function TextWrappedUnformatted(text: string | Uint8Array): void {
  native.TextWrappedUnformatted(text);
}

/**
 * Display text+label aligned the same way as value+label widgets.
 *
 * @zh 显示文本+标签，对齐方式与数值+标签控件相同。
 * @ja テキスト＋ラベルを、値＋ラベルのウィジェットと同じ配置で表示します。
 * @ko 텍스트+레이블을 값+레이블 위젯과 같은 방식으로 정렬하여 표시합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 */
export function LabelTextUnformatted(
  label: string | Uint8Array,
  text: string | Uint8Array,
): void {
  native.LabelTextUnformatted(label, text);
}

/**
 * Display text preceded by a bullet.
 *
 * @zh 显示带项目符号的文本。
 * @ja 行頭に箇条書き記号を付けてテキストを表示します。
 * @ko 글머리 기호가 붙은 텍스트를 표시합니다.
 *
 * @remarks
 * shortcut for Bullet()+Text()
 * @zh
 * Bullet()+Text() 的快捷操作。
 * @ja
 * Bullet()+Text() のショートカットです。
 * @ko
 * Bullet()+Text()의 단축 함수입니다.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 */
export function BulletTextUnformatted(text: string | Uint8Array): void {
  native.BulletTextUnformatted(text);
}

/**
 * Display a text label within a horizontal separator.
 *
 * @zh 在水平分隔线中显示文本标签。
 * @ja 水平の区切り線の中にラベルを表示します。
 * @ko 가로 구분선 안에 텍스트 레이블을 표시합니다.
 *
 * @remarks
 * currently: formatted text with a horizontal line
 * @zh
 * 当前实现：带水平线的格式化文本。
 * @ja
 * 現在の実装：水平線付きの書式設定テキストです。
 * @ko
 * 현재 구현: 수평선이 있는 서식 지정 텍스트입니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 */
export function SeparatorText(label: string | Uint8Array): void {
  native.SeparatorText(label);
}

/**
 * Calculate the size of text.
 *
 * @zh 计算文本尺寸。
 * @ja テキストのサイズを計算します。
 * @ko 텍스트 크기를 계산합니다.
 *
 * @remarks
 * Implied text_end = null, hide_text_after_double_hash = false, wrap_width =
 * -1.0
 * @zh
 * 文本工具。
 *
 * 隐含参数：text_end = null, hide_text_after_double_hash = false, wrap_width =
 * -1.0。
 * @ja
 * テキストユーティリティ。
 *
 * 暗黙の引数：text_end = null, hide_text_after_double_hash = false, wrap_width =
 * -1.0。
 * @ko
 * 텍스트 유틸리티.
 *
 * 암묵적 인수: text_end = null, hide_text_after_double_hash = false, wrap_width =
 * -1.0.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 *
 * @returns Measured text extent: copied pixel dimensions {x: width, y: height}.
 * @zh 测量的文字范围的像素尺寸副本 {x: width, y: height}。
 * @ja 測定した文字領域のピクセル寸法を {x: width, y: height} としてコピーします。
 * @ko 측정한 텍스트 영역의 픽셀 크기 복사본 {x: width, y: height}입니다.
 */
export function CalcTextSize(text: string | Uint8Array): ImVec2Value {
  return native.CalcTextSize(text);
}

/**
 * Measure text with the current font, optional wrapping, and optional hidden ID
 * suffixes.
 *
 * @zh 使用当前字体测量文本，可选择换行及隐藏 ID 后缀。
 * @ja 現在のフォントでテキストを測定し、折り返しと ID 接尾辞の非表示を必要に応じて適用します。
 * @ko 현재 글꼴로 텍스트를 측정하며 선택적으로 줄바꿈과 ID 접미사 숨김을 적용합니다.
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
 *
 * @param hide_text_after_double_hash - Whether text after ## is excluded from
 * size measurement.
 * @zh hide_text_after_double_hash - 测量尺寸时是否排除 ## 之后的文字。
 * @ja hide_text_after_double_hash - ## 以降をサイズ測定から除外するかどうかです。
 * @ko hide_text_after_double_hash - 크기 측정에서 ## 뒤의 텍스트를 제외할지 여부입니다.
 *
 * @param wrap_width - Maximum text width in pixels before wrapping; nonpositive
 * values disable wrapping.
 * @zh wrap_width - 文字换行前的最大像素宽度；非正值禁用换行。
 * @ja wrap_width - 折り返す前の最大ピクセル幅です。0 以下なら折り返しません。
 * @ko wrap_width - 줄바꿈 전 최대 텍스트 픽셀 너비입니다. 0 이하는 줄바꿈을 비활성화합니다.
 *
 * @returns Measured text extent: copied pixel dimensions {x: width, y: height}.
 * @zh 测量的文字范围的像素尺寸副本 {x: width, y: height}。
 * @ja 測定した文字領域のピクセル寸法を {x: width, y: height} としてコピーします。
 * @ko 측정한 텍스트 영역의 픽셀 크기 복사본 {x: width, y: height}입니다.
 */
export function CalcTextSizeEx(
  text: string | Uint8Array,
  text_end?: null,
  hide_text_after_double_hash?: boolean,
  wrap_width?: number,
): ImVec2Value;

/**
 * Measure text with the current font, optional wrapping, and optional hidden ID
 * suffixes.
 *
 * @zh 使用当前字体测量文本，可选择换行及隐藏 ID 后缀。
 * @ja 現在のフォントでテキストを測定し、折り返しと ID 接尾辞の非表示を必要に応じて適用します。
 * @ko 현재 글꼴로 텍스트를 측정하며 선택적으로 줄바꿈과 ID 접미사 숨김을 적용합니다.
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
 *
 * @param hide_text_after_double_hash - Whether text after ## is excluded from
 * size measurement.
 * @zh hide_text_after_double_hash - 测量尺寸时是否排除 ## 之后的文字。
 * @ja hide_text_after_double_hash - ## 以降をサイズ測定から除外するかどうかです。
 * @ko hide_text_after_double_hash - 크기 측정에서 ## 뒤의 텍스트를 제외할지 여부입니다.
 *
 * @param wrap_width - Maximum text width in pixels before wrapping; nonpositive
 * values disable wrapping.
 * @zh wrap_width - 文字换行前的最大像素宽度；非正值禁用换行。
 * @ja wrap_width - 折り返す前の最大ピクセル幅です。0 以下なら折り返しません。
 * @ko wrap_width - 줄바꿈 전 최대 텍스트 픽셀 너비입니다. 0 이하는 줄바꿈을 비활성화합니다.
 *
 * @returns Measured text extent: copied pixel dimensions {x: width, y: height}.
 * @zh 测量的文字范围的像素尺寸副本 {x: width, y: height}。
 * @ja 測定した文字領域のピクセル寸法を {x: width, y: height} としてコピーします。
 * @ko 측정한 텍스트 영역의 픽셀 크기 복사본 {x: width, y: height}입니다.
 */
export function CalcTextSizeEx(
  text: Uint8Array,
  text_end: Uint8Array,
  hide_text_after_double_hash?: boolean,
  wrap_width?: number,
): ImVec2Value;
/**
 * Measure text with the current font, optional wrapping, and optional hidden ID
 * suffixes.
 *
 * @zh 使用当前字体测量文本，可选择换行及隐藏 ID 后缀。
 * @ja 現在のフォントでテキストを測定し、折り返しと ID 接尾辞の非表示を必要に応じて適用します。
 * @ko 현재 글꼴로 텍스트를 측정하며 선택적으로 줄바꿈과 ID 접미사 숨김을 적용합니다.
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
 *
 * @param hide_text_after_double_hash - Whether text after ## is excluded from
 * size measurement.
 * @zh hide_text_after_double_hash - 测量尺寸时是否排除 ## 之后的文字。
 * @ja hide_text_after_double_hash - ## 以降をサイズ測定から除外するかどうかです。
 * @ko hide_text_after_double_hash - 크기 측정에서 ## 뒤의 텍스트를 제외할지 여부입니다.
 *
 * @param wrap_width - Maximum text width in pixels before wrapping; nonpositive
 * values disable wrapping.
 * @zh wrap_width - 文字换行前的最大像素宽度；非正值禁用换行。
 * @ja wrap_width - 折り返す前の最大ピクセル幅です。0 以下なら折り返しません。
 * @ko wrap_width - 줄바꿈 전 최대 텍스트 픽셀 너비입니다. 0 이하는 줄바꿈을 비활성화합니다.
 *
 * @returns Measured text extent: copied pixel dimensions {x: width, y: height}.
 * @zh 测量的文字范围的像素尺寸副本 {x: width, y: height}。
 * @ja 測定した文字領域のピクセル寸法を {x: width, y: height} としてコピーします。
 * @ko 측정한 텍스트 영역의 픽셀 크기 복사본 {x: width, y: height}입니다.
 */
export function CalcTextSizeEx(
  text: string | Uint8Array,
  text_end: Uint8Array | null = null,
  hide_text_after_double_hash: boolean = false,
  wrap_width: number = -1.0,
): ImVec2Value {
  return native.CalcTextSizeEx(
    text,
    text_end,
    hide_text_after_double_hash,
    wrap_width,
  );
}
