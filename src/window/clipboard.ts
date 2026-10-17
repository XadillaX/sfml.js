import { native } from '../internal/native';

/**
 * Return the system clipboard text, or an empty string if it contains no text.
 * @zh 返回系统剪贴板文本；没有文本时返回空字符串。
 * @ja システムクリップボードのテキストを返す。テキストがなければ空文字列を返す。
 * @ko 시스템 클립보드 텍스트를 반환한다. 텍스트가 없으면 빈 문자열을 반환한다.
 */
export function getString(): string {
  return native.getClipboardString();
}

/**
 * Replace the system clipboard text with text.
 * @zh 用 text 替换系统剪贴板文本。
 * @ja システムクリップボードのテキストを text に置き換える。
 * @ko 시스템 클립보드 텍스트를 text로 교체한다.
 */
export function setString(text: string): void {
  if (typeof text !== 'string') throw new TypeError('Expected clipboard text');
  native.setClipboardString(text);
}
