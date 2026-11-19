import { native } from '../../internal/native';
import {
  EventListener, eventListenerHandle,
} from '../../events/event-listener';
import {
  variantToNative, variantFromNative,
} from '../../internal/animation-values';
import type {
  ElementNativeHandle,
  RmlEventListener,
  VariantValue, VariantReadValue,
  VariantVector2,
  VariantConversionDefault,
  VariantResult,
} from '../../values/types';
import type { Document } from '../documents/document';
import { Context } from '../../runtime/context';
import {
  dataModelFromNative, type DataModelConstructor,
} from '../../data/data-model';
import {
  RenderManager, renderManagerFromNative,
} from '../../rendering/render-manager';
import {
  sheetFromNative, type StyleSheet,
} from '../../style/properties/style-sheet';
import type { AttributeValue, AttributeResult } from '../documents/attributes';
import {
  elementClassName, elementConstructors,
} from '../../internal/element-factory';
import {
  eventCallback, eventHandle, type DispatchEventOptions, type RmlEvent,
} from '../../events/event';
import {
  classIdentifier, classIndex, type ClassIdentifier,
} from '../../runtime/rtti';
import { ScriptInterface } from '../../scripting/script-interface';
import { ScrollBehavior } from '../documents/document-flags';
import { elementScrollFromNative, type ElementScroll } from './element-scroll';
import {
  eventDispatcherFromNative, type EventDispatcher,
} from '../../events/event-dispatcher';
import {
  elementBackgroundBorderFromNative, type ElementBackgroundBorder,
} from './element-background-border';
import { elementStyleFromNative, type ElementStyle } from './element-style';
import {
  transformStateFromNative, transformStateHandle, type TransformState,
} from '../../style/values/transform-state';
import { Box, boxFromNative, boxHandle, type PositionedBox } from './box';
import { RenderBox, renderBoxFromNative } from '../../rendering/render-box';
import { NumericValue, numericValueHandle } from '../../values/numeric-value';
import {
  Property, propertyFromNative, propertyHandle,
} from '../../style/properties/property';
import { PropertyId } from '../../generated/property-ids';
import { Tween, tweenHandle } from '../../animation/tween';
import {
  computedViewFromNative, type ComputedValuesView, type FontFaceHandle,
} from '../../style/values/computed-values';
import {
  BoxArea, type ProjectedPoint, type ScrollIntoViewOptions,
  type StylePosition, type StyleFloat, type StyleDisplay,
} from './layout';

const wrappers = new WeakMap<ElementNativeHandle, Element>();
const checkedHandles = new WeakSet<ElementNativeHandle>();
const transformStates = new WeakMap<Element, TransformState>();

/**
 * Copied outputs of Rml::Element::GetIntrinsicDimensions.
 *
 * @zh Rml::Element::GetIntrinsicDimensions 的输出快照。
 * @ja Rml::Element::GetIntrinsicDimensions の出力コピー。
 * @ko Rml::Element::GetIntrinsicDimensions 출력 복사본입니다.
 */
export interface IntrinsicDimensions {
  /**
   * Whether native intrinsic dimensions are available.
   *
   * @zh 原生固有尺寸是否可用。
   * @ja ネイティブ固有サイズが利用可能か。
   * @ko 네이티브 고유 크기 사용 가능 여부입니다.
   */
  valid: boolean;

  /**
   * Native dimensions; initially zero if the native method leaves them unset.
   *
   * @zh 原生尺寸；若原生方法未赋值则初始为零。
   * @ja ネイティブサイズ。メソッドが設定しない場合の初期値はゼロ。
   * @ko 네이티브 크기이며 메서드가 설정하지 않을 때 초깃값은 0입니다.
   */
  dimensions: VariantVector2;

  /**
   * Native aspect ratio; zero when unspecified.
   *
   * @zh 原生宽高比；未指定时为零。
   * @ja ネイティブ縦横比。未指定はゼロ。
   * @ko 네이티브 종횡비이며 지정하지 않으면 0입니다.
   */
  ratio: number;
}

/**
 * Checked wrapper around an RmlUi-owned element.
 *
 * @zh 带有效性检查的 RmlUi 原生元素包装器。
 * @ja RmlUi が所有する要素の有効性を検証するラッパー。
 * @ko RmlUi 소유 요소의 유효성을 검사하는 래퍼입니다.
 * @remarks
 * Wrappers share native destruction detection. Operations throw after element
 * destruction or runtime shutdown. Reinitialisation cannot revive old wrappers.
 * Destruction automatically releases listeners.
 * Moving a subtree between different render interfaces is rejected because
 * native resources retain their original manager. Clone the subtree instead;
 * contexts sharing an interface can transfer nodes with identity preserved.
 * @zh 包装器共享原生销毁状态。元素销毁或运行时关闭后，操作会抛出异常；
 * 重新初始化不会恢复旧包装器。原生销毁会自动释放监听器。
 * 原生资源保留原渲染管理器，因此禁止跨渲染接口移动子树；可改用 clone。
 * 使用同一渲染接口的上下文可迁移节点并保留身份。
 * @ja ラッパーはネイティブの破棄状態を共有します。要素の破棄やランタイム終了後の
 * 操作は例外を投げ、再初期化しても復活しません。破棄時にリスナーも自動解放します。
 * リソースが元の管理器に属するため、異なる描画器間では移動せず clone を使います。
 * 同じ描画器を使うコンテキスト間は同一性を維持して移動できます。
 * @ko 래퍼는 네이티브 파괴 상태를 공유합니다. 요소 파괴나 런타임 종료 후
 * 작업은 예외를 던지며 재초기화해도 복구되지 않습니다. 리스너는 자동 해제됩니다.
 * 리소스가 원래 관리자에 속하므로 다른 렌더러 간 이동 대신 clone을 사용하세요.
 * 같은 렌더러의 컨텍스트 간에는 동일성을 유지해 이동할 수 있습니다.
 */
export class Element extends ScriptInterface {
  /**
   * Read the actual element-owned Rml::ElementStyle.
   *
   * @zh 读取真实的元素自有 Rml::ElementStyle。
   * @ja 実際の要素所有 Rml::ElementStyle を読み取ります。
   * @ko 실제 요소 소유 Rml::ElementStyle를 읽습니다.
   * @returns Canonical checked native style component.
   * @zh 身份固定且带检查的原生样式组件。
   * @ja 同一性を保持する検証付きスタイル部品。
   * @ko 동일성을 유지하는 검증된 스타일 구성 요소입니다.
   */
  getStyle(): ElementStyle {
    return elementStyleFromNative(native.elementGetStyle(this.handle));
  }

  /**
   * Read Rml::Element::GetElementBackgroundBorder as a checked component.
   *
   * @zh 将 GetElementBackgroundBorder 读取为带检查组件。
   * @ja GetElementBackgroundBorder を検証付き部品として読みます。
   * @ko GetElementBackgroundBorder를 검증된 구성 요소로 읽습니다.
   * @returns Canonical element-owned background and border component.
   * @zh 身份固定、元素持有的背景边框组件。
   * @ja 同一性を保持する要素所有の背景・境界部品。
   * @ko 동일성을 유지하는 요소 소유 배경 및 테두리 구성 요소입니다.
   */
  getElementBackgroundBorder(): ElementBackgroundBorder {
    return elementBackgroundBorderFromNative(
      native.elementGetBackgroundBorder(this.handle));
  }

  /**
   * Read Rml::Element::GetEventDispatcher as a checked component.
   *
   * @zh 将 GetEventDispatcher 读取为带检查组件。
   * @ja GetEventDispatcher を検証付き部品として読みます。
   * @ko GetEventDispatcher를 검증된 구성 요소로 읽습니다.
   * @returns Canonical element-owned native dispatcher.
   * @zh 身份固定且元素持有的原生派发器。
   * @ja 同一性を保持する要素所有のネイティブ送信器。
   * @ko 동일성을 유지하는 요소 소유 네이티브 발송기입니다.
   */
  getEventDispatcher(): EventDispatcher {
    return eventDispatcherFromNative(
      native.elementGetEventDispatcher(this.handle));
  }

  /**
   * Read Rml::Element::GetElementScroll as a checked native component.
   *
   * @zh 将 Rml::Element::GetElementScroll 读取为带检查的原生组件。
   * @ja Rml::Element::GetElementScroll を検証付きネイティブ部品として読みます。
   * @ko Rml::Element::GetElementScroll을 검증된 네이티브 구성 요소로 읽습니다.
   * @returns Element-owned scroll component with canonical wrapper identity.
   * @zh 元素持有的滚动组件，包装器身份固定。
   * @ja 要素が所有し、ラッパーの同一性を保持するスクロール部品。
   * @ko 요소 소유 스크롤 구성 요소이며 래퍼 동일성을 유지합니다.
   */
  getElementScroll(): ElementScroll {
    return elementScrollFromNative(native.elementGetScroll(this.handle));
  }

  /**
   * Get a read-only view of the element’s computed transform state.
   *
   * @zh 获取元素计算变换状态的只读视图。
   * @ja 要素の計算済み変換状態を読み取り専用で取得します。
   * @ko 요소의 계산된 변환 상태에 대한 읽기 전용 뷰를 가져옵니다.
   * @returns Read-only native view, or null if no state exists.
   * @zh 原生只读视图；不存在状态时返回 null。
   * @ja 読み取り専用ビュー。状態がなければ null。
   * @ko 읽기 전용 뷰이며 상태가 없으면 null입니다.
   * @remarks
   * Native transform state is updated during context.render().
   * @zh 原生变换状态在 context.render() 中更新。
   * @ja ネイティブ変換状態は context.render() 中に更新されます。
   * @ko 네이티브 변환 상태는 context.render() 중 갱신됩니다.
   */
  getTransformState(): TransformState | null {
    let result = transformStates.get(this);
    const token = native.elementGetTransformState(
      this.handle,
      result === undefined ? undefined : transformStateHandle(result),
    );
    if (token === null) {
      transformStates.delete(this);
      return null;
    }
    if (!result) {
      result = transformStateFromNative(token);
      transformStates.set(this, result);
    }
    return result;
  }

  /**
   * Read Rml::Element::GetStyleSheet, including the document override.
   *
   * @zh 读取 Rml::Element::GetStyleSheet，包含文档的重写实现。
   * @ja 文書のオーバーライドを含む Rml::Element::GetStyleSheet を読み取ります。
   * @ko 문서의 재정의를 포함한 Rml::Element::GetStyleSheet를 읽습니다.
   * @returns Read-only compiled view, or null when no stylesheet is available.
   * @zh 只读编译视图；没有可用样式表时为 null。
   * @ja 読み取り専用のコンパイルビュー。シートがなければ null。
   * @ko 읽기 전용 컴파일 뷰이며 시트가 없으면 null입니다.
   * @remarks
   * The view retains its container after document destruction or replacement.
   * Any recompilation of that container invalidates earlier compiled views.
   * @zh 文档销毁或替换样式表后，视图仍保留原容器；原容器重新编译会使旧视图失效。
   * @ja 文書の破棄や置換後もコンテナーを保持します。再コンパイルで旧ビューは無効になります。
   * @ko 문서 파괴나 교체 후에도 컨테이너를 유지합니다. 재컴파일하면 이전 뷰는 무효화됩니다.
   */
  getStyleSheet(): StyleSheet | null {
    const handle = native.elementGetStyleSheet(this.handle);
    return handle === null ? null : sheetFromNative(handle);
  }

  /**
   * Get the render manager associated with this element.
   *
   * @zh 获取与此元素关联的渲染管理器。
   * @ja この要素に関連する描画管理器を取得します。
   * @ko 이 요소에 연결된 렌더 관리자를 가져옵니다.
   * @returns Borrowed manager or null when no native manager is available.
   * @zh 借用管理器；没有原生管理器时为 null。
   * @ja 借用した管理器。ネイティブ管理器がなければ null。
   * @ko 빌린 관리자이며 네이티브 관리자가 없으면 null입니다.
   */
  getRenderManager(): RenderManager | null {
    const handle = native.getElementRenderManager(this.handle);
    return handle ? renderManagerFromNative(handle) : null;
  }

  /**
   * Live read-only Rml::Element::GetComputedValues.
   *
   * @zh 实时只读的 Rml::Element::GetComputedValues。
   * @ja ライブ読み取り専用の Rml::Element::GetComputedValues。
   * @ko 실시간 읽기 전용 Rml::Element::GetComputedValues입니다.
   * @returns Checked view; call context.update() before inspecting layout.
   * @zh 有效性受检查的视图；检查布局前调用 context.update()。
   * @ja 検証付きビュー。レイアウト取得前に context.update() を呼びます。
   * @ko 검증된 뷰이며 레이아웃 조회 전에 context.update()를 호출하세요.
   */
  getComputedValues(): ComputedValuesView {
    return computedViewFromNative(native.getComputedValues(this.handle));
  }

  /**
   * Rml::Element::GetFontFaceHandle as an opaque native token.
   *
   * @zh 将 Rml::Element::GetFontFaceHandle 返回为不透明原生令牌。
   * @ja Rml::Element::GetFontFaceHandle を不透明なネイティブトークンで返します。
   * @ko Rml::Element::GetFontFaceHandle을 불투명 네이티브 토큰으로 반환합니다.
   * @returns Font face token, or null when no face is selected.
   * @zh 字体令牌；未选择字体时返回 null。
   * @ja フォントトークン。未選択なら null。
   * @ko 글꼴 토큰이며 선택되지 않았으면 null입니다.
   */
  getFontFaceHandle(): FontFaceHandle | null {
    return native.getFontFaceHandle(this.handle);
  }

  /**
   * Start or replace Rml::Element::Animate for a property name or id.
   *
   * @zh 按属性名或 ID 调用 Rml::Element::Animate，启动或替换动画。
   * @ja プロパティ名または ID で Rml::Element::Animate を開始・置換。
   * @ko 속성 이름 또는 ID로 Rml::Element::Animate를 시작하거나 교체합니다.
   * @param property - Native property name or id.
   * @zh property - 原生属性名或 ID。
   * @ja property - ネイティブのプロパティ名または ID。
   * @ko property - 네이티브 속성 이름 또는 ID입니다.
   * @param target - Typed target value, copied by RmlUi.
   * @zh target - 有类型的目标值，由 RmlUi 复制。
   * @ja target - RmlUi がコピーする型付き目標値。
   * @ko target - RmlUi가 복사하는 형식화된 목표 값입니다.
   * @param duration - Nonnegative duration in seconds.
   * @zh duration - 非负持续时间，单位秒。
   * @ja duration - 秒単位の非負の継続時間。
   * @ko duration - 0 이상인 지속 시간이며 단위는 초입니다.
   * @param tween - Easing; defaults to native Linear/Out.
   * @zh tween - 缓动，默认原生 Linear/Out。
   * @ja tween - イージング。既定はネイティブ Linear/Out。
   * @ko tween - 이징이며 기본값은 네이티브 Linear/Out입니다.
   * @param iterations - Iteration count; defaults to 1; -1 repeats forever.
   * @zh iterations - 迭代次数，默认 1；-1 无限重复。
   * @ja iterations - 反復回数。既定は 1、-1 は無限。
   * @ko iterations - 반복 횟수이며 기본값은 1, -1은 무한 반복입니다.
   * @param alternate - Reverse every second iteration; defaults to true.
   * @zh alternate - 每隔一次迭代反向，默认 true。
   * @ja alternate - 反復ごとに方向を反転。既定は true。
   * @ko alternate - 매 두 번째 반복을 반전하며 기본값은 true입니다.
   * @param delay - Delay in seconds; defaults to zero.
   * @zh delay - 延迟秒数，默认零。
   * @ja delay - 秒単位の遅延。既定はゼロ。
   * @ko delay - 지연 시간이며 기본값은 0초입니다.
   * @param start - Copied start value; null uses the current property value.
   * @zh start - 起始值副本；null 使用当前属性值。
   * @ja start - コピーされる開始値。null は現在の値。
   * @ko start - 복사되는 시작 값이며 null은 현재 속성 값을 사용합니다.
   * @returns Native success; false for unknown or unsupported properties.
   * @zh 原生成功结果；未知或不支持的属性返回 false。
   * @ja 成功結果。不明・非対応のプロパティは false。
   * @ko 네이티브 성공 여부이며 알 수 없거나 미지원 속성은 false입니다.
   */
  animate(
    property: string | PropertyId, target: Property, duration: number,
    tween?: Tween, iterations = 1, alternate = true, delay = 0,
    start: Property | null = null,
  ): boolean {
    return native.animate(
      this.handle, property, propertyHandle(target), duration,
      tween === undefined ? undefined : tweenHandle(tween),
      iterations, alternate, delay,
      start === null ? null : propertyHandle(start),
    );
  }

  /**
   * Append a copied key with Rml::Element::AddAnimationKey.
   *
   * @zh 通过 Rml::Element::AddAnimationKey 追加关键帧副本。
   * @ja Rml::Element::AddAnimationKey でキーのコピーを追加。
   * @ko Rml::Element::AddAnimationKey로 복사된 키를 추가합니다.
   * @param property - Native property name or id.
   * @zh property - 原生属性名或 ID。
   * @ja property - ネイティブのプロパティ名または ID。
   * @ko property - 네이티브 속성 이름 또는 ID입니다.
   * @param target - Typed target value.
   * @zh target - 有类型的目标值。
   * @ja target - 型付き目標値。
   * @ko target - 형식화된 목표 값입니다.
   * @param duration - Additional nonnegative duration in seconds.
   * @zh duration - 新增的非负持续秒数。
   * @ja duration - 追加する非負の秒数。
   * @ko duration - 추가되는 0 이상의 지속 시간(초)입니다.
   * @param tween - Easing; defaults to native Linear/Out.
   * @zh tween - 缓动，默认原生 Linear/Out。
   * @ja tween - イージング。既定はネイティブ Linear/Out。
   * @ko tween - 이징이며 기본값은 네이티브 Linear/Out입니다.
   * @returns Native success, including false when no animation exists.
   * @zh 原生成功结果；没有现有动画时返回 false。
   * @ja 成功結果。既存アニメーションがなければ false。
   * @ko 네이티브 성공 여부이며 기존 애니메이션이 없으면 false입니다.
   */
  addAnimationKey(
    property: string | PropertyId, target: Property, duration: number,
    tween?: Tween,
  ): boolean {
    return native.addAnimationKey(
      this.handle, property, propertyHandle(target), duration,
      tween === undefined ? undefined : tweenHandle(tween),
    );
  }

  /**
   * Rml::Element::ResolveLength in the element's current style and context.
   *
   * @zh 在元素当前样式和上下文中调用 Rml::Element::ResolveLength。
   * @ja 現在のスタイルとコンテキストで Rml::Element::ResolveLength を呼び出します。
   * @ko 현재 스타일과 컨텍스트에서 Rml::Element::ResolveLength를 호출합니다.
   * @param value - Native numeric value; non-length units return zero.
   * @zh value - 原生数值；非长度单位返回零。
   * @ja value - ネイティブ数値。長さ以外の単位はゼロを返します。
   * @ko value - 네이티브 수치이며 길이 이외 단위는 0을 반환합니다.
   * @returns Length in pixels; invalid fields or overflow throw.
   * @zh 像素长度；字段无效或溢出时抛出异常。
   * @ja ピクセル単位の長さ。無効なフィールドや桁あふれは例外です。
   * @ko 픽셀 길이이며 잘못된 필드나 오버플로는 예외를 발생시킵니다.
   */
  resolveLength(value: NumericValue): number {
    return native.resolveLength(this.handle, numericValueHandle(value));
  }

  /**
   * Rml::Element::ResolveNumericValue with native unit conversion.
   *
   * @zh 使用原生单位转换调用 Rml::Element::ResolveNumericValue。
   * @ja ネイティブ単位変換を行う Rml::Element::ResolveNumericValue。
   * @ko 네이티브 단위 변환을 수행하는 Rml::Element::ResolveNumericValue입니다.
   * @param value - Numeric value. NUMBER multiplies the base; PERCENT scales it
   * by number / 100; angles return radians; non-numeric units return zero.
   * @zh value - 数值。NUMBER 乘以基数，PERCENT 按 number / 100 缩放基数；
   * 角度返回弧度，非数值单位返回零。
   * @ja value - 数値。NUMBER は基準値を乗算、PERCENT は number / 100 を乗算。
   * 角度はラジアン、非数値単位はゼロを返します。
   * @ko value - 수치이며 NUMBER는 기준값을 곱하고 PERCENT는 number / 100을 곱합니다.
   * 각도는 라디안으로, 비수치 단위는 0으로 반환합니다.
   * @param baseValue - Finite base for NUMBER and PERCENT.
   * @zh baseValue - NUMBER 和 PERCENT 使用的有限基数。
   * @ja baseValue - NUMBER と PERCENT の有限な基準値。
   * @ko baseValue - NUMBER와 PERCENT에 사용하는 유한한 기준값입니다.
   * @returns Resolved native value; invalid fields or overflow throw.
   * @zh 原生解析结果；字段无效或溢出时抛出异常。
   * @ja ネイティブの解決値。無効なフィールドや桁あふれは例外です。
   * @ko 네이티브 해석값이며 잘못된 필드나 오버플로는 예외를 발생시킵니다.
   */
  resolveNumericValue(value: NumericValue, baseValue: number): number {
    return native.resolveNumericValue(
      this.handle, numericValueHandle(value), baseValue,
    );
  }

  /**
   * Copy the main Rml::Element::GetBox into independent native storage.
   *
   * @zh 将主 Rml::Element::GetBox 复制到独立原生存储。
   * @ja メインの Rml::Element::GetBox を独立した領域へコピーします。
   * @ko 기본 Rml::Element::GetBox를 독립적인 네이티브 저장소에 복사합니다.
   * @returns Writable box snapshot; apply changes with setBox.
   * @zh 可写盒快照；使用 setBox 应用修改。
   * @ja 書き込み可能なコピー。変更は setBox で適用します。
   * @ko 쓰기 가능한 상자 복사본이며 변경은 setBox로 적용합니다.
   */
  getBox(): Box;

  /**
   * Copy Rml::Element::GetBox(index, offset), including its output offset.
   *
   * @zh 复制 Rml::Element::GetBox(index, offset)，包含输出偏移。
   * @ja 出力オフセットを含む Rml::Element::GetBox(index, offset) のコピー。
   * @ko 출력 오프셋을 포함하는 Rml::Element::GetBox(index, offset) 복사본입니다.
   * @param index - Box index; out of range returns the main box and zero
   * offset.
   * INT32_MIN is rejected to avoid upstream signed overflow.
   * @zh index - 盒索引；越界时返回主盒及零偏移。INT32_MIN 会被拒绝，
   * 避免上游有符号溢出。
   * @ja index - 添字。範囲外ではメインとゼロオフセットを返します。
   * 上流の符号付きオーバーフローを防ぐため INT32_MIN は拒否します。
   * @ko index - 인덱스이며 범위를 벗어나면 기본 상자와 0 오프셋을 반환합니다.
   * 상위 라이브러리의 정수 오버플로를 방지하기 위해 INT32_MIN은 거부합니다.
   * @returns Independently owned box and offset.
   * @zh 独立持有的盒及偏移。
   * @ja 独立したボックスとオフセット。
   * @ko 독립적으로 소유하는 상자와 오프셋입니다.
   */
  getBox(index: number): PositionedBox;
  getBox(index?: number): Box | PositionedBox {
    if (index === undefined) {
      return boxFromNative(native.getBox(this.handle));
    }
    const result = native.getBox(this.handle, index);
    return { box: boxFromNative(result.box), offset: result.offset };
  }

  /**
   * Copy a value into Rml::Element::SetBox, clearing additional boxes.
   *
   * @zh 将值复制到 Rml::Element::SetBox，并清除附加盒。
   * @ja Rml::Element::SetBox へコピーし、追加ボックスを消去します。
   * @ko Rml::Element::SetBox로 복사하고 추가 상자를 제거합니다.
   * @param box - Finite box value; later changes do not affect this element.
   * @zh box - 有限盒值；后续修改不会影响元素。
   * @ja box - 有限な値。後の変更は要素へ影響しません。
   * @ko box - 유한한 상자 값이며 이후 변경은 요소에 영향을 주지 않습니다.
   * @remarks
   * Layout may replace manually assigned boxes on a subsequent update.
   * @zh 后续布局更新可能覆盖手动设置的盒。
   * @ja 後続のレイアウト更新は手動設定を上書きする場合があります。
   * @ko 이후 레이아웃 갱신은 수동 설정을 덮어쓸 수 있습니다.
   */
  setBox(box: Box): void {
    native.setBox(this.handle, boxHandle(box));
  }

  /**
   * Copy an additional box into Rml::Element::AddBox.
   *
   * @zh 将附加盒复制到 Rml::Element::AddBox。
   * @ja 追加ボックスを Rml::Element::AddBox へコピーします。
   * @ko 추가 상자를 Rml::Element::AddBox로 복사합니다.
   * @param box - Finite box value.
   * @zh box - 有限盒值。
   * @ja box - 有限なボックス値。
   * @ko box - 유한한 상자 값입니다.
   * @param offset - Finite offset from the main box.
   * @zh offset - 相对主盒的有限偏移。
   * @ja offset - メインボックスからの有限なオフセット。
   * @ko offset - 기본 상자 기준 유한한 오프셋입니다.
   */
  addBox(box: Box, offset: VariantVector2): void {
    native.addBox(this.handle, boxHandle(box), offset);
  }

  /**
   * Get the total number of main and additional layout boxes.
   *
   * @zh 获取主布局盒和附加布局盒的总数。
   * @ja 主レイアウトボックスと追加ボックスの総数を取得します。
   * @ko 기본 및 추가 레이아웃 상자의 총수를 가져옵니다.
   * @returns Main box plus additional boxes.
   * @zh 主盒及附加盒的总数。
   * @ja メインと追加ボックスの総数。
   * @ko 기본 상자와 추가 상자의 총 개수입니다.
   */
  getNumBoxes(): number {
    return native.getNumBoxes(this.handle);
  }

  /**
   * Copy Rml::Element::GetRenderBox for mesh construction.
   *
   * @zh 复制 Rml::Element::GetRenderBox，用于网格构造。
   * @ja メッシュ生成用の Rml::Element::GetRenderBox をコピーします。
   * @ko 메시 생성용 Rml::Element::GetRenderBox를 복사합니다.
   * @param fillArea - Border, Padding or Content; defaults to Padding.
   * @zh fillArea - Border、Padding 或 Content；默认 Padding。
   * @ja fillArea - Border、Padding、Content。既定値は Padding。
   * @ko fillArea - Border, Padding 또는 Content이며 기본값은 Padding입니다.
   * @param index - Box index; defaults to zero. Same fallback as getBox(index).
   * @zh index - 盒索引，默认零；越界行为与 getBox(index) 相同。
   * @ja index - 添字。既定値はゼロ。範囲外の動作は getBox(index) と同じです。
   * @ko index - 상자 인덱스이며 기본값은 0입니다. 범위 밖 동작은 getBox(index)와 같습니다.
   * @returns Independent rendering-box value.
   * @zh 独立渲染盒值。
   * @ja 独立した描画ボックス値。
   * @ko 독립적인 렌더링 상자 값입니다.
   */
  getRenderBox(
    fillArea: BoxArea = BoxArea.Padding, index = 0,
  ): RenderBox {
    return renderBoxFromNative(
      native.getRenderBox(this.handle, fillArea, index));
  }

  /**
   * Read Rml::Element::GetAbsoluteLeft in context pixels.
   *
   * @zh 读取 GetAbsoluteLeft，单位为上下文像素。
   * @ja GetAbsoluteLeft をコンテキストのピクセルで取得します。
   * @ko GetAbsoluteLeft를 컨텍스트 픽셀 단위로 읽습니다.
   * @returns The horizontal context offset.
   * @zh 相对上下文的水平偏移。
   * @ja コンテキスト内の水平オフセット。
   * @ko 컨텍스트 내 수평 오프셋입니다.
   */
  get absoluteLeft(): number {
    return native.getAbsoluteLeft(this.handle);
  }

  /**
   * Read Rml::Element::GetAbsoluteTop in context pixels.
   *
   * @zh 读取 GetAbsoluteTop，单位为上下文像素。
   * @ja GetAbsoluteTop をコンテキストのピクセルで取得します。
   * @ko GetAbsoluteTop을 컨텍스트 픽셀 단위로 읽습니다.
   * @returns The vertical context offset.
   * @zh 相对上下文的垂直偏移。
   * @ja コンテキスト内の垂直オフセット。
   * @ko 컨텍스트 내 수직 오프셋입니다.
   */
  get absoluteTop(): number {
    return native.getAbsoluteTop(this.handle);
  }

  /**
   * Read Rml::Element::GetClientLeft (left border width).
   *
   * @zh 读取 GetClientLeft，即左边框宽度。
   * @ja GetClientLeft（左ボーダー幅）を取得します。
   * @ko GetClientLeft인 왼쪽 테두리 너비를 읽습니다.
   * @returns The left border width.
   * @zh 左边框宽度。
   * @ja 左ボーダーの幅。
   * @ko 왼쪽 테두리 너비입니다.
   */
  get clientLeft(): number {
    return native.getClientLeft(this.handle);
  }

  /**
   * Read Rml::Element::GetClientTop (top border width).
   *
   * @zh 读取 GetClientTop，即顶部边框宽度。
   * @ja GetClientTop（上ボーダー幅）を取得します。
   * @ko GetClientTop인 위쪽 테두리 너비를 읽습니다.
   * @returns The top border width.
   * @zh 顶部边框宽度。
   * @ja 上ボーダーの幅。
   * @ko 위쪽 테두리 너비입니다.
   */
  get clientTop(): number {
    return native.getClientTop(this.handle);
  }

  /**
   * Read GetClientWidth: padding width minus the vertical scrollbar.
   *
   * @zh 读取 GetClientWidth：内边距区域宽度减去垂直滚动条。
   * @ja GetClientWidth。パディング幅から垂直スクロールバーを除きます。
   * @ko GetClientWidth이며 패딩 너비에서 수직 스크롤바를 뺍니다.
   * @returns The client width in pixels.
   * @zh 客户区宽度，单位为像素。
   * @ja クライアント領域の幅（ピクセル）。
   * @ko 클라이언트 영역 너비이며 픽셀 단위입니다.
   */
  get clientWidth(): number {
    return native.getClientWidth(this.handle);
  }

  /**
   * Read GetClientHeight: padding height minus the horizontal scrollbar.
   *
   * @zh 读取 GetClientHeight：内边距区域高度减去水平滚动条。
   * @ja GetClientHeight。パディング高さから水平スクロールバーを除きます。
   * @ko GetClientHeight이며 패딩 높이에서 수평 스크롤바를 뺍니다.
   * @returns The client height in pixels.
   * @zh 客户区高度，单位为像素。
   * @ja クライアント領域の高さ（ピクセル）。
   * @ko 클라이언트 영역 높이이며 픽셀 단위입니다.
   */
  get clientHeight(): number {
    return native.getClientHeight(this.handle);
  }

  /**
   * Read GetOffsetParent; null when no native offset parent exists.
   *
   * @zh 读取 GetOffsetParent；没有原生偏移父元素时返回 null。
   * @ja GetOffsetParent。オフセットの親が存在しない場合は null。
   * @ko GetOffsetParent이며 오프셋 부모가 없으면 null입니다.
   * @returns The live offset parent or null.
   * @zh 有效的偏移父元素或 null。
   * @ja 有効なオフセット親、または null。
   * @ko 유효한 오프셋 부모 또는 null입니다.
   */
  get offsetParent(): Element | null {
    const handle = native.getOffsetParent(this.handle);
    return handle ? Element.wrap(handle) : null;
  }

  /**
   * Read GetOffsetLeft: border offset relative to the offset parent.
   *
   * @zh 读取 GetOffsetLeft：相对偏移父元素的左边框偏移。
   * @ja GetOffsetLeft。オフセットの親から左ボーダーまでの距離です。
   * @ko GetOffsetLeft이며 오프셋 부모 기준 왼쪽 테두리 위치입니다.
   * @returns The horizontal border offset.
   * @zh 边框的水平偏移。
   * @ja ボーダーの水平オフセット。
   * @ko 테두리 수평 오프셋입니다.
   */
  get offsetLeft(): number {
    return native.getOffsetLeft(this.handle);
  }

  /**
   * Read GetOffsetTop: border offset relative to the offset parent.
   *
   * @zh 读取 GetOffsetTop：相对偏移父元素的顶部边框偏移。
   * @ja GetOffsetTop。オフセットの親から上ボーダーまでの距離です。
   * @ko GetOffsetTop이며 오프셋 부모 기준 위쪽 테두리 위치입니다.
   * @returns The vertical border offset.
   * @zh 边框的垂直偏移。
   * @ja ボーダーの垂直オフセット。
   * @ko 테두리 수직 오프셋입니다.
   */
  get offsetTop(): number {
    return native.getOffsetTop(this.handle);
  }

  /**
   * Read GetOffsetWidth: content, padding and borders, excluding margins.
   *
   * @zh 读取 GetOffsetWidth：包含内容、内边距和边框，不包含外边距。
   * @ja GetOffsetWidth。コンテンツ、パディング、ボーダーを含みます。
   * @ko GetOffsetWidth이며 콘텐츠, 패딩, 테두리를 포함하고 마진은 제외합니다.
   * @returns The border width in pixels.
   * @zh 边框区域宽度，单位为像素。
   * @ja ボーダー領域の幅（ピクセル）。
   * @ko 테두리 영역 너비이며 픽셀 단위입니다.
   */
  get offsetWidth(): number {
    return native.getOffsetWidth(this.handle);
  }

  /**
   * Read GetOffsetHeight: content, padding and borders, excluding margins.
   *
   * @zh 读取 GetOffsetHeight：包含内容、内边距和边框，不包含外边距。
   * @ja GetOffsetHeight。コンテンツ、パディング、ボーダーを含みます。
   * @ko GetOffsetHeight이며 콘텐츠, 패딩, 테두리를 포함하고 마진은 제외합니다.
   * @returns The border height in pixels.
   * @zh 边框区域高度，单位为像素。
   * @ja ボーダー領域の高さ（ピクセル）。
   * @ko 테두리 영역 높이이며 픽셀 단위입니다.
   */
  get offsetHeight(): number {
    return native.getOffsetHeight(this.handle);
  }

  /**
   * Native GetScrollLeft/SetScrollLeft with native rounding and clamping.
   * Changing the offset synchronously dispatches a scroll event.
   *
   * @zh 原生 GetScrollLeft/SetScrollLeft，保留取整与范围限制。
   * 偏移变化时同步派发 scroll 事件。
   * @ja GetScrollLeft/SetScrollLeft。丸めと範囲制限を行い、
   * 値が変わると scroll イベントを同期送信します。
   * @ko GetScrollLeft/SetScrollLeft이며 반올림과 범위 제한을 적용합니다.
   * 값이 바뀌면 scroll 이벤트를 동기적으로 발생시킵니다.
   * @returns The horizontal scroll offset.
   * @zh 水平滚动偏移。
   * @ja 水平スクロール量。
   * @ko 수평 스크롤 오프셋입니다.
   */
  get scrollLeft(): number {
    return native.getScrollLeft(this.handle);
  }

  /**
   * Set the horizontal scroll offset through Rml::Element::SetScrollLeft.
   *
   * @zh 通过 Rml::Element::SetScrollLeft 设置水平滚动偏移。
   * @ja Rml::Element::SetScrollLeft で水平スクロール位置を設定します。
   * @ko Rml::Element::SetScrollLeft로 가로 스크롤 위치를 설정합니다.
   * @param value - Horizontal offset in pixels, clamped by RmlUi.
   * @zh value - 水平像素偏移，由 RmlUi 限制范围。
   * @ja value - 水平方向のピクセル位置。RmlUi が範囲内に制限します。
   * @ko value - 가로 픽셀 위치이며 RmlUi가 범위를 제한합니다.
   */
  set scrollLeft(value: number) {
    native.setScrollLeft(this.handle, value);
  }

  /**
   * Native GetScrollTop/SetScrollTop with native rounding and clamping.
   * Changing the offset synchronously dispatches a scroll event.
   *
   * @zh 原生 GetScrollTop/SetScrollTop，保留取整与范围限制。
   * 偏移变化时同步派发 scroll 事件。
   * @ja GetScrollTop/SetScrollTop。丸めと範囲制限を行い、
   * 値が変わると scroll イベントを同期送信します。
   * @ko GetScrollTop/SetScrollTop이며 반올림과 범위 제한을 적용합니다.
   * 값이 바뀌면 scroll 이벤트를 동기적으로 발생시킵니다.
   * @returns The vertical scroll offset.
   * @zh 垂直滚动偏移。
   * @ja 垂直スクロール量。
   * @ko 수직 스크롤 오프셋입니다.
   */
  get scrollTop(): number {
    return native.getScrollTop(this.handle);
  }

  /**
   * Set the vertical scroll offset through Rml::Element::SetScrollTop.
   *
   * @zh 通过 Rml::Element::SetScrollTop 设置垂直滚动偏移。
   * @ja Rml::Element::SetScrollTop で垂直スクロール位置を設定します。
   * @ko Rml::Element::SetScrollTop으로 세로 스크롤 위치를 설정합니다.
   * @param value - Vertical offset in pixels, clamped by RmlUi.
   * @zh value - 垂直像素偏移，由 RmlUi 限制范围。
   * @ja value - 垂直方向のピクセル位置。RmlUi が範囲内に制限します。
   * @ko value - 세로 픽셀 위치이며 RmlUi가 범위를 제한합니다.
   */
  set scrollTop(value: number) {
    native.setScrollTop(this.handle, value);
  }

  /**
   * Read GetScrollWidth, including padding and scrollable content.
   *
   * @zh 读取 GetScrollWidth，包含内边距和可滚动内容。
   * @ja GetScrollWidth。パディングとスクロール可能な内容を含みます。
   * @ko GetScrollWidth이며 패딩과 스크롤 가능한 콘텐츠를 포함합니다.
   * @returns The scrollable width in pixels.
   * @zh 可滚动宽度，单位为像素。
   * @ja スクロール可能な幅（ピクセル）。
   * @ko 스크롤 가능한 너비이며 픽셀 단위입니다.
   */
  get scrollWidth(): number {
    return native.getScrollWidth(this.handle);
  }

  /**
   * Read GetScrollHeight, including padding and scrollable content.
   *
   * @zh 读取 GetScrollHeight，包含内边距和可滚动内容。
   * @ja GetScrollHeight。パディングとスクロール可能な内容を含みます。
   * @ko GetScrollHeight이며 패딩과 스크롤 가능한 콘텐츠를 포함합니다.
   * @returns The scrollable height in pixels.
   * @zh 可滚动高度，单位为像素。
   * @ja スクロール可能な高さ（ピクセル）。
   * @ko 스크롤 가능한 높이이며 픽셀 단위입니다.
   */
  get scrollHeight(): number {
    return native.getScrollHeight(this.handle);
  }

  /**
   * Native GetClipArea/SetClipArea; Auto selects automatic clipping.
   *
   * @zh 原生 GetClipArea/SetClipArea；Auto 表示自动裁剪。
   * @ja GetClipArea/SetClipArea。Auto は自動クリッピングです。
   * @ko GetClipArea/SetClipArea이며 Auto는 자동 클리핑입니다.
   * @returns The clipping area.
   * @zh 裁剪区域。
   * @ja クリップ領域。
   * @ko 클리핑 영역입니다.
   */
  get clipArea(): BoxArea {
    return native.getClipArea(this.handle);
  }

  /**
   * Set the box area used for clipping.
   *
   * @zh 设置裁剪使用的盒区域。
   * @ja クリッピングに使うボックス領域を設定します。
   * @ko 클리핑에 사용할 상자 영역을 설정합니다.
   * @param area - Native clip box area.
   * @zh area - 原生裁剪盒区域。
   * @ja area - ネイティブのクリップ領域。
   * @ko area - 네이티브 클립 상자 영역입니다.
   */
  set clipArea(area: BoxArea) {
    native.setClipArea(this.handle, area);
  }

  /**
   * Read GetBaseline: upward pixel offset from the bottom margin edge.
   *
   * @zh 读取 GetBaseline：从下外边距边缘向上的像素偏移。
   * @ja GetBaseline。下マージン端から上向きのピクセル距離です。
   * @ko GetBaseline이며 아래 마진 가장자리에서 위쪽으로 잰 픽셀 거리입니다.
   * @returns The upward baseline offset in pixels.
   * @zh 基线向上偏移，单位为像素。
   * @ja 上向きのベースライン距離（ピクセル）。
   * @ko 위쪽 기준선 오프셋이며 픽셀 단위입니다.
   */
  get baseline(): number {
    return native.getBaseline(this.handle);
  }

  /**
   * Read the native GetZIndex result.
   *
   * @zh 读取原生 GetZIndex 的结果。
   * @ja ネイティブ GetZIndex の結果を取得します。
   * @ko 네이티브 GetZIndex 결과를 읽습니다.
   * @returns The native z-index.
   * @zh 原生 z-index。
   * @ja ネイティブの z-index。
   * @ko 네이티브 z-index입니다.
   */
  get zIndex(): number {
    return native.getZIndex(this.handle);
  }

  /**
   * Set the native layout base through Rml::Element::SetOffset.
   *
   * @zh 通过 Rml::Element::SetOffset 设置原生布局基准偏移。
   * @ja Rml::Element::SetOffset でネイティブ配置の基準を設定します。
   * @ko Rml::Element::SetOffset으로 네이티브 배치 기준을 설정합니다.
   * @param offset - Finite pixel coordinates; native position rules apply.
   * @zh offset - 有限像素坐标；遵循原生 position 规则。
   * @ja offset - 有限のピクセル座標。ネイティブの position 規則を適用します。
   * @ko offset - 유한한 픽셀 좌표이며 네이티브 position 규칙을 적용합니다.
   * @param offsetParent - Strict ancestor or null for an independent base.
   * @zh offsetParent - 严格祖先；null 使用独立基准。
   * @ja offsetParent - 自身を除く祖先。null は独立した基準です。
   * @ko offsetParent - 자신을 제외한 조상이며 null은 독립 기준입니다.
   * @param offsetFixed - Ignore ancestor scrolling; defaults to false.
   * @zh offsetFixed - 忽略祖先滚动，默认 false。
   * @ja offsetFixed - 祖先のスクロールを無視。既定値 false。
   * @ko offsetFixed - 조상 스크롤을 무시하며 기본값은 false입니다.
   * @remarks
   * Native layout may replace this base on the next update. Fixed positioning
   * implies offsetFixed. Ancestor validation prevents cycles and dangling
   * native layout pointers; detachment clears outgoing offset parents.
   * @zh 下次原生布局更新可能重设基准；fixed 定位隐含 offsetFixed。
   * 祖先检查避免循环和悬空原生布局指针；节点脱离会清除指向树外的偏移父节点。
   * @ja 次の配置更新で基準が再設定される場合があります。fixed は offsetFixed を
   * 含みます。祖先検証で循環と無効な参照を防ぎ、切り離しで木の外への参照を解除します。
   * @ko 다음 배치 갱신에서 기준이 재설정될 수 있습니다. fixed는 offsetFixed를
   * 포함합니다. 조상 검사로 순환과 무효 참조를 방지하며 분리 시 트리 밖 참조를 해제합니다.
   */
  setOffset(
    offset: VariantVector2, offsetParent: Element | null, offsetFixed = false,
  ): void {
    native.setOffset(this.handle, offset,
      offsetParent === null ? null : offsetParent.handle, offsetFixed);
  }

  /**
   * Copy GetRelativeOffset relative to the offset parent's border corner.
   *
   * @zh 复制 GetRelativeOffset，坐标相对偏移父元素的边框左上角。
   * @ja GetRelativeOffset を親のボーダー左上隅に対して取得します。
   * @ko GetRelativeOffset을 오프셋 부모의 테두리 왼쪽 위 기준으로 복사합니다.
   * @param area - Concrete box area; defaults to Content, not Auto.
   * @zh area - 具体盒区域，默认为 Content，不接受 Auto。
   * @ja area - 具体的な領域。既定値 Content。Auto は不可。
   * @ko area - 구체적인 상자 영역이며 기본값은 Content입니다. Auto는 불가합니다.
   * @returns An independent pixel coordinate.
   * @zh 独立的像素坐标。
   * @ja 独立したピクセル座標。
   * @ko 독립적인 픽셀 좌표입니다.
   */
  getRelativeOffset(area: BoxArea = BoxArea.Content): VariantVector2 {
    return native.getRelativeOffset(this.handle, area);
  }

  /**
   * Copy GetAbsoluteOffset relative to the element root.
   *
   * @zh 复制 GetAbsoluteOffset，坐标相对元素根节点。
   * @ja GetAbsoluteOffset を要素のルートに対して取得します。
   * @ko GetAbsoluteOffset을 요소 루트 기준으로 복사합니다.
   * @param area - Concrete box area; defaults to Content, not Auto.
   * @zh area - 具体盒区域，默认为 Content，不接受 Auto。
   * @ja area - 具体的な領域。既定値 Content。Auto は不可。
   * @ko area - 구체적인 상자 영역이며 기본값은 Content입니다. Auto는 불가합니다.
   * @returns An independent pixel coordinate.
   * @zh 独立的像素坐标。
   * @ja 独立したピクセル座標。
   * @ko 독립적인 픽셀 좌표입니다.
   */
  getAbsoluteOffset(area: BoxArea = BoxArea.Content): VariantVector2 {
    return native.getAbsoluteOffset(this.handle, area);
  }

  /**
   * Copy Rml::Element::GetContainingBlock in pixels.
   *
   * @zh 复制 Rml::Element::GetContainingBlock，单位为像素。
   * @ja Rml::Element::GetContainingBlock をピクセル単位でコピーします。
   * @ko Rml::Element::GetContainingBlock을 픽셀 단위로 복사합니다.
   * @returns The native containing block dimensions.
   * @zh 原生包含块尺寸。
   * @ja ネイティブの包含ブロックサイズ。
   * @ko 네이티브 컨테이닝 블록 크기입니다.
   */
  getContainingBlock(): VariantVector2 {
    return native.getContainingBlock(this.handle);
  }

  /**
   * Read native GetPosition from the computed values.
   *
   * @zh 从计算样式读取原生 GetPosition。
   * @ja 計算済みスタイルから GetPosition を取得します。
   * @ko 계산된 스타일에서 GetPosition을 읽습니다.
   * @returns The positioning mode.
   * @zh 定位模式。
   * @ja 配置モード。
   * @ko 배치 모드입니다.
   */
  getPosition(): StylePosition {
    return native.getPosition(this.handle);
  }

  /**
   * Read native GetFloat from the computed values.
   *
   * @zh 从计算样式读取原生 GetFloat。
   * @ja 計算済みスタイルから GetFloat を取得します。
   * @ko 계산된 스타일에서 GetFloat을 읽습니다.
   * @returns The float mode.
   * @zh 浮动模式。
   * @ja フロートモード。
   * @ko 플로트 모드입니다.
   */
  getFloat(): StyleFloat {
    return native.getFloat(this.handle);
  }

  /**
   * Read native GetDisplay from the computed values.
   *
   * @zh 从计算样式读取原生 GetDisplay。
   * @ja 計算済みスタイルから GetDisplay を取得します。
   * @ko 계산된 스타일에서 GetDisplay를 읽습니다.
   * @returns The display mode.
   * @zh 显示模式。
   * @ja 表示モード。
   * @ko 표시 모드입니다.
   */
  getDisplay(): StyleDisplay {
    return native.getDisplay(this.handle);
  }

  /**
   * Read native GetLineHeight from the computed values.
   *
   * @zh 从计算样式读取原生 GetLineHeight。
   * @ja 計算済みスタイルから GetLineHeight を取得します。
   * @ko 계산된 스타일에서 GetLineHeight를 읽습니다.
   * @returns The computed line height in pixels.
   * @zh 计算后的像素行高。
   * @ja 計算済み行高（ピクセル）。
   * @ko 계산된 줄 높이이며 픽셀 단위입니다.
   */
  getLineHeight(): number {
    return native.getLineHeight(this.handle);
  }

  /**
   * Call native IsReplaced for elements handling their own rendering.
   *
   * @zh 调用原生 IsReplaced，判断元素是否自行渲染。
   * @ja IsReplaced で要素が自身を描画するかを確認します。
   * @ko IsReplaced로 요소가 자체 렌더링하는지 확인합니다.
   * @returns Whether this is a replaced element.
   * @zh 是否为替换元素。
   * @ja 置換要素かどうか。
   * @ko 대체 요소 여부입니다.
   */
  isReplaced(): boolean {
    return native.isReplaced(this.handle);
  }

  /**
   * Call native IsVisible, optionally checking ancestors.
   *
   * @zh 调用原生 IsVisible，可选择同时检查祖先。
   * @ja IsVisible を呼び出し、必要に応じて祖先も確認します。
   * @ko IsVisible을 호출하며 선택적으로 상위 요소도 확인합니다.
   * @param includeAncestors - Also test ancestors; defaults to false.
   * @zh includeAncestors - 同时检查祖先，默认 false。
   * @ja includeAncestors - 祖先も検査するか。既定値 false。
   * @ko includeAncestors - 상위 요소도 검사하며 기본값은 false입니다.
   * @returns The native visibility result.
   * @zh 原生可见性结果。
   * @ja ネイティブの可視性結果。
   * @ko 네이티브 가시성 결과입니다.
   */
  isVisible(includeAncestors = false): boolean {
    return native.isVisible(this.handle, includeAncestors);
  }

  /**
   * Call native IsPointWithinElement against the element border.
   * Project transformed screen points with {@link project} first.
   *
   * @zh 调用原生 IsPointWithinElement 检测边框区域。
   * 变换后的屏幕坐标应先调用 {@link project}。
   * @ja IsPointWithinElement でボーダー領域を検査します。
   * 変換された画面座標には先に {@link project} を適用してください。
   * @ko IsPointWithinElement로 테두리 영역을 검사합니다.
   * 변환된 화면 좌표에는 먼저 {@link project}를 적용하세요.
   * @param point - Point in context pixels on the element plane.
   * @zh point - 元素平面上的上下文像素坐标。
   * @ja point - 要素平面上のコンテキストピクセル座標。
   * @ko point - 요소 평면 위 컨텍스트 픽셀 좌표입니다.
   * @returns Whether the native border area contains the point.
   * @zh 原生边框区域是否包含坐标。
   * @ja ネイティブのボーダー領域に座標が含まれるか。
   * @ko 네이티브 테두리 영역에 좌표가 포함되는지 여부입니다.
   */
  isPointWithinElement(point: VariantVector2): boolean {
    return native.isPointWithinElement(this.handle, point);
  }

  /**
   * Call native Project without modifying the supplied point.
   * Native transforms refresh during rendering; render after changing them
   * before querying their projection.
   *
   * @zh 调用原生 Project，不修改传入坐标。
   * 原生变换在渲染时刷新，修改变换后应先渲染再查询投影。
   * @ja 渡された座標を変更せずに Project を呼び出します。
   * 変換は描画時に更新されるため、変更後は描画してから投影を取得します。
   * @ko 입력 좌표를 변경하지 않고 Project를 호출합니다.
   * 변환은 렌더링할 때 갱신되므로 변경 후 렌더링한 다음 투영을 조회하세요.
   * @param point - Window coordinate in context pixels.
   * @zh point - 以上下文像素计量的窗口坐标。
   * @ja point - コンテキストピクセル単位のウィンドウ座標。
   * @ko point - 컨텍스트 픽셀 단위의 창 좌표입니다.
   * @returns The native success flag and copied projected coordinate.
   * @zh 原生成功标志和投影坐标快照。
   * @ja ネイティブの成功フラグと投影座標のコピー。
   * @ko 네이티브 성공 여부와 투영 좌표 복사본입니다.
   */
  project(point: VariantVector2): ProjectedPoint {
    return native.project(this.handle, point);
  }

  /**
   * Call native SetScrollableOverflowRectangle.
   *
   * @zh 调用原生 SetScrollableOverflowRectangle。
   * @ja SetScrollableOverflowRectangle を呼び出します。
   * @ko SetScrollableOverflowRectangle을 호출합니다.
   * @param size - Finite nonnegative dimensions in pixels.
   * @zh size - 有限且非负的像素尺寸。
   * @ja size - 有限かつ非負のピクセルサイズ。
   * @ko size - 유한한 음이 아닌 픽셀 크기입니다.
   * @param clampScrollOffset - Clamp after the final overflow size is known.
   * @zh clampScrollOffset - 最终溢出尺寸确定后限制滚动范围。
   * @ja clampScrollOffset - 最終サイズ確定後にスクロール範囲を制限します。
   * @ko clampScrollOffset - 최종 넘침 크기가 정해지면 스크롤 범위를 제한합니다.
   */
  setScrollableOverflowRectangle(
    size: VariantVector2, clampScrollOffset: boolean,
  ): void {
    native.setScrollableOverflowRectangle(this.handle, size, clampScrollOffset);
  }

  /**
   * Call native ScrollTo. Smooth and Auto require regular context updates.
   *
   * @zh 调用原生 ScrollTo；Smooth 和 Auto 需要持续更新上下文。
   * @ja ScrollTo。Smooth と Auto には継続的なコンテキスト更新が必要です。
   * @ko ScrollTo를 호출합니다. Smooth와 Auto는 지속적인 컨텍스트 갱신이 필요합니다.
   * @param offset - Requested scroll offset in pixels.
   * @zh offset - 请求的像素滚动偏移。
   * @ja offset - 要求するスクロール量（ピクセル）。
   * @ko offset - 요청하는 픽셀 스크롤 오프셋입니다.
   * @param behavior - Defaults to Instant.
   * @zh behavior - 默认为 Instant。
   * @ja behavior - 既定値は Instant。
   * @ko behavior - 기본값은 Instant입니다.
   */
  scrollTo(
    offset: VariantVector2, behavior: ScrollBehavior = ScrollBehavior.Instant,
  ): void {
    native.scrollTo(this.handle, offset, behavior);
  }

  /**
   * Call either native ScrollIntoView overload.
   *
   * @zh 调用原生 ScrollIntoView 的布尔或选项重载。
   * @ja ScrollIntoView の真偽値または設定オブジェクト版を呼び出します。
   * @ko ScrollIntoView의 불리언 또는 옵션 오버로드를 호출합니다.
   * @param options - Align with the top by default, or supply native options.
   * @zh options - 默认与顶部对齐，也可传入原生选项。
   * @ja options - 既定では上端に揃えます。ネイティブ設定も指定できます。
   * @ko options - 기본적으로 위쪽에 맞추며 네이티브 옵션을 지정할 수도 있습니다.
   */
  scrollIntoView(options: boolean | ScrollIntoViewOptions = true): void {
    native.scrollIntoView(this.handle, options);
  }

  /**
   * Borrowed native element handle.
   *
   * @zh 借用的原生元素句柄。
   * @ja 借用したネイティブ要素ハンドル。
   * @ko 빌린 네이티브 요소 핸들입니다.
   * @internal
   */
  readonly handle: ElementNativeHandle;

  /**
   * Construct a detached native element, or wrap an internal native handle.
   *
   * @zh 构造游离原生元素，或包装内部原生句柄。
   * @ja 切り離したネイティブ要素を作るか、内部ハンドルをラップします。
   * @ko 분리 네이티브 요소를 생성하거나 내부 핸들을 감쌉니다.
   * @param tagOrHandle - Native tag, independent of the concrete native class.
   * @zh tagOrHandle - 原生标签，与具体原生类型相互独立。
   * @ja tagOrHandle - 具体的なネイティブ型から独立したタグ。
   * @ko tagOrHandle - 구체적인 네이티브 타입과 독립된 태그입니다.
   * @param attributes - Owned initial values; defaults to an empty dictionary.
   * @zh attributes - 自有初始值；默认为空字典。
   * @ja attributes - 所有する初期値。既定は空の辞書。
   * @ko attributes - 소유 초기 값이며 기본값은 빈 사전입니다.
   * @remarks
   * Native allocators retain exact release provenance and initialize input
   * defaults. No global Factory registration or plugin creation notification
   * occurs. A JS subclass uses its nearest registered concrete native class.
   * ElementFormControl is abstract and rejects direct tag construction.
   * @zh 原生分配器保留确切释放来源并初始化输入默认值。不修改全局 Factory 注册，
   * 不发送插件创建通知。JS 子类使用最近的已注册具体原生类型。
   * ElementFormControl 为抽象类，拒绝直接按标签构造。
   * @ja 元の生成器を保持し、入力の既定値を初期化します。Factory の登録変更や
   * プラグイン生成通知はありません。JS 派生型は最も近い登録済み具体型を使います。
   * 抽象型 ElementFormControl のタグによる直接生成は拒否します。
   * @ko 원래 생성기를 유지하고 입력 기본값을 초기화합니다. Factory 등록 변경이나
   * 플러그인 생성 알림은 없습니다. JS 하위 클래스는 가장 가까운 등록된 구체 타입을
   * 사용합니다. 추상 타입 ElementFormControl의 직접 태그 생성은 거부합니다.
   */
  constructor(
    tagOrHandle: string | ElementNativeHandle,
    attributes: Record<string, AttributeValue> = {},
  ) {
    super();
    let handle: ElementNativeHandle;
    if (typeof tagOrHandle === 'string') {
      if (!attributes || typeof attributes !== 'object' ||
          Array.isArray(attributes)) {
        throw new TypeError('Expected an attribute dictionary');
      }
      // Capture once before JS accessors, then transfer a plain snapshot.
      // Ordinary attribute reads do not invoke JS through a Native Proxy.
      const generation = native.getElementConstructionGeneration();
      const values = Object.fromEntries(Object.entries(attributes)
        .map(([ name, value ]) => [ name, variantToNative(value) ]));
      handle = native.constructElement(
        elementClassName(new.target), tagOrHandle, values, generation);
    } else {
      if (!tagOrHandle || typeof tagOrHandle !== 'object') {
        throw new TypeError('Expected an element tag or native handle');
      }
      if (!wrappers.has(tagOrHandle) && !checkedHandles.has(tagOrHandle)) {
        native.getElementType(tagOrHandle);
        checkedHandles.add(tagOrHandle);
      }
      handle = tagOrHandle;
    }
    this.handle = handle;
    const existing = wrappers.get(handle);
    if (existing) {
      // An invalid subtype construction must still reach the native type
      // check when used, rather than silently returning a different class.
      if (new.target === Element || existing instanceof new.target) {
        return existing;
      }
    } else {
      wrappers.set(handle, this);
    }
  }

  /**
   * Release this detached owned native subtree through its original allocator.
   *
   * @zh 通过原分配器释放此自有游离原生子树。
   * @ja 元の生成器を通して所有する切り離したサブツリーを解放します。
   * @ko 원래 생성기를 통해 소유 분리 네이티브 하위 트리를 해제합니다.
   * @remarks
   * Attached, borrowed and active subtrees are rejected. Native destructors
   * run synchronously and invalidate every surviving wrapper in the subtree.
   * @zh 拒绝已挂接、借用及正在调用的子树。原生析构同步执行，
   * 子树中全部仍存活的包装器均失效。
   * @ja 追加済み・借用・実行中の木は拒否します。同期でネイティブを破棄し、
   * 木に残るすべてのラッパーを無効化します。
   * @ko 연결된, 빌린, 호출 중인 하위 트리는 거부합니다. 동기 네이티브 파괴는
   * 하위 트리의 모든 남은 래퍼를 무효화합니다.
   */
  release(): void {
    native.releaseOwnedElement(this.handle);
  }

  /**
   * Return the canonical wrapper with its registered native subtype.
   *
   * @zh 返回唯一包装器，并保留已注册的原生子类型。
   * @ja 登録されたネイティブ派生型の一意のラッパーを返します。
   * @ko 등록된 네이티브 하위 타입의 고유 래퍼를 반환합니다.
   * @param handle - Checked native element handle.
   * @zh handle - 受检原生元素句柄。
   * @ja handle - 検証対象のネイティブ要素ハンドル。
   * @ko handle - 검증할 네이티브 요소 핸들입니다.
   * @returns Canonical element or document.
   * @zh 唯一元素或文档包装器。
   * @ja 一意の要素または文書。
   * @ko 고유 요소 또는 문서입니다.
   * @internal
   */
  static wrap(handle: ElementNativeHandle): Element {
    const existing = wrappers.get(handle);
    if (existing) {
      return existing;
    }
    const Constructor = elementConstructors.get(native.getElementType(handle))
      ?? Element;
    checkedHandles.add(handle);
    return new Constructor(handle);
  }

  /**
   * Read this facade's native Rml::GetStaticClassIdentifier.
   *
   * @zh 读取此包装类对应的原生 GetStaticClassIdentifier。
   * @ja このラッパー型に対応するネイティブ GetStaticClassIdentifier を取得します。
   * @ko 이 래퍼 유형에 해당하는 네이티브 GetStaticClassIdentifier를 읽습니다.
   * @returns Opaque type token, also available before runtime initialization.
   * @zh 不透明类型令牌，运行时初始化前也可获取。
   * @ja ランタイム初期化前にも取得できる不透明な型トークン。
   * @ko 런타임 초기화 전에도 얻을 수 있는 불투명 유형 토큰입니다.
   * @remarks
   * A JS-only subclass inherits its nearest registered native class identity.
   * @zh 仅在 JS 中定义的子类继承最近的已注册原生类标识。
   * @ja JS のみの派生型は最も近い登録済みネイティブ型の識別子を継承します。
   * @ko JS 전용 하위 클래스는 가장 가까운 등록된 네이티브 유형 식별자를 상속합니다.
   */
  static getStaticClassIdentifier(): ClassIdentifier {
    return classIdentifier(
      native.getStaticClassIdentifier(elementClassName(this)),
    );
  }

  /**
   * Call native GetScriptObject; unregistered instances return null.
   *
   * @zh 调用原生 GetScriptObject；未注册实例返回 null。
   * @ja ネイティブ GetScriptObject を呼び、未登録なら null を返します。
   * @ko 네이티브 GetScriptObject를 호출하며 미등록 인스턴스는 null을 반환합니다.
   * @returns Registered script object or null.
   * @zh 已注册的脚本对象或 null。
   * @ja 登録されたスクリプト、または null。
   * @ko 등록된 스크립트 또는 null입니다.
   */
  getScriptObject(): object | null {
    return native.getElementScriptObject(this.handle);
  }

  /**
   * Register a managed native script object, preserving DOM ownership.
   *
   * @zh 注册托管原生脚本对象，保留 DOM 所有权规则。
   * @ja DOM 所有権を維持し、管理ネイティブスクリプトを登録します。
   * @ko DOM 소유권을 유지하며 관리 네이티브 스크립트를 등록합니다.
   * @param object - Host object, or null to clear the association.
   * @zh object - 宿主对象，或传 null 清除关联。
   * @ja object - ホストオブジェクト。null は関連付けを解除します。
   * @ko object - 호스트 객체이며 null은 연결을 해제합니다.
   * @remarks
   * Attached native trees retain the object. Detached closure cycles remain
   * collectible; clones start with null. Native RTTI stays unchanged.
   * @zh 挂接的原生树保留对象；脱离后的闭包环可回收，克隆初始为 null。
   * 原生 RTTI 保持不变。
   * @ja 接続ツリーが保持します。分離した循環は回収でき、複製は null。
   * ネイティブ RTTI は変わりません。
   * @ko 연결 트리가 유지합니다. 분리 순환은 수집 가능하며 복제는 null입니다.
   * 네이티브 RTTI는 유지됩니다.
   */
  setScriptObject(object: object | null): void {
    native.setElementScriptObject(this.handle, object);
  }

  /**
   * Read the actual native Rml::Element::GetClassIdentifier.
   *
   * @zh 读取真实原生类型的 Rml::Element::GetClassIdentifier。
   * @ja 実際のネイティブ型の Rml::Element::GetClassIdentifier を取得します。
   * @ko 실제 네이티브 유형의 Rml::Element::GetClassIdentifier를 읽습니다.
   * @returns Opaque token independent of the element tag and JS prototype.
   * @zh 与元素标签和 JS 原型无关的不透明令牌。
   * @ja 要素タグや JS プロトタイプに依存しない不透明トークン。
   * @ko 요소 태그 및 JS 프로토타입과 무관한 불투명 토큰입니다.
   */
  getClassIdentifier(): ClassIdentifier {
    return classIdentifier(native.getClassIdentifier(this.handle));
  }

  /**
   * Test native inheritance through Rml::Element::IsClass.
   *
   * @zh 通过 Rml::Element::IsClass 检查原生继承关系。
   * @ja Rml::Element::IsClass でネイティブ継承関係を確認します。
   * @ko Rml::Element::IsClass로 네이티브 상속 관계를 확인합니다.
   * @param identifier - Token obtained from this module's RTTI methods.
   * @zh identifier - 从本模块 RTTI 方法取得的令牌。
   * @ja identifier - このモジュールの RTTI メソッドで取得したトークン。
   * @ko identifier - 이 모듈의 RTTI 메서드로 얻은 토큰입니다.
   * @returns Whether this element has the given native class or a subclass.
   * @zh 此元素是否属于指定原生类或其子类。
   * @ja この要素が指定ネイティブ型またはその派生型に属するか。
   * @ko 요소가 지정한 네이티브 유형 또는 하위 유형인지 여부입니다.
   */
  isClass(identifier: ClassIdentifier): boolean {
    return native.isClass(this.handle, classIndex(identifier));
  }

  /**
   * Invoke virtual Rml::Element::ProcessDefaultAction with a live event.
   *
   * @zh 使用活事件调用虚方法 Rml::Element::ProcessDefaultAction。
   * @ja 有効なイベントで仮想 Rml::Element::ProcessDefaultAction を呼び出します。
   * @ko 유효한 이벤트로 가상 Rml::Element::ProcessDefaultAction을
   * 호출합니다.
   * @param event - Event from this element's currently executing listener.
   * @zh event - 此元素当前执行中的监听器收到的事件。
   * @ja event - この要素で実行中のリスナーが受け取ったイベント。
   * @ko event - 이 요소에서 실행 중인 리스너가 받은 이벤트입니다.
   * @remarks
   * The receiver must equal event.currentTarget. Preserves phase, parameters
   * and propagation state; even a stopped event runs its action. This does not
   * cancel the later automatic action. Use stopPropagation on an interruptible
   * event if it should run only manually. Sequential calls repeat native side
   * effects; reentry with the same event during a manual action is rejected.
   * @zh 接收者必须等于 event.currentTarget。保留阶段、参数及传播状态，
   * 已停止传播的事件也会执行动作。此调用不会取消后续自动动作；
   * 若只需手动执行，应对可中断事件调用 stopPropagation。
   * 顺序调用会重复原生副作用；同一事件的手动动作执行期间禁止重入。
   * @ja 対象は event.currentTarget と一致する必要があります。段階・引数・伝播状態を維持し、
   * 伝播停止後も動作します。後続の自動動作は取り消しません。手動のみなら中断可能な
   * イベントで stopPropagation を呼びます。逐次呼出しは副作用を繰り返し、同一イベントでの再入は禁止。
   * @ko 수신자는 event.currentTarget과 같아야 합니다. 단계, 매개변수, 전파 상태를 유지하며
   * 전파가 중단되어도 동작합니다. 후속 자동 동작은 취소하지 않습니다. 수동으로만 실행하려면
   * 중단 가능한 이벤트에서 stopPropagation을 호출합니다. 순차 호출은 부작용을 반복하며 같은 이벤트 재진입은 거부합니다.
   */
  processDefaultAction(event: RmlEvent): void {
    native.processDefaultAction(this.handle, eventHandle(event));
  }

  /**
   * Request focus through Rml::Element::Focus.
   *
   * @zh 通过 Rml::Element::Focus 请求焦点。
   * @ja Rml::Element::Focus でフォーカスを要求します。
   * @ko Rml::Element::Focus로 포커스를 요청합니다.
   * @param focusVisible - Activate focus-visible feedback; default false.
   * @zh focusVisible - 激活 focus-visible 反馈，默认 false。
   * @ja focusVisible - focus-visible 表示を有効にするか。既定値 false。
   * @ko focusVisible - focus-visible 표시 활성화 여부이며 기본값 false입니다.
   * @returns Whether the native focus request succeeded.
   * @zh 原生焦点请求是否成功。
   * @ja ネイティブのフォーカス要求が成功したか。
   * @ko 네이티브 포커스 요청 성공 여부입니다.
   */
  focus(focusVisible = false): boolean {
    return native.focusElement(this.handle, focusVisible);
  }

  /**
   * Release focus through Rml::Element::Blur.
   *
   * @zh 通过 Rml::Element::Blur 释放焦点。
   * @ja Rml::Element::Blur でフォーカスを解除します。
   * @ko Rml::Element::Blur로 포커스를 해제합니다.
   */
  blur(): void {
    native.blurElement(this.handle);
  }

  /**
   * Query the native virtual Rml::Element::GetIntrinsicDimensions.
   *
   * @zh 查询原生虚方法 Rml::Element::GetIntrinsicDimensions。
   * @ja ネイティブ仮想メソッド Rml::Element::GetIntrinsicDimensions を照会します。
   * @ko 네이티브 가상 메서드 Rml::Element::GetIntrinsicDimensions를 조회합니다.
   * @returns Success, intrinsic size and ratio; unused outputs are zero.
   * @zh 成功标志、固有尺寸和宽高比；未使用的输出为零。
   * @ja 成功フラグ・固有サイズ・縦横比。未使用の出力はゼロ。
   * @ko 성공 여부, 고유 크기와 종횡비이며 사용하지 않는 출력은 0입니다.
   */
  getIntrinsicDimensions(): IntrinsicDimensions {
    return native.getIntrinsicDimensions(this.handle);
  }

  /**
   * Clone attributes, styles and content through Rml::Element::Clone.
   *
   * @zh 通过 Rml::Element::Clone 复制属性、样式和内容。
   * @ja Rml::Element::Clone で属性・スタイル・内容を複製します。
   * @ko Rml::Element::Clone으로 속성, 스타일, 내용을 복제합니다.
   * @returns Owned detached clone, or null on factory failure; no JS listeners.
   * @zh 持有所有权的脱离副本；工厂失败时为 null，不复制 JS 监听器。
   * @ja 所有権付き未接続コピー。失敗時は null。JS リスナーは複製しません。
   * @ko 소유권이 있는 분리 복사본이며 실패 시 null입니다. JS 리스너는 복제하지 않습니다.
   */
  clone(): Element | null {
    const handle = native.cloneElement(this.handle);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Return Rml::Element::GetParentNode.
   *
   * @zh 返回 Rml::Element::GetParentNode。
   * @ja この要素の親要素を取得します。
   * @ko Rml::Element::GetParentNode를 반환합니다.
   * @returns Parent, or null while detached.
   * @zh 父节点；脱离状态时为 null。
   * @ja 親要素。未接続時は null。
   * @ko 부모 요소이며 분리 상태이면 null입니다.
   */
  getParentNode(): Element | null {
    const handle = native.getParentNode(this.handle);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Return Rml::Element::GetNextSibling.
   *
   * @zh 返回 Rml::Element::GetNextSibling。
   * @ja 同じ親を持つ次の要素を取得します。
   * @ko Rml::Element::GetNextSibling을 반환합니다.
   * @returns Next DOM sibling, or null.
   * @zh 下一个 DOM 兄弟节点，不存在时为 null。
   * @ja 次の DOM 兄弟要素。なければ null。
   * @ko 다음 DOM 형제 요소이며 없으면 null입니다.
   */
  getNextSibling(): Element | null {
    const handle = native.getNextSibling(this.handle);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Return Rml::Element::GetPreviousSibling.
   *
   * @zh 返回 Rml::Element::GetPreviousSibling。
   * @ja 同じ親を持つ前の要素を取得します。
   * @ko Rml::Element::GetPreviousSibling을 반환합니다.
   * @returns Previous DOM sibling, or null.
   * @zh 前一个 DOM 兄弟节点，不存在时为 null。
   * @ja 前の DOM 兄弟要素。なければ null。
   * @ko 이전 DOM 형제 요소이며 없으면 null입니다.
   */
  getPreviousSibling(): Element | null {
    const handle = native.getPreviousSibling(this.handle);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Return Rml::Element::GetFirstChild.
   *
   * @zh 返回 Rml::Element::GetFirstChild。
   * @ja 最初の子要素を取得します。
   * @ko Rml::Element::GetFirstChild를 반환합니다.
   * @returns First DOM child, or null.
   * @zh 第一个 DOM 子节点，不存在时为 null。
   * @ja 最初の DOM 子要素。なければ null。
   * @ko 첫 번째 DOM 자식 요소이며 없으면 null입니다.
   */
  getFirstChild(): Element | null {
    const handle = native.getFirstChild(this.handle);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Return Rml::Element::GetLastChild.
   *
   * @zh 返回 Rml::Element::GetLastChild。
   * @ja 最後の子要素を取得します。
   * @ko Rml::Element::GetLastChild를 반환합니다.
   * @returns Last DOM child, or null.
   * @zh 最后一个 DOM 子节点，不存在时为 null。
   * @ja 最後の DOM 子要素。なければ null。
   * @ko 마지막 DOM 자식 요소이며 없으면 null입니다.
   */
  getLastChild(): Element | null {
    const handle = native.getLastChild(this.handle);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Return Rml::Element::GetChild, including native non-DOM indices.
   *
   * @zh 返回 Rml::Element::GetChild，支持原生非 DOM 节点索引。
   * @ja 非 DOM 要素の添字も含め Rml::Element::GetChild を取得します。
   * @ko 비 DOM 요소 인덱스를 포함한 Rml::Element::GetChild를 반환합니다.
   * @param index - Zero-based int32 index.
   * @zh index - 从零开始的 int32 索引。
   * @ja index - 0 始まりの int32 添字。
   * @ko index - 0부터 시작하는 int32 인덱스입니다.
   * @returns Child, or null outside the native child range.
   * @zh 子节点，越界时为 null。
   * @ja 子要素。範囲外は null。
   * @ko 자식 요소이며 범위 밖이면 null입니다.
   */
  getChild(index: number): Element | null {
    const handle = native.getChild(this.handle, index);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Count children through Rml::Element::GetNumChildren.
   *
   * @zh 通过 Rml::Element::GetNumChildren 统计子节点。
   * @ja Rml::Element::GetNumChildren で子要素を数えます。
   * @ko Rml::Element::GetNumChildren으로 자식 요소 수를 셉니다.
   * @param includeNonDomElements - Include internal children; default false.
   * @zh includeNonDomElements - 包含内部子节点，默认为 false。
   * @ja includeNonDomElements - 内部要素を含むか。既定値は false。
   * @ko includeNonDomElements - 내부 요소 포함 여부이며 기본값은 false입니다.
   * @returns Native child count.
   * @zh 原生子节点数。
   * @ja ネイティブ子要素数。
   * @ko 네이티브 자식 요소 수입니다.
   */
  getNumChildren(includeNonDomElements = false): number {
    return native.getNumChildren(this.handle, includeNonDomElements);
  }

  /**
   * Check DOM children through Rml::Element::HasChildNodes.
   *
   * @zh 通过 Rml::Element::HasChildNodes 检查 DOM 子节点。
   * @ja Rml::Element::HasChildNodes で DOM 子要素を確認します。
   * @ko Rml::Element::HasChildNodes로 DOM 자식 요소를 확인합니다.
   * @returns Whether at least one DOM child exists.
   * @zh 是否存在至少一个 DOM 子节点。
   * @ja DOM 子要素が 1 つ以上存在するか。
   * @ko DOM 자식 요소가 하나 이상 존재하는지 여부입니다.
   */
  hasChildNodes(): boolean {
    return native.hasChildNodes(this.handle);
  }

  /**
   * Find a matching ancestor through Rml::Element::Closest.
   *
   * @zh 通过 Rml::Element::Closest 查找匹配的祖先，不包含自身。
   * @ja 自身を除く祖先を Rml::Element::Closest で検索します。
   * @ko 자신을 제외한 조상을 Rml::Element::Closest로 검색합니다.
   * @param selector - RCSS selector.
   * @zh selector - RCSS 选择器。
   * @ja selector - RCSS セレクター。
   * @ko selector - RCSS 선택자입니다.
   * @returns First matching ancestor, excluding this element, or null.
   * @zh 首个匹配祖先，不包含自身，不存在时为 null。
   * @ja 自身を除く最初の一致する祖先。なければ null。
   * @ko 자신을 제외한 첫 번째 일치 조상이며 없으면 null입니다.
   */
  closest(selector: string): Element | null {
    const handle = native.closest(this.handle, selector);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Test this element through Rml::Element::Matches.
   *
   * @zh 通过 Rml::Element::Matches 检查当前元素。
   * @ja Rml::Element::Matches で現在の要素を検査します。
   * @ko Rml::Element::Matches로 현재 요소를 검사합니다.
   * @param selector - RCSS selector.
   * @zh selector - RCSS 选择器。
   * @ja selector - RCSS セレクター。
   * @ko selector - RCSS 선택자입니다.
   * @returns Whether this element matches.
   * @zh 当前元素是否匹配。
   * @ja 現在の要素が一致するか。
   * @ko 현재 요소의 일치 여부입니다.
   */
  matches(selector: string): boolean {
    return native.matches(this.handle, selector);
  }

  /**
   * Test ancestry through Rml::Element::Contains, including this element.
   *
   * @zh 通过 Rml::Element::Contains 检查包含关系，包含自身。
   * @ja 自身を含む包含関係を Rml::Element::Contains で検査します。
   * @ko 자신을 포함한 포함 관계를 Rml::Element::Contains로 검사합니다.
   * @param element - Candidate node, or null.
   * @zh element - 待检查节点或 null。
   * @ja element - 検査する要素、または null。
   * @ko element - 검사할 요소 또는 null입니다.
   * @returns True for self or descendants, false for null or unrelated nodes.
   * @zh 自身或后代返回 true，null 或无关节点返回 false。
   * @ja 自身か子孫なら true、null や無関係な要素なら false。
   * @ko 자신이나 자손이면 true, null 또는 무관한 요소이면 false입니다.
   */
  contains(element: Element | null): boolean {
    return native.contains(
      this.handle, element === null ? null : element.handle,
    );
  }

  /**
   * Snapshot descendants through Rml::Element::QuerySelectorAll.
   *
   * @zh 通过 Rml::Element::QuerySelectorAll 获取后代快照。
   * @ja Rml::Element::QuerySelectorAll で子孫のスナップショットを取得します。
   * @ko Rml::Element::QuerySelectorAll로 자손 스냅샷을 가져옵니다.
   * @param selector - RCSS selector.
   * @zh selector - RCSS 选择器。
   * @ja selector - RCSS セレクター。
   * @ko selector - RCSS 선택자입니다.
   * @returns Stable array of live wrappers in native depth-first order.
   * @zh 按原生深度优先顺序排列的实时包装器数组；数组成员不随树变动。
   * @ja ネイティブの深さ優先順の有効なラッパー配列。配列の構成は固定です。
   * @ko 네이티브 깊이 우선 순서의 유효한 래퍼 배열이며 배열 구성은 고정됩니다.
   */
  querySelectorAll(selector: string): Element[] {
    return native.querySelectorAll(this.handle, selector).map(Element.wrap);
  }

  /**
   * Snapshot descendants through Rml::Element::GetElementsByTagName.
   *
   * @zh 通过 Rml::Element::GetElementsByTagName 获取后代快照。
   * @ja Rml::Element::GetElementsByTagName で子孫のスナップショットを取得します。
   * @ko Rml::Element::GetElementsByTagName으로 자손 스냅샷을 가져옵니다.
   * @param tag - Native tag name.
   * @zh tag - 原生标签名。
   * @ja tag - ネイティブタグ名。
   * @ko tag - 네이티브 태그 이름입니다.
   * @returns Snapshot array containing live wrappers.
   * @zh 包含实时包装器的快照数组。
   * @ja 有効なラッパーのスナップショット配列。
   * @ko 유효한 래퍼를 포함하는 스냅샷 배열입니다.
   */
  getElementsByTagName(tag: string): Element[] {
    return native.getElementsByTagName(this.handle, tag).map(Element.wrap);
  }

  /**
   * Snapshot descendants through Rml::Element::GetElementsByClassName.
   *
   * @zh 通过 Rml::Element::GetElementsByClassName 获取后代快照。
   * @ja Rml::Element::GetElementsByClassName で子孫を取得します。
   * @ko Rml::Element::GetElementsByClassName으로 자손을 가져옵니다.
   * @param name - Class name.
   * @zh name - 类名。
   * @ja name - クラス名。
   * @ko name - 클래스 이름입니다.
   * @returns Snapshot array containing live wrappers.
   * @zh 包含实时包装器的快照数组。
   * @ja 有効なラッパーのスナップショット配列。
   * @ko 유효한 래퍼를 포함하는 스냅샷 배열입니다.
   */
  getElementsByClassName(name: string): Element[] {
    return native.getElementsByClassName(this.handle, name).map(Element.wrap);
  }

  /**
   * Transfer a detached child through Rml::Element::AppendChild.
   *
   * @zh 通过 Rml::Element::AppendChild 转移脱离节点的所有权。
   * @ja Rml::Element::AppendChild で未接続要素の所有権を移します。
   * @ko Rml::Element::AppendChild로 분리 요소의 소유권을 이전합니다.
   * @param child - Owned detached node; remove an attached node first.
   * @zh child - 持有所有权的脱离节点，已挂载节点须先移除。
   * @ja child - 所有権付き未接続要素。接続済みなら先に取り外してください。
   * @ko child - 소유권이 있는 분리 요소이며 연결된 요소는 먼저 제거해야 합니다.
   * @param domElement - Include in DOM traversal; defaults to true.
   * @zh domElement - 是否参与 DOM 遍历，默认为 true。
   * @ja domElement - DOM 走査に含めるか。既定値は true。
   * @ko domElement - DOM 탐색 포함 여부이며 기본값은 true입니다.
   * @returns The same child wrapper.
   * @zh 同一个子节点包装器。
   * @ja 同じ子要素ラッパー。
   * @ko 동일한 자식 요소 래퍼입니다.
   * @remarks
   * Rejects cycles, context roots and active native/event subtrees.
   * Documents retain their context and can move only within that live context.
   * A context root accepts only its own documents as DOM children.
   * Ownership transfers once; listeners survive detaching and reinsertion.
   * Native widget internals are readable but cannot be removed or replaced;
   * non-DOM children inserted through these APIs remain transferable.
   * @zh 拒绝环、上下文根及活动原生调用或事件子树。
   * 文档保留原上下文，只能在该活动上下文内转移。上下文根只接受自己的文档作为 DOM 子节点。
   * 所有权只转移一次，监听器在脱离与重新插入后保留。
   * 原生控件内部节点可读，但不能移除或替换；通过这些接口添加的非 DOM 节点仍可转移。
   * @ja 循環・コンテキストルート・実行中の対象ツリーは拒否します。
   * 文書は元のコンテキストを保持し、その有効なコンテキスト内だけで移動できます。
   * コンテキストルートは自身の文書だけを DOM 子として受け入れます。
   * 所有権は一度だけ移り、リスナーは取り外しと再挿入後も保持されます。
   * 内部要素は読めますが取り外し・置換できません。API で追加した非 DOM 要素は移動できます。
   * @ko 순환, 컨텍스트 루트, 실행 중인 대상 트리는 거부합니다.
   * 문서는 원래 컨텍스트를 유지하며 해당 활성 컨텍스트 안에서만 이동할 수 있습니다.
   * 컨텍스트 루트는 자신의 문서만 DOM 자식으로 허용합니다.
   * 소유권은 한 번만 이전되며 리스너는 분리 및 재삽입 후에도 유지됩니다.
   * 내부 요소는 읽기만 가능하며 제거나 교체는 거부합니다. API로 추가한 비 DOM 요소는 이전됩니다.
   */
  appendChild(child: Element, domElement = true): Element {
    return Element.wrap(native.appendChild(
      this.handle, child.handle, domElement,
    ));
  }

  /**
   * Transfer a detached child through Rml::Element::InsertBefore.
   *
   * @zh 通过 Rml::Element::InsertBefore 转移脱离节点的所有权。
   * @ja Rml::Element::InsertBefore で未接続要素の所有権を移します。
   * @ko Rml::Element::InsertBefore로 분리 요소의 소유권을 이전합니다.
   * @param child - Detached node, subject to appendChild ownership checks.
   * @zh child - 脱离节点，遵守 appendChild 的所有权检查。
   * @ja child - 未接続要素。appendChild と同じ所有権検証を行います。
   * @ko child - 분리 요소이며 appendChild와 같은 소유권 검사를 적용합니다.
   * @param adjacent - Reference child; null or a non-child appends to the DOM.
   * @zh adjacent - 参考子节点；为 null 或非子节点时追加到 DOM。
   * @ja adjacent - 基準の子要素。null や子以外なら DOM 末尾に追加します。
   * @ko adjacent - 기준 자식 요소이며 null 또는 자식이 아니면 DOM 끝에 추가합니다.
   * @returns Same child, inheriting the reference child's DOM/non-DOM status.
   * @zh 同一子节点，继承参考子节点的 DOM 或非 DOM 状态。
   * @ja 同じ子要素。基準要素の DOM/非 DOM 区分を継承します。
   * @ko 동일한 자식 요소이며 기준 요소의 DOM/비 DOM 상태를 상속합니다.
   */
  insertBefore(child: Element, adjacent: Element | null): Element {
    return Element.wrap(native.insertBefore(
      this.handle, child.handle, adjacent === null ? null : adjacent.handle,
    ));
  }

  /**
   * Transfer ownership through Rml::Element::ReplaceChild.
   *
   * @zh 通过 Rml::Element::ReplaceChild 转移节点所有权。
   * @ja Rml::Element::ReplaceChild で要素の所有権を移します。
   * @ko Rml::Element::ReplaceChild로 요소 소유권을 이전합니다.
   * @param child - Detached replacement, subject to appendChild checks.
   * @zh child - 脱离的替换节点，遵守 appendChild 检查。
   * @ja child - 未接続の置換要素。appendChild と同じ検証を行います。
   * @ko child - 분리된 대체 요소이며 appendChild와 같은 검사를 적용합니다.
   * @param replaced - Existing child; null or a non-child appends instead.
   * @zh replaced - 现有子节点；为 null 或非子节点时改为追加。
   * @ja replaced - 既存の子要素。null や子以外なら追加します。
   * @ko replaced - 기존 자식 요소이며 null 또는 자식이 아니면 추가합니다.
   * @returns Detached replaced node with ownership, or null when appended.
   * @zh 持有所有权的被替换脱离节点；追加时为 null。
   * @ja 所有権付きで取り外した要素。追加した場合は null。
   * @ko 소유권이 있는 분리된 기존 요소이며 추가한 경우 null입니다.
   */
  replaceChild(child: Element, replaced: Element | null): Element | null {
    const handle = native.replaceChild(
      this.handle, child.handle, replaced === null ? null : replaced.handle,
    );
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Take ownership through Rml::Element::RemoveChild.
   *
   * @zh 通过 Rml::Element::RemoveChild 取得子节点所有权。
   * @ja Rml::Element::RemoveChild で子要素の所有権を取得します。
   * @ko Rml::Element::RemoveChild로 자식 요소 소유권을 가져옵니다.
   * @param child - Child to detach; active native/event subtrees reject.
   * @zh child - 要脱离的子节点；活动原生调用或事件子树会被拒绝。
   * @ja child - 取り外す子要素。実行中のネイティブ・イベント対象は拒否します。
   * @ko child - 분리할 자식 요소이며 활성 네이티브/이벤트 대상은 거부합니다.
   * @returns Same detached wrapper, or null if it is not a child of this node.
   * @zh 同一脱离包装器；不是当前节点的子节点时为 null。
   * @ja 同じ未接続ラッパー。現在の要素の子でなければ null。
   * @ko 동일한 분리 래퍼이며 현재 요소의 자식이 아니면 null입니다.
   */
  removeChild(child: Element): Element | null {
    const handle = native.removeChild(this.handle, child.handle);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Find an element by id in the owning document.
   *
   * @zh 在所属文档中按 id 查找元素。
   * @ja 所属文書内で id により要素を検索します。
   * @ko 소유 문서에서 id로 요소를 찾습니다.
   * @param id - Element id.
   * @zh id - 元素 id。
   * @ja id - 要素の id。
   * @ko id - 요소 id입니다.
   * @returns Matching element or null.
   * @zh 匹配的元素；不存在时为 null。
   * @ja 一致する要素。存在しない場合は null。
   * @ko 일치하는 요소이며 없으면 null입니다.
   * @remarks
   * Searches the whole owning document breadth first, including siblings.
   * Without an owner, searches from this element. Special tokens are `#self`,
   * `#document` and `#parent`.
   * Use {@link querySelector} for descendant searches.
   * @zh 广度优先搜索整个所属文档，包括兄弟元素；没有所属文档时从当前元素开始。
   * RmlUi 还接受 `#self`、`#document`、`#parent`。
   * 仅搜索后代时使用 {@link querySelector}。
   * @ja 兄弟を含む所属文書全体を幅優先で検索し、文書がなければ現在の要素から検索します。
   * `#self`、`#document`、`#parent` も使用できます。
   * 子孫だけの検索には {@link querySelector} を使ってください。
   * @ko 소유 문서 전체를 너비 우선으로 검색하며 문서가 없으면 현재 요소에서 찾습니다.
   * `#self`, `#document`, `#parent`도 지원합니다.
   * 하위 요소만 검색하려면 {@link querySelector}를 사용하세요.
   */
  getElementById(id: string): Element | null {
    const handle = native.getElementById(this.handle, id);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Find the first matching descendant in native depth-first order.
   *
   * @zh 按原生深度优先顺序查找首个匹配 CSS 选择器的后代元素。
   * @ja ネイティブの深さ優先順で CSS セレクターに一致する最初の子孫を検索します。
   * @ko 네이티브 깊이 우선 순서로 CSS 선택자와 일치하는 첫 번째 하위 요소를 찾습니다.
   * @param selector - CSS selector.
   * @zh selector - CSS 选择器。
   * @ja selector - CSS セレクター。
   * @ko selector - CSS 선택자입니다.
   * @returns Matching element or null.
   * @zh 匹配的元素；不存在时为 null。
   * @ja 一致する要素。存在しない場合は null。
   * @ko 일치하는 요소이며 없으면 null입니다.
   */
  querySelector(selector: string): Element | null {
    const handle = native.querySelector(this.handle, selector);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Add or remove a class.
   *
   * @zh 添加或移除一个 class。
   * @ja クラスを追加または削除します。
   * @ko 클래스를 추가하거나 제거합니다.
   * @param className - Class name.
   * @zh className - 类名。
   * @ja className - クラス名。
   * @ko className - 클래스 이름입니다.
   * @param activate - True adds, false removes.
   * @zh activate - 为 true 时添加，为 false 时移除。
   * @ja activate - true で追加、false で削除します。
   * @ko activate - true이면 추가하고 false이면 제거합니다.
   */
  setClass(className: string, activate: boolean): void {
    native.setClass(this.handle, className, activate);
  }

  /**
   * Return whether a class is set.
   *
   * @zh 返回 class 是否存在。
   * @ja クラスが設定されているかを調べます。
   * @ko 클래스가 설정되어 있는지 확인합니다.
   * @param className - Class name.
   * @zh className - 类名。
   * @ja className - クラス名。
   * @ko className - 클래스 이름입니다.
   * @returns True when the class is present.
   * @zh class 存在时为 true。
   * @ja クラスが設定されていれば true。
   * @ko 클래스가 설정되어 있으면 true입니다.
   */
  isClassSet(className: string): boolean {
    return native.isClassSet(this.handle, className);
  }

  /**
   * Replace all classes with Rml::Element::SetClassNames.
   *
   * @zh 通过 SetClassNames 替换全部类名。
   * @ja SetClassNames でクラス名全体を置き換えます。
   * @ko SetClassNames로 모든 클래스 이름을 교체합니다.
   * @param names - Space-separated native class names.
   * @zh names - 以空格分隔的原生类名。
   * @ja names - 空白区切りのネイティブクラス名。
   * @ko names - 공백으로 구분된 네이티브 클래스 이름입니다.
   */
  setClassNames(names: string): void {
    native.setClassNames(this.handle, names);
  }

  /**
   * Read Rml::Element::GetClassNames as a space-separated string.
   *
   * @zh 读取 GetClassNames，返回空格分隔的类名字符串。
   * @ja GetClassNames の空白区切り文字列を取得します。
   * @ko GetClassNames의 공백 구분 문자열을 읽습니다.
   * @returns Native class list.
   * @zh 原生类名列表。
   * @ja ネイティブクラス名一覧。
   * @ko 네이티브 클래스 목록입니다.
   */
  getClassNames(): string {
    return native.getClassNames(this.handle);
  }

  /**
   * Set a native pseudo-class through Rml::Element::SetPseudoClass.
   *
   * @zh 通过 SetPseudoClass 设置原生伪类。
   * @ja SetPseudoClass でネイティブ疑似クラスを設定します。
   * @ko SetPseudoClass로 네이티브 의사 클래스를 설정합니다.
   * @param name - Pseudo-class name without a colon.
   * @zh name - 不含冒号的伪类名。
   * @ja name - コロンを含まない疑似クラス名。
   * @ko name - 콜론 없는 의사 클래스 이름입니다.
   * @param active - Whether to activate it.
   * @zh active - 是否启用。
   * @ja active - 有効にするかどうか。
   * @ko active - 활성화 여부입니다.
   */
  setPseudoClass(name: string, active: boolean): void {
    native.setPseudoClass(this.handle, name, active);
  }

  /**
   * Query Rml::Element::IsPseudoClassSet.
   *
   * @zh 查询 IsPseudoClassSet。
   * @ja IsPseudoClassSet を照会します。
   * @ko IsPseudoClassSet을 조회합니다.
   * @param name - Pseudo-class name.
   * @zh name - 伪类名。
   * @ja name - 疑似クラス名。
   * @ko name - 의사 클래스 이름입니다.
   * @returns Whether the pseudo-class is active.
   * @zh 伪类是否启用。
   * @ja 疑似クラスが有効かどうか。
   * @ko 의사 클래스 활성화 여부입니다.
   */
  isPseudoClassSet(name: string): boolean {
    return native.isPseudoClassSet(this.handle, name);
  }

  /**
   * Query Rml::Element::ArePseudoClassesSet for every name.
   *
   * @zh 使用 ArePseudoClassesSet 检查全部伪类。
   * @ja ArePseudoClassesSet ですべての疑似クラスを確認します。
   * @ko ArePseudoClassesSet으로 모든 의사 클래스를 확인합니다.
   * @param names - Names to check; an empty list returns true.
   * @zh names - 待检查名称；空列表返回 true。
   * @ja names - 確認する名前。空の一覧は true を返します。
   * @ko names - 확인할 이름이며 빈 목록은 true를 반환합니다.
   * @returns Whether all names are active.
   * @zh 是否全部启用。
   * @ja すべて有効かどうか。
   * @ko 모두 활성화되어 있는지 여부입니다.
   */
  arePseudoClassesSet(names: readonly string[]): boolean {
    return native.arePseudoClassesSet(this.handle, names);
  }

  /**
   * Copy Rml::Element::GetActivePseudoClasses.
   *
   * @zh 复制 GetActivePseudoClasses 的结果。
   * @ja GetActivePseudoClasses の結果をコピーします。
   * @ko GetActivePseudoClasses의 결과를 복사합니다.
   * @returns Independent snapshot in native order.
   * @zh 按原生顺序排列的独立快照。
   * @ja ネイティブ順序の独立したスナップショット。
   * @ko 네이티브 순서의 독립 스냅샷입니다.
   */
  getActivePseudoClasses(): string[] {
    return native.getActivePseudoClasses(this.handle);
  }

  /**
   * Format Rml::Element::GetAddress, from this leaf toward its parents.
   *
   * @zh 使用 GetAddress 格式化地址，从当前叶节点指向父节点。
   * @ja GetAddress で現在の葉から親へ向かうアドレスを生成します。
   * @ko GetAddress로 현재 리프에서 부모 방향의 주소를 만듭니다.
   * @param includePseudoClasses - Include pseudo-classes; defaults to false.
   * @zh includePseudoClasses - 是否包含伪类，默认 false。
   * @ja includePseudoClasses - 疑似クラスを含めるか。既定値は false。
   * @ko includePseudoClasses - 의사 클래스 포함 여부이며 기본값은 false입니다.
   * @param includeParents - Include ancestor addresses; defaults to true.
   * @zh includeParents - 是否包含祖先地址，默认 true。
   * @ja includeParents - 祖先のアドレスを含めるか。既定値は true。
   * @ko includeParents - 조상 주소 포함 여부이며 기본값은 true입니다.
   * @returns Native address string, not a CSS selector.
   * @zh 原生地址字符串，不是 CSS 选择器。
   * @ja CSS セレクターではないネイティブアドレス文字列。
   * @ko CSS 선택자가 아닌 네이티브 주소 문자열입니다.
   */
  getAddress(includePseudoClasses = false, includeParents = true): string {
    return native.getAddress(
      this.handle, includePseudoClasses, includeParents,
    );
  }

  /**
   * Set a local RCSS property through Rml::Element::SetProperty.
   *
   * @zh 通过 Rml::Element::SetProperty 设置局部 RCSS 属性。
   * @ja Rml::Element::SetProperty でローカル RCSS プロパティを設定します。
   * @ko Rml::Element::SetProperty로 로컬 RCSS 속성을 설정합니다.
   * @param name - Property name for RCSS text, or PropertyId for a typed value.
   * @zh name - RCSS 文本使用属性名，类型化值使用 PropertyId。
   * @ja name - RCSS 文字列には名前、型付き値には PropertyId。
   * @ko name - RCSS 문자열은 이름, 형식 값은 PropertyId를 사용합니다.
   * @param value - RCSS text or a native Property copied by value.
   * @zh value - RCSS 文本或按值复制的原生 Property。
   * @ja value - RCSS 文字列または値コピーする Property。
   * @ko value - RCSS 문자열 또는 값으로 복사하는 Property입니다.
   * @returns Whether the property was applied.
   * @zh 属性是否成功应用。
   * @ja プロパティを適用できたかどうか。
   * @ko 속성 적용 성공 여부입니다.
   */
  setProperty(name: string, value: string): boolean;
  setProperty(name: PropertyId, value: Property): boolean;
  setProperty(name: string | PropertyId, value: string | Property): boolean {
    if (typeof name === 'string' && typeof value === 'string') {
      return native.setProperty(this.handle, name, value);
    }
    if (typeof name === 'number' && value instanceof Property) {
      return native.setTypedProperty(this.handle, name, propertyHandle(value));
    }
    throw new TypeError('Expected (name, RCSS text) or (PropertyId, Property)');
  }

  /**
   * Copy Rml::Element::GetProperty into an owned property.
   *
   * @zh 将 Rml::Element::GetProperty 结果复制为自有属性。
   * @ja Rml::Element::GetProperty の結果を所有プロパティにコピーします。
   * @ko Rml::Element::GetProperty 결과를 소유 속성으로 복사합니다.
   * @remarks
   * Includes inheritance and defaults. Resolve cascading variables after a
   * context update.
   * @zh 包含继承及默认值；层叠变量应在上下文更新后读取。
   * @ja 継承と既定値を含みます。変数はコンテキスト更新後に解決します。
   * @ko 상속과 기본값을 포함합니다. 변수는 컨텍스트 갱신 후 읽습니다.
   * @param name - Property name or native id.
   * @zh name - 属性名或原生编号。
   * @ja name - 属性名またはネイティブ ID。
   * @ko name - 속성 이름 또는 네이티브 식별자입니다.
   * @returns Owned property or null when absent.
   * @zh 自有属性；不存在时返回 null。
   * @ja 所有プロパティ。存在しない場合は null。
   * @ko 소유 속성이며 없으면 null입니다.
   */
  getProperty(name: string | PropertyId): Property | null;

  /**
   * Read Rml::Element::GetProperty<T> using a native type exemplar.
   *
   * @zh 使用原生类型样本读取 Rml::Element::GetProperty<T>。
   * @ja ネイティブ型の見本で Rml::Element::GetProperty<T> を読み取ります。
   * @ko 네이티브 형식 예제로 Rml::Element::GetProperty<T>를 읽습니다.
   * @remarks
   * Includes inheritance and defaults. Resolve cascading variables after a
   * context update. Missing properties and failed conversions return T{};
   * the exemplar's value is not a fallback.
   * @zh 包含继承及默认值；层叠变量应在上下文更新后读取。缺失或转换失败时返回
   * T{}；样本值不作为回退值。
   * @ja 継承と既定値を含みます。変数は更新後に解決します。欠落・変換失敗時は
   * T{} を返し、見本の値はフォールバックに使いません。
   * @ko 상속과 기본값을 포함합니다. 변수는 갱신 후 읽습니다. 누락·변환 실패 시
   * T{}를 반환하며 예제의 값은 대체 값으로 사용하지 않습니다.
   * @template T - Native conversion type selected by the exemplar.
   * @zh T - 由样本选择的原生转换类型。
   * @ja T - 見本で選択するネイティブ変換型。
   * @ko T - 예제로 선택하는 네이티브 변환 형식입니다.
   * @param name - Property name.
   * @zh name - 属性名。
   * @ja name - プロパティ名。
   * @ko name - 속성 이름입니다.
   * @param type - Native conversion type exemplar.
   * @zh type - 原生转换类型样本。
   * @ja type - ネイティブ変換型の見本。
   * @ko type - 네이티브 변환 형식 예제입니다.
   * @returns Converted value or the native type's default value.
   * @zh 转换值或原生类型的默认值。
   * @ja 変換値、またはネイティブ型の既定値。
   * @ko 변환 값 또는 네이티브 형식의 기본값입니다.
   */
  getProperty<const T extends VariantConversionDefault>(
    name: string, type: T,
  ): VariantResult<T>;
  getProperty(
    name: string | PropertyId, type?: VariantConversionDefault,
  ): Property | VariantConversionDefault | null {
    if (type !== undefined) {
      return variantFromNative(native.getProperty(
        this.handle, name, variantToNative(type, true),
      )) as VariantConversionDefault;
    }
    const value = native.getProperty(this.handle, name);
    return value ? propertyFromNative(value) : null;
  }

  /**
   * Copy GetLocalProperty, including RCSS rules but excluding inherited values.
   *
   * @zh 复制 GetLocalProperty，包含 RCSS 规则，不含继承值，且不解析变量。
   * @ja RCSS 規則を含み、継承値を除いた GetLocalProperty。変数は未解決です。
   * @ko RCSS 규칙을 포함하고 상속 값은 제외합니다. 변수는 해석하지 않습니다.
   * @param name - Property name or native id.
   * @zh name - 属性名或原生编号。
   * @ja name - 属性名またはネイティブ ID。
   * @ko name - 속성 이름 또는 네이티브 식별자입니다.
   * @returns Owned local property or null.
   * @zh 自有局部属性或 null。
   * @ja 所有ローカル属性または null。
   * @ko 소유 로컬 속성 또는 null입니다.
   */
  getLocalProperty(name: string | PropertyId): Property | null {
    const value = native.getLocalProperty(this.handle, name);
    return value ? propertyFromNative(value) : null;
  }

  /**
   * Snapshot GetLocalStyleProperties, excluding classes and custom variables.
   *
   * @zh 获取 GetLocalStyleProperties 快照，不含类规则及自定义变量。
   * @ja クラス規則とカスタム変数を除いた GetLocalStyleProperties のコピー。
   * @ko 클래스 규칙과 사용자 변수를 제외한 GetLocalStyleProperties 복사본입니다.
   * @returns Map of native ids to owned property copies.
   * @zh 原生编号到自有属性副本的 Map。
   * @ja ネイティブ ID と所有属性コピーの Map。
   * @ko 네이티브 식별자와 소유 속성 복사본의 Map입니다.
   */
  getLocalStyleProperties(): Map<PropertyId, Property> {
    return new Map(native.getLocalStyleProperties(this.handle)
      .map(([ id, value ]) => [ id, propertyFromNative(value) ]));
  }

  /**
   * Snapshot Rml::Element::IterateLocalProperties in one native traversal.
   *
   * @zh 一次原生遍历复制 Rml::Element::IterateLocalProperties。
   * @ja 一度のネイティブ走査で Rml::Element::IterateLocalProperties をコピーします。
   * @ko 한 번의 네이티브 순회로 Rml::Element::IterateLocalProperties를 복사합니다.
   * @param filterInheritedBy - Keep only properties inherited by this element.
   * @zh filterInheritedBy - 仅保留该元素实际继承的属性；null 表示不筛选。
   * @ja filterInheritedBy - この要素が実際に継承する属性のみ。null は絞り込みなし。
   * @ko filterInheritedBy - 이 요소가 실제로 상속하는 속성만 유지하며 null은 전체입니다.
   * @returns Native-order name/property pairs with independent owned values.
   * @zh 按原生顺序排列的名称和属性对；值为独立的自有副本。
   * @ja ネイティブ順の名前と属性の組。値は独立した所有コピーです。
   * @ko 네이티브 순서의 이름과 속성 쌍이며 값은 독립 소유 복사본입니다.
   * @remarks
   * Includes inline and stylesheet/class properties, custom variables and
   * variable shorthands. Native override and inheritance filtering apply.
   * Copies remain readable after later style mutation or element destruction.
   * @zh 包含行内、样式表或类属性、自定义变量及含变量的简写；遵循原生覆盖和继承筛选。
   * 后续样式变更或元素销毁不会影响副本。
   * @ja インライン・シート・クラス属性、変数と変数付き略記を含み、ネイティブの
   * 上書きと継承絞り込みに従います。後の変更や要素破棄もコピーには影響しません。
   * @ko 인라인, 시트, 클래스 속성과 변수 및 변수 약식을 포함하며 네이티브 재정의와
   * 상속 필터를 적용합니다. 이후 변경이나 요소 파괴는 복사본에 영향을 주지 않습니다.
   */
  iterateLocalProperties(
    filterInheritedBy: Element | null = null,
  ): Array<[string, Property]> {
    return native.iterateLocalProperties(this.handle,
      filterInheritedBy === null ? null : filterInheritedBy.handle)
      .map(([ name, value ]) => [ name, propertyFromNative(value) ]);
  }

  /**
   * Remove a local CSS override (Rml::Element::RemoveProperty).
   *
   * @zh 移除局部 CSS 覆盖值，对应 Rml::Element::RemoveProperty。
   * @ja Rml::Element::RemoveProperty でローカル CSS の上書きを解除します。
   * @ko Rml::Element::RemoveProperty로 로컬 CSS 재정의를 제거합니다.
   * @param name - Native id or name, including variables like `--accent`.
   * @zh name - 原生编号或名称，支持 `--accent` 等自定义变量。
   * @ja name - ID または名前。`--accent` などの変数も含みます。
   * @ko name - 식별자 또는 이름이며 `--accent` 같은 변수도 지원합니다.
   */
  removeProperty(name: string | PropertyId): void {
    if (typeof name === 'string') {
      native.removeProperty(this.handle, name);
    } else {
      native.removeTypedProperty(this.handle, name);
    }
  }

  /**
   * Inner RML markup.
   *
   * @zh 内部 RML 标记。
   * @ja 内部の RML マークアップ。
   * @ko 내부 RML 마크업입니다.
   * @returns Inner markup string.
   * @zh 内部标记字符串。
   * @ja 内部マークアップの文字列。
   * @ko 내부 마크업 문자열입니다.
   */
  get innerRML(): string {
    return native.getInnerRML(this.handle);
  }

  /**
   * Replace child markup through Rml::Element::SetInnerRML.
   *
   * @zh 通过 Rml::Element::SetInnerRML 替换子元素标记。
   * @ja Rml::Element::SetInnerRML で子要素のマークアップを置換します。
   * @ko Rml::Element::SetInnerRML로 하위 마크업을 교체합니다.
   * @param rml - New markup; existing child wrappers become invalid.
   * @zh rml - 新标记；现有子元素包装器随之失效。
   * @ja rml - 新しいマークアップ。既存の子要素ラッパーは無効になります。
   * @ko rml - 새 마크업이며 기존 하위 요소 래퍼는 무효화됩니다.
   */
  set innerRML(rml: string) {
    native.setInnerRML(this.handle, rml);
  }

  /**
   * Read an attribute as a string.
   *
   * @zh 以字符串读取属性。
   * @ja 属性を文字列として読み取ります。
   * @ko 속성을 문자열로 읽습니다.
   * @param name - Attribute name.
   * @zh name - 属性名。
   * @ja name - 属性名。
   * @ko name - 속성 이름입니다.
   * @returns Attribute value or null when absent.
   * @zh 属性值；不存在时为 null。
   * @ja 属性値。存在しない場合は null。
   * @ko 속성 값이며 없으면 null입니다.
   */
  getAttribute(name: string): string | null;

  /**
   * Read Rml::Element::GetAttribute<T> using the default's native type.
   *
   * @zh 按默认值的原生类型读取 GetAttribute<T>。
   * @ja 既定値のネイティブ型で GetAttribute<T> を読み取ります。
   * @ko 기본값의 네이티브 유형으로 GetAttribute<T>를 읽습니다.
   * @template T - Native conversion type selected by the default value.
   * @zh T - 由默认值选择的原生转换类型。
   * @ja T - 既定値で選択するネイティブ変換型。
   * @ko T - 기본값으로 선택하는 네이티브 변환 형식입니다.
   * @param name - Attribute name.
   * @zh name - 属性名。
   * @ja name - 属性名。
   * @ko name - 속성 이름입니다.
   * @param defaultValue - Non-null fallback, selecting native conversion.
   * @zh defaultValue - 非空回退值，其类型决定原生转换方式。
   * @ja defaultValue - ネイティブ変換型を選択する null 以外の既定値。
   * @ko defaultValue - 네이티브 변환 유형을 선택하는 null 아닌 기본값입니다.
   * @returns Native converted value, initialized with the fallback.
   * @zh 原生转换结果，以回退值初始化。
   * @ja 既定値で初期化したネイティブ変換結果。
   * @ko 기본값으로 초기화한 네이티브 변환 결과입니다.
   * @remarks
   * Numbers select double; BigInt selects int64, or uint64 above INT64_MAX.
   * Unsafe number-to-integer conversions throw. Vectors and colours are copied.
   * Missing keys retain the fallback; invalid numeric strings become zero
   * for a number default, following native atof conversion.
   * @zh number 选择 double；BigInt 选择 int64，超过 INT64_MAX 时选择 uint64。
   * 不安全的数字到整数转换会抛错。向量与颜色按值复制。
   * 缺失键保留回退值；number 默认值按原生 atof 将无效数字字符串转换为零。
   * @ja number は double、BigInt は int64、INT64_MAX 超では uint64 です。
   * 危険な数値から整数への変換は例外になります。ベクトルと色はコピーです。
   * キーなしは既定値です。number 型の無効な数値文字列は atof によりゼロです。
   * @ko number는 double, BigInt는 int64, INT64_MAX 초과는 uint64입니다.
   * 안전하지 않은 정수 변환은 예외를 던집니다. 벡터와 색은 복사합니다.
   * 누락 키는 기본값이며 number 유형의 잘못된 숫자 문자열은 atof로 0이 됩니다.
   */
  getAttribute<const T extends VariantConversionDefault>(
    name: string, defaultValue: T,
  ): AttributeResult<T>;
  getAttribute(
    name: string, defaultValue?: AttributeValue,
  ): VariantReadValue {
    return variantFromNative(native.getAttribute(
      this.handle, name, variantToNative(defaultValue, true),
    ));
  }

  /**
   * Copy the raw Rml::Variant returned by Rml::Element::GetAttribute.
   *
   * @zh 复制 GetAttribute 返回的原始 Rml::Variant。
   * @ja GetAttribute が返す生の Rml::Variant をコピーします。
   * @ko GetAttribute가 반환하는 원시 Rml::Variant를 복사합니다.
   * @param name - Attribute name.
   * @zh name - 属性名。
   * @ja name - 属性名。
   * @ko name - 속성 이름입니다.
   * @returns Copied value; null for an absent attribute or native NONE.
   * @zh 值快照；属性不存在或原生类型为 NONE 时返回 null。
   * @ja 値のコピー。属性なしまたはネイティブ NONE の場合は null。
   * @ko 값 복사본이며 속성 없음 또는 네이티브 NONE은 null입니다.
   */
  getAttributeValue(name: string): VariantReadValue {
    return variantFromNative(native.getAttributeValue(this.handle, name));
  }

  /**
   * Read GetAttribute<ScriptInterface*> with a checked element fallback.
   *
   * @zh 以受检查的元素回退值读取 GetAttribute<ScriptInterface*>。
   * @ja 検証済み要素を既定値にして GetAttribute<ScriptInterface*> を読みます。
   * @ko 검증된 요소 대체 값으로 GetAttribute<ScriptInterface*>를 읽습니다.
   * @param name - Attribute name.
   * @zh name - 属性名。
   * @ja name - 属性名。
   * @ko name - 속성 이름입니다.
   * @param defaultValue - Fallback for an absent key or failed conversion.
   * @zh defaultValue - 键缺失或转换失败时的回退元素，默认 null。
   * @ja defaultValue - キーなし・変換失敗時の既定要素。既定は null。
   * @ko defaultValue - 키 누락 또는 변환 실패 시 대체 요소이며 기본값은 null입니다.
   * @returns Live element; a destroyed stored target converts to null.
   * @zh 存活元素；已销毁的保存目标转换为 null。
   * @ja 有効な要素。保存された対象が破棄済みなら null。
   * @ko 유효한 요소이며 저장 대상이 파괴된 경우 null입니다.
   */
  getElementAttribute(
    name: string, defaultValue: Element | null = null,
  ): Element | null {
    if (defaultValue !== null && !(defaultValue instanceof Element)) {
      throw new TypeError('Expected an Element fallback or null');
    }
    const handle = native.getElementAttribute(
      this.handle, name, defaultValue === null ? null : defaultValue.handle);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Query Rml::Element::HasAttribute, including attributes holding NONE.
   *
   * @zh 查询 HasAttribute，包括值为 NONE 的属性。
   * @ja NONE 値の属性を含めて HasAttribute を照会します。
   * @ko NONE 값 속성을 포함하여 HasAttribute를 조회합니다.
   * @param name - Attribute name.
   * @zh name - 属性名。
   * @ja name - 属性名。
   * @ko name - 속성 이름입니다.
   * @returns Whether the key exists.
   * @zh 键是否存在。
   * @ja キーが存在するかどうか。
   * @ko 키의 존재 여부입니다.
   */
  hasAttribute(name: string): boolean {
    return native.hasAttribute(this.handle, name);
  }

  /**
   * Copy all values from Rml::Element::GetAttributes.
   *
   * @zh 复制 GetAttributes 中的全部值。
   * @ja GetAttributes のすべての値をコピーします。
   * @ko GetAttributes의 모든 값을 복사합니다.
   * @returns Independent snapshot with own data properties.
   * @zh 使用自有数据属性的独立快照。
   * @ja 独自のデータプロパティを持つ独立したスナップショット。
   * @ko 자체 데이터 속성을 가진 독립 스냅샷입니다.
   */
  getAttributes(): Record<string, VariantReadValue> {
    return Object.fromEntries(Object.entries(native.getAttributes(this.handle))
      .map(([ name, value ]) => [ name, variantFromNative(value) ]));
  }

  /**
   * Get the number of attribute keys on the element.
   *
   * @zh 获取元素的属性键数量。
   * @ja 要素の属性キーの数を取得します。
   * @ko 요소의 속성 키 수를 가져옵니다.
   * @returns Number of native attribute keys.
   * @zh 原生属性键数量。
   * @ja ネイティブ属性キーの数。
   * @ko 네이티브 속성 키 개수입니다.
   */
  getNumAttributes(): number {
    return native.getNumAttributes(this.handle);
  }

  /**
   * Merge attributes through Rml::Element::SetAttributes.
   *
   * @zh 通过 SetAttributes 合并属性。
   * @ja SetAttributes で属性をマージします。
   * @ko SetAttributes로 속성을 병합합니다.
   * @param attributes - Owned values, fully converted before native mutation.
   * @zh attributes - 属性拥有的值；全部转换完成后才修改原生状态。
   * @ja attributes - 所有される値。全変換後にネイティブ状態を変更します。
   * @ko attributes - 소유되는 값이며 모두 변환한 후 네이티브를 변경합니다.
   * @remarks
   * Other keys remain. Native OnAttributeChange runs once for this group.
   * @zh 其他键保留。原生 OnAttributeChange 对整组属性调用一次。
   * @ja 他のキーは保持され、グループ全体で OnAttributeChange を一度呼びます。
   * @ko 다른 키는 유지되며 그룹 전체에 OnAttributeChange를 한 번 호출합니다.
   */
  setAttributes(attributes: Readonly<Record<string, AttributeValue>>): void {
    if (typeof attributes !== 'object' || attributes === null ||
        Array.isArray(attributes)) {
      throw new TypeError('Expected an attribute Variant dictionary');
    }
    native.setAttributes(this.handle, Object.fromEntries(
      Object.entries(attributes).map(([ name, value ]) => [
        name, variantToNative(value),
      ]),
    ));
  }

  /**
   * Set an attribute value.
   *
   * @zh 设置属性值。
   * @ja 属性の値を設定します。
   * @ko 속성 값을 설정합니다.
   * @param name - Attribute name.
   * @zh name - 属性名。
   * @ja name - 属性名。
   * @ko name - 속성 이름입니다.
   * @param value - Owned Variant value; null stores native NONE.
   * @zh value - 属性拥有的 Variant 值；null 存储原生 NONE。
   * @ja value - 所有する Variant 値。null はネイティブ NONE を保存します。
   * @ko value - 소유되는 Variant 값이며 null은 네이티브 NONE을 저장합니다.
   */
  setAttribute(
    name: string, value: AttributeValue,
  ): void {
    native.setAttribute(this.handle, name, variantToNative(value));
  }

  /**
   * Remove an attribute.
   *
   * @zh 移除属性。
   * @ja 属性を削除します。
   * @ko 속성을 제거합니다.
   * @param name - Attribute name.
   * @zh name - 属性名。
   * @ja name - 属性名。
   * @ko name - 속성 이름입니다.
   */
  removeAttribute(name: string): void {
    native.removeAttribute(this.handle, name);
  }

  /**
   * Tag name of the element.
   *
   * @zh 元素标签名。
   * @ja 要素のタグ名。
   * @ko 요소의 태그 이름입니다.
   * @returns Tag name.
   * @zh 标签名。
   * @ja タグ名。
   * @ko 태그 이름입니다.
   */
  get tagName(): string {
    return native.getTagName(this.handle);
  }

  /**
   * Element id.
   *
   * @zh 元素 id。
   * @ja 要素の id。
   * @ko 요소 id입니다.
   * @returns Element id, empty when unset.
   * @zh 元素 id；未设置时为空字符串。
   * @ja 要素の id。未設定の場合は空文字列。
   * @ko 요소 id이며 설정되지 않았으면 빈 문자열입니다.
   */
  get id(): string {
    return native.getElementId(this.handle);
  }

  /**
   * Set the element id through Rml::Element::SetId.
   *
   * @zh 通过 Rml::Element::SetId 设置元素 id。
   * @ja Rml::Element::SetId で要素の id を設定します。
   * @ko Rml::Element::SetId로 요소 id를 설정합니다.
   * @param id - New element id.
   * @zh id - 新元素 id。
   * @ja id - 新しい要素の id。
   * @ko id - 새 요소 id입니다.
   */
  set id(id: string) {
    native.setElementId(this.handle, id);
  }

  /**
   * Owning document.
   *
   * @zh 所属文档。
   * @ja 要素を所有する文書を取得します。
   * @ko 요소를 소유한 문서를 가져옵니다.
   * @returns Document wrapper or null.
   * @zh 文档包装器；不存在时为 null。
   * @ja 文書ラッパー。存在しない場合は null。
   * @ko 문서 래퍼이며 없으면 null입니다.
   */
  getOwnerDocument(): Document | null {
    const handle = native.getOwnerDocument(this.handle);
    return handle === null ? null : Element.wrap(handle) as Document;
  }

  /**
   * Copy Rml::Element::GetEventDispatcherSummary for debugging.
   *
   * @zh 复制 Rml::Element::GetEventDispatcherSummary 的调试摘要。
   * @ja Rml::Element::GetEventDispatcherSummary の診断文字列をコピーします。
   * @ko Rml::Element::GetEventDispatcherSummary의 진단 문자열을 복사합니다.
   * @returns Native event types and listener counts; empty when none exist.
   * @zh 原生事件类型和监听器数量；没有监听器时为空字符串。
   * @ja ネイティブのイベント型とリスナー数。登録がなければ空文字列。
   * @ko 네이티브 이벤트 유형과 리스너 수이며 등록이 없으면 빈 문자열입니다.
   */
  getEventDispatcherSummary(): string {
    return native.getEventDispatcherSummary(this.handle);
  }

  /**
   * Read Rml::Element::GetClosestScrollableContainer, including this element.
   *
   * @zh 读取 GetClosestScrollableContainer，查找范围包含当前元素。
   * @ja 自身を含めて GetClosestScrollableContainer を取得します。
   * @ko 현재 요소를 포함해 GetClosestScrollableContainer를 조회합니다.
   * @returns Nearest native scroll container or null.
   * @zh 最近的原生滚动容器；不存在时返回 null。
   * @ja 最も近いネイティブスクロールコンテナー。存在しなければ null。
   * @ko 가장 가까운 네이티브 스크롤 컨테이너이며 없으면 null입니다.
   * @remarks
   * Call context.update() to resolve styles and layout first. Auto/scroll
   * overflow qualifies only when content exceeds the client size on that axis.
   * Overscroll containment also qualifies, even without overflowing content.
   * @zh 先调用 context.update() 解析样式和布局。auto/scroll 仅在对应轴内容超过
   * 客户区尺寸时符合条件；overscroll-behavior: contain 无需内容溢出也符合条件。
   * @ja 先に context.update() でスタイルとレイアウトを解決します。auto/scroll は
   * 対象軸の内容が表示領域を超える場合のみ該当し、contain は溢れがなくても該当します。
   * @ko 먼저 context.update()로 스타일과 레이아웃을 계산하세요. auto/scroll은
   * 해당 축의 내용이 표시 영역보다 클 때만 해당하며 contain은 넘침 없이도 해당합니다.
   */
  getClosestScrollableContainer(): Element | null {
    const handle = native.getClosestScrollableContainer(this.handle);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Read Rml::Element::GetDataModel through the checked native model index.
   *
   * @zh 通过受检查的原生模型索引读取 Rml::Element::GetDataModel。
   * @ja 検証付きネイティブモデル索引で Rml::Element::GetDataModel を取得します。
   * @ko 검증된 네이티브 모델 인덱스로 Rml::Element::GetDataModel을 조회합니다.
   * @returns Canonical model constructor facade or null when unbound.
   * @zh 唯一的数据模型构造器包装；未绑定模型时为 null。
   * @ja 一意のモデル構築ラッパー。未接続なら null。
   * @ko 고유 모델 생성자 래퍼이며 연결되지 않았으면 null입니다.
   * @remarks
   * Uses the model already attached by RmlUi; detachment or model removal
   * clears the association. The returned model follows the context lifetime.
   * @zh 返回 RmlUi 已关联的模型；元素脱离或移除模型会清除关联。
   * 返回模型的生命周期由上下文管理。
   * @ja RmlUi が接続したモデルを返します。取り外しやモデル削除で接続が解除され、
   * 返されたモデルの寿命はコンテキストによって管理されます。
   * @ko RmlUi가 연결한 모델을 반환합니다. 요소 분리나 모델 제거 시 연결이 해제되며
   * 반환된 모델의 수명은 컨텍스트가 관리합니다.
   */
  getDataModel(): DataModelConstructor | null {
    const handle = native.getElementDataModel(this.handle);
    return handle === null ? null : dataModelFromNative(handle);
  }

  /**
   * Read Rml::Element::GetContext through the owning document.
   *
   * @zh 通过所属文档读取 GetContext。
   * @ja 所有する文書から GetContext を読み取ります。
   * @ko 소유 문서를 통해 GetContext를 읽습니다.
   * @returns Canonical context; detached documents and their descendants retain
   * it. Other detached elements and context roots return null.
   * @zh 唯一上下文对象；脱离文档及其后代保留上下文，其他脱离元素和上下文根返回 null。
   * @ja 一意のコンテキスト。未接続文書と子孫は保持し、他の未接続要素とルートは null。
   * @ko 고유 컨텍스트입니다. 분리 문서와 자손은 유지하며 다른 분리 요소와 루트는 null입니다.
   */
  getContext(): Context | null {
    const handle = native.getElementContext(this.handle);
    return handle === null ? null : new Context(handle);
  }

  /**
   * Get the deepest focused descendant, or this element if no child has focus.
   *
   * @zh 获取最深的焦点后代；没有子项聚焦时返回此元素。
   * @ja 最深のフォーカス子孫を取得します。子にフォーカスがなければ自身です。
   * @ko 가장 깊은 포커스 자손을 가져오며 자식 포커스가 없으면 자신을 반환합니다.
   * @returns Deepest focus descendant, or this element if no child has focus.
   * @zh 最深的焦点后代；没有子元素聚焦时返回自身。
   * @ja 最深のフォーカス子孫。子がフォーカスされていなければ自身。
   * @ko 가장 깊은 포커스 자손이며 자식 포커스가 없으면 자신입니다.
   */
  getFocusLeafNode(): Element {
    return Element.wrap(native.getFocusLeafNode(this.handle));
  }

  /**
   * Attach an event listener.
   *
   * @zh 挂载事件监听器。
   * @ja イベントリスナーを登録します。
   * @ko 이벤트 리스너를 등록합니다.
   * @param type - Event name or registered native EventId.
   * @zh type - 事件名称或已注册的原生 EventId。
   * @ja type - イベント名または登録済みネイティブ EventId。
   * @ko type - 이벤트 이름 또는 등록된 네이티브 EventId입니다.
   * @param listener - Synchronous callback, shareable between registrations.
   * @zh listener - 同步回调，可在不同注册项之间复用。
   * @ja listener - 同期コールバック。複数の登録で共有できます。
   * @ko listener - 여러 등록에서 공유할 수 있는 동기 콜백입니다.
   * @param capture - Listen in capture phase; defaults to false.
   * @zh capture - 是否在捕获阶段监听，默认为 false。
   * @ja capture - キャプチャ段階で受け取るかどうか。既定値は false。
   * @ko capture - 캡처 단계에서 수신할지 여부이며 기본값은 false입니다.
   * @remarks
   * Identical element/type/callback/capture registrations are idempotent.
   * Removing the registration or destroying the element releases its callback.
   * Listeners may remove themselves or other listeners during dispatch.
   * Exceptions propagate from the native entry that dispatched the event.
   * Classes, styles, target-local ordinary attributes, titles and unrelated
   * subtrees may change synchronously. Removing active event targets or native
   * call receivers is rejected, as are teardown and recursive update/input.
   * Attribute set/removal also rejects ancestors of active targets.
   * Setting or removing an active input's type is rejected to protect its
   * widget.
   * Schedule those operations after dispatch, for example with queueMicrotask.
   * @zh 相同元素、类型、回调和 capture 的重复注册只生效一次。
   * 解绑或销毁元素时自动释放回调。分发期间可移除自身或其他监听器。
   * 异常从触发事件的原生入口传播。类名、样式、属性、标题和无关子树可同步修改。
   * 销毁活动事件目标或原生调用接收者、关闭运行时及递归更新和输入会被拒绝；
   * 属性设置和移除也会保守地拒绝活动目标的祖先。活动输入元素的 type
   * 设置或移除会被拒绝，以保护仍在执行的原生控件。
   * 请通过 queueMicrotask 等方式安排这些操作在分发后执行。
   * @ja 要素・種類・コールバック・capture が同じ登録は重複しません。
   * 解除や要素破棄で自動解放され、実行中も自身や他のリスナーを解除できます。
   * 例外はイベントを発生させた呼び出しから伝播します。クラス、スタイル、属性、
   * タイトル、無関係なサブツリーは同期変更できます。イベント対象や実行中の
   * ネイティブ呼び出し対象の破棄、終了、再帰更新・入力は拒否されます。
   * 属性設定・削除は活動対象の祖先でも拒否します。実行中の入力要素の type
   * 設定・削除もネイティブウィジェットを保護するため拒否します。
   * これらは queueMicrotask などで実行後に予約してください。
   * @ko 요소, 유형, 콜백, capture가 같은 등록은 중복되지 않습니다.
   * 제거나 요소 파괴 시 자동 해제되며 실행 중 자신이나 다른 리스너를 제거할 수 있습니다.
   * 예외는 이벤트를 발생시킨 호출로 전파됩니다. 클래스, 스타일, 속성, 제목,
   * 무관한 하위 트리는 동기 변경할 수 있습니다. 활성 이벤트 대상이나 네이티브 호출
   * 대상 파괴, 종료, 재귀 갱신 및 입력은 거부됩니다.
   * 속성 설정과 제거는 활성 대상의 상위 요소에서도 거부됩니다.
   * 활성 입력 요소의 type 설정과 제거도 실행 중인 네이티브 위젯을 보호하기 위해 거부됩니다.
   * 이런 작업은 queueMicrotask 등으로 이벤트 처리 이후에 예약하세요.
   */
  addEventListener(
    type: string | number, listener: RmlEventListener | EventListener,
    capture = false,
  ): void {
    native.addEventListener(
      this.handle, type, listener instanceof EventListener
        ? eventListenerHandle(listener) : eventCallback(listener), capture,
    );
  }

  /**
   * Detach a previously attached event listener.
   *
   * @zh 移除此前挂载的事件监听器。
   * @ja 登録済みのイベントリスナーを解除します。
   * @ko 등록한 이벤트 리스너를 제거합니다.
   * @param type - Event name or registered native EventId.
   * @zh type - 事件名称或已注册的原生 EventId。
   * @ja type - イベント名または登録済みネイティブ EventId。
   * @ko type - 이벤트 이름 또는 등록된 네이티브 EventId입니다.
   * @param listener - Same callback reference used when attaching.
   * @zh listener - 挂载时使用的同一个回调引用。
   * @ja listener - 登録時と同じコールバック参照。
   * @ko listener - 등록할 때 사용한 동일한 콜백 참조입니다.
   * @param capture - Same capture flag used when attaching; defaults to false.
   * @zh capture - 挂载时使用的捕获阶段标志，默认为 false。
   * @ja capture - 登録時と同じキャプチャフラグ。既定値は false。
   * @ko capture - 등록할 때 사용한 캡처 플래그이며 기본값은 false입니다.
   * @remarks
   * An unmatched registration is a no-op. All four fields must match.
   * @zh 无匹配注册项时不执行操作，注册项的四个字段必须全部匹配。
   * @ja 4 つの登録項目が一致する場合のみ解除し、不一致なら何もしません。
   * @ko 네 가지 등록 항목이 모두 일치할 때만 제거하며 불일치하면 아무 작업도 하지 않습니다.
   */
  removeEventListener(
    type: string | number, listener: RmlEventListener | EventListener,
    capture = false,
  ): void {
    native.removeEventListener(
      this.handle, type, listener instanceof EventListener
        ? eventListenerHandle(listener) : eventCallback(listener), capture,
    );
  }

  /**
   * Dispatch through Rml::Element::DispatchEvent, allowing nested dispatch.
   *
   * @zh 通过 Rml::Element::DispatchEvent 派发事件，允许嵌套派发。
   * @ja Rml::Element::DispatchEvent で派生イベントを同期的に送信できます。
   * @ko Rml::Element::DispatchEvent로 중첩 이벤트를 동기 발송할 수 있습니다.
   * @param type - Event name or registered native EventId.
   * @zh type - 事件名称或已注册的原生 EventId。
   * @ja type - イベント名または登録済みネイティブ EventId。
   * @ko type - 이벤트 이름 또는 등록된 네이티브 EventId입니다.
   * @param parameters - Typed native Variant values; defaults to empty.
   * @zh parameters - 原生 Variant 参数，默认为空。
   * @ja parameters - ネイティブ Variant のパラメーター。既定値は空。
   * @ko parameters - 네이티브 Variant 매개변수이며 기본값은 비어 있습니다.
   * @param options - Omit to use the upstream event specification defaults.
   * @zh options - 省略时使用上游事件定义的默认值。
   * @ja options - 省略時は上流のイベント仕様の既定値を使用します。
   * @ko options - 생략하면 상위 이벤트 정의의 기본값을 사용합니다.
   * @returns Whether the event remains propagating.
   * @zh 事件是否仍可传播。
   * @ja イベントの伝播が継続しているかどうか。
   * @ko 이벤트가 계속 전파되는지 여부입니다.
   * @remarks
   * Parameter getters run before native element validation. Destroying the
   * receiver or a referenced element in a getter makes dispatch throw.
   * Element parameters cannot be destroyed by subtree replacement in listeners.
   * @zh 参数 getter 在原生元素校验前执行。getter 销毁接收元素或被引用元素时，
   * 派发会抛出异常；监听器中不能通过替换子树销毁元素参数。
   * @ja パラメーターの getter は要素検証前に実行します。対象や参照要素が破棄されたら
   * 例外になります。リスナーではサブツリー置換で要素パラメーターを破棄できません。
   * @ko 매개변수 getter는 요소 검증 전에 실행합니다. 대상이나 참조 요소가 파괴되면
   * 예외를 던집니다. 리스너에서 하위 트리를 교체해 요소 매개변수를 파괴할 수 없습니다.
   */
  dispatchEvent(
    type: string | number,
    parameters: Readonly<Record<string, VariantValue>> = {},
    options?: DispatchEventOptions,
  ): boolean {
    const values = Object.fromEntries(
      Object.entries(parameters).map(([ name, value ]) => [
        name, value instanceof Element ? value.handle : variantToNative(value),
      ]),
    );
    return native.dispatchEvent(
      this.handle, type, values,
      options === undefined ? undefined : options.interruptible ?? true,
      options === undefined ? undefined : options.bubbles ?? true,
    );
  }

  /**
   * Simulate a click through Rml::Element::Click.
   *
   * @zh 通过 Rml::Element::Click 模拟点击。
   * @ja Rml::Element::Click でクリックを発生させます。
   * @ko Rml::Element::Click으로 클릭을 발생시킵니다.
   */
  click(): void {
    native.click(this.handle);
  }
}

elementConstructors.set('Element', Element);
