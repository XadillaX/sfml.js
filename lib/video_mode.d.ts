declare class VideoMode {
  static getDesktopMode(): VideoMode;
  static getFullscreenModes(): VideoMode[];

  constructor(modeWidth?: number, modeHeight?: number, modeBitsPerPixel: number = 32);

  isValid(): boolean;

  width: number;
  height: number;
  bitsPerPixel: number;
}

export = VideoMode;
