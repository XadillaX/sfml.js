import { native } from '../internal/native';
import { KeyboardKey, KeyboardScancode } from './gen/constants';

export {
  KeyboardKey as Key, KeyboardScancode as Scan, KeyboardScancode as Scancode,
  KeyboardKeyCount as KeyCount, KeyboardScancodeCount as ScancodeCount,
} from './gen/constants';

/** 查询逻辑按键的实时按下状态，不依赖事件队列。 */
export function isKeyPressed(key: KeyboardKey): boolean;
/** 按物理扫描码查询实时按下状态，第二参数必须为 scancode。 */
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

/** 按当前键盘布局将物理扫描码转换为逻辑键码。 */
export function localize(code: KeyboardScancode): KeyboardKey {
  return native.localizeKey(code);
}

/** 按当前键盘布局将逻辑键码转换为物理扫描码。 */
export function delocalize(key: KeyboardKey): KeyboardScancode {
  return native.delocalizeKey(key);
}

/** 返回物理按键的用户可读名称。 */
export function getDescription(code: KeyboardScancode): string {
  return native.getKeyDescription(code);
}

/** 在支持的平台显示或隐藏屏幕键盘。 */
export function setVirtualKeyboardVisible(visible: boolean): void {
  native.setVirtualKeyboardVisible(visible);
}
