import { native } from '../internal/native';
import type {
  ImVec2Like,
  ImVec2Value,
  ImDrawCmd,
  ImDrawList,
  ImDrawListSplitter,
} from '../types';

/**
 * Get the texture identifier associated with this draw command.
 *
 * @zh 获取当前绘制命令关联的纹理标识符。
 * @ja この描画コマンドに対応するテクスチャ識別子を取得します。
 * @ko 이 그리기 명령에 연결된 텍스처 식별자를 가져옵니다.
 *
 * @remarks
 * Since 1.83: returns ImTextureID associated with this draw call.
 *
 * Warning: DO NOT assume this is always same as 'TextureId' (we will change
 * this function for an upcoming feature)
 * @zh
 * 自 1.83 起：返回此绘制调用关联的 ImTextureID。
 *
 * 警告：不要假定它始终等同于 'TextureId'（我们将为即将推出的功能修改此函数）。
 * @ja
 * 1.83 以降：この描画呼び出しに関連付けられた ImTextureID を返します。
 *
 * 警告：常に 'TextureId' と同じだと思わないでください（今後の機能のため、この関数を変更する予定です）。
 * @ko
 * 1.83부터: 이 그리기 호출에 연결된 ImTextureID를 반환합니다.
 *
 * 경고: 항상 'TextureId'와 같다고 가정하지 마세요(향후 기능을 위해 이 함수를 변경할 예정).
 *
 * @param self - ImDrawCmd handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawCmd 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawCmd ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawCmd 핸들입니다.
 *
 * @returns Renderer texture ID for this draw command, represented as bigint.
 * @zh 此绘制命令的渲染器纹理 ID，以 bigint 表示。
 * @ja この描画コマンドのレンダラーテクスチャ ID を bigint で返します。
 * @ko 이 그리기 명령의 렌더러 텍스처 ID를 bigint로 반환합니다.
 */
export function ImDrawCmd_GetTexID(self: ImDrawCmd): bigint {
  return native.ImDrawCmd_GetTexID(self);
}

/**
 * Clear the draw-list splitter while retaining channel allocations.
 *
 * @zh 清空绘制列表分割器并保留通道分配内存。
 * @ja チャンネルの割り当てを保持して描画リスト分割器をクリアします。
 * @ko 채널 할당을 유지하면서 그리기 목록 분할기를 비웁니다.
 *
 * @remarks
 * Do not clear Channels[] so our allocations are reused next frame
 * @zh
 * 不清空 Channels[]，以便下一帧复用已分配的内存。
 * @ja
 * 割り当て済みメモリを次のフレームで再利用するため、Channels[] は消去しません。
 * @ko
 * 다음 프레임에 할당한 메모리를 재사용하도록 Channels[]를 지우지 않습니다.
 *
 * @param self - ImDrawListSplitter handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawListSplitter 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawListSplitter ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawListSplitter 핸들입니다.
 */
export function ImDrawListSplitter_Clear(self: ImDrawListSplitter): void {
  native.ImDrawListSplitter_Clear(self);
}

/**
 * Reset the draw-list splitter and free its channel buffers.
 *
 * @zh 重置绘制列表拆分器，并释放其通道缓冲区。
 * @ja 描画リストの分割器をリセットし、チャンネルバッファを解放します。
 * @ko 그리기 목록 분할기를 재설정하고 채널 버퍼를 해제합니다.
 *
 * @param self - ImDrawListSplitter handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawListSplitter 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawListSplitter ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawListSplitter 핸들입니다.
 */
export function ImDrawListSplitter_ClearFreeMemory(
  self: ImDrawListSplitter,
): void {
  native.ImDrawListSplitter_ClearFreeMemory(self);
}

/**
 * Split a draw list into channels that can be populated independently before
 * merging.
 *
 * @zh 将绘制列表拆分为可独立添加内容、随后合并的通道。
 * @ja 描画リストを、個別に内容を追加して後で統合できるチャンネルに分割します。
 * @ko 그리기 목록을 개별적으로 내용을 추가한 뒤 병합할 수 있는 채널로 나눕니다.
 *
 * @param self - ImDrawListSplitter handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawListSplitter 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawListSplitter ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawListSplitter 핸들입니다.
 *
 * @param draw_list - Draw-list handle whose channels are manipulated or whose
 * commands are appended to draw data.
 * @zh draw_list - 要操作通道或将其命令加入绘制数据的绘制列表句柄。
 * @ja draw_list - チャンネルを操作するか、描画データにコマンドを追加する描画リストのハンドルです。
 * @ko draw_list - 채널을 조작하거나 명령을 그리기 데이터에 추가할 그리기 목록 핸들입니다.
 *
 * @param count - Number of columns or drawing channels to split into.
 * @zh count - 要拆分成的列数或绘制通道数。
 * @ja count - 分割先の列数または描画チャンネル数です。
 * @ko count - 나눌 열 또는 그리기 채널 수입니다.
 */
export function ImDrawListSplitter_Split(
  self: ImDrawListSplitter,
  draw_list: ImDrawList,
  count: number,
): void {
  native.ImDrawListSplitter_Split(self, draw_list, count);
}

/**
 * Merge drawing channels back into a single draw list in channel order.
 *
 * @zh 按通道顺序将绘制通道合并回单个绘制列表。
 * @ja 描画チャンネルをチャンネル順に単一の描画リストへ統合します。
 * @ko 그리기 채널을 채널 순서대로 하나의 그리기 목록으로 병합합니다.
 *
 * @param self - ImDrawListSplitter handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawListSplitter 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawListSplitter ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawListSplitter 핸들입니다.
 *
 * @param draw_list - Draw-list handle whose channels are manipulated or whose
 * commands are appended to draw data.
 * @zh draw_list - 要操作通道或将其命令加入绘制数据的绘制列表句柄。
 * @ja draw_list - チャンネルを操作するか、描画データにコマンドを追加する描画リストのハンドルです。
 * @ko draw_list - 채널을 조작하거나 명령을 그리기 데이터에 추가할 그리기 목록 핸들입니다.
 */
export function ImDrawListSplitter_Merge(
  self: ImDrawListSplitter,
  draw_list: ImDrawList,
): void {
  native.ImDrawListSplitter_Merge(self, draw_list);
}

/**
 * Select the drawing channel that receives subsequent primitives.
 *
 * @zh 选择用于接收后续图元的绘制通道。
 * @ja 後続のプリミティブを追加する描画チャンネルを選択します。
 * @ko 이후 프리미티브를 받을 그리기 채널을 선택합니다.
 *
 * @param self - ImDrawListSplitter handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawListSplitter 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawListSplitter ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawListSplitter 핸들입니다.
 *
 * @param draw_list - Draw-list handle whose channels are manipulated or whose
 * commands are appended to draw data.
 * @zh draw_list - 要操作通道或将其命令加入绘制数据的绘制列表句柄。
 * @ja draw_list - チャンネルを操作するか、描画データにコマンドを追加する描画リストのハンドルです。
 * @ko draw_list - 채널을 조작하거나 명령을 그리기 데이터에 추가할 그리기 목록 핸들입니다.
 *
 * @param channel_idx - Zero-based drawing channel index, less than the current
 * channel count.
 * @zh channel_idx - 从零开始的绘制通道索引，须小于当前通道数。
 * @ja channel_idx - 0 始まりの描画チャンネル番号です。現在のチャンネル数未満にしてください。
 * @ko channel_idx - 0부터 시작하는 그리기 채널 인덱스이며 현재 채널 수보다 작아야 합니다.
 */
export function ImDrawListSplitter_SetCurrentChannel(
  self: ImDrawListSplitter,
  draw_list: ImDrawList,
  channel_idx: number,
): void {
  native.ImDrawListSplitter_SetCurrentChannel(self, draw_list, channel_idx);
}

/**
 * Push a render-only clipping rectangle.
 *
 * @zh 压入仅用于渲染的裁剪矩形。
 * @ja 描画専用のクリッピング矩形を積みます。
 * @ko 렌더링 전용 클리핑 사각형을 스택에 넣습니다.
 *
 * @remarks
 * Render-level scissoring.
 *
 * This is passed down to your render function but not used for CPU-side coarse
 * clipping.
 *
 * Prefer using higher-level `ImGui.PushClipRect()` to affect logic (hit-testing
 * and widget culling)
 * @zh
 * 渲染级剪裁。
 *
 * 此设置会传给渲染函数，但不用于 CPU 侧的粗略裁剪。
 *
 * 若要影响逻辑（命中检测与控件剔除），请优先使用更高层的 `ImGui.PushClipRect()`。
 * @ja
 * 描画レベルのシザーです。
 *
 * 描画関数に渡されますが、CPU 側の大まかなクリッピングには使いません。
 *
 * ロジック（ヒットテストとウィジェットのカリング）に影響させるには、上位の `ImGui.PushClipRect()` を推奨します。
 * @ko
 * 렌더링 수준의 시저 처리입니다.
 *
 * 렌더링 함수로 전달되지만 CPU 측의 대략적인 클리핑에는 쓰이지 않습니다.
 *
 * 로직(적중 검사 및 위젯 컬링)에 영향을 주려면 상위 수준의 `ImGui.PushClipRect()`를 사용하세요.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param clip_rect_min - Top-left corner of the rectangle in absolute screen
 * coordinates.
 * @zh clip_rect_min - 矩形左上角，使用绝对屏幕坐标。
 * @ja clip_rect_min - 矩形の左上を絶対スクリーン座標で指定します。
 * @ko clip_rect_min - 사각형 왼쪽 위의 절대 화면 좌표입니다.
 *
 * @param clip_rect_max - Bottom-right corner of the rectangle in absolute
 * screen coordinates.
 * @zh clip_rect_max - 矩形右下角，使用绝对屏幕坐标。
 * @ja clip_rect_max - 矩形の右下を絶対スクリーン座標で指定します。
 * @ko clip_rect_max - 사각형 오른쪽 아래의 절대 화면 좌표입니다.
 *
 * @param intersect_with_current_clip_rect - Whether to intersect the rectangle
 * with the current clipping rectangle.
 * @zh intersect_with_current_clip_rect - 是否将矩形与当前裁剪矩形求交。
 * @ja intersect_with_current_clip_rect - 現在のクリップ矩形との共通領域を使うかどうかです。
 * @ko intersect_with_current_clip_rect - 현재 클리핑 사각형과의 교집합을 사용할지 여부입니다.
 */
export function ImDrawList_PushClipRect(
  self: ImDrawList,
  clip_rect_min: ImVec2Like,
  clip_rect_max: ImVec2Like,
  intersect_with_current_clip_rect: boolean = false,
): void {
  native.ImDrawList_PushClipRect(
    self,
    clip_rect_min,
    clip_rect_max,
    intersect_with_current_clip_rect,
  );
}

/**
 * Push the shared full-screen clipping rectangle onto the draw-list clip stack.
 *
 * @zh 将共享的全屏裁剪矩形压入绘制列表的裁剪栈。
 * @ja 共有の全画面クリップ矩形を描画リストのクリップスタックにプッシュします。
 * @ko 공유 전체 화면 클리핑 사각형을 그리기 목록의 클립 스택에 푸시합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 */
export function ImDrawList_PushClipRectFullScreen(self: ImDrawList): void {
  native.ImDrawList_PushClipRectFullScreen(self);
}

/**
 * Pop a draw-list clip rectangle and restore the previous render-only clipping
 * state.
 *
 * @zh 弹出绘制列表的裁剪矩形，恢复先前仅影响渲染的裁剪状态。
 * @ja 描画リストのクリップ矩形をポップし、描画のみに作用する以前のクリップ状態を復元します。
 * @ko 그리기 목록의 클립 사각형을 팝하고 렌더링에만 적용되는 이전 클리핑 상태를 복원합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 */
export function ImDrawList_PopClipRect(self: ImDrawList): void {
  native.ImDrawList_PopClipRect(self);
}

/**
 * Push a texture binding for subsequent draw-list primitives.
 *
 * @zh 为后续绘制列表图元压入纹理绑定。
 * @ja 後続の描画リストのプリミティブ用にテクスチャの割り当てをプッシュします。
 * @ko 이후 그리기 목록 프리미티브에 사용할 텍스처 바인딩을 푸시합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param texture_id - Renderer texture identifier (ImTextureID bigint), not an
 * SFML texture object.
 * @zh texture_id - 渲染器纹理标识符（ImTextureID bigint），不是 SFML 纹理对象。
 * @ja texture_id - レンダラーのテクスチャ識別子（ImTextureID の bigint）です。SFML
 * テクスチャオブジェクトではありません。
 * @ko texture_id - 렌더러 텍스처 식별자(ImTextureID bigint)이며 SFML 텍스처 객체가 아닙니다.
 */
export function ImDrawList_PushTextureID(
  self: ImDrawList,
  texture_id: bigint,
): void {
  native.ImDrawList_PushTextureID(self, texture_id);
}

/**
 * Pop the texture binding saved by ImDrawList_PushTextureID and restore the
 * previous
 * binding.
 *
 * @zh 弹出 ImDrawList_PushTextureID 压入的纹理绑定，并恢复先前的绑定。
 * @ja ImDrawList_PushTextureID で積んだテクスチャの割り当てをポップし、以前の割り当てを復元します。
 * @ko ImDrawList_PushTextureID로 푸시한 텍스처 바인딩을 팝하고 이전 바인딩을 복원합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 */
export function ImDrawList_PopTextureID(self: ImDrawList): void {
  native.ImDrawList_PopTextureID(self);
}

/**
 * Read the upper-left corner of the current draw-list clipping rectangle.
 *
 * @zh 读取当前绘制列表裁剪矩形的左上角。
 * @ja 現在の描画リストのクリップ矩形の左上隅を取得します。
 * @ko 현재 그리기 목록 클리핑 사각형의 왼쪽 위 모서리를 읽습니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @returns Current draw-list clip rectangle top-left, copied as {x,y} in
 * absolute screen coordinates; not a writable native view.
 * @zh 当前绘制列表裁剪矩形左上角的绝对屏幕坐标副本 {x,y}，不是原生可写视图。
 * @ja 現在の描画リストのクリップ矩形左上を絶対スクリーン座標の {x,y} としてコピーします。書き込みビューではありません。
 * @ko 현재 그리기 목록 클립 사각형의 왼쪽 위의 절대 화면 좌표 복사본 {x,y}입니다. 네이티브 쓰기 뷰가 아닙니다.
 */
export function ImDrawList_GetClipRectMin(self: ImDrawList): ImVec2Value {
  return native.ImDrawList_GetClipRectMin(self);
}

/**
 * Read the lower-right corner of the current draw-list clipping rectangle.
 *
 * @zh 读取当前绘制列表裁剪矩形的右下角。
 * @ja 現在の描画リストのクリップ矩形の右下隅を取得します。
 * @ko 현재 그리기 목록 클리핑 사각형의 오른쪽 아래 모서리를 읽습니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @returns Current draw-list clip rectangle bottom-right, copied as {x,y} in
 * absolute screen coordinates; not a writable native view.
 * @zh 当前绘制列表裁剪矩形右下角的绝对屏幕坐标副本 {x,y}，不是原生可写视图。
 * @ja 現在の描画リストのクリップ矩形右下を絶対スクリーン座標の {x,y} としてコピーします。書き込みビューではありません。
 * @ko 현재 그리기 목록 클립 사각형의 오른쪽 아래의 절대 화면 좌표 복사본 {x,y}입니다. 네이티브 쓰기 뷰가 아닙니다.
 */
export function ImDrawList_GetClipRectMax(self: ImDrawList): ImVec2Value {
  return native.ImDrawList_GetClipRectMax(self);
}

/**
 * Start a new draw command.
 *
 * @zh 开始新的绘制命令。
 * @ja 新しい描画コマンドを開始します。
 * @ko 새 그리기 명령을 시작합니다.
 *
 * @remarks
 * This is useful if you need to forcefully create a new draw call (to allow for
 * dependent rendering / blending).
 *
 * Otherwise primitives are merged into the same draw-call as much as possible
 * @zh
 * 高级：其他功能。
 *
 * 需要强制创建新绘制调用时很有用（以支持有依赖的渲染/混合）。
 *
 * 否则会尽可能将图元合并到同一绘制调用中。
 * @ja
 * 高度な機能：その他。
 *
 * 依存関係のある描画/ブレンドのために、新しい描画呼び出しを強制的に作成する場合に有用です。
 *
 * それ以外では、プリミティブは可能な限り同じ描画呼び出しに統合されます。
 * @ko
 * 고급: 기타 기능.
 *
 * 의존성이 있는 렌더링/블렌딩을 위해 새 그리기 호출을 강제로 만들 때 유용합니다.
 *
 * 그 외에는 프리미티브를 최대한 같은 그리기 호출로 병합합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 */
export function ImDrawList_AddDrawCmd(self: ImDrawList): void {
  native.ImDrawList_AddDrawCmd(self);
}

/**
 * Create a clone of the CmdBuffer/IdxBuffer/VtxBuffer.
 *
 * @zh 创建 CmdBuffer/IdxBuffer/VtxBuffer 的副本。
 * @ja CmdBuffer/IdxBuffer/VtxBuffer の複製を作成します。
 * @ko CmdBuffer/IdxBuffer/VtxBuffer의 복제본을 만듭니다.
 *
 * @remarks
 * Handles, mapped views/buffers, and draw data added via ImDrawData_AddDrawList
 * share native ownership. Copied JavaScript draw callbacks remain callable
 * across frames while the clone retains their commands. Textures and shared
 * drawing state are still borrowed; cloning does not extend their lifetime.
 * @zh 句柄、映射视图/缓冲区以及通过 ImDrawData_AddDrawList 添加到的绘制数据
 * 共享原生所有权。只要副本保留相应命令，复制的 JavaScript 绘制回调就可跨帧调用。
 * 纹理和共享绘制状态仍为借用资源；克隆不会延长其生命周期。
 * @ja ハンドル、マッピングビュー/バッファー、ImDrawData_AddDrawList の追加先は
 * ネイティブ所有権を共有します。複製が命令を保持する間、JavaScript 描画コールバックは
 * フレームをまたいで呼び出せます。テクスチャと共有描画状態の借用期間は延長されません。
 * @ko 핸들, 매핑 뷰/버퍼, ImDrawData_AddDrawList로 추가한 그리기 데이터는
 * 네이티브 소유권을 공유합니다. 복사본이 명령을 보유하는 동안 JavaScript 그리기 콜백을
 * 프레임 간에 호출할 수 있습니다. 텍스처와 공유 그리기 상태의 수명은 연장되지 않습니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @returns Newly allocated draw-list clone containing the command, index, and
 * vertex buffers; the native clone is not a borrowed window draw list.
 * @zh 新分配的绘制列表副本，包含命令、索引和顶点缓冲区；原生副本不是借用的窗口绘制列表。
 * @ja コマンド・インデックス・頂点バッファーを含む新規描画リストです。ウィンドウから借りたリストではありません。
 * @ko 명령, 인덱스 및 정점 버퍼를 담은 새로 할당된 그리기 목록 복사본입니다. 창에서 빌린 목록이 아닙니다.
 */
export function ImDrawList_CloneOutput(self: ImDrawList): ImDrawList | null {
  return native.ImDrawList_CloneOutput(self);
}

/**
 * Split the draw list into independently ordered channels.
 *
 * @zh 将绘制列表拆分为可独立排序的通道。
 * @ja 描画リストを独立して順序付けできるチャンネルに分割します。
 * @ko 그리기 목록을 독립적으로 정렬할 수 있는 채널로 나눕니다.
 *
 * @remarks
 * - Use to split render into layers. By switching channels to can render
 *   out-of-order (e.g. submit FG primitives before BG primitives)
 * - Use to minimize draw calls (e.g. if going back-and-forth between multiple
 *   clipping rectangles, prefer to append into separate channels then merge at
 *   the end)
 * - This API shouldn't have been in ImDrawList in the first place! Prefer using
 *   your own persistent instance of ImDrawListSplitter as you can stack them.
 * The `ImGui.ImDrawList_Channels*` helpers cannot nest one split inside
 * another.
 * @zh
 * 高级：通道。
 *
 * - 用于将渲染拆分为多个层。切换通道可打乱提交顺序（例如先提交前景图元，再提交背景图元）。
 *
 * - 用于减少绘制调用（例如在多个裁剪矩形之间来回切换时，优先追加到不同通道，最后再合并）。
 *
 * - 此 API 本不该放在 ImDrawList 中！建议使用自己的持久 ImDrawListSplitter 实例，以便嵌套。使用
 *   `ImGui.ImDrawList_Channels*` 辅助函数无法在一次拆分之上再嵌套拆分。
 * @ja
 * 高度な機能：チャネル。
 *
 * - 描画をレイヤーに分割します。チャネル切り替えで順序に縛られず送信できます（背景より先に前景プリミティブを送信するなど）。
 *
 * - 描画呼び出しを減らせます（複数のクリップ矩形を行き来するなら、別々のチャネルに追加し最後に統合することを推奨）。
 *
 * - この API はそもそも ImDrawList に入れるべきではありませんでした！入れ子にできる独自の永続的な ImDrawListSplitter
 *   インスタンスを推奨します。`ImGui.ImDrawList_Channels*` では分割の上に別の分割を重ねられません。
 * @ko
 * 고급: 채널.
 *
 * - 렌더링을 레이어로 분리합니다. 채널을 전환하면 순서에 얽매이지 않고 제출할 수 있습니다(예: 배경보다 전경 프리미티브를 먼저 제출).
 *
 * - 그리기 호출을 최소화합니다(예: 여러 클리핑 사각형을 오갈 때는 별도 채널에 추가한 뒤 마지막에 병합하는 방식 권장).
 *
 * - 이 API는 처음부터 ImDrawList에 있으면 안 됐습니다! 중첩할 수 있는 자체 영속 ImDrawListSplitter 인스턴스를
 *   권장합니다. `ImGui.ImDrawList_Channels*`를 사용하면 한 분할 위에 다른 분할을 중첩할 수 없습니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param count - Number of columns or drawing channels to split into.
 * @zh count - 要拆分成的列数或绘制通道数。
 * @ja count - 分割先の列数または描画チャンネル数です。
 * @ko count - 나눌 열 또는 그리기 채널 수입니다.
 */
export function ImDrawList_ChannelsSplit(
  self: ImDrawList,
  count: number,
): void {
  native.ImDrawList_ChannelsSplit(self, count);
}

/**
 * Merge drawing channels back into a single draw list in channel order.
 *
 * @zh 按通道顺序将绘制通道合并回单个绘制列表。
 * @ja 描画チャンネルをチャンネル順に単一の描画リストへ統合します。
 * @ko 그리기 채널을 채널 순서대로 하나의 그리기 목록으로 병합합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 */
export function ImDrawList_ChannelsMerge(self: ImDrawList): void {
  native.ImDrawList_ChannelsMerge(self);
}

/**
 * Select the drawing channel that receives subsequent primitives.
 *
 * @zh 选择用于接收后续图元的绘制通道。
 * @ja 後続のプリミティブを追加する描画チャンネルを選択します。
 * @ko 이후 프리미티브를 받을 그리기 채널을 선택합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param n - Zero-based drawing channel index, less than the current channel
 * count.
 * @zh n - 从零开始的绘制通道索引，须小于当前通道数。
 * @ja n - 0 始まりの描画チャンネル番号です。現在のチャンネル数未満にしてください。
 * @ko n - 0부터 시작하는 그리기 채널 인덱스이며 현재 채널 수보다 작아야 합니다.
 */
export function ImDrawList_ChannelsSetCurrent(
  self: ImDrawList,
  n: number,
): void {
  native.ImDrawList_ChannelsSetCurrent(self, n);
}
