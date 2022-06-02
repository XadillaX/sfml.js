import { Color } from './color';
import { IntRect } from './rect';
import { Vector2F } from './vector2';

export class Image {
  constructor();

  getSize(): Vector2F;
  copy(src: Image, destX: number, destY: number, sourceRect?: IntRect, applyAlpha?: boolean): void;
  create(width: number, height: number, colorOrPixels: Color | number[] | ArrayBuffer | Uint8Array | Buffer | number): void;
  createMaskColor(color: Color | number, alpha?: number): void;

  loadFromMemory(buff: Buffer): boolean;
  loadFromFile(filename: string): Promise<boolean>;
  loadFromFileSync(filename: string): boolean;

  saveToFile(filename: string): Promise<void>;

  setPixel(x: number, y: number, color: Color | number): void;
  getPixel(x: number, y: number): Color;

  duplicatePixels(): Buffer;

  flipHorizontally(): void;
  flipVertically(): void;
}
