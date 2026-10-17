# Quick Start

**English** · [简体中文](getting-started.zh-CN.md) · [日本語](getting-started.ja.md) · [한국어](getting-started.ko.md)

> Goal: install sfml.js and run a native window that responds to close events. This guide uses the current SFML 3.1.0 API.

[Documentation](README.md) · [Core concepts](concepts.md) · [Examples](../examples/README.md)

<a id="requirements"></a>

## Requirements

sfml.js is a native Node.js addon. Installation downloads SFML shared libraries for the current platform and compiles the binding locally; Python and a C++20 toolchain are required.

The package declares Node.js `^18.19.0 || >=20.5.0`; the existing CI configuration uses Node.js 20 and 22. Node.js 22 is a suitable choice for a new setup.

### macOS

Download targets support x64 and arm64 on macOS 13+. Install Xcode Command Line Tools and confirm Python is available:

```sh
xcode-select --install
python3 --version
```

The Node.js architecture determines which SFML architecture is downloaded; check it with `node -p process.arch`.

### Linux

Automatic downloads currently support x64. On Ubuntu/Debian, install dependencies as configured in the repository CI:

```sh
sudo apt-get update
sudo apt-get install -y \
  build-essential python3 \
  libgl1-mesa-dev libx11-dev libxrandr-dev libxcursor-dev libxi-dev \
  libudev-dev libfreetype-dev libflac-dev libvorbis-dev \
  libopenal-dev libmbedtls-dev
```

Headless CI also requires `xvfb` and `xauth`; see the [development guide](development.md#testing) for execution instructions. Use the equivalent development packages on other distributions.

### Windows

Install Python and Visual Studio 2022 Build Tools, selecting "Desktop development with C++" and the Windows SDK. Current download targets are x64 and ia32; the compiler toolchain must match the Node.js architecture.

## Install the package

Run from your application directory:

```sh
npm install sfml.js
```

TypeScript declarations are included in the package. npm installs the `latest` tag by default; inspect the installed version and distribution tags with:

```sh
npm ls sfml.js
npm view sfml.js dist-tags
```

To try the current repository directly, follow the [development guide](development.md#get-the-source), run `npm ci`, then run the repository examples.

Installed SFML files are stored in the dependency package's `third_party/sfml/`; the native module is at `build/Release/sfml.node`. Downloads require access to SFML's GitHub Release; the cache is reused when the version and architecture match.

`SFML_DOWNLOAD_MIRROR` specifies a download proxy prefix. The final URL is `<prefix>/<full GitHub URL>`; the proxy must support this format. See the [download URL implementation](../tools/lib_downloader_urls.cjs) for configuration.

## Open your first window

Create `hello.cjs`:

```javascript
const sf = require('sfml.js');

const window = new sf.RenderWindow(
  new sf.VideoMode(new sf.Vector2u(800, 600)),
  'Hello, sfml.js',
);
const circle = new sf.CircleShape({ radius: 80 });
circle.setPosition(new sf.Vector2f(320, 220));
circle.setFillColor(new sf.Color(76, 190, 110));
window.setFramerateLimit(60);

function frame() {
  window.handleEvents({
    Closed: () => window.close(),
    KeyPressed: event => {
      if (event.code === sf.Keyboard.Key.Escape) window.close();
    },
  });
  if (!window.isOpen()) return;

  window.clear(new sf.Color(24, 28, 32));
  window.draw(circle);
  window.display();
  setImmediate(frame);
}

frame();
```

Run `node hello.cjs` to display a green circle in a window. Press Esc or click the close button to exit.

Each frame handles events first, then updates the scene, clears, draws and presents. `setImmediate(frame)` continues drawing on the next event-loop iteration, allowing file I/O, networking and Worker messages to run. `display()` is synchronous and may wait for a frame limit or vertical sync; there is no corresponding `displayAsync()` method.

## Use TypeScript

Import public types from the package entry point:

```typescript
import { RenderWindow, Vector2u } from 'sfml.js';

const window = new RenderWindow(new Vector2u(800, 600), 'TypeScript');
window.close();
```

Microsecond time values and some network integers use `bigint`, so your application's TypeScript `target` must be at least `ES2020`. Use `require('sfml.js')` in CommonJS applications; no separate type package is needed.

## Load an image

Create the resource, wait for successful loading, then create the object that uses it:

```javascript
const sf = require('sfml.js');

async function loadSprite(filename) {
  const texture = new sf.Texture();
  if (!await texture.loadFromFile(filename)) {
    throw new Error(`Cannot load texture: ${filename}`);
  }
  return new sf.Sprite(texture);
}
```

Pass the returned Sprite to the window's `draw()` call. Relative file paths are resolved against the working directory at call time.

Ordinary missing-file or decoding failures usually return `false`; type errors, range errors and runtime failures are reported by throwing or rejecting a promise. Do not catch exceptions while ignoring the loading return value.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `sfml.node` cannot be found | Check whether installation scripts were disabled; after confirming the toolchain, run `npm rebuild sfml.js` in the application |
| `Unsupported SFML platform` | Compare the supported systems with `process.arch`; there is currently no automatic Linux arm64 download |
| Cannot create a window or OpenGL context | Check for a graphical session and OpenGL driver; use Xvfb in Linux CI |
| Window is unresponsive or asynchronous tasks never finish | Check whether the frame loop yields to the event loop through `setImmediate` or an equivalent |
| `await load...()` did not throw, but nothing appears | Check the boolean return value, file path, Sprite position and texture rectangle |
| Text does not display Chinese characters | Use a font covering the required characters and load it with `Font.openFromFile()` |

Continue with [core concepts](concepts.md), or run the [complete examples](../examples/README.md).

<a id="sfml-cpp-reference"></a>

## SFML C++ reference

The [original SFML 3.1.0 C++ reference](https://www.sfml-dev.org/documentation/3.1.0/) provides upstream concepts and examples. C++ file-loading constructors and blocking window loops cannot be copied verbatim into JavaScript: use the asynchronous resource methods and event-loop yielding shown here.
