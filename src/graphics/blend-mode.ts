import { numericProperties } from '../internal/numeric-properties';

/** 混合方程中乘到源颜色或目标颜色上的因子。 */
export enum BlendFactor {
  /** 常数 0。 */
  Zero,
  /** 常数 1。 */
  One,
  /** 源颜色。 */
  SrcColor,
  /** 1 减去源颜色。 */
  OneMinusSrcColor,
  /** 目标颜色。 */
  DstColor,
  /** 1 减去目标颜色。 */
  OneMinusDstColor,
  /** 源 Alpha。 */
  SrcAlpha,
  /** 1 减去源 Alpha。 */
  OneMinusSrcAlpha,
  /** 目标 Alpha。 */
  DstAlpha,
  /** 1 减去目标 Alpha。 */
  OneMinusDstAlpha,
}

/** 源与目标颜色乘以各自因子后的组合方式。 */
export enum BlendEquation {
  /** 源加目标。 */
  Add,
  /** 源减目标。 */
  Subtract,
  /** 目标减源。 */
  ReverseSubtract,
  /** 逐分量取较小值。 */
  Min,
  /** 逐分量取较大值。 */
  Max,
}

type Arguments = [] | [source: Readonly<BlendMode>] |
[source: BlendFactor, destination: BlendFactor, equation?: BlendEquation] |
[
    colorSource: BlendFactor, colorDestination: BlendFactor,
    colorEquation: BlendEquation, alphaSource: BlendFactor,
    alphaDestination: BlendFactor, alphaEquation: BlendEquation,
];

/** sf::BlendMode. Values are copied into each recorded draw. */
export class BlendMode {
  /** 混合因子枚举。 */
  static readonly Factor = BlendFactor;
  /** 混合方程枚举。 */
  static readonly Equation = BlendEquation;

  /** RGB 源颜色因子，默认 SrcAlpha。 */
  declare colorSrcFactor: BlendFactor;
  /** RGB 目标颜色因子，默认 OneMinusSrcAlpha。 */
  declare colorDstFactor: BlendFactor;
  /** RGB 混合方程，默认 Add。 */
  declare colorEquation: BlendEquation;
  /** Alpha 源因子，默认 One。 */
  declare alphaSrcFactor: BlendFactor;
  /** Alpha 目标因子，默认 OneMinusSrcAlpha。 */
  declare alphaDstFactor: BlendFactor;
  /** Alpha 混合方程，默认 Add。 */
  declare alphaEquation: BlendEquation;

  /** 创建默认透明混合、复制模式，或分别指定 RGB/Alpha 的源因子、目标因子和方程。 */
  constructor(...args: Arguments) {
    numericProperties(this, {
      colorSrcFactor: BlendFactor.SrcAlpha,
      colorDstFactor: BlendFactor.OneMinusSrcAlpha,
      colorEquation: BlendEquation.Add,
      alphaSrcFactor: BlendFactor.One,
      alphaDstFactor: BlendFactor.OneMinusSrcAlpha,
      alphaEquation: BlendEquation.Add,
    });
    if (args.length === 0) return;
    if (args.length === 1 && args[0] instanceof BlendMode) {
      const source = args[0];
      this.colorSrcFactor = source.colorSrcFactor;
      this.colorDstFactor = source.colorDstFactor;
      this.colorEquation = source.colorEquation;
      this.alphaSrcFactor = source.alphaSrcFactor;
      this.alphaDstFactor = source.alphaDstFactor;
      this.alphaEquation = source.alphaEquation;
    } else if (args.length === 2 || args.length === 3 || args.length === 6) {
      this.colorSrcFactor = args[0];
      this.colorDstFactor = args[1];
      this.colorEquation = args[2] ?? BlendEquation.Add;
      this.alphaSrcFactor = args.length === 6 ? args[3] : args[0];
      this.alphaDstFactor = args.length === 6 ? args[4] : args[1];
      this.alphaEquation = args.length === 6
        ? args[5] : this.colorEquation;
    } else {
      throw new TypeError('Expected a BlendMode or blend factors');
    }
  }
}

const F = BlendFactor;
const E = BlendEquation;
/** 标准 Alpha 透明混合，只读。 */
export const BlendAlpha: Readonly<BlendMode> = Object.freeze(new BlendMode());
/** 源颜色按 Alpha 缩放后与目标相加，只读。 */
export const BlendAdd: Readonly<BlendMode> = Object.freeze(
  new BlendMode(F.SrcAlpha, F.One, E.Add, F.One, F.One, E.Add),
);
/** 源与目标逐分量相乘，只读。 */
export const BlendMultiply: Readonly<BlendMode> = Object.freeze(
  new BlendMode(F.DstColor, F.Zero),
);
/** 逐分量取源与目标的较小值，只读。 */
export const BlendMin: Readonly<BlendMode> = Object.freeze(
  new BlendMode(F.One, F.One, E.Min),
);
/** 逐分量取源与目标的较大值，只读。 */
export const BlendMax: Readonly<BlendMode> = Object.freeze(
  new BlendMode(F.One, F.One, E.Max),
);
/** 源直接覆盖目标，不做颜色混合，只读。 */
export const BlendNone: Readonly<BlendMode> = Object.freeze(
  new BlendMode(F.One, F.Zero),
);
