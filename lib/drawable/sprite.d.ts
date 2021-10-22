import * as Color from '../color';
import * as Drawable from './drawable';
import { IntRect } from '../rect';
import { PluginPackageBound, PluginPackageTexture } from './plugin_package';
import * as Texture from '../texture';
import { Transformable } from './transformable';

type SpritePluginPackage = Transformable & PluginPackageTexture & PluginPackageBound;

declare interface Sprite extends SpritePluginPackage {}
declare class Sprite extends Drawable {
  constructor(texture?: Texture, rect?: IntRect);
  setColor(color: number | Color): void;
  getColor(): Color;
}

export = Sprite;
