import { native } from '../../internal/native';
import { computedValues, computedHandle } from '../../internal/computed';
import { ComputedFields } from '../../generated/computed-fields';
import type { ComputedValuesView } from '../../generated/computed-values-view';
import type { Element } from '../../dom/elements/element';

export type { FontFaceHandle } from '../../internal/computed';
export type { ComputedValuesView } from '../../generated/computed-values-view';

/**
 * Owned Rml::ComputedValues storage associated with a live element.
 *
 * @zh 关联存活元素的独立 Rml::ComputedValues 存储。
 * @ja 有効な要素に関連付けられた所有 Rml::ComputedValues ストレージ。
 * @ko 유효한 요소와 연결된 소유 Rml::ComputedValues 저장소입니다.
 * @remarks
 * The constructor uses upstream defaults, not the element's current values.
 * CopyInherited and CopyNonInherited copy their native field groups without
 * replacing the associated element. Local-property getters (fontFamily, cursor,
 * animation, transition, transform and flex keywords) read that element.
 * Assignments change this owned value only. All access rejects after element
 * destruction or runtime shutdown. Element.getComputedValues returns a live
 * read-only view instead; refresh layout with Context.update before inspecting.
 * @zh 构造器使用上游默认值；copyInherited/copyNonInherited 复制原生字段分组，
 * 不替换关联元素。fontFamily、cursor、animation、transition、transform 和 flex
 * 关键字等 getter 读取关联元素。赋值只修改独立对象。元素销毁或运行时关闭后
 * 全部访问失效。Element.getComputedValues 返回实时只读视图；查询前调用
 * Context.update 更新布局。
 * @ja 構築時は既定値を使います。コピー操作は関連要素を変更せずフィールド群を
 * コピーします。ローカルプロパティの取得は関連要素を読みます。代入は所有値のみ
 * 変更します。要素の破棄やランタイム終了後は無効です。要素からは読み取り専用
 * ビューを取得します。取得前に Context.update でレイアウトを更新してください。
 * @ko 생성자는 기본값을 사용합니다. 복사 작업은 연결 요소를 바꾸지 않고 필드 그룹을
 * 복사합니다. 로컬 속성 조회는 연결 요소를 읽고 대입은 소유 값만 변경합니다.
 * 요소 파괴나 런타임 종료 후에는 무효입니다. 요소 조회는 읽기 전용 뷰를 반환합니다.
 * 조회 전에 Context.update로 레이아웃을 갱신하세요.
 */
export class ComputedValues extends ComputedFields {
  /**
   * Construct native ComputedValues(element) with upstream defaults.
   *
   * @zh 以默认值构造原生 ComputedValues(element)。
   * @ja 既定値でネイティブ ComputedValues(element) を構築します。
   * @ko 기본값으로 네이티브 ComputedValues(element)를 생성합니다.
   * @param element - Live element used by local-property getters.
   * @zh element - 局部属性 getter 使用的存活元素。
   * @ja element - ローカルプロパティ取得に使う有効な要素。
   * @ko element - 로컬 속성 조회에 사용하는 유효한 요소입니다.
   */
  constructor(element: Element) {
    super();
    computedValues.set(this, native.createComputedValues(element.handle));
  }

  /**
   * Rml::ComputedValues::CopyInherited, preserving the associated element.
   *
   * @zh Rml::ComputedValues::CopyInherited，保留关联元素。
   * @ja 関連要素を維持する Rml::ComputedValues::CopyInherited。
   * @ko 연결 요소를 유지하는 Rml::ComputedValues::CopyInherited입니다.
   * @param source - Owned values or a live element view.
   * @zh source - 独立对象或实时元素视图。
   * @ja source - 所有値またはライブ要素ビュー。
   * @ko source - 소유 값 또는 실시간 요소 뷰입니다.
   */
  copyInherited(source: ComputedValuesView): void {
    native.computedCopyInherited(computedHandle(this), computedHandle(source));
  }

  /**
   * Rml::ComputedValues::CopyNonInherited, preserving the associated element.
   *
   * @zh Rml::ComputedValues::CopyNonInherited，保留关联元素。
   * @ja 関連要素を維持する Rml::ComputedValues::CopyNonInherited。
   * @ko 연결 요소를 유지하는 Rml::ComputedValues::CopyNonInherited입니다.
   * @param source - Owned values or a live element view.
   * @zh source - 独立对象或实时元素视图。
   * @ja source - 所有値またはライブ要素ビュー。
   * @ko source - 소유 값 또는 실시간 요소 뷰입니다.
   */
  copyNonInherited(source: ComputedValuesView): void {
    native.computedCopyNonInherited(
      computedHandle(this), computedHandle(source));
  }

  /**
   * Native write-only has_letter_spacing flag used by letterSpacing.
   *
   * @zh letterSpacing 使用的原生只写 has_letter_spacing 标志。
   * @ja letterSpacing で使うネイティブ書き込み専用 has_letter_spacing フラグ。
   * @ko letterSpacing이 사용하는 네이티브 쓰기 전용 has_letter_spacing 플래그입니다.
   * @param value - Whether to resolve spacing from the associated element.
   * @zh value - 是否从关联元素解析字间距。
   * @ja value - 関連要素から字間を解決するか。
   * @ko value - 연결 요소에서 자간을 계산할지 여부입니다.
   */
  setHasLetterSpacing(value: boolean): void {
    native.computedSetHasLetterSpacing(computedHandle(this), value);
  }
}

/**
 * Wrap a const element-owned computed value.
 *
 * @internal
 * @param handle - Native observer handle.
 * @returns Read-only live view.
 */
export function computedViewFromNative(handle: object): ComputedValuesView {
  const view = Object.create(ComputedValues.prototype) as ComputedValues;
  computedValues.set(view, handle);
  return view;
}
