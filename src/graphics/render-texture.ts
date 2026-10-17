import {
  native, type NativeGraphicsHandle, type NativeTextureInfo,
} from '../internal/native';
import {
  graphicsContext, graphicsNative, flushTextureReaders,
} from '../internal/graphics-state';
import { Vector2, Vector2u } from '../system/vector2';
import { nativeStruct } from '../internal/struct-view';
import {
  contextSettings, type ContextSettings,
} from '../window/context-settings';
import { RenderTarget } from './render-target';
import { textureFromMapping, type ReadonlyTexture } from './texture';

/**
 * Depth, stencil, antialiasing and OpenGL context settings for an off-screen
 * render target.
 * @zh 离屏渲染目标的深度、模板、抗锯齿和 OpenGL 上下文配置。
 * @ja オフスクリーンレンダーターゲットの深度、ステンシル、アンチエイリアス、OpenGL コンテキスト設定。
 * @ko 오프스크린 렌더 대상의 깊이, 스텐실, 안티앨리어싱 및 OpenGL 컨텍스트 설정입니다.
 */
export type RenderTextureSettings = ContextSettings;

function coordinates(size: Readonly<Vector2u>): void {
  if (!(size instanceof Vector2) || size.scalarType !== 'u32') {
    throw new TypeError('Expected a Vector2u');
  }
}

function flag(value: boolean): void {
  if (typeof value !== 'boolean') throw new TypeError('Expected a boolean');
}

/**
 * sf::RenderTexture: record clear/draw, submit when display is called.
 * @zh sf::RenderTexture：录制 clear/draw，在调用 display 时提交。
 * @ja sf::RenderTexture。clear/draw を記録し、display 呼び出し時に送信します。
 * @ko sf::RenderTexture: clear/draw를 기록하고 display 호출 시 제출합니다.
 */
export class RenderTexture extends RenderTarget {
  readonly [graphicsNative]: NativeGraphicsHandle<'renderTexture'>;
  private readonly state: Readonly<NativeTextureInfo>;
  private readonly targetInfo: Readonly<{ sRgb: boolean }>;
  private texture?: ReadonlyTexture;

  /**
   * Creates an off-screen render target with no pixels allocated yet.
   * @zh 创建尚未分配像素的离屏渲染目标。
   * @ja ピクセルがまだ割り当てられていないオフスクリーンレンダーターゲットを作成します。
   * @ko 아직 픽셀이 할당되지 않은 오프스크린 렌더 대상을 만듭니다.
   */
  constructor();
  /**
   * Creates an off-screen render target with the specified pixel size and
   * context settings.
   * @zh 创建指定像素尺寸和上下文配置的离屏渲染目标。
   * @ja 指定ピクセルサイズとコンテキスト設定でオフスクリーンレンダーターゲットを作成します。
   * @ko 지정한 픽셀 크기와 컨텍스트 설정으로 오프스크린 렌더 대상을 만듭니다.
   */
  constructor(size: Readonly<Vector2u>, settings?: Readonly<ContextSettings>);
  constructor(
    size?: Readonly<Vector2u>, settings: Readonly<ContextSettings> = {},
  ) {
    if (size !== undefined) coordinates(size);
    const requested = contextSettings(settings);
    const { handle, buffer, info, targetInfo } = native.createRenderTexture(
      graphicsContext(), size?.x, size?.y, requested,
    );
    super(buffer);
    this[graphicsNative] = handle;
    this.state = nativeStruct<NativeTextureInfo>(info);
    this.targetInfo = nativeStruct<{ sRgb: boolean }>(targetInfo);
    if (size) this.initializeViews(size);
  }

  /**
   * Returns a copy of the off-screen target's pixel size.
   * @zh 返回离屏目标像素尺寸的副本。
   * @ja オフスクリーンターゲットのピクセルサイズのコピーを返します。
   * @ko 오프스크린 대상의 픽셀 크기 복사본을 반환합니다.
   */
  getSize(): Vector2u {
    return new Vector2u(this.state.width, this.state.height);
  }

  /**
   * Failure preserves the target; successful resize leaves pixels undefined.
   * @zh 失败时保留目标；调整尺寸成功后像素内容未定义。
   * @ja 失敗時はターゲットを保持します。サイズ変更に成功した場合、ピクセル内容は未定義になります。
   * @ko 실패하면 대상을 유지합니다. 크기 변경에 성공하면 픽셀 내용은 미정 상태가 됩니다.
   */
  resize(
    size: Readonly<Vector2u>, settings: Readonly<ContextSettings> = {},
  ): boolean {
    coordinates(size);
    const requested = contextSettings(settings);
    if (this.texture) flushTextureReaders(this);
    this.flush();
    const info = native.resizeRenderTexture(
      this[graphicsNative], size.x, size.y, requested,
    );
    if (info) {
      this.initializeViews(size);
    }
    return info !== undefined;
  }

  /**
   * Returns the maximum antialiasing level supported by the current
   * environment.
   * @zh 返回当前环境支持的最大抗锯齿级别。
   * @ja 現在の環境が対応する最大アンチエイリアスレベルを返します。
   * @ko 현재 환경에서 지원하는 최대 안티앨리어싱 수준을 반환합니다.
   */
  static getMaximumAntiAliasingLevel(): number {
    return native.getMaximumRenderTextureAntiAliasingLevel();
  }

  /**
   * Sets whether the result texture uses smooth filtering.
   * @zh 设置结果纹理是否启用平滑过滤。
   * @ja 結果テクスチャで平滑化フィルタリングを使用するかを設定します。
   * @ko 결과 텍스처의 부드러운 필터링 사용 여부를 설정합니다.
   */
  setSmooth(smooth: boolean): void {
    flag(smooth);
    if (smooth === this.state.smooth) return;
    if (this.texture) flushTextureReaders(this);
    native.setRenderTextureSmooth(this[graphicsNative], smooth);
  }

  /**
   * Returns whether the result texture uses smooth filtering.
   * @zh 返回结果纹理是否启用平滑过滤。
   * @ja 結果テクスチャで平滑化フィルタリングが有効かを返します。
   * @ko 결과 텍스처의 부드러운 필터링 사용 여부를 반환합니다.
   */
  isSmooth(): boolean {
    return this.state.smooth;
  }

  /**
   * Sets whether the result texture repeats.
   * @zh 设置结果纹理是否重复平铺。
   * @ja 結果テクスチャを繰り返し表示するかを設定します。
   * @ko 결과 텍스처의 반복 타일링 여부를 설정합니다.
   */
  setRepeated(repeated: boolean): void {
    flag(repeated);
    if (repeated === this.state.repeated) return;
    if (this.texture) flushTextureReaders(this);
    native.setRenderTextureRepeated(this[graphicsNative], repeated);
  }

  /**
   * Returns whether the result texture repeats.
   * @zh 返回结果纹理是否重复平铺。
   * @ja 結果テクスチャが繰り返し表示されるかを返します。
   * @ko 결과 텍스처의 반복 타일링 여부를 반환합니다.
   */
  isRepeated(): boolean {
    return this.state.repeated;
  }

  /**
   * Returns whether the render target enables sRGB color conversion.
   * @zh 返回渲染目标是否启用 sRGB 颜色转换。
   * @ja レンダーターゲットで sRGB 色変換が有効かを返します。
   * @ko 렌더 대상의 sRGB 색상 변환 활성화 여부를 반환합니다.
   */
  isSrgb(): boolean {
    return this.targetInfo.sRgb;
  }

  /**
   * Call display() after drawing, then generate mipmaps for that image.
   * @zh 绘制后先调用 display()，再为该图像生成 mipmap。
   * @ja 描画後に display() を呼び出してから、その画像の mipmap を生成します。
   * @ko 그린 후 display()를 호출한 다음 해당 이미지의 mipmap을 생성합니다.
   */
  generateMipmap(): boolean {
    if (this.texture) flushTextureReaders(this);
    return native.generateRenderTextureMipmap(this[graphicsNative]);
  }

  /**
   * Finish recorded work before direct OpenGL access or deactivation.
   * @zh 在直接访问 OpenGL 或停用前完成已录制的工作。
   * @ja OpenGL に直接アクセスする前、または無効化する前に、記録済みの処理を完了します。
   * @ko OpenGL에 직접 접근하거나 비활성화하기 전에 기록된 작업을 완료합니다.
   */
  protected activate(active: boolean): boolean {
    if (active && this.texture) flushTextureReaders(this);
    return native.setRenderTextureActive(this[graphicsNative], active);
  }

  protected changeGLStates(operation: 0 | 1 | 2): void {
    if (this.texture) flushTextureReaders(this);
    native.changeRenderTextureGLStates(this[graphicsNative], operation);
  }

  /**
   * Borrow the GPU resource; call display() before sampling new draws.
   * @zh 借用 GPU 资源；采样新绘制结果前需调用 display()。
   * @ja GPU リソースを借用します。新しい描画をサンプリングする前に display() を呼び出してください。
   * @ko GPU 리소스를 빌립니다. 새 그리기 결과를 샘플링하기 전에 display()를 호출해야 합니다.
   */
  getTexture(): ReadonlyTexture {
    this.texture ??= textureFromMapping(
      native.getRenderTextureTexture(this[graphicsNative]), this,
    );
    return this.texture;
  }

  /**
   * Synchronously submits recorded draws and updates the result texture; only
   * then can these draw results be sampled.
   * @zh 同步提交已录制绘制并更新结果纹理，之后才能采样本次绘制结果。
   * @ja 記録済み描画を同期的に送信し、結果テクスチャを更新します。その後に今回の描画結果をサンプリングできます。
   * @ko 기록된 그리기를 동기적으로 제출하고 결과 텍스처를 갱신합니다. 그 후에 이번 그리기 결과를 샘플링할 수 있습니다.
   */
  display(): void {
    this.submit(true);
  }

  protected submitCommands(count: number, display: boolean): void {
    if (this.texture) flushTextureReaders(this);
    native.submitRenderTexture(this[graphicsNative], count, display);
  }

  protected allocateVertexBuffer(capacity: number): ArrayBuffer {
    return native.allocateRenderTextureVertices(this[graphicsNative], capacity);
  }
}
