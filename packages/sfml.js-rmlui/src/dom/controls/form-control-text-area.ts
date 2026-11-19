import { ElementFormControl, type TextSelection } from './form-control';
import { native } from '../../internal/native';
import { elementConstructors } from '../../internal/element-factory';

/**
 * Native Rml::ElementFormControlTextArea wrapper.
 *
 * @zh 原生 Rml::ElementFormControlTextArea 包装器。
 * @ja Rml::ElementFormControlTextArea のネイティブラッパー。
 * @ko 네이티브 Rml::ElementFormControlTextArea 래퍼입니다.
 */
export class ElementFormControlTextArea extends ElementFormControl {
  /**
   * Call native SetNumColumns.
   *
   * @zh 调用原生 SetNumColumns。
   * @ja ネイティブの SetNumColumns を呼びます。
   * @ko 네이티브 SetNumColumns를 호출합니다.
   * @param columns - Int32 column count, clamped to at least one.
   * @zh columns - int32 列数，最小为 1。
   * @ja columns - int32 の列数。最小値は 1。
   * @ko columns - int32 열 수이며 최솟값은 1입니다.
   */
  setNumColumns(columns: number): void {
    native.setTextAreaNumColumns(this.handle, columns);
  }

  /**
   * Read native GetNumColumns.
   *
   * @zh 读取原生 GetNumColumns。
   * @ja ネイティブの GetNumColumns を読み取ります。
   * @ko 네이티브 GetNumColumns를 읽습니다.
   * @returns Approximate visible characters per line; default 20.
   * @zh 每行近似可见字符数，默认 20。
   * @ja 1 行のおおよその可視文字数。既定値 20。
   * @ko 행당 대략적인 표시 문자 수이며 기본값은 20입니다.
   */
  getNumColumns(): number {
    return native.getTextAreaNumColumns(this.handle);
  }

  /**
   * Call native SetNumRows.
   *
   * @zh 调用原生 SetNumRows。
   * @ja ネイティブの SetNumRows を呼びます。
   * @ko 네이티브 SetNumRows를 호출합니다.
   * @param rows - Int32 row count, clamped to at least one.
   * @zh rows - int32 行数，最小为 1。
   * @ja rows - int32 の行数。最小値は 1。
   * @ko rows - int32 행 수이며 최솟값은 1입니다.
   */
  setNumRows(rows: number): void {
    native.setTextAreaNumRows(this.handle, rows);
  }

  /**
   * Read native GetNumRows.
   *
   * @zh 读取原生 GetNumRows。
   * @ja ネイティブの GetNumRows を読み取ります。
   * @ko 네이티브 GetNumRows를 읽습니다.
   * @returns Visible line count; default 2.
   * @zh 可见行数，默认 2。
   * @ja 可視行数。既定値 2。
   * @ko 표시 행 수이며 기본값은 2입니다.
   */
  getNumRows(): number {
    return native.getTextAreaNumRows(this.handle);
  }

  /**
   * Call native SetMaxLength.
   *
   * @zh 调用原生 SetMaxLength。
   * @ja ネイティブの SetMaxLength を呼びます。
   * @ko 네이티브 SetMaxLength를 호출합니다.
   * @param length - Maximum code points; negative means unlimited. Int32.
   * @zh length - 最大码点数，负数表示无限制，须为 int32。
   * @ja length - 最大コードポイント数。負なら無制限。int32。
   * @ko length - 최대 코드 포인트 수이며 음수는 무제한입니다. int32.
   * @remarks
   * Changing the limit clamps existing text. Native setValue can exceed it;
   * user editing applies the limit.
   * @zh 修改上限会截短已有文本。原生 setValue 可超出上限，用户编辑受上限限制。
   * @ja 上限の変更で既存テキストを切り詰めます。setValue は超過でき、
   * ユーザー編集には上限が適用されます。
   * @ko 제한 변경 시 기존 텍스트를 자릅니다. setValue는 제한을 넘을 수 있으며
   * 사용자 편집에는 제한을 적용합니다.
   */
  setMaxLength(length: number): void {
    native.setTextAreaMaxLength(this.handle, length);
  }

  /**
   * Read native GetMaxLength.
   *
   * @zh 读取原生 GetMaxLength。
   * @ja ネイティブの GetMaxLength を読み取ります。
   * @ko 네이티브 GetMaxLength를 읽습니다.
   * @returns Maximum code points; default -1 means unlimited.
   * @zh 最大码点数；默认 -1，表示无限制。
   * @ja 最大コードポイント数。既定値 -1 は無制限。
   * @ko 최대 코드 포인트 수이며 기본값 -1은 무제한입니다.
   */
  getMaxLength(): number {
    return native.getTextAreaMaxLength(this.handle);
  }

  /**
   * Call native SetWordWrap, updating the wrap attribute and layout properties.
   *
   * @zh 调用原生 SetWordWrap，更新 wrap 属性及布局属性。
   * @ja SetWordWrap で wrap 属性とレイアウトプロパティを更新します。
   * @ko SetWordWrap으로 wrap 속성과 레이아웃 속성을 갱신합니다.
   * @param enabled - Whether to wrap text.
   * @zh enabled - 是否自动换行。
   * @ja enabled - 折り返しを有効にするか。
   * @ko enabled - 자동 줄바꿈 사용 여부입니다.
   */
  setWordWrap(enabled: boolean): void {
    native.setTextAreaWordWrap(this.handle, enabled);
  }

  /**
   * Read native GetWordWrap.
   *
   * @zh 读取原生 GetWordWrap。
   * @ja ネイティブの GetWordWrap を読み取ります。
   * @ko 네이티브 GetWordWrap을 읽습니다.
   * @returns Whether wrapping is enabled; default true.
   * @zh 是否自动换行，默认 true。
   * @ja 折り返しが有効か。既定値 true。
   * @ko 자동 줄바꿈 여부이며 기본값은 true입니다.
   */
  getWordWrap(): boolean {
    return native.getTextAreaWordWrap(this.handle);
  }

  /**
   * Call native Select; selects all text when this control has focus.
   *
   * @zh 调用原生 Select，控件有焦点时全选文本。
   * @ja Select を呼び、フォーカスがあれば全文を選択します。
   * @ko Select를 호출하며 포커스가 있으면 전체 텍스트를 선택합니다.
   */
  select(): void {
    native.selectTextArea(this.handle);
  }

  /**
   * Call native SetSelectionRange; requires focus.
   *
   * @zh 调用原生 SetSelectionRange，需要焦点。
   * @ja SetSelectionRange を呼びます。フォーカスが必要です。
   * @ko SetSelectionRange를 호출하며 포커스가 필요합니다.
   * @param start - First code point; int32, clamped by native code.
   * @zh start - 起始码点，int32，由原生代码限制范围。
   * @ja start - 開始コードポイント。int32。範囲はネイティブ側で制限されます。
   * @ko start - 시작 코드 포인트입니다. int32이며 네이티브에서 범위를 제한합니다.
   * @param end - Exclusive end code point; int32. Reversed ranges select back.
   * @zh end - 结束码点，不含该位置，int32；反向范围向后选择。
   * @ja end - 終端の次のコードポイント。int32。逆順は後方選択です。
   * @ko end - 포함하지 않는 끝 코드 포인트입니다. int32이며 역순도 지원합니다.
   */
  setSelectionRange(start: number, end: number): void {
    native.setTextAreaSelection(this.handle, start, end);
  }

  /**
   * Copy native GetSelection output.
   *
   * @zh 复制原生 GetSelection 的输出。
   * @ja ネイティブ GetSelection の出力をコピーします。
   * @ko 네이티브 GetSelection 출력을 복사합니다.
   * @returns Code-point range and selected text.
   * @zh 码点范围及选中的文本。
   * @ja コードポイント範囲と選択テキスト。
   * @ko 코드 포인트 범위와 선택 텍스트입니다.
   */
  getSelection(): TextSelection {
    return native.getTextAreaSelection(this.handle);
  }

  /**
   * Set native IME composition feedback without modifying or committing text.
   *
   * @zh 设置原生 IME 组合反馈，不修改或提交文本。
   * @ja テキストを変更・確定せず、ネイティブ IME 合成の表示を設定します。
   * @ko 텍스트 변경이나 확정 없이 네이티브 IME 조합 표시를 설정합니다.
   * @param start - Starting code point; int32.
   * @zh start - 起始码点，int32。
   * @ja start - 開始コードポイント。int32。
   * @ko start - 시작 코드 포인트입니다. int32.
   * @param end - Exclusive end code point; end <= start clears feedback.
   * @zh end - 结束码点，不含该位置；end <= start 清除反馈。
   * @ja end - 終端の次のコードポイント。end <= start なら表示を解除します。
   * @ko end - 포함하지 않는 끝 코드 포인트이며 end <= start는 표시를 지웁니다.
   */
  setCompositionRange(start: number, end: number): void {
    native.setTextAreaCompositionRange(this.handle, start, end);
  }
}

elementConstructors.set(
  'ElementFormControlTextArea', ElementFormControlTextArea,
);
