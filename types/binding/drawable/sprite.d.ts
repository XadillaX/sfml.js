declare module '*/binding.node' {
  interface Sprite extends
    Drawable,
    PluginPackageDrawableBoundsPrototype,
    PluginPackageTexturePrototype,
    TransformablePlugin {
    setColor(color: Color): void;
    getColor(): Color;
  }
  export class Sprite {
    constructor(texture?: Texture, rect?: IntRect);
    constructor(_: string, another: Sprite);
  }
}
