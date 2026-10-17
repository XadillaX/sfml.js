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

/**
 * A video mode: pixel dimensions and bits per pixel.
 * @zh 视频模式：像素尺寸和每像素位数。
 * @ja ビデオモード。ピクセル寸法とピクセルあたりのビット数。
 * @ko 비디오 모드. 픽셀 크기와 픽셀당 비트 수.
 */
export class VideoMode {
  private readonly sizeValue: Vector2u;
  /**
   * Bits per pixel, such as 32.
   * @zh 每像素位数，例如 32。
   * @ja ピクセルあたりのビット数。例：32。
   * @ko 픽셀당 비트 수. 예: 32.
   */
  declare bitsPerPixel: number;

  /**
   * Create an empty mode with zero dimensions and color depth.
   * @zh 创建尺寸和色深均为零的空模式。
   * @ja 寸法と色深度がともにゼロの空のモードを作成する。
   * @ko 크기와 색 깊이가 모두 0인 빈 모드를 생성한다.
   */
  constructor();
  /**
   * Create a mode with the specified pixel dimensions, defaulting to 32 bits
   * per pixel.
   * @zh 创建指定像素尺寸的模式，默认每像素 32 位。
   * @ja 指定したピクセル寸法のモードを作成する。既定ではピクセルあたり 32 ビット。
   * @ko 지정한 픽셀 크기의 모드를 생성한다. 기본값은 픽셀당 32비트이다.
   */
  constructor(size: Readonly<Vector2u>, bitsPerPixel?: number);
  /**
   * Deep-copy a video mode.
   * @zh 深复制视频模式。
   * @ja ビデオモードをディープコピーする。
   * @ko 비디오 모드를 깊은 복사한다.
   */
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

  /**
   * The mode's pixel width and height; components can be modified directly.
   * @zh 模式的像素宽高，可直接修改分量。
   * @ja モードのピクセル幅と高さ。成分は直接変更できる。
   * @ko 모드의 픽셀 너비와 높이. 성분을 직접 수정할 수 있다.
   */
  get size(): Vector2u {
    return this.sizeValue;
  }

  /**
   * Copy pixel dimensions into the current mode.
   * @zh 复制像素尺寸到当前模式。
   * @ja 現在のモードにピクセル寸法をコピーする。
   * @ko 현재 모드에 픽셀 크기를 복사한다.
   */
  set size(value: Readonly<Vector2u>) {
    windowSize(value, false);
    this.sizeValue.x = value.x;
    this.sizeValue.y = value.y;
  }

  /**
   * Return the video mode currently used by the desktop.
   * @zh 返回当前桌面使用的视频模式。
   * @ja デスクトップが現在使用しているビデオモードを返す。
   * @ko 데스크톱이 현재 사용하는 비디오 모드를 반환한다.
   */
  static getDesktopMode(): VideoMode {
    const [ width, height, bits ] = native.getDesktopVideoMode();
    return new VideoMode(new Vector2u(width, height), bits);
  }

  /**
   * Return system-supported fullscreen modes in SFML's preference order.
   * @zh 返回系统支持的全屏模式，按 SFML 的优先顺序排列。
   * @ja システムが対応する全画面モードを SFML の優先順に返す。
   * @ko 시스템이 지원하는 전체 화면 모드를 SFML의 우선순위대로 반환한다.
   */
  static getFullscreenModes(): VideoMode[] {
    return native.getFullscreenVideoModes().map(([ width, height, bits ]) =>
      new VideoMode(new Vector2u(width, height), bits));
  }

  /**
   * Test whether this mode can be used for a fullscreen window.
   * @zh 判断该模式是否可用于全屏窗口。
   * @ja このモードが全画面ウィンドウに使用できるか判定する。
   * @ko 이 모드를 전체 화면 윈도우에 사용할 수 있는지 판별한다.
   */
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
