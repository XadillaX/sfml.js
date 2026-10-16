<p align="center">
  <img src="https://github.com/XadillaX/node-sfml/blob/main/assets/sfml.js.png?raw=true" alt="sfml.js" />
</p>

<p align="center">
Node.js binding for <a href="https://www.sfml-dev.org/">SFML</a> - a Simple and Fast cross-platform Multimedia Library.
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

## Installation

```bash
npm install sfml.js
```

Requires Node.js `^18.19.0 || >=20.5.0`. Installation builds a native addon; see the [build prerequisites](docs/development.md#准备环境).

## Usage

- TypeDoc: [https://sfml.js.org/](https://sfml.js.org/);
- API reference: [System, Window & Graphics](docs/api.md), [Audio](docs/audio.md), [Network](docs/network.md);
- TypeScript declarations are included in the package. See the [API exports](src/index.ts);
- SFML's official documentation: [SFML 3.1.0](https://www.sfml-dev.org/documentation/3.1.0/).

## Examples

- [Examples in this repository](examples/): Graphics, audio, window events and networking;
- [node-sfml-demos](https://github.com/XadillaX/node-sfml-demos): Several small example games built with the legacy API;
- [play-nes](https://github.com/XadillaX/play-nes): A cross-platform desktop NES emulator powered by OpenGL in Node.js, built with the legacy API.

> PR is welcomed. You can add your own sfml.js example.

For running repository examples or contributing, see the [development guide](docs/development.md).

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
