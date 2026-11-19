import { native } from '../internal/native';
import { DataVariableType, type DataVariable } from './data-model';
import { customDataCallbacks, type DataCustomDefinition } from './data-custom';
import {
  dataMemberCallbacks, type DataMemberGetter, type DataMemberSetter,
  type DataScalarDefinition,
} from './data-accessors';
import {
  dataTransformsFromNative, type TransformFuncRegister,
} from './data-transforms';

const registers = new WeakMap<object, DataTypeRegister>();
const schemas = new WeakMap<object, DataSchema>();

/**
 * Native scalar types, including every signed and unsigned integer width.
 *
 * @zh 原生标量类型，包含每一种有符号和无符号整数宽度。
 * @ja 符号付きと符号なしの各整数幅を含むネイティブスカラー型。
 * @ko 모든 부호 있는 정수 및 부호 없는 정수 너비를 포함하는 네이티브 스칼라 유형입니다.
 */
export type DataScalarKind = 'bool' | 'int8' | 'uint8' | 'int16' | 'uint16'
| 'int32' | 'uint32' | 'int64' | 'uint64' | 'float32' | 'float64' | 'string';

/**
 * Integer widths supported by checked native enum storage.
 *
 * @zh 受检原生枚举存储支持的整数宽度。
 * @ja 検証済みネイティブ列挙ストレージで使える整数幅。
 * @ko 검증된 네이티브 열거형 저장소에서 지원하는 정수 너비입니다.
 */
export type DataEnumKind = Exclude<DataScalarKind,
'bool' | 'string' | 'float32' | 'float64'>;

/**
 * Shared views of native numeric array storage.
 *
 * @zh 原生数值数组存储的共享视图。
 * @ja ネイティブ数値配列ストレージの共有ビュー。
 * @ko 네이티브 숫자 배열 저장소의 공유 뷰입니다.
 */
export type DataNumericView = Int8Array | Uint8Array | Int16Array | Uint16Array
| Int32Array | Uint32Array | BigInt64Array | BigUint64Array
| Float32Array | Float64Array;

/**
 * Initial native storage values; records and arrays may nest recursively.
 *
 * @zh 原生存储初始值，记录和数组可以递归嵌套。
 * @ja レコードと配列を再帰的に含められるネイティブストレージの初期値。
 * @ko 레코드와 배열을 재귀적으로 중첩할 수 있는 네이티브 저장소 초기값입니다.
 */
export type DataStorageValue = boolean | number | bigint | string
| null | DataVariable
| readonly DataStorageValue[] | DataNumericView | DataStorageRecord;

/**
 * Named initial members of a native record.
 *
 * @zh 原生记录中具名成员的初始值。
 * @ja ネイティブレコードの名前付きメンバーの初期値。
 * @ko 네이티브 레코드의 이름 있는 멤버 초기값입니다.
 */
export interface DataStorageRecord {
  /**
   * Initial value of a registered member.
   *
   * @zh 已注册成员的初始值。
   * @ja 登録されたメンバーの初期値。
   * @ko 등록된 멤버의 초기값입니다.
   */
  readonly [name: string]: DataStorageValue;
}

/**
 * Checked native VariableDefinition, including unregistered variable leases.
 *
 * @zh 受检原生 VariableDefinition，包含未注册变量的租约。
 * @ja 未登録変数のリースを含む検証済みネイティブ VariableDefinition。
 * @ko 미등록 변수 수명 핸들을 포함하는 검증된 네이티브 VariableDefinition입니다.
 */
export class DataDefinition {
  /**
   * Native definition lease.
   *
   * @zh 原生定义租约。
   * @ja ネイティブ定義のリース。
   * @ko 네이티브 정의 수명 핸들입니다.
   * @internal
   */
  readonly handle: object;

  /**
   * Wrap a checked native definition.
   *
   * @zh 包装受检原生定义。
   * @ja 検証済みネイティブ定義をラップします。
   * @ko 검증된 네이티브 정의를 감쌉니다.
   * @param handle - Native definition lease.
   * @zh handle - 原生定义租约。
   * @ja handle - ネイティブ定義のリース。
   * @ko handle - 네이티브 정의 수명 핸들입니다.
   * @internal
   */
  constructor(handle: object) {
    this.handle = handle;
  }

  /**
   * Whether the register or variable owner remains valid.
   *
   * @zh 注册表或变量所有者是否仍有效。
   * @ja レジスターまたは変数の所有者がまだ有効か。
   * @ko 레지스터 또는 변수 소유자가 아직 유효한지 여부입니다.
   * @returns Definition validity.
   * @zh 定义是否有效。
   * @ja 定義の有効性。
   * @ko 정의 유효성입니다.
   */
  get isValid(): boolean {
    return native.dataDefinitionIsValid(this.handle);
  }

  /**
   * Native scalar, array or struct category.
   *
   * @zh 原生标量、数组或结构分类。
   * @ja ネイティブのスカラー、配列または構造の分類。
   * @ko 네이티브 스칼라, 배열 또는 구조 분류입니다.
   * @returns Native variable category.
   * @zh 原生变量分类。
   * @ja ネイティブ変数分類。
   * @ko 네이티브 변수 분류입니다.
   */
  get type(): DataVariableType {
    return native.dataDefinitionType(this.handle);
  }

  /**
   * Invoke native VariableDefinition::ReflectMemberNames.
   * Unregistered definitions resolve the variable path on every operation.
   *
   * @zh 调用原生定义的成员反射；未注册定义每次操作都重新校验变量路径。
   * @ja ネイティブ定義のメンバーを反映します。未登録定義は毎回パスを検証します。
   * @ko 네이티브 정의의 멤버를 조회하며 미등록 정의는 매번 변수 경로를 검증합니다.
   * @returns Reflected member names in native order.
   * @zh 按原生顺序排列的反射成员名称。
   * @ja ネイティブ順序のメンバー名。
   * @ko 네이티브 순서의 멤버 이름입니다.
   */
  reflectMemberNames(): string[] {
    return native.dataDefinitionReflectMembers(this.handle);
  }
}

/**
 * Registered native definition with a real Rml::FamilyId.
 *
 * @zh 使用真实 Rml::FamilyId 注册的原生定义。
 * @ja 実際の Rml::FamilyId で登録されたネイティブ定義。
 * @ko 실제 Rml::FamilyId로 등록된 네이티브 정의입니다.
 */
export class DataSchema extends DataDefinition {
  /**
   * Identity allocated by Rml::FamilyBase, valid only within this runtime.
   *
   * @zh 由 Rml::FamilyBase 分配的标识，仅在本运行时内有效。
   * @ja Rml::FamilyBase が割り当てる、このランタイム内だけで有効な識別子。
   * @ko Rml::FamilyBase가 할당하며 이 런타임 내에서만 유효한 식별자입니다.
   * @returns Native family identity.
   * @zh 原生类型族标识。
   * @ja ネイティブ型ファミリーの識別子。
   * @ko 네이티브 유형 계열 식별자입니다.
   */
  get familyId(): number {
    return native.dataSchemaFamily(this.handle);
  }

  /**
   * Native scalar, array or struct category of this definition.
   *
   * @zh 定义的原生标量、数组或结构分类。
   * @ja 定義のネイティブスカラー、配列または構造の分類。
   * @ko 정의의 네이티브 스칼라, 배열 또는 구조 분류입니다.
   * @returns Native variable category.
   * @zh 原生变量分类。
   * @ja ネイティブ変数分類。
   * @ko 네이티브 변수 분류입니다.
   */
  get type(): DataVariableType {
    return native.dataSchemaType(this.handle);
  }

  /**
   * Whether this definition forwards to a managed nullable target.
   *
   * @zh 定义是否转发到受管理的可空目标。
   * @ja 管理された null 許容の参照先へ転送する定義か。
   * @ko 관리되는 null 허용 대상에 전달하는 정의인지 여부입니다.
   * @returns Managed reference classification.
   * @zh 是否为受管理引用。
   * @ja 管理された参照か。
   * @ko 관리되는 참조인지 여부입니다.
   */
  get isReference(): boolean {
    return native.dataSchemaIsReference(this.handle);
  }

  /**
   * Whether the definition stores checked native enum values.
   *
   * @zh 定义是否存储受检原生枚举值。
   * @ja 検証済みネイティブ列挙値を保存する定義か。
   * @ko 검증된 네이티브 열거형 값을 저장하는 정의인지 여부입니다.
   * @returns Enum classification.
   * @zh 是否为枚举。
   * @ja 列挙型か。
   * @ko 열거형 여부입니다.
   */
  get isEnum(): boolean {
    return native.dataSchemaIsEnum(this.handle);
  }

  /**
   * Whether the definition invokes custom Get/Set/Size/Child/reflection.
   *
   * @zh 定义是否调用自定义 Get/Set/Size/Child/反射回调。
   * @ja 自作の Get/Set/Size/Child/リフレクションを呼び出す定義か。
   * @ko 사용자 정의 Get/Set/Size/Child/리플렉션을 호출하는 정의인지 여부입니다.
   * @returns Custom definition classification.
   * @zh 是否为自定义定义。
   * @ja 自作の定義か。
   * @ko 사용자 정의 여부입니다.
   */
  get isCustom(): boolean {
    return native.dataSchemaIsCustom(this.handle);
  }

  /**
   * Array element or managed reference target definition; otherwise null.
   *
   * @zh 数组元素或受管理引用目标的定义，其他类型返回 null。
   * @ja 配列の要素または管理参照の対象の定義。それ以外は null。
   * @ko 배열 요소 또는 관리되는 참조 대상 정의이며 나머지는 null입니다.
   * @returns Canonical underlying definition.
   * @zh 底层定义的规范包装对象。
   * @ja 正規化された基底定義。
   * @ko 동일성을 유지하는 하위 정의입니다.
   */
  get underlying(): DataSchema | null {
    const handle = native.dataSchemaUnderlying(this.handle);
    return handle ? dataSchemaFromNative(handle) : null;
  }
}

/**
 * Runtime struct registration corresponding to Rml::DataStructHandle.
 *
 * @zh 对应 Rml::DataStructHandle 的运行时结构体注册接口。
 * @ja Rml::DataStructHandle に対応する実行時構造体登録インターフェース。
 * @ko Rml::DataStructHandle에 대응하는 런타임 구조체 등록 인터페이스입니다.
 */
export class DataStructHandle extends DataSchema {
  /**
   * Create a checked handle for a struct definition in the given register.
   * Shares the registered definition without copying or allocating storage.
   *
   * @zh 为指定注册表中的结构定义创建受检句柄，共享定义而不复制或分配存储。
   * @ja 指定レジスターの構造定義の検証済みハンドルを作成し、定義を共有します。
   * @ko 지정된 레지스터의 구조 정의에 대한 검증된 핸들을 만들고 정의를 공유합니다.
   * @param register - Register owning the struct definition.
   * @zh register - 持有结构定义的注册表。
   * @ja register - 構造定義を所有するレジスター。
   * @ko register - 구조 정의를 소유하는 레지스터입니다.
   * @param definition - Registered non-reference, non-custom struct schema.
   * @zh definition - 已注册的非引用、非自定义结构类型。
   * @ja definition - 登録済みで参照でも自作でもない構造スキーマ。
   * @ko definition - 등록된 비참조 및 비사용자 정의 구조 스키마입니다.
   */
  constructor(register: DataTypeRegister, definition: DataSchema);

  /**
   * Wrap an internal canonical native schema lease.
   *
   * @param handle - Native struct schema lease.
   * @internal
   */
  constructor(handle: object);
  constructor(register: DataTypeRegister | object, definition?: DataSchema) {
    super(definition === undefined ? register : native.dataCreateStructHandle(
      (register as DataTypeRegister).handle, definition.handle,
    ));
  }

  /**
   * Add storage or a getter/setter member; schemas freeze at storage creation.
   *
   * @zh 添加具名原生存储成员，创建存储时会冻结类型定义。
   * @ja 名前付きメンバーを追加します。ストレージ作成時に定義は固定されます。
   * @ko 이름 있는 네이티브 저장소 멤버를 추가하며 저장소 생성 시 정의가 고정됩니다.
   * @param name - Reflected member name.
   * @zh name - 用于反射的成员名。
   * @ja name - リフレクションに使うメンバー名。
   * @ko name - 리플렉션에 사용하는 멤버 이름입니다.
   * @param schema - Definition from the same type register.
   * @zh schema - 同一类型注册表中的定义。
   * @ja schema - 同じ型レジスターに属する定義。
   * @ko schema - 동일한 유형 레지스터의 정의입니다.
   * @param getter - Read current parent; return a value or checked reference.
   * @zh getter - 从当前父变量读取，返回值或受检引用。
   * @ja getter - 現在の親から値または検証済み参照を返します。
   * @ko getter - 현재 부모에서 값 또는 검증된 참조를 반환합니다.
   * @param setter - Optional scalar value setter, with native void semantics.
   * @zh setter - 可选的标量值 setter，采用原生 void 语义。
   * @ja setter - 任意のスカラー setter。ネイティブ void の意味です。
   * @ko setter - 선택적 스칼라 setter이며 네이티브 void 의미입니다.
   * @returns False for duplicate member names.
   * @zh 成员名称重复时返回 false。
   * @ja 同名メンバーがある場合は false。
   * @ko 멤버 이름이 중복되면 false입니다.
   */
  registerMember(
    name: string, schema: DataSchema,
    getter?: DataMemberGetter, setter?: DataMemberSetter,
  ): boolean {
    const callbacks = dataMemberCallbacks(schema, getter, setter);
    return native.dataRegisterMember(this.handle, name, schema.handle,
      ...callbacks);
  }
}

/**
 * Rml::DataTypeRegister, owned independently or borrowed from one context.
 *
 * @zh 独立持有或从一个上下文借用的 Rml::DataTypeRegister。
 * @ja 独立所有または一つのコンテキストから借用する Rml::DataTypeRegister。
 * @ko 독립적으로 소유하거나 한 컨텍스트에서 빌리는 Rml::DataTypeRegister입니다.
 */
export class DataTypeRegister {
  /**
   * Native type register lease.
   *
   * @zh 原生类型注册表租约。
   * @ja ネイティブ型レジスターのリース。
   * @ko 네이티브 유형 레지스터 수명 핸들입니다.
   * @internal
   */
  readonly handle: object;

  /**
   * Create an independent native register, or wrap an existing lease.
   *
   * @zh 创建独立原生注册表，或包装已有租约。
   * @ja 独立したネイティブレジスターを作成するか既存リースをラップします。
   * @ko 독립된 네이티브 레지스터를 생성하거나 기존 수명 핸들을 감쌉니다.
   * @param handle - Internal existing lease; omit to create a register.
   * @zh handle - 内部已有租约，省略时创建注册表。
   * @ja handle - 内部の既存リース。省略するとレジスターを作成します。
   * @ko handle - 내부 기존 수명 핸들이며 생략하면 레지스터를 생성합니다.
   */
  constructor(handle?: object) {
    this.handle = handle ?? native.createDataTypeRegister();
    registers.set(this.handle, this);
  }

  /**
   * Whether the register survives in its original runtime generation.
   *
   * @zh 注册表是否仍处于创建时的运行时世代中。
   * @ja レジスターが作成時のランタイム世代で存続しているか。
   * @ko 레지스터가 생성된 런타임 세대에서 존재하는지 여부입니다.
   * @returns Register validity.
   * @zh 注册表是否有效。
   * @ja レジスターの有効性。
   * @ko 레지스터 유효성입니다.
   */
  get isValid(): boolean {
    return native.dataRegisterIsValid(this.handle);
  }

  /**
   * Register a native scalar definition under a runtime name.
   *
   * @zh 用运行时名称注册原生标量定义。
   * @ja 実行時の名前でネイティブスカラー定義を登録します。
   * @ko 런타임 이름으로 네이티브 스칼라 정의를 등록합니다.
   * @template T - Payload type when registering scalar callbacks.
   * @zh T - 注册标量回调时的数据类型。
   * @ja T - スカラーコールバックのデータ型。
   * @ko T - 스칼라 콜백을 등록할 때의 데이터 유형입니다.
   * @param name - Unique schema name.
   * @zh name - 唯一的类型名称。
   * @ja name - 一意の型名。
   * @ko name - 고유한 유형 이름입니다.
   * @param kind - Native storage kind or registered scalar callbacks.
   * @zh kind - 原生存储类型或注册标量回调。
   * @ja kind - ネイティブストレージ型またはスカラーコールバック。
   * @ko kind - 네이티브 저장소 종류 또는 스칼라 콜백입니다.
   * @returns Definition, or null for a duplicate name.
   * @zh 定义，名称重复时返回 null。
   * @ja 定義。同名の定義があれば null。
   * @ko 정의이며 이름이 중복되면 null입니다.
   */
  registerScalar<T>(
    name: string, kind: DataScalarKind | DataScalarDefinition<T>,
  ): DataSchema | null {
    if (typeof kind === 'string') {
      const handle = native.dataRegisterScalar(this.handle, name, kind);
      return handle ? dataSchemaFromNative(handle) : null;
    }
    const { get, set } = kind;
    return this.registerCustomDataVariableDefinition<T>(name, {
      type: DataVariableType.Scalar,
      get: typeof get === 'function' ? payload =>
        ({ success: true, value: get(payload) }) : get,
      set: typeof set === 'function' ? (payload, value) => {
        set(payload, value);
        return true;
      } : set,
    });
  }

  /**
   * Register checked enum storage with a declared underlying integer width.
   *
   * @zh 注册受检枚举存储，并指定底层整数宽度。
   * @ja 基底の整数幅を指定して検証済み列挙ストレージを登録します。
   * @ko 기반 정수 너비를 지정하여 검증된 열거형 저장소를 등록합니다.
   * @param name - Unique runtime schema name.
   * @zh name - 唯一运行时类型名。
   * @ja name - 一意の実行時型名。
   * @ko name - 고유한 런타임 유형 이름입니다.
   * @param kind - Underlying integer type.
   * @zh kind - 底层整数类型。
   * @ja kind - 基底の整数型。
   * @ko kind - 기반 정수 유형입니다.
   * @returns Definition, or null for a duplicate name.
   * @zh 定义，重名时返回 null。
   * @ja 定義。同名なら null。
   * @ko 정의이며 중복 이름이면 null입니다.
   */
  registerEnum(name: string, kind: DataEnumKind): DataSchema | null {
    const handle = native.dataRegisterEnum(this.handle, name, kind);
    return handle ? dataSchemaFromNative(handle) : null;
  }

  /**
   * Register a native VariableDefinition over retained caller payloads.
   *
   * @zh 注册基于保活调用方数据的原生 VariableDefinition。
   * @ja 保持する呼び出し側データ用のネイティブ VariableDefinition を登録します。
   * @ko 유지되는 호출자 데이터를 위한 네이티브 VariableDefinition을 등록합니다.
   * @template T - Bound payload type.
   * @zh T - 已绑定数据类型。
   * @ja T - バインドするデータ型。
   * @ko T - 바인딩하는 데이터 유형입니다.
   * @param name - Unique runtime schema name.
   * @zh name - 唯一运行时类型名。
   * @ja name - 一意の実行時型名。
   * @ko name - 고유한 런타임 유형 이름입니다.
   * @param definition - Native callback contract.
   * @zh definition - 原生回调契约。
   * @ja definition - ネイティブコールバックの契約。
   * @ko definition - 네이티브 콜백 계약입니다.
   * @returns Definition, or null for a duplicate name.
   * @zh 定义，重名时返回 null。
   * @ja 定義。同名なら null。
   * @ko 정의이며 중복 이름이면 null입니다.
   */
  registerCustomDataVariableDefinition<T>(
    name: string, definition: DataCustomDefinition<T>,
  ): DataSchema | null {
    const type = definition.type;
    const callbacks = customDataCallbacks(definition);
    const handle = native.dataRegisterCustom(
      this.handle, name, type, callbacks);
    return handle ? dataSchemaFromNative(handle) : null;
  }

  /**
   * Allocate a native Rml::FamilyId for caller-selected registration.
   * The identity can be reused across registers in this runtime generation.
   *
   * @zh 分配用于指定注册的原生 Rml::FamilyId，可在当前运行时世代的注册表间复用。
   * @ja 登録に使うネイティブ Rml::FamilyId を割り当てます。同じ世代内で共有できます。
   * @ko 등록에 사용할 네이티브 Rml::FamilyId를 할당하며 같은 세대에서 재사용합니다.
   * @returns Native family identity.
   * @zh 原生类型族标识。
   * @ja ネイティブ型ファミリーの識別子。
   * @ko 네이티브 유형 계열 식별자입니다.
   */
  createFamilyId(): number {
    return native.dataRegisterCreateFamilyId(this.handle);
  }

  /**
   * Transfer a custom native definition under a selected Rml::FamilyId.
   * Duplicate identities or names return false without retaining callbacks.
   *
   * @zh 将自定义原生定义转移到指定 Rml::FamilyId；标识或名称重复时返回 false，
   * 并且不会保活回调。
   * @ja 選択した Rml::FamilyId に自作定義を移譲します。重複は false を返し、
   * コールバックを保持しません。
   * @ko 선택한 Rml::FamilyId에 사용자 정의를 이전합니다. 중복은 false를 반환하며
   * 콜백을 유지하지 않습니다.
   * @template T - Payload retained by each bound native storage node.
   * @zh T - 每个已绑定原生存储节点保活的数据。
   * @ja T - バインド済みネイティブノードが保持するデータ。
   * @ko T - 각 바인딩된 네이티브 저장소 노드가 유지하는 데이터입니다.
   * @param familyId - Identity allocated in this runtime generation.
   * @zh familyId - 当前运行时世代分配的标识。
   * @ja familyId - 現在のランタイム世代で割り当てた識別子。
   * @ko familyId - 현재 런타임 세대에서 할당된 식별자입니다.
   * @param name - Unique schema name in this register.
   * @zh name - 本注册表中的唯一类型名称。
   * @ja name - このレジスター内で一意のスキーマ名。
   * @ko name - 이 레지스터에서 고유한 스키마 이름입니다.
   * @param definition - Native adapter callbacks over retained payloads.
   * @zh definition - 基于保活数据的原生适配器回调。
   * @ja definition - 保持されたデータを扱うネイティブアダプターのコールバック。
   * @ko definition - 유지되는 데이터를 처리하는 네이티브 어댑터 콜백입니다.
   * @returns Whether native RegisterDefinition accepted the definition.
   * @zh 原生 RegisterDefinition 是否接受定义。
   * @ja ネイティブ RegisterDefinition が定義を受理したか。
   * @ko 네이티브 RegisterDefinition이 정의를 수락했는지 여부입니다.
   */
  registerDefinition<T>(
    familyId: number, name: string, definition: DataCustomDefinition<T>,
  ): boolean {
    const handle = native.dataRegisterCustom(
      this.handle, name, definition.type,
      customDataCallbacks(definition), familyId,
    );
    return handle !== null;
  }

  /**
   * Register an empty native struct for recursive member declarations.
   *
   * @zh 注册初始为空的原生结构体，以便递归声明成员。
   * @ja 再帰メンバーを宣言できる空のネイティブ構造体を登録します。
   * @ko 재귀 멤버를 선언할 수 있는 빈 네이티브 구조체를 등록합니다.
   * @param name - Unique schema name.
   * @zh name - 唯一的类型名称。
   * @ja name - 一意の型名。
   * @ko name - 고유한 유형 이름입니다.
   * @returns Struct handle, or null for a duplicate name.
   * @zh 结构体句柄，名称重复时返回 null。
   * @ja 構造体ハンドル。同名の定義があれば null。
   * @ko 구조체 핸들이며 이름이 중복되면 null입니다.
   */
  registerStruct(name: string): DataStructHandle | null {
    const handle = native.dataRegisterStruct(this.handle, name);
    return handle ? dataSchemaFromNative(handle) as DataStructHandle : null;
  }

  /**
   * Register an indexed native array of an existing schema.
   *
   * @zh 使用已有类型定义注册可索引原生数组。
   * @ja 既存の型定義から添字付きネイティブ配列を登録します。
   * @ko 기존 유형 정의의 인덱스가 있는 네이티브 배열을 등록합니다.
   * @param name - Unique schema name.
   * @zh name - 唯一的类型名称。
   * @ja name - 一意の型名。
   * @ko name - 고유한 유형 이름입니다.
   * @param element - Element definition from this register.
   * @zh element - 本注册表中的元素定义。
   * @ja element - このレジスターに属する要素定義。
   * @ko element - 이 레지스터의 요소 정의입니다.
   * @returns Array definition, or null for a duplicate name.
   * @zh 数组定义，名称重复时返回 null。
   * @ja 配列定義。同名の定義があれば null。
   * @ko 배열 정의이며 이름이 중복되면 null입니다.
   */
  registerArray(name: string, element: DataSchema): DataSchema | null {
    const handle = native.dataRegisterArray(this.handle, name, element.handle);
    return handle ? dataSchemaFromNative(handle) : null;
  }

  /**
   * Register a nullable reference to a definition from this register.
   * Bind with a DataVariable or null.
   * Core 6.3 disallows pointer-to-pointer types.
   *
   * @zh 注册到本注册表中定义的可空引用，绑定 DataVariable 或 null。
   * Core 6.3 禁止指向指针的指针类型。
   * @ja このレジスターの定義への null 許容参照を登録します。
   * Core 6.3 はポインターへのポインター型を禁止します。
   * @ko 이 레지스터 정의에 대한 null 허용 참조를 등록합니다.
   * Core 6.3은 포인터를 가리키는 포인터 유형을 금지합니다.
   * @param name - Unique schema name.
   * @zh name - 唯一类型名称。
   * @ja name - 一意の型名。
   * @ko name - 고유한 유형 이름입니다.
   * @param target - Registered non-reference target definition.
   * @zh target - 已注册的非引用目标定义。
   * @ja target - 登録済みの参照ではない対象定義。
   * @ko target - 등록된 비참조 대상 정의입니다.
   * @returns Definition, or null for a duplicate name.
   * @zh 定义，重名时返回 null。
   * @ja 定義。同名なら null。
   * @ko 정의이며 중복 이름이면 null입니다.
   */
  registerReference(name: string, target: DataSchema): DataSchema | null {
    const handle = native.dataRegisterReference(
      this.handle, name, target.handle);
    return handle ? dataSchemaFromNative(handle) : null;
  }

  /**
   * Look up a registered native definition by name or family identity.
   *
   * @zh 按名称或类型族标识查询已注册的原生定义。
   * @ja 名前またはファミリー識別子で登録済み定義を検索します。
   * @ko 이름 또는 계열 식별자로 등록된 네이티브 정의를 찾습니다.
   * @param name - Schema name or family identity.
   * @zh name - 类型名称或类型族标识。
   * @ja name - 型名またはファミリー識別子。
   * @ko name - 유형 이름 또는 계열 식별자입니다.
   * @returns Definition, or null when absent.
   * @zh 定义，不存在时返回 null。
   * @ja 定義。存在しなければ null。
   * @ko 정의이며 없으면 null입니다.
   */
  getDefinition(name: string | number): DataSchema | null {
    const handle = native.dataRegisterGetDefinition(this.handle, name);
    return handle ? dataSchemaFromNative(handle) : null;
  }

  /**
   * Rml::DataTypeRegister::GetTransformFuncRegister with its owner lease.
   *
   * @zh Rml::DataTypeRegister::GetTransformFuncRegister，保留本所有者租约。
   * @ja 所有者リースを保持する Rml::DataTypeRegister::GetTransformFuncRegister。
   * @ko Rml::DataTypeRegister::GetTransformFuncRegister이며 소유자를 유지합니다.
   * @returns Shared native transform register.
   * @zh 共享原生变换注册表。
   * @ja 共有するネイティブ変換レジスター。
   * @ko 공유 네이티브 변환 레지스터입니다.
   */
  getTransformFuncRegister(): TransformFuncRegister {
    return dataTransformsFromNative(this.handle);
  }
}

/**
 * Wrap a native type register with stable facade identity.
 *
 * @param handle - Native type register lease.
 * @returns Canonical register.
 * @internal
 */
export function dataRegisterFromNative(handle: object): DataTypeRegister {
  return registers.get(handle) ?? new DataTypeRegister(handle);
}

/**
 * Wrap a native schema with stable facade identity.
 *
 * @param handle - Native definition lease.
 * @returns Canonical schema.
 * @internal
 */
export function dataSchemaFromNative(handle: object): DataSchema {
  let wrapper = schemas.get(handle);
  if (!wrapper) {
    wrapper = native.dataSchemaType(handle) === 2 &&
      !native.dataSchemaIsReference(handle) &&
      !native.dataSchemaIsCustom(handle)
      ? new DataStructHandle(handle) : new DataSchema(handle);
    schemas.set(handle, wrapper);
  }
  return wrapper;
}
