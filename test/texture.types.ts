import {
  Texture, Image, IntRect, FloatRect, Vector2u, Vector2f, type ReadonlyValue,
} from '../src';

const texture = new Texture();
const image = new Image();
const size: Readonly<Vector2u> = new Vector2u(2, 2);
const area: ReadonlyValue<IntRect> = new IntRect();
const file: Promise<boolean> = texture.loadFromFile('image.png', true, area);
const memory: Promise<boolean> = texture.loadFromMemory(
  new Uint8Array(), false, area);
const uploaded: boolean = texture.loadFromImage(image, false, area);
const resized: boolean = texture.resize(size, true);
const readback: Image = texture.copyToImage();
const maximum: number = Texture.getMaximumSize();
const mipmap: boolean = texture.generateMipmap();
const copy = new Texture(texture);
const fromImage = new Texture(image, false, area);
texture.swap(copy);
new Texture(image);
texture.update(new Uint8Array(16));
texture.update(new Uint8Array(16), size, new Vector2u());
texture.update(image);
texture.update(image, size);
texture.update(new Texture(size, true), size);
texture.setSmooth(true);
texture.setRepeated(false);
const flags: boolean[] = [
  texture.isSmooth(), texture.isRepeated(), texture.isSrgb(),
];
// @ts-expect-error File loading is asynchronous.
const synchronous: boolean = texture.loadFromFile('image.png');
// @ts-expect-error Pixels need both a size and a destination.
texture.update(new Uint8Array(16), size);
// @ts-expect-error Images only accept a destination.
texture.update(image, size, size);
// @ts-expect-error Texture coordinates must use unsigned integers.
texture.update(image, new Vector2f());
// @ts-expect-error Texture crop must be an IntRect.
texture.loadFromImage(image, false, new FloatRect());
// @ts-expect-error Sampling flags are booleans.
texture.setSmooth(1);
// @ts-expect-error There is no synchronous file loader.
texture.loadFromFileSync('image.png');
// @ts-expect-error Resizing requires unsigned dimensions.
texture.resize(new Vector2f());
// @ts-expect-error Image construction uses integer cropping.
new Texture(image, false, new FloatRect());
// @ts-expect-error Copy construction takes no sampling override.
new Texture(texture, true);
// @ts-expect-error Swap accepts another texture resource.
texture.swap(image);
// @ts-expect-error Device limit is a static query.
texture.getMaximumSize();
void [
  file, memory, uploaded, flags, synchronous, resized, readback, maximum,
  mipmap, fromImage,
];
