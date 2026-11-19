import { native } from '../internal/native';
import type { FontFaceHandle } from '../internal/computed';
import { FontStyle } from './fonts';
import { FontMetrics, fontMetricsFromNative } from './font-metrics';
import { fontEffectHandle, type FontEffect } from './font-effect';
import { meshFromNative, type TexturedMeshList } from '../rendering/mesh';
import { textureFromNative } from '../rendering/texture';
import {
  renderManagerHandle, type RenderManager,
} from '../rendering/render-manager';
import { shapingHandle, type TextShapingContext } from './text-shaping-context';
import {
  fontMeasureBufferHandle, fontMeasureWidths, type FontMeasureBuffer,
} from './font-measure-buffer';
import type { VariantVector2 } from '../values/types';
import type { VertexColour } from '../rendering/vertex';
import {
  fontEngineCallbacks, type FontEngineCallbacks, type CustomFontMetrics,
  type CustomFontFace, type FontAdvanceTable,
} from './font-engine-custom';
import { markAsUntransferable } from 'node:worker_threads';
import type { BuiltinFontEngine, FontEngineKind } from './font-engine-kind';

const engines = new WeakMap<FontEngineInterface, object>();
const wrappers = new WeakMap<object, FontEngineInterface>();
declare const fontEffects: unique symbol;

/**
 * Opaque Rml::FontEffectsHandle bound to its face, engine and font generation.
 *
 * @zh 绑定字体、引擎和字体代次的不透明 Rml::FontEffectsHandle。
 * @ja 書体、エンジン、フォント世代に結び付く不透明な Rml::FontEffectsHandle。
 * @ko 서체, 엔진, 글꼴 세대에 연결된 불투명 Rml::FontEffectsHandle입니다.
 */
export interface FontEffectsHandle {
  /** @internal */
  readonly [fontEffects]: true;
}

/**
 * Rml::FontEngineInterface::GenerateString result.
 *
 * @zh Rml::FontEngineInterface::GenerateString 的结果。
 * @ja Rml::FontEngineInterface::GenerateString の結果。
 * @ko Rml::FontEngineInterface::GenerateString 결과입니다.
 */
export interface GeneratedString {
  /**
   * Native string advance in pixels.
   *
   * @zh 原生文本像素前进距离。
   * @ja ピクセル単位のネイティブ文字列アドバンス。
   * @ko 픽셀 단위의 네이티브 문자열 전진 거리입니다.
   */
  readonly width: number;

  /**
   * Owned mesh snapshots and manager-specific font atlas texture views.
   * Atlas rebuild and font release invalidate the texture views.
   *
   * @zh 持有的网格快照及管理器专属字体图集纹理视图。
   * 图集重建和字体释放使纹理视图失效。
   * @ja 所有するメッシュと管理器固有のアトラステクスチャビュー。
   * アトラスの再構築とフォント解放でテクスチャビューは無効になります。
   * @ko 소유한 메시 스냅샷과 관리자별 글꼴 아틀라스 텍스처 뷰입니다.
   * 아틀라스 재구성과 글꼴 해제 시 텍스처 뷰가 무효화됩니다.
   */
  readonly meshes: TexturedMeshList;
}

/**
 * Resolve a checked font engine token.
 *
 * @internal
 * @param value - Public engine.
 * @returns Native owner.
 */
function engineHandle(value: FontEngineInterface): object {
  const result = engines.get(value);
  if (!result) {
    throw new TypeError('Expected a FontEngineInterface');
  }
  return result;
}

/**
 * Native Rml::FontEngineInterface with shared values and host virtuals.
 *
 * @zh 原生 Rml::FontEngineInterface，提供共享值及可选宿主虚函数。
 * @ja 共有値と任意のホスト仮想関数を持つネイティブフォントインターフェース。
 * @ko 공유 값과 선택적 호스트 가상 함수를 제공하는 네이티브 인터페이스입니다.
 * @remarks Only the selected engine performs font operations. Core manages its
 * Initialize/Shutdown lifecycle. Construction does not start a font provider.
 * The default FreeType engine performs glyph and atlas work in C++.
 * Custom callbacks are explicit synchronous host operations; an advance table
 * keeps custom width computation in Native.
 * @zh 只有选中引擎可执行字体操作。Core 管理 Initialize/Shutdown 生命周期，
 * 构造不会启动字体 provider。默认字形和图集处理在 C++ 执行，
 * 自定义虚函数进入同步宿主回调；自定义宽度表在 Native 中计算宽度。
 * @ja 選択したエンジンのみ操作可能です。Core がライフサイクルを管理し、
 * 構築時に provider は起動しません。既定のグリフとアトラスは C++ で処理し、
 * カスタム仮想関数は同期ホストコールバックとして実行します。
 * @ko 선택된 엔진만 작업할 수 있습니다. Core가 수명 주기를 관리하며 생성은
 * provider를 시작하지 않습니다. 기본 글리프와 아틀라스는 C++에서 처리하며
 * 사용자 지정 가상 함수는 동기 호스트 콜백으로 실행합니다.
 */
export class FontEngineInterface {
  /**
   * Construct an uninitialized built-in or custom Native font engine.
   *
   * @zh 构造尚未初始化的内置或自定义原生字体引擎。
   * @ja 未初期化の組み込みまたはカスタムエンジンを構築します。
   * @ko 초기화되지 않은 내장 또는 사용자 지정 엔진을 생성합니다.
   * @param callbacks - Built-in kind or synchronous virtuals; default FreeType.
   * @zh callbacks - 内置引擎种类或同步虚函数，默认 FreeType。
   * @ja callbacks - 組み込み種類または同期仮想関数。既定は FreeType。
   * @ko callbacks - 내장 종류 또는 동기 가상 함수이며 기본값은 FreeType입니다.
   */
  constructor(callbacks?: FontEngineCallbacks | BuiltinFontEngine) {
    const handle = native.createFontEngineInterface(
      typeof callbacks === 'string'
        ? callbacks : fontEngineCallbacks(callbacks));
    engines.set(this, handle);
    wrappers.set(handle, this);
  }

  /**
   * Native engine kind, checked against its runtime generation.
   *
   * @zh 原生引擎类型，校验所属运行时代次。
   * @ja ランタイム世代を検証するネイティブエンジンの種類。
   * @ko 런타임 세대를 검증하는 네이티브 엔진 종류입니다.
   * @returns Built-in kind or custom.
   * @zh 内置类型或 custom。
   * @ja 組み込みの種類または custom。
   * @ko 내장 종류 또는 custom입니다.
   */
  get kind(): FontEngineKind {
    return native.fontEngineGetKind(engineHandle(this));
  }

  /**
   * Register upstream HarfBuzz language metadata before initialization.
   *
   * @zh 初始化前注册上游 HarfBuzz 语言元数据。
   * @ja 初期化前に上流 HarfBuzz の言語メタデータを登録します。
   * @ko 초기화 전에 업스트림 HarfBuzz 언어 메타데이터를 등록합니다.
   * @param language - BCP47 language tag used by TextShapingContext.language.
   * @zh language - TextShapingContext.language 使用的 BCP47 语言标签。
   * @ja language - TextShapingContext.language で使う BCP47 言語タグ。
   * @ko language - TextShapingContext.language에 사용하는 BCP47 언어 태그입니다.
   * @param script - Four-letter ISO15924 script, such as Arab or Latn.
   * @zh script - 四字母 ISO15924 文字代码，如 Arab 或 Latn。
   * @ja script - Arab や Latn などの 4 文字 ISO15924 スクリプトコード。
   * @ko script - Arab나 Latn 같은 네 글자 ISO15924 문자 코드입니다.
   * @param direction - Flow used when the shaping context selects Auto.
   * @zh direction - 排版上下文选择 Auto 时使用的文字方向。
   * @ja direction - シェーピングの Auto 設定で使用する文字方向。
   * @ko direction - 조판 컨텍스트가 Auto를 선택할 때 사용하는 문자 방향입니다.
   */
  registerLanguage(
    language: string, script: string, direction: 'ltr' | 'rtl',
  ): void {
    native.fontEngineRegisterLanguage(
      engineHandle(this), language, script, direction);
  }

  /**
   * Register an owned custom face during Initialize or face selection.
   *
   * @zh 注册原生自定义字体；允许在初始化及字体选取回调中执行。
   * @ja 初期化や書体選択中にも使用できる所有済みカスタム書体登録。
   * @ko 초기화나 서체 선택 콜백에서도 사용자 지정 서체를 등록합니다.
   * @param metrics - Finite metrics snapshot copied into Native storage.
   * @zh metrics - 复制到原生存储的有限度量快照。
   * @ja metrics - ネイティブストレージへコピーする有限メトリクス。
   * @ko metrics - 네이티브로 복사할 유한 메트릭 스냅샷입니다.
   * @param table - Glyph advances; omitted selects JS width callbacks.
   * @zh table - 独立字形宽度表，省略时使用 JS 宽度回调。
   * @ja table - 独立グリフ幅表。省略すると JS 計測を使用。
   * @ko table - 독립 글리프 표이며 생략하면 JS 너비 콜백을 사용합니다.
   * @returns Generation-checked handle and Native-owned writable views.
   * @zh 代次校验令牌及原生可写视图。
   * @ja 世代検証トークンとネイティブの書き込み可能なビュー。
   * @ko 세대 검증 토큰과 네이티브 쓰기 가능한 뷰입니다.
   */
  createFontFace(
    metrics: CustomFontMetrics, table?: FontAdvanceTable,
  ): CustomFontFace {
    const result = native.fontEngineCreateFace(engineHandle(this), metrics,
      table?.advances ?? null, table?.firstCharacter ?? 0,
      table?.fallbackAdvance ?? 0);
    markAsUntransferable(result.advances.buffer);
    markAsUntransferable(result.version.buffer);
    return result;
  }

  /**
   * Rml::FontEngineInterface::LoadFontFace using file metadata.
   *
   * @zh 使用文件元数据加载字体。
   * @ja ファイルのメタデータを使って書体を読み込みます。
   * @ko 파일 메타데이터로 서체를 로드합니다.
   * @param source - Font path resolved by the active file interface.
   * @zh source - 由当前文件接口解析的字体路径。
   * @ja source - 現在のファイルインターフェースで解決するパス。
   * @ko source - 활성 파일 인터페이스가 해석하는 글꼴 경로입니다.
   * @param fallback - Register as fallback; defaults to false.
   * @zh fallback - 注册为后备字体，默认 false。
   * @ja fallback - 代替フォントとして登録。既定は false。
   * @ko fallback - 대체 글꼴로 등록하며 기본값은 false입니다.
   * @param weight - Auto or 1–1000; defaults to Auto.
   * @zh weight - Auto 或 1–1000，默认 Auto。
   * @ja weight - Auto または 1〜1000。既定は Auto。
   * @ko weight - Auto 또는 1~1000이며 기본값은 Auto입니다.
   * @param faceIndex - Nonnegative collection index; defaults to zero.
   * @zh faceIndex - 非负集合索引，默认零。
   * @ja faceIndex - 非負のコレクション番号。既定はゼロ。
   * @ko faceIndex - 음수가 아닌 컬렉션 인덱스이며 기본값은 0입니다.
   * @returns Native load result.
   * @zh 原生加载结果。
   * @ja ネイティブの読込結果。
   * @ko 네이티브 로드 결과입니다.
   */
  loadFontFace(
    source: string, fallback?: boolean, weight?: number, faceIndex?: number,
  ): boolean;

  /**
   * Rml::FontEngineInterface::LoadFontFace using a named file or memory face.
   *
   * @zh 以指定名称加载文件或内存字体。
   * @ja 名前を指定してファイルまたはメモリから書体を読み込みます。
   * @ko 이름을 지정하여 파일 또는 메모리에서 서체를 로드합니다.
   * @param source - File path or unshared, attached Uint8Array.
   * @zh source - 文件路径或未共享、未分离的 Uint8Array。
   * @ja source - パスまたは共有・切り離しされていない Uint8Array。
   * @ko source - 파일 경로나 공유 및 분리되지 않은 Uint8Array입니다.
   * @param family - Registered family; empty uses metadata.
   * @zh family - 注册字体族，空字符串使用元数据。
   * @ja family - 登録するファミリー。空文字列はメタデータを使用。
   * @ko family - 등록 패밀리이며 빈 문자열은 메타데이터를 사용합니다.
   * @param style - Normal or Italic.
   * @zh style - Normal 或 Italic。
   * @ja style - Normal または Italic。
   * @ko style - Normal 또는 Italic입니다.
   * @param weight - Auto or 1–1000; defaults to Auto.
   * @zh weight - Auto 或 1–1000，默认 Auto。
   * @ja weight - Auto または 1〜1000。既定は Auto。
   * @ko weight - Auto 또는 1~1000이며 기본값은 Auto입니다.
   * @param fallback - Register as fallback; defaults to false.
   * @zh fallback - 注册为后备字体，默认 false。
   * @ja fallback - 代替フォントとして登録。既定は false。
   * @ko fallback - 대체 글꼴로 등록하며 기본값은 false입니다.
   * @param faceIndex - Nonnegative collection index; defaults to zero.
   * @zh faceIndex - 非负集合索引，默认零。
   * @ja faceIndex - 非負のコレクション番号。既定はゼロ。
   * @ko faceIndex - 음수가 아닌 컬렉션 인덱스이며 기본값은 0입니다.
   * @returns Native load result; byte snapshots survive failed partial loads.
   * @zh 原生加载结果；部分加载失败后仍保留字节快照。
   * @ja ネイティブの成否。一部読込失敗でも元データを保持。
   * @ko 네이티브 결과이며 부분 로드 실패 후에도 바이트 사본을 유지합니다.
   */
  loadFontFace(
    source: string | Uint8Array, family: string, style: FontStyle,
    weight?: number, fallback?: boolean, faceIndex?: number,
  ): boolean;

  /**
   * Forward the selected engine overload.
   *
   * @internal
   * @param source - Font file or bytes.
   * @param familyOrFallback - Named family or fallback flag.
   * @param styleOrWeight - Style or weight.
   * @param weightOrIndex - Weight or face index.
   * @param fallback - Named fallback flag.
   * @param faceIndex - Named collection index.
   * @returns Native result.
   */
  loadFontFace(
    source: string | Uint8Array, familyOrFallback?: string | boolean,
    styleOrWeight?: number, weightOrIndex?: number,
    fallback?: boolean, faceIndex?: number,
  ): boolean {
    return native.fontEngineLoadFontFace(
      engineHandle(this), source, familyOrFallback, styleOrWeight,
      weightOrIndex, fallback, faceIndex);
  }

  /**
   * Find a font face by family, slant, weight and pixel size;
   * normalize the family to lowercase.
   *
   * @zh 获取字体句柄，字体族在原生边界转为小写。
   * @ja 書体ハンドルを取得し、ファミリー名をネイティブで小文字にします。
   * @ko 서체 핸들을 얻고 패밀리 이름을 네이티브 경계에서 소문자로 변환합니다.
   * @param family - Registered font family.
   * @zh family - 已注册字体族。
   * @ja family - 登録済みファミリー。
   * @ko family - 등록된 글꼴 패밀리입니다.
   * @param style - Normal or Italic.
   * @zh style - Normal 或 Italic。
   * @ja style - Normal または Italic。
   * @ko style - Normal 또는 Italic입니다.
   * @param weight - Integer 1–1000.
   * @zh weight - 1–1000 的整数字重。
   * @ja weight - 1〜1000 の整数ウェイト。
   * @ko weight - 1~1000의 정수 굵기입니다.
   * @param size - Pixel size from 1 to 33554431, fitting FreeType 26.6 units.
   * @zh size - 1–33554431 像素，符合 FreeType 26.6 单位范围。
   * @ja size - FreeType 26.6 単位に収まる 1〜33554431 ピクセル。
   * @ko size - FreeType 26.6 범위에 맞는 1~33554431 픽셀입니다.
   * @returns Generation-checked token or null when no face matches.
   * @zh 代次校验令牌，无匹配字体时为 null。
   * @ja 世代を検証するトークン。書体がなければ null。
   * @ko 세대 검증 토큰이며 일치하는 서체가 없으면 null입니다.
   */
  getFontFaceHandle(
    family: string, style: FontStyle, weight: number, size: number,
  ): FontFaceHandle | null {
    return native.fontEngineGetFace(
      engineHandle(this), family, style, weight, size);
  }

  /**
   * Prepare ordered font effects for rendering with this face.
   *
   * @zh 准备字体特效。
   * @ja フォント効果を準備します。
   * @ko 글꼴 효과를 준비합니다.
   * @param face - Live face token.
   * @zh face - 有效字体令牌。
   * @ja face - 有効な書体トークン。
   * @ko face - 유효한 서체 토큰입니다.
   * @param effects - Ordered native font effects.
   * @zh effects - 有序原生字体特效。
   * @ja effects - 順序付きネイティブフォント効果。
   * @ko effects - 순서 있는 네이티브 글꼴 효과입니다.
   * @returns Token valid only for this face and font generation.
   * @zh 仅对当前字体及字体代次有效的令牌。
   * @ja この書体とフォント世代のみ有効なトークン。
   * @ko 이 서체와 글꼴 세대에서만 유효한 토큰입니다.
   */
  prepareFontEffects(
    face: FontFaceHandle, effects: readonly FontEffect[],
  ): FontEffectsHandle {
    return native.fontEnginePrepareEffects(
      engineHandle(this), face, effects.map(fontEffectHandle));
  }

  /**
   * Snapshot Rml::FontEngineInterface::GetFontMetrics.
   *
   * @zh 快照字体度量。
   * @ja フォントメトリクスをコピーします。
   * @ko 글꼴 메트릭을 복사합니다.
   * @param face - Live face token.
   * @zh face - 有效字体令牌。
   * @ja face - 有効な書体トークン。
   * @ko face - 유효한 서체 토큰입니다.
   * @returns Owned shared fields, independent of the engine cache.
   * @zh 独立于引擎缓存、持有存储的共享字段。
   * @ja エンジンキャッシュから独立した所有済み共有フィールド。
   * @ko 엔진 캐시와 독립된 소유한 공유 필드입니다.
   */
  getFontMetrics(face: FontFaceHandle): FontMetrics {
    return fontMetricsFromNative(native.fontEngineGetMetrics(
      engineHandle(this), face));
  }

  /**
   * Measure text width in pixels using the selected font and shaping context.
   *
   * @zh 计算字符串宽度。
   * @ja 文字列の幅を計算します。
   * @ko 문자열 너비를 계산합니다.
   * @param face - Live face token.
   * @zh face - 有效字体令牌。
   * @ja face - 有効な書体トークン。
   * @ko face - 유효한 서체 토큰입니다.
   * @param string - Text to measure.
   * @zh string - 待测量文本。
   * @ja string - 計測するテキスト。
   * @ko string - 측정할 텍스트입니다.
   * @param shaping - Owned shaping context; omitted uses defaults.
   * @zh shaping - 持有存储的排版参数，省略使用默认值。
   * @ja shaping - 所有するシェーピング情報。省略時は既定値。
   * @ko shaping - 소유한 조판 정보이며 생략하면 기본값입니다.
   * @param priorCharacter - Prior Unicode code point; defaults to zero.
   * @zh priorCharacter - 前一个 Unicode 码点，默认零。
   * @ja priorCharacter - 直前の Unicode コードポイント。既定はゼロ。
   * @ko priorCharacter - 이전 Unicode 코드 포인트이며 기본값은 0입니다.
   * @returns Native integer pixel width.
   * @zh 原生整数像素宽度。
   * @ja ネイティブの整数ピクセル幅。
   * @ko 네이티브 정수 픽셀 너비입니다.
   */
  getStringWidth(
    face: FontFaceHandle, string: string, shaping?: TextShapingContext,
    priorCharacter = 0,
  ): number {
    return native.fontEngineGetWidth(
      engineHandle(this), face, string, shapingHandle(shaping), priorCharacter);
  }

  /**
   * Measure multiple strings in one native entry, in input order.
   *
   * @zh 一次进入原生，按输入顺序测量多个字符串。
   * @ja 1 回のネイティブ呼出で、入力順に複数の文字列を計測します。
   * @ko 한 번의 네이티브 호출로 입력 순서대로 여러 문자열을 측정합니다.
   * @param face - Live face token.
   * @zh face - 有效字体令牌。
   * @ja face - 有効な書体トークン。
   * @ko face - 유효한 서체 토큰입니다.
   * @param strings - Strings sharing one face and shaping configuration.
   * @zh strings - 使用相同字体及排版参数的字符串。
   * @ja strings - 同じ書体とシェーピング設定を使う文字列。
   * @ko strings - 같은 서체와 조판 설정을 사용하는 문자열입니다.
   * @param shaping - Owned shaping context; omitted uses defaults.
   * @zh shaping - 持有存储的排版参数，省略使用默认值。
   * @ja shaping - 所有するシェーピング情報。省略時は既定値。
   * @ko shaping - 소유한 조판 정보이며 생략하면 기본값입니다.
   * @param priorCharacter - Prior code point for each string; defaults to zero.
   * @zh priorCharacter - 每个字符串前的码点，默认零。
   * @ja priorCharacter - 各文字列の直前のコードポイント。既定はゼロ。
   * @ko priorCharacter - 각 문자열 앞의 코드 포인트이며 기본값은 0입니다.
   * @returns Native-owned shared int32 widths; survive collection and shutdown.
   * @zh 原生持有的共享 int32 宽度，回收和关闭后仍有效。
   * @ja 回収と終了後も有効な、ネイティブ所有の共有 int32 幅。
   * @ko 회수와 종료 후에도 유효한 네이티브 소유 공유 int32 너비입니다.
   */
  getStringWidths(
    face: FontFaceHandle, strings: readonly string[],
    shaping?: TextShapingContext, priorCharacter = 0,
  ): Int32Array {
    return native.fontEngineGetWidths(
      engineHandle(this), face, strings,
      shapingHandle(shaping), priorCharacter);
  }

  /**
   * Measure packed UTF-8 slices into existing native width storage.
   *
   * @zh 将打包 UTF-8 片段测量到已有原生宽度存储。
   * @ja UTF-8 区間を既存のネイティブ幅領域に計測します。
   * @ko UTF-8 구간을 기존 네이티브 너비 저장소에 측정합니다.
   * @param face - Live face token.
   * @zh face - 有效字体令牌。
   * @ja face - 有効な書体トークン。
   * @ko face - 유효한 서체 토큰입니다.
   * @param buffer - Reusable native input and output.
   * @zh buffer - 可复用原生输入和输出。
   * @ja buffer - 再利用するネイティブ入出力。
   * @ko buffer - 재사용 가능한 네이티브 입출력입니다.
   * @param shaping - Shaping parameters; omitted uses defaults.
   * @zh shaping - 排版参数；省略使用默认值。
   * @ja shaping - シェーピング設定。省略時は既定値。
   * @ko shaping - 조판 설정이며 생략하면 기본값입니다.
   * @param priorCharacter - Prior code point per row; defaults to zero.
   * @zh priorCharacter - 每行的前置码点；默认零。
   * @ja priorCharacter - 各行の直前のコードポイント。既定はゼロ。
   * @ko priorCharacter - 행마다 앞선 코드 포인트이며 기본값은 0입니다.
   * @param count - Active rows; defaults to the append length.
   * @zh count - 有效行数；默认使用追加长度。
   * @ja count - 対象行数。既定は追加済みの長さ。
   * @ko count - 활성 행 수이며 기본값은 추가한 길이입니다.
   * @returns The original full width view, updated in place.
   * @zh 就地更新的原始完整宽度视图。
   * @ja その場で更新した元の幅ビュー全体。
   * @ko 제자리에서 갱신한 원래 전체 너비 뷰입니다.
   * @remarks This entry does not allocate or copy input/result buffers.
   * Cold glyph loads and custom font engines may allocate their own storage.
   * @zh 此入口不分配或拷贝输入及结果缓冲。冷字形加载和自定义字体引擎
   * 可能分配自己的存储。
   * @ja この入口は入出力バッファを確保・コピーしません。未読込のグリフや
   * 独自エンジンは内部領域を確保する場合があります。
   * @ko 이 진입점은 입출력 버퍼를 할당하거나 복사하지 않습니다. 처음 읽는
   * 글리프와 사용자 정의 엔진은 내부 저장소를 할당할 수 있습니다.
   */
  measureStrings(
    face: FontFaceHandle, buffer: FontMeasureBuffer,
    shaping?: TextShapingContext, priorCharacter = 0, count?: number,
  ): Int32Array {
    native.fontEngineMeasureStrings(
      engineHandle(this), face, fontMeasureBufferHandle(buffer),
      shapingHandle(shaping), priorCharacter,
      count === undefined ? buffer.length : count);
    return fontMeasureWidths(buffer);
  }

  /**
   * Rml::FontEngineInterface::GenerateString with native mesh storage.
   *
   * @zh 使用原生网格存储生成文本。
   * @ja ネイティブメッシュ領域で文字列を生成します。
   * @ko 네이티브 메시 저장소로 문자열을 생성합니다.
   * @param manager - Live native render manager.
   * @zh manager - 有效原生渲染管理器。
   * @ja manager - 有効なネイティブ描画管理器。
   * @ko manager - 유효한 네이티브 렌더 관리자입니다.
   * @param face - Live face token.
   * @zh face - 有效字体令牌。
   * @ja face - 有効な書体トークン。
   * @ko face - 유효한 서체 토큰입니다.
   * @param effects - Prepared effects token or null for the base face.
   * @zh effects - 已准备特效令牌，null 使用基础字体。
   * @ja effects - 準備済み効果トークン。null は基本書体。
   * @ko effects - 준비된 효과 토큰이며 null은 기본 서체입니다.
   * @param string - Text to generate.
   * @zh string - 待生成文本。
   * @ja string - 生成するテキスト。
   * @ko string - 생성할 텍스트입니다.
   * @param position - Baseline position in pixels.
   * @zh position - 像素单位的基线位置。
   * @ja position - ピクセル単位のベースライン位置。
   * @ko position - 픽셀 단위의 기준선 위치입니다.
   * @param colour - Premultiplied RGBA bytes; RGB must not exceed alpha.
   * @zh colour - 预乘 RGBA 字节，RGB 不得超过 alpha。
   * @ja colour - 乗算済み RGBA バイト。RGB は alpha 以下。
   * @ko colour - 미리 곱한 RGBA 바이트이며 RGB는 alpha 이하여야 합니다.
   * @param opacity - Effect opacity from zero to one; defaults to one.
   * @zh opacity - 零到一的特效透明度，默认一。
   * @ja opacity - ゼロ〜一の効果の不透明度。既定は一。
   * @ko opacity - 0~1의 효과 불투명도이며 기본값은 1입니다.
   * @param shaping - Owned shaping context; omitted uses defaults.
   * @zh shaping - 持有存储的排版参数，省略使用默认值。
   * @ja shaping - 所有するシェーピング情報。省略時は既定値。
   * @ko shaping - 소유한 조판 정보이며 생략하면 기본값입니다.
   * @returns Native advance and meshes with font-generation texture views.
   * @zh 原生前进距离、网格及绑定字体代次的纹理视图。
   * @ja ネイティブアドバンス、メッシュ、フォント世代付きテクスチャビュー。
   * @ko 네이티브 전진 거리, 메시와 글꼴 세대의 텍스처 뷰입니다.
   */
  generateString(
    manager: RenderManager, face: FontFaceHandle,
    effects: FontEffectsHandle | null, string: string,
    position: VariantVector2, colour: VertexColour, opacity = 1,
    shaping?: TextShapingContext,
  ): GeneratedString {
    const { x, y } = position;
    const { red, green, blue, alpha } = colour;
    if ([ red, green, blue, alpha ].some(
      channel => !Number.isInteger(channel) || channel < 0 || channel > 255)) {
      throw new RangeError('Expected premultiplied RGBA bytes');
    }
    const packed = red + green * 256 + blue * 65536 + alpha * 16777216;
    const result = native.fontEngineGenerateString(
      engineHandle(this), renderManagerHandle(manager), face, effects,
      string, x, y, packed, opacity, shapingHandle(shaping));
    return {
      width: result.width,
      meshes: result.meshes.map(item => ({
        mesh: meshFromNative(item.mesh),
        texture: textureFromNative(item.texture),
      })),
    };
  }

  /**
   * Read the font atlas version used to detect stale text geometry.
   *
   * @zh 获取字体几何版本。
   * @ja 書体ジオメトリのバージョンを取得します。
   * @ko 서체 지오메트리 버전을 얻습니다.
   * @param face - Live face token.
   * @zh face - 有效字体令牌。
   * @ja face - 有効な書体トークン。
   * @ko face - 유효한 서체 토큰입니다.
   * @returns Native version used to invalidate text geometry.
   * @zh 用于使文本几何失效的原生版本。
   * @ja テキストジオメトリの無効化に使うネイティブバージョン。
   * @ko 텍스트 지오메트리 무효화에 사용하는 네이티브 버전입니다.
   */
  getVersion(face: FontFaceHandle): number {
    return native.fontEngineGetVersion(engineHandle(this), face);
  }

  /**
   * Release fonts through Core and invalidate all face/effects/atlas tokens.
   *
   * @zh 通过 Core 释放字体，使字体、特效和图集令牌失效。
   * @ja Core でフォントを解放し、書体、効果、アトラスのトークンを無効にします。
   * @ko Core로 글꼴을 해제하고 서체, 효과, 아틀라스 토큰을 무효화합니다.
   * @remarks Reattaches or collects detached trees before release. Registered
   * face data and numerical snapshots remain available.
   * @zh 释放前先挂回或回收脱离的树。已注册字体数据和数值快照保持可用。
   * @ja 解放前に切り離しツリーを再接続または回収してください。元データは保持します。
   * @ko 해제 전에 분리된 트리를 연결하거나 회수하세요. 원본 데이터는 유지됩니다.
   */
  releaseFontResources(): void {
    native.fontEngineReleaseResources(engineHandle(this));
  }
}

/**
 * Rml::SetFontEngineInterface before initialization; null restores automatic
 * FreeType selection.
 *
 * @zh 初始化前选择字体引擎；null 恢复自动选择 FreeType。
 * @ja 初期化前にエンジンを選択し、null で自動 FreeType 選択に戻します。
 * @ko 초기화 전에 엔진을 선택하며 null은 자동 FreeType 선택을 복원합니다.
 * @param engine - Native-owned engine or null.
 * @zh engine - 原生持有的引擎或 null。
 * @ja engine - ネイティブ所有のエンジンまたは null。
 * @ko engine - 네이티브 소유 엔진 또는 null입니다.
 */
export function setFontEngineInterface(
  engine: FontEngineInterface | null,
): void {
  native.setFontEngineInterface(engine === null ? null : engineHandle(engine));
}

/**
 * Rml::GetFontEngineInterface, with canonical public wrapper identity.
 *
 * @zh 读取已安装的字体引擎，保持公开包装对象身份。
 * @ja 同一ラッパーを保持してインストール済みエンジンを取得します。
 * @ko 공개 래퍼 동일성을 유지하며 설치된 엔진을 얻습니다.
 * @returns Selected engine, or null before selection and after shutdown.
 * @zh 选定引擎，未选定及关闭后为 null。
 * @ja 選択済みエンジン。選択前と終了後は null。
 * @ko 선택된 엔진이며 선택 전과 종료 후는 null입니다.
 */
export function getFontEngineInterface(): FontEngineInterface | null {
  const handle = native.getFontEngineInterface();
  if (handle === null) {
    return null;
  }
  let result = wrappers.get(handle);
  if (!result) {
    result =
      Object.create(FontEngineInterface.prototype) as FontEngineInterface;
    engines.set(result, handle);
    wrappers.set(handle, result);
  }
  return result;
}
