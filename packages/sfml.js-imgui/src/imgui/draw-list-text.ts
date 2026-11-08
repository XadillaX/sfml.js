import { native } from '../internal/native';
import type { ImVec2Like, ImDrawList, ImFont } from '../types';

/**
 * Append text to the draw list using the current font and font size.
 *
 * @zh 使用当前字体和字号向绘制列表添加文本。
 * @ja 現在のフォントとサイズで描画リストにテキストを追加します。
 * @ko 현재 글꼴과 글꼴 크기로 그리기 목록에 텍스트를 추가합니다.
 *
 * @remarks
 * Implied text_end = null
 * @zh
 * 隐含参数：text_end = null。
 * @ja
 * 暗黙の引数：text_end = null。
 * @ko
 * 암묵적 인수: text_end = null.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param text_begin - UTF-8 text to read. JS strings are encoded for this call;
 * a nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes
 * are copied and NUL-terminated.
 * @zh text_begin - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array
 * 直接传入，否则复制字节并补上 NUL。
 * @ja text_begin - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text_begin - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는
 * 직접 전달하며 나머지는 복사 후 NUL을 붙입니다.
 */
export function ImDrawList_AddText(
  self: ImDrawList,
  pos: ImVec2Like,
  col: number,
  text_begin: string | Uint8Array,
): void {
  native.ImDrawList_AddText(self, pos, col, text_begin);
}

/**
 * Append text to the draw list using the current font and font size.
 *
 * @zh 使用当前字体和字号向绘制列表添加文本。
 * @ja 現在のフォントとサイズで描画リストにテキストを追加します。
 * @ko 현재 글꼴과 글꼴 크기로 그리기 목록에 텍스트를 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param text_begin - UTF-8 text. With omitted/null text_end, strings are
 * encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh text_begin - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja text_begin - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko text_begin - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는
 * 직접 사용하며,
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
export function ImDrawList_AddTextEx(
  self: ImDrawList,
  pos: ImVec2Like,
  col: number,
  text_begin: string | Uint8Array,
  text_end?: null,
): void;

/**
 * Append text to the draw list using the current font and font size.
 *
 * @zh 使用当前字体和字号向绘制列表添加文本。
 * @ja 現在のフォントとサイズで描画リストにテキストを追加します。
 * @ko 현재 글꼴과 글꼴 크기로 그리기 목록에 텍스트를 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param text_begin - UTF-8 text. With omitted/null text_end, strings are
 * encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh text_begin - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja text_begin - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko text_begin - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는
 * 직접 사용하며,
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
export function ImDrawList_AddTextEx(
  self: ImDrawList,
  pos: ImVec2Like,
  col: number,
  text_begin: Uint8Array,
  text_end: Uint8Array,
): void;
/**
 * Append text to the draw list using the current font and font size.
 *
 * @zh 使用当前字体和字号向绘制列表添加文本。
 * @ja 現在のフォントとサイズで描画リストにテキストを追加します。
 * @ko 현재 글꼴과 글꼴 크기로 그리기 목록에 텍스트를 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param text_begin - UTF-8 text. With omitted/null text_end, strings are
 * encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh text_begin - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja text_begin - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko text_begin - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는
 * 직접 사용하며,
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
export function ImDrawList_AddTextEx(
  self: ImDrawList,
  pos: ImVec2Like,
  col: number,
  text_begin: string | Uint8Array,
  text_end: Uint8Array | null = null,
): void {
  native.ImDrawList_AddTextEx(self, pos, col, text_begin, text_end);
}

/**
 * Append text to the draw list with explicit font and size control.
 *
 * @zh 向绘制列表添加文本，显式控制字体和字号。
 * @ja フォントとサイズを明示的に指定して描画リストにテキストを追加します。
 * @ko 글꼴과 크기를 명시적으로 지정하여 그리기 목록에 텍스트를 추가합니다.
 *
 * @remarks
 * Implied text_end = null, wrap_width = 0.0, cpu_fine_clip_rect = null
 * @zh
 * 隐含参数：text_end = null, wrap_width = 0.0, cpu_fine_clip_rect = null。
 * @ja
 * 暗黙の引数：text_end = null, wrap_width = 0.0, cpu_fine_clip_rect = null。
 * @ko
 * 암묵적 인수: text_end = null, wrap_width = 0.0, cpu_fine_clip_rect = null.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param font - Font used for drawing; null selects the draw list's shared
 * current font, not necessarily the default font.
 * @zh font - 绘制所用的字体；null 选择绘制列表共享的当前字体，不一定是默认字体。
 * @ja font - 描画するフォントです。null は描画リストで共有する現在のフォントで、既定とは限りません。
 * @ko font - 그리기에 쓸 글꼴입니다. null은 그리기 목록의 공유된 현재 글꼴이며 기본 글꼴과 다를 수 있습니다.
 *
 * @param font_size - Text size in pixels; 0 uses the draw list shared current
 * font size, even when an explicit font is supplied.
 * @zh font_size - 文字像素大小；0 使用绘制列表共享的当前字号，即使显式传入了字体也如此。
 * @ja font_size - 文字のピクセルサイズです。0 はフォントを明示した場合も描画リストで共有する現在のサイズを使います。
 * @ko font_size - 텍스트 픽셀 크기입니다. 0은 글꼴을 명시해도 그리기 목록의 공유된 현재 글꼴 크기를 사용합니다.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param text_begin - UTF-8 text to read. JS strings are encoded for this call;
 * a nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes
 * are copied and NUL-terminated.
 * @zh text_begin - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array
 * 直接传入，否则复制字节并补上 NUL。
 * @ja text_begin - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text_begin - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는
 * 직접 전달하며 나머지는 복사 후 NUL을 붙입니다.
 */
export function ImDrawList_AddTextImFontPtr(
  self: ImDrawList,
  font: ImFont | null,
  font_size: number,
  pos: ImVec2Like,
  col: number,
  text_begin: string | Uint8Array,
): void {
  native.ImDrawList_AddTextImFontPtr(
    self,
    font,
    font_size,
    pos,
    col,
    text_begin,
  );
}

/**
 * Append text to the draw list with explicit font and size control.
 *
 * @zh 向绘制列表添加文本，显式控制字体和字号。
 * @ja フォントとサイズを明示的に指定して描画リストにテキストを追加します。
 * @ko 글꼴과 크기를 명시적으로 지정하여 그리기 목록에 텍스트를 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param font - Font used for drawing; null selects the draw list's shared
 * current font, not necessarily the default font.
 * @zh font - 绘制所用的字体；null 选择绘制列表共享的当前字体，不一定是默认字体。
 * @ja font - 描画するフォントです。null は描画リストで共有する現在のフォントで、既定とは限りません。
 * @ko font - 그리기에 쓸 글꼴입니다. null은 그리기 목록의 공유된 현재 글꼴이며 기본 글꼴과 다를 수 있습니다.
 *
 * @param font_size - Text size in pixels; 0 uses the draw list shared current
 * font size, even when an explicit font is supplied.
 * @zh font_size - 文字像素大小；0 使用绘制列表共享的当前字号，即使显式传入了字体也如此。
 * @ja font_size - 文字のピクセルサイズです。0 はフォントを明示した場合も描画リストで共有する現在のサイズを使います。
 * @ko font_size - 텍스트 픽셀 크기입니다. 0은 글꼴을 명시해도 그리기 목록의 공유된 현재 글꼴 크기를 사용합니다.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param text_begin - UTF-8 text. With omitted/null text_end, strings are
 * encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh text_begin - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja text_begin - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko text_begin - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는
 * 직접 사용하며,
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
 * @param wrap_width - Maximum text width in pixels before wrapping; nonpositive
 * values disable wrapping.
 * @zh wrap_width - 文字换行前的最大像素宽度；非正值禁用换行。
 * @ja wrap_width - 折り返す前の最大ピクセル幅です。0 以下なら折り返しません。
 * @ko wrap_width - 줄바꿈 전 최대 텍스트 픽셀 너비입니다. 0 이하는 줄바꿈을 비활성화합니다.
 *
 * @param cpu_fine_clip_rect - Optional Float32Array [minX,minY,maxX,maxY]
 * screen rectangle for per-glyph CPU clipping. Pass Float32Array storage, not a
 * JS scalar; native access uses the supplied backing memory.
 * @zh cpu_fine_clip_rect - 用于逐字形 CPU 裁剪的可选 Float32Array [minX,minY,maxX,maxY]
 * 屏幕矩形。 请传入 Float32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja cpu_fine_clip_rect - グリフ単位の CPU クリップに使う任意の Float32Array
 * [minX,minY,maxX,maxY] スクリーン矩形です。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko cpu_fine_clip_rect - 글리프별 CPU 클리핑용 선택적 Float32Array [minX,minY,maxX,maxY]
 * 화면 사각형입니다. JS 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 */
export function ImDrawList_AddTextImFontPtrEx(
  self: ImDrawList,
  font: ImFont | null,
  font_size: number,
  pos: ImVec2Like,
  col: number,
  text_begin: string | Uint8Array,
  text_end?: null,
  wrap_width?: number,
  cpu_fine_clip_rect?: Float32Array | null,
): void;

/**
 * Append text to the draw list with explicit font and size control.
 *
 * @zh 向绘制列表添加文本，显式控制字体和字号。
 * @ja フォントとサイズを明示的に指定して描画リストにテキストを追加します。
 * @ko 글꼴과 크기를 명시적으로 지정하여 그리기 목록에 텍스트를 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param font - Font used for drawing; null selects the draw list's shared
 * current font, not necessarily the default font.
 * @zh font - 绘制所用的字体；null 选择绘制列表共享的当前字体，不一定是默认字体。
 * @ja font - 描画するフォントです。null は描画リストで共有する現在のフォントで、既定とは限りません。
 * @ko font - 그리기에 쓸 글꼴입니다. null은 그리기 목록의 공유된 현재 글꼴이며 기본 글꼴과 다를 수 있습니다.
 *
 * @param font_size - Text size in pixels; 0 uses the draw list shared current
 * font size, even when an explicit font is supplied.
 * @zh font_size - 文字像素大小；0 使用绘制列表共享的当前字号，即使显式传入了字体也如此。
 * @ja font_size - 文字のピクセルサイズです。0 はフォントを明示した場合も描画リストで共有する現在のサイズを使います。
 * @ko font_size - 텍스트 픽셀 크기입니다. 0은 글꼴을 명시해도 그리기 목록의 공유된 현재 글꼴 크기를 사용합니다.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param text_begin - UTF-8 text. With omitted/null text_end, strings are
 * encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh text_begin - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja text_begin - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko text_begin - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는
 * 직접 사용하며,
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
 * @param wrap_width - Maximum text width in pixels before wrapping; nonpositive
 * values disable wrapping.
 * @zh wrap_width - 文字换行前的最大像素宽度；非正值禁用换行。
 * @ja wrap_width - 折り返す前の最大ピクセル幅です。0 以下なら折り返しません。
 * @ko wrap_width - 줄바꿈 전 최대 텍스트 픽셀 너비입니다. 0 이하는 줄바꿈을 비활성화합니다.
 *
 * @param cpu_fine_clip_rect - Optional Float32Array [minX,minY,maxX,maxY]
 * screen rectangle for per-glyph CPU clipping. Pass Float32Array storage, not a
 * JS scalar; native access uses the supplied backing memory.
 * @zh cpu_fine_clip_rect - 用于逐字形 CPU 裁剪的可选 Float32Array [minX,minY,maxX,maxY]
 * 屏幕矩形。 请传入 Float32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja cpu_fine_clip_rect - グリフ単位の CPU クリップに使う任意の Float32Array
 * [minX,minY,maxX,maxY] スクリーン矩形です。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko cpu_fine_clip_rect - 글리프별 CPU 클리핑용 선택적 Float32Array [minX,minY,maxX,maxY]
 * 화면 사각형입니다. JS 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 */
export function ImDrawList_AddTextImFontPtrEx(
  self: ImDrawList,
  font: ImFont | null,
  font_size: number,
  pos: ImVec2Like,
  col: number,
  text_begin: Uint8Array,
  text_end: Uint8Array,
  wrap_width?: number,
  cpu_fine_clip_rect?: Float32Array | null,
): void;
/**
 * Append text to the draw list with explicit font and size control.
 *
 * @zh 向绘制列表添加文本，显式控制字体和字号。
 * @ja フォントとサイズを明示的に指定して描画リストにテキストを追加します。
 * @ko 글꼴과 크기를 명시적으로 지정하여 그리기 목록에 텍스트를 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param font - Font used for drawing; null selects the draw list's shared
 * current font, not necessarily the default font.
 * @zh font - 绘制所用的字体；null 选择绘制列表共享的当前字体，不一定是默认字体。
 * @ja font - 描画するフォントです。null は描画リストで共有する現在のフォントで、既定とは限りません。
 * @ko font - 그리기에 쓸 글꼴입니다. null은 그리기 목록의 공유된 현재 글꼴이며 기본 글꼴과 다를 수 있습니다.
 *
 * @param font_size - Text size in pixels; 0 uses the draw list shared current
 * font size, even when an explicit font is supplied.
 * @zh font_size - 文字像素大小；0 使用绘制列表共享的当前字号，即使显式传入了字体也如此。
 * @ja font_size - 文字のピクセルサイズです。0 はフォントを明示した場合も描画リストで共有する現在のサイズを使います。
 * @ko font_size - 텍스트 픽셀 크기입니다. 0은 글꼴을 명시해도 그리기 목록의 공유된 현재 글꼴 크기를 사용합니다.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param text_begin - UTF-8 text. With omitted/null text_end, strings are
 * encoded;
 * NUL-terminated nonempty byte views are used directly, other views are
 * copied and NUL-terminated. With an explicit end, pass a Uint8Array:
 * its bytes are read directly and need no NUL terminator.
 * @zh text_begin - UTF-8 文本。末端省略或为 null 时，字符串会编码，非空 NUL 结尾的字节视图直接使用，
 * 其他视图复制并补 NUL。显式指定末端时须传 Uint8Array，直接读取，无须 NUL 终止符。
 * @ja text_begin - UTF-8 テキストです。終端を省略または null にすると、文字列は変換し、空でない NUL 終端ビューは直接使い、
 * それ以外のビューはコピーして NUL を付けます。終端を指定する場合は Uint8Array を直接読み、NUL は不要です。
 * @ko text_begin - UTF-8 텍스트입니다. 끝을 생략하거나 null이면 문자열은 인코딩하고 비어 있지 않은 NUL 종료 뷰는
 * 직접 사용하며,
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
 * @param wrap_width - Maximum text width in pixels before wrapping; nonpositive
 * values disable wrapping.
 * @zh wrap_width - 文字换行前的最大像素宽度；非正值禁用换行。
 * @ja wrap_width - 折り返す前の最大ピクセル幅です。0 以下なら折り返しません。
 * @ko wrap_width - 줄바꿈 전 최대 텍스트 픽셀 너비입니다. 0 이하는 줄바꿈을 비활성화합니다.
 *
 * @param cpu_fine_clip_rect - Optional Float32Array [minX,minY,maxX,maxY]
 * screen rectangle for per-glyph CPU clipping. Pass Float32Array storage, not a
 * JS scalar; native access uses the supplied backing memory.
 * @zh cpu_fine_clip_rect - 用于逐字形 CPU 裁剪的可选 Float32Array [minX,minY,maxX,maxY]
 * 屏幕矩形。 请传入 Float32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja cpu_fine_clip_rect - グリフ単位の CPU クリップに使う任意の Float32Array
 * [minX,minY,maxX,maxY] スクリーン矩形です。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko cpu_fine_clip_rect - 글리프별 CPU 클리핑용 선택적 Float32Array [minX,minY,maxX,maxY]
 * 화면 사각형입니다. JS 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 */
export function ImDrawList_AddTextImFontPtrEx(
  self: ImDrawList,
  font: ImFont | null,
  font_size: number,
  pos: ImVec2Like,
  col: number,
  text_begin: string | Uint8Array,
  text_end: Uint8Array | null = null,
  wrap_width: number = 0.0,
  cpu_fine_clip_rect: Float32Array | null = null,
): void {
  native.ImDrawList_AddTextImFontPtrEx(
    self,
    font,
    font_size,
    pos,
    col,
    text_begin,
    text_end,
    wrap_width,
    cpu_fine_clip_rect,
  );
}
