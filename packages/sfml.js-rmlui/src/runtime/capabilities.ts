import { native } from '../internal/native';
import type {
  BuiltinFontEngine, FontEngineKind,
} from '../fonts/font-engine-kind';

/**
 * Compiled support and availability in the current owning runtime.
 *
 * @zh 编译支持及当前所属运行时中的可用状态。
 * @ja コンパイル済みサポートと現在の所有ランタイムでの利用可能状態。
 * @ko 컴파일 지원과 현재 소유 런타임에서의 사용 가능 상태입니다.
 */
export interface ModuleCapability {
  /**
   * Module linked into this native binary.
   *
   * @zh 模块已链接到此原生二进制。
   * @ja このネイティブバイナリにリンク済みのモジュール。
   * @ko 이 네이티브 바이너리에 링크된 모듈입니다.
   */
  readonly compiled: boolean;

  /**
   * Runtime initialized; font engines additionally require active selection.
   *
   * @zh 运行时已初始化；字体引擎还要求处于选中状态。
   * @ja ランタイム初期化済み。フォントエンジンは選択中であることも必要です。
   * @ko 런타임이 초기화되었으며 글꼴 엔진은 활성 선택도 필요합니다.
   */
  readonly available: boolean;
}

/**
 * Upstream engine semantics, independent of current selection.
 *
 * @zh 上游引擎语义，与当前选中状态无关。
 * @ja 現在の選択とは独立した上流エンジンの動作仕様。
 * @ko 현재 선택과 독립적인 업스트림 엔진 동작 사양입니다.
 * @remarks Feature flags describe the implementation when compiled. A true
 * feature requires both compiled and available before it can be used.
 * @zh 特征描述编译后的实现，使用时仍须 compiled 和 available 均为 true。
 * @ja 機能フラグはコンパイル時の実装仕様です。利用には compiled と available が必要です。
 * @ko 기능 플래그는 컴파일된 구현을 설명하며
 * 사용하려면 compiled와 available이 필요합니다.
 */
export interface FontEngineCapability extends ModuleCapability {
  /**
   * Supports font bytes; bitmap only reads atlas metadata files.
   *
   * @zh 支持调用方字体字节；位图引擎仅读取图集元数据文件。
   * @ja 呼び出し元のフォントバイトをサポート。ビットマップはアトラス定義ファイルのみ。
   * @ko 호출자 글꼴 바이트를 지원하며 비트맵은 아틀라스 정의 파일만 읽습니다.
   */
  readonly memoryLoading: boolean;

  /**
   * Renders font effects with their effect opacity.
   *
   * @zh 使用特效透明度渲染字体效果。
   * @ja 効果の不透明度を使用してフォント効果を描画します。
   * @ko 효과 불투명도를 사용하여 글꼴 효과를 렌더링합니다.
   */
  readonly effects: boolean;

  /**
   * Shapes script clusters and ligatures natively through HarfBuzz.
   *
   * @zh 通过 HarfBuzz 原生处理文字簇及连字。
   * @ja HarfBuzz で文字クラスタと合字をネイティブ処理します。
   * @ko HarfBuzz로 문자 클러스터와 합자를 네이티브 처리합니다.
   */
  readonly shaping: boolean;

  /**
   * Honors TextShapingContext.fontKerning; bitmap always uses atlas kerning.
   *
   * @zh 遵循 fontKerning；位图引擎始终使用图集字偶距。
   * @ja fontKerning に従います。ビットマップは常にアトラスのカーニングを使用。
   * @ko fontKerning을 따르며 비트맵은 항상 아틀라스 커닝을 사용합니다.
   */
  readonly kerningControl: boolean;

  /**
   * Measurement includes the supplied prior character; HarfBuzz ignores it.
   *
   * @zh 测量包含传入的前一个字符；HarfBuzz 忽略该参数。
   * @ja 計測に指定した直前の文字を含めます。HarfBuzz はこの引数を無視。
   * @ko 측정에 전달한 이전 문자를 포함하며 HarfBuzz는 이 인수를 무시합니다.
   */
  readonly priorCharacter: boolean;

  /**
   * Honors TextShapingContext.letterSpacing.
   *
   * @zh 遵循 TextShapingContext.letterSpacing。
   * @ja TextShapingContext.letterSpacing に従います。
   * @ko TextShapingContext.letterSpacing을 따릅니다.
   */
  readonly letterSpacing: boolean;

  /**
   * Rasterizes requested pixel sizes; bitmap uses its fixed atlas size.
   *
   * @zh 按请求像素尺寸栅格化；位图使用固定图集字号。
   * @ja 要求したピクセルサイズでラスタライズ。ビットマップはアトラスの固定サイズ。
   * @ko 요청한 픽셀 크기로 래스터화하며 비트맵은 고정 아틀라스 크기를 사용합니다.
   */
  readonly scalable: boolean;

  /**
   * Requires an exact family; upstream bitmap uses a permissive best match.
   *
   * @zh 要求精确字体族；上游位图引擎使用宽松的最佳匹配。
   * @ja ファミリーの完全一致が必要。上流ビットマップは緩やかな最適一致を使用。
   * @ko 패밀리의 정확한 일치가 필요하며 업스트림 비트맵은 느슨한 최적 일치를 사용합니다.
   */
  readonly strictFamilyMatching: boolean;
}

/**
 * Snapshot of this binary and its owning process-wide runtime.
 *
 * @zh 此二进制及其所属进程级运行时的快照。
 * @ja このバイナリと所有するプロセス全体のランタイムのスナップショット。
 * @ko 이 바이너리와 소유 프로세스 런타임의 스냅샷입니다.
 */
export interface RmlUiCapabilities {
  /**
   * Native RmlUi version.
   *
   * @zh 原生 RmlUi 版本。
   * @ja ネイティブ RmlUi バージョン。
   * @ko 네이티브 RmlUi 버전입니다.
   */
  readonly rmluiVersion: string;

  /**
   * Owning runtime initialized.
   *
   * @zh 所属运行时已初始化。
   * @ja 所有ランタイムが初期化済み。
   * @ko 소유 런타임이 초기화되었습니다.
   */
  readonly initialized: boolean;

  /**
   * Selected engine, including pre-initialization selection; null if unset.
   *
   * @zh 选定引擎，包含初始化前的选择；未选定时为 null。
   * @ja 初期化前の選択を含む選択済みエンジン。未選択は null。
   * @ko 초기화 전 선택을 포함한 선택 엔진이며 미선택은 null입니다.
   */
  readonly selectedFontEngine: FontEngineKind | null;

  /**
   * Module entry-point availability; does not imply an installed Lua host or
   * an initialized, visible Debugger.
   *
   * @zh 模块入口可用性，不表示已安装 Lua 宿主或已启动、显示调试器。
   * @ja モジュールの利用可能状態。Lua ホストや表示中のデバッガーの存在は意味しません。
   * @ko 모듈 진입점 가용성이며 Lua 호스트나 표시 중인 디버거의 존재를 뜻하지 않습니다.
   */
  readonly modules: Readonly<Record<
  'debugger' | 'svg' | 'lottie' | 'lua', ModuleCapability>>;

  /**
   * Built-in font support; only the selected initialized engine is available.
   *
   * @zh 内置字体支持；仅选定且已初始化的引擎可用。
   * @ja 組み込みフォントのサポート。選択して初期化したエンジンのみ利用可能。
   * @ko 내장 글꼴 지원이며 선택하고 초기화한 엔진만 사용 가능합니다.
   */
  readonly fonts: Readonly<Record<BuiltinFontEngine, FontEngineCapability>>;
}

/**
 * Read compiled modules, font semantics and runtime availability.
 *
 * @zh 读取编译模块、字体语义及运行时可用性。
 * @ja コンパイル済みモジュール、フォント仕様、ランタイム利用可能状態を取得。
 * @ko 컴파일 모듈, 글꼴 사양과 런타임 가용성을 읽습니다.
 * @returns Independent snapshot before initialization and after shutdown.
 * @zh 独立快照，可在初始化前及关闭后读取。
 * @ja 初期化前と終了後にも取得可能な独立したスナップショット。
 * @ko 초기화 전과 종료 후에도 읽을 수 있는 독립 스냅샷입니다.
 */
export function getCapabilities(): RmlUiCapabilities {
  return native.getCapabilities();
}
