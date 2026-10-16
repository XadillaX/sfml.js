import { Window, RenderWindow, Vector2u } from '../src';

class CustomWindow extends Window {
  /** 创建后访问已初始化的派生字段。 */
  protected override onCreate(): void {
    super.onCreate();
    this.setSize(new Vector2u(100, 100));
  }

  /** 调整尺寸后允许继续调用基类钩子。 */
  protected override onResize(): void {
    super.onResize();
  }
}

class CustomRenderWindow extends RenderWindow {
  /** 渲染窗口沿用 Window 的受保护钩子。 */
  protected override onCreate(): void {
    super.onCreate();
    this.setView(this.getDefaultView());
  }

  /** 调整尺寸不改变钩子的访问级别。 */
  protected override onResize(): void {
    super.onResize();
  }
}

const window: Window = new CustomRenderWindow();
const custom = new CustomWindow();
// @ts-expect-error 生命周期钩子只允许子类访问
custom.onCreate();
// @ts-expect-error 生命周期钩子只允许子类访问
window.onResize();
// @ts-expect-error 渲染窗口钩子不属于公共 API
new RenderWindow().onCreate();
void [ window, custom ];
