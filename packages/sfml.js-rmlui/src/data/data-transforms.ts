import { native } from '../internal/native';
import {
  variantFromNative, variantToNative,
} from '../internal/animation-values';
import type { DataTransformFunc, DataVariantValue } from './data-model';

const registers = new WeakMap<object, TransformFuncRegister>();

/**
 * Output of Rml::TransformFuncRegister::Call, preserving its success flag.
 *
 * @zh Rml::TransformFuncRegister::Call 的输出，保留其成功标记。
 * @ja 成功フラグを保持する Rml::TransformFuncRegister::Call の結果。
 * @ko 성공 플래그를 유지하는 Rml::TransformFuncRegister::Call의 결과입니다.
 */
export interface DataTransformResult {
  /**
   * Whether the named native transform exists and was called.
   *
   * @zh 指定的原生变换是否存在并已调用。
   * @ja 指定したネイティブ変換が存在し、呼び出されたか。
   * @ko 지정한 네이티브 변환이 존재하고 호출되었는지 여부입니다.
   */
  readonly success: boolean;

  /**
   * Owned output value; missing transforms return null with success false.
   *
   * @zh 自有输出值；变换不存在时返回 null，且 success 为 false。
   * @ja 所有する出力値。変換がなければ null、success は false です。
   * @ko 소유 출력값이며 변환이 없으면 null이고 success는 false입니다.
   */
  readonly value: DataVariantValue;
}

/**
 * Native transform functions shared by every model using one type register.
 *
 * @zh 使用同一类型注册表的所有模型共享的原生变换函数。
 * @ja 一つの型レジスターを使う全モデルで共有するネイティブ変換関数。
 * @ko 동일한 유형 레지스터를 사용하는 모든 모델이 공유하는 네이티브 변환입니다.
 */
export class TransformFuncRegister {
  /**
   * Checked owner lease for the native transform register.
   *
   * @zh 原生变换注册表的经校验所有者租约。
   * @ja ネイティブ変換レジスターの検証済み所有者リース。
   * @ko 네이티브 변환 레지스터의 검증된 소유자 수명 핸들입니다.
   * @internal
   */
  readonly handle: object;

  /**
   * Wrap the transform register borrowed from a native data type register.
   *
   * @zh 包装从原生数据类型注册表借用的变换注册表。
   * @ja データ型レジスターから借用する変換レジスターをラップします。
   * @ko 데이터 유형 레지스터에서 빌린 변환 레지스터를 감쌉니다.
   * @param handle - Native data type register lease.
   * @zh handle - 原生数据类型注册表租约。
   * @ja handle - ネイティブデータ型レジスターのリース。
   * @ko handle - 네이티브 데이터 유형 레지스터 수명 핸들입니다.
   * @internal
   */
  constructor(handle: object) {
    this.handle = handle;
    registers.set(handle, this);
  }

  /**
   * Whether the owning type register remains valid.
   *
   * @zh 所属类型注册表是否仍有效。
   * @ja 所有する型レジスターがまだ有効か。
   * @ko 소유 유형 레지스터가 아직 유효한지 여부입니다.
   * @returns Native owner validity.
   * @zh 原生所有者是否有效。
   * @ja ネイティブ所有者の有効性。
   * @ko 네이티브 소유자 유효성입니다.
   */
  get isValid(): boolean {
    return native.dataRegisterIsValid(this.handle);
  }

  /**
   * Rml::TransformFuncRegister::Register; duplicates retain the first function.
   *
   * @zh Rml::TransformFuncRegister::Register；名称重复时保留首次注册的函数。
   * @ja Rml::TransformFuncRegister::Register。同名なら最初の関数を保持します。
   * @ko Rml::TransformFuncRegister::Register이며 중복 이름은 첫 함수를 유지합니다.
   * @param name - Native expression transform name.
   * @zh name - 原生表达式变换名称。
   * @ja name - ネイティブ式の変換名。
   * @ko name - 네이티브 표현식 변환 이름입니다.
   * @param callback - Synchronous transform returning an owned Variant.
   * @zh callback - 返回自有 Variant 的同步变换函数。
   * @ja callback - 所有する Variant を返す同期変換関数。
   * @ko callback - 소유 Variant를 반환하는 동기 변환 함수입니다.
   */
  register(name: string, callback: DataTransformFunc): void {
    native.dataTransformRegister(this.handle, name,
      args => variantToNative(callback(args.map(variantFromNative))));
  }

  /**
   * Rml::TransformFuncRegister::Call with owned arguments and output.
   *
   * @zh 使用自有参数调用 Rml::TransformFuncRegister::Call，返回独立结果。
   * @ja 所有する引数で Rml::TransformFuncRegister::Call を呼び、独立した結果を返します。
   * @ko 소유 인수로 Rml::TransformFuncRegister::Call을 호출하고 독립 결과를 반환합니다.
   * @param name - Registered transform name.
   * @zh name - 已注册变换名称。
   * @ja name - 登録済み変換名。
   * @ko name - 등록된 변환 이름입니다.
   * @param arguments_ - Ordered native Variant arguments.
   * @zh arguments_ - 有序原生 Variant 参数。
   * @ja arguments_ - 順序付きネイティブ Variant 引数。
   * @ko arguments_ - 순서가 있는 네이티브 Variant 인수입니다.
   * @returns Native success flag and owned output.
   * @zh 原生成功标记及自有输出。
   * @ja ネイティブの成功フラグと所有する出力。
   * @ko 네이티브 성공 플래그와 소유 출력입니다.
   */
  call(
    name: string, arguments_: readonly DataVariantValue[],
  ): DataTransformResult {
    const result = native.dataTransformCall(this.handle, name,
      arguments_.map(value => variantToNative(value)));
    return {
      success: result.success,
      value: variantFromNative(result.value) as DataVariantValue,
    };
  }
}

/**
 * Wrap the native transform register with stable facade identity.
 *
 * @param handle - Native data type register lease.
 * @returns Canonical transform register.
 * @internal
 */
export function dataTransformsFromNative(
  handle: object,
): TransformFuncRegister {
  return registers.get(handle) ?? new TransformFuncRegister(handle);
}
