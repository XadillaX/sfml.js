import { resolve } from 'node:path';
import {
  native, type NativeGraphicsHandle, type NativeFontMapping,
} from '../internal/native';
import { nativeStruct } from '../internal/struct-view';
import { graphicsContext, graphicsNative, flushGraphics } from '../internal/graphics-state';
import { type ReadonlyValue as R } from '../internal/value-storage';
import { InputStream } from '../system/input-stream';
import { Glyph, glyphFromMapping } from './glyph';
import { fontTextureFromMapping, type ReadonlyTexture } from './texture';

/**
 * Identity and properties of the current font.
 * @zh 当前字体的标识和字体特性。
 * @ja 現在のフォントの識別情報と特性。
 * @ko 현재 글꼴의 식별 정보 및 특성입니다.
 */
export interface FontInfo {
  /**
   * Native font identifier.
   * @zh 原生字体标识。
   * @ja ネイティブフォント識別子。
   * @ko 네이티브 글꼴 식별자입니다.
   */
  readonly id: bigint;
  /**
   * Font family name.
   * @zh 字体族名称。
   * @ja フォントファミリー名。
   * @ko 글꼴 패밀리 이름입니다.
   */
  readonly family: string;
  /**
   * Whether kerning data is available.
   * @zh 是否包含字距调整数据。
   * @ja カーニングデータの有無。
   * @ko 커닝 데이터 포함 여부입니다.
   */
  readonly hasKerning: boolean;
  /**
   * Whether vertical metrics are available.
   * @zh 是否包含竖排度量。
   * @ja 縦書きメトリクスの有無。
   * @ko 세로쓰기 메트릭 포함 여부입니다.
   */
  readonly hasVerticalMetrics: boolean;
}

export const fontRevision: unique symbol = Symbol('Font.revision');
/**
 * Read-only interface to the same font resource, retaining the font and its
 * glyph textures for their lifetimes.
 * @zh 同一个字体资源的只读接口，保留字体及其字形纹理的生命周期。
 * @ja 同一フォントリソースへの読み取り専用インターフェース。フォントとグリフテクスチャの寿命を保持します。
 * @ko 동일한 글꼴 리소스의 읽기 전용 인터페이스입니다. 글꼴과 글리프 텍스처의 수명을 유지합니다.
 */
export type ReadonlyFont = Readonly<Pick<Font,
typeof graphicsNative | typeof fontRevision | 'getInfo' | 'getGlyph' |
'getGlyphById' | 'hasGlyph' | 'getKerning' | 'getAscent' | 'getDescent' |
'getLineSpacing' | 'getUnderlinePosition' | 'getUnderlineThickness' |
'getTexture' | 'isSmooth'>>;

export function fontUnsigned(value: number, maximum = 0xffffffff): number {
  if (!Number.isInteger(value) || value < 0 || value > maximum) {
    throw new RangeError('Expected an unsigned integer within range');
  }
  return value;
}

export function textFloat(value: number): number {
  if (typeof value !== 'number') throw new TypeError('Expected a number');
  const result = Math.fround(value);
  if (!Number.isFinite(result)) throw new RangeError('Expected a finite float32 value');
  return result;
}

function flag(value: boolean): void {
  if (typeof value !== 'boolean') throw new TypeError('Expected a boolean');
}

function fontViews(mapping: NativeFontMapping) {
  const { smooth, ...fields } = mapping.fields;
  return {
    info: nativeStruct<FontInfo>({ buffers: mapping.buffers, fields },
      { family: mapping.family }),
    sampling: nativeStruct<{ smooth: boolean }>({
      buffers: mapping.buffers, fields: { smooth },
    }),
  };
}

/**
 * Native-owned font face, input storage and retained glyph atlases.
 * @zh 由原生层拥有的字体、输入存储和保留的字形图集。
 * @ja ネイティブ所有のフォントフェイス、入力ストレージ、保持されたグリフアトラス。
 * @ko 네이티브가 소유하는 글꼴 페이스와 입력 저장 공간 및 유지되는 글리프 아틀라스입니다.
 */
export class Font {
  readonly [graphicsNative]: NativeGraphicsHandle<'font'>;
  [fontRevision] = 0;
  private state: ReturnType<typeof fontViews>;
  private readonly textures = new Map<number, ReadonlyTexture>();
  private readonly glyphs = new Map<string, R<Glyph>>();
  private readonly metrics = new Map<number, Array<number | undefined>>();
  private readonly kernings = new Map<string, number>();
  private readonly coverage = new Map<number, boolean>();

  /**
   * Creates an empty font or copies an existing font.
   * @zh 创建空字体，或从现有字体创建副本。
   * @ja 空のフォントを作成するか、既存フォントをコピーします。
   * @ko 빈 글꼴을 만들거나 기존 글꼴을 복사합니다.
   */
  constructor(source?: ReadonlyFont) {
    if (source !== undefined && !(source instanceof Font)) {
      throw new TypeError('Expected a Font');
    }
    const mapping = native.createFont(graphicsContext(), source?.[graphicsNative]);
    this[graphicsNative] = mapping.handle;
    this.state = fontViews(mapping);
  }

  /**
   * Opens a font file asynchronously; on success replaces the font and clears
   * metric caches. Returns whether it succeeded.
   * @zh 异步打开字体文件，成功后替换字体并清空度量缓存，返回是否成功。
   * @ja フォントファイルを非同期に開きます。成功時にフォントを置き換え、メトリクスキャッシュを消去します。成功したかを返します。
   * @ko 글꼴 파일을 비동기로 엽니다. 성공하면 글꼴을 교체하고 메트릭 캐시를 지웁니다. 성공 여부를 반환합니다.
   */
  async openFromFile(filename: string): Promise<boolean> {
    if (typeof filename !== 'string' || filename.includes('\0')) {
      throw new TypeError('Expected a font path without null bytes');
    }
    return this.open(filename ? resolve(filename) : filename);
  }

  /**
   * Opens encoded font bytes asynchronously and returns whether it succeeded.
   * @zh 从编码字体字节异步打开字体，返回是否成功。
   * @ja エンコードされたフォントバイト列を非同期に開き、成功したかを返します。
   * @ko 인코딩된 글꼴 바이트를 비동기로 열고 성공 여부를 반환합니다.
   */
  async openFromMemory(data: Uint8Array): Promise<boolean> {
    if (!(data instanceof Uint8Array)) throw new TypeError('Expected a Uint8Array');
    return this.open(data);
  }

  /**
   * Reads all font bytes from the start of the stream and opens asynchronously;
   * returns success, and stream errors reject the Promise.
   * @zh 从流起点读取全部字体字节并异步打开；返回是否成功，流异常会拒绝 Promise。
   * @ja ストリームの先頭からフォントの全バイトを読み、非同期に開きます。成功したかを返し、ストリーム例外では Promise が拒否されます。
   * @ko 스트림 시작부터 모든 글꼴 바이트를 읽고 비동기로 엽니다. 성공 여부를 반환하며 스트림 예외는 Promise를 거부합니다.
   */
  async openFromStream(stream: InputStream): Promise<boolean> {
    if (!(stream instanceof InputStream)) throw new TypeError('Expected an InputStream');
    const size = await stream.getSize();
    if (size === undefined || size === 0n) return false;
    if (typeof size !== 'bigint' || size < 0n || size > 0x7fffffffn) {
      throw new RangeError('Font stream size exceeds the buffer limit');
    }
    const position = await stream.seek(0n);
    if (position === undefined) return false;
    if (position !== 0n) throw new RangeError('Font stream must seek to its beginning');
    const bytes = new Uint8Array(Number(size));
    let offset = 0;
    while (offset < bytes.length) {
      const count = await stream.read(bytes.subarray(offset));
      if (count === undefined || count === 0n) return false;
      if (typeof count !== 'bigint' || count < 0n ||
          count > BigInt(bytes.length - offset)) {
        throw new RangeError('Invalid font stream read count');
      }
      offset += Number(count);
    }
    return this.open(bytes);
  }

  /**
   * Returns a read-only view of the current font information.
   * @zh 返回当前字体信息的只读视图。
   * @ja 現在のフォント情報の読み取り専用ビューを返します。
   * @ko 현재 글꼴 정보의 읽기 전용 뷰를 반환합니다.
   */
  getInfo(): FontInfo { return this.state.info; }

  /**
   * Gets the cached glyph for a Unicode code point; size and outline thickness
   * are in pixels, and bold controls emboldening.
   * @zh 获取 Unicode 码点对应的缓存字形；字号和轮廓厚度以像素计，bold 控制加粗。
   * @ja Unicode コードポイントのキャッシュ済みグリフを取得します。サイズと輪郭の太さはピクセル単位で、bold は太字化を制御します。
   * @ko Unicode 코드 포인트의 캐시된 글리프를 가져옵니다. 글자 크기와 윤곽선 두께는 픽셀 단위이며 bold는 굵게 표시할지
   * 제어합니다.
   */
  getGlyph(codePoint: number, characterSize: number, bold: boolean,
    outlineThickness = 0): R<Glyph> {
    fontUnsigned(codePoint, 0x10ffff);
    return this.glyph(codePoint, characterSize, bold, outlineThickness, false);
  }

  /**
   * Gets a glyph by its internal font glyph index; size and outline thickness
   * are in pixels.
   * @zh 按字体内部字形编号取得字形；字号和轮廓厚度以像素计。
   * @ja フォント内部のグリフ番号でグリフを取得します。サイズと輪郭の太さはピクセル単位です。
   * @ko 글꼴 내부 글리프 번호로 글리프를 가져옵니다. 글자 크기와 윤곽선 두께는 픽셀 단위입니다.
   */
  getGlyphById(id: number, characterSize: number, bold: boolean,
    outlineThickness = 0): R<Glyph> {
    fontUnsigned(id);
    return this.glyph(id, characterSize, bold, outlineThickness, true);
  }

  /**
   * Returns whether the font has a glyph for the specified Unicode code point.
   * @zh 返回字体是否包含指定 Unicode 码点的字形。
   * @ja 指定 Unicode コードポイントのグリフをフォントが含むかを返します。
   * @ko 지정한 Unicode 코드 포인트의 글리프가 글꼴에 있는지 반환합니다.
   */
  hasGlyph(codePoint: number): boolean {
    fontUnsigned(codePoint, 0x10ffff);
    let exists = this.coverage.get(codePoint);
    if (exists === undefined) {
      exists = native.fontMetric(this[graphicsNative], 5, codePoint) as boolean;
      this.coverage.set(codePoint, exists);
    }
    return exists;
  }

  /**
   * Returns kerning between two Unicode code points in pixels.
   * @zh 返回两个 Unicode 码点之间的字距调整量，单位为像素。
   * @ja 二つの Unicode コードポイント間のカーニング量をピクセル単位で返します。
   * @ko 두 Unicode 코드 포인트 간의 커닝 양을 픽셀 단위로 반환합니다.
   */
  getKerning(first: number, second: number, characterSize: number, bold = false): number {
    fontUnsigned(first, 0x10ffff);
    fontUnsigned(second, 0x10ffff);
    fontUnsigned(characterSize);
    flag(bold);
    const key = `${first}:${second}:${characterSize}:${+bold}`;
    let value = this.kernings.get(key);
    if (value === undefined) {
      flushGraphics();
      value = native.fontMetric(this[graphicsNative], 6,
        first, second, characterSize, bold) as number;
      this.kernings.set(key, value);
    }
    return value;
  }

  /**
   * Returns the ascent in pixels for the specified pixel character size.
   * @zh 返回指定像素字号的上升度量，单位为像素。
   * @ja 指定ピクセル文字サイズでのアセントをピクセル単位で返します。
   * @ko 지정한 픽셀 글자 크기의 어센트를 픽셀 단위로 반환합니다.
   */
  getAscent(size: number): number { return this.metric(0, size); }
  /**
   * Returns the descent in pixels for the specified pixel character size.
   * @zh 返回指定像素字号的下降度量，单位为像素。
   * @ja 指定ピクセル文字サイズでのディセントをピクセル単位で返します。
   * @ko 지정한 픽셀 글자 크기의 디센트를 픽셀 단위로 반환합니다.
   */
  getDescent(size: number): number { return this.metric(1, size); }
  /**
   * Returns recommended baseline spacing for the specified pixel character
   * size.
   * @zh 返回指定像素字号的推荐基线间距。
   * @ja 指定ピクセル文字サイズでの推奨ベースライン間隔を返します。
   * @ko 지정한 픽셀 글자 크기의 권장 기준선 간격을 반환합니다.
   */
  getLineSpacing(size: number): number { return this.metric(2, size); }
  /**
   * Returns the underline position relative to the baseline in pixels.
   * @zh 返回下划线相对基线的位置，单位为像素。
   * @ja ベースラインに対する下線位置をピクセル単位で返します。
   * @ko 기준선에 대한 밑줄 위치를 픽셀 단위로 반환합니다.
   */
  getUnderlinePosition(size: number): number { return this.metric(3, size); }
  /**
   * Returns the underline thickness in pixels.
   * @zh 返回下划线厚度，单位为像素。
   * @ja 下線の太さをピクセル単位で返します。
   * @ko 밑줄 두께를 픽셀 단위로 반환합니다.
   */
  getUnderlineThickness(size: number): number { return this.metric(4, size); }

  /**
   * Returns a read-only glyph atlas texture reference for the specified pixel
   * character size; loading more glyphs may update its contents.
   * @zh 返回指定像素字号的字形图集只读纹理引用，后续加载字形可能更新其内容。
   * @ja 指定ピクセル文字サイズのグリフアトラステクスチャへの読み取り専用参照を返します。後続のグリフ読み込みで内容が更新される場合があります。
   * @ko 지정한 픽셀 글자 크기의 글리프 아틀라스 텍스처에 대한 읽기 전용 참조를 반환합니다. 이후 글리프를 로드하면 내용이 갱신될 수
   * 있습니다.
   */
  getTexture(characterSize: number): ReadonlyTexture {
    fontUnsigned(characterSize);
    let texture = this.textures.get(characterSize);
    if (!texture) {
      flushGraphics();
      texture = fontTextureFromMapping(
        native.getFontTexture(this[graphicsNative], characterSize), this);
      this.textures.set(characterSize, texture);
    }
    return texture;
  }

  /**
   * Sets whether font textures use smooth filtering.
   * @zh 设置字体纹理是否使用平滑过滤。
   * @ja フォントテクスチャに平滑化フィルタリングを使用するかを設定します。
   * @ko 글꼴 텍스처의 부드러운 필터링 사용 여부를 설정합니다.
   */
  setSmooth(smooth: boolean): void {
    flag(smooth);
    if (smooth === this.state.sampling.smooth) return;
    flushGraphics();
    native.setFontSmooth(this[graphicsNative], smooth);
  }
  /**
   * Returns whether font textures use smooth filtering.
   * @zh 返回字体纹理是否启用平滑过滤。
   * @ja フォントテクスチャで平滑化フィルタリングが有効かを返します。
   * @ko 글꼴 텍스처의 부드러운 필터링 사용 여부를 반환합니다.
   */
  isSmooth(): boolean { return this.state.sampling.smooth; }

  private metric(metric: number, size: number): number {
    fontUnsigned(size);
    let values = this.metrics.get(size);
    if (!values) this.metrics.set(size, values = []);
    let value = values[metric];
    if (value === undefined) {
      value = native.fontMetric(this[graphicsNative], metric, size) as number;
      values[metric] = value;
    }
    return value;
  }

  private glyph(id: number, size: number, bold: boolean, outline: number,
    byId: boolean): R<Glyph> {
    fontUnsigned(size);
    flag(bold);
    outline = textFloat(outline);
    const key = `${+byId}:${id}:${size}:${+bold}:${outline}`;
    let glyph = this.glyphs.get(key);
    if (!glyph) {
      flushGraphics();
      const value = glyphFromMapping(native.getFontGlyph(
        this[graphicsNative], id, size, bold, outline, byId));
      glyph = value;
      this.glyphs.set(key, glyph);
    }
    return glyph;
  }

  private open(input: string | Uint8Array): Promise<boolean> {
    return new Promise((resolve, reject) => {
      native.openFont(input, (error, data) => {
        if (error) return reject(error);
        if (!data) return resolve(false);
        try {
          flushGraphics();
          this.state = fontViews(native.commitFont(this[graphicsNative], data));
          this[fontRevision]++;
          this.glyphs.clear();
          this.metrics.clear();
          this.kernings.clear();
          this.coverage.clear();
          this.textures.clear();
          resolve(true);
        } catch (error) { reject(error); }
      });
    });
  }
}
