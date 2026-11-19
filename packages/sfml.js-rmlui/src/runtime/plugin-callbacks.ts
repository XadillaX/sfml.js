import type { Context } from './context';
import type { Document } from '../dom/documents/document';
import type { Element } from '../dom/elements/element';

/**
 * Rml::Plugin::GetEventClasses contract.
 *
 * @zh Rml::Plugin::GetEventClasses 回调契约。
 * @ja Rml::Plugin::GetEventClasses の契約。
 * @ko Rml::Plugin::GetEventClasses 콜백 계약입니다.
 */
export interface PluginEventClassesCallback {
  /**
   * Select a fixed subscription mask for this registration.
   *
   * @zh 选择本次注册的固定订阅掩码。
   * @ja 今回の登録の固定購読マスクを選びます。
   * @ko 이번 등록의 고정 구독 마스크를 선택합니다.
   * @returns Integer bit mask 0..15; omitted callback defaults to All.
   * @zh 0..15 整数位掩码；省略回调时默认为 All。
   * @ja 0..15 の整数マスク。省略時は All。
   * @ko 0..15 정수 비트 마스크이며 콜백 생략 시 All입니다.
   */
  (): number;
}

/**
 * Rml::Plugin runtime lifecycle notification.
 *
 * @zh Rml::Plugin 运行时生命周期通知。
 * @ja Rml::Plugin ランタイムのライフサイクル通知。
 * @ko Rml::Plugin 런타임 생명 주기 알림입니다.
 */
export interface PluginLifecycleCallback {
  /**
   * Observe initialization or shutdown synchronously.
   *
   * @zh 同步观察初始化或关闭。
   * @ja 初期化または終了を同期的に観測します。
   * @ko 초기화 또는 종료를 동기적으로 관찰합니다.
   * @returns Undefined; Promise and other return values are rejected.
   * @zh undefined；拒绝 Promise 和其他返回值。
   * @ja undefined。Promise や他の値は拒否します。
   * @ko undefined이며 Promise와 다른 반환값은 거부됩니다.
   */
  (): void;
}

/**
 * Rml::Plugin context creation or destruction notification.
 *
 * @zh Rml::Plugin 上下文创建或销毁通知。
 * @ja Rml::Plugin コンテキスト生成または破棄の通知。
 * @ko Rml::Plugin 컨텍스트 생성 또는 파괴 알림입니다.
 */
export interface PluginContextCallback {
  /**
   * Read the live context during its Native notification.
   *
   * @zh 在原生通知期间读取实时上下文。
   * @ja ネイティブ通知中に実体コンテキストを読み取ります。
   * @ko 네이티브 알림 중 실제 컨텍스트를 읽습니다.
   * @param context - Borrowed context; Native calls expire on return.
   * @zh context - 借用上下文；返回后原生调用失效。
   * @ja context - 借用コンテキスト。戻るとネイティブ呼び出しは無効。
   * @ko context - 빌린 컨텍스트이며 반환 후 네이티브 호출은 무효입니다.
   * @returns Undefined, synchronously.
   * @zh 同步返回 undefined。
   * @ja 同期的に undefined。
   * @ko 동기적으로 undefined를 반환합니다.
   */
  (context: Context): void;
}

/**
 * Rml::Plugin::OnDocumentOpen request notification.
 *
 * @zh Rml::Plugin::OnDocumentOpen 请求通知。
 * @ja Rml::Plugin::OnDocumentOpen のリクエスト通知。
 * @ko Rml::Plugin::OnDocumentOpen 요청 알림입니다.
 */
export interface PluginDocumentOpenCallback {
  /**
   * Observe the exact source path at Native stream load entry.
   *
   * @zh 在原生进入流加载时观察确切来源路径。
   * @ja ネイティブのストリーム読み込み開始時に正確なパスを観測します。
   * @ko 네이티브 스트림 로드 시작 시 정확한 소스 경로를 관찰합니다.
   * @remarks
   * In RmlUi 6.3 the file-path overload opens its StreamFile before this
   * notification; failed opening emits no notification. Memory/stream loads
   * notify before document parsing. This preserves the actual Core order.
   * @zh RmlUi 6.3 的文件路径重载先打开 StreamFile，再发送本通知；
   * 打开失败不通知。内存和流加载在解析文档前通知，保留实际 Core 顺序。
   * @ja RmlUi 6.3 のパス指定は StreamFile を先に開き、失敗時は通知しません。
   * メモリ・ストリーム指定は文書解析の前に通知し、Core の実際の順序を保ちます。
   * @ko RmlUi 6.3 경로 오버로드는 StreamFile을 먼저 열며 실패 시 알리지 않습니다.
   * 메모리 및 스트림 로드는 문서 파싱 전에 알리고 실제 Core 순서를 유지합니다.
   * @param context - Live context borrowed until return.
   * @zh context - 返回前借用的实时上下文。
   * @ja context - 戻るまで借用する実体コンテキスト。
   * @ko context - 반환 전까지 빌린 실제 컨텍스트입니다.
   * @param documentPath - Owned JS string of the requested path.
   * @zh documentPath - 请求路径的自有 JS 字符串。
   * @ja documentPath - 要求されたパスを所有する JS 文字列。
   * @ko documentPath - 요청 경로를 소유하는 JS 문자열입니다.
   * @returns Undefined, synchronously.
   * @zh 同步返回 undefined。
   * @ja 同期的に undefined。
   * @ko 동기적으로 undefined를 반환합니다.
   */
  (context: Context, documentPath: string): void;
}

/**
 * Rml::Plugin document load or unload notification.
 *
 * @zh Rml::Plugin 文档加载或卸载通知。
 * @ja Rml::Plugin 文書読み込みまたは解放の通知。
 * @ko Rml::Plugin 문서 로드 또는 해제 알림입니다.
 */
export interface PluginDocumentCallback {
  /**
   * Read the actual document while the Native document object is live.
   *
   * @zh 在原生文档对象存活期间读取实际文档。
   * @ja ネイティブ文書の実体が存続する間に読み取ります。
   * @ko 네이티브 문서 객체가 살아 있는 동안 실제 문서를 읽습니다.
   * @param document - Borrowed document; expires on return.
   * @zh document - 借用文档；返回后失效。
   * @ja document - 借用文書。戻ると無効になります。
   * @ko document - 빌린 문서이며 반환 후 무효화됩니다.
   * @returns Undefined, synchronously.
   * @zh 同步返回 undefined。
   * @ja 同期的に undefined。
   * @ko 동기적으로 undefined를 반환합니다.
   */
  (document: Document): void;
}

/**
 * Rml::Plugin element creation or destruction notification.
 *
 * @zh Rml::Plugin 元素创建或销毁通知。
 * @ja Rml::Plugin 要素生成または破棄の通知。
 * @ko Rml::Plugin 요소 생성 또는 파괴 알림입니다.
 */
export interface PluginElementCallback {
  /**
   * Read live base Element fields, including during its base destructor.
   *
   * @zh 读取实时 Element 基类字段，包括基类析构期间。
   * @ja 基底クラスの破棄中も、実体 Element の基底フィールドを読み取ります。
   * @ko 기본 소멸 중에도 실제 Element 기본 필드를 읽습니다.
   * @param element - Borrowed element; expires on return.
   * @zh element - 借用元素；返回后失效。
   * @ja element - 借用要素。戻ると無効になります。
   * @ko element - 빌린 요소이며 반환 후 무효화됩니다.
   * @returns Undefined, synchronously.
   * @zh 同步返回 undefined。
   * @ja 同期的に undefined。
   * @ko 동기적으로 undefined를 반환합니다.
   */
  (element: Element): void;
}

/**
 * Rml::Plugin data model creation or pre-destruction notification.
 *
 * @zh Rml::Plugin 数据模型创建或销毁前通知。
 * @ja Rml::Plugin データモデル生成または破棄前の通知。
 * @ko Rml::Plugin 데이터 모델 생성 또는 파괴 전 알림입니다.
 */
export interface PluginDataModelCallback {
  /**
   * Find the model on its live context before removal invalidates the model.
   *
   * @zh 在移除导致模型失效前，从实时上下文查询模型。
   * @ja 削除で無効になる前に、実体コンテキストでモデルを検索します。
   * @ko 제거로 모델이 무효화되기 전에 실제 컨텍스트에서 모델을 조회합니다.
   * @param context - Context borrowed until this callback returns.
   * @zh context - 在本回调返回前借用的上下文。
   * @ja context - このコールバックから戻るまで借用するコンテキスト。
   * @ko context - 이 콜백 반환 전까지 빌린 컨텍스트입니다.
   * @param name - Owned JS model name; safe to retain.
   * @zh name - 自有 JS 模型名，可安全保留。
   * @ja name - 所有する JS モデル名。保持は安全です。
   * @ko name - 소유 JS 모델 이름이며 안전하게 유지할 수 있습니다.
   * @returns Undefined, synchronously.
   * @zh 同步返回 undefined。
   * @ja 同期的に undefined。
   * @ko 동기적으로 undefined를 반환합니다.
   */
  (context: Context, name: string): void;
}
