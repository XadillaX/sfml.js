import { native } from '../internal/native';
import type { ImVec2Like, ImDrawList, ImDrawListSharedData } from '../types';

/**
 * Get the draw list rendered behind interface content.
 *
 * @zh 获取在界面内容后方绘制的绘制列表。
 * @ja インターフェイスの背後に描画される描画リストを取得します。
 * @ko 인터페이스 콘텐츠 뒤에 렌더링되는 그리기 목록을 가져옵니다.
 *
 * @remarks
 * this draw list will be the first rendered one.
 *
 * Useful to quickly draw shapes/text behind dear imgui contents.
 * @zh
 * 背景/前景绘制列表。
 *
 * 此绘制列表最先渲染，便于在 dear imgui 内容后方快速绘制图形/文本。
 * @ja
 * 背景/前景の描画リスト。
 *
 * この描画リストは最初に描画され、dear imgui の内容の背後に図形/テキストを手早く描くのに便利です。
 * @ko
 * 배경/전경 그리기 목록.
 *
 * 이 목록은 가장 먼저 렌더링되며 dear imgui 콘텐츠 뒤에 도형/텍스트를 빠르게 그릴 때 유용합니다.
 *
 * @returns Borrowed viewport draw-list handle for rendering behind/in front of
 * normal windows, using screen coordinates.
 * @zh 在普通窗口后方或前方绘制的视口借用绘制列表句柄，使用屏幕坐标。
 * @ja 通常のウィンドウの背後または手前に描く借用リストです。スクリーン座標を使います。
 * @ko 일반 창 뒤 또는 앞에 그리는 뷰포트의 빌린 목록 핸들입니다. 화면 좌표를 사용합니다.
 */
export function GetBackgroundDrawList(): ImDrawList | null {
  return native.GetBackgroundDrawList();
}

/**
 * Get the draw list rendered over interface content.
 *
 * @zh 获取在界面内容上方绘制的绘制列表。
 * @ja インターフェイスの手前に描画される描画リストを取得します。
 * @ko 인터페이스 콘텐츠 위에 렌더링되는 그리기 목록을 가져옵니다.
 *
 * @remarks
 * this draw list will be the last rendered one.
 *
 * Useful to quickly draw shapes/text over dear imgui contents.
 * @zh
 * 此绘制列表最后渲染，便于在 dear imgui 内容上方快速绘制图形/文本。
 * @ja
 * この描画リストは最後に描画され、dear imgui の内容の上に図形/テキストを手早く描くのに便利です。
 * @ko
 * 이 그리기 목록은 마지막에 렌더링되며 dear imgui 콘텐츠 위에 도형/텍스트를 빠르게 그릴 때 유용합니다.
 *
 * @returns Borrowed viewport draw-list handle for rendering behind/in front of
 * normal windows, using screen coordinates.
 * @zh 在普通窗口后方或前方绘制的视口借用绘制列表句柄，使用屏幕坐标。
 * @ja 通常のウィンドウの背後または手前に描く借用リストです。スクリーン座標を使います。
 * @ko 일반 창 뒤 또는 앞에 그리는 뷰포트의 빌린 목록 핸들입니다. 화면 좌표를 사용합니다.
 */
export function GetForegroundDrawList(): ImDrawList | null {
  return native.GetForegroundDrawList();
}

/**
 * Test whether a rectangle at the cursor is visible.
 *
 * @zh 判断光标位置的矩形是否可见。
 * @ja カーソル位置の矩形が表示範囲内かを調べます。
 * @ko 커서 위치의 사각형이 보이는지 확인합니다.
 *
 * @remarks
 * test if rectangle (of given size, starting from cursor position) is visible /
 * not clipped.
 * @zh
 * 其他工具。
 *
 * 测试从光标位置起、指定尺寸的矩形是否可见/未被裁剪。
 * @ja
 * その他のユーティリティ。
 *
 * カーソル位置から指定サイズの矩形が見えるか、クリップされていないかを調べます。
 * @ko
 * 기타 유틸리티.
 *
 * 커서 위치에서 시작하는 지정 크기의 사각형이 보이는지/클리핑되지 않았는지 검사합니다.
 *
 * @param size - Rectangle width and height in pixels at the current layout
 * cursor.
 * @zh size - 当前布局光标处的矩形像素宽高。
 * @ja size - 現在のレイアウトカーソルに置く矩形のピクセル寸法です。
 * @ko size - 현재 배치 커서에 놓는 사각형의 픽셀 너비와 높이입니다.
 *
 * @returns True if the rectangle overlaps the current window clipping
 * rectangle.
 * @zh 矩形与当前窗口裁剪矩形相交时为 true。
 * @ja 矩形が現在のウィンドウのクリップ領域と重なる場合は true です。
 * @ko 사각형이 현재 창의 클립 사각형과 겹치면 true입니다.
 */
export function IsRectVisibleBySize(size: ImVec2Like): boolean {
  return native.IsRectVisibleBySize(size);
}

/**
 * Test if rectangle (in screen space) is visible / not clipped.
 *
 * @zh 测试屏幕坐标中的矩形是否可见/未被裁剪，以便在用户侧进行粗略裁剪。
 * @ja スクリーン座標の矩形が見えるか、クリップされていないかを調べます。
 * @ko 화면 좌표의 사각형이 보이는지/클리핑되지 않았는지 검사하여 사용자 측에서 대략적인 클리핑을 수행할 수 있게 합니다.
 *
 * @remarks
 * to perform coarse clipping on user's side.
 * @zh
 * 测试屏幕坐标中的矩形是否可见/未被裁剪，以便在用户侧进行粗略裁剪。
 * @ja
 * ユーザー側で大まかなクリッピングを行うためのものです。
 * @ko
 * 화면 좌표의 사각형이 보이는지/클리핑되지 않았는지 검사하여 사용자 측에서 대략적인 클리핑을 수행할 수 있게 합니다.
 *
 * @param rect_min - Top-left corner of the rectangle in absolute screen
 * coordinates.
 * @zh rect_min - 矩形左上角，使用绝对屏幕坐标。
 * @ja rect_min - 矩形の左上を絶対スクリーン座標で指定します。
 * @ko rect_min - 사각형 왼쪽 위의 절대 화면 좌표입니다.
 *
 * @param rect_max - Bottom-right corner of the rectangle in absolute screen
 * coordinates.
 * @zh rect_max - 矩形右下角，使用绝对屏幕坐标。
 * @ja rect_max - 矩形の右下を絶対スクリーン座標で指定します。
 * @ko rect_max - 사각형 오른쪽 아래의 절대 화면 좌표입니다.
 *
 * @returns True if the rectangle overlaps the current window clipping
 * rectangle.
 * @zh 矩形与当前窗口裁剪矩形相交时为 true。
 * @ja 矩形が現在のウィンドウのクリップ領域と重なる場合は true です。
 * @ko 사각형이 현재 창의 클립 사각형과 겹치면 true입니다.
 */
export function IsRectVisible(
  rect_min: ImVec2Like,
  rect_max: ImVec2Like,
): boolean {
  return native.IsRectVisible(rect_min, rect_max);
}

/**
 * Get the shared data used by draw lists.
 *
 * @zh 获取绘制列表使用的共享数据。
 * @ja 描画リストが使う共有データを取得します。
 * @ko 그리기 목록에서 사용하는 공유 데이터를 가져옵니다.
 *
 * @remarks
 * you may use this when creating your own ImDrawList instances.
 * @zh
 * 创建自己的 ImDrawList 实例时可以使用它。
 * @ja
 * 独自の ImDrawList インスタンスを作成する際に使用できます。
 * @ko
 * 자체 ImDrawList 인스턴스를 만들 때 사용할 수 있습니다.
 *
 * @returns Borrowed shared drawing state used by draw lists in the current
 * context.
 * @zh 当前上下文绘制列表所用共享绘制状态的借用句柄。
 * @ja 現在の描画リストが共用する描画状態の借用ハンドルです。
 * @ko 현재 컨텍스트 그리기 목록이 공유하는 그리기 상태의 빌린 핸들입니다.
 */
export function GetDrawListSharedData(): ImDrawListSharedData | null {
  return native.GetDrawListSharedData();
}
