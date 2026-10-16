import { BlendMode, BlendAlpha } from './blend-mode';
import { StencilMode, type StencilValue } from './stencil-mode';
import { Transform } from './transform';
import { Texture, type ReadonlyTexture } from './texture';
import { Shader, type ReadonlyShader } from './shader';
import type { ReadonlyValue } from '../internal/value-storage';
import { numericProperties } from '../internal/numeric-properties';

/** 纹理坐标的单位。 */
export enum CoordinateType {
  /** 以纹理宽高为 1 的归一化坐标。 */
  Normalized,
  /** 以纹理像素为单位。 */
  Pixels,
}

/** 只读绘制状态；纹理和着色器保留资源引用。 */
export interface ReadonlyRenderStates {
  /** 颜色混合模式。 */
  readonly blendMode: Readonly<BlendMode>;
  /** 模板测试配置。 */
  readonly stencilMode: Readonly<Omit<StencilMode,
  'stencilReference' | 'stencilMask'>> & {
    /** 只读模板参考值。 */
    readonly stencilReference: Readonly<StencilValue>;
    /** 只读模板比较掩码。 */
    readonly stencilMask: Readonly<StencilValue>;
  };
  /** 绘制前应用的变换。 */
  readonly transform: ReadonlyValue<Transform>;
  /** 纹理坐标单位。 */
  readonly coordinateType: CoordinateType;
  /** 纹理资源引用，null 表示不用纹理。 */
  readonly texture: ReadonlyTexture | null;
  /** 着色器资源引用，null 使用默认管线。 */
  readonly shader: ReadonlyShader | null;
}

/** 可部分指定的绘制状态参数。 */
export type RenderStatesOptions = Partial<ReadonlyRenderStates>;

/** 绘制状态输入：配置对象或单一变换、混合、模板、纹理、着色器资源。 */
export type RenderStatesInput = RenderStatesOptions | ReadonlyValue<Transform> |
Readonly<BlendMode> | Readonly<StencilMode> | ReadonlyTexture | ReadonlyShader | null;

const defaultOptions: RenderStatesOptions = Object.freeze({});

/** Value members copy deeply; texture and shader references retain identity. */
export class RenderStates {
  /** 颜色混合模式，默认 BlendAlpha。 */
  blendMode: BlendMode;
  /** 模板测试配置，默认始终通过且保留模板值。 */
  stencilMode: StencilMode;
  /** 纹理坐标单位，默认 Pixels。 */
  declare coordinateType: CoordinateType;
  /** 纹理引用，默认 null。 */
  texture: ReadonlyTexture | null;
  /** 着色器引用，默认 null。 */
  shader: ReadonlyShader | null;
  /** 深复制的变换矩阵副本。 */
  private matrix: Transform;

  /** 创建绘制状态；深复制数值成员，保留纹理和着色器引用。 */
  constructor(source: RenderStatesInput = defaultOptions) {
    let options: RenderStatesOptions;
    if (source === defaultOptions) options = defaultOptions;
    else if (source instanceof RenderStates) options = source;
    else if (source instanceof Transform) options = { transform: source };
    else if (source instanceof BlendMode) options = { blendMode: source };
    else if (source instanceof StencilMode) options = { stencilMode: source };
    else if (source instanceof Shader) options = { shader: source };
    else if (source instanceof Texture || source === null) {
      options = { texture: source };
    } else if (typeof source === 'object') options = source as RenderStatesOptions;
    else throw new TypeError('Expected render states');

    if (options.shader != null && !(options.shader instanceof Shader)) {
      throw new TypeError('Expected a Shader or null');
    }
    this.blendMode = new BlendMode(options.blendMode ?? BlendAlpha);
    this.stencilMode = new StencilMode(options.stencilMode);
    const transform = options.transform;
    this.matrix = transform == null ? new Transform() : new Transform(transform);
    numericProperties(this, { coordinateType: CoordinateType.Pixels });
    this.coordinateType = options.coordinateType ?? CoordinateType.Pixels;
    this.texture = options.texture ?? null;
    this.shader = options.shader ?? null;
  }

  /** 当前状态持有的可修改变换对象。 */
  get transform(): Transform {
    return this.matrix;
  }

  /** 复制 value 为当前状态的变换。 */
  set transform(value: ReadonlyValue<Transform>) {
    this.matrix = new Transform(value);
  }

  /** 深度只读的默认绘制状态。 */
  static readonly Default: ReadonlyRenderStates = (() => {
    const states = new RenderStates();
    Object.freeze(states.matrix);
    Object.freeze(states.blendMode);
    Object.freeze(states.stencilMode.stencilReference);
    Object.freeze(states.stencilMode.stencilMask);
    Object.freeze(states.stencilMode);
    return Object.freeze(states);
  })();
}
