import { native } from '../../internal/native';
import { Property, propertyFromNative, propertyHandle } from './property';

const parsers = new WeakMap<PropertyParser, object>();

/**
 * Rml::ParameterMap, mapping own string keys to signed 32-bit integers.
 *
 * @zh Rml::ParameterMap，将自有字符串键映射到 32 位有符号整数。
 * @ja 自身の文字列キーから符号付き 32 ビット整数への Rml::ParameterMap。
 * @ko 자체 문자열 키를 부호 있는 32비트 정수에 매핑하는 Rml::ParameterMap입니다.
 */
export type ParameterMap = Record<string, number>;

/**
 * Rml::PropertyParser::ParseValue callback, returning synchronously.
 *
 * @zh Rml::PropertyParser::ParseValue 的同步回调。
 * @ja Rml::PropertyParser::ParseValue の同期コールバック。
 * @ko Rml::PropertyParser::ParseValue의 동기 콜백입니다.
 */
export interface PropertyParserCallback {
  /**
   * Parse a declaration synchronously into the supplied output copy.
   *
   * @zh 将声明同步解析到提供的输出副本。
   * @ja 提供された出力コピーに宣言を同期解析します。
   * @ko 제공된 출력 사본에 선언을 동기적으로 해석합니다.
   * @param property - Mutable output copy; later edits cannot affect parsing.
   * @zh property - 可修改的输出副本；回调后的修改不影响解析结果。
   * @ja property - 変更可能な出力コピー。復帰後の変更は解析結果に影響しません。
   * @ko property - 수정 가능한 출력 사본이며 반환 후 수정은 결과에 영향을 주지 않습니다.
   * @param value - Raw declaration text.
   * @zh value - 原始声明文本。
   * @ja value - 宣言の生のテキスト。
   * @ko value - 원시 선언 문자열입니다.
   * @param parameters - Copy of the native string-to-integer parameter map.
   * @zh parameters - 原生字符串到整数参数映射的副本。
   * @ja parameters - 文字列から整数へのネイティブ引数マップのコピー。
   * @ko parameters - 문자열에서 정수로 매핑하는 네이티브 매개변수 사본입니다.
   * @returns Whether parsing succeeded.
   * @zh 解析是否成功。
   * @ja 解析が成功したかどうか。
   * @ko 해석 성공 여부입니다.
   */
  (
    property: Property, value: string,
    parameters: Readonly<ParameterMap>,
  ): boolean;
}

/**
 * Native property parser, either built in or implemented by a JS callback.
 *
 * @zh 原生属性解析器，可以使用内置实现或 JS 回调。
 * @ja 組み込みまたは JS コールバックで実装するネイティブ属性解析器。
 * @ko 내장 구현 또는 JS 콜백을 사용하는 네이티브 속성 해석기입니다.
 * @remarks
 * Successful registration retains callbacks until shutdown. A callback may
 * read and write Property values; nested parsing and other runtime operations
 * throw. Callback errors propagate after the outer native call unwinds.
 * @zh 注册成功后，回调保留到运行时关闭。回调可读写 Property 值；
 * 嵌套解析及其他运行时操作会抛错。回调异常在最外层原生调用退出后传播。
 * @ja 登録済みコールバックは終了まで保持されます。Property の読み書きは可能ですが、
 * 再帰解析や他のランタイム操作は例外になります。例外は最外の呼び出し終了後に伝播します。
 * @ko 등록된 콜백은 종료까지 유지됩니다. Property 읽기와 쓰기는 허용되지만,
 * 중첩 해석과 다른 런타임 작업은 예외를 발생시킵니다. 예외는 최외곽 호출 종료 후 전달됩니다.
 */
export class PropertyParser {
  /**
   * Construct a synchronous Rml::PropertyParser implementation.
   *
   * @zh 创建同步的 Rml::PropertyParser 实现。
   * @ja 同期の Rml::PropertyParser 実装を生成します。
   * @ko 동기 Rml::PropertyParser 구현을 생성합니다.
   * @param callback - Output-property parser returning a boolean.
   * @zh callback - 修改输出属性并返回布尔值的解析器。
   * @ja callback - 出力属性を変更し真偽値を返す解析器。
   * @ko callback - 출력 속성을 수정하고 불리언을 반환하는 해석기입니다.
   */
  constructor(callback: PropertyParserCallback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Expected a property parser callback');
    }
    const handle = native.createPropertyParser((property, value, parameters) =>
      callback(propertyFromNative(property), value, parameters));
    parsers.set(this, handle);
  }

  /**
   * Invoke Rml::PropertyParser::ParseValue on a checked output value.
   *
   * @zh 对受检查的输出值调用 Rml::PropertyParser::ParseValue。
   * @ja 検証付き出力値に Rml::PropertyParser::ParseValue を呼び出します。
   * @ko 검사된 출력 값에 Rml::PropertyParser::ParseValue를 호출합니다.
   * @param property - Mutable output property.
   * @zh property - 可修改的输出属性。
   * @ja property - 変更可能な出力属性。
   * @ko property - 수정 가능한 출력 속성입니다.
   * @param value - Raw declaration text.
   * @zh value - 原始声明文本。
   * @ja value - 宣言の生のテキスト。
   * @ko value - 원시 선언 문자열입니다.
   * @param parameters - Parser parameters; default an empty map.
   * @zh parameters - 解析参数，默认为空映射。
   * @ja parameters - 解析引数。既定は空マップです。
   * @ko parameters - 해석 매개변수이며 기본값은 빈 맵입니다.
   * @returns Native success, preserving writes even for a false result.
   * @zh 原生成功结果；返回 false 时仍保留写入。
   * @ja ネイティブ成功結果。false でも書き込みを保持します。
   * @ko 네이티브 성공 결과이며 false인 경우에도 기록을 유지합니다.
   */
  parseValue(
    property: Property, value: string, parameters: ParameterMap = {},
  ): boolean {
    return native.parserParseValue(parserHandle(this),
      propertyHandle(property), value, parameters);
  }
}

/**
 * Resolve a parser token without accepting structural imitations.
 *
 * @internal
 * @param parser - Public parser.
 * @returns Checked native token.
 */
export function parserHandle(parser: PropertyParser): object {
  const handle = parsers.get(parser);
  if (!handle) {
    throw new TypeError('Expected a PropertyParser');
  }
  return handle;
}

/**
 * Wrap a generation-checked native parser.
 *
 * @internal
 * @param handle - Native parser token.
 * @returns Public parser wrapper.
 */
export function parserFromNative(handle: object): PropertyParser {
  const result = Object.create(PropertyParser.prototype) as PropertyParser;
  parsers.set(result, handle);
  return result;
}
