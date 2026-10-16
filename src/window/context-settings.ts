import { readonlyStruct } from '../internal/struct-view';

/** OpenGL 上下文属性位标志。 */
export enum ContextAttribute {
  /** 默认兼容上下文。 */
  Default = 0,
  /** 请求核心配置上下文。 */
  Core = 1,
  /** 请求调试上下文。 */
  Debug = 4,
}

/** SFML context requests; omitted members use SFML's defaults. */
export interface ContextSettings {
  /** 深度缓冲位数，默认 0。 */
  depthBits?: number;
  /** 模板缓冲位数，范围 0～32，默认 0。 */
  stencilBits?: number;
  /** 多重采样抗锯齿级别，默认 0。 */
  antiAliasingLevel?: number;
  /** 请求的 OpenGL 主版本，默认 1。 */
  majorVersion?: number;
  /** 请求的 OpenGL 次版本，默认 1。 */
  minorVersion?: number;
  /** 上下文属性位标志，默认 Default。 */
  attributeFlags?: ContextAttribute;
  /** 是否请求 sRGB 帧缓冲，默认 false。 */
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

/** Copy and validate before graphics submission can cause side effects. */
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
