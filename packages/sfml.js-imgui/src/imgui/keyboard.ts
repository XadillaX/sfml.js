import { native } from '../internal/native';

/**
 * Test whether a key is held down.
 *
 * @zh 判断按键是否处于按下状态。
 * @ja キーが押されているかを調べます。
 * @ko 키가 눌려 있는지 확인합니다.
 *
 * @remarks
 * - the ImGuiKey enum contains all possible keyboard, mouse and gamepad inputs
 *   (e.g. ImGuiKey.A, ImGuiKey.MouseLeft, ImGuiKey.GamepadDpadUp...).
 *
 * - (legacy: before v1.87, we used ImGuiKey to carry native/user indices as
 *   defined by each backends. This was obsoleted in 1.87 (2022-02) and
 *   completely removed in 1.91.5 (2024-11). See
 *   https://github.com/ocornut/imgui/issues/4921)
 * - (legacy: any use of ImGuiKey will assert when key < 512 to detect passing
 *   legacy native/user indices)
 *
 * is key being held.
 * @zh
 * 输入工具：键盘/鼠标/手柄。
 *
 * - ImGuiKey 枚举包含所有可能的键盘、鼠标和手柄输入（例如
 *   ImGuiKey.A、ImGuiKey.MouseLeft、ImGuiKey.GamepadDpadUp 等）。
 *
 * - 旧版：v1.87 之前使用 ImGuiKey 携带各后端定义的原生/用户索引，此机制在 1.87（2022-02）废弃，于
 *   1.91.5（2024-11）完全移除。见 https://github.com/ocornut/imgui/issues/4921 。
 *
 * - 旧版：任何 ImGuiKey 用法在 key < 512 时都会触发断言，以检测传入旧式原生/用户索引的情况。按键是否正被按住。
 * @ja
 * 入力ユーティリティ：キーボード/マウス/ゲームパッド。
 *
 * - ImGuiKey
 *   列挙には利用可能なすべてのキーボード、マウス、ゲームパッド入力が含まれます（ImGuiKey.A、ImGuiKey.MouseLeft、
 *   ImGuiKey.GamepadDpadUp など）。
 *
 * - 旧仕様：v1.87 より前は各バックエンドのネイティブ/ユーザーインデックスを ImGuiKey
 *   に格納していました。1.87（2022-02）で廃止予定となり、1.91.5（2024-11）で完全に削除されました。https://
 *   github.com/ocornut/imgui/issues/4921 参照。
 *
 * - 旧仕様：古いネイティブ/ユーザーインデックスの受け渡しを検出するため、ImGuiKey を使うとき key < 512
 *   ならアサートします。キーが押され続けているかを調べます。
 * @ko
 * 입력 유틸리티: 키보드/마우스/게임패드.
 *
 * - ImGuiKey 열거형에는 가능한 모든 키보드, 마우스 및 게임패드 입력이 포함됩니다(예: ImGuiKey.A,
 *   ImGuiKey.MouseLeft, ImGuiKey.GamepadDpadUp 등).
 *
 * - 레거시: v1.87 이전에는 ImGuiKey에 각 백엔드가 정의한 네이티브/사용자 인덱스를 담았습니다. 이 방식은
 *   1.87(2022-02)에서 폐기 예정이 되었고 1.91.5(2024-11)에서 완전히 제거되었습니다.
 *   https://github.com/ocornut/imgui/issues/4921 참조.
 *
 * - 레거시: 이전 네이티브/사용자 인덱스 전달을 감지하기 위해 ImGuiKey를 사용할 때 key < 512이면 단언이 발생합니다. 키를
 *   누르고 있는지 검사합니다.
 *
 * @param key - ImGuiKey logical key identifier, not a platform-native key code.
 * @zh key - ImGuiKey 逻辑按键标识符，不是平台原生键码。
 * @ja key - ImGuiKey の論理キー識別子です。プラットフォーム固有のキーコードではありません。
 * @ko key - ImGuiKey 논리 키 식별자이며 플랫폼 네이티브 키 코드가 아닙니다.
 *
 * @returns True if the key is currently held down; false otherwise.
 * @zh 按键当前被按住时为 true，否则为 false。
 * @ja キーが現在押されている場合は true、それ以外は false です。
 * @ko 키를 현재 누르고 있으면 true이며 아니면 false입니다.
 */
export function IsKeyDown(key: number): boolean {
  return native.IsKeyDown(key);
}

/**
 * Test whether a key was newly pressed or generated a repeat event this frame.
 *
 * @zh 检查按键是否在本帧刚被按下或产生了重复事件。
 * @ja このフレームでキーが新たに押されたか、リピートイベントが発生したかを調べます。
 * @ko 이번 프레임에 키가 새로 눌렸거나 반복 이벤트가 발생했는지 확인합니다.
 *
 * @remarks
 * was key pressed (went from !Down to Down)?
 *
 * if repeat=true, uses io.KeyRepeatDelay / KeyRepeatRate
 *
 * Implied repeat = true
 * @zh
 * 按键是否被按下（从 !Down 变为 Down）？
 *
 * 若 repeat=true，使用 io.KeyRepeatDelay / KeyRepeatRate。
 *
 * 隐含参数：repeat = true。
 * @ja
 * キーが押されましたか（!Down から Down に変化）？
 *
 * repeat=true の場合は io.KeyRepeatDelay / KeyRepeatRate を使用します。
 *
 * 暗黙の引数：repeat = true。
 * @ko
 * 키가 눌렸습니까(!Down에서 Down으로 변경)?
 *
 * repeat=true이면 io.KeyRepeatDelay / KeyRepeatRate를 사용합니다.
 *
 * 암묵적 인수: repeat = true.
 *
 * @param key - ImGuiKey logical key identifier, not a platform-native key code.
 * @zh key - ImGuiKey 逻辑按键标识符，不是平台原生键码。
 * @ja key - ImGuiKey の論理キー識別子です。プラットフォーム固有のキーコードではありません。
 * @ko key - ImGuiKey 논리 키 식별자이며 플랫폼 네이티브 키 코드가 아닙니다.
 *
 * @returns True if the key was pressed this frame, including held-key repeats
 * when enabled; false otherwise.
 * @zh 本帧按键被按下，启用重复时包含持续按住产生的重复时为 true，否则为 false。
 * @ja このフレームでキーを押した（有効ならリピートも含む）場合は true、それ以外は false です。
 * @ko 이번 프레임에 키를 눌렀으면(활성화된 경우 반복 포함) true이며 아니면 false입니다.
 */
export function IsKeyPressed(key: number): boolean {
  return native.IsKeyPressed(key);
}

/**
 * Test whether a key was pressed.
 *
 * @zh 判断按键是否被按下。
 * @ja キーが押されたかを調べます。
 * @ko 키를 눌렀는지 확인합니다.
 *
 * @remarks
 * was key pressed (went from !Down to Down)?
 *
 * if repeat=true, uses io.KeyRepeatDelay / KeyRepeatRate
 * @zh
 * 按键是否被按下（从 !Down 变为 Down）？
 *
 * 若 repeat=true，使用 io.KeyRepeatDelay / KeyRepeatRate。
 * @ja
 * キーが押されましたか（!Down から Down に変化）？
 *
 * repeat=true の場合は io.KeyRepeatDelay / KeyRepeatRate を使用します。
 * @ko
 * 키가 눌렸습니까(!Down에서 Down으로 변경)?
 *
 * repeat=true이면 io.KeyRepeatDelay / KeyRepeatRate를 사용합니다.
 *
 * @param key - ImGuiKey logical key identifier, not a platform-native key code.
 * @zh key - ImGuiKey 逻辑按键标识符，不是平台原生键码。
 * @ja key - ImGuiKey の論理キー識別子です。プラットフォーム固有のキーコードではありません。
 * @ko key - ImGuiKey 논리 키 식별자이며 플랫폼 네이티브 키 코드가 아닙니다.
 *
 * @param repeat - Whether holding the key or button generates repeated
 * activations using ImGui repeat timing.
 * @zh repeat - 是否按照 ImGui 重复时序，在按住按键或按钮时产生重复激活。
 * @ja repeat - キーやボタンを押し続けたとき ImGui のリピート設定で繰り返し反応するかどうかです。
 * @ko repeat - 키나 버튼을 누르고 있을 때 ImGui 반복 시간 설정으로 반복 활성화할지 여부입니다.
 *
 * @returns True if the key was pressed this frame, including held-key repeats
 * when enabled; false otherwise.
 * @zh 本帧按键被按下，启用重复时包含持续按住产生的重复时为 true，否则为 false。
 * @ja このフレームでキーを押した（有効ならリピートも含む）場合は true、それ以外は false です。
 * @ko 이번 프레임에 키를 눌렀으면(활성화된 경우 반복 포함) true이며 아니면 false입니다.
 */
export function IsKeyPressedEx(key: number, repeat: boolean = true): boolean {
  return native.IsKeyPressedEx(key, repeat);
}

/**
 * Test whether a key was released.
 *
 * @zh 判断按键是否被释放。
 * @ja キーが離されたかを調べます。
 * @ko 키를 놓았는지 확인합니다.
 *
 * @remarks
 * was key released (went from Down to !Down)?
 * @zh
 * 按键是否被松开（从 Down 变为 !Down）？
 * @ja
 * キーが離されましたか（Down から !Down に変化）？
 * @ko
 * 키를 놓았습니까(Down에서 !Down으로 변경)?
 *
 * @param key - ImGuiKey logical key identifier, not a platform-native key code.
 * @zh key - ImGuiKey 逻辑按键标识符，不是平台原生键码。
 * @ja key - ImGuiKey の論理キー識別子です。プラットフォーム固有のキーコードではありません。
 * @ko key - ImGuiKey 논리 키 식별자이며 플랫폼 네이티브 키 코드가 아닙니다.
 *
 * @returns True if the key transitioned from down to up this frame; false
 * otherwise.
 * @zh 本帧按键由按下变为释放时为 true，否则为 false。
 * @ja キーがこのフレームで押下から解放に変わった場合は true、それ以外は false です。
 * @ko 이번 프레임에 키가 눌림에서 해제로 바뀌면 true이며 아니면 false입니다.
 */
export function IsKeyReleased(key: number): boolean {
  return native.IsKeyReleased(key);
}

/**
 * Test whether a key chord was pressed.
 *
 * @zh 判断组合键是否被按下。
 * @ja キーと修飾キーの組み合わせが押されたかを調べます。
 * @ko 키 조합을 눌렀는지 확인합니다.
 *
 * @remarks
 * was key chord (mods + key) pressed, e.g. you can pass 'ImGuiKey.ModCtrl |
 * ImGuiKey.S' as a key-chord.
 *
 * This doesn't do any routing or focus check, please consider using Shortcut()
 * function instead.
 * @zh
 * 组合键（修饰键 + 按键）是否被按下？
 *
 * 例如可传入 'ImGuiKey.ModCtrl | ImGuiKey.S'。
 *
 * 此函数不进行路由或焦点检查，请考虑改用 Shortcut()。
 * @ja
 * キーの組み合わせ（修飾キー + キー）が押されましたか？
 *
 * 例えば 'ImGuiKey.ModCtrl | ImGuiKey.S' を渡せます。
 *
 * ルーティングもフォーカス確認も行わないので、代わりに Shortcut() の使用を検討してください。
 * @ko
 * 키 조합(수정 키 + 키)이 눌렸습니까?
 *
 * 예를 들어 'ImGuiKey.ModCtrl | ImGuiKey.S'를 전달할 수 있습니다.
 *
 * 라우팅이나 포커스 검사는 하지 않으므로 Shortcut() 사용을 고려하세요.
 *
 * @param key_chord - ImGuiKeyChord combining an ImGuiKey with ImGuiMod modifier
 * bits.
 * @zh key_chord - 由 ImGuiKey 和 ImGuiMod 修饰位组合成的 ImGuiKeyChord。
 * @ja key_chord - ImGuiKey と ImGuiMod の修飾ビットを組み合わせた ImGuiKeyChord です。
 * @ko key_chord - ImGuiKey와 ImGuiMod 보조 비트를 결합한 ImGuiKeyChord입니다.
 *
 * @returns True if the key chord was pressed this frame with the specified
 * modifiers; false otherwise.
 * @zh 本帧带指定修饰键的组合键被按下时为 true，否则为 false。
 * @ja このフレームで指定修飾キー付きのキーコードが押された場合は true、それ以外は false です。
 * @ko 이번 프레임에 지정 보조 키와 함께 키 조합을 눌렀으면 true이며 아니면 false입니다.
 */
export function IsKeyChordPressed(key_chord: number): boolean {
  return native.IsKeyChordPressed(key_chord);
}

/**
 * Count key presses using the supplied repeat delay and rate.
 *
 * @zh 根据指定重复延迟和频率计算按键次数。
 * @ja 指定したリピート遅延と間隔でキー入力回数を数えます。
 * @ko 지정한 반복 지연과 간격으로 키 입력 횟수를 계산합니다.
 *
 * @remarks
 * uses provided repeat rate/delay.
 *
 * return a count, most often 0 or 1 but might be >1 if RepeatRate is small
 * enough that DeltaTime > RepeatRate
 * @zh
 * 使用给定的重复速率/延迟。
 *
 * 返回次数，通常为 0 或 1；但若 RepeatRate 足够小而使 DeltaTime > RepeatRate，则可能 >1。
 * @ja
 * 指定したリピート間隔/遅延を使用します。
 *
 * 回数を返し、通常は 0 または 1 ですが、RepeatRate が十分小さく DeltaTime > RepeatRate なら >1
 * になることがあります。
 * @ko
 * 지정한 반복 주기/지연을 사용합니다.
 *
 * 횟수를 반환하며 대개 0 또는 1이지만 RepeatRate가 충분히 작아 DeltaTime > RepeatRate이면 >1일 수 있습니다.
 *
 * @param key - ImGuiKey logical key identifier, not a platform-native key code.
 * @zh key - ImGuiKey 逻辑按键标识符，不是平台原生键码。
 * @ja key - ImGuiKey の論理キー識別子です。プラットフォーム固有のキーコードではありません。
 * @ko key - ImGuiKey 논리 키 식별자이며 플랫폼 네이티브 키 코드가 아닙니다.
 *
 * @param repeat_delay - Delay in seconds before held-key repeats begin.
 * @zh repeat_delay - 按住按键后开始重复前的延迟秒数。
 * @ja repeat_delay - キーを押してからリピート開始までの秒数です。
 * @ko repeat_delay - 키를 누른 후 반복 시작 전 지연 시간(초)입니다.
 *
 * @param rate - Interval in seconds between held-key repeats.
 * @zh rate - 按住按键时两次重复之间的秒数。
 * @ja rate - キーリピート間の秒数です。
 * @ko rate - 키 반복 사이의 시간 간격(초)입니다.
 *
 * @returns Number of initial/repeated key presses in the current frame using
 * the requested repeat timing; can exceed 1 for long frames.
 * @zh 按指定重复时序计算的本帧首次及重复按键次数；长帧可能大于 1。
 * @ja 指定リピート間隔による現在フレームの押下回数です。長いフレームでは 1 を超える場合があります。
 * @ko 지정 반복 시간으로 계산한 현재 프레임의 최초 및 반복 누름 수입니다. 긴 프레임에서는 1보다 클 수 있습니다.
 */
export function GetKeyPressedAmount(
  key: number,
  repeat_delay: number,
  rate: number,
): number {
  return native.GetKeyPressedAmount(key, repeat_delay, rate);
}

/**
 * Returns English name of the key.
 *
 * @zh [调试] 返回按键的英文名称。
 * @ja [デバッグ] キーの英語名を返します。
 * @ko [디버그] 키의 영어 이름을 반환합니다.
 *
 * @remarks
 * Those names are provided for debugging purpose and are not meant to be saved
 * persistently nor compared.
 * @zh
 * 名称仅供调试，不应用于持久保存或比较。
 * @ja
 * これらの名前はデバッグ用であり、永続的な保存や比較には使わないでください。
 * @ko
 * 이 이름은 디버깅용이며 영구 저장하거나 비교하는 용도가 아닙니다.
 *
 * @param key - ImGuiKey logical key identifier, not a platform-native key code.
 * @zh key - ImGuiKey 逻辑按键标识符，不是平台原生键码。
 * @ja key - ImGuiKey の論理キー識別子です。プラットフォーム固有のキーコードではありません。
 * @ko key - ImGuiKey 논리 키 식별자이며 플랫폼 네이티브 키 코드가 아닙니다.
 *
 * @returns Debug/display name of the ImGuiKey, not text produced by keyboard
 * input.
 * @zh ImGuiKey 的调试或显示名称，不是键盘输入产生的文本。
 * @ja ImGuiKey のデバッグ・表示名です。キー入力から生成された文字ではありません。
 * @ko ImGuiKey의 디버그 또는 표시 이름이며 키보드 입력으로 생성된 텍스트가 아닙니다.
 */
export function GetKeyName(key: number): string | null {
  return native.GetKeyName(key);
}

/**
 * Override keyboard input capture for the next frame.
 *
 * @zh 覆盖下一帧的键盘输入捕获状态。
 * @ja 次のフレームのキーボード入力キャプチャを上書きします。
 * @ko 다음 프레임의 키보드 입력 캡처 상태를 재정의합니다.
 *
 * @remarks
 * Override io.WantCaptureKeyboard flag next frame (said flag is left for your
 * application to handle, typically when true it instructs your app to ignore
 * inputs).
 *
 * e.g. force capture keyboard when your widget is being hovered.
 *
 * This is equivalent to setting "io.WantCaptureKeyboard =
 * want_capture_keyboard"; after the next NewFrame() call.
 * @zh
 * 覆盖下一帧的 io.WantCaptureKeyboard 标志（此标志由应用处理，通常为 true 时指示应用忽略输入）。
 *
 * 例如控件悬停时强制捕获键盘。
 *
 * 这等同于在下一次 NewFrame() 调用之后设置 "io.WantCaptureKeyboard = want_capture_keyboard"。
 * @ja
 * 次のフレームの io.WantCaptureKeyboard フラグを上書きします（このフラグはアプリケーション側で処理し、通常 true
 * なら入力を無視させます）。
 *
 * 例えばウィジェットへのホバー中にキーボードを強制的にキャプチャします。
 *
 * 次の NewFrame() 呼び出し後に "io.WantCaptureKeyboard = want_capture_keyboard"
 * を設定するのと同等です。
 * @ko
 * 다음 프레임의 io.WantCaptureKeyboard 플래그를 재정의합니다(이 플래그는 응용 프로그램이 처리하며 보통 true이면 입력을
 * 무시하도록 지시).
 *
 * 예를 들어 위젯 위에 마우스가 있을 때 키보드 입력을 강제로 캡처합니다.
 *
 * 다음 NewFrame() 호출 후 "io.WantCaptureKeyboard = want_capture_keyboard"를 설정하는 것과
 * 같습니다.
 *
 * @param want_capture_keyboard - Override io.WantCaptureKeyboard on the next
 * frame; this does not itself consume OS events.
 * @zh want_capture_keyboard - 覆盖下一帧的 io.WantCaptureKeyboard 标志；本身不消费操作系统事件。
 * @ja want_capture_keyboard - 次フレームの io.WantCaptureKeyboard フラグを上書きします。OS
 * イベント自体は消費しません。
 * @ko want_capture_keyboard - 다음 프레임의 io.WantCaptureKeyboard 플래그를 재정의합니다. OS
 * 이벤트 자체를
 * 소비하지는 않습니다.
 */
export function SetNextFrameWantCaptureKeyboard(
  want_capture_keyboard: boolean,
): void {
  native.SetNextFrameWantCaptureKeyboard(want_capture_keyboard);
}

/**
 * Test and route a keyboard shortcut.
 *
 * @zh 检测并路由键盘快捷键。
 * @ja キーボードショートカットを判定し、ルーティングします。
 * @ko 키보드 단축키를 확인하고 라우팅합니다.
 *
 * @remarks
 * A key chord combines one `ImGuiKey` with optional `ImGuiKey.ModAlt`,
 * `ImGuiKey.ModCtrl`, `ImGuiKey.ModShift`, or `ImGuiKey.ModSuper` modifiers.
 * Never combine two `ImGuiKey` values.
 *
 * ```text
 * ImGuiKey.C                  // A key or chord
 * ImGuiKey.ModCtrl | ImGuiKey.C  // A chord
 * ```
 *
 * Several callers may request the same shortcut, but only one owner receives
 * it. Routing is independent of call order:
 *
 * - A focused parent that requests Ctrl+S receives it.
 * - A focused child that also requests Ctrl+S overrides its parent.
 * - A focused child that does not request Ctrl+S leaves it with its parent.
 *
 * `IsKeyChordPressed()` only compares modifiers and tests the key, without
 * routing side effects. `Shortcut()` registers a route and tests the chord when
 * that route is granted; it can prevent another caller from receiving the
 * shortcut.
 *
 * Inspect registered routes in Metrics/Debugger > Inputs. This routing API is
 * marked beta upstream.
 * @zh
 * 组合键由一个 `ImGuiKey` 和可选的 `ImGuiKey.ModAlt`
 * 、`ImGuiKey.ModCtrl`、`ImGuiKey.ModShift` 或
 * `ImGuiKey.ModSuper` 修饰键组成。不能组合两个 `ImGuiKey` 值。
 *
 * ```text
 * ImGuiKey.C                  // 按键或组合键
 * ImGuiKey.ModCtrl | ImGuiKey.C  // 组合键
 * ```
 *
 * 多个调用方可请求同一快捷键，但只有一个所有者会接收它。路由结果不依赖调用顺序：
 *
 * - 获得焦点的父级请求 Ctrl+S 时，由父级接收。
 * - 获得焦点的子级也请求 Ctrl+S 时，会覆盖父级。
 * - 获得焦点的子级不请求 Ctrl+S 时，仍由父级接收。
 *
 * `IsKeyChordPressed()` 只比较修饰键并检测按键，不产生路由副作用。`Shortcut()`
 * 注册路由，在获得路由后检测组合键；这可能阻止其他调用方收到该快捷键。
 *
 * 可在 Metrics/Debugger > Inputs 查看已注册路由。此路由 API 在上游标记为测试版。
 * @ja
 * キーコードの組み合わせは 1 つの `ImGuiKey` と任意の修飾キー
 * `ImGuiKey.ModAlt` 、`ImGuiKey.ModCtrl`、`ImGuiKey.ModShift`、`ImGuiKey.ModSuper`
 * で構成します。2 つの
 * `ImGuiKey` 値を組み合わせることはできません。
 *
 * ```text
 * ImGuiKey.C                  // キーまたは組み合わせ
 * ImGuiKey.ModCtrl | ImGuiKey.C  // キーの組み合わせ
 * ```
 *
 * 複数の呼び出し元が同じショートカットを要求できますが、受け取る所有者は 1 つだけです。ルーティングは呼び出し順に依存しません。
 *
 * - フォーカスされた親が Ctrl+S を要求すると、親が受け取ります。
 * - フォーカスされた子も Ctrl+S を要求すると、親より優先されます。
 * - フォーカスされた子が Ctrl+S を要求しなければ、親が受け取ります。
 *
 * `IsKeyChordPressed()` は修飾キーの比較とキーの判定だけを行い、ルーティングの副作用はありません。`Shortcut()`
 * は経路を登録し、経路を得たときにキーを判定します。その結果、別の呼び出し元への配信を防ぐ場合があります。
 *
 * 登録された経路は Metrics/Debugger > Inputs で確認できます。このルーティング API は上流でベータ版とされています。
 * @ko
 * 키 조합은 하나의 `ImGuiKey`에 선택적으로 `ImGuiKey.ModAlt`, `ImGuiKey.ModCtrl`,
 * `ImGuiKey.ModShift` , `ImGuiKey.ModSuper` 수정 키를 결합합니다. 두 `ImGuiKey` 값을 결합하면 안
 * 됩니다.
 *
 * ```text
 * ImGuiKey.C                  // 키 또는 키 조합
 * ImGuiKey.ModCtrl | ImGuiKey.C  // 키 조합
 * ```
 *
 * 여러 호출자가 같은 단축키를 요청할 수 있지만 한 소유자만 받습니다. 라우팅은 호출 순서와 무관합니다.
 *
 * - 포커스된 부모가 Ctrl+S를 요청하면 부모가 받습니다.
 * - 포커스된 자식도 Ctrl+S를 요청하면 부모보다 우선합니다.
 * - 포커스된 자식이 Ctrl+S를 요청하지 않으면 부모가 받습니다.
 *
 * `IsKeyChordPressed()`는 수정 키를 비교하고 키만 확인하므로 라우팅 부수 효과가 없습니다. `Shortcut()`은 경로를
 * 등록하고 경로를 받았을 때 키 조합을 확인하며, 다른 호출자가 해당 단축키를 받지 못하게 할 수 있습니다.
 *
 * 등록된 경로는 Metrics/Debugger > Inputs에서 확인할 수 있습니다. 이 라우팅 API는 상위 프로젝트에서 베타로
 * 표시됩니다.
 *
 * @param key_chord - ImGuiKeyChord combining an ImGuiKey with ImGuiMod modifier
 * bits.
 * @zh key_chord - 由 ImGuiKey 和 ImGuiMod 修饰位组合成的 ImGuiKeyChord。
 * @ja key_chord - ImGuiKey と ImGuiMod の修飾ビットを組み合わせた ImGuiKeyChord です。
 * @ko key_chord - ImGuiKey와 ImGuiMod 보조 비트를 결합한 ImGuiKeyChord입니다.
 *
 * @param flags - ImGuiInputFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 *
 * @returns True if the chord was pressed and this call won shortcut routing
 * under the supplied flags; false otherwise.
 * @zh 组合键被按下且此调用按指定标志赢得快捷键路由时为 true，否则为 false。
 * @ja キーコードが押され、この呼び出しが指定条件のショートカットルーティングを獲得した場合は true、それ以外は false です。
 * @ko 키 조합이 눌리고 이 호출이 지정 플래그의 단축키 라우팅을 얻으면 true이며 아니면 false입니다.
 */
export function Shortcut(key_chord: number, flags: number = 0): boolean {
  return native.Shortcut(key_chord, flags);
}

/**
 * Assign a routed keyboard shortcut to activate the next item.
 *
 * @zh 为下一个控件分配经过路由的键盘快捷键以激活它。
 * @ja 次の項目をアクティブにする、ルーティング対象のキーボードショートカットを割り当てます。
 * @ko 다음 항목을 활성화할 라우팅 대상 키보드 단축키를 지정합니다.
 *
 * @param key_chord - ImGuiKeyChord combining an ImGuiKey with ImGuiMod modifier
 * bits.
 * @zh key_chord - 由 ImGuiKey 和 ImGuiMod 修饰位组合成的 ImGuiKeyChord。
 * @ja key_chord - ImGuiKey と ImGuiMod の修飾ビットを組み合わせた ImGuiKeyChord です。
 * @ko key_chord - ImGuiKey와 ImGuiMod 보조 비트를 결합한 ImGuiKeyChord입니다.
 *
 * @param flags - ImGuiInputFlags options controlling this operation; combine
 * compatible flag bits with |.
 * @zh flags - 控制此操作的 ImGuiInputFlags 选项；可用 | 组合兼容的标志位。
 * @ja flags - この操作を制御する ImGuiInputFlags オプションです。互換性のあるフラグは | で組み合わせます。
 * @ko flags - 이 동작을 제어하는 ImGuiInputFlags 옵션입니다. 호환되는 비트는 |로 결합합니다.
 */
export function SetNextItemShortcut(
  key_chord: number,
  flags: number = 0,
): void {
  native.SetNextItemShortcut(key_chord, flags);
}

/**
 * Assign input ownership to the last item.
 *
 * @zh 将输入所有权分配给最后一个条目。
 * @ja 最後のアイテムに入力の所有権を割り当てます。
 * @ko 마지막 항목에 입력 소유권을 할당합니다.
 *
 * @remarks
 * - One common use case would be to allow your items to disable standard inputs
 *   behaviors such as Tab or Alt key handling, Mouse Wheel scrolling, etc. e.g.
 *   Button(...); SetItemKeyOwner(ImGuiKey.MouseWheelY); to make
 *   hovering/activating a button disable wheel for scrolling.
 *
 * - Reminder ImGuiKey enum include access to mouse buttons and gamepad, so key
 *   ownership can apply to them.
 *
 * - Many related features are still in imgui_internal.h. For instance, most
 *   IsKeyXXX()/IsMouseXXX() functions have an owner-id-aware version.
 *
 * Call SetItemKeyOwner(key) to assign the key to the last item when that item
 * is hovered or active. The lower-level native ownership API is not exported.
 * @zh
 * 输入工具：按键/输入所有权 [BETA]。
 *
 * - 常见用法是让项目禁用 Tab、Alt 键处理、鼠标滚轮滚动等标准输入行为。例如 Button(...);
 *   SetItemKeyOwner(ImGuiKey.MouseWheelY); 可在按钮悬停/激活时禁用滚轮滚动。
 *
 * - 注意 ImGuiKey 枚举也包含鼠标按钮和手柄，因此按键所有权同样适用于它们。
 *
 * - 许多相关功能仍位于 imgui_internal.h，例如大多数 IsKeyXXX()/IsMouseXXX() 函数有支持 owner-id
 *   的版本。调用 SetItemKeyOwner(key)，可在最后一个项目悬停或激活时将按键所有权分配给它。
 *   底层原生所有权 API 未导出。
 * @ja
 * 入力ユーティリティ：キー/入力の所有権 [BETA]。
 *
 * - よくある用途は、Tab や Alt キー処理、マウスホイールのスクロールなど標準の入力動作を項目から無効化することです。例えば
 *   Button(...); SetItemKeyOwner(ImGuiKey.MouseWheelY);
 *   で、ボタンへのホバー/アクティブ化中にホイールのスクロールを無効にします。
 *
 * - ImGuiKey 列挙にはマウスボタンとゲームパッドも含まれるため、それらにも所有権を適用できます。
 *
 * - 関連機能の多くはまだ imgui_internal.h にあります。例えばほとんどの IsKeyXXX()/IsMouseXXX() 関数には
 *   owner-id 対応版があります。SetItemKeyOwner(key) を呼ぶと、最後の項目がホバー中またはアクティブなときに
 *   その項目へキーの所有権を割り当てます。低レベルのネイティブ所有権 API は公開されていません。
 * @ko
 * 입력 유틸리티: 키/입력 소유권 [BETA].
 *
 * - 일반적인 용도는 항목이 Tab이나 Alt 키 처리, 마우스 휠 스크롤 같은 표준 입력 동작을 비활성화하도록 하는 것입니다. 예를 들어
 *   Button(...); SetItemKeyOwner(ImGuiKey.MouseWheelY); 는 버튼에 마우스를 올리거나 활성화하면 휠
 *   스크롤을 비활성화합니다.
 *
 * - ImGuiKey 열거형에는 마우스 버튼과 게임패드도 포함되므로 이들에도 키 소유권을 적용할 수 있습니다.
 *
 * - 많은 관련 기능은 아직 imgui_internal.h에 있습니다. 예를 들어 대부분의 IsKeyXXX()/IsMouseXXX()
 * 함수에는 owner-id 지원 버전이 있습니다. SetItemKeyOwner(key)를 호출하면 마지막 항목이 호버 또는 활성 상태일 때
 *   해당 항목에 키 소유권을 부여합니다. 저수준 네이티브 소유권 API는 내보내지 않습니다.
 *
 * @param key - ImGuiKey logical key identifier, not a platform-native key code.
 * @zh key - ImGuiKey 逻辑按键标识符，不是平台原生键码。
 * @ja key - ImGuiKey の論理キー識別子です。プラットフォーム固有のキーコードではありません。
 * @ko key - ImGuiKey 논리 키 식별자이며 플랫폼 네이티브 키 코드가 아닙니다.
 */
export function SetItemKeyOwner(key: number): void {
  native.SetItemKeyOwner(key);
}
