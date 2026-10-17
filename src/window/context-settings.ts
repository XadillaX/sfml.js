import { readonlyStruct } from '../internal/struct-view';

/**
 * OpenGL context attribute bit flags.
 * @zh OpenGL 上下文属性位标志。
 * @ja OpenGL コンテキスト属性のビットフラグ。
 * @ko OpenGL 컨텍스트 속성 비트 플래그.
 */
export enum ContextAttribute {
  /**
   * The default compatibility context.
   * @zh 默认兼容上下文。
   * @ja 既定の互換コンテキスト。
   * @ko 기본 호환 컨텍스트.
   */
  Default = 0,
  /**
   * Request a core-profile context.
   * @zh 请求核心配置上下文。
   * @ja コアプロファイルのコンテキストを要求する。
   * @ko 코어 프로파일 컨텍스트를 요청한다.
   */
  Core = 1,
  /**
   * Request a debug context.
   * @zh 请求调试上下文。
   * @ja デバッグコンテキストを要求する。
   * @ko 디버그 컨텍스트를 요청한다.
   */
  Debug = 4,
}

/**
 * SFML context requests; omitted members use SFML's defaults.
 * @zh SFML 上下文请求；省略的成员使用 SFML 默认值。
 * @ja SFML コンテキストへの要求。省略したメンバーには SFML の既定値を使う。
 * @ko SFML 컨텍스트 요청. 생략한 멤버는 SFML 기본값을 사용한다.
 */
export interface ContextSettings {
  /**
   * Depth buffer bits, defaulting to 0.
   * @zh 深度缓冲位数，默认 0。
   * @ja 深度バッファのビット数。既定値は 0。
   * @ko 깊이 버퍼 비트 수. 기본값은 0.
   */
  depthBits?: number;
  /**
   * Stencil buffer bits, from 0 to 32, defaulting to 0.
   * @zh 模板缓冲位数，范围 0～32，默认 0。
   * @ja ステンシルバッファのビット数。範囲は 0～32、既定値は 0。
   * @ko 스텐실 버퍼 비트 수. 범위는 0～32, 기본값은 0.
   */
  stencilBits?: number;
  /**
   * Multisample anti-aliasing level, defaulting to 0.
   * @zh 多重采样抗锯齿级别，默认 0。
   * @ja マルチサンプルアンチエイリアスのレベル。既定値は 0。
   * @ko 멀티샘플 안티앨리어싱 수준. 기본값은 0.
   */
  antiAliasingLevel?: number;
  /**
   * Requested OpenGL major version, defaulting to 1.
   * @zh 请求的 OpenGL 主版本，默认 1。
   * @ja 要求する OpenGL メジャーバージョン。既定値は 1。
   * @ko 요청한 OpenGL 주 버전. 기본값은 1.
   */
  majorVersion?: number;
  /**
   * Requested OpenGL minor version, defaulting to 1.
   * @zh 请求的 OpenGL 次版本，默认 1。
   * @ja 要求する OpenGL マイナーバージョン。既定値は 1。
   * @ko 요청한 OpenGL 부 버전. 기본값은 1.
   */
  minorVersion?: number;
  /**
   * Context attribute bit flags, defaulting to Default.
   * @zh 上下文属性位标志，默认 Default。
   * @ja コンテキスト属性のビットフラグ。既定値は Default。
   * @ko 컨텍스트 속성 비트 플래그. 기본값은 Default.
   */
  attributeFlags?: ContextAttribute;
  /**
   * Whether to request an sRGB framebuffer, defaulting to false.
   * @zh 是否请求 sRGB 帧缓冲，默认 false。
   * @ja sRGB フレームバッファを要求するかどうか。既定値は false。
   * @ko sRGB 프레임 버퍼 요청 여부. 기본값은 false.
   */
  sRgbCapable?: boolean;
}

export function settingsFromBuffer(
  buffer: ArrayBuffer,
): Readonly<Required<ContextSettings>> {
  return readonlyStruct<Required<ContextSettings>>(buffer, {
    depthBits: [ 'u32', 0 ], stencilBits: [ 'u32', 4 ],
    antiAliasingLevel: [ 'u32', 8 ], majorVersion: [ 'u32', 12 ],
    minorVersion: [ 'u32', 16 ], attributeFlags: [ 'u32', 20 ],
    sRgbCapable: [ 'bool', 24 ],
  });
}

/**
 * Copy and validate before graphics submission can cause side effects.
 * @zh 在图形提交可能引起副作用之前复制并验证。
 * @ja グラフィックスの送信が副作用を起こす前にコピーと検証を行う。
 * @ko 그래픽 제출로 부수 효과가 발생하기 전에 복사하고 검증한다.
 */
export function contextSettings(
  input: Readonly<ContextSettings>,
): Required<ContextSettings> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Expected ContextSettings');
  }
  const result = {
    depthBits: input.depthBits ?? 0,
    stencilBits: input.stencilBits ?? 0,
    antiAliasingLevel: input.antiAliasingLevel ?? 0,
    majorVersion: input.majorVersion ?? 1,
    minorVersion: input.minorVersion ?? 1,
    attributeFlags: input.attributeFlags ?? ContextAttribute.Default,
    sRgbCapable: input.sRgbCapable ?? false,
  };
  for (const key of [
    'depthBits', 'stencilBits', 'antiAliasingLevel', 'majorVersion',
    'minorVersion', 'attributeFlags',
  ] as const) {
    const value = result[key];
    if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
      throw new RangeError(`${key} must be an unsigned 32-bit integer`);
    }
  }
  if (result.stencilBits > 32) {
    throw new RangeError('stencilBits must be an integer from 0 to 32');
  }
  // eslint-disable-next-line no-bitwise
  if ((result.attributeFlags & ~5) !== 0) {
    throw new RangeError('Unknown context attribute flags');
  }
  if (typeof result.sRgbCapable !== 'boolean') {
    throw new TypeError('sRgbCapable must be a boolean');
  }
  return result;
}
