import { native } from '../internal/native';
import type { ImVec2Like, ImVec4Like, ImVec4Value } from '../types';

/**
 * Edit an RGB color.
 *
 * @zh 编辑 RGB 颜色。
 * @ja RGB の色を編集します。
 * @ko RGB 색상을 편집합니다.
 *
 * @remarks
 * Left-click the color square to open a picker; right-click it to open the
 * options menu.
 *
 * Supply contiguous color components in a `Float32Array`. A subarray may select
 * the color components within a larger buffer; the component count describes
 * the accessible values, not a separate native array object.
 * @zh
 * 左键点击颜色方块打开拾色器，右键点击打开选项菜单。
 *
 * 使用 `Float32Array` 提供连续的颜色分量。可通过子数组选择较大缓冲区中的颜色分量；分量数量表示可访问的值数，而不是独立的原生数组对象。
 * @ja
 * 色の四角を左クリックするとピッカー、右クリックするとオプションメニューが開きます。
 *
 * 連続した色成分を `Float32Array`
 * で渡します。大きなバッファ内の色成分をサブ配列で選択できます。成分数はアクセス可能な値の数を示し、独立したネイティブ配列オブジェクトを意味しません。
 * @ko
 * 색상 사각형을 왼쪽 클릭하면 선택기가 열리고 오른쪽 클릭하면 옵션 메뉴가 열립니다.
 *
 * 연속된 색상 성분을 `Float32Array`로 전달합니다. 부분 배열로 더 큰 버퍼 안의 색상 성분을 선택할 수 있습니다. 성분 수는
 * 접근 가능한 값의 개수이며 별도의 네이티브 배열 객체를 뜻하지 않습니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param col - Mutable RGB/RGBA color components; the widget writes edits in
 * place. Color-edit flags determine RGB/HSV interpretation and HDR range. Pass
 * Float32Array storage, not a JS scalar; native access uses the supplied
 * backing memory.
 * @zh col - 可变 RGB/RGBA 颜色分量，控件原地回写；颜色编辑标志决定 RGB/HSV 解释和 HDR 范围。 请传入
 * Float32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja col - 編集を直接書き戻す RGB/RGBA 成分です。色編集フラグが RGB/HSV の解釈と HDR 範囲を決めます。 JS
 * スカラーではなく Float32Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko col - 직접 편집하는 RGB/RGBA 색 성분입니다. 색상 편집 플래그가 RGB/HSV 해석과 HDR 범위를 정합니다. JS
 * 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param flags - ImGuiColorEditFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiColorEditFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiColorEditFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiColorEditFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function ColorEdit3(
  label: string | Uint8Array,
  col: Float32Array,
  flags: number = 0,
): boolean {
  return native.ColorEdit3(label, col, flags);
}

/**
 * Display a compact editor for a color and its alpha component.
 *
 * @zh 显示用于编辑颜色及其透明度分量的紧凑控件。
 * @ja 色とアルファ成分を編集するコンパクトなエディターを表示します。
 * @ko 색상과 알파 성분을 편집하는 간결한 편집기를 표시합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param col - Mutable RGB/RGBA color components; the widget writes edits in
 * place. Color-edit flags determine RGB/HSV interpretation and HDR range. Pass
 * Float32Array storage, not a JS scalar; native access uses the supplied
 * backing memory.
 * @zh col - 可变 RGB/RGBA 颜色分量，控件原地回写；颜色编辑标志决定 RGB/HSV 解释和 HDR 范围。 请传入
 * Float32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja col - 編集を直接書き戻す RGB/RGBA 成分です。色編集フラグが RGB/HSV の解釈と HDR 範囲を決めます。 JS
 * スカラーではなく Float32Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko col - 직접 편집하는 RGB/RGBA 색 성분입니다. 색상 편집 플래그가 RGB/HSV 해석과 HDR 범위를 정합니다. JS
 * 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param flags - ImGuiColorEditFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiColorEditFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiColorEditFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiColorEditFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function ColorEdit4(
  label: string | Uint8Array,
  col: Float32Array,
  flags: number = 0,
): boolean {
  return native.ColorEdit4(label, col, flags);
}

/**
 * Display a visual picker for a three-component color without alpha.
 *
 * @zh 显示不含透明度的三分量颜色选择器。
 * @ja アルファを含まない 3 成分の色を選ぶ視覚的なピッカーを表示します。
 * @ko 알파가 없는 3성분 색상을 고르는 시각적 선택기를 표시합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param col - Mutable RGB/RGBA color components; the widget writes edits in
 * place. Color-edit flags determine RGB/HSV interpretation and HDR range. Pass
 * Float32Array storage, not a JS scalar; native access uses the supplied
 * backing memory.
 * @zh col - 可变 RGB/RGBA 颜色分量，控件原地回写；颜色编辑标志决定 RGB/HSV 解释和 HDR 范围。 请传入
 * Float32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja col - 編集を直接書き戻す RGB/RGBA 成分です。色編集フラグが RGB/HSV の解釈と HDR 範囲を決めます。 JS
 * スカラーではなく Float32Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko col - 직접 편집하는 RGB/RGBA 색 성분입니다. 색상 편집 플래그가 RGB/HSV 해석과 HDR 범위를 정합니다. JS
 * 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param flags - ImGuiColorEditFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiColorEditFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiColorEditFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiColorEditFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function ColorPicker3(
  label: string | Uint8Array,
  col: Float32Array,
  flags: number = 0,
): boolean {
  return native.ColorPicker3(label, col, flags);
}

/**
 * Display a visual picker for a color and its alpha component.
 *
 * @zh 显示用于选择颜色及其透明度分量的可视化选择器。
 * @ja 色とアルファ成分を選ぶ視覚的なピッカーを表示します。
 * @ko 색상과 알파 성분을 고르는 시각적 선택기를 표시합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param col - Mutable RGB/RGBA color components; the widget writes edits in
 * place. Color-edit flags determine RGB/HSV interpretation and HDR range. Pass
 * Float32Array storage, not a JS scalar; native access uses the supplied
 * backing memory.
 * @zh col - 可变 RGB/RGBA 颜色分量，控件原地回写；颜色编辑标志决定 RGB/HSV 解释和 HDR 范围。 请传入
 * Float32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja col - 編集を直接書き戻す RGB/RGBA 成分です。色編集フラグが RGB/HSV の解釈と HDR 範囲を決めます。 JS
 * スカラーではなく Float32Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko col - 직접 편집하는 RGB/RGBA 색 성분입니다. 색상 편집 플래그가 RGB/HSV 해석과 HDR 범위를 정합니다. JS
 * 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param flags - ImGuiColorEditFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiColorEditFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiColorEditFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiColorEditFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param ref_col - Optional reference RGBA color read by the picker for
 * comparison; it is not edited. Pass Float32Array storage, not a JS scalar;
 * native access uses the supplied backing memory.
 * @zh ref_col - 供拾色器比较的可选 RGBA 参考颜色，只读取而不编辑。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja ref_col - ピッカーが比較用に読む任意の RGBA 基準色です。編集はしません。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko ref_col - 색상 선택기가 비교용으로 읽는 선택적 RGBA 기준색이며 편집하지 않습니다. JS 스칼라가 아닌
 * Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function ColorPicker4(
  label: string | Uint8Array,
  col: Float32Array,
  flags: number = 0,
  ref_col: Float32Array | null = null,
): boolean {
  return native.ColorPicker4(label, col, flags, ref_col);
}

/**
 * Display a clickable color swatch with color details available on hover.
 *
 * @zh 显示可点击的色块，悬停时可查看颜色详情。
 * @ja クリック可能な色見本を表示し、ホバー時に色の詳細を確認できるようにします。
 * @ko 클릭 가능한 색상 견본을 표시하며 마우스를 올리면 색상 세부 정보를 볼 수 있습니다.
 *
 * @remarks
 * Implied size = { x: 0, y: 0 }
 * @zh
 * 隐含参数：size = { x: 0, y: 0 }。
 * @ja
 * 暗黙の引数：size = { x: 0, y: 0 }。
 * @ko
 * 암묵적 인수: size = { x: 0, y: 0 }.
 *
 * @param desc_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh desc_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja desc_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko desc_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param col - Floating-point RGBA color; alpha controls opacity.
 * @zh col - 浮点 RGBA 颜色；alpha 控制不透明度。
 * @ja col - 浮動小数点 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 부동소수점 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param flags - ImGuiColorEditFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiColorEditFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiColorEditFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiColorEditFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function ColorButton(
  desc_id: string | Uint8Array,
  col: ImVec4Like,
  flags: number = 0,
): boolean {
  return native.ColorButton(desc_id, col, flags);
}

/**
 * Display a color swatch button.
 *
 * @zh 显示颜色样本按钮。
 * @ja 色見本のボタンを表示します。
 * @ko 색상 견본 버튼을 표시합니다.
 *
 * @remarks
 * display a color square/button, hover for details, return true when pressed.
 * @zh
 * 显示色块/按钮，悬停可查看详情，按下时返回 true。
 * @ja
 * 色の四角／ボタンを表示します。
 *
 * ホバーすると詳細を表示し、押すと true を返します。
 * @ko
 * 색상 사각형/버튼을 표시합니다.
 *
 * 마우스를 올리면 상세 정보가 보이며 누르면 true를 반환합니다.
 *
 * @param desc_id - String identifier hashed with the current ID stack to
 * distinguish this item or scope.
 * @zh desc_id - 字符串标识符，与当前 ID 栈一起散列以区分此项或作用域。
 * @ja desc_id - 現在の ID スタックと組み合わせて項目やスコープを識別する文字列です。
 * @ko desc_id - 현재 ID 스택과 함께 해시하여 항목이나 범위를 구별하는 문자열 식별자입니다.
 *
 * @param col - Floating-point RGBA color; alpha controls opacity.
 * @zh col - 浮点 RGBA 颜色；alpha 控制不透明度。
 * @ja col - 浮動小数点 RGBA の色です。アルファ値で不透明度を指定します。
 * @ko col - 부동소수점 RGBA 색상입니다. 알파는 불투명도를 제어합니다.
 *
 * @param flags - ImGuiColorEditFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiColorEditFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiColorEditFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiColorEditFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param size - Color button width and height in pixels; each zero axis uses
 * the standard frame height.
 * @zh size - 颜色按钮像素宽高；为零的轴使用标准框高度。
 * @ja size - 色ボタンのピクセル幅・高さです。0 の軸は標準フレーム高さを使います。
 * @ko size - 색상 버튼의 픽셀 너비와 높이입니다. 0인 축은 표준 프레임 높이를 사용합니다.
 *
 * @returns True when the item is activated this frame; this is an activation
 * event, not a persistent selected state.
 * @zh 此帧中项被激活时返回 true；表示激活事件，而非持续选中状态。
 * @ja このフレームで項目が操作された場合は true です。永続的な選択状態ではなく操作イベントです。
 * @ko 이번 프레임에 항목이 활성화되면 true입니다. 지속 선택 상태가 아닌 활성화 이벤트입니다.
 */
export function ColorButtonEx(
  desc_id: string | Uint8Array,
  col: ImVec4Like,
  flags: number = 0,
  size: ImVec2Like = { x: 0, y: 0 },
): boolean {
  return native.ColorButtonEx(desc_id, col, flags, size);
}

/**
 * Set the default color-editor and picker options.
 *
 * @zh 设置颜色编辑器和拾色器的默认选项。
 * @ja カラーエディターとピッカーの既定オプションを設定します。
 * @ko 색상 편집기 및 선택기의 기본 옵션을 설정합니다.
 *
 * @remarks
 * initialize current options (generally on application startup) if you want to
 * select a default format, picker type, etc.
 *
 * User will be able to change many settings, unless you pass the _NoOptions
 * flag to your calls.
 * @zh
 * 若要选择默认格式、选择器类型等，可初始化当前选项（通常在应用启动时）。
 *
 * 除非调用时传入 _NoOptions 标志，否则用户仍能更改许多设置。
 * @ja
 * 既定の書式やピッカー種別などを選ぶ場合、現在のオプションを初期化します（通常はアプリ起動時）。
 *
 * 呼び出しに _NoOptions フラグを渡さない限り、ユーザーは多くの設定を変更できます。
 * @ko
 * 기본 서식, 선택기 유형 등을 선택하려면 현재 옵션을 초기화합니다(보통 애플리케이션 시작 시).
 *
 * 호출 시 _NoOptions 플래그를 전달하지 않는 한 사용자는 여러 설정을 바꿀 수 있습니다.
 *
 * @param flags - ImGuiColorEditFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiColorEditFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiColorEditFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiColorEditFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 */
export function SetColorEditOptions(flags: number): void {
  native.SetColorEditOptions(flags);
}

/**
 * Convert a packed 32-bit color to four floating-point components.
 *
 * @zh 将打包的 32 位颜色转换为四个浮点分量。
 * @ja パックされた 32 ビットの色を 4 つの浮動小数点成分に変換します。
 * @ko 패킹된 32비트 색상을 네 개의 부동 소수점 성분으로 변환합니다.
 *
 * @param in_ - Color encoded in the native packed ImU32 channel layout.
 * @zh in_ - 采用原生打包 ImU32 通道布局编码的颜色。
 * @ja in_ - ネイティブのパック済み ImU32 チャンネル配置で表す色です。
 * @ko in_ - 네이티브 패킹 ImU32 채널 배열로 인코딩한 색상입니다.
 *
 * @returns Copied floating-point RGBA color as {x: r, y: g, z: b, w: a};
 * editing the object does not change the native style.
 * @zh 浮点 RGBA 颜色副本 {x: r, y: g, z: b, w: a}；修改对象不会更改原生样式。
 * @ja 浮動小数点 RGBA のコピー {x: r, y: g, z: b, w: a} です。変更してもネイティブスタイルは変わりません。
 * @ko 부동소수점 RGBA 색상 복사본 {x: r, y: g, z: b, w: a}입니다. 객체를 바꿔도 네이티브 스타일은 변경되지
 * 않습니다.
 */
export function ColorConvertU32ToFloat4(in_: number): ImVec4Value {
  return native.ColorConvertU32ToFloat4(in_);
}

/**
 * Pack floating-point RGBA components into a 32-bit color without applying
 * style alpha.
 *
 * @zh 将浮点 RGBA 分量打包为 32 位颜色，不应用样式透明度。
 * @ja スタイルのアルファ値を適用せず、浮動小数点 RGBA 成分を 32 ビット色に変換します。
 * @ko 스타일 알파를 적용하지 않고 부동소수점 RGBA 성분을 32비트 색상으로 변환합니다.
 *
 * @param in_ - Floating-point RGBA color to convert to native packed ImU32.
 * @zh in_ - 要转换为原生打包 ImU32 的浮点 RGBA 颜色。
 * @ja in_ - ネイティブのパック済み ImU32 に変換する浮動小数点 RGBA 色です。
 * @ko in_ - 네이티브 패킹 ImU32로 변환할 부동소수점 RGBA 색상입니다.
 *
 * @returns Packed ImU32 RGBA color after clamping and quantizing the
 * floating-point components.
 * @zh 将浮点分量钳制和量化后得到的打包 ImU32 RGBA 颜色。
 * @ja 浮動小数点成分を制限・量子化したパック済み ImU32 RGBA 色です。
 * @ko 부동소수점 성분을 제한하고 양자화한 패킹 ImU32 RGBA 색상입니다.
 */
export function ColorConvertFloat4ToU32(in_: ImVec4Like): number {
  return native.ColorConvertFloat4ToU32(in_);
}

/**
 * Convert a color from RGB components to hue, saturation, and value.
 *
 * @zh 将颜色从 RGB 分量转换为色相、饱和度和明度。
 * @ja 色を RGB 成分から色相、彩度、明度に変換します。
 * @ko 색상을 RGB 성분에서 색상, 채도, 명도로 변환합니다.
 *
 * @param r - Red/green/blue input component for RGB-to-HSV conversion, normally
 * in the 0 to 1 range.
 * @zh r - 用于 RGB 转 HSV 的红、绿或蓝输入分量，通常范围为 0 到 1。
 * @ja r - RGB から HSV への変換で使う赤・緑・青成分です。通常は 0～1 です。
 * @ko r - RGB에서 HSV로 변환할 빨강, 초록 또는 파랑 입력 성분이며 보통 0~1입니다.
 *
 * @param g - Red/green/blue input component for RGB-to-HSV conversion, normally
 * in the 0 to 1 range.
 * @zh g - 用于 RGB 转 HSV 的红、绿或蓝输入分量，通常范围为 0 到 1。
 * @ja g - RGB から HSV への変換で使う赤・緑・青成分です。通常は 0～1 です。
 * @ko g - RGB에서 HSV로 변환할 빨강, 초록 또는 파랑 입력 성분이며 보통 0~1입니다.
 *
 * @param b - Red/green/blue input component for RGB-to-HSV conversion, normally
 * in the 0 to 1 range.
 * @zh b - 用于 RGB 转 HSV 的红、绿或蓝输入分量，通常范围为 0 到 1。
 * @ja b - RGB から HSV への変換で使う赤・緑・青成分です。通常は 0～1 です。
 * @ko b - RGB에서 HSV로 변환할 빨강, 초록 또는 파랑 입력 성분이며 보통 0~1입니다.
 *
 * @param out_h - Writable Float32Array[0] receiving the corresponding HSV
 * component. Pass Float32Array storage, not a JS scalar; native access uses the
 * supplied backing memory.
 * @zh out_h - 接收对应 HSV 分量的可写 Float32Array[0]。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja out_h - 対応する HSV 成分を書き込む Float32Array[0] です。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko out_h - 해당 HSV 성분을 받는 쓰기 가능한 Float32Array[0]입니다. JS 스칼라가 아닌 Float32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param out_s - Writable Float32Array[0] receiving the corresponding HSV
 * component. Pass Float32Array storage, not a JS scalar; native access uses the
 * supplied backing memory.
 * @zh out_s - 接收对应 HSV 分量的可写 Float32Array[0]。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja out_s - 対応する HSV 成分を書き込む Float32Array[0] です。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko out_s - 해당 HSV 성분을 받는 쓰기 가능한 Float32Array[0]입니다. JS 스칼라가 아닌 Float32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param out_v - Writable Float32Array[0] receiving the corresponding HSV
 * component. Pass Float32Array storage, not a JS scalar; native access uses the
 * supplied backing memory.
 * @zh out_v - 接收对应 HSV 分量的可写 Float32Array[0]。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja out_v - 対応する HSV 成分を書き込む Float32Array[0] です。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko out_v - 해당 HSV 성분을 받는 쓰기 가능한 Float32Array[0]입니다. JS 스칼라가 아닌 Float32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 */
export function ColorConvertRGBtoHSV(
  r: number,
  g: number,
  b: number,
  out_h: Float32Array,
  out_s: Float32Array,
  out_v: Float32Array,
): void {
  native.ColorConvertRGBtoHSV(r, g, b, out_h, out_s, out_v);
}

/**
 * Convert a color from hue, saturation, and value to RGB components.
 *
 * @zh 将颜色从色相、饱和度和明度转换为 RGB 分量。
 * @ja 色を色相、彩度、明度から RGB 成分に変換します。
 * @ko 색상을 색상, 채도, 명도에서 RGB 성분으로 변환합니다.
 *
 * @param h - Hue/saturation/value component for HSV conversion, normally in the
 * 0 to 1 range.
 * @zh h - HSV 转换的色相、饱和度或明度分量，通常范围为 0 到 1。
 * @ja h - HSV 変換に使う色相・彩度・明度成分です。通常は 0～1 です。
 * @ko h - HSV 변환의 색조, 채도 또는 명도 성분이며 보통 0~1입니다.
 *
 * @param s - Hue/saturation/value component for HSV conversion, normally in the
 * 0 to 1 range.
 * @zh s - HSV 转换的色相、饱和度或明度分量，通常范围为 0 到 1。
 * @ja s - HSV 変換に使う色相・彩度・明度成分です。通常は 0～1 です。
 * @ko s - HSV 변환의 색조, 채도 또는 명도 성분이며 보통 0~1입니다.
 *
 * @param v - Hue/saturation/value component for HSV conversion, normally in the
 * 0 to 1 range.
 * @zh v - HSV 转换的色相、饱和度或明度分量，通常范围为 0 到 1。
 * @ja v - HSV 変換に使う色相・彩度・明度成分です。通常は 0～1 です。
 * @ko v - HSV 변환의 색조, 채도 또는 명도 성분이며 보통 0~1입니다.
 *
 * @param out_r - Writable Float32Array[0] receiving the corresponding RGB
 * component. Pass Float32Array storage, not a JS scalar; native access uses the
 * supplied backing memory.
 * @zh out_r - 接收对应 RGB 分量的可写 Float32Array[0]。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja out_r - 対応する RGB 成分を書き込む Float32Array[0] です。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko out_r - 해당 RGB 성분을 받는 쓰기 가능한 Float32Array[0]입니다. JS 스칼라가 아닌 Float32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param out_g - Writable Float32Array[0] receiving the corresponding RGB
 * component. Pass Float32Array storage, not a JS scalar; native access uses the
 * supplied backing memory.
 * @zh out_g - 接收对应 RGB 分量的可写 Float32Array[0]。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja out_g - 対応する RGB 成分を書き込む Float32Array[0] です。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko out_g - 해당 RGB 성분을 받는 쓰기 가능한 Float32Array[0]입니다. JS 스칼라가 아닌 Float32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param out_b - Writable Float32Array[0] receiving the corresponding RGB
 * component. Pass Float32Array storage, not a JS scalar; native access uses the
 * supplied backing memory.
 * @zh out_b - 接收对应 RGB 分量的可写 Float32Array[0]。 请传入 Float32Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja out_b - 対応する RGB 成分を書き込む Float32Array[0] です。 JS スカラーではなく Float32Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko out_b - 해당 RGB 성분을 받는 쓰기 가능한 Float32Array[0]입니다. JS 스칼라가 아닌 Float32Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 */
export function ColorConvertHSVtoRGB(
  h: number,
  s: number,
  v: number,
  out_r: Float32Array,
  out_g: Float32Array,
  out_b: Float32Array,
): void {
  native.ColorConvertHSVtoRGB(h, s, v, out_r, out_g, out_b);
}

/**
 * Create an RGBA color from hue, saturation, value, and alpha.
 *
 * @zh 根据色相、饱和度、明度和透明度创建 RGBA 颜色。
 * @ja 色相、彩度、明度、アルファから RGBA 色を作成します。
 * @ko 색상, 채도, 명도, 알파로 RGBA 색상을 만듭니다.
 *
 * @param h - Hue/saturation/value component for HSV conversion, normally in the
 * 0 to 1 range.
 * @zh h - HSV 转换的色相、饱和度或明度分量，通常范围为 0 到 1。
 * @ja h - HSV 変換に使う色相・彩度・明度成分です。通常は 0～1 です。
 * @ko h - HSV 변환의 색조, 채도 또는 명도 성분이며 보통 0~1입니다.
 *
 * @param s - Hue/saturation/value component for HSV conversion, normally in the
 * 0 to 1 range.
 * @zh s - HSV 转换的色相、饱和度或明度分量，通常范围为 0 到 1。
 * @ja s - HSV 変換に使う色相・彩度・明度成分です。通常は 0～1 です。
 * @ko s - HSV 변환의 색조, 채도 또는 명도 성분이며 보통 0~1입니다.
 *
 * @param v - Hue/saturation/value component for HSV conversion, normally in the
 * 0 to 1 range.
 * @zh v - HSV 转换的色相、饱和度或明度分量，通常范围为 0 到 1。
 * @ja v - HSV 変換に使う色相・彩度・明度成分です。通常は 0～1 です。
 * @ko v - HSV 변환의 색조, 채도 또는 명도 성분이며 보통 0~1입니다.
 *
 * @param a - Alpha component of the resulting color, normally 0 to 1.
 * @zh a - 结果颜色的 alpha 分量，通常为 0 到 1。
 * @ja a - 結果色のアルファ成分です。通常は 0～1 です。
 * @ko a - 결과 색상의 알파 성분이며 보통 0~1입니다.
 *
 * @returns Copied RGBA color {x: r, y: g, z: b, w: a} converted from the
 * supplied HSV and alpha components.
 * @zh 由所提供 HSV 和 alpha 分量转换出的 RGBA 颜色副本 {x: r, y: g, z: b, w: a}。
 * @ja 指定 HSV とアルファ成分から変換した RGBA 色のコピー {x: r, y: g, z: b, w: a} です。
 * @ko 전달한 HSV 및 알파 성분에서 변환한 RGBA 색상 복사본 {x: r, y: g, z: b, w: a}입니다.
 */
export function ImColor_HSV(
  h: number,
  s: number,
  v: number,
  a: number = 1.0,
): ImVec4Value {
  return native.ImColor_HSV(h, s, v, a);
}
