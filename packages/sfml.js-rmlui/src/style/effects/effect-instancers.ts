import { native } from '../../internal/native';
import {
  PropertySpecification, ShorthandType, specificationFromNative,
} from '../properties/property-specification';
import {
  PropertyDefinition, definitionFromNative,
} from '../properties/property-definition';
import {
  PropertyDictionary, propertyDictionaryFromNative, propertyDictionaryHandle,
} from '../properties/property-dictionary';
import { Filter, filterFromNative, filterHandle } from './filter';
import { Decorator, decoratorFromNative, decoratorHandle } from './decorator';
import {
  DecoratorInstancerInterface, decoratorInterfaceFromNative,
  decoratorInterfaceHandle,
} from './decorator-instancer-interface';
import type { ShorthandId } from '../../generated/shorthand-ids';

const decorators = new WeakMap<DecoratorInstancer, object>();
const filters = new WeakMap<FilterInstancer, object>();

/**
 * Synchronous Rml::DecoratorInstancer::InstanceDecorator implementation.
 *
 * @zh Rml::DecoratorInstancer::InstanceDecorator 的同步实现。
 * @ja Rml::DecoratorInstancer::InstanceDecorator の同期実装。
 * @ko Rml::DecoratorInstancer::InstanceDecorator의 동기 구현입니다.
 */
export interface DecoratorInstancerCallback {
  /**
   * Instance a shared decorator using the active stylesheet.
   *
   * @zh 使用活动样式表实例化共享装饰器。
   * @ja 現在のスタイルシートで共有装飾器を生成します。
   * @ko 활성 스타일시트로 공유 장식기를 생성합니다.
   * @param name - Declared decorator type.
   * @zh name - 声明的装饰器类型。
   * @ja name - 宣言された装飾器の種類。
   * @ko name - 선언된 장식기 종류입니다.
   * @param properties - Owned copy with instancer-local property ids.
   * @zh properties - 使用实例器局部属性编号的自有副本。
   * @ja properties - インスタンサー内のプロパティ ID を使う所有コピー。
   * @ko properties - 인스턴서 로컬 속성 ID를 사용하는 소유 사본입니다.
   * @param active - Interface valid only during this callback.
   * @zh active - 仅在此次回调中有效的接口。
   * @ja active - このコールバック中だけ有効なインターフェース。
   * @ko active - 이 콜백 동안만 유효한 인터페이스입니다.
   * @returns Decorator for the same render manager, or null on failure.
   * @zh 属于同一渲染管理器的装饰器；失败时返回 null。
   * @ja 同じ描画管理器に属する装飾器。失敗時は null。
   * @ko 같은 렌더 관리자에 속하는 장식기이며 실패 시 null입니다.
   */
  (
    name: string, properties: PropertyDictionary,
    active: DecoratorInstancerInterface,
  ): Decorator | null;
}

/**
 * Rml::DecoratorInstancer with properties and synchronous JS instancing.
 *
 * @zh 具有属性和同步 JS 实例化回调的 Rml::DecoratorInstancer。
 * @ja プロパティと同期 JS 生成コールバックを持つ Rml::DecoratorInstancer。
 * @ko 속성과 동기 JS 생성 콜백을 가진 Rml::DecoratorInstancer입니다.
 */
export class DecoratorInstancer {
  /** @internal */
  private declare readonly decoratorBrand: void;

  /**
   * Construct a native decorator instancer backed by a synchronous callback.
   *
   * @zh 构造由同步回调实现的原生装饰器实例器。
   * @ja 同期コールバックで実装するネイティブ装飾器インスタンサーを構築します。
   * @ko 동기 콜백으로 구현된 네이티브 장식기 인스턴서를 생성합니다.
   * @param callback - Factory retained until shutdown after registration.
   * @zh callback - 工厂函数；注册后的回调保留至运行时关闭。
   * @ja callback - ファクトリー。登録後は終了まで保持されます。
   * @ko callback - 팩터리이며 등록된 콜백은 종료까지 유지됩니다.
   */
  constructor(callback: DecoratorInstancerCallback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Expected a decorator instancer callback');
    }
    decorators.set(this, native.createDecoratorInstancer(
      (name, properties, active) => {
        const value = callback(name, propertyDictionaryFromNative(properties),
          decoratorInterfaceFromNative(active));
        return value === null ? null : decoratorHandle(value);
      }));
  }

  /**
   * Look up Rml::Factory::GetDecoratorInstancer.
   *
   * @zh 查询 Rml::Factory::GetDecoratorInstancer。
   * @ja Rml::Factory::GetDecoratorInstancer を検索します。
   * @ko Rml::Factory::GetDecoratorInstancer를 조회합니다.
   * @param name - Registered decorator name.
   * @zh name - 注册的装饰器名称。
   * @ja name - 登録済み装飾名。
   * @ko name - 등록된 장식 이름입니다.
   * @returns Generation-checked reference, or null when absent.
   * @zh 检查运行代的引用；不存在时返回 null。
   * @ja 世代を検証する参照。存在しない場合は null。
   * @ko 실행 세대를 검증하는 참조이며 없으면 null입니다.
   */
  static get(name: string): DecoratorInstancer | null {
    return decoratorInstancerFromNative(native.getDecoratorInstancer(name));
  }

  /**
   * Register Rml::Factory::RegisterDecoratorInstancer, replacing the name.
   *
   * @zh 注册 Rml::Factory::RegisterDecoratorInstancer，替换同名注册。
   * @ja 同名の登録を置換する Rml::Factory::RegisterDecoratorInstancer。
   * @ko 같은 이름을 교체하는 Rml::Factory::RegisterDecoratorInstancer입니다.
   * @param name - Name normalized to lowercase by native registration.
   * @zh name - 原生注册时转换为小写的名称。
   * @ja name - ネイティブ登録時に小文字化される名前。
   * @ko name - 네이티브 등록 시 소문자로 변환되는 이름입니다.
   * @param instancer - Checked instancer retained through shutdown.
   * @zh instancer - 保留至运行时关闭后的受检查实例器。
   * @ja instancer - 終了処理後まで保持する検証付きインスタンサー。
   * @ko instancer - 종료 처리 후까지 유지되는 검사된 인스턴서입니다.
   */
  static register(name: string, instancer: DecoratorInstancer): void {
    native.registerDecoratorInstancer(
      name, effectInstancerHandle(instancer, true)!);
  }

  /**
   * Get a read-only specification of the effect’s local properties.
   *
   * @zh 获取效果局部属性的只读规范。
   * @ja 効果のローカルプロパティ仕様を読み取り専用で取得します。
   * @ko 효과의 로컬 속성 명세를 읽기 전용으로 가져옵니다.
   * @returns Generation-checked read-only specification with local ids.
   * @zh 检查运行代的只读规格，使用局部编号。
   * @ja 世代を検証する読み取り専用仕様。ID はローカルです。
   * @ko 실행 세대를 검사하는 로컬 ID의 읽기 전용 명세입니다.
   */
  getPropertySpecification(): PropertySpecification {
    return specificationFromNative(native.decoratorInstancerSpecification(
      effectInstancerHandle(this, true)!));
  }

  /**
   * Expose Rml::EffectSpecification::RegisterProperty for custom instancers.
   *
   * @zh 为自定义实例器暴露 Rml::EffectSpecification::RegisterProperty。
   * @ja カスタム用に Rml::EffectSpecification::RegisterProperty を公開します。
   * @ko 사용자 정의용 Rml::EffectSpecification::RegisterProperty입니다.
   * @param name - Instancer-local property name.
   * @zh name - 实例器局部属性名称。
   * @ja name - インスタンサー内のプロパティ名。
   * @ko name - 인스턴서 로컬 속성 이름입니다.
   * @param defaultValue - RCSS default parsed after addParser.
   * @zh defaultValue - addParser 后解析的 RCSS 默认值。
   * @ja defaultValue - addParser 後に解析する RCSS 既定値。
   * @ko defaultValue - addParser 후 해석할 RCSS 기본값입니다.
   * @returns Definition retaining the native instancer.
   * @zh 保活原生实例器的定义。
   * @ja ネイティブインスタンサーを保持する定義。
   * @ko 네이티브 인스턴서를 유지하는 정의입니다.
   */
  registerProperty(name: string, defaultValue: string): PropertyDefinition {
    return definitionFromNative(native.decoratorInstancerRegisterProperty(
      effectInstancerHandle(this, true)!, name, defaultValue));
  }

  /**
   * Expose Rml::EffectSpecification::RegisterShorthand for custom instancers.
   *
   * @zh 为自定义实例器暴露 Rml::EffectSpecification::RegisterShorthand。
   * @ja カスタム用に Rml::EffectSpecification::RegisterShorthand を公開します。
   * @ko 사용자 정의용 Rml::EffectSpecification::RegisterShorthand입니다.
   * @param name - Shorthand name.
   * @zh name - 简写名称。
   * @ja name - 短縮名。
   * @ko name - 단축 이름입니다.
   * @param properties - Comma-separated property names.
   * @zh properties - 逗号分隔的属性名称。
   * @ja properties - コンマ区切りのプロパティ名。
   * @ko properties - 쉼표로 구분한 속성 이름입니다.
   * @param type - Shorthand interpretation, default FallThrough.
   * @zh type - 简写解释方式，默认 FallThrough。
   * @ja type - 短縮構文の解釈。既定は FallThrough。
   * @ko type - 단축 구문 해석이며 기본값은 FallThrough입니다.
   * @returns Local shorthand id, or zero on failure.
   * @zh 局部简写编号；失败时为零。
   * @ja ローカル短縮 ID。失敗時はゼロ。
   * @ko 로컬 단축 ID이며 실패 시 0입니다.
   */
  registerShorthand(
    name: string, properties: string,
    type: ShorthandType = ShorthandType.FallThrough,
  ): ShorthandId {
    return native.decoratorInstancerRegisterShorthand(
      effectInstancerHandle(this, true)!, name, properties, type);
  }

  /**
   * Invoke Rml::DecoratorInstancer::InstanceDecorator within an active scope.
   *
   * @zh 在活动作用域中调用 Rml::DecoratorInstancer::InstanceDecorator。
   * @ja 有効なスコープで Rml::DecoratorInstancer::InstanceDecorator を呼びます。
   * @ko 활성 범위에서 Rml::DecoratorInstancer::InstanceDecorator를 호출합니다.
   * @param name - Decorator type interpreted by this instancer.
   * @zh name - 此实例器解析的装饰器类型。
   * @ja name - このインスタンサーが解釈する装飾器の種類。
   * @ko name - 이 인스턴서가 해석할 장식기 종류입니다.
   * @param properties - Complete dictionary including required default values.
   * @zh properties - 包含必需默认值的完整字典。
   * @ja properties - 必須の既定値を含む完全な辞書。
   * @ko properties - 필수 기본값을 포함한 완전한 사전입니다.
   * @param active - Current callback's stylesheet interface.
   * @zh active - 当前回调的样式表接口。
   * @ja active - 現在のコールバックのスタイルシートインターフェース。
   * @ko active - 현재 콜백의 스타일시트 인터페이스입니다.
   * @returns Shared decorator, or null if instancing fails.
   * @zh 共享装饰器；实例化失败时返回 null。
   * @ja 共有装飾器。生成失敗時は null。
   * @ko 공유 장식기이며 생성 실패 시 null입니다.
   */
  instanceDecorator(
    name: string, properties: PropertyDictionary,
    active: DecoratorInstancerInterface,
  ): Decorator | null {
    const handle = native.instanceDecorator(effectInstancerHandle(this, true)!,
      name, propertyDictionaryHandle(properties),
      decoratorInterfaceHandle(active));
    return handle === null ? null : decoratorFromNative(handle);
  }
}

/**
 * Synchronous Rml::FilterInstancer::InstanceFilter implementation.
 *
 * @zh Rml::FilterInstancer::InstanceFilter 的同步实现。
 * @ja Rml::FilterInstancer::InstanceFilter の同期実装。
 * @ko Rml::FilterInstancer::InstanceFilter의 동기 구현입니다.
 */
export interface FilterInstancerCallback {
  /**
   * Instance a filter, including delegation to a built-in instancer.
   *
   * @zh 实例化滤镜，可委托内置实例器。
   * @ja 組み込みインスタンサーへの委譲も可能なフィルター生成。
   * @ko 내장 인스턴서로 위임할 수 있는 필터 생성입니다.
   * @param name - Type from the declaration.
   * @zh name - 声明中的类型。
   * @ja name - 宣言内の種類。
   * @ko name - 선언의 종류입니다.
   * @param properties - Owned dictionary copy with instancer-local ids.
   * @zh properties - 使用实例器局部编号的自有字典副本。
   * @ja properties - インスタンサー内の ID を使う所有辞書コピー。
   * @ko properties - 인스턴서 로컬 ID를 사용하는 소유 사전 사본입니다.
   * @returns Owned native filter, or null to reject the declaration.
   * @zh 自有原生滤镜；null 表示拒绝此声明。
   * @ja 所有ネイティブフィルター。宣言を拒否する場合は null。
   * @ko 소유 네이티브 필터이며 선언을 거부하면 null입니다.
   */
  (name: string, properties: PropertyDictionary): Filter | null;
}

/**
 * Rml::FilterInstancer with local properties and a synchronous JS factory.
 *
 * @zh 具有局部属性和同步 JS 工厂的 Rml::FilterInstancer。
 * @ja ローカル属性と同期 JS ファクトリーを持つ Rml::FilterInstancer。
 * @ko 로컬 속성과 동기 JS 팩터리를 가진 Rml::FilterInstancer입니다.
 * @remarks
 * Registered callbacks remain alive through shutdown, including replaced
 * registrations still referenced by parsed declarations. Callbacks may read
 * copied values and delegate to other instancers; recursive instancing,
 * parsing, registration and DOM/runtime mutation throw.
 * @zh 注册的回调保留至关闭，包括仍被已解析声明引用的旧注册。回调可读取值副本并委托
 * 其他实例器；递归实例化、解析、注册和 DOM/运行时变更会抛错。
 * @ja 置換後も既存宣言が参照するため登録済みコールバックは終了まで保持します。
 * 値のコピーと他のインスタンサーへの委譲は可能です。再帰、解析、登録、DOM 変更は例外です。
 * @ko 교체 후 기존 선언이 참조할 수 있어 등록된 콜백은 종료까지 유지됩니다.
 * 값 사본과 다른 인스턴서로의 위임을 허용하며 재귀, 해석, 등록, DOM 변경은 예외입니다.
 */
export class FilterInstancer {
  /** @internal */
  private declare readonly filterBrand: void;

  /**
   * Construct a native filter instancer backed by a synchronous callback.
   *
   * @zh 构造由同步回调实现的原生滤镜实例器。
   * @ja 同期コールバックで実装するネイティブフィルターインスタンサーを構築します。
   * @ko 동기 콜백으로 구현된 네이티브 필터 인스턴서를 생성합니다.
   * @param callback - Filter factory.
   * @zh callback - 滤镜创建函数。
   * @ja callback - フィルター生成関数。
   * @ko callback - 필터 생성 함수입니다.
   */
  constructor(callback: FilterInstancerCallback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Expected a filter instancer callback');
    }
    filters.set(this, native.createFilterInstancer((name, properties) => {
      const filter = callback(name, propertyDictionaryFromNative(properties));
      return filter === null ? null : filterHandle(filter);
    }));
  }

  /**
   * Look up Rml::Factory::GetFilterInstancer.
   *
   * @zh 查询 Rml::Factory::GetFilterInstancer。
   * @ja Rml::Factory::GetFilterInstancer を検索します。
   * @ko Rml::Factory::GetFilterInstancer를 조회합니다.
   * @param name - Registered filter name.
   * @zh name - 注册的滤镜名称。
   * @ja name - 登録済みフィルター名。
   * @ko name - 등록된 필터 이름입니다.
   * @returns Generation-checked reference, or null when absent.
   * @zh 检查运行代的引用；不存在时返回 null。
   * @ja 世代を検証する参照。存在しない場合は null。
   * @ko 실행 세대를 검증하는 참조이며 없으면 null입니다.
   */
  static get(name: string): FilterInstancer | null {
    return filterInstancerFromNative(native.getFilterInstancer(name));
  }

  /**
   * Register Rml::Factory::RegisterFilterInstancer, replacing the name.
   *
   * @zh 注册 Rml::Factory::RegisterFilterInstancer，替换同名注册。
   * @ja 同名の登録を置換する Rml::Factory::RegisterFilterInstancer。
   * @ko 같은 이름을 교체하는 Rml::Factory::RegisterFilterInstancer입니다.
   * @param name - Name normalized to lowercase by native registration.
   * @zh name - 原生注册时转换为小写的名称。
   * @ja name - ネイティブ登録時に小文字化される名前。
   * @ko name - 네이티브 등록 시 소문자로 변환되는 이름입니다.
   * @param instancer - Checked instancer retained through shutdown.
   * @zh instancer - 保留至运行时关闭后的受检查实例器。
   * @ja instancer - 終了処理後まで保持する検証付きインスタンサー。
   * @ko instancer - 종료 처리 후까지 유지되는 검사된 인스턴서입니다.
   */
  static register(name: string, instancer: FilterInstancer): void {
    native.registerFilterInstancer(
      name, effectInstancerHandle(instancer, false)!);
  }

  /**
   * Get a read-only specification of the effect’s local properties.
   *
   * @zh 获取效果局部属性的只读规范。
   * @ja 効果のローカルプロパティ仕様を読み取り専用で取得します。
   * @ko 효과의 로컬 속성 명세를 읽기 전용으로 가져옵니다.
   * @returns Generation-checked read-only specification with local ids.
   * @zh 检查运行代的只读规格，使用局部编号。
   * @ja 世代を検証する読み取り専用仕様。ID はローカルです。
   * @ko 실행 세대를 검사하는 로컬 ID의 읽기 전용 명세입니다.
   */
  getPropertySpecification(): PropertySpecification {
    return specificationFromNative(native.filterInstancerSpecification(
      effectInstancerHandle(this, false)!));
  }

  /**
   * Expose protected Rml::EffectSpecification::RegisterProperty.
   *
   * @zh 暴露受保护的 Rml::EffectSpecification::RegisterProperty。
   * @ja protected の Rml::EffectSpecification::RegisterProperty を公開します。
   * @ko 보호된 Rml::EffectSpecification::RegisterProperty를 노출합니다.
   * @param name - Local property name.
   * @zh name - 局部属性名。
   * @ja name - ローカル属性名。
   * @ko name - 로컬 속성 이름입니다.
   * @param defaultValue - Raw default declaration.
   * @zh defaultValue - 原始默认声明。
   * @ja defaultValue - 未解析の既定宣言。
   * @ko defaultValue - 원시 기본 선언입니다.
   * @returns Mutable definition; repeated names retain the first definition.
   * @zh 可修改定义；重复名称保留首次定义。
   * @ja 変更可能な定義。同名登録は最初の定義を保持します。
   * @ko 수정 가능한 정의이며 중복 이름은 최초 정의를 유지합니다.
   */
  registerProperty(name: string, defaultValue: string): PropertyDefinition {
    return definitionFromNative(native.filterInstancerRegisterProperty(
      effectInstancerHandle(this, false)!, name, defaultValue));
  }

  /**
   * Expose protected Rml::EffectSpecification::RegisterShorthand.
   *
   * @zh 暴露受保护的 Rml::EffectSpecification::RegisterShorthand。
   * @ja protected の Rml::EffectSpecification::RegisterShorthand を公開します。
   * @ko 보호된 Rml::EffectSpecification::RegisterShorthand를 노출합니다.
   * @param name - Use "filter" for anonymous RCSS arguments.
   * @zh name - 匿名 RCSS 参数使用 "filter"。
   * @ja name - 匿名 RCSS 引数には "filter" を使います。
   * @ko name - 익명 RCSS 인수에는 "filter"를 사용합니다.
   * @param properties - Comma-separated property or shorthand names.
   * @zh properties - 逗号分隔的属性或简写名称。
   * @ja properties - カンマ区切りの属性または短縮形名。
   * @ko properties - 쉼표로 구분된 속성 또는 단축 속성 이름입니다.
   * @param type - Native parsing strategy.
   * @zh type - 原生解析策略。
   * @ja type - ネイティブ解析方式。
   * @ko type - 네이티브 해석 방식입니다.
   * @returns Local id, or Invalid for duplicates or missing components.
   * @zh 局部编号；重复或组成项缺失时为 Invalid。
   * @ja ローカル ID。重複または構成項目の欠落時は Invalid。
   * @ko 로컬 ID이며 중복 또는 구성 항목 누락 시 Invalid입니다.
   */
  registerShorthand(
    name: string, properties: string, type: ShorthandType,
  ): ShorthandId {
    return native.filterInstancerRegisterShorthand(
      effectInstancerHandle(this, false)!, name, properties, type);
  }

  /**
   * Invoke Rml::FilterInstancer::InstanceFilter directly.
   *
   * @zh 直接调用 Rml::FilterInstancer::InstanceFilter。
   * @ja Rml::FilterInstancer::InstanceFilter を直接呼びます。
   * @ko Rml::FilterInstancer::InstanceFilter를 직접 호출합니다.
   * @param name - Type passed unchanged to the native instancer.
   * @zh name - 原样传递给原生实例器的类型。
   * @ja name - ネイティブインスタンサーへそのまま渡す種類。
   * @ko name - 네이티브 인스턴서에 그대로 전달할 종류입니다.
   * @param properties - Complete local dictionary; fill defaults first.
   * @zh properties - 完整局部字典，应先填充默认值。
   * @ja properties - 完全なローカル辞書。事前に既定値を補完してください。
   * @ko properties - 완전한 로컬 사전이며 먼저 기본값을 채워야 합니다.
   * @returns Owned native filter, or null if rejected by the instancer.
   * @zh 自有原生滤镜；实例器拒绝时为 null。
   * @ja 所有ネイティブフィルター。インスタンサーが拒否した場合は null。
   * @ko 소유 네이티브 필터이며 인스턴서가 거부하면 null입니다.
   */
  instanceFilter(name: string, properties: PropertyDictionary): Filter | null {
    const handle = native.instanceFilter(effectInstancerHandle(this, false)!,
      name, propertyDictionaryHandle(properties));
    return handle === null ? null : filterFromNative(handle);
  }
}

/**
 * Wrap a native decorator reference.
 *
 * @internal
 * @param handle - Checked native token.
 * @returns Public reference.
 */
export function decoratorInstancerFromNative(handle: object | null):
DecoratorInstancer | null {
  if (handle === null) {
    return null;
  }
  const result = Object.create(DecoratorInstancer.prototype) as
    DecoratorInstancer;
  decorators.set(result, handle);
  return result;
}

/**
 * Wrap a native filter reference.
 *
 * @internal
 * @param handle - Checked native token.
 * @returns Public reference.
 */
export function filterInstancerFromNative(handle: object | null):
FilterInstancer | null {
  if (handle === null) {
    return null;
  }
  const result = Object.create(FilterInstancer.prototype) as FilterInstancer;
  filters.set(result, handle);
  return result;
}

/**
 * Resolve the correctly typed native instancer.
 *
 * @internal
 * @param value - Public reference.
 * @param decorator - Select the decorator registry.
 * @returns Checked token or null.
 */
export function effectInstancerHandle(
  value: DecoratorInstancer | FilterInstancer | null, decorator: boolean,
): object | null {
  if (value === null) {
    return null;
  }
  const handle = decorator ?
    decorators.get(value as DecoratorInstancer) :
    filters.get(value as FilterInstancer);
  if (!handle) {
    throw new TypeError('Expected the matching typed effect instancer');
  }
  return handle;
}
