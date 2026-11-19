import { native } from '../../internal/native';
import { Element } from './element';
import { boxFromNative, type Box } from './box';
import { geometryFromNative, type Geometry } from '../../rendering/geometry';
import type { BoxArea } from './layout';
import type { VariantVector2 } from '../../values/types';

/**
 * Choose the reference edge or centre used to position an element.
 *
 * @zh Rml::ElementUtilities 的定位锚点。
 * @ja Rml::ElementUtilities の配置アンカー。
 * @ko Rml::ElementUtilities의 위치 기준점입니다.
 */
export enum PositionAnchor {
  /**
   * Top edge.
   *
   * @zh 上边。
   * @ja 上辺。
   * @ko 위쪽입니다.
   */
  Top = 1,
  /**
   * Bottom edge.
   *
   * @zh 下边。
   * @ja 下辺。
   * @ko 아래쪽입니다.
   */
  Bottom = 2,
  /**
   * Left edge.
   *
   * @zh 左边。
   * @ja 左辺。
   * @ko 왼쪽입니다.
   */
  Left = 4,
  /**
   * Right edge.
   *
   * @zh 右边。
   * @ja 右辺。
   * @ko 오른쪽입니다.
   */
  Right = 8,
  /**
   * Top-left corner.
   *
   * @zh 左上角。
   * @ja 左上隅。
   * @ko 왼쪽 위 모서리입니다.
   */
  TopLeft = 5,
  /**
   * Top-right corner.
   *
   * @zh 右上角。
   * @ja 右上隅。
   * @ko 오른쪽 위 모서리입니다.
   */
  TopRight = 9,
  /**
   * Bottom-left corner.
   *
   * @zh 左下角。
   * @ja 左下隅。
   * @ko 왼쪽 아래 모서리입니다.
   */
  BottomLeft = 6,
  /**
   * Bottom-right corner.
   *
   * @zh 右下角。
   * @ja 右下隅。
   * @ko 오른쪽 아래 모서리입니다.
   */
  BottomRight = 10,
}

/**
 * Rml::ClipMaskOperation, also used by clipping query snapshots.
 *
 * @zh Rml::ClipMaskOperation，也用于裁剪查询快照。
 * @ja クリップ取得のコピーにも使う Rml::ClipMaskOperation。
 * @ko 클리핑 조회 사본에도 사용하는 Rml::ClipMaskOperation입니다.
 */
export enum ClipMaskOperation {
  /**
   * Replace the mask with geometry.
   *
   * @zh 用几何替换蒙版。
   * @ja ジオメトリでマスクを置換します。
   * @ko 지오메트리로 마스크를 교체합니다.
   */
  Set = 0,
  /**
   * Replace the mask with inverse geometry.
   *
   * @zh 用反向几何替换蒙版。
   * @ja 反転ジオメトリでマスクを置換します。
   * @ko 반전 지오메트리로 마스크를 교체합니다.
   */
  SetInverse = 1,
  /**
   * Intersect geometry with the current mask.
   *
   * @zh 将几何与当前蒙版相交。
   * @ja 現在のマスクとジオメトリの共通部分を使います。
   * @ko 현재 마스크와 지오메트리의 교집합을 사용합니다.
   */
  Intersect = 2,
}

/**
 * Owned rectangle snapshot in window coordinates.
 *
 * @zh 窗口坐标中的独立矩形快照。
 * @ja ウィンドウ座標の独立した矩形コピー。
 * @ko 창 좌표의 독립적인 사각형 사본입니다.
 */
export interface ElementRectangle {
  /**
   * Top-left point.
   *
   * @zh 左上点。
   * @ja 左上の点。
   * @ko 왼쪽 위 점입니다.
   */
  p0: VariantVector2;

  /**
   * Bottom-right point.
   *
   * @zh 右下点。
   * @ja 右下の点。
   * @ko 오른쪽 아래 점입니다.
   */
  p1: VariantVector2;
}

/**
 * Owned copy of Rml::ClipMaskGeometry; no borrowed element pointers.
 *
 * @zh Rml::ClipMaskGeometry 的独立副本，不借用元素指针。
 * @ja 要素ポインターを借用しない Rml::ClipMaskGeometry の所有コピー。
 * @ko 요소 포인터를 빌리지 않는 Rml::ClipMaskGeometry의 소유 사본입니다.
 */
export interface ClipMaskGeometry {
  /**
   * Native mask operation.
   *
   * @zh 原生蒙版操作。
   * @ja ネイティブマスク操作。
   * @ko 네이티브 마스크 연산입니다.
   */
  operation: ClipMaskOperation;

  /**
   * Independently owned geometry; release when finished.
   *
   * @zh 独立持有的几何；使用完毕后释放。
   * @ja 独立所有のジオメトリ。使用後に解放します。
   * @ko 독립 소유 지오메트리이며 사용 후 해제하세요.
   */
  geometry: Geometry;

  /**
   * Rounded absolute border offset.
   *
   * @zh 取整后的绝对边框偏移。
   * @ja 丸めた絶対ボーダーオフセット。
   * @ko 반올림한 절대 테두리 오프셋입니다.
   */
  absoluteOffset: VariantVector2;

  /**
   * Copied column-major 4×4 matrix, or null for identity.
   *
   * @zh 复制的列主序 4×4 矩阵；null 表示单位变换。
   * @ja 列優先 4×4 行列のコピー。null は単位変換。
   * @ko 열 우선 4×4 행렬 사본이며 null은 단위 변환입니다.
   */
  transform: Float32Array | null;
}

/**
 * Both native clipping outputs; a mask can exist without a scissor region.
 *
 * @zh 原生裁剪的两类输出；没有矩形区域时仍可能存在蒙版。
 * @ja ネイティブの両クリップ出力。矩形領域がなくてもマスクはあり得ます。
 * @ko 두 네이티브 클리핑 출력이며 영역이 없어도 마스크가 있을 수 있습니다.
 */
export interface ElementClippingRegion {
  /**
   * Integer scissor rectangle, or null when upstream returns false.
   *
   * @zh 整数裁剪矩形；上游返回 false 时为 null。
   * @ja 整数シザー矩形。ネイティブが false を返す場合は null。
   * @ko 정수 시저 사각형이며 네이티브가 false를 반환하면 null입니다.
   */
  region: ElementRectangle | null;

  /**
   * Owned masks; empty when the optional mask output was not requested.
   *
   * @zh 自有蒙版；未请求可选蒙版输出时为空。
   * @ja 所有マスク。任意マスク出力を要求しない場合は空。
   * @ko 소유 마스크이며 선택적 마스크 출력을 요청하지 않으면 비어 있습니다.
   */
  clipMask: ClipMaskGeometry[];
}

/**
 * Checked static Rml::ElementUtilities operations.
 *
 * @zh 带有效性检查的静态 Rml::ElementUtilities 操作。
 * @ja 有効性を検証する静的 Rml::ElementUtilities 操作。
 * @ko 유효성을 검사하는 정적 Rml::ElementUtilities 연산입니다.
 */
export class ElementUtilities {
  /**
   * Static utility class.
   *
   * @zh 静态工具类。
   * @ja 静的ユーティリティクラス。
   * @ko 정적 유틸리티 클래스입니다.
   */
  private constructor() {}

  /**
   * Search by ID breadth-first, including the root element.
   *
   * @zh 按 ID 广度优先搜索，包含根元素。
   * @ja ルートを含めて ID を幅優先で検索します。
   * @ko 루트를 포함하여 ID를 너비 우선으로 검색합니다.
   * @param root - First element to check.
   * @zh root - 首个检查元素。
   * @ja root - 最初に調べる要素。
   * @ko root - 처음 확인할 요소입니다.
   * @param id - Exact ID.
   * @zh id - 完整 ID。
   * @ja id - 完全一致の ID。
   * @ko id - 정확한 ID입니다.
   * @returns Canonical live wrapper, or null.
   * @zh 规范化的有效包装器或 null。
   * @ja 同一性を保持する有効なラッパー、または null。
   * @ko 동일성을 유지하는 유효 래퍼 또는 null입니다.
   */
  static getElementById(root: Element, id: string): Element | null {
    const handle = native.utilitiesGetElementById(root.handle, id);
    return handle === null ? null : Element.wrap(handle);
  }

  /**
   * Search descendants breadth-first; stop-tag nodes are still checked.
   *
   * @zh 广度优先搜索后代；停止标签节点本身仍会匹配。
   * @ja 子孫を幅優先で検索。停止タグのノード自体は検査します。
   * @ko 자손을 너비 우선으로 검색하며 중지 태그 노드 자체는 확인합니다.
   * @param root - Root excluded from matching.
   * @zh root - 根节点不参与匹配。
   * @ja root - 検索結果から除外するルート。
   * @ko root - 일치 검사에서 제외할 루트입니다.
   * @param tag - Exact tag.
   * @zh tag - 完整标签。
   * @ja tag - 完全一致のタグ。
   * @ko tag - 정확한 태그입니다.
   * @param stopTag - Do not enter its descendants; defaults to empty.
   * @zh stopTag - 不进入此标签的后代；默认空字符串。
   * @ja stopTag - このタグの子孫には入りません。既定値は空文字列。
   * @ko stopTag - 해당 태그의 자손에 진입하지 않으며 기본값은 빈 문자열입니다.
   * @returns Snapshot of live wrappers.
   * @zh 有效包装器的列表快照。
   * @ja 有効なラッパーの配列コピー。
   * @ko 유효 래퍼 목록 사본입니다.
   */
  static getElementsByTagName(
    root: Element, tag: string, stopTag = '',
  ): Element[] {
    return native.utilitiesGetElementsByTagName(root.handle, tag, stopTag)
      .map(handle => Element.wrap(handle));
  }

  /**
   * Search descendant classes breadth-first, excluding the root.
   *
   * @zh 广度优先搜索后代类名，不包含根节点。
   * @ja ルートを除く子孫のクラスを幅優先で検索します。
   * @ko 루트를 제외한 자손 클래스를 너비 우선으로 검색합니다.
   * @param root - Search root.
   * @zh root - 搜索根节点。
   * @ja root - 検索ルート。
   * @ko root - 검색 루트입니다.
   * @param className - Exact class name.
   * @zh className - 完整类名。
   * @ja className - 完全一致のクラス名。
   * @ko className - 정확한 클래스 이름입니다.
   * @returns Snapshot of live wrappers.
   * @zh 有效包装器的列表快照。
   * @ja 有効なラッパーの配列コピー。
   * @ko 유효 래퍼 목록 사본입니다.
   */
  static getElementsByClassName(root: Element, className: string): Element[] {
    return native.utilitiesGetElementsByClassName(root.handle, className)
      .map(handle => Element.wrap(handle));
  }

  /**
   * Read context density, or 1 for a detached element.
   *
   * @zh 读取上下文密度；脱离上下文时为 1。
   * @ja コンテキスト密度を取得。切り離された要素は 1。
   * @ko 컨텍스트 밀도를 읽으며 분리된 요소는 1입니다.
   * @param element - Checked element.
   * @zh element - 有效元素。
   * @ja element - 検証する要素。
   * @ko element - 확인할 요소입니다.
   * @returns Density-independent pixel ratio.
   * @zh 密度独立像素比例。
   * @ja 密度非依存ピクセル比。
   * @ko 밀도 독립 픽셀 비율입니다.
   */
  static getDensityIndependentPixelRatio(element: Element): number {
    return native.utilitiesGetDensityIndependentPixelRatio(element.handle);
  }

  /**
   * Measure UTF-8 text with the element's font and shaping context.
   *
   * @zh 使用元素字体和塑形上下文测量 UTF-8 文本。
   * @ja 要素のフォントと整形コンテキストで UTF-8 テキストを測定します。
   * @ko 요소의 글꼴과 셰이핑 컨텍스트로 UTF-8 텍스트를 측정합니다.
   * @param element - Font source.
   * @zh element - 字体来源。
   * @ja element - フォントの取得元。
   * @ko element - 글꼴 원본입니다.
   * @param text - Text to measure.
   * @zh text - 待测文本。
   * @ja text - 測定するテキスト。
   * @ko text - 측정할 텍스트입니다.
   * @param priorCharacter - Preceding Unicode scalar for kerning; default 0.
   * @zh priorCharacter - 字距调整的前置 Unicode 标量；默认 0。
   * @ja priorCharacter - カーニング用の先行 Unicode スカラー。既定値 0。
   * @ko priorCharacter - 커닝을 위한 앞선 Unicode 스칼라이며 기본값은 0입니다.
   * @returns Integer pixel width; zero when no native font is selected.
   * @zh 整数像素宽度；未选择原生字体时为零。
   * @ja 整数ピクセル幅。ネイティブフォントがない場合はゼロ。
   * @ko 정수 픽셀 너비이며 네이티브 글꼴이 선택되지 않으면 0입니다.
   */
  static getStringWidth(
    element: Element, text: string, priorCharacter = 0,
  ): number {
    return native.utilitiesGetStringWidth(element.handle, text, priorCharacter);
  }

  /**
   * Generate the native scissor and optional owned mask snapshots.
   *
   * @zh 生成原生裁剪矩形及可选的自有蒙版快照。
   * @ja ネイティブシザーと任意の所有マスクコピーを生成します。
   * @ko 네이티브 시저와 선택적 소유 마스크 사본을 생성합니다.
   * @param element - Target; mask output requires an attached context.
   * @zh element - 目标；蒙版输出需要已关联的上下文。
   * @ja element - 対象。マスク出力にはコンテキストが必要です。
   * @ko element - 대상이며 마스크 출력에는 연결된 컨텍스트가 필요합니다.
   * @param includeClipMask - Request masks; defaults to false.
   * @zh includeClipMask - 请求蒙版；默认 false。
   * @ja includeClipMask - マスクを要求。既定値 false。
   * @ko includeClipMask - 마스크 요청이며 기본값은 false입니다.
   * @param forceClipSelf - Include the target's border area; default false.
   * @zh forceClipSelf - 包含目标边框区域；默认 false。
   * @ja forceClipSelf - 対象のボーダー領域を含める。既定値 false。
   * @ko forceClipSelf - 대상 테두리 영역 포함이며 기본값은 false입니다.
   * @returns Region and masks; geometry stays valid until release or shutdown.
   * @zh 区域及蒙版；几何在主动释放或运行时关闭前保持有效。
   * @ja 領域とマスク。ジオメトリは解放または終了まで有効です。
   * @ko 영역과 마스크이며 지오메트리는 해제 또는 종료까지 유효합니다.
   */
  static getClippingRegion(
    element: Element, includeClipMask = false, forceClipSelf = false,
  ): ElementClippingRegion {
    const result = native.utilitiesGetClippingRegion(
      element.handle, includeClipMask, forceClipSelf);
    return {
      region: result.region,
      clipMask: result.clipMask.map(mask => ({
        ...mask, geometry: geometryFromNative(mask.geometry),
      })),
    };
  }

  /**
   * Submit clipping from the element and its ancestors to the render manager.
   *
   * @zh 将元素及祖先裁剪提交至渲染管理器。
   * @ja 要素と祖先のクリップを描画管理器に送信します。
   * @ko 요소와 상위 요소의 클리핑을 렌더 관리자에 제출합니다.
   * @param element - Target.
   * @zh element - 目标。
   * @ja element - 対象。
   * @ko element - 대상입니다.
   * @param forceClipSelf - Include target border area; default false.
   * @zh forceClipSelf - 包含目标边框区域；默认 false。
   * @ja forceClipSelf - 対象のボーダー領域を含める。既定値 false。
   * @ko forceClipSelf - 대상 테두리 영역 포함이며 기본값은 false입니다.
   * @returns Native visibility result; false without a context.
   * @zh 原生可见性结果；没有上下文时为 false。
   * @ja ネイティブ可視性。コンテキストがなければ false。
   * @ko 네이티브 가시성 결과이며 컨텍스트가 없으면 false입니다.
   */
  static setClippingRegion(element: Element, forceClipSelf = false): boolean {
    return native.utilitiesSetClippingRegion(element.handle, forceClipSelf);
  }

  /**
   * Project box bounds into window space; Auto includes box-shadow overflow.
   *
   * @zh 将盒边界投影至窗口坐标；Auto 包含 box-shadow 溢出。
   * @ja ボックス境界を投影。Auto は box-shadow のはみ出しを含みます。
   * @ko 상자 경계를 창에 투영하며 Auto는 box-shadow 넘침을 포함합니다.
   * @param element - Target.
   * @zh element - 目标。
   * @ja element - 対象。
   * @ko element - 대상입니다.
   * @param area - Required native box area, including Auto.
   * @zh area - 必填原生盒区域，可用 Auto。
   * @ja area - 必須のネイティブ領域。Auto も使用可能。
   * @ko area - 필수 네이티브 영역이며 Auto도 가능합니다.
   * @returns Owned bounds, or null if native projection fails.
   * @zh 独立边界；原生投影失败时为 null。
   * @ja 所有境界。ネイティブ投影失敗時は null。
   * @ko 소유 경계이며 네이티브 투영 실패 시 null입니다.
   */
  static getBoundingBox(
    element: Element, area: BoxArea,
  ): ElementRectangle | null {
    return native.utilitiesGetBoundingBox(element.handle, area);
  }

  /**
   * Lay out element contents through Rml::ElementUtilities::FormatElement.
   *
   * @zh 通过原生 FormatElement 排版元素内容。
   * @ja ネイティブ FormatElement で要素の内容を配置します。
   * @ko 네이티브 FormatElement로 요소 콘텐츠를 배치합니다.
   * @param element - Target; useful for custom non-DOM content.
   * @zh element - 目标；适用于自定义非 DOM 内容。
   * @ja element - 対象。独自の非 DOM 内容に使用できます。
   * @ko element - 대상이며 사용자 지정 비 DOM 콘텐츠에 유용합니다.
   * @param containingBlock - Finite nonnegative containing dimensions.
   * @zh containingBlock - 有限且非负的容纳块尺寸。
   * @ja containingBlock - 有限で非負の包含ブロックサイズ。
   * @ko containingBlock - 유한한 음이 아닌 포함 블록 크기입니다.
   */
  static formatElement(
    element: Element, containingBlock: VariantVector2,
  ): void {
    native.utilitiesFormatElement(element.handle, containingBlock);
  }

  /**
   * Build an owned box snapshot without setting the target's box.
   *
   * @zh 构造自有盒快照，不设置目标元素的盒。
   * @ja 対象に設定せず、所有ボックスコピーを構築します。
   * @ko 대상 상자를 설정하지 않고 소유 상자 사본을 구성합니다.
   * @param containingBlock - Finite nonnegative containing dimensions.
   * @zh containingBlock - 有限且非负的容纳块尺寸。
   * @ja containingBlock - 有限で非負の包含ブロックサイズ。
   * @ko containingBlock - 유한한 음이 아닌 포함 블록 크기입니다.
   * @param element - Target.
   * @zh element - 目标。
   * @ja element - 対象。
   * @ko element - 대상입니다.
   * @param inlineElement - Use native inline sizing; default false.
   * @zh inlineElement - 使用原生行内尺寸规则；默认 false。
   * @ja inlineElement - ネイティブインラインサイズ規則。既定値 false。
   * @ko inlineElement - 네이티브 인라인 크기 규칙이며 기본값은 false입니다.
   * @returns Independent mutable box.
   * @zh 独立可变盒。
   * @ja 独立した変更可能なボックス。
   * @ko 독립적인 변경 가능한 상자입니다.
   */
  static buildBox(
    containingBlock: VariantVector2, element: Element, inlineElement = false,
  ): Box {
    return boxFromNative(native.utilitiesBuildBox(
      containingBlock, element.handle, inlineElement));
  }

  /**
   * Size and position an element relative to its parent's content area.
   *
   * @zh 相对父元素内容区域设置元素尺寸和位置。
   * @ja 親の内容領域を基準に要素のサイズと位置を設定します。
   * @ko 상위 요소 콘텐츠 영역을 기준으로 크기와 위치를 설정합니다.
   * @param element - Target.
   * @zh element - 目标。
   * @ja element - 対象。
   * @ko element - 대상입니다.
   * @param offset - Finite border offset.
   * @zh offset - 有限边框偏移。
   * @ja offset - 有限のボーダーオフセット。
   * @ko offset - 유한한 테두리 오프셋입니다.
   * @param anchor - Native edge or corner; required.
   * @zh anchor - 必填原生边或角锚点。
   * @ja anchor - 必須のネイティブ辺・隅アンカー。
   * @ko anchor - 필수 네이티브 가장자리 또는 모서리 기준점입니다.
   * @returns False if no parent exists.
   * @zh 无父元素时为 false。
   * @ja 親がなければ false。
   * @ko 상위 요소가 없으면 false입니다.
   */
  static positionElement(
    element: Element, offset: VariantVector2, anchor: PositionAnchor,
  ): boolean {
    return native.utilitiesPositionElement(element.handle, offset, anchor);
  }

  /**
   * Submit accumulated native perspective and transform to the render manager.
   *
   * @zh 将累积的原生透视和变换提交至渲染管理器。
   * @ja 累積ネイティブ透視・変換を描画管理器に送信します。
   * @ko 누적 네이티브 원근과 변환을 렌더 관리자에 제출합니다.
   * @param element - Target.
   * @zh element - 目标。
   * @ja element - 対象。
   * @ko element - 대상입니다.
   * @returns False without a context.
   * @zh 无上下文时为 false。
   * @ja コンテキストがなければ false。
   * @ko 컨텍스트가 없으면 false입니다.
   */
  static applyTransform(element: Element): boolean {
    return native.utilitiesApplyTransform(element.handle);
  }

  /**
   * Construct data views/controllers from attributes under an active model.
   *
   * @zh 在活动模型下从属性构造数据视图和控制器。
   * @ja 有効なモデルで属性からデータビュー・コントローラーを作成します。
   * @ko 활성 모델에서 속성으로 데이터 뷰와 컨트롤러를 생성합니다.
   * @param element - Target.
   * @zh element - 目标。
   * @ja element - 対象。
   * @ko element - 대상입니다.
   * @returns True if constructed; false when no model or binding applies.
   * @zh 已构造时为 true；没有模型或适用绑定时为 false。
   * @ja 構築時 true。モデルや対象バインディングがなければ false。
   * @ko 생성되면 true이며 모델이나 적용할 바인딩이 없으면 false입니다.
   */
  static applyDataViewsControllers(element: Element): boolean {
    return native.utilitiesApplyDataViewsControllers(element.handle);
  }
}
