import { native } from './internal/native';
import type {
  ImFontAtlas, ImGuiIO, ImGuiStyle,
} from './types';

/**
 * Return the font atlas owned by io.
 *
 * @zh 取出 ImGuiIO 拥有的字体图集。
 * @ja ImGuiIO が所有するフォントアトラスを返す。
 * @ko ImGuiIO가 소유한 글꼴 아틀라스를 반환합니다.
 * @param io - ImGuiIO handle.
 * @zh io - ImGuiIO 句柄。
 * @ja io - ImGuiIO ハンドル。
 * @ko io - ImGuiIO 핸들입니다.
 * @returns Font atlas handle.
 * @zh 字体图集句柄。
 * @ja フォントアトラスのハンドル。
 * @ko 글꼴 아틀라스 핸들입니다.
 */
export function getFontAtlas(io: ImGuiIO): ImFontAtlas | null {
  return native.ioFonts(io);
}

/**
 * Read and write the style's RGBA color array in place.
 *
 * @zh 直接读写样式的 RGBA 颜色数组。
 * @ja スタイルの RGBA カラー配列を直接読み書きします。
 * @ko 스타일의 RGBA 색상 배열을 직접 읽고 씁니다.
 * @param style - ImGuiStyle handle.
 * @zh style - ImGuiStyle 句柄。
 * @ja style - ImGuiStyle ハンドル。
 * @ko style - ImGuiStyle 핸들입니다.
 * @returns RGBA color array view.
 * @zh RGBA 颜色数组视图。
 * @ja RGBA カラー配列のビュー。
 * @ko RGBA 색상 배열 뷰입니다.
 */
export function getStyleColors(style: ImGuiStyle): Float32Array {
  return new Float32Array(native.styleColors(style));
}

/**
 * Return the default glyph ranges.
 *
 * @zh 返回默认字形范围。
 * @ja 既定の字形範囲を返す。
 * @ko 기본 글리프 범위를 반환합니다.
 * @param atlas - Font atlas.
 * @zh atlas - 字体图集。
 * @ja atlas - フォントアトラス。
 * @ko atlas - 글꼴 아틀라스입니다.
 * @returns Copy of inclusive [start, end] pairs, without the native zero
 * terminator.
 * Append 0 in a Uint16Array before passing these ranges to
 * ImGui.ImFontGlyphRangesBuilder_AddRanges or font loading.
 * @zh 包含首尾端点的 [start, end] 范围对副本，不含原生的终止零值。
 * 传给 ImGui.ImFontGlyphRangesBuilder_AddRanges 或字体加载接口前，须在 Uint16Array 中补上末尾 0。
 * @ja 両端を含む [start, end] ペアのコピー。ネイティブの終端 0 は含まない。
 * ImGui.ImFontGlyphRangesBuilder_AddRanges やフォント読み込みに渡す前に、Uint16Array の末尾に 0
 * を追加すること。
 * @ko 양 끝을 포함하는 [start, end] 쌍의 사본이며 네이티브 종료 0은 제외합니다.
 * ImGui.ImFontGlyphRangesBuilder_AddRanges 또는 글꼴 로딩에 전달하기 전에 Uint16Array 끝에 0을
 * 추가하세요.
 */
export function getGlyphRangesDefault(atlas: ImFontAtlas): Uint16Array {
  return native.getGlyphRangesDefault(atlas);
}

/**
 * Return the Greek glyph ranges.
 *
 * @zh 返回希腊语字形范围。
 * @ja ギリシャ語の字形範囲を返す。
 * @ko 그리스어 글리프 범위를 반환합니다.
 * @param atlas - Font atlas.
 * @zh atlas - 字体图集。
 * @ja atlas - フォントアトラス。
 * @ko atlas - 글꼴 아틀라스입니다.
 * @returns Copy of inclusive [start, end] pairs, without the native zero
 * terminator.
 * Append 0 in a Uint16Array before passing these ranges to
 * ImGui.ImFontGlyphRangesBuilder_AddRanges or font loading.
 * @zh 包含首尾端点的 [start, end] 范围对副本，不含原生的终止零值。
 * 传给 ImGui.ImFontGlyphRangesBuilder_AddRanges 或字体加载接口前，须在 Uint16Array 中补上末尾 0。
 * @ja 両端を含む [start, end] ペアのコピー。ネイティブの終端 0 は含まない。
 * ImGui.ImFontGlyphRangesBuilder_AddRanges やフォント読み込みに渡す前に、Uint16Array の末尾に 0
 * を追加すること。
 * @ko 양 끝을 포함하는 [start, end] 쌍의 사본이며 네이티브 종료 0은 제외합니다.
 * ImGui.ImFontGlyphRangesBuilder_AddRanges 또는 글꼴 로딩에 전달하기 전에 Uint16Array 끝에 0을
 * 추가하세요.
 */
export function getGlyphRangesGreek(atlas: ImFontAtlas): Uint16Array {
  return native.getGlyphRangesGreek(atlas);
}

/**
 * Return the Korean glyph ranges.
 *
 * @zh 返回韩语字形范围。
 * @ja 韓国語の字形範囲を返す。
 * @ko 한국어 글리프 범위를 반환합니다.
 * @param atlas - Font atlas.
 * @zh atlas - 字体图集。
 * @ja atlas - フォントアトラス。
 * @ko atlas - 글꼴 아틀라스입니다.
 * @returns Copy of inclusive [start, end] pairs, without the native zero
 * terminator.
 * Append 0 in a Uint16Array before passing these ranges to
 * ImGui.ImFontGlyphRangesBuilder_AddRanges or font loading.
 * @zh 包含首尾端点的 [start, end] 范围对副本，不含原生的终止零值。
 * 传给 ImGui.ImFontGlyphRangesBuilder_AddRanges 或字体加载接口前，须在 Uint16Array 中补上末尾 0。
 * @ja 両端を含む [start, end] ペアのコピー。ネイティブの終端 0 は含まない。
 * ImGui.ImFontGlyphRangesBuilder_AddRanges やフォント読み込みに渡す前に、Uint16Array の末尾に 0
 * を追加すること。
 * @ko 양 끝을 포함하는 [start, end] 쌍의 사본이며 네이티브 종료 0은 제외합니다.
 * ImGui.ImFontGlyphRangesBuilder_AddRanges 또는 글꼴 로딩에 전달하기 전에 Uint16Array 끝에 0을
 * 추가하세요.
 */
export function getGlyphRangesKorean(atlas: ImFontAtlas): Uint16Array {
  return native.getGlyphRangesKorean(atlas);
}

/**
 * Return the Japanese glyph ranges.
 *
 * @zh 返回日语字形范围。
 * @ja 日本語の字形範囲を返す。
 * @ko 일본어 글리프 범위를 반환합니다.
 * @param atlas - Font atlas.
 * @zh atlas - 字体图集。
 * @ja atlas - フォントアトラス。
 * @ko atlas - 글꼴 아틀라스입니다.
 * @returns Copy of inclusive [start, end] pairs, without the native zero
 * terminator.
 * Append 0 in a Uint16Array before passing these ranges to
 * ImGui.ImFontGlyphRangesBuilder_AddRanges or font loading.
 * @zh 包含首尾端点的 [start, end] 范围对副本，不含原生的终止零值。
 * 传给 ImGui.ImFontGlyphRangesBuilder_AddRanges 或字体加载接口前，须在 Uint16Array 中补上末尾 0。
 * @ja 両端を含む [start, end] ペアのコピー。ネイティブの終端 0 は含まない。
 * ImGui.ImFontGlyphRangesBuilder_AddRanges やフォント読み込みに渡す前に、Uint16Array の末尾に 0
 * を追加すること。
 * @ko 양 끝을 포함하는 [start, end] 쌍의 사본이며 네이티브 종료 0은 제외합니다.
 * ImGui.ImFontGlyphRangesBuilder_AddRanges 또는 글꼴 로딩에 전달하기 전에 Uint16Array 끝에 0을
 * 추가하세요.
 */
export function getGlyphRangesJapanese(atlas: ImFontAtlas): Uint16Array {
  return native.getGlyphRangesJapanese(atlas);
}

/**
 * Return the full Chinese glyph ranges.
 *
 * @zh 返回完整中文字形范围。
 * @ja 中国語（繁体・簡体）の全字形範囲を返す。
 * @ko 전체 중국어 글리프 범위를 반환합니다.
 * @param atlas - Font atlas.
 * @zh atlas - 字体图集。
 * @ja atlas - フォントアトラス。
 * @ko atlas - 글꼴 아틀라스입니다.
 * @returns Copy of inclusive [start, end] pairs, without the native zero
 * terminator.
 * Append 0 in a Uint16Array before passing these ranges to
 * ImGui.ImFontGlyphRangesBuilder_AddRanges or font loading.
 * @zh 包含首尾端点的 [start, end] 范围对副本，不含原生的终止零值。
 * 传给 ImGui.ImFontGlyphRangesBuilder_AddRanges 或字体加载接口前，须在 Uint16Array 中补上末尾 0。
 * @ja 両端を含む [start, end] ペアのコピー。ネイティブの終端 0 は含まない。
 * ImGui.ImFontGlyphRangesBuilder_AddRanges やフォント読み込みに渡す前に、Uint16Array の末尾に 0
 * を追加すること。
 * @ko 양 끝을 포함하는 [start, end] 쌍의 사본이며 네이티브 종료 0은 제외합니다.
 * ImGui.ImFontGlyphRangesBuilder_AddRanges 또는 글꼴 로딩에 전달하기 전에 Uint16Array 끝에 0을
 * 추가하세요.
 */
export function getGlyphRangesChineseFull(atlas: ImFontAtlas): Uint16Array {
  return native.getGlyphRangesChineseFull(atlas);
}

/**
 * Return the common simplified Chinese glyph ranges.
 *
 * @zh 返回常用简体中文字形范围。
 * @ja 常用の簡体字中国語の字形範囲を返す。
 * @ko 상용 간체 중국어 글리프 범위를 반환합니다.
 * @param atlas - Font atlas.
 * @zh atlas - 字体图集。
 * @ja atlas - フォントアトラス。
 * @ko atlas - 글꼴 아틀라스입니다.
 * @returns Copy of inclusive [start, end] pairs, without the native zero
 * terminator.
 * Append 0 in a Uint16Array before passing these ranges to
 * ImGui.ImFontGlyphRangesBuilder_AddRanges or font loading.
 * @zh 包含首尾端点的 [start, end] 范围对副本，不含原生的终止零值。
 * 传给 ImGui.ImFontGlyphRangesBuilder_AddRanges 或字体加载接口前，须在 Uint16Array 中补上末尾 0。
 * @ja 両端を含む [start, end] ペアのコピー。ネイティブの終端 0 は含まない。
 * ImGui.ImFontGlyphRangesBuilder_AddRanges やフォント読み込みに渡す前に、Uint16Array の末尾に 0
 * を追加すること。
 * @ko 양 끝을 포함하는 [start, end] 쌍의 사본이며 네이티브 종료 0은 제외합니다.
 * ImGui.ImFontGlyphRangesBuilder_AddRanges 또는 글꼴 로딩에 전달하기 전에 Uint16Array 끝에 0을
 * 추가하세요.
 */
export function getGlyphRangesChineseSimplifiedCommon(
  atlas: ImFontAtlas,
): Uint16Array {
  return native.getGlyphRangesChineseSimplifiedCommon(atlas);
}

/**
 * Return the Cyrillic glyph ranges.
 *
 * @zh 返回西里尔字形范围。
 * @ja キリル文字の字形範囲を返す。
 * @ko 키릴 문자 글리프 범위를 반환합니다.
 * @param atlas - Font atlas.
 * @zh atlas - 字体图集。
 * @ja atlas - フォントアトラス。
 * @ko atlas - 글꼴 아틀라스입니다.
 * @returns Copy of inclusive [start, end] pairs, without the native zero
 * terminator.
 * Append 0 in a Uint16Array before passing these ranges to
 * ImGui.ImFontGlyphRangesBuilder_AddRanges or font loading.
 * @zh 包含首尾端点的 [start, end] 范围对副本，不含原生的终止零值。
 * 传给 ImGui.ImFontGlyphRangesBuilder_AddRanges 或字体加载接口前，须在 Uint16Array 中补上末尾 0。
 * @ja 両端を含む [start, end] ペアのコピー。ネイティブの終端 0 は含まない。
 * ImGui.ImFontGlyphRangesBuilder_AddRanges やフォント読み込みに渡す前に、Uint16Array の末尾に 0
 * を追加すること。
 * @ko 양 끝을 포함하는 [start, end] 쌍의 사본이며 네이티브 종료 0은 제외합니다.
 * ImGui.ImFontGlyphRangesBuilder_AddRanges 또는 글꼴 로딩에 전달하기 전에 Uint16Array 끝에 0을
 * 추가하세요.
 */
export function getGlyphRangesCyrillic(atlas: ImFontAtlas): Uint16Array {
  return native.getGlyphRangesCyrillic(atlas);
}

/**
 * Return the Thai glyph ranges.
 *
 * @zh 返回泰语字形范围。
 * @ja タイ語の字形範囲を返す。
 * @ko 태국어 글리프 범위를 반환합니다.
 * @param atlas - Font atlas.
 * @zh atlas - 字体图集。
 * @ja atlas - フォントアトラス。
 * @ko atlas - 글꼴 아틀라스입니다.
 * @returns Copy of inclusive [start, end] pairs, without the native zero
 * terminator.
 * Append 0 in a Uint16Array before passing these ranges to
 * ImGui.ImFontGlyphRangesBuilder_AddRanges or font loading.
 * @zh 包含首尾端点的 [start, end] 范围对副本，不含原生的终止零值。
 * 传给 ImGui.ImFontGlyphRangesBuilder_AddRanges 或字体加载接口前，须在 Uint16Array 中补上末尾 0。
 * @ja 両端を含む [start, end] ペアのコピー。ネイティブの終端 0 は含まない。
 * ImGui.ImFontGlyphRangesBuilder_AddRanges やフォント読み込みに渡す前に、Uint16Array の末尾に 0
 * を追加すること。
 * @ko 양 끝을 포함하는 [start, end] 쌍의 사본이며 네이티브 종료 0은 제외합니다.
 * ImGui.ImFontGlyphRangesBuilder_AddRanges 또는 글꼴 로딩에 전달하기 전에 Uint16Array 끝에 0을
 * 추가하세요.
 */
export function getGlyphRangesThai(atlas: ImFontAtlas): Uint16Array {
  return native.getGlyphRangesThai(atlas);
}

/**
 * Return the Vietnamese glyph ranges.
 *
 * @zh 返回越南语字形范围。
 * @ja ベトナム語の字形範囲を返す。
 * @ko 베트남어 글리프 범위를 반환합니다.
 * @param atlas - Font atlas.
 * @zh atlas - 字体图集。
 * @ja atlas - フォントアトラス。
 * @ko atlas - 글꼴 아틀라스입니다.
 * @returns Copy of inclusive [start, end] pairs, without the native zero
 * terminator.
 * Append 0 in a Uint16Array before passing these ranges to
 * ImGui.ImFontGlyphRangesBuilder_AddRanges or font loading.
 * @zh 包含首尾端点的 [start, end] 范围对副本，不含原生的终止零值。
 * 传给 ImGui.ImFontGlyphRangesBuilder_AddRanges 或字体加载接口前，须在 Uint16Array 中补上末尾 0。
 * @ja 両端を含む [start, end] ペアのコピー。ネイティブの終端 0 は含まない。
 * ImGui.ImFontGlyphRangesBuilder_AddRanges やフォント読み込みに渡す前に、Uint16Array の末尾に 0
 * を追加すること。
 * @ko 양 끝을 포함하는 [start, end] 쌍의 사본이며 네이티브 종료 0은 제외합니다.
 * ImGui.ImFontGlyphRangesBuilder_AddRanges 또는 글꼴 로딩에 전달하기 전에 Uint16Array 끝에 0을
 * 추가하세요.
 */
export function getGlyphRangesVietnamese(atlas: ImFontAtlas): Uint16Array {
  return native.getGlyphRangesVietnamese(atlas);
}
