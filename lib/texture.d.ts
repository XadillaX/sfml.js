import { IntRect } from './rect';

declare class Texture {
  constructor();
  loadFromFile(filename: string, area?: IntRect): Promise<void>;
  update(texture: Texture): void;
  update(texture: Texture, x: number, y: number): void;
}

export = Texture;
