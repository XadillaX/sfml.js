declare const classIdentifierBrand: unique symbol;

/**
 * Opaque equality token for Rml::ClassId, without exposing native addresses.
 *
 * @zh Rml::ClassId 的不透明相等性令牌，不暴露原生地址。
 * @ja ネイティブアドレスを公開しない Rml::ClassId の同値比較用トークン。
 * @ko 네이티브 주소를 노출하지 않는 Rml::ClassId 동등성 비교 토큰입니다.
 * @remarks
 * Obtain tokens from Element.getStaticClassIdentifier or getClassIdentifier.
 * Tokens survive runtime restart in this module; they are not serializable.
 * @zh 从 Element.getStaticClassIdentifier 或 getClassIdentifier 获取令牌。
 * 令牌在本模块的运行时重启后仍有效，不可序列化。
 * @ja Element.getStaticClassIdentifier または getClassIdentifier から取得します。
 * このモジュールのランタイム再起動後も有効ですが、シリアル化できません。
 * @ko Element.getStaticClassIdentifier 또는 getClassIdentifier로 얻습니다.
 * 이 모듈의 런타임 재시작 후에도 유효하지만 직렬화할 수 없습니다.
 */
export type ClassIdentifier = symbol & {
  /**
   * Compile-time class-token brand; not a runtime property to read or set.
   *
   * @zh 编译期类令牌标记，不是可读写的运行时属性。
   * @ja コンパイル時のクラストークンの印。実行時に読み書きする属性ではありません。
   * @ko 컴파일 시 클래스 토큰 표시이며 런타임에서 읽거나 쓰는 속성이 아닙니다.
   */
  readonly [classIdentifierBrand]: true;
};

const tokens = new Map<number, ClassIdentifier>();
const indices = new Map<ClassIdentifier, number>();

/**
 * Intern one native registry index as an opaque public symbol.
 *
 * @param index - Checked native class index.
 * @returns Stable symbol for that class.
 * @internal
 */
export function classIdentifier(index: number): ClassIdentifier {
  let token = tokens.get(index);
  if (token === undefined) {
    token = Symbol('RmlUi class') as ClassIdentifier;
    tokens.set(index, token);
    indices.set(token, index);
  }
  return token;
}

/**
 * Check that a public token came from this module.
 *
 * @param token - Public type token.
 * @returns Corresponding native registry index.
 * @internal
 */
export function classIndex(token: ClassIdentifier): number {
  const index = indices.get(token);
  if (index === undefined) {
    throw new TypeError('Expected a ClassIdentifier from this module');
  }
  return index;
}
