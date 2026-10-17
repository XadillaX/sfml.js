import { numericProperties } from '../internal/numeric-properties';

/**
 * Factor multiplying the source or destination color in the blend equation.
 * @zh 混合方程中乘到源颜色或目标颜色上的因子。
 * @ja ブレンド式でソース色または出力先の色に乗算する係数。
 * @ko 블렌드 방정식에서 소스 또는 대상 색상에 곱하는 계수입니다.
 */
export enum BlendFactor {
  /**
   * Constant 0.
   * @zh 常数 0。
   * @ja 定数 0。
   * @ko 상수 0입니다.
   */
  Zero,
  /**
   * Constant 1.
   * @zh 常数 1。
   * @ja 定数 1。
   * @ko 상수 1입니다.
   */
  One,
  /**
   * Source color.
   * @zh 源颜色。
   * @ja ソース色。
   * @ko 소스 색상입니다.
   */
  SrcColor,
  /**
   * 1 minus the source color.
   * @zh 1 减去源颜色。
   * @ja 1 からソース色を引いた値。
   * @ko 1에서 소스 색상을 뺀 값입니다.
   */
  OneMinusSrcColor,
  /**
   * Destination color.
   * @zh 目标颜色。
   * @ja 出力先の色。
   * @ko 대상 색상입니다.
   */
  DstColor,
  /**
   * 1 minus the destination color.
   * @zh 1 减去目标颜色。
   * @ja 1 から出力先の色を引いた値。
   * @ko 1에서 대상 색상을 뺀 값입니다.
   */
  OneMinusDstColor,
  /**
   * Source alpha.
   * @zh 源 Alpha。
   * @ja ソースの Alpha。
   * @ko 소스 Alpha입니다.
   */
  SrcAlpha,
  /**
   * 1 minus the source alpha.
   * @zh 1 减去源 Alpha。
   * @ja 1 からソースの Alpha を引いた値。
   * @ko 1에서 소스 Alpha를 뺀 값입니다.
   */
  OneMinusSrcAlpha,
  /**
   * Destination alpha.
   * @zh 目标 Alpha。
   * @ja 出力先の Alpha。
   * @ko 대상 Alpha입니다.
   */
  DstAlpha,
  /**
   * 1 minus the destination alpha.
   * @zh 1 减去目标 Alpha。
   * @ja 1 から出力先の Alpha を引いた値。
   * @ko 1에서 대상 Alpha를 뺀 값입니다.
   */
  OneMinusDstAlpha,
}

/**
 * How to combine source and destination colors after applying their factors.
 * @zh 源与目标颜色乘以各自因子后的组合方式。
 * @ja 各係数を乗算したソース色と出力先の色を合成する方法。
 * @ko 각 계수를 곱한 소스 색상과 대상 색상의 결합 방식입니다.
 */
export enum BlendEquation {
  /**
   * Source plus destination.
   * @zh 源加目标。
   * @ja ソースと出力先の和。
   * @ko 소스와 대상의 합입니다.
   */
  Add,
  /**
   * Source minus destination.
   * @zh 源减目标。
   * @ja ソースから出力先を引く。
   * @ko 소스에서 대상을 뺍니다.
   */
  Subtract,
  /**
   * Destination minus source.
   * @zh 目标减源。
   * @ja 出力先からソースを引く。
   * @ko 대상에서 소스를 뺍니다.
   */
  ReverseSubtract,
  /**
   * Component-wise minimum.
   * @zh 逐分量取较小值。
   * @ja 成分ごとの最小値。
   * @ko 성분별 최솟값입니다.
   */
  Min,
  /**
   * Component-wise maximum.
   * @zh 逐分量取较大值。
   * @ja 成分ごとの最大値。
   * @ko 성분별 최댓값입니다.
   */
  Max,
}

type Arguments = [] | [source: Readonly<BlendMode>] |
[source: BlendFactor, destination: BlendFactor, equation?: BlendEquation] |
[
    colorSource: BlendFactor, colorDestination: BlendFactor,
    colorEquation: BlendEquation, alphaSource: BlendFactor,
    alphaDestination: BlendFactor, alphaEquation: BlendEquation,
];

/**
 * sf::BlendMode. Values are copied into each recorded draw.
 * @zh sf::BlendMode。值会复制到每次录制的绘制中。
 * @ja sf::BlendMode。値は記録される各描画にコピーされます。
 * @ko sf::BlendMode. 값은 기록된 각 그리기에 복사됩니다.
 */
export class BlendMode {
  /**
   * Blend factor enumeration.
   * @zh 混合因子枚举。
   * @ja ブレンド係数の列挙型。
   * @ko 블렌드 계수 열거형입니다.
   */
  static readonly Factor = BlendFactor;
  /**
   * Blend equation enumeration.
   * @zh 混合方程枚举。
   * @ja ブレンド式の列挙型。
   * @ko 블렌드 방정식 열거형입니다.
   */
  static readonly Equation = BlendEquation;

  /**
   * RGB source color factor; defaults to SrcAlpha.
   * @zh RGB 源颜色因子，默认 SrcAlpha。
   * @ja RGB ソース色の係数。既定値は SrcAlpha。
   * @ko RGB 소스 색상 계수입니다. 기본값은 SrcAlpha입니다.
   */
  declare colorSrcFactor: BlendFactor;
  /**
   * RGB destination color factor; defaults to OneMinusSrcAlpha.
   * @zh RGB 目标颜色因子，默认 OneMinusSrcAlpha。
   * @ja RGB 出力先色の係数。既定値は OneMinusSrcAlpha。
   * @ko RGB 대상 색상 계수입니다. 기본값은 OneMinusSrcAlpha입니다.
   */
  declare colorDstFactor: BlendFactor;
  /**
   * RGB blend equation; defaults to Add.
   * @zh RGB 混合方程，默认 Add。
   * @ja RGB ブレンド式。既定値は Add。
   * @ko RGB 블렌드 방정식입니다. 기본값은 Add입니다.
   */
  declare colorEquation: BlendEquation;
  /**
   * Alpha source factor; defaults to One.
   * @zh Alpha 源因子，默认 One。
   * @ja Alpha のソース係数。既定値は One。
   * @ko Alpha 소스 계수입니다. 기본값은 One입니다.
   */
  declare alphaSrcFactor: BlendFactor;
  /**
   * Alpha destination factor; defaults to OneMinusSrcAlpha.
   * @zh Alpha 目标因子，默认 OneMinusSrcAlpha。
   * @ja Alpha の出力先係数。既定値は OneMinusSrcAlpha。
   * @ko Alpha 대상 계수입니다. 기본값은 OneMinusSrcAlpha입니다.
   */
  declare alphaDstFactor: BlendFactor;
  /**
   * Alpha blend equation; defaults to Add.
   * @zh Alpha 混合方程，默认 Add。
   * @ja Alpha のブレンド式。既定値は Add。
   * @ko Alpha 블렌드 방정식입니다. 기본값은 Add입니다.
   */
  declare alphaEquation: BlendEquation;

  /**
   * Creates default alpha blending, copies a mode, or specifies separate
   * RGB/Alpha source factors, destination factors and equations.
   * @zh 创建默认透明混合、复制模式，或分别指定 RGB/Alpha 的源因子、目标因子和方程。
   * @ja 既定の Alpha ブレンドを作成するか、モードをコピーするか、RGB/Alpha ごとのソース係数、出力先係数、式を指定します。
   * @ko 기본 Alpha 블렌딩을 만들거나 모드를 복사하거나 RGB/Alpha 각각의 소스 계수, 대상 계수 및 방정식을 지정합니다.
   */
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
/**
 * Standard alpha blending; read-only.
 * @zh 标准 Alpha 透明混合，只读。
 * @ja 標準の Alpha ブレンド。読み取り専用。
 * @ko 표준 Alpha 블렌딩입니다. 읽기 전용입니다.
 */
export const BlendAlpha: Readonly<BlendMode> = Object.freeze(new BlendMode());
/**
 * Adds the alpha-scaled source color to the destination; read-only.
 * @zh 源颜色按 Alpha 缩放后与目标相加，只读。
 * @ja Alpha を乗算したソース色を出力先に加算します。読み取り専用。
 * @ko Alpha를 곱한 소스 색상을 대상에 더합니다. 읽기 전용입니다.
 */
export const BlendAdd: Readonly<BlendMode> = Object.freeze(
  new BlendMode(F.SrcAlpha, F.One, E.Add, F.One, F.One, E.Add),
);
/**
 * Multiplies source and destination component-wise; read-only.
 * @zh 源与目标逐分量相乘，只读。
 * @ja ソースと出力先を成分ごとに乗算します。読み取り専用。
 * @ko 소스와 대상을 성분별로 곱합니다. 읽기 전용입니다.
 */
export const BlendMultiply: Readonly<BlendMode> = Object.freeze(
  new BlendMode(F.DstColor, F.Zero),
);
/**
 * Component-wise minimum of source and destination; read-only.
 * @zh 逐分量取源与目标的较小值，只读。
 * @ja ソースと出力先の成分ごとの最小値。読み取り専用。
 * @ko 소스와 대상의 성분별 최솟값입니다. 읽기 전용입니다.
 */
export const BlendMin: Readonly<BlendMode> = Object.freeze(
  new BlendMode(F.One, F.One, E.Min),
);
/**
 * Component-wise maximum of source and destination; read-only.
 * @zh 逐分量取源与目标的较大值，只读。
 * @ja ソースと出力先の成分ごとの最大値。読み取り専用。
 * @ko 소스와 대상의 성분별 최댓값입니다. 읽기 전용입니다.
 */
export const BlendMax: Readonly<BlendMode> = Object.freeze(
  new BlendMode(F.One, F.One, E.Max),
);
/**
 * Source overwrites destination without color blending; read-only.
 * @zh 源直接覆盖目标，不做颜色混合，只读。
 * @ja 色をブレンドせず、ソースで出力先を上書きします。読み取り専用。
 * @ko 색상 블렌딩 없이 소스가 대상을 덮어씁니다. 읽기 전용입니다.
 */
export const BlendNone: Readonly<BlendMode> = Object.freeze(
  new BlendMode(F.One, F.Zero),
);
