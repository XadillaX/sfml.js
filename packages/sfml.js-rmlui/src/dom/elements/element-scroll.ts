import { native } from '../../internal/native';
import { Element } from './element';
import type { ElementNativeHandle } from '../../values/types';

/**
 * Choose the horizontal or vertical scrollbar.
 *
 * @zh 选择水平或垂直滚动条。
 * @ja 水平または垂直のスクロールバーを選びます。
 * @ko 수평 또는 수직 스크롤바를 선택합니다.
 */
export enum ScrollOrientation {
  /**
   * Vertical scrollbar.
   *
   * @zh 垂直滚动条。
   * @ja 垂直スクロールバー。
   * @ko 수직 스크롤바입니다.
   */
  VERTICAL = 0,
  /**
   * Horizontal scrollbar.
   *
   * @zh 水平滚动条。
   * @ja 水平スクロールバー。
   * @ko 수평 스크롤바입니다.
   */
  HORIZONTAL = 1,
}

const handles = new WeakMap<ElementScroll, ElementNativeHandle>();
const wrappers = new WeakMap<ElementNativeHandle, ElementScroll>();

/**
 * Resolve the checked component receiver.
 *
 * @internal
 * @param value - Component wrapper.
 * @returns Native element token.
 */
function handle(value: ElementScroll): ElementNativeHandle {
  const result = handles.get(value);
  if (!result) {
    throw new TypeError('Expected an ElementScroll');
  }
  return result;
}

/**
 * Owned Rml::ElementScroll or checked view of Element::GetElementScroll.
 *
 * @zh 独立持有的 Rml::ElementScroll 或 Element::GetElementScroll 的检查视图。
 * @ja 独立所有の Rml::ElementScroll または GetElementScroll の検証ビュー。
 * @ko 독립 소유 Rml::ElementScroll 또는 GetElementScroll의 검증 뷰입니다.
 * @remarks
 * The constructor creates a distinct native component. Element destruction
 * invalidates both forms; their tokens retain detached hosts and callbacks.
 * Owned component GC defers listener teardown to the outer native boundary.
 * @zh 构造函数创建独立原生组件。两种形式都在元素销毁后失效；令牌保活分离宿主
 * 和回调。独立组件的 GC 监听器清理延迟到最外层原生调用边界。
 * @ja コンストラクターは独立したコンポーネントを作成します。要素破棄で両方無効に
 * なります。トークンは分離ホストとコールバックを保持し、GC は安全な境界で解放します。
 * @ko 생성자는 독립 구성 요소를 만듭니다. 요소 파괴 시 두 형태 모두 무효화되며
 * 토큰은 분리 호스트와 콜백을 유지합니다. GC 정리는 최외곽 호출 경계에서 수행됩니다.
 */
export class ElementScroll {
  /**
   * Create an independently owned native scrollbar component for an element.
   *
   * @zh 为元素创建独立持有的原生滚动条组件。
   * @ja 要素用に独立所有のネイティブスクロールバーを作成します。
   * @ko 요소의 독립 소유 네이티브 스크롤바 구성 요소를 만듭니다.
   * @param element - Live host; its built-in component remains separate.
   * @zh element - 有效宿主；其内置组件独立存在。
   * @ja element - 有効なホスト。内蔵コンポーネントは別に存在します。
   * @ko element - 유효한 호스트이며 내장 구성 요소와 별개입니다.
   */
  constructor(element: Element) {
    if (!(element instanceof Element)) {
      throw new TypeError('Expected an Element');
    }
    handles.set(this, native.createElementScroll(element.handle));
  }

  /**
   * Destroy an owned native component and detach its widget listeners.
   *
   * @zh 销毁独立持有的原生组件并解绑控件监听器。
   * @ja 所有するコンポーネントを破棄し、リスナーを解除します。
   * @ko 소유 구성 요소를 파괴하고 위젯 리스너를 해제합니다.
   * @remarks
   * Borrowed components reject release. Native non-DOM scrollbar children
   * remain owned by the host, matching the upstream destructor.
   * @zh 借用组件禁止释放。非 DOM 滚动条子元素继续由宿主持有，与原生析构一致。
   * @ja 借用ビューは解放できません。非 DOM 子要素は元のデストラクター同様に残ります。
   * @ko 빌린 뷰는 해제할 수 없습니다. 비 DOM 자식은 원래 소멸자처럼 호스트에 남습니다.
   */
  release(): void {
    native.releaseElementScroll(handle(this));
  }

  /**
   * Run Rml::ElementScroll::Update.
   *
   * @zh 调用 Rml::ElementScroll::Update。
   * @ja Rml::ElementScroll::Update を呼びます。
   * @ko Rml::ElementScroll::Update를 호출합니다.
   */
  update(): void {
    native.scrollUpdate(handle(this));
  }

  /**
   * Enable and size a native scrollbar.
   *
   * @zh 启用原生滚动条并计算尺寸。
   * @ja ネイティブスクロールバーを有効化しサイズを計算します。
   * @ko 네이티브 스크롤바를 활성화하고 크기를 계산합니다.
   * @param orientation - Native scrollbar direction.
   * @zh orientation - 原生滚动条方向。
   * @ja orientation - ネイティブの方向。
   * @ko orientation - 네이티브 방향입니다.
   * @param elementWidth - Finite nonnegative host width for percentages.
   * @zh elementWidth - 用于解析百分比的有限非负宿主宽度。
   * @ja elementWidth - 百分率解決用の有限で非負のホスト幅。
   * @ko elementWidth - 백분율 해석을 위한 유한한 0 이상 호스트 너비입니다.
   */
  enableScrollbar(
    orientation: ScrollOrientation, elementWidth: number,
  ): void {
    native.scrollEnableScrollbar(handle(this), orientation, elementWidth);
  }

  /**
   * Disable and hide a native scrollbar.
   *
   * @zh 禁用并隐藏原生滚动条。
   * @ja ネイティブスクロールバーを無効化し非表示にします。
   * @ko 네이티브 스크롤바를 비활성화하고 숨깁니다.
   * @param orientation - Native scrollbar direction.
   * @zh orientation - 原生滚动条方向。
   * @ja orientation - ネイティブの方向。
   * @ko orientation - 네이티브 방향입니다.
   */
  disableScrollbar(orientation: ScrollOrientation): void {
    native.scrollDisableScrollbar(handle(this), orientation);
  }

  /**
   * Synchronize the scrollbar position from native scrolling state.
   *
   * @zh 根据原生滚动状态同步滚动条位置。
   * @ja ネイティブスクロール状態からバー位置を同期します。
   * @ko 네이티브 스크롤 상태에서 바 위치를 동기화합니다.
   * @param orientation - Native scrollbar direction.
   * @zh orientation - 原生滚动条方向。
   * @ja orientation - ネイティブの方向。
   * @ko orientation - 네이티브 방향입니다.
   */
  updateScrollbar(orientation: ScrollOrientation): void {
    native.scrollUpdateScrollbar(handle(this), orientation);
  }

  /**
   * Get the live scrollbar element for the requested orientation.
   *
   * @zh 获取指定方向的实时滚动条元素。
   * @ja 指定方向の実体スクロールバー要素を取得します。
   * @ko 지정한 방향의 실시간 스크롤바 요소를 가져옵니다.
   * @param orientation - Native scrollbar direction.
   * @zh orientation - 原生滚动条方向。
   * @ja orientation - ネイティブの方向。
   * @ko orientation - 네이티브 방향입니다.
   * @returns Live element or null if it has never been created.
   * @zh 实时元素；尚未创建时返回 null。
   * @ja ライブ要素。未作成なら null。
   * @ko 실시간 요소이며 생성되지 않았으면 null입니다.
   */
  getScrollbar(orientation: ScrollOrientation): Element | null {
    const result = native.scrollGetScrollbar(handle(this), orientation);
    return result === null ? null : Element.wrap(result);
  }

  /**
   * Read native width for vertical or height for horizontal scrollbars.
   *
   * @zh 读取垂直条原生宽度或水平条原生高度。
   * @ja 垂直バーの幅または水平バーの高さを読みます。
   * @ko 수직 바 너비 또는 수평 바 높이를 읽습니다.
   * @param orientation - Native scrollbar direction.
   * @zh orientation - 原生滚动条方向。
   * @ja orientation - ネイティブの方向。
   * @ko orientation - 네이티브 방향입니다.
   * @returns Size in pixels, zero when disabled.
   * @zh 像素尺寸；禁用时为零。
   * @ja ピクセルサイズ。無効ならゼロ。
   * @ko 픽셀 크기이며 비활성화되면 0입니다.
   */
  getScrollbarSize(orientation: ScrollOrientation): number {
    return native.scrollGetScrollbarSize(handle(this), orientation);
  }

  /**
   * Format enabled scrollbars using Rml::ElementScroll::FormatScrollbars.
   *
   * @zh 通过 Rml::ElementScroll::FormatScrollbars 布局启用的滚动条。
   * @ja Rml::ElementScroll::FormatScrollbars で有効なバーを配置します。
   * @ko Rml::ElementScroll::FormatScrollbars로 활성 바를 배치합니다.
   */
  formatScrollbars(): void {
    native.scrollFormatScrollbars(handle(this));
  }

  /**
   * Update scrollbar properties using Rml::ElementScroll::UpdateProperties.
   *
   * @zh 通过 Rml::ElementScroll::UpdateProperties 更新滚动条属性。
   * @ja Rml::ElementScroll::UpdateProperties でバーの属性を更新します。
   * @ko Rml::ElementScroll::UpdateProperties로 바 속성을 갱신합니다.
   */
  updateProperties(): void {
    native.scrollUpdateProperties(handle(this));
  }
}

/**
 * Canonical wrapper for an element-owned scroll component.
 *
 * @internal
 * @param token - Checked element token.
 * @returns Component wrapper.
 */
export function elementScrollFromNative(
  token: ElementNativeHandle,
): ElementScroll {
  let result = wrappers.get(token);
  if (!result) {
    result = Object.create(ElementScroll.prototype) as ElementScroll;
    handles.set(result, token);
    wrappers.set(token, result);
  }
  return result;
}
