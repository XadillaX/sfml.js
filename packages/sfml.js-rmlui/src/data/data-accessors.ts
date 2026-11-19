import {
  DataVariable, DataVariableType, type DataVariantValue, type DataModelHandle,
} from './data-model';
import type { DataSchema } from './data-schema';
import type { RmlEvent } from '../events/event';
import type { VariantValue } from '../values/types';
import {
  dataVariantFromNative, variantToNative,
} from '../internal/animation-values';

/**
 * Host equivalent of a native typed getter with a Variant output parameter.
 *
 * @zh 原生带 Variant 输出参数的类型 getter 的宿主等价形式。
 * @ja Variant 出力引数を持つネイティブ型 getter のホスト表現。
 * @ko Variant 출력 매개변수가 있는 네이티브 타입 getter의 호스트 표현입니다.
 * @template T - Retained payload type.
 * @zh T - 保活的数据类型。
 * @ja T - 保持するデータ型。
 * @ko T - 유지되는 데이터 유형입니다.
 */
export interface DataTypeGetFunc<T> {
  /**
   * Read a scalar representation of the retained payload.
   *
   * @zh 读取保活数据的标量表示。
   * @ja 保持するデータのスカラー表現を読み取ります。
   * @ko 유지되는 데이터의 스칼라 표현을 읽습니다.
   * @param payload - Retained host value.
   * @zh payload - 保活的宿主数据。
   * @ja payload - 保持するホスト値。
   * @ko payload - 유지되는 호스트 값입니다.
   * @returns Owned Variant value.
   * @zh 自有 Variant 值。
   * @ja 所有する Variant 値。
   * @ko 소유 Variant 값입니다.
   */
  (payload: T): DataVariantValue;
}

/**
 * Host equivalent of a native typed void setter.
 *
 * @zh 原生类型 void setter 的宿主等价形式。
 * @ja ネイティブ型 void setter のホスト表現。
 * @ko 네이티브 타입 void setter의 호스트 표현입니다.
 * @template T - Retained payload type.
 * @zh T - 保活的数据类型。
 * @ja T - 保持するデータ型。
 * @ko T - 유지되는 데이터 유형입니다.
 */
export interface DataTypeSetFunc<T> {
  /**
   * Assign the owned value to the retained payload.
   *
   * @zh 将自有值赋给保活数据。
   * @ja 所有する値を保持するデータへ代入します。
   * @ko 소유 값을 유지되는 데이터에 할당합니다.
   * @param payload - Retained host value.
   * @zh payload - 保活的宿主数据。
   * @ja payload - 保持するホスト値。
   * @ko payload - 유지되는 호스트 값입니다.
   * @param value - Owned Variant input.
   * @zh value - 自有 Variant 输入。
   * @ja value - 所有する Variant 入力。
   * @ko value - 소유 Variant 입력입니다.
   */
  (payload: T, value: DataVariantValue): void;
}

/**
 * Native member event equivalent; bind the host receiver before registration.
 *
 * @zh 原生成员事件的等价形式，注册前绑定宿主接收者。
 * @ja ネイティブメンバーイベントの表現。登録前にホストの this をバインドします。
 * @ko 네이티브 멤버 이벤트 표현이며 등록 전에 호스트 수신자를 바인딩합니다.
 * @template T - Host receiver type.
 * @zh T - 宿主接收者类型。
 * @ja T - ホストの this の型。
 * @ko T - 호스트 수신자 유형입니다.
 */
export interface DataEventMemberFunc<T> {
  /**
   * Process a native event using the bound receiver.
   *
   * @zh 通过绑定的接收者处理原生事件。
   * @ja バインドした this でネイティブイベントを処理します。
   * @ko 바인딩된 수신자로 네이티브 이벤트를 처리합니다.
   * @param this - Bound host receiver.
   * @zh this - 绑定的宿主接收者。
   * @ja this - バインドしたホストの this。
   * @ko this - 바인딩된 호스트 수신자입니다.
   * @param model - Checked native model handle.
   * @zh model - 受检原生模型句柄。
   * @ja model - 検証済みネイティブモデルハンドル。
   * @ko model - 검증된 네이티브 모델 핸들입니다.
   * @param event - Live native event.
   * @zh event - 有效的原生事件。
   * @ja event - 有効なネイティブイベント。
   * @ko event - 유효한 네이티브 이벤트입니다.
   * @param args - Owned expression arguments.
   * @zh args - 自有表达式参数。
   * @ja args - 所有する式の引数。
   * @ko args - 소유 표현식 인수입니다.
   */
  (
    this: T, model: DataModelHandle,
    event: RmlEvent, args: readonly VariantValue[],
  ): void;
}

/**
 * Native Variant-output member getter; bind the host receiver for bindFunc.
 *
 * @zh 原生 Variant 输出成员 getter，通过绑定宿主接收者用于 bindFunc。
 * @ja Variant 出力メンバー getter。this をバインドして bindFunc に渡します。
 * @ko Variant 출력 멤버 getter이며 수신자를 바인딩하여 bindFunc에 전달합니다.
 * @template T - Host receiver type.
 * @zh T - 宿主接收者类型。
 * @ja T - ホストの this の型。
 * @ko T - 호스트 수신자 유형입니다.
 */
export interface MemberGetFunc<T> {
  /**
   * Read an owned value from the receiver.
   *
   * @zh 从接收者读取自有值。
   * @ja this から所有する値を読み取ります。
   * @ko 수신자에서 소유 값을 읽습니다.
   * @param this - Bound host receiver.
   * @zh this - 绑定的宿主接收者。
   * @ja this - バインドしたホストの this。
   * @ko this - 바인딩된 호스트 수신자입니다.
   * @returns Owned Variant value.
   * @zh 自有 Variant 值。
   * @ja 所有する Variant 値。
   * @ko 소유 Variant 값입니다.
   */
  (this: T): DataVariantValue;
}

/**
 * Native Variant-input member setter; bind the host receiver for bindFunc.
 *
 * @zh 原生 Variant 输入成员 setter，通过绑定宿主接收者用于 bindFunc。
 * @ja Variant 入力メンバー setter。this をバインドして bindFunc に渡します。
 * @ko Variant 입력 멤버 setter이며 수신자를 바인딩하여 bindFunc에 전달합니다.
 * @template T - Host receiver type.
 * @zh T - 宿主接收者类型。
 * @ja T - ホストの this の型。
 * @ko T - 호스트 수신자 유형입니다.
 */
export interface MemberSetFunc<T> {
  /**
   * Assign the value using the receiver.
   *
   * @zh 通过接收者赋值。
   * @ja this を使って値を代入します。
   * @ko 수신자로 값을 할당합니다.
   * @param this - Bound host receiver.
   * @zh this - 绑定的宿主接收者。
   * @ja this - バインドしたホストの this。
   * @ko this - 바인딩된 호스트 수신자입니다.
   * @param value - Native Variant input.
   * @zh value - 原生 Variant 输入。
   * @ja value - ネイティブ Variant 入力。
   * @ko value - 네이티브 Variant 입력입니다.
   */
  (this: T, value: VariantValue): void;
}

/**
 * Native value or reference member getter represented by a bound host method.
 *
 * @zh 通过绑定宿主方法表示的原生值或引用成员 getter。
 * @ja バインドしたホストメソッドで表す、値または参照のメンバー getter。
 * @ko 바인딩된 호스트 메서드로 표현하는 값 또는 참조 멤버 getter입니다.
 * @template Receiver - Host receiver type.
 * @zh Receiver - 宿主接收者类型。
 * @ja Receiver - ホストの this の型。
 * @ko Receiver - 호스트 수신자 유형입니다.
 * @template ReturnType - Returned value or checked reference type.
 * @zh ReturnType - 返回值或受检引用类型。
 * @ja ReturnType - 戻り値または検証済み参照の型。
 * @ko ReturnType - 반환 값 또는 검증된 참조 유형입니다.
 */
export interface MemberGetterFunc<Receiver, ReturnType> {
  /**
   * Read a member value or reference.
   *
   * @zh 读取成员值或引用。
   * @ja メンバー値または参照を読み取ります。
   * @ko 멤버 값 또는 참조를 읽습니다.
   * @param this - Bound host receiver.
   * @zh this - 绑定的宿主接收者。
   * @ja this - バインドしたホストの this。
   * @ko this - 바인딩된 호스트 수신자입니다.
   * @returns Member value or checked reference.
   * @zh 成员值或受检引用。
   * @ja メンバー値または検証済み参照。
   * @ko 멤버 값 또는 검증된 참조입니다.
   */
  (this: Receiver): ReturnType;
}

/**
 * Native value member setter represented by a bound host method.
 *
 * @zh 通过绑定宿主方法表示的原生值成员 setter。
 * @ja バインドしたホストメソッドで表す値メンバー setter。
 * @ko 바인딩된 호스트 메서드로 표현하는 값 멤버 setter입니다.
 * @template Receiver - Host receiver type.
 * @zh Receiver - 宿主接收者类型。
 * @ja Receiver - ホストの this の型。
 * @ko Receiver - 호스트 수신자 유형입니다.
 * @template AssignType - Assigned value type.
 * @zh AssignType - 赋值类型。
 * @ja AssignType - 代入値の型。
 * @ko AssignType - 할당 값 유형입니다.
 */
export interface MemberSetterFunc<Receiver, AssignType> {
  /**
   * Assign a member value.
   *
   * @zh 设置成员值。
   * @ja メンバー値を設定します。
   * @ko 멤버 값을 설정합니다.
   * @param this - Bound host receiver.
   * @zh this - 绑定的宿主接收者。
   * @ja this - バインドしたホストの this。
   * @ko this - 바인딩된 호스트 수신자입니다.
   * @param value - Member assignment.
   * @zh value - 成员赋值。
   * @ja value - メンバーへの代入値。
   * @ko value - 멤버 할당 값입니다.
   */
  (this: Receiver, value: AssignType): void;
}

/**
 * Absent member callback, corresponding to native VoidMemberFunc.
 *
 * @zh 缺省成员回调，对应原生 VoidMemberFunc。
 * @ja ネイティブ VoidMemberFunc に対応する省略メンバーコールバック。
 * @ko 네이티브 VoidMemberFunc에 대응하는 생략된 멤버 콜백입니다.
 */
export type VoidMemberFunc = undefined;

/**
 * Read a member from its current checked parent path.
 * Scalar schemas return an owned value; reference, array and struct schemas
 * return a same-register variable or null.
 *
 * @zh 从当前受检父路径读取成员。标量返回自有值；引用、数组和结构返回同注册表变量或 null。
 * @ja 現在の検証済み親パスから読み取ります。スカラーは所有値、参照と配列と構造は同じレジスターの変数または null。
 * @ko 현재 검증된 부모 경로에서 읽습니다. 스칼라는 소유 값, 참조와 배열과 구조는 같은 레지스터의 변수 또는 null을 반환합니다.
 */
export interface DataMemberGetter {
  /**
   * Read without retaining a borrowed native address.
   *
   * @zh 读取成员，不保留借用的原生地址。
   * @ja 借用したネイティブアドレスを保持せずに読み取ります。
   * @ko 빌린 네이티브 주소를 유지하지 않고 읽습니다.
   * @param parent - Current native parent variable.
   * @zh parent - 当前原生父变量。
   * @ja parent - 現在のネイティブ親変数。
   * @ko parent - 현재 네이티브 부모 변수입니다.
   * @returns Owned scalar value or checked target.
   * @zh 自有标量值或受检目标。
   * @ja 所有スカラー値または検証済みターゲット。
   * @ko 소유 스칼라 값 또는 검증된 대상입니다.
   */
  (parent: DataVariable): DataVariantValue | DataVariable;
}

/**
 * Assign a scalar member after native width and enum conversion.
 * Custom scalar members exchange owned Variants directly.
 *
 * @zh 原生宽度和枚举转换通过后设置标量成员；自定义标量成员直接交换自有 Variant。
 * @ja 幅と列挙変換の検証後に設定します。カスタムスカラーのメンバーは所有 Variant を直接交換します。
 * @ko 너비와 열거형 변환을 검증한 뒤 설정합니다. 사용자 스칼라 멤버는 소유 Variant를 직접 교환합니다.
 */
export interface DataMemberSetter {
  /**
   * Assign the converted value with native void setter semantics.
   *
   * @zh 按原生 void setter 语义设置转换后的值。
   * @ja ネイティブ void setter の意味で変換した値を設定します。
   * @ko 네이티브 void setter 의미로 변환된 값을 설정합니다.
   * @param parent - Current checked parent.
   * @zh parent - 当前受检父变量。
   * @ja parent - 現在の検証済み親変数。
   * @ko parent - 현재 검증된 부모입니다.
   * @param value - Converted owned Variant.
   * @zh value - 转换后的自有 Variant。
   * @ja value - 変換済み所有 Variant。
   * @ko value - 변환된 소유 Variant입니다.
   */
  (parent: DataVariable, value: DataVariantValue): void;
}

/**
 * Registered scalar type callbacks, corresponding to ScalarFuncDefinition.
 * Each bound payload is retained; getters return owned Variants.
 *
 * @zh 对应 ScalarFuncDefinition 的标量类型回调。保活每份绑定数据；getter 返回自有 Variant。
 * @ja ScalarFuncDefinition の型コールバック。データを保持し、所有 Variant を返します。
 * @ko ScalarFuncDefinition 유형 콜백입니다. 데이터를 유지하고 소유 Variant를 반환합니다.
 * @template T - Retained payload type.
 * @zh T - 保活的数据类型。
 * @ja T - 保持するデータ型。
 * @ko T - 유지되는 데이터 유형입니다.
 */
export interface DataScalarDefinition<T = unknown> {
  /**
   * Read an owned scalar representation of this payload.
   *
   * @zh 读取数据的自有标量表示。
   * @ja ペイロードの所有スカラー表現を読み取ります。
   * @ko 데이터의 소유 스칼라 표현을 읽습니다.
   * @param payload - Retained host value.
   * @zh payload - 保活的宿主数据。
   * @ja payload - 保持されるホスト値。
   * @ko payload - 유지되는 호스트 값입니다.
   * @returns Owned Variant.
   * @zh 自有 Variant。
   * @ja 所有 Variant。
   * @ko 소유 Variant입니다.
   */
  get?(payload: T): DataVariantValue;

  /**
   * Assign using native void setter semantics; omit for read-only storage.
   *
   * @zh 按原生 void setter 语义赋值；只读存储可省略。
   * @ja ネイティブ void setter の意味で設定します。読み取り専用なら省略します。
   * @ko 네이티브 void setter 의미로 설정하며 읽기 전용이면 생략합니다.
   * @param payload - Retained host value.
   * @zh payload - 保活的宿主数据。
   * @ja payload - 保持されるホスト値。
   * @ko payload - 유지되는 호스트 값입니다.
   * @param value - Owned Variant to assign.
   * @zh value - 要设置的自有 Variant。
   * @ja value - 設定する所有 Variant。
   * @ko value - 설정할 소유 Variant입니다.
   */
  set?(payload: T, value: DataVariantValue): void;
}

/**
 * Wrap checked parent leases and marshal values inside the callback guard.
 *
 * @param schema - Registered member schema.
 * @param getter - Optional member getter.
 * @param setter - Optional member setter.
 * @returns Native callback pair.
 * @internal
 */
export function dataMemberCallbacks(
  schema: DataSchema, getter?: DataMemberGetter, setter?: DataMemberSetter,
): readonly unknown[] {
  const reference = schema.isReference ||
    schema.type !== DataVariableType.Scalar;
  return [
    typeof getter === 'function' ? (parent: object) => {
      const result = getter(new DataVariable(parent));
      return reference ? result : variantToNative(result);
    } : getter,
    typeof setter === 'function' ? (parent: object, value: unknown) =>
      setter(new DataVariable(parent), dataVariantFromNative(value)) : setter,
  ];
}
