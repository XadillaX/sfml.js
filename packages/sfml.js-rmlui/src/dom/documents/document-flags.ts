/**
 * Rml::ModalFlag for Document.show.
 *
 * @zh Document.show 使用的 Rml::ModalFlag。
 * @ja Document.show 用の Rml::ModalFlag。
 * @ko Document.show용 Rml::ModalFlag입니다.
 */
export enum ModalFlag {
  /**
   * Remove modal state.
   *
   * @zh 移除模态状态。
   * @ja モーダル状態を解除します。
   * @ko 모달 상태를 해제합니다.
   */
  None = 0,
  /**
   * Prevent other ordinary documents from receiving focus.
   *
   * @zh 阻止其他普通文档获得焦点。
   * @ja 他の通常文書へのフォーカスを防ぎます。
   * @ko 다른 일반 문서가 포커스를 받지 못하게 합니다.
   */
  Modal = 1,
  /**
   * Preserve the current modal state.
   *
   * @zh 保留当前模态状态。
   * @ja 現在のモーダル状態を維持します。
   * @ko 현재 모달 상태를 유지합니다.
   */
  Keep = 2,
}

/**
 * Rml::FocusFlag for Document.show.
 *
 * @zh Document.show 使用的 Rml::FocusFlag。
 * @ja Document.show 用の Rml::FocusFlag。
 * @ko Document.show용 Rml::FocusFlag입니다.
 */
export enum FocusFlag {
  /**
   * Do not request focus.
   *
   * @zh 不请求焦点。
   * @ja フォーカスを要求しません。
   * @ko 포커스를 요청하지 않습니다.
   */
  None = 0,
  /**
   * Focus the document.
   *
   * @zh 聚焦文档。
   * @ja 文書にフォーカスします。
   * @ko 문서에 포커스를 줍니다.
   */
  Document = 1,
  /**
   * Restore the document's last focused element.
   *
   * @zh 恢复文档中上次获得焦点的元素。
   * @ja 文書内で最後にフォーカスされた要素に戻します。
   * @ko 문서에서 마지막으로 포커스된 요소로 복원합니다.
   */
  Keep = 2,
  /**
   * Focus the first tabbable autofocus element, otherwise the document.
   *
   * @zh 聚焦首个可 Tab 导航的 autofocus 元素，否则聚焦文档。
   * @ja 最初の Tab 移動可能な autofocus 要素、なければ文書にフォーカスします。
   * @ko 첫 번째 Tab 이동 가능한 autofocus 요소, 없으면 문서에 포커스를 줍니다.
   */
  Auto = 3,
}

/**
 * Rml::ScrollFlag for Document.show.
 *
 * @zh Document.show 使用的 Rml::ScrollFlag。
 * @ja Document.show 用の Rml::ScrollFlag。
 * @ko Document.show용 Rml::ScrollFlag입니다.
 */
export enum ScrollFlag {
  /**
   * Do not scroll when showing the document.
   *
   * @zh 显示文档时不滚动。
   * @ja 文書表示時にスクロールしません。
   * @ko 문서를 표시할 때 스크롤하지 않습니다.
   */
  None = 0,
  /**
   * Scroll the newly focused child into view when applicable.
   *
   * @zh 适用时将刚获得焦点的子元素滚动到可见区域。
   * @ja 必要に応じ、新たにフォーカスした子要素を表示範囲にスクロールします。
   * @ko 필요한 경우 새로 포커스된 자식 요소를 보이는 영역으로 스크롤합니다.
   */
  Auto = 1,
}

/**
 * Native Rml::ScrollBehavior for context and element scrolling.
 *
 * @zh 上下文和元素滚动使用的原生 Rml::ScrollBehavior。
 * @ja コンテキストと要素のスクロール用 Rml::ScrollBehavior。
 * @ko 컨텍스트와 요소 스크롤용 네이티브 Rml::ScrollBehavior입니다.
 */
export enum ScrollBehavior {
  /**
   * Use the context setting; setting the default to Auto selects Smooth.
   *
   * @zh 使用上下文设置；将默认值设为 Auto 时采用 Smooth。
   * @ja コンテキスト設定に従います。既定値を Auto にすると Smooth になります。
   * @ko 컨텍스트 설정을 따르며 기본값을 Auto로 설정하면 Smooth를 사용합니다.
   */
  Auto = 0,
  /**
   * Animate scrolling smoothly.
   *
   * @zh 平滑滚动。
   * @ja 滑らかにスクロールします。
   * @ko 부드럽게 스크롤합니다.
   */
  Smooth = 1,
  /**
   * Apply scrolling immediately.
   *
   * @zh 立即滚动。
   * @ja 即座にスクロールします。
   * @ko 즉시 스크롤합니다.
   */
  Instant = 2,
}
