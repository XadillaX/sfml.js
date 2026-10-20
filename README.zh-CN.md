<p align="center">
  <img src="./assets/branding/sfml-js-symbol-pentagon.svg" width="80" height="80" align="middle" alt="" />
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/branding/sfml-js-wordmark-dark.svg" />
    <img src="./assets/branding/sfml-js-wordmark.svg" width="246" height="68" align="middle" alt="sfml.js" />
  </picture>
</p>

<p align="center">
基于 <a href="https://www.sfml-dev.org/documentation/3.1.0/">SFML 3.1.0</a>，为 Node.js 提供原生窗口、二维图形与音频。
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

[English](README.md) · **简体中文** · [日本語](README.ja.md) · [한국어](README.ko.md)

使用 JavaScript 或 TypeScript 构建桌面多媒体应用：绘制精灵、形状和文字，处理窗口事件，播放与录制音频，并通过 SFML 风格的网络 API 交换数据。

[官网](https://sfml.js.org/zh/) · [快速开始](docs/getting-started.zh-CN.md) · [指南](docs/README.zh-CN.md) · [类型参考](https://sfml.js.org/zh/reference/) · [示例](examples/README.zh-CN.md)

## 功能

| 模块 | 能力 |
| --- | --- |
| System | 类型化向量、角度、时间、时钟、Unicode 边界和可寻址输入流 |
| Window | 原生窗口、类型化事件、键盘、鼠标、摇杆、剪贴板和 OpenGL 上下文 |
| Graphics | 精灵、形状、Unicode 文字、相机、着色器、顶点缓冲和离屏渲染 |
| Audio | 音效、流式音乐、录音、空间音频和 Worker 处理 |
| Network | 基于 Node.js 传输的 TCP、UDP、Packet、DNS、TLS、HTTP、FTP 和 SFTP |

软件包包含 TypeScript 类型声明。数值和资源视图使用类型化数组；绘制记录状态快照并批量提交命令。所有权、异步加载与绘制行为见 [核心概念](docs/concepts.zh-CN.md)。

## 安装

```bash
npm install sfml.js
```

安装时编译原生扩展并下载匹配的 SFML 库。请先准备 **Python 和 C++20 工具链**：

| 平台 | 下载目标 | 构建工具 |
| --- | --- | --- |
| macOS 13+ | x64、arm64 | Xcode Command Line Tools |
| Linux | x64 | GCC 或 Clang、make、X11、OpenGL 和音频开发库 |
| Windows | x64、ia32 | Visual Studio 2022 C++ Build Tools |

软件包声明的 Node.js 范围为 `^18.19.0 || >=20.5.0`；CI 配置覆盖 Linux、macOS 和 Windows 上的 Node.js 20、22。支持下载不代表每种架构与设备都经过测试。各平台命令见 [安装说明](docs/getting-started.zh-CN.md#requirements)。

## 第一个窗口

保存为 `hello.cjs`，执行 `node hello.cjs`：

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

示例创建原生桌面窗口，需要在图形会话中运行。`setImmediate()` 让 Node.js 在帧间处理 I/O；`display()` 是同步操作，可能等待帧率限制或垂直同步。

TypeScript 使用具名导入，例如 `import { RenderWindow, Vector2u } from 'sfml.js'`。文件加载使用 Promise：

```javascript
async function loadSprite(filename) {
  const texture = new sf.Texture();
  if (!await texture.loadFromFile(filename)) {
    throw new Error(`Cannot load texture: ${filename}`);
  }
  return new sf.Sprite(texture);
}
```

## 文档

README 和指南提供英文、简体中文、日文与韩文版本，默认语言为英文。

| 入口 | 内容 |
| --- | --- |
| [快速开始](docs/getting-started.zh-CN.md) | 安装、导入和第一个窗口 |
| [核心概念](docs/concepts.zh-CN.md) | 值、资源生命周期、Promise 和绘制快照 |
| [API 指南](docs/api.zh-CN.md) | System、Window、Graphics、Audio 和 Network 导航 |
| [示例](examples/README.zh-CN.md) | 可运行程序及操作说明 |
| [开发指南](docs/development.zh-CN.md) | 构建、测试与贡献 |

[TypeDoc](https://sfml.js.org/zh/reference/) 提供自动生成的方法签名与源码注释。[SFML 官方 C++ 文档](https://www.sfml-dev.org/documentation/3.1.0/) 解释上游 API；本项目指南说明 JavaScript 的适配行为。

## 运行示例

![在 sfml.js 原生窗口中运行的打砖块游戏](assets/breakout.png)

画面采集自 [breakout.cjs](examples/breakout.cjs)。游戏用 JavaScript 处理图形、键盘输入与游戏循环。方向键左／右或 A／D 移动挡板，Space 发球，Esc 退出。

```bash
git clone https://github.com/XadillaX/node-sfml.git
cd node-sfml
npm ci
node examples/breakout.cjs
node examples/all-types.cjs --frames=120
node examples/network.cjs
```

[旧版示例](examples/ported/README.zh-CN.md) 保留原演示，并适配 SFML 3 API。其中依赖 `drawAsync()` 或 `displayAsync()` 的两个入口报告 `UNSUPPORTED`；当前绑定不提供这两个方法。

[node-sfml-demos](https://github.com/XadillaX/node-sfml-demos) 包含使用 sfml.js 实现的 Bomberman、Breakout、Tetris、Doodle Jump 和 Arkanoid。安装与启动命令见 [游戏项目](examples/README.zh-CN.md#game-projects)。

[16-sfml.js-games-ported](https://github.com/XadillaX/16-sfml.js-games-ported) 将 [jsyqrt/games](https://github.com/jsyqrt/games) 中原本使用 C++ 和 SFML 编写的全部 16 个游戏迁移为 ClojureScript + sfml.js。游戏清单与 nbb 启动命令见 [16 个游戏](examples/README.zh-CN.md#16-games)。

[play-nes](https://github.com/XadillaX/play-nes) — 基于 sfml.js 和 JSNES 的桌面 NES 模拟器。

## 参与贡献

请按 [开发指南](docs/development.zh-CN.md) 准备环境。欢迎提交修复、文档与示例的 PR。反馈问题时，请提供可运行的复现程序，以及 Node.js 版本、操作系统和架构。

<a id="contributors-"></a>
<a id="maintenance-XadillaX"></a>

## 贡献者 ✨

感谢以下贡献者（[表情含义](https://allcontributors.org/docs/en/emoji-key)）：

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

本项目遵循 [all-contributors](https://github.com/all-contributors/all-contributors) 规范，欢迎各种形式的贡献。

## 许可证

[MIT](LICENSE)。
