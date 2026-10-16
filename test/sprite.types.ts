import {
  Sprite, Texture, Image, IntRect, FloatRect, Color, Vector2u, Vector2f,
  RenderTexture, RenderStates, type ReadonlyTexture, type ReadonlyValue,
} from '../src';

const texture = new Texture(new Vector2u(8, 8));
const sprite = new Sprite(texture);
const area: ReadonlyValue<IntRect> = new IntRect();
const cropped = new Sprite(texture, area);
const copied = new Sprite(sprite);
const constant: ReadonlyValue<Sprite> = sprite;
new Sprite(constant);
sprite.setTexture(texture);
sprite.setTexture(texture, true);
sprite.setTextureRect(area);
sprite.setColor(Color.Red);
const color: Color = sprite.getColor();
const local: FloatRect = sprite.getLocalBounds();
const global: FloatRect = sprite.getGlobalBounds();
const rectangle: ReadonlyValue<IntRect> = sprite.getTextureRect();
const borrowed: ReadonlyTexture = sprite.getTexture();
const image: Image = borrowed.copyToImage();
new Sprite(borrowed, rectangle);
new Texture(borrowed);
texture.update(borrowed);
sprite.setTexture(borrowed);
new RenderStates(borrowed);
new RenderStates({ texture: borrowed });
new RenderTexture(new Vector2u(16, 16)).draw(sprite, borrowed);
sprite.setPosition(new Vector2f(1, 2));
// @ts-expect-error Borrowed textures expose no mutation API.
borrowed.update(image);
// @ts-expect-error Borrowed textures cannot resize their owner's resource.
borrowed.resize(new Vector2u(1, 1));
// @ts-expect-error Both sides of swap must be mutable textures.
texture.swap(borrowed);
// @ts-expect-error Texture rectangles are const member references.
rectangle.size.x = 2;
// @ts-expect-error Const sprites cannot change their appearance.
constant.setColor(Color.White);
// @ts-expect-error Texture rectangles require the integer specialization.
sprite.setTextureRect(new FloatRect());
// @ts-expect-error Cropped construction requires an IntRect.
new Sprite(texture, new FloatRect());
// @ts-expect-error Copy construction takes only its source.
new Sprite(sprite, area);
// @ts-expect-error resetRect is boolean.
sprite.setTexture(texture, 1);
// @ts-expect-error Colors use the Color value type.
sprite.setColor(0xffffffff);
// @ts-expect-error There is no default sprite constructor in SFML 3.
new Sprite();
void [ cropped, copied, color, local, global ];
