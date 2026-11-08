import { native } from '../internal/native';
import type {
  ImVec2Like,
  ImFont,
  ImFontAtlas,
  ImFontAtlasCustomRect,
  ImFontConfig,
} from '../types';

/**
 * Register a configured font source for the next atlas build.
 *
 * @zh 注册配置好的字体源，供下一次图集构建使用。
 * @ja 次のアトラス構築に向けて、設定済みのフォントソースを登録します。
 * @ko 다음 아틀라스 빌드를 위해 설정된 글꼴 소스를 등록합니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 *
 * @param font_cfg - Font-loading configuration; optional variants accept null
 * for defaults. Ownership and merge settings affect how font data is retained.
 * @zh font_cfg - 字体加载配置；可选版本接受 null 使用默认值，所有权和合并设置会影响字体数据的保留方式。
 * @ja font_cfg - フォント読み込み設定です。任意指定の版では null で既定値を使い、所有権やマージ設定がデータ保持に影響します。
 * @ko font_cfg - 글꼴 로딩 설정입니다. 선택적인 경우 null은 기본값이며 소유권과 병합 설정이 데이터 유지 방식에 영향을
 * 줍니다.
 *
 * @returns Atlas-owned font handle (the destination font in merge mode). Glyphs
 * become available after atlas building; invalid input may trigger native
 * assertions.
 * @zh 图集拥有的字体句柄，合并模式下为目标字体。图集构建后字形才可用；无效输入可能触发原生断言。
 * @ja アトラス所有のフォント（マージ時は対象フォント）です。グリフは構築後に利用でき、不正入力はアサートを起こし得ます。
 * @ko 아틀라스 소유 글꼴 핸들입니다. 병합 모드에서는 대상 글꼴입니다. 글리프는 빌드 후 사용할 수 있으며 잘못된 입력은 어설션을 유발할
 * 수 있습니다.
 */
export function ImFontAtlas_AddFont(
  self: ImFontAtlas,
  font_cfg: ImFontConfig,
): ImFont | null {
  return native.ImFontAtlas_AddFont(self, font_cfg);
}

/**
 * Add the embedded default font to the atlas.
 *
 * @zh 向图集添加内嵌的默认字体。
 * @ja 内蔵の既定フォントをアトラスに追加します。
 * @ko 아틀라스에 내장 기본 글꼴을 추가합니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 *
 * @param font_cfg - Font-loading configuration; optional variants accept null
 * for defaults. Ownership and merge settings affect how font data is retained.
 * @zh font_cfg - 字体加载配置；可选版本接受 null 使用默认值，所有权和合并设置会影响字体数据的保留方式。
 * @ja font_cfg - フォント読み込み設定です。任意指定の版では null で既定値を使い、所有権やマージ設定がデータ保持に影響します。
 * @ko font_cfg - 글꼴 로딩 설정입니다. 선택적인 경우 null은 기본값이며 소유권과 병합 설정이 데이터 유지 방식에 영향을
 * 줍니다.
 *
 * @returns Atlas-owned font handle (the destination font in merge mode). Glyphs
 * become available after atlas building; invalid input may trigger native
 * assertions.
 * @zh 图集拥有的字体句柄，合并模式下为目标字体。图集构建后字形才可用；无效输入可能触发原生断言。
 * @ja アトラス所有のフォント（マージ時は対象フォント）です。グリフは構築後に利用でき、不正入力はアサートを起こし得ます。
 * @ko 아틀라스 소유 글꼴 핸들입니다. 병합 모드에서는 대상 글꼴입니다. 글리프는 빌드 후 사용할 수 있으며 잘못된 입력은 어설션을 유발할
 * 수 있습니다.
 */
export function ImFontAtlas_AddFontDefault(
  self: ImFontAtlas,
  font_cfg: ImFontConfig | null = null,
): ImFont | null {
  return native.ImFontAtlas_AddFontDefault(self, font_cfg);
}

/**
 * Load a TTF or OTF font file and register it for atlas building.
 *
 * @zh 加载 TTF 或 OTF 字体文件，并注册供图集构建使用。
 * @ja TTF または OTF フォントファイルを読み込み、アトラス構築用に登録します。
 * @ko TTF 또는 OTF 글꼴 파일을 읽고 아틀라스 빌드를 위해 등록합니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 *
 * @param filename - Filesystem path of the TTF/OTF font file.
 * @zh filename - TTF/OTF 字体文件的路径。
 * @ja filename - TTF/OTF フォントファイルのパスです。
 * @ko filename - TTF/OTF 글꼴 파일 경로입니다。
 *
 * @param size_pixels - Requested font height in pixels.
 * @zh size_pixels - 请求的字体像素高度。
 * @ja size_pixels - 要求するフォントのピクセル高さです。
 * @ko size_pixels - 요청하는 글꼴 픽셀 높이입니다.
 *
 * @param font_cfg - Font-loading configuration; optional variants accept null
 * for defaults. Ownership and merge settings affect how font data is retained.
 * @zh font_cfg - 字体加载配置；可选版本接受 null 使用默认值，所有权和合并设置会影响字体数据的保留方式。
 * @ja font_cfg - フォント読み込み設定です。任意指定の版では null で既定値を使い、所有権やマージ設定がデータ保持に影響します。
 * @ko font_cfg - 글꼴 로딩 설정입니다. 선택적인 경우 null은 기본값이며 소유권과 병합 설정이 데이터 유지 방식에 영향을
 * 줍니다.
 *
 * @param glyph_ranges - Uint16Array of inclusive [first, last] pairs followed
 * by 0.
 * getGlyphRanges* helpers omit that terminator: append it explicitly with
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])`.
 * Keep this input alive until atlas build; null selects default ranges.
 * @zh glyph_ranges - 包含首尾的 [first, last] 范围对 Uint16Array，末尾须加 0。getGlyphRanges*
 * 不含终止零值，
 * 须用 `new Uint16Array([...getGlyphRangesDefault(atlas), 0])` 显式补上。
 * 图集构建前须保持输入有效；null 选择默认范围。
 * @ja glyph_ranges - 両端を含む [first, last] ペアを 0 で終端した Uint16Array
 * です。getGlyphRanges* は終端 0 を含まないため、
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])` で明示的に追加します。
 * アトラス構築まで保持します。null は既定範囲を使います。
 * @ko glyph_ranges - 양 끝을 포함하는 [first, last] 쌍과 끝의 0으로 구성된 Uint16Array입니다.
 * getGlyphRanges*는 종료 0을 제외하므로
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])`으로 명시적으로 추가하세요.
 * 아틀라스 빌드까지 유지하세요. null은 기본 범위를 선택합니다.
 *
 * @returns Atlas-owned font handle, or null if the font file cannot be loaded.
 * Glyphs become available after atlas building.
 * @zh 图集拥有的字体句柄；字体文件无法加载时为 null。图集构建后字形才可用。
 * @ja アトラス所有のフォントです。ファイルを読み込めなければ null です。グリフは構築後に利用できます。
 * @ko 아틀라스 소유 글꼴 핸들입니다. 파일을 읽을 수 없으면 null입니다. 글리프는 빌드 후 사용할 수 있습니다.
 */
export function ImFontAtlas_AddFontFromFileTTF(
  self: ImFontAtlas,
  filename: string | Uint8Array,
  size_pixels: number,
  font_cfg: ImFontConfig | null = null,
  glyph_ranges: Uint16Array | null = null,
): ImFont | null {
  return native.ImFontAtlas_AddFontFromFileTTF(
    self,
    filename,
    size_pixels,
    font_cfg,
    glyph_ranges,
  );
}

/**
 * Add a font from uncompressed TrueType data in memory.
 *
 * @zh 从内存中的未压缩 TrueType 数据添加字体。
 * @ja メモリ上の非圧縮 TrueType データからフォントを追加します。
 * @ko 메모리의 압축되지 않은 TrueType 데이터에서 글꼴을 추가합니다.
 *
 * @remarks
 * Note: Transfer ownership of 'ttf_data' to ImFontAtlas!
 *
 * Will be deleted after destruction of the atlas.
 *
 * Set font_cfg->FontDataOwnedByAtlas=false to keep ownership of your data and
 * it won't be freed.
 * @zh
 * 注意：将 'ttf_data' 所有权转移给 ImFontAtlas！
 *
 * 图集销毁后会删除该数据。
 *
 * 设置 font_cfg->FontDataOwnedByAtlas=false 可保留数据所有权，避免数据被释放。
 * @ja
 * 注意：'ttf_data' の所有権は ImFontAtlas に移ります！
 *
 * アトラスの破棄後に削除されます。
 *
 * font_cfg->FontDataOwnedByAtlas=false にすると所有権を保持し、データは解放されません。
 * @ko
 * 참고: 'ttf_data'의 소유권을 ImFontAtlas로 이전합니다!
 *
 * 아틀라스 소멸 후 삭제됩니다.
 *
 * font_cfg->FontDataOwnedByAtlas=false로 설정하면 데이터 소유권을 유지하며 데이터가 해제되지 않습니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 *
 * @param font_data - Address of TTF/OTF bytes. By default the atlas takes
 * ownership and frees them; set FontDataOwnedByAtlas=false to retain ownership
 * and keep the memory alive.
 * @zh font_data - TTF/OTF 字节地址。图集默认取得所有权并释放它们；设 FontDataOwnedByAtlas=false
 * 可保留所有权，但须保持内存有效。
 * @ja font_data - TTF/OTF
 * バイトのアドレスです。既定ではアトラスが所有・解放します。FontDataOwnedByAtlas=false なら呼び出し側で寿命を管理します。
 * @ko font_data - TTF/OTF 바이트 주소입니다. 기본적으로 아틀라스가 소유하고 해제합니다.
 * FontDataOwnedByAtlas=false이면 호출자가 소유권과 메모리 수명을 관리합니다.
 *
 * @param font_data_size - Byte length of the supplied font data.
 * @zh font_data_size - 所提供字体数据的字节长度。
 * @ja font_data_size - 渡すフォントデータのバイト長です。
 * @ko font_data_size - 제공한 글꼴 데이터의 바이트 길이입니다.
 *
 * @param size_pixels - Requested font height in pixels.
 * @zh size_pixels - 请求的字体像素高度。
 * @ja size_pixels - 要求するフォントのピクセル高さです。
 * @ko size_pixels - 요청하는 글꼴 픽셀 높이입니다.
 *
 * @param font_cfg - Font-loading configuration; optional variants accept null
 * for defaults. Ownership and merge settings affect how font data is retained.
 * @zh font_cfg - 字体加载配置；可选版本接受 null 使用默认值，所有权和合并设置会影响字体数据的保留方式。
 * @ja font_cfg - フォント読み込み設定です。任意指定の版では null で既定値を使い、所有権やマージ設定がデータ保持に影響します。
 * @ko font_cfg - 글꼴 로딩 설정입니다. 선택적인 경우 null은 기본값이며 소유권과 병합 설정이 데이터 유지 방식에 영향을
 * 줍니다.
 *
 * @param glyph_ranges - Uint16Array of inclusive [first, last] pairs followed
 * by 0.
 * getGlyphRanges* helpers omit that terminator: append it explicitly with
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])`.
 * Keep this input alive until atlas build; null selects default ranges.
 * @zh glyph_ranges - 包含首尾的 [first, last] 范围对 Uint16Array，末尾须加 0。getGlyphRanges*
 * 不含终止零值，
 * 须用 `new Uint16Array([...getGlyphRangesDefault(atlas), 0])` 显式补上。
 * 图集构建前须保持输入有效；null 选择默认范围。
 * @ja glyph_ranges - 両端を含む [first, last] ペアを 0 で終端した Uint16Array
 * です。getGlyphRanges* は終端 0 を含まないため、
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])` で明示的に追加します。
 * アトラス構築まで保持します。null は既定範囲を使います。
 * @ko glyph_ranges - 양 끝을 포함하는 [first, last] 쌍과 끝의 0으로 구성된 Uint16Array입니다.
 * getGlyphRanges*는 종료 0을 제외하므로
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])`으로 명시적으로 추가하세요.
 * 아틀라스 빌드까지 유지하세요. null은 기본 범위를 선택합니다.
 *
 * @returns Atlas-owned font handle (the destination font in merge mode). Glyphs
 * become available after atlas building; invalid input may trigger native
 * assertions.
 * @zh 图集拥有的字体句柄，合并模式下为目标字体。图集构建后字形才可用；无效输入可能触发原生断言。
 * @ja アトラス所有のフォント（マージ時は対象フォント）です。グリフは構築後に利用でき、不正入力はアサートを起こし得ます。
 * @ko 아틀라스 소유 글꼴 핸들입니다. 병합 모드에서는 대상 글꼴입니다. 글리프는 빌드 후 사용할 수 있으며 잘못된 입력은 어설션을 유발할
 * 수 있습니다.
 */
export function ImFontAtlas_AddFontFromMemoryTTF(
  self: ImFontAtlas,
  font_data: bigint | null,
  font_data_size: number,
  size_pixels: number,
  font_cfg: ImFontConfig | null = null,
  glyph_ranges: Uint16Array | null = null,
): ImFont | null {
  return native.ImFontAtlas_AddFontFromMemoryTTF(
    self,
    font_data,
    font_data_size,
    size_pixels,
    font_cfg,
    glyph_ranges,
  );
}

/**
 * Add a font from compressed TrueType data in memory.
 *
 * @zh 从内存中的压缩 TrueType 数据添加字体。
 * @ja メモリ上の圧縮 TrueType データからフォントを追加します。
 * @ko 메모리의 압축된 TrueType 데이터에서 글꼴을 추가합니다.
 *
 * @remarks
 * 'compressed_font_data' still owned by caller.
 *
 * Compress with binary_to_compressed_c.cpp.
 * @zh
 * 'compressed_font_data' 仍由调用方持有。
 *
 * 使用 binary_to_compressed_c.cpp 压缩。
 * @ja
 * 'compressed_font_data' の所有権は呼び出し元に残ります。
 *
 * binary_to_compressed_c.cpp で圧縮します。
 * @ko
 * 'compressed_font_data'는 계속 호출자가 소유합니다.
 *
 * binary_to_compressed_c.cpp로 압축합니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 *
 * @param compressed_font_data - Address of stb-compressed font bytes; these
 * compressed input bytes are not transferred to atlas ownership.
 * @zh compressed_font_data - stb 压缩字体字节地址；这些压缩输入字节不会转移给图集所有。
 * @ja compressed_font_data - stb 圧縮フォントのアドレスです。圧縮入力の所有権はアトラスへ移りません。
 * @ko compressed_font_data - stb 압축 글꼴 바이트 주소입니다. 압축 입력의 소유권은 아틀라스로 이전되지 않습니다.
 *
 * @param compressed_font_data_size - Byte length of the supplied font data.
 * @zh compressed_font_data_size - 所提供字体数据的字节长度。
 * @ja compressed_font_data_size - 渡すフォントデータのバイト長です。
 * @ko compressed_font_data_size - 제공한 글꼴 데이터의 바이트 길이입니다.
 *
 * @param size_pixels - Requested font height in pixels.
 * @zh size_pixels - 请求的字体像素高度。
 * @ja size_pixels - 要求するフォントのピクセル高さです。
 * @ko size_pixels - 요청하는 글꼴 픽셀 높이입니다.
 *
 * @param font_cfg - Font-loading configuration; optional variants accept null
 * for defaults. Ownership and merge settings affect how font data is retained.
 * @zh font_cfg - 字体加载配置；可选版本接受 null 使用默认值，所有权和合并设置会影响字体数据的保留方式。
 * @ja font_cfg - フォント読み込み設定です。任意指定の版では null で既定値を使い、所有権やマージ設定がデータ保持に影響します。
 * @ko font_cfg - 글꼴 로딩 설정입니다. 선택적인 경우 null은 기본값이며 소유권과 병합 설정이 데이터 유지 방식에 영향을
 * 줍니다.
 *
 * @param glyph_ranges - Uint16Array of inclusive [first, last] pairs followed
 * by 0.
 * getGlyphRanges* helpers omit that terminator: append it explicitly with
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])`.
 * Keep this input alive until atlas build; null selects default ranges.
 * @zh glyph_ranges - 包含首尾的 [first, last] 范围对 Uint16Array，末尾须加 0。getGlyphRanges*
 * 不含终止零值，
 * 须用 `new Uint16Array([...getGlyphRangesDefault(atlas), 0])` 显式补上。
 * 图集构建前须保持输入有效；null 选择默认范围。
 * @ja glyph_ranges - 両端を含む [first, last] ペアを 0 で終端した Uint16Array
 * です。getGlyphRanges* は終端 0 を含まないため、
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])` で明示的に追加します。
 * アトラス構築まで保持します。null は既定範囲を使います。
 * @ko glyph_ranges - 양 끝을 포함하는 [first, last] 쌍과 끝의 0으로 구성된 Uint16Array입니다.
 * getGlyphRanges*는 종료 0을 제외하므로
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])`으로 명시적으로 추가하세요.
 * 아틀라스 빌드까지 유지하세요. null은 기본 범위를 선택합니다.
 *
 * @returns Atlas-owned font handle (the destination font in merge mode). Glyphs
 * become available after atlas building; invalid input may trigger native
 * assertions.
 * @zh 图集拥有的字体句柄，合并模式下为目标字体。图集构建后字形才可用；无效输入可能触发原生断言。
 * @ja アトラス所有のフォント（マージ時は対象フォント）です。グリフは構築後に利用でき、不正入力はアサートを起こし得ます。
 * @ko 아틀라스 소유 글꼴 핸들입니다. 병합 모드에서는 대상 글꼴입니다. 글리프는 빌드 후 사용할 수 있으며 잘못된 입력은 어설션을 유발할
 * 수 있습니다.
 */
export function ImFontAtlas_AddFontFromMemoryCompressedTTF(
  self: ImFontAtlas,
  compressed_font_data: bigint | null,
  compressed_font_data_size: number,
  size_pixels: number,
  font_cfg: ImFontConfig | null = null,
  glyph_ranges: Uint16Array | null = null,
): ImFont | null {
  return native.ImFontAtlas_AddFontFromMemoryCompressedTTF(
    self,
    compressed_font_data,
    compressed_font_data_size,
    size_pixels,
    font_cfg,
    glyph_ranges,
  );
}

/**
 * Add a font from Base85-encoded compressed TrueType data.
 *
 * @zh 从 Base85 编码的压缩 TrueType 数据添加字体。
 * @ja Base85 エンコードされた圧縮 TrueType データからフォントを追加します。
 * @ko Base85로 인코딩된 압축 TrueType 데이터에서 글꼴을 추가합니다.
 *
 * @remarks
 * 'compressed_font_data_base85' still owned by caller.
 *
 * Compress with binary_to_compressed_c.cpp with -base85 parameter.
 * @zh
 * 'compressed_font_data_base85' 仍由调用方持有。
 *
 * 使用 binary_to_compressed_c.cpp 并传入 -base85 参数压缩。
 * @ja
 * 'compressed_font_data_base85' の所有権は呼び出し元に残ります。
 *
 * binary_to_compressed_c.cpp に -base85 引数を指定して圧縮します。
 * @ko
 * 'compressed_font_data_base85'는 계속 호출자가 소유합니다.
 *
 * binary_to_compressed_c.cpp에 -base85 인수를 전달하여 압축합니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 *
 * @param compressed_font_data_base85 - NUL-terminated Base85 text encoding
 * stb-compressed font data.
 * @zh compressed_font_data_base85 - 以 NUL 结尾、编码 stb 压缩字体数据的 Base85 文本。
 * @ja compressed_font_data_base85 - stb 圧縮フォントを Base85 で表す NUL 終端テキストです。
 * @ko compressed_font_data_base85 - stb 압축 글꼴 데이터를 Base85로 인코딩한 NUL 종료 텍스트입니다.
 *
 * @param size_pixels - Requested font height in pixels.
 * @zh size_pixels - 请求的字体像素高度。
 * @ja size_pixels - 要求するフォントのピクセル高さです。
 * @ko size_pixels - 요청하는 글꼴 픽셀 높이입니다.
 *
 * @param font_cfg - Font-loading configuration; optional variants accept null
 * for defaults. Ownership and merge settings affect how font data is retained.
 * @zh font_cfg - 字体加载配置；可选版本接受 null 使用默认值，所有权和合并设置会影响字体数据的保留方式。
 * @ja font_cfg - フォント読み込み設定です。任意指定の版では null で既定値を使い、所有権やマージ設定がデータ保持に影響します。
 * @ko font_cfg - 글꼴 로딩 설정입니다. 선택적인 경우 null은 기본값이며 소유권과 병합 설정이 데이터 유지 방식에 영향을
 * 줍니다.
 *
 * @param glyph_ranges - Uint16Array of inclusive [first, last] pairs followed
 * by 0.
 * getGlyphRanges* helpers omit that terminator: append it explicitly with
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])`.
 * Keep this input alive until atlas build; null selects default ranges.
 * @zh glyph_ranges - 包含首尾的 [first, last] 范围对 Uint16Array，末尾须加 0。getGlyphRanges*
 * 不含终止零值，
 * 须用 `new Uint16Array([...getGlyphRangesDefault(atlas), 0])` 显式补上。
 * 图集构建前须保持输入有效；null 选择默认范围。
 * @ja glyph_ranges - 両端を含む [first, last] ペアを 0 で終端した Uint16Array
 * です。getGlyphRanges* は終端 0 を含まないため、
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])` で明示的に追加します。
 * アトラス構築まで保持します。null は既定範囲を使います。
 * @ko glyph_ranges - 양 끝을 포함하는 [first, last] 쌍과 끝의 0으로 구성된 Uint16Array입니다.
 * getGlyphRanges*는 종료 0을 제외하므로
 * `new Uint16Array([...getGlyphRangesDefault(atlas), 0])`으로 명시적으로 추가하세요.
 * 아틀라스 빌드까지 유지하세요. null은 기본 범위를 선택합니다.
 *
 * @returns Atlas-owned font handle (the destination font in merge mode). Glyphs
 * become available after atlas building; invalid input may trigger native
 * assertions.
 * @zh 图集拥有的字体句柄，合并模式下为目标字体。图集构建后字形才可用；无效输入可能触发原生断言。
 * @ja アトラス所有のフォント（マージ時は対象フォント）です。グリフは構築後に利用でき、不正入力はアサートを起こし得ます。
 * @ko 아틀라스 소유 글꼴 핸들입니다. 병합 모드에서는 대상 글꼴입니다. 글리프는 빌드 후 사용할 수 있으며 잘못된 입력은 어설션을 유발할
 * 수 있습니다.
 */
export function ImFontAtlas_AddFontFromMemoryCompressedBase85TTF(
  self: ImFontAtlas,
  compressed_font_data_base85: string | Uint8Array,
  size_pixels: number,
  font_cfg: ImFontConfig | null = null,
  glyph_ranges: Uint16Array | null = null,
): ImFont | null {
  return native.ImFontAtlas_AddFontFromMemoryCompressedBase85TTF(
    self,
    compressed_font_data_base85,
    size_pixels,
    font_cfg,
    glyph_ranges,
  );
}

/**
 * Clear the font atlas input data.
 *
 * @zh 清空字体图集的输入数据。
 * @ja フォントアトラスの入力データを消去します。
 * @ko 글꼴 아틀라스 입력 데이터를 비웁니다.
 *
 * @remarks
 * Clear input data (all ImFontConfig structures including sizes, TTF data,
 * glyph ranges, etc.) = all the data used to build the texture and fonts.
 * @zh
 * 清除输入数据（所有 ImFontConfig 结构，包括尺寸、TTF 数据、字形范围等），即构建纹理和字体所用的全部数据。
 * @ja
 * 入力データ（サイズ、TTF データ、グリフ範囲などを含むすべての ImFontConfig
 * 構造体）、つまりテクスチャとフォントの構築に使う全データを消去します。
 * @ko
 * 입력 데이터(크기, TTF 데이터, 글리프 범위 등을 포함한 모든 ImFontConfig 구조체), 즉 텍스처와 폰트 구축에 쓰인 모든
 * 데이터를 지웁니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 */
export function ImFontAtlas_ClearInputData(self: ImFontAtlas): void {
  native.ImFontAtlas_ClearInputData(self);
}

/**
 * Clear input and output font data.
 *
 * @zh 清空字体的输入和输出数据。
 * @ja フォントの入力および出力データを消去します。
 * @ko 글꼴 입력 및 출력 데이터를 비웁니다.
 *
 * @remarks
 * Clear input and output font data (same as ImFontAtlas_ClearInputData(self)
 * plus glyph storage and UV
 * coordinates).
 * @zh
 * 清除字体输入和输出数据（等同于 ImFontAtlas_ClearInputData(self)，再加上字形存储和 UV 坐标）。
 * @ja
 * フォントの入力と出力データを消去します（ImFontAtlas_ClearInputData(self) とグリフのストレージ、UV 座標の消去に相当）。
 * @ko
 * 폰트 입력 및 출력 데이터를 지웁니다(ImFontAtlas_ClearInputData(self)와 글리프 저장소, UV 좌표 삭제에
 * 해당).
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 */
export function ImFontAtlas_ClearFonts(self: ImFontAtlas): void {
  native.ImFontAtlas_ClearFonts(self);
}

/**
 * Clear output texture data (CPU side).
 *
 * @zh 清除输出纹理数据（CPU 侧）。
 * @ja 出力テクスチャデータ（CPU 側）を消去します。
 * @ko 출력 텍스처 데이터(CPU 측)를 지웁니다.
 *
 * @remarks
 * Saves RAM once the texture has been copied to graphics memory.
 * @zh
 * 在纹理复制到显存后可节省 RAM。
 * @ja
 * テクスチャをグラフィックスメモリに転送した後に RAM を節約できます。
 * @ko
 * 텍스처를 그래픽 메모리로 복사한 후 RAM을 절약합니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 */
export function ImFontAtlas_ClearTexData(self: ImFontAtlas): void {
  native.ImFontAtlas_ClearTexData(self);
}

/**
 * Clear all input and output.
 *
 * @zh 清除全部输入和输出。
 * @ja すべての入力と出力を消去します。
 * @ko 모든 입력과 출력을 지웁니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 */
export function ImFontAtlas_Clear(self: ImFontAtlas): void {
  native.ImFontAtlas_Clear(self);
}

/**
 * Build the font atlas and its texture data.
 *
 * @zh 构建字体图集及其纹理数据。
 * @ja フォントアトラスとテクスチャデータを構築します。
 * @ko 글꼴 아틀라스와 텍스처 데이터를 빌드합니다.
 *
 * @remarks
 * Builds the atlas pixel data. FontAtlas_GetTexDataAsAlpha8(self) and
 * FontAtlas_GetTexDataAsRGBA32(self) call this automatically when needed.
 *
 * - Upload the pixels to graphics memory, then store the texture handle with
 *   `ImFontAtlas_SetTexID(self, textureId)`.
 * - Row pitch is `Width * BytesPerPixel`; supported output formats use 1 or 4
 *   bytes per pixel.
 * - RGBA32 is provided for compatibility and convenience. Unless custom colored
 *   data is written, such as through the custom-rectangle API, its RGB channels
 *   are white and account for roughly 75% of the memory and bandwidth.
 * @zh
 * 构建图集像素数据。FontAtlas_GetTexDataAsAlpha8(self) 和
 * FontAtlas_GetTexDataAsRGBA32(self)
 * 会在需要时自动调用此函数。
 *
 * - 将像素上传到显存，再使用 `ImFontAtlas_SetTexID(self, textureId)` 保存纹理标识符。
 * - 行跨度为 `Width * BytesPerPixel`，支持的输出格式每像素使用 1 或 4 字节。
 * - RGBA32 用于兼容和便利。除非通过自定义矩形等接口写入彩色数据，否则 RGB 通道均为白色，约占 75% 的内存和带宽。
 * @ja
 * アトラスのピクセルデータを構築します。FontAtlas_GetTexDataAsAlpha8(self) と
 * FontAtlas_GetTexDataAsRGBA32(self)
 * は必要に応じて自動的に呼び出します。
 *
 * - ピクセルをグラフィックスメモリに転送し、`ImFontAtlas_SetTexID(self, textureId)` でテクスチャ ID
 *   を保存します。
 * - 行ピッチは `Width * BytesPerPixel` です。対応する出力形式は 1 ピクセルあたり 1 または 4 バイトを使います。
 * - RGBA32 は互換性と利便性のために用意されています。カスタム矩形 API などで色データを書き込まない限り RGB
 *   チャンネルは白く、メモリと帯域の約 75% を占めます。
 * @ko
 * 아틀라스 픽셀 데이터를 빌드합니다. FontAtlas_GetTexDataAsAlpha8(self)과
 * FontAtlas_GetTexDataAsRGBA32(self)가
 * 필요할 때 자동으로 호출합니다.
 *
 * - 픽셀을 그래픽 메모리에 업로드한 뒤 `ImFontAtlas_SetTexID(self, textureId)`로 텍스처 ID를 저장합니다.
 * - 행 피치는 `Width * BytesPerPixel`이며 지원하는 출력 형식은 픽셀당 1 또는 4바이트를 사용합니다.
 * - RGBA32는 호환성과 편의를 위해 제공됩니다. 사용자 정의 사각형 API 등으로 색상 데이터를 쓰지 않으면 RGB 채널은 흰색이며
 *   메모리와 대역폭의 약 75%를 차지합니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 *
 * @returns True if the font atlas was built successfully; false reports a build
 * failure.
 * @zh 字体图集成功构建时为 true，构建失败时为 false。
 * @ja フォントアトラスの構築に成功すれば true、失敗なら false です。
 * @ko 글꼴 아틀라스 빌드에 성공하면 true, 실패하면 false입니다.
 */
export function ImFontAtlas_Build(self: ImFontAtlas): boolean {
  return native.ImFontAtlas_Build(self);
}

/**
 * Test whether the font atlas has been built.
 *
 * @zh 判断字体图集是否已构建。
 * @ja フォントアトラスが構築済みかを調べます。
 * @ko 글꼴 아틀라스가 빌드되었는지 확인합니다.
 *
 * @remarks
 * Bit ambiguous: used to detect when user didn't build texture but effectively
 * we should check TexID != 0 except that would be backend dependent...
 * @zh
 * 语义略有歧义：用于检测用户未构建纹理的情况，但实际上应检查 TexID != 0，只是这样会依赖后端……
 * @ja
 * やや曖昧です。
 *
 * ユーザーがテクスチャを構築していないことの検出に使いますが、実際には TexID != 0 を確認すべきで、ただしそれはバックエンドに依存します。
 * @ko
 * 다소 모호합니다.
 *
 * 사용자가 텍스처를 구축하지 않았는지 감지하는 용도이지만 실제로는 TexID != 0을 검사해야 하며, 그렇게 하면 백엔드에 의존하게
 * 됩니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 *
 * @returns True if the atlas has fonts and its texture data is ready.
 * @zh 图集包含字体且纹理数据已就绪时为 true。
 * @ja アトラスにフォントがありテクスチャデータが準備済みなら true です。
 * @ko 아틀라스에 글꼴이 있고 텍스처 데이터가 준비되었으면 true입니다.
 */
export function ImFontAtlas_IsBuilt(self: ImFontAtlas): boolean {
  return native.ImFontAtlas_IsBuilt(self);
}

/**
 * Associate the atlas with its uploaded renderer texture identifier.
 *
 * @zh 将图集与上传后的渲染器纹理标识符关联。
 * @ja アトラスをアップロード済みのレンダラー用テクスチャ識別子に関連付けます。
 * @ko 아틀라스를 업로드된 렌더러 텍스처 식별자와 연결합니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 *
 * @param id - Renderer texture identifier (ImTextureID bigint), not an SFML
 * texture object.
 * @zh id - 渲染器纹理标识符（ImTextureID bigint），不是 SFML 纹理对象。
 * @ja id - レンダラーのテクスチャ識別子（ImTextureID の bigint）です。SFML テクスチャオブジェクトではありません。
 * @ko id - 렌더러 텍스처 식별자(ImTextureID bigint)이며 SFML 텍스처 객체가 아닙니다.
 */
export function ImFontAtlas_SetTexID(self: ImFontAtlas, id: bigint): void {
  native.ImFontAtlas_SetTexID(self, id);
}

/**
 * Reserve a custom rectangle in the font atlas.
 *
 * @zh 在字体图集中预留自定义矩形。
 * @ja フォントアトラスに独自の矩形領域を確保します。
 * @ko 글꼴 아틀라스에 사용자 정의 사각형을 예약합니다.
 *
 * @remarks
 * You can request arbitrary rectangles to be packed into the atlas, for your
 * own purposes.
 *
 * - After calling ImFontAtlas_Build(self), you can query the rectangle position
 *   and render your
 *   pixels.
 *
 * - For colored output, native backends may use the atlas's TexPixelsUseColors
 * flag to choose a texture format. This flag is not exposed by the JS atlas
 * view.
 *
 * - You can also request your rectangles to be mapped as font glyph (given a
 *   font + Unicode point), so you can render e.g. custom colorful icons and use
 *   them as regular glyphs.
 *
 * - Read docs/FONTS.md for more details about using colorful icons.
 *
 * - Note: this API may be redesigned later in order to support multi-monitor
 *   varying DPI settings.
 * @zh
 * 可请求将任意矩形打包进图集，供自定义用途。
 *
 * - 调用 ImFontAtlas_Build(self) 后可查询矩形位置并绘制自己的像素。
 *
 * - 对于彩色输出，原生后端可能参考图集的 TexPixelsUseColors 标志来选择纹理格式。JS 图集视图未暴露此标志。
 *
 * - 也可将矩形映射为字体字形（指定字体 + Unicode 码点），从而绘制自定义彩色图标等，并像普通字形一样使用。
 *
 * - 使用彩色图标的详情见 docs/FONTS.md。
 *
 * - 注意：此 API 未来可能重新设计，以支持多显示器不同 DPI 设置。
 * @ja
 * 独自の用途で任意の矩形をアトラスに詰め込むよう要求できます。
 *
 * - ImFontAtlas_Build(self) の後に矩形位置を調べ、自分のピクセルを描画できます。
 *
 * - カラー出力では、ネイティブのバックエンドがアトラスの TexPixelsUseColors フラグを参照して
 *   テクスチャ形式を選ぶ場合があります。このフラグは JS のアトラスビューでは公開されていません。
 *
 * - フォントと Unicode コードポイントを指定して矩形をグリフに対応付けることもでき、独自のカラーアイコンなどを通常のグリフとして描画できます。
 *
 * - カラーアイコンの詳細は docs/FONTS.md を読んでください。
 *
 * - 注意：複数モニターで異なる DPI 設定に対応するため、後で API を再設計する可能性があります。
 * @ko
 * 사용자 용도로 임의의 사각형을 아틀라스에 패킹하도록 요청할 수 있습니다.
 *
 * - ImFontAtlas_Build(self) 호출 후 사각형 위치를 조회하고 자체 픽셀을 그릴 수 있습니다.
 *
 * - 컬러 출력에서는 네이티브 백엔드가 아틀라스의 TexPixelsUseColors 플래그를 참조해 텍스처 형식을 선택할 수 있습니다.
 *   JS 아틀라스 뷰는 이 플래그를 노출하지 않습니다.
 *
 * - 폰트와 Unicode 코드 포인트를 지정하여 사각형을 글리프에 매핑할 수도 있으므로 사용자 정의 컬러 아이콘 등을 일반 글리프처럼
 *   렌더링하고 사용할 수 있습니다.
 *
 * - 컬러 아이콘 사용에 관한 자세한 내용은 docs/FONTS.md를 읽으세요.
 *
 * - 참고: 다중 모니터의 서로 다른 DPI 설정을 지원하기 위해 나중에 이 API가 재설계될 수 있습니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 *
 * @param width - Width of the custom atlas rectangle in pixels.
 * @zh width - 自定义图集矩形的像素宽度。
 * @ja width - アトラスのカスタム矩形のピクセル幅です。
 * @ko width - 사용자 정의 아틀라스 사각형의 픽셀 너비입니다。
 *
 * @param height - Height of the custom atlas rectangle in pixels.
 * @zh height - 自定义图集矩形的像素高度。
 * @ja height - アトラスのカスタム矩形のピクセル高さです。
 * @ko height - 사용자 정의 아틀라스 사각형의 픽셀 높이입니다.
 *
 * @returns Zero-based custom-rectangle index for
 * ImFontAtlas_GetCustomRectByIndex(self, index);
 * packing coordinates become available after atlas building.
 * @zh 供 ImFontAtlas_GetCustomRectByIndex(self, index)
 * 使用的零基自定义矩形索引；图集构建后才能获得打包坐标。
 * @ja ImFontAtlas_GetCustomRectByIndex(self, index) 用の 0
 * 始まりの矩形番号です。配置座標はアトラス構築後に利用できます。
 * @ko ImFontAtlas_GetCustomRectByIndex(self, index)용 0 기반 사각형 인덱스입니다. 패킹 좌표는
 * 아틀라스 빌드 후 사용할 수 있습니다.
 */
export function ImFontAtlas_AddCustomRectRegular(
  self: ImFontAtlas,
  width: number,
  height: number,
): number {
  return native.ImFontAtlas_AddCustomRectRegular(self, width, height);
}

/**
 * Reserve an atlas rectangle and map it to a custom glyph in a font.
 *
 * @zh 预留图集矩形，并将其映射为字体中的自定义字形。
 * @ja アトラス内に矩形を予約し、フォントのカスタムグリフに対応付けます。
 * @ko 아틀라스 사각형을 예약하고 글꼴의 사용자 정의 글리프에 연결합니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 *
 * @param font - Font handle used for text drawing or for registering the custom
 * glyph; text drawing accepts null for the current font.
 * @zh font - 用于绘制文字或注册自定义字形的字体句柄；绘制文字时 null 使用当前字体。
 * @ja font - 文字描画やカスタムグリフ登録に使うフォントです。文字描画時の null は現在のフォントを使います。
 * @ko font - 텍스트 그리기 또는 사용자 정의 글리프 등록에 쓸 글꼴 핸들입니다. 텍스트의 null은 현재 글꼴입니다.
 *
 * @param id - Unicode code point to query or add, within the range supported by
 * this ImWchar build.
 * @zh id - 要查询或加入的 Unicode 码点，须在此 ImWchar 构建支持的范围内。
 * @ja id - 検索または追加する Unicode コードポイントです。この ImWchar ビルドの対応範囲内で指定します。
 * @ko id - 조회하거나 추가할 유니코드 코드 포인트이며 이 ImWchar 빌드가 지원하는 범위여야 합니다.
 *
 * @param width - Width of the custom atlas rectangle in pixels.
 * @zh width - 自定义图集矩形的像素宽度。
 * @ja width - アトラスのカスタム矩形のピクセル幅です。
 * @ko width - 사용자 정의 아틀라스 사각형의 픽셀 너비입니다。
 *
 * @param height - Height of the custom atlas rectangle in pixels.
 * @zh height - 自定义图集矩形的像素高度。
 * @ja height - アトラスのカスタム矩形のピクセル高さです。
 * @ko height - 사용자 정의 아틀라스 사각형의 픽셀 높이입니다.
 *
 * @param advance_x - Horizontal pen advance in pixels after drawing the custom
 * glyph.
 * @zh advance_x - 绘制自定义字形后笔位置的水平像素前进量。
 * @ja advance_x - カスタムグリフ描画後にペンを進める水平ピクセル数です。
 * @ko advance_x - 사용자 정의 글리프를 그린 후 가로 펜 이동량(픽셀)입니다.
 *
 * @param offset - Glyph drawing offset in pixels relative to the pen position.
 * @zh offset - 字形绘制位置相对笔位置的像素偏移。
 * @ja offset - ペン位置からのグリフ描画位置のピクセル差分です。
 * @ko offset - 펜 위치 기준 글리프 그리기 픽셀 오프셋입니다。
 *
 * @returns Zero-based custom-rectangle index for
 * ImFontAtlas_GetCustomRectByIndex(self, index);
 * packing coordinates become available after atlas building.
 * @zh 供 ImFontAtlas_GetCustomRectByIndex(self, index)
 * 使用的零基自定义矩形索引；图集构建后才能获得打包坐标。
 * @ja ImFontAtlas_GetCustomRectByIndex(self, index) 用の 0
 * 始まりの矩形番号です。配置座標はアトラス構築後に利用できます。
 * @ko ImFontAtlas_GetCustomRectByIndex(self, index)용 0 기반 사각형 인덱스입니다. 패킹 좌표는
 * 아틀라스 빌드 후 사용할 수 있습니다.
 */
export function ImFontAtlas_AddCustomRectFontGlyph(
  self: ImFontAtlas,
  font: ImFont,
  id: number,
  width: number,
  height: number,
  advance_x: number,
  offset: ImVec2Like = { x: 0, y: 0 },
): number {
  return native.ImFontAtlas_AddCustomRectFontGlyph(
    self,
    font,
    id,
    width,
    height,
    advance_x,
    offset,
  );
}

/**
 * Access a registered custom atlas rectangle by its index.
 *
 * @zh 按索引访问已注册的图集自定义矩形。
 * @ja インデックスで登録済みのカスタムアトラス矩形にアクセスします。
 * @ko 인덱스로 등록된 사용자 정의 아틀라스 사각형에 접근합니다.
 *
 * @param self - ImFontAtlas handle on which this method operates.
 * @zh self - 此方法操作的 ImFontAtlas 句柄。
 * @ja self - このメソッドの操作対象となる ImFontAtlas ハンドルです。
 * @ko self - 이 메서드가 조작할 ImFontAtlas 핸들입니다.
 *
 * @param index - Valid zero-based custom rectangle index returned by
 * AddCustomRect; invalid indices are not a nullable lookup.
 * @zh index - AddCustomRect 返回的有效零基自定义矩形索引；无效索引不是可返回 null 的查询。
 * @ja index - AddCustomRect が返した有効な 0 始まりの矩形番号です。不正な番号を null として扱う検索ではありません。
 * @ko index - AddCustomRect가 반환한 유효한 0 기반 사각형 인덱스입니다. 잘못된 인덱스를 null로 처리하는 조회가
 * 아닙니다.
 *
 * @returns Borrowed atlas rectangle handle for a valid index; an invalid index
 * is an error, not a null sentinel.
 * @zh 有效索引对应的图集矩形借用句柄；无效索引是错误，不以 null 表示。
 * @ja 有効な番号のアトラス矩形の借用ハンドルです。不正な番号はエラーで、null を返す規約ではありません。
 * @ko 유효한 인덱스의 아틀라스 사각형 빌린 핸들입니다. 잘못된 인덱스는 오류이며 null 표시가 아닙니다.
 */
export function ImFontAtlas_GetCustomRectByIndex(
  self: ImFontAtlas,
  index: number,
): ImFontAtlasCustomRect | null {
  return native.ImFontAtlas_GetCustomRectByIndex(self, index);
}
