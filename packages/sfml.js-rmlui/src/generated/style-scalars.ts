// Generated from RmlUi 6.3: generate-computed-values.cjs.
import { native } from '../internal/native';
import {
  styleValues, scalarMapping, lineHeightMapping, stylePrototypes,
  checkedStyleEnum, checkedStyleFloat,
} from '../internal/style-values';
import * as Enums from './style-enums';

/**
 * A length in pixels, a percentage, or automatic sizing.
 *
 * @zh 像素长度、百分比或自动尺寸。
 * @ja ピクセル長、百分率、または自動サイズ。
 * @ko 픽셀 길이, 백분율 또는 자동 크기입니다.
 * @remarks Numeric views retain only this scalar, independently of the DOM.
 * @zh 数值视图仅保活此值，其生命周期独立于 DOM 和运行时。
 * @ja 数値ビューは値のみを保持し、DOM とランタイムから独立しています。
 * @ko 숫자 뷰는 이 값만 유지하며 DOM 및 런타임과 독립적입니다.
 */
export class LengthPercentageAuto {
  /**
   * A length in pixels, a percentage, or automatic sizing.
   *
   * @zh 像素长度、百分比或自动尺寸。
   * @ja ピクセル長、百分率、または自動サイズ。
   * @ko 픽셀 길이, 백분율 또는 자동 크기입니다.
   * @param type - Native enum; defaults to Length.
   * @zh type - 原生枚举，默认 Length。
   * @ja type - ネイティブ列挙。既定は Length。
   * @ko type - 네이티브 열거이며 기본값은 Length입니다.
   * @param value - Native float; defaults to zero.
   * @zh value - 原生浮点数，默认零。
   * @ja value - ネイティブ実数。既定はゼロ。
   * @ko value - 네이티브 실수이며 기본값은 0입니다.
   */
  constructor(type = Enums.LengthPercentageAutoType.Length, value = 0) {
    styleValues.set(this, native.createLengthPercentageAuto(type, value));
  }

  /**
   * The keyword or unit that determines how the numeric value is interpreted.
   *
   * @zh 决定如何解释数值的关键字或单位。
   * @ja 数値の解釈を決めるキーワードまたは単位。
   * @ko 숫자의 해석을 결정하는 키워드 또는 단위입니다.
   * @returns Native shared scalar field.
   * @zh 原生共享标量字段。
   * @ja ネイティブ共有スカラーフィールド。
   * @ko 네이티브 공유 스칼라 필드입니다.
   */
  get type(): Enums.LengthPercentageAutoType {
    return scalarMapping(this).typeView[0];
  }

  /**
   * The keyword or unit that determines how the numeric value is interpreted.
   *
   * @zh 决定如何解释数值的关键字或单位。
   * @ja 数値の解釈を決めるキーワードまたは単位。
   * @ko 숫자의 해석을 결정하는 키워드 또는 단위입니다.
   * @param value - Checked native scalar value.
   * @zh value - 检查后的原生标量值。
   * @ja value - 検証されたネイティブスカラー値。
   * @ko value - 검증된 네이티브 스칼라 값입니다.
   */
  set type(value: Enums.LengthPercentageAutoType) {
    scalarMapping(this).typeView[0] = checkedStyleEnum(value, 2);
  }

  /**
   * Writable shared memory for this scalar component; writes update the owned
   * value directly.
   *
   * @zh 此标量分量的可写共享内存；写入直接更新独立值。
   * @ja このスカラー成分の書き込み可能な共有メモリ。書き込みは所有値を直接更新します。
   * @ko 이 스칼라 성분의 쓰기 가능한 공유 메모리이며 쓰기는 소유 값을 직접 갱신합니다.
   * @returns Writable view; native consumers validate before use.
   * @zh 可写视图；原生调用前会验证值。
   * @ja 書き込み可能なビュー。ネイティブの使用前に検証します。
   * @ko 쓰기 가능한 뷰이며 네이티브 사용 전에 검증합니다.
   */
  get typeView(): Uint8Array {
    return scalarMapping(this).typeView;
  }

  /**
   * The pixel length or percentage selected by type; keyword modes ignore this
   * component.
   *
   * @zh 由 type 选择的像素长度或百分比；关键字模式忽略此分量。
   * @ja type が選ぶピクセル長または百分率。キーワードでは無視します。
   * @ko type이 선택한 픽셀 길이 또는 백분율이며 키워드 모드는 무시합니다.
   * @returns Native shared scalar field.
   * @zh 原生共享标量字段。
   * @ja ネイティブ共有スカラーフィールド。
   * @ko 네이티브 공유 스칼라 필드입니다.
   */
  get value(): number {
    return scalarMapping(this).valueView[0];
  }

  /**
   * The pixel length or percentage selected by type; keyword modes ignore this
   * component.
   *
   * @zh 由 type 选择的像素长度或百分比；关键字模式忽略此分量。
   * @ja type が選ぶピクセル長または百分率。キーワードでは無視します。
   * @ko type이 선택한 픽셀 길이 또는 백분율이며 키워드 모드는 무시합니다.
   * @param value - Checked native scalar value.
   * @zh value - 检查后的原生标量值。
   * @ja value - 検証されたネイティブスカラー値。
   * @ko value - 검증된 네이티브 스칼라 값입니다.
   */
  set value(value: number) {
    scalarMapping(this).valueView[0] = checkedStyleFloat(value);
  }

  /**
   * Writable shared memory for this scalar component; writes update the owned
   * value directly.
   *
   * @zh 此标量分量的可写共享内存；写入直接更新独立值。
   * @ja このスカラー成分の書き込み可能な共有メモリ。書き込みは所有値を直接更新します。
   * @ko 이 스칼라 성분의 쓰기 가능한 공유 메모리이며 쓰기는 소유 값을 직접 갱신합니다.
   * @returns Writable view; native consumers validate before use.
   * @zh 可写视图；原生调用前会验证值。
   * @ja 書き込み可能なビュー。ネイティブの使用前に検証します。
   * @ko 쓰기 가능한 뷰이며 네이티브 사용 전에 검증합니다.
   */
  get valueView(): Float32Array {
    return scalarMapping(this).valueView;
  }

}
stylePrototypes.set('LengthPercentageAuto', LengthPercentageAuto.prototype);

/**
 * A length in pixels or a percentage of a reference size.
 *
 * @zh 像素长度或相对基准尺寸的百分比。
 * @ja ピクセル長または基準サイズに対する百分率。
 * @ko 픽셀 길이 또는 기준 크기에 대한 백분율입니다.
 * @remarks Numeric views retain only this scalar, independently of the DOM.
 * @zh 数值视图仅保活此值，其生命周期独立于 DOM 和运行时。
 * @ja 数値ビューは値のみを保持し、DOM とランタイムから独立しています。
 * @ko 숫자 뷰는 이 값만 유지하며 DOM 및 런타임과 독립적입니다.
 */
export class LengthPercentage {
  /**
   * A length in pixels or a percentage of a reference size.
   *
   * @zh 像素长度或相对基准尺寸的百分比。
   * @ja ピクセル長または基準サイズに対する百分率。
   * @ko 픽셀 길이 또는 기준 크기에 대한 백분율입니다.
   * @param type - Native enum; defaults to Length.
   * @zh type - 原生枚举，默认 Length。
   * @ja type - ネイティブ列挙。既定は Length。
   * @ko type - 네이티브 열거이며 기본값은 Length입니다.
   * @param value - Native float; defaults to zero.
   * @zh value - 原生浮点数，默认零。
   * @ja value - ネイティブ実数。既定はゼロ。
   * @ko value - 네이티브 실수이며 기본값은 0입니다.
   */
  constructor(type = Enums.LengthPercentageType.Length, value = 0) {
    styleValues.set(this, native.createLengthPercentage(type, value));
  }

  /**
   * The keyword or unit that determines how the numeric value is interpreted.
   *
   * @zh 决定如何解释数值的关键字或单位。
   * @ja 数値の解釈を決めるキーワードまたは単位。
   * @ko 숫자의 해석을 결정하는 키워드 또는 단위입니다.
   * @returns Native shared scalar field.
   * @zh 原生共享标量字段。
   * @ja ネイティブ共有スカラーフィールド。
   * @ko 네이티브 공유 스칼라 필드입니다.
   */
  get type(): Enums.LengthPercentageType {
    return scalarMapping(this).typeView[0];
  }

  /**
   * The keyword or unit that determines how the numeric value is interpreted.
   *
   * @zh 决定如何解释数值的关键字或单位。
   * @ja 数値の解釈を決めるキーワードまたは単位。
   * @ko 숫자의 해석을 결정하는 키워드 또는 단위입니다.
   * @param value - Checked native scalar value.
   * @zh value - 检查后的原生标量值。
   * @ja value - 検証されたネイティブスカラー値。
   * @ko value - 검증된 네이티브 스칼라 값입니다.
   */
  set type(value: Enums.LengthPercentageType) {
    scalarMapping(this).typeView[0] = checkedStyleEnum(value, 1);
  }

  /**
   * Writable shared memory for this scalar component; writes update the owned
   * value directly.
   *
   * @zh 此标量分量的可写共享内存；写入直接更新独立值。
   * @ja このスカラー成分の書き込み可能な共有メモリ。書き込みは所有値を直接更新します。
   * @ko 이 스칼라 성분의 쓰기 가능한 공유 메모리이며 쓰기는 소유 값을 직접 갱신합니다.
   * @returns Writable view; native consumers validate before use.
   * @zh 可写视图；原生调用前会验证值。
   * @ja 書き込み可能なビュー。ネイティブの使用前に検証します。
   * @ko 쓰기 가능한 뷰이며 네이티브 사용 전에 검증합니다.
   */
  get typeView(): Uint8Array {
    return scalarMapping(this).typeView;
  }

  /**
   * The pixel length or percentage selected by type; keyword modes ignore this
   * component.
   *
   * @zh 由 type 选择的像素长度或百分比；关键字模式忽略此分量。
   * @ja type が選ぶピクセル長または百分率。キーワードでは無視します。
   * @ko type이 선택한 픽셀 길이 또는 백분율이며 키워드 모드는 무시합니다.
   * @returns Native shared scalar field.
   * @zh 原生共享标量字段。
   * @ja ネイティブ共有スカラーフィールド。
   * @ko 네이티브 공유 스칼라 필드입니다.
   */
  get value(): number {
    return scalarMapping(this).valueView[0];
  }

  /**
   * The pixel length or percentage selected by type; keyword modes ignore this
   * component.
   *
   * @zh 由 type 选择的像素长度或百分比；关键字模式忽略此分量。
   * @ja type が選ぶピクセル長または百分率。キーワードでは無視します。
   * @ko type이 선택한 픽셀 길이 또는 백분율이며 키워드 모드는 무시합니다.
   * @param value - Checked native scalar value.
   * @zh value - 检查后的原生标量值。
   * @ja value - 検証されたネイティブスカラー値。
   * @ko value - 검증된 네이티브 스칼라 값입니다.
   */
  set value(value: number) {
    scalarMapping(this).valueView[0] = checkedStyleFloat(value);
  }

  /**
   * Writable shared memory for this scalar component; writes update the owned
   * value directly.
   *
   * @zh 此标量分量的可写共享内存；写入直接更新独立值。
   * @ja このスカラー成分の書き込み可能な共有メモリ。書き込みは所有値を直接更新します。
   * @ko 이 스칼라 성분의 쓰기 가능한 공유 메모리이며 쓰기는 소유 값을 직접 갱신합니다.
   * @returns Writable view; native consumers validate before use.
   * @zh 可写视图；原生调用前会验证值。
   * @ja 書き込み可能なビュー。ネイティブの使用前に検証します。
   * @ko 쓰기 가능한 뷰이며 네이티브 사용 전에 검증합니다.
   */
  get valueView(): Float32Array {
    return scalarMapping(this).valueView;
  }

}
stylePrototypes.set('LengthPercentage', LengthPercentage.prototype);

/**
 * A numeric value or the automatic keyword, used for stacking order.
 *
 * @zh 数值或自动关键字，用于堆叠顺序。
 * @ja 重なり順に使用する数値または自動キーワード。
 * @ko 쌓임 순서에 사용하는 숫자 또는 자동 키워드입니다.
 * @remarks Numeric views retain only this scalar, independently of the DOM.
 * @zh 数值视图仅保活此值，其生命周期独立于 DOM 和运行时。
 * @ja 数値ビューは値のみを保持し、DOM とランタイムから独立しています。
 * @ko 숫자 뷰는 이 값만 유지하며 DOM 및 런타임과 독립적입니다.
 */
export class NumberAuto {
  /**
   * A numeric value or the automatic keyword, used for stacking order.
   *
   * @zh 数值或自动关键字，用于堆叠顺序。
   * @ja 重なり順に使用する数値または自動キーワード。
   * @ko 쌓임 순서에 사용하는 숫자 또는 자동 키워드입니다.
   * @param type - Native enum; defaults to Number.
   * @zh type - 原生枚举，默认 Number。
   * @ja type - ネイティブ列挙。既定は Number。
   * @ko type - 네이티브 열거이며 기본값은 Number입니다.
   * @param value - Native float; defaults to zero.
   * @zh value - 原生浮点数，默认零。
   * @ja value - ネイティブ実数。既定はゼロ。
   * @ko value - 네이티브 실수이며 기본값은 0입니다.
   */
  constructor(type = Enums.NumberAutoType.Number, value = 0) {
    styleValues.set(this, native.createNumberAuto(type, value));
  }

  /**
   * The keyword or unit that determines how the numeric value is interpreted.
   *
   * @zh 决定如何解释数值的关键字或单位。
   * @ja 数値の解釈を決めるキーワードまたは単位。
   * @ko 숫자의 해석을 결정하는 키워드 또는 단위입니다.
   * @returns Native shared scalar field.
   * @zh 原生共享标量字段。
   * @ja ネイティブ共有スカラーフィールド。
   * @ko 네이티브 공유 스칼라 필드입니다.
   */
  get type(): Enums.NumberAutoType {
    return scalarMapping(this).typeView[0];
  }

  /**
   * The keyword or unit that determines how the numeric value is interpreted.
   *
   * @zh 决定如何解释数值的关键字或单位。
   * @ja 数値の解釈を決めるキーワードまたは単位。
   * @ko 숫자의 해석을 결정하는 키워드 또는 단위입니다.
   * @param value - Checked native scalar value.
   * @zh value - 检查后的原生标量值。
   * @ja value - 検証されたネイティブスカラー値。
   * @ko value - 검증된 네이티브 스칼라 값입니다.
   */
  set type(value: Enums.NumberAutoType) {
    scalarMapping(this).typeView[0] = checkedStyleEnum(value, 1);
  }

  /**
   * Writable shared memory for this scalar component; writes update the owned
   * value directly.
   *
   * @zh 此标量分量的可写共享内存；写入直接更新独立值。
   * @ja このスカラー成分の書き込み可能な共有メモリ。書き込みは所有値を直接更新します。
   * @ko 이 스칼라 성분의 쓰기 가능한 공유 메모리이며 쓰기는 소유 값을 직접 갱신합니다.
   * @returns Writable view; native consumers validate before use.
   * @zh 可写视图；原生调用前会验证值。
   * @ja 書き込み可能なビュー。ネイティブの使用前に検証します。
   * @ko 쓰기 가능한 뷰이며 네이티브 사용 전에 검증합니다.
   */
  get typeView(): Uint8Array {
    return scalarMapping(this).typeView;
  }

  /**
   * The number used when the type is Number; Auto ignores it.
   *
   * @zh Number 类型使用的数值；Auto 忽略该值。
   * @ja Number 型で使用する数値。Auto では無視します。
   * @ko Number 형식에서 사용하는 숫자이며 Auto는 무시합니다.
   * @returns Native shared scalar field.
   * @zh 原生共享标量字段。
   * @ja ネイティブ共有スカラーフィールド。
   * @ko 네이티브 공유 스칼라 필드입니다.
   */
  get value(): number {
    return scalarMapping(this).valueView[0];
  }

  /**
   * The number used when the type is Number; Auto ignores it.
   *
   * @zh Number 类型使用的数值；Auto 忽略该值。
   * @ja Number 型で使用する数値。Auto では無視します。
   * @ko Number 형식에서 사용하는 숫자이며 Auto는 무시합니다.
   * @param value - Checked native scalar value.
   * @zh value - 检查后的原生标量值。
   * @ja value - 検証されたネイティブスカラー値。
   * @ko value - 검증된 네이티브 스칼라 값입니다.
   */
  set value(value: number) {
    scalarMapping(this).valueView[0] = checkedStyleFloat(value);
  }

  /**
   * Writable shared memory for this scalar component; writes update the owned
   * value directly.
   *
   * @zh 此标量分量的可写共享内存；写入直接更新独立值。
   * @ja このスカラー成分の書き込み可能な共有メモリ。書き込みは所有値を直接更新します。
   * @ko 이 스칼라 성분의 쓰기 가능한 공유 메모리이며 쓰기는 소유 값을 직접 갱신합니다.
   * @returns Writable view; native consumers validate before use.
   * @zh 可写视图；原生调用前会验证值。
   * @ja 書き込み可能なビュー。ネイティブの使用前に検証します。
   * @ko 쓰기 가능한 뷰이며 네이티브 사용 전에 검증합니다.
   */
  get valueView(): Float32Array {
    return scalarMapping(this).valueView;
  }

}
stylePrototypes.set('NumberAuto', NumberAuto.prototype);

/**
 * An inline vertical alignment keyword or pixel offset.
 *
 * @zh 行内垂直对齐关键字或像素偏移。
 * @ja インラインの垂直配置キーワードまたはピクセルオフセット。
 * @ko 인라인 수직 정렬 키워드 또는 픽셀 오프셋입니다.
 * @remarks Numeric views retain only this scalar, independently of the DOM.
 * @zh 数值视图仅保活此值，其生命周期独立于 DOM 和运行时。
 * @ja 数値ビューは値のみを保持し、DOM とランタイムから独立しています。
 * @ko 숫자 뷰는 이 값만 유지하며 DOM 및 런타임과 독립적입니다.
 */
export class VerticalAlign {
  /**
   * Create an inline alignment keyword or a pixel offset.
   *
   * @zh 创建行内对齐关键字或像素偏移。
   * @ja インライン配置キーワードまたはピクセルオフセットを作ります。
   * @ko 인라인 정렬 키워드 또는 픽셀 오프셋을 만듭니다.
   * @param typeOrLength - One number means pixels; omitted means Baseline.
   * @zh typeOrLength - 单参数表示像素长度，省略时为 Baseline。
   * @ja typeOrLength - 単一の引数はピクセル。省略時は Baseline。
   * @ko typeOrLength - 단일 인수는 픽셀이며 생략하면 Baseline입니다.
   * @param value - With two arguments: type first, then pixel length.
   * @zh value - 双参数时首个参数为类型，此参数为长度。
   * @ja value - 引数が二つなら、最初は型、この値は長さです。
   * @ko value - 두 인수인 경우 첫 번째는 형식이며 이 값은 길이입니다.
   */
  constructor(typeOrLength?: number, value?: number) {
    const type = value !== undefined ? typeOrLength!
      : typeOrLength === undefined ? Enums.VerticalAlignType.Baseline
        : Enums.VerticalAlignType.Length;
    styleValues.set(this,
      native.createVerticalAlign(type, value ?? typeOrLength ?? 0));
  }

  /**
   * The keyword or unit that determines how the numeric value is interpreted.
   *
   * @zh 决定如何解释数值的关键字或单位。
   * @ja 数値の解釈を決めるキーワードまたは単位。
   * @ko 숫자의 해석을 결정하는 키워드 또는 단위입니다.
   * @returns Native shared scalar field.
   * @zh 原生共享标量字段。
   * @ja ネイティブ共有スカラーフィールド。
   * @ko 네이티브 공유 스칼라 필드입니다.
   */
  get type(): Enums.VerticalAlignType {
    return scalarMapping(this).typeView[0];
  }

  /**
   * The keyword or unit that determines how the numeric value is interpreted.
   *
   * @zh 决定如何解释数值的关键字或单位。
   * @ja 数値の解釈を決めるキーワードまたは単位。
   * @ko 숫자의 해석을 결정하는 키워드 또는 단위입니다.
   * @param value - Checked native scalar value.
   * @zh value - 检查后的原生标量值。
   * @ja value - 検証されたネイティブスカラー値。
   * @ko value - 검증된 네이티브 스칼라 값입니다.
   */
  set type(value: Enums.VerticalAlignType) {
    scalarMapping(this).typeView[0] = checkedStyleEnum(value, 9);
  }

  /**
   * Writable shared memory for this scalar component; writes update the owned
   * value directly.
   *
   * @zh 此标量分量的可写共享内存；写入直接更新独立值。
   * @ja このスカラー成分の書き込み可能な共有メモリ。書き込みは所有値を直接更新します。
   * @ko 이 스칼라 성분의 쓰기 가능한 공유 메모리이며 쓰기는 소유 값을 직접 갱신합니다.
   * @returns Writable view; native consumers validate before use.
   * @zh 可写视图；原生调用前会验证值。
   * @ja 書き込み可能なビュー。ネイティブの使用前に検証します。
   * @ko 쓰기 가능한 뷰이며 네이티브 사용 전에 검증합니다.
   */
  get typeView(): Uint8Array {
    return scalarMapping(this).typeView;
  }

  /**
   * The pixel offset used by Length; keywords ignore it.
   *
   * @zh Length 类型使用的像素偏移；关键字忽略此值。
   * @ja Length 型で使用するピクセルオフセット。キーワードでは無視します。
   * @ko Length 형식의 픽셀 오프셋이며 키워드는 무시합니다.
   * @returns Native shared scalar field.
   * @zh 原生共享标量字段。
   * @ja ネイティブ共有スカラーフィールド。
   * @ko 네이티브 공유 스칼라 필드입니다.
   */
  get value(): number {
    return scalarMapping(this).valueView[0];
  }

  /**
   * The pixel offset used by Length; keywords ignore it.
   *
   * @zh Length 类型使用的像素偏移；关键字忽略此值。
   * @ja Length 型で使用するピクセルオフセット。キーワードでは無視します。
   * @ko Length 형식의 픽셀 오프셋이며 키워드는 무시합니다.
   * @param value - Checked native scalar value.
   * @zh value - 检查后的原生标量值。
   * @ja value - 検証されたネイティブスカラー値。
   * @ko value - 검증된 네이티브 스칼라 값입니다.
   */
  set value(value: number) {
    scalarMapping(this).valueView[0] = checkedStyleFloat(value);
  }

  /**
   * Writable shared memory for this scalar component; writes update the owned
   * value directly.
   *
   * @zh 此标量分量的可写共享内存；写入直接更新独立值。
   * @ja このスカラー成分の書き込み可能な共有メモリ。書き込みは所有値を直接更新します。
   * @ko 이 스칼라 성분의 쓰기 가능한 공유 메모리이며 쓰기는 소유 값을 직접 갱신합니다.
   * @returns Writable view; native consumers validate before use.
   * @zh 可写视图；原生调用前会验证值。
   * @ja 書き込み可能なビュー。ネイティブの使用前に検証します。
   * @ko 쓰기 가능한 뷰이며 네이티브 사용 전에 검증합니다.
   */
  get valueView(): Float32Array {
    return scalarMapping(this).valueView;
  }

}
stylePrototypes.set('VerticalAlign', VerticalAlign.prototype);

/**
 * Computed line height in pixels together with its inherited number or length.
 *
 * @zh 计算后的像素行高及其继承数值或长度。
 * @ja 計算済みの行の高さ（px）と継承する数値または長さ。
 * @ko 계산된 줄 높이（px）와 상속할 숫자 또는 길이입니다.
 * @remarks Numeric views retain only this scalar, independently of the DOM.
 * @zh 数值视图仅保活此值，其生命周期独立于 DOM 和运行时。
 * @ja 数値ビューは値のみを保持し、DOM とランタイムから独立しています。
 * @ko 숫자 뷰는 이 값만 유지하며 DOM 및 런타임과 독립적입니다.
 */
export class LineHeight {
  /**
   * Create a line height value with pixel and inheritance components.
   *
   * @zh 创建含像素和继承分量的行高值。
   * @ja ピクセルと継承成分を持つ行の高さを作ります。
   * @ko 픽셀 및 상속 성분을 가진 줄 높이를 만듭니다.
   * @param value - Computed pixels; default is 12f * 1.2f.
   * @zh value - 计算后的像素，默认为 12f * 1.2f。
   * @ja value - 計算済みピクセル。既定は 12f * 1.2f。
   * @ko value - 계산된 픽셀이며 기본값은 12f * 1.2f입니다.
   * @param inheritType - Number or Length; defaults to Number.
   * @zh inheritType - Number 或 Length，默认 Number。
   * @ja inheritType - Number または Length。既定は Number。
   * @ko inheritType - Number 또는 Length이며 기본값은 Number입니다.
   * @param inheritValue - Inherited number or length; defaults to 1.2.
   * @zh inheritValue - 继承的数值或长度，默认 1.2。
   * @ja inheritValue - 継承する数値または長さ。既定は 1.2。
   * @ko inheritValue - 상속할 숫자 또는 길이이며 기본값은 1.2입니다.
   */
  constructor(
    value = Math.fround(12 * Math.fround(1.2)),
    inheritType = Enums.LineHeightInheritType.Number, inheritValue = 1.2,
  ) {
    styleValues.set(this,
      native.createLineHeight(value, inheritType, inheritValue));
  }

  /**
   * The keyword or unit that determines how the numeric value is interpreted.
   *
   * @zh 决定如何解释数值的关键字或单位。
   * @ja 数値の解釈を決めるキーワードまたは単位。
   * @ko 숫자의 해석을 결정하는 키워드 또는 단위입니다.
   * @returns Native shared scalar field.
   * @zh 原生共享标量字段。
   * @ja ネイティブ共有スカラーフィールド。
   * @ko 네이티브 공유 스칼라 필드입니다.
   */
  get inheritType(): Enums.LineHeightInheritType {
    return lineHeightMapping(this).typeView[0];
  }

  /**
   * The keyword or unit that determines how the numeric value is interpreted.
   *
   * @zh 决定如何解释数值的关键字或单位。
   * @ja 数値の解釈を決めるキーワードまたは単位。
   * @ko 숫자의 해석을 결정하는 키워드 또는 단위입니다.
   * @param value - Checked native scalar value.
   * @zh value - 检查后的原生标量值。
   * @ja value - 検証されたネイティブスカラー値。
   * @ko value - 검증된 네이티브 스칼라 값입니다.
   */
  set inheritType(value: Enums.LineHeightInheritType) {
    lineHeightMapping(this).typeView[0] = checkedStyleEnum(value, 1);
  }

  /**
   * Writable shared memory for this scalar component; writes update the owned
   * value directly.
   *
   * @zh 此标量分量的可写共享内存；写入直接更新独立值。
   * @ja このスカラー成分の書き込み可能な共有メモリ。書き込みは所有値を直接更新します。
   * @ko 이 스칼라 성분의 쓰기 가능한 공유 메모리이며 쓰기는 소유 값을 직접 갱신합니다.
   * @returns Writable view; native consumers validate before use.
   * @zh 可写视图；原生调用前会验证值。
   * @ja 書き込み可能なビュー。ネイティブの使用前に検証します。
   * @ko 쓰기 가능한 뷰이며 네이티브 사용 전에 검증합니다.
   */
  get typeView(): Uint8Array {
    return lineHeightMapping(this).typeView;
  }

  /**
   * The computed line height in pixels.
   *
   * @zh 计算后的行高，单位为像素。
   * @ja 計算済みの行の高さ（px）。
   * @ko 계산된 줄 높이（px）입니다.
   * @returns Native shared scalar field.
   * @zh 原生共享标量字段。
   * @ja ネイティブ共有スカラーフィールド。
   * @ko 네이티브 공유 스칼라 필드입니다.
   */
  get value(): number {
    return lineHeightMapping(this).valueView[0];
  }

  /**
   * The computed line height in pixels.
   *
   * @zh 计算后的行高，单位为像素。
   * @ja 計算済みの行の高さ（px）。
   * @ko 계산된 줄 높이（px）입니다.
   * @param value - Checked native scalar value.
   * @zh value - 检查后的原生标量值。
   * @ja value - 検証されたネイティブスカラー値。
   * @ko value - 검증된 네이티브 스칼라 값입니다.
   */
  set value(value: number) {
    lineHeightMapping(this).valueView[0] = checkedStyleFloat(value);
  }

  /**
   * Writable shared memory for this scalar component; writes update the owned
   * value directly.
   *
   * @zh 此标量分量的可写共享内存；写入直接更新独立值。
   * @ja このスカラー成分の書き込み可能な共有メモリ。書き込みは所有値を直接更新します。
   * @ko 이 스칼라 성분의 쓰기 가능한 공유 메모리이며 쓰기는 소유 값을 직접 갱신합니다.
   * @returns Writable view; native consumers validate before use.
   * @zh 可写视图；原生调用前会验证值。
   * @ja 書き込み可能なビュー。ネイティブの使用前に検証します。
   * @ko 쓰기 가능한 뷰이며 네이티브 사용 전에 검증합니다.
   */
  get valueView(): Float32Array {
    return lineHeightMapping(this).valueView;
  }

  /**
   * The inherited line height multiplier or pixel length, according to
   * inheritType.
   *
   * @zh 继承的行高倍数或像素长度，由 inheritType 决定。
   * @ja inheritType に応じた継承する行の高さの倍率またはピクセル長。
   * @ko inheritType에 따른 상속 줄 높이 배율 또는 픽셀 길이입니다.
   * @returns Native shared scalar field.
   * @zh 原生共享标量字段。
   * @ja ネイティブ共有スカラーフィールド。
   * @ko 네이티브 공유 스칼라 필드입니다.
   */
  get inheritValue(): number {
    return lineHeightMapping(this).inheritValueView[0];
  }

  /**
   * The inherited line height multiplier or pixel length, according to
   * inheritType.
   *
   * @zh 继承的行高倍数或像素长度，由 inheritType 决定。
   * @ja inheritType に応じた継承する行の高さの倍率またはピクセル長。
   * @ko inheritType에 따른 상속 줄 높이 배율 또는 픽셀 길이입니다.
   * @param value - Checked native scalar value.
   * @zh value - 检查后的原生标量值。
   * @ja value - 検証されたネイティブスカラー値。
   * @ko value - 검증된 네이티브 스칼라 값입니다.
   */
  set inheritValue(value: number) {
    lineHeightMapping(this).inheritValueView[0] = checkedStyleFloat(value);
  }

  /**
   * Writable shared memory for this scalar component; writes update the owned
   * value directly.
   *
   * @zh 此标量分量的可写共享内存；写入直接更新独立值。
   * @ja このスカラー成分の書き込み可能な共有メモリ。書き込みは所有値を直接更新します。
   * @ko 이 스칼라 성분의 쓰기 가능한 공유 메모리이며 쓰기는 소유 값을 직접 갱신합니다.
   * @returns Writable view; native consumers validate before use.
   * @zh 可写视图；原生调用前会验证值。
   * @ja 書き込み可能なビュー。ネイティブの使用前に検証します。
   * @ko 쓰기 가능한 뷰이며 네이티브 사용 전에 검증합니다.
   */
  get inheritValueView(): Float32Array {
    return lineHeightMapping(this).inheritValueView;
  }

}
stylePrototypes.set('LineHeight', LineHeight.prototype);
