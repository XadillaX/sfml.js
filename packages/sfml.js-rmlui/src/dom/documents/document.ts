import { native } from '../../internal/native';
import { Element } from '../elements/element';
import { ElementText } from '../elements/element-text';
import { Context } from '../../runtime/context';
import { DocumentHeader, documentHeaderHandle } from './document-header';
import { ModalFlag, FocusFlag, ScrollFlag } from './document-flags';
import { elementConstructors } from '../../internal/element-factory';
import {
  containerHandle, containerFromNative, type StyleSheetContainer,
} from '../../style/properties/style-sheet';

/**
 * Loaded RmlUi document wrapper.
 *
 * @zh 已加载的 RmlUi 文档包装器。
 * @ja 読み込み済み RmlUi ドキュメントのラッパー。
 * @ko 로드된 RmlUi 문서 래퍼입니다.
 */
export class Document extends Element {
  /**
   * Execute Rml::ElementDocument::LoadInlineScript through the selected host.
   *
   * @zh 通过所选宿主执行 Rml::ElementDocument::LoadInlineScript。
   * @ja 選択ホストで Rml::ElementDocument::LoadInlineScript を実行します。
   * @ko 선택 호스트로 Rml::ElementDocument::LoadInlineScript를 실행합니다.
   * @param content - Trusted script source.
   * @zh content - 受信任的脚本源。
   * @ja content - 信頼されたスクリプトソース。
   * @ko content - 신뢰할 수 있는 스크립트 소스입니다.
   * @param sourcePath - Source name used in errors and stacks.
   * @zh sourcePath - 错误和堆栈中的来源名称。
   * @ja sourcePath - エラーとスタックのソース名。
   * @ko sourcePath - 오류와 스택에 사용할 소스 이름입니다.
   * @param sourceLine - One-based first source line.
   * @zh sourceLine - 从一开始的首行行号。
   * @ja sourceLine - 1 始まりの最初の行番号。
   * @ko sourceLine - 1부터 시작하는 첫 소스 행입니다.
   * @remarks
   * Ordinary RmlUi documents preserve the upstream no-op implementation.
   * @zh 常规 RmlUi 文档保留上游的无操作实现。
   * @ja 通常の RmlUi 文書は上流の何もしない実装を保持します。
   * @ko 일반 RmlUi 문서는 상위의 무작업 구현을 유지합니다.
   */
  loadInlineScript(content: string, sourcePath: string, sourceLine = 1): void {
    native.loadDocumentInlineScript(
      this.handle, content, sourcePath, sourceLine,
    );
  }

  /**
   * Execute Rml::ElementDocument::LoadExternalScript through its captured host.
   *
   * @zh 通过捕获的宿主执行 Rml::ElementDocument::LoadExternalScript。
   * @ja 取得済みホストで Rml::ElementDocument::LoadExternalScript を実行します。
   * @ko 캡처된 호스트로 Rml::ElementDocument::LoadExternalScript를 실행합니다.
   * @param sourcePath - Resolved RmlUi FileInterface path.
   * @zh sourcePath - 解析后的 RmlUi FileInterface 路径。
   * @ja sourcePath - 解決済み RmlUi FileInterface パス。
   * @ko sourcePath - 해석된 RmlUi FileInterface 경로입니다.
   */
  loadExternalScript(sourcePath: string): void {
    native.loadDocumentExternalScript(this.handle, sourcePath);
  }

  /**
   * Execute Rml::ElementDocument::ProcessHeader using a native header snapshot.
   *
   * @zh 使用原生文档头快照执行 Rml::ElementDocument::ProcessHeader。
   * @ja ネイティブヘッダーコピーで Rml::ElementDocument::ProcessHeader を実行します。
   * @ko 네이티브 헤더 사본으로 Rml::ElementDocument::ProcessHeader를 실행합니다.
   * @param header - Native resource and metadata storage to process.
   * @zh header - 待处理的原生资源及元信息存储。
   * @ja header - 処理するネイティブ資源とメタデータ領域。
   * @ko header - 처리할 네이티브 리소스 및 메타데이터 저장소입니다.
   * @remarks
   * Resolves templates first, then merges document RCSS in source order.
   * Stores the document's own source and title, dispatches script hooks, and
   * immediately hides the document. Existing styles stay installed when the
   * header contains no loadable RCSS. Core's base script hooks do not execute
   * scripts; execution requires a script host. Call updateDocument for layout.
   * @zh 先解析模板，再按来源顺序合并文档 RCSS。保存文档自身的来源与标题，
   * 调用脚本钩子并立即隐藏文档。没有可加载 RCSS 时保留已有样式表。
   * Core 基类钩子不执行脚本，需要脚本宿主。调用 updateDocument 更新布局。
   * @ja テンプレートを先に解決し、文書 RCSS をソース順に結合します。
   * 文書自身のソースとタイトルを保存し、スクリプトフックを呼び、即座に非表示にします。
   * 読込可能な RCSS がなければ既存シートを保持します。Core の基底フックは実行しません。
   * 実行にはホスト、配置更新には updateDocument が必要です。
   * @ko 템플릿을 먼저 해석하고 소스 순서로 문서 RCSS를 병합합니다.
   * 문서 자체의 소스와 제목을 저장하고 스크립트 훅을 호출한 뒤 즉시 숨깁니다.
   * 로드 가능한 RCSS가 없으면 기존 시트를 유지합니다. Core 기본 훅은 실행하지 않습니다.
   * 실행에는 호스트가 필요하며 updateDocument로 레이아웃을 갱신하세요.
   */
  processHeader(header: DocumentHeader): void {
    native.processDocumentHeader(this.handle, documentHeaderHandle(header));
  }

  /**
   * Retain Rml::ElementDocument::GetStyleSheetContainer.
   *
   * @zh 保留 Rml::ElementDocument::GetStyleSheetContainer 的原生容器。
   * @ja Rml::ElementDocument::GetStyleSheetContainer の所有者を保持します。
   * @ko Rml::ElementDocument::GetStyleSheetContainer의 소유자를 유지합니다.
   * @returns Read-only container, or null; survives document destruction.
   * @zh 只读容器或 null；文档销毁后仍可使用。
   * @ja 読み取り専用コンテナー、または null。文書破棄後も有効です。
   * @ko 읽기 전용 컨테이너 또는 null이며 문서 파괴 후에도 유효합니다.
   */
  getStyleSheetContainer(): StyleSheetContainer | null {
    const handle = native.documentGetStyleSheetContainer(this.handle);
    return handle === null ? null : containerFromNative(handle);
  }

  /**
   * Invoke Rml::ElementDocument::SetStyleSheetContainer.
   *
   * @zh 调用 Rml::ElementDocument::SetStyleSheetContainer。
   * @ja Rml::ElementDocument::SetStyleSheetContainer を呼びます。
   * @ko Rml::ElementDocument::SetStyleSheetContainer를 호출합니다.
   * @param container - Shared native container, or null to clear all rules.
   * @zh container - 共享原生容器；null 清除全部样式表规则。
   * @ja container - 共有コンテナー。null はシートの全ルールを解除します。
   * @ko container - 공유 컨테이너이며 null이면 시트의 모든 규칙을 제거합니다.
   * @remarks
   * The document retains the container independently of its JS facade.
   * Media queries compile immediately; updateDocument applies style/layout.
   * A normal event listener may replace the sheet; parsing, provider and
   * effect callbacks cannot reenter this operation.
   * @zh 文档独立于 JS 包装器保留容器。媒体查询立即编译；
   * updateDocument 应用样式与布局。
   * 普通事件监听器可替换样式表；解析、资源提供器和效果回调不能重入。
   * @ja JS ラッパーと独立して保持し、メディアクエリーは即座にコンパイルします。
   * updateDocument でスタイルと配置を適用します。
   * 通常のイベントリスナーで置換できます。解析、プロバイダー、
   * エフェクトのコールバックからの再入はできません。
   * @ko JS 래퍼와 독립적으로 유지하며 미디어 쿼리를 즉시 컴파일합니다.
   * updateDocument로 스타일과 레이아웃을 적용하세요.
   * 일반 이벤트 리스너에서 교체할 수 있습니다. 파싱, 공급자,
   * 효과 콜백에서는 재진입할 수 없습니다.
   */
  setStyleSheetContainer(container: StyleSheetContainer | null): void {
    native.documentSetStyleSheetContainer(this.handle,
      container === null ? null : containerHandle(container));
  }

  /**
   * Invoke Rml::ElementDocument::ReloadStyleSheet.
   *
   * @zh 调用 Rml::ElementDocument::ReloadStyleSheet。
   * @ja Rml::ElementDocument::ReloadStyleSheet を呼びます。
   * @ko Rml::ElementDocument::ReloadStyleSheet를 호출합니다.
   * @remarks
   * Reloads style tags and linked RCSS from the original document source URL,
   * which must still be readable. Inline style attributes are preserved.
   * @zh 从仍可读取的原始文档来源 URL 重载 style 标签及链接的 RCSS，
   * 保留元素的行内 style 属性。
   * @ja 読み取り可能な元の文書 URL から style タグとリンク先 RCSS を再読込します。
   * 要素のインライン style 属性は保持します。
   * @ko 읽을 수 있는 원래 문서 URL에서 style 태그와 연결된 RCSS를 다시 읽습니다.
   * 요소의 인라인 style 속성은 유지합니다.
   */
  reloadStyleSheet(): void {
    native.documentReloadStyleSheet(this.handle);
  }

  /**
   * Create a detached native node through Rml::ElementDocument::CreateElement.
   *
   * @zh 通过 Rml::ElementDocument::CreateElement 创建脱离文档的原生节点。
   * @ja Rml::ElementDocument::CreateElement で未接続のネイティブ要素を作成します。
   * @ko Rml::ElementDocument::CreateElement로 분리된 네이티브 요소를 만듭니다.
   * @param name - Native element tag.
   * @zh name - 原生元素标签名。
   * @ja name - ネイティブ要素のタグ名。
   * @ko name - 네이티브 요소 태그입니다.
   * @returns Owned detached node, or null when the factory fails.
   * @zh 持有所有权的脱离节点；工厂失败时为 null。
   * @ja 所有権付きの未接続要素。ファクトリー失敗時は null。
   * @ko 소유권이 있는 분리 요소이며 팩토리 실패 시 null입니다.
   * @remarks
   * The node has no owner document until insertion. Retaining a descendant
   * retains the detached native tree. Unreachable detached trees are collected,
   * including cycles through listeners; shutdown invalidates all nodes.
   * @zh 插入前没有所属文档。保留后代会保活脱离的原生树。不可达的脱离树会被回收，
   * 包括监听器形成的引用环；关闭运行时使所有节点失效。
   * @ja 挿入までは所有文書を持ちません。子孫の参照は未接続ツリーを保持します。
   * リスナー循環を含む到達不能ツリーは回収され、終了時には全要素が無効になります。
   * @ko 삽입 전에는 소유 문서가 없습니다. 자손 참조가 분리 트리를 유지합니다.
   * 리스너 순환을 포함한 도달 불가능 트리는 회수되며 종료 시 모든 요소가 무효화됩니다.
   */
  createElement(name: string): Element | null {
    const handle = native.createElement(this.handle, name);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Create a detached text node through Rml::ElementDocument::CreateTextNode.
   *
   * @zh 通过 Rml::ElementDocument::CreateTextNode 创建脱离文档的文本节点。
   * @ja Rml::ElementDocument::CreateTextNode で未接続テキスト要素を作成します。
   * @ko Rml::ElementDocument::CreateTextNode로 분리된 텍스트 요소를 만듭니다.
   * @param text - Literal text, including Unicode and markup characters.
   * @zh text - 字面文本，支持 Unicode 和标记字符。
   * @ja text - Unicode やマークアップ文字を含むリテラルテキスト。
   * @ko text - 유니코드와 마크업 문자를 포함하는 리터럴 텍스트입니다.
   * @returns Owned detached text node, or null when the factory fails.
   * @zh 持有所有权的脱离文本节点；工厂失败时为 null。
   * @ja 所有権付きの未接続テキスト要素。ファクトリー失敗時は null。
   * @ko 소유권이 있는 분리 텍스트 요소이며 팩토리 실패 시 null입니다.
   */
  createTextNode(text: string): ElementText | null {
    const handle = native.createTextNode(this.handle, text);
    return handle === null ? null : new ElementText(handle);
  }

  /**
   * Show the document.
   *
   * @zh 显示文档。
   * @ja 文書を表示します。
   * @ko 문서를 표시합니다.
   * @param modal - Native ModalFlag; false/true alias None/Modal. Default None.
   * @zh modal - 原生 ModalFlag；false/true 对应 None/Modal，默认 None。
   * @ja modal - ModalFlag。false/true は None/Modal の別名。既定値は None。
   * @ko modal - ModalFlag이며 false/true는 None/Modal의 별칭입니다.
   * 기본값은 None입니다.
   * @param focus - Native FocusFlag; defaults to Auto.
   * @zh focus - 原生 FocusFlag，默认 Auto。
   * @ja focus - FocusFlag。既定値は Auto。
   * @ko focus - FocusFlag이며 기본값은 Auto입니다.
   * @param scroll - Native ScrollFlag; defaults to Auto.
   * @zh scroll - 原生 ScrollFlag，默认 Auto。
   * @ja scroll - ScrollFlag。既定値は Auto。
   * @ko scroll - ScrollFlag이며 기본값은 Auto입니다.
   */
  show(
    modal: boolean | ModalFlag = ModalFlag.None,
    focus: FocusFlag = FocusFlag.Auto, scroll: ScrollFlag = ScrollFlag.Auto,
  ): void {
    native.showDocument(this.handle, modal, focus, scroll);
  }

  /**
   * Return Rml::ElementDocument::GetContext.
   *
   * @zh 返回 Rml::ElementDocument::GetContext。
   * @ja この文書が属するコンテキストを取得します。
   * @ko Rml::ElementDocument::GetContext를 반환합니다.
   * @returns Canonical owning context, or null for a detached factory document.
   * @zh 唯一所属上下文；工厂创建的脱离文档返回 null。
   * @ja 所有コンテキスト。ファクトリーで作った未接続文書では null。
   * @ko 고유 소유 컨텍스트이며 팩토리로 만든 분리 문서에서는 null입니다.
   */
  getContext(): Context | null {
    const handle = native.getDocumentContext(this.handle);
    return handle === null ? null : new Context(handle);
  }

  /**
   * Check whether this visible document has the modal flag.
   *
   * @zh 查询此可见文档是否具有模态标志。
   * @ja この表示中の文書にモーダルフラグがあるかを調べます。
   * @ko 이 표시된 문서에 모달 플래그가 있는지 확인합니다.
   * @returns True when the modal flag is set and the document is visible.
   * @zh 模态标志已设置且文档可见时返回 true；隐藏时返回 false。
   * @ja モーダルフラグが設定され、文書が表示中なら true。非表示なら false。
   * @ko 모달 플래그가 설정되고 문서가 표시될 때 true이며 숨겨지면 false입니다.
   */
  isModal(): boolean {
    return native.isDocumentModal(this.handle);
  }

  /**
   * Move to the front through Rml::ElementDocument::PullToFront.
   *
   * @zh 通过 Rml::ElementDocument::PullToFront 移至文档栈顶部。
   * @ja Rml::ElementDocument::PullToFront で文書スタックの最前面に移動します。
   * @ko Rml::ElementDocument::PullToFront로 문서 스택의 맨 앞으로 이동합니다.
   */
  pullToFront(): void {
    native.pullToFront(this.handle);
  }

  /**
   * Move back in the document stack through Rml::ElementDocument::PushToBack.
   *
   * @zh 通过 Rml::ElementDocument::PushToBack 移至文档栈底部。
   * @ja Rml::ElementDocument::PushToBack で文書スタックの最背面に移動します。
   * @ko Rml::ElementDocument::PushToBack으로 문서 스택의 맨 뒤로 이동합니다.
   */
  pushToBack(): void {
    native.pushToBack(this.handle);
  }

  /**
   * Update styles and layout through Rml::ElementDocument::UpdateDocument.
   *
   * @zh 通过 Rml::ElementDocument::UpdateDocument 更新样式和布局。
   * @ja Rml::ElementDocument::UpdateDocument でスタイルとレイアウトを更新します。
   * @ko Rml::ElementDocument::UpdateDocument로 스타일과 레이아웃을 갱신합니다.
   * @remarks
   * Call before layout queries after mutation if Context.update has not run.
   * This does not flush the context's pending document destruction.
   * @zh 修改后若尚未调用 Context.update，应在布局查询前调用此方法。
   * 本方法不清理上下文中待销毁的文档。
   * @ja 変更後に Context.update を呼んでいなければ、配置の照会前に呼びます。
   * コンテキストの保留中の文書破棄は処理しません。
   * @ko 변경 후 Context.update를 호출하지 않았다면 레이아웃 조회 전에 호출합니다.
   * 컨텍스트의 대기 중인 문서 파괴는 처리하지 않습니다.
   */
  updateDocument(): void {
    native.updateDocument(this.handle);
  }

  /**
   * Search through Rml::ElementDocument::FindNextTabElement.
   *
   * @zh 通过 Rml::ElementDocument::FindNextTabElement 查找 Tab 导航目标。
   * @ja Rml::ElementDocument::FindNextTabElement で Tab 移動先を探します。
   * @ko Rml::ElementDocument::FindNextTabElement로 Tab 이동 대상을 찾습니다.
   * @param current - Starting element; must belong to this document.
   * @zh current - 起始元素，必须属于本文档。
   * @ja current - 開始要素。この文書に属する必要があります。
   * @ko current - 시작 요소이며 이 문서에 속해야 합니다.
   * @param forward - Search forward when true, backward when false.
   * @zh forward - true 向前查找，false 向后查找。
   * @ja forward - true は順方向、false は逆方向です。
   * @ko forward - true는 정방향, false는 역방향입니다.
   * @param wrapAround - Continue from the document boundary; default true.
   * @zh wrapAround - 是否在文档边界循环查找，默认 true。
   * @ja wrapAround - 文書の境界で折り返すか。既定値は true。
   * @ko wrapAround - 문서 경계에서 순환할지 여부이며 기본값은 true입니다.
   * @returns Next tabbable element, or null; does not change focus.
   * @zh 下一个可 Tab 导航的元素或 null，不改变焦点。
   * @ja 次の Tab 移動可能な要素、または null。フォーカスは変更しません。
   * @ko 다음 Tab 이동 가능한 요소 또는 null이며 포커스는 변경하지 않습니다.
   */
  findNextTabElement(
    current: Element, forward: boolean, wrapAround = true,
  ): Element | null {
    const handle = native.findNextTabElement(
      this.handle, current.handle, forward, wrapAround,
    );
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Hide the document without closing it.
   *
   * @zh 隐藏文档但不关闭。
   * @ja 文書を閉じずに非表示にします。
   * @ko 문서를 닫지 않고 숨깁니다.
   */
  hide(): void {
    native.hideDocument(this.handle);
  }

  /**
   * Close and unload the document through RmlUi.
   *
   * @zh 通过 RmlUi 关闭并卸载文档。
   * @ja RmlUi で文書を閉じてアンロードします。
   * @ko RmlUi를 통해 문서를 닫고 언로드합니다.
   * @remarks
   * Calls Rml::ElementDocument::Close. Only root documents enter the context's
   * destruction queue; nested or detached documents stay with their owner tree.
   * Wrappers remain readable during synchronous unload callbacks and until
   * deferred destruction. Destruction releases listeners and invalidates
   * wrappers.
   * @zh 调用 Rml::ElementDocument::Close。只有根文档进入销毁队列，
   * 嵌套或脱离文档存活至所属树被销毁。
   * 同步 unload 回调期间及延迟销毁前仍可读取包装器；销毁时自动释放监听器并使包装器失效。
   * @ja Rml::ElementDocument::Close を呼びます。ルート文書だけが破棄待ちとなり、
   * 入れ子・未接続文書は所有ツリーの破棄まで生存します。
   * 同期 unload コールバック中と遅延破棄前は読み取れます。破棄でリスナーを解放し、無効化します。
   * @ko Rml::ElementDocument::Close를 호출합니다. 루트 문서만 파괴 대기열에 들어가며
   * 중첩 또는 분리 문서는 소유 트리가 파괴될 때까지 유지됩니다.
   * 동기 unload 콜백과 지연 파괴 전에는 읽을 수 있으며 파괴 시 리스너를 해제하고 래퍼를 무효화합니다.
   */
  close(): void {
    native.closeDocument(this.handle);
  }

  /**
   * Explicitly unload this document from its context.
   *
   * @zh 从上下文中显式卸载本文档。
   * @ja コンテキストから文書を明示的にアンロードします。
   * @ko 컨텍스트에서 문서를 명시적으로 언로드합니다.
   * @remarks
   * Calls Rml::Context::UnloadDocument. Destruction is deferred by RmlUi;
   * only documents directly under the context root are queued for destruction.
   * Nested or detached documents remain owned by their current tree.
   * listeners are released automatically and all aliases reject access after
   * destruction. Reads remain valid during the synchronous unload callback.
   * @zh 调用 Rml::Context::UnloadDocument；仅上下文根下的直接文档进入延迟销毁队列，
   * 嵌套或脱离文档仍由当前树拥有。
   * 监听器会自动释放，实际销毁后所有别名均拒绝访问；同步 unload 回调期间仍可读取。
   * @ja Rml::Context::UnloadDocument を呼びます。ルート直下の文書だけが破棄待ちとなり、
   * 入れ子・未接続文書は現在のツリーが所有し続けます。
   * リスナーは自動解放され、破棄後はすべての別名が無効です。同期 unload 中は読み取れます。
   * @ko Rml::Context::UnloadDocument를 호출합니다. 루트 바로 아래 문서만 파괴 대기열에
   * 들어가며 중첩 또는 분리 문서는 현재 트리가 계속 소유합니다.
   * 리스너는 자동 해제되며 파괴 후 모든 별칭의 접근을 거부합니다. 동기 unload 중에는 읽을 수 있습니다.
   */
  unload(): void {
    native.unloadDocumentHandle(this.handle);
  }

  /**
   * Document title.
   *
   * @zh 文档标题。
   * @ja 文書のタイトル。
   * @ko 문서 제목입니다.
   * @returns Current title.
   * @zh 当前标题。
   * @ja 現在のタイトル。
   * @ko 현재 제목입니다.
   */
  get title(): string {
    return native.getDocumentTitle(this.handle);
  }

  /**
   * Set the document title through Rml::ElementDocument::SetTitle.
   *
   * @zh 通过 Rml::ElementDocument::SetTitle 设置文档标题。
   * @ja Rml::ElementDocument::SetTitle で文書のタイトルを設定します。
   * @ko Rml::ElementDocument::SetTitle로 문서 제목을 설정합니다.
   * @param title - New title; does not change the SFML window title.
   * @zh title - 新标题，不修改 SFML 窗口标题。
   * @ja title - 新しいタイトル。SFML ウィンドウのタイトルは変わりません。
   * @ko title - 새 제목이며 SFML 창 제목은 변경하지 않습니다.
   */
  set title(title: string) {
    native.setDocumentTitle(this.handle, title);
  }

  /**
   * Source URL of the document.
   *
   * @zh 文档的来源 URL。
   * @ja 文書のソース URL。
   * @ko 문서의 소스 URL입니다.
   * @returns Native source URL, recorded by the head element. Without a head
   * it stays empty; memory loading without sourceUrl uses
   * `"[document from memory]"` when a head is present.
   * @zh 原生源 URL，在解析 head 时记录。没有 head 时为空；内存加载未传 sourceUrl
   * 且包含 head 时使用 `"[document from memory]"`。
   * @ja head の解析時に記録するソース URL。head がなければ空です。
   * メモリ読み込みで sourceUrl を省略し head があれば `"[document from memory]"`。
   * @ko head 해석 시 기록하는 소스 URL입니다. head가 없으면 비어 있습니다.
   * 메모리 로드에서 sourceUrl을 생략하고 head가 있으면 `"[document from memory]"`입니다.
   */
  get sourceURL(): string {
    return native.getDocumentSourceURL(this.handle);
  }
}

elementConstructors.set('Document', Document);
