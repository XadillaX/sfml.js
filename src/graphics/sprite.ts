import { native, type NativeGraphicsHandle } from '../internal/native';
import {
  dispatchDrawable, graphicsContext, graphicsNative, recordSprite, spriteState,
  textureId, type SpriteData,
} from '../internal/graphics-state';
import {
  withTransformable, transformableState, type TransformableState,
} from '../internal/transformable';
import {
  mutableValue, rectStorage, type ReadonlyValue as R,
} from '../internal/value-storage';
import { LazyValue } from '../internal/lazy-value';
import { Vector2f } from '../system/vector2';
import { Color } from './color';
import { Drawable } from './drawable';
import { FloatRect, IntRect, intRectFromState } from './rect';
import type { RenderStates } from './render-states';
import type { RenderTarget } from './render-target';
import { Texture, type ReadonlyTexture } from './texture';

class SpriteResource extends Drawable {
  readonly [mutableValue] = true;
  readonly [graphicsNative]: NativeGraphicsHandle<'sprite'>;
  readonly [spriteState]: SpriteData;
  readonly [transformableState]: TransformableState;
  private rectangleView?: R<IntRect>;

  /** 从纹理创建精灵并保留其引用；rectangle 默认覆盖整个纹理，单位为像素。 */
  constructor(texture: ReadonlyTexture, rectangle?: R<IntRect>);
  /** 复制精灵外观和变换，保留同一个纹理引用。 */
  constructor(source: R<Sprite>);
  constructor(source: ReadonlyTexture | R<Sprite>, rectangle?: R<IntRect>) {
    super();
    const copy = source instanceof SpriteResource ? source : undefined;
    const texture = copy ? copy[spriteState].texture : source as ReadonlyTexture;
    if (!(texture instanceof Texture)) throw new TypeError('Expected a Texture');
    if (rectangle !== undefined && !(rectangle instanceof IntRect)) {
      throw new TypeError('Expected an IntRect');
    }
    if (copy && rectangle !== undefined) {
      throw new TypeError('Sprite copy construction only accepts its source');
    }
    const { handle, transformable, id, buffer, appearance } = native.createSprite(
      graphicsContext(), texture[graphicsNative], texture[textureId],
    );
    this[graphicsNative] = handle;
    this[spriteState] = {
      id, words: new Uint32Array(appearance),
      rectangle: new Int32Array(appearance, 4, 4), texture,
    };
    this[transformableState] = {
      handle: transformable, values: new Float32Array(buffer),
    };
    if (copy) {
      this[spriteState].words.set(copy[spriteState].words);
      this[transformableState].values.set(copy[transformableState].values);
    } else if (rectangle) {
      this[spriteState].rectangle.set(rectangle[rectStorage]);
    }
  }

  /** 替换纹理引用；resetRect 为 true 时把纹理区域重置为完整纹理。 */
  setTexture(
    this: SpriteResource, texture: ReadonlyTexture, resetRect = false,
  ): void {
    if (!(texture instanceof Texture)) throw new TypeError('Expected a Texture');
    if (typeof resetRect !== 'boolean') throw new TypeError('Expected a boolean');
    const state = this[spriteState];
    if (texture !== state.texture) {
      native.setSpriteTexture(
        this[graphicsNative], texture[graphicsNative], texture[textureId],
      );
      state.texture = texture;
    }
    if (resetRect) {
      const size = texture.getSize();
      state.rectangle.set([ 0, 0, size.x, size.y ]);
    }
  }

  /** 返回精灵持有的纹理引用。 */
  getTexture(): ReadonlyTexture {
    return this[spriteState].texture;
  }

  /** 复制纹理像素区域；宽高决定精灵局部尺寸，负值可翻转纹理。 */
  setTextureRect(this: SpriteResource, rectangle: R<IntRect>): void {
    if (!(rectangle instanceof IntRect)) throw new TypeError('Expected an IntRect');
    this[spriteState].rectangle.set(rectangle[rectStorage]);
  }

  /** 返回纹理像素区域的只读类型共享视图。 */
  getTextureRect(): R<IntRect> {
    if (!this.rectangleView) {
      const handle = this[graphicsNative];
      this.rectangleView = intRectFromState(new LazyValue(
        this[spriteState].rectangle, () => native.spriteTextureRect(handle),
      ));
    }
    return this.rectangleView;
  }

  /** 设置与纹理逐通道相乘的颜色，Alpha 可控制整体透明度。 */
  setColor(this: SpriteResource, color: R<Color>): void {
    if (!(color instanceof Color)) throw new TypeError('Expected a Color');
    this[spriteState].words[5] = color.toInteger();
  }

  /** 返回精灵颜色的独立副本。 */
  getColor(): Color {
    return new Color(this[spriteState].words[5]);
  }

  /** 返回未应用对象变换的局部包围框。 */
  getLocalBounds(): FloatRect {
    const rectangle = this[spriteState].rectangle;
    return new FloatRect(new Vector2f(), new Vector2f(
      Math.abs(Math.fround(rectangle[2])), Math.abs(Math.fround(rectangle[3])),
    ));
  }

  protected draw(target: RenderTarget, states: RenderStates): void {
    target[recordSprite](this, states);
  }

  [dispatchDrawable](target: RenderTarget, states: RenderStates): void {
    if (this.draw === SpriteResource.prototype.draw) {
      // Built-in draw only reads states: avoid allocating a throwaway copy.
      this.draw(target, states);
    } else {
      // User overrides, including super.draw(), retain SFML value semantics.
      super[dispatchDrawable](target, states);
    }
  }
}

/** sf::Sprite with the shared Transformable API. */
export class Sprite extends withTransformable(SpriteResource) {
  /** 返回应用位置、旋转和缩放后的轴对齐包围框。 */
  getGlobalBounds(): FloatRect {
    return this.getTransform().transformRect(this.getLocalBounds());
  }
}
