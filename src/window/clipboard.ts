import { native } from '../internal/native';

/** 返回系统剪贴板文本；没有文本时返回空字符串。 */
export function getString(): string {
  return native.getClipboardString();
}

/** 用 text 替换系统剪贴板文本。 */
export function setString(text: string): void {
  if (typeof text !== 'string') throw new TypeError('Expected clipboard text');
  native.setClipboardString(text);
}
