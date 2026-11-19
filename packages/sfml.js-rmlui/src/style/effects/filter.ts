import { native } from '../../internal/native';
import { Element } from '../../dom/elements/element';
import type { VariantVector2 } from '../../values/types';
import {
  compiledFilterFromNative, compiledFilterHandle, type CompiledFilter,
} from '../../rendering/compiled-resources';

const filters = new WeakMap<Filter, object>();

/**
 * Corner representation of the Rml::Rectanglef ink overflow.
 *
 * @zh Rml::Rectanglef 墨迹溢出区域的角点表示。
 * @ja インクのはみ出し領域 Rml::Rectanglef の角による表現。
 * @ko 잉크 넘침 영역 Rml::Rectanglef의 모서리 표현입니다.
 */
export interface FilterOverflow {
  /**
   * Minimum corner; Rml::Rectanglef::p0.
   *
   * @zh 最小角点，对应 Rml::Rectanglef::p0。
   * @ja 最小の角。Rml::Rectanglef::p0。
   * @ko 최소 모서리인 Rml::Rectanglef::p0입니다.
   */
  p0: { -readonly [Key in keyof VariantVector2]: VariantVector2[Key] };

  /**
   * Maximum corner; Rml::Rectanglef::p1.
   *
   * @zh 最大角点，对应 Rml::Rectanglef::p1。
   * @ja 最大の角。Rml::Rectanglef::p1。
   * @ko 최대 모서리인 Rml::Rectanglef::p1입니다.
   */
  p1: { -readonly [Key in keyof VariantVector2]: VariantVector2[Key] };
}

/**
 * Synchronous implementations of Rml::Filter virtual functions.
 *
 * @zh Rml::Filter 虚函数的同步实现。
 * @ja Rml::Filter 仮想関数の同期実装。
 * @ko Rml::Filter 가상 함수의 동기 구현입니다.
 */
export interface FilterCallbacks {
  /**
   * Compile a unique filter through the element's render manager.
   *
   * @zh 通过元素的渲染管理器编译唯一滤镜。
   * @ja 要素の描画管理器で一意のフィルターをコンパイルします。
   * @ko 요소의 렌더 관리자로 고유 필터를 컴파일합니다.
   * @param element - Element receiving the filter.
   * @zh element - 应用滤镜的元素。
   * @ja element - フィルターの適用先要素。
   * @ko element - 필터가 적용되는 요소입니다.
   * @returns Resource whose ownership transfers to RmlUi exactly once.
   * Return a new empty CompiledFilter to report compilation failure.
   * @zh 所有权仅转移一次给 RmlUi 的资源。返回新建的空 CompiledFilter 表示失败。
   * @ja 所有権を RmlUi に一度だけ渡すリソース。失敗時は新しい空リソースを返します。
   * @ko 소유권을 RmlUi에 한 번만 이전할 리소스이며 실패 시 새 빈 리소스를 반환합니다.
   */
  compileFilter(element: Element): CompiledFilter;

  /**
   * Extend a copied clipping rectangle; omitted callbacks leave it intact.
   *
   * @zh 扩展裁剪矩形副本；省略此回调时保持原值。
   * @ja クリップ矩形のコピーを拡張します。省略時は変更しません。
   * @ko 클리핑 사각형 복사본을 확장하며 생략하면 변경하지 않습니다.
   * @param element - Element receiving the filter.
   * @zh element - 应用滤镜的元素。
   * @ja element - フィルターの適用先要素。
   * @ko element - 필터가 적용되는 요소입니다.
   * @param overflow - Mutable copy of the current ink overflow.
   * @zh overflow - 当前墨迹溢出区域的可变副本。
   * @ja overflow - 現在のインク範囲の変更可能なコピー。
   * @ko overflow - 현재 잉크 범위의 변경 가능한 복사본입니다.
   * @returns Finite rectangle applied to the native reference.
   * @zh 应用于原生引用的有限数值矩形。
   * @ja ネイティブ参照に適用する有限値の矩形。
   * @ko 네이티브 참조에 적용할 유한값 사각형입니다.
   */
  extendInkOverflow?(
    element: Element, overflow: FilterOverflow,
  ): FilterOverflow;
}

/**
 * Owned Rml::Filter with native or synchronous JavaScript virtual methods.
 *
 * @zh 具有原生或同步 JavaScript 虚函数的自有 Rml::Filter。
 * @ja ネイティブまたは同期 JavaScript 仮想関数を持つ所有 Rml::Filter。
 * @ko 네이티브 또는 동기 JavaScript 가상 함수를 가진 소유 Rml::Filter입니다.
 * @remarks
 * Instances retain native filter parameters independently of their input
 * dictionary and instancer wrapper. Shutdown invalidates every instance.
 * @zh 实例独立于输入字典和实例器包装器保留原生滤镜参数。关闭运行时使所有实例失效。
 * @ja 入力辞書やインスタンサーのラッパーとは独立してパラメーターを保持します。
 * 終了時にすべてのインスタンスが無効になります。
 * @ko 입력 사전이나 인스턴서 래퍼와 독립적으로 매개변수를 유지합니다.
 * 종료하면 모든 인스턴스가 무효화됩니다.
 */
export class Filter {
  /** @internal */
  private declare readonly filterBrand: void;

  /**
   * Create a custom native filter with synchronous virtual callbacks.
   *
   * @zh 使用同步虚函数回调创建自定义原生滤镜。
   * @ja 同期仮想コールバックでカスタムネイティブフィルターを作成します。
   * @ko 동기 가상 콜백으로 사용자 정의 네이티브 필터를 생성합니다.
   * @param callbacks - Required compilation and optional ink overflow.
   * @zh callbacks - 必需的编译回调与可选的墨迹溢出回调。
   * @ja callbacks - 必須のコンパイルと任意のインク範囲コールバック。
   * @ko callbacks - 필수 컴파일 및 선택적 잉크 범위 콜백입니다.
   * @remarks
   * Callbacks may compile resources and inspect supported values. DOM/style
   * mutation and recursive rendering are rejected during native traversal.
   * @zh 回调可编译资源和读取受支持的值；原生遍历期间拒绝 DOM/样式修改和递归渲染。
   * @ja リソースのコンパイルと対応値の参照が可能です。DOM やスタイルの変更と
   * 再帰描画はネイティブ走査中に拒否されます。
   * @ko 리소스 컴파일과 지원 값 조회가 가능하며 네이티브 순회 중
   * DOM/스타일 변경과 재귀 렌더링은 거부합니다.
   */
  constructor(callbacks: FilterCallbacks) {
    const compile = callbacks?.compileFilter;
    const overflow = callbacks?.extendInkOverflow;
    if (typeof compile !== 'function') {
      throw new TypeError('Expected a compileFilter callback');
    }
    if (overflow !== undefined && typeof overflow !== 'function') {
      throw new TypeError('Expected an extendInkOverflow callback');
    }
    filters.set(this, native.createFilter(
      element => compiledFilterHandle(compile(Element.wrap(element))),
      overflow === undefined ? undefined :
        (element, value) => overflow(Element.wrap(element), value)));
  }

  /**
   * Invoke the native virtual Rml::Filter::CompileFilter.
   *
   * @zh 调用原生虚函数 Rml::Filter::CompileFilter。
   * @ja ネイティブ仮想関数 Rml::Filter::CompileFilter を呼びます。
   * @ko 네이티브 가상 함수 Rml::Filter::CompileFilter를 호출합니다.
   * @param element - Live element with a render manager.
   * @zh element - 具有渲染管理器的存活元素。
   * @ja element - 描画管理器を持つ有効な要素。
   * @ko element - 렌더 관리자가 있는 유효한 요소입니다.
   * @returns Unique resource; isValid indicates native compilation success.
   * @zh 唯一资源，isValid 表示原生编译是否成功。
   * @ja 一意のリソース。isValid はネイティブコンパイルの成否を示します。
   * @ko 고유 리소스이며 isValid는 네이티브 컴파일 성공 여부입니다.
   */
  compileFilter(element: Element): CompiledFilter {
    return compiledFilterFromNative(native.filterCompileFilter(
      filterHandle(this), element.handle));
  }

  /**
   * Invoke the native virtual Rml::Filter::ExtendInkOverflow.
   *
   * @zh 调用原生虚函数 Rml::Filter::ExtendInkOverflow。
   * @ja ネイティブ仮想関数 Rml::Filter::ExtendInkOverflow を呼びます。
   * @ko 네이티브 가상 함수 Rml::Filter::ExtendInkOverflow를 호출합니다.
   * @param element - Live element used to resolve relative lengths.
   * @zh element - 用于解析相对长度的存活元素。
   * @ja element - 相対長の解決に使う有効な要素。
   * @ko element - 상대 길이를 해석하는 유효한 요소입니다.
   * @param overflow - Finite float corners; input is not modified.
   * @zh overflow - 有限浮点角点，输入不会被修改。
   * @ja overflow - 有限浮動小数点の角。入力は変更しません。
   * @ko overflow - 유한 부동 소수점 모서리이며 입력을 변경하지 않습니다.
   * @returns Copied extended rectangle; unaffected filters return a copy.
   * @zh 扩展后的矩形副本；不扩展区域的滤镜返回原值副本。
   * @ja 拡張後の矩形コピー。拡張しないフィルターもコピーを返します。
   * @ko 확장된 사각형 복사본이며 확장하지 않는 필터도 복사본을 반환합니다.
   */
  extendInkOverflow(
    element: Element, overflow: FilterOverflow,
  ): FilterOverflow {
    return native.filterExtendInkOverflow(
      filterHandle(this), element.handle, overflow);
  }
}

/**
 * Resolve an owned native filter.
 *
 * @internal
 * @param value - Public filter.
 * @returns Checked native token.
 */
export function filterHandle(value: Filter): object {
  const handle = filters.get(value);
  if (!handle) {
    throw new TypeError('Expected an owned filter');
  }
  return handle;
}

/**
 * Wrap a native filter owner.
 *
 * @internal
 * @param handle - Native token.
 * @returns Public filter.
 */
export function filterFromNative(handle: object): Filter {
  const result = Object.create(Filter.prototype) as Filter;
  filters.set(result, handle);
  return result;
}
