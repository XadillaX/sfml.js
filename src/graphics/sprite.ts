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

  /**
   * Creates a sprite from a texture and retains its reference; rectangle
   * defaults to the entire texture, in pixels.
   * @zh 从纹理创建精灵并保留其引用；rectangle 默认覆盖整个纹理，单位为像素。
   * @ja テクスチャからスプライトを作成し、その参照を保持します。rectangle はピクセル単位で、既定はテクスチャ全体です。
   * @ko 텍스처로 스프라이트를 만들고 참조를 유지합니다. rectangle은 픽셀 단위이며 기본값은 전체 텍스처입니다.
   */
  constructor(texture: ReadonlyTexture, rectangle?: R<IntRect>);
  /**
   * Copies sprite appearance and transforms, retaining the same texture
   * reference.
   * @zh 复制精灵外观和变换，保留同一个纹理引用。
   * @ja スプライトの外観と変換をコピーし、同じテクスチャ参照を保持します。
   * @ko 스프라이트 외형과 변환을 복사하고 동일한 텍스처 참조를 유지합니다.
   */
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

  /**
   * Replaces the texture reference; resetRect true resets the texture region to
   * the entire texture.
   * @zh 替换纹理引用；resetRect 为 true 时把纹理区域重置为完整纹理。
   * @ja テクスチャ参照を置き換えます。resetRect が true なら領域をテクスチャ全体にリセットします。
   * @ko 텍스처 참조를 교체합니다. resetRect가 true이면 텍스처 영역을 전체 텍스처로 초기화합니다.
   */
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

  /**
   * Returns the texture reference retained by the sprite.
   * @zh 返回精灵持有的纹理引用。
   * @ja スプライトが保持するテクスチャ参照を返します。
   * @ko 스프라이트가 유지하는 텍스처 참조를 반환합니다.
   */
  getTexture(): ReadonlyTexture {
    return this[spriteState].texture;
  }

  /**
   * Copies the texture pixel region; width and height determine the local
   * sprite size, and negative values can flip the texture.
   * @zh 复制纹理像素区域；宽高决定精灵局部尺寸，负值可翻转纹理。
   * @ja テクスチャのピクセル領域をコピーします。幅と高さはスプライトのローカルサイズを決め、負の値でテクスチャを反転できます。
   * @ko 텍스처 픽셀 영역을 복사합니다. 너비와 높이는 스프라이트 로컬 크기를 결정하며 음수 값으로 텍스처를 반전할 수 있습니다.
   */
  setTextureRect(this: SpriteResource, rectangle: R<IntRect>): void {
    if (!(rectangle instanceof IntRect)) throw new TypeError('Expected an IntRect');
    this[spriteState].rectangle.set(rectangle[rectStorage]);
  }

  /**
   * Returns a shared view typed as read-only of the texture pixel region.
   * @zh 返回纹理像素区域的只读类型共享视图。
   * @ja テクスチャのピクセル領域の、型上読み取り専用の共有ビューを返します。
   * @ko 텍스처 픽셀 영역의 형식상 읽기 전용 공유 뷰를 반환합니다.
   */
  getTextureRect(): R<IntRect> {
    if (!this.rectangleView) {
      const handle = this[graphicsNative];
      this.rectangleView = intRectFromState(new LazyValue(
        this[spriteState].rectangle, () => native.spriteTextureRect(handle),
      ));
    }
    return this.rectangleView;
  }

  /**
   * Sets the color multiplied channel-wise with the texture; Alpha can control
   * overall opacity.
   * @zh 设置与纹理逐通道相乘的颜色，Alpha 可控制整体透明度。
   * @ja テクスチャとチャンネルごとに乗算する色を設定します。Alpha で全体の不透明度を制御できます。
   * @ko 텍스처와 채널별로 곱할 색상을 설정합니다. Alpha로 전체 불투명도를 제어할 수 있습니다.
   */
  setColor(this: SpriteResource, color: R<Color>): void {
    if (!(color instanceof Color)) throw new TypeError('Expected a Color');
    this[spriteState].words[5] = color.toInteger();
  }

  /**
   * Returns an independent copy of the sprite color.
   * @zh 返回精灵颜色的独立副本。
   * @ja スプライト色の独立したコピーを返します。
   * @ko 스프라이트 색상의 독립적인 복사본을 반환합니다.
   */
  getColor(): Color {
    return new Color(this[spriteState].words[5]);
  }

  /**
   * Returns local bounds without applying the object's transform.
   * @zh 返回未应用对象变换的局部包围框。
   * @ja オブジェクトの変換を適用しないローカル境界矩形を返します。
   * @ko 객체 변환을 적용하지 않은 로컬 경계 상자를 반환합니다.
   */
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

/**
 * sf::Sprite with the shared Transformable API.
 * @zh 具有共享 Transformable API 的 sf::Sprite。
 * @ja 共通の Transformable API を備えた sf::Sprite。
 * @ko 공통 Transformable API를 갖춘 sf::Sprite입니다.
 */
export class Sprite extends withTransformable(SpriteResource) {
  /**
   * Returns axis-aligned bounds after applying position, rotation and scale.
   * @zh 返回应用位置、旋转和缩放后的轴对齐包围框。
   * @ja 位置、回転、拡大縮小を適用した軸平行境界矩形を返します。
   * @ko 위치, 회전 및 배율을 적용한 축 정렬 경계 상자를 반환합니다.
   */
  getGlobalBounds(): FloatRect {
    return this.getTransform().transformRect(this.getLocalBounds());
  }
}
