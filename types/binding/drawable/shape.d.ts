declare module '*/binding.node' {
  interface Shape extends
    Drawable,
    PluginPackageDrawableBoundsPrototype,
    PluginPackageColorAndThicknessPrototype,
    TransformablePlugin {
    getPointCount(): Uint32;
    getPoint(index: Uint32): Vector2F;
  }
  export class Shape {}
}
