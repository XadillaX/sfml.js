import type { FontFaceHandle } from '../internal/computed';
import type {
  CustomFontMetrics, FontShapingParameters,
} from './font-engine-custom';
import type { FontEffect } from './font-effect';
import type { GeneratedString } from './font-engine';
import type { RenderManager } from '../rendering/render-manager';
import type { VariantVector2 } from '../values/types';
import type { VertexColour } from '../rendering/vertex';

/**
 * Synchronous provider lifecycle hook.
 *
 * @zh 同步字体生命周期回调。
 * @ja 同期の書体ライフサイクルフック。
 * @ko 동기 서체 수명 주기 콜백입니다.
 */
export interface FontLifecycleCallback {
  /**
   * Initialize, shut down, or release provider resources.
   *
   * @zh 初始化、关闭或释放字体资源。
   * @ja 書体リソースを初期化、終了、解放します。
   * @ko 서체 자원을 초기화하거나 종료하거나 해제합니다.
   */
  (): void;
}

/**
 * File metadata loading hook.
 *
 * @zh 文件元数据加载回调。
 * @ja ファイルメタデータ読み込みフック。
 * @ko 파일 메타데이터 로드 콜백입니다.
 */
export interface FontLoadCallback {
  /**
   * Load a face using its embedded metadata.
   *
   * @zh 使用内嵌元数据加载字体。
   * @ja 埋め込みメタデータで書体を読み込みます。
   * @ko 포함된 메타데이터로 서체를 로드합니다.
   * @param path - Font file path.
   * @zh path - 字体文件路径。
   * @ja path - 書体ファイルのパス。
   * @ko path - 서체 파일 경로입니다.
   * @param faceIndex - Collection face index.
   * @zh faceIndex - 字体集合索引。
   * @ja faceIndex - コレクション内の書体番号。
   * @ko faceIndex - 서체 모음의 인덱스입니다.
   * @param fallback - Enable fallback lookup.
   * @zh fallback - 是否启用备用字体查找。
   * @ja fallback - 代替書体検索の有効化。
   * @ko fallback - 대체 서체 검색 활성화 여부입니다.
   * @param weight - Native font weight.
   * @zh weight - 原生字体粗细。
   * @ja weight - ネイティブの書体ウェイト。
   * @ko weight - 네이티브 서체 굵기입니다.
   * @returns True if the face loaded.
   * @zh 字体加载成功时返回 true。
   * @ja 読み込み成功時は true。
   * @ko 로드에 성공하면 true입니다.
   */
  (path: string, faceIndex: number, fallback: boolean, weight: number): boolean;
}

/**
 * Explicitly named file loading hook.
 *
 * @zh 指定名称的字体文件加载回调。
 * @ja 名前を指定するファイル読み込みフック。
 * @ko 이름 지정 서체 파일 로드 콜백입니다.
 */
export interface FontLoadNamedCallback {
  /**
   * Load a face with explicit family and style.
   *
   * @zh 使用指定字体族和样式加载字体。
   * @ja ファミリーとスタイルを指定して書体を読み込みます。
   * @ko 패밀리와 스타일을 지정하여 서체를 로드합니다.
   * @param path - Font file path.
   * @zh path - 字体文件路径。
   * @ja path - 書体ファイルのパス。
   * @ko path - 서체 파일 경로입니다.
   * @param faceIndex - Collection face index.
   * @zh faceIndex - 字体集合索引。
   * @ja faceIndex - コレクション内の書体番号。
   * @ko faceIndex - 서체 모음의 인덱스입니다.
   * @param family - Requested family.
   * @zh family - 请求的字体族。
   * @ja family - 要求された書体ファミリー。
   * @ko family - 요청한 서체 패밀리입니다.
   * @param style - Native font style.
   * @zh style - 原生字体样式。
   * @ja style - ネイティブの書体スタイル。
   * @ko style - 네이티브 서체 스타일입니다.
   * @param weight - Native font weight.
   * @zh weight - 原生字体粗细。
   * @ja weight - ネイティブの書体ウェイト。
   * @ko weight - 네이티브 서체 굵기입니다.
   * @param fallback - Enable fallback lookup.
   * @zh fallback - 是否启用备用字体查找。
   * @ja fallback - 代替書体検索の有効化。
   * @ko fallback - 대체 서체 검색 활성화 여부입니다.
   * @returns True if the face loaded.
   * @zh 字体加载成功时返回 true。
   * @ja 読み込み成功時は true。
   * @ko 로드에 성공하면 true입니다.
   */
  (
    path: string, faceIndex: number, family: string, style: number,
    weight: number, fallback: boolean,
  ): boolean;
}

/**
 * Snapshot-based memory loading hook.
 *
 * @zh 使用内存快照加载字体的回调。
 * @ja メモリスナップショットによる読み込みフック。
 * @ko 메모리 스냅샷 기반 로드 콜백입니다.
 */
export interface FontLoadMemoryCallback {
  /**
   * Load a face from independent font bytes.
   *
   * @zh 从独立的字体字节快照加载字体。
   * @ja 独立した書体バイト列から読み込みます。
   * @ko 독립된 서체 바이트 스냅샷에서 로드합니다.
   * @param bytes - Independent font data snapshot.
   * @zh bytes - 独立的字体数据快照。
   * @ja bytes - 独立した書体データのスナップショット。
   * @ko bytes - 독립된 서체 데이터 스냅샷입니다.
   * @param faceIndex - Collection face index.
   * @zh faceIndex - 字体集合索引。
   * @ja faceIndex - コレクション内の書体番号。
   * @ko faceIndex - 서체 모음의 인덱스입니다.
   * @param family - Requested family.
   * @zh family - 请求的字体族。
   * @ja family - 要求された書体ファミリー。
   * @ko family - 요청한 서체 패밀리입니다.
   * @param style - Native font style.
   * @zh style - 原生字体样式。
   * @ja style - ネイティブの書体スタイル。
   * @ko style - 네이티브 서체 스타일입니다.
   * @param weight - Native font weight.
   * @zh weight - 原生字体粗细。
   * @ja weight - ネイティブの書体ウェイト。
   * @ko weight - 네이티브 서체 굵기입니다.
   * @param fallback - Enable fallback lookup.
   * @zh fallback - 是否启用备用字体查找。
   * @ja fallback - 代替書体検索の有効化。
   * @ko fallback - 대체 서체 검색 활성화 여부입니다.
   * @returns True if the face loaded.
   * @zh 字体加载成功时返回 true。
   * @ja 読み込み成功時は true。
   * @ko 로드에 성공하면 true입니다.
   */
  (
    bytes: Uint8Array, faceIndex: number, family: string, style: number,
    weight: number, fallback: boolean,
  ): boolean;
}

/**
 * Provider-owned face selection hook.
 *
 * @zh 选择本 provider 字体令牌的回调。
 * @ja プロバイダー所有の書体選択フック。
 * @ko 공급자 소유 서체 선택 콜백입니다.
 */
export interface FontFaceCallback {
  /**
   * Select a registered face for the request.
   *
   * @zh 为请求选择已注册字体。
   * @ja 要求に対応する登録済み書体を選びます。
   * @ko 요청에 맞는 등록된 서체를 선택합니다.
   * @param family - Requested family.
   * @zh family - 请求的字体族。
   * @ja family - 要求された書体ファミリー。
   * @ko family - 요청한 서체 패밀리입니다.
   * @param style - Native font style.
   * @zh style - 原生字体样式。
   * @ja style - ネイティブの書体スタイル。
   * @ko style - 네이티브 서체 스타일입니다.
   * @param weight - Native font weight.
   * @zh weight - 原生字体粗细。
   * @ja weight - ネイティブの書体ウェイト。
   * @ko weight - 네이티브 서체 굵기입니다.
   * @param size - Requested pixel size.
   * @zh size - 请求的像素大小。
   * @ja size - 要求されたピクセルサイズ。
   * @ko size - 요청한 픽셀 크기입니다.
   * @returns Owned face token, or null if unavailable.
   * @zh 返回本 provider 的字体令牌；不可用时返回 null。
   * @ja 所有する書体トークン、未対応なら null。
   * @ko 소유한 서체 토큰이며 사용할 수 없으면 null입니다.
   */
  (
    family: string, style: number, weight: number, size: number,
  ): FontFaceHandle | null;
}

/**
 * Opaque font effect preparation hook.
 *
 * @zh 不透明字体特效数据准备回调。
 * @ja 不透明な書体効果データの準備フック。
 * @ko 불투명 서체 효과 데이터 준비 콜백입니다.
 */
export interface FontEffectsCallback {
  /**
   * Prepare effect data retained by the provider.
   *
   * @zh 准备由 provider 保活的特效数据。
   * @ja プロバイダーが保持する効果データを準備します。
   * @ko 공급자가 유지하는 효과 데이터를 준비합니다.
   * @param face - Owned face token.
   * @zh face - 本 provider 的字体令牌。
   * @ja face - 所有する書体トークン。
   * @ko face - 소유한 서체 토큰입니다.
   * @param effects - Requested font effects.
   * @zh effects - 请求的字体特效。
   * @ja effects - 要求された書体効果。
   * @ko effects - 요청한 서체 효과입니다.
   * @returns Retained opaque data, or null for no effects.
   * @zh 保活的不透明数据；无特效时返回 null。
   * @ja 保持する不透明データ、効果なしなら null。
   * @ko 유지할 불투명 데이터이며 효과가 없으면 null입니다.
   */
  (face: FontFaceHandle, effects: readonly FontEffect[]): object | null;
}

/**
 * Font metrics refresh hook.
 *
 * @zh 字体度量刷新回调。
 * @ja 書体メトリクスの更新フック。
 * @ko 서체 메트릭 갱신 콜백입니다.
 */
export interface FontMetricsCallback {
  /**
   * Supply metrics copied into the Native face.
   *
   * @zh 提供复制到原生字体的度量。
   * @ja ネイティブ書体にコピーするメトリクスを返します。
   * @ko 네이티브 서체에 복사할 메트릭을 제공합니다.
   * @param face - Owned face token.
   * @zh face - 本 provider 的字体令牌。
   * @ja face - 所有する書体トークン。
   * @ko face - 소유한 서체 토큰입니다.
   * @returns Finite font metrics with positive integer pixel size.
   * @zh 有限度量，像素大小必须为正整数。
   * @ja 有限のメトリクス。ピクセルサイズは正の整数。
   * @ko 유한한 메트릭이며 픽셀 크기는 양의 정수입니다.
   */
  (face: FontFaceHandle): CustomFontMetrics;
}

/**
 * Compatibility single-string measurement hook.
 *
 * @zh 兼容的逐文本测量回调。
 * @ja 互換の単一文字列計測フック。
 * @ko 호환 단일 문자열 측정 콜백입니다.
 */
export interface FontWidthCallback {
  /**
   * Measure one string synchronously.
   *
   * @zh 同步测量单条文本。
   * @ja 一つの文字列を同期で計測します。
   * @ko 문자열 하나를 동기로 측정합니다.
   * @param face - Owned face token.
   * @zh face - 本 provider 的字体令牌。
   * @ja face - 所有する書体トークン。
   * @ko face - 소유한 서체 토큰입니다.
   * @param string - Independent text snapshot.
   * @zh string - 独立的文本快照。
   * @ja string - 独立したテキストのスナップショット。
   * @ko string - 독립된 텍스트 스냅샷입니다.
   * @param shaping - Frozen shaping argument snapshot.
   * @zh shaping - 冻结的排版参数快照。
   * @ja shaping - 凍結されたシェーピング引数。
   * @ko shaping - 동결된 셰이핑 인수 스냅샷입니다.
   * @param priorCharacter - Previous Unicode codepoint, or zero.
   * @zh priorCharacter - 前一码点，未指定时为零。
   * @ja priorCharacter - 直前のコードポイント、省略時はゼロ。
   * @ko priorCharacter - 이전 코드포인트이며 생략하면 0입니다.
   * @returns Signed int32 pixel width.
   * @zh 有符号 int32 像素宽度。
   * @ja 符号付き int32 のピクセル幅。
   * @ko 부호 있는 int32 픽셀 너비입니다.
   */
  (
    face: FontFaceHandle, string: string, shaping: FontShapingParameters,
    priorCharacter: number,
  ): number;
}

/**
 * Compatibility bulk text measurement hook.
 *
 * @zh 兼容的批量文本测量回调。
 * @ja 互換の一括テキスト計測フック。
 * @ko 호환 일괄 텍스트 측정 콜백입니다.
 */
export interface FontWidthsCallback {
  /**
   * Measure independent string snapshots in one call.
   *
   * @zh 一次调用测量独立的文本快照。
   * @ja 独立した文字列を一回で計測します。
   * @ko 독립된 문자열 스냅샷을 한 번에 측정합니다.
   * @param face - Owned face token.
   * @zh face - 本 provider 的字体令牌。
   * @ja face - 所有する書体トークン。
   * @ko face - 소유한 서체 토큰입니다.
   * @param strings - Text snapshots in output order.
   * @zh strings - 按输出顺序排列的文本快照。
   * @ja strings - 出力順のテキストスナップショット。
   * @ko strings - 출력 순서의 텍스트 스냅샷입니다.
   * @param shaping - Frozen shaping argument snapshot.
   * @zh shaping - 冻结的排版参数快照。
   * @ja shaping - 凍結されたシェーピング引数。
   * @ko shaping - 동결된 셰이핑 인수 스냅샷입니다.
   * @param priorCharacter - Previous Unicode codepoint, or zero.
   * @zh priorCharacter - 前一码点，未指定时为零。
   * @ja priorCharacter - 直前のコードポイント、省略時はゼロ。
   * @ko priorCharacter - 이전 코드포인트이며 생략하면 0입니다.
   * @returns Attached fixed Int32Array matching the string count.
   * @zh 返回已附加的固定 Int32Array，长度等于文本数。
   * @ja 文字列数と等長の接続済み固定 Int32Array。
   * @ko 문자열 수와 길이가 같은 연결된 고정 Int32Array입니다.
   */
  (
    face: FontFaceHandle, strings: readonly string[],
    shaping: FontShapingParameters, priorCharacter: number,
  ): Int32Array;
}

/**
 * Native-owned reusable packed measurement workspace.
 *
 * @zh Native 持有并复用的紧凑测量工作区。
 * @ja ネイティブ所有の再利用可能な計測バッファ。
 * @ko 네이티브 소유의 재사용 가능한 압축 측정 작업 공간입니다.
 * @remarks Active input is snapshotted before the callback. Only widths
 * should be written. Storage is reused by later calls and replaced on growth
 * or detachment; retained old views remain memory-safe after replacement.
 * @zh 调用前复制有效输入，只应写入 widths。后续调用复用存储，
 * 扩容或分离时替换存储；保留的旧视图在替换后仍然内存安全。
 * @ja 呼び出し前に入力をコピーします。widths のみ書き込み、後続の呼び出しで再利用します。
 * @ko 호출 전에 입력을 복사합니다. widths만 쓰며 후속 호출에서 저장소를 재사용합니다.
 */
export interface PackedFontMeasurement {
  /**
   * Packed UTF-8 snapshot; active end is offsets[count].
   *
   * @zh 紧凑 UTF-8 快照，有效末端为 offsets[count]。
   * @ja UTF-8 スナップショット。有効な末尾は offsets[count]。
   * @ko UTF-8 스냅샷이며 유효 끝은 offsets[count]입니다.
   */
  readonly bytes: Uint8Array;

  /**
   * Native-owned ordered string boundaries.
   *
   * @zh Native 持有的有序文本边界。
   * @ja ネイティブ所有の順序付き文字列境界。
   * @ko 네이티브 소유의 정렬된 문자열 경계입니다.
   */
  readonly offsets: Uint32Array;

  /**
   * Native-owned int32 results; write the first count entries.
   *
   * @zh Native 持有的 int32 结果，写入前 count 项。
   * @ja ネイティブ所有の int32 結果。先頭 count 件を書き込みます。
   * @ko 네이티브 소유의 int32 결과이며 처음 count개를 씁니다.
   */
  readonly widths: Int32Array;
}

/**
 * One packed callback without per-string JS conversion.
 *
 * @zh 不逐文本创建 JS 字符串的单次紧凑回调。
 * @ja 文字列ごとの JS 変換が不要な一括フック。
 * @ko 문자열별 JS 변환이 없는 단일 압축 콜백입니다.
 */
export interface FontMeasureCallback {
  /**
   * Fill all active widths synchronously.
   *
   * @zh 同步填充全部有效宽度。
   * @ja 全ての有効な幅を同期で書き込みます。
   * @ko 모든 유효 너비를 동기로 채웁니다.
   * @param face - Owned face token.
   * @zh face - 本 provider 的字体令牌。
   * @ja face - 所有する書体トークン。
   * @ko face - 소유한 서체 토큰입니다.
   * @param buffer - Reusable Native snapshot and result workspace.
   * @zh buffer - 复用的原生快照与结果工作区。
   * @ja buffer - 再利用するネイティブの入力と結果バッファ。
   * @ko buffer - 재사용할 네이티브 스냅샷과 결과 작업 공간입니다.
   * @param count - Active strings and output entries.
   * @zh count - 有效文本数及输出项数。
   * @ja count - 有効な文字列と出力の件数。
   * @ko count - 유효 문자열과 출력 항목 수입니다.
   * @param shaping - Frozen shaping argument snapshot.
   * @zh shaping - 冻结的排版参数快照。
   * @ja shaping - 凍結されたシェーピング引数。
   * @ko shaping - 동결된 셰이핑 인수 스냅샷입니다.
   * @param priorCharacter - Previous Unicode codepoint, or zero.
   * @zh priorCharacter - 前一码点，未指定时为零。
   * @ja priorCharacter - 直前のコードポイント、省略時はゼロ。
   * @ko priorCharacter - 이전 코드포인트이며 생략하면 0입니다.
   */
  (
    face: FontFaceHandle, buffer: PackedFontMeasurement, count: number,
    shaping: FontShapingParameters, priorCharacter: number,
  ): void;
}

/**
 * Owned geometry generation hook.
 *
 * @zh 生成自有几何快照的回调。
 * @ja 所有するジオメトリの生成フック。
 * @ko 소유한 지오메트리 생성 콜백입니다.
 */
export interface FontGenerateCallback {
  /**
   * Generate independently owned textured meshes.
   *
   * @zh 生成独立持有的纹理网格。
   * @ja 独立して所有するテクスチャ付きメッシュを生成します。
   * @ko 독립적으로 소유한 텍스처 메시를 생성합니다.
   * @param manager - Active Native render manager.
   * @zh manager - 当前原生渲染管理器。
   * @ja manager - 現在のネイティブ描画マネージャー。
   * @ko manager - 활성 네이티브 렌더 관리자입니다.
   * @param face - Owned face token.
   * @zh face - 本 provider 的字体令牌。
   * @ja face - 所有する書体トークン。
   * @ko face - 소유한 서체 토큰입니다.
   * @param effects - Retained effect data, or null.
   * @zh effects - 保活的特效数据，或 null。
   * @ja effects - 保持した効果データ、または null。
   * @ko effects - 유지한 효과 데이터 또는 null입니다.
   * @param string - Independent text snapshot.
   * @zh string - 独立的文本快照。
   * @ja string - 独立したテキストのスナップショット。
   * @ko string - 독립된 텍스트 스냅샷입니다.
   * @param position - Text baseline position.
   * @zh position - 文本基线位置。
   * @ja position - テキストのベースライン位置。
   * @ko position - 텍스트 기준선 위치입니다.
   * @param colour - Premultiplied native vertex colour.
   * @zh colour - 预乘的原生顶点颜色。
   * @ja colour - 乗算済みのネイティブ頂点色。
   * @ko colour - 미리 곱한 네이티브 정점 색입니다.
   * @param opacity - Text opacity.
   * @zh opacity - 文本不透明度。
   * @ja opacity - テキストの不透明度。
   * @ko opacity - 텍스트 불투명도입니다.
   * @param shaping - Frozen shaping argument snapshot.
   * @zh shaping - 冻结的排版参数快照。
   * @ja shaping - 凍結されたシェーピング引数。
   * @ko shaping - 동결된 셰이핑 인수 스냅샷입니다.
   * @returns Int32 width and meshes copied into owned Native snapshots.
   * @zh int32 宽度及复制到独立原生快照的网格。
   * @ja int32 幅と、独立したネイティブスナップショットへコピーするメッシュ。
   * @ko int32 너비와 독립된 네이티브 스냅샷에 복사할 메시입니다.
   */
  (
    manager: RenderManager, face: FontFaceHandle, effects: object | null,
    string: string, position: VariantVector2, colour: VertexColour,
    opacity: number, shaping: FontShapingParameters,
  ): GeneratedString;
}

/**
 * Font geometry version hook.
 *
 * @zh 字体几何版本回调。
 * @ja 書体ジオメトリ世代のフック。
 * @ko 서체 지오메트리 버전 콜백입니다.
 */
export interface FontVersionCallback {
  /**
   * Supply the current geometry version.
   *
   * @zh 提供当前几何版本。
   * @ja 現在のジオメトリ世代を返します。
   * @ko 현재 지오메트리 버전을 제공합니다.
   * @param face - Owned face token.
   * @zh face - 本 provider 的字体令牌。
   * @ja face - 所有する書体トークン。
   * @ko face - 소유한 서체 토큰입니다.
   * @returns Signed int32 version.
   * @zh 有符号 int32 版本。
   * @ja 符号付き int32 の世代。
   * @ko 부호 있는 int32 버전입니다.
   */
  (face: FontFaceHandle): number;
}
