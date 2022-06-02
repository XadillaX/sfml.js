declare module '*/binding.node' {
  export class Drawable {}

  interface PluginPackageDrawableBoundsPrototype {
    getLocalBounds(): FloatRect;
    getGlobalBounds(): FloatRect;
  }

  interface PluginPackageColorAndThicknessPrototype {
    setFillColor(color: Color): void;
    getFillColor(): Color;

    setOutlineColor(color: Color): void;
    getOutlineColor(): Color;

    setOutlineThickness(thickness: Float): void;
    getOutlineThickness(): Float;
  }

  interface PluginPackageTexturePrototype {
    setTexture(texture: Texture): void;
    getTexture(): Texture;
    setTextureRect(rect: IntRect): void;
    getTextureRect(): IntRect;
  }
}
