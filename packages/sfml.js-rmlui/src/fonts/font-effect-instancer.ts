import { native } from '../internal/native';
import {
  FontEffect, fontEffectFromNative, fontEffectHandle,
} from './font-effect';
import {
  PropertyDictionary, propertyDictionaryFromNative, propertyDictionaryHandle,
} from '../style/properties/property-dictionary';
import {
  PropertyDefinition, definitionFromNative,
} from '../style/properties/property-definition';
import {
  PropertySpecification, ShorthandType, specificationFromNative,
} from '../style/properties/property-specification';
import type { ShorthandId } from '../generated/shorthand-ids';

const instancers = new WeakMap<FontEffectInstancer, object>();

/**
 * Synchronous Rml::FontEffectInstancer::InstanceFontEffect implementation.
 *
 * @zh Rml::FontEffectInstancer::InstanceFontEffect 的同步实现。
 * @ja Rml::FontEffectInstancer::InstanceFontEffect の同期実装。
 * @ko Rml::FontEffectInstancer::InstanceFontEffect의 동기 구현입니다.
 */
export interface FontEffectInstancerCallback {
  /**
   * Construct a font effect from a native declaration.
   *
   * @zh 从原生声明构造字体效果。
   * @ja ネイティブ宣言からフォント効果を構築します。
   * @ko 네이티브 선언에서 글꼴 효과를 생성합니다.
   * @param name - Effect type from the declaration.
   * @zh name - 声明中的效果类型。
   * @ja name - 宣言内の効果の種類。
   * @ko name - 선언에 있는 효과 종류입니다.
   * @param properties - Owned dictionary copy using instancer-local ids.
   * @zh properties - 使用实例器局部编号的自有字典副本。
   * @ja properties - インスタンサー内の ID を使う所有辞書コピー。
   * @ko properties - 인스턴서 로컬 ID를 사용하는 소유 사전 사본입니다.
   * @returns Effect snapshot, or null to decline instancing.
   * @zh 效果快照；返回 null 表示创建失败。
   * @ja 効果のスナップショット。生成を拒否する場合は null。
   * @ko 효과 스냅샷이며 생성을 거부하면 null입니다.
   */
  (name: string, properties: PropertyDictionary): FontEffect | null;
}

/**
 * Native font effect factory with local properties and a JS callback.
 *
 * @zh 使用局部属性及 JS 回调的原生字体效果工厂。
 * @ja ローカル属性と JS コールバックを使うネイティブフォント効果ファクトリー。
 * @ko 로컬 속성과 JS 콜백을 사용하는 네이티브 글꼴 효과 팩터리입니다.
 * @remarks
 * Registration retains the callback through shutdown, even after replacement.
 * Callbacks may use copied properties, dictionaries and font effects, and
 * delegate to another instancer. Recursive instancing, parsing, registration
 * and DOM/runtime mutation throw. Exceptions propagate at the outer boundary.
 * @zh 注册使回调保留至关闭，即使注册已被替换。回调可操作属性副本、字典和字体效果，
 * 并委托其他实例器。递归实例化、解析、注册及 DOM/运行时变更会抛错。
 * 异常在最外层边界传播。
 * @ja 登録は置換後も終了までコールバックを保持します。属性コピー、辞書、フォント効果の
 * 操作と他のインスタンサーへの委譲は可能です。再帰、解析、登録、DOM 変更は例外です。
 * 例外は最外の境界で伝播します。
 * @ko 등록은 교체 후에도 종료까지 콜백을 유지합니다. 속성 사본, 사전, 글꼴 효과의
 * 조작과 다른 인스턴서로의 위임을 허용합니다. 재귀, 해석, 등록, DOM 변경은 예외입니다.
 * 예외는 최외곽 경계에서 전달됩니다.
 */
export class FontEffectInstancer {
  /**
   * Create a native instancer backed by a synchronous callback.
   *
   * @zh 创建由同步回调实现的原生实例器。
   * @ja 同期コールバックで実装するネイティブインスタンサーを生成します。
   * @ko 동기 콜백으로 구현된 네이티브 인스턴서를 생성합니다.
   * @param callback - Effect factory.
   * @zh callback - 效果创建函数。
   * @ja callback - 効果生成関数。
   * @ko callback - 효과 생성 함수입니다.
   */
  constructor(callback: FontEffectInstancerCallback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Expected a font effect instancer callback');
    }
    const handle = native.createFontEffectInstancer((name, properties) => {
      const effect = callback(name, propertyDictionaryFromNative(properties));
      return effect === null ? null : fontEffectHandle(effect);
    });
    instancers.set(this, handle);
  }

  /**
   * Look up Rml::Factory::GetFontEffectInstancer.
   *
   * @zh 查询 Rml::Factory::GetFontEffectInstancer。
   * @ja Rml::Factory::GetFontEffectInstancer を検索します。
   * @ko Rml::Factory::GetFontEffectInstancer를 조회합니다.
   * @param name - Exact registered lowercase name.
   * @zh name - 注册的小写名称，按原样查询。
   * @ja name - 登録済みの小文字の名前をそのまま検索します。
   * @ko name - 등록된 소문자 이름 그대로 조회합니다.
   * @returns Checked instancer or null when absent.
   * @zh 受检查的实例器；不存在时为 null。
   * @ja 検証付きインスタンサー。存在しなければ null。
   * @ko 검사된 인스턴서이며 없으면 null입니다.
   */
  static get(name: string): FontEffectInstancer | null {
    const handle = native.getFontEffectInstancer(name);
    if (handle === null) {
      return null;
    }
    const result = Object.create(FontEffectInstancer.prototype) as
      FontEffectInstancer;
    instancers.set(result, handle);
    return result;
  }

  /**
   * Rml::Factory::RegisterFontEffectInstancer, replacing an existing name.
   *
   * @zh Rml::Factory::RegisterFontEffectInstancer，替换同名注册。
   * @ja 同名登録を置換する Rml::Factory::RegisterFontEffectInstancer。
   * @ko 같은 이름을 교체하는 Rml::Factory::RegisterFontEffectInstancer입니다.
   * @param name - Name normalized to lowercase by native registration.
   * @zh name - 原生注册时转换为小写的名称。
   * @ja name - ネイティブ登録時に小文字化される名前。
   * @ko name - 네이티브 등록 시 소문자로 변환되는 이름입니다.
   * @param instancer - Factory retained through shutdown.
   * @zh instancer - 保留至运行时关闭后的工厂。
   * @ja instancer - 終了処理後まで保持されるファクトリー。
   * @ko instancer - 종료 처리 후까지 유지되는 팩터리입니다.
   */
  static register(name: string, instancer: FontEffectInstancer): void {
    native.registerFontEffectInstancer(name, instancerHandle(instancer));
  }

  /**
   * Get the read-only property specification used to instantiate font effects.
   *
   * @zh 获取创建字体效果所用的只读属性规范。
   * @ja フォント効果の生成に使う読み取り専用プロパティ仕様を取得します。
   * @ko 글꼴 효과 생성에 사용하는 읽기 전용 속성 명세를 가져옵니다.
   * @returns Read-only specification; definitions retain their instancer.
   * @zh 只读规格；定义会保留所属实例器。
   * @ja 読み取り専用仕様。定義は所属インスタンサーを保持します。
   * @ko 읽기 전용 명세이며 정의는 소유 인스턴서를 유지합니다.
   */
  getPropertySpecification(): PropertySpecification {
    return specificationFromNative(native.fontEffectInstancerSpecification(
      instancerHandle(this)));
  }

  /**
   * Expose protected Rml::FontEffectInstancer::RegisterProperty.
   *
   * @zh 暴露受保护的 Rml::FontEffectInstancer::RegisterProperty。
   * @ja protected の Rml::FontEffectInstancer::RegisterProperty を公開します。
   * @ko 보호된 Rml::FontEffectInstancer::RegisterProperty를 노출합니다.
   * @param name - Local property name.
   * @zh name - 局部属性名。
   * @ja name - ローカル属性名。
   * @ko name - 로컬 속성 이름입니다.
   * @param defaultValue - Raw default declaration.
   * @zh defaultValue - 原始默认声明。
   * @ja defaultValue - 未解析の既定宣言。
   * @ko defaultValue - 원시 기본 선언입니다.
   * @param affectsGeneration - Native generation flag; defaults to true.
   * @zh affectsGeneration - 原生生成标记，默认为 true。
   * @ja affectsGeneration - ネイティブ生成フラグ。既定は true。
   * @ko affectsGeneration - 네이티브 생성 플래그이며 기본값은 true입니다.
   * @returns Mutable definition; duplicate names keep the first definition.
   * @zh 可修改定义；同名注册保留首次定义。
   * @ja 変更可能な定義。同名登録は最初の定義を保持します。
   * @ko 수정 가능한 정의이며 중복 이름은 최초 정의를 유지합니다.
   */
  registerProperty(
    name: string, defaultValue: string, affectsGeneration = true,
  ): PropertyDefinition {
    return definitionFromNative(native.fontEffectInstancerRegisterProperty(
      instancerHandle(this), name, defaultValue, affectsGeneration));
  }

  /**
   * Expose protected Rml::FontEffectInstancer::RegisterShorthand.
   *
   * @zh 暴露受保护的 Rml::FontEffectInstancer::RegisterShorthand。
   * @ja protected の Rml::FontEffectInstancer::RegisterShorthand を公開します。
   * @ko 보호된 Rml::FontEffectInstancer::RegisterShorthand를 노출합니다.
   * @param name - Use "font-effect" for anonymous RCSS arguments.
   * @zh name - 匿名 RCSS 参数使用 "font-effect"。
   * @ja name - 匿名 RCSS 引数には "font-effect" を使います。
   * @ko name - 익명 RCSS 인수에는 "font-effect"를 사용합니다.
   * @param properties - Comma-separated property or shorthand names.
   * @zh properties - 逗号分隔的属性或简写名称。
   * @ja properties - カンマ区切りの属性または短縮形の名前。
   * @ko properties - 쉼표로 구분된 속성 또는 단축 속성 이름입니다.
   * @param type - Native parsing strategy.
   * @zh type - 原生解析策略。
   * @ja type - ネイティブ解析方式。
   * @ko type - 네이티브 해석 방식입니다.
   * @returns Local id, or Invalid for duplicate or missing components.
   * @zh 局部编号；重复或组成项缺失时为 Invalid。
   * @ja ローカル ID。重複または構成項目の欠落時は Invalid。
   * @ko 로컬 ID이며 중복 또는 구성 항목 누락 시 Invalid입니다.
   */
  registerShorthand(
    name: string, properties: string, type: ShorthandType,
  ): ShorthandId {
    return native.fontEffectInstancerRegisterShorthand(
      instancerHandle(this), name, properties, type);
  }

  /**
   * Invoke Rml::FontEffectInstancer::InstanceFontEffect directly.
   *
   * @zh 直接调用 Rml::FontEffectInstancer::InstanceFontEffect。
   * @ja Rml::FontEffectInstancer::InstanceFontEffect を直接呼びます。
   * @ko Rml::FontEffectInstancer::InstanceFontEffect를 직접 호출합니다.
   * @param name - Type passed unchanged to the instancer.
   * @zh name - 原样传递给实例器的类型。
   * @ja name - インスタンサーにそのまま渡す種類。
   * @ko name - 인스턴서에 그대로 전달할 종류입니다.
   * @param properties - Complete local properties; fill defaults first.
   * @zh properties - 完整局部属性；应先填充默认值。
   * @ja properties - 完全なローカル属性。事前に既定値を補完してください。
   * @ko properties - 완전한 로컬 속성이며 먼저 기본값을 채워야 합니다.
   * @returns Effect or null; does not apply the RCSS parser's fingerprint.
   * @zh 效果或 null；不应用 RCSS 解析器的指纹计算。
   * @ja 効果または null。RCSS 解析器の指紋計算は行いません。
   * @ko 효과 또는 null이며 RCSS 해석기의 지문 계산은 적용하지 않습니다.
   */
  instanceFontEffect(
    name: string, properties: PropertyDictionary,
  ): FontEffect | null {
    const handle = native.instanceFontEffect(instancerHandle(this),
      name, propertyDictionaryHandle(properties));
    return handle === null ? null : fontEffectFromNative(handle);
  }
}

/**
 * Resolve the checked native instancer.
 *
 * @internal
 * @param value - Public instancer.
 * @returns Native token.
 */
function instancerHandle(value: FontEffectInstancer): object {
  const handle = instancers.get(value);
  if (!handle) {
    throw new TypeError('Expected a font effect instancer');
  }
  return handle;
}
