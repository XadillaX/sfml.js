# Legacy Examples

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

> This directory retains the 16 demo entry points from the legacy `example/` directory, preserving filenames with a `.cjs` extension. 14 entry points are adapted to the current API; 2 asynchronous drawing entry points report `UNSUPPORTED` and exit with code 2.

[All examples](../README.md) · [API guide](../../docs/api.md) · [Development guide](../../docs/development.md)

These scripts show how legacy scenes behave with the current API. For new applications, start with [Quick start](../../docs/getting-started.md).

## Running

Run from the project root:

```sh
# The initial build includes the native module
npm run build

# Open the combined demo window
npm run demo:ported

# Run any ported script
node examples/ported/texture.cjs
node examples/ported/sound_buffer.cjs
```

## Example entry points

| File | Demonstration |
|------|----------|
| color.cjs | Color construction, component writes and JSON output |
| vector2.cjs | 2D vectors, scalar conversion, copying and named operations |
| vector3.cjs | 3D vectors, scalar conversion, copying and named operations |
| time.cjs | Time factories, bigint microseconds and Time.Zero |
| rect.cjs | position/size, containment and intersections, preserving the original invalid-input demonstration |
| video_mode.cjs | Video modes, sizes, NaN input, desktop and fullscreen mode queries |
| vertex.cjs | Vertex member views and VertexArray access |
| joystick.cjs | Joystick connection, identification, button counts and axis queries |
| sensor.cjs | Availability, enabling and reading of all sensors |
| touch.cjs | Touch state and position queries |
| font.cjs | Failed loading, font loading, glyph at code point 1/character size 10 and line spacing |
| texture.cjs | Failed loading, GIF loading, cropping, texture copying and Sprite |
| sound_buffer.cjs | WAV decoding, PCM copying, saving and reloading |
| render_window.cjs | The original combined scene's shapes, vertex lines, gradient pixels, cropping, masks, Sprite, Chinese text and audio |
| render_window_display_async.cjs | Unsupported: original synchronous/asynchronous display comparison; displayAsync is missing |
| render_window_display_draw_async.cjs | Unsupported: original combined asynchronous drawing scene; drawAsync and displayAsync are missing |

## Window interaction

`render_window.cjs` uses the original `VideoMode.getFullscreenModes()[3]`, title `hello` and style 5. It preserves the red background, original scene layout, default volume, a single Sound playback at startup, and Music configured to loop without starting playback. Scheduling remains `setFramerateLimit(60)` and `setImmediate(frame)`.

| Key | Action |
|------|------|
| Esc/close event | Close the window; Esc also retains real-time querying |
| Left | Add 1 to both x and y of the window position |
| LControl | Recreate at 800 x 600 while held and enable vertical sync |
| LAlt | Print context settings |
| RAlt | Change the window title |
| S | Request the virtual keyboard, subject to system support |

The original mouse logic is also preserved: read desktop and window-relative coordinates every frame, clamp to the original mode bounds, then call Mouse.setPosition. The original key-repeat behavior remains.

On non-Windows systems, the combined example still saves `/tmp/xxx.png`. The SoundBuffer example still saves `.game.wav` under `os.tmpdir()`, then reloads it without automatically deleting it.

## Porting conventions

Adaptations cover import paths, SFML 3 arguments and method names, value types and asynchronous loading. Scene parameters, animation formulas, draw order, input, file output and frame scheduling preserve the original logic. Images, fonts and audio are in `assets/`.

The two entry points with async in their names do not emulate legacy APIs with synchronous drawing or fixed sleeps. The display comparison retains 10 frames, a 50 ms heartbeat, the setImmediate wrapper, displayAsync and error checks after closing; the combined asynchronous scene retains sequential await drawAsync/displayAsync calls.

Coordinates and sizes use Vector2, rotations use Angle, colors use Color, and events are read through `is/getIf`; numeric enum iteration filters reverse mappings. Loading operations check booleans; the original missing paths `abcdefg`/`abc.jpg` are preserved. console.log/JSON.stringify receive new objects directly, with output following the new types' own representation. Integer conversion and invalid-value handling also follow the new value types, without emulating legacy validation in the examples.

Each script contains its demo logic independently, no longer using shared scenes or output-formatting helpers. Formerly synchronous resource loads now use await in the original order, not parallel preloading.
