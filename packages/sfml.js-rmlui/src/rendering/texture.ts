import { native } from '../internal/native';
import type { VariantVector2 } from '../values/types';

const textures = new WeakMap<Texture, object>();

/**
 * Rml::Texture view retaining its native render manager.
 *
 * @zh 保活原生渲染管理器的 Rml::Texture 视图。
 * @ja ネイティブ描画管理器を保持する Rml::Texture ビュー。
 * @ko 네이티브 렌더 관리자를 유지하는 Rml::Texture 뷰입니다.
 * @remarks
 * File textures load lazily; isValid indicates a view, not successful decoding.
 * Dimensions can trigger loading. releaseTexture releases GPU data while the
 * view remains reusable. Manager invalidation and shutdown invalidate views.
 * @zh 文件纹理延迟加载；isValid 表示存在视图，不表示解码成功。读取尺寸可能触发加载。
 * releaseTexture 释放 GPU 数据后视图仍可复用。管理器失效和关闭运行时使视图失效。
 * @ja ファイルは遅延読込です。isValid はビューの存在を示し、読込成功ではありません。
 * 寸法取得で読み込む場合があります。GPU 解放後も再利用でき、管理器の無効化で失効します。
 * @ko 파일은 지연 로딩됩니다. isValid는 뷰 존재를 나타내며 디코딩 성공이 아닙니다.
 * 크기 조회가 로딩을 유발할 수 있습니다. GPU 해제 후 재사용되며 관리자 종료 시 무효화됩니다.
 */
export class Texture {
  /**
   * Construct the native default empty texture view.
   *
   * @zh 构造原生默认空纹理视图。
   * @ja ネイティブ既定の空テクスチャビューを構築します。
   * @ko 네이티브 기본 빈 텍스처 뷰를 생성합니다.
   */
  constructor() {
    textures.set(this, native.createTexture());
  }

  /**
   * Rml::Texture::operator bool.
   *
   * @zh 原生纹理视图的布尔转换。
   * @ja ネイティブテクスチャビューの真偽変換。
   * @ko Rml::Texture::operator bool입니다.
   * @returns Whether the view refers to a texture database entry.
   * @zh 视图是否引用纹理数据库条目。
   * @ja テクスチャデータベースの項目を参照するか。
   * @ko 텍스처 데이터베이스 항목을 참조하는지 여부입니다.
   */
  get isValid(): boolean {
    return native.textureIsValid(textureHandle(this));
  }

  /**
   * Invoke Rml::Texture::GetDimensions, loading file data when needed.
   *
   * @zh 调用 Rml::Texture::GetDimensions，必要时加载文件数据。
   * @ja Rml::Texture::GetDimensions を呼び、必要に応じてファイルを読み込みます。
   * @ko Rml::Texture::GetDimensions를 호출하며 필요 시 파일을 로딩합니다.
   * @returns Pixel dimensions; zero for empty or failed textures.
   * @zh 像素尺寸；空纹理或加载失败时为零。
   * @ja ピクセル寸法。空または失敗した場合はゼロ。
   * @ko 픽셀 크기이며 비어 있거나 로딩 실패 시 0입니다.
   */
  getDimensions(): VariantVector2 {
    return native.textureGetDimensions(textureHandle(this));
  }

  /**
   * Compare native texture database identity.
   *
   * @zh 比较原生纹理数据库身份。
   * @ja ネイティブテクスチャデータベースの同一性を比較します。
   * @ko 네이티브 텍스처 데이터베이스 동일성을 비교합니다.
   * @param other - Texture view to compare.
   * @zh other - 待比较纹理视图。
   * @ja other - 比較するテクスチャビュー。
   * @ko other - 비교할 텍스처 뷰입니다.
   * @returns Rml::Texture::operator== result.
   * @zh Rml::Texture::operator== 结果。
   * @ja Rml::Texture::operator== の結果。
   * @ko Rml::Texture::operator== 결과입니다.
   */
  equals(other: Texture): boolean {
    return native.textureEquals(textureHandle(this), textureHandle(other));
  }
}

/**
 * Resolve a texture view token.
 *
 * @internal
 * @param value - Public view.
 * @returns Native handle.
 */
export function textureHandle(value: Texture): object {
  const handle = textures.get(value);
  if (!handle) {
    throw new TypeError('Expected a texture view');
  }
  return handle;
}

/**
 * Wrap a native texture view with manager retention.
 *
 * @internal
 * @param handle - Native handle.
 * @returns Public view.
 */
export function textureFromNative(handle: object): Texture {
  const result = Object.create(Texture.prototype) as Texture;
  textures.set(result, handle);
  return result;
}
