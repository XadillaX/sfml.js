import { native } from '../internal/native';
import { renderManagerHandle, type RenderManager } from './render-manager';
import { textureFromNative, type Texture } from './texture';

const sources = new WeakMap<TextureSource, object>();

/**
 * Resolve an owned native source.
 *
 * @internal
 * @param source - Public source.
 * @returns Native handle.
 */
function sourceHandle(source: TextureSource): object {
  const handle = sources.get(source);
  if (!handle) {
    throw new TypeError('Expected a TextureSource');
  }
  return handle;
}

/**
 * Native Rml::TextureSource with per-manager lazy texture caching.
 *
 * @zh 原生 Rml::TextureSource，按管理器延迟缓存纹理。
 * @ja 管理器ごとに遅延キャッシュするネイティブ Rml::TextureSource。
 * @ko 관리자별 지연 캐시를 가진 네이티브 Rml::TextureSource입니다.
 * @remarks
 * Retains native managers while cached. Releasing unused managers clears the
 * cache and permits reuse with live managers. Shutdown invalidates the source.
 * @zh 缓存期间保活原生管理器。释放未使用管理器会清空缓存，之后可通过有效管理器复用。
 * 关闭运行时使纹理源失效。
 * @ja キャッシュ中は管理器を保持します。未使用管理器の解放でキャッシュを消去し、
 * 有効な管理器で再利用できます。終了時に無効化します。
 * @ko 캐시 동안 관리자를 유지합니다. 미사용 관리자 해제 시 캐시를 비우며 유효한
 * 관리자로 재사용할 수 있습니다. 런타임 종료 시 무효화됩니다.
 */
export class TextureSource {
  /**
   * Construct a native texture source, defaulting to empty paths.
   *
   * @zh 构造原生纹理源，路径默认为空。
   * @ja パスが既定で空のネイティブテクスチャソースを構築します。
   * @ko 기본 경로가 빈 네이티브 텍스처 소스를 생성합니다.
   * @param source - Filename or resource name.
   * @zh source - 文件名或资源名。
   * @ja source - ファイル名またはリソース名。
   * @ko source - 파일 또는 리소스 이름입니다.
   * @param documentPath - Path of the declaring document.
   * @zh documentPath - 声明文档的路径。
   * @ja documentPath - 宣言元ドキュメントのパス。
   * @ko documentPath - 선언 문서의 경로입니다.
   */
  constructor(source = '', documentPath = '') {
    sources.set(this, native.createTextureSource(source, documentPath));
  }

  /**
   * Invoke Rml::TextureSource::GetTexture.
   *
   * @zh 调用 Rml::TextureSource::GetTexture。
   * @ja Rml::TextureSource::GetTexture を呼びます。
   * @ko Rml::TextureSource::GetTexture를 호출합니다.
   * @param manager - Live render manager.
   * @zh manager - 有效的渲染管理器。
   * @ja manager - 有効な描画管理器。
   * @ko manager - 유효한 렌더 관리자입니다.
   * @returns Cached native texture view; image data loads lazily.
   * @zh 缓存的原生纹理视图；图像数据延迟加载。
   * @ja キャッシュしたネイティブビュー。画像は遅延読込です。
   * @ko 캐시된 네이티브 뷰이며 이미지 데이터는 지연 로딩됩니다.
   */
  getTexture(manager: RenderManager): Texture {
    return textureFromNative(native.textureSourceGetTexture(
      sourceHandle(this), renderManagerHandle(manager)));
  }

  /**
   * Get the original texture source string.
   *
   * @zh 获取原始纹理来源字符串。
   * @ja 元のテクスチャ参照文字列を取得します。
   * @ko 원래 텍스처 소스 문자열을 가져옵니다.
   * @returns Original source string.
   * @zh 原始资源字符串。
   * @ja 元のソース文字列。
   * @ko 원본 소스 문자열입니다.
   */
  getSource(): string {
    return native.textureSourceGetSource(sourceHandle(this));
  }

  /**
   * Get the path of the document that declared this texture source.
   *
   * @zh 获取声明此纹理来源的文档路径。
   * @ja このテクスチャ参照を宣言した文書のパスを取得します。
   * @ko 이 텍스처 소스를 선언한 문서 경로를 가져옵니다.
   * @returns Original declaring document path.
   * @zh 原始声明文档路径。
   * @ja 元の宣言ドキュメントパス。
   * @ko 원본 선언 문서 경로입니다.
   */
  getDefinitionSource(): string {
    return native.textureSourceGetDefinitionSource(sourceHandle(this));
  }
}

/**
 * Wrap a copied native source without retaining a borrowed spritesheet.
 *
 * @internal
 * @param handle - Native source.
 * @returns Public source.
 */
export function textureSourceFromNative(handle: object): TextureSource {
  const result = Object.create(TextureSource.prototype) as TextureSource;
  sources.set(result, handle);
  return result;
}
