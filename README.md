<p align="center">
  <img src="./assets/branding/sfml-js-symbol-pentagon.svg" width="80" height="80" align="middle" alt="" />
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/branding/sfml-js-wordmark-dark.svg" />
    <img src="./assets/branding/sfml-js-wordmark.svg" width="246" height="68" align="middle" alt="sfml.js" />
  </picture>
</p>

<p align="center">
Native windows, 2D graphics and audio for Node.js, built on <a href="https://www.sfml-dev.org/documentation/3.1.0/">SFML 3.1.0</a>.
</p>

<p align="center">
<a href="https://www.npmjs.org/package/sfml.js">
  <img src="https://img.shields.io/npm/v/sfml.js.svg?style=for-the-badge&colorA=FF7800&colorB=CC5600&label=NPM" alt="npm version" />
</a>
<a href="https://www.npmjs.org/package/sfml.js">
  <img src="https://img.shields.io/npm/dm/sfml.js.svg?style=for-the-badge&colorA=5DDB61&colorB=4BC74F&label=DOWNLOADS" alt="npm downloads" />
</a>
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
<a href="#contributors-"><img src="https://img.shields.io/badge/3-ALL%20CONTRIBUTORS?style=for-the-badge&colorA=FF69b4&colorB=cc47a4&label=ALL%20CONTRIBUTORS" alt="3 contributors" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
<a href="https://github.com/XadillaX/node-sfml">
  <img src="https://img.shields.io/github/stars/XadillaX/node-sfml.svg?style=for-the-badge&colorA=FBBD30&colorB=F2AA08&label=STAR" alt="GitHub stars" />
</a>
</p>

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

Build desktop multimedia applications in JavaScript or TypeScript: draw sprites, shapes and text, handle window events, play and record audio, and exchange data through SFML-style networking APIs.

[Website](https://sfml.js.org/) · [Quick start](docs/getting-started.md) · [Guides](docs/README.md) · [Type reference](https://sfml.js.org/reference/) · [Examples](examples/README.md)

## What is included

| Module | Capabilities |
| --- | --- |
| System | Typed vectors, angles, time, clocks, Unicode boundaries and seekable input streams |
| Window | Native windows, typed events, keyboard, mouse, joystick, clipboard and OpenGL contexts |
| Graphics | Sprites, shapes, Unicode text, cameras, shaders, vertex buffers and off-screen rendering |
| Audio | Sound effects, streaming music, recording, spatial audio and Worker-based processing |
| Network | TCP, UDP, packets, DNS, TLS, HTTP, FTP and SFTP through Node.js transports |

TypeScript declarations are included. Numeric values and resource views use typed arrays; rendering records state snapshots and submits commands in batches. See [core concepts](docs/concepts.md) for ownership, asynchronous loading and rendering behavior.

## Installation

```bash
npm install sfml.js
```

Installation compiles a native addon and downloads the matching SFML libraries. Prepare **Python and a C++20 toolchain** before installing:

| Platform | Download targets | Build tools |
| --- | --- | --- |
| macOS 13+ | x64, arm64 | Xcode Command Line Tools |
| Linux | x64 | GCC or Clang, make, X11, OpenGL and audio development libraries |
| Windows | x64, ia32 | Visual Studio 2022 C++ Build Tools |

The package declares Node.js `^18.19.0 || >=20.5.0`; CI is configured for Node.js 20 and 22 on Linux, macOS and Windows. Download targets are not a claim that every architecture and device is tested. See [installation instructions](docs/getting-started.md#requirements) for platform commands.

## Your first window

Save this as `hello.cjs` and run `node hello.cjs`:

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

The example creates a native desktop window. Run it in a graphical session. `setImmediate()` lets Node.js process I/O between frames; `display()` is synchronous and can wait for the frame limit or vertical sync.

For TypeScript, use named imports such as `import { RenderWindow, Vector2u } from 'sfml.js'`. File loading uses promises:

```javascript
async function loadSprite(filename) {
  const texture = new sf.Texture();
  if (!await texture.loadFromFile(filename)) {
    throw new Error(`Cannot load texture: ${filename}`);
  }
  return new sf.Sprite(texture);
}
```

## Documentation

The README and guides are available in English, Simplified Chinese, Japanese and Korean. English is the default.

| Start here | Continue with |
| --- | --- |
| [Quick start](docs/getting-started.md) | Installation, imports and your first window |
| [Core concepts](docs/concepts.md) | Values, resource lifetime, promises and draw snapshots |
| [API guide](docs/api.md) | System, Window, Graphics, Audio and Network navigation |
| [Examples](examples/README.md) | Runnable programs and their controls |
| [Development](docs/development.md) | Building, testing and contributing |

[TypeDoc](https://sfml.js.org/reference/) provides generated signatures and source comments. [SFML's C++ documentation](https://www.sfml-dev.org/documentation/3.1.0/) explains the upstream API; the guides here document JavaScript-specific behavior.

## Run the examples

![Breakout running in a native sfml.js window](assets/breakout.png)

Captured from [breakout.cjs](examples/breakout.cjs), a playable game using shapes, keyboard input and a JavaScript game loop. Move with Left/Right or A/D, launch with Space, and exit with Esc.

```bash
git clone https://github.com/XadillaX/node-sfml.git
cd node-sfml
npm ci
node examples/breakout.cjs
node examples/all-types.cjs --frames=120
node examples/network.cjs
```

The [ported examples](examples/ported/README.md) retain the legacy demonstrations with SFML 3 API adaptations. The two examples requiring `drawAsync()` or `displayAsync()` report `UNSUPPORTED`; those methods are not exposed by this binding.

[node-sfml-demos](https://github.com/XadillaX/node-sfml-demos) and [play-nes](https://github.com/XadillaX/play-nes) are projects built with the legacy API and require migration.

## Contributing

Use the [development guide](docs/development.md) to prepare your environment. Pull requests for fixes, documentation and examples are welcome. Include a runnable reproduction with bug reports, together with the Node.js version, operating system and architecture.

<a id="contributors-"></a>
<a id="maintenance-XadillaX"></a>

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://xcoder.in/"><img src="https://avatars.githubusercontent.com/u/2842176?v=4&amp;s=100" width="100px;" alt="Khaidi Chu"/><br /><sub><b>Khaidi Chu</b></sub></a><br /><a href="#maintenance-XadillaX" title="Maintenance">🚧</a> <a href="https://github.com/XadillaX/node-sfml/commits?author=XadillaX" title="Code">💻</a></td>
    <td align="center"><a href="https://pokemonworkshop.com/forum"><img src="https://avatars.githubusercontent.com/u/7335788?v=4&amp;s=100" width="100px;" alt="NuriYuri"/><br /><sub><b>NuriYuri</b></sub></a><br /><a href="https://github.com/XadillaX/node-sfml/commits?author=NuriYuri" title="Code">💻</a></td>
    <td align="center"><a href="https://godot.id"><img src="https://avatars.githubusercontent.com/u/40712686?v=4&amp;s=100" width="100px;" alt="Hanz"/><br /><sub><b>Hanz</b></sub></a><br /><a href="https://github.com/XadillaX/node-sfml/commits?author=HanzCEO" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## License

[MIT](LICENSE).
