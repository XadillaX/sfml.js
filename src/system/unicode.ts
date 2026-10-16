import { native } from '../internal/native';

/**
 * 判断 UTF-16 索引 position 前是否为字素边界，使用 SFML 的 Unicode 规则。
 * 起点和末尾均为边界；代理对中间不是边界，孤立代理码元按 U+FFFD 处理。
 * @throws {RangeError} position 不是 0～text.length 范围内的整数。
 */
export function isGraphemeBoundary(text: string, position: number): boolean {
  return native.isUnicodeBoundary(text, position, 0);
}

/**
 * 判断 UTF-16 索引 position 前是否为单词边界，使用 SFML 的 Unicode 规则。
 * 起点和末尾均为边界；代理对中间不是边界，孤立代理码元按 U+FFFD 处理。
 * @throws {RangeError} position 不是 0～text.length 范围内的整数。
 */
export function isWordBoundary(text: string, position: number): boolean {
  return native.isUnicodeBoundary(text, position, 1);
}

/**
 * 判断 UTF-16 索引 position 前是否为句子边界，使用 SFML 的 Unicode 规则。
 * 起点和末尾均为边界；代理对中间不是边界，孤立代理码元按 U+FFFD 处理。
 * @throws {RangeError} position 不是 0～text.length 范围内的整数。
 */
export function isSentenceBoundary(text: string, position: number): boolean {
  return native.isUnicodeBoundary(text, position, 2);
}
