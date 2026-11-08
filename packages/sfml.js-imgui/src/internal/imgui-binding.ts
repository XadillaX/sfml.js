import type {
  ImDrawCmd,
  ImDrawData,
  ImDrawList,
  ImDrawListSplitter,
  ImFontAtlas,
  ImFontAtlasCustomRect,
  ImFontConfig,
  ImFontGlyph,
  ImGuiIO,
  ImGuiInputTextCallbackData,
  ImGuiListClipper,
  ImGuiMultiSelectIO,
  ImGuiPayload,
  ImGuiPlatformIO,
  ImGuiSelectionBasicStorage,
  ImGuiStyle,
  ImGuiTableSortSpecs,
  ImGuiTextFilter,
  ImGuiViewport,
  NativeStructMapping,
} from '../types';

// Type-only imports keep the native loader out of a runtime import cycle.
// Wrapper return types must stay explicit so this contract is not recursive.
type ImGuiFunctions =
  typeof import('../imgui/context') &
  typeof import('../imgui/debug') &
  typeof import('../imgui/style') &
  typeof import('../imgui/windows') &
  typeof import('../imgui/scrolling') &
  typeof import('../imgui/layout') &
  typeof import('../imgui/id-stack') &
  typeof import('../imgui/text') &
  typeof import('../imgui/widgets') &
  typeof import('../imgui/images') &
  typeof import('../imgui/combo') &
  typeof import('../imgui/drag') &
  typeof import('../imgui/sliders') &
  typeof import('../imgui/inputs') &
  typeof import('../imgui/color') &
  typeof import('../imgui/trees') &
  typeof import('../imgui/selection') &
  typeof import('../imgui/plots') &
  typeof import('../imgui/menus') &
  typeof import('../imgui/tooltips') &
  typeof import('../imgui/popups') &
  typeof import('../imgui/tables') &
  typeof import('../imgui/columns') &
  typeof import('../imgui/tabs') &
  typeof import('../imgui/logging') &
  typeof import('../imgui/drag-drop') &
  typeof import('../imgui/item-state') &
  typeof import('../imgui/drawing') &
  typeof import('../imgui/viewport') &
  typeof import('../imgui/keyboard') &
  typeof import('../imgui/mouse') &
  typeof import('../imgui/settings') &
  typeof import('../imgui/memory') &
  typeof import('../imgui/io') &
  typeof import('../imgui/input-text-callback') &
  typeof import('../imgui/text-filter') &
  typeof import('../imgui/text-buffer') &
  typeof import('../imgui/storage') &
  typeof import('../imgui/list-clipper') &
  typeof import('../imgui/draw-list-state') &
  typeof import('../imgui/draw-list-shapes') &
  typeof import('../imgui/draw-list-text') &
  typeof import('../imgui/draw-list-images') &
  typeof import('../imgui/draw-list-path') &
  typeof import('../imgui/draw-list-primitives') &
  typeof import('../imgui/draw-list-internals') &
  typeof import('../imgui/draw-data') &
  typeof import('../imgui/font-glyph-ranges') &
  typeof import('../imgui/font-atlas') &
  typeof import('../imgui/fonts') &
  typeof import('../imgui/legacy');

// Defaults before required parameters produce explicit undefined unions.
// Wrappers resolve all defaults before native calls; null remains meaningful.
type NativeArguments<Arguments extends unknown[]> =
  Arguments extends [infer Head, ...infer Tail]
    ? [Exclude<Head, undefined>, ...NativeArguments<Tail>]
    : Required<Arguments>;

type MergeArguments<Left extends unknown[], Right extends unknown[]> =
  Left extends [infer LeftHead, ...infer LeftTail]
    ? Right extends [infer RightHead, ...infer RightTail]
      ? [LeftHead | RightHead, ...MergeArguments<LeftTail, RightTail>]
      : Left
    : Right;

// Text ranges expose two public overloads. Native entry points receive both
// argument forms and validate the backing-store relationship at runtime.
type NativeFunctionArguments<
  FunctionType extends (...args: never[]) => unknown,
> = FunctionType extends {
  (...args: infer First): unknown;
  (...args: infer Last): unknown;
}
  ? MergeArguments<NativeArguments<First>, NativeArguments<Last>>
  : NativeArguments<Parameters<FunctionType>>;

type ImGuiNativeFunctions = {
  [Name in keyof ImGuiFunctions]: (
    ...args: NativeFunctionArguments<ImGuiFunctions[Name]>
  ) => ReturnType<ImGuiFunctions[Name]>;
};

interface ImGuiStructViews {
  viewImDrawCmd(handle: ImDrawCmd): NativeStructMapping;
  viewImDrawData(handle: ImDrawData): NativeStructMapping;
  viewImDrawList(handle: ImDrawList): NativeStructMapping;
  viewImDrawListSplitter(handle: ImDrawListSplitter): NativeStructMapping;
  viewImFontAtlas(handle: ImFontAtlas): NativeStructMapping;
  viewImFontAtlasCustomRect(handle: ImFontAtlasCustomRect): NativeStructMapping;
  viewImFontConfig(handle: ImFontConfig): NativeStructMapping;
  viewImFontGlyph(handle: ImFontGlyph): NativeStructMapping & {
    bitfields: {
      Colored: number;
      Visible: number;
      Codepoint: number;
    };
  };
  viewImGuiIO(handle: ImGuiIO): NativeStructMapping;
  viewImGuiInputTextCallbackData(
    handle: ImGuiInputTextCallbackData,
  ): NativeStructMapping;
  viewImGuiListClipper(handle: ImGuiListClipper): NativeStructMapping;
  viewImGuiMultiSelectIO(handle: ImGuiMultiSelectIO): NativeStructMapping;
  viewImGuiPayload(handle: ImGuiPayload): NativeStructMapping;
  viewImGuiPlatformIO(handle: ImGuiPlatformIO): NativeStructMapping;
  viewImGuiSelectionBasicStorage(
    handle: ImGuiSelectionBasicStorage,
  ): NativeStructMapping;
  viewImGuiStyle(handle: ImGuiStyle): NativeStructMapping;
  viewImGuiTableSortSpecs(handle: ImGuiTableSortSpecs): NativeStructMapping;
  viewImGuiTextFilter(handle: ImGuiTextFilter): NativeStructMapping;
  viewImGuiViewport(handle: ImGuiViewport): NativeStructMapping;
}

export type ImGuiNativeBinding = ImGuiNativeFunctions & ImGuiStructViews;
