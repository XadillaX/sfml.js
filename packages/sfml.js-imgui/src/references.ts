import { native } from './internal/native';
import type {
  ImFontAtlas, ImFontGlyphRangesBuilder, ImGuiListClipper,
  ImGuiSelectionBasicStorage, ImGuiStorage, ImGuiTextBuffer,
  ImGuiTextFilter,
} from './types';

/**
 * Atlas texture data view.
 *
 * @zh 字体图集贴图数据视图。
 * @ja アトラステクスチャデータのビュー。
 * @ko 아틀라스 텍스처 데이터 뷰입니다.
 */
export interface FontTextureView {
  /**
   * Borrowed atlas pixels; invalid after texture data is cleared or rebuilt.
   *
   * @zh 借用的图集像素；清除或重建贴图数据后失效。
   * @ja 借用したアトラスのピクセル。テクスチャデータの消去や再構築で無効になります。
   * @ko 빌린 아틀라스 픽셀입니다. 텍스처 데이터를 지우거나 재구성하면 무효화됩니다.
   */
  pixels: Uint8Array;

  /**
   * Atlas texture width in pixels.
   *
   * @zh 图集贴图的像素宽度。
   * @ja アトラステクスチャのピクセル幅です。
   * @ko 아틀라스 텍스처의 픽셀 너비입니다.
   */
  width: number;

  /**
   * Atlas texture height in pixels.
   *
   * @zh 图集贴图的像素高度。
   * @ja アトラステクスチャのピクセル高さです。
   * @ko 아틀라스 텍스처의 픽셀 높이입니다.
   */
  height: number;

  /**
   * Pixel stride in bytes: 1 for Alpha8, 4 for RGBA32.
   *
   * @zh 每像素的字节数：Alpha8 为 1，RGBA32 为 4。
   * @ja ピクセル当たりのバイト数。Alpha8 は 1、RGBA32 は 4 です。
   * @ko 픽셀당 바이트 수입니다. Alpha8은 1, RGBA32는 4입니다.
   */
  bytesPerPixel: number;
}

/**
 * Selected item iteration result.
 *
 * @zh 选中项迭代结果。
 * @ja 選択項目の反復結果。
 * @ko 선택 항목 반복 결과입니다.
 */
export interface SelectedItem {
  /**
   * Selected item ID returned by ImGuiSelectionBasicStorage.
   *
   * @zh ImGuiSelectionBasicStorage 返回的选中项 ID。
   * @ja ImGuiSelectionBasicStorage が返す選択項目の ID です。
   * @ko ImGuiSelectionBasicStorage가 반환한 선택 항목 ID입니다.
   */
  id: number;

  /**
   * Opaque native iterator to pass into the next selection iteration call.
   *
   * @zh 传给下一次选中项迭代调用的不透明原生迭代器。
   * @ja 次の選択項目の反復呼び出しに渡す不透明なネイティブイテレーターです。
   * @ko 다음 선택 항목 반복 호출에 전달할 불투명 네이티브 반복자입니다.
   */
  iterator: bigint;
}

/**
 * Return a writable reference to an int value in ImGuiStorage.
 *
 * @zh 取得 ImGuiStorage 中 int 值的可写引用。
 * @ja ImGuiStorage の int 値への書き込み可能な参照を返す。
 * @ko ImGuiStorage의 int 값에 대한 쓰기 가능 참조를 반환합니다.
 *
 * @remarks
 * The view reads and writes native memory directly. Adding a new key or
 * clearing
 * the storage invalidates it; fetch a new reference before using it again.
 * @zh 视图直接读写原生内存。新增键或清空存储会使其失效；再次使用前须重新获取引用。
 * @ja ビューはネイティブメモリを直接読み書きする。キーの追加やストレージのクリアで
 * 無効になるため、再使用前に参照を取得し直すこと。
 * @ko 뷰는 네이티브 메모리를 직접 읽고 씁니다. 키를 추가하거나 저장소를 비우면
 * 무효화되므로 다시 사용하기 전에 참조를 새로 가져오세요.
 *
 * @param storage - Target storage.
 * @zh storage - 目标存储。
 * @ja storage - 対象のストレージ。
 * @ko storage - 대상 저장소입니다.
 * @param key - Key.
 * @zh key - 键。
 * @ja key - キー。
 * @ko key - 키입니다.
 * @param fallback - Initial value used when the key does not exist.
 * @zh fallback - 键不存在时使用的初始值。
 * @ja fallback - キーが存在しない場合の初期値。
 * @ko fallback - 키가 없을 때 사용하는 초기값입니다.
 * @returns Single-element writable view.
 * @zh 单元素可写视图。
 * @ja 単一要素の書き込み可能ビュー。
 * @ko 단일 요소 쓰기 가능 뷰입니다.
 */
export function Storage_GetIntRef(
  storage: ImGuiStorage, key: number, fallback = 0,
): Int32Array {
  return native.Storage_GetIntRef(storage, key, fallback);
}

/**
 * Return a writable reference to a bool value in ImGuiStorage.
 *
 * @zh 取得 ImGuiStorage 中 bool 值的可写引用。
 * @ja ImGuiStorage の bool 値への書き込み可能な参照を返す。
 * @ko ImGuiStorage의 bool 값에 대한 쓰기 가능 참조를 반환합니다.
 *
 * @remarks
 * The view reads and writes native memory directly. Adding a new key or
 * clearing
 * the storage invalidates it; fetch a new reference before using it again.
 * @zh 视图直接读写原生内存。新增键或清空存储会使其失效；再次使用前须重新获取引用。
 * @ja ビューはネイティブメモリを直接読み書きする。キーの追加やストレージのクリアで
 * 無効になるため、再使用前に参照を取得し直すこと。
 * @ko 뷰는 네이티브 메모리를 직접 읽고 씁니다. 키를 추가하거나 저장소를 비우면
 * 무효화되므로 다시 사용하기 전에 참조를 새로 가져오세요.
 *
 * @param storage - Target storage.
 * @zh storage - 目标存储。
 * @ja storage - 対象のストレージ。
 * @ko storage - 대상 저장소입니다.
 * @param key - Key.
 * @zh key - 键。
 * @ja key - キー。
 * @ko key - 키입니다.
 * @param fallback - Initial value used when the key does not exist.
 * @zh fallback - 键不存在时使用的初始值。
 * @ja fallback - キーが存在しない場合の初期値。
 * @ko fallback - 키가 없을 때 사용하는 초기값입니다.
 * @returns Single-element writable bool view. Write only 0 (false) or 1 (true).
 * @zh 单元素可写 bool 视图；只能写入 0（false）或 1（true）。
 * @ja 単一要素の書き込み可能な bool ビューです。0（false）か 1（true）のみを書き込みます。
 * @ko 단일 요소 쓰기 가능 bool 뷰입니다. 0(false) 또는 1(true)만 쓰세요.
 */
export function Storage_GetBoolRef(
  storage: ImGuiStorage, key: number, fallback = false,
): Uint8Array {
  return native.Storage_GetBoolRef(storage, key, fallback);
}

/**
 * Return a writable reference to a float value in ImGuiStorage.
 *
 * @zh 取得 ImGuiStorage 中 float 值的可写引用。
 * @ja ImGuiStorage の float 値への書き込み可能な参照を返す。
 * @ko ImGuiStorage의 float 값에 대한 쓰기 가능 참조를 반환합니다.
 *
 * @remarks
 * The view reads and writes native memory directly. Adding a new key or
 * clearing
 * the storage invalidates it; fetch a new reference before using it again.
 * @zh 视图直接读写原生内存。新增键或清空存储会使其失效；再次使用前须重新获取引用。
 * @ja ビューはネイティブメモリを直接読み書きする。キーの追加やストレージのクリアで
 * 無効になるため、再使用前に参照を取得し直すこと。
 * @ko 뷰는 네이티브 메모리를 직접 읽고 씁니다. 키를 추가하거나 저장소를 비우면
 * 무효화되므로 다시 사용하기 전에 참조를 새로 가져오세요.
 *
 * @param storage - Target storage.
 * @zh storage - 目标存储。
 * @ja storage - 対象のストレージ。
 * @ko storage - 대상 저장소입니다.
 * @param key - Key.
 * @zh key - 键。
 * @ja key - キー。
 * @ko key - 키입니다.
 * @param fallback - Initial value used when the key does not exist.
 * @zh fallback - 键不存在时使用的初始值。
 * @ja fallback - キーが存在しない場合の初期値。
 * @ko fallback - 키가 없을 때 사용하는 초기값입니다.
 * @returns Single-element writable view.
 * @zh 单元素可写视图。
 * @ja 単一要素の書き込み可能ビュー。
 * @ko 단일 요소 쓰기 가능 뷰입니다.
 */
export function Storage_GetFloatRef(
  storage: ImGuiStorage, key: number, fallback = 0,
): Float32Array {
  return native.Storage_GetFloatRef(storage, key, fallback);
}

/**
 * Return a writable reference to a pointer value in ImGuiStorage.
 *
 * @zh 取得 ImGuiStorage 中指针值的可写引用。
 * @ja ImGuiStorage のポインタ値への書き込み可能な参照を返す。
 * @ko ImGuiStorage의 포인터 값에 대한 쓰기 가능 참조를 반환합니다.
 *
 * @remarks
 * The view reads and writes native memory directly. Adding a new key or
 * clearing
 * the storage invalidates it; fetch a new reference before using it again.
 * @zh 视图直接读写原生内存。新增键或清空存储会使其失效；再次使用前须重新获取引用。
 * @ja ビューはネイティブメモリを直接読み書きする。キーの追加やストレージのクリアで
 * 無効になるため、再使用前に参照を取得し直すこと。
 * @ko 뷰는 네이티브 메모리를 직접 읽고 씁니다. 키를 추가하거나 저장소를 비우면
 * 무효화되므로 다시 사용하기 전에 참조를 새로 가져오세요.
 *
 * @param storage - Target storage.
 * @zh storage - 目标存储。
 * @ja storage - 対象のストレージ。
 * @ko storage - 대상 저장소입니다.
 * @param key - Key.
 * @zh key - 键。
 * @ja key - キー。
 * @ko key - 키입니다.
 * @param fallback - Initial value used when the key does not exist.
 * @zh fallback - 键不存在时使用的初始值。
 * @ja fallback - キーが存在しない場合の初期値。
 * @ko fallback - 키가 없을 때 사용하는 초기값입니다.
 * @returns Single-element writable view.
 * @zh 单元素可写视图。
 * @ja 単一要素の書き込み可能ビュー。
 * @ko 단일 요소 쓰기 가능 뷰입니다.
 */
export function Storage_GetVoidPtrRef(
  storage: ImGuiStorage, key: number, fallback: bigint | null = null,
): BigUint64Array | Uint32Array {
  return native.Storage_GetVoidPtrRef(storage, key, fallback);
}

/**
 * Return the alpha8 texture data of the font atlas without copying.
 *
 * @zh 不拷贝地取得字体图集的 alpha8 贴图数据。
 * @ja フォントアトラスの alpha8 テクスチャデータをコピーせずに返す。
 * @ko 글꼴 아틀라스의 alpha8 텍스처 데이터를 복사 없이 반환합니다.
 *
 * @remarks
 * Builds the atlas on demand. The view points into atlas memory; do not use it
 * after clearing texture data or rebuilding fonts. Fetch a new view instead.
 * @zh 图集会按需构建。视图指向图集内存；清除贴图数据或重建字体后，
 * 不得继续使用旧视图，须重新获取。
 * @ja アトラスは必要に応じて構築される。ビューはアトラスのメモリを指すため、
 * テクスチャデータのクリアやフォント再構築後は再取得すること。
 * @ko 아틀라스는 필요할 때 구성됩니다. 뷰는 아틀라스 메모리를 가리키므로
 * 텍스처 데이터를 지우거나 글꼴을 재구성한 뒤에는 새 뷰를 가져오세요.
 *
 * @param atlas - Font atlas.
 * @zh atlas - 字体图集。
 * @ja atlas - フォントアトラス。
 * @ko atlas - 글꼴 아틀라스입니다.
 * @returns Texture view, or null if no pixel data is available.
 * @zh 贴图视图；无可用像素数据时返回 null。
 * @ja テクスチャビュー。ピクセルデータがない場合は null。
 * @ko 텍스처 뷰이며 사용 가능한 픽셀 데이터가 없으면 null입니다.
 */
export function FontAtlas_GetTexDataAsAlpha8(
  atlas: ImFontAtlas,
): FontTextureView | null {
  return native.FontAtlas_GetTexDataAsAlpha8(atlas);
}

/**
 * Return the RGBA32 texture data of the font atlas without copying.
 *
 * @zh 不拷贝地取得字体图集的 RGBA32 贴图数据。
 * @ja フォントアトラスの RGBA32 テクスチャデータをコピーせずに返す。
 * @ko 글꼴 아틀라스의 RGBA32 텍스처 데이터를 복사 없이 반환합니다.
 *
 * @remarks
 * Builds the atlas on demand. The view points into atlas memory; do not use it
 * after clearing texture data or rebuilding fonts. Fetch a new view instead.
 * @zh 图集会按需构建。视图指向图集内存；清除贴图数据或重建字体后，
 * 不得继续使用旧视图，须重新获取。
 * @ja アトラスは必要に応じて構築される。ビューはアトラスのメモリを指すため、
 * テクスチャデータのクリアやフォント再構築後は再取得すること。
 * @ko 아틀라스는 필요할 때 구성됩니다. 뷰는 아틀라스 메모리를 가리키므로
 * 텍스처 데이터를 지우거나 글꼴을 재구성한 뒤에는 새 뷰를 가져오세요.
 *
 * @param atlas - Font atlas.
 * @zh atlas - 字体图集。
 * @ja atlas - フォントアトラス。
 * @ko atlas - 글꼴 아틀라스입니다.
 * @returns Texture view, or null if no pixel data is available.
 * @zh 贴图视图；无可用像素数据时返回 null。
 * @ja テクスチャビュー。ピクセルデータがない場合は null。
 * @ko 텍스처 뷰이며 사용 가능한 픽셀 데이터가 없으면 null입니다.
 */
export function FontAtlas_GetTexDataAsRGBA32(
  atlas: ImFontAtlas,
): FontTextureView | null {
  return native.FontAtlas_GetTexDataAsRGBA32(atlas);
}

/**
 * Build the glyph ranges and return a copy terminated by 0.
 *
 * @zh 构建字形范围，返回以 0 结尾的副本。
 * @ja 字形範囲を構築し、0 で終端されたコピーを返す。
 * @ko 글리프 범위를 구성하고 0으로 종료되는 사본을 반환합니다.
 * @param builder - Populated builder.
 * @zh builder - 已填充的构建器。
 * @ja builder - 内容を設定済みのビルダー。
 * @ko builder - 내용이 채워진 빌더입니다.
 * @returns Range array.
 * @zh 范围数组。
 * @ja 範囲の配列。
 * @ko 범위 배열입니다.
 */
export function FontGlyphRangesBuilder_BuildRanges(
  builder: ImFontGlyphRangesBuilder,
): Uint16Array {
  return native.FontGlyphRangesBuilder_BuildRanges(builder);
}

/**
 * Iterate to the next selected item.
 *
 * @zh 迭代到下一个选中项。
 * @ja 次の選択項目へ反復する。
 * @ko 다음 선택 항목으로 반복합니다.
 * @param storage - Selection set.
 * @zh storage - 选中集合。
 * @ja storage - 選択集合。
 * @ko storage - 선택 집합입니다.
 * @param iterator - Iterator returned by the previous call; pass 0n for the
 * first.
 * @zh iterator - 上一次调用返回的迭代器；首项传 0n。
 * @ja iterator - 前回の呼び出しが返したイテレータ。最初は 0n を渡す。
 * @ko iterator - 이전 호출이 반환한 반복자이며 첫 항목은 0n을 전달합니다.
 * @returns Next item, or null when iteration ends.
 * @zh 下一项；迭代结束时返回 null。
 * @ja 次の項目。反復終了時は null。
 * @ko 다음 항목이며 반복이 끝나면 null입니다.
 */
export function SelectionBasicStorage_GetNextSelectedItem(
  storage: ImGuiSelectionBasicStorage, iterator: bigint,
): SelectedItem | null {
  return native.SelectionBasicStorage_GetNextSelectedItem(storage, iterator);
}

/**
 * Write an HSV color into an RGBA array.
 *
 * @zh 用 HSV 写入 RGBA 颜色数组。
 * @ja HSV 色を RGBA 配列に書き込む。
 * @ko HSV 색상을 RGBA 배열에 씁니다.
 * @param color - RGBA array of length 4, updated in place.
 * @zh color - 长度为 4 的 RGBA 数组，原地更新。
 * @ja color - 長さ 4 の RGBA 配列。その場で更新される。
 * @ko color - 길이가 4인 RGBA 배열이며 그 자리에서 갱신됩니다.
 * @param h - Hue.
 * @zh h - 色相。
 * @ja h - 色相。
 * @ko h - 색상(색조)입니다.
 * @param s - Saturation.
 * @zh s - 饱和度。
 * @ja s - 彩度。
 * @ko s - 채도입니다.
 * @param v - Value.
 * @zh v - 明度。
 * @ja v - 明度。
 * @ko v - 명도입니다.
 * @param a - Alpha.
 * @zh a - 透明度。
 * @ja a - 不透明度。
 * @ko a - 알파(투명도)입니다.
 */
export function ImColor_SetHSV(
  color: Float32Array, h: number, s: number, v: number, a = 1,
): void {
  native.ImColor_SetHSV(color, h, s, v, a);
}

/**
 * Create a glyph range builder.
 *
 * @zh 创建字形范围构建器。
 * @ja 字形範囲ビルダーを作成する。
 * @ko 글리프 범위 빌더를 만듭니다.
 *
 * @remarks
 * The lifetime is managed by the GC, which invokes the C++ destructor.
 * @zh 生命周期由 GC 管理，销毁时调用 C++ 析构函数。
 * @ja ライフタイムは GC が管理し、破棄時に C++ デストラクタを呼ぶ。
 * @ko 수명은 GC가 관리하며 소멸 시 C++ 소멸자를 호출합니다.
 *
 * @returns New builder.
 * @zh 新的构建器。
 * @ja 新しいビルダー。
 * @ko 새 빌더입니다.
 */
export function createFontGlyphRangesBuilder(): ImFontGlyphRangesBuilder {
  return native.createFontGlyphRangesBuilder();
}

/**
 * Create an ImGuiTextBuffer.
 *
 * @zh 创建 ImGuiTextBuffer。
 * @ja ImGuiTextBuffer を作成する。
 * @ko ImGuiTextBuffer를 만듭니다.
 * @returns New text buffer.
 * @zh 新的文本缓冲区。
 * @ja 新しいテキストバッファ。
 * @ko 새 텍스트 버퍼입니다.
 */
export function createTextBuffer(): ImGuiTextBuffer {
  return native.createTextBuffer();
}

/**
 * Create a selection set.
 *
 * @zh 创建选中集合。
 * @ja 選択集合を作成する。
 * @ko 선택 집합을 만듭니다.
 * @returns New selection set.
 * @zh 新的选中集合。
 * @ja 新しい選択集合。
 * @ko 새 선택 집합입니다.
 */
export function createSelectionBasicStorage(): ImGuiSelectionBasicStorage {
  return native.createSelectionBasicStorage();
}

/**
 * Create a list clipper.
 *
 * @zh 创建列表裁剪器。
 * @ja リストクリッパーを作成する。
 * @ko 목록 클리퍼를 만듭니다.
 * @returns New clipper.
 * @zh 新的裁剪器。
 * @ja 新しいクリッパー。
 * @ko 새 클리퍼입니다.
 */
export function createListClipper(): ImGuiListClipper {
  return native.createListClipper();
}

/**
 * Create a text filter.
 *
 * @zh 创建文本过滤器。
 * @ja テキストフィルターを作成する。
 * @ko 텍스트 필터를 만듭니다.
 * @returns New filter.
 * @zh 新的过滤器。
 * @ja 新しいフィルター。
 * @ko 새 필터입니다.
 */
export function createTextFilter(): ImGuiTextFilter {
  return native.createTextFilter();
}
