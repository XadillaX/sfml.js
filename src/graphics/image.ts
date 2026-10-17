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

/**
 * Compile-time const view. Runtime storage is the same native Uint8Array.
 * @zh 编译时的 const 视图。运行时存储仍是同一个原生 Uint8Array。
 * @ja コンパイル時の const ビュー。実行時ストレージは同じネイティブ Uint8Array です。
 * @ko 컴파일 시점의 const 뷰입니다. 런타임 저장 공간은 동일한 네이티브 Uint8Array입니다.
 */
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

/**
 * Internal ownership transfer for native image producers.
 * @zh 供原生图像生成方使用的内部所有权转移。
 * @ja ネイティブ画像生成元のための内部所有権移譲。
 * @ko 네이티브 이미지 생성자를 위한 내부 소유권 이전입니다.
 */
export let imageFromMapping: (mapping: NativeImageResource) => Image;

/**
 * Native-owned RGBA8 pixels with asynchronous file and codec operations.
 * @zh 由原生层拥有的 RGBA8 像素，支持异步文件和编解码操作。
 * @ja 非同期のファイル操作とコーデック操作に対応するネイティブ所有の RGBA8 ピクセル。
 * @ko 비동기 파일 및 코덱 연산을 지원하는 네이티브 소유 RGBA8 픽셀입니다.
 */
export class Image {
  readonly [graphicsNative]: NativeGraphicsHandle<'image'>;
  /**
   * Native image metadata and RGBA pixel view.
   * @zh 原生图像元信息和 RGBA 像素视图。
   * @ja ネイティブ画像メタデータと RGBA ピクセルビュー。
   * @ko 네이티브 이미지 메타데이터 및 RGBA 픽셀 뷰입니다.
   */
  private state: ReturnType<typeof view>;

  static {
    imageFromMapping = mapping => {
      const image = Object.create(Image.prototype) as Image;
      Object.defineProperty(image, graphicsNative, { value: mapping.handle });
      image.state = view(mapping);
      return image;
    };
  }

  /**
   * Creates an empty image without pixels.
   * @zh 创建没有像素的空图像。
   * @ja ピクセルのない空の画像を作成します。
   * @ko 픽셀이 없는 빈 이미지를 만듭니다.
   */
  constructor();
  /**
   * Deep-copies an image's RGBA pixels.
   * @zh 深复制图像的 RGBA 像素。
   * @ja 画像の RGBA ピクセルをディープコピーします。
   * @ko 이미지의 RGBA 픽셀을 깊은 복사합니다.
   */
  constructor(source: Image);
  /**
   * Creates an image of the specified pixel size; fills with a color or copies
   * RGBA8 bytes, defaulting to black.
   * @zh 创建指定像素尺寸的图像；使用颜色填充或复制 RGBA8 字节，默认黑色。
   * @ja 指定ピクセルサイズの画像を作成します。色で塗りつぶすか RGBA8 バイトをコピーし、既定色は黒です。
   * @ko 지정한 픽셀 크기의 이미지를 만듭니다. 색상으로 채우거나 RGBA8 바이트를 복사하며 기본 색상은 검정입니다.
   */
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

  /**
   * Writable extension; old views retain old images after resize or load.
   * @zh 可写扩展；调整尺寸或加载后，旧视图仍保留旧图像。
   * @ja 書き込み可能な拡張。サイズ変更や読み込み後も、既存ビューは以前の画像を保持します。
   * @ko 쓰기 가능한 확장입니다. 크기 변경 또는 로드 후에도 기존 뷰는 이전 이미지를 유지합니다.
   */
  get pixels(): Uint8Array {
    return this.state.pixels;
  }

  /**
   * Returns a copy of the image width and height in pixels.
   * @zh 返回图像像素宽度和高度的副本。
   * @ja 画像のピクセル幅と高さのコピーを返します。
   * @ko 이미지의 픽셀 너비와 높이 복사본을 반환합니다.
   */
  getSize(): Vector2u {
    return new Vector2u(this.state.width, this.state.height);
  }

  /**
   * Empty images have no pixel pointer. Constness is enforced by TypeScript.
   * @zh 空图像没有像素指针。只读约束由 TypeScript 保证。
   * @ja 空の画像にはピクセルポインターがありません。const 制約は TypeScript が強制します。
   * @ko 빈 이미지에는 픽셀 포인터가 없습니다. const 제약은 TypeScript가 적용합니다.
   */
  getPixelsPtr(): ReadonlyPixels | undefined {
    return this.pixels.length ? this.pixels : undefined;
  }

  /**
   * Rebuilds pixel storage and fills with a color or copies RGBA8 data;
   * previous pixels views retain the old storage.
   * @zh 重建像素存储并填充颜色或复制 RGBA8 数据；之前的 pixels 视图保留旧存储。
   * @ja ピクセルストレージを再構築し、色で塗りつぶすか RGBA8 データをコピーします。以前の pixels ビューは旧ストレージを保持します。
   * @ko 픽셀 저장 공간을 다시 만들고 색상으로 채우거나 RGBA8 데이터를 복사합니다. 이전 pixels 뷰는 기존 저장 공간을
   * 유지합니다.
   */
  resize(
    size: Readonly<Vector2u>,
    colorOrPixels: ReadonlyValue<Color> | Uint8Array = Color.Black,
  ): void {
    coordinates(size);
    this.state = view(native.resizeImage(
      this[graphicsNative], size.x, size.y, content(colorOrPixels),
    ));
  }

  /**
   * Returns a copy of the specified pixel's color; throws RangeError for
   * out-of-bounds coordinates.
   * @zh 返回指定像素的颜色副本；坐标越界抛出 RangeError。
   * @ja 指定ピクセルの色のコピーを返します。座標が範囲外なら RangeError を投げます。
   * @ko 지정한 픽셀 색상의 복사본을 반환합니다. 좌표가 범위를 벗어나면 RangeError를 던집니다.
   */
  getPixel(coords: Readonly<Vector2u>): Color {
    const offset = this.offset(coords);
    const pixels = this.pixels;
    return new Color(pixels[offset], pixels[offset + 1],
      pixels[offset + 2], pixels[offset + 3]);
  }

  /**
   * Copies a color into the specified pixel; throws RangeError for
   * out-of-bounds coordinates.
   * @zh 复制颜色到指定像素；坐标越界抛出 RangeError。
   * @ja 指定ピクセルに色をコピーします。座標が範囲外なら RangeError を投げます。
   * @ko 지정한 픽셀에 색상을 복사합니다. 좌표가 범위를 벗어나면 RangeError를 던집니다.
   */
  setPixel(coords: Readonly<Vector2u>, color: ReadonlyValue<Color>): void {
    const offset = this.offset(coords);
    if (!(color instanceof Color)) throw new TypeError('Expected a Color');
    this.pixels.set(color[colorStorage], offset);
  }

  /**
   * Sets the alpha of pixels exactly matching color to alpha (default 0),
   * preserving RGB.
   * @zh 将与 color 完全匹配的像素透明度设为 alpha（默认 0），保留 RGB。
   * @ja color と完全一致するピクセルの透明度を alpha（既定値 0）に設定し、RGB は保持します。
   * @ko color와 정확히 일치하는 픽셀의 알파를 alpha(기본값 0)로 설정하며 RGB는 유지합니다.
   */
  createMaskFromColor(color: ReadonlyValue<Color>, alpha = 0): void {
    if (!(color instanceof Color)) throw new TypeError('Expected a Color');
    if (typeof alpha !== 'number') throw new TypeError('Expected numeric alpha');
    // eslint-disable-next-line no-bitwise
    const byte = alpha & 255;
    native.maskImage(
      this[graphicsNative], color.toInteger(), byte,
    );
  }

  /**
   * Copies sourceRect (the entire source by default) to dest; applyAlpha
   * enables alpha blending. Returns whether it succeeded.
   * @zh 复制 sourceRect（默认整个源图）到 dest；applyAlpha 启用透明度混合，返回是否成功。
   * @ja sourceRect（既定はソース全体）を dest にコピーします。applyAlpha は Alpha ブレンドを有効にします。成功したか
   * を返します。
   * @ko sourceRect(기본값은 전체 소스)를 dest에 복사합니다. applyAlpha는 알파 블렌딩을 활성화합니다. 성공 여부를
   * 반환합니다.
   */
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

  /**
   * Flips pixels horizontally in place.
   * @zh 原地左右翻转像素。
   * @ja ピクセルをその場で左右反転します。
   * @ko 픽셀을 제자리에서 좌우 반전합니다.
   */
  flipHorizontally(): void {
    native.flipImage(this[graphicsNative], true);
  }

  /**
   * Flips pixels vertically in place.
   * @zh 原地上下翻转像素。
   * @ja ピクセルをその場で上下反転します。
   * @ko 픽셀을 제자리에서 상하 반전합니다.
   */
  flipVertically(): void {
    native.flipImage(this[graphicsNative], false);
  }

  /**
   * Reads and decodes an image file asynchronously, replacing pixel storage on
   * success; returns whether it succeeded.
   * @zh 异步读取并解码图像文件，成功后替换像素存储，返回是否成功。
   * @ja 画像ファイルを非同期に読み込み、デコードします。成功時にピクセルストレージを置き換え、成功したかを返します。
   * @ko 이미지 파일을 비동기로 읽고 디코딩합니다. 성공하면 픽셀 저장 공간을 교체하며 성공 여부를 반환합니다.
   */
  loadFromFile(filename: string): Promise<boolean> {
    return this.load(callback => {
      native.loadImageFile(this[graphicsNative], filename, callback);
    });
  }

  /**
   * Decodes encoded image bytes such as PNG/JPEG asynchronously and returns
   * whether it succeeded.
   * @zh 异步解码 PNG/JPEG 等编码图像字节，返回是否成功。
   * @ja PNG/JPEG などのエンコード済み画像バイト列を非同期にデコードし、成功したかを返します。
   * @ko PNG/JPEG 등의 인코딩된 이미지 바이트를 비동기로 디코딩하고 성공 여부를 반환합니다.
   */
  loadFromMemory(data: Uint8Array): Promise<boolean> {
    return this.load(callback => {
      native.loadImageMemory(this[graphicsNative], data, callback);
    });
  }

  /**
   * Decodes an image asynchronously from a seekable input stream; stream errors
   * reject the Promise.
   * @zh 从可寻址输入流异步解码图像；流异常会拒绝 Promise。
   * @ja シーク可能な入力ストリームから画像を非同期にデコードします。ストリーム例外では Promise が拒否されます。
   * @ko 탐색 가능한 입력 스트림에서 이미지를 비동기로 디코딩합니다. 스트림 예외는 Promise를 거부합니다.
   */
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

  /**
   * Encodes and saves an image asynchronously using the file extension; returns
   * whether it succeeded.
   * @zh 按文件扩展名异步编码并保存图像，返回是否成功。
   * @ja ファイル拡張子に従って画像を非同期にエンコードして保存し、成功したかを返します。
   * @ko 파일 확장자에 따라 이미지를 비동기로 인코딩하고 저장하며 성공 여부를 반환합니다.
   */
  saveToFile(filename: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      native.saveImageFile(this[graphicsNative], filename, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  /**
   * Encodes asynchronously to format (such as png) and returns bytes; returns
   * undefined if encoding fails.
   * @zh 异步编码为 format（如 png）指定的格式，返回字节；编码失败返回 undefined。
   * @ja format（png など）の形式に非同期にエンコードし、バイト列を返します。エンコード失敗時は undefined を返します。
   * @ko format(예: png) 형식으로 비동기 인코딩하여 바이트를 반환합니다. 인코딩 실패 시 undefined를 반환합니다.
   */
  saveToMemory(format: string): Promise<Uint8Array | undefined> {
    return new Promise((resolve, reject) => {
      native.saveImageMemory(this[graphicsNative], format, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  /**
   * Common asynchronous loading entry point, using callbacks to drive native
   * decoding.
   * @zh 通用异步加载入口，用回调驱动原生解码。
   * @ja コールバックでネイティブデコードを駆動する、共通の非同期読み込み入口。
   * @ko 콜백으로 네이티브 디코딩을 구동하는 공통 비동기 로드 진입점입니다.
   */
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

  /**
   * Converts pixel coordinates to a byte offset in state.pixels.
   * @zh 将像素坐标转换为 state.pixels 中的字节偏移。
   * @ja ピクセル座標を state.pixels 内のバイトオフセットに変換します。
   * @ko 픽셀 좌표를 state.pixels 안의 바이트 오프셋으로 변환합니다.
   */
  private offset(coords: Readonly<Vector2u>): number {
    coordinates(coords);
    const { x, y } = coords;
    if (x >= this.state.width || y >= this.state.height) {
      throw new RangeError('Pixel coordinates are outside the image');
    }
    return (y * this.state.width + x) * 4;
  }
}
