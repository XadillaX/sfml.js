import { native } from './internal/native';
import { writableStruct } from './internal/sfml-interop';
import type {
  ImDrawCmd,
  ImDrawData,
  ImDrawList,
  ImDrawListSplitter,
  ImFontAtlas,
  ImFontAtlasCustomRect,
  ImFontConfig,
  ImFontGlyph,
  ImGuiIO,
  ImGuiInputTextCallbackData,
  ImGuiListClipper,
  ImGuiMultiSelectIO,
  ImGuiPayload,
  ImGuiPlatformIO,
  ImGuiSelectionBasicStorage,
  ImGuiStyle,
  ImGuiTableSortSpecs,
  ImGuiTextFilter,
  ImGuiViewport,
} from './types';

/**
 * Draw-command scalars backed by native memory, not a snapshot.
 *
 * @zh 原生内存中的绘制命令标量，不是快照。
 * @ja ネイティブメモリー上の描画命令値。スナップショットではありません。
 * @ko 네이티브 메모리의 그리기 명령 값이며 스냅샷이 아닙니다.
 */
export interface ImDrawCmdFields {
  /**
   * Left clip edge in display coordinates, before framebuffer scaling.
   *
   * @zh 显示坐标中的裁剪左边界，尚未应用帧缓冲缩放。
   * @ja フレームバッファ倍率適用前の表示座標でのクリップ左端。
   * @ko 프레임버퍼 배율 적용 전 표시 좌표의 클립 왼쪽 경계입니다.
   */
  ClipRectX: number;
  /**
   * Top clip edge in display coordinates, before framebuffer scaling.
   *
   * @zh 显示坐标中的裁剪上边界，尚未应用帧缓冲缩放。
   * @ja フレームバッファ倍率適用前の表示座標でのクリップ上端。
   * @ko 프레임버퍼 배율 적용 전 표시 좌표의 클립 위쪽 경계입니다.
   */
  ClipRectY: number;
  /**
   * Right clip edge, not a width; subtract DisplayPosX for viewport space.
   *
   * @zh 裁剪右边界而非宽度；减去 DisplayPosX 可转为视口坐标。
   * @ja 幅ではなくクリップ右端。DisplayPosX を引くとビューポート座標です。
   * @ko 너비가 아닌 클립 오른쪽 끝입니다. DisplayPosX를 빼면 뷰포트 좌표입니다.
   */
  ClipRectZ: number;
  /**
   * Bottom clip edge, not a height; subtract DisplayPosY for viewport space.
   *
   * @zh 裁剪下边界而非高度；减去 DisplayPosY 可转为视口坐标。
   * @ja 高さではなくクリップ下端。DisplayPosY を引くとビューポート座標です。
   * @ko 높이가 아닌 클립 아래쪽 끝입니다. DisplayPosY를 빼면 뷰포트 좌표입니다.
   */
  ClipRectW: number;
  /**
   * Renderer texture identifier stored as an unsigned 64-bit integer.
   *
   * @zh 以无符号 64 位整数存储的渲染器纹理标识符。
   * @ja 符号なし 64 ビット整数で格納するレンダラーのテクスチャ ID。
   * @ko 부호 없는 64비트 정수로 저장하는 렌더러 텍스처 ID입니다.
   */
  TextureId: bigint;
  /**
   * Base vertex index; nonzero offsets require RendererHasVtxOffset support.
   *
   * @zh 基准顶点索引；非零偏移需要 RendererHasVtxOffset 支持。
   * @ja 基準頂点番号。非ゼロ値には RendererHasVtxOffset の対応が必要です。
   * @ko 기준 정점 인덱스입니다. 0이 아니면 RendererHasVtxOffset 지원이 필요합니다.
   */
  VtxOffset: number;
  /**
   * Starting index-buffer element, not a byte offset.
   *
   * @zh 索引缓冲区的起始元素位置，不是字节偏移。
   * @ja インデックスバッファの開始要素位置。バイト単位ではありません。
   * @ko 인덱스 버퍼의 시작 요소 위치이며 바이트 오프셋이 아닙니다.
   */
  IdxOffset: number;
  /**
   * Number of indices to render; triangle commands use multiples of three.
   *
   * @zh 要渲染的索引数量；三角形命令使用三的倍数。
   * @ja 描画するインデックス数。三角形命令では 3 の倍数です。
   * @ko 렌더링할 인덱스 수입니다. 삼각형 명령에서는 3의 배수입니다.
   */
  ElemCount: number;
  /**
   * Copied callback payload size in bytes; zero means external user data.
   *
   * @zh 复制的回调载荷字节数；零表示使用外部用户数据。
   * @ja コピーしたコールバックデータのバイト数。0 は外部データを表します。
   * @ko 복사한 콜백 데이터의 바이트 수입니다. 0은 외부 데이터를 뜻합니다.
   */
  UserCallbackDataSize: number;
  /**
   * Internal payload byte offset in draw-list storage, or -1 without storage.
   *
   * @zh 绘制列表存储内的载荷字节偏移；未使用存储时为 -1。
   * @ja 描画リスト内データの内部バイト位置。格納しない場合は -1 です。
   * @ko 그리기 목록 저장소의 내부 바이트 오프셋입니다. 저장하지 않으면 -1입니다.
   */
  UserCallbackDataOffset: number;
}

/**
 * Access a draw command without copying its scalar values.
 *
 * @zh 无需复制标量值即可访问绘制命令。
 * @ja スカラー値をコピーせずに描画命令へアクセスします。
 * @ko 스칼라 값을 복사하지 않고 그리기 명령에 접근합니다.
 * @remarks
 * Keep the owning draw list alive. Reallocation, a new frame or callback
 * return may invalidate borrowed command storage. No lifetime check is made.
 * @zh 保持所属绘制列表存活。重分配、新帧或回调返回可能使借用存储失效；
 * 此视图不检查生命周期。
 * @ja 所有リストを維持してください。再確保、新フレーム、コールバック終了で
 * 借用領域が無効になる場合があります。寿命の検査は行いません。
 * @ko 소유 목록을 유지하세요. 재할당, 새 프레임 또는 콜백 반환으로 빌린 저장소가
 * 무효화될 수 있습니다. 수명 검사는 수행하지 않습니다.
 * @param handle - Native command with valid backing storage.
 * @zh handle - 底层存储仍有效的原生命令。
 * @ja handle - 保存領域が有効なネイティブ命令。
 * @ko handle - 저장소가 유효한 네이티브 명령입니다.
 * @returns Live getters and setters using native scalar widths.
 * @zh 使用原生标量宽度的实时读写属性。
 * @ja ネイティブ型の幅で読み書きするライブプロパティー。
 * @ko 네이티브 스칼라 너비로 읽고 쓰는 실시간 속성입니다.
 */
export function viewImDrawCmd(handle: ImDrawCmd): ImDrawCmdFields {
  return writableStruct<ImDrawCmdFields>(native.viewImDrawCmd(handle));
}

/**
 * Frame rendering totals and display-to-framebuffer geometry.
 *
 * @zh 帧渲染统计与显示坐标到帧缓冲的几何信息。
 * @ja フレーム描画の集計と表示・フレームバッファ間の座標情報。
 * @ko 프레임 렌더링 집계와 표시 좌표에서 프레임버퍼로의 지오메트리입니다.
 */
export interface ImDrawDataFields {
  /**
   * True after Render() and before the next NewFrame().
   *
   * @zh Render() 之后、下一次 NewFrame() 之前为真。
   * @ja Render() 後から次の NewFrame() 前まで真です。
   * @ko Render() 후부터 다음 NewFrame() 전까지 참입니다.
   */
  Valid: boolean;
  /**
   * Number of draw lists submitted for this frame.
   *
   * @zh 此帧提交的绘制列表数量。
   * @ja このフレームに提出された描画リスト数。
   * @ko 이 프레임에 제출된 그리기 목록 수입니다.
   */
  CmdListsCount: number;
  /**
   * Sum of index counts across all submitted draw lists.
   *
   * @zh 所有已提交绘制列表的索引总数。
   * @ja 提出された全描画リストのインデックス数の合計。
   * @ko 제출된 모든 그리기 목록의 인덱스 수 합계입니다.
   */
  TotalIdxCount: number;
  /**
   * Sum of vertex counts across all submitted draw lists.
   *
   * @zh 所有已提交绘制列表的顶点总数。
   * @ja 提出された全描画リストの頂点数の合計。
   * @ko 제출된 모든 그리기 목록의 정점 수 합계입니다.
   */
  TotalVtxCount: number;
  /**
   * Viewport left edge in display coordinates.
   *
   * @zh 显示坐标中的视口左边界。
   * @ja 表示座標でのビューポート左端。
   * @ko 표시 좌표의 뷰포트 왼쪽 끝입니다.
   */
  DisplayPosX: number;
  /**
   * Viewport top edge in display coordinates.
   *
   * @zh 显示坐标中的视口上边界。
   * @ja 表示座標でのビューポート上端。
   * @ko 표시 좌표의 뷰포트 위쪽 끝입니다.
   */
  DisplayPosY: number;
  /**
   * Viewport width in display units, before framebuffer scaling.
   *
   * @zh 以显示单位计的视口宽度，尚未应用帧缓冲缩放。
   * @ja フレームバッファ倍率適用前の表示単位でのビューポート幅。
   * @ko 프레임버퍼 배율 적용 전 표시 단위의 뷰포트 너비입니다.
   */
  DisplaySizeX: number;
  /**
   * Viewport height in display units, before framebuffer scaling.
   *
   * @zh 以显示单位计的视口高度，尚未应用帧缓冲缩放。
   * @ja フレームバッファ倍率適用前の表示単位でのビューポート高さ。
   * @ko 프레임버퍼 배율 적용 전 표시 단위의 뷰포트 높이입니다.
   */
  DisplaySizeY: number;
  /**
   * Horizontal framebuffer pixels per display unit; commonly 1 or 2.
   *
   * @zh 每显示单位对应的水平帧缓冲像素数，通常为 1 或 2。
   * @ja 表示単位あたりの水平フレームバッファ画素数。通常 1 または 2。
   * @ko 표시 단위당 수평 프레임버퍼 픽셀 수입니다. 보통 1 또는 2입니다.
   */
  FramebufferScaleX: number;
  /**
   * Vertical framebuffer pixels per display unit; commonly 1 or 2.
   *
   * @zh 每显示单位对应的垂直帧缓冲像素数，通常为 1 或 2。
   * @ja 表示単位あたりの垂直フレームバッファ画素数。通常 1 または 2。
   * @ko 표시 단위당 수직 프레임버퍼 픽셀 수입니다. 보통 1 또는 2입니다.
   */
  FramebufferScaleY: number;
}

/**
 * View frame draw data between Render() and the next NewFrame().
 *
 * @zh 在 Render() 与下一次 NewFrame() 之间查看帧绘制数据。
 * @ja Render() から次の NewFrame() までの描画データを参照します。
 * @ko Render()와 다음 NewFrame() 사이에 프레임 그리기 데이터를 참조합니다.
 * @param handle - Borrowed draw data; keep its context alive.
 * @zh handle - 借用的绘制数据；须保持所属上下文存活。
 * @ja handle - 借用した描画データ。所有コンテキストを維持してください。
 * @ko handle - 빌린 그리기 데이터입니다. 소유 컨텍스트를 유지하세요.
 * @returns Writable native-backed properties, not a retained frame snapshot.
 * @zh 可写的原生内存属性，不是可保留的帧快照。
 * @ja 書き込み可能なネイティブプロパティー。保持できるフレーム複製ではありません。
 * @ko 쓰기 가능한 네이티브 속성입니다. 보관 가능한 프레임 복사본이 아닙니다.
 */
export function viewImDrawData(handle: ImDrawData): ImDrawDataFields {
  return writableStruct<ImDrawDataFields>(native.viewImDrawData(handle));
}

/**
 * Draw-list configuration and internal geometry bookkeeping.
 *
 * @zh 绘制列表配置及内部几何记账状态。
 * @ja 描画リスト設定と内部ジオメトリー管理状態。
 * @ko 그리기 목록 설정 및 내부 지오메트리 관리 상태입니다.
 */
export interface ImDrawListFields {
  /**
   * ImDrawListFlags bitmask; anti-alias defaults are copied at frame start.
   *
   * @zh ImDrawListFlags 位掩码；抗锯齿默认值在帧开始时复制。
   * @ja ImDrawListFlags ビットマスク。平滑化の既定値はフレーム開始時にコピー。
   * @ko ImDrawListFlags 비트 마스크입니다. 안티앨리어싱 기본값은 프레임 시작에 복사됩니다.
   */
  Flags: number;
  /**
   * Internal current vertex index relative to the active VtxOffset.
   *
   * @zh 相对于当前 VtxOffset 的内部顶点索引。
   * @ja 現在の VtxOffset を基準にした内部頂点インデックス。
   * @ko 현재 VtxOffset 기준의 내부 정점 인덱스입니다.
   */
  _VtxCurrentIdx: number;
  /**
   * Internal anti-alias fringe width multiplier, normally one.
   *
   * @zh 内部抗锯齿边缘宽度倍率，通常为一。
   * @ja 内部アンチエイリアス縁幅の倍率。通常は 1 です。
   * @ko 내부 안티앨리어싱 가장자리 너비 배율입니다. 보통 1입니다.
   */
  _FringeScale: number;
}

/**
 * Access draw-list scalars while its storage remains valid.
 *
 * @zh 在绘制列表存储有效期间访问其标量。
 * @ja 描画リストの保存領域が有効な間、スカラー値にアクセスします。
 * @ko 그리기 목록 저장소가 유효한 동안 스칼라 값에 접근합니다.
 * @param handle - Draw list; reacquire window-owned lists each frame.
 * @zh handle - 绘制列表；每帧重新获取窗口拥有的列表。
 * @ja handle - 描画リスト。ウィンドウ所有の場合はフレームごとに再取得。
 * @ko handle - 그리기 목록입니다. 창 소유 목록은 매 프레임 다시 얻으세요.
 * @returns Live writable scalars; internal counters are not editing APIs.
 * @zh 实时可写标量；内部计数器不应作为编辑 API 使用。
 * @ja ライブ書き込み値。内部カウンターは編集用 API ではありません。
 * @ko 실시간 쓰기 가능 값입니다. 내부 카운터는 편집 API가 아닙니다.
 */
export function viewImDrawList(handle: ImDrawList): ImDrawListFields {
  return writableStruct<ImDrawListFields>(native.viewImDrawList(handle));
}

/**
 * Internal active-channel state maintained by split, merge and switch calls.
 *
 * @zh 由拆分、合并与切换调用维护的内部通道状态。
 * @ja 分割・結合・切り替え呼び出しで管理する内部チャンネル状態。
 * @ko 분할, 병합 및 전환 호출로 관리하는 내부 채널 상태입니다.
 */
export interface ImDrawListSplitterFields {
  /**
   * Zero-based channel currently receiving commands.
   *
   * @zh 当前接收命令的通道索引，从零开始。
   * @ja 現在命令を受け取るチャンネルの 0 始まり番号。
   * @ko 현재 명령을 받는 채널의 0부터 시작하는 번호입니다.
   */
  _Current: number;
  /**
   * Active channel count, not the allocated channel capacity.
   *
   * @zh 活跃通道数，不是已分配的通道容量。
   * @ja 有効なチャンネル数。確保済み容量ではありません。
   * @ko 활성 채널 수이며 할당된 채널 용량이 아닙니다.
   */
  _Count: number;
}

/**
 * Inspect the splitter's live bookkeeping without copying it.
 *
 * @zh 无需复制即可检查拆分器的实时记账状态。
 * @ja コピーせずにスプリッターの管理状態を参照します。
 * @ko 복사 없이 분할 도우미의 실시간 관리 상태를 참조합니다.
 * @param handle - Splitter whose owner must remain alive.
 * @zh handle - 所有者必须保持存活的拆分器。
 * @ja handle - 所有者が存続しているスプリッター。
 * @ko handle - 소유자가 살아 있어야 하는 분할 도우미입니다.
 * @returns Writable internal counters; use splitter methods to switch channels.
 * @zh 可写内部计数器；切换通道应使用拆分器方法。
 * @ja 書き込み可能な内部カウンター。切り替えには専用メソッドを使います。
 * @ko 쓰기 가능한 내부 카운터입니다. 채널 전환에는 전용 메서드를 사용하세요.
 */
export function viewImDrawListSplitter(
  handle: ImDrawListSplitter,
): ImDrawListSplitterFields {
  return writableStruct<ImDrawListSplitterFields>(
    native.viewImDrawListSplitter(handle),
  );
}

/**
 * Atlas build configuration; edit before building, never while frame-locked.
 *
 * @zh 图集构建配置；应在构建前修改，不要在帧锁定期间修改。
 * @ja アトラス構築設定。構築前に編集し、フレームのロック中は変更しないでください。
 * @ko 아틀라스 빌드 설정입니다. 빌드 전에 편집하고 프레임 잠금 중에는 수정하지 마세요.
 */
export interface ImFontAtlasFields {
  /**
   * ImFontAtlasFlags controlling texture packing and baked auxiliary shapes.
   *
   * @zh 控制纹理打包和辅助图形烘焙的 ImFontAtlasFlags。
   * @ja テクスチャ配置と補助図形の焼き込みを制御する ImFontAtlasFlags。
   * @ko 텍스처 패킹과 보조 도형 베이킹을 제어하는 ImFontAtlasFlags입니다.
   */
  Flags: number;
  /**
   * Unsigned 64-bit renderer texture ID, not a texture allocation.
   *
   * @zh 无符号 64 位渲染器纹理 ID，本身不是纹理分配。
   * @ja 符号なし 64 ビットのレンダラーテクスチャ ID。テクスチャ自体ではありません。
   * @ko 부호 없는 64비트 렌더러 텍스처 ID이며 텍스처 할당 자체가 아닙니다.
   */
  TexID: bigint;
  /**
   * Requested texture width in pixels; zero is automatic, otherwise power of
   * two.
   *
   * @zh 请求的纹理像素宽度；零表示自动，否则应为二的幂。
   * @ja 希望するテクスチャ幅の画素数。0 は自動、それ以外は 2 の累乗。
   * @ko 요청할 텍스처 너비의 픽셀 수입니다. 0은 자동이며 그 외에는 2의 거듭제곱입니다.
   */
  TexDesiredWidth: number;
  /**
   * Padding in atlas pixels between packed glyphs, normally one.
   *
   * @zh 图集中字形之间的像素间距，通常为一。
   * @ja アトラス内のグリフ間余白の画素数。通常は 1 です。
   * @ko 아틀라스의 글리프 사이 픽셀 여백입니다. 보통 1입니다.
   */
  TexGlyphPadding: number;
}

/**
 * Access atlas settings through native-backed scalar properties.
 *
 * @zh 通过原生内存标量属性访问图集设置。
 * @ja ネイティブメモリー上のスカラー値でアトラス設定にアクセスします。
 * @ko 네이티브 메모리 스칼라 속성으로 아틀라스 설정에 접근합니다.
 * @param handle - Atlas; keep its owner alive and respect the frame lock.
 * @zh handle - 图集；须保持所有者存活并遵守帧锁。
 * @ja handle - アトラス。所有者を維持し、フレームロックに従ってください。
 * @ko handle - 아틀라스입니다. 소유자를 유지하고 프레임 잠금을 준수하세요.
 * @returns Live settings; assignments do not rebuild or upload the texture.
 * @zh 实时设置；赋值不会重建或上传纹理。
 * @ja ライブ設定。代入してもテクスチャの再構築やアップロードはしません。
 * @ko 실시간 설정입니다. 대입해도 텍스처가 재빌드되거나 업로드되지는 않습니다.
 */
export function viewImFontAtlas(handle: ImFontAtlas): ImFontAtlasFields {
  return writableStruct<ImFontAtlasFields>(native.viewImFontAtlas(handle));
}

/**
 * Atlas packing output; these are pixel coordinates, not normalized UVs.
 *
 * @zh 图集打包输出；这些是像素坐标，不是归一化 UV。
 * @ja アトラス配置結果。正規化 UV ではなく画素座標です。
 * @ko 아틀라스 패킹 결과입니다. 정규화된 UV가 아닌 픽셀 좌표입니다.
 */
export interface ImFontAtlasCustomRectFields {
  /**
   * Packed left edge in pixels; 65535 means not packed yet.
   *
   * @zh 打包后的左边界像素坐标；65535 表示尚未打包。
   * @ja 配置後の左端の画素座標。65535 は未配置です。
   * @ko 패킹된 왼쪽 끝의 픽셀 좌표입니다. 65535는 아직 패킹되지 않았다는 뜻입니다.
   */
  X: number;
  /**
   * Packed top edge in pixels; initialized to 65535 before packing.
   *
   * @zh 打包后的上边界像素坐标；打包前初始化为 65535。
   * @ja 配置後の上端の画素座標。配置前の初期値は 65535 です。
   * @ko 패킹된 위쪽 끝의 픽셀 좌표입니다. 패킹 전 초기값은 65535입니다.
   */
  Y: number;
}

/**
 * Read or write the native atlas rectangle's packed position.
 *
 * @zh 读写原生图集矩形的打包位置。
 * @ja ネイティブアトラス矩形の配置位置を読み書きします。
 * @ko 네이티브 아틀라스 사각형의 패킹 위치를 읽고 씁니다.
 * @param handle - Borrowed rectangle; reacquire after atlas storage changes.
 * @zh handle - 借用矩形；图集存储变化后需重新获取。
 * @ja handle - 借用した矩形。アトラス保存領域の変更後は再取得してください。
 * @ko handle - 빌린 사각형입니다. 아틀라스 저장소 변경 후 다시 얻으세요.
 * @returns Live unsigned 16-bit coordinates; writes do not repack pixels.
 * @zh 实时无符号 16 位坐标；写入不会重新打包像素。
 * @ja ライブの符号なし 16 ビット座標。書き込みで画素は再配置されません。
 * @ko 실시간 부호 없는 16비트 좌표입니다. 쓰기는 픽셀을 다시 패킹하지 않습니다.
 */
export function viewImFontAtlasCustomRect(
  handle: ImFontAtlasCustomRect,
): ImFontAtlasCustomRectFields {
  return writableStruct<ImFontAtlasCustomRectFields>(
    native.viewImFontAtlasCustomRect(handle),
  );
}

/**
 * Font-source and rasterizer settings consumed by atlas construction.
 *
 * @zh 图集构建所使用的字体源和光栅器设置。
 * @ja アトラス構築時に使用するフォントソースとラスタライザーの設定。
 * @ko 아틀라스 빌드가 사용하는 폰트 소스 및 래스터라이저 설정입니다.
 */
export interface ImFontConfigFields {
  /**
   * TTF/OTF source length in bytes; changing this does not resize the source.
   *
   * @zh TTF/OTF 源数据字节数；修改不会调整源数据大小。
   * @ja TTF/OTF データのバイト長。変更してもデータのサイズは変わりません。
   * @ko TTF/OTF 소스의 바이트 길이입니다. 변경해도 소스 크기는 바뀌지 않습니다.
   */
  FontDataSize: number;
  /**
   * Whether the atlas frees font bytes; do not change for borrowed JS buffers.
   *
   * @zh 图集是否释放字体字节；借用 JS 缓冲区时不要随意修改。
   * @ja アトラスがフォントデータを解放するか。借用 JS バッファでは変更しないこと。
   * @ko 아틀라스가 폰트 바이트를 해제할지 여부입니다. 빌린 JS 버퍼에서는 바꾸지 마세요.
   */
  FontDataOwnedByAtlas: boolean;
  /**
   * Merge glyphs into the preceding font instead of creating a separate font.
   *
   * @zh 将字形合并到前一个字体，而非创建单独字体。
   * @ja 別フォントを作らず、直前のフォントへグリフを結合します。
   * @ko 별도 폰트를 만들지 않고 이전 폰트에 글리프를 병합합니다.
   */
  MergeMode: boolean;
  /**
   * Round each glyph's horizontal advance to whole pixels.
   *
   * @zh 将各字形的水平前进量对齐到整数像素。
   * @ja グリフの水平送り幅を整数画素に丸めます。
   * @ko 각 글리프의 수평 전진 폭을 정수 픽셀에 맞춥니다.
   */
  PixelSnapH: boolean;
  /**
   * Zero-based face index within a TTF/OTF collection.
   *
   * @zh TTF/OTF 集合内从零开始的字体索引。
   * @ja TTF/OTF コレクション内の 0 始まりのフォント番号。
   * @ko TTF/OTF 컬렉션 안에서 0부터 시작하는 폰트 인덱스입니다.
   */
  FontNo: number;
  /**
   * Horizontal rasterization oversampling; zero chooses one or two
   * automatically.
   *
   * @zh 水平光栅化过采样倍率；零表示自动选择一或二。
   * @ja 水平ラスタライズの過剰サンプル倍率。0 は 1 または 2 を自動選択。
   * @ko 수평 래스터화 오버샘플링 배율입니다. 0은 1 또는 2를 자동 선택합니다.
   */
  OversampleH: number;
  /**
   * Vertical rasterization oversampling; zero automatically selects one.
   *
   * @zh 垂直光栅化过采样倍率；零表示自动选择一。
   * @ja 垂直ラスタライズの過剰サンプル倍率。0 は自動で 1 を選びます。
   * @ko 수직 래스터화 오버샘플링 배율입니다. 0은 자동으로 1을 선택합니다.
   */
  OversampleV: number;
  /**
   * Requested rasterized font size in pixels, approximately its height.
   *
   * @zh 请求的光栅化字体像素大小，近似对应字体高度。
   * @ja 希望するラスタライズ文字サイズの画素数。おおよその文字高です。
   * @ko 요청한 래스터 폰트의 픽셀 크기이며 대략 폰트 높이에 해당합니다.
   */
  SizePixels: number;
  /**
   * Horizontal offset in pixels applied to every glyph from this source.
   *
   * @zh 应用于此字体源所有字形的水平像素偏移。
   * @ja このソースの全グリフに加える水平画素オフセット。
   * @ko 이 소스의 모든 글리프에 적용할 수평 픽셀 오프셋입니다.
   */
  GlyphOffsetX: number;
  /**
   * Vertical offset in pixels; useful when merging fonts with different
   * heights.
   *
   * @zh 垂直像素偏移；适用于合并不同高度的字体。
   * @ja 垂直画素オフセット。高さの異なるフォントの結合時に使います。
   * @ko 수직 픽셀 오프셋입니다. 높이가 다른 폰트를 병합할 때 유용합니다.
   */
  GlyphOffsetY: number;
  /**
   * Minimum horizontal advance in pixels; set with the maximum for monospace.
   *
   * @zh 最小水平前进像素数；与最大值配合可实现等宽。
   * @ja 最小水平送り幅の画素数。最大値と合わせると等幅にできます。
   * @ko 최소 수평 전진 픽셀 수입니다. 최댓값과 함께 설정하면 고정 폭을 만듭니다.
   */
  GlyphMinAdvanceX: number;
  /**
   * Maximum horizontal advance in pixels; 3.4028234663852886e38 disables the
   * bound.
   *
   * @zh 最大水平前进像素数；3.4028234663852886e38 表示不设上限。
   * @ja 最大水平送り幅の画素数。3.4028234663852886e38 で上限なしです。
   * @ko 최대 수평 전진 픽셀 수입니다. 3.4028234663852886e38은 상한을 없앱니다.
   */
  GlyphMaxAdvanceX: number;
  /**
   * Extra horizontal spacing in pixels added between glyphs.
   *
   * @zh 字形之间额外添加的水平像素间距。
   * @ja グリフ間に追加する水平画素間隔。
   * @ko 글리프 사이에 추가하는 수평 픽셀 간격입니다.
   */
  GlyphExtraAdvanceX: number;
  /**
   * Builder-specific unsigned flag mask; zero uses that builder's defaults.
   *
   * @zh 构建器特有的无符号标志掩码；零表示使用其默认值。
   * @ja ビルダー固有の符号なしフラグ。0 はそのビルダーの既定値です。
   * @ko 빌더 전용 부호 없는 플래그입니다. 0은 해당 빌더의 기본값입니다.
   */
  FontBuilderFlags: number;
  /**
   * Rasterized coverage multiplier; above one brightens, below one darkens.
   *
   * @zh 光栅化覆盖率倍率；大于一变亮，小于一变暗。
   * @ja ラスタライズ被覆率の倍率。1 より大きいと明るく、小さいと暗くなります。
   * @ko 래스터 커버리지 배율입니다. 1보다 크면 밝아지고 작으면 어두워집니다.
   */
  RasterizerMultiply: number;
  /**
   * Rasterization density multiplier; leaves logical glyph metrics unchanged.
   *
   * @zh 光栅化密度倍率；不改变字形的逻辑度量。
   * @ja ラスタライズ密度の倍率。論理グリフ寸法は変えません。
   * @ko 래스터화 밀도 배율입니다. 글리프의 논리 메트릭은 변경하지 않습니다.
   */
  RasterizerDensity: number;
  /**
   * Ellipsis Unicode value in this build's 16-bit ImWchar representation.
   *
   * @zh 省略号 Unicode 值，使用此构建的 16 位 ImWchar 表示。
   * @ja このビルドの 16 ビット ImWchar で表す省略記号の Unicode 値。
   * @ko 이 빌드의 16비트 ImWchar로 표현하는 줄임표 Unicode 값입니다.
   */
  EllipsisChar: number;
}

/**
 * Access font-build configuration without copying native scalars.
 *
 * @zh 无需复制原生标量即可访问字体构建配置。
 * @ja ネイティブ値をコピーせずにフォント構築設定にアクセスします。
 * @ko 네이티브 값을 복사하지 않고 폰트 빌드 설정에 접근합니다.
 * @param handle - Live configuration; borrowed atlas entries may be
 * reallocated.
 * @zh handle - 存活的配置；从图集借用的条目可能被重分配。
 * @ja handle - 有効な設定。アトラスから借用した要素は再確保される場合があります。
 * @ko handle - 유효한 설정입니다. 아틀라스에서 빌린 항목은 재할당될 수 있습니다.
 * @returns Writable settings; changing them does not rebuild existing glyphs.
 * @zh 可写设置；修改不会重建已有字形。
 * @ja 書き込み可能な設定。変更しても既存グリフは再構築されません。
 * @ko 쓰기 가능한 설정입니다. 변경해도 기존 글리프는 재빌드되지 않습니다.
 */
export function viewImFontConfig(handle: ImFontConfig): ImFontConfigFields {
  return writableStruct<ImFontConfigFields>(native.viewImFontConfig(handle));
}

/**
 * Live glyph metrics, UVs and native bitfield accessors.
 *
 * @zh 实时字形度量、UV 与原生位域访问器。
 * @ja ライブなグリフ寸法、UV とネイティブのビットフィールドアクセサー。
 * @ko 실시간 글리프 메트릭, UV 및 네이티브 비트 필드 접근자입니다.
 */
export interface ImFontGlyphFields {
  /**
   * Tint-bypass flag; reads and writes numeric 0 or 1 through native accessors.
   *
   * @zh 跳过染色标志；通过原生访问器读写数值 0 或 1。
   * @ja 色調変更を無視するフラグ。ネイティブアクセサーで数値 0 または 1 を読み書きします。
   * @ko 색조 적용 생략 플래그입니다. 네이티브 접근자로 숫자 0 또는 1을 읽고 씁니다.
   */
  Colored: number;
  /**
   * Visible-pixels flag; reads and writes numeric 0 or 1 via native accessors.
   *
   * @zh 存在可见像素标志；通过原生访问器读写数值 0 或 1。
   * @ja 可視画素の有無を表すフラグ。ネイティブアクセサーで数値 0 または 1 を読み書きします。
   * @ko 보이는 픽셀 존재 여부입니다. 네이티브 접근자로 숫자 0 또는 1을 읽고 씁니다.
   */
  Visible: number;
  /**
   * Glyph code point; accepts integers from 0 to 0x3fffffff (30 bits).
   * Changing it does not rebuild the font's glyph lookup table.
   *
   * @zh 字形码点；接受 0 至 0x3fffffff（30 位）的整数。
   * 修改它不会重建字体的字形查找表。
   * @ja グリフのコードポイント。0 から 0x3fffffff（30 ビット）の整数を受け付けます。
   * 変更してもフォントのグリフ検索表は再構築されません。
   * @ko 글리프 코드 포인트입니다. 0부터 0x3fffffff까지의 30비트 정수를 받습니다.
   * 변경해도 폰트의 글리프 조회 테이블은 다시 빌드되지 않습니다.
   */
  Codepoint: number;
  /**
   * Horizontal cursor advance in unscaled font pixels.
   *
   * @zh 未缩放字体像素中的水平光标前进量。
   * @ja 拡大縮小前のフォント画素単位での水平カーソル送り幅。
   * @ko 배율 적용 전 폰트 픽셀 단위의 수평 커서 전진 폭입니다.
   */
  AdvanceX: number;
  /**
   * Glyph quad left edge relative to the text origin, in font pixels.
   *
   * @zh 相对文本原点的字形四边形左边界，以字体像素计。
   * @ja テキスト原点に対するグリフ矩形左端。フォント画素単位。
   * @ko 텍스트 원점 기준 글리프 사각형 왼쪽 끝입니다. 폰트 픽셀 단위입니다.
   */
  X0: number;
  /**
   * Glyph quad top edge relative to the text origin, in font pixels.
   *
   * @zh 相对文本原点的字形四边形上边界，以字体像素计。
   * @ja テキスト原点に対するグリフ矩形上端。フォント画素単位。
   * @ko 텍스트 원점 기준 글리프 사각형 위쪽 끝입니다. 폰트 픽셀 단위입니다.
   */
  Y0: number;
  /**
   * Glyph quad right edge relative to the text origin, in font pixels.
   *
   * @zh 相对文本原点的字形四边形右边界，以字体像素计。
   * @ja テキスト原点に対するグリフ矩形右端。フォント画素単位。
   * @ko 텍스트 원점 기준 글리프 사각형 오른쪽 끝입니다. 폰트 픽셀 단위입니다.
   */
  X1: number;
  /**
   * Glyph quad bottom edge relative to the text origin, in font pixels.
   *
   * @zh 相对文本原点的字形四边形下边界，以字体像素计。
   * @ja テキスト原点に対するグリフ矩形下端。フォント画素単位。
   * @ko 텍스트 원점 기준 글리프 사각형 아래쪽 끝입니다. 폰트 픽셀 단위입니다.
   */
  Y1: number;
  /**
   * Normalized atlas U coordinate of the left glyph edge.
   *
   * @zh 字形左边界的归一化图集 U 坐标。
   * @ja グリフ左端の正規化アトラス U 座標。
   * @ko 글리프 왼쪽 끝의 정규화된 아틀라스 U 좌표입니다.
   */
  U0: number;
  /**
   * Normalized atlas V coordinate of the top glyph edge.
   *
   * @zh 字形上边界的归一化图集 V 坐标。
   * @ja グリフ上端の正規化アトラス V 座標。
   * @ko 글리프 위쪽 끝의 정규화된 아틀라스 V 좌표입니다.
   */
  V0: number;
  /**
   * Normalized atlas U coordinate of the right glyph edge.
   *
   * @zh 字形右边界的归一化图集 U 坐标。
   * @ja グリフ右端の正規化アトラス U 座標。
   * @ko 글리프 오른쪽 끝의 정규화된 아틀라스 U 좌표입니다.
   */
  U1: number;
  /**
   * Normalized atlas V coordinate of the bottom glyph edge.
   *
   * @zh 字形下边界的归一化图集 V 坐标。
   * @ja グリフ下端の正規化アトラス V 座標。
   * @ko 글리프 아래쪽 끝의 정규화된 아틀라스 V 좌표입니다.
   */
  V1: number;
}

/**
 * Access glyph geometry and texture coordinates in native storage.
 *
 * @zh 访问原生存储中的字形几何信息与纹理坐标。
 * @ja ネイティブ領域のグリフ形状とテクスチャ座標にアクセスします。
 * @ko 네이티브 저장소의 글리프 지오메트리와 텍스처 좌표에 접근합니다.
 * @remarks
 * Colored, Visible and Codepoint use native getters/setters retaining the
 * handle; metrics and UVs keep their shared-buffer fast path. Flag setters
 * accept only numeric 0 or 1; Codepoint accepts integers in [0, 0x3fffffff].
 * Non-numbers throw TypeError; non-finite, fractional or out-of-range numbers
 * throw RangeError without modifying the glyph. The glyph remains borrowed:
 * retaining this view does not keep its font or atlas alive.
 * @zh Colored、Visible 和 Codepoint 通过持有句柄的原生访问器读写；
 * 度量与 UV 仍使用共享缓冲区快路径。标志仅接受数值 0 或 1；
 * Codepoint 接受 [0, 0x3fffffff] 内的整数。非数值抛出 TypeError；
 * 非有限值、小数或越界数值抛出 RangeError，且不会修改字形。
 * 字形仍为借用对象：持有视图不会延长字体或图集的生命周期。
 * @ja Colored、Visible、Codepoint はハンドルを保持するネイティブアクセサーを使い、
 * 寸法と UV は共有バッファーの高速経路を維持します。フラグは数値 0 または 1、
 * Codepoint は [0, 0x3fffffff] の整数のみ受け付けます。数値以外は TypeError、
 * 非有限値・小数・範囲外の値は RangeError となり、グリフを変更しません。
 * グリフは借用のままで、ビューを保持してもフォントやアトラスの寿命は延びません。
 * @ko Colored, Visible, Codepoint는 핸들을 유지하는 네이티브 접근자를 사용하고,
 * 메트릭과 UV는 공유 버퍼 고속 경로를 유지합니다. 플래그는 숫자 0 또는 1,
 * Codepoint는 [0, 0x3fffffff] 범위의 정수만 받습니다. 숫자가 아니면 TypeError,
 * 유한하지 않거나 소수 또는 범위 밖이면 RangeError를 던지며 글리프는 변경하지 않습니다.
 * 글리프는 빌린 상태이며, 뷰를 유지해도 폰트나 아틀라스 수명은 늘어나지 않습니다.
 * @param handle - Borrowed glyph; reacquire after font or atlas changes.
 * @zh handle - 借用字形；字体或图集变化后需重新获取。
 * @ja handle - 借用グリフ。フォントやアトラスの変更後は再取得してください。
 * @ko handle - 빌린 글리프입니다. 폰트나 아틀라스 변경 후 다시 얻으세요.
 * @returns Writable live glyph properties, including the three numeric
 * bitfields.
 * @zh 可写的实时字形属性，包括三个数值位域。
 * @ja 3 つの数値ビットフィールドを含む、書き込み可能なライブグリフ属性。
 * @ko 세 숫자 비트 필드를 포함하는 쓰기 가능한 실시간 글리프 속성입니다.
 */
export function viewImFontGlyph(handle: ImFontGlyph): ImFontGlyphFields {
  const mapping = native.viewImFontGlyph(handle);
  const fields = writableStruct<ImFontGlyphFields>(mapping);
  return Object.defineProperties(
    fields, Object.getOwnPropertyDescriptors(mapping.bitfields),
  );
}

/**
 * Context configuration and live input/output state; native code updates
 * outputs.
 *
 * @zh 上下文配置与实时输入输出状态；输出由原生代码更新。
 * @ja コンテキスト設定と入出力状態。出力はネイティブ側が更新します。
 * @ko 컨텍스트 설정 및 실시간 입출력 상태입니다. 출력은 네이티브 코드가 갱신합니다.
 */
export interface ImGuiIOFields {
  /**
   * Application ImGuiConfigFlags, including keyboard/gamepad navigation.
   *
   * @zh 应用设置的 ImGuiConfigFlags，包括键盘和手柄导航。
   * @ja キーボード・ゲームパッド操作などのアプリ用 ImGuiConfigFlags。
   * @ko 키보드 및 게임패드 탐색 등을 설정하는 앱의 ImGuiConfigFlags입니다.
   */
  ConfigFlags: number;
  /**
   * ImGuiBackendFlags advertising capabilities actually supported by the
   * backend.
   *
   * @zh 声明后端实际支持能力的 ImGuiBackendFlags。
   * @ja バックエンドが実際に対応する機能を示す ImGuiBackendFlags。
   * @ko 백엔드가 실제로 지원하는 기능을 나타내는 ImGuiBackendFlags입니다.
   */
  BackendFlags: number;
  /**
   * Main display width in display pixels, before framebuffer scaling.
   *
   * @zh 主显示区域宽度，单位为应用帧缓冲缩放前的显示像素。
   * @ja フレームバッファ倍率適用前の主表示領域の幅。表示画素単位。
   * @ko 프레임버퍼 배율 적용 전 주 표시 영역의 너비입니다. 표시 픽셀 단위입니다.
   */
  DisplaySizeX: number;
  /**
   * Main display height in display pixels, before framebuffer scaling.
   *
   * @zh 主显示区域高度，单位为应用帧缓冲缩放前的显示像素。
   * @ja フレームバッファ倍率適用前の主表示領域の高さ。表示画素単位。
   * @ko 프레임버퍼 배율 적용 전 주 표시 영역의 높이입니다. 표시 픽셀 단위입니다.
   */
  DisplaySizeY: number;
  /**
   * Positive elapsed seconds since the previous frame.
   *
   * @zh 距上一帧经过的秒数，必须为正。
   * @ja 前フレームからの経過秒数。正の値が必要です。
   * @ko 이전 프레임부터 경과한 초 단위 시간입니다. 양수여야 합니다.
   */
  DeltaTime: number;
  /**
   * Minimum interval in seconds between automatic .ini settings saves.
   *
   * @zh 自动保存 .ini 设置的最短间隔，单位为秒。
   * @ja .ini 設定の自動保存の最小間隔。秒単位。
   * @ko .ini 설정 자동 저장의 최소 간격입니다. 초 단위입니다.
   */
  IniSavingRate: number;
  /**
   * Global font size multiplier; does not rebuild the font atlas.
   *
   * @zh 全局字体大小倍率；不会重建字体图集。
   * @ja 全フォントのサイズ倍率。アトラスは再構築しません。
   * @ko 전체 폰트 크기 배율입니다. 폰트 아틀라스를 재빌드하지 않습니다.
   */
  FontGlobalScale: number;
  /**
   * Obsolete option allowing Ctrl+wheel to scale an individual window's text.
   *
   * @zh 已过时的选项，允许 Ctrl+滚轮缩放单个窗口的文字。
   * @ja Ctrl+ホイールによる個別ウィンドウの文字拡大縮小。旧式の設定です。
   * @ko Ctrl+휠로 개별 창의 텍스트를 확대하는 구식 옵션입니다.
   */
  FontAllowUserScaling: boolean;
  /**
   * Horizontal framebuffer pixels per display pixel, typically one or two.
   *
   * @zh 每显示像素对应的水平帧缓冲像素数，通常为一或二。
   * @ja 表示画素あたりの水平フレームバッファ画素数。通常 1 または 2。
   * @ko 표시 픽셀당 수평 프레임버퍼 픽셀 수입니다. 보통 1 또는 2입니다.
   */
  DisplayFramebufferScaleX: number;
  /**
   * Vertical framebuffer pixels per display pixel, typically one or two.
   *
   * @zh 每显示像素对应的垂直帧缓冲像素数，通常为一或二。
   * @ja 表示画素あたりの垂直フレームバッファ画素数。通常 1 または 2。
   * @ko 표시 픽셀당 수직 프레임버퍼 픽셀 수입니다. 보통 1 또는 2입니다.
   */
  DisplayFramebufferScaleY: number;
  /**
   * Swap gamepad Activate and Cancel buttons for the Nintendo-style layout.
   *
   * @zh 交换手柄的确认与取消按钮，采用任天堂式布局。
   * @ja 決定とキャンセルを入れ替え、任天堂式のボタン配置にします。
   * @ko 게임패드 확인과 취소 버튼을 바꿔 닌텐도 방식 배치를 사용합니다.
   */
  ConfigNavSwapGamepadButtons: boolean;
  /**
   * Let navigation move MousePos and request cursor warping via
   * WantSetMousePos.
   *
   * @zh 允许导航修改 MousePos 并通过 WantSetMousePos 请求移动系统光标。
   * @ja ナビゲーションで MousePos を更新し、WantSetMousePos でカーソル移動を要求。
   * @ko 탐색으로 MousePos를 갱신하고 WantSetMousePos로 커서 이동을 요청합니다.
   */
  ConfigNavMoveSetMousePos: boolean;
  /**
   * Set WantCaptureKeyboard while keyboard/gamepad navigation is active.
   *
   * @zh 键盘或手柄导航活跃时设置 WantCaptureKeyboard。
   * @ja キーボード・ゲームパッド操作中に WantCaptureKeyboard を設定します。
   * @ko 키보드 또는 게임패드 탐색 중 WantCaptureKeyboard를 설정합니다.
   */
  ConfigNavCaptureKeyboard: boolean;
  /**
   * Allow Escape to clear the focused item and its navigation highlight.
   *
   * @zh 允许 Escape 清除项目焦点及其导航高亮。
   * @ja Escape で項目のフォーカスとナビゲーション強調表示を解除できます。
   * @ko Escape로 항목 포커스와 탐색 강조 표시를 지울 수 있게 합니다.
   */
  ConfigNavEscapeClearFocusItem: boolean;
  /**
   * Allow Escape to clear window focus as well as item focus.
   *
   * @zh 允许 Escape 同时清除窗口和项目焦点。
   * @ja Escape で項目だけでなくウィンドウのフォーカスも解除できます。
   * @ko Escape로 항목뿐 아니라 창 포커스도 지울 수 있게 합니다.
   */
  ConfigNavEscapeClearFocusWindow: boolean;
  /**
   * Show the navigation cursor on directional input and hide it on mouse
   * clicks.
   *
   * @zh 方向导航输入时显示导航光标，鼠标点击时隐藏。
   * @ja 方向操作でナビゲーションカーソルを表示し、クリックで隠します。
   * @ko 방향 입력 시 탐색 커서를 표시하고 마우스 클릭 시 숨깁니다.
   */
  ConfigNavCursorVisibleAuto: boolean;
  /**
   * Keep the navigation cursor visible regardless of mouse use.
   *
   * @zh 无论是否使用鼠标，都保持导航光标可见。
   * @ja マウス操作に関係なくナビゲーションカーソルを表示し続けます。
   * @ko 마우스 사용과 관계없이 탐색 커서를 계속 표시합니다.
   */
  ConfigNavCursorVisibleAlways: boolean;
  /**
   * Ask ImGui to render a software mouse cursor.
   *
   * @zh 请求 ImGui 绘制软件鼠标光标。
   * @ja ImGui にソフトウェアマウスカーソルの描画を要求します。
   * @ko ImGui에 소프트웨어 마우스 커서 렌더링을 요청합니다.
   */
  MouseDrawCursor: boolean;
  /**
   * Use macOS editing, shortcut and selection conventions, including Cmd for
   * Ctrl.
   *
   * @zh 使用 macOS 编辑、快捷键与选择习惯，包括以 Cmd 代替 Ctrl。
   * @ja Cmd を Ctrl の代わりに使うなど、macOS の編集・選択操作に従います。
   * @ko Ctrl 대신 Cmd 사용 등 macOS 편집, 단축키 및 선택 방식을 사용합니다.
   */
  ConfigMacOSXBehaviors: boolean;
  /**
   * Spread conflicting queued inputs across frames to preserve short clicks.
   *
   * @zh 将队列中冲突的输入分散到多帧，避免丢失短暂点击。
   * @ja 競合する入力を複数フレームに分け、短いクリックを保持します。
   * @ko 충돌하는 대기 입력을 여러 프레임에 나눠 짧은 클릭을 보존합니다.
   */
  ConfigInputTrickleEventQueue: boolean;
  /**
   * Enable blinking of the text-edit caret.
   *
   * @zh 启用文本编辑光标闪烁。
   * @ja テキスト編集キャレットの点滅を有効にします。
   * @ko 텍스트 편집 캐럿의 깜박임을 켭니다.
   */
  ConfigInputTextCursorBlink: boolean;
  /**
   * Keep single-line text input active and select its contents after Enter.
   *
   * @zh 按 Enter 后保持单行文本输入活跃并选中其内容。
   * @ja Enter 後も単一行入力を有効に保ち、内容を選択します。
   * @ko Enter 후 단일 행 입력을 활성 상태로 유지하고 내용을 선택합니다.
   */
  ConfigInputTextEnterKeepActive: boolean;
  /**
   * A click-release without dragging switches Drag widgets to text input.
   *
   * @zh 点击后松开且未拖动时，将 Drag 控件切换为文本输入。
   * @ja ドラッグせずクリックを離すと Drag ウィジェットを文字入力に切り替えます。
   * @ko 드래그 없이 클릭 후 놓으면 Drag 위젯을 텍스트 입력으로 전환합니다.
   */
  ConfigDragClickToInputText: boolean;
  /**
   * Enable resizing from edges and the lower-left corner; needs cursor support.
   *
   * @zh 允许从边缘和左下角调整窗口大小；需要后端光标支持。
   * @ja 辺と左下隅からのサイズ変更を有効化。バックエンドのカーソル対応が必要。
   * @ko 가장자리와 왼쪽 아래 모서리에서 크기 변경을 허용합니다. 커서 지원이 필요합니다.
   */
  ConfigWindowsResizeFromEdges: boolean;
  /**
   * Restrict dragging to title bars, except for windows with no title bar.
   *
   * @zh 仅允许拖动标题栏来移动窗口；无标题栏窗口除外。
   * @ja タイトルバーのみでウィンドウを移動可能にします。バーなしの窓は対象外。
   * @ko 제목 표시줄로만 창을 이동하게 합니다. 제목 표시줄 없는 창은 제외합니다.
   */
  ConfigWindowsMoveFromTitleBarOnly: boolean;
  /**
   * Experimental Ctrl+C copy of focused window text in submission order.
   *
   * @zh 实验性功能：Ctrl+C 按提交顺序复制焦点窗口中的文字。
   * @ja 実験的機能。Ctrl+C でフォーカス中の窓の文字を提出順にコピーします。
   * @ko 실험적 기능입니다. Ctrl+C로 포커스된 창 텍스트를 제출 순서대로 복사합니다.
   */
  ConfigWindowsCopyContentsWithCtrlC: boolean;
  /**
   * Scroll by pages outside the grab; Shift+click still seeks to the click.
   *
   * @zh 点击滚动滑块外部时按页滚动；Shift+点击仍直接定位。
   * @ja つまみの外のクリックでページ移動。Shift+クリックは直接位置指定です。
   * @ko 손잡이 밖 클릭 시 페이지 단위로 스크롤합니다. Shift+클릭은 직접 이동합니다.
   */
  ConfigScrollbarScrollByPage: boolean;
  /**
   * Seconds before freeing unused window/table buffers; -1 disables compaction.
   *
   * @zh 释放未使用窗口或表格缓冲区前的秒数；-1 禁用回收。
   * @ja 未使用の窓・テーブル領域を解放するまでの秒数。-1 で無効化。
   * @ko 미사용 창 및 테이블 버퍼를 해제하기 전의 초 수입니다. -1은 해제를 끕니다.
   */
  ConfigMemoryCompactTimer: number;
  /**
   * Maximum interval in seconds for successive clicks to form a double-click.
   *
   * @zh 连续点击构成双击的最大间隔，单位为秒。
   * @ja 連続クリックをダブルクリックとする最大間隔。秒単位。
   * @ko 연속 클릭을 더블 클릭으로 인정하는 최대 간격입니다. 초 단위입니다.
   */
  MouseDoubleClickTime: number;
  /**
   * Maximum distance in pixels between clicks in a double-click sequence.
   *
   * @zh 双击序列中点击位置之间的最大像素距离。
   * @ja ダブルクリックを構成するクリック間の最大画素距離。
   * @ko 더블 클릭을 구성하는 클릭 위치 사이의 최대 픽셀 거리입니다.
   */
  MouseDoubleClickMaxDist: number;
  /**
   * Travel distance in pixels before a held mouse button counts as dragging.
   *
   * @zh 按住鼠标后被视为拖动所需的移动像素距离。
   * @ja ボタンを押したままドラッグと判定されるまでの移動画素距離。
   * @ko 버튼을 누른 채 드래그로 판정되기까지 필요한 이동 픽셀 거리입니다.
   */
  MouseDragThreshold: number;
  /**
   * Initial hold delay in seconds before key or repeat-button repetition.
   *
   * @zh 按键或可重复按钮开始连发前的初始等待秒数。
   * @ja キーやリピートボタンの連続入力開始までの待機秒数。
   * @ko 키 또는 반복 버튼의 연속 입력 시작 전 대기 시간입니다. 초 단위입니다.
   */
  KeyRepeatDelay: number;
  /**
   * Interval in seconds between repeated key or button activations.
   *
   * @zh 按键或按钮连发的间隔，单位为秒。
   * @ja キーやボタンの連続入力の間隔。秒単位。
   * @ko 키 또는 버튼의 반복 입력 간격입니다. 초 단위입니다.
   */
  KeyRepeatRate: number;
  /**
   * Enable best-effort recovery from supported API misuse; not crash
   * protection.
   *
   * @zh 对支持检测的 API 误用尝试恢复；不保证避免崩溃。
   * @ja 対応する API 誤用からの回復を試みます。クラッシュ防止の保証はありません。
   * @ko 감지 가능한 API 오용에서 복구를 시도합니다. 충돌 방지를 보장하지 않습니다.
   */
  ConfigErrorRecovery: boolean;
  /**
   * Trigger native assertions on recoverable errors.
   *
   * @zh 在可恢复错误发生时触发原生断言。
   * @ja 回復可能なエラーでネイティブアサートを実行します。
   * @ko 복구 가능한 오류에서 네이티브 어설션을 실행합니다.
   */
  ConfigErrorRecoveryEnableAssert: boolean;
  /**
   * Write recoverable errors to the ImGui debug log.
   *
   * @zh 将可恢复错误写入 ImGui 调试日志。
   * @ja 回復可能なエラーを ImGui デバッグログへ記録します。
   * @ko 복구 가능한 오류를 ImGui 디버그 로그에 기록합니다.
   */
  ConfigErrorRecoveryEnableDebugLog: boolean;
  /**
   * Show tooltips for recoverable errors; keep at least one error channel
   * enabled.
   *
   * @zh 用提示框显示可恢复错误；至少保留一种错误报告方式。
   * @ja 回復可能なエラーをツールチップ表示。最低 1 つの報告手段を有効に保つこと。
   * @ko 복구 가능한 오류를 툴팁으로 표시합니다. 오류 알림 수단을 하나 이상 유지하세요.
   */
  ConfigErrorRecoveryEnableTooltip: boolean;
  /**
   * Enable debug-break tools only when a native debugger is attached.
   *
   * @zh 仅在已附加原生调试器时启用断点工具。
   * @ja ネイティブデバッガー接続時のみブレーク用ツールを有効にします。
   * @ko 네이티브 디버거가 연결된 경우에만 중단점 도구를 활성화하세요.
   */
  ConfigDebugIsDebuggerPresent: boolean;
  /**
   * Highlight duplicate item IDs and show an error popup.
   *
   * @zh 高亮重复的项目 ID 并显示错误弹窗。
   * @ja 重複する項目 ID を強調し、エラーポップアップを表示します。
   * @ko 중복 항목 ID를 강조하고 오류 팝업을 표시합니다.
   */
  ConfigDebugHighlightIdConflicts: boolean;
  /**
   * Include the Item Picker button in the ID-conflict popup.
   *
   * @zh 在 ID 冲突弹窗中显示项目拾取器按钮。
   * @ja ID 競合ポップアップに項目選択ツールのボタンを表示します。
   * @ko ID 충돌 팝업에 항목 선택 도구 버튼을 표시합니다.
   */
  ConfigDebugHighlightIdConflictsShowItemPicker: boolean;
  /**
   * Make first Begin/BeginChild calls return false to test matching End calls.
   *
   * @zh 让首次 Begin/BeginChild 返回 false，以测试配对 End 调用。
   * @ja 最初の Begin/BeginChild を false にし、対応する End 呼び出しを検証。
   * @ko 첫 Begin/BeginChild를 false로 만들어 대응하는 End 호출을 검증합니다.
   */
  ConfigDebugBeginReturnValueOnce: boolean;
  /**
   * Cycle false Begin/BeginChild results through window depths for testing.
   *
   * @zh 按窗口深度循环让 Begin/BeginChild 返回 false，用于测试。
   * @ja 窓の深さごとに Begin/BeginChild の false 戻り値を循環させて検証します。
   * @ko 창 깊이를 순회하며 Begin/BeginChild가 false를 반환하게 해 검증합니다.
   */
  ConfigDebugBeginReturnValueLoop: boolean;
  /**
   * Ignore focus-loss events instead of clearing input state during debugging.
   *
   * @zh 调试时忽略失焦事件，不因此清空输入状态。
   * @ja デバッグ時にフォーカス喪失を無視し、入力状態の消去を防ぎます。
   * @ko 디버깅 중 포커스 상실을 무시해 입력 상태 초기화를 막습니다.
   */
  ConfigDebugIgnoreFocusLoss: boolean;
  /**
   * Add diagnostic comments when saving .ini settings, at extra saving cost.
   *
   * @zh 保存 .ini 设置时添加诊断注释，会增加保存开销。
   * @ja .ini 保存時に診断コメントを追加します。保存コストが増加します。
   * @ko .ini 저장 시 진단 주석을 추가합니다. 저장 비용이 늘어납니다.
   */
  ConfigDebugIniSettings: boolean;
  /**
   * Withhold mouse input from the app when true; always still feed it to ImGui.
   *
   * @zh 为真时不向应用传递鼠标输入；无论真假都仍须传给 ImGui。
   * @ja 真ならアプリへのマウス入力を抑制。ImGui へは常に渡してください。
   * @ko 참이면 앱에 마우스 입력을 전달하지 않습니다. ImGui에는 항상 전달하세요.
   */
  WantCaptureMouse: boolean;
  /**
   * Withhold keyboard input from the app when true; always feed it to ImGui.
   *
   * @zh 为真时不向应用传递键盘输入；仍须始终传给 ImGui。
   * @ja 真ならアプリへのキー入力を抑制。ImGui へは常に渡してください。
   * @ko 참이면 앱에 키보드 입력을 전달하지 않습니다. ImGui에는 항상 전달하세요.
   */
  WantCaptureKeyboard: boolean;
  /**
   * Request text entry, for example by displaying an on-screen keyboard.
   *
   * @zh 请求文本输入，例如显示屏幕键盘。
   * @ja テキスト入力を要求します。必要に応じて画面キーボードを表示します。
   * @ko 텍스트 입력을 요청합니다. 필요하면 화면 키보드를 표시합니다.
   */
  WantTextInput: boolean;
  /**
   * Ask the backend to move the system cursor to the navigation-updated
   * MousePos.
   *
   * @zh 请求后端将系统光标移动到导航更新后的 MousePos。
   * @ja ナビゲーションで更新した MousePos へシステムカーソルの移動を要求。
   * @ko 탐색으로 갱신된 MousePos로 시스템 커서를 옮기도록 백엔드에 요청합니다.
   */
  WantSetMousePos: boolean;
  /**
   * Manual .ini save requested; clear this flag after saving settings.
   *
   * @zh 请求手动保存 .ini；保存设置后须清除此标志。
   * @ja 手動 .ini 保存要求。保存後にこのフラグを解除してください。
   * @ko 수동 .ini 저장 요청입니다. 설정 저장 후 이 플래그를 지우세요.
   */
  WantSaveIniSettings: boolean;
  /**
   * A focused window currently accepts keyboard/gamepad navigation.
   *
   * @zh 当前焦点窗口接受键盘或手柄导航。
   * @ja フォーカス中の窓がキーボード・ゲームパッド操作を受け付けています。
   * @ko 포커스된 창이 현재 키보드 또는 게임패드 탐색을 허용합니다.
   */
  NavActive: boolean;
  /**
   * Keyboard/gamepad navigation is allowed and its highlight is visible.
   *
   * @zh 键盘或手柄导航可用，且导航高亮可见。
   * @ja キーボード・ゲームパッド操作が可能で、強調表示が見えています。
   * @ko 키보드 또는 게임패드 탐색이 가능하며 강조 표시가 보입니다.
   */
  NavVisible: boolean;
  /**
   * Estimated frames per second from a rolling 60-frame DeltaTime average.
   *
   * @zh 根据最近 60 帧 DeltaTime 滚动平均值估算的每秒帧数。
   * @ja 直近 60 フレームの DeltaTime 平均から推定する毎秒フレーム数。
   * @ko 최근 60프레임 DeltaTime 평균으로 추정한 초당 프레임 수입니다.
   */
  Framerate: number;
  /**
   * Vertex count emitted by the last Render() call.
   *
   * @zh 上一次 Render() 输出的顶点数。
   * @ja 前回の Render() が出力した頂点数。
   * @ko 마지막 Render() 호출이 출력한 정점 수입니다.
   */
  MetricsRenderVertices: number;
  /**
   * Index count emitted by the last Render(), three per triangle.
   *
   * @zh 上一次 Render() 输出的索引数，每个三角形三个。
   * @ja 前回の Render() のインデックス数。三角形あたり 3 個。
   * @ko 마지막 Render()의 인덱스 수입니다. 삼각형당 3개입니다.
   */
  MetricsRenderIndices: number;
  /**
   * Number of visible windows rendered.
   *
   * @zh 已渲染的可见窗口数量。
   * @ja 描画された可視ウィンドウ数。
   * @ko 렌더링된 표시 가능한 창의 수입니다.
   */
  MetricsRenderWindows: number;
  /**
   * Number of active windows, including active windows that are not visible.
   *
   * @zh 活跃窗口数量，包括活跃但不可见的窗口。
   * @ja 見えないものも含めたアクティブウィンドウ数。
   * @ko 보이지 않는 창도 포함한 활성 창의 수입니다.
   */
  MetricsActiveWindows: number;
  /**
   * Horizontal mouse movement in pixels; zero if either position is invalid.
   *
   * @zh 鼠标水平移动像素数；前后位置任一无效时为零。
   * @ja マウスの水平移動画素数。前後いずれかの位置が無効なら 0。
   * @ko 마우스 수평 이동 픽셀 수입니다. 이전 또는 현재 위치가 무효면 0입니다.
   */
  MouseDeltaX: number;
  /**
   * Vertical mouse movement in pixels; zero if either position is invalid.
   *
   * @zh 鼠标垂直移动像素数；前后位置任一无效时为零。
   * @ja マウスの垂直移動画素数。前後いずれかの位置が無効なら 0。
   * @ko 마우스 수직 이동 픽셀 수입니다. 이전 또는 현재 위치가 무효면 0입니다.
   */
  MouseDeltaY: number;
  /**
   * Mouse display X in pixels; -3.4028234663852886e38 means unavailable.
   *
   * @zh 鼠标显示坐标 X，单位为像素；-3.4028234663852886e38 表示位置不可用。
   * @ja マウスの表示 X 座標。画素単位。-3.4028234663852886e38 は位置不明。
   * @ko 마우스 표시 X 좌표입니다. 픽셀 단위이며 -3.4028234663852886e38은 위치 불명입니다.
   */
  MousePosX: number;
  /**
   * Mouse display Y in pixels; -3.4028234663852886e38 means unavailable.
   *
   * @zh 鼠标显示坐标 Y，单位为像素；-3.4028234663852886e38 表示位置不可用。
   * @ja マウスの表示 Y 座標。画素単位。-3.4028234663852886e38 は位置不明。
   * @ko 마우스 표시 Y 좌표입니다. 픽셀 단위이며 -3.4028234663852886e38은 위치 불명입니다.
   */
  MousePosY: number;
  /**
   * Current left mouse button down state (button 0).
   *
   * @zh 鼠标左键（按钮 0）当前是否按下。
   * @ja マウス左ボタン（0）の現在の押下状態。
   * @ko 마우스 왼쪽 버튼(0)의 현재 눌림 상태입니다.
   */
  MouseDown0: boolean;
  /**
   * Current right mouse button down state (button 1).
   *
   * @zh 鼠标右键（按钮 1）当前是否按下。
   * @ja マウス右ボタン（1）の現在の押下状態。
   * @ko 마우스 오른쪽 버튼(1)의 현재 눌림 상태입니다.
   */
  MouseDown1: boolean;
  /**
   * Current middle mouse button down state (button 2).
   *
   * @zh 鼠标中键（按钮 2）当前是否按下。
   * @ja マウス中央ボタン（2）の現在の押下状態。
   * @ko 마우스 가운데 버튼(2)의 현재 눌림 상태입니다.
   */
  MouseDown2: boolean;
  /**
   * Current first extra mouse button down state (button 3).
   *
   * @zh 鼠标第一个扩展键（按钮 3）当前是否按下。
   * @ja マウスの第 1 拡張ボタン（3）の現在の押下状態。
   * @ko 마우스 첫 번째 추가 버튼(3)의 현재 눌림 상태입니다.
   */
  MouseDown3: boolean;
  /**
   * Current second extra mouse button down state (button 4).
   *
   * @zh 鼠标第二个扩展键（按钮 4）当前是否按下。
   * @ja マウスの第 2 拡張ボタン（4）の現在の押下状態。
   * @ko 마우스 두 번째 추가 버튼(4)의 현재 눌림 상태입니다.
   */
  MouseDown4: boolean;
  /**
   * Vertical wheel delta this frame; positive scrolls up, about five
   * lines/unit.
   *
   * @zh 本帧垂直滚轮增量；正值向上，每单位约五行。
   * @ja このフレームの垂直ホイール量。正は上方向、1 単位は約 5 行。
   * @ko 이번 프레임의 수직 휠 변화량입니다. 양수는 위쪽이며 단위당 약 5줄입니다.
   */
  MouseWheel: number;
  /**
   * Horizontal wheel delta this frame; positive scrolls left, negative right.
   *
   * @zh 本帧水平滚轮增量；正值向左，负值向右。
   * @ja このフレームの水平ホイール量。正は左、負は右方向。
   * @ko 이번 프레임의 수평 휠 변화량입니다. 양수는 왼쪽, 음수는 오른쪽입니다.
   */
  MouseWheelH: number;
  /**
   * ImGuiMouseSource identifying mouse, touchscreen or pen input.
   *
   * @zh 标识鼠标、触摸屏或笔输入的 ImGuiMouseSource。
   * @ja マウス、タッチ画面、ペンを識別する ImGuiMouseSource。
   * @ko 마우스, 터치스크린 또는 펜을 식별하는 ImGuiMouseSource입니다.
   */
  MouseSource: number;
  /**
   * Whether the Control modifier is currently held.
   *
   * @zh 当前是否按住 Control 修饰键。
   * @ja Control 修飾キーの現在の押下状態。
   * @ko 현재 Control 보조 키가 눌렸는지 나타냅니다.
   */
  KeyCtrl: boolean;
  /**
   * Whether the Shift modifier is currently held.
   *
   * @zh 当前是否按住 Shift 修饰键。
   * @ja Shift 修飾キーの現在の押下状態。
   * @ko 현재 Shift 보조 키가 눌렸는지 나타냅니다.
   */
  KeyShift: boolean;
  /**
   * Whether the Alt modifier is currently held.
   *
   * @zh 当前是否按住 Alt 修饰键。
   * @ja Alt 修飾キーの現在の押下状態。
   * @ko 현재 Alt 보조 키가 눌렸는지 나타냅니다.
   */
  KeyAlt: boolean;
  /**
   * Whether the Cmd/Super/Windows modifier is currently held.
   *
   * @zh 当前是否按住 Cmd/Super/Windows 修饰键。
   * @ja Cmd/Super/Windows 修飾キーの現在の押下状態。
   * @ko 현재 Cmd/Super/Windows 보조 키가 눌렸는지 나타냅니다.
   */
  KeySuper: boolean;
  /**
   * ImGuiMod bitmask merged by NewFrame(); treat as read-only derived state.
   *
   * @zh NewFrame() 合并的 ImGuiMod 位掩码；应视为只读派生状态。
   * @ja NewFrame() が合成する ImGuiMod フラグ。読み取り専用の派生状態です。
   * @ko NewFrame()이 병합한 ImGuiMod 마스크입니다. 읽기 전용 파생 상태입니다.
   */
  KeyMods: number;
  /**
   * Mouse capture excluding clicks on empty space that only close a popup.
   *
   * @zh 鼠标捕获状态，但排除仅用于关闭弹窗的空白处点击。
   * @ja ポップアップを閉じるだけの空白クリックを除いたマウス捕捉状態。
   * @ko 팝업만 닫는 빈 공간 클릭을 제외한 마우스 입력 캡처 상태입니다.
   */
  WantCaptureMouseUnlessPopupClose: boolean;
  /**
   * Previous mouse X in display pixels; -3.4028234663852886e38 means
   * unavailable.
   *
   * @zh 上一次鼠标 X 显示像素坐标；-3.4028234663852886e38 表示位置不可用。
   * @ja 前回のマウス X 表示画素座標。-3.4028234663852886e38 は位置不明です。
   * @ko 이전 마우스 X 표시 픽셀 좌표입니다. -3.4028234663852886e38은 위치 불명입니다.
   */
  MousePosPrevX: number;
  /**
   * Previous mouse Y in display pixels; -3.4028234663852886e38 means
   * unavailable.
   *
   * @zh 上一次鼠标 Y 显示像素坐标；-3.4028234663852886e38 表示位置不可用。
   * @ja 前回のマウス Y 表示画素座標。-3.4028234663852886e38 は位置不明です。
   * @ko 이전 마우스 Y 표시 픽셀 좌표입니다. -3.4028234663852886e38은 위치 불명입니다.
   */
  MousePosPrevY: number;
  /**
   * Last button 0 click time in context seconds, used for multi-click
   * detection.
   *
   * @zh 按钮 0 上次点击的上下文时间，单位秒，用于检测多击。
   * @ja ボタン 0 の最終クリック時刻。連続クリック判定用のコンテキスト秒数。
   * @ko 버튼 0의 마지막 클릭 시각입니다. 연속 클릭 판정용 컨텍스트 초 단위입니다.
   */
  MouseClickedTime0: number;
  /**
   * Last button 1 click time in context seconds, used for multi-click
   * detection.
   *
   * @zh 按钮 1 上次点击的上下文时间，单位秒，用于检测多击。
   * @ja ボタン 1 の最終クリック時刻。連続クリック判定用のコンテキスト秒数。
   * @ko 버튼 1의 마지막 클릭 시각입니다. 연속 클릭 판정용 컨텍스트 초 단위입니다.
   */
  MouseClickedTime1: number;
  /**
   * Last button 2 click time in context seconds, used for multi-click
   * detection.
   *
   * @zh 按钮 2 上次点击的上下文时间，单位秒，用于检测多击。
   * @ja ボタン 2 の最終クリック時刻。連続クリック判定用のコンテキスト秒数。
   * @ko 버튼 2의 마지막 클릭 시각입니다. 연속 클릭 판정용 컨텍스트 초 단위입니다.
   */
  MouseClickedTime2: number;
  /**
   * Last button 3 click time in context seconds, used for multi-click
   * detection.
   *
   * @zh 按钮 3 上次点击的上下文时间，单位秒，用于检测多击。
   * @ja ボタン 3 の最終クリック時刻。連続クリック判定用のコンテキスト秒数。
   * @ko 버튼 3의 마지막 클릭 시각입니다. 연속 클릭 판정용 컨텍스트 초 단위입니다.
   */
  MouseClickedTime3: number;
  /**
   * Last button 4 click time in context seconds, used for multi-click
   * detection.
   *
   * @zh 按钮 4 上次点击的上下文时间，单位秒，用于检测多击。
   * @ja ボタン 4 の最終クリック時刻。連続クリック判定用のコンテキスト秒数。
   * @ko 버튼 4의 마지막 클릭 시각입니다. 연속 클릭 판정용 컨텍스트 초 단위입니다.
   */
  MouseClickedTime4: number;
  /**
   * Button 0 transitioned from released to pressed this frame.
   *
   * @zh 按钮 0 本帧从松开变为按下。
   * @ja このフレームでボタン 0 が離された状態から押下へ変化。
   * @ko 이번 프레임에 버튼 0이 놓인 상태에서 눌림 상태로 바뀌었습니다.
   */
  MouseClicked0: boolean;
  /**
   * Button 1 transitioned from released to pressed this frame.
   *
   * @zh 按钮 1 本帧从松开变为按下。
   * @ja このフレームでボタン 1 が離された状態から押下へ変化。
   * @ko 이번 프레임에 버튼 1이 놓인 상태에서 눌림 상태로 바뀌었습니다.
   */
  MouseClicked1: boolean;
  /**
   * Button 2 transitioned from released to pressed this frame.
   *
   * @zh 按钮 2 本帧从松开变为按下。
   * @ja このフレームでボタン 2 が離された状態から押下へ変化。
   * @ko 이번 프레임에 버튼 2가 놓인 상태에서 눌림 상태로 바뀌었습니다.
   */
  MouseClicked2: boolean;
  /**
   * Button 3 transitioned from released to pressed this frame.
   *
   * @zh 按钮 3 本帧从松开变为按下。
   * @ja このフレームでボタン 3 が離された状態から押下へ変化。
   * @ko 이번 프레임에 버튼 3이 놓인 상태에서 눌림 상태로 바뀌었습니다.
   */
  MouseClicked3: boolean;
  /**
   * Button 4 transitioned from released to pressed this frame.
   *
   * @zh 按钮 4 本帧从松开变为按下。
   * @ja このフレームでボタン 4 が離された状態から押下へ変化。
   * @ko 이번 프레임에 버튼 4가 놓인 상태에서 눌림 상태로 바뀌었습니다.
   */
  MouseClicked4: boolean;
  /**
   * Button 0 double-clicked this frame; MouseClickedCount0 equals two.
   *
   * @zh 按钮 0 本帧双击；MouseClickedCount0 等于二。
   * @ja このフレームでボタン 0 がダブルクリック。MouseClickedCount0 は 2。
   * @ko 이번 프레임에 버튼 0이 더블 클릭되어 MouseClickedCount0이 2입니다.
   */
  MouseDoubleClicked0: boolean;
  /**
   * Button 1 double-clicked this frame; MouseClickedCount1 equals two.
   *
   * @zh 按钮 1 本帧双击；MouseClickedCount1 等于二。
   * @ja このフレームでボタン 1 がダブルクリック。MouseClickedCount1 は 2。
   * @ko 이번 프레임에 버튼 1이 더블 클릭되어 MouseClickedCount1이 2입니다.
   */
  MouseDoubleClicked1: boolean;
  /**
   * Button 2 double-clicked this frame; MouseClickedCount2 equals two.
   *
   * @zh 按钮 2 本帧双击；MouseClickedCount2 等于二。
   * @ja このフレームでボタン 2 がダブルクリック。MouseClickedCount2 は 2。
   * @ko 이번 프레임에 버튼 2가 더블 클릭되어 MouseClickedCount2가 2입니다.
   */
  MouseDoubleClicked2: boolean;
  /**
   * Button 3 double-clicked this frame; MouseClickedCount3 equals two.
   *
   * @zh 按钮 3 本帧双击；MouseClickedCount3 等于二。
   * @ja このフレームでボタン 3 がダブルクリック。MouseClickedCount3 は 2。
   * @ko 이번 프레임에 버튼 3이 더블 클릭되어 MouseClickedCount3이 2입니다.
   */
  MouseDoubleClicked3: boolean;
  /**
   * Button 4 double-clicked this frame; MouseClickedCount4 equals two.
   *
   * @zh 按钮 4 本帧双击；MouseClickedCount4 等于二。
   * @ja このフレームでボタン 4 がダブルクリック。MouseClickedCount4 は 2。
   * @ko 이번 프레임에 버튼 4가 더블 클릭되어 MouseClickedCount4가 2입니다.
   */
  MouseDoubleClicked4: boolean;
  /**
   * Button 0 click sequence count this frame; zero if no new click.
   *
   * @zh 按钮 0 本帧连续点击次数；无新点击时为零。
   * @ja ボタン 0 の今回の連続クリック数。新しいクリックがなければ 0。
   * @ko 이번 프레임 버튼 0의 연속 클릭 횟수입니다. 새 클릭이 없으면 0입니다.
   */
  MouseClickedCount0: number;
  /**
   * Button 1 click sequence count this frame; zero if no new click.
   *
   * @zh 按钮 1 本帧连续点击次数；无新点击时为零。
   * @ja ボタン 1 の今回の連続クリック数。新しいクリックがなければ 0。
   * @ko 이번 프레임 버튼 1의 연속 클릭 횟수입니다. 새 클릭이 없으면 0입니다.
   */
  MouseClickedCount1: number;
  /**
   * Button 2 click sequence count this frame; zero if no new click.
   *
   * @zh 按钮 2 本帧连续点击次数；无新点击时为零。
   * @ja ボタン 2 の今回の連続クリック数。新しいクリックがなければ 0。
   * @ko 이번 프레임 버튼 2의 연속 클릭 횟수입니다. 새 클릭이 없으면 0입니다.
   */
  MouseClickedCount2: number;
  /**
   * Button 3 click sequence count this frame; zero if no new click.
   *
   * @zh 按钮 3 本帧连续点击次数；无新点击时为零。
   * @ja ボタン 3 の今回の連続クリック数。新しいクリックがなければ 0。
   * @ko 이번 프레임 버튼 3의 연속 클릭 횟수입니다. 새 클릭이 없으면 0입니다.
   */
  MouseClickedCount3: number;
  /**
   * Button 4 click sequence count this frame; zero if no new click.
   *
   * @zh 按钮 4 本帧连续点击次数；无新点击时为零。
   * @ja ボタン 4 の今回の連続クリック数。新しいクリックがなければ 0。
   * @ko 이번 프레임 버튼 4의 연속 클릭 횟수입니다. 새 클릭이 없으면 0입니다.
   */
  MouseClickedCount4: number;
  /**
   * Button 0 last click sequence count, retained after release.
   *
   * @zh 按钮 0 最近一次连续点击次数，松开后仍保留。
   * @ja ボタン 0 の直近の連続クリック数。離した後も保持。
   * @ko 버튼 0의 마지막 연속 클릭 횟수입니다. 놓은 후에도 유지됩니다.
   */
  MouseClickedLastCount0: number;
  /**
   * Button 1 last click sequence count, retained after release.
   *
   * @zh 按钮 1 最近一次连续点击次数，松开后仍保留。
   * @ja ボタン 1 の直近の連続クリック数。離した後も保持。
   * @ko 버튼 1의 마지막 연속 클릭 횟수입니다. 놓은 후에도 유지됩니다.
   */
  MouseClickedLastCount1: number;
  /**
   * Button 2 last click sequence count, retained after release.
   *
   * @zh 按钮 2 最近一次连续点击次数，松开后仍保留。
   * @ja ボタン 2 の直近の連続クリック数。離した後も保持。
   * @ko 버튼 2의 마지막 연속 클릭 횟수입니다. 놓은 후에도 유지됩니다.
   */
  MouseClickedLastCount2: number;
  /**
   * Button 3 last click sequence count, retained after release.
   *
   * @zh 按钮 3 最近一次连续点击次数，松开后仍保留。
   * @ja ボタン 3 の直近の連続クリック数。離した後も保持。
   * @ko 버튼 3의 마지막 연속 클릭 횟수입니다. 놓은 후에도 유지됩니다.
   */
  MouseClickedLastCount3: number;
  /**
   * Button 4 last click sequence count, retained after release.
   *
   * @zh 按钮 4 最近一次连续点击次数，松开后仍保留。
   * @ja ボタン 4 の直近の連続クリック数。離した後も保持。
   * @ko 버튼 4의 마지막 연속 클릭 횟수입니다. 놓은 후에도 유지됩니다.
   */
  MouseClickedLastCount4: number;
  /**
   * Button 0 transitioned from pressed to released this frame.
   *
   * @zh 按钮 0 本帧从按下变为松开。
   * @ja このフレームでボタン 0 が押下から解放へ変化。
   * @ko 이번 프레임에 버튼 0이 눌림에서 놓임 상태로 바뀌었습니다.
   */
  MouseReleased0: boolean;
  /**
   * Button 1 transitioned from pressed to released this frame.
   *
   * @zh 按钮 1 本帧从按下变为松开。
   * @ja このフレームでボタン 1 が押下から解放へ変化。
   * @ko 이번 프레임에 버튼 1이 눌림에서 놓임 상태로 바뀌었습니다.
   */
  MouseReleased1: boolean;
  /**
   * Button 2 transitioned from pressed to released this frame.
   *
   * @zh 按钮 2 本帧从按下变为松开。
   * @ja このフレームでボタン 2 が押下から解放へ変化。
   * @ko 이번 프레임에 버튼 2가 눌림에서 놓임 상태로 바뀌었습니다.
   */
  MouseReleased2: boolean;
  /**
   * Button 3 transitioned from pressed to released this frame.
   *
   * @zh 按钮 3 本帧从按下变为松开。
   * @ja このフレームでボタン 3 が押下から解放へ変化。
   * @ko 이번 프레임에 버튼 3이 눌림에서 놓임 상태로 바뀌었습니다.
   */
  MouseReleased3: boolean;
  /**
   * Button 4 transitioned from pressed to released this frame.
   *
   * @zh 按钮 4 本帧从按下变为松开。
   * @ja このフレームでボタン 4 が押下から解放へ変化。
   * @ko 이번 프레임에 버튼 4가 눌림에서 놓임 상태로 바뀌었습니다.
   */
  MouseReleased4: boolean;
  /**
   * Last button 0 release time in seconds on the ImGui context clock.
   *
   * @zh 按钮 0 上次松开的 ImGui 上下文时钟时间，单位秒。
   * @ja ボタン 0 の最終解放時刻。ImGui コンテキスト時刻の秒数。
   * @ko 버튼 0의 마지막 놓임 시각입니다. ImGui 컨텍스트 시계의 초 단위입니다.
   */
  MouseReleasedTime0: number;
  /**
   * Last button 1 release time in seconds on the ImGui context clock.
   *
   * @zh 按钮 1 上次松开的 ImGui 上下文时钟时间，单位秒。
   * @ja ボタン 1 の最終解放時刻。ImGui コンテキスト時刻の秒数。
   * @ko 버튼 1의 마지막 놓임 시각입니다. ImGui 컨텍스트 시계의 초 단위입니다.
   */
  MouseReleasedTime1: number;
  /**
   * Last button 2 release time in seconds on the ImGui context clock.
   *
   * @zh 按钮 2 上次松开的 ImGui 上下文时钟时间，单位秒。
   * @ja ボタン 2 の最終解放時刻。ImGui コンテキスト時刻の秒数。
   * @ko 버튼 2의 마지막 놓임 시각입니다. ImGui 컨텍스트 시계의 초 단위입니다.
   */
  MouseReleasedTime2: number;
  /**
   * Last button 3 release time in seconds on the ImGui context clock.
   *
   * @zh 按钮 3 上次松开的 ImGui 上下文时钟时间，单位秒。
   * @ja ボタン 3 の最終解放時刻。ImGui コンテキスト時刻の秒数。
   * @ko 버튼 3의 마지막 놓임 시각입니다. ImGui 컨텍스트 시계의 초 단위입니다.
   */
  MouseReleasedTime3: number;
  /**
   * Last button 4 release time in seconds on the ImGui context clock.
   *
   * @zh 按钮 4 上次松开的 ImGui 上下文时钟时间，单位秒。
   * @ja ボタン 4 の最終解放時刻。ImGui コンテキスト時刻の秒数。
   * @ko 버튼 4의 마지막 놓임 시각입니다. ImGui 컨텍스트 시계의 초 단위입니다.
   */
  MouseReleasedTime4: number;
  /**
   * Button 0 press began in an ImGui window or in popup-blocked empty space.
   *
   * @zh 按钮 0 的按下始于 ImGui 窗口内或被弹窗阻挡的空白处。
   * @ja ボタン 0 の押下が ImGui 窓内かポップアップで遮断された空白で開始。
   * @ko 버튼 0 누르기가 ImGui 창 또는 팝업에 막힌 빈 공간에서 시작됐습니다.
   */
  MouseDownOwned0: boolean;
  /**
   * Button 1 press began in an ImGui window or in popup-blocked empty space.
   *
   * @zh 按钮 1 的按下始于 ImGui 窗口内或被弹窗阻挡的空白处。
   * @ja ボタン 1 の押下が ImGui 窓内かポップアップで遮断された空白で開始。
   * @ko 버튼 1 누르기가 ImGui 창 또는 팝업에 막힌 빈 공간에서 시작됐습니다.
   */
  MouseDownOwned1: boolean;
  /**
   * Button 2 press began in an ImGui window or in popup-blocked empty space.
   *
   * @zh 按钮 2 的按下始于 ImGui 窗口内或被弹窗阻挡的空白处。
   * @ja ボタン 2 の押下が ImGui 窓内かポップアップで遮断された空白で開始。
   * @ko 버튼 2 누르기가 ImGui 창 또는 팝업에 막힌 빈 공간에서 시작됐습니다.
   */
  MouseDownOwned2: boolean;
  /**
   * Button 3 press began in an ImGui window or in popup-blocked empty space.
   *
   * @zh 按钮 3 的按下始于 ImGui 窗口内或被弹窗阻挡的空白处。
   * @ja ボタン 3 の押下が ImGui 窓内かポップアップで遮断された空白で開始。
   * @ko 버튼 3 누르기가 ImGui 창 또는 팝업에 막힌 빈 공간에서 시작됐습니다.
   */
  MouseDownOwned3: boolean;
  /**
   * Button 4 press began in an ImGui window or in popup-blocked empty space.
   *
   * @zh 按钮 4 的按下始于 ImGui 窗口内或被弹窗阻挡的空白处。
   * @ja ボタン 4 の押下が ImGui 窓内かポップアップで遮断された空白で開始。
   * @ko 버튼 4 누르기가 ImGui 창 또는 팝업에 막힌 빈 공간에서 시작됐습니다.
   */
  MouseDownOwned4: boolean;
  /**
   * Button 0 press belongs to ImGui, excluding ordinary popup-dismiss clicks.
   *
   * @zh 按钮 0 的按下属于 ImGui，但排除普通的弹窗关闭点击。
   * @ja ボタン 0 の押下は ImGui 所属。通常のポップアップを閉じるクリックは除外。
   * @ko 버튼 0 누르기가 ImGui에 속합니다. 일반 팝업 닫기 클릭은 제외합니다.
   */
  MouseDownOwnedUnlessPopupClose0: boolean;
  /**
   * Button 1 press belongs to ImGui, excluding ordinary popup-dismiss clicks.
   *
   * @zh 按钮 1 的按下属于 ImGui，但排除普通的弹窗关闭点击。
   * @ja ボタン 1 の押下は ImGui 所属。通常のポップアップを閉じるクリックは除外。
   * @ko 버튼 1 누르기가 ImGui에 속합니다. 일반 팝업 닫기 클릭은 제외합니다.
   */
  MouseDownOwnedUnlessPopupClose1: boolean;
  /**
   * Button 2 press belongs to ImGui, excluding ordinary popup-dismiss clicks.
   *
   * @zh 按钮 2 的按下属于 ImGui，但排除普通的弹窗关闭点击。
   * @ja ボタン 2 の押下は ImGui 所属。通常のポップアップを閉じるクリックは除外。
   * @ko 버튼 2 누르기가 ImGui에 속합니다. 일반 팝업 닫기 클릭은 제외합니다.
   */
  MouseDownOwnedUnlessPopupClose2: boolean;
  /**
   * Button 3 press belongs to ImGui, excluding ordinary popup-dismiss clicks.
   *
   * @zh 按钮 3 的按下属于 ImGui，但排除普通的弹窗关闭点击。
   * @ja ボタン 3 の押下は ImGui 所属。通常のポップアップを閉じるクリックは除外。
   * @ko 버튼 3 누르기가 ImGui에 속합니다. 일반 팝업 닫기 클릭은 제외합니다.
   */
  MouseDownOwnedUnlessPopupClose3: boolean;
  /**
   * Button 4 press belongs to ImGui, excluding ordinary popup-dismiss clicks.
   *
   * @zh 按钮 4 的按下属于 ImGui，但排除普通的弹窗关闭点击。
   * @ja ボタン 4 の押下は ImGui 所属。通常のポップアップを閉じるクリックは除外。
   * @ko 버튼 4 누르기가 ImGui에 속합니다. 일반 팝업 닫기 클릭은 제외합니다.
   */
  MouseDownOwnedUnlessPopupClose4: boolean;
  /**
   * Shift requests vertical-to-horizontal wheel conversion on non-macOS
   * systems.
   *
   * @zh 非 macOS 系统上，Shift 请求将垂直滚轮转换为水平滚轮。
   * @ja macOS 以外で Shift が垂直ホイールから水平への変換を要求中。
   * @ko macOS 이외 시스템에서 Shift가 수직 휠의 수평 변환을 요청합니다.
   */
  MouseWheelRequestAxisSwap: boolean;
  /**
   * Current macOS Ctrl+left click is being simulated as a right click.
   *
   * @zh 当前 macOS Ctrl+左键点击正被模拟为右键点击。
   * @ja 現在の macOS Ctrl+左クリックを右クリックとして模擬しています。
   * @ko 현재 macOS Ctrl+왼쪽 클릭을 오른쪽 클릭으로 처리하고 있습니다.
   */
  MouseCtrlLeftAsRightClick: boolean;
  /**
   * Button 0 hold seconds; -1 means released, zero means just pressed.
   *
   * @zh 按钮 0 按住秒数；-1 表示松开，零表示刚按下。
   * @ja ボタン 0 の押下秒数。-1 は解放、0 は押した直後。
   * @ko 버튼 0의 누른 초 수입니다. -1은 놓임, 0은 막 누름입니다.
   */
  MouseDownDuration0: number;
  /**
   * Button 1 hold seconds; -1 means released, zero means just pressed.
   *
   * @zh 按钮 1 按住秒数；-1 表示松开，零表示刚按下。
   * @ja ボタン 1 の押下秒数。-1 は解放、0 は押した直後。
   * @ko 버튼 1의 누른 초 수입니다. -1은 놓임, 0은 막 누름입니다.
   */
  MouseDownDuration1: number;
  /**
   * Button 2 hold seconds; -1 means released, zero means just pressed.
   *
   * @zh 按钮 2 按住秒数；-1 表示松开，零表示刚按下。
   * @ja ボタン 2 の押下秒数。-1 は解放、0 は押した直後。
   * @ko 버튼 2의 누른 초 수입니다. -1은 놓임, 0은 막 누름입니다.
   */
  MouseDownDuration2: number;
  /**
   * Button 3 hold seconds; -1 means released, zero means just pressed.
   *
   * @zh 按钮 3 按住秒数；-1 表示松开，零表示刚按下。
   * @ja ボタン 3 の押下秒数。-1 は解放、0 は押した直後。
   * @ko 버튼 3의 누른 초 수입니다. -1은 놓임, 0은 막 누름입니다.
   */
  MouseDownDuration3: number;
  /**
   * Button 4 hold seconds; -1 means released, zero means just pressed.
   *
   * @zh 按钮 4 按住秒数；-1 表示松开，零表示刚按下。
   * @ja ボタン 4 の押下秒数。-1 は解放、0 は押した直後。
   * @ko 버튼 4의 누른 초 수입니다. -1은 놓임, 0은 막 누름입니다.
   */
  MouseDownDuration4: number;
  /**
   * Previous frame's button 0 hold seconds; -1 means it was released.
   *
   * @zh 上一帧按钮 0 按住的秒数；-1 表示当时已松开。
   * @ja 前フレームのボタン 0 押下秒数。-1 は解放状態。
   * @ko 이전 프레임 버튼 0의 누른 초 수입니다. -1은 당시 놓임 상태입니다.
   */
  MouseDownDurationPrev0: number;
  /**
   * Previous frame's button 1 hold seconds; -1 means it was released.
   *
   * @zh 上一帧按钮 1 按住的秒数；-1 表示当时已松开。
   * @ja 前フレームのボタン 1 押下秒数。-1 は解放状態。
   * @ko 이전 프레임 버튼 1의 누른 초 수입니다. -1은 당시 놓임 상태입니다.
   */
  MouseDownDurationPrev1: number;
  /**
   * Previous frame's button 2 hold seconds; -1 means it was released.
   *
   * @zh 上一帧按钮 2 按住的秒数；-1 表示当时已松开。
   * @ja 前フレームのボタン 2 押下秒数。-1 は解放状態。
   * @ko 이전 프레임 버튼 2의 누른 초 수입니다. -1은 당시 놓임 상태입니다.
   */
  MouseDownDurationPrev2: number;
  /**
   * Previous frame's button 3 hold seconds; -1 means it was released.
   *
   * @zh 上一帧按钮 3 按住的秒数；-1 表示当时已松开。
   * @ja 前フレームのボタン 3 押下秒数。-1 は解放状態。
   * @ko 이전 프레임 버튼 3의 누른 초 수입니다. -1은 당시 놓임 상태입니다.
   */
  MouseDownDurationPrev3: number;
  /**
   * Previous frame's button 4 hold seconds; -1 means it was released.
   *
   * @zh 上一帧按钮 4 按住的秒数；-1 表示当时已松开。
   * @ja 前フレームのボタン 4 押下秒数。-1 は解放状態。
   * @ko 이전 프레임 버튼 4의 누른 초 수입니다. -1은 당시 놓임 상태입니다.
   */
  MouseDownDurationPrev4: number;
  /**
   * Maximum squared pixel distance from button 0's click origin while held.
   *
   * @zh 按住按钮 0 期间，相对其点击起点的最大像素距离平方。
   * @ja ボタン 0 押下中のクリック起点からの最大画素距離の二乗。
   * @ko 버튼 0을 누른 동안 클릭 시작점부터의 최대 픽셀 거리 제곱입니다.
   */
  MouseDragMaxDistanceSqr0: number;
  /**
   * Maximum squared pixel distance from button 1's click origin while held.
   *
   * @zh 按住按钮 1 期间，相对其点击起点的最大像素距离平方。
   * @ja ボタン 1 押下中のクリック起点からの最大画素距離の二乗。
   * @ko 버튼 1을 누른 동안 클릭 시작점부터의 최대 픽셀 거리 제곱입니다.
   */
  MouseDragMaxDistanceSqr1: number;
  /**
   * Maximum squared pixel distance from button 2's click origin while held.
   *
   * @zh 按住按钮 2 期间，相对其点击起点的最大像素距离平方。
   * @ja ボタン 2 押下中のクリック起点からの最大画素距離の二乗。
   * @ko 버튼 2를 누른 동안 클릭 시작점부터의 최대 픽셀 거리 제곱입니다.
   */
  MouseDragMaxDistanceSqr2: number;
  /**
   * Maximum squared pixel distance from button 3's click origin while held.
   *
   * @zh 按住按钮 3 期间，相对其点击起点的最大像素距离平方。
   * @ja ボタン 3 押下中のクリック起点からの最大画素距離の二乗。
   * @ko 버튼 3을 누른 동안 클릭 시작점부터의 최대 픽셀 거리 제곱입니다.
   */
  MouseDragMaxDistanceSqr3: number;
  /**
   * Maximum squared pixel distance from button 4's click origin while held.
   *
   * @zh 按住按钮 4 期间，相对其点击起点的最大像素距离平方。
   * @ja ボタン 4 押下中のクリック起点からの最大画素距離の二乗。
   * @ko 버튼 4를 누른 동안 클릭 시작점부터의 최대 픽셀 거리 제곱입니다.
   */
  MouseDragMaxDistanceSqr4: number;
  /**
   * Touch/pen pressure from zero to one; currently unused by ImGui itself.
   *
   * @zh 零到一的触摸或笔压力；目前 ImGui 自身不使用。
   * @ja 0 から 1 のタッチ・ペン圧力。現在 ImGui 自身では未使用。
   * @ko 0에서 1 사이의 터치 또는 펜 압력입니다. 현재 ImGui 자체는 사용하지 않습니다.
   */
  PenPressure: number;
  /**
   * Application focus-loss state; update through IO_AddFocusEvent(), not
   * directly.
   *
   * @zh 应用失焦状态；应通过 IO_AddFocusEvent() 更新，不应直接修改。
   * @ja アプリのフォーカス喪失状態です。直接ではなく IO_AddFocusEvent() で更新します。
   * @ko 앱 포커스 상실 상태입니다. 직접 쓰지 말고 IO_AddFocusEvent()로 갱신하세요.
   */
  AppFocusLost: boolean;
  /**
   * Input event acceptance gate; change through IO_SetAppAcceptingEvents().
   *
   * @zh 是否接受输入事件的开关；通过 IO_SetAppAcceptingEvents() 修改。
   * @ja 入力イベント受付の有効状態です。IO_SetAppAcceptingEvents() で変更します。
   * @ko 입력 이벤트 수락 여부입니다. IO_SetAppAcceptingEvents()로 변경하세요.
   */
  AppAcceptingEvents: boolean;
  /**
   * Pending UTF-16 high surrogate for IO_AddInputCharacterUTF16(); zero if
   * none.
   *
   * @zh IO_AddInputCharacterUTF16() 暂存的 UTF-16 高代理项；无则为零。
   * @ja IO_AddInputCharacterUTF16() の保留中の上位サロゲートです。なければ 0 です。
   * @ko IO_AddInputCharacterUTF16()의 대기 중 UTF-16 상위 서로게이트이며 없으면 0입니다.
   */
  InputQueueSurrogate: number;
}

/**
 * Access context settings and native-maintained IO state without copying.
 *
 * @zh 无需复制即可访问上下文设置与原生维护的输入输出状态。
 * @ja コピーせずにコンテキスト設定とネイティブ管理の入出力状態にアクセス。
 * @ko 복사 없이 컨텍스트 설정과 네이티브가 관리하는 입출력 상태에 접근합니다.
 * @remarks
 * Use IO_AddKeyEvent() and the IO_AddMouse event functions for input.
 * Do not overwrite derived counters.
 * The view does not keep a destroyed context valid or check its lifetime.
 * @zh 输入应使用 IO_AddKeyEvent() 和 IO_AddMouse 系列事件函数，不要覆盖派生计数器。
 * 此视图不会延长已销毁上下文的有效期，也不检查生命周期。
 * @ja 入力には IO_AddKeyEvent() と IO_AddMouse 系のイベント関数を使い、派生値を書き換えないでください。
 * このビューは破棄済みコンテキストを有効に保たず、寿命も検査しません。
 * @ko 입력에는 IO_AddKeyEvent()와 IO_AddMouse 계열 이벤트 함수를 사용하고 파생 카운터를 덮어쓰지 마세요.
 * 이 뷰는 파괴된 컨텍스트를 유효하게 유지하거나 수명을 검사하지 않습니다.
 * @param handle - IO borrowed from a context that must remain alive.
 * @zh handle - 从必须保持存活的上下文借用的 IO。
 * @ja handle - 存続しているコンテキストから借用した IO。
 * @ko handle - 살아 있어야 하는 컨텍스트에서 빌린 IO입니다.
 * @returns Live scalar accessors, not an input-state snapshot.
 * @zh 实时标量访问器，而非输入状态快照。
 * @ja 入力状態の複製ではなく、ライブスカラーアクセサー。
 * @ko 입력 상태 복사본이 아닌 실시간 스칼라 접근자입니다.
 */
export function viewImGuiIO(handle: ImGuiIO): ImGuiIOFields {
  return writableStruct<ImGuiIOFields>(native.viewImGuiIO(handle));
}

/**
 * Text callback scalars; positions and lengths are UTF-8 bytes, not JS indices.
 *
 * @zh 文本回调标量；位置和长度按 UTF-8 字节计，不是 JS 索引。
 * @ja テキストコールバック値。位置・長さは JS 索引でなく UTF-8 バイト単位。
 * @ko 텍스트 콜백 값입니다. 위치와 길이는 JS 인덱스가 아닌 UTF-8 바이트 단위입니다.
 */
export interface ImGuiInputTextCallbackDataFields {
  /**
   * Read-only callback event flag from ImGuiInputTextFlags, such as
   * CallbackEdit.
   *
   * @zh ImGuiInputTextFlags 中标识当前回调事件的只读标志，如 CallbackEdit。
   * @ja 現在のコールバックイベントを示す ImGuiInputTextFlags の読み取り専用フラグ。例：CallbackEdit。
   * @ko 현재 콜백 이벤트를 식별하는 ImGuiInputTextFlags의 읽기 전용 플래그입니다. 예: CallbackEdit.
   */
  EventFlag: number;
  /**
   * Read-only input flags originally passed to the text widget.
   *
   * @zh 最初传给文本控件的输入标志，只读。
   * @ja テキストウィジェットへ渡された入力フラグ。読み取り専用。
   * @ko 텍스트 위젯에 전달했던 입력 플래그입니다. 읽기 전용입니다.
   */
  Flags: number;
  /**
   * CharFilter character in 16-bit ImWchar; replace it or set zero to reject.
   *
   * @zh CharFilter 的 16 位 ImWchar 字符；可替换或设零以拒绝。
   * @ja CharFilter の 16 ビット ImWchar 文字。置換可能、0 で拒否。
   * @ko CharFilter의 16비트 ImWchar 문자입니다. 교체하거나 0으로 거부합니다.
   */
  EventChar: number;
  /**
   * Read-only ImGuiKey for Completion/History: Tab, UpArrow or DownArrow.
   *
   * @zh Completion/History 的只读 ImGuiKey：Tab、UpArrow 或 DownArrow。
   * @ja Completion/History 用の読み取り専用 ImGuiKey。Tab、UpArrow、DownArrow。
   * @ko Completion/History의 읽기 전용 ImGuiKey입니다. Tab, UpArrow, DownArrow입니다.
   */
  EventKey: number;
  /**
   * Text byte length excluding NUL; keep below BufSize and mark edits dirty.
   *
   * @zh 不含 NUL 的文本字节数；须小于 BufSize，修改后设置 BufDirty。
   * @ja NUL を除く文字列バイト長。BufSize 未満を維持し、編集時は BufDirty を設定。
   * @ko NUL 제외 텍스트 바이트 수입니다. BufSize 미만을 유지하고 수정 시 BufDirty를 켭니다.
   */
  BufTextLen: number;
  /**
   * Read-only buffer capacity in bytes including the NUL terminator.
   *
   * @zh 包含 NUL 终止符的缓冲区字节容量，只读。
   * @ja NUL 終端を含むバッファのバイト容量。読み取り専用。
   * @ko NUL 종결자를 포함한 버퍼 바이트 용량입니다. 읽기 전용입니다.
   */
  BufSize: number;
  /**
   * Set after editing Buf or BufTextLen in Completion/History/Always callbacks.
   *
   * @zh 在 Completion/History/Always 回调修改 Buf 或 BufTextLen 后设置。
   * @ja Completion/History/Always で Buf や BufTextLen を編集したら設定。
   * @ko Completion/History/Always에서 Buf나 BufTextLen을 수정한 뒤 설정합니다.
   */
  BufDirty: boolean;
  /**
   * Cursor byte offset in Buf for Completion/History/Always callbacks.
   *
   * @zh Completion/History/Always 回调中光标在 Buf 内的字节偏移。
   * @ja Completion/History/Always での Buf 内カーソル位置。バイト単位。
   * @ko Completion/History/Always 콜백의 Buf 내 커서 바이트 오프셋입니다.
   */
  CursorPos: number;
  /**
   * Selection start byte offset; equals SelectionEnd when nothing is selected.
   *
   * @zh 选区起始字节偏移；无选区时等于 SelectionEnd。
   * @ja 選択開始のバイト位置。選択なしなら SelectionEnd と同じ。
   * @ko 선택 시작 바이트 위치입니다. 선택이 없으면 SelectionEnd와 같습니다.
   */
  SelectionStart: number;
  /**
   * Selection end byte offset; equals SelectionStart when nothing is selected.
   *
   * @zh 选区结束字节偏移；无选区时等于 SelectionStart。
   * @ja 選択終了のバイト位置。選択なしなら SelectionStart と同じ。
   * @ko 선택 끝 바이트 위치입니다. 선택이 없으면 SelectionStart와 같습니다.
   */
  SelectionEnd: number;
}

/**
 * Access text-edit callback fields during the invoking callback.
 *
 * @zh 在当前文本编辑回调执行期间访问其字段。
 * @ja テキスト編集コールバックの実行中にフィールドへアクセスします。
 * @ko 텍스트 편집 콜백 실행 중 해당 필드에 접근합니다.
 * @param handle - Callback data; borrowed storage expires when the callback
 * ends.
 * @zh handle - 回调数据；借用存储在回调结束时失效。
 * @ja handle - コールバックデータ。借用領域はコールバック終了時に無効。
 * @ko handle - 콜백 데이터입니다. 빌린 저장소는 콜백 종료 시 만료됩니다.
 * @returns Live scalar accessors; native read-only fields must not be changed.
 * @zh 实时标量访问器；不得修改原生规定为只读的字段。
 * @ja ライブスカラーアクセサー。ネイティブの読み取り専用項目は変更しないこと。
 * @ko 실시간 스칼라 접근자입니다. 네이티브 읽기 전용 필드는 변경하지 마세요.
 */
export function viewImGuiInputTextCallbackData(
  handle: ImGuiInputTextCallbackData,
): ImGuiInputTextCallbackDataFields {
  return writableStruct<ImGuiInputTextCallbackDataFields>(
    native.viewImGuiInputTextCallbackData(handle),
  );
}

/**
 * Clipper output range and internal vertical-position bookkeeping.
 *
 * @zh 裁剪器输出范围与内部垂直位置记账状态。
 * @ja クリッパーの出力範囲と内部の垂直位置管理状態。
 * @ko 클리퍼 출력 범위와 내부 수직 위치 관리 상태입니다.
 */
export interface ImGuiListClipperFields {
  /**
   * First row index to submit after ListClipper_Step() returns true, inclusive.
   *
   * @zh ListClipper_Step() 返回 true 后应提交的首行索引，包含该行。
   * @ja ListClipper_Step() が true を返した後に描画する最初の行番号です。この行を含みます。
   * @ko ListClipper_Step()이 true를 반환한 뒤 제출할 첫 행 인덱스입니다. 해당 행을 포함합니다.
   */
  DisplayStart: number;
  /**
   * One-past-last row index to submit for the current ListClipper_Step().
   *
   * @zh 当前 ListClipper_Step() 应提交范围的结束行索引，不包含该行。
   * @ja 現在の ListClipper_Step() で描画する最後の行の次の番号です。この行は含みません。
   * @ko 현재 ListClipper_Step()에서 제출할 마지막 행 다음 인덱스입니다. 해당 행은 제외합니다.
   */
  DisplayEnd: number;
  /**
   * Internal row count from ListClipper_Begin(); 2147483647 means unknown.
   *
   * @zh ListClipper_Begin() 设置的内部行数；2147483647 表示数量未知。
   * @ja ListClipper_Begin() 由来の内部行数。2147483647 は行数不明です。
   * @ko ListClipper_Begin()의 내부 행 수입니다. 2147483647은 개수 불명입니다.
   */
  ItemsCount: number;
  /**
   * Internal row pitch in pixels, including spacing; ListClipper_Step() may
   * measure it.
   *
   * @zh 内部行距，按像素计并包含间隔；可由 ListClipper_Step() 测量。
   * @ja 余白を含む内部の行間隔です。ピクセル単位で、ListClipper_Step() が計測する場合もあります。
   * @ko 여백 포함 내부 행 간격입니다. 픽셀 단위이며 ListClipper_Step()이 측정할 수 있습니다.
   */
  ItemsHeight: number;
  /**
   * Internal starting cursor Y, adjusted after frozen table rows.
   *
   * @zh 内部起始光标 Y；处理完表格冻结行后会调整。
   * @ja 内部開始カーソル Y。固定テーブル行の処理後に調整されます。
   * @ko 내부 시작 커서 Y입니다. 고정 테이블 행 처리 후 조정됩니다.
   */
  StartPosY: number;
  /**
   * Double-precision seek correction for frozen rows and large-coordinate loss.
   *
   * @zh 用于冻结行及大坐标精度损失的双精度定位修正。
   * @ja 固定行と大きな座標の精度損失を補正する倍精度の移動オフセット。
   * @ko 고정 행 및 큰 좌표의 정밀도 손실을 보정하는 배정밀도 이동 값입니다.
   */
  StartSeekOffsetY: number;
}

/**
 * Observe clipper ranges as ListClipper_Begin(), ListClipper_Step() and
 * ListClipper_End() update native state.
 *
 * @zh 观察 ListClipper_Begin()、ListClipper_Step()、ListClipper_End() 更新的原生裁剪范围。
 * @ja ListClipper_Begin()、ListClipper_Step()、ListClipper_End()
 * が更新するネイティブのクリップ範囲を参照します。
 * @ko ListClipper_Begin(), ListClipper_Step(), ListClipper_End()가 갱신하는 네이티브 클리핑
 * 범위를 참조합니다.
 * @param handle - Clipper whose native owner must remain alive.
 * @zh handle - 原生所有者必须保持存活的裁剪器。
 * @ja handle - ネイティブ所有者が存続しているクリッパー。
 * @ko handle - 네이티브 소유자가 살아 있어야 하는 클리퍼입니다.
 * @returns Live fields; use clipper methods rather than editing internal state.
 * @zh 实时字段；应使用裁剪器方法，不应直接修改内部状态。
 * @ja ライブフィールド。内部値の編集でなくクリッパーのメソッドを使います。
 * @ko 실시간 필드입니다. 내부 값을 편집하지 말고 클리퍼 메서드를 사용하세요.
 */
export function viewImGuiListClipper(
  handle: ImGuiListClipper,
): ImGuiListClipperFields {
  return writableStruct<ImGuiListClipperFields>(
    native.viewImGuiListClipper(handle),
  );
}

/**
 * Multi-selection range anchor and navigation state, separate from requests.
 *
 * @zh 多选范围锚点与导航状态，不包含请求列表。
 * @ja 複数選択の範囲起点とナビゲーション状態。要求リストは含みません。
 * @ko 다중 선택 범위 기준점과 탐색 상태입니다. 요청 목록은 포함하지 않습니다.
 */
export interface ImGuiMultiSelectIOFields {
  /**
   * Range anchor's signed 64-bit user data; ensure its item is not clipped.
   *
   * @zh 范围锚点的有符号 64 位用户数据；须保证对应项目不被裁剪。
   * @ja 範囲起点の符号付き 64 ビットユーザーデータ。対応項目をクリップしないこと。
   * @ko 범위 기준점의 부호 있는 64비트 사용자 데이터입니다. 해당 항목을 숨기지 마세요.
   */
  RangeSrcItem: bigint;
  /**
   * Last known signed 64-bit selection user data for the navigation-focused
   * item.
   *
   * @zh 导航焦点项目最近已知的有符号 64 位选择用户数据。
   * @ja ナビゲーションでフォーカス中の項目の最終既知の符号付き 64 ビット選択データ。
   * @ko 탐색 포커스 항목의 마지막으로 알려진 부호 있는 64비트 선택 데이터입니다.
   */
  NavIdItem: bigint;
  /**
   * Last known selection state of the navigation-focused submitted item.
   *
   * @zh 已提交的导航焦点项目最近已知的选中状态。
   * @ja 提出済みのナビゲーションフォーカス項目の最終既知の選択状態。
   * @ko 제출된 탐색 포커스 항목의 마지막으로 알려진 선택 상태입니다.
   */
  NavIdSelected: boolean;
  /**
   * Set before EndMultiSelect() to reset the range anchor, e.g. after deletion.
   *
   * @zh 在 EndMultiSelect() 前设置以重置范围锚点，例如删除后。
   * @ja 削除後など、EndMultiSelect() 前に設定して範囲起点をリセットします。
   * @ko 삭제 후 등 EndMultiSelect() 전에 설정해 범위 기준점을 초기화합니다.
   */
  RangeSrcReset: boolean;
  /**
   * BeginMultiSelect() item count copied for request handlers; -1 if unknown.
   *
   * @zh 为请求处理器复制的 BeginMultiSelect() 项目数；未知时为 -1。
   * @ja 要求処理用にコピーした BeginMultiSelect() の項目数。不明なら -1。
   * @ko 요청 처리용으로 복사한 BeginMultiSelect() 항목 수입니다. 불명이면 -1입니다.
   */
  ItemsCount: number;
}

/**
 * Access the current multi-selection scope's range and navigation state.
 *
 * @zh 访问当前多选作用域的范围与导航状态。
 * @ja 現在の複数選択スコープの範囲とナビゲーション状態にアクセスします。
 * @ko 현재 다중 선택 범위의 기준점과 탐색 상태에 접근합니다.
 * @param handle - Borrowed BeginMultiSelect()/EndMultiSelect() result; use
 * promptly.
 * @zh handle - 借用的 BeginMultiSelect()/EndMultiSelect() 结果；应立即使用。
 * @ja handle - BeginMultiSelect()/EndMultiSelect() の借用結果。速やかに使用。
 * @ko handle - 빌린 BeginMultiSelect()/EndMultiSelect() 결과입니다. 즉시 사용하세요.
 * @returns Live scalar fields, invalid after the scope's storage is reused.
 * @zh 实时标量字段；作用域存储被复用后失效。
 * @ja ライブスカラー値。スコープの保存領域が再利用されると無効。
 * @ko 실시간 스칼라 필드입니다. 범위 저장소가 재사용되면 무효합니다.
 */
export function viewImGuiMultiSelectIO(
  handle: ImGuiMultiSelectIO,
): ImGuiMultiSelectIOFields {
  return writableStruct<ImGuiMultiSelectIOFields>(
    native.viewImGuiMultiSelectIO(handle),
  );
}

/**
 * Scalar metadata for a drag-and-drop payload; does not expose its data
 * pointer.
 *
 * @zh 拖放载荷的标量元数据；不暴露其数据指针。
 * @ja ドラッグ＆ドロップのスカラーメタデータ。データポインターは含みません。
 * @ko 드래그 앤 드롭 데이터의 스칼라 메타데이터이며 데이터 포인터는 노출하지 않습니다.
 */
export interface ImGuiPayloadFields {
  /**
   * Payload byte length; editing it does not resize the native data allocation.
   *
   * @zh 载荷字节长度；修改不会调整原生数据分配大小。
   * @ja ペイロードのバイト長。変更してもネイティブ領域は拡張されません。
   * @ko 데이터 바이트 길이입니다. 변경해도 네이티브 할당 크기는 바뀌지 않습니다.
   */
  DataSize: number;
}

/**
 * Access drag-and-drop payload metadata without copying payload bytes.
 *
 * @zh 无需复制载荷字节即可访问拖放元数据。
 * @ja データのバイト列をコピーせずにドラッグ＆ドロップのメタデータにアクセス。
 * @ko 데이터 바이트를 복사하지 않고 드래그 앤 드롭 메타데이터에 접근합니다.
 * @param handle - Borrowed payload; keep its context and drag operation valid.
 * @zh handle - 借用载荷；须保持上下文和拖放操作有效。
 * @ja handle - 借用ペイロード。コンテキストとドラッグ操作が有効であること。
 * @ko handle - 빌린 데이터입니다. 컨텍스트와 드래그 작업이 유효해야 합니다.
 * @returns Live size metadata; writing does not copy or resize the payload.
 * @zh 实时大小元数据；写入不会复制或调整载荷大小。
 * @ja ライブのサイズ情報。書き込みでデータの複製やサイズ変更は行いません。
 * @ko 실시간 크기 정보입니다. 쓰기로 데이터를 복사하거나 크기를 바꾸지 않습니다.
 */
export function viewImGuiPayload(handle: ImGuiPayload): ImGuiPayloadFields {
  return writableStruct<ImGuiPayloadFields>(native.viewImGuiPayload(handle));
}

/**
 * Platform locale configuration for numeric text input.
 *
 * @zh 数字文本输入的平台区域配置。
 * @ja 数値文字入力用のプラットフォームロケール設定。
 * @ko 숫자 텍스트 입력의 플랫폼 로캘 설정입니다.
 */
export interface ImGuiPlatformIOFields {
  /**
   * Locale decimal separator as an ImWchar code point, normally '.' (46).
   *
   * @zh 区域设置小数分隔符的 ImWchar 码点，通常为 '.'（46）。
   * @ja ロケールの小数点を表す ImWchar コードポイント。通常 '.'（46）。
   * @ko 로캘 소수점 구분자의 ImWchar 코드 포인트입니다. 보통 '.'(46)입니다.
   */
  Platform_LocaleDecimalPoint: number;
}

/**
 * Access the context's platform locale scalar without copying.
 *
 * @zh 无需复制即可访问上下文的平台区域标量。
 * @ja コピーせずにコンテキストのプラットフォームロケール値にアクセス。
 * @ko 복사 없이 컨텍스트의 플랫폼 로캘 스칼라에 접근합니다.
 * @param handle - Platform IO borrowed from a context that must remain alive.
 * @zh handle - 从必须保持存活的上下文借用的平台 IO。
 * @ja handle - 存続しているコンテキストから借用したプラットフォーム IO。
 * @ko handle - 살아 있어야 하는 컨텍스트에서 빌린 플랫폼 IO입니다.
 * @returns Live writable locale setting, not the platform callback table.
 * @zh 实时可写区域设置，不包含平台回调表。
 * @ja ライブで書き込み可能なロケール設定。プラットフォームのコールバック表ではない。
 * @ko 실시간 쓰기 가능한 로캘 설정입니다. 플랫폼 콜백 테이블은 아닙니다.
 */
export function viewImGuiPlatformIO(
  handle: ImGuiPlatformIO,
): ImGuiPlatformIOFields {
  return writableStruct<ImGuiPlatformIOFields>(
    native.viewImGuiPlatformIO(handle),
  );
}

/**
 * Selection-storage count and ordering configuration; not the selected ID set.
 *
 * @zh 选择存储的数量与排序配置；不是选中 ID 集合。
 * @ja 選択ストレージの件数と順序設定。選択された ID 集合ではありません。
 * @ko 선택 저장소의 개수와 순서 설정이며 선택된 ID 집합은 아닙니다.
 */
export interface ImGuiSelectionBasicStorageFields {
  /**
   * Selected item count maintained by the helper, not an array resize control.
   *
   * @zh 辅助器维护的选中项目数，不是数组大小调整接口。
   * @ja ヘルパーが管理する選択件数。配列サイズ変更用ではありません。
   * @ko 도우미가 관리하는 선택 항목 수이며 배열 크기 변경용이 아닙니다.
   */
  Size: number;
  /**
   * Make SelectionBasicStorage_GetNextSelectedItem() iterate in selection
   * order,
   * with extra sorting.
   *
   * @zh 让 SelectionBasicStorage_GetNextSelectedItem() 按选择顺序遍历，会增加排序开销。
   * @ja SelectionBasicStorage_GetNextSelectedItem() の走査を選択順にします。追加のソートが必要です。
   * @ko SelectionBasicStorage_GetNextSelectedItem()이 선택 순서대로 순회하게 합니다. 추가 정렬이
   * 필요합니다.
   */
  PreserveOrder: boolean;
  /**
   * Internal increasing sequence counter used to record selection order.
   *
   * @zh 用于记录选择顺序的内部递增序号。
   * @ja 選択順を記録する内部の増加カウンター。
   * @ko 선택 순서를 기록하는 내부 증가 카운터입니다.
   */
  _SelectionOrder: number;
}

/**
 * Access selection count and ordering options on native selection storage.
 *
 * @zh 访问原生选择存储中的选中数量与排序选项。
 * @ja ネイティブ選択ストレージの選択件数と順序オプションにアクセスします。
 * @ko 네이티브 선택 저장소의 선택 개수와 순서 옵션에 접근합니다.
 * @param handle - Selection storage whose native owner must remain alive.
 * @zh handle - 原生所有者必须保持存活的选择存储。
 * @ja handle - ネイティブ所有者が存続している選択ストレージ。
 * @ko handle - 네이티브 소유자가 살아 있어야 하는 선택 저장소입니다.
 * @returns Live fields; change membership through storage methods, not
 * counters.
 * @zh 实时字段；通过存储方法而非计数器更改选择成员。
 * @ja ライブ値。選択項目はカウンターでなくストレージのメソッドで変更します。
 * @ko 실시간 필드입니다. 카운터 대신 저장소 메서드로 선택 항목을 변경하세요.
 */
export function viewImGuiSelectionBasicStorage(
  handle: ImGuiSelectionBasicStorage,
): ImGuiSelectionBasicStorageFields {
  return writableStruct<ImGuiSelectionBasicStorageFields>(
    native.viewImGuiSelectionBasicStorage(handle),
  );
}

/**
 * Native style scalars; dimensions use pixels unless another unit is stated.
 *
 * @zh 原生样式标量；除非另有说明，尺寸单位均为像素。
 * @ja ネイティブスタイル値。特記しない寸法は画素単位です。
 * @ko 네이티브 스타일 값입니다. 별도 단위가 없으면 크기는 픽셀 단위입니다.
 */
export interface ImGuiStyleFields {
  /**
   * Global opacity multiplier for all ImGui drawing.
   *
   * @zh 所有 ImGui 绘制内容的全局不透明度倍率。
   * @ja ImGui の全描画に適用する不透明度の倍率。
   * @ko 모든 ImGui 렌더링에 적용하는 전체 불투명도 배율입니다.
   */
  Alpha: number;
  /**
   * Additional opacity multiplier applied over Alpha by BeginDisabled().
   *
   * @zh BeginDisabled() 在 Alpha 基础上额外应用的不透明度倍率。
   * @ja BeginDisabled() が Alpha に乗算する追加の不透明度倍率。
   * @ko BeginDisabled()가 Alpha에 곱하는 추가 불투명도 배율입니다.
   */
  DisabledAlpha: number;
  /**
   * Horizontal padding inside windows.
   *
   * @zh 窗口内部水平内边距。
   * @ja ウィンドウ内の水平余白。
   * @ko 창 내부의 수평 여백입니다.
   */
  WindowPaddingX: number;
  /**
   * Vertical padding inside windows.
   *
   * @zh 窗口内部垂直内边距。
   * @ja ウィンドウ内の垂直余白。
   * @ko 창 내부의 수직 여백입니다.
   */
  WindowPaddingY: number;
  /**
   * Window corner radius; zero makes square corners.
   *
   * @zh 窗口圆角半径；零表示直角。
   * @ja ウィンドウ角の半径。0 で直角。
   * @ko 창 모서리 반경입니다. 0이면 직각입니다.
   */
  WindowRounding: number;
  /**
   * Window border thickness, normally zero or one.
   *
   * @zh 窗口边框厚度，通常为零或一。
   * @ja ウィンドウ枠の太さ。通常 0 または 1。
   * @ko 창 테두리 두께입니다. 보통 0 또는 1입니다.
   */
  WindowBorderSize: number;
  /**
   * Resize hit-test padding on both sides of the window border.
   *
   * @zh 窗口边框内外两侧用于调整大小命中检测的扩展距离。
   * @ja サイズ変更判定用のウィンドウ枠の内外への拡張幅。
   * @ko 크기 변경 감지를 위해 창 테두리 안팎으로 확장하는 거리입니다.
   */
  WindowBorderHoverPadding: number;
  /**
   * Global minimum window width; use constraints for individual windows.
   *
   * @zh 全局窗口最小宽度；单个窗口应使用尺寸约束。
   * @ja 全体の最小ウィンドウ幅。個別の窓にはサイズ制約を使います。
   * @ko 전체 창의 최소 너비입니다. 개별 창에는 크기 제약을 사용하세요.
   */
  WindowMinSizeX: number;
  /**
   * Global minimum window height; use constraints for individual windows.
   *
   * @zh 全局窗口最小高度；单个窗口应使用尺寸约束。
   * @ja 全体の最小ウィンドウ高。個別の窓にはサイズ制約を使います。
   * @ko 전체 창의 최소 높이입니다. 개별 창에는 크기 제약을 사용하세요.
   */
  WindowMinSizeY: number;
  /**
   * Title text horizontal alignment: zero left, one right.
   *
   * @zh 标题文字水平对齐：零为左，一为右。
   * @ja タイトル文字の水平配置。0 は左、1 は右。
   * @ko 제목 텍스트의 수평 정렬입니다. 0은 왼쪽, 1은 오른쪽입니다.
   */
  WindowTitleAlignX: number;
  /**
   * Title text vertical alignment: zero top, one bottom; default one half.
   *
   * @zh 标题文字垂直对齐：零为上，一为下；默认二分之一。
   * @ja タイトル文字の垂直配置。0 は上、1 は下。既定値は 0.5。
   * @ko 제목 텍스트의 수직 정렬입니다. 0은 위, 1은 아래이며 기본값은 0.5입니다.
   */
  WindowTitleAlignY: number;
  /**
   * Title-bar collapse/menu button side as ImGuiDir: None, Left or Right.
   *
   * @zh 标题栏折叠或菜单按钮位置，ImGuiDir 的 None、Left 或 Right。
   * @ja タイトルバーの折り畳み・メニューボタン位置。ImGuiDir の None/Left/Right。
   * @ko 제목 표시줄 접기 및 메뉴 버튼 위치입니다. ImGuiDir의 None, Left, Right입니다.
   */
  WindowMenuButtonPosition: number;
  /**
   * Child-window corner radius; zero makes square corners.
   *
   * @zh 子窗口圆角半径；零表示直角。
   * @ja 子ウィンドウの角半径。0 で直角。
   * @ko 자식 창 모서리 반경입니다. 0이면 직각입니다.
   */
  ChildRounding: number;
  /**
   * Border thickness around child windows.
   *
   * @zh 子窗口边框厚度。
   * @ja 子ウィンドウの枠の太さ。
   * @ko 자식 창 테두리 두께입니다.
   */
  ChildBorderSize: number;
  /**
   * Popup corner radius; tooltips use WindowRounding instead.
   *
   * @zh 弹窗圆角半径；工具提示改用 WindowRounding。
   * @ja ポップアップ角半径。ツールチップは WindowRounding を使います。
   * @ko 팝업 모서리 반경입니다. 툴팁은 WindowRounding을 사용합니다.
   */
  PopupRounding: number;
  /**
   * Border thickness around popups and tooltips.
   *
   * @zh 弹窗和工具提示的边框厚度。
   * @ja ポップアップとツールチップの枠の太さ。
   * @ko 팝업 및 툴팁의 테두리 두께입니다.
   */
  PopupBorderSize: number;
  /**
   * Horizontal padding inside framed widgets such as buttons.
   *
   * @zh 按钮等带边框控件的水平内边距。
   * @ja ボタンなどの枠付きウィジェット内の水平余白。
   * @ko 버튼 등 프레임 위젯 내부의 수평 여백입니다.
   */
  FramePaddingX: number;
  /**
   * Vertical padding inside framed widgets such as buttons.
   *
   * @zh 按钮等带边框控件的垂直内边距。
   * @ja ボタンなどの枠付きウィジェット内の垂直余白。
   * @ko 버튼 등 프레임 위젯 내부의 수직 여백입니다.
   */
  FramePaddingY: number;
  /**
   * Framed-widget corner radius; zero makes square corners.
   *
   * @zh 带边框控件的圆角半径；零表示直角。
   * @ja 枠付きウィジェットの角半径。0 で直角。
   * @ko 프레임 위젯 모서리 반경입니다. 0이면 직각입니다.
   */
  FrameRounding: number;
  /**
   * Border thickness around framed widgets, normally zero or one.
   *
   * @zh 带边框控件的边框厚度，通常为零或一。
   * @ja 枠付きウィジェットの枠の太さ。通常 0 または 1。
   * @ko 프레임 위젯 테두리 두께입니다. 보통 0 또는 1입니다.
   */
  FrameBorderSize: number;
  /**
   * Horizontal spacing between separate widgets.
   *
   * @zh 独立控件之间的水平间距。
   * @ja 独立したウィジェット間の水平間隔。
   * @ko 개별 위젯 사이의 수평 간격입니다.
   */
  ItemSpacingX: number;
  /**
   * Vertical spacing between widgets or lines.
   *
   * @zh 控件或行之间的垂直间距。
   * @ja ウィジェットや行の間の垂直間隔。
   * @ko 위젯 또는 행 사이의 수직 간격입니다.
   */
  ItemSpacingY: number;
  /**
   * Horizontal spacing within compound widgets, such as a slider and label.
   *
   * @zh 复合控件内部的水平间距，例如滑块与标签之间。
   * @ja スライダーとラベルなど複合ウィジェット内の水平間隔。
   * @ko 슬라이더와 라벨 등 복합 위젯 내부의 수평 간격입니다.
   */
  ItemInnerSpacingX: number;
  /**
   * Vertical spacing between parts of a compound widget.
   *
   * @zh 复合控件各部分之间的垂直间距。
   * @ja 複合ウィジェットの各部分間の垂直間隔。
   * @ko 복합 위젯 구성 요소 사이의 수직 간격입니다.
   */
  ItemInnerSpacingY: number;
  /**
   * Horizontal table-cell padding, fixed for the duration of a table.
   *
   * @zh 表格单元格水平内边距，在同一表格期间固定。
   * @ja テーブルセルの水平余白。同じテーブル内では固定です。
   * @ko 테이블 셀 수평 여백입니다. 같은 테이블 내에서는 고정됩니다.
   */
  CellPaddingX: number;
  /**
   * Vertical table-cell padding, which may vary between rows.
   *
   * @zh 表格单元格垂直内边距，可在行之间改变。
   * @ja テーブルセルの垂直余白。行間で変更できます。
   * @ko 테이블 셀 수직 여백입니다. 행마다 변경할 수 있습니다.
   */
  CellPaddingY: number;
  /**
   * Horizontal touch hit-box expansion; overlapping hits favor the first
   * widget.
   *
   * @zh 触摸命中区域的水平扩展量；重叠时优先命中首个控件。
   * @ja タッチ判定の水平拡張幅。重複時は最初のウィジェットが優先。
   * @ko 터치 판정 영역의 수평 확장량입니다. 겹치면 첫 위젯이 우선합니다.
   */
  TouchExtraPaddingX: number;
  /**
   * Vertical touch hit-box expansion; overlapping hits favor the first widget.
   *
   * @zh 触摸命中区域的垂直扩展量；重叠时优先命中首个控件。
   * @ja タッチ判定の垂直拡張幅。重複時は最初のウィジェットが優先。
   * @ko 터치 판정 영역의 수직 확장량입니다. 겹치면 첫 위젯이 우선합니다.
   */
  TouchExtraPaddingY: number;
  /**
   * Default horizontal indentation, for example when entering tree nodes.
   *
   * @zh 默认水平缩进，例如进入树节点时使用。
   * @ja ツリーノードに入る時などの既定水平インデント幅。
   * @ko 트리 노드 진입 등에 쓰는 기본 수평 들여쓰기입니다.
   */
  IndentSpacing: number;
  /**
   * Minimum horizontal gap between legacy columns.
   *
   * @zh 旧式分栏之间的最小水平间距。
   * @ja 旧式カラム間の最小水平間隔。
   * @ko 구형 열 사이의 최소 수평 간격입니다.
   */
  ColumnsMinSpacing: number;
  /**
   * Vertical scrollbar width and horizontal scrollbar height.
   *
   * @zh 垂直滚动条宽度与水平滚动条高度。
   * @ja 垂直スクロールバーの幅と水平スクロールバーの高さ。
   * @ko 수직 스크롤바 너비 및 수평 스크롤바 높이입니다.
   */
  ScrollbarSize: number;
  /**
   * Corner radius of scrollbar grabs.
   *
   * @zh 滚动条滑块的圆角半径。
   * @ja スクロールバーつまみの角半径。
   * @ko 스크롤바 손잡이의 모서리 반경입니다.
   */
  ScrollbarRounding: number;
  /**
   * Minimum size of slider and scrollbar grabs along the moving axis.
   *
   * @zh 滑块与滚动条拖块沿移动轴方向的最小尺寸。
   * @ja スライダー・スクロールバーつまみの移動軸方向の最小寸法。
   * @ko 슬라이더 및 스크롤바 손잡이의 이동 축 방향 최소 크기입니다.
   */
  GrabMinSize: number;
  /**
   * Slider grab corner radius; zero makes square grabs.
   *
   * @zh 滑块拖块圆角半径；零表示直角。
   * @ja スライダーつまみの角半径。0 で直角。
   * @ko 슬라이더 손잡이 모서리 반경입니다. 0이면 직각입니다.
   */
  GrabRounding: number;
  /**
   * Pixel width of the zero dead zone for logarithmic sliders crossing zero.
   *
   * @zh 跨零对数滑块在零值附近的死区像素宽度。
   * @ja ゼロをまたぐ対数スライダーのゼロ付近の不感帯幅。画素単位。
   * @ko 0을 지나는 로그 슬라이더의 0 주변 데드존 픽셀 너비입니다.
   */
  LogSliderDeadzone: number;
  /**
   * Border thickness used by Image().
   *
   * @zh Image() 使用的边框厚度。
   * @ja Image() の枠の太さ。
   * @ko Image()가 사용하는 테두리 두께입니다.
   */
  ImageBorderSize: number;
  /**
   * Radius of the upper corners of tabs.
   *
   * @zh 标签页上方两角的圆角半径。
   * @ja タブ上側の角半径。
   * @ko 탭 위쪽 모서리의 반경입니다.
   */
  TabRounding: number;
  /**
   * Border thickness around individual tabs.
   *
   * @zh 单个标签页的边框厚度。
   * @ja 各タブの枠の太さ。
   * @ko 개별 탭의 테두리 두께입니다.
   */
  TabBorderSize: number;
  /**
   * Selected-tab close width: -1 always, 0 on hover, positive on hover if wide.
   *
   * @zh 选中页关闭按钮宽度阈值：-1 常显，0 悬停显示，正值需悬停且足够宽。
   * @ja 選択タブの閉じる幅閾値。-1 は常時、0 はホバー、正は十分な幅でホバー時。
   * @ko 선택 탭 닫기 너비 기준입니다. -1은 항상, 0은 호버, 양수는 충분한 너비와 호버입니다.
   */
  TabCloseButtonMinWidthSelected: number;
  /**
   * Unselected close width: -1 always, 0 hover, positive hover/min width.
   * Set 3.4028234663852886e38 to hide the close button.
   *
   * @zh 未选中页关闭阈值：-1 常显，0 悬停，正值需悬停且足够宽；3.4028234663852886e38 隐藏关闭按钮。
   * @ja 非選択タブの閉じる閾値。-1 常時、0 ホバー、正はホバーと最小幅。3.4028234663852886e38 は非表示。
   * @ko 비선택 탭 닫기 기준입니다. -1 항상, 0 호버, 양수 호버와 최소 폭, 3.4028234663852886e38 숨김입니다.
   */
  TabCloseButtonMinWidthUnselected: number;
  /**
   * Tab-bar separator thickness, drawn with the active tab color.
   *
   * @zh 标签栏分隔线厚度，使用活动标签页颜色。
   * @ja アクティブタブ色で描くタブバー区切り線の太さ。
   * @ko 활성 탭 색상으로 그리는 탭 바 구분선 두께입니다.
   */
  TabBarBorderSize: number;
  /**
   * Thickness of the overline highlighting the selected tab.
   *
   * @zh 高亮选中标签页的顶部线条厚度。
   * @ja 選択タブを強調する上線の太さ。
   * @ko 선택한 탭을 강조하는 위쪽 선의 두께입니다.
   */
  TabBarOverlineSize: number;
  /**
   * Angled-header angle in radians; supported range is about +/-0.873 (50
   * degrees).
   *
   * @zh 倾斜表头角度，单位弧度；支持约正负 0.873（50 度）。
   * @ja 斜めヘッダー角度。ラジアン単位で約 +/-0.873（50 度）まで。
   * @ko 기울어진 헤더 각도입니다. 라디안 단위로 약 +/-0.873(50도)까지 지원합니다.
   */
  TableAngledHeadersAngle: number;
  /**
   * Angled-header text horizontal alignment within the cell, from zero to one.
   *
   * @zh 倾斜表头文字在单元格内的水平对齐比例，零到一。
   * @ja セル内の斜めヘッダー文字の水平配置比率。0 から 1。
   * @ko 셀 내 기울어진 헤더 텍스트의 수평 정렬 비율입니다. 0에서 1입니다.
   */
  TableAngledHeadersTextAlignX: number;
  /**
   * Angled-header text vertical alignment within the cell, from zero to one.
   *
   * @zh 倾斜表头文字在单元格内的垂直对齐比例，零到一。
   * @ja セル内の斜めヘッダー文字の垂直配置比率。0 から 1。
   * @ko 셀 내 기울어진 헤더 텍스트의 수직 정렬 비율입니다. 0에서 1입니다.
   */
  TableAngledHeadersTextAlignY: number;
  /**
   * ColorEdit color-button side: ImGuiDir.Left or Right.
   *
   * @zh ColorEdit 颜色按钮位置：ImGuiDir.Left 或 Right。
   * @ja ColorEdit の色ボタン位置。ImGuiDir.Left または Right。
   * @ko ColorEdit 색상 버튼 위치입니다. ImGuiDir.Left 또는 Right입니다.
   */
  ColorButtonPosition: number;
  /**
   * Button text horizontal alignment from zero (left) to one (right).
   *
   * @zh 按钮文字水平对齐，从零（左）到一（右）。
   * @ja ボタン文字の水平配置。0 は左、1 は右。
   * @ko 버튼 텍스트의 수평 정렬입니다. 0은 왼쪽, 1은 오른쪽입니다.
   */
  ButtonTextAlignX: number;
  /**
   * Button text vertical alignment from zero (top) to one (bottom).
   *
   * @zh 按钮文字垂直对齐，从零（上）到一（下）。
   * @ja ボタン文字の垂直配置。0 は上、1 は下。
   * @ko 버튼 텍스트의 수직 정렬입니다. 0은 위, 1은 아래입니다.
   */
  ButtonTextAlignY: number;
  /**
   * Selectable text horizontal alignment; zero keeps same-line items
   * left-aligned.
   *
   * @zh 可选项文字水平对齐；零使同行项目保持左对齐。
   * @ja 選択項目文字の水平配置。0 で同じ行の項目を左揃えに保ちます。
   * @ko 선택 항목 텍스트 수평 정렬입니다. 0이면 같은 줄 항목을 왼쪽 정렬합니다.
   */
  SelectableTextAlignX: number;
  /**
   * Selectable text vertical alignment from zero (top) to one (bottom).
   *
   * @zh 可选项文字垂直对齐，从零（上）到一（下）。
   * @ja 選択項目文字の垂直配置。0 は上、1 は下。
   * @ko 선택 항목 텍스트의 수직 정렬입니다. 0은 위, 1은 아래입니다.
   */
  SelectableTextAlignY: number;
  /**
   * Separator line thickness in SeparatorText().
   *
   * @zh SeparatorText() 中分隔线的厚度。
   * @ja SeparatorText() の区切り線の太さ。
   * @ko SeparatorText()의 구분선 두께입니다.
   */
  SeparatorTextBorderSize: number;
  /**
   * Separator label horizontal alignment from zero (left) to one (right).
   *
   * @zh 分隔标签水平对齐，从零（左）到一（右）。
   * @ja 区切りラベルの水平配置。0 は左、1 は右。
   * @ko 구분선 라벨의 수평 정렬입니다. 0은 왼쪽, 1은 오른쪽입니다.
   */
  SeparatorTextAlignX: number;
  /**
   * Separator label vertical alignment; one half centers it on the line.
   *
   * @zh 分隔标签垂直对齐；二分之一表示在线上居中。
   * @ja 区切りラベルの垂直配置。0.5 で線の中央に配置。
   * @ko 구분선 라벨의 수직 정렬입니다. 0.5이면 선 중앙에 놓입니다.
   */
  SeparatorTextAlignY: number;
  /**
   * Horizontal inset of separator text from the separator's outer edges.
   *
   * @zh 分隔文字相对分隔线外边缘的水平内缩距离。
   * @ja 区切りの外端から文字までの水平余白。
   * @ko 구분선 바깥 가장자리부터 텍스트까지의 수평 여백입니다.
   */
  SeparatorTextPaddingX: number;
  /**
   * Vertical separator-text padding, usually equal to FramePaddingY.
   *
   * @zh 分隔文字的垂直内边距，通常等于 FramePaddingY。
   * @ja 区切り文字の垂直余白。通常 FramePaddingY と同じ。
   * @ko 구분선 텍스트의 수직 여백입니다. 보통 FramePaddingY와 같습니다.
   */
  SeparatorTextPaddingY: number;
  /**
   * Minimum horizontal window portion kept visible near display edges.
   *
   * @zh 窗口移近显示边缘时，水平方向必须保持可见的最小部分。
   * @ja 表示端付近でウィンドウを水平に最低限見えるように保つ幅。
   * @ko 화면 가장자리에서 창이 수평으로 최소한 보여야 하는 폭입니다.
   */
  DisplayWindowPaddingX: number;
  /**
   * Minimum vertical window portion kept visible near display edges.
   *
   * @zh 窗口移近显示边缘时，垂直方向必须保持可见的最小部分。
   * @ja 表示端付近でウィンドウを垂直に最低限見えるように保つ高さ。
   * @ko 화면 가장자리에서 창이 수직으로 최소한 보여야 하는 높이입니다.
   */
  DisplayWindowPaddingY: number;
  /**
   * Horizontal safe-area inset for windows, menus, popups and tooltips.
   *
   * @zh 窗口、菜单、弹窗和提示框的水平安全区内缩距离。
   * @ja 窓・メニュー・ポップアップ・ツールチップ用の水平安全余白。
   * @ko 창, 메뉴, 팝업 및 툴팁의 수평 안전 영역 여백입니다.
   */
  DisplaySafeAreaPaddingX: number;
  /**
   * Vertical safe-area inset for windows, menus, popups and tooltips.
   *
   * @zh 窗口、菜单、弹窗和提示框的垂直安全区内缩距离。
   * @ja 窓・メニュー・ポップアップ・ツールチップ用の垂直安全余白。
   * @ko 창, 메뉴, 팝업 및 툴팁의 수직 안전 영역 여백입니다.
   */
  DisplaySafeAreaPaddingY: number;
  /**
   * Software mouse cursor scale when IO.MouseDrawCursor is enabled.
   *
   * @zh IO.MouseDrawCursor 启用时的软件鼠标光标缩放倍率。
   * @ja IO.MouseDrawCursor 有効時のソフトウェアカーソル倍率。
   * @ko IO.MouseDrawCursor가 켜졌을 때 소프트웨어 마우스 커서 배율입니다.
   */
  MouseCursorScale: number;
  /**
   * Anti-alias lines and borders; copied into draw lists at frame start.
   *
   * @zh 对线条和边框抗锯齿；在帧开始时复制到绘制列表。
   * @ja 線と枠を平滑化。フレーム開始時に描画リストへコピー。
   * @ko 선 및 테두리 안티앨리어싱입니다. 프레임 시작 시 그리기 목록에 복사됩니다.
   */
  AntiAliasedLines: boolean;
  /**
   * Prefer texture-based line anti-aliasing; requires bilinear texture
   * filtering.
   *
   * @zh 优先使用纹理抗锯齿线条；需要双线性纹理过滤。
   * @ja 線の平滑化にテクスチャを優先。バイリニア補間が必要です。
   * @ko 선 안티앨리어싱에 텍스처를 우선 사용합니다. 이중 선형 필터링이 필요합니다.
   */
  AntiAliasedLinesUseTex: boolean;
  /**
   * Anti-alias filled-shape edges; copied into draw lists at frame start.
   *
   * @zh 对填充形状边缘抗锯齿；在帧开始时复制到绘制列表。
   * @ja 塗りつぶし形状の縁を平滑化。フレーム開始時に描画リストへコピー。
   * @ko 채운 도형 가장자리 안티앨리어싱입니다. 프레임 시작 시 목록에 복사됩니다.
   */
  AntiAliasedFill: boolean;
  /**
   * Automatic Bezier tessellation tolerance; lower values add finer geometry.
   *
   * @zh 自动贝塞尔曲线细分容差；越小生成的几何越精细。
   * @ja 自動ベジェ分割の許容誤差。小さいほど細かな形状になります。
   * @ko 자동 베지어 분할 허용 오차입니다. 작을수록 더 세밀한 형상이 생성됩니다.
   */
  CurveTessellationTol: number;
  /**
   * Maximum automatic circle/rounded-corner error in pixels; lower adds
   * segments.
   *
   * @zh 圆形或圆角自动细分的最大像素误差；越小分段越多。
   * @ja 円・角丸の自動分割の最大画素誤差。小さいほど分割数が増加。
   * @ko 원 및 둥근 모서리 자동 분할의 최대 픽셀 오차입니다. 작을수록 분할이 늘어납니다.
   */
  CircleTessellationMaxError: number;
  /**
   * Stillness time in seconds required by ImGuiHoveredFlags.Stationary.
   *
   * @zh ImGuiHoveredFlags.Stationary 要求的静止时间，单位秒。
   * @ja ImGuiHoveredFlags.Stationary が要求する静止秒数。
   * @ko ImGuiHoveredFlags.Stationary가 요구하는 정지 시간입니다. 초 단위입니다.
   */
  HoverStationaryDelay: number;
  /**
   * Hover delay in seconds used with ImGuiHoveredFlags.DelayShort.
   *
   * @zh ImGuiHoveredFlags.DelayShort 使用的悬停延迟秒数。
   * @ja ImGuiHoveredFlags.DelayShort のホバー待機秒数。
   * @ko ImGuiHoveredFlags.DelayShort의 호버 대기 시간입니다. 초 단위입니다.
   */
  HoverDelayShort: number;
  /**
   * Hover delay in seconds used with ImGuiHoveredFlags.DelayNormal.
   *
   * @zh ImGuiHoveredFlags.DelayNormal 使用的悬停延迟秒数。
   * @ja ImGuiHoveredFlags.DelayNormal のホバー待機秒数。
   * @ko ImGuiHoveredFlags.DelayNormal의 호버 대기 시간입니다. 초 단위입니다.
   */
  HoverDelayNormal: number;
  /**
   * Default ImGuiHoveredFlags for ForTooltip and item tooltips under mouse
   * input.
   *
   * @zh 鼠标输入时 ForTooltip 与项目工具提示默认使用的 ImGuiHoveredFlags。
   * @ja マウス操作時の ForTooltip と項目ツールチップ用の既定 ImGuiHoveredFlags。
   * @ko 마우스 입력 시 ForTooltip 및 항목 툴팁의 기본 ImGuiHoveredFlags입니다.
   */
  HoverFlagsForTooltipMouse: number;
  /**
   * Default ImGuiHoveredFlags for tooltips under keyboard/gamepad navigation.
   *
   * @zh 键盘或手柄导航时工具提示默认使用的 ImGuiHoveredFlags。
   * @ja キーボード・ゲームパッド操作時のツールチップ用の既定 ImGuiHoveredFlags。
   * @ko 키보드 또는 게임패드 탐색 시 툴팁의 기본 ImGuiHoveredFlags입니다.
   */
  HoverFlagsForTooltipNav: number;
}

/**
 * Access the context's live style dimensions, opacity and hover behavior.
 *
 * @zh 访问上下文实时样式中的尺寸、不透明度与悬停行为。
 * @ja コンテキストのライブスタイル寸法・不透明度・ホバー動作にアクセスします。
 * @ko 컨텍스트의 실시간 스타일 크기, 불투명도 및 호버 동작에 접근합니다.
 * @param handle - Style borrowed from a context that must remain alive.
 * @zh handle - 从必须保持存活的上下文借用的样式。
 * @ja handle - 存続しているコンテキストから借用したスタイル。
 * @ko handle - 살아 있어야 하는 컨텍스트에서 빌린 스타일입니다.
 * @returns Writable native fields; excludes the Colors array and makes no copy.
 * @zh 可写原生字段；不包含 Colors 数组，也不复制数据。
 * @ja 書き込み可能なネイティブ値。Colors 配列は含まず、コピーもしません。
 * @ko 쓰기 가능한 네이티브 필드입니다. Colors 배열은 제외하며 복사하지 않습니다.
 */
export function viewImGuiStyle(handle: ImGuiStyle): ImGuiStyleFields {
  return writableStruct<ImGuiStyleFields>(native.viewImGuiStyle(handle));
}

/**
 * Table sort-specification count and the application's pending-sort flag.
 *
 * @zh 表格排序规格数量与应用的待排序标志。
 * @ja テーブルのソート指定数とアプリ側のソート待ちフラグ。
 * @ko 테이블 정렬 지정 개수와 앱의 정렬 대기 플래그입니다.
 */
export interface ImGuiTableSortSpecsFields {
  /**
   * Number of active column sort specs; may be zero with SortTristate.
   *
   * @zh 活跃列排序规格数量；启用 SortTristate 时可为零。
   * @ja 有効な列ソート指定数。SortTristate では 0 の場合があります。
   * @ko 활성 열 정렬 지정 개수입니다. SortTristate이면 0일 수 있습니다.
   */
  SpecsCount: number;
  /**
   * True when specs changed; sort application data, then clear this flag.
   *
   * @zh 排序规格变化时为真；对应用数据排序后清除此标志。
   * @ja 指定変更時は真。アプリのデータをソートしてから解除してください。
   * @ko 지정이 바뀌면 참입니다. 앱 데이터를 정렬한 뒤 이 플래그를 지우세요.
   */
  SpecsDirty: boolean;
}

/**
 * Access table sorting metadata and acknowledge a completed application sort.
 *
 * @zh 访问表格排序元数据，并确认应用已完成排序。
 * @ja テーブルソート情報を参照し、アプリ側のソート完了を通知します。
 * @ko 테이블 정렬 정보를 참조하고 앱의 정렬 완료를 확인합니다.
 * @param handle - Borrowed specs; reacquire each frame and after table changes.
 * @zh handle - 借用规格；每帧及表格变化后需重新获取。
 * @ja handle - 借用した指定。毎フレームおよびテーブル変更後に再取得。
 * @ko handle - 빌린 지정입니다. 매 프레임 및 테이블 변경 후 다시 얻으세요.
 * @returns Live count and dirty flag; column sort entries are not included.
 * @zh 实时数量与脏标志；不包含各列排序条目。
 * @ja ライブの件数と変更フラグ。個別の列ソート指定は含みません。
 * @ko 실시간 개수 및 변경 플래그입니다. 개별 열 정렬 항목은 포함하지 않습니다.
 */
export function viewImGuiTableSortSpecs(
  handle: ImGuiTableSortSpecs,
): ImGuiTableSortSpecsFields {
  return writableStruct<ImGuiTableSortSpecsFields>(
    native.viewImGuiTableSortSpecs(handle),
  );
}

/**
 * Text-filter bookkeeping computed when the comma-separated filter is built.
 *
 * @zh 构建逗号分隔过滤表达式时计算的文本过滤器记账状态。
 * @ja カンマ区切りフィルターの構築時に計算するテキストフィルター管理状態。
 * @ko 쉼표 구분 필터를 빌드할 때 계산되는 텍스트 필터 관리 상태입니다.
 */
export interface ImGuiTextFilterFields {
  /**
   * Number of nonempty inclusion terms, excluding minus-prefixed exclusions.
   *
   * @zh 非空包含项的数量，不含减号前缀的排除项。
   * @ja 空でない包含条件の数。マイナス接頭辞の除外条件は含みません。
   * @ko 비어 있지 않은 포함 조건 수입니다. 빼기 접두사의 제외 조건은 세지 않습니다.
   */
  CountGrep: number;
}

/**
 * Inspect the text filter's built inclusion-term count.
 *
 * @zh 查看文本过滤器构建后的包含项数量。
 * @ja 構築済みテキストフィルターの包含条件数を参照します。
 * @ko 빌드된 텍스트 필터의 포함 조건 수를 참조합니다.
 * @param handle - Text filter whose native owner must remain alive.
 * @zh handle - 原生所有者必须保持存活的文本过滤器。
 * @ja handle - ネイティブ所有者が存続しているテキストフィルター。
 * @ko handle - 네이티브 소유자가 살아 있어야 하는 텍스트 필터입니다.
 * @returns Live counter; editing it does not rebuild the parsed filter.
 * @zh 实时计数器；修改不会重建已解析的过滤器。
 * @ja ライブカウンター。編集しても解析済みフィルターは再構築されません。
 * @ko 실시간 카운터입니다. 수정해도 분석된 필터가 재빌드되지는 않습니다.
 */
export function viewImGuiTextFilter(
  handle: ImGuiTextFilter,
): ImGuiTextFilterFields {
  return writableStruct<ImGuiTextFilterFields>(
    native.viewImGuiTextFilter(handle),
  );
}

/**
 * Viewport identity and display-space geometry; work bounds exclude reserved
 * UI.
 *
 * @zh 视口标识与显示空间几何；工作区域不包含已预留的界面区域。
 * @ja ビューポート ID と表示座標形状。作業領域は予約済み UI を除きます。
 * @ko 뷰포트 ID와 표시 공간 지오메트리입니다. 작업 영역은 예약된 UI를 제외합니다.
 */
export interface ImGuiViewportFields {
  /**
   * Unsigned ImGuiID identifying this viewport.
   *
   * @zh 标识此视口的无符号 ImGuiID。
   * @ja このビューポートを識別する符号なし ImGuiID。
   * @ko 이 뷰포트를 식별하는 부호 없는 ImGuiID입니다.
   */
  ID: number;
  /**
   * ImGuiViewportFlags describing platform-window capabilities and behavior.
   *
   * @zh 描述平台窗口能力和行为的 ImGuiViewportFlags。
   * @ja プラットフォーム窓の機能と動作を表す ImGuiViewportFlags。
   * @ko 플랫폼 창 기능 및 동작을 나타내는 ImGuiViewportFlags입니다.
   */
  Flags: number;
  /**
   * Viewport left edge in display coordinates.
   *
   * @zh 显示坐标中的视口左边界。
   * @ja 表示座標でのビューポート左端。
   * @ko 표시 좌표의 뷰포트 왼쪽 끝입니다.
   */
  PosX: number;
  /**
   * Viewport top edge in display coordinates.
   *
   * @zh 显示坐标中的视口上边界。
   * @ja 表示座標でのビューポート上端。
   * @ko 표시 좌표의 뷰포트 위쪽 끝입니다.
   */
  PosY: number;
  /**
   * Viewport width in display pixels, before framebuffer scaling.
   *
   * @zh 帧缓冲缩放前的视口显示像素宽度。
   * @ja フレームバッファ倍率適用前のビューポート表示画素幅。
   * @ko 프레임버퍼 배율 적용 전 뷰포트의 표시 픽셀 너비입니다.
   */
  SizeX: number;
  /**
   * Viewport height in display pixels, before framebuffer scaling.
   *
   * @zh 帧缓冲缩放前的视口显示像素高度。
   * @ja フレームバッファ倍率適用前のビューポート表示画素高。
   * @ko 프레임버퍼 배율 적용 전 뷰포트의 표시 픽셀 높이입니다.
   */
  SizeY: number;
  /**
   * Usable work-area left edge in display coordinates.
   *
   * @zh 显示坐标中的可用工作区域左边界。
   * @ja 表示座標での使用可能な作業領域の左端。
   * @ko 표시 좌표의 사용 가능한 작업 영역 왼쪽 끝입니다.
   */
  WorkPosX: number;
  /**
   * Usable work-area top edge, below a reserved main menu bar if present.
   *
   * @zh 可用工作区域上边界；如有预留主菜单栏，则位于其下方。
   * @ja 作業領域の上端。主メニューバーの予約があればその下です。
   * @ko 작업 영역 위쪽 끝입니다. 예약된 주 메뉴 바가 있으면 그 아래입니다.
   */
  WorkPosY: number;
  /**
   * Usable width in display pixels after reserved UI areas are removed.
   *
   * @zh 扣除预留界面区域后的可用显示像素宽度。
   * @ja 予約済み UI を除いた使用可能な表示画素幅。
   * @ko 예약된 UI 영역을 제외한 사용 가능한 표시 픽셀 너비입니다.
   */
  WorkSizeX: number;
  /**
   * Usable height in display pixels after reserved UI areas are removed.
   *
   * @zh 扣除预留界面区域后的可用显示像素高度。
   * @ja 予約済み UI を除いた使用可能な表示画素高。
   * @ko 예약된 UI 영역을 제외한 사용 가능한 표시 픽셀 높이입니다.
   */
  WorkSizeY: number;
}

/**
 * Access native viewport identity and display/work-area geometry.
 *
 * @zh 访问原生视口标识及显示区域、工作区域几何。
 * @ja ネイティブのビューポート ID と表示・作業領域の形状にアクセスします。
 * @ko 네이티브 뷰포트 ID 및 표시 영역과 작업 영역 지오메트리에 접근합니다.
 * @param handle - Borrowed viewport; its context and viewport must remain
 * alive.
 * @zh handle - 借用视口；所属上下文和视口必须保持存活。
 * @ja handle - 借用ビューポート。コンテキストとビューポートの存続が必要。
 * @ko handle - 빌린 뷰포트입니다. 컨텍스트와 뷰포트가 살아 있어야 합니다.
 * @returns Live fields; writing geometry alone does not move an OS window.
 * @zh 实时字段；仅写入几何信息不会移动操作系统窗口。
 * @ja ライブフィールド。形状値を書き換えるだけでは OS の窓は移動しません。
 * @ko 실시간 필드입니다. 지오메트리만 써서는 OS 창이 이동하지 않습니다.
 */
export function viewImGuiViewport(handle: ImGuiViewport): ImGuiViewportFields {
  return writableStruct<ImGuiViewportFields>(native.viewImGuiViewport(handle));
}
