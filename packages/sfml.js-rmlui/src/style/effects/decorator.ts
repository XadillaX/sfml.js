import { native } from '../../internal/native';
import { Element } from '../../dom/elements/element';
import { BoxArea } from '../../dom/elements/layout';
import {
  renderManagerHandle, type RenderManager,
} from '../../rendering/render-manager';
import {
  textureFromNative, textureHandle, type Texture,
} from '../../rendering/texture';

const decorators = new WeakMap<Decorator, object>();
const dataHandles = new WeakMap<DecoratorData, object>();

/**
 * Synchronous Rml::Decorator virtual functions with host-owned element data.
 *
 * @zh 使用宿主元素数据的同步 Rml::Decorator 虚函数。
 * @ja ホストの要素データを使う同期 Rml::Decorator 仮想関数。
 * @ko 호스트 요소 데이터를 사용하는 동기 Rml::Decorator 가상 함수입니다.
 * @template Data - Per-element data object shared by the callbacks.
 * @zh Data - 回调之间共享的逐元素数据对象。
 * @ja Data - コールバック間で共有する要素別データオブジェクト。
 * @ko Data - 콜백 간에 공유하는 요소별 데이터 객체입니다.
 */
export interface DecoratorCallbacks<Data extends object = object> {
  /**
   * Create data for one decorated element; null disables its rendering.
   *
   * @zh 为一个装饰元素创建数据；null 禁用其绘制。
   * @ja 装飾する要素のデータを作成します。null は描画を無効にします。
   * @ko 장식할 요소의 데이터를 생성하며 null은 렌더링을 비활성화합니다.
   * @param element - Element receiving this decorator.
   * @zh element - 使用此装饰器的元素。
   * @ja element - この装飾器を使う要素。
   * @ko element - 이 장식기를 사용하는 요소입니다.
   * @param paintArea - Concrete native paint area.
   * @zh paintArea - 具体的原生绘制区域。
   * @ja paintArea - ネイティブの具体的な描画領域。
   * @ko paintArea - 구체적인 네이티브 그리기 영역입니다.
   * @returns Data object, or null for INVALID_DECORATORDATAHANDLE.
   * @zh 数据对象；null 对应 INVALID_DECORATORDATAHANDLE。
   * @ja データオブジェクト。null は INVALID_DECORATORDATAHANDLE に対応します。
   * @ko 데이터 객체이며 null은 INVALID_DECORATORDATAHANDLE에 대응합니다.
   */
  generateElementData(element: Element, paintArea: BoxArea): Data | null;

  /**
   * Render using the unchanged object returned by generateElementData.
   *
   * @zh 使用 generateElementData 返回的同一对象绘制。
   * @ja generateElementData が返した同じオブジェクトで描画します。
   * @ko generateElementData가 반환한 동일한 객체로 렌더링합니다.
   * @param element - Element being rendered.
   * @zh element - 正在绘制的元素。
   * @ja element - 描画する要素。
   * @ko element - 렌더링할 요소입니다.
   * @param data - Original per-element object.
   * @zh data - 原始逐元素对象。
   * @ja data - 元の要素別オブジェクト。
   * @ko data - 원래 요소별 객체입니다.
   */
  renderElement(element: Element, data: Data): void;

  /**
   * Release per-element resources at a safe runtime boundary.
   *
   * @zh 在安全的运行时边界释放逐元素资源。
   * @ja 安全なランタイム境界で要素別リソースを解放します。
   * @ko 안전한 런타임 경계에서 요소별 리소스를 해제합니다.
   * @param data - Original data; the element may already have been destroyed.
   * @zh data - 原始数据；元素可能已销毁。
   * @ja data - 元のデータ。要素は既に破棄されている場合があります。
   * @ko data - 원래 데이터이며 요소는 이미 파괴되었을 수 있습니다.
   * @remarks
   * Explicit release guarantees the callback. GC queues release until the
   * next runtime call, and skips callbacks whose data or closures were
   * collected. Explicit release is required for deterministic cleanup.
   * @zh 显式释放保证调用。GC 将释放延迟到下次运行时调用；数据或闭包已被回收时
   * 跳过回调。需要确定性清理时必须显式释放。
   * @ja 明示的解放は呼び出しを保証します。GC は次の呼び出しまで解放を遅延し、
   * 回収済みのデータやクロージャーは省略します。確実な解放は明示的に行います。
   * @ko 명시적 해제는 호출을 보장합니다. GC는 다음 런타임 호출까지 해제를 지연하며
   * 수집된 데이터나 클로저는 건너뜁니다. 확정적인 정리는 명시적으로 해제합니다.
   */
  releaseElementData(data: Data): void;
}

/**
 * Owned Rml::DecoratorDataHandle with checked decorator and element identity.
 *
 * @zh 自有 Rml::DecoratorDataHandle，检查装饰器与元素身份。
 * @ja 装飾器と要素の同一性を検証する所有 Rml::DecoratorDataHandle。
 * @ko 장식기와 요소의 동일성을 검사하는 소유 Rml::DecoratorDataHandle입니다.
 * @remarks
 * Release with the creating decorator. GC and render-manager invalidation
 * also release the native data; foreign or already released data cannot render.
 * @zh 使用创建它的装饰器释放。GC 和渲染管理器失效也会释放原生数据；
 * 不属于该装饰器或已释放的数据不能用于渲染。
 * @ja 作成元の装飾器で解放します。GC と描画管理器の無効化でも解放されます。
 * 他の装飾器のデータや解放済みデータは描画できません。
 * @ko 생성한 장식기로 해제합니다. GC와 렌더 관리자 무효화도 데이터를 해제하며
 * 다른 장식기의 데이터나 해제된 데이터로는 렌더링할 수 없습니다.
 */
export class DecoratorData {
  /** @internal */
  private constructor() {}

  /**
   * Whether this token still owns unreleased native element data.
   *
   * @zh 此令牌是否仍持有未释放的原生元素数据。
   * @ja このトークンが未解放のネイティブ要素データを所有するか。
   * @ko 이 토큰이 해제되지 않은 네이티브 요소 데이터를 소유하는지 나타냅니다.
   * @returns Whether native element data remains allocated.
   * @zh 原生元素数据是否仍已分配。
   * @ja ネイティブ要素データが割り当て済みか。
   * @ko 네이티브 요소 데이터가 할당되어 있는지 나타냅니다.
   */
  get isValid(): boolean {
    return native.decoratorDataIsValid(dataHandle(this));
  }
}

/**
 * Shared Rml::Decorator returned by an instancer.
 *
 * @zh 实例器返回的共享 Rml::Decorator。
 * @ja インスタンサーが返す共有 Rml::Decorator。
 * @ko 인스턴서가 반환하는 공유 Rml::Decorator입니다.
 * @template Data - Custom per-element callback data.
 * @zh Data - 自定义逐元素回调数据。
 * @ja Data - カスタム要素別コールバックデータ。
 * @ko Data - 사용자 정의 요소별 콜백 데이터입니다.
 * @remarks
 * Manual element data is independent of RmlUi's automatic per-element data.
 * The decorator belongs to its instancing render manager and is invalidated
 * when that manager is released or the runtime shuts down.
 * @zh 手动生成的数据独立于 RmlUi 自动管理的逐元素数据。装饰器属于实例化时的
 * 渲染管理器，在该管理器释放或运行时关闭后失效。
 * @ja 手動生成データは RmlUi が自動管理する要素データと独立しています。
 * 生成時の描画管理器に属し、管理器の解放やランタイム終了で無効になります。
 * @ko 수동 생성 데이터는 RmlUi의 자동 요소 데이터와 독립적입니다.
 * 생성 시 렌더 관리자에 속하며 관리자 해제나 런타임 종료 시 무효화됩니다.
 */
export class Decorator<Data extends object = object> {
  /** @internal */
  private declare readonly decoratorBrand: void;

  /**
   * Create a custom Rml::Decorator bound to a render manager.
   *
   * @zh 创建绑定到渲染管理器的自定义 Rml::Decorator。
   * @ja 描画管理器に結び付いたカスタム Rml::Decorator を作成します。
   * @ko 렌더 관리자에 연결된 사용자 정의 Rml::Decorator를 생성합니다.
   * @param manager - Manager used for all element and texture resources.
   * @zh manager - 用于所有元素与纹理资源的管理器。
   * @ja manager - すべての要素とテクスチャの管理器。
   * @ko manager - 모든 요소와 텍스처 리소스에 사용하는 관리자입니다.
   * @param callbacks - Synchronous implementations of all three virtuals.
   * @zh callbacks - 三个虚函数的同步实现。
   * @ja callbacks - 三つの仮想関数の同期実装。
   * @ko callbacks - 세 가상 함수의 동기 구현입니다.
   * @template Data - Custom per-element callback data.
   * @zh Data - 自定义逐元素回调数据。
   * @ja Data - カスタム要素別コールバックデータ。
   * @ko Data - 사용자 정의 요소별 콜백 데이터입니다.
   * @remarks
   * Callbacks may read elements and render resources. DOM mutation, shutdown
   * and recursive rendering are rejected during a callback.
   * @zh 回调可读取元素与绘制资源；回调期间拒绝 DOM 修改、关闭和递归渲染。
   * @ja 要素の参照とリソース描画が可能です。コールバック中の DOM 変更、
   * 終了、再帰描画は拒否されます。
   * @ko 요소 조회와 리소스 렌더링이 가능하며 콜백 중 DOM 변경,
   * 종료 및 재귀 렌더링은 거부합니다.
   */
  constructor(manager: RenderManager, callbacks: DecoratorCallbacks<Data>) {
    const generate = callbacks?.generateElementData;
    const render = callbacks?.renderElement;
    const release = callbacks?.releaseElementData;
    if (typeof generate !== 'function' || typeof render !== 'function' ||
        typeof release !== 'function') {
      throw new TypeError('Expected all three decorator callbacks');
    }
    decorators.set(this, native.createDecorator(
      renderManagerHandle(manager),
      (element, area) => generate(Element.wrap(element), area),
      (element, data) => render(Element.wrap(element), data as Data),
      data => release(data as Data)));
  }

  /**
   * Add a texture to a custom decorator; Rml::Decorator::AddTexture.
   *
   * @zh 向自定义装饰器添加纹理，对应 Rml::Decorator::AddTexture。
   * @ja カスタム装飾器に追加します。Rml::Decorator::AddTexture。
   * @ko 사용자 정의 장식기에 추가하며 Rml::Decorator::AddTexture에 대응합니다.
   * @param texture - Texture from this decorator's render manager.
   * @zh texture - 来自该装饰器渲染管理器的纹理。
   * @ja texture - この装飾器の描画管理器に属するテクスチャ。
   * @ko texture - 이 장식기의 렌더 관리자에 속한 텍스처입니다.
   * @returns Native index, or -1 for an invalid texture.
   * @zh 原生索引；无效纹理返回 -1。
   * @ja ネイティブ添字。無効な場合は -1。
   * @ko 네이티브 인덱스이며 유효하지 않으면 -1입니다.
   */
  addTexture(texture: Texture): number {
    return native.decoratorAddTexture(
      decoratorHandle(this), textureHandle(texture));
  }

  /**
   * Return the custom decorator's Rml::Decorator::GetNumTextures.
   *
   * @zh 返回自定义装饰器的 Rml::Decorator::GetNumTextures。
   * @ja カスタム装飾器の Rml::Decorator::GetNumTextures を返します。
   * @ko 사용자 정의 장식기의 Rml::Decorator::GetNumTextures를 반환합니다.
   * @returns Number of valid textures previously added.
   * @zh 已添加的有效纹理数量。
   * @ja 追加済みの有効なテクスチャ数。
   * @ko 추가된 유효한 텍스처 수입니다.
   */
  getNumTextures(): number {
    return native.decoratorGetNumTextures(decoratorHandle(this));
  }

  /**
   * Get a custom decorator texture; Rml::Decorator::GetTexture.
   *
   * @zh 获取自定义装饰器纹理，对应 Rml::Decorator::GetTexture。
   * @ja カスタム装飾器のテクスチャを取得します。Rml::Decorator::GetTexture。
   * @ko 사용자 정의 장식기의 텍스처인 Rml::Decorator::GetTexture를 얻습니다.
   * @param index - Native index; defaults to zero.
   * @zh index - 原生索引，默认为零。
   * @ja index - ネイティブ添字。既定はゼロ。
   * @ko index - 네이티브 인덱스이며 기본값은 0입니다.
   * @returns Texture, or an invalid texture when the index is out of range.
   * @zh 纹理；索引越界时返回无效纹理。
   * @ja テクスチャ。範囲外の添字では無効なテクスチャ。
   * @ko 텍스처이며 인덱스가 범위를 벗어나면 유효하지 않은 텍스처입니다.
   */
  getTexture(index = 0): Texture {
    return textureFromNative(native.decoratorGetTexture(
      decoratorHandle(this), index));
  }

  /**
   * Invoke Rml::Decorator::GenerateElementData.
   *
   * @zh 调用 Rml::Decorator::GenerateElementData。
   * @ja Rml::Decorator::GenerateElementData を呼びます。
   * @ko Rml::Decorator::GenerateElementData를 호출합니다.
   * @param element - Live element using this decorator's render manager.
   * @zh element - 使用该装饰器渲染管理器的存活元素。
   * @ja element - この装飾器と同じ描画管理器を使う有効な要素。
   * @ko element - 이 장식기와 같은 렌더 관리자를 사용하는 유효한 요소입니다.
   * @param paintArea - Concrete box area; defaults to Padding. Auto is invalid.
   * @zh paintArea - 具体盒区域，默认 Padding；不能使用 Auto。
   * @ja paintArea - 具体的な領域。既定は Padding。Auto は無効です。
   * @ko paintArea - 구체적인 영역이며 기본값은 Padding이고 Auto는 불가합니다.
   * @returns Owned token, or null for INVALID_DECORATORDATAHANDLE.
   * @zh 自有令牌；INVALID_DECORATORDATAHANDLE 对应 null。
   * @ja 所有トークン。INVALID_DECORATORDATAHANDLE の場合は null。
   * @ko 소유 토큰이며 INVALID_DECORATORDATAHANDLE은 null입니다.
   */
  generateElementData(
    element: Element, paintArea: BoxArea = BoxArea.Padding,
  ): DecoratorData | null {
    const handle = native.decoratorGenerateElementData(
      decoratorHandle(this), element.handle, paintArea);
    if (handle === null) {
      return null;
    }
    const data = Object.create(DecoratorData.prototype) as DecoratorData;
    dataHandles.set(data, handle);
    return data;
  }

  /**
   * Invoke Rml::Decorator::RenderElement using checked manual element data.
   *
   * @zh 使用检查后的手动元素数据调用 Rml::Decorator::RenderElement。
   * @ja 検証済み手動データで Rml::Decorator::RenderElement を呼びます。
   * @ko 검증된 수동 데이터로 Rml::Decorator::RenderElement를 호출합니다.
   * @param element - Original live element used to generate the data.
   * @zh element - 生成该数据时的原始存活元素。
   * @ja element - データ生成時の元の有効な要素。
   * @ko element - 데이터 생성 시 사용한 원래의 유효한 요소입니다.
   * @param data - Unreleased data created by this decorator.
   * @zh data - 此装饰器创建且尚未释放的数据。
   * @ja data - この装飾器が作成した未解放のデータ。
   * @ko data - 이 장식기가 생성한 해제되지 않은 데이터입니다.
   */
  renderElement(element: Element, data: DecoratorData): void {
    native.decoratorRenderElement(
      decoratorHandle(this), element.handle, dataHandle(data));
  }

  /**
   * Invoke Rml::Decorator::ReleaseElementData once; repeated release is safe.
   *
   * @zh 调用一次 Rml::Decorator::ReleaseElementData，重复释放安全。
   * @ja Rml::Decorator::ReleaseElementData を一度だけ呼びます。再解放は安全です。
   * @ko Rml::Decorator::ReleaseElementData를 한 번만 호출하며 재해제는 안전합니다.
   * @param data - Data created by this decorator, even after its element died.
   * @zh data - 此装饰器创建的数据，原元素销毁后也可释放。
   * @ja data - この装飾器のデータ。元の要素が破棄された後も解放できます。
   * @ko data - 이 장식기의 데이터이며 원래 요소 파괴 후에도 해제할 수 있습니다.
   */
  releaseElementData(data: DecoratorData): void {
    native.decoratorReleaseElementData(
      decoratorHandle(this), dataHandle(data));
  }
}

/**
 * Resolve a checked native decorator.
 *
 * @internal
 * @param value - Public decorator.
 * @returns Native token.
 */
export function decoratorHandle(value: Decorator): object {
  const handle = decorators.get(value);
  if (!handle) {
    throw new TypeError('Expected an owned decorator');
  }
  return handle;
}

/**
 * Wrap a shared native decorator.
 *
 * @internal
 * @param handle - Native token.
 * @returns Public decorator.
 */
export function decoratorFromNative(handle: object): Decorator {
  const result = Object.create(Decorator.prototype) as Decorator;
  decorators.set(result, handle);
  return result;
}

/**
 * Resolve checked manual element data.
 *
 * @param value - Public data token.
 * @returns Native data token.
 */
function dataHandle(value: DecoratorData): object {
  const handle = dataHandles.get(value);
  if (!handle) {
    throw new TypeError('Expected decorator element data');
  }
  return handle;
}
