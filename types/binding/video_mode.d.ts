declare module '*/binding.node' {
  enum VideoModeProperty {
    kWidth = 0,
    kHeight = 1,
    kBitsPerPixel = 2,
  }

  export class VideoMode {
    constructor();
    constructor(width: Uint32, height: Uint32, bitsPerPixel?: Uint32);

    getProperty(property: VideoModeProperty): Uint32;
    setProperty(property: VideoModeProperty, value: Uint32): void;

    isValid(): boolean;

    static getDesktopMode(): VideoMode;
    static getFullScreenModes(): VideoMode[];
    static kWidth: 0;
    static kHeight: 1;
    static kBitsPerPixel: 2;
  }
}
