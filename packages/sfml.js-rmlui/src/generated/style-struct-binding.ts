// Generated from RmlUi 6.3: generate-computed-values.cjs.
import type { NativeStyleStruct } from '../internal/style-structs';
import type { NativeStyleValue } from '../internal/style-values';
import type { FontFaceHandle } from '../internal/computed';
import type * as Enums from './style-enums';

/** @internal */
export interface StyleStructBinding {
  createCommonValues(): NativeStyleStruct;
  commonValuesGetDisplay(
    handle: object,
  ): Enums.Display;
  commonValuesSetDisplay(
    handle: object,
    value: Enums.Display,
  ): void;
  commonValuesGetPosition(
    handle: object,
  ): Enums.Position;
  commonValuesSetPosition(
    handle: object,
    value: Enums.Position,
  ): void;
  commonValuesGetFloat(
    handle: object,
  ): Enums.Float;
  commonValuesSetFloat(
    handle: object,
    value: Enums.Float,
  ): void;
  commonValuesGetClear(
    handle: object,
  ): Enums.Clear;
  commonValuesSetClear(
    handle: object,
    value: Enums.Clear,
  ): void;
  commonValuesGetOverflowX(
    handle: object,
  ): Enums.Overflow;
  commonValuesSetOverflowX(
    handle: object,
    value: Enums.Overflow,
  ): void;
  commonValuesGetOverflowY(
    handle: object,
  ): Enums.Overflow;
  commonValuesSetOverflowY(
    handle: object,
    value: Enums.Overflow,
  ): void;
  commonValuesGetVisibility(
    handle: object,
  ): Enums.Visibility;
  commonValuesSetVisibility(
    handle: object,
    value: Enums.Visibility,
  ): void;
  commonValuesGetHasDecorator(
    handle: object,
  ): boolean;
  commonValuesSetHasDecorator(
    handle: object,
    value: boolean,
  ): void;
  commonValuesGetBoxSizing(
    handle: object,
  ): Enums.BoxSizing;
  commonValuesSetBoxSizing(
    handle: object,
    value: Enums.BoxSizing,
  ): void;
  commonValuesGetWidthType(
    handle: object,
  ): Enums.LengthPercentageAutoType;
  commonValuesSetWidthType(
    handle: object,
    value: Enums.LengthPercentageAutoType,
  ): void;
  commonValuesGetHeightType(
    handle: object,
  ): Enums.LengthPercentageAutoType;
  commonValuesSetHeightType(
    handle: object,
    value: Enums.LengthPercentageAutoType,
  ): void;
  commonValuesGetMarginTopType(
    handle: object,
  ): Enums.LengthPercentageAutoType;
  commonValuesSetMarginTopType(
    handle: object,
    value: Enums.LengthPercentageAutoType,
  ): void;
  commonValuesGetMarginRightType(
    handle: object,
  ): Enums.LengthPercentageAutoType;
  commonValuesSetMarginRightType(
    handle: object,
    value: Enums.LengthPercentageAutoType,
  ): void;
  commonValuesGetMarginBottomType(
    handle: object,
  ): Enums.LengthPercentageAutoType;
  commonValuesSetMarginBottomType(
    handle: object,
    value: Enums.LengthPercentageAutoType,
  ): void;
  commonValuesGetMarginLeftType(
    handle: object,
  ): Enums.LengthPercentageAutoType;
  commonValuesSetMarginLeftType(
    handle: object,
    value: Enums.LengthPercentageAutoType,
  ): void;
  commonValuesGetPaddingTopType(
    handle: object,
  ): Enums.LengthPercentageType;
  commonValuesSetPaddingTopType(
    handle: object,
    value: Enums.LengthPercentageType,
  ): void;
  commonValuesGetPaddingRightType(
    handle: object,
  ): Enums.LengthPercentageType;
  commonValuesSetPaddingRightType(
    handle: object,
    value: Enums.LengthPercentageType,
  ): void;
  commonValuesGetPaddingBottomType(
    handle: object,
  ): Enums.LengthPercentageType;
  commonValuesSetPaddingBottomType(
    handle: object,
    value: Enums.LengthPercentageType,
  ): void;
  commonValuesGetPaddingLeftType(
    handle: object,
  ): Enums.LengthPercentageType;
  commonValuesSetPaddingLeftType(
    handle: object,
    value: Enums.LengthPercentageType,
  ): void;
  commonValuesGetTopType(
    handle: object,
  ): Enums.LengthPercentageAutoType;
  commonValuesSetTopType(
    handle: object,
    value: Enums.LengthPercentageAutoType,
  ): void;
  commonValuesGetRightType(
    handle: object,
  ): Enums.LengthPercentageAutoType;
  commonValuesSetRightType(
    handle: object,
    value: Enums.LengthPercentageAutoType,
  ): void;
  commonValuesGetBottomType(
    handle: object,
  ): Enums.LengthPercentageAutoType;
  commonValuesSetBottomType(
    handle: object,
    value: Enums.LengthPercentageAutoType,
  ): void;
  commonValuesGetLeftType(
    handle: object,
  ): Enums.LengthPercentageAutoType;
  commonValuesSetLeftType(
    handle: object,
    value: Enums.LengthPercentageAutoType,
  ): void;
  commonValuesGetZIndexType(
    handle: object,
  ): Enums.NumberAutoType;
  commonValuesSetZIndexType(
    handle: object,
    value: Enums.NumberAutoType,
  ): void;
  createInheritedValues(): NativeStyleStruct;
  inheritedValuesGetFontFaceHandle(
    handle: object,
  ): FontFaceHandle | null;
  inheritedValuesSetFontFaceHandle(
    handle: object,
    value: FontFaceHandle | null,
  ): void;
  inheritedValuesGetFontWeight(
    handle: object,
  ): number;
  inheritedValuesSetFontWeight(
    handle: object,
    value: number,
  ): void;
  inheritedValuesGetFontKerning(
    handle: object,
  ): Enums.FontKerning;
  inheritedValuesSetFontKerning(
    handle: object,
    value: Enums.FontKerning,
  ): void;
  inheritedValuesGetHasLetterSpacing(
    handle: object,
  ): number;
  inheritedValuesSetHasLetterSpacing(
    handle: object,
    value: number,
  ): void;
  inheritedValuesGetFontStyle(
    handle: object,
  ): Enums.FontStyle;
  inheritedValuesSetFontStyle(
    handle: object,
    value: Enums.FontStyle,
  ): void;
  inheritedValuesGetHasFontEffect(
    handle: object,
  ): boolean;
  inheritedValuesSetHasFontEffect(
    handle: object,
    value: boolean,
  ): void;
  inheritedValuesGetPointerEvents(
    handle: object,
  ): Enums.PointerEvents;
  inheritedValuesSetPointerEvents(
    handle: object,
    value: Enums.PointerEvents,
  ): void;
  inheritedValuesGetFocus(
    handle: object,
  ): Enums.Focus;
  inheritedValuesSetFocus(
    handle: object,
    value: Enums.Focus,
  ): void;
  inheritedValuesGetTextAlign(
    handle: object,
  ): Enums.TextAlign;
  inheritedValuesSetTextAlign(
    handle: object,
    value: Enums.TextAlign,
  ): void;
  inheritedValuesGetTextDecoration(
    handle: object,
  ): Enums.TextDecoration;
  inheritedValuesSetTextDecoration(
    handle: object,
    value: Enums.TextDecoration,
  ): void;
  inheritedValuesGetTextTransform(
    handle: object,
  ): Enums.TextTransform;
  inheritedValuesSetTextTransform(
    handle: object,
    value: Enums.TextTransform,
  ): void;
  inheritedValuesGetWhiteSpace(
    handle: object,
  ): Enums.WhiteSpace;
  inheritedValuesSetWhiteSpace(
    handle: object,
    value: Enums.WhiteSpace,
  ): void;
  inheritedValuesGetWordBreak(
    handle: object,
  ): Enums.WordBreak;
  inheritedValuesSetWordBreak(
    handle: object,
    value: Enums.WordBreak,
  ): void;
  inheritedValuesGetDirection(
    handle: object,
  ): Enums.Direction;
  inheritedValuesSetDirection(
    handle: object,
    value: Enums.Direction,
  ): void;
  inheritedValuesGetLineHeightInheritType(
    handle: object,
  ): Enums.LineHeightInheritType;
  inheritedValuesSetLineHeightInheritType(
    handle: object,
    value: Enums.LineHeightInheritType,
  ): void;
  inheritedValuesGetLanguage(
    handle: object,
  ): string;
  inheritedValuesSetLanguage(
    handle: object,
    value: string,
  ): void;
  createRareValues(): NativeStyleStruct;
  rareValuesGetMinWidthType(
    handle: object,
  ): Enums.LengthPercentageType;
  rareValuesSetMinWidthType(
    handle: object,
    value: Enums.LengthPercentageType,
  ): void;
  rareValuesGetMaxWidthType(
    handle: object,
  ): Enums.LengthPercentageType;
  rareValuesSetMaxWidthType(
    handle: object,
    value: Enums.LengthPercentageType,
  ): void;
  rareValuesGetMinHeightType(
    handle: object,
  ): Enums.LengthPercentageType;
  rareValuesSetMinHeightType(
    handle: object,
    value: Enums.LengthPercentageType,
  ): void;
  rareValuesGetMaxHeightType(
    handle: object,
  ): Enums.LengthPercentageType;
  rareValuesSetMaxHeightType(
    handle: object,
    value: Enums.LengthPercentageType,
  ): void;
  rareValuesGetPerspectiveOriginXType(
    handle: object,
  ): Enums.LengthPercentageType;
  rareValuesSetPerspectiveOriginXType(
    handle: object,
    value: Enums.LengthPercentageType,
  ): void;
  rareValuesGetPerspectiveOriginYType(
    handle: object,
  ): Enums.LengthPercentageType;
  rareValuesSetPerspectiveOriginYType(
    handle: object,
    value: Enums.LengthPercentageType,
  ): void;
  rareValuesGetTransformOriginXType(
    handle: object,
  ): Enums.LengthPercentageType;
  rareValuesSetTransformOriginXType(
    handle: object,
    value: Enums.LengthPercentageType,
  ): void;
  rareValuesGetTransformOriginYType(
    handle: object,
  ): Enums.LengthPercentageType;
  rareValuesSetTransformOriginYType(
    handle: object,
    value: Enums.LengthPercentageType,
  ): void;
  rareValuesGetHasLocalTransform(
    handle: object,
  ): boolean;
  rareValuesSetHasLocalTransform(
    handle: object,
    value: boolean,
  ): void;
  rareValuesGetHasLocalPerspective(
    handle: object,
  ): boolean;
  rareValuesSetHasLocalPerspective(
    handle: object,
    value: boolean,
  ): void;
  rareValuesGetFlexBasisType(
    handle: object,
  ): Enums.LengthPercentageAutoType;
  rareValuesSetFlexBasisType(
    handle: object,
    value: Enums.LengthPercentageAutoType,
  ): void;
  rareValuesGetRowGapType(
    handle: object,
  ): Enums.LengthPercentageType;
  rareValuesSetRowGapType(
    handle: object,
    value: Enums.LengthPercentageType,
  ): void;
  rareValuesGetColumnGapType(
    handle: object,
  ): Enums.LengthPercentageType;
  rareValuesSetColumnGapType(
    handle: object,
    value: Enums.LengthPercentageType,
  ): void;
  rareValuesGetVerticalAlignType(
    handle: object,
  ): Enums.VerticalAlignType;
  rareValuesSetVerticalAlignType(
    handle: object,
    value: Enums.VerticalAlignType,
  ): void;
  rareValuesGetDrag(
    handle: object,
  ): Enums.Drag;
  rareValuesSetDrag(
    handle: object,
    value: Enums.Drag,
  ): void;
  rareValuesGetTabIndex(
    handle: object,
  ): Enums.TabIndex;
  rareValuesSetTabIndex(
    handle: object,
    value: Enums.TabIndex,
  ): void;
  rareValuesGetOverscrollBehavior(
    handle: object,
  ): Enums.OverscrollBehavior;
  rareValuesSetOverscrollBehavior(
    handle: object,
    value: Enums.OverscrollBehavior,
  ): void;
  rareValuesGetHasMaskImage(
    handle: object,
  ): boolean;
  rareValuesSetHasMaskImage(
    handle: object,
    value: boolean,
  ): void;
  rareValuesGetHasFilter(
    handle: object,
  ): boolean;
  rareValuesSetHasFilter(
    handle: object,
    value: boolean,
  ): void;
  rareValuesGetHasBackdropFilter(
    handle: object,
  ): boolean;
  rareValuesSetHasBackdropFilter(
    handle: object,
    value: boolean,
  ): void;
  rareValuesGetHasBoxShadow(
    handle: object,
  ): boolean;
  rareValuesSetHasBoxShadow(
    handle: object,
    value: boolean,
  ): void;
  rareValuesGetTextOverflow(
    handle: object,
  ): Enums.TextOverflow;
  rareValuesSetTextOverflow(
    handle: object,
    value: Enums.TextOverflow,
  ): void;
  rareValuesGetClip(
    handle: object,
  ): NativeStyleValue;
  rareValuesSetClip(
    handle: object,
    value: object,
  ): void;
}
