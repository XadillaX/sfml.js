declare module '*/binding.node' {
  interface RenderWindowStyleInterface {
    None: 0;
    Titlebar: 1;
    Resize: 2;
    Close: 4;
    Fullscreen: 8;

    Default: 7;
  }

  interface RenderWindowSettings {
    depthBits: Uint32;
    stencilBits: Uint32;
    antialiasingLevel: Uint32;
    majorVersion: Uint32;
    minorVersion: Uint32;
    attributeFlags: Uint32;
    sRgbCapable: boolean;
  }

  type RenderWindowStyle = _RangeOf<0, 15>;

  export class RenderWindow {
    constructor();
    constructor(mode: VideoMode, title: string, style?: RenderWindowStyle);

    create(handle: Uint32): void;
    create(mode: VideoMode, title: string, style?: RenderWindowStyle);
    capture(): Image;
    clear(color: Color): void;
    close(): void;
    display(): void;
    displayAsync(callback: (err: string | null, _: null) => void): void;
    drawDrawable(drawable: Drawable): void;
    drawDrawableAsync(
      drawable: Drawable,
      callback: (err: string | null, _: null) => void,
    ): void;
    isOpen(): boolean;
    getSize(): Vector2U;
    hasFocus(): boolean;
    setJoystickThreshold(threshold: Float): void;
    getPosition(): Vector2I;
    setPosition(pos: Vector2I): void;
    setTitle(title: string): void;
    setIcon(width: Uint32, height: Uint32, pixels: Buffer): void;
    getSettings(): RenderWindowSettings;
    requestFocus(): void;
    pollEvent(): Event | undefined;

    setVisible(visible: boolean): void;
    getVisible(): boolean;

    setVerticalSyncEnabled(verticalSyncEnabled: boolean): void;
    getVerticalSyncEnabled(): boolean;

    setMouseCursorVisible(visible: boolean): void;
    getMouseCursorVisible(): boolean;

    setMouseCursorGrabbed(grabbed: boolean): void;
    getMouseCursorGrabbed(): boolean;

    setKeyRepeatEnabled(enabled: boolean): void;
    getKeyRepeatEnabled(): boolean;

    setFramerateLimit(limit: Uint32): void;
    getFramerateLimit(): Uint32;

    setActive(active: boolean): void;
    isActive(): boolean;

    static Style: RenderWindowStyleInterface;
  }
}
