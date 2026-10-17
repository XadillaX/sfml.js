import { native } from '../internal/native';
import { graphicsNative } from '../internal/graphics-state';
import { Vector2i } from '../system/vector2';
import { Window } from './window';
import { unsigned } from './video-mode';

/**
 * Return whether the specified touch is still down.
 * @zh 返回指定触点是否仍按下。
 * @ja 指定したタッチがまだ押されているかどうかを返す。
 * @ko 지정한 터치가 아직 눌려 있는지 반환한다.
 * @deprecated Use TouchBegan and TouchEnded events.
 * @zh 使用 TouchBegan 和 TouchEnded 事件。
 * @ja TouchBegan と TouchEnded イベントを使う。
 * @ko TouchBegan 및 TouchEnded 이벤트를 사용한다.
 */
export function isDown(finger: number): boolean {
  unsigned(finger);
  return native.isTouchDown(finger);
}

/**
 * Return the touch's pixel position relative to the client area of relativeTo,
 * or to the desktop if omitted.
 * @zh 返回触点像素位置；relativeTo 指定窗口客户区，否则相对于桌面。
 * @ja relativeTo のクライアント領域を基準としたタッチのピクセル位置を返す。
 * 省略時はデスクトップ基準。
 * @ko relativeTo의 클라이언트 영역 기준 터치 픽셀 위치를 반환한다.
 * 생략하면 데스크톱 기준이다.
 * @deprecated Use the position field in touch events.
 * @zh 使用触摸事件中的 position 字段。
 * @ja タッチイベントの position フィールドを使う。
 * @ko 터치 이벤트의 position 필드를 사용한다.
 */
export function getPosition(finger: number, relativeTo?: Window): Vector2i {
  unsigned(finger);
  if (relativeTo !== undefined && !(relativeTo instanceof Window)) {
    throw new TypeError('Expected a Window');
  }
  return new Vector2i(...native.getTouchPosition(
    finger, relativeTo?.[graphicsNative]));
}
