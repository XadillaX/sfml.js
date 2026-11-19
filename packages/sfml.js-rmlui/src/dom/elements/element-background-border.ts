import { native } from '../../internal/native';
import { geometryFromNative, type Geometry } from '../../rendering/geometry';
import { BoxArea } from './layout';
import type { ElementNativeHandle } from '../../values/types';

const handles = new WeakMap<ElementBackgroundBorder, ElementNativeHandle>();
const wrappers = new WeakMap<ElementNativeHandle, ElementBackgroundBorder>();

/**
 * Resolve the component's authentic element token.
 *
 * @internal
 * @param value - Component receiver.
 * @returns Checked element token.
 */
function handle(value: ElementBackgroundBorder): ElementNativeHandle {
  const token = handles.get(value);
  if (!token) {
    throw new TypeError('Expected an ElementBackgroundBorder');
  }
  return token;
}

/**
 * Checked element-owned Rml::ElementBackgroundBorder.
 *
 * @zh 元素持有的带检查 Rml::ElementBackgroundBorder。
 * @ja 要素所有の検証付き Rml::ElementBackgroundBorder。
 * @ko 요소 소유의 검증된 Rml::ElementBackgroundBorder입니다.
 * @remarks
 * The element token retains detached ownership and invalidates on destruction
 * or shutdown. Rendering and geometry mutation during effect callbacks are
 * rejected before native component state changes.
 * @zh 元素令牌保活分离节点，销毁或关闭后失效。效果回调中的渲染和几何修改
 * 在原生组件状态变化前被拒绝。
 * @ja トークンは分離要素を保持し、破棄・終了で無効になります。効果関数内の描画と
 * ジオメトリ変更はネイティブ部品の変更前に拒否します。
 * @ko 토큰은 분리 요소를 유지하며 파괴나 종료 시 무효화합니다. 효과 콜백에서의
 * 렌더링 및 지오메트리 변경은 네이티브 구성 요소 변경 전에 거부합니다.
 */
export class ElementBackgroundBorder {
  private constructor() {}

  /**
   * Run native background, border and box-shadow rendering for this element.
   *
   * @zh 执行元素的原生背景、边框和盒阴影渲染。
   * @ja この要素の背景・境界・ボックス影をネイティブ描画します。
   * @ko 요소의 배경, 테두리 및 상자 그림자를 네이티브 렌더링합니다.
   * @remarks
   * Uses current computed style, layout and manager state. Prepare the manager
   * viewport first. A detached element without a manager does not draw.
   * Another manager's active layer and callback reentry are rejected.
   * @zh 使用当前计算样式、布局和管理器状态，先准备管理器视口。
   * 没有管理器的分离元素不绘制，拒绝其他管理器的活动层和回调重入。
   * @ja 現在の計算スタイル・配置・管理器状態を使います。先に視口を準備します。
   * 管理器がない分離要素は描画せず、別管理器の活動レイヤーと関数再入を拒否します。
   * @ko 현재 계산 스타일, 배치 및 관리자 상태를 사용하며 먼저 뷰포트를 준비하세요.
   * 관리자 없는 분리 요소는 그리지 않고 다른 관리자의 활성 레이어와 콜백 재진입은 거부합니다.
   */
  render(): void {
    native.backgroundBorderRender(handle(this));
  }

  /**
   * Mark native background geometry dirty for its next render.
   *
   * @zh 标记原生背景几何待下次渲染更新。
   * @ja 次回描画用に背景ジオメトリを変更済みにします。
   * @ko 다음 렌더링에서 갱신하도록 배경 지오메트리를 표시합니다.
   */
  dirtyBackground(): void {
    native.backgroundBorderDirtyBackground(handle(this));
  }

  /**
   * Mark native border geometry dirty for its next render.
   *
   * @zh 标记原生边框几何待下次渲染更新。
   * @ja 次回描画用に境界ジオメトリを変更済みにします。
   * @ko 다음 렌더링에서 갱신하도록 테두리 지오메트리를 표시합니다.
   */
  dirtyBorder(): void {
    native.backgroundBorderDirtyBorder(handle(this));
  }

  /**
   * Copy Rml::ElementBackgroundBorder::GetClipGeometry into owned geometry.
   *
   * @zh 将 GetClipGeometry 复制为自有几何资源。
   * @ja GetClipGeometry を所有ジオメトリにコピーします。
   * @ko GetClipGeometry를 소유 지오메트리로 복사합니다.
   * @param area - Border, Padding or Content; Margin and Auto are rejected.
   * @zh area - Border、Padding 或 Content；拒绝 Margin 和 Auto。
   * @ja area - Border・Padding・Content。Margin と Auto は拒否します。
   * @ko area - Border, Padding 또는 Content이며 Margin과 Auto는 거부합니다.
   * @returns Independent native geometry; empty when no manager exists.
   * @zh 独立原生几何；无管理器时返回空几何。
   * @ja 独立したネイティブジオメトリ。管理器がなければ空です。
   * @ko 독립 네이티브 지오메트리이며 관리자가 없으면 비어 있습니다.
   * @remarks
   * Snapshots survive component regeneration and element destruction.
   * Releasing or editing a snapshot does not alter the component's geometry.
   * The renderer manager still controls resource lifetime. getMesh() copies
   * remain usable after manager release and shutdown.
   * @zh 快照在组件重建和元素销毁后仍有效。释放或修改快照不改变组件几何。
   * 渲染管理器仍控制资源寿命，getMesh() 副本在管理器释放和关闭后仍可用。
   * @ja 部品再生成・要素破棄後もコピーは有効です。解放・変更は部品に影響しません。
   * 管理器が寿命を制御しますが、getMesh() のコピーは管理器解放・終了後も使えます。
   * @ko 구성 요소 재생성과 요소 파괴 후에도 사본은 유효하며 해제나 변경은 구성 요소에
   * 영향을 주지 않습니다. 관리자가 자원 수명을 제어하나 getMesh() 사본은 종료 후에도 씁니다.
   */
  getClipGeometry(area: BoxArea): Geometry {
    return geometryFromNative(
      native.backgroundBorderGetClipGeometry(handle(this), area));
  }
}

/**
 * Reuse the wrapper for an element-owned background and border component.
 *
 * @internal
 * @param token - Checked element token.
 * @returns Canonical component view.
 */
export function elementBackgroundBorderFromNative(
  token: ElementNativeHandle,
): ElementBackgroundBorder {
  let result = wrappers.get(token);
  if (!result) {
    result = Object.create(
      ElementBackgroundBorder.prototype,
    ) as ElementBackgroundBorder;
    handles.set(result, token);
    wrappers.set(token, result);
  }
  return result;
}
