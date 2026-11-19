import { native } from '../internal/native';
import { RmlEvent } from '../events/event';
import type { VariantValue, VariantDefault } from '../values/types';
import {
  variantFromNative, variantToNative,
} from '../internal/animation-values';
import {
  DataDefinition, dataRegisterFromNative, dataSchemaFromNative,
  DataSchema, type DataTypeRegister,
  type DataStorageValue, type DataNumericView, type DataScalarKind,
  type DataEnumKind, type DataStructHandle,
} from './data-schema';
import type { DataCustomDefinition } from './data-custom';
import type { DataScalarDefinition } from './data-accessors';
import type { DataAddress, DataAddressEntry } from './data-address';

const models = new WeakMap<object, DataModelConstructor>();
const handles = new WeakMap<object, DataModelHandle>();

/**
 * Built-in scalar values stored by native RmlUi data definitions.
 *
 * @zh 由原生 RmlUi 数据定义存储的内置标量值。
 * @ja ネイティブ RmlUi データ定義で保存する組み込みスカラー値。
 * @ko 네이티브 RmlUi 데이터 정의에 저장하는 내장 스칼라 값입니다.
 */
export type DataScalarValue = boolean | number | bigint | string;

/**
 * Owned native Variant values accepted by data callbacks, including null.
 *
 * @zh 数据回调接受的自有原生 Variant 值，包含 null。
 * @ja null を含む、データコールバックが受け付ける所有する Variant 値。
 * @ko null을 포함하여 데이터 콜백이 허용하는 소유 네이티브 Variant 값입니다.
 */
export type DataVariantValue =
  Exclude<VariantDefault,
  import('../values/types').VariantScriptPointer |
  import('../values/types').VariantOpaquePointer> | null;

/**
 * Native Rml::DataVariableType categories.
 *
 * @zh 原生 Rml::DataVariableType 分类。
 * @ja ネイティブ Rml::DataVariableType の分類。
 * @ko 네이티브 Rml::DataVariableType 분류입니다.
 */
export enum DataVariableType {
  /**
   * Scalar get/set operations.
   *
   * @zh 标量读写操作。
   * @ja スカラーの取得と設定。
   * @ko 스칼라 읽기 및 쓰기입니다.
   */
  Scalar = 0,
  /**
   * Indexed children and size.
   *
   * @zh 索引子项和大小。
   * @ja 添字付きの子とサイズ。
   * @ko 인덱스로 지정한 자식과 크기입니다.
   */
  Array = 1,
  /**
   * Named children and member reflection.
   *
   * @zh 命名子项和成员反射。
   * @ja 名前付きの子とメンバーのリフレクション。
   * @ko 이름이 있는 자식과 멤버 리플렉션입니다.
   */
  Struct = 2,
}

/**
 * Rml::DataGetFunc equivalent returning an owned Variant.
 *
 * @zh 返回自有 Variant 的 Rml::DataGetFunc 对应接口。
 * @ja 所有する Variant を返す Rml::DataGetFunc 相当の関数。
 * @ko 소유 Variant를 반환하는 Rml::DataGetFunc 대응 함수입니다.
 * @returns Owned Variant value.
 * @zh 自有 Variant 值。
 * @ja 所有する Variant 値。
 * @ko 소유 Variant 값입니다.
 */
export interface DataGetFunc {
  /**
   * Read the bound owned Variant synchronously.
   *
   * @zh 同步读取已绑定的自有 Variant。
   * @ja バインド済みの所有する Variant を同期取得します。
   * @ko 바인딩된 소유 Variant를 동기적으로 읽습니다.
   * @returns Owned Variant value.
   * @zh 自有 Variant 值。
   * @ja 所有する Variant 値。
   * @ko 소유 Variant 값입니다.
   */
  (): DataVariantValue;
}

/**
 * Rml::DataSetFunc equivalent assigning one value.
 *
 * @zh 赋值的 Rml::DataSetFunc 对应接口。
 * @ja 値を設定する Rml::DataSetFunc 相当の関数。
 * @ko 값을 설정하는 Rml::DataSetFunc 대응 함수입니다.
 * @param value - Native controller assignment.
 * @zh value - 原生控制器的赋值。
 * @ja value - ネイティブコントローラーからの設定値。
 * @ko value - 네이티브 컨트롤러가 설정할 값입니다.
 */
export interface DataSetFunc {
  /**
   * Assign the native controller value synchronously.
   *
   * @zh 同步写入原生控制器值。
   * @ja ネイティブコントローラーの値を同期設定します。
   * @ko 네이티브 컨트롤러 값을 동기적으로 설정합니다.
   * @param value - Controller assignment.
   * @zh value - 控制器的赋值。
   * @ja value - コントローラーからの設定値。
   * @ko value - 컨트롤러가 설정할 값입니다.
   */
  (value: VariantValue): void;
}

/**
 * Rml::DataTransformFunc receives native expression arguments in order.
 *
 * @zh Rml::DataTransformFunc 按顺序接收原生表达式参数。
 * @ja Rml::DataTransformFunc は式の引数を順番に受け取ります。
 * @ko Rml::DataTransformFunc는 네이티브 표현식 인수를 순서대로 받습니다.
 * @param arguments_ - Pipe input followed by explicit arguments.
 * @zh arguments_ - 管道输入及随后显式传入的参数。
 * @ja arguments_ - パイプの入力と明示的な引数。
 * @ko arguments_ - 파이프 입력과 이어지는 명시적 인수입니다.
 * @returns Transformed owned Variant.
 * @zh 变换后的自有 Variant。
 * @ja 変換後の所有する Variant。
 * @ko 변환된 소유 Variant입니다.
 */
export interface DataTransformFunc {
  /**
   * Transform native expression arguments synchronously.
   *
   * @zh 同步变换原生表达式参数。
   * @ja ネイティブ式の引数を同期変換します。
   * @ko 네이티브 표현식 인수를 동기적으로 변환합니다.
   * @param arguments_ - Pipe input followed by explicit arguments.
   * @zh arguments_ - 管道输入及随后显式传入的参数。
   * @ja arguments_ - パイプの入力と明示的な引数。
   * @ko arguments_ - 파이프 입력과 이어지는 명시적 인수입니다.
   * @returns Transformed owned Variant.
   * @zh 变换后的自有 Variant。
   * @ja 変換後の所有する Variant。
   * @ko 변환된 소유 Variant입니다.
   */
  (arguments_: readonly VariantValue[]): DataVariantValue;
}

/**
 * Rml::DataEventFunc receives a model, live event and expression arguments.
 *
 * @zh Rml::DataEventFunc 接收模型句柄、实时事件和表达式参数。
 * @ja Rml::DataEventFunc はモデル、ライブイベント、式の引数を受け取ります。
 * @ko Rml::DataEventFunc는 모델 핸들, 유효한 이벤트 및 표현식 인수를 받습니다.
 * @param model - Checked model handle.
 * @zh model - 经校验的模型句柄。
 * @ja model - 検証済みモデルハンドル。
 * @ko model - 검증된 모델 핸들입니다.
 * @param event - Event valid during the callback.
 * @zh event - 回调期间有效的事件。
 * @ja event - コールバック中に有効なイベント。
 * @ko event - 콜백 동안 유효한 이벤트입니다.
 * @param arguments_ - Evaluated native expression arguments.
 * @zh arguments_ - 已求值的原生表达式参数。
 * @ja arguments_ - 評価済みのネイティブ式の引数。
 * @ko arguments_ - 계산된 네이티브 표현식 인수입니다.
 */
export interface DataEventFunc {
  /**
   * Handle one native model event synchronously.
   *
   * @zh 同步处理一个原生模型事件。
   * @ja ネイティブモデルイベントを同期処理します。
   * @ko 네이티브 모델 이벤트 하나를 동기적으로 처리합니다.
   * @param model - Checked model handle.
   * @zh model - 经校验的模型句柄。
   * @ja model - 検証済みモデルハンドル。
   * @ko model - 검증된 모델 핸들입니다.
   * @param event - Event valid during the callback.
   * @zh event - 回调期间有效的事件。
   * @ja event - コールバック中に有効なイベント。
   * @ko event - 콜백 동안 유효한 이벤트입니다.
   * @param arguments_ - Evaluated native expression arguments.
   * @zh arguments_ - 已求值的原生表达式参数。
   * @ja arguments_ - 評価済みのネイティブ式の引数。
   * @ko arguments_ - 계산된 네이티브 표현식 인수입니다.
   */
  (
    model: DataModelHandle,
    event: RmlEvent,
    arguments_: readonly VariantValue[],
  ): void;
}

/**
 * Options matching Rml::Context::CreateDataModel.
 *
 * @zh 对应 Rml::Context::CreateDataModel 的选项。
 * @ja Rml::Context::CreateDataModel に対応するオプション。
 * @ko Rml::Context::CreateDataModel에 대응하는 옵션입니다.
 */
export interface DataModelOptions {
  /**
   * Independent register shared by native models; omit for the context default.
   *
   * @zh 原生模型共享的独立注册表，省略时使用上下文默认注册表。
   * @ja モデル間で共有する独立レジスター。省略時はコンテキストの既定値を使用。
   * @ko 네이티브 모델이 공유하는 독립 레지스터이며 생략하면 컨텍스트 기본값을 사용합니다.
   */
  typeRegister?: DataTypeRegister;

  /**
   * Allow expressions to reference variables bound later; defaults to false.
   *
   * @zh 允许表达式引用稍后绑定的变量，默认为 false。
   * @ja 後でバインドする変数の参照を許可します。既定値は false。
   * @ko 나중에 바인딩할 변수 참조를 허용하며 기본값은 false입니다.
   */
  allowMissingVariables?: boolean;
}

/**
 * Checked Rml::DataModelHandle with native dirty-variable scheduling.
 *
 * @zh 经校验的 Rml::DataModelHandle，使用原生脏变量调度。
 * @ja ネイティブの変更変数スケジューリングを使う Rml::DataModelHandle。
 * @ko 네이티브 변경 변수 스케줄링을 사용하는 검증된 Rml::DataModelHandle입니다.
 */
export class DataModelHandle {
  /**
   * Checked native lease.
   *
   * @zh 经校验的原生租约。
   * @ja 検証されたネイティブリース。
   * @ko 검증된 네이티브 수명 핸들입니다.
   * @internal
   */
  readonly handle: object;

  /**
   * Create an invalid model handle, or wrap an existing native lease.
   *
   * @zh 创建无效模型句柄，或包装已有的原生租约。
   * @ja 無効なモデルハンドルを作成するか、既存のリースをラップします。
   * @ko 무효한 모델 핸들을 생성하거나 기존 네이티브 수명 핸들을 감쌉니다.
   * @param handle - Internal native lease; omit to create an invalid handle.
   * @zh handle - 内部原生租约，省略时创建无效句柄。
   * @ja handle - 内部リース。省略すると無効なハンドルを作成します。
   * @ko handle - 내부 네이티브 수명 핸들이며 생략하면 무효한 핸들을 생성합니다.
   */
  constructor(handle?: object) {
    this.handle = handle ?? native.createInvalidDataModel();
  }

  /**
   * Whether the owning model and context still exist.
   *
   * @zh 所属模型和上下文是否仍存在。
   * @ja 所有モデルとコンテキストが存続しているか。
   * @ko 소유 모델과 컨텍스트가 아직 존재하는지 여부입니다.
   * @returns Native lease validity.
   * @zh 原生租约是否有效。
   * @ja ネイティブリースの有効性。
   * @ko 네이티브 수명 핸들의 유효성입니다.
   */
  get isValid(): boolean {
    return native.dataModelIsValid(this.handle);
  }

  /**
   * Read Rml::DataModelHandle::IsVariableDirty for a root name.
   *
   * @zh 使用 Rml::DataModelHandle::IsVariableDirty 查询根变量。
   * @ja Rml::DataModelHandle::IsVariableDirty でルート変数を確認します。
   * @ko Rml::DataModelHandle::IsVariableDirty로 루트 변수를 확인합니다.
   * @param name - Bound root variable name.
   * @zh name - 已绑定的根变量名。
   * @ja name - バインド済みルート変数名。
   * @ko name - 바인딩된 루트 변수 이름입니다.
   * @returns Native dirty state.
   * @zh 原生脏状态。
   * @ja ネイティブの変更状態。
   * @ko 네이티브 변경 상태입니다.
   */
  isVariableDirty(name: string): boolean {
    return native.dataModelIsVariableDirty(this.handle, name);
  }

  /**
   * Schedule dependent native views with Rml::DataModelHandle::DirtyVariable.
   *
   * @zh 使用 Rml::DataModelHandle::DirtyVariable 调度相关原生视图。
   * @ja Rml::DataModelHandle::DirtyVariable で依存ビューを更新対象にします。
   * @ko Rml::DataModelHandle::DirtyVariable로 종속 뷰 업데이트를 예약합니다.
   * @param name - Bound root variable name.
   * @zh name - 已绑定的根变量名。
   * @ja name - バインド済みルート変数名。
   * @ko name - 바인딩된 루트 변수 이름입니다.
   */
  dirtyVariable(name: string): void {
    native.dataModelDirtyVariable(this.handle, name);
  }

  /**
   * Schedule all bound roots with Rml::DataModelHandle::DirtyAllVariables.
   *
   * @zh 使用 Rml::DataModelHandle::DirtyAllVariables 调度全部根变量。
   * @ja Rml::DataModelHandle::DirtyAllVariables ですべてのルートを更新対象にします。
   * @ko Rml::DataModelHandle::DirtyAllVariables로 모든 루트 업데이트를 예약합니다.
   */
  dirtyAllVariables(): void {
    native.dataModelDirtyAllVariables(this.handle);
  }
}

/**
 * Checked path into an Rml::DataVariable; resolves native storage on each call.
 *
 * @zh 指向 Rml::DataVariable 的受检路径，每次调用重新解析原生存储。
 * @ja 呼び出しごとに保存場所を解決する Rml::DataVariable の検証済みパス。
 * @ko 호출마다 네이티브 저장소를 다시 찾는 검증된 Rml::DataVariable 경로입니다.
 */
export class DataVariable {
  /**
   * Native path lease.
   *
   * @zh 原生路径租约。
   * @ja ネイティブパスリース。
   * @ko 네이티브 경로 수명 핸들입니다.
   * @internal
   */
  readonly handle: object;

  /**
   * Create an invalid variable, wrap a checked lease, or allocate native-owned
   * storage using a registered schema and its initial value.
   *
   * @zh 创建无效变量、包装受检租约，或按已注册类型和初值分配原生自有存储。
   * @ja 無効変数、検証済みリース、または登録済み型と初期値で所有ストレージを作成します。
   * @ko 무효 변수, 검증된 수명 핸들 또는 등록된 유형과 초기값으로 소유 저장소를 생성합니다.
   * @param handle - Registered schema or internal lease; omit for invalid.
   * @zh handle - 已注册类型或内部租约，省略时创建无效变量。
   * @ja handle - 登録済み型または内部リース。省略すると無効な変数を作成します。
   * @ko handle - 등록된 유형 또는 내부 수명 핸들이며 생략하면 무효한 변수를 생성합니다.
   * @param initialValue - Schema storage or custom payload; omit for defaults.
   * @zh initialValue - 类型存储或自定义数据，省略时使用原生默认值。
   * @ja initialValue - 型のストレージまたはカスタムデータ。省略すると既定値です。
   * @ko initialValue - 유형 저장소 또는 사용자 데이터이며 생략하면 기본값입니다.
   */
  constructor(handle: DataSchema, initialValue?: unknown);

  /**
   * Create an invalid variable or wrap an internal checked native lease.
   *
   * @zh 创建无效变量，或包装内部受检原生租约。
   * @ja 無効な変数を作成するか、内部の検証済みリースをラップします。
   * @ko 무효 변수를 생성하거나 내부 검증된 네이티브 수명 핸들을 감쌉니다.
   * @param handle - Internal native lease; omit to create an invalid variable.
   * @zh handle - 内部原生租约，省略时创建无效变量。
   * @ja handle - 内部リース。省略すると無効な変数を作成します。
   * @ko handle - 내부 수명 핸들이며 생략하면 무효 변수를 생성합니다.
   */
  constructor(handle?: object);
  constructor(handle?: object, initialValue?: unknown) {
    this.handle = handle instanceof DataSchema
      ? native.createOwnedDataVariable(handle.handle, initialValue)
      : handle ?? native.createInvalidDataVariable();
  }

  /**
   * Whether the literal, model path or owned storage currently resolves.
   *
   * @zh 常量、模型路径或自有存储当前是否能解析为原生变量。
   * @ja 定数、モデルパスまたは所有ストレージを現在解決できるか。
   * @ko 리터럴, 모델 경로 또는 소유 저장소를 현재 찾을 수 있는지 여부입니다.
   * @returns Current native variable validity.
   * @zh 当前原生变量是否有效。
   * @ja 現在のネイティブ変数の有効性。
   * @ko 현재 네이티브 변수 유효성입니다.
   */
  get isValid(): boolean {
    return native.dataVariableIsValid(this.handle);
  }

  /**
   * The variable category used to select scalar, array or record operations.
   *
   * @zh 用于选择标量、数组或记录操作的变量分类。
   * @ja スカラー・配列・レコード操作の選択に使う変数の分類。
   * @ko 스칼라·배열·레코드 작업을 선택하는 변수 분류입니다.
   * @returns Native variable category.
   * @zh 原生变量分类。
   * @ja ネイティブ変数の分類。
   * @ko 네이티브 변수 분류입니다.
   */
  get type(): DataVariableType {
    return native.dataVariableType(this.handle);
  }

  /**
   * Rml::DataVariable::Size; non-arrays return the native default zero.
   *
   * @zh Rml::DataVariable::Size；非数组返回原生默认值零。
   * @ja Rml::DataVariable::Size。配列以外はネイティブ既定値のゼロです。
   * @ko Rml::DataVariable::Size이며 배열이 아니면 네이티브 기본값 0입니다.
   * @returns Native array size.
   * @zh 原生数组大小。
   * @ja ネイティブ配列のサイズ。
   * @ko 네이티브 배열 크기입니다.
   */
  get size(): number {
    return native.dataVariableSize(this.handle);
  }

  /**
   * Read a scalar with Rml::DataVariable::Get.
   *
   * @zh 使用 Rml::DataVariable::Get 读取标量。
   * @ja Rml::DataVariable::Get でスカラーを取得します。
   * @ko Rml::DataVariable::Get으로 스칼라를 읽습니다.
   * @returns Value, or undefined when the native definition cannot read it.
   * @zh 返回值；原生定义无法读取时返回 undefined。
   * @ja 値。定義から取得できない場合は undefined。
   * @ko 값이며 네이티브 정의에서 읽을 수 없으면 undefined입니다.
   */
  get(): VariantValue | undefined {
    const value = native.dataVariableGet(this.handle);
    return value === undefined ? undefined : variantFromNative(value);
  }

  /**
   * Set a scalar with Rml::DataVariable::Set without dirtying its root.
   *
   * @zh 使用 Rml::DataVariable::Set 写入标量，不自动标记根变量。
   * @ja Rml::DataVariable::Set で設定します。ルートの変更通知は行いません。
   * @ko Rml::DataVariable::Set으로 설정하며 루트 변경을 자동 표시하지 않습니다.
   * @param value - Owned Variant assignment.
   * @zh value - 要写入的自有 Variant。
   * @ja value - 設定する所有する Variant。
   * @ko value - 설정할 소유 Variant입니다.
   * @returns Native conversion/set result.
   * @zh 原生转换及写入结果。
   * @ja ネイティブ変換と設定の結果。
   * @ko 네이티브 변환 및 설정 결과입니다.
   */
  set(value: DataVariantValue): boolean {
    return native.dataVariableSet(this.handle, variantToNative(value));
  }

  /**
   * Resolve Rml::DataVariable::Child by member name or array index.
   *
   * @zh 按成员名称或数组索引解析 Rml::DataVariable::Child。
   * @ja 名前または添字で Rml::DataVariable::Child を解決します。
   * @ko 멤버 이름이나 배열 인덱스로 Rml::DataVariable::Child를 찾습니다.
   * @param address - Native address entry.
   * @zh address - 原生地址项。
   * @ja address - ネイティブアドレスエントリー。
   * @ko address - 네이티브 주소 항목입니다.
   * @returns Checked child, or null when absent.
   * @zh 经校验的子项，不存在时为 null。
   * @ja 検証済みの子。存在しなければ null。
   * @ko 검증된 자식이며 없으면 null입니다.
   */
  child(address: string | number | DataAddressEntry): DataVariable | null {
    const child = native.dataVariableChild(this.handle, address);
    return child ? new DataVariable(child) : null;
  }

  /**
   * Inspect native VariableDefinition::ReflectMemberNames.
   *
   * @zh 查询原生 VariableDefinition::ReflectMemberNames。
   * @ja ネイティブ VariableDefinition::ReflectMemberNames を取得します。
   * @ko 네이티브 VariableDefinition::ReflectMemberNames를 조회합니다.
   * @returns Reflected member names.
   * @zh 反射成员名称。
   * @ja リフレクションされたメンバー名。
   * @ko 리플렉션된 멤버 이름입니다.
   */
  reflectMemberNames(): string[] {
    return native.dataVariableReflectMembers(this.handle);
  }

  /**
   * Resolve a checked definition through native DataVariableAccessor.
   * Registered schemas retain identity; other definitions retain this variable.
   *
   * @zh 通过原生访问器获取受检定义。已注册类型保留标识，其他定义保活此变量。
   * @ja ネイティブアクセサーで検証済み定義を取得します。登録済み型は同一性を
   * 保持し、それ以外はこの変数のリースを保持します。
   * @ko 네이티브 접근자로 검증된 정의를 조회합니다. 등록된 유형은 동일성을
   * 유지하며 다른 정의는 이 변수의 수명 핸들을 유지합니다.
   * @returns Registered schema or a checked variable-bound definition.
   * @zh 已注册类型或与变量绑定的受检定义。
   * @ja 登録済みスキーマまたは変数に結び付く検証済み定義。
   * @ko 등록된 스키마 또는 변수에 연결된 검증된 정의입니다.
   */
  getDefinition(): DataDefinition {
    const handle = native.dataVariableGetDefinition(this.handle);
    return native.dataDefinitionIsRegistered(handle)
      ? dataSchemaFromNative(handle) : new DataDefinition(handle);
  }

  /**
   * Map numeric array storage; mutations require an explicit root dirty mark.
   *
   * @zh 映射数值数组存储，修改后需要显式标记根变量。
   * @ja 数値配列ストレージをマップします。変更後はルートの変更通知が必要です。
   * @ko 숫자 배열 저장소를 매핑하며 변경 후 루트 변경 표시가 필요합니다.
   * @returns Shared typed view; old views retain their memory after resize.
   * @zh 共享类型视图，旧视图在扩容后保留自身内存。
   * @ja 共有型付きビュー。サイズ変更後も以前のビューのメモリーは保持されます。
   * @ko 공유 타입 뷰이며 크기 변경 후에도 이전 뷰의 메모리를 유지합니다.
   */
  getNumericView(): DataNumericView {
    return native.dataVariableNumericView(this.handle) as DataNumericView;
  }

  /**
   * Read the retained payload of a custom native storage node.
   *
   * @zh 读取自定义原生存储节点保活的数据。
   * @ja 自作ネイティブストレージノードが保持するデータを取得します。
   * @ko 사용자 정의 네이티브 저장소 노드가 유지하는 데이터를 읽습니다.
   * @returns Caller payload with its original identity.
   * @zh 保留原始标识的调用方数据。
   * @ja 元の同一性を保つ呼び出し側データ。
   * @ko 원래 식별성을 유지하는 호출자 데이터입니다.
   */
  getPayload(): unknown {
    return native.dataVariableGetPayload(this.handle);
  }

  /**
   * Resize native array storage without automatically dirtying its root.
   * Allowed synchronously in data events; forbidden in value callbacks and
   * intervening nested listeners.
   *
   * @zh 调整原生数组存储大小，不自动标记根变量。
   * 数据事件内可同步调用；值回调及期间嵌套的监听器内禁止调用。
   * @ja ルートの変更通知を行わずにネイティブ配列ストレージのサイズを変更します。
   * データイベント内で同期実行でき、値コールバックと途中のリスナーでは禁止です。
   * @ko 루트 변경을 자동 표시하지 않고 네이티브 배열 저장소의 크기를 변경합니다.
   * 데이터 이벤트에서 동기 실행하며 값 콜백과 중첩 리스너에서는 금지합니다.
   * @param count - Nonnegative length; new members receive native defaults.
   * @zh count - 非负长度，新成员使用原生默认值。
   * @ja count - 非負の長さ。新しいメンバーはネイティブ既定値になります。
   * @ko count - 음수가 아닌 길이이며 새 멤버는 네이티브 기본값을 받습니다.
   * @returns Whether resizing succeeded.
   * @zh 大小调整是否成功。
   * @ja サイズ変更が成功したか。
   * @ko 크기 변경 성공 여부입니다.
   */
  resize(count: number): boolean {
    return native.dataVariableResize(this.handle, count);
  }

  /**
   * Get the checked target of a managed reference, or null.
   *
   * @zh 获取受管理引用的受检目标，空引用返回 null。
   * @ja 管理された参照の検証済み対象を返します。空参照は null。
   * @ko 관리되는 참조의 검증된 대상을 반환하며 빈 참조는 null입니다.
   * @returns Target lease, or null.
   * @zh 目标租约或 null。
   * @ja 対象リースまたは null。
   * @ko 대상 수명 핸들 또는 null입니다.
   */
  getReference(): DataVariable | null {
    const handle = native.dataVariableGetReference(this.handle);
    return handle ? new DataVariable(handle) : null;
  }

  /**
   * Replace or clear a managed target. Dirty affected view roots afterwards.
   * The target must have the registered underlying definition.
   *
   * @zh 替换或清空受管理目标，随后标记受影响视图的根变量为脏。目标必须匹配底层定义。
   * @ja 管理対象を置換またはクリアし、影響するビューのルートを dirty にします。
   * @ko 관리 대상을 교체하거나 지운 후 영향받는 뷰의 루트를 dirty로 표시합니다.
   * @param target - Checked variable, or null to clear.
   * @zh target - 受检变量，null 表示清空。
   * @ja target - 検証済み変数。null でクリア。
   * @ko target - 검증된 변수이며 null이면 지웁니다.
   * @returns True when the target is assigned.
   * @zh 目标赋值成功时为 true。
   * @ja 対象を設定すると true。
   * @ko 대상 설정에 성공하면 true입니다.
   */
  setReference(target: DataVariable | null): boolean {
    return native.dataVariableSetReference(this.handle, target?.handle ?? null);
  }
}

/**
 * Rml::DataModelConstructor with native-owned bindings.
 *
 * @zh 使用原生自有绑定的 Rml::DataModelConstructor。
 * @ja ネイティブ所有のバインドを使う Rml::DataModelConstructor。
 * @ko 네이티브가 소유하는 바인딩을 사용하는 Rml::DataModelConstructor입니다.
 */
export class DataModelConstructor extends DataModelHandle {
  /**
   * Obtain this model's Rml::DataTypeRegister.
   *
   * @zh 获取本模型的 Rml::DataTypeRegister。
   * @ja このモデルの Rml::DataTypeRegister を取得します。
   * @ko 이 모델의 Rml::DataTypeRegister를 가져옵니다.
   * @returns Canonical native register facade.
   * @zh 唯一的原生注册表接口。
   * @ja 正規のネイティブレジスターファサード。
   * @ko 동일성을 유지하는 네이티브 레지스터 인터페이스입니다.
   */
  getDataTypeRegister(): DataTypeRegister {
    return dataRegisterFromNative(native.dataModelGetTypeRegister(this.handle));
  }

  /**
   * Register scalar storage in this constructor's native type register.
   *
   * @zh 在本构造器的原生类型注册表中注册标量存储。
   * @ja このコンストラクターのネイティブ型レジスターにスカラーストレージを登録します。
   * @ko 이 생성자의 네이티브 유형 레지스터에 스칼라 저장소를 등록합니다.
   * @template T - Payload type when registering scalar callbacks.
   * @zh T - 注册标量回调时的数据类型。
   * @ja T - スカラーコールバックのデータ型。
   * @ko T - 스칼라 콜백을 등록할 때의 데이터 유형입니다.
   * @param name - Runtime schema name.
   * @zh name - 运行时类型名。
   * @ja name - 実行時型名。
   * @ko name - 런타임 유형 이름입니다.
   * @param kind - Checked storage kind or registered scalar callbacks.
   * @zh kind - 受检存储类型或注册标量回调。
   * @ja kind - 検証済みストレージ型またはスカラーコールバック。
   * @ko kind - 검증된 저장소 종류 또는 스칼라 콜백입니다.
   * @returns Definition, or null for a duplicate name.
   * @zh 定义，重名时为 null。
   * @ja 定義。同名なら null。
   * @ko 정의이며 중복 이름이면 null입니다.
   */
  registerScalar<T>(
    name: string, kind: DataScalarKind | DataScalarDefinition<T>,
  ): DataSchema | null {
    return this.getDataTypeRegister().registerScalar(name, kind);
  }

  /**
   * Register checked enum storage in this constructor's native register.
   *
   * @zh 在本构造器原生注册表中注册受检枚举存储。
   * @ja このコンストラクターのネイティブレジスターに検証済み列挙ストレージを登録します。
   * @ko 이 생성자의 네이티브 레지스터에 검증된 열거형 저장소를 등록합니다.
   * @param name - Runtime schema name.
   * @zh name - 运行时类型名。
   * @ja name - 実行時型名。
   * @ko name - 런타임 유형 이름입니다.
   * @param kind - Underlying integer width.
   * @zh kind - 底层整数宽度。
   * @ja kind - 基底の整数幅。
   * @ko kind - 기반 정수 너비입니다.
   * @returns Definition, or null for a duplicate name.
   * @zh 定义，重名时为 null。
   * @ja 定義。同名なら null。
   * @ko 정의이며 중복 이름이면 null입니다.
   */
  registerEnum(name: string, kind: DataEnumKind): DataSchema | null {
    return this.getDataTypeRegister().registerEnum(name, kind);
  }

  /**
   * Register an empty native record in the constructor's type register.
   *
   * @zh 在构造器类型注册表中注册空原生记录。
   * @ja コンストラクターの型レジスターに空のネイティブレコードを登録します。
   * @ko 생성자의 유형 레지스터에 빈 네이티브 레코드를 등록합니다.
   * @param name - Runtime schema name.
   * @zh name - 运行时类型名。
   * @ja name - 実行時型名。
   * @ko name - 런타임 유형 이름입니다.
   * @returns Record handle, or null for a duplicate name.
   * @zh 记录句柄，重名时为 null。
   * @ja レコードハンドル。同名なら null。
   * @ko 레코드 핸들이며 중복 이름이면 null입니다.
   */
  registerStruct(name: string): DataStructHandle | null {
    return this.getDataTypeRegister().registerStruct(name);
  }

  /**
   * Register indexed native storage over an existing element definition.
   *
   * @zh 基于已有元素定义注册带索引原生存储。
   * @ja 既存の要素定義に対する添字付きネイティブストレージを登録します。
   * @ko 기존 요소 정의에 대한 인덱스가 있는 네이티브 저장소를 등록합니다.
   * @param name - Runtime schema name.
   * @zh name - 运行时类型名。
   * @ja name - 実行時型名。
   * @ko name - 런타임 유형 이름입니다.
   * @param element - Element definition from this native register.
   * @zh element - 本原生注册表中的元素定义。
   * @ja element - このネイティブレジスターの要素定義。
   * @ko element - 이 네이티브 레지스터의 요소 정의입니다.
   * @returns Array definition, or null for a duplicate name.
   * @zh 数组定义，重名时为 null。
   * @ja 配列定義。同名なら null。
   * @ko 배열 정의이며 중복 이름이면 null입니다.
   */
  registerArray(name: string, element: DataSchema): DataSchema | null {
    return this.getDataTypeRegister().registerArray(name, element);
  }

  /**
   * Register custom native Get/Set/Size/Child/reflection behavior.
   *
   * @zh 注册自定义原生 Get/Set/Size/Child/反射行为。
   * @ja 自作のネイティブ Get/Set/Size/Child/リフレクション動作を登録します。
   * @ko 사용자 정의 네이티브 Get/Set/Size/Child/리플렉션 동작을 등록합니다.
   * @template T - Bound caller payload type.
   * @zh T - 已绑定的调用方数据类型。
   * @ja T - バインドする呼び出し側データ型。
   * @ko T - 바인딩하는 호출자 데이터 유형입니다.
   * @param name - Runtime schema name.
   * @zh name - 运行时类型名。
   * @ja name - 実行時型名。
   * @ko name - 런타임 유형 이름입니다.
   * @param definition - Native callback contract.
   * @zh definition - 原生回调契约。
   * @ja definition - ネイティブコールバック契約。
   * @ko definition - 네이티브 콜백 계약입니다.
   * @returns Definition, or null for a duplicate name.
   * @zh 定义，重名时为 null。
   * @ja 定義。同名なら null。
   * @ko 정의이며 중복 이름이면 null입니다.
   */
  registerCustomDataVariableDefinition<T>(
    name: string, definition: DataCustomDefinition<T>,
  ): DataSchema | null {
    return this.getDataTypeRegister()
      .registerCustomDataVariableDefinition(name, definition);
  }

  /**
   * Bind an alias that re-resolves a checked same-register variable.
   *
   * @zh 绑定别名，每次重新解析同注册表中的受检变量。
   * @ja 同じ型レジスターの検証済み変数を毎回解決する別名をバインドします。
   * @ko 같은 유형 레지스터의 검증된 변수를 매번 다시 확인하는 별칭을 바인딩합니다.
   * @param name - New root name.
   * @zh name - 新根名称。
   * @ja name - 新しいルート名。
   * @ko name - 새 루트 이름입니다.
   * @param variable - Checked target, retained through visible ownership.
   * @zh variable - 受检目标，通过可见所有权保活。
   * @ja variable - 可視の所有関係で保持する検証済みターゲット。
   * @ko variable - 보이는 소유 관계로 유지되는 검증된 대상입니다.
   * @returns Native binding result; duplicates return false.
   * @zh 原生绑定结果，重名时返回 false。
   * @ja ネイティブの結果。同名なら false。
   * @ko 네이티브 결과이며 중복 이름이면 false입니다.
   */
  bindCustomDataVariable(name: string, variable: DataVariable): boolean;

  /**
   * Bind a retained payload through native BindCustomDataVariable.
   *
   * @zh 通过原生 BindCustomDataVariable 绑定保活的数据。
   * @ja ネイティブ BindCustomDataVariable で保持するデータをバインドします。
   * @ko 네이티브 BindCustomDataVariable로 유지되는 데이터를 바인딩합니다.
   * @param name - Bound root name.
   * @zh name - 已绑定根名称。
   * @ja name - バインドするルート名。
   * @ko name - 바인딩하는 루트 이름입니다.
   * @param payload - Original caller data, retained without serialization.
   * @zh payload - 调用方原始数据，保活时不进行序列化。
   * @ja payload - 直列化せず保持する呼び出し側の元データ。
   * @ko payload - 직렬화 없이 유지되는 호출자의 원본 데이터입니다.
   * @param schema - Registered custom VariableDefinition.
   * @zh schema - 已注册自定义 VariableDefinition。
   * @ja schema - 登録済みの自作 VariableDefinition。
   * @ko schema - 등록된 사용자 정의 VariableDefinition입니다.
   * @returns Native binding result.
   * @zh 原生绑定结果。
   * @ja ネイティブバインド結果。
   * @ko 네이티브 바인딩 결과입니다.
   */
  bindCustomDataVariable(
    name: string, payload: unknown, schema: DataSchema,
  ): boolean;

  /**
   * Route payload and alias bindings to native storage.
   *
   * @param name - Bound root name.
   * @param payload - Original payload or checked variable.
   * @param schema - Optional custom definition.
   * @returns Native result.
   * @internal
   */
  bindCustomDataVariable(
    name: string, payload: unknown, schema?: DataSchema,
  ): boolean {
    if (schema === undefined) {
      if (!(payload instanceof DataVariable)) {
        throw new TypeError('A data alias requires a checked DataVariable');
      }
      return native.dataModelBindAlias(this.handle, name, payload.handle);
    }
    if (!schema.isCustom) {
      throw new TypeError('Custom payload binding requires a custom schema');
    }
    return native.dataModelBind(this.handle, name, payload, schema.handle);
  }

  /**
   * Obtain the separate Rml::DataModelHandle facade.
   *
   * @zh 获取独立的 Rml::DataModelHandle 接口。
   * @ja 別の Rml::DataModelHandle ファサードを取得します。
   * @ko 별도의 Rml::DataModelHandle 인터페이스를 얻습니다.
   * @returns Canonical checked model handle.
   * @zh 唯一的受检模型句柄。
   * @ja 正規の検証済みモデルハンドル。
   * @ko 동일성을 유지하는 검증된 모델 핸들입니다.
   */
  getModelHandle(): DataModelHandle {
    let wrapper = handles.get(this.handle);
    if (!wrapper) {
      wrapper = new DataModelHandle(this.handle);
      handles.set(this.handle, wrapper);
    }
    return wrapper;
  }

  /**
   * Bind native-owned storage through BindCustomDataVariable.
   *
   * @zh 通过 BindCustomDataVariable 绑定原生自有存储。
   * @ja BindCustomDataVariable でネイティブ所有のストレージをバインドします。
   * @ko BindCustomDataVariable로 네이티브 소유 저장소를 바인딩합니다.
   * @param name - Root variable name.
   * @zh name - 根变量名。
   * @ja name - ルート変数名。
   * @ko name - 루트 변수 이름입니다.
   * @param value - Initial native storage value.
   * @zh value - 原生存储初始值。
   * @ja value - ネイティブストレージの初期値。
   * @ko value - 네이티브 저장소 초기값입니다.
   * @param schema - Registered type; omit to infer a built-in scalar.
   * @zh schema - 已注册类型，省略时推断内置标量。
   * @ja schema - 登録済みの型。省略すると組み込みスカラーを推論します。
   * @ko schema - 등록된 유형이며 생략하면 내장 스칼라로 추론합니다.
   * @returns Native binding result; false for duplicate or illegal names.
   * @zh 原生绑定结果；重复或非法名称返回 false。
   * @ja バインド結果。重複名や不正な名前では false。
   * @ko 네이티브 바인딩 결과이며 중복 또는 잘못된 이름이면 false입니다.
   */
  bind(name: string, value: DataScalarValue): boolean;

  /**
   * Bind structured native storage using an explicit schema.
   *
   * @zh 使用显式类型定义绑定原生结构化存储。
   * @ja 明示的な型定義でネイティブ構造化ストレージをバインドします。
   * @ko 명시적인 유형 정의로 네이티브 구조화 저장소를 바인딩합니다.
   * @param name - Root variable name.
   * @zh name - 根变量名。
   * @ja name - ルート変数名。
   * @ko name - 루트 변수 이름입니다.
   * @param value - Initial storage value.
   * @zh value - 存储初始值。
   * @ja value - ストレージの初期値。
   * @ko value - 저장소 초기값입니다.
   * @param schema - Definition from this model's register.
   * @zh schema - 本模型注册表中的定义。
   * @ja schema - このモデルのレジスターに属する定義。
   * @ko schema - 이 모델의 레지스터에 속한 정의입니다.
   * @returns Native binding result.
   * @zh 原生绑定结果。
   * @ja ネイティブバインドの結果。
   * @ko 네이티브 바인딩 결과입니다.
   */
  bind(name: string, value: DataStorageValue, schema: DataSchema): boolean;

  /**
   * Delegate storage registration to the native model.
   *
   * @param name - Root name.
   * @param value - Initial value.
   * @param schema - Optional native definition.
   * @returns Native binding result.
   * @internal
   */
  bind(name: string, value: DataStorageValue, schema?: DataSchema): boolean {
    return native.dataModelBind(this.handle, name, value, schema?.handle);
  }

  /**
   * Assign sparse scalar paths and dirty only their successfully changed roots.
   *
   * @zh 写入稀疏标量路径，仅标记成功写入的根变量。
   * @ja スカラーのパスを疎に設定し、設定できたルートだけに変更通知を行います。
   * @ko 스칼라 경로를 희소하게 설정하고 성공적으로 변경된 루트만 표시합니다.
   * @param patches - Native paths, optionally prefixed with "$.".
   * @zh patches - 原生路径，可使用 "$." 前缀。
   * @ja patches - ネイティブパス。接頭辞 "$." は省略可能です。
   * @ko patches - 네이티브 경로이며 "$." 접두사를 선택적으로 사용합니다.
   * @returns Whether every assignment succeeded.
   * @zh 是否每一项赋值都成功。
   * @ja すべての設定が成功したか。
   * @ko 모든 설정의 성공 여부입니다.
   */
  applyPatch(patches: Record<string, DataScalarValue>): boolean {
    return native.dataModelApplyPatch(this.handle, patches);
  }

  /**
   * Bind Rml::DataModelConstructor::BindFunc.
   *
   * @zh 绑定 Rml::DataModelConstructor::BindFunc。
   * @ja Rml::DataModelConstructor::BindFunc をバインドします。
   * @ko Rml::DataModelConstructor::BindFunc를 바인딩합니다.
   * @param name - Root name.
   * @zh name - 根名称。
   * @ja name - ルート名。
   * @ko name - 루트 이름입니다.
   * @param getter - Owned Variant getter.
   * @zh getter - 自有 Variant 读取函数。
   * @ja getter - 所有する Variant の取得関数。
   * @ko getter - 소유 Variant 읽기 함수입니다.
   * @param setter - Optional setter; omitted bindings are read-only.
   * @zh setter - 可选写入函数，省略时为只读绑定。
   * @ja setter - 設定関数。省略すると読み取り専用です。
   * @ko setter - 선택적 쓰기 함수이며 생략하면 읽기 전용입니다.
   * @returns Native binding result.
   * @zh 原生绑定结果。
   * @ja ネイティブバインドの結果。
   * @ko 네이티브 바인딩 결과입니다.
   */
  bindFunc(name: string, getter: DataGetFunc, setter?: DataSetFunc): boolean {
    return native.dataModelBindFunc(this.handle, name,
      () => variantToNative(getter()),
      setter ? value => setter(variantFromNative(value)) : undefined);
  }

  /**
   * Bind Rml::DataModelConstructor::BindEventCallback.
   *
   * @zh 绑定 Rml::DataModelConstructor::BindEventCallback。
   * @ja Rml::DataModelConstructor::BindEventCallback をバインドします。
   * @ko Rml::DataModelConstructor::BindEventCallback을 바인딩합니다.
   * @param name - Expression callback name.
   * @zh name - 表达式回调名称。
   * @ja name - 式内のコールバック名。
   * @ko name - 표현식 콜백 이름입니다.
   * @param callback - Live event callback.
   * @zh callback - 实时事件回调。
   * @ja callback - ライブイベントコールバック。
   * @ko callback - 유효한 이벤트 콜백입니다.
   * @returns Native binding result.
   * @zh 原生绑定结果。
   * @ja ネイティブバインドの結果。
   * @ko 네이티브 바인딩 결과입니다.
   */
  bindEventCallback(name: string, callback: DataEventFunc): boolean {
    return native.dataModelBindEventCallback(this.handle, name,
      (model, event, args) => callback(
        dataModelFromNative(model).getModelHandle(),
        new RmlEvent(event),
        args.map(variantFromNative),
      ));
  }

  /**
   * Register a context-wide Rml::DataModelConstructor::RegisterTransformFunc.
   *
   * @zh 注册上下文共享的 Rml::DataModelConstructor::RegisterTransformFunc。
   * @ja コンテキスト共通の Rml::DataModelConstructor::RegisterTransformFunc を登録します。
   * @ko 컨텍스트 전체의 Rml::DataModelConstructor::RegisterTransformFunc를 등록합니다.
   * @param name - Transform name.
   * @zh name - 变换名称。
   * @ja name - 変換名。
   * @ko name - 변환 이름입니다.
   * @param callback - Native expression argument transform.
   * @zh callback - 原生表达式参数变换。
   * @ja callback - ネイティブ式の引数を変換する関数。
   * @ko callback - 네이티브 표현식 인수 변환 함수입니다.
   */
  registerTransformFunc(name: string, callback: DataTransformFunc): void {
    native.dataModelRegisterTransformFunc(this.handle, name,
      args => variantToNative(callback(args.map(variantFromNative))));
  }

  /**
   * Resolve a native model address string or explicit address entries.
   * String paths may begin with "$."; explicit entries copy both fields.
   *
   * @zh 解析原生模型地址字符串或显式地址项。
   * 字符串可带 "$." 前缀，地址项复制两个字段。
   * @ja 文字列または明示的な要素でモデルアドレスを解決します。
   * 文字列の "$." は省略可能で、要素の両フィールドはコピーされます。
   * @ko 문자열 또는 명시적 항목으로 모델 주소를 찾습니다.
   * 문자열은 "$."로 시작할 수 있으며 항목의 두 필드는 복사됩니다.
   * @param path - Root, member or indexed native address.
   * @zh path - 根、成员或带索引的原生地址。
   * @ja path - ルート、メンバー、または添字付きアドレス。
   * @ko path - 루트, 멤버 또는 인덱스가 있는 네이티브 주소입니다.
   * @returns Checked variable, or null when unresolved.
   * @zh 经校验的变量；无法解析时返回 null。
   * @ja 検証済み変数。解決できなければ null。
   * @ko 검증된 변수이며 찾을 수 없으면 null입니다.
   */
  getVariable(path: string | DataAddress): DataVariable | null {
    const variable = native.dataModelGetVariable(this.handle, path);
    return variable ? new DataVariable(variable) : null;
  }

  /**
   * Snapshot bound native roots through DataModelConstructorAccessor.
   * Variables keep resolving current storage; later roots are absent.
   *
   * @zh 通过 DataModelConstructorAccessor 获取已绑定原生根变量的快照。
   * 变量继续解析当前存储，快照不包含之后绑定的根变量。
   * @ja DataModelConstructorAccessor でバインド済みルートのスナップショットを取得します。
   * 変数は現在の保存場所を解決し続け、後から追加されたルートは含みません。
   * @ko DataModelConstructorAccessor로 바인딩된 네이티브 루트 스냅샷을 조회합니다.
   * 변수는 현재 저장소를 계속 찾으며 나중에 바인딩된 루트는 포함하지 않습니다.
   * @returns Root names mapped to checked variables.
   * @zh 根变量名称到受检变量的映射。
   * @ja ルート名から検証済み変数への対応。
   * @ko 루트 이름과 검증된 변수의 매핑입니다.
   */
  getAllVariables(): Record<string, DataVariable> {
    const roots = native.dataModelGetAllVariables(this.handle);
    return Object.fromEntries(Object.entries(roots)
      .map(([ name, handle ]) => [ name, new DataVariable(handle) ]));
  }

  /**
   * Execute native DataModel::Update; Context.update also performs this step.
   *
   * @zh 执行原生 DataModel::Update；Context.update 也会执行此步骤。
   * @ja ネイティブ DataModel::Update を実行します。Context.update も実行します。
   * @ko 네이티브 DataModel::Update를 실행하며 Context.update도 이 단계를 수행합니다.
   * @param clearDirtyVariables - Clear root dirty marks; defaults to true.
   * @zh clearDirtyVariables - 清除根脏标记，默认为 true。
   * @ja clearDirtyVariables - ルートの変更印を消去します。既定値は true。
   * @ko clearDirtyVariables - 루트 변경 표시를 지우며 기본값은 true입니다.
   * @returns Whether native views changed.
   * @zh 原生视图是否发生变化。
   * @ja ネイティブビューが変更されたか。
   * @ko 네이티브 뷰가 변경되었는지 여부입니다.
   */
  update(clearDirtyVariables = true): boolean {
    return native.dataModelUpdate(this.handle, clearDirtyVariables);
  }
}

/**
 * Create Core's immutable signed 32-bit integer variable.
 * It owns no mutable storage and remains valid across runtime shutdown.
 *
 * @zh 创建 Core 的不可变有符号 32 位整数变量。
 * 常量不持有可变存储，在运行时关闭后仍有效。
 * @ja Core の不変な符号付き 32 ビット整数変数を作成します。
 * 可変ストレージを所有せず、ランタイム終了後も有効です。
 * @ko Core의 불변 부호 있는 32비트 정수 변수를 생성합니다.
 * 변경 가능한 저장소를 소유하지 않으며 런타임 종료 후에도 유효합니다.
 * @param value - Signed 32-bit integer, including zero and negative values.
 * @zh value - 有符号 32 位整数，包含零和负数。
 * @ja value - ゼロと負数を含む符号付き 32 ビット整数。
 * @ko value - 0과 음수를 포함하는 부호 있는 32비트 정수입니다.
 * @returns Immutable native data variable.
 * @zh 不可变的原生数据变量。
 * @ja 不変なネイティブデータ変数。
 * @ko 불변 네이티브 데이터 변수입니다.
 */
export function makeLiteralIntVariable(value: number): DataVariable {
  return new DataVariable(native.makeLiteralIntVariable(value));
}

/**
 * Wrap a native model.
 *
 * @param handle - Checked native lease.
 * @returns Canonical constructor facade.
 * @internal
 */
export function dataModelFromNative(handle: object): DataModelConstructor {
  let wrapper = models.get(handle);
  if (!wrapper) {
    wrapper = new DataModelConstructor(handle);
    models.set(handle, wrapper);
  }
  return wrapper;
}
