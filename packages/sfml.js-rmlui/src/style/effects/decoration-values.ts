import type { Unit } from '../../values/unit';

/**
 * Copied Rml::NumericValue fields; no shared buffer or runtime owner.
 *
 * @zh Rml::NumericValue 字段副本，不包含共享缓冲区或运行时引用。
 * @ja 共有バッファーやランタイム参照を持たない Rml::NumericValue のコピー。
 * @ko 공유 버퍼나 런타임 참조가 없는 Rml::NumericValue 필드 복사본입니다.
 */
export interface NumericValueSnapshot {
  /**
   * Finite native float32 value.
   *
   * @zh 有限的原生 float32 数值。
   * @ja 有限のネイティブ float32 値。
   * @ko 유한한 네이티브 float32 값입니다.
   */
  number: number;

  /**
   * Original native unit, including UNKNOWN for an omitted position.
   *
   * @zh 原生单位，省略停靠位置时为 UNKNOWN。
   * @ja 元の単位。位置省略時は UNKNOWN。
   * @ko 원래 단위이며 위치가 생략되면 UNKNOWN입니다.
   */
  unit: Unit;
}

/**
 * Rml::ColourbPremultiplied bytes, already multiplied by alpha.
 *
 * @zh Rml::ColourbPremultiplied 字节值，RGB 已乘以 alpha。
 * @ja RGB にアルファを乗算済みの Rml::ColourbPremultiplied バイト値。
 * @ko RGB에 알파를 곱한 Rml::ColourbPremultiplied 바이트 값입니다.
 * @remarks
 * All channels are integers in [0, 255]. Reading and assigning these bytes
 * performs no multiplication or division, avoiding lossy alpha round trips.
 * This tag is valid inside decoration values, not as a standalone Variant.
 * @zh 各通道为 [0, 255] 内的整数。读写不进行乘除，避免透明度往返造成精度损失。
 * 此标签仅用于装饰值内部，不能作为独立 Variant。
 * @ja 各チャンネルは [0, 255] の整数。読み書き時に乗除算せず精度を保ちます。
 * このタグは装飾値内部専用で、単独の Variant には使えません。
 * @ko 각 채널은 [0, 255] 정수입니다. 읽기와 대입에 곱셈이나 나눗셈을 하지 않습니다.
 * 이 태그는 장식 값 내부 전용이며 독립 Variant로 사용할 수 없습니다.
 */
export interface PremultipliedColour {
  /**
   * Explicit premultiplied byte format.
   *
   * @zh 明确指定预乘字节格式。
   * @ja 乗算済みバイト形式。
   * @ko 알파를 곱한 바이트 형식입니다.
   */
  type: 'colourb-premultiplied';

  /**
   * Red byte.
   *
   * @zh 红色字节。
   * @ja 赤のバイト値。
   * @ko 빨강 바이트입니다.
   */
  red: number;

  /**
   * Green byte.
   *
   * @zh 绿色字节。
   * @ja 緑のバイト値。
   * @ko 초록 바이트입니다.
   */
  green: number;

  /**
   * Blue byte.
   *
   * @zh 蓝色字节。
   * @ja 青のバイト値。
   * @ko 파랑 바이트입니다.
   */
  blue: number;

  /**
   * Alpha byte.
   *
   * @zh 透明度字节。
   * @ja アルファのバイト値。
   * @ko 알파 바이트입니다.
   */
  alpha: number;
}

/**
 * Copied Rml::ColorStop, with the unresolved position unit.
 *
 * @zh Rml::ColorStop 副本，保留未解析的位置单位。
 * @ja 位置の未解決単位を保持する Rml::ColorStop のコピー。
 * @ko 위치의 미해결 단위를 유지하는 Rml::ColorStop 복사본입니다.
 */
export interface ColorStop {
  /**
   * Native premultiplied color.
   *
   * @zh 原生预乘颜色。
   * @ja ネイティブ乗算済み色。
   * @ko 네이티브 알파 사전 곱셈 색상입니다.
   */
  color: PremultipliedColour;

  /**
   * Unresolved position; UNKNOWN preserves an omitted RCSS position.
   *
   * @zh 未解析位置；UNKNOWN 表示 RCSS 中省略的位置。
   * @ja 未解決位置。UNKNOWN は RCSS の省略位置です。
   * @ko 미해결 위치이며 UNKNOWN은 RCSS에서 생략된 위치입니다.
   */
  position: NumericValueSnapshot;
}

/**
 * Tagged Rml::ColorStopList snapshot, preserving native order.
 *
 * @zh 带类型标签的 Rml::ColorStopList 快照，保留原生顺序。
 * @ja ネイティブ順序を保持する型タグ付き Rml::ColorStopList スナップショット。
 * @ko 네이티브 순서를 유지하는 형식 태그가 있는 Rml::ColorStopList 스냅샷입니다.
 */
export interface ColorStopList {
  /**
   * Native Variant type discriminator.
   *
   * @zh 原生 Variant 类型标识。
   * @ja ネイティブ Variant の型識別子。
   * @ko 네이티브 Variant 형식 식별자입니다.
   */
  type: 'colorstoplist';

  /**
   * Copied stops; mutating them does not change the original native value.
   *
   * @zh 停靠点副本；修改不会影响原始原生值。
   * @ja 色停止点のコピー。変更は元のネイティブ値に影響しません。
   * @ko 색상 정지점 복사본이며 수정해도 원본 네이티브 값은 바뀌지 않습니다.
   */
  values: ColorStop[];
}

/**
 * Copied Rml::BoxShadow fields; lengths are not resolved to pixels.
 *
 * @zh Rml::BoxShadow 字段副本，长度不转换为像素。
 * @ja 長さをピクセルに解決しない Rml::BoxShadow フィールドのコピー。
 * @ko 길이를 픽셀로 변환하지 않는 Rml::BoxShadow 필드 복사본입니다.
 */
export interface BoxShadow {
  /**
   * Native premultiplied color.
   *
   * @zh 原生预乘颜色。
   * @ja ネイティブ乗算済み色。
   * @ko 네이티브 알파 사전 곱셈 색상입니다.
   */
  color: PremultipliedColour;

  /**
   * Horizontal offset.
   *
   * @zh 水平偏移。
   * @ja 水平オフセット。
   * @ko 가로 오프셋입니다.
   */
  offsetX: NumericValueSnapshot;

  /**
   * Vertical offset.
   *
   * @zh 垂直偏移。
   * @ja 垂直オフセット。
   * @ko 세로 오프셋입니다.
   */
  offsetY: NumericValueSnapshot;

  /**
   * Blur radius.
   *
   * @zh 模糊半径。
   * @ja ぼかし半径。
   * @ko 흐림 반경입니다.
   */
  blurRadius: NumericValueSnapshot;

  /**
   * Spread distance.
   *
   * @zh 扩散距离。
   * @ja 拡張距離。
   * @ko 확산 거리입니다.
   */
  spreadDistance: NumericValueSnapshot;

  /**
   * Whether this is an inner shadow.
   *
   * @zh 是否为内阴影。
   * @ja 内側の影かどうか。
   * @ko 내부 그림자인지 여부입니다.
   */
  inset: boolean;
}

/**
 * Tagged Rml::BoxShadowList snapshot, preserving native order.
 *
 * @zh 带类型标签的 Rml::BoxShadowList 快照，保留原生顺序。
 * @ja ネイティブ順序を保持する型タグ付き Rml::BoxShadowList スナップショット。
 * @ko 네이티브 순서를 유지하는 형식 태그가 있는 Rml::BoxShadowList 스냅샷입니다.
 */
export interface BoxShadowList {
  /**
   * Native Variant type discriminator.
   *
   * @zh 原生 Variant 类型标识。
   * @ja ネイティブ Variant の型識別子。
   * @ko 네이티브 Variant 형식 식별자입니다.
   */
  type: 'boxshadowlist';

  /**
   * Copied shadows; mutating them does not change the original native value.
   *
   * @zh 阴影副本；修改不会影响原始原生值。
   * @ja 影のコピー。変更は元のネイティブ値に影響しません。
   * @ko 그림자 복사본이며 수정해도 원본 네이티브 값은 바뀌지 않습니다.
   */
  values: BoxShadow[];
}
