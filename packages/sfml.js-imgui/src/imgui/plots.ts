import { native } from '../internal/native';
import type { ImVec2Like } from '../types';

/**
 * Plot values as a line graph.
 *
 * @zh 将数值绘制为折线图。
 * @ja 値を折れ線グラフとして描画します。
 * @ko 값을 선 그래프로 그립니다.
 *
 * @remarks
 * - Consider using ImPlot (https://github.com/epezent/implot) which is much
 *   better!
 *
 * Implied values_offset = 0, overlay_text = null, scale_min =
 * 3.4028234663852886e+38,
 * scale_max = 3.4028234663852886e+38, graph_size = { x: 0, y: 0 }, stride =
 * Float32Array.BYTES_PER_ELEMENT
 * @zh
 * 控件：数据绘图。
 *
 * - 建议使用更出色的 ImPlot（https://github.com/epezent/implot）！
 *
 * 隐含参数：values_offset = 0, overlay_text = null, scale_min =
 * 3.4028234663852886e+38, scale_max =
 * 3.4028234663852886e+38, graph_size = { x: 0, y: 0 }, stride =
 * Float32Array.BYTES_PER_ELEMENT。
 * @ja
 * ウィジェット：データプロット。
 *
 * - はるかに優れた ImPlot（https://github.com/epezent/implot）の使用を検討してください！
 *
 * 暗黙の引数：values_offset = 0, overlay_text = null, scale_min =
 * 3.4028234663852886e+38, scale_max
 * = 3.4028234663852886e+38, graph_size = { x: 0, y: 0 }, stride =
 * Float32Array.BYTES_PER_ELEMENT。
 * @ko
 * 위젯: 데이터 그래프.
 *
 * - 훨씬 나은 ImPlot(https://github.com/epezent/implot) 사용을 고려하세요!
 *
 * 암묵적 인수: values_offset = 0, overlay_text = null, scale_min =
 * 3.4028234663852886e+38,
 * scale_max = 3.4028234663852886e+38, graph_size = { x: 0, y: 0 }, stride =
 * Float32Array.BYTES_PER_ELEMENT.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param values - Float32Array of plot samples, read from the supplied storage;
 * values_count and stride must stay within that storage. Pass Float32Array
 * storage, not a JS scalar; native access uses the supplied backing memory.
 * @zh values - 从给定存储读取的 Float32Array 绘图样本；values_count 和 stride 必须限定在该存储内。 请传入
 * Float32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja values - プロット用の Float32Array サンプルです。values_count と stride
 * が領域内に収まるようにしてください。 JS スカラーではなく Float32Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko values - 그래프용 Float32Array 표본입니다. values_count와 stride가 저장 영역을 벗어나면 안
 * 됩니다. JS 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param values_count - Number of plot samples to read.
 * @zh values_count - 要读取的绘图样本数。
 * @ja values_count - 読み込むプロットのサンプル数です。
 * @ko values_count - 읽을 그래프 표본 수입니다.
 */
export function PlotLines(
  label: string | Uint8Array,
  values: Float32Array,
  values_count: number,
): void {
  native.PlotLines(label, values, values_count);
}

/**
 * Display numeric samples as a line plot.
 *
 * @zh 将数值样本显示为折线图。
 * @ja 数値サンプルを折れ線グラフで表示します。
 * @ko 숫자 샘플을 꺾은선 그래프로 표시합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param values - Float32Array of plot samples, read from the supplied storage;
 * values_count and stride must stay within that storage. Pass Float32Array
 * storage, not a JS scalar; native access uses the supplied backing memory.
 * @zh values - 从给定存储读取的 Float32Array 绘图样本；values_count 和 stride 必须限定在该存储内。 请传入
 * Float32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja values - プロット用の Float32Array サンプルです。values_count と stride
 * が領域内に収まるようにしてください。 JS スカラーではなく Float32Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko values - 그래프용 Float32Array 표본입니다. values_count와 stride가 저장 영역을 벗어나면 안
 * 됩니다. JS 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param values_count - Number of plot samples to read.
 * @zh values_count - 要读取的绘图样本数。
 * @ja values_count - 読み込むプロットのサンプル数です。
 * @ko values_count - 읽을 그래프 표본 수입니다.
 *
 * @param values_offset - Starting sample index in the circular sample sequence,
 * not a byte offset.
 * @zh values_offset - 循环样本序列的起始索引，不是字节偏移。
 * @ja values_offset - 循環サンプル列の開始インデックスです。バイト位置ではありません。
 * @ko values_offset - 순환 표본열의 시작 인덱스이며 바이트 오프셋이 아닙니다.
 *
 * @param overlay_text - Optional text drawn over the progress bar or plot; null
 * uses the widget default.
 * @zh overlay_text - 绘制于进度条或图表上的可选文字；null 使用控件默认行为。
 * @ja overlay_text - 進捗バーやプロット上の任意のテキストです。null はウィジェットの既定動作を使います。
 * @ko overlay_text - 진행 표시줄 또는 그래프 위의 선택적 텍스트입니다. null은 위젯 기본 동작을 사용합니다.
 *
 * @param scale_min - Lower/upper plot scale; 3.4028234663852886e+38 requests
 * automatic scaling
 * for that bound.
 * @zh scale_min - 图表刻度下限或上限；3.4028234663852886e+38 表示自动计算该边界。
 * @ja scale_min - プロット尺度の下限または上限です。3.4028234663852886e+38 ならその境界を自動計算します。
 * @ko scale_min - 그래프 축의 하한 또는 상한입니다. 3.4028234663852886e+38이면 해당 경계를 자동 계산합니다.
 *
 * @param scale_max - Lower/upper plot scale; 3.4028234663852886e+38 requests
 * automatic scaling
 * for that bound.
 * @zh scale_max - 图表刻度下限或上限；3.4028234663852886e+38 表示自动计算该边界。
 * @ja scale_max - プロット尺度の下限または上限です。3.4028234663852886e+38 ならその境界を自動計算します。
 * @ko scale_max - 그래프 축의 하한 또는 상한입니다. 3.4028234663852886e+38이면 해당 경계를 자동 계산합니다.
 *
 * @param graph_size - Widget width and height in pixels; zero uses native
 * automatic sizing and negative width reserves space from the available right
 * edge.
 * @zh graph_size - 控件像素宽高；零使用原生自动尺寸，负宽度从可用右边缘预留空间。
 * @ja graph_size - ウィジェットのピクセル寸法です。0 は自動設定、負の幅は利用可能な右端から余白を取ります。
 * @ko graph_size - 위젯 픽셀 크기입니다. 0은 자동 크기이며 음수 너비는 가용 오른쪽 끝에서 공간을 남깁니다.
 *
 * @param stride - Byte distance between consecutive plot samples, normally
 * Float32Array.BYTES_PER_ELEMENT = 4.
 * @zh stride - 相邻绘图样本之间的字节距离，通常 Float32Array.BYTES_PER_ELEMENT = 4。
 * @ja stride - 連続するサンプル間のバイト数です。通常は Float32Array.BYTES_PER_ELEMENT = 4 です。
 * @ko stride - 연속 그래프 표본 간 바이트 간격이며 보통 Float32Array.BYTES_PER_ELEMENT = 4입니다.
 */
export function PlotLinesEx(
  label: string | Uint8Array,
  values: Float32Array,
  values_count: number,
  values_offset: number = 0,
  overlay_text: string | Uint8Array | null = null,
  scale_min: number = 3.4028234663852886e+38,
  scale_max: number = 3.4028234663852886e+38,
  graph_size: ImVec2Like = { x: 0, y: 0 },
  stride: number,
): void {
  native.PlotLinesEx(
    label,
    values,
    values_count,
    values_offset,
    overlay_text,
    scale_min,
    scale_max,
    graph_size,
    stride,
  );
}

/**
 * Display numeric samples as vertical bars.
 *
 * @zh 将数值样本显示为垂直柱状图。
 * @ja 数値サンプルを縦棒グラフで表示します。
 * @ko 숫자 샘플을 세로 막대그래프로 표시합니다.
 *
 * @remarks
 * Implied values_offset = 0, overlay_text = null, scale_min =
 * 3.4028234663852886e+38,
 * scale_max = 3.4028234663852886e+38, graph_size = { x: 0, y: 0 }, stride =
 * Float32Array.BYTES_PER_ELEMENT
 * @zh
 * 隐含参数：values_offset = 0, overlay_text = null, scale_min =
 * 3.4028234663852886e+38, scale_max =
 * 3.4028234663852886e+38, graph_size = { x: 0, y: 0 }, stride =
 * Float32Array.BYTES_PER_ELEMENT。
 * @ja
 * 暗黙の引数：values_offset = 0, overlay_text = null, scale_min =
 * 3.4028234663852886e+38, scale_max
 * = 3.4028234663852886e+38, graph_size = { x: 0, y: 0 }, stride =
 * Float32Array.BYTES_PER_ELEMENT。
 * @ko
 * 암묵적 인수: values_offset = 0, overlay_text = null, scale_min =
 * 3.4028234663852886e+38,
 * scale_max = 3.4028234663852886e+38, graph_size = { x: 0, y: 0 }, stride =
 * Float32Array.BYTES_PER_ELEMENT.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param values - Float32Array of plot samples, read from the supplied storage;
 * values_count and stride must stay within that storage. Pass Float32Array
 * storage, not a JS scalar; native access uses the supplied backing memory.
 * @zh values - 从给定存储读取的 Float32Array 绘图样本；values_count 和 stride 必须限定在该存储内。 请传入
 * Float32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja values - プロット用の Float32Array サンプルです。values_count と stride
 * が領域内に収まるようにしてください。 JS スカラーではなく Float32Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko values - 그래프용 Float32Array 표본입니다. values_count와 stride가 저장 영역을 벗어나면 안
 * 됩니다. JS 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param values_count - Number of plot samples to read.
 * @zh values_count - 要读取的绘图样本数。
 * @ja values_count - 読み込むプロットのサンプル数です。
 * @ko values_count - 읽을 그래프 표본 수입니다.
 */
export function PlotHistogram(
  label: string | Uint8Array,
  values: Float32Array,
  values_count: number,
): void {
  native.PlotHistogram(label, values, values_count);
}

/**
 * Display numeric samples as vertical bars.
 *
 * @zh 将数值样本显示为垂直柱状图。
 * @ja 数値サンプルを縦棒グラフで表示します。
 * @ko 숫자 샘플을 세로 막대그래프로 표시합니다.
 *
 * @param label - Widget label; interactive widgets also use it for ID
 * generation. A ## suffix can distinguish IDs without displaying the suffix.
 * @zh label - 控件标签；交互控件也用它生成 ID。可用 ## 后缀区分 ID 而不显示后缀。
 * @ja label - ウィジェットのラベルです。対話型ウィジェットでは ID の生成にも使います。## 接尾辞で表示せずに ID を区別できます。
 * @ko label - 위젯 레이블입니다. 대화형 위젯의 ID 생성에도 사용하며 ## 접미사로 표시 없이 ID를 구별할 수 있습니다.
 *
 * @param values - Float32Array of plot samples, read from the supplied storage;
 * values_count and stride must stay within that storage. Pass Float32Array
 * storage, not a JS scalar; native access uses the supplied backing memory.
 * @zh values - 从给定存储读取的 Float32Array 绘图样本；values_count 和 stride 必须限定在该存储内。 请传入
 * Float32Array 存储而非 JS 标量；原生代码直接访问所提供的底层内存。
 * @ja values - プロット用の Float32Array サンプルです。values_count と stride
 * が領域内に収まるようにしてください。 JS スカラーではなく Float32Array を渡します。ネイティブ処理は渡された領域を直接使います。
 * @ko values - 그래프용 Float32Array 표본입니다. values_count와 stride가 저장 영역을 벗어나면 안
 * 됩니다. JS 스칼라가 아닌 Float32Array 저장소를 전달합니다. 네이티브 코드는 제공된 메모리를 직접 사용합니다。
 *
 * @param values_count - Number of plot samples to read.
 * @zh values_count - 要读取的绘图样本数。
 * @ja values_count - 読み込むプロットのサンプル数です。
 * @ko values_count - 읽을 그래프 표본 수입니다.
 *
 * @param values_offset - Starting sample index in the circular sample sequence,
 * not a byte offset.
 * @zh values_offset - 循环样本序列的起始索引，不是字节偏移。
 * @ja values_offset - 循環サンプル列の開始インデックスです。バイト位置ではありません。
 * @ko values_offset - 순환 표본열의 시작 인덱스이며 바이트 오프셋이 아닙니다.
 *
 * @param overlay_text - Optional text drawn over the progress bar or plot; null
 * uses the widget default.
 * @zh overlay_text - 绘制于进度条或图表上的可选文字；null 使用控件默认行为。
 * @ja overlay_text - 進捗バーやプロット上の任意のテキストです。null はウィジェットの既定動作を使います。
 * @ko overlay_text - 진행 표시줄 또는 그래프 위의 선택적 텍스트입니다. null은 위젯 기본 동작을 사용합니다.
 *
 * @param scale_min - Lower/upper plot scale; 3.4028234663852886e+38 requests
 * automatic scaling
 * for that bound.
 * @zh scale_min - 图表刻度下限或上限；3.4028234663852886e+38 表示自动计算该边界。
 * @ja scale_min - プロット尺度の下限または上限です。3.4028234663852886e+38 ならその境界を自動計算します。
 * @ko scale_min - 그래프 축의 하한 또는 상한입니다. 3.4028234663852886e+38이면 해당 경계를 자동 계산합니다.
 *
 * @param scale_max - Lower/upper plot scale; 3.4028234663852886e+38 requests
 * automatic scaling
 * for that bound.
 * @zh scale_max - 图表刻度下限或上限；3.4028234663852886e+38 表示自动计算该边界。
 * @ja scale_max - プロット尺度の下限または上限です。3.4028234663852886e+38 ならその境界を自動計算します。
 * @ko scale_max - 그래프 축의 하한 또는 상한입니다. 3.4028234663852886e+38이면 해당 경계를 자동 계산합니다.
 *
 * @param graph_size - Widget width and height in pixels; zero uses native
 * automatic sizing and negative width reserves space from the available right
 * edge.
 * @zh graph_size - 控件像素宽高；零使用原生自动尺寸，负宽度从可用右边缘预留空间。
 * @ja graph_size - ウィジェットのピクセル寸法です。0 は自動設定、負の幅は利用可能な右端から余白を取ります。
 * @ko graph_size - 위젯 픽셀 크기입니다. 0은 자동 크기이며 음수 너비는 가용 오른쪽 끝에서 공간을 남깁니다.
 *
 * @param stride - Byte distance between consecutive plot samples, normally
 * Float32Array.BYTES_PER_ELEMENT = 4.
 * @zh stride - 相邻绘图样本之间的字节距离，通常 Float32Array.BYTES_PER_ELEMENT = 4。
 * @ja stride - 連続するサンプル間のバイト数です。通常は Float32Array.BYTES_PER_ELEMENT = 4 です。
 * @ko stride - 연속 그래프 표본 간 바이트 간격이며 보통 Float32Array.BYTES_PER_ELEMENT = 4입니다.
 */
export function PlotHistogramEx(
  label: string | Uint8Array,
  values: Float32Array,
  values_count: number,
  values_offset: number = 0,
  overlay_text: string | Uint8Array | null = null,
  scale_min: number = 3.4028234663852886e+38,
  scale_max: number = 3.4028234663852886e+38,
  graph_size: ImVec2Like = { x: 0, y: 0 },
  stride: number,
): void {
  native.PlotHistogramEx(
    label,
    values,
    values_count,
    values_offset,
    overlay_text,
    scale_min,
    scale_max,
    graph_size,
    stride,
  );
}
