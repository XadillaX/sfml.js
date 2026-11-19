import { native } from '../internal/native';
import type { RenderInterface } from './resources';
import { meshHandle, type Mesh } from './mesh';
import {
  geometryHandle, geometryFromNative, type Geometry,
} from './geometry';
import { textureFromNative, type Texture } from './texture';
import {
  makeCallbackTexture, textureHandleFromNative,
  type CallbackTexture, type CallbackTextureFunction, type TextureHandle,
} from './callback-texture';
import type {
  VariantVector2, VariantVector3, VariantVector4, VariantColour,
} from '../values/types';
import type { ColorStopList } from '../style/effects/decoration-values';
import type {
  ClipMaskGeometry, ClipMaskOperation, ElementRectangle,
} from '../dom/elements/element-utilities';
import {
  clipMaskToNative, clipMaskFromNative, type RenderState,
} from './render-state';
import {
  compiledFilterFromNative, compiledShaderFromNative,
  filterHandleListHandle, type FilterHandleList,
  type CompiledFilter, type CompiledShader,
} from './compiled-resources';

const managers = new WeakMap<RenderManager, object>();
const wrappers = new WeakMap<object, RenderManager>();

declare const layerHandleBrand: unique symbol;

/**
 * Opaque Rml::LayerHandle belonging to one manager and one layer lifetime.
 *
 * @zh 属于一个管理器和一次图层生命周期的不透明 Rml::LayerHandle。
 * @ja 一つの管理器とレイヤー寿命に属する不透明な Rml::LayerHandle。
 * @ko 하나의 관리자와 레이어 수명에 속하는 불투명한 Rml::LayerHandle입니다.
 * @remarks
 * Pop invalidates a layer even when its target is reused. The base window
 * layer is obtained through getTopLayer before pushing any layers.
 * @zh 弹出后句柄失效，即使渲染目标被复用。压入图层前用 getTopLayer 获取窗口层。
 * @ja 解放後は描画先が再利用されても無効です。開始前の getTopLayer が基底層です。
 * @ko 팝 후 렌더 타깃이 재사용되어도 무효이며 시작 전 getTopLayer가 기본 층입니다.
 */
export interface LayerHandle {
  /** @internal */
  readonly [layerHandleBrand]: true;
}

/**
 * Rml::BlendMode for premultiplied layer composition.
 *
 * @zh 预乘透明度图层合成所用的 Rml::BlendMode。
 * @ja 乗算済みアルファのレイヤー合成に使う Rml::BlendMode。
 * @ko 미리 곱한 알파 레이어 합성에 사용하는 Rml::BlendMode입니다.
 */
export enum BlendMode {
  /**
   * Composite source over destination.
   *
   * @zh 将源图层叠加到目标。
   * @ja 描画先の上に合成します。
   * @ko 소스를 대상 위에 합성합니다.
   */
  Blend = 0,
  /**
   * Replace destination pixels inside the active clipping region.
   *
   * @zh 替换当前裁剪区域内的目标像素。
   * @ja 有効なクリップ領域の描画先ピクセルを置換します。
   * @ko 활성 클리핑 영역의 대상 픽셀을 교체합니다.
   */
  Replace = 1,
}

/**
 * Owned scalar/vector/colour parameters passed to Rml::RenderManager.
 *
 * @zh 传入 Rml::RenderManager 的自有标量、向量和颜色参数。
 * @ja Rml::RenderManager に渡す所有スカラー・ベクトル・色パラメーター。
 * @ko Rml::RenderManager에 전달하는 소유 스칼라, 벡터 및 색상 매개변수입니다.
 */
export type RenderParameters = Readonly<Record<string,
null | boolean | number | bigint | string |
VariantVector2 | VariantVector3 | VariantVector4 |
VariantColour | ColorStopList>>;

/**
 * Checked Rml::RenderManager resource factory.
 *
 * @zh 带有效性检查的 Rml::RenderManager 资源工厂。
 * @ja 有効性を検証する Rml::RenderManager リソースファクトリー。
 * @ko 유효성을 검사하는 Rml::RenderManager 리소스 팩터리입니다.
 * @remarks
 * Contexts using the same interface share a manager. An explicit constructor
 * creates an independent manager owned until runtime shutdown, including
 * native font-layer texture caches after wrapper GC. Shutdown releases fonts
 * before owned managers and invalidates all managers. releaseRenderManagers
 * invalidates only borrowed managers with no remaining contexts.
 * @zh 使用同一接口的上下文共享管理器；显式构造创建独立管理器。
 * 独立管理器由运行时持有至关闭，包装器回收后仍保留字体层纹理缓存。
 * shutdown 先释放字体再释放自有管理器，使所有管理器失效；
 * releaseRenderManagers 仅使不再被上下文使用的借用管理器失效。
 * @ja 同じインターフェースのコンテキストは管理器を共有し、明示構築は独立します。
 * 独立管理器は終了まで保持し、ラッパー回収後もフォントのテクスチャを維持します。
 * shutdown はフォントを先に解放して全管理器を無効化し、
 * releaseRenderManagers は未使用の借用管理器だけを無効化します。
 * @ko 같은 인터페이스의 컨텍스트는 관리자를 공유하며 명시적 생성은 독립적입니다.
 * 독립 관리자는 종료까지 유지하며 래퍼 회수 후에도 폰트 텍스처를 보유합니다.
 * shutdown은 폰트를 먼저 해제하고 모든 관리자를 무효화하며
 * releaseRenderManagers는 컨텍스트가 없는 빌린 관리자만 무효화합니다.
 */
export class RenderManager {
  /** @internal */
  private declare readonly renderManagerBrand: void;

  /**
   * Construct an independent Rml::RenderManager.
   *
   * @zh 构造独立的 Rml::RenderManager。
   * @ja 独立した Rml::RenderManager を構築します。
   * @ko 독립된 Rml::RenderManager를 생성합니다.
   * @param renderInterface - Runtime-owned renderer.
   * @zh renderInterface - 运行时持有的渲染接口。
   * @ja renderInterface - ランタイムが所有する描画インターフェース。
   * @ko renderInterface - 런타임 소유 렌더 인터페이스입니다.
   */
  constructor(renderInterface: RenderInterface) {
    const handle = native.createRenderManager(renderInterface);
    managers.set(this, handle);
    wrappers.set(handle, this);
  }

  /**
   * Invoke Rml::RenderManager::PrepareRender before a render pass.
   *
   * @zh 渲染一帧前调用 Rml::RenderManager::PrepareRender。
   * @ja 描画前に Rml::RenderManager::PrepareRender を呼びます。
   * @ko 렌더 패스 전에 Rml::RenderManager::PrepareRender를 호출합니다.
   * @param dimensions - Nonnegative integer viewport dimensions.
   * @zh dimensions - 非负整数视口尺寸。
   * @ja dimensions - 非負整数のビューポート寸法。
   * @ko dimensions - 음이 아닌 정수 뷰포트 크기입니다.
   */
  prepareRender(dimensions: VariantVector2): void {
    native.renderManagerPrepareRender(renderManagerHandle(this), dimensions);
  }

  /**
   * Invoke Rml::RenderManager::SetViewport.
   *
   * @zh 调用 Rml::RenderManager::SetViewport。
   * @ja Rml::RenderManager::SetViewport を呼びます。
   * @ko Rml::RenderManager::SetViewport를 호출합니다.
   * @param dimensions - Nonnegative integer viewport dimensions.
   * @zh dimensions - 非负整数视口尺寸。
   * @ja dimensions - 非負整数のビューポート寸法。
   * @ko dimensions - 음이 아닌 정수 뷰포트 크기입니다.
   */
  setViewport(dimensions: VariantVector2): void {
    native.renderManagerSetViewport(renderManagerHandle(this), dimensions);
  }

  /**
   * Invoke Rml::RenderManager::GetViewport.
   *
   * @zh 调用 Rml::RenderManager::GetViewport。
   * @ja Rml::RenderManager::GetViewport を呼びます。
   * @ko Rml::RenderManager::GetViewport를 호출합니다.
   * @returns Copied integer dimensions.
   * @zh 整数尺寸副本。
   * @ja 整数寸法のコピー。
   * @ko 정수 크기 사본입니다.
   */
  getViewport(): VariantVector2 {
    return native.renderManagerGetViewport(renderManagerHandle(this));
  }

  /**
   * Invoke Rml::RenderManager::SetScissorRegion.
   *
   * @zh 调用 Rml::RenderManager::SetScissorRegion。
   * @ja Rml::RenderManager::SetScissorRegion を呼びます。
   * @ko Rml::RenderManager::SetScissorRegion을 호출합니다.
   * @param region - Integer rectangle intersected with the viewport;
   * null disables scissoring, as does an invalid rectangle.
   * @zh region - 与视口相交的整数矩形；null 或无效矩形禁用裁剪。
   * @ja region - ビューポートと交差する整数矩形。null または無効矩形は無効化。
   * @ko region - 뷰포트와 교차할 정수 사각형이며 null이나 무효 사각형은 끕니다.
   */
  setScissorRegion(region: ElementRectangle | null): void {
    native.renderManagerSetScissorRegion(renderManagerHandle(this), region);
  }

  /**
   * Invoke Rml::RenderManager::GetScissorRegion.
   *
   * @zh 调用 Rml::RenderManager::GetScissorRegion。
   * @ja Rml::RenderManager::GetScissorRegion を呼びます。
   * @ko Rml::RenderManager::GetScissorRegion을 호출합니다.
   * @returns Copied integer rectangle, or null when invalid.
   * @zh 整数矩形副本；无效时为 null。
   * @ja 整数矩形のコピー。無効なら null。
   * @ko 정수 사각형 사본이며 무효이면 null입니다.
   */
  getScissorRegion(): ElementRectangle | null {
    return native.renderManagerGetScissorRegion(renderManagerHandle(this));
  }

  /**
   * Invoke Rml::RenderManager::DisableScissorRegion.
   *
   * @zh 调用 Rml::RenderManager::DisableScissorRegion。
   * @ja Rml::RenderManager::DisableScissorRegion を呼びます。
   * @ko Rml::RenderManager::DisableScissorRegion을 호출합니다.
   */
  disableScissorRegion(): void {
    native.renderManagerDisableScissorRegion(renderManagerHandle(this));
  }

  /**
   * Invoke Rml::RenderManager::SetClipMask with owned native copies.
   *
   * @zh 使用自有原生副本调用 Rml::RenderManager::SetClipMask。
   * @ja 所有ネイティブコピーで Rml::RenderManager::SetClipMask を呼びます。
   * @ko 소유 네이티브 사본으로 Rml::RenderManager::SetClipMask를 호출합니다.
   * @param masks - Ordered operations with same-manager geometry.
   * @zh masks - 使用同一管理器几何的有序操作。
   * @ja masks - 同じ管理器のジオメトリを使う順序付き操作。
   * @ko masks - 같은 관리자의 지오메트리를 사용하는 순서 있는 연산입니다.
   */
  setClipMask(masks: readonly ClipMaskGeometry[]): void;

  /**
   * Invoke the single-geometry Rml::RenderManager::SetClipMask overload.
   *
   * @zh 调用 Rml::RenderManager::SetClipMask 的单几何重载。
   * @ja 単一ジオメトリの Rml::RenderManager::SetClipMask を呼びます。
   * @ko 단일 지오메트리 Rml::RenderManager::SetClipMask 오버로드를 호출합니다.
   * @param operation - Set, inverse-set or intersection.
   * @zh operation - 设置、反向设置或交集。
   * @ja operation - 設定、反転設定、交差。
   * @ko operation - 설정, 반전 설정 또는 교집합입니다.
   * @param geometry - Valid same-manager geometry, copied on submission.
   * @zh geometry - 同一管理器的有效几何，提交时复制。
   * @ja geometry - 同じ管理器の有効なジオメトリ。設定時にコピーします。
   * @ko geometry - 같은 관리자의 유효 지오메트리이며 제출 시 복사합니다.
   * @param translation - Finite translation; this overload has no transform.
   * @zh translation - 有限平移；此重载没有变换矩阵。
   * @ja translation - 有限移動量。この形式には行列がありません。
   * @ko translation - 유한 이동량이며 이 형식에는 행렬이 없습니다.
   */
  setClipMask(
    operation: ClipMaskOperation, geometry: Geometry,
    translation: VariantVector2,
  ): void;
  setClipMask(
    masksOrOperation: readonly ClipMaskGeometry[] | ClipMaskOperation,
    geometry?: Geometry, translation?: VariantVector2,
  ): void {
    if (typeof masksOrOperation === 'number') {
      native.renderManagerSetSingleClipMask(renderManagerHandle(this), [{
        operation: masksOrOperation, geometry: geometry && geometryHandle(
          geometry),
        absoluteOffset: translation, transform: null,
      }]);
    } else {
      native.renderManagerSetClipMask(renderManagerHandle(this),
        masksOrOperation.map(clipMaskToNative));
    }
  }

  /**
   * Invoke Rml::RenderManager::DisableClipMask and release its owned copies.
   *
   * @zh 调用 Rml::RenderManager::DisableClipMask 并释放自有副本。
   * @ja Rml::RenderManager::DisableClipMask を呼び、所有コピーを解放します。
   * @ko Rml::RenderManager::DisableClipMask를 호출하고 소유 사본을 해제합니다.
   */
  disableClipMask(): void {
    native.renderManagerDisableClipMask(renderManagerHandle(this));
  }

  /**
   * Invoke Rml::RenderManager::SetTransform.
   *
   * @zh 调用 Rml::RenderManager::SetTransform。
   * @ja Rml::RenderManager::SetTransform を呼びます。
   * @ko Rml::RenderManager::SetTransform을 호출합니다.
   * @remarks
   * Geometry and clip masks use the full homogeneous matrix after translation,
   * with perspective-correct UVs and Z clipping at -10000 to 10000.
   * Custom supplied vertex programs retain the SFML affine convention.
   * @zh 几何与蒙版在平移后应用完整齐次矩阵，支持透视 UV 和 ±10000 Z 裁剪。
   * 自定义顶点程序保留 SFML 仿射约定。
   * @ja 平行移動後の同次行列、透視補正 UV、±10000 の Z クリップを適用します。
   * 独自頂点プログラムは SFML のアフィン規約を維持します。
   * @ko 이동 후 전체 동차 행렬, 원근 보정 UV와 ±10000 Z 클리핑을 적용합니다.
   * 사용자 정점 프로그램은 SFML 아핀 규약을 유지합니다.
   * @param transform - Copied finite column-major matrix; null is identity.
   * Buffer must be fixed and unshared; subviews are supported.
   * @zh transform - 复制的有限列主序矩阵；null 表示单位变换。
   * 缓冲区必须固定且不共享；支持子视图。
   * @ja transform - 有限値の列優先行列コピー。null は単位変換。
   * バッファーは固定かつ非共有。部分ビューにも対応します。
   * @ko transform - 복사되는 유한 열 우선 행렬이며 null은 단위 변환입니다.
   * 버퍼는 고정이며 비공유여야 합니다. 부분 뷰도 지원합니다.
   */
  setTransform(transform: Float32Array | null): void {
    native.renderManagerSetTransform(renderManagerHandle(this), transform);
  }

  /**
   * Copy Rml::RenderManager::GetState into independent resources.
   *
   * @zh 将 Rml::RenderManager::GetState 复制为独立资源。
   * @ja Rml::RenderManager::GetState を独立リソースにコピーします。
   * @ko Rml::RenderManager::GetState를 독립 리소스로 복사합니다.
   * @returns Snapshot valid after source elements close.
   * Release its geometries when finished.
   * @zh 源元素关闭后仍有效的快照；用完后释放其中的几何。
   * @ja 元の要素が閉じても有効なコピー。ジオメトリは使用後に解放します。
   * @ko 원본 요소가 닫혀도 유효한 사본이며 사용 후 지오메트리를 해제하세요.
   */
  getState(): RenderState {
    const state = native.renderManagerGetState(renderManagerHandle(this));
    return {
      ...state, clipMaskList: state.clipMaskList.map(clipMaskFromNative),
    };
  }

  /**
   * Invoke Rml::RenderManager::SetState after validating and copying inputs.
   *
   * @zh 校验并复制输入后调用 Rml::RenderManager::SetState。
   * @ja 入力を検証・コピーして Rml::RenderManager::SetState を呼びます。
   * @ko 입력을 검증하고 복사한 뒤 Rml::RenderManager::SetState를 호출합니다.
   * @param state - Same-manager resources.
   * Invalid input leaves state unchanged.
   * @zh state - 同一管理器的资源；无效输入不改变状态。
   * @ja state - 同じ管理器のリソース。不正な入力は状態を変えません。
   * @ko state - 같은 관리자의 리소스이며 잘못된 입력은 상태를 바꾸지 않습니다.
   */
  setState(state: RenderState): void {
    native.renderManagerSetState(renderManagerHandle(this), {
      scissorRegion: state.scissorRegion,
      clipMaskList: state.clipMaskList.map(clipMaskToNative),
      transform: state.transform,
    });
  }

  /**
   * Invoke Rml::RenderManager::ResetState and release its owned clip copies.
   *
   * @zh 调用 Rml::RenderManager::ResetState 并释放自有裁剪副本。
   * @ja Rml::RenderManager::ResetState を呼び、所有クリップコピーを解放します。
   * @ko Rml::RenderManager::ResetState를 호출하고 소유 클립 사본을 해제합니다.
   */
  resetState(): void {
    native.renderManagerResetState(renderManagerHandle(this));
  }

  /**
   * Invoke Rml::RenderManager::PushLayer and select its transparent target.
   *
   * @zh 调用 Rml::RenderManager::PushLayer 并选择其透明渲染目标。
   * @ja Rml::RenderManager::PushLayer で透明な描画先を選択します。
   * @ko Rml::RenderManager::PushLayer로 투명한 렌더 타깃을 선택합니다.
   * @returns Checked handle; each push must be matched by popLayer.
   * @zh 带检查的句柄；每次压入都必须对应一次 popLayer。
   * @ja 検証済みハンドル。各呼び出しに対応する popLayer が必要です。
   * @ko 검증된 핸들이며 각 호출에 대응하는 popLayer가 필요합니다.
   */
  pushLayer(): LayerHandle {
    return native.renderManagerPushLayer(
      renderManagerHandle(this)) as LayerHandle;
  }

  /**
   * Invoke Rml::RenderManager::CompositeLayers with retained native filters.
   *
   * @zh 使用保活的原生滤镜调用 Rml::RenderManager::CompositeLayers。
   * @ja 保持されたフィルターで Rml::RenderManager::CompositeLayers を呼びます。
   * @ko 유지된 필터로 Rml::RenderManager::CompositeLayers를 호출합니다.
   * @param source - Active layer from this manager, including layer zero.
   * @zh source - 此管理器的活动图层，包括图层零。
   * @ja source - レイヤー零を含む、この管理器の有効なレイヤー。
   * @ko source - 레이어 0을 포함한 이 관리자의 활성 레이어입니다.
   * @param destination - Active layer or this manager's layer zero.
   * @zh destination - 活动图层或此管理器的图层零。
   * @ja destination - 有効なレイヤーまたはこの管理器の基底層。
   * @ko destination - 활성 레이어 또는 이 관리자의 레이어 0입니다.
   * @param blendMode - Blend over or replace destination pixels.
   * @zh blendMode - 叠加或替换目标像素。
   * @ja blendMode - 上に合成、または描画先を置換。
   * @ko blendMode - 대상 위에 합성하거나 교체합니다.
   * @param filters - Optional ordered same-manager live resources.
   * @zh filters - 可选的同管理器有效资源有序列表。
   * @ja filters - 同じ管理器の有効なリソースの任意の順序付きリスト。
   * @ko filters - 같은 관리자의 유효 리소스로 이루어진 선택적 순서 목록입니다.
   */
  compositeLayers(
    source: LayerHandle, destination: LayerHandle,
    blendMode: BlendMode, filters?: FilterHandleList,
  ): void {
    native.renderManagerCompositeLayers(
      renderManagerHandle(this), source, destination, blendMode,
      filters === undefined ? undefined : filterHandleListHandle(filters));
  }

  /**
   * Invoke Rml::RenderManager::PopLayer for a layer pushed through this facade.
   *
   * @zh 为此接口压入的图层调用 Rml::RenderManager::PopLayer。
   * @ja この API で追加したレイヤーに Rml::RenderManager::PopLayer を呼びます。
   * @ko 이 API로 추가한 레이어에 Rml::RenderManager::PopLayer를 호출합니다.
   * @remarks
   * Empty stacks and popping an upstream-owned effect layer throw.
   * @zh 空栈或尝试弹出上游持有的效果图层会抛错。
   * @ja 空スタックや上流が所有するエフェクト層の解放は例外になります。
   * @ko 빈 스택이나 업스트림 소유 효과 층의 팝은 예외를 던집니다.
   */
  popLayer(): void {
    native.renderManagerPopLayer(renderManagerHandle(this));
  }

  /**
   * Invoke Rml::RenderManager::GetTopLayer.
   *
   * @zh 调用 Rml::RenderManager::GetTopLayer。
   * @ja Rml::RenderManager::GetTopLayer を呼びます。
   * @ko Rml::RenderManager::GetTopLayer를 호출합니다.
   * @returns Canonical active layer token, or the base window token.
   * @zh 活动图层的规范令牌或窗口层令牌。
   * @ja 有効な層、または基底層の正規トークン。
   * @ko 활성 층이나 기본 창 층의 정규 토큰입니다.
   */
  getTopLayer(): LayerHandle {
    return native.renderManagerGetTopLayer(
      renderManagerHandle(this)) as LayerHandle;
  }

  /**
   * Invoke Rml::RenderManager::GetNextLayer.
   *
   * @zh 调用 Rml::RenderManager::GetNextLayer。
   * @ja Rml::RenderManager::GetNextLayer を呼びます。
   * @ko Rml::RenderManager::GetNextLayer를 호출합니다.
   * @returns Layer beneath the top; an empty stack throws.
   * @zh 顶层下面的图层；空栈会抛错。
   * @ja 最上層の下の層。空スタックは例外になります。
   * @ko 최상층 아래 층이며 빈 스택은 예외를 던집니다.
   */
  getNextLayer(): LayerHandle {
    return native.renderManagerGetNextLayer(
      renderManagerHandle(this)) as LayerHandle;
  }

  /**
   * Invoke Rml::RenderManager::SaveLayerAsMaskImage.
   *
   * @zh 调用 Rml::RenderManager::SaveLayerAsMaskImage。
   * @ja Rml::RenderManager::SaveLayerAsMaskImage を呼びます。
   * @ko Rml::RenderManager::SaveLayerAsMaskImage를 호출합니다.
   * @returns Owned alpha-mask snapshot within the active scissor region.
   * Empty layer stacks or invalid regions return an invalid filter.
   * @zh 当前裁剪区域内的自有透明度蒙版快照；空栈或无效区域返回无效滤镜。
   * @ja 有効なクリップ領域の所有アルファマスク。空層や無効領域は無効値を返します。
   * @ko 활성 클리핑 영역의 소유 알파 마스크이며 빈 층이나 무효 영역은 무효 값입니다.
   */
  saveLayerAsMaskImage(): CompiledFilter {
    return compiledFilterFromNative(
      native.renderManagerSaveLayerAsMaskImage(renderManagerHandle(this)));
  }

  /**
   * Invoke Rml::RenderManager::MakeGeometry with an immutable mesh snapshot.
   *
   * @zh 使用不可变网格快照调用 Rml::RenderManager::MakeGeometry。
   * @ja 不変メッシュのコピーで Rml::RenderManager::MakeGeometry を呼びます。
   * @ko 불변 메시 사본으로 Rml::RenderManager::MakeGeometry를 호출합니다.
   * @param mesh - Native mesh, consumed when its indices are nonempty.
   * @zh mesh - 原生网格，索引非空时被消耗。
   * @ja mesh - ネイティブメッシュ。インデックスが空でなければ消費します。
   * @ko mesh - 네이티브 메시이며 인덱스가 비어 있지 않으면 소비됩니다.
   * @returns Unique geometry retaining this manager.
   * @zh 保活此管理器的唯一几何资源。
   * @ja この管理器を保持する一意のジオメトリ。
   * @ko 이 관리자를 유지하는 고유 지오메트리입니다.
   */
  makeGeometry(mesh: Mesh): Geometry {
    return geometryFromNative(native.makeGeometry(
      renderManagerHandle(this), meshHandle(mesh)));
  }

  /**
   * Invoke Rml::RenderManager::LoadTexture with native lazy loading.
   *
   * @zh 使用原生延迟加载调用 Rml::RenderManager::LoadTexture。
   * @ja ネイティブ遅延読込で Rml::RenderManager::LoadTexture を呼びます。
   * @ko 네이티브 지연 로딩으로 Rml::RenderManager::LoadTexture를 호출합니다.
   * @param source - Texture filename or resource name.
   * @zh source - 纹理文件名或资源名。
   * @ja source - テクスチャファイル名またはリソース名。
   * @ko source - 텍스처 파일 이름 또는 리소스 이름입니다.
   * @param documentPath - Base document path for relative sources.
   * @zh documentPath - 相对资源所用的文档基路径。
   * @ja documentPath - 相対リソースの基準文書パス。
   * @ko documentPath - 상대 리소스의 기준 문서 경로입니다.
   * @returns View retaining this manager; decoding occurs when needed.
   * @zh 保活此管理器的视图；需要时才解码。
   * @ja この管理器を保持するビュー。必要時にデコードします。
   * @ko 이 관리자를 유지하는 뷰이며 필요 시 디코딩합니다.
   */
  loadTexture(source: string, documentPath = ''): Texture {
    return textureFromNative(native.loadRenderTexture(
      renderManagerHandle(this), source, documentPath));
  }

  /**
   * Invoke Rml::RenderManager::MakeCallbackTexture.
   *
   * @zh 调用 Rml::RenderManager::MakeCallbackTexture。
   * @ja Rml::RenderManager::MakeCallbackTexture を呼びます。
   * @ko Rml::RenderManager::MakeCallbackTexture를 호출합니다.
   * @param callback - Synchronous generation function.
   * @zh callback - 同步生成函数。
   * @ja callback - 同期生成関数。
   * @ko callback - 동기 생성 함수입니다.
   * @returns Unique lazy texture resource.
   * @zh 唯一延迟纹理资源。
   * @ja 一意の遅延テクスチャ資源。
   * @ko 고유 지연 텍스처 리소스입니다.
   */
  makeCallbackTexture(callback: CallbackTextureFunction): CallbackTexture {
    return makeCallbackTexture(renderManagerHandle(this), callback);
  }

  /**
   * Generate an owned SFML texture token for callback SetTextureHandle.
   *
   * @zh 为回调 SetTextureHandle 生成自有 SFML 纹理令牌。
   * @ja SetTextureHandle 用の所有 SFML テクスチャトークンを生成します。
   * @ko SetTextureHandle용 소유 SFML 텍스처 토큰을 생성합니다.
   * @param source - Unshared tightly packed premultiplied RGBA bytes.
   * @zh source - 非共享、紧密排列的预乘 RGBA 字节。
   * @ja source - 非共有で密に格納された乗算済み RGBA バイト。
   * @ko source - 비공유 밀집 사전 곱셈 RGBA 바이트입니다.
   * @param dimensions - Positive integer pixel dimensions.
   * @zh dimensions - 正整数像素尺寸。
   * @ja dimensions - 正の整数ピクセル寸法。
   * @ko dimensions - 양의 정수 픽셀 크기입니다.
   * @returns Transferable token, automatically released when unreferenced.
   * @zh 可转移令牌；失去引用后自动释放。
   * @ja 転送可能なトークン。参照がなくなると解放します。
   * @ko 이전 가능한 토큰이며 참조가 없어지면 해제됩니다.
   */
  generateTextureHandle(
    source: Uint8Array, dimensions: VariantVector2,
  ): TextureHandle {
    return textureHandleFromNative(native.generateTextureHandle(
      renderManagerHandle(this), source, dimensions));
  }

  /**
   * Invoke Rml::RenderManager::CompileFilter.
   *
   * @zh 调用 Rml::RenderManager::CompileFilter。
   * @ja Rml::RenderManager::CompileFilter を呼びます。
   * @ko Rml::RenderManager::CompileFilter를 호출합니다.
   * @remarks
   * Blur sigma is finite, nonnegative physical pixels (default 1).
   * Drop-shadow defaults to sigma 0, zero offset and straight opaque black.
   * Positive offset Y points down. Source alpha is shifted/tinted before blur;
   * the source layer remains unchanged. Filter chains preserve list order.
   * @zh blur 的 sigma 为有限非负物理像素，默认 1。drop-shadow 默认 sigma 为 0、
   * 零偏移和非预乘不透明黑色。正 Y 向下。先偏移着色源透明度再模糊，
   * 源图层保持不变，滤镜按列表顺序执行。
   * @ja blur の sigma は有限の非負物理ピクセル値で、初期値は 1 です。
   * drop-shadow は sigma 0、移動なし、未乗算の不透明な黒が初期値です。
   * 正 Y は下向き。アルファを移動・着色してからぼかし、元レイヤーと順序を保持します。
   * @ko blur sigma는 유한한 음이 아닌 물리 픽셀 값이며 기본값은 1입니다.
   * drop-shadow는 sigma 0, 오프셋 0, 사전 곱셈하지 않은 불투명 검정이 기본값입니다.
   * 양의 Y는 아래쪽이며 알파를 이동·착색한 뒤 블러를 적용하고 원본과 순서를 유지합니다.
   * @param name - Renderer filter name.
   * @zh name - 渲染器滤镜名称。
   * @ja name - 描画器のフィルター名。
   * @ko name - 렌더러 필터 이름입니다.
   * @param parameters - Copied native parameters, such as blur sigma.
   * @zh parameters - 复制的原生参数，如模糊的 sigma。
   * @ja parameters - blur の sigma など、コピーされるネイティブ引数。
   * @ko parameters - blur의 sigma 등 복사되는 네이티브 매개변수입니다.
   * @returns Unique resource; isValid is false on invalid or unsupported input.
   * @zh 唯一资源；参数无效或不支持编译时 isValid 为 false。
   * @ja 一意のリソース。引数不正やコンパイル非対応なら isValid は false。
   * @ko 고유 리소스이며 잘못된 입력이나 미지원 컴파일은 isValid가 false입니다.
   */
  compileFilter(name: string, parameters: RenderParameters): CompiledFilter {
    return compiledFilterFromNative(native.compileRenderFilter(
      renderManagerHandle(this), name, parameters));
  }

  /**
   * Compile a native gradient, creation effect or explicit GLSL program.
   *
   * @zh 编译原生渐变、creation 效果或显式 GLSL 程序。
   * @ja ネイティブのグラデーション、creation、明示的 GLSL をコンパイルします。
   * @ko 네이티브 그라데이션, creation 효과나 명시적 GLSL을 컴파일합니다.
   * @remarks
   * Gradients use resolved NUMBER stops and local pixel coordinates; all stops
   * are compiled without truncation. Creation uses normalized coordinates,
   * positive dimensions and the SystemInterface clock. Invalid dictionaries
   * or GPU compilation failures produce an invalid resource.
   * @zh 渐变使用 NUMBER 单位停靠点及局部像素坐标，所有停靠点均参与编译。
   * creation 使用归一化坐标、正尺寸及 SystemInterface 时钟。
   * 参数无效或 GPU 编译失败时返回无效资源。
   * @ja グラデーションは NUMBER 停止位置とローカルピクセル座標を使用し、
   * 全停止点を保持します。creation は正規化座標、正の寸法とシステム時計を使用。
   * 引数不正や GPU コンパイル失敗は無効なリソースを返します。
   * @ko 그라데이션은 NUMBER 정지점과 로컬 픽셀 좌표를 사용하며 모두 보존합니다.
   * creation은 정규화 좌표, 양수 크기와 SystemInterface 시계를 사용합니다.
   * 잘못된 매개변수나 GPU 컴파일 실패는 유효하지 않은 리소스를 반환합니다.
   * @param name - Renderer shader name.
   * @zh name - 渲染器着色器名称。
   * @ja name - 描画器のシェーダー名。
   * @ko name - 렌더러 셰이더 이름입니다.
   * @param parameters - Copied effect dictionary or GLSL source and uniforms.
   * @zh parameters - 复制的效果字典或 GLSL 源码及 uniform 参数。
   * @ja parameters - コピーされる効果辞書、または GLSL ソースと uniform。
   * @ko parameters - 복사되는 효과 사전 또는 GLSL 소스와 uniform입니다.
   * @returns Unique resource; isValid is false when compilation fails.
   * @zh 唯一资源；编译失败时 isValid 为 false。
   * @ja 一意のリソース。コンパイル失敗時の isValid は false。
   * @ko 고유 리소스이며 컴파일에 실패하면 isValid가 false입니다.
   */
  compileShader(name: string, parameters: RenderParameters): CompiledShader {
    return compiledShaderFromNative(native.compileRenderShader(
      renderManagerHandle(this), name, parameters));
  }
}

/**
 * Resolve the native manager token.
 *
 * @internal
 * @param value - Public manager.
 * @returns Checked token.
 */
export function renderManagerHandle(value: RenderManager): object {
  const result = managers.get(value);
  if (!result) {
    throw new TypeError('Expected a render manager');
  }
  return result;
}

/**
 * Preserve live wrapper identity for a native manager.
 *
 * @internal
 * @param handle - Native manager.
 * @returns Canonical wrapper.
 */
export function renderManagerFromNative(handle: object): RenderManager {
  const existing = wrappers.get(handle);
  if (existing) {
    return existing;
  }
  const result = Object.create(RenderManager.prototype) as RenderManager;
  managers.set(result, handle);
  wrappers.set(handle, result);
  return result;
}
