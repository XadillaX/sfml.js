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

/** 当前字体的标识和字体特性。 */
export interface FontInfo {
  /** 原生字体标识。 */
  readonly id: bigint;
  /** 字体族名称。 */
  readonly family: string;
  /** 是否包含字距调整数据。 */
  readonly hasKerning: boolean;
  /** 是否包含竖排度量。 */
  readonly hasVerticalMetrics: boolean;
}

export const fontRevision: unique symbol = Symbol('Font.revision');
/** 同一个字体资源的只读接口，保留字体及其字形纹理的生命周期。 */
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

/** Native-owned font face, input storage and retained glyph atlases. */
export class Font {
  readonly [graphicsNative]: NativeGraphicsHandle<'font'>;
  [fontRevision] = 0;
  private state: ReturnType<typeof fontViews>;
  private readonly textures = new Map<number, ReadonlyTexture>();
  private readonly glyphs = new Map<string, R<Glyph>>();
  private readonly metrics = new Map<number, Array<number | undefined>>();
  private readonly kernings = new Map<string, number>();
  private readonly coverage = new Map<number, boolean>();

  /** 创建空字体，或从现有字体创建副本。 */
  constructor(source?: ReadonlyFont) {
    if (source !== undefined && !(source instanceof Font)) {
      throw new TypeError('Expected a Font');
    }
    const mapping = native.createFont(graphicsContext(), source?.[graphicsNative]);
    this[graphicsNative] = mapping.handle;
    this.state = fontViews(mapping);
  }

  /** 异步打开字体文件，成功后替换字体并清空度量缓存，返回是否成功。 */
  async openFromFile(filename: string): Promise<boolean> {
    if (typeof filename !== 'string' || filename.includes('\0')) {
      throw new TypeError('Expected a font path without null bytes');
    }
    return this.open(filename ? resolve(filename) : filename);
  }

  /** 从编码字体字节异步打开字体，返回是否成功。 */
  async openFromMemory(data: Uint8Array): Promise<boolean> {
    if (!(data instanceof Uint8Array)) throw new TypeError('Expected a Uint8Array');
    return this.open(data);
  }

  /** 从流起点读取全部字体字节并异步打开；返回是否成功，流异常会拒绝 Promise。 */
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

  /** 返回当前字体信息的只读视图。 */
  getInfo(): FontInfo { return this.state.info; }

  /** 获取 Unicode 码点对应的缓存字形；字号和轮廓厚度以像素计，bold 控制加粗。 */
  getGlyph(codePoint: number, characterSize: number, bold: boolean,
    outlineThickness = 0): R<Glyph> {
    fontUnsigned(codePoint, 0x10ffff);
    return this.glyph(codePoint, characterSize, bold, outlineThickness, false);
  }

  /** 按字体内部字形编号取得字形；字号和轮廓厚度以像素计。 */
  getGlyphById(id: number, characterSize: number, bold: boolean,
    outlineThickness = 0): R<Glyph> {
    fontUnsigned(id);
    return this.glyph(id, characterSize, bold, outlineThickness, true);
  }

  /** 返回字体是否包含指定 Unicode 码点的字形。 */
  hasGlyph(codePoint: number): boolean {
    fontUnsigned(codePoint, 0x10ffff);
    let exists = this.coverage.get(codePoint);
    if (exists === undefined) {
      exists = native.fontMetric(this[graphicsNative], 5, codePoint) as boolean;
      this.coverage.set(codePoint, exists);
    }
    return exists;
  }

  /** 返回两个 Unicode 码点之间的字距调整量，单位为像素。 */
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

  /** 返回指定像素字号的上升度量，单位为像素。 */
  getAscent(size: number): number { return this.metric(0, size); }
  /** 返回指定像素字号的下降度量，单位为像素。 */
  getDescent(size: number): number { return this.metric(1, size); }
  /** 返回指定像素字号的推荐基线间距。 */
  getLineSpacing(size: number): number { return this.metric(2, size); }
  /** 返回下划线相对基线的位置，单位为像素。 */
  getUnderlinePosition(size: number): number { return this.metric(3, size); }
  /** 返回下划线厚度，单位为像素。 */
  getUnderlineThickness(size: number): number { return this.metric(4, size); }

  /** 返回指定像素字号的字形图集只读纹理引用，后续加载字形可能更新其内容。 */
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

  /** 设置字体纹理是否使用平滑过滤。 */
  setSmooth(smooth: boolean): void {
    flag(smooth);
    if (smooth === this.state.sampling.smooth) return;
    flushGraphics();
    native.setFontSmooth(this[graphicsNative], smooth);
  }
  /** 返回字体纹理是否启用平滑过滤。 */
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
