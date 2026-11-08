import { native } from '../internal/native';
import type { ImVec2Like, ImDrawList } from '../types';

/**
 * Reserve vertex and index space for drawing primitives.
 *
 * @zh 为绘制图元预留顶点和索引空间。
 * @ja 描画プリミティブ用に頂点とインデックスの領域を確保します。
 * @ko 그리기 프리미티브를 위한 정점 및 인덱스 공간을 예약합니다.
 *
 * @remarks
 * - We render triangles (three vertices)
 * - Reserve space for all primitives with ImDrawList_PrimReserve(self,
 *   idx_count, vtx_count) beforehand.
 * @zh
 * 高级：图元分配。
 *
 * - 渲染的是三角形（三个顶点）。
 *
 * - 所有图元都必须预先通过 ImDrawList_PrimReserve(self, idx_count, vtx_count) 预留空间。
 * @ja
 * 高度な機能：プリミティブの割り当て。
 *
 * - 三角形（頂点 3 個）を描画します。
 *
 * - すべてのプリミティブは事前に ImDrawList_PrimReserve(self, idx_count, vtx_count)
 *   で領域を確保する必要があります。
 * @ko
 * 고급: 프리미티브 할당.
 *
 * - 삼각형(정점 3개)을 렌더링합니다.
 *
 * - 모든 프리미티브는 미리 ImDrawList_PrimReserve(self, idx_count, vtx_count)로 공간을 확보해야
 *   합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param idx_count - Number of index/vertex entries to reserve or release in
 * the current draw-list buffers.
 * @zh idx_count - 在当前绘制列表缓冲区中预留或释放的索引或顶点条目数。
 * @ja idx_count - 現在の描画リストで確保または解放するインデックス・頂点の要素数です。
 * @ko idx_count - 현재 그리기 목록 버퍼에서 예약하거나 해제할 인덱스 또는 정점 항목 수입니다.
 *
 * @param vtx_count - Number of index/vertex entries to reserve or release in
 * the current draw-list buffers.
 * @zh vtx_count - 在当前绘制列表缓冲区中预留或释放的索引或顶点条目数。
 * @ja vtx_count - 現在の描画リストで確保または解放するインデックス・頂点の要素数です。
 * @ko vtx_count - 현재 그리기 목록 버퍼에서 예약하거나 해제할 인덱스 또는 정점 항목 수입니다.
 */
export function ImDrawList_PrimReserve(
  self: ImDrawList,
  idx_count: number,
  vtx_count: number,
): void {
  native.ImDrawList_PrimReserve(self, idx_count, vtx_count);
}

/**
 * Release unused vertices and indices from the end of the latest primitive
 * reservation.
 *
 * @zh 从最近一次图元预留空间的末尾释放未使用的顶点和索引。
 * @ja 直近に確保したプリミティブ領域の末尾から未使用の頂点とインデックスを戻します。
 * @ko 가장 최근에 예약한 프리미티브 공간 끝에서 사용하지 않은 정점과 인덱스를 반환합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param idx_count - Number of index/vertex entries to reserve or release in
 * the current draw-list buffers.
 * @zh idx_count - 在当前绘制列表缓冲区中预留或释放的索引或顶点条目数。
 * @ja idx_count - 現在の描画リストで確保または解放するインデックス・頂点の要素数です。
 * @ko idx_count - 현재 그리기 목록 버퍼에서 예약하거나 해제할 인덱스 또는 정점 항목 수입니다.
 *
 * @param vtx_count - Number of index/vertex entries to reserve or release in
 * the current draw-list buffers.
 * @zh vtx_count - 在当前绘制列表缓冲区中预留或释放的索引或顶点条目数。
 * @ja vtx_count - 現在の描画リストで確保または解放するインデックス・頂点の要素数です。
 * @ko vtx_count - 현재 그리기 목록 버퍼에서 예약하거나 해제할 인덱스 또는 정점 항목 수입니다.
 */
export function ImDrawList_PrimUnreserve(
  self: ImDrawList,
  idx_count: number,
  vtx_count: number,
): void {
  native.ImDrawList_PrimUnreserve(self, idx_count, vtx_count);
}

/**
 * Write an axis-aligned rectangle as two triangles.
 *
 * @zh 将轴对齐矩形写入为两个三角形。
 * @ja 軸に平行な矩形を 2 つの三角形として書き込みます。
 * @ko 축에 정렬된 사각형을 두 삼각형으로 기록합니다.
 *
 * @remarks
 * Axis aligned rectangle (composed of two triangles)
 * @zh
 * 轴对齐矩形（由两个三角形组成）。
 * @ja
 * 軸に平行な矩形（三角形 2 個で構成）。
 * @ko
 * 축 정렬 사각형(삼각형 두 개로 구성).
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param a - Top-left corner of the rectangle in absolute screen coordinates.
 * @zh a - 矩形左上角，使用绝对屏幕坐标。
 * @ja a - 矩形の左上を絶対スクリーン座標で指定します。
 * @ko a - 사각형 왼쪽 위의 절대 화면 좌표입니다.
 *
 * @param b - Bottom-right corner of the rectangle in absolute screen
 * coordinates.
 * @zh b - 矩形右下角，使用绝对屏幕坐标。
 * @ja b - 矩形の右下を絶対スクリーン座標で指定します。
 * @ko b - 사각형 오른쪽 아래의 절대 화면 좌표입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_PrimRect(
  self: ImDrawList,
  a: ImVec2Like,
  b: ImVec2Like,
  col: number,
): void {
  native.ImDrawList_PrimRect(self, a, b, col);
}

/**
 * Write an axis-aligned rectangle with UVs into pre-reserved vertex and index
 * space.
 *
 * @zh 将带 UV 坐标的轴对齐矩形写入预留的顶点和索引空间。
 * @ja UV 座標付きの軸に平行な長方形を予約済みの頂点・インデックス領域に書き込みます。
 * @ko UV 좌표가 있는 축 정렬 직사각형을 미리 예약한 정점 및 인덱스 공간에 씁니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param a - Top-left corner of the rectangle in absolute screen coordinates.
 * @zh a - 矩形左上角，使用绝对屏幕坐标。
 * @ja a - 矩形の左上を絶対スクリーン座標で指定します。
 * @ko a - 사각형 왼쪽 위의 절대 화면 좌표입니다.
 *
 * @param b - Bottom-right corner of the rectangle in absolute screen
 * coordinates.
 * @zh b - 矩形右下角，使用绝对屏幕坐标。
 * @ja b - 矩形の右下を絶対スクリーン座標で指定します。
 * @ko b - 사각형 오른쪽 아래의 절대 화면 좌표입니다.
 *
 * @param uv_a - Texture UV coordinates for the corresponding vertex.
 * @zh uv_a - 对应顶点的纹理 UV 坐标。
 * @ja uv_a - 対応する頂点のテクスチャ UV 座標です。
 * @ko uv_a - 해당 정점의 텍스처 UV 좌표입니다.
 *
 * @param uv_b - Texture UV coordinates for the corresponding vertex.
 * @zh uv_b - 对应顶点的纹理 UV 坐标。
 * @ja uv_b - 対応する頂点のテクスチャ UV 座標です。
 * @ko uv_b - 해당 정점의 텍스처 UV 좌표입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_PrimRectUV(
  self: ImDrawList,
  a: ImVec2Like,
  b: ImVec2Like,
  uv_a: ImVec2Like,
  uv_b: ImVec2Like,
  col: number,
): void {
  native.ImDrawList_PrimRectUV(self, a, b, uv_a, uv_b, col);
}

/**
 * Write a quadrilateral with UVs into pre-reserved vertex and index space.
 *
 * @zh 将带 UV 坐标的四边形写入预留的顶点和索引空间。
 * @ja UV 座標付きの四角形を予約済みの頂点・インデックス領域に書き込みます。
 * @ko UV 좌표가 있는 사각형을 미리 예약한 정점 및 인덱스 공간에 씁니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param a - Ordered vertex or start point a in absolute screen coordinates.
 * @zh a - 绝对屏幕坐标中的有序顶点或起点 a。
 * @ja a - 絶対スクリーン座標の順序付き頂点または始点 a です。
 * @ko a - 절대 화면 좌표의 순서 있는 정점 또는 시작점 a입니다.
 *
 * @param b - Ordered vertex or start point b in absolute screen coordinates.
 * @zh b - 绝对屏幕坐标中的有序顶点或起点 b。
 * @ja b - 絶対スクリーン座標の順序付き頂点または始点 b です。
 * @ko b - 절대 화면 좌표의 순서 있는 정점 또는 시작점 b입니다.
 *
 * @param c - Ordered vertex or start point c in absolute screen coordinates.
 * @zh c - 绝对屏幕坐标中的有序顶点或起点 c。
 * @ja c - 絶対スクリーン座標の順序付き頂点または始点 c です。
 * @ko c - 절대 화면 좌표의 순서 있는 정점 또는 시작점 c입니다.
 *
 * @param d - Ordered vertex or start point d in absolute screen coordinates.
 * @zh d - 绝对屏幕坐标中的有序顶点或起点 d。
 * @ja d - 絶対スクリーン座標の順序付き頂点または始点 d です。
 * @ko d - 절대 화면 좌표의 순서 있는 정점 또는 시작점 d입니다.
 *
 * @param uv_a - Texture UV coordinates for the corresponding vertex.
 * @zh uv_a - 对应顶点的纹理 UV 坐标。
 * @ja uv_a - 対応する頂点のテクスチャ UV 座標です。
 * @ko uv_a - 해당 정점의 텍스처 UV 좌표입니다.
 *
 * @param uv_b - Texture UV coordinates for the corresponding vertex.
 * @zh uv_b - 对应顶点的纹理 UV 坐标。
 * @ja uv_b - 対応する頂点のテクスチャ UV 座標です。
 * @ko uv_b - 해당 정점의 텍스처 UV 좌표입니다.
 *
 * @param uv_c - Texture UV coordinates for the corresponding vertex.
 * @zh uv_c - 对应顶点的纹理 UV 坐标。
 * @ja uv_c - 対応する頂点のテクスチャ UV 座標です。
 * @ko uv_c - 해당 정점의 텍스처 UV 좌표입니다.
 *
 * @param uv_d - Texture UV coordinates for the corresponding vertex.
 * @zh uv_d - 对应顶点的纹理 UV 坐标。
 * @ja uv_d - 対応する頂点のテクスチャ UV 座標です。
 * @ko uv_d - 해당 정점의 텍스처 UV 좌표입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_PrimQuadUV(
  self: ImDrawList,
  a: ImVec2Like,
  b: ImVec2Like,
  c: ImVec2Like,
  d: ImVec2Like,
  uv_a: ImVec2Like,
  uv_b: ImVec2Like,
  uv_c: ImVec2Like,
  uv_d: ImVec2Like,
  col: number,
): void {
  native.ImDrawList_PrimQuadUV(self, a, b, c, d, uv_a, uv_b, uv_c, uv_d, col);
}

/**
 * Write one vertex into pre-reserved space and advance the vertex cursor.
 *
 * @zh 向预留空间写入一个顶点，并前移顶点游标。
 * @ja 予約済み領域に頂点を 1 つ書き込み、頂点カーソルを進めます。
 * @ko 미리 예약한 공간에 정점 하나를 쓰고 정점 커서를 이동합니다.
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
 *
 * @param uv - Texture UV coordinates for the corresponding vertex.
 * @zh uv - 对应顶点的纹理 UV 坐标。
 * @ja uv - 対応する頂点のテクスチャ UV 座標です。
 * @ko uv - 해당 정점의 텍스처 UV 좌표입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_PrimWriteVtx(
  self: ImDrawList,
  pos: ImVec2Like,
  uv: ImVec2Like,
  col: number,
): void {
  native.ImDrawList_PrimWriteVtx(self, pos, uv, col);
}

/**
 * Write one index into pre-reserved space and advance the index cursor.
 *
 * @zh 向预留空间写入一个索引，并前移索引游标。
 * @ja 予約済み領域にインデックスを 1 つ書き込み、インデックスカーソルを進めます。
 * @ko 미리 예약한 공간에 인덱스 하나를 쓰고 인덱스 커서를 이동합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param idx - Vertex index written to the reserved index buffer; it must fit
 * ImDrawIdx.
 * @zh idx - 写入已预留索引缓冲区的顶点索引，须符合 ImDrawIdx 范围。
 * @ja idx - 確保済みインデックス領域に書く頂点番号です。ImDrawIdx の範囲内で指定します。
 * @ko idx - 예약된 인덱스 버퍼에 쓸 정점 인덱스이며 ImDrawIdx 범위에 맞아야 합니다.
 */
export function ImDrawList_PrimWriteIdx(self: ImDrawList, idx: number): void {
  native.ImDrawList_PrimWriteIdx(self, idx);
}

/**
 * Write a vertex and its index.
 *
 * @zh 写入顶点及其索引。
 * @ja 頂点とそのインデックスを書き込みます。
 * @ko 정점과 해당 인덱스를 기록합니다.
 *
 * @remarks
 * Write vertex with unique index
 * @zh
 * 写入具有唯一索引的顶点。
 * @ja
 * 一意のインデックスを持つ頂点を書き込みます。
 * @ko
 * 고유 인덱스를 가진 정점을 씁니다.
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
 *
 * @param uv - Texture UV coordinates for the corresponding vertex.
 * @zh uv - 对应顶点的纹理 UV 坐标。
 * @ja uv - 対応する頂点のテクスチャ UV 座標です。
 * @ko uv - 해당 정점의 텍스처 UV 좌표입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function ImDrawList_PrimVtx(
  self: ImDrawList,
  pos: ImVec2Like,
  uv: ImVec2Like,
  col: number,
): void {
  native.ImDrawList_PrimVtx(self, pos, uv, col);
}
