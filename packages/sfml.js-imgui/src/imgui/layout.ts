import { native } from '../internal/native';
import type { ImVec2Like, ImVec2Value } from '../types';

/**
 * Push the width used by subsequent item-and-label widgets.
 *
 * @zh 压入后续带标签控件使用的宽度。
 * @ja 後続のラベル付きウィジェットの幅をスタックに積みます。
 * @ko 이후 레이블이 있는 위젯의 너비를 스택에 넣습니다.
 *
 * @remarks
 * push width of items for common large "item+label" widgets.
 *
 * >0.0: width in pixels, <0.0 align xx pixels to the right of window (so
 * -FLT_MIN always align width to the right side).
 * @zh
 * 参数栈（当前窗口）：将常见的大型“项目+标签”控件的项目宽度压入栈。
 *
 * >0.0 表示像素宽度；<0.0 表示与窗口右边缘相距 xx 像素对齐（因此 -FLT_MIN 始终使宽度对齐右侧）。
 * @ja
 * パラメータースタック（現在のウィンドウ）：一般的な大型「項目＋ラベル」ウィジェットの項目幅をスタックに積みます。
 *
 * >0.0 はピクセル単位の幅、<0.0 はウィンドウ右端から xx ピクセルの位置に揃えます（そのため -FLT_MIN は常に幅を右端に揃えます）。
 * @ko
 * 매개변수 스택(현재 창): 일반적인 큰 '항목+레이블' 위젯의 항목 너비를 스택에 넣습니다.
 *
 * >0.0는 픽셀 너비, <0.0는 창 오른쪽에서 xx 픽셀 떨어진 위치에 정렬함을 뜻합니다(따라서 -FLT_MIN은 항상 너비를
 * 오른쪽에 맞춥니다).
 *
 * @param item_width - Width in pixels for framed items; 0 uses the default,
 * negative values align to the right edge (use -FLT_MIN for right alignment).
 * @zh item_width - 带框控件的像素宽度；0 使用默认值，负值相对右边缘定位，-FLT_MIN 表示右对齐。
 * @ja item_width - 枠付き項目の幅です。0 は既定値、負の値は右端基準で、-FLT_MIN は右揃えです。
 * @ko item_width - 프레임 위젯의 픽셀 너비입니다. 0은 기본값, 음수는 오른쪽 끝 기준이며 -FLT_MIN은 오른쪽
 * 정렬입니다.
 */
export function PushItemWidth(item_width: number): void {
  native.PushItemWidth(item_width);
}

/**
 * Restore the widget width saved by PushItemWidth in the current window.
 *
 * @zh 恢复当前窗口中 PushItemWidth 保存的控件宽度。
 * @ja 現在のウィンドウで PushItemWidth が保存したウィジェット幅を復元します。
 * @ko 현재 창에서 PushItemWidth가 저장한 위젯 너비를 복원합니다.
 */
export function PopItemWidth(): void {
  native.PopItemWidth();
}

/**
 * Set the width of the next item-and-label widget.
 *
 * @zh 设置下一个带标签控件的宽度。
 * @ja 次のラベル付きウィジェットの幅を設定します。
 * @ko 다음 레이블이 있는 위젯의 너비를 설정합니다.
 *
 * @remarks
 * set width of the _next_ common large "item+label" widget.
 *
 * >0.0: width in pixels, <0.0 align xx pixels to the right of window (so
 * -FLT_MIN always align width to the right side)
 * @zh
 * 设置下一个常见的大型“项目+标签”控件的宽度。
 *
 * >0.0 表示像素宽度；<0.0 表示与窗口右边缘相距 xx 像素对齐（因此 -FLT_MIN 始终使宽度对齐右侧）。
 * @ja
 * 次の一般的な大型「項目＋ラベル」ウィジェットの幅を設定します。
 *
 * >0.0 はピクセル単位の幅、<0.0 はウィンドウ右端から xx ピクセルの位置に揃えます（そのため -FLT_MIN は常に幅を右端に揃えます）。
 * @ko
 * 다음 일반적인 큰 '항목+레이블' 위젯의 너비를 설정합니다.
 *
 * >0.0는 픽셀 너비, <0.0는 창 오른쪽에서 xx 픽셀 떨어진 위치에 정렬함을 뜻합니다(따라서 -FLT_MIN은 항상 너비를
 * 오른쪽에 맞춥니다).
 *
 * @param item_width - Width in pixels for framed items; 0 uses the default,
 * negative values align to the right edge (use -FLT_MIN for right alignment).
 * @zh item_width - 带框控件的像素宽度；0 使用默认值，负值相对右边缘定位，-FLT_MIN 表示右对齐。
 * @ja item_width - 枠付き項目の幅です。0 は既定値、負の値は右端基準で、-FLT_MIN は右揃えです。
 * @ko item_width - 프레임 위젯의 픽셀 너비입니다. 0은 기본값, 음수는 오른쪽 끝 기준이며 -FLT_MIN은 오른쪽
 * 정렬입니다.
 */
export function SetNextItemWidth(item_width: number): void {
  native.SetNextItemWidth(item_width);
}

/**
 * Calculate item width from the current settings and cursor position.
 *
 * @zh 根据当前设置和光标位置计算条目宽度。
 * @ja 現在の設定とカーソル位置からアイテムの幅を計算します。
 * @ko 현재 설정과 커서 위치에서 항목 너비를 계산합니다.
 *
 * @remarks
 * width of item given pushed settings and current cursor position.
 *
 * NOT necessarily the width of last item unlike most 'Item' functions.
 * @zh
 * 根据已压栈的设置和当前光标位置计算的项目宽度。
 *
 * 与大多数 'Item' 函数不同，它不一定是最后一个项目的宽度。
 * @ja
 * スタックに積んだ設定と現在のカーソル位置から求めた項目の幅です。
 *
 * 大半の 'Item' 関数とは異なり、必ずしも最後の項目の幅ではありません。
 * @ko
 * 스택에 넣은 설정과 현재 커서 위치에 따른 항목 너비입니다.
 *
 * 대부분의 'Item' 함수와 달리 반드시 마지막 항목의 너비를 뜻하지는 않습니다.
 *
 * @returns Resolved item width in pixels after applying the current item-width
 * stack and available space.
 * @zh 根据当前项宽度栈和可用空间解析出的项像素宽度。
 * @ja 現在の幅スタックと利用可能領域から解決した項目のピクセル幅です。
 * @ko 현재 항목 너비 스택과 가용 공간을 적용해 계산한 항목 픽셀 너비입니다.
 */
export function CalcItemWidth(): number {
  return native.CalcItemWidth();
}

/**
 * Push the wrapping position for subsequent text.
 *
 * @zh 压入后续文本使用的换行位置。
 * @ja 後続のテキストの折り返し位置をスタックに積みます。
 * @ko 이후 텍스트의 줄바꿈 위치를 스택에 넣습니다.
 *
 * @remarks
 * push word-wrapping position for Text*() commands.
 *
 * < 0.0: no wrapping; 0.0: wrap to end of window (or column); > 0.0: wrap at
 * 'wrap_pos_x' position in window local space
 * @zh
 * 将 Text*() 命令的自动换行位置压入栈。
 *
 * < 0.0：不换行；0.0：在窗口（或列）末尾换行；> 0.0：在窗口局部坐标的 'wrap_pos_x' 位置换行。
 * @ja
 * Text*() コマンドの折り返し位置をスタックに積みます。
 *
 * < 0.0：折り返しなし、0.0：ウィンドウ（または列）の末端で折り返し、> 0.0：ウィンドウローカル座標の 'wrap_pos_x'
 * 位置で折り返します。
 * @ko
 * Text*() 명령의 줄 바꿈 위치를 스택에 넣습니다.
 *
 * < 0.0: 줄 바꿈 없음, 0.0: 창(또는 열) 끝에서 줄 바꿈, > 0.0: 창 로컬 좌표의 'wrap_pos_x' 위치에서 줄
 * 바꿈.
 *
 * @param wrap_local_pos_x - Window-local text wrap boundary; 0 wraps at the
 * window edge, negative values disable wrapping.
 * @zh wrap_local_pos_x - 窗口局部坐标中的文字换行边界；0 在窗口边缘换行，负值禁用换行。
 * @ja wrap_local_pos_x - ウィンドウローカル座標での折り返し位置です。0 はウィンドウ端、負の値は折り返しなしです。
 * @ko wrap_local_pos_x - 창 로컬 좌표의 줄바꿈 경계입니다. 0은 창 끝이며 음수는 줄바꿈을 비활성화합니다.
 */
export function PushTextWrapPos(wrap_local_pos_x: number = 0.0): void {
  native.PushTextWrapPos(wrap_local_pos_x);
}

/**
 * Restore the text-wrapping position saved by PushTextWrapPos in the current
 * window.
 *
 * @zh 恢复当前窗口中 PushTextWrapPos 保存的文本换行位置。
 * @ja 現在のウィンドウで PushTextWrapPos が保存したテキストの折り返し位置を復元します。
 * @ko 현재 창에서 PushTextWrapPos가 저장한 텍스트 줄바꿈 위치를 복원합니다.
 */
export function PopTextWrapPos(): void {
  native.PopTextWrapPos();
}

/**
 * Get the layout cursor position in screen coordinates.
 *
 * @zh 获取布局光标的屏幕坐标。
 * @ja レイアウトカーソルの画面座標を取得します。
 * @ko 레이아웃 커서의 화면 좌표를 가져옵니다.
 *
 * @remarks
 * - By "cursor" we mean the current output position.
 *
 * - The typical widget behavior is to output themselves at the current cursor
 *   position, then move the cursor one line down.
 *
 * - You can call SameLine() between widgets to undo the last carriage return
 *   and output at the right of the preceding widget.
 *
 * - YOU CAN DO 99% OF WHAT YOU NEED WITH ONLY GetCursorScreenPos() and
 *   GetContentRegionAvail().
 *
 * - Attention! We currently have inconsistencies between window-local and
 *   absolute positions we will aim to fix with future API:
 *
 * - Absolute coordinate:        GetCursorScreenPos(), SetCursorScreenPos(), all
 *   `ImGui.ImDrawList_*` functions. This is the preferred coordinate system.
 *
 * - Window-local coordinates:   SameLineEx(offset), GetCursorPos(),
 *   SetCursorPos(), GetCursorStartPos(), PushTextWrapPos()
 * - Window-local coordinates:   GetContentRegionMax(),
 *   GetWindowContentRegionMin(), GetWindowContentRegionMax() --> all obsoleted.
 *   YOU DON'T NEED THEM.
 *
 * - GetCursorScreenPos() = GetCursorPos() + GetWindowPos(). GetWindowPos() is
 *   almost only ever useful to convert from window-local to absolute
 *   coordinates. Try not to use it.
 *
 * cursor position, absolute coordinates. THIS IS YOUR BEST FRIEND (prefer using
 * this rather than GetCursorPos(), also more useful to work with ImDrawList
 * API).
 * @zh
 * 布局光标定位：
 *
 * - 此处“光标”指当前输出位置。
 *
 * - 控件通常在当前光标处输出，然后将光标下移一行。
 *
 * - 可在控件之间调用 SameLine()，撤销上次换行，将内容输出在前一个控件的右侧。
 *
 * - 仅使用 GetCursorScreenPos() 和 GetContentRegionAvail() 就能完成 99% 的需求。
 *
 * - 注意！窗口局部坐标与绝对坐标目前存在不一致，计划通过未来 API 修正：
 *
 * - 绝对坐标：GetCursorScreenPos()、SetCursorScreenPos()、所有 `ImGui.ImDrawList_*`
 *   函数；这是今后推荐的方式。
 *
 * -
 * 窗口局部坐标：SameLineEx(offset)、GetCursorPos()、SetCursorPos()、GetCursorStartPos()、
 *   PushTextWrapPos()。
 *
 * -
 *   窗口局部坐标：GetContentRegionMax()、GetWindowContentRegionMin()、
 *   GetWindowContentRegionMax()；这些均已废弃，无需使用。
 *
 * - GetCursorScreenPos() = GetCursorPos() + GetWindowPos()。GetWindowPos()
 *   几乎只在从窗口局部坐标转换为绝对坐标时有用，尽量不要使用。获取光标的绝对坐标位置。这是最实用的函数（应优先于 GetCursorPos()
 *   使用，也更便于配合 ImDrawList API）。
 * @ja
 * レイアウトのカーソル位置：
 *
 * - 「カーソル」は現在の出力位置を指します。
 *
 * - 通常のウィジェットは現在のカーソル位置に出力し、その後カーソルを 1 行下げます。
 *
 * - ウィジェット間で SameLine() を呼ぶと直前の改行を取り消し、前のウィジェットの右に出力できます。
 *
 * - GetCursorScreenPos() と GetContentRegionAvail() だけで必要なことの 99% を実現できます。
 *
 * - 注意！現在はウィンドウローカル座標と絶対座標に不整合があり、将来の API で修正する予定です。
 *
 * - 絶対座標：GetCursorScreenPos()、SetCursorScreenPos()、すべての `ImGui.ImDrawList_*`
 *   関数。今後はこちらを推奨します。
 *
 * -
 *   ウィンドウローカル座標：SameLineEx(offset)、GetCursorPos()、SetCursorPos()、
 *   GetCursorStartPos()、PushTextWrapPos()。
 *
 * -
 *   ウィンドウローカル座標：GetContentRegionMax()、GetWindowContentRegionMin()、
 *   GetWindowContentRegionMax() はすべて廃止済みで、使う必要はありません。
 *
 * - GetCursorScreenPos() = GetCursorPos() + GetWindowPos()。GetWindowPos()
 *   はほぼローカル座標から絶対座標への変換にしか役立ちません。なるべく使わないでください。カーソル位置を絶対座標で取得します。最も頼りになる関数です（
 *   GetCursorPos() より優先してください。ImDrawList API と組み合わせる際にも便利です）。
 * @ko
 * 레이아웃 커서 위치:
 *
 * - '커서'는 현재 출력 위치를 뜻합니다.
 *
 * - 일반적으로 위젯은 현재 커서 위치에 출력한 뒤 커서를 한 줄 아래로 옮깁니다.
 *
 * - 위젯 사이에서 SameLine()을 호출하면 마지막 줄 바꿈을 취소하고 이전 위젯 오른쪽에 출력할 수 있습니다.
 *
 * - GetCursorScreenPos()와 GetContentRegionAvail()만으로 필요한 작업의 99%를 할 수 있습니다.
 *
 * - 주의! 현재 창 로컬 좌표와 절대 좌표 사이에 일관되지 않은 부분이 있으며 향후 API에서 수정할 예정입니다.
 *
 * - 절대 좌표: GetCursorScreenPos(), SetCursorScreenPos(), 모든 `ImGui.ImDrawList_*`
 *   함수. 앞으로
 *   권장하는 방식입니다.
 *
 * - 창 로컬 좌표: SameLineEx(offset), GetCursorPos(), SetCursorPos(),
 *   GetCursorStartPos(), PushTextWrapPos().
 *
 * - 창 로컬 좌표: GetContentRegionMax(), GetWindowContentRegionMin(),
 *   GetWindowContentRegionMax()는 모두 폐기되었으며 필요하지 않습니다.
 *
 * - GetCursorScreenPos() = GetCursorPos() + GetWindowPos(). GetWindowPos()는 사실상
 *   창 로컬 좌표를 절대 좌표로 변환할 때만 유용하므로 가급적 사용하지 마세요. 커서 위치를 절대 좌표로 가져옵니다. 가장 유용한
 *   함수입니다(GetCursorPos()보다 우선 사용하세요. ImDrawList API와 함께 쓰기에도 더 유용합니다).
 *
 * @returns Current layout cursor, copied as {x,y} in absolute screen
 * coordinates; not a writable native view.
 * @zh 当前布局光标的绝对屏幕坐标副本 {x,y}，不是原生可写视图。
 * @ja 現在のレイアウトカーソルを絶対スクリーン座標の {x,y} としてコピーします。書き込みビューではありません。
 * @ko 현재 배치 커서의 절대 화면 좌표 복사본 {x,y}입니다. 네이티브 쓰기 뷰가 아닙니다.
 */
export function GetCursorScreenPos(): ImVec2Value {
  return native.GetCursorScreenPos();
}

/**
 * Set the layout cursor position in screen coordinates.
 *
 * @zh 设置布局光标的屏幕坐标。
 * @ja レイアウトカーソルの画面座標を設定します。
 * @ko 레이아웃 커서의 화면 좌표를 설정합니다.
 *
 * @remarks
 * cursor position, absolute coordinates.
 *
 * THIS IS YOUR BEST FRIEND.
 * @zh
 * 光标的绝对坐标位置。
 *
 * 这是最实用的函数。
 * @ja
 * 絶対座標でのカーソル位置です。
 *
 * 最も頼りになる関数です。
 * @ko
 * 절대 좌표의 커서 위치입니다.
 *
 * 가장 유용한 함수입니다.
 *
 * @param pos - Position in absolute screen coordinates, in pixels.
 * @zh pos - 绝对屏幕坐标位置，单位为像素。
 * @ja pos - 絶対スクリーン座標での位置です。単位はピクセルです。
 * @ko pos - 절대 화면 좌표의 위치이며 단위는 픽셀입니다.
 */
export function SetCursorScreenPos(pos: ImVec2Like): void {
  native.SetCursorScreenPos(pos);
}

/**
 * Get the available content area from the current cursor position.
 *
 * @zh 获取当前光标位置之后的可用内容区域。
 * @ja 現在のカーソル位置から利用可能なコンテンツ領域を取得します。
 * @ko 현재 커서 위치에서 사용 가능한 콘텐츠 영역을 가져옵니다.
 *
 * @remarks
 * available space from current position.
 *
 * THIS IS YOUR BEST FRIEND.
 * @zh
 * 当前位置的可用空间。
 *
 * 这是最实用的函数。
 * @ja
 * 現在位置から利用可能な領域です。
 *
 * 最も頼りになる関数です。
 * @ko
 * 현재 위치에서 사용 가능한 공간입니다.
 *
 * 가장 유용한 함수입니다.
 *
 * @returns Remaining region from the cursor to the content boundary: copied
 * pixel dimensions {x: width, y: height}.
 * @zh 从光标到内容边界的剩余区域的像素尺寸副本 {x: width, y: height}。
 * @ja カーソルから内容境界までの残り領域のピクセル寸法を {x: width, y: height} としてコピーします。
 * @ko 커서부터 콘텐츠 경계까지의 남은 영역의 픽셀 크기 복사본 {x: width, y: height}입니다.
 */
export function GetContentRegionAvail(): ImVec2Value {
  return native.GetContentRegionAvail();
}

/**
 * Get the layout cursor position in window-local coordinates.
 *
 * @zh 获取布局光标的窗口局部坐标。
 * @ja レイアウトカーソルのウィンドウ内座標を取得します。
 * @ko 레이아웃 커서의 창 내부 좌표를 가져옵니다.
 *
 * @remarks
 * [window-local] cursor position in window-local coordinates.
 *
 * This is not your best friend.
 * @zh
 * [窗口局部] 窗口局部坐标中的光标位置。
 *
 * 此函数并非最佳选择。
 * @ja
 * [ウィンドウローカル] ウィンドウローカル座標でのカーソル位置です。
 *
 * この関数は最適な選択ではありません。
 * @ko
 * [창 로컬] 창 로컬 좌표의 커서 위치입니다.
 *
 * 이 함수는 최선의 선택이 아닙니다.
 *
 * @returns Current layout cursor: copied {x,y} in window-local pixels,
 * accounting for scrolling.
 * @zh 当前布局光标的窗口局部像素坐标副本 {x,y}，包含滚动影响。
 * @ja 現在のレイアウトカーソルをスクロールを考慮したウィンドウローカルの {x,y} ピクセル値としてコピーします。
 * @ko 현재 배치 커서의 스크롤을 반영한 창 로컬 픽셀 좌표 복사본 {x,y}입니다.
 */
export function GetCursorPos(): ImVec2Value {
  return native.GetCursorPos();
}

/**
 * Read the layout cursor's X coordinate in window-local space.
 *
 * @zh 读取布局游标在窗口局部坐标系中的 X 坐标。
 * @ja ウィンドウのローカル座標でレイアウトカーソルの X 座標を取得します。
 * @ko 창 로컬 좌표계에서 레이아웃 커서의 X 좌표를 읽습니다.
 *
 * @remarks
 * Coordinates are relative to the current window. Prefer `GetCursorScreenPos()`
 * and `SetCursorScreenPos()` when working with screen-space drawing.
 * @zh
 * 坐标相对于当前窗口。使用屏幕空间绘制时，优先使用 `GetCursorScreenPos()` 和 `SetCursorScreenPos()`。
 * @ja
 * 座標は現在のウィンドウを基準とします。画面座標で描画するときは `GetCursorScreenPos()` と
 * `SetCursorScreenPos()` を優先してください。
 * @ko
 * 좌표는 현재 창을 기준으로 합니다. 화면 좌표로 그릴 때는 `GetCursorScreenPos()`와
 * `SetCursorScreenPos()`를 우선 사용하세요.
 *
 * @returns Current layout cursor coordinate on the selected axis in
 * window-local pixels.
 * @zh 当前布局光标在所选轴上的窗口局部像素坐标。
 * @ja 現在のレイアウトカーソルの対象軸座標です。ウィンドウローカルのピクセル単位です。
 * @ko 현재 배치 커서의 대상 축 좌표이며 창 로컬 픽셀 단위입니다.
 */
export function GetCursorPosX(): number {
  return native.GetCursorPosX();
}

/**
 * Read the layout cursor's Y coordinate in window-local space.
 *
 * @zh 读取布局游标在窗口局部坐标系中的 Y 坐标。
 * @ja ウィンドウのローカル座標でレイアウトカーソルの Y 座標を取得します。
 * @ko 창 로컬 좌표계에서 레이아웃 커서의 Y 좌표를 읽습니다.
 *
 * @remarks
 * Coordinates are relative to the current window. Prefer `GetCursorScreenPos()`
 * and `SetCursorScreenPos()` when working with screen-space drawing.
 * @zh
 * 坐标相对于当前窗口。使用屏幕空间绘制时，优先使用 `GetCursorScreenPos()` 和 `SetCursorScreenPos()`。
 * @ja
 * 座標は現在のウィンドウを基準とします。画面座標で描画するときは `GetCursorScreenPos()` と
 * `SetCursorScreenPos()` を優先してください。
 * @ko
 * 좌표는 현재 창을 기준으로 합니다. 화면 좌표로 그릴 때는 `GetCursorScreenPos()`와
 * `SetCursorScreenPos()`를 우선 사용하세요.
 *
 * @returns Current layout cursor coordinate on the selected axis in
 * window-local pixels.
 * @zh 当前布局光标在所选轴上的窗口局部像素坐标。
 * @ja 現在のレイアウトカーソルの対象軸座標です。ウィンドウローカルのピクセル単位です。
 * @ko 현재 배치 커서의 대상 축 좌표이며 창 로컬 픽셀 단위입니다.
 */
export function GetCursorPosY(): number {
  return native.GetCursorPosY();
}

/**
 * Set the layout cursor position in window-local coordinates.
 *
 * @zh 使用窗口局部坐标设置布局游标位置。
 * @ja ウィンドウのローカル座標でレイアウトカーソルの位置を設定します。
 * @ko 창 로컬 좌표로 레이아웃 커서 위치를 설정합니다.
 *
 * @remarks
 * Coordinates are relative to the current window. Prefer `GetCursorScreenPos()`
 * and `SetCursorScreenPos()` when working with screen-space drawing.
 * @zh
 * 坐标相对于当前窗口。使用屏幕空间绘制时，优先使用 `GetCursorScreenPos()` 和 `SetCursorScreenPos()`。
 * @ja
 * 座標は現在のウィンドウを基準とします。画面座標で描画するときは `GetCursorScreenPos()` と
 * `SetCursorScreenPos()` を優先してください。
 * @ko
 * 좌표는 현재 창을 기준으로 합니다. 화면 좌표로 그릴 때는 `GetCursorScreenPos()`와
 * `SetCursorScreenPos()`를 우선 사용하세요.
 *
 * @param local_pos - Position in the current window-local coordinate space, in
 * pixels.
 * @zh local_pos - 当前窗口局部坐标空间中的位置，单位为像素。
 * @ja local_pos - 現在のウィンドウのローカル座標での位置です。単位はピクセルです。
 * @ko local_pos - 현재 창의 로컬 좌표 위치이며 단위는 픽셀입니다.
 */
export function SetCursorPos(local_pos: ImVec2Like): void {
  native.SetCursorPos(local_pos);
}

/**
 * Set the layout cursor's X coordinate in window-local space.
 *
 * @zh 设置布局游标在窗口局部坐标系中的 X 坐标。
 * @ja ウィンドウのローカル座標でレイアウトカーソルの X 座標を設定します。
 * @ko 창 로컬 좌표계에서 레이아웃 커서의 X 좌표를 설정합니다.
 *
 * @remarks
 * Coordinates are relative to the current window. Prefer `GetCursorScreenPos()`
 * and `SetCursorScreenPos()` when working with screen-space drawing.
 * @zh
 * 坐标相对于当前窗口。使用屏幕空间绘制时，优先使用 `GetCursorScreenPos()` 和 `SetCursorScreenPos()`。
 * @ja
 * 座標は現在のウィンドウを基準とします。画面座標で描画するときは `GetCursorScreenPos()` と
 * `SetCursorScreenPos()` を優先してください。
 * @ko
 * 좌표는 현재 창을 기준으로 합니다. 화면 좌표로 그릴 때는 `GetCursorScreenPos()`와
 * `SetCursorScreenPos()`를 우선 사용하세요.
 *
 * @param local_x - Position in the current window-local coordinate space, in
 * pixels.
 * @zh local_x - 当前窗口局部坐标空间中的位置，单位为像素。
 * @ja local_x - 現在のウィンドウのローカル座標での位置です。単位はピクセルです。
 * @ko local_x - 현재 창의 로컬 좌표 위치이며 단위는 픽셀입니다.
 */
export function SetCursorPosX(local_x: number): void {
  native.SetCursorPosX(local_x);
}

/**
 * Set the layout cursor's Y coordinate in window-local space.
 *
 * @zh 设置布局游标在窗口局部坐标系中的 Y 坐标。
 * @ja ウィンドウのローカル座標でレイアウトカーソルの Y 座標を設定します。
 * @ko 창 로컬 좌표계에서 레이아웃 커서의 Y 좌표를 설정합니다.
 *
 * @remarks
 * Coordinates are relative to the current window. Prefer `GetCursorScreenPos()`
 * and `SetCursorScreenPos()` when working with screen-space drawing.
 * @zh
 * 坐标相对于当前窗口。使用屏幕空间绘制时，优先使用 `GetCursorScreenPos()` 和 `SetCursorScreenPos()`。
 * @ja
 * 座標は現在のウィンドウを基準とします。画面座標で描画するときは `GetCursorScreenPos()` と
 * `SetCursorScreenPos()` を優先してください。
 * @ko
 * 좌표는 현재 창을 기준으로 합니다. 화면 좌표로 그릴 때는 `GetCursorScreenPos()`와
 * `SetCursorScreenPos()`를 우선 사용하세요.
 *
 * @param local_y - Position in the current window-local coordinate space, in
 * pixels.
 * @zh local_y - 当前窗口局部坐标空间中的位置，单位为像素。
 * @ja local_y - 現在のウィンドウのローカル座標での位置です。単位はピクセルです。
 * @ko local_y - 현재 창의 로컬 좌표 위치이며 단위는 픽셀입니다.
 */
export function SetCursorPosY(local_y: number): void {
  native.SetCursorPosY(local_y);
}

/**
 * Get the initial layout cursor position in window-local coordinates.
 *
 * @zh 获取布局光标起始位置的窗口局部坐标。
 * @ja レイアウトカーソルの開始位置をウィンドウ内座標で取得します。
 * @ko 레이아웃 커서 시작 위치의 창 내부 좌표를 가져옵니다.
 *
 * @remarks
 * [window-local] initial cursor position, in window-local coordinates.
 *
 * Call GetCursorScreenPos() after Begin() to get the absolute coordinates
 * version.
 * @zh
 * [窗口局部] 窗口局部坐标中的初始光标位置。
 *
 * 在 Begin() 之后调用 GetCursorScreenPos() 可获取绝对坐标版本。
 * @ja
 * [ウィンドウローカル] ウィンドウローカル座標での初期カーソル位置です。
 *
 * Begin() の後で GetCursorScreenPos() を呼ぶと絶対座標版を取得できます。
 * @ko
 * [창 로컬] 창 로컬 좌표의 초기 커서 위치입니다.
 *
 * Begin() 이후 GetCursorScreenPos()를 호출하면 절대 좌표 버전을 가져올 수 있습니다.
 *
 * @returns Initial layout cursor position: copied {x,y} in window-local pixels,
 * accounting for scrolling.
 * @zh 初始布局光标位置的窗口局部像素坐标副本 {x,y}，包含滚动影响。
 * @ja レイアウトカーソルの初期位置をスクロールを考慮したウィンドウローカルの {x,y} ピクセル値としてコピーします。
 * @ko 배치 커서의 초기 위치의 스크롤을 반영한 창 로컬 픽셀 좌표 복사본 {x,y}입니다.
 */
export function GetCursorStartPos(): ImVec2Value {
  return native.GetCursorStartPos();
}

/**
 * Draw a separator.
 *
 * @zh 绘制分隔线。
 * @ja 区切り線を描画します。
 * @ko 구분선을 그립니다.
 *
 * @remarks
 * separator, generally horizontal.
 *
 * inside a menu bar or in horizontal layout mode, this becomes a vertical
 * separator.
 * @zh
 * 其他布局函数：分隔线，通常为水平线。
 *
 * 在菜单栏内或水平布局模式下，它会变成垂直分隔线。
 * @ja
 * その他のレイアウト関数：通常は水平の区切り線です。
 *
 * メニューバー内または水平レイアウトモードでは垂直の区切り線になります。
 * @ko
 * 기타 레이아웃 함수: 일반적으로 수평 구분선입니다.
 *
 * 메뉴 표시줄 안이나 수평 레이아웃 모드에서는 수직 구분선이 됩니다.
 */
export function Separator(): void {
  native.Separator();
}

/**
 * Place the next item to the right of the preceding item on the same line.
 *
 * @zh 将下一个控件放在前一个控件右侧的同一行。
 * @ja 次の項目を直前の項目の右側に、同じ行で配置します。
 * @ko 다음 항목을 이전 항목의 오른쪽 같은 줄에 배치합니다.
 *
 * @remarks
 * call between widgets or groups to layout them horizontally.
 *
 * X position given in window coordinates.
 *
 * Implied offset_from_start_x = 0.0, spacing = -1.0
 * @zh
 * 在控件或组之间调用，将它们水平排列。
 *
 * X 位置使用窗口坐标。
 *
 * 隐含参数：offset_from_start_x = 0.0, spacing = -1.0。
 * @ja
 * ウィジェットやグループの間で呼び、横に並べます。
 *
 * X 位置はウィンドウ座標で指定します。
 *
 * 暗黙の引数：offset_from_start_x = 0.0, spacing = -1.0。
 * @ko
 * 위젯이나 그룹 사이에서 호출하여 가로로 배치합니다.
 *
 * X 위치는 창 좌표로 지정합니다.
 *
 * 암묵적 인수: offset_from_start_x = 0.0, spacing = -1.0.
 */
export function SameLine(): void {
  native.SameLine();
}

/**
 * Place the next widget or group on the same line.
 *
 * @zh 将下一个控件或分组放在同一行。
 * @ja 次のウィジェットまたはグループを同じ行に配置します。
 * @ko 다음 위젯이나 그룹을 같은 줄에 배치합니다.
 *
 * @remarks
 * call between widgets or groups to layout them horizontally.
 *
 * X position given in window coordinates.
 * @zh
 * 在控件或组之间调用，将它们水平排列。
 *
 * X 位置使用窗口坐标。
 * @ja
 * ウィジェットやグループの間で呼び、横に並べます。
 *
 * X 位置はウィンドウ座標で指定します。
 * @ko
 * 위젯이나 그룹 사이에서 호출하여 가로로 배치합니다.
 *
 * X 위치는 창 좌표로 지정합니다.
 *
 * @param offset_from_start_x - Horizontal offset from the window/group start; 0
 * places the next item after the previous item.
 * @zh offset_from_start_x - 相对窗口或分组起点的水平偏移；0 表示紧跟前一项。
 * @ja offset_from_start_x - ウィンドウまたはグループの先頭からの水平位置です。0 なら直前の項目に続けます。
 * @ko offset_from_start_x - 창 또는 그룹 시작점 기준 가로 오프셋입니다. 0이면 이전 항목 뒤에 배치합니다.
 *
 * @param spacing - Horizontal gap in pixels; -1 uses the default item spacing.
 * @zh spacing - 水平像素间距；-1 使用默认控件间距。
 * @ja spacing - 水平方向のピクセル間隔です。-1 は既定の項目間隔を使います。
 * @ko spacing - 가로 픽셀 간격입니다. -1은 기본 항목 간격을 사용합니다.
 */
export function SameLineEx(
  offset_from_start_x: number = 0.0,
  spacing: number = -1.0,
): void {
  native.SameLineEx(offset_from_start_x, spacing);
}

/**
 * Undo a SameLine() or force a new line when in a horizontal-layout context.
 *
 * @zh 撤销一次 SameLine()，或在水平布局上下文中强制换行。
 * @ja SameLine() を取り消すか、水平レイアウト中に強制改行します。
 * @ko SameLine()을 취소하거나 수평 레이아웃에서 강제로 줄을 바꿉니다.
 */
export function NewLine(): void {
  native.NewLine();
}

/**
 * Add vertical spacing.
 *
 * @zh 添加垂直间距。
 * @ja 垂直方向の間隔を追加します。
 * @ko 수직 간격을 추가합니다.
 */
export function Spacing(): void {
  native.Spacing();
}

/**
 * Add a dummy item of given size.
 *
 * @zh 添加指定尺寸的占位项目。
 * @ja 指定サイズのダミー項目を追加します。
 * @ko 지정한 크기의 더미 항목을 추가합니다.
 *
 * @remarks
 * unlike InvisibleButton(), Dummy() won't take the mouse click or be navigable
 * into.
 * @zh
 * 与 InvisibleButton() 不同，Dummy() 不会接收鼠标点击，也不能导航到它。
 * @ja
 * InvisibleButton() と異なり、Dummy() はマウスクリックを受け取らず、ナビゲーションの対象にもなりません。
 * @ko
 * InvisibleButton()과 달리 Dummy()는 마우스 클릭을 받지 않으며 탐색 대상으로 이동할 수 없습니다.
 *
 * @param size - Rectangle width and height in pixels at the current layout
 * cursor.
 * @zh size - 当前布局光标处的矩形像素宽高。
 * @ja size - 現在のレイアウトカーソルに置く矩形のピクセル寸法です。
 * @ko size - 현재 배치 커서에 놓는 사각형의 픽셀 너비와 높이입니다.
 */
export function Dummy(size: ImVec2Like): void {
  native.Dummy(size);
}

/**
 * Move the content position right by the style indentation spacing.
 *
 * @zh 按样式中的缩进间距将内容位置右移。
 * @ja スタイルのインデント幅だけコンテンツ位置を右に移動します。
 * @ko 스타일의 들여쓰기 간격만큼 콘텐츠 위치를 오른쪽으로 이동합니다.
 *
 * @remarks
 * Uses `indent_w = 0`, which selects `style.IndentSpacing`. `Indent()` moves
 * right; `Unindent()` moves left.
 * @zh
 * 使用 `indent_w = 0`，即采用 `style.IndentSpacing`。`Indent()` 向右缩进，`Unindent()`
 * 向左退回。
 * @ja
 * `indent_w = 0` により `style.IndentSpacing` を使います。`Indent()` は右に進め、`Unindent()`
 * は左に戻します。
 * @ko
 * `indent_w = 0`으로 `style.IndentSpacing`을 사용합니다. `Indent()`는 오른쪽으로,
 * `Unindent()`는 왼쪽으로 이동합니다.
 */
export function Indent(): void {
  native.Indent();
}

/**
 * Indent subsequent content to the right.
 *
 * @zh 向右缩进后续内容。
 * @ja 後続の内容を右にインデントします。
 * @ko 이후 콘텐츠를 오른쪽으로 들여씁니다.
 *
 * @remarks
 * move content position toward the right, by indent_w, or style.IndentSpacing
 * if indent_w <= 0
 * @zh
 * 将内容位置向右移动 indent_w；若 indent_w <= 0，则移动 style.IndentSpacing。
 * @ja
 * 内容位置を右に indent_w だけ移動します。
 *
 * indent_w <= 0 の場合は style.IndentSpacing だけ移動します。
 * @ko
 * 콘텐츠 위치를 오른쪽으로 indent_w만큼 이동합니다.
 *
 * indent_w <= 0이면 style.IndentSpacing만큼 이동합니다.
 *
 * @param indent_w - Indentation amount in pixels; 0 uses style.IndentSpacing.
 * @zh indent_w - 缩进像素数；0 使用 style.IndentSpacing。
 * @ja indent_w - インデントのピクセル数です。0 は style.IndentSpacing を使います。
 * @ko indent_w - 들여쓰기 픽셀 수입니다. 0은 style.IndentSpacing을 사용합니다.
 */
export function IndentEx(indent_w: number = 0.0): void {
  native.IndentEx(indent_w);
}

/**
 * Move the content position left by the style indentation spacing.
 *
 * @zh 按样式中的缩进间距将内容位置左移。
 * @ja スタイルのインデント幅だけコンテンツ位置を左に移動します。
 * @ko 스타일의 들여쓰기 간격만큼 콘텐츠 위치를 왼쪽으로 이동합니다.
 *
 * @remarks
 * Uses `indent_w = 0`, which selects `style.IndentSpacing`. `Indent()` moves
 * right; `Unindent()` moves left.
 * @zh
 * 使用 `indent_w = 0`，即采用 `style.IndentSpacing`。`Indent()` 向右缩进，`Unindent()`
 * 向左退回。
 * @ja
 * `indent_w = 0` により `style.IndentSpacing` を使います。`Indent()` は右に進め、`Unindent()`
 * は左に戻します。
 * @ko
 * `indent_w = 0`으로 `style.IndentSpacing`을 사용합니다. `Indent()`는 오른쪽으로,
 * `Unindent()`는 왼쪽으로 이동합니다.
 */
export function Unindent(): void {
  native.Unindent();
}

/**
 * Move subsequent content back to the left.
 *
 * @zh 将后续内容向左退回。
 * @ja 後続の内容を左に戻します。
 * @ko 이후 콘텐츠를 왼쪽으로 되돌립니다.
 *
 * @remarks
 * move content position back to the left, by indent_w, or style.IndentSpacing
 * if indent_w <= 0
 * @zh
 * 将内容位置向左移回 indent_w；若 indent_w <= 0，则移动 style.IndentSpacing。
 * @ja
 * 内容位置を左に indent_w だけ戻します。
 *
 * indent_w <= 0 の場合は style.IndentSpacing だけ戻します。
 * @ko
 * 콘텐츠 위치를 왼쪽으로 indent_w만큼 되돌립니다.
 *
 * indent_w <= 0이면 style.IndentSpacing만큼 되돌립니다.
 *
 * @param indent_w - Indentation amount in pixels; 0 uses style.IndentSpacing.
 * @zh indent_w - 缩进像素数；0 使用 style.IndentSpacing。
 * @ja indent_w - インデントのピクセル数です。0 は style.IndentSpacing を使います。
 * @ko indent_w - 들여쓰기 픽셀 수입니다. 0은 style.IndentSpacing을 사용합니다.
 */
export function UnindentEx(indent_w: number = 0.0): void {
  native.UnindentEx(indent_w);
}

/**
 * Begin a group with a fixed horizontal starting position.
 *
 * @zh 开始具有固定水平起始位置的分组。
 * @ja 水平方向の開始位置を固定してグループを開始します。
 * @ko 가로 시작 위치를 고정하여 그룹을 시작합니다.
 *
 * @remarks
 * lock horizontal starting position
 * @zh
 * 锁定水平起始位置。
 * @ja
 * 水平方向の開始位置を固定します。
 * @ko
 * 수평 시작 위치를 고정합니다.
 */
export function BeginGroup(): void {
  native.BeginGroup();
}

/**
 * End a group and capture its bounds as one item.
 *
 * @zh 结束分组并将其边界合并为一个条目。
 * @ja グループを終了し、その領域を 1 つのアイテムとして扱います。
 * @ko 그룹을 종료하고 전체 경계를 하나의 항목으로 처리합니다.
 *
 * @remarks
 * unlock horizontal starting position + capture the whole group bounding box
 * into one "item" (so you can use IsItemHovered() or layout primitives such as
 * SameLine() on whole group, etc.)
 * @zh
 * 解锁水平起始位置，并将整个组的包围盒收集为一个“项目”（因此可对整个组使用 IsItemHovered() 或 SameLine() 等布局基础函数）。
 * @ja
 * 水平方向の開始位置の固定を解除し、グループ全体の境界ボックスを 1 つの「項目」として取り込みます（グループ全体に IsItemHovered() や
 * SameLine() などのレイアウトプリミティブを使えるようになります）。
 * @ko
 * 수평 시작 위치의 고정을 해제하고 그룹 전체의 경계 상자를 하나의 '항목'으로 수집합니다(따라서 그룹 전체에 IsItemHovered()나
 * SameLine() 같은 레이아웃 기본 함수를 사용할 수 있습니다).
 */
export function EndGroup(): void {
  native.EndGroup();
}

/**
 * Align the upcoming text baseline with framed widgets.
 *
 * @zh 将后续文本基线与带边框控件对齐。
 * @ja 後続のテキストのベースラインをフレーム付きウィジェットに揃えます。
 * @ko 이후 텍스트 기준선을 프레임 위젯에 맞춥니다.
 *
 * @remarks
 * vertically align upcoming text baseline to FramePadding.y so that it will
 * align properly to regularly framed items (call if you have text on a line
 * before a framed item)
 * @zh
 * 将后续文本的基线在垂直方向对齐到 FramePadding.y，使其与常规带框项目正确对齐（同一行中若文本出现在带框项目之前，请调用此函数）。
 * @ja
 * 後続テキストのベースラインを垂直方向に FramePadding.y
 * に揃え、通常の枠付き項目と正しく並ぶようにします（同じ行で枠付き項目の前にテキストがある場合に呼び出してください）。
 * @ko
 * 뒤따르는 텍스트 기준선을 수직 방향으로 FramePadding.y에 맞춰 일반적인 프레임 항목과 올바르게 정렬합니다(같은 줄에서 프레임
 * 항목 앞에 텍스트가 있으면 호출하세요).
 */
export function AlignTextToFramePadding(): void {
  native.AlignTextToFramePadding();
}

/**
 * Get the height of one line of text.
 *
 * @zh 获取单行文本的高度。
 * @ja テキスト 1 行の高さを取得します。
 * @ko 텍스트 한 줄의 높이를 가져옵니다.
 *
 * @remarks
 * ~ FontSize
 * @zh
 * 约为 FontSize。
 * @ja
 * およそ FontSize です。
 * @ko
 * 대략 FontSize입니다.
 *
 * @returns Height of one text line in pixels, without extra item spacing.
 * @zh 不含额外项间距的单行文字像素高度。
 * @ja 項目間隔を含まない 1 行の文字のピクセル高さです。
 * @ko 추가 항목 간격을 제외한 한 줄 텍스트의 픽셀 높이입니다.
 */
export function GetTextLineHeight(): number {
  return native.GetTextLineHeight();
}

/**
 * Get the text line height including line spacing.
 *
 * @zh 获取包含行间距的文本行高度。
 * @ja 行間を含むテキスト行の高さを取得します。
 * @ko 줄 간격을 포함한 텍스트 줄 높이를 가져옵니다.
 *
 * @remarks
 * Approximately GetFontSize() + style.ItemSpacingY, the distance between
 * consecutive text lines in pixels. Here style is the mapped field view
 * returned by ImGui.viewImGuiStyle(styleHandle).
 * @zh
 * 约为 GetFontSize() + style.ItemSpacingY，即连续两行文本之间的像素距离。
 * style 是 ImGui.viewImGuiStyle(styleHandle) 返回的映射字段视图。
 * @ja
 * およそ GetFontSize() + style.ItemSpacingY で、連続するテキスト行の間隔をピクセルで表します。
 * style は ImGui.viewImGuiStyle(styleHandle) が返すマッピング済みのフィールドビューです。
 * @ko
 * 대략 GetFontSize() + style.ItemSpacingY이며 연속된 텍스트 줄 사이의 픽셀 거리입니다.
 * style은 ImGui.viewImGuiStyle(styleHandle)이 반환하는 매핑된 필드 뷰입니다.
 *
 * @returns Text line height plus style.ItemSpacingY, in pixels.
 * @zh 文字行高加 style.ItemSpacingY，单位为像素。
 * @ja 文字の行高に style.ItemSpacingY を加えたピクセル値です。
 * @ko 텍스트 행 높이에 style.ItemSpacingY를 더한 픽셀 값입니다.
 */
export function GetTextLineHeightWithSpacing(): number {
  return native.GetTextLineHeightWithSpacing();
}

/**
 * Get the height of a framed widget.
 *
 * @zh 获取带边框控件的高度。
 * @ja フレーム付きウィジェットの高さを取得します。
 * @ko 프레임이 있는 위젯의 높이를 가져옵니다.
 *
 * @remarks
 * Approximately GetFontSize() + style.FramePaddingY * 2, where style is the
 * mapped field view returned by ImGui.viewImGuiStyle(styleHandle).
 * @zh
 * 约为 GetFontSize() + style.FramePaddingY * 2，
 * style 是 ImGui.viewImGuiStyle(styleHandle) 返回的映射字段视图。
 * @ja
 * およそ GetFontSize() + style.FramePaddingY * 2 です。
 * style は ImGui.viewImGuiStyle(styleHandle) が返すマッピング済みのフィールドビューです。
 * @ko
 * 대략 GetFontSize() + style.FramePaddingY * 2입니다.
 * style은 ImGui.viewImGuiStyle(styleHandle)이 반환하는 매핑된 필드 뷰입니다.
 *
 * @returns Framed-widget height: font size plus twice style.FramePaddingY, in
 * pixels.
 * @zh 带框控件高度：字体大小加两倍 style.FramePaddingY，单位为像素。
 * @ja フォントサイズに style.FramePaddingY の 2 倍を加えた枠のピクセル高さです。
 * @ko 글꼴 크기에 style.FramePaddingY의 두 배를 더한 프레임 위젯 픽셀 높이입니다.
 */
export function GetFrameHeight(): number {
  return native.GetFrameHeight();
}

/**
 * Get the framed widget height including vertical spacing.
 *
 * @zh 获取包含垂直间距的带边框控件高度。
 * @ja 垂直方向の間隔を含むフレーム付きウィジェットの高さを取得します。
 * @ko 세로 간격을 포함한 프레임 위젯 높이를 가져옵니다.
 *
 * @remarks
 * Approximately GetFontSize() + style.FramePaddingY * 2 + style.ItemSpacingY,
 * the distance between consecutive rows of framed widgets in pixels. Here
 * style is the mapped field view returned by ImGui.viewImGuiStyle(styleHandle).
 * @zh
 * 约为 GetFontSize() + style.FramePaddingY * 2 +
 * style.ItemSpacingY，即连续两行带框控件之间的像素距离。
 * style 是 ImGui.viewImGuiStyle(styleHandle) 返回的映射字段视图。
 * @ja
 * およそ GetFontSize() + style.FramePaddingY * 2 + style.ItemSpacingY
 * で、枠付きウィジェットの行間隔をピクセルで表します。
 * style は ImGui.viewImGuiStyle(styleHandle) が返すマッピング済みのフィールドビューです。
 * @ko
 * 대략 GetFontSize() + style.FramePaddingY * 2 + style.ItemSpacingY이며 연속된 프레임 위젯
 * 행 사이의 픽셀 거리입니다.
 * style은 ImGui.viewImGuiStyle(styleHandle)이 반환하는 매핑된 필드 뷰입니다.
 *
 * @returns Framed-widget height plus style.ItemSpacingY, in pixels.
 * @zh 带框控件高度加 style.ItemSpacingY，单位为像素。
 * @ja 枠付き項目の高さに style.ItemSpacingY を加えたピクセル値です。
 * @ko 프레임 위젯 높이에 style.ItemSpacingY를 더한 픽셀 값입니다.
 */
export function GetFrameHeightWithSpacing(): number {
  return native.GetFrameHeightWithSpacing();
}
