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

/**
 * Text style bit flags, combinable with bitwise operations.
 * @zh 文本样式位标志，可按位组合。
 * @ja ビット演算で組み合わせ可能なテキストスタイルフラグ。
 * @ko 비트 연산으로 조합할 수 있는 텍스트 스타일 플래그입니다.
 */
export enum TextStyle {
  /**
   * Regular.
   * @zh 常规。
   * @ja 標準。
   * @ko 일반입니다.
   */
  Regular = 0,
  /**
   * Bold.
   * @zh 粗体。
   * @ja 太字。
   * @ko 굵게입니다.
   */
  Bold = 1,
  /**
   * Italic.
   * @zh 斜体。
   * @ja 斜体。
   * @ko 기울임꼴입니다.
   */
  Italic = 2,
  /**
   * Underlined.
   * @zh 下划线。
   * @ja 下線。
   * @ko 밑줄입니다.
   */
  Underlined = 4,
  /**
   * Strikethrough.
   * @zh 删除线。
   * @ja 取り消し線。
   * @ko 취소선입니다.
   */
  StrikeThrough = 8,
}
/**
 * Text line alignment.
 * @zh 文本行对齐方式。
 * @ja テキスト行の配置。
 * @ko 텍스트 행 정렬입니다.
 */
export enum LineAlignment {
  /**
   * Chooses default alignment based on text direction.
   * @zh 根据文字方向选择默认对齐。
   * @ja テキストの方向に応じて既定の配置を選びます。
   * @ko 텍스트 방향에 따라 기본 정렬을 선택합니다.
   */
  Default,
  /**
   * Left-aligned.
   * @zh 左对齐。
   * @ja 左揃え。
   * @ko 왼쪽 정렬입니다.
   */
  Left,
  /**
   * Centered.
   * @zh 居中。
   * @ja 中央揃え。
   * @ko 가운데 정렬입니다.
   */
  Center,
  /**
   * Right-aligned.
   * @zh 右对齐。
   * @ja 右揃え。
   * @ko 오른쪽 정렬입니다.
   */
  Right,
}
/**
 * Glyph cluster grouping for text shaping.
 * @zh 文本整形时的字形簇分组方式。
 * @ja テキストシェーピング時のグリフクラスターのグループ化方法。
 * @ko 텍스트 셰이핑 시 글리프 클러스터 그룹화 방식입니다.
 */
export enum ClusterGrouping {
  /**
   * Groups by user-perceived graphemes.
   * @zh 按用户感知的字素分组。
   * @ja ユーザーが認識する書記素単位でグループ化します。
   * @ko 사용자가 인식하는 자소 단위로 그룹화합니다.
   */
  Grapheme,
  /**
   * Groups by Unicode characters.
   * @zh 按 Unicode 字符分组。
   * @ja Unicode 文字単位でグループ化します。
   * @ko Unicode 문자 단위로 그룹화합니다.
   */
  Character,
  /**
   * Does not merge glyph clusters.
   * @zh 不合并字形簇。
   * @ja グリフクラスターを結合しません。
   * @ko 글리프 클러스터를 병합하지 않습니다.
   */
  None,
}
/**
 * Glyph layout direction.
 * @zh 字形排布方向。
 * @ja グリフの配置方向。
 * @ko 글리프 배치 방향입니다.
 */
export enum TextDirection {
  /**
   * Unspecified direction.
   * @zh 未指定方向。
   * @ja 方向未指定。
   * @ko 방향 미지정입니다.
   */
  Unspecified,
  /**
   * Left to right.
   * @zh 从左到右。
   * @ja 左から右。
   * @ko 왼쪽에서 오른쪽입니다.
   */
  LeftToRight,
  /**
   * Right to left.
   * @zh 从右到左。
   * @ja 右から左。
   * @ko 오른쪽에서 왼쪽입니다.
   */
  RightToLeft,
  /**
   * Top to bottom.
   * @zh 从上到下。
   * @ja 上から下。
   * @ko 위에서 아래입니다.
   */
  TopToBottom,
  /**
   * Bottom to top.
   * @zh 从下到上。
   * @ja 下から上。
   * @ko 아래에서 위입니다.
   */
  BottomToTop,
}
/**
 * Horizontal or vertical writing direction.
 * @zh 横排或竖排方向。
 * @ja 横書きまたは縦書きの方向。
 * @ko 가로쓰기 또는 세로쓰기 방향입니다.
 */
export enum TextOrientation {
  /**
   * Default horizontal writing.
   * @zh 默认横排。
   * @ja 既定の横書き。
   * @ko 기본 가로쓰기입니다.
   */
  Default,
  /**
   * Vertical writing from top to bottom.
   * @zh 从上到下竖排。
   * @ja 上から下への縦書き。
   * @ko 위에서 아래로 세로쓰기입니다.
   */
  TopToBottom,
  /**
   * Vertical writing from bottom to top.
   * @zh 从下到上竖排。
   * @ja 下から上への縦書き。
   * @ko 아래에서 위로 세로쓰기입니다.
   */
  BottomToTop,
}

/**
 * A single shaped glyph and its layout information.
 * @zh 整形后的单个字形及其布局信息。
 * @ja シェーピング済みの単一グリフとその配置情報。
 * @ko 셰이핑된 단일 글리프와 배치 정보입니다.
 */
export interface ShapedGlyph {
  /**
   * Read-only view of font glyph metrics.
   * @zh 字体字形度量的只读视图。
   * @ja フォントグリフメトリクスの読み取り専用ビュー。
   * @ko 글꼴 글리프 메트릭의 읽기 전용 뷰입니다.
   */
  readonly glyph: R<Glyph>;
  /**
   * Glyph position in text-local coordinates.
   * @zh 字形在文本局部坐标中的位置。
   * @ja テキストのローカル座標でのグリフ位置。
   * @ko 텍스트 로컬 좌표계의 글리프 위치입니다.
   */
  readonly position: R<Vector2f>;
  /**
   * UTF-16 index into getString(), suitable for JS slice/substring.
   * @zh getString() 中的 UTF-16 索引，适用于 JS slice/substring。
   * @ja getString() 内の UTF-16 インデックス。JS の slice/substring に適しています。
   * @ko getString()의 UTF-16 인덱스이며 JS slice/substring에 사용할 수 있습니다.
   */
  readonly cluster: number;
  /**
   * Direction of the text segment containing the glyph.
   * @zh 字形所处文本段的方向。
   * @ja グリフを含むテキスト区間の方向。
   * @ko 글리프가 속한 텍스트 구간의 방향입니다.
   */
  readonly textDirection: TextDirection;
  /**
   * Baseline coordinate of the line containing the glyph.
   * @zh 字形所在行的基线坐标。
   * @ja グリフが属する行のベースライン座標。
   * @ko 글리프가 속한 행의 기준선 좌표입니다.
   */
  readonly baseline: number;
  /**
   * Index of the glyph's first vertex in the vertex data.
   * @zh 字形在顶点数据中的起始顶点索引。
   * @ja 頂点データ内のグリフの開始頂点インデックス。
   * @ko 꼭짓점 데이터에서 글리프의 시작 꼭짓점 인덱스입니다.
   */
  readonly vertexOffset: number;
  /**
   * Number of vertices occupied by the glyph.
   * @zh 字形占用的顶点数。
   * @ja グリフが占める頂点数。
   * @ko 글리프가 차지하는 꼭짓점 수입니다.
   */
  readonly vertexCount: number;
}

/**
 * Single-glyph appearance editable by the glyph preprocessor.
 * @zh 字形预处理器可修改的单字形外观。
 * @ja グリフプリプロセッサーが変更できる単一グリフの外観。
 * @ko 글리프 전처리기가 수정할 수 있는 단일 글리프 외형입니다.
 */
export interface GlyphAppearance {
  /**
   * Glyph style bit flags.
   * @zh 字形样式位标志。
   * @ja グリフスタイルのビットフラグ。
   * @ko 글리프 스타일 비트 플래그입니다.
   */
  style: TextStyle;
  /**
   * Mutable fill color.
   * @zh 可修改的填充颜色。
   * @ja 変更可能な塗りつぶし色。
   * @ko 수정 가능한 채우기 색상입니다.
   */
  get fillColor(): Color;
  /**
   * Copies the fill color.
   * @zh 复制填充颜色。
   * @ja 塗りつぶし色をコピーします。
   * @ko 채우기 색상을 복사합니다.
   */
  set fillColor(value: R<Color>);
  /**
   * Mutable outline color.
   * @zh 可修改的轮廓颜色。
   * @ja 変更可能な輪郭色。
   * @ko 수정 가능한 윤곽선 색상입니다.
   */
  get outlineColor(): Color;
  /**
   * Copies the outline color.
   * @zh 复制轮廓颜色。
   * @ja 輪郭色をコピーします。
   * @ko 윤곽선 색상을 복사합니다.
   */
  set outlineColor(value: R<Color>);
  /**
   * Outline thickness in pixels.
   * @zh 轮廓厚度，单位为像素。
   * @ja ピクセル単位の輪郭の太さ。
   * @ko 픽셀 단위 윤곽선 두께입니다.
   */
  outlineThickness: number;
}
/**
 * Callback that synchronously changes glyph appearance; must not modify or
 * query geometry of the same Text while running.
 * @zh 同步修改字形外观的回调；执行期间不得修改或查询同一 Text 的几何。
 * @ja グリフの外観を同期的に変更するコールバック。実行中は同じ Text のジオメトリを変更または照会してはいけません。
 * @ko 글리프 외형을 동기적으로 수정하는 콜백입니다. 실행 중에는 동일한 Text의 기하 구조를 수정하거나 조회하면 안 됩니다.
 */
export type GlyphPreProcessor = (glyph: ShapedGlyph, appearance: GlyphAppearance) => void;

/**
 * Initial text parameters.
 * @zh 文本初始参数。
 * @ja テキストの初期パラメーター。
 * @ko 텍스트 초기 매개변수입니다.
 */
export interface TextOptions {
  /**
   * Font resource whose reference is retained by Text.
   * @zh 字体资源，Text 会保留其引用。
   * @ja Text が参照を保持するフォントリソース。
   * @ko Text가 참조를 유지하는 글꼴 리소스입니다.
   */
  font: ReadonlyFont;
  /**
   * Initial string; defaults to empty.
   * @zh 初始字符串，默认空串。
   * @ja 初期文字列。既定は空文字列。
   * @ko 초기 문자열입니다. 기본값은 빈 문자열입니다.
   */
  string?: string;
  /**
   * Character size in pixels; defaults to 30.
   * @zh 像素字号，默认 30。
   * @ja ピクセル単位の文字サイズ。既定値は 30。
   * @ko 픽셀 단위 글자 크기입니다. 기본값은 30입니다.
   */
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
  /**
   * Current font reference.
   * @zh 当前字体引用。
   * @ja 現在のフォント参照。
   * @ko 현재 글꼴 참조입니다.
   */
  private font: ReadonlyFont;
  /**
   * Current displayed string.
   * @zh 当前显示字符串。
   * @ja 現在表示する文字列。
   * @ko 현재 표시되는 문자열입니다.
   */
  private string = '';
  /**
   * Cached index mapping from the string to glyph ranges.
   * @zh 字符串到字形范围的索引映射缓存。
   * @ja 文字列からグリフ範囲へのインデックス対応キャッシュ。
   * @ko 문자열에서 글리프 범위로의 인덱스 매핑 캐시입니다.
   */
  private indices?: TextIndices;
  /**
   * Float32 view of the Native parameter field buffer.
   * @zh Native 参数字段缓冲区的 Float32 视图。
   * @ja Native パラメーターフィールドバッファーの Float32 ビュー。
   * @ko Native 매개변수 필드 버퍼의 Float32 뷰입니다.
   */
  private readonly floats: Float32Array;
  /**
   * Uint32 view of the Native parameter field buffer.
   * @zh Native 参数字段缓冲区的 Uint32 视图。
   * @ja Native パラメーターフィールドバッファーの Uint32 ビュー。
   * @ko Native 매개변수 필드 버퍼의 Uint32 뷰입니다.
   */
  private readonly words: Uint32Array;
  /**
   * DataView of the Native color field buffer.
   * @zh Native 颜色字段缓冲区的 DataView。
   * @ja Native 色フィールドバッファーの DataView。
   * @ko Native 색상 필드 버퍼의 DataView입니다.
   */
  private readonly colors: DataView;
  /**
   * Geometry dirty flags and vertical writing mode flags.
   * @zh 几何脏标记及竖排模式标志。
   * @ja ジオメトリの更新必要フラグと縦書きモードフラグ。
   * @ko 기하 구조 변경 표시 및 세로쓰기 모드 플래그입니다.
   */
  private readonly geometry: Uint8Array;
  /**
   * Shaped local bounds [x, y, w, h].
   * @zh 整形后的局部包围框 [x, y, w, h]。
   * @ja シェーピング後のローカル境界矩形 [x, y, w, h]。
   * @ko 셰이핑 후 로컬 경계 상자 [x, y, w, h]입니다.
   */
  private readonly bounds: Float32Array;
  /**
   * Optional synchronous glyph appearance callback.
   * @zh 可选的同步字形外观回调。
   * @ja 任意の同期グリフ外観コールバック。
   * @ko 선택적인 동기 글리프 외형 콜백입니다.
   */
  private processor: GlyphPreProcessor | null = null;
  /**
   * Boolean lock preventing recursion in preprocessor callbacks.
   * @zh 防止在预处理器回调中递归的布尔锁。
   * @ja プリプロセッサーコールバック内の再帰を防ぐブールロック。
   * @ko 전처리기 콜백의 재귀를 방지하는 불리언 잠금입니다.
   */
  private preparing = false;
  /**
   * fontRevision at the last shaping, used to skip reshaping when unchanged.
   * @zh 上次整形时的 fontRevision，用于跳过未变更的重新整形。
   * @ja 前回のシェーピング時の fontRevision。変更がない場合に再シェーピングを省略するために使います。
   * @ko 마지막 셰이핑 시점의 fontRevision입니다. 변경이 없으면 다시 셰이핑하지 않는 데 사용합니다.
   */
  private revision = -1;
  /**
   * Fill vertex array, updated when geometry is rebuilt.
   * @zh 填充顶点数组，几何重建时更新。
   * @ja ジオメトリ再構築時に更新される塗りつぶし頂点配列。
   * @ko 기하 구조를 재구성할 때 갱신되는 채우기 꼭짓점 배열입니다.
   */
  private vertices!: VertexArray;
  /**
   * Outline vertex array, updated when geometry is rebuilt.
   * @zh 轮廓顶点数组，几何重建时更新。
   * @ja ジオメトリ再構築時に更新される輪郭頂点配列。
   * @ko 기하 구조를 재구성할 때 갱신되는 윤곽선 꼭짓점 배열입니다.
   */
  private outline!: VertexArray;
  /**
   * Glyph layout cache from the most recent shaping.
   * @zh 最近一次整形的字形布局缓存。
   * @ja 直近のシェーピングによるグリフ配置キャッシュ。
   * @ko 가장 최근 셰이핑의 글리프 배치 캐시입니다.
   */
  private glyphs?: readonly ShapedGlyph[];

  /**
   * Creates text from a font and text parameters, or copies text retaining font
   * and preprocessor references.
   * @zh 从字体和文本参数创建文本，或复制文本并保留字体及预处理器引用。
   * @ja フォントとテキストパラメーターからテキストを作成するか、フォントとプリプロセッサー参照を保持してテキストをコピーします。
   * @ko 글꼴과 텍스트 매개변수로 텍스트를 만들거나 글꼴 및 전처리기 참조를 유지하여 텍스트를 복사합니다.
   */
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

  /**
   * Sets the displayed string, reshaping on the next query or draw.
   * @zh 设置显示字符串，下次查询或绘制时重新整形。
   * @ja 表示文字列を設定し、次回の照会または描画で再シェーピングします。
   * @ko 표시할 문자열을 설정하며 다음 조회 또는 그리기에서 다시 셰이핑합니다.
   */
  setString(this: TextResource, value: string): void {
    this.checkIdle();
    if (typeof value !== 'string') throw new TypeError('Expected a string');
    if (value !== this.string) {
      this.string = value;
      this.indices = undefined;
      this.geometry[0] = 1;
    }
  }
  /**
   * Returns the current JS string.
   * @zh 返回当前 JS 字符串。
   * @ja 現在の JS 文字列を返します。
   * @ko 현재 JS 문자열을 반환합니다.
   */
  getString(): string { return this.string; }
  /**
   * Sets the font and retains its reference.
   * @zh 设置字体并保留其引用。
   * @ja フォントを設定し、その参照を保持します。
   * @ko 글꼴을 설정하고 참조를 유지합니다.
   */
  setFont(this: TextResource, font: ReadonlyFont): void {
    this.checkIdle();
    if (!(font instanceof Font)) throw new TypeError('Expected a Font');
    if (font !== this.font) { this.font = font; this.geometry[0] = 1; }
  }
  /**
   * Returns a read-only reference to the current font.
   * @zh 返回当前字体的只读引用。
   * @ja 現在のフォントへの読み取り専用参照を返します。
   * @ko 현재 글꼴의 읽기 전용 참조를 반환합니다.
   */
  getFont(): ReadonlyFont { return this.font; }
  /**
   * Sets the character size in pixels.
   * @zh 设置像素字号。
   * @ja 文字サイズをピクセル単位で設定します。
   * @ko 글자 크기를 픽셀 단위로 설정합니다.
   */
  setCharacterSize(this: TextResource, size: number): void { this.set(0, fontUnsigned(size)); }
  /**
   * Returns the character size in pixels.
   * @zh 返回像素字号。
   * @ja 文字サイズをピクセル単位で返します。
   * @ko 글자 크기를 픽셀 단위로 반환합니다.
   */
  getCharacterSize(): number { return this.words[0]; }
  /**
   * Sets the letter spacing factor; 1 is the default spacing.
   * @zh 设置字间距倍率，1 为默认间距。
   * @ja 文字間隔の倍率を設定します。1 は既定の間隔です。
   * @ko 자간 배율을 설정합니다. 1은 기본 간격입니다.
   */
  setLetterSpacing(this: TextResource, factor: number): void { this.set(1, textFloat(factor)); }
  /**
   * Returns the letter spacing factor.
   * @zh 返回字间距倍率。
   * @ja 文字間隔の倍率を返します。
   * @ko 자간 배율을 반환합니다.
   */
  getLetterSpacing(): number { return this.floats[1]; }
  /**
   * Sets the line spacing factor; 1 is the font's default line spacing.
   * @zh 设置行间距倍率，1 为字体默认行距。
   * @ja 行間隔の倍率を設定します。1 はフォント既定の行間隔です。
   * @ko 줄 간격 배율을 설정합니다. 1은 글꼴의 기본 줄 간격입니다.
   */
  setLineSpacing(this: TextResource, factor: number): void { this.set(2, textFloat(factor)); }
  /**
   * Returns the line spacing factor.
   * @zh 返回行间距倍率。
   * @ja 行間隔の倍率を返します。
   * @ko 줄 간격 배율을 반환합니다.
   */
  getLineSpacing(): number { return this.floats[2]; }
  /**
   * Sets TextStyle bit flags, combining styles such as bold and italic.
   * @zh 设置 TextStyle 位标志，可组合粗体、斜体等样式。
   * @ja TextStyle ビットフラグを設定します。太字や斜体などを組み合わせられます。
   * @ko TextStyle 비트 플래그를 설정하며 굵게, 기울임꼴 등의 스타일을 조합할 수 있습니다.
   */
  setStyle(this: TextResource, style: TextStyle): void { this.set(3, fontUnsigned(style, 15)); }
  /**
   * Returns the text style bit flags.
   * @zh 返回文本样式位标志。
   * @ja テキストスタイルのビットフラグを返します。
   * @ko 텍스트 스타일 비트 플래그를 반환합니다.
   */
  getStyle(): TextStyle { return this.words[3]; }
  /**
   * Copies the fill color; existing geometry is only recolored.
   * @zh 复制填充颜色；已有几何仅重新着色。
   * @ja 塗りつぶし色をコピーします。既存ジオメトリは色のみを更新します。
   * @ko 채우기 색상을 복사합니다. 기존 기하 구조는 색상만 갱신합니다.
   */
  setFillColor(this: TextResource, color: R<Color>): void { this.setColor(4, colorInteger(color)); }
  /**
   * Returns a copy of the fill color.
   * @zh 返回填充颜色副本。
   * @ja 塗りつぶし色のコピーを返します。
   * @ko 채우기 색상 복사본을 반환합니다.
   */
  getFillColor(): Color { return new Color(this.colors.getUint32(16)); }
  /**
   * Copies the outline color; existing geometry is only recolored.
   * @zh 复制轮廓颜色；已有几何仅重新着色。
   * @ja 輪郭色をコピーします。既存ジオメトリは色のみを更新します。
   * @ko 윤곽선 색상을 복사합니다. 기존 기하 구조는 색상만 갱신합니다.
   */
  setOutlineColor(this: TextResource, color: R<Color>): void { this.setColor(5, colorInteger(color)); }
  /**
   * Returns a copy of the outline color.
   * @zh 返回轮廓颜色副本。
   * @ja 輪郭色のコピーを返します。
   * @ko 윤곽선 색상 복사본을 반환합니다.
   */
  getOutlineColor(): Color { return new Color(this.colors.getUint32(20)); }
  /**
   * Sets the outline thickness in pixels.
   * @zh 设置轮廓像素厚度。
   * @ja 輪郭の太さをピクセル単位で設定します。
   * @ko 윤곽선 두께를 픽셀 단위로 설정합니다.
   */
  setOutlineThickness(this: TextResource, thickness: number): void { this.set(6, textFloat(thickness)); }
  /**
   * Returns the outline thickness in pixels.
   * @zh 返回轮廓像素厚度。
   * @ja 輪郭の太さをピクセル単位で返します。
   * @ko 윤곽선 두께를 픽셀 단위로 반환합니다.
   */
  getOutlineThickness(): number { return this.floats[6]; }
  /**
   * Sets the alignment of multiline text.
   * @zh 设置多行文本的对齐方式。
   * @ja 複数行テキストの配置を設定します。
   * @ko 여러 줄 텍스트의 정렬을 설정합니다.
   */
  setLineAlignment(this: TextResource, alignment: LineAlignment): void { this.set(7, fontUnsigned(alignment, 3)); }
  /**
   * Returns line alignment.
   * @zh 返回行对齐方式。
   * @ja 行の配置を返します。
   * @ko 행 정렬을 반환합니다.
   */
  getLineAlignment(): LineAlignment { return this.words[7]; }
  /**
   * Sets horizontal or vertical writing direction.
   * @zh 设置横排或竖排方向。
   * @ja 横書きまたは縦書きの方向を設定します。
   * @ko 가로쓰기 또는 세로쓰기 방향을 설정합니다.
   */
  setTextOrientation(this: TextResource, orientation: TextOrientation): void { this.set(8, fontUnsigned(orientation, 2)); }
  /**
   * Returns text writing direction.
   * @zh 返回文本排版方向。
   * @ja テキストの組版方向を返します。
   * @ko 텍스트 쓰기 방향을 반환합니다.
   */
  getTextOrientation(): TextOrientation { return this.words[8]; }
  /**
   * Sets the glyph cluster grouping strategy for shaping.
   * @zh 设置整形时的字形簇分组策略。
   * @ja シェーピング時のグリフクラスターのグループ化方針を設定します。
   * @ko 셰이핑 시 글리프 클러스터 그룹화 방식을 설정합니다.
   */
  setClusterGrouping(this: TextResource, grouping: ClusterGrouping): void { this.set(9, fontUnsigned(grouping, 2)); }
  /**
   * Returns the glyph cluster grouping strategy.
   * @zh 返回字形簇分组策略。
   * @ja グリフクラスターのグループ化方針を返します。
   * @ko 글리프 클러스터 그룹화 방식을 반환합니다.
   */
  getClusterGrouping(): ClusterGrouping { return this.words[9]; }

  /**
   * Sets a synchronous glyph appearance callback, or null to remove it; the
   * callback runs when geometry is rebuilt.
   * @zh 设置同步字形外观回调，null 取消；回调在几何重建时执行。
   * @ja 同期グリフ外観コールバックを設定し、null で解除します。コールバックはジオメトリ再構築時に実行されます。
   * @ko 동기 글리프 외형 콜백을 설정하며 null은 해제합니다. 콜백은 기하 구조를 재구성할 때 실행됩니다.
   */
  setGlyphPreProcessor(this: TextResource, processor: GlyphPreProcessor | null): void {
    this.checkIdle();
    if (processor !== null && typeof processor !== 'function') {
      throw new TypeError('Expected a glyph pre-processor or null');
    }
    this.processor = processor;
    this.geometry[0] = 1;
  }

  /**
   * Shapes on demand and returns glyph layout views; cluster is a JS UTF-16
   * index.
   * @zh 按需整形并返回字形布局视图；cluster 为 JS UTF-16 索引。
   * @ja 必要に応じてシェーピングし、グリフ配置ビューを返します。cluster は JS UTF-16 インデックスです。
   * @ko 필요할 때 셰이핑하고 글리프 배치 뷰를 반환합니다. cluster는 JS UTF-16 인덱스입니다.
   */
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
  /**
   * Returns mutable fill vertex data; retrieve it again after the next geometry
   * rebuild.
   * @zh 返回可修改的填充顶点数据；下一次几何重建后需要重新获取。
   * @ja 変更可能な塗りつぶし頂点データを返します。次のジオメトリ再構築後は再取得が必要です。
   * @ko 수정 가능한 채우기 꼭짓점 데이터를 반환합니다. 다음 기하 구조 재구성 후 다시 가져와야 합니다.
   */
  getVertexData(): VertexArray { this.prepare(); return this.vertices; }
  /**
   * Returns mutable outline vertex data; retrieve it again after the next
   * geometry rebuild.
   * @zh 返回可修改的轮廓顶点数据；下一次几何重建后需要重新获取。
   * @ja 変更可能な輪郭頂点データを返します。次のジオメトリ再構築後は再取得が必要です。
   * @ko 수정 가능한 윤곽선 꼭짓점 데이터를 반환합니다. 다음 기하 구조 재구성 후 다시 가져와야 합니다.
   */
  getOutlineVertexData(): VertexArray { this.prepare(); return this.outline; }
  /**
   * Returns the local axis-aligned bounds of the shaped text.
   * @zh 返回整形后文本的局部轴对齐包围框。
   * @ja シェーピング済みテキストのローカル軸平行境界矩形を返します。
   * @ko 셰이핑된 텍스트의 로컬 축 정렬 경계 상자를 반환합니다.
   */
  getLocalBounds(): FloatRect {
    this.prepare();
    const [ x, y, w, h ] = this.bounds;
    return new FloatRect(new Vector2f(x, y), new Vector2f(w, h));
  }

  /**
   * Returns world coordinates of the specified character; index counts Unicode
   * code points.
   * @zh 返回指定字符的世界坐标，index 按 Unicode 码点计数。
   * @ja 指定文字のワールド座標を返します。index は Unicode コードポイント単位です。
   * @ko 지정한 문자의 월드 좌표를 반환합니다. index는 Unicode 코드 포인트 단위로 셉니다.
   *
   * @deprecated Use getShapedGlyphs() to obtain the complete layout.
   * @zh 使用 getShapedGlyphs() 获取完整布局。
   * @ja 完全なレイアウトを取得するには getShapedGlyphs() を使ってください。
   * @ko 전체 배치를 얻으려면 getShapedGlyphs()를 사용하세요.
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

  /**
   * Writes Native parameter fields and marks geometry dirty only when the value
   * changes.
   * @zh 仅当值变化时写入 Native 参数字段并标记几何脏。
   * @ja 値が変わった場合のみ Native パラメーターフィールドを書き込み、ジオメトリを更新必要としてマークします。
   * @ko 값이 바뀔 때만 Native 매개변수 필드에 쓰고 기하 구조 변경을 표시합니다.
   */
  private set(index: number, value: number): void {
    this.checkIdle();
    const data = index === 1 || index === 2 || index === 6
      ? this.floats : this.words;
    if (data[index] === value) return;
    data[index] = value;
    this.geometry[0] = 1;
  }

  /**
   * Sets fill or outline color; directly updates vertex data for color-only
   * changes.
   * @zh 设置填充或轮廓颜色；仅着色时直接更新顶点数据。
   * @ja 塗りつぶし色または輪郭色を設定します。色のみの変更では頂点データを直接更新します。
   * @ko 채우기 또는 윤곽선 색상을 설정합니다. 색상만 변경할 때는 꼭짓점 데이터를 직접 갱신합니다.
   */
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

  /**
   * Throws when called within a preprocessor callback.
   * @zh 在预处理器回调中执行时抛出。
   * @ja プリプロセッサーコールバック内で実行された場合に例外を投げます。
   * @ko 전처리기 콜백 안에서 실행되면 예외를 던집니다.
   */
  private checkIdle(): void {
    if (this.preparing) throw new SFMLError('Cannot update or query text geometry in its glyph pre-processor');
  }

  /**
   * Lazily creates an index from UTF-16 to Unicode glyph ranges.
   * @zh 惰性创建 UTF-16 到 Unicode 字形范围的索引。
   * @ja UTF-16 から Unicode グリフ範囲へのインデックスを遅延作成します。
   * @ko UTF-16에서 Unicode 글리프 범위로의 인덱스를 지연 생성합니다.
   */
  private getIndices(): TextIndices {
    this.indices ??= new TextIndices(this.string);
    return this.indices;
  }

  /**
   * Performs text shaping and geometry rebuilding on demand.
   * @zh 按需执行文本整形和几何重建。
   * @ja 必要に応じてテキストのシェーピングとジオメトリ再構築を実行します。
   * @ko 필요할 때 텍스트 셰이핑과 기하 구조 재구성을 수행합니다.
   */
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

/**
 * SFML shaping with native vertex storage and batched draw snapshots.
 * @zh 使用原生顶点存储和批量绘制快照的 SFML 文本整形。
 * @ja ネイティブ頂点ストレージとバッチ描画スナップショットを使う SFML シェーピング。
 * @ko 네이티브 꼭짓점 저장 공간과 배치 그리기 스냅샷을 사용하는 SFML 셰이핑입니다.
 */
export class Text extends withTransformable(TextResource) {
  /**
   * Text style bit flags.
   * @zh 文本样式位标志。
   * @ja テキストスタイルのビットフラグ。
   * @ko 텍스트 스타일 비트 플래그입니다.
   */
  static readonly Style = TextStyle;
  /**
   * Line alignment enumeration.
   * @zh 行对齐枚举。
   * @ja 行配置の列挙型。
   * @ko 행 정렬 열거형입니다.
   */
  static readonly LineAlignment = LineAlignment;
  /**
   * Glyph cluster grouping enumeration.
   * @zh 字形簇分组枚举。
   * @ja グリフクラスターのグループ化の列挙型。
   * @ko 글리프 클러스터 그룹화 열거형입니다.
   */
  static readonly ClusterGrouping = ClusterGrouping;
  /**
   * Glyph layout direction enumeration.
   * @zh 字形排布方向枚举。
   * @ja グリフ配置方向の列挙型。
   * @ko 글리프 배치 방향 열거형입니다.
   */
  static readonly TextDirection = TextDirection;
  /**
   * Horizontal and vertical writing direction enumeration.
   * @zh 横排和竖排方向枚举。
   * @ja 横書きと縦書きの方向の列挙型。
   * @ko 가로쓰기 및 세로쓰기 방향 열거형입니다.
   */
  static readonly TextOrientation = TextOrientation;

  /**
   * Returns text axis-aligned bounds after applying the object's transform.
   * @zh 返回应用对象变换后的文本轴对齐包围框。
   * @ja オブジェクトの変換を適用したテキストの軸平行境界矩形を返します。
   * @ko 객체 변환을 적용한 텍스트의 축 정렬 경계 상자를 반환합니다.
   */
  getGlobalBounds(): FloatRect {
    return this.getTransform().transformRect(this.getLocalBounds());
  }
}
