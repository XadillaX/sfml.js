# Examples

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

> Run this repository's examples from its root directory. Run `npm ci` before the first launch, and `npm run build` after source changes. Graphics examples require a working display server and OpenGL window support. The official Vulkan example renders through Vulkan but also creates an unused OpenGL context with `sf.Window`.

[Project home](../README.md) · [Quick start](../docs/getting-started.md) · [Development guide](../docs/development.md)

## Start here

```sh
node examples/breakout.cjs
node examples/all-types.cjs --frames=120
node examples/render-texture.cjs --frames=120
node examples/network.cjs
```

After building, run scripts directly; `npm run demo:*` rebuilds as configured in package.json. Check each graphics script for supported frame-count, font and other arguments.

<a id="breakout"></a>

## Play Breakout

![Breakout rendered in a native window](../assets/breakout.png)

[breakout.cjs](breakout.cjs) is a complete game with brick collisions, three lives, scoring and win/loss states. Move with Left/Right or A/D; Space launches or restarts, P pauses, and Esc exits. Losing focus pauses interactive play.

Use `npm run demo:breakout` to build and launch. For a reproducible gameplay capture on macOS/Linux:

```sh
SFML_DEMO_SNAPSHOT=/tmp/sfml-breakout.png \
  node examples/breakout.cjs --autoplay --frames=900
```

The screenshot saves the actual native framebuffer at the final frame. `--autoplay` controls the paddle; `--frames` bounds the run. `node examples/breakout.cjs --self-test` checks the game logic without opening a window.

## Graphics and windows

| File | Demonstration | npm command |
| --- | --- | --- |
| [all-types.cjs](all-types.cjs) | Combined scene with value types, transforms, shapes, vertices and text | `demo:types` |
| [sprites.cjs](sprites.cjs) | Drawing large numbers of sprites | `demo` |
| [image.cjs](image.cjs) | Pixel editing, copying, masking and codecs | `demo:image` |
| [texture.cjs](texture.cjs) | Image loading, cropping, partial uploads and sampling | `demo:texture` |
| [sprite.cjs](sprite.cjs) | Sprite animation, flipping, colors and bounds | `demo:sprite` |
| [render-texture.cjs](render-texture.cjs) | Off-screen composition, texture views and draw snapshots | `demo:render-texture` |
| [drawable.cjs](drawable.cjs) | Custom composition, parent-child transforms, blending and stencil | `demo:drawable` |
| [vertex-array.cjs](vertex-array.cjs) | Dynamic tiles and contiguous vertices | `demo:vertices` |
| [text.cjs](text.cjs) | Text layout and vertex animation | `demo:text` |
| [window.cjs](window.cjs) | Window events, cursors and input diagnostics | `demo:window` |
| [system-window.cjs](system-window.cjs) | System and Window APIs | `demo:system-window` |

Most continuously rendering examples exit with Esc; pass `--frames=120` to limit their runtime. The text example accepts `--font=/path/to/font.ttf` and `--text=中文示例` to specify the font and text; Chinese text requires the corresponding glyphs.

Some diagnostic examples use internal repository preview and verification helpers. For a new application, use the window code in [Quick start](../docs/getting-started.md), which uses only public APIs.

## Audio and networking

| File | Demonstration |
| --- | --- |
| [audio.cjs](audio.cjs) | Sound, Music, Worker data production, effects and recording playback |
| [audio-worker.cjs](audio-worker.cjs) | tone and filter Worker factories loaded by the audio example |
| [network.cjs](network.cjs) | Local TCP, Packet, UDP and Selector |
| [sleep-err.cjs](sleep-err.cjs) | Asynchronous waiting and SFML log output |
| [vector-scalars.cjs](vector-scalars.cjs) | Vector operations with different numeric scalar types |

In the audio example, keys 1-4 switch modes, Space plays/pauses, S stops, E toggles effects, R/T start/stop recording, and arrow keys adjust panning and volume. Recording uses the system microphone; normal startup waits for key presses.

<a id="screenshots"></a>

## Screenshots

Graphics examples supporting `SFML_DEMO_SNAPSHOT` can save their rendered output. For example, on macOS/Linux:

```sh
SFML_DEMO_SNAPSHOT=/tmp/sfml-render-texture.png \
  node examples/render-texture.cjs --frames=2
```

PowerShell:

```powershell
$env:SFML_DEMO_SNAPSHOT = "$env:TEMP/sfml-render-texture.png"
node examples/render-texture.cjs --frames=2
Remove-Item Env:SFML_DEMO_SNAPSHOT
```

The combined all-types example saves PPM; other examples use the formats implemented by their entry points. Static screenshots demonstrate only the specified scene's rendering result, not throughput, sound output or input-device testing.

<a id="game-projects"></a>

## Game projects

[node-sfml-demos](https://github.com/XadillaX/node-sfml-demos) contains Bomberman, Breakout, Tetris, Doodle Jump and Arkanoid implementations using sfml.js.

Clone this separate repository into your projects directory, then install dependencies and launch from the game's own directory. For Bomberman:

```sh
git clone https://github.com/XadillaX/node-sfml-demos.git
cd node-sfml-demos/bomberman
npm install
node index.js
```

See the [repository README](https://github.com/XadillaX/node-sfml-demos#readme) for game directories, controls and upstream C++ sources. The [native build requirements](../docs/getting-started.md#requirements) also apply.

## SFML official examples

[official/](official/README.md) contains 24 ports from the official SFML
repository, including tennis, shaders, text, terrain, audio, networking,
X11, the OpenGL window, mixed SFML/OpenGL rendering, Vulkan, Cocoa and Win32 integration.
Each entry retains its upstream scene and assets; the guide lists controls,
Node adaptations, sources and licenses. Only `android` remains unported.

```sh
node examples/official/tennis/Tennis.cjs
```

Vulkan targets Linux/X11 and Windows x64, using `nvk` 0.8.0 with a Vulkan
loader and a driver/device supporting 4× anisotropic filtering. SFML handles
the window, events and surface; nvk drives Vulkan directly without a custom
native bridge. SFML Graphics still uses OpenGL. SFML's Vulkan integration
is unavailable on macOS at compile time; MoltenVK alone does not enable it.
Native rendering and interaction checks passed on Linux/X11 and Windows.
See the [platform guide](official/README.md#platform) for controls and requirements.

```sh
cd examples/official
npm ci --prefix vulkan --ignore-scripts
node vulkan/Vulkan.cjs
```

## Legacy examples

[ported/](ported/README.md) retains the original 16 scripts: 14 run with the current API, while 2 depend on legacy asynchronous drawing APIs and report that they are unsupported.

```sh
npm run demo:ported
```

all-types-scene.cjs and bitmap-label.cjs are demo helpers, not standalone application entry points.
