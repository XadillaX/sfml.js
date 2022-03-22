import { Color } from './color';
import { Drawable } from './drawable/drawable';
import { Event } from './poll_event';
import { Image } from './image';
import { VideoMode } from './video_mode';
import { Vector2U } from './vector2';
import { Vector2I } from '..';

type ContextSettings = {
  depthBits: number;
  stencilBits: number;
  antialiasingLevel: number;
  majorVersion: number;
  minorVersion: number;
  attributeFlags: number;
  sRgbCapable: boolean;
};

export class RenderWindow {
  constructor(
    videoMode?: VideoMode,
    title?: string,
    style?: RenderWindow.Style
  );

  create(windowHandle: number): void;
  create(videoMode: VideoMode, title: string, style?: RenderWindow.Style): void;
  capture(): Image;
  clear(color: number | Color): void;
  close(): void;
  draw(content: Drawable): void;
  drawAsync(content: Drawable): Promise<void>;
  display(): void;
  displayAsync(): Promise<void>;

  getPosition(): Vector2I;
  getSettings(): ContextSettings;
  getSize(): Vector2U;

  hasFocus(): boolean;
  isOpen(): boolean;

  pollEvent(): Event;
  requestFocus(): void;

  setActive(active?: boolean): void;
  setFramerateLimit(limit: number): void;
  setIcon(width: number, height: number, icon: Buffer): void;
  setJoystickThreshold(threshold: number): void;
  setKeyRepeatEnabled(enabled: boolean): void;
  setMouseCursorVisible(visible: boolean): void;
  setMouseCursorGrabbed(grabbed: boolean): void;
  setPosition(position: Vector2I): void;
  setTitle(title: string): void;
  setVisible(visible: boolean): void;
  setVerticalSyncEnabled(enabled: boolean): void;
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
