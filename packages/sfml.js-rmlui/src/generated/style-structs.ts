// Generated from RmlUi 6.3: generate-computed-values.cjs.
import { native } from '../internal/native';
import {
  styleStructs, structMapping, checkedStructInteger,
  structColour, checkedStructColour,
} from '../internal/style-structs';
import {
  checkedStyleFloat, styleValueHandle, styleValueFromNative,
} from '../internal/style-values';
import type { FontFaceHandle } from '../internal/computed';
import type { VariantByteColour } from '../values/types';
import type { Clip } from '../style/values/style-values';
import type * as Enums from './style-enums';

/**
 * Owned storage for common layout and border properties.
 *
 * @zh 常用布局和边框属性的独立存储。
 * @ja 基本的なレイアウトと境界線プロパティの所有ストレージ。
 * @ko 일반 레이아웃 및 테두리 속성의 소유 저장소입니다.
 * @remarks Uses upstream defaults independently of DOM and runtime.
 * Numeric views retain this struct only; colour getters return copies.
 * Non-null font handles require the active runtime generation.
 * @zh 使用上游默认值，独立于 DOM 和运行时。数值视图仅保活此结构，
 * 颜色 getter 返回副本；非空字体句柄要求当前运行时世代有效。
 * @ja DOM とランタイムから独立した既定値。数値ビューは構造体のみ保持し、
 * 色の取得はコピーです。非 null のフォントは有効なランタイム世代が必要です。
 * @ko DOM 및 런타임과 독립된 기본값입니다. 숫자 뷰는 구조체만 유지하고
 * 색은 복사됩니다. null이 아닌 글꼴은 유효한 런타임 세대가 필요합니다.
 */
export class CommonValues {
  /**
   * Create independent storage initialized to the RmlUi defaults.
   *
   * @zh 按 RmlUi 默认值创建独立存储。
   * @ja RmlUi の既定値で初期化した独立ストレージを作ります。
   * @ko RmlUi 기본값으로 초기화한 독립 저장소를 만듭니다.
   */
  constructor() {
    styleStructs.set(this, native.createCommonValues());
  }

  /**
   * The computed layout box generation.
   *
   * @zh 计算后的布局盒生成方式。
   * @ja 計算済みのレイアウトボックスの生成方式。
   * @ko 계산된 레이아웃 상자 생성 방식입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get display(): Enums.Display {
    const value = native.commonValuesGetDisplay(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed layout box generation.
   *
   * @zh 计算后的布局盒生成方式。
   * @ja 計算済みのレイアウトボックスの生成方式。
   * @ko 계산된 레이아웃 상자 생성 방식입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set display(value: Enums.Display) {
    native.commonValuesSetDisplay(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed positioning scheme.
   *
   * @zh 计算后的定位方式。
   * @ja 計算済みの配置方式。
   * @ko 계산된 배치 방식입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get position(): Enums.Position {
    const value = native.commonValuesGetPosition(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed positioning scheme.
   *
   * @zh 计算后的定位方式。
   * @ja 計算済みの配置方式。
   * @ko 계산된 배치 방식입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set position(value: Enums.Position) {
    native.commonValuesSetPosition(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed float placement.
   *
   * @zh 计算后的浮动方向。
   * @ja 計算済みのフロート配置。
   * @ko 계산된 플로트 배치입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get float(): Enums.Float {
    const value = native.commonValuesGetFloat(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed float placement.
   *
   * @zh 计算后的浮动方向。
   * @ja 計算済みのフロート配置。
   * @ko 계산된 플로트 배치입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set float(value: Enums.Float) {
    native.commonValuesSetFloat(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed float clearance.
   *
   * @zh 计算后的浮动避让。
   * @ja 計算済みのフロートの回り込み解除。
   * @ko 계산된 플로트 회피입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get clear(): Enums.Clear {
    const value = native.commonValuesGetClear(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed float clearance.
   *
   * @zh 计算后的浮动避让。
   * @ja 計算済みのフロートの回り込み解除。
   * @ko 계산된 플로트 회피입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set clear(value: Enums.Clear) {
    native.commonValuesSetClear(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed horizontal overflow handling.
   *
   * @zh 计算后的水平溢出处理。
   * @ja 計算済みの水平はみ出しの処理。
   * @ko 계산된 수평 넘침 처리입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get overflowX(): Enums.Overflow {
    const value = native.commonValuesGetOverflowX(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed horizontal overflow handling.
   *
   * @zh 计算后的水平溢出处理。
   * @ja 計算済みの水平はみ出しの処理。
   * @ko 계산된 수평 넘침 처리입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set overflowX(value: Enums.Overflow) {
    native.commonValuesSetOverflowX(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed vertical overflow handling.
   *
   * @zh 计算后的垂直溢出处理。
   * @ja 計算済みの垂直はみ出しの処理。
   * @ko 계산된 수직 넘침 처리입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get overflowY(): Enums.Overflow {
    const value = native.commonValuesGetOverflowY(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed vertical overflow handling.
   *
   * @zh 计算后的垂直溢出处理。
   * @ja 計算済みの垂直はみ出しの処理。
   * @ko 계산된 수직 넘침 처리입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set overflowY(value: Enums.Overflow) {
    native.commonValuesSetOverflowY(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed visibility.
   *
   * @zh 计算后的可见性。
   * @ja 計算済みの表示状態。
   * @ko 계산된 표시 상태입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get visibility(): Enums.Visibility {
    const value = native.commonValuesGetVisibility(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed visibility.
   *
   * @zh 计算后的可见性。
   * @ja 計算済みの表示状態。
   * @ko 계산된 표시 상태입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set visibility(value: Enums.Visibility) {
    native.commonValuesSetVisibility(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed whether decorator layers is present.
   *
   * @zh 计算后的是否存在装饰器图层。
   * @ja 計算済みのデコレーターのレイヤーの有無。
   * @ko 계산된 장식 레이어 존재 여부입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get hasDecorator(): boolean {
    const value = native.commonValuesGetHasDecorator(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed whether decorator layers is present.
   *
   * @zh 计算后的是否存在装饰器图层。
   * @ja 計算済みのデコレーターのレイヤーの有無。
   * @ko 계산된 장식 레이어 존재 여부입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set hasDecorator(value: boolean) {
    native.commonValuesSetHasDecorator(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed size calculation box.
   *
   * @zh 计算后的尺寸计算盒。
   * @ja 計算済みのサイズ計算の基準ボックス。
   * @ko 계산된 크기 계산 기준 상자입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get boxSizing(): Enums.BoxSizing {
    const value = native.commonValuesGetBoxSizing(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed size calculation box.
   *
   * @zh 计算后的尺寸计算盒。
   * @ja 計算済みのサイズ計算の基準ボックス。
   * @ko 계산된 크기 계산 기준 상자입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set boxSizing(value: Enums.BoxSizing) {
    native.commonValuesSetBoxSizing(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed width unit or keyword.
   *
   * @zh 计算后的宽度的单位或关键字。
   * @ja 計算済みの幅の単位またはキーワード。
   * @ko 계산된 너비의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get widthType(): Enums.LengthPercentageAutoType {
    const value = native.commonValuesGetWidthType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed width unit or keyword.
   *
   * @zh 计算后的宽度的单位或关键字。
   * @ja 計算済みの幅の単位またはキーワード。
   * @ko 계산된 너비의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set widthType(value: Enums.LengthPercentageAutoType) {
    native.commonValuesSetWidthType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed height unit or keyword.
   *
   * @zh 计算后的高度的单位或关键字。
   * @ja 計算済みの高さの単位またはキーワード。
   * @ko 계산된 높이의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get heightType(): Enums.LengthPercentageAutoType {
    const value = native.commonValuesGetHeightType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed height unit or keyword.
   *
   * @zh 计算后的高度的单位或关键字。
   * @ja 計算済みの高さの単位またはキーワード。
   * @ko 계산된 높이의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set heightType(value: Enums.LengthPercentageAutoType) {
    native.commonValuesSetHeightType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed top outer spacing unit or keyword.
   *
   * @zh 计算后的上外边距的单位或关键字。
   * @ja 計算済みの上外側の余白の単位またはキーワード。
   * @ko 계산된 위 바깥 여백의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get marginTopType(): Enums.LengthPercentageAutoType {
    const value = native.commonValuesGetMarginTopType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed top outer spacing unit or keyword.
   *
   * @zh 计算后的上外边距的单位或关键字。
   * @ja 計算済みの上外側の余白の単位またはキーワード。
   * @ko 계산된 위 바깥 여백의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set marginTopType(value: Enums.LengthPercentageAutoType) {
    native.commonValuesSetMarginTopType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed right outer spacing unit or keyword.
   *
   * @zh 计算后的右外边距的单位或关键字。
   * @ja 計算済みの右外側の余白の単位またはキーワード。
   * @ko 계산된 오른쪽 바깥 여백의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get marginRightType(): Enums.LengthPercentageAutoType {
    const value = native.commonValuesGetMarginRightType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed right outer spacing unit or keyword.
   *
   * @zh 计算后的右外边距的单位或关键字。
   * @ja 計算済みの右外側の余白の単位またはキーワード。
   * @ko 계산된 오른쪽 바깥 여백의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set marginRightType(value: Enums.LengthPercentageAutoType) {
    native.commonValuesSetMarginRightType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed bottom outer spacing unit or keyword.
   *
   * @zh 计算后的下外边距的单位或关键字。
   * @ja 計算済みの下外側の余白の単位またはキーワード。
   * @ko 계산된 아래 바깥 여백의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get marginBottomType(): Enums.LengthPercentageAutoType {
    const value = native.commonValuesGetMarginBottomType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed bottom outer spacing unit or keyword.
   *
   * @zh 计算后的下外边距的单位或关键字。
   * @ja 計算済みの下外側の余白の単位またはキーワード。
   * @ko 계산된 아래 바깥 여백의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set marginBottomType(value: Enums.LengthPercentageAutoType) {
    native.commonValuesSetMarginBottomType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed left outer spacing unit or keyword.
   *
   * @zh 计算后的左外边距的单位或关键字。
   * @ja 計算済みの左外側の余白の単位またはキーワード。
   * @ko 계산된 왼쪽 바깥 여백의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get marginLeftType(): Enums.LengthPercentageAutoType {
    const value = native.commonValuesGetMarginLeftType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed left outer spacing unit or keyword.
   *
   * @zh 计算后的左外边距的单位或关键字。
   * @ja 計算済みの左外側の余白の単位またはキーワード。
   * @ko 계산된 왼쪽 바깥 여백의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set marginLeftType(value: Enums.LengthPercentageAutoType) {
    native.commonValuesSetMarginLeftType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed top inner spacing unit or keyword.
   *
   * @zh 计算后的上内边距的单位或关键字。
   * @ja 計算済みの上内側の余白の単位またはキーワード。
   * @ko 계산된 위 안쪽 여백의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get paddingTopType(): Enums.LengthPercentageType {
    const value = native.commonValuesGetPaddingTopType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed top inner spacing unit or keyword.
   *
   * @zh 计算后的上内边距的单位或关键字。
   * @ja 計算済みの上内側の余白の単位またはキーワード。
   * @ko 계산된 위 안쪽 여백의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set paddingTopType(value: Enums.LengthPercentageType) {
    native.commonValuesSetPaddingTopType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed right inner spacing unit or keyword.
   *
   * @zh 计算后的右内边距的单位或关键字。
   * @ja 計算済みの右内側の余白の単位またはキーワード。
   * @ko 계산된 오른쪽 안쪽 여백의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get paddingRightType(): Enums.LengthPercentageType {
    const value = native.commonValuesGetPaddingRightType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed right inner spacing unit or keyword.
   *
   * @zh 计算后的右内边距的单位或关键字。
   * @ja 計算済みの右内側の余白の単位またはキーワード。
   * @ko 계산된 오른쪽 안쪽 여백의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set paddingRightType(value: Enums.LengthPercentageType) {
    native.commonValuesSetPaddingRightType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed bottom inner spacing unit or keyword.
   *
   * @zh 计算后的下内边距的单位或关键字。
   * @ja 計算済みの下内側の余白の単位またはキーワード。
   * @ko 계산된 아래 안쪽 여백의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get paddingBottomType(): Enums.LengthPercentageType {
    const value = native.commonValuesGetPaddingBottomType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed bottom inner spacing unit or keyword.
   *
   * @zh 计算后的下内边距的单位或关键字。
   * @ja 計算済みの下内側の余白の単位またはキーワード。
   * @ko 계산된 아래 안쪽 여백의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set paddingBottomType(value: Enums.LengthPercentageType) {
    native.commonValuesSetPaddingBottomType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed left inner spacing unit or keyword.
   *
   * @zh 计算后的左内边距的单位或关键字。
   * @ja 計算済みの左内側の余白の単位またはキーワード。
   * @ko 계산된 왼쪽 안쪽 여백의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get paddingLeftType(): Enums.LengthPercentageType {
    const value = native.commonValuesGetPaddingLeftType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed left inner spacing unit or keyword.
   *
   * @zh 计算后的左内边距的单位或关键字。
   * @ja 計算済みの左内側の余白の単位またはキーワード。
   * @ko 계산된 왼쪽 안쪽 여백의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set paddingLeftType(value: Enums.LengthPercentageType) {
    native.commonValuesSetPaddingLeftType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed top position offset unit or keyword.
   *
   * @zh 计算后的上侧定位偏移的单位或关键字。
   * @ja 計算済みの上側の配置オフセットの単位またはキーワード。
   * @ko 계산된 위 배치 오프셋의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get topType(): Enums.LengthPercentageAutoType {
    const value = native.commonValuesGetTopType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed top position offset unit or keyword.
   *
   * @zh 计算后的上侧定位偏移的单位或关键字。
   * @ja 計算済みの上側の配置オフセットの単位またはキーワード。
   * @ko 계산된 위 배치 오프셋의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set topType(value: Enums.LengthPercentageAutoType) {
    native.commonValuesSetTopType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed right position offset unit or keyword.
   *
   * @zh 计算后的右侧定位偏移的单位或关键字。
   * @ja 計算済みの右側の配置オフセットの単位またはキーワード。
   * @ko 계산된 오른쪽 배치 오프셋의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get rightType(): Enums.LengthPercentageAutoType {
    const value = native.commonValuesGetRightType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed right position offset unit or keyword.
   *
   * @zh 计算后的右侧定位偏移的单位或关键字。
   * @ja 計算済みの右側の配置オフセットの単位またはキーワード。
   * @ko 계산된 오른쪽 배치 오프셋의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set rightType(value: Enums.LengthPercentageAutoType) {
    native.commonValuesSetRightType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed bottom position offset unit or keyword.
   *
   * @zh 计算后的下侧定位偏移的单位或关键字。
   * @ja 計算済みの下側の配置オフセットの単位またはキーワード。
   * @ko 계산된 아래 배치 오프셋의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get bottomType(): Enums.LengthPercentageAutoType {
    const value = native.commonValuesGetBottomType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed bottom position offset unit or keyword.
   *
   * @zh 计算后的下侧定位偏移的单位或关键字。
   * @ja 計算済みの下側の配置オフセットの単位またはキーワード。
   * @ko 계산된 아래 배치 오프셋의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set bottomType(value: Enums.LengthPercentageAutoType) {
    native.commonValuesSetBottomType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed left position offset unit or keyword.
   *
   * @zh 计算后的左侧定位偏移的单位或关键字。
   * @ja 計算済みの左側の配置オフセットの単位またはキーワード。
   * @ko 계산된 왼쪽 배치 오프셋의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get leftType(): Enums.LengthPercentageAutoType {
    const value = native.commonValuesGetLeftType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed left position offset unit or keyword.
   *
   * @zh 计算后的左侧定位偏移的单位或关键字。
   * @ja 計算済みの左側の配置オフセットの単位またはキーワード。
   * @ko 계산된 왼쪽 배치 오프셋의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set leftType(value: Enums.LengthPercentageAutoType) {
    native.commonValuesSetLeftType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed stacking order unit or keyword.
   *
   * @zh 计算后的堆叠顺序的单位或关键字。
   * @ja 計算済みの重なり順の単位またはキーワード。
   * @ko 계산된 쌓임 순서의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get zIndexType(): Enums.NumberAutoType {
    const value = native.commonValuesGetZIndexType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed stacking order unit or keyword.
   *
   * @zh 计算后的堆叠顺序的单位或关键字。
   * @ja 計算済みの重なり順の単位またはキーワード。
   * @ko 계산된 쌓임 순서의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set zIndexType(value: Enums.NumberAutoType) {
    native.commonValuesSetZIndexType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed width numeric component.
   *
   * @zh 计算后的宽度的数值分量。
   * @ja 計算済みの幅の数値成分。
   * @ko 계산된 너비의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get widthValue(): number {
    return structMapping(this).views.widthValue[0];
  }

  /**
   * The computed width numeric component.
   *
   * @zh 计算后的宽度的数值分量。
   * @ja 計算済みの幅の数値成分。
   * @ko 계산된 너비의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set widthValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.widthValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed width numeric component.
   *
   * @zh 可写共享内存：计算后的宽度的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの幅の数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 너비의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get widthValueView(): Float32Array {
    return structMapping(this).views.widthValue as Float32Array;
  }

  /**
   * The computed height numeric component.
   *
   * @zh 计算后的高度的数值分量。
   * @ja 計算済みの高さの数値成分。
   * @ko 계산된 높이의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get heightValue(): number {
    return structMapping(this).views.heightValue[0];
  }

  /**
   * The computed height numeric component.
   *
   * @zh 计算后的高度的数值分量。
   * @ja 計算済みの高さの数値成分。
   * @ko 계산된 높이의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set heightValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.heightValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed height numeric component.
   *
   * @zh 可写共享内存：计算后的高度的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの高さの数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 높이의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get heightValueView(): Float32Array {
    return structMapping(this).views.heightValue as Float32Array;
  }

  /**
   * The computed top outer spacing numeric component.
   *
   * @zh 计算后的上外边距的数值分量。
   * @ja 計算済みの上外側の余白の数値成分。
   * @ko 계산된 위 바깥 여백의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get marginTopValue(): number {
    return structMapping(this).views.marginTopValue[0];
  }

  /**
   * The computed top outer spacing numeric component.
   *
   * @zh 计算后的上外边距的数值分量。
   * @ja 計算済みの上外側の余白の数値成分。
   * @ko 계산된 위 바깥 여백의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set marginTopValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.marginTopValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed top outer spacing numeric component.
   *
   * @zh 可写共享内存：计算后的上外边距的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの上外側の余白の数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 위 바깥 여백의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get marginTopValueView(): Float32Array {
    return structMapping(this).views.marginTopValue as Float32Array;
  }

  /**
   * The computed right outer spacing numeric component.
   *
   * @zh 计算后的右外边距的数值分量。
   * @ja 計算済みの右外側の余白の数値成分。
   * @ko 계산된 오른쪽 바깥 여백의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get marginRightValue(): number {
    return structMapping(this).views.marginRightValue[0];
  }

  /**
   * The computed right outer spacing numeric component.
   *
   * @zh 计算后的右外边距的数值分量。
   * @ja 計算済みの右外側の余白の数値成分。
   * @ko 계산된 오른쪽 바깥 여백의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set marginRightValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.marginRightValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed right outer spacing numeric component.
   *
   * @zh 可写共享内存：计算后的右外边距的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの右外側の余白の数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 오른쪽 바깥 여백의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get marginRightValueView(): Float32Array {
    return structMapping(this).views.marginRightValue as Float32Array;
  }

  /**
   * The computed bottom outer spacing numeric component.
   *
   * @zh 计算后的下外边距的数值分量。
   * @ja 計算済みの下外側の余白の数値成分。
   * @ko 계산된 아래 바깥 여백의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get marginBottomValue(): number {
    return structMapping(this).views.marginBottomValue[0];
  }

  /**
   * The computed bottom outer spacing numeric component.
   *
   * @zh 计算后的下外边距的数值分量。
   * @ja 計算済みの下外側の余白の数値成分。
   * @ko 계산된 아래 바깥 여백의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set marginBottomValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.marginBottomValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed bottom outer spacing numeric
   * component.
   *
   * @zh 可写共享内存：计算后的下外边距的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの下外側の余白の数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 아래 바깥 여백의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get marginBottomValueView(): Float32Array {
    return structMapping(this).views.marginBottomValue as Float32Array;
  }

  /**
   * The computed left outer spacing numeric component.
   *
   * @zh 计算后的左外边距的数值分量。
   * @ja 計算済みの左外側の余白の数値成分。
   * @ko 계산된 왼쪽 바깥 여백의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get marginLeftValue(): number {
    return structMapping(this).views.marginLeftValue[0];
  }

  /**
   * The computed left outer spacing numeric component.
   *
   * @zh 计算后的左外边距的数值分量。
   * @ja 計算済みの左外側の余白の数値成分。
   * @ko 계산된 왼쪽 바깥 여백의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set marginLeftValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.marginLeftValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed left outer spacing numeric component.
   *
   * @zh 可写共享内存：计算后的左外边距的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの左外側の余白の数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 왼쪽 바깥 여백의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get marginLeftValueView(): Float32Array {
    return structMapping(this).views.marginLeftValue as Float32Array;
  }

  /**
   * The computed top inner spacing numeric component.
   *
   * @zh 计算后的上内边距的数值分量。
   * @ja 計算済みの上内側の余白の数値成分。
   * @ko 계산된 위 안쪽 여백의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get paddingTopValue(): number {
    return structMapping(this).views.paddingTopValue[0];
  }

  /**
   * The computed top inner spacing numeric component.
   *
   * @zh 计算后的上内边距的数值分量。
   * @ja 計算済みの上内側の余白の数値成分。
   * @ko 계산된 위 안쪽 여백의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set paddingTopValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.paddingTopValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed top inner spacing numeric component.
   *
   * @zh 可写共享内存：计算后的上内边距的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの上内側の余白の数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 위 안쪽 여백의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get paddingTopValueView(): Float32Array {
    return structMapping(this).views.paddingTopValue as Float32Array;
  }

  /**
   * The computed right inner spacing numeric component.
   *
   * @zh 计算后的右内边距的数值分量。
   * @ja 計算済みの右内側の余白の数値成分。
   * @ko 계산된 오른쪽 안쪽 여백의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get paddingRightValue(): number {
    return structMapping(this).views.paddingRightValue[0];
  }

  /**
   * The computed right inner spacing numeric component.
   *
   * @zh 计算后的右内边距的数值分量。
   * @ja 計算済みの右内側の余白の数値成分。
   * @ko 계산된 오른쪽 안쪽 여백의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set paddingRightValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.paddingRightValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed right inner spacing numeric component.
   *
   * @zh 可写共享内存：计算后的右内边距的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの右内側の余白の数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 오른쪽 안쪽 여백의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get paddingRightValueView(): Float32Array {
    return structMapping(this).views.paddingRightValue as Float32Array;
  }

  /**
   * The computed bottom inner spacing numeric component.
   *
   * @zh 计算后的下内边距的数值分量。
   * @ja 計算済みの下内側の余白の数値成分。
   * @ko 계산된 아래 안쪽 여백의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get paddingBottomValue(): number {
    return structMapping(this).views.paddingBottomValue[0];
  }

  /**
   * The computed bottom inner spacing numeric component.
   *
   * @zh 计算后的下内边距的数值分量。
   * @ja 計算済みの下内側の余白の数値成分。
   * @ko 계산된 아래 안쪽 여백의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set paddingBottomValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.paddingBottomValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed bottom inner spacing numeric
   * component.
   *
   * @zh 可写共享内存：计算后的下内边距的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの下内側の余白の数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 아래 안쪽 여백의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get paddingBottomValueView(): Float32Array {
    return structMapping(this).views.paddingBottomValue as Float32Array;
  }

  /**
   * The computed left inner spacing numeric component.
   *
   * @zh 计算后的左内边距的数值分量。
   * @ja 計算済みの左内側の余白の数値成分。
   * @ko 계산된 왼쪽 안쪽 여백의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get paddingLeftValue(): number {
    return structMapping(this).views.paddingLeftValue[0];
  }

  /**
   * The computed left inner spacing numeric component.
   *
   * @zh 计算后的左内边距的数值分量。
   * @ja 計算済みの左内側の余白の数値成分。
   * @ko 계산된 왼쪽 안쪽 여백의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set paddingLeftValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.paddingLeftValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed left inner spacing numeric component.
   *
   * @zh 可写共享内存：计算后的左内边距的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの左内側の余白の数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 왼쪽 안쪽 여백의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get paddingLeftValueView(): Float32Array {
    return structMapping(this).views.paddingLeftValue as Float32Array;
  }

  /**
   * The computed top position offset numeric component.
   *
   * @zh 计算后的上侧定位偏移的数值分量。
   * @ja 計算済みの上側の配置オフセットの数値成分。
   * @ko 계산된 위 배치 오프셋의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get topValue(): number {
    return structMapping(this).views.topValue[0];
  }

  /**
   * The computed top position offset numeric component.
   *
   * @zh 计算后的上侧定位偏移的数值分量。
   * @ja 計算済みの上側の配置オフセットの数値成分。
   * @ko 계산된 위 배치 오프셋의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set topValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.topValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed top position offset numeric component.
   *
   * @zh 可写共享内存：计算后的上侧定位偏移的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの上側の配置オフセットの数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 위 배치 오프셋의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get topValueView(): Float32Array {
    return structMapping(this).views.topValue as Float32Array;
  }

  /**
   * The computed right position offset numeric component.
   *
   * @zh 计算后的右侧定位偏移的数值分量。
   * @ja 計算済みの右側の配置オフセットの数値成分。
   * @ko 계산된 오른쪽 배치 오프셋의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get rightValue(): number {
    return structMapping(this).views.rightValue[0];
  }

  /**
   * The computed right position offset numeric component.
   *
   * @zh 计算后的右侧定位偏移的数值分量。
   * @ja 計算済みの右側の配置オフセットの数値成分。
   * @ko 계산된 오른쪽 배치 오프셋의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set rightValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.rightValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed right position offset numeric
   * component.
   *
   * @zh 可写共享内存：计算后的右侧定位偏移的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの右側の配置オフセットの数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 오른쪽 배치 오프셋의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get rightValueView(): Float32Array {
    return structMapping(this).views.rightValue as Float32Array;
  }

  /**
   * The computed bottom position offset numeric component.
   *
   * @zh 计算后的下侧定位偏移的数值分量。
   * @ja 計算済みの下側の配置オフセットの数値成分。
   * @ko 계산된 아래 배치 오프셋의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get bottomValue(): number {
    return structMapping(this).views.bottomValue[0];
  }

  /**
   * The computed bottom position offset numeric component.
   *
   * @zh 计算后的下侧定位偏移的数值分量。
   * @ja 計算済みの下側の配置オフセットの数値成分。
   * @ko 계산된 아래 배치 오프셋의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set bottomValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.bottomValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed bottom position offset numeric
   * component.
   *
   * @zh 可写共享内存：计算后的下侧定位偏移的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの下側の配置オフセットの数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 아래 배치 오프셋의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get bottomValueView(): Float32Array {
    return structMapping(this).views.bottomValue as Float32Array;
  }

  /**
   * The computed left position offset numeric component.
   *
   * @zh 计算后的左侧定位偏移的数值分量。
   * @ja 計算済みの左側の配置オフセットの数値成分。
   * @ko 계산된 왼쪽 배치 오프셋의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get leftValue(): number {
    return structMapping(this).views.leftValue[0];
  }

  /**
   * The computed left position offset numeric component.
   *
   * @zh 计算后的左侧定位偏移的数值分量。
   * @ja 計算済みの左側の配置オフセットの数値成分。
   * @ko 계산된 왼쪽 배치 오프셋의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set leftValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.leftValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed left position offset numeric
   * component.
   *
   * @zh 可写共享内存：计算后的左侧定位偏移的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの左側の配置オフセットの数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 왼쪽 배치 오프셋의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get leftValueView(): Float32Array {
    return structMapping(this).views.leftValue as Float32Array;
  }

  /**
   * The computed stacking order numeric component.
   *
   * @zh 计算后的堆叠顺序的数值分量。
   * @ja 計算済みの重なり順の数値成分。
   * @ko 계산된 쌓임 순서의 수치 성분입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get zIndexValue(): number {
    return structMapping(this).views.zIndexValue[0];
  }

  /**
   * The computed stacking order numeric component.
   *
   * @zh 计算后的堆叠顺序的数值分量。
   * @ja 計算済みの重なり順の数値成分。
   * @ko 계산된 쌓임 순서의 수치 성분입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set zIndexValue(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.zIndexValue[0] = checked;
  }

  /**
   * Writable shared memory: The computed stacking order numeric component.
   *
   * @zh 可写共享内存：计算后的堆叠顺序的数值分量。
   * @ja 書き込み可能な共有メモリ：計算済みの重なり順の数値成分。
   * @ko 쓰기 가능한 공유 메모리: 계산된 쌓임 순서의 수치 성분입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get zIndexValueView(): Float32Array {
    return structMapping(this).views.zIndexValue as Float32Array;
  }

  /**
   * The computed top border width in pixels.
   *
   * @zh 计算后的上边框宽度（像素）。
   * @ja 計算済みの上境界線の幅（px）。
   * @ko 계산된 위 테두리 너비（px）입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get borderTopWidth(): number {
    return structMapping(this).views.borderTopWidth[0];
  }

  /**
   * The computed top border width in pixels.
   *
   * @zh 计算后的上边框宽度（像素）。
   * @ja 計算済みの上境界線の幅（px）。
   * @ko 계산된 위 테두리 너비（px）입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set borderTopWidth(value: number) {
    const checked = checkedStructInteger(value, 0, 65535);
    structMapping(this).views.borderTopWidth[0] = checked;
  }

  /**
   * Writable shared memory: The computed top border width in pixels.
   *
   * @zh 可写共享内存：计算后的上边框宽度（像素）。
   * @ja 書き込み可能な共有メモリ：計算済みの上境界線の幅（px）。
   * @ko 쓰기 가능한 공유 메모리: 계산된 위 테두리 너비（px）입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get borderTopWidthView(): Uint16Array {
    return structMapping(this).views.borderTopWidth as Uint16Array;
  }

  /**
   * The computed right border width in pixels.
   *
   * @zh 计算后的右边框宽度（像素）。
   * @ja 計算済みの右境界線の幅（px）。
   * @ko 계산된 오른쪽 테두리 너비（px）입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get borderRightWidth(): number {
    return structMapping(this).views.borderRightWidth[0];
  }

  /**
   * The computed right border width in pixels.
   *
   * @zh 计算后的右边框宽度（像素）。
   * @ja 計算済みの右境界線の幅（px）。
   * @ko 계산된 오른쪽 테두리 너비（px）입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set borderRightWidth(value: number) {
    const checked = checkedStructInteger(value, 0, 65535);
    structMapping(this).views.borderRightWidth[0] = checked;
  }

  /**
   * Writable shared memory: The computed right border width in pixels.
   *
   * @zh 可写共享内存：计算后的右边框宽度（像素）。
   * @ja 書き込み可能な共有メモリ：計算済みの右境界線の幅（px）。
   * @ko 쓰기 가능한 공유 메모리: 계산된 오른쪽 테두리 너비（px）입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get borderRightWidthView(): Uint16Array {
    return structMapping(this).views.borderRightWidth as Uint16Array;
  }

  /**
   * The computed bottom border width in pixels.
   *
   * @zh 计算后的下边框宽度（像素）。
   * @ja 計算済みの下境界線の幅（px）。
   * @ko 계산된 아래 테두리 너비（px）입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get borderBottomWidth(): number {
    return structMapping(this).views.borderBottomWidth[0];
  }

  /**
   * The computed bottom border width in pixels.
   *
   * @zh 计算后的下边框宽度（像素）。
   * @ja 計算済みの下境界線の幅（px）。
   * @ko 계산된 아래 테두리 너비（px）입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set borderBottomWidth(value: number) {
    const checked = checkedStructInteger(value, 0, 65535);
    structMapping(this).views.borderBottomWidth[0] = checked;
  }

  /**
   * Writable shared memory: The computed bottom border width in pixels.
   *
   * @zh 可写共享内存：计算后的下边框宽度（像素）。
   * @ja 書き込み可能な共有メモリ：計算済みの下境界線の幅（px）。
   * @ko 쓰기 가능한 공유 메모리: 계산된 아래 테두리 너비（px）입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get borderBottomWidthView(): Uint16Array {
    return structMapping(this).views.borderBottomWidth as Uint16Array;
  }

  /**
   * The computed left border width in pixels.
   *
   * @zh 计算后的左边框宽度（像素）。
   * @ja 計算済みの左境界線の幅（px）。
   * @ko 계산된 왼쪽 테두리 너비（px）입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get borderLeftWidth(): number {
    return structMapping(this).views.borderLeftWidth[0];
  }

  /**
   * The computed left border width in pixels.
   *
   * @zh 计算后的左边框宽度（像素）。
   * @ja 計算済みの左境界線の幅（px）。
   * @ko 계산된 왼쪽 테두리 너비（px）입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set borderLeftWidth(value: number) {
    const checked = checkedStructInteger(value, 0, 65535);
    structMapping(this).views.borderLeftWidth[0] = checked;
  }

  /**
   * Writable shared memory: The computed left border width in pixels.
   *
   * @zh 可写共享内存：计算后的左边框宽度（像素）。
   * @ja 書き込み可能な共有メモリ：計算済みの左境界線の幅（px）。
   * @ko 쓰기 가능한 공유 메모리: 계산된 왼쪽 테두리 너비（px）입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get borderLeftWidthView(): Uint16Array {
    return structMapping(this).views.borderLeftWidth as Uint16Array;
  }

  /**
   * The computed top border RGBA colour.
   *
   * @zh 计算后的上边框 RGBA 颜色。
   * @ja 計算済みの上境界線の RGBA 色。
   * @ko 계산된 위 테두리 RGBA 색상입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get borderTopColor(): VariantByteColour {
    return structColour(structMapping(this).views.borderTopColor);
  }

  /**
   * The computed top border RGBA colour.
   *
   * @zh 计算后的上边框 RGBA 颜色。
   * @ja 計算済みの上境界線の RGBA 色。
   * @ko 계산된 위 테두리 RGBA 색상입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set borderTopColor(value: VariantByteColour) {
    const components = checkedStructColour(value);
    structMapping(this).views.borderTopColor.set(components);
  }

  /**
   * Writable shared memory: The computed top border RGBA colour.
   *
   * @zh 可写共享内存：计算后的上边框 RGBA 颜色。
   * @ja 書き込み可能な共有メモリ：計算済みの上境界線の RGBA 色。
   * @ko 쓰기 가능한 공유 메모리: 계산된 위 테두리 RGBA 색상입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get borderTopColorView(): Uint8Array {
    return structMapping(this).views.borderTopColor as Uint8Array;
  }

  /**
   * The computed right border RGBA colour.
   *
   * @zh 计算后的右边框 RGBA 颜色。
   * @ja 計算済みの右境界線の RGBA 色。
   * @ko 계산된 오른쪽 테두리 RGBA 색상입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get borderRightColor(): VariantByteColour {
    return structColour(structMapping(this).views.borderRightColor);
  }

  /**
   * The computed right border RGBA colour.
   *
   * @zh 计算后的右边框 RGBA 颜色。
   * @ja 計算済みの右境界線の RGBA 色。
   * @ko 계산된 오른쪽 테두리 RGBA 색상입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set borderRightColor(value: VariantByteColour) {
    const components = checkedStructColour(value);
    structMapping(this).views.borderRightColor.set(components);
  }

  /**
   * Writable shared memory: The computed right border RGBA colour.
   *
   * @zh 可写共享内存：计算后的右边框 RGBA 颜色。
   * @ja 書き込み可能な共有メモリ：計算済みの右境界線の RGBA 色。
   * @ko 쓰기 가능한 공유 메모리: 계산된 오른쪽 테두리 RGBA 색상입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get borderRightColorView(): Uint8Array {
    return structMapping(this).views.borderRightColor as Uint8Array;
  }

  /**
   * The computed bottom border RGBA colour.
   *
   * @zh 计算后的下边框 RGBA 颜色。
   * @ja 計算済みの下境界線の RGBA 色。
   * @ko 계산된 아래 테두리 RGBA 색상입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get borderBottomColor(): VariantByteColour {
    return structColour(structMapping(this).views.borderBottomColor);
  }

  /**
   * The computed bottom border RGBA colour.
   *
   * @zh 计算后的下边框 RGBA 颜色。
   * @ja 計算済みの下境界線の RGBA 色。
   * @ko 계산된 아래 테두리 RGBA 색상입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set borderBottomColor(value: VariantByteColour) {
    const components = checkedStructColour(value);
    structMapping(this).views.borderBottomColor.set(components);
  }

  /**
   * Writable shared memory: The computed bottom border RGBA colour.
   *
   * @zh 可写共享内存：计算后的下边框 RGBA 颜色。
   * @ja 書き込み可能な共有メモリ：計算済みの下境界線の RGBA 色。
   * @ko 쓰기 가능한 공유 메모리: 계산된 아래 테두리 RGBA 색상입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get borderBottomColorView(): Uint8Array {
    return structMapping(this).views.borderBottomColor as Uint8Array;
  }

  /**
   * The computed left border RGBA colour.
   *
   * @zh 计算后的左边框 RGBA 颜色。
   * @ja 計算済みの左境界線の RGBA 色。
   * @ko 계산된 왼쪽 테두리 RGBA 색상입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get borderLeftColor(): VariantByteColour {
    return structColour(structMapping(this).views.borderLeftColor);
  }

  /**
   * The computed left border RGBA colour.
   *
   * @zh 计算后的左边框 RGBA 颜色。
   * @ja 計算済みの左境界線の RGBA 色。
   * @ko 계산된 왼쪽 테두리 RGBA 색상입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set borderLeftColor(value: VariantByteColour) {
    const components = checkedStructColour(value);
    structMapping(this).views.borderLeftColor.set(components);
  }

  /**
   * Writable shared memory: The computed left border RGBA colour.
   *
   * @zh 可写共享内存：计算后的左边框 RGBA 颜色。
   * @ja 書き込み可能な共有メモリ：計算済みの左境界線の RGBA 色。
   * @ko 쓰기 가능한 공유 메모리: 계산된 왼쪽 테두리 RGBA 색상입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get borderLeftColorView(): Uint8Array {
    return structMapping(this).views.borderLeftColor as Uint8Array;
  }

  /**
   * The computed background RGBA colour.
   *
   * @zh 计算后的背景 RGBA 颜色。
   * @ja 計算済みの背景の RGBA 色。
   * @ko 계산된 배경 RGBA 색상입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get backgroundColor(): VariantByteColour {
    return structColour(structMapping(this).views.backgroundColor);
  }

  /**
   * The computed background RGBA colour.
   *
   * @zh 计算后的背景 RGBA 颜色。
   * @ja 計算済みの背景の RGBA 色。
   * @ko 계산된 배경 RGBA 색상입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set backgroundColor(value: VariantByteColour) {
    const components = checkedStructColour(value);
    structMapping(this).views.backgroundColor.set(components);
  }

  /**
   * Writable shared memory: The computed background RGBA colour.
   *
   * @zh 可写共享内存：计算后的背景 RGBA 颜色。
   * @ja 書き込み可能な共有メモリ：計算済みの背景の RGBA 色。
   * @ko 쓰기 가능한 공유 메모리: 계산된 배경 RGBA 색상입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get backgroundColorView(): Uint8Array {
    return structMapping(this).views.backgroundColor as Uint8Array;
  }

}

/**
 * Owned storage for inherited text, colour and input properties.
 *
 * @zh 继承的文本、颜色和输入属性的独立存储。
 * @ja 継承されるテキスト・色・入力プロパティの所有ストレージ。
 * @ko 상속되는 텍스트·색상·입력 속성의 소유 저장소입니다.
 * @remarks Uses upstream defaults independently of DOM and runtime.
 * Numeric views retain this struct only; colour getters return copies.
 * Non-null font handles require the active runtime generation.
 * @zh 使用上游默认值，独立于 DOM 和运行时。数值视图仅保活此结构，
 * 颜色 getter 返回副本；非空字体句柄要求当前运行时世代有效。
 * @ja DOM とランタイムから独立した既定値。数値ビューは構造体のみ保持し、
 * 色の取得はコピーです。非 null のフォントは有効なランタイム世代が必要です。
 * @ko DOM 및 런타임과 독립된 기본값입니다. 숫자 뷰는 구조체만 유지하고
 * 색은 복사됩니다. null이 아닌 글꼴은 유효한 런타임 세대가 필요합니다.
 */
export class InheritedValues {
  /**
   * Create independent storage initialized to the RmlUi defaults.
   *
   * @zh 按 RmlUi 默认值创建独立存储。
   * @ja RmlUi の既定値で初期化した独立ストレージを作ります。
   * @ko RmlUi 기본값으로 초기화한 독립 저장소를 만듭니다.
   */
  constructor() {
    styleStructs.set(this, native.createInheritedValues());
  }

  /**
   * The computed resolved font face handle.
   *
   * @zh 计算后的已解析字体句柄。
   * @ja 計算済みの解決済みフォントハンドル。
   * @ko 계산된 해결된 글꼴 핸들입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get fontFaceHandle(): FontFaceHandle | null {
    const value = native.inheritedValuesGetFontFaceHandle(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed resolved font face handle.
   *
   * @zh 计算后的已解析字体句柄。
   * @ja 計算済みの解決済みフォントハンドル。
   * @ko 계산된 해결된 글꼴 핸들입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set fontFaceHandle(value: FontFaceHandle | null) {
    native.inheritedValuesSetFontFaceHandle(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed font size in pixels.
   *
   * @zh 计算后的像素字号。
   * @ja 計算済みのピクセル単位の文字サイズ。
   * @ko 계산된 픽셀 단위 글꼴 크기입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get fontSize(): number {
    return structMapping(this).views.fontSize[0];
  }

  /**
   * The computed font size in pixels.
   *
   * @zh 计算后的像素字号。
   * @ja 計算済みのピクセル単位の文字サイズ。
   * @ko 계산된 픽셀 단위 글꼴 크기입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set fontSize(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.fontSize[0] = checked;
  }

  /**
   * Writable shared memory: The computed font size in pixels.
   *
   * @zh 可写共享内存：计算后的像素字号。
   * @ja 書き込み可能な共有メモリ：計算済みのピクセル単位の文字サイズ。
   * @ko 쓰기 가능한 공유 메모리: 계산된 픽셀 단위 글꼴 크기입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get fontSizeView(): Float32Array {
    return structMapping(this).views.fontSize as Float32Array;
  }

  /**
   * The computed opacity multiplier.
   *
   * @zh 计算后的不透明度乘数。
   * @ja 計算済みの不透明度の乗数。
   * @ko 계산된 불투명도 배율입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get opacity(): number {
    return structMapping(this).views.opacity[0];
  }

  /**
   * The computed opacity multiplier.
   *
   * @zh 计算后的不透明度乘数。
   * @ja 計算済みの不透明度の乗数。
   * @ko 계산된 불투명도 배율입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set opacity(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.opacity[0] = checked;
  }

  /**
   * Writable shared memory: The computed opacity multiplier.
   *
   * @zh 可写共享内存：计算后的不透明度乘数。
   * @ja 書き込み可能な共有メモリ：計算済みの不透明度の乗数。
   * @ko 쓰기 가능한 공유 메모리: 계산된 불투명도 배율입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get opacityView(): Float32Array {
    return structMapping(this).views.opacity as Float32Array;
  }

  /**
   * The computed text RGBA colour.
   *
   * @zh 计算后的文本 RGBA 颜色。
   * @ja 計算済みの文字の RGBA 色。
   * @ko 계산된 텍스트 RGBA 색상입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get color(): VariantByteColour {
    return structColour(structMapping(this).views.color);
  }

  /**
   * The computed text RGBA colour.
   *
   * @zh 计算后的文本 RGBA 颜色。
   * @ja 計算済みの文字の RGBA 色。
   * @ko 계산된 텍스트 RGBA 색상입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set color(value: VariantByteColour) {
    const components = checkedStructColour(value);
    structMapping(this).views.color.set(components);
  }

  /**
   * Writable shared memory: The computed text RGBA colour.
   *
   * @zh 可写共享内存：计算后的文本 RGBA 颜色。
   * @ja 書き込み可能な共有メモリ：計算済みの文字の RGBA 色。
   * @ko 쓰기 가능한 공유 메모리: 계산된 텍스트 RGBA 색상입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get colorView(): Uint8Array {
    return structMapping(this).views.color as Uint8Array;
  }

  /**
   * The computed font weight.
   *
   * @zh 计算后的字重。
   * @ja 計算済みのフォントの太さ。
   * @ko 계산된 글꼴 굵기입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get fontWeight(): number {
    const value = native.inheritedValuesGetFontWeight(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed font weight.
   *
   * @zh 计算后的字重。
   * @ja 計算済みのフォントの太さ。
   * @ko 계산된 글꼴 굵기입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set fontWeight(value: number) {
    native.inheritedValuesSetFontWeight(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed font kerning.
   *
   * @zh 计算后的字体字偶距。
   * @ja 計算済みのカーニング。
   * @ko 계산된 커닝입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get fontKerning(): Enums.FontKerning {
    const value = native.inheritedValuesGetFontKerning(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed font kerning.
   *
   * @zh 计算后的字体字偶距。
   * @ja 計算済みのカーニング。
   * @ko 계산된 커닝입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set fontKerning(value: Enums.FontKerning) {
    native.inheritedValuesSetFontKerning(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed whether extra letter spacing in pixels is present.
   *
   * @zh 计算后的是否存在额外像素字距。
   * @ja 計算済みの追加の文字間隔（px）の有無。
   * @ko 계산된 추가 문자 간격（px） 존재 여부입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get hasLetterSpacing(): number {
    const value = native.inheritedValuesGetHasLetterSpacing(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed whether extra letter spacing in pixels is present.
   *
   * @zh 计算后的是否存在额外像素字距。
   * @ja 計算済みの追加の文字間隔（px）の有無。
   * @ko 계산된 추가 문자 간격（px） 존재 여부입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set hasLetterSpacing(value: number) {
    native.inheritedValuesSetHasLetterSpacing(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed font slant.
   *
   * @zh 计算后的字体倾斜样式。
   * @ja 計算済みのフォントの傾斜。
   * @ko 계산된 글꼴 기울기입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get fontStyle(): Enums.FontStyle {
    const value = native.inheritedValuesGetFontStyle(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed font slant.
   *
   * @zh 计算后的字体倾斜样式。
   * @ja 計算済みのフォントの傾斜。
   * @ko 계산된 글꼴 기울기입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set fontStyle(value: Enums.FontStyle) {
    native.inheritedValuesSetFontStyle(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed whether font effects is present.
   *
   * @zh 计算后的是否存在字体效果。
   * @ja 計算済みのフォント効果の有無。
   * @ko 계산된 글꼴 효과 존재 여부입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get hasFontEffect(): boolean {
    const value = native.inheritedValuesGetHasFontEffect(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed whether font effects is present.
   *
   * @zh 计算后的是否存在字体效果。
   * @ja 計算済みのフォント効果の有無。
   * @ko 계산된 글꼴 효과 존재 여부입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set hasFontEffect(value: boolean) {
    native.inheritedValuesSetHasFontEffect(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed pointer hit testing.
   *
   * @zh 计算后的指针命中检测。
   * @ja 計算済みのポインターのヒット判定。
   * @ko 계산된 포인터 적중 검사입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get pointerEvents(): Enums.PointerEvents {
    const value = native.inheritedValuesGetPointerEvents(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed pointer hit testing.
   *
   * @zh 计算后的指针命中检测。
   * @ja 計算済みのポインターのヒット判定。
   * @ko 계산된 포인터 적중 검사입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set pointerEvents(value: Enums.PointerEvents) {
    native.inheritedValuesSetPointerEvents(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed focus eligibility.
   *
   * @zh 计算后的焦点接收能力。
   * @ja 計算済みのフォーカスの可否。
   * @ko 계산된 포커스 허용 여부입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get focus(): Enums.Focus {
    const value = native.inheritedValuesGetFocus(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed focus eligibility.
   *
   * @zh 计算后的焦点接收能力。
   * @ja 計算済みのフォーカスの可否。
   * @ko 계산된 포커스 허용 여부입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set focus(value: Enums.Focus) {
    native.inheritedValuesSetFocus(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed text horizontal alignment.
   *
   * @zh 计算后的文本水平对齐。
   * @ja 計算済みのテキストの水平配置。
   * @ko 계산된 텍스트 수평 정렬입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get textAlign(): Enums.TextAlign {
    const value = native.inheritedValuesGetTextAlign(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed text horizontal alignment.
   *
   * @zh 计算后的文本水平对齐。
   * @ja 計算済みのテキストの水平配置。
   * @ko 계산된 텍스트 수평 정렬입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set textAlign(value: Enums.TextAlign) {
    native.inheritedValuesSetTextAlign(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed text decoration line.
   *
   * @zh 计算后的文本装饰线。
   * @ja 計算済みのテキストの装飾線。
   * @ko 계산된 텍스트 장식선입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get textDecoration(): Enums.TextDecoration {
    const value = native.inheritedValuesGetTextDecoration(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed text decoration line.
   *
   * @zh 计算后的文本装饰线。
   * @ja 計算済みのテキストの装飾線。
   * @ko 계산된 텍스트 장식선입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set textDecoration(value: Enums.TextDecoration) {
    native.inheritedValuesSetTextDecoration(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed text case conversion.
   *
   * @zh 计算后的文本大小写转换。
   * @ja 計算済みの大文字・小文字の変換。
   * @ko 계산된 텍스트 대소문자 변환입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get textTransform(): Enums.TextTransform {
    const value = native.inheritedValuesGetTextTransform(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed text case conversion.
   *
   * @zh 计算后的文本大小写转换。
   * @ja 計算済みの大文字・小文字の変換。
   * @ko 계산된 텍스트 대소문자 변환입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set textTransform(value: Enums.TextTransform) {
    native.inheritedValuesSetTextTransform(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed whitespace and wrapping.
   *
   * @zh 计算后的空白与换行处理。
   * @ja 計算済みの空白と折り返しの処理。
   * @ko 계산된 공백 및 줄바꿈 처리입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get whiteSpace(): Enums.WhiteSpace {
    const value = native.inheritedValuesGetWhiteSpace(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed whitespace and wrapping.
   *
   * @zh 计算后的空白与换行处理。
   * @ja 計算済みの空白と折り返しの処理。
   * @ko 계산된 공백 및 줄바꿈 처리입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set whiteSpace(value: Enums.WhiteSpace) {
    native.inheritedValuesSetWhiteSpace(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed word breaking.
   *
   * @zh 计算后的单词断行。
   * @ja 計算済みの単語の改行規則。
   * @ko 계산된 단어 줄바꿈입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get wordBreak(): Enums.WordBreak {
    const value = native.inheritedValuesGetWordBreak(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed word breaking.
   *
   * @zh 计算后的单词断行。
   * @ja 計算済みの単語の改行規則。
   * @ko 계산된 단어 줄바꿈입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set wordBreak(value: Enums.WordBreak) {
    native.inheritedValuesSetWordBreak(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed text reading direction.
   *
   * @zh 计算后的文本阅读方向。
   * @ja 計算済みのテキストの読み方向。
   * @ko 계산된 텍스트 읽기 방향입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get direction(): Enums.Direction {
    const value = native.inheritedValuesGetDirection(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed text reading direction.
   *
   * @zh 计算后的文本阅读方向。
   * @ja 計算済みのテキストの読み方向。
   * @ko 계산된 텍스트 읽기 방향입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set direction(value: Enums.Direction) {
    native.inheritedValuesSetDirection(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed line height inheritance unit.
   *
   * @zh 计算后的行高继承单位。
   * @ja 計算済みの行の高さの継承単位。
   * @ko 계산된 줄 높이 상속 단위입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get lineHeightInheritType(): Enums.LineHeightInheritType {
    const value = native.inheritedValuesGetLineHeightInheritType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed line height inheritance unit.
   *
   * @zh 计算后的行高继承单位。
   * @ja 計算済みの行の高さの継承単位。
   * @ko 계산된 줄 높이 상속 단위입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set lineHeightInheritType(value: Enums.LineHeightInheritType) {
    native.inheritedValuesSetLineHeightInheritType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed line height.
   *
   * @zh 计算后的行高。
   * @ja 計算済みの行の高さ。
   * @ko 계산된 줄 높이입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get lineHeight(): number {
    return structMapping(this).views.lineHeight[0];
  }

  /**
   * The computed line height.
   *
   * @zh 计算后的行高。
   * @ja 計算済みの行の高さ。
   * @ko 계산된 줄 높이입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set lineHeight(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.lineHeight[0] = checked;
  }

  /**
   * Writable shared memory: The computed line height.
   *
   * @zh 可写共享内存：计算后的行高。
   * @ja 書き込み可能な共有メモリ：計算済みの行の高さ。
   * @ko 쓰기 가능한 공유 메모리: 계산된 줄 높이입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get lineHeightView(): Float32Array {
    return structMapping(this).views.lineHeight as Float32Array;
  }

  /**
   * The computed inherited line height number or length.
   *
   * @zh 计算后的继承的行高数值或长度。
   * @ja 計算済みの継承する行の高さの数値または長さ。
   * @ko 계산된 상속할 줄 높이 숫자 또는 길이입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get lineHeightInherit(): number {
    return structMapping(this).views.lineHeightInherit[0];
  }

  /**
   * The computed inherited line height number or length.
   *
   * @zh 计算后的继承的行高数值或长度。
   * @ja 計算済みの継承する行の高さの数値または長さ。
   * @ko 계산된 상속할 줄 높이 숫자 또는 길이입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set lineHeightInherit(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.lineHeightInherit[0] = checked;
  }

  /**
   * Writable shared memory: The computed inherited line height number or
   * length.
   *
   * @zh 可写共享内存：计算后的继承的行高数值或长度。
   * @ja 書き込み可能な共有メモリ：計算済みの継承する行の高さの数値または長さ。
   * @ko 쓰기 가능한 공유 메모리: 계산된 상속할 줄 높이 숫자 또는 길이입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get lineHeightInheritView(): Float32Array {
    return structMapping(this).views.lineHeightInherit as Float32Array;
  }

  /**
   * The computed text language tag.
   *
   * @zh 计算后的文本语言标签。
   * @ja 計算済みのテキストの言語タグ。
   * @ko 계산된 텍스트 언어 태그입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get language(): string {
    const value = native.inheritedValuesGetLanguage(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed text language tag.
   *
   * @zh 计算后的文本语言标签。
   * @ja 計算済みのテキストの言語タグ。
   * @ko 계산된 텍스트 언어 태그입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set language(value: string) {
    native.inheritedValuesSetLanguage(
      structMapping(this).handle, value,
    );
  }

}

/**
 * Owned storage for less common layout, transform and effect properties.
 *
 * @zh 较少使用的布局、变换和效果属性的独立存储。
 * @ja 使用頻度の低いレイアウト・変換・効果プロパティの所有ストレージ。
 * @ko 덜 자주 사용하는 레이아웃·변환·효과 속성의 소유 저장소입니다.
 * @remarks Uses upstream defaults independently of DOM and runtime.
 * Numeric views retain this struct only; colour getters return copies.
 * Non-null font handles require the active runtime generation.
 * @zh 使用上游默认值，独立于 DOM 和运行时。数值视图仅保活此结构，
 * 颜色 getter 返回副本；非空字体句柄要求当前运行时世代有效。
 * @ja DOM とランタイムから独立した既定値。数値ビューは構造体のみ保持し、
 * 色の取得はコピーです。非 null のフォントは有効なランタイム世代が必要です。
 * @ko DOM 및 런타임과 독립된 기본값입니다. 숫자 뷰는 구조체만 유지하고
 * 색은 복사됩니다. null이 아닌 글꼴은 유효한 런타임 세대가 필요합니다.
 */
export class RareValues {
  /**
   * Create independent storage initialized to the RmlUi defaults.
   *
   * @zh 按 RmlUi 默认值创建独立存储。
   * @ja RmlUi の既定値で初期化した独立ストレージを作ります。
   * @ko RmlUi 기본값으로 초기화한 독립 저장소를 만듭니다.
   */
  constructor() {
    styleStructs.set(this, native.createRareValues());
  }

  /**
   * The computed minimum width unit or keyword.
   *
   * @zh 计算后的最小宽度的单位或关键字。
   * @ja 計算済みの最小幅の単位またはキーワード。
   * @ko 계산된 최소 너비의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get minWidthType(): Enums.LengthPercentageType {
    const value = native.rareValuesGetMinWidthType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed minimum width unit or keyword.
   *
   * @zh 计算后的最小宽度的单位或关键字。
   * @ja 計算済みの最小幅の単位またはキーワード。
   * @ko 계산된 최소 너비의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set minWidthType(value: Enums.LengthPercentageType) {
    native.rareValuesSetMinWidthType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed maximum width unit or keyword.
   *
   * @zh 计算后的最大宽度的单位或关键字。
   * @ja 計算済みの最大幅の単位またはキーワード。
   * @ko 계산된 최대 너비의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get maxWidthType(): Enums.LengthPercentageType {
    const value = native.rareValuesGetMaxWidthType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed maximum width unit or keyword.
   *
   * @zh 计算后的最大宽度的单位或关键字。
   * @ja 計算済みの最大幅の単位またはキーワード。
   * @ko 계산된 최대 너비의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set maxWidthType(value: Enums.LengthPercentageType) {
    native.rareValuesSetMaxWidthType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed minimum height unit or keyword.
   *
   * @zh 计算后的最小高度的单位或关键字。
   * @ja 計算済みの最小高さの単位またはキーワード。
   * @ko 계산된 최소 높이의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get minHeightType(): Enums.LengthPercentageType {
    const value = native.rareValuesGetMinHeightType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed minimum height unit or keyword.
   *
   * @zh 计算后的最小高度的单位或关键字。
   * @ja 計算済みの最小高さの単位またはキーワード。
   * @ko 계산된 최소 높이의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set minHeightType(value: Enums.LengthPercentageType) {
    native.rareValuesSetMinHeightType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed maximum height unit or keyword.
   *
   * @zh 计算后的最大高度的单位或关键字。
   * @ja 計算済みの最大高さの単位またはキーワード。
   * @ko 계산된 최대 높이의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get maxHeightType(): Enums.LengthPercentageType {
    const value = native.rareValuesGetMaxHeightType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed maximum height unit or keyword.
   *
   * @zh 计算后的最大高度的单位或关键字。
   * @ja 計算済みの最大高さの単位またはキーワード。
   * @ko 계산된 최대 높이의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set maxHeightType(value: Enums.LengthPercentageType) {
    native.rareValuesSetMaxHeightType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed horizontal perspective origin unit or keyword.
   *
   * @zh 计算后的水平透视原点的单位或关键字。
   * @ja 計算済みの水平遠近法の原点の単位またはキーワード。
   * @ko 계산된 수평 원근 원점의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get perspectiveOriginXType(): Enums.LengthPercentageType {
    const value = native.rareValuesGetPerspectiveOriginXType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed horizontal perspective origin unit or keyword.
   *
   * @zh 计算后的水平透视原点的单位或关键字。
   * @ja 計算済みの水平遠近法の原点の単位またはキーワード。
   * @ko 계산된 수평 원근 원점의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set perspectiveOriginXType(value: Enums.LengthPercentageType) {
    native.rareValuesSetPerspectiveOriginXType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed vertical perspective origin unit or keyword.
   *
   * @zh 计算后的垂直透视原点的单位或关键字。
   * @ja 計算済みの垂直遠近法の原点の単位またはキーワード。
   * @ko 계산된 수직 원근 원점의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get perspectiveOriginYType(): Enums.LengthPercentageType {
    const value = native.rareValuesGetPerspectiveOriginYType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed vertical perspective origin unit or keyword.
   *
   * @zh 计算后的垂直透视原点的单位或关键字。
   * @ja 計算済みの垂直遠近法の原点の単位またはキーワード。
   * @ko 계산된 수직 원근 원점의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set perspectiveOriginYType(value: Enums.LengthPercentageType) {
    native.rareValuesSetPerspectiveOriginYType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed horizontal transform origin unit or keyword.
   *
   * @zh 计算后的水平变换原点的单位或关键字。
   * @ja 計算済みの水平変換の原点の単位またはキーワード。
   * @ko 계산된 수평 변환 원점의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get transformOriginXType(): Enums.LengthPercentageType {
    const value = native.rareValuesGetTransformOriginXType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed horizontal transform origin unit or keyword.
   *
   * @zh 计算后的水平变换原点的单位或关键字。
   * @ja 計算済みの水平変換の原点の単位またはキーワード。
   * @ko 계산된 수평 변환 원점의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set transformOriginXType(value: Enums.LengthPercentageType) {
    native.rareValuesSetTransformOriginXType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed vertical transform origin unit or keyword.
   *
   * @zh 计算后的垂直变换原点的单位或关键字。
   * @ja 計算済みの垂直変換の原点の単位またはキーワード。
   * @ko 계산된 수직 변환 원점의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get transformOriginYType(): Enums.LengthPercentageType {
    const value = native.rareValuesGetTransformOriginYType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed vertical transform origin unit or keyword.
   *
   * @zh 计算后的垂直变换原点的单位或关键字。
   * @ja 計算済みの垂直変換の原点の単位またはキーワード。
   * @ko 계산된 수직 변환 원점의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set transformOriginYType(value: Enums.LengthPercentageType) {
    native.rareValuesSetTransformOriginYType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed whether local transform is present.
   *
   * @zh 计算后的是否存在局部变换。
   * @ja 計算済みのローカル変換の有無。
   * @ko 계산된 로컬 변환 존재 여부입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get hasLocalTransform(): boolean {
    const value = native.rareValuesGetHasLocalTransform(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed whether local transform is present.
   *
   * @zh 计算后的是否存在局部变换。
   * @ja 計算済みのローカル変換の有無。
   * @ko 계산된 로컬 변환 존재 여부입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set hasLocalTransform(value: boolean) {
    native.rareValuesSetHasLocalTransform(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed whether local perspective distance in pixels is present.
   *
   * @zh 计算后的是否存在局部透视距离（像素）。
   * @ja 計算済みのローカル遠近法の距離（px）の有無。
   * @ko 계산된 로컬 원근 거리（px） 존재 여부입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get hasLocalPerspective(): boolean {
    const value = native.rareValuesGetHasLocalPerspective(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed whether local perspective distance in pixels is present.
   *
   * @zh 计算后的是否存在局部透视距离（像素）。
   * @ja 計算済みのローカル遠近法の距離（px）の有無。
   * @ko 계산된 로컬 원근 거리（px） 존재 여부입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set hasLocalPerspective(value: boolean) {
    native.rareValuesSetHasLocalPerspective(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed initial flex size unit or keyword.
   *
   * @zh 计算后的弹性项初始尺寸的单位或关键字。
   * @ja 計算済みのフレックス項目の初期サイズの単位またはキーワード。
   * @ko 계산된 플렉스 항목 초기 크기의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get flexBasisType(): Enums.LengthPercentageAutoType {
    const value = native.rareValuesGetFlexBasisType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed initial flex size unit or keyword.
   *
   * @zh 计算后的弹性项初始尺寸的单位或关键字。
   * @ja 計算済みのフレックス項目の初期サイズの単位またはキーワード。
   * @ko 계산된 플렉스 항목 초기 크기의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set flexBasisType(value: Enums.LengthPercentageAutoType) {
    native.rareValuesSetFlexBasisType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed gap between rows unit or keyword.
   *
   * @zh 计算后的行间距的单位或关键字。
   * @ja 計算済みの行間の間隔の単位またはキーワード。
   * @ko 계산된 행 간격의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get rowGapType(): Enums.LengthPercentageType {
    const value = native.rareValuesGetRowGapType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed gap between rows unit or keyword.
   *
   * @zh 计算后的行间距的单位或关键字。
   * @ja 計算済みの行間の間隔の単位またはキーワード。
   * @ko 계산된 행 간격의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set rowGapType(value: Enums.LengthPercentageType) {
    native.rareValuesSetRowGapType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed gap between columns unit or keyword.
   *
   * @zh 计算后的列间距的单位或关键字。
   * @ja 計算済みの列間の間隔の単位またはキーワード。
   * @ko 계산된 열 간격의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get columnGapType(): Enums.LengthPercentageType {
    const value = native.rareValuesGetColumnGapType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed gap between columns unit or keyword.
   *
   * @zh 计算后的列间距的单位或关键字。
   * @ja 計算済みの列間の間隔の単位またはキーワード。
   * @ko 계산된 열 간격의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set columnGapType(value: Enums.LengthPercentageType) {
    native.rareValuesSetColumnGapType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed inline vertical alignment unit or keyword.
   *
   * @zh 计算后的行内垂直对齐的单位或关键字。
   * @ja 計算済みのインラインの垂直配置の単位またはキーワード。
   * @ko 계산된 인라인 수직 정렬의 단위 또는 키워드입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get verticalAlignType(): Enums.VerticalAlignType {
    const value = native.rareValuesGetVerticalAlignType(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed inline vertical alignment unit or keyword.
   *
   * @zh 计算后的行内垂直对齐的单位或关键字。
   * @ja 計算済みのインラインの垂直配置の単位またはキーワード。
   * @ko 계산된 인라인 수직 정렬의 단위 또는 키워드입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set verticalAlignType(value: Enums.VerticalAlignType) {
    native.rareValuesSetVerticalAlignType(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed drag interaction.
   *
   * @zh 计算后的拖动交互。
   * @ja 計算済みのドラッグ操作。
   * @ko 계산된 드래그 동작입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get drag(): Enums.Drag {
    const value = native.rareValuesGetDrag(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed drag interaction.
   *
   * @zh 计算后的拖动交互。
   * @ja 計算済みのドラッグ操作。
   * @ko 계산된 드래그 동작입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set drag(value: Enums.Drag) {
    native.rareValuesSetDrag(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed sequential keyboard focus.
   *
   * @zh 计算后的键盘顺序焦点。
   * @ja 計算済みのキーボードの順次フォーカス。
   * @ko 계산된 키보드 순차 포커스입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get tabIndex(): Enums.TabIndex {
    const value = native.rareValuesGetTabIndex(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed sequential keyboard focus.
   *
   * @zh 计算后的键盘顺序焦点。
   * @ja 計算済みのキーボードの順次フォーカス。
   * @ko 계산된 키보드 순차 포커스입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set tabIndex(value: Enums.TabIndex) {
    native.rareValuesSetTabIndex(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed scroll chaining.
   *
   * @zh 计算后的滚动链传递。
   * @ja 計算済みのスクロールの連鎖。
   * @ko 계산된 스크롤 연쇄입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get overscrollBehavior(): Enums.OverscrollBehavior {
    const value = native.rareValuesGetOverscrollBehavior(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed scroll chaining.
   *
   * @zh 计算后的滚动链传递。
   * @ja 計算済みのスクロールの連鎖。
   * @ko 계산된 스크롤 연쇄입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set overscrollBehavior(value: Enums.OverscrollBehavior) {
    native.rareValuesSetOverscrollBehavior(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed whether mask image layers is present.
   *
   * @zh 计算后的是否存在遮罩图层。
   * @ja 計算済みのマスク画像のレイヤーの有無。
   * @ko 계산된 마스크 이미지 레이어 존재 여부입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get hasMaskImage(): boolean {
    const value = native.rareValuesGetHasMaskImage(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed whether mask image layers is present.
   *
   * @zh 计算后的是否存在遮罩图层。
   * @ja 計算済みのマスク画像のレイヤーの有無。
   * @ko 계산된 마스크 이미지 레이어 존재 여부입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set hasMaskImage(value: boolean) {
    native.rareValuesSetHasMaskImage(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed whether element filter list is present.
   *
   * @zh 计算后的是否存在元素滤镜列表。
   * @ja 計算済みの要素のフィルター一覧の有無。
   * @ko 계산된 요소 필터 목록 존재 여부입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get hasFilter(): boolean {
    const value = native.rareValuesGetHasFilter(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed whether element filter list is present.
   *
   * @zh 计算后的是否存在元素滤镜列表。
   * @ja 計算済みの要素のフィルター一覧の有無。
   * @ko 계산된 요소 필터 목록 존재 여부입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set hasFilter(value: boolean) {
    native.rareValuesSetHasFilter(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed whether backdrop filter list is present.
   *
   * @zh 计算后的是否存在背景滤镜列表。
   * @ja 計算済みの背景のフィルター一覧の有無。
   * @ko 계산된 배경 필터 목록 존재 여부입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get hasBackdropFilter(): boolean {
    const value = native.rareValuesGetHasBackdropFilter(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed whether backdrop filter list is present.
   *
   * @zh 计算后的是否存在背景滤镜列表。
   * @ja 計算済みの背景のフィルター一覧の有無。
   * @ko 계산된 배경 필터 목록 존재 여부입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set hasBackdropFilter(value: boolean) {
    native.rareValuesSetHasBackdropFilter(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed whether box shadows is present.
   *
   * @zh 计算后的是否存在盒阴影。
   * @ja 計算済みのボックスの影の有無。
   * @ko 계산된 상자 그림자 존재 여부입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get hasBoxShadow(): boolean {
    const value = native.rareValuesGetHasBoxShadow(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed whether box shadows is present.
   *
   * @zh 计算后的是否存在盒阴影。
   * @ja 計算済みのボックスの影の有無。
   * @ko 계산된 상자 그림자 존재 여부입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set hasBoxShadow(value: boolean) {
    native.rareValuesSetHasBoxShadow(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed text overflow marker.
   *
   * @zh 计算后的文本溢出标记。
   * @ja 計算済みのテキストの省略表示。
   * @ko 계산된 텍스트 넘침 표시입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get textOverflow(): Enums.TextOverflow {
    const value = native.rareValuesGetTextOverflow(
      structMapping(this).handle);
    return value;
  }

  /**
   * The computed text overflow marker.
   *
   * @zh 计算后的文本溢出标记。
   * @ja 計算済みのテキストの省略表示。
   * @ko 계산된 텍스트 넘침 표시입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set textOverflow(value: Enums.TextOverflow) {
    native.rareValuesSetTextOverflow(
      structMapping(this).handle, value,
    );
  }

  /**
   * The computed ancestor clipping control.
   *
   * @zh 计算后的祖先裁剪控制。
   * @ja 計算済みの祖先によるクリッピング制御。
   * @ko 계산된 조상 클리핑 제어입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get clip(): Clip {
    const value = native.rareValuesGetClip(
      structMapping(this).handle);
    return styleValueFromNative(value) as Clip;
  }

  /**
   * The computed ancestor clipping control.
   *
   * @zh 计算后的祖先裁剪控制。
   * @ja 計算済みの祖先によるクリッピング制御。
   * @ko 계산된 조상 클리핑 제어입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set clip(value: Clip) {
    native.rareValuesSetClip(
      structMapping(this).handle, styleValueHandle(value),
    );
  }

  /**
   * The computed minimum width.
   *
   * @zh 计算后的最小宽度。
   * @ja 計算済みの最小幅。
   * @ko 계산된 최소 너비입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get minWidth(): number {
    return structMapping(this).views.minWidth[0];
  }

  /**
   * The computed minimum width.
   *
   * @zh 计算后的最小宽度。
   * @ja 計算済みの最小幅。
   * @ko 계산된 최소 너비입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set minWidth(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.minWidth[0] = checked;
  }

  /**
   * Writable shared memory: The computed minimum width.
   *
   * @zh 可写共享内存：计算后的最小宽度。
   * @ja 書き込み可能な共有メモリ：計算済みの最小幅。
   * @ko 쓰기 가능한 공유 메모리: 계산된 최소 너비입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get minWidthView(): Float32Array {
    return structMapping(this).views.minWidth as Float32Array;
  }

  /**
   * The computed maximum width.
   *
   * @zh 计算后的最大宽度。
   * @ja 計算済みの最大幅。
   * @ko 계산된 최대 너비입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get maxWidth(): number {
    return structMapping(this).views.maxWidth[0];
  }

  /**
   * The computed maximum width.
   *
   * @zh 计算后的最大宽度。
   * @ja 計算済みの最大幅。
   * @ko 계산된 최대 너비입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set maxWidth(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.maxWidth[0] = checked;
  }

  /**
   * Writable shared memory: The computed maximum width.
   *
   * @zh 可写共享内存：计算后的最大宽度。
   * @ja 書き込み可能な共有メモリ：計算済みの最大幅。
   * @ko 쓰기 가능한 공유 메모리: 계산된 최대 너비입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get maxWidthView(): Float32Array {
    return structMapping(this).views.maxWidth as Float32Array;
  }

  /**
   * The computed minimum height.
   *
   * @zh 计算后的最小高度。
   * @ja 計算済みの最小高さ。
   * @ko 계산된 최소 높이입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get minHeight(): number {
    return structMapping(this).views.minHeight[0];
  }

  /**
   * The computed minimum height.
   *
   * @zh 计算后的最小高度。
   * @ja 計算済みの最小高さ。
   * @ko 계산된 최소 높이입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set minHeight(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.minHeight[0] = checked;
  }

  /**
   * Writable shared memory: The computed minimum height.
   *
   * @zh 可写共享内存：计算后的最小高度。
   * @ja 書き込み可能な共有メモリ：計算済みの最小高さ。
   * @ko 쓰기 가능한 공유 메모리: 계산된 최소 높이입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get minHeightView(): Float32Array {
    return structMapping(this).views.minHeight as Float32Array;
  }

  /**
   * The computed maximum height.
   *
   * @zh 计算后的最大高度。
   * @ja 計算済みの最大高さ。
   * @ko 계산된 최대 높이입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get maxHeight(): number {
    return structMapping(this).views.maxHeight[0];
  }

  /**
   * The computed maximum height.
   *
   * @zh 计算后的最大高度。
   * @ja 計算済みの最大高さ。
   * @ko 계산된 최대 높이입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set maxHeight(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.maxHeight[0] = checked;
  }

  /**
   * Writable shared memory: The computed maximum height.
   *
   * @zh 可写共享内存：计算后的最大高度。
   * @ja 書き込み可能な共有メモリ：計算済みの最大高さ。
   * @ko 쓰기 가능한 공유 메모리: 계산된 최대 높이입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get maxHeightView(): Float32Array {
    return structMapping(this).views.maxHeight as Float32Array;
  }

  /**
   * The computed inline vertical pixel offset.
   *
   * @zh 计算后的行内垂直像素偏移。
   * @ja 計算済みのインラインの垂直オフセット（px）。
   * @ko 계산된 인라인 수직 오프셋（px）입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get verticalAlignLength(): number {
    return structMapping(this).views.verticalAlignLength[0];
  }

  /**
   * The computed inline vertical pixel offset.
   *
   * @zh 计算后的行内垂直像素偏移。
   * @ja 計算済みのインラインの垂直オフセット（px）。
   * @ko 계산된 인라인 수직 오프셋（px）입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set verticalAlignLength(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.verticalAlignLength[0] = checked;
  }

  /**
   * Writable shared memory: The computed inline vertical pixel offset.
   *
   * @zh 可写共享内存：计算后的行内垂直像素偏移。
   * @ja 書き込み可能な共有メモリ：計算済みのインラインの垂直オフセット（px）。
   * @ko 쓰기 가능한 공유 메모리: 계산된 인라인 수직 오프셋（px）입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get verticalAlignLengthView(): Float32Array {
    return structMapping(this).views.verticalAlignLength as Float32Array;
  }

  /**
   * The computed perspective distance in pixels.
   *
   * @zh 计算后的透视距离（像素）。
   * @ja 計算済みの遠近法の距離（px）。
   * @ko 계산된 원근 거리（px）입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get perspective(): number {
    return structMapping(this).views.perspective[0];
  }

  /**
   * The computed perspective distance in pixels.
   *
   * @zh 计算后的透视距离（像素）。
   * @ja 計算済みの遠近法の距離（px）。
   * @ko 계산된 원근 거리（px）입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set perspective(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.perspective[0] = checked;
  }

  /**
   * Writable shared memory: The computed perspective distance in pixels.
   *
   * @zh 可写共享内存：计算后的透视距离（像素）。
   * @ja 書き込み可能な共有メモリ：計算済みの遠近法の距離（px）。
   * @ko 쓰기 가능한 공유 메모리: 계산된 원근 거리（px）입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get perspectiveView(): Float32Array {
    return structMapping(this).views.perspective as Float32Array;
  }

  /**
   * The computed horizontal perspective origin.
   *
   * @zh 计算后的水平透视原点。
   * @ja 計算済みの水平遠近法の原点。
   * @ko 계산된 수평 원근 원점입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get perspectiveOriginX(): number {
    return structMapping(this).views.perspectiveOriginX[0];
  }

  /**
   * The computed horizontal perspective origin.
   *
   * @zh 计算后的水平透视原点。
   * @ja 計算済みの水平遠近法の原点。
   * @ko 계산된 수평 원근 원점입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set perspectiveOriginX(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.perspectiveOriginX[0] = checked;
  }

  /**
   * Writable shared memory: The computed horizontal perspective origin.
   *
   * @zh 可写共享内存：计算后的水平透视原点。
   * @ja 書き込み可能な共有メモリ：計算済みの水平遠近法の原点。
   * @ko 쓰기 가능한 공유 메모리: 계산된 수평 원근 원점입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get perspectiveOriginXView(): Float32Array {
    return structMapping(this).views.perspectiveOriginX as Float32Array;
  }

  /**
   * The computed vertical perspective origin.
   *
   * @zh 计算后的垂直透视原点。
   * @ja 計算済みの垂直遠近法の原点。
   * @ko 계산된 수직 원근 원점입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get perspectiveOriginY(): number {
    return structMapping(this).views.perspectiveOriginY[0];
  }

  /**
   * The computed vertical perspective origin.
   *
   * @zh 计算后的垂直透视原点。
   * @ja 計算済みの垂直遠近法の原点。
   * @ko 계산된 수직 원근 원점입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set perspectiveOriginY(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.perspectiveOriginY[0] = checked;
  }

  /**
   * Writable shared memory: The computed vertical perspective origin.
   *
   * @zh 可写共享内存：计算后的垂直透视原点。
   * @ja 書き込み可能な共有メモリ：計算済みの垂直遠近法の原点。
   * @ko 쓰기 가능한 공유 메모리: 계산된 수직 원근 원점입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get perspectiveOriginYView(): Float32Array {
    return structMapping(this).views.perspectiveOriginY as Float32Array;
  }

  /**
   * The computed horizontal transform origin.
   *
   * @zh 计算后的水平变换原点。
   * @ja 計算済みの水平変換の原点。
   * @ko 계산된 수평 변환 원점입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get transformOriginX(): number {
    return structMapping(this).views.transformOriginX[0];
  }

  /**
   * The computed horizontal transform origin.
   *
   * @zh 计算后的水平变换原点。
   * @ja 計算済みの水平変換の原点。
   * @ko 계산된 수평 변환 원점입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set transformOriginX(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.transformOriginX[0] = checked;
  }

  /**
   * Writable shared memory: The computed horizontal transform origin.
   *
   * @zh 可写共享内存：计算后的水平变换原点。
   * @ja 書き込み可能な共有メモリ：計算済みの水平変換の原点。
   * @ko 쓰기 가능한 공유 메모리: 계산된 수평 변환 원점입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get transformOriginXView(): Float32Array {
    return structMapping(this).views.transformOriginX as Float32Array;
  }

  /**
   * The computed vertical transform origin.
   *
   * @zh 计算后的垂直变换原点。
   * @ja 計算済みの垂直変換の原点。
   * @ko 계산된 수직 변환 원점입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get transformOriginY(): number {
    return structMapping(this).views.transformOriginY[0];
  }

  /**
   * The computed vertical transform origin.
   *
   * @zh 计算后的垂直变换原点。
   * @ja 計算済みの垂直変換の原点。
   * @ko 계산된 수직 변환 원점입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set transformOriginY(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.transformOriginY[0] = checked;
  }

  /**
   * Writable shared memory: The computed vertical transform origin.
   *
   * @zh 可写共享内存：计算后的垂直变换原点。
   * @ja 書き込み可能な共有メモリ：計算済みの垂直変換の原点。
   * @ko 쓰기 가능한 공유 메모리: 계산된 수직 변환 원점입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get transformOriginYView(): Float32Array {
    return structMapping(this).views.transformOriginY as Float32Array;
  }

  /**
   * The computed depth transform origin.
   *
   * @zh 计算后的深度变换原点。
   * @ja 計算済みの奥行き変換の原点。
   * @ko 계산된 깊이 변환 원점입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get transformOriginZ(): number {
    return structMapping(this).views.transformOriginZ[0];
  }

  /**
   * The computed depth transform origin.
   *
   * @zh 计算后的深度变换原点。
   * @ja 計算済みの奥行き変換の原点。
   * @ko 계산된 깊이 변환 원점입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set transformOriginZ(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.transformOriginZ[0] = checked;
  }

  /**
   * Writable shared memory: The computed depth transform origin.
   *
   * @zh 可写共享内存：计算后的深度变换原点。
   * @ja 書き込み可能な共有メモリ：計算済みの奥行き変換の原点。
   * @ko 쓰기 가능한 공유 메모리: 계산된 깊이 변환 원점입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get transformOriginZView(): Float32Array {
    return structMapping(this).views.transformOriginZ as Float32Array;
  }

  /**
   * The computed initial flex size.
   *
   * @zh 计算后的弹性项初始尺寸。
   * @ja 計算済みのフレックス項目の初期サイズ。
   * @ko 계산된 플렉스 항목 초기 크기입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get flexBasis(): number {
    return structMapping(this).views.flexBasis[0];
  }

  /**
   * The computed initial flex size.
   *
   * @zh 计算后的弹性项初始尺寸。
   * @ja 計算済みのフレックス項目の初期サイズ。
   * @ko 계산된 플렉스 항목 초기 크기입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set flexBasis(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.flexBasis[0] = checked;
  }

  /**
   * Writable shared memory: The computed initial flex size.
   *
   * @zh 可写共享内存：计算后的弹性项初始尺寸。
   * @ja 書き込み可能な共有メモリ：計算済みのフレックス項目の初期サイズ。
   * @ko 쓰기 가능한 공유 메모리: 계산된 플렉스 항목 초기 크기입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get flexBasisView(): Float32Array {
    return structMapping(this).views.flexBasis as Float32Array;
  }

  /**
   * The computed gap between rows.
   *
   * @zh 计算后的行间距。
   * @ja 計算済みの行間の間隔。
   * @ko 계산된 행 간격입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get rowGap(): number {
    return structMapping(this).views.rowGap[0];
  }

  /**
   * The computed gap between rows.
   *
   * @zh 计算后的行间距。
   * @ja 計算済みの行間の間隔。
   * @ko 계산된 행 간격입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set rowGap(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.rowGap[0] = checked;
  }

  /**
   * Writable shared memory: The computed gap between rows.
   *
   * @zh 可写共享内存：计算后的行间距。
   * @ja 書き込み可能な共有メモリ：計算済みの行間の間隔。
   * @ko 쓰기 가능한 공유 메모리: 계산된 행 간격입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get rowGapView(): Float32Array {
    return structMapping(this).views.rowGap as Float32Array;
  }

  /**
   * The computed gap between columns.
   *
   * @zh 计算后的列间距。
   * @ja 計算済みの列間の間隔。
   * @ko 계산된 열 간격입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get columnGap(): number {
    return structMapping(this).views.columnGap[0];
  }

  /**
   * The computed gap between columns.
   *
   * @zh 计算后的列间距。
   * @ja 計算済みの列間の間隔。
   * @ko 계산된 열 간격입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set columnGap(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.columnGap[0] = checked;
  }

  /**
   * Writable shared memory: The computed gap between columns.
   *
   * @zh 可写共享内存：计算后的列间距。
   * @ja 書き込み可能な共有メモリ：計算済みの列間の間隔。
   * @ko 쓰기 가능한 공유 메모리: 계산된 열 간격입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get columnGapView(): Float32Array {
    return structMapping(this).views.columnGap as Float32Array;
  }

  /**
   * The computed top left corner radius in pixels.
   *
   * @zh 计算后的左上圆角半径（像素）。
   * @ja 計算済みの左上角の半径（px）。
   * @ko 계산된 위 왼쪽 모서리 반지름（px）입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get borderTopLeftRadius(): number {
    return structMapping(this).views.borderTopLeftRadius[0];
  }

  /**
   * The computed top left corner radius in pixels.
   *
   * @zh 计算后的左上圆角半径（像素）。
   * @ja 計算済みの左上角の半径（px）。
   * @ko 계산된 위 왼쪽 모서리 반지름（px）입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set borderTopLeftRadius(value: number) {
    const checked = checkedStructInteger(value, -32768, 32767);
    structMapping(this).views.borderTopLeftRadius[0] = checked;
  }

  /**
   * Writable shared memory: The computed top left corner radius in pixels.
   *
   * @zh 可写共享内存：计算后的左上圆角半径（像素）。
   * @ja 書き込み可能な共有メモリ：計算済みの左上角の半径（px）。
   * @ko 쓰기 가능한 공유 메모리: 계산된 위 왼쪽 모서리 반지름（px）입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get borderTopLeftRadiusView(): Int16Array {
    return structMapping(this).views.borderTopLeftRadius as Int16Array;
  }

  /**
   * The computed top right corner radius in pixels.
   *
   * @zh 计算后的右上圆角半径（像素）。
   * @ja 計算済みの右上角の半径（px）。
   * @ko 계산된 위 오른쪽 모서리 반지름（px）입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get borderTopRightRadius(): number {
    return structMapping(this).views.borderTopRightRadius[0];
  }

  /**
   * The computed top right corner radius in pixels.
   *
   * @zh 计算后的右上圆角半径（像素）。
   * @ja 計算済みの右上角の半径（px）。
   * @ko 계산된 위 오른쪽 모서리 반지름（px）입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set borderTopRightRadius(value: number) {
    const checked = checkedStructInteger(value, -32768, 32767);
    structMapping(this).views.borderTopRightRadius[0] = checked;
  }

  /**
   * Writable shared memory: The computed top right corner radius in pixels.
   *
   * @zh 可写共享内存：计算后的右上圆角半径（像素）。
   * @ja 書き込み可能な共有メモリ：計算済みの右上角の半径（px）。
   * @ko 쓰기 가능한 공유 메모리: 계산된 위 오른쪽 모서리 반지름（px）입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get borderTopRightRadiusView(): Int16Array {
    return structMapping(this).views.borderTopRightRadius as Int16Array;
  }

  /**
   * The computed bottom right corner radius in pixels.
   *
   * @zh 计算后的右下圆角半径（像素）。
   * @ja 計算済みの右下角の半径（px）。
   * @ko 계산된 아래 오른쪽 모서리 반지름（px）입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get borderBottomRightRadius(): number {
    return structMapping(this).views.borderBottomRightRadius[0];
  }

  /**
   * The computed bottom right corner radius in pixels.
   *
   * @zh 计算后的右下圆角半径（像素）。
   * @ja 計算済みの右下角の半径（px）。
   * @ko 계산된 아래 오른쪽 모서리 반지름（px）입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set borderBottomRightRadius(value: number) {
    const checked = checkedStructInteger(value, -32768, 32767);
    structMapping(this).views.borderBottomRightRadius[0] = checked;
  }

  /**
   * Writable shared memory: The computed bottom right corner radius in pixels.
   *
   * @zh 可写共享内存：计算后的右下圆角半径（像素）。
   * @ja 書き込み可能な共有メモリ：計算済みの右下角の半径（px）。
   * @ko 쓰기 가능한 공유 메모리: 계산된 아래 오른쪽 모서리 반지름（px）입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get borderBottomRightRadiusView(): Int16Array {
    return structMapping(this).views.borderBottomRightRadius as Int16Array;
  }

  /**
   * The computed bottom left corner radius in pixels.
   *
   * @zh 计算后的左下圆角半径（像素）。
   * @ja 計算済みの左下角の半径（px）。
   * @ko 계산된 아래 왼쪽 모서리 반지름（px）입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get borderBottomLeftRadius(): number {
    return structMapping(this).views.borderBottomLeftRadius[0];
  }

  /**
   * The computed bottom left corner radius in pixels.
   *
   * @zh 计算后的左下圆角半径（像素）。
   * @ja 計算済みの左下角の半径（px）。
   * @ko 계산된 아래 왼쪽 모서리 반지름（px）입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set borderBottomLeftRadius(value: number) {
    const checked = checkedStructInteger(value, -32768, 32767);
    structMapping(this).views.borderBottomLeftRadius[0] = checked;
  }

  /**
   * Writable shared memory: The computed bottom left corner radius in pixels.
   *
   * @zh 可写共享内存：计算后的左下圆角半径（像素）。
   * @ja 書き込み可能な共有メモリ：計算済みの左下角の半径（px）。
   * @ko 쓰기 가능한 공유 메모리: 계산된 아래 왼쪽 모서리 반지름（px）입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get borderBottomLeftRadiusView(): Int16Array {
    return structMapping(this).views.borderBottomLeftRadius as Int16Array;
  }

  /**
   * The computed image RGBA tint.
   *
   * @zh 计算后的图像 RGBA 染色。
   * @ja 計算済みの画像の RGBA 色乗算。
   * @ko 계산된 이미지 RGBA 색상 곱셈입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get imageColor(): VariantByteColour {
    return structColour(structMapping(this).views.imageColor);
  }

  /**
   * The computed image RGBA tint.
   *
   * @zh 计算后的图像 RGBA 染色。
   * @ja 計算済みの画像の RGBA 色乗算。
   * @ko 계산된 이미지 RGBA 색상 곱셈입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set imageColor(value: VariantByteColour) {
    const components = checkedStructColour(value);
    structMapping(this).views.imageColor.set(components);
  }

  /**
   * Writable shared memory: The computed image RGBA tint.
   *
   * @zh 可写共享内存：计算后的图像 RGBA 染色。
   * @ja 書き込み可能な共有メモリ：計算済みの画像の RGBA 色乗算。
   * @ko 쓰기 가능한 공유 메모리: 계산된 이미지 RGBA 색상 곱셈입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get imageColorView(): Uint8Array {
    return structMapping(this).views.imageColor as Uint8Array;
  }

  /**
   * The computed scrollbar margin in pixels.
   *
   * @zh 计算后的滚动条像素边距。
   * @ja 計算済みのスクロールバーの余白（px）。
   * @ko 계산된 스크롤바 여백（px）입니다.
   * @returns Current native field value.
   * @zh 当前原生字段值。
   * @ja 現在のネイティブフィールド値。
   * @ko 현재 네이티브 필드 값입니다.
   */
  get scrollbarMargin(): number {
    return structMapping(this).views.scrollbarMargin[0];
  }

  /**
   * The computed scrollbar margin in pixels.
   *
   * @zh 计算后的滚动条像素边距。
   * @ja 計算済みのスクロールバーの余白（px）。
   * @ko 계산된 스크롤바 여백（px）입니다.
   * @param value - Checked native field value.
   * @zh value - 经检查的原生字段值。
   * @ja value - 検証されたネイティブフィールド値。
   * @ko value - 검증된 네이티브 필드 값입니다.
   */
  set scrollbarMargin(value: number) {
    const checked = checkedStyleFloat(value);
    structMapping(this).views.scrollbarMargin[0] = checked;
  }

  /**
   * Writable shared memory: The computed scrollbar margin in pixels.
   *
   * @zh 可写共享内存：计算后的滚动条像素边距。
   * @ja 書き込み可能な共有メモリ：計算済みのスクロールバーの余白（px）。
   * @ko 쓰기 가능한 공유 메모리: 계산된 스크롤바 여백（px）입니다.
   * @returns Writable native memory; views bypass setter validation.
   * @zh 原生可写内存；直接写视图不执行 setter 校验。
   * @ja 書き込み可能なネイティブメモリ。ビューは setter 検証を通りません。
   * @ko 쓰기 가능한 네이티브 메모리이며 setter 검증을 거치지 않습니다.
   */
  get scrollbarMarginView(): Float32Array {
    return structMapping(this).views.scrollbarMargin as Float32Array;
  }

}
