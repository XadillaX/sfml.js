import { Color } from './color';
import { Drawable } from './drawable/drawable';
import { Event } from './poll_event';
import { Image } from './image';
import { VideoMode } from './video_mode';
import { Vector2U } from './vector2';

export class RenderWindow {
  constructor(videoMode?: VideoMode, title?: string, style?: RenderWindow.Style);

  capture(): Image;
  clear(color: number | Color): void;
  close(): void;
  draw(content: Drawable): void;
  display(): void;
  isOpen(): boolean;

  pollEvent(): Event;

  setVisible(visible: boolean): void;
  setVerticalSyncEnabled(enabled: boolean): void;
  setMouseCursorVisible(visible: boolean): void;
  setMouseCursorGrabbed(grabbed: boolean): void;
  setKeyRepeatEnabled(enabled: boolean): void;
  setFramerateLimit(limit: number): void;
  setActive(active?: boolean): void;

  getSize(): Vector2U;
}
export namespace RenderWindow {
  enum Style {
    None = 0,
    Titlebar = 1 << 0,
    Resize = 1 << 1,
    Close = 1 << 2,
    Fullscreen = 1 << 3,
    Default = Titlebar | Resize | Close,
  }
}
