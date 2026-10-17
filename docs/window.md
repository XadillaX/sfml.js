# Window

**English** · [简体中文](window.zh-CN.md) · [日本語](window.ja.md) · [한국어](window.ko.md)

> Use RenderWindow for 2D drawing, or Window when integrating OpenGL yourself. Window operations run on the main thread.

[API guide](api.md) · [Graphics](graphics.md) · [Quick start](getting-started.md)

## Creation and closing

```typescript
import { RenderWindow, VideoMode, Vector2u, State, Style } from 'sfml.js';

const window = new RenderWindow(
  new VideoMode(new Vector2u(800, 600)),
  'sfml.js',
  {
    style: Style.Default,
    state: State.Windowed,
    settings: { depthBits: 24, stencilBits: 8 },
  },
);
window.close();
```

Window and RenderWindow support default construction followed by `create()`. They also accept a Vector2u size or a bigint handle to an existing system window. `close()` closes the window, but the JS object can still create another window.

RenderWindow satisfies both `instanceof Window` and `instanceof RenderTarget`. It supports drawing directly, querying relative mouse coordinates and serving as the source of `Texture.update(window)`.

| API | Purpose |
| --- | --- |
| `get/setPosition()`, `get/setSize()` | Window position and client-area size |
| `setMinimumSize()`, `setMaximumSize()` | Size limits; undefined removes the limit |
| `setTitle()`, `setVisible()`, `setIcon()` | Title, visibility and RGBA icon |
| `requestFocus()`, `hasFocus()` | Request and query focus |
| `setMouseCursor()`, `setMouseCursorVisible()`, `setMouseCursorGrabbed()` | Cursor and mouse confinement |
| `setKeyRepeatEnabled()`, `setJoystickThreshold()` | Input behavior |
| `setVerticalSyncEnabled()`, `setFramerateLimit()` | Presentation timing |
| `getSettings()`, `getNativeHandle()` | Actual context settings and system window handle |

Positions use Vector2i; sizes use Vector2u. `setIcon(size, pixels)` accepts RGBA8 bytes; RenderWindow also accepts Image.

## Event loop

```typescript
import { RenderWindow, Vector2u, Keyboard } from 'sfml.js';

const window = new RenderWindow(new Vector2u(800, 600), 'Events');
window.setFramerateLimit(60);

function frame() {
  window.handleEvents({
    Closed: () => window.close(),
    KeyPressed: event => {
      if (event.code === Keyboard.Key.Escape) window.close();
    },
    Resized: event => console.log(event.size.x, event.size.y),
  });
  if (!window.isOpen()) return;
  window.clear();
  window.display();
  setImmediate(frame);
}
frame();
```

`handleEvents(handlers, fallback?)` drains the event queue, preferring the handler for each event type. You can also pass a single function to handle all events.

Use `pollEvent()` for manual dispatch:

```typescript
let event;
while ((event = window.pollEvent())) {
  if (event.is('Closed')) window.close();
  const key = event.getIf('KeyPressed');
  if (key) console.log(key.code, key.scancode);
}
```

`pollEvent()` returns undefined when no event is available. Event data is a union discriminated by kind; use `is()`, `getIf()` and `visit()` to narrow or access it. TextEntered uses Unicode code points.

`waitEvent(timeout = Time.Zero)` blocks synchronously and returns undefined on timeout or closing. Frame loops that also need to process Node I/O should use pollEvent/handleEvents and yield to the event loop between frames.

## Real-time input and system features

| API | Description |
| --- | --- |
| `Keyboard.isKeyPressed(key)` | Current key-code state |
| `Keyboard.isKeyPressed(scancode, 'scancode')` | Current physical scancode state |
| `Keyboard.localize()`/`delocalize()`/`getDescription()` | Current keyboard layout mapping and descriptions |
| `Mouse.getPosition(window?)`/`setPosition(position, window?)` | Uses screen coordinates when the window is omitted |
| `Mouse.isButtonPressed(button)` | Current mouse-button state |
| Joystick | Connection, buttons, axes and device identification; call `update()` without a window loop |
| Sensor | Check `isAvailable()` before enabling and reading |
| Clipboard | `getString()`/`setString()`, supporting JS Unicode strings |
| Touch | Touch-point state and position; SFML 3.1.0 deprecates the real-time Touch API |

Enums in input namespaces share the same objects as their top-level counterparts, such as `Keyboard.Key` and `KeyboardKey`.

`Cursor.createFromSystem()` and `createFromPixels()` return undefined on failure; constructor failures throw. A window keeps its active Cursor alive. On macOS, create a window before using system cursors.

VideoMode uses `size` and `bitsPerPixel`; `getDesktopMode()` and `getFullscreenModes()` query device modes, and `isValid()` validates fullscreen modes. Do not assume a machine provides any particular number of fullscreen modes.

## OpenGL and Vulkan

Context can create an independent OpenGL context, with activation, actual settings, extension queries and function-address queries. `Context.getActiveContextId()` returns a bigint, or `0n` when no context is active. `getFunction()` returns an address as bigint; calling it requires native code with a matching signature.

RenderWindow's `setActive()`, `pushGLStates()`, `popGLStates()` and `resetGLStates()` support mixing SFML with custom OpenGL. Submit SFML commands before modifying GL state directly, and pair push/pop in the same context.

The Vulkan namespace provides:

- `isAvailable(requireGraphics = true)`.
- `getFunction(name)`.
- `getGraphicsRequiredInstanceExtensions()`.

`window.createVulkanSurface(instance, allocator = 0n)` returns a bigint surface handle, or undefined on failure. The caller is responsible for the instance, allocator and surface destruction.

SFML 3.1.0's macOS build does not provide a Vulkan backend, so these queries report unavailability. Installing MoltenVK does not change SFML's platform branch. Successful Windows/X11 paths require validation in those environments.

## Run the demo

After building, run `node examples/window.cjs --frames=120` to inspect events, key codes, pointer positions and window properties; omit the frame count to run continuously.

| Key | Action |
| --- | --- |
| F1/F2 | Cursor type/visibility |
| F3/F4 | Key repeat/vertical sync |
| F5/F6 | Window size/size limits |
| F7/F8 | Change title/hide for 1 second, then restore |
| F9/F10 | Event API/move window |
| Esc | Close |

On macOS, you may also need to hold Fn. Determine joystick, sensor, touch and Vulkan capabilities from device queries; a passing CI build does not mean all of these hardware paths have been verified.

<a id="sfml-cpp-reference"></a>

## SFML C++ reference

See the original [Window](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Window.html), [RenderWindow](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1RenderWindow.html), [Event](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Event.html), [VideoMode](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1VideoMode.html) and [Cursor](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Cursor.html) references for upstream window, event and cursor concepts.

C++ event types and coordinate rules apply as documented here. JavaScript dispatch uses string event names and typed payloads, and frame loops yield through `setImmediate()`; `waitEvent()` remains synchronous.
