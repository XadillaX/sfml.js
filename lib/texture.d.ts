import { IntRect } from './rect';
import { Vector2F } from './vector2';

declare class Texture {
  constructor();
  loadFromFile(filename: string, area?: IntRect): Promise<void>;
  update(texture: Texture): void;
  update(texture: Texture, x: number, y: number): void;

  getSize(): Vector2F;
  setSmooth(smooth?: boolean): void;
}

export = Texture;
