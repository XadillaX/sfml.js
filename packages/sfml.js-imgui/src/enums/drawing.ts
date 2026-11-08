/**
 * Path closure and rectangle corner selection; rounding requires a radius.
 *
 * @zh 路径闭合与矩形圆角选择；圆角需要指定半径。
 * @ja パス閉鎖と矩形の角選択。角丸には半径指定も必要。
 * @ko 경로 닫기 및 사각형 모서리 선택. 둥글게 하려면 반지름도 필요.
 */
export const ImDrawFlags = Object.freeze({
  /**
   * Open paths; rectangles round all corners when given a positive radius.
   *
   * @zh 路径不闭合；矩形半径为正时默认全部圆角。
   * @ja パスは閉じない。正の半径を持つ矩形は全ての角を丸める。
   * @ko 경로는 열림. 반지름이 양수인 사각형은 모든 모서리를 둥글게 함.
   */
  None: 0,
  /**
   * Connect the last point to the first in
   * ImDrawList_PathStroke/ImDrawList_AddPolyline.
   *
   * @zh ImDrawList_PathStroke/ImDrawList_AddPolyline 将末点连接到起点。
   * @ja ImDrawList_PathStroke/ImDrawList_AddPolyline で終点を始点へ接続する。
   * @ko ImDrawList_PathStroke/ImDrawList_AddPolyline에서 끝점을 시작점에 연결.
   */
  Closed: 1,
  /**
   * Round the rectangle's top-left corner.
   *
   * @zh 矩形左上角圆角。
   * @ja 矩形の左上角を丸める。
   * @ko 사각형 왼쪽 위 모서리를 둥글게 함.
   */
  RoundCornersTopLeft: 16,
  /**
   * Round the rectangle's top-right corner.
   *
   * @zh 矩形右上角圆角。
   * @ja 矩形の右上角を丸める。
   * @ko 사각형 오른쪽 위 모서리를 둥글게 함.
   */
  RoundCornersTopRight: 32,
  /**
   * Round the rectangle's bottom-left corner.
   *
   * @zh 矩形左下角圆角。
   * @ja 矩形の左下角を丸める。
   * @ko 사각형 왼쪽 아래 모서리를 둥글게 함.
   */
  RoundCornersBottomLeft: 64,
  /**
   * Round the rectangle's bottom-right corner.
   *
   * @zh 矩形右下角圆角。
   * @ja 矩形の右下角を丸める。
   * @ko 사각형 오른쪽 아래 모서리를 둥글게 함.
   */
  RoundCornersBottomRight: 128,
  /**
   * Explicitly disable every rounded corner, even with a positive radius.
   *
   * @zh 显式禁用全部圆角，即使半径为正；此值不是零。
   * @ja 正の半径でも全角丸を明示的に無効化。ゼロではない。
   * @ko 반지름이 양수여도 모든 둥근 모서리를 명시적으로 금지. 0이 아님.
   */
  RoundCornersNone: 256,
  /**
   * Round both top corners.
   *
   * @zh 上方两角圆角。
   * @ja 上側の二隅を丸める。
   * @ko 위쪽 두 모서리를 둥글게 함.
   */
  RoundCornersTop: 48,
  /**
   * Round both bottom corners.
   *
   * @zh 下方两角圆角。
   * @ja 下側の二隅を丸める。
   * @ko 아래쪽 두 모서리를 둥글게 함.
   */
  RoundCornersBottom: 192,
  /**
   * Round both left corners.
   *
   * @zh 左侧两角圆角。
   * @ja 左側の二隅を丸める。
   * @ko 왼쪽 두 모서리를 둥글게 함.
   */
  RoundCornersLeft: 80,
  /**
   * Round both right corners.
   *
   * @zh 右侧两角圆角。
   * @ja 右側の二隅を丸める。
   * @ko 오른쪽 두 모서리를 둥글게 함.
   */
  RoundCornersRight: 160,
  /**
   * Round all four corners.
   *
   * @zh 全部四角圆角。
   * @ja 四隅全てを丸める。
   * @ko 네 모서리를 모두 둥글게 함.
   */
  RoundCornersAll: 240,
  /**
   * Internal default corner selection: all four corners.
   *
   * @zh 内部默认圆角选择：全部四角。
   * @ja 内部の既定角選択。四隅全て。
   * @ko 내부 기본 모서리 선택. 네 모서리 모두.
   */
  RoundCornersDefault_: 240,
  /**
   * Internal mask of corner selections, including explicit no-rounding.
   *
   * @zh 圆角选择的内部掩码，包含显式禁用圆角位。
   * @ja 明示的な角丸禁止も含む、角選択の内部マスク。
   * @ko 명시적 둥글게 하기 금지를 포함한 모서리 선택 내부 마스크.
   */
  RoundCornersMask_: 496,
} as const);

/**
 * Bitwise combination of path and corner options.
 *
 * @zh 路径与圆角选项的按位组合。
 * @ja パスと角設定のビット組み合わせ。
 * @ko 경로 및 모서리 설정의 비트 조합.
 */
export type ImDrawFlags = number;

/**
 * Draw-list antialiasing and vertex-offset capabilities.
 *
 * @zh 绘制列表的抗锯齿和顶点偏移能力。
 * @ja 描画リストのアンチエイリアスと頂点オフセット能力。
 * @ko 그리기 목록의 안티앨리어싱 및 정점 오프셋 기능.
 */
export const ImDrawListFlags = Object.freeze({
  /**
   * No antialiasing or vertex-offset option.
   *
   * @zh 不启用抗锯齿或顶点偏移选项。
   * @ja アンチエイリアスと頂点オフセットの指定なし。
   * @ko 안티앨리어싱 및 정점 오프셋 설정 없음.
   */
  None: 0,
  /**
   * Antialias lines and borders using additional geometry.
   *
   * @zh 用额外几何数据为线条和边框抗锯齿。
   * @ja 追加ジオメトリで線と枠を滑らかにする。
   * @ko 추가 기하 데이터로 선과 테두리 안티앨리어싱.
   */
  AntiAliasedLines: 1,
  /**
   * Use textures for antialiased lines when possible; requires bilinear
   * filtering.
   *
   * @zh 尽量用纹理对线条抗锯齿；要求双线性过滤。
   * @ja 可能なら線の平滑化にテクスチャを使う。バイリニア補間が必要。
   * @ko 가능하면 선 안티앨리어싱에 텍스처 사용. 이중 선형 필터링 필요.
   */
  AntiAliasedLinesUseTex: 2,
  /**
   * Antialias the outer edges of filled shapes.
   *
   * @zh 为填充形状的外边缘抗锯齿。
   * @ja 塗りつぶし形状の外縁を滑らかにする。
   * @ko 채운 도형의 바깥 가장자리 안티앨리어싱.
   */
  AntiAliasedFill: 4,
  /**
   * Allow nonzero VtxOffset; requires renderer vertex-offset support.
   *
   * @zh 允许非零 VtxOffset；要求渲染后端支持顶点偏移。
   * @ja 非ゼロの VtxOffset を許可。描画側の頂点オフセット対応が必要。
   * @ko 0이 아닌 VtxOffset 허용. 렌더러 정점 오프셋 지원 필요.
   */
  AllowVtxOffset: 8,
} as const);

/**
 * Bitwise combination of draw-list options.
 *
 * @zh 绘制列表选项的按位组合。
 * @ja 描画リスト設定のビット組み合わせ。
 * @ko 그리기 목록 설정의 비트 조합.
 */
export type ImDrawListFlags = number;

/**
 * Font-atlas texture sizing and optional baked resources.
 *
 * @zh 字体图集纹理尺寸和可选烘焙资源。
 * @ja フォントアトラス寸法と任意の焼き込み資源。
 * @ko 글꼴 아틀라스 텍스처 크기 및 선택적 베이크 리소스.
 */
export const ImFontAtlasFlags = Object.freeze({
  /**
   * Build the default atlas with cursor and line resources.
   *
   * @zh 构建包含光标和线条资源的默认图集。
   * @ja カーソルと線の資源を含む標準アトラスを作る。
   * @ko 커서 및 선 리소스를 포함한 기본 아틀라스 생성.
   */
  None: 0,
  /**
   * Do not round texture height up to a power of two.
   *
   * @zh 不将纹理高度向上取整为二的幂。
   * @ja テクスチャ高さを二の累乗に切り上げない。
   * @ko 텍스처 높이를 2의 거듭제곱으로 올림하지 않음.
   */
  NoPowerOfTwoHeight: 1,
  /**
   * Omit software cursor shapes to save atlas space.
   *
   * @zh 省略软件光标形状以节省图集空间。
   * @ja ソフトウェアカーソル形状を省いて領域を節約する。
   * @ko 소프트웨어 커서 모양을 생략해 아틀라스 공간 절약.
   */
  NoMouseCursors: 2,
  /**
   * Omit baked line textures; antialiased lines use geometry instead.
   *
   * @zh 省略烘焙线条纹理，抗锯齿线条改用几何绘制。
   * @ja 線テクスチャを省き、平滑化した線はジオメトリで描画する。
   * @ko 베이크된 선 텍스처를 생략하고 안티앨리어싱 선을 기하 데이터로 그림.
   */
  NoBakedLines: 4,
} as const);

/**
 * Bitwise combination of font-atlas build options.
 *
 * @zh 字体图集构建选项的按位组合。
 * @ja フォントアトラス構築設定のビット組み合わせ。
 * @ko 글꼴 아틀라스 생성 설정의 비트 조합.
 */
export type ImFontAtlasFlags = number;

/**
 * Viewport platform kind and ownership markers.
 *
 * @zh 视口的平台类型和所有权标记。
 * @ja ビューポートのプラットフォーム種別と所有者の印。
 * @ko 뷰포트 플랫폼 종류 및 소유권 표시.
 */
export const ImGuiViewportFlags = Object.freeze({
  /**
   * No platform-kind or ownership markers.
   *
   * @zh 无平台类型或所有权标记。
   * @ja プラットフォーム種別と所有者の指定なし。
   * @ko 플랫폼 종류 및 소유권 표시 없음.
   */
  None: 0,
  /**
   * Viewport represents a platform window.
   *
   * @zh 视口表示平台窗口。
   * @ja プラットフォームのウィンドウを表す。
   * @ko 플랫폼 창을 나타내는 뷰포트.
   */
  IsPlatformWindow: 1,
  /**
   * Reserved monitor-viewport marker; currently unused upstream.
   *
   * @zh 保留的显示器视口标记，上游当前未使用。
   * @ja 予約されたモニタービューポート印。上流では現在未使用。
   * @ko 예약된 모니터 뷰포트 표시. 현재 업스트림에서 미사용.
   */
  IsPlatformMonitor: 2,
  /**
   * Platform window is managed by the application, not the ImGui backend.
   *
   * @zh 平台窗口由应用管理，而非 ImGui 后端。
   * @ja ImGui バックエンドではなくアプリが管理する窓。
   * @ko ImGui 백엔드가 아닌 앱이 관리하는 플랫폼 창.
   */
  OwnedByApp: 4,
} as const);

/**
 * Bitwise combination of viewport-kind and ownership markers.
 *
 * @zh 视口类型和所有权标记的按位组合。
 * @ja ビューポート種別と所有者のビット組み合わせ。
 * @ko 뷰포트 종류 및 소유권 표시의 비트 조합.
 */
export type ImGuiViewportFlags = number;
