import { BlendMode, BlendAlpha } from './blend-mode';
import { StencilMode, type StencilValue } from './stencil-mode';
import { Transform } from './transform';
import { Texture, type ReadonlyTexture } from './texture';
import { Shader, type ReadonlyShader } from './shader';
import type { ReadonlyValue } from '../internal/value-storage';
import { numericProperties } from '../internal/numeric-properties';

/**
 * Units for texture coordinates.
 * @zh 纹理坐标的单位。
 * @ja テクスチャ座標の単位。
 * @ko 텍스처 좌표 단위입니다.
 */
export enum CoordinateType {
  /**
   * Normalized coordinates with texture width and height each equal to 1.
   * @zh 以纹理宽高为 1 的归一化坐标。
   * @ja テクスチャの幅と高さをそれぞれ 1 とする正規化座標。
   * @ko 텍스처 너비와 높이를 각각 1로 하는 정규화 좌표입니다.
   */
  Normalized,
  /**
   * Coordinates in texture pixels.
   * @zh 以纹理像素为单位。
   * @ja テクスチャのピクセル単位の座標。
   * @ko 텍스처 픽셀 단위 좌표입니다.
   */
  Pixels,
}

/**
 * Read-only draw states; textures and shaders retain resource references.
 * @zh 只读绘制状态；纹理和着色器保留资源引用。
 * @ja 読み取り専用の描画状態。テクスチャとシェーダーはリソース参照を保持します。
 * @ko 읽기 전용 그리기 상태입니다. 텍스처와 셰이더는 리소스 참조를 유지합니다.
 */
export interface ReadonlyRenderStates {
  /**
   * Color blending mode.
   * @zh 颜色混合模式。
   * @ja 色のブレンドモード。
   * @ko 색상 블렌드 모드입니다.
   */
  readonly blendMode: Readonly<BlendMode>;
  /**
   * Stencil test configuration.
   * @zh 模板测试配置。
   * @ja ステンシルテスト設定。
   * @ko 스텐실 테스트 설정입니다.
   */
  readonly stencilMode: Readonly<Omit<StencilMode,
  'stencilReference' | 'stencilMask'>> & {
    /**
     * Read-only stencil reference value.
     * @zh 只读模板参考值。
     * @ja 読み取り専用のステンシル参照値。
     * @ko 읽기 전용 스텐실 참조 값입니다.
     */
    readonly stencilReference: Readonly<StencilValue>;
    /**
     * Read-only stencil comparison mask.
     * @zh 只读模板比较掩码。
     * @ja 読み取り専用のステンシル比較マスク。
     * @ko 읽기 전용 스텐실 비교 마스크입니다.
     */
    readonly stencilMask: Readonly<StencilValue>;
  };
  /**
   * Transform applied before drawing.
   * @zh 绘制前应用的变换。
   * @ja 描画前に適用する変換。
   * @ko 그리기 전에 적용할 변환입니다.
   */
  readonly transform: ReadonlyValue<Transform>;
  /**
   * Texture coordinate units.
   * @zh 纹理坐标单位。
   * @ja テクスチャ座標の単位。
   * @ko 텍스처 좌표 단위입니다.
   */
  readonly coordinateType: CoordinateType;
  /**
   * Texture resource reference; null disables texturing.
   * @zh 纹理资源引用，null 表示不用纹理。
   * @ja テクスチャリソース参照。null はテクスチャを無効にします。
   * @ko 텍스처 리소스 참조입니다. null은 텍스처를 사용하지 않습니다.
   */
  readonly texture: ReadonlyTexture | null;
  /**
   * Shader resource reference; null uses the default pipeline.
   * @zh 着色器资源引用，null 使用默认管线。
   * @ja シェーダーリソース参照。null は既定のパイプラインを使用します。
   * @ko 셰이더 리소스 참조입니다. null은 기본 파이프라인을 사용합니다.
   */
  readonly shader: ReadonlyShader | null;
}

/**
 * Partially specified draw state parameters.
 * @zh 可部分指定的绘制状态参数。
 * @ja 一部だけ指定できる描画状態パラメーター。
 * @ko 일부만 지정할 수 있는 그리기 상태 매개변수입니다.
 */
export type RenderStatesOptions = Partial<ReadonlyRenderStates>;

/**
 * Draw state input: a configuration object or a single transform, blend mode,
 * stencil mode, texture or shader resource.
 * @zh 绘制状态输入：配置对象或单一变换、混合、模板、纹理、着色器资源。
 * @ja 描画状態の入力。設定オブジェクト、または単一の変換、ブレンド、ステンシル、テクスチャ、シェーダーリソース。
 * @ko 그리기 상태 입력입니다. 설정 객체 또는 단일 변환, 블렌드 모드, 스텐실 모드, 텍스처, 셰이더 리소스입니다.
 */
export type RenderStatesInput = RenderStatesOptions | ReadonlyValue<Transform> |
Readonly<BlendMode> | Readonly<StencilMode> | ReadonlyTexture | ReadonlyShader | null;

const defaultOptions: RenderStatesOptions = Object.freeze({});

/**
 * Value members copy deeply; texture and shader references retain identity.
 * @zh 值成员深复制；纹理和着色器引用保持同一性。
 * @ja 値メンバーはディープコピーされ、テクスチャとシェーダーの参照は同一性を保ちます。
 * @ko 값 멤버는 깊은 복사되며 텍스처와 셰이더 참조는 동일성을 유지합니다.
 */
export class RenderStates {
  /**
   * Color blending mode; defaults to BlendAlpha.
   * @zh 颜色混合模式，默认 BlendAlpha。
   * @ja 色のブレンドモード。既定値は BlendAlpha。
   * @ko 색상 블렌드 모드입니다. 기본값은 BlendAlpha입니다.
   */
  blendMode: BlendMode;
  /**
   * Stencil test configuration; by default always passes and preserves stencil
   * values.
   * @zh 模板测试配置，默认始终通过且保留模板值。
   * @ja ステンシルテスト設定。既定では常に通過し、ステンシル値を保持します。
   * @ko 스텐실 테스트 설정입니다. 기본적으로 항상 통과하며 스텐실 값을 유지합니다.
   */
  stencilMode: StencilMode;
  /**
   * Texture coordinate units; defaults to Pixels.
   * @zh 纹理坐标单位，默认 Pixels。
   * @ja テクスチャ座標の単位。既定値は Pixels。
   * @ko 텍스처 좌표 단위입니다. 기본값은 Pixels입니다.
   */
  declare coordinateType: CoordinateType;
  /**
   * Texture reference; defaults to null.
   * @zh 纹理引用，默认 null。
   * @ja テクスチャ参照。既定値は null。
   * @ko 텍스처 참조입니다. 기본값은 null입니다.
   */
  texture: ReadonlyTexture | null;
  /**
   * Shader reference; defaults to null.
   * @zh 着色器引用，默认 null。
   * @ja シェーダー参照。既定値は null。
   * @ko 셰이더 참조입니다. 기본값은 null입니다.
   */
  shader: ReadonlyShader | null;
  /**
   * Deep copy of the transform matrix.
   * @zh 深复制的变换矩阵副本。
   * @ja ディープコピーされた変換行列。
   * @ko 깊은 복사된 변환 행렬입니다.
   */
  private matrix: Transform;

  /**
   * Creates draw states, deep-copying value members and retaining texture and
   * shader references.
   * @zh 创建绘制状态；深复制数值成员，保留纹理和着色器引用。
   * @ja 値メンバーをディープコピーし、テクスチャとシェーダー参照を保持して描画状態を作成します。
   * @ko 값 멤버는 깊은 복사하고 텍스처와 셰이더 참조는 유지하여 그리기 상태를 만듭니다.
   */
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

  /**
   * Mutable transform object held by these states.
   * @zh 当前状态持有的可修改变换对象。
   * @ja 現在の状態が保持する変更可能な変換オブジェクト。
   * @ko 현재 상태가 보유한 수정 가능한 변환 객체입니다.
   */
  get transform(): Transform {
    return this.matrix;
  }

  /**
   * Copies value as the transform of these states.
   * @zh 复制 value 为当前状态的变换。
   * @ja value を現在の状態の変換としてコピーします。
   * @ko value를 현재 상태의 변환으로 복사합니다.
   */
  set transform(value: ReadonlyValue<Transform>) {
    this.matrix = new Transform(value);
  }

  /**
   * Deeply read-only default draw states.
   * @zh 深度只读的默认绘制状态。
   * @ja 深い階層まで読み取り専用の既定描画状態。
   * @ko 내부까지 읽기 전용인 기본 그리기 상태입니다.
   */
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
