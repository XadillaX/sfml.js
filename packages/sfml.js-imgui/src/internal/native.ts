import { createRequire } from 'node:module';
import type { ImGuiNativeBinding } from './imgui-binding';
import type { FormatArgument } from '../formatted';
import type {
  FontTextureView, SelectedItem,
} from '../references';
import type {
  ImDrawCmd, ImDrawList, ImFontAtlas, ImFontGlyphRangesBuilder,
  ImGuiIO, ImGuiInputTextCallbackData, ImGuiListClipper,
  ImGuiSelectionBasicStorage, ImGuiStyle, ImGuiStorage, ImGuiTextBuffer,
  ImGuiTextFilter, ImVec2Like, ImVec4Like, NativeStructMapping,
} from '../types';

interface NativeBinding {
  readonly errorState: { prototype: unknown };
  init(window: object, loadDefaultFont: boolean): boolean;
  shutdown(window: object): void;
  setCurrentWindow(window: object): void;
  processEvent(window: object, event: object): void;
  update(window: object, seconds: number): void;
  render(window: object): void;
  updateFontTexture(): boolean;
  getIO(): NativeStructMapping;
  getStyle(): NativeStructMapping;
  ioFonts(io: ImGuiIO): ImFontAtlas | null;
  styleColors(style: ImGuiStyle): ArrayBuffer;
  getGlyphRangesDefault(atlas: ImFontAtlas): Uint16Array;
  getGlyphRangesGreek(atlas: ImFontAtlas): Uint16Array;
  getGlyphRangesKorean(atlas: ImFontAtlas): Uint16Array;
  getGlyphRangesJapanese(atlas: ImFontAtlas): Uint16Array;
  getGlyphRangesChineseFull(atlas: ImFontAtlas): Uint16Array;
  getGlyphRangesChineseSimplifiedCommon(atlas: ImFontAtlas): Uint16Array;
  getGlyphRangesCyrillic(atlas: ImFontAtlas): Uint16Array;
  getGlyphRangesThai(atlas: ImFontAtlas): Uint16Array;
  getGlyphRangesVietnamese(atlas: ImFontAtlas): Uint16Array;
  InputTextEx(
    label: string | Uint8Array, buffer: Uint8Array, bufferSize: number,
    flags: number,
    callback: ((data: ImGuiInputTextCallbackData,
      userData: bigint | null) => number) | null,
    userData: bigint | null,
  ): boolean;
  InputTextMultilineEx(
    label: string | Uint8Array, buffer: Uint8Array, bufferSize: number,
    size: ImVec2Like, flags: number,
    callback: ((data: ImGuiInputTextCallbackData,
      userData: bigint | null) => number) | null,
    userData: bigint | null,
  ): boolean;
  ComboCallbackEx(
    label: string | Uint8Array, currentItem: Int32Array,
    getter: (index: number, userData: bigint | null) => string | null,
    userData: bigint | null, itemsCount: number, popupHeight: number,
  ): boolean;
  ListBoxCallbackEx(
    label: string | Uint8Array, currentItem: Int32Array,
    getter: (index: number, userData: bigint | null) => string | null,
    userData: bigint | null, itemsCount: number, height: number,
  ): boolean;
  PlotLinesCallbackEx(
    label: string | Uint8Array,
    getter: (index: number, userData: bigint | null) => number,
    userData: bigint | null, valuesCount: number, valuesOffset: number,
    overlayText: string | Uint8Array | null, scaleMin: number,
    scaleMax: number, graphSize: ImVec2Like,
  ): void;
  PlotHistogramCallbackEx(
    label: string | Uint8Array,
    getter: (index: number, userData: bigint | null) => number,
    userData: bigint | null, valuesCount: number, valuesOffset: number,
    overlayText: string | Uint8Array | null, scaleMin: number,
    scaleMax: number, graphSize: ImVec2Like,
  ): void;
  AddCallbackEx(
    drawList: ImDrawList,
    callback: (list: ImDrawList, cmd: ImDrawCmd,
      userData: bigint | null) => void,
    userData: bigint | null,
  ): void;
  Storage_GetIntRef(
    storage: ImGuiStorage, key: number, fallback: number,
  ): Int32Array;
  Storage_GetBoolRef(
    storage: ImGuiStorage, key: number, fallback: boolean,
  ): Uint8Array;
  Storage_GetFloatRef(
    storage: ImGuiStorage, key: number, fallback: number,
  ): Float32Array;
  Storage_GetVoidPtrRef(
    storage: ImGuiStorage, key: number, fallback: bigint | null,
  ): BigUint64Array | Uint32Array;
  FontAtlas_GetTexDataAsAlpha8(atlas: ImFontAtlas): FontTextureView | null;
  FontAtlas_GetTexDataAsRGBA32(atlas: ImFontAtlas): FontTextureView | null;
  FontGlyphRangesBuilder_BuildRanges(
    builder: ImFontGlyphRangesBuilder,
  ): Uint16Array;
  SelectionBasicStorage_GetNextSelectedItem(
    storage: ImGuiSelectionBasicStorage, iterator: bigint,
  ): SelectedItem | null;
  ImColor_SetHSV(
    color: Float32Array, h: number, s: number, v: number, a: number,
  ): void;
  createFontGlyphRangesBuilder(): ImFontGlyphRangesBuilder;
  createTextBuffer(): ImGuiTextBuffer;
  createSelectionBasicStorage(): ImGuiSelectionBasicStorage;
  createListClipper(): ImGuiListClipper;
  createTextFilter(): ImGuiTextFilter;
  Text(format: string | Uint8Array, args: readonly FormatArgument[]): void;
  TextColored(
    color: ImVec4Like, format: string | Uint8Array,
    args: readonly FormatArgument[],
  ): void;
  TextDisabled(
    format: string | Uint8Array, args: readonly FormatArgument[],
  ): void;
  TextWrapped(
    format: string | Uint8Array, args: readonly FormatArgument[],
  ): void;
  LabelText(
    label: string | Uint8Array, format: string | Uint8Array,
    args: readonly FormatArgument[],
  ): void;
  BulletText(
    format: string | Uint8Array, args: readonly FormatArgument[],
  ): void;
  TreeNodeStr(
    id: string | Uint8Array, format: string | Uint8Array,
    args: readonly FormatArgument[],
  ): boolean;
  TreeNodePtr(
    id: bigint | null, format: string | Uint8Array,
    args: readonly FormatArgument[],
  ): boolean;
  TreeNodeExStr(
    id: string | Uint8Array, flags: number,
    format: string | Uint8Array, args: readonly FormatArgument[],
  ): boolean;
  TreeNodeExPtr(
    id: bigint | null, flags: number,
    format: string | Uint8Array, args: readonly FormatArgument[],
  ): boolean;
  SetTooltip(
    format: string | Uint8Array, args: readonly FormatArgument[],
  ): void;
  SetItemTooltip(
    format: string | Uint8Array, args: readonly FormatArgument[],
  ): void;
  LogText(format: string | Uint8Array, args: readonly FormatArgument[]): void;
  DebugLog(
    format: string | Uint8Array, args: readonly FormatArgument[],
  ): void;
  TextBuffer_appendf(
    buffer: ImGuiTextBuffer, format: string | Uint8Array,
    args: readonly FormatArgument[],
  ): void;
}

const requireNative = createRequire(__filename);

// Compiled imgui native module.
export const native: NativeBinding & ImGuiNativeBinding = requireNative(
  '../../build/Release/imgui.node',
);
