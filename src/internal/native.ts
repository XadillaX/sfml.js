import { createRequire } from 'node:module';
import { SFMLError } from '../system/error';
import type { ScalarType } from '../system/vector2';
import type { ContextSettings } from '../window/context-settings';
import type { NativeWindowEvent } from '../window/event';
import type { Identification } from '../window/joystick';
import type { NativeStruct } from './struct-view';

declare const nativeGraphicsBrand: unique symbol;
declare const nativeValueBrand: unique symbol;

export interface NativeValueHandle<T extends string> {
  readonly [nativeValueBrand]: T;
}

export interface NativeGraphicsHandle<T extends string> {
  readonly [nativeGraphicsBrand]: T;
}

export interface NativeValueMapping<T extends string> {
  handle: NativeValueHandle<T>;
  buffer: ArrayBuffer;
}

export interface NativeImageMapping {
  buffer: ArrayBuffer;
  info: NativeStruct;
}

export interface NativeImageResource extends NativeImageMapping {
  handle: NativeGraphicsHandle<'image'>;
}

export interface NativeTextureInfo {
  width: number;
  height: number;
  smooth: boolean;
  repeated: boolean;
  sRgb: boolean;
  nativeHandle: number;
}

export interface NativeTextureMapping {
  handle: NativeGraphicsHandle<'texture'>;
  id: number;
  info: NativeStruct;
}

export interface NativeFontMapping extends NativeStruct {
  family: string;
}

export interface NativeVertexBufferInfo {
  count: number;
  primitiveType: number;
  usage: number;
  nativeHandle: number;
}

export interface NativeShapeInfo {
  count: number;
  thickness: number;
  miterLimit: number;
  left: number;
  top: number;
  boundsWidth: number;
  boundsHeight: number;
  radius?: number;
  width?: number;
  height?: number;
}

export interface NativeVertices {
  handle: NativeGraphicsHandle<'vertices'>;
  buffer: ArrayBuffer;
}

export interface NativeShapedGlyphs {
  handle: NativeGraphicsHandle<'shapedGlyphs'>;
  buffer: ArrayBuffer;
}

export interface NativeTextLayout {
  vertices: NativeVertices;
  outline: NativeVertices;
}

export interface NativeTextMapping {
  handle: NativeGraphicsHandle<'text'>;
  transformable: NativeGraphicsHandle<'transformable'>;
  transform: ArrayBuffer;
  buffer: ArrayBuffer;
  geometry: ArrayBuffer;
  bounds: ArrayBuffer;
}

export interface NativeContextMapping {
  handle: NativeGraphicsHandle<'contextResource'>;
  key: bigint;
  settings: ArrayBuffer;
}

export type NativeGlyphProcessor = (
  glyph: NativeShapedGlyphs, style: number, fill: number,
  outline: number, thickness: number,
) => Float64Array;

type ImageCallback<T> = (error: Error | null, result: T) => void;

export type NativeStreamDispatch = (
  operation: number, data: Uint8Array | undefined, position: bigint,
  complete: (error: string | null, result?: bigint) => void,
) => void;

interface NativeBinding {
  readonly errorState: { prototype: SFMLError };
  writeError(bytes: Uint8Array): void;
  setErrorOutput(output?: ((bytes: Buffer) => void) | null): void;
  flushErrorOutput(): void;
  getVersion(): { buffer: ArrayBuffer; string: string };
  getClipboardString(): string;
  setClipboardString(text: string): void;
  isTouchDown(finger: number): boolean;
  getTouchPosition(
    finger: number, window?: NativeGraphicsHandle<'window'>,
  ): [number, number];
  createContext(
    settings?: Readonly<ContextSettings>, width?: number, height?: number,
  ): NativeContextMapping;
  setContextActive(
    handle: NativeGraphicsHandle<'contextResource'>, active: boolean,
  ): boolean;
  getActiveContextKey(): bigint | undefined;
  referenceActiveContext(): NativeContextMapping | undefined;
  getActiveContextId(): bigint;
  isContextExtensionAvailable(name: string): boolean;
  getContextFunction(name: string): bigint | undefined;
  /** 查询 SFML 的 Vulkan 后端能力。 */
  isVulkanAvailable(requireGraphics: boolean): boolean;
  /** 查询 Vulkan 函数地址。 */
  getVulkanFunction(name: string): bigint | undefined;
  /** 复制 Vulkan 图形实例所需的扩展名称。 */
  getVulkanGraphicsRequiredInstanceExtensions(): string[];
  /** 以 UTF-16 索引查询字素、单词或句子边界。 */
  isUnicodeBoundary(text: string, position: number, kind: 0 | 1 | 2): boolean;
  suspendAwareClockNow(): bigint;
  createFont(
    context: NativeGraphicsHandle<'context'>,
    source?: NativeGraphicsHandle<'font'>,
  ): NativeFontMapping & { handle: NativeGraphicsHandle<'font'> };
  openFont(
    input: string | Uint8Array,
    callback: ImageCallback<NativeGraphicsHandle<'fontData'> | undefined>,
  ): void;
  commitFont(
    handle: NativeGraphicsHandle<'font'>,
    data: NativeGraphicsHandle<'fontData'>,
  ): NativeFontMapping;
  getFontGlyph(
    handle: NativeGraphicsHandle<'font'>, id: number, size: number,
    bold: boolean, outline: number, byId: boolean,
  ): NativeValueMapping<'glyph'>;
  fontMetric(
    handle: NativeGraphicsHandle<'font'>, metric: number, value: number,
    second?: number, size?: number, bold?: boolean,
  ): number | boolean;
  setFontSmooth(handle: NativeGraphicsHandle<'font'>, smooth: boolean): void;
  getFontTexture(
    handle: NativeGraphicsHandle<'font'>, size: number,
  ): NativeTextureMapping;
  getTextureInfo(handle: NativeGraphicsHandle<'texture'>): NativeTextureInfo;
  wrapGlyph(buffer: ArrayBuffer): NativeValueMapping<'glyph'>;
  glyphMember(
    handle: NativeValueHandle<'glyph'>, index: 0 | 1,
  ): NativeValueMapping<'rect'>;
  createText(
    font: NativeGraphicsHandle<'font'>, source?: NativeGraphicsHandle<'text'>,
  ): NativeTextMapping;
  prepareText(
    handle: NativeGraphicsHandle<'text'>, font: NativeGraphicsHandle<'font'>,
    string: string, callback: NativeGlyphProcessor | null,
  ): NativeTextLayout;
  getTextGlyphs(handle: NativeGraphicsHandle<'text'>): NativeShapedGlyphs;
  shapedGlyphMember(
    handle: NativeGraphicsHandle<'shapedGlyphs'>, index: number, member: 0,
  ): NativeValueMapping<'glyph'>;
  shapedGlyphMember(
    handle: NativeGraphicsHandle<'shapedGlyphs'>, index: number, member: 1,
  ): NativeValueMapping<'vector2'>;
  findTextCharacter(
    handle: NativeGraphicsHandle<'text'>, index: number,
  ): [number, number];
  createShape(
    context: NativeGraphicsHandle<'context'>, kind: 0 | 1 | 2 | 3,
    x: number, y: number, source?: NativeGraphicsHandle<'shape'>,
  ): {
    handle: NativeGraphicsHandle<'shape'>;
    transformable: NativeGraphicsHandle<'transformable'>;
    id: number;
    buffer: ArrayBuffer;
    appearance: ArrayBuffer;
    info: NativeStruct;
  };
  changeShapeGeometry(
    handle: NativeGraphicsHandle<'shape'>, operation: number,
    x: number, y?: number, z?: number,
  ): void;
  updateShapePoints(
    handle: NativeGraphicsHandle<'shape'>, points: Float32Array,
  ): void;
  getShapePoint(
    handle: NativeGraphicsHandle<'shape'>, index: number,
  ): [number, number];
  getShapeCenter(handle: NativeGraphicsHandle<'shape'>): [number, number];
  setShapeTexture(
    handle: NativeGraphicsHandle<'shape'>,
    texture: NativeGraphicsHandle<'texture'> | null, id: number,
  ): void;
  shapeTextureRect(
    handle: NativeGraphicsHandle<'shape'>,
  ): NativeValueMapping<'rect'>;
  createRenderWindow(context: NativeGraphicsHandle<'context'>): {
    handle: NativeGraphicsHandle<'renderWindow'>;
    window: NativeGraphicsHandle<'window'>;
    buffer: ArrayBuffer;
  };
  submitRenderWindow(
    handle: NativeGraphicsHandle<'renderWindow'>,
    count: number, display: boolean,
  ): void;
  allocateRenderWindowVertices(
    handle: NativeGraphicsHandle<'renderWindow'>, capacity: number,
  ): ArrayBuffer;
  setRenderWindowActive(
    handle: NativeGraphicsHandle<'renderWindow'>, active: boolean,
  ): boolean;
  isRenderWindowSrgb(handle: NativeGraphicsHandle<'renderWindow'>): boolean;
  changeRenderWindowGLStates(
    handle: NativeGraphicsHandle<'renderWindow'>, operation: 0 | 1 | 2,
  ): void;
  isKeyPressed(code: number, scancode: boolean): boolean;
  localizeKey(code: number): number;
  delocalizeKey(key: number): number;
  getKeyDescription(code: number): string;
  setVirtualKeyboardVisible(visible: boolean): void;
  isMouseButtonPressed(button: number): boolean;
  getMousePosition(
    window?: NativeGraphicsHandle<'window'>,
  ): [number, number];
  setMousePosition(
    x: number, y: number, window?: NativeGraphicsHandle<'window'>,
  ): void;
  isJoystickConnected(joystick: number): boolean;
  getJoystickButtonCount(joystick: number): number;
  joystickHasAxis(joystick: number, axis: number): boolean;
  isJoystickButtonPressed(joystick: number, button: number): boolean;
  getJoystickAxisPosition(joystick: number, axis: number): number;
  getJoystickIdentification(joystick: number): Identification;
  updateJoysticks(): void;
  isSensorAvailable(sensor: number): boolean;
  setSensorEnabled(sensor: number, enabled: boolean): void;
  getSensorValue(sensor: number): [number, number, number];
  createShader(context: NativeGraphicsHandle<'context'>): {
    handle: NativeGraphicsHandle<'shader'>;
    id: number;
    buffer: ArrayBuffer;
  };
  compileShader(
    memory: boolean, sources: (string | null)[],
    callback: ImageCallback<NativeGraphicsHandle<'shaderProgram'> | undefined>,
  ): void;
  commitShader(
    handle: NativeGraphicsHandle<'shader'>,
    program: NativeGraphicsHandle<'shaderProgram'>,
  ): void;
  setShaderUniform(
    handle: NativeGraphicsHandle<'shader'>, name: string, type: number,
    data: Float32Array | Int32Array, array: boolean,
  ): void;
  setShaderTexture(
    handle: NativeGraphicsHandle<'shader'>, name: string,
    texture: NativeGraphicsHandle<'texture'> | null,
  ): number | undefined;
  getShaderNativeHandle(handle: NativeGraphicsHandle<'shader'>): number;
  bindShader(handle: NativeGraphicsHandle<'shader'> | null): void;
  isShaderAvailable(geometry: boolean): boolean;
  createVertexBuffer(
    context: NativeGraphicsHandle<'context'>, type: number, usage: number,
    source?: NativeGraphicsHandle<'vertexBuffer'>,
  ): {
    handle: NativeGraphicsHandle<'vertexBuffer'>;
    id: number;
    info: NativeStruct;
  };
  allocateVertexBuffer(
    handle: NativeGraphicsHandle<'vertexBuffer'>, count: number,
  ): true | undefined;
  updateVertexBuffer(
    handle: NativeGraphicsHandle<'vertexBuffer'>, bytes: Uint8Array,
    count: number, offset: number,
  ): true | undefined;
  copyVertexBuffer(
    destination: NativeGraphicsHandle<'vertexBuffer'>,
    source: NativeGraphicsHandle<'vertexBuffer'>,
  ): true | undefined;
  swapVertexBuffers(
    left: NativeGraphicsHandle<'vertexBuffer'>,
    right: NativeGraphicsHandle<'vertexBuffer'>,
  ): void;
  assignVertexBuffer(
    target: NativeGraphicsHandle<'vertexBuffer'>,
    source: NativeGraphicsHandle<'vertexBuffer'>,
  ): void;
  setVertexBufferPrimitiveType(
    handle: NativeGraphicsHandle<'vertexBuffer'>, type: number,
  ): void;
  setVertexBufferUsage(
    handle: NativeGraphicsHandle<'vertexBuffer'>, usage: number,
  ): void;
  bindVertexBuffer(handle: NativeGraphicsHandle<'vertexBuffer'> | null): void;
  isVertexBufferAvailable(): boolean;
  createWindow(): NativeGraphicsHandle<'window'>;
  openWindow(
    handle: NativeGraphicsHandle<'window'>,
    width: number, height: number, title: string,
    bitsPerPixel: number, style: number, state: number,
    settings: Readonly<ContextSettings>,
  ): void;
  openWindowHandle(
    handle: NativeGraphicsHandle<'window'>, window: bigint,
    settings: Readonly<ContextSettings>,
  ): void;
  /** 按原生触发顺序取出并消费一个窗口生命周期通知。 */
  takeWindowNotification(
    handle: NativeGraphicsHandle<'window'>,
  ): 'create' | 'resize' | undefined;
  windowCommand(
    handle: NativeGraphicsHandle<'window'>, command: string,
    value?: number | string | boolean, second?: number,
  ): void;
  getWindowPosition(handle: NativeGraphicsHandle<'window'>): [number, number];
  getWindowNativeHandle(handle: NativeGraphicsHandle<'window'>): bigint;
  getWindowSettings(handle: NativeGraphicsHandle<'window'>): ArrayBuffer;
  hasWindowFocus(handle: NativeGraphicsHandle<'window'>): boolean;
  pollWindowEvent(
    handle: NativeGraphicsHandle<'window'>,
  ): NativeWindowEvent | undefined;
  waitWindowEvent(
    handle: NativeGraphicsHandle<'window'>, timeout: bigint,
  ): NativeWindowEvent | undefined;
  setWindowIcon(
    handle: NativeGraphicsHandle<'window'>,
    width: number, height: number, pixels: Uint8Array,
  ): void;
  setWindowCursor(
    handle: NativeGraphicsHandle<'window'>,
    cursor: NativeGraphicsHandle<'cursor'>,
  ): void;
  createSystemCursor(type: number): NativeGraphicsHandle<'cursor'> | undefined;
  createPixelCursor(
    pixels: Uint8Array, width: number, height: number, x: number, y: number,
  ): NativeGraphicsHandle<'cursor'> | undefined;
  getDesktopVideoMode(): [number, number, number];
  getFullscreenVideoModes(): [number, number, number][];
  isVideoModeValid(width: number, height: number, bitsPerPixel: number): boolean;
  createWindowVulkanSurface(
    handle: NativeGraphicsHandle<'window'>, instance: bigint, allocator: bigint,
  ): bigint | undefined;
  closeWindow(handle: NativeGraphicsHandle<'window'>): void;
  isWindowOpen(handle: NativeGraphicsHandle<'window'>): boolean;
  getWindowSize(handle: NativeGraphicsHandle<'window'>): [number, number];
  setWindowActive(
    handle: NativeGraphicsHandle<'window'>, active: boolean,
  ): boolean;
  displayWindow(handle: NativeGraphicsHandle<'window'>): void;
  createVertexStorage(capacity: number): {
    handle: NativeGraphicsHandle<'vertices'>;
    buffer: ArrayBuffer;
  };
  vertexStorageMember(
    handle: NativeGraphicsHandle<'vertices'>, index: number,
  ): NativeValueMapping<'vertex'>;
  createImage(handle: NativeGraphicsHandle<'image'>): NativeImageResource;
  createImage(
    width: number, height: number, pixels: number | Uint8Array,
  ): NativeImageResource;
  resizeImage(
    handle: NativeGraphicsHandle<'image'>,
    width: number, height: number, pixels: number | Uint8Array,
  ): NativeImageMapping;
  maskImage(
    handle: NativeGraphicsHandle<'image'>, color: number, alpha: number,
  ): void;
  flipImage(handle: NativeGraphicsHandle<'image'>, horizontal: boolean): void;
  copyImage(
    destination: NativeGraphicsHandle<'image'>,
    source: NativeGraphicsHandle<'image'>,
    x: number, y: number, left: number, top: number,
    width: number, height: number, alpha: boolean,
  ): boolean;
  loadImageFile(
    handle: NativeGraphicsHandle<'image'>, path: string,
    callback: ImageCallback<NativeImageMapping | undefined>,
  ): void;
  loadImageMemory(
    handle: NativeGraphicsHandle<'image'>, bytes: Uint8Array,
    callback: ImageCallback<NativeImageMapping | undefined>,
  ): void;
  loadImageStream(
    handle: NativeGraphicsHandle<'image'>, dispatch: NativeStreamDispatch,
    callback: ImageCallback<NativeImageMapping | undefined>,
  ): void;
  saveImageFile(
    handle: NativeGraphicsHandle<'image'>, path: string,
    callback: ImageCallback<boolean>,
  ): void;
  saveImageMemory(
    handle: NativeGraphicsHandle<'image'>, format: string,
    callback: ImageCallback<Uint8Array | undefined>,
  ): void;
  wrapMat3(buffer: ArrayBuffer): NativeValueMapping<'mat3'>;
  wrapMat4(buffer: ArrayBuffer): NativeValueMapping<'mat4'>;
  wrapTransform(buffer: ArrayBuffer): NativeValueMapping<'transform'>;
  wrapAngle(buffer: ArrayBuffer): NativeValueMapping<'angle'>;
  wrapColor(buffer: ArrayBuffer): NativeValueMapping<'color'>;
  wrapVertex(buffer: ArrayBuffer): NativeValueMapping<'vertex'>;
  wrapRect(
    type: 'i32' | 'f32', buffer: ArrayBuffer,
  ): NativeValueMapping<'rect'>;
  wrapVector3(
    type: ScalarType | 'bool', buffer: ArrayBuffer,
  ): NativeValueMapping<'vector3'>;
  wrapVector4(
    type: 'i32' | 'f32' | 'bool', buffer: ArrayBuffer,
  ): NativeValueMapping<'vector4'>;
  createVertex(): NativeValueMapping<'vertex'>;
  vertexMember(
    handle: NativeValueHandle<'vertex'>, index: 0 | 2,
  ): NativeValueMapping<'vector2'>;
  vertexMember(
    handle: NativeValueHandle<'vertex'>, index: 1,
  ): NativeValueMapping<'color'>;
  createRect(type: 'i32' | 'f32'): NativeValueMapping<'rect'>;
  rectMember(
    handle: NativeValueHandle<'rect'>, index: 0 | 1,
  ): NativeValueMapping<'vector2'>;
  createColor(): NativeValueMapping<'color'>;
  createAngle(): NativeValueMapping<'angle'>;
  createVector3(type: ScalarType): NativeValueMapping<'vector3'>;
  createVector2(type: ScalarType): NativeValueMapping<'vector2'>;
  wrapVector2(
    type: ScalarType | 'bool', buffer: ArrayBuffer,
  ): NativeValueMapping<'vector2'>;
  createGraphicsContext(): NativeGraphicsHandle<'context'>;
  createTransformable(): {
    handle: NativeGraphicsHandle<'transformable'>;
    buffer: ArrayBuffer;
  };
  createTexture(context: NativeGraphicsHandle<'context'>): NativeTextureMapping;
  createTexture(
    context: NativeGraphicsHandle<'context'>,
    source: NativeGraphicsHandle<'texture'>,
  ): NativeTextureMapping;
  createTexture(
    context: NativeGraphicsHandle<'context'>,
    width: number, height: number, sRgb: boolean,
  ): NativeTextureMapping;
  resizeTexture(
    handle: NativeGraphicsHandle<'texture'>,
    width: number, height: number, sRgb: boolean,
  ): true | undefined;
  copyTextureToImage(
    handle: NativeGraphicsHandle<'texture'>,
  ): NativeImageResource;
  getMaximumTextureSize(): number;
  getTextureNativeHandle(handle: NativeGraphicsHandle<'texture'>): number;
  bindTexture(
    handle: NativeGraphicsHandle<'texture'> | null, coordinateType: number,
  ): void;
  generateTextureMipmap(handle: NativeGraphicsHandle<'texture'>): boolean;
  swapTextures(
    left: NativeGraphicsHandle<'texture'>,
    right: NativeGraphicsHandle<'texture'>,
  ): void;
  assignTexture(
    target: NativeGraphicsHandle<'texture'>,
    source: NativeGraphicsHandle<'texture'>,
  ): void;
  loadTextureImage(
    handle: NativeGraphicsHandle<'texture'>,
    image: NativeGraphicsHandle<'image'>, sRgb: boolean,
    left: number, top: number, width: number, height: number,
  ): true | undefined;
  updateTexture(
    handle: NativeGraphicsHandle<'texture'>, pixels: Uint8Array,
    width: number, height: number, x: number, y: number,
  ): void;
  updateTextureImage(
    handle: NativeGraphicsHandle<'texture'>,
    source: NativeGraphicsHandle<'image'>, x: number, y: number,
  ): void;
  updateTextureTexture(
    handle: NativeGraphicsHandle<'texture'>,
    source: NativeGraphicsHandle<'texture'>, x: number, y: number,
  ): void;
  updateTextureWindow(
    handle: NativeGraphicsHandle<'texture'>,
    source: NativeGraphicsHandle<'window'>, x: number, y: number,
  ): void;
  setTextureSmooth(
    handle: NativeGraphicsHandle<'texture'>, smooth: boolean,
  ): void;
  setTextureRepeated(
    handle: NativeGraphicsHandle<'texture'>, repeated: boolean,
  ): void;
  createSprite(
    context: NativeGraphicsHandle<'context'>,
    texture: NativeGraphicsHandle<'texture'>,
    textureId: number,
  ): {
    handle: NativeGraphicsHandle<'sprite'>;
    transformable: NativeGraphicsHandle<'transformable'>;
    id: number;
    buffer: ArrayBuffer;
    appearance: ArrayBuffer;
  };
  setSpriteTexture(
    sprite: NativeGraphicsHandle<'sprite'>,
    texture: NativeGraphicsHandle<'texture'>, textureId: number,
  ): void;
  spriteTextureRect(
    sprite: NativeGraphicsHandle<'sprite'>,
  ): NativeValueMapping<'rect'>;
  createRenderTexture(
    context: NativeGraphicsHandle<'context'>, width?: number, height?: number,
    settings?: Readonly<ContextSettings>,
  ): {
    handle: NativeGraphicsHandle<'renderTexture'>;
    buffer: ArrayBuffer;
    info: NativeStruct;
    targetInfo: NativeStruct;
  };
  resizeRenderTexture(
    handle: NativeGraphicsHandle<'renderTexture'>, width: number, height: number,
    settings: Readonly<ContextSettings>,
  ): true | undefined;
  getMaximumRenderTextureAntiAliasingLevel(): number;
  setRenderTextureSmooth(
    handle: NativeGraphicsHandle<'renderTexture'>, smooth: boolean,
  ): void;
  setRenderTextureRepeated(
    handle: NativeGraphicsHandle<'renderTexture'>, repeated: boolean,
  ): void;
  generateRenderTextureMipmap(
    handle: NativeGraphicsHandle<'renderTexture'>,
  ): boolean;
  setRenderTextureActive(
    handle: NativeGraphicsHandle<'renderTexture'>, active: boolean,
  ): boolean;
  changeRenderTextureGLStates(
    handle: NativeGraphicsHandle<'renderTexture'>, operation: 0 | 1 | 2,
  ): void;
  submitRenderTexture(
    handle: NativeGraphicsHandle<'renderTexture'>,
    count: number, display: boolean,
  ): void;
  getRenderTextureTexture(
    handle: NativeGraphicsHandle<'renderTexture'>,
  ): NativeTextureMapping;
  allocateRenderTextureVertices(
    handle: NativeGraphicsHandle<'renderTexture'>, capacity: number,
  ): ArrayBuffer;
}

const requireNative = createRequire(__filename);

export const native: NativeBinding = requireNative(
  '../../build/Release/sfml.node',
);

native.errorState.prototype = SFMLError.prototype;
