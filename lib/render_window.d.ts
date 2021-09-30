import * as VideoMode from './video_mode';
import * as Drawable from './drawable/base';
import * as Event from './poll_event';

declare class RenderWindow {
  constructor(videoMode?: VideoMode, title?: string, style?: RenderWindow.Style);

  clear(color: number = 0): void;
  close(): void;
  draw(content: Drawable): void;
  display(): void;
  isOpen(): boolean;

  pollEvent(): Event;
}

declare namespace RenderWindow {
  enum Style {
    None = 0,
    Titlebar = 1,
    Resize = 2,
    Close = 3,
    Fullscreen = 4,
    Default = 7,
  }
}

export = RenderWindow;
