import {
  native, type NativeValueHandle, type NativeValueMapping,
} from '../internal/native';
import { LazyValue, memberValue, nativeValue } from '../internal/lazy-value';
import {
  glyphStorage, glyphNative, mutableValue, rectStorage, type ReadonlyValue as R,
} from '../internal/value-storage';
import {
  FloatRect, IntRect, floatRectFromState, intRectFromState,
} from './rect';

export let glyphFromMapping: (mapping: NativeValueMapping<'glyph'>) => Glyph;
export let glyphFromState: (state: LazyValue<'glyph', Uint8Array>) => Glyph;

/**
 * sf::Glyph and its rectangle members share a 44-byte allocation.
 * @zh sf::Glyph 及其矩形成员共享一块 44 字节的分配。
 * @ja sf::Glyph とその矩形メンバーは 44 バイトの割り当てを共有します。
 * @ko sf::Glyph와 해당 사각형 멤버는 44바이트 할당 영역을 공유합니다.
 */
export class Glyph {
  readonly [mutableValue] = true;
  /**
   * Lazy value for a native glyph allocation, sharing 44 bytes.
   * @zh 原生字形分配的惰性值，共享 44 字节。
   * @ja 44 バイトを共有する、ネイティブグリフ割り当ての遅延値。
   * @ko 44바이트를 공유하는 네이티브 글리프 할당의 지연 값입니다.
   */
  private readonly state: LazyValue<'glyph', Uint8Array>;
  /**
   * Float32 view of the state buffer.
   * @zh state 缓冲区的 Float32 视图。
   * @ja state バッファーの Float32 ビュー。
   * @ko state 버퍼의 Float32 뷰입니다.
   */
  private readonly floats: Float32Array;
  /**
   * Int32 view of the state buffer.
   * @zh state 缓冲区的 Int32 视图。
   * @ja state バッファーの Int32 ビュー。
   * @ko state 버퍼의 Int32 뷰입니다.
   */
  private readonly integers: Int32Array;
  /**
   * Lazy FloatRect view cache for the bounds property.
   * @zh bounds 属性的延迟 FloatRect 视图缓存。
   * @ja bounds プロパティの遅延 FloatRect ビューキャッシュ。
   * @ko bounds 속성의 지연 FloatRect 뷰 캐시입니다.
   */
  private boundsView?: FloatRect;
  /**
   * Lazy IntRect view cache for the textureRect property.
   * @zh textureRect 属性的延迟 IntRect 视图缓存。
   * @ja textureRect プロパティの遅延 IntRect ビューキャッシュ。
   * @ko textureRect 속성의 지연 IntRect 뷰 캐시입니다.
   */
  private textureView?: IntRect;

  /**
   * Creates a glyph with all numeric values zero, or copies all glyph metrics
   * from source.
   * @zh 创建数值全为零的字形，或复制 source 的所有字形度量。
   * @ja 数値がすべてゼロのグリフを作成するか、source の全グリフメトリクスをコピーします。
   * @ko 모든 숫자 값이 0인 글리프를 만들거나 source의 모든 글리프 메트릭을 복사합니다.
   */
  constructor(source?: R<Glyph>) {
    this.state = new LazyValue(new Uint8Array(44), buffer => native.wrapGlyph(buffer));
    this.floats = new Float32Array(this.state.values.buffer);
    this.integers = new Int32Array(this.state.values.buffer);
    if (source !== undefined) {
      if (!(source instanceof Glyph)) throw new TypeError('Expected a Glyph');
      this.state.values.set(source[glyphStorage]);
    }
  }

  get [glyphStorage](): Uint8Array { return this.state.values; }
  get [glyphNative](): NativeValueHandle<'glyph'> {
    return nativeValue(this, glyphNative, this.state);
  }
  /**
   * Horizontal pen advance after drawing, in pixels.
   * @zh 绘制后笔位置的水平前进量，单位为像素。
   * @ja 描画後のペン位置の水平移動量。ピクセル単位。
   * @ko 그린 후 펜 위치의 수평 이동량이며 픽셀 단위입니다.
   */
  get advance(): number { return this.floats[0]; }
  /**
   * Sets the horizontal advance in pixels.
   * @zh 设置水平前进量，单位为像素。
   * @ja 水平移動量をピクセル単位で設定します。
   * @ko 수평 이동량을 픽셀 단위로 설정합니다.
   */
  set advance(value: number) { this.floats[0] = value; }
  /**
   * Difference in left side bearing before and after auto-hinting, in 1/64
   * pixels.
   * @zh 自动微调前后左侧边距的差，单位为 1/64 像素。
   * @ja 自動ヒンティング前後の左サイドベアリングの差。1/64 ピクセル単位。
   * @ko 자동 힌팅 전후 왼쪽 사이드 베어링의 차이이며 1/64 픽셀 단위입니다.
   */
  get lsbDelta(): number { return this.integers[1]; }
  /**
   * Sets the left side bearing hinting delta.
   * @zh 设置左侧边距微调差。
   * @ja 左サイドベアリングのヒンティング差を設定します。
   * @ko 왼쪽 사이드 베어링의 힌팅 차이를 설정합니다.
   */
  set lsbDelta(value: number) { this.integers[1] = value; }
  /**
   * Difference in right side bearing before and after auto-hinting, in 1/64
   * pixels.
   * @zh 自动微调前后右侧边距的差，单位为 1/64 像素。
   * @ja 自動ヒンティング前後の右サイドベアリングの差。1/64 ピクセル単位。
   * @ko 자동 힌팅 전후 오른쪽 사이드 베어링의 차이이며 1/64 픽셀 단위입니다.
   */
  get rsbDelta(): number { return this.integers[2]; }
  /**
   * Sets the right side bearing hinting delta.
   * @zh 设置右侧边距微调差。
   * @ja 右サイドベアリングのヒンティング差を設定します。
   * @ko 오른쪽 사이드 베어링의 힌팅 차이를 설정합니다.
   */
  set rsbDelta(value: number) { this.integers[2] = value; }

  /**
   * Pixel bounds relative to the baseline and pen position; a mutable shared
   * view.
   * @zh 相对于基线和笔位置的像素包围框，共享可修改视图。
   * @ja ベースラインとペン位置に対するピクセル境界矩形。変更可能な共有ビュー。
   * @ko 기준선과 펜 위치에 상대적인 픽셀 경계 상자이며 수정 가능한 공유 뷰입니다.
   */
  get bounds(): FloatRect {
    this.boundsView ??= floatRectFromState(memberValue(
      this.state, this.floats.subarray(3, 7),
      handle => native.glyphMember(handle, 0),
    ));
    return this.boundsView;
  }
  /**
   * Copies the glyph bounds.
   * @zh 复制字形包围框。
   * @ja グリフの境界矩形をコピーします。
   * @ko 글리프 경계 상자를 복사합니다.
   */
  set bounds(value: R<FloatRect>) {
    if (!(value instanceof FloatRect)) throw new TypeError('Expected a FloatRect');
    this.floats.set(value[rectStorage], 3);
  }
  /**
   * Glyph pixel rectangle in the font texture; a mutable shared view.
   * @zh 字形在字体纹理中的像素矩形，共享可修改视图。
   * @ja フォントテクスチャ内のグリフのピクセル矩形。変更可能な共有ビュー。
   * @ko 글꼴 텍스처 안의 글리프 픽셀 사각형이며 수정 가능한 공유 뷰입니다.
   */
  get textureRect(): IntRect {
    this.textureView ??= intRectFromState(memberValue(
      this.state, this.integers.subarray(7, 11),
      handle => native.glyphMember(handle, 1),
    ));
    return this.textureView;
  }
  /**
   * Copies the glyph rectangle in the font texture.
   * @zh 复制字体纹理中的字形矩形。
   * @ja フォントテクスチャ内のグリフ矩形をコピーします。
   * @ko 글꼴 텍스처 안의 글리프 사각형을 복사합니다.
   */
  set textureRect(value: R<IntRect>) {
    if (!(value instanceof IntRect)) throw new TypeError('Expected an IntRect');
    this.integers.set(value[rectStorage], 7);
  }

  static {
    glyphFromState = state => {
      const { buffer, byteOffset } = state.values;
      return Object.assign(Object.create(Glyph.prototype), {
        [mutableValue]: true,
        state,
        floats: new Float32Array(buffer, byteOffset, 11),
        integers: new Int32Array(buffer, byteOffset, 11),
      });
    };
    glyphFromMapping = mapping => glyphFromState(
      new LazyValue(new Uint8Array(mapping.buffer), () => mapping));
  }
}
