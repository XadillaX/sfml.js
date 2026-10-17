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

/**
 * Query a mouse button's real-time pressed state.
 * @zh 查询鼠标按钮的实时按下状态。
 * @ja マウスボタンのリアルタイムの押下状態を確認する。
 * @ko 마우스 버튼의 실시간 눌림 상태를 조회한다.
 */
export function isButtonPressed(button: MouseButton): boolean {
  return native.isMouseButtonPressed(button);
}

/**
 * Return the mouse pixel position relative to the client area if a window
 * is provided, or to the desktop otherwise.
 * @zh 返回鼠标像素位置；提供窗口时相对于客户区，否则相对于桌面。
 * @ja マウスのピクセル位置を返す。ウィンドウを指定した場合はクライアント領域基準、
 * それ以外はデスクトップ基準。
 * @ko 마우스 픽셀 위치를 반환한다. 윈도우를 제공하면 클라이언트 영역 기준이며
 * 그렇지 않으면 데스크톱 기준이다.
 */
export function getPosition(relativeTo?: Window): Vector2i {
  return new Vector2i(...native.getMousePosition(windowHandle(relativeTo)));
}

/**
 * Move the mouse using client-area pixel coordinates if a window is provided,
 * or desktop pixel coordinates otherwise.
 * @zh 移动鼠标；提供窗口时使用客户区像素坐标，否则使用桌面像素坐标。
 * @ja マウスを移動する。ウィンドウを指定した場合はクライアント領域のピクセル座標、
 * それ以外はデスクトップのピクセル座標を使う。
 * @ko 마우스를 이동한다. 윈도우를 제공하면 클라이언트 영역 픽셀 좌표를 사용하며
 * 그렇지 않으면 데스크톱 픽셀 좌표를 사용한다.
 */
export function setPosition(
  position: Readonly<Vector2i>, relativeTo?: Window,
): void {
  if (!(position instanceof Vector2) || position.scalarType !== 'i32') {
    throw new TypeError('Expected a Vector2i');
  }
  native.setMousePosition(position.x, position.y, windowHandle(relativeTo));
}
