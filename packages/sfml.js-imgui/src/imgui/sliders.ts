import { native } from '../internal/native';
import type { ImVec2Like } from '../types';

/**
 * Edit a floating-point value with a slider.
 *
 * @zh 通过滑块编辑浮点数值。
 * @ja スライダーで浮動小数点の値を編集します。
 * @ko 슬라이더로 부동 소수점 값을 편집합니다.
 *
 * @remarks
 * adjust format to decorate the value with a prefix or a suffix for in-slider
 * labels or unit display.
 *
 * - CTRL+Click on any slider to turn them into an input box. Manually input
 *   values aren't clamped by default and can go off-bounds. Use
 *   ImGuiSliderFlags.AlwaysClamp to always clamp.
 *
 * - Adjust format string to decorate the value with a prefix, a suffix, or
 *   adapt the editing and display precision e.g. "%.3f" -> 1.234; "%5.2 secs"
 *   -> 01.23 secs; "Biscuit: %.0f" -> Biscuit: 1; etc.
 *
 * - Format string may also be set to null or use the default format ("%f" or
 *   "%d").
 *
 * - Legacy: Pre-1.78 there are SliderXXX() function signatures that take a
 *   final `float power=1.0` argument instead of the `ImGuiSliderFlags flags=0`
 *   argument. If you get a warning converting a float to ImGuiSliderFlags, read
 *   https://github.com/ocornut/imgui/issues/3361
 *
 * Implied format = "%.3f", flags = 0
 * @zh
 * 调整 format，可为数值添加前后缀，用于滑块内标签或单位显示。
 *
 * 控件：常规滑块。
 *
 * - CTRL+单击任意滑块可将其转为输入框。手动输入的值默认不受范围限制，可以越界。使用 ImGuiSliderFlags.AlwaysClamp
 *   可始终限制范围。
 *
 * - 调整格式字符串可为数值添加前后缀，或改变编辑和显示精度，例如 "%.3f" -> 1.234; "%5.2 secs" -> 01.23 secs;
 *   "Biscuit: %.0f" -> Biscuit: 1; 等。
 *
 * - 格式字符串也可设为 null 或使用默认格式（"%f" 或 "%d"）。
 *
 * - 历史兼容：1.78 之前的 SliderXXX() 函数签名末尾接受 `float power=1.0`，而非 `ImGuiSliderFlags
 *   flags=0`。若出现 float 转换为 ImGuiSliderFlags 的警告，请阅读
 *   https://github.com/ocornut/imgui/issues/3361 。
 *
 * 隐含参数：format = "%.3f", flags = 0。
 * @ja
 * format を調整して値に接頭辞や接尾辞を付け、スライダー内のラベルや単位を表示できます。
 *
 * ウィジェット：通常のスライダー。
 *
 * - スライダーを CTRL+クリックすると入力欄になります。手入力の値は既定では制限されず範囲外にできます。常に制限するには
 *   ImGuiSliderFlags.AlwaysClamp を使ってください。
 *
 * - 書式文字列で接頭辞、接尾辞、編集と表示の精度を調整できます。例："%.3f" -> 1.234; "%5.2 secs" -> 01.23
 *   secs; "Biscuit: %.0f" -> Biscuit: 1; など。
 *
 * - 書式文字列は null または既定書式（"%f" または "%d"）にもできます。
 *
 * - 旧仕様：1.78 より前の SliderXXX() の末尾引数は `ImGuiSliderFlags flags=0` ではなく `float
 *   power=1.0` でした。float から ImGuiSliderFlags への変換警告が出た場合は
 *   https://github.com/ocornut/imgui/issues/3361 を参照してください。
 *
 * 暗黙の引数：format = "%.3f", flags = 0。
 * @ko
 * format을 조정해 값에 접두사나 접미사를 붙여 슬라이더 내부 레이블이나 단위를 표시할 수 있습니다.
 *
 * 위젯: 일반 슬라이더.
 *
 * - 슬라이더를 CTRL+클릭하면 입력 상자로 바뀝니다. 직접 입력한 값은 기본적으로 제한되지 않아 범위를 벗어날 수 있습니다. 항상
 *   제한하려면 ImGuiSliderFlags.AlwaysClamp를 사용하세요.
 *
 * - 서식 문자열로 접두사, 접미사를 붙이거나 편집 및 표시 정밀도를 조절할 수 있습니다. 예: "%.3f" -> 1.234; "%5.2
 *   secs" -> 01.23 secs; "Biscuit: %.0f" -> Biscuit: 1; 등.
 *
 * - 서식 문자열을 null로 설정하거나 기본 서식("%f" 또는 "%d")을 사용할 수도 있습니다.
 *
 * - 이전 사양: 1.78 이전 SliderXXX()의 마지막 인수는 `ImGuiSliderFlags flags=0`이 아닌 `float
 *   power=1.0`였습니다. float를 ImGuiSliderFlags로 변환하는 경고가 나오면
 *   https://github.com/ocornut/imgui/issues/3361 을 읽으세요.
 *
 * 암묵적 인수: format = "%.3f", flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget value in element [0]; edits are written back into
 * the supplied array. Pass Float32Array storage, not a JS scalar; native access
 * uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0]；编辑会回写所提供的数组。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Float32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderFloat(
  label: string | Uint8Array,
  v: Float32Array,
  v_min: number,
  v_max: number,
): boolean {
  return native.SliderFloat(label, v, v_min, v_max);
}

/**
 * Edit a floating-point value with a slider.
 *
 * @zh 通过滑块编辑浮点数值。
 * @ja スライダーで浮動小数点の値を編集します。
 * @ko 슬라이더로 부동 소수점 값을 편집합니다.
 *
 * @remarks
 * adjust format to decorate the value with a prefix or a suffix for in-slider
 * labels or unit display.
 * @zh
 * 调整 format，可为数值添加前后缀，用于滑块内标签或单位显示。
 * @ja
 * format を調整して値に接頭辞や接尾辞を付け、スライダー内のラベルや単位を表示できます。
 * @ko
 * format을 조정해 값에 접두사나 접미사를 붙여 슬라이더 내부 레이블이나 단위를 표시할 수 있습니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget value in element [0]; edits are written back into
 * the supplied array. Pass Float32Array storage, not a JS scalar; native access
 * uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0]；编辑会回写所提供的数组。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Float32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiSliderFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSliderFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSliderFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSliderFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderFloatEx(
  label: string | Uint8Array,
  v: Float32Array,
  v_min: number,
  v_max: number,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.SliderFloatEx(label, v, v_min, v_max, format, flags);
}

/**
 * Edit 2 floating-point components with horizontal sliders.
 *
 * @zh 使用水平滑块编辑 2 个浮点分量。
 * @ja 水平スライダーで 2 個の浮動小数点成分を編集します。
 * @ko 수평 슬라이더로 부동소수점 성분 2개를 편집합니다.
 *
 * @remarks
 * Implied format = "%.3f", flags = 0
 * @zh
 * 隐含参数：format = "%.3f", flags = 0。
 * @ja
 * 暗黙の引数：format = "%.3f", flags = 0。
 * @ko
 * 암묵적 인수: format = "%.3f", flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget values in elements [0..1]; edits are written back
 * into the supplied array. Pass Float32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0..1]；编辑会回写所提供的数组。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0..1] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0..1]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌
 * Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderFloat2(
  label: string | Uint8Array,
  v: Float32Array,
  v_min: number,
  v_max: number,
): boolean {
  return native.SliderFloat2(label, v, v_min, v_max);
}

/**
 * Edit 2 floating-point components with horizontal sliders.
 *
 * @zh 使用水平滑块编辑 2 个浮点分量。
 * @ja 水平スライダーで 2 個の浮動小数点成分を編集します。
 * @ko 수평 슬라이더로 부동소수점 성분 2개를 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget values in elements [0..1]; edits are written back
 * into the supplied array. Pass Float32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0..1]；编辑会回写所提供的数组。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0..1] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0..1]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌
 * Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiSliderFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSliderFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSliderFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSliderFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderFloat2Ex(
  label: string | Uint8Array,
  v: Float32Array,
  v_min: number,
  v_max: number,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.SliderFloat2Ex(label, v, v_min, v_max, format, flags);
}

/**
 * Edit 3 floating-point components with horizontal sliders.
 *
 * @zh 使用水平滑块编辑 3 个浮点分量。
 * @ja 水平スライダーで 3 個の浮動小数点成分を編集します。
 * @ko 수평 슬라이더로 부동소수점 성분 3개를 편집합니다.
 *
 * @remarks
 * Implied format = "%.3f", flags = 0
 * @zh
 * 隐含参数：format = "%.3f", flags = 0。
 * @ja
 * 暗黙の引数：format = "%.3f", flags = 0。
 * @ko
 * 암묵적 인수: format = "%.3f", flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget values in elements [0..2]; edits are written back
 * into the supplied array. Pass Float32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0..2]；编辑会回写所提供的数组。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0..2] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0..2]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌
 * Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderFloat3(
  label: string | Uint8Array,
  v: Float32Array,
  v_min: number,
  v_max: number,
): boolean {
  return native.SliderFloat3(label, v, v_min, v_max);
}

/**
 * Edit 3 floating-point components with horizontal sliders.
 *
 * @zh 使用水平滑块编辑 3 个浮点分量。
 * @ja 水平スライダーで 3 個の浮動小数点成分を編集します。
 * @ko 수평 슬라이더로 부동소수점 성분 3개를 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget values in elements [0..2]; edits are written back
 * into the supplied array. Pass Float32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0..2]；编辑会回写所提供的数组。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0..2] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0..2]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌
 * Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiSliderFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSliderFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSliderFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSliderFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderFloat3Ex(
  label: string | Uint8Array,
  v: Float32Array,
  v_min: number,
  v_max: number,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.SliderFloat3Ex(label, v, v_min, v_max, format, flags);
}

/**
 * Edit 4 floating-point components with horizontal sliders.
 *
 * @zh 使用水平滑块编辑 4 个浮点分量。
 * @ja 水平スライダーで 4 個の浮動小数点成分を編集します。
 * @ko 수평 슬라이더로 부동소수점 성분 4개를 편집합니다.
 *
 * @remarks
 * Implied format = "%.3f", flags = 0
 * @zh
 * 隐含参数：format = "%.3f", flags = 0。
 * @ja
 * 暗黙の引数：format = "%.3f", flags = 0。
 * @ko
 * 암묵적 인수: format = "%.3f", flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget values in elements [0..3]; edits are written back
 * into the supplied array. Pass Float32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0..3]；编辑会回写所提供的数组。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0..3] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0..3]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌
 * Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderFloat4(
  label: string | Uint8Array,
  v: Float32Array,
  v_min: number,
  v_max: number,
): boolean {
  return native.SliderFloat4(label, v, v_min, v_max);
}

/**
 * Edit 4 floating-point components with horizontal sliders.
 *
 * @zh 使用水平滑块编辑 4 个浮点分量。
 * @ja 水平スライダーで 4 個の浮動小数点成分を編集します。
 * @ko 수평 슬라이더로 부동소수점 성분 4개를 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget values in elements [0..3]; edits are written back
 * into the supplied array. Pass Float32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0..3]；编辑会回写所提供的数组。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0..3] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0..3]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌
 * Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiSliderFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSliderFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSliderFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSliderFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderFloat4Ex(
  label: string | Uint8Array,
  v: Float32Array,
  v_min: number,
  v_max: number,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.SliderFloat4Ex(label, v, v_min, v_max, format, flags);
}

/**
 * Edit an angle stored in radians using a slider displayed in degrees.
 *
 * @zh 使用以度数显示的滑块编辑以弧度存储的角度。
 * @ja 度数表示のスライダーで、ラジアンとして保存される角度を編集します。
 * @ko 도 단위로 표시되는 슬라이더로 라디안으로 저장된 각도를 편집합니다.
 *
 * @remarks
 * Implied v_degrees_min = -360.0, v_degrees_max = +360.0, format = "%.0f
 * deg", flags = 0
 * @zh
 * 隐含参数：v_degrees_min = -360.0, v_degrees_max = +360.0, format = "%.0f deg",
 * flags = 0。
 * @ja
 * 暗黙の引数：v_degrees_min = -360.0, v_degrees_max = +360.0, format = "%.0f deg",
 * flags = 0。
 * @ko
 * 암묵적 인수: v_degrees_min = -360.0, v_degrees_max = +360.0, format = "%.0f
 * deg", flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v_rad - Angle stored in radians in Float32Array[0]; the widget
 * displays degrees and writes radians back. Pass Float32Array storage, not a JS
 * scalar; native access uses the supplied backing memory.
 * @zh v_rad - Float32Array[0] 中以弧度存储的角度；控件显示度数并回写弧度。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v_rad - Float32Array[0] のラジアン角度です。表示は度で、書き戻しはラジアンです。 JS スカラーではなく
 * Float32Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v_rad - Float32Array[0]의 라디안 각도입니다. 위젯은 도로 표시하고 라디안으로 다시 씁니다. JS 스칼라가 아닌
 * Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderAngle(
  label: string | Uint8Array,
  v_rad: Float32Array,
): boolean {
  return native.SliderAngle(label, v_rad);
}

/**
 * Edit an angle stored in radians using a slider displayed in degrees.
 *
 * @zh 使用以度数显示的滑块编辑以弧度存储的角度。
 * @ja 度数表示のスライダーで、ラジアンとして保存される角度を編集します。
 * @ko 도 단위로 표시되는 슬라이더로 라디안으로 저장된 각도를 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v_rad - Angle stored in radians in Float32Array[0]; the widget
 * displays degrees and writes radians back. Pass Float32Array storage, not a JS
 * scalar; native access uses the supplied backing memory.
 * @zh v_rad - Float32Array[0] 中以弧度存储的角度；控件显示度数并回写弧度。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v_rad - Float32Array[0] のラジアン角度です。表示は度で、書き戻しはラジアンです。 JS スカラーではなく
 * Float32Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v_rad - Float32Array[0]의 라디안 각도입니다. 위젯은 도로 표시하고 라디안으로 다시 씁니다. JS 스칼라가 아닌
 * Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_degrees_min - Lower/upper slider endpoint in degrees, although v_rad
 * stores radians.
 * @zh v_degrees_min - 以度为单位的滑块下端或上端，v_rad 仍以弧度存储。
 * @ja v_degrees_min - 度単位のスライダー下端または上端です。v_rad はラジアンのままです。
 * @ko v_degrees_min - 도 단위의 슬라이더 하한 또는 상한입니다. v_rad는 라디안을 저장합니다.
 *
 * @param v_degrees_max - Lower/upper slider endpoint in degrees, although v_rad
 * stores radians.
 * @zh v_degrees_max - 以度为单位的滑块下端或上端，v_rad 仍以弧度存储。
 * @ja v_degrees_max - 度単位のスライダー下端または上端です。v_rad はラジアンのままです。
 * @ko v_degrees_max - 도 단위의 슬라이더 하한 또는 상한입니다. v_rad는 라디안을 저장합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiSliderFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSliderFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSliderFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSliderFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderAngleEx(
  label: string | Uint8Array,
  v_rad: Float32Array,
  v_degrees_min: number = -360.0,
  v_degrees_max: number,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.SliderAngleEx(
    label,
    v_rad,
    v_degrees_min,
    v_degrees_max,
    format,
    flags,
  );
}

/**
 * Edit an integer value with a horizontal slider.
 *
 * @zh 使用水平滑块编辑整数值。
 * @ja 水平スライダーで整数値を編集します。
 * @ko 수평 슬라이더로 정수 값을 편집합니다.
 *
 * @remarks
 * Implied format = "%d", flags = 0
 * @zh
 * 隐含参数：format = "%d", flags = 0。
 * @ja
 * 暗黙の引数：format = "%d", flags = 0。
 * @ko
 * 암묵적 인수: format = "%d", flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget value in element [0]; edits are written back into
 * the supplied array. Pass Int32Array storage, not a JS scalar; native access
 * uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0]；编辑会回写所提供的数组。 请传入 Int32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Int32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderInt(
  label: string | Uint8Array,
  v: Int32Array,
  v_min: number,
  v_max: number,
): boolean {
  return native.SliderInt(label, v, v_min, v_max);
}

/**
 * Edit an integer value with a horizontal slider.
 *
 * @zh 使用水平滑块编辑整数值。
 * @ja 水平スライダーで整数値を編集します。
 * @ko 수평 슬라이더로 정수 값을 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget value in element [0]; edits are written back into
 * the supplied array. Pass Int32Array storage, not a JS scalar; native access
 * uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0]；编辑会回写所提供的数组。 请传入 Int32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Int32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiSliderFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSliderFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSliderFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSliderFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderIntEx(
  label: string | Uint8Array,
  v: Int32Array,
  v_min: number,
  v_max: number,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.SliderIntEx(label, v, v_min, v_max, format, flags);
}

/**
 * Edit 2 integer components with horizontal sliders.
 *
 * @zh 使用水平滑块编辑 2 个整数分量。
 * @ja 水平スライダーで 2 個の整数成分を編集します。
 * @ko 수평 슬라이더로 정수 성분 2개를 편집합니다.
 *
 * @remarks
 * Implied format = "%d", flags = 0
 * @zh
 * 隐含参数：format = "%d", flags = 0。
 * @ja
 * 暗黙の引数：format = "%d", flags = 0。
 * @ko
 * 암묵적 인수: format = "%d", flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget values in elements [0..1]; edits are written back
 * into the supplied array. Pass Int32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0..1]；编辑会回写所提供的数组。 请传入 Int32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0..1] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0..1]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Int32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderInt2(
  label: string | Uint8Array,
  v: Int32Array,
  v_min: number,
  v_max: number,
): boolean {
  return native.SliderInt2(label, v, v_min, v_max);
}

/**
 * Edit 2 integer components with horizontal sliders.
 *
 * @zh 使用水平滑块编辑 2 个整数分量。
 * @ja 水平スライダーで 2 個の整数成分を編集します。
 * @ko 수평 슬라이더로 정수 성분 2개를 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget values in elements [0..1]; edits are written back
 * into the supplied array. Pass Int32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0..1]；编辑会回写所提供的数组。 请传入 Int32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0..1] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0..1]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Int32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiSliderFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSliderFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSliderFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSliderFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderInt2Ex(
  label: string | Uint8Array,
  v: Int32Array,
  v_min: number,
  v_max: number,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.SliderInt2Ex(label, v, v_min, v_max, format, flags);
}

/**
 * Edit 3 integer components with horizontal sliders.
 *
 * @zh 使用水平滑块编辑 3 个整数分量。
 * @ja 水平スライダーで 3 個の整数成分を編集します。
 * @ko 수평 슬라이더로 정수 성분 3개를 편집합니다.
 *
 * @remarks
 * Implied format = "%d", flags = 0
 * @zh
 * 隐含参数：format = "%d", flags = 0。
 * @ja
 * 暗黙の引数：format = "%d", flags = 0。
 * @ko
 * 암묵적 인수: format = "%d", flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget values in elements [0..2]; edits are written back
 * into the supplied array. Pass Int32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0..2]；编辑会回写所提供的数组。 请传入 Int32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0..2] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0..2]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Int32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderInt3(
  label: string | Uint8Array,
  v: Int32Array,
  v_min: number,
  v_max: number,
): boolean {
  return native.SliderInt3(label, v, v_min, v_max);
}

/**
 * Edit 3 integer components with horizontal sliders.
 *
 * @zh 使用水平滑块编辑 3 个整数分量。
 * @ja 水平スライダーで 3 個の整数成分を編集します。
 * @ko 수평 슬라이더로 정수 성분 3개를 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget values in elements [0..2]; edits are written back
 * into the supplied array. Pass Int32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0..2]；编辑会回写所提供的数组。 请传入 Int32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0..2] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0..2]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Int32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiSliderFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSliderFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSliderFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSliderFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderInt3Ex(
  label: string | Uint8Array,
  v: Int32Array,
  v_min: number,
  v_max: number,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.SliderInt3Ex(label, v, v_min, v_max, format, flags);
}

/**
 * Edit 4 integer components with horizontal sliders.
 *
 * @zh 使用水平滑块编辑 4 个整数分量。
 * @ja 水平スライダーで 4 個の整数成分を編集します。
 * @ko 수평 슬라이더로 정수 성분 4개를 편집합니다.
 *
 * @remarks
 * Implied format = "%d", flags = 0
 * @zh
 * 隐含参数：format = "%d", flags = 0。
 * @ja
 * 暗黙の引数：format = "%d", flags = 0。
 * @ko
 * 암묵적 인수: format = "%d", flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget values in elements [0..3]; edits are written back
 * into the supplied array. Pass Int32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0..3]；编辑会回写所提供的数组。 请传入 Int32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0..3] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0..3]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Int32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderInt4(
  label: string | Uint8Array,
  v: Int32Array,
  v_min: number,
  v_max: number,
): boolean {
  return native.SliderInt4(label, v, v_min, v_max);
}

/**
 * Edit 4 integer components with horizontal sliders.
 *
 * @zh 使用水平滑块编辑 4 个整数分量。
 * @ja 水平スライダーで 4 個の整数成分を編集します。
 * @ko 수평 슬라이더로 정수 성분 4개를 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget values in elements [0..3]; edits are written back
 * into the supplied array. Pass Int32Array storage, not a JS scalar; native
 * access uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0..3]；编辑会回写所提供的数组。 请传入 Int32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0..3] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0..3]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Int32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiSliderFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSliderFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSliderFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSliderFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderInt4Ex(
  label: string | Uint8Array,
  v: Int32Array,
  v_min: number,
  v_max: number,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.SliderInt4Ex(label, v, v_min, v_max, format, flags);
}

/**
 * Edit one numeric value of a selected data type with a horizontal slider.
 *
 * @zh 使用水平滑块编辑指定数据类型的单个数值。
 * @ja 水平スライダーで指定したデータ型の単一の数値を編集します。
 * @ko 수평 슬라이더로 지정한 데이터 형식의 단일 숫자 값을 편집합니다.
 *
 * @remarks
 * Implied format = null, flags = 0
 * @zh
 * 隐含参数：format = null, flags = 0。
 * @ja
 * 暗黙の引数：format = null, flags = 0。
 * @ko
 * 암묵적 인수: format = null, flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param data_type - ImGuiDataType describing the native scalar layout at
 * p_data and the associated limit/step addresses.
 * @zh data_type - 描述 p_data 及相关边界、步长地址处原生标量布局的 ImGuiDataType。
 * @ja data_type - p_data と境界・増分アドレスにあるネイティブ値の型を示す ImGuiDataType です。
 * @ko data_type - p_data 및 제한과 증분 주소의 네이티브 스칼라 형식을 지정하는 ImGuiDataType입니다.
 *
 * @param p_data - Nonzero bigint address of writable scalar data
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call. N variants access components consecutive values.
 * @zh p_data - 按 data_type 布局存储的可写标量数据的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。N 版本访问 components 个连续值。
 * @ja p_data - data_type 形式の書き込み可能な値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。N 版は連続する components 個の値にアクセスします。
 * @ko p_data - data_type 형식의 쓰기 가능한 값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요. N 버전은 연속된 components개 값에 접근합니다.
 *
 * @param p_min - Nonzero bigint address of the required bound
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call.
 * @zh p_min - 按 data_type 布局存储的必需边界的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。
 * @ja p_min - data_type 形式の必須の境界値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。
 * @ko p_min - data_type 형식의 필수 경계값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요.
 *
 * @param p_max - Nonzero bigint address of the required bound
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call.
 * @zh p_max - 按 data_type 布局存储的必需边界的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。
 * @ja p_max - data_type 形式の必須の境界値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。
 * @ko p_max - data_type 형식의 필수 경계값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderScalar(
  label: string | Uint8Array,
  data_type: number,
  p_data: bigint,
  p_min: bigint,
  p_max: bigint,
): boolean {
  return native.SliderScalar(label, data_type, p_data, p_min, p_max);
}

/**
 * Edit one numeric value of a selected data type with a horizontal slider.
 *
 * @zh 使用水平滑块编辑指定数据类型的单个数值。
 * @ja 水平スライダーで指定したデータ型の単一の数値を編集します。
 * @ko 수평 슬라이더로 지정한 데이터 형식의 단일 숫자 값을 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param data_type - ImGuiDataType describing the native scalar layout at
 * p_data and the associated limit/step addresses.
 * @zh data_type - 描述 p_data 及相关边界、步长地址处原生标量布局的 ImGuiDataType。
 * @ja data_type - p_data と境界・増分アドレスにあるネイティブ値の型を示す ImGuiDataType です。
 * @ko data_type - p_data 및 제한과 증분 주소의 네이티브 스칼라 형식을 지정하는 ImGuiDataType입니다.
 *
 * @param p_data - Nonzero bigint address of writable scalar data
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call. N variants access components consecutive values.
 * @zh p_data - 按 data_type 布局存储的可写标量数据的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。N 版本访问 components 个连续值。
 * @ja p_data - data_type 形式の書き込み可能な値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。N 版は連続する components 個の値にアクセスします。
 * @ko p_data - data_type 형식의 쓰기 가능한 값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요. N 버전은 연속된 components개 값에 접근합니다.
 *
 * @param p_min - Nonzero bigint address of the required bound
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call.
 * @zh p_min - 按 data_type 布局存储的必需边界的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。
 * @ja p_min - data_type 形式の必須の境界値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。
 * @ko p_min - data_type 형식의 필수 경계값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요.
 *
 * @param p_max - Nonzero bigint address of the required bound
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call.
 * @zh p_max - 按 data_type 布局存储的必需边界的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。
 * @ja p_max - data_type 形式の必須の境界値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。
 * @ko p_max - data_type 형식의 필수 경계값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiSliderFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSliderFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSliderFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSliderFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderScalarEx(
  label: string | Uint8Array,
  data_type: number,
  p_data: bigint,
  p_min: bigint,
  p_max: bigint,
  format: string | Uint8Array | null = null,
  flags: number = 0,
): boolean {
  return native.SliderScalarEx(
    label,
    data_type,
    p_data,
    p_min,
    p_max,
    format,
    flags,
  );
}

/**
 * Edit multiple numeric components of a selected data type with horizontal
 * sliders.
 *
 * @zh 使用水平滑块编辑指定数据类型的多个数值分量。
 * @ja 水平スライダーで指定したデータ型の複数の数値成分を編集します。
 * @ko 수평 슬라이더로 지정한 데이터 형식의 여러 숫자 성분을 편집합니다.
 *
 * @remarks
 * Implied format = null, flags = 0
 * @zh
 * 隐含参数：format = null, flags = 0。
 * @ja
 * 暗黙の引数：format = null, flags = 0。
 * @ko
 * 암묵적 인수: format = null, flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param data_type - ImGuiDataType describing the native scalar layout at
 * p_data and the associated limit/step addresses.
 * @zh data_type - 描述 p_data 及相关边界、步长地址处原生标量布局的 ImGuiDataType。
 * @ja data_type - p_data と境界・増分アドレスにあるネイティブ値の型を示す ImGuiDataType です。
 * @ko data_type - p_data 및 제한과 증분 주소의 네이티브 스칼라 형식을 지정하는 ImGuiDataType입니다.
 *
 * @param p_data - Nonzero bigint address of writable scalar data
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call. N variants access components consecutive values.
 * @zh p_data - 按 data_type 布局存储的可写标量数据的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。N 版本访问 components 个连续值。
 * @ja p_data - data_type 形式の書き込み可能な値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。N 版は連続する components 個の値にアクセスします。
 * @ko p_data - data_type 형식의 쓰기 가능한 값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요. N 버전은 연속된 components개 값에 접근합니다.
 *
 * @param components - Number of consecutive scalar components read and edited
 * at p_data.
 * @zh components - 在 p_data 处读取和编辑的连续标量分量数。
 * @ja components - p_data から読み書きする連続したスカラー成分数です。
 * @ko components - p_data에서 읽고 편집하는 연속 스칼라 성분 수입니다.
 *
 * @param p_min - Nonzero bigint address of the required bound
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call.
 * @zh p_min - 按 data_type 布局存储的必需边界的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。
 * @ja p_min - data_type 形式の必須の境界値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。
 * @ko p_min - data_type 형식의 필수 경계값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요.
 *
 * @param p_max - Nonzero bigint address of the required bound
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call.
 * @zh p_max - 按 data_type 布局存储的必需边界的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。
 * @ja p_max - data_type 形式の必須の境界値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。
 * @ko p_max - data_type 형식의 필수 경계값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderScalarN(
  label: string | Uint8Array,
  data_type: number,
  p_data: bigint,
  components: number,
  p_min: bigint,
  p_max: bigint,
): boolean {
  return native.SliderScalarN(
    label,
    data_type,
    p_data,
    components,
    p_min,
    p_max,
  );
}

/**
 * Edit multiple numeric components of a selected data type with horizontal
 * sliders.
 *
 * @zh 使用水平滑块编辑指定数据类型的多个数值分量。
 * @ja 水平スライダーで指定したデータ型の複数の数値成分を編集します。
 * @ko 수평 슬라이더로 지정한 데이터 형식의 여러 숫자 성분을 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param data_type - ImGuiDataType describing the native scalar layout at
 * p_data and the associated limit/step addresses.
 * @zh data_type - 描述 p_data 及相关边界、步长地址处原生标量布局的 ImGuiDataType。
 * @ja data_type - p_data と境界・増分アドレスにあるネイティブ値の型を示す ImGuiDataType です。
 * @ko data_type - p_data 및 제한과 증분 주소의 네이티브 스칼라 형식을 지정하는 ImGuiDataType입니다.
 *
 * @param p_data - Nonzero bigint address of writable scalar data
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call. N variants access components consecutive values.
 * @zh p_data - 按 data_type 布局存储的可写标量数据的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。N 版本访问 components 个连续值。
 * @ja p_data - data_type 形式の書き込み可能な値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。N 版は連続する components 個の値にアクセスします。
 * @ko p_data - data_type 형식의 쓰기 가능한 값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요. N 버전은 연속된 components개 값에 접근합니다.
 *
 * @param components - Number of consecutive scalar components read and edited
 * at p_data.
 * @zh components - 在 p_data 处读取和编辑的连续标量分量数。
 * @ja components - p_data から読み書きする連続したスカラー成分数です。
 * @ko components - p_data에서 읽고 편집하는 연속 스칼라 성분 수입니다.
 *
 * @param p_min - Nonzero bigint address of the required bound
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call.
 * @zh p_min - 按 data_type 布局存储的必需边界的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。
 * @ja p_min - data_type 形式の必須の境界値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。
 * @ko p_min - data_type 형식의 필수 경계값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요.
 *
 * @param p_max - Nonzero bigint address of the required bound
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call.
 * @zh p_max - 按 data_type 布局存储的必需边界的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。
 * @ja p_max - data_type 形式の必須の境界値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。
 * @ko p_max - data_type 형식의 필수 경계값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiSliderFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSliderFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSliderFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSliderFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function SliderScalarNEx(
  label: string | Uint8Array,
  data_type: number,
  p_data: bigint,
  components: number,
  p_min: bigint,
  p_max: bigint,
  format: string | Uint8Array | null = null,
  flags: number = 0,
): boolean {
  return native.SliderScalarNEx(
    label,
    data_type,
    p_data,
    components,
    p_min,
    p_max,
    format,
    flags,
  );
}

/**
 * Edit a floating-point value with a vertical slider.
 *
 * @zh 使用垂直滑块编辑浮点值。
 * @ja 垂直スライダーで浮動小数点値を編集します。
 * @ko 수직 슬라이더로 부동소수점 값을 편집합니다.
 *
 * @remarks
 * Implied format = "%.3f", flags = 0
 * @zh
 * 隐含参数：format = "%.3f", flags = 0。
 * @ja
 * 暗黙の引数：format = "%.3f", flags = 0。
 * @ko
 * 암묵적 인수: format = "%.3f", flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param size - Vertical slider frame width and height in pixels.
 * @zh size - 垂直滑块框的像素宽高。
 * @ja size - 縦スライダー枠のピクセル幅・高さです。
 * @ko size - 세로 슬라이더 프레임의 픽셀 너비와 높이입니다.
 *
 * @param v - Mutable widget value in element [0]; edits are written back into
 * the supplied array. Pass Float32Array storage, not a JS scalar; native access
 * uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0]；编辑会回写所提供的数组。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Float32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function VSliderFloat(
  label: string | Uint8Array,
  size: ImVec2Like,
  v: Float32Array,
  v_min: number,
  v_max: number,
): boolean {
  return native.VSliderFloat(label, size, v, v_min, v_max);
}

/**
 * Edit a floating-point value with a vertical slider.
 *
 * @zh 使用垂直滑块编辑浮点值。
 * @ja 垂直スライダーで浮動小数点値を編集します。
 * @ko 수직 슬라이더로 부동소수점 값을 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param size - Vertical slider frame width and height in pixels.
 * @zh size - 垂直滑块框的像素宽高。
 * @ja size - 縦スライダー枠のピクセル幅・高さです。
 * @ko size - 세로 슬라이더 프레임의 픽셀 너비와 높이입니다.
 *
 * @param v - Mutable widget value in element [0]; edits are written back into
 * the supplied array. Pass Float32Array storage, not a JS scalar; native access
 * uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0]；编辑会回写所提供的数组。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Float32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiSliderFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSliderFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSliderFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSliderFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function VSliderFloatEx(
  label: string | Uint8Array,
  size: ImVec2Like,
  v: Float32Array,
  v_min: number,
  v_max: number,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.VSliderFloatEx(label, size, v, v_min, v_max, format, flags);
}

/**
 * Edit an integer value with a vertical slider.
 *
 * @zh 使用垂直滑块编辑整数值。
 * @ja 垂直スライダーで整数値を編集します。
 * @ko 수직 슬라이더로 정수 값을 편집합니다.
 *
 * @remarks
 * Implied format = "%d", flags = 0
 * @zh
 * 隐含参数：format = "%d", flags = 0。
 * @ja
 * 暗黙の引数：format = "%d", flags = 0。
 * @ko
 * 암묵적 인수: format = "%d", flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param size - Vertical slider frame width and height in pixels.
 * @zh size - 垂直滑块框的像素宽高。
 * @ja size - 縦スライダー枠のピクセル幅・高さです。
 * @ko size - 세로 슬라이더 프레임의 픽셀 너비와 높이입니다.
 *
 * @param v - Mutable widget value in element [0]; edits are written back into
 * the supplied array. Pass Int32Array storage, not a JS scalar; native access
 * uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0]；编辑会回写所提供的数组。 请传入 Int32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Int32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function VSliderInt(
  label: string | Uint8Array,
  size: ImVec2Like,
  v: Int32Array,
  v_min: number,
  v_max: number,
): boolean {
  return native.VSliderInt(label, size, v, v_min, v_max);
}

/**
 * Edit an integer value with a vertical slider.
 *
 * @zh 使用垂直滑块编辑整数值。
 * @ja 垂直スライダーで整数値を編集します。
 * @ko 수직 슬라이더로 정수 값을 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param size - Vertical slider frame width and height in pixels.
 * @zh size - 垂直滑块框的像素宽高。
 * @ja size - 縦スライダー枠のピクセル幅・高さです。
 * @ko size - 세로 슬라이더 프레임의 픽셀 너비와 높이입니다.
 *
 * @param v - Mutable widget value in element [0]; edits are written back into
 * the supplied array. Pass Int32Array storage, not a JS scalar; native access
 * uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0]；编辑会回写所提供的数组。 请传入 Int32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Int32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_min - Lower end of the value range; for drag widgets v_min >= v_max
 * disables ordinary bounds.
 * @zh v_min - 数值范围下限；拖动控件中 v_min >= v_max 时不使用普通边界限制。
 * @ja v_min - 値範囲の下端です。ドラッグでは v_min >= v_max で通常の範囲制限を無効にします。
 * @ko v_min - 값 범위의 하한입니다. 드래그 위젯에서는 v_min >= v_max이면 일반 범위 제한을 해제합니다.
 *
 * @param v_max - Upper end of the value range; slider flags determine whether
 * manual input is clamped.
 * @zh v_max - 数值范围上限；滑块标志决定是否限制手动输入。
 * @ja v_max - 値範囲の上端です。手入力を制限するかはスライダーフラグで決まります。
 * @ko v_max - 값 범위의 상한입니다. 직접 입력 제한 여부는 슬라이더 플래그가 결정합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiSliderFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSliderFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSliderFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSliderFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function VSliderIntEx(
  label: string | Uint8Array,
  size: ImVec2Like,
  v: Int32Array,
  v_min: number,
  v_max: number,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.VSliderIntEx(label, size, v, v_min, v_max, format, flags);
}

/**
 * Edit one numeric value of a selected data type with a vertical slider.
 *
 * @zh 使用垂直滑块编辑指定数据类型的单个数值。
 * @ja 垂直スライダーで指定したデータ型の単一の数値を編集します。
 * @ko 수직 슬라이더로 지정한 데이터 형식의 단일 숫자 값을 편집합니다.
 *
 * @remarks
 * Implied format = null, flags = 0
 * @zh
 * 隐含参数：format = null, flags = 0。
 * @ja
 * 暗黙の引数：format = null, flags = 0。
 * @ko
 * 암묵적 인수: format = null, flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param size - Vertical slider frame width and height in pixels.
 * @zh size - 垂直滑块框的像素宽高。
 * @ja size - 縦スライダー枠のピクセル幅・高さです。
 * @ko size - 세로 슬라이더 프레임의 픽셀 너비와 높이입니다.
 *
 * @param data_type - ImGuiDataType describing the native scalar layout at
 * p_data and the associated limit/step addresses.
 * @zh data_type - 描述 p_data 及相关边界、步长地址处原生标量布局的 ImGuiDataType。
 * @ja data_type - p_data と境界・増分アドレスにあるネイティブ値の型を示す ImGuiDataType です。
 * @ko data_type - p_data 및 제한과 증분 주소의 네이티브 스칼라 형식을 지정하는 ImGuiDataType입니다.
 *
 * @param p_data - Nonzero bigint address of writable scalar data
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call. N variants access components consecutive values.
 * @zh p_data - 按 data_type 布局存储的可写标量数据的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。N 版本访问 components 个连续值。
 * @ja p_data - data_type 形式の書き込み可能な値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。N 版は連続する components 個の値にアクセスします。
 * @ko p_data - data_type 형식의 쓰기 가능한 값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요. N 버전은 연속된 components개 값에 접근합니다.
 *
 * @param p_min - Nonzero bigint address of the required bound
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call.
 * @zh p_min - 按 data_type 布局存储的必需边界的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。
 * @ja p_min - data_type 形式の必須の境界値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。
 * @ko p_min - data_type 형식의 필수 경계값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요.
 *
 * @param p_max - Nonzero bigint address of the required bound
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call.
 * @zh p_max - 按 data_type 布局存储的必需边界的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。
 * @ja p_max - data_type 形式の必須の境界値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。
 * @ko p_max - data_type 형식의 필수 경계값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function VSliderScalar(
  label: string | Uint8Array,
  size: ImVec2Like,
  data_type: number,
  p_data: bigint,
  p_min: bigint,
  p_max: bigint,
): boolean {
  return native.VSliderScalar(label, size, data_type, p_data, p_min, p_max);
}

/**
 * Edit one numeric value of a selected data type with a vertical slider.
 *
 * @zh 使用垂直滑块编辑指定数据类型的单个数值。
 * @ja 垂直スライダーで指定したデータ型の単一の数値を編集します。
 * @ko 수직 슬라이더로 지정한 데이터 형식의 단일 숫자 값을 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param size - Vertical slider frame width and height in pixels.
 * @zh size - 垂直滑块框的像素宽高。
 * @ja size - 縦スライダー枠のピクセル幅・高さです。
 * @ko size - 세로 슬라이더 프레임의 픽셀 너비와 높이입니다.
 *
 * @param data_type - ImGuiDataType describing the native scalar layout at
 * p_data and the associated limit/step addresses.
 * @zh data_type - 描述 p_data 及相关边界、步长地址处原生标量布局的 ImGuiDataType。
 * @ja data_type - p_data と境界・増分アドレスにあるネイティブ値の型を示す ImGuiDataType です。
 * @ko data_type - p_data 및 제한과 증분 주소의 네이티브 스칼라 형식을 지정하는 ImGuiDataType입니다.
 *
 * @param p_data - Nonzero bigint address of writable scalar data
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call. N variants access components consecutive values.
 * @zh p_data - 按 data_type 布局存储的可写标量数据的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。N 版本访问 components 个连续值。
 * @ja p_data - data_type 形式の書き込み可能な値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。N 版は連続する components 個の値にアクセスします。
 * @ko p_data - data_type 형식의 쓰기 가능한 값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요. N 버전은 연속된 components개 값에 접근합니다.
 *
 * @param p_min - Nonzero bigint address of the required bound
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call.
 * @zh p_min - 按 data_type 布局存储的必需边界的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。
 * @ja p_min - data_type 形式の必須の境界値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。
 * @ko p_min - data_type 형식의 필수 경계값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요.
 *
 * @param p_max - Nonzero bigint address of the required bound
 * in data_type layout. Not a TypedArray. Keep the allocation alive for this
 * call.
 * @zh p_max - 按 data_type 布局存储的必需边界的非零 bigint 地址，
 * 不是 TypedArray。调用期间须保持内存有效。
 * @ja p_max - data_type 形式の必須の境界値へのゼロでない bigint アドレスです。
 * TypedArray ではありません。呼び出し中は領域を保持します。
 * @ko p_max - data_type 형식의 필수 경계값을 가리키는 0이 아닌 bigint 주소입니다.
 * TypedArray가 아닙니다. 호출 동안 메모리를 유지하세요.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiSliderFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiSliderFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiSliderFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiSliderFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function VSliderScalarEx(
  label: string | Uint8Array,
  size: ImVec2Like,
  data_type: number,
  p_data: bigint,
  p_min: bigint,
  p_max: bigint,
  format: string | Uint8Array | null = null,
  flags: number = 0,
): boolean {
  return native.VSliderScalarEx(
    label,
    size,
    data_type,
    p_data,
    p_min,
    p_max,
    format,
    flags,
  );
}
