import { native } from '../internal/native';

/**
 * Managed result of Rml::FormatString, with its native byte length.
 *
 * @zh Rml::FormatString 的托管结果，保留原生字节长度。
 * @ja ネイティブバイト長を保持する Rml::FormatString の管理結果。
 * @ko 네이티브 바이트 길이를 유지하는 Rml::FormatString의 관리 결과입니다.
 */
export interface FormattedString {
  /**
   * Formatted text following the native short/long NUL-buffer contract.
   *
   * @zh 遵循原生短、长 NUL 缓冲区契约的格式化文本。
   * @ja ネイティブの短・長 NUL バッファ契約に従う整形済みテキスト。
   * @ko 네이티브 짧은/긴 NUL 버퍼 계약을 따르는 형식화된 텍스트입니다.
   */
  value: string;

  /**
   * Native UTF-8 output length, before any short-buffer NUL truncation.
   *
   * @zh 原生 UTF-8 输出长度，在短缓冲区 NUL 截断之前计数。
   * @ja 短バッファ NUL 切り捨て前のネイティブ UTF-8 出力長。
   * @ko 짧은 버퍼 NUL 절단 전 네이티브 UTF-8 출력 길이입니다.
   */
  length: number;
}

/**
 * Format typed arguments through the real native Rml::FormatString.
 *
 * @zh 用实际原生 Rml::FormatString 格式化有类型的参数。
 * @ja 実際のネイティブ Rml::FormatString で型付き引数を整形します。
 * @ko 실제 네이티브 Rml::FormatString으로 형식이 있는 인수를 포맷합니다.
 * @param format - printf format with scalar integer, float, char and string
 * conversions, flags, width and precision; dynamic "*" consumes an integer.
 * @zh format - printf 整数、浮点、字符或字符串格式，支持标志、宽度和精度；
 * 动态「*」消耗一个整数参数。
 * @ja format - 整数・浮動小数・文字・文字列の printf 書式。動的「*」は整数を消費します。
 * @ko format - 정수, 실수, 문자 및 문자열 printf 형식이며 동적「*」는 정수를 소비합니다.
 * @param values - Signed/unsigned 32-bit integers, finite doubles or strings.
 * @zh values - 有符号或无符号 32 位整数、有限双精度数或字符串。
 * @ja values - 符号付き・符号なし 32 ビット整数、有限の倍精度数または文字列。
 * @ko values - 부호 있는/없는 32비트 정수, 유한한 배정밀도 수 또는 문자열입니다.
 * @returns Text and native byte length from one native entry.
 * @zh 一次原生调用返回文本及原生字节长度。
 * @ja 一回の呼び出しで返すテキストとネイティブバイト長。
 * @ko 네이티브 호출 한 번으로 반환하는 텍스트와 네이티브 바이트 길이입니다.
 * @remarks
 * Raw C ABI pointer, length-modified and positional formats are rejected.
 * Each width, precision and the complete UTF-8 output are limited to one
 * million bytes. Output under 256 bytes truncates at NUL as native RmlUi does.
 * @zh 拒绝 C ABI 指针、长度修饰符和位置参数。宽度、精度及总 UTF-8 输出上限均为
 * 一百万；少于 256 字节的输出按原生行为在 NUL 处截断。
 * @ja C ABI ポインター・長さ修飾・位置指定は拒否します。幅・精度・全出力は百万まで。
 * 256 バイト未満の出力はネイティブ規則で NUL に切り詰めます。
 * @ko C ABI 포인터, 길이 수정자와 위치 지정은 거부합니다. 너비, 정밀도와 전체 출력은
 * 백만까지이며 256바이트 미만 출력은 네이티브 규칙으로 NUL에서 잘립니다.
 */
export function formatString(
  format: string, ...values: readonly (number | string)[]
): FormattedString {
  return native.formatTypedString(format, values);
}

/**
 * Managed Rml::CreateString using the checked native formatting path.
 *
 * @zh 经校验的原生格式化路径提供托管 Rml::CreateString。
 * @ja 検証したネイティブ整形経路による管理 Rml::CreateString。
 * @ko 검증한 네이티브 포맷 경로를 사용하는 관리형 Rml::CreateString입니다.
 * @param format - Same typed printf contract as {@link formatString}.
 * @zh format - 与 {@link formatString} 相同的有类型 printf 契约。
 * @ja format - {@link formatString} と同じ型付き printf 契約。
 * @ko format - {@link formatString}과 동일한 형식이 있는 printf 계약입니다.
 * @param values - Typed scalar formatting values.
 * @zh values - 有类型的标量格式化值。
 * @ja values - 型付きスカラーの整形値。
 * @ko values - 형식이 있는 스칼라 포맷 값입니다.
 * @returns Formatted native text.
 * @zh 格式化后的原生文本。
 * @ja 整形済みネイティブテキスト。
 * @ko 포맷된 네이티브 텍스트입니다.
 */
export function createString(
  format: string, ...values: readonly (number | string)[]
): string {
  return formatString(format, ...values).value;
}
