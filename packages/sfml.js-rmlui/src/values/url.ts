import { native } from '../internal/native';

/**
 * Native Rml::URL resource parser, independent of runtime initialisation.
 *
 * @zh 原生 Rml::URL 资源解析器，无需初始化运行时。
 * @ja 初期化不要のネイティブ Rml::URL リソース解析器。
 * @ko 초기화가 필요 없는 네이티브 Rml::URL 리소스 파서입니다.
 * @remarks
 * Uses RmlUi resource URL rules. Parameter order is native unordered-map
 * order. The native owner is released when the wrapper is collected.
 * @zh 使用 RmlUi 资源 URL 规则；参数采用原生无序映射顺序，包装器回收时释放所有者。
 * @ja RmlUi の規則と非順序パラメータを使い、GC 時に所有者を解放します。
 * @ko RmlUi 규칙과 비정렬 매개변수 순서를 사용하며 GC 시 소유자를 해제합니다.
 */
export class URL {
  #handle: object;

  /**
   * Construct Rml::URL from UTF-8 text.
   *
   * @zh 从 UTF-8 文本构造 Rml::URL。
   * @ja UTF-8 テキストから Rml::URL を構築します。
   * @ko UTF-8 텍스트로 Rml::URL을 생성합니다.
   * @param value - Resource URL; empty by default.
   * @zh value - 资源 URL，默认为空字符串。
   * @ja value - リソース URL。既定は空文字列です。
   * @ko value - 리소스 URL이며 기본값은 빈 문자열입니다.
   */
  constructor(value = '') {
    this.#handle = native.createURL(value);
  }

  /**
   * Replace all components through Rml::URL::SetURL.
   *
   * @zh 通过 Rml::URL::SetURL 替换全部组件。
   * @ja Rml::URL::SetURL で全要素を置換します。
   * @ko Rml::URL::SetURL로 모든 구성 요소를 교체합니다.
   * @param value - Replacement resource URL.
   * @zh value - 替换后的资源 URL。
   * @ja value - 置換するリソース URL。
   * @ko value - 교체할 리소스 URL입니다.
   * @returns Native parsing success; malformed input can leave partial state.
   * @zh 原生解析是否成功；无效输入可能保留部分解析状态。
   * @ja ネイティブ解析の成功。不正な入力では一部状態が残る場合があります。
   * @ko 네이티브 파싱 성공 여부이며 잘못된 입력은 일부 상태를 남길 수 있습니다.
   */
  setURL(value: string): boolean {
    return native.urlSetURL(this.#handle, value);
  }

  /**
   * Read the reconstructed Rml::URL::GetURL string.
   *
   * @zh 读取 Rml::URL::GetURL 重建的字符串。
   * @ja Rml::URL::GetURL の再構築文字列を取得します。
   * @ko Rml::URL::GetURL의 재구성 문자열을 읽습니다.
   * @returns Complete resource URL.
   * @zh 完整资源 URL。
   * @ja 完全なリソース URL。
   * @ko 전체 리소스 URL입니다.
   */
  getURL(): string {
    return native.urlGetURL(this.#handle);
  }

  /**
   * Set the URL protocol without the separator.
   *
   * @zh 设置 URL 协议，不含分隔符。
   * @ja 区切りを含めず URL のプロトコルを設定します。
   * @ko 구분자 없이 URL 프로토콜을 설정합니다.
   * @param value - Protocol without separator.
   * @zh value - 不含分隔符的协议。
   * @ja value - 区切りを含まないプロトコル。
   * @ko value - 구분자가 없는 프로토콜입니다.
   * @returns Native setter result.
   * @zh 原生设置结果。
   * @ja ネイティブ設定の結果。
   * @ko 네이티브 설정 결과입니다.
   */
  setProtocol(value: string): boolean {
    return native.urlSetProtocol(this.#handle, value);
  }

  /**
   * Get the URL protocol.
   *
   * @zh 获取 URL 协议。
   * @ja URL のプロトコルを取得します。
   * @ko URL 프로토콜을 가져옵니다.
   * @returns Protocol.
   * @zh 协议。
   * @ja プロトコル。
   * @ko 프로토콜입니다.
   */
  getProtocol(): string {
    return native.urlGetProtocol(this.#handle);
  }

  /**
   * Set the login name in the URL authority.
   *
   * @zh 设置 URL 授权部分的登录名。
   * @ja URL のオーソリティ部分のログイン名を設定します。
   * @ko URL 권한 부분의 로그인 이름을 설정합니다.
   * @param value - Login text.
   * @zh value - 登录名文本。
   * @ja value - ログイン名のテキスト。
   * @ko value - 로그인 이름 텍스트입니다.
   * @returns Native setter result.
   * @zh 原生设置结果。
   * @ja ネイティブ設定の結果。
   * @ko 네이티브 설정 결과입니다.
   */
  setLogin(value: string): boolean {
    return native.urlSetLogin(this.#handle, value);
  }

  /**
   * Get the login name in the URL authority.
   *
   * @zh 获取 URL 授权部分的登录名。
   * @ja URL のオーソリティ部分のログイン名を取得します。
   * @ko URL 권한 부분의 로그인 이름을 가져옵니다.
   * @returns Login text.
   * @zh 登录名文本。
   * @ja ログイン名のテキスト。
   * @ko 로그인 이름 텍스트입니다.
   */
  getLogin(): string {
    return native.urlGetLogin(this.#handle);
  }

  /**
   * Set the password in the URL authority.
   *
   * @zh 设置 URL 授权部分的密码。
   * @ja URL のオーソリティ部分のパスワードを設定します。
   * @ko URL 권한 부분의 비밀번호를 설정합니다.
   * @param value - Password text.
   * @zh value - 密码文本。
   * @ja value - パスワードのテキスト。
   * @ko value - 비밀번호 텍스트입니다.
   * @returns Native setter result.
   * @zh 原生设置结果。
   * @ja ネイティブ設定の結果。
   * @ko 네이티브 설정 결과입니다.
   */
  setPassword(value: string): boolean {
    return native.urlSetPassword(this.#handle, value);
  }

  /**
   * Get the password in the URL authority.
   *
   * @zh 获取 URL 授权部分的密码。
   * @ja URL のオーソリティ部分のパスワードを取得します。
   * @ko URL 권한 부분의 비밀번호를 가져옵니다.
   * @returns Password text.
   * @zh 密码文本。
   * @ja パスワードのテキスト。
   * @ko 비밀번호 텍스트입니다.
   */
  getPassword(): string {
    return native.urlGetPassword(this.#handle);
  }

  /**
   * Set the host component of the URL.
   *
   * @zh 设置 URL 主机部分。
   * @ja URL のホスト部分を設定します。
   * @ko URL 호스트 부분을 설정합니다.
   * @param value - Host text.
   * @zh value - 主机文本。
   * @ja value - ホストのテキスト。
   * @ko value - 호스트 텍스트입니다.
   * @returns Native setter result.
   * @zh 原生设置结果。
   * @ja ネイティブ設定の結果。
   * @ko 네이티브 설정 결과입니다.
   */
  setHost(value: string): boolean {
    return native.urlSetHost(this.#handle, value);
  }

  /**
   * Get the host component of the URL.
   *
   * @zh 获取 URL 主机部分。
   * @ja URL のホスト部分を取得します。
   * @ko URL 호스트 부분을 가져옵니다.
   * @returns Host text.
   * @zh 主机文本。
   * @ja ホストのテキスト。
   * @ko 호스트 텍스트입니다.
   */
  getHost(): string {
    return native.urlGetHost(this.#handle);
  }

  /**
   * Set Rml::URL::SetPort using a checked signed 32-bit integer.
   *
   * @zh 用经校验的有符号 32 位整数设置 Rml::URL::SetPort。
   * @ja 検証した符号付き 32 ビット整数でポートを設定します。
   * @ko 검증한 부호 있는 32비트 정수로 포트를 설정합니다.
   * @param value - Native port value.
   * @zh value - 原生端口值，须为有符号 32 位整数。
   * @ja value - 符号付き 32 ビット整数のネイティブポート値。
   * @ko value - 부호 있는 32비트 정수인 네이티브 포트 값입니다.
   * @returns Native setter result.
   * @zh 原生设置结果。
   * @ja ネイティブ設定の結果。
   * @ko 네이티브 설정 결과입니다.
   */
  setPort(value: number): boolean {
    return native.urlSetPort(this.#handle, value);
  }

  /**
   * Get the numeric port of the URL.
   *
   * @zh 获取 URL 的数字端口。
   * @ja URL の数値ポートを取得します。
   * @ko URL 숫자 포트를 가져옵니다.
   * @returns Native port.
   * @zh 原生端口。
   * @ja ネイティブポート。
   * @ko 네이티브 포트입니다.
   */
  getPort(): number {
    return native.urlGetPort(this.#handle);
  }

  /**
   * Set Rml::URL::SetPath without implicit trailing slash insertion.
   *
   * @zh 设置 Rml::URL::SetPath，不自动添加结尾斜杠。
   * @ja 末尾スラッシュを追加せずパスを設定します。
   * @ko 끝 슬래시를 자동 추가하지 않고 경로를 설정합니다.
   * @param value - Path prefix before file name.
   * @zh value - 文件名前的路径。
   * @ja value - ファイル名の前にあるパス。
   * @ko value - 파일 이름 앞의 경로입니다.
   * @returns Native setter result.
   * @zh 原生设置结果。
   * @ja ネイティブ設定の結果。
   * @ko 네이티브 설정 결과입니다.
   */
  setPath(value: string): boolean {
    return native.urlSetPath(this.#handle, value);
  }

  /**
   * Prefix Rml::URL::PrefixPath, adding a separator when needed.
   *
   * @zh 用 Rml::URL::PrefixPath 添加前缀，按需插入分隔符。
   * @ja Rml::URL::PrefixPath で必要な区切りと接頭辞を追加します。
   * @ko Rml::URL::PrefixPath로 필요한 구분자와 접두 경로를 추가합니다.
   * @param value - Prefix path.
   * @zh value - 添加到现有路径前的路径。
   * @ja value - 既存のパスの前に付けるパス。
   * @ko value - 기존 경로 앞에 추가할 경로입니다.
   * @returns Native setter result.
   * @zh 原生设置结果。
   * @ja ネイティブ設定の結果。
   * @ko 네이티브 설정 결과입니다.
   */
  prefixPath(value: string): boolean {
    return native.urlPrefixPath(this.#handle, value);
  }

  /**
   * Get the directory path before the file name.
   *
   * @zh 获取文件名之前的目录路径。
   * @ja ファイル名より前のディレクトリパスを取得します。
   * @ko 파일 이름 앞의 디렉터리 경로를 가져옵니다.
   * @returns Path before file name.
   * @zh 文件名前的路径。
   * @ja ファイル名の前にあるパス。
   * @ko 파일 이름 앞의 경로입니다.
   */
  getPath(): string {
    return native.urlGetPath(this.#handle);
  }

  /**
   * Set the file name without its extension.
   *
   * @zh 设置不含扩展名的文件名。
   * @ja 拡張子を含めずファイル名を設定します。
   * @ko 확장자 없는 파일 이름을 설정합니다.
   * @param value - File name without extension.
   * @zh value - 不含扩展名的文件名。
   * @ja value - 拡張子を含まないファイル名。
   * @ko value - 확장자가 없는 파일 이름입니다.
   * @returns Native setter result.
   * @zh 原生设置结果。
   * @ja ネイティブ設定の結果。
   * @ko 네이티브 설정 결과입니다.
   */
  setFileName(value: string): boolean {
    return native.urlSetFileName(this.#handle, value);
  }

  /**
   * Get the file name without its extension.
   *
   * @zh 获取不含扩展名的文件名。
   * @ja 拡張子を含めずファイル名を取得します。
   * @ko 확장자 없는 파일 이름을 가져옵니다.
   * @returns File name without extension.
   * @zh 不含扩展名的文件名。
   * @ja 拡張子を含まないファイル名。
   * @ko 확장자가 없는 파일 이름입니다.
   */
  getFileName(): string {
    return native.urlGetFileName(this.#handle);
  }

  /**
   * Set the file extension without the leading dot.
   *
   * @zh 设置不含前导点的扩展名。
   * @ja 先頭の点を含めず拡張子を設定します。
   * @ko 앞의 점 없이 확장자를 설정합니다.
   * @param value - Extension without dot.
   * @zh value - 不含点号的扩展名。
   * @ja value - ドットを含まない拡張子。
   * @ko value - 점이 없는 확장자입니다.
   * @returns Native setter result.
   * @zh 原生设置结果。
   * @ja ネイティブ設定の結果。
   * @ko 네이티브 설정 결과입니다.
   */
  setExtension(value: string): boolean {
    return native.urlSetExtension(this.#handle, value);
  }

  /**
   * Get the file extension without the leading dot.
   *
   * @zh 获取不含前导点的扩展名。
   * @ja 先頭の点を含めず拡張子を取得します。
   * @ko 앞의 점 없이 확장자를 가져옵니다.
   * @returns Extension without dot.
   * @zh 不含点号的扩展名。
   * @ja ドットを含まない拡張子。
   * @ko 점이 없는 확장자입니다.
   */
  getExtension(): string {
    return native.urlGetExtension(this.#handle);
  }

  /**
   * Copy Rml::URL::GetParameters into an independent object.
   *
   * @zh 将 Rml::URL::GetParameters 复制为独立对象。
   * @ja Rml::URL::GetParameters を独立オブジェクトへコピーします。
   * @ko Rml::URL::GetParameters를 독립 객체로 복사합니다.
   * @returns Parameter snapshot, including keys such as "__proto__".
   * @zh 参数快照，包括「__proto__」等键。
   * @ja 「__proto__」などのキーも含むパラメータコピー。
   * @ko 「__proto__」와 같은 키도 포함하는 매개변수 복사본입니다.
   */
  getParameters(): Record<string, string> {
    return native.urlGetParameters(this.#handle);
  }

  /**
   * Set one Rml::URL::SetParameter entry.
   *
   * @zh 设置一个 Rml::URL::SetParameter 条目。
   * @ja Rml::URL::SetParameter の一項目を設定します。
   * @ko Rml::URL::SetParameter의 항목 하나를 설정합니다.
   * @param name - Parameter name.
   * @zh name - 参数名。
   * @ja name - パラメータ名。
   * @ko name - 매개변수 이름입니다.
   * @param value - Parameter value.
   * @zh value - 参数值。
   * @ja value - パラメータ値。
   * @ko value - 매개변수 값입니다.
   */
  setParameter(name: string, value: string): void {
    native.urlSetParameter(this.#handle, name, value);
  }

  /**
   * Replace Rml::URL::SetParameters after validating every entry.
   *
   * @zh 校验全部条目后替换 Rml::URL::SetParameters。
   * @ja 全項目の検証後に Rml::URL::SetParameters を置換します。
   * @ko 모든 항목을 검증한 뒤 Rml::URL::SetParameters를 교체합니다.
   * @param values - Own string properties of the parameter object.
   * @zh values - 参数对象自身的字符串属性。
   * @ja values - パラメータオブジェクト自身の文字列プロパティ。
   * @ko values - 매개변수 객체 자체의 문자열 속성입니다.
   */
  setParameters(values: Readonly<Record<string, string>>): void {
    native.urlSetParameters(this.#handle, values);
  }

  /**
   * Clear Rml::URL::ClearParameters and invalidate its query cache.
   *
   * @zh 清除 Rml::URL::ClearParameters 并使查询缓存失效。
   * @ja Rml::URL::ClearParameters でクエリキャッシュも破棄します。
   * @ko Rml::URL::ClearParameters로 쿼리 캐시도 무효화합니다.
   */
  clearParameters(): void {
    native.urlClearParameters(this.#handle);
  }

  /**
   * Get the combined path, file name and extension.
   *
   * @zh 获取组合后的路径、文件名和扩展名。
   * @ja パス・ファイル名・拡張子を結合して取得します。
   * @ko 경로·파일 이름·확장자를 합쳐 가져옵니다.
   * @returns Path, file name and extension.
   * @zh 路径、文件名与扩展名。
   * @ja パス、ファイル名と拡張子。
   * @ko 경로, 파일 이름 및 확장자입니다.
   */
  getPathedFileName(): string {
    return native.urlGetPathedFileName(this.#handle);
  }

  /**
   * Read Rml::URL::GetQueryString with native percent encoding.
   *
   * @zh 读取使用原生百分号编码的 Rml::URL::GetQueryString。
   * @ja ネイティブ百分率符号化のクエリ文字列を取得します。
   * @ko 네이티브 퍼센트 인코딩 쿼리 문자열을 읽습니다.
   * @returns Query without the leading question mark.
   * @zh 不含开头问号的查询字符串。
   * @ja 先頭の疑問符を含まないクエリ文字列。
   * @ko 처음의 물음표가 없는 쿼리 문자열입니다.
   */
  getQueryString(): string {
    return native.urlGetQueryString(this.#handle);
  }

  /**
   * Compare native reconstructed bytes with Rml::URL::operator&lt;.
   *
   * @zh 用 Rml::URL 的小于运算比较原生重建字节。
   * @ja Rml::URL の小なり演算子で再構築バイト列を比較します。
   * @ko Rml::URL의 작음 연산자로 재구성 바이트를 비교합니다.
   * @param other - Other native URL.
   * @zh other - 另一个原生 URL。
   * @ja other - 比較するネイティブ URL。
   * @ko other - 비교할 네이티브 URL입니다.
   * @returns Whether this URL sorts before the other.
   * @zh 此 URL 是否排在另一个 URL 前。
   * @ja この URL が比較相手より前に並ぶかどうか。
   * @ko 이 URL이 다른 URL보다 앞에 정렬되는지 여부입니다.
   */
  lessThan(other: URL): boolean {
    return native.urlLessThan(this.#handle, other.#handle);
  }

  /**
   * Encode all UTF-8 bytes with Rml::URL::UrlEncode, including embedded NUL.
   *
   * @zh 用 Rml::URL::UrlEncode 编码全部 UTF-8 字节，包括嵌入 NUL。
   * @ja 埋め込み NUL を含む全 UTF-8 バイトを符号化します。
   * @ko 내장 NUL을 포함한 모든 UTF-8 바이트를 인코딩합니다.
   * @param value - Text to encode.
   * @zh value - 要编码的文本。
   * @ja value - 符号化するテキスト。
   * @ko value - 인코딩할 텍스트입니다.
   * @returns Native percent-encoded text.
   * @zh 原生百分号编码文本。
   * @ja ネイティブのパーセント符号化テキスト。
   * @ko 네이티브 퍼센트 인코딩 텍스트입니다.
   */
  static urlEncode(value: string): string {
    return native.urlEncode(value);
  }

  /**
   * Decode Rml::URL::UrlDecode, including its permissive escape handling.
   *
   * @zh 用 Rml::URL::UrlDecode 解码，保留其宽松转义处理。
   * @ja Rml::URL::UrlDecode の寛容なエスケープ規則で復号します。
   * @ko Rml::URL::UrlDecode의 관대한 이스케이프 규칙으로 디코딩합니다.
   * @param value - Encoded text; "+" becomes a space.
   * @zh value - 已编码文本；「+」转换为空格。
   * @ja value - 符号化テキスト。「+」は空白になります。
   * @ko value - 인코딩된 텍스트이며「+」는 공백으로 변환됩니다.
   * @returns Decoded UTF-8 text; invalid UTF-8 becomes replacement characters.
   * @zh 解码后的 UTF-8 文本，无效 UTF-8 使用替换字符。
   * @ja 無効な UTF-8 を置換した復号テキスト。
   * @ko 잘못된 UTF-8을 대체 문자로 처리한 디코딩 텍스트입니다.
   */
  static urlDecode(value: string): string {
    return native.urlDecode(value);
  }
}
