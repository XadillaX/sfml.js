import { Color } from '../color';
import { Drawable } from './drawable';
import { IntRect } from '../rect';
import { PluginPackageBound, PluginPackageTexture } from './plugin_package';
import { Texture } from '../texture';
import { Transformable } from './transformable';

type SpritePluginPackage = Transformable & PluginPackageTexture & PluginPackageBound;

export interface Sprite extends SpritePluginPackage {}
export class Sprite extends Drawable {
  constructor(texture?: Texture, rect?: IntRect);
  constructor(srcSprite: Sprite);

  setColor(color: number | Color): void;
  getColor(): Color;
}
