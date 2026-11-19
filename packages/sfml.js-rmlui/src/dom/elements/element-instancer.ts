import { native } from '../../internal/native';
import {
  variantFromNative, variantToNative,
} from '../../internal/animation-values';
import { Element } from './element';
import type { AttributeValue } from '../documents/attributes';

const handles = new WeakMap<ElementInstancer, object>();
const wrappers = new WeakMap<object, ElementInstancer>();

/**
 * Owned attribute snapshot captured before native element destruction.
 *
 * @zh 原生元素销毁前捕获的自有属性快照。
 * @ja ネイティブ要素の破棄前に記録する所有の属性スナップショット。
 * @ko 네이티브 요소 파괴 전에 기록한 소유 속성 스냅샷입니다.
 */
export interface ElementReleaseSnapshot {
  /**
   * Original native tag name.
   *
   * @zh 原生标签名。
   * @ja 元のネイティブタグ名。
   * @ko 원래 네이티브 태그 이름입니다.
   */
  tagName: string;

  /**
   * Copied attributes, independent of the element being released.
   *
   * @zh 属性副本，与正在释放的元素相互独立。
   * @ja 破棄する要素から独立した属性のコピー。
   * @ko 해제할 요소와 독립된 속성 복사본입니다.
   */
  attributes: Record<string, AttributeValue>;
}

/**
 * Allocate a detached native element through another typed instancer.
 *
 * @zh 通过另一有类型的实例器分配游离原生元素。
 * @ja 別の型付き生成器で切り離したネイティブ要素を作ります。
 * @ko 다른 타입 생성기로 분리 네이티브 요소를 생성합니다.
 */
export interface ElementInstanceCallback {
  /**
   * Allocate an owned native element.
   *
   * @zh 分配自有原生元素。
   * @ja 所有するネイティブ要素を作ります。
   * @ko 소유 네이티브 요소를 생성합니다.
   * @param parent - Proposed native parent, or null for a root.
   * @zh parent - 预期原生父节点；根节点为 null。
   * @ja parent - 予定のネイティブ親。ルートは null。
   * @ko parent - 예정 네이티브 부모이며 루트는 null입니다.
   * @param tag - Actual native tag, independent of the registration name.
   * @zh tag - 实际原生标签，与注册名相互独立。
   * @ja tag - 登録名から独立した実際のネイティブタグ。
   * @ko tag - 등록 이름과 독립된 실제 네이티브 태그입니다.
   * @param attributes - Independent copy of the allocation attributes.
   * @zh attributes - 分配属性的独立副本。
   * @ja attributes - 生成属性の独立したコピー。
   * @ko attributes - 생성 속성의 독립된 복사본입니다.
   * @returns Newly allocated detached element, or null on allocation failure.
   * @zh 新分配的游离元素；分配失败时为 null。
   * @ja 新しい切り離した要素。生成失敗時は null。
   * @ko 새로 생성한 분리 요소이며 생성 실패 시 null입니다.
   */
  (
    parent: Element | null, tag: string,
    attributes: Record<string, AttributeValue>,
  ): Element | null;
}

/**
 * Observe an independent pre-destruction snapshot at a safe native boundary.
 *
 * @zh 在原生安全边界观察销毁前的独立快照。
 * @ja 安全なネイティブ境界で破棄前の独立したコピーを受け取ります。
 * @ko 안전한 네이티브 경계에서 파괴 전 독립 복사본을 받습니다.
 */
export interface ElementReleaseCallback {
  /**
   * Observe a completed native release.
   *
   * @zh 观察已完成的原生释放。
   * @ja 完了したネイティブ解放を受け取ります。
   * @ko 완료한 네이티브 해제를 관찰합니다.
   * @param snapshot - Copied native tag and attributes.
   * @zh snapshot - 原生标签和属性的副本。
   * @ja snapshot - ネイティブタグと属性のコピー。
   * @ko snapshot - 네이티브 태그와 속성 복사본입니다.
   */
  (snapshot: ElementReleaseSnapshot): void;
}

/**
 * Checked native allocation/release customization for Rml::ElementInstancer.
 *
 * @zh Rml::ElementInstancer 的受检原生分配和释放定制。
 * @ja Rml::ElementInstancer の検証付きネイティブ生成・解放カスタマイズ。
 * @ko Rml::ElementInstancer의 검사된 네이티브 생성 및 해제 사용자 정의입니다.
 * @remarks
 * Return a detached element allocated by a concrete Element constructor,
 * another ElementInstancer's instanceElement method, or null. Provenance stays
 * through nested instancers, cloning and registry replacement.
 * Factory applies attributes and plugin notifications after allocation;
 * direct instanceElement calls follow the selected instancer's behavior.
 * Callbacks may instance through other instancers and inspect copied values.
 * DOM mutation, registration changes and recursive calls are rejected.
 * Registered instancers remain alive through shutdown. Unregistered instances
 * follow native trees or visible detached ownership edges, allowing GC cycles.
 * Native destruction is synchronous. Release observers receive a snapshot at
 * the next safe boundary, after destruction, including when GC runs inside an
 * instancing callback. Collected observers and environment cleanup do not
 * invoke JS. Shutdown invalidates all instances.
 * @zh 返回由具体 Element 构造函数或其他 ElementInstancer 的 instanceElement
 * 分配的游离元素，或 null。
 * 嵌套实例器、克隆和注册替换均保留原生分配器。Factory 在分配后应用属性并通知插件；
 * 直接 instanceElement 遵循选定实例器的行为。回调可通过其他实例器分配并检查值副本；
 * 禁止 DOM 变更、注册变更和递归调用。已注册实例器保活至关闭。
 * 未注册实例器通过原生树或游离持有者的可见引用保活，允许循环垃圾回收。
 * 原生同步销毁；释放观察回调在随后安全边界接收销毁前的快照，包括实例化回调中发生 GC 时。
 * 已被回收的回调和环境清理不调用 JS。关闭使全部实例失效。
 * @ja 具体的な Element コンストラクターまたは別の ElementInstancer の
 * instanceElement で生成した切り離した要素、
 * または null を返します。入れ子・複製・登録置換でも元の生成器を保持します。
 * Factory は生成後に属性とプラグイン通知を適用し、直接呼出しは生成器に従います。
 * 他の生成器と値コピーを使えます。DOM・登録変更と再帰は拒否します。
 * 登録済み生成器は終了まで保持し、未登録は木の所有に従い循環 GC を許可します。
 * ネイティブが同期で破棄し、その後の安全な境界で破棄前のコピーを通知します。
 * 生成コールバック中の GC でも同様です。回収済みコールバックと環境終了では
 * JS を呼びません。終了で全インスタンスが無効になります。
 * @ko 구체 Element 생성자 또는 다른 ElementInstancer의 instanceElement로 생성한
 * 분리 요소 또는 null을
 * 반환합니다. 중첩, 복제, 등록 교체에서도 원래 생성기를 유지합니다.
 * Factory는 생성 후 속성과 플러그인 알림을 적용하며 직접 호출은 생성기를 따릅니다.
 * 다른 생성기와 값 복사본을 사용할 수 있습니다. DOM 및 등록 변경과 재귀는 거부합니다.
 * 등록한 생성기는 종료까지 유지하고 미등록 생성기는 트리 소유에 따라 순환 GC를
 * 허용합니다. 네이티브는 동기 파괴하며 이후 안전한 경계에서 파괴 전 복사본을 알립니다.
 * 생성 콜백 내부의 GC에도 적용합니다. 회수한 관찰자와 환경 정리에서는 JS를 호출하지
 * 않습니다. 종료하면 모든 인스턴스가 무효화됩니다.
 */
export class ElementInstancer {
  /**
   * Create a native instancer with allocation and optional release observers.
   *
   * @zh 创建原生实例器，设置分配及可选释放观察回调。
   * @ja 生成と任意の解放通知を持つネイティブ生成器を作ります。
   * @ko 생성과 선택적 해제 관찰자를 가진 네이티브 생성기를 만듭니다.
   * @param create - Return a newly allocated detached native element or null.
   * @zh create - 返回新分配的游离原生元素或 null。
   * @ja create - 新しい切り離したネイティブ要素、または null を返します。
   * @ko create - 새로 생성한 분리 네이티브 요소 또는 null을 반환합니다.
   * @param release - Observe the pre-destruction snapshot at a safe boundary.
   * @zh release - 在安全边界观察销毁前的快照。
   * @ja release - 安全な境界で破棄前のコピーを受け取ります。
   * @ko release - 안전한 경계에서 파괴 전 복사본을 받습니다.
   */
  constructor(
    create: ElementInstanceCallback, release?: ElementReleaseCallback,
  ) {
    if (typeof create !== 'function' ||
        (release !== undefined && typeof release !== 'function')) {
      throw new TypeError('Expected element instancer callbacks');
    }
    const handle = native.createElementInstancer((parent, tag, attributes) => {
      const element = create(parent === null ? null : Element.wrap(parent),
        tag, convertAttributes(attributes));
      return element === null ? null
        : element instanceof Element ? element.handle : element;
    }, release === undefined ? undefined : snapshot => {
      release({ ...snapshot,
        attributes: convertAttributes(snapshot.attributes) });
    });
    handles.set(this, handle);
    wrappers.set(handle, this);
  }

  /**
   * Invoke this native instancer without inserting the returned element.
   *
   * @zh 调用原生实例器，不插入返回的元素。
   * @ja ネイティブ生成器を呼び、返す要素を追加しません。
   * @ko 네이티브 생성기를 호출하며 반환한 요소를 삽입하지 않습니다.
   * @param parent - Proposed parent or null, supplied to the native instancer.
   * @zh parent - 传给原生实例器的预期父节点，或 null。
   * @ja parent - ネイティブ生成器に渡す予定の親、または null。
   * @ko parent - 네이티브 생성기에 전달할 예정 부모 또는 null입니다.
   * @param tag - Native tag for the new element.
   * @zh tag - 新元素的原生标签。
   * @ja tag - 新しい要素のネイティブタグ。
   * @ko tag - 새 요소의 네이티브 태그입니다.
   * @param attributes - Snapshot supplied to the allocator, without setters.
   * @zh attributes - 传给分配器的属性快照，不自动调用属性设置器。
   * @ja attributes - 生成器に渡す属性コピー。属性設定は自動実行しません。
   * @ko attributes - 생성기에 전달할 속성 복사본이며 자동 설정하지 않습니다.
   * @returns Owned detached element or null.
   * @zh 自有游离元素或 null。
   * @ja 所有する切り離した要素、または null。
   * @ko 소유 분리 요소 또는 null입니다.
   */
  instanceElement(
    parent: Element | null, tag: string,
    attributes: Record<string, AttributeValue> = {},
  ): Element | null {
    const values = Object.fromEntries(Object.entries(attributes)
      .map(([ name, value ]) => [ name, variantToNative(value) ]));
    const handle = native.elementInstancerInstanceElement(
      elementInstancerHandle(this),
      parent === null ? null : parent.handle, tag, values);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Release a detached owned element allocated by this exact instancer.
   *
   * @zh 释放由此确切实例器分配的自有游离元素。
   * @ja この生成器で生成した所有の切り離した要素を解放します。
   * @ko 이 생성기로 생성한 소유 분리 요소를 해제합니다.
   * @param element - Owned element; borrowed, attached and active nodes fail.
   * @zh element - 自有元素；拒绝借用、已挂接及正在调用的节点。
   * @ja element - 所有要素。借用・追加済み・実行中の要素は拒否します。
   * @ko element - 소유 요소이며 빌린 요소, 연결 및 호출 중 노드는 거부합니다.
   */
  releaseElement(element: Element): void {
    native.elementInstancerReleaseElement(
      elementInstancerHandle(this), element.handle);
  }
}

/**
 * Restore independently copied native attributes.
 *
 * @internal
 * @param attributes - Native Variant snapshots.
 * @returns Public owned attribute values.
 */
function convertAttributes(
  attributes: Record<string, unknown>,
): Record<string, AttributeValue> {
  return Object.fromEntries(Object.entries(attributes)
    .map(([ name, value ]) => [ name, variantFromNative(value) ]));
}

/**
 * Resolve a typed instancer facade.
 *
 * @internal
 * @param value - Instancer facade.
 * @returns Checked native handle.
 */
export function elementInstancerHandle(value: ElementInstancer): object {
  const handle = handles.get(value);
  if (!handle) {
    throw new TypeError('Expected an ElementInstancer');
  }
  return handle;
}

/**
 * Restore canonical instancer identity.
 *
 * @internal
 * @param handle - Native instancer handle.
 * @returns Typed instancer facade.
 */
export function elementInstancerFromNative(handle: object): ElementInstancer {
  const existing = wrappers.get(handle);
  if (existing) {
    return existing;
  }
  const value = Object.create(ElementInstancer.prototype) as ElementInstancer;
  handles.set(value, handle);
  wrappers.set(handle, value);
  return value;
}
