import { native } from '../internal/native';
import type { ImFontGlyphRangesBuilder } from '../types';

/**
 * Clear all code-point selections from the glyph-range builder.
 *
 * @zh 清除字形范围构建器中选中的所有码点。
 * @ja グリフ範囲ビルダーで選択されたコードポイントをすべて消去します。
 * @ko 글리프 범위 빌더에서 선택된 모든 코드 포인트를 지웁니다.
 *
 * @param self - ImFontGlyphRangesBuilder handle on which this method operates.
 * @zh self - 此方法操作的 ImFontGlyphRangesBuilder 句柄。
 * @ja self - このメソッドの操作対象となる ImFontGlyphRangesBuilder ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontGlyphRangesBuilder 핸들입니다.
 */
export function ImFontGlyphRangesBuilder_Clear(
  self: ImFontGlyphRangesBuilder,
): void {
  native.ImFontGlyphRangesBuilder_Clear(self);
}

/**
 * Test whether a glyph-range bit is set.
 *
 * @zh 判断字形范围位是否已设置。
 * @ja 字形範囲のビットが設定されているかを調べます。
 * @ko 글리프 범위 비트가 설정되어 있는지 확인합니다.
 *
 * @remarks
 * Get bit n in the array
 * @zh
 * 获取数组中的第 n 位。
 * @ja
 * 配列のビット n を取得します。
 * @ko
 * 배열의 n번 비트를 가져옵니다.
 *
 * @param self - ImFontGlyphRangesBuilder handle on which this method operates.
 * @zh self - 此方法操作的 ImFontGlyphRangesBuilder 句柄。
 * @ja self - このメソッドの操作対象となる ImFontGlyphRangesBuilder ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontGlyphRangesBuilder 핸들입니다.
 *
 * @param n - Unicode code point to query or add, within the range supported by
 * this ImWchar build.
 * @zh n - 要查询或加入的 Unicode 码点，须在此 ImWchar 构建支持的范围内。
 * @ja n - 検索または追加する Unicode コードポイントです。この ImWchar ビルドの対応範囲内で指定します。
 * @ko n - 조회하거나 추가할 유니코드 코드 포인트이며 이 ImWchar 빌드가 지원하는 범위여야 합니다.
 *
 * @returns True if the code point is marked for inclusion in the glyph ranges.
 * @zh 码点已标记为包含在字形范围中时为 true。
 * @ja コードポイントがグリフ範囲に含める対象なら true です。
 * @ko 코드 포인트가 글리프 범위에 포함되도록 표시되어 있으면 true입니다.
 */
export function ImFontGlyphRangesBuilder_GetBit(
  self: ImFontGlyphRangesBuilder,
  n: number,
): boolean {
  return native.ImFontGlyphRangesBuilder_GetBit(self, n);
}

/**
 * Set a glyph-range bit.
 *
 * @zh 设置字形范围位。
 * @ja 字形範囲のビットを設定します。
 * @ko 글리프 범위 비트를 설정합니다.
 *
 * @remarks
 * Set bit n in the array
 * @zh
 * 设置数组中的第 n 位。
 * @ja
 * 配列のビット n を設定します。
 * @ko
 * 배열의 n번 비트를 설정합니다.
 *
 * @param self - ImFontGlyphRangesBuilder handle on which this method operates.
 * @zh self - 此方法操作的 ImFontGlyphRangesBuilder 句柄。
 * @ja self - このメソッドの操作対象となる ImFontGlyphRangesBuilder ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontGlyphRangesBuilder 핸들입니다.
 *
 * @param n - Unicode code point to query or add, within the range supported by
 * this ImWchar build.
 * @zh n - 要查询或加入的 Unicode 码点，须在此 ImWchar 构建支持的范围内。
 * @ja n - 検索または追加する Unicode コードポイントです。この ImWchar ビルドの対応範囲内で指定します。
 * @ko n - 조회하거나 추가할 유니코드 코드 포인트이며 이 ImWchar 빌드가 지원하는 범위여야 합니다.
 */
export function ImFontGlyphRangesBuilder_SetBit(
  self: ImFontGlyphRangesBuilder,
  n: number,
): void {
  native.ImFontGlyphRangesBuilder_SetBit(self, n);
}

/**
 * Add a character to the glyph ranges.
 *
 * @zh 向字形范围添加字符。
 * @ja 字形範囲に文字を追加します。
 * @ko 글리프 범위에 문자를 추가합니다.
 *
 * @remarks
 * Add character
 * @zh
 * 添加字符。
 * @ja
 * 文字を追加します。
 * @ko
 * 문자를 추가합니다.
 *
 * @param self - ImFontGlyphRangesBuilder handle on which this method operates.
 * @zh self - 此方法操作的 ImFontGlyphRangesBuilder 句柄。
 * @ja self - このメソッドの操作対象となる ImFontGlyphRangesBuilder ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontGlyphRangesBuilder 핸들입니다.
 *
 * @param c - Unicode code point to query or add, within the range supported by
 * this ImWchar build.
 * @zh c - 要查询或加入的 Unicode 码点，须在此 ImWchar 构建支持的范围内。
 * @ja c - 検索または追加する Unicode コードポイントです。この ImWchar ビルドの対応範囲内で指定します。
 * @ko c - 조회하거나 추가할 유니코드 코드 포인트이며 이 ImWchar 빌드가 지원하는 범위여야 합니다.
 */
export function ImFontGlyphRangesBuilder_AddChar(
  self: ImFontGlyphRangesBuilder,
  c: number,
): void {
  native.ImFontGlyphRangesBuilder_AddChar(self, c);
}

/**
 * Add every character from a UTF-8 string to the glyph ranges.
 *
 * @zh 将 UTF-8 字符串中的全部字符添加到字形范围。
 * @ja UTF-8 文字列のすべての文字を字形範囲に追加します。
 * @ko UTF-8 문자열의 모든 문자를 글리프 범위에 추가합니다.
 *
 * @remarks
 * Add string (each character of the UTF-8 string are added)
 * @zh
 * 添加字符串（添加 UTF-8 字符串中的每个字符）。
 * @ja
 * 文字列を追加します（UTF-8 文字列の各文字を追加）。
 * @ko
 * 문자열을 추가합니다(UTF-8 문자열의 각 문자 추가).
 *
 * @param self - ImFontGlyphRangesBuilder handle on which this method operates.
 * @zh self - 此方法操作的 ImFontGlyphRangesBuilder 句柄。
 * @ja self - このメソッドの操作対象となる ImFontGlyphRangesBuilder ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontGlyphRangesBuilder 핸들입니다.
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
export function ImFontGlyphRangesBuilder_AddText(
  self: ImFontGlyphRangesBuilder,
  text: string | Uint8Array,
  text_end?: null,
): void;

/**
 * Add every character from a UTF-8 string to the glyph ranges.
 *
 * @zh 将 UTF-8 字符串中的全部字符添加到字形范围。
 * @ja UTF-8 文字列のすべての文字を字形範囲に追加します。
 * @ko UTF-8 문자열의 모든 문자를 글리프 범위에 추가합니다.
 *
 * @remarks
 * Add string (each character of the UTF-8 string are added)
 * @zh
 * 添加字符串（添加 UTF-8 字符串中的每个字符）。
 * @ja
 * 文字列を追加します（UTF-8 文字列の各文字を追加）。
 * @ko
 * 문자열을 추가합니다(UTF-8 문자열의 각 문자 추가).
 *
 * @param self - ImFontGlyphRangesBuilder handle on which this method operates.
 * @zh self - 此方法操作的 ImFontGlyphRangesBuilder 句柄。
 * @ja self - このメソッドの操作対象となる ImFontGlyphRangesBuilder ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontGlyphRangesBuilder 핸들입니다.
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
export function ImFontGlyphRangesBuilder_AddText(
  self: ImFontGlyphRangesBuilder,
  text: Uint8Array,
  text_end: Uint8Array,
): void;
/**
 * Add every character from a UTF-8 string to the glyph ranges.
 *
 * @zh 将 UTF-8 字符串中的全部字符添加到字形范围。
 * @ja UTF-8 文字列のすべての文字を字形範囲に追加します。
 * @ko UTF-8 문자열의 모든 문자를 글리프 범위에 추가합니다.
 *
 * @remarks
 * Add string (each character of the UTF-8 string are added)
 * @zh
 * 添加字符串（添加 UTF-8 字符串中的每个字符）。
 * @ja
 * 文字列を追加します（UTF-8 文字列の各文字を追加）。
 * @ko
 * 문자열을 추가합니다(UTF-8 문자열의 각 문자 추가).
 *
 * @param self - ImFontGlyphRangesBuilder handle on which this method operates.
 * @zh self - 此方法操作的 ImFontGlyphRangesBuilder 句柄。
 * @ja self - このメソッドの操作対象となる ImFontGlyphRangesBuilder ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontGlyphRangesBuilder 핸들입니다.
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
export function ImFontGlyphRangesBuilder_AddText(
  self: ImFontGlyphRangesBuilder,
  text: string | Uint8Array,
  text_end: Uint8Array | null = null,
): void {
  native.ImFontGlyphRangesBuilder_AddText(self, text, text_end);
}

/**
 * Add character ranges to the glyph-range builder.
 *
 * @zh 向字形范围构建器添加字符范围。
 * @ja 字形範囲ビルダーに文字範囲を追加します。
 * @ko 글리프 범위 빌더에 문자 범위를 추가합니다.
 *
 * @remarks
 * Add all ASCII/Latin+Ext code points from the default atlas ranges:
 * ```ts
 * const ranges = new Uint16Array([...getGlyphRangesDefault(atlas), 0]);
 * ImFontGlyphRangesBuilder_AddRanges(builder, ranges);
 * ```
 * @zh
 * 添加默认图集范围中的全部 ASCII/Latin+Ext 码点：
 * ```ts
 * const ranges = new Uint16Array([...getGlyphRangesDefault(atlas), 0]);
 * ImFontGlyphRangesBuilder_AddRanges(builder, ranges);
 * ```
 * @ja
 * 既定のアトラス範囲から ASCII/Latin+Ext 全体を追加します：
 * ```ts
 * const ranges = new Uint16Array([...getGlyphRangesDefault(atlas), 0]);
 * ImFontGlyphRangesBuilder_AddRanges(builder, ranges);
 * ```
 * @ko
 * 기본 아틀라스 범위에서 ASCII/Latin+Ext 코드 포인트 전체를 추가합니다:
 * ```ts
 * const ranges = new Uint16Array([...getGlyphRangesDefault(atlas), 0]);
 * ImFontGlyphRangesBuilder_AddRanges(builder, ranges);
 * ```
 *
 * @param self - ImFontGlyphRangesBuilder handle on which this method operates.
 * @zh self - 此方法操作的 ImFontGlyphRangesBuilder 句柄。
 * @ja self - このメソッドの操作対象となる ImFontGlyphRangesBuilder ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontGlyphRangesBuilder 핸들입니다.
 *
 * @param ranges - Uint16Array of inclusive [first, last] pairs followed by 0.
 * getGlyphRanges* helpers omit that terminator: append it explicitly with
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])`.
 * The builder reads the ranges during this call; null is not accepted.
 * @zh ranges - 包含首尾的 [first, last] 范围对 Uint16Array，末尾须加 0。getGlyphRanges*
 * 不含终止零值，
 * 须用 `new Uint16Array([...getGlyphRangesDefault(atlas), 0])` 显式补上。
 * 构建器在本次调用期间读取；不接受 null。
 * @ja ranges - 両端を含む [first, last] ペアを 0 で終端した Uint16Array です。getGlyphRanges*
 * は終端 0 を含まないため、
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])` で明示的に追加します。
 * この呼び出し中に読み取ります。null は使えません。
 * @ko ranges - 양 끝을 포함하는 [first, last] 쌍과 끝의 0으로 구성된 Uint16Array입니다.
 * getGlyphRanges*는 종료 0을 제외하므로
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])`으로 명시적으로 추가하세요.
 * 이 호출 중에 읽으며 null은 허용하지 않습니다.
 */
export function ImFontGlyphRangesBuilder_AddRanges(
  self: ImFontGlyphRangesBuilder,
  ranges: Uint16Array,
): void {
  native.ImFontGlyphRangesBuilder_AddRanges(self, ranges);
}
