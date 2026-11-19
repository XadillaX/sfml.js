import { native } from '../../internal/native';
import {
  styleValues, styleMapping, stylePrototypes,
  styleValueHandle, checkedStyleEnum, clipMapping,
} from '../../internal/style-values';
import { ClipType } from '../../generated/style-enums';
import {
  LengthPercentage, LengthPercentageAuto,
} from '../../generated/style-scalars';

export * from '../../generated/style-enums';
export * from '../../generated/style-scalars';
export * from '../../generated/style-structs';

/**
 * Rml::Style::Margin, a length, percentage or auto value.
 *
 * @zh Rml::Style::Margin，长度、百分比或自动值。
 * @ja Rml::Style::Margin。長さ・割合・自動値。
 * @ko Rml::Style::Margin이며 길이, 백분율 또는 자동 값입니다.
 */
export { LengthPercentageAuto as Margin } from '../../generated/style-scalars';

/**
 * Rml::Style::Width, a length, percentage or auto value.
 *
 * @zh Rml::Style::Width，长度、百分比或自动值。
 * @ja Rml::Style::Width。長さ・割合・自動値。
 * @ko Rml::Style::Width이며 길이, 백분율 또는 자동 값입니다.
 */
export { LengthPercentageAuto as Width } from '../../generated/style-scalars';

/**
 * Rml::Style::Height, a length, percentage or auto value.
 *
 * @zh Rml::Style::Height，长度、百分比或自动值。
 * @ja Rml::Style::Height。長さ・割合・自動値。
 * @ko Rml::Style::Height이며 길이, 백분율 또는 자동 값입니다.
 */
export { LengthPercentageAuto as Height } from '../../generated/style-scalars';

/**
 * Rml::Style::Top, a length, percentage or auto value.
 *
 * @zh Rml::Style::Top，长度、百分比或自动值。
 * @ja Rml::Style::Top。長さ・割合・自動値。
 * @ko Rml::Style::Top이며 길이, 백분율 또는 자동 값입니다.
 */
export { LengthPercentageAuto as Top } from '../../generated/style-scalars';

/**
 * Rml::Style::Right, a length, percentage or auto value.
 *
 * @zh Rml::Style::Right，长度、百分比或自动值。
 * @ja Rml::Style::Right。長さ・割合・自動値。
 * @ko Rml::Style::Right이며 길이, 백분율 또는 자동 값입니다.
 */
export { LengthPercentageAuto as Right } from '../../generated/style-scalars';

/**
 * Rml::Style::Bottom, a length, percentage or auto value.
 *
 * @zh Rml::Style::Bottom，长度、百分比或自动值。
 * @ja Rml::Style::Bottom。長さ・割合・自動値。
 * @ko Rml::Style::Bottom이며 길이, 백분율 또는 자동 값입니다.
 */
export { LengthPercentageAuto as Bottom } from '../../generated/style-scalars';

/**
 * Rml::Style::Left, a length, percentage or auto value.
 *
 * @zh Rml::Style::Left，长度、百分比或自动值。
 * @ja Rml::Style::Left。長さ・割合・自動値。
 * @ko Rml::Style::Left이며 길이, 백분율 또는 자동 값입니다.
 */
export { LengthPercentageAuto as Left } from '../../generated/style-scalars';

/**
 * Rml::Style::FlexBasis, a length, percentage or auto value.
 *
 * @zh Rml::Style::FlexBasis，长度、百分比或自动值。
 * @ja Rml::Style::FlexBasis。長さ・割合・自動値。
 * @ko Rml::Style::FlexBasis이며 길이, 백분율 또는 자동 값입니다.
 */
export {
  LengthPercentageAuto as FlexBasis,
} from '../../generated/style-scalars';

/**
 * Rml::Style::Padding, a length or percentage.
 *
 * @zh Rml::Style::Padding，长度或百分比。
 * @ja Rml::Style::Padding。長さまたは割合。
 * @ko Rml::Style::Padding이며 길이 또는 백분율입니다.
 */
export { LengthPercentage as Padding } from '../../generated/style-scalars';

/**
 * Rml::Style::MinWidth, a length or percentage.
 *
 * @zh Rml::Style::MinWidth，长度或百分比。
 * @ja Rml::Style::MinWidth。長さまたは割合。
 * @ko Rml::Style::MinWidth이며 길이 또는 백분율입니다.
 */
export { LengthPercentage as MinWidth } from '../../generated/style-scalars';

/**
 * Rml::Style::MaxWidth, a length or percentage.
 *
 * @zh Rml::Style::MaxWidth，长度或百分比。
 * @ja Rml::Style::MaxWidth。長さまたは割合。
 * @ko Rml::Style::MaxWidth이며 길이 또는 백분율입니다.
 */
export { LengthPercentage as MaxWidth } from '../../generated/style-scalars';

/**
 * Rml::Style::MinHeight, a length or percentage.
 *
 * @zh Rml::Style::MinHeight，长度或百分比。
 * @ja Rml::Style::MinHeight。長さまたは割合。
 * @ko Rml::Style::MinHeight이며 길이 또는 백분율입니다.
 */
export { LengthPercentage as MinHeight } from '../../generated/style-scalars';

/**
 * Rml::Style::MaxHeight, a length or percentage.
 *
 * @zh Rml::Style::MaxHeight，长度或百分比。
 * @ja Rml::Style::MaxHeight。長さまたは割合。
 * @ko Rml::Style::MaxHeight이며 길이 또는 백분율입니다.
 */
export { LengthPercentage as MaxHeight } from '../../generated/style-scalars';

/**
 * Rml::Style::PerspectiveOrigin, a length or percentage.
 *
 * @zh Rml::Style::PerspectiveOrigin，长度或百分比。
 * @ja Rml::Style::PerspectiveOrigin。長さまたは割合。
 * @ko Rml::Style::PerspectiveOrigin이며 길이 또는 백분율입니다.
 */
export {
  LengthPercentage as PerspectiveOrigin,
} from '../../generated/style-scalars';

/**
 * Rml::Style::TransformOrigin, a length or percentage.
 *
 * @zh Rml::Style::TransformOrigin，长度或百分比。
 * @ja Rml::Style::TransformOrigin。長さまたは割合。
 * @ko Rml::Style::TransformOrigin이며 길이 또는 백분율입니다.
 */
export {
  LengthPercentage as TransformOrigin,
} from '../../generated/style-scalars';

/**
 * Rml::Style::ZIndex, a number or auto value.
 *
 * @zh Rml::Style::ZIndex，数值或自动值。
 * @ja Rml::Style::ZIndex。数値または自動値。
 * @ko Rml::Style::ZIndex이며 숫자 또는 자동 값입니다.
 */
export { NumberAuto as ZIndex } from '../../generated/style-scalars';

/**
 * Native Rml::Style::Clip with its encoded signed-byte semantics.
 *
 * @zh 原生 Rml::Style::Clip，保留有符号字节编码语义。
 * @ja 符号付きバイトの符号化を保持する Rml::Style::Clip。
 * @ko 부호 있는 바이트 인코딩을 유지하는 Rml::Style::Clip입니다.
 */
export class Clip {
  /**
   * Construct the native clip value.
   *
   * @zh 构造原生裁剪值。
   * @ja ネイティブクリップ値を構築します。
   * @ko 네이티브 클립 값을 생성합니다.
   * @param type - Native type; defaults to Auto.
   * @zh type - 原生类型，默认 Auto。
   * @ja type - ネイティブ型。既定は Auto。
   * @ko type - 네이티브 형식이며 기본값은 Auto입니다.
   * @param number - Signed int8 count, used by Number; defaults to zero.
   * @zh number - Number 使用的 int8 计数，默认零。
   * @ja number - Number の int8 個数。既定はゼロ。
   * @ko number - Number에 사용하는 int8 수이며 기본값은 0입니다.
   */
  constructor(type = ClipType.Auto, number = 0) {
    styleValues.set(this, native.createClip(type, number));
  }

  /**
   * Rml::Style::Clip::GetType after native encoding.
   *
   * @zh 原生编码后的 Rml::Style::Clip::GetType。
   * @ja ネイティブ符号化後の Rml::Style::Clip::GetType。
   * @ko 네이티브 인코딩 후 Rml::Style::Clip::GetType입니다.
   * @returns Normalized native type.
   * @zh 规范化后的原生类型。
   * @ja 正規化されたネイティブ型。
   * @ko 정규화된 네이티브 형식입니다.
   */
  getType(): ClipType {
    return clipMapping(this).type;
  }

  /**
   * Get the number of ancestor clipping regions to ignore;
   * keyword modes return zero.
   *
   * @zh 获取需要忽略的祖先裁剪区域数量；关键字模式返回零。
   * @ja 無視する祖先クリッピング領域の数を取得します。キーワードではゼロです。
   * @ko 무시할 조상 클리핑 영역 수를 가져오며 키워드 모드는 0을 반환합니다.
   * @returns Nonnegative clip count.
   * @zh 非负裁剪计数。
   * @ja 非負のクリップ個数。
   * @ko 음수가 아닌 클립 수입니다.
   */
  getNumber(): number {
    return clipMapping(this).number;
  }

  /**
   * Rml::Style::Clip::operator==(Type).
   *
   * @zh 对应 Rml::Style::Clip::operator==(Type)。
   * @ja Rml::Style::Clip::operator==(Type) に対応します。
   * @ko Rml::Style::Clip::operator==(Type)에 해당합니다.
   * @param type - Native clip type.
   * @zh type - 原生裁剪类型。
   * @ja type - ネイティブクリップ型。
   * @ko type - 네이티브 클립 형식입니다.
   * @returns Whether the normalized type matches.
   * @zh 规范化类型是否匹配。
   * @ja 正規化された型が一致するか。
   * @ko 정규화된 형식이 일치하는지 여부입니다.
   */
  equals(type: ClipType): boolean {
    return this.getType() === checkedStyleEnum(type, ClipType.Number);
  }
}

stylePrototypes.set('Clip', Clip.prototype);

/**
 * Rml::ResolveValue for either computed length type.
 *
 * @zh 两种计算长度类型的 Rml::ResolveValue。
 * @ja 両方の計算済み長さ型に対する Rml::ResolveValue。
 * @ko 두 계산 길이 형식에 대한 Rml::ResolveValue입니다.
 * @param value - Length, percentage, or auto length.
 * @zh value - 长度、百分比或自动长度。
 * @ja value - 長さ、割合、または自動長さ。
 * @ko value - 길이, 백분율 또는 자동 길이입니다.
 * @param base - Nonnegative percentage base; negative means indefinite.
 * @zh base - 非负百分比基准；负值表示不确定。
 * @ja base - 非負の割合基準。負は未確定。
 * @ko base - 음수가 아닌 백분율 기준이며 음수는 미정입니다.
 * @returns Resolved pixels, or zero for auto/indefinite percentages.
 * @zh 解析后的像素；自动长度或不确定百分比返回零。
 * @ja 解決したピクセル値。自動値や未確定の割合はゼロ。
 * @ko 계산된 픽셀 값이며 자동 또는 미정 백분율은 0입니다.
 */
export function resolveValue(
  value: LengthPercentage | LengthPercentageAuto, base: number,
): number {
  return styleMapping(value).kind === 'LengthPercentageAuto'
    ? native.resolveLengthPercentageAuto(styleValueHandle(value), base)
    : native.resolveLengthPercentage(styleValueHandle(value), base);
}

/**
 * Rml::ResolveValueOr for either computed length type.
 *
 * @zh 两种计算长度类型的 Rml::ResolveValueOr。
 * @ja 両方の計算済み長さ型に対する Rml::ResolveValueOr。
 * @ko 두 계산 길이 형식에 대한 Rml::ResolveValueOr입니다.
 * @param value - Native computed length.
 * @zh value - 原生计算长度。
 * @ja value - ネイティブの計算済み長さ。
 * @ko value - 네이티브 계산 길이입니다.
 * @param base - Percentage base; negative means indefinite.
 * @zh base - 百分比基准；负值表示不确定。
 * @ja base - 割合基準。負は未確定。
 * @ko base - 백분율 기준이며 음수는 미정입니다.
 * @param fallback - Result for auto or an indefinite percentage.
 * @zh fallback - 自动长度或不确定百分比的返回值。
 * @ja fallback - 自動値または未確定の割合に対する値。
 * @ko fallback - 자동 또는 미정 백분율의 결과입니다.
 * @returns Resolved pixels or fallback.
 * @zh 解析后的像素或 fallback。
 * @ja 解決したピクセル値または fallback。
 * @ko 계산된 픽셀 값 또는 fallback입니다.
 */
export function resolveValueOr(
  value: LengthPercentage | LengthPercentageAuto,
  base: number, fallback: number,
): number {
  return styleMapping(value).kind === 'LengthPercentageAuto'
    ? native.resolveLengthPercentageAutoOr(
      styleValueHandle(value), base, fallback)
    : native.resolveLengthPercentageOr(styleValueHandle(value), base, fallback);
}
