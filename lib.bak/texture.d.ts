import { Image } from './image';
import { IntRect } from './rect';
import { Vector2F } from './vector2';

export class Texture {
  constructor();

  create(x: number, y: number): void;

  loadFromMemory(buff: Buffer, area?: IntRect): boolean;
  loadFromFile(filename: string, area?: IntRect): Promise<void>;
  loadFromFileSync(filename: string, area?: IntRect): boolean;
  update(texture: Texture): void;
  update(texture: Texture, x: number, y: number): void;
  update(image: Image): void;
  update(image: Image, x: number, y: number): void;
  update(buffer: Buffer, width?: number, height?: number, x?: number, y?: number): void;

  getSize(): Vector2F;
  setSmooth(smooth?: boolean): void;
}
