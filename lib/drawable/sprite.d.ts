import * as Color from '../color';
import * as CommonDrawable from './common_drawable';
import * as Texture from '../texture';
import { IntRect } from '../rect';

class Sprite extends CommonDrawable {
  constructor(texture?: Texture, rect?: IntRect);

  setTexture(texture: Texture): void;
  getTexture(): Texture;

  setTextureRect(rect: IntRect): void;
  getTextureRect(): IntRect;

  setColor(color: number | Color): void;
  getColor(): Color;

  setPoint: void;
  setPointCount: void;
}

export = Sprite;
