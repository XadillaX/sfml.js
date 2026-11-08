import { native } from '../internal/native';
import type { ImGuiStyle } from '../types';

/**
 * Show the Dear ImGui demo window.
 *
 * @zh 显示 Dear ImGui 演示窗口。
 * @ja Dear ImGui のデモウィンドウを表示します。
 * @ko Dear ImGui 데모 창을 표시합니다.
 *
 * @remarks
 * create Demo window.
 *
 * demonstrate most ImGui features.
 *
 * call this to learn about the library!
 *
 * try to make it always available in your application!
 * @zh
 * 演示、调试与信息：创建演示窗口，展示 ImGui 的大部分功能。
 *
 * 调用此函数来了解该库！
 *
 * 尽量让应用程序始终能打开它！
 * @ja
 * デモ、デバッグ、情報：デモウィンドウを作成し、ImGui の大半の機能を紹介します。
 *
 * ライブラリを学ぶために呼び出してください！
 *
 * アプリケーション内で常に利用できるようにすることを推奨します！
 * @ko
 * 데모, 디버그, 정보: 데모 창을 생성하여 ImGui의 대부분의 기능을 보여 줍니다.
 *
 * 이 함수를 호출하여 라이브러리를 익히세요!
 *
 * 애플리케이션에서 항상 열 수 있도록 하는 것이 좋습니다!
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
export function ShowDemoWindow(p_open: Uint8Array | null = null): void {
  native.ShowDemoWindow(p_open);
}

/**
 * Show the metrics and debugger window.
 *
 * @zh 显示性能指标和调试器窗口。
 * @ja メトリクスとデバッガーのウィンドウを表示します。
 * @ko 메트릭 및 디버거 창을 표시합니다.
 *
 * @remarks
 * create Metrics/Debugger window.
 *
 * display Dear ImGui internals: windows, draw commands, various internal state,
 * etc.
 * @zh
 * 创建指标/调试器窗口，显示 Dear ImGui 的内部信息：窗口、绘制命令、各种内部状态等。
 * @ja
 * メトリクス／デバッガーウィンドウを作成し、ウィンドウ、描画コマンド、各種内部状態など Dear ImGui の内部情報を表示します。
 * @ko
 * 메트릭/디버거 창을 생성하여 창, 그리기 명령, 각종 내부 상태 등 Dear ImGui 내부 정보를 표시합니다.
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
export function ShowMetricsWindow(p_open: Uint8Array | null = null): void {
  native.ShowMetricsWindow(p_open);
}

/**
 * Show the debug log window.
 *
 * @zh 显示调试日志窗口。
 * @ja デバッグログのウィンドウを表示します。
 * @ko 디버그 로그 창을 표시합니다.
 *
 * @remarks
 * create Debug Log window.
 *
 * display a simplified log of important dear imgui events.
 * @zh
 * 创建调试日志窗口，显示 Dear ImGui 重要事件的简化日志。
 * @ja
 * デバッグログウィンドウを作成し、Dear ImGui の重要なイベントの簡略ログを表示します。
 * @ko
 * 디버그 로그 창을 생성하여 Dear ImGui의 중요한 이벤트를 간략한 로그로 표시합니다.
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
export function ShowDebugLogWindow(p_open: Uint8Array | null = null): void {
  native.ShowDebugLogWindow(p_open);
}

/**
 * Show the ID stack debugger to inspect how widget identifiers are built.
 *
 * @zh 显示 ID 栈调试窗口，检查控件标识符的构成。
 * @ja ID スタックのデバッグウィンドウを表示し、ウィジェット ID の構成を調べます。
 * @ko ID 스택 디버거를 표시하여 위젯 식별자의 구성을 확인합니다.
 *
 * @remarks
 * create Stack Tool window.
 *
 * hover items with mouse to query information about the source of their unique
 * ID.
 *
 * Implied p_open = null
 * @zh
 * 创建栈工具窗口。
 *
 * 将鼠标悬停在项目上，可查询其唯一 ID 的来源信息。
 *
 * 隐含参数：p_open = null。
 * @ja
 * スタックツールウィンドウを作成します。
 *
 * 項目にマウスを重ねると、その一意な ID の生成元に関する情報を調べられます。
 *
 * 暗黙の引数：p_open = null。
 * @ko
 * 스택 도구 창을 생성합니다.
 *
 * 항목에 마우스를 올려 고유 ID의 생성 출처 정보를 확인할 수 있습니다.
 *
 * 암묵적 인수: p_open = null.
 */
export function ShowIDStackToolWindow(): void {
  native.ShowIDStackToolWindow();
}

/**
 * Show the ID stack debugging window.
 *
 * @zh 显示 ID 栈调试窗口。
 * @ja ID スタックのデバッグウィンドウを表示します。
 * @ko ID 스택 디버그 창을 표시합니다.
 *
 * @remarks
 * create Stack Tool window.
 *
 * hover items with mouse to query information about the source of their unique
 * ID.
 * @zh
 * 创建栈工具窗口。
 *
 * 将鼠标悬停在项目上，可查询其唯一 ID 的来源信息。
 * @ja
 * スタックツールウィンドウを作成します。
 *
 * 項目にマウスを重ねると、その一意な ID の生成元に関する情報を調べられます。
 * @ko
 * 스택 도구 창을 생성합니다.
 *
 * 항목에 마우스를 올려 고유 ID의 생성 출처 정보를 확인할 수 있습니다.
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
export function ShowIDStackToolWindowEx(
  p_open: Uint8Array | null = null,
): void {
  native.ShowIDStackToolWindowEx(p_open);
}

/**
 * Show version, credits, and build information.
 *
 * @zh 显示版本、致谢和构建信息。
 * @ja バージョン、クレジット、ビルド情報を表示します。
 * @ko 버전, 기여자 및 빌드 정보를 표시합니다.
 *
 * @remarks
 * create About window.
 *
 * display Dear ImGui version, credits and build/system information.
 * @zh
 * 创建“关于”窗口，显示 Dear ImGui 版本、致谢以及构建和系统信息。
 * @ja
 * バージョン情報ウィンドウを作成し、Dear ImGui のバージョン、クレジット、ビルドとシステムの情報を表示します。
 * @ko
 * 정보 창을 생성하여 Dear ImGui 버전, 크레딧, 빌드 및 시스템 정보를 표시합니다.
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
export function ShowAboutWindow(p_open: Uint8Array | null = null): void {
  native.ShowAboutWindow(p_open);
}

/**
 * Display an inline style editor.
 *
 * @zh 显示内嵌样式编辑器。
 * @ja インラインのスタイルエディターを表示します。
 * @ko 인라인 스타일 편집기를 표시합니다.
 *
 * @remarks
 * add style editor block (not a window).
 *
 * you can pass in a reference ImGuiStyle structure to compare to, revert to and
 * save to (else it uses the default style)
 * @zh
 * 添加样式编辑器区块（不是窗口）。
 *
 * 可以传入作为参照的 ImGuiStyle 结构，用于比较、恢复和保存样式（否则使用默认样式）。
 * @ja
 * スタイルエディターのブロック（ウィンドウではありません）を追加します。
 *
 * 比較、復元、保存の参照用に ImGuiStyle 構造体を渡せます（渡さない場合は既定のスタイルを使用します）。
 * @ko
 * 스타일 편집기 블록(창이 아님)을 추가합니다.
 *
 * 비교, 복원, 저장에 사용할 참조 ImGuiStyle 구조체를 전달할 수 있습니다(그렇지 않으면 기본 스타일을 사용합니다).
 *
 * @param ref - Optional reference style for comparison and reverting edits in
 * the editor.
 * @zh ref - 用于编辑器比较和还原修改的可选参考样式。
 * @ja ref - エディターで比較・復元に使う任意の基準スタイルです。
 * @ko ref - 편집기에서 비교 및 복원에 사용할 선택적 기준 스타일입니다.
 */
export function ShowStyleEditor(ref: ImGuiStyle | null = null): void {
  native.ShowStyleEditor(ref);
}

/**
 * Display a selector for the built-in color styles.
 *
 * @zh 显示内置配色样式选择器。
 * @ja 組み込みの配色スタイルの選択欄を表示します。
 * @ko 내장 색상 스타일 선택기를 표시합니다.
 *
 * @remarks
 * add style selector block (not a window), essentially a combo listing the
 * default styles.
 * @zh
 * 添加样式选择器区块（不是窗口），实质是列出默认样式的组合框。
 * @ja
 * スタイル選択ブロック（ウィンドウではありません）を追加します。
 *
 * 実体は既定のスタイルを列挙するコンボボックスです。
 * @ko
 * 스타일 선택기 블록(창이 아님)을 추가합니다.
 *
 * 기본 스타일 목록을 보여 주는 콤보 상자입니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @returns True if the widget changed the supplied value; false if it remained
 * unchanged.
 * @zh 控件更改了所提供的值时返回 true，未更改时返回 false。
 * @ja ウィジェットが渡された値を変更した場合は true、変更しなければ false です。
 * @ko 위젯이 전달된 값을 변경하면 true, 변경하지 않으면 false입니다.
 */
export function ShowStyleSelector(label: string | Uint8Array): boolean {
  return native.ShowStyleSelector(label);
}

/**
 * Display a selector for loaded fonts.
 *
 * @zh 显示已加载字体的选择器。
 * @ja 読み込み済みフォントの選択欄を表示します。
 * @ko 불러온 글꼴 선택기를 표시합니다.
 *
 * @remarks
 * add font selector block (not a window), essentially a combo listing the
 * loaded fonts.
 * @zh
 * 添加字体选择器区块（不是窗口），实质是列出已加载字体的组合框。
 * @ja
 * フォント選択ブロック（ウィンドウではありません）を追加します。
 *
 * 実体は読み込み済みフォントを列挙するコンボボックスです。
 * @ko
 * 글꼴 선택기 블록(창이 아님)을 추가합니다.
 *
 * 로드된 글꼴 목록을 보여 주는 콤보 상자입니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 */
export function ShowFontSelector(label: string | Uint8Array): void {
  native.ShowFontSelector(label);
}

/**
 * Display basic mouse and keyboard usage instructions.
 *
 * @zh 显示基本鼠标和键盘操作说明。
 * @ja マウスとキーボードの基本操作を表示します。
 * @ko 기본 마우스 및 키보드 사용 방법을 표시합니다.
 *
 * @remarks
 * add basic help/info block (not a window): how to manipulate ImGui as an
 * end-user (mouse/keyboard controls).
 * @zh
 * 添加基本帮助/信息区块（不是窗口）：介绍最终用户如何操作 ImGui（鼠标和键盘控制）。
 * @ja
 * 基本的なヘルプ／情報ブロック（ウィンドウではありません）を追加し、エンドユーザー向けの ImGui の操作方法（マウスとキーボード操作）を説明します。
 * @ko
 * 기본 도움말/정보 블록(창이 아님)을 추가하여 최종 사용자의 ImGui 조작 방법(마우스와 키보드 조작)을 안내합니다.
 */
export function ShowUserGuide(): void {
  native.ShowUserGuide();
}

/**
 * Display debugging information about text encoding.
 *
 * @zh 显示文本编码的调试信息。
 * @ja テキストエンコーディングのデバッグ情報を表示します。
 * @ko 텍스트 인코딩에 대한 디버그 정보를 표시합니다.
 *
 * @remarks
 * - Your main debugging friend is the ShowMetricsWindow() function, which is
 *   also accessible from Demo->Tools->Metrics Debugger
 * @zh
 * 调试工具。
 *
 * - 主要调试工具是 ShowMetricsWindow()，也可通过 Demo->Tools->Metrics Debugger 访问。
 * @ja
 * デバッグユーティリティ。
 *
 * - 主なデバッグ手段は ShowMetricsWindow() です。Demo->Tools->Metrics Debugger からも開けます。
 * @ko
 * 디버그 유틸리티.
 *
 * - 주요 디버깅 도구는 ShowMetricsWindow()이며 Demo->Tools->Metrics Debugger에서도 열 수 있습니다.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 */
export function DebugTextEncoding(text: string | Uint8Array): void {
  native.DebugTextEncoding(text);
}

/**
 * Briefly flash a style color to reveal where it is used in the interface.
 *
 * @zh 短暂闪烁样式颜色，以显示界面中使用该颜色的位置。
 * @ja スタイル色を短時間点滅させ、画面内でその色が使われている場所を示します。
 * @ko 스타일 색상을 잠시 깜박여 인터페이스에서 해당 색상이 사용된 위치를 보여 줍니다.
 *
 * @param idx - ImGuiCol index selecting the style color entry.
 * @zh idx - 选择样式颜色条目的 ImGuiCol 索引。
 * @ja idx - スタイル色を選択する ImGuiCol インデックスです。
 * @ko idx - 스타일 색상 항목을 고르는 ImGuiCol 인덱스입니다.
 */
export function DebugFlashStyleColor(idx: number): void {
  native.DebugFlashStyleColor(idx);
}

/**
 * Start the visual item picker for breaking into a selected widget in the
 * debugger.
 *
 * @zh 启动可视化控件选择器，以便在调试器中断到选中的控件。
 * @ja 選択したウィジェットでデバッガーを停止するための視覚的な項目ピッカーを開始します。
 * @ko 디버거에서 선택한 위젯에 중단할 수 있도록 시각적 항목 선택기를 시작합니다.
 */
export function DebugStartItemPicker(): void {
  native.DebugStartItemPicker();
}

/**
 * Check the compiled version and data-structure layout.
 *
 * @zh 检查编译版本和数据结构布局。
 * @ja コンパイルされたバージョンとデータ構造のレイアウトを検証します。
 * @ko 컴파일된 버전과 데이터 구조 레이아웃을 확인합니다.
 *
 * @remarks
 * Native code calls this check through the IMGUI_CHECKVERSION macro, which is
 * not available in JS. JS callers use DebugCheckVersionAndDataLayout() with
 * the expected native version and structure sizes.
 * @zh
 * 原生代码通过 IMGUI_CHECKVERSION 宏执行此检查；JS 中没有该宏。
 * JS 调用方应使用 DebugCheckVersionAndDataLayout()，传入预期的原生版本与结构体大小。
 * @ja
 * ネイティブコードでは IMGUI_CHECKVERSION マクロから呼びます。このマクロは JS では使えません。
 * JS では DebugCheckVersionAndDataLayout() に期待するネイティブのバージョンと構造体サイズを渡します。
 * @ko
 * 네이티브 코드는 IMGUI_CHECKVERSION 매크로로 이 검사를 호출합니다. JS에서는 해당 매크로를 사용할 수 없습니다.
 * JS에서는 DebugCheckVersionAndDataLayout()에 예상 네이티브 버전과 구조체 크기를 전달합니다.
 *
 * @param version_str - Expected Dear ImGui version string, checked against the
 * linked native library.
 * @zh version_str - 预期的 Dear ImGui 版本字符串，与链接的原生库比较。
 * @ja version_str - リンクしたライブラリーと照合する Dear ImGui の期待バージョン文字列です。
 * @ko version_str - 연결된 네이티브 라이브러리와 비교할 Dear ImGui 예상 버전 문자열입니다.
 *
 * @param sz_io - Expected native sizeof(ImGuiIO) in bytes, not a JS object
 * size.
 * @zh sz_io - 预期的原生 sizeof(ImGuiIO) 字节数，不是 JS 对象大小。
 * @ja sz_io - 期待するネイティブ sizeof(ImGuiIO) のバイト数です。JS オブジェクトのサイズではありません。
 * @ko sz_io - 예상 네이티브 sizeof(ImGuiIO) 바이트 수이며 JS 객체 크기가 아닙니다.
 *
 * @param sz_style - Expected native sizeof(ImGuiStyle) in bytes, not a JS
 * object size.
 * @zh sz_style - 预期的原生 sizeof(ImGuiStyle) 字节数，不是 JS 对象大小。
 * @ja sz_style - 期待するネイティブ sizeof(ImGuiStyle) のバイト数です。JS オブジェクトのサイズではありません。
 * @ko sz_style - 예상 네이티브 sizeof(ImGuiStyle) 바이트 수이며 JS 객체 크기가 아닙니다.
 *
 * @param sz_vec2 - Expected native sizeof(ImVec2) in bytes, not a JS object
 * size.
 * @zh sz_vec2 - 预期的原生 sizeof(ImVec2) 字节数，不是 JS 对象大小。
 * @ja sz_vec2 - 期待するネイティブ sizeof(ImVec2) のバイト数です。JS オブジェクトのサイズではありません。
 * @ko sz_vec2 - 예상 네이티브 sizeof(ImVec2) 바이트 수이며 JS 객체 크기가 아닙니다.
 *
 * @param sz_vec4 - Expected native sizeof(ImVec4) in bytes, not a JS object
 * size.
 * @zh sz_vec4 - 预期的原生 sizeof(ImVec4) 字节数，不是 JS 对象大小。
 * @ja sz_vec4 - 期待するネイティブ sizeof(ImVec4) のバイト数です。JS オブジェクトのサイズではありません。
 * @ko sz_vec4 - 예상 네이티브 sizeof(ImVec4) 바이트 수이며 JS 객체 크기가 아닙니다.
 *
 * @param sz_drawvert - Expected native sizeof(ImDrawVert) in bytes, not a JS
 * object size.
 * @zh sz_drawvert - 预期的原生 sizeof(ImDrawVert) 字节数，不是 JS 对象大小。
 * @ja sz_drawvert - 期待するネイティブ sizeof(ImDrawVert) のバイト数です。JS オブジェクトのサイズではありません。
 * @ko sz_drawvert - 예상 네이티브 sizeof(ImDrawVert) 바이트 수이며 JS 객체 크기가 아닙니다.
 *
 * @param sz_drawidx - Expected native sizeof(ImDrawIdx) in bytes, not a JS
 * object size.
 * @zh sz_drawidx - 预期的原生 sizeof(ImDrawIdx) 字节数，不是 JS 对象大小。
 * @ja sz_drawidx - 期待するネイティブ sizeof(ImDrawIdx) のバイト数です。JS オブジェクトのサイズではありません。
 * @ko sz_drawidx - 예상 네이티브 sizeof(ImDrawIdx) 바이트 수이며 JS 객체 크기가 아닙니다.
 *
 * @returns True when the version and native structure sizes agree; mismatches
 * also trigger native assertions in assertion-enabled builds.
 * @zh 版本及原生结构尺寸一致时为 true；启用断言的构建中，不一致还会触发原生断言。
 * @ja バージョンと構造体サイズが一致すれば true です。アサート有効ビルドでは不一致時にアサートも発生します。
 * @ko 버전과 네이티브 구조체 크기가 일치하면 true입니다. 어설션 빌드에서는 불일치 시 네이티브 어설션도 발생합니다.
 */
export function DebugCheckVersionAndDataLayout(
  version_str: string | Uint8Array,
  sz_io: number,
  sz_style: number,
  sz_vec2: number,
  sz_vec4: number,
  sz_drawvert: number,
  sz_drawidx: number,
): boolean {
  return native.DebugCheckVersionAndDataLayout(
    version_str,
    sz_io,
    sz_style,
    sz_vec2,
    sz_vec4,
    sz_drawvert,
    sz_drawidx,
  );
}

/**
 * Append text to the debug log.
 *
 * @zh 向调试日志追加文本。
 * @ja デバッグログにテキストを追加します。
 * @ko 디버그 로그에 텍스트를 추가합니다.
 *
 * @remarks
 * Call DebugLogUnformatted(text) directly from JS and use ShowDebugLogWindow()
 * to inspect the log. Native logging may also mirror entries to terminal
 * output when its OutputToTTY option is enabled. Add a trailing newline when
 * you want a separate log line; text is not interpreted as a format string.
 * @zh
 * 在 JS 中直接调用 DebugLogUnformatted(text)，通过 ShowDebugLogWindow() 查看日志。
 * 原生日志启用 OutputToTTY 选项时，也可能将内容输出到终端。需要单独一行时请在文本末尾添加换行符；
 * 文本不会被当作格式字符串解析。
 * @ja
 * JS から DebugLogUnformatted(text) を直接呼び、ShowDebugLogWindow() でログを確認します。
 * ネイティブの OutputToTTY オプションが有効なら、端末にも出力されます。
 * 別の行にするには末尾に改行を付けてください。テキストは書式文字列として解釈されません。
 * @ko
 * JS에서 DebugLogUnformatted(text)를 직접 호출하고 ShowDebugLogWindow()로 로그를 확인하세요.
 * 네이티브 OutputToTTY 옵션이 켜져 있으면 터미널에도 출력될 수 있습니다.
 * 별도 줄로 기록하려면 끝에 줄바꿈을 추가하세요. 텍스트는 서식 문자열로 해석되지 않습니다.
 *
 * @param text - UTF-8 text to read. JS strings are encoded for this call; a
 * nonempty Uint8Array ending in NUL is passed directly, otherwise its bytes are
 * copied and NUL-terminated.
 * @zh text - 要读取的 UTF-8 文本。JS 字符串为本次调用编码；非空且以 NUL 结束的 Uint8Array 直接传入，否则复制字节并补上
 * NUL。
 * @ja text - 読む UTF-8 テキストです。JS 文字列は変換し、空でない NUL 終端の Uint8Array
 * は直接渡し、それ以外はコピーして NUL を付けます。
 * @ko text - 읽을 UTF-8 텍스트입니다. JS 문자열은 인코딩됩니다. 비어 있지 않은 NUL 종료 Uint8Array는 직접
 * 전달하며 나머지는 복사 후 NUL을 붙입니다.
 */
export function DebugLogUnformatted(text: string | Uint8Array): void {
  native.DebugLogUnformatted(text);
}
