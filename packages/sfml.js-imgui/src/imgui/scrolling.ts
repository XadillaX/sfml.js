import { native } from '../internal/native';

/**
 * Get the horizontal scroll offset.
 *
 * @zh 获取水平滚动偏移量。
 * @ja 水平方向のスクロール位置を取得します。
 * @ko 가로 스크롤 오프셋을 가져옵니다.
 *
 * @remarks
 * - Any change of Scroll will be applied at the beginning of next frame in the
 *   first call to Begin().
 *
 * - You may instead use SetNextWindowScroll() prior to calling Begin() to avoid
 *   this delay, as an alternative to using SetScrollX()/SetScrollY().
 *
 * get scrolling amount [0 .. GetScrollMaxX()]
 * @zh
 * 窗口滚动：
 *
 * - Scroll 的任何更改将在下一帧开始时首次调用 Begin() 时应用。
 *
 * - 作为 SetScrollX()/SetScrollY() 的替代，可在 Begin() 之前使用 SetNextWindowScroll()
 *   来避免此延迟。获取滚动量 [0 .. GetScrollMaxX()]。
 * @ja
 * ウィンドウのスクロール：
 *
 * - Scroll の変更は次のフレームの最初の Begin() 呼び出しで適用されます。
 *
 * - SetScrollX()/SetScrollY() の代わりに Begin() 前に SetNextWindowScroll()
 *   を使えば、この遅延を避けられます。スクロール量 [0 .. GetScrollMaxX()] を取得します。
 * @ko
 * 창 스크롤:
 *
 * - Scroll 변경은 다음 프레임 시작 시 첫 Begin() 호출에서 적용됩니다.
 *
 * - SetScrollX()/SetScrollY() 대신 Begin() 전에 SetNextWindowScroll()을 사용하면 이 지연을
 *   피할 수 있습니다. 스크롤 양 [0 .. GetScrollMaxX()]를 가져옵니다.
 *
 * @returns Current scroll offset along the selected axis in pixels.
 * @zh 所选轴的当前滚动像素偏移。
 * @ja 対象軸の現在のスクロール量をピクセルで返します。
 * @ko 대상 축의 현재 스크롤 오프셋(픽셀)입니다.
 */
export function GetScrollX(): number {
  return native.GetScrollX();
}

/**
 * Get the vertical scroll offset.
 *
 * @zh 获取垂直滚动偏移量。
 * @ja 垂直方向のスクロール位置を取得します。
 * @ko 세로 스크롤 오프셋을 가져옵니다.
 *
 * @remarks
 * get scrolling amount [0 .. GetScrollMaxY()]
 * @zh
 * 获取滚动量 [0 .. GetScrollMaxY()]。
 * @ja
 * スクロール量 [0 .. GetScrollMaxY()] を取得します。
 * @ko
 * 스크롤 양 [0 .. GetScrollMaxY()]를 가져옵니다.
 *
 * @returns Current scroll offset along the selected axis in pixels.
 * @zh 所选轴的当前滚动像素偏移。
 * @ja 対象軸の現在のスクロール量をピクセルで返します。
 * @ko 대상 축의 현재 스크롤 오프셋(픽셀)입니다.
 */
export function GetScrollY(): number {
  return native.GetScrollY();
}

/**
 * Set the horizontal scroll offset.
 *
 * @zh 设置水平滚动偏移量。
 * @ja 水平方向のスクロール位置を設定します。
 * @ko 가로 스크롤 오프셋을 설정합니다.
 *
 * @remarks
 * set scrolling amount [0 .. GetScrollMaxX()]
 * @zh
 * 设置滚动量 [0 .. GetScrollMaxX()]。
 * @ja
 * スクロール量 [0 .. GetScrollMaxX()] を設定します。
 * @ko
 * 스크롤 양 [0 .. GetScrollMaxX()]를 설정합니다.
 *
 * @param scroll_x - Target scroll offset in pixels along the selected axis,
 * applied on the next frame.
 * @zh scroll_x - 所选轴的目标滚动像素偏移，在下一帧应用。
 * @ja scroll_x - 対象軸のスクロール先をピクセルで指定します。次のフレームで適用します。
 * @ko scroll_x - 대상 축의 목표 스크롤 오프셋(픽셀)이며 다음 프레임에 적용됩니다.
 */
export function SetScrollX(scroll_x: number): void {
  native.SetScrollX(scroll_x);
}

/**
 * Set the vertical scroll offset.
 *
 * @zh 设置垂直滚动偏移量。
 * @ja 垂直方向のスクロール位置を設定します。
 * @ko 세로 스크롤 오프셋을 설정합니다.
 *
 * @remarks
 * set scrolling amount [0 .. GetScrollMaxY()]
 * @zh
 * 设置滚动量 [0 .. GetScrollMaxY()]。
 * @ja
 * スクロール量 [0 .. GetScrollMaxY()] を設定します。
 * @ko
 * 스크롤 양 [0 .. GetScrollMaxY()]를 설정합니다.
 *
 * @param scroll_y - Target scroll offset in pixels along the selected axis,
 * applied on the next frame.
 * @zh scroll_y - 所选轴的目标滚动像素偏移，在下一帧应用。
 * @ja scroll_y - 対象軸のスクロール先をピクセルで指定します。次のフレームで適用します。
 * @ko scroll_y - 대상 축의 목표 스크롤 오프셋(픽셀)이며 다음 프레임에 적용됩니다.
 */
export function SetScrollY(scroll_y: number): void {
  native.SetScrollY(scroll_y);
}

/**
 * Get the maximum horizontal scroll offset.
 *
 * @zh 获取最大水平滚动偏移量。
 * @ja 水平方向の最大スクロール位置を取得します。
 * @ko 최대 가로 스크롤 오프셋을 가져옵니다.
 *
 * @remarks
 * get maximum scrolling amount ~~ ContentSize.x
 *
 * - WindowSize.x
 *
 * - DecorationsSize.x
 * @zh
 * 获取最大滚动量，约为 ContentSize.x
 *
 * - WindowSize.x
 *
 * - DecorationsSize.x。
 * @ja
 * 最大スクロール量を取得します。およそ ContentSize.x
 *
 * - WindowSize.x
 *
 * - DecorationsSize.x です。
 * @ko
 * 최대 스크롤 양을 가져옵니다. 대략 ContentSize.x
 *
 * - WindowSize.x
 *
 * - DecorationsSize.x입니다.
 *
 * @returns Maximum scroll offset along the selected axis in pixels.
 * @zh 所选轴的最大滚动像素偏移。
 * @ja 対象軸の最大スクロール量をピクセルで返します。
 * @ko 대상 축의 최대 스크롤 오프셋(픽셀)입니다.
 */
export function GetScrollMaxX(): number {
  return native.GetScrollMaxX();
}

/**
 * Get the maximum vertical scroll offset.
 *
 * @zh 获取最大垂直滚动偏移量。
 * @ja 垂直方向の最大スクロール位置を取得します。
 * @ko 최대 세로 스크롤 오프셋을 가져옵니다.
 *
 * @remarks
 * get maximum scrolling amount ~~ ContentSize.y
 *
 * - WindowSize.y
 *
 * - DecorationsSize.y
 * @zh
 * 获取最大滚动量，约为 ContentSize.y
 *
 * - WindowSize.y
 *
 * - DecorationsSize.y。
 * @ja
 * 最大スクロール量を取得します。およそ ContentSize.y
 *
 * - WindowSize.y
 *
 * - DecorationsSize.y です。
 * @ko
 * 최대 스크롤 양을 가져옵니다. 대략 ContentSize.y
 *
 * - WindowSize.y
 *
 * - DecorationsSize.y입니다.
 *
 * @returns Maximum scroll offset along the selected axis in pixels.
 * @zh 所选轴的最大滚动像素偏移。
 * @ja 対象軸の最大スクロール量をピクセルで返します。
 * @ko 대상 축의 최대 스크롤 오프셋(픽셀)입니다.
 */
export function GetScrollMaxY(): number {
  return native.GetScrollMaxY();
}

/**
 * Scroll horizontally to reveal the current cursor position.
 *
 * @zh 水平滚动以显示当前光标位置。
 * @ja 現在のカーソル位置が見えるように水平スクロールします。
 * @ko 현재 커서 위치가 보이도록 가로로 스크롤합니다.
 *
 * @remarks
 * adjust scrolling amount to make current cursor position visible.
 *
 * center_x_ratio=0.0: left, 0.5: center, 1.0: right.
 *
 * When using to make a "default/current item" visible, consider using
 * SetItemDefaultFocus() instead.
 * @zh
 * 调整滚动量使当前光标位置可见。
 *
 * center_x_ratio=0.0 表示左侧，0.5 表示中央，1.0 表示右侧。
 *
 * 若用于使“默认/当前项目”可见，请考虑改用 SetItemDefaultFocus()。
 * @ja
 * 現在のカーソル位置が見えるようにスクロール量を調整します。
 *
 * center_x_ratio=0.0 は左、0.5 は中央、1.0 は右です。
 *
 * 「既定／現在の項目」を表示させる用途なら SetItemDefaultFocus() の使用を検討してください。
 * @ko
 * 현재 커서 위치가 보이도록 스크롤 양을 조정합니다.
 *
 * center_x_ratio=0.0은 왼쪽, 0.5는 중앙, 1.0은 오른쪽입니다.
 *
 * '기본/현재 항목'을 보이게 하려는 경우 SetItemDefaultFocus()를 사용하는 것을 고려하세요.
 *
 * @param center_x_ratio - Alignment of the target in the visible region: 0 is
 * the leading edge, 0.5 the center, and 1 the trailing edge.
 * @zh center_x_ratio - 目标在可见区域内的对齐比例：0 为起始边，0.5 为居中，1 为末端边。
 * @ja center_x_ratio - 可視領域内の配置比率です。0 は先頭端、0.5 は中央、1 は末尾端です。
 * @ko center_x_ratio - 보이는 영역 내 정렬 비율입니다. 0은 시작 가장자리, 0.5는 중앙, 1은 끝 가장자리입니다.
 */
export function SetScrollHereX(center_x_ratio: number = 0.5): void {
  native.SetScrollHereX(center_x_ratio);
}

/**
 * Scroll vertically to reveal the current cursor position.
 *
 * @zh 垂直滚动以显示当前光标位置。
 * @ja 現在のカーソル位置が見えるように垂直スクロールします。
 * @ko 현재 커서 위치가 보이도록 세로로 스크롤합니다.
 *
 * @remarks
 * adjust scrolling amount to make current cursor position visible.
 *
 * center_y_ratio=0.0: top, 0.5: center, 1.0: bottom.
 *
 * When using to make a "default/current item" visible, consider using
 * SetItemDefaultFocus() instead.
 * @zh
 * 调整滚动量使当前光标位置可见。
 *
 * center_y_ratio=0.0 表示顶部，0.5 表示中央，1.0 表示底部。
 *
 * 若用于使“默认/当前项目”可见，请考虑改用 SetItemDefaultFocus()。
 * @ja
 * 現在のカーソル位置が見えるようにスクロール量を調整します。
 *
 * center_y_ratio=0.0 は上、0.5 は中央、1.0 は下です。
 *
 * 「既定／現在の項目」を表示させる用途なら SetItemDefaultFocus() の使用を検討してください。
 * @ko
 * 현재 커서 위치가 보이도록 스크롤 양을 조정합니다.
 *
 * center_y_ratio=0.0은 위, 0.5는 중앙, 1.0은 아래입니다.
 *
 * '기본/현재 항목'을 보이게 하려는 경우 SetItemDefaultFocus()를 사용하는 것을 고려하세요.
 *
 * @param center_y_ratio - Alignment of the target in the visible region: 0 is
 * the leading edge, 0.5 the center, and 1 the trailing edge.
 * @zh center_y_ratio - 目标在可见区域内的对齐比例：0 为起始边，0.5 为居中，1 为末端边。
 * @ja center_y_ratio - 可視領域内の配置比率です。0 は先頭端、0.5 は中央、1 は末尾端です。
 * @ko center_y_ratio - 보이는 영역 내 정렬 비율입니다. 0은 시작 가장자리, 0.5는 중앙, 1은 끝 가장자리입니다.
 */
export function SetScrollHereY(center_y_ratio: number = 0.5): void {
  native.SetScrollHereY(center_y_ratio);
}

/**
 * Scroll to reveal a position within the current window.
 *
 * @zh 滚动以显示当前窗口内的指定位置。
 * @ja 現在のウィンドウ内の指定位置が見えるようにスクロールします。
 * @ko 현재 창 안의 지정한 위치가 보이도록 스크롤합니다.
 *
 * @remarks
 * adjust scrolling amount to make given position visible.
 *
 * Generally GetCursorStartPos() + offset to compute a valid position.
 * @zh
 * 调整滚动量使给定位置可见。
 *
 * 通常使用 GetCursorStartPos() + offset 计算有效位置。
 * @ja
 * 指定位置が見えるようにスクロール量を調整します。
 *
 * 通常は GetCursorStartPos() + offset で有効な位置を計算します。
 * @ko
 * 주어진 위치가 보이도록 스크롤 양을 조정합니다.
 *
 * 일반적으로 GetCursorStartPos() + offset으로 유효한 위치를 계산합니다.
 *
 * @param local_x - Position in the current window-local coordinate space, in
 * pixels.
 * @zh local_x - 当前窗口局部坐标空间中的位置，单位为像素。
 * @ja local_x - 現在のウィンドウのローカル座標での位置です。単位はピクセルです。
 * @ko local_x - 현재 창의 로컬 좌표 위치이며 단위는 픽셀입니다.
 *
 * @param center_x_ratio - Alignment of the target in the visible region: 0 is
 * the leading edge, 0.5 the center, and 1 the trailing edge.
 * @zh center_x_ratio - 目标在可见区域内的对齐比例：0 为起始边，0.5 为居中，1 为末端边。
 * @ja center_x_ratio - 可視領域内の配置比率です。0 は先頭端、0.5 は中央、1 は末尾端です。
 * @ko center_x_ratio - 보이는 영역 내 정렬 비율입니다. 0은 시작 가장자리, 0.5는 중앙, 1은 끝 가장자리입니다.
 */
export function SetScrollFromPosX(
  local_x: number,
  center_x_ratio: number = 0.5,
): void {
  native.SetScrollFromPosX(local_x, center_x_ratio);
}

/**
 * Scroll to reveal a position within the current window.
 *
 * @zh 滚动以显示当前窗口内的指定位置。
 * @ja 現在のウィンドウ内の指定位置が見えるようにスクロールします。
 * @ko 현재 창 안의 지정한 위치가 보이도록 스크롤합니다.
 *
 * @remarks
 * adjust scrolling amount to make given position visible.
 *
 * Generally GetCursorStartPos() + offset to compute a valid position.
 * @zh
 * 调整滚动量使给定位置可见。
 *
 * 通常使用 GetCursorStartPos() + offset 计算有效位置。
 * @ja
 * 指定位置が見えるようにスクロール量を調整します。
 *
 * 通常は GetCursorStartPos() + offset で有効な位置を計算します。
 * @ko
 * 주어진 위치가 보이도록 스크롤 양을 조정합니다.
 *
 * 일반적으로 GetCursorStartPos() + offset으로 유효한 위치를 계산합니다.
 *
 * @param local_y - Position in the current window-local coordinate space, in
 * pixels.
 * @zh local_y - 当前窗口局部坐标空间中的位置，单位为像素。
 * @ja local_y - 現在のウィンドウのローカル座標での位置です。単位はピクセルです。
 * @ko local_y - 현재 창의 로컬 좌표 위치이며 단위는 픽셀입니다.
 *
 * @param center_y_ratio - Alignment of the target in the visible region: 0 is
 * the leading edge, 0.5 the center, and 1 the trailing edge.
 * @zh center_y_ratio - 目标在可见区域内的对齐比例：0 为起始边，0.5 为居中，1 为末端边。
 * @ja center_y_ratio - 可視領域内の配置比率です。0 は先頭端、0.5 は中央、1 は末尾端です。
 * @ko center_y_ratio - 보이는 영역 내 정렬 비율입니다. 0은 시작 가장자리, 0.5는 중앙, 1은 끝 가장자리입니다.
 */
export function SetScrollFromPosY(
  local_y: number,
  center_y_ratio: number = 0.5,
): void {
  native.SetScrollFromPosY(local_y, center_y_ratio);
}
