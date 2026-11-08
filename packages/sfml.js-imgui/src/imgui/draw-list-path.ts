import { native } from '../internal/native';
import type { ImVec2Like, ImDrawList } from '../types';

/**
 * Clear the current path.
 *
 * @zh 清空当前路径。
 * @ja 現在のパスをクリアします。
 * @ko 현재 경로를 비웁니다.
 *
 * @remarks
 * Append points to the path, then finish with
 * `ImDrawList_PathFillConvex(self, col)`
 * or `ImDrawList_PathStroke(self, col)`.
 *
 * Filled shapes must use clockwise winding. Counter-clockwise winding puts the
 * anti-aliasing fringe inward.
 * @zh
 * 向路径追加点，然后通过 `ImDrawList_PathFillConvex(self, col)` 或
 * `ImDrawList_PathStroke(self, col)` 完成绘制。
 *
 * 填充形状必须使用顺时针绕序。逆时针绕序会使抗锯齿边缘朝内。
 * @ja
 * パスに点を追加し、`ImDrawList_PathFillConvex(self, col)` または
 * `ImDrawList_PathStroke(self, col)` で描画を完了します。
 *
 * 塗りつぶす形状は時計回りの頂点順にします。反時計回りではアンチエイリアスの縁が内側に向きます。
 * @ko
 * 경로에 점을 추가한 다음 `ImDrawList_PathFillConvex(self, col)` 또는
 * `ImDrawList_PathStroke(self, col)`로 그리기를 완료합니다.
 *
 * 채워진 도형은 시계 방향 정점 순서를 사용해야 합니다. 반시계 방향이면 안티앨리어싱 가장자리가 안쪽으로 향합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 */
export function ImDrawList_PathClear(self: ImDrawList): void {
  native.ImDrawList_PathClear(self);
}

/**
 * Append a point to the current drawing path.
 *
 * @zh 向当前绘制路径添加一个点。
 * @ja 現在の描画パスに点を追加します。
 * @ko 현재 그리기 경로에 점을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 */
export function ImDrawList_PathLineTo(self: ImDrawList, pos: ImVec2Like): void {
  native.ImDrawList_PathLineTo(self, pos);
}

/**
 * Append a path point only when it differs from the last point.
 *
 * @zh 仅当新点与末尾点不同时向路径追加该点。
 * @ja 直前の点と異なる場合にのみパスに点を追加します。
 * @ko 마지막 점과 다른 경우에만 경로에 점을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 */
export function ImDrawList_PathLineToMergeDuplicate(
  self: ImDrawList,
  pos: ImVec2Like,
): void {
  native.ImDrawList_PathLineToMergeDuplicate(self, pos);
}

/**
 * Fill the current convex path and clear its accumulated points.
 *
 * @zh 填充当前凸路径，并清空已累积的点。
 * @ja 現在の凸形状のパスを塗りつぶし、蓄積した点を消去します。
 * @ko 현재 볼록 경로를 채우고 누적된 점을 지웁니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_PathFillConvex(self: ImDrawList, col: number): void {
  native.ImDrawList_PathFillConvex(self, col);
}

/**
 * Fill the current concave path and clear its accumulated points.
 *
 * @zh 填充当前凹路径，并清空已累积的点。
 * @ja 現在の凹形状のパスを塗りつぶし、蓄積した点を消去します。
 * @ko 현재 오목 경로를 채우고 누적된 점을 지웁니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_PathFillConcave(
  self: ImDrawList,
  col: number,
): void {
  native.ImDrawList_PathFillConcave(self, col);
}

/**
 * Stroke the current path as a polyline and clear its accumulated points.
 *
 * @zh 将当前路径描画为折线，并清空已累积的点。
 * @ja 現在のパスを折れ線として描き、蓄積した点を消去します。
 * @ko 현재 경로를 폴리라인으로 그리고 누적된 점을 지웁니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
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
export function ImDrawList_PathStroke(
  self: ImDrawList,
  col: number,
  flags: number = 0,
  thickness: number = 1.0,
): void {
  native.ImDrawList_PathStroke(self, col, flags, thickness);
}

/**
 * Append points along a circular arc to the current path.
 *
 * @zh 沿圆弧向当前路径添加点。
 * @ja 円弧に沿った点を現在のパスに追加します。
 * @ko 현재 경로에 원호를 따라 점을 추가합니다.
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
 * @param a_min - Start/end angle of the arc in radians.
 * @zh a_min - 圆弧的起始或结束角度，单位为弧度。
 * @ja a_min - 円弧の開始または終了角です。単位はラジアンです。
 * @ko a_min - 호의 시작 또는 끝 각도이며 단위는 라디안입니다.
 *
 * @param a_max - Start/end angle of the arc in radians.
 * @zh a_max - 圆弧的起始或结束角度，单位为弧度。
 * @ja a_max - 円弧の開始または終了角です。単位はラジアンです。
 * @ko a_max - 호의 시작 또는 끝 각도이며 단위는 라디안입니다.
 *
 * @param num_segments - Curve tessellation segment count; 0 lets ImGui choose
 * automatically.
 * @zh num_segments - 曲线细分段数；0 由 ImGui 自动选择。
 * @ja num_segments - 曲線を分割する区間数です。0 は ImGui が自動選択します。
 * @ko num_segments - 곡선 분할 구간 수입니다. 0은 ImGui가 자동 선택합니다.
 */
export function ImDrawList_PathArcTo(
  self: ImDrawList,
  center: ImVec2Like,
  radius: number,
  a_min: number,
  a_max: number,
  num_segments: number = 0,
): void {
  native.ImDrawList_PathArcTo(self, center, radius, a_min, a_max, num_segments);
}

/**
 * Append a circular arc using precomputed angles.
 *
 * @zh 使用预计算角度追加圆弧。
 * @ja 事前計算した角度を使って円弧を追加します。
 * @ko 미리 계산한 각도로 원호를 추가합니다.
 *
 * @remarks
 * Use precomputed angles for a 12 steps circle
 * @zh
 * 使用预先计算的角度绘制 12 等分圆。
 * @ja
 * 12 分割の円に事前計算した角度を使います。
 * @ko
 * 12단계 원에 미리 계산한 각도를 사용합니다.
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
 * @param a_min_of_12 - Start/end angle in twelfths of a circle: 0 is right, 3
 * down, 6 left, and 9 up.
 * @zh a_min_of_12 - 以圆周十二分之一计的起始或结束角度：0 向右、3 向下、6 向左、9 向上。
 * @ja a_min_of_12 - 円の 12 分割で表す開始または終了角です。0 は右、3 は下、6 は左、9 は上です。
 * @ko a_min_of_12 - 원을 12등분한 시작 또는 끝 각도입니다. 0은 오른쪽, 3은 아래, 6은 왼쪽, 9는 위입니다.
 *
 * @param a_max_of_12 - Start/end angle in twelfths of a circle: 0 is right, 3
 * down, 6 left, and 9 up.
 * @zh a_max_of_12 - 以圆周十二分之一计的起始或结束角度：0 向右、3 向下、6 向左、9 向上。
 * @ja a_max_of_12 - 円の 12 分割で表す開始または終了角です。0 は右、3 は下、6 は左、9 は上です。
 * @ko a_max_of_12 - 원을 12등분한 시작 또는 끝 각도입니다. 0은 오른쪽, 3은 아래, 6은 왼쪽, 9는 위입니다.
 */
export function ImDrawList_PathArcToFast(
  self: ImDrawList,
  center: ImVec2Like,
  radius: number,
  a_min_of_12: number,
  a_max_of_12: number,
): void {
  native.ImDrawList_PathArcToFast(
    self,
    center,
    radius,
    a_min_of_12,
    a_max_of_12,
  );
}

/**
 * Append an automatically tessellated elliptical arc to the current path.
 *
 * @zh 向当前路径添加自动细分的椭圆弧。
 * @ja 自動分割した楕円弧を現在のパスに追加します。
 * @ko 현재 경로에 자동으로 분할된 타원호를 추가합니다.
 *
 * @remarks
 * Ellipse
 *
 * Implied num_segments = 0
 * @zh
 * 椭圆。
 *
 * 隐含参数：num_segments = 0。
 * @ja
 * 楕円。
 *
 * 暗黙の引数：num_segments = 0。
 * @ko
 * 타원.
 *
 * 암묵적 인수: num_segments = 0.
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
 * @param rot - Ellipse rotation angle in radians.
 * @zh rot - 椭圆旋转角度，单位为弧度。
 * @ja rot - 楕円の回転角です。単位はラジアンです。
 * @ko rot - 타원 회전 각도이며 단위는 라디안입니다.
 *
 * @param a_min - Start/end angle of the arc in radians.
 * @zh a_min - 圆弧的起始或结束角度，单位为弧度。
 * @ja a_min - 円弧の開始または終了角です。単位はラジアンです。
 * @ko a_min - 호의 시작 또는 끝 각도이며 단위는 라디안입니다.
 *
 * @param a_max - Start/end angle of the arc in radians.
 * @zh a_max - 圆弧的起始或结束角度，单位为弧度。
 * @ja a_max - 円弧の開始または終了角です。単位はラジアンです。
 * @ko a_max - 호의 시작 또는 끝 각도이며 단위는 라디안입니다.
 */
export function ImDrawList_PathEllipticalArcTo(
  self: ImDrawList,
  center: ImVec2Like,
  radius: ImVec2Like,
  rot: number,
  a_min: number,
  a_max: number,
): void {
  native.ImDrawList_PathEllipticalArcTo(
    self,
    center,
    radius,
    rot,
    a_min,
    a_max,
  );
}

/**
 * Append an elliptical arc to the current path.
 *
 * @zh 向当前路径追加椭圆弧。
 * @ja 現在のパスに楕円弧を追加します。
 * @ko 현재 경로에 타원호를 추가합니다.
 *
 * @remarks
 * Ellipse
 * @zh
 * 椭圆。
 * @ja
 * 楕円。
 * @ko
 * 타원.
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
 * @param rot - Ellipse rotation angle in radians.
 * @zh rot - 椭圆旋转角度，单位为弧度。
 * @ja rot - 楕円の回転角です。単位はラジアンです。
 * @ko rot - 타원 회전 각도이며 단위는 라디안입니다.
 *
 * @param a_min - Start/end angle of the arc in radians.
 * @zh a_min - 圆弧的起始或结束角度，单位为弧度。
 * @ja a_min - 円弧の開始または終了角です。単位はラジアンです。
 * @ko a_min - 호의 시작 또는 끝 각도이며 단위는 라디안입니다.
 *
 * @param a_max - Start/end angle of the arc in radians.
 * @zh a_max - 圆弧的起始或结束角度，单位为弧度。
 * @ja a_max - 円弧の開始または終了角です。単位はラジアンです。
 * @ko a_max - 호의 시작 또는 끝 각도이며 단위는 라디안입니다.
 *
 * @param num_segments - Curve tessellation segment count; 0 lets ImGui choose
 * automatically.
 * @zh num_segments - 曲线细分段数；0 由 ImGui 自动选择。
 * @ja num_segments - 曲線を分割する区間数です。0 は ImGui が自動選択します。
 * @ko num_segments - 곡선 분할 구간 수입니다. 0은 ImGui가 자동 선택합니다.
 */
export function ImDrawList_PathEllipticalArcToEx(
  self: ImDrawList,
  center: ImVec2Like,
  radius: ImVec2Like,
  rot: number,
  a_min: number,
  a_max: number,
  num_segments: number = 0,
): void {
  native.ImDrawList_PathEllipticalArcToEx(
    self,
    center,
    radius,
    rot,
    a_min,
    a_max,
    num_segments,
  );
}

/**
 * Append a cubic Bezier segment from the current path endpoint without stroking
 * it.
 *
 * @zh 从当前路径终点追加三次贝塞尔曲线段，不进行描边。
 * @ja 現在のパスの終点から 3 次ベジェ曲線を追加し、ストロークは描画しません。
 * @ko 현재 경로 끝점에서 3차 베지어 곡선 구간을 추가하며 획은 그리지 않습니다.
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
 * @param num_segments - Curve tessellation segment count; 0 lets ImGui choose
 * automatically.
 * @zh num_segments - 曲线细分段数；0 由 ImGui 自动选择。
 * @ja num_segments - 曲線を分割する区間数です。0 は ImGui が自動選択します。
 * @ko num_segments - 곡선 분할 구간 수입니다. 0은 ImGui가 자동 선택합니다.
 */
export function ImDrawList_PathBezierCubicCurveTo(
  self: ImDrawList,
  p2: ImVec2Like,
  p3: ImVec2Like,
  p4: ImVec2Like,
  num_segments: number = 0,
): void {
  native.ImDrawList_PathBezierCubicCurveTo(self, p2, p3, p4, num_segments);
}

/**
 * Append a quadratic Bezier segment from the current path endpoint without
 * stroking it.
 *
 * @zh 从当前路径终点追加二次贝塞尔曲线段，不进行描边。
 * @ja 現在のパスの終点から 2 次ベジェ曲線を追加し、ストロークは描画しません。
 * @ko 현재 경로 끝점에서 2차 베지어 곡선 구간을 추가하며 획은 그리지 않습니다.
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
 * @param num_segments - Curve tessellation segment count; 0 lets ImGui choose
 * automatically.
 * @zh num_segments - 曲线细分段数；0 由 ImGui 自动选择。
 * @ja num_segments - 曲線を分割する区間数です。0 は ImGui が自動選択します。
 * @ko num_segments - 곡선 분할 구간 수입니다. 0은 ImGui가 자동 선택합니다.
 */
export function ImDrawList_PathBezierQuadraticCurveTo(
  self: ImDrawList,
  p2: ImVec2Like,
  p3: ImVec2Like,
  num_segments: number = 0,
): void {
  native.ImDrawList_PathBezierQuadraticCurveTo(self, p2, p3, num_segments);
}

/**
 * Append a rectangle, optionally with rounded corners, to the current path.
 *
 * @zh 向当前路径添加矩形，可使用圆角。
 * @ja 必要に応じて角を丸めた長方形を現在のパスに追加します。
 * @ko 현재 경로에 선택적으로 모서리를 둥글게 한 직사각형을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
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
export function ImDrawList_PathRect(
  self: ImDrawList,
  rect_min: ImVec2Like,
  rect_max: ImVec2Like,
  rounding: number = 0.0,
  flags: number = 0,
): void {
  native.ImDrawList_PathRect(self, rect_min, rect_max, rounding, flags);
}
