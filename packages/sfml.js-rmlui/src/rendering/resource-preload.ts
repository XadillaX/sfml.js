import { native } from '../internal/native';
import { FontStyle, FontWeight } from '../fonts/fonts';
import type { RenderInterface } from './resources';

/**
 * A file font registered under an explicit family through Rml::LoadFontFace.
 *
 * @zh 通过 Rml::LoadFontFace 以显式字体族注册的文件字体。
 * @ja Rml::LoadFontFace で明示的なファミリーに登録するファイルフォント。
 * @ko Rml::LoadFontFace로 명시적 패밀리에 등록하는 파일 글꼴입니다.
 */
export interface PreloadFont {
  /**
   * File path resolved by the runtime root policy.
   *
   * @zh 按运行时根目录规则解析的文件路径。
   * @ja ランタイムのルート規則で解決するファイルパス。
   * @ko 런타임 루트 규칙으로 해석하는 파일 경로입니다.
   */
  source: string;

  /**
   * Family name used in RCSS.
   *
   * @zh RCSS 中使用的字体族名称。
   * @ja RCSS で使用するファミリー名。
   * @ko RCSS에서 사용할 패밀리 이름입니다.
   */
  family: string;

  /**
   * Face style; defaults to Normal.
   *
   * @zh 字体样式，默认 Normal。
   * @ja 書体。既定値は Normal。
   * @ko 서체이며 기본값은 Normal입니다.
   */
  style?: FontStyle;

  /**
   * Auto (0) or integer 1–1000; defaults to Auto.
   *
   * @zh Auto（0）或 1–1000 的整数，默认 Auto。
   * @ja Auto（0）または 1〜1000 の整数。既定値は Auto。
   * @ko Auto(0) 또는 1~1000의 정수이며 기본값은 Auto입니다.
   */
  weight?: number;

  /**
   * Register as a fallback face; defaults to false.
   *
   * @zh 注册为后备字体，默认 false。
   * @ja フォールバックとして登録します。既定値は false。
   * @ko 대체 글꼴로 등록하며 기본값은 false입니다.
   */
  fallback?: boolean;

  /**
   * Nonnegative int32 collection face index; defaults to 0.
   *
   * @zh 非负 int32 字体集合索引，默认 0。
   * @ja 非負の int32 コレクションインデックス。既定値は 0。
   * @ko 음수가 아닌 int32 컬렉션 인덱스이며 기본값은 0입니다.
   */
  faceIndex?: number;
}

/**
 * Resources to prepare before loading and showing a document.
 *
 * @zh 加载并显示文档前准备的资源。
 * @ja 文書の読み込みと表示の前に準備するリソース。
 * @ko 문서를 로드하고 표시하기 전에 준비할 리소스입니다.
 */
export interface PreloadResources {
  /**
   * Resolved texture source strings matching document or stylesheet sources.
   *
   * @zh 与文档或样式表中的已解析纹理路径一致的字符串。
   * @ja 文書またはスタイルシートの解決済みテクスチャパスと一致する文字列。
   * @ko 문서 또는 스타일시트의 해석된 텍스처 경로와 일치하는 문자열입니다.
   */
  textures?: readonly string[];

  /**
   * Explicit font registrations; identical descriptors are deduplicated.
   *
   * @zh 显式字体注册项，相同描述项自动去重。
   * @ja 明示的なフォント登録。同一記述は重複排除されます。
   * @ko 명시적 글꼴 등록이며 동일한 설명은 중복 제거됩니다.
   */
  fonts?: readonly PreloadFont[];
}

/**
 * Cancellation and renderer selection for one preload batch.
 *
 * @zh 单批预加载的取消信号及渲染接口选择。
 * @ja プリロードのキャンセルと描画インターフェースの選択。
 * @ko 프리로드 배치의 취소 신호 및 렌더 인터페이스 선택입니다.
 */
export interface ResourcePreloadOptions {
  /**
   * Reject with AbortError and prevent further commits for this batch.
   *
   * @zh 以 AbortError 拒绝并阻止该批次继续提交。
   * @ja AbortError で拒否し、このバッチの追加コミットを禁止します。
   * @ko AbortError로 거부하고 이 배치의 추가 커밋을 방지합니다.
   */
  signal?: AbortSignal;

  /**
   * Texture cache owner; defaults to the runtime's default renderer.
   *
   * @zh 纹理缓存的拥有者，默认运行时的默认渲染接口。
   * @ja テクスチャキャッシュの所有者。既定はランタイムの描画インターフェース。
   * @ko 텍스처 캐시 소유자이며 기본값은 런타임의 기본 렌더러입니다.
   */
  renderInterface?: RenderInterface;
}

/**
 * Prepare resources with Native workers and the selected file provider, then
 * commit texture uploads and font registration on the owning runtime thread.
 *
 * @zh 通过 Native 工作线程和所选文件源准备资源，再由所属线程上传纹理并注册字体。
 * @ja Native ワーカーと選択したファイル API でリソースを準備し、
 * 所有スレッドでテクスチャをアップロードしフォントを登録します。
 * @ko Native 워커와 선택한 파일 API로 리소스를 준비한 뒤
 * 소유 스레드에서 텍스처를 업로드하고 글꼴을 등록합니다.
 * @param resources - Texture paths and explicit font descriptors.
 * @zh resources - 纹理路径与显式字体描述。
 * @ja resources - テクスチャパスと明示的なフォント記述。
 * @ko resources - 텍스처 경로 및 명시적 글꼴 설명입니다.
 * @param options - Optional cancellation and texture renderer.
 * @zh options - 可选取消信号与纹理渲染接口。
 * @ja options - 任意のキャンセル信号とテクスチャ描画インターフェース。
 * @ko options - 선택적 취소 신호 및 텍스처 렌더러입니다.
 * @returns A promise resolved after every requested resource is committed.
 * @zh 全部请求资源提交后兑现的 Promise。
 * @ja 全要求リソースのコミット後に解決する Promise。
 * @ko 모든 요청 리소스를 커밋한 뒤 해결되는 Promise입니다.
 * @throws Error for invalid arguments or unavailable runtime/renderer.
 * @zh 参数无效或运行时、渲染接口不可用时抛出 Error。
 * @ja 引数が無効、ランタイムや描画インターフェースが使用不能なら Error。
 * @ko 인수가 잘못되거나 런타임 또는 렌더러를 사용할 수 없으면 Error입니다.
 * @remarks
 * Custom FileInterface callbacks supply byte snapshots on the owning thread;
 * Native image decoding still runs on workers. Filesystem providers perform
 * reads and decoding on workers.
 * Initialise first. Concurrent identical resources share preparation and
 * commit. Failure rejects; resources committed earlier remain available.
 * Abort, matching resource release and shutdown prevent pending commits.
 * Font bytes remain Native-owned until shutdown. Font atlases are generated
 * during text layout; update/render before showing the window to warm them.
 * @zh 自定义 FileInterface 在所属线程提供字节快照；原生图片解码仍在
 * 线程池执行。文件系统接口的读取与解码都在线程池执行。
 * 先初始化。并发的相同资源共享准备与提交；失败时拒绝，已提交资源保留。
 * 取消、对应资源释放及 shutdown 会阻止待提交结果。字体字节由 Native 持有至
 * shutdown。字形图集在文字布局时生成，显示窗口前 update/render 可预热图集。
 * @ja カスタム FileInterface は所有スレッドでバイトを渡し、Native の
 * 画像デコードはワーカーで行います。ファイルシステムの読み込みもワーカーです。
 * 先に初期化してください。同一リソースは準備とコミットを共有します。
 * 失敗前のコミットは保持されます。中止、対応リソースの解放、shutdown は
 * 未完了コミットを禁止します。フォントデータは shutdown まで Native が保持。
 * アトラスはレイアウト時に生成されるため、表示前に update/render で準備します。
 * @ko 사용자 FileInterface는 소유 스레드에서 바이트를 제공하며 Native 이미지
 * 디코딩은 워커에서 수행합니다. 파일시스템 읽기도 워커에서 수행합니다.
 * 먼저 초기화하세요. 동일한 리소스는 준비와 커밋을 공유합니다. 실패 전에
 * 커밋한 리소스는 유지됩니다. 취소, 해당 리소스 해제, shutdown은 대기 중인
 * 커밋을 방지합니다. 글꼴 바이트는 shutdown까지 Native가 소유합니다.
 * 글리프 아틀라스는 레이아웃 시 생성되므로 표시 전에 update/render로 준비하세요.
 */
export function preloadResources(
  resources: PreloadResources, options: ResourcePreloadOptions = {},
): Promise<void> {
  if (options.signal?.aborted) {
    const error = new Error('Resource preload aborted');
    error.name = 'AbortError';
    return Promise.reject(error);
  }
  const fonts = (resources.fonts ?? []).map(font => [
    font.source, font.family, font.style ?? FontStyle.Normal,
    font.weight ?? FontWeight.Auto, font.fallback ?? false, font.faceIndex ?? 0,
  ] as const);
  const request = native.preloadResources(
    resources.textures ?? [], fonts, options.renderInterface);
  const signal = options.signal;
  if (!signal) {
    return request.promise;
  }
  const cancel = () => native.cancelResourcePreload(request.id);
  signal.addEventListener('abort', cancel, { once: true });
  return request.promise.finally(() =>
    signal.removeEventListener('abort', cancel));
}
