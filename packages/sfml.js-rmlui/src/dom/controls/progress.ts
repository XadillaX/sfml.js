import { Element } from '../elements/element';
import { native } from '../../internal/native';
import { elementConstructors } from '../../internal/element-factory';

/**
 * Checked wrapper for Rml::ElementProgress.
 *
 * @zh 带类型检查的 Rml::ElementProgress 包装器。
 * @ja 検証付き Rml::ElementProgress ラッパー。
 * @ko 검증된 Rml::ElementProgress 래퍼입니다.
 */
export class ElementProgress extends Element {
  /**
   * Read Rml::ElementProgress::GetValue, clamped to [0, getMax()].
   *
   * @zh 读取 Rml::ElementProgress::GetValue，结果钳制到 [0, getMax()]。
   * @ja Rml::ElementProgress::GetValue を [0, getMax()] に制限して取得します。
   * @ko [0, getMax()] 범위의 Rml::ElementProgress::GetValue를 읽습니다.
   * @returns Effective progress value; default zero.
   * @zh 有效进度值，默认为零。
   * @ja 有効な進捗値。既定値ゼロ。
   * @ko 유효 진행 값이며 기본값은 0입니다.
   */
  getValue(): number {
    return native.getProgressValue(this.handle);
  }

  /**
   * Store a value through Rml::ElementProgress::SetValue.
   *
   * @zh 通过 Rml::ElementProgress::SetValue 保存进度值。
   * @ja Rml::ElementProgress::SetValue で値を保存します。
   * @ko Rml::ElementProgress::SetValue로 값을 저장합니다.
   * @param value - Finite float; native GetValue clamps when reading.
   * @zh value - 有限浮点数，原生 GetValue 在读取时钳制。
   * @ja value - 有限浮動小数点数。GetValue の読み取り時に制限されます。
   * @ko value - 유한 실수이며 네이티브 GetValue가 읽을 때 범위를 제한합니다.
   */
  setValue(value: number): void {
    native.setProgressValue(this.handle, value);
  }

  /**
   * Read the effective maximum through Rml::ElementProgress::GetMax.
   *
   * @zh 通过 Rml::ElementProgress::GetMax 读取有效最大值。
   * @ja Rml::ElementProgress::GetMax で有効な最大値を取得します。
   * @ko Rml::ElementProgress::GetMax로 유효 최댓값을 읽습니다.
   * @returns Maximum; defaults to 1, also used for nonpositive stored values.
   * @zh 最大值，默认为 1，保存的值非正时也返回 1。
   * @ja 最大値。既定値は 1。保存値が正でない場合も 1。
   * @ko 최댓값이며 기본값은 1이고 저장 값이 양수가 아니어도 1을 반환합니다.
   */
  getMax(): number {
    return native.getProgressMax(this.handle);
  }

  /**
   * Store the maximum through Rml::ElementProgress::SetMax.
   *
   * @zh 通过 Rml::ElementProgress::SetMax 保存最大值。
   * @ja Rml::ElementProgress::SetMax で最大値を保存します。
   * @ko Rml::ElementProgress::SetMax로 최댓값을 저장합니다.
   * @param maxValue - Finite float; values at or below zero mean maximum 1.
   * @zh maxValue - 有限浮点数，非正值的有效最大值为 1。
   * @ja maxValue - 有限浮動小数点数。正でなければ有効最大値は 1。
   * @ko maxValue - 유한 실수이며 양수가 아니면 유효 최댓값은 1입니다.
   */
  setMax(maxValue: number): void {
    native.setProgressMax(this.handle, maxValue);
  }
}

elementConstructors.set('ElementProgress', ElementProgress);
