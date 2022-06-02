import { Drawable } from './drawable';

const TEXTURE = Symbol('TexturePlugin#texture');

export class TexturePlugin extends Drawable {
  [TEXTURE]: Texture;
}
