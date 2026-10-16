import { native } from '../internal/native';
import { graphicsNative } from '../internal/graphics-state';
import { Vector2i } from '../system/vector2';
import { Window } from './window';
import { unsigned } from './video-mode';

/**
 * 返回指定触点是否仍按下。
 * @deprecated 使用 TouchBegan 和 TouchEnded 事件。
 */
export function isDown(finger: number): boolean {
  unsigned(finger);
  return native.isTouchDown(finger);
}

/**
 * 返回触点像素位置；relativeTo 指定窗口客户区，否则相对于桌面。
 * @deprecated 使用触摸事件中的 position 字段。
 */
export function getPosition(finger: number, relativeTo?: Window): Vector2i {
  unsigned(finger);
  if (relativeTo !== undefined && !(relativeTo instanceof Window)) {
    throw new TypeError('Expected a Window');
  }
  return new Vector2i(...native.getTouchPosition(
    finger, relativeTo?.[graphicsNative]));
}
