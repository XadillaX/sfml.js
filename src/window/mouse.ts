import { native, type NativeGraphicsHandle } from '../internal/native';
import { graphicsNative } from '../internal/graphics-state';
import { Vector2, Vector2i } from '../system/vector2';
import { Window } from './window';
import type { MouseButton } from './gen/constants';

export {
  MouseButton as Button, MouseWheel as Wheel, MouseButtonCount as ButtonCount,
} from './gen/constants';

function windowHandle(
  window?: Window,
): NativeGraphicsHandle<'window'> | undefined {
  if (window === undefined) return undefined;
  if (!(window instanceof Window)) throw new TypeError('Expected a Window');
  return window[graphicsNative];
}

/** 查询鼠标按钮的实时按下状态。 */
export function isButtonPressed(button: MouseButton): boolean {
  return native.isMouseButtonPressed(button);
}

/** 返回鼠标像素位置；提供窗口时相对于客户区，否则相对于桌面。 */
export function getPosition(relativeTo?: Window): Vector2i {
  return new Vector2i(...native.getMousePosition(windowHandle(relativeTo)));
}

/** 移动鼠标；提供窗口时使用客户区像素坐标，否则使用桌面像素坐标。 */
export function setPosition(
  position: Readonly<Vector2i>, relativeTo?: Window,
): void {
  if (!(position instanceof Vector2) || position.scalarType !== 'i32') {
    throw new TypeError('Expected a Vector2i');
  }
  native.setMousePosition(position.x, position.y, windowHandle(relativeTo));
}
