/**
 * Built-in native font engines selectable before initialization.
 *
 * @zh 初始化前可选择的内置原生字体引擎。
 * @ja 初期化前に選択可能な組み込みネイティブフォントエンジン。
 * @ko 초기화 전에 선택할 수 있는 내장 네이티브 글꼴 엔진입니다.
 */
export type BuiltinFontEngine = 'freetype' | 'harfbuzz' | 'bitmap';

/**
 * Selected built-in engine or explicit synchronous custom callbacks.
 *
 * @zh 选定的内置引擎或显式同步自定义回调。
 * @ja 選択した組み込みエンジンまたは明示的な同期カスタムコールバック。
 * @ko 선택한 내장 엔진이나 명시적 동기 사용자 지정 콜백입니다.
 */
export type FontEngineKind = BuiltinFontEngine | 'custom';
