import {
  Image, Texture, InputStream, MemoryInputStream, FileInputStream, Shader,
  Window, Vector2u, Vector2f,
  CoordinateType, RenderTexture, type StreamResult,
} from '../src';

class CustomStream extends InputStream {
  read(bytes: Uint8Array): StreamResult {
    bytes.fill(0);
    return Promise.resolve(0n);
  }
  seek(position: bigint): StreamResult { return position; }
  tell(): StreamResult { return 0n; }
  getSize(): StreamResult { return undefined; }
}

const stream = new MemoryInputStream(new Uint8Array(8));
const texture = new Texture();
const image = new Image();
const file = new FileInputStream();
const fileOpen: Promise<boolean> = file.open('image.png');
const fileRead: Promise<bigint | undefined> = file.read(new Uint8Array(4));
const fileSeek: Promise<bigint | undefined> = file.seek(0n);
const filePosition: Promise<bigint | undefined> = file.tell();
const fileSize: Promise<bigint | undefined> = file.getSize();
const fileClose: Promise<void> = file.close();
image.loadFromStream(file);
texture.loadFromStream(file);
new Shader().loadFromStream(file, Shader.Type.Fragment);
const imageLoad: Promise<boolean> = image.loadFromStream(new CustomStream());
const textureLoad: Promise<boolean> = texture.loadFromStream(stream, true);
const bytesRead: StreamResult = stream.read(new Uint8Array(4));
const window = new Window(new Vector2u(64, 32), 'Texture source');
new Window().create(new Vector2u(64, 32), 'Texture source');
texture.update(window);
texture.update(window, new Vector2u());
const active: boolean = window.setActive();
const open: boolean = window.isOpen();
const size: Vector2u = window.getSize();
const id: number = texture.getNativeHandle();
const view = new RenderTexture(new Vector2u(8, 8)).getTexture();
const borrowedId: number = view.getNativeHandle();
Texture.bind(texture);
Texture.bind(view, CoordinateType.Pixels);
Texture.bind(null);
window.display();
window.close();
// @ts-expect-error Stream loading remains asynchronous.
const synchronous: boolean = image.loadFromStream(stream);
// @ts-expect-error File opening is asynchronous.
const fileSync: boolean = file.open('image.png');
// @ts-expect-error File offsets use bigint.
file.seek(1);
// @ts-expect-error Files are opened through the asynchronous open method.
new FileInputStream('image.png');
// @ts-expect-error A Node Readable without random access is not an InputStream.
image.loadFromStream({ read() { return 0n; } });
// @ts-expect-error File offsets use bigint.
stream.seek(2);
// @ts-expect-error The borrowed texture cannot be overwritten.
view.loadFromStream(stream);
// @ts-expect-error Window update accepts only a destination.
texture.update(window, new Vector2u(), new Vector2u());
// @ts-expect-error Window dimensions require unsigned vectors.
new Window(new Vector2f(), 'Wrong dimensions');
// @ts-expect-error Texture.bind accepts texture references.
Texture.bind(image);
// @ts-expect-error GL binding is a static method.
texture.bind(null);
void [
  imageLoad, textureLoad, bytesRead, active, open, size, id, borrowedId,
  synchronous, fileOpen, fileRead, fileSeek, filePosition, fileSize, fileClose,
  fileSync,
];
