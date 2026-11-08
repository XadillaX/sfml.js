import { native } from '../internal/native';
import type { ImVec2Like, ImDrawList } from '../types';

/**
 * Add a line to the draw list.
 *
 * @zh 向绘制列表添加直线。
 * @ja 描画リストに直線を追加します。
 * @ko 그리기 목록에 선을 추가합니다.
 *
 * @remarks
 * - Filled shapes must always use clockwise winding order. The anti-aliasing
 *   fringe depends on it. Counter-clockwise shapes will have "inward"
 *   anti-aliasing.
 *
 * - For rectangular primitives, "p_min" and "p_max" represent the upper-left
 *   and lower-right corners.
 *
 * - For circle primitives, use "num_segments == 0" to automatically calculate
 *   tessellation (preferred). In older versions (until Dear ImGui 1.77) the
 * native Dear ImGui AddCircle methods defaulted to num_segments == 12. In
 * future
 * versions we will use textures to provide cheaper and higher-quality circles.
 * Use
 * ImDrawList_AddNgon() and ImDrawList_AddNgonFilled() if you need to guarantee
 * a specific
 *   number of sides.
 *
 * Implied thickness = 1.0
 * @zh
 * 图元。
 *
 * - 填充形状必须始终按顺时针绕序排列，抗锯齿边缘依赖此顺序；逆时针形状会产生“向内”的抗锯齿。
 *
 * - 矩形图元的 "p_min" 和 "p_max" 分别表示左上角与右下角。
 *
 * - 圆形图元推荐使用 "num_segments == 0" 自动计算细分数。旧版（直到 1.77）的 Dear ImGui 原生方法 AddCircle
 * 默认使用 num_segments == 12。未来版本将使用纹理提供成本更低、质量更高的圆形。如需保证特定边数，请使用
 * ImDrawList_AddNgon() 和
 *   ImDrawList_AddNgonFilled()。
 *
 * 隐含参数：thickness = 1.0。
 * @ja
 * プリミティブ。
 *
 * - 塗りつぶす形状は必ず時計回りの頂点順にします。アンチエイリアスの縁はこれに依存し、反時計回りでは「内向き」のアンチエイリアスになります。
 *
 * - 矩形の "p_min" と "p_max" は左上隅と右下隅を表します。
 *
 * - 円は "num_segments == 0" による自動分割数計算を推奨します。旧版（1.77 まで）の Dear ImGui のネイティブメソッド
 *   AddCircle は
 *   num_segments == 12 が既定でした。将来はテクスチャで、より低コストで高品質な円を提供する予定です。辺数を保証したい場合は
 *   ImDrawList_AddNgon() と ImDrawList_AddNgonFilled() を使用してください。
 *
 * 暗黙の引数：thickness = 1.0。
 * @ko
 * 프리미티브.
 *
 * - 채운 도형은 항상 시계 방향 정점 순서를 사용해야 합니다. 안티앨리어싱 가장자리가 이에 의존하며 반시계 방향 도형은 "안쪽"
 *   안티앨리어싱을 갖습니다.
 *
 * - 사각형 프리미티브의 "p_min"과 "p_max"는 왼쪽 위와 오른쪽 아래 모서리입니다.
 *
 * - 원은 "num_segments == 0"으로 분할 수를 자동 계산하는 것을 권장합니다. 이전 버전(1.77까지)의
 * Dear ImGui 네이티브 메서드 AddCircle은 기본값이 num_segments == 12였습니다. 향후에는 텍스처로 더 저렴하고
 * 품질 높은 원을 제공할
 * 예정입니다. 특정 변 수를 보장하려면 ImDrawList_AddNgon()과 ImDrawList_AddNgonFilled()를 사용하세요.
 *
 * 암묵적 인수: thickness = 1.0.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p1 - Ordered vertex or start point p1 in absolute screen coordinates.
 * @zh p1 - 绝对屏幕坐标中的有序顶点或起点 p1。
 * @ja p1 - 絶対スクリーン座標の順序付き頂点または始点 p1 です。
 * @ko p1 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p1입니다.
 *
 * @param p2 - Ordered vertex or start point p2 in absolute screen coordinates.
 * @zh p2 - 绝对屏幕坐标中的有序顶点或起点 p2。
 * @ja p2 - 絶対スクリーン座標の順序付き頂点または始点 p2 です。
 * @ko p2 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p2입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddLine(
  self: ImDrawList,
  p1: ImVec2Like,
  p2: ImVec2Like,
  col: number,
): void {
  native.ImDrawList_AddLine(self, p1, p2, col);
}

/**
 * Append a colored line segment to the draw list.
 *
 * @zh 向绘制列表添加有色线段。
 * @ja 描画リストに色付きの線分を追加します。
 * @ko 그리기 목록에 색이 있는 선분을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p1 - Ordered vertex or start point p1 in absolute screen coordinates.
 * @zh p1 - 绝对屏幕坐标中的有序顶点或起点 p1。
 * @ja p1 - 絶対スクリーン座標の順序付き頂点または始点 p1 です。
 * @ko p1 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p1입니다.
 *
 * @param p2 - Ordered vertex or start point p2 in absolute screen coordinates.
 * @zh p2 - 绝对屏幕坐标中的有序顶点或起点 p2。
 * @ja p2 - 絶対スクリーン座標の順序付き頂点または始点 p2 です。
 * @ko p2 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p2입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param thickness - Stroke thickness in screen pixels.
 * @zh thickness - 描边厚度，单位为屏幕像素。
 * @ja thickness - スクリーンピクセル単位の線の太さです。
 * @ko thickness - 화면 픽셀 단위의 선 두께입니다.
 */
export function ImDrawList_AddLineEx(
  self: ImDrawList,
  p1: ImVec2Like,
  p2: ImVec2Like,
  col: number,
  thickness: number = 1.0,
): void {
  native.ImDrawList_AddLineEx(self, p1, p2, col, thickness);
}

/**
 * Append an axis-aligned rectangular outline to the draw list.
 *
 * @zh 向绘制列表添加轴对齐的矩形轮廓。
 * @ja 描画リストに軸に平行な長方形の輪郭を追加します。
 * @ko 그리기 목록에 축 정렬된 직사각형 윤곽선을 추가합니다.
 *
 * @remarks
 * a: upper-left, b: lower-right (== upper-left + size)
 *
 * Implied rounding = 0.0, flags = 0, thickness = 1.0
 * @zh
 * a：左上角；b：右下角（== 左上角 + 尺寸）。
 *
 * 隐含参数：rounding = 0.0, flags = 0, thickness = 1.0。
 * @ja
 * a：左上隅、b：右下隅（== 左上隅 + サイズ）。
 *
 * 暗黙の引数：rounding = 0.0, flags = 0, thickness = 1.0。
 * @ko
 * a: 왼쪽 위, b: 오른쪽 아래(== 왼쪽 위 + 크기).
 *
 * 암묵적 인수: rounding = 0.0, flags = 0, thickness = 1.0.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p_min - Top-left corner of the rectangle in absolute screen
 * coordinates.
 * @zh p_min - 矩形左上角，使用绝对屏幕坐标。
 * @ja p_min - 矩形の左上を絶対スクリーン座標で指定します。
 * @ko p_min - 사각형 왼쪽 위의 절대 화면 좌표입니다.
 *
 * @param p_max - Bottom-right corner of the rectangle in absolute screen
 * coordinates.
 * @zh p_max - 矩形右下角，使用绝对屏幕坐标。
 * @ja p_max - 矩形の右下を絶対スクリーン座標で指定します。
 * @ko p_max - 사각형 오른쪽 아래의 절대 화면 좌표입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddRect(
  self: ImDrawList,
  p_min: ImVec2Like,
  p_max: ImVec2Like,
  col: number,
): void {
  native.ImDrawList_AddRect(self, p_min, p_max, col);
}

/**
 * Append an axis-aligned rectangular outline to the draw list.
 *
 * @zh 向绘制列表添加轴对齐的矩形轮廓。
 * @ja 描画リストに軸に平行な長方形の輪郭を追加します。
 * @ko 그리기 목록에 축 정렬된 직사각형 윤곽선을 추가합니다.
 *
 * @remarks
 * a: upper-left, b: lower-right (== upper-left + size)
 * @zh
 * a：左上角；b：右下角（== 左上角 + 尺寸）。
 * @ja
 * a：左上隅、b：右下隅（== 左上隅 + サイズ）。
 * @ko
 * a: 왼쪽 위, b: 오른쪽 아래(== 왼쪽 위 + 크기).
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p_min - Top-left corner of the rectangle in absolute screen
 * coordinates.
 * @zh p_min - 矩形左上角，使用绝对屏幕坐标。
 * @ja p_min - 矩形の左上を絶対スクリーン座標で指定します。
 * @ko p_min - 사각형 왼쪽 위의 절대 화면 좌표입니다.
 *
 * @param p_max - Bottom-right corner of the rectangle in absolute screen
 * coordinates.
 * @zh p_max - 矩形右下角，使用绝对屏幕坐标。
 * @ja p_max - 矩形の右下を絶対スクリーン座標で指定します。
 * @ko p_max - 사각형 오른쪽 아래의 절대 화면 좌표입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param rounding - Corner radius in screen pixels; 0 creates square corners.
 * Draw flags select which corners are rounded.
 * @zh rounding - 以屏幕像素计的圆角半径；0 为直角，绘制标志选择圆角位置。
 * @ja rounding - スクリーンピクセル単位の角丸半径です。0 は直角で、対象の角は描画フラグで選びます。
 * @ko rounding - 화면 픽셀 단위의 모서리 반지름입니다. 0은 직각이며 그리기 플래그가 둥글릴 모서리를 고릅니다.
 *
 * @param flags - ImDrawFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImDrawFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImDrawFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImDrawFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param thickness - Stroke thickness in screen pixels.
 * @zh thickness - 描边厚度，单位为屏幕像素。
 * @ja thickness - スクリーンピクセル単位の線の太さです。
 * @ko thickness - 화면 픽셀 단위의 선 두께입니다.
 */
export function ImDrawList_AddRectEx(
  self: ImDrawList,
  p_min: ImVec2Like,
  p_max: ImVec2Like,
  col: number,
  rounding: number = 0.0,
  flags: number = 0,
  thickness: number = 1.0,
): void {
  native.ImDrawList_AddRectEx(
    self,
    p_min,
    p_max,
    col,
    rounding,
    flags,
    thickness,
  );
}

/**
 * Append a filled axis-aligned rectangle to the draw list.
 *
 * @zh 向绘制列表添加填充的轴对齐矩形。
 * @ja 描画リストに塗りつぶした軸に平行な長方形を追加します。
 * @ko 그리기 목록에 채워진 축 정렬 직사각형을 추가합니다.
 *
 * @remarks
 * a: upper-left, b: lower-right (== upper-left + size)
 *
 * Implied rounding = 0.0, flags = 0
 * @zh
 * a：左上角；b：右下角（== 左上角 + 尺寸）。
 *
 * 隐含参数：rounding = 0.0, flags = 0。
 * @ja
 * a：左上隅、b：右下隅（== 左上隅 + サイズ）。
 *
 * 暗黙の引数：rounding = 0.0, flags = 0。
 * @ko
 * a: 왼쪽 위, b: 오른쪽 아래(== 왼쪽 위 + 크기).
 *
 * 암묵적 인수: rounding = 0.0, flags = 0.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p_min - Top-left corner of the rectangle in absolute screen
 * coordinates.
 * @zh p_min - 矩形左上角，使用绝对屏幕坐标。
 * @ja p_min - 矩形の左上を絶対スクリーン座標で指定します。
 * @ko p_min - 사각형 왼쪽 위의 절대 화면 좌표입니다.
 *
 * @param p_max - Bottom-right corner of the rectangle in absolute screen
 * coordinates.
 * @zh p_max - 矩形右下角，使用绝对屏幕坐标。
 * @ja p_max - 矩形の右下を絶対スクリーン座標で指定します。
 * @ko p_max - 사각형 오른쪽 아래의 절대 화면 좌표입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddRectFilled(
  self: ImDrawList,
  p_min: ImVec2Like,
  p_max: ImVec2Like,
  col: number,
): void {
  native.ImDrawList_AddRectFilled(self, p_min, p_max, col);
}

/**
 * Append a filled axis-aligned rectangle to the draw list.
 *
 * @zh 向绘制列表添加填充的轴对齐矩形。
 * @ja 描画リストに塗りつぶした軸に平行な長方形を追加します。
 * @ko 그리기 목록에 채워진 축 정렬 직사각형을 추가합니다.
 *
 * @remarks
 * a: upper-left, b: lower-right (== upper-left + size)
 * @zh
 * a：左上角；b：右下角（== 左上角 + 尺寸）。
 * @ja
 * a：左上隅、b：右下隅（== 左上隅 + サイズ）。
 * @ko
 * a: 왼쪽 위, b: 오른쪽 아래(== 왼쪽 위 + 크기).
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p_min - Top-left corner of the rectangle in absolute screen
 * coordinates.
 * @zh p_min - 矩形左上角，使用绝对屏幕坐标。
 * @ja p_min - 矩形の左上を絶対スクリーン座標で指定します。
 * @ko p_min - 사각형 왼쪽 위의 절대 화면 좌표입니다.
 *
 * @param p_max - Bottom-right corner of the rectangle in absolute screen
 * coordinates.
 * @zh p_max - 矩形右下角，使用绝对屏幕坐标。
 * @ja p_max - 矩形の右下を絶対スクリーン座標で指定します。
 * @ko p_max - 사각형 오른쪽 아래의 절대 화면 좌표입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param rounding - Corner radius in screen pixels; 0 creates square corners.
 * Draw flags select which corners are rounded.
 * @zh rounding - 以屏幕像素计的圆角半径；0 为直角，绘制标志选择圆角位置。
 * @ja rounding - スクリーンピクセル単位の角丸半径です。0 は直角で、対象の角は描画フラグで選びます。
 * @ko rounding - 화면 픽셀 단위의 모서리 반지름입니다. 0은 직각이며 그리기 플래그가 둥글릴 모서리를 고릅니다.
 *
 * @param flags - ImDrawFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImDrawFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImDrawFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImDrawFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 */
export function ImDrawList_AddRectFilledEx(
  self: ImDrawList,
  p_min: ImVec2Like,
  p_max: ImVec2Like,
  col: number,
  rounding: number = 0.0,
  flags: number = 0,
): void {
  native.ImDrawList_AddRectFilledEx(self, p_min, p_max, col, rounding, flags);
}

/**
 * Append a filled rectangle with colors interpolated from its four corners.
 *
 * @zh 添加填充矩形，颜色由四个角的颜色插值得到。
 * @ja 四隅の色を補間して塗りつぶす長方形を追加します。
 * @ko 네 모서리의 색상을 보간하여 채운 직사각형을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p_min - Top-left corner of the rectangle in absolute screen
 * coordinates.
 * @zh p_min - 矩形左上角，使用绝对屏幕坐标。
 * @ja p_min - 矩形の左上を絶対スクリーン座標で指定します。
 * @ko p_min - 사각형 왼쪽 위의 절대 화면 좌표입니다.
 *
 * @param p_max - Bottom-right corner of the rectangle in absolute screen
 * coordinates.
 * @zh p_max - 矩形右下角，使用绝对屏幕坐标。
 * @ja p_max - 矩形の右下を絶対スクリーン座標で指定します。
 * @ko p_max - 사각형 오른쪽 아래의 절대 화면 좌표입니다.
 *
 * @param col_upr_left - Packed ImU32 RGBA color (upr_left); alpha controls
 * opacity.
 * @zh col_upr_left - 打包 ImU32 RGBA 颜色 (upr_left)；alpha 控制不透明度。
 * @ja col_upr_left - パック済み ImU32 RGBA の色 (upr_left)です。アルファ値で不透明度を指定します。
 * @ko col_upr_left - 패킹된 ImU32 RGBA 색상 (upr_left)입니다. 알파는 불투명도를 제어합니다.
 *
 * @param col_upr_right - Packed ImU32 RGBA color (upr_right); alpha controls
 * opacity.
 * @zh col_upr_right - 打包 ImU32 RGBA 颜色 (upr_right)；alpha 控制不透明度。
 * @ja col_upr_right - パック済み ImU32 RGBA の色 (upr_right)です。アルファ値で不透明度を指定します。
 * @ko col_upr_right - 패킹된 ImU32 RGBA 색상 (upr_right)입니다. 알파는 불투명도를 제어합니다.
 *
 * @param col_bot_right - Packed ImU32 RGBA color (bot_right); alpha controls
 * opacity.
 * @zh col_bot_right - 打包 ImU32 RGBA 颜色 (bot_right)；alpha 控制不透明度。
 * @ja col_bot_right - パック済み ImU32 RGBA の色 (bot_right)です。アルファ値で不透明度を指定します。
 * @ko col_bot_right - 패킹된 ImU32 RGBA 색상 (bot_right)입니다. 알파는 불투명도를 제어합니다.
 *
 * @param col_bot_left - Packed ImU32 RGBA color (bot_left); alpha controls
 * opacity.
 * @zh col_bot_left - 打包 ImU32 RGBA 颜色 (bot_left)；alpha 控制不透明度。
 * @ja col_bot_left - パック済み ImU32 RGBA の色 (bot_left)です。アルファ値で不透明度を指定します。
 * @ko col_bot_left - 패킹된 ImU32 RGBA 색상 (bot_left)입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddRectFilledMultiColor(
  self: ImDrawList,
  p_min: ImVec2Like,
  p_max: ImVec2Like,
  col_upr_left: number,
  col_upr_right: number,
  col_bot_right: number,
  col_bot_left: number,
): void {
  native.ImDrawList_AddRectFilledMultiColor(
    self,
    p_min,
    p_max,
    col_upr_left,
    col_upr_right,
    col_bot_right,
    col_bot_left,
  );
}

/**
 * Append the outline of a quadrilateral to the draw list.
 *
 * @zh 向绘制列表添加四边形轮廓。
 * @ja 描画リストに四角形の輪郭を追加します。
 * @ko 그리기 목록에 사각형 윤곽선을 추가합니다.
 *
 * @remarks
 * Implied thickness = 1.0
 * @zh
 * 隐含参数：thickness = 1.0。
 * @ja
 * 暗黙の引数：thickness = 1.0。
 * @ko
 * 암묵적 인수: thickness = 1.0.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p1 - Ordered vertex or start point p1 in absolute screen coordinates.
 * @zh p1 - 绝对屏幕坐标中的有序顶点或起点 p1。
 * @ja p1 - 絶対スクリーン座標の順序付き頂点または始点 p1 です。
 * @ko p1 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p1입니다.
 *
 * @param p2 - Ordered vertex or start point p2 in absolute screen coordinates.
 * @zh p2 - 绝对屏幕坐标中的有序顶点或起点 p2。
 * @ja p2 - 絶対スクリーン座標の順序付き頂点または始点 p2 です。
 * @ko p2 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p2입니다.
 *
 * @param p3 - Ordered vertex or start point p3 in absolute screen coordinates.
 * @zh p3 - 绝对屏幕坐标中的有序顶点或起点 p3。
 * @ja p3 - 絶対スクリーン座標の順序付き頂点または始点 p3 です。
 * @ko p3 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p3입니다.
 *
 * @param p4 - Ordered vertex or start point p4 in absolute screen coordinates.
 * @zh p4 - 绝对屏幕坐标中的有序顶点或起点 p4。
 * @ja p4 - 絶対スクリーン座標の順序付き頂点または始点 p4 です。
 * @ko p4 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p4입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddQuad(
  self: ImDrawList,
  p1: ImVec2Like,
  p2: ImVec2Like,
  p3: ImVec2Like,
  p4: ImVec2Like,
  col: number,
): void {
  native.ImDrawList_AddQuad(self, p1, p2, p3, p4, col);
}

/**
 * Append the outline of a quadrilateral to the draw list.
 *
 * @zh 向绘制列表添加四边形轮廓。
 * @ja 描画リストに四角形の輪郭を追加します。
 * @ko 그리기 목록에 사각형 윤곽선을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p1 - Ordered vertex or start point p1 in absolute screen coordinates.
 * @zh p1 - 绝对屏幕坐标中的有序顶点或起点 p1。
 * @ja p1 - 絶対スクリーン座標の順序付き頂点または始点 p1 です。
 * @ko p1 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p1입니다.
 *
 * @param p2 - Ordered vertex or start point p2 in absolute screen coordinates.
 * @zh p2 - 绝对屏幕坐标中的有序顶点或起点 p2。
 * @ja p2 - 絶対スクリーン座標の順序付き頂点または始点 p2 です。
 * @ko p2 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p2입니다.
 *
 * @param p3 - Ordered vertex or start point p3 in absolute screen coordinates.
 * @zh p3 - 绝对屏幕坐标中的有序顶点或起点 p3。
 * @ja p3 - 絶対スクリーン座標の順序付き頂点または始点 p3 です。
 * @ko p3 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p3입니다.
 *
 * @param p4 - Ordered vertex or start point p4 in absolute screen coordinates.
 * @zh p4 - 绝对屏幕坐标中的有序顶点或起点 p4。
 * @ja p4 - 絶対スクリーン座標の順序付き頂点または始点 p4 です。
 * @ko p4 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p4입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param thickness - Stroke thickness in screen pixels.
 * @zh thickness - 描边厚度，单位为屏幕像素。
 * @ja thickness - スクリーンピクセル単位の線の太さです。
 * @ko thickness - 화면 픽셀 단위의 선 두께입니다.
 */
export function ImDrawList_AddQuadEx(
  self: ImDrawList,
  p1: ImVec2Like,
  p2: ImVec2Like,
  p3: ImVec2Like,
  p4: ImVec2Like,
  col: number,
  thickness: number = 1.0,
): void {
  native.ImDrawList_AddQuadEx(self, p1, p2, p3, p4, col, thickness);
}

/**
 * Append a quadrilateral filled with color to the draw list.
 *
 * @zh 向绘制列表添加颜色填充的四边形。
 * @ja 描画リストに色で塗りつぶした四角形を追加します。
 * @ko 그리기 목록에 색으로 채운 사각형 도형을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p1 - Ordered vertex or start point p1 in absolute screen coordinates.
 * @zh p1 - 绝对屏幕坐标中的有序顶点或起点 p1。
 * @ja p1 - 絶対スクリーン座標の順序付き頂点または始点 p1 です。
 * @ko p1 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p1입니다.
 *
 * @param p2 - Ordered vertex or start point p2 in absolute screen coordinates.
 * @zh p2 - 绝对屏幕坐标中的有序顶点或起点 p2。
 * @ja p2 - 絶対スクリーン座標の順序付き頂点または始点 p2 です。
 * @ko p2 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p2입니다.
 *
 * @param p3 - Ordered vertex or start point p3 in absolute screen coordinates.
 * @zh p3 - 绝对屏幕坐标中的有序顶点或起点 p3。
 * @ja p3 - 絶対スクリーン座標の順序付き頂点または始点 p3 です。
 * @ko p3 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p3입니다.
 *
 * @param p4 - Ordered vertex or start point p4 in absolute screen coordinates.
 * @zh p4 - 绝对屏幕坐标中的有序顶点或起点 p4。
 * @ja p4 - 絶対スクリーン座標の順序付き頂点または始点 p4 です。
 * @ko p4 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p4입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddQuadFilled(
  self: ImDrawList,
  p1: ImVec2Like,
  p2: ImVec2Like,
  p3: ImVec2Like,
  p4: ImVec2Like,
  col: number,
): void {
  native.ImDrawList_AddQuadFilled(self, p1, p2, p3, p4, col);
}

/**
 * Append the outline of a triangle to the draw list.
 *
 * @zh 向绘制列表添加三角形轮廓。
 * @ja 描画リストに三角形の輪郭を追加します。
 * @ko 그리기 목록에 삼각형 윤곽선을 추가합니다.
 *
 * @remarks
 * Implied thickness = 1.0
 * @zh
 * 隐含参数：thickness = 1.0。
 * @ja
 * 暗黙の引数：thickness = 1.0。
 * @ko
 * 암묵적 인수: thickness = 1.0.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p1 - Ordered vertex or start point p1 in absolute screen coordinates.
 * @zh p1 - 绝对屏幕坐标中的有序顶点或起点 p1。
 * @ja p1 - 絶対スクリーン座標の順序付き頂点または始点 p1 です。
 * @ko p1 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p1입니다.
 *
 * @param p2 - Ordered vertex or start point p2 in absolute screen coordinates.
 * @zh p2 - 绝对屏幕坐标中的有序顶点或起点 p2。
 * @ja p2 - 絶対スクリーン座標の順序付き頂点または始点 p2 です。
 * @ko p2 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p2입니다.
 *
 * @param p3 - Ordered vertex or start point p3 in absolute screen coordinates.
 * @zh p3 - 绝对屏幕坐标中的有序顶点或起点 p3。
 * @ja p3 - 絶対スクリーン座標の順序付き頂点または始点 p3 です。
 * @ko p3 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p3입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddTriangle(
  self: ImDrawList,
  p1: ImVec2Like,
  p2: ImVec2Like,
  p3: ImVec2Like,
  col: number,
): void {
  native.ImDrawList_AddTriangle(self, p1, p2, p3, col);
}

/**
 * Append the outline of a triangle to the draw list.
 *
 * @zh 向绘制列表添加三角形轮廓。
 * @ja 描画リストに三角形の輪郭を追加します。
 * @ko 그리기 목록에 삼각형 윤곽선을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p1 - Ordered vertex or start point p1 in absolute screen coordinates.
 * @zh p1 - 绝对屏幕坐标中的有序顶点或起点 p1。
 * @ja p1 - 絶対スクリーン座標の順序付き頂点または始点 p1 です。
 * @ko p1 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p1입니다.
 *
 * @param p2 - Ordered vertex or start point p2 in absolute screen coordinates.
 * @zh p2 - 绝对屏幕坐标中的有序顶点或起点 p2。
 * @ja p2 - 絶対スクリーン座標の順序付き頂点または始点 p2 です。
 * @ko p2 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p2입니다.
 *
 * @param p3 - Ordered vertex or start point p3 in absolute screen coordinates.
 * @zh p3 - 绝对屏幕坐标中的有序顶点或起点 p3。
 * @ja p3 - 絶対スクリーン座標の順序付き頂点または始点 p3 です。
 * @ko p3 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p3입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param thickness - Stroke thickness in screen pixels.
 * @zh thickness - 描边厚度，单位为屏幕像素。
 * @ja thickness - スクリーンピクセル単位の線の太さです。
 * @ko thickness - 화면 픽셀 단위의 선 두께입니다.
 */
export function ImDrawList_AddTriangleEx(
  self: ImDrawList,
  p1: ImVec2Like,
  p2: ImVec2Like,
  p3: ImVec2Like,
  col: number,
  thickness: number = 1.0,
): void {
  native.ImDrawList_AddTriangleEx(self, p1, p2, p3, col, thickness);
}

/**
 * Append a triangle filled with color to the draw list.
 *
 * @zh 向绘制列表添加颜色填充的三角形。
 * @ja 描画リストに色で塗りつぶした三角形を追加します。
 * @ko 그리기 목록에 색으로 채운 삼각형 도형을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p1 - Ordered vertex or start point p1 in absolute screen coordinates.
 * @zh p1 - 绝对屏幕坐标中的有序顶点或起点 p1。
 * @ja p1 - 絶対スクリーン座標の順序付き頂点または始点 p1 です。
 * @ko p1 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p1입니다.
 *
 * @param p2 - Ordered vertex or start point p2 in absolute screen coordinates.
 * @zh p2 - 绝对屏幕坐标中的有序顶点或起点 p2。
 * @ja p2 - 絶対スクリーン座標の順序付き頂点または始点 p2 です。
 * @ko p2 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p2입니다.
 *
 * @param p3 - Ordered vertex or start point p3 in absolute screen coordinates.
 * @zh p3 - 绝对屏幕坐标中的有序顶点或起点 p3。
 * @ja p3 - 絶対スクリーン座標の順序付き頂点または始点 p3 です。
 * @ko p3 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p3입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddTriangleFilled(
  self: ImDrawList,
  p1: ImVec2Like,
  p2: ImVec2Like,
  p3: ImVec2Like,
  col: number,
): void {
  native.ImDrawList_AddTriangleFilled(self, p1, p2, p3, col);
}

/**
 * Append the outline of a circle to the draw list.
 *
 * @zh 向绘制列表添加圆轮廓。
 * @ja 描画リストに円の輪郭を追加します。
 * @ko 그리기 목록에 원 윤곽선을 추가합니다.
 *
 * @remarks
 * Implied num_segments = 0, thickness = 1.0
 * @zh
 * 隐含参数：num_segments = 0, thickness = 1.0。
 * @ja
 * 暗黙の引数：num_segments = 0, thickness = 1.0。
 * @ko
 * 암묵적 인수: num_segments = 0, thickness = 1.0.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param center - Shape center in absolute screen coordinates.
 * @zh center - 形状中心，使用绝对屏幕坐标。
 * @ja center - 形状の中心を絶対スクリーン座標で指定します。
 * @ko center - 도형 중심의 절대 화면 좌표입니다.
 *
 * @param radius - Circle or arc radius in screen pixels.
 * @zh radius - 圆或圆弧的屏幕像素半径。
 * @ja radius - 円または円弧のスクリーンピクセル半径です。
 * @ko radius - 원 또는 호의 화면 픽셀 반지름입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddCircle(
  self: ImDrawList,
  center: ImVec2Like,
  radius: number,
  col: number,
): void {
  native.ImDrawList_AddCircle(self, center, radius, col);
}

/**
 * Append the outline of a circle to the draw list.
 *
 * @zh 向绘制列表添加圆轮廓。
 * @ja 描画リストに円の輪郭を追加します。
 * @ko 그리기 목록에 원 윤곽선을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param center - Shape center in absolute screen coordinates.
 * @zh center - 形状中心，使用绝对屏幕坐标。
 * @ja center - 形状の中心を絶対スクリーン座標で指定します。
 * @ko center - 도형 중심의 절대 화면 좌표입니다.
 *
 * @param radius - Circle or arc radius in screen pixels.
 * @zh radius - 圆或圆弧的屏幕像素半径。
 * @ja radius - 円または円弧のスクリーンピクセル半径です。
 * @ko radius - 원 또는 호의 화면 픽셀 반지름입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param num_segments - Curve tessellation segment count; 0 lets ImGui choose
 * automatically.
 * @zh num_segments - 曲线细分段数；0 由 ImGui 自动选择。
 * @ja num_segments - 曲線を分割する区間数です。0 は ImGui が自動選択します。
 * @ko num_segments - 곡선 분할 구간 수입니다. 0은 ImGui가 자동 선택합니다.
 *
 * @param thickness - Stroke thickness in screen pixels.
 * @zh thickness - 描边厚度，单位为屏幕像素。
 * @ja thickness - スクリーンピクセル単位の線の太さです。
 * @ko thickness - 화면 픽셀 단위의 선 두께입니다.
 */
export function ImDrawList_AddCircleEx(
  self: ImDrawList,
  center: ImVec2Like,
  radius: number,
  col: number,
  num_segments: number = 0,
  thickness: number = 1.0,
): void {
  native.ImDrawList_AddCircleEx(
    self,
    center,
    radius,
    col,
    num_segments,
    thickness,
  );
}

/**
 * Append a circle filled with color to the draw list.
 *
 * @zh 向绘制列表添加颜色填充的圆。
 * @ja 描画リストに色で塗りつぶした円を追加します。
 * @ko 그리기 목록에 색으로 채운 원 도형을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param center - Shape center in absolute screen coordinates.
 * @zh center - 形状中心，使用绝对屏幕坐标。
 * @ja center - 形状の中心を絶対スクリーン座標で指定します。
 * @ko center - 도형 중심의 절대 화면 좌표입니다.
 *
 * @param radius - Circle or arc radius in screen pixels.
 * @zh radius - 圆或圆弧的屏幕像素半径。
 * @ja radius - 円または円弧のスクリーンピクセル半径です。
 * @ko radius - 원 또는 호의 화면 픽셀 반지름입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param num_segments - Curve tessellation segment count; 0 lets ImGui choose
 * automatically.
 * @zh num_segments - 曲线细分段数；0 由 ImGui 自动选择。
 * @ja num_segments - 曲線を分割する区間数です。0 は ImGui が自動選択します。
 * @ko num_segments - 곡선 분할 구간 수입니다. 0은 ImGui가 자동 선택합니다.
 */
export function ImDrawList_AddCircleFilled(
  self: ImDrawList,
  center: ImVec2Like,
  radius: number,
  col: number,
  num_segments: number = 0,
): void {
  native.ImDrawList_AddCircleFilled(self, center, radius, col, num_segments);
}

/**
 * Append the outline of a regular polygon to the draw list.
 *
 * @zh 向绘制列表添加正多边形轮廓。
 * @ja 描画リストに正多角形の輪郭を追加します。
 * @ko 그리기 목록에 정다각형 윤곽선을 추가합니다.
 *
 * @remarks
 * Implied thickness = 1.0
 * @zh
 * 隐含参数：thickness = 1.0。
 * @ja
 * 暗黙の引数：thickness = 1.0。
 * @ko
 * 암묵적 인수: thickness = 1.0.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param center - Shape center in absolute screen coordinates.
 * @zh center - 形状中心，使用绝对屏幕坐标。
 * @ja center - 形状の中心を絶対スクリーン座標で指定します。
 * @ko center - 도형 중심의 절대 화면 좌표입니다.
 *
 * @param radius - Circle or arc radius in screen pixels.
 * @zh radius - 圆或圆弧的屏幕像素半径。
 * @ja radius - 円または円弧のスクリーンピクセル半径です。
 * @ko radius - 원 또는 호의 화면 픽셀 반지름입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param num_segments - Polygon side count, at least 3; unlike circles this is
 * not an automatic tessellation value.
 * @zh num_segments - 多边形边数，至少为 3；不同于圆形，此值不是自动细分设置。
 * @ja num_segments - 多角形の辺数です。最低 3 で、円と異なり自動分割値ではありません。
 * @ko num_segments - 다각형 변 수이며 최소 3입니다. 원과 달리 자동 분할 값이 아닙니다。
 */
export function ImDrawList_AddNgon(
  self: ImDrawList,
  center: ImVec2Like,
  radius: number,
  col: number,
  num_segments: number,
): void {
  native.ImDrawList_AddNgon(self, center, radius, col, num_segments);
}

/**
 * Append the outline of a regular polygon to the draw list.
 *
 * @zh 向绘制列表添加正多边形轮廓。
 * @ja 描画リストに正多角形の輪郭を追加します。
 * @ko 그리기 목록에 정다각형 윤곽선을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param center - Shape center in absolute screen coordinates.
 * @zh center - 形状中心，使用绝对屏幕坐标。
 * @ja center - 形状の中心を絶対スクリーン座標で指定します。
 * @ko center - 도형 중심의 절대 화면 좌표입니다.
 *
 * @param radius - Circle or arc radius in screen pixels.
 * @zh radius - 圆或圆弧的屏幕像素半径。
 * @ja radius - 円または円弧のスクリーンピクセル半径です。
 * @ko radius - 원 또는 호의 화면 픽셀 반지름입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param num_segments - Polygon side count, at least 3; unlike circles this is
 * not an automatic tessellation value.
 * @zh num_segments - 多边形边数，至少为 3；不同于圆形，此值不是自动细分设置。
 * @ja num_segments - 多角形の辺数です。最低 3 で、円と異なり自動分割値ではありません。
 * @ko num_segments - 다각형 변 수이며 최소 3입니다. 원과 달리 자동 분할 값이 아닙니다。
 *
 * @param thickness - Stroke thickness in screen pixels.
 * @zh thickness - 描边厚度，单位为屏幕像素。
 * @ja thickness - スクリーンピクセル単位の線の太さです。
 * @ko thickness - 화면 픽셀 단위의 선 두께입니다.
 */
export function ImDrawList_AddNgonEx(
  self: ImDrawList,
  center: ImVec2Like,
  radius: number,
  col: number,
  num_segments: number,
  thickness: number = 1.0,
): void {
  native.ImDrawList_AddNgonEx(
    self,
    center,
    radius,
    col,
    num_segments,
    thickness,
  );
}

/**
 * Append a regular polygon filled with color to the draw list.
 *
 * @zh 向绘制列表添加颜色填充的正多边形。
 * @ja 描画リストに色で塗りつぶした正多角形を追加します。
 * @ko 그리기 목록에 색으로 채운 정다각형 도형을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param center - Shape center in absolute screen coordinates.
 * @zh center - 形状中心，使用绝对屏幕坐标。
 * @ja center - 形状の中心を絶対スクリーン座標で指定します。
 * @ko center - 도형 중심의 절대 화면 좌표입니다.
 *
 * @param radius - Circle or arc radius in screen pixels.
 * @zh radius - 圆或圆弧的屏幕像素半径。
 * @ja radius - 円または円弧のスクリーンピクセル半径です。
 * @ko radius - 원 또는 호의 화면 픽셀 반지름입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param num_segments - Polygon side count, at least 3; unlike circles this is
 * not an automatic tessellation value.
 * @zh num_segments - 多边形边数，至少为 3；不同于圆形，此值不是自动细分设置。
 * @ja num_segments - 多角形の辺数です。最低 3 で、円と異なり自動分割値ではありません。
 * @ko num_segments - 다각형 변 수이며 최소 3입니다. 원과 달리 자동 분할 값이 아닙니다。
 */
export function ImDrawList_AddNgonFilled(
  self: ImDrawList,
  center: ImVec2Like,
  radius: number,
  col: number,
  num_segments: number,
): void {
  native.ImDrawList_AddNgonFilled(self, center, radius, col, num_segments);
}

/**
 * Append the outline of an ellipse to the draw list.
 *
 * @zh 向绘制列表添加椭圆轮廓。
 * @ja 描画リストに楕円の輪郭を追加します。
 * @ko 그리기 목록에 타원 윤곽선을 추가합니다.
 *
 * @remarks
 * Implied rot = 0.0, num_segments = 0, thickness = 1.0
 * @zh
 * 隐含参数：rot = 0.0, num_segments = 0, thickness = 1.0。
 * @ja
 * 暗黙の引数：rot = 0.0, num_segments = 0, thickness = 1.0。
 * @ko
 * 암묵적 인수: rot = 0.0, num_segments = 0, thickness = 1.0.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param center - Shape center in absolute screen coordinates.
 * @zh center - 形状中心，使用绝对屏幕坐标。
 * @ja center - 形状の中心を絶対スクリーン座標で指定します。
 * @ko center - 도형 중심의 절대 화면 좌표입니다.
 *
 * @param radius - Horizontal and vertical ellipse radii in pixels, before
 * rotation.
 * @zh radius - 旋转前椭圆的水平和垂直像素半径。
 * @ja radius - 回転前の楕円の水平・垂直ピクセル半径です。
 * @ko radius - 회전 전 타원의 가로 및 세로 픽셀 반지름입니다。
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddEllipse(
  self: ImDrawList,
  center: ImVec2Like,
  radius: ImVec2Like,
  col: number,
): void {
  native.ImDrawList_AddEllipse(self, center, radius, col);
}

/**
 * Append the outline of an ellipse to the draw list.
 *
 * @zh 向绘制列表添加椭圆轮廓。
 * @ja 描画リストに楕円の輪郭を追加します。
 * @ko 그리기 목록에 타원 윤곽선을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param center - Shape center in absolute screen coordinates.
 * @zh center - 形状中心，使用绝对屏幕坐标。
 * @ja center - 形状の中心を絶対スクリーン座標で指定します。
 * @ko center - 도형 중심의 절대 화면 좌표입니다.
 *
 * @param radius - Horizontal and vertical ellipse radii in pixels, before
 * rotation.
 * @zh radius - 旋转前椭圆的水平和垂直像素半径。
 * @ja radius - 回転前の楕円の水平・垂直ピクセル半径です。
 * @ko radius - 회전 전 타원의 가로 및 세로 픽셀 반지름입니다。
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param rot - Ellipse rotation angle in radians.
 * @zh rot - 椭圆旋转角度，单位为弧度。
 * @ja rot - 楕円の回転角です。単位はラジアンです。
 * @ko rot - 타원 회전 각도이며 단위는 라디안입니다.
 *
 * @param num_segments - Curve tessellation segment count; 0 lets ImGui choose
 * automatically.
 * @zh num_segments - 曲线细分段数；0 由 ImGui 自动选择。
 * @ja num_segments - 曲線を分割する区間数です。0 は ImGui が自動選択します。
 * @ko num_segments - 곡선 분할 구간 수입니다. 0은 ImGui가 자동 선택합니다.
 *
 * @param thickness - Stroke thickness in screen pixels.
 * @zh thickness - 描边厚度，单位为屏幕像素。
 * @ja thickness - スクリーンピクセル単位の線の太さです。
 * @ko thickness - 화면 픽셀 단위의 선 두께입니다.
 */
export function ImDrawList_AddEllipseEx(
  self: ImDrawList,
  center: ImVec2Like,
  radius: ImVec2Like,
  col: number,
  rot: number = 0.0,
  num_segments: number = 0,
  thickness: number = 1.0,
): void {
  native.ImDrawList_AddEllipseEx(
    self,
    center,
    radius,
    col,
    rot,
    num_segments,
    thickness,
  );
}

/**
 * Append an ellipse filled with color to the draw list.
 *
 * @zh 向绘制列表添加颜色填充的椭圆。
 * @ja 描画リストに色で塗りつぶした楕円を追加します。
 * @ko 그리기 목록에 색으로 채운 타원 도형을 추가합니다.
 *
 * @remarks
 * Implied rot = 0.0, num_segments = 0
 * @zh
 * 隐含参数：rot = 0.0, num_segments = 0。
 * @ja
 * 暗黙の引数：rot = 0.0, num_segments = 0。
 * @ko
 * 암묵적 인수: rot = 0.0, num_segments = 0.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param center - Shape center in absolute screen coordinates.
 * @zh center - 形状中心，使用绝对屏幕坐标。
 * @ja center - 形状の中心を絶対スクリーン座標で指定します。
 * @ko center - 도형 중심의 절대 화면 좌표입니다.
 *
 * @param radius - Horizontal and vertical ellipse radii in pixels, before
 * rotation.
 * @zh radius - 旋转前椭圆的水平和垂直像素半径。
 * @ja radius - 回転前の楕円の水平・垂直ピクセル半径です。
 * @ko radius - 회전 전 타원의 가로 및 세로 픽셀 반지름입니다。
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddEllipseFilled(
  self: ImDrawList,
  center: ImVec2Like,
  radius: ImVec2Like,
  col: number,
): void {
  native.ImDrawList_AddEllipseFilled(self, center, radius, col);
}

/**
 * Append an ellipse filled with color to the draw list.
 *
 * @zh 向绘制列表添加颜色填充的椭圆。
 * @ja 描画リストに色で塗りつぶした楕円を追加します。
 * @ko 그리기 목록에 색으로 채운 타원 도형을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param center - Shape center in absolute screen coordinates.
 * @zh center - 形状中心，使用绝对屏幕坐标。
 * @ja center - 形状の中心を絶対スクリーン座標で指定します。
 * @ko center - 도형 중심의 절대 화면 좌표입니다.
 *
 * @param radius - Horizontal and vertical ellipse radii in pixels, before
 * rotation.
 * @zh radius - 旋转前椭圆的水平和垂直像素半径。
 * @ja radius - 回転前の楕円の水平・垂直ピクセル半径です。
 * @ko radius - 회전 전 타원의 가로 및 세로 픽셀 반지름입니다。
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param rot - Ellipse rotation angle in radians.
 * @zh rot - 椭圆旋转角度，单位为弧度。
 * @ja rot - 楕円の回転角です。単位はラジアンです。
 * @ko rot - 타원 회전 각도이며 단위는 라디안입니다.
 *
 * @param num_segments - Curve tessellation segment count; 0 lets ImGui choose
 * automatically.
 * @zh num_segments - 曲线细分段数；0 由 ImGui 自动选择。
 * @ja num_segments - 曲線を分割する区間数です。0 は ImGui が自動選択します。
 * @ko num_segments - 곡선 분할 구간 수입니다. 0은 ImGui가 자동 선택합니다.
 */
export function ImDrawList_AddEllipseFilledEx(
  self: ImDrawList,
  center: ImVec2Like,
  radius: ImVec2Like,
  col: number,
  rot: number = 0.0,
  num_segments: number = 0,
): void {
  native.ImDrawList_AddEllipseFilledEx(
    self,
    center,
    radius,
    col,
    rot,
    num_segments,
  );
}

/**
 * Append a stroked cubic Bezier curve to the draw list.
 *
 * @zh 向绘制列表添加描边的三次贝塞尔曲线。
 * @ja 描画リストに 3 次ベジェ曲線のストロークを追加します。
 * @ko 그리기 목록에 획으로 그린 3차 베지어 곡선을 추가합니다.
 *
 * @remarks
 * Cubic Bezier (4 control points)
 * @zh
 * 三次贝塞尔曲线（4 个控制点）。
 * @ja
 * 3 次ベジェ曲線（制御点 4 個）。
 * @ko
 * 3차 베지에 곡선(제어점 4개).
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p1 - Ordered vertex or start point p1 in absolute screen coordinates.
 * @zh p1 - 绝对屏幕坐标中的有序顶点或起点 p1。
 * @ja p1 - 絶対スクリーン座標の順序付き頂点または始点 p1 です。
 * @ko p1 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p1입니다.
 *
 * @param p2 - Bezier control point p2 in absolute screen coordinates.
 * @zh p2 - 绝对屏幕坐标中的贝塞尔控制点 p2。
 * @ja p2 - 絶対スクリーン座標のベジェ制御点 p2 です。
 * @ko p2 - 절대 화면 좌표의 베지어 제어점 p2입니다.
 *
 * @param p3 - Bezier control point p3 in absolute screen coordinates.
 * @zh p3 - 绝对屏幕坐标中的贝塞尔控制点 p3。
 * @ja p3 - 絶対スクリーン座標のベジェ制御点 p3 です。
 * @ko p3 - 절대 화면 좌표의 베지어 제어점 p3입니다.
 *
 * @param p4 - Bezier end point p4 in absolute screen coordinates.
 * @zh p4 - 绝对屏幕坐标中的贝塞尔终点 p4。
 * @ja p4 - 絶対スクリーン座標のベジェ終点 p4 です。
 * @ko p4 - 절대 화면 좌표의 베지어 끝점 p4입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param thickness - Stroke thickness in screen pixels.
 * @zh thickness - 描边厚度，单位为屏幕像素。
 * @ja thickness - スクリーンピクセル単位の線の太さです。
 * @ko thickness - 화면 픽셀 단위의 선 두께입니다.
 *
 * @param num_segments - Curve tessellation segment count; 0 lets ImGui choose
 * automatically.
 * @zh num_segments - 曲线细分段数；0 由 ImGui 自动选择。
 * @ja num_segments - 曲線を分割する区間数です。0 は ImGui が自動選択します。
 * @ko num_segments - 곡선 분할 구간 수입니다. 0은 ImGui가 자동 선택합니다.
 */
export function ImDrawList_AddBezierCubic(
  self: ImDrawList,
  p1: ImVec2Like,
  p2: ImVec2Like,
  p3: ImVec2Like,
  p4: ImVec2Like,
  col: number,
  thickness: number,
  num_segments: number = 0,
): void {
  native.ImDrawList_AddBezierCubic(
    self,
    p1,
    p2,
    p3,
    p4,
    col,
    thickness,
    num_segments,
  );
}

/**
 * Append a stroked quadratic Bezier curve to the draw list.
 *
 * @zh 向绘制列表添加描边的二次贝塞尔曲线。
 * @ja 描画リストに 2 次ベジェ曲線のストロークを追加します。
 * @ko 그리기 목록에 획으로 그린 2차 베지어 곡선을 추가합니다.
 *
 * @remarks
 * Quadratic Bezier (3 control points)
 * @zh
 * 二次贝塞尔曲线（3 个控制点）。
 * @ja
 * 2 次ベジェ曲線（制御点 3 個）。
 * @ko
 * 2차 베지에 곡선(제어점 3개).
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param p1 - Ordered vertex or start point p1 in absolute screen coordinates.
 * @zh p1 - 绝对屏幕坐标中的有序顶点或起点 p1。
 * @ja p1 - 絶対スクリーン座標の順序付き頂点または始点 p1 です。
 * @ko p1 - 절대 화면 좌표의 순서 있는 정점 또는 시작점 p1입니다.
 *
 * @param p2 - Bezier control point p2 in absolute screen coordinates.
 * @zh p2 - 绝对屏幕坐标中的贝塞尔控制点 p2。
 * @ja p2 - 絶対スクリーン座標のベジェ制御点 p2 です。
 * @ko p2 - 절대 화면 좌표의 베지어 제어점 p2입니다.
 *
 * @param p3 - Bezier end point p3 in absolute screen coordinates.
 * @zh p3 - 绝对屏幕坐标中的贝塞尔终点 p3。
 * @ja p3 - 絶対スクリーン座標のベジェ終点 p3 です。
 * @ko p3 - 절대 화면 좌표의 베지어 끝점 p3입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param thickness - Stroke thickness in screen pixels.
 * @zh thickness - 描边厚度，单位为屏幕像素。
 * @ja thickness - スクリーンピクセル単位の線の太さです。
 * @ko thickness - 화면 픽셀 단위의 선 두께입니다.
 *
 * @param num_segments - Curve tessellation segment count; 0 lets ImGui choose
 * automatically.
 * @zh num_segments - 曲线细分段数；0 由 ImGui 自动选择。
 * @ja num_segments - 曲線を分割する区間数です。0 は ImGui が自動選択します。
 * @ko num_segments - 곡선 분할 구간 수입니다. 0은 ImGui가 자동 선택합니다.
 */
export function ImDrawList_AddBezierQuadratic(
  self: ImDrawList,
  p1: ImVec2Like,
  p2: ImVec2Like,
  p3: ImVec2Like,
  col: number,
  thickness: number,
  num_segments: number = 0,
): void {
  native.ImDrawList_AddBezierQuadratic(
    self,
    p1,
    p2,
    p3,
    col,
    thickness,
    num_segments,
  );
}

/**
 * Add a polyline to the draw list.
 *
 * @zh 向绘制列表添加折线。
 * @ja 描画リストに折れ線を追加します。
 * @ko 그리기 목록에 폴리라인을 추가합니다.
 *
 * @remarks
 * - Only simple polygons are supported by filling functions (no
 *   self-intersections, no holes).
 *
 * - Concave polygon fill is more expensive than convex one: it has O(N^2)
 *   complexity. Provided as a convenience for the user but not used by the main
 *   library.
 * @zh
 * 一般多边形。
 *
 * - 填充函数仅支持简单多边形（无自相交、无孔洞）。
 *
 * - 凹多边形填充比凸多边形昂贵，复杂度为 O(N^2)。此功能是为方便用户提供的，主库自身并不使用。
 * @ja
 * 一般的な多角形。
 *
 * - 塗りつぶし関数は単純多角形のみ対応します（自己交差や穴は不可）。
 *
 * - 凹多角形の塗りつぶしは凸多角形より高コストで、計算量は O(N^2) です。ユーザーの便宜のための機能で、ライブラリ本体では使いません。
 * @ko
 * 일반 다각형.
 *
 * - 채우기 함수는 단순 다각형만 지원합니다(자기 교차와 구멍 없음).
 *
 * - 오목 다각형 채우기는 볼록 다각형보다 비싸며 복잡도는 O(N^2)입니다. 사용자 편의를 위해 제공되며 주 라이브러리에서는 사용하지
 *   않습니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param points - Float32Array of consecutive [x,y] points in screen
 * coordinates; provide at least 2 * num_points elements. Filled polygons
 * require clockwise order. Pass Float32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh points - 连续 [x,y] 屏幕坐标组成的 Float32Array，至少含 2 * num_points
 * 个元素；填充多边形须按顺时针排列。 请传入 Float32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja points - 連続したスクリーン座標 [x,y] の Float32Array です。最低 2 * num_points
 * 要素が必要で、塗りつぶし多角形は時計回りにします。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko points - 연속된 화면 좌표 [x,y]의 Float32Array입니다. 최소 2 * num_points개 요소가 필요하며 채운
 * 다각형은 시계 방향이어야 합니다. JS 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접
 * 사용합니다。
 *
 * @param num_points - Number of coordinate pairs to read from points.
 * @zh num_points - 从 points 读取的坐标对数量。
 * @ja num_points - points から読み込む座標ペア数です。
 * @ko num_points - points에서 읽을 좌표 쌍 수입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param flags - ImDrawFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImDrawFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImDrawFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImDrawFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param thickness - Stroke thickness in screen pixels.
 * @zh thickness - 描边厚度，单位为屏幕像素。
 * @ja thickness - スクリーンピクセル単位の線の太さです。
 * @ko thickness - 화면 픽셀 단위의 선 두께입니다.
 */
export function ImDrawList_AddPolyline(
  self: ImDrawList,
  points: Float32Array,
  num_points: number,
  col: number,
  flags: number,
  thickness: number,
): void {
  native.ImDrawList_AddPolyline(
    self,
    points,
    num_points,
    col,
    flags,
    thickness,
  );
}

/**
 * Append a filled convex polygon to the draw list.
 *
 * @zh 向绘制列表添加填充的凸多边形。
 * @ja 描画リストに塗りつぶした凸多角形を追加します。
 * @ko 그리기 목록에 채워진 볼록 다각형을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param points - Float32Array of consecutive [x,y] points in screen
 * coordinates; provide at least 2 * num_points elements. Filled polygons
 * require clockwise order. Pass Float32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh points - 连续 [x,y] 屏幕坐标组成的 Float32Array，至少含 2 * num_points
 * 个元素；填充多边形须按顺时针排列。 请传入 Float32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja points - 連続したスクリーン座標 [x,y] の Float32Array です。最低 2 * num_points
 * 要素が必要で、塗りつぶし多角形は時計回りにします。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko points - 연속된 화면 좌표 [x,y]의 Float32Array입니다. 최소 2 * num_points개 요소가 필요하며 채운
 * 다각형은 시계 방향이어야 합니다. JS 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접
 * 사용합니다。
 *
 * @param num_points - Number of coordinate pairs to read from points.
 * @zh num_points - 从 points 读取的坐标对数量。
 * @ja num_points - points から読み込む座標ペア数です。
 * @ko num_points - points에서 읽을 좌표 쌍 수입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddConvexPolyFilled(
  self: ImDrawList,
  points: Float32Array,
  num_points: number,
  col: number,
): void {
  native.ImDrawList_AddConvexPolyFilled(self, points, num_points, col);
}

/**
 * Append a filled concave polygon without holes or self-intersections to the
 * draw list.
 *
 * @zh 向绘制列表添加无孔洞且不自交的填充凹多边形。
 * @ja 描画リストに穴や自己交差のない、塗りつぶした凹多角形を追加します。
 * @ko 그리기 목록에 구멍이나 자기 교차가 없는 채워진 오목 다각형을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param points - Float32Array of consecutive [x,y] points in screen
 * coordinates; provide at least 2 * num_points elements. Filled polygons
 * require clockwise order. Pass Float32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh points - 连续 [x,y] 屏幕坐标组成的 Float32Array，至少含 2 * num_points
 * 个元素；填充多边形须按顺时针排列。 请传入 Float32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja points - 連続したスクリーン座標 [x,y] の Float32Array です。最低 2 * num_points
 * 要素が必要で、塗りつぶし多角形は時計回りにします。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko points - 연속된 화면 좌표 [x,y]의 Float32Array입니다. 최소 2 * num_points개 요소가 필요하며 채운
 * 다각형은 시계 방향이어야 합니다. JS 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접
 * 사용합니다。
 *
 * @param num_points - Number of coordinate pairs to read from points.
 * @zh num_points - 从 points 读取的坐标对数量。
 * @ja num_points - points から読み込む座標ペア数です。
 * @ko num_points - points에서 읽을 좌표 쌍 수입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddConcavePolyFilled(
  self: ImDrawList,
  points: Float32Array,
  num_points: number,
  col: number,
): void {
  native.ImDrawList_AddConcavePolyFilled(self, points, num_points, col);
}
