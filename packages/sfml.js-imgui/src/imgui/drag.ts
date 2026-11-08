import { native } from '../internal/native';

/**
 * Edit a floating-point value by dragging.
 *
 * @zh 通过拖动编辑浮点数值。
 * @ja ドラッグで浮動小数点の値を編集します。
 * @ko 드래그로 부동 소수점 값을 편집합니다.
 *
 * @remarks
 * - Pass a `Float32Array` with at least one element. The widget reads and
 *   updates `v[0]`. Vector variants require two, three, or four consecutive
 *   elements; use `subarray()` to select a region of an existing array.
 * - This helper uses speed `1`, no bounds, format `"%.3f"`, and flags `0`.
 *   Use `DragFloatEx()` to configure speed, bounds, format, and flags.
 * - Ctrl+click switches to text input. In `DragFloatEx()`, bounds apply when
 *   `v_min < v_max`; `ImGuiSliderFlags.AlwaysClamp` also limits text input.
 * - Speed is the change per pixel of mouse movement. For example, `0.2`
 *   changes the value by one after five pixels. Formatting controls displayed
 *   precision and may add a prefix or suffix, such as `"%.2f secs"`.
 * @zh
 * - 传入至少包含一个元素的 `Float32Array`，控件直接读写 `v[0]`。向量版本需要连续的两个、三个或四个元素；
 *   可用 `subarray()` 选择已有数组中的区域。
 * - 此辅助函数使用速度 `1`、无范围限制、格式 `"%.3f"` 和标志 `0`。使用 `DragFloatEx()` 可配置这些选项。
 * - Ctrl+单击可切换到文本输入。`DragFloatEx()` 在 `v_min < v_max` 时限制拖动范围；
 *   `ImGuiSliderFlags.AlwaysClamp` 还会限制文本输入。
 * - 速度表示鼠标每移动一像素的数值变化，例如 `0.2` 表示移动五像素改变一。格式字符串控制显示精度，
 *   也可添加前后缀，如 `"%.2f secs"`。
 * @ja
 * - 1 要素以上の `Float32Array` を渡します。ウィジェットは `v[0]` を直接読み書きします。
 *   ベクトル版には連続する 2、3、4 要素が必要です。既存配列の一部は `subarray()` で選べます。
 * - この関数は速度 `1`、範囲制限なし、書式 `"%.3f"`、フラグ `0` を使います。
 *   これらの設定には `DragFloatEx()` を使ってください。
 * - Ctrl+クリックで文字入力に切り替わります。`DragFloatEx()` では `v_min < v_max` のとき範囲を制限し、
 *   `ImGuiSliderFlags.AlwaysClamp` を指定すると文字入力も制限します。
 * - 速度はマウス移動 1 ピクセル当たりの変化量です。例えば `0.2` なら 5 ピクセルで値が 1 変わります。
 *   書式は表示精度や接頭辞・接尾辞を指定します。例：`"%.2f secs"`。
 * @ko
 * - 요소가 하나 이상인 `Float32Array`를 전달합니다. 위젯은 `v[0]`을 직접 읽고 씁니다.
 *   벡터 버전에는 연속된 2개, 3개 또는 4개 요소가 필요합니다. 기존 배열의 일부는 `subarray()`로 선택합니다.
 * - 이 함수는 속도 `1`, 범위 제한 없음, 서식 `"%.3f"`, 플래그 `0`을 사용합니다.
 *   이 설정을 바꾸려면 `DragFloatEx()`를 사용하세요.
 * - Ctrl+클릭하면 텍스트 입력으로 전환합니다. `DragFloatEx()`는 `v_min < v_max`일 때 범위를 제한하며,
 *   `ImGuiSliderFlags.AlwaysClamp`는 텍스트 입력에도 제한을 적용합니다.
 * - 속도는 마우스 이동 1픽셀당 변화량입니다. 예를 들어 `0.2`이면 5픽셀 이동 시 값이 1 변합니다.
 *   서식은 표시 정밀도와 접두사·접미사를 지정합니다. 예: `"%.2f secs"`.
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
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function DragFloat(
  label: string | Uint8Array,
  v: Float32Array,
): boolean {
  return native.DragFloat(label, v);
}

/**
 * Edit a numeric value by dragging.
 *
 * @zh 通过拖动编辑数值。
 * @ja ドラッグで数値を編集します。
 * @ko 드래그로 숫자 값을 편집합니다.
 *
 * @remarks
 * If v_min >= v_max we have no bound
 * @zh
 * 若 v_min >= v_max，则没有范围限制。
 * @ja
 * v_min >= v_max の場合、範囲制限はありません。
 * @ko
 * v_min >= v_max이면 범위 제한이 없습니다.
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
 * @param v_speed - Value change per pixel of mouse dragging, before keyboard
 * modifiers.
 * @zh v_speed - 应用键盘修饰键前，每拖动一像素对应的数值变化量。
 * @ja v_speed - キーボード修飾前の、マウス移動 1 ピクセル当たりの値の変化量です。
 * @ko v_speed - 키보드 보정 전 마우스 드래그 1픽셀당 값 변화량입니다.
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
export function DragFloatEx(
  label: string | Uint8Array,
  v: Float32Array,
  v_speed: number = 1.0,
  v_min: number = 0.0,
  v_max: number = 0.0,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.DragFloatEx(label, v, v_speed, v_min, v_max, format, flags);
}

/**
 * Edit 2 floating-point components with drag controls.
 *
 * @zh 使用拖动控件编辑 2 个浮点分量。
 * @ja ドラッグ操作で 2 個の浮動小数点成分を編集します。
 * @ko 드래그 컨트롤로 부동소수점 성분 2개를 편집합니다.
 *
 * @remarks
 * Implied v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f", flags =
 * 0
 * @zh
 * 隐含参数：v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f", flags = 0。
 * @ja
 * 暗黙の引数：v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f", flags = 0。
 * @ko
 * 암묵적 인수: v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f", flags =
 * 0.
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
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function DragFloat2(
  label: string | Uint8Array,
  v: Float32Array,
): boolean {
  return native.DragFloat2(label, v);
}

/**
 * Edit 2 floating-point components with drag controls.
 *
 * @zh 使用拖动控件编辑 2 个浮点分量。
 * @ja ドラッグ操作で 2 個の浮動小数点成分を編集します。
 * @ko 드래그 컨트롤로 부동소수점 성분 2개를 편집합니다.
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
 * @param v_speed - Value change per pixel of mouse dragging, before keyboard
 * modifiers.
 * @zh v_speed - 应用键盘修饰键前，每拖动一像素对应的数值变化量。
 * @ja v_speed - キーボード修飾前の、マウス移動 1 ピクセル当たりの値の変化量です。
 * @ko v_speed - 키보드 보정 전 마우스 드래그 1픽셀당 값 변화량입니다.
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
export function DragFloat2Ex(
  label: string | Uint8Array,
  v: Float32Array,
  v_speed: number = 1.0,
  v_min: number = 0.0,
  v_max: number = 0.0,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.DragFloat2Ex(label, v, v_speed, v_min, v_max, format, flags);
}

/**
 * Edit 3 floating-point components with drag controls.
 *
 * @zh 使用拖动控件编辑 3 个浮点分量。
 * @ja ドラッグ操作で 3 個の浮動小数点成分を編集します。
 * @ko 드래그 컨트롤로 부동소수점 성분 3개를 편집합니다.
 *
 * @remarks
 * Implied v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f", flags =
 * 0
 * @zh
 * 隐含参数：v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f", flags = 0。
 * @ja
 * 暗黙の引数：v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f", flags = 0。
 * @ko
 * 암묵적 인수: v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f", flags =
 * 0.
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
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function DragFloat3(
  label: string | Uint8Array,
  v: Float32Array,
): boolean {
  return native.DragFloat3(label, v);
}

/**
 * Edit 3 floating-point components with drag controls.
 *
 * @zh 使用拖动控件编辑 3 个浮点分量。
 * @ja ドラッグ操作で 3 個の浮動小数点成分を編集します。
 * @ko 드래그 컨트롤로 부동소수점 성분 3개를 편집합니다.
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
 * @param v_speed - Value change per pixel of mouse dragging, before keyboard
 * modifiers.
 * @zh v_speed - 应用键盘修饰键前，每拖动一像素对应的数值变化量。
 * @ja v_speed - キーボード修飾前の、マウス移動 1 ピクセル当たりの値の変化量です。
 * @ko v_speed - 키보드 보정 전 마우스 드래그 1픽셀당 값 변화량입니다.
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
export function DragFloat3Ex(
  label: string | Uint8Array,
  v: Float32Array,
  v_speed: number = 1.0,
  v_min: number = 0.0,
  v_max: number = 0.0,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.DragFloat3Ex(label, v, v_speed, v_min, v_max, format, flags);
}

/**
 * Edit 4 floating-point components with drag controls.
 *
 * @zh 使用拖动控件编辑 4 个浮点分量。
 * @ja ドラッグ操作で 4 個の浮動小数点成分を編集します。
 * @ko 드래그 컨트롤로 부동소수점 성분 4개를 편집합니다.
 *
 * @remarks
 * Implied v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f", flags =
 * 0
 * @zh
 * 隐含参数：v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f", flags = 0。
 * @ja
 * 暗黙の引数：v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f", flags = 0。
 * @ko
 * 암묵적 인수: v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f", flags =
 * 0.
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
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function DragFloat4(
  label: string | Uint8Array,
  v: Float32Array,
): boolean {
  return native.DragFloat4(label, v);
}

/**
 * Edit 4 floating-point components with drag controls.
 *
 * @zh 使用拖动控件编辑 4 个浮点分量。
 * @ja ドラッグ操作で 4 個の浮動小数点成分を編集します。
 * @ko 드래그 컨트롤로 부동소수점 성분 4개를 편집합니다.
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
 * @param v_speed - Value change per pixel of mouse dragging, before keyboard
 * modifiers.
 * @zh v_speed - 应用键盘修饰键前，每拖动一像素对应的数值变化量。
 * @ja v_speed - キーボード修飾前の、マウス移動 1 ピクセル当たりの値の変化量です。
 * @ko v_speed - 키보드 보정 전 마우스 드래그 1픽셀당 값 변화량입니다.
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
export function DragFloat4Ex(
  label: string | Uint8Array,
  v: Float32Array,
  v_speed: number = 1.0,
  v_min: number = 0.0,
  v_max: number = 0.0,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.DragFloat4Ex(label, v, v_speed, v_min, v_max, format, flags);
}

/**
 * Edit the lower and upper bounds of a floating-point range with paired drag
 * controls.
 *
 * @zh 使用一对拖动控件编辑浮点范围的下限和上限。
 * @ja 対になったドラッグ操作で浮動小数点範囲の下限と上限を編集します。
 * @ko 한 쌍의 드래그 컨트롤로 부동소수점 범위의 하한과 상한을 편집합니다.
 *
 * @remarks
 * Implied v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f",
 * format_max = null, flags = 0
 * @zh
 * 隐含参数：v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f", format_max
 * = null, flags = 0。
 * @ja
 * 暗黙の引数：v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f", format_max
 * = null, flags = 0。
 * @ko
 * 암묵적 인수: v_speed = 1.0, v_min = 0.0, v_max = 0.0, format = "%.3f",
 * format_max = null, flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v_current_min - Mutable lower value of the edited range in element
 * [0]. Pass Float32Array storage, not a JS scalar; native access uses the
 * supplied backing memory.
 * @zh v_current_min - 被编辑范围的可变下端值，存于元素 [0]。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v_current_min - 編集する範囲の下端値を要素 [0] で読み書きします。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v_current_min - 편집 범위의 하한 값이며 요소 [0]에서 읽고 씁니다. JS 스칼라가 아닌 Float32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_current_max - Mutable upper value of the edited range in element
 * [0]. Pass Float32Array storage, not a JS scalar; native access uses the
 * supplied backing memory.
 * @zh v_current_max - 被编辑范围的可变上端值，存于元素 [0]。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v_current_max - 編集する範囲の上端値を要素 [0] で読み書きします。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v_current_max - 편집 범위의 상한 값이며 요소 [0]에서 읽고 씁니다. JS 스칼라가 아닌 Float32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function DragFloatRange2(
  label: string | Uint8Array,
  v_current_min: Float32Array,
  v_current_max: Float32Array,
): boolean {
  return native.DragFloatRange2(label, v_current_min, v_current_max);
}

/**
 * Edit the lower and upper bounds of a floating-point range with paired drag
 * controls.
 *
 * @zh 使用一对拖动控件编辑浮点范围的下限和上限。
 * @ja 対になったドラッグ操作で浮動小数点範囲の下限と上限を編集します。
 * @ko 한 쌍의 드래그 컨트롤로 부동소수점 범위의 하한과 상한을 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v_current_min - Mutable lower value of the edited range in element
 * [0]. Pass Float32Array storage, not a JS scalar; native access uses the
 * supplied backing memory.
 * @zh v_current_min - 被编辑范围的可变下端值，存于元素 [0]。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v_current_min - 編集する範囲の下端値を要素 [0] で読み書きします。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v_current_min - 편집 범위의 하한 값이며 요소 [0]에서 읽고 씁니다. JS 스칼라가 아닌 Float32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_current_max - Mutable upper value of the edited range in element
 * [0]. Pass Float32Array storage, not a JS scalar; native access uses the
 * supplied backing memory.
 * @zh v_current_max - 被编辑范围的可变上端值，存于元素 [0]。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v_current_max - 編集する範囲の上端値を要素 [0] で読み書きします。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v_current_max - 편집 범위의 상한 값이며 요소 [0]에서 읽고 씁니다. JS 스칼라가 아닌 Float32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_speed - Value change per pixel of mouse dragging, before keyboard
 * modifiers.
 * @zh v_speed - 应用键盘修饰键前，每拖动一像素对应的数值变化量。
 * @ja v_speed - キーボード修飾前の、マウス移動 1 ピクセル当たりの値の変化量です。
 * @ko v_speed - 키보드 보정 전 마우스 드래그 1픽셀당 값 변화량입니다.
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
 * @param format_max - Display format for the upper range value; null reuses
 * format.
 * @zh format_max - 范围上端值的显示格式；null 复用 format。
 * @ja format_max - 範囲上端の表示書式です。null は format を再利用します。
 * @ko format_max - 범위 상한 값의 표시 형식입니다. null이면 format을 재사용합니다.
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
export function DragFloatRange2Ex(
  label: string | Uint8Array,
  v_current_min: Float32Array,
  v_current_max: Float32Array,
  v_speed: number = 1.0,
  v_min: number = 0.0,
  v_max: number = 0.0,
  format: string | Uint8Array,
  format_max: string | Uint8Array | null = null,
  flags: number = 0,
): boolean {
  return native.DragFloatRange2Ex(
    label,
    v_current_min,
    v_current_max,
    v_speed,
    v_min,
    v_max,
    format,
    format_max,
    flags,
  );
}

/**
 * Edit an integer value with a drag control.
 *
 * @zh 使用拖动控件编辑整数值。
 * @ja ドラッグ操作で整数値を編集します。
 * @ko 드래그 컨트롤로 정수 값을 편집합니다.
 *
 * @remarks
 * If v_min >= v_max we have no bound
 *
 * Implied v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0
 * @zh
 * 若 v_min >= v_max，则没有范围限制。
 *
 * 隐含参数：v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0。
 * @ja
 * v_min >= v_max の場合、範囲制限はありません。
 *
 * 暗黙の引数：v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0。
 * @ko
 * v_min >= v_max이면 범위 제한이 없습니다.
 *
 * 암묵적 인수: v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0.
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
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function DragInt(label: string | Uint8Array, v: Int32Array): boolean {
  return native.DragInt(label, v);
}

/**
 * Edit a numeric value by dragging.
 *
 * @zh 通过拖动编辑数值。
 * @ja ドラッグで数値を編集します。
 * @ko 드래그로 숫자 값을 편집합니다.
 *
 * @remarks
 * If v_min >= v_max we have no bound
 * @zh
 * 若 v_min >= v_max，则没有范围限制。
 * @ja
 * v_min >= v_max の場合、範囲制限はありません。
 * @ko
 * v_min >= v_max이면 범위 제한이 없습니다.
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
 * @param v_speed - Value change per pixel of mouse dragging, before keyboard
 * modifiers.
 * @zh v_speed - 应用键盘修饰键前，每拖动一像素对应的数值变化量。
 * @ja v_speed - キーボード修飾前の、マウス移動 1 ピクセル当たりの値の変化量です。
 * @ko v_speed - 키보드 보정 전 마우스 드래그 1픽셀당 값 변화량입니다.
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
export function DragIntEx(
  label: string | Uint8Array,
  v: Int32Array,
  v_speed: number = 1.0,
  v_min: number = 0,
  v_max: number = 0,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.DragIntEx(label, v, v_speed, v_min, v_max, format, flags);
}

/**
 * Edit 2 integer components with drag controls.
 *
 * @zh 使用拖动控件编辑 2 个整数分量。
 * @ja ドラッグ操作で 2 個の整数成分を編集します。
 * @ko 드래그 컨트롤로 정수 성분 2개를 편집합니다.
 *
 * @remarks
 * If v_min >= v_max we have no bound
 *
 * Implied v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0
 * @zh
 * 若 v_min >= v_max，则没有范围限制。
 *
 * 隐含参数：v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0。
 * @ja
 * v_min >= v_max の場合、範囲制限はありません。
 *
 * 暗黙の引数：v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0。
 * @ko
 * v_min >= v_max이면 범위 제한이 없습니다.
 *
 * 암묵적 인수: v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0.
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
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function DragInt2(label: string | Uint8Array, v: Int32Array): boolean {
  return native.DragInt2(label, v);
}

/**
 * Edit 2 integer components with drag controls.
 *
 * @zh 使用拖动控件编辑 2 个整数分量。
 * @ja ドラッグ操作で 2 個の整数成分を編集します。
 * @ko 드래그 컨트롤로 정수 성분 2개를 편집합니다.
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
 * @param v_speed - Value change per pixel of mouse dragging, before keyboard
 * modifiers.
 * @zh v_speed - 应用键盘修饰键前，每拖动一像素对应的数值变化量。
 * @ja v_speed - キーボード修飾前の、マウス移動 1 ピクセル当たりの値の変化量です。
 * @ko v_speed - 키보드 보정 전 마우스 드래그 1픽셀당 값 변화량입니다.
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
export function DragInt2Ex(
  label: string | Uint8Array,
  v: Int32Array,
  v_speed: number = 1.0,
  v_min: number = 0,
  v_max: number = 0,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.DragInt2Ex(label, v, v_speed, v_min, v_max, format, flags);
}

/**
 * Edit 3 integer components with drag controls.
 *
 * @zh 使用拖动控件编辑 3 个整数分量。
 * @ja ドラッグ操作で 3 個の整数成分を編集します。
 * @ko 드래그 컨트롤로 정수 성분 3개를 편집합니다.
 *
 * @remarks
 * If v_min >= v_max we have no bound
 *
 * Implied v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0
 * @zh
 * 若 v_min >= v_max，则没有范围限制。
 *
 * 隐含参数：v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0。
 * @ja
 * v_min >= v_max の場合、範囲制限はありません。
 *
 * 暗黙の引数：v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0。
 * @ko
 * v_min >= v_max이면 범위 제한이 없습니다.
 *
 * 암묵적 인수: v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0.
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
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function DragInt3(label: string | Uint8Array, v: Int32Array): boolean {
  return native.DragInt3(label, v);
}

/**
 * Edit 3 integer components with drag controls.
 *
 * @zh 使用拖动控件编辑 3 个整数分量。
 * @ja ドラッグ操作で 3 個の整数成分を編集します。
 * @ko 드래그 컨트롤로 정수 성분 3개를 편집합니다.
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
 * @param v_speed - Value change per pixel of mouse dragging, before keyboard
 * modifiers.
 * @zh v_speed - 应用键盘修饰键前，每拖动一像素对应的数值变化量。
 * @ja v_speed - キーボード修飾前の、マウス移動 1 ピクセル当たりの値の変化量です。
 * @ko v_speed - 키보드 보정 전 마우스 드래그 1픽셀당 값 변화량입니다.
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
export function DragInt3Ex(
  label: string | Uint8Array,
  v: Int32Array,
  v_speed: number = 1.0,
  v_min: number = 0,
  v_max: number = 0,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.DragInt3Ex(label, v, v_speed, v_min, v_max, format, flags);
}

/**
 * Edit 4 integer components with drag controls.
 *
 * @zh 使用拖动控件编辑 4 个整数分量。
 * @ja ドラッグ操作で 4 個の整数成分を編集します。
 * @ko 드래그 컨트롤로 정수 성분 4개를 편집합니다.
 *
 * @remarks
 * If v_min >= v_max we have no bound
 *
 * Implied v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0
 * @zh
 * 若 v_min >= v_max，则没有范围限制。
 *
 * 隐含参数：v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0。
 * @ja
 * v_min >= v_max の場合、範囲制限はありません。
 *
 * 暗黙の引数：v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0。
 * @ko
 * v_min >= v_max이면 범위 제한이 없습니다.
 *
 * 암묵적 인수: v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", flags = 0.
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
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function DragInt4(label: string | Uint8Array, v: Int32Array): boolean {
  return native.DragInt4(label, v);
}

/**
 * Edit 4 integer components with drag controls.
 *
 * @zh 使用拖动控件编辑 4 个整数分量。
 * @ja ドラッグ操作で 4 個の整数成分を編集します。
 * @ko 드래그 컨트롤로 정수 성분 4개를 편집합니다.
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
 * @param v_speed - Value change per pixel of mouse dragging, before keyboard
 * modifiers.
 * @zh v_speed - 应用键盘修饰键前，每拖动一像素对应的数值变化量。
 * @ja v_speed - キーボード修飾前の、マウス移動 1 ピクセル当たりの値の変化量です。
 * @ko v_speed - 키보드 보정 전 마우스 드래그 1픽셀당 값 변화량입니다.
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
export function DragInt4Ex(
  label: string | Uint8Array,
  v: Int32Array,
  v_speed: number = 1.0,
  v_min: number = 0,
  v_max: number = 0,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.DragInt4Ex(label, v, v_speed, v_min, v_max, format, flags);
}

/**
 * Edit the lower and upper bounds of an integer range with paired drag
 * controls.
 *
 * @zh 使用一对拖动控件编辑整数范围的下限和上限。
 * @ja 対になったドラッグ操作で整数範囲の下限と上限を編集します。
 * @ko 한 쌍의 드래그 컨트롤로 정수 범위의 하한과 상한을 편집합니다.
 *
 * @remarks
 * Implied v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", format_max =
 * null, flags = 0
 * @zh
 * 隐含参数：v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", format_max = null,
 * flags = 0。
 * @ja
 * 暗黙の引数：v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", format_max = null,
 * flags = 0。
 * @ko
 * 암묵적 인수: v_speed = 1.0, v_min = 0, v_max = 0, format = "%d", format_max =
 * null, flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v_current_min - Mutable lower value of the edited range in element
 * [0]. Pass Int32Array storage, not a JS scalar; native access uses the
 * supplied backing memory.
 * @zh v_current_min - 被编辑范围的可变下端值，存于元素 [0]。 请传入 Int32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v_current_min - 編集する範囲の下端値を要素 [0] で読み書きします。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v_current_min - 편집 범위의 하한 값이며 요소 [0]에서 읽고 씁니다. JS 스칼라가 아닌 Int32Array 저장소를
 * 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_current_max - Mutable upper value of the edited range in element
 * [0]. Pass Int32Array storage, not a JS scalar; native access uses the
 * supplied backing memory.
 * @zh v_current_max - 被编辑范围的可变上端值，存于元素 [0]。 请传入 Int32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v_current_max - 編集する範囲の上端値を要素 [0] で読み書きします。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v_current_max - 편집 범위의 상한 값이며 요소 [0]에서 읽고 씁니다. JS 스칼라가 아닌 Int32Array 저장소를
 * 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function DragIntRange2(
  label: string | Uint8Array,
  v_current_min: Int32Array,
  v_current_max: Int32Array,
): boolean {
  return native.DragIntRange2(label, v_current_min, v_current_max);
}

/**
 * Edit the lower and upper bounds of an integer range with paired drag
 * controls.
 *
 * @zh 使用一对拖动控件编辑整数范围的下限和上限。
 * @ja 対になったドラッグ操作で整数範囲の下限と上限を編集します。
 * @ko 한 쌍의 드래그 컨트롤로 정수 범위의 하한과 상한을 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v_current_min - Mutable lower value of the edited range in element
 * [0]. Pass Int32Array storage, not a JS scalar; native access uses the
 * supplied backing memory.
 * @zh v_current_min - 被编辑范围的可变下端值，存于元素 [0]。 请传入 Int32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v_current_min - 編集する範囲の下端値を要素 [0] で読み書きします。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v_current_min - 편집 범위의 하한 값이며 요소 [0]에서 읽고 씁니다. JS 스칼라가 아닌 Int32Array 저장소를
 * 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_current_max - Mutable upper value of the edited range in element
 * [0]. Pass Int32Array storage, not a JS scalar; native access uses the
 * supplied backing memory.
 * @zh v_current_max - 被编辑范围的可变上端值，存于元素 [0]。 请传入 Int32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v_current_max - 編集する範囲の上端値を要素 [0] で読み書きします。 JS スカラーではなく Int32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v_current_max - 편집 범위의 상한 값이며 요소 [0]에서 읽고 씁니다. JS 스칼라가 아닌 Int32Array 저장소를
 * 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param v_speed - Value change per pixel of mouse dragging, before keyboard
 * modifiers.
 * @zh v_speed - 应用键盘修饰键前，每拖动一像素对应的数值变化量。
 * @ja v_speed - キーボード修飾前の、マウス移動 1 ピクセル当たりの値の変化量です。
 * @ko v_speed - 키보드 보정 전 마우스 드래그 1픽셀당 값 변화량입니다.
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
 * @param format_max - Display format for the upper range value; null reuses
 * format.
 * @zh format_max - 范围上端值的显示格式；null 复用 format。
 * @ja format_max - 範囲上端の表示書式です。null は format を再利用します。
 * @ko format_max - 범위 상한 값의 표시 형식입니다. null이면 format을 재사용합니다.
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
export function DragIntRange2Ex(
  label: string | Uint8Array,
  v_current_min: Int32Array,
  v_current_max: Int32Array,
  v_speed: number = 1.0,
  v_min: number = 0,
  v_max: number = 0,
  format: string | Uint8Array,
  format_max: string | Uint8Array | null = null,
  flags: number = 0,
): boolean {
  return native.DragIntRange2Ex(
    label,
    v_current_min,
    v_current_max,
    v_speed,
    v_min,
    v_max,
    format,
    format_max,
    flags,
  );
}

/**
 * Edit one numeric value of a selected data type with a drag control.
 *
 * @zh 使用拖动控件编辑指定数据类型的单个数值。
 * @ja ドラッグ操作で指定したデータ型の単一の数値を編集します。
 * @ko 드래그 컨트롤로 지정한 데이터 형식의 단일 숫자 값을 편집합니다.
 *
 * @remarks
 * Implied v_speed = 1.0, p_min = null, p_max = null, format = null, flags = 0
 * @zh
 * 隐含参数：v_speed = 1.0, p_min = null, p_max = null, format = null, flags = 0。
 * @ja
 * 暗黙の引数：v_speed = 1.0, p_min = null, p_max = null, format = null, flags = 0。
 * @ko
 * 암묵적 인수: v_speed = 1.0, p_min = null, p_max = null, format = null, flags = 0.
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
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function DragScalar(
  label: string | Uint8Array,
  data_type: number,
  p_data: bigint,
): boolean {
  return native.DragScalar(label, data_type, p_data);
}

/**
 * Edit one numeric value of a selected data type with a drag control.
 *
 * @zh 使用拖动控件编辑指定数据类型的单个数值。
 * @ja ドラッグ操作で指定したデータ型の単一の数値を編集します。
 * @ko 드래그 컨트롤로 지정한 데이터 형식의 단일 숫자 값을 편집합니다.
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
 * @param v_speed - Value change per pixel of mouse dragging, before keyboard
 * modifiers.
 * @zh v_speed - 应用键盘修饰键前，每拖动一像素对应的数值变化量。
 * @ja v_speed - キーボード修飾前の、マウス移動 1 ピクセル当たりの値の変化量です。
 * @ko v_speed - 키보드 보정 전 마우스 드래그 1픽셀당 값 변화량입니다.
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
export function DragScalarEx(
  label: string | Uint8Array,
  data_type: number,
  p_data: bigint,
  v_speed: number = 1.0,
  p_min: bigint | null = null,
  p_max: bigint | null = null,
  format: string | Uint8Array | null = null,
  flags: number = 0,
): boolean {
  return native.DragScalarEx(
    label,
    data_type,
    p_data,
    v_speed,
    p_min,
    p_max,
    format,
    flags,
  );
}

/**
 * Edit multiple numeric components of a selected data type with drag controls.
 *
 * @zh 使用拖动控件编辑指定数据类型的多个数值分量。
 * @ja ドラッグ操作で指定したデータ型の複数の数値成分を編集します。
 * @ko 드래그 컨트롤로 지정한 데이터 형식의 여러 숫자 성분을 편집합니다.
 *
 * @remarks
 * Implied v_speed = 1.0, p_min = null, p_max = null, format = null, flags = 0
 * @zh
 * 隐含参数：v_speed = 1.0, p_min = null, p_max = null, format = null, flags = 0。
 * @ja
 * 暗黙の引数：v_speed = 1.0, p_min = null, p_max = null, format = null, flags = 0。
 * @ko
 * 암묵적 인수: v_speed = 1.0, p_min = null, p_max = null, format = null, flags = 0.
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
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function DragScalarN(
  label: string | Uint8Array,
  data_type: number,
  p_data: bigint,
  components: number,
): boolean {
  return native.DragScalarN(label, data_type, p_data, components);
}

/**
 * Edit multiple numeric components of a selected data type with drag controls.
 *
 * @zh 使用拖动控件编辑指定数据类型的多个数值分量。
 * @ja ドラッグ操作で指定したデータ型の複数の数値成分を編集します。
 * @ko 드래그 컨트롤로 지정한 데이터 형식의 여러 숫자 성분을 편집합니다.
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
 * @param v_speed - Value change per pixel of mouse dragging, before keyboard
 * modifiers.
 * @zh v_speed - 应用键盘修饰键前，每拖动一像素对应的数值变化量。
 * @ja v_speed - キーボード修飾前の、マウス移動 1 ピクセル当たりの値の変化量です。
 * @ko v_speed - 키보드 보정 전 마우스 드래그 1픽셀당 값 변화량입니다.
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
export function DragScalarNEx(
  label: string | Uint8Array,
  data_type: number,
  p_data: bigint,
  components: number,
  v_speed: number = 1.0,
  p_min: bigint | null = null,
  p_max: bigint | null = null,
  format: string | Uint8Array | null = null,
  flags: number = 0,
): boolean {
  return native.DragScalarNEx(
    label,
    data_type,
    p_data,
    components,
    v_speed,
    p_min,
    p_max,
    format,
    flags,
  );
}
