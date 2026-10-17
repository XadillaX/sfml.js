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

/**
 * Compile-time const reference to the same texture resource.
 * @zh 同一个纹理资源的编译时 const 引用。
 * @ja 同一テクスチャリソースへのコンパイル時 const 参照。
 * @ko 동일한 텍스처 리소스에 대한 컴파일 시점의 const 참조입니다.
 */
export type ReadonlyTexture = Readonly<Pick<Texture,
typeof graphicsNative | typeof textureId | typeof textureOwner |
'getSize' | 'copyToImage' | 'isSmooth' | 'isRepeated' | 'isSrgb' |
'getNativeHandle'>>;

/**
 * Internal factory for a render target's borrowed GPU texture.
 * @zh 渲染目标借用 GPU 纹理的内部工厂。
 * @ja レンダーターゲットから借用する GPU テクスチャの内部ファクトリー。
 * @ko 렌더 대상에서 빌린 GPU 텍스처를 위한 내부 팩토리입니다.
 */
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

/**
 * GPU texture with background image decoding and ordered pixel uploads.
 * @zh 支持后台图像解码和有序像素上传的 GPU 纹理。
 * @ja バックグラウンド画像デコードと順序付きピクセルアップロードに対応する GPU テクスチャ。
 * @ko 백그라운드 이미지 디코딩과 순서가 보장되는 픽셀 업로드를 지원하는 GPU 텍스처입니다.
 */
export class Texture {
  readonly [graphicsNative]: NativeGraphicsHandle<'texture'>;
  readonly [textureId]: number;
  readonly [textureOwner]?: PendingTarget;
  /**
   * Read-only view of native texture metadata.
   * @zh 原生纹理元信息只读视图。
   * @ja ネイティブテクスチャメタデータの読み取り専用ビュー。
   * @ko 네이티브 텍스처 메타데이터의 읽기 전용 뷰입니다.
   */
  private state: Readonly<NativeTextureInfo>;
  /**
   * Owner reference when the texture is a borrowed view from a font or render
   * texture.
   * @zh 当纹理为字体或渲染纹理借出视图时的所有者引用。
   * @ja フォントまたはレンダーテクスチャから借用したビューの場合の所有者参照。
   * @ko 글꼴 또는 렌더 텍스처에서 빌린 뷰인 경우의 소유자 참조입니다.
   */
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

  /**
   * Creates an empty texture with no pixels allocated.
   * @zh 创建未分配像素的空纹理。
   * @ja ピクセル未割り当ての空のテクスチャを作成します。
   * @ko 픽셀이 할당되지 않은 빈 텍스처를 만듭니다.
   */
  constructor();
  /**
   * Allocates a GPU texture of the specified pixel size; sRgb defaults to
   * false.
   * @zh 分配指定像素尺寸的 GPU 纹理；sRgb 默认 false。
   * @ja 指定ピクセルサイズの GPU テクスチャを割り当てます。sRgb の既定値は false です。
   * @ko 지정한 픽셀 크기의 GPU 텍스처를 할당합니다. sRgb의 기본값은 false입니다.
   */
  constructor(size: Readonly<Vector2u>, sRgb?: boolean);
  /**
   * Deep-copies texture pixels and settings.
   * @zh 深复制纹理像素和配置。
   * @ja テクスチャのピクセルと設定をディープコピーします。
   * @ko 텍스처 픽셀과 설정을 깊은 복사합니다.
   */
  constructor(source: ReadonlyTexture);
  /**
   * Creates a texture from an image pixel region, using the whole image when
   * area is omitted; throws SFMLError on failure.
   * @zh 从图像像素区域创建纹理，省略 area 时使用整张图像；失败抛出 SFMLError。
   * @ja 画像のピクセル領域からテクスチャを作成します。area を省略すると画像全体を使用し、失敗時は SFMLError を投げます。
   * @ko 이미지 픽셀 영역에서 텍스처를 만듭니다. area를 생략하면 전체 이미지를 사용하며 실패 시 SFMLError를 던집니다.
   */
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

  /**
   * Returns the maximum texture side length supported by the current graphics
   * card, in pixels.
   * @zh 返回当前显卡支持的最大纹理边长，单位为像素。
   * @ja 現在のグラフィックスカードが対応するテクスチャの最大辺長をピクセル単位で返します。
   * @ko 현재 그래픽 카드가 지원하는 최대 텍스처 변 길이를 픽셀 단위로 반환합니다.
   */
  static getMaximumSize(): number {
    return native.getMaximumTextureSize();
  }

  /**
   * Bind in the current GL context; retain the texture while using its ID.
   * @zh 在当前 GL 上下文中绑定；使用其 ID 期间须保留纹理。
   * @ja 現在の GL コンテキストにバインドします。ID を使用している間はテクスチャを保持してください。
   * @ko 현재 GL 컨텍스트에 바인딩합니다. ID를 사용하는 동안 텍스처를 유지해야 합니다.
   */
  static bind(
    texture: ReadonlyTexture | null,
    coordinateType = CoordinateType.Normalized,
  ): void {
    if (texture !== null && !(texture instanceof Texture)) {
      throw new TypeError('Expected a Texture or null');
    }
    native.bindTexture(texture?.[graphicsNative] ?? null, coordinateType);
  }

  /**
   * Returns the OpenGL texture identifier, or 0 for an empty texture; retain
   * the texture object while using it.
   * @zh 返回 OpenGL 纹理标识，空纹理为 0；使用期间需保留纹理对象。
   * @ja OpenGL テクスチャ識別子を返します。空のテクスチャは 0 です。使用中はテクスチャオブジェクトを保持してください。
   * @ko OpenGL 텍스처 식별자를 반환하며 빈 텍스처는 0입니다. 사용하는 동안 텍스처 객체를 유지해야 합니다.
   */
  getNativeHandle(): number {
    return this.state.nativeHandle;
  }

  /**
   * Returns a copy of the texture's width and height in pixels.
   * @zh 返回纹理像素宽高的副本。
   * @ja テクスチャのピクセル幅と高さのコピーを返します。
   * @ko 텍스처의 픽셀 너비와 높이 복사본을 반환합니다.
   */
  getSize(): Vector2u {
    return new Vector2u(this.state.width, this.state.height);
  }

  /**
   * Successful resize leaves pixel contents undefined, as in SFML.
   * @zh 与 SFML 一致，调整尺寸成功后像素内容未定义。
   * @ja SFML と同様に、サイズ変更に成功するとピクセル内容は未定義になります。
   * @ko SFML과 마찬가지로 크기 변경에 성공하면 픽셀 내용은 미정 상태가 됩니다.
   */
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

  /**
   * Synchronous GPU readback into an independent, native-owned Image.
   * @zh 同步从 GPU 回读到独立的、由原生层拥有的 Image。
   * @ja GPU から独立したネイティブ所有の Image へ同期的に読み戻します。
   * @ko GPU에서 독립적인 네이티브 소유 Image로 동기적으로 읽어옵니다.
   */
  copyToImage(): Image {
    return imageFromMapping(native.copyTextureToImage(this[graphicsNative]));
  }

  /**
   * Generates mipmap levels for minification and returns whether it succeeded;
   * regenerate after updating pixels.
   * @zh 生成缩小采样用的 mipmap 层级，返回是否成功；更新像素后需要重新生成。
   * @ja 縮小サンプリング用の mipmap レベルを生成し、成功したかを返します。ピクセル更新後は再生成が必要です。
   * @ko 축소 샘플링용 mipmap 수준을 생성하고 성공 여부를 반환합니다. 픽셀 갱신 후 다시 생성해야 합니다.
   */
  generateMipmap(): boolean {
    this.checkWritable();
    flushGraphics();
    return native.generateTextureMipmap(this[graphicsNative]);
  }

  /**
   * Synchronously swaps pixels and settings after submitting recorded draws;
   * cannot be used on borrowed texture views.
   * @zh 同步交换像素和配置，先提交已录制绘制；不可用于借用的纹理视图。
   * @ja 記録済み描画を先に送信し、ピクセルと設定を同期的に交換します。借用テクスチャビューには使用できません。
   * @ko 기록된 그리기를 먼저 제출한 후 픽셀과 설정을 동기적으로 교환합니다. 빌린 텍스처 뷰에는 사용할 수 없습니다.
   */
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

  /**
   * Synchronously deep-copies source into this texture, preserving wrapper
   * identity and returning this.
   * @zh 同步深复制 source 到当前纹理，保留当前包装对象身份并返回 this。
   * @ja source を現在のテクスチャに同期的にディープコピーし、現在のラッパーの同一性を保持して this を返します。
   * @ko source를 현재 텍스처로 동기적으로 깊은 복사하며 현재 래퍼의 동일성을 유지하고 this를 반환합니다.
   */
  assign(source: ReadonlyTexture): this {
    this.checkWritable();
    if (!(source instanceof Texture)) throw new TypeError('Expected a Texture');
    if (source === this) return this;
    flushGraphics();
    native.assignTexture(this[graphicsNative], source[graphicsNative]);
    return this;
  }

  /**
   * Decodes a file asynchronously, then uploads pixels and returns success;
   * area uses pixel coordinates and defaults to the whole image.
   * @zh 异步解码文件后上传像素，返回是否成功；area 使用像素坐标，默认整张图像。
   * @ja ファイルを非同期にデコードしてピクセルをアップロードし、成功したかを返します。area はピクセル座標で、既定は画像全体です。
   * @ko 파일을 비동기로 디코딩한 후 픽셀을 업로드하고 성공 여부를 반환합니다. area는 픽셀 좌표이며 기본값은 전체 이미지입니다.
   */
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

  /**
   * Decodes encoded image bytes asynchronously, then uploads pixels and returns
   * success; sRgb defaults to false.
   * @zh 异步解码编码图像字节后上传像素，返回是否成功；sRgb 默认 false。
   * @ja エンコード済み画像バイト列を非同期にデコードし、ピクセルをアップロードして成功したかを返します。sRgb の既定値は false です。
   * @ko 인코딩된 이미지 바이트를 비동기로 디코딩한 후 픽셀을 업로드하고 성공 여부를 반환합니다. sRgb의 기본값은 false입니다.
   */
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

  /**
   * Decodes and uploads an image asynchronously from a seekable stream,
   * returning success; stream errors reject the Promise.
   * @zh 从可寻址流异步解码并上传图像，返回是否成功；流异常会拒绝 Promise。
   * @ja シーク可能なストリームから画像を非同期にデコードしてアップロードし、成功したかを返します。ストリーム例外では Promise が拒否されます。
   * @ko 탐색 가능한 스트림에서 이미지를 비동기로 디코딩하고 업로드하여 성공 여부를 반환합니다. 스트림 예외는 Promise를
   * 거부합니다.
   */
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

  /**
   * Synchronously uploads the specified pixel region of an Image, defaulting to
   * the whole image; returns whether it succeeded.
   * @zh 同步上传 Image 的指定像素区域，默认完整图像，返回是否成功。
   * @ja Image の指定ピクセル領域を同期的にアップロードし、成功したかを返します。既定は画像全体です。
   * @ko Image의 지정한 픽셀 영역을 동기적으로 업로드하고 성공 여부를 반환합니다. 기본값은 전체 이미지입니다.
   */
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

  /**
   * Synchronously updates the entire texture; pixels must contain exactly width
   * * height * 4 RGBA8 bytes.
   * @zh 同步更新整个纹理；pixels 必须恰好包含宽×高×4 个 RGBA8 字节。
   * @ja テクスチャ全体を同期的に更新します。pixels は正確に幅×高さ×4 の RGBA8 バイトを含む必要があります。
   * @ko 전체 텍스처를 동기적으로 갱신합니다. pixels는 정확히 너비×높이×4개의 RGBA8 바이트를 포함해야 합니다.
   */
  update(pixels: Uint8Array): void;
  /**
   * Uploads an RGBA8 pixel block of size to dest; all coordinates and
   * dimensions are in pixels.
   * @zh 将 size 大小的 RGBA8 像素块上传到 dest；所有坐标和尺寸均以像素计。
   * @ja size の RGBA8 ピクセルブロックを dest にアップロードします。すべての座標とサイズはピクセル単位です。
   * @ko size 크기의 RGBA8 픽셀 블록을 dest에 업로드합니다. 모든 좌표와 크기는 픽셀 단위입니다.
   */
  update(
    pixels: Uint8Array, size: Readonly<Vector2u>, dest: Readonly<Vector2u>,
  ): void;
  /**
   * Copies image, texture or window contents to dest (default origin); the
   * destination region must fit the entire source.
   * @zh 将图像、纹理或窗口内容复制到 dest（默认原点），目标区域必须容纳整个源。
   * @ja 画像、テクスチャ、またはウィンドウの内容を dest（既定は原点）にコピーします。出力先領域はソース全体を収容できる必要があります。
   * @ko 이미지, 텍스처 또는 창 내용을 dest(기본값은 원점)에 복사합니다. 대상 영역은 전체 소스를 담을 수 있어야 합니다.
   */
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

  /**
   * Enables or disables smooth texture filtering.
   * @zh 启用或关闭纹理平滑过滤。
   * @ja テクスチャの平滑化フィルタリングを有効化または無効化します。
   * @ko 텍스처의 부드러운 필터링을 활성화하거나 비활성화합니다.
   */
  setSmooth(smooth: boolean): void {
    this.checkWritable();
    flag(smooth);
    if (smooth === this.state.smooth) return;
    flushGraphics();
    native.setTextureSmooth(this[graphicsNative], smooth);
  }

  /**
   * Returns whether smooth filtering is enabled.
   * @zh 返回是否启用平滑过滤。
   * @ja 平滑化フィルタリングが有効かを返します。
   * @ko 부드러운 필터링 활성화 여부를 반환합니다.
   */
  isSmooth(): boolean {
    return this.state.smooth;
  }

  /**
   * Sets whether coordinates outside the texture repeat it; false uses edge
   * pixels.
   * @zh 设置超出纹理范围的坐标是否重复平铺；false 使用边缘像素。
   * @ja テクスチャ外の座標で繰り返し表示するかを設定します。false は端のピクセルを使います。
   * @ko 텍스처 범위 밖 좌표에서 반복 타일링할지 설정합니다. false는 가장자리 픽셀을 사용합니다.
   */
  setRepeated(repeated: boolean): void {
    this.checkWritable();
    flag(repeated);
    if (repeated === this.state.repeated) return;
    flushGraphics();
    native.setTextureRepeated(this[graphicsNative], repeated);
  }

  /**
   * Returns whether repeating is enabled.
   * @zh 返回是否启用重复平铺。
   * @ja 繰り返し表示が有効かを返します。
   * @ko 반복 타일링 활성화 여부를 반환합니다.
   */
  isRepeated(): boolean {
    return this.state.repeated;
  }

  /**
   * Returns whether the texture uses the sRGB format.
   * @zh 返回纹理是否使用 sRGB 格式。
   * @ja テクスチャが sRGB 形式を使用するかを返します。
   * @ko 텍스처의 sRGB 형식 사용 여부를 반환합니다.
   */
  isSrgb(): boolean {
    return this.state.sRgb;
  }

  /**
   * Rejects writes when the texture is a read-only borrowed view.
   * @zh 当纹理为只读借出视图时拒绝写入。
   * @ja テクスチャが読み取り専用の借用ビューの場合、書き込みを拒否します。
   * @ko 텍스처가 읽기 전용으로 빌린 뷰이면 쓰기를 거부합니다.
   */
  private checkWritable(): void {
    if (this[textureOwner]) throw new TypeError('Cannot modify a RenderTexture texture view');
    if (this.resourceOwner) throw new TypeError('Cannot modify a Font texture view');
  }

  /**
   * Validates that the update region lies within the texture.
   * @zh 校验更新区域是否在纹理范围内。
   * @ja 更新領域がテクスチャの範囲内にあるかを検証します。
   * @ko 갱신 영역이 텍스처 범위 안에 있는지 검증합니다.
   */
  private checkRegion(
    width: number, height: number, x: number, y: number,
  ): void {
    if (x > this.state.width || y > this.state.height ||
        width > this.state.width - x || height > this.state.height - y) {
      throw new RangeError('Update region is outside the texture');
    }
  }
}
