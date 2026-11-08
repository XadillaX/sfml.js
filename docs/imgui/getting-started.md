# ImGui quick start

Build a native window containing a counter, then connect the same frame loop to the scene inspector. This chapter assumes JavaScript and the SFML window/event basics; no C++ or Dear ImGui experience is required.

## Install and run

For source development, prepare Node.js 20 or 22, Python and a C++20 toolchain. Follow the [platform requirements](../sfml/getting-started.md#requirements), including a display and OpenGL. From the monorepo root:

```sh
node tools/bootstrap.cjs
node packages/sfml.js-imgui/examples/demo.cjs
```

Bootstrap installs dependencies, downloads native libraries and builds the packages and documentation. It is setup work, not a command to run every frame or every time you launch an example. After editing only ImGui TypeScript, use `npm run build:ts --prefix packages/sfml.js-imgui`.

For an application using published compatible versions, install `sfml.js` and `sfml.js-imgui` together:

```sh
npm install sfml.js sfml.js-imgui
```

If the version described here has not been published yet, use the monorepo examples. They import `../dist` to select the local build. The standalone program below imports package names: save it as `counter.cjs` in an application that has both packages installed, then run `node counter.cjs`.

## A complete counter

```js
const sf = require('sfml.js');
const { ImGui, SFML } = require('sfml.js-imgui');

const window = new sf.RenderWindow(
  new sf.VideoMode(new sf.Vector2u(800, 600)),
  'ImGui counter'
);
window.setFramerateLimit(60);
const clock = new sf.Clock();
let running = true;
let clicks = 0;

function drawControls() {
  ImGui.SetNextWindowSize([ 320, 160 ], ImGui.ImGuiCond.FirstUseEver);
  if (ImGui.Begin('Controls')) {
    if (ImGui.Button('Count')) {
      clicks++;
    }
    ImGui.TextUnformatted(`Clicks: ${clicks}`);
  }
  ImGui.End();
}

try {
  if (!SFML.Init(window)) {
    throw new Error('ImGui initialization failed');
  }
  while (running && window.isOpen()) {
    let event;
    while ((event = window.pollEvent()) !== undefined) {
      SFML.ProcessEvent(window, event);
      if (event.is('Closed')) {
        running = false;
      }
    }
    if (!running) {
      break;
    }
    SFML.Update(window, clock.restart().asSeconds());
    drawControls();

    window.clear(sf.Color.Black);
    SFML.Render(window);
    window.display();
  }
} finally {
  SFML.Shutdown(window);
  window.close();
}
```

The black native window contains a movable Controls panel. Count increments the value once per activation. Collapse and reopen the panel: the count remains because `clicks` belongs to the application. Closing the native window leaves the loop and releases ImGui before destroying the SFML window.

## What runs each frame

| Stage | Call | Responsibility |
| --- | --- | --- |
| Collect input | `pollEvent` → `SFML.ProcessEvent` | Forward every event, including text, focus and close events. |
| Start a frame | `SFML.Update(window, seconds)` | Update input and timing, then start the ImGui frame. |
| Declare controls | `drawControls()` | Read application state and let widgets update it. |
| Draw the scene | `window.clear`, optional `window.draw` | Prepare the SFML content behind the UI. |
| Draw the UI | `SFML.Render(window)` | Flush recorded SFML drawing and render ImGui. |
| Present | `window.display()` | Display the completed frame. |

Use elapsed **seconds**, not milliseconds. Do not also call `ImGui.NewFrame()` or `ImGui.Render()` in this loop: the backend already manages those operations. Construct persistent objects before the loop; recreate the widget declarations inside it.

`Begin` returning false means the panel contents can be skipped, for example when collapsed. Its `End` call is still required. This differs from tables, menus and popups; their pairing rules are covered in [layout](layout.md).

## Route input to the UI and the scene

ImGui needs every event even while the application should ignore a shortcut. Place application input handling after `ProcessEvent`. For example, add the following inside the event loop to make Escape request exit only when ImGui is not capturing keyboard input:

```js
const key = event.getIf('KeyPressed');
if (key?.code === sf.Keyboard.Key.Escape &&
    !SFML.GetIO().wantCaptureKeyboard) {
  running = false;
}
```

Use `wantCaptureMouse` to gate scene mouse actions and `wantCaptureKeyboard` to gate application keys. Capture flags represent the current ImGui frame state; in the usual event-before-update loop they reflect the previously completed UI update. Do not discard events on their way to ImGui, and always handle the native close event regardless of capture.

`wantTextInput` is a request for text input support, not a replacement for `wantCaptureKeyboard`. If the scene handles key releases, remember which key presses the UI consumed so their releases do not trigger scene actions. The [scene inspector](../../packages/sfml.js-imgui/examples/README.md#scene-inspector) demonstrates a Space shortcut and disables key repeat.

## Diagnose the first run

| Symptom | Check |
| --- | --- |
| Module or native binary is missing | Complete bootstrap, or install compatible published versions for this platform. |
| Window appears but there is no UI | Check the call order, successful `Init`, and whether a saved panel position is off-screen. |
| Buttons do not react | Forward all events and call `Update` once per rendered frame. |
| Panel cannot be moved or resized | Use `FirstUseEver` for its initial geometry; unconditional setters override user changes every frame. |
| Assertions when collapsing a panel | Call `End` even when `Begin` returns false. |
| Failure during exit | Stop the loop, call `Shutdown`, then close the still-live native window. |

Dear ImGui normally stores panel geometry in `imgui.ini` in the process working directory. Use a chosen application working directory; do not assume a new run will restore the initial panel placement.

Continue with [widgets and persistent state](widgets.md). API contracts: [Init](/reference/imgui/functions/SFML.Init.html), [Update](/reference/imgui/functions/SFML.Update.html), [Render](/reference/imgui/functions/SFML.Render.html), [Begin](/reference/imgui/functions/ImGui.Begin.html).
