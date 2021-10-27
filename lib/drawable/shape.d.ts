import { Drawable } from './drawable';
import { PluginPackageBound, PluginPackageColorAndThickness, PluginPackageTexture } from './plugin_package';
import { Transformable } from './transformable';
import { Vector2F } from '../vector2';

type ShapePluginPackage = Transformable & PluginPackageColorAndThickness & PluginPackageTexture & PluginPackageBound;

export interface Shape extends ShapePluginPackage {}
export class Shape extends Drawable {
  setPointCount(count: number): void;
  getPointCount(): number;
  getPoint(idx: number): Vector2F;
  setPoint(idx: number, point: Vector2F): void;
}
