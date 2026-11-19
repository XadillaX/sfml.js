import {
  ComputedValues, Style, resolveValue, resolveValueOr,
  type ComputedValuesView, type Element, type FontFaceHandle,
  type VariantByteColour,
} from '../../dist';

declare const element: Element;

const view: ComputedValuesView = element.getComputedValues();
const owned = new ComputedValues(element);
owned.copyInherited(view);
owned.copyNonInherited(view);
owned.width = new Style.LengthPercentageAuto(
  Style.LengthPercentageAutoType.Percentage, 25);
owned.paddingTop = new Style.LengthPercentage(
  Style.LengthPercentageType.Length, 10);
owned.display = Style.Display.Flex;
owned.fontWeight = 537;
owned.fontFaceHandle = element.getFontFaceHandle();
owned.clip = new Style.Clip(Style.ClipType.Number, 3);
owned.lineHeight = new Style.LineHeight(24,
  Style.LineHeightInheritType.Length, 24);
owned.setHasLetterSpacing(true);
const pixels: number = resolveValue(view.width, 200);
const fallback: number = resolveValueOr(view.paddingTop, -1, 10);
const handle: FontFaceHandle | null = owned.fontFaceHandle;
const alias: Style.Margin = new Style.Margin();
const type: Style.ClipType = owned.clip.getType();
const colour: VariantByteColour = view.backgroundColor;
const common = new Style.CommonValues();
common.backgroundColor = colour;

owned.backgroundColor = {
  // @ts-expect-error Computed styles require byte colour channels.
  type: 'colourf', red: 1, green: 0, blue: 0, alpha: 1,
};
// @ts-expect-error Live colours retain their readonly discriminant.
colour.type = 'colourb';

// @ts-expect-error Element-owned values are read-only.
view.width = owned.width;
// @ts-expect-error Read-only views expose no copy mutators.
view.copyInherited(owned);
// @ts-expect-error Local property getters have no native setter.
owned.fontFamily = 'replacement';
// @ts-expect-error Font handles cannot be fabricated from pointers.
owned.fontFaceHandle = 5n;
// @ts-expect-error Percentage-only values cannot use the auto enum.
owned.paddingTop = new Style.LengthPercentageAuto();
// @ts-expect-error ResolveValue accepts only the two length types.
resolveValue(new Style.NumberAuto(), 20);
// @ts-expect-error Clip is not a raw numeric field.
owned.clip = 3;

void [ pixels, fallback, handle, alias, type, common ];
