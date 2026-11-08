import { native } from '../internal/native';

/**
 * Test for a grapheme boundary before UTF-16 index position using SFML's
 * Unicode rules. The start and end are boundaries; the middle of a surrogate
 * pair is not. Isolated surrogate code units are treated as U+FFFD.
 * @zh 判断 UTF-16 索引 position 前是否为字素边界，使用 SFML 的 Unicode 规则。
 * 起点和末尾均为边界；代理对中间不是边界，孤立代理码元按 U+FFFD 处理。
 * @ja SFML の Unicode 規則で UTF-16 インデックス position の直前が書記素境界か
 * 判定する。先頭と末尾は境界で、サロゲートペアの途中は境界ではない。
 * 孤立したサロゲートコード単位は U+FFFD として扱う。
 * @ko SFML의 Unicode 규칙으로 UTF-16 인덱스 position 직전이 자소 경계인지
 * 판별한다. 시작과 끝은 경계이며 서로게이트 쌍 사이는 경계가 아니다.
 * 고립된 서로게이트 코드 단위는 U+FFFD로 처리한다.
 * @throws {RangeError} position is not an integer from 0 to text.length.
 * @zh position 不是 0～text.length 范围内的整数。
 * @ja position が 0～text.length の範囲内の整数ではない場合。
 * @ko position이 0～text.length 범위 내의 정수가 아닌 경우.
 */
export function isGraphemeBoundary(text: string, position: number): boolean {
  return native.isUnicodeBoundary(text, position, 0);
}

/**
 * Test for a word boundary before UTF-16 index position using SFML's Unicode
 * rules. The start and end are boundaries; the middle of a surrogate pair
 * is not. Isolated surrogate code units are treated as U+FFFD.
 * @zh 判断 UTF-16 索引 position 前是否为单词边界，使用 SFML 的 Unicode 规则。
 * 起点和末尾均为边界；代理对中间不是边界，孤立代理码元按 U+FFFD 处理。
 * @ja SFML の Unicode 規則で UTF-16 インデックス position の直前が単語境界か
 * 判定する。先頭と末尾は境界で、サロゲートペアの途中は境界ではない。
 * 孤立したサロゲートコード単位は U+FFFD として扱う。
 * @ko SFML의 Unicode 규칙으로 UTF-16 인덱스 position 직전이 단어 경계인지
 * 판별한다. 시작과 끝은 경계이며 서로게이트 쌍 사이는 경계가 아니다.
 * 고립된 서로게이트 코드 단위는 U+FFFD로 처리한다.
 * @throws {RangeError} position is not an integer from 0 to text.length.
 * @zh position 不是 0～text.length 范围内的整数。
 * @ja position が 0～text.length の範囲内の整数ではない場合。
 * @ko position이 0～text.length 범위 내의 정수가 아닌 경우.
 */
export function isWordBoundary(text: string, position: number): boolean {
  return native.isUnicodeBoundary(text, position, 1);
}

/**
 * Test for a sentence boundary before UTF-16 index position using SFML's
 * Unicode rules. The start and end are boundaries; the middle of a surrogate
 * pair is not. Isolated surrogate code units are treated as U+FFFD.
 * @zh 判断 UTF-16 索引 position 前是否为句子边界，使用 SFML 的 Unicode 规则。
 * 起点和末尾均为边界；代理对中间不是边界，孤立代理码元按 U+FFFD 处理。
 * @ja SFML の Unicode 規則で UTF-16 インデックス position の直前が文境界か
 * 判定する。先頭と末尾は境界で、サロゲートペアの途中は境界ではない。
 * 孤立したサロゲートコード単位は U+FFFD として扱う。
 * @ko SFML의 Unicode 규칙으로 UTF-16 인덱스 position 직전이 문장 경계인지
 * 판별한다. 시작과 끝은 경계이며 서로게이트 쌍 사이는 경계가 아니다.
 * 고립된 서로게이트 코드 단위는 U+FFFD로 처리한다.
 * @throws {RangeError} position is not an integer from 0 to text.length.
 * @zh position 不是 0～text.length 范围内的整数。
 * @ja position が 0～text.length の範囲内の整数ではない場合。
 * @ko position이 0～text.length 범위 내의 정수가 아닌 경우.
 */
export function isSentenceBoundary(text: string, position: number): boolean {
  return native.isUnicodeBoundary(text, position, 2);
}
