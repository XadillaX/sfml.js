import { native, type NativeNumericValue } from '../internal/native';
import { Unit, checkedUnit } from './unit';

const values = new WeakMap<NumericValue, NativeNumericValue>();

/**
 * Resolve an owned native numeric mapping.
 *
 * @internal
 * @param value - Numeric wrapper.
 * @returns Checked native mapping.
 */
function mapping(value: NumericValue): NativeNumericValue {
  const result = values.get(value);
  if (!result) {
    throw new TypeError('Expected a NumericValue');
  }
  return result;
}

/**
 * Resolve the checked native handle.
 *
 * @internal
 * @param value - Numeric wrapper.
 * @returns Opaque native handle.
 */
export function numericValueHandle(value: NumericValue): object {
  return mapping(value).handle;
}

/**
 * Native-owned Rml::NumericValue with mapped number and unit fields.
 *
 * @zh Native 持有的 Rml::NumericValue，数值和单位字段通过共享视图映射。
 * @ja 数値と単位フィールドを共有ビューにマップするネイティブ所有の Rml::NumericValue。
 * @ko 숫자와 단위 필드를 공유 뷰에 매핑하는 네이티브 소유 Rml::NumericValue입니다.
 * @remarks
 * Views retain only this independent native value. They remain usable after
 * wrapper collection and RmlUi shutdown, including in a worker.
 * Native operations reject non-finite numbers and unknown unit bits written
 * directly through the views. Unit sets can be stored and compared; element
 * resolution requires a single applicable unit.
 * @zh 视图仅保活独立原生值；包装器回收或 RmlUi 关闭后仍可用，Worker 中也可使用。
 * 原生操作拒绝直接写入视图的非有限数和未知单位位。可存储和比较单位集合，
 * 但元素解析要求单个适用单位。
 * @ja ビューは独立した値だけを保持し、ラッパーの回収・終了後や Worker でも使用可能。
 * ネイティブ操作は非有限値と未知の単位ビットを拒否します。
 * 単位集合は保持・比較できますが、要素での解決には適用可能な単一単位が必要です。
 * @ko 뷰는 독립적인 값만 유지하며 래퍼 수집·종료 후와 Worker에서도 사용할 수 있습니다.
 * 네이티브 작업은 유한하지 않은 수와 알 수 없는 단위 비트를 거부합니다.
 * 단위 집합은 저장·비교할 수 있지만 요소 해석에는 적용 가능한 단일 단위가 필요합니다.
 */
export class NumericValue {
  /**
   * Create a numeric style value with a finite number and its unit.
   *
   * @zh 使用有限数值及其单位创建数值样式值。
   * @ja 有限の数と単位から数値スタイル値を作ります。
   * @ko 유한한 숫자와 단위로 숫자 스타일 값을 만듭니다.
   * @param number - Finite float; defaults to zero.
   * @zh number - 有限浮点数，默认为零。
   * @ja number - 有限の浮動小数点数。既定値はゼロ。
   * @ko number - 유한한 실수이며 기본값은 0입니다.
   * @param unit - Native unit or unit set; defaults to UNKNOWN.
   * @zh unit - 原生单位或单位集合，默认为 UNKNOWN。
   * @ja unit - 単位または単位集合。既定値は UNKNOWN。
   * @ko unit - 네이티브 단위 또는 단위 집합이며 기본값은 UNKNOWN입니다.
   */
  constructor(number = 0, unit: Unit = Unit.UNKNOWN) {
    values.set(this, native.createNumericValue(number, unit));
  }

  /**
   * Mapped Rml::NumericValue::number; writes round to float32.
   *
   * @zh 映射 Rml::NumericValue::number；写入时舍入为 float32。
   * @ja Rml::NumericValue::number。書き込み時は float32 に丸めます。
   * @ko 매핑된 Rml::NumericValue::number이며 쓰기 시 float32로 반올림합니다.
   * @returns Native number.
   * @zh 原生数值。
   * @ja ネイティブの数値。
   * @ko 네이티브 수치입니다.
   */
  get number(): number {
    return mapping(this).numberView[0];
  }

  /**
   * Write the native float32 number.
   *
   * @zh 写入原生 float32 数值。
   * @ja ネイティブ float32 数値を書き込みます。
   * @ko 네이티브 float32 수치를 씁니다.
   * @param value - Finite number within float32 range.
   * @zh value - float32 范围内的有限数。
   * @ja value - float32 範囲内の有限数。
   * @ko value - float32 범위의 유한한 수입니다.
   */
  set number(value: number) {
    if (!Number.isFinite(value) ||
        Math.abs(value) > 3.4028234663852886e38) {
      throw new TypeError('Expected a finite NumericValue float');
    }
    mapping(this).numberView[0] = value;
  }

  /**
   * Mapped Rml::NumericValue::unit.
   *
   * @zh 映射 Rml::NumericValue::unit。
   * @ja マップされた Rml::NumericValue::unit。
   * @ko 매핑된 Rml::NumericValue::unit입니다.
   * @returns Native unit flags.
   * @zh 原生单位标志。
   * @ja ネイティブの単位フラグ。
   * @ko 네이티브 단위 플래그입니다.
   */
  get unit(): Unit {
    return mapping(this).unitView[0];
  }

  /**
   * Write the native unit flags.
   *
   * @zh 写入原生单位标志。
   * @ja ネイティブ単位フラグを書き込みます。
   * @ko 네이티브 단위 플래그를 씁니다.
   * @param value - Known unit or unit set.
   * @zh value - 已知单位或单位集合。
   * @ja value - 既知の単位または単位集合。
   * @ko value - 알려진 단위 또는 단위 집합입니다.
   */
  set unit(value: Unit) {
    mapping(this).unitView[0] = checkedUnit(value);
  }

  /**
   * Writable one-float view of the actual native number field.
   *
   * @zh 实际原生数值字段的单浮点可写视图。
   * @ja 実際の数値フィールドを指す 1 要素の書き込み可能なビュー。
   * @ko 실제 숫자 필드의 쓰기 가능한 단일 실수 뷰입니다.
   * @returns Shared view, independent of wrapper lifetime.
   * @zh 共享视图，生命周期独立于包装器。
   * @ja ラッパーの寿命と独立した共有ビュー。
   * @ko 래퍼 수명과 독립적인 공유 뷰입니다.
   */
  get numberView(): Float32Array {
    return mapping(this).numberView;
  }

  /**
   * Writable one-integer view of the actual native unit field.
   *
   * @zh 实际原生单位字段的单整数可写视图。
   * @ja 実際の単位フィールドを指す 1 要素の書き込み可能な整数ビュー。
   * @ko 실제 단위 필드의 쓰기 가능한 단일 정수 뷰입니다.
   * @returns Shared view, independent of wrapper lifetime.
   * @zh 共享视图，生命周期独立于包装器。
   * @ja ラッパーの寿命と独立した共有ビュー。
   * @ko 래퍼 수명과 독립적인 공유 뷰입니다.
   */
  get unitView(): Int32Array {
    return mapping(this).unitView;
  }

  /**
   * Copy into independent native storage.
   *
   * @zh 复制到独立原生存储。
   * @ja 独立したネイティブ領域にコピーします。
   * @ko 독립적인 네이티브 저장소로 복사합니다.
   * @returns Owned numeric copy.
   * @zh 独立数值副本。
   * @ja 所有権を持つ数値コピー。
   * @ko 독립적으로 소유하는 수치 복사본입니다.
   */
  clone(): NumericValue {
    return numericValueFromNative(
      native.cloneNumericValue(numericValueHandle(this)),
    );
  }

  /**
   * Rml::NumericValue operator== (number and unit).
   *
   * @zh Rml::NumericValue 的 operator==，比较数值和单位。
   * @ja 数値と単位を比較する Rml::NumericValue の operator==。
   * @ko 숫자와 단위를 비교하는 Rml::NumericValue operator==입니다.
   * @param other - Value to compare.
   * @zh other - 待比较值。
   * @ja other - 比較する値。
   * @ko other - 비교할 값입니다.
   * @returns Native equality result.
   * @zh 原生相等比较结果。
   * @ja ネイティブ等価比較の結果。
   * @ko 네이티브 동등 비교 결과입니다.
   */
  equals(other: NumericValue): boolean {
    return native.numericValueEquals(
      numericValueHandle(this), numericValueHandle(other),
    );
  }

  /**
   * Rml::NumericValue operator!=.
   *
   * @zh Rml::NumericValue 的 operator!=。
   * @ja Rml::NumericValue の operator!=。
   * @ko Rml::NumericValue operator!=입니다.
   * @param other - Value to compare.
   * @zh other - 待比较值。
   * @ja other - 比較する値。
   * @ko other - 비교할 값입니다.
   * @returns Native inequality result.
   * @zh 原生不等比较结果。
   * @ja ネイティブ非等価比較の結果。
   * @ko 네이티브 비동등 비교 결과입니다.
   */
  notEquals(other: NumericValue): boolean {
    return native.numericValueNotEquals(
      numericValueHandle(this), numericValueHandle(other),
    );
  }
}

/**
 * Wrap a native-owned numeric value without a second allocation.
 *
 * @internal
 * @param value - Native value mapping.
 * @returns Owned numeric wrapper.
 */
export function numericValueFromNative(
  value: NativeNumericValue,
): NumericValue {
  const result = Object.create(NumericValue.prototype) as NumericValue;
  values.set(result, value);
  return result;
}
