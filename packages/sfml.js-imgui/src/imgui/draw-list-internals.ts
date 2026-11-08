import { native } from '../internal/native';
import type { ImVec2Like, ImDrawList } from '../types';

/**
 * Reset the draw list for a new frame.
 *
 * @zh 为新帧重置绘制列表。
 * @ja 新しいフレーム用に描画リストをリセットします。
 * @ko 새 프레임을 위해 그리기 목록을 재설정합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 */
export function ImDrawList__ResetForNewFrame(self: ImDrawList): void {
  native.ImDrawList__ResetForNewFrame(self);
}

/**
 * Reset the draw list and release its buffers, stacks, path, and channel
 * allocations.
 *
 * @zh 重置绘制列表，并释放其缓冲区、栈、路径和通道内存。
 * @ja 描画リストをリセットし、バッファ、スタック、パス、チャンネルのメモリを解放します。
 * @ko 그리기 목록을 재설정하고 버퍼, 스택, 경로 및 채널 메모리를 해제합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 */
export function ImDrawList__ClearFreeMemory(self: ImDrawList): void {
  native.ImDrawList__ClearFreeMemory(self);
}

/**
 * Remove trailing draw commands that contain neither elements nor callbacks.
 *
 * @zh 移除末尾既无元素也无回调的绘制命令。
 * @ja 要素もコールバックもない末尾の描画コマンドを削除します。
 * @ko 요소와 콜백이 모두 없는 끝부분의 그리기 명령을 제거합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 */
export function ImDrawList__PopUnusedDrawCmd(self: ImDrawList): void {
  native.ImDrawList__PopUnusedDrawCmd(self);
}

/**
 * Merge the last two draw commands when their render state and index ranges are
 * compatible.
 *
 * @zh 当渲染状态与索引区间兼容时，合并最后两个绘制命令。
 * @ja 描画状態とインデックス範囲に互換性があれば、最後の 2 つの描画コマンドを統合します。
 * @ko 렌더링 상태와 인덱스 범위가 호환되면 마지막 두 그리기 명령을 병합합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 */
export function ImDrawList__TryMergeDrawCmds(self: ImDrawList): void {
  native.ImDrawList__TryMergeDrawCmds(self);
}

/**
 * Update or split draw commands to reflect a changed clipping rectangle.
 *
 * @zh 更新或拆分绘制命令，以反映裁剪矩形的变化。
 * @ja クリップ矩形の変更を反映するため描画コマンドを更新または分割します。
 * @ko 변경된 클리핑 사각형을 반영하도록 그리기 명령을 갱신하거나 분할합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 */
export function ImDrawList__OnChangedClipRect(self: ImDrawList): void {
  native.ImDrawList__OnChangedClipRect(self);
}

/**
 * Update or split draw commands to reflect a changed texture binding.
 *
 * @zh 更新或拆分绘制命令，以反映纹理绑定的变化。
 * @ja テクスチャ割り当ての変更を反映するため描画コマンドを更新または分割します。
 * @ko 변경된 텍스처 바인딩을 반영하도록 그리기 명령을 갱신하거나 분할합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 */
export function ImDrawList__OnChangedTextureID(self: ImDrawList): void {
  native.ImDrawList__OnChangedTextureID(self);
}

/**
 * Reset local vertex indexing and update draw commands for a changed vertex
 * offset.
 *
 * @zh 重置局部顶点索引，并根据顶点偏移的变化更新绘制命令。
 * @ja ローカル頂点インデックスをリセットし、頂点オフセットの変更に合わせて描画コマンドを更新します。
 * @ko 로컬 정점 인덱스를 재설정하고 변경된 정점 오프셋에 맞게 그리기 명령을 갱신합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 */
export function ImDrawList__OnChangedVtxOffset(self: ImDrawList): void {
  native.ImDrawList__OnChangedVtxOffset(self);
}

/**
 * Change the active draw-command texture without pushing the texture stack.
 *
 * @zh 更改当前绘制命令的纹理，不压入纹理栈。
 * @ja テクスチャスタックにプッシュせず、現在の描画コマンドのテクスチャを変更します。
 * @ko 텍스처 스택에 푸시하지 않고 활성 그리기 명령의 텍스처를 변경합니다.
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
export function ImDrawList__SetTextureID(
  self: ImDrawList,
  texture_id: bigint,
): void {
  native.ImDrawList__SetTextureID(self, texture_id);
}

/**
 * Choose a circle segment count from its radius and the configured tessellation
 * error.
 *
 * @zh 根据圆的半径和配置的细分误差确定分段数。
 * @ja 円の半径と設定された分割誤差から円の分割数を決定します。
 * @ko 원의 반지름과 설정된 분할 오차를 기준으로 원의 분할 수를 정합니다.
 *
 * @param self - ImDrawList handle on which this method operates.
 * @zh self - 此方法操作的 ImDrawList 句柄。
 * @ja self - このメソッドの操作対象となる ImDrawList ハンドルです。
 * @ko self - 이 메서드가 조작할 ImDrawList 핸들입니다.
 *
 * @param radius - Circle or arc radius in screen pixels.
 * @zh radius - 圆或圆弧的屏幕像素半径。
 * @ja radius - 円または円弧のスクリーンピクセル半径です。
 * @ko radius - 원 또는 호의 화면 픽셀 반지름입니다.
 *
 * @returns Automatically chosen circle segment count for the radius and current
 * tessellation error setting.
 * @zh 根据半径和当前细分误差设置自动选择的圆形段数。
 * @ja 半径と現在の分割誤差設定から自動選択した円の区間数です。
 * @ko 반지름 및 현재 분할 오차 설정으로 자동 선택한 원 구간 수입니다.
 */
export function ImDrawList__CalcCircleAutoSegmentCount(
  self: ImDrawList,
  radius: number,
): number {
  return native.ImDrawList__CalcCircleAutoSegmentCount(self, radius);
}

/**
 * Append a circular arc using precomputed samples and a sampling step.
 *
 * @zh 使用预计算的采样点和采样步长向路径添加圆弧。
 * @ja 事前計算したサンプルとサンプリング間隔を使ってパスに円弧を追加します。
 * @ko 미리 계산한 샘플과 샘플링 간격을 사용하여 경로에 원호를 추가합니다.
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
 * @param a_min_sample - Start/end sample index in the internal fast-arc lookup
 * table, not radians.
 * @zh a_min_sample - 内部快速圆弧查找表中的起始或结束样本索引，不是弧度。
 * @ja a_min_sample - 内部の高速円弧テーブルでの開始または終了サンプル番号です。ラジアンではありません。
 * @ko a_min_sample - 내부 고속 호 조회표의 시작 또는 끝 표본 인덱스이며 라디안이 아닙니다.
 *
 * @param a_max_sample - Start/end sample index in the internal fast-arc lookup
 * table, not radians.
 * @zh a_max_sample - 内部快速圆弧查找表中的起始或结束样本索引，不是弧度。
 * @ja a_max_sample - 内部の高速円弧テーブルでの開始または終了サンプル番号です。ラジアンではありません。
 * @ko a_max_sample - 내부 고속 호 조회표의 시작 또는 끝 표본 인덱스이며 라디안이 아닙니다.
 *
 * @param a_step - Lookup-table sample step; 0 selects the step automatically
 * from the radius.
 * @zh a_step - 查找表样本步长；0 根据半径自动选择。
 * @ja a_step - テーブルのサンプル間隔です。0 は半径から自動選択します。
 * @ko a_step - 조회표 표본 간격입니다. 0은 반지름에 따라 자동 선택합니다.
 */
export function ImDrawList__PathArcToFastEx(
  self: ImDrawList,
  center: ImVec2Like,
  radius: number,
  a_min_sample: number,
  a_max_sample: number,
  a_step: number,
): void {
  native.ImDrawList__PathArcToFastEx(
    self,
    center,
    radius,
    a_min_sample,
    a_max_sample,
    a_step,
  );
}

/**
 * Append a circular arc with an explicit number of segments to the current
 * path.
 *
 * @zh 按显式指定的分段数向当前路径添加圆弧。
 * @ja 明示した分割数で現在のパスに円弧を追加します。
 * @ko 명시적으로 지정한 분할 수로 현재 경로에 원호를 추가합니다.
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
 * @param num_segments - Positive segment count for this internal arc
 * tessellator; unlike ImDrawList_PathArcTo(), zero does not request automatic
 * tessellation.
 * @zh num_segments - 此内部圆弧细分器的正段数；与 ImDrawList_PathArcTo() 不同，零不表示自动细分。
 * @ja num_segments - 内部円弧分割の正の区間数です。ImDrawList_PathArcTo() と異なり 0 は自動分割を意味しません。
 * @ko num_segments - 내부 호 분할기의 양수 구간 수입니다. ImDrawList_PathArcTo()와 달리 0은 자동 분할을
 * 뜻하지 않습니다.
 */
export function ImDrawList__PathArcToN(
  self: ImDrawList,
  center: ImVec2Like,
  radius: number,
  a_min: number,
  a_max: number,
  num_segments: number,
): void {
  native.ImDrawList__PathArcToN(
    self,
    center,
    radius,
    a_min,
    a_max,
    num_segments,
  );
}
