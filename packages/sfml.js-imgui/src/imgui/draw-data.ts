import { native } from '../internal/native';
import type { ImVec2Like, ImDrawData, ImDrawList } from '../types';

/**
 * Reset frame draw data without clearing or destroying the referenced draw
 * lists.
 *
 * @zh 重置帧绘制数据，不清空或销毁所引用的绘制列表。
 * @ja 参照先の描画リストを消去・破棄せず、フレームの描画データをリセットします。
 * @ko 참조된 그리기 목록을 지우거나 파괴하지 않고 프레임 그리기 데이터를 재설정합니다.
 *
 * @remarks
 * Releases this draw data's native retention of added lists. An owning clone
 * is freed only when no handles, mapped views, or draw data retain it.
 * @zh 释放此绘制数据对已添加列表的原生保留；拥有内存的副本仅在没有句柄、
 * 映射视图或绘制数据保留它时释放。
 * @ja 追加したリストの保持を解除します。所有する複製は、ハンドル・マッピングビュー・
 * 描画データのいずれからも保持されなくなった時点で解放されます。
 * @ko 추가한 목록의 네이티브 보유를 해제합니다. 소유 복사본은 핸들, 매핑 뷰,
 * 그리기 데이터가 더 이상 보유하지 않을 때만 해제됩니다.
 *
 * @param self - ImDrawData handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawData 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawData ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawData 핸들입니다.
 */
export function ImDrawData_Clear(self: ImDrawData): void {
  native.ImDrawData_Clear(self);
}

/**
 * Add a draw list to the draw data.
 *
 * @zh 向绘制数据添加绘制列表。
 * @ja 描画データに描画リストを追加します。
 * @ko 그리기 데이터에 그리기 목록을 추가합니다.
 *
 * @remarks
 * Appends a reference, not a copy. The binding retains the list's native owner
 * until ImDrawData_Clear(), the owning context's next NewFrame() (including
 * SFML.Update()), or context shutdown. Keeping the JS wrapper alive is not
 * required. Borrowed window lists still follow their normal frame lifetime.
 * @zh
 * 添加引用而非副本。绑定保留列表的原生所有者，直到 ImDrawData_Clear()、
 * 所属上下文下一次 NewFrame()（包括 SFML.Update()）或上下文关闭。
 * 无须保留 JS 包装对象；借用的窗口列表仍遵循原有的帧生命周期。
 * @ja
 * コピーではなく参照を追加します。ImDrawData_Clear()、所有コンテキストの次の
 * NewFrame()（SFML.Update() を含む）、または終了までネイティブ所有者を保持します。
 * JS ラッパーの保持は不要です。借用したウィンドウのリストは通常のフレーム寿命に従います。
 * @ko
 * 복사본이 아닌 참조를 추가합니다. ImDrawData_Clear(), 소유 컨텍스트의 다음
 * NewFrame()(SFML.Update() 포함) 또는 종료까지 네이티브 소유자를 보유합니다.
 * JS 래퍼를 유지할 필요는 없습니다. 빌린 창 목록은 기존 프레임 수명을 따릅니다.
 *
 * @param self - ImDrawData handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawData 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawData ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawData 핸들입니다.
 *
 * @param draw_list - Draw-list handle whose channels are manipulated or whose
 * commands are appended to draw data.
 * @zh draw_list - 要操作通道或将其命令加入绘制数据的绘制列表句柄。
 * @ja draw_list - チャンネルを操作するか、描画データにコマンドを追加する描画リストのハンドルです。
 * @ko draw_list - 채널을 조작하거나 명령을 그리기 데이터에 추가할 그리기 목록 핸들입니다.
 */
export function ImDrawData_AddDrawList(
  self: ImDrawData,
  draw_list: ImDrawList,
): void {
  native.ImDrawData_AddDrawList(self, draw_list);
}

/**
 * Convert indexed draw buffers to non-indexed buffers.
 *
 * @zh 将索引绘制缓冲区转换为非索引缓冲区。
 * @ja インデックス付き描画バッファをインデックスなしのバッファに変換します。
 * @ko 인덱스 그리기 버퍼를 비인덱스 버퍼로 변환합니다.
 *
 * @remarks
 * Helper to convert all buffers from indexed to non-indexed, in case you cannot
 * render indexed.
 *
 * Note: this is slow and most likely a waste of resources.
 *
 * Always prefer indexed rendering!
 * @zh
 * 无法使用索引绘制时，将所有缓冲区从索引形式转换为非索引形式的辅助函数。
 *
 * 注意：此操作很慢，且极可能浪费资源。
 *
 * 请始终优先使用索引绘制！
 * @ja
 * インデックス付き描画ができない場合に、すべてのバッファをインデックスなしに変換するヘルパーです。
 *
 * 注意：低速で、ほぼ確実にリソースの無駄になります。
 *
 * 常にインデックス付き描画を優先してください！
 * @ko
 * 인덱스 렌더링이 불가능할 때 모든 버퍼를 인덱스 형식에서 비인덱스 형식으로 변환하는 헬퍼입니다.
 *
 * 참고: 느리고 자원을 낭비할 가능성이 매우 큽니다.
 *
 * 항상 인덱스 렌더링을 우선하세요!
 *
 * @param self - ImDrawData handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawData 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawData ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawData 핸들입니다.
 */
export function ImDrawData_DeIndexAllBuffers(self: ImDrawData): void {
  native.ImDrawData_DeIndexAllBuffers(self);
}

/**
 * Scale all draw-command clipping rectangles.
 *
 * @zh 缩放全部绘制命令的裁剪矩形。
 * @ja すべての描画コマンドのクリッピング矩形を拡大縮小します。
 * @ko 모든 그리기 명령의 클리핑 사각형 배율을 조정합니다.
 *
 * @remarks
 * Helper to scale the ClipRect field of each ImDrawCmd.
 *
 * Use if your final output buffer is at a different scale than Dear ImGui
 * expects, or if there is a difference between your window resolution and
 * framebuffer resolution.
 * @zh
 * 缩放每个 ImDrawCmd 的 ClipRect 字段的辅助函数。
 *
 * 最终输出缓冲区的缩放比例与 Dear ImGui 预期不同，或窗口分辨率与帧缓冲区分辨率不同时使用。
 * @ja
 * 各 ImDrawCmd の ClipRect を拡大縮小するヘルパーです。
 *
 * 最終出力バッファの倍率が Dear ImGui の想定と異なる場合や、ウィンドウとフレームバッファの解像度が異なる場合に使用します。
 * @ko
 * 각 ImDrawCmd의 ClipRect 필드 배율을 조정하는 헬퍼입니다.
 *
 * 최종 출력 버퍼의 배율이 Dear ImGui 예상과 다르거나 창 해상도와 프레임버퍼 해상도가 다를 때 사용합니다.
 *
 * @param self - ImDrawData handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawData 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawData ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawData 핸들입니다.
 *
 * @param fb_scale - Horizontal and vertical scale factors converting clip
 * rectangles to framebuffer pixels.
 * @zh fb_scale - 将裁剪矩形转换为帧缓冲像素的水平和垂直缩放倍数。
 * @ja fb_scale - クリップ矩形をフレームバッファーピクセルへ変換する水平・垂直倍率です。
 * @ko fb_scale - 클립 사각형을 프레임버퍼 픽셀로 변환하는 가로 및 세로 배율입니다.
 */
export function ImDrawData_ScaleClipRects(
  self: ImDrawData,
  fb_scale: ImVec2Like,
): void {
  native.ImDrawData_ScaleClipRects(self, fb_scale);
}
