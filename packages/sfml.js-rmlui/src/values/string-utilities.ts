import { markAsUntransferable } from 'node:worker_threads';
import { native } from '../internal/native';
import { StringView, stringViewMapping } from './string-view';

/**
 * UTF-8 text or a retained immutable native byte view.
 *
 * @zh UTF-8 文本或保活的不可变原生字节视图。
 * @ja UTF-8 テキストまたは保持する不変ネイティブバイトビュー。
 * @ko UTF-8 텍스트 또는 유지된 불변 네이티브 바이트 뷰입니다.
 */
export type StringInput = StringView | string;

/**
 * Preserve native byte views when passing utility arguments.
 *
 * @internal
 * @param value - Native view or string.
 * @returns Text or retained handle.
 */
function textArgument(value: StringInput): string | object {
  return typeof value === 'string' ? value : stringViewMapping(value).handle;
}

/**
 * Check single-byte delimiters before native char conversion.
 *
 * @internal
 * @param value - ASCII character, including NUL.
 * @returns ASCII byte.
 */
function delimiterByte(value: string): number {
  if (typeof value !== 'string') {
    throw new TypeError('Expected an ASCII delimiter');
  }
  if (value.length !== 1 || value.charCodeAt(0) > 127) {
    throw new RangeError('Delimiter must contain exactly one ASCII byte');
  }

  return value.charCodeAt(0);
}

/**
 * Native Rml::StringUtilities with UTF-8 byte and codepoint positions.
 *
 * @zh 原生 Rml::StringUtilities，位置以 UTF-8 字节和码点计。
 * @ja UTF-8 バイト位置とコードポイントを使う Rml::StringUtilities。
 * @ko UTF-8 바이트와 코드포인트 위치를 사용하는 Rml::StringUtilities입니다.
 * @remarks
 * ASCII folding, RML entity decoding and quote rules are the native rules.
 * Reuse StringView for cached batched offset lookup instead of rescanning text.
 * @zh ASCII 大小写、RML 实体及引号遵循原生规则；复用 StringView 进行缓存批量查询。
 * @ja ASCII、RML 実体、引用符は原生規則です。索引には StringView を再利用します。
 * @ko ASCII, RML 엔티티와 인용 부호는 원래 규칙입니다. 인덱스에는 StringView를 재사용합니다.
 */
export class StringUtilities {
  /**
   * Static utility class for the native Rml::StringUtilities namespace.
   *
   * @zh 原生 Rml::StringUtilities 命名空间的静态工具类。
   * @ja ネイティブ Rml::StringUtilities 名前空間の静的ユーティリティ。
   * @ko 네이티브 Rml::StringUtilities 네임스페이스의 정적 유틸리티입니다.
   */
  private constructor() {}

  /**
   * Apply native ToLower to ASCII letters only.
   *
   * @zh 原生 ToLower 仅转换 ASCII 字母。
   * @ja ネイティブ ToLower で ASCII 文字だけを変換します。
   * @ko 네이티브 ToLower로 ASCII 문자만 변환합니다.
   * @param value - Input text.
   * @zh value - 输入文本。
   * @ja value - 入力テキスト。
   * @ko value - 입력 텍스트입니다.
   * @returns Lowercase ASCII text.
   * @zh ASCII 字母转为小写后的文本。
   * @ja ASCII 文字を小文字にしたテキスト。
   * @ko ASCII 문자를 소문자로 바꾼 텍스트입니다.
   */
  static toLower(value: StringInput): string {
    return native.stringUnary('lower', textArgument(value));
  }

  /**
   * Apply native ToUpper to ASCII letters only.
   *
   * @zh 原生 ToUpper 仅转换 ASCII 字母。
   * @ja ネイティブ ToUpper で ASCII 文字だけを変換します。
   * @ko 네이티브 ToUpper로 ASCII 문자만 변환합니다.
   * @param value - Input text.
   * @zh value - 输入文本。
   * @ja value - 入力テキスト。
   * @ko value - 입력 텍스트입니다.
   * @returns Uppercase ASCII text.
   * @zh ASCII 字母转为大写后的文本。
   * @ja ASCII 文字を大文字にしたテキスト。
   * @ko ASCII 문자를 대문자로 바꾼 텍스트입니다.
   */
  static toUpper(value: StringInput): string {
    return native.stringUnary('upper', textArgument(value));
  }

  /**
   * Apply Rml::StringUtilities::EncodeRml.
   *
   * @zh 调用 Rml::StringUtilities::EncodeRml。
   * @ja Rml::StringUtilities::EncodeRml を適用します。
   * @ko Rml::StringUtilities::EncodeRml을 적용합니다.
   * @param value - Input text.
   * @zh value - 输入文本。
   * @ja value - 入力テキスト。
   * @ko value - 입력 텍스트입니다.
   * @returns Text with native RML entities.
   * @zh 使用原生 RML 实体编码的文本。
   * @ja ネイティブ RML 実体で符号化したテキスト。
   * @ko 네이티브 RML 엔티티로 인코딩한 텍스트입니다.
   */
  static encodeRml(value: StringInput): string {
    return native.stringUnary('encode', textArgument(value));
  }

  /**
   * Apply Rml::StringUtilities::DecodeRml in one native pass.
   *
   * @zh 单次原生遍历调用 Rml::StringUtilities::DecodeRml。
   * @ja 一回のネイティブ処理で Rml::StringUtilities::DecodeRml を適用します。
   * @ko 네이티브 단일 패스로 Rml::StringUtilities::DecodeRml을 적용합니다.
   * @param value - RML text.
   * @zh value - RML 文本。
   * @ja value - RML テキスト。
   * @ko value - RML 텍스트입니다.
   * @returns Decoded native entities; newly decoded entities are not reparsed.
   * @zh 解码原生实体后的文本；新解码出的实体不再次解析。
   * @ja ネイティブ実体の復号結果。復号された実体は再解析しません。
   * @ko 네이티브 엔티티 디코딩 결과이며 새로 디코딩된 엔티티는 다시 파싱하지 않습니다.
   */
  static decodeRml(value: StringInput): string {
    return native.stringUnary('decode', textArgument(value));
  }

  /**
   * Apply native Replace for text or numeric byte characters.
   *
   * @zh 对文本或数值字节字符调用原生 Replace。
   * @ja テキストまたは数値バイト文字にネイティブ Replace を適用します。
   * @ko 텍스트 또는 숫자 바이트 문자에 네이티브 Replace를 적용합니다.
   * @param value - Source text.
   * @zh value - 源文本。
   * @ja value - 元テキスト。
   * @ko value - 원본 텍스트입니다.
   * @param search - Text or byte from zero to 255.
   * @zh search - 搜索文本，或 0 至 255 的字节。
   * @ja search - 検索文字列または 0 から 255 のバイト。
   * @ko search - 검색 문자열 또는 0부터 255까지의 바이트입니다.
   * @param replacement - Same kind of value as search.
   * @zh replacement - 与 search 类型相同的替换值。
   * @ja replacement - search と同じ型の置換値。
   * @ko replacement - search와 같은 형식의 교체 값입니다.
   * @returns Replaced text; an empty string search leaves the input unchanged.
   * @zh 替换后的文本；空搜索字符串保留原输入。
   * @ja 置換結果。空の検索文字列では入力を保持します。
   * @ko 교체된 텍스트이며 빈 검색 문자열은 입력을 유지합니다.
   */
  static replace(
    value: StringInput, search: string | number, replacement: string | number,
  ): string {
    return native.stringUnary(
      'replace', textArgument(value), search, replacement);
  }

  /**
   * Apply native IsWhitespace to CR, LF, space and tab.
   *
   * @zh 原生 IsWhitespace 识别回车、换行、空格和制表符。
   * @ja ネイティブ IsWhitespace の CR、LF、空白、タブを判定します。
   * @ko 네이티브 IsWhitespace의 CR, LF, 공백과 탭을 판별합니다.
   * @param value - One ASCII byte.
   * @zh value - 一个 ASCII 字节。
   * @ja value - 一つの ASCII バイト。
   * @ko value - ASCII 바이트 하나입니다.
   * @returns Native whitespace membership.
   * @zh 是否属于原生空白字符集合。
   * @ja ネイティブ空白文字に含まれるかどうか。
   * @ko 네이티브 공백 문자에 포함되는지 여부입니다.
   */
  static isWhitespace(value: string): boolean {
    const byte = delimiterByte(value);
    return byte === 13 || byte === 10 || byte === 32 || byte === 9;
  }

  /**
   * Apply both native StripWhitespace overloads through a retained view.
   *
   * @zh 通过保活视图支持原生 StripWhitespace 的两种重载。
   * @ja 保持ビューでネイティブ StripWhitespace の両オーバーロードを扱います。
   * @ko 유지된 뷰로 네이티브 StripWhitespace의 두 오버로드를 처리합니다.
   * @param value - Text or byte view.
   * @zh value - 文本或字节视图。
   * @ja value - テキストまたはバイトビュー。
   * @ko value - 텍스트 또는 바이트 뷰입니다.
   * @returns Text trimmed using native whitespace rules.
   * @zh 按原生空白规则去掉首尾空白的文本。
   * @ja ネイティブ規則で両端の空白を除いたテキスト。
   * @ko 네이티브 규칙에 따라 양 끝의 공백을 제거한 텍스트입니다.
   */
  static stripWhitespace(value: StringInput): string {
    return native.stringUnary('strip', textArgument(value));
  }

  /**
   * Apply TrimTrailingDotZeros to a checked decimal representation.
   *
   * @zh 对经校验的小数字符串调用 TrimTrailingDotZeros。
   * @ja 検証した小数表現に TrimTrailingDotZeros を適用します。
   * @ko 검증한 십진 소수 표현에 TrimTrailingDotZeros를 적용합니다.
   * @param value - Signed or unsigned decimal with a dot and digits.
   * @zh value - 含小数点与数字的有符号或无符号十进制文本。
   * @ja value - 小数点と数字を含む符号付き・符号なしの十進テキスト。
   * @ko value - 소수점과 숫자를 포함한 부호 있는/없는 십진수 텍스트입니다.
   * @returns Text without trailing decimal zeroes or an empty decimal dot.
   * @zh 去掉小数末尾零及空小数点后的文本。
   * @ja 小数末尾のゼロと不要な小数点を除いたテキスト。
   * @ko 소수 끝의 0과 불필요한 소수점을 제거한 텍스트입니다.
   */
  static trimTrailingDotZeros(value: string): string {
    if (typeof value !== 'string') {
      throw new TypeError('Expected decimal text');
    }
    if (!/^[+-]?(?:\d+\.\d*|\.\d+)$/.test(value)) {
      throw new RangeError('Expected a decimal representation with a dot');
    }

    return native.stringUnary('trim', value);
  }

  /**
   * Apply native StartsWith to complete byte views.
   *
   * @zh 对完整字节视图调用原生 StartsWith。
   * @ja 完全なバイトビューにネイティブ StartsWith を適用します。
   * @ko 전체 바이트 뷰에 네이티브 StartsWith를 적용합니다.
   * @param value - Source text.
   * @zh value - 源文本。
   * @ja value - 元テキスト。
   * @ko value - 원본 텍스트입니다.
   * @param prefix - Required starting bytes.
   * @zh prefix - 要匹配的起始字节。
   * @ja prefix - 一致を確認する先頭バイト。
   * @ko prefix - 일치 여부를 확인할 시작 바이트입니다.
   * @returns Whether the source starts with the prefix.
   * @zh 源是否以指定前缀开头。
   * @ja 元データが指定の接頭辞で始まるかどうか。
   * @ko 원본이 지정한 접두사로 시작하는지 여부입니다.
   */
  static startsWith(value: StringInput, prefix: StringInput): boolean {
    return native.stringViewOperation(
      stringViewMapping(value).handle, 'starts',
      stringViewMapping(prefix).handle);
  }

  /**
   * Apply native EndsWith to complete byte views.
   *
   * @zh 对完整字节视图调用原生 EndsWith。
   * @ja 完全なバイトビューにネイティブ EndsWith を適用します。
   * @ko 전체 바이트 뷰에 네이티브 EndsWith를 적용합니다.
   * @param value - Source text.
   * @zh value - 源文本。
   * @ja value - 元テキスト。
   * @ko value - 원본 텍스트입니다.
   * @param suffix - Required ending bytes.
   * @zh suffix - 要匹配的末尾字节。
   * @ja suffix - 一致を確認する末尾バイト。
   * @ko suffix - 일치 여부를 확인할 끝 바이트입니다.
   * @returns Whether the source ends with the suffix.
   * @zh 源是否以指定后缀结尾。
   * @ja 元データが指定の接尾辞で終わるかどうか。
   * @ko 원본이 지정한 접미사로 끝나는지 여부입니다.
   */
  static endsWith(value: StringInput, suffix: StringInput): boolean {
    return native.stringViewOperation(
      stringViewMapping(value).handle, 'ends',
      stringViewMapping(suffix).handle);
  }

  /**
   * Apply native StringCompareCaseInsensitive using ASCII folding.
   *
   * @zh 使用 ASCII 折叠调用原生 StringCompareCaseInsensitive。
   * @ja ASCII 変換でネイティブ StringCompareCaseInsensitive を適用します。
   * @ko ASCII 변환으로 네이티브 StringCompareCaseInsensitive를 적용합니다.
   * @param lhs - Left byte view.
   * @zh lhs - 左侧字节视图。
   * @ja lhs - 左側のバイトビュー。
   * @ko lhs - 왼쪽 바이트 뷰입니다.
   * @param rhs - Right byte view.
   * @zh rhs - 右侧字节视图。
   * @ja rhs - 右側のバイトビュー。
   * @ko rhs - 오른쪽 바이트 뷰입니다.
   * @returns Whether the folded bytes are equal.
   * @zh 大小写折叠后的字节是否相同。
   * @ja 大小文字を変換したバイトが一致するかどうか。
   * @ko 대소문자를 변환한 바이트가 같은지 여부입니다.
   */
  static stringCompareCaseInsensitive(
    lhs: StringInput, rhs: StringInput,
  ): boolean {
    return native.stringViewOperation(
      stringViewMapping(lhs).handle, 'compare', stringViewMapping(rhs).handle);
  }

  /**
   * Expand native lists, optionally using custom opening and closing quotes.
   *
   * @zh 展开原生列表，可指定自定义起始和结束引号。
   * @ja 任意の開始・終了引用符でネイティブリストを展開します。
   * @ko 선택적 시작 및 끝 인용 부호로 네이티브 목록을 확장합니다.
   * @param value - List text.
   * @zh value - 列表文本。
   * @ja value - リストのテキスト。
   * @ko value - 목록 텍스트입니다.
   * @param delimiter - ASCII delimiter, default comma.
   * @zh delimiter - ASCII 分隔符，默认为逗号。
   * @ja delimiter - ASCII 区切り文字。既定はコンマです。
   * @ko delimiter - ASCII 구분자이며 기본값은 쉼표입니다.
   * @param quoteOrIgnore - Opening quote, or ignore-repeated flag.
   * @zh quoteOrIgnore - 起始引号，或是否忽略重复分隔符；默认为 false。
   * @ja quoteOrIgnore - 開始引用符または連続区切りの省略指定。既定は false です。
   * @ko quoteOrIgnore - 시작 인용 부호 또는 반복 구분자 생략 여부이며 기본값은 false입니다.
   * @param unquote - Closing quote for the custom overload.
   * @zh unquote - 自定义重载的结束引号；使用自定义起始引号时必须提供。
   * @ja unquote - 独自引用符の終了文字。開始引用符指定時は必須です。
   * @ko unquote - 사용자 지정 끝 인용 부호이며 시작 인용 부호를 지정하면 필수입니다.
   * @param ignoreRepeatedDelimiters - Omit empty interior entries.
   * @zh ignoreRepeatedDelimiters - 自定义引号模式中省略中间空条目，默认为 false。
   * @ja ignoreRepeatedDelimiters - 独自引用符で内部の空項目を省略。既定は false です。
   * @ko ignoreRepeatedDelimiters - 사용자 지정 인용 모드의 내부 빈 항목을 생략하며 기본값은 false입니다.
   * @returns Native expanded entries; default quotes are removed.
   * @zh 原生展开条目；默认引号会移除。
   * @ja ネイティブ展開項目。既定の引用符は除去されます。
   * @ko 네이티브 확장 항목이며 기본 인용 부호는 제거됩니다.
   */
  static expandString(
    value: StringInput, delimiter = ',',
    quoteOrIgnore: string | boolean = false,
    unquote?: string, ignoreRepeatedDelimiters = false,
  ): string[] {
    const custom = typeof quoteOrIgnore === 'string';
    if (custom && unquote === undefined) {
      throw new TypeError('Custom quotes require an opening and closing byte');
    }
    if (!custom && typeof quoteOrIgnore !== 'boolean') {
      throw new TypeError('Expected a quote or repeated-delimiter flag');
    }

    return native.expandString(
      textArgument(value), delimiterByte(delimiter),
      custom ? delimiterByte(quoteOrIgnore as string) : undefined,
      custom ? delimiterByte(unquote!) : undefined,
      custom ? ignoreRepeatedDelimiters : quoteOrIgnore as boolean);
  }

  /**
   * Append native JoinString output to an optional initial string.
   *
   * @zh 将原生 JoinString 输出追加到可选初始字符串。
   * @ja 任意の初期文字列へネイティブ JoinString の出力を追記します。
   * @ko 선택적 초기 문자열에 네이티브 JoinString 출력을 추가합니다.
   * @param values - Input string list.
   * @zh values - 输入字符串列表。
   * @ja values - 入力文字列リスト。
   * @ko values - 입력 문자열 목록입니다.
   * @param delimiter - ASCII separator, default comma; NUL adds no separator.
   * @zh delimiter - ASCII 分隔符，默认为逗号；NUL 不添加分隔符。
   * @ja delimiter - ASCII 区切り。既定はコンマで、NUL では挿入しません。
   * @ko delimiter - ASCII 구분자이며 기본값은 쉼표이고 NUL이면 삽입하지 않습니다.
   * @param initial - Native destination's initial contents.
   * @zh initial - 原生目标的初始内容，默认为空字符串。
   * @ja initial - ネイティブ出力先の初期内容。既定は空文字列です。
   * @ko initial - 네이티브 대상의 초기 내용이며 기본값은 빈 문자열입니다.
   * @returns Native appended string.
   * @zh 原生追加后的字符串。
   * @ja ネイティブで追記した文字列。
   * @ko 네이티브로 추가한 문자열입니다.
   */
  static joinString(
    values: readonly string[], delimiter = ',', initial = '',
  ): string {
    return native.joinString(values, delimiterByte(delimiter), initial);
  }

  /**
   * Read native ToCharacter at an explicit byte offset.
   *
   * @zh 在指定字节偏移读取原生 ToCharacter。
   * @ja 明示バイト位置でネイティブ ToCharacter を取得します。
   * @ko 명시한 바이트 오프셋에서 네이티브 ToCharacter를 읽습니다.
   * @param value - UTF-8 text or partial byte view.
   * @zh value - UTF-8 文本或部分字节视图。
   * @ja value - UTF-8 テキストまたは部分バイトビュー。
   * @ko value - UTF-8 텍스트 또는 부분 바이트 뷰입니다.
   * @param offset - Dereferenceable byte offset.
   * @zh offset - 可解引用的字节偏移，默认为 0。
   * @ja offset - 参照可能なバイト位置。既定は 0 です。
   * @ko offset - 역참조 가능한 바이트 오프셋이며 기본값은 0입니다.
   * @returns Native codepoint; invalid or truncated bytes decode as zero.
   * @zh 原生码点；无效或截断的字节解码为 0。
   * @ja ネイティブコードポイント。不正・切断されたバイトは 0 です。
   * @ko 네이티브 코드포인트이며 잘못되거나 잘린 바이트는 0입니다.
   */
  static toCharacter(value: StringInput, offset = 0): number {
    return native.stringViewOperation(
      stringViewMapping(value).handle, 'character', offset) as number;
  }

  /**
   * Read native BytesUTF8 for one unsigned codepoint.
   *
   * @zh 读取一个无符号码点的原生 BytesUTF8。
   * @ja 符号なしコードポイントのネイティブ BytesUTF8 を取得します。
   * @ko 부호 없는 코드포인트의 네이티브 BytesUTF8을 읽습니다.
   * @param character - Unsigned 32-bit codepoint.
   * @zh character - 无符号 32 位码点。
   * @ja character - 符号なし 32 ビットコードポイント。
   * @ko character - 부호 없는 32비트 코드포인트입니다.
   * @returns Encoded byte count, or zero above the native Unicode range.
   * @zh 编码字节数量；超出原生 Unicode 范围时返回 0。
   * @ja 符号化バイト数。ネイティブ Unicode 範囲外では 0 です。
   * @ko 인코딩 바이트 수이며 네이티브 Unicode 범위를 넘으면 0입니다.
   */
  static bytesUTF8(character: number): number {
    return native.encodeCharacters(character, true) as number;
  }

  /**
   * Apply either native ToUTF8 overload in one call.
   *
   * @zh 一次调用支持原生 ToUTF8 的两种重载。
   * @ja 一回でネイティブ ToUTF8 の両オーバーロードを適用します。
   * @ko 호출 한 번으로 네이티브 ToUTF8의 두 오버로드를 적용합니다.
   * @param characters - Unsigned codepoint or fixed unshared Uint32Array.
   * @zh characters - 无符号码点，或固定且非共享的 Uint32Array。
   * @ja characters - 符号なしコードポイントまたは固定・非共有の Uint32Array。
   * @ko characters - 부호 없는 코드포인트 또는 고정된 비공유 Uint32Array입니다.
   * @returns Native UTF-8 text; invalid codepoints are omitted with a warning.
   * @zh 原生 UTF-8 文本；无效码点会省略并发出警告。
   * @ja ネイティブ UTF-8 テキスト。不正なコードポイントは警告して除外します。
   * @ko 네이티브 UTF-8 텍스트이며 잘못된 코드포인트는 경고 후 생략합니다.
   */
  static toUTF8(characters: number | Uint32Array): string {
    return native.encodeCharacters(characters, false) as string;
  }

  /**
   * Read native LengthUTF8, which counts non-continuation bytes.
   *
   * @zh 读取原生 LengthUTF8，统计非续接字节数量。
   * @ja 継続バイト以外を数えるネイティブ LengthUTF8 を取得します。
   * @ko 연속 바이트 이외를 세는 네이티브 LengthUTF8을 읽습니다.
   * @param value - Text or byte view.
   * @zh value - 文本或字节视图。
   * @ja value - テキストまたはバイトビュー。
   * @ko value - 텍스트 또는 바이트 뷰입니다.
   * @returns Native codepoint count.
   * @zh 原生码点数量。
   * @ja ネイティブコードポイント数。
   * @ko 네이티브 코드포인트 수입니다.
   */
  static lengthUTF8(value: StringInput): number {
    return native.stringViewOperation(
      stringViewMapping(value).handle, 'length') as number;
  }

  /**
   * Resolve native SeekForwardUTF8 as a checked byte offset.
   *
   * @zh 将原生 SeekForwardUTF8 表达为经校验的字节偏移。
   * @ja ネイティブ SeekForwardUTF8 を検証したバイト位置で表します。
   * @ko 네이티브 SeekForwardUTF8을 검증한 바이트 오프셋으로 표현합니다.
   * @param value - UTF-8 byte view.
   * @zh value - UTF-8 字节视图。
   * @ja value - UTF-8 バイトビュー。
   * @ko value - UTF-8 바이트 뷰입니다.
   * @param offset - Position from zero through the byte end.
   * @zh offset - 从 0 到字节末尾的位置。
   * @ja offset - 0 からバイト末尾までの位置。
   * @ko offset - 0부터 바이트 끝까지의 위치입니다.
   * @returns First non-continuation position at or after offset.
   * @zh offset 处或之后的首个非续接字节位置。
   * @ja offset 以降の最初の非継続バイト位置。
   * @ko offset 이후의 첫 번째 비연속 바이트 위치입니다.
   */
  static seekForwardUTF8(value: StringInput, offset: number): number {
    return native.stringViewOperation(
      stringViewMapping(value).handle, 'forward', offset) as number;
  }

  /**
   * Resolve native SeekBackwardUTF8 as a safe numeric byte offset.
   *
   * @zh 将原生 SeekBackwardUTF8 表达为安全数值字节偏移。
   * @ja ネイティブ SeekBackwardUTF8 を安全な数値バイト位置で表します。
   * @ko 네이티브 SeekBackwardUTF8을 안전한 숫자 바이트 오프셋으로 표현합니다.
   * @param value - Nonempty UTF-8 byte view.
   * @zh value - 非空 UTF-8 字节视图。
   * @ja value - 空でない UTF-8 バイトビュー。
   * @ko value - 비어 있지 않은 UTF-8 바이트 뷰입니다.
   * @param offset - Dereferenceable byte offset.
   * @zh offset - 可解引用的字节偏移。
   * @ja offset - 参照可能なバイト位置。
   * @ko offset - 역참조 가능한 바이트 오프셋입니다.
   * @returns First preceding non-continuation position, or minus one.
   * @zh 向前找到的首个非续接字节位置，或 -1。
   * @ja 後方へ探した最初の非継続バイト位置または -1。
   * @ko 뒤로 찾은 첫 번째 비연속 바이트 위치 또는 -1입니다.
   */
  static seekBackwardUTF8(value: StringInput, offset: number): number {
    return native.stringViewOperation(
      stringViewMapping(value).handle, 'backward', offset) as number;
  }

  /**
   * Resolve native character-to-byte offsets using a cached native index.
   *
   * @zh 用原生缓存索引查询字符到字节偏移。
   * @ja ネイティブ索引で文字からバイト位置を求めます。
   * @ko 네이티브 인덱스로 문자에서 바이트 오프셋을 찾습니다.
   * @param value - Reuse a StringView to avoid rebuilding the index.
   * @zh value - 复用 StringView 可避免重建索引。
   * @ja value - StringView の再利用で索引の再構築を避けます。
   * @ko value - StringView를 재사용하면 인덱스 재생성을 피할 수 있습니다.
   * @param offset - Signed 32-bit codepoint offset, clamped to the view.
   * @zh offset - 有符号 32 位码点偏移，限制在视图范围内。
   * @ja offset - ビュー内に制限する符号付き 32 ビット文字位置。
   * @ko offset - 뷰 범위로 제한하는 부호 있는 32비트 코드포인트 오프셋입니다.
   * @returns Native byte offset.
   * @zh 原生字节偏移。
   * @ja ネイティブバイト位置。
   * @ko 네이티브 바이트 오프셋입니다.
   */
  static convertCharacterOffsetToByteOffset(
    value: StringInput, offset: number,
  ): number {
    return native.stringViewOperation(
      stringViewMapping(value).handle, 'toBytes', offset) as number;
  }

  /**
   * Resolve native byte-to-character offsets using a cached native index.
   *
   * @zh 用原生缓存索引查询字节到字符偏移。
   * @ja ネイティブ索引でバイトから文字位置を求めます。
   * @ko 네이티브 인덱스로 바이트에서 문자 오프셋을 찾습니다.
   * @param value - Reuse a StringView to avoid rebuilding the index.
   * @zh value - 复用 StringView 可避免重建索引。
   * @ja value - StringView の再利用で索引の再構築を避けます。
   * @ko value - StringView를 재사용하면 인덱스 재생성을 피할 수 있습니다.
   * @param offset - Signed 32-bit byte offset; interior bytes round forward.
   * @zh offset - 有符号 32 位字节偏移；字符内字节向后续字符边界取整。
   * @ja offset - 符号付き 32 ビットバイト位置。文字内では次の境界へ丸めます。
   * @ko offset - 부호 있는 32비트 바이트 오프셋이며 문자 내부는 다음 경계로 올립니다.
   * @returns Native codepoint offset, distinct from JavaScript UTF-16.
   * @zh 原生码点偏移，与 JavaScript UTF-16 位置不同。
   * @ja JavaScript UTF-16 位置とは異なるネイティブ文字位置。
   * @ko JavaScript UTF-16 위치와 다른 네이티브 코드포인트 오프셋입니다.
   */
  static convertByteOffsetToCharacterOffset(
    value: StringInput, offset: number,
  ): number {
    return native.stringViewOperation(
      stringViewMapping(value).handle, 'toCharacters', offset) as number;
  }

  /**
   * Convert a character-offset batch in one native call.
   *
   * @zh 一次原生调用转换一批字符偏移。
   * @ja 一回のネイティブ呼び出しで文字位置の一括変換を行います。
   * @ko 네이티브 호출 한 번으로 문자 오프셋 배치를 변환합니다.
   * @param value - Retained StringView with lazily cached boundaries.
   * @zh value - 惰性缓存边界的保活 StringView。
   * @ja value - 境界を遅延キャッシュする保持済み StringView。
   * @ko value - 경계를 지연 캐시하는 유지된 StringView입니다.
   * @param offsets - Fixed unshared input Int32Array.
   * @zh offsets - 固定且非共享的输入 Int32Array。
   * @ja offsets - 固定・非共有の入力 Int32Array。
   * @ko offsets - 고정된 비공유 입력 Int32Array입니다.
   * @param output - Same-sized reusable output, including overlapping input.
   * @zh output - 等长可复用输出，可与输入重叠；省略时创建独立原生快照。
   * @ja output - 入力と重複可能な同じ長さの再利用出力。省略時は独立コピーです。
   * @ko output - 입력과 겹칠 수 있는 같은 길이의 재사용 출력이며 생략하면 독립 복사본입니다.
   * @returns Supplied output, or an independently owned native snapshot.
   * @zh 传入的输出，或独立持有的原生快照。
   * @ja 指定した出力または独立所有のネイティブコピー。
   * @ko 지정한 출력 또는 독립 소유 네이티브 복사본입니다.
   */
  static convertCharacterOffsetsToByteOffsets(
    value: StringView, offsets: Int32Array, output?: Int32Array,
  ): Int32Array {
    const result = native.convertStringOffsets(
      stringViewMapping(value).handle, offsets, output, true);
    if (output === undefined) {
      markAsUntransferable(result.buffer);
    }

    return result;
  }

  /**
   * Convert a byte-offset batch in one native call.
   *
   * @zh 一次原生调用转换一批字节偏移。
   * @ja 一回のネイティブ呼び出しでバイト位置の一括変換を行います。
   * @ko 네이티브 호출 한 번으로 바이트 오프셋 배치를 변환합니다.
   * @param value - Retained StringView with lazily cached boundaries.
   * @zh value - 惰性缓存边界的保活 StringView。
   * @ja value - 境界を遅延キャッシュする保持済み StringView。
   * @ko value - 경계를 지연 캐시하는 유지된 StringView입니다.
   * @param offsets - Fixed unshared input Int32Array.
   * @zh offsets - 固定且非共享的输入 Int32Array。
   * @ja offsets - 固定・非共有の入力 Int32Array。
   * @ko offsets - 고정된 비공유 입력 Int32Array입니다.
   * @param output - Same-sized reusable output, including overlapping input.
   * @zh output - 等长可复用输出，可与输入重叠；省略时创建独立原生快照。
   * @ja output - 入力と重複可能な同じ長さの再利用出力。省略時は独立コピーです。
   * @ko output - 입력과 겹칠 수 있는 같은 길이의 재사용 출력이며 생략하면 독립 복사본입니다.
   * @returns Supplied output, or an independently owned native snapshot.
   * @zh 传入的输出，或独立持有的原生快照。
   * @ja 指定した出力または独立所有のネイティブコピー。
   * @ko 지정한 출력 또는 독립 소유 네이티브 복사본입니다.
   */
  static convertByteOffsetsToCharacterOffsets(
    value: StringView, offsets: Int32Array, output?: Int32Array,
  ): Int32Array {
    const result = native.convertStringOffsets(
      stringViewMapping(value).handle, offsets, output, false);
    if (output === undefined) {
      markAsUntransferable(result.buffer);
    }

    return result;
  }
}
