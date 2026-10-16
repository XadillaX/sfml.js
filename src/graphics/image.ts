import {
  native, type NativeGraphicsHandle, type NativeImageMapping,
  type NativeImageResource,
} from '../internal/native';
import { graphicsNative } from '../internal/graphics-state';
import { nativeStruct } from '../internal/struct-view';
import { streamDispatch } from '../internal/input-stream';
import type { InputStream } from '../system/input-stream';
import { colorStorage, type ReadonlyValue } from '../internal/value-storage';
import { Vector2, Vector2u } from '../system/vector2';
import { Color } from './color';
import { IntRect } from './rect';

/** Compile-time const view. Runtime storage is the same native Uint8Array. */
export type ReadonlyPixels = Readonly<Pick<Uint8Array,
number | 'length' | 'byteLength' | 'byteOffset' | typeof Symbol.iterator |
'slice' | 'entries' | 'keys' | 'values'>>;

function coordinates(value: Readonly<Vector2u>): void {
  if (!(value instanceof Vector2) || value.scalarType !== 'u32') {
    throw new TypeError('Expected a Vector2u');
  }
}

function content(value: ReadonlyValue<Color> | Uint8Array): number | Uint8Array {
  if (value instanceof Color) return value.toInteger();
  if (value instanceof Uint8Array) return value;
  throw new TypeError('Expected a Color or RGBA Uint8Array');
}

function view(mapping: NativeImageMapping) {
  return nativeStruct<{ width: number; height: number; pixels: Uint8Array }>(
    mapping.info, { pixels: new Uint8Array(mapping.buffer) });
}

/** Internal ownership transfer for native image producers. */
export let imageFromMapping: (mapping: NativeImageResource) => Image;

/** Native-owned RGBA8 pixels with asynchronous file and codec operations. */
export class Image {
  readonly [graphicsNative]: NativeGraphicsHandle<'image'>;
  /** 原生图像元信息和 RGBA 像素视图。 */
  private state: ReturnType<typeof view>;

  static {
    imageFromMapping = mapping => {
      const image = Object.create(Image.prototype) as Image;
      Object.defineProperty(image, graphicsNative, { value: mapping.handle });
      image.state = view(mapping);
      return image;
    };
  }

  /** 创建没有像素的空图像。 */
  constructor();
  /** 深复制图像的 RGBA 像素。 */
  constructor(source: Image);
  /** 创建指定像素尺寸的图像；使用颜色填充或复制 RGBA8 字节，默认黑色。 */
  constructor(
    size: Readonly<Vector2u>, colorOrPixels?: ReadonlyValue<Color> | Uint8Array,
  );
  constructor(
    sizeOrSource?: Readonly<Vector2u> | Image,
    colorOrPixels: ReadonlyValue<Color> | Uint8Array = Color.Black,
  ) {
    let mapping;
    if (sizeOrSource instanceof Image) {
      mapping = native.createImage(sizeOrSource[graphicsNative]);
    } else if (sizeOrSource === undefined) {
      mapping = native.createImage(0, 0, Color.Black.toInteger());
    } else {
      coordinates(sizeOrSource);
      mapping = native.createImage(
        sizeOrSource.x, sizeOrSource.y, content(colorOrPixels),
      );
    }
    this[graphicsNative] = mapping.handle;
    this.state = view(mapping);
  }

  /** Writable extension; old views retain old images after resize or load. */
  get pixels(): Uint8Array {
    return this.state.pixels;
  }

  /** 返回图像像素宽度和高度的副本。 */
  getSize(): Vector2u {
    return new Vector2u(this.state.width, this.state.height);
  }

  /** Empty images have no pixel pointer. Constness is enforced by TypeScript. */
  getPixelsPtr(): ReadonlyPixels | undefined {
    return this.pixels.length ? this.pixels : undefined;
  }

  /** 重建像素存储并填充颜色或复制 RGBA8 数据；之前的 pixels 视图保留旧存储。 */
  resize(
    size: Readonly<Vector2u>,
    colorOrPixels: ReadonlyValue<Color> | Uint8Array = Color.Black,
  ): void {
    coordinates(size);
    this.state = view(native.resizeImage(
      this[graphicsNative], size.x, size.y, content(colorOrPixels),
    ));
  }

  /** 返回指定像素的颜色副本；坐标越界抛出 RangeError。 */
  getPixel(coords: Readonly<Vector2u>): Color {
    const offset = this.offset(coords);
    const pixels = this.pixels;
    return new Color(pixels[offset], pixels[offset + 1],
      pixels[offset + 2], pixels[offset + 3]);
  }

  /** 复制颜色到指定像素；坐标越界抛出 RangeError。 */
  setPixel(coords: Readonly<Vector2u>, color: ReadonlyValue<Color>): void {
    const offset = this.offset(coords);
    if (!(color instanceof Color)) throw new TypeError('Expected a Color');
    this.pixels.set(color[colorStorage], offset);
  }

  /** 将与 color 完全匹配的像素透明度设为 alpha（默认 0），保留 RGB。 */
  createMaskFromColor(color: ReadonlyValue<Color>, alpha = 0): void {
    if (!(color instanceof Color)) throw new TypeError('Expected a Color');
    if (typeof alpha !== 'number') throw new TypeError('Expected numeric alpha');
    // eslint-disable-next-line no-bitwise
    const byte = alpha & 255;
    native.maskImage(
      this[graphicsNative], color.toInteger(), byte,
    );
  }

  /** 复制 sourceRect（默认整个源图）到 dest；applyAlpha 启用透明度混合，返回是否成功。 */
  copy(
    source: Image, dest: Readonly<Vector2u>,
    sourceRect?: ReadonlyValue<IntRect>, applyAlpha = false,
  ): boolean {
    if (!(source instanceof Image)) throw new TypeError('Expected an Image');
    coordinates(dest);
    if (sourceRect !== undefined && !(sourceRect instanceof IntRect)) {
      throw new TypeError('Expected an IntRect');
    }
    return native.copyImage(
      this[graphicsNative], source[graphicsNative], dest.x, dest.y,
      sourceRect?.position.x ?? 0, sourceRect?.position.y ?? 0,
      sourceRect?.size.x ?? 0, sourceRect?.size.y ?? 0, applyAlpha,
    );
  }

  /** 原地左右翻转像素。 */
  flipHorizontally(): void {
    native.flipImage(this[graphicsNative], true);
  }

  /** 原地上下翻转像素。 */
  flipVertically(): void {
    native.flipImage(this[graphicsNative], false);
  }

  /** 异步读取并解码图像文件，成功后替换像素存储，返回是否成功。 */
  loadFromFile(filename: string): Promise<boolean> {
    return this.load(callback => {
      native.loadImageFile(this[graphicsNative], filename, callback);
    });
  }

  /** 异步解码 PNG/JPEG 等编码图像字节，返回是否成功。 */
  loadFromMemory(data: Uint8Array): Promise<boolean> {
    return this.load(callback => {
      native.loadImageMemory(this[graphicsNative], data, callback);
    });
  }

  /** 从可寻址输入流异步解码图像；流异常会拒绝 Promise。 */
  async loadFromStream(stream: InputStream): Promise<boolean> {
    let failure: { error: unknown } | undefined;
    const dispatch = streamDispatch(stream, error => { failure = { error }; });
    try {
      return await this.load(callback => {
        native.loadImageStream(this[graphicsNative], dispatch, callback);
      });
    } catch (error) {
      throw failure ? failure.error : error;
    }
  }

  /** 按文件扩展名异步编码并保存图像，返回是否成功。 */
  saveToFile(filename: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      native.saveImageFile(this[graphicsNative], filename, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  /** 异步编码为 format（如 png）指定的格式，返回字节；编码失败返回 undefined。 */
  saveToMemory(format: string): Promise<Uint8Array | undefined> {
    return new Promise((resolve, reject) => {
      native.saveImageMemory(this[graphicsNative], format, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  /** 通用异步加载入口，用回调驱动原生解码。 */
  private load(start: (
    callback: (error: Error | null, mapping?: NativeImageMapping) => void,
  ) => void): Promise<boolean> {
    return new Promise((resolve, reject) => {
      start((error, mapping) => {
        if (error) reject(error);
        else {
          if (mapping) this.state = view(mapping);
          resolve(mapping !== undefined);
        }
      });
    });
  }

  /** 将像素坐标转换为 state.pixels 中的字节偏移。 */
  private offset(coords: Readonly<Vector2u>): number {
    coordinates(coords);
    const { x, y } = coords;
    if (x >= this.state.width || y >= this.state.height) {
      throw new RangeError('Pixel coordinates are outside the image');
    }
    return (y * this.state.width + x) * 4;
  }
}
