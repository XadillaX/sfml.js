import { Color } from '../color';
import { FloatRect } from '../rect';
import { Texture } from '../texture';

export interface PluginPackageTexture {
  setTexture(texture: Texture): void;
  getTexture(): Texture | null;

  setTextureRect(rect: FloatRect): void;
  getTextureRect(): FloatRect;
}

export interface PluginPackageBound {
  getLocalBounds(): FloatRect;
  getGlobalBounds(): FloatRect;
}

export interface PluginPackageColorAndThickness {
  setFillColor(color: number | Color): void;
  getFillColor(): Color;

  setOutlineColor(color: number | Color): void;
  getOutlineColor(): Color;

  setOutlineThickness(thickness: number): void;
  getOutlineThickness(): number;
}

export function setPluginPackageBound(proto: any): void;
export function setPluginPackageTexture(proto: any): void;
export function setPluginPackageColorAndThickness(proto: any): void;
