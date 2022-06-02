declare module '*/binding.node' {
  export class Texture {
    constructor();

    create(width: Uint32, height: Uint32): void;
    loadFromFile(
      filename: string,
      area: IntRect | undefined,
      callback: (err?: Error | undefined) => void,
    );
    loadFromMemory(buff: Buffer, area?: IntRect): boolean;
    loadFromFileSync(filename: string, area?: IntRect): boolean;

    getSize(): Vector2U;
    setSmooth(smooth: boolean): void;

    updateByImage(img: Image, x: Uint32, y: Uint32): void;
    updateByTexture(another: Texture, x: Uint32, y: Uint32): void;
    updateByPixels(
      buff: Buffer,
      x: number = 0,
      y: number = 0,
      width?: number,
      height?: number,
    );
  }
}
