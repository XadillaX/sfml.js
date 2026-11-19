import { createRequire } from 'node:module';
import type { Touch } from '../platform/input';
import type { TranslationResult } from '../platform/system-interface';
import type {
  DocumentHeaderInit, DocumentHeaderSnapshot, DocumentHeaderResource,
  DocumentHeaderResourceInit,
} from '../dom/documents/document-header';
import type { StreamCallbacks } from '../io/stream';
import type {
  XMLParseEvent, XMLNativeParseFrame,
} from '../dom/documents/xml-parser';
import type { TextSelection } from '../dom/controls/form-control';
import type { IntrinsicDimensions } from '../dom/elements/element';
import type { Animation, Transition } from '../animation/animation-values';
import type { NativeMotion } from './animation-values';
import type { ComputedBinding } from '../generated/computed-binding';
import type { StyleStructBinding } from '../generated/style-struct-binding';
import type { NativeStyleValue } from './style-values';
import type { FontFaceHandle } from './computed';
import type { FontEffectsHandle } from '../fonts/font-engine';
import type {
  CustomFontMetrics, CustomFontFace,
} from '../fonts/font-engine-custom';
import type {
  EffectType, NativeEffectValue, NativeEffectFields, FontEffectSnapshot,
} from '../style/effects/effect-values';
import type { PropertySource } from '../style/properties/property';
import type {
  TransformPrimitive, TransformPrimitiveType,
} from '../style/values/transform';
import type { NumericValueSnapshot } from '../style/effects/decoration-values';
import type { FontGlyphMetrics } from '../fonts/font-effect';
import type { FilterOverflow } from '../style/effects/filter';
import type {
  PropertyValueResult,
} from '../style/properties/property-definition';
import type {
  NativeShorthandDefinition, ShorthandType,
} from '../style/properties/property-specification';
import type { ShorthandId } from '../generated/shorthand-ids';
import type { PropertyId } from '../generated/property-ids';
import type { RenderInterface } from '../rendering/resources';
import type { ElementRectangle } from '../dom/elements/element-utilities';
import type {
  NativeSprite, SpriteDefinitionList,
} from '../rendering/spritesheet';
import type {
  ProjectedPoint, ScrollIntoViewOptions,
} from '../dom/elements/layout';
import type { EdgeSizes, CornerSizes } from '../rendering/render-box';
import type { GeneratedTextLine, TextLine } from '../dom/elements/element-text';
import type {
  ContextNativeHandle,
  DocumentNativeHandle,
  ElementNativeHandle,
  NativeStructMapping,
  VariantVector2,
} from '../values/types';

/** @internal */
type NativePreloadFont = readonly [
  string, string, number, number, boolean, number,
];

/** @internal */
export interface NativeRmlEvent {
  handle: object;
  type: string;
  id: number;
  phase: number;
  target: ElementNativeHandle | null;
  currentTarget: ElementNativeHandle | null;
  targetId: string;
  isInterruptible: boolean;
  parameters: Record<string, unknown>;
  unprojectedMouseScreenPosition: VariantVector2;
}

/** @internal */
export interface NativeBox {
  handle: object;
  content: Float32Array;
  edges: Float32Array;
}

/** @internal */
export interface NativeElementClippingRegion {
  region: ElementRectangle | null;
  clipMask: NativeClipMaskGeometry[];
}

/** @internal */
export interface NativeClipMaskGeometry {
  operation: number;
  geometry: object;
  absoluteOffset: VariantVector2;
  transform: Float32Array | null;
}

/** @internal */
export interface NativeRenderState {
  scissorRegion: ElementRectangle | null;
  clipMaskList: NativeClipMaskGeometry[];
  transform: Float32Array;
}

/** @internal */
export interface NativeNumericValue {
  handle: object;
  numberView: Float32Array;
  unitView: Int32Array;
}

/** @internal */
export interface NativeVariant {
  handle: object;
  typeView: Uint32Array;
}

/** @internal */
export interface NativeElementTransforms {
  handle: object;
  length: number;
  matrices: Float32Array;
  flags: Uint8Array;
}

/** @internal */
export interface NativeElementCommands {
  handle: object;
  capacity: number;
  opcodes: Uint8Array;
  elements: Uint32Array;
  properties: Uint32Array;
  units: Int32Array;
  numbers: Float32Array;
  bases: Float32Array;
  outputNumbers: Float32Array;
  outputUnits: Int32Array;
  outputStatus: Uint8Array;
  progress: Uint32Array;
}

/** @internal */
export interface NativeDataBatch {
  handle: object;
  slots: Uint32Array;
  inputs: Float64Array;
  commands: NativeElementCommands;
}

/** @internal */
export interface NativeFontGlyph {
  handle: object;
  bearingView: Int32Array;
  advanceView: Int32Array;
  bitmapDimensionsView: Int32Array;
  colorFormatView: Int32Array;
}

/** @internal */
export interface NativeFontMetrics {
  sizeView: Int32Array;
  values: Float32Array;
  flags: Uint8Array;
}

/** @internal */
export interface NativeFontMeasureBuffer {
  handle: object;
  bytes: Uint8Array;
  offsets: Uint32Array;
  widths: Int32Array;
}

/** @internal */
export interface NativeTextShapingContext {
  handle: object;
  enums: Int32Array;
  values: Float32Array;
}

/** @internal */
export interface NativeProperty {
  handle: object;
  unitView: Int32Array;
  specificityView: Int32Array;
  parserIndexView: Int32Array;
}

/** @internal */
export interface NativeRenderBox {
  handle: object;
  fillSize: Float32Array;
  borderOffset: Float32Array;
  borderWidths: Float32Array;
  borderRadius: Float32Array;
}

/** @internal */
export interface NativeStringView {
  handle: object;
  length: number;
}

/** @internal */
export interface NativeStringIndex {
  offsets: Int32Array;
  characters: Uint32Array;
  startsWithContinuation: boolean;
}

interface NativeBinding extends ComputedBinding, StyleStructBinding {
  logMessage(
    type: number, format: string, values: readonly (string | number)[],
  ): void;
  logParseError(
    filename: string, line: number, format: string,
    values: readonly (string | number)[],
  ): void;
  formatTypedString(
    format: string, values: readonly (string | number)[],
  ): { value: string; length: number };
  createURL(value: string): object;
  urlSetURL(handle: object, value: string): boolean;
  urlGetURL(handle: object): string;
  urlSetProtocol(handle: object, value: string): boolean;
  urlGetProtocol(handle: object): string;
  urlSetLogin(handle: object, value: string): boolean;
  urlGetLogin(handle: object): string;
  urlSetPassword(handle: object, value: string): boolean;
  urlGetPassword(handle: object): string;
  urlSetHost(handle: object, value: string): boolean;
  urlGetHost(handle: object): string;
  urlSetPort(handle: object, value: number): boolean;
  urlGetPort(handle: object): number;
  urlSetPath(handle: object, value: string): boolean;
  urlPrefixPath(handle: object, value: string): boolean;
  urlGetPath(handle: object): string;
  urlSetFileName(handle: object, value: string): boolean;
  urlGetFileName(handle: object): string;
  urlSetExtension(handle: object, value: string): boolean;
  urlGetExtension(handle: object): string;
  urlGetPathedFileName(handle: object): string;
  urlGetQueryString(handle: object): string;
  urlGetParameters(handle: object): Record<string, string>;
  urlSetParameter(handle: object, name: string, value: string): void;
  urlSetParameters(
    handle: object, values: Readonly<Record<string, string>>,
  ): void;
  urlClearParameters(handle: object): void;
  urlLessThan(lhs: object, rhs: object): boolean;
  urlEncode(value: string): string;
  urlDecode(value: string): string;
  createStringView(
    value: string | object, offset: number, count?: number,
  ): NativeStringView;
  stringViewText(handle: object): string;
  stringViewBytes(handle: object): Uint8Array;
  stringViewIndex(handle: object): NativeStringIndex;
  stringViewOperation(
    handle: object, operation: 'equals' | 'starts' | 'ends' | 'compare',
    argument: object,
  ): boolean;
  stringViewOperation(handle: object, operation: 'length'): number;
  stringViewOperation(
    handle: object,
    operation:
    'character' | 'forward' | 'backward' | 'toBytes' | 'toCharacters',
    argument: number,
  ): number;
  convertStringOffsets(
    handle: object, input: Int32Array, output: Int32Array | undefined,
    toBytes: boolean,
  ): Int32Array;
  stringUnary(
    operation: string, value: object | string,
    search?: string | number, replacement?: string | number,
  ): string;
  expandString(
    value: object | string, delimiter: number, quote: number | undefined,
    unquote: number | undefined, ignore: boolean,
  ): string[];
  joinString(
    values: readonly string[], delimiter: number, initial: string,
  ): string;
  encodeCharacters(
    value: number | Uint32Array, byteCount: boolean,
  ): string | number;

  createPlugin(callbacks: readonly unknown[]): object;
  registerPlugin(plugin: object): void;
  unregisterPlugin(plugin: object): boolean;
  elementGetScroll(element: ElementNativeHandle): ElementNativeHandle;
  createElementScroll(element: ElementNativeHandle): object;
  releaseElementScroll(scroll: object): void;
  scrollUpdate(element: ElementNativeHandle): void;
  scrollEnableScrollbar(
    element: ElementNativeHandle, orientation: number, width: number,
  ): void;
  scrollDisableScrollbar(
    element: ElementNativeHandle, orientation: number,
  ): void;
  scrollUpdateScrollbar(
    element: ElementNativeHandle, orientation: number,
  ): void;
  scrollGetScrollbar(
    element: ElementNativeHandle, orientation: number,
  ): ElementNativeHandle | null;
  scrollGetScrollbarSize(
    element: ElementNativeHandle, orientation: number,
  ): number;
  scrollFormatScrollbars(element: ElementNativeHandle): void;
  scrollUpdateProperties(element: ElementNativeHandle): void;
  createTransformState(): object;
  elementGetTransformState(
    element: ElementNativeHandle, previous?: object,
  ): object | null;
  transformStateSetTransform(
    state: object, matrix: Float32Array | null,
  ): boolean;
  transformStateSetLocalPerspective(
    state: object, matrix: Float32Array | null,
  ): boolean;
  transformStateGetTransform(state: object): Float32Array | null;
  transformStateGetLocalPerspective(state: object): Float32Array | null;
  transformStateGetInverseTransform(state: object): Float32Array | null;
  createElementTransformBuffer(
    elements: readonly ElementNativeHandle[],
  ): NativeElementTransforms;
  refreshElementTransformBuffer(buffer: object): void;
  contextCreateDataModel(
    context: ContextNativeHandle, name: string, allowMissingVariables: boolean,
    typeRegister?: object,
  ): object | null;
  contextGetDataModel(
    context: ContextNativeHandle, name: string,
  ): object | null;
  contextGetDataModels(context: ContextNativeHandle): Record<string, object>;
  contextRemoveDataModel(context: ContextNativeHandle, name: string): boolean;
  dataModelIsValid(model: object): boolean;
  createInvalidDataModel(): object;
  createInvalidDataVariable(): object;
  createOwnedDataVariable(schema: object, initialValue?: unknown): object;
  makeLiteralIntVariable(value: number): object;
  dataVariableIsValid(variable: object): boolean;
  dataVariableGetDefinition(variable: object): object;
  dataDefinitionIsRegistered(definition: object): boolean;
  dataDefinitionIsValid(definition: object): boolean;
  dataDefinitionType(definition: object): number;
  dataDefinitionReflectMembers(definition: object): string[];
  dataModelGetAllVariables(model: object): Record<string, object>;
  createDataView(
    element: ElementNativeHandle,
    initialize: (
      model: object, element: ElementNativeHandle,
      expression: string, modifier: string,
    ) => boolean,
    update: (model: object) => boolean,
    names: () => string[], release: (() => void) | undefined, offset: number,
  ): object;
  createDataController(
    element: ElementNativeHandle,
    initialize: (
      model: object, element: ElementNativeHandle,
      expression: string, modifier: string,
    ) => boolean,
    update: undefined, names: undefined, release: (() => void) | undefined,
  ): object;
  createDataViewInstancer(
    callback: (element: ElementNativeHandle) => object | null,
  ): object;
  createDataControllerInstancer(
    callback: (element: ElementNativeHandle) => object | null,
  ): object;
  factoryRegisterDataViewInstancer(
    instancer: object, name: string, structural: boolean,
  ): void;
  factoryRegisterDataControllerInstancer(instancer: object, name: string): void;
  factoryInstanceDataView(
    name: string, element: ElementNativeHandle,
  ): object | null;
  factoryInstanceDataController(
    name: string, element: ElementNativeHandle,
  ): object | null;
  dataViewInstancerInstance(
    instancer: object, element: ElementNativeHandle,
  ): object | null;
  dataControllerInstancerInstance(
    instancer: object, element: ElementNativeHandle,
  ): object | null;
  dataViewIsValid(view: object): boolean;
  dataControllerIsValid(controller: object): boolean;
  dataViewGetElement(view: object): ElementNativeHandle | null;
  dataControllerGetElement(controller: object): ElementNativeHandle | null;
  dataViewInitialize(
    view: object, model: object, element: ElementNativeHandle,
    expression: string, modifier: string,
  ): boolean;
  dataControllerInitialize(
    controller: object, model: object, element: ElementNativeHandle,
    expression: string, modifier: string,
  ): boolean;
  dataViewUpdate(view: object, model: object): boolean;
  dataViewVariableNames(view: object): string[];
  dataViewSortOrder(view: object): number;
  releaseDataView(view: object): void;
  releaseDataController(controller: object): void;
  dataModelBind(
    model: object, name: string, value: unknown, schema?: object,
  ): boolean;
  dataModelBindAlias(model: object, name: string, target: object): boolean;
  dataModelGetTypeRegister(model: object): object;
  createDataTypeRegister(): object;
  dataRegisterScalar(
    register: object, name: string, kind: string,
  ): object | null;
  dataRegisterEnum(
    register: object, name: string, kind: string,
  ): object | null;
  dataRegisterCustom(
    register: object, name: string, type: number, callbacks: readonly unknown[],
    familyId?: number,
  ): object | null;
  dataRegisterCreateFamilyId(register: object): number;
  dataRegisterStruct(register: object, name: string): object | null;
  dataCreateStructHandle(register: object, definition: object): object;
  dataRegisterArray(
    register: object, name: string, element: object,
  ): object | null;
  dataRegisterReference(
    register: object, name: string, target: object,
  ): object | null;
  dataRegisterMember(
    schema: object, name: string, member: object,
    getter?: unknown, setter?: unknown,
  ): boolean;
  dataRegisterGetDefinition(
    register: object, name: string | number,
  ): object | null;
  dataRegisterIsValid(register: object): boolean;
  dataSchemaIsValid(schema: object): boolean;
  dataSchemaFamily(schema: object): number;
  dataSchemaType(schema: object): number;
  dataSchemaIsReference(schema: object): boolean;
  dataSchemaIsEnum(schema: object): boolean;
  dataSchemaIsCustom(schema: object): boolean;
  dataSchemaUnderlying(schema: object): object | null;
  dataVariableNumericView(variable: object): unknown;
  dataVariableResize(variable: object, count: number): boolean;
  dataVariableGetReference(variable: object): object | null;
  dataVariableGetPayload(variable: object): unknown;
  dataVariableSetReference(variable: object, target: object | null): boolean;
  dataModelApplyPatch(model: object, patches: Record<string, unknown>): boolean;
  dataModelBindFunc(
    model: object, name: string, getter: () => unknown,
    setter?: (value: unknown) => void,
  ): boolean;
  dataModelBindEventCallback(
    model: object, name: string,
    callback: (handle: object, event: NativeRmlEvent, args: unknown[]) => void,
  ): boolean;
  dataModelRegisterTransformFunc(
    model: object, name: string, callback: (args: unknown[]) => unknown,
  ): void;
  dataTransformRegister(
    register: object, name: string, callback: (args: unknown[]) => unknown,
  ): void;
  dataTransformCall(
    register: object, name: string, args: unknown[],
  ): { success: boolean; value: unknown };
  dataModelIsVariableDirty(model: object, name: string): boolean;
  dataModelDirtyVariable(model: object, name: string): void;
  dataModelDirtyAllVariables(model: object): void;
  dataModelUpdate(model: object, clearDirtyVariables: boolean): boolean;
  dataModelGetVariable(
    model: object, path: string | import('../data/data-address').DataAddress,
  ): object | null;
  dataVariableGet(variable: object): unknown;
  dataVariableSet(variable: object, value: unknown): boolean;
  dataVariableType(variable: object): number;
  dataVariableSize(variable: object): number;
  dataVariableChild(
    variable: object,
    address: string | number | import('../data/data-address').DataAddressEntry,
  ): object | null;
  dataVariableReflectMembers(variable: object): string[];
  createEventListener(
    process: (event: NativeRmlEvent) => void,
    attach?: (snapshot: { id: string; tagName: string }) => void,
    detach?: (snapshot: { id: string; tagName: string }) => void,
  ): object;
  createEventListenerInstancer(
    create: (value: string, element: ElementNativeHandle) => object | null,
  ): object;
  factoryRegisterEventListenerInstancer(instancer: object | null): void;
  factoryInstanceEventListener(
    value: string, element: ElementNativeHandle,
  ): object | null;
  eventListenerInstancerInstance(
    instancer: object, value: string, element: ElementNativeHandle,
  ): object | null;
  eventListenerProcessEvent(listener: object, event: object): void;
  eventListenerNotifyHook(
    listener: object, element: ElementNativeHandle, attach: boolean,
  ): void;
  releaseEventListener(listener: object): void;
  createDefaultEvent(): NativeRmlEvent;
  snapshotEvent(handle: object): NativeRmlEvent;
  createEventInstancer(
    create?: (
      target: ElementNativeHandle, id: number, type: string,
      parameters: Record<string, unknown>, interruptible: boolean,
    ) => object | null,
    release?: (snapshot: { type: string; id: number }) => void,
  ): object;
  factoryRegisterEventInstancer(instancer: object): void;
  factoryInstanceEvent(
    target: ElementNativeHandle, id: number, type: string,
    parameters: Record<string, unknown>, interruptible: boolean,
  ): NativeRmlEvent | null;
  eventInstancerInstanceEvent(
    instancer: object, target: ElementNativeHandle, id: number, type: string,
    parameters: Record<string, unknown>, interruptible: boolean,
  ): NativeRmlEvent | null;
  eventInstancerReleaseEvent(instancer: object, event: object): void;
  releaseOwnedEvent(event: object): void;
  setEventPhase(event: object, phase: number): void;
  setEventCurrentElement(
    event: object, element: ElementNativeHandle | null,
  ): ElementNativeHandle | null;
  createContextInstancer(
    create?: (
      name: string, manager: object, handler: object | null,
    ) => ContextNativeHandle | null,
    release?: (snapshot: { name: string }) => void,
  ): object;
  constructContext(
    name: string, manager: object, handler: object | null,
  ): ContextNativeHandle;
  getContextTextInputHandler(context: ContextNativeHandle): object | null;
  factoryRegisterContextInstancer(instancer: object): void;
  factoryInstanceContext(
    name: string, manager: object, handler: object | null,
  ): ContextNativeHandle | null;
  contextInstancerInstanceContext(
    instancer: object, name: string, manager: object, handler: object | null,
  ): ContextNativeHandle | null;
  contextInstancerReleaseContext(
    instancer: object, context: ContextNativeHandle,
  ): void;
  isTextInputHandlerValid(handler: object): boolean;
  createTextInputHandler(
    activate?: (input: object | null) => void,
    deactivate?: (input: object | null) => void,
    destroy?: (input: object | null) => void,
  ): object;
  getTextInputHandler(): object | null;
  setTextInputHandler(handler: object | null): void;
  drainTextInputEvents(handler: object): {
    kinds: Uint32Array; contexts: (object | null)[];
  };
  isTextInputContextValid(input: object): boolean;
  textInputGetBoundingBox(input: object): {
    x: number; y: number; width: number; height: number;
  } | null;
  textInputGetSelectionRange(input: object): { start: number; end: number };
  textInputSetSelectionRange(input: object, start: number, end: number): void;
  textInputSetCompositionRange(input: object, start: number, end: number): void;
  textInputSetCursorPosition(input: object, position: number): void;
  textInputSetText(
    input: object, text: string, start: number, end: number,
  ): void;
  textInputCommitComposition(input: object, text: string): void;
  factoryInstanceElement(
    parent: ElementNativeHandle | null, instancer: string, tag: string,
    attributes: Record<string, unknown>,
  ): ElementNativeHandle | null;
  factoryInstanceElementText(
    parent: ElementNativeHandle, text: string,
  ): boolean;
  factoryInstanceElementStream(
    parent: ElementNativeHandle, stream: object,
  ): boolean;
  factoryInstanceDocumentStream(
    context: ContextNativeHandle, stream: object, documentBaseTag: string,
  ): ElementNativeHandle | null;
  factoryInstanceStyleSheetString(text: string): object | null;
  factoryInstanceStyleSheetFile(filename: string): object | null;
  factoryInstanceStyleSheetStream(stream: object): object | null;
  factoryClearStyleSheetCache(): void;
  factoryClearTemplateCache(): void;
  factoryIsStructuralDataView(name: string): boolean;
  factoryGetStructuralDataViewAttributeNames(): string[];
  createElementInstancer(
    create: (
      parent: ElementNativeHandle | null, tag: string,
      attributes: Record<string, unknown>,
    ) => ElementNativeHandle | null,
    release?: (snapshot: {
      tagName: string; attributes: Record<string, unknown>;
    }) => void,
  ): object;
  createFormControlInstancer(valueAttribute: string): object;
  constructElement(
    type: string, tag: string, attributes: Record<string, unknown>,
    generation: bigint,
  ): ElementNativeHandle;
  getElementConstructionGeneration(): bigint;
  releaseOwnedElement(element: ElementNativeHandle): void;
  factoryGetElementInstancer(name: string): object | null;
  factoryRegisterElementInstancer(name: string, instancer: object | null): void;
  elementInstancerInstanceElement(
    instancer: object, parent: ElementNativeHandle | null, tag: string,
    attributes: Record<string, unknown>,
  ): ElementNativeHandle | null;
  elementInstancerReleaseElement(
    instancer: object, element: ElementNativeHandle,
  ): void;
  createStream(
    callbacks: StreamCallbacks, sourceUrl: string, mode: number,
  ): object;
  createStreamMemory(initial?: number | Uint8Array): object;
  createStreamFile(): object;
  streamOpen(stream: object, path: string): boolean;
  streamClose(stream: object): void;
  streamLength(stream: object): number;
  streamTell(stream: object): number;
  streamIsEOS(stream: object): boolean;
  streamIsReadReady(stream: object): boolean;
  streamIsWriteReady(stream: object): boolean;
  streamGetMode(stream: object): number;
  streamGetSourceURL(stream: object): string;
  streamSetSourceURL(stream: object, sourceUrl: string): void;
  streamSeek(stream: object, offset: number, origin: number): boolean;
  streamRead(
    stream: object, target: number, count: number | undefined, peek: boolean,
  ): Uint8Array;
  streamRead(
    stream: object, target: object | Uint8Array, count: number | undefined,
    peek: boolean,
  ): number;
  streamRead(
    stream: object, target: number | object | Uint8Array,
    count: number | undefined, peek: boolean,
  ): Uint8Array | number;
  streamWrite(
    stream: object, input: string | Uint8Array | object,
    count: number | undefined, operation: number,
  ): number;
  streamResize(
    stream: object, count: number, operation: number,
    offset: number | undefined,
  ): number;
  streamRaw(stream: object): Uint8Array;
  createMesh(vertexCount: number, indexCount: number): object;
  meshVertices(mesh: object): Uint8Array;
  meshIndices(mesh: object): Int32Array;
  meshIsValid(mesh: object): boolean;
  meshVertexCount(mesh: object): number;
  meshResize(mesh: object, vertexCount: number, indexCount: number): void;
  meshEquals(left: object, right: object): boolean;
  meshAllocateCommands(count: number): Float32Array;
  meshAppendCommands(
    mesh: object, commands: Float32Array, count?: number,
  ): void;
  createConvolutionFilter(): object;
  convolutionInitialise(
    filter: object, radii: number | VariantVector2, operation: number,
  ): boolean;
  convolutionKernel(filter: object, row?: number): Float32Array;
  convolutionAllocateBytes(byteLength: number): Uint8Array;
  convolutionRun(
    filter: object, destination: Uint8Array, dimensions: VariantVector2,
    stride: number, format: number, source: Uint8Array,
    sourceDimensions: VariantVector2, sourceOffset: VariantVector2,
    sourceFormat: number,
  ): void;
  createGeometry(): object;
  makeGeometry(manager: object, mesh: object): object;
  geometryIsValid(geometry: object): boolean;
  geometryGetMesh(geometry: object): object;
  releaseGeometry(geometry: object, mode: number): object;
  renderGeometry(
    geometry: object, translation: VariantVector2,
    texture?: object, shader?: object,
  ): void;
  createTexture(): object;
  loadRenderTexture(
    manager: object, source: string, documentPath: string,
  ): object;
  textureIsValid(texture: object): boolean;
  textureGetDimensions(texture: object): VariantVector2;
  textureEquals(left: object, right: object): boolean;
  createTextureSource(source: string, documentPath: string): object;
  textureSourceGetTexture(source: object, manager: object): object;
  textureSourceGetSource(source: object): string;
  textureSourceGetDefinitionSource(source: object): string;
  createCallbackTexture(): object;
  makeCallbackTexture(
    manager: object, callback: (active: object) => boolean,
  ): object;
  callbackTextureIsValid(texture: object): boolean;
  callbackTextureToTexture(texture: object): object;
  releaseCallbackTexture(texture: object): void;
  createCallbackTextureSource(
    callback?: (active: object) => boolean,
  ): object;
  callbackTextureSourceGetTexture(source: object, manager: object): object;
  callbackGenerateTexture(
    active: object, source: Uint8Array, dimensions: VariantVector2,
  ): boolean;
  callbackSaveLayerAsTexture(active: object): void;
  callbackGetRenderManager(active: object): object;
  callbackSetTextureHandle(
    active: object, handle: object, dimensions: VariantVector2,
  ): void;
  generateTextureHandle(
    manager: object, source: Uint8Array, dimensions: VariantVector2,
  ): object;
  textureHandleIsValid(handle: object): boolean;
  releaseTextureHandle(handle: object): void;
  createSpritesheetList(): object;
  spritesheetListAdd(
    list: object, name: string, imageSource: string, definitionSource: string,
    definitionLineNumber: number, displayScale: number,
    definitions: SpriteDefinitionList,
  ): boolean;
  spritesheetListGetSprite(list: object, name: string): NativeSprite | null;
  spritesheetListMerge(list: object, other: object): void;
  spritesheetListReserve(list: object, sheets: number, sprites: number): void;
  spritesheetListNumSheets(list: object): number;
  spritesheetListNumSprites(list: object): number;
  createRenderManager(renderInterface: RenderInterface): object;
  getContextRenderManager(context: ContextNativeHandle): object;
  getElementRenderManager(element: ElementNativeHandle): object | null;
  renderManagerPrepareRender(manager: object, dimensions: VariantVector2): void;
  renderManagerSetViewport(manager: object, dimensions: VariantVector2): void;
  renderManagerGetViewport(manager: object): VariantVector2;
  renderManagerSetScissorRegion(
    manager: object, region: ElementRectangle | null,
  ): void;
  renderManagerGetScissorRegion(manager: object): ElementRectangle | null;
  renderManagerDisableScissorRegion(manager: object): void;
  renderManagerSetClipMask(
    manager: object, masks: NativeClipMaskGeometry[],
  ): void;
  renderManagerSetSingleClipMask(manager: object, masks: unknown): void;
  renderManagerDisableClipMask(manager: object): void;
  renderManagerSetTransform(manager: object, matrix: Float32Array | null): void;
  renderManagerGetState(manager: object): NativeRenderState;
  renderManagerSetState(manager: object, state: NativeRenderState): void;
  renderManagerResetState(manager: object): void;
  renderManagerPushLayer(manager: object): object;
  renderManagerPopLayer(manager: object): void;
  renderManagerGetTopLayer(manager: object): object;
  renderManagerGetNextLayer(manager: object): object;
  renderManagerCompositeLayers(
    manager: object, source: object, destination: object,
    blendMode: number, filters?: object,
  ): void;
  renderManagerSaveLayerAsMaskImage(manager: object): object;
  clipMaskGeometryEquals(
    left: NativeClipMaskGeometry, right: NativeClipMaskGeometry,
  ): boolean;
  createCompiledFilter(): object;
  createCompiledShader(): object;
  compileRenderFilter(
    manager: object, name: string, parameters: unknown,
  ): object;
  compileRenderShader(
    manager: object, name: string, parameters: unknown,
  ): object;
  compiledFilterIsValid(resource: object): boolean;
  compiledShaderIsValid(resource: object): boolean;
  releaseCompiledFilter(resource: object): void;
  releaseCompiledShader(resource: object): void;
  filterCompileFilter(filter: object, element: ElementNativeHandle): object;
  createFilter(
    compile: (element: ElementNativeHandle) => object,
    overflow?: (
      element: ElementNativeHandle, value: FilterOverflow,
    ) => FilterOverflow,
  ): object;
  createFilterHandleList(): object;
  appendCompiledFilter(filter: object, list: object): void;
  filterHandleListSize(list: object): number;
  clearFilterHandleList(list: object): void;
  createFontGlyph(): NativeFontGlyph;
  weakCopyFontGlyph(handle: object): NativeFontGlyph;
  getGlyphBitmap(handle: object, owned: boolean): Uint8Array | null;
  setGlyphBitmap(handle: object, value: Uint8Array | null): void;
  createFontEffect(
    callbacks?: readonly (((...args: never[]) => unknown) | undefined)[],
  ): object;
  fillColorValuesFromAlpha(
    destination: Uint8Array, dimensions: VariantVector2, stride: number,
  ): void;
  readFontEffect<Field extends keyof FontEffectSnapshot>(
    handle: object, field: Field,
  ): FontEffectSnapshot[Field];
  writeFontEffect(
    handle: object, field: 'colour' | 'layer' | 'fingerprint', value: unknown,
  ): void;
  getGlyphMetrics(
    handle: object, glyph: object, origin?: VariantVector2,
    dimensions?: VariantVector2,
  ): FontGlyphMetrics;
  generateGlyphTexture(
    handle: object, destination: Uint8Array, dimensions: VariantVector2,
    stride: number, glyph: object,
  ): void;
  createComputedValues(element: ElementNativeHandle): object;
  getComputedValues(element: ElementNativeHandle): object;
  getFontFaceHandle(element: ElementNativeHandle): FontFaceHandle | null;
  computedCopyInherited(handle: object, source: object): void;
  computedCopyNonInherited(handle: object, source: object): void;
  computedSetHasLetterSpacing(handle: object, value: boolean): void;
  createLengthPercentage(type: number, value: number): NativeStyleValue;
  createLengthPercentageAuto(type: number, value: number): NativeStyleValue;
  createNumberAuto(type: number, value: number): NativeStyleValue;
  createVerticalAlign(type: number, value: number): NativeStyleValue;
  createLineHeight(
    value: number, type: number, inherit: number,
  ): NativeStyleValue;
  createClip(type: number, number: number): NativeStyleValue;
  resolveLengthPercentage(value: object, base: number): number;
  resolveLengthPercentageAuto(value: object, base: number): number;
  resolveLengthPercentageOr(
    value: object, base: number, fallback: number,
  ): number;
  resolveLengthPercentageAutoOr(
    value: object, base: number, fallback: number,
  ): number;
  parseEffectList(type: EffectType, value: string): NativeEffectValue;
  getDecoratorInstancer(name: string): object | null;
  getFilterInstancer(name: string): object | null;
  getFontEffectInstancer(name: string): object | null;
  registerDecoratorInstancer(name: string, instancer: object): void;
  registerFilterInstancer(name: string, instancer: object): void;
  registerFontEffectInstancer(name: string, instancer: object): void;
  decoratorInstancerSpecification(instancer: object): object;
  createDecoratorInstancer(
    callback: (
      name: string, properties: object, active: object,
    ) => object | null,
  ): object;
  decoratorInstancerRegisterProperty(
    instancer: object, name: string, value: string,
  ): object;
  decoratorInstancerRegisterShorthand(
    instancer: object, name: string, properties: string, type: ShorthandType,
  ): ShorthandId;
  instanceDecorator(
    instancer: object, name: string, properties: object, active: object,
  ): object | null;
  createStyleSheetContainer(): object;
  documentGetStyleSheetContainer(document: ElementNativeHandle): object | null;
  elementGetStyleSheet(element: ElementNativeHandle): object | null;
  documentSetStyleSheetContainer(
    document: ElementNativeHandle, container: object | null,
  ): void;
  documentReloadStyleSheet(document: ElementNativeHandle): void;
  loadStyleSheetContainer(
    container: object, source: string | object, sourceUrl: string,
    beginLine: number,
  ): boolean;
  updateCompiledStyleSheet(
    container: object, context: ContextNativeHandle,
  ): boolean;
  getCompiledStyleSheet(container: object): object | null;
  combineStyleSheetContainer(container: object, other: object): object;
  mergeStyleSheetContainer(container: object, other: object): void;
  combineStyleSheet(sheet: object, other: object): object;
  mergeStyleSheet(sheet: object, other: object): void;
  styleSheetBuildNodeIndex(sheet: object): void;
  styleSheetInstanceDecorators(
    sheet: object, manager: object, declarations: NativeEffectValue,
    source: PropertySource | null,
  ): object[];
  styleSheetGetElementDefinition(
    sheet: object, element: ElementNativeHandle,
  ): object | null;
  elementDefinitionGetProperty(
    definition: object, id: PropertyId,
  ): NativeProperty | null;
  elementDefinitionGetCustomProperty(
    definition: object, name: string,
  ): NativeProperty | null;
  elementDefinitionGetProperties(definition: object): object;
  elementDefinitionGetPropertyIds(definition: object): PropertyId[];
  styleSheetGetSprite(sheet: object, name: string): NativeSprite | null;
  styleSheetGetNamedDecorator(sheet: object, name: string): {
    type: string;
    instancer: object | null;
    properties: object;
  } | null;
  styleSheetGetKeyframes(sheet: object, name: string): {
    propertyIds: PropertyId[];
    blocks: { normalizedTime: number; properties: object }[];
  } | null;
  createDecoratorInterface(
    manager: object, sheet: object, source: PropertySource | null,
  ): object;
  decoratorInterfaceGetSprite(
    active: object, name: string,
  ): NativeSprite | null;
  decoratorInterfaceGetTexture(active: object, filename: string): object;
  decoratorInterfaceGetRenderManager(active: object): object;
  createDecorator(
    manager: object,
    generate: (element: ElementNativeHandle, area: number) => object | null,
    render: (element: ElementNativeHandle, data: object) => void,
    release: (data: object) => void,
  ): object;
  decoratorAddTexture(decorator: object, texture: object): number;
  decoratorGetNumTextures(decorator: object): number;
  decoratorGetTexture(decorator: object, index: number): object;
  decoratorGenerateElementData(
    decorator: object, element: ElementNativeHandle, paintArea: number,
  ): object | null;
  decoratorRenderElement(
    decorator: object, element: ElementNativeHandle, data: object,
  ): void;
  decoratorReleaseElementData(decorator: object, data: object): void;
  decoratorDataIsValid(data: object): boolean;
  filterInstancerSpecification(instancer: object): object;
  fontEffectInstancerSpecification(instancer: object): object;
  createFontEffectInstancer(
    callback: (name: string, properties: object) => object | null,
  ): object;
  fontEffectInstancerRegisterProperty(
    instancer: object, name: string, value: string, affectsGeneration: boolean,
  ): object;
  fontEffectInstancerRegisterShorthand(
    instancer: object, name: string, properties: string, type: ShorthandType,
  ): ShorthandId;
  instanceFontEffect(
    instancer: object, name: string, properties: object,
  ): object | null;
  createFilterInstancer(
    callback: (name: string, properties: object) => object | null,
  ): object;
  filterInstancerRegisterProperty(
    instancer: object, name: string, value: string,
  ): object;
  filterInstancerRegisterShorthand(
    instancer: object, name: string, properties: string, type: ShorthandType,
  ): ShorthandId;
  instanceFilter(
    instancer: object, name: string, properties: object,
  ): object | null;
  filterExtendInkOverflow(
    filter: object, element: ElementNativeHandle, overflow: FilterOverflow,
  ): FilterOverflow;
  createEffectList(
    type: EffectType, values: unknown[], text: string,
  ): NativeEffectValue;
  writeEffectList(
    handle: object, field: 'value' | 'list', value: unknown,
  ): void;
  readEffectList<Field extends keyof NativeEffectFields>(
    handle: object, field: Field,
  ): NativeEffectFields[Field];
  makeAnimation(fields: unknown): NativeMotion<Animation>;
  makeTransition(fields: unknown): NativeMotion<Transition>;
  makeTransitionList(fields: unknown): unknown;
  animationEquals(a: unknown, b: unknown): boolean;
  transitionEquals(a: unknown, b: unknown): boolean;
  transitionListEquals(a: unknown, b: unknown): boolean;
  createTween(
    type: number | ((t: number) => number), direction: number | undefined,
    dual: boolean,
  ): object;
  cloneTween(tween: object): object;
  evaluateTween(tween: object, t: number): number;
  reverseTween(tween: object): void;
  tweenToString(tween: object): string;
  tweenEquals(tween: object, other: object): boolean;
  tweenNotEquals(tween: object, other: object): boolean;
  animate(
    element: ElementNativeHandle, property: string | number, target: object,
    duration: number, tween: object | undefined, iterations: number,
    alternate: boolean, delay: number, start: object | null,
  ): boolean;
  addAnimationKey(
    element: ElementNativeHandle, property: string | number, target: object,
    duration: number, tween: object | undefined,
  ): boolean;
  createVariant(value: unknown): NativeVariant;
  cloneVariant(value: object): NativeVariant;
  moveVariant(value: object): NativeVariant;
  assignVariant(value: object, input: unknown): void;
  moveAssignVariant(value: object, source: object): void;
  clearVariant(value: object): void;
  variantValue(value: object): unknown;
  variantReference(value: object, type: number): unknown;
  variantGet(value: object, fallback: unknown): unknown;
  variantGetInto(
    value: object, fallback: unknown,
  ): { success: boolean; value: unknown };
  variantElement(value: object): ElementNativeHandle | null;
  variantEquals(left: object, right: object): boolean;
  variantNotEquals(left: object, right: object): boolean;
  createProperty(
    value?: unknown, unit?: number, specificity?: number,
  ): NativeProperty;
  cloneProperty(property: object): NativeProperty;
  propertyEquals(property: object, other: object): boolean;
  propertyNotEquals(property: object, other: object): boolean;
  propertyToString(property: object): string;
  propertyGetNumericValue(property: object): NativeNumericValue;
  propertyGet(property: object, type: unknown): unknown;
  propertyGetValue(property: object): unknown;
  propertyGetElementValue(property: object): ElementNativeHandle | null;
  propertySetValue(property: object, value: unknown): void;
  propertyGetDefinition(property: object): object | null;
  propertySetDefinition(property: object, definition: object | null): void;
  propertyGetSource(property: object): PropertySource | null;
  propertySetSource(property: object, source: PropertySource | null): void;
  createPropertyDictionary(): object;
  createPropertyParser(callback: (
    property: NativeProperty, value: string, parameters: Record<string, number>,
  ) => boolean): object;
  parserParseValue(
    parser: object, property: object, value: string,
    parameters: Record<string, number>,
  ): boolean;
  styleRegisterParser(name: string, parser: object): boolean;
  styleGetParser(name: string): object | null;
  styleGetPropertySpecification(): object;
  styleRegisterProperty(
    name: string, defaultValue: string, inherited: boolean,
    forcesLayout: boolean,
  ): object;
  styleRegisterShorthand(
    name: string, properties: string, type: number,
  ): number;
  styleGetPropertyId(name: string): number;
  styleGetShorthandId(name: string): number;
  styleGetPropertyName(id: number): string;
  styleGetShorthandName(id: number): string;
  styleGetShorthandUnderlyingProperties(id: number): number[];
  createPropertySpecification(properties: number, shorthands: number): object;
  specificationRegisterProperty(
    specification: object, name: string, defaultValue: string,
    inherited: boolean, forcesLayout: boolean, id: number,
  ): object;
  specificationGetProperty(
    specification: object, nameOrId: string | number,
  ): object | null;
  specificationGetRegisteredProperties(specification: object): number[];
  specificationGetRegisteredInheritedProperties(
    specification: object,
  ): number[];
  specificationGetRegisteredPropertiesForcingLayout(
    specification: object,
  ): number[];
  specificationRegisterShorthand(
    specification: object, name: string, properties: string,
    type: number, id: number,
  ): number;
  specificationGetShorthand(
    specification: object, nameOrId: string | number,
  ): NativeShorthandDefinition | null;
  specificationParsePropertyDeclaration(
    specification: object, dictionary: object, nameOrId: string | number,
    value: string,
  ): boolean;
  specificationParseShorthandDeclaration(
    specification: object, dictionary: object, id: number, value: string,
  ): boolean;
  specificationSetDefaults(specification: object, dictionary: object): void;
  specificationPropertiesToString(
    specification: object, dictionary: object, includeName: boolean,
    delimiter: string,
  ): string;
  dictionarySetProperty(dictionary: object, id: number, property: object): void;
  dictionarySetCustomProperty(
    dictionary: object, name: string, property: object,
  ): void;
  dictionarySetVarShorthand(
    dictionary: object, id: number, property: object,
  ): void;
  dictionaryGetProperty(dictionary: object, id: number): NativeProperty | null;
  dictionaryGetCustomProperty(
    dictionary: object, name: string,
  ): NativeProperty | null;
  dictionaryGetVarShorthand(
    dictionary: object, id: number,
  ): NativeProperty | null;
  dictionaryRemoveProperty(dictionary: object, id: number): void;
  dictionaryRemoveCustomProperty(dictionary: object, name: string): boolean;
  dictionaryRemoveVarShorthand(dictionary: object, id: number): boolean;
  dictionaryGetProperties(dictionary: object): [number, NativeProperty][];
  dictionaryGetCustomProperties(dictionary: object): [string, NativeProperty][];
  dictionaryGetVarShorthands(dictionary: object): [number, NativeProperty][];
  dictionaryEmpty(dictionary: object): boolean;
  dictionaryGetNumProperties(dictionary: object): number;
  dictionaryClear(dictionary: object): void;
  dictionaryImport(
    dictionary: object, source: object, specificity: number,
  ): void;
  dictionaryMerge(dictionary: object, source: object, offset: number): void;
  dictionarySetSource(dictionary: object, source: PropertySource | null): void;
  createPropertyDefinition(
    id: number, value: string, inherited: boolean, forcesLayout: boolean,
  ): object;
  definitionAddParser(
    definition: object, name: string, parameters: string,
  ): void;
  definitionSetRelativeTarget(definition: object, target: number): void;
  definitionParseValue(
    definition: object, property: object, value: string,
  ): boolean;
  definitionGetValue(definition: object, property: object): PropertyValueResult;
  definitionDefaultValue(definition: object): NativeProperty;
  definitionIsInherited(definition: object): boolean;
  definitionIsLayoutForced(definition: object): boolean;
  definitionGetId(definition: object): number;
  definitionGetRelativeTarget(definition: object): number;
  getProperty(
    element: ElementNativeHandle, key: string | number,
  ): NativeProperty | null;
  getProperty(
    element: ElementNativeHandle, key: string | number, type: unknown,
  ): unknown;
  getLocalProperty(
    element: ElementNativeHandle, key: string | number,
  ): NativeProperty | null;
  getLocalStyleProperties(
    element: ElementNativeHandle,
  ): Array<[number, NativeProperty]>;
  iterateLocalProperties(
    element: ElementNativeHandle, filter: ElementNativeHandle | null,
  ): Array<[string, NativeProperty]>;
  setTypedProperty(
    element: ElementNativeHandle, id: number, property: object,
  ): boolean;
  removeTypedProperty(element: ElementNativeHandle, id: number): void;
  createNumericValue(number?: number, unit?: number): NativeNumericValue;
  createElementCommands(
    context: ContextNativeHandle, elements: readonly ElementNativeHandle[],
    capacity: number,
  ): NativeElementCommands;
  createDataBatch(
    model: object, elements: readonly object[], expressions: readonly string[],
    update: (count: number) => number, sortOffset: number,
    commandCapacity: number,
  ): NativeDataBatch;
  releaseDataBatch(batch: object): void;
  submitElementCommands(handle: object, count: number): number;
  reserveElementCommands(
    handle: object, capacity: number,
  ): Omit<NativeElementCommands, 'handle' | 'progress'>;
  replaceCommandElements(
    handle: object, elements: readonly ElementNativeHandle[],
  ): void;
  createTransform(primitives: readonly TransformPrimitive[]): object;
  transformGetPrimitives(transform: object): TransformPrimitive[];
  transformSetPrimitives(
    transform: object, primitives: readonly TransformPrimitive[],
  ): void;
  transformGetPrimitive(transform: object, index: number): TransformPrimitive;
  transformGetNumPrimitives(transform: object): number;
  transformAddPrimitive(
    transform: object, primitive: TransformPrimitive,
  ): void;
  transformClearPrimitives(transform: object): void;
  transformMakeProperty(
    primitives: readonly TransformPrimitive[],
  ): NativeProperty;
  makeTransformPrimitive(
    type: TransformPrimitiveType, values: readonly NumericValueSnapshot[],
  ): TransformPrimitive;
  cloneNumericValue(value: object): NativeNumericValue;
  numericValueEquals(value: object, other: object): boolean;
  numericValueNotEquals(value: object, other: object): boolean;
  resolveLength(element: ElementNativeHandle, value: object): number;
  resolveNumericValue(
    element: ElementNativeHandle, value: object, baseValue: number,
  ): number;
  readonly boxNumAreas: number;
  readonly boxNumEdges: number;
  createBox(content?: VariantVector2): NativeBox;
  utilitiesGetElementById(
    root: ElementNativeHandle, id: string,
  ): ElementNativeHandle | null;
  utilitiesGetElementsByTagName(
    root: ElementNativeHandle, tag: string, stopTag: string,
  ): ElementNativeHandle[];
  utilitiesGetElementsByClassName(
    root: ElementNativeHandle, className: string,
  ): ElementNativeHandle[];
  utilitiesGetDensityIndependentPixelRatio(
    element: ElementNativeHandle,
  ): number;
  utilitiesGetStringWidth(
    element: ElementNativeHandle, text: string, priorCharacter: number,
  ): number;
  utilitiesGetClippingRegion(
    element: ElementNativeHandle, includeClipMask: boolean,
    forceClipSelf: boolean,
  ): NativeElementClippingRegion;
  utilitiesSetClippingRegion(
    element: ElementNativeHandle, forceClipSelf: boolean,
  ): boolean;
  utilitiesGetBoundingBox(
    element: ElementNativeHandle, area: number,
  ): ElementRectangle | null;
  utilitiesFormatElement(
    element: ElementNativeHandle, containingBlock: VariantVector2,
  ): void;
  utilitiesBuildBox(
    containingBlock: VariantVector2, element: ElementNativeHandle,
    inlineElement: boolean,
  ): NativeBox;
  utilitiesPositionElement(
    element: ElementNativeHandle, offset: VariantVector2, anchor: number,
  ): boolean;
  utilitiesApplyTransform(element: ElementNativeHandle): boolean;
  utilitiesApplyDataViewsControllers(element: ElementNativeHandle): boolean;
  cloneBox(box: object): NativeBox;
  boxGetSize(box: object, area?: number): VariantVector2;
  boxGetPosition(box: object, area: number): VariantVector2;
  boxGetFrameSize(box: object, area: number): VariantVector2;
  boxSetContent(box: object, content: VariantVector2): void;
  boxSetEdge(box: object, area: number, edge: number, size: number): void;
  boxGetEdge(box: object, area: number, edge: number): number;
  boxGetCumulativeEdge(box: object, area: number, edge: number): number;
  boxGetSizeAcross(
    box: object, direction: number, area: number, areaEnd: number,
  ): number;
  boxEquals(box: object, other: object): boolean;
  boxNotEquals(box: object, other: object): boolean;
  createRenderBox(
    fillSize: VariantVector2, borderOffset: VariantVector2,
    borderWidths: EdgeSizes, borderRadius: CornerSizes,
  ): NativeRenderBox;
  cloneRenderBox(box: object): NativeRenderBox;
  renderBoxGetFillSize(box: object): VariantVector2;
  renderBoxGetFillOffset(box: object): VariantVector2;
  renderBoxGetBorderOffset(box: object): VariantVector2;
  renderBoxGetBorderWidths(box: object): EdgeSizes;
  renderBoxGetBorderRadius(box: object): CornerSizes;
  renderBoxSetFillSize(box: object, value: VariantVector2): void;
  renderBoxSetBorderOffset(box: object, value: VariantVector2): void;
  renderBoxSetBorderWidths(box: object, value: EdgeSizes): void;
  renderBoxSetBorderRadius(box: object, value: CornerSizes): void;
  renderBoxEquals(box: object, other: object): boolean;
  renderBoxNotEquals(box: object, other: object): boolean;
  getBox(element: ElementNativeHandle): NativeBox;
  getBox(
    element: ElementNativeHandle, index: number,
  ): { box: NativeBox; offset: VariantVector2 };
  setBox(element: ElementNativeHandle, box: object): void;
  addBox(
    element: ElementNativeHandle, box: object, offset: VariantVector2,
  ): void;
  getNumBoxes(element: ElementNativeHandle): number;
  getRenderBox(
    element: ElementNativeHandle, area: number, index: number,
  ): NativeRenderBox;
  readonly errorState: { prototype: unknown };
  initialise(window: object, fileRoot?: string, highDpi?: boolean): boolean;
  debuggerInitialise(host: ContextNativeHandle): boolean;
  debuggerShutdown(): void;
  debuggerSetContext(target: ContextNativeHandle | null): boolean;
  debuggerSetVisible(visible: boolean): void;
  debuggerIsVisible(): boolean;
  createSystemInterface(window: object, functions: unknown[]): object;
  getSystemClock(system: object): Float64Array;
  getSystemInterface(): object | null;
  setSystemInterface(system: object | null): void;
  systemGetElapsedTime(system: object): number;
  systemTranslateString(system: object, input: string): TranslationResult;
  systemJoinPath(
    system: object, documentPath: string, resourcePath: string,
  ): string;
  systemLogMessage(system: object, type: number, message: string): boolean;
  systemSetMouseCursor(system: object, name: string): void;
  systemSetClipboardText(system: object, text: string): void;
  systemGetClipboardText(system: object): string;
  systemActivateKeyboard(
    system: object, x: number, y: number, lineHeight: number,
  ): void;
  systemDeactivateKeyboard(system: object): void;
  createFileInterface(root: string, functions: unknown[]): object;
  getFileInterface(): object | null;
  setFileInterface(provider: object | null): void;
  fileOpen(provider: object, path: string): object | null;
  fileClose(provider: object, file: object): void;
  fileRead(
    provider: object, output: Uint8Array, size: number, file: object,
  ): number;
  fileSeek(
    provider: object, file: object, offset: number, origin: number,
  ): boolean;
  fileTell(provider: object, file: object): number;
  fileLength(provider: object, file: object): number;
  fileLoad(provider: object, path: string): Uint8Array | null;
  shutdown(): void;
  getVersion(): string;
  getStaticClassIdentifier(name: string): number;
  getClassIdentifier(element: ElementNativeHandle): number;
  isClass(element: ElementNativeHandle, identifier: number): boolean;
  getElementScriptObject(element: ElementNativeHandle): object | null;
  getEventScriptObject(event: object): object | null;
  getContextScriptObject(context: ContextNativeHandle): object | null;
  setElementScriptObject(
    element: ElementNativeHandle, object: object | null,
  ): void;
  setEventScriptObject(event: object, object: object | null): void;
  setContextScriptObject(
    context: ContextNativeHandle, object: object | null,
  ): void;
  releaseScriptContext(context: ContextNativeHandle): void;
  processDefaultAction(element: ElementNativeHandle, event: object): void;
  loadFontFace(
    source: string | Uint8Array, familyOrFallback?: string | boolean,
    styleOrWeight?: number, weightOrIndex?: number,
    fallback?: boolean, faceIndex?: number,
  ): boolean;
  releaseFontResources(): void;
  getCapabilities(): import('../runtime/capabilities').RmlUiCapabilities;
  createFontEngineInterface(
    callbacks?: readonly unknown[] | string | null,
  ): object;
  fontEngineGetKind(
    engine: object,
  ): import('../fonts/font-engine-kind').FontEngineKind;
  fontEngineRegisterLanguage(
    engine: object, language: string, script: string, direction: string,
  ): void;
  fontEngineCreateFace(
    engine: object, metrics: CustomFontMetrics,
    advances: Int32Array | null, firstCharacter: number,
    fallbackAdvance: number,
  ): CustomFontFace;
  getFontEngineInterface(): object | null;
  setFontEngineInterface(engine: object | null): void;
  fontEngineLoadFontFace(
    engine: object, source: string | Uint8Array,
    familyOrFallback?: string | boolean, styleOrWeight?: number,
    weightOrIndex?: number, fallback?: boolean, faceIndex?: number,
  ): boolean;
  fontEngineGetFace(
    engine: object, family: string, style: number, weight: number, size: number,
  ): FontFaceHandle | null;
  fontEngineGetMetrics(engine: object, face: FontFaceHandle): NativeFontMetrics;
  fontEnginePrepareEffects(
    engine: object, face: FontFaceHandle, effects: object[],
  ): FontEffectsHandle;
  fontEngineGetWidth(
    engine: object, face: FontFaceHandle, string: string,
    shaping: object | null, priorCharacter: number,
  ): number;
  fontEngineGetWidths(
    engine: object, face: FontFaceHandle, strings: readonly string[],
    shaping: object | null, priorCharacter: number,
  ): Int32Array;
  createFontMeasureBuffer(
    capacity: number, byteCapacity: number,
  ): NativeFontMeasureBuffer;
  fontEngineMeasureStrings(
    engine: object, face: FontFaceHandle, buffer: object,
    shaping: object | null, priorCharacter: number, count: number,
  ): void;
  fontEngineGenerateString(
    engine: object, manager: object, face: FontFaceHandle,
    effects: FontEffectsHandle | null, string: string, x: number, y: number,
    colour: number, opacity: number, shaping: object | null,
  ): { width: number; meshes: Array<{ mesh: object; texture: object }> };
  fontEngineGetVersion(engine: object, face: FontFaceHandle): number;
  fontEngineReleaseResources(engine: object): void;
  createTextShapingContext(language: string): NativeTextShapingContext;
  shapingGetLanguage(shaping: object): string;
  shapingSetLanguage(shaping: object, language: string): void;
  preloadResources(
    textures: readonly string[],
    fonts: readonly NativePreloadFont[],
    renderer?: RenderInterface,
  ): { id: number; promise: Promise<void> };
  cancelResourcePreload(id: number): void;
  createRenderInterface(window: object): RenderInterface;
  getRenderInterface(): RenderInterface | null;
  setRenderInterface(renderer: RenderInterface | null): void;
  getContextRenderInterface(context: ContextNativeHandle): RenderInterface;
  getTextureSourceList(): string[];
  releaseTexture(
    source: string, renderInterface?: RenderInterface | null,
  ): boolean;
  releaseTextures(renderInterface?: RenderInterface | null): void;
  releaseCompiledGeometry(renderInterface?: RenderInterface | null): void;
  releaseRenderManagers(): void;

  createContext(
    name: string, width: number, height: number,
    renderInterface?: RenderInterface | null,
    textInputHandler?: object | null,
  ): ContextNativeHandle;
  removeContext(context: ContextNativeHandle | string): boolean;
  getContext(nameOrIndex: string | number): ContextNativeHandle | null;
  getNumContexts(): number;
  getContextName(context: ContextNativeHandle): string;
  getRootElement(context: ContextNativeHandle): ElementNativeHandle;
  createDocument(
    context: ContextNativeHandle, instancerName: string,
  ): DocumentNativeHandle | null;
  getDocument(
    context: ContextNativeHandle, idOrIndex: string | number,
  ): DocumentNativeHandle | null;
  getNumDocuments(context: ContextNativeHandle): number;
  unloadDocument(
    context: ContextNativeHandle, document: DocumentNativeHandle,
  ): void;
  unloadAllDocuments(context: ContextNativeHandle): void;
  pullDocumentToFront(
    context: ContextNativeHandle, document: DocumentNativeHandle,
  ): void;
  pushDocumentToBack(
    context: ContextNativeHandle, document: DocumentNativeHandle,
  ): void;
  unfocusDocument(
    context: ContextNativeHandle, document: DocumentNativeHandle,
  ): void;
  getHoverElement(context: ContextNativeHandle): ElementNativeHandle | null;
  getFocusElement(context: ContextNativeHandle): ElementNativeHandle | null;
  getElementAtPoint(
    context: ContextNativeHandle, point: VariantVector2,
    ignore: ElementNativeHandle | null, element: ElementNativeHandle | null,
  ): ElementNativeHandle | null;
  setDocumentsBaseTag(context: ContextNativeHandle, tag: string): void;
  getDocumentsBaseTag(context: ContextNativeHandle): string;
  setDefaultScrollBehavior(
    context: ContextNativeHandle, behavior: number, speedFactor: number,
  ): void;
  setDimensions(
    context: ContextNativeHandle, width: number, height: number,
  ): void;
  viewDimensions(context: ContextNativeHandle): NativeStructMapping;
  getDensityIndependentPixelRatio(context: ContextNativeHandle): number;
  setDensityIndependentPixelRatio(
    context: ContextNativeHandle, ratio: number | null,
  ): void;
  requestNextUpdate(context: ContextNativeHandle, delay: number): void;
  getNextUpdateDelay(context: ContextNativeHandle): number;
  enableMouseCursor(context: ContextNativeHandle, enable: boolean): void;
  activateTheme(
    context: ContextNativeHandle, name: string, activate: boolean,
  ): void;
  isThemeActive(context: ContextNativeHandle, name: string): boolean;
  update(context: ContextNativeHandle): boolean;
  render(context: ContextNativeHandle): boolean;
  processEvent(
    context: ContextNativeHandle, event: object,
  ): boolean;
  processKeyDown(
    context: ContextNativeHandle, key: number, modifiers: number,
  ): boolean;
  processKeyUp(
    context: ContextNativeHandle, key: number, modifiers: number,
  ): boolean;
  processTextInput(
    context: ContextNativeHandle, text: string | number,
  ): boolean;
  processTextInputChar(context: ContextNativeHandle, byte: number): boolean;
  processMouseMove(
    context: ContextNativeHandle, x: number, y: number, modifiers: number,
  ): boolean;
  processMouseButtonDown(
    context: ContextNativeHandle, button: number, modifiers: number,
  ): boolean;
  processMouseButtonUp(
    context: ContextNativeHandle, button: number, modifiers: number,
  ): boolean;
  processMouseWheel(
    context: ContextNativeHandle,
    delta: VariantVector2 | number, modifiers: number,
  ): boolean;
  processMouseLeave(context: ContextNativeHandle): boolean;
  isMouseInteracting(context: ContextNativeHandle): boolean;
  processTouchStart(
    context: ContextNativeHandle, touches: readonly Touch[], modifiers: number,
  ): boolean;
  processTouchMove(
    context: ContextNativeHandle, touches: readonly Touch[], modifiers: number,
  ): boolean;
  processTouchEnd(
    context: ContextNativeHandle, touches: readonly Touch[], modifiers: number,
  ): boolean;
  processTouchCancel(
    context: ContextNativeHandle, touches: readonly Touch[],
  ): boolean;

  loadDocument(
    context: ContextNativeHandle, documentPath: string | object,
  ): DocumentNativeHandle;
  createDocumentScriptHost(
    execute: (
      document: DocumentNativeHandle, context: ContextNativeHandle,
      content: string, source: string, line: number, external: boolean,
    ) => object,
    resolveHandler: (
      document: DocumentNativeHandle, name: string,
    ) => { session: object; callback: (event: NativeRmlEvent) => unknown },
    allowInline: boolean, allowExternal: boolean,
  ): object;
  createLuaScriptHost(allowInline: boolean, allowExternal: boolean): object;
  executeLuaScript(
    host: object, source: string, path: string, line: number,
  ): void;
  callLuaFunction(
    host: object, name: string,
    args: import('../scripting/lua/lua-scripts').LuaScalar[],
  ): import('../scripting/lua/lua-scripts').LuaScalar;
  compileLuaFunction(
    host: object, source: string, path: string, line: number,
  ): object;
  captureLuaFunction(host: object, name: string): object;
  invokeLuaFunction(
    reference: object, args: import('../scripting/lua/lua-scripts').LuaScalar[],
    count: number,
  ): import('../scripting/lua/lua-scripts').LuaScalar[];
  releaseLuaFunction(reference: object): void;
  executeLuaFile(host: object, path: string): void;
  getLuaGlobal(
    host: object, name: string,
  ): import('../scripting/lua/lua-scripts').LuaScalar;
  setLuaGlobal(
    host: object, name: string,
    value: import('../scripting/lua/lua-scripts').LuaScalar,
  ): void;
  setDocumentScriptHost(
    context: ContextNativeHandle, host: object | null,
  ): void;
  loadDocumentInlineScript(
    document: DocumentNativeHandle, content: string, path: string, line: number,
  ): void;
  loadDocumentExternalScript(
    document: DocumentNativeHandle, path: string,
  ): void;
  loadDocumentFromMemory(
    context: ContextNativeHandle, rml: string, sourceUrl?: string,
  ): DocumentNativeHandle;
  unloadDocumentHandle(document: DocumentNativeHandle): void;
  createDocumentHeader(input: DocumentHeaderInit): object;
  replaceDocumentHeader(header: object, input: DocumentHeaderInit): void;
  documentHeaderSnapshot(header: object): DocumentHeaderSnapshot;
  createXMLBaseParser(callbacks: readonly [
    ((parser: object, name: string,
      attributes: Record<string, unknown>) => void) | undefined,
    ((parser: object, name: string) => void) | undefined,
    ((parser: object, data: string, type: number) => void) | undefined,
  ]): object;
  createXMLParser(root: ElementNativeHandle): object;
  createXMLNodeHandler(callbacks: readonly [
    (parser: object, name: string,
      attributes: Record<string, unknown>) => ElementNativeHandle | null,
    (parser: object, name: string) => boolean,
    (parser: object, data: string, type: number) => boolean,
  ] | null): object;
  xmlRegisterNodeHandler(tag: string, handler: object | null): object | null;
  xmlGetNodeHandler(tag: string): object | null;
  xmlRegisterPersistentCDATATag(tag: string): void;
  xmlRegisterCDATATag(parser: object, tag: string): void;
  xmlRegisterInnerXMLAttribute(parser: object, name: string): void;
  xmlIsCDATATag(parser: object, tag: string): boolean;
  xmlParse(parser: object, stream: object, collect: false): void;
  xmlParse(parser: object, stream: object, collect: true): XMLParseEvent[];
  xmlGetLineNumber(parser: object): number;
  xmlGetLineNumberOpenTag(parser: object): number;
  xmlGetSourceURL(parser: object): string;
  xmlGetParseFrame(parser: object): XMLNativeParseFrame;
  xmlGetDocumentHeader(parser: object): object;
  xmlSetDocumentHeader(parser: object, header: object): void;
  xmlHandleElementStart(
    parser: object, name: string, attributes: Record<string, unknown>,
  ): void;
  xmlHandleElementEnd(parser: object, name: string): void;
  xmlHandleData(parser: object, data: string, type: number): void;
  xmlPushHandler(parser: object, tag: string): boolean;
  xmlPushDefaultHandler(parser: object): void;
  xmlNodeElementStart(
    handler: object, parser: object, name: string,
    attributes: Record<string, unknown>,
  ): ElementNativeHandle | null;
  xmlNodeElementEnd(handler: object, parser: object, name: string): boolean;
  xmlNodeElementData(
    handler: object, parser: object, data: string, type: number,
  ): boolean;
  documentHeaderGetSource(header: object): string;
  documentHeaderSetSource(header: object, source: string): void;
  documentHeaderGetTitle(header: object): string;
  documentHeaderSetTitle(header: object, title: string): void;
  documentHeaderGetTemplates(header: object): string[];
  documentHeaderSetTemplates(header: object, paths: readonly string[]): void;
  documentHeaderGetRcss(header: object): DocumentHeaderResource[];
  documentHeaderSetRcss(
    header: object, resources: readonly DocumentHeaderResourceInit[],
  ): void;
  documentHeaderGetScripts(header: object): DocumentHeaderResource[];
  documentHeaderSetScripts(
    header: object, resources: readonly DocumentHeaderResourceInit[],
  ): void;
  documentHeaderMergeHeader(target: object, source: object): void;
  documentHeaderMergePaths(
    header: object, target: readonly string[], source: readonly string[],
    basePath: string,
  ): string[];
  documentHeaderMergeResources(
    header: object, target: readonly DocumentHeaderResourceInit[],
    source: readonly DocumentHeaderResourceInit[],
  ): DocumentHeaderResource[];
  processDocumentHeader(document: DocumentNativeHandle, header: object): void;
  showDocument(
    document: DocumentNativeHandle, modal: boolean | number,
    focus: number, scroll: number,
  ): void;
  getDocumentContext(
    document: DocumentNativeHandle,
  ): ContextNativeHandle | null;
  isDocumentModal(document: DocumentNativeHandle): boolean;
  pullToFront(document: DocumentNativeHandle): void;
  pushToBack(document: DocumentNativeHandle): void;
  updateDocument(document: DocumentNativeHandle): void;
  findNextTabElement(
    document: DocumentNativeHandle, current: ElementNativeHandle,
    forward: boolean, wrapAround: boolean,
  ): ElementNativeHandle | null;
  hideDocument(document: DocumentNativeHandle): void;
  closeDocument(document: DocumentNativeHandle): void;
  getDocumentTitle(document: DocumentNativeHandle): string;
  setDocumentTitle(document: DocumentNativeHandle, title: string): void;
  getDocumentSourceURL(document: DocumentNativeHandle): string;
  createElement(
    document: DocumentNativeHandle, name: string,
  ): ElementNativeHandle | null;
  createTextNode(
    document: DocumentNativeHandle, text: string,
  ): ElementNativeHandle | null;

  getParentNode(element: ElementNativeHandle): ElementNativeHandle | null;
  getNextSibling(element: ElementNativeHandle): ElementNativeHandle | null;
  getPreviousSibling(
    element: ElementNativeHandle,
  ): ElementNativeHandle | null;
  getFirstChild(element: ElementNativeHandle): ElementNativeHandle | null;
  getLastChild(element: ElementNativeHandle): ElementNativeHandle | null;
  getChild(
    element: ElementNativeHandle, index: number,
  ): ElementNativeHandle | null;
  getNumChildren(element: ElementNativeHandle, includeNonDom: boolean): number;
  hasChildNodes(element: ElementNativeHandle): boolean;
  closest(
    element: ElementNativeHandle, selector: string,
  ): ElementNativeHandle | null;
  matches(element: ElementNativeHandle, selector: string): boolean;
  contains(
    element: ElementNativeHandle, other: ElementNativeHandle | null,
  ): boolean;
  querySelectorAll(
    element: ElementNativeHandle, selector: string,
  ): ElementNativeHandle[];
  getElementsByTagName(
    element: ElementNativeHandle, tag: string,
  ): ElementNativeHandle[];
  getElementsByClassName(
    element: ElementNativeHandle, name: string,
  ): ElementNativeHandle[];
  cloneElement(element: ElementNativeHandle): ElementNativeHandle | null;
  appendChild(
    element: ElementNativeHandle, child: ElementNativeHandle,
    domElement: boolean,
  ): ElementNativeHandle;
  insertBefore(
    element: ElementNativeHandle, child: ElementNativeHandle,
    adjacent: ElementNativeHandle | null,
  ): ElementNativeHandle;
  replaceChild(
    element: ElementNativeHandle, child: ElementNativeHandle,
    replaced: ElementNativeHandle | null,
  ): ElementNativeHandle | null;
  removeChild(
    element: ElementNativeHandle, child: ElementNativeHandle,
  ): ElementNativeHandle | null;

  getElementById(
    element: ElementNativeHandle, id: string,
  ): ElementNativeHandle | null;
  querySelector(
    element: ElementNativeHandle, selector: string,
  ): ElementNativeHandle | null;
  setClass(
    element: ElementNativeHandle, className: string, activate: boolean,
  ): void;
  isClassSet(element: ElementNativeHandle, className: string): boolean;
  setClassNames(element: ElementNativeHandle, names: string): void;
  getClassNames(element: ElementNativeHandle): string;
  setPseudoClass(
    element: ElementNativeHandle, name: string, active: boolean,
  ): void;
  isPseudoClassSet(element: ElementNativeHandle, name: string): boolean;
  arePseudoClassesSet(
    element: ElementNativeHandle, names: readonly string[],
  ): boolean;
  getActivePseudoClasses(element: ElementNativeHandle): string[];
  getAddress(
    element: ElementNativeHandle, pseudo: boolean, parents: boolean,
  ): string;
  getElementContext(element: ElementNativeHandle): ContextNativeHandle | null;
  getFocusLeafNode(element: ElementNativeHandle): ElementNativeHandle;
  getRelativeOffset(element: ElementNativeHandle, area: number): VariantVector2;
  setOffset(
    element: ElementNativeHandle, offset: VariantVector2,
    parent: ElementNativeHandle | null, fixed: boolean,
  ): void;
  getAbsoluteOffset(element: ElementNativeHandle, area: number): VariantVector2;
  getContainingBlock(element: ElementNativeHandle): VariantVector2;
  getOffsetParent(element: ElementNativeHandle): ElementNativeHandle | null;
  getClipArea(element: ElementNativeHandle): number;
  setClipArea(element: ElementNativeHandle, area: number): void;
  getBaseline(element: ElementNativeHandle): number;
  isReplaced(element: ElementNativeHandle): boolean;
  getZIndex(element: ElementNativeHandle): number;
  isVisible(element: ElementNativeHandle, includeAncestors: boolean): boolean;
  isPointWithinElement(
    element: ElementNativeHandle, point: VariantVector2,
  ): boolean;
  project(element: ElementNativeHandle, point: VariantVector2): ProjectedPoint;
  getPosition(element: ElementNativeHandle): number;
  getFloat(element: ElementNativeHandle): number;
  getDisplay(element: ElementNativeHandle): number;
  getLineHeight(element: ElementNativeHandle): number;
  getAbsoluteLeft(element: ElementNativeHandle): number;
  getAbsoluteTop(element: ElementNativeHandle): number;
  getClientLeft(element: ElementNativeHandle): number;
  getClientTop(element: ElementNativeHandle): number;
  getClientWidth(element: ElementNativeHandle): number;
  getClientHeight(element: ElementNativeHandle): number;
  getOffsetLeft(element: ElementNativeHandle): number;
  getOffsetTop(element: ElementNativeHandle): number;
  getOffsetWidth(element: ElementNativeHandle): number;
  getOffsetHeight(element: ElementNativeHandle): number;
  getScrollLeft(element: ElementNativeHandle): number;
  getScrollTop(element: ElementNativeHandle): number;
  setScrollLeft(element: ElementNativeHandle, value: number): void;
  setScrollTop(element: ElementNativeHandle, value: number): void;
  getScrollWidth(element: ElementNativeHandle): number;
  getScrollHeight(element: ElementNativeHandle): number;
  setScrollableOverflowRectangle(
    element: ElementNativeHandle, size: VariantVector2, clamp: boolean,
  ): void;
  scrollTo(
    element: ElementNativeHandle, offset: VariantVector2, behavior: number,
  ): void;
  scrollIntoView(
    element: ElementNativeHandle, options: boolean | ScrollIntoViewOptions,
  ): void;
  setProperty(
    element: ElementNativeHandle, name: string, value: string,
  ): boolean;
  removeProperty(element: ElementNativeHandle, name: string): void;
  getInnerRML(element: ElementNativeHandle): string;
  setInnerRML(element: ElementNativeHandle, rml: string): void;
  getAttribute(
    element: ElementNativeHandle, name: string, fallback?: unknown,
  ): unknown;
  getAttributeValue(
    element: ElementNativeHandle, name: string,
  ): unknown;
  getElementAttribute(
    element: ElementNativeHandle, name: string,
    fallback: ElementNativeHandle | null,
  ): ElementNativeHandle | null;
  getAttributes(element: ElementNativeHandle): Record<string, unknown>;
  getNumAttributes(element: ElementNativeHandle): number;
  hasAttribute(element: ElementNativeHandle, name: string): boolean;
  setAttributes(
    element: ElementNativeHandle,
    attributes: Readonly<Record<string, unknown>>,
  ): void;
  setAttribute(
    element: ElementNativeHandle, name: string,
    value: unknown,
  ): void;
  removeAttribute(element: ElementNativeHandle, name: string): void;
  getTagName(element: ElementNativeHandle): string;
  isDocument(element: ElementNativeHandle): boolean;
  getElementType(element: ElementNativeHandle): string;
  svgEnsureSourceLoaded(element: ElementNativeHandle): void;
  lottieEnsureSourceLoaded(element: ElementNativeHandle): void;
  focusElement(element: ElementNativeHandle, focusVisible: boolean): boolean;
  blurElement(element: ElementNativeHandle): void;
  getIntrinsicDimensions(element: ElementNativeHandle): IntrinsicDimensions;
  submitForm(element: ElementNativeHandle, name: string, value: string): void;
  getControlName(element: ElementNativeHandle): string;
  setControlName(element: ElementNativeHandle, name: string): void;
  getControlValue(element: ElementNativeHandle): string;
  setControlValue(element: ElementNativeHandle, value: string): void;
  isControlSubmitted(element: ElementNativeHandle): boolean;
  isControlDisabled(element: ElementNativeHandle): boolean;
  setControlDisabled(element: ElementNativeHandle, disabled: boolean): void;
  selectInput(element: ElementNativeHandle): void;
  setInputSelection(
    element: ElementNativeHandle, start: number, end: number,
  ): void;
  getInputSelection(element: ElementNativeHandle): TextSelection;
  setInputCompositionRange(
    element: ElementNativeHandle, start: number, end: number,
  ): void;
  selectTextArea(element: ElementNativeHandle): void;
  setTextAreaSelection(
    element: ElementNativeHandle, start: number, end: number,
  ): void;
  getTextAreaSelection(element: ElementNativeHandle): TextSelection;
  setTextAreaCompositionRange(
    element: ElementNativeHandle, start: number, end: number,
  ): void;
  getTextAreaNumColumns(element: ElementNativeHandle): number;
  setTextAreaNumColumns(element: ElementNativeHandle, columns: number): void;
  getTextAreaNumRows(element: ElementNativeHandle): number;
  setTextAreaNumRows(element: ElementNativeHandle, rows: number): void;
  getTextAreaMaxLength(element: ElementNativeHandle): number;
  setTextAreaMaxLength(element: ElementNativeHandle, length: number): void;
  getTextAreaWordWrap(element: ElementNativeHandle): boolean;
  setTextAreaWordWrap(element: ElementNativeHandle, enabled: boolean): void;
  setSelectSelection(element: ElementNativeHandle, index: number): void;
  getSelectSelection(element: ElementNativeHandle): number;
  getSelectOption(
    element: ElementNativeHandle, index: number,
  ): ElementNativeHandle | null;
  getSelectNumOptions(element: ElementNativeHandle): number;
  addSelectOptionRml(
    element: ElementNativeHandle, rml: string, value: string,
    before: number, selectable: boolean,
  ): number;
  addSelectOptionElement(
    element: ElementNativeHandle, option: ElementNativeHandle, before: number,
  ): number;
  removeSelectOption(element: ElementNativeHandle, index: number): void;
  removeAllSelectOptions(element: ElementNativeHandle): void;
  showSelectBox(element: ElementNativeHandle): void;
  hideSelectBox(element: ElementNativeHandle): void;
  cancelSelectBox(element: ElementNativeHandle): void;
  isSelectBoxVisible(element: ElementNativeHandle): boolean;
  getText(element: ElementNativeHandle): string;
  setText(element: ElementNativeHandle, text: string): void;
  generateTextLine(
    element: ElementNativeHandle, lineBegin: number, maximumLineWidth: number,
    rightSpacingWidth: number, trimWhitespacePrefix: boolean,
    decodeEscapeCharacters: boolean, allowEmpty: boolean,
  ): GeneratedTextLine;
  clearTextLines(element: ElementNativeHandle): void;
  addTextLine(
    element: ElementNativeHandle, position: VariantVector2, line: string,
  ): void;
  suppressTextAutoLayout(element: ElementNativeHandle): void;
  getTextLines(element: ElementNativeHandle): TextLine[];
  getProgressValue(element: ElementNativeHandle): number;
  setProgressValue(element: ElementNativeHandle, value: number): void;
  getProgressMax(element: ElementNativeHandle): number;
  setProgressMax(element: ElementNativeHandle, maxValue: number): void;
  setTabRml(element: ElementNativeHandle, index: number, rml: string): void;
  setPanelRml(element: ElementNativeHandle, index: number, rml: string): void;
  setTabElement(
    element: ElementNativeHandle, index: number, title: ElementNativeHandle,
  ): void;
  setPanelElement(
    element: ElementNativeHandle, index: number, panel: ElementNativeHandle,
  ): void;
  removeTab(element: ElementNativeHandle, index: number): void;
  getNumTabs(element: ElementNativeHandle): number;
  setActiveTab(element: ElementNativeHandle, index: number): void;
  getActiveTab(element: ElementNativeHandle): number;
  getElementId(element: ElementNativeHandle): string;
  setElementId(element: ElementNativeHandle, id: string): void;
  getOwnerDocument(
    element: ElementNativeHandle,
  ): DocumentNativeHandle | null;
  getEventDispatcherSummary(element: ElementNativeHandle): string;
  elementGetEventDispatcher(
    element: ElementNativeHandle,
  ): ElementNativeHandle;
  dispatcherDetachAllEvents(element: ElementNativeHandle): void;
  dispatcherDispatchEvent(
    target: ElementNativeHandle, id: number, type: string,
    parameters: Record<string, unknown>,
    interruptible: boolean, bubbles: boolean, defaultActionPhase: number,
  ): boolean;
  elementGetBackgroundBorder(
    element: ElementNativeHandle,
  ): ElementNativeHandle;
  elementGetStyle(element: ElementNativeHandle): ElementNativeHandle;
  styleUpdateDefinition(element: ElementNativeHandle): void;
  styleSetClass(
    element: ElementNativeHandle, name: string, activate: boolean): boolean;
  styleSetPseudoClass(element: ElementNativeHandle, name: string,
    activate: boolean, overrideClass: boolean): boolean;
  styleIsClassSet(element: ElementNativeHandle, name: string): boolean;
  styleIsPseudoClassSet(element: ElementNativeHandle, name: string): boolean;
  styleSetClassNames(element: ElementNativeHandle, names: string): void;
  styleGetClassNames(element: ElementNativeHandle): string;
  styleGetClassNameList(element: ElementNativeHandle): string[];
  styleGetActivePseudoClasses(
    element: ElementNativeHandle): Array<[string, number]>;
  styleSetProperty(
    element: ElementNativeHandle, id: number, value: object): boolean;
  styleSetCustomProperty(
    element: ElementNativeHandle, name: string, value: object): void;
  styleSetVarShorthand(
    element: ElementNativeHandle, id: number, value: object): void;
  styleRemoveProperty(element: ElementNativeHandle, id: number): void;
  styleRemoveCustomProperty(element: ElementNativeHandle, name: string): void;
  styleRemoveVarShorthand(element: ElementNativeHandle, id: number): void;
  styleGetProperty(
    element: ElementNativeHandle, id: number): NativeProperty | null;
  styleGetCustomProperty(
    element: ElementNativeHandle, name: string): NativeProperty | null;
  styleGetLocalProperty(
    element: ElementNativeHandle, id: number): NativeProperty | null;
  styleGetLocalPropertyWithResolvedVariables(
    element: ElementNativeHandle, id: number): NativeProperty | null;
  styleGetLocalCustomProperty(
    element: ElementNativeHandle, name: string): NativeProperty | null;
  styleGetLocalShorthand(
    element: ElementNativeHandle, id: number): NativeProperty | null;
  styleGetSpecifiedProperty(
    element: ElementNativeHandle, id: number): NativeProperty | null;
  styleGetSpecifiedCustomProperty(
    element: ElementNativeHandle, name: string): NativeProperty | null;
  styleGetSpecifiedShorthand(
    element: ElementNativeHandle, id: number): NativeProperty | null;
  styleGetLocalStyleProperties(element: ElementNativeHandle): object;
  styleDirtyInheritedProperties(element: ElementNativeHandle): void;
  styleDirtyProperty(element: ElementNativeHandle, id: number): void;
  styleDirtyPropertiesWithUnits(
    element: ElementNativeHandle, units: number): void;
  styleDirtyPropertiesWithUnitsRecursive(
    element: ElementNativeHandle, units: number): void;
  styleAnyPropertiesDirty(element: ElementNativeHandle): boolean;
  styleResolveNumericValue(
    element: ElementNativeHandle, value: object, base: number): number;
  styleResolveRelativeLength(
    element: ElementNativeHandle, value: object, target: number): number;
  styleIterate(element: ElementNativeHandle): Array<[number, NativeProperty]>;
  styleIterateAll(element: ElementNativeHandle,
    filter: ElementNativeHandle | null): Array<[string, NativeProperty]>;
  styleComputeValues(element: ElementNativeHandle, values: object,
    parent: object | null, document: object | null, defaultInitialized: boolean,
    dpRatio: number, viewport: VariantVector2): number[];
  createKeyFrameResolver(): object;
  resetKeyFrameResolver(handle: object): void;
  keyFrameResolverHasCache(handle: object): boolean;
  keyFrameResolverDependencies(handle: object): string[];
  styleResolveKeyFrameProperty(element: ElementNativeHandle, id: number,
    property: object | null, block: object, resolver: object):
  NativeProperty | null;
  backgroundBorderRender(element: ElementNativeHandle): void;
  backgroundBorderDirtyBackground(element: ElementNativeHandle): void;
  backgroundBorderDirtyBorder(element: ElementNativeHandle): void;
  backgroundBorderGetClipGeometry(
    element: ElementNativeHandle, area: number,
  ): object;
  getClosestScrollableContainer(
    element: ElementNativeHandle,
  ): ElementNativeHandle | null;
  getElementDataModel(element: ElementNativeHandle): object | null;

  addEventListener(
    element: ElementNativeHandle, type: string | number,
    callback: object | ((event: NativeRmlEvent) => void), capture: boolean,
  ): void;
  removeEventListener(
    element: ElementNativeHandle, type: string | number,
    callback: object | ((event: NativeRmlEvent) => void), capture: boolean,
  ): void;
  dispatchEvent(
    element: ElementNativeHandle, type: string | number,
    parameters: Record<string, unknown>,
    interruptible?: boolean, bubbles?: boolean,
  ): boolean;
  registerEventType(
    type: string, interruptible: boolean, bubbles: boolean,
    defaultActionPhase: number,
  ): number;
  click(element: ElementNativeHandle): void;
  getEventPropagation(event: object, immediate: boolean): boolean;
  getEventParameter(
    event: object, name: string, fallback: unknown,
  ): unknown;
  getEventElementParameter(
    event: object, name: string, fallback: ElementNativeHandle | null,
  ): ElementNativeHandle | null;
  stopEventPropagation(event: object, immediate: boolean): void;
}

const requireNative = createRequire(__filename);

/**
 * Compiled RmlUi native module.
 *
 * @zh 编译后的 RmlUi 原生模块。
 */
export const native: NativeBinding = requireNative(
  '../../build/Release/rmlui.node',
);
