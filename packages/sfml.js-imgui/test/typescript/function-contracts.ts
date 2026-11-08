import { ImGui } from '../../src';
import type { ImGuiNativeBinding } from '../../src/internal/imgui-binding';

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false;
type Assert<Value extends true> = Value;

type NullableFont = ImGui.ImFont | null;
type PushFont = typeof ImGui.PushFont;
type AddText = typeof ImGui.ImDrawList_AddTextImFontPtr;
type AddTextEx = typeof ImGui.ImDrawList_AddTextImFontPtrEx;
type FindGlyph = typeof ImGui.ImFont_FindGlyph;

export type FontContracts = [
  Assert<Equal<Parameters<PushFont>, [font: NullableFont]>>,
  Assert<Equal<Parameters<AddText>[1], NullableFont>>,
  Assert<Equal<Parameters<AddTextEx>[1], NullableFont>>,
  Assert<Equal<Parameters<FindGlyph>[0], ImGui.ImFont>>,
  Assert<Equal<ReturnType<FindGlyph>, ImGui.ImFontGlyph | null>>,
  Assert<Equal<ReturnType<PushFont>, void>>,
];

type NativePushFont = ImGuiNativeBinding['PushFont'];
type NativeAddTextEx = ImGuiNativeBinding['ImDrawList_AddTextImFontPtrEx'];
type NativeAddTextArguments = [
  self: ImGui.ImDrawList,
  font: NullableFont,
  fontSize: number,
  position: ImGui.ImVec2Like,
  color: number,
  text: string | Uint8Array,
  textEnd: Uint8Array | null,
  wrapWidth: number,
  clipRectangle: Float32Array | null,
];

export type NativeFontContracts = [
  Assert<Equal<Parameters<NativePushFont>, [font: NullableFont]>>,
  Assert<Equal<Parameters<NativeAddTextEx>, NativeAddTextArguments>>,
  Assert<Equal<ReturnType<NativeAddTextEx>, void>>,
];

type NativeDragArguments = Parameters<ImGuiNativeBinding['DragFloatEx']>;
type NativePlotArguments = Parameters<ImGuiNativeBinding['PlotLinesEx']>;
type NativeImageArguments = Parameters<
ImGuiNativeBinding['ImDrawList_AddImageEx']
>;
type NullableText = string | Uint8Array | null;

export type NativeDefaultContracts = [
  Assert<Equal<NativeDragArguments[2], number>>,
  Assert<Equal<NativePlotArguments[4], NullableText>>,
  Assert<Equal<NativeImageArguments[4], ImGui.ImVec2Like>>,
];

export type ScalarAndHandleContracts = [
  Assert<Equal<Parameters<typeof ImGui.DragScalar>[2], bigint>>,
  Assert<Equal<Parameters<typeof ImGui.DragScalarN>[2], bigint>>,
  Assert<Equal<Parameters<typeof ImGui.InputScalar>[2], bigint>>,
  Assert<Equal<Parameters<typeof ImGui.InputScalarN>[2], bigint>>,
  Assert<Equal<Parameters<typeof ImGui.SliderScalar>[2], bigint>>,
  Assert<Equal<Parameters<typeof ImGui.SliderScalar>[3], bigint>>,
  Assert<Equal<Parameters<typeof ImGui.SliderScalar>[4], bigint>>,
  Assert<Equal<Parameters<typeof ImGui.VSliderScalar>[3], bigint>>,
  Assert<Equal<Parameters<typeof ImGui.VSliderScalar>[4], bigint>>,
  Assert<Equal<Parameters<typeof ImGui.VSliderScalar>[5], bigint>>,
  Assert<
  Equal<
  Parameters<typeof ImGui.DragScalarEx>[4],
      bigint | null | undefined
  >
  >,
  Assert<
  Equal<
  Parameters<typeof ImGui.InputScalarEx>[3],
      bigint | null | undefined
  >
  >,
  Assert<
  Equal<
  Parameters<typeof ImGui.SetStateStorage>[0],
  ImGui.ImGuiStorage | null
  >
  >,
  Assert<
  Equal<Parameters<typeof ImGui.SetWindowFocusStr>[0], NullableText>
  >,
  Assert<Equal<Parameters<typeof ImGui.BeginCombo>[1], NullableText>>,
  Assert<Equal<ReturnType<typeof ImGui.MemAlloc>, bigint>>,
  Assert<Equal<ReturnType<typeof ImGui.Storage_GetVoidPtr>, bigint>>,
];

/**
 * Check writable storage and nullable default-font call contracts.
 *
 * @param drawList - Borrowed draw-list handle.
 * @param font - Loaded font handle.
 * @param scalarAddress - Address of mutable scalar storage.
 */
export function checkFunctionContracts(
  drawList: ImGui.ImDrawList,
  font: ImGui.ImFont,
  scalarAddress: bigint,
): void {
  ImGui.PushFont(null);
  ImGui.PushFont(font);
  ImGui.ImDrawList_AddTextImFontPtr(
    drawList,
    null,
    0,
    { x: 0, y: 0 },
    0xffffffff,
    'default font',
  );
  ImGui.ImDrawList_AddTextImFontPtrEx(
    drawList,
    null,
    0,
    { x: 0, y: 0 },
    0xffffffff,
    'default font',
  );
  ImGui.ImDrawList_AddTextImFontPtr(
    drawList,
    font,
    16,
    { x: 0, y: 0 },
    0xffffffff,
    'explicit font',
  );
  ImGui.ImDrawList_AddTextImFontPtrEx(
    drawList,
    font,
    16,
    { x: 0, y: 0 },
    0xffffffff,
    'explicit font',
    undefined,
    undefined,
    new Float32Array([ 0, 0, 100, 100 ]),
  );

  ImGui.InputFloat('float', new Float32Array([ 1 ]));
  ImGui.DragScalar('scalar', ImGui.ImGuiDataType.Float, scalarAddress);
  ImGui.InputText('text', new Uint8Array(64), 64);
  ImGui.SetStateStorage(null);
  ImGui.SetWindowFocusStr(null);
  ImGui.BeginCombo('combo', null);

  // @ts-expect-error A font method needs an actual font handle.
  ImGui.ImFont_FindGlyph(null, 65);
  // @ts-expect-error Typed scalar widgets mutate caller-owned array storage.
  ImGui.InputFloat('float', 1);
  ImGui.DragScalar(
    'scalar',
    ImGui.ImGuiDataType.Float,
    // @ts-expect-error Generic scalar widgets take addresses, not typed arrays.
    new Float32Array(1),
  );
  // @ts-expect-error InputText needs writable UTF-8 storage, not a string.
  ImGui.InputText('text', 'immutable', 64);
  // @ts-expect-error Generic scalar storage cannot be null.
  ImGui.DragScalar('scalar', ImGui.ImGuiDataType.Float, null);
  ImGui.SliderScalar(
    'scalar',
    ImGui.ImGuiDataType.Float,
    scalarAddress,
    // @ts-expect-error Slider bounds are required native addresses.
    null,
    null,
  );
}

/**
 * Check UTF-8 range overloads without executing native calls.
 *
 * @param drawList - Borrowed draw-list handle.
 * @param buffer - Text buffer handle.
 * @param filter - Text filter handle.
 * @param builder - Glyph range builder handle.
 * @param callback - Active input callback data.
 */
export function checkTextRangeContracts(
  drawList: ImGui.ImDrawList,
  buffer: ImGui.ImGuiTextBuffer,
  filter: ImGui.ImGuiTextFilter,
  builder: ImGui.ImFontGlyphRangesBuilder,
  callback: ImGui.ImGuiInputTextCallbackData,
): void {
  const bytes = new Uint8Array([ 65, 66, 67 ]);
  const end = bytes.subarray(2);
  const position = { x: 0, y: 0 };

  ImGui.TextUnformattedEx('text');
  ImGui.TextUnformattedEx('text', null);
  ImGui.TextUnformattedEx(bytes, end);
  ImGui.CalcTextSizeEx('text');
  ImGui.CalcTextSizeEx(bytes, end);
  ImGui.PushIDStr('text');
  ImGui.PushIDStr(bytes, end);
  ImGui.GetIDStr('text', null);
  ImGui.GetIDStr(bytes, end);
  ImGui.ImDrawList_AddTextEx(drawList, position, 0xffffffff, bytes, end);
  ImGui.ImDrawList_AddTextEx(drawList, position, 0xffffffff, 'text', null);
  ImGui.ImDrawList_AddTextImFontPtrEx(
    drawList,
    null,
    0,
    position,
    0xffffffff,
    bytes,
    end,
  );
  ImGui.TextBuffer_append(buffer, 'text');
  ImGui.TextBuffer_append(buffer, bytes, end);
  ImGui.TextFilter_PassFilter(filter, 'text', null);
  ImGui.TextFilter_PassFilter(filter, bytes, end);
  ImGui.ImFontGlyphRangesBuilder_AddText(builder, 'text');
  ImGui.ImFontGlyphRangesBuilder_AddText(builder, bytes, end);
  ImGui.InputTextCallbackData_InsertChars(callback, 0, 'text');
  ImGui.InputTextCallbackData_InsertChars(callback, 0, bytes, end);

  // @ts-expect-error A JS string cannot be an explicit endpoint.
  ImGui.TextUnformattedEx('text', 'end');
  // @ts-expect-error Explicit endpoints require a byte-view start.
  ImGui.CalcTextSizeEx('text', end);
  // @ts-expect-error Explicit endpoints require a byte-view start.
  ImGui.PushIDStr('text', end);
  // @ts-expect-error A JS string cannot be an explicit endpoint.
  ImGui.GetIDStr(bytes, 'end');
  // @ts-expect-error Explicit endpoints require a byte-view start.
  ImGui.ImDrawList_AddTextEx(drawList, position, 0xffffffff, 'text', end);
  // @ts-expect-error Explicit endpoints require a byte-view start.
  ImGui.ImDrawList_AddTextImFontPtrEx(
    drawList,
    null,
    0,
    position,
    0xffffffff,
    'text',
    end,
  );
  // @ts-expect-error Explicit endpoints require a byte-view start.
  ImGui.TextBuffer_append(buffer, 'text', end);
  // @ts-expect-error Explicit endpoints require a byte-view start.
  ImGui.TextFilter_PassFilter(filter, 'text', end);
  // @ts-expect-error Explicit endpoints require a byte-view start.
  ImGui.ImFontGlyphRangesBuilder_AddText(builder, 'text', end);
  // @ts-expect-error Explicit endpoints require a byte-view start.
  ImGui.InputTextCallbackData_InsertChars(callback, 0, 'text', end);
}
