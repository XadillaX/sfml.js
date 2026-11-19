import { native, type NativeTextShapingContext } from '../internal/native';
import { Direction, FontKerning } from '../generated/style-enums';

const contexts = new WeakMap<TextShapingContext, NativeTextShapingContext>();

/**
 * Resolve the native allocation.
 *
 * @internal
 * @param value - Public shaping context.
 * @returns Owned native mapping.
 */
function mapping(value: TextShapingContext): NativeTextShapingContext {
  const result = contexts.get(value);
  if (!result) {
    throw new TypeError('Expected a TextShapingContext');
  }
  return result;
}

/**
 * Owned Rml::TextShapingContext language and shared numerical fields.
 *
 * @zh 持有 Rml::TextShapingContext 的语言字符串及共享数值字段。
 * @ja 言語文字列を所有し、数値フィールドを共有する Rml::TextShapingContext。
 * @ko 언어 문자열과 공유 숫자 필드를 소유하는 Rml::TextShapingContext입니다.
 * @remarks Native operations snapshot all fields before entering the engine.
 * @zh 原生操作在进入字体引擎前快照全部字段。
 * @ja ネイティブ操作はエンジン呼出前に全フィールドをコピーします。
 * @ko 네이티브 작업은 엔진 호출 전에 모든 필드를 복사합니다.
 */
export class TextShapingContext {
  /**
   * Allocate owned language storage and default Auto/Auto/zero spacing.
   *
   * @zh 分配语言存储，默认方向和字距均为 Auto，字母间距为零。
   * @ja 言語領域を割り当て、方向とカーニングを Auto、字間をゼロにします。
   * @ko 언어 저장소를 할당하며 방향과 커닝은 Auto, 간격은 0입니다.
   * @param language - Language tag; defaults to the empty string.
   * @zh language - 语言标记，默认为空字符串。
   * @ja language - 言語タグ。既定は空文字列。
   * @ko language - 언어 태그이며 기본값은 빈 문자열입니다.
   */
  constructor(language = '') {
    contexts.set(this, native.createTextShapingContext(language));
  }

  /**
   * The language tag used to choose language-specific text shaping.
   *
   * @zh 用于选择语言相关文本排版规则的语言标签。
   * @ja 言語固有のシェーピングを選ぶ言語タグ。
   * @ko 언어별 텍스트 조판을 선택하는 언어 태그입니다.
   * @returns Owned language string.
   * @zh 持有的语言字符串。
   * @ja 所有する言語文字列。
   * @ko 소유한 언어 문자열입니다.
   */
  get language(): string {
    return native.shapingGetLanguage(mapping(this).handle);
  }

  /**
   * Replace owned language storage.
   *
   * @zh 替换持有的语言字符串。
   * @ja 所有する言語文字列を置き換えます。
   * @ko 소유한 언어 문자열을 교체합니다.
   * @param value - Language tag.
   * @zh value - 语言标记。
   * @ja value - 言語タグ。
   * @ko value - 언어 태그입니다.
   */
  set language(value: string) {
    native.shapingSetLanguage(mapping(this).handle, value);
  }

  /**
   * Shared Direction/FontKerning int32 fields, in that order.
   *
   * @zh 依次共享 Direction 和 FontKerning 的 int32 字段。
   * @ja Direction、FontKerning の順の共有 int32 フィールド。
   * @ko Direction, FontKerning 순서의 공유 int32 필드입니다.
   * @returns View retaining native storage after collection and shutdown.
   * @zh 回收和关闭后仍保活原生存储的视图。
   * @ja 回収と終了後もネイティブ領域を保持するビュー。
   * @ko 회수 및 종료 후에도 네이티브 저장소를 유지하는 뷰입니다.
   */
  get enums(): Int32Array {
    return mapping(this).enums;
  }

  /**
   * Shared float32 letter_spacing field.
   *
   * @zh 共享的 float32 letter_spacing 字段。
   * @ja 共有 float32 letter_spacing フィールド。
   * @ko 공유 float32 letter_spacing 필드입니다.
   * @returns Writable native field; checked at the engine boundary.
   * @zh 可写原生字段，在引擎边界校验。
   * @ja エンジン境界で検証する書き込み可能なフィールド。
   * @ko 엔진 경계에서 검증하는 쓰기 가능한 필드입니다.
   */
  get values(): Float32Array {
    return mapping(this).values;
  }

  /**
   * The reading direction used when shaping text.
   *
   * @zh 文本方向。
   * @ja テキストの方向。
   * @ko 텍스트 방향입니다.
   * @returns Shared Direction value.
   * @zh 共享 Direction 值。
   * @ja 共有 Direction 値。
   * @ko 공유 Direction 값입니다.
   */
  get textDirection(): Direction {
    return this.enums[0];
  }

  /**
   * Write the native text direction.
   *
   * @zh 写入原生文本方向。
   * @ja ネイティブのテキスト方向を書き込みます。
   * @ko 네이티브 텍스트 방향을 씁니다.
   * @param value - Auto, Ltr or Rtl.
   * @zh value - Auto、Ltr 或 Rtl。
   * @ja value - 方向の Auto、Ltr、Rtl。
   * @ko value - Auto, Ltr 또는 Rtl입니다.
   */
  set textDirection(value: Direction) {
    if (!Number.isInteger(value) || value < 0 || value > 2) {
      throw new RangeError('Invalid text shaping direction');
    }
    this.enums[0] = value;
  }

  /**
   * The kerning policy used when shaping adjacent glyphs.
   *
   * @zh 字体字距调整方式。
   * @ja フォントのカーニング。
   * @ko 글꼴 커닝입니다.
   * @returns Shared FontKerning value.
   * @zh 共享 FontKerning 值。
   * @ja 共有 FontKerning 値。
   * @ko 공유 FontKerning 값입니다.
   */
  get fontKerning(): FontKerning {
    return this.enums[1];
  }

  /**
   * Write the native kerning mode.
   *
   * @zh 写入原生字距调整方式。
   * @ja ネイティブのカーニングモードを書き込みます。
   * @ko 네이티브 커닝 모드를 씁니다.
   * @param value - Auto, Normal or None.
   * @zh value - Auto、Normal 或 None。
   * @ja value - カーニングの Auto、Normal、None。
   * @ko value - Auto, Normal 또는 None입니다.
   */
  set fontKerning(value: FontKerning) {
    if (!Number.isInteger(value) || value < 0 || value > 2) {
      throw new RangeError('Invalid font kerning mode');
    }
    this.enums[1] = value;
  }

  /**
   * Rml::TextShapingContext::letter_spacing in pixels.
   *
   * @zh 像素单位的字母间距。
   * @ja ピクセル単位の字間。
   * @ko 픽셀 단위의 문자 간격입니다.
   * @returns Shared float32 spacing.
   * @zh 共享 float32 间距。
   * @ja 共有 float32 字間。
   * @ko 공유 float32 간격입니다.
   */
  get letterSpacing(): number {
    return this.values[0];
  }

  /**
   * Write the native letter spacing without an addon call.
   *
   * @zh 直接写入原生字母间距，无需调用 addon。
   * @ja addon 呼出なしでネイティブの字間を書き込みます。
   * @ko addon 호출 없이 네이티브 문자 간격을 씁니다.
   * @param value - Finite float32 pixels within the native int32 range.
   * @zh value - 原生 int32 范围内的有限 float32 像素间距。
   * @ja value - ネイティブ int32 範囲内の有限 float32 ピクセル字間。
   * @ko value - 네이티브 int32 범위 내의 유한 float32 픽셀 간격입니다.
   */
  set letterSpacing(value: number) {
    const rounded = Math.fround(value);
    if (typeof value !== 'number' || !Number.isFinite(rounded) ||
        rounded < -2147483648 || rounded > 2147483647) {
      throw new RangeError('Letter spacing must fit finite int32');
    }
    this.values[0] = value;
  }
}

/**
 * Resolve an optional shaping context.
 *
 * @internal
 * @param value - Public context or omitted defaults.
 * @returns Checked native token or null.
 */
export function shapingHandle(value?: TextShapingContext): object | null {
  return value === undefined ? null : mapping(value).handle;
}
