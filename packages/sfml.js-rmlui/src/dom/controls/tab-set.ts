import { Element } from '../elements/element';
import { native } from '../../internal/native';
import { elementConstructors } from '../../internal/element-factory';

/**
 * Checked wrapper for Rml::ElementTabSet.
 *
 * @zh 带类型检查的 Rml::ElementTabSet 包装器。
 * @ja 検証付き Rml::ElementTabSet ラッパー。
 * @ko 검증된 Rml::ElementTabSet 래퍼입니다.
 */
export class ElementTabSet extends Element {
  /**
   * Set a tab title through either Rml::ElementTabSet::SetTab overload.
   *
   * @zh 通过 Rml::ElementTabSet::SetTab 的任一重载设置标签标题。
   * @ja Rml::ElementTabSet::SetTab の両オーバーロードで見出しを設定します。
   * @ko Rml::ElementTabSet::SetTab의 두 오버로드로 탭 제목을 설정합니다.
   * @param tabIndex - Int32 index; replaces existing title, otherwise appends.
   * @zh tabIndex - int32 索引，存在时替换，否则追加。
   * @ja tabIndex - int32 添字。既存なら置換、それ以外は末尾に追加。
   * @ko tabIndex - int32 인덱스이며 존재하면 교체하고 아니면 끝에 추가합니다.
   * @param content - RML or detached element transferred into the tab set.
   * @zh content - RML 或转移所有权到标签组的脱离元素。
   * @ja content - RML または所有権を移す未接続要素。
   * @ko content - RML 또는 소유권을 탭 집합으로 이전할 분리 요소입니다.
   * @remarks
   * Replaced elements are destroyed. Existing attached elements must first be
   * removed from their parent. Native setters do not fill missing index gaps.
   * @zh 被替换的元素会销毁。已连接的元素必须先从父节点移除。
   * 原生设置方法不会填充索引间隙。
   * @ja 置換された要素は破棄されます。接続中の要素は先に親から外してください。
   * ネイティブ設定関数は添字の空きを埋めません。
   * @ko 교체된 요소는 파괴됩니다. 연결된 요소는 먼저 부모에서 제거해야 합니다.
   * 네이티브 설정 메서드는 인덱스 사이의 빈칸을 채우지 않습니다.
   */
  setTab(tabIndex: number, content: string | Element): void {
    if (typeof content === 'string') {
      native.setTabRml(this.handle, tabIndex, content);
    } else if (content instanceof Element) {
      native.setTabElement(this.handle, tabIndex, content.handle);
    } else {
      throw new TypeError('Expected RML or an Element');
    }
  }

  /**
   * Set a tab body through either Rml::ElementTabSet::SetPanel overload.
   *
   * @zh 通过 Rml::ElementTabSet::SetPanel 的任一重载设置标签内容。
   * @ja Rml::ElementTabSet::SetPanel の両オーバーロードで本文を設定します。
   * @ko Rml::ElementTabSet::SetPanel의 두 오버로드로 탭 본문을 설정합니다.
   * @param tabIndex - Int32 index; replaces existing body, otherwise appends.
   * @zh tabIndex - int32 索引，存在时替换，否则追加。
   * @ja tabIndex - int32 添字。既存なら置換、それ以外は末尾に追加。
   * @ko tabIndex - int32 인덱스이며 존재하면 교체하고 아니면 끝에 추가합니다.
   * @param content - RML or detached owned element; destroys replaced body.
   * @zh content - RML 或持有所有权的脱离元素，替换会销毁旧内容节点。
   * @ja content - RML または所有権付き未接続要素。古い本文は破棄されます。
   * @ko content - RML 또는 소유권이 있는 분리 요소이며 이전 본문은 파괴됩니다.
   */
  setPanel(tabIndex: number, content: string | Element): void {
    if (typeof content === 'string') {
      native.setPanelRml(this.handle, tabIndex, content);
    } else if (content instanceof Element) {
      native.setPanelElement(this.handle, tabIndex, content.handle);
    } else {
      throw new TypeError('Expected RML or an Element');
    }
  }

  /**
   * Remove title and body through Rml::ElementTabSet::RemoveTab.
   *
   * @zh 通过 Rml::ElementTabSet::RemoveTab 移除标题和内容。
   * @ja Rml::ElementTabSet::RemoveTab で見出しと本文を削除します。
   * @ko Rml::ElementTabSet::RemoveTab으로 제목과 본문을 제거합니다.
   * @param tabIndex - Int32 index; nonexistent indices remove nothing.
   * @zh tabIndex - int32 索引，不存在时不移除任何节点。
   * @ja tabIndex - int32 添字。存在しない場合は削除しません。
   * @ko tabIndex - int32 인덱스이며 존재하지 않으면 제거하지 않습니다.
   */
  removeTab(tabIndex: number): void {
    native.removeTab(this.handle, tabIndex);
  }

  /**
   * Count tab titles through Rml::ElementTabSet::GetNumTabs.
   *
   * @zh 通过 Rml::ElementTabSet::GetNumTabs 统计标签标题数量。
   * @ja Rml::ElementTabSet::GetNumTabs で見出しの数を数えます。
   * @ko Rml::ElementTabSet::GetNumTabs로 탭 제목 수를 셉니다.
   * @returns Native title count, independent of the panel count.
   * @zh 原生标题数量，与内容面板数量独立。
   * @ja 本文パネル数とは独立したネイティブ見出し数。
   * @ko 본문 패널 수와 독립적인 네이티브 제목 수입니다.
   * @remarks
   * May create the native tabs container; prohibited during event callbacks.
   * @zh 可能创建原生 tabs 容器，禁止在事件回调中调用。
   * @ja ネイティブ tabs コンテナーを作る場合があり、イベントからは呼べません。
   * @ko 네이티브 tabs 컨테이너를 만들 수 있어 이벤트 콜백에서 금지됩니다.
   */
  getNumTabs(): number {
    return native.getNumTabs(this.handle);
  }

  /**
   * Select a tab through Rml::ElementTabSet::SetActiveTab.
   *
   * @zh 通过 Rml::ElementTabSet::SetActiveTab 选择标签。
   * @ja Rml::ElementTabSet::SetActiveTab でタブを選択します。
   * @ko Rml::ElementTabSet::SetActiveTab으로 탭을 선택합니다.
   * @param tabIndex - Unclamped int32 index; changes dispatch tabchange.
   * @zh tabIndex - 不钳制的 int32 索引，变化时分发 tabchange。
   * @ja tabIndex - 制限されない int32 添字。変更時に tabchange を送出。
   * @ko tabIndex - 범위를 제한하지 않는 int32 인덱스이며 변경 시 tabchange 발생.
   */
  setActiveTab(tabIndex: number): void {
    native.setActiveTab(this.handle, tabIndex);
  }

  /**
   * Get the index of the currently active tab.
   *
   * @zh 获取当前活动标签页的索引。
   * @ja 現在の有効なタブの番号を取得します。
   * @ko 현재 활성 탭 인덱스를 가져옵니다.
   * @returns Active index, initially zero even with no titles.
   * @zh 活动索引，初始为零，即使尚无标题。
   * @ja 有効な添字。見出しがなくても初期値はゼロ。
   * @ko 활성 인덱스이며 제목이 없어도 초깃값은 0입니다.
   */
  getActiveTab(): number {
    return native.getActiveTab(this.handle);
  }
}

elementConstructors.set('ElementTabSet', ElementTabSet);
