import { FloatRect, IntRect } from './rect';

interface Info {
  family: string;
}

interface Glyph {
  advance: number;
  bounds: FloatRect;
  textureRect: IntRect;
}

export class Font {
  constructor();
  loadFromFileSync(filename: string): boolean;
  loadFromFile(filename: string): Promise<void>;
  getInfo(): Info;
  getGlyph(codePoint: number, characterSize: number, bold: boolean, outlineThickness?: number): Glyph;
  getKerning(first: number, second: number, characterSize: number): number;
  getLineSpacing(characterSize: number): number;
  getUnderlinePosition(characterSize: number): number;
  getUnderlineThickness(characterSize: number): number;
}
