/**
 * One native data address component, with independently mutable name and index.
 *
 * @zh 一个原生数据地址分量，名称和索引可独立修改。
 * @ja 名前と添字を個別に変更できるネイティブデータアドレスの要素。
 * @ko 이름과 인덱스를 독립적으로 변경할 수 있는 네이티브 데이터 주소 요소입니다.
 */
export class DataAddressEntry {
  /**
   * Member name; empty for an entry constructed from an index.
   *
   * @zh 成员名称，由索引构造时为空字符串。
   * @ja メンバー名。添字から構築すると空文字列です。
   * @ko 멤버 이름이며 인덱스로 생성하면 빈 문자열입니다.
   */
  name: string;

  /**
   * Signed 32-bit array index; -1 for an entry constructed from a name.
   *
   * @zh 有符号 32 位数组索引，由名称构造时为 -1。
   * @ja 符号付き 32 ビット添字。名前から構築すると -1 です。
   * @ko 부호 있는 32비트 배열 인덱스이며 이름으로 생성하면 -1입니다.
   */
  index: number;

  /**
   * Construct Rml::DataAddressEntry from a name or signed 32-bit index.
   *
   * @zh 由名称或有符号 32 位索引构造 Rml::DataAddressEntry。
   * @ja 名前または符号付き 32 ビット添字から Rml::DataAddressEntry を構築します。
   * @ko 이름 또는 부호 있는 32비트 인덱스로 Rml::DataAddressEntry를 생성합니다.
   * @param value - Member name or array index.
   * @zh value - 成员名称或数组索引。
   * @ja value - メンバー名または配列の添字。
   * @ko value - 멤버 이름 또는 배열 인덱스입니다.
   */
  constructor(value: string | number) {
    if (typeof value === 'string') {
      this.name = value;
      this.index = -1;
    } else if (typeof value === 'number' && Number.isInteger(value) &&
               value >= -2147483648 && value <= 2147483647) {
      this.name = '';
      this.index = value;
    } else {
      throw new TypeError('Expected a name or signed 32-bit integer index');
    }
  }
}

/**
 * Ordered native root/member/index entries, copied when resolving a variable.
 *
 * @zh 有序的原生根、成员和索引地址项，解析变量时复制。
 * @ja 変数の解決時にコピーされる、ルート、メンバー、添字の順序付き要素。
 * @ko 변수를 찾을 때 복사하는 순서 있는 루트, 멤버 및 인덱스 항목입니다.
 */
export type DataAddress = readonly DataAddressEntry[];

/**
 * Native collection of dirty root variable names.
 *
 * @zh 原生脏根变量名称集合。
 * @ja 変更されたルート変数名のネイティブ集合。
 * @ko 변경된 루트 변수 이름의 네이티브 집합입니다.
 */
export type DirtyVariables = Set<string>;
