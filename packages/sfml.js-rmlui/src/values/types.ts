/**
 * Opaque native handle types.
 *
 * @zh 不透明原生句柄类型，不暴露内部结构。
 * @ja 内部構造を公開しない不透明なネイティブハンドル型。
 * @ko 내부 구조를 노출하지 않는 불투명 네이티브 핸들 타입입니다.
 * @internal
 */
export type ContextNativeHandle = object;

/** @internal */
export type DocumentNativeHandle = object;

/** @internal */
export type ElementNativeHandle = object;

/**
 * Native struct mapping produced by NumericFields.
 *
 * @zh NumericFields 产出的原生结构映射。
 * @internal
 */
export interface NativeStructMapping {
  readonly buffers: ArrayBuffer[];
  readonly fields: Record<string, readonly [string, number, number]>;
}

import type { Element } from '../dom/elements/element';
import type { Context } from '../runtime/context';
import type { Variant } from './variant';
import type {
  ColorStopList, BoxShadowList,
} from '../style/effects/decoration-values';
import type { TransformSnapshot } from '../style/values/transform';
import type {
  AnimationList, TransitionList,
} from '../animation/animation-values';
import type {
  DecoratorList, FilterList, FontEffectList,
} from '../style/effects/effect-values';
import type { RmlEvent } from '../events/event';

declare const opaqueObjectBrand: unique symbol;
declare const scriptObjectBrand: unique symbol;

export type { RmlEvent } from '../events/event';

/**
 * Two-component Rml::Vector2f value; components round to native float.
 *
 * @zh Rml::Vector2f 值，分量按原生 float 精度存储。
 * @ja Rml::Vector2f の値。成分はネイティブ float 精度になります。
 * @ko Rml::Vector2f 값이며 성분은 네이티브 float 정밀도로 저장됩니다.
 */
export interface VariantVector2 {
  /**
   * Floating vectors are untagged, keeping integer destinations distinct.
   *
   * @zh 浮点向量没有类型标记，以区分整数转换目标。
   * @ja 実数ベクトルには型タグがなく、整数変換先と区別します。
   * @ko 실수 벡터에는 형식 태그가 없어 정수 변환 대상과 구분됩니다.
   */
  readonly type?: never;

  /**
   * X component.
   *
   * @zh X 分量。
   * @ja X 成分。
   * @ko X 성분입니다.
   */
  readonly x: number;

  /**
   * Y component.
   *
   * @zh Y 分量。
   * @ja Y 成分。
   * @ko Y 성분입니다.
   */
  readonly y: number;
}

/**
 * Three-component Rml::Vector3f value.
 *
 * @zh Rml::Vector3f 三分量值。
 * @ja Rml::Vector3f の 3 成分値。
 * @ko Rml::Vector3f의 3성분 값입니다.
 */
export interface VariantVector3 extends VariantVector2 {
  /**
   * Z component.
   *
   * @zh Z 分量。
   * @ja Z 成分。
   * @ko Z 성분입니다.
   */
  readonly z: number;
}

/**
 * Four-component Rml::Vector4f value.
 *
 * @zh Rml::Vector4f 四分量值。
 * @ja Rml::Vector4f の 4 成分値。
 * @ko Rml::Vector4f의 4성분 값입니다.
 */
export interface VariantVector4 extends VariantVector3 {
  /**
   * W component.
   *
   * @zh W 分量。
   * @ja W 成分。
   * @ko W 성분입니다.
   */
  readonly w: number;
}

/**
 * Tagged Rml::Colourb or Rml::Colourf, preserving the native colour type.
 *
 * @zh 带类型标记的 Rml::Colourb 或 Rml::Colourf，保留原生颜色类型。
 * @ja ネイティブ型を保持する Rml::Colourb または Rml::Colourf。
 * @ko 네이티브 타입을 보존하는 Rml::Colourb 또는 Rml::Colourf입니다.
 */
export interface VariantColour {
  /**
   * Byte channels are integers 0..255; float channels use native float.
   *
   * @zh 字节通道为 0..255 的整数；浮点通道使用原生 float。
   * @ja バイト成分は 0..255 の整数、浮動小数点成分は float です。
   * @ko 바이트 채널은 0..255 정수이며 실수 채널은 float입니다.
   */
  readonly type: 'colourb' | 'colourf';

  /**
   * Red channel.
   *
   * @zh 红色通道。
   * @ja 赤成分。
   * @ko 빨강 채널입니다.
   */
  readonly red: number;

  /**
   * Green channel.
   *
   * @zh 绿色通道。
   * @ja 緑成分。
   * @ko 초록 채널입니다.
   */
  readonly green: number;

  /**
   * Blue channel.
   *
   * @zh 蓝色通道。
   * @ja 青成分。
   * @ko 파랑 채널입니다.
   */
  readonly blue: number;

  /**
   * Alpha channel.
   *
   * @zh 透明度通道。
   * @ja アルファ成分。
   * @ko 알파 채널입니다.
   */
  readonly alpha: number;
}

/**
 * Rml::Colourb snapshot with integer channels from 0 through 255.
 *
 * @zh Rml::Colourb 快照，通道为 0 到 255 的整数。
 * @ja 0 から 255 の整数成分を持つ Rml::Colourb のコピー。
 * @ko 0부터 255까지의 정수 채널을 가진 Rml::Colourb 스냅샷입니다.
 */
export interface VariantByteColour extends VariantColour {
  /**
   * Select the native byte colour representation.
   *
   * @zh 选择原生字节颜色表示。
   * @ja ネイティブのバイトカラー表現を選択します。
   * @ko 네이티브 바이트 색상 표현을 선택합니다.
   */
  readonly type: 'colourb';
}

/**
 * Supported Rml::Variant values. Native 64-bit integers retain exact BigInt
 * values; native script owners retain identity.
 * Arbitrary pointers are rejected.
 *
 * @zh 支持的 Rml::Variant 值。原生 64 位整数精确转换为 BigInt；
 * Element、Context 和 Event 保留对象身份，任意指针被拒绝。
 * @ja 対応する Rml::Variant 値。64 ビット整数は正確な BigInt になり、
 * Element、Context、Event の同一性を保持し、任意のポインターは拒否します。
 * @ko 지원하는 Rml::Variant 값입니다. 64비트 정수는 정확한 BigInt로 변환하고
 * Element, Context, Event의 동일성을 보존합니다. 임의 포인터는 거부합니다.
 */
export type VariantValue =
  | null | boolean | number | bigint | string | Element | Context | RmlEvent
  | Variant | VariantScriptPointer | VariantScriptObject
  | VariantOpaquePointer | VariantOpaqueObject
  | VariantNumber | VariantInteger64 | VariantCharacter
  | VariantVector2 | VariantVector3 | VariantVector4 | VariantColour
  | ColorStopList | BoxShadowList | TransformSnapshot
  | AnimationList | TransitionList
  | DecoratorList | FilterList | FontEffectList;

/**
 * Owned non-null value selecting a native Variant conversion template.
 *
 * @zh 用于选择原生 Variant 转换模板的非空自有值。
 * @ja ネイティブ Variant 変換テンプレートを選択する非 null の所有値。
 * @ko 네이티브 Variant 변환 템플릿을 선택하는 null이 아닌 소유 값입니다.
 */
export type VariantDefault =
  Exclude<VariantValue,
  null | Element | Context | RmlEvent | Variant |
  VariantOpaqueObject | VariantScriptObject>;

/**
 * Native Variant output, including the original object of an opaque pointer.
 * Native provenance allows an opaque output to be stored again.
 * Arbitrary host objects first require a voidptr selector.
 *
 * @zh 原生 Variant 输出，包含不透明指针引用的原对象。
 * 具备原生来源的不透明输出可以直接写回；任意宿主对象首次存储需要 voidptr 样本。
 * @ja 不透明ポインターが参照する元のオブジェクトを含むネイティブ出力。
 * ネイティブ由来の値は再格納でき、任意のホストには voidptr が必要です。
 * @ko 불투명 포인터의 원래 객체를 포함하는 네이티브 Variant 출력입니다.
 * 네이티브 출처의 값은 다시 저장할 수 있으며 일반 객체는 voidptr가 필요합니다.
 */
export type VariantReadValue = VariantValue;

/**
 * Original host object with checked native opaque-pointer provenance.
 * Its hidden native identity is independent of the object's public fields.
 *
 * @zh 具有已验证原生不透明指针来源的宿主原对象；
 * 隐藏原生身份与对象公开字段相互独立。
 * @ja 検証済みの不透明ポインター由来の元のホストオブジェクト。
 * 隠されたネイティブ識別子は公開フィールドから独立しています。
 * @ko 검증된 네이티브 불투명 포인터 출처의 원래 호스트 객체입니다.
 * 숨겨진 네이티브 식별자는 공개 필드와 독립적입니다.
 */
export type VariantOpaqueObject = object & {
  /**
   * Compile-time proof of opaque-pointer provenance; not a runtime field.
   *
   * @zh 编译期不透明指针来源标记，不是运行时字段。
   * @ja 不透明ポインターの由来を示すコンパイル時の印。実行時フィールドではありません。
   * @ko 불투명 포인터 출처를 나타내는 컴파일 시 표시이며 런타임 필드가 아닙니다.
   */
  readonly [opaqueObjectBrand]: true;
};

/**
 * Original JS identity registered by a Native ScriptInterface owner.
 * Copies retain its guarded pointer; the extension controls native lifetime.
 *
 * @zh Native ScriptInterface 拥有者登记的 JS 原对象身份。
 * 副本保留受保护指针；扩展负责原生生命周期。
 * @ja Native ScriptInterface の所有者が登録した元の JS オブジェクト。
 * コピーは保護された参照を保持し、拡張がネイティブ寿命を管理します。
 * @ko Native ScriptInterface 소유자가 등록한 원래 JS 객체입니다.
 * 복사본은 보호된 포인터를 유지하며 확장이 네이티브 수명을 관리합니다.
 */
export type VariantScriptObject = object & {
  /**
   * Compile-time proof of script-object provenance; not a runtime field.
   *
   * @zh 编译期脚本对象来源标记，不是运行时字段。
   * @ja スクリプトオブジェクトの由来を示すコンパイル時の印。実行時フィールドではありません。
   * @ko 스크립트 객체 출처를 나타내는 컴파일 시 표시이며 런타임 필드가 아닙니다.
   */
  readonly [scriptObjectBrand]: true;
};

/**
 * Owned opaque host object selecting native void* storage and conversion.
 *
 * @zh 自有不透明宿主对象，选择原生 void* 存储与转换。
 * @ja ネイティブ void* の格納と変換を選択する所有ホストオブジェクト。
 * @ko 네이티브 void* 저장 및 변환을 선택하는 소유 호스트 객체입니다.
 */
export interface VariantOpaquePointer {
  /**
   * Select native void*, independently of ScriptInterface*.
   *
   * @zh 选择原生 void*，与 ScriptInterface* 独立。
   * @ja ScriptInterface* とは独立してネイティブ void* を選択します。
   * @ko ScriptInterface*와 별개로 네이티브 void*를 선택합니다.
   */
  readonly type: 'voidptr';

  /**
   * Original managed object or typed null; numeric addresses are rejected.
   *
   * @zh 原托管对象或带类型的 null；拒绝数值地址。
   * @ja 元の管理オブジェクトまたは型付き null。数値アドレスは拒否します。
   * @ko 원래 관리 객체 또는 형식이 지정된 null이며 숫자 주소는 거부합니다.
   */
  readonly value: object | null;
}

/**
 * Guarded native ScriptInterface pointer storage and GetInto destination.
 *
 * @zh 受保护的原生 ScriptInterface 指针存储和 GetInto 目标。
 * @ja 保護された ScriptInterface 参照の格納値と GetInto の変換先。
 * @ko 보호된 네이티브 ScriptInterface 포인터 저장 값 및 GetInto 대상입니다.
 */
export interface VariantScriptPointer {
  /**
   * Select the native ScriptInterface pointer type.
   *
   * @zh 选择原生 ScriptInterface 指针类型。
   * @ja ネイティブ ScriptInterface 参照型を選択します。
   * @ko 네이티브 ScriptInterface 포인터 형식을 선택합니다.
   */
  readonly type: 'scriptinterface';

  /**
   * Live native owner, or a typed null pointer.
   *
   * @zh 有效原生对象，或带类型的空指针。
   * @ja 有効なネイティブ所有者、または型付き null 参照。
   * @ko 유효한 네이티브 소유 객체 또는 형식이 지정된 null 포인터입니다.
   */
  readonly value: Element | Context | RmlEvent | VariantScriptObject | null;
}

/**
 * Integer vector template destination. Rml::Variant cannot store this type.
 *
 * @zh 整数向量模板目标，Rml::Variant 不能直接存储此类型。
 * @ja 整数ベクトルの変換先。Rml::Variant の格納型ではありません。
 * @ko 정수 벡터 변환 대상이며 Rml::Variant 저장 형식이 아닙니다.
 */
export type VariantIntegerVector =
  | ({
    /**
     * Select conversion to a two-component integer vector.
     *
     * @zh 选择双分量整数向量转换。
     * @ja 2 成分の整数ベクトルへの変換を選びます。
     * @ko 두 성분 정수 벡터로 변환합니다.
     */
    readonly type: 'vector2i';
  } & Omit<VariantVector2, 'type'>)
  | ({
    /**
     * Select conversion to a three-component integer vector.
     *
     * @zh 选择三分量整数向量转换。
     * @ja 3 成分の整数ベクトルへの変換を選びます。
     * @ko 세 성분 정수 벡터로 변환합니다.
     */
    readonly type: 'vector3i';
  } & Omit<VariantVector3, 'type'>)
  | ({
    /**
     * Select conversion to a four-component integer vector.
     *
     * @zh 选择四分量整数向量转换。
     * @ja 4 成分の整数ベクトルへの変換を選びます。
     * @ko 네 성분 정수 벡터로 변환합니다.
     */
    readonly type: 'vector4i';
  } & Omit<VariantVector4, 'type'>);

/**
 * Native Rml::Character enum. Storage uses INT64; conversion returns uint32.
 *
 * @zh 原生 Rml::Character 枚举，存储类型为 INT64，转换结果为 uint32。
 * @ja Rml::Character 列挙型。INT64 で格納し、uint32 として変換します。
 * @ko Rml::Character 열거형이며 INT64로 저장하고 uint32로 변환합니다.
 */
export interface VariantCharacter {
  /**
   * Select the native enum template.
   *
   * @zh 选择原生枚举模板。
   * @ja ネイティブの列挙型テンプレートを選択します。
   * @ko 네이티브 열거형 템플릿을 선택합니다.
   */
  readonly type: 'character';

  /**
   * Integer 0..4294967295, matching char32_t without a Unicode-scalar filter.
   *
   * @zh 0..4294967295 的整数，与 char32_t 一致，不额外限制为 Unicode 标量。
   * @ja char32_t と同じ 0..4294967295 の整数。Unicode スカラーに限定しません。
   * @ko char32_t와 같은 0..4294967295 정수이며 유니코드 스칼라로 제한하지 않습니다.
   */
  readonly value: number;
}

/**
 * Native conversion default, including destinations without Variant storage.
 *
 * @zh 原生转换默认值，包含没有对应 Variant 存储类型的目标。
 * @ja Variant に格納できない変換先を含むネイティブ変換の既定値。
 * @ko Variant 저장 형식이 없는 대상도 포함하는 네이티브 변환 기본값입니다.
 */
export type VariantConversionDefault = VariantDefault | VariantIntegerVector;

/**
 * Explicit numeric Variant storage or conversion selector.
 *
 * @zh 显式选择数值 Variant 存储或转换类型。
 * @ja 数値 Variant の格納型または変換型を明示的に選択します。
 * @ko 숫자 Variant 저장 또는 변환 형식을 명시적으로 선택합니다.
 */
export interface VariantNumber {
  /**
   * Exact native scalar type; char uses the platform's native char range.
   *
   * @zh 精确的原生标量类型；char 使用当前平台的原生 char 范围。
   * @ja 正確なネイティブ型。char の範囲はプラットフォームに従います。
   * @ko 정확한 네이티브 형식이며 char 범위는 플랫폼을 따릅니다.
   */
  readonly type: 'byte' | 'char' | 'float' | 'double' | 'int' | 'uint';

  /**
   * Finite number in the selected range; integer types require integers.
   *
   * @zh 所选类型范围内的有限数值；整数类型要求整数。
   * @ja 選択した範囲内の有限数。整数型では整数が必要です。
   * @ko 선택한 범위의 유한 숫자이며 정수 형식은 정수가 필요합니다.
   */
  readonly value: number;
}

/**
 * Explicit signed or unsigned 64-bit Variant storage or conversion selector.
 *
 * @zh 显式选择有符号或无符号 64 位 Variant 存储或转换类型。
 * @ja 符号付きまたは符号なし 64 ビット Variant の格納型・変換型を選択します。
 * @ko 부호 있는 또는 없는 64비트 Variant 저장 및 변환 형식을 선택합니다.
 */
export interface VariantInteger64 {
  /**
   * Exact native integer type, including positive signed values.
   *
   * @zh 精确的原生整数类型，包括正值的有符号类型。
   * @ja 正の符号付き値も区別する正確なネイティブ整数型。
   * @ko 양의 부호 있는 값도 구분하는 정확한 네이티브 정수 형식입니다.
   */
  readonly type: 'int64' | 'uint64';

  /**
   * Exact BigInt within the selected signed or unsigned 64-bit range.
   *
   * @zh 所选有符号或无符号 64 位范围内的精确 BigInt。
   * @ja 選択した符号付き・符号なし 64 ビット範囲内の正確な BigInt。
   * @ko 선택한 부호 있는 또는 없는 64비트 범위의 정확한 BigInt입니다.
   */
  readonly value: bigint;
}

/**
 * Result type selected by a default value, widening primitive literals.
 *
 * @zh 默认值选择的结果类型，原始值的字面量类型会扩宽。
 * @ja 既定値で選ぶ結果型。プリミティブのリテラル型は拡張されます。
 * @ko 기본값으로 선택하는 결과 유형이며 원시 리터럴 유형은 확장합니다.
 * @template T - Non-null native conversion exemplar.
 * @zh T - 非空的原生转换样本。
 * @ja T - 非 null のネイティブ変換用の見本。
 * @ko T - null이 아닌 네이티브 변환 예제입니다.
 */
export type VariantResult<T extends VariantConversionDefault> =
  T extends VariantOpaquePointer ? VariantOpaqueObject | null :
    T extends VariantScriptPointer ?
      Element | Context | RmlEvent | VariantScriptObject | null :
      T extends VariantCharacter | VariantNumber ? number :
        T extends VariantInteger64 ? bigint :
          T extends {
            /**
             * Select the four-component integer-vector result.
             *
             * @zh 选择四分量整数向量结果。
             * @ja 4 成分の整数ベクトルの結果を選びます。
             * @ko 네 성분 정수 벡터 결과를 선택합니다.
             */
            readonly type: 'vector4i';
          } ? VariantVector4 :
            T extends {
              /**
               * Select the three-component integer-vector result.
               *
               * @zh 选择三分量整数向量结果。
               * @ja 3 成分の整数ベクトルの結果を選びます。
               * @ko 세 성분 정수 벡터 결과를 선택합니다.
               */
              readonly type: 'vector3i';
            } ? VariantVector3 :
              T extends {
                /**
                 * Select the two-component integer-vector result.
                 *
                 * @zh 选择双分量整数向量结果。
                 * @ja 2 成分の整数ベクトルの結果を選びます。
                 * @ko 두 성분 정수 벡터 결과를 선택합니다.
                 */
                readonly type: 'vector2i';
              } ? VariantVector2 :
                T extends DecoratorList | FilterList | FontEffectList ? T :
                  T extends AnimationList ? AnimationList :
                    T extends TransitionList ? TransitionList :
                      T extends TransformSnapshot ? TransformSnapshot :
                        T extends ColorStopList ? ColorStopList :
                          T extends BoxShadowList ? BoxShadowList :
                            T extends boolean ? boolean :
                              T extends number ? number :
                                T extends bigint ? bigint :
                                  T extends string ? string :
                                    T extends VariantColour ? VariantColour :
                                      T extends VariantVector4 ?
                                        VariantVector4 :
                                        T extends VariantVector3 ?
                                          VariantVector3 : VariantVector2;

/**
 * JavaScript event listener.
 *
 * @zh JavaScript 事件监听器。
 * @ja JavaScript のイベントリスナー。
 * @ko JavaScript 이벤트 리스너입니다.
 * @param event - Snapshot with propagation controls valid in this callback.
 * @zh event - 事件快照；传播控制仅在本次回调期间有效。
 * @ja event - イベントのコピー。伝播制御はこのコールバック中のみ有効です。
 * @ko event - 이벤트 스냅샷이며 전파 제어는 이 콜백 동안만 유효합니다.
 */
export type RmlEventListener = (event: RmlEvent) => void;
