# 快速开始

[English](getting-started.md) · **简体中文** · [日本語](getting-started.ja.md) · [한국어](getting-started.ko.md)

> 目标：安装 sfml.js，运行一个能响应关闭事件的原生窗口。本文使用当前 SFML 3.1.0 API。

[文档首页](README.zh-CN.md) · [核心概念](concepts.zh-CN.md) · [示例](../examples/README.zh-CN.md)

<a id="requirements"></a>

## 安装环境

sfml.js 是 Node.js 原生扩展。安装时下载当前平台的 SFML 动态库，并在本机编译绑定；需要 Python 和 C++20 工具链。

包声明的 Node.js 范围是 `^18.19.0 || >=20.5.0`，现有 CI 配置使用 Node.js 20、22。初次配置可使用 Node.js 22。

### macOS

支持 macOS 13+ 的 x64、arm64 下载目标。安装 Xcode Command Line Tools，并确认 Python 可用：

```sh
xcode-select --install
python3 --version
```

Node.js 的架构决定下载的 SFML 架构，可通过 `node -p process.arch` 查看。

### Linux

当前自动下载支持 x64。Ubuntu／Debian 可按仓库 CI 安装依赖：

```sh
sudo apt-get update
sudo apt-get install -y \
  build-essential python3 \
  libgl1-mesa-dev libx11-dev libxrandr-dev libxcursor-dev libxi-dev \
  libudev-dev libfreetype-dev libflac-dev libvorbis-dev \
  libopenal-dev libmbedtls-dev
```

无显示器的 CI 还需要 `xvfb` 和 `xauth`，运行方法见 [开发指南](development.zh-CN.md#testing)。其他发行版使用对应的开发包。

### Windows

安装 Python 和 Visual Studio 2022 Build Tools，选择「使用 C++ 的桌面开发」及 Windows SDK。当前下载目标为 x64、ia32，编译工具链须与 Node.js 架构一致。

## 安装软件包

在应用目录执行：

```sh
npm install sfml.js
```

TypeScript 类型声明已包含在包内。npm 默认安装 `latest` 标签；可用以下命令查看已安装版本和发布标签：

```sh
npm ls sfml.js
npm view sfml.js dist-tags
```

如果需要直接体验当前仓库，按 [开发指南](development.zh-CN.md#get-the-source) 执行 `npm ci` 后运行仓库示例。

安装文件保存在依赖包的 `third_party/sfml/`，原生模块在 `build/Release/sfml.node`。下载需要访问 SFML 的 GitHub Release；版本和架构匹配时复用缓存。

`SFML_DOWNLOAD_MIRROR` 可指定下载代理前缀。最终 URL 为 `<前缀>/<完整 GitHub URL>`，所用代理必须支持这种格式，配置见 [下载地址实现](../tools/lib_downloader_urls.cjs)。

## 打开第一个窗口

新建 `hello.cjs`：

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

执行 `node hello.cjs`，窗口显示绿色圆形。按 Esc 或点击关闭按钮退出。

每帧先处理事件，再更新场景、清屏、绘制、呈现。`setImmediate(frame)` 在下一轮事件循环继续绘制，让文件、网络和 Worker 消息有机会运行。`display()` 是同步接口，帧率限制和垂直同步可能使它等待；它没有 `displayAsync()` 对应方法。

## 使用 TypeScript

从包入口导入公开类型：

```typescript
import { RenderWindow, Vector2u } from 'sfml.js';

const window = new RenderWindow(new Vector2u(800, 600), 'TypeScript');
window.close();
```

微秒时间与部分网络整数使用 `bigint`，应用的 TypeScript `target` 至少为 `ES2020`。在 CommonJS 应用中使用 `require('sfml.js')`，无需单独安装类型包。

## 加载图片

先创建资源，等待加载成功，再创建使用它的对象：

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

将返回的 Sprite 放入窗口的 `draw()` 调用。相对文件路径按调用时的工作目录解析。

普通文件不存在或解码失败通常返回 `false`；类型错误、范围错误和运行异常通过抛错或 Promise rejection 报告。不能只捕获异常而忽略加载返回值。

## 常见问题

| 现象 | 检查项 |
| --- | --- |
| 找不到 `sfml.node` | 安装脚本是否被禁用；确认工具链后在应用中执行 `npm rebuild sfml.js` |
| `Unsupported SFML platform` | 对照支持的系统与 `process.arch`；当前没有 Linux arm64 自动下载包 |
| 无法创建窗口或 OpenGL 上下文 | 是否有图形会话及 OpenGL 驱动；Linux CI 使用 Xvfb |
| 窗口无响应、异步任务不完成 | 帧循环是否通过 `setImmediate` 等方式让出事件循环 |
| `await load...()` 没抛错但没有画面 | 检查布尔返回值、文件路径、Sprite 位置和纹理矩形 |
| 文本不显示中文 | 使用覆盖目标字符的字体，通过 `Font.openFromFile()` 加载 |

接下来阅读 [核心概念](concepts.zh-CN.md)，或直接运行 [完整示例](../examples/README.zh-CN.md)。

<a id="sfml-cpp-reference"></a>

## SFML C++ 参考

[SFML 3.1.0 官方首页](https://www.sfml-dev.org/documentation/3.1.0/) 提供对应的 C++ 窗口、精灵、文字和音乐示例，可用于理解整体流程。C++ 的文件构造函数和阻塞循环不能原样搬到 JS：本绑定使用 Promise 加载资源，并通过 `setImmediate()` 在帧间让出事件循环。
