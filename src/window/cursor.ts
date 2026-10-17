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

/**
 * A system cursor or a custom RGBA pixel cursor.
 * @zh 系统光标或自定义 RGBA 像素光标。
 * @ja システムカーソルまたはカスタム RGBA ピクセルカーソル。
 * @ko 시스템 커서 또는 사용자 정의 RGBA 픽셀 커서.
 */
export class Cursor {
  /**
   * The system cursor shape enumeration.
   * @zh 系统光标形状枚举。
   * @ja システムカーソル形状の列挙型。
   * @ko 시스템 커서 모양 열거형.
   */
  static readonly Type = CursorType;
  readonly [graphicsNative]: NativeGraphicsHandle<'cursor'>;

  /**
   * Create a system cursor; throw SFMLError if unsupported by the platform.
   * @zh 创建系统光标；平台不支持时抛出 SFMLError。
   * @ja システムカーソルを作成する。プラットフォーム非対応時は SFMLError をスローする。
   * @ko 시스템 커서를 생성한다. 플랫폼이 지원하지 않으면 SFMLError를 던진다.
   */
  constructor(type: CursorType);
  /**
   * Create a cursor from RGBA8 pixels; size and click hotspot are measured in
   * pixels. Throw SFMLError on failure.
   * @zh 从 RGBA8 像素创建光标，size 和点击热点 hotspot 均以像素计；
   * 失败抛出 SFMLError。
   * @ja RGBA8 ピクセルからカーソルを作成する。size とクリック位置 hotspot は
   * ピクセル単位。失敗時は SFMLError をスローする。
   * @ko RGBA8 픽셀로 커서를 생성한다. size와 클릭 지점 hotspot은 픽셀 단위이다.
   * 실패 시 SFMLError를 던진다.
   */
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

  /**
   * Try to create a system cursor; return undefined if unsupported by the
   * platform.
   * @zh 尝试创建系统光标；平台不支持时返回 undefined。
   * @ja システムカーソルの作成を試みる。プラットフォーム非対応時は undefined を返す。
   * @ko 시스템 커서 생성을 시도한다. 플랫폼이 지원하지 않으면 undefined를 반환한다.
   */
  static createFromSystem(type: CursorType): Cursor | undefined {
    return Cursor.fromHandle(systemCursor(type));
  }

  /**
   * Try to create a cursor from RGBA8 pixels; the hotspot must be within
   * the dimensions. Return undefined if creation fails.
   * @zh 尝试从 RGBA8 像素创建光标；热点须在尺寸内，创建失败返回 undefined。
   * @ja RGBA8 ピクセルからのカーソル作成を試みる。ホットスポットは寸法内に
   * なければならない。作成失敗時は undefined を返す。
   * @ko RGBA8 픽셀로 커서 생성을 시도한다. 핫스폿은 크기 범위 안에 있어야 한다.
   * 생성 실패 시 undefined를 반환한다.
   */
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
