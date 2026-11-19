import { native } from '../../internal/native';
import { Stream, streamHandle } from '../../io/stream';
import type { Context } from '../../runtime/context';
import { spriteFromNative, type Sprite } from '../../rendering/spritesheet';
import {
  decoratorInstancerFromNative, type DecoratorInstancer,
} from '../effects/effect-instancers';
import {
  propertyDictionaryFromNative, type PropertyDictionary,
} from './property-dictionary';
import type { PropertyId } from '../../generated/property-ids';
import type { Element } from '../../dom/elements/element';
import { decoratorFromNative, type Decorator } from '../effects/decorator';
import { DecoratorList, effectValueToNative } from '../effects/effect-values';
import {
  renderManagerHandle, type RenderManager,
} from '../../rendering/render-manager';
import type { PropertySource } from './property';
import {
  elementDefinitionFromNative, type ElementDefinition,
} from '../../dom/elements/element-definition';

const containers = new WeakMap<StyleSheetContainer, object>();
const sheets = new WeakMap<StyleSheet, object>();

/**
 * Independent Rml::NamedDecorator metadata.
 *
 * @zh 独立的 Rml::NamedDecorator 元数据。
 * @ja 独立した Rml::NamedDecorator メタデータ。
 * @ko 독립된 Rml::NamedDecorator 메타데이터입니다.
 */
export interface NamedDecorator {
  /**
   * Native decorator type.
   *
   * @zh 原生装饰器类型。
   * @ja ネイティブ装飾器型。
   * @ko 네이티브 장식기 형식입니다.
   */
  type: string;

  /**
   * Registered instancer, or null when absent.
   *
   * @zh 注册的实例器；不存在时为 null。
   * @ja 登録インスタンサー。存在しない場合は null。
   * @ko 등록된 인스턴서이며 없으면 null입니다.
   */
  instancer: DecoratorInstancer | null;

  /**
   * Copied properties; edits do not change the source stylesheet.
   *
   * @zh 属性副本；修改不会影响来源样式表。
   * @ja プロパティのコピー。編集は元のシートを変更しません。
   * @ko 속성 사본이며 편집해도 원본 시트를 변경하지 않습니다.
   */
  properties: PropertyDictionary;
}

/**
 * Independent Rml::KeyframeBlock.
 *
 * @zh 独立的 Rml::KeyframeBlock。
 * @ja 独立した Rml::KeyframeBlock。
 * @ko 독립된 Rml::KeyframeBlock입니다.
 */
export interface KeyframeBlock {
  /**
   * Normalized keyframe time in [0, 1].
   *
   * @zh [0, 1] 范围内的归一化关键帧时间。
   * @ja [0, 1] 内の正規化キーフレーム時刻。
   * @ko [0, 1] 범위의 정규화된 키프레임 시간입니다.
   */
  normalizedTime: number;

  /**
   * Independent properties at this time.
   *
   * @zh 此时刻的独立属性副本。
   * @ja この時刻の独立したプロパティ。
   * @ko 이 시점의 독립된 속성 사본입니다.
   */
  properties: PropertyDictionary;
}

/**
 * Independent Rml::Keyframes snapshot.
 *
 * @zh 独立的 Rml::Keyframes 快照。
 * @ja 独立した Rml::Keyframes スナップショット。
 * @ko 독립된 Rml::Keyframes 스냅샷입니다.
 */
export interface Keyframes {
  /**
   * Property IDs affected by the animation.
   *
   * @zh 动画影响的属性 ID。
   * @ja アニメーションが影響するプロパティ ID。
   * @ko 애니메이션이 영향을 주는 속성 ID입니다.
   */
  propertyIds: PropertyId[];

  /**
   * Blocks in native timeline order.
   *
   * @zh 按原生时间线排序的关键帧块。
   * @ja ネイティブの時間順のキーフレームブロック。
   * @ko 네이티브 시간 순서의 키프레임 블록입니다.
   */
  blocks: KeyframeBlock[];
}

/**
 * Owned or read-only shared Rml::StyleSheetContainer.
 *
 * @zh 自有或只读共享的 Rml::StyleSheetContainer。
 * @ja 所有または読み取り専用で共有する Rml::StyleSheetContainer。
 * @ko 소유하거나 읽기 전용으로 공유하는 Rml::StyleSheetContainer입니다.
 * @remarks
 * Load and merge before compilation. Compiled views retain the container's
 * native storage and expire on every rebuild, including document media updates.
 * Document getters return read-only containers: load, merge and update throw.
 * @zh 加载和合并必须在编译前完成。编译视图保留容器原生存储，并在
 * 任何重新编译（包括文档媒体查询更新）后失效。
 * 文档返回只读容器，load、merge 和 update 操作会抛出异常。
 * @ja 読込とマージはコンパイル前に行います。ビューはコンテナーを保持し、
 * 文書のメディア更新を含む再コンパイル時に無効になります。
 * 文書が返すコンテナーでは load、merge、update が例外を投げます。
 * @ko 로드와 병합은 컴파일 전에 수행합니다. 뷰는 컨테이너를 유지하며
 * 문서 미디어 갱신을 포함한 재컴파일 시 무효화됩니다.
 * 문서가 반환하는 읽기 전용 컨테이너의 load, merge, update는 예외를 던집니다.
 */
export class StyleSheetContainer {
  /**
   * Construct an empty Rml::StyleSheetContainer.
   *
   * @zh 构造空的 Rml::StyleSheetContainer。
   * @ja 空の Rml::StyleSheetContainer を構築します。
   * @ko 빈 Rml::StyleSheetContainer를 생성합니다.
   */
  constructor() {
    containers.set(this, native.createStyleSheetContainer());
  }

  /**
   * Invoke LoadStyleSheetContainer using UTF-8 text or a native stream.
   *
   * @zh 使用 UTF-8 文本或原生流调用 LoadStyleSheetContainer。
   * @ja UTF-8 テキストかネイティブストリームで読み込みます。
   * @ko UTF-8 텍스트 또는 네이티브 스트림으로 로드합니다.
   * @param source - RCSS text or stream appended to the uncompiled container.
   * @zh source - 追加到未编译容器的 RCSS 文本或流。
   * @ja source - 未コンパイルのコンテナーに追加する RCSS かストリーム。
   * @ko source - 컴파일 전 컨테이너에 추가할 RCSS 텍스트 또는 스트림입니다.
   * @param sourceUrl - Text origin; streams use their own URL. Defaults empty.
   * @zh sourceUrl - 文本来源；流使用自身 URL。默认为空。
   * @ja sourceUrl - テキストの参照元。ストリームでは自身の URL。既定は空。
   * @ko sourceUrl - 텍스트 원본이며 스트림은 자체 URL을 씁니다. 기본은 빈 값입니다.
   * @param beginLineNumber - Positive source line number; defaults to 1.
   * @zh beginLineNumber - 正整数来源行号，默认为 1。
   * @ja beginLineNumber - 正の開始行番号。既定は 1 です。
   * @ko beginLineNumber - 양수 시작 행 번호이며 기본값은 1입니다.
   * @returns Upstream parser result; failure can leave partially parsed rules.
   * @zh 上游解析结果；失败时可能保留部分已解析规则。
   * @ja 上流パーサーの結果。失敗時に解析済みルールが残る場合があります。
   * @ko 상위 파서의 결과이며 실패 시 일부 파싱된 규칙이 남을 수 있습니다.
   * @remarks
   * Normal event listeners may create/load/combine independent containers.
   * Borrowed or compiled containers cannot be loaded; parsing, provider and
   * effect callbacks cannot reenter these operations.
   * @zh 普通事件监听器可创建、加载和组合独立容器。借用或已编译容器不能加载；
   * 解析、资源提供器和效果回调不能重入。
   * @ja 通常のイベントリスナーで独立したコンテナーを作成、読込、結合できます。
   * 借用・コンパイル済みコンテナーの読込や解析・プロバイダー・効果からの再入は不可です。
   * @ko 일반 이벤트 리스너에서 독립 컨테이너를 생성, 로드, 결합할 수 있습니다.
   * 빌린 컨테이너나 컴파일한 컨테이너는 로드할 수 없으며
   * 파싱, 공급자, 효과 콜백에서는 재진입할 수 없습니다.
   */
  loadStyleSheetContainer(
    source: string | Stream, sourceUrl = '', beginLineNumber = 1,
  ): boolean {
    return native.loadStyleSheetContainer(
      containerHandle(this), source instanceof Stream ? streamHandle(source) :
        source, sourceUrl, beginLineNumber);
  }

  /**
   * Invoke Rml::StyleSheetContainer::UpdateCompiledStyleSheet.
   *
   * @zh 调用 Rml::StyleSheetContainer::UpdateCompiledStyleSheet。
   * @ja Rml::StyleSheetContainer::UpdateCompiledStyleSheet を呼びます。
   * @ko Rml::StyleSheetContainer::UpdateCompiledStyleSheet를 호출합니다.
   * @param context - Context providing viewport, density and active themes.
   * @zh context - 提供视口、密度和活动主题的上下文。
   * @ja context - ビューポート、密度、有効テーマを提供するコンテキスト。
   * @ko context - 뷰포트, 밀도 및 활성 테마를 제공하는 컨텍스트입니다.
   * @returns True if rebuilt, invalidating every previous compiled view.
   * @zh 是否重新编译；true 表示此前所有编译视图均失效。
   * @ja 再構築した場合は true。以前のすべてのビューが無効になります。
   * @ko 다시 컴파일하면 true이며 이전의 모든 컴파일 뷰가 무효화됩니다.
   */
  updateCompiledStyleSheet(context: Context): boolean {
    return native.updateCompiledStyleSheet(
      containerHandle(this), context.handle);
  }

  /**
   * Invoke Rml::StyleSheetContainer::GetCompiledStyleSheet.
   *
   * @zh 调用 Rml::StyleSheetContainer::GetCompiledStyleSheet。
   * @ja Rml::StyleSheetContainer::GetCompiledStyleSheet を呼びます。
   * @ko Rml::StyleSheetContainer::GetCompiledStyleSheet를 호출합니다.
   * @returns Checked read-only view, or null before the first compilation.
   * @zh 受检查的只读视图；首次编译前返回 null。
   * @ja 検証付き読み取り専用ビュー。初回コンパイル前は null。
   * @ko 검증된 읽기 전용 뷰이며 첫 컴파일 전에는 null입니다.
   */
  getCompiledStyleSheet(): StyleSheet | null {
    const handle = native.getCompiledStyleSheet(containerHandle(this));
    return handle === null ? null : sheetFromNative(handle);
  }

  /**
   * Invoke Rml::StyleSheetContainer::CombineStyleSheetContainer.
   *
   * @zh 调用 Rml::StyleSheetContainer::CombineStyleSheetContainer。
   * @ja Rml::StyleSheetContainer::CombineStyleSheetContainer を呼びます。
   * @ko Rml::StyleSheetContainer::CombineStyleSheetContainer를 호출합니다.
   * @param other - Rules placed after this container's rules.
   * @zh other - 规则排在当前容器之后的容器。
   * @ja other - このコンテナーのルールの後に追加するコンテナー。
   * @ko other - 현재 컨테이너의 규칙 뒤에 추가할 컨테이너입니다.
   * @returns New uncompiled container sharing native media blocks.
   * @zh 共享原生媒体块的全新未编译容器。
   * @ja ネイティブのメディアブロックを共有する新しい未コンパイルコンテナー。
   * @ko 네이티브 미디어 블록을 공유하는 새 컴파일 전 컨테이너입니다.
   */
  combineStyleSheetContainer(other: StyleSheetContainer): StyleSheetContainer {
    return containerFromNative(native.combineStyleSheetContainer(
      containerHandle(this), containerHandle(other)));
  }

  /**
   * Invoke MergeStyleSheetContainer before this container is compiled.
   *
   * @zh 在当前容器编译前调用 MergeStyleSheetContainer。
   * @ja コンパイル前のコンテナーで MergeStyleSheetContainer を呼びます。
   * @ko 현재 컨테이너의 컴파일 전에 MergeStyleSheetContainer를 호출합니다.
   * @param other - Container to append; self-merge is rejected.
   * @zh other - 待追加的容器；拒绝自身合并。
   * @ja other - 追加するコンテナー。自己マージは拒否します。
   * @ko other - 추가할 컨테이너이며 자기 자신과의 병합은 거부합니다.
   */
  mergeStyleSheetContainer(other: StyleSheetContainer): void {
    native.mergeStyleSheetContainer(
      containerHandle(this), containerHandle(other));
  }
}

/**
 * Rml::StyleSheet: a checked compiled view or an owned combination.
 *
 * @zh Rml::StyleSheet：受检查的编译视图或自有合并结果。
 * @ja Rml::StyleSheet：検証付きコンパイルビューまたは所有する結合結果。
 * @ko Rml::StyleSheet: 검증된 컴파일 뷰 또는 소유하는 결합 결과입니다.
 * @remarks
 * Get a view from a container, then combineStyleSheet for a mutable owned
 * sheet. Only owned combinations allow mergeStyleSheet and buildNodeIndex.
 * Shutdown invalidates both forms. Sprite metadata is copied.
 * @zh 从容器获取视图，再通过 combineStyleSheet 创建可修改的自有样式表。
 * 仅自有合并结果支持 mergeStyleSheet 和 buildNodeIndex。
 * shutdown 使两种形式均失效。精灵元数据为副本。
 * @ja コンテナーのビューを combineStyleSheet で結合すると変更可能になります。
 * mergeStyleSheet と buildNodeIndex は所有する結合結果のみで使用できます。
 * shutdown は両形式を無効にします。スプライト情報はコピーです。
 * @ko 컨테이너 뷰를 combineStyleSheet로 결합하면 수정 가능한 시트를 얻습니다.
 * mergeStyleSheet와 buildNodeIndex는 소유 결합 결과에서만 허용됩니다.
 * shutdown은 두 형식을 모두 무효화하며 스프라이트 정보는 사본입니다.
 */
export class StyleSheet {
  /** @internal */
  private constructor() {}

  /**
   * Invoke Rml::StyleSheet::CombineStyleSheet.
   *
   * @zh 调用 Rml::StyleSheet::CombineStyleSheet。
   * @ja Rml::StyleSheet::CombineStyleSheet を呼びます。
   * @ko Rml::StyleSheet::CombineStyleSheet를 호출합니다.
   * @param other - Later rules with higher precedence at equal specificity.
   * @zh other - 后续规则；特异性相同时优先级更高。
   * @ja other - 同じ詳細度では優先される後続ルール。
   * @ko other - 명시도가 같으면 우선하는 후속 규칙입니다.
   * @returns Owned sheet; call buildNodeIndex before element matching.
   * @zh 自有样式表；匹配元素前调用 buildNodeIndex。
   * @ja 所有シート。要素照合の前に buildNodeIndex を呼んでください。
   * @ko 소유 시트이며 요소 매칭 전에 buildNodeIndex를 호출하세요.
   */
  combineStyleSheet(other: StyleSheet): StyleSheet {
    return sheetFromNative(native.combineStyleSheet(
      styleSheetHandle(this), styleSheetHandle(other)));
  }

  /**
   * Invoke Rml::StyleSheet::MergeStyleSheet on an owned combination.
   *
   * @zh 在自有合并结果上调用 Rml::StyleSheet::MergeStyleSheet。
   * @ja 所有する結合結果で Rml::StyleSheet::MergeStyleSheet を呼びます。
   * @ko 소유 결합 결과에서 Rml::StyleSheet::MergeStyleSheet를 호출합니다.
   * @param other - Later rules; self-merge is rejected. Then rebuild the index.
   * @zh other - 后续规则；拒绝自身合并。完成后须重建索引。
   * @ja other - 後続ルール。自己マージ不可。完了後に索引を再構築します。
   * @ko other - 후속 규칙이며 자기 병합은 불가합니다.
   * 이후 인덱스를 재구축하세요.
   */
  mergeStyleSheet(other: StyleSheet): void {
    native.mergeStyleSheet(styleSheetHandle(this), styleSheetHandle(other));
  }

  /**
   * Invoke Rml::StyleSheet::BuildNodeIndex on an owned combination.
   *
   * @zh 在自有合并结果上调用 Rml::StyleSheet::BuildNodeIndex。
   * @ja 所有する結合結果で Rml::StyleSheet::BuildNodeIndex を呼びます。
   * @ko 소유 결합 결과에서 Rml::StyleSheet::BuildNodeIndex를 호출합니다.
   */
  buildNodeIndex(): void {
    native.styleSheetBuildNodeIndex(styleSheetHandle(this));
  }

  /**
   * Instance Rml::StyleSheet decorators using the supplied render manager.
   *
   * @zh 使用指定渲染管理器实例化 Rml::StyleSheet 装饰器。
   * @ja 指定した描画管理器で Rml::StyleSheet の装飾器を生成します。
   * @ko 지정한 렌더 관리자로 Rml::StyleSheet 장식기를 생성합니다.
   * @param manager - Manager that owns the decorator resources.
   * @zh manager - 持有装饰器资源的管理器。
   * @ja manager - 装飾器のリソースを所有する管理器。
   * @ko manager - 장식기 리소스를 소유하는 관리자입니다.
   * @param declarations - Parsed or constructed decorator declarations.
   * @zh declarations - 解析或构造的装饰器声明。
   * @ja declarations - 解析または構築した装飾器の宣言。
   * @ko declarations - 파싱하거나 구성한 장식기 선언입니다.
   * @param source - Optional declaration location for relative texture paths.
   * @zh source - 可选声明位置，用于解析纹理相对路径。
   * @ja source - テクスチャの相対パスに使う任意の宣言位置。
   * @ko source - 텍스처 상대 경로에 사용할 선택적 선언 위치입니다.
   * @returns Independent array of shared instances; empty on native failure.
   * @zh 共享实例的独立数组；原生实例化失败时返回空数组。
   * @ja 共有インスタンスの独立した配列。生成に失敗した場合は空の配列。
   * @ko 공유 인스턴스의 독립 배열이며 네이티브 생성 실패 시 빈 배열입니다.
   * @remarks
   * A nonempty declaration value caches instances by value, source path and
   * manager. An empty value creates fresh instances on every call.
   * @zh 非空声明文本按文本、来源路径及管理器缓存实例；空文本每次创建新实例。
   * @ja 宣言文字列が空でなければ文字列、参照元パス、管理器でキャッシュします。
   * 空の文字列では呼び出しごとに新しいインスタンスを作成します。
   * @ko 선언 문자열이 비어 있지 않으면 문자열, 원본 경로, 관리자로 캐시합니다.
   * 빈 문자열이면 호출할 때마다 새 인스턴스를 생성합니다.
   */
  instanceDecorators(
    manager: RenderManager, declarations: DecoratorList,
    source: PropertySource | null = null,
  ): Decorator[] {
    if (!(declarations instanceof DecoratorList)) {
      throw new TypeError('Expected decorator declarations');
    }
    return native.styleSheetInstanceDecorators(
      styleSheetHandle(this), renderManagerHandle(manager),
      effectValueToNative(declarations), source).map(decoratorFromNative);
  }

  /**
   * Match selectors through Rml::StyleSheet::GetElementDefinition.
   *
   * @zh 通过 Rml::StyleSheet::GetElementDefinition 匹配选择器。
   * @ja Rml::StyleSheet::GetElementDefinition でセレクターを照合します。
   * @ko Rml::StyleSheet::GetElementDefinition으로 선택자를 매칭합니다.
   * @param element - Element whose hierarchy, classes and states are matched.
   * @zh element - 匹配其层级、类名和状态的元素。
   * @ja element - 階層、クラス、状態を照合する要素。
   * @ko element - 계층, 클래스 및 상태를 매칭할 요소입니다.
   * @returns Immutable definition, or null without matches or for text nodes.
   * @zh 不可变定义；没有匹配或传入文本节点时为 null。
   * @ja 不変の定義。該当なし、またはテキスト要素の場合は null。
   * @ko 불변 정의이며 매칭이 없거나 텍스트 요소이면 null입니다.
   */
  getElementDefinition(element: Element): ElementDefinition | null {
    const handle = native.styleSheetGetElementDefinition(
      styleSheetHandle(this), element.handle);
    return handle === null ? null : elementDefinitionFromNative(handle);
  }

  /**
   * Copy Rml::StyleSheet::GetSprite metadata.
   *
   * @zh 复制 Rml::StyleSheet::GetSprite 返回的元数据。
   * @ja Rml::StyleSheet::GetSprite の情報をコピーします。
   * @ko Rml::StyleSheet::GetSprite의 정보를 복사합니다.
   * @param name - Sprite name.
   * @zh name - 精灵名称。
   * @ja name - スプライト名。
   * @ko name - 스프라이트 이름입니다.
   * @returns Independent metadata, or null when absent.
   * @zh 独立元数据；不存在时返回 null。
   * @ja 独立した情報。存在しない場合は null。
   * @ko 독립된 정보이며 없으면 null입니다.
   */
  getSprite(name: string): Sprite | null {
    return spriteFromNative(native.styleSheetGetSprite(
      styleSheetHandle(this), name));
  }

  /**
   * Copy Rml::StyleSheet::GetNamedDecorator.
   *
   * @zh 复制 Rml::StyleSheet::GetNamedDecorator 的结果。
   * @ja Rml::StyleSheet::GetNamedDecorator の結果をコピーします。
   * @ko Rml::StyleSheet::GetNamedDecorator의 결과를 복사합니다.
   * @param name - Name declared by an `@decorator` rule.
   * @zh name - `@decorator` 规则声明的名称。
   * @ja name - `@decorator` ルールが宣言する名前。
   * @ko name - `@decorator` 규칙으로 선언한 이름입니다.
   * @returns Independent metadata, or null when absent.
   * @zh 独立元数据；不存在时为 null。
   * @ja 独立した情報。存在しない場合は null。
   * @ko 독립된 정보이며 없으면 null입니다.
   */
  getNamedDecorator(name: string): NamedDecorator | null {
    const value = native.styleSheetGetNamedDecorator(
      styleSheetHandle(this), name);
    return value === null ? null : {
      type: value.type,
      instancer: decoratorInstancerFromNative(value.instancer),
      properties: propertyDictionaryFromNative(value.properties),
    };
  }

  /**
   * Copy Rml::StyleSheet::GetKeyframes, including property dictionaries.
   *
   * @zh 复制 Rml::StyleSheet::GetKeyframes 的结果及其属性字典。
   * @ja プロパティ辞書を含め Rml::StyleSheet::GetKeyframes をコピーします。
   * @ko 속성 사전을 포함해 Rml::StyleSheet::GetKeyframes를 복사합니다.
   * @param name - Animation name declared by `@keyframes`.
   * @zh name - `@keyframes` 声明的动画名称。
   * @ja name - `@keyframes` が宣言するアニメーション名。
   * @ko name - `@keyframes`로 선언한 애니메이션 이름입니다.
   * @returns Independent metadata, or null when absent.
   * @zh 独立元数据；不存在时为 null。
   * @ja 独立した情報。存在しない場合は null。
   * @ko 독립된 정보이며 없으면 null입니다.
   */
  getKeyframes(name: string): Keyframes | null {
    const value = native.styleSheetGetKeyframes(styleSheetHandle(this), name);
    return value === null ? null : {
      propertyIds: value.propertyIds,
      blocks: value.blocks.map(block => ({
        normalizedTime: block.normalizedTime,
        properties: propertyDictionaryFromNative(block.properties),
      })),
    };
  }
}

/**
 * Resolve an owned container handle.
 *
 * @internal
 * @param value - Public container.
 * @returns Native handle.
 */
export function containerHandle(value: StyleSheetContainer): object {
  const handle = containers.get(value);
  if (!handle) {
    throw new TypeError('Expected a stylesheet container');
  }
  return handle;
}

/**
 * Wrap a container without constructing another native object.
 *
 * @internal
 * @param handle - Native owner.
 * @returns Public container.
 */
export function containerFromNative(handle: object): StyleSheetContainer {
  const value = Object.create(StyleSheetContainer.prototype) as
    StyleSheetContainer;
  containers.set(value, handle);
  return value;
}

/**
 * Resolve a stylesheet handle.
 *
 * @internal
 * @param value - Public stylesheet.
 * @returns Native owner or checked view.
 */
export function styleSheetHandle(value: StyleSheet): object {
  const handle = sheets.get(value);
  if (!handle) {
    throw new TypeError('Expected a stylesheet');
  }
  return handle;
}

/**
 * Wrap a stylesheet owner or checked view.
 *
 * @internal
 * @param handle - Native stylesheet.
 * @returns Public stylesheet.
 */
export function sheetFromNative(handle: object): StyleSheet {
  const value = Object.create(StyleSheet.prototype) as StyleSheet;
  sheets.set(value, handle);
  return value;
}
