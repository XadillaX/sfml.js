import { dispatchDrawable } from '../internal/graphics-state';
import {
  defaultRenderStates, validateRenderStates,
} from '../internal/render-states';
import { RenderStates } from './render-states';
import type { RenderTarget } from './render-target';

/**
 * sf::Drawable: override draw to synchronously compose other drawables.
 * @zh sf::Drawable：重写 draw 以同步组合其他可绘制对象。
 * @ja sf::Drawable。draw をオーバーライドして他の描画可能オブジェクトを同期的に組み合わせます。
 * @ko sf::Drawable: draw를 재정의하여 다른 그리기 객체를 동기적으로 조합합니다.
 */
export abstract class Drawable {
  /**
   * Subclasses draw synchronously and may compose objects via target.draw();
   * states is a copy for this call.
   * @zh 子类同步实现绘制，可通过 target.draw() 组合对象；states 是本次调用的副本。
   * @ja サブクラスは描画を同期的に実装し、target.draw() でオブジェクトを組み合わせられます。states は今回の呼び出し用のコピーです
   * 。
   * @ko 하위 클래스는 동기적으로 그리기를 구현하며 target.draw()로 객체를 조합할 수 있습니다. states는 이번 호출용
   * 복사본입니다.
   */
  protected abstract draw(target: RenderTarget, states: RenderStates): void;

  [dispatchDrawable](target: RenderTarget, states: RenderStates): void {
    validateRenderStates(states);
    // A fresh default has the same value as copying the frozen constant.
    this.draw(target, new RenderStates(
      states === defaultRenderStates ? undefined : states));
  }
}
