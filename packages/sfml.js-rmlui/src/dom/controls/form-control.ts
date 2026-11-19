import { Element } from '../elements/element';
import { native } from '../../internal/native';
import { elementConstructors } from '../../internal/element-factory';
import {
  ElementInstancer, elementInstancerFromNative,
} from '../elements/element-instancer';

/**
 * Native Rml::ElementFormControl base wrapper; obtain it from a document.
 *
 * @zh 原生 Rml::ElementFormControl 基类包装器，通过文档获取。
 * @ja 文書から取得する Rml::ElementFormControl 基底ラッパー。
 * @ko 문서에서 얻는 네이티브 Rml::ElementFormControl 기본 래퍼입니다.
 */
export class ElementFormControl extends Element {
  /**
   * Create a native allocator storing abstract control values in attributes.
   *
   * @zh 创建以属性实现抽象控件值的原生分配器。
   * @ja 抽象入力の値を属性として実装するネイティブ生成器を作ります。
   * @ko 추상 컨트롤 값을 속성으로 구현하는 네이티브 생성기를 만듭니다.
   * @param valueAttribute - Non-empty attribute key without null characters.
   * @zh valueAttribute - 非空属性名，不得包含空字符。
   * @ja valueAttribute - 空文字やヌル文字を含まない属性名。
   * @ko valueAttribute - 비어 있지 않고 널 문자가 없는 속성 이름입니다.
   * @returns Owned native ElementInstancer, invalidated on shutdown.
   * @zh 自有原生 ElementInstancer，在关闭时失效。
   * @ja 終了時に無効となる所有ネイティブ ElementInstancer。
   * @ko 종료 시 무효화되는 소유 네이티브 ElementInstancer입니다.
   * @remarks
   * GetValue reads this attribute as a native string, defaulting to empty;
   * SetValue writes it. Name, disabled, focus and IsSubmitted use the real
   * ElementFormControl base. Values and data-attr updates execute in Native
   * without JS virtual callbacks. JS subclass overrides do not override
   * native virtuals. Factory applies attributes; direct instanceElement
   * does not. Direct control clones retain the original allocator and key,
   * copying release observers without replaying JS allocation callbacks.
   * Ancestor clones reparse descendants through current Factory registrations.
   * Native Form::Submit selects only input, textarea and select tags.
   * @zh GetValue 将此属性读取为原生字符串，缺省为空；SetValue 写入同一属性。
   * 名称、禁用、焦点及 IsSubmitted 使用真实 ElementFormControl 基类。
   * 值访问及 data-attr 更新在 Native 执行，不调用 JS 虚方法。
   * JS 子类重写不会重写原生虚方法。Factory 应用属性，直接 instanceElement 不应用。
   * 直接克隆控件保留原分配器及属性名，复制释放观察者而不重放 JS 分配回调。
   * 祖先克隆按当前 Factory 注册重新解析后代。
   * 原生 Form::Submit 仅选择 input、textarea、select 标签。
   * @ja GetValue は属性を文字列として読み、未設定時は空文字。SetValue は同じ属性に
   * 書き込みます。名前・無効状態・フォーカス・IsSubmitted は実際の基底を使います。
   * 値と data-attr 更新は JS 仮想コールバックなしでネイティブ実行します。
   * JS サブクラスの上書きはネイティブ仮想関数に適用しません。Factory は属性を
   * 設定し、直接 instanceElement は設定しません。入力の直接複製は元の生成器、
   * 属性名と解放通知を保持し、JS 生成コールバックを再実行しません。
   * 祖先の複製は現在の Factory 登録で子孫を再解析します。
   * Form::Submit の対象タグは input、textarea、select のみです。
   * @ko GetValue는 속성을 네이티브 문자열로 읽으며 기본값은 빈 문자열입니다.
   * SetValue는 같은 속성에 씁니다. 이름, 비활성화, 포커스, IsSubmitted는 실제
   * 기반 클래스를 사용합니다. 값과 data-attr 갱신은 JS 가상 콜백 없이 Native에서
   * 실행합니다. JS 하위 클래스 재정의는 네이티브 가상 함수에 적용하지 않습니다.
   * Factory는 속성을 적용하고 직접 instanceElement는 적용하지 않습니다.
   * 컨트롤 직접 복제는 원래 생성기, 속성 이름과 해제 관찰자를 유지하며
   * JS 생성 콜백을 다시 실행하지 않습니다.
   * 조상 복제는 현재 Factory 등록으로 자손을 다시 파싱합니다.
   * Form::Submit는 input, textarea, select 태그만 선택합니다.
   */
  static createInstancer(valueAttribute = 'value'): ElementInstancer {
    return elementInstancerFromNative(
      native.createFormControlInstancer(valueAttribute));
  }

  /**
   * Get the control name used when submitting its form.
   *
   * @zh 获取表单提交时使用的控件名称。
   * @ja フォーム送信時に使うコントロール名を取得します。
   * @ko 폼 제출에 사용하는 컨트롤 이름을 가져옵니다.
   * @returns Submission name, which need not be unique.
   * @zh 提交名称，不要求唯一。
   * @ja 一意である必要のない送信名。
   * @ko 고유할 필요가 없는 제출 이름입니다.
   */
  getName(): string {
    return native.getControlName(this.handle);
  }

  /**
   * Call Rml::ElementFormControl::SetName.
   *
   * @zh 调用 Rml::ElementFormControl::SetName。
   * @ja Rml::ElementFormControl::SetName を呼びます。
   * @ko Rml::ElementFormControl::SetName을 호출합니다.
   * @param name - Submission name.
   * @zh name - 提交名称。
   * @ja name - 送信名。
   * @ko name - 제출 이름입니다.
   */
  setName(name: string): void {
    native.setControlName(this.handle, name);
  }

  /**
   * Call the native virtual GetValue for this control type.
   *
   * @zh 调用当前控件类型的原生虚方法 GetValue。
   * @ja この入力型のネイティブ仮想メソッド GetValue を呼びます。
   * @ko 해당 컨트롤 타입의 네이티브 가상 메서드 GetValue를 호출합니다.
   * @returns Native string value.
   * @zh 原生字符串值。
   * @ja ネイティブの文字列値。
   * @ko 네이티브 문자열 값입니다.
   */
  getValue(): string {
    return native.getControlValue(this.handle);
  }

  /**
   * Call the native virtual SetValue, including select option preparation.
   *
   * @zh 调用原生虚方法 SetValue，包括下拉选项的准备过程。
   * @ja 選択肢の準備を含むネイティブ仮想メソッド SetValue を呼びます。
   * @ko 선택 항목 준비를 포함한 네이티브 가상 메서드 SetValue를 호출합니다.
   * @param value - New value, interpreted by the native control.
   * @zh value - 新值，由原生控件处理。
   * @ja value - ネイティブ入力が解釈する新しい値。
   * @ko value - 네이티브 컨트롤이 해석할 새 값입니다.
   */
  setValue(value: string): void {
    native.setControlValue(this.handle, value);
  }

  /**
   * Call the native virtual IsSubmitted.
   *
   * @zh 调用原生虚方法 IsSubmitted。
   * @ja ネイティブ仮想メソッド IsSubmitted を呼びます。
   * @ko 네이티브 가상 메서드 IsSubmitted를 호출합니다.
   * @returns Whether this type/state contributes a value; disabled is separate.
   * @zh 此类型及状态是否参与提交；禁用状态另行判断。
   * @ja 型と状態が送信対象か。無効状態の判定は別です。
   * @ko 타입과 상태의 제출 참여 여부이며 비활성 상태는 별도입니다.
   */
  isSubmitted(): boolean {
    return native.isControlSubmitted(this.handle);
  }

  /**
   * Check whether the control has the disabled attribute.
   *
   * @zh 查询控件是否具有 disabled 属性。
   * @ja コントロールに disabled 属性があるかを調べます。
   * @ko 컨트롤에 disabled 속성이 있는지 확인합니다.
   * @returns Presence of the disabled attribute.
   * @zh 是否存在 disabled 属性。
   * @ja disabled 属性が存在するか。
   * @ko disabled 속성의 존재 여부입니다.
   */
  isDisabled(): boolean {
    return native.isControlDisabled(this.handle);
  }

  /**
   * Call Rml::ElementFormControl::SetDisabled.
   *
   * @zh 调用 Rml::ElementFormControl::SetDisabled。
   * @ja Rml::ElementFormControl::SetDisabled を呼びます。
   * @ko Rml::ElementFormControl::SetDisabled를 호출합니다.
   * @param disabled - True adds the disabled attribute; false removes it.
   * @zh disabled - true 添加 disabled 属性；false 移除。
   * @ja disabled - true は disabled 属性を追加し、false は削除します。
   * @ko disabled - true는 disabled 속성을 추가하고 false는 제거합니다.
   */
  setDisabled(disabled: boolean): void {
    native.setControlDisabled(this.handle, disabled);
  }
}

elementConstructors.set('ElementFormControl', ElementFormControl);

/**
 * Copied native text selection, in Unicode code points rather than UTF-16.
 *
 * @zh 原生文本选区快照，索引单位为 Unicode 码点，不是 UTF-16。
 * @ja UTF-16 ではなく Unicode コードポイント単位の選択範囲コピー。
 * @ko UTF-16이 아닌 유니코드 코드 포인트 단위의 선택 영역 복사본입니다.
 */
export interface TextSelection {
  /**
   * First selected code point.
   *
   * @zh 首个选中的码点。
   * @ja 最初の選択コードポイント。
   * @ko 첫 번째 선택 코드 포인트입니다.
   */
  start: number;

  /**
   * First code point after the selection.
   *
   * @zh 选区后的首个码点。
   * @ja 選択範囲の直後のコードポイント。
   * @ko 선택 영역 바로 다음 코드 포인트입니다.
   */
  end: number;

  /**
   * Selected display text; password inputs return native `*` masks.
   *
   * @zh 选中的显示文本；密码输入框返回原生 `*` 掩码。
   * @ja 選択された表示テキスト。パスワード入力は `*` マスクを返します。
   * @ko 선택된 표시 텍스트이며 암호 입력은 네이티브 `*` 마스크를 반환합니다.
   */
  text: string;
}
