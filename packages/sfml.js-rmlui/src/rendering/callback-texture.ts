import { native } from '../internal/native';
import {
  renderManagerHandle, renderManagerFromNative, type RenderManager,
} from './render-manager';
import { textureFromNative, type Texture } from './texture';
import type { VariantVector2 } from '../values/types';

const resources = new WeakMap<CallbackTexture, object>();
const sources = new WeakMap<CallbackTextureSource, object>();
const interfaces = new WeakMap<CallbackTextureInterface, object>();
const handles = new WeakMap<TextureHandle, object>();

/**
 * Resolve a checked native token.
 *
 * @internal
 * @param registry - Token registry.
 * @param value - Public resource.
 * @returns Native token.
 */
function token<T extends object>(
  registry: WeakMap<T, object>, value: T,
): object {
  const handle = registry.get(value);
  if (!handle) {
    throw new TypeError('Expected a callback texture resource');
  }
  return handle;
}

/**
 * Synchronous Rml::CallbackTextureFunction; submit exactly once on success.
 *
 * @zh 同步 Rml::CallbackTextureFunction；成功时恰好提交一次纹理。
 * @ja 同期 Rml::CallbackTextureFunction。成功時は一度だけ提出します。
 * @ko 동기 Rml::CallbackTextureFunction이며 성공 시 한 번 제출합니다.
 */
export interface CallbackTextureFunction {
  /**
   * Generate a native texture synchronously.
   *
   * @zh 同步生成原生纹理。
   * @ja ネイティブテクスチャを同期生成します。
   * @ko 네이티브 텍스처를 동기 생성합니다.
   * @param textureInterface - Submission interface scoped to this callback.
   * @zh textureInterface - 仅在此次回调期间有效的提交接口。
   * @ja textureInterface - このコールバック中のみ有効な提出インターフェース。
   * @ko textureInterface - 이 콜백 동안만 유효한 제출 인터페이스입니다.
   * @returns True after submission; false caches generation failure.
   * @zh 提交成功后返回 true；false 缓存生成失败。
   * @ja 提出成功後は true。false は生成失敗をキャッシュします。
   * @ko 제출 성공 시 true이며 false는 생성 실패를 캐시합니다.
   */
  (textureInterface: CallbackTextureInterface): boolean;
}

/**
 * Owned SFML texture token for Rml::CallbackTextureInterface::SetTextureHandle.
 *
 * @zh 用于 SetTextureHandle 的自有 SFML 纹理令牌。
 * @ja SetTextureHandle 用の所有 SFML テクスチャトークン。
 * @ko SetTextureHandle에 사용하는 소유 SFML 텍스처 토큰입니다.
 * @remarks
 * Created by RenderManager.generateTextureHandle. A successful transfer gives
 * native CallbackTexture ownership; the token becomes empty. No raw pointer is
 * accepted. Untransferred handles are released by GC or runtime shutdown.
 * @zh 由 RenderManager.generateTextureHandle 创建。成功转移后由原生回调纹理持有，
 * 令牌变为空。不接受裸指针；未转移句柄在 GC 或关闭运行时时释放。
 * @ja generateTextureHandle で作成し、転送後は空になります。生ポインターは不可。
 * 未転送のハンドルは GC または終了時に解放します。
 * @ko generateTextureHandle로 생성하며 이전 후 비워집니다. 원시 포인터는 받지
 * 않으며 이전하지 않은 핸들은 GC 또는 종료 시 해제됩니다.
 */
export class TextureHandle {
  private constructor() {}

  /**
   * Whether this token still owns its texture.
   *
   * @zh 令牌是否仍持有纹理。
   * @ja トークンがテクスチャを所有しているか。
   * @ko 토큰이 텍스처를 소유하는지 여부입니다.
   * @returns False after transfer or release.
   * @zh 转移或释放后为 false。
   * @ja 転送または解放後は false。
   * @ko 이전 또는 해제 후 false입니다.
   */
  get isValid(): boolean {
    return native.textureHandleIsValid(token(handles, this));
  }

  /**
   * Release an untransferred texture; an empty token is a no-op.
   *
   * @zh 释放未转移纹理；空令牌无操作。
   * @ja 未転送のテクスチャを解放し、空のトークンには何もしません。
   * @ko 이전하지 않은 텍스처를 해제하며 빈 토큰은 무시합니다.
   */
  release(): void {
    native.releaseTextureHandle(token(handles, this));
  }
}

/**
 * Rml::CallbackTextureInterface valid only during its generation callback.
 *
 * @zh 仅在生成回调期间有效的 Rml::CallbackTextureInterface。
 * @ja 生成コールバック中のみ有効な Rml::CallbackTextureInterface。
 * @ko 생성 콜백 동안만 유효한 Rml::CallbackTextureInterface입니다.
 * @remarks
 * Only these scoped methods may enter native code during generation. Runtime,
 * DOM, resource operations and recursive rendering are rejected. Returning
 * false or throwing releases any submitted texture and caches the failure.
 * @zh 生成期间仅这些作用域方法可进入原生代码。运行时、DOM、资源操作及递归绘制会拒绝。
 * 返回 false 或抛错会释放已提交纹理并缓存失败。
 * @ja 生成中はこのインターフェースのみ操作可能です。再描画や DOM 操作は不可。
 * false または例外で提出済みのテクスチャを解放し、失敗をキャッシュします。
 * @ko 생성 중 이 인터페이스만 사용 가능합니다. 재렌더링과 DOM 조작은 거부합니다.
 * false 또는 예외 시 제출한 텍스처를 해제하고 실패를 캐시합니다.
 */
export class CallbackTextureInterface {
  private constructor() {}

  /**
   * Generate a texture from tightly packed premultiplied RGBA bytes.
   *
   * @zh 从紧密排列的预乘 RGBA 字节生成纹理。
   * @ja 密に格納された乗算済み RGBA バイトから生成します。
   * @ko 밀집된 사전 곱셈 RGBA 바이트로 텍스처를 생성합니다.
   * @param source - Unshared width × height × 4 bytes; Buffer is accepted.
   * @zh source - 非共享的宽 × 高 × 4 字节；支持 Buffer。
   * @ja source - 非共有の幅 × 高さ × 4 バイト。Buffer も使用できます。
   * @ko source - 비공유 너비 × 높이 × 4 바이트이며 Buffer도 지원합니다.
   * @param dimensions - Positive integer pixel dimensions.
   * @zh dimensions - 正整数像素尺寸。
   * @ja dimensions - 正の整数のピクセル寸法。
   * @ko dimensions - 양의 정수 픽셀 크기입니다.
   * @returns Native GenerateTexture result.
   * @zh 原生 GenerateTexture 结果。
   * @ja ネイティブ GenerateTexture の結果。
   * @ko 네이티브 GenerateTexture 결과입니다.
   */
  generateTexture(source: Uint8Array, dimensions: VariantVector2): boolean {
    return native.callbackGenerateTexture(token(interfaces, this),
      source, dimensions);
  }

  /**
   * Snapshot the current layer within the active nonempty scissor region.
   *
   * @zh 在有效非空裁剪区域内快照当前图层。
   * @ja 有効で空でないシザー領域内のレイヤーを複製します。
   * @ko 유효한 비어 있지 않은 시저 영역에서 현재 레이어를 복사합니다.
   */
  saveLayerAsTexture(): void {
    native.callbackSaveLayerAsTexture(token(interfaces, this));
  }

  /**
   * Transfer an owned texture token, invoking native SetTextureHandle.
   *
   * @zh 转移自有纹理令牌，调用原生 SetTextureHandle。
   * @ja 所有トークンを転送し、ネイティブ SetTextureHandle を呼びます。
   * @ko 소유 토큰을 이전하여 네이티브 SetTextureHandle을 호출합니다.
   * @param handle - Untransferred token from the same manager.
   * @zh handle - 同一管理器创建且未转移的令牌。
   * @ja handle - 同じ管理器の未転送トークン。
   * @ko handle - 같은 관리자의 이전하지 않은 토큰입니다.
   * @param dimensions - Exact dimensions used when generating the token.
   * @zh dimensions - 生成令牌时使用的精确尺寸。
   * @ja dimensions - 作成時に使用した正確な寸法。
   * @ko dimensions - 생성 시 사용한 정확한 크기입니다.
   */
  setTextureHandle(handle: TextureHandle, dimensions: VariantVector2): void {
    native.callbackSetTextureHandle(token(interfaces, this),
      token(handles, handle), dimensions);
  }

  /**
   * Read native GetRenderManager while the callback interface is active.
   *
   * @zh 在接口有效时读取原生 GetRenderManager。
   * @ja インターフェースが有効な間に GetRenderManager を取得します。
   * @ko 인터페이스가 활성 상태일 때 GetRenderManager를 읽습니다.
   * @returns The originating manager; its operations remain guarded.
   * @zh 来源管理器；其操作仍受回调保护。
   * @ja 元の管理器。操作はコールバック保護の対象です。
   * @ko 원본 관리자이며 조작은 콜백 보호를 받습니다.
   */
  getRenderManager(): RenderManager {
    return renderManagerFromNative(
      native.callbackGetRenderManager(token(interfaces, this)));
  }
}

/**
 * Unique Rml::CallbackTexture with lazy synchronous texture generation.
 *
 * @zh 延迟同步生成纹理的唯一 Rml::CallbackTexture。
 * @ja 遅延同期生成する一意の Rml::CallbackTexture。
 * @ko 지연 동기 생성을 사용하는 고유 Rml::CallbackTexture입니다.
 */
export class CallbackTexture {
  /**
   * Construct the native default empty resource.
   *
   * @zh 构造原生默认空资源。
   * @ja ネイティブ既定の空リソースを構築します。
   * @ko 네이티브 기본 빈 리소스를 생성합니다.
   */
  constructor() {
    resources.set(this, native.createCallbackTexture());
  }

  /**
   * Read the native stable-index invalid sentinel.
   *
   * @zh 读取原生稳定索引的无效哨兵。
   * @ja ネイティブ安定インデックスの無効値を取得します。
   * @ko 네이티브 안정 인덱스 무효값을 읽습니다.
   * @returns 4294967295, Rml::CallbackTexture::InvalidHandle.
   * @zh 4294967295，即原生 InvalidHandle。
   * @ja 4294967295、ネイティブ InvalidHandle。
   * @ko 4294967295이며 네이티브 InvalidHandle입니다.
   */
  static invalidHandle(): 4294967295 {
    return 4294967295;
  }

  /**
   * Read native resource validity without invoking the callback.
   *
   * @zh 读取原生资源有效性，不调用回调。
   * @ja コールバックを呼ばずにリソースの有効性を取得します。
   * @ko 콜백을 호출하지 않고 리소스 유효성을 읽습니다.
   * @returns False for empty or released resources.
   * @zh 空资源或已释放资源为 false。
   * @ja 空または解放済みの場合は false。
   * @ko 비어 있거나 해제된 리소스는 false입니다.
   */
  get isValid(): boolean {
    return native.callbackTextureIsValid(token(resources, this));
  }

  /**
   * Invoke native operator Texture, retaining unique ownership in the view.
   *
   * @zh 调用原生 operator Texture，视图保活唯一资源。
   * @ja operator Texture を呼び、ビューに所有権を保持します。
   * @ko operator Texture를 호출하며 뷰가 고유 소유권을 유지합니다.
   * @returns A lazy view; release invalidates existing nonempty aliases.
   * @zh 延迟视图；释放会使已有非空别名失效。
   * @ja 遅延ビュー。解放すると既存の空でない別名は失効します。
   * @ko 지연 뷰이며 해제 시 기존의 비어 있지 않은 별칭은 무효화됩니다.
   */
  toTexture(): Texture {
    return textureFromNative(
      native.callbackTextureToTexture(token(resources, this)));
  }

  /**
   * Invoke native Release once; subsequent calls are no-ops.
   *
   * @zh 调用原生 Release；重复调用无操作。
   * @ja ネイティブ Release を呼び、再呼出しは何もしません。
   * @ko 네이티브 Release를 호출하며 반복 호출은 무시합니다.
   */
  release(): void {
    native.releaseCallbackTexture(token(resources, this));
  }
}

/**
 * CallbackTextureSource equivalent with a unique callback texture per manager.
 *
 * @zh 按管理器缓存唯一回调纹理的 CallbackTextureSource 等价接口。
 * @ja 管理器ごとに一意のテクスチャを保持する CallbackTextureSource 相当。
 * @ko 관리자별 고유 텍스처를 캐시하는 CallbackTextureSource 대응입니다.
 * @remarks
 * Native cache ownership is retained by returned views. JS move construction
 * and assignment use ordinary object references; no native resource is copied.
 * @zh 返回视图保活原生缓存资源。移动构造和赋值使用普通 JS 对象引用，不复制原生资源。
 * @ja ビューがキャッシュの寿命を保持します。移動は JS 参照で表し、資源は複製しません。
 * @ko 뷰가 캐시 수명을 유지합니다. 이동은 JS 참조로 표현하며 리소스를 복사하지 않습니다.
 */
export class CallbackTextureSource {
  /**
   * Store a synchronous callback, or create the native default empty source.
   *
   * @zh 保存同步回调，或创建默认空纹理源。
   * @ja 同期コールバックを保持するか、既定の空ソースを作成します。
   * @ko 동기 콜백을 저장하거나 기본 빈 소스를 생성합니다.
   * @param callback - Generation callback; undefined gives empty views.
   * @zh callback - 生成回调；undefined 返回空视图。
   * @ja callback - 生成関数。undefined は空のビューを返します。
   * @ko callback - 생성 콜백이며 undefined는 빈 뷰를 반환합니다.
   */
  constructor(callback?: CallbackTextureFunction) {
    sources.set(this, native.createCallbackTextureSource(
      callback === undefined ? undefined : bridge(callback)));
  }

  /**
   * Acquire the lazily generated view cached for a live render manager.
   *
   * @zh 获取按有效渲染管理器缓存的延迟生成视图。
   * @ja 有効な管理器にキャッシュした遅延生成ビューを取得します。
   * @ko 유효한 관리자에 캐시한 지연 생성 뷰를 가져옵니다.
   * @param manager - Native render manager.
   * @zh manager - 原生渲染管理器。
   * @ja manager - ネイティブ描画管理器。
   * @ko manager - 네이티브 렌더 관리자입니다.
   * @returns Cached view; unused manager release clears that cache entry.
   * @zh 缓存视图；释放未使用管理器会清除此缓存条目。
   * @ja キャッシュしたビュー。未使用管理器の解放で項目を削除します。
   * @ko 캐시한 뷰이며 미사용 관리자 해제 시 해당 항목을 삭제합니다.
   */
  getTexture(manager: RenderManager): Texture {
    return textureFromNative(native.callbackTextureSourceGetTexture(
      token(sources, this), renderManagerHandle(manager)));
  }
}

/**
 * Adapt a public callback to a native scoped token.
 *
 * @internal
 * @param callback - User function.
 * @returns Native function.
 */
function bridge(
  callback: CallbackTextureFunction,
): (handle: object) => boolean {
  if (typeof callback !== 'function') {
    throw new TypeError('Expected a texture callback function');
  }
  return handle => {
    const api = Object.create(
      CallbackTextureInterface.prototype) as CallbackTextureInterface;
    interfaces.set(api, handle);
    return callback(api);
  };
}

/**
 * Construct a unique callback resource through a render manager.
 *
 * @internal
 * @param manager - Native token.
 * @param callback - Public function.
 * @returns Public resource.
 */
export function makeCallbackTexture(
  manager: object, callback: CallbackTextureFunction,
): CallbackTexture {
  const result = Object.create(CallbackTexture.prototype) as CallbackTexture;
  resources.set(result, native.makeCallbackTexture(manager, bridge(callback)));
  return result;
}

/**
 * Wrap an owned native texture token.
 *
 * @internal
 * @param handle - Native token.
 * @returns Public token.
 */
export function textureHandleFromNative(handle: object): TextureHandle {
  const result = Object.create(TextureHandle.prototype) as TextureHandle;
  handles.set(result, handle);
  return result;
}
