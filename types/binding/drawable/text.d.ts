declare module '*/binding.node' {
  interface TextStyleInterface {
    Regular: 0;
    Bold: 1;
    Italic: 2;
    Underlined: 4;
    StrikeThrough: 8;
  }

  export type TextStyle = _RangeOf<0, 15>;

  interface Text extends
    Drawable,
    PluginPackageDrawableBoundsPrototype,
    PluginPackageColorAndThicknessPrototype,
    TransformablePlugin {
    setFont(font: Font): void;
    setString(str: string): void;
    setCharacterSize(size: Uint32): void;
    setLineSpacing(spacing: number): void;
    setLetterSpacing(spacing: number): void;
    setStyle(style: TextStyle): void;
  }
  export class Text {
    constructor(str: string, font: Font, characterSize: Uint32);
    static Style: TextStyleInterface;
  }
}
