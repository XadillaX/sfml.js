/**
 * Runtime failure reported by the SFML binding.
 * @zh SFML 绑定报告的运行时错误。
 * @ja SFML バインディングが報告する実行時エラー。
 * @ko SFML 바인딩이 보고하는 런타임 오류.
 */
export class SFMLError extends Error {
  /**
   * Create an SFML runtime error with message as the error description.
   * @zh 创建 SFML 运行时错误，message 为错误描述。
   * @ja message をエラー説明とする SFML 実行時エラーを作成する。
   * @ko message를 오류 설명으로 하는 SFML 런타임 오류를 생성한다.
   */
  constructor(message?: string) {
    super(message);
    this.name = 'SFMLError';
  }
}
