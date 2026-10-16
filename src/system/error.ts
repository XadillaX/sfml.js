/** Runtime failure reported by the SFML binding. */
export class SFMLError extends Error {
  /** 创建 SFML 运行时错误，message 为错误描述。 */
  constructor(message?: string) {
    super(message);
    this.name = 'SFMLError';
  }
}
