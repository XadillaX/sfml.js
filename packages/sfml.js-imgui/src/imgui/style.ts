import { native } from '../internal/native';
import type {
  ImVec2Like,
  ImVec2Value,
  ImVec4Like,
  ImVec4Value,
  ImFont,
  ImGuiStyle,
} from '../types';

/**
 * Access the Style structure (colors, sizes).
 *
 * @zh 访问 Style 结构（颜色、尺寸）。
 * @ja Style 構造体（色、サイズ）にアクセスします。
 * @ko Style 구조체(색상, 크기)에 접근합니다.
 *
 * @remarks
 * Always use PushStyleColor(), PushStyleVar() to modify style mid-frame!
 * @zh
 * 在帧内修改样式时，务必使用 PushStyleColor()、PushStyleVar()！
 * @ja
 * フレームの途中でスタイルを変更するときは、必ず PushStyleColor()、PushStyleVar() を使用してください！
 * @ko
 * 프레임 도중 스타일을 변경할 때는 반드시 PushStyleColor(), PushStyleVar()를 사용하세요!
 *
 * @returns Borrowed handle to the current style; use the style stack for
 * temporary mid-frame changes.
 * @zh 当前样式的借用句柄；帧内临时修改应使用样式栈。
 * @ja 現在のスタイルの借用ハンドルです。フレーム途中の一時変更にはスタイルスタックを使います。
 * @ko 현재 스타일의 빌린 핸들입니다. 프레임 중 임시 변경에는 스타일 스택을 사용합니다.
 */
export function GetStyle(): ImGuiStyle | null {
  return native.GetStyle();
}

/**
 * Apply the dark color style.
 *
 * @zh 应用深色配色样式。
 * @ja ダーク配色スタイルを適用します。
 * @ko 어두운 색상 스타일을 적용합니다.
 *
 * @remarks
 * new, recommended style (default)
 * @zh
 * 样式：新的推荐样式（默认）。
 * @ja
 * スタイル：新しい推奨スタイル（既定）。
 * @ko
 * 스타일: 새로운 권장 스타일(기본값)입니다.
 *
 * @param dst - Style to overwrite with the preset; null modifies the current
 * context style.
 * @zh dst - 用预设覆盖的样式；null 修改当前上下文样式。
 * @ja dst - プリセットで上書きするスタイルです。null は現在のスタイルを変更します。
 * @ko dst - 프리셋으로 덮어쓸 스타일입니다. null은 현재 컨텍스트 스타일을 변경합니다.
 */
export function StyleColorsDark(dst: ImGuiStyle | null = null): void {
  native.StyleColorsDark(dst);
}

/**
 * Apply the light color style.
 *
 * @zh 应用浅色配色样式。
 * @ja ライト配色スタイルを適用します。
 * @ko 밝은 색상 스타일을 적용합니다.
 *
 * @remarks
 * best used with borders and a custom, thicker font
 * @zh
 * 最好搭配边框和自定义的较粗字体使用。
 * @ja
 * 枠線と、太めのカスタムフォントを組み合わせると効果的です。
 * @ko
 * 테두리와 더 굵은 사용자 정의 글꼴을 함께 사용하는 것이 좋습니다.
 *
 * @param dst - Style to overwrite with the preset; null modifies the current
 * context style.
 * @zh dst - 用预设覆盖的样式；null 修改当前上下文样式。
 * @ja dst - プリセットで上書きするスタイルです。null は現在のスタイルを変更します。
 * @ko dst - 프리셋으로 덮어쓸 스타일입니다. null은 현재 컨텍스트 스타일을 변경합니다.
 */
export function StyleColorsLight(dst: ImGuiStyle | null = null): void {
  native.StyleColorsLight(dst);
}

/**
 * Apply the classic color style.
 *
 * @zh 应用经典配色样式。
 * @ja クラシック配色スタイルを適用します。
 * @ko 클래식 색상 스타일을 적용합니다.
 *
 * @remarks
 * classic imgui style
 * @zh
 * 经典 ImGui 样式。
 * @ja
 * 従来の ImGui スタイル。
 * @ko
 * 클래식 ImGui 스타일입니다.
 *
 * @param dst - Style to overwrite with the preset; null modifies the current
 * context style.
 * @zh dst - 用预设覆盖的样式；null 修改当前上下文样式。
 * @ja dst - プリセットで上書きするスタイルです。null は現在のスタイルを変更します。
 * @ko dst - 프리셋으로 덮어쓸 스타일입니다. null은 현재 컨텍스트 스타일을 변경합니다.
 */
export function StyleColorsClassic(dst: ImGuiStyle | null = null): void {
  native.StyleColorsClassic(dst);
}

/**
 * Push the font used by subsequent widgets.
 *
 * @zh 压入后续控件使用的字体。
 * @ja 後続のウィジェットで使うフォントをスタックに積みます。
 * @ko 이후 위젯에서 사용할 글꼴을 스택에 넣습니다.
 *
 * @remarks
 * use null as a shortcut to push default font
 * @zh
 * 参数栈（共享）：使用 null 可快捷地将默认字体压入栈。
 * @ja
 * パラメータースタック（共有）：null を使うと既定のフォントを簡単にスタックに積めます。
 * @ko
 * 매개변수 스택(공유): null을 사용하면 기본 글꼴을 간편하게 스택에 넣을 수 있습니다.
 *
 * @param font - Font to push; null selects the default font. Balance with
 * PopFont().
 * @zh font - 要压栈的字体；null 选择默认字体，须配对 PopFont()。
 * @ja font - プッシュするフォントです。null は既定フォントで、PopFont() と対応させます。
 * @ko font - 푸시할 글꼴입니다. null은 기본 글꼴이며 PopFont()와 짝지어야 합니다。
 */
export function PushFont(font: ImFont | null): void {
  native.PushFont(font);
}

/**
 * Restore the font saved by the matching PushFont.
 *
 * @zh 恢复配对的 PushFont 保存的字体。
 * @ja 対応する PushFont が保存したフォントを復元します。
 * @ko 대응하는 PushFont가 저장한 글꼴을 복원합니다.
 */
export function PopFont(): void {
  native.PopFont();
}

/**
 * Modify a style color.
 *
 * @zh 修改样式颜色。
 * @ja スタイルの色を変更します。
 * @ko 스타일 색상을 변경합니다.
 *
 * @remarks
 * always use this if you modify the style after NewFrame().
 * @zh
 * 若在 NewFrame() 之后修改样式，务必使用此函数。
 * @ja
 * NewFrame() 後にスタイルを変更する場合は必ずこれを使ってください。
 * @ko
 * NewFrame() 이후 스타일을 변경할 때는 반드시 이 함수를 사용하세요.
 *
 * @param idx - ImGuiCol index selecting the style color entry.
 * @zh idx - 选择样式颜色条目的 ImGuiCol 索引。
 * @ja idx - スタイル色を選択する ImGuiCol インデックスです。
 * @ko idx - 스타일 색상 항목을 고르는 ImGuiCol 인덱스입니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function PushStyleColor(idx: number, col: number): void {
  native.PushStyleColor(idx, col);
}

/**
 * Temporarily override a style color with floating-point RGBA components.
 *
 * @zh 使用浮点 RGBA 分量临时覆盖样式颜色。
 * @ja 浮動小数点の RGBA 成分でスタイルの色を一時的に上書きします。
 * @ko 부동소수점 RGBA 성분으로 스타일 색상을 임시로 재정의합니다.
 *
 * @param idx - ImGuiCol index selecting the style color entry.
 * @zh idx - 选择样式颜色条目的 ImGuiCol 索引。
 * @ja idx - スタイル色を選択する ImGuiCol インデックスです。
 * @ko idx - 스타일 색상 항목을 고르는 ImGuiCol 인덱스입니다.
 *
 * @param col - Floating-point RGBA color; alpha controls opacity.
 * @zh col - 浮点 RGBA 颜色；alpha 控制不透明度。
 * @ja col - 浮動小数点 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 부동소수점 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 */
export function PushStyleColorImVec4(idx: number, col: ImVec4Like): void {
  native.PushStyleColorImVec4(idx, col);
}

/**
 * Pop style-color overrides and restore the colors saved by PushStyleColor.
 *
 * @zh 弹出样式颜色覆盖项，恢复 PushStyleColor 保存的颜色。
 * @ja スタイル色の上書きをポップし、PushStyleColor が保存した色を復元します。
 * @ko 스타일 색상 재정의를 팝하고 PushStyleColor가 저장한 색상을 복원합니다.
 *
 * @remarks
 * Pop one saved style setting (`count = 1`) from the corresponding stack.
 * @zh
 * 从对应栈中弹出一个已保存的样式设置（`count = 1`）。
 * @ja
 * 対応するスタックから保存したスタイル設定を 1 つ取り出します（`count = 1`）。
 * @ko
 * 해당 스택에서 저장된 스타일 설정 하나를 꺼냅니다(`count = 1`).
 */
export function PopStyleColor(): void {
  native.PopStyleColor();
}

/**
 * Pop style-color overrides and restore the colors saved by PushStyleColor.
 *
 * @zh 弹出样式颜色覆盖项，恢复 PushStyleColor 保存的颜色。
 * @ja スタイル色の上書きをポップし、PushStyleColor が保存した色を復元します。
 * @ko 스타일 색상 재정의를 팝하고 PushStyleColor가 저장한 색상을 복원합니다.
 *
 * @param count - Number of matching style entries to pop; do not exceed the
 * number pushed.
 * @zh count - 要弹出的对应样式条目数，不得超过已压栈数量。
 * @ja count - 対応するスタイルを戻す個数です。プッシュ済みの個数を超えないでください。
 * @ko count - 꺼낼 해당 스타일 항목 수이며 푸시한 개수를 초과하면 안 됩니다.
 */
export function PopStyleColorEx(count: number = 1): void {
  native.PopStyleColorEx(count);
}

/**
 * Modify a style float variable.
 *
 * @zh 修改样式中的 float 变量。
 * @ja スタイルの float 変数を変更します。
 * @ko 스타일의 float 변수를 변경합니다.
 *
 * @remarks
 * always use this if you modify the style after NewFrame()!
 * @zh
 * 若在 NewFrame() 之后修改样式，务必使用此函数！
 * @ja
 * NewFrame() 後にスタイルを変更する場合は必ずこれを使ってください！
 * @ko
 * NewFrame() 이후 스타일을 변경할 때는 반드시 이 함수를 사용하세요!
 *
 * @param idx - ImGuiStyleVar entry to override; its scalar/vector shape must
 * match this overload.
 * @zh idx - 要覆盖的 ImGuiStyleVar 条目；其标量或向量形状须匹配此重载。
 * @ja idx - 上書きする ImGuiStyleVar です。スカラー・ベクトルの形をこの版に合わせてください。
 * @ko idx - 재정의할 ImGuiStyleVar 항목입니다. 스칼라 또는 벡터 형식이 이 오버로드와 맞아야 합니다.
 *
 * @param val - Replacement style value or selected component, matching the
 * chosen ImGuiStyleVar.
 * @zh val - 与所选 ImGuiStyleVar 匹配的替代样式值或指定分量。
 * @ja val - 選んだ ImGuiStyleVar に合う置換値または指定成分です。
 * @ko val - 선택한 ImGuiStyleVar에 맞는 대체 스타일 값 또는 지정 성분입니다.
 */
export function PushStyleVar(idx: number, val: number): void {
  native.PushStyleVar(idx, val);
}

/**
 * Push a two-component style variable.
 *
 * @zh 压入双分量样式变量。
 * @ja 2 成分のスタイル変数をスタックに積みます。
 * @ko 두 성분의 스타일 변수를 스택에 넣습니다.
 *
 * @remarks
 * Use this stack operation when changing style during a frame, after
 * `NewFrame()`. Restore the previous value with `PopStyleVar()`.
 * @zh
 * 在 `NewFrame()` 之后的帧内修改样式时，应使用此栈操作。使用 `PopStyleVar()` 恢复原值。
 * @ja
 * `NewFrame()` 後のフレーム途中でスタイルを変更するときは、このスタック操作を使います。`PopStyleVar()` で元の値に戻します。
 * @ko
 * `NewFrame()` 이후 프레임 도중 스타일을 변경할 때 이 스택 연산을 사용합니다. `PopStyleVar()`로 이전 값을
 * 복원합니다.
 *
 * @param idx - ImGuiStyleVar entry to override; its scalar/vector shape must
 * match this overload.
 * @zh idx - 要覆盖的 ImGuiStyleVar 条目；其标量或向量形状须匹配此重载。
 * @ja idx - 上書きする ImGuiStyleVar です。スカラー・ベクトルの形をこの版に合わせてください。
 * @ko idx - 재정의할 ImGuiStyleVar 항목입니다. 스칼라 또는 벡터 형식이 이 오버로드와 맞아야 합니다.
 *
 * @param val - Replacement style value or selected component, matching the
 * chosen ImGuiStyleVar.
 * @zh val - 与所选 ImGuiStyleVar 匹配的替代样式值或指定分量。
 * @ja val - 選んだ ImGuiStyleVar に合う置換値または指定成分です。
 * @ko val - 선택한 ImGuiStyleVar에 맞는 대체 스타일 값 또는 지정 성분입니다.
 */
export function PushStyleVarImVec2(idx: number, val: ImVec2Like): void {
  native.PushStyleVarImVec2(idx, val);
}

/**
 * Push the X component of a style variable.
 *
 * @zh 压入样式变量的 X 分量。
 * @ja スタイル変数の X 成分をスタックに積みます。
 * @ko 스타일 변수의 X 성분을 스택에 넣습니다.
 *
 * @remarks
 * Only the X component is changed. Use this stack operation after `NewFrame()`
 * and restore the previous value with `PopStyleVar()`.
 * @zh
 * 只修改 X 分量。在 `NewFrame()` 之后应使用此栈操作，并通过 `PopStyleVar()` 恢复原值。
 * @ja
 * X 成分だけを変更します。`NewFrame()` 後はこのスタック操作を使い、`PopStyleVar()` で元の値に戻します。
 * @ko
 * X 성분만 변경합니다. `NewFrame()` 이후 이 스택 연산을 사용하고 `PopStyleVar()`로 이전 값을 복원합니다.
 *
 * @param idx - ImGuiStyleVar entry to override; its scalar/vector shape must
 * match this overload.
 * @zh idx - 要覆盖的 ImGuiStyleVar 条目；其标量或向量形状须匹配此重载。
 * @ja idx - 上書きする ImGuiStyleVar です。スカラー・ベクトルの形をこの版に合わせてください。
 * @ko idx - 재정의할 ImGuiStyleVar 항목입니다. 스칼라 또는 벡터 형식이 이 오버로드와 맞아야 합니다.
 *
 * @param val_x - Replacement style value or selected component, matching the
 * chosen ImGuiStyleVar.
 * @zh val_x - 与所选 ImGuiStyleVar 匹配的替代样式值或指定分量。
 * @ja val_x - 選んだ ImGuiStyleVar に合う置換値または指定成分です。
 * @ko val_x - 선택한 ImGuiStyleVar에 맞는 대체 스타일 값 또는 지정 성분입니다.
 */
export function PushStyleVarX(idx: number, val_x: number): void {
  native.PushStyleVarX(idx, val_x);
}

/**
 * Push the Y component of a style variable.
 *
 * @zh 压入样式变量的 Y 分量。
 * @ja スタイル変数の Y 成分をスタックに積みます。
 * @ko 스타일 변수의 Y 성분을 스택에 넣습니다.
 *
 * @remarks
 * Only the Y component is changed. Use this stack operation after `NewFrame()`
 * and restore the previous value with `PopStyleVar()`.
 * @zh
 * 只修改 Y 分量。在 `NewFrame()` 之后应使用此栈操作，并通过 `PopStyleVar()` 恢复原值。
 * @ja
 * Y 成分だけを変更します。`NewFrame()` 後はこのスタック操作を使い、`PopStyleVar()` で元の値に戻します。
 * @ko
 * Y 성분만 변경합니다. `NewFrame()` 이후 이 스택 연산을 사용하고 `PopStyleVar()`로 이전 값을 복원합니다.
 *
 * @param idx - ImGuiStyleVar entry to override; its scalar/vector shape must
 * match this overload.
 * @zh idx - 要覆盖的 ImGuiStyleVar 条目；其标量或向量形状须匹配此重载。
 * @ja idx - 上書きする ImGuiStyleVar です。スカラー・ベクトルの形をこの版に合わせてください。
 * @ko idx - 재정의할 ImGuiStyleVar 항목입니다. 스칼라 또는 벡터 형식이 이 오버로드와 맞아야 합니다.
 *
 * @param val_y - Replacement style value or selected component, matching the
 * chosen ImGuiStyleVar.
 * @zh val_y - 与所选 ImGuiStyleVar 匹配的替代样式值或指定分量。
 * @ja val_y - 選んだ ImGuiStyleVar に合う置換値または指定成分です。
 * @ko val_y - 선택한 ImGuiStyleVar에 맞는 대체 스타일 값 또는 지정 성분입니다.
 */
export function PushStyleVarY(idx: number, val_y: number): void {
  native.PushStyleVarY(idx, val_y);
}

/**
 * Pop style-variable overrides and restore values saved by the PushStyleVar
 * family.
 *
 * @zh 弹出样式变量覆盖项，恢复 PushStyleVar 系列保存的值。
 * @ja スタイル変数の上書きをポップし、PushStyleVar 系列が保存した値を復元します。
 * @ko 스타일 변수 재정의를 팝하고 PushStyleVar 계열이 저장한 값을 복원합니다.
 *
 * @remarks
 * Pop one saved style setting (`count = 1`) from the corresponding stack.
 * @zh
 * 从对应栈中弹出一个已保存的样式设置（`count = 1`）。
 * @ja
 * 対応するスタックから保存したスタイル設定を 1 つ取り出します（`count = 1`）。
 * @ko
 * 해당 스택에서 저장된 스타일 설정 하나를 꺼냅니다(`count = 1`).
 */
export function PopStyleVar(): void {
  native.PopStyleVar();
}

/**
 * Pop style-variable overrides and restore values saved by the PushStyleVar
 * family.
 *
 * @zh 弹出样式变量覆盖项，恢复 PushStyleVar 系列保存的值。
 * @ja スタイル変数の上書きをポップし、PushStyleVar 系列が保存した値を復元します。
 * @ko 스타일 변수 재정의를 팝하고 PushStyleVar 계열이 저장한 값을 복원합니다.
 *
 * @param count - Number of matching style entries to pop; do not exceed the
 * number pushed.
 * @zh count - 要弹出的对应样式条目数，不得超过已压栈数量。
 * @ja count - 対応するスタイルを戻す個数です。プッシュ済みの個数を超えないでください。
 * @ko count - 꺼낼 해당 스타일 항목 수이며 푸시한 개수를 초과하면 안 됩니다.
 */
export function PopStyleVarEx(count: number = 1): void {
  native.PopStyleVarEx(count);
}

/**
 * Push a shared item flag setting.
 *
 * @zh 压入共享条目标志设置。
 * @ja 共有アイテムフラグの設定をスタックに積みます。
 * @ko 공유 항목 플래그 설정을 스택에 넣습니다.
 *
 * @remarks
 * modify specified shared item flag, e.g.
 * PushItemFlag(ImGuiItemFlags.NoTabStop, true)
 * @zh
 * 修改指定的共享项目标志，例如 PushItemFlag(ImGuiItemFlags.NoTabStop, true)。
 * @ja
 * 指定した共有項目フラグを変更します。
 *
 * 例：PushItemFlag(ImGuiItemFlags.NoTabStop, true)。
 * @ko
 * 지정한 공유 항목 플래그를 변경합니다.
 *
 * 예: PushItemFlag(ImGuiItemFlags.NoTabStop, true).
 *
 * @param option - ImGuiItemFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh option - 控制此操作的 ImGuiItemFlags 选项；可用 | 组合兼容的标志位。
 * @ja option - この操作を制御する ImGuiItemFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko option - 이 동작을 제어하는 ImGuiItemFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param enabled - Whether the item or pushed option is enabled.
 * @zh enabled - 是否启用此项或压栈选项。
 * @ja enabled - 項目またはプッシュするオプションを有効にするかどうかです。
 * @ko enabled - 항목 또는 푸시하는 옵션의 활성화 여부입니다.
 */
export function PushItemFlag(option: number, enabled: boolean): void {
  native.PushItemFlag(option, enabled);
}

/**
 * Restore the item flags saved by the matching PushItemFlag.
 *
 * @zh 恢复配对的 PushItemFlag 保存的控件标志。
 * @ja 対応する PushItemFlag が保存した項目フラグを復元します。
 * @ko 대응하는 PushItemFlag가 저장한 항목 플래그를 복원합니다.
 */
export function PopItemFlag(): void {
  native.PopItemFlag();
}

/**
 * Get the current font.
 *
 * @zh 获取当前字体。
 * @ja 現在のフォントを取得します。
 * @ko 현재 글꼴을 가져옵니다.
 *
 * @remarks
 * - Use the ShowStyleEditor() function to interactively see/edit the colors.
 *
 * get current font
 * @zh
 * 样式读取：使用 ShowStyleEditor() 可交互式查看/编辑颜色。
 *
 * 获取当前字体。
 * @ja
 * スタイルの読み取り：ShowStyleEditor() で色を対話的に表示／編集できます。
 *
 * 現在のフォントを取得します。
 * @ko
 * 스타일 읽기: ShowStyleEditor()로 색상을 대화식으로 확인/편집할 수 있습니다.
 *
 * 현재 글꼴을 가져옵니다.
 *
 * @returns Borrowed handle to the current font selected by the font stack.
 * @zh 字体栈当前选择的字体借用句柄。
 * @ja フォントスタックで選択された現在のフォントの借用ハンドルです。
 * @ko 글꼴 스택에서 선택된 현재 글꼴의 빌린 핸들입니다.
 */
export function GetFont(): ImFont | null {
  return native.GetFont();
}

/**
 * Get current font size (= height in pixels) of current font with current scale
 * applied.
 *
 * @zh 获取当前字体应用当前缩放后的字号（即像素高度）。
 * @ja 現在の倍率を適用した現在のフォントサイズ（ピクセル単位の高さ）を取得します。
 * @ko 현재 배율을 적용한 현재 글꼴 크기(픽셀 높이)를 가져옵니다.
 *
 * @returns Current scaled font size in pixels.
 * @zh 当前缩放后的字体像素大小。
 * @ja 現在のスケール適用済みフォントサイズをピクセルで返します。
 * @ko 현재 배율이 적용된 글꼴 픽셀 크기입니다.
 */
export function GetFontSize(): number {
  return native.GetFontSize();
}

/**
 * Get UV coordinate for a white pixel, useful to draw custom shapes via the
 * ImDrawList API.
 *
 * @zh 获取白色像素的 UV 坐标，适合通过 ImDrawList API 绘制自定义形状。
 * @ja 白いピクセルの UV 座標を取得します。
 * @ko 흰색 픽셀의 UV 좌표를 가져옵니다.
 *
 * @remarks
 * get UV coordinate for a white pixel, useful to draw custom shapes via the
 * ImDrawList API
 * @zh
 * 获取白色像素的 UV 坐标，适合通过 ImDrawList API 绘制自定义形状。
 * @ja
 * ImDrawList API で独自の形状を描く際に便利です。
 * @ko
 * ImDrawList API로 사용자 정의 도형을 그릴 때 유용합니다.
 *
 * @returns Copied UV coordinates of the white atlas texel used to draw
 * solid-color shapes.
 * @zh 用于绘制纯色形状的图集白色像素 UV 坐标副本。
 * @ja 単色図形に使うアトラスの白い画素の UV 座標のコピーです。
 * @ko 단색 도형에 사용하는 아틀라스 흰색 텍셀의 UV 좌표 복사본입니다.
 */
export function GetFontTexUvWhitePixel(): ImVec2Value {
  return native.GetFontTexUvWhitePixel();
}

/**
 * Pack a style color into 32 bits with the global style alpha applied.
 *
 * @zh 应用全局样式透明度，将样式颜色打包为 32 位值。
 * @ja グローバルなスタイルのアルファ値を適用し、スタイル色を 32 ビット値に変換します。
 * @ko 전역 스타일 알파를 적용하여 스타일 색상을 32비트 값으로 변환합니다.
 *
 * @remarks
 * Implied alpha_mul = 1.0
 * @zh
 * 隐含参数：alpha_mul = 1.0。
 * @ja
 * 暗黙の引数：alpha_mul = 1.0。
 * @ko
 * 암묵적 인수: alpha_mul = 1.0.
 *
 * @param idx - ImGuiCol index selecting the style color entry.
 * @zh idx - 选择样式颜色条目的 ImGuiCol 索引。
 * @ja idx - スタイル色を選択する ImGuiCol インデックスです。
 * @ko idx - 스타일 색상 항목을 고르는 ImGuiCol 인덱스입니다.
 *
 * @returns Packed ImU32 color with the current style alpha and any requested
 * alpha multiplier applied.
 * @zh 已应用当前样式 alpha 及指定额外 alpha 倍数的打包 ImU32 颜色。
 * @ja 現在のスタイルのアルファ値と指定倍率を適用したパック済み ImU32 色です。
 * @ko 현재 스타일 알파와 요청한 추가 알파 배율을 적용한 패킹 ImU32 색상입니다.
 */
export function GetColorU32(idx: number): number {
  return native.GetColorU32(idx);
}

/**
 * Get a packed style color with alpha applied.
 *
 * @zh 获取应用透明度的打包样式颜色。
 * @ja アルファ値を適用したパック済みのスタイル色を取得します。
 * @ko 알파를 적용한 패킹된 스타일 색상을 가져옵니다.
 *
 * @remarks
 * retrieve given style color with style alpha applied and optional extra alpha
 * multiplier, packed as a 32-bit value suitable for ImDrawList
 * @zh
 * 获取指定样式颜色，应用样式 alpha 及可选的额外 alpha 乘数，并打包为适用于 ImDrawList 的 32 位值。
 * @ja
 * 指定したスタイル色にスタイルの alpha と任意の追加 alpha 乗数を適用し、ImDrawList 向けの 32 ビット値にパックして取得します。
 * @ko
 * 지정한 스타일 색상에 스타일 alpha와 선택적인 추가 alpha 배율을 적용하고 ImDrawList에 적합한 32비트 값으로 패킹하여
 * 가져옵니다.
 *
 * @param idx - ImGuiCol index selecting the style color entry.
 * @zh idx - 选择样式颜色条目的 ImGuiCol 索引。
 * @ja idx - スタイル色を選択する ImGuiCol インデックスです。
 * @ko idx - 스타일 색상 항목을 고르는 ImGuiCol 인덱스입니다.
 *
 * @param alpha_mul - Additional multiplier for the color alpha, combined with
 * the current style alpha.
 * @zh alpha_mul - 颜色 alpha 的额外乘数，与当前样式 alpha 一起应用。
 * @ja alpha_mul - 現在のスタイルのアルファ値と併用する、色のアルファ値の追加倍率です。
 * @ko alpha_mul - 현재 스타일 알파와 함께 적용하는 색상 알파의 추가 배율입니다.
 *
 * @returns Packed ImU32 color with the current style alpha and any requested
 * alpha multiplier applied.
 * @zh 已应用当前样式 alpha 及指定额外 alpha 倍数的打包 ImU32 颜色。
 * @ja 現在のスタイルのアルファ値と指定倍率を適用したパック済み ImU32 色です。
 * @ko 현재 스타일 알파와 요청한 추가 알파 배율을 적용한 패킹 ImU32 색상입니다.
 */
export function GetColorU32Ex(idx: number, alpha_mul: number = 1.0): number {
  return native.GetColorU32Ex(idx, alpha_mul);
}

/**
 * Retrieve given color with style alpha applied, packed as a 32-bit value
 * suitable for ImDrawList.
 *
 * @zh 获取指定颜色，应用样式 alpha，并打包为适用于 ImDrawList 的 32 位值。
 * @ja 指定した色にスタイルの alpha を適用し、ImDrawList 向けの 32 ビット値にパックして取得します。
 * @ko 지정한 색상에 스타일 alpha를 적용하고 ImDrawList에 적합한 32비트 값으로 패킹하여 가져옵니다.
 *
 * @param col - Floating-point RGBA color; alpha controls opacity.
 * @zh col - 浮点 RGBA 颜色；alpha 控制不透明度。
 * @ja col - 浮動小数点 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 부동소수점 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @returns Packed ImU32 color with the current style alpha and any requested
 * alpha multiplier applied.
 * @zh 已应用当前样式 alpha 及指定额外 alpha 倍数的打包 ImU32 颜色。
 * @ja 現在のスタイルのアルファ値と指定倍率を適用したパック済み ImU32 色です。
 * @ko 현재 스타일 알파와 요청한 추가 알파 배율을 적용한 패킹 ImU32 색상입니다.
 */
export function GetColorU32ImVec4(col: ImVec4Like): number {
  return native.GetColorU32ImVec4(col);
}

/**
 * Apply the global style alpha to an already packed 32-bit color.
 *
 * @zh 将全局样式透明度应用于已打包的 32 位颜色。
 * @ja パック済みの 32 ビット色にグローバルなスタイルのアルファ値を適用します。
 * @ko 이미 패킹된 32비트 색상에 전역 스타일 알파를 적용합니다.
 *
 * @remarks
 * Implied alpha_mul = 1.0
 * @zh
 * 隐含参数：alpha_mul = 1.0。
 * @ja
 * 暗黙の引数：alpha_mul = 1.0。
 * @ko
 * 암묵적 인수: alpha_mul = 1.0.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @returns Packed ImU32 color with the current style alpha and any requested
 * alpha multiplier applied.
 * @zh 已应用当前样式 alpha 及指定额外 alpha 倍数的打包 ImU32 颜色。
 * @ja 現在のスタイルのアルファ値と指定倍率を適用したパック済み ImU32 色です。
 * @ko 현재 스타일 알파와 요청한 추가 알파 배율을 적용한 패킹 ImU32 색상입니다.
 */
export function GetColorU32ImU32(col: number): number {
  return native.GetColorU32ImU32(col);
}

/**
 * Retrieve given color with style alpha applied, packed as a 32-bit value
 * suitable for ImDrawList.
 *
 * @zh 获取指定颜色，应用样式 alpha，并打包为适用于 ImDrawList 的 32 位值。
 * @ja 指定した色にスタイルの alpha を適用し、ImDrawList 向けの 32 ビット値にパックして取得します。
 * @ko 지정한 색상에 스타일 alpha를 적용하고 ImDrawList에 적합한 32비트 값으로 패킹하여 가져옵니다.
 *
 * @param col - Packed ImU32 RGBA color; alpha controls opacity.
 * @zh col - 打包 ImU32 RGBA 颜色；alpha 控制不透明度。
 * @ja col - パック済み ImU32 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 패킹된 ImU32 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param alpha_mul - Additional multiplier for the color alpha, combined with
 * the current style alpha.
 * @zh alpha_mul - 颜色 alpha 的额外乘数，与当前样式 alpha 一起应用。
 * @ja alpha_mul - 現在のスタイルのアルファ値と併用する、色のアルファ値の追加倍率です。
 * @ko alpha_mul - 현재 스타일 알파와 함께 적용하는 색상 알파의 추가 배율입니다.
 *
 * @returns Packed ImU32 color with the current style alpha and any requested
 * alpha multiplier applied.
 * @zh 已应用当前样式 alpha 及指定额外 alpha 倍数的打包 ImU32 颜色。
 * @ja 現在のスタイルのアルファ値と指定倍率を適用したパック済み ImU32 色です。
 * @ko 현재 스타일 알파와 요청한 추가 알파 배율을 적용한 패킹 ImU32 색상입니다.
 */
export function GetColorU32ImU32Ex(
  col: number,
  alpha_mul: number = 1.0,
): number {
  return native.GetColorU32ImU32Ex(col, alpha_mul);
}

/**
 * Retrieve style color as stored in ImGuiStyle structure.
 *
 * @zh 获取 ImGuiStyle 结构中存储的原始样式颜色。
 * @ja ImGuiStyle 構造体に格納されているままのスタイル色を取得します。
 * @ko ImGuiStyle 구조체에 저장된 그대로의 스타일 색상을 가져옵니다.
 *
 * @remarks
 * Use with PushStyleColorImVec4(); otherwise use GetColorU32() to get
 * style color with style alpha baked in.
 * @zh
 * 可将返回值传给 PushStyleColorImVec4()；若需要已融合样式 alpha 的颜色，应使用 GetColorU32()。
 * @ja
 * 戻り値は PushStyleColorImVec4() に渡せます。スタイルの alpha を適用した色が必要なら GetColorU32()
 * を使います。
 * @ko
 * 반환값은 PushStyleColorImVec4()에 전달할 수 있습니다. 스타일 alpha가 반영된 색상은 GetColorU32()로
 * 가져오세요.
 *
 * @param idx - ImGuiCol index selecting the style color entry.
 * @zh idx - 选择样式颜色条目的 ImGuiCol 索引。
 * @ja idx - スタイル色を選択する ImGuiCol インデックスです。
 * @ko idx - 스타일 색상 항목을 고르는 ImGuiCol 인덱스입니다.
 *
 * @returns Copied floating-point RGBA color as {x: r, y: g, z: b, w: a};
 * editing the object does not change the native style.
 * @zh 浮点 RGBA 颜色副本 {x: r, y: g, z: b, w: a}；修改对象不会更改原生样式。
 * @ja 浮動小数点 RGBA のコピー {x: r, y: g, z: b, w: a} です。変更してもネイティブスタイルは変わりません。
 * @ko 부동소수점 RGBA 색상 복사본 {x: r, y: g, z: b, w: a}입니다. 객체를 바꿔도 네이티브 스타일은 변경되지
 * 않습니다.
 */
export function GetStyleColorVec4(idx: number): ImVec4Value | null {
  return native.GetStyleColorVec4(idx);
}

/**
 * Get the name of a style color.
 *
 * @zh 获取样式颜色的名称。
 * @ja スタイル色の名前を取得します。
 * @ko 스타일 색상 이름을 가져옵니다.
 *
 * @remarks
 * get a string corresponding to the enum value (for display, saving, etc.).
 * @zh
 * 获取枚举值对应的字符串（用于显示、保存等）。
 * @ja
 * 列挙値に対応する文字列を取得します（表示、保存などに使用）。
 * @ko
 * 열거형 값에 해당하는 문자열을 가져옵니다(표시, 저장 등).
 *
 * @param idx - ImGuiCol index selecting the style color entry.
 * @zh idx - 选择样式颜色条目的 ImGuiCol 索引。
 * @ja idx - スタイル色を選択する ImGuiCol インデックスです。
 * @ko idx - 스타일 색상 항목을 고르는 ImGuiCol 인덱스입니다.
 *
 * @returns Human-readable name of the specified ImGuiCol entry.
 * @zh 指定 ImGuiCol 条目的可读名称。
 * @ja 指定した ImGuiCol の可読な名前です。
 * @ko 지정한 ImGuiCol 항목의 읽을 수 있는 이름입니다.
 */
export function GetStyleColorName(idx: number): string | null {
  return native.GetStyleColorName(idx);
}

/**
 * Scale style dimensions such as padding, spacing, and rounding for a different
 * UI scale.
 *
 * @zh 缩放内边距、间距和圆角等样式尺寸，以适应不同的界面缩放比例。
 * @ja パディング、間隔、角丸などのスタイル寸法を別の UI スケールに合わせて拡縮します。
 * @ko 다른 UI 배율에 맞게 안쪽 여백, 간격, 모서리 둥글기 등의 스타일 치수를 조정합니다.
 *
 * @param self - ImGuiStyle handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiStyle 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiStyle ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiStyle 핸들입니다.
 *
 * @param scale_factor - Scale multiplier applied to the existing font size or
 * style dimensions.
 * @zh scale_factor - 应用于现有字体大小或样式尺寸的缩放倍数。
 * @ja scale_factor - 既存のフォントサイズやスタイル寸法に適用する倍率です。
 * @ko scale_factor - 기존 글꼴 크기 또는 스타일 치수에 적용하는 배율입니다.
 */
export function Style_ScaleAllSizes(
  self: ImGuiStyle,
  scale_factor: number,
): void {
  native.Style_ScaleAllSizes(self, scale_factor);
}
