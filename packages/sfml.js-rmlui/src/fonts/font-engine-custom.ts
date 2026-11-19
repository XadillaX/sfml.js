import type { FontFaceHandle } from '../internal/computed';
import { fontEffectFromNative } from './font-effect';
import { meshHandle } from '../rendering/mesh';
import { textureHandle } from '../rendering/texture';
import { renderManagerFromNative } from '../rendering/render-manager';
import type {
  FontLifecycleCallback, FontLoadCallback, FontLoadNamedCallback,
  FontLoadMemoryCallback, FontFaceCallback, FontEffectsCallback,
  FontMetricsCallback, FontWidthCallback, FontGenerateCallback,
  FontVersionCallback, FontWidthsCallback, FontMeasureCallback,
  PackedFontMeasurement,
} from './font-engine-callbacks';
import type { VariantVector2 } from '../values/types';
import type { VertexColour } from '../rendering/vertex';
import { types } from 'node:util';
import { markAsUntransferable } from 'node:worker_threads';

/**
 * Independent metrics used to register a Native custom face.
 *
 * @zh 用于注册原生自定义字体的独立度量。
 * @ja ネイティブのカスタム書体を登録する独立したメトリクス。
 * @ko 네이티브 사용자 지정 서체를 등록하는 독립 메트릭입니다.
 */
export interface CustomFontMetrics {
  /**
   * Pixel size.
   *
   * @zh 像素大小。
   * @ja ピクセルサイズ。
   * @ko 픽셀 크기입니다.
   */
  readonly size: number;

  /**
   * Ascent.
   *
   * @zh 上升距离。
   * @ja アセント。
   * @ko 어센트입니다.
   */
  readonly ascent: number;

  /**
   * Descent.
   *
   * @zh 下降距离。
   * @ja ディセント。
   * @ko 디센트입니다.
   */
  readonly descent: number;

  /**
   * Baseline spacing.
   *
   * @zh 基线间距。
   * @ja ベースライン間隔。
   * @ko 기준선 간격입니다.
   */
  readonly lineSpacing: number;

  /**
   * X height.
   *
   * @zh x 高度。
   * @ja 小文字 x の高さ。
   * @ko x 높이입니다.
   */
  readonly xHeight: number;

  /**
   * Underline position.
   *
   * @zh 下划线位置。
   * @ja 下線位置。
   * @ko 밑줄 위치입니다.
   */
  readonly underlinePosition: number;

  /**
   * Underline thickness.
   *
   * @zh 下划线厚度。
   * @ja 下線幅。
   * @ko 밑줄 두께입니다.
   */
  readonly underlineThickness: number;

  /**
   * Ellipsis support.
   *
   * @zh 省略号支持。
   * @ja 省略記号の対応。
   * @ko 줄임표 지원입니다.
   */
  readonly hasEllipsis: boolean;
}

/**
 * Optional independent codepoint advances for entirely Native measurement.
 *
 * @zh 可选的独立码点宽度表，测量完全在 Native 中执行。
 * @ja ネイティブのみで計測する任意のコードポイント別アドバンス表。
 * @ko 네이티브 전용 측정을 위한 선택적 코드포인트 전진 거리 표입니다.
 * @remarks This table adds letter spacing but has no kerning or shaping.
 * Use width callbacks for contextual shaping; it is not a shaping engine.
 * @zh 此表支持字距，不计算字偶距或整形；上下文整形使用宽度回调。
 * @ja 文字間隔を加算しますがカーニングやシェーピングは行いません。
 * @ko 자간은 더하지만 커닝이나 셰이핑은 계산하지 않습니다.
 */
export interface FontAdvanceTable {
  /**
   * First Unicode codepoint.
   *
   * @zh 首个码点。
   * @ja 最初のコードポイント。
   * @ko 첫 코드포인트입니다.
   */
  readonly firstCharacter: number;

  /**
   * Fixed int32 source, copied once.
   *
   * @zh 复制一次的固定 int32 源。
   * @ja 一度コピーする固定 int32 表。
   * @ko 한 번 복사하는 고정 int32 원본입니다.
   */
  readonly advances: Int32Array;

  /**
   * Width of unmapped codepoints.
   *
   * @zh 未映射码点宽度。
   * @ja 未登録文字の幅。
   * @ko 미등록 코드포인트 너비입니다.
   */
  readonly fallbackAdvance: number;
}

/**
 * Native custom face and fixed writable measurement storage.
 *
 * @zh 原生自定义字体及固定可写测量存储。
 * @ja ネイティブカスタム書体と固定の書き込み可能な計測ストレージ。
 * @ko 네이티브 사용자 지정 서체와 고정 쓰기 가능한 측정 저장소입니다.
 */
export interface CustomFontFace {
  /**
   * Generation-checked face token.
   *
   * @zh 代次校验令牌。
   * @ja 世代検証トークン。
   * @ko 세대 검증 토큰입니다.
   */
  readonly handle: FontFaceHandle;

  /**
   * Native-owned advances; survives shutdown.
   *
   * @zh 关闭后保留的原生宽度表。
   * @ja 終了後も保持する表。
   * @ko 종료 후에도 유지되는 네이티브 표입니다.
   */
  readonly advances: Int32Array;

  /**
   * Geometry version; increment after editing advances.
   *
   * @zh 编辑宽度后递增的几何版本。
   * @ja 編集後に増加するジオメトリ世代。
   * @ko 표 수정 후 증가시키는 지오메트리 버전입니다.
   */
  readonly version: Int32Array;
}

/**
 * Snapshot of the upstream text-shaping arguments.
 *
 * @zh 上游文本排版参数快照。
 * @ja 上流のテキストシェーピング引数のスナップショット。
 * @ko 상위 텍스트 셰이핑 인수 스냅샷입니다.
 */
export interface FontShapingParameters {
  /**
   * Language tag.
   *
   * @zh 语言标签。
   * @ja 言語タグ。
   * @ko 언어 태그입니다.
   */
  readonly language: string;

  /**
   * Text direction.
   *
   * @zh 文本方向。
   * @ja テキスト方向。
   * @ko 텍스트 방향입니다.
   */
  readonly direction: number;

  /**
   * Kerning mode.
   *
   * @zh 字偶距模式。
   * @ja カーニングモード。
   * @ko 커닝 모드입니다.
   */
  readonly fontKerning: number;

  /**
   * Pixel letter spacing.
   *
   * @zh 像素字距。
   * @ja ピクセル文字間隔。
   * @ko 픽셀 자간입니다.
   */
  readonly letterSpacing: number;
}

/**
 * Synchronous Rml::FontEngineInterface virtuals, captured at construction.
 *
 * @zh 构造时捕获的同步 Rml::FontEngineInterface 虚函数。
 * @ja 構築時に取得する同期 Rml::FontEngineInterface 仮想関数。
 * @ko 생성 시 캡처하는 동기 Rml::FontEngineInterface 가상 함수입니다.
 * @remarks Omitted callbacks use upstream base defaults; registered faces
 * provide metrics and version in Native. A table bypasses width callbacks.
 * Core owns initialization and shutdown. Use createFontFace during
 * initialization or face selection. Core mutation is forbidden in callbacks.
 * @zh 省略回调使用上游基类默认值；注册字体在 Native 中提供度量与版本。
 * 宽度表跳过宽度回调。Core 管理初始化与关闭，回调内禁止修改 Core。
 * @ja 省略した関数には上流の基底既定値を使い、Core がライフサイクルを管理します。
 * @ko 생략한 콜백은 상위 기본값을 사용하며 Core가 수명 주기를 관리합니다.
 */
export interface FontEngineCallbacks {
  /**
   * Initialize provider.
   *
   * @zh 初始化 provider。
   * @ja provider の初期化。
   * @ko 공급자를 초기화합니다.
   */
  readonly initialize?: FontLifecycleCallback;

  /**
   * Shut down provider.
   *
   * @zh 关闭 provider。
   * @ja provider の終了。
   * @ko 공급자를 종료합니다.
   */
  readonly shutdown?: FontLifecycleCallback;

  /**
   * Metadata file overload.
   *
   * @zh 文件元数据重载。
   * @ja ファイルメタデータ版。
   * @ko 파일 메타데이터 오버로드입니다.
   */
  readonly loadFontFace?: FontLoadCallback;

  /**
   * Named file overload.
   *
   * @zh 指定名称文件重载。
   * @ja 名前付きファイル版。
   * @ko 이름 지정 파일 오버로드입니다.
   */
  readonly loadFontFaceNamed?: FontLoadNamedCallback;

  /**
   * Memory snapshot overload.
   *
   * @zh 内存快照重载。
   * @ja メモリスナップショット版。
   * @ko 메모리 스냅샷 오버로드입니다.
   */
  readonly loadFontFaceMemory?: FontLoadMemoryCallback;

  /**
   * Select an owned face or null.
   *
   * @zh 选取字体令牌或 null。
   * @ja 書体または null を選択。
   * @ko 서체 또는 null을 선택합니다.
   */
  readonly getFontFaceHandle?: FontFaceCallback;

  /**
   * Prepare opaque effect data or null.
   *
   * @zh 准备特效数据或 null。
   * @ja 効果データまたは null。
   * @ko 효과 데이터 또는 null입니다.
   */
  readonly prepareFontEffects?: FontEffectsCallback;

  /**
   * Refresh Native metrics.
   *
   * @zh 更新原生度量。
   * @ja ネイティブメトリクス更新。
   * @ko 네이티브 메트릭을 갱신합니다.
   */
  readonly getFontMetrics?: FontMetricsCallback;

  /**
   * Compatibility scalar width.
   *
   * @zh 兼容的逐文本宽度。
   * @ja 単一テキスト幅。
   * @ko 호환 단일 텍스트 너비입니다.
   */
  readonly getStringWidth?: FontWidthCallback;

  /**
   * Generate owned mesh snapshots.
   *
   * @zh 生成网格快照。
   * @ja メッシュスナップショット生成。
   * @ko 메시 스냅샷을 생성합니다.
   */
  readonly generateString?: FontGenerateCallback;

  /**
   * Query geometry version.
   *
   * @zh 查询几何版本。
   * @ja ジオメトリ世代取得。
   * @ko 지오메트리 버전을 조회합니다.
   */
  readonly getVersion?: FontVersionCallback;

  /**
   * Release provider resources.
   *
   * @zh 释放 provider 资源。
   * @ja provider リソース解放。
   * @ko 공급자 자원을 해제합니다.
   */
  readonly releaseFontResources?: FontLifecycleCallback;

  /**
   * One callback for all bulk strings; exact attached int32 output.
   *
   * @zh 所有批量文本一次回调，返回等长 int32。
   * @ja 全文字列を一括計測。
   * @ko 모든 일괄 문자열을 한 콜백으로 측정합니다.
   */
  readonly getStringWidths?: FontWidthsCallback;

  /**
   * Fill reusable Native packed results in one synchronous callback.
   *
   * @zh 单次同步回调填充可复用的原生紧凑结果。
   * @ja 一回の同期コールバックで再利用するネイティブ結果を書き込みます。
   * @ko 단일 동기 콜백에서 재사용할 네이티브 압축 결과를 채웁니다.
   */
  readonly measureStrings?: FontMeasureCallback;
}

/**
 * Capture virtuals and translate owned value wrappers at the callback boundary.
 *
 * @internal
 * @param callbacks - Provider virtuals.
 * @returns Native callback table or null for the default engine.
 */
export function fontEngineCallbacks(
  callbacks?: FontEngineCallbacks,
): readonly unknown[] | null {
  if (callbacks === undefined) {
    return null;
  }
  if (!callbacks || typeof callbacks !== 'object') {
    throw new TypeError('Expected font engine callbacks');
  }
  const {
    initialize, shutdown, loadFontFace, loadFontFaceNamed, loadFontFaceMemory,
    getFontFaceHandle, prepareFontEffects, getFontMetrics, getStringWidth,
    generateString, getVersion, releaseFontResources, getStringWidths,
    measureStrings,
  } = callbacks;
  const functions: unknown[] = [
    initialize, shutdown, loadFontFace, loadFontFaceNamed, loadFontFaceMemory,
    getFontFaceHandle, prepareFontEffects, getFontMetrics, getStringWidth,
    generateString, getVersion, releaseFontResources, getStringWidths,
    measureStrings,
  ];
  for (const callback of functions) {
    if (callback !== undefined && typeof callback !== 'function') {
      throw new TypeError('Expected optional font engine callbacks');
    }
  }
  functions[6] = prepareFontEffects && ((
    face: FontFaceHandle, effects: readonly object[],
  ) => prepareFontEffects(face, effects.map(fontEffectFromNative)));
  functions[9] = generateString && ((
    manager: object, face: FontFaceHandle, effects: object | null,
    string: string, position: VariantVector2, colour: VertexColour,
    opacity: number, shaping: FontShapingParameters,
  ) => {
    const result = generateString(renderManagerFromNative(manager), face,
      effects, string, position, colour, opacity, shaping);
    // Preserve promises for the Native synchronous-contract check.
    if (types.isPromise(result)) {
      return result;
    }
    return {
      width: result.width,
      meshes: result.meshes.map(item => ({
        mesh: meshHandle(item.mesh), texture: textureHandle(item.texture),
      })),
    };
  });
  if (measureStrings) {
    const mapped = new WeakSet<object>();
    functions[13] = (
      face: FontFaceHandle, buffer: PackedFontMeasurement, count: number,
      shaping: FontShapingParameters, priorCharacter: number,
    ) => {
      if (!mapped.has(buffer)) {
        markAsUntransferable(buffer.bytes.buffer);
        markAsUntransferable(buffer.offsets.buffer);
        markAsUntransferable(buffer.widths.buffer);
        mapped.add(buffer);
      }
      return measureStrings(face, buffer, count, shaping, priorCharacter);
    };
  }
  return functions;
}
