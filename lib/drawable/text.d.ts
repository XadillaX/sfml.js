import * as Drawable from './drawable';
import { PluginPackageBound, PluginPackageColorAndThickness } from './plugin_package';
import { Transformable } from './transformable';
import * as Font from '../font';

type TextPluginPackage = Transformable & PluginPackageColorAndThickness & PluginPackageBound;

declare interface Text extends TextPluginPackage {}
declare class Text extends Drawable implements PluginPackage {
  constructor(str?: string, font?: Font, characterSize?: number = 30);
  setString(str: string): void;
  setFont(font: Font): void;
  setCharacterSize(characterSize: number): void;
  setLineSpacing(lineSpacing: number): void;
  setLetterSpacing(letterSpacing: number): void;
  setStyle(style: Text.Style): void;
}

declare namespace Text {
  enum Style {
    Regular = 0,
    Bold = 1 << 0,
    Italic = 1 << 1,
    Underlined = 1 << 2,
    StrikeThrough = 1 << 3,
  };
}

export = Text;
