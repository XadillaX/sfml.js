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

/** 离屏渲染目标的深度、模板、抗锯齿和 OpenGL 上下文配置。 */
export type RenderTextureSettings = ContextSettings;

function coordinates(size: Readonly<Vector2u>): void {
  if (!(size instanceof Vector2) || size.scalarType !== 'u32') {
    throw new TypeError('Expected a Vector2u');
  }
}

function flag(value: boolean): void {
  if (typeof value !== 'boolean') throw new TypeError('Expected a boolean');
}

/** sf::RenderTexture: record clear/draw, submit when display is called. */
export class RenderTexture extends RenderTarget {
  readonly [graphicsNative]: NativeGraphicsHandle<'renderTexture'>;
  private readonly state: Readonly<NativeTextureInfo>;
  private readonly targetInfo: Readonly<{ sRgb: boolean }>;
  private texture?: ReadonlyTexture;

  /** 创建尚未分配像素的离屏渲染目标。 */
  constructor();
  /** 创建指定像素尺寸和上下文配置的离屏渲染目标。 */
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

  /** 返回离屏目标像素尺寸的副本。 */
  getSize(): Vector2u {
    return new Vector2u(this.state.width, this.state.height);
  }

  /** Failure preserves the target; successful resize leaves pixels undefined. */
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

  /** 返回当前环境支持的最大抗锯齿级别。 */
  static getMaximumAntiAliasingLevel(): number {
    return native.getMaximumRenderTextureAntiAliasingLevel();
  }

  /** 设置结果纹理是否启用平滑过滤。 */
  setSmooth(smooth: boolean): void {
    flag(smooth);
    if (smooth === this.state.smooth) return;
    if (this.texture) flushTextureReaders(this);
    native.setRenderTextureSmooth(this[graphicsNative], smooth);
  }

  /** 返回结果纹理是否启用平滑过滤。 */
  isSmooth(): boolean {
    return this.state.smooth;
  }

  /** 设置结果纹理是否重复平铺。 */
  setRepeated(repeated: boolean): void {
    flag(repeated);
    if (repeated === this.state.repeated) return;
    if (this.texture) flushTextureReaders(this);
    native.setRenderTextureRepeated(this[graphicsNative], repeated);
  }

  /** 返回结果纹理是否重复平铺。 */
  isRepeated(): boolean {
    return this.state.repeated;
  }

  /** 返回渲染目标是否启用 sRGB 颜色转换。 */
  isSrgb(): boolean {
    return this.targetInfo.sRgb;
  }

  /** Call display() after drawing, then generate mipmaps for that image. */
  generateMipmap(): boolean {
    if (this.texture) flushTextureReaders(this);
    return native.generateRenderTextureMipmap(this[graphicsNative]);
  }

  /** Finish recorded work before direct OpenGL access or deactivation. */
  protected activate(active: boolean): boolean {
    if (active && this.texture) flushTextureReaders(this);
    return native.setRenderTextureActive(this[graphicsNative], active);
  }

  protected changeGLStates(operation: 0 | 1 | 2): void {
    if (this.texture) flushTextureReaders(this);
    native.changeRenderTextureGLStates(this[graphicsNative], operation);
  }

  /** Borrow the GPU resource; call display() before sampling new draws. */
  getTexture(): ReadonlyTexture {
    this.texture ??= textureFromMapping(
      native.getRenderTextureTexture(this[graphicsNative]), this,
    );
    return this.texture;
  }

  /** 同步提交已录制绘制并更新结果纹理，之后才能采样本次绘制结果。 */
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
