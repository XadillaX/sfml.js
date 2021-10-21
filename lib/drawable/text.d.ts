import * as CommonDrawable from './common_drawable';
import * as Font from '../font';

class Text extends CommonDrawable {
  constructor(str?: string, font?: Font, characterSize?: number = 30);
  setString(str: string): void;
  setFont(font: Font): void;
  setCharacterSize(characterSize: number): void;
  setLineSpacing(lineSpacing: number): void;
  setLetterSpacing(letterSpacing: number): void;
  setStyle(style: Text.Style): void;

  setPoint: void;
  setPointCount: void;
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
