import * as Drawable from './drawable/base';
import * as Image from './image';
import * as Event from './poll_event';
import * as VideoMode from './video_mode';
import { Vector2U } from './vector2';

declare class RenderWindow {
  constructor(videoMode?: VideoMode, title?: string, style?: RenderWindow.Style);

  capture(): Image;
  clear(color: number): void;
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

declare namespace RenderWindow {
  enum Style {
    None = 0,
    Titlebar = 1 << 0,
    Resize = 1 << 1,
    Close = 1 << 2,
    Fullscreen = 1 << 3,
    Default = Titlebar | Resize | Close,
  }
}

export = RenderWindow;
