import { native } from '../internal/native';
import type { ImVec2Like, ImDrawList } from '../types';

/**
 * Add an image rectangle to the draw list.
 *
 * @zh 向绘制列表添加图像矩形。
 * @ja 描画リストに矩形の画像を追加します。
 * @ko 그리기 목록에 이미지 사각형을 추가합니다.
 *
 * @remarks
 * - Read FAQ to understand what ImTextureID is.
 *
 * - "p_min" and "p_max" represent the upper-left and lower-right corners of the
 *   rectangle.
 *
 * - "uv_min" and "uv_max" represent the normalized texture coordinates to use
 *   for those corners. Using (0,0)->(1,1) texture coordinates will generally
 *   display the entire texture.
 *
 * Implied uv_min = { x: 0, y: 0 }, uv_max = { x: 1, y: 1 }, col = 0xffffffff
 * @zh
 * 图像图元。
 *
 * - 请阅读 FAQ 了解 ImTextureID。
 *
 * - "p_min" 和 "p_max" 表示矩形左上角和右下角。
 *
 * - "uv_min" 和 "uv_max" 表示这些角使用的归一化纹理坐标。(0,0)->(1,1) 通常显示整张纹理。
 *
 * 隐含参数：uv_min = { x: 0, y: 0 }, uv_max = { x: 1, y: 1 }, col = 0xffffffff。
 * @ja
 * 画像プリミティブ。
 *
 * - ImTextureID については FAQ を読んでください。
 *
 * - "p_min" と "p_max" は矩形の左上隅と右下隅です。
 *
 * - "uv_min" と "uv_max" は各隅に使う正規化テクスチャ座標です。(0,0)->(1,1) では通常テクスチャ全体を表示します。
 *
 * 暗黙の引数：uv_min = { x: 0, y: 0 }, uv_max = { x: 1, y: 1 }, col = 0xffffffff。
 * @ko
 * 이미지 프리미티브.
 *
 * - ImTextureID는 FAQ를 읽어 이해하세요.
 *
 * - "p_min"과 "p_max"는 사각형의 왼쪽 위와 오른쪽 아래 모서리입니다.
 *
 * - "uv_min"과 "uv_max"는 각 모서리에 사용할 정규화된 텍스처 좌표입니다. (0,0)->(1,1)은 일반적으로 전체 텍스처를
 *   표시합니다.
 *
 * 암묵적 인수: uv_min = { x: 0, y: 0 }, uv_max = { x: 1, y: 1 }, col = 0xffffffff.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param user_texture_id - Renderer texture identifier (ImTextureID bigint),
 * not an SFML texture object.
 * @zh user_texture_id - 渲染器纹理标识符（ImTextureID bigint），不是 SFML 纹理对象。
 * @ja user_texture_id - レンダラーのテクスチャ識別子（ImTextureID の bigint）です。SFML
 * テクスチャオブジェクトではありません。
 * @ko user_texture_id - 렌더러 텍스처 식별자(ImTextureID bigint)이며 SFML 텍스처 객체가 아닙니다.
 *
 * @param p_min - Address of the lower/upper bound in data_type layout; drag
 * widgets permit null for an unbounded side.
 * @zh p_min - 以 data_type 布局存储的下限或上限地址；拖动控件可用 null 表示该侧无界。
 * @ja p_min - data_type 形式の下限または上限のアドレスです。ドラッグでは null でその側の制限を省略できます。
 * @ko p_min - data_type 형식의 하한 또는 상한 주소입니다. 드래그 위젯에서는 null로 해당 제한을 생략할 수 있습니다.
 *
 * @param p_max - Address of the lower/upper bound in data_type layout; drag
 * widgets permit null for an unbounded side.
 * @zh p_max - 以 data_type 布局存储的下限或上限地址；拖动控件可用 null 表示该侧无界。
 * @ja p_max - data_type 形式の下限または上限のアドレスです。ドラッグでは null でその側の制限を省略できます。
 * @ko p_max - data_type 형식의 하한 또는 상한 주소입니다. 드래그 위젯에서는 null로 해당 제한을 생략할 수 있습니다.
 */
export function ImDrawList_AddImage(
  self: ImDrawList,
  user_texture_id: bigint,
  p_min: ImVec2Like,
  p_max: ImVec2Like,
): void {
  native.ImDrawList_AddImage(self, user_texture_id, p_min, p_max);
}

/**
 * Append a textured axis-aligned rectangle to the draw list.
 *
 * @zh 向绘制列表添加带纹理的轴对齐矩形。
 * @ja 描画リストにテクスチャ付きの軸に平行な長方形を追加します。
 * @ko 그리기 목록에 텍스처가 적용된 축 정렬 직사각형을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param user_texture_id - Renderer texture identifier (ImTextureID bigint),
 * not an SFML texture object.
 * @zh user_texture_id - 渲染器纹理标识符（ImTextureID bigint），不是 SFML 纹理对象。
 * @ja user_texture_id - レンダラーのテクスチャ識別子（ImTextureID の bigint）です。SFML
 * テクスチャオブジェクトではありません。
 * @ko user_texture_id - 렌더러 텍스처 식별자(ImTextureID bigint)이며 SFML 텍스처 객체가 아닙니다.
 *
 * @param p_min - Address of the lower/upper bound in data_type layout; drag
 * widgets permit null for an unbounded side.
 * @zh p_min - 以 data_type 布局存储的下限或上限地址；拖动控件可用 null 表示该侧无界。
 * @ja p_min - data_type 形式の下限または上限のアドレスです。ドラッグでは null でその側の制限を省略できます。
 * @ko p_min - data_type 형식의 하한 또는 상한 주소입니다. 드래그 위젯에서는 null로 해당 제한을 생략할 수 있습니다.
 *
 * @param p_max - Address of the lower/upper bound in data_type layout; drag
 * widgets permit null for an unbounded side.
 * @zh p_max - 以 data_type 布局存储的下限或上限地址；拖动控件可用 null 表示该侧无界。
 * @ja p_max - data_type 形式の下限または上限のアドレスです。ドラッグでは null でその側の制限を省略できます。
 * @ko p_max - data_type 형식의 하한 또는 상한 주소입니다. 드래그 위젯에서는 null로 해당 제한을 생략할 수 있습니다.
 *
 * @param uv_min - Texture coordinates at the upper-left corner; (0,0) is the
 * usual full-image start.
 * @zh uv_min - 左上角纹理坐标；完整图像通常从 (0,0) 开始。
 * @ja uv_min - 左上のテクスチャ座標です。画像全体では通常 (0,0) を使います。
 * @ko uv_min - 왼쪽 위 텍스처 좌표입니다. 전체 이미지는 보통 (0,0)에서 시작합니다.
 *
 * @param uv_max - Texture coordinates at the lower-right corner; (1,1) is the
 * usual full-image end.
 * @zh uv_max - 右下角纹理坐标；完整图像通常以 (1,1) 结束。
 * @ja uv_max - 右下のテクスチャ座標です。画像全体では通常 (1,1) を使います。
 * @ko uv_max - 오른쪽 아래 텍스처 좌표입니다. 전체 이미지는 보통 (1,1)에서 끝납니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddImageEx(
  self: ImDrawList,
  user_texture_id: bigint,
  p_min: ImVec2Like,
  p_max: ImVec2Like,
  uv_min: ImVec2Like = { x: 0, y: 0 },
  uv_max: ImVec2Like = { x: 1, y: 1 },
  col: number,
): void {
  native.ImDrawList_AddImageEx(
    self,
    user_texture_id,
    p_min,
    p_max,
    uv_min,
    uv_max,
    col,
  );
}

/**
 * Append a textured quadrilateral to the draw list.
 *
 * @zh 向绘制列表添加带纹理的四边形。
 * @ja 描画リストにテクスチャ付きの四角形を追加します。
 * @ko 그리기 목록에 텍스처가 적용된 사각형을 추가합니다.
 *
 * @remarks
 * Implied uv1 = { x: 0, y: 0 }, uv2 = { x: 1, y: 0 }, uv3 = { x: 1, y: 1 }, uv4
 * =
 * { x: 0, y: 1 }, col = 0xffffffff
 * @zh
 * 隐含参数：uv1 = { x: 0, y: 0 }, uv2 = { x: 1, y: 0 }, uv3 = { x: 1, y: 1 }, uv4 =
 * { x: 0, y: 1 }, col = 0xffffffff。
 * @ja
 * 暗黙の引数：uv1 = { x: 0, y: 0 }, uv2 = { x: 1, y: 0 }, uv3 = { x: 1, y: 1 }, uv4 =
 * { x: 0, y: 1 }, col = 0xffffffff。
 * @ko
 * 암묵적 인수: uv1 = { x: 0, y: 0 }, uv2 = { x: 1, y: 0 }, uv3 = { x: 1, y: 1 }, uv4
 * =
 * { x: 0, y: 1 }, col = 0xffffffff.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param user_texture_id - Renderer texture identifier (ImTextureID bigint),
 * not an SFML texture object.
 * @zh user_texture_id - 渲染器纹理标识符（ImTextureID bigint），不是 SFML 纹理对象。
 * @ja user_texture_id - レンダラーのテクスチャ識別子（ImTextureID の bigint）です。SFML
 * テクスチャオブジェクトではありません。
 * @ko user_texture_id - 렌더러 텍스처 식별자(ImTextureID bigint)이며 SFML 텍스처 객체가 아닙니다.
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
 */
export function ImDrawList_AddImageQuad(
  self: ImDrawList,
  user_texture_id: bigint,
  p1: ImVec2Like,
  p2: ImVec2Like,
  p3: ImVec2Like,
  p4: ImVec2Like,
): void {
  native.ImDrawList_AddImageQuad(self, user_texture_id, p1, p2, p3, p4);
}

/**
 * Append a textured quadrilateral to the draw list.
 *
 * @zh 向绘制列表添加带纹理的四边形。
 * @ja 描画リストにテクスチャ付きの四角形を追加します。
 * @ko 그리기 목록에 텍스처가 적용된 사각형을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param user_texture_id - Renderer texture identifier (ImTextureID bigint),
 * not an SFML texture object.
 * @zh user_texture_id - 渲染器纹理标识符（ImTextureID bigint），不是 SFML 纹理对象。
 * @ja user_texture_id - レンダラーのテクスチャ識別子（ImTextureID の bigint）です。SFML
 * テクスチャオブジェクトではありません。
 * @ko user_texture_id - 렌더러 텍스처 식별자(ImTextureID bigint)이며 SFML 텍스처 객체가 아닙니다.
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
 * @param uv1 - Texture coordinates corresponding to vertex p1.
 * @zh uv1 - 与顶点 p1 对应的纹理坐标。
 * @ja uv1 - 頂点 p1 に対応するテクスチャ座標です。
 * @ko uv1 - 정점 p1에 대응하는 텍스처 좌표입니다.
 *
 * @param uv2 - Texture coordinates corresponding to vertex p2.
 * @zh uv2 - 与顶点 p2 对应的纹理坐标。
 * @ja uv2 - 頂点 p2 に対応するテクスチャ座標です。
 * @ko uv2 - 정점 p2에 대응하는 텍스처 좌표입니다.
 *
 * @param uv3 - Texture coordinates corresponding to vertex p3.
 * @zh uv3 - 与顶点 p3 对应的纹理坐标。
 * @ja uv3 - 頂点 p3 に対応するテクスチャ座標です。
 * @ko uv3 - 정점 p3에 대응하는 텍스처 좌표입니다.
 *
 * @param uv4 - Texture coordinates corresponding to vertex p4.
 * @zh uv4 - 与顶点 p4 对应的纹理坐标。
 * @ja uv4 - 頂点 p4 に対応するテクスチャ座標です。
 * @ko uv4 - 정점 p4에 대응하는 텍스처 좌표입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_AddImageQuadEx(
  self: ImDrawList,
  user_texture_id: bigint,
  p1: ImVec2Like,
  p2: ImVec2Like,
  p3: ImVec2Like,
  p4: ImVec2Like,
  uv1: ImVec2Like = { x: 0, y: 0 },
  uv2: ImVec2Like = { x: 1, y: 0 },
  uv3: ImVec2Like = { x: 1, y: 1 },
  uv4: ImVec2Like = { x: 0, y: 1 },
  col: number,
): void {
  native.ImDrawList_AddImageQuadEx(
    self,
    user_texture_id,
    p1,
    p2,
    p3,
    p4,
    uv1,
    uv2,
    uv3,
    uv4,
    col,
  );
}

/**
 * Append a textured rectangle with rounded corners to the draw list.
 *
 * @zh 向绘制列表添加带纹理的圆角矩形。
 * @ja 描画リストにテクスチャ付きの角丸長方形を追加します。
 * @ko 그리기 목록에 텍스처가 적용된 둥근 모서리 직사각형을 추가합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param user_texture_id - Renderer texture identifier (ImTextureID bigint),
 * not an SFML texture object.
 * @zh user_texture_id - 渲染器纹理标识符（ImTextureID bigint），不是 SFML 纹理对象。
 * @ja user_texture_id - レンダラーのテクスチャ識別子（ImTextureID の bigint）です。SFML
 * テクスチャオブジェクトではありません。
 * @ko user_texture_id - 렌더러 텍스처 식별자(ImTextureID bigint)이며 SFML 텍스처 객체가 아닙니다.
 *
 * @param p_min - Address of the lower/upper bound in data_type layout; drag
 * widgets permit null for an unbounded side.
 * @zh p_min - 以 data_type 布局存储的下限或上限地址；拖动控件可用 null 表示该侧无界。
 * @ja p_min - data_type 形式の下限または上限のアドレスです。ドラッグでは null でその側の制限を省略できます。
 * @ko p_min - data_type 형식의 하한 또는 상한 주소입니다. 드래그 위젯에서는 null로 해당 제한을 생략할 수 있습니다.
 *
 * @param p_max - Address of the lower/upper bound in data_type layout; drag
 * widgets permit null for an unbounded side.
 * @zh p_max - 以 data_type 布局存储的下限或上限地址；拖动控件可用 null 表示该侧无界。
 * @ja p_max - data_type 形式の下限または上限のアドレスです。ドラッグでは null でその側の制限を省略できます。
 * @ko p_max - data_type 형식의 하한 또는 상한 주소입니다. 드래그 위젯에서는 null로 해당 제한을 생략할 수 있습니다.
 *
 * @param uv_min - Texture coordinates at the upper-left corner; (0,0) is the
 * usual full-image start.
 * @zh uv_min - 左上角纹理坐标；完整图像通常从 (0,0) 开始。
 * @ja uv_min - 左上のテクスチャ座標です。画像全体では通常 (0,0) を使います。
 * @ko uv_min - 왼쪽 위 텍스처 좌표입니다. 전체 이미지는 보통 (0,0)에서 시작합니다.
 *
 * @param uv_max - Texture coordinates at the lower-right corner; (1,1) is the
 * usual full-image end.
 * @zh uv_max - 右下角纹理坐标；完整图像通常以 (1,1) 结束。
 * @ja uv_max - 右下のテクスチャ座標です。画像全体では通常 (1,1) を使います。
 * @ko uv_max - 오른쪽 아래 텍스처 좌표입니다. 전체 이미지는 보통 (1,1)에서 끝납니다.
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
export function ImDrawList_AddImageRounded(
  self: ImDrawList,
  user_texture_id: bigint,
  p_min: ImVec2Like,
  p_max: ImVec2Like,
  uv_min: ImVec2Like,
  uv_max: ImVec2Like,
  col: number,
  rounding: number,
  flags: number = 0,
): void {
  native.ImDrawList_AddImageRounded(
    self,
    user_texture_id,
    p_min,
    p_max,
    uv_min,
    uv_max,
    col,
    rounding,
    flags,
  );
}
