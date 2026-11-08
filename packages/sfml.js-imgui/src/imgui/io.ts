import { native } from '../internal/native';
import type { ImGuiIO } from '../types';

/**
 * Queue a key press or release event.
 *
 * @zh 将按键按下或释放事件加入队列。
 * @ja キーの押下または解放イベントをキューに追加します。
 * @ko 키 누름 또는 해제 이벤트를 큐에 추가합니다.
 *
 * @remarks
 * Queue a new key down/up event.
 *
 * Key should be "translated" (as in, generally ImGuiKey.A matches the key
 * end-user would use to emit an 'A' character)
 * @zh
 * 输入函数。
 *
 * 将新的按键按下/松开事件加入队列。
 *
 * 按键应经过“转换”（即通常 ImGuiKey.A 应对应最终用户用于输入 'A' 字符的按键）。
 * @ja
 * 入力関数。
 *
 * キーの押下/解放イベントをキューに追加します。
 *
 * キーは「変換」済みであるべきです（通常 ImGuiKey.A はエンドユーザーが 'A' を入力するために使うキーに対応します）。
 * @ko
 * 입력 함수.
 *
 * 새 키 누름/놓음 이벤트를 큐에 추가합니다.
 *
 * 키는 "변환"되어야 합니다(일반적으로 ImGuiKey.A는 최종 사용자가 'A' 문자를 입력하는 데 쓰는 키와 일치).
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 *
 * @param key - ImGuiKey logical key identifier, not a platform-native key code.
 * @zh key - ImGuiKey 逻辑按键标识符，不是平台原生键码。
 * @ja key - ImGuiKey の論理キー識別子です。プラットフォーム固有のキーコードではありません。
 * @ko key - ImGuiKey 논리 키 식별자이며 플랫폼 네이티브 키 코드가 아닙니다.
 *
 * @param down - Current pressed state: true for press/down, false for
 * release/up.
 * @zh down - 当前按下状态：true 为按下，false 为释放。
 * @ja down - 現在の押下状態です。true は押下、false は解放です。
 * @ko down - 현재 눌림 상태입니다. true는 누름, false는 해제입니다.
 */
export function IO_AddKeyEvent(
  self: ImGuiIO,
  key: number,
  down: boolean,
): void {
  native.IO_AddKeyEvent(self, key, down);
}

/**
 * Queue an analog key press or release event.
 *
 * @zh 将模拟按键按下或释放事件加入队列。
 * @ja アナログキーの押下または解放イベントをキューに追加します。
 * @ko 아날로그 키 누름 또는 해제 이벤트를 큐에 추가합니다.
 *
 * @remarks
 * Queue a key press or release event with an analog value, for example for
 * ImGuiKey.GamepadL2.
 *
 * Dead-zones should be handled by the backend.
 * @zh
 * 将带有模拟值的按键按下或松开事件加入队列，例如 ImGuiKey.GamepadL2。
 *
 * 死区应由后端处理。
 * @ja
 * ImGuiKey.GamepadL2 などの、アナログ値を伴うキーの押下または解放イベントをキューに追加します。
 *
 * デッドゾーンはバックエンドで処理してください。
 * @ko
 * ImGuiKey.GamepadL2와 같이 아날로그 값을 포함하는 키 누름 또는 해제 이벤트를 큐에 추가합니다.
 *
 * 데드존은 백엔드가 처리해야 합니다.
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 *
 * @param key - ImGuiKey logical key identifier, not a platform-native key code.
 * @zh key - ImGuiKey 逻辑按键标识符，不是平台原生键码。
 * @ja key - ImGuiKey の論理キー識別子です。プラットフォーム固有のキーコードではありません。
 * @ko key - ImGuiKey 논리 키 식별자이며 플랫폼 네이티브 키 코드가 아닙니다.
 *
 * @param down - Current pressed state: true for press/down, false for
 * release/up.
 * @zh down - 当前按下状态：true 为按下，false 为释放。
 * @ja down - 現在の押下状態です。true は押下、false は解放です。
 * @ko down - 현재 눌림 상태입니다. true는 누름, false는 해제입니다.
 *
 * @param v - Analog key strength from 0 (released) to 1 (fully pressed).
 * @zh v - 模拟按键强度，0 为释放，1 为完全按下。
 * @ja v - アナログキーの強度です。0 は解放、1 は最大押下です。
 * @ko v - 아날로그 키 강도입니다. 0은 해제, 1은 완전히 누름입니다.
 */
export function IO_AddKeyAnalogEvent(
  self: ImGuiIO,
  key: number,
  down: boolean,
  v: number,
): void {
  native.IO_AddKeyAnalogEvent(self, key, down, v);
}

/**
 * Queue a mouse position update.
 *
 * @zh 将鼠标位置更新加入队列。
 * @ja マウス位置の更新をキューに追加します。
 * @ko 마우스 위치 갱신을 큐에 추가합니다.
 *
 * @remarks
 * Use -3.4028234663852886e+38,-3.4028234663852886e+38 to signify no mouse (e.g.
 * app not focused and not
 * hovered)
 * @zh
 * 使用 -3.4028234663852886e+38,-3.4028234663852886e+38 表示没有鼠标（例如应用未聚焦且未被悬停）。
 * @ja
 * マウスがない場合は -3.4028234663852886e+38,-3.4028234663852886e+38
 * を使います（アプリにフォーカスもホバーもない場合など）。
 * @ko
 * 마우스가 없으면 -3.4028234663852886e+38,-3.4028234663852886e+38를 사용합니다(예: 앱에 포커스도 없고
 * 마우스도 올라가 있지 않음).
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 *
 * @param x - Mouse position component in absolute screen coordinates;
 * -3.4028234663852886e+38
 * indicates an unavailable position.
 * @zh x - 绝对屏幕坐标中的鼠标位置分量；-3.4028234663852886e+38 表示位置不可用。
 * @ja x - 絶対スクリーン座標のマウス位置成分です。-3.4028234663852886e+38 は位置不明を示します。
 * @ko x - 절대 화면 좌표의 마우스 위치 성분입니다. -3.4028234663852886e+38는 위치 사용 불가를 나타냅니다.
 *
 * @param y - Mouse position component in absolute screen coordinates;
 * -3.4028234663852886e+38
 * indicates an unavailable position.
 * @zh y - 绝对屏幕坐标中的鼠标位置分量；-3.4028234663852886e+38 表示位置不可用。
 * @ja y - 絶対スクリーン座標のマウス位置成分です。-3.4028234663852886e+38 は位置不明を示します。
 * @ko y - 절대 화면 좌표의 마우스 위치 성분입니다. -3.4028234663852886e+38는 위치 사용 불가를 나타냅니다.
 */
export function IO_AddMousePosEvent(self: ImGuiIO, x: number, y: number): void {
  native.IO_AddMousePosEvent(self, x, y);
}

/**
 * Queue a mouse button change.
 *
 * @zh 将鼠标按钮变化加入队列。
 * @ja マウスボタンの変化をキューに追加します。
 * @ko 마우스 버튼 변경을 큐에 추가합니다.
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 *
 * @param button - ImGuiMouseButton index: 0 left, 1 right, 2 middle.
 * @zh button - ImGuiMouseButton 索引：0 左键、1 右键、2 中键。
 * @ja button - ImGuiMouseButton の番号です。0 は左、1 は右、2 は中央です。
 * @ko button - ImGuiMouseButton 인덱스입니다. 0은 왼쪽, 1은 오른쪽, 2는 가운데입니다.
 *
 * @param down - Current pressed state: true for press/down, false for
 * release/up.
 * @zh down - 当前按下状态：true 为按下，false 为释放。
 * @ja down - 現在の押下状態です。true は押下、false は解放です。
 * @ko down - 현재 눌림 상태입니다. true는 누름, false는 해제입니다.
 */
export function IO_AddMouseButtonEvent(
  self: ImGuiIO,
  button: number,
  down: boolean,
): void {
  native.IO_AddMouseButtonEvent(self, button, down);
}

/**
 * Queue a mouse wheel update.
 *
 * @zh 将鼠标滚轮更新加入队列。
 * @ja マウスホイールの更新をキューに追加します。
 * @ko 마우스 휠 갱신을 큐에 추가합니다.
 *
 * @remarks
 * wheel_y<0: scroll down, wheel_y>0: scroll up, wheel_x<0: scroll right,
 * wheel_x>0: scroll left.
 * @zh
 * wheel_y<0：向下滚动；wheel_y>0：向上滚动；wheel_x<0：向右滚动；wheel_x>0：向左滚动。
 * @ja
 * wheel_y<0：下、wheel_y>0：上、wheel_x<0：右、wheel_x>0：左へスクロールします。
 * @ko
 * wheel_y<0: 아래로, wheel_y>0: 위로, wheel_x<0: 오른쪽으로, wheel_x>0: 왼쪽으로 스크롤합니다.
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 *
 * @param wheel_x - Horizontal/vertical wheel delta; one unit corresponds to one
 * wheel notch.
 * @zh wheel_x - 水平或垂直滚轮增量；一个单位对应滚轮一格。
 * @ja wheel_x - 水平または垂直ホイールの移動量です。1 単位は 1 ノッチに相当します。
 * @ko wheel_x - 가로 또는 세로 휠 변화량입니다. 한 단위는 휠 한 눈금입니다.
 *
 * @param wheel_y - Horizontal/vertical wheel delta; one unit corresponds to one
 * wheel notch.
 * @zh wheel_y - 水平或垂直滚轮增量；一个单位对应滚轮一格。
 * @ja wheel_y - 水平または垂直ホイールの移動量です。1 単位は 1 ノッチに相当します。
 * @ko wheel_y - 가로 또는 세로 휠 변화량입니다. 한 단위는 휠 한 눈금입니다.
 */
export function IO_AddMouseWheelEvent(
  self: ImGuiIO,
  wheel_x: number,
  wheel_y: number,
): void {
  native.IO_AddMouseWheelEvent(self, wheel_x, wheel_y);
}

/**
 * Queue a mouse source change (Mouse/TouchScreen/Pen).
 *
 * @zh 将鼠标来源变化加入队列（鼠标/触摸屏/笔）。
 * @ja マウス入力元の変更をキューに追加します（マウス/タッチスクリーン/ペン）。
 * @ko 마우스 입력 소스 변경을 큐에 추가합니다(마우스/터치스크린/펜).
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 *
 * @param source - ImGuiMouseSource identifying mouse, touch-screen, or pen
 * input.
 * @zh source - 区分鼠标、触摸屏或触控笔输入的 ImGuiMouseSource。
 * @ja source - マウス、タッチ画面、ペンを識別する ImGuiMouseSource です。
 * @ko source - 마우스, 터치스크린 또는 펜 입력을 식별하는 ImGuiMouseSource입니다.
 */
export function IO_AddMouseSourceEvent(self: ImGuiIO, source: number): void {
  native.IO_AddMouseSourceEvent(self, source);
}

/**
 * Queue an application focus change.
 *
 * @zh 将应用焦点变化加入队列。
 * @ja アプリケーションのフォーカス変更をキューに追加します。
 * @ko 애플리케이션 포커스 변경을 큐에 추가합니다.
 *
 * @remarks
 * Queue a gain/loss of focus for the application (generally based on
 * OS/platform focus of your window)
 * @zh
 * 将应用获得/失去焦点的事件加入队列（通常依据窗口在操作系统/平台上的焦点状态）。
 * @ja
 * アプリケーションのフォーカス取得/喪失をキューに追加します（通常は OS/プラットフォーム上のウィンドウのフォーカスに基づきます）。
 * @ko
 * 응용 프로그램의 포커스 획득/상실을 큐에 추가합니다(일반적으로 OS/플랫폼상의 창 포커스 기준).
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 *
 * @param focused - Whether the application has OS input focus.
 * @zh focused - 应用是否拥有操作系统输入焦点。
 * @ja focused - アプリケーションが OS 入力フォーカスを持つかどうかです。
 * @ko focused - 앱이 OS 입력 포커스를 갖는지 여부입니다.
 */
export function IO_AddFocusEvent(self: ImGuiIO, focused: boolean): void {
  native.IO_AddFocusEvent(self, focused);
}

/**
 * Queue a new character input.
 *
 * @zh 将新的字符输入加入队列。
 * @ja 新しい文字入力をキューに追加します。
 * @ko 새 문자 입력을 큐에 추가합니다.
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 *
 * @param c - Unicode code point to query or add, within the range supported by
 * this ImWchar build.
 * @zh c - 要查询或加入的 Unicode 码点，须在此 ImWchar 构建支持的范围内。
 * @ja c - 検索または追加する Unicode コードポイントです。この ImWchar ビルドの対応範囲内で指定します。
 * @ko c - 조회하거나 추가할 유니코드 코드 포인트이며 이 ImWchar 빌드가 지원하는 범위여야 합니다.
 */
export function IO_AddInputCharacter(self: ImGuiIO, c: number): void {
  native.IO_AddInputCharacter(self, c);
}

/**
 * Queue a UTF-16 input code unit.
 *
 * @zh 将 UTF-16 输入码元加入队列。
 * @ja UTF-16 の入力コード単位をキューに追加します。
 * @ko UTF-16 입력 코드 단위를 큐에 추가합니다.
 *
 * @remarks
 * Queue a new character input from a UTF-16 character, it can be a surrogate
 * @zh
 * 将 UTF-16 字符的新输入加入队列，可以是代理项。
 * @ja
 * UTF-16 文字からの新しい文字入力をキューに追加します。
 *
 * サロゲートでも構いません。
 * @ko
 * UTF-16 문자의 새 입력을 큐에 추가합니다.
 *
 * 서로게이트일 수도 있습니다.
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 *
 * @param c - UTF-16 code unit; surrogate pairs are combined across successive
 * calls.
 * @zh c - UTF-16 代码单元；代理对在连续调用中合并。
 * @ja c - UTF-16 コード単位です。サロゲートペアは連続する呼び出しで結合します。
 * @ko c - UTF-16 코드 단위입니다. 연속 호출의 서로게이트 쌍을 결합합니다。
 */
export function IO_AddInputCharacterUTF16(self: ImGuiIO, c: number): void {
  native.IO_AddInputCharacterUTF16(self, c);
}

/**
 * Queue character input from a UTF-8 string.
 *
 * @zh 将 UTF-8 字符串中的字符输入加入队列。
 * @ja UTF-8 文字列からの文字入力をキューに追加します。
 * @ko UTF-8 문자열의 문자 입력을 큐에 추가합니다.
 *
 * @remarks
 * Queue a new characters input from a UTF-8 string
 * @zh
 * 将 UTF-8 字符串中的新字符输入加入队列。
 * @ja
 * UTF-8 文字列からの新しい文字入力をキューに追加します。
 * @ko
 * UTF-8 문자열의 새 문자 입력을 큐에 추가합니다.
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 *
 * @param str - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh str - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja str - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array は直接渡し、それ以外はコピーして
 * NUL を付けます。
 * @ko str - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 */
export function IO_AddInputCharactersUTF8(
  self: ImGuiIO,
  str: string | Uint8Array,
): void {
  native.IO_AddInputCharactersUTF8(self, str);
}

/**
 * Accept native key metadata for compatibility; this version validates but does
 * not store it.
 *
 * @zh 为兼容性接收原生按键元数据；此版本执行校验但不存储这些数据。
 * @ja 互換性のためにネイティブキーのメタデータを受け付けますが、この版では検証のみで保存しません。
 * @ko 호환성을 위해 네이티브 키 메타데이터를 받으며 이 버전에서는 검증만 하고 저장하지 않습니다.
 *
 * @remarks
 * [Optional] Specify index for legacy <1.87 IsKeyXXX() functions with native
 * indices + specify native keycode, scancode.
 *
 * Implied native_legacy_index = -1
 * @zh
 * [可选] 为旧版 <1.87、使用原生索引的 IsKeyXXX() 函数指定索引，并指定原生键码、扫描码。
 *
 * 隐含参数：native_legacy_index = -1。
 * @ja
 * [任意] ネイティブインデックスを使う旧版 <1.87 の IsKeyXXX() 関数用インデックスと、ネイティブキーコード、スキャンコードを指定します。
 *
 * 暗黙の引数：native_legacy_index = -1。
 * @ko
 * [선택 사항] 네이티브 인덱스를 사용하는 레거시 <1.87 IsKeyXXX() 함수용 인덱스와 네이티브 키코드, 스캔코드를 지정합니다.
 *
 * 암묵적 인수: native_legacy_index = -1.
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 *
 * @param key - ImGuiKey logical key identifier, not a platform-native key code.
 * @zh key - ImGuiKey 逻辑按键标识符，不是平台原生键码。
 * @ja key - ImGuiKey の論理キー識別子です。プラットフォーム固有のキーコードではありません。
 * @ko key - ImGuiKey 논리 키 식별자이며 플랫폼 네이티브 키 코드가 아닙니다.
 *
 * @param native_keycode - Backend-native key code, scan code, or legacy key
 * index used to associate platform key data; -1 denotes unavailable data.
 * @zh native_keycode - 用于关联平台按键数据的后端键码、扫描码或旧式键索引；-1 表示不可用。
 * @ja native_keycode - プラットフォームのキー情報に対応付けるキーコード、スキャンコード、旧インデックスです。-1
 * は利用不可を示します。
 * @ko native_keycode - 플랫폼 키 데이터에 연결할 네이티브 키 코드, 스캔 코드 또는 레거시 인덱스입니다. -1은 사용
 * 불가입니다.
 *
 * @param native_scancode - Backend-native key code, scan code, or legacy key
 * index used to associate platform key data; -1 denotes unavailable data.
 * @zh native_scancode - 用于关联平台按键数据的后端键码、扫描码或旧式键索引；-1 表示不可用。
 * @ja native_scancode - プラットフォームのキー情報に対応付けるキーコード、スキャンコード、旧インデックスです。-1
 * は利用不可を示します。
 * @ko native_scancode - 플랫폼 키 데이터에 연결할 네이티브 키 코드, 스캔 코드 또는 레거시 인덱스입니다. -1은 사용
 * 불가입니다.
 */
export function IO_SetKeyEventNativeData(
  self: ImGuiIO,
  key: number,
  native_keycode: number,
  native_scancode: number,
): void {
  native.IO_SetKeyEventNativeData(self, key, native_keycode, native_scancode);
}

/**
 * Associate native key data with an input event.
 *
 * @zh 为输入事件关联原生按键数据。
 * @ja 入力イベントにネイティブのキーデータを関連付けます。
 * @ko 입력 이벤트에 네이티브 키 데이터를 연결합니다.
 *
 * @remarks
 * [Optional] Specify index for legacy <1.87 IsKeyXXX() functions with native
 * indices + specify native keycode, scancode.
 * @zh
 * [可选] 为旧版 <1.87、使用原生索引的 IsKeyXXX() 函数指定索引，并指定原生键码、扫描码。
 * @ja
 * [任意] ネイティブインデックスを使う旧版 <1.87 の IsKeyXXX() 関数用インデックスと、ネイティブキーコード、スキャンコードを指定します。
 * @ko
 * [선택 사항] 네이티브 인덱스를 사용하는 레거시 <1.87 IsKeyXXX() 함수용 인덱스와 네이티브 키코드, 스캔코드를 지정합니다.
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 *
 * @param key - ImGuiKey logical key identifier, not a platform-native key code.
 * @zh key - ImGuiKey 逻辑按键标识符，不是平台原生键码。
 * @ja key - ImGuiKey の論理キー識別子です。プラットフォーム固有のキーコードではありません。
 * @ko key - ImGuiKey 논리 키 식별자이며 플랫폼 네이티브 키 코드가 아닙니다.
 *
 * @param native_keycode - Backend-native key code, scan code, or legacy key
 * index used to associate platform key data; -1 denotes unavailable data.
 * @zh native_keycode - 用于关联平台按键数据的后端键码、扫描码或旧式键索引；-1 表示不可用。
 * @ja native_keycode - プラットフォームのキー情報に対応付けるキーコード、スキャンコード、旧インデックスです。-1
 * は利用不可を示します。
 * @ko native_keycode - 플랫폼 키 데이터에 연결할 네이티브 키 코드, 스캔 코드 또는 레거시 인덱스입니다. -1은 사용
 * 불가입니다.
 *
 * @param native_scancode - Backend-native key code, scan code, or legacy key
 * index used to associate platform key data; -1 denotes unavailable data.
 * @zh native_scancode - 用于关联平台按键数据的后端键码、扫描码或旧式键索引；-1 表示不可用。
 * @ja native_scancode - プラットフォームのキー情報に対応付けるキーコード、スキャンコード、旧インデックスです。-1
 * は利用不可を示します。
 * @ko native_scancode - 플랫폼 키 데이터에 연결할 네이티브 키 코드, 스캔 코드 또는 레거시 인덱스입니다. -1은 사용
 * 불가입니다.
 *
 * @param native_legacy_index - Backend-native key code, scan code, or legacy
 * key index used to associate platform key data; -1 denotes unavailable data.
 * @zh native_legacy_index - 用于关联平台按键数据的后端键码、扫描码或旧式键索引；-1 表示不可用。
 * @ja native_legacy_index - プラットフォームのキー情報に対応付けるキーコード、スキャンコード、旧インデックスです。-1
 * は利用不可を示します。
 * @ko native_legacy_index - 플랫폼 키 데이터에 연결할 네이티브 키 코드, 스캔 코드 또는 레거시 인덱스입니다. -1은
 * 사용 불가입니다.
 */
export function IO_SetKeyEventNativeDataEx(
  self: ImGuiIO,
  key: number,
  native_keycode: number,
  native_scancode: number,
  native_legacy_index: number = -1,
): void {
  native.IO_SetKeyEventNativeDataEx(
    self,
    key,
    native_keycode,
    native_scancode,
    native_legacy_index,
  );
}

/**
 * Enable or disable input-event queuing.
 *
 * @zh 启用或禁用输入事件入队。
 * @ja 入力イベントのキューへの追加を有効または無効にします。
 * @ko 입력 이벤트 큐 추가를 활성화하거나 비활성화합니다.
 *
 * @remarks
 * Set master flag for accepting key/mouse/text events (default to true).
 *
 * Useful if you have native dialog boxes that are interrupting your application
 * loop/refresh, and you want to disable events being queued while your app is
 * frozen.
 * @zh
 * 设置是否接受按键/鼠标/文本事件的总开关（默认为 true）。
 *
 * 原生对话框会中断应用循环/刷新，而你希望在应用冻结期间停止事件入队时，此功能很有用。
 * @ja
 * キー/マウス/テキストイベントを受け付ける全体フラグを設定します（既定は true）。
 *
 * ネイティブダイアログがアプリケーションのループ/更新を中断し、その停止中にイベントのキュー追加を無効にしたい場合に有用です。
 * @ko
 * 키/마우스/텍스트 이벤트 수락 여부의 전체 플래그를 설정합니다(기본값 true).
 *
 * 네이티브 대화상자가 응용 프로그램 루프/갱신을 중단하여 앱이 멈춘 동안 이벤트가 큐에 쌓이지 않게 할 때 유용합니다.
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 *
 * @param accepting_events - Whether subsequent input events should be accepted
 * into the event queue.
 * @zh accepting_events - 是否将后续输入事件接收到事件队列。
 * @ja accepting_events - 以降の入力イベントをキューで受け付けるかどうかです。
 * @ko accepting_events - 이후 입력 이벤트를 이벤트 큐에 받을지 여부입니다.
 */
export function IO_SetAppAcceptingEvents(
  self: ImGuiIO,
  accepting_events: boolean,
): void {
  native.IO_SetAppAcceptingEvents(self, accepting_events);
}

/**
 * Clear all incoming events.
 *
 * @zh 清除所有传入事件。
 * @ja 受信したすべてのイベントを消去します。
 * @ko 들어온 모든 이벤트를 지웁니다.
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 */
export function IO_ClearEventsQueue(self: ImGuiIO): void {
  native.IO_ClearEventsQueue(self);
}

/**
 * Clear current keyboard/gamepad state + current frame text input buffer.
 *
 * @zh 清除当前键盘/手柄状态及当前帧文本输入缓冲区。
 * @ja 現在のキーボード/ゲームパッド状態と現在のフレームのテキスト入力バッファを消去します。
 * @ko 현재 키보드/게임패드 상태와 현재 프레임의 텍스트 입력 버퍼를 지웁니다.
 *
 * @remarks
 * Equivalent to releasing all keys/buttons.
 * @zh
 * 等同于松开所有按键/按钮。
 * @ja
 * すべてのキー/ボタンを離すのと同等です。
 * @ko
 * 모든 키/버튼을 놓는 것과 같습니다.
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 */
export function IO_ClearInputKeys(self: ImGuiIO): void {
  native.IO_ClearInputKeys(self);
}

/**
 * Clear current mouse state.
 *
 * @zh 清除当前鼠标状态。
 * @ja 現在のマウス状態を消去します。
 * @ko 현재 마우스 상태를 지웁니다.
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 */
export function IO_ClearInputMouse(self: ImGuiIO): void {
  native.IO_ClearInputMouse(self);
}

/**
 * Clear the current frame text input buffer.
 *
 * @zh 清空当前帧的文本输入缓冲区。
 * @ja 現在のフレームのテキスト入力バッファを消去します。
 * @ko 현재 프레임의 텍스트 입력 버퍼를 비웁니다.
 *
 * @remarks
 * [Obsoleted in 1.89.8] Clear the current frame text input buffer.
 *
 * Now included within IO_ClearInputKeys(self).
 * @zh
 * [于 1.89.8 废弃] 清除当前帧的文本输入缓冲区。
 *
 * 现已包含在 IO_ClearInputKeys(self) 中。
 * @ja
 * [1.89.8 で廃止] 現在のフレームのテキスト入力バッファを消去します。
 *
 * 現在は IO_ClearInputKeys(self) に含まれます。
 * @ko
 * [1.89.8에서 폐기] 현재 프레임의 텍스트 입력 버퍼를 지웁니다.
 *
 * 이제 IO_ClearInputKeys(self)에 포함됩니다.
 *
 * @param self - ImGuiIO handle on which this method operates.
 * @zh self - 此方法操作的 ImGuiIO 句柄。
 * @ja self - このメソッドの操作対象となる ImGuiIO ハンドルです。
 * @ko self - 이 메서드가 조작할 ImGuiIO 핸들입니다.
 */
export function IO_ClearInputCharacters(self: ImGuiIO): void {
  native.IO_ClearInputCharacters(self);
}
