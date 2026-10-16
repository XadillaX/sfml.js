import { dispatchDrawable } from '../internal/graphics-state';
import {
  defaultRenderStates, validateRenderStates,
} from '../internal/render-states';
import { RenderStates } from './render-states';
import type { RenderTarget } from './render-target';

/** sf::Drawable: override draw to synchronously compose other drawables. */
export abstract class Drawable {
  /** 子类同步实现绘制，可通过 target.draw() 组合对象；states 是本次调用的副本。 */
  protected abstract draw(target: RenderTarget, states: RenderStates): void;

  [dispatchDrawable](target: RenderTarget, states: RenderStates): void {
    validateRenderStates(states);
    // A fresh default has the same value as copying the frozen constant.
    this.draw(target, new RenderStates(
      states === defaultRenderStates ? undefined : states));
  }
}
