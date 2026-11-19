import { ElementFormControl, type TextSelection } from './form-control';
import { native } from '../../internal/native';
import { elementConstructors } from '../../internal/element-factory';

/**
 * Rml::ElementFormControlInput, including native input-type behavior.
 *
 * @zh Rml::ElementFormControlInput，保留原生输入类型行为。
 * @ja ネイティブ入力型の動作を保つ Rml::ElementFormControlInput。
 * @ko 네이티브 입력 타입 동작을 유지하는 Rml::ElementFormControlInput입니다.
 */
export class ElementFormControlInput extends ElementFormControl {
  /**
   * Select all text through Rml::ElementFormControlInput::Select.
   *
   * @zh 通过 Rml::ElementFormControlInput::Select 全选文本。
   * @ja Rml::ElementFormControlInput::Select で全文を選択します。
   * @ko Rml::ElementFormControlInput::Select로 전체 텍스트를 선택합니다.
   * @remarks
   * Requires focus; applies only to text/password inputs.
   * @zh 需要焦点，仅适用于 text/password 输入框。
   * @ja フォーカスが必要です。text/password 入力のみ対象です。
   * @ko 포커스가 필요하며 text/password 입력에만 적용됩니다.
   */
  select(): void {
    native.selectInput(this.handle);
  }

  /**
   * Call Rml::ElementFormControlInput::SetSelectionRange; requires focus.
   *
   * @zh 调用 Rml::ElementFormControlInput::SetSelectionRange，需要焦点。
   * @ja Rml::ElementFormControlInput::SetSelectionRange。フォーカスが必要です。
   * @ko Rml::ElementFormControlInput::SetSelectionRange이며 포커스가 필요합니다.
   * @param start - First code point, clamped by native code; int32.
   * @zh start - 起始码点，由原生代码限制范围，须为 int32。
   * @ja start - ネイティブ側で制限される開始コードポイント。int32。
   * @ko start - 네이티브에서 범위를 제한하는 시작 코드 포인트입니다. int32.
   * @param end - Exclusive end code point; int32. Reversed ranges select back.
   * @zh end - 结束码点，不包含该位置，须为 int32；反向范围向后选择。
   * @ja end - 終端の次のコードポイント。int32。逆順は後方選択です。
   * @ko end - 포함하지 않는 끝 코드 포인트입니다. int32이며 역순도 지원합니다.
   */
  setSelectionRange(start: number, end: number): void {
    native.setInputSelection(this.handle, start, end);
  }

  /**
   * Copy Rml::ElementFormControlInput::GetSelection.
   *
   * @zh 复制 Rml::ElementFormControlInput::GetSelection 的结果。
   * @ja Rml::ElementFormControlInput::GetSelection の結果をコピーします。
   * @ko Rml::ElementFormControlInput::GetSelection 결과를 복사합니다.
   * @returns Code-point range and text; non-text types return an empty range.
   * @zh 码点范围和文本；非文本类型返回空选区。
   * @ja コードポイント範囲とテキスト。非テキスト型は空の範囲です。
   * @ko 코드 포인트 범위와 텍스트이며 비텍스트 타입은 빈 범위입니다.
   * @remarks
   * Password selection text contains native `*` masks. getValue returns the
   * actual value; character offsets still refer to the original code points.
   * @zh 密码选区文本包含原生 `*` 掩码；getValue 返回实际值，索引仍对应原始码点。
   * @ja パスワードの選択テキストは `*` です。getValue は実際の値を返し、
   * オフセットは元のコードポイントに対応します。
   * @ko 암호 선택 텍스트는 `*` 마스크입니다. getValue는 실제 값을 반환하며
   * 오프셋은 원래 코드 포인트에 해당합니다.
   */
  getSelection(): TextSelection {
    return native.getInputSelection(this.handle);
  }

  /**
   * Set native IME composition feedback without changing text or committing it.
   *
   * @zh 设置原生 IME 组合反馈，不修改或提交文本。
   * @ja テキストの変更や確定を行わず、IME 合成の表示範囲を設定します。
   * @ko 텍스트를 변경하거나 확정하지 않고 네이티브 IME 조합 표시를 설정합니다.
   * @param start - Starting code point; int32.
   * @zh start - 起始码点，须为 int32。
   * @ja start - 開始コードポイント。int32。
   * @ko start - 시작 코드 포인트입니다. int32.
   * @param end - Exclusive end code point; end <= start clears feedback.
   * @zh end - 结束码点，不含该位置；end <= start 清除反馈。
   * @ja end - 終端の次のコードポイント。end <= start なら表示を解除します。
   * @ko end - 포함하지 않는 끝 코드 포인트이며 end <= start는 표시를 지웁니다.
   */
  setCompositionRange(start: number, end: number): void {
    native.setInputCompositionRange(this.handle, start, end);
  }
}

elementConstructors.set('ElementFormControlInput', ElementFormControlInput);
