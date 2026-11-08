/**
 * Multi-selection gestures, clearing rules and interaction scope.
 *
 * @zh 多选手势、清空规则和交互范围。
 * @ja 複数選択の操作、解除規則、対象範囲。
 * @ko 다중 선택 동작, 해제 규칙 및 상호 작용 범위.
 */
export const ImGuiMultiSelectFlags = Object.freeze({
  /**
   * Use standard multi-selection behavior.
   *
   * @zh 使用标准多选行为。
   * @ja 標準の複数選択動作。
   * @ko 기본 다중 선택 동작.
   */
  None: 0,
  /**
   * Limit selection to one item while retaining the multi-select API.
   *
   * @zh 保留多选 API，但仅允许选择一项。
   * @ja 複数選択 API を使いつつ選択を一項目に制限する。
   * @ko 다중 선택 API를 유지하면서 한 항목만 선택 허용.
   */
  SingleSelect: 1,
  /**
   * Disable the Ctrl+A select-all shortcut.
   *
   * @zh 禁用 Ctrl+A 全选快捷键。
   * @ja Ctrl+A の全選択を無効化する。
   * @ko Ctrl+A 전체 선택 단축키 금지.
   */
  NoSelectAll: 2,
  /**
   * Disable Shift ranges and merging of contiguous box-selection requests.
   *
   * @zh 禁用 Shift 范围选择，也不合并连续框选请求。
   * @ja Shift 範囲選択と連続した矩形選択要求の結合を無効化する。
   * @ko Shift 범위 선택과 연속된 박스 선택 요청 병합 금지.
   */
  NoRangeSelect: 4,
  /**
   * Navigation does not automatically select the focused item.
   *
   * @zh 导航不自动选中获得焦点的项。
   * @ja ナビゲーションでフォーカス項目を自動選択しない。
   * @ko 탐색 시 포커스된 항목을 자동 선택하지 않음.
   */
  NoAutoSelect: 8,
  /**
   * Preserve existing selection when navigating or selecting another item.
   *
   * @zh 导航或选择另一项时保留原选择。
   * @ja 移動や別項目の選択時に既存の選択を保つ。
   * @ko 탐색하거나 다른 항목을 선택할 때 기존 선택 유지.
   */
  NoAutoClear: 16,
  /**
   * Preserve the selection when clicking an already-selected item.
   *
   * @zh 点击已选中项时保留当前选择。
   * @ja 選択済み項目をクリックしても選択全体を保つ。
   * @ko 이미 선택된 항목을 클릭해도 기존 선택 유지.
   */
  NoAutoClearOnReselect: 32,
  /**
   * Box-select items sharing the same horizontal position and width.
   *
   * @zh 框选横向位置与宽度相同的项。
   * @ja 横位置と幅が同じ項目を矩形で選択する。
   * @ko 가로 위치와 너비가 같은 항목을 박스로 선택.
   */
  BoxSelect1d: 64,
  /**
   * Box-select varying widths/positions; checks clipped items and costs more.
   *
   * @zh 支持不同宽度和位置的框选；会检查被裁剪项，开销更高。
   * @ja 異なる幅や位置も矩形選択。隠れた項目も調べるため負荷が高い。
   * @ko 너비와 위치가 다른 항목도 박스 선택. 잘린 항목 검사로 비용 증가.
   */
  BoxSelect2d: 128,
  /**
   * Do not auto-scroll when box selection reaches scope edges.
   *
   * @zh 框选到达范围边缘时不自动滚动。
   * @ja 矩形選択が範囲の端に達しても自動スクロールしない。
   * @ko 박스 선택이 범위 가장자리에 닿아도 자동 스크롤하지 않음.
   */
  BoxSelectNoScroll: 256,
  /**
   * Escape clears selection while this scope has focus.
   *
   * @zh 此范围获得焦点时按 Escape 清空选择。
   * @ja この範囲にフォーカスがあるとき Escape で選択解除。
   * @ko 이 범위에 포커스가 있을 때 Escape로 선택 해제.
   */
  ClearOnEscape: 512,
  /**
   * Clear selection when clicking empty space inside the scope.
   *
   * @zh 点击范围内空白处时清空选择。
   * @ja 範囲内の空白をクリックすると選択解除する。
   * @ko 범위 안 빈 공간을 클릭하면 선택 해제.
   */
  ClearOnClickVoid: 1024,
  /**
   * Use the whole window for box selection and empty-space clearing (default).
   *
   * @zh 框选和空白清空作用于整个窗口，默认范围。
   * @ja 矩形選択と空白クリック解除の範囲を窓全体にする。既定。
   * @ko 박스 선택과 빈 공간 해제 범위를 전체 창으로 설정. 기본값.
   */
  ScopeWindow: 2048,
  /**
   * Limit box selection and empty-space clearing to Begin/EndMultiSelect
   * bounds.
   *
   * @zh 框选和空白清空仅作用于 Begin/EndMultiSelect 包围区域。
   * @ja 矩形選択と空白解除を Begin/EndMultiSelect 内の領域に限る。
   * @ko 박스 선택과 빈 공간 해제를 Begin/EndMultiSelect 영역으로 제한.
   */
  ScopeRect: 4096,
  /**
   * Select an unselected item on mouse-down (default).
   *
   * @zh 按下鼠标时选中未选项，默认行为。
   * @ja 未選択項目をマウス押下時に選ぶ。既定。
   * @ko 마우스를 누를 때 미선택 항목 선택. 기본값.
   */
  SelectOnClick: 8192,
  /**
   * Select on release, allowing an unselected item to be dragged unchanged.
   *
   * @zh 松开鼠标时选择，可拖动未选项而不改变选择。
   * @ja 離すときに選択し、未選択項目のドラッグでは選択を変えない。
   * @ko 마우스를 놓을 때 선택해 미선택 항목 드래그 시 기존 선택 유지.
   */
  SelectOnClickRelease: 16384,
  /**
   * Temporary option: wrap horizontal navigation between rows.
   *
   * @zh 临时选项：水平导航到边缘时换行。
   * @ja 暫定設定。横移動で端から次の行へ回り込む。
   * @ko 임시 설정. 가로 탐색 시 가장자리에서 다음 행으로 이동.
   */
  NavWrapX: 65536,
} as const);

/**
 * Bitwise combination of multi-selection options.
 *
 * @zh 多选选项的按位组合。
 * @ja 複数選択設定のビット組み合わせ。
 * @ko 다중 선택 설정의 비트 조합.
 */
export type ImGuiMultiSelectFlags = number;

/**
 * Selection changes requested by ImGui for application-owned selection data.
 *
 * @zh ImGui 请求应用对自有选择数据执行的变更类型。
 * @ja アプリ所有の選択データへ ImGui が要求する変更の種類。
 * @ko 앱 소유 선택 데이터에 ImGui가 요청하는 변경 종류.
 */
export const ImGuiSelectionRequestType = Object.freeze({
  /**
   * No selection request.
   *
   * @zh 无选择请求。
   * @ja 選択要求なし。
   * @ko 선택 요청 없음.
   */
  None: 0,
  /**
   * Select or clear all items according to the request's Selected value.
   *
   * @zh 根据请求的 Selected 值全选或全部取消。
   * @ja 要求の Selected 値に従い全選択または全解除する。
   * @ko 요청의 Selected 값에 따라 전체 선택 또는 전체 해제.
   */
  SetAll: 1,
  /**
   * Apply Selected to the inclusive RangeFirstItem..RangeLastItem range.
   *
   * @zh 将 Selected 应用于 RangeFirstItem..RangeLastItem，包含两端。
   * @ja RangeFirstItem..RangeLastItem の両端を含む範囲に Selected を適用。
   * @ko 양 끝을 포함한 RangeFirstItem..RangeLastItem에 Selected 적용.
   */
  SetRange: 2,
} as const);

/**
 * Numeric selection-request kind.
 *
 * @zh 选择请求种类的数值标识。
 * @ja 選択要求の種類を示す数値。
 * @ko 선택 요청 종류를 나타내는 숫자.
 */
export type ImGuiSelectionRequestType = number;
