import { native } from '../internal/native';
import { KeyboardKey, KeyboardScancode } from './gen/constants';

export {
  KeyboardKey as Key, KeyboardScancode as Scan, KeyboardScancode as Scancode,
  KeyboardKeyCount as KeyCount, KeyboardScancodeCount as ScancodeCount,
} from './gen/constants';

/**
 * Query a logical key's real-time pressed state, independent of the event
 * queue.
 * @zh 查询逻辑按键的实时按下状态，不依赖事件队列。
 * @ja イベントキューに依存せず、論理キーのリアルタイムの押下状態を確認する。
 * @ko 이벤트 큐와 무관하게 논리 키의 실시간 눌림 상태를 조회한다.
 */
export function isKeyPressed(key: KeyboardKey): boolean;
/**
 * Query the real-time pressed state by physical scancode; the second argument
 * must be scancode.
 * @zh 按物理扫描码查询实时按下状态，第二参数必须为 scancode。
 * @ja 物理スキャンコードでリアルタイムの押下状態を確認する。
 * 第 2 引数は scancode でなければならない。
 * @ko 물리 스캔 코드로 실시간 눌림 상태를 조회한다.
 * 두 번째 인수는 scancode여야 한다.
 */
export function isKeyPressed(
  code: KeyboardScancode, type: 'scancode',
): boolean;
export function isKeyPressed(
  code: KeyboardKey | KeyboardScancode, type?: 'scancode',
): boolean {
  if (type !== undefined && type !== 'scancode') {
    throw new TypeError('Expected scancode as the key type');
  }
  return native.isKeyPressed(code, type === 'scancode');
}

/**
 * Convert a physical scancode to a logical key code using the current
 * keyboard layout.
 * @zh 按当前键盘布局将物理扫描码转换为逻辑键码。
 * @ja 現在のキーボード配列に基づき、物理スキャンコードを論理キーコードに変換する。
 * @ko 현재 키보드 레이아웃에 따라 물리 스캔 코드를 논리 키 코드로 변환한다.
 */
export function localize(code: KeyboardScancode): KeyboardKey {
  return native.localizeKey(code);
}

/**
 * Convert a logical key code to a physical scancode using the current
 * keyboard layout.
 * @zh 按当前键盘布局将逻辑键码转换为物理扫描码。
 * @ja 現在のキーボード配列に基づき、論理キーコードを物理スキャンコードに変換する。
 * @ko 현재 키보드 레이아웃에 따라 논리 키 코드를 물리 스캔 코드로 변환한다.
 */
export function delocalize(key: KeyboardKey): KeyboardScancode {
  return native.delocalizeKey(key);
}

/**
 * Return a human-readable name for the physical key.
 * @zh 返回物理按键的用户可读名称。
 * @ja 物理キーのユーザー向けの読みやすい名前を返す。
 * @ko 물리 키의 사용자가 읽을 수 있는 이름을 반환한다.
 */
export function getDescription(code: KeyboardScancode): string {
  return native.getKeyDescription(code);
}

/**
 * Show or hide the on-screen keyboard on supported platforms.
 * @zh 在支持的平台显示或隐藏屏幕键盘。
 * @ja 対応プラットフォームでスクリーンキーボードを表示または非表示にする。
 * @ko 지원하는 플랫폼에서 화면 키보드를 표시하거나 숨긴다.
 */
export function setVirtualKeyboardVisible(visible: boolean): void {
  native.setVirtualKeyboardVisible(visible);
}
