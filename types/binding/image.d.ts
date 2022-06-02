declare module '*/binding.node' {
  export class Image {
    constructor();

    static setRealConstructor(cons: Function): void;

    copy(
      another: Image,
      destX: Uint32,
      destY: Uint32,
      applyAlpha?: boolean,
    ): void;
    copy(
      another: Image,
      destX: Uint32,
      destY: Uint32,
      rect: IntRect | null,
      applyAlpha?: boolean,
    ): void;
    create(
      width: Uint32,
      height: Uint32,
      data?: Uint8Array | ArrayBuffer | Buffer | Uint8[] | Color,
    ): void;

    loadFromMemory(buff: Buffer): boolean;
    safeToFile(
      filename: string,
      callback: (err?: Error | undefined) => void,
    ): void;

    getSize(): Vecto2U;
    createMaskFromColor(color: Color, alpha: Uint32): void;
    setPixel(x: Uint32, y: Uint32, color: Color): void;
    getPixel(x: Uint32, y: Uint32): Uint32;

    duplicatePixels(): Buffer;
    flipHorizontally(): void;
    flipVertically(): void;
  }
}
