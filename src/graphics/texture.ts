import {
  native, type NativeGraphicsHandle, type NativeTextureInfo,
  type NativeTextureMapping,
} from '../internal/native';
import {
  graphicsContext, graphicsNative, flushGraphics, textureId, textureOwner,
  type PendingTarget,
} from '../internal/graphics-state';
import { type ReadonlyValue } from '../internal/value-storage';
import { nativeStruct } from '../internal/struct-view';
import { Vector2, Vector2u } from '../system/vector2';
import { SFMLError } from '../system/error';
import type { InputStream } from '../system/input-stream';
import { Window } from '../window/window';
import { Image, imageFromMapping } from './image';
import { IntRect } from './rect';
import { CoordinateType } from './render-states';

/** Compile-time const reference to the same texture resource. */
export type ReadonlyTexture = Readonly<Pick<Texture,
typeof graphicsNative | typeof textureId | typeof textureOwner |
'getSize' | 'copyToImage' | 'isSmooth' | 'isRepeated' | 'isSrgb' |
'getNativeHandle'>>;

/** Internal factory for a render target's borrowed GPU texture. */
export let textureFromMapping: (
  mapping: NativeTextureMapping, owner: PendingTarget,
) => ReadonlyTexture;

export let fontTextureFromMapping: (
  mapping: NativeTextureMapping, owner: object,
) => ReadonlyTexture;

function coordinates(value: Readonly<Vector2u>): void {
  if (!(value instanceof Vector2) || value.scalarType !== 'u32') {
    throw new TypeError('Expected a Vector2u');
  }
}

function flag(value: boolean): void {
  if (typeof value !== 'boolean') throw new TypeError('Expected a boolean');
}

function areaSnapshot(area?: ReadonlyValue<IntRect>): IntRect | undefined {
  if (area === undefined) return undefined;
  if (!(area instanceof IntRect)) throw new TypeError('Expected an IntRect');
  return new IntRect(area);
}

/** GPU texture with background image decoding and ordered pixel uploads. */
export class Texture {
  readonly [graphicsNative]: NativeGraphicsHandle<'texture'>;
  readonly [textureId]: number;
  readonly [textureOwner]?: PendingTarget;
  /** 原生纹理元信息只读视图。 */
  private state: Readonly<NativeTextureInfo>;
  /** 当纹理为字体或渲染纹理借出视图时的所有者引用。 */
  private resourceOwner?: object;

  static {
    textureFromMapping = (mapping, owner) => {
      const texture = Object.create(Texture.prototype) as Texture;
      Object.defineProperties(texture, {
        [graphicsNative]: { value: mapping.handle },
        [textureId]: { value: mapping.id },
        [textureOwner]: { value: owner },
      });
      texture.state = nativeStruct<NativeTextureInfo>(mapping.info);
      return texture;
    };
    fontTextureFromMapping = (mapping, owner) => {
      const texture = Object.create(Texture.prototype) as Texture;
      Object.defineProperties(texture, {
        [graphicsNative]: { value: mapping.handle },
        [textureId]: { value: mapping.id },
      });
      texture.state = nativeStruct<NativeTextureInfo>(mapping.info);
      texture.resourceOwner = owner;
      return texture;
    };
  }

  /** 创建未分配像素的空纹理。 */
  constructor();
  /** 分配指定像素尺寸的 GPU 纹理；sRgb 默认 false。 */
  constructor(size: Readonly<Vector2u>, sRgb?: boolean);
  /** 深复制纹理像素和配置。 */
  constructor(source: ReadonlyTexture);
  /** 从图像像素区域创建纹理，省略 area 时使用整张图像；失败抛出 SFMLError。 */
  constructor(image: Image, sRgb?: boolean, area?: ReadonlyValue<IntRect>);
  constructor(
    source?: Readonly<Vector2u> | ReadonlyTexture | Image, sRgb = false,
    area?: ReadonlyValue<IntRect>,
  ) {
    flag(sRgb);
    if (source !== undefined && !(source instanceof Texture) &&
        !(source instanceof Image)) coordinates(source as Readonly<Vector2u>);
    if (area !== undefined && !(area instanceof IntRect)) {
      throw new TypeError('Expected an IntRect');
    }
    const context = graphicsContext();
    let mapping;
    if (source instanceof Texture) {
      mapping = native.createTexture(context, source[graphicsNative]);
    } else if (source === undefined || source instanceof Image) {
      mapping = native.createTexture(context);
    } else {
      const size = source as Readonly<Vector2u>;
      mapping = native.createTexture(context, size.x, size.y, sRgb);
    }
    this[graphicsNative] = mapping.handle;
    this[textureId] = mapping.id;
    this.state = nativeStruct<NativeTextureInfo>(mapping.info);
    if (source instanceof Image && !this.loadFromImage(source, sRgb, area)) {
      throw new SFMLError('SFML could not create the texture from the image');
    }
  }

  /** 返回当前显卡支持的最大纹理边长，单位为像素。 */
  static getMaximumSize(): number {
    return native.getMaximumTextureSize();
  }

  /** Bind in the current GL context; retain the texture while using its ID. */
  static bind(
    texture: ReadonlyTexture | null,
    coordinateType = CoordinateType.Normalized,
  ): void {
    if (texture !== null && !(texture instanceof Texture)) {
      throw new TypeError('Expected a Texture or null');
    }
    native.bindTexture(texture?.[graphicsNative] ?? null, coordinateType);
  }

  /** 返回 OpenGL 纹理标识，空纹理为 0；使用期间需保留纹理对象。 */
  getNativeHandle(): number {
    return this.state.nativeHandle;
  }

  /** 返回纹理像素宽高的副本。 */
  getSize(): Vector2u {
    return new Vector2u(this.state.width, this.state.height);
  }

  /** Successful resize leaves pixel contents undefined, as in SFML. */
  resize(size: Readonly<Vector2u>, sRgb = false): boolean {
    this.checkWritable();
    coordinates(size);
    flag(sRgb);
    flushGraphics();
    const state = native.resizeTexture(
      this[graphicsNative], size.x, size.y, sRgb,
    );
    return state !== undefined;
  }

  /** Synchronous GPU readback into an independent, native-owned Image. */
  copyToImage(): Image {
    return imageFromMapping(native.copyTextureToImage(this[graphicsNative]));
  }

  /** 生成缩小采样用的 mipmap 层级，返回是否成功；更新像素后需要重新生成。 */
  generateMipmap(): boolean {
    this.checkWritable();
    flushGraphics();
    return native.generateTextureMipmap(this[graphicsNative]);
  }

  /** 同步交换像素和配置，先提交已录制绘制；不可用于借用的纹理视图。 */
  swap(other: Texture): void {
    this.checkWritable();
    if (!(other instanceof Texture)) throw new TypeError('Expected a Texture');
    other.checkWritable();
    if (other === this) return;
    flushGraphics();
    native.swapTextures(
      this[graphicsNative], other[graphicsNative],
    );
  }

  /** 同步深复制 source 到当前纹理，保留当前包装对象身份并返回 this。 */
  assign(source: ReadonlyTexture): this {
    this.checkWritable();
    if (!(source instanceof Texture)) throw new TypeError('Expected a Texture');
    if (source === this) return this;
    flushGraphics();
    native.assignTexture(this[graphicsNative], source[graphicsNative]);
    return this;
  }

  /** 异步解码文件后上传像素，返回是否成功；area 使用像素坐标，默认整张图像。 */
  async loadFromFile(
    filename: string, sRgb = false, area?: ReadonlyValue<IntRect>,
  ): Promise<boolean> {
    this.checkWritable();
    flag(sRgb);
    const snapshot = areaSnapshot(area);
    const image = new Image();
    if (!await image.loadFromFile(filename)) return false;
    return this.loadFromImage(image, sRgb, snapshot);
  }

  /** 异步解码编码图像字节后上传像素，返回是否成功；sRgb 默认 false。 */
  async loadFromMemory(
    data: Uint8Array, sRgb = false, area?: ReadonlyValue<IntRect>,
  ): Promise<boolean> {
    this.checkWritable();
    flag(sRgb);
    const snapshot = areaSnapshot(area);
    const image = new Image();
    if (!await image.loadFromMemory(data)) return false;
    return this.loadFromImage(image, sRgb, snapshot);
  }

  /** 从可寻址流异步解码并上传图像，返回是否成功；流异常会拒绝 Promise。 */
  async loadFromStream(
    stream: InputStream, sRgb = false, area?: ReadonlyValue<IntRect>,
  ): Promise<boolean> {
    this.checkWritable();
    flag(sRgb);
    const snapshot = areaSnapshot(area);
    const image = new Image();
    if (!await image.loadFromStream(stream)) return false;
    return this.loadFromImage(image, sRgb, snapshot);
  }

  /** 同步上传 Image 的指定像素区域，默认完整图像，返回是否成功。 */
  loadFromImage(
    image: Image, sRgb = false, area?: ReadonlyValue<IntRect>,
  ): boolean {
    this.checkWritable();
    if (!(image instanceof Image)) throw new TypeError('Expected an Image');
    flag(sRgb);
    if (area !== undefined && !(area instanceof IntRect)) {
      throw new TypeError('Expected an IntRect');
    }
    flushGraphics();
    const state = native.loadTextureImage(
      this[graphicsNative], image[graphicsNative], sRgb,
      area?.position.x ?? 0, area?.position.y ?? 0,
      area?.size.x ?? 0, area?.size.y ?? 0,
    );
    return state !== undefined;
  }

  /** 同步更新整个纹理；pixels 必须恰好包含宽×高×4 个 RGBA8 字节。 */
  update(pixels: Uint8Array): void;
  /** 将 size 大小的 RGBA8 像素块上传到 dest；所有坐标和尺寸均以像素计。 */
  update(
    pixels: Uint8Array, size: Readonly<Vector2u>, dest: Readonly<Vector2u>,
  ): void;
  /** 将图像、纹理或窗口内容复制到 dest（默认原点），目标区域必须容纳整个源。 */
  update(
    source: Image | ReadonlyTexture | Window, dest?: Readonly<Vector2u>,
  ): void;
  update(
    source: Uint8Array | Image | ReadonlyTexture | Window,
    sizeOrDest?: Readonly<Vector2u>, dest?: Readonly<Vector2u>,
  ): void {
    this.checkWritable();
    if (sizeOrDest !== undefined) coordinates(sizeOrDest);
    if (dest !== undefined) coordinates(dest);
    if (source instanceof Uint8Array) {
      if ((sizeOrDest === undefined) !== (dest === undefined)) {
        throw new TypeError('Pixel region requires both size and destination');
      }
      const width = sizeOrDest?.x ?? this.state.width;
      const height = sizeOrDest?.y ?? this.state.height;
      const x = dest?.x ?? 0;
      const y = dest?.y ?? 0;
      this.checkRegion(width, height, x, y);
      if (source.byteLength !== width * height * 4) {
        throw new RangeError('Pixel length must equal width * height * 4');
      }
      flushGraphics();
      native.updateTexture(this[graphicsNative], source, width, height, x, y);
      return;
    }
    if (!(source instanceof Image) && !(source instanceof Texture) &&
        !(source instanceof Window)) {
      throw new TypeError('Expected RGBA Uint8Array, Image, Texture or Window');
    }
    if (dest !== undefined) {
      throw new TypeError('Image, Texture or Window update only accepts a destination');
    }
    if (source instanceof Window && !source.isOpen()) return;
    const size = source.getSize();
    const x = sizeOrDest?.x ?? 0;
    const y = sizeOrDest?.y ?? 0;
    this.checkRegion(size.x, size.y, x, y);
    flushGraphics();
    if (source instanceof Image) {
      native.updateTextureImage(this[graphicsNative], source[graphicsNative],
        x, y);
    } else if (source instanceof Window) {
      native.updateTextureWindow(this[graphicsNative], source[graphicsNative],
        x, y);
    } else {
      native.updateTextureTexture(this[graphicsNative], source[graphicsNative],
        x, y);
    }
  }

  /** 启用或关闭纹理平滑过滤。 */
  setSmooth(smooth: boolean): void {
    this.checkWritable();
    flag(smooth);
    if (smooth === this.state.smooth) return;
    flushGraphics();
    native.setTextureSmooth(this[graphicsNative], smooth);
  }

  /** 返回是否启用平滑过滤。 */
  isSmooth(): boolean {
    return this.state.smooth;
  }

  /** 设置超出纹理范围的坐标是否重复平铺；false 使用边缘像素。 */
  setRepeated(repeated: boolean): void {
    this.checkWritable();
    flag(repeated);
    if (repeated === this.state.repeated) return;
    flushGraphics();
    native.setTextureRepeated(this[graphicsNative], repeated);
  }

  /** 返回是否启用重复平铺。 */
  isRepeated(): boolean {
    return this.state.repeated;
  }

  /** 返回纹理是否使用 sRGB 格式。 */
  isSrgb(): boolean {
    return this.state.sRgb;
  }

  /** 当纹理为只读借出视图时拒绝写入。 */
  private checkWritable(): void {
    if (this[textureOwner]) throw new TypeError('Cannot modify a RenderTexture texture view');
    if (this.resourceOwner) throw new TypeError('Cannot modify a Font texture view');
  }

  /** 校验更新区域是否在纹理范围内。 */
  private checkRegion(
    width: number, height: number, x: number, y: number,
  ): void {
    if (x > this.state.width || y > this.state.height ||
        width > this.state.width - x || height > this.state.height - y) {
      throw new RangeError('Update region is outside the texture');
    }
  }
}
