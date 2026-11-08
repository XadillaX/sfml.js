import {
  RenderTexture, Texture, Sprite, RenderStates, VertexArray,
  Vector2u, type ReadonlyTexture, type Image,
  Vector2f, ContextAttribute, type ContextSettings, type RenderTextureSettings,
} from '../src';

const source = new RenderTexture(new Vector2u(8, 8));
const empty = new RenderTexture();
const settings: Readonly<ContextSettings> = {
  depthBits: 24, stencilBits: 8, antiAliasingLevel: 4,
  majorVersion: 2, minorVersion: 1,
  // eslint-disable-next-line no-bitwise
  attributeFlags: ContextAttribute.Core | ContextAttribute.Debug,
  sRgbCapable: true,
};
const compatible: RenderTextureSettings = settings;
const resized: boolean = empty.resize(new Vector2u(8, 8), compatible);
const maximum: number = RenderTexture.getMaximumAntiAliasingLevel();
const active: boolean = source.setActive();
source.setActive(false);
source.setSmooth(true);
source.setRepeated(false);
const mipmap: boolean = source.generateMipmap();
const flags: boolean[] = [
  source.isSmooth(), source.isRepeated(), source.isSrgb(),
];
// @ts-expect-error Dimensions use unsigned vectors.
source.resize(new Vector2f(8, 8));
// @ts-expect-error Settings flags are booleans.
source.resize(new Vector2u(8, 8), { sRgbCapable: 1 });
// @ts-expect-error Maximum antialiasing level is a static query.
source.getMaximumAntiAliasingLevel();
// @ts-expect-error RenderTexture cannot be copied.
new RenderTexture(source);
const view: ReadonlyTexture = source.getTexture();
const image: Image = view.copyToImage();
const copy = new Texture(view);
copy.update(view);
const sprite = new Sprite(view);
sprite.setTexture(view);
const output = new RenderTexture(new Vector2u(8, 8));
output.draw(sprite);
output.draw(new VertexArray(), new RenderStates(view));
output.draw(new VertexArray(), { texture: view });
view.getSize();
view.isSmooth();
view.isRepeated();
view.isSrgb();
// @ts-expect-error RenderTexture views cannot resize the owner.
view.resize(new Vector2u(1, 1));
// @ts-expect-error RenderTexture views cannot upload pixels.
view.update(image);
// @ts-expect-error RenderTexture views cannot load images.
view.loadFromImage(image);
// @ts-expect-error RenderTexture views cannot load files.
view.loadFromFile('image.png');
// @ts-expect-error RenderTexture views cannot load encoded bytes.
view.loadFromMemory(new Uint8Array());
// @ts-expect-error Sampling settings belong to the owning render target.
view.setSmooth(true);
// @ts-expect-error Sampling settings belong to the owning render target.
view.setRepeated(true);
// @ts-expect-error Mipmap generation belongs to the owning render target.
view.generateMipmap();
// @ts-expect-error RenderTexture views cannot swap resources.
view.swap(copy);
// @ts-expect-error Both sides of swap must be writable.
copy.swap(view);
// @ts-expect-error A readonly view cannot be assigned to a writable texture.
const writable: Texture = view;
void writable;
void [ resized, maximum, active, mipmap, flags ];
