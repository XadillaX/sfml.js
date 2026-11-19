import type { VariantVector2 } from '../values/types';

export { KeyIdentifier, KeyModifier } from '../generated/input';

/**
 * A point in a Rml::TouchList, used by direct context touch input.
 *
 * @zh Rml::TouchList 中的触点，用于上下文直接触摸输入。
 * @ja コンテキストへの直接タッチ入力で使う Rml::TouchList の点。
 * @ko 컨텍스트 직접 터치 입력에 사용하는 Rml::TouchList의 점입니다.
 */
export interface Touch {
  /**
   * Native uintptr_t identifier; use bigint above Number.MAX_SAFE_INTEGER.
   *
   * @zh 精确的原生 uintptr_t 标识；超过 Number.MAX_SAFE_INTEGER 时使用 bigint。
   * @ja 正確な uintptr_t 識別子。Number.MAX_SAFE_INTEGER 超過時は bigint を使います。
   * @ko 정확한 uintptr_t 식별자입니다. Number.MAX_SAFE_INTEGER 초과 시 bigint를 사용합니다.
   */
  readonly identifier: number | bigint;

  /**
   * Window coordinates in physical pixels, passed to RmlUi as Vector2f.
   *
   * @zh 窗口物理像素坐标，以 Vector2f 传给 RmlUi。
   * @ja ウィンドウの物理ピクセル座標。Vector2f として RmlUi に渡します。
   * @ko 창의 물리 픽셀 좌표이며 Vector2f로 RmlUi에 전달합니다.
   */
  readonly position: VariantVector2;
}
