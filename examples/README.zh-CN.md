# 示例

[English](README.md) · **简体中文** · [日本語](README.ja.md) · [한국어](README.ko.md)

> 本仓库的示例在仓库根目录运行。首次运行先 `npm ci`；修改源码后执行 `npm run build`。图形示例需要可用的显示服务和 OpenGL 窗口支持。官方 Vulkan 示例通过 Vulkan 渲染，但 `sf.Window` 仍会创建一个未用于绘制的 OpenGL 上下文。

[项目首页](../README.zh-CN.md) · [快速开始](../docs/getting-started.zh-CN.md) · [开发指南](../docs/development.zh-CN.md)

## 从这里开始

```sh
node examples/breakout.cjs
node examples/all-types.cjs --frames=120
node examples/render-texture.cjs --frames=120
node examples/network.cjs
```

已构建时直接运行脚本；`npm run demo:*` 会按 package.json 重新构建。图形入口支持的帧数、字体等参数以各脚本为准。

<a id="breakout"></a>

## 玩一局打砖块

![在原生窗口中渲染的打砖块游戏](../assets/breakout.png)

[breakout.cjs](breakout.cjs) 包含砖块碰撞、三条生命、计分与胜负状态。方向键左／右或 A／D 移动挡板，Space 发球或重新开始，P 暂停，Esc 退出。交互模式下失去焦点会暂停。

`npm run demo:breakout` 构建并启动游戏。macOS／Linux 可用以下命令复现游戏截图：

```sh
SFML_DEMO_SNAPSHOT=/tmp/sfml-breakout.png \
  node examples/breakout.cjs --autoplay --frames=900
```

截图保存最后一帧的真实原生画面。`--autoplay` 自动控制挡板，`--frames` 限制运行帧数。`node examples/breakout.cjs --self-test` 无需打开窗口即可检查游戏逻辑。

## 图形与窗口

| 文件 | 演示内容 | npm 命令 |
| --- | --- | --- |
| [all-types.cjs](all-types.cjs) | 值类型、变换、形状、顶点与文字的综合场景 | `demo:types` |
| [sprites.cjs](sprites.cjs) | 大量精灵绘制 | `demo` |
| [image.cjs](image.cjs) | 像素编辑、复制、遮罩与编解码 | `demo:image` |
| [texture.cjs](texture.cjs) | 图片加载、裁剪、局部上传与采样 | `demo:texture` |
| [sprite.cjs](sprite.cjs) | 精灵动画、翻转、颜色与边界 | `demo:sprite` |
| [render-texture.cjs](render-texture.cjs) | 离屏合成、纹理视图与绘制快照 | `demo:render-texture` |
| [drawable.cjs](drawable.cjs) | 自定义组合、父子变换、混合与模板 | `demo:drawable` |
| [vertex-array.cjs](vertex-array.cjs) | 动态瓦片与连续顶点 | `demo:vertices` |
| [text.cjs](text.cjs) | 文字排版与顶点动画 | `demo:text` |
| [window.cjs](window.cjs) | 窗口事件、光标和输入诊断 | `demo:window` |
| [system-window.cjs](system-window.cjs) | System 与 Window 接口 | `demo:system-window` |

大多数持续渲染示例可通过 Esc 退出，传入 `--frames=120` 可限制运行时长。text 示例使用 `--font=/path/to/font.ttf` 和 `--text=中文示例` 指定字体与文字；中文需要对应字形。

部分诊断示例使用仓库内部预览和验证辅助函数。应用入门请复制 [快速开始](../docs/getting-started.zh-CN.md) 中仅使用公开接口的窗口代码。

## 音频与网络

| 文件 | 演示内容 |
| --- | --- |
| [audio.cjs](audio.cjs) | Sound、Music、Worker 供数、音效与录音回放 |
| [audio-worker.cjs](audio-worker.cjs) | tone 与 filter Worker 工厂，由音频示例加载 |
| [network.cjs](network.cjs) | 本机 TCP、Packet、UDP、Selector |
| [sleep-err.cjs](sleep-err.cjs) | 异步等待与 SFML 日志输出 |
| [vector-scalars.cjs](vector-scalars.cjs) | 不同数值标量的向量运算 |

audio 示例中，1～4 切换模式，Space 播放／暂停，S 停止，E 切换音效，R／T 开始／结束录音，方向键调整声像和音量。录音会使用系统麦克风；普通启动等待按键。

<a id="screenshots"></a>

## 截图

支持 `SFML_DEMO_SNAPSHOT` 的图形示例可保存运行画面。例如在 macOS／Linux：

```sh
SFML_DEMO_SNAPSHOT=/tmp/sfml-render-texture.png \
  node examples/render-texture.cjs --frames=2
```

PowerShell：

```powershell
$env:SFML_DEMO_SNAPSHOT = "$env:TEMP/sfml-render-texture.png"
node examples/render-texture.cjs --frames=2
Remove-Item Env:SFML_DEMO_SNAPSHOT
```

综合 all-types 示例保存 PPM，其他示例按各自入口实现保存格式。静态截图仅证明指定场景的渲染结果，不代表吞吐、声音输出或输入设备测试。

<a id="game-projects"></a>

## 游戏项目

[node-sfml-demos](https://github.com/XadillaX/node-sfml-demos) 包含使用 sfml.js 实现的 Bomberman、Breakout、Tetris、Doodle Jump 和 Arkanoid。

在存放项目的目录中克隆这个独立仓库，再进入各游戏目录安装依赖并启动。以 Bomberman 为例：

```sh
git clone https://github.com/XadillaX/node-sfml-demos.git
cd node-sfml-demos/bomberman
npm install
node index.js
```

游戏目录、操作方式与上游 C++ 源码见 [仓库 README](https://github.com/XadillaX/node-sfml-demos#readme)。安装同样需要满足 [原生构建要求](../docs/getting-started.zh-CN.md#requirements)。

## SFML 官方示例

[official/](official/README.zh-CN.md) 包含从 SFML 官方仓库迁移的 24 个示例，覆盖乒乓球、shader、文字、地形、音频、网络、X11、OpenGL 窗口、SFML／OpenGL 混合渲染、Vulkan、Cocoa 和 Win32 集成。各入口保留上游场景与资源；操作方式、Node 适配、来源和许可证见目录说明。仅 `android` 尚未迁移。

```sh
node examples/official/tennis/Tennis.cjs
```

Vulkan 面向 x64 的 Linux／X11 和 Windows，使用 `nvk` 0.8.0，需要 Vulkan 加载器及支持 4 倍各向异性过滤的驱动与设备。SFML 负责窗口、事件和 surface，nvk 直接调用 Vulkan，无自定义原生桥接；SFML Graphics 仍使用 OpenGL。SFML 在编译期不支持 macOS Vulkan 集成，仅安装 MoltenVK 无法启用。Linux／X11 和 Windows 的原生绘制及交互验证均已通过。操作与要求见 [平台集成说明](official/README.zh-CN.md#platform)。

```sh
cd examples/official
npm ci --prefix vulkan --ignore-scripts
node vulkan/Vulkan.cjs
```

## 旧版示例

[ported/](ported/README.zh-CN.md) 保留原有 16 个脚本：14 个使用当前 API 运行，2 个依赖旧异步绘制接口并报告不支持。

```sh
npm run demo:ported
```

all-types-scene.cjs 与 bitmap-label.cjs 是演示辅助文件，不是独立应用入口。
