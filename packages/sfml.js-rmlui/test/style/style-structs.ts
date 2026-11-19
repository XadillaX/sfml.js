import { Style, type FontFaceHandle } from '../../dist';

const common = new Style.CommonValues();
const inherited = new Style.InheritedValues();
const rare = new Style.RareValues();
common.display = Style.Display.Flex;
common.widthType = Style.LengthPercentageAutoType.Percentage;
common.widthValue = 35;
common.borderTopWidth = 65535;
common.backgroundColor = {
  type: 'colourb', red: 1, green: 2, blue: 3, alpha: 4,
};
const width: Float32Array = common.widthValueView;
const border: Uint16Array = common.borderTopWidthView;
const radius: Int16Array = rare.borderTopLeftRadiusView;
const colour: Uint8Array = inherited.colorView;
const font: FontFaceHandle | null = inherited.fontFaceHandle;
inherited.fontWeight = 537;
inherited.hasLetterSpacing = 1;
inherited.language = '日本語';
inherited.fontFaceHandle = null;
rare.clip = new Style.Clip(Style.ClipType.Number, 7);
rare.flexBasisType = Style.LengthPercentageAutoType.Auto;
rare.hasFilter = true;

const zIndex = new Style.ZIndex(Style.NumberAutoType.Number, 2);
const verticalAlign = new Style.VerticalAlign(12);
const typedAlign = new Style.VerticalAlign(Style.VerticalAlignType.Length, 12);
const percentage = new Style.LengthPercentage(
  Style.LengthPercentageType.Percentage, 50);
const auto = new Style.LengthPercentageAuto(
  Style.LengthPercentageAutoType.Auto, 0);
const resolved: number = Style.resolveValue(percentage, 200);
const fallback: number = Style.resolveValueOr(auto, 200, 30);
const clipNumber: number = rare.clip.getNumber();
const clipMatches: boolean = rare.clip.equals(Style.ClipType.Number);

// @ts-expect-error The native letter-spacing bitfield is uint16, not bool.
inherited.hasLetterSpacing = true;
// @ts-expect-error Native bool bitfields reject numbers.
rare.hasFilter = 1;
// @ts-expect-error Font addresses cannot be fabricated.
inherited.fontFaceHandle = 123n;
// @ts-expect-error Clip requires a native wrapper.
rare.clip = 5;
// @ts-expect-error Native bitfields have no directly addressable storage.
common.displayView[0] = 4;
// @ts-expect-error Percentage-only type rejects Auto's distinct enum.
rare.rowGapType = Style.LengthPercentageAutoType.Auto;
// @ts-expect-error Length resolution requires a managed native scalar.
Style.resolveValue(50, 200);
// @ts-expect-error Clip comparison uses the ClipType enum.
rare.clip.equals('number');

void [
  width, border, radius, colour, font, zIndex, verticalAlign, typedAlign,
  resolved, fallback, clipNumber, clipMatches,
];
