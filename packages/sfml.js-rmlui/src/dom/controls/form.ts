import { Element } from '../elements/element';
import { native } from '../../internal/native';
import { elementConstructors } from '../../internal/element-factory';

/**
 * Native Rml::ElementForm wrapper.
 *
 * @zh 原生 Rml::ElementForm 包装器。
 * @ja Rml::ElementForm のネイティブラッパー。
 * @ko 네이티브 Rml::ElementForm 래퍼입니다.
 */
export class ElementForm extends Element {
  /**
   * Submit through Rml::ElementForm::Submit; dispatches a submit event.
   *
   * @zh 通过 Rml::ElementForm::Submit 提交并派发 submit 事件。
   * @ja Rml::ElementForm::Submit で submit イベントを送出します。
   * @ko Rml::ElementForm::Submit으로 submit 이벤트를 전달합니다.
   * @param name - Submitter name; empty uses the key "submit". Default "".
   * @zh name - 提交者名称；空字符串使用键 "submit"，默认 ""。
   * @ja name - 送信者名。空ならキーは "submit"。既定値 ""。
   * @ko name - 제출자 이름이며 비어 있으면 "submit" 키입니다. 기본값 "".
   * @param value - Submitter value; default "".
   * @zh value - 提交者值，默认 ""。
   * @ja value - 送信者の値。既定値 ""。
   * @ko value - 제출자 값이며 기본값은 ""입니다.
   * @remarks
   * Native submission omits disabled, unnamed and non-submitted controls,
   * and joins duplicate names with ", ". It does not perform an HTTP request.
   * @zh 原生提交忽略禁用、未命名及不参与提交的控件，同名值以 ", " 连接。
   * 本方法不发起 HTTP 请求。
   * @ja 無効・無名・送信対象外の入力は除外され、同名値は ", " で結合されます。
   * HTTP リクエストは行いません。
   * @ko 비활성·무명·제출 제외 컨트롤은 생략하며 같은 이름의 값은 ", "로 결합합니다.
   * HTTP 요청은 하지 않습니다.
   */
  submit(name = '', value = ''): void {
    native.submitForm(this.handle, name, value);
  }
}

elementConstructors.set('ElementForm', ElementForm);
