import {
  Image, Vector2u, Vector2f, Color, IntRect, FloatRect,
  type ReadonlyPixels,
} from '..';

const image = new Image();
const filled = new Image(new Vector2u(2, 2), Color.Red);
const raw = new Image(filled.getSize(), filled.pixels);
const copy = new Image(raw);
image.resize(new Vector2u(1, 1));
image.resize(new Vector2u(1, 1), new Uint8Array(4));
image.setPixel(new Vector2u(), Color.Blue);
const color: Color = image.getPixel(new Vector2u());
const size: Vector2u = image.getSize();
const fileLoad: Promise<boolean> = image.loadFromFile('image.png');
const memoryLoad: Promise<boolean> = image.loadFromMemory(Buffer.alloc(4));
const fileSave: Promise<boolean> = image.saveToFile('image.png');
const memorySave: Promise<Uint8Array | undefined> = image.saveToMemory('png');
const pixels: ReadonlyPixels | undefined = image.getPixelsPtr();
image.pixels[0] = 255;
image.pixels.fill(0);
image.copy(copy, size, new IntRect(), true);
if (pixels) {
  const byte: number = pixels[0];
  const cloned: Uint8Array = pixels.slice();
  cloned[0] = byte;
  // @ts-expect-error Const pixel pointers cannot write.
  pixels[0] = 255;
  // @ts-expect-error Mutating methods are not exposed.
  pixels.fill(0);
  // @ts-expect-error No writable alias through buffer.
  new Uint8Array(pixels.buffer);
  // @ts-expect-error No writable alias through subarray.
  pixels.subarray(0, 4);
  // @ts-expect-error Const view cannot escape through callback arguments.
  pixels.forEach((_value, _index, array) => array.fill(0));
}
// @ts-expect-error Pixel view cannot be replaced.
image.pixels = new Uint8Array(4);
// @ts-expect-error No blocking file constructor.
new Image('image.png');
// @ts-expect-error No synchronous loader.
image.loadFromFileSync('image.png');
// @ts-expect-error No duplicate Async-suffixed loader.
image.loadFromFileAsync('image.png');
// @ts-expect-error Loading is always asynchronous.
const syncResult: boolean = image.loadFromFile('image.png');
// @ts-expect-error Dimensions use unsigned vectors.
new Image(new Vector2f(1, 1));
// @ts-expect-error Copy uses integer rectangles.
image.copy(copy, size, new FloatRect());
// @ts-expect-error Pixels are bytes.
image.loadFromMemory(new Float32Array(4));

export {
  color, size, fileLoad, memoryLoad, fileSave, memorySave, syncResult,
};
