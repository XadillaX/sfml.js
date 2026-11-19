import { Element } from '../elements/element';
import { ElementFormControl } from './form-control';
import { native } from '../../internal/native';
import { elementConstructors } from '../../internal/element-factory';

/**
 * Native Rml::ElementFormControlSelect wrapper.
 *
 * @zh 原生 Rml::ElementFormControlSelect 包装器。
 * @ja Rml::ElementFormControlSelect のネイティブラッパー。
 * @ko 네이티브 Rml::ElementFormControlSelect 래퍼입니다.
 */
export class ElementFormControlSelect extends ElementFormControl {
  /**
   * Call native SetSelection, preparing options before selecting.
   *
   * @zh 调用原生 SetSelection，先准备选项再选择。
   * @ja 選択肢を準備してからネイティブ SetSelection を呼びます。
   * @ko 선택 항목 준비 후 네이티브 SetSelection을 호출합니다.
   * @param index - Int32 option index; out-of-range clears the selection.
   * @zh index - int32 选项索引；越界时清除选择。
   * @ja index - int32 の添字。範囲外なら選択を解除します。
   * @ko index - int32 항목 인덱스이며 범위 밖이면 선택을 해제합니다.
   */
  setSelection(index: number): void {
    native.setSelectSelection(this.handle, index);
  }

  /**
   * Read native GetSelection without preparing pending options.
   *
   * @zh 读取原生 GetSelection，不处理待迁移的选项。
   * @ja 保留中の選択肢を移動せずに GetSelection を読み取ります。
   * @ko 대기 항목 이동 없이 네이티브 GetSelection을 읽습니다.
   * @returns Selected index, or -1 when none is selected.
   * @zh 选中索引；未选中时为 -1。
   * @ja 選択添字。未選択は -1。
   * @ko 선택 인덱스이며 선택이 없으면 -1입니다.
   */
  getSelection(): number {
    return native.getSelectSelection(this.handle);
  }

  /**
   * Call native GetOption, moving pending children into the widget.
   *
   * @zh 调用原生 GetOption，将待处理子节点迁入控件内部。
   * @ja GetOption を呼び、保留中の子を内部ウィジェットへ移動します。
   * @ko GetOption을 호출하여 대기 중인 자식을 내부 위젯으로 이동합니다.
   * @param index - Int32 option index.
   * @zh index - int32 选项索引。
   * @ja index - int32 の選択肢添字。
   * @ko index - int32 항목 인덱스입니다.
   * @returns Canonical option wrapper, or null outside the list.
   * @zh 唯一选项包装器；越界时为 null。
   * @ja 一意の選択肢ラッパー。範囲外は null。
   * @ko 고유 항목 래퍼이며 범위 밖이면 null입니다.
   * @remarks
   * This may destroy non-option children and is prohibited during callbacks.
   * @zh 此方法可能销毁非 option 子节点，回调期间禁止调用。
   * @ja option 以外の子を破棄する可能性があり、コールバック中は呼べません。
   * @ko option이 아닌 자식을 파괴할 수 있으며 콜백 중에는 호출할 수 없습니다.
   */
  getOption(index: number): Element | null {
    const handle = native.getSelectOption(this.handle, index);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Count options through native GetNumOptions, preparing pending children.
   *
   * @zh 通过原生 GetNumOptions 统计选项，包含待处理子节点的迁移。
   * @ja 保留中の子を処理し、GetNumOptions で選択肢を数えます。
   * @ko 대기 자식을 처리하고 GetNumOptions로 항목 수를 셉니다.
   * @returns Option count; prohibited during callbacks, like getOption.
   * @zh 选项数量；与 getOption 一样，回调期间禁止调用。
   * @ja 選択肢数。getOption と同様、コールバック中は呼べません。
   * @ko 항목 수이며 getOption과 마찬가지로 콜백 중 호출은 금지됩니다.
   */
  getNumOptions(): number {
    return native.getSelectNumOptions(this.handle);
  }

  /**
   * Add RML content through native Add(rml, value, before, selectable).
   *
   * @zh 通过原生 Add(rml, value, before, selectable) 添加 RML 内容。
   * @ja ネイティブ Add(rml, value, before, selectable) で RML を追加します。
   * @ko 네이티브 Add(rml, value, before, selectable)로 RML을 추가합니다.
   * @param rml - Option contents; may contain markup.
   * @zh rml - 选项内容，允许标记。
   * @ja rml - マークアップを含められる選択肢の内容。
   * @ko rml - 마크업을 포함할 수 있는 항목 내용입니다.
   * @param value - Submitted value.
   * @zh value - 提交值。
   * @ja value - 送信値。
   * @ko value - 제출 값입니다.
   * @param before - Int32 insertion index; out-of-range appends. Default -1.
   * @zh before - int32 插入索引；越界时追加，默认 -1。
   * @ja before - int32 挿入添字。範囲外は末尾。既定値 -1。
   * @ko before - int32 삽입 인덱스이며 범위 밖이면 끝에 추가합니다. 기본값 -1.
   * @param selectable - False adds disabled; default true.
   * @zh selectable - false 添加 disabled 属性，默认 true。
   * @ja selectable - false なら disabled を追加。既定値 true。
   * @ko selectable - false이면 disabled를 추가합니다. 기본값 true.
   * @returns New option index.
   * @zh 新选项索引。
   * @ja 新しい選択肢の添字。
   * @ko 새 항목 인덱스입니다.
   */
  add(
    rml: string, value: string, before?: number, selectable?: boolean,
  ): number;

  /**
   * Transfer a detached owned option through native Add(ElementPtr, before).
   *
   * @zh 通过原生 Add(ElementPtr, before) 转移脱离树的 option 所有权。
   * @ja Add(ElementPtr, before) で未接続 option の所有権を移譲します。
   * @ko Add(ElementPtr, before)로 분리된 option 소유권을 이전합니다.
   * @param element - Detached owned option; wrapper identity is preserved.
   * @zh element - 持有所有权的脱离 option，包装器身份保持不变。
   * @ja element - 所有権付き未接続 option。ラッパーの同一性は保持されます。
   * @ko element - 소유권이 있는 분리 option이며 래퍼 동일성을 유지합니다.
   * @param before - Int32 insertion index; default -1 appends.
   * @zh before - int32 插入索引，默认 -1 表示追加。
   * @ja before - int32 挿入添字。既定値 -1 は末尾。
   * @ko before - int32 삽입 인덱스이며 기본값 -1은 끝에 추가합니다.
   * @returns New option index.
   * @zh 新选项索引。
   * @ja 新しい選択肢の添字。
   * @ko 새 항목 인덱스입니다.
   */
  add(element: Element, before?: number): number;
  add(
    content: string | Element, valueOrBefore?: string | number,
    before = -1, selectable = true,
  ): number {
    if (typeof content === 'string') {
      return native.addSelectOptionRml(
        this.handle, content, valueOrBefore as string, before, selectable,
      );
    }
    return native.addSelectOptionElement(
      this.handle, content.handle, valueOrBefore === undefined
        ? -1 : valueOrBefore as number,
    );
  }

  /**
   * Destroy an option through native Remove.
   *
   * @zh 通过原生 Remove 销毁选项。
   * @ja ネイティブ Remove で選択肢を破棄します。
   * @ko 네이티브 Remove로 항목을 파괴합니다.
   * @param index - Int32 index; out-of-range does nothing.
   * @zh index - int32 索引；越界时无操作。
   * @ja index - int32 添字。範囲外は何もしません。
   * @ko index - int32 인덱스이며 범위 밖이면 아무 작업도 하지 않습니다.
   */
  remove(index: number): void {
    native.removeSelectOption(this.handle, index);
  }

  /**
   * Destroy all options through native RemoveAll; retained wrappers expire.
   *
   * @zh 通过原生 RemoveAll 销毁所有选项；保留的包装器失效。
   * @ja RemoveAll で全選択肢を破棄します。保持したラッパーは無効になります。
   * @ko RemoveAll로 모든 항목을 파괴하며 보관한 래퍼는 무효화됩니다.
   */
  removeAll(): void {
    native.removeAllSelectOptions(this.handle);
  }

  /**
   * Open the native selection box through ShowSelectBox.
   *
   * @zh 通过 ShowSelectBox 打开原生选择框。
   * @ja ShowSelectBox でネイティブ選択ボックスを開きます。
   * @ko ShowSelectBox로 네이티브 선택 상자를 엽니다.
   */
  showSelectBox(): void {
    native.showSelectBox(this.handle);
  }

  /**
   * Close the native selection box through HideSelectBox, keeping its value.
   *
   * @zh 通过 HideSelectBox 关闭原生选择框，保留当前值。
   * @ja HideSelectBox で現在の値を保持して選択ボックスを閉じます。
   * @ko HideSelectBox로 현재 값을 유지한 채 선택 상자를 닫습니다.
   */
  hideSelectBox(): void {
    native.hideSelectBox(this.handle);
  }

  /**
   * Call CancelSelectBox, restoring the opening value and closing the box.
   *
   * @zh 调用 CancelSelectBox，恢复打开时的值并关闭选择框。
   * @ja CancelSelectBox で開いた時の値を復元して閉じます。
   * @ko CancelSelectBox로 열 때의 값을 복원하고 닫습니다.
   * @remarks
   * May run in a keydown listener before stopping Escape propagation.
   * @zh 可在 keydown 监听器中调用，再停止 Escape 事件传播。
   * @ja keydown リスナーで呼び、Escape の伝播を停止できます。
   * @ko keydown 리스너에서 호출한 뒤 Escape 전파를 중지할 수 있습니다.
   */
  cancelSelectBox(): void {
    native.cancelSelectBox(this.handle);
  }

  /**
   * Read native IsSelectBoxVisible.
   *
   * @zh 读取原生 IsSelectBoxVisible。
   * @ja ネイティブ IsSelectBoxVisible を読み取ります。
   * @ko 네이티브 IsSelectBoxVisible을 읽습니다.
   * @returns Whether the selection box is open.
   * @zh 选择框是否打开。
   * @ja 選択ボックスが開いているか。
   * @ko 선택 상자가 열려 있는지 여부입니다.
   */
  isSelectBoxVisible(): boolean {
    return native.isSelectBoxVisible(this.handle);
  }
}

elementConstructors.set('ElementFormControlSelect', ElementFormControlSelect);
