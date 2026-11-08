import { native } from '../internal/native';
import type { ImFont, ImFontGlyph } from '../types';

/**
 * Find a character glyph, substituting the fallback glyph when it is missing.
 *
 * @zh 查找字符字形，缺失时使用回退字形。
 * @ja 文字のグリフを検索し、見つからない場合は代替グリフを使用します。
 * @ko 문자 글리프를 찾고 없으면 대체 글리프를 사용합니다.
 *
 * @param self - ImFont handle on which this method operates.
 * @zh self - 此方法操作的 ImFont 句柄。
 * @ja self - このメソッドの操作対象となる ImFont ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFont 핸들입니다.
 *
 * @param c - Unicode code point to query or add, within the range supported by
 * this ImWchar build.
 * @zh c - 要查询或加入的 Unicode 码点，须在此 ImWchar 构建支持的范围内。
 * @ja c - 検索または追加する Unicode コードポイントです。この ImWchar ビルドの対応範囲内で指定します。
 * @ko c - 조회하거나 추가할 유니코드 코드 포인트이며 이 ImWchar 빌드가 지원하는 범위여야 합니다.
 *
 * @returns Borrowed matching glyph, or the font fallback glyph when not found;
 * null is possible if no fallback glyph is available.
 * @zh 匹配字形的借用句柄，未找到时返回字体后备字形；后备字形也不可用时可能为 null。
 * @ja 一致する借用グリフです。なければ代替グリフを返し、代替もなければ null の場合があります。
 * @ko 일치하는 글리프의 빌린 핸들입니다. 없으면 대체 글리프를 사용하며 대체 글리프도 없으면 null일 수 있습니다.
 */
export function ImFont_FindGlyph(self: ImFont, c: number): ImFontGlyph | null {
  return native.ImFont_FindGlyph(self, c);
}

/**
 * Find a character glyph without substituting the fallback glyph.
 *
 * @zh 查找字符字形，不使用回退字形替代。
 * @ja 代替グリフに置き換えずに文字のグリフを検索します。
 * @ko 대체 글리프로 바꾸지 않고 문자 글리프를 찾습니다.
 *
 * @param self - ImFont handle on which this method operates.
 * @zh self - 此方法操作的 ImFont 句柄。
 * @ja self - このメソッドの操作対象となる ImFont ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFont 핸들입니다.
 *
 * @param c - Unicode code point to query or add, within the range supported by
 * this ImWchar build.
 * @zh c - 要查询或加入的 Unicode 码点，须在此 ImWchar 构建支持的范围内。
 * @ja c - 検索または追加する Unicode コードポイントです。この ImWchar ビルドの対応範囲内で指定します。
 * @ko c - 조회하거나 추가할 유니코드 코드 포인트이며 이 ImWchar 빌드가 지원하는 범위여야 합니다.
 *
 * @returns Borrowed glyph handle, or null when the code point is not found; no
 * fallback substitution is performed.
 * @zh 字形借用句柄；未找到码点时为 null，不进行后备替换。
 * @ja 借用グリフハンドルです。コードポイントがなければ null で、代替グリフに置き換えません。
 * @ko 빌린 글리프 핸들입니다. 코드 포인트를 찾지 못하면 null이며 대체 글리프를 사용하지 않습니다.
 */
export function ImFont_FindGlyphNoFallback(
  self: ImFont,
  c: number,
): ImFontGlyph | null {
  return native.ImFont_FindGlyphNoFallback(self, c);
}

/**
 * Read a character's unscaled horizontal advance, using the fallback advance
 * when missing.
 *
 * @zh 读取字符未经缩放的水平推进量，缺失时使用回退推进量。
 * @ja 文字の未拡縮の横方向送り幅を取得し、未登録なら代替の送り幅を使用します。
 * @ko 배율을 적용하지 않은 문자의 수평 이동 폭을 읽고 없으면 대체 이동 폭을 사용합니다.
 *
 * @param self - ImFont handle on which this method operates.
 * @zh self - 此方法操作的 ImFont 句柄。
 * @ja self - このメソッドの操作対象となる ImFont ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFont 핸들입니다.
 *
 * @param c - Unicode code point to query or add, within the range supported by
 * this ImWchar build.
 * @zh c - 要查询或加入的 Unicode 码点，须在此 ImWchar 构建支持的范围内。
 * @ja c - 検索または追加する Unicode コードポイントです。この ImWchar ビルドの対応範囲内で指定します。
 * @ko c - 조회하거나 추가할 유니코드 코드 포인트이며 이 ImWchar 빌드가 지원하는 범위여야 합니다.
 *
 * @returns Horizontal glyph advance in unscaled font pixels, or
 * FallbackAdvanceX for an unavailable code point.
 * @zh 未缩放字体像素单位的水平字形前进量；码点不可用时为 FallbackAdvanceX。
 * @ja スケール前のフォントピクセル単位の送り幅です。未登録なら FallbackAdvanceX を返します。
 * @ko 배율 적용 전 글꼴 픽셀 단위의 가로 진행 폭입니다. 코드 포인트가 없으면 FallbackAdvanceX입니다.
 */
export function ImFont_GetCharAdvance(self: ImFont, c: number): number {
  return native.ImFont_GetCharAdvance(self, c);
}

/**
 * Test whether the font has been loaded into an atlas.
 *
 * @zh 检查字体是否已加载到图集中。
 * @ja フォントがアトラスに読み込まれているかを調べます。
 * @ko 글꼴이 아틀라스에 로드되었는지 확인합니다.
 *
 * @param self - ImFont handle on which this method operates.
 * @zh self - 此方法操作的 ImFont 句柄。
 * @ja self - このメソッドの操作対象となる ImFont ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFont 핸들입니다.
 *
 * @returns True if the font is associated with a containing atlas.
 * @zh 字体已关联所属图集时为 true。
 * @ja フォントが所属アトラスに関連付けられていれば true です。
 * @ko 글꼴이 포함 아틀라스와 연결되어 있으면 true입니다.
 */
export function ImFont_IsLoaded(self: ImFont): boolean {
  return native.ImFont_IsLoaded(self);
}

/**
 * Read the font source name used for debugging.
 *
 * @zh 读取用于调试的字体源名称。
 * @ja デバッグ用のフォントソース名を取得します。
 * @ko 디버깅에 사용하는 글꼴 소스 이름을 읽습니다.
 *
 * @param self - ImFont handle on which this method operates.
 * @zh self - 此方法操作的 ImFont 句柄。
 * @ja self - このメソッドの操作対象となる ImFont ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFont 핸들입니다.
 *
 * @returns Font configuration debug name, or the native unnamed placeholder if
 * no configuration is available.
 * @zh 字体配置中的调试名称；没有配置时为原生未命名占位名称。
 * @ja フォント設定のデバッグ名です。設定がなければネイティブの無名表示を返します。
 * @ko 글꼴 설정의 디버그 이름입니다. 설정이 없으면 네이티브 미명명 표시를 반환합니다.
 */
export function ImFont_GetDebugName(self: ImFont): string | null {
  return native.ImFont_GetDebugName(self);
}
