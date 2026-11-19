import { native } from '../internal/native';
import {
  motionFromNative, motionToNative, variantFromNative, variantToNative,
} from '../internal/animation-values';
import type { PropertyId } from '../generated/property-ids';
import type { Tween } from './tween';

/**
 * Rml::Animation value; fields and Tween are copied at each native boundary.
 *
 * @zh Rml::Animation 值；字段及 Tween 在原生边界按值复制。
 * @ja Rml::Animation 値。ネイティブ境界でフィールドと Tween をコピーします。
 * @ko Rml::Animation 값이며 네이티브 경계마다 필드와 Tween을 복사합니다.
 */
export interface Animation {
  /**
   * Duration in seconds, default 0.
   *
   * @zh 时长（秒），默认 0。
   * @ja 秒単位の時間。既定値は 0。
   * @ko 초 단위 시간이며 기본값은 0입니다.
   */
  duration: number;

  /**
   * Easing, default Linear/Out.
   *
   * @zh 缓动，默认 Linear/Out。
   * @ja イージング。既定値は Linear/Out。
   * @ko 이징이며 기본값은 Linear/Out입니다.
   */
  tween: Tween;

  /**
   * Delay in seconds, default 0.
   *
   * @zh 延迟（秒），默认 0。
   * @ja 秒単位の遅延。既定値は 0。
   * @ko 초 단위 지연이며 기본값은 0입니다.
   */
  delay: number;

  /**
   * Alternate direction, default false.
   *
   * @zh 交替方向，默认 false。
   * @ja 方向の交互切り替え。既定値は false。
   * @ko 방향 교대이며 기본값은 false입니다.
   */
  alternate: boolean;

  /**
   * Paused state, default false.
   *
   * @zh 暂停状态，默认 false。
   * @ja 一時停止状態。既定値は false。
   * @ko 일시 정지 상태이며 기본값은 false입니다.
   */
  paused: boolean;

  /**
   * Native iteration count, default 1; -1 means infinite.
   *
   * @zh 原生循环次数，默认 1；-1 表示无限循环。
   * @ja 繰り返し回数。既定値は 1。-1 は無限。
   * @ko 반복 횟수이며 기본값은 1, -1은 무한입니다.
   */
  numIterations: number;

  /**
   * Keyframes name, default empty.
   *
   * @zh 关键帧名称，默认为空。
   * @ja キーフレーム名。既定値は空。
   * @ko 키프레임 이름이며 기본값은 빈 문자열입니다.
   */
  name: string;
}

/**
 * Property transition settings: target property, duration, delay and easing.
 *
 * @zh 属性过渡设置：目标属性、时长、延迟和缓动。
 * @ja プロパティ遷移の設定：対象・時間・遅延・イージング。
 * @ko 속성 전환 설정: 대상 속성·시간·지연·이징입니다.
 */
export interface Transition {
  /**
   * Property identifier, default Invalid.
   *
   * @zh 属性编号，默认 Invalid。
   * @ja プロパティ ID。既定値は Invalid。
   * @ko 속성 식별자이며 기본값은 Invalid입니다.
   */
  id: PropertyId;

  /**
   * Easing, default Linear/Out.
   *
   * @zh 缓动，默认 Linear/Out。
   * @ja イージング。既定値は Linear/Out。
   * @ko 이징이며 기본값은 Linear/Out입니다.
   */
  tween: Tween;

  /**
   * Duration in seconds, default 0.
   *
   * @zh 时长（秒），默认 0。
   * @ja 秒単位の時間。既定値は 0。
   * @ko 초 단위 시간이며 기본값은 0입니다.
   */
  duration: number;

  /**
   * Delay in seconds, default 0.
   *
   * @zh 延迟（秒），默认 0。
   * @ja 秒単位の遅延。既定値は 0。
   * @ko 초 단위 지연이며 기본값은 0입니다.
   */
  delay: number;

  /**
   * Native reversal adjustment, default 0.
   *
   * @zh 原生反向调整系数，默认 0。
   * @ja 反転調整係数。既定値は 0。
   * @ko 반전 조정 계수이며 기본값은 0입니다.
   */
  reverseAdjustmentFactor: number;
}

/**
 * Tagged Rml::TransitionList, preserving none/all independently of entries.
 *
 * @zh 带标记的 Rml::TransitionList；none/all 与条目分别保留。
 * @ja none/all を項目と独立して保持する Rml::TransitionList。
 * @ko none/all을 항목과 독립적으로 보존하는 Rml::TransitionList입니다.
 */
export interface TransitionList {
  /**
   * Variant tag.
   *
   * @zh Variant 标记。
   * @ja Variant タグ。
   * @ko Variant 태그입니다.
   */
  type: 'transitionlist';

  /**
   * Disable transitions, default true.
   *
   * @zh 禁用过渡，默认 true。
   * @ja 遷移の無効化。既定値は true。
   * @ko 전환 비활성화이며 기본값은 true입니다.
   */
  none: boolean;

  /**
   * Apply to all eligible properties, default false.
   *
   * @zh 应用于所有可过渡属性，默认 false。
   * @ja 対象となる全プロパティに適用。既定値は false。
   * @ko 가능한 모든 속성에 적용하며 기본값은 false입니다.
   */
  all: boolean;

  /**
   * Copied transitions, default empty.
   *
   * @zh 过渡副本列表，默认为空。
   * @ja 遷移コピーの一覧。既定値は空。
   * @ko 전환 복사본 목록이며 기본값은 비어 있습니다.
   */
  transitions: Transition[];
}

/**
 * Tagged Rml::AnimationList.
 *
 * @zh 带标记的 Rml::AnimationList。
 * @ja タグ付き Rml::AnimationList。
 * @ko 태그가 있는 Rml::AnimationList입니다.
 */
export interface AnimationList {
  /**
   * Variant tag.
   *
   * @zh Variant 标记。
   * @ja Variant タグ。
   * @ko Variant 태그입니다.
   */
  type: 'animationlist';

  /**
   * Copied animation records.
   *
   * @zh 动画值副本。
   * @ja アニメーション値のコピー。
   * @ko 애니메이션 값 복사본입니다.
   */
  animations: Animation[];
}

/**
 * Construct Rml::Animation with native defaults and float32 fields.
 *
 * @zh 按原生默认值及 float32 字段构造 Rml::Animation。
 * @ja ネイティブ既定値と float32 フィールドで Rml::Animation を構築。
 * @ko 네이티브 기본값과 float32 필드로 Rml::Animation을 생성합니다.
 * @param fields - Optional field overrides.
 * @zh fields - 可选字段。
 * @ja fields - 任意の上書きフィールド。
 * @ko fields - 선택적 필드 재정의입니다.
 * @returns Copied native value.
 * @zh 原生值副本。
 * @ja ネイティブ値のコピー。
 * @ko 네이티브 값 복사본입니다.
 */
export function makeAnimation(fields: Partial<Animation> = {}): Animation {
  return motionFromNative(native.makeAnimation(motionToNative(fields)));
}

/**
 * Construct Rml::Transition with native defaults and float32 fields.
 *
 * @zh 按原生默认值及 float32 字段构造 Rml::Transition。
 * @ja ネイティブ既定値と float32 フィールドで Rml::Transition を構築。
 * @ko 네이티브 기본값과 float32 필드로 Rml::Transition을 생성합니다.
 * @param fields - Optional field overrides.
 * @zh fields - 可选字段。
 * @ja fields - 任意の上書きフィールド。
 * @ko fields - 선택적 필드 재정의입니다.
 * @returns Copied native value.
 * @zh 原生值副本。
 * @ja ネイティブ値のコピー。
 * @ko 네이티브 값 복사본입니다.
 */
export function makeTransition(fields: Partial<Transition> = {}): Transition {
  return motionFromNative(native.makeTransition(motionToNative(fields)));
}

/**
 * Construct Rml::TransitionList; none=true, all=false, entries=[] by default.
 *
 * @zh 构造 Rml::TransitionList，默认 none=true、all=false、条目为空。
 * @ja Rml::TransitionList を構築。既定は none=true、all=false、空の項目。
 * @ko Rml::TransitionList를 생성하며 기본값은 none=true, all=false, 빈 항목입니다.
 * @param fields - Optional fields; entries do not implicitly change none/all.
 * @zh fields - 可选字段；条目不会隐式修改 none/all。
 * @ja fields - 任意のフィールド。項目は none/all を暗黙に変更しません。
 * @ko fields - 선택적 필드이며 항목은 none/all을 암묵적으로 변경하지 않습니다.
 * @returns Independent list and Tween copies.
 * @zh 独立列表和 Tween 副本。
 * @ja 独立した一覧と Tween コピー。
 * @ko 독립 목록과 Tween 복사본입니다.
 */
export function makeTransitionList(
  fields: Partial<Omit<TransitionList, 'type'>> = {},
): TransitionList {
  return variantFromNative(native.makeTransitionList(variantToNative({
    ...fields, type: 'transitionlist',
  }))) as TransitionList;
}

/**
 * Native Animation equality; negation represents operator!=.
 *
 * @zh 原生 Animation 相等比较；取反对应 operator!=。
 * @ja ネイティブ Animation 等価比較。否定は operator!=。
 * @ko 네이티브 Animation 동등 비교이며 부정은 operator!=입니다.
 * @param a - First value.
 * @zh a - 第一个值。
 * @ja a - 最初の値。
 * @ko a - 첫 번째 값입니다.
 * @param b - Second value.
 * @zh b - 第二个值。
 * @ja b - 2 番目の値。
 * @ko b - 두 번째 값입니다.
 * @returns Equality of every field and Tween callback identity.
 * @zh 所有字段及 Tween 回调身份是否相等。
 * @ja 全フィールドと Tween コールバック同一性の比較結果。
 * @ko 모든 필드와 Tween 콜백 동일성의 비교 결과입니다.
 */
export function animationEquals(a: Animation, b: Animation): boolean {
  return native.animationEquals(motionToNative(a), motionToNative(b));
}

/**
 * Native Transition equality; negation represents operator!=.
 *
 * @zh 原生 Transition 相等比较；取反对应 operator!=。
 * @ja ネイティブ Transition 等価比較。否定は operator!=。
 * @ko 네이티브 Transition 동등 비교이며 부정은 operator!=입니다.
 * @param a - First value.
 * @zh a - 第一个值。
 * @ja a - 最初の値。
 * @ko a - 첫 번째 값입니다.
 * @param b - Second value.
 * @zh b - 第二个值。
 * @ja b - 2 番目の値。
 * @ko b - 두 번째 값입니다.
 * @returns Equality of every field and Tween callback identity.
 * @zh 所有字段及 Tween 回调身份是否相等。
 * @ja 全フィールドと Tween コールバック同一性の比較結果。
 * @ko 모든 필드와 Tween 콜백 동일성의 비교 결과입니다.
 */
export function transitionEquals(a: Transition, b: Transition): boolean {
  return native.transitionEquals(motionToNative(a), motionToNative(b));
}

/**
 * Native TransitionList equality; negation represents operator!=.
 *
 * @zh 原生 TransitionList 相等比较；取反对应 operator!=。
 * @ja ネイティブ TransitionList 等価比較。否定は operator!=。
 * @ko 네이티브 TransitionList 동등 비교이며 부정은 operator!=입니다.
 * @param a - First list.
 * @zh a - 第一个列表。
 * @ja a - 最初の一覧。
 * @ko a - 첫 번째 목록입니다.
 * @param b - Second list.
 * @zh b - 第二个列表。
 * @ja b - 2 番目の一覧。
 * @ko b - 두 번째 목록입니다.
 * @returns Equality of flags and ordered entries.
 * @zh 标志及有序条目是否相等。
 * @ja フラグと順序付き項目の比較結果。
 * @ko 플래그와 순서 있는 항목의 비교 결과입니다.
 */
export function transitionListEquals(
  a: TransitionList, b: TransitionList,
): boolean {
  return native.transitionListEquals(variantToNative(a), variantToNative(b));
}
