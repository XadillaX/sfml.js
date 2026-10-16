import {
  native, type NativeGraphicsHandle,
  type NativeGlyphProcessor,
} from '../internal/native';
import {
  dispatchDrawable, flushGraphics, graphicsNative, recordVertices, vertexArrayBytes,
} from '../internal/graphics-state';
import {
  withTransformable, transformableState, type TransformableState,
} from '../internal/transformable';
import { mutableValue, type ReadonlyValue as R } from '../internal/value-storage';
import { ShapedGlyphBuffer, ShapedGlyphView } from '../internal/shaped-glyph';
import { TextIndices } from '../internal/text-indices';
import { Vector2f } from '../system/vector2';
import { SFMLError } from '../system/error';
import { Color } from './color';
import { Drawable } from './drawable';
import { Font, fontRevision, fontUnsigned, textFloat, type ReadonlyFont } from './font';
import type { Glyph } from './glyph';
import { FloatRect } from './rect';
import { RenderStates, CoordinateType } from './render-states';
import type { RenderTarget } from './render-target';
import { vertexArrayFromMapping, VertexArray } from './vertex-array';

/** 文本样式位标志，可按位组合。 */
export enum TextStyle {
  /** 常规。 */
  Regular = 0,
  /** 粗体。 */
  Bold = 1,
  /** 斜体。 */
  Italic = 2,
  /** 下划线。 */
  Underlined = 4,
  /** 删除线。 */
  StrikeThrough = 8,
}
/** 文本行对齐方式。 */
export enum LineAlignment {
  /** 根据文字方向选择默认对齐。 */
  Default,
  /** 左对齐。 */
  Left,
  /** 居中。 */
  Center,
  /** 右对齐。 */
  Right,
}
/** 文本整形时的字形簇分组方式。 */
export enum ClusterGrouping {
  /** 按用户感知的字素分组。 */
  Grapheme,
  /** 按 Unicode 字符分组。 */
  Character,
  /** 不合并字形簇。 */
  None,
}
/** 字形排布方向。 */
export enum TextDirection {
  /** 未指定方向。 */
  Unspecified,
  /** 从左到右。 */
  LeftToRight,
  /** 从右到左。 */
  RightToLeft,
  /** 从上到下。 */
  TopToBottom,
  /** 从下到上。 */
  BottomToTop,
}
/** 横排或竖排方向。 */
export enum TextOrientation {
  /** 默认横排。 */
  Default,
  /** 从上到下竖排。 */
  TopToBottom,
  /** 从下到上竖排。 */
  BottomToTop,
}

/** 整形后的单个字形及其布局信息。 */
export interface ShapedGlyph {
  /** 字体字形度量的只读视图。 */
  readonly glyph: R<Glyph>;
  /** 字形在文本局部坐标中的位置。 */
  readonly position: R<Vector2f>;
  /** UTF-16 index into getString(), suitable for JS slice/substring. */
  readonly cluster: number;
  /** 字形所处文本段的方向。 */
  readonly textDirection: TextDirection;
  /** 字形所在行的基线坐标。 */
  readonly baseline: number;
  /** 字形在顶点数据中的起始顶点索引。 */
  readonly vertexOffset: number;
  /** 字形占用的顶点数。 */
  readonly vertexCount: number;
}

/** 字形预处理器可修改的单字形外观。 */
export interface GlyphAppearance {
  /** 字形样式位标志。 */
  style: TextStyle;
  /** 可修改的填充颜色。 */
  get fillColor(): Color;
  /** 复制填充颜色。 */
  set fillColor(value: R<Color>);
  /** 可修改的轮廓颜色。 */
  get outlineColor(): Color;
  /** 复制轮廓颜色。 */
  set outlineColor(value: R<Color>);
  /** 轮廓厚度，单位为像素。 */
  outlineThickness: number;
}
/** 同步修改字形外观的回调；执行期间不得修改或查询同一 Text 的几何。 */
export type GlyphPreProcessor = (glyph: ShapedGlyph, appearance: GlyphAppearance) => void;

/** 文本初始参数。 */
export interface TextOptions {
  /** 字体资源，Text 会保留其引用。 */
  font: ReadonlyFont;
  /** 初始字符串，默认空串。 */
  string?: string;
  /** 像素字号，默认 30。 */
  characterSize?: number;
}

function colorInteger(value: R<Color>): number {
  if (!(value instanceof Color)) throw new TypeError('Expected a Color');
  return value.toInteger();
}

class TextResource extends Drawable {
  readonly [mutableValue] = true;
  readonly [graphicsNative]: NativeGraphicsHandle<'text'>;
  readonly [transformableState]: TransformableState;
  /** 当前字体引用。 */
  private font: ReadonlyFont;
  /** 当前显示字符串。 */
  private string = '';
  /** 字符串到字形范围的索引映射缓存。 */
  private indices?: TextIndices;
  /** Native 参数字段缓冲区的 Float32 视图。 */
  private readonly floats: Float32Array;
  /** Native 参数字段缓冲区的 Uint32 视图。 */
  private readonly words: Uint32Array;
  /** Native 颜色字段缓冲区的 DataView。 */
  private readonly colors: DataView;
  /** 几何脏标记及竖排模式标志。 */
  private readonly geometry: Uint8Array;
  /** 整形后的局部包围框 [x, y, w, h]。 */
  private readonly bounds: Float32Array;
  /** 可选的同步字形外观回调。 */
  private processor: GlyphPreProcessor | null = null;
  /** 防止在预处理器回调中递归的布尔锁。 */
  private preparing = false;
  /** 上次整形时的 fontRevision，用于跳过未变更的重新整形。 */
  private revision = -1;
  /** 填充顶点数组，几何重建时更新。 */
  private vertices!: VertexArray;
  /** 轮廓顶点数组，几何重建时更新。 */
  private outline!: VertexArray;
  /** 最近一次整形的字形布局缓存。 */
  private glyphs?: readonly ShapedGlyph[];

  /** 从字体和文本参数创建文本，或复制文本并保留字体及预处理器引用。 */
  constructor(options: TextOptions | R<TextResource>) {
    super();
    if (options instanceof TextResource) {
      options.checkIdle();
      this.font = options.font;
      this.string = options.string;
      this.indices = options.indices;
      this.processor = options.processor;
    } else {
      const init = options as TextOptions;
      if (!init || !(init.font instanceof Font)) throw new TypeError('Expected Text options with a Font');
      this.font = init.font;
    }
    const mapping = native.createText(this.font[graphicsNative],
      options instanceof TextResource ? options[graphicsNative] : undefined);
    this[graphicsNative] = mapping.handle;
    this.floats = new Float32Array(mapping.buffer);
    this.words = new Uint32Array(mapping.buffer);
    this.colors = new DataView(mapping.buffer);
    this.geometry = new Uint8Array(mapping.geometry);
    this.bounds = new Float32Array(mapping.bounds);
    this[transformableState] = {
      handle: mapping.transformable, values: new Float32Array(mapping.transform),
    };
    if (options instanceof TextResource) {
      if (!this.geometry[0] && options.revision === this.font[fontRevision]) {
        this.vertices = new VertexArray(options.vertices);
        this.outline = new VertexArray(options.outline);
        this.revision = options.revision;
      }
    } else {
      const init = options as TextOptions;
      if (init.string !== undefined) this.setString(init.string);
      if (init.characterSize !== undefined) this.setCharacterSize(init.characterSize);
    }
  }

  /** 设置显示字符串，下次查询或绘制时重新整形。 */
  setString(this: TextResource, value: string): void {
    this.checkIdle();
    if (typeof value !== 'string') throw new TypeError('Expected a string');
    if (value !== this.string) {
      this.string = value;
      this.indices = undefined;
      this.geometry[0] = 1;
    }
  }
  /** 返回当前 JS 字符串。 */
  getString(): string { return this.string; }
  /** 设置字体并保留其引用。 */
  setFont(this: TextResource, font: ReadonlyFont): void {
    this.checkIdle();
    if (!(font instanceof Font)) throw new TypeError('Expected a Font');
    if (font !== this.font) { this.font = font; this.geometry[0] = 1; }
  }
  /** 返回当前字体的只读引用。 */
  getFont(): ReadonlyFont { return this.font; }
  /** 设置像素字号。 */
  setCharacterSize(this: TextResource, size: number): void { this.set(0, fontUnsigned(size)); }
  /** 返回像素字号。 */
  getCharacterSize(): number { return this.words[0]; }
  /** 设置字间距倍率，1 为默认间距。 */
  setLetterSpacing(this: TextResource, factor: number): void { this.set(1, textFloat(factor)); }
  /** 返回字间距倍率。 */
  getLetterSpacing(): number { return this.floats[1]; }
  /** 设置行间距倍率，1 为字体默认行距。 */
  setLineSpacing(this: TextResource, factor: number): void { this.set(2, textFloat(factor)); }
  /** 返回行间距倍率。 */
  getLineSpacing(): number { return this.floats[2]; }
  /** 设置 TextStyle 位标志，可组合粗体、斜体等样式。 */
  setStyle(this: TextResource, style: TextStyle): void { this.set(3, fontUnsigned(style, 15)); }
  /** 返回文本样式位标志。 */
  getStyle(): TextStyle { return this.words[3]; }
  /** 复制填充颜色；已有几何仅重新着色。 */
  setFillColor(this: TextResource, color: R<Color>): void { this.setColor(4, colorInteger(color)); }
  /** 返回填充颜色副本。 */
  getFillColor(): Color { return new Color(this.colors.getUint32(16)); }
  /** 复制轮廓颜色；已有几何仅重新着色。 */
  setOutlineColor(this: TextResource, color: R<Color>): void { this.setColor(5, colorInteger(color)); }
  /** 返回轮廓颜色副本。 */
  getOutlineColor(): Color { return new Color(this.colors.getUint32(20)); }
  /** 设置轮廓像素厚度。 */
  setOutlineThickness(this: TextResource, thickness: number): void { this.set(6, textFloat(thickness)); }
  /** 返回轮廓像素厚度。 */
  getOutlineThickness(): number { return this.floats[6]; }
  /** 设置多行文本的对齐方式。 */
  setLineAlignment(this: TextResource, alignment: LineAlignment): void { this.set(7, fontUnsigned(alignment, 3)); }
  /** 返回行对齐方式。 */
  getLineAlignment(): LineAlignment { return this.words[7]; }
  /** 设置横排或竖排方向。 */
  setTextOrientation(this: TextResource, orientation: TextOrientation): void { this.set(8, fontUnsigned(orientation, 2)); }
  /** 返回文本排版方向。 */
  getTextOrientation(): TextOrientation { return this.words[8]; }
  /** 设置整形时的字形簇分组策略。 */
  setClusterGrouping(this: TextResource, grouping: ClusterGrouping): void { this.set(9, fontUnsigned(grouping, 2)); }
  /** 返回字形簇分组策略。 */
  getClusterGrouping(): ClusterGrouping { return this.words[9]; }

  /** 设置同步字形外观回调，null 取消；回调在几何重建时执行。 */
  setGlyphPreProcessor(this: TextResource, processor: GlyphPreProcessor | null): void {
    this.checkIdle();
    if (processor !== null && typeof processor !== 'function') {
      throw new TypeError('Expected a glyph pre-processor or null');
    }
    this.processor = processor;
    this.geometry[0] = 1;
  }

  /** 按需整形并返回字形布局视图；cluster 为 JS UTF-16 索引。 */
  getShapedGlyphs(): readonly ShapedGlyph[] {
    this.prepare();
    if (!this.glyphs) {
      const buffer = new ShapedGlyphBuffer(native.getTextGlyphs(this[graphicsNative]));
      const indices = this.getIndices();
      this.glyphs = Array.from({ length: buffer.length },
        (_, index) => new ShapedGlyphView(buffer, index, indices));
    }
    return this.glyphs;
  }
  /** 返回可修改的填充顶点数据；下一次几何重建后需要重新获取。 */
  getVertexData(): VertexArray { this.prepare(); return this.vertices; }
  /** 返回可修改的轮廓顶点数据；下一次几何重建后需要重新获取。 */
  getOutlineVertexData(): VertexArray { this.prepare(); return this.outline; }
  /** 返回整形后文本的局部轴对齐包围框。 */
  getLocalBounds(): FloatRect {
    this.prepare();
    const [ x, y, w, h ] = this.bounds;
    return new FloatRect(new Vector2f(x, y), new Vector2f(w, h));
  }

  /**
   * 返回指定字符的世界坐标，index 按 Unicode 码点计数。
   * @deprecated 使用 getShapedGlyphs() 获取完整布局。
   */
  findCharacterPos(this: Text, index: number): Vector2f {
    if (!Number.isSafeInteger(index) || index < 0) throw new RangeError('Invalid character index');
    this.prepare();
    flushGraphics();
    return this.getTransform().transformPoint(
      new Vector2f(...native.findTextCharacter(this[graphicsNative], index)));
  }

  protected draw(this: Text, target: RenderTarget, states: RenderStates): void {
    this.prepare();
    const combined = new RenderStates(states);
    combined.transform.combine(this.getTransform());
    combined.texture = this.font.getTexture(this.getCharacterSize());
    combined.coordinateType = CoordinateType.Pixels;
    if (this.outline.getVertexCount()) {
      target[recordVertices](this.outline[vertexArrayBytes],
        this.outline.getPrimitiveType(), combined);
    }
    if (this.vertices.getVertexCount()) {
      target[recordVertices](this.vertices[vertexArrayBytes],
        this.vertices.getPrimitiveType(), combined);
    }
  }

  [dispatchDrawable](this: Text, target: RenderTarget, states: RenderStates): void {
    if (this.draw === TextResource.prototype.draw) this.draw(target, states);
    else super[dispatchDrawable](target, states);
  }

  /** 仅当值变化时写入 Native 参数字段并标记几何脏。 */
  private set(index: number, value: number): void {
    this.checkIdle();
    const data = index === 1 || index === 2 || index === 6
      ? this.floats : this.words;
    if (data[index] === value) return;
    data[index] = value;
    this.geometry[0] = 1;
  }

  /** 设置填充或轮廓颜色；仅着色时直接更新顶点数据。 */
  private setColor(index: 4 | 5, value: number): void {
    this.checkIdle();
    if (this.colors.getUint32(index * 4) === value) return;
    this.colors.setUint32(index * 4, value);
    // SFML recolors existing geometry without reshaping or running callbacks.
    if (this.geometry[0] || !this.vertices) return;
    const vertices = index === 4 ? this.vertices : this.outline;
    const bytes = vertices[vertexArrayBytes];
    for (let offset = 8; offset < bytes.length; offset += 20) {
      for (let channel = 0; channel < 4; channel++) {
        bytes[offset + channel] = this.colors.getUint8(index * 4 + channel);
      }
    }
  }

  /** 在预处理器回调中执行时抛出。 */
  private checkIdle(): void {
    if (this.preparing) throw new SFMLError('Cannot update or query text geometry in its glyph pre-processor');
  }

  /** 惰性创建 UTF-16 到 Unicode 字形范围的索引。 */
  private getIndices(): TextIndices {
    this.indices ??= new TextIndices(this.string);
    return this.indices;
  }

  /** 按需执行文本整形和几何重建。 */
  private prepare(): void {
    this.checkIdle();
    if (!this.geometry[0] && this.revision === this.font[fontRevision]) return;
    this.preparing = true;
    try {
      let callback: NativeGlyphProcessor | null = null;
      const processor = this.processor;
      if (processor) {
        const indices = this.getIndices();
        callback = (glyph, style, fill, outline, thickness) => {
          let fillColor = new Color(fill);
          let outlineColor = new Color(outline);
          const appearance: GlyphAppearance = {
            style,
            get fillColor() { return fillColor; },
            set fillColor(value) { fillColor = new Color(value); },
            get outlineColor() { return outlineColor; },
            set outlineColor(value) { outlineColor = new Color(value); },
            outlineThickness: thickness,
          };
          processor(new ShapedGlyphView(
            new ShapedGlyphBuffer(glyph), 0, indices), appearance);
          return new Float64Array([
            fontUnsigned(appearance.style, 15), colorInteger(appearance.fillColor),
            colorInteger(appearance.outlineColor), textFloat(appearance.outlineThickness),
          ]);
        };
      }
      flushGraphics();
      const layout = native.prepareText(this[graphicsNative],
        this.font[graphicsNative], this.string, callback);
      this.vertices = vertexArrayFromMapping(layout.vertices);
      this.outline = vertexArrayFromMapping(layout.outline);
      this.glyphs = undefined;
      this.revision = this.font[fontRevision];
    } finally { this.preparing = false; }
  }
}

/** SFML shaping with native vertex storage and batched draw snapshots. */
export class Text extends withTransformable(TextResource) {
  /** 文本样式位标志。 */
  static readonly Style = TextStyle;
  /** 行对齐枚举。 */
  static readonly LineAlignment = LineAlignment;
  /** 字形簇分组枚举。 */
  static readonly ClusterGrouping = ClusterGrouping;
  /** 字形排布方向枚举。 */
  static readonly TextDirection = TextDirection;
  /** 横排和竖排方向枚举。 */
  static readonly TextOrientation = TextOrientation;

  /** 返回应用对象变换后的文本轴对齐包围框。 */
  getGlobalBounds(): FloatRect {
    return this.getTransform().transformRect(this.getLocalBounds());
  }
}
