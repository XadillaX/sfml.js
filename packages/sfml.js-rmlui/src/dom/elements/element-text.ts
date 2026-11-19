import { Element } from './element';
import { native } from '../../internal/native';
import { elementConstructors } from '../../internal/element-factory';
import type { VariantVector2 } from '../../values/types';

/**
 * Copied outputs from Rml::ElementText::GenerateLine.
 *
 * @zh Rml::ElementText::GenerateLine 的输出快照。
 * @ja Rml::ElementText::GenerateLine の出力コピー。
 * @ko Rml::ElementText::GenerateLine의 출력 복사본입니다.
 */
export interface GeneratedTextLine {
  /**
   * Formatted line after whitespace processing and optional entity decoding.
   *
   * @zh 经空白处理和可选实体解码后的文本行。
   * @ja 空白処理と任意の実体参照デコード後の行。
   * @ko 공백 처리와 선택적 엔티티 디코딩을 거친 줄입니다.
   */
  line: string;

  /**
   * Consumed source UTF-8 bytes, not code points or JavaScript string length.
   *
   * @zh 消耗的源文本 UTF-8 字节数，不是码点数或 JavaScript 字符串长度。
   * @ja 消費した元テキストの UTF-8 バイト数。コードポイント数ではありません。
   * @ko 소비한 원문 UTF-8 바이트 수이며 코드 포인트나 JS 문자열 길이가 아닙니다.
   */
  lineLength: number;

  /**
   * Measured width in pixels.
   *
   * @zh 测得的像素宽度。
   * @ja 測定したピクセル幅。
   * @ko 측정한 픽셀 너비입니다.
   */
  lineWidth: number;

  /**
   * Native result; true at end or when no font face is available.
   *
   * @zh 原生结果：到达末尾或字体不可用时为 true。
   * @ja ネイティブ結果。終端またはフォント未設定時は true。
   * @ko 네이티브 결과이며 끝에 도달하거나 글꼴이 없으면 true입니다.
   */
  reachedEnd: boolean;
}

/**
 * Copy of Rml::ElementText::Line.
 *
 * @zh Rml::ElementText::Line 的副本。
 * @ja Rml::ElementText::Line のコピー。
 * @ko Rml::ElementText::Line의 복사본입니다.
 */
export interface TextLine {
  /**
   * Contents submitted to the native font engine.
   *
   * @zh 提交给原生字体引擎的内容。
   * @ja ネイティブフォントエンジンに渡す内容。
   * @ko 네이티브 글꼴 엔진에 전달하는 내용입니다.
   */
  text: string;

  /**
   * Baseline offset from the first line, in pixels.
   *
   * @zh 相对首行的基线偏移，单位为像素。
   * @ja 最初の行からのベースラインオフセット。単位はピクセル。
   * @ko 첫 줄 기준 베이스라인 오프셋이며 픽셀 단위입니다.
   */
  position: VariantVector2;

  /**
   * Native integer width, initially zero until geometry generation.
   *
   * @zh 原生整数宽度，生成几何前初始为零。
   * @ja ネイティブ整数幅。ジオメトリ生成までは初期値ゼロ。
   * @ko 네이티브 정수 너비이며 지오메트리 생성 전 초깃값은 0입니다.
   */
  width: number;
}

/**
 * Checked Rml::ElementText wrapper with native text layout operations.
 *
 * @zh 带类型检查的 Rml::ElementText 包装器，提供原生文本排版操作。
 * @ja ネイティブ文字組み操作を持つ検証付き Rml::ElementText ラッパー。
 * @ko 네이티브 텍스트 레이아웃 작업을 제공하는 검증된 Rml::ElementText 래퍼입니다.
 */
export class ElementText extends Element {
  /**
   * Read the raw text through Rml::ElementText::GetText.
   *
   * @zh 通过 Rml::ElementText::GetText 读取原始文本。
   * @ja Rml::ElementText::GetText で元テキストを取得します。
   * @ko Rml::ElementText::GetText로 원문을 읽습니다.
   * @returns Raw text before formatting.
   * @zh 格式化前的原始文本。
   * @ja 書式処理前の元テキスト。
   * @ko 서식 처리 전 원문입니다.
   */
  getText(): string {
    return native.getText(this.handle);
  }

  /**
   * Replace raw text through Rml::ElementText::SetText.
   *
   * @zh 通过 Rml::ElementText::SetText 替换原始文本。
   * @ja Rml::ElementText::SetText で元テキストを置換します。
   * @ko Rml::ElementText::SetText로 원문을 교체합니다.
   * @param text - Literal text, not RML.
   * @zh text - 字面文本。
   * @ja text - リテラルテキスト。
   * @ko text - 리터럴 텍스트입니다.
   */
  setText(text: string): void {
    native.setText(this.handle, text);
  }

  /**
   * Format and measure a line through Rml::ElementText::GenerateLine.
   *
   * @zh 通过 Rml::ElementText::GenerateLine 格式化并测量文本行。
   * @ja Rml::ElementText::GenerateLine で行を書式処理して測定します。
   * @ko Rml::ElementText::GenerateLine으로 줄 서식을 처리하고 측정합니다.
   * @param lineBegin - UTF-8 byte offset at a character boundary or text end.
   * @zh lineBegin - 位于字符边界的 UTF-8 字节偏移，允许文本末尾。
   * @ja lineBegin - 文字境界の UTF-8 バイト位置。終端も有効。
   * @ko lineBegin - 문자 경계의 UTF-8 바이트 오프셋이며 끝 위치도 허용합니다.
   * @param maximumLineWidth - Nonnegative pixel width; Infinity is unlimited.
   * @zh maximumLineWidth - 非负像素宽度，Infinity 表示不限宽。
   * @ja maximumLineWidth - 非負のピクセル幅。Infinity は無制限。
   * @ko maximumLineWidth - 음수가 아닌 픽셀 너비이며 Infinity는 무제한입니다.
   * @param rightSpacingWidth - Finite pixel space after the last token.
   * @zh rightSpacingWidth - 最后一个词元右侧预留的有限像素宽度。
   * @ja rightSpacingWidth - 最後のトークン後に確保する有限のピクセル幅。
   * @ko rightSpacingWidth - 마지막 토큰 뒤에 확보할 유한 픽셀 너비입니다.
   * @param trimWhitespacePrefix - Remove prefix when collapsing whitespace.
   * @zh trimWhitespacePrefix - 合并空白时移除前导空白。
   * @ja trimWhitespacePrefix - 空白をまとめる際に先頭の空白を除くか。
   * @ko trimWhitespacePrefix - 공백을 합칠 때 선행 공백을 제거할지 여부입니다.
   * @param decodeEscapeCharacters - Decode native supported RML entities.
   * @zh decodeEscapeCharacters - 解码原生支持的 RML 实体。
   * @ja decodeEscapeCharacters - ネイティブ対応の RML 実体参照をデコードするか。
   * @ko decodeEscapeCharacters - 네이티브 지원 RML 엔티티 디코딩 여부입니다.
   * @param allowEmpty - Permit consuming zero tokens when none fit.
   * @zh allowEmpty - 无词元可容纳时允许不消耗文本。
   * @ja allowEmpty - 収まらない場合にトークンを消費しないことを許すか。
   * @ko allowEmpty - 맞는 토큰이 없으면 텍스트를 소비하지 않도록 허용합니다.
   * @returns Copied native outputs; does not add a line to the element.
   * @zh 原生输出快照；不会向元素添加文本行。
   * @ja 出力コピー。要素に行を追加する操作ではありません。
   * @ko 네이티브 출력 복사본이며 요소에 줄을 추가하지 않습니다.
   * @remarks
   * Load a font and update the owning context first. Native lineLength counts
   * source bytes before formatting. Mutating/layout calls reject event reentry.
   * @zh 先加载字体并更新所属上下文。lineLength 统计格式化前的源字节数。
   * 修改和排版操作禁止事件回调重入。
   * @ja 先にフォントを読み込みコンテキストを更新してください。lineLength は
   * 処理前のバイト数です。変更・文字組み操作はイベントから再入できません。
   * @ko 먼저 글꼴을 로드하고 컨텍스트를 갱신하세요. lineLength는 처리 전 바이트
   * 수입니다. 변경 및 레이아웃 호출은 이벤트 콜백에서 재진입할 수 없습니다.
   */
  generateLine(
    lineBegin: number, maximumLineWidth: number, rightSpacingWidth: number,
    trimWhitespacePrefix: boolean, decodeEscapeCharacters: boolean,
    allowEmpty: boolean,
  ): GeneratedTextLine {
    return native.generateTextLine(
      this.handle, lineBegin, maximumLineWidth, rightSpacingWidth,
      trimWhitespacePrefix, decodeEscapeCharacters, allowEmpty,
    );
  }

  /**
   * Clear generated lines through Rml::ElementText::ClearLines.
   *
   * @zh 通过 Rml::ElementText::ClearLines 清空已生成的行。
   * @ja Rml::ElementText::ClearLines で生成済みの行を消去します。
   * @ko Rml::ElementText::ClearLines로 생성된 줄을 지웁니다.
   */
  clearLines(): void {
    native.clearTextLines(this.handle);
  }

  /**
   * Append a manually positioned line through Rml::ElementText::AddLine.
   *
   * @zh 通过 Rml::ElementText::AddLine 追加手动定位的文本行。
   * @ja Rml::ElementText::AddLine で手動配置の行を追加します。
   * @ko Rml::ElementText::AddLine으로 수동 배치한 줄을 추가합니다.
   * @param linePosition - Finite baseline offset from the first line in pixels.
   * @zh linePosition - 相对首行的有限基线偏移，单位为像素。
   * @ja linePosition - 最初の行からの有限ベースラインオフセット。ピクセル単位。
   * @ko linePosition - 첫 줄 기준 유한 베이스라인 오프셋이며 픽셀 단위입니다.
   * @param line - Already formatted contents.
   * @zh line - 已格式化的内容。
   * @ja line - 書式処理済みの内容。
   * @ko line - 서식 처리된 내용입니다.
   */
  addLine(linePosition: VariantVector2, line: string): void {
    native.addTextLine(this.handle, linePosition, line);
  }

  /**
   * Stop text changes dirtying layout via Rml::ElementText::SuppressAutoLayout.
   *
   * @zh 通过 Rml::ElementText::SuppressAutoLayout 禁止文本变化标脏布局。
   * @ja Rml::ElementText::SuppressAutoLayout でテキスト変更時の再配置を抑制します。
   * @ko Rml::ElementText::SuppressAutoLayout으로 텍스트 변경 시 재배치를 억제합니다.
   * @remarks
   * Native one-way setting. Other document changes may still trigger layout.
   * @zh 原生单向设置，其他文档变化仍可能触发布局。
   * @ja ネイティブの一方向設定。他の文書変更では再配置される場合があります。
   * @ko 네이티브 단방향 설정이며 다른 문서 변경은 재배치를 유발할 수 있습니다.
   */
  suppressAutoLayout(): void {
    native.suppressTextAutoLayout(this.handle);
  }

  /**
   * Copy Rml::ElementText::GetLines, including positions and native widths.
   *
   * @zh 复制 Rml::ElementText::GetLines，包括位置和原生宽度。
   * @ja 位置とネイティブ幅を含む Rml::ElementText::GetLines をコピーします。
   * @ko 위치와 네이티브 너비를 포함한 Rml::ElementText::GetLines를 복사합니다.
   * @returns Independent snapshots unaffected by later layout or destruction.
   * @zh 独立快照，不受后续布局或销毁影响。
   * @ja 後の再配置や破棄に影響されない独立したコピー。
   * @ko 이후 재배치나 파괴의 영향을 받지 않는 독립 복사본입니다.
   */
  getLines(): TextLine[] {
    return native.getTextLines(this.handle);
  }
}

elementConstructors.set('ElementText', ElementText);
