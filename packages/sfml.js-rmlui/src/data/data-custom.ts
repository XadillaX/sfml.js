import type {
  DataVariable, DataVariableType, DataVariantValue,
} from './data-model';
import {
  dataVariantFromNative, variantToNative,
} from '../internal/animation-values';

/**
 * Explicit result of VariableDefinition::Get, including successful null values.
 *
 * @zh VariableDefinition::Get 的显式结果，包含成功返回的 null。
 * @ja 成功時の null を含む VariableDefinition::Get の明示的な結果。
 * @ko 성공한 null 값을 포함하는 VariableDefinition::Get의 명시적 결과입니다.
 */
export interface DataGetResult {
  /**
   * Whether the native definition can read this value.
   *
   * @zh 原生定义是否能够读取该值。
   * @ja ネイティブ定義がこの値を取得できるか。
   * @ko 네이티브 정의에서 이 값을 읽을 수 있는지 여부입니다.
   */
  success: boolean;

  /**
   * Owned Variant, inspected only when success is true.
   *
   * @zh 自有 Variant，仅当 success 为 true 时读取。
   * @ja success が true の場合だけ読み取る所有する Variant。
   * @ko success가 true일 때만 읽는 소유 Variant입니다.
   */
  value: DataVariantValue;
}

/**
 * Real native VariableDefinition callbacks over a retained JS payload.
 * Omitted callbacks use native defaults: false, zero, null, or an empty list.
 *
 * @zh 基于保活 JS 数据的真实原生 VariableDefinition 回调。省略项使用原生默认值。
 * @ja 保持する JS データに対する実際のネイティブ VariableDefinition コールバック。
 * @ko 유지되는 JS 데이터에 대한 실제 네이티브 VariableDefinition 콜백입니다.
 * @template T - Payload retained by each bound native storage node.
 * @zh T - 每个已绑定原生存储节点保活的数据。
 * @ja T - バインド済みネイティブノードが保持するデータ。
 * @ko T - 각 바인딩된 네이티브 저장소 노드가 유지하는 데이터입니다.
 */
export interface DataCustomDefinition<T = unknown> {
  /**
   * Rml::DataVariableType category.
   *
   * @zh Rml::DataVariableType 分类。
   * @ja Rml::DataVariableType の分類。
   * @ko Rml::DataVariableType 분류입니다.
   */
  type: DataVariableType;

  /**
   * Read an owned Variant; success must be an explicit boolean.
   *
   * @zh 读取自有 Variant，success 必须是显式布尔值。
   * @ja 所有する Variant を取得します。success は明示的な真偽値です。
   * @ko 소유 Variant를 읽으며 success는 명시적 불리언이어야 합니다.
   * @param payload - Bound data, without per-frame serialization.
   * @zh payload - 已绑定数据，无逐帧序列化。
   * @ja payload - フレームごとの直列化を行わないバインド済みデータ。
   * @ko payload - 프레임별 직렬화가 없는 바인딩된 데이터입니다.
   * @returns Native get result.
   * @zh 原生读取结果。
   * @ja ネイティブ取得結果。
   * @ko 네이티브 읽기 결과입니다.
   */
  get?(payload: T): DataGetResult;

  /**
   * Set an owned Variant; return whether the assignment succeeded.
   *
   * @zh 写入自有 Variant，返回赋值是否成功。
   * @ja 所有する Variant を設定し、成功したかを返します。
   * @ko 소유 Variant를 설정하고 성공 여부를 반환합니다.
   * @param payload - Bound data.
   * @zh payload - 已绑定数据。
   * @ja payload - バインド済みデータ。
   * @ko payload - 바인딩된 데이터입니다.
   * @param value - Owned controller or host assignment.
   * @zh value - 控制器或宿主写入的自有值。
   * @ja value - コントローラーまたはホストが設定する所有する値。
   * @ko value - 컨트롤러나 호스트가 설정하는 소유 값입니다.
   * @returns Explicit native acceptance.
   * @zh 显式原生接受结果。
   * @ja 明示的なネイティブ受理結果。
   * @ko 명시적 네이티브 수락 결과입니다.
   */
  set?(payload: T, value: DataVariantValue): boolean;

  /**
   * Return an array length within the nonnegative native int range.
   *
   * @zh 返回非负原生 int 范围内的数组长度。
   * @ja 非負のネイティブ int 範囲内の配列長を返します。
   * @ko 음수가 아닌 네이티브 int 범위의 배열 길이를 반환합니다.
   * @param payload - Bound data.
   * @zh payload - 已绑定数据。
   * @ja payload - バインド済みデータ。
   * @ko payload - 바인딩된 데이터입니다.
   * @returns Native array length.
   * @zh 原生数组长度。
   * @ja ネイティブ配列長。
   * @ko 네이티브 배열 길이입니다.
   */
  size?(payload: T): number;

  /**
   * Return a checked variable from the same register, or null.
   *
   * @zh 返回同一注册表中的受检变量，或 null。
   * @ja 同じレジスターの検証済み変数または null を返します。
   * @ko 동일한 레지스터의 검증된 변수 또는 null을 반환합니다.
   * @param payload - Bound data.
   * @zh payload - 已绑定数据。
   * @ja payload - バインド済みデータ。
   * @ko payload - 바인딩된 데이터입니다.
   * @param address - Member name or array index, including the name "size".
   * @zh address - 成员名或数组索引，包含名称 "size"。
   * @ja address - "size" を含むメンバー名または配列添字。
   * @ko address - "size" 이름을 포함하는 멤버 이름 또는 배열 인덱스입니다.
   * @returns Checked child; native execution temporarily retains its lease.
   * @zh 受检子项，原生执行期间临时保活其租约。
   * @ja 検証済みの子。ネイティブ実行中はリースを一時保持します。
   * @ko 검증된 자식이며 네이티브 실행 중 수명 핸들을 일시 유지합니다.
   */
  child?(payload: T, address: string | number): DataVariable | null;

  /**
   * Return schema-level member names for native reflection and Debugger.
   *
   * @zh 返回类型级成员名，供原生反射和 Debugger 使用。
   * @ja ネイティブリフレクションと Debugger 用の型レベルのメンバー名を返します。
   * @ko 네이티브 리플렉션과 Debugger용 유형 수준 멤버 이름을 반환합니다.
   * @returns Reflected names.
   * @zh 反射名称。
   * @ja リフレクションされた名前。
   * @ko 리플렉션된 이름입니다.
   */
  reflectMemberNames?(): readonly string[];
}

/**
 * Snapshot callbacks before native registration and marshal owned Variants.
 *
 * @param definition - Custom callbacks.
 * @returns Native callback entries in Get/Set/Size/Child/Reflect order.
 * @internal
 */
export function customDataCallbacks<T>(
  definition: DataCustomDefinition<T>,
): readonly unknown[] {
  const { get, set, size, child, reflectMemberNames } = definition;
  return [
    typeof get === 'function' ? (payload: T) => {
      const result = get(payload);
      if (typeof result !== 'object' || result === null) {
        return result;
      }
      return {
        success: result.success,
        get value() {
          return variantToNative(result.value);
        },
      };
    } : get,
    typeof set === 'function' ? (payload: T, value: unknown) =>
      set(payload, dataVariantFromNative(value)) : set,
    size, child, reflectMemberNames,
  ];
}
