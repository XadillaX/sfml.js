import { native } from '../internal/native';

/**
 * Edit a single line of text.
 *
 * @zh 编辑单行文本。
 * @ja 1 行のテキストを編集します。
 * @ko 한 줄 텍스트를 편집합니다.
 *
 * @remarks
 * Most `ImGuiInputTextFlags` options apply to text fields, not numeric inputs
 * such as `InputFloat`, `InputInt`, or `InputDouble`.
 *
 * The helper omits the callback and user data (`callback = null`, `user_data =
 * null`). Use `InputTextEx()` for a JavaScript callback.
 * The upstream C++ adapter for dynamic strings is documented in
 * `misc/cpp/imgui_stdlib.h` and `imgui_demo.cpp`; it is not a JavaScript
 * string-buffer interface.
 * @zh
 * 大多数 `ImGuiInputTextFlags` 选项用于文本框，不适用于 `InputFloat`、`InputInt` 或
 * `InputDouble` 等数值输入。
 *
 * 此辅助函数省略回调和用户数据（`callback = null`、`user_data = null`）。需要 JavaScript 回调时使用
 * `InputTextEx()`。上游 C++ 动态字符串适配器见
 * `misc/cpp/imgui_stdlib.h` 和 `imgui_demo.cpp`；它不是 JavaScript 字符串缓冲区接口。
 * @ja
 * ほとんどの `ImGuiInputTextFlags` はテキスト入力用で、`InputFloat`、`InputInt`、`InputDouble`
 * などの数値入力には適用されません。
 *
 * このヘルパーはコールバックとユーザーデータを省略します（`callback = null`、`user_data = null`）。
 * JavaScript コールバックには `InputTextEx()` を使います。上流の C++
 * 動的文字列アダプターは `misc/cpp/imgui_stdlib.h` と `imgui_demo.cpp`
 * に説明されていますが、JavaScript の文字列バッファ用インターフェイスではありません。
 * @ko
 * 대부분의 `ImGuiInputTextFlags` 옵션은 텍스트 입력용이며 `InputFloat`, `InputInt`,
 * `InputDouble` 같은 숫자 입력에는 적용되지 않습니다.
 *
 * 이 헬퍼는 콜백과 사용자 데이터를 생략합니다(`callback = null`, `user_data = null`).
 * JavaScript 콜백에는 `InputTextEx()`를 사용하세요. 상위 C++ 동적
 * 문자열 어댑터는 `misc/cpp/imgui_stdlib.h`와 `imgui_demo.cpp`에 설명되어 있으며 JavaScript 문자열
 * 버퍼 인터페이스는 아닙니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param buf - Writable NUL-terminated UTF-8 Uint8Array; edits update its bytes
 * in place.
 * @zh buf - 可写且以 NUL 结尾的 UTF-8 Uint8Array，编辑会原地修改字节。
 * @ja buf - 書き込み可能な NUL 終端 UTF-8 の Uint8Array です。編集はバイトを直接更新します。
 * @ko buf - 쓰기 가능한 NUL 종료 UTF-8 Uint8Array입니다. 편집 시 바이트를 직접 갱신합니다.
 *
 * @param buf_size - Writable capacity in bytes including the final NUL; must
 * not exceed buf.byteLength.
 * @zh buf_size - 包含结尾 NUL 的可写字节容量，不得超过 buf.byteLength。
 * @ja buf_size - 末尾 NUL を含む書き込み容量です。buf.byteLength を超えないでください。
 * @ko buf_size - 마지막 NUL을 포함한 쓰기 가능 바이트 용량이며 buf.byteLength를 초과하면 안 됩니다.
 *
 * @param flags - ImGuiInputTextFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputTextFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputTextFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputTextFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns Normally true when text changes; with
 * ImGuiInputTextFlags.EnterReturnsTrue, true reports Enter validation instead.
 * Inspect the buffer for the edited bytes.
 * @zh 通常文字变化时为 true；启用 ImGuiInputTextFlags.EnterReturnsTrue 时改为报告 Enter
 * 确认。编辑后的字节请查看缓冲区。
 * @ja 通常はテキスト変更時に true です。ImGuiInputTextFlags.EnterReturnsTrue では Enter
 * 確定を返します。編集結果はバッファーにあります。
 * @ko 보통 텍스트 변경 시 true입니다. ImGuiInputTextFlags.EnterReturnsTrue이면 Enter 확인을
 * 보고합니다. 편집된 바이트는 버퍼에서 확인합니다.
 */
export function InputText(
  label: string | Uint8Array,
  buf: Uint8Array,
  buf_size: number,
  flags: number = 0,
): boolean {
  return native.InputText(label, buf, buf_size, flags);
}

/**
 * Display a text field for editing multiple lines of text.
 *
 * @zh 显示用于编辑多行文本的输入框。
 * @ja 複数行のテキストを編集する入力欄を表示します。
 * @ko 여러 줄의 텍스트를 편집하는 입력란을 표시합니다.
 *
 * @remarks
 * Uses automatic sizing, `flags = 0`, and no callback or user data.
 *
 * Use `InputTextMultilineEx()` to configure the size, input flags, or a
 * JavaScript callback.
 * @zh
 * 使用自动尺寸、`flags = 0`，不设置回调或用户数据。
 *
 * 要配置尺寸、输入标志或 JavaScript 回调，请使用 `InputTextMultilineEx()`。
 * @ja
 * 自動サイズ、`flags = 0` を使い、コールバックとユーザーデータは指定しません。
 *
 * サイズ、入力フラグ、JavaScript コールバックを設定する場合は `InputTextMultilineEx()` を使います。
 * @ko
 * 자동 크기와 `flags = 0`을 사용하며 콜백 및 사용자 데이터를 지정하지 않습니다.
 *
 * 크기, 입력 플래그 또는 JavaScript 콜백을 설정하려면 `InputTextMultilineEx()`를 사용하세요.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param buf - Writable NUL-terminated UTF-8 Uint8Array; edits update its bytes
 * in place.
 * @zh buf - 可写且以 NUL 结尾的 UTF-8 Uint8Array，编辑会原地修改字节。
 * @ja buf - 書き込み可能な NUL 終端 UTF-8 の Uint8Array です。編集はバイトを直接更新します。
 * @ko buf - 쓰기 가능한 NUL 종료 UTF-8 Uint8Array입니다. 편집 시 바이트를 직접 갱신합니다.
 *
 * @param buf_size - Writable capacity in bytes including the final NUL; must
 * not exceed buf.byteLength.
 * @zh buf_size - 包含结尾 NUL 的可写字节容量，不得超过 buf.byteLength。
 * @ja buf_size - 末尾 NUL を含む書き込み容量です。buf.byteLength を超えないでください。
 * @ko buf_size - 마지막 NUL을 포함한 쓰기 가능 바이트 용량이며 buf.byteLength를 초과하면 안 됩니다.
 *
 * @returns True when the text changes; the edited UTF-8 bytes are written into
 * the supplied buffer.
 * @zh 文字变化时为 true；编辑后的 UTF-8 字节写回所提供的缓冲区。
 * @ja テキストが変更されると true です。編集後の UTF-8 バイトは渡したバッファーに書き戻されます。
 * @ko 텍스트가 변경되면 true입니다. 편집된 UTF-8 바이트는 전달한 버퍼에 기록됩니다.
 */
export function InputTextMultiline(
  label: string | Uint8Array,
  buf: Uint8Array,
  buf_size: number,
): boolean {
  return native.InputTextMultiline(label, buf, buf_size);
}

/**
 * Display a single-line text field with a hint shown when the field is empty.
 *
 * @zh 显示单行文本输入框，内容为空时显示提示。
 * @ja 空欄のときにヒントを表示する単一行のテキスト入力欄を表示します。
 * @ko 비어 있을 때 힌트를 표시하는 한 줄 텍스트 입력란을 표시합니다.
 *
 * @remarks
 * Implied callback = null, user_data = null
 * @zh
 * 隐含参数：callback = null, user_data = null。
 * @ja
 * 暗黙の引数：callback = null, user_data = null。
 * @ko
 * 암묵적 인수: callback = null, user_data = null.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param hint - Placeholder text shown when the input buffer is empty.
 * @zh hint - 输入缓冲区为空时显示的提示文字。
 * @ja hint - 入力バッファーが空のときに表示するヒントです。
 * @ko hint - 입력 버퍼가 비어 있을 때 표시하는 안내 텍스트입니다.
 *
 * @param buf - Writable NUL-terminated UTF-8 Uint8Array; edits update its bytes
 * in place.
 * @zh buf - 可写且以 NUL 结尾的 UTF-8 Uint8Array，编辑会原地修改字节。
 * @ja buf - 書き込み可能な NUL 終端 UTF-8 の Uint8Array です。編集はバイトを直接更新します。
 * @ko buf - 쓰기 가능한 NUL 종료 UTF-8 Uint8Array입니다. 편집 시 바이트를 직접 갱신합니다.
 *
 * @param buf_size - Writable capacity in bytes including the final NUL; must
 * not exceed buf.byteLength.
 * @zh buf_size - 包含结尾 NUL 的可写字节容量，不得超过 buf.byteLength。
 * @ja buf_size - 末尾 NUL を含む書き込み容量です。buf.byteLength を超えないでください。
 * @ko buf_size - 마지막 NUL을 포함한 쓰기 가능 바이트 용량이며 buf.byteLength를 초과하면 안 됩니다.
 *
 * @param flags - ImGuiInputTextFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputTextFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputTextFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputTextFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns Normally true when text changes; with
 * ImGuiInputTextFlags.EnterReturnsTrue, true reports Enter validation instead.
 * Inspect the buffer for the edited bytes.
 * @zh 通常文字变化时为 true；启用 ImGuiInputTextFlags.EnterReturnsTrue 时改为报告 Enter
 * 确认。编辑后的字节请查看缓冲区。
 * @ja 通常はテキスト変更時に true です。ImGuiInputTextFlags.EnterReturnsTrue では Enter
 * 確定を返します。編集結果はバッファーにあります。
 * @ko 보통 텍스트 변경 시 true입니다. ImGuiInputTextFlags.EnterReturnsTrue이면 Enter 확인을
 * 보고합니다. 편집된 바이트는 버퍼에서 확인합니다.
 */
export function InputTextWithHint(
  label: string | Uint8Array,
  hint: string | Uint8Array,
  buf: Uint8Array,
  buf_size: number,
  flags: number = 0,
): boolean {
  return native.InputTextWithHint(label, hint, buf, buf_size, flags);
}

/**
 * Display a single-line text field with a hint shown when the field is empty.
 *
 * @zh 显示单行文本输入框，内容为空时显示提示。
 * @ja 空欄のときにヒントを表示する単一行のテキスト入力欄を表示します。
 * @ko 비어 있을 때 힌트를 표시하는 한 줄 텍스트 입력란을 표시합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param hint - Placeholder text shown when the input buffer is empty.
 * @zh hint - 输入缓冲区为空时显示的提示文字。
 * @ja hint - 入力バッファーが空のときに表示するヒントです。
 * @ko hint - 입력 버퍼가 비어 있을 때 표시하는 안내 텍스트입니다.
 *
 * @param buf - Writable NUL-terminated UTF-8 Uint8Array; edits update its bytes
 * in place.
 * @zh buf - 可写且以 NUL 结尾的 UTF-8 Uint8Array，编辑会原地修改字节。
 * @ja buf - 書き込み可能な NUL 終端 UTF-8 の Uint8Array です。編集はバイトを直接更新します。
 * @ko buf - 쓰기 가능한 NUL 종료 UTF-8 Uint8Array입니다. 편집 시 바이트를 직접 갱신합니다.
 *
 * @param buf_size - Writable capacity in bytes including the final NUL; must
 * not exceed buf.byteLength.
 * @zh buf_size - 包含结尾 NUL 的可写字节容量，不得超过 buf.byteLength。
 * @ja buf_size - 末尾 NUL を含む書き込み容量です。buf.byteLength を超えないでください。
 * @ko buf_size - 마지막 NUL을 포함한 쓰기 가능 바이트 용량이며 buf.byteLength를 초과하면 안 됩니다.
 *
 * @param flags - ImGuiInputTextFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputTextFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputTextFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputTextFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @param callback - Leave null; hinted text fields have no JavaScript callback
 * adapter. Use InputTextEx() for single-line callbacks or
 * InputTextMultilineEx() for multiline callbacks; neither displays a hint.
 * @zh callback - 保持为 null；带提示的文本框没有 JavaScript 回调适配器。单行回调使用
 * InputTextEx()，多行回调使用 InputTextMultilineEx()；两者均不显示提示文字。
 * @ja callback - null のままにします。ヒント付き入力には JavaScript コールバック用アダプターがありません。
 * 単一行は InputTextEx()、複数行は InputTextMultilineEx() を使います。どちらもヒントは表示しません。
 * @ko callback - null로 둡니다. 힌트 입력란에는 JavaScript 콜백 어댑터가 없습니다.
 * 한 줄 콜백은 InputTextEx(), 여러 줄 콜백은 InputTextMultilineEx()를 사용하며 둘 다 힌트는 표시하지
 * 않습니다.
 *
 * @param user_data - Opaque callback user-data address; unused when the
 * callback is null.
 * @zh user_data - 不透明的回调用户数据地址；回调为 null 时不使用。
 * @ja user_data - コールバック用の不透明なユーザーデータアドレスです。コールバックが null なら使いません。
 * @ko user_data - 콜백 사용자 데이터 주소입니다. 콜백이 null이면 사용하지 않습니다.
 *
 * @returns Normally true when text changes; with
 * ImGuiInputTextFlags.EnterReturnsTrue, true reports Enter validation instead.
 * Inspect the buffer for the edited bytes.
 * @zh 通常文字变化时为 true；启用 ImGuiInputTextFlags.EnterReturnsTrue 时改为报告 Enter
 * 确认。编辑后的字节请查看缓冲区。
 * @ja 通常はテキスト変更時に true です。ImGuiInputTextFlags.EnterReturnsTrue では Enter
 * 確定を返します。編集結果はバッファーにあります。
 * @ko 보통 텍스트 변경 시 true입니다. ImGuiInputTextFlags.EnterReturnsTrue이면 Enter 확인을
 * 보고합니다. 편집된 바이트는 버퍼에서 확인합니다.
 */
export function InputTextWithHintEx(
  label: string | Uint8Array,
  hint: string | Uint8Array,
  buf: Uint8Array,
  buf_size: number,
  flags: number = 0,
  callback: null = null,
  user_data: bigint | null = null,
): boolean {
  return native.InputTextWithHintEx(
    label,
    hint,
    buf,
    buf_size,
    flags,
    callback,
    user_data,
  );
}

/**
 * Edit a floating-point value in a numeric text field.
 *
 * @zh 在数字文本框中编辑浮点值。
 * @ja 数値入力欄で浮動小数点値を編集します。
 * @ko 숫자 입력란에서 부동소수점 값을 편집합니다.
 *
 * @remarks
 * Implied step = 0.0, step_fast = 0.0, format = "%.3f", flags = 0
 * @zh
 * 隐含参数：step = 0.0, step_fast = 0.0, format = "%.3f", flags = 0。
 * @ja
 * 暗黙の引数：step = 0.0, step_fast = 0.0, format = "%.3f", flags = 0。
 * @ko
 * 암묵적 인수: step = 0.0, step_fast = 0.0, format = "%.3f", flags = 0.
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
export function InputFloat(
  label: string | Uint8Array,
  v: Float32Array,
): boolean {
  return native.InputFloat(label, v);
}

/**
 * Edit a floating-point value in a numeric text field.
 *
 * @zh 在数字文本框中编辑浮点值。
 * @ja 数値入力欄で浮動小数点値を編集します。
 * @ko 숫자 입력란에서 부동소수점 값을 편집합니다.
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
 * @param step - Normal increment for the input step buttons; 0 disables those
 * buttons.
 * @zh step - 输入步进按钮的普通增量；0 禁用这些按钮。
 * @ja step - 入力の増減ボタンで使う通常の増分です。0 はボタンを無効にします。
 * @ko step - 입력 증감 버튼의 기본 증분입니다. 0은 버튼을 비활성화합니다.
 *
 * @param step_fast - Step used while Ctrl is held; 0 disables the fast step.
 * @zh step_fast - 按住 Ctrl 时使用的步长；0 禁用快速步进。
 * @ja step_fast - Ctrl を押しているときの増分です。0 は高速増分を無効にします。
 * @ko step_fast - Ctrl을 누를 때의 증분입니다. 0은 빠른 증분을 비활성화합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiInputTextFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputTextFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputTextFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputTextFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputFloatEx(
  label: string | Uint8Array,
  v: Float32Array,
  step: number = 0.0,
  step_fast: number = 0.0,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.InputFloatEx(label, v, step, step_fast, format, flags);
}

/**
 * Edit 2 floating-point components in numeric text fields.
 *
 * @zh 在数字文本框中编辑 2 个浮点分量。
 * @ja 数値入力欄で 2 個の浮動小数点成分を編集します。
 * @ko 숫자 입력란에서 부동소수점 성분 2개를 편집합니다.
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
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputFloat2(
  label: string | Uint8Array,
  v: Float32Array,
): boolean {
  return native.InputFloat2(label, v);
}

/**
 * Edit 2 floating-point components in numeric text fields.
 *
 * @zh 在数字文本框中编辑 2 个浮点分量。
 * @ja 数値入力欄で 2 個の浮動小数点成分を編集します。
 * @ko 숫자 입력란에서 부동소수점 성분 2개를 편집합니다.
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
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiInputTextFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputTextFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputTextFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputTextFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputFloat2Ex(
  label: string | Uint8Array,
  v: Float32Array,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.InputFloat2Ex(label, v, format, flags);
}

/**
 * Edit 3 floating-point components in numeric text fields.
 *
 * @zh 在数字文本框中编辑 3 个浮点分量。
 * @ja 数値入力欄で 3 個の浮動小数点成分を編集します。
 * @ko 숫자 입력란에서 부동소수점 성분 3개를 편집합니다.
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
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputFloat3(
  label: string | Uint8Array,
  v: Float32Array,
): boolean {
  return native.InputFloat3(label, v);
}

/**
 * Edit 3 floating-point components in numeric text fields.
 *
 * @zh 在数字文本框中编辑 3 个浮点分量。
 * @ja 数値入力欄で 3 個の浮動小数点成分を編集します。
 * @ko 숫자 입력란에서 부동소수점 성분 3개를 편집합니다.
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
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiInputTextFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputTextFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputTextFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputTextFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputFloat3Ex(
  label: string | Uint8Array,
  v: Float32Array,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.InputFloat3Ex(label, v, format, flags);
}

/**
 * Edit 4 floating-point components in numeric text fields.
 *
 * @zh 在数字文本框中编辑 4 个浮点分量。
 * @ja 数値入力欄で 4 個の浮動小数点成分を編集します。
 * @ko 숫자 입력란에서 부동소수점 성분 4개를 편집합니다.
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
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputFloat4(
  label: string | Uint8Array,
  v: Float32Array,
): boolean {
  return native.InputFloat4(label, v);
}

/**
 * Edit 4 floating-point components in numeric text fields.
 *
 * @zh 在数字文本框中编辑 4 个浮点分量。
 * @ja 数値入力欄で 4 個の浮動小数点成分を編集します。
 * @ko 숫자 입력란에서 부동소수점 성분 4개를 편집합니다.
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
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiInputTextFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputTextFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputTextFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputTextFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputFloat4Ex(
  label: string | Uint8Array,
  v: Float32Array,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.InputFloat4Ex(label, v, format, flags);
}

/**
 * Edit an integer value in a numeric text field.
 *
 * @zh 在数字文本框中编辑整数值。
 * @ja 数値入力欄で整数値を編集します。
 * @ko 숫자 입력란에서 정수 값을 편집합니다.
 *
 * @remarks
 * Implied step = 1, step_fast = 100, flags = 0
 * @zh
 * 隐含参数：step = 1, step_fast = 100, flags = 0。
 * @ja
 * 暗黙の引数：step = 1, step_fast = 100, flags = 0。
 * @ko
 * 암묵적 인수: step = 1, step_fast = 100, flags = 0.
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
export function InputInt(label: string | Uint8Array, v: Int32Array): boolean {
  return native.InputInt(label, v);
}

/**
 * Edit an integer value in a numeric text field.
 *
 * @zh 在数字文本框中编辑整数值。
 * @ja 数値入力欄で整数値を編集します。
 * @ko 숫자 입력란에서 정수 값을 편집합니다.
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
 * @param step - Normal increment for the input step buttons; 0 disables those
 * buttons.
 * @zh step - 输入步进按钮的普通增量；0 禁用这些按钮。
 * @ja step - 入力の増減ボタンで使う通常の増分です。0 はボタンを無効にします。
 * @ko step - 입력 증감 버튼의 기본 증분입니다. 0은 버튼을 비활성화합니다.
 *
 * @param step_fast - Step used while Ctrl is held; 0 disables the fast step.
 * @zh step_fast - 按住 Ctrl 时使用的步长；0 禁用快速步进。
 * @ja step_fast - Ctrl を押しているときの増分です。0 は高速増分を無効にします。
 * @ko step_fast - Ctrl을 누를 때의 증분입니다. 0은 빠른 증분을 비활성화합니다.
 *
 * @param flags - ImGuiInputTextFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputTextFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputTextFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputTextFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputIntEx(
  label: string | Uint8Array,
  v: Int32Array,
  step: number = 1,
  step_fast: number = 100,
  flags: number = 0,
): boolean {
  return native.InputIntEx(label, v, step, step_fast, flags);
}

/**
 * Edit 2 integer components in numeric text fields.
 *
 * @zh 在数字文本框中编辑 2 个整数分量。
 * @ja 数値入力欄で 2 個の整数成分を編集します。
 * @ko 숫자 입력란에서 정수 성분 2개를 편집합니다.
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
 * @param flags - ImGuiInputTextFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputTextFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputTextFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputTextFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputInt2(
  label: string | Uint8Array,
  v: Int32Array,
  flags: number = 0,
): boolean {
  return native.InputInt2(label, v, flags);
}

/**
 * Edit 3 integer components in numeric text fields.
 *
 * @zh 在数字文本框中编辑 3 个整数分量。
 * @ja 数値入力欄で 3 個の整数成分を編集します。
 * @ko 숫자 입력란에서 정수 성분 3개를 편집합니다.
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
 * @param flags - ImGuiInputTextFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputTextFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputTextFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputTextFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputInt3(
  label: string | Uint8Array,
  v: Int32Array,
  flags: number = 0,
): boolean {
  return native.InputInt3(label, v, flags);
}

/**
 * Edit 4 integer components in numeric text fields.
 *
 * @zh 在数字文本框中编辑 4 个整数分量。
 * @ja 数値入力欄で 4 個の整数成分を編集します。
 * @ko 숫자 입력란에서 정수 성분 4개를 편집합니다.
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
 * @param flags - ImGuiInputTextFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputTextFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputTextFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputTextFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputInt4(
  label: string | Uint8Array,
  v: Int32Array,
  flags: number = 0,
): boolean {
  return native.InputInt4(label, v, flags);
}

/**
 * Edit a double-precision floating-point value in a numeric text field.
 *
 * @zh 在数字文本框中编辑双精度浮点值。
 * @ja 数値入力欄で倍精度浮動小数点値を編集します。
 * @ko 숫자 입력란에서 배정밀도 부동소수점 값을 편집합니다.
 *
 * @remarks
 * Implied step = 0.0, step_fast = 0.0, format = "%.6f", flags = 0
 * @zh
 * 隐含参数：step = 0.0, step_fast = 0.0, format = "%.6f", flags = 0。
 * @ja
 * 暗黙の引数：step = 0.0, step_fast = 0.0, format = "%.6f", flags = 0。
 * @ko
 * 암묵적 인수: step = 0.0, step_fast = 0.0, format = "%.6f", flags = 0.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget value in element [0]; edits are written back into
 * the supplied array. Pass Float64Array storage, not a JS scalar; native access
 * uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0]；编辑会回写所提供的数组。 请传入 Float64Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Float64Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Float64Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputDouble(
  label: string | Uint8Array,
  v: Float64Array,
): boolean {
  return native.InputDouble(label, v);
}

/**
 * Edit a double-precision floating-point value in a numeric text field.
 *
 * @zh 在数字文本框中编辑双精度浮点值。
 * @ja 数値入力欄で倍精度浮動小数点値を編集します。
 * @ko 숫자 입력란에서 배정밀도 부동소수점 값을 편집합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param v - Mutable widget value in element [0]; edits are written back into
 * the supplied array. Pass Float64Array storage, not a JS scalar; native access
 * uses the supplied backing memory.
 * @zh v - 可变控件值，存于[0]；编辑会回写所提供的数组。 请传入 Float64Array 存储而非 JS
 * 标量；原生代码直接访问所提供的底层内存。
 * @ja v - 要素 [0] のウィジェット値です。編集結果は渡した配列に書き戻します。 JS スカラーではなく Float64Array
 * を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko v - 요소 [0]의 변경 가능한 위젯 값입니다. 편집 결과를 전달한 배열에 씁니다. JS 스칼라가 아닌 Float64Array
 * 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param step - Normal increment for the input step buttons; 0 disables those
 * buttons.
 * @zh step - 输入步进按钮的普通增量；0 禁用这些按钮。
 * @ja step - 入力の増減ボタンで使う通常の増分です。0 はボタンを無効にします。
 * @ko step - 입력 증감 버튼의 기본 증분입니다. 0은 버튼을 비활성화합니다.
 *
 * @param step_fast - Step used while Ctrl is held; 0 disables the fast step.
 * @zh step_fast - 按住 Ctrl 时使用的步长；0 禁用快速步进。
 * @ja step_fast - Ctrl を押しているときの増分です。0 は高速増分を無効にします。
 * @ko step_fast - Ctrl을 누를 때의 증분입니다. 0은 빠른 증분을 비활성화합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiInputTextFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputTextFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputTextFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputTextFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputDoubleEx(
  label: string | Uint8Array,
  v: Float64Array,
  step: number = 0.0,
  step_fast: number = 0.0,
  format: string | Uint8Array,
  flags: number = 0,
): boolean {
  return native.InputDoubleEx(label, v, step, step_fast, format, flags);
}

/**
 * Edit one numeric value of a selected data type in a text field.
 *
 * @zh 在文本框中编辑指定数据类型的单个数值。
 * @ja 入力欄で指定したデータ型の単一の数値を編集します。
 * @ko 입력란에서 지정한 데이터 형식의 단일 숫자 값을 편집합니다.
 *
 * @remarks
 * Implied p_step = null, p_step_fast = null, format = null, flags = 0
 * @zh
 * 隐含参数：p_step = null, p_step_fast = null, format = null, flags = 0。
 * @ja
 * 暗黙の引数：p_step = null, p_step_fast = null, format = null, flags = 0。
 * @ko
 * 암묵적 인수: p_step = null, p_step_fast = null, format = null, flags = 0.
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
export function InputScalar(
  label: string | Uint8Array,
  data_type: number,
  p_data: bigint,
): boolean {
  return native.InputScalar(label, data_type, p_data);
}

/**
 * Edit one numeric value of a selected data type in a text field.
 *
 * @zh 在文本框中编辑指定数据类型的单个数值。
 * @ja 入力欄で指定したデータ型の単一の数値を編集します。
 * @ko 입력란에서 지정한 데이터 형식의 단일 숫자 값을 편집합니다.
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
 * @param p_step - Address of the normal/fast increment in data_type layout;
 * null disables that step.
 * @zh p_step - 以 data_type 布局存储的普通或快速增量地址；null 禁用该步进。
 * @ja p_step - data_type 形式の通常または高速増分のアドレスです。null はその増分を無効にします。
 * @ko p_step - data_type 형식의 기본 또는 빠른 증분 주소입니다. null은 해당 증분을 비활성화합니다.
 *
 * @param p_step_fast - Address of the normal/fast increment in data_type
 * layout; null disables that step.
 * @zh p_step_fast - 以 data_type 布局存储的普通或快速增量地址；null 禁用该步进。
 * @ja p_step_fast - data_type 形式の通常または高速増分のアドレスです。null はその増分を無効にします。
 * @ko p_step_fast - data_type 형식의 기본 또는 빠른 증분 주소입니다. null은 해당 증분을 비활성화합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiInputTextFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputTextFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputTextFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputTextFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputScalarEx(
  label: string | Uint8Array,
  data_type: number,
  p_data: bigint,
  p_step: bigint | null = null,
  p_step_fast: bigint | null = null,
  format: string | Uint8Array | null = null,
  flags: number = 0,
): boolean {
  return native.InputScalarEx(
    label,
    data_type,
    p_data,
    p_step,
    p_step_fast,
    format,
    flags,
  );
}

/**
 * Edit multiple numeric components of a selected data type in text fields.
 *
 * @zh 在文本框中编辑指定数据类型的多个数值分量。
 * @ja 入力欄で指定したデータ型の複数の数値成分を編集します。
 * @ko 입력란에서 지정한 데이터 형식의 여러 숫자 성분을 편집합니다.
 *
 * @remarks
 * Implied p_step = null, p_step_fast = null, format = null, flags = 0
 * @zh
 * 隐含参数：p_step = null, p_step_fast = null, format = null, flags = 0。
 * @ja
 * 暗黙の引数：p_step = null, p_step_fast = null, format = null, flags = 0。
 * @ko
 * 암묵적 인수: p_step = null, p_step_fast = null, format = null, flags = 0.
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
export function InputScalarN(
  label: string | Uint8Array,
  data_type: number,
  p_data: bigint,
  components: number,
): boolean {
  return native.InputScalarN(label, data_type, p_data, components);
}

/**
 * Edit multiple numeric components of a selected data type in text fields.
 *
 * @zh 在文本框中编辑指定数据类型的多个数值分量。
 * @ja 入力欄で指定したデータ型の複数の数値成分を編集します。
 * @ko 입력란에서 지정한 데이터 형식의 여러 숫자 성분을 편집합니다.
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
 * @param p_step - Address of the normal/fast increment in data_type layout;
 * null disables that step.
 * @zh p_step - 以 data_type 布局存储的普通或快速增量地址；null 禁用该步进。
 * @ja p_step - data_type 形式の通常または高速増分のアドレスです。null はその増分を無効にします。
 * @ko p_step - data_type 형식의 기본 또는 빠른 증분 주소입니다. null은 해당 증분을 비활성화합니다.
 *
 * @param p_step_fast - Address of the normal/fast increment in data_type
 * layout; null disables that step.
 * @zh p_step_fast - 以 data_type 布局存储的普通或快速增量地址；null 禁用该步进。
 * @ja p_step_fast - data_type 形式の通常または高速増分のアドレスです。null はその増分を無効にします。
 * @ko p_step_fast - data_type 형식의 기본 또는 빠른 증분 주소입니다. null은 해당 증분을 비활성화합니다.
 *
 * @param format - Native printf-style numeric display format; match it to the
 * value type. Null selects the native default where supported.
 * @zh format - 原生 printf 风格数值显示格式，须与数值类型匹配；支持时 null 选择原生默认格式。
 * @ja format - 値の型に合うネイティブ printf 形式の表示書式です。対応する場合は null で既定書式を使います。
 * @ko format - 값 형식에 맞는 네이티브 printf 숫자 표시 형식입니다. 지원되는 경우 null은 기본 형식을 선택합니다.
 *
 * @param flags - ImGuiInputTextFlags options controlling this operation;
 * combine compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputTextFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputTextFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputTextFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function InputScalarNEx(
  label: string | Uint8Array,
  data_type: number,
  p_data: bigint,
  components: number,
  p_step: bigint | null = null,
  p_step_fast: bigint | null = null,
  format: string | Uint8Array | null = null,
  flags: number = 0,
): boolean {
  return native.InputScalarNEx(
    label,
    data_type,
    p_data,
    components,
    p_step,
    p_step_fast,
    format,
    flags,
  );
}
