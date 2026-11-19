// Generated from RmlUi 6.3: generate-computed-values.cjs.
import { native } from '../internal/native';
import {
  computedHandle, type FontFaceHandle,
} from '../internal/computed';
import * as Style from '../style/values/style-values';
import {
  styleValueHandle, styleValueFromNative,
} from '../internal/style-values';
import { variantFromNative } from '../internal/animation-values';
import type { VariantByteColour } from '../values/types';
import type { CornerSizes } from '../rendering/render-box';
import type {
  AnimationList, TransitionList,
} from '../animation/animation-values';
import type { TransformSnapshot } from '../style/values/transform';
import type { ComputedValuesView } from './computed-values-view';

/** @internal */
export class ComputedFields implements ComputedValuesView {
  /**
   * The computed width.
   *
   * @zh 计算后的宽度。
   * @ja 計算済みの幅。
   * @ko 계산된 너비입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get width(): Style.LengthPercentageAuto {
    const value = native.computedGetWidth(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentageAuto;
  }

  /**
   * The computed width.
   *
   * @zh 计算后的宽度。
   * @ja 計算済みの幅。
   * @ko 계산된 너비입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set width(value: Style.LengthPercentageAuto) {
    native.computedSetWidth(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed height.
   *
   * @zh 计算后的高度。
   * @ja 計算済みの高さ。
   * @ko 계산된 높이입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get height(): Style.LengthPercentageAuto {
    const value = native.computedGetHeight(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentageAuto;
  }

  /**
   * The computed height.
   *
   * @zh 计算后的高度。
   * @ja 計算済みの高さ。
   * @ko 계산된 높이입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set height(value: Style.LengthPercentageAuto) {
    native.computedSetHeight(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed top outer spacing.
   *
   * @zh 计算后的上外边距。
   * @ja 計算済みの上外側の余白。
   * @ko 계산된 위 바깥 여백입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get marginTop(): Style.LengthPercentageAuto {
    const value = native.computedGetMarginTop(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentageAuto;
  }

  /**
   * The computed top outer spacing.
   *
   * @zh 计算后的上外边距。
   * @ja 計算済みの上外側の余白。
   * @ko 계산된 위 바깥 여백입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set marginTop(value: Style.LengthPercentageAuto) {
    native.computedSetMarginTop(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed right outer spacing.
   *
   * @zh 计算后的右外边距。
   * @ja 計算済みの右外側の余白。
   * @ko 계산된 오른쪽 바깥 여백입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get marginRight(): Style.LengthPercentageAuto {
    const value = native.computedGetMarginRight(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentageAuto;
  }

  /**
   * The computed right outer spacing.
   *
   * @zh 计算后的右外边距。
   * @ja 計算済みの右外側の余白。
   * @ko 계산된 오른쪽 바깥 여백입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set marginRight(value: Style.LengthPercentageAuto) {
    native.computedSetMarginRight(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed bottom outer spacing.
   *
   * @zh 计算后的下外边距。
   * @ja 計算済みの下外側の余白。
   * @ko 계산된 아래 바깥 여백입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get marginBottom(): Style.LengthPercentageAuto {
    const value = native.computedGetMarginBottom(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentageAuto;
  }

  /**
   * The computed bottom outer spacing.
   *
   * @zh 计算后的下外边距。
   * @ja 計算済みの下外側の余白。
   * @ko 계산된 아래 바깥 여백입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set marginBottom(value: Style.LengthPercentageAuto) {
    native.computedSetMarginBottom(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed left outer spacing.
   *
   * @zh 计算后的左外边距。
   * @ja 計算済みの左外側の余白。
   * @ko 계산된 왼쪽 바깥 여백입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get marginLeft(): Style.LengthPercentageAuto {
    const value = native.computedGetMarginLeft(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentageAuto;
  }

  /**
   * The computed left outer spacing.
   *
   * @zh 计算后的左外边距。
   * @ja 計算済みの左外側の余白。
   * @ko 계산된 왼쪽 바깥 여백입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set marginLeft(value: Style.LengthPercentageAuto) {
    native.computedSetMarginLeft(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed top inner spacing.
   *
   * @zh 计算后的上内边距。
   * @ja 計算済みの上内側の余白。
   * @ko 계산된 위 안쪽 여백입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get paddingTop(): Style.LengthPercentage {
    const value = native.computedGetPaddingTop(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentage;
  }

  /**
   * The computed top inner spacing.
   *
   * @zh 计算后的上内边距。
   * @ja 計算済みの上内側の余白。
   * @ko 계산된 위 안쪽 여백입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set paddingTop(value: Style.LengthPercentage) {
    native.computedSetPaddingTop(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed right inner spacing.
   *
   * @zh 计算后的右内边距。
   * @ja 計算済みの右内側の余白。
   * @ko 계산된 오른쪽 안쪽 여백입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get paddingRight(): Style.LengthPercentage {
    const value = native.computedGetPaddingRight(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentage;
  }

  /**
   * The computed right inner spacing.
   *
   * @zh 计算后的右内边距。
   * @ja 計算済みの右内側の余白。
   * @ko 계산된 오른쪽 안쪽 여백입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set paddingRight(value: Style.LengthPercentage) {
    native.computedSetPaddingRight(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed bottom inner spacing.
   *
   * @zh 计算后的下内边距。
   * @ja 計算済みの下内側の余白。
   * @ko 계산된 아래 안쪽 여백입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get paddingBottom(): Style.LengthPercentage {
    const value = native.computedGetPaddingBottom(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentage;
  }

  /**
   * The computed bottom inner spacing.
   *
   * @zh 计算后的下内边距。
   * @ja 計算済みの下内側の余白。
   * @ko 계산된 아래 안쪽 여백입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set paddingBottom(value: Style.LengthPercentage) {
    native.computedSetPaddingBottom(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed left inner spacing.
   *
   * @zh 计算后的左内边距。
   * @ja 計算済みの左内側の余白。
   * @ko 계산된 왼쪽 안쪽 여백입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get paddingLeft(): Style.LengthPercentage {
    const value = native.computedGetPaddingLeft(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentage;
  }

  /**
   * The computed left inner spacing.
   *
   * @zh 计算后的左内边距。
   * @ja 計算済みの左内側の余白。
   * @ko 계산된 왼쪽 안쪽 여백입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set paddingLeft(value: Style.LengthPercentage) {
    native.computedSetPaddingLeft(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed top position offset.
   *
   * @zh 计算后的上侧定位偏移。
   * @ja 計算済みの上側の配置オフセット。
   * @ko 계산된 위 배치 오프셋입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get top(): Style.LengthPercentageAuto {
    const value = native.computedGetTop(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentageAuto;
  }

  /**
   * The computed top position offset.
   *
   * @zh 计算后的上侧定位偏移。
   * @ja 計算済みの上側の配置オフセット。
   * @ko 계산된 위 배치 오프셋입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set top(value: Style.LengthPercentageAuto) {
    native.computedSetTop(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed right position offset.
   *
   * @zh 计算后的右侧定位偏移。
   * @ja 計算済みの右側の配置オフセット。
   * @ko 계산된 오른쪽 배치 오프셋입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get right(): Style.LengthPercentageAuto {
    const value = native.computedGetRight(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentageAuto;
  }

  /**
   * The computed right position offset.
   *
   * @zh 计算后的右侧定位偏移。
   * @ja 計算済みの右側の配置オフセット。
   * @ko 계산된 오른쪽 배치 오프셋입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set right(value: Style.LengthPercentageAuto) {
    native.computedSetRight(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed bottom position offset.
   *
   * @zh 计算后的下侧定位偏移。
   * @ja 計算済みの下側の配置オフセット。
   * @ko 계산된 아래 배치 오프셋입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get bottom(): Style.LengthPercentageAuto {
    const value = native.computedGetBottom(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentageAuto;
  }

  /**
   * The computed bottom position offset.
   *
   * @zh 计算后的下侧定位偏移。
   * @ja 計算済みの下側の配置オフセット。
   * @ko 계산된 아래 배치 오프셋입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set bottom(value: Style.LengthPercentageAuto) {
    native.computedSetBottom(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed left position offset.
   *
   * @zh 计算后的左侧定位偏移。
   * @ja 計算済みの左側の配置オフセット。
   * @ko 계산된 왼쪽 배치 오프셋입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get left(): Style.LengthPercentageAuto {
    const value = native.computedGetLeft(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentageAuto;
  }

  /**
   * The computed left position offset.
   *
   * @zh 计算后的左侧定位偏移。
   * @ja 計算済みの左側の配置オフセット。
   * @ko 계산된 왼쪽 배치 오프셋입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set left(value: Style.LengthPercentageAuto) {
    native.computedSetLeft(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed stacking order.
   *
   * @zh 计算后的堆叠顺序。
   * @ja 計算済みの重なり順。
   * @ko 계산된 쌓임 순서입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get zIndex(): Style.NumberAuto {
    const value = native.computedGetZIndex(computedHandle(this));
    return styleValueFromNative(value) as Style.NumberAuto;
  }

  /**
   * The computed stacking order.
   *
   * @zh 计算后的堆叠顺序。
   * @ja 計算済みの重なり順。
   * @ko 계산된 쌓임 순서입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set zIndex(value: Style.NumberAuto) {
    native.computedSetZIndex(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed top border width in pixels.
   *
   * @zh 计算后的上边框宽度（像素）。
   * @ja 計算済みの上境界線の幅（px）。
   * @ko 계산된 위 테두리 너비（px）입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get borderTopWidth(): number {
    return native.computedGetBorderTopWidth(computedHandle(this));
  }

  /**
   * The computed top border width in pixels.
   *
   * @zh 计算后的上边框宽度（像素）。
   * @ja 計算済みの上境界線の幅（px）。
   * @ko 계산된 위 테두리 너비（px）입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set borderTopWidth(value: number) {
    native.computedSetBorderTopWidth(
      computedHandle(this), value,
    );
  }

  /**
   * The computed right border width in pixels.
   *
   * @zh 计算后的右边框宽度（像素）。
   * @ja 計算済みの右境界線の幅（px）。
   * @ko 계산된 오른쪽 테두리 너비（px）입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get borderRightWidth(): number {
    return native.computedGetBorderRightWidth(computedHandle(this));
  }

  /**
   * The computed right border width in pixels.
   *
   * @zh 计算后的右边框宽度（像素）。
   * @ja 計算済みの右境界線の幅（px）。
   * @ko 계산된 오른쪽 테두리 너비（px）입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set borderRightWidth(value: number) {
    native.computedSetBorderRightWidth(
      computedHandle(this), value,
    );
  }

  /**
   * The computed bottom border width in pixels.
   *
   * @zh 计算后的下边框宽度（像素）。
   * @ja 計算済みの下境界線の幅（px）。
   * @ko 계산된 아래 테두리 너비（px）입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get borderBottomWidth(): number {
    return native.computedGetBorderBottomWidth(computedHandle(this));
  }

  /**
   * The computed bottom border width in pixels.
   *
   * @zh 计算后的下边框宽度（像素）。
   * @ja 計算済みの下境界線の幅（px）。
   * @ko 계산된 아래 테두리 너비（px）입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set borderBottomWidth(value: number) {
    native.computedSetBorderBottomWidth(
      computedHandle(this), value,
    );
  }

  /**
   * The computed left border width in pixels.
   *
   * @zh 计算后的左边框宽度（像素）。
   * @ja 計算済みの左境界線の幅（px）。
   * @ko 계산된 왼쪽 테두리 너비（px）입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get borderLeftWidth(): number {
    return native.computedGetBorderLeftWidth(computedHandle(this));
  }

  /**
   * The computed left border width in pixels.
   *
   * @zh 计算后的左边框宽度（像素）。
   * @ja 計算済みの左境界線の幅（px）。
   * @ko 계산된 왼쪽 테두리 너비（px）입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set borderLeftWidth(value: number) {
    native.computedSetBorderLeftWidth(
      computedHandle(this), value,
    );
  }

  /**
   * The computed size calculation box.
   *
   * @zh 计算后的尺寸计算盒。
   * @ja 計算済みのサイズ計算の基準ボックス。
   * @ko 계산된 크기 계산 기준 상자입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get boxSizing(): Style.BoxSizing {
    return native.computedGetBoxSizing(computedHandle(this));
  }

  /**
   * The computed size calculation box.
   *
   * @zh 计算后的尺寸计算盒。
   * @ja 計算済みのサイズ計算の基準ボックス。
   * @ko 계산된 크기 계산 기준 상자입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set boxSizing(value: Style.BoxSizing) {
    native.computedSetBoxSizing(
      computedHandle(this), value,
    );
  }

  /**
   * The computed layout box generation.
   *
   * @zh 计算后的布局盒生成方式。
   * @ja 計算済みのレイアウトボックスの生成方式。
   * @ko 계산된 레이아웃 상자 생성 방식입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get display(): Style.Display {
    return native.computedGetDisplay(computedHandle(this));
  }

  /**
   * The computed layout box generation.
   *
   * @zh 计算后的布局盒生成方式。
   * @ja 計算済みのレイアウトボックスの生成方式。
   * @ko 계산된 레이아웃 상자 생성 방식입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set display(value: Style.Display) {
    native.computedSetDisplay(
      computedHandle(this), value,
    );
  }

  /**
   * The computed positioning scheme.
   *
   * @zh 计算后的定位方式。
   * @ja 計算済みの配置方式。
   * @ko 계산된 배치 방식입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get position(): Style.Position {
    return native.computedGetPosition(computedHandle(this));
  }

  /**
   * The computed positioning scheme.
   *
   * @zh 计算后的定位方式。
   * @ja 計算済みの配置方式。
   * @ko 계산된 배치 방식입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set position(value: Style.Position) {
    native.computedSetPosition(
      computedHandle(this), value,
    );
  }

  /**
   * The computed float placement.
   *
   * @zh 计算后的浮动方向。
   * @ja 計算済みのフロート配置。
   * @ko 계산된 플로트 배치입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get float(): Style.Float {
    return native.computedGetFloat(computedHandle(this));
  }

  /**
   * The computed float placement.
   *
   * @zh 计算后的浮动方向。
   * @ja 計算済みのフロート配置。
   * @ko 계산된 플로트 배치입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set float(value: Style.Float) {
    native.computedSetFloat(
      computedHandle(this), value,
    );
  }

  /**
   * The computed float clearance.
   *
   * @zh 计算后的浮动避让。
   * @ja 計算済みのフロートの回り込み解除。
   * @ko 계산된 플로트 회피입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get clear(): Style.Clear {
    return native.computedGetClear(computedHandle(this));
  }

  /**
   * The computed float clearance.
   *
   * @zh 计算后的浮动避让。
   * @ja 計算済みのフロートの回り込み解除。
   * @ko 계산된 플로트 회피입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set clear(value: Style.Clear) {
    native.computedSetClear(
      computedHandle(this), value,
    );
  }

  /**
   * The computed horizontal overflow handling.
   *
   * @zh 计算后的水平溢出处理。
   * @ja 計算済みの水平はみ出しの処理。
   * @ko 계산된 수평 넘침 처리입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get overflowX(): Style.Overflow {
    return native.computedGetOverflowX(computedHandle(this));
  }

  /**
   * The computed horizontal overflow handling.
   *
   * @zh 计算后的水平溢出处理。
   * @ja 計算済みの水平はみ出しの処理。
   * @ko 계산된 수평 넘침 처리입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set overflowX(value: Style.Overflow) {
    native.computedSetOverflowX(
      computedHandle(this), value,
    );
  }

  /**
   * The computed vertical overflow handling.
   *
   * @zh 计算后的垂直溢出处理。
   * @ja 計算済みの垂直はみ出しの処理。
   * @ko 계산된 수직 넘침 처리입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get overflowY(): Style.Overflow {
    return native.computedGetOverflowY(computedHandle(this));
  }

  /**
   * The computed vertical overflow handling.
   *
   * @zh 计算后的垂直溢出处理。
   * @ja 計算済みの垂直はみ出しの処理。
   * @ko 계산된 수직 넘침 처리입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set overflowY(value: Style.Overflow) {
    native.computedSetOverflowY(
      computedHandle(this), value,
    );
  }

  /**
   * The computed visibility.
   *
   * @zh 计算后的可见性。
   * @ja 計算済みの表示状態。
   * @ko 계산된 표시 상태입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get visibility(): Style.Visibility {
    return native.computedGetVisibility(computedHandle(this));
  }

  /**
   * The computed visibility.
   *
   * @zh 计算后的可见性。
   * @ja 計算済みの表示状態。
   * @ko 계산된 표시 상태입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set visibility(value: Style.Visibility) {
    native.computedSetVisibility(
      computedHandle(this), value,
    );
  }

  /**
   * The computed background RGBA colour.
   *
   * @zh 计算后的背景 RGBA 颜色。
   * @ja 計算済みの背景の RGBA 色。
   * @ko 계산된 배경 RGBA 색상입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get backgroundColor(): VariantByteColour {
    return native.computedGetBackgroundColor(computedHandle(this));
  }

  /**
   * The computed background RGBA colour.
   *
   * @zh 计算后的背景 RGBA 颜色。
   * @ja 計算済みの背景の RGBA 色。
   * @ko 계산된 배경 RGBA 색상입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set backgroundColor(value: VariantByteColour) {
    native.computedSetBackgroundColor(
      computedHandle(this), value,
    );
  }

  /**
   * The computed top border RGBA colour.
   *
   * @zh 计算后的上边框 RGBA 颜色。
   * @ja 計算済みの上境界線の RGBA 色。
   * @ko 계산된 위 테두리 RGBA 색상입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get borderTopColor(): VariantByteColour {
    return native.computedGetBorderTopColor(computedHandle(this));
  }

  /**
   * The computed top border RGBA colour.
   *
   * @zh 计算后的上边框 RGBA 颜色。
   * @ja 計算済みの上境界線の RGBA 色。
   * @ko 계산된 위 테두리 RGBA 색상입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set borderTopColor(value: VariantByteColour) {
    native.computedSetBorderTopColor(
      computedHandle(this), value,
    );
  }

  /**
   * The computed right border RGBA colour.
   *
   * @zh 计算后的右边框 RGBA 颜色。
   * @ja 計算済みの右境界線の RGBA 色。
   * @ko 계산된 오른쪽 테두리 RGBA 색상입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get borderRightColor(): VariantByteColour {
    return native.computedGetBorderRightColor(computedHandle(this));
  }

  /**
   * The computed right border RGBA colour.
   *
   * @zh 计算后的右边框 RGBA 颜色。
   * @ja 計算済みの右境界線の RGBA 色。
   * @ko 계산된 오른쪽 테두리 RGBA 색상입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set borderRightColor(value: VariantByteColour) {
    native.computedSetBorderRightColor(
      computedHandle(this), value,
    );
  }

  /**
   * The computed bottom border RGBA colour.
   *
   * @zh 计算后的下边框 RGBA 颜色。
   * @ja 計算済みの下境界線の RGBA 色。
   * @ko 계산된 아래 테두리 RGBA 색상입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get borderBottomColor(): VariantByteColour {
    return native.computedGetBorderBottomColor(computedHandle(this));
  }

  /**
   * The computed bottom border RGBA colour.
   *
   * @zh 计算后的下边框 RGBA 颜色。
   * @ja 計算済みの下境界線の RGBA 色。
   * @ko 계산된 아래 테두리 RGBA 색상입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set borderBottomColor(value: VariantByteColour) {
    native.computedSetBorderBottomColor(
      computedHandle(this), value,
    );
  }

  /**
   * The computed left border RGBA colour.
   *
   * @zh 计算后的左边框 RGBA 颜色。
   * @ja 計算済みの左境界線の RGBA 色。
   * @ko 계산된 왼쪽 테두리 RGBA 색상입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get borderLeftColor(): VariantByteColour {
    return native.computedGetBorderLeftColor(computedHandle(this));
  }

  /**
   * The computed left border RGBA colour.
   *
   * @zh 计算后的左边框 RGBA 颜色。
   * @ja 計算済みの左境界線の RGBA 色。
   * @ko 계산된 왼쪽 테두리 RGBA 색상입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set borderLeftColor(value: VariantByteColour) {
    native.computedSetBorderLeftColor(
      computedHandle(this), value,
    );
  }

  /**
   * The computed whether decorator layers is present.
   *
   * @zh 计算后的是否存在装饰器图层。
   * @ja 計算済みのデコレーターのレイヤーの有無。
   * @ko 계산된 장식 레이어 존재 여부입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get hasDecorator(): boolean {
    return native.computedGetHasDecorator(computedHandle(this));
  }

  /**
   * The computed whether decorator layers is present.
   *
   * @zh 计算后的是否存在装饰器图层。
   * @ja 計算済みのデコレーターのレイヤーの有無。
   * @ko 계산된 장식 레이어 존재 여부입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set hasDecorator(value: boolean) {
    native.computedSetHasDecorator(
      computedHandle(this), value,
    );
  }

  /**
   * The computed font family selection.
   *
   * @zh 计算后的字体族选择。
   * @ja 計算済みのフォントファミリーの選択。
   * @ko 계산된 글꼴 모음 선택입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get fontFamily(): string {
    return native.computedGetFontFamily(computedHandle(this));
  }

  /**
   * The computed cursor name.
   *
   * @zh 计算后的鼠标光标名称。
   * @ja 計算済みのカーソル名。
   * @ko 계산된 커서 이름입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get cursor(): string {
    return native.computedGetCursor(computedHandle(this));
  }

  /**
   * The computed resolved font face handle.
   *
   * @zh 计算后的已解析字体句柄。
   * @ja 計算済みの解決済みフォントハンドル。
   * @ko 계산된 해결된 글꼴 핸들입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get fontFaceHandle(): FontFaceHandle | null {
    return native.computedGetFontFaceHandle(computedHandle(this));
  }

  /**
   * The computed resolved font face handle.
   *
   * @zh 计算后的已解析字体句柄。
   * @ja 計算済みの解決済みフォントハンドル。
   * @ko 계산된 해결된 글꼴 핸들입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set fontFaceHandle(value: FontFaceHandle | null) {
    native.computedSetFontFaceHandle(
      computedHandle(this), value,
    );
  }

  /**
   * The computed font size in pixels.
   *
   * @zh 计算后的像素字号。
   * @ja 計算済みのピクセル単位の文字サイズ。
   * @ko 계산된 픽셀 단위 글꼴 크기입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get fontSize(): number {
    return native.computedGetFontSize(computedHandle(this));
  }

  /**
   * The computed font size in pixels.
   *
   * @zh 计算后的像素字号。
   * @ja 計算済みのピクセル単位の文字サイズ。
   * @ko 계산된 픽셀 단위 글꼴 크기입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set fontSize(value: number) {
    native.computedSetFontSize(
      computedHandle(this), value,
    );
  }

  /**
   * The computed extra letter spacing in pixels.
   *
   * @zh 计算后的额外像素字距。
   * @ja 計算済みの追加の文字間隔（px）。
   * @ko 계산된 추가 문자 간격（px）입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get letterSpacing(): number {
    return native.computedGetLetterSpacing(computedHandle(this));
  }

  /**
   * The computed whether font effects is present.
   *
   * @zh 计算后的是否存在字体效果。
   * @ja 計算済みのフォント効果の有無。
   * @ko 계산된 글꼴 효과 존재 여부입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get hasFontEffect(): boolean {
    return native.computedGetHasFontEffect(computedHandle(this));
  }

  /**
   * The computed whether font effects is present.
   *
   * @zh 计算后的是否存在字体效果。
   * @ja 計算済みのフォント効果の有無。
   * @ko 계산된 글꼴 효과 존재 여부입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set hasFontEffect(value: boolean) {
    native.computedSetHasFontEffect(
      computedHandle(this), value,
    );
  }

  /**
   * The computed font slant.
   *
   * @zh 计算后的字体倾斜样式。
   * @ja 計算済みのフォントの傾斜。
   * @ko 계산된 글꼴 기울기입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get fontStyle(): Style.FontStyle {
    return native.computedGetFontStyle(computedHandle(this));
  }

  /**
   * The computed font slant.
   *
   * @zh 计算后的字体倾斜样式。
   * @ja 計算済みのフォントの傾斜。
   * @ko 계산된 글꼴 기울기입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set fontStyle(value: Style.FontStyle) {
    native.computedSetFontStyle(
      computedHandle(this), value,
    );
  }

  /**
   * The computed font weight.
   *
   * @zh 计算后的字重。
   * @ja 計算済みのフォントの太さ。
   * @ko 계산된 글꼴 굵기입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get fontWeight(): number {
    return native.computedGetFontWeight(computedHandle(this));
  }

  /**
   * The computed font weight.
   *
   * @zh 计算后的字重。
   * @ja 計算済みのフォントの太さ。
   * @ko 계산된 글꼴 굵기입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set fontWeight(value: number) {
    native.computedSetFontWeight(
      computedHandle(this), value,
    );
  }

  /**
   * The computed font kerning.
   *
   * @zh 计算后的字体字偶距。
   * @ja 計算済みのカーニング。
   * @ko 계산된 커닝입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get fontKerning(): Style.FontKerning {
    return native.computedGetFontKerning(computedHandle(this));
  }

  /**
   * The computed font kerning.
   *
   * @zh 计算后的字体字偶距。
   * @ja 計算済みのカーニング。
   * @ko 계산된 커닝입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set fontKerning(value: Style.FontKerning) {
    native.computedSetFontKerning(
      computedHandle(this), value,
    );
  }

  /**
   * The computed pointer hit testing.
   *
   * @zh 计算后的指针命中检测。
   * @ja 計算済みのポインターのヒット判定。
   * @ko 계산된 포인터 적중 검사입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get pointerEvents(): Style.PointerEvents {
    return native.computedGetPointerEvents(computedHandle(this));
  }

  /**
   * The computed pointer hit testing.
   *
   * @zh 计算后的指针命中检测。
   * @ja 計算済みのポインターのヒット判定。
   * @ko 계산된 포인터 적중 검사입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set pointerEvents(value: Style.PointerEvents) {
    native.computedSetPointerEvents(
      computedHandle(this), value,
    );
  }

  /**
   * The computed focus eligibility.
   *
   * @zh 计算后的焦点接收能力。
   * @ja 計算済みのフォーカスの可否。
   * @ko 계산된 포커스 허용 여부입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get focus(): Style.Focus {
    return native.computedGetFocus(computedHandle(this));
  }

  /**
   * The computed focus eligibility.
   *
   * @zh 计算后的焦点接收能力。
   * @ja 計算済みのフォーカスの可否。
   * @ko 계산된 포커스 허용 여부입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set focus(value: Style.Focus) {
    native.computedSetFocus(
      computedHandle(this), value,
    );
  }

  /**
   * The computed text horizontal alignment.
   *
   * @zh 计算后的文本水平对齐。
   * @ja 計算済みのテキストの水平配置。
   * @ko 계산된 텍스트 수평 정렬입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get textAlign(): Style.TextAlign {
    return native.computedGetTextAlign(computedHandle(this));
  }

  /**
   * The computed text horizontal alignment.
   *
   * @zh 计算后的文本水平对齐。
   * @ja 計算済みのテキストの水平配置。
   * @ko 계산된 텍스트 수평 정렬입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set textAlign(value: Style.TextAlign) {
    native.computedSetTextAlign(
      computedHandle(this), value,
    );
  }

  /**
   * The computed text decoration line.
   *
   * @zh 计算后的文本装饰线。
   * @ja 計算済みのテキストの装飾線。
   * @ko 계산된 텍스트 장식선입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get textDecoration(): Style.TextDecoration {
    return native.computedGetTextDecoration(computedHandle(this));
  }

  /**
   * The computed text decoration line.
   *
   * @zh 计算后的文本装饰线。
   * @ja 計算済みのテキストの装飾線。
   * @ko 계산된 텍스트 장식선입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set textDecoration(value: Style.TextDecoration) {
    native.computedSetTextDecoration(
      computedHandle(this), value,
    );
  }

  /**
   * The computed text case conversion.
   *
   * @zh 计算后的文本大小写转换。
   * @ja 計算済みの大文字・小文字の変換。
   * @ko 계산된 텍스트 대소문자 변환입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get textTransform(): Style.TextTransform {
    return native.computedGetTextTransform(computedHandle(this));
  }

  /**
   * The computed text case conversion.
   *
   * @zh 计算后的文本大小写转换。
   * @ja 計算済みの大文字・小文字の変換。
   * @ko 계산된 텍스트 대소문자 변환입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set textTransform(value: Style.TextTransform) {
    native.computedSetTextTransform(
      computedHandle(this), value,
    );
  }

  /**
   * The computed whitespace and wrapping.
   *
   * @zh 计算后的空白与换行处理。
   * @ja 計算済みの空白と折り返しの処理。
   * @ko 계산된 공백 및 줄바꿈 처리입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get whiteSpace(): Style.WhiteSpace {
    return native.computedGetWhiteSpace(computedHandle(this));
  }

  /**
   * The computed whitespace and wrapping.
   *
   * @zh 计算后的空白与换行处理。
   * @ja 計算済みの空白と折り返しの処理。
   * @ko 계산된 공백 및 줄바꿈 처리입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set whiteSpace(value: Style.WhiteSpace) {
    native.computedSetWhiteSpace(
      computedHandle(this), value,
    );
  }

  /**
   * The computed word breaking.
   *
   * @zh 计算后的单词断行。
   * @ja 計算済みの単語の改行規則。
   * @ko 계산된 단어 줄바꿈입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get wordBreak(): Style.WordBreak {
    return native.computedGetWordBreak(computedHandle(this));
  }

  /**
   * The computed word breaking.
   *
   * @zh 计算后的单词断行。
   * @ja 計算済みの単語の改行規則。
   * @ko 계산된 단어 줄바꿈입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set wordBreak(value: Style.WordBreak) {
    native.computedSetWordBreak(
      computedHandle(this), value,
    );
  }

  /**
   * The computed text RGBA colour.
   *
   * @zh 计算后的文本 RGBA 颜色。
   * @ja 計算済みの文字の RGBA 色。
   * @ko 계산된 텍스트 RGBA 색상입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get color(): VariantByteColour {
    return native.computedGetColor(computedHandle(this));
  }

  /**
   * The computed text RGBA colour.
   *
   * @zh 计算后的文本 RGBA 颜色。
   * @ja 計算済みの文字の RGBA 色。
   * @ko 계산된 텍스트 RGBA 색상입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set color(value: VariantByteColour) {
    native.computedSetColor(
      computedHandle(this), value,
    );
  }

  /**
   * The computed opacity multiplier.
   *
   * @zh 计算后的不透明度乘数。
   * @ja 計算済みの不透明度の乗数。
   * @ko 계산된 불투명도 배율입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get opacity(): number {
    return native.computedGetOpacity(computedHandle(this));
  }

  /**
   * The computed opacity multiplier.
   *
   * @zh 计算后的不透明度乘数。
   * @ja 計算済みの不透明度の乗数。
   * @ko 계산된 불투명도 배율입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set opacity(value: number) {
    native.computedSetOpacity(
      computedHandle(this), value,
    );
  }

  /**
   * The computed line height.
   *
   * @zh 计算后的行高。
   * @ja 計算済みの行の高さ。
   * @ko 계산된 줄 높이입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get lineHeight(): Style.LineHeight {
    const value = native.computedGetLineHeight(computedHandle(this));
    return styleValueFromNative(value) as Style.LineHeight;
  }

  /**
   * The computed line height.
   *
   * @zh 计算后的行高。
   * @ja 計算済みの行の高さ。
   * @ko 계산된 줄 높이입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set lineHeight(value: Style.LineHeight) {
    native.computedSetLineHeight(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed text language tag.
   *
   * @zh 计算后的文本语言标签。
   * @ja 計算済みのテキストの言語タグ。
   * @ko 계산된 텍스트 언어 태그입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get language(): string {
    return native.computedGetLanguage(computedHandle(this));
  }

  /**
   * The computed text language tag.
   *
   * @zh 计算后的文本语言标签。
   * @ja 計算済みのテキストの言語タグ。
   * @ko 계산된 텍스트 언어 태그입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set language(value: string) {
    native.computedSetLanguage(
      computedHandle(this), value,
    );
  }

  /**
   * The computed text reading direction.
   *
   * @zh 计算后的文本阅读方向。
   * @ja 計算済みのテキストの読み方向。
   * @ko 계산된 텍스트 읽기 방향입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get direction(): Style.Direction {
    return native.computedGetDirection(computedHandle(this));
  }

  /**
   * The computed text reading direction.
   *
   * @zh 计算后的文本阅读方向。
   * @ja 計算済みのテキストの読み方向。
   * @ko 계산된 텍스트 읽기 방향입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set direction(value: Style.Direction) {
    native.computedSetDirection(
      computedHandle(this), value,
    );
  }

  /**
   * The computed minimum width.
   *
   * @zh 计算后的最小宽度。
   * @ja 計算済みの最小幅。
   * @ko 계산된 최소 너비입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get minWidth(): Style.MinWidth {
    const value = native.computedGetMinWidth(computedHandle(this));
    return styleValueFromNative(value) as Style.MinWidth;
  }

  /**
   * The computed minimum width.
   *
   * @zh 计算后的最小宽度。
   * @ja 計算済みの最小幅。
   * @ko 계산된 최소 너비입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set minWidth(value: Style.MinWidth) {
    native.computedSetMinWidth(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed maximum width.
   *
   * @zh 计算后的最大宽度。
   * @ja 計算済みの最大幅。
   * @ko 계산된 최대 너비입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get maxWidth(): Style.MaxWidth {
    const value = native.computedGetMaxWidth(computedHandle(this));
    return styleValueFromNative(value) as Style.MaxWidth;
  }

  /**
   * The computed maximum width.
   *
   * @zh 计算后的最大宽度。
   * @ja 計算済みの最大幅。
   * @ko 계산된 최대 너비입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set maxWidth(value: Style.MaxWidth) {
    native.computedSetMaxWidth(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed minimum height.
   *
   * @zh 计算后的最小高度。
   * @ja 計算済みの最小高さ。
   * @ko 계산된 최소 높이입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get minHeight(): Style.MinHeight {
    const value = native.computedGetMinHeight(computedHandle(this));
    return styleValueFromNative(value) as Style.MinHeight;
  }

  /**
   * The computed minimum height.
   *
   * @zh 计算后的最小高度。
   * @ja 計算済みの最小高さ。
   * @ko 계산된 최소 높이입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set minHeight(value: Style.MinHeight) {
    native.computedSetMinHeight(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed maximum height.
   *
   * @zh 计算后的最大高度。
   * @ja 計算済みの最大高さ。
   * @ko 계산된 최대 높이입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get maxHeight(): Style.MaxHeight {
    const value = native.computedGetMaxHeight(computedHandle(this));
    return styleValueFromNative(value) as Style.MaxHeight;
  }

  /**
   * The computed maximum height.
   *
   * @zh 计算后的最大高度。
   * @ja 計算済みの最大高さ。
   * @ko 계산된 최대 높이입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set maxHeight(value: Style.MaxHeight) {
    native.computedSetMaxHeight(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed inline vertical alignment.
   *
   * @zh 计算后的行内垂直对齐。
   * @ja 計算済みのインラインの垂直配置。
   * @ko 계산된 인라인 수직 정렬입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get verticalAlign(): Style.VerticalAlign {
    const value = native.computedGetVerticalAlign(computedHandle(this));
    return styleValueFromNative(value) as Style.VerticalAlign;
  }

  /**
   * The computed inline vertical alignment.
   *
   * @zh 计算后的行内垂直对齐。
   * @ja 計算済みのインラインの垂直配置。
   * @ko 계산된 인라인 수직 정렬입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set verticalAlign(value: Style.VerticalAlign) {
    native.computedSetVerticalAlign(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed keyframe animation list.
   *
   * @zh 计算后的关键帧动画列表。
   * @ja 計算済みのキーフレームアニメーションの一覧。
   * @ko 계산된 키프레임 애니메이션 목록입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get animation(): AnimationList | null {
    const value = native.computedGetAnimation(computedHandle(this));
    return variantFromNative(value) as AnimationList | null;
  }

  /**
   * The computed property transition list.
   *
   * @zh 计算后的属性过渡列表。
   * @ja 計算済みのプロパティ遷移の一覧。
   * @ko 계산된 속성 전환 목록입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get transition(): TransitionList | null {
    const value = native.computedGetTransition(computedHandle(this));
    return variantFromNative(value) as TransitionList | null;
  }

  /**
   * The computed perspective distance in pixels.
   *
   * @zh 计算后的透视距离（像素）。
   * @ja 計算済みの遠近法の距離（px）。
   * @ko 계산된 원근 거리（px）입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get perspective(): number {
    return native.computedGetPerspective(computedHandle(this));
  }

  /**
   * The computed perspective distance in pixels.
   *
   * @zh 计算后的透视距离（像素）。
   * @ja 計算済みの遠近法の距離（px）。
   * @ko 계산된 원근 거리（px）입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set perspective(value: number) {
    native.computedSetPerspective(
      computedHandle(this), value,
    );
  }

  /**
   * The computed horizontal perspective origin.
   *
   * @zh 计算后的水平透视原点。
   * @ja 計算済みの水平遠近法の原点。
   * @ko 계산된 수평 원근 원점입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get perspectiveOriginX(): Style.PerspectiveOrigin {
    const value = native.computedGetPerspectiveOriginX(computedHandle(this));
    return styleValueFromNative(value) as Style.PerspectiveOrigin;
  }

  /**
   * The computed horizontal perspective origin.
   *
   * @zh 计算后的水平透视原点。
   * @ja 計算済みの水平遠近法の原点。
   * @ko 계산된 수평 원근 원점입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set perspectiveOriginX(value: Style.PerspectiveOrigin) {
    native.computedSetPerspectiveOriginX(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed vertical perspective origin.
   *
   * @zh 计算后的垂直透视原点。
   * @ja 計算済みの垂直遠近法の原点。
   * @ko 계산된 수직 원근 원점입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get perspectiveOriginY(): Style.PerspectiveOrigin {
    const value = native.computedGetPerspectiveOriginY(computedHandle(this));
    return styleValueFromNative(value) as Style.PerspectiveOrigin;
  }

  /**
   * The computed vertical perspective origin.
   *
   * @zh 计算后的垂直透视原点。
   * @ja 計算済みの垂直遠近法の原点。
   * @ko 계산된 수직 원근 원점입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set perspectiveOriginY(value: Style.PerspectiveOrigin) {
    native.computedSetPerspectiveOriginY(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed transform.
   *
   * @zh 计算后的变换。
   * @ja 計算済みの変換。
   * @ko 계산된 변환입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get transform(): TransformSnapshot | null {
    const value = native.computedGetTransform(computedHandle(this));
    return variantFromNative(value) as TransformSnapshot | null;
  }

  /**
   * The computed horizontal transform origin.
   *
   * @zh 计算后的水平变换原点。
   * @ja 計算済みの水平変換の原点。
   * @ko 계산된 수평 변환 원점입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get transformOriginX(): Style.TransformOrigin {
    const value = native.computedGetTransformOriginX(computedHandle(this));
    return styleValueFromNative(value) as Style.TransformOrigin;
  }

  /**
   * The computed horizontal transform origin.
   *
   * @zh 计算后的水平变换原点。
   * @ja 計算済みの水平変換の原点。
   * @ko 계산된 수평 변환 원점입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set transformOriginX(value: Style.TransformOrigin) {
    native.computedSetTransformOriginX(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed vertical transform origin.
   *
   * @zh 计算后的垂直变换原点。
   * @ja 計算済みの垂直変換の原点。
   * @ko 계산된 수직 변환 원점입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get transformOriginY(): Style.TransformOrigin {
    const value = native.computedGetTransformOriginY(computedHandle(this));
    return styleValueFromNative(value) as Style.TransformOrigin;
  }

  /**
   * The computed vertical transform origin.
   *
   * @zh 计算后的垂直变换原点。
   * @ja 計算済みの垂直変換の原点。
   * @ko 계산된 수직 변환 원점입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set transformOriginY(value: Style.TransformOrigin) {
    native.computedSetTransformOriginY(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed depth transform origin.
   *
   * @zh 计算后的深度变换原点。
   * @ja 計算済みの奥行き変換の原点。
   * @ko 계산된 깊이 변환 원점입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get transformOriginZ(): number {
    return native.computedGetTransformOriginZ(computedHandle(this));
  }

  /**
   * The computed depth transform origin.
   *
   * @zh 计算后的深度变换原点。
   * @ja 計算済みの奥行き変換の原点。
   * @ko 계산된 깊이 변환 원점입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set transformOriginZ(value: number) {
    native.computedSetTransformOriginZ(
      computedHandle(this), value,
    );
  }

  /**
   * The computed whether local transform is present.
   *
   * @zh 计算后的是否存在局部变换。
   * @ja 計算済みのローカル変換の有無。
   * @ko 계산된 로컬 변환 존재 여부입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get hasLocalTransform(): boolean {
    return native.computedGetHasLocalTransform(computedHandle(this));
  }

  /**
   * The computed whether local transform is present.
   *
   * @zh 计算后的是否存在局部变换。
   * @ja 計算済みのローカル変換の有無。
   * @ko 계산된 로컬 변환 존재 여부입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set hasLocalTransform(value: boolean) {
    native.computedSetHasLocalTransform(
      computedHandle(this), value,
    );
  }

  /**
   * The computed whether local perspective distance in pixels is present.
   *
   * @zh 计算后的是否存在局部透视距离（像素）。
   * @ja 計算済みのローカル遠近法の距離（px）の有無。
   * @ko 계산된 로컬 원근 거리（px） 존재 여부입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get hasLocalPerspective(): boolean {
    return native.computedGetHasLocalPerspective(computedHandle(this));
  }

  /**
   * The computed whether local perspective distance in pixels is present.
   *
   * @zh 计算后的是否存在局部透视距离（像素）。
   * @ja 計算済みのローカル遠近法の距離（px）の有無。
   * @ko 계산된 로컬 원근 거리（px） 존재 여부입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set hasLocalPerspective(value: boolean) {
    native.computedSetHasLocalPerspective(
      computedHandle(this), value,
    );
  }

  /**
   * The computed flex line alignment.
   *
   * @zh 计算后的弹性行对齐。
   * @ja 計算済みのフレックス行の配置。
   * @ko 계산된 플렉스 줄 정렬입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get alignContent(): Style.AlignContent {
    return native.computedGetAlignContent(computedHandle(this));
  }

  /**
   * The computed default flex item alignment.
   *
   * @zh 计算后的弹性项默认对齐。
   * @ja 計算済みのフレックス項目の既定配置。
   * @ko 계산된 플렉스 항목 기본 정렬입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get alignItems(): Style.AlignItems {
    return native.computedGetAlignItems(computedHandle(this));
  }

  /**
   * The computed individual flex item alignment.
   *
   * @zh 计算后的单个弹性项对齐。
   * @ja 計算済みの個別フレックス項目の配置。
   * @ko 계산된 개별 플렉스 항목 정렬입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get alignSelf(): Style.AlignSelf {
    return native.computedGetAlignSelf(computedHandle(this));
  }

  /**
   * The computed flex main axis direction.
   *
   * @zh 计算后的弹性主轴方向。
   * @ja 計算済みのフレックス主軸の方向。
   * @ko 계산된 플렉스 주축 방향입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get flexDirection(): Style.FlexDirection {
    return native.computedGetFlexDirection(computedHandle(this));
  }

  /**
   * The computed flex line wrapping.
   *
   * @zh 计算后的弹性换行方式。
   * @ja 計算済みのフレックスの折り返し。
   * @ko 계산된 플렉스 줄바꿈입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get flexWrap(): Style.FlexWrap {
    return native.computedGetFlexWrap(computedHandle(this));
  }

  /**
   * The computed flex main axis alignment.
   *
   * @zh 计算后的弹性主轴对齐。
   * @ja 計算済みのフレックス主軸の配置。
   * @ko 계산된 플렉스 주축 정렬입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get justifyContent(): Style.JustifyContent {
    return native.computedGetJustifyContent(computedHandle(this));
  }

  /**
   * The computed flex growth factor.
   *
   * @zh 计算后的弹性增长系数。
   * @ja 計算済みのフレックスの伸長係数。
   * @ko 계산된 플렉스 확장 계수입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get flexGrow(): number {
    return native.computedGetFlexGrow(computedHandle(this));
  }

  /**
   * The computed flex shrink factor.
   *
   * @zh 计算后的弹性收缩系数。
   * @ja 計算済みのフレックスの縮小係数。
   * @ko 계산된 플렉스 축소 계수입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get flexShrink(): number {
    return native.computedGetFlexShrink(computedHandle(this));
  }

  /**
   * The computed initial flex size.
   *
   * @zh 计算后的弹性项初始尺寸。
   * @ja 計算済みのフレックス項目の初期サイズ。
   * @ko 계산된 플렉스 항목 초기 크기입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get flexBasis(): Style.FlexBasis {
    const value = native.computedGetFlexBasis(computedHandle(this));
    return styleValueFromNative(value) as Style.FlexBasis;
  }

  /**
   * The computed initial flex size.
   *
   * @zh 计算后的弹性项初始尺寸。
   * @ja 計算済みのフレックス項目の初期サイズ。
   * @ko 계산된 플렉스 항목 초기 크기입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set flexBasis(value: Style.FlexBasis) {
    native.computedSetFlexBasis(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed top left corner radius in pixels.
   *
   * @zh 计算后的左上圆角半径（像素）。
   * @ja 計算済みの左上角の半径（px）。
   * @ko 계산된 위 왼쪽 모서리 반지름（px）입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get borderTopLeftRadius(): number {
    return native.computedGetBorderTopLeftRadius(computedHandle(this));
  }

  /**
   * The computed top left corner radius in pixels.
   *
   * @zh 计算后的左上圆角半径（像素）。
   * @ja 計算済みの左上角の半径（px）。
   * @ko 계산된 위 왼쪽 모서리 반지름（px）입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set borderTopLeftRadius(value: number) {
    native.computedSetBorderTopLeftRadius(
      computedHandle(this), value,
    );
  }

  /**
   * The computed top right corner radius in pixels.
   *
   * @zh 计算后的右上圆角半径（像素）。
   * @ja 計算済みの右上角の半径（px）。
   * @ko 계산된 위 오른쪽 모서리 반지름（px）입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get borderTopRightRadius(): number {
    return native.computedGetBorderTopRightRadius(computedHandle(this));
  }

  /**
   * The computed top right corner radius in pixels.
   *
   * @zh 计算后的右上圆角半径（像素）。
   * @ja 計算済みの右上角の半径（px）。
   * @ko 계산된 위 오른쪽 모서리 반지름（px）입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set borderTopRightRadius(value: number) {
    native.computedSetBorderTopRightRadius(
      computedHandle(this), value,
    );
  }

  /**
   * The computed bottom right corner radius in pixels.
   *
   * @zh 计算后的右下圆角半径（像素）。
   * @ja 計算済みの右下角の半径（px）。
   * @ko 계산된 아래 오른쪽 모서리 반지름（px）입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get borderBottomRightRadius(): number {
    return native.computedGetBorderBottomRightRadius(computedHandle(this));
  }

  /**
   * The computed bottom right corner radius in pixels.
   *
   * @zh 计算后的右下圆角半径（像素）。
   * @ja 計算済みの右下角の半径（px）。
   * @ko 계산된 아래 오른쪽 모서리 반지름（px）입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set borderBottomRightRadius(value: number) {
    native.computedSetBorderBottomRightRadius(
      computedHandle(this), value,
    );
  }

  /**
   * The computed bottom left corner radius in pixels.
   *
   * @zh 计算后的左下圆角半径（像素）。
   * @ja 計算済みの左下角の半径（px）。
   * @ko 계산된 아래 왼쪽 모서리 반지름（px）입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get borderBottomLeftRadius(): number {
    return native.computedGetBorderBottomLeftRadius(computedHandle(this));
  }

  /**
   * The computed bottom left corner radius in pixels.
   *
   * @zh 计算后的左下圆角半径（像素）。
   * @ja 計算済みの左下角の半径（px）。
   * @ko 계산된 아래 왼쪽 모서리 반지름（px）입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set borderBottomLeftRadius(value: number) {
    native.computedSetBorderBottomLeftRadius(
      computedHandle(this), value,
    );
  }

  /**
   * The computed corner radius in pixels.
   *
   * @zh 计算后的圆角半径（像素）。
   * @ja 計算済みの角の半径（px）。
   * @ko 계산된 모서리 반지름（px）입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get borderRadius(): CornerSizes {
    return native.computedGetBorderRadius(computedHandle(this));
  }

  /**
   * The computed text overflow marker.
   *
   * @zh 计算后的文本溢出标记。
   * @ja 計算済みのテキストの省略表示。
   * @ko 계산된 텍스트 넘침 표시입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get textOverflow(): Style.TextOverflow {
    return native.computedGetTextOverflow(computedHandle(this));
  }

  /**
   * The computed text overflow marker.
   *
   * @zh 计算后的文本溢出标记。
   * @ja 計算済みのテキストの省略表示。
   * @ko 계산된 텍스트 넘침 표시입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set textOverflow(value: Style.TextOverflow) {
    native.computedSetTextOverflow(
      computedHandle(this), value,
    );
  }

  /**
   * The computed custom text overflow string.
   *
   * @zh 计算后的自定义文本溢出字符串。
   * @ja 計算済みの独自の省略文字列。
   * @ko 계산된 사용자 정의 생략 문자열입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get textOverflowString(): string {
    return native.computedGetTextOverflowString(computedHandle(this));
  }

  /**
   * The computed ancestor clipping control.
   *
   * @zh 计算后的祖先裁剪控制。
   * @ja 計算済みの祖先によるクリッピング制御。
   * @ko 계산된 조상 클리핑 제어입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get clip(): Style.Clip {
    const value = native.computedGetClip(computedHandle(this));
    return styleValueFromNative(value) as Style.Clip;
  }

  /**
   * The computed ancestor clipping control.
   *
   * @zh 计算后的祖先裁剪控制。
   * @ja 計算済みの祖先によるクリッピング制御。
   * @ko 계산된 조상 클리핑 제어입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set clip(value: Style.Clip) {
    native.computedSetClip(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed drag interaction.
   *
   * @zh 计算后的拖动交互。
   * @ja 計算済みのドラッグ操作。
   * @ko 계산된 드래그 동작입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get drag(): Style.Drag {
    return native.computedGetDrag(computedHandle(this));
  }

  /**
   * The computed drag interaction.
   *
   * @zh 计算后的拖动交互。
   * @ja 計算済みのドラッグ操作。
   * @ko 계산된 드래그 동작입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set drag(value: Style.Drag) {
    native.computedSetDrag(
      computedHandle(this), value,
    );
  }

  /**
   * The computed sequential keyboard focus.
   *
   * @zh 计算后的键盘顺序焦点。
   * @ja 計算済みのキーボードの順次フォーカス。
   * @ko 계산된 키보드 순차 포커스입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get tabIndex(): Style.TabIndex {
    return native.computedGetTabIndex(computedHandle(this));
  }

  /**
   * The computed sequential keyboard focus.
   *
   * @zh 计算后的键盘顺序焦点。
   * @ja 計算済みのキーボードの順次フォーカス。
   * @ko 계산된 키보드 순차 포커스입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set tabIndex(value: Style.TabIndex) {
    native.computedSetTabIndex(
      computedHandle(this), value,
    );
  }

  /**
   * The computed image RGBA tint.
   *
   * @zh 计算后的图像 RGBA 染色。
   * @ja 計算済みの画像の RGBA 色乗算。
   * @ko 계산된 이미지 RGBA 색상 곱셈입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get imageColor(): VariantByteColour {
    return native.computedGetImageColor(computedHandle(this));
  }

  /**
   * The computed image RGBA tint.
   *
   * @zh 计算后的图像 RGBA 染色。
   * @ja 計算済みの画像の RGBA 色乗算。
   * @ko 계산된 이미지 RGBA 색상 곱셈입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set imageColor(value: VariantByteColour) {
    native.computedSetImageColor(
      computedHandle(this), value,
    );
  }

  /**
   * The computed gap between rows.
   *
   * @zh 计算后的行间距。
   * @ja 計算済みの行間の間隔。
   * @ko 계산된 행 간격입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get rowGap(): Style.LengthPercentage {
    const value = native.computedGetRowGap(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentage;
  }

  /**
   * The computed gap between rows.
   *
   * @zh 计算后的行间距。
   * @ja 計算済みの行間の間隔。
   * @ko 계산된 행 간격입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set rowGap(value: Style.LengthPercentage) {
    native.computedSetRowGap(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed gap between columns.
   *
   * @zh 计算后的列间距。
   * @ja 計算済みの列間の間隔。
   * @ko 계산된 열 간격입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get columnGap(): Style.LengthPercentage {
    const value = native.computedGetColumnGap(computedHandle(this));
    return styleValueFromNative(value) as Style.LengthPercentage;
  }

  /**
   * The computed gap between columns.
   *
   * @zh 计算后的列间距。
   * @ja 計算済みの列間の間隔。
   * @ko 계산된 열 간격입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set columnGap(value: Style.LengthPercentage) {
    native.computedSetColumnGap(
      computedHandle(this), styleValueHandle(value),
    );
  }

  /**
   * The computed scroll chaining.
   *
   * @zh 计算后的滚动链传递。
   * @ja 計算済みのスクロールの連鎖。
   * @ko 계산된 스크롤 연쇄입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get overscrollBehavior(): Style.OverscrollBehavior {
    return native.computedGetOverscrollBehavior(computedHandle(this));
  }

  /**
   * The computed scroll chaining.
   *
   * @zh 计算后的滚动链传递。
   * @ja 計算済みのスクロールの連鎖。
   * @ko 계산된 스크롤 연쇄입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set overscrollBehavior(value: Style.OverscrollBehavior) {
    native.computedSetOverscrollBehavior(
      computedHandle(this), value,
    );
  }

  /**
   * The computed scrollbar margin in pixels.
   *
   * @zh 计算后的滚动条像素边距。
   * @ja 計算済みのスクロールバーの余白（px）。
   * @ko 계산된 스크롤바 여백（px）입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get scrollbarMargin(): number {
    return native.computedGetScrollbarMargin(computedHandle(this));
  }

  /**
   * The computed scrollbar margin in pixels.
   *
   * @zh 计算后的滚动条像素边距。
   * @ja 計算済みのスクロールバーの余白（px）。
   * @ko 계산된 스크롤바 여백（px）입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set scrollbarMargin(value: number) {
    native.computedSetScrollbarMargin(
      computedHandle(this), value,
    );
  }

  /**
   * The computed whether mask image layers is present.
   *
   * @zh 计算后的是否存在遮罩图层。
   * @ja 計算済みのマスク画像のレイヤーの有無。
   * @ko 계산된 마스크 이미지 레이어 존재 여부입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get hasMaskImage(): boolean {
    return native.computedGetHasMaskImage(computedHandle(this));
  }

  /**
   * The computed whether mask image layers is present.
   *
   * @zh 计算后的是否存在遮罩图层。
   * @ja 計算済みのマスク画像のレイヤーの有無。
   * @ko 계산된 마스크 이미지 레이어 존재 여부입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set hasMaskImage(value: boolean) {
    native.computedSetHasMaskImage(
      computedHandle(this), value,
    );
  }

  /**
   * The computed whether element filter list is present.
   *
   * @zh 计算后的是否存在元素滤镜列表。
   * @ja 計算済みの要素のフィルター一覧の有無。
   * @ko 계산된 요소 필터 목록 존재 여부입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get hasFilter(): boolean {
    return native.computedGetHasFilter(computedHandle(this));
  }

  /**
   * The computed whether element filter list is present.
   *
   * @zh 计算后的是否存在元素滤镜列表。
   * @ja 計算済みの要素のフィルター一覧の有無。
   * @ko 계산된 요소 필터 목록 존재 여부입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set hasFilter(value: boolean) {
    native.computedSetHasFilter(
      computedHandle(this), value,
    );
  }

  /**
   * The computed whether backdrop filter list is present.
   *
   * @zh 计算后的是否存在背景滤镜列表。
   * @ja 計算済みの背景のフィルター一覧の有無。
   * @ko 계산된 배경 필터 목록 존재 여부입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get hasBackdropFilter(): boolean {
    return native.computedGetHasBackdropFilter(computedHandle(this));
  }

  /**
   * The computed whether backdrop filter list is present.
   *
   * @zh 计算后的是否存在背景滤镜列表。
   * @ja 計算済みの背景のフィルター一覧の有無。
   * @ko 계산된 배경 필터 목록 존재 여부입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set hasBackdropFilter(value: boolean) {
    native.computedSetHasBackdropFilter(
      computedHandle(this), value,
    );
  }

  /**
   * The computed whether box shadows is present.
   *
   * @zh 计算后的是否存在盒阴影。
   * @ja 計算済みのボックスの影の有無。
   * @ko 계산된 상자 그림자 존재 여부입니다.
   * @returns Current native value; structured values are independent copies.
   * @zh 返回当前原生值；结构化值为独立副本。
   * @ja 現在のネイティブ値。構造化値は独立したコピーです。
   * @ko 현재 네이티브 값이며 구조화된 값은 독립 복사본입니다.
   */
  get hasBoxShadow(): boolean {
    return native.computedGetHasBoxShadow(computedHandle(this));
  }

  /**
   * The computed whether box shadows is present.
   *
   * @zh 计算后的是否存在盒阴影。
   * @ja 計算済みのボックスの影の有無。
   * @ko 계산된 상자 그림자 존재 여부입니다.
   * @param value - Assignment to an owned value; element views reject writes.
   * @zh value - 写入独立对象；元素只读视图拒绝写入。
   * @ja value - 所有値への代入。要素の読み取り専用ビューは拒否します。
   * @ko value - 소유 값에 대입하며 요소의 읽기 전용 뷰는 거부합니다.
   */
  set hasBoxShadow(value: boolean) {
    native.computedSetHasBoxShadow(
      computedHandle(this), value,
    );
  }

}
