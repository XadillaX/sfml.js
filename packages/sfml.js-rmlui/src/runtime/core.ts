import { RenderWindow, SFMLError } from 'sfml.js';
import { native } from '../internal/native';
import { windowNativeHandle } from '../internal/sfml-interop';
import { Context } from './context';
import type { RenderInterface } from '../rendering/resources';
import {
  textInputHandlerHandle, type TextInputHandler,
} from '../platform/text-input-handler';
import { resolve } from 'node:path';

export {
  NodeScriptHost, type NodeScriptHostOptions, type ScriptHandler,
} from '../scripting/scripts';
export {
  LuaScriptHost, type LuaScriptHostOptions, type LuaScalar,
} from '../scripting/lua/lua-scripts';
export { LuaFunction } from '../scripting/lua/lua-function';
export { URL } from '../values/url';
export { StringView, StringIteratorU8 } from '../values/string-view';
export { StringUtilities, type StringInput } from '../values/string-utilities';
export { Log } from './log';
export {
  getCapabilities, type RmlUiCapabilities, type ModuleCapability,
  type FontEngineCapability,
} from './capabilities';
export type {
  BuiltinFontEngine, FontEngineKind,
} from '../fonts/font-engine-kind';
export {
  BaseXMLParser, XMLParser, XMLNodeHandler, XMLDataType,
} from '../dom/documents/xml-parser';
export type {
  BaseXMLParserCallbacks, XMLNodeHandlerCallbacks, XMLAttributes,
  XMLParseFrame, XMLParseEvent, XMLSourcePosition,
  XMLStartEvent, XMLEndEvent, XMLDataEvent,
} from '../dom/documents/xml-parser';
export {
  createString, formatString, type FormattedString,
} from '../values/string-format';

// Reuse sfml.js error prototypes so native exceptions keep the same type.
native.errorState.prototype = SFMLError.prototype;

/**
 * RmlUi version reported by the native library.
 *
 * @zh 原生库报告的 RmlUi 版本号。
 * @ja ネイティブライブラリが報告する RmlUi のバージョン。
 * @ko 네이티브 라이브러리가 보고하는 RmlUi 버전입니다.
 */
export const version: string = native.getVersion();

/**
 * Options for the process-wide RmlUi runtime.
 *
 * @zh 进程级 RmlUi 运行时选项。
 * @ja プロセス全体で共有する RmlUi ランタイムの設定。
 * @ko 프로세스 전체에서 공유하는 RmlUi 런타임 설정입니다.
 */
export interface InitialiseOptions {
  /**
   * Enable the native Retina surface on macOS.
   *
   * @zh 开启 macOS 原生 Retina 绘图表面。
   * @ja macOS のネイティブ Retina 描画サーフェスを有効にします。
   * @ko macOS의 네이티브 Retina 렌더링 표면을 활성화합니다.
   * @default `true`
   * @remarks
   * The window keeps its on-screen size; getSize(), events and texture capture
   * then use physical pixels. Use RCSS `dp` units for stable UI sizing.
   * Passing false preserves the existing surface. Once enabled, the surface
   * stays enabled until the window closes, including after {@link shutdown}.
   * @zh 窗口屏幕尺寸不变；getSize()、事件和纹理截图改用物理像素。
   * RCSS 使用 `dp` 保持界面尺寸。false 保留现有表面状态。
   * 启用后持续到窗口关闭，调用 {@link shutdown} 也不会关闭该表面。
   * @ja 画面上のウィンドウサイズは変わりません。getSize()、イベント、
   * テクスチャキャプチャは物理ピクセルになります。RCSS の `dp` を使って
   * 表示サイズを保ってください。false は現在の状態を維持します。
   * {@link shutdown} 後も、ウィンドウを閉じるまで有効です。
   * @ko 화면상의 창 크기는 유지됩니다. getSize(), 이벤트, 텍스처 캡처는
   * 물리 픽셀을 사용합니다. RCSS의 `dp`로 표시 크기를 유지하세요.
   * false는 기존 상태를 유지합니다. 활성화한 표면은 {@link shutdown} 후에도
   * 창을 닫을 때까지 유지됩니다.
   */
  highDpi?: boolean;

  /**
   * Root directory to try first when opening resources.
   *
   * @zh 打开资源时优先尝试的根目录。
   * @ja リソースを開く際に最初に検索するルートディレクトリ。
   * @ko 리소스를 열 때 먼저 검색할 루트 디렉터리입니다.
   * @remarks
   * Both `/assets/a.png` and `assets/a.png` resolve below this directory,
   * then fall back to the original path. Relative roots resolve against the
   * working directory. When omitted, RmlUi uses its default file interface.
   * This option does not restrict filesystem access.
   * @zh `/assets/a.png` 和 `assets/a.png` 均先从此目录解析，失败后尝试原始路径。
   * 相对根目录以当前工作目录为基准。省略时使用 RmlUi 默认文件接口。
   * 此选项不限制文件系统访问。
   * @ja `/assets/a.png` と `assets/a.png` はこのディレクトリ内を検索し、
   * 見つからなければ元のパスを試します。相対ルートは作業ディレクトリ基準です。
   * 省略時は RmlUi 標準のファイルインターフェースを使います。
   * ファイルシステムへのアクセスは制限しません。
   * @ko `/assets/a.png`와 `assets/a.png` 모두 이 디렉터리에서 먼저 찾고,
   * 실패하면 원래 경로를 시도합니다. 상대 루트는 작업 디렉터리 기준입니다.
   * 생략하면 RmlUi 기본 파일 인터페이스를 사용하며 파일 접근을 제한하지 않습니다.
   */
  fileRoot?: string;
}

/**
 * Initialise RmlUi with SFML-backed system and render interfaces.
 *
 * @zh 使用 SFML 支撑的系统接口与渲染接口初始化 RmlUi。
 * @ja SFML バックエンドのシステム・レンダーインターフェースで RmlUi を初期化。
 * @ko SFML 기반 시스템 및 렌더 인터페이스로 RmlUi를 초기화합니다.
 * @param window - Open sfml.js render window.
 * @zh window - 已打开的 sfml.js 渲染窗口。
 * @ja window - 開いている sfml.js 描画ウィンドウ。
 * @ko window - 열려 있는 sfml.js 렌더 창입니다.
 * @param options - Resource and display options for first initialisation.
 * @zh options - 资源与显示选项，在首次初始化时生效。
 * @ja options - 初回の初期化で適用するリソースと表示の設定。
 * @ko options - 최초 초기화에 적용할 리소스 및 표시 설정입니다.
 * @returns Whether initialisation succeeded.
 * @zh 初始化是否成功。
 * @ja 初期化に成功したかどうか。
 * @ko 초기화 성공 여부입니다.
 * @remarks
 * One process-wide runtime has a default render window. Repeated calls return
 * true without replacing the window or options. Keep the window open until
 * {@link shutdown}; create contexts afterwards using its physical pixel size.
 * A system selected with setSystemInterface before initialization is retained;
 * otherwise a native SFML system interface is installed.
 * Runtime operations belong to the initialising Node environment and thread.
 * Other workers may import the native module and read its version, but cannot
 * access or shut down the owner's runtime.
 * @zh 进程级运行时绑定默认渲染窗口。重复调用返回 true，不替换窗口或选项。
 * 在 {@link shutdown} 前保持窗口打开；初始化后再按窗口物理像素尺寸创建上下文。
 * 初始化前通过 setSystemInterface 选择的系统接口会保留，
 * 未选择时安装原生 SFML 系统接口。
 * 运行时操作限于初始化它的 Node 环境和线程。其他 worker 可导入原生模块并
 * 读取版本，但不能访问或关闭所属运行时。
 * @ja ランタイムはプロセス全体で既定の描画ウィンドウを使用します。
 * 再呼び出しは true を返し、ウィンドウや設定を変更しません。
 * {@link shutdown} までウィンドウを開いたままにし、初期化後のピクセルサイズで
 * コンテキストを作成してください。
 * 初期化前に setSystemInterface で選択した設定を保持し、
 * 未選択ならネイティブ SFML システムを使用します。
 * 操作は初期化元の Node 環境とスレッドに限定されます。他の worker は
 * モジュールの読み込みとバージョン取得のみ可能で、操作や終了はできません。
 * @ko 프로세스 런타임은 기본 렌더 창을 사용합니다. 재호출하면 창이나 설정을
 * 변경하지 않고 true를 반환합니다. {@link shutdown}까지 창을 열어 두고,
 * 초기화 후 창의 픽셀 크기로 컨텍스트를 생성하세요.
 * 초기화 전에 setSystemInterface로 선택한 설정을 유지하며
 * 선택하지 않으면 네이티브 SFML 시스템을 사용합니다.
 * 작업은 초기화한 Node 환경과 스레드에 속합니다. 다른 worker는 모듈을
 * 가져오고 버전을 읽을 수 있지만 소유자의 런타임에 접근하거나 종료할 수 없습니다.
 * @throws TypeError for a non-RenderWindow; Error if Retina setup fails.
 * @zh window 不是 RenderWindow 时抛出 TypeError；Retina 设置失败时抛出 Error。
 * @ja window が RenderWindow でなければ TypeError、Retina 設定失敗時は Error。
 * @ko window가 RenderWindow가 아니면 TypeError, Retina 설정 실패 시 Error입니다.
 */
export function initialise(
  window: RenderWindow, options: InitialiseOptions = {},
): boolean {
  if (!(window instanceof RenderWindow)) {
    throw new TypeError('Expected an sfml.js RenderWindow');
  }
  const fileRoot = options.fileRoot === undefined
    ? undefined : resolve(options.fileRoot);
  return native.initialise(
    windowNativeHandle(window), fileRoot, options.highDpi ?? true,
  );
}

/**
 * Shut down RmlUi and release its interfaces.
 *
 * @zh 关闭 RmlUi 并释放其接口。
 * @ja RmlUi を終了し、インターフェースを解放します。
 * @ko RmlUi를 종료하고 인터페이스를 해제합니다.
 * @remarks
 * Corresponds to Rml::Shutdown. All context, document and element wrappers
 * become invalid and listeners are released automatically. Shut down before
 * closing the render window. Shutdown in an inactive runtime is a no-op.
 * @zh 对应 Rml::Shutdown。所有上下文、文档和元素包装器随之失效。
 * 监听器自动释放。关闭渲染窗口前先关闭 RmlUi；运行时未启动时重复关闭不执行操作。
 * @ja Rml::Shutdown に対応し、すべてのラッパーが無効になります。
 * リスナーは自動解放されます。描画ウィンドウを閉じる前に終了してください。未起動時は何もしません。
 * @ko Rml::Shutdown에 해당하며 모든 래퍼가 무효화됩니다.
 * 리스너는 자동 해제됩니다. 렌더 창을 닫기 전에 종료하세요. 비활성 런타임에서는 아무 작업도 하지 않습니다.
 */
export function shutdown(): void {
  native.shutdown();
}

/**
 * Create a named RmlUi context.
 *
 * @zh 创建命名的 RmlUi 上下文。
 * @ja 名前付きの RmlUi コンテキストを作成します。
 * @ko 이름이 있는 RmlUi 컨텍스트를 생성합니다.
 * @param name - Unique context name.
 * @zh name - 唯一上下文名称。
 * @ja name - 一意のコンテキスト名。
 * @ko name - 고유한 컨텍스트 이름입니다.
 * @param width - Initial width in physical pixels.
 * @zh width - 初始宽度，单位为物理像素。
 * @ja width - 物理ピクセル単位の初期幅。
 * @ko width - 물리 픽셀 단위의 초기 너비입니다.
 * @param height - Initial height in physical pixels.
 * @zh height - 初始高度，单位为物理像素。
 * @ja height - 物理ピクセル単位の初期高さ。
 * @ko height - 물리 픽셀 단위의 초기 높이입니다.
 * @param renderInterface - Renderer; omitted/null uses the default.
 * @zh renderInterface - 指定渲染接口；省略或 null 使用默认接口。
 * @ja renderInterface - 描画器の指定。省略または null は既定値を使います。
 * @ko renderInterface - 렌더러 지정이며 생략하거나 null이면 기본값입니다.
 * @param textInputHandler - Per-context handler; omitted/null selects global.
 * @zh textInputHandler - 上下文处理器；省略/null 选择全局处理器。
 * @ja textInputHandler - 入力ハンドラー。省略/null は全体の設定を使用。
 * @ko textInputHandler - 입력 처리기이며 생략/null이면 전역 설정을 사용합니다.
 * @returns Context wrapper.
 * @zh 上下文包装器。
 * @ja コンテキストのラッパー。
 * @ko 컨텍스트 래퍼입니다.
 * @throws Error if RmlUi is not initialised or context creation fails.
 * @zh RmlUi 未初始化或上下文创建失败时抛出 Error。
 * @ja RmlUi が未初期化、または作成に失敗した場合は Error。
 * @ko RmlUi가 초기화되지 않았거나 생성에 실패하면 Error입니다.
 */
export function createContext(
  name: string, width: number, height: number,
  renderInterface?: RenderInterface | null,
  textInputHandler?: TextInputHandler | null,
): Context {
  const handle = native.createContext(
    name, width, height, renderInterface,
    textInputHandler == null ? null : textInputHandlerHandle(textInputHandler));
  return new Context(handle);
}

/**
 * Look up Rml::GetContext by name or zero-based index.
 *
 * @zh 按名称或从零开始的索引调用 Rml::GetContext。
 * @ja 名前または 0 始まりのインデックスで Rml::GetContext を呼びます。
 * @ko 이름 또는 0부터 시작하는 인덱스로 Rml::GetContext를 호출합니다.
 * @param nameOrIndex - Context name or int32 index.
 * @zh nameOrIndex - 上下文名称或 int32 索引。
 * @ja nameOrIndex - コンテキスト名または int32 インデックス。
 * @ko nameOrIndex - 컨텍스트 이름 또는 int32 인덱스입니다.
 * @returns Canonical wrapper, or null for a missing name/out-of-range index.
 * @zh 唯一包装器；名称不存在或索引越界时为 null。
 * @ja 一意のラッパー。名前がない、または範囲外の場合は null。
 * @ko 고유 래퍼이며 이름이 없거나 범위를 벗어나면 null입니다.
 * @remarks
 * RmlUi 6.3 Core.cpp returns null for invalid indices; its header's clamp
 * comment does not match the implementation. Enumeration order is native.
 * @zh RmlUi 6.3 Core.cpp 对无效索引返回 null，与头文件的钳制注释不一致。
 * 枚举顺序由原生库决定。
 * @ja RmlUi 6.3 はヘッダーの注釈と異なり、無効なインデックスに null を返します。
 * 列挙順はネイティブライブラリに従います。
 * @ko RmlUi 6.3은 헤더 주석과 달리 잘못된 인덱스에 null을 반환합니다.
 * 열거 순서는 네이티브 라이브러리를 따릅니다.
 */
export function getContext(nameOrIndex: string | number): Context | null {
  const handle = native.getContext(nameOrIndex);
  return handle === null ? null : new Context(handle);
}

/**
 * Get the number of active contexts in the runtime registry.
 *
 * @zh 获取运行时注册表中活跃上下文的数量。
 * @ja ランタイムレジストリ内の有効なコンテキスト数を取得します。
 * @ko 런타임 레지스트리의 활성 컨텍스트 수를 가져옵니다.
 * @returns Number of active native contexts.
 * @zh 活动原生上下文数量。
 * @ja 有効なネイティブコンテキスト数。
 * @ko 활성 네이티브 컨텍스트 수입니다.
 */
export function getNumContexts(): number {
  return native.getNumContexts();
}

/**
 * Remove a named context with Rml::RemoveContext and invalidate its aliases.
 *
 * @zh 使用 Rml::RemoveContext 移除命名上下文，并使其所有别名失效。
 * @ja Rml::RemoveContext で名前付きコンテキストを削除し、別名を無効にします。
 * @ko Rml::RemoveContext로 명명된 컨텍스트를 제거하고 모든 별칭을 무효화합니다.
 * @param name - Native context name.
 * @zh name - 原生上下文名称。
 * @ja name - ネイティブコンテキスト名。
 * @ko name - 네이티브 컨텍스트 이름입니다.
 * @returns True when removed, false when the name does not exist.
 * @zh 移除时为 true，名称不存在时为 false。
 * @ja 削除したら true、名前が存在しなければ false。
 * @ko 제거하면 true, 이름이 없으면 false입니다.
 */
export function removeContext(name: string): boolean {
  return native.removeContext(name);
}

export { Context } from './context';
export {
  DataBatchView, type DataBatchViewOptions, type DataBatchViewUpdate,
} from '../data/data-batch';
export {
  DataModelHandle, DataModelConstructor, DataVariable, DataVariableType,
  makeLiteralIntVariable,
  type DataScalarValue, type DataVariantValue,
  type DataGetFunc, type DataSetFunc,
  type DataEventFunc, type DataTransformFunc, type DataModelOptions,
} from '../data/data-model';
export {
  DataAddressEntry, type DataAddress, type DirtyVariables,
} from '../data/data-address';
export {
  DataDefinition, DataSchema, DataStructHandle, DataTypeRegister,
  type DataScalarKind, type DataEnumKind, type DataNumericView,
  type DataStorageValue, type DataStorageRecord,
} from '../data/data-schema';
export { DataPointerTraits } from '../data/data-pointer-traits';
export {
  type DataGetResult, type DataCustomDefinition,
} from '../data/data-custom';
export {
  DataView, type DataViewCallbacks,
  type DataBindingInitialize, type DataBindingRelease,
} from '../data/data-view';
export {
  DataController, type DataControllerCallbacks,
} from '../data/data-controller';
export {
  DataViewInstancer, DataControllerInstancer,
  type DataViewInstanceCallback, type DataControllerInstanceCallback,
} from '../data/data-instancers';
export {
  type DataMemberGetter, type DataMemberSetter, type DataScalarDefinition,
  type DataTypeGetFunc, type DataTypeSetFunc, type DataEventMemberFunc,
  type MemberGetFunc, type MemberSetFunc,
  type MemberGetterFunc, type MemberSetterFunc, type VoidMemberFunc,
} from '../data/data-accessors';
export {
  TransformFuncRegister, type DataTransformResult,
} from '../data/data-transforms';
export {
  Stream, StreamMemory, StreamFile, StreamMode, SeekOrigin,
  type StreamCallbacks,
} from '../io/stream';
export {
  FontEffect, type FontGlyphMetrics, type FontEffectCallbacks,
} from '../fonts/font-effect';
export { FontGlyph, ColorFormat, type FontGlyphMap } from '../fonts/font-glyph';

export {
  SystemInterface, LogType, getSystemInterface, setSystemInterface,
  type SystemCallbacks, type TranslationResult,
  type SystemTranslateCallback, type SystemJoinPathCallback,
  type SystemLogCallback, type SystemClipboardCallback,
} from '../platform/system-interface';
export {
  type RenderInterface, createRenderInterface, getRenderInterface,
  setRenderInterface,
  getTextureSourceList, releaseTexture, releaseTextures,
  releaseCompiledGeometry, releaseRenderManagers,
} from '../rendering/resources';
export {
  RenderManager, BlendMode, type LayerHandle, type RenderParameters,
} from '../rendering/render-manager';
export {
  type RenderState, clipMaskGeometryEquals,
} from '../rendering/render-state';
export {
  Mesh, type TexturedMesh, type TexturedMeshList,
} from '../rendering/mesh';
export { MeshUtilities } from '../rendering/mesh-utilities';
export {
  ConvolutionFilter, FilterOperation,
} from '../style/effects/convolution-filter';
export { Vertex, type VertexColour } from '../rendering/vertex';
export { TextureSource } from '../rendering/texture-source';
export {
  Spritesheet, SpritesheetList, type Sprite, type SpriteMap,
  type SpriteRectangle, type SpriteDefinitionList,
} from '../rendering/spritesheet';
export { Geometry, GeometryReleaseMode } from '../rendering/geometry';
export { Texture } from '../rendering/texture';
export {
  CompiledFilter, CompiledShader, FilterHandleList,
} from '../rendering/compiled-resources';
export {
  FontStyle, FontWeight, loadFontFace, releaseFontResources,
} from '../fonts/fonts';
export {
  FontEngineInterface, getFontEngineInterface, setFontEngineInterface,
  type FontEffectsHandle, type GeneratedString,
} from '../fonts/font-engine';
export type {
  FontEngineCallbacks, CustomFontMetrics, CustomFontFace, FontAdvanceTable,
  FontShapingParameters,
} from '../fonts/font-engine-custom';
export type {
  FontLifecycleCallback, FontLoadCallback, FontLoadNamedCallback,
  FontLoadMemoryCallback, FontFaceCallback, FontEffectsCallback,
  FontMetricsCallback, FontWidthCallback, FontWidthsCallback,
  FontMeasureCallback, PackedFontMeasurement, FontGenerateCallback,
  FontVersionCallback,
} from '../fonts/font-engine-callbacks';
export { FontMetrics } from '../fonts/font-metrics';
export { FontMeasureBuffer } from '../fonts/font-measure-buffer';
export { TextShapingContext } from '../fonts/text-shaping-context';
export {
  preloadResources, type PreloadFont, type PreloadResources,
  type ResourcePreloadOptions,
} from '../rendering/resource-preload';
export { Document } from '../dom/documents/document';
export {
  DocumentHeader, type DocumentHeaderInit, type DocumentHeaderSnapshot,
  type DocumentHeaderResource, type DocumentHeaderResourceInit,
} from '../dom/documents/document-header';
export {
  ModalFlag, FocusFlag, ScrollFlag, ScrollBehavior,
} from '../dom/documents/document-flags';
export { Element, type IntrinsicDimensions } from '../dom/elements/element';
export {
  ElementUtilities, PositionAnchor, ClipMaskOperation,
  type ElementRectangle, type ClipMaskGeometry, type ElementClippingRegion,
} from '../dom/elements/element-utilities';
export {
  BoxArea, ScrollAlignment, ScrollParentage,
  StylePosition, StyleFloat, StyleDisplay,
} from '../dom/elements/layout';
export type {
  ProjectedPoint, ScrollIntoViewOptions,
} from '../dom/elements/layout';
export {
  Box, BoxEdge, BoxDirection, type PositionedBox,
} from '../dom/elements/box';
export {
  RenderBox, type EdgeSizes, type CornerSizes,
} from '../rendering/render-box';
export { NumericValue } from '../values/numeric-value';
export {
  ElementCommandBuffer, ElementCommandOpcode, ElementCommandStatus,
} from '../dom/elements/element-commands';

/**
 * Native computed style types, values and resolution functions.
 *
 * @zh 原生计算样式的类型、值与解析函数。
 * @ja ネイティブ計算済みスタイルの型・値・解決関数。
 * @ko 네이티브 계산 스타일의 형식, 값 및 해석 함수입니다.
 */
export * as Style from '../style/values/style-values';

/**
 * Resolve a computed length to pixels using Rml::ResolveValue.
 *
 * @zh 使用 Rml::ResolveValue 将计算长度解析为像素。
 * @ja Rml::ResolveValue で計算済み長さをピクセルに解決します。
 * @ko Rml::ResolveValue로 계산 길이를 픽셀로 해석합니다.
 */
export { resolveValue } from '../style/values/style-values';

/**
 * Resolve a computed length with a fallback using Rml::ResolveValueOr.
 *
 * @zh 使用 Rml::ResolveValueOr 解析计算长度，并指定回退值。
 * @ja Rml::ResolveValueOr でフォールバックを指定して長さを解決します。
 * @ko Rml::ResolveValueOr로 대체 값을 지정하여 계산 길이를 해석합니다.
 */
export { resolveValueOr } from '../style/values/style-values';
export {
  ComputedValues, type ComputedValuesView, type FontFaceHandle,
} from '../style/values/computed-values';
export {
  Transform, TransformPrimitiveType, makeTransformPrimitive,
  type TransformPrimitive, type TransformSnapshot, type DecomposedMatrix4,
  type TransformArrayPrimitiveType, type TransformPrimitiveValues,
  type TransformPrimitiveRecord,
} from '../style/values/transform';
export type {
  NumericValueSnapshot, PremultipliedColour,
  ColorStop, ColorStopList, BoxShadow, BoxShadowList,
} from '../style/effects/decoration-values';
export { Property, type PropertySource } from '../style/properties/property';
export {
  Variant, VariantType, type VariantConversion,
} from '../values/variant';
export {
  DecoratorList, FilterList, FontEffectList, FontEffectLayer,
  type EffectProperty, FilterDeclaration, DecoratorDeclaration,
  type FontEffectSnapshot,
} from '../style/effects/effect-values';
export {
  DecoratorInstancer, FilterInstancer, type FilterInstancerCallback,
  type DecoratorInstancerCallback,
} from '../style/effects/effect-instancers';
export {
  Decorator, DecoratorData, type DecoratorCallbacks,
} from '../style/effects/decorator';
export {
  DecoratorInstancerInterface,
} from '../style/effects/decorator-instancer-interface';
export {
  Filter, type FilterOverflow, type FilterCallbacks,
} from '../style/effects/filter';
export {
  FontEffectInstancer, type FontEffectInstancerCallback,
} from '../fonts/font-effect-instancer';
export {
  Tween, TweenType, TweenDirection, type TweenCallback, type TweenOutType,
} from '../animation/tween';
export {
  PropertyDefinition, RelativeTarget, type PropertyValueResult,
} from '../style/properties/property-definition';
export { PropertyId } from '../generated/property-ids';
export { ShorthandId } from '../generated/shorthand-ids';
export { MediaQueryId } from '../generated/media-query-ids';
export { FontFaceId } from '../generated/font-face-ids';
export { PropertyDictionary } from '../style/properties/property-dictionary';
export {
  PropertySpecification, ShorthandType, ShorthandDefinition,
  ShorthandItemOptions, PropertyShorthandItem, RecursiveShorthandItem,
} from '../style/properties/property-specification';
export {
  ParameterMap, PropertyParser, PropertyParserCallback,
} from '../style/properties/property-parser';
export {
  StyleSheetSpecification,
} from '../style/properties/style-sheet-specification';
export { Factory } from '../dom/documents/factory';
export {
  EventInstancer, type EventInstanceCallback, type EventReleaseCallback,
  type EventReleaseSnapshot,
} from '../events/event-instancer';
export {
  ContextInstancer, type ContextInstanceCallback, type ContextReleaseCallback,
  type ContextReleaseSnapshot,
} from './context-instancer';
export {
  TextInputHandler, getTextInputHandler, setTextInputHandler,
  type TextInputCallbacks, type TextInputEvents,
} from '../platform/text-input-handler';
export {
  TextInputContext, type TextInputBounds, type TextInputRange,
} from '../platform/text-input-context';
export {
  ElementInstancer, type ElementReleaseSnapshot,
  type ElementInstanceCallback, type ElementReleaseCallback,
} from '../dom/elements/element-instancer';
export { ElementDefinition } from '../dom/elements/element-definition';
export {
  StyleSheet, StyleSheetContainer, type NamedDecorator,
  type KeyframeBlock, type Keyframes,
} from '../style/properties/style-sheet';
export {
  makeAnimation, makeTransition, makeTransitionList,
  animationEquals, transitionEquals, transitionListEquals,
} from '../animation/animation-values';
export type {
  Animation, AnimationList, Transition, TransitionList,
} from '../animation/animation-values';
export { Unit, anyUnit, type Units } from '../values/unit';
export type { ClassIdentifier } from './rtti';
export { ScriptInterface } from '../scripting/script-interface';
export type {
  AttributeValue, AttributeResult,
} from '../dom/documents/attributes';
export { ElementForm } from '../dom/controls/form';
export {
  ElementFormControl, type TextSelection,
} from '../dom/controls/form-control';
export { ElementFormControlInput } from '../dom/controls/form-control-input';
export {
  ElementFormControlTextArea,
} from '../dom/controls/form-control-text-area';
export { ElementFormControlSelect } from '../dom/controls/form-control-select';
export {
  ElementText, type TextLine, type GeneratedTextLine,
} from '../dom/elements/element-text';
export { ElementProgress } from '../dom/controls/progress';
export {
  ElementScroll, ScrollOrientation,
} from '../dom/elements/element-scroll';
export { EventDispatcher } from '../events/event-dispatcher';
export {
  ElementBackgroundBorder,
} from '../dom/elements/element-background-border';
export {
  ElementStyle, KeyFramePropertyResolver,
} from '../dom/elements/element-style';
export {
  TransformState, ElementTransformBuffer,
} from '../style/values/transform-state';
export { ElementTabSet } from '../dom/controls/tab-set';
export {
  RmlEvent, EventPhase, EventId, DefaultActionPhase, registerEventType,
} from '../events/event';
export { KeyIdentifier, KeyModifier } from '../platform/input';
export type { Touch } from '../platform/input';
export type { DispatchEventOptions } from '../events/event';
export {
  EventListener, type EventListenerAttachment, type EventListenerHook,
} from '../events/event-listener';
export {
  EventListenerInstancer, type EventListenerInstanceCallback,
} from '../events/event-listener-instancer';
export type {
  ContextDimensions,
} from './context';
export {
  Plugin, PluginEventClasses, registerPlugin, unregisterPlugin,
  type PluginCallbacks,
} from './plugin';
export type {
  PluginEventClassesCallback, PluginLifecycleCallback, PluginContextCallback,
  PluginDocumentOpenCallback, PluginDocumentCallback, PluginElementCallback,
  PluginDataModelCallback,
} from './plugin-callbacks';
export type {
  RmlEventListener,
  VariantValue,
  VariantReadValue,
  VariantOpaquePointer,
  VariantOpaqueObject,
  VariantDefault,
  VariantConversionDefault,
  VariantIntegerVector,
  VariantScriptPointer,
  VariantScriptObject,
  VariantCharacter,
  VariantResult,
  VariantNumber,
  VariantInteger64,
  VariantVector2,
  VariantVector3,
  VariantVector4,
  VariantColour,
  VariantByteColour,
} from '../values/types';
