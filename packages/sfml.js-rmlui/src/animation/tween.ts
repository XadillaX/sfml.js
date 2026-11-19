import { native } from '../internal/native';

/**
 * Rml::Tween::Type easing families.
 *
 * @zh Rml::Tween::Type 缓动类型。
 * @ja Rml::Tween::Type のイージング種別。
 * @ko Rml::Tween::Type 이징 종류입니다.
 */
export enum TweenType {
  /**
   * Linear fallback.
   *
   * @zh 线性回退。
   * @ja 線形。
   * @ko 선형입니다.
   */
  None = 0,
  /**
   * Overshoot.
   *
   * @zh 回退缓动。
   * @ja オーバーシュート。
   * @ko 오버슈트입니다.
   */
  Back = 1,
  /**
   * Bounce.
   *
   * @zh 弹跳。
   * @ja バウンド。
   * @ko 바운스입니다.
   */
  Bounce = 2,
  /**
   * Circular.
   *
   * @zh 圆形曲线。
   * @ja 円形曲線。
   * @ko 원형 곡선입니다.
   */
  Circular = 3,
  /**
   * Cubic.
   *
   * @zh 三次曲线。
   * @ja 三次曲線。
   * @ko 삼차 곡선입니다.
   */
  Cubic = 4,
  /**
   * Elastic.
   *
   * @zh 弹性。
   * @ja 弾性。
   * @ko 탄성입니다.
   */
  Elastic = 5,
  /**
   * Exponential.
   *
   * @zh 指数。
   * @ja 指数。
   * @ko 지수입니다.
   */
  Exponential = 6,
  /**
   * Linear.
   *
   * @zh 线性。
   * @ja 線形。
   * @ko 선형입니다.
   */
  Linear = 7,
  /**
   * Quadratic.
   *
   * @zh 二次曲线。
   * @ja 二次曲線。
   * @ko 이차 곡선입니다.
   */
  Quadratic = 8,
  /**
   * Quartic.
   *
   * @zh 四次曲线。
   * @ja 四次曲線。
   * @ko 사차 곡선입니다.
   */
  Quartic = 9,
  /**
   * Quintic.
   *
   * @zh 五次曲线。
   * @ja 五次曲線。
   * @ko 오차 곡선입니다.
   */
  Quintic = 10,
  /**
   * Sine.
   *
   * @zh 正弦。
   * @ja 正弦。
   * @ko 사인입니다.
   */
  Sine = 11,
  /**
   * Callback family; without a callback, uses the native linear fallback.
   *
   * @zh 回调类型；未提供回调时使用原生线性回退。
   * @ja コールバック未指定時は線形にフォールバック。
   * @ko 콜백이 없으면 네이티브 선형 함수로 대체합니다.
   */
  Callback = 12,
  /**
   * Sentinel, not a type.
   *
   * @zh 类型数量。
   * @ja 番兵値。
   * @ko 센티널입니다.
   */
  Count = 13,
}

/**
 * Select whether easing applies at the start, end, or both ends of a tween.
 *
 * @zh 选择在补间起点、终点或两端应用缓动。
 * @ja 補間の始点・終点・両端のどこにイージングを適用するかを選びます。
 * @ko 보간 시작·끝·양 끝 중 이징을 적용할 위치를 선택합니다.
 */
export enum TweenDirection {
  /**
   * Ease in.
   *
   * @zh 缓入。
   * @ja イーズイン。
   * @ko 이즈 인입니다.
   */
  In = 1,
  /**
   * Ease out.
   *
   * @zh 缓出。
   * @ja イーズアウト。
   * @ko 이즈 아웃입니다.
   */
  Out = 2,
  /**
   * Ease both ways.
   *
   * @zh 缓入缓出。
   * @ja 両方向。
   * @ko 양방향입니다.
   */
  InOut = 3,
}

/**
 * Synchronous callback, with native float32 input and finite float32 output.
 *
 * @zh 同步回调；输入为原生 float32，输出必须是有限 float32。
 * @ja 同期コールバック。入出力は有限の float32。
 * @ko 동기 콜백이며 입력과 출력은 유한한 float32입니다.
 */
export interface TweenCallback {
  /**
   * Evaluate the custom easing curve synchronously.
   *
   * @zh 同步计算自定义缓动曲线。
   * @ja カスタムイージング曲線を同期評価します。
   * @ko 사용자 이징 곡선을 동기적으로 계산합니다.
   * @param t - Float32 progress from zero to one.
   * @zh t - 零到一的 float32 进度。
   * @ja t - 0 から 1 の float32 進捗。
   * @ko t - 0에서 1까지의 float32 진행률입니다.
   * @returns Finite float32 progress; overshoot is supported.
   * @zh 有限 float32 进度，允许超出零到一。
   * @ja 有限の float32 進捗。オーバーシュート可能。
   * @ko 유한한 float32 진행률이며 오버슈트를 지원합니다.
   */
  (t: number): number;
}

/**
 * Unambiguous second type for the native (Type, Type) overload.
 *
 * @zh 原生 (Type, Type) 重载的第二个类型，避免与数字方向歧义。
 * @ja 数値の方向と区別する (Type, Type) オーバーロードの第 2 種別。
 * @ko 숫자 방향과 구분하는 (Type, Type) 오버로드의 두 번째 종류입니다.
 */
export interface TweenOutType {
  /**
   * Easing family for the second half.
   *
   * @zh 后半段的缓动类型。
   * @ja 後半のイージング種別。
   * @ko 후반부 이징 종류입니다.
   */
  out: TweenType;
}

const handles = new WeakMap<Tween, object>();

/**
 * Resolve the native Tween handle.
 *
 * @internal
 * @param tween - Checked wrapper.
 * @returns Native handle.
 */
export function tweenHandle(tween: Tween): object {
  const handle = handles.get(tween);
  if (!handle) {
    throw new TypeError('Expected a Tween');
  }
  return handle;
}

/**
 * Native Rml::Tween, copied into animation keys.
 *
 * @zh 原生 Rml::Tween；加入动画时复制到关键帧。
 * @ja アニメーションキーにコピーされるネイティブ Rml::Tween。
 * @ko 애니메이션 키로 복사되는 네이티브 Rml::Tween입니다.
 * @remarks
 * Callback tweens require an initialized runtime and expire on shutdown.
 * Wrappers, stored motion lists and live animations keep closures alive.
 * During a callback, runtime/DOM operations are rejected; pure Tween evaluation
 * may nest. Exceptions propagate after the native animation stack unwinds.
 * Built-in tweens remain usable outside runtime lifetime.
 * @zh 回调 Tween 要求已初始化运行时，关闭后失效。包装器、已存储列表和动画保活回调。
 * 回调中禁止运行时和 DOM 操作，但允许嵌套求值；异常在原生动画栈退出后传播。
 * 内置 Tween 可在运行时生命周期之外使用。
 * @ja コールバックは初期化後に使用でき、終了で無効になります。
 * ラッパー・保存した一覧・アニメーションが保持します。実行中の DOM 操作は禁止、
 * 純粋な Tween 評価の入れ子は可能。例外はネイティブ処理終了後に伝播します。
 * 組み込み Tween はランタイム外でも利用できます。
 * @ko 콜백은 초기화 후 사용하며 종료 시 무효화됩니다. 래퍼·저장 목록·애니메이션이
 * 필요로 하는 동안 유지됩니다. 실행 중 DOM 작업은 금지하고 중첩 Tween 평가는
 * 허용합니다. 예외는 네이티브 실행 종료 후 전달됩니다. 내장 Tween은 수명 밖에서도 사용합니다.
 */
export class Tween {
  /**
   * Construct the native type/direction, dual-type or callback overload.
   *
   * @zh 构造原生类型/方向、双类型或回调重载。
   * @ja 種別・方向、2 種別、コールバックの各オーバーロードを構築。
   * @ko 종류/방향, 두 종류 또는 콜백 오버로드를 생성합니다.
   * @param type - Easing family or callback; defaults to Linear.
   * @zh type - 类型或回调，默认为 Linear。
   * @ja type - 種別またはコールバック。既定は Linear。
   * @ko type - 종류 또는 콜백이며 기본값은 Linear입니다.
   * @param direction - Defaults to Out for types, In for callbacks;
   * `{ out: type }` selects the native two-type overload.
   * @zh direction - 类型默认 Out，回调默认 In；`{ out: type }` 选择双类型重载。
   * @ja direction - 種別は Out、コールバックは In が既定。`{ out: type }` は 2 種別。
   * @ko direction - 종류는 Out, 콜백은 In이 기본이며 `{ out: type }`은 두 종류입니다.
   */
  constructor(type?: TweenType, direction?: TweenDirection | TweenOutType);

  /**
   * Construct a native tween using a JavaScript easing callback.
   *
   * @zh 使用 JavaScript 缓动回调构造原生 Tween。
   * @ja JavaScript のイージング関数でネイティブ Tween を構築します。
   * @ko JavaScript 이징 콜백으로 네이티브 Tween을 만듭니다.
   * @param type - Easing callback retained for the tween's lifetime.
   * @zh type - 在 Tween 生命周期内保留的缓动回调。
   * @ja type - Tween の寿命中保持するイージング関数。
   * @ko type - Tween 수명 동안 유지할 이징 콜백입니다.
   * @param direction - Easing direction; defaults to In.
   * @zh direction - 缓动方向，默认 In。
   * @ja direction - イージング方向。既定値は In。
   * @ko direction - 이징 방향이며 기본값은 In입니다.
   */
  constructor(type: TweenCallback, direction?: TweenDirection);
  constructor(
    type: TweenType | TweenCallback = TweenType.Linear,
    direction?: TweenDirection | TweenOutType,
  ) {
    const dual = typeof direction === 'object' && direction !== null;
    handles.set(this, native.createTween(
      type, dual ? direction.out : direction, dual,
    ));
  }

  /**
   * Evaluate Rml::Tween::operator().
   *
   * @zh 求值 Rml::Tween::operator()。
   * @ja Rml::Tween::operator() を評価。
   * @ko Rml::Tween::operator()를 평가합니다.
   * @param t - Finite progress in [0, 1].
   * @zh t - [0, 1] 内的有限进度。
   * @ja t - [0, 1] 内の有限値。
   * @ko t - [0, 1] 범위의 유한한 진행률입니다.
   * @returns Native float32 easing result.
   * @zh 原生 float32 缓动结果。
   * @ja ネイティブ float32 の結果。
   * @ko 네이티브 float32 이징 결과입니다.
   */
  evaluate(t: number): number {
    return native.evaluateTween(tweenHandle(this), t);
  }

  /**
   * Reverse the native easing direction in place.
   *
   * @zh 原地反转原生缓动方向。
   * @ja イージング方向をその場で反転。
   * @ko 네이티브 이징 방향을 제자리에서 반전합니다.
   */
  reverse(): void {
    native.reverseTween(tweenHandle(this));
  }

  /**
   * Copy this Tween, retaining callback identity.
   *
   * @zh 复制 Tween 并保留回调身份。
   * @ja コールバック同一性を保持してコピー。
   * @ko 콜백 동일성을 유지하며 복사합니다.
   * @returns Independent native Tween.
   * @zh 独立原生 Tween。
   * @ja 独立したネイティブ Tween。
   * @ko 독립적인 네이티브 Tween입니다.
   */
  clone(): Tween {
    const result = Object.create(Tween.prototype) as Tween;
    handles.set(result, native.cloneTween(tweenHandle(this)));
    return result;
  }

  /**
   * Compare native types, directions and callback identity.
   *
   * @zh 比较原生类型、方向和回调身份。
   * @ja 種別・方向・コールバック同一性を比較。
   * @ko 종류, 방향 및 콜백 동일성을 비교합니다.
   * @param other - Tween to compare.
   * @zh other - 待比较 Tween。
   * @ja other - 比較対象。
   * @ko other - 비교 대상입니다.
   * @returns Native equality.
   * @zh 原生相等结果。
   * @ja ネイティブ等価結果。
   * @ko 네이티브 동등 결과입니다.
   */
  equals(other: Tween): boolean {
    return native.tweenEquals(tweenHandle(this), tweenHandle(other));
  }

  /**
   * Evaluate native operator!=.
   *
   * @zh 原生 operator!=。
   * @ja ネイティブ operator!=。
   * @ko 네이티브 operator!=입니다.
   * @param other - Tween to compare.
   * @zh other - 待比较 Tween。
   * @ja other - 比較対象。
   * @ko other - 비교 대상입니다.
   * @returns Native inequality.
   * @zh 原生不等结果。
   * @ja ネイティブ非等価結果。
   * @ko 네이티브 비동등 결과입니다.
   */
  notEquals(other: Tween): boolean {
    return native.tweenNotEquals(tweenHandle(this), tweenHandle(other));
  }

  /**
   * Get the easing name represented by this tween.
   *
   * @zh 获取此补间表示的缓动名称。
   * @ja この補間が表すイージング名を取得します。
   * @ko 이 보간이 나타내는 이징 이름을 가져옵니다.
   * @returns Native easing name.
   * @zh 原生缓动名称。
   * @ja ネイティブのイージング名。
   * @ko 네이티브 이징 이름입니다.
   */
  toString(): string {
    return native.tweenToString(tweenHandle(this));
  }
}

/**
 * Wrap an owned native copy while preserving its private callback edge.
 *
 * @internal
 * @param handle - Native Tween handle.
 * @returns Independent facade.
 */
export function tweenFromNative(handle: object): Tween {
  const result = Object.create(Tween.prototype) as Tween;
  handles.set(result, handle);
  return result;
}
