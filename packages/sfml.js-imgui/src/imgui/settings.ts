import { native } from '../internal/native';

/**
 * Get text from the operating-system clipboard.
 *
 * @zh 获取操作系统剪贴板中的文本。
 * @ja OS のクリップボードからテキストを取得します。
 * @ko 운영체제 클립보드에서 텍스트를 가져옵니다.
 *
 * @remarks
 * - Also see the LogToClipboard() function to capture GUI into clipboard, or
 *   easily output text data to the clipboard.
 * @zh
 * 剪贴板工具。
 *
 * - 另见 LogToClipboard()，可将 GUI 捕获到剪贴板，或便捷地将文本数据输出到剪贴板。
 * @ja
 * クリップボードユーティリティ。
 *
 * - GUI をクリップボードに取り込んだり、テキストデータを手軽に出力したりするには LogToClipboard() も参照してください。
 * @ko
 * 클립보드 유틸리티.
 *
 * - GUI를 클립보드로 캡처하거나 텍스트 데이터를 쉽게 출력하려면 LogToClipboard()도 참조하세요.
 *
 * @returns Clipboard text copied to a JS string, or null when the native
 * clipboard getter returns no text.
 * @zh 复制为 JS 字符串的剪贴板文字；原生剪贴板获取器没有返回文字时为 null。
 * @ja JS 文字列へコピーしたクリップボード内容です。ネイティブが文字列を返さなければ null です。
 * @ko JS 문자열로 복사한 클립보드 텍스트입니다. 네이티브 getter가 텍스트를 반환하지 않으면 null입니다.
 */
export function GetClipboardText(): string | null {
  return native.GetClipboardText();
}

/**
 * Replace the clipboard text through the configured platform clipboard handler.
 *
 * @zh 通过已配置的平台剪贴板处理器替换剪贴板文本。
 * @ja 設定済みのプラットフォーム用クリップボード処理でクリップボードのテキストを置き換えます。
 * @ko 설정된 플랫폼 클립보드 처리기를 통해 클립보드 텍스트를 바꿉니다.
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
export function SetClipboardText(text: string | Uint8Array): void {
  native.SetClipboardText(text);
}

/**
 * Load interface settings from an INI file.
 *
 * @zh 从 INI 文件加载界面设置。
 * @ja INI ファイルからインターフェイス設定を読み込みます。
 * @ko INI 파일에서 인터페이스 설정을 불러옵니다.
 *
 * @remarks
 * Call after SFML.Init(window) succeeds and before the first SFML.Update(...)
 * to load settings from your chosen file.
 *
 * Native automatic persistence defaults to "imgui.ini", relative to the
 * current working directory. This binding does not expose its filename
 * configuration or a way to disable automatic saving. Loading a file here
 * does not change the automatic save destination.
 * @zh
 * 在 SFML.Init(window) 成功之后、首次 SFML.Update(...) 之前调用，从指定文件加载设置。
 *
 * 原生自动持久化默认使用相对于当前工作目录的 "imgui.ini"。此绑定未暴露自动持久化的文件名配置，
 * 也未提供禁用自动保存的方法。此处加载的文件不会改变自动保存的目标路径。
 * @ja
 * SFML.Init(window) が成功した後、最初の SFML.Update(...) より前に呼び、指定したファイルから設定を読み込みます。
 *
 * ネイティブの自動保存・読み込みは、作業ディレクトリからの相対パス "imgui.ini" を既定で使います。
 * このバインディングには、そのファイル名の設定や自動保存を無効にする API はありません。
 * ここで別のファイルを読み込んでも、自動保存先は変わりません。
 * @ko
 * SFML.Init(window)가 성공한 후 첫 SFML.Update(...) 전에 호출하여 지정한 파일에서 설정을 불러옵니다.
 *
 * 네이티브 자동 저장 및 불러오기는 현재 작업 디렉터리 기준 "imgui.ini"를 기본값으로 사용합니다.
 * 이 바인딩은 해당 파일명 설정이나 자동 저장을 끄는 API를 노출하지 않습니다.
 * 여기서 다른 파일을 불러와도 자동 저장 경로는 바뀌지 않습니다.
 *
 * @param ini_filename - Filesystem path of the ImGui settings file to load or
 * save.
 * @zh ini_filename - 要加载或保存的 ImGui 配置文件路径。
 * @ja ini_filename - 読み込みまたは保存する ImGui 設定ファイルのパスです。
 * @ko ini_filename - 읽거나 저장할 ImGui 설정 파일의 경로입니다.
 */
export function LoadIniSettingsFromDisk(
  ini_filename: string | Uint8Array,
): void {
  native.LoadIniSettingsFromDisk(ini_filename);
}

/**
 * Load interface settings from INI text in memory.
 *
 * @zh 从内存中的 INI 文本加载界面设置。
 * @ja メモリ上の INI テキストからインターフェイス設定を読み込みます。
 * @ko 메모리의 INI 텍스트에서 인터페이스 설정을 불러옵니다.
 *
 * @remarks
 * Call after SFML.Init(window) succeeds and before the first SFML.Update(...)
 * to provide INI data from your own data source.
 * @zh
 * 在 SFML.Init(window) 成功之后、首次 SFML.Update(...) 之前调用，以从自己的数据源提供 INI 数据。
 * @ja
 * 独自の INI データを渡すには、SFML.Init(window) の成功後、最初の SFML.Update(...) より前に呼びます。
 * @ko
 * 자체 INI 데이터를 제공하려면 SFML.Init(window)가 성공한 후 첫 SFML.Update(...) 전에 호출합니다.
 *
 * @param ini_data - UTF-8 serialized ImGui settings to load from memory.
 * @zh ini_data - 要从内存加载的 UTF-8 序列化 ImGui 配置。
 * @ja ini_data - メモリーから読み込む UTF-8 の ImGui 設定データです。
 * @ko ini_data - 메모리에서 읽을 UTF-8 직렬화 ImGui 설정입니다.
 *
 * @param ini_size - Length of ini_data in bytes; 0 reads through its NUL
 * terminator.
 * @zh ini_size - ini_data 的字节长度；0 读取至 NUL 终止符。
 * @ja ini_size - ini_data のバイト長です。0 は NUL 終端まで読みます。
 * @ko ini_size - ini_data의 바이트 길이입니다. 0은 NUL 종료까지 읽습니다.
 */
export function LoadIniSettingsFromMemory(
  ini_data: string | Uint8Array,
  ini_size: number = 0,
): void {
  native.LoadIniSettingsFromMemory(ini_data, ini_size);
}

/**
 * Save interface settings to an INI file.
 *
 * @zh 将界面设置保存到 INI 文件。
 * @ja インターフェイス設定を INI ファイルに保存します。
 * @ko 인터페이스 설정을 INI 파일에 저장합니다.
 *
 * @remarks
 * Save explicitly to the supplied path. Native automatic saving is separate:
 * it saves to "imgui.ini" by default after settings change and when the context
 * is destroyed. Its filename and disable switch are not exposed by this
 * binding.
 * @zh
 * 显式保存到指定路径。原生自动保存独立进行，默认在设置变化后及上下文销毁时保存到 "imgui.ini"。
 * 此绑定未暴露自动保存的文件名配置或禁用开关。
 * @ja
 * 指定したパスに明示的に保存します。ネイティブの自動保存は別に行われ、既定では設定変更後と
 * コンテキスト破棄時に "imgui.ini" へ保存します。そのファイル名の設定や無効化はこのバインディングでは公開されていません。
 * @ko
 * 지정한 경로에 명시적으로 저장합니다. 네이티브 자동 저장은 별도로 동작하며, 기본적으로 설정 변경 후와
 * 컨텍스트가 파괴될 때 "imgui.ini"에 저장합니다. 이 바인딩은 자동 저장 파일명 설정이나 비활성화 옵션을 노출하지 않습니다.
 *
 * @param ini_filename - Filesystem path of the ImGui settings file to load or
 * save.
 * @zh ini_filename - 要加载或保存的 ImGui 配置文件路径。
 * @ja ini_filename - 読み込みまたは保存する ImGui 設定ファイルのパスです。
 * @ko ini_filename - 읽거나 저장할 ImGui 설정 파일의 경로입니다.
 */
export function SaveIniSettingsToDisk(ini_filename: string | Uint8Array): void {
  native.SaveIniSettingsToDisk(ini_filename);
}

/**
 * Serialize interface settings as INI text.
 *
 * @zh 将界面设置序列化为 INI 文本。
 * @ja インターフェイス設定を INI テキストに変換します。
 * @ko 인터페이스 설정을 INI 텍스트로 직렬화합니다.
 *
 * @remarks
 * Return INI data copied to a JS string without the native terminating NUL.
 * Save the returned text using your own storage.
 *
 * If WantSaveIniSettings is set on the IO field view from
 * ImGui.viewImGuiIO(ioHandle),
 * save the data and clear that flag. This binding does not expose the native
 * configuration needed to disable automatic file saving and use that workflow.
 * @zh
 * 返回复制为 JS 字符串的 INI 数据，不含原生末尾的 NUL。可自行保存返回的文本。
 *
 * 若 ImGui.viewImGuiIO(ioHandle) 返回的 IO 字段视图中 WantSaveIniSettings 已设置，
 * 应保存数据并清除此标志。此绑定未暴露禁用自动文件保存、启用这一流程所需的原生配置。
 * @ja
 * INI データを JS 文字列にコピーして返します。ネイティブの終端 NUL は含みません。返されたテキストを独自に保存できます。
 *
 * ImGui.viewImGuiIO(ioHandle) の IO フィールドビューで WantSaveIniSettings が立っている場合は、
 * 保存後にそのフラグを解除します。ただし、自動ファイル保存を無効化してこの方式を使うためのネイティブ設定は公開されていません。
 * @ko
 * INI 데이터를 JS 문자열로 복사해 반환하며 네이티브 끝 NUL은 포함하지 않습니다. 반환된 텍스트는 직접 저장할 수 있습니다.
 *
 * ImGui.viewImGuiIO(ioHandle)의 IO 필드 뷰에서 WantSaveIniSettings가 설정되어 있다면
 * 데이터를 저장하고 해당 플래그를 해제하세요. 다만 자동 파일 저장을 끄고 이 방식을 사용하는 데 필요한 네이티브 설정은 노출되지 않습니다.
 *
 * @param out_ini_size - Optional BigUint64Array[0] output receiving the
 * serialized byte length, excluding the NUL terminator. Pass BigUint64Array
 * storage, not a JS scalar; native access uses the supplied backing memory.
 * @zh out_ini_size - 可选的 BigUint64Array[0] 输出，接收不含 NUL 终止符的序列化字节长度。 请传入
 * BigUint64Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja out_ini_size - NUL を除く出力バイト長を書き込む任意の BigUint64Array[0] です。 JS スカラーではなく
 * BigUint64Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko out_ini_size - NUL 종료를 제외한 직렬화 바이트 길이를 받는 선택적 BigUint64Array[0] 출력입니다. JS
 * 스칼라가 아닌 BigUint64Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @returns Serialized ImGui settings copied to a JS string; out_ini_size
 * optionally receives the UTF-8 byte length.
 * @zh 复制为 JS 字符串的序列化 ImGui 配置；out_ini_size 可接收 UTF-8 字节长度。
 * @ja JS 文字列にコピーした ImGui 設定です。out_ini_size で UTF-8 バイト長も受け取れます。
 * @ko JS 문자열로 복사한 직렬화 ImGui 설정입니다. out_ini_size는 선택적으로 UTF-8 바이트 길이를 받습니다.
 */
export function SaveIniSettingsToMemory(
  out_ini_size: BigUint64Array | null = null,
): string | null {
  return native.SaveIniSettingsToMemory(out_ini_size);
}
