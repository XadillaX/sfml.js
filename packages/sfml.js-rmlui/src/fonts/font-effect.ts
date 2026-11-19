import { native, type NativeFontGlyph } from '../internal/native';
import {
  fontGlyphFromNative, fontGlyphHandle, type FontGlyph,
} from './font-glyph';
import type {
  FontEffectLayer, FontEffectSnapshot,
} from '../style/effects/effect-values';
import type { VariantColour, VariantVector2 } from '../values/types';

const effects = new WeakMap<FontEffect, object>();

/**
 * Output of Rml::FontEffect::GetGlyphMetrics.
 *
 * @zh Rml::FontEffect::GetGlyphMetrics 的输出。
 * @ja Rml::FontEffect::GetGlyphMetrics の出力。
 * @ko Rml::FontEffect::GetGlyphMetrics 출력입니다.
 */
export interface FontGlyphMetrics {
  /**
   * Whether the effect supports this glyph.
   *
   * @zh 效果是否支持此字形。
   * @ja 効果がこのグリフを扱えるか。
   * @ko 효과가 이 글리프를 지원하는지 여부입니다.
   */
  supported: boolean;

  /**
   * Output origin in pixels.
   *
   * @zh 输出原点，单位为像素。
   * @ja ピクセル単位の出力原点。
   * @ko 픽셀 단위 출력 원점입니다.
   */
  origin: VariantVector2;

  /**
   * Output bitmap dimensions in pixels.
   *
   * @zh 输出位图尺寸，单位为像素。
   * @ja ピクセル単位の出力寸法。
   * @ko 픽셀 단위 출력 비트맵 크기입니다.
   */
  dimensions: VariantVector2;
}

/**
 * Synchronous native Rml::FontEffect virtual overrides.
 *
 * @zh Rml::FontEffect 原生虚函数的同步回调。
 * @ja Rml::FontEffect のネイティブ仮想関数の同期コールバック。
 * @ko Rml::FontEffect 네이티브 가상 함수의 동기 콜백입니다.
 */
export interface FontEffectCallbacks {
  /**
   * Rml::FontEffect::HasUniqueTexture; omitted callbacks return false.
   *
   * @zh 对应 HasUniqueTexture，省略时返回 false。
   * @ja HasUniqueTexture に対応。省略時は false。
   * @ko HasUniqueTexture에 대응하며 생략 시 false입니다.
   * @returns Whether to generate a separate glyph texture.
   * @zh 是否生成独立字形纹理。
   * @ja 独自のグリフテクスチャを生成するか。
   * @ko 별도 글리프 텍스처를 생성하는지 여부입니다.
   */
  hasUniqueTexture?(): boolean;

  /**
   * Rml::FontEffect::GetGlyphMetrics; omitted callbacks report unsupported.
   *
   * @zh 对应 GetGlyphMetrics，省略时表示不支持该字形。
   * @ja GetGlyphMetrics に対応。省略時はグリフ非対応。
   * @ko GetGlyphMetrics에 대응하며 생략 시 글리프를 지원하지 않습니다.
   * @param glyph - Owned snapshot, safe to retain or modify.
   * @zh glyph - 可保留或修改的自有快照。
   * @ja glyph - 保持・変更できる所有スナップショット。
   * @ko glyph - 보관하거나 수정할 수 있는 소유 스냅샷입니다.
   * @param origin - Actual input origin, including offsets of cloned layers.
   * @zh origin - 实际输入原点，包含复制字体层的偏移。
   * @ja origin - 複製レイヤーのオフセットを含む実際の入力原点。
   * @ko origin - 복제 레이어 오프셋을 포함하는 실제 입력 원점입니다.
   * @param dimensions - Input pixel dimensions.
   * @zh dimensions - 输入像素尺寸。
   * @ja dimensions - 入力ピクセル寸法。
   * @ko dimensions - 입력 픽셀 크기입니다.
   * @returns Support flag and validated integer output metrics.
   * @zh 支持标志及经过校验的整数输出指标。
   * @ja 対応フラグと検証済み整数メトリクス。
   * @ko 지원 여부와 검증된 정수 출력 메트릭입니다.
   */
  getGlyphMetrics?(
    glyph: FontGlyph, origin: VariantVector2, dimensions: VariantVector2,
  ): FontGlyphMetrics;

  /**
   * Rml::FontEffect::GenerateGlyphTexture; omitted callbacks do nothing.
   *
   * @zh 对应 GenerateGlyphTexture，省略时不写入像素。
   * @ja GenerateGlyphTexture に対応。省略時は何も書き込みません。
   * @ko GenerateGlyphTexture에 대응하며 생략 시 쓰지 않습니다.
   * @remarks
   * The buffer is native-owned scratch storage. Only RGBA row pixels are
   * committed on successful return; padding is isolated and initialized to
   * zero. Retained views never reference the destination or the font atlas.
   * @zh 缓冲区是原生持有的临时存储。成功返回后仅提交 RGBA 行像素；
   * 填充字节独立且初始为零。保留视图不会引用目标缓冲区或字体图集。
   * @ja ネイティブ所有の作業領域です。成功時のみ RGBA 行を反映します。
   * 余白は独立したゼロ領域です。保持したビューは出力やアトラスを参照しません。
   * @ko 네이티브 소유 작업 공간입니다. 성공 시 RGBA 행만 반영합니다.
   * 패딩은 독립된 0 영역이며 보관된 뷰는 대상이나 아틀라스를 참조하지 않습니다.
   * @param destination - Writable premultiplied RGBA scratch view.
   * @zh destination - 可写的预乘 RGBA 临时视图。
   * @ja destination - 書き込み可能な乗算済み RGBA 作業ビュー。
   * @ko destination - 쓰기 가능한 선곱 RGBA 작업 뷰입니다.
   * @param dimensions - Destination glyph dimensions.
   * @zh dimensions - 目标字形尺寸。
   * @ja dimensions - 出力グリフ寸法。
   * @ko dimensions - 대상 글리프 크기입니다.
   * @param stride - Original row stride in bytes.
   * @zh stride - 原始字节行距。
   * @ja stride - 元のバイト行間隔。
   * @ko stride - 원래 바이트 행 간격입니다.
   * @param glyph - Owned source snapshot.
   * @zh glyph - 自有源字形快照。
   * @ja glyph - 所有する元グリフのスナップショット。
   * @ko glyph - 소유 원본 글리프 스냅샷입니다.
   */
  generateGlyphTexture?(
    destination: Uint8Array, dimensions: VariantVector2, stride: number,
    glyph: FontGlyph,
  ): void;
}

/**
 * Resolve a generation-checked native effect.
 *
 * @internal
 * @param effect - Public effect.
 * @returns Native handle.
 */
export function fontEffectHandle(effect: FontEffect): object {
  const handle = effects.get(effect);
  if (!handle) {
    throw new TypeError('Expected an owned font effect');
  }
  return handle;
}

/**
 * Rml::FontEffect with writable metadata and native virtual glyph operations.
 *
 * @zh Rml::FontEffect，提供可写元数据及原生虚函数字形操作。
 * @ja メタデータを書き換え、ネイティブの仮想グリフ操作を呼ぶ Rml::FontEffect。
 * @ko 수정 가능한 메타데이터와 네이티브 가상 글리프 작업을 제공하는 Rml::FontEffect입니다.
 * @remarks
 * Writes copy metadata and retain the original effect's glyph implementation.
 * Lists and Properties retain the prior immutable effect. A list getter gives
 * independent wrappers; assign them back to publish edits. Shutdown invalidates
 * every effect wrapper. Supply callbacks to register native overrides.
 * Native styles and default font layers retain callbacks. Font layers survive
 * document closure until releaseFontResources(); detached owner cycles remain
 * collectable. Custom parsers may construct effects without nested parsing.
 * @zh 写入复制元数据并保留原始字形实现；列表和 Property 保留旧的不可变效果。
 * 列表读取返回独立包装器，需重新赋回列表才应用编辑。关闭运行时后包装器失效。
 * 通过构造参数回调注册原生虚函数覆盖。
 * 原生样式和默认字体层保留回调。字体层在文档关闭后保留到 releaseFontResources()。
 * 游离持有者的循环引用可回收。自定义解析器可构造效果，禁止嵌套解析。
 * @ja 書き込みは元のグリフ実装を保持してメタデータをコピーします。
 * リストと Property は以前の効果を保持します。編集したラッパーはリストへ
 * 再代入してください。終了で無効になります。コンストラクターで仮想関数を登録します。
 * スタイルと既定フォントのレイヤーはコールバックを保持します。レイヤーは文書を閉じても
 * releaseFontResources() まで残り、切り離した所有者の循環は回収できます。
 * 独自パーサーで効果は構築できますが、入れ子解析は拒否します。
 * @ko 쓰기는 원래 글리프 구현을 유지하고 메타데이터를 복사합니다. 목록과 Property는
 * 이전 효과를 유지합니다. 편집한 래퍼를 목록에 다시 대입해야 적용됩니다.
 * 종료 시 무효화됩니다. 생성자 콜백으로 네이티브 재정의를 등록합니다.
 * 스타일과 기본 글꼴 레이어는 콜백을 유지합니다. 문서를 닫아도 글꼴 레이어는
 * releaseFontResources()까지 남고 분리된 소유자 순환은 회수할 수 있습니다.
 * 사용자 해석기에서 효과 생성은 가능하지만 중첩 해석은 거부됩니다.
 */
export class FontEffect implements FontEffectSnapshot {
  /**
   * Construct the native base effect with white colour and Back layer.
   *
   * @zh 构造白色、Back 层的原生基础效果。
   * @ja 白色で Back レイヤーのネイティブ基本効果を構築します。
   * @ko 흰색과 Back 레이어의 네이티브 기본 효과를 만듭니다.
   * @param callbacks - Optional synchronous native virtual overrides.
   * @zh callbacks - 可选的同步原生虚函数回调。
   * @ja callbacks - 任意の同期ネイティブ仮想関数コールバック。
   * @ko callbacks - 선택적인 동기 네이티브 가상 함수 콜백입니다.
   */
  constructor(callbacks?: FontEffectCallbacks) {
    if (callbacks === undefined) {
      effects.set(this, native.createFontEffect());
      return;
    }
    if (!callbacks || typeof callbacks !== 'object') {
      throw new TypeError('Expected font effect callbacks');
    }
    const { hasUniqueTexture, getGlyphMetrics, generateGlyphTexture } =
      callbacks;
    for (const callback of [
      hasUniqueTexture, getGlyphMetrics, generateGlyphTexture,
    ]) {
      if (callback !== undefined && typeof callback !== 'function') {
        throw new TypeError('Expected optional font effect callbacks');
      }
    }
    effects.set(this, native.createFontEffect([
      hasUniqueTexture,
      getGlyphMetrics && ((
        glyph: NativeFontGlyph, origin: VariantVector2,
        dimensions: VariantVector2,
      ) => getGlyphMetrics(fontGlyphFromNative(glyph), origin, dimensions)),
      generateGlyphTexture && ((
        destination: Uint8Array, dimensions: VariantVector2, stride: number,
        glyph: NativeFontGlyph,
      ) => generateGlyphTexture(
        destination, dimensions, stride, fontGlyphFromNative(glyph))),
    ]));
  }

  /**
   * Rml::FontEffect::FillColorValuesFromAlpha; copy alpha to RGB in place.
   *
   * @zh 对应 Rml::FontEffect::FillColorValuesFromAlpha，原地将 alpha 复制到 RGB。
   * @ja Rml::FontEffect::FillColorValuesFromAlpha。アルファを RGB にコピーします。
   * @ko Rml::FontEffect::FillColorValuesFromAlpha로 알파를 RGB에 복사합니다.
   * @remarks
   * Only the specified RGBA pixels change; row padding is preserved.
   * This pure native pixel operation also works before initialization, after
   * shutdown, and in workers.
   * @zh 仅修改指定的 RGBA 像素，保留行间填充。此原生像素操作可在初始化前、
   * 关闭后及 worker 中使用。
   * @ja 指定した RGBA ピクセルだけを変更し、行の余白は保持します。
   * 初期化前、終了後、ワーカーでも使用できます。
   * @ko 지정한 RGBA 픽셀만 변경하고 행 패딩은 유지합니다.
   * 초기화 전, 종료 후, 워커에서도 사용할 수 있습니다.
   * @param destination - Writable non-shared RGBA bytes.
   * @zh destination - 可写、非共享的 RGBA 字节。
   * @ja destination - 書き込み可能な非共有 RGBA バイト。
   * @ko destination - 쓰기 가능한 비공유 RGBA 바이트입니다.
   * @param dimensions - Integer width and height in pixels.
   * @zh dimensions - 整数像素宽高。
   * @ja dimensions - 整数のピクセル幅と高さ。
   * @ko dimensions - 정수 픽셀 너비와 높이입니다.
   * @param stride - Row stride in bytes, at least width times four.
   * @zh stride - 字节行距，至少为宽度的四倍。
   * @ja stride - バイト単位の行間隔。幅の 4 倍以上。
   * @ko stride - 바이트 행 간격이며 너비의 4배 이상입니다.
   */
  static fillColorValuesFromAlpha(
    destination: Uint8Array, dimensions: VariantVector2, stride: number,
  ): void {
    native.fillColorValuesFromAlpha(destination, dimensions, stride);
  }

  /**
   * Check whether the font effect generates its own glyph texture.
   *
   * @zh 查询效果是否生成独立纹理。
   * @ja 効果が独自のテクスチャを生成するか取得します。
   * @ko 글꼴 효과가 자체 글리프 텍스처를 생성하는지 확인합니다.
   * @returns Whether the effect generates its own glyph texture.
   * @zh 效果是否生成独立字形纹理。
   * @ja 独自のグリフテクスチャを生成するか。
   * @ko 자체 글리프 텍스처를 생성하는지 여부입니다.
   */
  get hasUniqueTexture(): boolean {
    return native.readFontEffect(fontEffectHandle(this), 'hasUniqueTexture');
  }

  /**
   * Rml::FontEffect::GetColour/SetColour; unpremultiplied byte colour.
   *
   * @zh Rml::FontEffect::GetColour/SetColour，非预乘字节颜色。
   * @ja Rml::FontEffect::GetColour/SetColour。非乗算済みバイト色。
   * @ko Rml::FontEffect::GetColour/SetColour이며 비선곱 바이트 색상입니다.
   * @returns Copied colour; assign the whole value to change it.
   * @zh 颜色副本；赋值整个对象进行修改。
   * @ja 色のコピー。変更には値全体を代入します。
   * @ko 색상 복사본이며 변경하려면 전체 값을 대입합니다.
   */
  get colour(): VariantColour {
    return native.readFontEffect(fontEffectHandle(this), 'colour');
  }

  /**
   * Copy the effect and set its colour.
   *
   * @zh 复制效果并设置颜色。
   * @ja 効果をコピーして色を設定します。
   * @ko 효과를 복사하고 색상을 설정합니다.
   * @param value - Unpremultiplied byte colour.
   * @zh value - 非预乘字节颜色。
   * @ja value - 非乗算済みバイト色。
   * @ko value - 비선곱 바이트 색상입니다.
   */
  set colour(value: VariantColour) {
    native.writeFontEffect(fontEffectHandle(this), 'colour', value);
  }

  /**
   * Rml::FontEffect::GetLayer/SetLayer.
   *
   * @zh 字体效果所在层级。
   * @ja フォント効果の描画レイヤー。
   * @ko Rml::FontEffect::GetLayer/SetLayer입니다.
   * @returns Back or Front.
   * @zh Back 或 Front。
   * @ja Back または Front。
   * @ko Back 또는 Front입니다.
   */
  get layer(): FontEffectLayer {
    return native.readFontEffect(fontEffectHandle(this), 'layer');
  }

  /**
   * Copy the effect and set its layer.
   *
   * @zh 复制效果并设置层级。
   * @ja 効果をコピーしてレイヤーを設定します。
   * @ko 효과를 복사하고 레이어를 설정합니다.
   * @param value - Back or Front.
   * @zh value - Back 或 Front。
   * @ja value - Back または Front。
   * @ko value - Back 또는 Front입니다.
   */
  set layer(value: FontEffectLayer) {
    native.writeFontEffect(fontEffectHandle(this), 'layer', value);
  }

  /**
   * Rml::FontEffect::GetFingerprint/SetFingerprint, exact native size_t.
   *
   * @zh Rml::FontEffect::GetFingerprint/SetFingerprint，精确原生 size_t。
   * @ja Rml::FontEffect::GetFingerprint/SetFingerprint。正確な size_t。
   * @ko Rml::FontEffect::GetFingerprint/SetFingerprint이며 정확한 size_t입니다.
   * @returns Unsigned fingerprint.
   * @zh 无符号指纹。
   * @ja 符号なしフィンガープリント。
   * @ko 부호 없는 지문입니다.
   */
  get fingerprint(): bigint {
    return native.readFontEffect(fontEffectHandle(this), 'fingerprint');
  }

  /**
   * Copy the effect and set its fingerprint.
   *
   * @zh 复制效果并设置指纹。
   * @ja 効果をコピーしてフィンガープリントを設定します。
   * @ko 효과를 복사하고 지문을 설정합니다.
   * @param value - Unsigned native size_t value.
   * @zh value - 原生无符号 size_t 值。
   * @ja value - ネイティブの符号なし size_t 値。
   * @ko value - 네이티브 부호 없는 size_t 값입니다.
   */
  set fingerprint(value: bigint) {
    native.writeFontEffect(fontEffectHandle(this), 'fingerprint', value);
  }

  /**
   * Call the native virtual GetGlyphMetrics without mutating input vectors.
   *
   * @zh 调用原生虚函数 GetGlyphMetrics，不修改输入向量。
   * @ja 入力を変更せず、ネイティブ仮想関数 GetGlyphMetrics を呼びます。
   * @ko 입력 벡터를 변경하지 않고 네이티브 가상 함수 GetGlyphMetrics를 호출합니다.
   * @param glyph - Glyph to size.
   * @zh glyph - 待计算字形。
   * @ja glyph - サイズを計算するグリフ。
   * @ko glyph - 크기를 계산할 글리프입니다.
   * @param origin - Initial pixel offset; defaults to zero.
   * @zh origin - 初始像素偏移，默认为零。
   * @ja origin - 初期オフセット。既定値はゼロ。
   * @ko origin - 초기 픽셀 오프셋이며 기본값은 0입니다.
   * @param dimensions - Initial size; defaults to glyph.bitmapDimensions.
   * @zh dimensions - 初始尺寸，默认为 glyph.bitmapDimensions。
   * @ja dimensions - 初期寸法。既定値は glyph.bitmapDimensions。
   * @ko dimensions - 초기 크기이며 기본값은 glyph.bitmapDimensions입니다.
   * @returns Support flag and both output vectors.
   * @zh 支持标志及两个输出向量。
   * @ja 対応フラグと 2 つの出力ベクトル。
   * @ko 지원 여부와 두 출력 벡터입니다.
   */
  getGlyphMetrics(
    glyph: FontGlyph, origin?: VariantVector2, dimensions?: VariantVector2,
  ): FontGlyphMetrics {
    return native.getGlyphMetrics(
      fontEffectHandle(this), fontGlyphHandle(glyph), origin, dimensions);
  }

  /**
   * Generate native premultiplied RGBA glyph pixels into the destination view.
   *
   * @zh 将原生预乘 RGBA 字形像素写入目标视图。
   * @ja ネイティブの乗算済み RGBA グリフを出力ビューへ書き込みます。
   * @ko 네이티브 선곱 RGBA 글리프 픽셀을 대상 뷰에 씁니다.
   * @param destination - Writable non-shared bytes; must not overlap the glyph.
   * @zh destination - 可写非共享字节，不得与字形位图重叠。
   * @ja destination - 書き込み可能な非共有バイト。グリフとの重複不可。
   * @ko destination - 쓰기 가능한 비공유 바이트이며 글리프와 겹칠 수 없습니다.
   * @param dimensions - Destination glyph area in pixels.
   * @zh dimensions - 目标字形区域的像素尺寸。
   * @ja dimensions - 出力グリフ領域のピクセル寸法。
   * @ko dimensions - 대상 글리프 영역의 픽셀 크기입니다.
   * @param stride - Bytes between destination rows, at least width times four.
   * @zh stride - 目标行间字节数，至少为宽度的四倍。
   * @ja stride - 出力行のバイト間隔。幅の 4 倍以上。
   * @ko stride - 대상 행 간 바이트 수이며 너비의 4배 이상입니다.
   * @param glyph - Source bitmap and metrics.
   * @zh glyph - 源位图及指标。
   * @ja glyph - 元のビットマップとメトリクス。
   * @ko glyph - 원본 비트맵과 메트릭입니다.
   */
  generateGlyphTexture(
    destination: Uint8Array, dimensions: VariantVector2, stride: number,
    glyph: FontGlyph,
  ): void {
    native.generateGlyphTexture(
      fontEffectHandle(this), destination, dimensions, stride,
      fontGlyphHandle(glyph));
  }
}

/**
 * Wrap an immutable native effect without changing its identity.
 *
 * @internal
 * @param handle - Native owner.
 * @returns Writable facade.
 */
export function fontEffectFromNative(handle: object): FontEffect {
  const result = Object.create(FontEffect.prototype) as FontEffect;
  effects.set(result, handle);
  return result;
}
