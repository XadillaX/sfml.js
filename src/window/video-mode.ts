import { native } from '../internal/native';
import { numericProperties } from '../internal/numeric-properties';
import { Vector2, Vector2u } from '../system/vector2';

export function windowSize(value: Readonly<Vector2u>, positive = true): void {
  if (!(value instanceof Vector2) || value.scalarType !== 'u32') {
    throw new TypeError('Expected a Vector2u');
  }
  if (positive && (value.x === 0 || value.y === 0)) {
    throw new RangeError('Expected positive window dimensions');
  }
}

export function unsigned(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new RangeError('Expected an unsigned 32-bit integer');
  }
}

/** 视频模式：像素尺寸和每像素位数。 */
export class VideoMode {
  private readonly sizeValue: Vector2u;
  /** 每像素位数，例如 32。 */
  declare bitsPerPixel: number;

  /** 创建尺寸和色深均为零的空模式。 */
  constructor();
  /** 创建指定像素尺寸的模式，默认每像素 32 位。 */
  constructor(size: Readonly<Vector2u>, bitsPerPixel?: number);
  /** 深复制视频模式。 */
  constructor(source: Readonly<VideoMode>);
  constructor(
    source?: Readonly<Vector2u> | Readonly<VideoMode>, bitsPerPixel = 32,
  ) {
    const size = source instanceof VideoMode ? source.size
      : source as Readonly<Vector2u> | undefined;
    if (size !== undefined) windowSize(size, false);
    this.sizeValue = size === undefined ? new Vector2u() : new Vector2u(size);
    numericProperties(this, { bitsPerPixel: 0 });
    this.bitsPerPixel = source instanceof VideoMode
      ? source.bitsPerPixel : source === undefined ? 0 : bitsPerPixel;
    unsigned(this.bitsPerPixel);
  }

  /** 模式的像素宽高，可直接修改分量。 */
  get size(): Vector2u {
    return this.sizeValue;
  }

  /** 复制像素尺寸到当前模式。 */
  set size(value: Readonly<Vector2u>) {
    windowSize(value, false);
    this.sizeValue.x = value.x;
    this.sizeValue.y = value.y;
  }

  /** 返回当前桌面使用的视频模式。 */
  static getDesktopMode(): VideoMode {
    const [ width, height, bits ] = native.getDesktopVideoMode();
    return new VideoMode(new Vector2u(width, height), bits);
  }

  /** 返回系统支持的全屏模式，按 SFML 的优先顺序排列。 */
  static getFullscreenModes(): VideoMode[] {
    return native.getFullscreenVideoModes().map(([ width, height, bits ]) =>
      new VideoMode(new Vector2u(width, height), bits));
  }

  /** 判断该模式是否可用于全屏窗口。 */
  isValid(): boolean {
    windowSize(this.size, false);
    unsigned(this.bitsPerPixel);
    return native.isVideoModeValid(this.size.x, this.size.y, this.bitsPerPixel);
  }
}

export function compareVideoModes(
  left: Readonly<VideoMode>, right: Readonly<VideoMode>,
): number {
  if (!(left instanceof VideoMode) || !(right instanceof VideoMode)) {
    throw new TypeError('Expected two VideoMode operands');
  }
  return left.bitsPerPixel - right.bitsPerPixel ||
    left.size.x - right.size.x || left.size.y - right.size.y;
}
