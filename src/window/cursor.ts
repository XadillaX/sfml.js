import { native, type NativeGraphicsHandle } from '../internal/native';
import { graphicsNative } from '../internal/graphics-state';
import { Vector2u } from '../system/vector2';
import { SFMLError } from '../system/error';
import { CursorType } from './gen/constants';
import { windowSize } from './video-mode';

export function rgbaPixels(size: Readonly<Vector2u>, pixels: Uint8Array): void {
  windowSize(size);
  if (!(pixels instanceof Uint8Array)) {
    throw new TypeError('Expected RGBA bytes in a Uint8Array');
  }
  if (pixels.byteLength < size.x * size.y * 4) {
    throw new RangeError('Pixel buffer is smaller than the requested size');
  }
}

function systemCursor(type: CursorType): NativeGraphicsHandle<'cursor'> |
undefined {
  if (!Number.isInteger(type) || typeof CursorType[type] !== 'string') {
    throw new RangeError('Unknown cursor type');
  }
  return native.createSystemCursor(type);
}

function pixelCursor(
  pixels: Uint8Array, size: Readonly<Vector2u>, hotspot: Readonly<Vector2u>,
): NativeGraphicsHandle<'cursor'> | undefined {
  rgbaPixels(size, pixels);
  windowSize(hotspot, false);
  if (hotspot.x >= size.x || hotspot.y >= size.y) {
    throw new RangeError('Cursor hotspot must be inside the cursor');
  }
  return native.createPixelCursor(pixels, size.x, size.y, hotspot.x, hotspot.y);
}

/** 系统光标或自定义 RGBA 像素光标。 */
export class Cursor {
  /** 系统光标形状枚举。 */
  static readonly Type = CursorType;
  readonly [graphicsNative]: NativeGraphicsHandle<'cursor'>;

  /** 创建系统光标；平台不支持时抛出 SFMLError。 */
  constructor(type: CursorType);
  /** 从 RGBA8 像素创建光标，size 和点击热点 hotspot 均以像素计；失败抛出 SFMLError。 */
  constructor(
    pixels: Uint8Array, size: Readonly<Vector2u>, hotspot: Readonly<Vector2u>,
  );
  constructor(
    source: CursorType | Uint8Array,
    size?: Readonly<Vector2u>, hotspot?: Readonly<Vector2u>,
  ) {
    const handle = typeof source === 'number' ? systemCursor(source)
      : pixelCursor(source, size!, hotspot!);
    if (!handle) throw new SFMLError('Failed to create cursor');
    this[graphicsNative] = handle;
  }

  /** 尝试创建系统光标；平台不支持时返回 undefined。 */
  static createFromSystem(type: CursorType): Cursor | undefined {
    return Cursor.fromHandle(systemCursor(type));
  }

  /** 尝试从 RGBA8 像素创建光标；热点须在尺寸内，创建失败返回 undefined。 */
  static createFromPixels(
    pixels: Uint8Array, size: Readonly<Vector2u>, hotspot: Readonly<Vector2u>,
  ): Cursor | undefined {
    return Cursor.fromHandle(pixelCursor(pixels, size, hotspot));
  }

  private static fromHandle(
    handle: NativeGraphicsHandle<'cursor'> | undefined,
  ): Cursor | undefined {
    return handle === undefined ? undefined : Object.assign(
      Object.create(Cursor.prototype), { [graphicsNative]: handle },
    ) as Cursor;
  }
}
