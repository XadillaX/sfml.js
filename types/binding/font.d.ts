declare module '*/binding.node' {
  export interface FontInfo {
    family: string;
  }

  export interface FontGlyph {
    advance: number;

    // To be overridden.
    bounds: any;
    textureRect: any;
  }

  export class Font {
    constructor();

    loadFromMemory(buff: Buffer): boolean;

    loadFromFileSync(filename: string): boolean;
    loadFromFile(filename: string, callback: (err: Error | undefined) => void);

    getInfo(): FontInfo;
    getGlyph(
      codePoint: Uint32,
      characterSize: Uint32,
      bold: boolean,
      outlineThickness: number,
    ): FontGlyph;

    getKerning(first: Uint32, second: Uint32, characterSize: Uint32): number;
    getLineSpacing(characterSize: Uint32): number;
    getUnderlinePosition(characterSize: Uint32): number;
    getUnderlineThickness(characterSize: Uint32): number;
  }
}
