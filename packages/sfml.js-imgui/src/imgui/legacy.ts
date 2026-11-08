import { native } from '../internal/native';
import type { ImVec2Like, ImVec2Value, ImVec4Like } from '../types';

/**
 * Display an image with the legacy tint and border colors.
 *
 * @zh 使用旧式着色和边框颜色显示图像。
 * @ja 従来の色調と枠線色を使って画像を表示します。
 * @ko 기존 틴트 및 테두리 색상으로 이미지를 표시합니다.
 *
 * @remarks
 * Obsoleted in Dear ImGui 1.91.9 (February 2025). This legacy JS overload
 * still accepts border_col. Modern image functions use ImGuiCol.Border for
 * the border color and ImGuiStyleVar.ImageBorderSize for its thickness.
 * @zh
 * 自 Dear ImGui 1.91.9（2025 年 2 月）起废弃。此旧版 JS 重载仍接受 border_col。
 * 新版图像函数使用 ImGuiCol.Border 设置边框颜色，使用 ImGuiStyleVar.ImageBorderSize 设置边框厚度。
 * @ja
 * Dear ImGui 1.91.9（2025 年 2 月）で廃止されました。この旧式 JS オーバーロードは今も border_col を受け取ります。
 * 新しい画像関数では、枠線の色に ImGuiCol.Border、太さに ImGuiStyleVar.ImageBorderSize を使います。
 * @ko
 * Dear ImGui 1.91.9(2025년 2월)에서 폐기되었습니다. 이 레거시 JS 오버로드는 여전히 border_col을 받습니다.
 * 새 이미지 함수는 테두리 색상에 ImGuiCol.Border, 두께에 ImGuiStyleVar.ImageBorderSize를 사용합니다.
 *
 * @param user_texture_id - Renderer texture identifier (ImTextureID bigint),
 * not an SFML texture object.
 * @zh user_texture_id - 渲染器纹理标识符（ImTextureID bigint），不是 SFML 纹理对象。
 * @ja user_texture_id - レンダラーのテクスチャ識別子（ImTextureID の bigint）です。SFML
 * テクスチャオブジェクトではありません。
 * @ko user_texture_id - 렌더러 텍스처 식별자(ImTextureID bigint)이며 SFML 텍스처 객체가 아닙니다.
 *
 * @param image_size - Displayed image width and height in screen pixels,
 * independent of texture dimensions.
 * @zh image_size - 图像显示的屏幕像素宽高，与纹理尺寸无关。
 * @ja image_size - テクスチャ寸法とは独立した、画面ピクセル単位の画像表示幅と高さです。
 * @ko image_size - 텍스처 크기와 독립적인 화면 픽셀 단위의 이미지 표시 너비와 높이입니다.
 *
 * @param uv0 - Texture coordinates at the upper-left corner; (0,0) is the usual
 * full-image start.
 * @zh uv0 - 左上角纹理坐标；完整图像通常从 (0,0) 开始。
 * @ja uv0 - 左上のテクスチャ座標です。画像全体では通常 (0,0) を使います。
 * @ko uv0 - 왼쪽 위 텍스처 좌표입니다. 전체 이미지는 보통 (0,0)에서 시작합니다.
 *
 * @param uv1 - Texture coordinates at the lower-right corner; (1,1) is the
 * usual full-image end.
 * @zh uv1 - 右下角纹理坐标；完整图像通常以 (1,1) 结束。
 * @ja uv1 - 右下のテクスチャ座標です。画像全体では通常 (1,1) を使います。
 * @ko uv1 - 오른쪽 아래 텍스처 좌표입니다. 전체 이미지는 보통 (1,1)에서 끝납니다.
 *
 * @param tint_col - RGBA color multiplied into the image; white preserves its
 * colors.
 * @zh tint_col - 与图像相乘的 RGBA 颜色；白色保持原色。
 * @ja tint_col - 画像に乗算する RGBA 色です。白は元の色を維持します。
 * @ko tint_col - 이미지에 곱하는 RGBA 색상입니다. 흰색은 원래 색을 유지합니다.
 *
 * @param border_col - RGBA image border color; zero alpha suppresses the
 * border.
 * @zh border_col - 图像边框的 RGBA 颜色；alpha 为零时不显示边框。
 * @ja border_col - 画像枠の RGBA 色です。アルファがゼロなら枠を描きません。
 * @ko border_col - 이미지 테두리 RGBA 색상입니다. 알파가 0이면 테두리를 표시하지 않습니다.
 */
export function ImageImVec4(
  user_texture_id: bigint,
  image_size: ImVec2Like,
  uv0: ImVec2Like,
  uv1: ImVec2Like,
  tint_col: ImVec4Like,
  border_col: ImVec4Like,
): void {
  native.ImageImVec4(
    user_texture_id,
    image_size,
    uv0,
    uv1,
    tint_col,
    border_col,
  );
}

/**
 * Push the button-repeat setting.
 *
 * @zh 压入按钮重复触发设置。
 * @ja ボタンのリピート設定をスタックに積みます。
 * @ko 버튼 반복 설정을 스택에 넣습니다.
 *
 * @remarks
 * OBSOLETED in 1.91.0 (from July 2024)
 * @zh
 * 于 1.91.0（2024 年 7 月起）废弃。
 * @ja
 * 1.91.0（2024 年 7 月から）で廃止。
 * @ko
 * 1.91.0(2024년 7월부터)에서 폐기.
 *
 * @param repeat - Whether holding the key or button generates repeated
 * activations using ImGui repeat timing.
 * @zh repeat - 是否按照 ImGui 重复时序，在按住按键或按钮时产生重复激活。
 * @ja repeat - キーやボタンを押し続けたとき ImGui のリピート設定で繰り返し反応するかどうかです。
 * @ko repeat - 키나 버튼을 누르고 있을 때 ImGui 반복 시간 설정으로 반복 활성화할지 여부입니다.
 */
export function PushButtonRepeat(repeat: boolean): void {
  native.PushButtonRepeat(repeat);
}

/**
 * Restore the item flags saved by the matching legacy PushButtonRepeat.
 *
 * @zh 恢复配对的旧版 PushButtonRepeat 保存的控件标志。
 * @ja 対応する旧 API の PushButtonRepeat が保存した項目フラグを復元します。
 * @ko 대응하는 기존 PushButtonRepeat가 저장한 항목 플래그를 복원합니다.
 */
export function PopButtonRepeat(): void {
  native.PopButtonRepeat();
}

/**
 * Temporarily control whether subsequent items can receive focus through Tab
 * navigation.
 *
 * @zh 临时控制后续控件能否通过 Tab 导航获得焦点。
 * @ja 後続の項目が Tab キーの移動でフォーカスを受け取れるかを一時的に設定します。
 * @ko 이후 항목이 Tab 탐색으로 포커스를 받을 수 있는지 임시로 설정합니다.
 *
 * @param tab_stop - Whether following items participate in keyboard Tab
 * navigation.
 * @zh tab_stop - 后续项是否参与键盘 Tab 导航。
 * @ja tab_stop - 以降の項目を Tab キーの移動対象にするかどうかです。
 * @ko tab_stop - 이후 항목을 키보드 Tab 탐색에 포함할지 여부입니다.
 */
export function PushTabStop(tab_stop: boolean): void {
  native.PushTabStop(tab_stop);
}

/**
 * Restore the item flags saved by the matching legacy PushTabStop.
 *
 * @zh 恢复配对的旧版 PushTabStop 保存的控件标志。
 * @ja 対応する旧 API の PushTabStop が保存した項目フラグを復元します。
 * @ko 대응하는 기존 PushTabStop이 저장한 항목 플래그를 복원합니다.
 */
export function PopTabStop(): void {
  native.PopTabStop();
}

/**
 * Get the maximum content boundary in window-local coordinates.
 *
 * @zh 获取内容区域最大边界的窗口局部坐标。
 * @ja コンテンツ領域の最大境界をウィンドウ内座標で取得します。
 * @ko 콘텐츠 영역의 최대 경계를 창 내부 좌표로 가져옵니다.
 *
 * @remarks
 * Content boundaries max (e.g. window boundaries including scrolling, or
 * current column boundaries).
 *
 * You should never need this.
 *
 * Always use GetCursorScreenPos() and GetContentRegionAvail()!
 * @zh
 * 内容区域的最大边界（例如包含滚动的窗口边界，或当前列边界）。
 *
 * 你不应需要此函数，请始终使用 GetCursorScreenPos() 和 GetContentRegionAvail()！
 * @ja
 * 内容領域の最大境界です（スクロールを含むウィンドウ境界や現在の列境界など）。
 *
 * これは必要ないはずです。
 *
 * 常に GetCursorScreenPos() と GetContentRegionAvail() を使ってください！
 * @ko
 * 콘텐츠 영역의 최대 경계입니다(예: 스크롤을 포함한 창 경계 또는 현재 열 경계).
 *
 * 이 함수는 필요하지 않아야 합니다.
 *
 * 항상 GetCursorScreenPos()와 GetContentRegionAvail()을 사용하세요!
 *
 * @returns Content boundary for the current window or column: copied {x,y} in
 * window-local pixels, accounting for scrolling.
 * @zh 当前窗口或列的内容边界的窗口局部像素坐标副本 {x,y}，包含滚动影响。
 * @ja 現在のウィンドウまたは列の内容境界をスクロールを考慮したウィンドウローカルの {x,y} ピクセル値としてコピーします。
 * @ko 현재 창 또는 열의 콘텐츠 경계의 스크롤을 반영한 창 로컬 픽셀 좌표 복사본 {x,y}입니다.
 */
export function GetContentRegionMax(): ImVec2Value {
  return native.GetContentRegionMax();
}

/**
 * Get the minimum window content boundary in window-local coordinates.
 *
 * @zh 获取窗口内容区域最小边界的窗口局部坐标。
 * @ja ウィンドウのコンテンツ領域の最小境界をウィンドウ内座標で取得します。
 * @ko 창 콘텐츠 영역의 최소 경계를 창 내부 좌표로 가져옵니다.
 *
 * @remarks
 * Content boundaries min for the window (roughly (0,0)-Scroll), in window-local
 * coordinates.
 *
 * You should never need this.
 *
 * Always use GetCursorScreenPos() and GetContentRegionAvail()!
 * @zh
 * 窗口内容区域的最小边界（约为 (0,0)-Scroll），使用窗口局部坐标。
 *
 * 你不应需要此函数，请始终使用 GetCursorScreenPos() 和 GetContentRegionAvail()！
 * @ja
 * ウィンドウの内容領域の最小境界（おおよそ (0,0)-Scroll）をウィンドウローカル座標で表します。
 *
 * これは必要ないはずです。
 *
 * 常に GetCursorScreenPos() と GetContentRegionAvail() を使ってください！
 * @ko
 * 창 콘텐츠 영역의 최소 경계(대략 (0,0)-Scroll)를 창 로컬 좌표로 나타냅니다.
 *
 * 이 함수는 필요하지 않아야 합니다.
 *
 * 항상 GetCursorScreenPos()와 GetContentRegionAvail()을 사용하세요!
 *
 * @returns Window content top-left: copied {x,y} in window-local pixels,
 * accounting for scrolling.
 * @zh 窗口内容左上角的窗口局部像素坐标副本 {x,y}，包含滚动影响。
 * @ja ウィンドウ内容の左上をスクロールを考慮したウィンドウローカルの {x,y} ピクセル値としてコピーします。
 * @ko 창 콘텐츠의 왼쪽 위의 스크롤을 반영한 창 로컬 픽셀 좌표 복사본 {x,y}입니다.
 */
export function GetWindowContentRegionMin(): ImVec2Value {
  return native.GetWindowContentRegionMin();
}

/**
 * Get the maximum window content boundary in window-local coordinates.
 *
 * @zh 获取窗口内容区域最大边界的窗口局部坐标。
 * @ja ウィンドウのコンテンツ領域の最大境界をウィンドウ内座標で取得します。
 * @ko 창 콘텐츠 영역의 최대 경계를 창 내부 좌표로 가져옵니다.
 *
 * @remarks
 * Content boundaries max for the window (roughly (0,0)+Size-Scroll), in
 * window-local coordinates.
 *
 * You should never need this.
 *
 * Always use GetCursorScreenPos() and GetContentRegionAvail()!
 * @zh
 * 窗口内容区域的最大边界（约为 (0,0)+Size-Scroll），使用窗口局部坐标。
 *
 * 你不应需要此函数，请始终使用 GetCursorScreenPos() 和 GetContentRegionAvail()！
 * @ja
 * ウィンドウの内容領域の最大境界（おおよそ (0,0)+Size-Scroll）をウィンドウローカル座標で表します。
 *
 * これは必要ないはずです。
 *
 * 常に GetCursorScreenPos() と GetContentRegionAvail() を使ってください！
 * @ko
 * 창 콘텐츠 영역의 최대 경계(대략 (0,0)+Size-Scroll)를 창 로컬 좌표로 나타냅니다.
 *
 * 이 함수는 필요하지 않아야 합니다.
 *
 * 항상 GetCursorScreenPos()와 GetContentRegionAvail()을 사용하세요!
 *
 * @returns Window content bottom-right: copied {x,y} in window-local pixels,
 * accounting for scrolling.
 * @zh 窗口内容右下角的窗口局部像素坐标副本 {x,y}，包含滚动影响。
 * @ja ウィンドウ内容の右下をスクロールを考慮したウィンドウローカルの {x,y} ピクセル値としてコピーします。
 * @ko 창 콘텐츠의 오른쪽 아래의 스크롤을 반영한 창 로컬 픽셀 좌표 복사본 {x,y}입니다.
 */
export function GetWindowContentRegionMax(): ImVec2Value {
  return native.GetWindowContentRegionMax();
}

/**
 * Begin a child window with frame styling.
 *
 * @zh 开始带框架样式的子窗口。
 * @ja フレームスタイルの子ウィンドウを開始します。
 * @ko 프레임 스타일이 적용된 자식 창을 시작합니다.
 *
 * @remarks
 * Obsolete since 1.90.0 (September 2023). Use `BeginChild()` with
 * `ImGuiChildFlags.FrameStyle` instead.
 *
 * This helper uses `window_flags = 0`. Always call `EndChildFrame()` after it,
 * even when it returns `false`; it delegates to the child-window lifecycle.
 * @zh
 * 自 1.90.0（2023 年 9 月）起废弃。请改用带 `ImGuiChildFlags.FrameStyle` 的 `BeginChild()`。
 *
 * 此辅助函数使用 `window_flags = 0`。调用后始终需要调用 `EndChildFrame()`，即使返回 `false`
 * 也不例外；它遵循子窗口生命周期。
 * @ja
 * 1.90.0（2023 年 9 月）以降は廃止されています。`ImGuiChildFlags.FrameStyle` を指定した
 * `BeginChild()` を使ってください。
 *
 * このヘルパーは `window_flags = 0` を使います。子ウィンドウのライフサイクルに従うため、`false` を返しても必ず
 * `EndChildFrame()` を呼んでください。
 * @ko
 * 1.90.0(2023년 9월)부터 폐기되었습니다. `ImGuiChildFlags.FrameStyle`을 지정한 `BeginChild()`를
 * 사용하세요.
 *
 * 이 헬퍼는 `window_flags = 0`을 사용합니다. 자식 창 수명 주기를 따르므로 `false`를 반환해도 항상
 * `EndChildFrame()`을 호출해야 합니다.
 *
 * @param id - Numeric ID identifying the child window, popup, or selection
 * entry, passed directly without string hashing.
 * @zh id - 标识子窗口、弹窗或选择条目的数值 ID，直接传入而不做字符串散列。
 * @ja id - 子ウィンドウ、ポップアップ、選択項目の数値 ID です。文字列ハッシュを行わず直接使います。
 * @ko id - 자식 창, 팝업 또는 선택 항목의 숫자 ID입니다. 문자열 해시 없이 직접 전달됩니다.
 *
 * @param size - Child-window width and height in pixels: 0 uses the remaining
 * region, positive fixes an axis, negative uses remaining space minus that
 * amount.
 * @zh size - 子窗口像素宽高：0 使用剩余区域，正值固定尺寸，负值从剩余空间中减去其绝对值。
 * @ja size - 子ウィンドウのピクセル幅・高さです。0 は残り全体、正は固定、負は残りから絶対値分を引きます。
 * @ko size - 자식 창의 픽셀 너비와 높이입니다. 0은 남은 영역, 양수는 고정값, 음수는 남은 공간에서 절댓값을 뺍니다.
 *
 * @returns True when child contents should be submitted; false when fully
 * clipped or collapsed. Call EndChild() even when false (EndChildFrame() for
 * the legacy frame helper).
 * @zh 应提交子窗口内容时返回 true，完全裁剪或折叠时为 false。即使为 false 也须调用 EndChild()，旧式 frame 辅助函数用
 * EndChildFrame()。
 * @ja 子の内容を描く場合は true、完全クリップや折りたたみ時は false です。false でも EndChild()、旧 frame 版なら
 * EndChildFrame() を呼びます。
 * @ko 자식 내용을 제출해야 하면 true, 완전히 잘리거나 접히면 false입니다. false여도 EndChild()를 호출하며 레거시
 * frame은 EndChildFrame()을 사용합니다.
 */
export function BeginChildFrame(id: number, size: ImVec2Like): boolean {
  return native.BeginChildFrame(id, size);
}

/**
 * Begin a child window styled like a framed widget using the legacy helper.
 *
 * @zh 使用旧版辅助函数开始一个带框控件样式的子窗口。
 * @ja 旧ヘルパーを使い、枠付きウィジェットのスタイルで子ウィンドウを開始します。
 * @ko 기존 헬퍼로 테두리 있는 위젯 스타일의 자식 창을 시작합니다.
 *
 * @param id - Numeric ID identifying the child window, popup, or selection
 * entry, passed directly without string hashing.
 * @zh id - 标识子窗口、弹窗或选择条目的数值 ID，直接传入而不做字符串散列。
 * @ja id - 子ウィンドウ、ポップアップ、選択項目の数値 ID です。文字列ハッシュを行わず直接使います。
 * @ko id - 자식 창, 팝업 또는 선택 항목의 숫자 ID입니다. 문자열 해시 없이 직접 전달됩니다.
 *
 * @param size - Child-window width and height in pixels: 0 uses the remaining
 * region, positive fixes an axis, negative uses remaining space minus that
 * amount.
 * @zh size - 子窗口像素宽高：0 使用剩余区域，正值固定尺寸，负值从剩余空间中减去其绝对值。
 * @ja size - 子ウィンドウのピクセル幅・高さです。0 は残り全体、正は固定、負は残りから絶対値分を引きます。
 * @ko size - 자식 창의 픽셀 너비와 높이입니다. 0은 남은 영역, 양수는 고정값, 음수는 남은 공간에서 절댓값을 뺍니다.
 *
 * @param window_flags - ImGuiWindowFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh window_flags - 控制此操作的 ImGuiWindowFlags 选项；可用 | 组合兼容的标志位。
 * @ja window_flags - この操作を制御する ImGuiWindowFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko window_flags - 이 동작을 제어하는 ImGuiWindowFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when child contents should be submitted; false when fully
 * clipped or collapsed. Call EndChild() even when false (EndChildFrame() for
 * the legacy frame helper).
 * @zh 应提交子窗口内容时返回 true，完全裁剪或折叠时为 false。即使为 false 也须调用 EndChild()，旧式 frame 辅助函数用
 * EndChildFrame()。
 * @ja 子の内容を描く場合は true、完全クリップや折りたたみ時は false です。false でも EndChild()、旧 frame 版なら
 * EndChildFrame() を呼びます。
 * @ko 자식 내용을 제출해야 하면 true, 완전히 잘리거나 접히면 false입니다. false여도 EndChild()를 호출하며 레거시
 * frame은 EndChildFrame()을 사용합니다.
 */
export function BeginChildFrameEx(
  id: number,
  size: ImVec2Like,
  window_flags: number = 0,
): boolean {
  return native.BeginChildFrameEx(id, size, window_flags);
}

/**
 * End the framed child window opened by the legacy BeginChildFrame helper.
 *
 * @zh 结束旧版 BeginChildFrame 辅助函数打开的带框子窗口。
 * @ja 旧ヘルパーの BeginChildFrame で開始した枠付き子ウィンドウを終了します。
 * @ko 기존 BeginChildFrame 헬퍼로 시작한 테두리 있는 자식 창을 끝냅니다.
 */
export function EndChildFrame(): void {
  native.EndChildFrame();
}

/**
 * Show the ID stack debugging window.
 *
 * @zh 显示 ID 栈调试窗口。
 * @ja ID スタックのデバッグウィンドウを表示します。
 * @ko ID 스택 디버그 창을 표시합니다.
 *
 * @remarks
 * Legacy name for `ShowIDStackToolWindow()`. Hover items in the tool to inspect
 * the origin of their unique IDs.
 * @zh
 * `ShowIDStackToolWindow()` 的旧名称。在工具中悬停条目可检查其唯一 ID 的来源。
 * @ja
 * `ShowIDStackToolWindow()` の旧名称です。ツール内でアイテムにマウスを重ねると一意の ID の由来を確認できます。
 * @ko
 * `ShowIDStackToolWindow()`의 이전 이름입니다. 도구에서 항목 위에 마우스를 놓으면 고유 ID의 출처를 확인할 수
 * 있습니다.
 *
 * @param p_open - Optional open state in Uint8Array[0]. Write only 0 (closed)
 * or 1 (open); the close button writes 0. Null omits the close button.
 * The native call accesses this writable backing memory directly.
 * @zh p_open - Uint8Array[0] 中的可选打开状态，只能写入 0（关闭）或 1（打开）。
 * 关闭按钮写入 0；null 不显示关闭按钮。原生调用直接访问此可写内存。
 * @ja p_open - Uint8Array[0] の開閉状態です。0（閉）か 1（開）のみを書き込みます。
 * 閉じるボタンは 0 を書き込み、null ではボタンを省略します。ネイティブ処理はこのメモリを直接使います。
 * @ko p_open - Uint8Array[0]의 선택적 열림 상태입니다. 0(닫힘) 또는 1(열림)만 쓰세요.
 * 닫기 버튼은 0을 쓰며 null이면 버튼을 생략합니다. 네이티브 호출은 이 쓰기 가능한 메모리에 직접 접근합니다.
 */
export function ShowStackToolWindow(p_open: Uint8Array | null = null): void {
  native.ShowStackToolWindow(p_open);
}

/**
 * Allow later items to overlap the last item.
 *
 * @zh 允许后续条目覆盖最后一个条目。
 * @ja 最後のアイテムに後続のアイテムが重なることを許可します。
 * @ko 이후 항목이 마지막 항목과 겹치도록 허용합니다.
 *
 * @remarks
 * OBSOLETED in 1.89.7 (from June 2023)
 *
 * Use SetNextItemAllowOverlap() before item.
 * @zh
 * 于 1.89.7（2023 年 6 月起）废弃。
 *
 * 在项目之前使用 SetNextItemAllowOverlap()。
 * @ja
 * 1.89.7（2023 年 6 月から）で廃止。
 *
 * 項目の前に SetNextItemAllowOverlap() を使ってください。
 * @ko
 * 1.89.7(2023년 6월부터)에서 폐기.
 *
 * 항목 전에 SetNextItemAllowOverlap()을 사용하세요.
 */
export function SetItemAllowOverlap(): void {
  native.SetItemAllowOverlap();
}

/**
 * Push whether subsequent items accept keyboard focus.
 *
 * @zh 压入后续条目是否接受键盘焦点的设置。
 * @ja 後続のアイテムがキーボードフォーカスを受け取るかをスタックに積みます。
 * @ko 이후 항목의 키보드 포커스 허용 여부를 스택에 넣습니다.
 *
 * @remarks
 * OBSOLETED in 1.89.4 (from March 2023)
 * @zh
 * 于 1.89.4（2023 年 3 月起）废弃。
 * @ja
 * 1.89.4（2023 年 3 月から）で廃止。
 * @ko
 * 1.89.4(2023년 3월부터)에서 폐기.
 *
 * @param tab_stop - Whether following items participate in keyboard Tab
 * navigation.
 * @zh tab_stop - 后续项是否参与键盘 Tab 导航。
 * @ja tab_stop - 以降の項目を Tab キーの移動対象にするかどうかです。
 * @ko tab_stop - 이후 항목을 키보드 Tab 탐색에 포함할지 여부입니다.
 */
export function PushAllowKeyboardFocus(tab_stop: boolean): void {
  native.PushAllowKeyboardFocus(tab_stop);
}

/**
 * Restore the item flags saved by the matching legacy PushAllowKeyboardFocus.
 *
 * @zh 恢复配对的旧版 PushAllowKeyboardFocus 保存的控件标志。
 * @ja 対応する旧 API の PushAllowKeyboardFocus が保存した項目フラグを復元します。
 * @ko 대응하는 기존 PushAllowKeyboardFocus가 저장한 항목 플래그를 복원합니다.
 */
export function PopAllowKeyboardFocus(): void {
  native.PopAllowKeyboardFocus();
}
