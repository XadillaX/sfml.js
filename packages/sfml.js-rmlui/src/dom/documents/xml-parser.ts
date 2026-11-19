import { native } from '../../internal/native';
import { Element } from '../elements/element';
import { Stream, streamHandle } from '../../io/stream';
import {
  DocumentHeader, documentHeaderFromNative, documentHeaderHandle,
} from './document-header';
import {
  variantFromNative, variantToNative,
} from '../../internal/animation-values';
import type { AttributeValue } from './attributes';
import type { ElementNativeHandle } from '../../values/types';

const parsers = new WeakMap<BaseXMLParser, object>();
const handlers = new WeakMap<XMLNodeHandler, object>();
const handlerWrappers = new WeakMap<object, XMLNodeHandler>();
const nativeConstruction = Symbol('native XML parser construction');

/**
 * Rml::XMLDataType values used by the native parser.
 *
 * @zh 原生解析器使用的 Rml::XMLDataType 值。
 * @ja ネイティブ解析器で使用する Rml::XMLDataType。
 * @ko 네이티브 파서가 사용하는 Rml::XMLDataType 값입니다.
 */
export enum XMLDataType {
  /**
   * Ordinary XML text.
   *
   * @zh 普通 XML 文本。
   * @ja 通常の XML テキスト。
   * @ko 일반 XML 텍스트입니다.
   */
  Text = 0,
  /**
   * Raw CDATA content.
   *
   * @zh 原始 CDATA 内容。
   * @ja 生の CDATA 内容。
   * @ko 원시 CDATA 내용입니다.
   */
  CDATA = 1,
  /**
   * Captured inner markup.
   *
   * @zh 捕获的内部标记。
   * @ja 捕捉した内部マークアップ。
   * @ko 캡처한 내부 마크업입니다.
   */
  InnerXML = 2,
}

/**
 * Owned copy of Rml::XMLAttributes; parser-produced attributes contain strings.
 *
 * @zh Rml::XMLAttributes 的独立副本；解析器产生的属性是字符串。
 * @ja Rml::XMLAttributes の独立コピー。解析した属性は文字列です。
 * @ko Rml::XMLAttributes의 독립 사본이며 파서가 생성한 속성은 문자열입니다.
 */
export type XMLAttributes = Record<string, AttributeValue>;

/**
 * Source positions recorded by native XML parsing.
 *
 * @zh 原生 XML 解析记录的源位置。
 * @ja ネイティブ XML 解析が記録した位置。
 * @ko 네이티브 XML 파싱이 기록한 소스 위치입니다.
 */
export interface XMLSourcePosition {
  /**
   * Current one-based line.
   *
   * @zh 当前行，从 1 开始。
   * @ja 現在の行、1 始まり。
   * @ko 현재 행이며 1부터 시작합니다.
   */
  lineNumber: number;

  /**
   * Last opening tag's line.
   *
   * @zh 最近开标签的行。
   * @ja 最後の開始タグの行。
   * @ko 마지막 시작 태그의 행입니다.
   */
  lineNumberOpenTag: number;
}

/**
 * One native start-tag event in a batched parse result.
 *
 * @zh 批量解析结果中的一个原生开标签事件。
 * @ja 一括解析結果の開始タグイベント。
 * @ko 일괄 파싱 결과의 네이티브 시작 태그 이벤트입니다.
 */
export interface XMLStartEvent extends XMLSourcePosition {
  /**
   * Event discriminator.
   *
   * @zh 事件类型。
   * @ja イベント種別。
   * @ko 이벤트 유형입니다.
   */
  kind: 'start';

  /**
   * Native tag spelling.
   *
   * @zh 原生标签拼写。
   * @ja ネイティブのタグ表記。
   * @ko 네이티브 태그 표기입니다.
   */
  name: string;

  /**
   * Independent attributes.
   *
   * @zh 独立属性副本。
   * @ja 独立した属性コピー。
   * @ko 독립 속성 사본입니다.
   */
  attributes: XMLAttributes;
}

/**
 * One native end-tag event in a batched parse result.
 *
 * @zh 批量解析结果中的一个原生闭标签事件。
 * @ja 一括解析結果の終了タグイベント。
 * @ko 일괄 파싱 결과의 네이티브 종료 태그 이벤트입니다.
 */
export interface XMLEndEvent extends XMLSourcePosition {
  /**
   * Event discriminator.
   *
   * @zh 事件类型。
   * @ja イベント種別。
   * @ko 이벤트 유형입니다.
   */
  kind: 'end';

  /**
   * Native tag spelling.
   *
   * @zh 原生标签拼写。
   * @ja ネイティブのタグ表記。
   * @ko 네이티브 태그 표기입니다.
   */
  name: string;
}

/**
 * One native text, CDATA, or captured-markup event.
 *
 * @zh 一个原生文本、CDATA 或捕获标记事件。
 * @ja テキスト、CDATA、捕捉マークアップのイベント。
 * @ko 네이티브 텍스트, CDATA 또는 캡처한 마크업 이벤트입니다.
 */
export interface XMLDataEvent extends XMLSourcePosition {
  /**
   * Event discriminator.
   *
   * @zh 事件类型。
   * @ja イベント種別。
   * @ko 이벤트 유형입니다.
   */
  kind: 'data';

  /**
   * Independent content.
   *
   * @zh 独立内容副本。
   * @ja 独立した内容コピー。
   * @ko 독립 내용 사본입니다.
   */
  data: string;

  /**
   * Native data category.
   *
   * @zh 原生数据类别。
   * @ja ネイティブのデータ分類。
   * @ko 네이티브 데이터 분류입니다.
   */
  type: XMLDataType;
}

/**
 * Ordered native XML event snapshot.
 *
 * @zh 按原生顺序排列的 XML 事件快照。
 * @ja ネイティブ順序の XML イベントスナップショット。
 * @ko 네이티브 순서의 XML 이벤트 스냅샷입니다.
 */
export type XMLParseEvent = XMLStartEvent | XMLEndEvent | XMLDataEvent;

/**
 * Synchronous Rml::BaseXMLParser virtual implementations.
 *
 * @zh Rml::BaseXMLParser 虚方法的同步实现。
 * @ja Rml::BaseXMLParser 仮想メソッドの同期実装。
 * @ko Rml::BaseXMLParser 가상 메서드의 동기 구현입니다.
 * @remarks
 * The callback parser expires on return. Use parseEvents for one native entry
 * and no per-event callbacks. Synchronous callbacks preserve native order.
 * @zh 回调解析器在返回后失效。parseEvents 只进入原生一次，无逐事件回调；
 * 同步回调保留原生执行顺序。
 * @ja コールバック解析器は復帰時に無効化されます。parseEvents は呼び出し
 * 一回でイベント別コールバックを行いません。同期実行は元の順序を保持します。
 * @ko 콜백 파서는 반환 시 무효화됩니다. parseEvents는 네이티브 진입 한 번으로
 * 개별 이벤트 콜백 없이 동작하며 동기 콜백은 네이티브 순서를 유지합니다.
 */
export interface BaseXMLParserCallbacks {
  /**
   * Handle an opening tag.
   *
   * @zh 处理开标签。
   * @ja 開始タグを処理します。
   * @ko 시작 태그를 처리합니다.
   * @param parser - Callback-scoped parser.
   * @zh parser - 仅回调期间有效的解析器。
   * @ja parser - コールバック中のみ有効な解析器。
   * @ko parser - 콜백 중에만 유효한 파서입니다.
   * @param name - Tag name.
   * @zh name - 标签名称。
   * @ja name - タグ名。
   * @ko name - 태그 이름입니다.
   * @param attributes - Independent attribute copy.
   * @zh attributes - 独立属性副本。
   * @ja attributes - 独立した属性コピー。
   * @ko attributes - 독립 속성 사본입니다.
   */
  handleElementStart?(
    parser: BaseXMLParser, name: string, attributes: XMLAttributes,
  ): void;

  /**
   * Handle a closing tag.
   *
   * @zh 处理闭标签。
   * @ja 終了タグを処理します。
   * @ko 종료 태그를 처리합니다.
   * @param parser - Callback-scoped parser.
   * @zh parser - 仅回调期间有效的解析器。
   * @ja parser - コールバック中のみ有効な解析器。
   * @ko parser - 콜백 중에만 유효한 파서입니다.
   * @param name - Tag name.
   * @zh name - 标签名称。
   * @ja name - タグ名。
   * @ko name - 태그 이름입니다.
   */
  handleElementEnd?(parser: BaseXMLParser, name: string): void;

  /**
   * Handle native data.
   *
   * @zh 处理原生数据。
   * @ja ネイティブデータを処理します。
   * @ko 네이티브 데이터를 처리합니다.
   * @param parser - Callback-scoped parser.
   * @zh parser - 仅回调期间有效的解析器。
   * @ja parser - コールバック中のみ有効な解析器。
   * @ko parser - 콜백 중에만 유효한 파서입니다.
   * @param data - Native content.
   * @zh data - 原生内容。
   * @ja data - ネイティブの内容。
   * @ko data - 네이티브 내용입니다.
   * @param type - Data category.
   * @zh type - 数据类别。
   * @ja type - データ分類。
   * @ko type - 데이터 분류입니다.
   */
  handleData?(parser: BaseXMLParser, data: string, type: XMLDataType): void;
}

/**
 * Native XML tokenizer with synchronous or batched event delivery.
 *
 * @zh 支持同步或批量事件交付的原生 XML 解析器。
 * @ja 同期または一括イベント配送を行うネイティブ XML 解析器。
 * @ko 동기 또는 일괄 이벤트 전달을 지원하는 네이티브 XML 파서입니다.
 */
export class BaseXMLParser {
  /**
   * Construct a native Rml::BaseXMLParser adapter.
   *
   * @zh 创建原生 Rml::BaseXMLParser 适配器。
   * @ja ネイティブ Rml::BaseXMLParser アダプターを構築します。
   * @ko 네이티브 Rml::BaseXMLParser 어댑터를 생성합니다.
   * @param callbacks - Synchronous virtuals; defaults to no callbacks.
   * @zh callbacks - 同步虚方法，默认无回调。
   * @ja callbacks - 同期仮想メソッド。既定はコールバックなし。
   * @ko callbacks - 동기 가상 메서드이며 기본값은 콜백 없음입니다.
   */
  constructor(callbacks?: BaseXMLParserCallbacks);

  /** @internal */
  constructor(initial: typeof nativeConstruction);
  constructor(
    callbacks: BaseXMLParserCallbacks | typeof nativeConstruction = {},
  ) {
    if (callbacks !== nativeConstruction) {
      const { handleElementStart, handleElementEnd, handleData } = callbacks;
      for (const callback of [
        handleElementStart, handleElementEnd, handleData,
      ]) {
        if (callback !== undefined && typeof callback !== 'function') {
          throw new TypeError('Expected an XML callback function');
        }
      }

      parsers.set(this, native.createXMLBaseParser([
        handleElementStart && ((parser, name, attributes) =>
          handleElementStart(parserFromNative(parser, false), name,
            attributesFromNative(attributes))),
        handleElementEnd && ((parser, name) =>
          handleElementEnd(parserFromNative(parser, false), name)),
        handleData && ((parser, data, type) =>
          handleData(parserFromNative(parser, false), data, type)),
      ]));
    }
  }

  /**
   * Invoke Rml::BaseXMLParser::HandleElementStart outside parser callbacks.
   *
   * @zh 在解析器回调外调用 Rml::BaseXMLParser::HandleElementStart。
   * @ja 解析器コールバック外で Rml::BaseXMLParser::HandleElementStart を呼びます。
   * @ko 파서 콜백 밖에서 Rml::BaseXMLParser::HandleElementStart를 호출합니다.
   * @param name - Tag name delivered to the synchronous virtual.
   * @zh name - 提交给同步虚方法的标签名称。
   * @ja name - 同期仮想メソッドへ渡すタグ名。
   * @ko name - 동기 가상 메서드에 전달할 태그 이름입니다.
   * @param attributes - Attributes copied before dispatch.
   * @zh attributes - 调用前复制的属性。
   * @ja attributes - 呼び出し前にコピーする属性。
   * @ko attributes - 호출 전에 복사할 속성입니다.
   * @remarks
   * XMLParser protects its structural handlers and rejects direct calls.
   * @zh XMLParser 的结构处理器为受保护方法，拒绝直接调用。
   * @ja XMLParser の構造ハンドラーは保護され直接呼び出しを拒否します。
   * @ko XMLParser의 구조 핸들러는 보호되며 직접 호출을 거부합니다.
   */
  handleElementStart(name: string, attributes: XMLAttributes): void {
    const mapped = Object.fromEntries(Object.entries(attributes)
      .map(([ key, value ]) => [ key, variantToNative(value) ]));

    native.xmlHandleElementStart(parserHandle(this), name, mapped);
  }

  /**
   * Invoke Rml::BaseXMLParser::HandleElementEnd outside parser callbacks.
   *
   * @zh 在解析器回调外调用 Rml::BaseXMLParser::HandleElementEnd。
   * @ja 解析器コールバック外で Rml::BaseXMLParser::HandleElementEnd を呼びます。
   * @ko 파서 콜백 밖에서 Rml::BaseXMLParser::HandleElementEnd를 호출합니다.
   * @param name - Closing tag delivered to the synchronous virtual.
   * @zh name - 提交给同步虚方法的闭标签。
   * @ja name - 同期仮想メソッドへ渡す終了タグ。
   * @ko name - 동기 가상 메서드에 전달할 종료 태그입니다.
   * @remarks
   * XMLParser protects its structural handlers and rejects direct calls.
   * @zh XMLParser 的结构处理器为受保护方法，拒绝直接调用。
   * @ja XMLParser の構造ハンドラーは保護され直接呼び出しを拒否します。
   * @ko XMLParser의 구조 핸들러는 보호되며 직접 호출을 거부합니다.
   */
  handleElementEnd(name: string): void {
    native.xmlHandleElementEnd(parserHandle(this), name);
  }

  /**
   * Invoke Rml::BaseXMLParser::HandleData outside parser callbacks.
   *
   * @zh 在解析器回调外调用 Rml::BaseXMLParser::HandleData。
   * @ja 解析器コールバック外で Rml::BaseXMLParser::HandleData を呼びます。
   * @ko 파서 콜백 밖에서 Rml::BaseXMLParser::HandleData를 호출합니다.
   * @param data - Content delivered to the synchronous virtual.
   * @zh data - 提交给同步虚方法的内容。
   * @ja data - 同期仮想メソッドへ渡す内容。
   * @ko data - 동기 가상 메서드에 전달할 내용입니다.
   * @param type - Checked native data category.
   * @zh type - 受检查的原生数据类别。
   * @ja type - 検証するネイティブデータ分類。
   * @ko type - 검사할 네이티브 데이터 분류입니다.
   */
  handleData(data: string, type: XMLDataType): void {
    native.xmlHandleData(parserHandle(this), data, type);
  }

  /**
   * Register Rml::BaseXMLParser::RegisterCDATATag for this parser.
   *
   * @zh 为此解析器注册 Rml::BaseXMLParser::RegisterCDATATag。
   * @ja この解析器の Rml::BaseXMLParser::RegisterCDATATag を登録します。
   * @ko 이 파서에 Rml::BaseXMLParser::RegisterCDATATag를 등록합니다.
   * @param tag - Case-insensitive tag; empty is ignored.
   * @zh tag - 不区分大小写的标签；忽略空标签。
   * @ja tag - 大文字小文字を区別しないタグ。空は無視します。
   * @ko tag - 대소문자를 구분하지 않는 태그이며 빈 값은 무시합니다.
   */
  registerCDATATag(tag: string): void {
    native.xmlRegisterCDATATag(parserHandle(this), tag);
  }

  /**
   * Invoke Rml::BaseXMLParser::IsCDATATag.
   *
   * @zh 调用 Rml::BaseXMLParser::IsCDATATag。
   * @ja Rml::BaseXMLParser::IsCDATATag を呼び出します。
   * @ko Rml::BaseXMLParser::IsCDATATag를 호출합니다.
   * @param tag - Case-insensitive tag.
   * @zh tag - 不区分大小写的标签。
   * @ja tag - 大文字小文字を区別しないタグ。
   * @ko tag - 대소문자를 구분하지 않는 태그입니다.
   * @returns Whether the native tag is registered.
   * @zh 原生标签是否已注册。
   * @ja ネイティブタグが登録されているか。
   * @ko 네이티브 태그의 등록 여부입니다.
   */
  isCDATATag(tag: string): boolean {
    return native.xmlIsCDATATag(parserHandle(this), tag);
  }

  /**
   * Register an attribute that captures a node’s inner markup as data.
   *
   * @zh 注册将节点内部标记作为数据捕获的属性。
   * @ja ノード内のマークアップをデータとして取り込む属性を登録します。
   * @ko 노드 내부 마크업을 데이터로 캡처하는 속성을 등록합니다.
   * @param name - Attribute whose presence captures inner markup as data.
   * @zh name - 存在时将内部标记捕获为数据的属性名称。
   * @ja name - 存在すると内部マークアップをデータとして捕捉する属性名。
   * @ko name - 존재할 때 내부 마크업을 데이터로 캡처하는 속성 이름입니다.
   */
  registerInnerXMLAttribute(name: string): void {
    native.xmlRegisterInnerXMLAttribute(parserHandle(this), name);
  }

  /**
   * Parse the retained native stream, invoking synchronous virtuals in order.
   *
   * @zh 解析被保留的原生流，按顺序调用同步虚方法。
   * @ja 保持したネイティブストリームを解析し同期仮想メソッドを順に呼びます。
   * @ko 유지된 네이티브 스트림을 파싱하고 동기 가상 메서드를 순서대로 호출합니다.
   * @param stream - Native stream, retained throughout parsing.
   * @zh stream - 原生流，整个解析期间保持存活。
   * @ja stream - 解析中保持するネイティブストリーム。
   * @ko stream - 파싱 중 유지되는 네이티브 스트림입니다.
   */
  parse(stream: Stream): void {
    native.xmlParse(parserHandle(this), streamHandle(stream), false);
  }

  /**
   * Collect owned events in one native entry without invoking host virtuals.
   *
   * @zh 一次进入原生收集独立事件，不调用宿主虚方法。
   * @ja 呼び出し一回で独立イベントを収集しホスト仮想メソッドを呼びません。
   * @ko 네이티브 진입 한 번으로 독립 이벤트를 수집하고 호스트 가상 메서드를 호출하지 않습니다.
   * @param stream - Retained native input stream.
   * @zh stream - 被保留的原生输入流。
   * @ja stream - 保持したネイティブ入力ストリーム。
   * @ko stream - 유지된 네이티브 입력 스트림입니다.
   * @returns Ordered snapshots; XMLParser uses DOM parsing instead.
   * @zh 顺序快照；XMLParser 使用 DOM 解析，不支持此方法。
   * @ja 順序付きスナップショット。XMLParser は DOM 解析を使います。
   * @ko 순서가 있는 스냅샷이며 XMLParser는 DOM 파싱을 사용합니다.
   */
  parseEvents(stream: Stream): XMLParseEvent[] {
    return native.xmlParse(parserHandle(this), streamHandle(stream), true);
  }

  /**
   * Get the current one-based source line, or zero before parsing.
   *
   * @zh 获取从 1 开始的当前源码行号；解析前为零。
   * @ja 1 始まりの現在のソース行を取得します。解析前はゼロです。
   * @ko 1부터 시작하는 현재 소스 행을 가져오며 해석 전에는 0입니다.
   * @returns Current one-based line, or zero before parsing.
   * @zh 当前行，从 1 开始；解析前为零。
   * @ja 現在の行、1 始まり。解析前はゼロです。
   * @ko 현재 행이며 1부터 시작하고 파싱 전에는 0입니다.
   */
  getLineNumber(): number {
    return native.xmlGetLineNumber(parserHandle(this));
  }

  /**
   * Get the source line of the most recent opening tag.
   *
   * @zh 获取最近开始标签的源码行号。
   * @ja 直近の開始タグのソース行を取得します。
   * @ko 최근 여는 태그의 소스 행을 가져옵니다.
   * @returns Line of the last opening tag, or zero before parsing.
   * @zh 最近开标签的行；解析前为零。
   * @ja 最後の開始タグの行。解析前はゼロです。
   * @ko 마지막 시작 태그의 행이며 파싱 전에는 0입니다.
   */
  getLineNumberOpenTag(): number {
    return native.xmlGetLineNumberOpenTag(parserHandle(this));
  }

  /**
   * Copy the native source URL during active parsing.
   *
   * @zh 在解析进行期间复制原生源 URL。
   * @ja 解析中にネイティブのソース URL をコピーします。
   * @ko 파싱 중 네이티브 소스 URL을 복사합니다.
   * @returns Native resource URL text; throws outside a parse callback.
   * @zh 原生资源 URL 文本；在解析回调外调用会抛错。
   * @ja ネイティブ資源 URL の文字列。解析コールバック外は例外です。
   * @ko 네이티브 리소스 URL 문자열이며 파싱 콜백 밖에서는 예외를 던집니다.
   */
  getSourceURL(): string {
    return native.xmlGetSourceURL(parserHandle(this));
  }
}

/**
 * Owned snapshot of Rml::XMLParser::ParseFrame with checked references.
 *
 * @zh Rml::XMLParser::ParseFrame 的独立快照，包含受检查的引用。
 * @ja 検証付き参照を含む Rml::XMLParser::ParseFrame の独立コピー。
 * @ko 검사된 참조를 포함하는 Rml::XMLParser::ParseFrame의 독립 스냅샷입니다.
 */
export interface XMLParseFrame {
  /**
   * Current tag.
   *
   * @zh 当前标签。
   * @ja 現在のタグ。
   * @ko 현재 태그입니다.
   */
  tag: string;

  /**
   * Current native element.
   *
   * @zh 当前原生元素。
   * @ja 現在のネイティブ要素。
   * @ko 현재 네이티브 요소입니다.
   */
  element: Element | null;

  /**
   * Frame's handler.
   *
   * @zh 此帧的处理器。
   * @ja フレームのハンドラー。
   * @ko 프레임의 핸들러입니다.
   */
  nodeHandler: XMLNodeHandler | null;

  /**
   * Child default handler.
   *
   * @zh 子元素默认处理器。
   * @ja 子要素の既定ハンドラー。
   * @ko 자식 기본 핸들러입니다.
   */
  childHandler: XMLNodeHandler | null;
}

/**
 * Native Rml::XMLParser with retained root ownership.
 *
 * @zh 保留根元素所有权的原生 Rml::XMLParser。
 * @ja ルート所有権を保持するネイティブ Rml::XMLParser。
 * @ko 루트 소유권을 유지하는 네이티브 Rml::XMLParser입니다.
 * @remarks
 * Registry replacement invalidates existing parser and borrowed handler
 * tokens. A callback may inspect its parser or delegate a native handler, but
 * cannot mutate the DOM, stream, registry, or runtime. Shutdown releases the
 * native handler registry and invalidates all surviving tokens.
 * @zh 替换注册项使既有解析器和借用的处理器令牌失效。回调可检查自身解析器或
 * 委托原生处理器，但不能修改 DOM、流、注册表或运行时。关闭时释放原生处理器
 * 注册表并使所有存活令牌失效。
 * @ja 登録置換は既存解析器と借用ハンドラーを無効化します。コールバックでは
 * 自身の解析器を検査しネイティブ処理を委譲できますが DOM 等は変更できません。
 * 終了時に登録を解放し残存トークンを無効化します。
 * @ko 등록 교체 시 기존 파서와 빌린 핸들러 토큰이 무효화됩니다. 콜백은 자체 파서
 * 검사나 네이티브 핸들러 위임만 가능하며 DOM, 스트림, 레지스트리, 런타임을
 * 변경할 수 없습니다. 종료 시 등록을 해제하고 모든 잔존 토큰을 무효화합니다.
 */
export class XMLParser extends BaseXMLParser {
  /**
   * Construct Rml::XMLParser for a checked element or document.
   *
   * @zh 为受检查的元素或文档创建 Rml::XMLParser。
   * @ja 検証済み要素または文書の Rml::XMLParser を構築します。
   * @ko 검사된 요소 또는 문서의 Rml::XMLParser를 생성합니다.
   * @param root - Retained parse root.
   * @zh root - 被保留的解析根元素。
   * @ja root - 保持する解析ルート。
   * @ko root - 유지되는 파싱 루트입니다.
   */
  constructor(root: Element) {
    super(nativeConstruction);
    if (!(root instanceof Element)) {
      throw new TypeError('Expected an Element XML root');
    }
    parsers.set(this, native.createXMLParser(root.handle));
  }

  /**
   * Register a tag whose content is treated as CDATA
   * by subsequently created parsers.
   *
   * @zh 注册后续新建解析器将内容视为 CDATA 的标签。
   * @ja 以後に作成する解析器が内容を CDATA として扱うタグを登録します。
   * @ko 이후 생성하는 해석기가 내용을 CDATA로 처리할 태그를 등록합니다.
   * @param tag - Case-insensitive tag applied to subsequently created parsers.
   * @zh tag - 不区分大小写的标签，应用于此后创建的解析器。
   * @ja tag - 大文字小文字を区別しないタグ。以後の解析器に適用します。
   * @ko tag - 대소문자를 구분하지 않으며 이후 생성되는 파서에 적용되는 태그입니다.
   */
  static registerPersistentCDATATag(tag: string): void {
    native.xmlRegisterPersistentCDATATag(tag);
  }

  /**
   * Register an owned Rml::XMLNodeHandler, replacing the existing entry.
   *
   * @zh 注册被拥有的 Rml::XMLNodeHandler，替换现有条目。
   * @ja 所有する Rml::XMLNodeHandler を登録し既存項目を置換します。
   * @ko 소유한 Rml::XMLNodeHandler를 등록하여 기존 항목을 교체합니다.
   * @param tag - Lowercased by native registration; empty sets the default.
   * @zh tag - 原生注册时转为小写；空字符串设置默认处理器。
   * @ja tag - ネイティブ登録で小文字化。空文字列は既定ハンドラーです。
   * @ko tag - 네이티브 등록 시 소문자로 변환되며 빈 문자열은 기본 핸들러를 설정합니다.
   * @param handler - Owned handler, or null to register a null target.
   * @zh handler - 被拥有的处理器，或 null 以注册空目标。
   * @ja handler - 所有ハンドラー。null は空ターゲットを登録します。
   * @ko handler - 소유한 핸들러이며 null은 빈 대상을 등록합니다.
   * @returns Registered handler, or null.
   * @zh 注册后的处理器，或 null。
   * @ja 登録したハンドラー、または null。
   * @ko 등록된 핸들러 또는 null입니다.
   */
  static registerNodeHandler(
    tag: string, handler: XMLNodeHandler | null,
  ): XMLNodeHandler | null {
    const result = native.xmlRegisterNodeHandler(tag,
      handler === null ? null : handlerHandle(handler));
    return result === null ? null : handlerFromNative(result);
  }

  /**
   * Retrieve Rml::XMLParser::GetNodeHandler using native case-sensitive lookup.
   *
   * @zh 使用原生区分大小写的查找获取 Rml::XMLParser::GetNodeHandler。
   * @ja 大文字小文字を区別する Rml::XMLParser::GetNodeHandler を取得します。
   * @ko 대소문자를 구분하는 네이티브 Rml::XMLParser::GetNodeHandler를 조회합니다.
   * @param tag - Exact registered key; empty does not retrieve the default.
   * @zh tag - 精确注册键；空字符串不会获取默认处理器。
   * @ja tag - 正確な登録キー。空文字列は既定を取得しません。
   * @ko tag - 정확한 등록 키이며 빈 문자열은 기본 핸들러를 조회하지 않습니다.
   * @returns Checked handler, or null if absent.
   * @zh 受检查的处理器；不存在时为 null。
   * @ja 検証付きハンドラー。存在しなければ null。
   * @ko 검사된 핸들러이며 없으면 null입니다.
   */
  static getNodeHandler(tag: string): XMLNodeHandler | null {
    const result = native.xmlGetNodeHandler(tag);
    return result === null ? null : handlerFromNative(result);
  }

  /**
   * Copy Rml::XMLParser::GetDocumentHeader into an independent native owner.
   *
   * @zh 将 Rml::XMLParser::GetDocumentHeader 复制到独立原生所有者。
   * @ja Rml::XMLParser::GetDocumentHeader を独立ネイティブ所有者にコピーします。
   * @ko Rml::XMLParser::GetDocumentHeader를 독립 네이티브 소유자로 복사합니다.
   * @returns Header snapshot; edits do not change the active parser.
   * @zh 头部快照；修改不会改变当前解析器。
   * @ja ヘッダースナップショット。編集は現在の解析器を変更しません。
   * @ko 헤더 스냅샷이며 수정해도 현재 파서를 변경하지 않습니다.
   */
  getDocumentHeader(): DocumentHeader {
    return documentHeaderFromNative(
      native.xmlGetDocumentHeader(parserHandle(this)));
  }

  /**
   * Replace the active native header from an independently prepared copy.
   *
   * @zh 用独立准备的副本替换活动原生头部。
   * @ja 独立して準備したコピーで解析中のネイティブヘッダーを置換します。
   * @ko 독립적으로 준비한 사본으로 활성 네이티브 헤더를 교체합니다.
   * @param header - Checked header copied into the current parse.
   * @zh header - 复制到当前解析的受检查头部。
   * @ja header - 現在の解析にコピーする検証済みヘッダー。
   * @ko header - 현재 파싱에 복사할 검사된 헤더입니다.
   */
  setDocumentHeader(header: DocumentHeader): void {
    native.xmlSetDocumentHeader(parserHandle(this),
      documentHeaderHandle(header));
  }

  /**
   * Invoke Rml::XMLParser::HandleData during an active parse callback.
   *
   * @zh 在活动解析回调期间调用 Rml::XMLParser::HandleData。
   * @ja 解析コールバック中に Rml::XMLParser::HandleData を呼び出します。
   * @ko 활성 파싱 콜백 중 Rml::XMLParser::HandleData를 호출합니다.
   * @param data - Content for the current frame's native node handler.
   * @zh data - 提交给当前帧原生节点处理器的内容。
   * @ja data - 現在のフレームのネイティブノードハンドラーに渡す内容。
   * @ko data - 현재 프레임의 네이티브 노드 핸들러에 전달할 내용입니다.
   * @param type - Native data category.
   * @zh type - 原生数据类别。
   * @ja type - ネイティブデータ分類。
   * @ko type - 네이티브 데이터 분류입니다.
   */
  handleData(data: string, type: XMLDataType): void {
    native.xmlHandleData(parserHandle(this), data, type);
  }

  /**
   * Snapshot Rml::XMLParser::GetParseFrame with checked element references.
   *
   * @zh 为 Rml::XMLParser::GetParseFrame 创建包含受检查元素引用的快照。
   * @ja 検証付き要素参照を含む Rml::XMLParser::GetParseFrame のコピー。
   * @ko 검사된 요소 참조를 포함하는 Rml::XMLParser::GetParseFrame 스냅샷입니다.
   * @returns Independent frame fields and checked native references.
   * @zh 独立帧字段和受检查的原生引用。
   * @ja 独立したフレームフィールドと検証付きネイティブ参照。
   * @ko 독립 프레임 필드와 검사된 네이티브 참조입니다.
   */
  getParseFrame(): XMLParseFrame {
    const frame = native.xmlGetParseFrame(parserHandle(this));
    return {
      tag: frame.tag,
      element: frame.element === null ? null : Element.wrap(frame.element),
      nodeHandler: frame.nodeHandler === null ? null :
        handlerFromNative(frame.nodeHandler),
      childHandler: frame.childHandler === null ? null :
        handlerFromNative(frame.childHandler),
    };
  }

  /**
   * Select Rml::XMLParser::PushHandler during an active callback.
   *
   * @zh 在活动回调期间选择 Rml::XMLParser::PushHandler。
   * @ja コールバック中に Rml::XMLParser::PushHandler を選択します。
   * @ko 활성 콜백 중 Rml::XMLParser::PushHandler를 선택합니다.
   * @param tag - Case-insensitive registered child handler tag.
   * @zh tag - 不区分大小写的已注册子元素处理器标签。
   * @ja tag - 大文字小文字を区別しない登録済み子ハンドラーのタグ。
   * @ko tag - 대소문자를 구분하지 않는 등록된 자식 핸들러 태그입니다.
   * @returns Whether the native handler was found.
   * @zh 是否找到了原生处理器。
   * @ja ネイティブハンドラーが見つかったか。
   * @ko 네이티브 핸들러를 찾았는지 여부입니다.
   */
  pushHandler(tag: string): boolean {
    return native.xmlPushHandler(parserHandle(this), tag);
  }

  /**
   * Select Rml::XMLParser::PushDefaultHandler during an active callback.
   *
   * @zh 在活动回调期间选择 Rml::XMLParser::PushDefaultHandler。
   * @ja コールバック中に Rml::XMLParser::PushDefaultHandler を選択します。
   * @ko 활성 콜백 중 Rml::XMLParser::PushDefaultHandler를 선택합니다.
   */
  pushDefaultHandler(): void {
    native.xmlPushDefaultHandler(parserHandle(this));
  }
}

/**
 * Synchronous implementations of all Rml::XMLNodeHandler virtuals.
 *
 * @zh Rml::XMLNodeHandler 全部虚方法的同步实现。
 * @ja 全 Rml::XMLNodeHandler 仮想メソッドの同期実装。
 * @ko 모든 Rml::XMLNodeHandler 가상 메서드의 동기 구현입니다.
 */
export interface XMLNodeHandlerCallbacks {
  /**
   * Handle a start tag and return a node already owned by this parse subtree.
   *
   * @zh 处理开标签并返回此解析子树已经拥有的节点。
   * @ja 開始タグを処理し解析サブツリーが所有するノードを返します。
   * @ko 시작 태그를 처리하고 이 파싱 하위 트리가 이미 소유한 노드를 반환합니다.
   * @param parser - Callback-scoped native parser.
   * @zh parser - 仅回调期间有效的原生解析器。
   * @ja parser - コールバック中のみ有効なネイティブ解析器。
   * @ko parser - 콜백 중에만 유효한 네이티브 파서입니다.
   * @param name - Lowercase tag.
   * @zh name - 小写标签。
   * @ja name - 小文字のタグ。
   * @ko name - 소문자 태그입니다.
   * @param attributes - Independent attributes.
   * @zh attributes - 独立属性副本。
   * @ja attributes - 独立した属性コピー。
   * @ko attributes - 독립 속성 사본입니다.
   * @returns Checked subtree element or null to inherit the parent's element.
   * @zh 受检查的子树元素；null 表示继承父元素。
   * @ja 検証済みサブツリー要素。null は親要素を継承します。
   * @ko 검사된 하위 트리 요소이며 null은 부모 요소를 상속합니다.
   */
  elementStart(
    parser: XMLParser, name: string, attributes: XMLAttributes,
  ): Element | null;

  /**
   * Handle a closing tag.
   *
   * @zh 处理闭标签。
   * @ja 終了タグを処理します。
   * @ko 종료 태그를 처리합니다.
   * @param parser - Callback-scoped parser.
   * @zh parser - 仅回调期间有效的解析器。
   * @ja parser - コールバック中のみ有効な解析器。
   * @ko parser - 콜백 중에만 유효한 파서입니다.
   * @param name - Lowercase closing tag.
   * @zh name - 小写闭标签。
   * @ja name - 小文字の終了タグ。
   * @ko name - 소문자 종료 태그입니다.
   * @returns Native handler result; the upstream XML parser ignores this flag.
   * @zh 原生处理器结果；上游 XML 解析器忽略此标志。
   * @ja ネイティブ結果。上流 XML 解析器はこのフラグを無視します。
   * @ko 네이티브 핸들러 결과이며 상위 XML 파서는 이 플래그를 무시합니다.
   */
  elementEnd(parser: XMLParser, name: string): boolean;

  /**
   * Handle native text or captured markup.
   *
   * @zh 处理原生文本或捕获的标记。
   * @ja ネイティブテキストまたは捕捉マークアップを処理します。
   * @ko 네이티브 텍스트 또는 캡처한 마크업을 처리합니다.
   * @param parser - Callback-scoped parser.
   * @zh parser - 仅回调期间有效的解析器。
   * @ja parser - コールバック中のみ有効な解析器。
   * @ko parser - 콜백 중에만 유효한 파서입니다.
   * @param data - Native data.
   * @zh data - 原生数据。
   * @ja data - ネイティブデータ。
   * @ko data - 네이티브 데이터입니다.
   * @param type - Data category.
   * @zh type - 数据类别。
   * @ja type - データ分類。
   * @ko type - 데이터 분류입니다.
   * @returns Native handler result; the upstream XML parser ignores this flag.
   * @zh 原生处理器结果；上游 XML 解析器忽略此标志。
   * @ja ネイティブ結果。上流 XML 解析器はこのフラグを無視します。
   * @ko 네이티브 핸들러 결과이며 상위 XML 파서는 이 플래그를 무시합니다.
   */
  elementData(parser: XMLParser, data: string, type: XMLDataType): boolean;
}

/**
 * Checked native XML node handler, owned or borrowed from the registry.
 *
 * @zh 受检查的原生 XML 节点处理器，可独立拥有或从注册表借用。
 * @ja 所有または登録から借用する検証付き XML ノードハンドラー。
 * @ko 독립 소유 또는 레지스트리에서 빌린 검사된 네이티브 XML 노드 핸들러입니다.
 */
export class XMLNodeHandler {
  /**
   * Construct an owned native handler with captured synchronous callbacks.
   *
   * @zh 使用捕获的同步回调创建独立拥有的原生处理器。
   * @ja 捕捉した同期コールバックで所有ネイティブハンドラーを構築します。
   * @ko 캡처한 동기 콜백으로 독립 소유 네이티브 핸들러를 생성합니다.
   * @param callbacks - All three native virtual implementations.
   * @zh callbacks - 三个原生虚方法的完整实现。
   * @ja callbacks - 三つのネイティブ仮想メソッドの実装。
   * @ko callbacks - 세 네이티브 가상 메서드의 구현입니다.
   */
  constructor(callbacks: XMLNodeHandlerCallbacks) {
    const { elementStart, elementEnd, elementData } = callbacks;
    if ([ elementStart, elementEnd, elementData ].some(
      callback => typeof callback !== 'function')) {
      throw new TypeError('Expected all three XML node callbacks');
    }
    const handle = native.createXMLNodeHandler([
      (parser, name, attributes) => {
        const result = elementStart(parserFromNative(parser, true) as XMLParser,
          name, attributesFromNative(attributes));
        if (result === null) {
          return null;
        }
        if (!(result instanceof Element)) {
          throw new TypeError(
            'XML callback must return a synchronous Element or null');
        }
        return result.handle;
      },
      (parser, name) =>
        elementEnd(parserFromNative(parser, true) as XMLParser, name),
      (parser, data, type) =>
        elementData(parserFromNative(parser, true) as XMLParser, data, type),
    ]);
    handlers.set(this, handle);
    handlerWrappers.set(handle, this);
  }

  /**
   * Construct an owned Rml::XMLNodeHandlerDefault for native delegation.
   *
   * @zh 创建被拥有的 Rml::XMLNodeHandlerDefault 以委托原生处理。
   * @ja ネイティブ委譲用の所有 Rml::XMLNodeHandlerDefault を構築します。
   * @ko 네이티브 위임을 위한 소유 Rml::XMLNodeHandlerDefault를 생성합니다.
   * @returns Handler creating native child elements and native text.
   * @zh 创建原生子元素和原生文本的处理器。
   * @ja ネイティブ子要素とテキストを生成するハンドラー。
   * @ko 네이티브 자식 요소와 텍스트를 생성하는 핸들러입니다.
   */
  static createDefault(): XMLNodeHandler {
    return handlerFromNative(native.createXMLNodeHandler(null));
  }

  /**
   * Invoke Rml::XMLNodeHandler::ElementStart on the active parser.
   *
   * @zh 对活动解析器调用 Rml::XMLNodeHandler::ElementStart。
   * @ja 解析中の Rml::XMLNodeHandler::ElementStart を呼び出します。
   * @ko 활성 파서에서 Rml::XMLNodeHandler::ElementStart를 호출합니다.
   * @param parser - Active callback parser.
   * @zh parser - 活动回调解析器。
   * @ja parser - コールバック中の解析器。
   * @ko parser - 활성 콜백 파서입니다.
   * @param name - Element tag.
   * @zh name - 元素标签。
   * @ja name - 要素タグ。
   * @ko name - 요소 태그입니다.
   * @param attributes - Native attribute values.
   * @zh attributes - 原生属性值。
   * @ja attributes - ネイティブ属性値。
   * @ko attributes - 네이티브 속성 값입니다.
   * @returns Checked native element or null.
   * @zh 受检查的原生元素，或 null。
   * @ja 検証付きネイティブ要素、または null。
   * @ko 검사된 네이티브 요소 또는 null입니다.
   */
  elementStart(
    parser: XMLParser, name: string, attributes: XMLAttributes,
  ): Element | null {
    const mapped = Object.fromEntries(Object.entries(attributes)
      .map(([ key, value ]) => [ key, variantToNative(value) ]));

    const result = native.xmlNodeElementStart(handlerHandle(this),
      parserHandle(parser), name, mapped);

    return result === null ? null : Element.wrap(result);
  }

  /**
   * Invoke Rml::XMLNodeHandler::ElementEnd on the active parser.
   *
   * @zh 对活动解析器调用 Rml::XMLNodeHandler::ElementEnd。
   * @ja 解析中の Rml::XMLNodeHandler::ElementEnd を呼び出します。
   * @ko 활성 파서에서 Rml::XMLNodeHandler::ElementEnd를 호출합니다.
   * @param parser - Active callback parser.
   * @zh parser - 活动回调解析器。
   * @ja parser - コールバック中の解析器。
   * @ko parser - 활성 콜백 파서입니다.
   * @param name - Closing tag.
   * @zh name - 闭标签。
   * @ja name - 終了タグ。
   * @ko name - 종료 태그입니다.
   * @returns Native handler's boolean result.
   * @zh 原生处理器的布尔结果。
   * @ja ネイティブハンドラーの真偽値。
   * @ko 네이티브 핸들러의 불리언 결과입니다.
   */
  elementEnd(parser: XMLParser, name: string): boolean {
    return native.xmlNodeElementEnd(handlerHandle(this),
      parserHandle(parser), name);
  }

  /**
   * Invoke Rml::XMLNodeHandler::ElementData on the active parser.
   *
   * @zh 对活动解析器调用 Rml::XMLNodeHandler::ElementData。
   * @ja 解析中の Rml::XMLNodeHandler::ElementData を呼び出します。
   * @ko 활성 파서에서 Rml::XMLNodeHandler::ElementData를 호출합니다.
   * @param parser - Active callback parser.
   * @zh parser - 活动回调解析器。
   * @ja parser - コールバック中の解析器。
   * @ko parser - 활성 콜백 파서입니다.
   * @param data - Native text or markup.
   * @zh data - 原生文本或标记。
   * @ja data - ネイティブテキストまたはマークアップ。
   * @ko data - 네이티브 텍스트 또는 마크업입니다.
   * @param type - Native data category.
   * @zh type - 原生数据类别。
   * @ja type - ネイティブデータ分類。
   * @ko type - 네이티브 데이터 분류입니다.
   * @returns Native handler's boolean result.
   * @zh 原生处理器的布尔结果。
   * @ja ネイティブハンドラーの真偽値。
   * @ko 네이티브 핸들러의 불리언 결과입니다.
   */
  elementData(parser: XMLParser, data: string, type: XMLDataType): boolean {
    return native.xmlNodeElementData(handlerHandle(this),
      parserHandle(parser), data, type);
  }
}

/**
 * Resolve only a constructed parser facade.
 *
 * @internal
 * @param parser - Public parser.
 * @returns Native checked token.
 */
function parserHandle(parser: BaseXMLParser): object {
  const handle = parsers.get(parser);
  if (!handle) {
    throw new TypeError('Expected an XML parser');
  }
  return handle;
}

/**
 * Wrap a callback-scoped parser without native allocation.
 *
 * @internal
 * @param handle - Native callback token.
 * @param xml - Whether the native parser is Rml::XMLParser.
 * @returns Borrowed parser facade.
 */
function parserFromNative(handle: object, xml: boolean): BaseXMLParser {
  const result = Object.create(xml ? XMLParser.prototype :
    BaseXMLParser.prototype) as BaseXMLParser;
  parsers.set(result, handle);
  return result;
}

/**
 * Resolve only a constructed handler facade.
 *
 * @internal
 * @param handler - Public handler.
 * @returns Native checked token.
 */
function handlerHandle(handler: XMLNodeHandler): object {
  const handle = handlers.get(handler);
  if (!handle) {
    throw new TypeError('Expected an XMLNodeHandler');
  }
  return handle;
}

/**
 * Preserve public identity while a native handler token remains reachable.
 *
 * @internal
 * @param handle - Native handler token.
 * @returns Checked handler facade.
 */
function handlerFromNative(handle: object): XMLNodeHandler {
  let result = handlerWrappers.get(handle);
  if (!result) {
    result = Object.create(XMLNodeHandler.prototype) as XMLNodeHandler;
    handlers.set(result, handle);
    handlerWrappers.set(handle, result);
  }
  return result;
}

/**
 * Convert native Variant outputs without retaining input accessors.
 *
 * @internal
 * @param attributes - Native attribute record.
 * @returns Independent public attributes.
 */
function attributesFromNative(
  attributes: Record<string, unknown>,
): XMLAttributes {
  return Object.fromEntries(Object.entries(attributes)
    .map(([ key, value ]) => [
      key, variantFromNative(value),
    ])) as XMLAttributes;
}

/** @internal */
export interface XMLNativeParseFrame {
  tag: string;
  element: ElementNativeHandle | null;
  nodeHandler: object | null;
  childHandler: object | null;
}
