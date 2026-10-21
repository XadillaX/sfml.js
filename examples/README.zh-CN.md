# 示例

[English](README.md) · **简体中文** · [日本語](README.ja.md) · [한국어](README.ko.md)

> 本仓库示例在仓库根目录运行。首次启动前执行 `npm ci`，修改源码后执行 `npm run build`。图形示例需要支持 OpenGL 窗口的图形会话。独立项目按各自说明安装。

## 从这里开始

- <a id="breakout"></a>[Breakout：包含碰撞、生命、计分与暂停功能的完整打砖块游戏。](projects/README.zh-CN.md#breakout)

- [Shader：五种官方 shader 场景，通过键盘和鼠标调整效果。](official/README.zh-CN.md#shader)

- <a id="16-games"></a>[16 个游戏：从俄罗斯方块到小行星的完整 ClojureScript 图文画廊。](projects/README.zh-CN.md#16-games)

## 按主题浏览

- <a id="screenshots"></a>[功能示例](features/README.zh-CN.md)：按 System、Window、Graphics、Audio、Network 分组的 15 个入口。

- [官方示例](official/README.zh-CN.md)：24 个 SFML 移植示例，附操作方式、平台要求和上游来源。

- <a id="game-projects"></a>[游戏与应用](projects/README.zh-CN.md)：[Süper Mario Kart](projects/README.zh-CN.md#super-mario-kart)、[play-nes](projects/README.zh-CN.md#play-nes)、Breakout、5 个 JavaScript 游戏和 16 个 ClojureScript 游戏。

## 运行准备

```sh
node examples/breakout.cjs
node examples/official/shader/Shader.cjs
node examples/network.cjs
```

[项目首页](../README.zh-CN.md) · [快速开始](../docs/getting-started.zh-CN.md) · [开发指南](../docs/development.zh-CN.md)
