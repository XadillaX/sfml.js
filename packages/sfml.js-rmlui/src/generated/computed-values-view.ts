// Generated from RmlUi 6.3: generate-computed-values.cjs.
import type * as Style from '../style/values/style-values';
import type { FontFaceHandle } from '../internal/computed';
import type { VariantByteColour } from '../values/types';
import type { CornerSizes } from '../rendering/render-box';
import type {
  AnimationList, TransitionList,
} from '../animation/animation-values';
import type { TransformSnapshot } from '../style/values/transform';

/**
 * Read-only live view of an element’s computed style.
 *
 * @zh 元素计算样式的实时只读视图。
 * @ja 要素の計算済みスタイルの読み取り専用ライブビュー。
 * @ko 요소의 계산된 스타일에 대한 실시간 읽기 전용 뷰입니다.
 * @remarks
 * Refresh layout with Context.update before reading. Structured getters
 * return independent copies. Access rejects after the element is destroyed
 * or the runtime shuts down.
 * @zh 查询前使用 Context.update 更新布局。结构化 getter 返回独立副本。
 * 元素销毁或运行时关闭后，访问失效。
 * @ja 取得前に Context.update でレイアウトを更新してください。構造値はコピーです。
 * 要素の破棄またはランタイムの終了後はアクセスできません。
 * @ko 읽기 전에 Context.update로 레이아웃을 갱신하세요. 구조 값은 독립 복사본입니다.
 * 요소 파괴 또는 런타임 종료 후에는 접근할 수 없습니다.
 */
export interface ComputedValuesView {
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
  readonly width: Style.LengthPercentageAuto;

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
  readonly height: Style.LengthPercentageAuto;

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
  readonly marginTop: Style.LengthPercentageAuto;

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
  readonly marginRight: Style.LengthPercentageAuto;

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
  readonly marginBottom: Style.LengthPercentageAuto;

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
  readonly marginLeft: Style.LengthPercentageAuto;

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
  readonly paddingTop: Style.LengthPercentage;

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
  readonly paddingRight: Style.LengthPercentage;

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
  readonly paddingBottom: Style.LengthPercentage;

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
  readonly paddingLeft: Style.LengthPercentage;

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
  readonly top: Style.LengthPercentageAuto;

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
  readonly right: Style.LengthPercentageAuto;

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
  readonly bottom: Style.LengthPercentageAuto;

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
  readonly left: Style.LengthPercentageAuto;

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
  readonly zIndex: Style.NumberAuto;

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
  readonly borderTopWidth: number;

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
  readonly borderRightWidth: number;

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
  readonly borderBottomWidth: number;

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
  readonly borderLeftWidth: number;

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
  readonly boxSizing: Style.BoxSizing;

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
  readonly display: Style.Display;

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
  readonly position: Style.Position;

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
  readonly float: Style.Float;

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
  readonly clear: Style.Clear;

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
  readonly overflowX: Style.Overflow;

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
  readonly overflowY: Style.Overflow;

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
  readonly visibility: Style.Visibility;

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
  readonly backgroundColor: VariantByteColour;

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
  readonly borderTopColor: VariantByteColour;

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
  readonly borderRightColor: VariantByteColour;

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
  readonly borderBottomColor: VariantByteColour;

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
  readonly borderLeftColor: VariantByteColour;

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
  readonly hasDecorator: boolean;

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
  readonly fontFamily: string;

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
  readonly cursor: string;

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
  readonly fontFaceHandle: FontFaceHandle | null;

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
  readonly fontSize: number;

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
  readonly letterSpacing: number;

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
  readonly hasFontEffect: boolean;

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
  readonly fontStyle: Style.FontStyle;

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
  readonly fontWeight: number;

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
  readonly fontKerning: Style.FontKerning;

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
  readonly pointerEvents: Style.PointerEvents;

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
  readonly focus: Style.Focus;

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
  readonly textAlign: Style.TextAlign;

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
  readonly textDecoration: Style.TextDecoration;

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
  readonly textTransform: Style.TextTransform;

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
  readonly whiteSpace: Style.WhiteSpace;

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
  readonly wordBreak: Style.WordBreak;

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
  readonly color: VariantByteColour;

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
  readonly opacity: number;

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
  readonly lineHeight: Style.LineHeight;

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
  readonly language: string;

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
  readonly direction: Style.Direction;

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
  readonly minWidth: Style.MinWidth;

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
  readonly maxWidth: Style.MaxWidth;

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
  readonly minHeight: Style.MinHeight;

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
  readonly maxHeight: Style.MaxHeight;

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
  readonly verticalAlign: Style.VerticalAlign;

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
  readonly animation: AnimationList | null;

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
  readonly transition: TransitionList | null;

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
  readonly perspective: number;

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
  readonly perspectiveOriginX: Style.PerspectiveOrigin;

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
  readonly perspectiveOriginY: Style.PerspectiveOrigin;

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
  readonly transform: TransformSnapshot | null;

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
  readonly transformOriginX: Style.TransformOrigin;

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
  readonly transformOriginY: Style.TransformOrigin;

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
  readonly transformOriginZ: number;

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
  readonly hasLocalTransform: boolean;

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
  readonly hasLocalPerspective: boolean;

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
  readonly alignContent: Style.AlignContent;

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
  readonly alignItems: Style.AlignItems;

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
  readonly alignSelf: Style.AlignSelf;

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
  readonly flexDirection: Style.FlexDirection;

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
  readonly flexWrap: Style.FlexWrap;

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
  readonly justifyContent: Style.JustifyContent;

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
  readonly flexGrow: number;

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
  readonly flexShrink: number;

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
  readonly flexBasis: Style.FlexBasis;

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
  readonly borderTopLeftRadius: number;

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
  readonly borderTopRightRadius: number;

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
  readonly borderBottomRightRadius: number;

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
  readonly borderBottomLeftRadius: number;

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
  readonly borderRadius: CornerSizes;

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
  readonly textOverflow: Style.TextOverflow;

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
  readonly textOverflowString: string;

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
  readonly clip: Style.Clip;

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
  readonly drag: Style.Drag;

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
  readonly tabIndex: Style.TabIndex;

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
  readonly imageColor: VariantByteColour;

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
  readonly rowGap: Style.LengthPercentage;

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
  readonly columnGap: Style.LengthPercentage;

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
  readonly overscrollBehavior: Style.OverscrollBehavior;

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
  readonly scrollbarMargin: number;

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
  readonly hasMaskImage: boolean;

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
  readonly hasFilter: boolean;

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
  readonly hasBackdropFilter: boolean;

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
  readonly hasBoxShadow: boolean;

}
