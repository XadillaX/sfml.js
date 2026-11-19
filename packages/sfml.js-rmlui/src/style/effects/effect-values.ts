import { native, type NativeProperty } from '../../internal/native';
import {
  propertyFromNative, propertyHandle, type Property,
} from '../properties/property';
import { BoxArea } from '../../dom/elements/layout';
import type { VariantColour } from '../../values/types';
import {
  FontEffect, fontEffectFromNative, fontEffectHandle,
} from '../../fonts/font-effect';
import {
  type DecoratorInstancer, type FilterInstancer,
  decoratorInstancerFromNative, filterInstancerFromNative,
  effectInstancerHandle,
} from './effect-instancers';

/** @internal */
export type EffectType = 'decorators' | 'filters' | 'fonteffects';

/** @internal */
export interface NativeEffectValue {
  readonly type: EffectType;
  readonly effectHandle: object;
}

/** @internal */
export interface NativeEffectFields {
  value: string;
  isNull: boolean;
  list: object[];
}

/** @internal */
interface NativeEffectDeclaration {
  type: string;
  instancer: object | null;
  properties: { id: number; name: string; property: NativeProperty }[];
}

/** @internal */
interface NativeDecoratorDeclaration extends NativeEffectDeclaration {
  isNamed: boolean;
  paintArea: BoxArea;
}

const owners = new WeakMap<object, NativeEffectValue>();

/**
 * A copied property in an effect instancer's local specification.
 *
 * @zh 效果实例器局部规范中的属性副本。
 * @ja エフェクト生成器のローカル仕様にある属性のコピー。
 * @ko 효과 생성기의 로컬 명세에 있는 속성 복사본입니다.
 */
export interface EffectProperty {
  /**
   * Instancer-local property ID; not a global PropertyId.
   *
   * @zh 实例器局部属性编号，不是全局 PropertyId。
   * @ja 生成器内の属性番号。グローバル PropertyId ではありません。
   * @ko 생성기 내부 속성 번호이며 전역 PropertyId가 아닙니다.
   */
  id: number;

  /**
   * Name resolved through the effect's PropertySpecification.
   *
   * @zh 通过效果的 PropertySpecification 解析的名称。
   * @ja エフェクトの PropertySpecification で解決する名前。
   * @ko 효과의 PropertySpecification으로 해석한 이름입니다.
   */
  name: string;

  /**
   * Owned property copy; editing it does not change the declaration.
   *
   * @zh 自有属性副本；修改副本不会改变声明。
   * @ja 所有する属性コピー。編集しても宣言は変わりません。
   * @ko 소유 속성 복사본이며 수정해도 선언은 바뀌지 않습니다.
   */
  property: Property;
}

/**
 * Writable Rml::FilterDeclaration record, copied when assigned to a list.
 *
 * @zh 可写的 Rml::FilterDeclaration 记录，赋给列表时复制。
 * @ja 書き込み可能な Rml::FilterDeclaration。リスト代入時にコピーします。
 * @ko 수정 가능한 Rml::FilterDeclaration이며 목록 대입 시 복사합니다.
 */
export class FilterDeclaration {
  /**
   * Registered effect type, also the instancer's registry key.
   *
   * @zh 注册的效果类型，同时是实例器的注册键。
   * @ja 登録された効果型。生成器の登録キーでもあります。
   * @ko 등록된 효과 유형이며 생성기의 레지스트리 키이기도 합니다.
   */
  type: string;

  /**
   * Instancer-local properties; RCSS parsing includes upstream defaults.
   *
   * @zh 实例器局部属性；RCSS 解析结果包含上游默认值。
   * @ja 生成器内の属性。RCSS の解析結果には上流の既定値を含みます。
   * @ko 생성기 내부 속성이며 RCSS 해석 결과에는 업스트림 기본값을 포함합니다.
   */
  properties: EffectProperty[];

  /**
   * Typed instancer; a usable filter declaration requires a non-null reference.
   *
   * @zh 类型化实例器；可使用的滤镜声明要求非空引用。
   * @ja 型付き生成器。有効なフィルター宣言では非 null 参照が必要です。
   * @ko 형식이 있는 생성기이며 유효한 필터 선언은 null이 아닌 참조가 필요합니다.
   */
  instancer: FilterInstancer | null;

  /**
   * Create an empty declaration record.
   *
   * @zh 创建空声明记录。
   * @ja 空の宣言レコードを作成します。
   * @ko 빈 선언 레코드를 만듭니다.
   */
  constructor() {
    this.type = '';
    this.properties = [];
    this.instancer = null;
  }
}

/**
 * Writable Rml::DecoratorDeclaration record, copied when assigned to a list.
 *
 * @zh 可写的 Rml::DecoratorDeclaration 记录，赋给列表时复制。
 * @ja 書き込み可能な Rml::DecoratorDeclaration。リスト代入時にコピーします。
 * @ko 수정 가능한 Rml::DecoratorDeclaration이며 목록 대입 시 복사합니다.
 */
export class DecoratorDeclaration {
  /**
   * Effect type or named decorator reference.
   *
   * @zh 效果类型或命名装饰器引用。
   * @ja 効果型または名前付き装飾への参照。
   * @ko 효과 유형 또는 명명된 장식 참조입니다.
   */
  type: string;

  /**
   * Instancer-local property copies.
   *
   * @zh 实例器局部属性副本。
   * @ja 生成器内の属性コピー。
   * @ko 생성기 내부 속성 복사본입니다.
   */
  properties: EffectProperty[];

  /**
   * Typed instancer, or null for a named decorator.
   *
   * @zh 类型化实例器；命名装饰器为 null。
   * @ja 型付き生成器。名前付き装飾では null。
   * @ko 형식이 있는 생성기이며 명명된 장식은 null입니다.
   */
  instancer: DecoratorInstancer | null;

  /**
   * True for a named `@decorator` reference, whose instancer resolves later.
   *
   * @zh 命名 `@decorator` 引用为 true，其实例器稍后解析。
   * @ja 後で生成器を解決する名前付き `@decorator` 参照なら true。
   * @ko 생성기를 나중에 해석하는 명명된 `@decorator` 참조이면 true입니다.
   * @returns Whether the instancer is null.
   * @zh 实例器是否为空。
   * @ja 生成器が null かどうか。
   * @ko 생성기가 null인지 여부입니다.
   */
  get isNamed(): boolean {
    return this.instancer === null;
  }

  /**
   * Native paint area, including Auto when no area was specified.
   *
   * @zh 原生绘制区域，未指定时为 Auto。
   * @ja 描画領域。指定がない場合は Auto。
   * @ko 네이티브 그리기 영역이며 미지정 시 Auto입니다.
   */
  paintArea: BoxArea;

  /**
   * Create an empty named-decorator record with Auto paint area.
   *
   * @zh 创建绘制区域为 Auto 的空命名装饰器记录。
   * @ja 描画領域 Auto の空の名前付き装飾レコードを作成します。
   * @ko 그리기 영역이 Auto인 빈 명명된 장식 레코드를 만듭니다.
   */
  constructor() {
    this.type = '';
    this.properties = [];
    this.instancer = null;
    this.paintArea = BoxArea.Auto;
  }
}

/**
 * Choose whether a font effect is rendered behind or in front of the text.
 *
 * @zh 字体效果的绘制层级。
 * @ja フォント効果の描画レイヤー。
 * @ko 글꼴 효과를 텍스트 뒤 또는 앞에 렌더링할지 선택합니다.
 */
export enum FontEffectLayer {
  /**
   * Behind the main text.
   *
   * @zh 主文本后方。
   * @ja 本文の背面。
   * @ko 기본 텍스트 뒤입니다.
   */
  Back = 0,
  /**
   * In front of the main text.
   *
   * @zh 主文本前方。
   * @ja 本文の前面。
   * @ko 기본 텍스트 앞입니다.
   */
  Front = 1,
}

/**
 * Metadata fields exposed by a native FontEffect wrapper.
 *
 * @zh 原生 FontEffect 包装器公开的元数据字段。
 * @ja ネイティブ FontEffect ラッパーが公開するメタデータ。
 * @ko 네이티브 FontEffect 래퍼가 노출하는 메타데이터 필드입니다.
 */
export interface FontEffectSnapshot {
  /**
   * Result of Rml::FontEffect::HasUniqueTexture.
   *
   * @zh Rml::FontEffect::HasUniqueTexture 的结果。
   * @ja Rml::FontEffect::HasUniqueTexture の結果。
   * @ko Rml::FontEffect::HasUniqueTexture 결과입니다.
   */
  hasUniqueTexture: boolean;

  /**
   * Unpremultiplied geometry colour returned by GetColour.
   *
   * @zh GetColour 返回的非预乘几何颜色。
   * @ja GetColour が返す非乗算済みのジオメトリ色。
   * @ko GetColour이 반환하는 비선곱 지오메트리 색상입니다.
   */
  colour: VariantColour;

  /**
   * Layer returned by GetLayer; lists preserve native back/front ordering.
   *
   * @zh GetLayer 返回的层；列表保留原生前后层顺序。
   * @ja GetLayer の層。リストはネイティブの背面／前面順を保持します。
   * @ko GetLayer의 레이어이며 목록은 네이티브 뒤/앞 순서를 보존합니다.
   */
  layer: FontEffectLayer;

  /**
   * Exact native size_t fingerprint returned by GetFingerprint.
   *
   * @zh GetFingerprint 返回的精确原生 size_t 指纹。
   * @ja GetFingerprint が返す正確な size_t フィンガープリント。
   * @ko GetFingerprint가 반환하는 정확한 size_t 지문입니다.
   */
  fingerprint: bigint;
}

/**
 * Look up the checked native owner without trusting structural lookalikes.
 *
 * @internal
 * @param value - Public wrapper.
 * @returns Tagged native owner.
 */
export function effectValueToNative(value: object): NativeEffectValue {
  const owner = owners.get(value);
  if (!owner) {
    throw new TypeError('Expected an owned effect list');
  }
  return owner;
}

/**
 * Read copied native metadata.
 *
 * @internal
 * @param value - Public wrapper.
 * @param field - Requested metadata field.
 * @returns Independent metadata.
 */
function read<Field extends keyof NativeEffectFields>(
  value: object, field: Field,
): NativeEffectFields[Field] {
  return native.readEffectList(effectValueToNative(value).effectHandle, field);
}

/**
 * Wrap owned property copies in parsed declarations.
 *
 * @internal
 * @param value - Native declaration.
 * @returns Public declaration.
 */
function declaration(value: NativeEffectDeclaration):
DecoratorDeclaration | FilterDeclaration {
  const result = 'paintArea' in value ?
    Object.assign(new DecoratorDeclaration(), {
      paintArea: value.paintArea as BoxArea,
      instancer: decoratorInstancerFromNative(value.instancer),
    }) :
    Object.assign(new FilterDeclaration(), {
      instancer: filterInstancerFromNative(value.instancer),
    });
  result.type = value.type;
  result.properties = value.properties.map(entry => ({
    ...entry, property: propertyFromNative(entry.property),
  }));
  return result;
}

/**
 * Snapshot writable records into validated native input.
 *
 * @internal
 * @param values - Declaration records.
 * @param decorator - Whether records describe decorators.
 * @returns Native input records.
 */
function declarationsToNative(
  values: readonly (DecoratorDeclaration | FilterDeclaration)[],
  decorator: boolean,
): unknown[] {
  if (!Array.isArray(values)) {
    throw new TypeError('Expected an effect declaration array');
  }
  return values.map((value: DecoratorDeclaration | FilterDeclaration) => ({
    type: value.type,
    instancer: effectInstancerHandle(value.instancer, decorator),
    paintArea: decorator ?
      (value as DecoratorDeclaration).paintArea : undefined,
    properties: value.properties.map(entry => ({
      id: entry.id, property: propertyHandle(entry.property),
    })),
  }));
}

/**
 * Generation-owned Rml::DecoratorsPtr, preserving shared resource identity.
 *
 * @zh 检查运行代的 Rml::DecoratorsPtr，保留共享资源身份。
 * @ja 共有リソースの同一性を保持する世代所有の Rml::DecoratorsPtr。
 * @ko 공유 리소스 동일성을 보존하는 실행 세대 소유 Rml::DecoratorsPtr입니다.
 * @remarks
 * Setting value changes only text; setting list copies declarations. Each
 * write creates a new shared list and preserves existing Property snapshots.
 * Writing to null creates storage. Instancers and all required properties
 * must be valid; copy parsed declarations to obtain native defaults.
 * @zh value 写入仅改变文本，list 写入复制声明。每次写入创建新列表并保留旧属性快照。
 * 空指针写入会创建存储。实例器和必需属性必须有效，可复制解析结果取得原生默认值。
 * @ja value は文字列のみ変更し、list は宣言をコピーします。代入は新しいリストを
 * 作り、既存の属性を保持します。null には領域を確保します。有効な生成器と
 * 必須属性が必要です。解析済み宣言をコピーすると既定値が得られます。
 * @ko value는 텍스트만 바꾸고 list는 선언을 복사합니다. 대입은 새 목록을 만들고
 * 기존 속성을 유지합니다. null은 저장소를 만듭니다. 유효한 생성기와 필수 속성이
 * 필요하며 해석된 선언을 복사하면 네이티브 기본값을 얻습니다.
 */
export class DecoratorList {
  /**
   * Parse RCSS or copy declaration records; empty text or "none" creates null.
   *
   * @zh 解析 RCSS 或复制声明记录；空文本或 "none" 创建空指针。
   * @ja RCSS の解析または宣言のコピー。空文字列と "none" は null。
   * @ko RCSS를 해석하거나 선언을 복사하며 빈 텍스트와 "none"은 null입니다.
   * @param value - RCSS text or complete declaration records.
   * @zh value - RCSS 文本或完整声明记录。
   * @ja value - RCSS 文字列または完全な宣言レコード。
   * @ko value - RCSS 텍스트 또는 완전한 선언 레코드입니다.
   * @param text - Metadata text for programmatic declarations.
   * @zh text - 程序化声明的元数据文本。
   * @ja text - プログラムで作成する宣言のメタデータ文字列。
   * @ko text - 프로그래밍 방식 선언의 메타데이터 텍스트입니다.
   */
  constructor(
    value: string | readonly DecoratorDeclaration[] = 'none', text = '',
  ) {
    owners.set(this, Array.isArray(value) ?
      native.createEffectList(
        'decorators', declarationsToNative(value, true), text) :
      native.parseEffectList('decorators', value as string));
  }

  /**
   * Stored declaration text, or empty for a null pointer.
   *
   * @zh 保存的声明文本，空指针返回空字符串。
   * @ja 保存された宣言テキスト。null ポインターなら空文字列。
   * @ko 저장된 선언 텍스트이며 null 포인터이면 빈 문자열입니다.
   * @returns Native value string.
   * @zh 原生 value 字符串。
   * @ja ネイティブ value 文字列。
   * @ko 네이티브 value 문자열입니다.
   */
  get value(): string {
    return read(this, 'value');
  }

  /**
   * Copy the decorator list and replace its text without reparsing.
   *
   * @zh 复制装饰器列表并替换文本，不重新解析。
   * @ja 装飾リストをコピーし、再解析せず文字列を置換します。
   * @ko 장식 목록을 복사하고 다시 해석하지 않고 텍스트를 교체합니다.
   * @param value - New native value string.
   * @zh value - 新的原生 value 字符串。
   * @ja value - 新しいネイティブ value 文字列。
   * @ko value - 새 네이티브 value 문자열입니다.
   */
  set value(value: string) {
    native.writeEffectList(
      effectValueToNative(this).effectHandle, 'value', value);
  }

  /**
   * Whether the native shared pointer is null.
   *
   * @zh 原生共享指针是否为空。
   * @ja ネイティブ共有ポインターが null かどうか。
   * @ko 네이티브 공유 포인터가 null인지 여부입니다.
   * @returns Null-pointer status.
   * @zh 空指针状态。
   * @ja null ポインターの状態。
   * @ko null 포인터 상태입니다.
   */
  get isNull(): boolean {
    return read(this, 'isNull');
  }

  /**
   * Copied declarations in native order.
   *
   * @zh 按原生顺序排列的声明副本。
   * @ja ネイティブ順序の宣言コピー。
   * @ko 네이티브 순서의 선언 복사본입니다.
   * @returns Declarations with independently owned properties.
   * @zh 包含独立属性副本的声明。
   * @ja 独立所有の属性を含む宣言。
   * @ko 독립 소유 속성을 포함한 선언입니다.
   */
  get list(): DecoratorDeclaration[] {
    const entries = read(this, 'list') as NativeDecoratorDeclaration[];
    return entries.map(entry => declaration(entry) as DecoratorDeclaration);
  }

  /**
   * Replace the list with copied decorator declarations.
   *
   * @zh 用复制的装饰器声明替换列表。
   * @ja コピーした装飾宣言でリストを置換します。
   * @ko 복사한 장식 선언으로 목록을 교체합니다.
   * @param values - Complete declarations, including their local properties.
   * @zh values - 完整声明，包含局部属性。
   * @ja values - ローカル属性を含む完全な宣言。
   * @ko values - 로컬 속성을 포함한 완전한 선언입니다.
   */
  set list(values: readonly DecoratorDeclaration[]) {
    const entries = declarationsToNative(values, true);
    native.writeEffectList(
      effectValueToNative(this).effectHandle, 'list', entries);
  }
}

/**
 * Generation-owned Rml::FiltersPtr, preserving shared resource identity.
 *
 * @zh 检查运行代的 Rml::FiltersPtr，保留共享资源身份。
 * @ja 共有リソースの同一性を保持する世代所有の Rml::FiltersPtr。
 * @ko 공유 리소스 동일성을 보존하는 실행 세대 소유 Rml::FiltersPtr입니다.
 * @remarks
 * Setting value changes only text; setting list copies declarations. Each
 * write creates a new shared list and preserves existing Property snapshots.
 * Writing to null creates storage. A filter requires a non-null instancer
 * and all required local properties; parsed declarations include defaults.
 * @zh value 写入仅改变文本，list 写入复制声明。每次写入创建新列表并保留旧属性快照。
 * 空指针写入会创建存储。滤镜需要非空实例器和全部必需属性，解析结果包含默认值。
 * @ja value は文字列のみ変更し、list は宣言をコピーします。代入は新しいリストを
 * 作り、既存の属性を保持します。null には領域を確保します。非 null の生成器と
 * 必須属性が必要で、解析済み宣言には既定値が含まれます。
 * @ko value는 텍스트만 바꾸고 list는 선언을 복사합니다. 대입은 새 목록을 만들고
 * 기존 속성을 유지합니다. null은 저장소를 만듭니다. null이 아닌 생성기와 필수
 * 속성이 필요하며 해석된 선언에는 기본값이 포함됩니다.
 */
export class FilterList {
  /**
   * Parse RCSS or copy declaration records; empty text or "none" creates null.
   *
   * @zh 解析 RCSS 或复制声明记录；空文本或 "none" 创建空指针。
   * @ja RCSS の解析または宣言のコピー。空文字列と "none" は null。
   * @ko RCSS를 해석하거나 선언을 복사하며 빈 텍스트와 "none"은 null입니다.
   * @param value - RCSS text or complete declaration records.
   * @zh value - RCSS 文本或完整声明记录。
   * @ja value - RCSS 文字列または完全な宣言レコード。
   * @ko value - RCSS 텍스트 또는 완전한 선언 레코드입니다.
   * @param text - Metadata text for programmatic declarations.
   * @zh text - 程序化声明的元数据文本。
   * @ja text - プログラムで作成する宣言のメタデータ文字列。
   * @ko text - 프로그래밍 방식 선언의 메타데이터 텍스트입니다.
   */
  constructor(
    value: string | readonly FilterDeclaration[] = 'none', text = '',
  ) {
    owners.set(this, Array.isArray(value) ?
      native.createEffectList(
        'filters', declarationsToNative(value, false), text) :
      native.parseEffectList('filters', value as string));
  }

  /**
   * Stored declaration text, or empty for a null pointer.
   *
   * @zh 保存的声明文本，空指针返回空字符串。
   * @ja 保存された宣言テキスト。null なら空文字列。
   * @ko 저장된 선언 텍스트이며 null이면 빈 문자열입니다.
   * @returns Native value string.
   * @zh 原生 value 字符串。
   * @ja ネイティブ value 文字列。
   * @ko 네이티브 value 문자열입니다.
   */
  get value(): string {
    return read(this, 'value');
  }

  /**
   * Copy the filter list and replace its text without reparsing.
   *
   * @zh 复制滤镜列表并替换文本，不重新解析。
   * @ja フィルターリストをコピーし、再解析せず文字列を置換します。
   * @ko 필터 목록을 복사하고 다시 해석하지 않고 텍스트를 교체합니다.
   * @param value - New native value string.
   * @zh value - 新的原生 value 字符串。
   * @ja value - 新しいネイティブ value 文字列。
   * @ko value - 새 네이티브 value 문자열입니다.
   */
  set value(value: string) {
    native.writeEffectList(
      effectValueToNative(this).effectHandle, 'value', value);
  }

  /**
   * Whether the native shared pointer is null.
   *
   * @zh 原生共享指针是否为空。
   * @ja ネイティブ共有ポインターが null かどうか。
   * @ko 네이티브 공유 포인터가 null인지 여부입니다.
   * @returns Null-pointer status.
   * @zh 空指针状态。
   * @ja null ポインターの状態。
   * @ko null 포인터 상태입니다.
   */
  get isNull(): boolean {
    return read(this, 'isNull');
  }

  /**
   * Copied declarations in native filter order.
   *
   * @zh 按原生滤镜顺序排列的声明副本。
   * @ja ネイティブのフィルター順に並ぶ宣言コピー。
   * @ko 네이티브 필터 순서의 선언 복사본입니다.
   * @returns Declarations with independently owned properties.
   * @zh 包含独立属性副本的声明。
   * @ja 独立所有の属性を含む宣言。
   * @ko 독립 소유 속성을 포함한 선언입니다.
   */
  get list(): FilterDeclaration[] {
    const entries = read(this, 'list') as NativeEffectDeclaration[];
    return entries.map(entry => declaration(entry) as FilterDeclaration);
  }

  /**
   * Replace the list with copied filter declarations.
   *
   * @zh 用复制的滤镜声明替换列表。
   * @ja コピーしたフィルター宣言でリストを置換します。
   * @ko 복사한 필터 선언으로 목록을 교체합니다.
   * @param values - Complete declarations, including their local properties.
   * @zh values - 完整声明，包含局部属性。
   * @ja values - ローカル属性を含む完全な宣言。
   * @ko values - 로컬 속성을 포함한 완전한 선언입니다.
   */
  set list(values: readonly FilterDeclaration[]) {
    const entries = declarationsToNative(values, false);
    native.writeEffectList(
      effectValueToNative(this).effectHandle, 'list', entries);
  }
}

/**
 * Generation-owned Rml::FontEffectsPtr containing const font effects.
 *
 * @zh 检查运行代的 Rml::FontEffectsPtr，包含 const 字体效果。
 * @ja const フォント効果を含む世代所有の Rml::FontEffectsPtr。
 * @ko const 글꼴 효과를 포함한 실행 세대 소유 Rml::FontEffectsPtr입니다.
 * @remarks
 * Lists, Property copies and PropertyDictionary entries retain custom effect
 * callbacks. Replacing one list does not release callbacks still owned by a
 * snapshot. Standalone callback/owner cycles can be collected. Shutdown
 * releases callbacks and invalidates the values.
 * @zh 列表、Property 副本和 PropertyDictionary 条目保留自定义效果回调。
 * 替换列表不会释放其他快照持有的回调。独立的回调与持有者循环可以回收。
 * 关闭运行时会释放回调并使这些值失效。
 * @ja リスト、Property のコピー、PropertyDictionary の項目は独自の効果の
 * コールバックを保持します。他のコピーが保持するコールバックは置換後も存続します。
 * 独立した所有者との循環は回収でき、終了時にコールバックを解放して無効化します。
 * @ko 목록, Property 복사본과 PropertyDictionary 항목은 사용자 효과 콜백을
 * 유지합니다. 목록을 교체해도 다른 복사본이 소유한 콜백은 유지됩니다.
 * 독립 소유자와 콜백의 순환은 수집 가능하며 종료 시 콜백을 해제하고 값을 무효화합니다.
 */
export class FontEffectList {
  /**
   * Parse RCSS or snapshot an array; "none" creates a typed null pointer.
   *
   * @zh 解析 RCSS 或复制数组；"none" 创建带类型的空指针。
   * @ja RCSS の解析または配列のコピー。"none" は型付き null。
   * @ko RCSS 해석 또는 배열 복사이며 "none"은 형식이 있는 null입니다.
   * @param value - RCSS text or owned FontEffect array.
   * @zh value - RCSS 文本或自有 FontEffect 数组。
   * @ja value - RCSS テキストまたは所有する FontEffect 配列。
   * @ko value - RCSS 텍스트 또는 소유하는 FontEffect 배열입니다.
   * @param text - Metadata text for array construction; defaults to empty.
   * @zh text - 数组构造时的元数据文本，默认为空。
   * @ja text - 配列構築時のメタデータ文字列。既定値は空。
   * @ko text - 배열의 메타데이터 텍스트입니다. 기본값은 빈 문자열입니다.
   */
  constructor(value: string | readonly FontEffect[] = 'none', text = '') {
    owners.set(this, Array.isArray(value) ?
      native.createEffectList(
        'fonteffects', value.map(fontEffectHandle), text) :
      native.parseEffectList('fonteffects', value as string));
  }

  /**
   * Original declaration text, or empty for a null pointer.
   *
   * @zh 原始声明文本，空指针返回空字符串。
   * @ja 元の宣言テキスト。null なら空文字列。
   * @ko 원래 선언 텍스트이며 null이면 빈 문자열입니다.
   * @returns Native value string.
   * @zh 原生 value 字符串。
   * @ja ネイティブ value 文字列。
   * @ko 네이티브 value 문자열입니다.
   */
  get value(): string {
    return read(this, 'value');
  }

  /**
   * Copy the font effect list and replace its text without reparsing.
   *
   * @zh 复制字体效果列表并替换文本，不重新解析。
   * @ja フォント効果リストをコピーし、再解析せず文字列を置換します。
   * @ko 글꼴 효과 목록을 복사하고 다시 해석하지 않고 텍스트를 교체합니다.
   * @param value - New native value string.
   * @zh value - 新的原生 value 字符串。
   * @ja value - 新しいネイティブ value 文字列。
   * @ko value - 새 네이티브 value 문자열입니다.
   */
  set value(value: string) {
    native.writeEffectList(
      effectValueToNative(this).effectHandle, 'value', value);
  }

  /**
   * Whether the native shared pointer is null.
   *
   * @zh 原生共享指针是否为空。
   * @ja ネイティブ共有ポインターが null かどうか。
   * @ko 네이티브 공유 포인터가 null인지 여부입니다.
   * @returns Null-pointer status.
   * @zh 空指针状态。
   * @ja null ポインターの状態。
   * @ko null 포인터 상태입니다.
   */
  get isNull(): boolean {
    return read(this, 'isNull');
  }

  /**
   * Independent effect wrappers in stored order; assignment snapshots effects.
   *
   * @zh 按存储顺序返回独立效果包装器；赋值创建效果快照。
   * @ja 保存順の独立した効果ラッパー。代入は効果のスナップショットを作ります。
   * @ko 저장 순서의 독립 효과 래퍼이며 대입 시 효과 스냅샷을 만듭니다.
   * @returns Owned effects; assign edited wrappers back to change the list.
   * @zh 自有效果；编辑后需重新赋值以更改列表。
   * @ja 所有する効果。編集後に再代入するとリストが変わります。
   * @ko 소유하는 효과이며 편집 후 다시 대입해야 목록이 변경됩니다.
   */
  get list(): FontEffect[] {
    return read(this, 'list').map(fontEffectFromNative);
  }

  /**
   * Replace the list with immutable snapshots of the supplied effects.
   *
   * @zh 用给定效果的不可变快照替换列表。
   * @ja 指定効果の不変スナップショットでリストを置換します。
   * @ko 지정한 효과의 불변 스냅샷으로 목록을 교체합니다.
   * @param values - Effects from the current runtime.
   * @zh values - 当前运行时的效果。
   * @ja values - 現在のランタイムの効果。
   * @ko values - 현재 런타임의 효과입니다.
   */
  set list(values: readonly FontEffect[]) {
    if (!Array.isArray(values)) {
      throw new TypeError('Expected a font effect array');
    }
    native.writeEffectList(
      effectValueToNative(this).effectHandle, 'list',
      values.map(fontEffectHandle));
  }
}

/**
 * Wrap an existing native reference without reparsing or changing identity.
 *
 * @internal
 * @param value - Tagged native owner.
 * @returns Public list wrapper.
 */
export function effectValueFromNative(value: NativeEffectValue):
DecoratorList | FilterList | FontEffectList {
  const Class = value.type === 'decorators' ? DecoratorList :
    value.type === 'filters' ? FilterList : FontEffectList;
  const result = Object.create(Class.prototype) as
    DecoratorList | FilterList | FontEffectList;
  owners.set(result, value);
  return result;
}
