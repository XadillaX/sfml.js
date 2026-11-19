import { native } from '../internal/native';
import type { LogType } from '../platform/system-interface';

/**
 * Application logging through Rml::Log and the selected system interface.
 *
 * @zh 通过原生 Rml::Log 与所选系统接口输出应用日志。
 * @ja ネイティブ Rml::Log と選択したシステムを介するアプリケーションログ。
 * @ko 네이티브 Rml::Log와 선택한 시스템 인터페이스를 통한 애플리케이션 로그입니다.
 * @remarks
 * Each call formats and dispatches in one native entry. Uses the checked scalar
 * printf domain of {@link createString}. Native logging retains its 1,021-byte
 * payload limit and stops at NUL. It works before initialization. Runtime
 * ownership and callback reentry guards still apply; callback errors propagate.
 * @zh 每次调用在一个原生入口内完成格式化和派发。采用 {@link createString}
 * 的受检查标量 printf 域。原生日志保留 1,021 字节限制并在 NUL 处终止。
 * 初始化前即可使用；仍检查运行时归属和回调重入，回调异常会传播。
 * @ja 1 回のネイティブ呼び出しで整形と配信を行います。{@link createString}
 * と同じ検証済みスカラー printf を使います。1,021 バイトの制限と NUL
 * 終端を保持し、初期化前にも使えます。所有者と再入を検証し、例外を伝播します。
 * @ko 한 번의 네이티브 진입에서 서식 적용과 전달을 수행합니다.
 * {@link createString}의 검증된 스칼라 printf를 사용하며 1,021바이트 제한과
 * NUL 종료를 유지합니다. 초기화 전에도 사용하며 소유권과 재진입을 검사하고
 * 콜백 예외를 전파합니다.
 */
export class Log {
  /**
   * Static native logging operations are not instantiated.
   *
   * @zh 原生静态日志操作不需要实例化。
   * @ja ネイティブの静的ログ操作はインスタンス化しません。
   * @ko 네이티브 정적 로그 작업은 인스턴스화하지 않습니다.
   */
  private constructor() {}

  /**
   * Format and send a message using Rml::Log::Message.
   *
   * @zh 通过 Rml::Log::Message 格式化并发送消息。
   * @ja Rml::Log::Message でメッセージを整形して送ります。
   * @ko Rml::Log::Message로 메시지 서식을 적용하고 전달합니다.
   * @param type - Native severity from Always through Debug.
   * @zh type - Always 到 Debug 的原生级别。
   * @ja type - Always から Debug までのレベル。
   * @ko type - Always부터 Debug까지의 네이티브 수준입니다.
   * @param format - Checked scalar printf format without embedded NUL.
   * @zh format - 不含 NUL 的受检查标量 printf 格式。
   * @ja format - NUL を含まない検証済みスカラー printf 書式。
   * @ko format - NUL이 없는 검증된 스칼라 printf 서식입니다.
   * @param values - Ordered string or numeric arguments; defaults to none.
   * @zh values - 有序字符串或数值参数；默认无参数。
   * @ja values - 順序付きの文字列または数値。既定は引数なし。
   * @ko values - 순서대로 전달하는 문자열 또는 숫자이며 기본값은 인수 없음입니다.
   */
  static message(
    type: LogType, format: string, ...values: (string | number)[]
  ): void {
    native.logMessage(type, format, values);
  }

  /**
   * Format a parse error with the native filename and optional line prefix.
   *
   * @zh 使用原生文件名及可选行号前缀格式化解析错误。
   * @ja ネイティブのファイル名と任意の行番号を付けて解析エラーを整形。
   * @ko 네이티브 파일명과 선택적인 줄 번호 접두사로 구문 오류를 표시합니다.
   * @param filename - Source filename, retained by the call as UTF-8.
   * @zh filename - 源文件名；调用期间以 UTF-8 保存。
   * @ja filename - ソースのファイル名。呼び出し中は UTF-8 で保持。
   * @ko filename - 소스 파일명이며 호출 동안 UTF-8로 유지합니다.
   * @param line - Signed native int; a negative value omits the line prefix.
   * @zh line - 有符号原生 int；负值省略行号前缀。
   * @ja line - 符号付きネイティブ int。負数なら行番号を省略。
   * @ko line - 부호 있는 네이티브 int이며 음수는 줄 번호를 생략합니다.
   * @param format - Checked scalar printf format without embedded NUL.
   * @zh format - 不含 NUL 的受检查标量 printf 格式。
   * @ja format - NUL を含まない検証済みスカラー printf 書式。
   * @ko format - NUL이 없는 검증된 스칼라 printf 서식입니다.
   * @param values - Ordered string or numeric arguments; defaults to none.
   * @zh values - 有序字符串或数值参数；默认无参数。
   * @ja values - 順序付きの文字列または数値。既定は引数なし。
   * @ko values - 순서대로 전달하는 문자열 또는 숫자이며 기본값은 인수 없음입니다.
   * @remarks
   * Keeps Rml::Log::ParseError's two truncation stages and Error severity.
   * @zh 保留 Rml::Log::ParseError 的两阶段原生截断，级别为 Error。
   * @ja Rml::Log::ParseError の 2 段階の切り詰めと Error レベルを保持します。
   * @ko Rml::Log::ParseError의 두 단계 잘림과 Error 수준을 유지합니다.
   */
  static parseError(
    filename: string, line: number, format: string,
    ...values: (string | number)[]
  ): void {
    native.logParseError(filename, line, format, values);
  }
}
