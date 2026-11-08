import { native } from '../internal/native';
import type { ImVec2Like, ImVec2Value } from '../types';

/**
 * Test whether a mouse button is held down.
 *
 * @zh 判断鼠标按钮是否处于按下状态。
 * @ja マウスボタンが押されているかを調べます。
 * @ko 마우스 버튼이 눌려 있는지 확인합니다.
 *
 * @remarks
 * - To refer to a mouse button, you may use named enums in your code e.g.
 *   ImGuiMouseButton.Left, ImGuiMouseButton.Right.
 *
 * - You can also use regular integer: it is forever guaranteed that 0=Left,
 *   1=Right, 2=Middle.
 *
 * - Dragging is reported only after the mouse moves far enough from the initial
 *   click (see lock_threshold and io.MouseDragThreshold, where io is the
 *   field view returned by ImGui.viewImGuiIO(ioHandle)).
 *
 * is mouse button held?
 * @zh
 * 输入工具：鼠标。
 *
 * - 可在代码中用具名枚举表示鼠标按钮，例如 ImGuiMouseButton.Left、ImGuiMouseButton.Right。
 *
 * - 也可使用普通整数：永久保证 0=左键、1=右键、2=中键。
 *
 * - 只有鼠标离开初始点击位置达到一定距离后才报告拖动操作（见 lock_threshold 和 io.MouseDragThreshold；
 *   io 是 ImGui.viewImGuiIO(ioHandle) 返回的字段视图）。鼠标按钮是否被按住？
 * @ja
 * 入力ユーティリティ：マウス。
 *
 * - ボタンは ImGuiMouseButton.Left、ImGuiMouseButton.Right などの名前付き列挙で指定できます。
 *
 * - 通常の整数も使え、0=左、1=右、2=中央は常に保証されます。
 *
 * - ドラッグは最初のクリック位置から一定距離移動した後にのみ報告されます（lock_threshold と io.MouseDragThreshold
 *   を参照。io は ImGui.viewImGuiIO(ioHandle) が返すフィールドビューです）。マウスボタンは押されたままですか？
 * @ko
 * 입력 유틸리티: 마우스.
 *
 * - 마우스 버튼은 ImGuiMouseButton.Left, ImGuiMouseButton.Right 같은 명명된 열거형으로 지정할 수
 *   있습니다.
 *
 * - 일반 정수도 사용할 수 있으며 0=왼쪽, 1=오른쪽, 2=가운데는 영구적으로 보장됩니다.
 *
 * - 드래그는 최초 클릭 위치에서 일정 거리 이상 이동한 뒤에만 보고됩니다(lock_threshold와
 *   io.MouseDragThreshold 참조).
 *   io는 ImGui.viewImGuiIO(ioHandle)이 반환하는 필드 뷰입니다. 마우스 버튼을 누르고 있습니까?
 *
 * @param button - ImGuiMouseButton index: 0 left, 1 right, 2 middle.
 * @zh button - ImGuiMouseButton 索引：0 左键、1 右键、2 中键。
 * @ja button - ImGuiMouseButton の番号です。0 は左、1 は右、2 は中央です。
 * @ko button - ImGuiMouseButton 인덱스입니다. 0은 왼쪽, 1은 오른쪽, 2는 가운데입니다.
 *
 * @returns True if the mouse button is currently held down; false otherwise.
 * @zh 鼠标按键当前被按住时为 true，否则为 false。
 * @ja マウスボタンが現在押されている場合は true、それ以外は false です。
 * @ko 마우스 버튼을 현재 누르고 있으면 true이며 아니면 false입니다.
 */
export function IsMouseDown(button: number): boolean {
  return native.IsMouseDown(button);
}

/**
 * Test whether a mouse button was newly pressed this frame, without repeating
 * while held.
 *
 * @zh 检查鼠标按钮是否在本帧刚被按下，按住时不重复触发。
 * @ja このフレームでマウスボタンが新たに押されたかを調べ、長押しでは繰り返しません。
 * @ko 이번 프레임에 마우스 버튼이 새로 눌렸는지 확인하며 누르고 있어도 반복하지 않습니다.
 *
 * @remarks
 * did mouse button clicked?
 *
 * (went from !Down to Down).
 *
 * Same as GetMouseClickedCount() == 1.
 *
 * Implied repeat = false
 * @zh
 * 鼠标按钮是否被点击（从 !Down 变为 Down）？
 *
 * 等同于 GetMouseClickedCount() == 1。
 *
 * 隐含参数：repeat = false。
 * @ja
 * マウスボタンがクリックされましたか（!Down から Down に変化）？
 *
 * GetMouseClickedCount() == 1 と同じです。
 *
 * 暗黙の引数：repeat = false。
 * @ko
 * 마우스 버튼이 클릭되었습니까(!Down에서 Down으로 변경)?
 *
 * GetMouseClickedCount() == 1과 같습니다.
 *
 * 암묵적 인수: repeat = false.
 *
 * @param button - ImGuiMouseButton index: 0 left, 1 right, 2 middle.
 * @zh button - ImGuiMouseButton 索引：0 左键、1 右键、2 中键。
 * @ja button - ImGuiMouseButton の番号です。0 は左、1 は右、2 は中央です。
 * @ko button - ImGuiMouseButton 인덱스입니다. 0은 왼쪽, 1은 오른쪽, 2는 가운데입니다.
 *
 * @returns True if the mouse button was pressed this frame, including repeat
 * events if requested; false otherwise.
 * @zh 本帧鼠标按键被按下，按要求包含重复事件时为 true，否则为 false。
 * @ja このフレームでマウスボタンを押した（指定時はリピートも含む）場合は true、それ以外は false です。
 * @ko 이번 프레임에 마우스 버튼을 눌렀으면(요청한 경우 반복 포함) true이며 아니면 false입니다.
 */
export function IsMouseClicked(button: number): boolean {
  return native.IsMouseClicked(button);
}

/**
 * Test whether a mouse button was clicked.
 *
 * @zh 判断鼠标按钮是否被点击。
 * @ja マウスボタンがクリックされたかを調べます。
 * @ko 마우스 버튼을 클릭했는지 확인합니다.
 *
 * @remarks
 * did mouse button clicked?
 *
 * (went from !Down to Down).
 *
 * Same as GetMouseClickedCount() == 1.
 * @zh
 * 鼠标按钮是否被点击（从 !Down 变为 Down）？
 *
 * 等同于 GetMouseClickedCount() == 1。
 * @ja
 * マウスボタンがクリックされましたか（!Down から Down に変化）？
 *
 * GetMouseClickedCount() == 1 と同じです。
 * @ko
 * 마우스 버튼이 클릭되었습니까(!Down에서 Down으로 변경)?
 *
 * GetMouseClickedCount() == 1과 같습니다.
 *
 * @param button - ImGuiMouseButton index: 0 left, 1 right, 2 middle.
 * @zh button - ImGuiMouseButton 索引：0 左键、1 右键、2 中键。
 * @ja button - ImGuiMouseButton の番号です。0 は左、1 は右、2 は中央です。
 * @ko button - ImGuiMouseButton 인덱스입니다. 0은 왼쪽, 1은 오른쪽, 2는 가운데입니다.
 *
 * @param repeat - Whether holding the key or button generates repeated
 * activations using ImGui repeat timing.
 * @zh repeat - 是否按照 ImGui 重复时序，在按住按键或按钮时产生重复激活。
 * @ja repeat - キーやボタンを押し続けたとき ImGui のリピート設定で繰り返し反応するかどうかです。
 * @ko repeat - 키나 버튼을 누르고 있을 때 ImGui 반복 시간 설정으로 반복 활성화할지 여부입니다.
 *
 * @returns True if the mouse button was pressed this frame, including repeat
 * events if requested; false otherwise.
 * @zh 本帧鼠标按键被按下，按要求包含重复事件时为 true，否则为 false。
 * @ja このフレームでマウスボタンを押した（指定時はリピートも含む）場合は true、それ以外は false です。
 * @ko 이번 프레임에 마우스 버튼을 눌렀으면(요청한 경우 반복 포함) true이며 아니면 false입니다.
 */
export function IsMouseClickedEx(
  button: number,
  repeat: boolean = false,
): boolean {
  return native.IsMouseClickedEx(button, repeat);
}

/**
 * Test whether a mouse button was released.
 *
 * @zh 判断鼠标按钮是否被释放。
 * @ja マウスボタンが離されたかを調べます。
 * @ko 마우스 버튼을 놓았는지 확인합니다.
 *
 * @remarks
 * did mouse button released?
 *
 * (went from Down to !Down)
 * @zh
 * 鼠标按钮是否被松开（从 Down 变为 !Down）？
 * @ja
 * マウスボタンが離されましたか（Down から !Down に変化）？
 * @ko
 * 마우스 버튼을 놓았습니까(Down에서 !Down으로 변경)?
 *
 * @param button - ImGuiMouseButton index: 0 left, 1 right, 2 middle.
 * @zh button - ImGuiMouseButton 索引：0 左键、1 右键、2 中键。
 * @ja button - ImGuiMouseButton の番号です。0 は左、1 は右、2 は中央です。
 * @ko button - ImGuiMouseButton 인덱스입니다. 0은 왼쪽, 1은 오른쪽, 2는 가운데입니다.
 *
 * @returns True if the mouse button was released this frame; false otherwise.
 * @zh 本帧鼠标按键被释放时为 true，否则为 false。
 * @ja このフレームでマウスボタンを離した場合は true、それ以外は false です。
 * @ko 이번 프레임에 마우스 버튼을 놓았으면 true이며 아니면 false입니다.
 */
export function IsMouseReleased(button: number): boolean {
  return native.IsMouseReleased(button);
}

/**
 * Test whether a mouse button was double-clicked.
 *
 * @zh 判断鼠标按钮是否被双击。
 * @ja マウスボタンがダブルクリックされたかを調べます。
 * @ko 마우스 버튼을 두 번 클릭했는지 확인합니다.
 *
 * @remarks
 * did mouse button double-clicked?
 *
 * Same as GetMouseClickedCount() == 2.
 *
 * (note that a double-click will also report IsMouseClicked() == true)
 * @zh
 * 鼠标按钮是否被双击？
 *
 * 等同于 GetMouseClickedCount() == 2。
 *
 * （注意双击也会报告 IsMouseClicked() == true。）
 * @ja
 * マウスボタンがダブルクリックされましたか？
 *
 * GetMouseClickedCount() == 2 と同じです（ダブルクリック時にも IsMouseClicked() == true
 * が報告されます）。
 * @ko
 * 마우스 버튼이 더블 클릭되었습니까?
 *
 * GetMouseClickedCount() == 2와 같습니다(더블 클릭 시에도 IsMouseClicked() == true가 보고됨).
 *
 * @param button - ImGuiMouseButton index: 0 left, 1 right, 2 middle.
 * @zh button - ImGuiMouseButton 索引：0 左键、1 右键、2 中键。
 * @ja button - ImGuiMouseButton の番号です。0 は左、1 は右、2 は中央です。
 * @ko button - ImGuiMouseButton 인덱스입니다. 0은 왼쪽, 1은 오른쪽, 2는 가운데입니다.
 *
 * @returns True if the mouse button generated a double-click this frame; false
 * otherwise.
 * @zh 本帧鼠标按键产生双击时为 true，否则为 false。
 * @ja このフレームでマウスボタンのダブルクリックが発生した場合は true、それ以外は false です。
 * @ko 이번 프레임에 마우스 버튼 더블 클릭이 발생하면 true이며 아니면 false입니다.
 */
export function IsMouseDoubleClicked(button: number): boolean {
  return native.IsMouseDoubleClicked(button);
}

/**
 * Test for a mouse-button release after a delay.
 *
 * @zh 延迟检测鼠标按钮释放事件。
 * @ja 遅延後のマウスボタンの解放を調べます。
 * @ko 지연 후 마우스 버튼 해제를 확인합니다.
 *
 * @remarks
 * delayed mouse release (use very sparingly!).
 *
 * Typically use delay >= io.MouseDoubleClickTime, where io is the field view
 * returned by ImGui.viewImGuiIO(ioHandle), and check the count for the same
 * button. For the left button, test
 * ImGui.viewImGuiIO(ioHandle).MouseClickedLastCount0 === 1.
 *
 * This is a very rarely used UI idiom, but some apps use this: e.g. MS Explorer
 * single click on an icon to rename.
 * @zh
 * 延迟鼠标释放（务必慎用！）。
 *
 * 通常设置 delay >= io.MouseDoubleClickTime，io 为 ImGui.viewImGuiIO(ioHandle)
 * 返回的字段视图，
 * 并检查同一按钮的点击次数。左键示例：ImGui.viewImGuiIO(ioHandle).MouseClickedLastCount0 === 1。
 *
 * 这是一种极少使用的 UI 交互方式，但部分应用会采用，例如 MS Explorer 中单击图标进行重命名。
 * @ja
 * 遅延したマウス解放（ごく限定的に使用してください！）。
 *
 * 通常は delay >= io.MouseDoubleClickTime とし、同じボタンのクリック回数も確認します。
 * io は ImGui.viewImGuiIO(ioHandle) が返すフィールドビューです。左ボタンなら
 * ImGui.viewImGuiIO(ioHandle).MouseClickedLastCount0 === 1 を判定します。
 *
 * 非常にまれな UI 操作形式ですが、MS Explorer でアイコンをシングルクリックして名前を変更するように、一部のアプリで使われます。
 * @ko
 * 지연된 마우스 놓기(매우 제한적으로 사용!).
 *
 * 보통 delay >= io.MouseDoubleClickTime으로 설정하고 같은 버튼의 클릭 횟수를 확인합니다.
 * io는 ImGui.viewImGuiIO(ioHandle)이 반환하는 필드 뷰입니다. 왼쪽 버튼은
 * ImGui.viewImGuiIO(ioHandle).MouseClickedLastCount0 === 1로 검사합니다.
 *
 * 매우 드문 UI 관용 패턴이지만 MS Explorer에서 아이콘을 한 번 클릭하여 이름을 바꾸는 경우처럼 일부 앱에서 사용합니다.
 *
 * @param button - ImGuiMouseButton index: 0 left, 1 right, 2 middle.
 * @zh button - ImGuiMouseButton 索引：0 左键、1 右键、2 中键。
 * @ja button - ImGuiMouseButton の番号です。0 は左、1 は右、2 は中央です。
 * @ko button - ImGuiMouseButton 인덱스입니다. 0은 왼쪽, 1은 오른쪽, 2는 가운데입니다.
 *
 * @param delay - Delay in seconds after mouse release before reporting the
 * delayed release.
 * @zh delay - 鼠标释放后报告延迟释放事件前的秒数。
 * @ja delay - マウスを離してから遅延リリースを報告するまでの秒数です。
 * @ko delay - 마우스를 놓은 후 지연 해제를 보고하기 전 시간(초)입니다.
 *
 * @returns True if the requested delay after the most recent mouse release has
 * elapsed this frame; false otherwise.
 * @zh 最近一次鼠标释放后要求的延迟在本帧到达时为 true，否则为 false。
 * @ja 直近のマウス解放から指定時間がこのフレームで経過した場合は true、それ以外は false です。
 * @ko 마지막 마우스 해제 후 요청한 지연 시간이 이번 프레임에 지나면 true이며 아니면 false입니다.
 */
export function IsMouseReleasedWithDelay(
  button: number,
  delay: number,
): boolean {
  return native.IsMouseReleasedWithDelay(button, delay);
}

/**
 * Get the successive click count for the current mouse click.
 *
 * @zh 获取当前鼠标点击的连续点击次数。
 * @ja 現在のマウスクリックの連続クリック回数を取得します。
 * @ko 현재 마우스 클릭의 연속 클릭 횟수를 가져옵니다.
 *
 * @remarks
 * return the number of successive mouse-clicks at the time where a click happen
 * (otherwise 0).
 * @zh
 * 在发生点击时返回连续鼠标点击次数，否则返回 0。
 * @ja
 * クリックが発生した時点で連続クリック数を返します。
 *
 * それ以外は 0 です。
 * @ko
 * 클릭이 발생한 시점에 연속 마우스 클릭 횟수를 반환하고 그 외에는 0을 반환합니다.
 *
 * @param button - ImGuiMouseButton index: 0 left, 1 right, 2 middle.
 * @zh button - ImGuiMouseButton 索引：0 左键、1 右键、2 中键。
 * @ja button - ImGuiMouseButton の番号です。0 は左、1 は右、2 は中央です。
 * @ko button - ImGuiMouseButton 인덱스입니다. 0은 왼쪽, 1은 오른쪽, 2는 가운데입니다.
 *
 * @returns Click count reported this frame: 0 for none, 1 for a single click, 2
 * for a double click, and so on.
 * @zh 本帧报告的点击次数：0 为无，1 为单击，2 为双击，依此类推。
 * @ja このフレームのクリック回数です。0 はなし、1 は単発、2 はダブルクリックです。
 * @ko 이번 프레임의 클릭 횟수입니다. 0은 없음, 1은 단일 클릭, 2는 더블 클릭입니다.
 */
export function GetMouseClickedCount(button: number): number {
  return native.GetMouseClickedCount(button);
}

/**
 * Test mouse overlap with a screen-space rectangle under current clipping,
 * ignoring window order.
 *
 * @zh 按当前裁剪区域检查鼠标是否位于屏幕坐标矩形内，忽略窗口层叠顺序。
 * @ja ウィンドウの重なり順を無視し、現在のクリップ範囲内で画面座標の矩形にマウスがあるか調べます。
 * @ko 창 순서를 무시하고 현재 클리핑 범위에서 마우스가 화면 좌표 사각형 안에 있는지 확인합니다.
 *
 * @remarks
 * is mouse hovering given bounding rect (in screen space).
 *
 * clipped by current clipping settings, but disregarding of other consideration
 * of focus/window ordering/popup-block.
 *
 * Implied clip = true
 * @zh
 * 鼠标是否悬停于指定包围矩形（屏幕坐标）？
 *
 * 受当前裁剪设置影响，但不考虑焦点、窗口顺序或弹出窗口阻挡等其他因素。
 *
 * 隐含参数：clip = true。
 * @ja
 * 指定した境界矩形（スクリーン座標）にマウスがホバーしていますか？
 *
 * 現在のクリッピング設定を適用しますが、フォーカス、ウィンドウ順序、ポップアップによる遮断などは考慮しません。
 *
 * 暗黙の引数：clip = true。
 * @ko
 * 마우스가 지정한 경계 사각형(화면 좌표) 위에 있습니까?
 *
 * 현재 클리핑 설정은 적용하지만 포커스, 창 순서, 팝업 차단 등은 고려하지 않습니다.
 *
 * 암묵적 인수: clip = true.
 *
 * @param r_min - Top-left corner of the rectangle in absolute screen
 * coordinates.
 * @zh r_min - 矩形左上角，使用绝对屏幕坐标。
 * @ja r_min - 矩形の左上を絶対スクリーン座標で指定します。
 * @ko r_min - 사각형 왼쪽 위의 절대 화면 좌표입니다.
 *
 * @param r_max - Bottom-right corner of the rectangle in absolute screen
 * coordinates.
 * @zh r_max - 矩形右下角，使用绝对屏幕坐标。
 * @ja r_max - 矩形の右下を絶対スクリーン座標で指定します。
 * @ko r_max - 사각형 오른쪽 아래의 절대 화면 좌표입니다.
 *
 * @returns True if the mouse lies inside the screen rectangle, optionally
 * intersected with the current clip rectangle; false otherwise.
 * @zh 鼠标位于屏幕矩形内，可选择与当前裁剪矩形求交时为 true，否则为 false。
 * @ja マウスがスクリーン矩形内にある（指定時は現在のクリップ矩形との共通領域）場合は true、それ以外は false です。
 * @ko 마우스가 화면 사각형 안에 있으면(선택 시 현재 클립 사각형과 교차) true이며 아니면 false입니다.
 */
export function IsMouseHoveringRect(
  r_min: ImVec2Like,
  r_max: ImVec2Like,
): boolean {
  return native.IsMouseHoveringRect(r_min, r_max);
}

/**
 * Test whether the mouse is inside a screen-space rectangle.
 *
 * @zh 判断鼠标是否位于指定屏幕矩形内。
 * @ja マウスが画面座標の矩形内にあるかを調べます。
 * @ko 마우스가 화면 좌표 사각형 안에 있는지 확인합니다.
 *
 * @remarks
 * is mouse hovering given bounding rect (in screen space).
 *
 * clipped by current clipping settings, but disregarding of other consideration
 * of focus/window ordering/popup-block.
 * @zh
 * 鼠标是否悬停于指定包围矩形（屏幕坐标）？
 *
 * 受当前裁剪设置影响，但不考虑焦点、窗口顺序或弹出窗口阻挡等其他因素。
 * @ja
 * 指定した境界矩形（スクリーン座標）にマウスがホバーしていますか？
 *
 * 現在のクリッピング設定を適用しますが、フォーカス、ウィンドウ順序、ポップアップによる遮断などは考慮しません。
 * @ko
 * 마우스가 지정한 경계 사각형(화면 좌표) 위에 있습니까?
 *
 * 현재 클리핑 설정은 적용하지만 포커스, 창 순서, 팝업 차단 등은 고려하지 않습니다.
 *
 * @param r_min - Top-left corner of the rectangle in absolute screen
 * coordinates.
 * @zh r_min - 矩形左上角，使用绝对屏幕坐标。
 * @ja r_min - 矩形の左上を絶対スクリーン座標で指定します。
 * @ko r_min - 사각형 왼쪽 위의 절대 화면 좌표입니다.
 *
 * @param r_max - Bottom-right corner of the rectangle in absolute screen
 * coordinates.
 * @zh r_max - 矩形右下角，使用绝对屏幕坐标。
 * @ja r_max - 矩形の右下を絶対スクリーン座標で指定します。
 * @ko r_max - 사각형 오른쪽 아래의 절대 화면 좌표입니다.
 *
 * @param clip - Whether to intersect the rectangle with the current clipping
 * rectangle.
 * @zh clip - 是否将矩形与当前裁剪矩形求交。
 * @ja clip - 現在のクリップ矩形との共通領域を使うかどうかです。
 * @ko clip - 현재 클리핑 사각형과의 교집합을 사용할지 여부입니다.
 *
 * @returns True if the mouse lies inside the screen rectangle, optionally
 * intersected with the current clip rectangle; false otherwise.
 * @zh 鼠标位于屏幕矩形内，可选择与当前裁剪矩形求交时为 true，否则为 false。
 * @ja マウスがスクリーン矩形内にある（指定時は現在のクリップ矩形との共通領域）場合は true、それ以外は false です。
 * @ko 마우스가 화면 사각형 안에 있으면(선택 시 현재 클립 사각형과 교차) true이며 아니면 false입니다.
 */
export function IsMouseHoveringRectEx(
  r_min: ImVec2Like,
  r_max: ImVec2Like,
  clip: boolean = true,
): boolean {
  return native.IsMouseHoveringRectEx(r_min, r_max, clip);
}

/**
 * Test whether a mouse position is valid.
 *
 * @zh 判断鼠标位置是否有效。
 * @ja マウス位置が有効かを調べます。
 * @ko 마우스 위치가 유효한지 확인합니다.
 *
 * @remarks
 * by convention we use (-3.4028234663852886e+38,-3.4028234663852886e+38) to
 * denote that there is no mouse
 * available
 * @zh
 * 约定使用 (-3.4028234663852886e+38,-3.4028234663852886e+38) 表示没有可用鼠标。
 * @ja
 * 慣例として (-3.4028234663852886e+38,-3.4028234663852886e+38) はマウスが利用できないことを表します。
 * @ko
 * 관례상 (-3.4028234663852886e+38,-3.4028234663852886e+38)는 사용 가능한 마우스가 없음을 나타냅니다.
 *
 * @param mouse_pos - Optional Float32Array [x,y] screen position to test; null
 * tests the current mouse position. Pass Float32Array storage, not a JS scalar;
 * native access uses the supplied backing memory.
 * @zh mouse_pos - 可选的 Float32Array [x,y] 屏幕位置；null 检查当前鼠标位置。 请传入 Float32Array
 * 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja mouse_pos - 検査する任意の Float32Array [x,y] スクリーン位置です。null は現在のマウス位置を調べます。 JS
 * スカラーではなく Float32Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko mouse_pos - 검사할 선택적 Float32Array [x,y] 화면 위치입니다. null이면 현재 마우스 위치를 검사합니다.
 * JS 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @returns True if the supplied or current mouse position is valid rather than
 * the unavailable-position sentinel; false otherwise.
 * @zh 指定或当前鼠标位置有效，而不是不可用位置哨兵值时为 true，否则为 false。
 * @ja 指定または現在のマウス位置が不明位置の特殊値ではなく有効な場合は true、それ以外は false です。
 * @ko 지정한 또는 현재 마우스 위치가 사용 불가 표시가 아닌 유효한 위치이면 true이며 아니면 false입니다.
 */
export function IsMousePosValid(
  mouse_pos: Float32Array | null = null,
): boolean {
  return native.IsMousePosValid(mouse_pos);
}

/**
 * Test whether any mouse button is held down.
 *
 * @zh 判断是否有鼠标按钮处于按下状态。
 * @ja いずれかのマウスボタンが押されているかを調べます。
 * @ko 마우스 버튼 중 하나라도 눌려 있는지 확인합니다.
 *
 * @remarks
 * [WILL OBSOLETE] is any mouse button held?
 *
 * This was designed for backends, but prefer having backend maintain a mask of
 * held mouse buttons, because upcoming input queue system will make this
 * invalid.
 * @zh
 * [将废弃] 是否有任意鼠标按钮被按住？
 *
 * 原为后端设计，但建议由后端维护已按住按钮的掩码，因为即将引入的输入队列系统会使此函数失效。
 * @ja
 * [廃止予定] いずれかのマウスボタンが押されていますか？
 *
 * バックエンド用でしたが、今後の入力キューシステムでは無効になるため、バックエンド側で押されているボタンのマスクを維持することを推奨します。
 * @ko
 * [폐기 예정] 누르고 있는 마우스 버튼이 있습니까?
 *
 * 백엔드용으로 설계되었지만 앞으로 도입할 입력 큐 시스템에서는 유효하지 않으므로 백엔드가 눌린 버튼 마스크를 유지하는 것이 좋습니다.
 *
 * @returns True if at least one mouse button is held down; false otherwise.
 * @zh 至少一个鼠标按键被按住时为 true，否则为 false。
 * @ja 少なくとも 1 つのマウスボタンが押されている場合は true、それ以外は false です。
 * @ko 마우스 버튼을 하나 이상 누르고 있으면 true이며 아니면 false입니다.
 */
export function IsAnyMouseDown(): boolean {
  return native.IsAnyMouseDown();
}

/**
 * Get the current mouse position.
 *
 * @zh 获取当前鼠标位置。
 * @ja 現在のマウス位置を取得します。
 * @ko 현재 마우스 위치를 가져옵니다.
 *
 * @remarks
 * Returns a copy of the current IO mouse coordinates. The corresponding
 * shared fields are `SFML.GetIO().mousePosX` and `SFML.GetIO().mousePosY`.
 * @zh
 * 返回当前 IO 鼠标坐标的副本。对应共享字段为 `SFML.GetIO().mousePosX` 和 `SFML.GetIO().mousePosY`。
 * @ja
 * 現在の IO マウス座標のコピーを返します。対応する共有フィールドは
 * `SFML.GetIO().mousePosX` と `SFML.GetIO().mousePosY` です。
 * @ko
 * 현재 IO 마우스 좌표의 복사본을 반환합니다. 대응하는 공유 필드는
 * `SFML.GetIO().mousePosX`와 `SFML.GetIO().mousePosY`입니다.
 *
 * @returns Current mouse position, copied as {x,y} in absolute screen
 * coordinates; not a writable native view.
 * @zh 当前鼠标位置的绝对屏幕坐标副本 {x,y}，不是原生可写视图。
 * @ja 現在のマウス位置を絶対スクリーン座標の {x,y} としてコピーします。書き込みビューではありません。
 * @ko 현재 마우스 위치의 절대 화면 좌표 복사본 {x,y}입니다. 네이티브 쓰기 뷰가 아닙니다.
 */
export function GetMousePos(): ImVec2Value {
  return native.GetMousePos();
}

/**
 * Get the mouse position when the current popup was opened.
 *
 * @zh 获取当前弹出窗口打开时的鼠标位置。
 * @ja 現在のポップアップを開いたときのマウス位置を取得します。
 * @ko 현재 팝업을 열었을 때의 마우스 위치를 가져옵니다.
 *
 * @remarks
 * retrieve mouse position at the time of opening popup we have BeginPopup()
 * into (helper to avoid user backing that value themselves)
 * @zh
 * 获取当前通过 BeginPopup() 进入的弹出窗口打开时的鼠标位置（避免用户自行保存该值的辅助函数）。
 * @ja
 * BeginPopup() で入ったポップアップが開いた時点のマウス位置を取得します（ユーザー自身でその値を保存する手間を省くヘルパー）。
 * @ko
 * BeginPopup()으로 진입한 팝업이 열릴 때의 마우스 위치를 가져옵니다(사용자가 직접 값을 저장하지 않도록 하는 헬퍼).
 *
 * @returns Mouse position when this popup opened, copied as {x,y} in absolute
 * screen coordinates; not a writable native view.
 * @zh 此弹窗打开时的鼠标位置的绝对屏幕坐标副本 {x,y}，不是原生可写视图。
 * @ja このポップアップを開いたときのマウス位置を絶対スクリーン座標の {x,y} としてコピーします。書き込みビューではありません。
 * @ko 이 팝업이 열렸을 때의 마우스 위치의 절대 화면 좌표 복사본 {x,y}입니다. 네이티브 쓰기 뷰가 아닙니다.
 */
export function GetMousePosOnOpeningCurrentPopup(): ImVec2Value {
  return native.GetMousePosOnOpeningCurrentPopup();
}

/**
 * Is mouse dragging?
 *
 * @zh 鼠标是否正在拖动？
 * @ja マウスはドラッグ中ですか？
 * @ko 마우스를 드래그하고 있습니까?
 *
 * @remarks
 * If lock_threshold < 0.0, use io.MouseDragThreshold, where io is the field
 * view returned by ImGui.viewImGuiIO(ioHandle).
 * @zh
 * lock_threshold < 0.0 时使用 io.MouseDragThreshold，io 是
 * ImGui.viewImGuiIO(ioHandle) 返回的字段视图。
 * @ja
 * lock_threshold < 0.0 なら io.MouseDragThreshold を使います。
 * io は ImGui.viewImGuiIO(ioHandle) が返すフィールドビューです。
 * @ko
 * lock_threshold < 0.0이면 io.MouseDragThreshold를 사용합니다.
 * io는 ImGui.viewImGuiIO(ioHandle)이 반환하는 필드 뷰입니다.
 *
 * @param button - ImGuiMouseButton index: 0 left, 1 right, 2 middle.
 * @zh button - ImGuiMouseButton 索引：0 左键、1 右键、2 中键。
 * @ja button - ImGuiMouseButton の番号です。0 は左、1 は右、2 は中央です。
 * @ko button - ImGuiMouseButton 인덱스입니다. 0은 왼쪽, 1은 오른쪽, 2는 가운데입니다.
 *
 * @param lock_threshold - Minimum drag distance in pixels before dragging is
 * recognized; -1 uses io.MouseDragThreshold.
 * @zh lock_threshold - 识别为拖动所需的最小像素距离；-1 使用 io.MouseDragThreshold。
 * @ja lock_threshold - ドラッグと認識する最小ピクセル距離です。-1 は io.MouseDragThreshold を使います。
 * @ko lock_threshold - 드래그로 인식할 최소 픽셀 거리입니다. -1은 io.MouseDragThreshold를 사용합니다.
 *
 * @returns True if the button is held and its drag distance passed the lock
 * threshold; false otherwise.
 * @zh 鼠标按键被按住且拖动距离超过锁定阈值时为 true，否则为 false。
 * @ja ボタンを押したままドラッグ距離が閾値を超えた場合は true、それ以外は false です。
 * @ko 버튼을 누른 상태에서 드래그 거리가 임계값을 넘으면 true이며 아니면 false입니다.
 */
export function IsMouseDragging(
  button: number,
  lock_threshold: number = -1.0,
): boolean {
  return native.IsMouseDragging(button, lock_threshold);
}

/**
 * Get the mouse displacement since dragging began.
 *
 * @zh 获取开始拖动以来的鼠标位移。
 * @ja ドラッグ開始からのマウスの移動量を取得します。
 * @ko 드래그 시작 이후의 마우스 이동량을 가져옵니다.
 *
 * @remarks
 * return the delta from the initial clicking position while the mouse button is
 * pressed or was just released.
 *
 * The result stays zero until the mouse passes the distance threshold at least
 * once. If lock_threshold < 0.0, use io.MouseDragThreshold, where io is the
 * field view returned by ImGui.viewImGuiIO(ioHandle).
 * @zh
 * 鼠标按钮被按住或刚松开时，返回相对于初始点击位置的位移。
 *
 * 在鼠标至少一次超过距离阈值之前，返回值保持为零。lock_threshold < 0.0 时使用 io.MouseDragThreshold，
 * io 是 ImGui.viewImGuiIO(ioHandle) 返回的字段视图。
 * @ja
 * マウスボタンを押している間、または離した直後に、最初のクリック位置からの移動量を返します。
 *
 * 距離のしきい値を一度超えるまではゼロを返します。lock_threshold < 0.0 なら io.MouseDragThreshold を使います。
 * io は ImGui.viewImGuiIO(ioHandle) が返すフィールドビューです。
 * @ko
 * 마우스 버튼을 누르고 있거나 방금 놓았을 때 최초 클릭 위치로부터의 변위를 반환합니다.
 *
 * 마우스가 거리 임계값을 한 번 이상 넘기 전에는 0을 반환합니다. lock_threshold < 0.0이면
 * io.MouseDragThreshold를 사용합니다.
 * io는 ImGui.viewImGuiIO(ioHandle)이 반환하는 필드 뷰입니다.
 *
 * @param button - ImGuiMouseButton index: 0 left, 1 right, 2 middle.
 * @zh button - ImGuiMouseButton 索引：0 左键、1 右键、2 中键。
 * @ja button - ImGuiMouseButton の番号です。0 は左、1 は右、2 は中央です。
 * @ko button - ImGuiMouseButton 인덱스입니다. 0은 왼쪽, 1은 오른쪽, 2는 가운데입니다.
 *
 * @param lock_threshold - Minimum drag distance in pixels before dragging is
 * recognized; -1 uses io.MouseDragThreshold.
 * @zh lock_threshold - 识别为拖动所需的最小像素距离；-1 使用 io.MouseDragThreshold。
 * @ja lock_threshold - ドラッグと認識する最小ピクセル距離です。-1 は io.MouseDragThreshold を使います。
 * @ko lock_threshold - 드래그로 인식할 최소 픽셀 거리입니다. -1은 io.MouseDragThreshold를 사용합니다.
 *
 * @returns Copied {x: dx, y: dy} screen-pixel displacement from the drag start;
 * zero until the drag threshold is passed.
 * @zh 相对拖动起点的 {x: dx, y: dy} 屏幕像素位移副本；越过拖动阈值前为零。
 * @ja ドラッグ開始からの {x: dx, y: dy} ピクセル差分のコピーです。閾値を超えるまではゼロです。
 * @ko 드래그 시작점 기준 {x: dx, y: dy} 화면 픽셀 변위 복사본입니다. 임계값을 넘기 전에는 0입니다.
 */
export function GetMouseDragDelta(
  button: number = 0,
  lock_threshold: number = -1.0,
): ImVec2Value {
  return native.GetMouseDragDelta(button, lock_threshold);
}

/**
 * Reset the mouse drag origin to the current pointer position.
 *
 * @zh 将鼠标拖动起点重置为当前指针位置。
 * @ja マウスのドラッグ開始位置を現在のポインター位置にリセットします。
 * @ko 마우스 드래그 시작점을 현재 포인터 위치로 재설정합니다.
 *
 * @remarks
 * Implied button = 0
 * @zh
 * 隐含参数：button = 0。
 * @ja
 * 暗黙の引数：button = 0。
 * @ko
 * 암묵적 인수: button = 0.
 */
export function ResetMouseDragDelta(): void {
  native.ResetMouseDragDelta();
}

/**
 * Reset the mouse drag origin to the current pointer position.
 *
 * @zh 将鼠标拖动起点重置为当前指针位置。
 * @ja マウスのドラッグ開始位置を現在のポインター位置にリセットします。
 * @ko 마우스 드래그 시작점을 현재 포인터 위치로 재설정합니다.
 *
 * @param button - ImGuiMouseButton index: 0 left, 1 right, 2 middle.
 * @zh button - ImGuiMouseButton 索引：0 左键、1 右键、2 中键。
 * @ja button - ImGuiMouseButton の番号です。0 は左、1 は右、2 は中央です。
 * @ko button - ImGuiMouseButton 인덱스입니다. 0은 왼쪽, 1은 오른쪽, 2는 가운데입니다.
 */
export function ResetMouseDragDeltaEx(button: number = 0): void {
  native.ResetMouseDragDeltaEx(button);
}

/**
 * Get desired mouse cursor shape.
 *
 * @zh 获取期望的鼠标光标形状。
 * @ja 要求されたマウスカーソル形状を取得します。
 * @ko 원하는 마우스 커서 모양을 가져옵니다.
 *
 * @remarks
 * Important: reset in `ImGui.NewFrame()`, this is updated during the frame.
 *
 * valid before Render().
 *
 * If you use software rendering by setting io.MouseDrawCursor ImGui will render
 * those for you
 * @zh
 * 重要：在 `ImGui.NewFrame()` 中重置，并在帧内更新；在 Render() 前有效。
 *
 * 如果设置 io.MouseDrawCursor 使用软件绘制，ImGui 会为你绘制光标。
 * @ja
 * 重要：`ImGui.NewFrame()` でリセットされ、フレーム中に更新されます。
 *
 * Render() 前に有効です。
 *
 * io.MouseDrawCursor を設定してソフトウェア描画を使う場合、ImGui がカーソルを描画します。
 * @ko
 * 중요: `ImGui.NewFrame()`에서 초기화되고 프레임 중 갱신됩니다.
 *
 * Render() 전에 유효합니다.
 *
 * io.MouseDrawCursor를 설정해 소프트웨어 렌더링을 사용하면 ImGui가 커서를 그려 줍니다.
 *
 * @returns Requested ImGuiMouseCursor shape for the platform backend to
 * display.
 * @zh 请求平台后端显示的 ImGuiMouseCursor 形状。
 * @ja プラットフォームに表示を要求している ImGuiMouseCursor の形です。
 * @ko 플랫폼 백엔드에 표시를 요청한 ImGuiMouseCursor 모양입니다.
 */
export function GetMouseCursor(): number {
  return native.GetMouseCursor();
}

/**
 * Set desired mouse cursor shape.
 *
 * @zh 设置期望的鼠标光标形状。
 * @ja 要求するマウスカーソル形状を設定します。
 * @ko 원하는 마우스 커서 모양을 설정합니다.
 *
 * @param cursor_type - ImGuiMouseCursor shape requested from the platform
 * backend.
 * @zh cursor_type - 向平台后端请求的 ImGuiMouseCursor 形状。
 * @ja cursor_type - プラットフォームバックエンドに要求する ImGuiMouseCursor の形状です。
 * @ko cursor_type - 플랫폼 백엔드에 요청할 ImGuiMouseCursor 모양입니다.
 */
export function SetMouseCursor(cursor_type: number): void {
  native.SetMouseCursor(cursor_type);
}

/**
 * Override mouse input capture for the next frame.
 *
 * @zh 覆盖下一帧的鼠标输入捕获状态。
 * @ja 次のフレームのマウス入力キャプチャを上書きします。
 * @ko 다음 프레임의 마우스 입력 캡처 상태를 재정의합니다.
 *
 * @remarks
 * Override io.WantCaptureMouse flag next frame (said flag is left for your
 * application to handle, typical when true it instucts your app to ignore
 * inputs).
 *
 * This is equivalent to setting "io.WantCaptureMouse = want_capture_mouse;"
 * after the next NewFrame() call.
 * @zh
 * 覆盖下一帧的 io.WantCaptureMouse 标志（此标志由应用处理，通常为 true 时指示应用忽略输入）。
 *
 * 这等同于在下一次 NewFrame() 调用后设置 "io.WantCaptureMouse = want_capture_mouse;"。
 * @ja
 * 次のフレームの io.WantCaptureMouse フラグを上書きします（このフラグはアプリケーション側で処理し、通常 true
 * なら入力を無視させます）。
 *
 * 次の NewFrame() 呼び出し後に "io.WantCaptureMouse = want_capture_mouse;" を設定するのと同等です。
 * @ko
 * 다음 프레임의 io.WantCaptureMouse 플래그를 재정의합니다(이 플래그는 응용 프로그램이 처리하며 보통 true이면 입력을
 * 무시하도록 지시).
 *
 * 다음 NewFrame() 호출 후 "io.WantCaptureMouse = want_capture_mouse;"를 설정하는 것과 같습니다.
 *
 * @param want_capture_mouse - Override io.WantCaptureMouse on the next frame;
 * this does not itself consume OS events.
 * @zh want_capture_mouse - 覆盖下一帧的 io.WantCaptureMouse 标志；本身不消费操作系统事件。
 * @ja want_capture_mouse - 次フレームの io.WantCaptureMouse フラグを上書きします。OS
 * イベント自体は消費しません。
 * @ko want_capture_mouse - 다음 프레임의 io.WantCaptureMouse 플래그를 재정의합니다. OS 이벤트 자체를
 * 소비하지는 않습니다.
 */
export function SetNextFrameWantCaptureMouse(
  want_capture_mouse: boolean,
): void {
  native.SetNextFrameWantCaptureMouse(want_capture_mouse);
}
