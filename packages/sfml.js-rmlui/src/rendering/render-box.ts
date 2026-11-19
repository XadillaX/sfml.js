import { native, type NativeRenderBox } from '../internal/native';
import type { VariantVector2 } from '../values/types';

/**
 * Rml::EdgeSizes: top, right, bottom, left.
 *
 * @zh Rml::EdgeSizes：上、右、下、左。
 * @ja Rml::EdgeSizes。上、右、下、左の順。
 * @ko Rml::EdgeSizes이며 위, 오른쪽, 아래, 왼쪽 순서입니다.
 */
export type EdgeSizes = [ number, number, number, number ];

/**
 * Rml::CornerSizes: top-left, top-right, bottom-right, bottom-left.
 *
 * @zh Rml::CornerSizes：左上、右上、右下、左下。
 * @ja Rml::CornerSizes。左上、右上、右下、左下の順。
 * @ko Rml::CornerSizes이며 왼쪽 위, 오른쪽 위, 오른쪽 아래, 왼쪽 아래 순서입니다.
 */
export type CornerSizes = [ number, number, number, number ];

const boxes = new WeakMap<RenderBox, NativeRenderBox>();

/**
 * Resolve a native RenderBox value.
 *
 * @internal
 * @param box - Value wrapper.
 * @returns Checked native handle.
 */
function handle(box: RenderBox): object {
  const value = boxes.get(box);
  if (!value) {
    throw new TypeError('Expected a RenderBox');
  }
  return value.handle;
}

/**
 * Independent Rml::RenderBox with writable native numerical views.
 *
 * @zh 独立的 Rml::RenderBox，包含可写原生数值视图。
 * @ja 書き込み可能な数値ビューを持つ独立した Rml::RenderBox。
 * @ko 쓰기 가능한 네이티브 숫자 뷰를 가진 독립적인 Rml::RenderBox입니다.
 * @remarks
 * Element queries return a copy. Views retain only this native value and stay
 * usable after element destruction, wrapper collection and runtime shutdown.
 * Non-finite shared fields are rejected by native queries.
 * @zh 元素查询返回副本。视图只保活原生数值，在元素销毁、包装器回收及运行时
 * 关闭后仍可访问。原生查询会拒绝共享字段中的非有限值。
 * @ja 要素からはコピーを取得します。ビューは値のみを保持し、要素・ラッパー・
 * ランタイムの終了後も使用できます。非有限値は取得時に拒否されます。
 * @ko 요소 조회는 복사본을 반환합니다. 뷰는 값만 유지하여 요소 파괴, 래퍼 수거 및
 * 런타임 종료 후에도 사용할 수 있습니다. 조회 시 유한하지 않은 값은 거부합니다.
 */
export class RenderBox {
  /**
   * Construct the native rendering box.
   *
   * @zh 构造原生渲染盒。
   * @ja ネイティブ描画ボックスを構築します。
   * @ko 네이티브 렌더링 상자를 생성합니다.
   * @param fillSize - Fill-area size.
   * @zh fillSize - 填充区域尺寸。
   * @ja fillSize - 塗りつぶし領域のサイズ。
   * @ko fillSize - 채움 영역 크기입니다.
   * @param borderOffset - Border-area offset.
   * @zh borderOffset - 边框区域偏移。
   * @ja borderOffset - ボーダー領域のオフセット。
   * @ko borderOffset - 테두리 영역 오프셋입니다.
   * @param borderWidths - Top, right, bottom, left widths.
   * @zh borderWidths - 上、右、下、左的宽度。
   * @ja borderWidths - 上、右、下、左の幅。
   * @ko borderWidths - 위, 오른쪽, 아래, 왼쪽 너비입니다.
   * @param borderRadius - Top-left, top-right, bottom-right, bottom-left radii.
   * @zh borderRadius - 左上、右上、右下、左下的半径。
   * @ja borderRadius - 左上、右上、右下、左下の半径。
   * @ko borderRadius - 왼쪽 위, 오른쪽 위, 오른쪽 아래, 왼쪽 아래 반지름입니다.
   */
  constructor(
    fillSize: VariantVector2, borderOffset: VariantVector2,
    borderWidths: EdgeSizes, borderRadius: CornerSizes,
  ) {
    boxes.set(this, native.createRenderBox(
      fillSize, borderOffset, borderWidths, borderRadius));
  }

  /**
   * Shared fill size in x, y order.
   *
   * @zh 按 x、y 排列的共享填充尺寸。
   * @ja x、y 順の共有塗りつぶしサイズ。
   * @ko x, y 순서의 공유 채움 크기입니다.
   * @returns Writable native view.
   * @zh 可写原生视图。
   * @ja 書き込み可能なネイティブビュー。
   * @ko 쓰기 가능한 네이티브 뷰입니다.
   */
  get fillSize(): Float32Array {
    return boxes.get(this)!.fillSize;
  }

  /**
   * Shared border offset in x, y order.
   *
   * @zh 按 x、y 排列的共享边框偏移。
   * @ja x、y 順の共有ボーダーオフセット。
   * @ko x, y 순서의 공유 테두리 오프셋입니다.
   * @returns Writable native view.
   * @zh 可写原生视图。
   * @ja 書き込み可能なネイティブビュー。
   * @ko 쓰기 가능한 네이티브 뷰입니다.
   */
  get borderOffset(): Float32Array {
    return boxes.get(this)!.borderOffset;
  }

  /**
   * Shared widths in top, right, bottom, left order.
   *
   * @zh 按上、右、下、左排列的共享宽度。
   * @ja 上、右、下、左の順の共有幅。
   * @ko 위, 오른쪽, 아래, 왼쪽 순서의 공유 너비입니다.
   * @returns Four writable native floats.
   * @zh 4 个可写原生浮点数。
   * @ja 4 個の書き込み可能なネイティブ浮動小数点数。
   * @ko 쓰기 가능한 네이티브 실수 4개입니다.
   */
  get borderWidths(): Float32Array {
    return boxes.get(this)!.borderWidths;
  }

  /**
   * Shared radii in top-left, top-right, bottom-right, bottom-left order.
   *
   * @zh 按左上、右上、右下、左下排列的共享半径。
   * @ja 左上、右上、右下、左下の順の共有半径。
   * @ko 왼쪽 위, 오른쪽 위, 오른쪽 아래, 왼쪽 아래 순서의 공유 반지름입니다.
   * @returns Four writable native floats.
   * @zh 4 个可写原生浮点数。
   * @ja 4 個の書き込み可能なネイティブ浮動小数点数。
   * @ko 쓰기 가능한 네이티브 실수 4개입니다.
   */
  get borderRadius(): Float32Array {
    return boxes.get(this)!.borderRadius;
  }

  /**
   * Copy this Rml::RenderBox into independent native storage.
   *
   * @zh 将 Rml::RenderBox 复制到独立原生存储。
   * @ja Rml::RenderBox を独立したネイティブ領域へコピーします。
   * @ko Rml::RenderBox를 독립적인 네이티브 저장소에 복사합니다.
   * @returns Independent rendering box.
   * @zh 独立渲染盒。
   * @ja 独立した描画ボックス。
   * @ko 독립적인 렌더링 상자입니다.
   */
  clone(): RenderBox {
    return renderBoxFromNative(native.cloneRenderBox(handle(this)));
  }

  /**
   * Native GetFillSize snapshot.
   *
   * @zh 原生 GetFillSize 快照。
   * @ja ネイティブ GetFillSize のコピー。
   * @ko 네이티브 GetFillSize 복사본입니다.
   * @returns Fill-area size.
   * @zh 填充区域尺寸。
   * @ja 塗りつぶし領域のサイズ。
   * @ko 채움 영역 크기입니다.
   */
  getFillSize(): VariantVector2 {
    return native.renderBoxGetFillSize(handle(this));
  }

  /**
   * Native SetFillSize, updating the shared view.
   *
   * @zh 原生 SetFillSize，同时更新共享视图。
   * @ja 共有ビューを更新するネイティブ SetFillSize。
   * @ko 공유 뷰를 갱신하는 네이티브 SetFillSize입니다.
   * @param value - Finite fill-area size.
   * @zh value - 有限的填充区域尺寸。
   * @ja value - 有限の塗りつぶし領域サイズ。
   * @ko value - 유한한 채움 영역 크기입니다.
   */
  setFillSize(value: VariantVector2): void {
    native.renderBoxSetFillSize(handle(this), value);
  }

  /**
   * Native GetFillOffset: left and top border widths.
   *
   * @zh 原生 GetFillOffset：左边框和上边框宽度。
   * @ja ネイティブ GetFillOffset。左と上のボーダー幅。
   * @ko 네이티브 GetFillOffset이며 왼쪽 및 위쪽 테두리 너비입니다.
   * @returns Offset from border area to fill area.
   * @zh 从边框区域到填充区域的偏移。
   * @ja ボーダー領域から塗りつぶし領域へのオフセット。
   * @ko 테두리 영역에서 채움 영역까지의 오프셋입니다.
   */
  getFillOffset(): VariantVector2 {
    return native.renderBoxGetFillOffset(handle(this));
  }

  /**
   * Native GetBorderOffset snapshot.
   *
   * @zh 原生 GetBorderOffset 快照。
   * @ja ネイティブ GetBorderOffset のコピー。
   * @ko 네이티브 GetBorderOffset 복사본입니다.
   * @returns Border-area offset.
   * @zh 边框区域偏移。
   * @ja ボーダー領域のオフセット。
   * @ko 테두리 영역 오프셋입니다.
   */
  getBorderOffset(): VariantVector2 {
    return native.renderBoxGetBorderOffset(handle(this));
  }

  /**
   * Native SetBorderOffset, updating the shared view.
   *
   * @zh 原生 SetBorderOffset，同时更新共享视图。
   * @ja 共有ビューを更新するネイティブ SetBorderOffset。
   * @ko 공유 뷰를 갱신하는 네이티브 SetBorderOffset입니다.
   * @param value - Finite border-area offset.
   * @zh value - 有限的边框区域偏移。
   * @ja value - 有限のボーダー領域オフセット。
   * @ko value - 유한한 테두리 영역 오프셋입니다.
   */
  setBorderOffset(value: VariantVector2): void {
    native.renderBoxSetBorderOffset(handle(this), value);
  }

  /**
   * Native GetBorderWidths snapshot.
   *
   * @zh 原生 GetBorderWidths 快照。
   * @ja ネイティブ GetBorderWidths のコピー。
   * @ko 네이티브 GetBorderWidths 복사본입니다.
   * @returns Top, right, bottom, left widths.
   * @zh 上、右、下、左的宽度。
   * @ja 上、右、下、左の幅。
   * @ko 위, 오른쪽, 아래, 왼쪽 너비입니다.
   */
  getBorderWidths(): EdgeSizes {
    return native.renderBoxGetBorderWidths(handle(this));
  }

  /**
   * Native SetBorderWidths, updating the shared view.
   *
   * @zh 原生 SetBorderWidths，同时更新共享视图。
   * @ja 共有ビューを更新するネイティブ SetBorderWidths。
   * @ko 공유 뷰를 갱신하는 네이티브 SetBorderWidths입니다.
   * @param value - Four finite edge widths in native order.
   * @zh value - 按原生顺序排列的 4 个有限边宽。
   * @ja value - ネイティブ順の 4 個の有限な辺幅。
   * @ko value - 네이티브 순서의 유한한 가장자리 너비 4개입니다.
   */
  setBorderWidths(value: EdgeSizes): void {
    native.renderBoxSetBorderWidths(handle(this), value);
  }

  /**
   * Native GetBorderRadius snapshot.
   *
   * @zh 原生 GetBorderRadius 快照。
   * @ja ネイティブ GetBorderRadius のコピー。
   * @ko 네이티브 GetBorderRadius 복사본입니다.
   * @returns Top-left, top-right, bottom-right, bottom-left radii.
   * @zh 左上、右上、右下、左下的半径。
   * @ja 左上、右上、右下、左下の半径。
   * @ko 왼쪽 위, 오른쪽 위, 오른쪽 아래, 왼쪽 아래 반지름입니다.
   */
  getBorderRadius(): CornerSizes {
    return native.renderBoxGetBorderRadius(handle(this));
  }

  /**
   * Native SetBorderRadius, updating the shared view.
   *
   * @zh 原生 SetBorderRadius，同时更新共享视图。
   * @ja 共有ビューを更新するネイティブ SetBorderRadius。
   * @ko 공유 뷰를 갱신하는 네이티브 SetBorderRadius입니다.
   * @param value - Four finite corner radii in native order.
   * @zh value - 按原生顺序排列的 4 个有限圆角半径。
   * @ja value - ネイティブ順の 4 個の有限な角半径。
   * @ko value - 네이티브 순서의 유한한 모서리 반지름 4개입니다.
   */
  setBorderRadius(value: CornerSizes): void {
    native.renderBoxSetBorderRadius(handle(this), value);
  }

  /**
   * Native Rml::RenderBox equality.
   *
   * @zh 原生 Rml::RenderBox 相等比较。
   * @ja ネイティブ Rml::RenderBox 等価比較。
   * @ko 네이티브 Rml::RenderBox 동등 비교입니다.
   * @param other - Rendering box to compare.
   * @zh other - 待比较的渲染盒。
   * @ja other - 比較する描画ボックス。
   * @ko other - 비교할 렌더링 상자입니다.
   * @returns Native operator== result.
   * @zh 原生 operator== 结果。
   * @ja ネイティブ operator== の結果。
   * @ko 네이티브 operator== 결과입니다.
   */
  equals(other: RenderBox): boolean {
    return native.renderBoxEquals(handle(this), handle(other));
  }

  /**
   * Native Rml::RenderBox inequality.
   *
   * @zh 原生 Rml::RenderBox 不等比较。
   * @ja ネイティブ Rml::RenderBox 非等価比較。
   * @ko 네이티브 Rml::RenderBox 비동등 비교입니다.
   * @param other - Rendering box to compare.
   * @zh other - 待比较的渲染盒。
   * @ja other - 比較する描画ボックス。
   * @ko other - 비교할 렌더링 상자입니다.
   * @returns Native operator!= result.
   * @zh 原生 operator!= 结果。
   * @ja ネイティブ operator!= の結果。
   * @ko 네이티브 operator!= 결과입니다.
   */
  notEquals(other: RenderBox): boolean {
    return native.renderBoxNotEquals(handle(this), handle(other));
  }
}

/**
 * Wrap an existing native value snapshot.
 *
 * @internal
 * @param value - Native value mapping.
 * @returns Independent wrapper.
 */
export function renderBoxFromNative(value: NativeRenderBox): RenderBox {
  const box = Object.create(RenderBox.prototype) as RenderBox;
  boxes.set(box, value);
  return box;
}

/**
 * Resolve an owned rendering-box token for native utility consumers.
 *
 * @internal
 * @param box - Public rendering box.
 * @returns Checked native token.
 */
export function renderBoxHandle(box: RenderBox): object {
  return handle(box);
}
