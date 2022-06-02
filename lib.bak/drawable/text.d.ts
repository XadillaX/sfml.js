import { Drawable } from './drawable';
import { PluginPackageBound, PluginPackageColorAndThickness } from './plugin_package';
import { Transformable } from './transformable';
import { Font } from '../font';

type TextPluginPackage = Transformable & PluginPackageColorAndThickness & PluginPackageBound;

export interface Text extends TextPluginPackage {}
export class Text extends Drawable implements TextPluginPackage {
  constructor(str?: string, font?: Font, characterSize?: number);
  setString(str: string): void;
  setFont(font: Font): void;
  setCharacterSize(characterSize: number): void;
  setLineSpacing(lineSpacing: number): void;
  setLetterSpacing(letterSpacing: number): void;
  setStyle(style: Text.Style): void;
}
export namespace Text {
  enum Style {
    Regular = 0,
    Bold = 1 << 0,
    Italic = 1 << 1,
    Underlined = 1 << 2,
    StrikeThrough = 1 << 3,
  }
}
