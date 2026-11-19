/* eslint-disable no-bitwise -- RmlUi units are a native bitmask API. */
/**
 * Rml::Unit flags. Combine and intersect sets with JavaScript | and &.
 *
 * @zh Rml::Unit 标志；使用 JavaScript 的 | 和 & 合并及求交集。
 * @ja Rml::Unit フラグ。JavaScript の | と & で集合の和・積を求めます。
 * @ko Rml::Unit 플래그이며 JavaScript의 | 및 &로 합집합과 교집합을 구합니다.
 */
export enum Unit {
  /**
   * No unit.
   *
   * @zh 无单位。
   * @ja 単位なし。
   * @ko 단위 없음입니다.
   */
  UNKNOWN = 0,
  /**
   * Integer keyword.
   *
   * @zh 整数关键词。
   * @ja 整数のキーワード。
   * @ko 정수 키워드입니다.
   */
  KEYWORD = 1 << 0,
  /**
   * String.
   *
   * @zh 字符串。
   * @ja 文字列。
   * @ko 문자열입니다.
   */
  STRING = 1 << 1,
  /**
   * Byte colour.
   *
   * @zh 字节颜色。
   * @ja バイトカラー。
   * @ko 바이트 색상입니다.
   */
  COLOUR = 1 << 2,
  /**
   * Ratio as a two-component vector.
   *
   * @zh 二维向量表示的比例。
   * @ja 2 成分のベクトルで表す比率。
   * @ko 2차원 벡터로 표현하는 비율입니다.
   */
  RATIO = 1 << 3,
  /**
   * Number without a suffix.
   *
   * @zh 无后缀数值。
   * @ja 接尾辞のない数値。
   * @ko 접미사 없는 수치입니다.
   */
  NUMBER = 1 << 4,
  /**
   * Percentage.
   *
   * @zh 百分比。
   * @ja パーセント。
   * @ko 백분율입니다.
   */
  PERCENT = 1 << 5,
  /**
   * Pixels.
   *
   * @zh 像素。
   * @ja ピクセル。
   * @ko 픽셀입니다.
   */
  PX = 1 << 6,
  /**
   * Density-independent pixels.
   *
   * @zh 密度无关像素。
   * @ja 密度非依存ピクセル。
   * @ko 밀도 독립 픽셀입니다.
   */
  DP = 1 << 7,
  /**
   * Percentage of viewport width.
   *
   * @zh 视口宽度百分比。
   * @ja ビューポート幅のパーセント。
   * @ko 뷰포트 너비의 백분율입니다.
   */
  VW = 1 << 8,
  /**
   * Percentage of viewport height.
   *
   * @zh 视口高度百分比。
   * @ja ビューポート高さのパーセント。
   * @ko 뷰포트 높이의 백분율입니다.
   */
  VH = 1 << 9,
  /**
   * Dots per pixel.
   *
   * @zh 每像素点数。
   * @ja ピクセルあたりのドット数。
   * @ko 픽셀당 도트 수입니다.
   */
  X = 1 << 10,
  /**
   * Element font-size multiplier.
   *
   * @zh 元素字号倍数。
   * @ja 要素のフォントサイズの倍率。
   * @ko 요소 글꼴 크기의 배수입니다.
   */
  EM = 1 << 11,
  /**
   * Document font-size multiplier.
   *
   * @zh 文档字号倍数。
   * @ja ドキュメントのフォントサイズの倍率。
   * @ko 문서 글꼴 크기의 배수입니다.
   */
  REM = 1 << 12,
  /**
   * Inches.
   *
   * @zh 英寸。
   * @ja インチ。
   * @ko 인치입니다.
   */
  INCH = 1 << 13,
  /**
   * Centimetres.
   *
   * @zh 厘米。
   * @ja センチメートル。
   * @ko 센티미터입니다.
   */
  CM = 1 << 14,
  /**
   * Millimetres.
   *
   * @zh 毫米。
   * @ja ミリメートル。
   * @ko 밀리미터입니다.
   */
  MM = 1 << 15,
  /**
   * Points (1/72 inch).
   *
   * @zh 磅（1/72 英寸）。
   * @ja ポイント（1/72 インチ）。
   * @ko 포인트(1/72 인치)입니다.
   */
  PT = 1 << 16,
  /**
   * Picas (1/6 inch).
   *
   * @zh 派卡（1/6 英寸）。
   * @ja パイカ（1/6 インチ）。
   * @ko 파이카(1/6 인치)입니다.
   */
  PC = 1 << 17,
  /**
   * All inch-based units.
   *
   * @zh 所有基于英寸的单位。
   * @ja インチに基づく全単位。
   * @ko 인치 기반 단위 집합입니다.
   */
  PPI_UNIT = INCH | CM | MM | PT | PC,
  /**
   * Degrees.
   *
   * @zh 度。
   * @ja 度。
   * @ko 도입니다.
   */
  DEG = 1 << 18,
  /**
   * Radians.
   *
   * @zh 弧度。
   * @ja ラジアン。
   * @ko 라디안입니다.
   */
  RAD = 1 << 19,
  /**
   * Transform.
   *
   * @zh 变换。
   * @ja 変換。
   * @ko 변환입니다.
   */
  TRANSFORM = 1 << 20,
  /**
   * Transition list.
   *
   * @zh 过渡列表。
   * @ja トランジション一覧。
   * @ko 전환 목록입니다.
   */
  TRANSITION = 1 << 21,
  /**
   * Animation list.
   *
   * @zh 动画列表。
   * @ja アニメーション一覧。
   * @ko 애니메이션 목록입니다.
   */
  ANIMATION = 1 << 22,
  /**
   * Decorator list.
   *
   * @zh 装饰器列表。
   * @ja デコレーター一覧。
   * @ko 데코레이터 목록입니다.
   */
  DECORATOR = 1 << 23,
  /**
   * Filter list.
   *
   * @zh 滤镜列表。
   * @ja フィルター一覧。
   * @ko 필터 목록입니다.
   */
  FILTER = 1 << 24,
  /**
   * Font-effect list.
   *
   * @zh 字体特效列表。
   * @ja フォント効果一覧。
   * @ko 글꼴 효과 목록입니다.
   */
  FONTEFFECT = 1 << 25,
  /**
   * Colour-stop list.
   *
   * @zh 颜色停靠点列表。
   * @ja カラーストップ一覧。
   * @ko 색상 정지점 목록입니다.
   */
  COLORSTOPLIST = 1 << 26,
  /**
   * Box-shadow list.
   *
   * @zh 盒阴影列表。
   * @ja ボックスシャドウ一覧。
   * @ko 상자 그림자 목록입니다.
   */
  BOXSHADOWLIST = 1 << 27,
  /**
   * Custom-property expression resolved at compute time.
   *
   * @zh 计算时解析的自定义属性表达式。
   * @ja 計算時に解決するカスタムプロパティ式。
   * @ko 계산 시 해석하는 사용자 정의 속성 표현식입니다.
   */
  VAR_EXPRESSION = 1 << 28,
  /**
   * Empty placeholder for an unresolved shorthand.
   *
   * @zh 未解析简写的空占位值。
   * @ja 未解決の省略形に対する空のプレースホルダー。
   * @ko 미해결 축약형의 빈 자리 표시자입니다.
   */
  SHORTHAND_PLACEHOLDER = 1 << 29,
  /**
   * All length units.
   *
   * @zh 所有长度单位。
   * @ja 全長さ単位。
   * @ko 모든 길이 단위입니다.
   */
  LENGTH = PX | DP | VW | VH | EM | REM | PPI_UNIT,
  /**
   * Length or percentage.
   *
   * @zh 长度或百分比。
   * @ja 長さまたはパーセント。
   * @ko 길이 또는 백분율입니다.
   */
  LENGTH_PERCENT = LENGTH | PERCENT,
  /**
   * Number or percentage.
   *
   * @zh 数值或百分比。
   * @ja 数値またはパーセント。
   * @ko 수치 또는 백분율입니다.
   */
  NUMBER_PERCENT = NUMBER | PERCENT,
  /**
   * Number, length or percentage.
   *
   * @zh 数值、长度或百分比。
   * @ja 数値・長さ・パーセント。
   * @ko 수치, 길이 또는 백분율입니다.
   */
  NUMBER_LENGTH_PERCENT = NUMBER | LENGTH | PERCENT,
  /**
   * Length units affected by the context density ratio.
   *
   * @zh 受上下文密度比影响的长度单位。
   * @ja コンテキストの密度比が適用される長さ単位。
   * @ko 컨텍스트 밀도 비율의 영향을 받는 길이 단위입니다.
   */
  DP_SCALABLE_LENGTH = DP | PPI_UNIT,
  /**
   * Degrees or radians.
   *
   * @zh 度或弧度。
   * @ja 度またはラジアン。
   * @ko 도 또는 라디안입니다.
   */
  ANGLE = DEG | RAD,
  /**
   * All numeric units.
   *
   * @zh 所有数值单位。
   * @ja 全数値単位。
   * @ko 모든 수치 단위입니다.
   */
  NUMERIC = NUMBER_LENGTH_PERCENT | ANGLE | X,
}

/**
 * Rml::Units: a set of Unit flags.
 *
 * @zh Rml::Units：Unit 标志集合。
 * @ja Rml::Units。Unit フラグの集合。
 * @ko Rml::Units이며 Unit 플래그 집합입니다.
 */
export type Units = Unit;

/**
 * Validate a unit bitset before writing a mapped native enum.
 *
 * @internal
 * @param unit - Candidate unit bits.
 * @returns Validated unit.
 */
export function checkedUnit(unit: Unit): Unit {
  if (!Number.isInteger(unit) || unit < 0 ||
      unit > (Unit.SHORTHAND_PLACEHOLDER * 2) - 1) {
    throw new RangeError('Expected RmlUi unit bits from Unit');
  }
  return unit;
}

/**
 * Rml::Any: check whether a unit set contains any flag.
 *
 * @zh Rml::Any：检查单位集合中是否存在标志。
 * @ja Rml::Any。単位集合にフラグがあるかを調べます。
 * @ko Rml::Any이며 단위 집합에 플래그가 있는지 확인합니다.
 * @param units - Unit bits, often an intersection such as unit & Unit.LENGTH.
 * @zh units - 单位标志，通常为 unit & Unit.LENGTH 等交集。
 * @ja units - unit & Unit.LENGTH などの積集合を表すフラグ。
 * @ko units - 보통 unit & Unit.LENGTH 같은 교집합 플래그입니다.
 * @returns Whether at least one valid unit bit is set.
 * @zh 是否设置了至少一个有效单位标志。
 * @ja 有効な単位フラグが 1 つ以上あるか。
 * @ko 유효한 단위 플래그가 하나 이상 설정되었는지 여부입니다.
 */
export function anyUnit(units: Units): boolean {
  return checkedUnit(units) !== Unit.UNKNOWN;
}
