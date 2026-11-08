import { native } from '../internal/native';

/**
 * Start capturing interface text to standard output.
 *
 * @zh 开始将界面文本记录到标准输出。
 * @ja インターフェイスのテキストを標準出力に記録し始めます。
 * @ko 인터페이스 텍스트를 표준 출력에 기록하기 시작합니다.
 *
 * @remarks
 * - All text output from the interface can be captured into tty/file/clipboard.
 *   By default, tree nodes are automatically opened during logging.
 *
 * start logging to tty (stdout)
 * @zh
 * 日志/捕获。
 *
 * - 界面的所有文本输出都可捕获到 tty/文件/剪贴板。默认在记录日志时自动展开树节点。开始向 tty（stdout）记录日志。
 * @ja
 * ログ/キャプチャ。
 *
 * - インターフェースのすべてのテキスト出力を
 *   tty/ファイル/クリップボードに取り込めます。既定ではログ記録中にツリーノードが自動で開きます。tty（stdout）へのログ記録を開始します。
 * @ko
 * 로그/캡처.
 *
 * - 인터페이스의 모든 텍스트 출력을 tty/파일/클립보드로 캡처할 수 있습니다. 기본적으로 로그 기록 중에는 트리 노드가 자동으로
 *   열립니다. tty(stdout)로 로그 기록을 시작합니다.
 *
 * @param auto_open_depth - Tree depth automatically expanded while logging; -1
 * uses the current logging default.
 * @zh auto_open_depth - 记录日志时自动展开的树深度；-1 使用当前日志默认值。
 * @ja auto_open_depth - ログ記録時に自動展開するツリー深度です。-1 は現在の既定値を使います。
 * @ko auto_open_depth - 로그 기록 중 자동으로 펼칠 트리 깊이입니다. -1은 현재 로그 기본값입니다.
 */
export function LogToTTY(auto_open_depth: number = -1): void {
  native.LogToTTY(auto_open_depth);
}

/**
 * Start logging to file.
 *
 * @zh 开始向文件记录日志。
 * @ja ファイルへのログ記録を開始します。
 * @ko 파일로 로그 기록을 시작합니다.
 *
 * @param auto_open_depth - Tree depth automatically expanded while logging; -1
 * uses the current logging default.
 * @zh auto_open_depth - 记录日志时自动展开的树深度；-1 使用当前日志默认值。
 * @ja auto_open_depth - ログ記録時に自動展開するツリー深度です。-1 は現在の既定値を使います。
 * @ko auto_open_depth - 로그 기록 중 자동으로 펼칠 트리 깊이입니다. -1은 현재 로그 기본값입니다.
 *
 * @param filename - Log destination path; null uses the native default,
 * "imgui_log.txt". The native default-filename setting is not exposed in JS.
 * @zh filename - 日志输出路径；null 使用原生默认值 "imgui_log.txt"。JS 未暴露默认文件名的配置字段。
 * @ja filename - ログの出力先パスです。null はネイティブの既定値 "imgui_log.txt" を使います。
 * 既定のファイル名を設定するフィールドは JS では公開されていません。
 * @ko filename - 로그 출력 경로입니다. null은 네이티브 기본값 "imgui_log.txt"를 사용합니다.
 * 기본 파일명을 설정하는 필드는 JS에 노출되지 않습니다.
 */
export function LogToFile(
  auto_open_depth: number = -1,
  filename: string | Uint8Array | null = null,
): void {
  native.LogToFile(auto_open_depth, filename);
}

/**
 * Start logging to OS clipboard.
 *
 * @zh 开始向操作系统剪贴板记录日志。
 * @ja OS のクリップボードへのログ記録を開始します。
 * @ko OS 클립보드로 로그 기록을 시작합니다.
 *
 * @param auto_open_depth - Tree depth automatically expanded while logging; -1
 * uses the current logging default.
 * @zh auto_open_depth - 记录日志时自动展开的树深度；-1 使用当前日志默认值。
 * @ja auto_open_depth - ログ記録時に自動展開するツリー深度です。-1 は現在の既定値を使います。
 * @ko auto_open_depth - 로그 기록 중 자동으로 펼칠 트리 깊이입니다. -1은 현재 로그 기본값입니다.
 */
export function LogToClipboard(auto_open_depth: number = -1): void {
  native.LogToClipboard(auto_open_depth);
}

/**
 * Stop logging (close file, etc.).
 *
 * @zh 停止记录日志（关闭文件等）。
 * @ja ログ記録を停止します（ファイルを閉じるなど）。
 * @ko 로그 기록을 중단합니다(파일 닫기 등).
 */
export function LogFinish(): void {
  native.LogFinish();
}

/**
 * Display controls for capturing interface text.
 *
 * @zh 显示用于捕获界面文本的控件。
 * @ja インターフェイスのテキストを記録する操作ボタンを表示します。
 * @ko 인터페이스 텍스트 캡처 조작 버튼을 표시합니다.
 *
 * @remarks
 * helper to display buttons for logging to tty/file/clipboard
 * @zh
 * 显示用于向 tty/文件/剪贴板记录日志的按钮的辅助函数。
 * @ja
 * tty/ファイル/クリップボードへのログ記録ボタンを表示するヘルパーです。
 * @ko
 * tty/파일/클립보드 로그 기록 버튼을 표시하는 헬퍼입니다.
 */
export function LogButtons(): void {
  native.LogButtons();
}

/**
 * Pass text data straight to log (without being displayed).
 *
 * @zh 将文本数据直接传入日志（不显示在界面中）。
 * @ja テキストデータを表示せずに直接ログへ渡します。
 * @ko 텍스트 데이터를 화면에 표시하지 않고 로그로 직접 전달합니다.
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
export function LogTextUnformatted(text: string | Uint8Array): void {
  native.LogTextUnformatted(text);
}
