import { Color, Texture, Sprite, RenderTexture, Vector2u, Vector2f } from '..';

const size = new Vector2u(16, 16);
const texture = new Texture(size);
const sprite = new Sprite(texture);
const target = new RenderTexture(size);
const position: Readonly<Vector2f> = new Vector2f(1, 2);
sprite.setPosition(position);
sprite.move(position);
const copiedPosition: Vector2f = sprite.getPosition();
const copiedSize: Vector2u = target.getSize();
texture.update(new Uint8Array(16 * 16 * 4));
target.clear();
target.clear(Color.Transparent);
target.clear(new Color(1, 2, 3, 4));
target.draw(sprite);
target.display();

// @ts-expect-error Sprite construction requires a texture.
new Sprite();
// @ts-expect-error Position uses the SFML float specialization.
sprite.setPosition(size);
// @ts-expect-error Texture dimensions use the unsigned specialization.
new Texture(position);
// @ts-expect-error Draw requires a drawable.
target.draw(texture);
// @ts-expect-error Raw RGBA uploads are byte arrays.
texture.update(new Float32Array(16));
// @ts-expect-error Clear now takes the SFML Color value type.
target.clear({ r: 0, g: 0, b: 0, a: 0 });

export { copiedPosition, copiedSize };
