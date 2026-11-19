import { native } from '../internal/native';

/**
 * Rml::Style::FontStyle values for explicit font registration.
 *
 * @zh 显式注册字体时使用的 Rml::Style::FontStyle 值。
 * @ja フォント登録に使う Rml::Style::FontStyle の値。
 * @ko 명시적 글꼴 등록에 사용하는 Rml::Style::FontStyle 값입니다.
 */
export enum FontStyle {
  /**
   * Normal face.
   *
   * @zh 常规字体。
   * @ja 通常の書体。
   * @ko 일반 서체입니다.
   */
  Normal = 0,
  /**
   * Italic face.
   *
   * @zh 斜体。
   * @ja イタリック体。
   * @ko 이탤릭 서체입니다.
   */
  Italic = 1,
}

/**
 * Named Rml::Style::FontWeight values; any integer from 1 to 1000 is valid.
 *
 * @zh Rml::Style::FontWeight 命名值；也接受 1 到 1000 的任意整数字重。
 * @ja Rml::Style::FontWeight の名前付き値。1〜1000 の整数も使用できます。
 * @ko Rml::Style::FontWeight의 명명 값이며 1~1000의 정수도 유효합니다.
 */
export enum FontWeight {
  /**
   * Detect the weight; load all available weights in a variable font.
   *
   * @zh 自动识别字重；加载可变字体中所有可用字重。
   * @ja ウェイトを自動検出し、可変フォントでは利用可能な全ウェイトを読み込みます。
   * @ko 굵기를 자동 감지하고 가변 글꼴의 모든 사용 가능한 굵기를 로드합니다.
   */
  Auto = 0,
  /**
   * Normal weight, 400.
   *
   * @zh 常规字重 400。
   * @ja 通常のウェイト 400。
   * @ko 일반 굵기 400입니다.
   */
  Normal = 400,
  /**
   * Bold weight, 700.
   *
   * @zh 粗体字重 700。
   * @ja 太字のウェイト 700。
   * @ko 굵은 글꼴 700입니다.
   */
  Bold = 700,
}

/**
 * Load Rml::LoadFontFace from a file using its internal family and style.
 *
 * @zh 从文件调用 Rml::LoadFontFace，使用字体内部的字体族和样式。
 * @ja ファイルから Rml::LoadFontFace を呼び、内部のファミリーと書体を使います。
 * @ko 파일에서 Rml::LoadFontFace를 호출하여 내부 패밀리와 스타일을 사용합니다.
 * @param filePath - Path resolved through the active file interface.
 * @zh filePath - 由当前文件接口解析的路径。
 * @ja filePath - 現在のファイルインターフェースで解決するパス。
 * @ko filePath - 활성 파일 인터페이스로 해석할 경로입니다.
 * @param fallback - Use for missing glyphs in other faces; defaults to false.
 * @zh fallback - 用于补齐其他字体缺失的字形，默认 false。
 * @ja fallback - 他の書体にない字形を補います。既定値は false。
 * @ko fallback - 다른 서체에 없는 글리프를 보완하며 기본값은 false입니다.
 * @param weight - Auto (0), or integer 1–1000; defaults to Auto.
 * @zh weight - Auto（0）或 1–1000 的整数，默认 Auto。
 * @ja weight - Auto（0）または 1〜1000 の整数。既定値は Auto。
 * @ko weight - Auto(0) 또는 1~1000의 정수이며 기본값은 Auto입니다.
 * @param faceIndex - Nonnegative int32 collection index; defaults to 0.
 * @zh faceIndex - 非负 int32 字体集合索引，默认 0。
 * @ja faceIndex - 非負の int32 コレクションインデックス。既定値は 0。
 * @ko faceIndex - 음수가 아닌 int32 컬렉션 인덱스이며 기본값은 0입니다.
 * @returns Native success flag; false for missing/invalid fonts or faces.
 * @zh 原生成功标记；字体或字形面不存在、无效时返回 false。
 * @ja ネイティブの成否。フォントやフェイスが存在しないか無効なら false。
 * @ko 네이티브 성공 여부이며 글꼴이나 페이스가 없거나 잘못되면 false입니다.
 * @remarks
 * Synchronous. Initialise first and load fonts before documents. Use the
 * internal family name in RCSS. Runtime font operations reject event callbacks.
 * @zh 同步操作。先初始化，再在文档加载前加载字体。RCSS 使用内部字体族名称。
 * 运行时字体操作不允许在事件回调内调用。
 * @ja 同期処理です。初期化後、文書より先に読み込み、RCSS に内部ファミリー名を
 * 指定します。イベントコールバック内のフォント操作は拒否されます。
 * @ko 동기 작업입니다. 초기화 후 문서보다 먼저 로드하고 RCSS에 내부 패밀리
 * 이름을 사용하세요. 이벤트 콜백 내 글꼴 작업은 거부됩니다.
 */
export function loadFontFace(
  filePath: string, fallback?: boolean, weight?: number, faceIndex?: number,
): boolean;

/**
 * Load a file or byte view with explicit family, style and optional weight.
 *
 * @zh 以显式字体族、样式及可选字重加载文件或字节视图。
 * @ja ファミリー、書体、任意のウェイトを指定してファイルやバイト列を読み込みます。
 * @ko 패밀리, 스타일, 선택적 굵기를 지정하여 파일이나 바이트 뷰를 로드합니다.
 * @param source - File path, Buffer or non-shared, non-detached Uint8Array.
 * @zh source - 文件路径、Buffer 或未共享且未分离的 Uint8Array。
 * @ja source - パス、Buffer、または共有・切り離しされていない Uint8Array。
 * @ko source - 파일 경로, Buffer 또는 공유되거나 분리되지 않은 Uint8Array입니다.
 * @param family - Family name to register for RCSS; empty uses font metadata.
 * @zh family - 注册供 RCSS 使用的字体族名称；空字符串使用字体元数据。
 * @ja family - RCSS 用に登録する名前。空文字列はフォントのメタデータを使います。
 * @ko family - RCSS에 등록할 패밀리 이름이며 빈 문자열은 글꼴 메타데이터를 사용합니다.
 * @param style - Normal or Italic.
 * @zh style - Normal 或 Italic。
 * @ja style - Normal または Italic。
 * @ko style - Normal 또는 Italic입니다.
 * @param weight - Auto (0), or integer 1–1000; defaults to Auto.
 * @zh weight - Auto（0）或 1–1000 的整数，默认 Auto。
 * @ja weight - Auto（0）または 1〜1000 の整数。既定値は Auto。
 * @ko weight - Auto(0) 또는 1~1000의 정수이며 기본값은 Auto입니다.
 * @param fallback - Register as a fallback face; defaults to false.
 * @zh fallback - 是否注册为后备字体，默认 false。
 * @ja fallback - 代替フォントとして登録します。既定値は false。
 * @ko fallback - 대체 글꼴로 등록하며 기본값은 false입니다.
 * @param faceIndex - Nonnegative int32 collection index; defaults to 0.
 * @zh faceIndex - 非负 int32 字体集合索引，默认 0。
 * @ja faceIndex - 非負の int32 コレクションインデックス。既定値は 0。
 * @ko faceIndex - 음수가 아닌 int32 컬렉션 인덱스이며 기본값은 0입니다.
 * @returns Native success flag, including false on invalid data/index.
 * @zh 原生成功标记，数据或索引无效时返回 false。
 * @ja ネイティブの成否。データやインデックスが無効なら false。
 * @ko 네이티브 성공 여부이며 데이터나 인덱스가 잘못되면 false입니다.
 * @remarks
 * Synchronous Rml::LoadFontFace. The native runtime copies the exact view and
 * keeps it until shutdown, even after a failed load (collections may partially
 * register faces). Callers may modify, transfer or collect their input after
 * return. releaseFontResources preserves these bytes. Initialise first; font
 * operations reject event callbacks. Empty family also restores metadata style.
 * @zh 同步调用 Rml::LoadFontFace。原生运行时复制视图范围内的字节并持有至关闭；
 * 加载失败时也保留，因为字体集合可能已部分注册。返回后调用方可以修改、转移或
 * 回收输入。releaseFontResources 保留这些字节。必须先初始化，不能在事件回调中
 * 调用字体操作。空字体族还会恢复元数据中的样式。
 * @ja 同期処理です。ビューの範囲をコピーして終了まで保持します。コレクションの
 * 一部が登録済みの場合があるため、失敗時も保持します。復帰後は入力を変更・転送・
 * 回収できます。releaseFontResources はこのデータを保持します。初期化が必要で、
 * イベントコールバック内は不可です。空の名前では書体もメタデータに従います。
 * @ko 동기 작업입니다. 뷰 범위를 복사해 종료까지 보유합니다. 컬렉션의 일부가 등록될
 * 수 있어 실패 후에도 보유합니다. 반환 후 입력을 변경, 전송, 회수할 수 있습니다.
 * releaseFontResources는 이 바이트를 유지합니다. 초기화가 필요하며 이벤트 콜백
 * 내 호출은 거부됩니다. 빈 패밀리는 스타일도 메타데이터에서 가져옵니다.
 */
export function loadFontFace(
  source: string | Uint8Array, family: string, style: FontStyle,
  weight?: number, fallback?: boolean, faceIndex?: number,
): boolean;

/**
 * Forward the checked overload to the native font engine.
 *
 * @zh 将经过检查的重载转发给原生字体引擎。
 * @ja 検証済みのオーバーロードをネイティブフォントエンジンに渡します。
 * @ko 검증된 오버로드를 네이티브 글꼴 엔진에 전달합니다.
 * @param source - File path or font bytes.
 * @zh source - 文件路径或字体字节。
 * @ja source - ファイルパスまたはフォントのバイト列。
 * @ko source - 파일 경로 또는 글꼴 바이트입니다.
 * @param familyOrFallback - Explicit family or file fallback flag.
 * @zh familyOrFallback - 显式字体族或文件后备字体标记。
 * @ja familyOrFallback - 明示ファミリー名またはファイルの代替フラグ。
 * @ko familyOrFallback - 명시적 패밀리 또는 파일 대체 글꼴 플래그입니다.
 * @param styleOrWeight - Named face style or file weight.
 * @zh styleOrWeight - 命名字体样式或文件字重。
 * @ja styleOrWeight - 名前付きフェイスの書体またはファイルのウェイト。
 * @ko styleOrWeight - 이름 있는 페이스의 스타일 또는 파일의 굵기입니다.
 * @param weightOrIndex - Named face weight or file collection index.
 * @zh weightOrIndex - 命名字体字重或文件字体集合索引。
 * @ja weightOrIndex - 名前付きフェイスのウェイトまたはコレクション番号。
 * @ko weightOrIndex - 이름 있는 페이스의 굵기 또는 파일 컬렉션 인덱스입니다.
 * @param fallback - Named face fallback flag.
 * @zh fallback - 命名字体的后备字体标记。
 * @ja fallback - 名前付きフェイスの代替フラグ。
 * @ko fallback - 이름 있는 페이스의 대체 글꼴 플래그입니다.
 * @param faceIndex - Named face collection index.
 * @zh faceIndex - 命名字体的字体集合索引。
 * @ja faceIndex - 名前付きフェイスのコレクション番号。
 * @ko faceIndex - 이름 있는 페이스의 컬렉션 인덱스입니다.
 * @returns Native loading result.
 * @zh 原生字体加载结果。
 * @ja ネイティブの読み込み結果。
 * @ko 네이티브 로드 결과입니다.
 */
export function loadFontFace(
  source: string | Uint8Array, familyOrFallback?: string | boolean,
  styleOrWeight?: number, weightOrIndex?: number,
  fallback?: boolean, faceIndex?: number,
): boolean {
  return native.loadFontFace(
    source, familyOrFallback, styleOrWeight, weightOrIndex, fallback, faceIndex,
  );
}

/**
 * Release font textures/glyph caches and rebuild active fonts.
 *
 * @zh 释放字体纹理和字形缓存，并重建活动字体。
 * @ja フォントテクスチャと字形キャッシュを解放し、使用中のフォントを再構築します。
 * @ko 글꼴 텍스처와 글리프 캐시를 해제하고 활성 글꼴을 다시 구성합니다.
 * @remarks
 * Rml::ReleaseFontResources invalidates font handles and updates all contexts.
 * Registered faces and owned source bytes remain available until shutdown.
 * Requires an initialised runtime; calls during event callbacks are rejected.
 * Reattach or collect detached elements first: upstream cannot invalidate
 * font handles in detached trees. Rejected calls preserve existing tokens.
 * @zh Rml::ReleaseFontResources 使字体句柄失效并更新所有上下文。
 * 已注册字体及持有的源字节保留至关闭。需要已初始化的运行时，禁止在事件回调中调用。
 * 必须先重新挂载或回收脱离树的元素；上游无法更新其字体句柄。
 * 被拒绝的调用不会使现有令牌失效。
 * @ja Rml::ReleaseFontResources はハンドルを無効にし、全コンテキストを更新します。
 * 登録済みフォントと元データは終了まで保持します。初期化が必要で、イベント内は不可です。
 * 切り離し要素のハンドルは更新できないため、先に再接続または回収してください。
 * 拒否された呼び出しは既存トークンを無効にしません。
 * @ko Rml::ReleaseFontResources는 핸들을 무효화하고 모든 컨텍스트를 갱신합니다.
 * 등록된 글꼴과 원본 바이트는 종료까지 유지됩니다. 초기화가 필요하며 이벤트 콜백 내 호출은 거부됩니다.
 * 분리된 트리의 핸들을 갱신할 수 없으므로 먼저 다시 연결하거나 회수하세요.
 * 거부된 호출은 기존 토큰을 무효화하지 않습니다.
 */
export function releaseFontResources(): void {
  native.releaseFontResources();
}
