/**
 * Native memory regions and scalar layouts used to construct struct accessors.
 *
 * @zh 用于构建结构体访问器的原生内存区域和标量布局。
 * @ja 構造体アクセサーを構築するネイティブ領域とスカラー配置情報。
 * @ko 구조체 접근자를 만드는 네이티브 메모리 영역과 스칼라 배치 정보입니다.
 */
export interface NativeStructMapping {
  /**
   * Shared native regions, not byte copies; the native owner must stay alive.
   *
   * @zh 共享原生区域而非字节副本；须保持原生所有者存活。
   * @ja バイトの複製ではなく共有領域。ネイティブ所有者の存続が必要です。
   * @ko 바이트 복사본이 아닌 공유 영역입니다. 네이티브 소유자가 살아 있어야 합니다.
   */
  buffers: ArrayBuffer[];
  /**
   * Property name to [scalar encoding, buffers index, byte offset] mapping.
   *
   * @zh 属性名到 [标量编码、buffers 索引、字节偏移] 的映射。
   * @ja プロパティー名から [スカラー形式、buffers 番号、バイト位置] への対応。
   * @ko 속성 이름을 [스칼라 형식, buffers 인덱스, 바이트 오프셋]에 대응시킵니다.
   */
  fields: Record<string, readonly [string, number, number]>;
}

declare const structBrand: unique symbol;

/**
 * Opaque draw command, borrowed from a draw list or a rendering callback.
 *
 * @zh 从绘制列表或渲染回调借用的绘制命令句柄。
 * @ja 描画リストまたは描画コールバックから借用する描画命令ハンドル。
 * @ko 그리기 목록 또는 렌더링 콜백에서 빌린 그리기 명령 핸들입니다.
 *
 * @remarks
 * Callback handles from owning clones retain the clone. Commands and their
 * views still expire if the list clears or reallocates its command buffer.
 * @zh 拥有内存的副本所产生的回调句柄会保留副本。列表清空或重新分配命令缓冲区时，
 * 命令及其视图仍会失效。
 * @ja 所有する複製のコールバックハンドルは複製を保持します。ただし、命令バッファーの
 * 消去・再割り当てにより命令とそのビューは無効になります。
 * @ko 소유 복사본의 콜백 핸들은 복사본을 보유합니다. 목록이 명령 버퍼를 지우거나
 * 재할당하면 명령과 뷰는 무효화됩니다.
 */
export type ImDrawCmd = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImDrawCmd';
};

/**
 * Opaque frame draw data; borrowed results expire at the next NewFrame().
 *
 * @zh 帧绘制数据句柄；借用结果在下一次 NewFrame() 时失效。
 * @ja フレーム描画データ。借用した結果は次の NewFrame() で無効になります。
 * @ko 프레임 그리기 데이터입니다. 빌린 결과는 다음 NewFrame()에서 만료됩니다.
 */
export type ImDrawData = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImDrawData';
};

/**
 * Opaque command and geometry buffer; window-owned lists are frame-local.
 *
 * @zh 命令与几何缓冲区句柄；窗口拥有的列表只适用于当前帧。
 * @ja 命令と頂点バッファのハンドル。ウィンドウ所有のリストは現在のフレーム用です。
 * @ko 명령 및 지오메트리 버퍼 핸들입니다. 창 소유 목록은 현재 프레임용입니다.
 *
 * @remarks
 * ImDrawList_CloneOutput results own their buffers. Handles, mapped
 * views/buffers, and
 * draw data populated by ImDrawData_AddDrawList share that ownership until
 * released.
 * @zh ImDrawList_CloneOutput 的结果拥有其缓冲区。句柄、映射视图/缓冲区以及通过
 * ImDrawData_AddDrawList 引用它的绘制数据共享所有权，直到各自释放。
 * @ja ImDrawList_CloneOutput の結果はバッファーを所有します。ハンドル、マッピングビュー/
 * バッファー、ImDrawData_AddDrawList の追加先が、解放されるまで所有権を共有します。
 * @ko ImDrawList_CloneOutput 결과는 버퍼를 소유합니다. 핸들, 매핑 뷰/버퍼,
 * ImDrawData_AddDrawList로
 * 참조하는 그리기 데이터는 해제될 때까지 소유권을 공유합니다.
 */
export type ImDrawList = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImDrawList';
};

/**
 * Borrowed drawing configuration shared by lists in an ImGui context.
 *
 * @zh 从 ImGui 上下文借用的绘制列表共享配置。
 * @ja ImGui コンテキスト内の描画リストが共有する借用設定。
 * @ko ImGui 컨텍스트의 그리기 목록들이 공유하는 빌린 설정입니다.
 */
export type ImDrawListSharedData = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImDrawListSharedData';
};

/**
 * Opaque helper that splits and merges draw-list channels.
 *
 * @zh 用于拆分和合并绘制列表通道的辅助句柄。
 * @ja 描画リストのチャンネルを分割・結合するヘルパーのハンドル。
 * @ko 그리기 목록 채널을 분할하고 병합하는 도우미 핸들입니다.
 */
export type ImDrawListSplitter = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImDrawListSplitter';
};

/**
 * Opaque font; atlas-returned fonts are borrowed until the atlas clears fonts.
 *
 * @zh 字体句柄；图集返回的字体为借用数据，图集清空字体后失效。
 * @ja フォントハンドル。アトラスから借用したものはフォントのクリアで無効になります。
 * @ko 폰트 핸들입니다. 아틀라스에서 빌린 폰트는 폰트 목록을 비우면 무효합니다.
 */
export type ImFont = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImFont';
};

/**
 * Opaque atlas of rasterized fonts; context-returned atlases are borrowed.
 *
 * @zh 光栅化字体图集句柄；上下文返回的图集为借用对象。
 * @ja ラスタライズ済みフォントのアトラス。コンテキストからの戻り値は借用です。
 * @ko 래스터화된 폰트 아틀라스 핸들입니다. 컨텍스트 반환값은 빌린 객체입니다.
 */
export type ImFontAtlas = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImFontAtlas';
};

/**
 * Borrowed atlas packing rectangle; additions or rebuilds may invalidate it.
 *
 * @zh 借用的图集打包矩形；添加矩形或重建图集可能使其失效。
 * @ja 借用したアトラス矩形。矩形追加や再構築で無効になる場合があります。
 * @ko 빌린 아틀라스 패킹 사각형입니다. 추가나 재빌드 시 무효화될 수 있습니다.
 */
export type ImFontAtlasCustomRect = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImFontAtlasCustomRect';
};

/**
 * Opaque font-source configuration consumed when adding or building fonts.
 *
 * @zh 添加或构建字体时使用的字体源配置句柄。
 * @ja フォント追加・構築時に使うフォントソース設定のハンドル。
 * @ko 폰트 추가 또는 빌드 시 사용하는 폰트 소스 설정 핸들입니다.
 */
export type ImFontConfig = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImFontConfig';
};

/**
 * Borrowed glyph metrics and atlas coordinates; font rebuilds invalidate it.
 *
 * @zh 借用的字形度量和图集坐标；字体重建后失效。
 * @ja 借用したグリフ寸法とアトラス座標。フォント再構築で無効になります。
 * @ko 빌린 글리프 메트릭과 아틀라스 좌표입니다. 폰트 재빌드 시 만료됩니다.
 */
export type ImFontGlyph = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImFontGlyph';
};

/**
 * Opaque Unicode character set used to build inclusive glyph ranges.
 *
 * @zh 用于构建包含端点的字形范围的 Unicode 字符集句柄。
 * @ja 両端を含むグリフ範囲を構築する Unicode 文字集合のハンドル。
 * @ko 양 끝을 포함하는 글리프 범위를 만드는 Unicode 문자 집합 핸들입니다.
 */
export type ImFontGlyphRangesBuilder = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImFontGlyphRangesBuilder';
};

/**
 * Borrowed context input/output state; invalid after context destruction.
 *
 * @zh 借用的上下文输入输出状态；销毁上下文后失效。
 * @ja コンテキストから借用した入出力状態。コンテキスト破棄後は無効です。
 * @ko 컨텍스트에서 빌린 입출력 상태입니다. 컨텍스트 파괴 후 무효합니다.
 */
export type ImGuiIO = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImGuiIO';
};

/**
 * Text-edit callback state; valid only during the invoking callback.
 *
 * @zh 文本编辑回调状态；仅在当前回调执行期间有效。
 * @ja テキスト編集コールバックの状態。呼び出し中のみ有効です。
 * @ko 텍스트 편집 콜백 상태입니다. 호출 중인 콜백 안에서만 유효합니다.
 */
export type ImGuiInputTextCallbackData = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImGuiInputTextCallbackData';
};

/**
 * Opaque visible-range iterator for evenly spaced, randomly accessible rows.
 *
 * @zh 用于等间距、可随机访问行的可见范围迭代器句柄。
 * @ja 等間隔でランダムアクセス可能な行の表示範囲を求めるイテレーター。
 * @ko 일정 간격의 임의 접근 가능한 행에서 표시 범위를 구하는 반복자입니다.
 */
export type ImGuiListClipper = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImGuiListClipper';
};

/**
 * Borrowed multi-selection requests and state for the current selection scope.
 *
 * @zh 当前多选作用域中借用的选择请求与状态。
 * @ja 現在の複数選択スコープから借用する選択要求と状態。
 * @ko 현재 다중 선택 범위에서 빌린 선택 요청과 상태입니다.
 */
export type ImGuiMultiSelectIO = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImGuiMultiSelectIO';
};

/**
 * Borrowed drag-and-drop payload; do not retain beyond the drag operation.
 *
 * @zh 借用的拖放载荷；不要在拖放操作结束后继续使用。
 * @ja 借用したドラッグ＆ドロップのデータ。操作終了後は使わないでください。
 * @ko 빌린 드래그 앤 드롭 데이터입니다. 드래그 작업 종료 후 사용하지 마세요.
 */
export type ImGuiPayload = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImGuiPayload';
};

/**
 * Borrowed platform services and locale state owned by the ImGui context.
 *
 * @zh ImGui 上下文拥有的、供借用的平台服务与区域设置状态。
 * @ja ImGui コンテキストが所有するプラットフォームサービスとロケール状態。
 * @ko ImGui 컨텍스트 소유의 빌린 플랫폼 서비스와 로캘 상태입니다.
 */
export type ImGuiPlatformIO = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImGuiPlatformIO';
};

/**
 * Opaque selection set that applies multi-select requests to persistent IDs.
 *
 * @zh 将多选请求应用到持久标识符的选择集句柄。
 * @ja 複数選択要求を永続 ID に適用する選択集合のハンドル。
 * @ko 다중 선택 요청을 영속 ID에 적용하는 선택 집합 핸들입니다.
 */
export type ImGuiSelectionBasicStorage = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImGuiSelectionBasicStorage';
};

/**
 * Opaque adapter for applying multi-select requests to application storage.
 *
 * @zh 将多选请求应用到应用自有存储的适配器句柄。
 * @ja アプリ側ストレージに複数選択要求を適用するアダプター。
 * @ko 다중 선택 요청을 앱 저장소에 적용하는 어댑터 핸들입니다.
 */
export type ImGuiSelectionExternalStorage = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImGuiSelectionExternalStorage';
};

/**
 * Opaque ID-keyed native value store; borrowed window storage follows its
 * owner.
 *
 * @zh 按 ID 索引的原生值存储；借用的窗口存储随其所有者失效。
 * @ja ID をキーとするネイティブ値ストア。借用時の寿命は所有者に従います。
 * @ko ID 기반 네이티브 값 저장소입니다. 빌린 창 저장소의 수명은 소유자를 따릅니다.
 */
export type ImGuiStorage = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImGuiStorage';
};

/**
 * Borrowed context styling state, including dimensions, colors and hover rules.
 *
 * @zh 从上下文借用的样式状态，包括尺寸、颜色和悬停规则。
 * @ja 寸法、色、ホバー規則を含む、コンテキストから借用したスタイル状態。
 * @ko 크기, 색상 및 호버 규칙을 포함하는 컨텍스트의 빌린 스타일 상태입니다.
 */
export type ImGuiStyle = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImGuiStyle';
};

/**
 * Borrowed table sorting state; reacquire after table changes or a new frame.
 *
 * @zh 借用的表格排序状态；表格变化或开始新帧后需重新获取。
 * @ja 借用したテーブルソート状態。テーブル変更や新フレーム後は再取得します。
 * @ko 빌린 테이블 정렬 상태입니다. 테이블 변경이나 새 프레임 후 다시 얻으세요.
 */
export type ImGuiTableSortSpecs = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImGuiTableSortSpecs';
};

/**
 * Opaque growable UTF-8 text buffer with a trailing native NUL byte.
 *
 * @zh 带原生 NUL 终止字节的可增长 UTF-8 文本缓冲区句柄。
 * @ja 末尾にネイティブ NUL バイトを持つ、拡張可能な UTF-8 テキストバッファ。
 * @ko 끝에 네이티브 NUL 바이트가 있는 확장 가능한 UTF-8 텍스트 버퍼입니다.
 */
export type ImGuiTextBuffer = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImGuiTextBuffer';
};

/**
 * Opaque comma-separated include/exclude filter; minus-prefixed terms exclude.
 *
 * @zh 逗号分隔的包含/排除过滤器句柄；减号前缀表示排除项。
 * @ja カンマ区切りの包含・除外フィルター。マイナス接頭辞は除外を表します。
 * @ko 쉼표로 구분하는 포함·제외 필터입니다. 빼기 기호로 시작하면 제외합니다.
 */
export type ImGuiTextFilter = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImGuiTextFilter';
};

/**
 * Borrowed viewport geometry; valid while its owning context and viewport live.
 *
 * @zh 借用的视口几何信息；仅在所属上下文和视口存活期间有效。
 * @ja 借用したビューポート形状。所有コンテキストとビューポートの存続中のみ有効。
 * @ko 빌린 뷰포트 지오메트리입니다. 소유 컨텍스트와 뷰포트가 살아 있어야 합니다.
 */
export type ImGuiViewport = {
  /**
   * Compile-time handle discriminator, not a native field.
   *
   * @internal
   */
  readonly [structBrand]: 'ImGuiViewport';
};

/**
 * Two-component input, copied from x/y, a tuple, or two Float32Array elements.
 *
 * @zh 二分量输入，从 x/y 对象、元组或 Float32Array 的前两个元素复制。
 * @ja x/y、タプル、または Float32Array の先頭 2 要素からコピーする入力。
 * @ko x/y 객체, 튜플 또는 Float32Array의 처음 두 요소에서 복사하는 입력입니다.
 */
export type ImVec2Like =
  ImVec2Value | readonly [number, number] | Float32Array;

/**
 * Four-component input, copied by value; colors conventionally use RGBA order.
 *
 * @zh 按值复制的四分量输入；颜色通常按 RGBA 顺序传入。
 * @ja 値としてコピーする 4 成分入力。色は通常 RGBA 順です。
 * @ko 값으로 복사하는 4성분 입력입니다. 색상은 일반적으로 RGBA 순서입니다.
 */
export type ImVec4Like =
  ImVec4Value | readonly [number, number, number, number] | Float32Array;

/**
 * Plain two-component value, not a live view of native memory.
 *
 * @zh 普通二分量值，不是原生内存的实时视图。
 * @ja 通常の 2 成分値。ネイティブメモリーのライブビューではありません。
 * @ko 일반 2성분 값이며 네이티브 메모리의 실시간 뷰가 아닙니다.
 */
export type ImVec2Value = {
  /**
   * Horizontal component; units depend on the receiving API.
   *
   * @zh 水平分量；单位由接收此值的 API 决定。
   * @ja 水平成分。単位は受け取る API に従います。
   * @ko 수평 성분입니다. 단위는 값을 받는 API에 따릅니다.
   */
  x: number;
  /**
   * Vertical component; units depend on the receiving API.
   *
   * @zh 垂直分量；单位由接收此值的 API 决定。
   * @ja 垂直成分。単位は受け取る API に従います。
   * @ko 수직 성분입니다. 단위는 값을 받는 API에 따릅니다.
   */
  y: number;
};

/**
 * Plain four-component value; commonly RGBA, with channels from zero to one.
 *
 * @zh 普通四分量值；通常表示 RGBA，各通道范围为零到一。
 * @ja 通常の 4 成分値。色の場合は RGBA で、各チャンネルは 0 から 1 です。
 * @ko 일반 4성분 값입니다. 보통 RGBA이며 채널 범위는 0에서 1입니다.
 */
export type ImVec4Value = {
  /**
   * First component, or red when used as a color.
   *
   * @zh 第一分量；用于颜色时表示红色。
   * @ja 第 1 成分。色の場合は赤です。
   * @ko 첫 번째 성분이며 색상에서는 빨강입니다.
   */
  x: number;
  /**
   * Second component, or green when used as a color.
   *
   * @zh 第二分量；用于颜色时表示绿色。
   * @ja 第 2 成分。色の場合は緑です。
   * @ko 두 번째 성분이며 색상에서는 초록입니다.
   */
  y: number;
  /**
   * Third component, or blue when used as a color.
   *
   * @zh 第三分量；用于颜色时表示蓝色。
   * @ja 第 3 成分。色の場合は青です。
   * @ko 세 번째 성분이며 색상에서는 파랑입니다.
   */
  z: number;
  /**
   * Fourth component, or alpha when used as a color.
   *
   * @zh 第四分量；用于颜色时表示透明度。
   * @ja 第 4 成分。色の場合はアルファです。
   * @ko 네 번째 성분이며 색상에서는 알파입니다.
   */
  w: number;
};
